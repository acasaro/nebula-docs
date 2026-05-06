# Nebula Docs — Claude Guide

pnpm-workspace monorepo for **Nebula Docs**, a multi-tenant documentation platform shipping:

- **Nebula Docs Platform** — the editor SPA in `products/nebula-platform/`. Vite + React 19 + Tailwind v4 + shadcn/ui + Tiptap. Substantially built; Phase 3 editor work in flight. See [.claude/nebula.md](.claude/nebula.md).
- **Nebula Docs CLI** — the renderer + tooling at `packages/cli/`. Astro + MDX + React + Tailwind v4. Distributed as `@nebula-docs/cli`; binary `nebula` (the only place the brand is shortened). See [.claude/nebula-cli.md](.claude/nebula-cli.md).
- **Shared packages** — `@nebula-docs/{components,schemas,theme,firebase}` exist; `@nebula-docs/mdx` and `@nebula-docs/analytics` are planned (extracted when their second consumer needs them).
- **Cloud Functions** in `functions/` — three deployed prod functions (`mintGithubToken`, `getInstallation`, `githubWebhook`) plus three deployed dev variants for the parallel `nebula-docs-dev` GitHub App.
- **Tenants** in `tenants/` — synthetic dev fixture and the in-flight MCOE migration target. Eventually each tenant moves to its own external repo.

`products/docs/` is the legacy MCOE Docusaurus site, kept as content archive. It will become tenant zero of the CLI's render pipeline once the CLI is buildable. Don't develop new features there — content moves; the rendering layer changes.

For workstream-by-workstream status, see [.claude/status.md](.claude/status.md). For repo conventions, see [.claude/conventions.md](.claude/conventions.md).

## Repo layout

```
products/
  nebula-platform/       # Nebula Docs Platform (editor SPA). Vite + React 19 + Tailwind v4
                         #   + shadcn/ui + Tiptap. The active product.
                         #   Package: @nebula-docs/platform.
  docs/                  # Legacy MCOE Docusaurus site. Content archive — will become
                         #   tenant zero of the CLI's render pipeline. No new features here.

packages/                # The seven-package framework
  cli/                   # @nebula-docs/cli — CLI binary (`nebula`) + Astro integration
                         #   + runtime + layouts + starter templates. Single npm package;
                         #   tenants pull this in as a dev dep and run `nebula build`.
                         #   Phase 0 + Phase 1 done; see .claude/status.md.
  components/            # @nebula-docs/components — React MDX block components (callout,
                         #   card, frame, code-block, tabs, accordion, mermaid, property,
                         #   steps, tree, update, etc.). Single source of truth, consumed
                         #   by Platform + CLI + legacy docs.
  schemas/               # @nebula-docs/schemas — Zod schemas + emitted JSON Schemas
                         #   (docs.json, theme.json, frontmatter, block props).
  theme/                 # @nebula-docs/theme — TS-first frozen design tokens. Source in
                         #   src/themes/*.ts. Generates dist/tokens.css.
  firebase/              # @nebula-docs/firebase — slim init + auth helpers. Platform-only
                         #   consumer. Accepts optional firestoreDbId.
  mdx/                   # @nebula-docs/mdx — pure MDX parse/serialize/frontmatter +
                         #   snippet resolver. PLANNED — extracted when CLI work starts;
                         #   used by both CLI (build-time) and Platform (editor-time).
  analytics/             # @nebula-docs/analytics — pluggable provider system. PLANNED —
                         #   extracted when CLI's analytics work happens. v1 ships
                         #   Firebase Analytics provider; abstracted for GA4/Plausible/
                         #   PostHog later.

tenants/                 # Synthetic + transitional tenant repos. Two starters
                         #   double as `nebula init` templates and as renderer
                         #   development fixtures.
  nebula-docs-starter/        # Full kitchen-sink starter — exercises every component,
                              #   nav pattern, frontmatter field. `nebula init` default.
                              #   Also the dev-fixture target for CLI work + visual-parity
                              #   audit against the editor.
  nebula-docs-starter-empty/  # Minimal "smallest valid tenant" — `nebula init --empty`.
                              #   Stays small as a reference for what the absolute
                              #   minimum tenant looks like.
  mcoe-docs/             # MCOE migration target. PLANNED — eventually external repo.

functions/               # Firebase Cloud Functions. Three prod functions (enterprise GH
                         #   App, VPC-bound to nebula-connector) + three dev variants
                         #   (public-GH dev App, no VPC). Shared webhook handler factory.
                         #   All deployed to mcoe-d.

vendor/                  # Reference material; deleted as we stop referencing each one.
  mintlify-nodemodule/         # CLI / build packages — architecture study source
  mintlify-components/         # Component port reference
  mint-docs-ref/               # Full upstream rendering reference
  mint-empty-starter-main/     # Blueprint for packages/cli/template/
  mcoe-docs-main/              # Reference for a populated tenant repo

.claude/
  architecture.md        # 10000-ft view: four pillars, seven packages, data flow
  nebula.md              # Platform architecture + settled decisions
  nebula-cli.md          # CLI architecture + locked decisions + tenant model
  conventions.md         # Repo-wide patterns
  status.md              # Live workstream snapshot + Upcoming workstreams
  archive/               # Historical context (old docs-site arch, April 2026 refactor log)
```

