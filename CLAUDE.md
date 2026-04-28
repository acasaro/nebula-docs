# MCOE — Claude Guide

pnpm-workspace monorepo for the public **docs site** (Docusaurus, MDX-on-disk)
and shared component/theme packages. **Nebula** (the editor that will commit
MDX changes back to this repo via a custom GitHub App) is currently
unbuilt — the previous attempt was reverted. The rebuild plan lives at
[.claude/nebula.md](.claude/nebula.md). Read it before touching `products/nebula/`.

## Repo layout

```
products/
  docs/                  # Docusaurus 3.10 — the public docs site, MDX in repo

packages/
  components/            # React components for MDX block types (Frame, Steps,
                         #   Callout, Icon, VideoLoop, Heading, Text). Single
                         #   source of truth — products/docs/src/components/mdx/*
                         #   are thin re-export shims of these.
  schemas/               # Zod schemas, one per block type. Used for editor-side
                         #   validation when serializing back to MDX.
  theme/                 # TS-first design tokens. Generates dist/tokens.css
                         #   for Docusaurus's customCss.
  firebase/              # Slim init + auth helpers (Google + email). Will be
                         #   used by Nebula or replaced by Auth.js — TBD.

functions/               # Firebase Cloud Functions, empty stub. Available
                         #   for Nebula's webhook handlers if needed.

products/nebula/         # NOT YET CREATED. The next rebuild starts here.
                         #   See .claude/nebula.md for stack + phases.

vendor/
  mintlify-components/   # Reference implementation only — read source when
                         #   adding new MDX components (Tabs, Card, etc.).
                         #   MIT-licensed. NOT a workspace package (excluded
                         #   from pnpm-workspace.yaml). Delete once we no
                         #   longer need to reference it.
```

## Stack (workspace-wide)

- **Package manager**: pnpm v10.33 (locked, workspace at root)
- **Node**: ≥22 (pinned via `.nvmrc`)
- **TypeScript**: strict everywhere; per-package `tsconfig.json` extends `tsconfig.base.json`
- **CI**: GitHub Actions on `uhg-runner` → JFrog mirror → OOSS (docs site deploy)
- **Backend**: Firebase project (`mcoe-d`) — Auth + Firestore + Storage enabled,
  used today only for docs analytics; Nebula will use it for user identity +
  app config (connections, build status cache).

## Workspace conventions

- **Workspace deps**: `"@nebula-docs/components": "workspace:*"` etc. Never reach across
  `products/*` for code; share via `packages/*`.
- **`packages/components` is the canonical home for MDX components.** New
  components go there with their schema in `packages/schemas`. The MDX shim
  files in `products/docs/src/components/mdx/<X>/<X>.tsx` are one-liner
  re-exports — keep them that way.
- **Tokens are TS-first.** Edit values in `packages/theme/src/themes/*.ts`
  (data is frozen — see hard rule below). The CSS file at
  `packages/theme/dist/tokens.css` is generated; don't hand-edit. The docs
  site's `customCss` imports it; the prebuild script regenerates it.

## Architecture intent

**Content lives in git as MDX.** Docusaurus renders it at build/deploy
time. No runtime CMS, no Firestore as content store, no wildcard routes
in Docusaurus. Search continues to work via the existing
`@easyops-cn/docusaurus-search-local` indexing.

**Nebula is a separate Vite SPA** (rebuild in progress) that:
- Authenticates editors via Firebase Auth (later: enterprise SSO via OIDC)
- Connects to the docs repo via a custom **GitHub App** installed by an
  admin (acts as `nebula[bot]` for commits — never uses individual users'
  GitHub tokens)
- Lets editors visually edit MDX files
- Commits + opens PRs via Octokit
- Surfaces build/PR status by listening to GitHub webhooks

See [.claude/nebula.md](.claude/nebula.md) for the full rebuild plan.

---

## Docs site (`products/docs/`)

Docusaurus v3.10 with four content instances (`developers`, `resources`,
`product`, `about`), an announcements blog, custom MUI theme, and Firebase
Analytics. Content is MDX-on-disk in `docs/{instance}/`. Rendered components
come from `packages/components` via the MDX shims.

### Layout

