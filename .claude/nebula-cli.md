# Nebula Docs CLI — Architecture & Build Plan

This is the design doc for the **Nebula Docs CLI**: the static site generator
that pairs with [Nebula Docs Platform](nebula.md) and renders docs sites for any team
in the enterprise.

The previous direction kept Docusaurus as the renderer and treated Nebula as
"just an editor". That made sense when the docs site was only MCOE's. The
new direction — **docs sites as a self-serve platform** — makes Docusaurus
the wrong fit: per-tenant configuration, branding, and routing have to live
in a single declarative file (`docs.json`) the Platform can edit, not in a
TypeScript module that imports plugins. We need a thinner, more flexible
renderer we own end-to-end.

This doc defines that CLI. Read [nebula.md](nebula.md) first if you haven't —
the Platform half of the story is there.

> **Every architectural choice in this doc is filtered through one question:**
> "Does this scale to N enterprise tenants, or only to MCOE?" When the
> Mintlify mental model and the MCOE current-state diverge, the multi-tenant
> answer wins.

## TL;DR

- **Nebula Docs CLI is a multi-tenant docs renderer.** Any team in the
  enterprise can stand up a docs site by creating a repo with a `docs.json`,
  some MDX content, and a `theme.json` override. Their CI runs
  `nebula build` and uploads `dist/` to their OOSS bucket.
- **MCOE is tenant zero.** `products/docs` migrates onto the CLI; the visual
  result is preserved or improved (Stripe-class clean is the bar).
- **`docs.json` is the contract** between Nebula Docs Platform and the CLI. Nebula
  edits it visually; the CLI renders from it. Same schema, two consumers.
- **Stack: Astro + React + Tailwind v4 + MDX.** Static-first (zero JS by
  default), React components hydrate as islands where interactivity is
  needed (theme switcher, search box, tabs). Stripe-class perf becomes the
  baseline, not a goal.
- **Distribution: an npm package + CLI.** `@nebula-docs/cli` ships the
  `nebula` binary (the only place "Nebula Docs" is shortened). Tenants pull it in like any other dev dep, then run
  `nebula build`. Versioned releases, semver discipline.
- **Theming layers on `@nebula-docs/theme`.** Tenants pick a base theme
  (`mcoe-default`, `uhc`, `optum`) or supply their own via a `theme.json`
  override. The `applyTokensToDOM()` runtime work that already exists in
  MCOE becomes baseline for every tenant.
- **Components extend `@nebula-docs/components`.** Existing 1:1 ports stay;
  the Mintlify block surface (Tabs, Card, Accordion, ParamField,
  ResponseField, CodeGroup, Tile, Tooltip, Mermaid, Update, Tree, etc.) is
  added so feature parity with `vendor/mint-docs-ref/` is met. Tenants can
  add custom components in their repo.
- **Search: Pagefind.** Static, build-time indexed, zero runtime dependency,
  per-tenant by construction. Replaces `@easyops-cn/docusaurus-search-local`.

## Why our own (and not Docusaurus / Starlight / Mintlify / Next)

Multi-tenancy reframes every option that worked for "just MCOE":

| Option | Why not |
|---|---|
| **Docusaurus (status quo)** | `docusaurus.config.ts` is a TS module that imports plugins, swizzles components, and registers analytics modules. Fine for one site we control, wrong for a config-driven multi-tenant platform. The Platform produces declarative JSON; Docusaurus would need a translation layer that fights its plugin model. Per-tenant theming ends up in code, not data. |
| **Astro Starlight** | The closest off-the-shelf fit. Opinionated visual language we'd have to override per tenant, and Starlight components don't match `@nebula-docs/components`. We'd be re-skinning a starter rather than building a platform that *is* the renderer. |
| **Next.js App Router + `output: export`** | Works, and shares the React/Tailwind world with Nebula Docs Platform. But Next ships heavier default JS than is right for content sites, and across N tenants the bundle-size and build-time costs compound. The features that justify Next (server components, RSC streaming) aren't relevant to static docs. |
| **Custom on raw Vite + React Router** | Total control, but reinvents what Astro already nails for content sites: file-based routing, MDX integration, partial hydration, image optimization, prerendering. Net cost > net benefit. |
| **Mintlify (the actual product)** | Closed source, hosted-only. Can't run inside UHG infra (firewall + compliance), can't be customized at the level we need, can't be the substrate for a platform we own. **Use as reference only** (`vendor/mint-docs-ref/` and `vendor/mint-starter-docs-template/` are vendored verbatim, MIT-licensed, and serve as our mental model — every "mint" name in our code becomes "nebula docs"). Delete the vendored copies once we no longer reference them. |

**Astro is the right base** because:

- **Static-first.** Default output is HTML; React only ships JS for the
  islands that need it. A tenant who writes pure prose pays zero JS cost.
- **MDX is native** via `@astrojs/mdx`. Our `packages/components` work
  unchanged.
- **Vite under the hood.** Same dev-server feel as Nebula Docs Platform — one mental
  model across the monorepo.
