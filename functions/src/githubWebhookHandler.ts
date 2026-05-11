import { createHmac, timingSafeEqual } from 'node:crypto';
import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import { getApps, initializeApp, type App } from 'firebase-admin/app';
import { FieldValue, getFirestore, type Firestore } from 'firebase-admin/firestore';
import { onRequest, type HttpsFunction } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
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

interface WorkflowRunPayload {
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
  pull_requests?: Array<{ number: number }>;
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
      const run = payload.workflow_run as WorkflowRunPayload | undefined;
      if (!run) return [];
      const prNumber = run.pull_requests?.[0]?.number ?? null;
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
            pullRequestNumber: prNumber,
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

/**
 * Resolve the tenant's optional `deploy.bucketBaseUrl` override from its
 * `docs.json`. Dormant plumbing — Firebase Hosting tenants (the default)
 * leave the field unset and their preview URLs arrive via the
 * `recordPreview` callback the deploy workflow POSTs. This function only
 * fires the fallback path for tenants whose CI publishes to a static-host
 * sub-path that the workflow can't easily echo back.
 *
 * Uses the App-installation token (already minted for `mintGithubToken`)
 * to GET the file via Octokit. Returns `null` when the field is unset,
 * the file is missing, or the request fails — the caller treats null as
 * "no preview URL from this path".
 *
 * Cached per-repo at module scope with a short TTL. Cloud Function
 * containers are reused across invocations, so consecutive workflow_run
 * events for the same PR usually hit the cache (workflow_run fires 3+
 * times per CI run: queued / in_progress / completed). The TTL is short
 * enough that a tenant flipping the field propagates within minutes.
 */
const docsConfigCache = new Map<string, { bucketBaseUrl: string | null; fetchedAt: number }>();
const DOCS_CONFIG_TTL_MS = 5 * 60 * 1000;

interface ResolveBucketBaseUrlArgs {
  appId: string;
  privateKey: string;
  installationId: number;
  owner: string;
  repo: string;
  ref?: string;
}

async function resolveBucketBaseUrl(args: ResolveBucketBaseUrlArgs): Promise<string | null> {
  const cacheKey = `${args.owner}/${args.repo}`;
  const cached = docsConfigCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < DOCS_CONFIG_TTL_MS) {
    return cached.bucketBaseUrl;
  }

  try {
    const auth = createAppAuth({ appId: args.appId, privateKey: args.privateKey });
    const installationAuth = await auth({
      type: 'installation',
      installationId: args.installationId,
    });
    const octokit = new Octokit({ auth: installationAuth.token });
    const response = await octokit.repos.getContent({
      owner: args.owner,
      repo: args.repo,
      path: 'docs.json',
      ...(args.ref ? { ref: args.ref } : {}),
    });

    const data = response.data as { content?: string; encoding?: string; type?: string };
    if (data.type !== 'file' || typeof data.content !== 'string') {
      docsConfigCache.set(cacheKey, { bucketBaseUrl: null, fetchedAt: Date.now() });
      return null;
    }

    const decoded = Buffer.from(data.content, (data.encoding ?? 'base64') as BufferEncoding).toString('utf8');
    const docs = JSON.parse(decoded) as { deploy?: { bucketBaseUrl?: string } };
    const raw = docs.deploy?.bucketBaseUrl;
    const bucketBaseUrl = typeof raw === 'string' && raw.length > 0 ? raw.replace(/\/+$/, '') : null;
    docsConfigCache.set(cacheKey, { bucketBaseUrl, fetchedAt: Date.now() });
    return bucketBaseUrl;
  } catch (err) {
    // Cache the miss too so a tenant without docs.json doesn't cause an
    // Octokit call on every webhook event. The miss expires with the same
    // TTL so an added file picks up within minutes.
    docsConfigCache.set(cacheKey, { bucketBaseUrl: null, fetchedAt: Date.now() });
    logger.warn('resolveBucketBaseUrl failed', {
      repo: cacheKey,
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export interface WebhookHandlerOptions {
  secret: SecretParam;
  databaseId?: string;
  /**
   * GitHub App credentials for resolving tenant `docs.json` on PR-triggered
   * `workflow_run` events. Optional — when omitted, `previewUrl` computation
   * is skipped and the build doc still lands without a preview link (which
   * the dashboard renders as a disabled Preview button). Reuses the same
   * App identity as `mintGithubToken` so no new App permissions are needed.
   */
  githubApp?: {
    appId: SecretParam;
    privateKey: SecretParam;
  };
  /**
   * VPC connector to route the function's egress through. Set on the
   * Enterprise prod wrapper so outbound calls to GitHub Enterprise leave
   * via the allowlisted static IP (Cloud NAT behind `nebula-connector`).
   * Dev wrapper omits this — dev talks to public github.com which has no
   * IP allowlist, and routing dev egress through the NAT would just burn
   * the static-IP budget for no benefit.
   */
  vpcConnector?: string;
  /** Egress mode for the VPC connector. Defaults to ALL_TRAFFIC when vpcConnector is set. */
  vpcConnectorEgressSettings?: 'ALL_TRAFFIC' | 'PRIVATE_RANGES_ONLY';
}

export function makeWebhookHandler(options: WebhookHandlerOptions): HttpsFunction {
  const { secret, databaseId, githubApp, vpcConnector, vpcConnectorEgressSettings } = options;
  const secrets = [secret, ...(githubApp ? [githubApp.appId, githubApp.privateKey] : [])];
  return onRequest({
    secrets,
    ...(vpcConnector
      ? {
          vpcConnector,
          vpcConnectorEgressSettings: vpcConnectorEgressSettings ?? 'ALL_TRAFFIC',
        }
      : {}),
  }, async (request, response) => {
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

    // For PR-triggered workflow_run events, look up the tenant's
    // bucketBaseUrl from docs.json and stamp `previewUrl` onto the builds
    // doc. Done here (not in buildWrites) so the lookup is async and
    // doesn't fan out into every event type.
    if (eventName === 'workflow_run' && githubApp && writes.length > 0) {
      const run = payload.workflow_run as WorkflowRunPayload | undefined;
      const base = payload as BaseEvent;
      const prNumber = run?.pull_requests?.[0]?.number;
      const installationId = base.installation?.id;
      const repo = base.repository;
      if (run && prNumber && installationId && repo) {
        const appId = githubApp.appId.value();
        const privateKey = githubApp.privateKey.value().replace(/\\n/g, '\n');
        if (appId && privateKey) {
          const bucketBaseUrl = await resolveBucketBaseUrl({
            appId,
            privateKey,
            installationId,
            owner: repo.owner.login,
            repo: repo.name,
            ref: run.head_sha,
          });
          if (bucketBaseUrl) {
            for (const w of writes) {
              if (w.collection === 'builds') {
                w.data.previewUrl = `${bucketBaseUrl}/previews/${prNumber}/`;
              }
            }
          }
        }
      }
    }

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
