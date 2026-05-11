# CLI publish handoff (work machine)

What to do on the work machine to land the first JFrog publish of `@nebula-docs/cli` + workspace deps. The personal machine did all the scaffolding; this is the final mile that needs corporate network access.

## Context

Personal-side scaffolding (already committed + pushed to `acasaro/nebula-docs`):

- Five workspace deps made publishable — [packages/schemas](../packages/schemas), [packages/theme](../packages/theme), [packages/mdx](../packages/mdx), [packages/components](../packages/components), [packages/analytics](../packages/analytics). Each has `tsconfig.build.json`, `build` + `prepare` scripts, `dist/`-pointed `main`/`types`/`exports`, `files: ["dist", "README.md"]`, `version: 0.0.1`, `private: false`, and a `publishConfig.registry: "<JFROG_NPM_LOCAL_URL>"` placeholder.
- [packages/cli](../packages/cli) made publishable — `version: 0.0.1`, `private: false`, `files` includes `bin/`, `src/`, `schemas/`, `astro.config.mjs`, `README.md`. CLI keeps source-tree exports (Astro project, no bundling).
- [scripts/release.mjs](../scripts/release.mjs) — bumps all six versions in lockstep and rewrites `workspace:*` → literal version. Modes: bare (local: commits + tags), `--ci` (writes files only), `--dry` (prints intentions).
- [.github/workflows/publish-cli.yml](../.github/workflows/publish-cli.yml) — manual `workflow_dispatch` publish on `uhg-runner`, JFrog auth via `uhg-pipelines/epl-jf/configure-saas-connection@v4`, publishes the six packages in dependency-DAG order.
- [tenants/nebula-docs-starter/package.json](../tenants/nebula-docs-starter/package.json) — reference shape for external tenants (uses `workspace:*` in-monorepo; an external tenant pins a literal version).
- [packages/cli/template/.github/workflows/deploy.yml](../packages/cli/template/.github/workflows/deploy.yml) — dropped the Checkout framework + Install framework deps steps; tenant CI is now just `pnpm install` + `pnpm nebula build`.

Constraints to remember:

- **JFrog is the ONLY publish target.** No public npm fallback ever. See [.claude/decisions.md](decisions.md) and the project-slugs memory.
- **No third-party GitHub Actions.** Only `actions/*` (GitHub-official) and `uhg-pipelines/*` (corporate).
- **Manual triggers only.** Deploy/publish workflows are `workflow_dispatch` per stated user preference.

## Step-by-step

### 1. Sync the personal work onto the enterprise repo

On the work machine, inside the enterprise repo clone of `uhc-tech/nebula-docs-platform`:

```bash
git checkout main
git pull origin main
git remote add personal https://github.com/acasaro/nebula-docs.git
git fetch personal main
git read-tree --reset -u personal/main

git status                                    # scan for unexpected deletions
git diff --cached --stat                      # file-by-file summary

git commit -m "CLI packaging: scaffold publish workflow + workspace dep build setup"
git push origin main

git remote remove personal
```

Full runbook + alternatives in [sync-from-personal.md](sync-from-personal.md).

### 2. Fill in the JFrog placeholders

`<JFROG_NPM_LOCAL_URL>` is in seven spots in the synced tree:

- [.github/workflows/publish-cli.yml](../.github/workflows/publish-cli.yml) — env var `JFROG_NPM_LOCAL` near the top (the URL is constructed from it twice in the workflow).
- Each of: [packages/schemas/package.json](../packages/schemas/package.json), [packages/theme/package.json](../packages/theme/package.json), [packages/mdx/package.json](../packages/mdx/package.json), [packages/components/package.json](../packages/components/package.json), [packages/analytics/package.json](../packages/analytics/package.json), [packages/cli/package.json](../packages/cli/package.json) — `publishConfig.registry`.

Confirm the writable local repo name with the JFrog admin (likely `glb-npm-local` per the JFrog naming pattern, mirroring the read-only `glb-npm-vir`). The full URL is `https://centraluhg.jfrog.io/artifactory/api/npm/<NAME>/`.

Quick sweep:

```bash
grep -rn '<JFROG_NPM_LOCAL' .github/workflows/ packages/
```

The workflow has a step `Resolve publishConfig.registry placeholders` that rewrites the per-package `publishConfig.registry` at CI time using the `JFROG_NPM_LOCAL` env var — so you only strictly need to fix the workflow's env value. But it's cleaner to also fix the per-package values so a developer running `pnpm publish` locally hits the right registry.

### 3. Set the required GitHub secrets on `uhc-tech/nebula-docs-platform`

- **`RELEASE_PUSH_TOKEN`** — PAT or GitHub App credential with `contents: write` so the publish workflow can push the version-bump commit + `v<version>` tag back to `main`. Without this, the workflow's `Commit + tag` step fails after a successful publish.
- **`FIREBASE_SERVICE_ACCOUNT_MCOE_D`** — already exists for [.github/workflows/deploy-platform.yml](../.github/workflows/deploy-platform.yml) and [.github/workflows/deploy-functions.yml](../.github/workflows/deploy-functions.yml). Reused only if a publish workflow ever needs Firebase (currently none). Skip unless that changes.

Confirm the JFrog SaaS token written by `uhg-pipelines/epl-jf/configure-saas-connection@v4` has **write** scope on the local repo. If not, add a separate `NPM_PUBLISH_TOKEN` secret and patch the `Fix pnpm auth` step in [publish-cli.yml](../.github/workflows/publish-cli.yml) to use it for the local-repo auth line.

