# Nebula — Phase 3 Editor Handoff

This doc briefs a fresh chat on the state of Nebula's MDX editor and the work
ahead. Read this *and* `CLAUDE.md` and `.claude/nebula.md` before touching code.

## TL;DR

- **Phases 0–2 done.** Vite SPA + Firebase Auth + GitHub App + Cloud Functions
  + repo browser are all live and working end-to-end. User signs in, picks a
  repo via `<Tabs>`-style settings UI, browses the MDX file tree, opens a file.
- **Phase 3 component port is done.** 29 Mintlify-style components ported from
  `vendor/mintlify-components/` into `@nebula-docs/components`, all registered in a
  read-only `MdxRenderer` so the visual fidelity already hits the bar.
- **Phase 3 next: edit affordances.** The renderer is currently read-only. The
  editor is the contenteditable layer + per-block edit UI on top. **That's the
  job for this chat.**

## Where things stand

### Built (do not redo)

```
products/nebula/                       # Vite SPA, Tailwind v4, shadcn/ui
  src/
    main.tsx                           # bootstraps Firebase + theme
    App.tsx                            # router (sign-in / repo / settings)
    routes/
      RepoBrowser.tsx                  # tree sidebar + Visual/Source toggle
      Home.tsx, SignIn.tsx
      SettingsGitRepo.tsx              # owner/repo/branch dropdowns
      SettingsGithubApp.tsx            # GitHub App installations list
      InstallCallback.tsx              # records installation on redirect
    components/
      mdx/
        MdxRenderer.tsx                # MDAST -> React, the canvas
        registry.tsx                   # JSX name -> React component map
        jsxAttributes.ts               # MDX prop coercion
      AppShell.tsx, Sidebar.tsx, ThemeToggle.tsx, UserMenu.tsx
      ui/                              # shadcn primitives
      FileTypeIcon.tsx                 # icons-by-extension for file tree
    lib/
      mdx/parse.ts                     # unified + remark-mdx parser
      githubApi.ts                     # listInstallationRepos, fetchRepoTree, fetchFileContent
      githubToken.ts                   # mintGithubInstallationToken (callable wrapper)
      gitSettings.ts                   # Firestore: settings/git singleton
      installations.ts                 # Firestore: installations/{id}
      firebase.ts                      # bootstrap from FIREBASE_* env vars
      theme.ts                         # light/dark toggle
      repoTree.ts                      # flat-paths-to-tree builder

packages/components/src/               # @nebula-docs/components — Mintlify port
  badge/      callout/      card/      columns/      example/
  expandable/ frame/        icon/      mermaid/      property/
  step/       steps/        tabs/      tree/         update/
  accordion/  utils/cn.ts
  index.ts                             # alphabetized barrel
  video/                               # legacy, kept for Docusaurus shim

functions/src/                         # Cloud Functions (deployed to mcoe-d)
  mintGithubToken.ts                   # @octokit/auth-app -> installation token
  getInstallation.ts                   # account login + type lookup
  githubWebhook.ts                     # stub for Phase 5

firebase.json, .firebaserc, firestore.rules
```

Backed by Firebase project `mcoe-d`. GitHub App `nebula-docs` (App ID
`3507108`, install URL `https://github.com/apps/nebula-docs/installations/new`).
The connected demo repo is the legacy Mintlify-flavored `acasaro/mcoe-docs`
on github.com, not the Docusaurus monorepo we're sitting in.

### Component port — registered in `MdxRenderer`

| | Component(s) |
|---|---|
| Visual primitives | `Badge`, `Frame`, `Card`, `Tree` (+ `Tree.Folder`/`Tree.File`), `Update` |
| Callouts | `Callout`, `Note`, `Tip`, `Info`, `Check`, `Warning`, `Danger` |
| Layout | `Steps`+`Step`, `Columns`+`Column`, `CardGroup` |
| Interactive | `Tabs`+`Tab`, `Accordion`+`AccordionGroup`, `Expandable` |
| API docs | `ParamField`, `ResponseField`, `RequestExample`, `ResponseExample` |
| Diagrams | `Mermaid` (lazy-loaded) |
| Icon system | `Icon` — string name → lucide-react resolver, ~80 aliases |

