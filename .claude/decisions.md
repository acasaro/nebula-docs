# Locked decisions & hard-won lessons

Settled architectural choices and gotchas that future Claude will hit. Don't relitigate without flagging here first. Hard rules are in [CLAUDE.md](../CLAUDE.md); per-pillar context lives in [nebula.md](nebula.md) and [nebula-cli.md](nebula-cli.md).

## Platform (editor SPA)

- **Tiptap (ProseMirror) for the editor surface.** Per-block contenteditable was attempted and reverted; MDXEditor was rejected. Cross-block drag-select, multi-block copy-paste, and document-wide undo all need a real ProseMirror engine.
- **Source-of-truth: Tiptap doc in memory, MDX as the I/O format.** Load: MDX → MDAST → Tiptap doc. Serialize: Tiptap doc → MDX on every `onUpdate`. JSX without a NodeView wraps as opaque `mdxRaw`. `normalizeMdx()` round-trips a file on load so opening doesn't mark it dirty.
- **Edit storage: in-memory until commit.** No Firestore drafts. A reload loses unsaved work.
- **Vite + Cloud Functions, not Next.js.** Only signing the GH App private key needs server-side execution; everything else is happy in the client. `httpsCallable()` replaces Server Actions.
- **SPA host: OOSS bucket `mcoe-dev-nebula`.** Behind UHG firewall; same deploy chain as the docs site.
- **Auth split: Firebase Auth (identity) + GitHub App (repo access), kept separate.** GH App holds repo permissions; users don't need their own repo permissions on GitHub. Commit attribution is `nebula-docs[bot]` with user noted in the commit body.

## CLI (renderer)

- **Astro 5+, static-first.** `@astrojs/mdx` + `@astrojs/react` + Tailwind v4. React components hydrate as islands; a tenant who writes pure prose ships zero JS.
- **Single monolithic `@nebula-docs/cli` package.** Don't split until a concrete trigger arrives (e.g., Platform needs to invoke a build server-side).
- **Per-tenant repo, owned by the tenant team.** The CLI is an npm dep, not a hosted service. Tenants pin the CLI version in their `package.json` and upgrade when they choose.
- **Firebase Hosting is the default tenant deploy target. OOSS is opt-in.** Reversed 2026-05-08 from the original "OOSS bucket per tenant" call. Tenants behind UHG firewall opt into OOSS via `docs.json.deploy.bucketBaseUrl`. Don't propose OOSS unless a tenant has a firewall-internal hosting requirement.
- **Pagefind for search.** Build-time index, zero runtime dependency, multi-tenant by construction. Tenants opt in via `docs.json.search`; omitting it ships zero search JS.
- **Snippets: ES module imports (Mintlify-aligned), not a custom `<Snippet file="...">` wrapper.** `@nebula-docs/mdx`'s `remarkAutoComponentImports` injects unimported component-name JSX tags as imports. Vite aliases `/snippets/*`, `/content/snippets/*`, `/shared/*` to the tenant root.
- **Concurrency: assume single-editor per tenant.** No file-locking. Revisit if a tenant ever has two simultaneous editors.
- **API reference / OpenAPI: deferred** until a tenant asks for it.

## Analytics (v1)

- **Firebase Analytics SDK → GA4.** MCOE was already on it; same `mcoe-d` project serves both write and read sides.
- **No env split on the GA4 property.** Same property serves dev + prod. Splitting would need a second GCP project for negligible benefit on a public-traffic site.
- **Read path: GA4 Data API, not BigQuery export.** Real-time-ish, no daily-job lag, no extra billing. Trade-off: no user-level breakdowns (Top Users is always empty until either BigQuery export or a sign-in flow on docs).
- **No VPC on the analytics function.** GA4 Data API is on the public Google network.
- **No function-side caching.** Editor-only audience today. Add a 5-min Firestore cache the moment dashboard traffic widens.
- **Bootstrap via dynamic `import()` in CLI layouts.** Astro's hoisted-script pipeline silently dropped a side-effect-only import; wrap as `import('/src/runtime/analytics/bootstrap.mjs').catch(...)` from `<script is:inline type="module">`.
- **`deriveSiteContext` is MCOE-specific** (hard-coded path map: `developers`, `resources`, `product`, `about`, `announcements`, `support`). Lift into tenant config when tenant #2 lands; don't generalize speculatively.

## GitHub / Firebase / GH App

- **GitHub host is GitHub Enterprise Cloud (`github.com/<org>`).** Not GHES. No Octokit `baseUrl` overrides. Install URL is `https://github.com/apps/<slug>/installations/new`.
- **Two GitHub Apps, one Firebase project.** Prod (`nebula-docs`, Enterprise, VPC-bound to `nebula-connector`) + dev (`nebula-docs-dev`, public, no VPC). `NEBULA_ENV=dev|prod` in the root `.env` picks app, Firestore DB, and Cloud Function name suffix.
- **Two Firestore databases.** `(default)` for prod, `nebula-docs-plat-dev` for dev. Rules are per-database — dev DB needs the same rules applied separately.
- **Firebase secrets via `--data-file=/abs/path`**, never interactive paste. Matters most for the GH App PEM keys.
- **Function deploys: filtered only.** `pnpm --filter @nebula-docs/functions deploy:dev|prod`. Never unfiltered — it touches both env sets.

