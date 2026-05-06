# Nebula Docs — Workstream Status

Snapshot of where each in-flight piece stands. Refresh as work lands.

For architecture, see [.claude/architecture.md](architecture.md) (10000-ft overview), [nebula.md](nebula.md) (Platform), and [nebula-cli.md](nebula-cli.md) (CLI). For repo-wide rules, see [conventions.md](conventions.md).

---

## Editor (Phase 3, Tiptap)

The editor surface for MDX files. Tiptap (ProseMirror) doc is the in-memory state; MDX is the I/O format.

**DONE**

- Tiptap installed: `@tiptap/core`, `react`, `pm`, `starter-kit`, `extension-code-block`, `extension-placeholder`, `suggestion`.
- `products/nebula-platform/src/components/mdx/MdxEditor.tsx` — main editor. Loads via `mdxToTiptapDoc(source)`. Serializes back via `tiptapDocToMdx(doc)` on every `onUpdate`. `normalizeMdx()` round-trips a file through parser + serializer at load to dedupe drift (so opening a file doesn't mark it dirty).
- NodeViews under `products/nebula-platform/src/components/mdx/`: `MdxCalloutNode`, `MdxCardNode`, `MdxCodeBlockNode`, `MdxCodeGroupNode`, `MdxFrameNode`, `MdxRawNode`, `MdxStepsNode` (Steps + Step), `MdxUpdateNode`, `MdxTabsNode` (Tabs + Tab), `MdxAccordionNode` (Accordion + AccordionGroup), `MdxColumnsNode` (Columns + Column + CardGroup), `MdxExpandableNode`, `MdxTreeNode` (Tree + Tree.Folder + Tree.File), `MdxApiNodes` (ParamField + ResponseField + RequestExample + ResponseExample), `MdxMermaidNode`, `MdxBadgeNode` (inline).
- Slash command (`/`) — `mdx/slashCommand.ts` + `slashItems.tsx` + `SlashMenu.tsx`, built on `@tiptap/suggestion`. Slash items added for every new NodeView.
- BlockHandle: drag handle + kebab affordance per block. `EditorWithBlockHandle` wraps `EditorContent` in `MdxEditor`. Kebab → `AttributesPopover` is wired via `getBlockSchema` (patches via a `setNodeMarkup` transaction; trash via `deleteRange`).
- Contextual placeholders (Step, Callout, Card child paragraphs).
- Inline JSX support added in parser/serializer for `<Badge>` (handled in both `convertInlineNode` and a standalone `convertBlock` fallback so single-line Badge usage round-trips).
- `<CodeGroup>` supported end-to-end: React component in `@nebula-docs/components/code-group`, runtime registry hookup, `CodeBlock.filename` prop, `MdxRenderer.renderCode` extracts the first non-`key=value` token of `code.meta` as filename, Tiptap node `mdxCodeGroup` (content `codeBlock+`) with editable filename inputs in the tab strip, parser converts `code` MDAST children directly, serializer emits ` ```lang filename\n…\n``` ` blocks inside `<CodeGroup>` wrappers.
- Page header bar: `MdxEditor` parses frontmatter and renders a static header above the editable surface with the page `title` (h1) + `description` (muted paragraph) + bottom border. Outside the contentEditable region so it can't be accidentally typed into; updates via the page-settings panel.
- Frontmatter preservation across editor transactions: the Tiptap parser drops yaml nodes, so naive `tiptapDocToMdx` emits body-only MDX. `MdxEditor` holds a `frontmatterRef` that re-extracts the frontmatter block whenever `source` changes and prepends it to every `onUpdate` emission. `normalizeMdx` does the same. Without this, any cursor move in the editor would wipe frontmatter the settings panel just wrote. The parser's `mdxRaw` fallback strips frontmatter from `attrs.source` so the prepend doesn't double up.
- Parse-failure UI: when `@mdx-js/mdx` throws, `parseMdxSafe` (in `MdxRenderer.tsx`) catches and `analyzeParseError` extracts `reason` / `line` / `column` from the `VFileMessage`, builds a 5-line excerpt with the offending line marked `>`, and assigns a pattern-based hint (4-backtick-fences-with-JSX, unbalanced braces, unclosed tag/expression). `mdxToTiptapDoc` falls back to a single `mdxRaw` node carrying the file body so the editor still mounts. Verified on `accordian.mdx` (Mintlify's 4-backtick-with-inner-JSX pattern that throws "Unexpected closing slash `/` in tag").
- Accordion: dropped the permanent description input — the popover edits it; `inlinePopover: true` on the schema suppresses the BlockHandle's central kebab so the inline ellipsis is the only entry point. `AccordionGroup` gains a hover-revealed `Add accordion` button at the bottom-right.
- Tabs UX overhaul: `MdxTabsNode` uses `@dnd-kit/sortable` with a nested `DndContext` for drag-handle reorder, X-to-remove on each tab, `+` floats right via `ml-auto`, ellipsis kebab on the active panel opens `AttributesPopover` with the new `tabSchema` (title + id). New schemas `tabSchema` + `stepsSchema` + `cardGroupSchema` + `columnsSchema` + `expandableSchema` + `accordionSchema` + `paramFieldSchema` + `responseFieldSchema` + `requestExampleSchema` + `responseExampleSchema` + `badgeSchema` all set `inlinePopover: true`.
- `+` icon in `BlockHandle` now inserts a new paragraph containing `/` so the slash menu opens automatically. Empty paragraph placeholders read `Start typing something or press "/" for commands` for top-level + Step parents.
- Frame: equal `p-2` all around; caption (when present) renders as a centered flex row with `min-h-[44px]`, no longer asymmetric.
- Source mode is editable: `SourceEditor` uses Shiki-rendered `<pre>` overlaid by a transparent `<textarea>` (caret visible, text invisible). Theme tracks `documentElement.dark` via MutationObserver. **GitHub-style line-number gutter** on the left: right-aligned `tabular-nums`, scroll-synced with the textarea + pre, active-line highlighted from the textarea's caret position. Width auto-sizes to digit count.
- Dev convenience: `window.__nebulaEditor` exposed in dev mode for REPL inspection.

**OPEN**

- `<Tooltip>`, `<Icon>`, `<VideoLoop>`, and the standalone `<Example>` still round-trip via `MdxRaw` (no editing UI). Add a `Mdx<Name>Node.tsx` if/when editor-time UI is needed.
- Verify edit-in-place inside child slots of Card / Frame / Step / Tab / Accordion / Column / Expandable works for paragraphs, headings, and lists.
- Save flow: dirty-tracking + commit pipeline already wired (`RepoBrowser.files[path].draft` → `PublishMenu` → `commitFiles`).

---

## Page settings forms

Three forms (Page, Group, Tab) for nav-tree configuration.

**DONE**

- `products/nebula-platform/src/components/nav-settings/{PageSettingsForm,GroupSettingsForm,TabSettingsForm}.tsx`. Forms are fully controlled via `values` + `onChange` props.
- Helper rows: `FormRow.tsx` (TextRow / SelectRow / ToggleRow), `IconRow.tsx`, `KeywordsRow.tsx`. `UNDERLINE_INPUT_CLASSES` overrides `dark:bg-transparent` so inputs match the panel's `bg-muted/30` overlay in dark mode.
- `NavSettingsPanel.tsx` orchestrates entry resolution and patch routing. **Mintlify-aligned model**: every page setting writes to MDX frontmatter; legacy `PageObject` overrides in `docs.json` are honoured as read-side fallbacks. The page form surfaces Mintlify's editor field-set verbatim: title, slug (read-only), External URL (`url`), description, icon, sidebar title, OG Image URL, tag (toggle), hidden, keywords, mode. Other Mintlify-supported keys (noindex, boost, deprecated, groups, iconType, hideFooterPagination, hideApiMarker, timestamp) round-trip silently if a tenant authored them by hand — the form just doesn't surface them.
- `lib/frontmatterCache.ts` — `useFrontmatterCache` hook fans out per-MDX-file fetches with concurrency 6, parses frontmatter via `splitFrontmatter`, and reuses in-editor drafts via `knownFiles` so the sidebar updates immediately as the user edits the page-settings panel. Returns `{ cache, loaded, loading }`.
- `NavTree` reads frontmatter `sidebarTitle` / `icon` / `tag` / `hidden` from the cache as overrides on top of `PageObject` defaults; `hidden: true` removes the row entirely. Sidebar titles "pop in" with proper Mintlify-style casing once each file's frontmatter loads.
- `NavTreeSkeleton` (9 mixed-width pulse rows) replaces the "Loading navigation…" text while `docsConfigState.loading` is true.
- `PublishMenu` trigger button: neutral (border + bg-background) until `dirtyCount > 0`, then switches to primary fill.
- `lib/docsConfigOps.ts` — `parseSettingsKey`, `findEntry`, `updateEntry`, `deleteEntry`, `appendToGroup` helpers walking the docs.json tree by key path.
- `lib/frontmatter.ts` — minimal YAML splitter/serializer + `applyFrontmatterPatch` for the editor-time mutations.
- `RepoBrowser.tsx` — derives `liveDocsConfig` from `files['docs.json'].draft` (or initial `useDocsConfig` fetch) so docs.json edits flow through the same dirty-tracking + save pipeline as MDX. Added `handleConfigChange`, `handleFrontmatterChange`, `handleDeleteOpenEntry`, `handleAddEntry`, plus a `deletions: Set<string>` queue for paths to remove on commit.
- `commitFiles` in `lib/githubApi.ts` extended: `FileChange` is now a discriminated union supporting `{ delete: true }`. When the batch contains any deletions, the function fetches the parent commit's tree recursively and submits a fresh flat tree (without `base_tree`) — every existing blob, minus the deleted paths, plus the upserted blobs. The `sha: null` + `base_tree` merge that GitHub's docs suggest does not work reliably for nested paths and returns `GitRPC::BadObjectState`; this rebuild path is verified end-to-end against `acasaro/mcoe-docs` on a real test branch.
- `PublishMenu` `PublishChange.status` extended with `"deleted"`.
- Trash button → confirm `Dialog` → removes the docs.json entry and queues the MDX for deletion (page kind only).
- `+` button on group rows → Radix popover with three options (Add page / Add group / Add existing file). Each opens a `Dialog` with appropriate input.

**Add-entry UX (revised)**

- Per [Mintlify's editor pattern](https://www.mintlify.com/docs/editor/tutorial), creation is **inline, not modal**. Clicking the `+` on a row opens a small popover; picking an option appends an editable row in the tree, focused with the placeholder selected, that commits on Enter (or blur with non-empty value) and cancels on Escape.
- **Three add-entry surfaces, all using the same `InlineAddRow` component**:
  - **Navigation header `+`** → popover with one option (`Tab`) → inline tab row at the root of the tab list. `RepoBrowser.handleAddTab` calls `appendTab(cfg, { tab })`.
  - **Tab row `+`** → popover with `Add a page` / `Add a group` → inline row at the top of the tab's children. Pages land in `tab.pages` (a new optional slot on the `Tab` interface, Mintlify-aligned), groups land in `tab.groups`. `RepoBrowser.handleAddEntry` dispatches via the `tab:` parentKey prefix to `appendToTab`.
  - **Group row `+`** → popover with `Add a page` / `Add a group` → inline row at the bottom of the group's children. Existing `appendToGroup` path; unchanged.
- Scope locked at **Pages, Groups, Tabs** for now. The earlier "Add existing file" option was dropped (the file-tree view already exposes existing files; no need for a duplicate add-from-picker flow). Anchors / Dropdowns / Versions / Languages / Menus / Products from the Mintlify spec are out of scope until a tenant asks for them.
- Pages: when committed, the slug appends to docs.json AND a draft MDX file is seeded into the `files` map (`---\ntitle: <Slug>\n---\n\n# <Slug>\n`) so the next commit creates the file. Existing dirty-tracking + `commitFiles` pipeline takes it from there.

**OPEN**

- Slug field on the page form is read-only. Renaming a page (slug change → file move) is a follow-up — needs path-aware tracking that survives until the next commit.
- Renaming an existing tab/group/page from the inline editor is not yet wired (only NEW entries are inline-editable; existing rows still go through the settings panel for label changes). Could share the `InlineAddRow` shape if/when that's wanted.

---

## Node attribute popover

Per-component prop editor opened from the BlockHandle kebab.

**DONE**

- `products/nebula-platform/src/components/AttributesForm.tsx` — schema-driven field rendering. Switches on `field.kind` (text / toggle / select / icon).
- `products/nebula-platform/src/components/AttributesPopover.tsx` — Radix popover anchored to the right side of the trigger element. Header (title + close), body (children), footer (Trash + Save Changes).
- Field primitives in `products/nebula-platform/src/components/fields/`: `TextField`, `ToggleField`, `SelectField`. Plus `IconField.tsx` at the components root.
- `products/nebula-platform/src/lib/blockSchemas/` — `BlockAttrSchema` type with `sections`, `AttrField` discriminated union, and an `inlinePopover` flag. Schemas cover: callout, card, frame, step, steps, update, accordion, columns, cardGroup, expandable, paramField, responseField, requestExample, responseExample, badge, tab.
- `BlockHandle` kebab → `AttributesPopover` is wired in `EditorWithBlockHandle`. `getBlockSchema(nodeType)` resolves the right schema. Patches apply via a `setNodeMarkup` transaction (functionally equivalent to `updateAttributes`); trash uses `deleteRange` over the active block. Edit happens on every keystroke; the "Save Changes" button is a confirm-and-close affordance.
- Schemas opt out of the central kebab by setting `inlinePopover: true` — used by mdxCard, mdxStep, mdxAccordion, mdxColumns, mdxCardGroup, mdxExpandable, mdxParamField, mdxResponseField, mdxRequestExample, mdxResponseExample, mdxBadge, mdxTab. Each renders its own `EllipsisVertical` trigger inside the NodeView.

**OPEN**

- `mdxCodeBlock` intentionally has no popover schema — its only user-facing attribute (`language`) is exposed via the inline dropdown in `MdxCodeBlockNode`. Add a schema if more attrs (filename, title) get modeled on the node.
- The popover skips blocks with their own inline edit affordances (`mdxCard`, `mdxStep`, etc.) — those nodes wire their own `EllipsisVertical` button and popover instance. Keep that boundary in mind when wiring future schemas.

---

## Home dashboard

Per-deployment landing page with Activity / Previews tabs.

**DONE**

- `products/nebula-platform/src/routes/Home.tsx` (route) + `components/dashboard/DashboardHomePage.tsx` (page) + 13 supporting components (`DashboardHeader`, `DeploymentHeroCard`, `ActivityTable`, `PreviewsTable`, `ActivityRow`, `ActivitySection`, `BranchPill`, `StatusPill`, `NebulaBotAvatar`, `DeploymentLogList`, `DeploymentThumbnail`, `LiveExpandedDetails`, `PreviewExpandedDetails`).
- Layout, hero card, segmented tab toggle, expanded rows — all matching the visual target.
- Mock data fixtures in `products/nebula-platform/src/lib/dashboard/`.

**OPEN**

- Switch from `mockData.ts` to live Firestore subscriptions on the `activity/` and `builds/` collections. The function side already writes here; SPA wiring is the parked webhook follow-up below.
- Time-aware greeting bound to the authenticated user (`useCurrentUser()` hook from `@nebula-docs/firebase`).
- Confirm what currently renders is mock vs real — quick check.

---

## Webhook + activity feed

GitHub webhook handler that writes events to Firestore for the SPA to consume.

**DONE**

- `functions/src/githubWebhookHandler.ts` — shared factory: HMAC-SHA256 signature verification (timing-safe), event mapping, Firestore writes.
- Prod wrapper `functions/src/githubWebhook.ts` — binds `GITHUB_WEBHOOK_SECRET`, default DB.
- Dev wrapper `functions/src/dev/githubWebhookDev.ts` — binds `DEV_WEBHOOK_SECRET`, `nebula-docs-plat-dev` DB.
- Both deployed. Dev tested end-to-end: GitHub App ping event written to `activity` collection in `nebula-docs-plat-dev`.

**Firestore schema**

- `builds/{run_id}` — keyed by GitHub workflow run ID; upserted as the run progresses (queued → in_progress → completed). Fields: `workflowName`, `branch`, `headSha`, `status`, `conclusion`, `htmlUrl`, `startedAt`, `completedAt`.
- `activity/{autoId}` — append-only feed for `pull_request`, `push`, `installation`, `installation_repositories`, plus a generic catch-all entry for other events. Each doc has `event`, `action`, `summary`, `repo`, `actor`, plus event-specific fields.

**PARKED**

- SPA dashboard subscription to `activity/` and `builds/` (the mock-data → live-data swap on Home).
- Verify Firestore rules on `nebula-docs-plat-dev` allow `activity` / `builds` reads. The default-DB rules are correct (auth'd reads, function bypasses via admin SDK); rules are per-database, so the dev DB needs the same applied either via the GCP console or by extending `firebase.json` for multi-database deploys.
- Prod webhook URL / secret config in the `nebula-docs` (Enterprise) GitHub App settings — only when ready to roll out to prod.

---

## CLI

Multi-tenant Astro-based static site generator. Design doc: [nebula-cli.md](nebula-cli.md). All architectural decisions there are locked.

**DONE — Phase 0 (skeleton) + Phase 1 (synthetic tenant renders)**

- `packages/cli/` bootstrapped: Astro 6 + `@astrojs/mdx` 5 + `@astrojs/react` 5 + Tailwind v4 (via `@tailwindcss/vite`). Workspace deps wired (`@nebula-docs/{components,mdx,schemas,theme}`).
- `bin/nebula-docs.mjs` thin dispatcher → `src/cli/{commands/*,resolveTenant.mjs,prepareAstro.mjs,paths.mjs}`. Subcommands: `dev`, `build`, `preview`, `validate` are functional; `init` and `upgrade` are signature-stubs with a help message pointing at the planned scaffold.
- `pnpm --filter @nebula-docs/cli dev tenants/nebula-docs-starter-empty` boots Astro on `localhost:4321` rendering the synthetic tenant. `INIT_CWD` propagation in `resolveTenant.mjs` makes the relative-path arg work from the monorepo root (pnpm runs lifecycle scripts from the package dir, so naive `resolve(cwd, arg)` would fail).
- `pnpm --filter @nebula-docs/cli build tenants/nebula-docs-starter-empty` emits `tenants/nebula-docs-starter-empty/dist/{index.html, getting-started/installation/index.html, components/{cards,tabs}/index.html, api/users/index.html}` plus the `_astro/` bundle.
- File-routed pages via Astro 5 content collections: `src/content.config.ts` defines a `docs` collection with `glob({ pattern: ['**/*.mdx', '!snippets/**'], base: <tenant>/content })`. `src/pages/[...slug].astro` does `getStaticPaths` over the collection, mapping `entry.id === 'index'` → `/` and everything else to its id.
- Token composition: `src/cli/prepareAstro.mjs` reads tenant `docs.json` + `theme.json`, deep-merges `theme.json.tokens` over `getThemeById(theme.base)`, and emits `packages/cli/.nebula/tokens.css` via `@nebula-docs/theme`'s `generateTokensCss`. The CLI's `src/styles/global.css` `@import`s that file. Output verified: brand-primary CSS var resolves correctly on the rendered pages.
- Snippet resolution: `astro.config.mjs` registers `@nebula-docs/mdx`'s `remarkSnippets` plugin with a filesystem `resolveFile` that reads `<tenant>/content/snippets/<file>.mdx`. Verified end-to-end with the fixture's `<Snippet file="disclaimer" />` inlining the disclaimer Callout.
- Layout chrome: `src/layouts/DocsLayout.astro` + `src/components/{Navbar,Sidebar,SidebarGroup,Footer}.astro` consume `docs.json` for tabs/groups/pages, navbar primary + links, footer columns + copyright. Sidebar marks the current page via `aria-current="page"`.
- JSON Schemas published as Phase 0 stubs at `packages/cli/schemas/{docs,theme}.schema.json`. Authoritative shape will be generated from `@nebula-docs/schemas` Zod definitions in Phase 3.
- Component map at `src/runtime/components/registry.tsx` exposes the full `@nebula-docs/components` surface to MDX. Includes `CalloutShim` that accepts both `type` (Mintlify-style) and `variant` (our component API).

**OPEN — Phase 1 follow-ups**

- **Tailwind workspace scan.** `src/styles/global.css` adds `@source` directives for `../**/*.{astro,ts,tsx}` and `../../../components/src/**/*.{ts,tsx}` so utility classes from the symlinked workspace dep land in the bundle. Confirmed: Callout variants, Card/CardGroup, ParamField pills, RequestExample/ResponseExample all render with their @nebula-docs/components Tailwind styling.
- **Tabs / Steps as Astro components, not React.** The Astro+MDX+React boundary pre-renders nested React children to HTML strings before they reach the parent, so `Children.toArray(...).filter(isValidElement)` always sees an empty array. Hydration boundaries don't help — the children come through as strings on both sides. `src/runtime/components/{Tabs,Tab,Steps,Step}.astro` sidestep the issue entirely with Astro slots: Steps uses CSS counters for auto-numbering + a `::after` connector line; Tabs renders panels with `data-tab-title`, and a small `is:inline` script reads them at load to build the tab-button row + wire click/arrow-key/Home/End. The page route in `src/pages/[...slug].astro` merges the Astro components over `reactComponents` in the components map. Verified end-to-end: Steps shows "1, 2, 3, 4" circles connected by a vertical line; Tabs switches between panels on click and via keyboard.
- **CodeGroup is broken in the renderer.** Two issues stacked: (1) `CodeGroup` is exported from `@nebula-docs/components` but not registered in the CLI's MDX components map, so MDX referencing `<CodeGroup>` throws "expected component to be defined". (2) Even if registered, it would hit the same `Children.toArray(...).filter(isValidElement)` SSR boundary as Tabs/Steps and render an empty container. Fix: write `CodeGroup.astro` + `CodeBlock.astro` shims using Astro slots; the CodeGroup script attaches `data-codeblock-tab="{filename || language}"` to each panel and builds the tab strip from those attrs at hydration. Defer until the editor-side CodeGroup the Platform team is writing in parallel stabilizes — then diff the two APIs (props, markup) and pick a single source. Don't land two divergent CodeGroup components.
- **Other introspection-pattern blocks.** `Accordion`, `Columns`, anything else that needs to read child props at render time will hit the same SSR boundary. Apply the same pattern (Astro slot wrappers) when a tenant exercises them.
- **Visual-parity audit (Editor preview ↔ CLI render).** Both consumers import from `@nebula-docs/{components,theme}`, so component-level visuals should be byte-identical — but they're not today. Drift sources: (1) different Tailwind `@source` config between Platform and CLI; (2) different font stacks (CLI loads Inter+JetBrains Mono via `@import` in global.css, Platform uses whatever its global.css sets); (3) different prose context — CLI's `.nebula-prose` rules vs the Platform's editor-context styles. Editor *chrome* (NodeView wrappers, drag handles, edit affordances) is correctly different and stays different. **Plan**: defer until CLI Phase 1 layout/sidebar/navbar is locked AND editor Phase 3 NodeView work finishes; then a focused audit — diff the same MDX rendered both places, catalog every visible difference, classify each as chrome (keep different) or component-level (extract into shared `@nebula-docs/styles` package both sides import). The shared package is the durable fix; visual vigilance is not.
- **Distribution build.** The bin runs via `node --import tsx ./bin/nebula-docs.mjs` so workspace TS deps load without compilation. For npm-published consumption, Phase 6 needs to bundle (tsup/esbuild) the CLI + its workspace deps into shippable JS so `npx nebula-docs` works without tsx in the consumer's environment.
- **Snippet path convention.** `<Snippet file="disclaimer" />` resolves to `content/snippets/disclaimer.mdx` (the file value is relative to the snippets dir, not the content dir). The fixture had `file="snippets/disclaimer"` originally; corrected. Worth a doc note in Phase 6 once the published JSON Schema enforces the convention.

**DESIGN**

- Phases 2–6 sequenced in `nebula-cli.md`. Phase 4 is "MCOE migration" — now that the CLI builds for the synthetic tenant, MCOE can move off Docusaurus.

---

## Upcoming workstreams

Five features designed but not yet implemented. Each fits into the existing seven-package framework — none requires a new top-level package. See [architecture.md](architecture.md) for how they fit together.

### 1. Preview before merge

Per-PR builds at `bucket/previews/<PR-number>/`, surfaced via the dashboard's existing Preview button.

- **Where it lives**:
  - `@nebula-docs/cli` — accept `--base /previews/<PR-number>/` flag, pass through to Astro's `base` config
  - Tenant template (`packages/cli/template/.github/workflows/deploy.yml`) — PR-trigger → build with `--base` → upload to bucket sub-path; main-trigger → build with no base → bucket root
  - Cleanup workflow (`packages/cli/template/.github/workflows/cleanup-preview.yml`) — PR-closed → delete `bucket/previews/<PR-number>/`
  - `functions/src/githubWebhookHandler.ts` — compute `previewUrl` on `builds/{run_id}` for non-main `workflow_run` events
  - `products/nebula-platform/` — Preview button reads `build.previewUrl` and opens in new tab
- **Order**: CLI flag first (depends on Phase 2 bootstrap); workflow YAML in tenant template; webhook URL computation; Platform button wiring last.

### ~~2. Snippets~~ — DONE (Mintlify-aligned import model)

Mintlify-style ES module imports for snippets and React components. Pages
use `import Disclaimer from "/snippets/disclaimer.mdx"; <Disclaimer />` and
the editor + CLI both resolve through Astro/Vite's standard module
resolution. Replaces an earlier custom `<Snippet file="..." />` JSX wrapper
that was Phase A's first attempt — that prototype shipped briefly but was
ripped out in favour of the standard import syntax per the user's request
to follow Mintlify's [reusable snippets](https://www.mintlify.com/docs/create/reusable-snippets)
and [React components](https://www.mintlify.com/docs/customize/react-components)
docs.

**Landed:**

- `@nebula-docs/mdx`:
  - `extractImports(tree)` walks `mdxjsEsm` nodes, returns one `ImportSpec` per binding (default / named / namespace). `parseImportStatement(value)` parses a single statement into bindings; `groupImportsByPath` + `serializeImports` round-trip them back to source.
  - `extractExports(tree)` returns `export const NAME = VALUE` declarations from a snippet file, used by Phase B variable substitution.
  - `bindingNameFromPath(path)` derives a PascalCase JSX name from a snippet filename (`disclaimer.mdx` → `Disclaimer`, `nebula-banner.mdx` → `NebulaBanner`) for the slash-command picker's defaults.
  - `remarkAutoComponentImports({ components })` plugin walks an MDX AST, collects unimported component-name JSX tags, and prepends `import { ... } from "<source>"` statements with a properly populated `data.estree` (parsed via acorn — the MDX-to-JS compiler reads the estree, not `value`; injecting nodes with only `value` silently drops them). Wired into the CLI's `astro.config.mjs`. Verified end-to-end: `<Callout>` in a snippet file with **no explicit import** renders correctly on the consuming page.
  - The earlier `remarkSnippets` plugin was deleted.
- `products/nebula-platform/`:
  - `mdastToTiptap.parseMdxForEditor(source)` returns `{ doc, imports }`. Imports are stripped from the doc body; JSX whose tag matches an imported binding becomes a new `mdxImportedSnippet` Tiptap atom carrying `{ binding, path, jsxAttrs, isReact }`.
  - `tiptapToMdx.tiptapDocToMdx(doc, imports)` re-emits all captured imports verbatim (grouped by path) at the top of the body, then serializes `mdxImportedSnippet` nodes as `<Binding {...attrs} />`. Imports are NOT garbage-collected — keeping unused imports preserves user-authored named imports for variables and prevents the dirty-marker from firing on open.
  - `MdxImportedSnippet` NodeView (`components/mdx/MdxSnippetNode.tsx`):
    - Reads resolved snippet content via `useSnippetContent(path)` from `SnippetResolverProvider` context.
    - Substitutes `{propName}` placeholders in the snippet body with JSX attributes passed at the call site (`<Disclaimer word="bananas" />` substitutes `{word}`). Phase B prop substitution.
    - For `.jsx` / `.tsx` snippets shows a labelled placeholder (`<ColorGenerator />` + path + props) — live React eval is build-time only. Phase B placeholder render.
    - Visual: subtle left border + hover-revealed "open `snippets/<file>.mdx`" link that navigates to the snippet source. Missing-snippet shows a destructive-themed callout.
  - `MdxEditor` tracks `importsRef: ImportSpec[]` parallel to `frontmatterRef`. The serializer reads from `importsRef.current` on every onUpdate. The slash-command insert path calls `MdxSnippet.options.onInsert(spec)` which appends to `importsRef`.
  - `/snippet` slash command: `slashItems.tsx` `buildSlashItems(catalog)` returns one slash item per available snippet (entries with their PascalCase binding as the item label and the import path as the description). Filters via the existing slash-menu typeahead (`/snip`, `/disclaimer`, etc.). React component snippets show a Puzzle icon; MDX snippets show a FileText icon.
  - Snippet catalog: `useSnippetCatalog` in `lib/snippetCache.ts` produces a sorted, dedup'd catalog from the prefetched files. Walks both `<docsSubdirectory>/content/snippets/` and `<docsSubdirectory>/snippets/` (canonicalizes both shapes to a single `/snippets/...` import path so the editor writes Mintlify-compatible source).
  - Snippet resolver: `buildSnippetResolver(files, snippetsBases, docsSubdirectory)` and `buildRepoPathResolver(...)` map the `/`-rooted import path back to the actual repo file.
- `@nebula-docs/cli`:
  - `astro.config.mjs` drops the `remarkSnippets` plugin (no longer needed). Imports work via Astro/MDX's native ES module resolution.
  - Vite aliases: `/snippets/*` → `<tenantRoot>/snippets/*`, `/content/snippets/*` → `<tenantRoot>/content/snippets/*`, `/shared/*` → `<tenantRoot>/shared/*`. So Mintlify-style absolute import paths resolve correctly from inside MDX files.
  - Workspace alias: `@nebula-docs/components` → resolved via `require.resolve` so MDX files in the tenant repo (which has no node_modules) can import workspace packages.
- Tenant fixture migrated: `tenants/nebula-docs-starter-empty/content/getting-started/installation.mdx` now uses `import Disclaimer from "/content/snippets/disclaimer.mdx"; <Disclaimer />`. Verified end-to-end on the running CLI dev server — disclaimer Callout renders inline.
- `pnpm --filter @nebula-docs/mdx typecheck` and `pnpm --filter @nebula-docs/platform typecheck` both pass.

**Open:**

- **Variable substitution depth.** `{propName}` substitution in snippet bodies uses a simple regex — collisions with intentional `{` in the source are user-visible (and would be a JSX expression error anyway). Doesn't yet handle nested expressions or computed values. `extractExports` is exposed for Phase B's reusable-variable model (`import { brandName } from "/snippets/vars.mdx"; # {brandName}`) but the rendering side isn't wired yet.
- **`.jsx` snippet live-render in editor.** Currently shows a placeholder. Live render would need a sandboxed eval — defer until a tenant actually wants in-editor preview of their custom React components.
- **Snippet props editor in AttributesPopover (Phase C).** Schema not yet defined for `mdxImportedSnippet`. Editing `word="bananas"` requires source mode today.
- **Auto-import doesn't yet cover tenant-local components.** Only `@nebula-docs/components` is in the auto-import map. If a tenant authors `tenants/foo/components/MyWidget.tsx`, MDX still needs an explicit `import { MyWidget } from "..."`. Adding tenant-local discovery is a small extension to the catalog used by both the auto-import map and the slash menu — defer until a tenant has tenant-local components.

### 3. Custom theming (visual branding)

`theme.json` overrides on top of a base theme → CSS vars at build. Editor surface for tenants to pick their primary color, fonts, logo.

- **Where it lives**:
  - `@nebula-docs/theme` — frozen base tokens (already exists)
  - `@nebula-docs/schemas` — `theme.json` schema (already designed in nebula-cli.md)
  - `@nebula-docs/cli` — composition pipeline: globals → tenant base (`mcoe-default` / `uhc` / `optum` / `<custom>`) → `theme.json` overrides → CSS vars emitted to `dist/styles/theme.css`
  - `products/nebula-platform/` — new "Branding" settings panel parallel to GitHub App settings. Color picker for primary, font selectors, logo upload. Serializes to `theme.json` and commits via existing dirty-tracking flow.

### 4. Analytics dashboard

Read-side counterpart to `@nebula-docs/analytics` (write-side). Visitors, views, page visit counts on the home dashboard.

- **Where it lives**:
  - `@nebula-docs/analytics` — provider system. Subpath exports per provider (`@nebula-docs/analytics/firebase`, `/ga4`, etc.) for tree-shaking. **v1 ships Firebase Analytics provider** since MCOE already uses Firebase.
  - SSG runtime auto-tracker (React island) — wires DOM events to schema (`page_view`, `nav_click`, `outbound_click`, etc.) using `data-analytics-*` attributes
  - `functions/src/getAnalyticsSummary.ts` — new callable. Takes `{ repo, range }`, queries Firebase Analytics via service account, returns aggregates. Provider-reader interface so PostHog/Plausible/GA4 readers slot in later.
  - `products/nebula-platform/` — new dashboard widgets (visitors / views / top pages cards) wired to `getAnalyticsSummary`. Degrades gracefully when no provider is configured (shows "Analytics not configured").
- **Note**: provider-send-side and dashboard-read-side are different concerns. The send-side ships in `@nebula-docs/analytics`; the read-side is a Cloud Function + UI in the Platform.

### 5. Search

Pagefind. Build-time index, zero runtime dependency, multi-tenant by construction.

- **Where it lives**:
  - `@nebula-docs/cli/src/runtime/search/` — Pagefind integration: build-time indexer + a small React island for the search UI
  - Tenants opt in via `docs.json`: `"search": { "provider": "pagefind", "scopeBy": "tab" }`
  - Tenants who omit the search section ship zero search JS

---

## Chat kickoff prompts for the next workstreams

Two chats to spawn after this refactor lands. Each is self-contained — paste the kickoff into a fresh chat.

### Kickoff: Editor completion (finish Platform)

> Read `CLAUDE.md`, `.claude/architecture.md`, `.claude/nebula.md`, and `.claude/status.md`. The Platform is substantially built but three workstreams need finishing:
>
> 1. **Editor (Phase 3, Tiptap)** — many `@nebula-docs/components` exports lack a NodeView (Tabs, Accordion, Tree, Mermaid, Property/ParamField/ResponseField, Tooltip, Badge, Expandable, Columns, Example). They round-trip via `MdxRaw` today. Each one needs a `Mdx<Name>Node.tsx` under `products/nebula-platform/src/components/mdx/` registered in the Tiptap extensions. Verify edit-in-place inside child slots of Card / Frame / Step works across all NodeViews.
>
> 2. **Page settings forms** — Phase A (form skeletons) is done. Finish Phase B (hydrate from `docs.json` + MDX frontmatter on mount), Phase C (persist via dirty-tracking), Phase D (wire Trash button), Phase E (`+` button on group rows → Add page / Add group / Add existing file).
>
> 3. **Node attribute popover** — `AttributesForm` and `AttributesPopover` exist; schema coverage and wiring is incomplete. Verify each of `MdxCallout` / `MdxCard` / `MdxFrame` / `MdxSteps` / `MdxUpdate` / `MdxCodeBlock` has a defined `BlockAttrSchema`. Wire the kebab in `BlockHandle` to open `AttributesPopover`. Route `onChange` patches through `editor.commands.updateAttributes(nodeType, patch)`. Wire the popover's Trash button to `editor.commands.deleteNode(nodeType)`.
>
> Status.md is the source of truth for what's done vs open per area. Don't relitigate Tiptap as the editor surface — that's settled per `nebula.md`. Snippet resolution at editor-time is a separate concern that `@nebula-docs/mdx` handles (already extracted).
>
> Definition of done: every `@nebula-docs/components` export has a working NodeView OR is intentionally left as `MdxRaw`; page settings save round-trips through `PublishMenu`; node attributes save round-trips through Tiptap. `pnpm --filter @nebula-docs/platform typecheck` passes; SPA boots cleanly.

### Kickoff: CLI bootstrap + local dev server

> Read `CLAUDE.md`, `.claude/architecture.md`, `.claude/nebula-cli.md`, and `.claude/status.md`. The synthetic tenant is at `tenants/nebula-docs-starter-empty/` (already exists). The CLI doesn't exist yet. Bootstrap it.
>
> **Goal**: `pnpm --filter @nebula-docs/cli dev tenants/nebula-docs-starter-empty` starts an Astro dev server that renders `tenants/nebula-docs-starter-empty/content/*.mdx` using `@nebula-docs/components` and the composed theme tokens, with the navigation/sidebar from `tenants/nebula-docs-starter-empty/docs.json`.
>
> **Phase 0** (per `nebula-cli.md`): create `packages/cli/` with Astro 5 + `@astrojs/mdx` + `@astrojs/react` + Tailwind v4. Workspace deps: `@nebula-docs/components`, `@nebula-docs/schemas`, `@nebula-docs/theme`, `@nebula-docs/mdx`. Stub `bin/nebula-docs.ts` with subcommands (`init`, `dev`, `build`, `preview`, `validate`, `upgrade`). Stub JSON Schemas at `packages/cli/schemas/{docs,theme}.schema.json` (use Zod schemas in `@nebula-docs/schemas` as source).
>
> **Phase 1**: render `tenants/nebula-docs-starter-empty/` correctly. Read `docs.json` → produce file-routed Astro pages. Render MDX via `@astrojs/mdx` with components from `@nebula-docs/components`. Compose tokens (globals → `mcoe-default` base → tenant `theme.json` overrides) → CSS vars at build. Snippet resolution via `@nebula-docs/mdx`'s `remarkSnippets({ resolveFile })` plugin (filesystem-based resolveFile reading `content/snippets/`).
>
> Don't relitigate Astro vs Next/Vite/Eleventy — settled in `nebula-cli.md`. Don't introduce new packages without flagging — the seven-package framework is the boundary (see `architecture.md`).
>
> Definition of done: `pnpm --filter @nebula-docs/cli dev tenants/nebula-docs-starter-empty` shows the synthetic tenant rendering with correct theme tokens, navigation from `docs.json`, all blocks (Card, Frame, Tabs, Steps, Callout, ParamField, etc.) rendering correctly. `pnpm --filter @nebula-docs/cli build tenants/nebula-docs-starter-empty` produces a static `tenants/nebula-docs-starter-empty/dist/` that opens in a browser.

---

## Status conventions

When a workstream item lands or starts, update this doc rather than spinning up a new handoff file. The previous worktree-style handoffs (`nav-page-settings.md`, `navtree-missing-files.md`, `docs-site-migration.md`) lived in `.claude/handoffs/` and were deleted because their content is now subsumed here or in `nebula-cli.md`.

If a workstream becomes substantial enough to need its own architecture doc, add it under `.claude/<topic>.md` and link from here.
