# Nebula Docs Platform — Architecture

The editor side of Nebula Docs. Pairs with the CLI documented in [nebula-cli.md](nebula-cli.md). For locked decisions, see [decisions.md](decisions.md). For current open work, see [status.md](status.md).

## TL;DR

Git-based MDX editor. Sign in, pick a repo via the GitHub App, browse the file tree, edit MDX visually, commit + open PR. CI runs `nebula build` in the tenant repo and deploys the static site.

**Stack:** Vite + React 19 + React Router 7 + Tailwind v4 + shadcn/ui + Tiptap (ProseMirror). Static SPA hosted on Firebase Hosting (target `platform`).

**Two auth layers:**

- **Identity** → Firebase Auth (eventually enterprise SSO via OIDC).
- **GitHub access** → custom GitHub App installed by an admin on the tenant repo. Platform commits AS the app, never as the user.

**Server-side concerns** (signing the GH App private key, receiving webhooks) live in Firebase Cloud Functions in `functions/`.

## The editing loop

```
1. Editor signs into the Platform (Firebase Auth, client-side SDK)
2. Platform → mintGithubToken Cloud Function → short-lived installation token
3. Platform uses Octokit (client-side) with that token to read the tenant repo
4. Editor opens an MDX file → parseMdx → mdxToTiptapDoc → Tiptap doc
5. Editor edits visually → tiptapDocToMdx on every onUpdate
6. Editor clicks Commit & PR → Platform creates branch, commits MDX, opens PR
     Commit attribution: nebula-docs[bot]; user noted in commit body
7. GitHub Actions in the tenant repo runs `nebula build`
     main → root deploy; PR → --base /previews/<PR#>/ → preview deploy
8. GitHub webhook → githubWebhook Cloud Function → Firestore activity/ + builds/
9. Platform onSnapshot subscriptions → notification center + dashboard rows
```

## Why two auth layers

- **Enterprise SSO.** UHG's GitHub sits behind SAML/SSO. OAuth-as-login through a SAML-walled GitHub is awkward; admin-installed GH App is clean.
- **Shared repo access.** Multiple users edit the same tenant repo; the GH App holds repo permissions, the Platform gates which users can use it. No per-user repo permission needed.

| Layer | Responsibility | Tool |
|---|---|---|
| Identity | Who is using the Platform? | Firebase Auth |
| GitHub access | How does the Platform write to repos? | Custom GitHub App, installed by admin |

## Dev / prod GitHub App split

Same Firebase project (`mcoe-d`), two parallel apps:

- **Enterprise** (`nebula-docs`) — installed on UHG private docs orgs. Secrets `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_WEBHOOK_SECRET`. Functions `mintGithubToken`, `getInstallation`, `githubWebhook`, `getAnalyticsSummary`, `recordPreview` (all VPC-bound to `nebula-connector` for the GH Enterprise IP allowlist).
- **Dev** (`nebula-docs-dev`) — installed on public demo repos. Secrets `DEV_APP_ID`, `DEV_APP_PRIVATE_KEY`, `DEV_WEBHOOK_SECRET`. Functions `mintGithubTokenDev`, `getInstallationDev`, `githubWebhookDev`, `getAnalyticsSummaryDev`, `recordPreviewDev` (no VPC; direct egress).

`NEBULA_ENV=dev|prod` in the root `.env` picks app, Firestore database (`(default)` vs `nebula-docs-plat-dev`), and Cloud Function name suffix.

Deploys are scoped: `pnpm --filter @nebula-docs/functions deploy:dev|prod`. Never unfiltered.

## What's load-bearing

Every package below has working code in active use.

- `packages/theme` — frozen tokens. Generates `dist/tokens.css`.
- `packages/components` — React components for ~31 MDX block types. Single source of truth (Platform + CLI + legacy docs).
- `packages/schemas` — Zod schemas per block type. Used at parse/serialize time.
- `packages/firebase` — slim init + auth. Accepts optional `firestoreDbId`.
- `packages/mdx` — parse/serialize, frontmatter, snippet resolution, `remarkAutoComponentImports`, `remarkBasePrefix`.

The editor surface itself lives in `products/nebula-platform/src/components/mdx/`. ~46 `Mdx*Node.tsx` NodeView files cover Callout, Card, Frame, CodeBlock, CodeGroup, Tabs, Accordion, Columns, Steps, Update, Tree, Expandable, Mermaid, Badge, API nodes (ParamField, ResponseField, RequestExample, ResponseExample), and the snippet atom. Components without a NodeView round-trip through `MdxRaw` (preserves source verbatim, no editing UI).

## Stack non-choices

- **Not Next.js.** The only Next feature that mattered (Server Actions) is replaced by `httpsCallable()`.
- **Not Astro.** Astro shines for content-heavy sites with islands; an interactive editor fights its strengths. (The CLI's render side IS Astro — see [nebula-cli.md](nebula-cli.md).)
- **Not MDXEditor.** Lexical-on-rails opinions fought the source-of-truth model. Tiptap-direct is one layer lower.
- **Not a runtime CMS.** Content lives as MDX in git. No Firestore-as-content, no wildcard runtime routes.
- **Not MUI, not Auth.js.** Tailwind + shadcn + Firebase client SDK is enough.

## See also

- [decisions.md](decisions.md) — locked decisions, including all the editor + auth + storage choices and the SSR/auto-import gotchas
- [editor-toolbars.md](editor-toolbars.md) — TextToolbar + LinkBubble + slot-aware dropdown pattern
- [nebula-cli.md](nebula-cli.md) — the renderer side
- [status.md](status.md) — current open work