29 components, all reading from a single `componentRegistry` in
`src/components/mdx/registry.tsx`. Adding one is mechanical:

1. Port from `vendor/mintlify-components/packages/components/src/components/<name>`
2. Strip vendor-only deps (URL hash sync, Mintlify CDN icon paths, scroll-spy,
   custom internal icons — substitute lucide-react)
3. Drop into `packages/components/src/<name>/`
4. Export via `index.ts`, then export from `packages/components/src/index.ts`
5. Register in `componentRegistry`

### MdxRenderer pipeline

```
source: string
  → parseMdx (unified + remark-parse + remark-gfm + remark-frontmatter + remark-mdx)
  → MDAST (mdast types from @types/mdast)
  → walker switch on node.type (paragraph / heading / list / code / mdxJsxFlowElement / ...)
  → renderJsx looks up node.name in componentRegistry, spreads attributes as props
  → React tree
```

Lowercase JSX names (`<img>`, `<br>`) route to native HTML via `renderNativeJsx`.
Unknown JSX components render an amber-bordered placeholder showing the name +
props + children — useful as a "what to port next" indicator.

Code blocks with `lang === 'mermaid'` route to `<Mermaid>` instead of `<pre>`.

The renderer is wrapped by `RepoBrowser`'s `<FileViewer>`, with a Visual /
Source toggle in the file header. The Source view is currently a `<pre>` of
the raw MDX. The Visual view is `<MdxRenderer source={...}>`.

## Polish backlog (not blocking — defer or knock out as desired)

These are real visual gaps, but they're not blocking the editor work.

1. **Shiki syntax highlighting.** Code blocks render as plain monospace. Mintlify
   uses Shiki (its dep is `shiki` + `@shikijs/transformers`). Recommended
   approach: build a `CodeBlock` component in `packages/components/src/code-block/`,
   lazy-import shiki on first use (~700KB, same lazy pattern as Mermaid in
   `mermaid/Mermaid.tsx`), render highlighted HTML via
   `dangerouslySetInnerHTML`. Wire into `renderCode` in `MdxRenderer.tsx` —
   detect `node.lang` and pass to the component. The `RequestExample` /
   `ResponseExample` wrappers already strip the inner `<pre>`'s chrome, so
   no changes needed there.

2. **Code block lang/copy menu.** Mintlify shows a floating top-right group
   on every code block: lang dropdown + copy button + kebab. This is editor
   chrome — add as part of the editor work, not in the read-only renderer.

3. **Component context menus (kebabs).** Most Mintlify components have a
   3-dot vertical menu top-right that opens a config popover. Same call: edit
   chrome, not read-only.

4. **Multi-tab support in code groups, Tabs, RequestExample, ResponseExample.**
   The MDX may have multiple code blocks inside one `<RequestExample>` (one per
   language). Currently we render whatever children come in. Multi-tab UX +
   the +/× management buttons (currently decorative on Request/Response) are
   editor concerns.

5. **GFM check-list lists, footnotes, autolinks.** Probably already work via
   remark-gfm but untested. Spot-check.

6. **Icon registry coverage.** Currently ~80 alias names → lucide. Mintlify
   uses FontAwesome's full set (thousands). For names we don't have, the
   renderer shows a small `?` placeholder. Add more aliases as docs surface
   them. The map lives in `packages/components/src/icon/Icon.tsx`.

7. **Frame `<img>` styling.** When MDX has `<Frame><img src=".../>` , the inner
   `<img>` renders as a native HTML element via `renderNativeJsx`. Frame
   styles its child container fine, but the image itself doesn't have the
   responsive constraints Mintlify gives it. Visit `index.mdx`'s "Hero Dark"
   frame to see the issue.

8. **Prop coercion edge cases.** `src/components/mdx/jsxAttributes.ts` parses
   MDX JSX attribute expressions best-effort: JSON.parse first, quoted-string
   fallback, otherwise returns `{ __mdxExpression: rawText }`. Components
   must be defensive — e.g. `Update` now accepts `tags` as array OR
   comma-separated string ("alpha, beta") OR coerces anything else to `[]`.
   The same pattern probably applies to `Property.pre` / `Property.post`
   (string array props) and any other component that takes an array-valued
   prop. Spread attributes (`{...props}`) are skipped entirely.

