# Nebula Docs — Workstream Status

Snapshot of where each in-flight piece stands. Refresh as work lands.

For architecture, see [.claude/architecture.md](architecture.md) (10000-ft overview), [nebula.md](nebula.md) (Platform), and [nebula-cli.md](nebula-cli.md) (CLI). For repo-wide rules, see [conventions.md](conventions.md).

---

## Editor (Phase 3, Tiptap)

The editor surface for MDX files. Tiptap (ProseMirror) doc is the in-memory state; MDX is the I/O format.

**DONE**

- Tiptap installed: `@tiptap/core`, `react`, `pm`, `starter-kit`, `extension-code-block`, `extension-placeholder`, `suggestion`.
- `products/nebula-platform/src/components/mdx/MdxEditor.tsx` — main editor. Loads via `mdxToTiptapDoc(source)`. Serializes back via `tiptapDocToMdx(doc)` on every `onUpdate`. `normalizeMdx()` round-trips a file through parser + serializer at load to dedupe drift (so opening a file doesn't mark it dirty).
- 7 NodeViews under `products/nebula-platform/src/components/mdx/`: `MdxCalloutNode`, `MdxCardNode`, `MdxCodeBlockNode`, `MdxFrameNode`, `MdxRawNode`, `MdxStepsNode` (Steps + Step), `MdxUpdateNode`.
- Slash command (`/`) — `mdx/slashCommand.ts` + `slashItems.tsx` + `SlashMenu.tsx`, built on `@tiptap/suggestion`.
- BlockHandle: drag handle + kebab affordance per block. `EditorWithBlockHandle` wraps `EditorContent` in `MdxEditor`.
- Contextual placeholders (Step, Callout, Card child paragraphs).
- Dev convenience: `window.__nebulaEditor` exposed in dev mode for REPL inspection.

**OPEN**

- Many `@nebula-docs/components` exports lack a NodeView (Tabs, Accordion, Tree, Mermaid, Property/ParamField/ResponseField, Tooltip, Badge, Expandable, Columns, Example). They round-trip via `MdxRaw` (preserves source verbatim, no editing UI). Each one needs a `Mdx<Name>Node.tsx` to become editable.
- Verify edit-in-place inside child slots of Card / Frame / Step works for paragraphs, headings, and lists. Spot-check needed across the seven existing NodeViews.
- Save flow: confirm `PublishMenu` commits the dirty MDX via Octokit (Phase 4 work). The dirty-tracking state lives in `RepoBrowser`.

---

## Page settings forms

Three forms (Page, Group, Tab) for nav-tree configuration. Phase A done; B/C/D/E pending.

**DONE — Phase A (form skeletons)**

- `products/nebula-platform/src/components/nav-settings/{PageSettingsForm,GroupSettingsForm,TabSettingsForm}.tsx`.
- All fields per the original handoff doc, wired to local `useState` (Title, Slug, External URL, Description, Icon, Sidebar title, OG image, Tag, Hidden, Keywords, Mode for Page; equivalents for Group and Tab).
- Helper rows: `FormRow.tsx` (TextRow / SelectRow / ToggleRow), `IconRow.tsx`, `KeywordsRow.tsx`.
- `NavSettingsPanel.tsx` switches on `kind` and renders the right form. Panel shell (header, close button, fixed-position aside, surface that matches the repo aside) is complete.

**OPEN — Phase B (hydrate)**

- On panel mount, hydrate forms from two sources:
  1. `docs.json` page-object / group / tab entry (already loaded by `useDocsConfig`).
  2. MDX frontmatter at the top of the page's `.mdx` (Page kind only).
- Add helpers to `products/nebula-platform/src/lib/docsConfig.ts`: `findEntry(config, key)`, `updateEntry(config, key, patch)`, `deleteEntry(config, key)`. Keys are encoded by `<NavTree>` as `tab:<name>` / `group:<keyPath>` / `page:<filePath>`.
- Frontmatter parsing: small YAML parser or `gray-matter`.

**OPEN — Phase C (persist)**

- `docs.json` patches → mutate the in-memory `docs.json`, mark dirty in the `files` map. `PublishMenu` commit flow handles GitHub.
- Frontmatter patches → mutate the MDX file's draft content (frontmatter block), mark dirty.
- UX: `onChange` updates local form state; `onBlur` (or explicit Save) propagates to the dirty draft.

**OPEN — Phase D (Trash button)**

- `NavSettingsPanel` renders a visual-stub trash button. Wire it: confirm Dialog → `deleteEntry(docs, key)` → for pages, queue MDX deletion in the commit batch (`commitFiles` in `lib/githubApi.ts` already supports deletions).

**OPEN — Phase E (Add menus)**

- `<NavTree>` renders an inert `+` button on group rows. Open a popover with three options: Add a page (filename → empty `.mdx` with minimal frontmatter), Add a group (title → `{ group, pages: [] }`), Add existing file (file picker over the loaded repo tree).

---

## Node attribute popover

Per-component prop editor opened from the BlockHandle kebab.

**DONE**

- `products/nebula-platform/src/components/AttributesForm.tsx` — schema-driven field rendering. Switches on `field.kind` (text / toggle / select / icon).
- `products/nebula-platform/src/components/AttributesPopover.tsx` — Radix popover anchored to the right side of the trigger element. Header (title + close), body (children), footer (Trash + Save Changes).
- Field primitives in `products/nebula-platform/src/components/fields/`: `TextField`, `ToggleField`, `SelectField`. Plus `IconField.tsx` at the components root.
- `products/nebula-platform/src/lib/blockSchemas/` — `BlockAttrSchema` type with `sections` and `AttrField` discriminated union.

**OPEN**

- Schema coverage for every NodeView. Verify each of `MdxCallout` / `MdxCard` / `MdxFrame` / `MdxSteps` / `MdxUpdate` / `MdxCodeBlock` has a defined schema; fill any gaps.
- Wire the kebab in `BlockHandle` to open `AttributesPopover` with the matching schema + the node's current attrs.
- `onChange` patches need to route through `editor.commands.updateAttributes(nodeType, patch)` so the Tiptap doc updates and the serializer re-emits MDX.
- "Save Changes" button currently just closes the popover — confirm whether changes apply on every keystroke (preferred) or batch on Save.
- Trash button in the popover footer is a visual stub. Wire to `editor.commands.deleteNode(nodeType)`.

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

**PLANNED**

- `packages/cli/` Phase 0 bootstrap: Astro 5 + `@astrojs/mdx` + `@astrojs/react` + Tailwind v4, workspace deps wired up, `pnpm --filter @nebula-docs/cli dev` renders a "Hello Nebula Docs" page on `localhost:4321`. Stubs at `bin/nebula-docs.ts` (`init` / `dev` / `build` / `preview` / `validate` / `upgrade`) and `schemas/{docs,theme}.schema.json`.
- A separate chat is starting on this. Coordinate via this doc (and `nebula-cli.md`) before changing the design.

**DESIGN**

- Phases 0–6 sequenced in `nebula-cli.md`. Phase 4 is "MCOE migration" — once the CLI is buildable for a synthetic tenant, MCOE moves off Docusaurus and becomes tenant zero.

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
