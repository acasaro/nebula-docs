# MCOE — Claude Guide

pnpm-workspace monorepo housing the public **docs site** (Docusaurus) and **Nebula**, the in-house block-based CMS that will feed it. Both apps share Firebase as the backend.

## Repo layout

```
products/
  docs/                  # Docusaurus 3.10 — currently MDX-on-disk; will consume packages/renderer
                         #   from Firestore at runtime once Nebula starts authoring content
  nebula-cms/            # Vite + React 19 + MUI v9 + Firebase. Block-based CMS (in dev)

packages/
  firebase/              # The Firebase access layer. Firestore + Auth + Storage + lock primitives.
                         # ALL Firebase SDK calls live here. UI code never imports firebase/* directly.
                         # Used by both products/.
  blocks/                # One folder per block type: { schema, EditForm, Render }. Used by Nebula
                         # editor and docs site renderer.
  renderer/              # <BlockRenderer/> — recursive, consumes the blocks registry.
  schemas/               # zod schemas. Re-exported by functions/ for server-side write validation.

functions/               # Firebase Cloud Functions (Node 22). Validate writes, audit log,
                         # snippet detach-on-delete, asset processing.

vendor/
  Minimal_Theme/         # Reference-only. The starter for products/nebula-cms/ was copied from
                         # vendor/Minimal_Theme/starter-vite-ts. Components are copied across as
                         # Nebula evolves. DELETE this folder once CMS is feature-complete.
```

## Stack (workspace-wide)

- **Package manager**: pnpm v10.33 (locked, workspace at root)
- **Node**: ≥22 (Firebase Functions strict on 22)
- **TypeScript**: strict everywhere; per-package `tsconfig.json` extends `tsconfig.base.json`
- **CI**: GitHub Actions on `uhg-runner` → JFrog mirror → OOSS (docs) / Firebase Hosting (Nebula) / Firebase (Functions)
- **Backend**: single Firebase project shared by docs + Nebula + Functions

## Workspace conventions

- **Workspace deps**: `"@mcoe/firebase": "workspace:*"` etc. Never reach across `products/*` for code; share via `packages/*`.
- **No Firebase SDK calls outside `packages/firebase/`.** UI components import named operations (`subscribeToPage`, `savePageDraft`) — never `firebase/firestore` directly. This boundary is load-bearing.
- **Block schemas (`packages/schemas`) are the contract.** Zod schemas drive: (a) Nebula's edit forms, (b) the renderer's prop types, (c) Cloud Function write validation. Same schema, three consumers.
- **No third-party CMS/editor frameworks** (BlockNote, TipTap, Lexical, Slate, Editor.js, Plate). Nebula's editor is home-grown — block composition with form-driven config, no contenteditable, no WYSIWYG. Standard libraries (MUI, react-hook-form, zod, etc.) are fine.

## Architecture intent (CMS pipeline)

- Nebula writes pages as `Block[]` trees into Firestore (`spaces/{id}/pages/{id}` with `blocks` draft + `publishedBlocks` live)
- Docs site registers wildcard routes per docs instance (`/developers/*`, etc.) → `<CmsPage>` subscribes to Firestore via `onSnapshot` and renders via `<BlockRenderer>`
- **Edits appear live without rebuild.** OOSS bucket returns the Docusaurus shell on 404, SPA hydrates, router resolves. Pure runtime rendering.
- Cloud Functions: validate writes against zod schemas, append audit log on every page write, detach snippet refs on delete, image processing on Storage upload
- Locking: TTL-based advisory lock (`lockedBy: { uid, expiresAt }`) with client heartbeat — no cron

---

## Docs site (`products/docs/`)

Docusaurus v3.10 with four content instances (`developers`, `resources`, `product`, `about`), an announcements blog, custom MUI theme, and Firebase Analytics. Currently MDX-on-disk; conversion to CMS-served runtime rendering is the in-flight work.

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

