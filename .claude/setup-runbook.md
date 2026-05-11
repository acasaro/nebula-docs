# Bootstrap a fresh deployment

The non-code config we wedged together over several sessions, written down so
you (or a future Claude) can reproduce it without re-deriving every step.

This is the runbook for the parts that DON'T live in the repo — Firebase
project, GitHub App, secrets, repo variables, hosting sites, OAuth client
IDs. The code is already in source; the wiring isn't.

## Two paths

| Scenario                                          | Path | Time   |
| ------------------------------------------------- | ---- | ------ |
| New tenant on an existing Nebula deployment       | A    | 20 min |
| Brand-new Nebula deployment from zero             | B    | 2 hrs  |

Path A is the common case. Path B is the rare-but-eventually-real case
(new Firebase project, new org, new GitHub App). Path B ends by running
Path A for the first tenant.

## Prerequisites

- macOS / Linux shell
- Node ≥22, pnpm 10.33+
- `firebase` CLI logged in: `firebase login`
- `gh` CLI logged in to GitHub Enterprise Cloud: `gh auth login`
- Edit access to:
  - The Firebase project (`mcoe-d` today) — Owner or Editor.
  - The GitHub org hosting the App.
  - The tenant repo you're onboarding.

## Decisions to lock in upfront

Before clicking anything, write these down:

| Field                       | Example                  | Notes                                                     |
| --------------------------- | ------------------------ | --------------------------------------------------------- |
| Firebase project ID         | `mcoe-d`                 | Lowercase, hyphenated. Hard to change later.              |
| Tenant repo slug            | `uhg-internal/mcoe-docs-tenant` | `<org>/<repo>` on GitHub.                                |
| Firebase Hosting site name  | `mcoe-docs`              | One per tenant. **Distinct** from project ID. Determines the public URL `<site>.web.app`. |
| Hosting target alias        | `docs`                   | Local alias in `.firebaserc`; lets `firebase.json` ref it by name. |
| GitHub App name (prod)      | `nebula-docs-platform`   | Shown on PRs as the committing identity.                  |
| GitHub App name (dev)       | `nebula-docs-platform-dev` | Parallel app for laptop iteration.                      |
| `NEBULA_ENV`                | `dev` or `prod`          | Switch the platform SPA points at.                        |

---

# Path A — Add a new tenant to an existing deployment

Assumes: Firebase project, GitHub App, Cloud Functions all exist and work
(if not, do Path B first). You're standing up a new tenant content repo.

## 1. Create the tenant repo

```bash
gh repo create <org>/<tenant-repo-name> --private
cd /path/to/work
gh repo clone <org>/<tenant-repo-name>
cd <tenant-repo-name>
```

Initialize content. Either run `nebula init` (once the CLI is on the
JFrog mirror) or copy the contents of
`tenants/nebula-docs-starter/` from the framework repo. Keep:

- `content/`
- `docs.json` (update `name` + `colors` + any tenant-specific fields)
- `theme.json` (optional override)
- `snippets/` (optional)
- `public/` (logo + favicon)

Drop: anything in `node_modules/`, anything in `dist/`. The tenant
`package.json` should be minimal — no `devDependencies`, just `name`,
`version`, `private: true`, and a doc comment explaining where builds
run from.

```bash
git add . && git commit -m "Initial tenant content" && git push -u origin main
```

## 2. Install the GitHub App on the tenant repo

Two App installs exist: the prod App and the dev App. Install **both** if
you intend to onboard the tenant for both environments; otherwise just
the one matching where the editor will run.

1. Visit `https://github.com/apps/<app-name>` (the install URL —
   captured in the platform's `.env` as `NEBULA_APP_INSTALL_URL_PROD` /
   `NEBULA_APP_INSTALL_URL_DEV`).
2. Click **Configure** → **Install** → select the tenant repo.
3. Note the **installation ID** from the install URL after redirect
   (`/installations/<id>`). You'll need it when seeding the platform
   to point at this tenant — but the platform discovers it automatically
   via `getInstallation` once the user signs in, so you usually don't
   need to copy it down.

## 3. Provision the Firebase Hosting site

Hosting **sites** are per-tenant within a single Firebase **project**. One
project, N sites.

```bash
firebase hosting:sites:create <site-name> --project <project-id>
# e.g.
firebase hosting:sites:create mcoe-docs --project mcoe-d
```