## Stack (workspace-wide)

- **Package manager**: pnpm v10.33 (workspace at root)
- **Node**: ≥22 (pinned via `.nvmrc`)
- **TypeScript**: strict everywhere; per-package `tsconfig.json` extends `tsconfig.base.json`
- **CI**: GitHub Actions on `uhg-runner` → JFrog mirror → OOSS (deploys SPA + docs site). Functions are deployed manually for now (`deploy-functions.yml` is a stub).
- **Backend**: Firebase project `mcoe-d`. Auth + Firestore + Functions. Two Firestore databases: `(default)` for prod-Enterprise data, `nebula-docs-plat-dev` for dev work.

## Workspace conventions (canonical: [.claude/conventions.md](.claude/conventions.md))

- Workspace deps: `"@nebula-docs/<name>": "workspace:*"`. Never reach across `products/*` for code; share via `packages/*`. The legacy docs site is `@mcoe/docs`.
- `packages/components/` is the canonical home for MDX block components. New components go there with a Zod schema in `packages/schemas/`.
- `packages/theme` data is **frozen**. Don't change color values, add themes, or restructure the `ThemeTokens` interface. Consumer plumbing is fair game.
- Folder-per-component: `FolderName/ExportedName.tsx` + `index.ts` re-export barrel. Folder, filename, and exported component name match. **Zero `index.tsx` files** in the repo. (Docusaurus swizzles in `products/docs/src/theme/**` are the documented exception.)

## Hard rules

These override anything else, including memory guidance.

- **No "Mintlify" in shipped source.** Code, MDX, READMEs, JSDoc, identifiers, filenames, and commit messages must not contain "Mintlify" or variants. `.claude/` design docs MAY name Mintlify when factually describing the actual reference being studied (e.g., `vendor/mint-docs-ref/`); never use positioning ("clone of X"). Refer to components by their generic name or "Nebula Docs <X>".
- **Brand is "Nebula Docs".** The editor app is "Nebula Docs Platform" (or "Studio"). The renderer + tooling is "Nebula Docs CLI". Never "Nebula CMS". "SSG" stays as informal shorthand for what the CLI does at build time, never as a package name or doc title.
- **No `.env.example` files.** Use gitignored `.env`. The unified root `.env` (Vite envDir + dotenv) is the single source for `FIREBASE_*`, `NEBULA_*`, `FIRESTORE_*` shared values.
- **Tokens are frozen.** Per above.
- **Behavior preservation on `products/docs/`.** Until the CLI migration completes, the Docusaurus site must build and render exactly as it does today. Run `pnpm --filter @mcoe/docs build` and treat broken-link warnings as errors.
- **GitHub host is GitHub Enterprise Cloud (`github.com/<org>`).** Not GHES. No `baseUrl` overrides on Octokit.
- **Firebase Functions secrets via `--data-file`.** Never interactive paste. Matters most for the GitHub App PEM private keys.
- **No component code in `index.tsx`.** Always `index.ts` re-export + `ComponentName.tsx`. Zero tolerance.

## Cross-cutting tips

- **Run from root**: `pnpm --filter @<scope>/<name> <script>`. Scopes: `@mcoe/docs` for the legacy site, `@nebula-docs/*` for everything else.
- **Adding a workspace dep**: `pnpm --filter @<scope>/<consumer> add @<scope>/<dep>` (uses `workspace:*` automatically when target is local).
- **Cleanup**: `pnpm clean` removes per-package `node_modules`, `dist`, `build`, `.docusaurus`, plus root `node_modules`.
- **Function deploys**: `pnpm --filter @nebula-docs/functions deploy:dev` or `deploy:prod`. Never the unfiltered `deploy` script — it touches both env sets and risks deploying local dev code into the prod function slots.
- **Active env switch**: `NEBULA_ENV=dev|prod` in the root `.env`. Picks the GitHub App pair, the Firestore database (`nebula-docs-plat-dev` vs `(default)`), and the deployed Cloud Function names (`*Dev` suffix vs unsuffixed) the SPA calls.

## Where to start in a new chat

1. Read [.claude/architecture.md](.claude/architecture.md) for the 10000-ft view (the four pillars, seven packages, data flow).
2. Read [.claude/status.md](.claude/status.md) for the live workstream snapshot — what's done, what's open, where the code lives, and kickoff prompts for upcoming workstreams.
3. Read [.claude/nebula.md](.claude/nebula.md) (Platform) and / or [.claude/nebula-cli.md](.claude/nebula-cli.md) (CLI) depending on which workstream you're touching.
4. Read [.claude/conventions.md](.claude/conventions.md) for repo-wide patterns.
5. The decisions documented in `nebula.md` and `nebula-cli.md` are settled — don't relitigate without flagging in the doc first.