- **Behavior preservation** — the site currently works exactly as intended. All refactors must be behavior-preserving. After any non-trivial change, run `pnpm --filter @mcoe/docs build` (and typecheck) and verify visually in the dev server before declaring done.
- **No component code in `index.tsx`, ever.** Pattern is `ExportedName.tsx` (the code) + `index.ts` (pure re-export). Folder + filename + exported component name must all match (e.g. `NavbarLogo/NavbarLogo.tsx` exports `NavbarLogo`). **Swizzle exception**: under `products/docs/src/theme/**`, folder names are Docusaurus-dictated (`Logo/`, `Layout/`, etc.) and must not be renamed — but the `.tsx` filename still matches the exported component (`NavbarLogo.tsx` inside `Logo/`). The repo has zero `index.tsx` files today; keep it that way.
- **Token values in [products/docs/src/lib/tokens.ts](products/docs/src/lib/tokens.ts) are frozen.** The three theme objects (`mcoeDefaultTokens`, `uhcTokens`, `optumTokens`) and the `ThemeTokens` interface are the approved foundation. The *consumer* layer (how tokens are read, CSS-var generation, theme switching) can be refactored; the data cannot.
- **MUI usage will grow.** Do not treat [products/docs/src/theme/mui/](products/docs/src/theme/mui/) as overengineering to trim — it's intentional infrastructure for upcoming work.

### Conventions

- **Imports**: use folder-level barrels (`from '@components/ui'`), not nested paths. Path aliases are defined in [products/docs/tsconfig.json](products/docs/tsconfig.json).
- **Styling**: emotion for component-scoped styles; CSS modules only in `products/docs/src/theme/` swizzles; global CSS (`products/docs/src/css/`) for tokens/Infima only. Don't introduce a fourth system.
- **New landing pages**: compose from [products/docs/src/components/landing/primitives.ts](products/docs/src/components/landing/primitives.ts) (HeroWrapper, HeroInner, HeroTitle, HeroSubtitle, PageBody, Content, SectionTitle, SectionSubtitle, `heroPatternBackground`). Don't copy an existing `*Landing.tsx`. Folder-per-component.
- **Sidebars**: all in [products/docs/sidebars/](products/docs/sidebars/). `developers.ts` is hand-curated; `about.ts`/`product.ts`/`resources.ts` use the `autoSidebar()` helper from `shared.ts`.
- **TypeScript**: strict is on. No `any` in first-party code. Use `unknown`/`never` or proper generics.

### Gotchas

