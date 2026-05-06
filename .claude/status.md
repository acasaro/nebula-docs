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
- Helper rows: `FormRow.tsx` (TextRow / SelectRow / ToggleRow), `IconRow.tsx`, `KeywordsRow.tsx`.
- `NavSettingsPanel.tsx` orchestrates entry resolution, value extraction, patch routing. For pages, splits patches between docs.json (icon, sidebarTitle, externalUrl, tag, hidden) and MDX frontmatter (title, description, ogImage, keywords, mode).
- `lib/docsConfigOps.ts` — `parseSettingsKey`, `findEntry`, `updateEntry`, `deleteEntry`, `appendToGroup` helpers walking the docs.json tree by key path.
- `lib/frontmatter.ts` — minimal YAML splitter/serializer + `applyFrontmatterPatch` for the editor-time mutations.
- `RepoBrowser.tsx` — derives `liveDocsConfig` from `files['docs.json'].draft` (or initial `useDocsConfig` fetch) so docs.json edits flow through the same dirty-tracking + save pipeline as MDX. Added `handleConfigChange`, `handleFrontmatterChange`, `handleDeleteOpenEntry`, `handleAddEntry`, plus a `deletions: Set<string>` queue for paths to remove on commit.
- `commitFiles` in `lib/githubApi.ts` extended: `FileChange` is now a discriminated union supporting `{ delete: true }`. When the batch contains any deletions, the function fetches the parent commit's tree recursively and submits a fresh flat tree (without `base_tree`) — every existing blob, minus the deleted paths, plus the upserted blobs. The `sha: null` + `base_tree` merge that GitHub's docs suggest does not work reliably for nested paths and returns `GitRPC::BadObjectState`; this rebuild path is verified end-to-end against `acasaro/mcoe-docs` on a real test branch.
- `PublishMenu` `PublishChange.status` extended with `"deleted"`.
- Trash button → confirm `Dialog` → removes the docs.json entry and queues the MDX for deletion (page kind only).
- `+` button on group rows → Radix popover with three options (Add page / Add group / Add existing file). Each opens a `Dialog` with appropriate input.

**OPEN**

- Slug field on the page form is read-only. Renaming a page (slug change → file move) is a follow-up — needs path-aware tracking that survives until the next commit.
- The `+` button on the top-level "Navigation" header is still inert (only group-row `+` buttons are wired). Add top-level group / tab creation if needed.

---

## Node attribute popover

Per-component prop editor opened from the BlockHandle kebab.

**DONE**

- `products/nebula-platform/src/components/AttributesForm.tsx` — schema-driven field rendering. Switches on `field.kind` (text / toggle / select / icon).
- `products/nebula-platform/src/components/AttributesPopover.tsx` — Radix popover anchored to the right side of the trigger element. Header (title + close), body (children), footer (Trash + Save Changes).
- Field primitives in `products/nebula-platform/src/components/fields/`: `TextField`, `ToggleField`, `SelectField`. Plus `IconField.tsx` at the components root.
- `products/nebula-platform/src/lib/blockSchemas/` — `BlockAttrSchema` type with `sections` and `AttrField` discriminated union. Schemas cover: callout, card, frame, step, steps, update, accordion, columns, cardGroup, expandable, paramField, responseField, requestExample, responseExample, badge.
- `BlockHandle` kebab → `AttributesPopover` is wired in `EditorWithBlockHandle`. `getBlockSchema(nodeType)` resolves the right schema. Patches apply via a `setNodeMarkup` transaction (functionally equivalent to `updateAttributes`); trash uses `deleteRange` over the active block. Edit happens on every keystroke; the "Save Changes" button is a confirm-and-close affordance.

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
- `pnpm --filter @nebula-docs/cli dev tenants/example-docs` boots Astro on `localhost:4321` rendering the synthetic tenant. `INIT_CWD` propagation in `resolveTenant.mjs` makes the relative-path arg work from the monorepo root (pnpm runs lifecycle scripts from the package dir, so naive `resolve(cwd, arg)` would fail).
- `pnpm --filter @nebula-docs/cli build tenants/example-docs` emits `tenants/example-docs/dist/{index.html, getting-started/installation/index.html, components/{cards,tabs}/index.html, api/users/index.html}` plus the `_astro/` bundle.
- File-routed pages via Astro 5 content collections: `src/content.config.ts` defines a `docs` collection with `glob({ pattern: ['**/*.mdx', '!snippets/**'], base: <tenant>/content })`. `src/pages/[...slug].astro` does `getStaticPaths` over the collection, mapping `entry.id === 'index'` → `/` and everything else to its id.
- Token composition: `src/cli/prepareAstro.mjs` reads tenant `docs.json` + `theme.json`, deep-merges `theme.json.tokens` over `getThemeById(theme.base)`, and emits `packages/cli/.nebula/tokens.css` via `@nebula-docs/theme`'s `generateTokensCss`. The CLI's `src/styles/global.css` `@import`s that file. Output verified: brand-primary CSS var resolves correctly on the rendered pages.
- Snippet resolution: `astro.config.mjs` registers `@nebula-docs/mdx`'s `remarkSnippets` plugin with a filesystem `resolveFile` that reads `<tenant>/content/snippets/<file>.mdx`. Verified end-to-end with the fixture's `<Snippet file="disclaimer" />` inlining the disclaimer Callout.
- Layout chrome: `src/layouts/DocsLayout.astro` + `src/components/{Navbar,Sidebar,SidebarGroup,Footer}.astro` consume `docs.json` for tabs/groups/pages, navbar primary + links, footer columns + copyright. Sidebar marks the current page via `aria-current="page"`.
- JSON Schemas published as Phase 0 stubs at `packages/cli/schemas/{docs,theme}.schema.json`. Authoritative shape will be generated from `@nebula-docs/schemas` Zod definitions in Phase 3.
- Component map at `src/runtime/components/registry.tsx` exposes the full `@nebula-docs/components` surface to MDX. Includes `CalloutShim` that accepts both `type` (Mintlify-style) and `variant` (our component API).

