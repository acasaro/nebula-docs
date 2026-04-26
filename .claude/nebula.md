# Nebula CMS — Architecture & Build Plan

This is the design doc for Nebula, the in-house docs editor. The previous
attempt (a runtime-CMS that wrote `Block[]` trees to Firestore and rendered
them on the docs site at runtime) has been reverted — it created a visual
fidelity gap with the existing Docusaurus output and complicated search.
This doc captures the new direction.

## TL;DR

- **Content stays where it is**: MDX files in the docs git repo. Docusaurus
  renders them exactly as today. No runtime fetch, no Firestore for content.
- **Nebula is a git-based MDX editor**, modelled on Mintlify's dashboard.
  Sign in → browse repo → edit MDX visually → commit → open PR → CI rebuilds
  the docs site → live.
- **Two auth layers, kept separate**:
  - User identity → Firebase Auth (eventually enterprise SSO via OIDC)
  - GitHub access → custom **GitHub App** installed by an admin on the
    docs repo. Nebula commits AS the app, not as the user.
- **Stack**: Vite + React + React Router + Tailwind v4 + shadcn/ui.
  Static SPA hosted in an OOSS bucket (same pattern as docs).
- **Server-side concerns** (anything that needs the GitHub App private key
  or receives webhooks) live in **Firebase Cloud Functions** in the
  existing `functions/` package. Two functions total, ~100 lines each.

## Where things stand right now

After the revert, the monorepo state is:

```
products/
  docs/                  # Docusaurus 3.10 — pre-CMS-runtime, exactly as before.
                         #   customCss now imports @nebula/theme/dist/tokens.css
                         #   instead of a hand-written tokens.css. That's the
                         #   only docs-site change worth keeping.

packages/
  components/            # 1:1 component migrations from products/docs/src/components/mdx
                         #   (Frame, VideoLoop, Steps, Step, Icon, Callout, Heading, Text).
                         #   The MDX shims in products/docs/src/components/mdx/* re-export
                         #   from here — single source of truth for block components.
  schemas/               # Zod schemas for the 8 block types. Will be reused
                         #   editor-side for prop validation when serializing
                         #   blocks back to MDX.
  firebase/              # Slimmed: just init + auth helpers (Google + email).
                         #   Reused by Nebula's client SDK setup directly.
  theme/                 # TS-first design tokens. Generates dist/tokens.css
                         #   for Docusaurus's customCss. Frozen-data hard rule
                         #   from the original CLAUDE.md preserved.

functions/               # Empty stub. Two functions to add: GitHub App token
                         #   minting + GitHub webhook receiver.

products/nebula/         # NOT YET CREATED. Phase 0 creates it as a Vite app.

.github/workflows/
  build-deploy.yml       # docs → OOSS, monorepo paths
  deploy-nebula.yml      # stub, will be rewritten — SPA → OOSS bucket
  deploy-functions.yml   # stub, will be wired up for the two new functions
```

**Workspace install + docs build are clean.** Both pass typecheck.

## The architecture

### Why git-based MDX (not runtime CMS)

The runtime approach (Firestore → docs site `onSnapshot`) introduced three
real problems:

1. **Visual gap.** The CMS-rendered `<CmsPage>` couldn't perfectly match
   the existing Docusaurus + MDX output. Your hard-fought theme, code
   blocks, and component styling diverged when served from JSON.
2. **Search re-architecting.** Docusaurus's search-local indexes MDX at
   build time. Runtime-rendered pages weren't indexed without a parallel
   pipeline (Algolia, Typesense, custom Cloud Function indexing — all
   real work).
3. **Editor-architecture friction.** Building a Notion-style block editor
   over `Block[]` trees with proper inline editing turned out to be much
   bigger than estimated. The form-driven approach felt off; contenteditable
   slash commands are non-trivial; rich text is its own multi-quarter
   project without a ProseMirror-class library.

