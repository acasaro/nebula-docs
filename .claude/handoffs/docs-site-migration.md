# Handoff — Docs Site Migration (Docusaurus → Custom)

**Branch:** `feat/docs-site-migration` (worktree at `../mcoe-docs-site/`)
**Workspace path:** `products/docs/` (the Docusaurus site) and likely a new sibling under `products/`.
**Parent session:** orchestrator on `main` in `/Users/anthonyasaro/Desktop/mcoe-docs/` — opens PRs back to `main`, reviews, and merges.

You are starting a new multi-session workstream: replacing the current Docusaurus-based docs reading site with a custom solution that pairs with the Nebula editor (which already exists in `products/nebula/` and edits MDX + `docs.json` for the same content tree).

---

## Important: confirm scope before writing code

The original Nebula plan in [.claude/nebula.md](../nebula.md) deliberately **kept Docusaurus** as the renderer because of:
- Visual fidelity with the existing site
- `@easyops-cn/docusaurus-search-local` indexing at build time
- A real cost to rebuilding search + theming

Direction has now shifted: **the docs reading site is to be migrated off Docusaurus** to a custom solution that consumes the same `docs.json` Nebula edits. Before writing any code, you must answer (with the parent session) the following so the migration scope is concrete:

1. **Renderer target** — Vite + React SPA reading `docs.json` and rendering MDX at the route, OR a static-build pipeline (Astro / Next-on-Pages / similar) that pre-renders pages? Pick one and document the trade-offs (search, performance, DX) in the migration plan you produce.
2. **Search story** — what replaces `@easyops-cn/docusaurus-search-local`? (FlexSearch built at build time, Pagefind, Algolia, custom?)
3. **Theme story** — Nebula already shares `@nebula-docs/theme` tokens with Docusaurus's `customCss`. Confirm the new renderer reuses the same package (it should — the tokens are frozen).
4. **Content structure** — `products/docs/docs/{instance}/...` is the current Docusaurus layout (four content instances). Nebula's `docs.json` uses a flat `navigation.tabs[].groups[].pages[]` structure. Decide whether the migration:
    a. flattens content into a single tree driven by `docs.json`, or
    b. keeps four instances and represents each as a separate tab in `docs.json`.
5. **Cutover plan** — does the new site replace `products/docs/` in-place, or live alongside as a new package (e.g. `products/docs-next/`) until parity is reached?

Produce a short plan markdown (`.claude/handoffs/docs-site-migration-plan.md`) committed in your branch summarizing answers to the above. Get parent sign-off on that plan before Phase 1.

---

## Required reading

| File | Why |
|-|-|
| [.claude/nebula.md](../nebula.md) | Original architecture + the rationale for keeping Docusaurus. Read end-to-end to understand what's being reversed. |
| [.claude/architecture.md](../architecture.md) | Current docs-site internals (sidebars, swizzles, MUI theme). |
| [.claude/conventions.md](../conventions.md) | Repo-wide patterns. |
| [.claude/refactor-plan.md](../refactor-plan.md) | Backlog of in-flight cleanups in `products/docs`. |
| [CLAUDE.md](../../CLAUDE.md) | Repo-level rules — frozen-data tokens, MUI growing, behavior-preservation, etc. |
| `products/nebula/src/lib/docsConfig.ts` | Schema Nebula already consumes — your renderer reads the same shape. |
| Sample `docs.json` | Pull the current one from the connected repo (`acasaro/mcoe-docs`) at runtime; treat its structure as authoritative. |

---

## Build phases (rough — refine in your plan)

### Phase 0 — plan + parity baseline
- Write the plan doc described above.
- Snapshot current docs site behavior (route list, sidebar shape, search behavior) for parity testing later.

### Phase 1 — bootstrap the new renderer
- Stand up the chosen stack in a new package (`products/docs-next/` is the safe path — keeps Docusaurus running while you build).
- Tokens: `import "@nebula-docs/theme/dist/tokens.css"` exactly like Docusaurus does today.
- Render `@nebula-docs/components` MDX components — they're the canonical block components and Docusaurus already uses them via shims.

### Phase 2 — content rendering
- Read `docs.json` from the repo at build time.
- For each page entry, load the matching `.mdx`, parse with `@mdx-js/mdx`, render through `@nebula-docs/components`.
- Match the typography defined in `products/nebula/src/index.css`'s `.mdx-prose` rules.

### Phase 3 — navigation
- Render `navigation.tabs[].groups[].pages[]` as the sidebar/topbar/whatever the design calls for. Active-page state, hidden flag handling, group expansion.

### Phase 4 — search
- Wire the search solution chosen in Phase 0.
- Build-time index (so deploys ship a static index file).

### Phase 5 — cutover
- Swap the deploy workflow target from `products/docs/build/` to `products/docs-next/build/` (or whatever the new build dir is).
- Delete `products/docs/` once parity is confirmed and PRs from external contributors are migrated.

---

## Workflow (parent ↔ this session)

1. Work on branch `feat/docs-site-migration` from this worktree.
2. **First commit** must be the plan doc described above. Open a PR for the plan with title `docs(plan): migrate docs site off Docusaurus` so the parent can review the approach before any code lands.
3. After plan sign-off, commit phase-by-phase with descriptive messages.
4. Use the Claude Code "Make a PR" UI button on each phase boundary. The PR opens against `main`. Parent reviews + merges.
5. Don't merge to `main` yourself.
6. After each merge, rebase onto the new `main` before continuing — Nebula editor changes from the *other* session may have shipped to `main` in parallel.

---

## Coordination with the editor session

The other parallel session (`feat/nav-page-settings`) is editing `products/nebula/`. Conflicts should be rare since you're touching `products/docs*/` — but if you need to extend `docs.json` schema in `products/nebula/src/lib/docsConfig.ts`, coordinate via the parent first.

---

## Things to NOT do

- Don't change `@nebula-docs/theme` tokens — they're frozen (see CLAUDE.md).
- Don't replace `@nebula-docs/components` with a different MDX component set — they're the single source of truth.
- Don't delete `products/docs/` until parity is verified and the parent green-lights the cutover.
- "Mintlify" is *not* a name we use in our code or docs (except the link to the actual upstream `docs.json` schema). References are mental-model only.
- Don't spin up a parallel design system. Reuse `@nebula-docs/theme` and `@nebula-docs/components`.

---

## Kickoff prompt for this handoff

When you start the new session in `mcoe-docs-site/`, paste this into the chat:

> Read `.claude/handoffs/docs-site-migration.md`, then `.claude/nebula.md`, then `CLAUDE.md`. Do NOT write any source code yet. Produce a plan doc at `.claude/handoffs/docs-site-migration-plan.md` answering the five "confirm scope" questions, commit it to branch `feat/docs-site-migration`, and open a PR titled `docs(plan): migrate docs site off Docusaurus` so the parent session can sign off before Phase 1.
