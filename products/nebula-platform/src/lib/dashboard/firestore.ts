import { getDb } from '@nebula-docs/firebase';
import {
  collection,
  onSnapshot,
  query,
  where,
  type Timestamp,
} from 'firebase/firestore';

const BUILDS_COLLECTION = 'builds';

/**
 * Live mirror of the `builds/{run_id}` doc shape the webhook handler writes.
 * Source of truth: `functions/src/githubWebhookHandler.ts` (workflow_run case).
 *
 * Only the fields the dashboard cares about are typed here — the doc holds
 * more (`installationId`, `actor.avatarUrl`, …); they're left untyped so a
 * webhook-side schema bump can land without crashing the client.
 */
export interface BuildDoc {
  runId: number;
  workflowName: string;
  branch: string;
  headSha: string;
  /** queued | in_progress | completed | … (GitHub workflow_run.status). */
  status: string;
  /** success | failure | cancelled | timed_out | skipped | null (GitHub workflow_run.conclusion). */
  conclusion: string | null;
  htmlUrl: string;
  startedAt: Timestamp | null;
  completedAt: Timestamp | null;
  receivedAt: Timestamp | null;
  pullRequestNumber: number | null;
  /** Set when the workflow's deploy step has reported back via the
   *  recordPreview Cloud Function (Firebase Hosting path) OR when the
   *  webhook resolved it from `docs.json` `deploy.bucketBaseUrl` (OOSS path).
   *  Absent until the deploy step runs. */
  previewUrl: string | null;
  repoFullName: string;
}

function buildFromSnapshot(id: string, data: Record<string, unknown>): BuildDoc | null {
  const repo = data.repo as { fullName?: unknown } | null | undefined;
  const fullName = repo?.fullName;
  if (typeof fullName !== 'string') return null;

  const runIdRaw = data.runId;
  const runId = typeof runIdRaw === 'number' ? runIdRaw : Number(id);
  if (!Number.isFinite(runId)) return null;

  return {
    runId,
    workflowName: typeof data.workflowName === 'string' ? data.workflowName : '',
    branch: typeof data.branch === 'string' ? data.branch : '',
    headSha: typeof data.headSha === 'string' ? data.headSha : '',
    status: typeof data.status === 'string' ? data.status : 'queued',
    conclusion: typeof data.conclusion === 'string' ? data.conclusion : null,
    htmlUrl: typeof data.htmlUrl === 'string' ? data.htmlUrl : '',
    startedAt: (data.startedAt as Timestamp | null | undefined) ?? null,
    completedAt: (data.completedAt as Timestamp | null | undefined) ?? null,
    receivedAt: (data.receivedAt as Timestamp | null | undefined) ?? null,
    pullRequestNumber:
      typeof data.pullRequestNumber === 'number' ? data.pullRequestNumber : null,
    previewUrl: typeof data.previewUrl === 'string' ? data.previewUrl : null,
    repoFullName: fullName,
  };
}

/**
 * Subscribe to the `builds` collection scoped to a single repo. The query
 * filters server-side via the auto-built single-field index on
 * `repo.fullName`; ordering happens client-side so we don't need a
 * composite index per orderable field (see the same pattern in
 * `lib/assets/firestore.ts`).
 *
 * The callback fires on every doc change — adds, updates (status
 * transitions queued → in_progress → completed), and deletes (rare).
 */
export function subscribeBuilds(
  args: { repoFullName: string },
  onChange: (builds: BuildDoc[]) => void,
  onError: (err: Error) => void,
): () => void {
  const q = query(
    collection(getDb(), BUILDS_COLLECTION),
    where('repo.fullName', '==', args.repoFullName),
  );
  return onSnapshot(
    q,
    (snap) => {
      const out: BuildDoc[] = [];
      for (const docSnap of snap.docs) {
        const b = buildFromSnapshot(docSnap.id, docSnap.data());
        if (b) out.push(b);
      }
      onChange(out);
    },
    onError,
  );
}
