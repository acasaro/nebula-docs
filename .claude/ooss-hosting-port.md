# Port the preview/notification flow to OOSS hosting

Hand-off document. The Firebase Hosting implementation is shipped + working.
This doc tells a fresh Claude how to add a parallel **OOSS** (UHG Object Open
Source Service, S3-compatible bucket behind UHG firewall) hosting target with
identical end-to-end behavior: per-branch previews, immediate notification on
branch create, preview URL on the dashboard, automatic channel cleanup on
branch delete.

## Scope

**In scope (tenant side, repo-local):**

- `.github/workflows/deploy.yml` — branch-keyed bucket sub-paths, recordPreview
  callback.
- `.github/workflows/cleanup-preview.yml` — delete bucket sub-tree on branch
  delete.
- `docs.json` `deploy.bucketBaseUrl` value verification.

**In scope (framework side, very small):**

- Confirm the webhook handler's `resolveBucketBaseUrl` path still works as a
  fallback. (No code change expected.)
- Make sure no Firebase-specific assumption leaked into shared code.

**Out of scope — DO NOT touch:**

- `products/nebula-platform/src/lib/notifications/index.tsx` — hosting-agnostic.
  It already projects `builds/{run_id}.previewUrl` regardless of where the URL
  came from.
- `BranchPicker`, `NotificationCenter`, `PreviewButton`, `PublishMenu`,
  `RepoBrowser` flow — all unchanged.