- `pnpm --filter @mcoe/docs typecheck` and `... build` exist but are **not** wired into CI — run locally before pushing. The build surfaces broken-link + broken-anchor warnings; treat them as errors.
- `.env` lives in `products/docs/.env`; `docusaurus.config.ts` reads it via `dotenv.config()` (cwd-relative — runs correctly because pnpm filter cd's into the package).
- `docusaurus.config.ts` is loaded by `jiti` in Node before webpack aliases are set up. **Do not use `@site/*` imports inside `src/config/**` or other files that the config pulls in at load time** — use relative paths. This will fail at build startup with `MODULE_NOT_FOUND`.
- Sidebars live in `sidebars/<name>.ts`; three of four are one-liners via `autoSidebar()`. Renaming a doc folder means updating `docs/<name>/`, `sidebars/<name>.ts`, and [products/docs/src/config/doc-instances.ts](products/docs/src/config/doc-instances.ts) (or the preset in `docusaurus.config.ts` for the `developers` instance).
- Navbar uses `activeBaseRegex` for cross-instance active state; test nav after any URL changes.
- Docusaurus ships `Props` as ambient `declare module '@theme/X'` augmentations. Inside a swizzle, **do not** `import type { Props } from '@theme/X'` — your local module shadows the ambient declaration. Define + export `Props` locally matching the shape from `@docusaurus/theme-classic/src/theme-classic.d.ts`.

### Deploy

[.github/workflows/build-deploy.yml](.github/workflows/build-deploy.yml) → `pnpm --filter @mcoe/docs build` → uploads `products/docs/build/` to OOSS bucket `mcoe-dev-docs`. The OOSS bucket returns the Docusaurus shell HTML for unknown paths (404 status, but functional SPA fallback) — runtime CMS routes will rely on this.

### Reference docs

(Written before the monorepo conversion; internal paths reference the old `src/` layout. Treat content as authoritative, paths as historical until updated.)

- [.claude/architecture.md](.claude/architecture.md) — docs-site structure + target architecture
- [.claude/refactor-plan.md](.claude/refactor-plan.md) — prioritized consolidation backlog
- [.claude/conventions.md](.claude/conventions.md) — patterns for new work

---

## Nebula CMS (`products/nebula-cms/`)

Vite + React 19 + MUI v9 + Firebase. Block-based CMS that authors pages as `Block[]` trees into Firestore. The docs site renders those trees at runtime.

**Status**: scaffolded from the Minimal Theme starter (`vendor/Minimal_Theme/starter-vite-ts/`). The starter still has 5 known TS errors from the v7→v9 MUI migration (`inputProps` → `slotProps.input`, `titleTypographyProps` → `slotProps.title`, etc.) that will be cleaned up as those starter files are replaced with real CMS UI.

### Conventions (in formation)

- Block-based composition only. **No WYSIWYG, no contenteditable.** Each block has a config form (zod → react-hook-form), no inline rich text engine.
- Inline formatting in text blocks is markdown-as-string (`**bold**`, `[link](url)`) — rendered by a small home-grown markdown subset.
- Every component the editor inserts is a registered block in `packages/blocks`. No "custom component" escape hatch — promote to a real block if reused.
- Single editor per page at a time; TTL-based advisory lock interpreted at read time, no cron.
- Draft/published only (no full revision history) for MVP.

### Deploy

[.github/workflows/deploy-nebula.yml](.github/workflows/deploy-nebula.yml) — stub. Will deploy `products/nebula-cms/dist/` to Firebase Hosting once the Firebase project is provisioned.

---

## Packages (`packages/*`)

All packages export from `src/index.ts` directly (no build step required for dev — TS resolves via paths). Each has a minimal `package.json` and `tsconfig.json` extending `tsconfig.base.json`.

- **`@mcoe/firebase`** — typed converters, Firestore queries/mutations, real-time hooks, lock primitives, Auth + Storage helpers. Internal layout: `firestore/`, `auth/`, `storage/`, `init/`. **The only package that imports `firebase/*` directly.**
- **`@mcoe/blocks`** — one folder per block type with `{ schema, EditForm, Render }` triplet. Registry auto-derived from filesystem (or manual map).
- **`@mcoe/renderer`** — `<BlockRenderer blocks={...}>` recurses through Block tree, looks up block in registry, renders.
- **`@mcoe/schemas`** — zod schemas. Imported by Nebula (form generation), `@mcoe/blocks` (per-block schemas re-exported), `functions/` (server-side validation). Single source of truth.

---

## Functions (`functions/`)

Firebase Cloud Functions package, Node 22, deployed independently. Imports `@mcoe/schemas` for write validation.

Planned surface:
- `validatePageWrite` — onWrite trigger, rejects writes that fail zod schemas
- `appendAuditEntry` — onWrite trigger, appends to `audit/` collection
- `detachSnippetReferences` — onDelete trigger for snippets, inlines block trees into referencing pages
- `processAssetUpload` — onObjectFinalize trigger for Firebase Storage, generates webp + responsive sizes

[.github/workflows/deploy-functions.yml](.github/workflows/deploy-functions.yml) — stub. Wires up after Firebase project is provisioned.

---

## Cross-cutting tips

- **Run from root**: `pnpm --filter @mcoe/<name> <script>` (or top-level shortcuts: `pnpm dev:docs`, `pnpm dev:nebula`, `pnpm build:docs`, `pnpm build:nebula`).
- **Adding a workspace dep**: `pnpm --filter @mcoe/nebula-cms add @mcoe/firebase` (uses `workspace:*` automatically when target is local).
- **Cleanup**: `pnpm clean` removes per-package `node_modules`, `dist`, `build`, `.docusaurus`, plus root `node_modules`.
- **Firebase env vars**: docs uses unprefixed (`FIREBASE_*`); Nebula uses `VITE_FIREBASE_*` (Vite requires prefix). Both populated by the same secrets in CI.