## THE editor

The renderer is the canvas. The editor lays inline edit affordances on top.
Mintlify's mental model: **the visible page IS the editor**, no separate edit
mode. We follow the same — when a user opens an MDX file in Nebula, every
text node and component is editable in place.

### What "edit affordances" means concretely

Three orthogonal layers, build in this order:

1. **Inline text editing for markdown nodes.** Paragraphs, headings, list
   items, blockquotes, table cells. Click into the text, contenteditable
   takes over, edits flow back into the underlying MDX string via
   `mdast-util-to-markdown` (already a transitive dep) or `remark-stringify`
   (we have it as a direct dep). This is the **biggest unlock** — once
   typing works, the surface feels like an editor.

2. **Per-component edit chrome.** Every JSX component gets:
   - **Drag handle** on the left edge for reordering
   - **Kebab menu** on the right edge → popover with the component's editable
     props (Card: title/icon/img/href; Frame: caption; Update: label/tags;
     Callout: variant picker; Tabs: per-tab title editor; etc.)
   - **+ button below** to insert a new sibling block
   - For multi-tab containers (Tabs / Accordion / RequestExample): + and ×
     for tab CRUD (the visual placeholders already exist on
     RequestExample/ResponseExample)

3. **Slash commands and block insertion.** Type `/` in an empty line → command
   palette of all registered components → pick one → block inserts. This is
   the headline UX feature once 1 and 2 are stable.

### Architectural decisions to make first

These need answers before the editor takes shape:

#### A. Contenteditable directly, or a state-machine library?

**Settled — Tiptap (ProseMirror-based) with custom NodeViews.**

Confirmed by inspecting Mintlify's dashboard editor in DevTools:

- `document.querySelectorAll('[contenteditable="true"]').length === 1` while
  editing — single editor surface, not per-block.
