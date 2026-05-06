# Nebula Docs Platform — Architecture

The Platform is the editor side of Nebula Docs. It pairs with the SSG documented in [nebula-ssg.md](nebula-ssg.md). Together they form a multi-tenant documentation platform: tenants edit content in the Platform, the SSG renders it.

For the live "what's done / what's open" snapshot per workstream, see [status.md](status.md).

## TL;DR

- **Git-based MDX editor.** Sign in, pick a repo via the GitHub App, browse the file tree, edit MDX visually, commit + open PR. CI rebuilds the docs site from the new MDX.
- **Two auth layers, kept separate**:
  - User identity → Firebase Auth (eventually enterprise SSO via OIDC)
  - GitHub access → custom GitHub App installed by an admin on the docs repo. The Platform commits AS the app, never as the user.
- **Stack**: Vite + React 19 + React Router 7 + Tailwind v4 + shadcn/ui + Tiptap (ProseMirror). Static SPA hosted in the OOSS bucket `mcoe-dev-nebula`.
- **Server-side concerns** (anything that needs the GitHub App private key or receives webhooks) live in Firebase Cloud Functions in `functions/`.

## The editing loop

```
1. Editor signs into the Platform (Firebase Auth, client-side SDK)
2. Platform calls Cloud Function: mintGithubToken({ installationId })
     - Function verifies caller's Firebase ID token
     - Function uses GitHub App private key (Cloud Secret Manager) to JWT-sign
       and exchange for a short-lived installation token
     - Returns the token to the Platform
3. Platform uses Octokit (client-side) with that token to read the repo's MDX
4. Editor opens an MDX file → Platform parses to MDAST → loads into Tiptap doc
5. Editor edits visually → Tiptap doc serializes back to MDX on every change
6. Editor clicks "Commit & PR":
     - Platform mints a fresh token if needed
     - Platform uses Octokit to create a branch, commit MDX, open a PR
     - Commit attribution: nebula-docs[bot]; user noted in commit body
7. GitHub Actions rebuilds the docs site → live
8. GitHub posts webhook events to Cloud Function: githubWebhook
     - Verifies signature, writes events to Firestore (activity / builds collections)
9. Platform subscribes to Firestore via onSnapshot — UI updates with build status
```

## Why two auth layers

- **Enterprise SSO.** UHG's GitHub sits behind SAML/SSO. OAuth-as-login through a SAML-walled GitHub is awkward.
- **Shared repo access.** Multiple Platform users edit the same docs repo. The GitHub App holds the permissions; the Platform gates which users can use it. Each user doesn't need their own repo permissions on GitHub.

| Layer | Responsibility | Tool |
|---|---|---|
| **Identity** | Who is using the Platform? | Firebase Auth (now) → enterprise SSO via OIDC (later) |
| **GitHub access** | How does the Platform write to repos? | Custom GitHub App, installed by admin on the docs repo |

## Why GitHub App, not OAuth App

| | GitHub App | OAuth App |
|---|---|---|
| Acts on behalf of | Itself (the app) | The user |
| Token scope | Per-installation (per repo) | Per-user |
| Revocation | Admin uninstalls app | User revokes |
| Commit attribution | `nebula-docs[bot]` + user info in body | The user's GitHub identity |
| Enterprise SSO | Works (admin-installed) | Each user needs SSO + repo access |

## Why Vite + Cloud Functions (not Next.js)

The only thing that genuinely needs server-side execution is signing the GitHub App's private key — a long-lived PEM secret that can't ship in the browser bundle. Everything else (Firebase Auth, Firestore, Octokit calls with a short-lived installation token) is happy in the client.

That makes Vite + OOSS-bucket-hosted SPA the right choice:

- Same hosting pattern as the docs site (static files in OOSS, behind firewall)
- Faster dev iteration; smaller deploy footprint
- No vendor-locked Node hosting requirement

The Next.js Server Actions ergonomic win becomes `httpsCallable()` — same magic, slightly different syntax.

## Stack

| Layer | Choice | Why |
|---|---|---|
| **Framework** | Vite + React 19 + React Router 7 | Static SPA → OOSS bucket. Fast dev. No Node-host requirement. |
| **TypeScript** | Strict, project-wide | Workspace standard |
| **Styling** | Tailwind CSS v4 + shadcn/ui (Radix primitives) | Tailwind is the one styling system inside `products/nebula/`. shadcn primitives are copy-into-codebase. |
| **User auth** | Firebase Auth client SDK directly (via `@nebula-docs/firebase`) | Already wired up; swap to OIDC later when SSO arrives |
| **GitHub auth** | `@octokit/auth-app` in a Cloud Function | Private key server-side; SPA gets short-lived installation tokens via `httpsCallable` |
| **GitHub API** | `@octokit/rest` (client-side) | Uses the installation token from the function |
| **MDX parse / serialize** | `@mdx-js/mdx` + `unified` + `remark-mdx` + `mdast-util-mdx` + `remark-stringify` | Generic, framework-agnostic AST |
| **Editor surface** | **Tiptap (ProseMirror) with custom NodeViews** | Single contenteditable, multi-block selection, document-wide undo, slash commands. Source-of-truth model: Tiptap doc is in-memory state, MDX is the I/O format. |
| **Webhook receiver** | Cloud Function in `functions/` | Verifies GitHub signature, writes events to Firestore |
| **Activity / build state** | Firestore + `onSnapshot` (real-time) | UI subscribes to build/PR events |
| **Deploy** | OOSS bucket (SPA) + Firebase deploy (Functions) | Two CI workflows |