### 4. Dry-run publish

GitHub UI → Actions → **Publish Nebula Docs CLI** → Run workflow:

- `version`: `0.0.1`
- `dry-run`: ✅ checked

The workflow:

1. Bumps versions via `scripts/release.mjs 0.0.1 --ci`.
2. Refreshes `pnpm-lock.yaml`.
3. Resolves `<JFROG_NPM_LOCAL>` in each `publishConfig.registry`.
4. Builds the five workspace deps (`tsc` + theme CSS).
5. Runs `pnpm pack` on each of the six packages in DAG order.
6. Uploads the tarballs as an artifact named `tarballs`.

Download the artifact, then locally:

```bash
unzip tarballs.zip -d /tmp/jfrog-dryrun
for f in /tmp/jfrog-dryrun/*.tgz; do
  echo "=== $f ==="
  tar tzf "$f" | head -30
done
```

Expected layouts:

- `nebula-docs-schemas-0.0.1.tgz` — only `package/dist/{*.js,*.d.ts}` + `package/package.json`.
- `nebula-docs-theme-0.0.1.tgz` — same plus `package/dist/tokens.css` + `package/dist/brand-palette.css`.
- `nebula-docs-mdx-0.0.1.tgz` — same as schemas, no JSX.
- `nebula-docs-components-0.0.1.tgz` — dist with per-component subdirs (accordion/, badge/, callout/, …).
- `nebula-docs-analytics-0.0.1.tgz` — dist with both `index.js` and `firebase/index.js`.
- `nebula-docs-cli-0.0.1.tgz` — `package/bin/`, `package/src/`, `package/schemas/`, `package/astro.config.mjs`, `package/package.json`. **No `dist/`**, **no `node_modules`**.

If any tarball is missing files or has stray files, fix locally on the work machine and re-run dry-run before going live.

### 5. Real publish

Same workflow, `dry-run`: ❌ unchecked, `version`: `0.0.1`. After the workflow completes:

```bash
# Each verifies via the JFrog read endpoint (already in your ~/.npmrc from the
# tenant deploy workflows or a manual `pnpm login`).
for pkg in schemas theme mdx components analytics cli; do
  pnpm view @nebula-docs/$pkg versions
done
```

Confirm `v0.0.1` lands on each. Confirm the git tag `v0.0.1` is on `main`.

### 6. Update the external `mcoe-docs-tenant` repo

Inside the tenant repo clone:

1. Edit `package.json` — add `devDependencies: { "@nebula-docs/cli": "0.0.1" }` and the scripts block (`dev`/`build`/`preview`/`validate` all calling `nebula`). Use [tenants/nebula-docs-starter/package.json](../tenants/nebula-docs-starter/package.json) as the reference.
2. Edit `.github/workflows/deploy.yml` — drop the "Checkout framework" step and the "Install framework deps" step; replace "Build tenant docs" with `pnpm install --frozen-lockfile` + `pnpm nebula build` in the tenant root (no `working-directory`). Use [packages/cli/template/.github/workflows/deploy.yml](../packages/cli/template/.github/workflows/deploy.yml) as the reference shape.
3. Run `pnpm install` locally inside the tenant repo. pnpm resolves `@nebula-docs/cli@0.0.1` from JFrog.
4. Run `pnpm nebula build` locally. The tenant builds entirely from installed packages — no framework source needed.
5. Push the branch. Watch the CI run on `uhg-runner`. Time the new run vs. the previous run from before the publish — log the speedup for the post-mortem.
6. Smoke-test the deployed preview channel URL.

### 7. Cut `0.1.0`

Once step 6 is green end-to-end:

1. Trigger the publish workflow again — `version`: `0.1.0`, `dry-run`: ❌.
2. Bump the tenant's `@nebula-docs/cli` dep pin from `0.0.1` → `0.1.0` and push.
3. Tag the moment internally as "first stable CLI" — that's when `nebula init` template work, `nebula upgrade`, and other deferred follow-ups become unblocked.

## Files added/changed on the personal side

For the cold reader: skim these to understand what landed.

- [.github/workflows/publish-cli.yml](../.github/workflows/publish-cli.yml) — the publish workflow
- [scripts/release.mjs](../scripts/release.mjs) — version bump + workspace dep rewriting
- [packages/{schemas,theme,mdx,components,analytics,cli}/package.json](../packages/) — all six made publishable
- [packages/{schemas,theme,mdx,components,analytics}/tsconfig.build.json](../packages/) — emit-mode tsconfigs
- [packages/cli/bin/nebula.mjs](../packages/cli/bin/nebula.mjs) — header comment rewrite for the dual-invocation model
- [packages/cli/template/.github/workflows/deploy.yml](../packages/cli/template/.github/workflows/deploy.yml) — dropped framework-checkout steps
- [tenants/nebula-docs-starter/package.json](../tenants/nebula-docs-starter/package.json) — minimal reference shape

## Things that are out of scope for this handoff

- `nebula init` template implementation — deferred to v0.1.x.
- `nebula upgrade` command — deferred.
- `@nebula-docs/firebase` publication — stays `private: true`; revisit if analytics' `./firebase` subpath migrates off the public `firebase` SDK.
- Auto-publish on push — workflow stays `workflow_dispatch` only.
- Public npm registry — never; JFrog only.