- **Pluggable.** Astro integrations are first-class (sitemap, image,
  Pagefind for search). We add what we need, no more.
- **Multi-tenant-friendly by construction.** Tenants who never touch
  interactivity get pure HTML. Tenants who do (a UHC API playground, say)
  get islands without the rest of the site paying for it.

## How multi-tenancy works

```
                       ┌──────────────────────┐
                       │  Nebula Docs Platform (SPA)    │
                       │  Vite + React + …    │
                       │                      │
                       │  Edits docs.json     │
                       │  + MDX files via     │
                       │  the GitHub App      │
                       └──────────┬───────────┘
                                  │ commits
                                  ▼
            ┌──────────────────────────────────────────┐
            │           Tenant docs repos              │
            │                                          │
            │   ┌───────────┐ ┌───────────┐ ┌────────┐ │
            │   │ mcoe-docs │ │ uhc-docs  │ │  ...   │ │
            │   │           │ │           │ │        │ │
            │   │ docs.json │ │ docs.json │ │        │ │
            │   │ theme.json│ │ theme.json│ │        │ │
            │   │ content/  │ │ content/  │ │        │ │
            │   │ assets/   │ │ assets/   │ │        │ │
            │   │ components│ │ components│ │        │ │
            │   │   /*.tsx  │ │   /*.tsx  │ │        │ │
            │   └─────┬─────┘ └─────┬─────┘ └───┬────┘ │
            └─────────┼─────────────┼───────────┼──────┘
                      │  CI runs    │           │
                      │  npx        │           │
                      │  nebula-    │           │
                      │  docs build │           │
                      ▼             ▼           ▼
                  ┌─────────┐   ┌─────────┐   ┌─────────┐
                  │ OOSS:   │   │ OOSS:   │   │ ...     │
                  │ mcoe-   │   │ uhc-    │   │         │
                  │ docs    │   │ docs    │   │         │
                  └─────────┘   └─────────┘   └─────────┘
```

Each tenant **owns**:

- Their docs repo (`docs.json`, content, assets, optional theme + components)
- Their GitHub App installation (one Nebula App, installed per repo)
- Their CI pipeline (one workflow that runs `nebula build` and uploads)
- Their bucket / domain (e.g., `docs.uhc.uhg.com`)

Each tenant **does NOT** own:

- The CLI itself — `@nebula-docs/cli` is a versioned npm package
- The component library — `@nebula-docs/components` ships a full set
- The base theme system — `@nebula-docs/theme` is the foundation
- The Platform — they share Nebula. Their users sign in, the Platform shows them the
  GitHub App installations they have access to, they edit their own repo.

The CLI is invisible to editors. They never see Astro, never run a build
locally (unless they want to), never touch theme tokens unless they're
designing a brand kit. The Platform gives them a visual editor over `docs.json`
and MDX; everything else is the platform.

### Onboarding flow for a new tenant

1. Team lead creates a repo (e.g., `optum-docs`).
2. Runs `npx nebula init` → scaffolds `docs.json`, `theme.json`,
   `content/index.mdx`, `package.json`, `.github/workflows/deploy.yml`.
3. Installs the Nebula GitHub App on the repo (via the install link from
   the Platform, or directly).
4. Editors sign into Nebula Docs Platform with their corporate email; the Platform lists
   the new repo under their accessible installations.
5. CI runs on first push → uploads `dist/` to their OOSS bucket → live.

No one in our team is required for steps 1–5 once the platform exists. That
is the multi-tenant bar.

## Tenant repo layout

A tenant repo is **mostly content + config**, with optional escape hatches
for custom components and themes. The shape:

```
<tenant>-docs/
├── docs.json                     # The contract. Platform reads/writes this.
├── theme.json                    # Optional: per-tenant theme overrides.
├── package.json                  # Pulls @nebula-docs/cli as a dev dep.
├── .github/workflows/deploy.yml  # Generated by `init`. Runs build → bucket.
│
├── content/
│   ├── index.mdx                 # Home page.
│   ├── developers/
│   │   ├── overview.mdx
│   │   └── mobile-ci/
│   │       ├── about.mdx
│   │       └── workflows/
│   │           └── index.mdx
│   ├── resources/...
│   └── snippets/                 # Reusable MDX fragments (not pages).
│       └── prerequisites.mdx
│
├── assets/
│   ├── logo-light.svg
│   ├── logo-dark.svg
│   ├── favicon.svg
│   └── images/...
│
├── components/                   # Optional: tenant-specific React components.
│   └── BitrisePrereq.tsx         # Auto-imported in MDX (registered by the CLI).
│
├── public/                       # Optional: passthrough static files.
│   └── _redirects
│
└── nebula.config.ts              # Optional: programmatic escape hatch.
                                  # Most tenants won't have this.
```

**Routes are derived from `content/`**, the same way Mintlify and Docusaurus
do it: `content/foo/bar.mdx` → `/foo/bar`. `index.mdx` is the root of its
folder. No magic, no surprises.

