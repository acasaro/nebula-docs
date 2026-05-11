# Nebula Docs — Claude Guide

pnpm-workspace monorepo for **Nebula Docs**, a multi-tenant documentation platform. Two shipped products and seven supporting packages:

- **Nebula Docs Platform** — editor SPA at `products/nebula-platform/`. Vite + React 19 + Tailwind v4 + shadcn/ui + Tiptap. See [.claude/nebula.md](.claude/nebula.md).
- **Nebula Docs CLI** — multi-tenant Astro renderer at `packages/cli/`. Distributed as `@nebula-docs/cli`; binary `nebula` (the only place the brand is shortened). See [.claude/nebula-cli.md](.claude/nebula-cli.md).
- **Shared packages** — all seven exist and are in use: `@nebula-docs/{cli,components,schemas,theme,firebase,mdx,analytics}`.
- **Cloud Functions** in `functions/` — six deployed (three prod + three dev). Token minting, installation lookup, webhook receiver, analytics summary, preview recording. Six is the count today; analytics + preview-record were added alongside the original three.
- **Tenants** in `tenants/` — two synthetic fixtures (`nebula-docs-starter` populated; `nebula-docs-starter-empty` minimal). MCOE was extracted to its own GitHub repo on 2026-05-08 and is no longer in this monorepo.

`products/docs/` is the legacy MCOE Docusaurus site, kept as content archive. No new features there — content has moved to the extracted MCOE tenant repo; this directory stays only until the CLI migration cuts over.

For locked decisions + hard-won gotchas, see [.claude/decisions.md](.claude/decisions.md). For current open work, see [.claude/status.md](.claude/status.md). For repo-wide conventions, see [.claude/conventions.md](.claude/conventions.md).

## Repo layout

```
products/
  nebula-platform/       # Editor SPA. Vite + React 19 + Tailwind v4 + shadcn/ui + Tiptap.
                         #   Package: @nebula-docs/platform.
  docs/                  # Legacy MCOE Docusaurus site. Content archive only — no new features.

packages/                # The seven-package framework. All seven exist.
  cli/                   # @nebula-docs/cli — Astro renderer + nebula binary + runtime islands
                         #   + layouts + starter templates. Single npm package.
  components/            # @nebula-docs/components — React MDX block components. Single source
                         #   of truth, consumed by Platform + CLI + legacy docs. ~31 components.
  schemas/               # @nebula-docs/schemas — Zod schemas + emitted JSON Schemas
                         #   (docs.json, theme.json, block props).
  theme/                 # @nebula-docs/theme — TS-first frozen design tokens. Source in
                         #   src/themes/*.ts; generates dist/tokens.css.
  firebase/              # @nebula-docs/firebase — slim init + auth helpers. Accepts optional
                         #   firestoreDbId for dev/prod DB targeting.
  mdx/                   # @nebula-docs/mdx — parse/serialize, frontmatter, snippet
                         #   resolution, remarkAutoComponentImports, remarkBasePrefix.
  analytics/             # @nebula-docs/analytics — provider-agnostic core + Firebase
                         #   provider subpath. v1 ships Firebase Analytics → GA4.

tenants/                 # Synthetic dev fixtures. Tenant repos otherwise live in their own
                         #   external GitHub repos (MCOE is the first).
  nebula-docs-starter/        # Full kitchen-sink starter — exercises every component, nav
                              #   pattern, frontmatter field. `nebula init` default.
  nebula-docs-starter-empty/  # Minimal "smallest valid tenant" — `nebula init --empty`.

functions/               # Firebase Cloud Functions. Six deployed: prod (Enterprise GH App,
                         #   VPC-bound to nebula-connector) + dev (public-GH dev App, no VPC).
                         #   Shared handler factories. All deployed to mcoe-d.

vendor/                  # Reference material; delete each one once we stop referencing it.

.claude/
  nebula.md              # Platform architecture + decisions
  nebula-cli.md          # CLI architecture + decisions + current phase + open follow-ups
  decisions.md           # Locked decisions + hard-won gotchas (single quick-reference home)
  status.md              # Current open work + next workstreams
  conventions.md         # Negotiable repo patterns (hard rules are in this file, below)
  editor-toolbars.md     # TextToolbar + LinkBubble + slot-aware dropdown pattern. Read
                         #   when touching the bubble menu, link bubble, or adding an
                         #   editable title slot.
  ooss-hosting-port.md   # Handoff guide for porting the preview/notification flow from
                         #   Firebase Hosting to OOSS. The Firebase implementation shipped;
                         #   the OOSS port has not been executed for a tenant yet.
```