## Hard-won gotchas (read before you hit them)

- **Astro + React + MDX SSR boundary strips children.** Children inside a React parent in MDX are pre-rendered to HTML strings before the parent runs, so `Children.toArray(...).filter(isValidElement)` always sees an empty array. Hydration boundaries don't help. **Fix: write the wrapper as an `.astro` file using slots** (see `Tabs.astro`, `Steps.astro`, `Mermaid.astro`, `CodeGroup.astro` shims in `packages/cli/src/runtime/components/`). Components that need to introspect children's props or count children must be Astro, not React.
- **Astro components must NOT be auto-imported.** The CLI's `remarkAutoComponentImports` will inject `import { Tabs } from "@nebula-docs/components"`, shadowing the page's `components` map (which routes to the Astro variant). Result: blank/broken render. Keep Tabs/Tab/Steps/Step/Mermaid/CodeGroup OUT of the auto-import map and route them via the `components` map only.
- **Dark-mode FOUC needs a blocking head script.** The theme attribute must be set before first paint. Read localStorage + set `data-theme` from a blocking `<script>` in `<head>`, not at body end.
- **`.mdx-prose` rules beat unlayered Tailwind utilities.** Wrap `.mdx-prose` in `@layer base` so Tailwind's `@layer utilities` wins on specificity. Without it, prose `a:hover { underline }` underlines linked cards.
- **MDX wraps text in `<p>` that picks up prose defaults.** Component overrides need `[&_p]:text-sm` etc. on every text container, not just the wrapper.
- **Tailwind workspace scan.** CLI's `global.css` adds `@source` directives for `../**/*.{astro,ts,tsx}` and `../../../components/src/**/*.{ts,tsx}` so utility classes from the symlinked workspace dep land in the bundle. Without it, Callout / Card / ParamField styles are missing.
- **Frontmatter preservation in the editor.** Tiptap's parser drops `yaml` nodes; naive `tiptapDocToMdx` emits body-only MDX. `MdxEditor` keeps a `frontmatterRef` populated on `source` change and prepends it on every `onUpdate`. Without this, any cursor move wipes the frontmatter the settings panel just wrote.
- **CodeGroup is currently shimmed via `.astro`** (the React version hits the SSR boundary above). When the Platform-side CodeGroup work stabilizes, diff the two APIs and converge on one.
- **`commitFiles` deletions need a fresh tree rebuild.** GitHub's documented `sha: null + base_tree` merge returns `GitRPC::BadObjectState` for nested paths. The implementation fetches the parent commit's tree recursively and submits a flat tree without `base_tree`. Verified against `acasaro/mcoe-docs`.
- **HMR brittleness on the CLI**: new MDX at content/ root or any `astro.config.mjs` edit can leave every page returning 500 with `UnknownContentCollectionError`. Stop the dev server and restart — don't try to fix in place.

## Known component API drift (intentional or accepted)

Nebula's `@nebula-docs/components` implements ~29 of 42 Mintlify-documented components. Drift is intentional where Nebula needs richer props; missing components only get added when a tenant asks.

- **Missing entirely (no plan):** `Tooltip` exists in Nebula but Mintlify spec doesn't fully overlap; `Panel`, `Prompt`, `Color`/`Color.Item`/`Color.Row`, `Tile`, `View` are absent.
- **Cross-component sync features missing:** Mintlify's `<Tabs sync>` (matching titles sync across Tabs/CodeGroup blocks on a page) is not implemented.
- **Nebula extras (not in Mintlify):** `Badge.variant` (solid/outline) + `leadIcon`/`tailIcon`/`href`/`onClick`; `Frame.title`/`description`; `Steps.titleSize`; `Property` with `location`/`hidden`/`pre`/`post`/`*Label`; `CodeBlock` as a JSX surface (Mintlify uses fences only).
- **Icon library semantics differ:** Mintlify `iconType` = Font Awesome style; Nebula `iconType` = Material variant. Nebula adds `iconLibrary` (`lucide` / `material` / `material-symbols`).

## Supported navigation patterns (MCOE scope)

Only two of Mintlify's documented nav patterns are in scope:

1. **Tabs → Groups → Pages** (the common case)
2. **Tabs → Menus → Groups/Pages**

Anchors, dropdowns, root-level primitives, products, versions, languages are out of scope. Schema + render code for unsupported primitives is present as dormant code — don't delete it, but don't push tenants toward those flows either. Revisit when a tenant explicitly asks.

## What NOT to do

- **Don't reintroduce a runtime CMS** (Firestore-as-content, wildcard runtime routes). MDX-on-disk renders to static HTML at build time.
- **Don't switch the Platform to Next.js or Astro.** Vite + Cloud Functions is intentional.
- **Don't drop Tiptap** for a different editor.
- **Don't replace `@nebula-docs/theme`** or change its frozen token data. Consumer plumbing is fair game.
- **Don't reach across `products/*`** for code. Share via `packages/*`.
- **Don't bake MCOE-specific behavior into the CLI.** MCOE-specific lives in the tenant repo, not the framework.