**`docs.json` controls navigation, branding, and platform behavior.** It
does NOT control routing — routing comes from the file tree. This split
matters: Nebula Docs Platform edits `docs.json` to reorganize the sidebar, but moving
a *file* is a separate operation (rename + commit) the Platform performs on
content, not config.

**`theme.json` is a JSON Patch over a base theme.** Most tenants pick
`"base": "uhc"` or `"base": "optum"` and stop there. A tenant building a
brand kit overrides specific tokens.

**`components/` is auto-registered.** Any `.tsx` file in this directory is
imported and made available in MDX without an explicit import. Convention
over config: `components/BitrisePrereq.tsx` exposes `<BitrisePrereq />` in
every MDX file.

**`nebula.config.ts` is the escape hatch.** Most tenants never touch it.
For a tenant that needs a custom remark plugin or a non-standard build
step, this file exports an extension config the CLI merges in. We accept
that this is a TS module the Platform can't edit; tenants who use it accept
that those changes happen via PR, not via Nebula.

## The `docs.json` contract

This is the most load-bearing schema in the system. It's the contract
between the Platform (which produces it) and the CLI (which consumes it).
Designed to **subset Mintlify's `docs.json`** — close enough that
`vendor/mint-starter-docs-template/docs.json` is a near-drop-in mental
model, but with our additions for theme layering and analytics:

```jsonc
{
  "$schema": "https://nebula-docs.uhg.com/docs.schema.json",

  // ── Identity ──────────────────────────────────────────────────────────
  "name":        "MCOE",
  "description": "Mobile Center of Excellence — UHG mobile platform docs",
  "favicon":     "/assets/favicon.svg",
  "logo": {
    "light": "/assets/logo-light.svg",
    "dark":  "/assets/logo-dark.svg",
    "href":  "/"
  },

  // ── Theming ───────────────────────────────────────────────────────────
  // The CLI composes: globalTokens → base theme → theme.json → :root vars.
  "theme": {
    "base":          "mcoe-default",        // or "uhc" | "optum" | tenant id
    "extends":       "./theme.json",        // optional override file
    "switcherEnabled": true,                // show the theme picker
    "switcherOptions": ["mcoe-default", "uhc", "optum"]
  },

  // ── Navigation ────────────────────────────────────────────────────────
  // Mirrors Mintlify's tabs → groups → pages tree. Pages are file paths
  // (without .mdx extension), relative to content/.
  "navigation": {
    "tabs": [
      {
        "tab":  "Developers",
        "icon": "code",
        "groups": [
          {
            "group": "Mobile CI",
            "pages": [
              "developers/mobile-ci/about",
              "developers/mobile-ci/migrate-github-to-bitrise",
              {
                "group": "Mobile Workflows",
                "pages": [
                  "developers/mobile-ci/workflows/index",
                  "developers/mobile-ci/workflows/react-native-ci"
                ]
              }
            ]
          },
          { "group": "Release Management", "pages": [...] }
        ]
      },
      { "tab": "Resources", "icon": "book",   "groups": [...] },
      { "tab": "Product",   "icon": "shapes", "groups": [...] },
      { "tab": "About",     "icon": "info",   "groups": [...] }
    ],

    // Persistent sidebar items that aren't part of any tab.
    "anchors": [
      { "anchor": "Bitrise",  "href": "https://bitrise.io",            "icon": "external-link" },
      { "anchor": "Immerse",  "href": "https://immerse.uhg.com",       "icon": "external-link" }
    ]
  },

  // ── Navbar ────────────────────────────────────────────────────────────
  "navbar": {
    "primary": { "type": "button", "label": "Support", "href": "/support" },
    "links":   [
      { "label": "Announcements", "href": "/announcements", "icon": "bell" }
    ]
  },

  // ── Footer ────────────────────────────────────────────────────────────
  "footer": {
    "columns": [
      {
        "label": "Documentation",
        "links": [
          { "label": "Developers", "href": "/developers" },
          { "label": "Rollouts",   "href": "/developers/release-management/getting-started" }
        ]
      }
    ],
    "socials":   { "github": "https://github.com/...", "x": "..." },
    "copyright": "© UnitedHealth Group"
  },

  // ── Blog / changelog ──────────────────────────────────────────────────
  "blog": {
    "enabled": true,
    "path":    "announcements",          // → content/announcements/*.mdx
    "label":   "Announcements",
    "icon":    "bell",
    "rss":     true
  },

  // ── Search ────────────────────────────────────────────────────────────
  "search": {
    "provider":  "pagefind",
    "scopeBy":   "tab"                    // search results grouped by tab
  },

  // ── Analytics ─────────────────────────────────────────────────────────
  // Pluggable; multiple providers can fire in parallel.
  "analytics": {
    "providers": [
      { "type": "ga4",      "config": { "measurementId": "G-XXXXX" } },
      { "type": "firebase", "config": { "projectId": "mcoe-d", "appId": "..." } }
    ],
    "events": {
      "scrollDepth":  [25, 50, 75, 100],
      "engagedTime":  [15, 30, 60, 120, 300]
    }
  },

  // ── Redirects ─────────────────────────────────────────────────────────
  "redirects": [
    { "from": "/old/path", "to": "/new/path", "permanent": true }
  ],

  // ── 404 ───────────────────────────────────────────────────────────────
  "errors": {
    "404": {
      "title":       "Not found",
      "description": "This page moved or doesn't exist. [Go home](/)"
    }
  },

  // ── Per-page frontmatter overrides (rare) ────────────────────────────
  "metadata": {
    "showLastModified": true
  }
}
```

