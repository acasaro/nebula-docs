# Extracting `tenants/mcoe-docs/` to its own repo

This is a one-time migration. Reverses the previous "MCOE stays in monorepo"
decision (see [status.md](status.md) and the reasoning in
[nebula-cli.md](nebula-cli.md)). Driver: the only way to exercise the real
GH-App → webhook → Firestore → dashboard loop end-to-end is for the tenant
content to live in a repo the dev App is installed on. The framework repo
isn't that repo.

After extraction:

- Framework lives in this monorepo (`packages/*`, `products/nebula-platform/`,
  `functions/`, the synthetic `tenants/nebula-docs-starter*/` fixtures).
- MCOE docs live in their own public repo on github.com/<your-org>, the one
  the dev GitHub App is installed on.
- Tenant repo consumes the unpublished CLI via a `file:` dep (laptop-only)
  or `npm pack` tarball (CI-friendly).

## Steps

### 1. Create the new repo

```bash
gh repo create <your-org>/mcoe-docs \
  --public \
  --description "MCOE Docs — built with Nebula Docs CLI" \
  --clone
cd mcoe-docs
```

Pick the org / visibility that matches where your dev GH App is installed.

### 2. Copy the content

From this monorepo's root:

```bash
TARGET=/path/to/your/new/mcoe-docs
rsync -av \
  --exclude=dist/ \
  --exclude=node_modules/ \
  tenants/mcoe-docs/ "$TARGET/"
```

Verify the copy:

```bash
cd "$TARGET"
ls -la                       # docs.json, theme.json, content/, assets/, components/
git add -A && git status     # everything green / no leftovers
```

### 3. Add a `package.json` that consumes the CLI

The tenant repo isn't a workspace member, so it pulls `@nebula-docs/cli` in
explicitly. For laptop dev, use a `file:` dep pointing at this monorepo.
For CI, switch to a `npm pack` tarball or (eventually) the published
JFrog version.

```jsonc
// $TARGET/package.json
{
  "name": "mcoe-docs",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev":      "nebula dev .",
    "build":    "nebula build .",
    "preview":  "nebula preview .",
    "validate": "nebula validate ."
  },
  "devDependencies": {
    "@nebula-docs/cli": "file:../mcoe-docs/packages/cli"
  }
}
```

Adjust the `file:` path to wherever this monorepo sits relative to the new
tenant repo. (The dependency resolves transitively to the workspace deps —
`@nebula-docs/components`, `theme`, `mdx`, `schemas` — through the
monorepo's `node_modules`.)

```bash
cd "$TARGET"
npm install     # use npm, not pnpm — pnpm complains about the file: link
                # back into a workspace; npm just resolves it.
npx nebula dev .   # smoke test
```

If `nebula dev` boots and renders the MCOE content, the link works.

### 4. Add `deploy.bucketBaseUrl` to `docs.json` (skip if going Firebase-only)

If you're using the OOSS-style "fixed host + sub-path" deploy model, set
the public base URL of your bucket so the webhook can compute previewUrl:

```jsonc
{
  // ...
  "deploy": {
    "bucketBaseUrl": "https://docs.mcoe.example.com"
  }
}
```

If you're going with Firebase Hosting Preview Channels (recommended per
[status.md](status.md)), **skip this** — the recordPreview callback path
populates previewUrl directly, no docs.json lookup needed.

### 5. Add the deploy workflow

Copy from this monorepo's tenant template:

```bash
cp -R packages/cli/template/.github/workflows "$TARGET/.github/workflows"
```

Edit each file to replace `REPLACE_ME_BUCKET_NAME` with your actual bucket
name (or rip out the OOSS steps and substitute the Firebase Hosting steps —
see the recordPreview-flavored templates if/when those land in the
template/ dir).

### 6. Install the dev GitHub App on the new repo

In the dev GH App's settings (the one the Platform connects to via
`mintGithubTokenDev`), add the new mcoe-docs repo to its installations.
The webhook is already deployed — events from this repo will flow into
`nebula-docs-plat-dev` Firestore as soon as the install lands.

### 7. Push and watch the loop work

```bash
cd "$TARGET"
git add -A
git commit -m "Initial commit: MCOE docs, extracted from nebula monorepo"
git push -u origin main
```

Open the Platform, switch to DEV env (the dev GH App), pick the new
mcoe-docs install. The dashboard should load Activity from real commits,
and once you push a PR, you'll see Previews populate from the webhook
build docs in real time.

### 8. Remove `tenants/mcoe-docs/` from the monorepo

Only after step 7 confirms the new repo works end-to-end:

```bash
# from the monorepo root
git rm -r tenants/mcoe-docs/
git commit -m "Remove tenants/mcoe-docs/ — extracted to own repo"
```

Update the memory entry [project_mcoe_monorepo_resident.md](../../.claude/projects/-Users-anthonyasaro-Desktop-mcoe-docs/memory/project_mcoe_monorepo_resident.md)
to reflect the reversal (covered in the parallel memory-update task).

## What stays in the monorepo

- Framework: `packages/{cli,components,schemas,theme,mdx,firebase}`,
  `products/nebula-platform/`, `functions/`.
- Synthetic dev fixtures: `tenants/nebula-docs-starter/` and
  `tenants/nebula-docs-starter-empty/` — these aren't tenants, they're
  the renderer's dev/test inputs and the `nebula init` template seeds.

## What this unblocks

- Real PR-triggered workflow runs in the tenant repo → real
  `workflow_run` events → real `builds/{run_id}` docs → real
  `previewUrl` overlay on the dashboard's Previews tab.
- Editor → Commit & PR flow tested against an actual repo, not a
  synthetic local-mode fixture.
- Versioned CLI consumption — when this monorepo bumps the CLI, the
  tenant repo decides when to pick up the bump.

## Known rough edges (file as separate tasks if they bite)

- **`pnpm install` in the tenant repo** complains about the `file:`
  link back into a workspace. Use `npm install` in the tenant repo;
  use `pnpm` here in the framework monorepo.
- **CI in the tenant repo** can't use `file:` — it'll need either a
  `npm pack` tarball checked in, or the CLI published to a registry
  (private JFrog, or eventually npmjs.org).
- **Type drift between framework and tenant** if the tenant pins an
  older `file:` snapshot. For laptop dev, this won't bite (the file:
  link is live). It will bite once you move to tarball / registry.