Git-based MDX (Mintlify's actual model) sidesteps all three:

- **Visual fidelity is automatic** — Docusaurus renders the same MDX it
  always has.
- **Search keeps working** — `@easyops-cn/docusaurus-search-local` indexes
  static MDX. Zero changes.
- **Editor scope shrinks** — the editor produces text (MDX strings) instead
  of being the live content surface. Quality bar is lower because output
  isn't real-time visible to readers.

Trade: edit-to-live latency goes from milliseconds (Firestore push) to
minutes (commit → PR → merge → CI build → deploy). Fine for an internal
docs site with 2-3 editors.

### How the loop works

```
1. Editor signs into Nebula SPA (Firebase Auth, client-side SDK)
2. SPA calls a Cloud Function: mintGithubToken({ installationId })
     - Function verifies caller's Firebase ID token
     - Function uses GitHub App private key (env var) to JWT-sign
       and exchange for a 1-hour installation token
     - Returns the token to the SPA
3. SPA uses Octokit (client-side) with that token to read the repo's MDX
4. Editor opens an MDX file → SPA parses to AST → renders block editor
5. Editor edits visually → SPA serializes AST back to MDX
6. Editor clicks "Commit & PR":
     - SPA mints a fresh token (or reuses if not expired)
     - SPA uses Octokit to:
         - Create a branch (e.g., `nebula/edit-bitrise-access-2026-04-25`)
         - Commit the MDX file with a message like
             "Update bitrise-access.mdx (via Nebula by user@uhg.com)"
         - Open a PR (or push direct to main if configured)
     - Commit attribution: nebula[bot]; user noted in commit body
7. GitHub Actions runs the existing build-deploy.yml workflow
8. Docs site rebuilds on OOSS → live
9. GitHub posts webhook events to Cloud Function: githubWebhook
     - Verifies signature, writes events to Firestore (activity/builds)
10. SPA subscribes to Firestore via onSnapshot — UI updates with build/PR status
```

### Why two auth layers

The old idea was "Sign in with GitHub" — conflates identity with
authorization. Two reasons that breaks for this project:

- **Enterprise SSO.** UHG's GitHub will sit behind SAML/SSO. OAuth-as-login
  through a SAML-walled GitHub is awkward at best.
- **Shared repo access.** Multiple Nebula users will edit the same docs
  repo. Each user authenticating individually means each user needs repo
  permissions on GitHub. With a GitHub App, the app has the permissions;
  Nebula gates which Nebula users can use it.

The split:

| Layer | Responsibility | Tool |
|---|---|---|
| **Identity** | Who is using Nebula? | Firebase Auth (now) → enterprise SSO via OIDC (later) |
| **GitHub access** | How does Nebula write to repos? | Custom GitHub App, installed by admin on the docs repo |

A user signs in with their corporate email. They never touch a GitHub
token. When they commit, the SPA asks the Cloud Function to mint an
installation token; the function uses the App's private key (server-side
secret) to do so. The token has ~1 hour TTL and acts AS the GitHub App,
not as the user. Commits show as `nebula[bot]` with the real user named
in the commit body.

### Why GitHub App, not GitHub OAuth App

| | GitHub App | OAuth App |
|---|---|---|
| Acts on behalf of | Itself (the app) | The user |
| Token scope | Per-installation (per repo) | Per-user |
| Revocation | Admin uninstalls app | User revokes |
| Commit attribution | `nebula[bot]` + user info | The user's GitHub identity |
| Enterprise SSO | Works (admin-installed) | Each user needs SSO + repo access |
| Right for shared dev infrastructure | ✓ | ✗ |

Mintlify uses a GitHub App for the same reasons.

### Why Vite + Cloud Functions (not Next.js)

The only thing that genuinely needs server-side execution is signing the
GitHub App's private key — it's a long-lived PEM secret that can't ship
in the browser bundle. Everything else (Firebase Auth, Firestore, Octokit
calls with a short-lived installation token) is happy in the client.

So the Node-runtime requirement shrinks from "the entire app" to "two
small functions":

- **`mintGithubToken`** — JWT-sign with the App private key, exchange for
  an installation token, return it. Verifies caller's Firebase ID token.