**Validation.** The schema is published as JSON Schema (Draft 2020-12) at
`https://nebula-docs.uhg.com/docs.schema.json`. The CLI validates at build
time and fails loudly. The Platform validates on save (using the same schema)
so editors can't commit malformed config. Schema version is in the
`$schema` URL — bumping it is a coordinated Platform + CLI release.

**MDX frontmatter** controls per-page concerns:

```yaml
---
title:       'Bitrise access'
description: 'How to get access to the Bitrise platform'
icon:        'key'
boost:       3                # search ranking multiplier
hidden:      false            # if true, accessible by URL but not in nav
---
```

## Theme override schema (`theme.json`)

Tenants who don't need branding skip this file entirely. Tenants who do
get a JSON-only override layer (so the Platform can edit it):

```jsonc
{
  "$schema": "https://nebula-docs.uhg.com/theme.schema.json",
  "extends": "uhc",                       // base theme to layer on
  "tokens": {
    "brandPrimary":     "#002677",
    "brandAccent":      "#00BED5",
    "heroGradient":     "linear-gradient(135deg, #002677 0%, #00BED5 100%)",
    "darkMode": {
      "brandPrimary":   "#3D7CE0"
    }
  },
  "fonts": {
    "body": { "family": "Inter", "url": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" },
    "mono": { "family": "JetBrains Mono", "url": "..." }
  }
}
```

The token shape is exactly `ThemeTokens` from `packages/theme/src/types.ts`
— reuse, don't reinvent. The CLI's CSS pipeline:

```
@nebula-docs/theme globalTokens
        + base theme tokens (mcoe-default | uhc | optum | <id>)
        + theme.json overrides (deep merge)
        ─────────────────────────────────────────────────────
        → :root CSS vars (light)
        → [data-theme="dark"] CSS vars (dark mode overrides)
        → emitted to dist/styles/theme.css at build
```

The runtime theme switcher (existing `McoeThemeProvider` logic) ports over
as a React island. Tenants who set `switcherEnabled: false` ship zero JS
for theming.

## Component system

The component library breaks into three layers, all available in MDX
without explicit imports:

### 1. Core blocks (from `@nebula-docs/components`, already exists)

Ported 1:1 from the existing MCOE components: `Frame`, `VideoLoop`,
`Steps`, `Step`, `Icon`, `Callout` (and aliases `Note`, `Warning`, `Info`,
`Tip`, `Check`, `Danger`), `Heading`, `Text`. These are **frozen** in
behavior — MDX in tenant repos already uses them, and the migration
preserves output.

### 2. Mintlify-parity blocks (added in Phase 1)

The blocks present in `vendor/mint-docs-ref/` that we don't yet have.
Ported into `@nebula-docs/components`, schemas added to
`@nebula-docs/schemas`:

| Component | Purpose | Schema added |
|---|---|---|
| `Tabs`, `Tab` | Switchable content panels (synced by title across page) | yes |
| `CodeGroup` | Multi-language code tabs | yes |
| `Card`, `CardGroup`, `Tile` | Linkable visual containers | yes |
| `Columns` | Responsive grid wrapper | yes |
| `Accordion`, `AccordionGroup` | Collapsibles | yes |
| `Expandable` | Inline collapsible (for nested API fields) | yes |
| `ParamField` | API parameter doc + auto-playground row | yes |
| `ResponseField` | API response field doc | yes |
| `RequestExample`, `ResponseExample` | Sidebar code panels for API pages | yes |
| `Tooltip` | Hover tip with optional CTA | yes |
| `Badge` | Inline label / status | yes |
| `Mermaid` | Flowcharts / sequence diagrams | yes |
| `Tree`, `Tree.Folder`, `Tree.File` | File hierarchy display | yes |
| `Update` | Changelog entry with timeline | yes |
| `Latex` | Math equations | yes |
| `Visibility` | Human-vs-agent content split | yes (no schema; JSX only) |

The visual language follows our design system tokens, not Mintlify's — we
borrow the *API* (props, slots) for editor familiarity, but the *style*
comes from `@nebula-docs/theme`. Stripe-class aesthetic is the bar.

### 3. Tenant-local components (per-repo)