Explicit non-choices:

- **Not Next.js** — the only Next.js feature that mattered (Server Actions) is replaced by `httpsCallable()`. Vite deploys to OOSS like the docs already do.
- **Not Astro for the Platform** — Astro shines for content-heavy sites with islands. The Platform is an interactive editor; that fights the framework's strengths. (The SSG IS Astro — see [nebula-ssg.md](nebula-ssg.md).)
- **Not MDXEditor** — wraps Lexical with MDX-specific opinions; the opinionation fought us. Tiptap-direct is one layer lower (ProseMirror engine + our own schema/NodeViews).
- **Not a runtime CMS** (no Firestore-as-content). Content lives as MDX in git.
- **Not MUI** — Tailwind + shadcn fits.
- **Not Auth.js** — Firebase client SDK is enough.

## Settled decisions

These were open in earlier drafts; they're decided now. Don't relitigate without flagging here first.

1. **Editor surface: Tiptap (ProseMirror) with custom NodeViews.** Per-block contenteditable was attempted and reverted; cross-block drag-selection, multi-block copy-paste, and document-wide undo all required a real ProseMirror engine. MDXEditor was rejected because its Lexical-on-rails opinions fought the source-of-truth model.

2. **Source-of-truth model: Tiptap doc is in-memory state, MDX is the I/O format.** Load: MDX → MDAST (`parseMdx`) → Tiptap doc JSON via `mdxToTiptapDoc`. Edit: Tiptap owns the doc. Serialize: Tiptap doc → MDX string via `tiptapDocToMdx` on `onUpdate`. JSX components without a NodeView yet are wrapped as opaque `mdxRaw` atoms carrying the verbatim source slice; the serializer emits that string back unchanged. `normalizeMdx()` round-trips a file through parser + serializer at load so opening doesn't mark it dirty.

3. **GitHub host: GitHub Enterprise Cloud (`github.com/<org>`).** Not GHES. No `baseUrl` overrides on Octokit. Install URL is `https://github.com/apps/<slug>/installations/new`.

4. **OOSS bucket: `mcoe-dev-nebula`** (parallel to `mcoe-dev-docs`). Behind UHG firewall; same deploy chain as the docs site.

5. **Edit storage: in-memory until commit.** Drafts are not persisted to Firestore. A reload loses unsaved work. Revisit if it bites in practice.

6. **Branch / PR strategy: branch per edit + PR.** Branch naming convention is still TBD (small open).

## Dev / prod GitHub App split

The Platform supports two parallel GitHub Apps under the same Firebase project (`mcoe-d`):

- **Enterprise (`nebula-docs`)** — installed on the UHG private docs org; secrets `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_WEBHOOK_SECRET`; functions `mintGithubToken`, `getInstallation`, `githubWebhook` (all VPC-bound to `nebula-connector` for the GitHub Enterprise IP allowlist).
- **Dev (`nebula-docs-dev`)** — installed on a public demo repo; secrets `DEV_APP_ID`, `DEV_APP_PRIVATE_KEY`, `DEV_WEBHOOK_SECRET`; functions `mintGithubTokenDev`, `getInstallationDev`, `githubWebhookDev` (no VPC; egress goes direct to public github.com).

The Platform picks which app to use via `NEBULA_ENV=dev|prod` in the root `.env`. The matching Firestore database (`(default)` for prod, `nebula-docs-plat-dev` for dev) is selected per the same switch.

Deploy is scoped:

- `pnpm --filter @nebula-docs/functions deploy:prod` deploys the three enterprise functions.
- `pnpm --filter @nebula-docs/functions deploy:dev` deploys the three dev functions.
- Never run unfiltered `firebase deploy --only functions` from a workstation — it touches both sets.

## What stays from prior work

Every package below has working code and is load-bearing.

- **`packages/theme`** — TS-first tokens. Frozen-data hard rule applies: data in `mcoeDefaultTokens` / `uhcTokens` / `optumTokens` is approved and unchanging. Generates `dist/tokens.css` consumed by Docusaurus and the Platform.
- **`packages/components`** — React components for MDX block types (currently 18 component groups: callout, card, code-block, columns, frame, icon, mermaid, property, step, steps, tabs, tree, update, accordion, badge, expandable, example, video). Single source of truth — both the Platform's MdxEditor and the SSG render from this package.
- **`packages/schemas`** — Zod schemas, one per block type. Used editor-side for prop validation when serializing back to MDX.
- **`packages/firebase`** — Slim init + auth helpers. The Platform imports from here directly. Now accepts an optional `firestoreDbId` so it can target either Firestore database.

## Things NOT to do

- Don't reintroduce a runtime-CMS pattern (no Firestore-as-content, no wildcard runtime routes).
- Don't replace `@nebula-docs/theme` with another tokens system.
- Don't drop Tiptap for a different editor. The architectural decision is settled.
- Don't switch the Platform to Next.js or Astro. It's intentionally Vite + Cloud Functions.
- Don't reach across `products/*` for code. Share via `packages/*`.
- Don't put "Mintlify" in shipped source. See [conventions.md](conventions.md).
