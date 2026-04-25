# MCOE Docs — Claude Guide

Docusaurus v3.10 documentation site with four content instances (developers, resources, product, about), custom MUI theme, emotion styled components, and Firebase Analytics.

## Stack
- **Docusaurus** 3.10.0 with TypeScript strict mode
- **Styling**: emotion `@emotion/styled` for components + CSS modules for theme swizzles + global CSS tokens
- **UI kit**: MUI v9 (heavily customized under `src/theme/`)
- **Package manager**: pnpm v10.33 (locked)
- **Deploy**: GitHub Actions → JFrog → UHG OOSS

## Layout
```
docs/
  {developers,resources,product,about}/         # 4 plugin-content-docs instances
  announcements/                                 # blog plugin (custom BlogListPage/BlogPostItems swizzles render dates/authors/tags)
sidebars/{about,developers,product,resources}.ts + shared.ts
src/
  components/{landing,home,ui,mdx,illustrations,ThemeSwitcher}/  # each uses folder/Name.tsx + index.ts
  config/{navbar,footer,doc-instances,theme}.ts  # extracted from docusaurus.config.ts
  plugins/firebase-analytics.ts                  # GA client module
  theme/                                         # Docusaurus swizzles + MUI theme
  hooks/ lib/ pages/ css/ types/
docusaurus.config.ts                            # ~80 lines — orchestrates src/config/*
```

## Hard rules
- **Behavior preservation** — the site currently works exactly as intended. All refactors must be behavior-preserving. After any non-trivial change, run `pnpm build && pnpm typecheck` and verify visually in the dev server before declaring done.
- **No component code in `index.tsx`, ever.** Pattern is `ExportedName.tsx` (the code) + `index.ts` (pure re-export). Folder + filename + exported component name must all match (e.g. `NavbarLogo/NavbarLogo.tsx` exports `NavbarLogo`). **Swizzle exception**: under `src/theme/**`, folder names are Docusaurus-dictated (`Logo/`, `Layout/`, etc.) and must not be renamed — but the `.tsx` filename still matches the exported component (`NavbarLogo.tsx` inside `Logo/`). The repo has zero `index.tsx` files today; keep it that way.
- **Token values in [src/lib/tokens.ts](src/lib/tokens.ts) are frozen.** The three theme objects (`mcoeDefaultTokens`, `uhcTokens`, `optumTokens`) and the `ThemeTokens` interface are the approved foundation. The *consumer* layer (how tokens are read, CSS-var generation, theme switching) can be refactored; the data cannot.
- **MUI usage will grow.** Do not treat [src/theme/mui/](src/theme/mui/) as overengineering to trim — it's intentional infrastructure for upcoming work.

## Conventions
- **Imports**: use folder-level barrels (`from '@components/ui'`), not nested paths.
- **Styling**: emotion for component-scoped styles; CSS modules only in `src/theme/` swizzles; global CSS (`src/css/`) for tokens/Infima only. Don't introduce a fourth system.
- **New landing pages**: compose from [src/components/landing/primitives.ts](src/components/landing/primitives.ts) (HeroWrapper, HeroInner, HeroTitle, HeroSubtitle, PageBody, Content, SectionTitle, SectionSubtitle, `heroPatternBackground`). Don't copy an existing `*Landing.tsx`. Folder-per-component.
- **Sidebars**: all in [sidebars/](sidebars/). `developers.ts` is hand-curated; `about.ts`/`product.ts`/`resources.ts` use the `autoSidebar()` helper from `shared.ts`.
- **TypeScript**: strict is on. No `any` in first-party code. Use `unknown`/`never` or proper generics.

## Gotchas
- `pnpm typecheck` and `pnpm build` exist but are **not** wired into CI — run locally before pushing. `pnpm build` surfaces broken-link + broken-anchor warnings; treat them as errors.
- `.env` at root holds Firebase keys; `docusaurus.config.ts` reads them via `customFields`.
- `docusaurus.config.ts` is loaded by `jiti` in Node before webpack aliases are set up. **Do not use `@site/*` imports inside `src/config/**` or other files that the config pulls in at load time** — use relative paths. This will fail at build startup with `MODULE_NOT_FOUND`.
- Sidebars live in `sidebars/<name>.ts`; three of four are one-liners via `autoSidebar()`. Renaming a doc folder means updating `docs/<name>/`, `sidebars/<name>.ts`, and [src/config/doc-instances.ts](src/config/doc-instances.ts) (or the preset in `docusaurus.config.ts` for the `developers` instance).
- Navbar uses `activeBaseRegex` for cross-instance active state; test nav after any URL changes.
- Docusaurus ships `Props` as ambient `declare module '@theme/X'` augmentations. Inside a swizzle, **do not** `import type { Props } from '@theme/X'` — your local module shadows the ambient declaration. Define + export `Props` locally matching the shape from `@docusaurus/theme-classic/src/theme-classic.d.ts`.

## Deeper docs
- [.claude/architecture.md](.claude/architecture.md) — current structure + target architecture
- [.claude/refactor-plan.md](.claude/refactor-plan.md) — prioritized consolidation backlog
- [.claude/conventions.md](.claude/conventions.md) — patterns for new work