Anything in `<tenant>/components/*.tsx` is auto-registered into MDX. MCOE
has three of these today (`BitrisePrereq`, `PlatformCard`, `PlatformNav`,
`StageStatus`); they migrate into `mcoe-docs/components/` rather than
becoming part of the shared library. Keeps the platform clean and lets
each tenant own their domain-specific blocks.

### Auto-import mechanism

The CLI injects an MDX provider with all three layers merged:

```
core blocks (always)
  ⊕ tenant components (from <tenant>/components/*.tsx)
  ⊕ MDXEditor block bindings (from the Platform, when in preview mode)
```

No `import { Foo } from '...'` lines in tenant MDX files. Editors writing
prose stay in MDX-as-prose mode; richer blocks come from the auto-registered
component set.

## Stack

| Layer | Choice | Why |
|---|---|---|
| **Framework** | Astro 5+ with `@astrojs/mdx`, `@astrojs/react` | Static-first; React components hydrate as islands; Vite-based; native MDX |
| **TypeScript** | Strict, project-wide | Workspace standard |
| **Styling** | Tailwind v4 (utility) + emotion (component-scoped, where needed) + `@nebula-docs/theme` CSS vars | Tailwind for Astro components; emotion preserved where existing components use it; tokens are the source of truth either way |
| **MDX components** | React, from `@nebula-docs/components` + tenant `components/` | Reuse the existing library; add Mintlify-parity blocks |
| **Search** | Pagefind | Static, build-time indexed, multi-tenant by construction; replaces docusaurus-search-local |
| **Image optimization** | Astro's built-in `astro:assets` | Free; per-tenant build → per-tenant optimized assets |
| **Diagrams** | Mermaid via `@astrojs/mdx` + a Mermaid integration, lazy-hydrated | Avoid shipping mermaid runtime to pages without diagrams |
| **Analytics** | Pluggable provider system; first-class GA4, Firebase, PostHog, Plausible | Tenants pick their own in `docs.json` |
| **CLI** | `nebula` (built on a small built-in argv parser; commander/clack TBD if needed) | `init` / `dev` / `build` / `preview` / `validate` |
| **Schema** | JSON Schema 2020-12 published at a stable URL | One contract, two consumers (Platform + CLI) |
| **Distribution** | npm package `@nebula-docs/cli` | Versioned; tenants opt into upgrades |

Explicit non-choices (in addition to the table above):

- **Not Next.js.** Heavier defaults; the case for SSR/RSC doesn't apply
  here.
- **Not Docusaurus.** Wrong configuration shape for a config-driven platform.
- **Not Eleventy / Hugo / Jekyll.** Non-React; mismatch with our component
  library; weak MDX story.
- **Not Algolia DocSearch.** Hosted, requires per-tenant index setup,
  costs scale with tenants. Pagefind is local, free, and zero-ops.

## Search

**Provider: Pagefind.** Three reasons:

1. **Multi-tenant by construction.** Each tenant builds → each tenant gets
   their own static index, embedded in their `dist/`. No central service,
   no per-tenant configuration on a shared backend, no cross-tenant index
   leakage.
2. **Zero runtime dependencies.** The search UI is a small wasm + JS
   bundle Pagefind ships; no API to call, no rate limit to negotiate.
   Works behind firewalls, in air-gapped enterprise environments.
3. **Output owned.** Pagefind's UI is a starting point; we wrap it in a
   custom React island with our token-driven styling. The existing search
   UX in MCOE's navbar (search shortcut, `/`-key to open, scoped results
   per tab) ports over cleanly.

`docs.json` has `"search": { "provider": "pagefind" }`; future providers
(Algolia, Typesense) can be added behind the same interface for tenants
that want them. Pagefind is the default.

## Analytics

The existing MCOE analytics layer (`src/lib/analytics/*`) is already
**provider-agnostic in shape** — typed events, data-attribute
instrumentation, Firebase as the current backend. That's the model the CLI
adopts unchanged.

**What's preserved from MCOE:**

- Event schema (`page_view`, `nav_click`, `outbound_click`, `code_copy`,
  `search`, `theme_switch`, `color_mode_toggle`, `scroll_depth`,
  `engaged_time`, `surface_impression`)
- `data-analytics-{surface,label,position,category}` attribute convention
- Auto-tracker that wires DOM events to the schema
- Hooks for component instrumentation (`useAnalytics`, `useImpression`)

**What changes for multi-tenancy:**

- Provider list comes from `docs.json` `analytics.providers[]`, not from
  hard-coded Firebase init
- Provider implementations live in `@nebula-docs/cli/analytics/<provider>`
  (one file each, ~50 lines)
- Tenants pick `ga4`, `firebase`, `posthog`, `plausible`, `none` — pluggable,
  keyed by `type` field
- The auto-tracker runs as a React island injected by the CLI

A tenant who sets `analytics.providers: []` ships zero analytics JS.

## Build & deploy

### CLI

```
nebula init       # scaffold a new tenant repo
nebula dev        # local dev server with HMR
nebula build      # produce dist/ (static)
nebula preview    # preview built output locally
nebula validate   # validate docs.json + theme.json + content frontmatter
nebula upgrade    # bump @nebula-docs/cli + run any codemods
```