- `class="has-focus"` on the focused node — Tiptap's
  [`FocusClasses`](https://tiptap.dev/docs/editor/extensions/functionality/focus)
  extension default.
- `class="ProseMirror-trailingBreak"` on empty-block `<br>` — hardcoded in
  `prosemirror-view`, only present when ProseMirror is rendering.
- `data-placeholder` + `is-empty` — Tiptap's Placeholder extension.

Behaviorally, Mintlify's editor supports cross-block drag-selection, multi-block
copy-paste (heading + blockquote + paragraph at once), and document-wide undo
across edits in different blocks. None of those are achievable with per-block
contenteditable without reproducing ProseMirror in our own state machine.

We had a per-block contenteditable POC working (paragraph round-trip via
`node.position` offsets) before this signal arrived. It was reverted on the
pivot — the roughly 70 lines of `EditingContext` / `EditableParagraph` /
plain-text-paragraph helpers in `MdxRenderer.tsx` were thrown away. The
`draftContent` plumbing in `RepoBrowser.tsx` (and the dirty `●` indicator)
carries forward to Tiptap.

The phase-3 doc previously warned against MDXEditor — that warning still
stands. MDXEditor wraps Lexical with MDX-specific opinions, and that
opinionation is what fought us. **Tiptap-direct is one layer lower**: the
ProseMirror engine plus our own schema/NodeViews, no MDX-shaped wrapper. That's
the same place Mintlify lives.

#### B. Source-of-truth model.

**Settled — Tiptap-doc-as-state, MDX as the I/O format.**

Once we adopt Tiptap, the editor's ProseMirror document is the in-memory state
during a session. MDX is the boundary format:

- **Load:** MDX string → MDAST (`parseMdx`) → Tiptap doc JSON (custom converter).
- **Edit:** Tiptap owns the doc; React re-renders are scoped to NodeViews.
- **Serialize:** Tiptap doc JSON → MDX string (custom serializer), fired on
  `onUpdate` so the source view + dirty indicator stay live.

JSX components we don't have a NodeView for yet are wrapped as an opaque
`mdxRaw` atom node carrying the verbatim source string (sliced via
`node.position.{start,end}.offset` from MDAST). The serializer emits that
string back unchanged — round-trip safe even before we've built each
component's editor.

#### C. Where do edits actually live?

Currently `RepoBrowser` calls `fetchFileContent` once and passes the string
into `MdxRenderer`. Edits need a place to accumulate. Two choices:

- **In-memory until "Save" button.** Simple but loses work on page reload.
- **Auto-save to Firestore as a draft** (e.g. `drafts/{owner}/{repo}/{path}`),
  resumable across sessions. More robust, requires Firestore schema + rules
  + a "discard draft" UX.

Recommend the latter eventually, but in-memory is fine for the first iteration.

### Recommended sequence

Tight loop, ship one thing fully before starting the next:

1. **Paragraph contenteditable.** Just paragraphs. Click → cursor enters →
   typing edits the underlying MDX string. No formatting, no shortcuts, no
   newlines. Get the round-trip working.
2. **Headings.** Same pattern, all levels.
3. **List items + blockquotes.** Generalize the pattern.
4. **Bold / italic / inline code.** Markdown shortcuts (`**foo**` etc.) parsed
   on commit, or active-while-typing.
5. **One JSX component editor — pick `Callout`.** Variant dropdown, title
   field, icon picker. Validates the per-component-editor pattern.
6. **Kebab + drag handle infrastructure.** The chrome scaffolding once one
   block has been built editor-shaped.
7. **Apply the kebab editor to the next 3-5 components** (Card, Frame, Update,
   Steps).
8. **Block insertion / `+` button.** Insert plain paragraphs first, then JSX
   blocks via a slash menu.
9. **Save flow.** Wire to `RepoBrowser`'s dirty state, surface in the
   header, eventually wire to Phase 4 commit-and-PR.

Don't skip the foundational work to chase fancy block editors first — we
already learned that lesson with MDXEditor. **Get text editing right first.**

## How to start (first commit)

1. Read `CLAUDE.md` + `.claude/nebula.md` + this doc.
2. Skim `MdxRenderer.tsx`, `registry.tsx`, `RepoBrowser.tsx` to see the
   current shape.
3. Open `index.mdx` from the connected repo at
   `http://localhost:8081/repo/acasaro/mcoe-docs` to see the renderer in
   action. (Dev server: `pnpm dev:nebula`. Auth + repo connection are already
   configured per `products/nebula/.env`.)
4. Pick a position on (A), (B), (C) above. Document it back to the user
   before starting code — this is a real architectural call that should not
   be made silently.
5. Start with paragraph contenteditable. Single block, single use case,
   round-trip the MDX string. Verify with the user before generalizing.

## What NOT to do

- **Don't reach for MDXEditor again.** We tried it, scope mismatch — see the
  conversation history of the chat that produced this doc. We pivoted to
  custom precisely because Mintlify-quality block editing on top of
  Lexical-on-rails fights the mental model.
- **Don't treat any of the polish backlog items as blocking.** They are not.
  The text-editing loop is what matters. Polish lands when it lands.
- **Don't add edit chrome (kebabs, drag handles, +/× buttons) to the read-only
  `MdxRenderer`.** They belong in an editor wrapper. The current
  `RequestExample` / `ResponseExample` already have decorative +/×/trash —
  treat those as a precursor pattern; the editor wraps `MdxRenderer` and
  injects the chrome universally.
- **Don't break the Docusaurus build** (`pnpm --filter @mcoe/docs typecheck`).
  Docusaurus shims still re-export from `@nebula-docs/components`; the package
  still works for both consumers. Phase 5/6 retires the docs site for a
  custom SSG, but until then, both render targets need to keep building.
- **Don't add server-roundtrip dependencies for editing.** Keep the edit
  surface client-side. Saves go through GitHub via the existing
  `mintGithubToken` callable + Octokit client.

## First action for the next chat

> Read `CLAUDE.md`, `.claude/nebula.md`, and `.claude/nebula-phase-3-editor.md`.
> They describe the state of Nebula and the editor work ahead.
>
> Pick a position on the three architectural decisions in
> `nebula-phase-3-editor.md` (contenteditable approach, source-of-truth
> model, edit-storage location) and lay them out. Then start with paragraph
> contenteditable in `MdxRenderer` — single block, round-trip MDX string.
> Verify with me before generalizing.