Public URL becomes `https://<site-name>.web.app` (and `<site-name>.firebaseapp.com`).

## 4. Set up Firebase Hosting GitHub integration

From the tenant repo's local clone:

```bash
firebase init hosting:github --project <project-id>
```

This flow:

- Asks "Set up the workflow to run a build script before every deploy?" → **No**. We have our own workflow.
- Asks "Set up automatic deployment to your live channel for every new commit on a specific branch?" → **No** for the same reason. (If you say yes, it generates `firebase-hosting-merge.yml`; you'll delete it.)
- Generates a deploy service account, downloads its JSON key.
- Adds the SA JSON as a repo secret named **`FIREBASE_SERVICE_ACCOUNT_<UPPERCASE_PROJECT_ID>`**. For project `mcoe-d` the secret name is `FIREBASE_SERVICE_ACCOUNT_MCOE_D`. **The naming is fixed by firebase-tools — don't try to rename it.**

It may **still** auto-generate `.github/workflows/firebase-hosting-pull-request.yml` and `firebase-hosting-merge.yml`. **Delete both.** They run on every PR/push and fail because they don't know about our channel-per-branch + recordPreview flow.

```bash
rm -f .github/workflows/firebase-hosting-pull-request.yml .github/workflows/firebase-hosting-merge.yml
```

## 5. Drop in our workflows

Copy `packages/cli/template/.github/workflows/deploy.yml` and
`packages/cli/template/.github/workflows/cleanup-preview.yml` from the
framework repo into the tenant's `.github/workflows/`. Resolve the
placeholders in `deploy.yml`:

| Placeholder                   | Value                                         |
| ----------------------------- | --------------------------------------------- |
| `REPLACE_ME_FRAMEWORK_REPO`   | `uhg-internal/nebula-docs` (until the CLI is on JFrog) |
| `REPLACE_ME_SITE_NAME`        | Firebase hosting site name from step 3, e.g. `mcoe-docs` |

The secret name in the workflows (`FIREBASE_SERVICE_ACCOUNT_MCOE_D`) must
match what `firebase init hosting:github` actually wrote. Sanity check:

```bash
gh secret list -R <org>/<tenant-repo-name>
```

If the name is different, edit the workflow files to match. Don't try to
rename the secret — easier to update the workflow.

## 6. Repo secrets + variables on the tenant

From step 4, `FIREBASE_SERVICE_ACCOUNT_MCOE_D` is already set. Add the
rest:

```bash
# Secrets
gh secret set NEBULA_RECORD_PREVIEW_SECRET -R <org>/<tenant-repo-name>
# (paste the same string you set as the Firebase function secret
# DEV_RECORD_PREVIEW_SECRET or RECORD_PREVIEW_SECRET — see Path B
# step 7 if you don't know the value)

# Variables
gh variable set FIREBASE_PROJECT_ID -R <org>/<tenant-repo-name> --body mcoe-d
gh variable set NEBULA_RECORD_PREVIEW_URL -R <org>/<tenant-repo-name> \
  --body "https://recordpreviewdev-<HASH>-uc.a.run.app"
```

To find the recordPreview function URL:

```bash
firebase functions:list --project <project-id> | grep -i recordpreview
```

Each Cloud Function exposes a Cloud Run URL of the form
`https://<name-lowercased>-<hash>-uc.a.run.app`. Use `recordpreviewdev` for
dev, `recordpreview` for prod.

## 7. Tenant Firebase config files

Add `firebase.json`:

```json
{
  "hosting": [
    {
      "target": "docs",
      "public": "dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "cleanUrls": true,
      "trailingSlash": true
    }
  ]
}
```

Add `.firebaserc`:

```json
{
  "projects": { "default": "mcoe-d" },
  "targets": {
    "mcoe-d": {
      "hosting": {
        "docs": ["mcoe-docs"]
      }
    }
  }
}
```

`docs` is the alias the workflow uses (`target: docs` in the
`FirebaseExtended/action-hosting-deploy` step). `mcoe-docs` is the actual
Firebase Hosting site name from step 3.

## 8. First push → first deploy

```bash
git add .github firebase.json .firebaserc
git commit -m "Wire up Firebase Hosting + Nebula preview workflows"
git push
```

Watch the Action: `gh run watch -R <org>/<tenant-repo-name>`.

- `push` event on `main` → live deploy. Skip the `Notify recordPreview`
  step (live deploys don't write preview URLs).
- After ~2 min: `https://<site-name>.web.app` should load.

## 9. End-to-end smoke test

Open the platform SPA, sign in, select the tenant. You should be able to:

1. Create a branch → notification appears → ~90 s later flips to
   "Preview ready" → Preview button opens the channel URL.
2. Edit a file → save → preview updates at the same channel URL.
3. Publish → auto-merge → branch deletes → cleanup workflow fires →
   channel deletes.

If anything misbehaves, see [Common gotchas](#common-gotchas).

---

# Path B — Brand-new Nebula Docs deployment from zero

You're starting with no Firebase project, no GitHub App, no functions
deployed. End state: an existing deployment that Path A can attach
tenants to.

## 1. Create the Firebase project

```bash
firebase projects:create <project-id> --display-name "<display name>"
```

Or via the Firebase Console UI. Project IDs are global and immutable.

Enable the products you need:

```bash
gcloud config set project <project-id>
gcloud services enable \
  identitytoolkit.googleapis.com \
  firestore.googleapis.com \
  cloudfunctions.googleapis.com \
  firebasehosting.googleapis.com \
  secretmanager.googleapis.com
```

(Or click them on in the Firebase Console — Auth, Firestore, Functions,
Hosting.)

## 2. Firestore: two databases

The platform uses a multi-database pattern:

- `(default)` — prod data.
- `nebula-docs-plat-dev` — dev data, isolated.

```bash
firebase firestore:databases:create nebula-docs-plat-dev \
  --project <project-id> \
  --location nam5
```

Plus the implicit `(default)` database. Region `nam5` matches the
functions region; mismatched regions cost latency and money.

## 3. Authentication providers

In Firebase Console → Authentication → Sign-in method, enable:

- **GitHub** — needed for the editor's "Sign in with GitHub" flow. You'll
  fill in `Client ID` + `Client secret` from a separate **OAuth App**
  (NOT the GitHub App from step 4 — confusingly different).
  - Create the OAuth App at `https://github.com/settings/developers` →
    OAuth Apps → New OAuth App.
  - Authorization callback URL: `https://<project-id>.firebaseapp.com/__/auth/handler`
  - Note Client ID + Secret → paste into Firebase Auth provider config.

Optionally enable Google for second-factor or fallback identity.

## 4. Create the GitHub App (the platform's commit identity)

This is **the** central piece — the platform's identity on GitHub. It's
distinct from the OAuth App in step 3 (which only handles user login).

**You'll do this twice** — once for prod, once for dev. Same shape, just
parallel apps so dev work doesn't touch prod commits.

At `https://github.com/organizations/<org>/settings/apps` (or your user
settings for personal-org accounts):

- **GitHub App name**: `<your-app-name>` (and `<your-app-name>-dev`).
- **Homepage URL**: your platform SPA URL.
- **Callback URL**: leave blank for now (we don't use OAuth web flow on
  the App — only installation tokens).
- **Webhook URL**: temporarily anything (e.g. `https://example.com`).
  You'll update it after the function is deployed in step 6.
- **Webhook secret**: generate a random 32+ char string. Save it.
- **Repository permissions**:
  - Contents: Read & Write
  - Pull requests: Read & Write
  - Metadata: Read
  - Workflows: Read & Write
  - Webhooks: Read
- **Subscribe to events**:
  - `push`
  - `pull_request`
  - `workflow_run`
  - `create`
  - `delete`
  - `installation`
  - `installation_repositories`
- **Where can this GitHub App be installed?**: "Only on this account"
  (UHG) or "Any account" depending on rollout.

After creating:

- **App ID**: shown at the top of the General page. Numeric.
- **Generate a private key** → downloads a `.pem` file. **Keep it safe.**
  This is what mints installation tokens.

Repeat for the dev variant.

## 5. Deploy Cloud Functions (without secrets yet — they'll fail to start, that's fine)

```bash
cd functions
pnpm install
pnpm --filter @nebula-docs/functions deploy:prod
pnpm --filter @nebula-docs/functions deploy:dev
```

**Do not** run `pnpm deploy` (no `:prod`/`:dev` suffix) — that runs all
environments at once and risks overwriting production with local dev
code. The split scripts are deliberate.

This produces six function names:

| Name (prod)         | Name (dev)              | Purpose                              |
| ------------------- | ----------------------- | ------------------------------------ |
| `mintGithubToken`   | `mintGithubTokenDev`    | Callable. Mints installation tokens. |
| `getInstallation`   | `getInstallationDev`    | Callable. Resolves installation ID by repo. |
| `githubWebhook`     | `githubWebhookDev`      | HTTP. Receives GitHub webhook events. |
| `recordPreview`     | `recordPreviewDev`      | HTTP. Receives preview URL from CI.  |
| `getAnalyticsSummary` | `getAnalyticsSummaryDev` | Callable. GA4 summary.            |

## 6. Wire the webhook URL back into the GitHub App

```bash
firebase functions:list --project <project-id> | grep -iE "githubwebhook|recordpreview"
```

Copy the Cloud Run URL for `githubWebhook` (prod) or `githubWebhookDev`
(dev). Go back to the GitHub App config → Webhook URL → paste it.

Repeat for the dev App pointing at `githubWebhookDev`.

## 7. Set the Firebase function secrets

**Always use `--data-file`. Never interactive paste** — the PEM keys break
interactive paste because of line continuations.

Save each value to a temp file, then:

```bash
# Prod
firebase functions:secrets:set GITHUB_APP_ID            --data-file=/tmp/app-id-prod.txt          --project <project-id>
firebase functions:secrets:set GITHUB_APP_PRIVATE_KEY   --data-file=/tmp/app-pem-prod.pem         --project <project-id>
firebase functions:secrets:set GITHUB_WEBHOOK_SECRET    --data-file=/tmp/webhook-secret-prod.txt  --project <project-id>
firebase functions:secrets:set RECORD_PREVIEW_SECRET    --data-file=/tmp/record-preview-prod.txt  --project <project-id>

# Dev
firebase functions:secrets:set DEV_APP_ID                --data-file=/tmp/app-id-dev.txt            --project <project-id>
firebase functions:secrets:set DEV_APP_PRIVATE_KEY       --data-file=/tmp/app-pem-dev.pem           --project <project-id>
firebase functions:secrets:set DEV_WEBHOOK_SECRET        --data-file=/tmp/webhook-secret-dev.txt    --project <project-id>
firebase functions:secrets:set DEV_RECORD_PREVIEW_SECRET --data-file=/tmp/record-preview-dev.txt    --project <project-id>
```

Source of truth for these names: `functions/src/**/*.ts` `defineSecret(...)`
calls. Authoritative list:

| Secret name                  | Used by                                       |
| ---------------------------- | --------------------------------------------- |
| `GITHUB_APP_ID`              | `mintGithubToken`, `getInstallation`, `githubWebhook` |
| `GITHUB_APP_PRIVATE_KEY`     | Same.                                         |
| `GITHUB_WEBHOOK_SECRET`      | `githubWebhook`. HMAC validator.              |
| `RECORD_PREVIEW_SECRET`      | `recordPreview`. Bearer auth.                 |
| `DEV_APP_ID`                 | `mintGithubTokenDev`, `getInstallationDev`, `githubWebhookDev` |
| `DEV_APP_PRIVATE_KEY`        | Same.                                         |
| `DEV_WEBHOOK_SECRET`         | `githubWebhookDev`.                           |
| `DEV_RECORD_PREVIEW_SECRET`  | `recordPreviewDev`.                           |
| `GA4_SERVICE_ACCOUNT_JSON`   | `getAnalyticsSummaryDev` only (optional).     |

**Then redeploy the functions** so they pick up the secrets:

```bash
pnpm --filter @nebula-docs/functions deploy:prod
pnpm --filter @nebula-docs/functions deploy:dev
```

Without redeploy after secret-set, functions keep using stale secret
values until they cold-start.

After deploy, delete the temp files holding the PEMs:

```bash
shred -u /tmp/app-pem-prod.pem /tmp/app-pem-dev.pem 2>/dev/null || rm -f /tmp/app-pem-*.pem
```

## 8. Configure the platform SPA `.env`

In the root of the framework monorepo, create `.env` (gitignored):

```dotenv
# Active environment switch. Picks GH App pair, Firestore DB, function names.
NEBULA_ENV=dev

# Backend target — `firebase` for callable functions, `emulator` for local emulator.
NEBULA_BACKEND=firebase

# Optional: local tenant path so the editor can target a non-installed repo.
# NEBULA_LOCAL_TENANT=/Users/you/Desktop/mcoe-docs-tenant

# Install URLs surfaced in the editor when a user has no installation yet.
NEBULA_APP_INSTALL_URL_PROD=https://github.com/apps/<prod-app-slug>
NEBULA_APP_INSTALL_URL_DEV=https://github.com/apps/<dev-app-slug>

# Firestore DB IDs paired with NEBULA_ENV. Prod uses the default DB
# (empty string convention), dev uses the named DB.
FIRESTORE_DB_ID_PROD=
FIRESTORE_DB_ID_DEV=nebula-docs-plat-dev

# Firebase web config — from Firebase Console → Project Settings → Web app.
FIREBASE_API_KEY=AIza...
FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
FIREBASE_PROJECT_ID=<project-id>
FIREBASE_STORAGE_BUCKET=<project-id>.appspot.com
FIREBASE_MESSAGE_SENDER_ID=...
FIREBASE_APP_ID=1:...:web:...
FIREBASE_MEASUREMENT_ID=G-... # optional, only if Analytics enabled
```

Where to find the FIREBASE_* values: Firebase Console → Project Settings →
General → Your apps → Web app config object. If no web app exists yet,
**Add app** → Web → name it.

**No `.env.example`.** Use only the gitignored `.env`.

## 9. Path A — onboard the first tenant

Now run Path A for the first tenant. The platform should let the user
sign in, install the App on the tenant repo, and edit.

---

# Validation checklist

Done means all of these pass on a fresh setup:

- [ ] Sign in to the platform SPA with a GitHub account that has access
      to the tenant repo. User lands in the dashboard.
- [ ] Dashboard shows the tenant in the repo picker.
- [ ] Opening the editor on the tenant shows file tree + main branch.
- [ ] Creating a new branch shows "Building preview for X" notification
      in the bell-icon dropdown.
- [ ] ~2 min later: "Preview ready for X" with a working Preview button.
- [ ] Editing + saving on the branch updates the same preview URL.
- [ ] Publish → auto-merge → branch removed from picker → green
      "Published PR #N" notification.
- [ ] Cleanup workflow runs on the `delete` event; preview channel gone.
- [ ] Cancelled-run noise from the simultaneous `create`+`push` triggers
      does NOT flash a red failure notification.

---

# Common gotchas

The bugs we hit on the way through, with the fix or workaround. Hit any
of these in a fresh setup, jump straight to the right section.

## "Webhook signature validation failed (401)"

Mismatch between the GitHub App's webhook secret and the Firebase
function secret `GITHUB_WEBHOOK_SECRET` / `DEV_WEBHOOK_SECRET`. Re-set
both to the same value. Use `--data-file` for the function secret. After
re-setting, redeploy the function or it keeps using the cached value.

## "PR opened but auto-merge didn't enable"

GraphQL variable name conflict. The variable name `method` is reserved
by `@octokit/graphql` (shadows the HTTP method option). The fix is in
`products/nebula-platform/src/lib/githubApi.ts` `enableAutoMerge` — uses
`mergeMethod` not `method`. If you regenerated this file from scratch,
double-check.

## "Cleanup workflow runs green but the channel is still there"

The `delete` event has no checkoutable ref (the branch is gone), so the
implicit checkout fails silently. Without an explicit `actions/checkout@v4
with: ref: main`, the firebase CLI bails with "Not in a Firebase app
directory" — but if the old workflow used `|| true` to swallow errors,
the run looks green. Fix: explicit checkout step + replace `|| true`
with an exit-code check that only swallows "channel not found." Pattern
is in `packages/cli/template/.github/workflows/cleanup-preview.yml`.

## "Build notification immediately fails on every new branch"

Branch creation fires both `create` AND `push` events; the deploy
workflow runs twice and `concurrency: cancel-in-progress: true` kills
one. The cancelled run's `workflow_run.completed` webhook lands first,
with `conclusion: cancelled`. The notification consumer must filter
`cancelled` + `skipped` conclusions. Fix is in
`products/nebula-platform/src/lib/notifications/index.tsx` —
`isMeaningfulConclusion`. Don't revert it.

## "Firebase secret got truncated when set interactively"

The `firebase functions:secrets:set` interactive paste mangles PEM keys
(line continuations get eaten). Always use `--data-file=/path/to/file`.

## "FIREBASE_SERVICE_ACCOUNT secret has the wrong name"

`firebase init hosting:github` writes
`FIREBASE_SERVICE_ACCOUNT_<UPPERCASE_PROJECT_ID>` — for `mcoe-d` that's
`FIREBASE_SERVICE_ACCOUNT_MCOE_D`. The naming is fixed. If your
workflows reference a different name, update the workflow, not the
secret.

## "Two workflow files keep regenerating after I delete them"

`firebase init hosting:github` regenerates
`firebase-hosting-pull-request.yml` + `firebase-hosting-merge.yml` if
you say yes to either of its prompts. Re-run `firebase init` and say
**No** to both, then delete the files again.

## "Push to GitHub fails with HTTP 400 on initial push"

Initial pushes that include the full framework history can exceed git's
default buffer. Bump it:

```bash
git config --global http.postBuffer 1073741824   # 1 GB
```

## "Functions deploy succeeds but functions can't read secrets"

Functions need to be redeployed AFTER `secrets:set`. The deploy step
binds the secret to the function at deploy time; without redeploying,
the function keeps using the previous binding (which might be empty).

## "Cloud Run service name doesn't match function name"

Firebase Functions camelCase → Cloud Run lowercases everything.
`recordPreviewDev` (function name) → `recordpreviewdev` (Cloud Run
service name) → URL is `https://recordpreviewdev-<hash>-uc.a.run.app`.
Don't search for the camelCase form.

## "Stale preview channels piling up in Firebase Console"

Preview channels auto-expire after 7 days of inactivity. If you're
finding old `branch-foo` channels, either (a) the cleanup workflow
isn't on `main` (GitHub only fires `delete` against workflows present
on the default branch), or (b) the channel-ID sanitization in cleanup
differs from deploy — diff the two `sed` invocations character for
character. They must produce identical output.

---

# Reference: everything by category

## Firebase function secrets

Set via `firebase functions:secrets:set <name> --data-file=<path>
--project <project-id>`.

- `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_WEBHOOK_SECRET`,
  `RECORD_PREVIEW_SECRET` (prod).
- `DEV_APP_ID`, `DEV_APP_PRIVATE_KEY`, `DEV_WEBHOOK_SECRET`,
  `DEV_RECORD_PREVIEW_SECRET` (dev).
- `GA4_SERVICE_ACCOUNT_JSON` (analytics, optional).

## Platform SPA env vars (root `.env`)

- `NEBULA_ENV` (`dev` | `prod`)
- `NEBULA_BACKEND` (`firebase` | `emulator`)
- `NEBULA_LOCAL_TENANT` (optional path)
- `NEBULA_APP_INSTALL_URL_PROD`, `NEBULA_APP_INSTALL_URL_DEV`
- `FIRESTORE_DB_ID_PROD`, `FIRESTORE_DB_ID_DEV`
- `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`,
  `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGE_SENDER_ID`,
  `FIREBASE_APP_ID`, `FIREBASE_MEASUREMENT_ID`

## Tenant repo secrets

- `FIREBASE_SERVICE_ACCOUNT_<UPPERCASE_PROJECT_ID>` (auto-set by
  `firebase init hosting:github`)
- `NEBULA_RECORD_PREVIEW_SECRET` (matches function secret
  `DEV_RECORD_PREVIEW_SECRET` or `RECORD_PREVIEW_SECRET`)

## Tenant repo variables

- `FIREBASE_PROJECT_ID`
- `NEBULA_RECORD_PREVIEW_URL`

## Tenant repo workflow files

- `.github/workflows/deploy.yml` — copy from
  `packages/cli/template/.github/workflows/deploy.yml`.
- `.github/workflows/cleanup-preview.yml` — copy from
  `packages/cli/template/.github/workflows/cleanup-preview.yml`.

## Tenant repo Firebase files

- `firebase.json` — hosting target config (see Path A step 7).
- `.firebaserc` — project + target → site mapping (see Path A step 7).

## GitHub App webhook subscriptions

- `push`, `pull_request`, `workflow_run`, `create`, `delete`,
  `installation`, `installation_repositories`.

## GitHub App repository permissions

- Contents: R/W, Pull requests: R/W, Metadata: R, Workflows: R/W,
  Webhooks: R.

---

# When in doubt

- For Path A questions, also read [.claude/ooss-hosting-port.md](ooss-hosting-port.md) — it overlaps in the "wire a tenant for hosting" sections.
- For architecture context, [.claude/architecture.md](architecture.md) and [.claude/nebula.md](nebula.md).
- The Cloud Functions code in `functions/src/` is the authoritative source for secret names + auth shapes. Grep `defineSecret` if anything in this doc looks stale.