`init` produces a tenant repo with: `docs.json`, `theme.json`, `package.json`,
`content/index.mdx`, `.github/workflows/deploy.yml`, `assets/`. Five files
total. Editors take over from there.

### CI

Generated `.github/workflows/deploy.yml` for a tenant:

```yaml
name: Deploy docs
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: uhg-runner
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm nebula build
      - uses: ./.github/actions/upload-to-oss
        with:
          source: dist
          bucket: ${{ vars.DOCS_BUCKET }}
```

The workflow is generated by `init`; tenants edit it freely. The contract
is "produce `dist/`, upload to the tenant's OOSS bucket". `uhg-runner` is
the only supported CI runner — `ubuntu-latest` and other public runners
are out of scope (the platform is UHG-internal).

## MCOE as tenant zero (migration)

Migration is **a tenant-onboarding exercise**, not a one-off port. If
moving MCOE off Docusaurus is harder than moving any other tenant, the
platform isn't ready.

Phased plan (sequenced after the CLI is buildable for a synthetic tenant):

1. **Carve `mcoe-docs/` from `products/docs/`.** Eventually a separate
   repo; in the monorepo for the migration. New shape: `docs.json`,
   `theme.json` (uses `mcoe-default` base, no overrides), `content/`
   (existing MDX, paths preserved), `assets/`, `components/` (the
   MCOE-specific blocks: `BitrisePrereq`, `PlatformCard`, `PlatformNav`,
   `StageStatus`).
2. **Translate `docusaurus.config.ts` → `docs.json`.** Mostly mechanical:
   the four doc instances become tabs; the navbar config translates
   directly; the footer translates directly.
3. **Translate `sidebars/*.ts` → `navigation.tabs[].groups[]`.** The
   hand-curated `developers.ts` becomes nested groups in `docs.json`. The
   auto-generated three (`resources`, `product`, `about`) are emitted by
   the CLI from the file tree; their `docs.json` entries are flat
   "auto-from-folder" markers.
4. **Port custom landing pages.** `Hero`, `FeatureCards`, `ReleasePipeline`,
   `QuickLinks`, `FooterCta`, `StatsGrid` move into
   `mcoe-docs/components/` and get used in `content/index.mdx`,
   `content/developers/index.mdx`, etc. They're MCOE-specific; they
   don't belong in the platform.
5. **Port the announcements blog.** Maps cleanly to the CLI's `blog`
   feature (path → `content/announcements/`). The custom swizzles for
   `BlogListPage` / `BlogPostItems` become Astro layouts in
   `mcoe-docs/layouts/blog/` (using the layout escape hatch).
6. **Port the analytics setup.** `firebase-analytics.ts` becomes a config
   entry in `docs.json` `analytics.providers[]`; the rest of the analytics
   code is already in `@nebula-docs/components` (well, will be — moved
   from `products/docs/src/lib/analytics/` into the CLI package).
7. **Side-by-side build.** Both Docusaurus and the CLI build until visual
   QA passes on the CLI output. Then the Docusaurus build is removed.
8. **Cut over the deploy workflow.** Existing `build-deploy.yml` swaps
   `pnpm --filter @mcoe/docs build` for `pnpm nebula build` and the
   `dist/` path. Same OOSS bucket, same firewall, same domain.

**Visual QA bar:** the migrated MCOE site is at least as clean as the
Docusaurus version, on every page, in every theme, in light and dark mode.
A screenshot diff tool (Playwright + image diff, or just human review of
key pages) gates the cutover.

## What stays from existing work

- **`@nebula-docs/components`** — load-bearing, ported components stay,
  Mintlify-parity blocks added.
- **`@nebula-docs/schemas`** — load-bearing, schemas added for new blocks.
- **`@nebula-docs/theme`** — load-bearing, frozen-data hard rule still
  applies. The CLI's CSS pipeline composes: globals → base theme →
  `theme.json` overrides → CSS vars. Same `applyTokensToDOM()` logic
  becomes the runtime theme island.
- **`@nebula-docs/firebase`** — used by Nebula Docs Platform for auth; analytics
  Firebase init moves into the CLI's `analytics/firebase` provider, which
  reuses the Firebase SDK directly.
- **MCOE analytics layer** — entire `src/lib/analytics/*` directory moves
  into `@nebula-docs/cli/runtime/analytics/`. Schemas, hooks, auto-tracker
  preserved.
- **MCOE custom UI** — `Card`, `Badge`, `GlossaryThumbnail`,
  `GuideThumbnail`, all `home/*` components, all `landing/*` components
  → move into `mcoe-docs/components/` (tenant-local, not platform).
- **Custom Prism theme** — `src/lib/prismTheme.ts` becomes the CLI's
  default code-block theme; tenants can override via `theme.json`
  `tokens.code*`.
