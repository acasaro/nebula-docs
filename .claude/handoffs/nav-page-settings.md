# Handoff — Navigation Page / Group / Tab Settings forms

**Branch:** `feat/nav-page-settings` (worktree at `../mcoe-docs-nav-settings/`)
**Workspace path:** `products/nebula/`
**Parent session:** orchestrator on `main` in `/Users/anthonyasaro/Desktop/mcoe-docs/` — opens PRs back to `main`, reviews, and merges.

You are continuing a multi-session task. The prior session built the Navigation tree and the **trigger UX** for the settings panel (gear button, persistent open behavior, panel layout). You are picking up where the form bodies are stubbed — your job is to build the actual settings forms and wire them to read from / write back to `docs.json` + MDX frontmatter.

---

## What's already done (do not redo)

### Navigation tree — `src/components/NavTree.tsx`
- Renders `navigation.tabs[].groups[].pages[]` from `useDocsConfig` (which fetches `docs.json` from the connected GitHub repo via Octokit on the current branch).
- Cascading text-indent so children align under their parent's *text*; pages within a group share the parent's indent rather than getting their own column.
- Each row has hover affordances on the right:
  - **Pages**: gear icon → opens Page Settings.
  - **Groups**: `+` and gear icons → `+` will open an Add menu (not yet wired), gear opens Group Settings.
  - **Tabs**: gear opens Tab Settings.
- When a row's settings panel is open, the gear flips to `chevron-right` and the row keeps a persistent pill (independent of the file-open-in-editor pill).
- Clicking a different page in the tree closes the settings panel.

### Settings panel shell — `src/components/NavSettingsPanel.tsx`
- `position: fixed`, anchored at `left: calc(14rem + 18rem)`, `width: 550px`, `z-40`.
- Background is `bg-background` base + `bg-muted/30` overlay so it visually matches the repo aside exactly.
- Header: kind-specific title (`Page settings` / `Group settings` / `Tab settings`), Trash button (visual stub, no handler), Close button.
- Body currently renders a placeholder: `"<kind> form coming next."`.

### State plumbing — `src/routes/RepoBrowser.tsx`
- `settingsOpen: OpenNavSettings | null` lives here. Pass-through to `<NavTree>`.
- `OpenNavSettings = { key: string; kind: 'tab' | 'group' | 'page'; title: string }`.
- The descriptor is what the panel uses to know which form + which entry to render.

### Brand tokens (use these — do not invent new ones)
- `bg-primary` / `text-primary-foreground` — lime fill (`#cedc00`) with dark text. Used for `Publish`, focus rings, selection.
- `text-brand-text` — accent for text/icons that should "read brand" without contrast issues. Resolves to deep teal (`#00665e`) on light, lime on dark.
- Form rows mirror Mintlify's: `gap-6`, label box `w-[140px]` with icon+label inside, inputs are bottom-bordered (`border-0 border-b focus:border-foreground`), toggles are shadcn `Switch` size `sm`.

---

## What you're building, in order

### Phase A — kind-specific form components (no persistence yet)

Create three components under `src/components/nav-settings/`:

**`PageSettingsForm.tsx`** — fields:
| Label | Field type | Source |
|-|-|-|
| Title | text | MDX frontmatter `title` |
| Slug | text | the page path string in `docs.json` |
| External URL | url | `docs.json` page-object `externalUrl` |
| Description | text | MDX frontmatter `description` |
| Icon | icon picker | `docs.json` page-object `icon` |
| Sidebar title | text | MDX frontmatter `sidebarTitle` |
| OG Image URL | url | MDX frontmatter `og:image` |
| Tag | toggle (On/Off) | `docs.json` page-object `tag` (string when on) |
| Hidden | toggle (Yes/No) | `docs.json` page-object `hidden` |
| Keywords | chips ("Add keyword" button) | MDX frontmatter `keywords[]` |
| Mode | select (`Default`, custom values) | MDX frontmatter `mode` |

**`GroupSettingsForm.tsx`** — Title, Icon, Hidden, Tag, Expanded, OpenAPI (file/url), AsyncAPI (file/url) — all in `docs.json`.

**`TabSettingsForm.tsx`** — Title, Icon, Hidden, href, Align (`start`/`end`), Directory (`none`/`accordion`/`card`) — all in `docs.json`.

`NavSettingsPanel` switches on `settings.kind` and renders the appropriate form. Reuse shadcn primitives: `Input`, `Switch`, `Select`. Use the existing `IconPickerPopover` from `src/components/IconField.tsx` for the Icon field. Hold form state locally in each form component for now — no persistence until Phase C.

### Phase B — read existing values