## Stack (workspace-wide)

- **Package manager**: pnpm v10.33 (workspace at root)
- **Node**: ≥22 (pinned via `.nvmrc`)
- **TypeScript**: strict everywhere; per-package `tsconfig.json` extends `tsconfig.base.json`
- **CI**: GitHub Actions on `uhg-runner` → JFrog mirror → OOSS (deploys SPA + legacy docs site). Functions deploy manually (`deploy-functions.yml` is a stub).
- **Backend**: Firebase project `mcoe-d`. Auth + Firestore + Functions. Two Firestore databases: `(default)` for prod, `nebula-docs-plat-dev` for dev.
- **Active env switch**: `NEBULA_ENV=dev|prod` in the root `.env`. Picks the GH App pair, the Firestore database, and the Cloud Function name suffix (`*Dev` vs unsuffixed).

## Hard rules

These override anything else, including memory guidance.

- **No "Mintlify" in shipped source.** Code, MDX, READMEs, JSDoc, identifiers, filenames, commit messages must not contain "Mintlify" or variants. `.claude/` design docs MAY name Mintlify factually as the reference being studied; never as positioning ("clone of X").
- **Brand is "Nebula Docs".** Editor SPA = "Nebula Docs Platform" (or "Studio"). Renderer + tooling = "Nebula Docs CLI". Never "Nebula CMS". "SSG" is informal shorthand only, never a package name or doc title.
- **No `.env.example` files.** Use gitignored `.env`. The root `.env` is the single source for `FIREBASE_*`, `NEBULA_*`, `FIRESTORE_*` shared values.
- **Tokens are frozen.** Don't change `packages/theme/src/themes/*.ts` color values, add themes, or restructure `ThemeTokens`. Consumer plumbing is fair game.
- **Behavior preservation on `products/docs/`.** The legacy Docusaurus site must build and render exactly as today. Run `pnpm --filter @mcoe/docs build` and treat broken-link warnings as errors.
- **GitHub host is GitHub Enterprise Cloud (`github.com/<org>`).** Not GHES. No `baseUrl` overrides on Octokit.
- **Firebase Functions secrets via `--data-file=`.** Never interactive paste. Matters most for the GitHub App PEM keys.
- **No component code in `index.tsx`.** Always `index.ts` re-export + `ComponentName.tsx`. Zero tolerance. (Docusaurus swizzles in `products/docs/src/theme/**` are the documented exception, going away with the CLI migration.)
- **Filtered function deploys only.** `pnpm --filter @nebula-docs/functions deploy:dev|prod`. Never the unfiltered `deploy` — it touches both env sets and risks deploying dev code into prod.

## Cross-cutting tips

- **Run from root**: `pnpm --filter @<scope>/<name> <script>`. Scopes: `@mcoe/docs` for the legacy site, `@nebula-docs/*` for everything else.
- **Adding a workspace dep**: `pnpm --filter @<scope>/<consumer> add @<scope>/<dep>` (uses `workspace:*` when target is local).
- **Cleanup**: `pnpm clean` removes per-package `node_modules`, `dist`, `build`, `.docusaurus`, plus root `node_modules`.

## Where to start in a new chat

1. Read this file for the lay of the land.
2. [.claude/decisions.md](.claude/decisions.md) — locked decisions and the gotchas that will bite you (Astro+React+MDX SSR boundary, dark-mode FOUC, auto-import shadowing, etc.).
3. [.claude/status.md](.claude/status.md) — what's currently open and what's next.
4. [.claude/nebula.md](.claude/nebula.md) and/or [.claude/nebula-cli.md](.claude/nebula-cli.md) — the pillar you're touching.
5. [.claude/conventions.md](.claude/conventions.md) — repo conventions beyond the hard rules above.