- **Hooks** (`useCopyToClipboard`, `useMediaQuery`, `useScrollPosition`,
  `useTheme`) → move into `@nebula-docs/cli/runtime/hooks/`.

## What does NOT carry over

- **Docusaurus swizzles** (`src/theme/Navbar/`, `src/theme/Blog*/`,
  `src/theme/DocItem/`, `src/theme/MDXComponents/`, etc.) — they're
  Docusaurus-internal types and slot conventions. The CLI has its own
  layouts (Astro components) that achieve the equivalent. **Do read them
  for behavior** (especially `NavbarContent.tsx`, `BlogListPage.tsx`,
  `NotFound.tsx`) and reproduce that behavior in the CLI layouts.
- **MUI customization** (`src/theme/mui/**`) — MUI is gone. Tailwind +
  shadcn (in Nebula Docs Platform) and Tailwind + token CSS vars (in the CLI).
  MCOE's `support.tsx` page, which is the only place MUI is used in
  user-facing content, becomes a tenant-local component using
  `@nebula-docs/components` + Tailwind.
- **`docusaurus-search-local`** — Pagefind replaces it.
- **`@docusaurus/plugin-content-docs`**, the four-instance pattern — the
  CLI handles "multiple doc sections" via `docs.json` `navigation.tabs`,
  not via plugin instances. There's exactly one content directory
  (`content/`); tabs slice it.

## Build phases

### Phase 0 — package skeleton

Create `packages/cli/` (or `packages/nebula-docs-ssg/`):

- Astro project scaffold; `pnpm create astro` then move into `packages/`
- Add `@astrojs/mdx`, `@astrojs/react`, Tailwind v4
- Workspace deps: `@nebula-docs/components`, `@nebula-docs/schemas`,
  `@nebula-docs/theme`
- Stub CLI at `packages/cli/bin/nebula-docs.ts` with `init` / `dev` /
  `build` placeholders
- JSON Schema files at `packages/cli/schemas/{docs,theme}.schema.json`
- Publish dry-run: `pnpm publish --dry-run` succeeds

**Done when**: `pnpm --filter @nebula-docs/cli build` produces a
publishable package; `nebula --help` runs.

### Phase 1 — synthetic tenants (the starters)

Two starter tenants live in the monorepo and double as `nebula init`'s
output templates:

- **`tenants/nebula-docs-starter/`** — full kitchen-sink (default for
  `nebula init`). Multiple tabs, nested groups, every component block,
  long-form prose, snippets. Doubles as the renderer's dev/test fixture
  and as the visual-parity audit target against the editor.
- **`tenants/nebula-docs-starter-empty/`** — minimal "smallest valid
  tenant" (output of `nebula init --empty`). Stays small as a reference
  for what a tenant *needs* to render.

Both:

- `docs.json`, `theme.json` (extending `mcoe-default`)
- `content/` with at least `index.mdx`
- `package.json` pinning `@nebula-docs/cli`
- `.github/workflows/deploy.yml` (uhg-runner) — generated by `init`
- `nebula dev` serves on `localhost:4321`; `nebula build` emits `dist/`

**Done when**: both starters boot, navigate, theme-switch, search; the
full starter exercises every component block at least once.

### Phase 2 — Mintlify-parity blocks

Add the missing components to `@nebula-docs/components`:

- `Tabs`, `Tab`, `CodeGroup`
- `Card`, `CardGroup`, `Tile`, `Columns`
- `Accordion`, `AccordionGroup`, `Expandable`
- `ParamField`, `ResponseField`, `RequestExample`, `ResponseExample`
- `Tooltip`, `Badge`, `Mermaid`, `Tree`, `Update`, `Latex`, `Visibility`

Each block:
- React component (single source of truth)
- Schema in `@nebula-docs/schemas`
- Tested in the synthetic tenant's MDX
- Visual parity check against `vendor/mint-docs-ref/` (mental model only —
  our visual style is ours)

**Done when**: every block in
`vendor/mint-starter-docs-template/essentials/components.mdx` renders.

### Phase 3 — Search, analytics, multi-theme

- Pagefind integration; build-time index → React island UI
- Analytics provider system; GA4 + Firebase + PostHog + Plausible
  reference impls
- Theme switcher island (port `McoeThemeProvider` logic)
- 404 / redirects from `docs.json`
- Site-wide banner (Mintlify parity)

**Done when**: synthetic tenant has full feature parity with MCOE today.

### Phase 4 — MCOE migration

Per the migration plan above. **Cutover is the gate**: the new CLI-built
MCOE site replaces the Docusaurus build at the OOSS bucket level.

### Phase 5 — Onboarding tenant #2

Pick a real second team. Run them through the onboarding flow end-to-end.
What breaks is the punch list for hardening. Likely areas of pain:

- CI runner availability for non-MCOE teams
- Domain / OOSS bucket provisioning automation
- GitHub App install UX for users who've never seen it
- Theme tokens that "just work" without custom token authoring