**OPEN — Phase 1 follow-ups**

- **Tailwind workspace scan.** `src/styles/global.css` adds `@source` directives for `../**/*.{astro,ts,tsx}` and `../../../components/src/**/*.{ts,tsx}` so utility classes from the symlinked workspace dep land in the bundle. Confirmed: Callout variants, Card/CardGroup, ParamField pills, RequestExample/ResponseExample all render with their @nebula-docs/components Tailwind styling.
- **Tabs / Steps as Astro components, not React.** The Astro+MDX+React boundary pre-renders nested React children to HTML strings before they reach the parent, so `Children.toArray(...).filter(isValidElement)` always sees an empty array. Hydration boundaries don't help — the children come through as strings on both sides. `src/runtime/components/{Tabs,Tab,Steps,Step}.astro` sidestep the issue entirely with Astro slots: Steps uses CSS counters for auto-numbering + a `::after` connector line; Tabs renders panels with `data-tab-title`, and a small `is:inline` script reads them at load to build the tab-button row + wire click/arrow-key/Home/End. The page route in `src/pages/[...slug].astro` merges the Astro components over `reactComponents` in the components map. Verified end-to-end: Steps shows "1, 2, 3, 4" circles connected by a vertical line; Tabs switches between panels on click and via keyboard.
- **Other introspection-pattern blocks.** `Accordion`, `Columns`, anything else that needs to read child props at render time will hit the same SSR boundary. Apply the same pattern (Astro slot wrappers) when a tenant exercises them.
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

### 2. Snippets

`<Snippet file="..." />` resolves to inlined MDX content. Resolves at **both** build-time (CLI) and editor-time (Platform) so the editor shows resolved content without a preview build.

- **Where it lives**:
  - `@nebula-docs/mdx` — `remarkSnippets({ resolveFile })` plugin. Walks MDAST for `mdxJsxFlowElement` with `name='Snippet'` and `file` attribute, calls `resolveFile(path) → string`, parses content, splices into parent.
  - `@nebula-docs/cli` — passes a filesystem-based `resolveFile` (reads `content/snippets/<file>.mdx` from disk).
  - `products/nebula-platform/` — passes an in-memory `resolveFile` reading from the loaded files map (Octokit-fetched MDX cached in `RepoBrowser`).
- **Convention**: tenant snippets live in `content/snippets/*.mdx`. Path attribute is relative to that directory: `<Snippet file="disclaimer" />` resolves to `content/snippets/disclaimer.mdx`.

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

> Read `CLAUDE.md`, `.claude/architecture.md`, `.claude/nebula-cli.md`, and `.claude/status.md`. The synthetic tenant is at `tenants/example-docs/` (already exists). The CLI doesn't exist yet. Bootstrap it.
>
> **Goal**: `pnpm --filter @nebula-docs/cli dev tenants/example-docs` starts an Astro dev server that renders `tenants/example-docs/content/*.mdx` using `@nebula-docs/components` and the composed theme tokens, with the navigation/sidebar from `tenants/example-docs/docs.json`.
>
> **Phase 0** (per `nebula-cli.md`): create `packages/cli/` with Astro 5 + `@astrojs/mdx` + `@astrojs/react` + Tailwind v4. Workspace deps: `@nebula-docs/components`, `@nebula-docs/schemas`, `@nebula-docs/theme`, `@nebula-docs/mdx`. Stub `bin/nebula-docs.ts` with subcommands (`init`, `dev`, `build`, `preview`, `validate`, `upgrade`). Stub JSON Schemas at `packages/cli/schemas/{docs,theme}.schema.json` (use Zod schemas in `@nebula-docs/schemas` as source).
>
> **Phase 1**: render `tenants/example-docs/` correctly. Read `docs.json` → produce file-routed Astro pages. Render MDX via `@astrojs/mdx` with components from `@nebula-docs/components`. Compose tokens (globals → `mcoe-default` base → tenant `theme.json` overrides) → CSS vars at build. Snippet resolution via `@nebula-docs/mdx`'s `remarkSnippets({ resolveFile })` plugin (filesystem-based resolveFile reading `content/snippets/`).
>
> Don't relitigate Astro vs Next/Vite/Eleventy — settled in `nebula-cli.md`. Don't introduce new packages without flagging — the seven-package framework is the boundary (see `architecture.md`).
>
> Definition of done: `pnpm --filter @nebula-docs/cli dev tenants/example-docs` shows the synthetic tenant rendering with correct theme tokens, navigation from `docs.json`, all blocks (Card, Frame, Tabs, Steps, Callout, ParamField, etc.) rendering correctly. `pnpm --filter @nebula-docs/cli build tenants/example-docs` produces a static `tenants/example-docs/dist/` that opens in a browser.

---

## Status conventions

When a workstream item lands or starts, update this doc rather than spinning up a new handoff file. The previous worktree-style handoffs (`nav-page-settings.md`, `navtree-missing-files.md`, `docs-site-migration.md`) lived in `.claude/handoffs/` and were deleted because their content is now subsumed here or in `nebula-cli.md`.

If a workstream becomes substantial enough to need its own architecture doc, add it under `.claude/<topic>.md` and link from here.