- **`githubWebhook`** — receive GitHub events (PRs, builds), verify
  signature, write to Firestore for the SPA to subscribe to.

That makes Vite + OOSS-bucket-hosted SPA the right choice:

- Same hosting pattern as docs (static files in OOSS, behind firewall)
- Faster dev iteration (Vite dev server is meaningfully snappier than
  Next.js)
- Smaller deploy footprint (just upload `dist/` to a bucket)
- No vendor-locked Node hosting requirement

The Next.js Server Actions ergonomic win (call server fns like regular
fns) becomes `httpsCallable()` from the Firebase SDK — same magic,
slightly different syntax. Functionally equivalent.

## Stack

| Layer | Choice | Why |
|---|---|---|
| **Framework** | Vite + React 19 + React Router 7 | Static SPA output → OOSS bucket. Fast dev. No Node-host requirement. |
| **TypeScript** | Strict, project-wide | Workspace standard |
| **Styling** | Tailwind CSS v4 | Mintlify visual language; shadcn assumes it |
| **Components** | shadcn/ui (Radix primitives) | Copy-into-codebase, customizable; sidebars, command palettes, dialogs, file trees, dropdowns out of the box. [Vite setup guide](https://ui.shadcn.com/docs/installation/vite). |
| **User auth** | Firebase Auth client SDK directly (via `@nebula/firebase`) | Already wired up; simple; swap to OIDC later when SSO arrives |
| **GitHub auth** | `@octokit/auth-app` in a **Cloud Function** | Private key server-side; SPA gets short-lived installation tokens via `httpsCallable` |
| **GitHub API** | `@octokit/rest` (client-side, in SPA) | Uses the installation token from the function |
| **MDX parse/serialize** | `@mdx-js/mdx` + `unified` + `remark-mdx` + `mdast-util-mdx` | Generic, framework-agnostic; produces a real AST we can edit |
| **Editor surface** | Decide Phase 3 — strong recommendation: **MDXEditor** ([mdxeditor.dev](https://mdxeditor.dev)) | MIT, Mintlify-quality, plugin system for custom blocks. Fall back to custom if it doesn't fit. |
| **Webhook receiver** | Cloud Function in `functions/` | Verifies GitHub signature, writes events to Firestore |
| **State** | Firestore + onSnapshot (real-time) | UI subscribes to build/PR events |
| **Deploy** | OOSS bucket (SPA) + Firebase deploy (Functions) | Two small CI workflows |

Explicit non-choices:

- **Not Next.js** — the only Next.js feature that mattered (Server Actions)
  is replaced by `httpsCallable()` to a Cloud Function. Hosting cost
  dominates: Next requires Node hosting we'd need to procure; Vite
  deploys to OOSS like the docs already do.
- **Not Astro** — Astro shines for content-heavy sites with islands of
  interactivity. Nebula is an interactive editor app — fights the
  framework's strengths.
- **Not Docusaurus for Nebula** — Docusaurus is for the docs reading site.
  Nebula is a separate Vite app.
- **Not `@mintlify/mdx`** — Next.js-specific MDX wrapper bound to
  `next-mdx-remote-client`. We use generic `@mdx-js/mdx` instead.
- **Not `@mintlify/components` as a dep** — Tailwind-styled, opinionated.
  Use as **reference implementation only**: read source from
  `vendor/mintlify-components/` (vendored verbatim, MIT-licensed), adapt
  patterns into our `packages/components` as we add Tabs / Card /
  Accordion / etc. Their styling translates from Tailwind to our emotion
  + `--mcoe-*` CSS vars. Delete the vendored copy once we no longer
  reference it.
- **Not MUI** — overkill for the editor; mismatched visual language.
  Tailwind + shadcn fits.
- **Not Auth.js** — adds abstraction we don't need. Firebase client SDK
  is dead simple for our auth flow. When SSO arrives, swap providers
  via Firebase's OIDC support.

## What stays from the prior work

Every package below has working code, real tests of correctness (typecheck,
docs build), and is load-bearing for the next phase. Don't redo any of it.

- **`packages/theme`** — TS-first tokens, generates `dist/tokens.css` at
  build via a tiny tsx script. Both Docusaurus (via `customCss`) and Nebula
  (via Tailwind theme config or runtime emotion `<Global>`) consume it.
  **Frozen rule from the original CLAUDE.md still applies**: data in
  `mcoeDefaultTokens`/`uhcTokens`/`optumTokens` is approved and unchanging.
- **`packages/components`** — 1:1 React components for Frame, VideoLoop,
  Steps, Step, Icon, Callout (plus Heading/Text). The MDX files in
  `products/docs/docs/**/*.mdx` already use these via the shim layer.
- **`packages/schemas`** — Zod schemas for each block type. Reuse editor-
  side: when serializing the block tree back to MDX, validate prop shapes.
- **`packages/firebase`** — Slim init + auth helpers. Nebula uses these
  directly for sign-in.
- **The whole docs site** (`products/docs/`) — untouched, working,
  building, deploying. Don't touch unless adding a new MDX-importable
  component to `packages/components` (and the corresponding shim).

## Open decisions (the next chat needs answers)

1. **Editor library.** MDXEditor vs custom-on-`@mdx-js/mdx`. Recommendation:
   evaluate MDXEditor's [demo](https://mdxeditor.dev) before committing.
   If it covers ~70% of the desired UX out of the box, use it and
   customize. If it doesn't, build custom on the unified AST. Either
   path keeps MDX as the source of truth.

2. **Repo + branch + PR strategy.**
   - Single docs repo (current `mcoe-docs`) or multiple?
   - Branch naming: `nebula/edit-{slug}-{date}` or per-user prefix?
   - Auto-merge for trivial edits, or always require human PR review?
   - Direct push to main (skip PR) for some users / some files?

3. **Snippets / shared content.** Mintlify supports `<Snippet>` includes.
   Do you want this? If so, how stored — separate `snippets/` directory in
   the docs repo, MDX files, imported via remark plugin? Defer to later
   phase.

4. **Versioning of docs.** Docusaurus supports versioned docs. Editor needs
   to know which version it's editing. Currently single-version
   (`current`). Probably stays that way; flag if not.

5. **OOSS bucket for Nebula.** Likely a new bucket like `mcoe-dev-nebula`,
   parallel to `mcoe-dev-docs`. Confirm naming + provisioning steps with
   UHG infra.

6. **Where does the GitHub App live?** UHG's GitHub Enterprise instance,
   not github.com. Need to confirm whether you can register a GitHub App
   on your enterprise GitHub and how the install flow works in the
   enterprise admin UI.

## Build phases for the next chat

### Phase 0 — bootstrap

```
cd products/
pnpm create vite@latest nebula -- --template react-ts
cd nebula
```

Then:
- Install Tailwind v4: `pnpm add -D tailwindcss @tailwindcss/vite`
- Configure shadcn/ui: `pnpm dlx shadcn@canary init` (Vite mode)
- Install router: `pnpm add react-router`
- Install GitHub libs (CLIENT-side only): `pnpm add @octokit/rest`
- Install MDX libs: `pnpm add @mdx-js/mdx unified remark-mdx mdast-util-mdx remark-stringify`
- Install Firebase client SDK: `pnpm add firebase`
- Add `@nebula/components`, `@nebula/schemas`, `@nebula/theme`, `@nebula/firebase`
  as workspace deps
- The `products/*` glob in `pnpm-workspace.yaml` already covers it.

For the Cloud Functions side, in `functions/`:
- Install: `pnpm --filter @nebula/functions add @octokit/auth-app @octokit/rest firebase-admin firebase-functions`
- Stub two functions: `mintGithubToken` (callable) + `githubWebhook` (HTTP)

### Phase 1 — auth + GitHub App connection

- `/sign-in` route in the Vite SPA — Firebase Auth (Google + email)
- Authenticated layout shell (sidebar + main, shadcn primitives)
- `/settings/github` route — admin-only:
  - Display the GitHub App install URL (admin clicks → GitHub install flow)
  - List installed repos (via `mintGithubToken` + `octokit` client-side)
  - Save active repo connection in Firestore (`{ owner, repo, defaultBranch,
    installationId }`)
- `mintGithubToken` Cloud Function:
  - Verifies Firebase ID token of caller
  - (Optional) checks user has admin role for token-minting
  - Loads GitHub App private key from env (`GITHUB_APP_PRIVATE_KEY`)
  - Returns short-lived installation token + expiry

**Done when**: an admin can install the GitHub App on a repo, the repo
appears in Nebula's settings, and the SPA can list MDX files via a
short-lived installation token from `mintGithubToken`.

### Phase 2 — file browser

- `/repo/{owner}/{repo}` route — file tree of `docs/**/*.mdx`
- Click a file → SPA fetches its MDX content via Octokit (using cached or
  freshly-minted installation token)
- Display raw MDX in a read-only view (text / syntax highlighted)
- No editor yet

**Done when**: pick a repo → see file tree → click a file → see its raw
MDX content.

### Phase 3 — editor (decide tool first)

- Evaluate MDXEditor against your visual target (use their demo)
- If MDXEditor: integrate; define custom block extensions for Frame,
  Steps, Callout, etc., mapping to the components in `packages/components`
- If custom: build over `@mdx-js/mdx` AST + contenteditable

Either way, the result is: the user opens an MDX file, sees a
Mintlify-style visual editor, edits, and the in-memory MDX string updates.

### Phase 4 — commit + PR flow

- "Save" button → SPA uses Octokit to create branch + commit
  - May need to mint a fresh token if the current one is expiring
- "Open PR" → SPA uses Octokit to create PR from branch to main
- Show PR link / status in the UI
- Optional: auto-merge for users with that permission

### Phase 5 — activity / build status

- `githubWebhook` Cloud Function:
  - Verifies GitHub webhook signature (HMAC-SHA256 with shared secret)
  - Writes events to Firestore (`activity/`, `builds/` collections)
- Dashboard UI subscribes via Firestore `onSnapshot`, shows recent
  commits / PR status / build status per repo
- Configure the GitHub App to send webhooks to the function's HTTPS
  endpoint

### Phase 6 — polish

- Snippet support if needed
- Multi-version support if needed
- Move user auth from Firebase Auth to enterprise SSO when the
  identity team is ready (Firebase supports OIDC providers — same UI,
  swap the provider config)

## First action for the next chat

> "Read [CLAUDE.md](CLAUDE.md) and [.claude/nebula.md](.claude/nebula.md).
> They describe the current state of this monorepo and the plan for
> rebuilding Nebula as a Vite SPA + Firebase Cloud Functions.
>
> Confirm:
>  1. Editor library — MDXEditor vs custom (open decision #1)
>  2. Branch/PR strategy basics (open decision #2)
>
> Then bootstrap Phase 0 — the Vite + React + Tailwind v4 + shadcn/ui
> scaffold inside `products/nebula/` with workspace deps wired up,
> ending with `pnpm --filter @nebula/cms dev` showing a 'Hello Nebula'
> page on `localhost:8081`. Then stub the two Cloud Functions in
> `functions/` (just signatures + 'TODO' comments — no implementation
> yet)."

That's the first commit. From there, Phase 1 (auth + GitHub App) starts.

## Things the next chat should NOT do

- Don't reintroduce a runtime-CMS pattern (no Firestore-as-content, no
  wildcard routes in Docusaurus).
- Don't replace `@nebula/theme` with another tokens system. The frozen-data
  hard rule still applies.
- Don't reuse the deleted Nebula scaffolding (MUI starter, `BlockEditor`
  cards, etc.) — that lineage was the prior failed attempt. Start fresh
  on Tailwind + shadcn.
- Don't drop Docusaurus from the docs site. The docs render exactly as
  intended today and that's a non-goal-disrupting constraint.
- Don't reach for Next.js. The architecture is intentionally Vite +
  Cloud Functions; reverting to Next.js means losing the OOSS-bucket
  static-host pattern that matches your infra.
