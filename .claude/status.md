# Nebula Docs — Workstream Status

Snapshot of where each in-flight piece stands. Refresh as work lands.

For architecture, see [nebula.md](nebula.md) (Platform) and [nebula-ssg.md](nebula-ssg.md) (SSG). For repo-wide rules, see [conventions.md](conventions.md).

---

## Editor (Phase 3, Tiptap)

The editor surface for MDX files. Tiptap (ProseMirror) doc is the in-memory state; MDX is the I/O format.

**DONE**

- Tiptap installed: `@tiptap/core`, `react`, `pm`, `starter-kit`, `extension-code-block`, `extension-placeholder`, `suggestion`.
- `products/nebula/src/components/mdx/MdxEditor.tsx` — main editor. Loads via `mdxToTiptapDoc(source)`. Serializes back via `tiptapDocToMdx(doc)` on every `onUpdate`. `normalizeMdx()` round-trips a file through parser + serializer at load to dedupe drift (so opening a file doesn't mark it dirty).
- 7 NodeViews under `products/nebula/src/components/mdx/`: `MdxCalloutNode`, `MdxCardNode`, `MdxCodeBlockNode`, `MdxFrameNode`, `MdxRawNode`, `MdxStepsNode` (Steps + Step), `MdxUpdateNode`.
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

- `products/nebula/src/components/nav-settings/{PageSettingsForm,GroupSettingsForm,TabSettingsForm}.tsx`.
- All fields per the original handoff doc, wired to local `useState` (Title, Slug, External URL, Description, Icon, Sidebar title, OG image, Tag, Hidden, Keywords, Mode for Page; equivalents for Group and Tab).
- Helper rows: `FormRow.tsx` (TextRow / SelectRow / ToggleRow), `IconRow.tsx`, `KeywordsRow.tsx`.
- `NavSettingsPanel.tsx` switches on `kind` and renders the right form. Panel shell (header, close button, fixed-position aside, surface that matches the repo aside) is complete.

**OPEN — Phase B (hydrate)**

- On panel mount, hydrate forms from two sources:
  1. `docs.json` page-object / group / tab entry (already loaded by `useDocsConfig`).
  2. MDX frontmatter at the top of the page's `.mdx` (Page kind only).
- Add helpers to `products/nebula/src/lib/docsConfig.ts`: `findEntry(config, key)`, `updateEntry(config, key, patch)`, `deleteEntry(config, key)`. Keys are encoded by `<NavTree>` as `tab:<name>` / `group:<keyPath>` / `page:<filePath>`.
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

- `products/nebula/src/components/AttributesForm.tsx` — schema-driven field rendering. Switches on `field.kind` (text / toggle / select / icon).
- `products/nebula/src/components/AttributesPopover.tsx` — Radix popover anchored to the right side of the trigger element. Header (title + close), body (children), footer (Trash + Save Changes).
- Field primitives in `products/nebula/src/components/fields/`: `TextField`, `ToggleField`, `SelectField`. Plus `IconField.tsx` at the components root.
- `products/nebula/src/lib/blockSchemas/` — `BlockAttrSchema` type with `sections` and `AttrField` discriminated union.

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

- `products/nebula/src/routes/Home.tsx` (route) + `components/dashboard/DashboardHomePage.tsx` (page) + 13 supporting components (`DashboardHeader`, `DeploymentHeroCard`, `ActivityTable`, `PreviewsTable`, `ActivityRow`, `ActivitySection`, `BranchPill`, `StatusPill`, `NebulaBotAvatar`, `DeploymentLogList`, `DeploymentThumbnail`, `LiveExpandedDetails`, `PreviewExpandedDetails`).
- Layout, hero card, segmented tab toggle, expanded rows — all matching the visual target.
- Mock data fixtures in `products/nebula/src/lib/dashboard/`.

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

## SSG

Multi-tenant Astro-based static site generator. Design doc: [nebula-ssg.md](nebula-ssg.md). All architectural decisions there are locked.

**PLANNED**

- `packages/ssg/` Phase 0 bootstrap: Astro 5 + `@astrojs/mdx` + `@astrojs/react` + Tailwind v4, workspace deps wired up, `pnpm --filter @nebula-docs/ssg dev` renders a "Hello Nebula Docs" page on `localhost:4321`. Stubs at `bin/nebula-docs.ts` (`init` / `dev` / `build` / `preview` / `validate` / `upgrade`) and `schemas/{docs,theme}.schema.json`.
- A separate chat is starting on this. Coordinate via this doc (and `nebula-ssg.md`) before changing the design.

**DESIGN**

- Phases 0–6 sequenced in `nebula-ssg.md`. Phase 4 is "MCOE migration" — once the SSG is buildable for a synthetic tenant, MCOE moves off Docusaurus and becomes tenant zero.

---

## Status conventions

When a workstream item lands or starts, update this doc rather than spinning up a new handoff file. The previous worktree-style handoffs (`nav-page-settings.md`, `navtree-missing-files.md`, `docs-site-migration.md`) lived in `.claude/handoffs/` and were deleted because their content is now subsumed here or in `nebula-ssg.md`.

If a workstream becomes substantial enough to need its own architecture doc, add it under `.claude/<topic>.md` and link from here.
