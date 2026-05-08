import { timingSafeEqual } from 'node:crypto';
import { getApps, initializeApp, type App } from 'firebase-admin/app';
import { FieldValue, getFirestore, type Firestore } from 'firebase-admin/firestore';
import { onRequest, type HttpsFunction } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import type { defineSecret } from 'firebase-functions/params';
import { z } from 'zod';

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

/**
 * Body schema. The workflow knows the workflow_run id (`github.run_id` in
 * actions context) and the preview URL (from the deploy action's outputs);
 * everything else is optional metadata the function ignores. Keeping it
 * permissive lets the workflow YAML evolve without coordinated function
 * deploys.
 */
const requestSchema = z.object({
  runId: z.number().int().positive(),
  previewUrl: z.string().url(),
  prNumber: z.number().int().positive().optional(),
  repoFullName: z.string().optional(),
});

function authValid(secret: string, header: string | undefined): boolean {
  if (!header) return false;
  const match = /^Bearer\s+(.+)$/.exec(header.trim());
  const provided = match?.[1];
  if (!provided || provided.length !== secret.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided, 'utf8'), Buffer.from(secret, 'utf8'));
  } catch {
    return false;
  }
}

export interface RecordPreviewOptions {
  secret: SecretParam;
  databaseId?: string;
}

/**
 * HTTP endpoint a tenant's deploy workflow POSTs to with the preview URL it
 * just produced. Firebase Hosting Preview Channels (and any other
 * deploy-target whose URL isn't derivable from a config formula) populate
 * `builds/{run_id}.previewUrl` via this callback rather than via the
 * webhook handler's docs.json lookup.
 *
 * Auth: a shared secret in `Authorization: Bearer <secret>`. The secret
 * lives in Firebase secret manager and is exposed to the workflow as a
 * GitHub Actions secret (`NEBULA_RECORD_PREVIEW_SECRET`). Constant-time
 * compare — same pattern the webhook signature check uses.
 *
 * Effect: merges `{ previewUrl, previewRecordedAt: serverTimestamp }` into
 * `builds/{runId}`. The doc is normally created first by the webhook
 * (workflow_run "queued" event) and progressively updated as the run
 * progresses; recordPreview just adds the URL once the deploy step
 * finishes. If the doc doesn't exist yet (e.g., webhook is delayed or
 * misconfigured), the merge creates it — the dashboard will see it once
 * the webhook catches up and fills the rest of the fields.
 */
export function makeRecordPreviewHandler(options: RecordPreviewOptions): HttpsFunction {
  const { secret, databaseId } = options;
  return onRequest({ secrets: [secret] }, async (request, response) => {
    if (request.method !== 'POST') {
      response.status(405).send('Method Not Allowed');
      return;
    }
    const secretValue = secret.value();
    if (!secretValue) {
      response.status(500).send('Record-preview secret not configured.');
      return;
    }
    if (!authValid(secretValue, request.get('Authorization'))) {
      response.status(401).send('Invalid auth.');
      return;
    }
    const parsed = requestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: parsed.error.message });
      return;
    }
    const { runId, previewUrl } = parsed.data;
    try {
      await db(databaseId)
        .collection('builds')
        .doc(String(runId))
        .set(
          {
            previewUrl,
            previewRecordedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      response.status(204).send();
    } catch (err) {
      logger.error('recordPreview write failed', {
        runId,
        message: err instanceof Error ? err.message : String(err),
      });
      response.status(500).send('Write failed.');
    }
  });
}
