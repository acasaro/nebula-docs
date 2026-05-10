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

- `<Icon>`, `<VideoLoop>`, and the standalone `<Example>` still round-trip via `MdxRaw` (no editing UI). Add a `Mdx<Name>Node.tsx` if/when editor-time UI is needed.
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

- Time-aware greeting bound to the authenticated user (`useCurrentUser()` hook from `@nebula-docs/firebase`).
- Activity tab is currently GH-derived (commits via Octokit). Future: also overlay webhook-written activity events from Firestore so the feed shows GH App installs, pushes, and PR state changes that don't surface as commits on the default branch.

**Live data wired (2026-05-08)**

- Activity tab: GH-derived from real commits via Octokit — was already real, never mock.
- Previews tab: GH-derived branch list overlaid with Firestore `builds/` subscription. `lib/dashboard/firestore.ts` exposes `subscribeBuilds({ repoFullName }, …)` (filtered server-side by `where('repo.fullName', '==', …)` to use the auto-built single-field index, sorted client-side). `useDashboardData` keeps a `Map<branch, BuildDoc>` of the latest build per branch and overlays `status` + `previewUrl` onto each preview row. Status mapping: `status==='completed' && conclusion==='success'` → `successful`; `status` in {queued, in_progress} → `building`; everything else → `failed`. Subscription failure logs a console warning and falls through (Activity stays usable).

---

## Webhook + activity feed

GitHub webhook handler that writes events to Firestore for the SPA to consume.

**DONE**

- `functions/src/githubWebhookHandler.ts` — shared factory: HMAC-SHA256 signature verification (timing-safe), event mapping, Firestore writes.
- Prod wrapper `functions/src/githubWebhook.ts` — binds `GITHUB_WEBHOOK_SECRET`, default DB.
- Dev wrapper `functions/src/dev/githubWebhookDev.ts` — binds `DEV_WEBHOOK_SECRET`, `nebula-docs-plat-dev` DB.
- Both deployed. Dev tested end-to-end: GitHub App ping event written to `activity` collection in `nebula-docs-plat-dev`.

**Firestore schema**