**Done when**: a team unfamiliar with the platform stands up a docs site
in under one working day, with no help from us.

### Phase 6 — Polish

- API reference: OpenAPI parsing → auto-generated endpoint pages
  (matches Mintlify pattern; needed if any tenant has API docs)
- Snippets: `content/snippets/*.mdx` reusable fragments via remark plugin
- Versioned docs (deferred unless a tenant asks for it)
- i18n / multi-language (deferred similarly)
- Codemod story for `nebula upgrade` — making schema bumps painless
  for tenants

## Locked decisions

The architectural choices below are settled. Don't relitigate them in
follow-up chats — push back here, in this doc, if any of them prove wrong
in practice.

1. **Framework: Astro.** Static-first, native MDX, React components hydrate
   as islands. Stripe-class perf becomes the baseline; tenants who write
   pure prose ship zero JS.

2. **Package + CLI: `@nebula-docs/cli` (package), `nebula` (binary).** The
   package name matches the existing `@nebula-docs/*` workspace scope. The
   CLI binary is intentionally **`nebula`** — the single place "Nebula Docs"
   is shortened, because tenants type the command name often and the longer
   form taxes ergonomics for no benefit. Subcommands: `init` / `dev` /
   `build` / `preview` / `validate` / `upgrade`.

3. **Tenant repo strategy: per-tenant repo, owned by the tenant team.**
   No monorepo of tenants, no hybrid arrangement. Each team owns their
   docs repo, their CI, their bucket. The platform is the npm package
   they pull in.

4. **CI runner: `uhg-runner` only.** `ubuntu-latest` and other public
   runners are out of scope. The platform is UHG-internal; the generated
   `.github/workflows/deploy.yml` hard-codes `uhg-runner`.

5. **Hosting: per-tenant OOSS bucket, behind UHG firewall, served via
   UHG infra.** Same model as the existing `mcoe-dev-docs` bucket. No
   public-internet hosting story; no per-tenant public domains. Bucket
   provisioning is a one-time UHG-infra ask per tenant.

6. **Schema versioning: pin the CLI version in tenant `package.json`,
   tenants upgrade when they choose.** Schema bumps don't break old
   tenants — they keep their pinned version until they run
   `nebula upgrade`, which runs codemods on their `docs.json` and
   bumps the dep. Schema version travels with the CLI version (semver:
   breaking schema = major bump).

7. **Concurrency: assume single-editor per tenant.** No file-locking, no
   three-way merge UI, no conflict resolution. The schema is shaped to be
   merge-friendly anyway (deterministic key ordering, no positional
   constraints), but that's a "doesn't make it worse" property, not a
   feature. Revisit if a tenant ever has two simultaneous editors.

8. **API reference / OpenAPI: deferred.** Not in any of Phases 0–6 by
   default. When the first tenant asks for it, scope a Phase 6.5 to add
   `openapi` support to `docs.json` and an OpenAPI-driven page generator.
   Don't pre-build it.

## Things the build phases should NOT do

- **Don't reach for Next.js** halfway through. The Astro decision is
  load-bearing; switching adds a quarter of churn.
- **Don't build a runtime CMS.** Same hard rule from
  [nebula.md](nebula.md). MDX-on-disk renders to static HTML at build
  time. Nebula Docs Platform edits files; the CLI renders them.
- **Don't replace `@nebula-docs/theme`.** The frozen-data hard rule from
  the original CLAUDE.md still applies. The token shape is the contract
  with `theme.json`.
- **Don't make the CLI aware of Nebula Docs Platform.** The CLI reads `docs.json`
  and content; it doesn't know whether a human typed it or Nebula
  serialized it. Keep that wall clean.
- **Don't bake in MCOE-specific behavior.** Anything MCOE-specific lives
  in `mcoe-docs/components/` or `mcoe-docs/layouts/`. The CLI ships
  exactly what every tenant needs, no more.
- **Don't ship a heavy default JS bundle.** A tenant who writes pure
  prose with no interactivity should ship zero React JS. That's the
  Astro promise; honor it.

## First action for the next chat

> "Read [CLAUDE.md](../CLAUDE.md), [.claude/nebula.md](nebula.md), and
> [.claude/nebula-cli.md](nebula-cli.md). They describe the monorepo
> state, the Platform plan, and the CLI plan respectively. The locked
> decisions in nebula-cli.md are settled — do not relitigate.
>
> Bootstrap Phase 0 — create `packages/cli/` with Astro + MDX + React +
> Tailwind v4, workspace deps wired up (`@nebula-docs/components`,
> `@nebula-docs/schemas`, `@nebula-docs/theme`), ending with
> `pnpm --filter @nebula-docs/cli dev` rendering a 'Hello Nebula Docs'
> page on `localhost:4321`. Stub the JSON schemas at
> `packages/cli/schemas/{docs,theme}.schema.json` and the CLI signatures
> at `packages/cli/bin/nebula-docs.ts`; no implementation yet."

That's the first commit. From there, Phase 1 (synthetic tenant) starts.
