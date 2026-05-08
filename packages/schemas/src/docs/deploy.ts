import { z } from 'zod';

/**
 * docs.json `deploy` block. Used by the Cloud Functions webhook handler to
 * construct preview URLs for PR-triggered builds: the function reads this
 * field via Octokit when a `workflow_run` payload includes a non-empty
 * `pull_requests[]`, then writes `${bucketBaseUrl}/previews/<PR#>/` onto
 * the `builds/{run_id}` Firestore doc the dashboard subscribes to.
 *
 * The tenant repo is the source of truth (vs. a function-side config map
 * or a callback from the workflow) because:
 *  - Reuses the same install token the function already mints — no new
 *    auth path, no new Cloud Function endpoint, no CI Firestore creds.
 *  - Bucket URL changes follow the tenant's PR review process, which is
 *    where every other docs-config change lives.
 *  - Idempotent + cacheable per-repo at the function level.
 *
 * Tenants that opt out of preview builds simply omit the field; the
 * webhook handler then leaves `previewUrl` unset on the build doc and the
 * Preview button in the dashboard renders disabled.
 */
export const deployConfigSchema = z.object({
  /**
   * Public base URL of the tenant's OOSS bucket, without trailing slash.
   * Examples:
   *   `https://docs.uhc.uhg.com`
   *   `https://oss.uhg.com/mcoe-docs`
   * The CLI's `--base /previews/<PR#>/` flag generates a sub-tree under
   * this URL via the deploy workflow's bucket sub-path upload step.
   */
  bucketBaseUrl: z.string().url().optional(),
});

export type DeployConfig = z.infer<typeof deployConfigSchema>;