- `useDashboardData.ts` derives the prod domain from the preview URL pattern;
  the regex assumes Firebase Hosting (`<site>--branch-<id>-<hash>.web.app`)
  and needs a parallel regex for OOSS — flagged below in
  [Side fixes](#side-fixes-while-youre-here).
- `functions/src/recordPreviewHandler.ts` + the GitHub App webhook itself —
  no shape change, just verify it's deployed.
- The `enableAutoMerge` flow, the polling loop, the stale-build guard, the
  cancelled-run filter, the dismiss escape hatch — all hosting-agnostic.

**Non-goals:**

- Don't relitigate the Firebase vs OOSS decision. Locked in
  [.claude/nebula-cli.md](nebula-cli.md) decision #5: Firebase is the default;
  OOSS is opt-in for tenants behind UHG firewall. This port adds OOSS as
  another supported target, not a replacement.
- Don't redesign the schema. `docs.json.deploy.bucketBaseUrl` already exists
  in `packages/schemas/src/docs/deploy.ts`.

## Read these first

1. [.claude/architecture.md](architecture.md) — 10000-ft view.
2. [.claude/status.md](status.md) — search for "OOSS path" and "Preview
   before merge" sections. The architecture is documented; this doc
   implements the gaps.
3. [.claude/nebula-cli.md](nebula-cli.md) decision #5 — the Firebase reversal
   that left OOSS as the secondary path.
4. `packages/cli/template/.github/workflows-ooss/{deploy,cleanup-preview}.yml`
   — the **existing** OOSS template. **It is out of date** vs. what we just
   shipped for Firebase. This doc tells you how to bring it forward.
5. `/Users/anthonyasaro/Desktop/mcoe-docs-tenant/.github/workflows/{deploy,
   cleanup-preview}.yml` (if you have a parallel tenant repo) — the Firebase
   versions, working in production. **Mirror these, replacing the Firebase
   deploy steps with OOSS uploads.**

## End-to-end picture (what you're building)

```
Editor (Platform SPA)
  │
  │ user clicks "Create branch"
  ▼
GitHub API: POST /git/refs
  │
  │ branch ref appears → fires BOTH `create` AND `push` events
  ▼
GitHub Actions: deploy.yml (× 2 runs; concurrency cancels one)
  │
  │ surviving run:  pnpm nebula build  →  aws s3 sync  →  curl recordPreview
  ▼
recordPreview Cloud Function
  │
  │ writes { previewUrl, branch, runId } to Firestore /builds/{runId}
  ▼
Platform SPA's onSnapshot subscription
  │
  │ matches by branch, projects to in-progress build notification
  ▼
Bell-icon notification dropdown shows "Preview ready for <branch>"
Preview button in toolbar links to the OOSS preview URL
```

When the user publishes → enable-auto-merge → PR merges → branch is deleted →
GitHub fires `delete` event → cleanup-preview.yml deletes the bucket sub-tree.

Identical to Firebase except the third row (`aws s3 sync` instead of
`firebase hosting:channel:deploy`) and the cleanup step
(`aws s3 rm --recursive` instead of `firebase hosting:channel:delete`).

## Discovery questions — answer these before writing code

Ask the user (or grep around to confirm) BEFORE making changes. Don't assume.

1. **What is the tenant's OOSS bucket name + public URL?**
   - Bucket name (e.g. `mcoe-dev-docs`) → goes in `OOSS_BUCKET_NAME` env on
     the workflow.
   - Public read URL (e.g. `https://docs.uhc.uhg.com` or
     `https://oss.uhg.com/mcoe-docs`) → goes in `docs.json` as
     `deploy.bucketBaseUrl`, **without trailing slash**.
2. **Is the bucket configured to serve directory indexes?** I.e., does
   `https://bucket/foo/` return `https://bucket/foo/index.html`?
   - Astro's static output uses directory-per-page (`/page/index.html`). If
     the bucket doesn't serve index.html on dir requests, every link 404s.
   - If unsupported, you'll need a CDN rewrite or build with
     `--no-trailing-slash`.
3. **Which runner can talk to OOSS?**
   - Existing template uses `runs-on: uhg-runner` — UHG self-hosted, has
     OOSS network access.
   - GitHub-hosted runners (`ubuntu-latest`) can't reach OOSS from outside
     UHG's firewall. **Don't try.** If the tenant repo is on GitHub Enterprise
     Cloud, `uhg-runner` should be available; verify.
4. **What's the auth mechanism on the runner?**
   - Template uses `uhg-pipelines/immerse-actions/vaults/get-secrets@v2`
     pulling `OOSS_AWS_ACCESS_KEY_ID` + `OOSS_AWS_SECRET_ACCESS_KEY` from
     the secret vault. **Don't change this unless the user says it stopped
     working** — it's UHG's blessed path.
   - Alternative: OIDC federation to IAM role. Only if `get-secrets@v2` is
     deprecated.
5. **Does the `ooss-deploy@v1.1.2` composite action support a destination
   prefix (sub-path)?** Last we checked, no — root deploys only. That's why
   the existing PR-template uses `aws s3 sync` directly for sub-paths. Same
   approach here.
6. **Is the framework npm-published yet?** The Firebase workflow checks out
   `acasaro/nebula-docs` as a sister repo since `@nebula-docs/cli` isn't on
   the JFrog mirror yet. If the user has since published the CLI to JFrog,
   you can drop the second checkout and just `pnpm install` + `pnpm nebula
   build`. Check by grepping `acasaro/nebula-docs` in the existing tenant
   workflow.
7. **Is the recordPreview Cloud Function deployed to this tenant's GitHub
   App webhook?** The function (`recordPreview` for prod, `recordPreviewDev`
   for dev) is what receives the POST from the workflow. Should already be
   deployed — verify via `firebase functions:list` on `mcoe-d`.

## Migration plan

### Phase 1: Tenant `deploy.yml`

**Source of truth to copy from:** the working Firebase version at
`/Users/anthonyasaro/Desktop/mcoe-docs-tenant/.github/workflows/deploy.yml`
(or whatever your tenant's path is on the work machine).

**What stays:**

- The two triggers: `push: branches: ['**']` AND `create:`. **Both are
  required.** A new branch fires both; we use the push for branches that
  get pushed to, the create for branches that exist as bare refs. The
  concurrency block cancels duplicates.
- The concurrency: `group: deploy-${{ github.ref }}`, `cancel-in-progress:
  true`. **Required.** Without it, you get racy double-deploys.
- The `if` guard skipping tag creations: `if: ${{ github.event_name !=
  'create' || github.event.ref_type == 'branch' }}`.
- The branch sanitization step (lowercase, non-alphanum → `-`, max 56 chars,
  prefixed `branch-`). Same logic for OOSS — the sub-path becomes
  `previews/branch-<sanitized>/`.
- The `Notify recordPreview` step — same shape, just with a different
  `PREVIEW_URL` value.
- The framework-checkout step (until `@nebula-docs/cli` is on JFrog) +
  `pnpm nebula build` invocation.

**What changes:**

| Firebase step                                | OOSS replacement                                          |
| -------------------------------------------- | --------------------------------------------------------- |
| `Setup Node.js` (node-version: '22')         | Same. Use `.nvmrc`.                                       |
| `Install Firebase CLI`                       | **Delete.**                                               |
| `Deploy live (main)` (FirebaseExtended)      | `ooss-deploy@v1.1.2` to bucket root.                      |
| `Deploy preview channel` (FirebaseExtended)  | `aws s3 sync ./dist s3://<bucket>/previews/branch-<…>/ --delete`. |
| `details_url` output from FirebaseExtended   | Compute `${bucketBaseUrl}/previews/branch-<sanitized>/` yourself. |

**Concrete sketch:**

```yaml
name: Deploy docs

on:
  workflow_dispatch:
  push:
    branches: ['**']
  create:

permissions:
  id-token: write
  contents: read

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build-deploy:
    if: ${{ github.event_name != 'create' || github.event.ref_type == 'branch' }}
    runs-on: uhg-runner
    env:
      OOSS_BUCKET_NAME: REPLACE_ME_BUCKET_NAME
      BUCKET_BASE_URL: REPLACE_ME_PUBLIC_URL  # e.g. https://docs.uhc.uhg.com
      PNPM_VERSION: 10.33.0

    steps:
      - name: Checkout tenant
        uses: actions/checkout@v4

      # Drop this block ONCE @nebula-docs/cli is published to the JFrog mirror.
      - name: Checkout framework
        uses: actions/checkout@v4
        with:
          repository: acasaro/nebula-docs   # or wherever the framework lives
          path: nebula-docs
          ref: main

      - name: Configure JFrog SaaS Connection
        uses: uhg-pipelines/epl-jf/configure-saas-connection@v4
        with:
          jfrog-url: https://centraluhg.jfrog.io
          jfrog-edge-url: https://centraluhg.jfrog.io
          jfrog-project-key: glb
          npm-setup: true

      - name: Fix pnpm auth for JFrog virtual repos
        run: |
          TOKEN=$(grep 'glb-npm-vir/:_authToken=' ~/.npmrc | sed 's/.*_authToken=//')
          echo "//centraluhg.jfrog.io/:_authToken=${TOKEN}" >> ~/.npmrc

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'
          cache-dependency-path: 'nebula-docs/pnpm-lock.yaml'

      - name: Install framework deps
        run: pnpm install --frozen-lockfile
        working-directory: nebula-docs

      # Compute target: live (main) vs preview (everything else).
      # Sub-path mirrors Firebase's channel-id sanitization exactly so the
      # cleanup workflow can derive the same value from `github.event.ref`.
      - name: Compute deploy target
        id: target
        run: |
          REF_NAME="${{ github.ref_name }}"
          if [ "$REF_NAME" = "main" ]; then
            echo "is-live=true" >> "$GITHUB_OUTPUT"
            echo "bucket-path=" >> "$GITHUB_OUTPUT"
            echo "preview-url=" >> "$GITHUB_OUTPUT"
          else
            SANITIZED=$(echo "$REF_NAME" \
              | tr '[:upper:]' '[:lower:]' \
              | sed -E 's/[^a-z0-9-]/-/g; s/-+/-/g; s/^-+//; s/-+$//' \
              | cut -c -56)
            echo "is-live=false" >> "$GITHUB_OUTPUT"
            echo "bucket-path=previews/branch-${SANITIZED}" >> "$GITHUB_OUTPUT"
            echo "preview-url=${{ env.BUCKET_BASE_URL }}/previews/branch-${SANITIZED}/" >> "$GITHUB_OUTPUT"
          fi

      - name: Build tenant docs
        env:
          BASE: ${{ steps.target.outputs.is-live == 'true' && '' || format('/{0}', steps.target.outputs.bucket-path) }}
        run: |
          if [ -n "$BASE" ]; then
            pnpm --filter @nebula-docs/cli build "$GITHUB_WORKSPACE" --base "$BASE"
          else
            pnpm --filter @nebula-docs/cli build "$GITHUB_WORKSPACE"
          fi
        working-directory: nebula-docs

      - name: Get OOSS Credentials
        uses: uhg-pipelines/immerse-actions/vaults/get-secrets@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          required-secrets: '["OOSS_AWS_ACCESS_KEY_ID", "OOSS_AWS_SECRET_ACCESS_KEY"]'
          environment: dev

      - name: Deploy to OOSS root (main only)
        if: steps.target.outputs.is-live == 'true'
        uses: uhg-pipelines/cd-workflows/actions/ooss-deploy@v1.1.2
        with:
          OOSS_AWS_ACCESS_KEY_ID: ${{ env.OOSS_AWS_ACCESS_KEY_ID }}
          OOSS_AWS_SECRET_ACCESS_KEY: ${{ env.OOSS_AWS_SECRET_ACCESS_KEY }}
          build-directory: dist
          ooss-custom-bucket-name: ${{ env.OOSS_BUCKET_NAME }}
          enable-sync-delete: true

      - name: Deploy preview to OOSS sub-path
        if: steps.target.outputs.is-live != 'true'
        env:
          AWS_ACCESS_KEY_ID: ${{ env.OOSS_AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ env.OOSS_AWS_SECRET_ACCESS_KEY }}
          BUCKET_PATH: ${{ steps.target.outputs.bucket-path }}
        run: |
          aws s3 sync ./dist "s3://${OOSS_BUCKET_NAME}/${BUCKET_PATH}/" \
            --delete \
            --no-progress

      # Tell recordPreview the URL of the just-deployed channel so the
      # dashboard's Preview button can link to it. Skipped on live (main).
      - name: Notify recordPreview
        if: steps.target.outputs.is-live != 'true'
        env:
          PREVIEW_URL: ${{ steps.target.outputs.preview-url }}
          RUN_ID: ${{ github.run_id }}
          REPO_FULL_NAME: ${{ github.repository }}
          BRANCH: ${{ github.ref_name }}
          ENDPOINT: ${{ vars.NEBULA_RECORD_PREVIEW_URL }}
          SECRET: ${{ secrets.NEBULA_RECORD_PREVIEW_SECRET }}
        run: |
          curl --fail-with-body --silent --show-error \
            -X POST "$ENDPOINT" \
            -H "Authorization: Bearer $SECRET" \
            -H "Content-Type: application/json" \
            -d "$(jq -n \
                  --argjson runId "$RUN_ID" \
                  --arg previewUrl "$PREVIEW_URL" \
                  --arg repoFullName "$REPO_FULL_NAME" \
                  --arg branch "$BRANCH" \
                  '{runId: $runId, previewUrl: $previewUrl, repoFullName: $repoFullName, branch: $branch}')"
```

**Things to verify locally before pushing:**

- `nebula build --base /previews/branch-foo` produces a `dist/` whose HTML
  references `/previews/branch-foo/...` URLs (not bare `/...`). If links
  break in the preview but work on live, this is why.
- The bucket allows `s3:DeleteObject` for the role the runner uses (the
  `--delete` flag in `aws s3 sync`).

### Phase 2: Tenant `cleanup-preview.yml`

Source of truth: Firebase version at
`/Users/anthonyasaro/Desktop/mcoe-docs-tenant/.github/workflows/cleanup-preview.yml`.

**What changes vs. the existing OOSS template `cleanup-preview.yml`:**

The existing OOSS template triggers on `pull_request: types: [closed]` —
that's PR-driven. **Switch to `delete:` event** to match Firebase. Rationale:
the platform's flow auto-merges PRs which auto-deletes the head branch.
Listening on `delete:` is one fewer integration assumption (works whether
the branch was deleted via merge, manual UI delete, or `git push --delete`).

**Critical detail learned the hard way:** the `delete` event has no
checkoutable ref (the branch is gone). You **must** explicitly checkout
`main` before running anything that touches the workspace, or the implicit
checkout fails silently. The Firebase version learned this; carry it
forward.

**Concrete sketch:**

```yaml
name: Cleanup preview

on:
  delete:
  workflow_dispatch:
    inputs:
      branch:
        description: "Branch name to clean up the preview for (manual run)"
        required: true

permissions:
  id-token: write
  contents: read

jobs:
  cleanup:
    # `delete` fires on tag deletes too — only act on branches.
    if: ${{ github.event_name == 'workflow_dispatch' || github.event.ref_type == 'branch' }}
    runs-on: uhg-runner
    env:
      OOSS_BUCKET_NAME: REPLACE_ME_BUCKET_NAME

    steps:
      # The deleted branch has no checkoutable ref — fall back to main so
      # any subsequent step that wants the repo present doesn't error.
      - name: Checkout tenant (main)
        uses: actions/checkout@v4
        with:
          ref: main

      - name: Compute bucket path
        id: target
        env:
          REF_NAME: ${{ github.event.inputs.branch || github.event.ref }}
        run: |
          SANITIZED=$(echo "$REF_NAME" \
            | tr '[:upper:]' '[:lower:]' \
            | sed -E 's/[^a-z0-9-]/-/g; s/-+/-/g; s/^-+//; s/-+$//' \
            | cut -c -56)
          echo "path=previews/branch-${SANITIZED}" >> "$GITHUB_OUTPUT"

      - name: Get OOSS Credentials
        uses: uhg-pipelines/immerse-actions/vaults/get-secrets@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          required-secrets: '["OOSS_AWS_ACCESS_KEY_ID", "OOSS_AWS_SECRET_ACCESS_KEY"]'
          environment: dev

      # Delete the sub-tree. `aws s3 rm --recursive` is idempotent — a
      # missing prefix is a no-op exit-0, no special-casing needed (unlike
      # `firebase hosting:channel:delete` which exits non-zero for
      # not-found). Use `set -e` + a direct exit check so genuine failures
      # (auth, permissions, throttling) surface as red runs.
      - name: Delete preview sub-tree
        env:
          AWS_ACCESS_KEY_ID: ${{ env.OOSS_AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ env.OOSS_AWS_SECRET_ACCESS_KEY }}
          BUCKET_PATH: ${{ steps.target.outputs.path }}
        run: |
          aws s3 rm "s3://${OOSS_BUCKET_NAME}/${BUCKET_PATH}/" \
            --recursive \
            --only-show-errors
```

### Phase 3: Tenant `docs.json`

Add (or verify) the `deploy.bucketBaseUrl` field:

```jsonc
{
  // ...
  "deploy": {
    "bucketBaseUrl": "https://docs.uhc.uhg.com"   // your tenant's public URL, no trailing slash
  }
}
```

**Why it's still needed even though recordPreview takes precedence:**

The webhook handler's `resolveBucketBaseUrl` path remains as a fallback for
cases where the recordPreview step didn't run (cancelled run, network blip,
secret missing). Keeps the dashboard's Preview button working in degraded
states. See
[functions/src/githubWebhookHandler.ts](../functions/src/githubWebhookHandler.ts)
`resolveBucketBaseUrl` for the exact lookup.

### Phase 4: Secrets + vars on the tenant repo

**Repo secrets** (Settings → Secrets and variables → Actions → Secrets):

| Name                              | Value                                                     |
| --------------------------------- | --------------------------------------------------------- |
| `NEBULA_RECORD_PREVIEW_SECRET`    | Shared secret matching Firebase function secret `DEV_RECORD_PREVIEW_SECRET` or `RECORD_PREVIEW_SECRET`. |

OOSS credentials (`OOSS_AWS_ACCESS_KEY_ID` / `OOSS_AWS_SECRET_ACCESS_KEY`)
come from `uhg-pipelines/immerse-actions/vaults/get-secrets@v2` — **do not
set them as repo secrets**. The action injects them as env vars in the
step's context only.

**Repo variables** (same page, Variables tab):

| Name                            | Value                                                                 |
| ------------------------------- | --------------------------------------------------------------------- |
| `NEBULA_RECORD_PREVIEW_URL`     | The Cloud Run URL of the deployed recordPreview function (e.g. `https://recordpreviewdev-6xcdic75tq-uc.a.run.app`). Get it via `firebase functions:list` on `mcoe-d`. |
| `FIREBASE_PROJECT_ID`           | `mcoe-d` (still needed because the recordPreview function lives there even though hosting is OOSS). |

### Phase 5: Framework side (verify only — likely zero changes)

The webhook handler in `functions/src/githubWebhookHandler.ts` already
supports OOSS via `resolveBucketBaseUrl` (reads `docs.json` via Octokit on
PR-triggered `workflow_run` events). Look at the existing code — should
already cover this. **If it doesn't compile or you find a regression vs.
the Firebase work, that's a real bug; fix it inline and call it out in your
commit message.**

`recordPreviewHandler.ts` is hosting-agnostic — it just receives `{runId,
previewUrl, …}` and writes to Firestore. Same for both targets. **No
change.**

### Side fixes while you're here

These are real bugs / gaps I noticed in the codebase but didn't fix because
they were out of scope for the Firebase work. If you hit them, fix them:

1. **`useDashboardData.ts` prod-domain derivation is Firebase-specific.**
   In `products/nebula-platform/src/lib/dashboard/useDashboardData.ts`,
   `siteFromPreviewHost` regex assumes Firebase's
   `<site>--branch-<id>-<hash>.web.app` shape. For OOSS, the preview URLs
   look like `https://docs.uhc.uhg.com/previews/branch-foo/` — no `--`
   separator. Add a second extractor and fall back to a tenant-configured
   prod domain. Look for the working-tree edits I left in that file at the
   end of the session — that's the half-done version, finish or rewrite.

2. **The CLI `--base` flag** needs to honor whatever path you use in the
   workflow. Verify by building locally with `pnpm --filter @nebula-docs/cli
   build /path/to/tenant --base /previews/branch-foo` and confirming
   `dist/index.html` references `/previews/branch-foo/_astro/...`. If it
   doesn't, the bug is in `packages/cli/src` not the workflow.

## Validation plan

Do this end-to-end on a clean tenant before declaring done.

1. **Workflow dry run.** Push the updated `deploy.yml` to main. The
   workflow should run on main → deploy to bucket root → `Notify
   recordPreview` step **skipped** (live, no preview URL). Check the run
   logs.
2. **New branch → preview channel.**
   - In the editor, create branch `port-test-1` from main. Click confirm.
   - Open devtools console **before** clicking confirm. You should see:
     - `[notifications] builds snapshot for <owner>/<repo> — N build(s); 1 in-progress build notification(s)`
     - Initial snapshots show the cancelled run (no meaningful conclusion),
       then `no meaningful build yet for port-test-1 — waiting.`
     - After ~90s: `projecting build for port-test-1 run=… status=completed
       conclusion=success` → notification flips green → auto-dismiss after
       3.5s.
   - Preview button in toolbar enabled, links to
     `https://<bucketBaseUrl>/previews/branch-port-test-1/`.
   - Open that URL. Page loads. Assets load. Click any internal link;
     navigation stays inside `/previews/branch-port-test-1/...`.
3. **Edit → save → preview updates.** Make any edit on the branch, Save.
   Watch the second build run; preview URL refreshes (same URL, new
   content).
4. **Publish → auto-merge → branch removed.** Click Publish → confirm.
   - Console shows `[notifications] polling 1 publish notification(s): …`
     every 10s.
   - GitHub merges the PR, deletes the branch.
   - Next poll shows `state=closed merged=true` → notification flips to
     success.
   - Branch disappears from the BranchPicker dropdown.
5. **Branch delete → bucket cleanup.** The `delete` event from step 4
   triggers `cleanup-preview.yml` → bucket sub-tree gone. Verify with
   `aws s3 ls s3://<bucket>/previews/branch-port-test-1/` — should be empty
   or `NoSuchKey`.
6. **Cancelled-run filter still works.** Look for the cancelled `push` run
   in the Actions list (paired with the succeeded `create` run for the new
   branch). The build notification should **not** have flashed failure
   during step 2 even though the cancelled run wrote a `conclusion:
   cancelled` doc. If you saw a red flash, the filter in
   `lib/notifications/index.tsx` regressed.

## Rollback

Pure tenant-side change. To revert:

```bash
cd /path/to/tenant
git revert <ooss-port-commit-sha>
git push
```

The framework side has no commits in this port (or shouldn't), so no
rollback there.

If you mid-flight discover the bucket can't serve `index.html` for
directory requests and need to back out: revert just the deploy.yml +
cleanup-preview.yml, leave `docs.json.bucketBaseUrl` (it doesn't hurt
anything when no workflow uses it).

## Common pitfalls (FAQ-style)

**"Preview button is disabled even though the workflow succeeded."**
→ Either the `Notify recordPreview` step didn't run (check workflow logs —
the `if:` condition likely evaluated false) OR the Cloud Function rejected
the request (check Cloud Functions logs for 4xx). Most common cause:
`vars.NEBULA_RECORD_PREVIEW_URL` not set, so the curl POSTs to an empty
URL silently.

**"Build notification flashes 'Build failed' on every new branch."**
→ The cancelled-runs filter regressed. Open
`products/nebula-platform/src/lib/notifications/index.tsx`, search for
`isMeaningfulConclusion`. It should exclude `cancelled` and `skipped`. If
gone, you've reverted commit 677f9aa — restore from git history.

**"Preview channel still exists 7 days after merge."**
→ Unlike Firebase, OOSS sub-paths have **no TTL**. The cleanup workflow is
the only thing that removes them. Verify `cleanup-preview.yml` is on `main`
and that its run history shows green on each branch delete. If runs are
missing entirely, the workflow file wasn't on main when the delete event
fired (GitHub only fires `delete:` against workflows present on the
default branch).

**"Two workflow runs for every branch create, one cancelled."**
→ Expected. GitHub fires both `create` and `push` for new refs. The
concurrency block cancels one; the surviving one finishes normally. The
notification system filters the cancelled doc out (see the previous FAQ
entry). Don't try to remove one of the triggers — both are
load-bearing.

**"Cleanup workflow runs successfully but the bucket sub-tree is still
there."**
→ Almost certainly a path mismatch. The cleanup workflow's `Compute bucket
path` step must produce the **exact same** sanitized string as the deploy
workflow. Diff the two `sed` invocations character-for-character. The
Firebase version had this bug once.

**"`aws s3 sync --delete` blew away the main site."**
→ The sync target was the bucket root, not the sub-path. Check the
`steps.target.outputs.is-live` conditional — the `Deploy preview` step
must have `if: steps.target.outputs.is-live != 'true'`. Without it, both
deploys run on main and the second one wipes the first.

**"Editor's notification system seems broken even on Firebase tenants."**
→ Did you touch `notifications/index.tsx`? You shouldn't have. Revert any
changes there and re-test the OOSS tenant.

## When to consider this done

- [ ] `deploy.yml` lives in tenant `main`; new-branch creation triggers it
      and the preview URL is reachable.
- [ ] `cleanup-preview.yml` lives in tenant `main`; branch deletion removes
      the bucket sub-tree.
- [ ] `docs.json` has `deploy.bucketBaseUrl` set, no trailing slash.
- [ ] Editor's Bell-icon shows green-checked "Preview ready for X" within
      ~2 minutes of new-branch create; auto-dismisses after.
- [ ] Cancelled-run filter (`isMeaningfulConclusion`) is intact in
      `lib/notifications/index.tsx`.
- [ ] Side fix #1 (Dashboard prod-domain regex) addressed for OOSS hosts,
      OR a follow-up task spawned for it.

## Reference: commit history of the Firebase work (for parity inspection)

Run `git log --oneline -20 -- products/nebula-platform/src/lib/notifications/
products/nebula-platform/src/routes/RepoBrowser.tsx
functions/src/recordPreviewHandler.ts` to see every fix that shipped while
building the Firebase path. Key ones to be aware of so you don't
reintroduce bugs:

- `677f9aa` — Ignore cancelled/skipped runs in build-notification projection.
- `15bd8d0` — Dismiss escape hatch for stuck publish notifications.
- `4d54ca4` — Remove branch from picker on publish-success; add poll logging.
- `c003375` — Stale-build guard for build notifications.
- `cc0311d` — Cleanup workflow: checkout main + surface real failures.

All five are hosting-agnostic. **Do not** revert them while porting OOSS.
