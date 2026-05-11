import { z } from 'zod';

/**
 * docs.json `deploy` block. Reserved for tenant-specific deploy overrides
 * read by the Cloud Functions webhook handler when building preview URLs.
 *
 * Today the only field is `bucketBaseUrl`, kept as a generic static-host
 * override (see field-level doc). Firebase Hosting tenants — the default
 * path — leave the block off entirely; the webhook handler then derives
 * the preview URL from the `recordPreview` callback that the deploy
 * workflow POSTs after `firebase hosting:channel:deploy`.
 */
export const deployConfigSchema = z.object({
  /**
   * Optional static-host base URL override, without trailing slash. When
   * set, the webhook handler reads it via Octokit (5-minute per-repo
   * cache) and computes `previewUrl = ${bucketBaseUrl}/previews/<PR#>/`
   * for `workflow_run` events carrying a non-empty `pull_requests[]`.
   *
   * This is dormant plumbing — Firebase Hosting tenants don't need it,
   * since their preview URLs arrive via the `recordPreview` callback.
   * The field stays in the schema so tenant configs that set it don't
   * fail validation; new tenants should leave it unset.
   */
  bucketBaseUrl: z.string().url().optional(),
});

export type DeployConfig = z.infer<typeof deployConfigSchema>;