- `builds/{run_id}` — keyed by GitHub workflow run ID; upserted as the run progresses (queued → in_progress → completed). Fields: `workflowName`, `branch`, `headSha`, `status`, `conclusion`, `htmlUrl`, `startedAt`, `completedAt`, `pullRequestNumber` (PR # for PR-triggered runs, `null` otherwise), `previewUrl` (only set when PR-triggered AND the tenant repo's docs.json declares `deploy.bucketBaseUrl` — see "Preview before merge" below).
- `activity/{autoId}` — append-only feed for `pull_request`, `push`, `installation`, `installation_repositories`, plus a generic catch-all entry for other events. Each doc has `event`, `action`, `summary`, `repo`, `actor`, plus event-specific fields.

**Preview URL resolution** — for PR-triggered `workflow_run` events the handler reads the tenant repo's `docs.json` via Octokit (using the same App-installation token mintGithubToken uses) and computes `previewUrl = ${docs.deploy.bucketBaseUrl}/previews/${prNumber}/`. Module-scoped cache keyed by `owner/repo` with a 5-minute TTL keeps consecutive workflow_run events for the same run (queued / in_progress / completed) from re-fetching docs.json. Tenants that haven't opted into preview builds simply omit `deploy.bucketBaseUrl`; the build doc lands without `previewUrl` and the dashboard button stays disabled.

**PARKED**

- Verify Firestore rules on `nebula-docs-plat-dev` allow `activity` / `builds` reads. The default-DB rules are correct (auth'd reads, function bypasses via admin SDK); rules are per-database, so the dev DB needs the same applied either via the GCP console or by extending `firebase.json` for multi-database deploys. The new builds-subscription on the dashboard will hit this rule — if reads fail with `permission-denied`, that's the cause.
- Prod webhook URL / secret config in the `nebula-docs` (Enterprise) GitHub App settings — only when ready to roll out to prod.
- Smoke test the preview-cleanup workflow on the dev tenant: the GH App token's bucket-write scope at PR-close time may differ from PR-open time depending on how `uhg-pipelines/immerse-actions/vaults/get-secrets@v2` resolves credentials.

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

**DONE — Preview before merge (CLI side: `--base` flag + base-prefix wiring)**

- `nebula build --base /previews/<PR#>` produces a bundle whose asset paths, sidebar links, navbar tabs, footer columns, breadcrumbs, and MDX-content `<a href>` / `<img src>` / Card href all resolve under that prefix. The flag is normalized (`/previews/42`, `/previews/42/`, and `previews/42` all collapse to `/previews/42`) before being passed to Astro's `base` config via `NEBULA_BASE`.
- `withBase()` helper in `src/runtime/lib/nav.mjs` is the choke point for layout-emitted hrefs (Sidebar, SidebarGroup, SidebarPageLink, Navbar, Footer, DocsLayout breadcrumbs). External (`http:`/`mailto:`/scheme-relative `//`), hash-only, and relative URLs pass through; site-rooted paths get the base prepended.
- MDX-content href/src rewriting: new `remarkBasePrefix` plugin in `@nebula-docs/mdx` walks the MDAST and rewrites `link` / `image` URLs plus string-valued `href` / `src` attributes on `mdxJsxFlowElement` / `mdxJsxTextElement`. Idempotent and a no-op when base is unset, so it's registered unconditionally in `astro.config.mjs`. Expression-valued attrs (`<Card href={someVar} />`) aren't rewritten — authors using those wrap with `withBase` themselves.

**Tenant workflow templates — two flavors (Firebase Hosting is the default, see [nebula-cli.md](nebula-cli.md) locked decision #5)**

- **OOSS path (legacy, available for firewall-internal tenants)** — `packages/cli/template/.github/workflows/{deploy,cleanup-preview}.yml`. `deploy.yml` triggers on push-to-main (build → ooss-deploy with sync-delete to bucket root) AND on pull_request (build with `--base /previews/<PR#>` → `aws s3 sync` to `previews/<PR#>/` with `--delete` scoped to the sub-prefix). `cleanup-preview.yml` triggers on PR close → `aws s3 rm --recursive`. Companion field `deploy.bucketBaseUrl` in `docs.json` (added to the JSON Schema stub + `@nebula-docs/schemas`'s `deployConfigSchema`) tells the webhook handler the public URL to construct preview URLs from. The webhook handler reads it via Octokit using the same App-installation token mintGithubToken uses, with a 5-min per-repo cache.
- **Firebase Hosting path (default, both dev and prod)** — uses `FirebaseExtended/action-hosting-deploy@v0` to deploy main to a primary site and PRs to Preview Channels. Channel URLs (with random hashes) aren't derivable from any config, so the workflow POSTs the channel URL to a `recordPreview` Cloud Function (shared-secret auth) which writes `previewUrl` onto `builds/{run_id}`. Same Firestore field, different population path.

**OPEN — Phase 1 follow-ups**

- **Tailwind workspace scan.** `src/styles/global.css` adds `@source` directives for `../**/*.{astro,ts,tsx}` and `../../../components/src/**/*.{ts,tsx}` so utility classes from the symlinked workspace dep land in the bundle. Confirmed: Callout variants, Card/CardGroup, ParamField pills, RequestExample/ResponseExample all render with their @nebula-docs/components Tailwind styling.
- **Tabs / Steps as Astro components, not React.** The Astro+MDX+React boundary pre-renders nested React children to HTML strings before they reach the parent, so `Children.toArray(...).filter(isValidElement)` always sees an empty array. Hydration boundaries don't help — the children come through as strings on both sides. `src/runtime/components/{Tabs,Tab,Steps,Step}.astro` sidestep the issue entirely with Astro slots: Steps uses CSS counters for auto-numbering + a `::after` connector line; Tabs renders panels with `data-tab-title`, and a small `is:inline` script reads them at load to build the tab-button row + wire click/arrow-key/Home/End. The page route in `src/pages/[...slug].astro` merges the Astro components over `reactComponents` in the components map. Verified end-to-end: Steps shows "1, 2, 3, 4" circles connected by a vertical line; Tabs switches between panels on click and via keyboard.
- **CodeGroup is broken in the renderer.** Two issues stacked: (1) `CodeGroup` is exported from `@nebula-docs/components` but not registered in the CLI's MDX components map, so MDX referencing `<CodeGroup>` throws "expected component to be defined". (2) Even if registered, it would hit the same `Children.toArray(...).filter(isValidElement)` SSR boundary as Tabs/Steps and render an empty container. Fix: write `CodeGroup.astro` + `CodeBlock.astro` shims using Astro slots; the CodeGroup script attaches `data-codeblock-tab="{filename || language}"` to each panel and builds the tab strip from those attrs at hydration. Defer until the editor-side CodeGroup the Platform team is writing in parallel stabilizes — then diff the two APIs (props, markup) and pick a single source. Don't land two divergent CodeGroup components.
- **Other introspection-pattern blocks.** `Accordion`, `Columns`, anything else that needs to read child props at render time will hit the same SSR boundary. Apply the same pattern (Astro slot wrappers) when a tenant exercises them.
- **Visual-parity audit (Editor preview ↔ CLI render).** Both consumers import from `@nebula-docs/{components,theme}`, so component-level visuals should be byte-identical — but they're not today. Drift sources: (1) different Tailwind `@source` config between Platform and CLI; (2) different font stacks (CLI loads Inter+JetBrains Mono via `@import` in global.css, Platform uses whatever its global.css sets); (3) different prose context — CLI's `.nebula-prose` rules vs the Platform's editor-context styles. Editor *chrome* (NodeView wrappers, drag handles, edit affordances) is correctly different and stays different. **Plan**: defer until CLI Phase 1 layout/sidebar/navbar is locked AND editor Phase 3 NodeView work finishes; then a focused audit — diff the same MDX rendered both places, catalog every visible difference, classify each as chrome (keep different) or component-level (extract into shared `@nebula-docs/styles` package both sides import). The shared package is the durable fix; visual vigilance is not.
- **Distribution build.** The bin runs via `tsx ./bin/nebula.mjs` so workspace TS deps load without compilation. (`node --import tsx` was the original form but doesn't resolve directory imports in workspace barrel files; the `tsx` CLI handles them natively.) For npm-published consumption, Phase 6 needs to bundle (tsup/esbuild) the CLI + its workspace deps into shippable JS so `npx nebula` works without tsx in the consumer's environment.
- **Snippet path convention.** `<Snippet file="disclaimer" />` resolves to `content/snippets/disclaimer.mdx` (the file value is relative to the snippets dir, not the content dir). The fixture had `file="snippets/disclaimer"` originally; corrected. Worth a doc note in Phase 6 once the published JSON Schema enforces the convention.

**DESIGN**

- Phases 2–6 sequenced in `nebula-cli.md`. Phase 4 is "MCOE migration" — now that the CLI builds for the synthetic tenant, MCOE can move off Docusaurus.

---

## Upcoming workstreams

Five features designed but not yet implemented. Each fits into the existing seven-package framework — none requires a new top-level package. See [architecture.md](architecture.md) for how they fit together.

### ~~1. Preview before merge~~ — DONE

Per-PR builds at `bucket/previews/<PR-number>/`, surfaced via the dashboard's existing Preview button. Split across:

- **CLI** — `--base` flag, `withBase()` helper for layout chrome, `remarkBasePrefix` plugin for MDX-content href/src rewriting, tenant workflow templates at `packages/cli/template/.github/workflows/`. See "DONE — Preview before merge" under [CLI](#cli) above.
- **Webhook** — `previewUrl` computed on `builds/{run_id}` for PR-triggered `workflow_run` events by reading `deploy.bucketBaseUrl` from the tenant's `docs.json` via Octokit (cached per-repo). See "Preview URL resolution" under [Webhook + activity feed](#webhook--activity-feed) above.
- **Platform** — `PreviewExpandedDetails.tsx` and the Preview button already read `entry.previewUrl`. The mock-data → live-data swap on Home is the parked gating item; once it lands the button is live with no further changes.

**Two URL-resolution paths, one Firestore field.** The OOSS path resolves `previewUrl` server-side: webhook reads `deploy.bucketBaseUrl` from the tenant's `docs.json` via Octokit and computes `${bucketBaseUrl}/previews/<PR#>/`. The Firebase path resolves it client-side: the deploy workflow gets the channel URL from `FirebaseExtended/action-hosting-deploy@v0` outputs and POSTs it to a `recordPreview` Cloud Function which writes the field directly. Both paths converge on `builds/{run_id}.previewUrl`; the dashboard doesn't care which produced it.

**Default deploy target reversed 2026-05-08: Firebase Hosting, not OOSS.** Tenants behind UHG firewall who need internal-only hosting can still opt into the OOSS path by populating `deploy.bucketBaseUrl` and using the OOSS workflow steps. Everyone else uses Firebase Preview Channels. Background in [nebula-cli.md](nebula-cli.md) locked decision #5.

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

### ~~4. Analytics dashboard~~ — DONE (v1, MCOE-only, Firebase Analytics provider)

Full architecture + operational runbook in [analytics.md](analytics.md). Two systems:
**write side** ships events from CLI-rendered tenant pages to GA4 via the Firebase
Analytics SDK; **read side** is a Cloud Function querying GA4 Data API on demand
for the dashboard. Same `mcoe-d` Firebase project serves both.

**Landed:**

- `@nebula-docs/analytics` (new package, eighth in the framework). Provider-agnostic
  core (`core.ts`, `provider.ts`, `events.ts`, `config.ts`, `context.ts`,
  `autoTracker.ts`) + Firebase subpath (`@nebula-docs/analytics/firebase`).
  Event schema ports the legacy Docusaurus taxonomy verbatim:
  `page_view`, `nav_click`, `outbound_click`, `protocol_click`, `code_copy`,
  `search`, `theme_switch`, `color_mode_toggle`, `scroll_depth`, `engaged_time`,
  `surface_impression`, `custom_interaction`. Auto-tracker handles DOM click
  delegation, scroll-depth + engagement-time milestones, and the
  `data-theme="dark"` color-mode watcher.
- CLI integration: `prepareAstro.mjs` reads `docs.json.analytics` + workspace
  root `.env` (via Node 22's `process.loadEnvFile`) and emits
  `packages/cli/.nebula/analyticsConfig.mjs` (gitignored). Layout-side
  `<AnalyticsBootstrap />` (used by both `DocsLayout` and `CustomLayout`)
  dynamic-imports `runtime/analytics/bootstrap.mjs` from inside an inline
  module script — Astro's hoisted-script bundler dropped a side-effect-only
  import, so we trigger the module with `import().catch(...)`. Tenants opt in
  via `docs.json.analytics: { provider: "firebase" }`; absent → bootstrap exports
  `null` and no analytics JS runs.
- `tenants/mcoe-docs/docs.json` opted in. End-to-end verified:
  `page_view`, `nav_click`, `scroll_depth` events flow into GA4 in the
  console's DebugView from local CLI dev runs.
- `functions/src/getAnalyticsSummaryHandler.ts` — shared GA4 Data API query
  shape (8 parallel queries: current + previous totalUsers, current +
  previous screenPageViews, current + previous search-event count, daily
  timeseries, top pages). Returns `AnalyticsSummaryWire` (dates as ISO
  strings to round-trip cleanly through Firebase callable JSON).
- `functions/src/getAnalyticsSummary.ts` (prod) + `dev/getAnalyticsSummaryDev.ts`
  (dev) — auth-gated callables, no VPC (GA4 is public Google network),
  `defineSecret('GA4_SERVICE_ACCOUNT_JSON')` + `defineString('GA4_PROPERTY_ID', { default: '533814457' })`.
  Both wrappers use the same secret because the same Firebase project serves
  both env variants — no env split on the GA4 property.
- Service account: `firebase-adminsdk-fbsvc@mcoe-d.iam.gserviceaccount.com`,
  granted Viewer on the GA4 property (Property ID `533814457`). JSON stored
  via `firebase functions:secrets:set GA4_SERVICE_ACCOUNT_JSON --data-file=...`
  per the [secrets memory rule](feedback_firebase_secrets_data_file.md).
- `getAnalyticsSummaryDev` deployed to `mcoe-d` (us-central1).
  `package.json deploy:dev` script extended.
- Platform `/analytics` route: `routes/Analytics.tsx` +
  `components/analytics/{AnalyticsPage, MetricCard, VisitorsChart,
  TopPagesTable, TopUsersTable, DateRangePicker}.tsx`. SVG bar chart
  hatches the partial-day bucket via `<pattern>` so users can tell
  finalized data from in-progress data. `lib/analytics/useAnalyticsSummary.ts`
  resolves `env.fn.getAnalyticsSummary` (`Dev` vs unsuffixed) and decodes
  the wire response back to `Date` instances. Verified against real
  numbers — 11 visitors / 438 views / top pages list shows actual MCOE
  paths.
- Search-event tracking wired in `packages/cli/src/runtime/search/SearchModal.tsx`:
  fires `trackDeduped('search', { ...ctx, search_term })` after Pagefind
  returns results, dedupe-keyed on the term so typing doesn't fan out.
- Sidebar nav: `BarChart3` icon between Assets and Git settings.

**Open / deferred:**

- **Prod function deploy.** `getAnalyticsSummary` (no `Dev` suffix) was written
  but only `:dev` deployed. Run `pnpm --filter @nebula-docs/functions deploy:prod`
  before flipping the SPA to `NEBULA_ENV=prod`.
- **Top users column always empty.** GA4 Data API doesn't expose user-level
  breakdowns without `setUserId()` having been called. Public docs are anonymous
  traffic — wire requires either BigQuery export or a sign-in flow on the docs
  side. Dashboard column shows "No active users yet" honestly.
- **No caching on the function.** Editor-only audience today. Add a 5-minute
  Firestore cache the moment the dashboard goes wider.
- **Phase 4: `data-analytics-surface` tagging on Nebula components.** Today nav
  clicks come back as generic `surface: "link"` with the link text as the label.
  Tagging Card / FeatureCard / navbar tabs / footer columns in
  `packages/components/` would give cleaner aggregations.
  Auto-tracker already reads the attribute; components just need to emit it.
- **`deriveSiteContext` is MCOE-specific.** Lift the instance set into a
  tenant config when tenant #2 lands.
- **Home dashboard widgets.** The original design called for visitors / views
  / top pages cards on the Home dashboard too. Build out once the
  `/analytics` page settles — the same hook + components compose into the
  Home layout.

### ~~5. Search~~ — DONE (Pagefind)

Pagefind. Build-time index, zero runtime dependency, multi-tenant by construction. Tenants opt in via `docs.json.search`; omitting the key ships zero search JS / no Pagefind index.

**Landed:**

- `@nebula-docs/schemas`:
  - `src/docs/search.ts` — `searchConfigSchema` Zod schema with `provider: "pagefind"` (default) and `scopeBy: "tab" | "page" | "none"` (default `"tab"`). Re-exported from `src/docs/index.ts` and the package barrel.
- `packages/cli/schemas/docs.schema.json` — JSON Schema stub tightened: `search` object now has `additionalProperties: false`, defaults documented, enum gates on both fields. Authoritative shape will be generated from the Zod schema in Phase 3.
- `@nebula-docs/cli`:
  - `src/integration/searchIntegration.mjs` — Astro integration. `astro:build:done` hook reads the tenant's `docs.json`, no-ops when `search` is absent, otherwise calls Pagefind's Node API (`createIndex` → `addDirectory` → `writeFiles`) against the built `dist/`. Output lands at `dist/pagefind/{pagefind.js, fragment/, index/, wasm.*.pagefind, ...}` next to the static HTML. Pagefind chosen over the CLI-spawn approach because errors surface as JS rejections instead of opaque exit codes.
  - `astro.config.mjs` — registers the integration alongside `mdx()` and `react()`.
  - `src/runtime/search/pagefindClient.ts` — typed wrapper around Pagefind's runtime entry. Resolves `<base>/pagefind/pagefind.js` once per page via `import(/* @vite-ignore */ url)` so Vite doesn't try to resolve at build time (the file only exists post-`astro build`). Calls `pagefind.options({ baseUrl })` so result URLs are correct under preview deploys at `/previews/<PR#>/`. Returns `null` when the index is missing (dev mode), letting the modal render an "available after build" placeholder.
  - `src/runtime/search/SearchModal.tsx` — single React island. Listens for `nebula:search:open` events on `document`, plus global `/`, `Cmd-K`, `Ctrl-K`. The `/`-key heuristic (skip when `<INPUT>` / `<TEXTAREA>` / contenteditable is the event target) mirrors Algolia DocSearch's behavior so typing a slash inside any form field doesn't yank focus. Lazy-loads Pagefind on first open; on subsequent opens it's already in `pagefindRef.current`. Debounced search (`pf.debouncedSearch(query, {}, 80ms)`) → top 30 results resolved via `result.data()` → grouped by `meta.tab` when `scopeBy="tab"`, flat list otherwise. Active-row tracking + arrow-key nav + Enter to navigate. Body-scroll locked while open. Theming via the `--mcoe-*` CSS vars already emitted by `@nebula-docs/theme`; results' `<mark>` tags (Pagefind highlights matches automatically) restyled to use `--mcoe-brand-primary`.
  - `src/runtime/search/SearchIsland.astro` — wraps the React island with `client:load` plus a `<style is:global>` block carrying the modal CSS. Single import surface for the layouts.
  - `src/components/Navbar.astro` — search button gated on `Boolean(docs.search)`. Carries `data-nebula-search-trigger`; an inline `<script is:inline>` wires the click to `document.dispatchEvent(new CustomEvent('nebula:search:open'))`. Keeps the modal a single React island instead of forcing the whole navbar through React.
  - `src/layouts/{DocsLayout,CustomLayout}.astro` — both layouts compute the active tab via `tabContainsSlug` and stamp `data-pagefind-meta="tab:<TabName>"` on the article body, gated on `searchConfig` so opt-out tenants emit no Pagefind attrs at all. `<SearchIsland>` is rendered only when `searchConfig` is non-null. Astro emits the SearchModal JS chunk to `_astro/` regardless (the import exists statically), but no HTML page references it on opt-out tenants, so browsers never fetch it.
- Both starter fixtures (`tenants/nebula-docs-starter/docs.json` and `tenants/nebula-docs-starter-empty/docs.json`) opt in: `"search": { "provider": "pagefind", "scopeBy": "tab" }`. MCOE's `tenants/mcoe-docs/docs.json` opts in too.

**Verified:**

- `pnpm --filter @nebula-docs/cli build tenants/nebula-docs-starter-empty` → indexes 5 pages in ~80ms, writes `dist/pagefind/`. The kitchen-sink `nebula-docs-starter` builds 32 pages and produces an 832KB `dist/pagefind/` (5.5% of the 15MB total dist).
- Typechecks: `pnpm --filter @nebula-docs/cli typecheck` and `pnpm --filter @nebula-docs/schemas typecheck` both pass.
- Modal interaction tested via `nebula preview tenants/nebula-docs-starter`: navbar button + Cmd-K both open the modal, querying `callout` returned three correctly-grouped results under the "Components" tab heading, click-through navigated to the page.
- Zero-cost opt-out: temporarily removed `search` from `nebula-docs-starter-empty/docs.json` and rebuilt. The integration logged "docs.json has no search block — skipping Pagefind index" and produced a `dist/` with **0** `data-nebula-search-trigger` buttons, **0** `data-pagefind-body` markers, **0** `astro-island` references for SearchModal, and **0** HTML pages referencing the SearchModal JS chunk. The chunk file is still emitted to `_astro/` as a side artifact (Vite tree-shaking can't remove it because the static `import` graph reaches it), but it's never loaded at runtime — disk-only cost, irrelevant for hosting bandwidth.

**Open / known limitations:**

- **Dev mode shows "available after build" placeholder.** Astro dev serves source modules, not built HTML, so there's no Pagefind index to query. The modal handles the missing-index 404 gracefully. A live dev index would require running Pagefind on each HMR rebuild — deferred until a tenant complains.
- **The unreferenced SearchModal chunk in `_astro/`.** ~50KB on disk on opt-out tenants. Removing it cleanly would require a conditional import path (e.g. `astro.config` integration that skips registering the React island when no search config is found at build start). Not worth the complexity until a tenant flags it.
- **`scopeBy: "page"` is wired in the schema but currently renders flat (no group headers) — same as `"none"`.** The original UX target ports MCOE's tab-scoped results (the `"tab"` mode), which is the only one a real tenant has asked for. `"page"`-mode result grouping (one entry per page with sub-snippets) would need the modal to fetch multi-snippet `data()` per result and re-render per-section — straightforward extension if anyone needs it.
- **Analytics emission.** The schema already has a `search` event (per analytics workstream). Wiring `data-analytics-*` attributes onto the modal's input + result links is deferred until the analytics workstream lands its auto-tracker; the hook point is `SearchModal.tsx`'s input `onChange` and result `<a>` markup.

---

## Chat kickoff prompts for the next workstreams

Self-contained kickoffs — paste any of these into a fresh chat.

### Kickoff: Editor completion (finish Platform)

> Read `CLAUDE.md`, `.claude/architecture.md`, `.claude/nebula.md`, and `.claude/status.md`. The Platform is substantially built but three workstreams need finishing:
>
> 1. **Editor (Phase 3, Tiptap)** — many `@nebula-docs/components` exports lack a NodeView (Tabs, Accordion, Tree, Mermaid, Property/ParamField/ResponseField, Badge, Expandable, Columns, Example). They round-trip via `MdxRaw` today. Each one needs a `Mdx<Name>Node.tsx` under `products/nebula-platform/src/components/mdx/` registered in the Tiptap extensions. Verify edit-in-place inside child slots of Card / Frame / Step works across all NodeViews.
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

### Kickoff: Search (Pagefind)

> Read `CLAUDE.md`, `.claude/architecture.md`, `.claude/nebula-cli.md` (especially the "Search" section starting line 505 — the provider decision is locked), and `.claude/status.md` (workstream "5. Search" at line 258).
>
> **Goal**: docs sites built by the CLI ship a working search box. `/` opens the modal, results group by tab, theming follows token-driven styling, and tenants who omit the `search` config in `docs.json` ship zero search JS.
>
> **Settled context — don't relitigate**
>
> - **Provider is Pagefind.** Multi-tenant by construction (each tenant builds → each tenant gets their own static index in their own `dist/`). Zero runtime dependencies. UI is wrapped in our own React island with token-driven styling. Algolia DocSearch was rejected (hosted, per-tenant index setup, scales with tenants). See `nebula-cli.md` lines 505–523.
> - **Opt-in shape.** `docs.json` carries `"search": { "provider": "pagefind", "scopeBy": "tab" }`. Future providers (Algolia, Typesense) can land behind the same interface; Pagefind is the default. Schema lives in `@nebula-docs/schemas`.
> - **UX target ports MCOE's existing nav search**: `/`-key shortcut to open, scoped results per tab, search shortcut chip in the navbar. The legacy site uses `@easyops-cn/docusaurus-search-local` — Pagefind replaces it.
> - **Analytics already has a `search` event** in the schema (see `nebula-cli.md` line 535). Wire emission via the existing `data-analytics-*` attribute convention when the analytics workstream lands; for now just leave the hook.
>
> **Where it lives**
>
> - `packages/cli/src/runtime/search/` — the integration. Indexer (post-build) + a small React island for the modal UI.
> - `packages/cli/src/components/Navbar.astro` — render the search trigger when `docs.json.search` is present.
> - `packages/cli/astro.config.mjs` (or a new integration hook) — chain Pagefind's CLI after `astro build` so the index lands next to the static HTML.
> - `packages/schemas/` — extend `docs.schema` with the `search` object.
> - `packages/cli/template/docs.json` — enable Pagefind in the starter scaffold.
>
> **Order**
>
> 1. Schema first: extend `@nebula-docs/schemas` with the `search` config object; regenerate the JSON Schema stub at `packages/cli/schemas/docs.schema.json`.
> 2. Build pipeline: run `pagefind --site dist` after Astro build inside the CLI's `build` command. Verify `dist/pagefind/` lands.
> 3. UI island: React component using `@pagefind/default-ui` (or Pagefind's JS API directly if we want to fully own the markup — the latter is closer to "output owned"). Token-driven styling via the same CSS vars `@nebula-docs/theme` emits.
> 4. Navbar trigger + `/` keybinding + Cmd/Ctrl-K. Scope filtering keyed off `scopeBy: "tab"` reading the current tab from the page metadata.
> 5. Verify zero-cost opt-out: tenant deletes `search` from `docs.json` → the navbar trigger disappears AND no Pagefind JS/wasm is loaded on the page.
>
> **Edge cases to think through (not pre-decided)**
>
> - Pagefind run as a post-build CLI step vs. an Astro integration hook (`astro:build:done`). Integration hook is cleaner; CLI step is more debuggable. Prefer the integration unless something blocks it.
> - The React island lives downstream of the SSR boundary that bit us with Tabs/Steps (status.md:161). The search modal is leaf-interactive (no `Children.toArray` introspection), so a single-island React component should be fine — but verify before assuming.
> - Index size for the tenant fixture. Pagefind chunks well; sanity-check on `tenants/nebula-docs-starter` (the populated starter) and confirm the index doesn't dominate `dist/`.
> - Theme switching: the modal must react to `documentElement.dark` like `SourceEditor` does (status.md:30 — MutationObserver pattern is already in the repo).
>
> **Definition of done**
>
> - `pnpm --filter @nebula-docs/cli build tenants/nebula-docs-starter` produces `dist/pagefind/` with a populated index.
> - On the rendered site, `/` opens a styled modal; results filter as you type and group by tab.
> - Setting `docs.json.search` to `null` (or removing the key) removes the trigger and ships no Pagefind JS.
> - `pnpm --filter @nebula-docs/cli typecheck` and `pnpm --filter @nebula-docs/schemas typecheck` pass.
> - Update `.claude/status.md` — move Search from "Upcoming workstreams" to its own DONE section under CLI.

### Kickoff: Preview before merge

> Read `CLAUDE.md`, `.claude/architecture.md` (especially the "End-to-end editing flow" starting line 99 — preview is step 7, and the upcoming-features table line 170), `.claude/nebula-cli.md`, and `.claude/status.md` (workstream "1. Preview before merge" at line 178, plus the "Webhook + activity feed" section at line 117 for the existing Firestore schema).
>
> **Goal**: every PR opened against a tenant repo produces a static build at `bucket/previews/<PR-number>/`, the Cloud Function records the URL on the corresponding `builds/{run_id}` doc, and the dashboard's existing Preview button opens it in a new tab.
>
> **Settled context — don't relitigate**
>
> - The flow is already documented as the canonical editing path: PR-triggered build with `--base /previews/<PR#>/`, main-triggered build to bucket root. See `architecture.md` line 112.
> - The Platform UI already exists: `products/nebula-platform/src/components/dashboard/PreviewsTable.tsx` and `PreviewExpandedDetails.tsx` read `entry.previewUrl` and render the link. Today they read mock data; this workstream feeds them real data.
> - The webhook handler (`functions/src/githubWebhookHandler.ts` line 79) already writes `builds/{run_id}` on `workflow_run` events. We extend the doc shape with `previewUrl` for PR-triggered runs.
> - Hosting is per-tenant OOSS bucket. CI is `uhg-runner` for prod tenants. (`nebula-cli.md` line 150.)
>
> **Where it lives**
>
> - `@nebula-docs/cli` — accept `--base <path>` flag on `build`, pass through to Astro's `base` config. Verify the rendered HTML's asset paths resolve under that base.
> - `packages/cli/template/` — **doesn't exist yet.** Created as part of the `nebula init` scaffold. This workstream stands up two workflow files inside it:
>   - `.github/workflows/deploy.yml` — `on: push (main)` builds without base → bucket root; `on: pull_request` builds with `--base /previews/${{ github.event.pull_request.number }}/` → bucket sub-path.
>   - `.github/workflows/cleanup-preview.yml` — `on: pull_request (closed)` deletes `bucket/previews/<PR-number>/`.
> - `functions/src/githubWebhookHandler.ts` — when a `workflow_run` payload's `pull_requests[]` is non-empty (PR-triggered), compute `previewUrl = ${tenantBucketBase}/previews/${pr.number}/` and merge it into the `builds/{run_id}` write. Both prod (`githubWebhook.ts`) and dev (`dev/githubWebhookDev.ts`) wrappers pick it up since they share the factory.
> - `products/nebula-platform/` — Preview button reads `build.previewUrl`. Already wired in the mock; the swap from `mockData.ts` to live Firestore subscriptions is the parallel parked item (status.md:111) — call it out as a dependency, not a blocker.
>
> **Order** (matches `status.md` line 188)
>
> 1. **CLI flag.** `nebula build --base /previews/123/` produces a `dist/` whose HTML, CSS, JS, and asset references resolve under that prefix. Verify by serving the dist/ at that prefix locally and clicking around — internal nav, image src, Pagefind paths if Search has landed.
> 2. **Workflow YAML in the tenant template.** Two files. The deploy workflow needs to authenticate to the bucket; reuse the existing pattern from `products/docs/` if there's a precedent (it's the legacy site's deploy chain). The cleanup workflow needs the same auth.
> 3. **Webhook URL computation.** This is the trickiest piece — see edge cases. Add `previewUrl` to the `builds/{run_id}` shape documented at `status.md:130`.
> 4. **Platform button wiring.** Confirm the existing UI reads `previewUrl` correctly once real data flows. The mock-to-live Firestore swap is a separate parked item; if that lands first, this becomes a no-op.
>
> **Edge cases — flag, don't pre-decide**
>
> - **Bucket base URL is per-tenant.** The function needs to know the public base URL of each tenant's bucket to construct `previewUrl`. Options: (a) tenant exposes it in `docs.json`, function reads via Octokit on each webhook; (b) tenant-keyed config map in the function; (c) the workflow itself writes the URL to a separate Firestore doc on completion (`build_artifacts/{run_id}`) so the function reads it back. Pick one, document the choice.
> - **PR number from `workflow_run`.** The payload carries `pull_requests[]` populated when the run is PR-triggered. Cross-check `head_branch !== default_branch` is not enough on its own.
> - **Reopened PRs.** Index by PR number, not by run id, so a reopened PR redeploys to the same path.
> - **Astro `base` trailing slash.** Astro's behavior with/without trailing slash matters for the bucket sub-path. Verify with the synthetic tenant before locking the flag shape.
> - **Cleanup workflow auth.** The cleanup runs on PR close, which means the GH App's token may not have bucket-write at that moment depending on how secrets are scoped. Worth a smoke test on the dev tenant.
> - **Dev-side parity.** Functions have prod/dev variants. The shared `githubWebhookHandler` factory means a single change covers both, but verify the dev path on the public-GH dev App + `nebula-docs-plat-dev` Firestore database before declaring done.
>
> **Definition of done**
>
> - `nebula build --base /previews/42/` produces a bundle that loads correctly when served from that prefix.
> - `packages/cli/template/.github/workflows/{deploy,cleanup-preview}.yml` exist; a tenant scaffolded via `nebula init` ships with them.
> - Open a test PR on a dev-app-installed tenant repo → `builds/{run_id}` in `nebula-docs-plat-dev` Firestore has a populated `previewUrl` field → manually visiting the URL shows the PR's content.
> - Closing the PR deletes the sub-path from the bucket.
> - The Platform Preview button opens the URL in a new tab (verifiable as soon as the parked Firestore-subscription swap lands; until then, sanity-check by injecting a synthetic `builds/` doc into the dev DB).
> - `pnpm --filter @nebula-docs/cli typecheck` and `pnpm --filter @nebula-docs/functions typecheck` pass.
> - Update `.claude/status.md` — move Preview before merge from "Upcoming workstreams" into the relevant DONE sections (split across CLI, Webhook, Platform).

---

## Status conventions

When a workstream item lands or starts, update this doc rather than spinning up a new handoff file. The previous worktree-style handoffs (`nav-page-settings.md`, `navtree-missing-files.md`, `docs-site-migration.md`) lived in `.claude/handoffs/` and were deleted because their content is now subsumed here or in `nebula-cli.md`.

If a workstream becomes substantial enough to need its own architecture doc, add it under `.claude/<topic>.md` and link from here.