Two sources to merge:
1. **`docs.json`** — already loaded by `useDocsConfig` and passed to `<NavTree>`. Add helpers to `src/lib/docsConfig.ts`:
   ```ts
   findEntry(config, key)   // Returns the matching tab/group/page-object or null.
   updateEntry(config, key, patch)   // Returns a new DocsConfig with the patch applied.
   deleteEntry(config, key)
   ```
   Keys are already encoded by `<NavTree>` as `tab:<name>`, `group:<keyPath>`, `page:<filePath>`.
2. **MDX frontmatter** — for page kinds only. The page's `.mdx` file already loads through `RepoBrowser`'s `files` map (via `fetchFileContent`). Parse the YAML frontmatter at the top of the file. Use `gray-matter` if you want a real parser — it's not in the project yet, so install it or hand-roll a tiny one (frontmatter is a small YAML block between `---` markers).

When the panel mounts, hydrate the form from these two sources.

### Phase C — persist changes

Reuse the existing dirty-tracking flow:
- **`docs.json` patches** → mutate the in-memory `docs.json` content, mark `docs.json` as dirty in the `files` map. The existing `PublishMenu` / commit flow then handles the actual GitHub commit/PR.
- **Frontmatter patches** → mutate the MDX file's `draft` content (frontmatter block at the top), mark the file dirty.

A reasonable UX: `onChange` per field updates local form state, and a "Save" or `onBlur` propagates to the dirty draft. Avoid live-saving on every keystroke — the editor is git-backed, so each change makes a dirty file visible in the PublishMenu.

### Phase D — Trash button (delete entry)

`NavSettingsPanel` already has a trash button rendered. Wire it:
- Confirm via shadcn `Dialog` ("Delete `<title>`? This will remove it from `docs.json` and (for pages) delete the `.mdx` file.").
- Call `deleteEntry(docs, key)`.
- For pages, also queue the MDX file for deletion in the commit batch (the existing `commitFiles` API supports deletions — check `src/lib/githubApi.ts`).

### Phase E — Add menus (the `+` on group rows)

`<NavTree>` currently renders an inert `+` button for groups. Open a popover with three options:
- **Add a page** → prompt for filename, create empty `.mdx` with minimal frontmatter, append the path to the group's `pages[]`.
- **Add a group** → prompt for group title, append `{ group: "<title>", pages: [] }` to `pages[]`.
- **Add existing file** → file picker (the repo tree is already loaded), append the chosen path string.

---

## Files you'll touch

| File | Why |
|-|-|
| `src/components/NavSettingsPanel.tsx` | Add the kind switch, render the appropriate form |
| `src/components/nav-settings/PageSettingsForm.tsx` (new) | The hardest form (dual-source) — start here |
| `src/components/nav-settings/GroupSettingsForm.tsx` (new) | Pure docs.json source, simpler |
| `src/components/nav-settings/TabSettingsForm.tsx` (new) | Same |
| `src/lib/docsConfig.ts` | Add `findEntry` / `updateEntry` / `deleteEntry` helpers |
| `src/lib/githubApi.ts` | Reuse existing commit helpers; verify deletion path |
| `src/routes/RepoBrowser.tsx` | Will need to thread `docs.json`'s mutate function into the panel; minor |

---

## Workflow (parent ↔ this session)

1. Work on branch `feat/nav-page-settings` from this worktree.
2. Commit frequently with descriptive messages (`feat(nav): page settings form`, `fix(nav): hydrate frontmatter`, etc.).
3. When a phase lands cleanly, click **"Make a PR"** in the Claude Code UI. It opens a PR from `feat/nav-page-settings` → `main` in `acasaro/mcoe-docs`. The parent session reviews and merges.
4. After merge, the parent will tell you to rebase onto the new `main` before continuing.
5. Don't merge into `main` yourself — the parent owns merges to keep the integration story coherent.

---

## Things to NOT do

- Don't rename or restructure existing components without checking with the parent.
- Don't introduce a different state library or form library — local `useState` + the in-memory `files` dirty map is the pattern.
- Don't write to `docs.json` outside of the existing `files` dirty-tracking flow. Same path for both MDX and `docs.json`.
- The brand colors `--brand`, `--brand-text` are settled. Don't redefine.
- "Mintlify" is *not* a name we use anywhere in our code. References are for our internal mental model only — never in identifiers, comments, or strings.

---

## Kickoff prompt for this handoff

When you start the new session in `mcoe-docs-nav-settings/`, paste this into the chat:

> Read `.claude/handoffs/nav-page-settings.md`, then start Phase A — build the three settings form skeletons (`PageSettingsForm`, `GroupSettingsForm`, `TabSettingsForm`) under `src/components/nav-settings/`, with local-state-only field bindings. Wire them into `NavSettingsPanel` via a `kind` switch. Do NOT touch persistence yet. Report back when Phase A is committed and ready to PR.