```
products/docs/
  docs/
    {developers,resources,product,about}/        # 4 plugin-content-docs instances
    announcements/                               # blog plugin (BlogListPage/BlogPostItems swizzles render dates/authors/tags)
  sidebars/{about,developers,product,resources}.ts + shared.ts
  src/
    components/{landing,home,ui,mdx,illustrations,ThemeSwitcher}/  # folder/Name.tsx + index.ts
    config/{navbar,footer,doc-instances,theme}.ts                 # extracted from docusaurus.config.ts
    plugins/firebase-analytics.ts                # GA client module
    theme/                                       # Docusaurus swizzles + MUI theme
    hooks/ lib/ pages/ css/ types/
  docusaurus.config.ts                           # ~80 lines — orchestrates src/config/*
  .env                                           # Firebase keys for Analytics
```

### Hard rules

- **Behavior preservation** — the site currently works exactly as intended.
  All refactors must be behavior-preserving. After any non-trivial change,
  run `pnpm --filter @mcoe/docs build` (and typecheck) and verify visually
  in the dev server before declaring done.
- **No component code in `index.tsx`, ever.** Pattern is `ExportedName.tsx`
  (the code) + `index.ts` (pure re-export). Folder + filename + exported
  component name must all match. **Swizzle exception**: under
  `products/docs/src/theme/**`, folder names are Docusaurus-dictated
  (`Logo/`, `Layout/`, etc.) and must not be renamed — but the `.tsx`
  filename still matches the exported component. The repo has zero
  `index.tsx` files today; keep it that way.
