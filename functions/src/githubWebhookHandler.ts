import { createHmac, timingSafeEqual } from 'node:crypto';
import { getApps, initializeApp, type App } from 'firebase-admin/app';
import { FieldValue, getFirestore, type Firestore } from 'firebase-admin/firestore';
import { onRequest, type HttpsFunction } from 'firebase-functions/v2/https';
import type { defineSecret } from 'firebase-functions/params';

type SecretParam = ReturnType<typeof defineSecret>;

let adminApp: App | undefined;

function adminAppInstance(): App {
  if (adminApp) return adminApp;
  const existing = getApps();
  adminApp = existing.length > 0 ? existing[0]! : initializeApp();
  return adminApp;
}

function db(databaseId?: string): Firestore {
  return databaseId ? getFirestore(adminAppInstance(), databaseId) : getFirestore(adminAppInstance());
}

function verifySignature(secret: string, header: string | undefined, body: Buffer): boolean {
  if (!header?.startsWith('sha256=')) return false;
  const provided = header.slice('sha256='.length);
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

interface GhRepo {
  full_name: string;
  name: string;
  owner: { login: string };
}

interface GhSender {
  login: string;
  avatar_url: string;
}

interface BaseEvent {
  installation?: { id: number };
  repository?: GhRepo;
  sender?: GhSender;
  action?: string;
}

interface FirestoreWrite {
  collection: 'activity' | 'builds';
  docId?: string;
  merge?: boolean;
  data: Record<string, unknown>;
}

function repoOf(p: BaseEvent) {
  const r = p.repository;
  return r ? { owner: r.owner.login, name: r.name, fullName: r.full_name } : null;
}

function senderOf(p: BaseEvent) {
  const s = p.sender;
  return s ? { login: s.login, avatarUrl: s.avatar_url } : null;
}

function buildWrites(eventName: string, payload: Record<string, unknown>): FirestoreWrite[] {
  const base = payload as BaseEvent;
  const common = {
    installationId: base.installation?.id ?? null,
    repo: repoOf(base),
    actor: senderOf(base),
    receivedAt: FieldValue.serverTimestamp(),
  };

  switch (eventName) {
    case 'workflow_run': {
      const run = payload.workflow_run as
        | {
            id: number;
            name: string;
            run_number: number;
            head_branch: string;
            head_sha: string;
            status: string;
            conclusion: string | null;
            html_url: string;
            run_started_at: string;
            updated_at: string;
          }
        | undefined;
      if (!run) return [];
      return [
        {
          collection: 'builds',
          docId: String(run.id),
          merge: true,
          data: {
            ...common,
            workflowName: run.name,
            runId: run.id,
            runNumber: run.run_number,
            branch: run.head_branch,
            headSha: run.head_sha,
            status: run.status,
            conclusion: run.conclusion,
            htmlUrl: run.html_url,
            startedAt: run.run_started_at ? new Date(run.run_started_at) : null,
            completedAt: run.status === 'completed' ? new Date(run.updated_at) : null,
            updatedAt: FieldValue.serverTimestamp(),
          },
        },
      ];
    }
    case 'pull_request': {
      const pr = payload.pull_request as
        | {
            title: string;
            state: string;
            merged: boolean;
            html_url: string;
            head: { ref: string };
            base: { ref: string };
          }
        | undefined;
      const number = payload.number as number | undefined;
      if (!pr || number === undefined) return [];
      return [
        {
          collection: 'activity',
          data: {
            ...common,
            event: 'pull_request',
            action: base.action ?? null,
            summary: `PR #${number}: ${pr.title} (${base.action})`,
            htmlUrl: pr.html_url,
            pullRequest: {
              number,
              title: pr.title,
              state: pr.state,
              merged: pr.merged,
              branch: pr.head.ref,
              baseBranch: pr.base.ref,
            },
          },
        },
      ];
    }
    case 'push': {
      const ref = payload.ref as string | undefined;
      const branch = ref?.startsWith('refs/heads/') ? ref.slice('refs/heads/'.length) : (ref ?? null);
      const commits = (payload.commits as Array<{ id: string; message: string }> | undefined) ?? [];
      const last = commits[commits.length - 1];
      return [
        {
          collection: 'activity',
          data: {
            ...common,
            event: 'push',
            action: null,
            summary: `Push to ${branch}: ${commits.length} commit${commits.length === 1 ? '' : 's'}${last ? ` — ${last.message.split('\n')[0]}` : ''}`,
            branch,
            commits: commits.slice(-10).map((c) => ({ sha: c.id, message: c.message })),
          },
        },
      ];
    }
    case 'installation':
    case 'installation_repositories': {
      return [
        {
          collection: 'activity',
          data: {
            ...common,
            event: eventName,
            action: base.action ?? null,
            summary: `${eventName} ${base.action ?? ''}`.trim(),
          },
        },
      ];
    }
    default: {
      return [
        {
          collection: 'activity',
          data: {
            ...common,
            event: eventName,
            action: base.action ?? null,
            summary: base.action ? `${eventName}:${base.action}` : eventName,
          },
        },
      ];
    }
  }
}

export interface WebhookHandlerOptions {
  secret: SecretParam;
  databaseId?: string;
}

export function makeWebhookHandler(options: WebhookHandlerOptions): HttpsFunction {
  const { secret, databaseId } = options;
  return onRequest({ secrets: [secret] }, async (request, response) => {
    if (request.method !== 'POST') {
      response.status(405).send('Method Not Allowed');
      return;
    }

    const secretValue = secret.value();
    if (!secretValue) {
      response.status(500).send('Webhook secret not configured.');
      return;
    }

    const rawBody = (request as unknown as { rawBody: Buffer }).rawBody;
    if (!verifySignature(secretValue, request.get('X-Hub-Signature-256'), rawBody)) {
      response.status(401).send('Invalid signature.');
      return;
    }

    const eventName = request.get('X-GitHub-Event') ?? 'unknown';
    const deliveryId = request.get('X-GitHub-Delivery') ?? null;
    const payload = (request.body ?? {}) as Record<string, unknown>;

    const writes = buildWrites(eventName, payload);
    const target = db(databaseId);
    await Promise.all(
      writes.map((w) => {
        const data = { ...w.data, deliveryId };
        if (w.docId) {
          return target.collection(w.collection).doc(w.docId).set(data, { merge: w.merge ?? false });
        }
        return target.collection(w.collection).add(data);
      }),
    );

    response.status(204).send();
  });
}