- **Token values in [packages/theme/src/themes/*.ts](packages/theme/src/themes) are frozen.**
  The three theme objects (`mcoeDefaultTokens`, `uhcTokens`, `optumTokens`)
  and the `ThemeTokens`/`GlobalTokens` interfaces are the approved
  foundation. The *consumer* layer (CSS-var generation, theme switching)
  can be refactored; the data cannot.
- **MUI usage will grow.** Do not treat
  [products/docs/src/theme/mui/](products/docs/src/theme/mui/) as
  overengineering to trim — it's intentional infrastructure for upcoming
  work.

### Conventions

- **Imports**: use folder-level barrels (`from '@components/ui'`), not
  nested paths. Path aliases are defined in
  [products/docs/tsconfig.json](products/docs/tsconfig.json).
- **Styling**: emotion for component-scoped styles; CSS modules only in
  `products/docs/src/theme/` swizzles; global CSS (`products/docs/src/css/`)
  for tokens/Infima only. Don't introduce a fourth system.
- **MDX components**: import from the shim files
  (`products/docs/src/components/mdx/<X>`). Those re-export from
  `@nebula-docs/components`. To add a new MDX-importable component, add a folder to
  `packages/components/src/<type>/`, then add a one-line shim under
  `products/docs/src/components/mdx/<Type>/`.
- **New landing pages**: compose from
  [products/docs/src/components/landing/primitives.ts](products/docs/src/components/landing/primitives.ts)
  (HeroWrapper, HeroInner, HeroTitle, etc.). Don't copy an existing
  `*Landing.tsx`. Folder-per-component.
- **Sidebars**: all in [products/docs/sidebars/](products/docs/sidebars/).
  `developers.ts` is hand-curated; `about.ts`/`product.ts`/`resources.ts`
  use the `autoSidebar()` helper from `shared.ts`.
- **TypeScript**: strict is on. No `any` in first-party code. Use
  `unknown`/`never` or proper generics.

### Gotchas

- `pnpm --filter @mcoe/docs typecheck` and `... build` exist but are
  **not** wired into CI — run locally before pushing. The build surfaces
  broken-link + broken-anchor warnings; treat them as errors.
- The `prebuild` script regenerates `packages/theme/dist/tokens.css` from
  the TS sources. If you change theme data, the next docs build picks it
  up automatically. **Never hand-edit `dist/tokens.css`** — it's
  generated.
- `.env` lives in `products/docs/.env`; `docusaurus.config.ts` reads it
  via `dotenv.config()` (cwd-relative — runs correctly because pnpm
  filter cd's into the package).
- `docusaurus.config.ts` is loaded by `jiti` in Node before webpack
  aliases are set up. **Do not use `@site/*` imports inside
  `src/config/**`** — use relative paths. This will fail at build startup
  with `MODULE_NOT_FOUND`.
- Sidebars live in `sidebars/<name>.ts`; three of four are one-liners
  via `autoSidebar()`. Renaming a doc folder means updating
  `docs/<name>/`, `sidebars/<name>.ts`, and
  [products/docs/src/config/doc-instances.ts](products/docs/src/config/doc-instances.ts)
  (or the preset in `docusaurus.config.ts` for the `developers`
  instance).
- Navbar uses `activeBaseRegex` for cross-instance active state; test
  nav after any URL changes.
- Docusaurus ships `Props` as ambient `declare module '@theme/X'`
  augmentations. Inside a swizzle, **do not**
  `import type { Props } from '@theme/X'` — your local module shadows
  the ambient declaration. Define + export `Props` locally matching the
  shape from `@docusaurus/theme-classic/src/theme-classic.d.ts`.

### Deploy

[.github/workflows/build-deploy.yml](.github/workflows/build-deploy.yml)
→ `pnpm --filter @mcoe/docs build` → uploads `products/docs/build/` to
OOSS bucket `mcoe-dev-docs`.

### Reference docs

(Written before the monorepo conversion; internal paths reference the old
`src/` layout. Treat content as authoritative, paths as historical until
updated.)

- [.claude/architecture.md](.claude/architecture.md) — docs-site structure + target architecture
- [.claude/refactor-plan.md](.claude/refactor-plan.md) — prioritized consolidation backlog
- [.claude/conventions.md](.claude/conventions.md) — patterns for new work

---

## Nebula (rebuild in progress)

The previous attempt — Vite + MUI + runtime-CMS via Firestore — was reverted.
The new plan: Vite + React + Tailwind + shadcn/ui, **git-based MDX**, custom
GitHub App for repo writes, Firebase Auth for user identity.

Read [.claude/nebula.md](.claude/nebula.md) for:
- Full architecture rationale
- Stack decisions
- What stays from prior work (`packages/{blocks,schemas,theme,firebase}`)
- Phase 0 → 6 build plan
- Open decisions still needing answers (hosting, editor library, etc.)

`products/nebula/` does not exist yet. Phase 0 creates it.

### What NOT to do

- Don't reintroduce a runtime-CMS pattern (no Firestore-as-content, no
  wildcard routes in Docusaurus, no `<CmsPage>`).
- Don't reuse the deleted Nebula scaffolding (MUI starter, `BlockEditor`
  cards, `EditableText` based on contenteditable, etc.). That lineage
  was the failed attempt.
- Don't drop Docusaurus from the docs site.
- Don't replace `@nebula-docs/theme` with another tokens system.

---

## Packages (`packages/*`)

All packages export from `src/index.ts` directly (no build step for dev —
TS resolves via paths). Each has a minimal `package.json` and `tsconfig.json`
extending `tsconfig.base.json`.

- **`@nebula-docs/components`** — React components for MDX block types. Each block
  has `<Type>.tsx` (natural API for MDX use) and an `index.ts` barrel.
  Heading, Text, Callout, Icon, Frame, VideoLoop, Steps, Step are all
  ported 1:1 from the original `products/docs/src/components/mdx/*`.
- **`@nebula-docs/schemas`** — Zod schemas, one per block type. Used by Nebula
  for editor-side prop validation when serializing back to MDX.
- **`@nebula-docs/theme`** — TS-first design tokens. Source of truth in
  `src/themes/*.ts` (frozen). `scripts/build-css.ts` generates
  `dist/tokens.css` for Docusaurus's customCss. React provider for
  runtime theme switching.
- **`@nebula-docs/firebase`** — Slim Firebase wrapper: init + auth helpers
  (Google + email). May be replaced by Auth.js v5 in Nebula or kept as
  the Firebase wrapper — decided in Nebula Phase 1.

---

## Functions (`functions/`)

Empty Firebase Cloud Functions package, Node 22. Available for Nebula's
needs (GitHub webhook handlers, build status cache, etc.) once Nebula's
architecture is clearer. Currently unused.

---

## Cross-cutting tips

- **Run from root**: `pnpm --filter @<scope>/<name> <script>` (or shortcuts:
  `pnpm dev:docs`, `pnpm build:docs`). Scope is `@mcoe` for the docs site,
  `@nebula` for everything else.
- **Adding a workspace dep**: `pnpm --filter @<scope>/<consumer> add @<scope>/<dep>`
  (uses `workspace:*` automatically when target is local).
- **Cleanup**: `pnpm clean` removes per-package `node_modules`, `dist`,
  `build`, `.docusaurus`, plus root `node_modules`.
- **Firebase env vars**: docs uses unprefixed (`FIREBASE_*`) read via
  `dotenv.config()`. Nebula's prefix convention will be set in Phase 0.
