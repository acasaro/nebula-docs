# Visual fidelity audit — CLI renderer

The user's actual ask: **make the CLI's rendering of components, spacing,
and prose style match what the editor already shows.** The chrome
(sidebar, navbar, page header, TOC) is fine — leave it alone. The drift
is in the component layer that wraps shared `@nebula-docs/components` blocks.

Reference target: the Platform's editor preview
(`products/nebula-platform/src/index.css`'s `.mdx-prose` block + the
shared component library at `packages/components/`).

Scope: `tenants/nebula-docs-starter` (the populated tenant — per
[`feedback_cli_test_tenant.md`](~/.claude/projects/-Users-anthonyasaro-Desktop-mcoe-docs/memory/feedback_cli_test_tenant.md))
until every page renders identically to its editor preview. No new
components. No editor changes unless they're a bug fix that benefits
both consumers.

Iteration model: one or two components per round, then user review.
Each round captured below.

---

## What's landed (in order)

### Round 1 — port `.mdx-prose` typography from Platform to CLI

CLI had its own `.nebula-prose` block that diverged from Platform's
`.mdx-prose`. Renamed CLI wrapper class to `.mdx-prose` (matches Platform),
ported all heading sizes, paragraph spacing, list indentation, blockquote
border, table chrome, etc. into `packages/cli/src/styles/global.css`.
Added the same Callout / Step content-margin reset rules.

### Round 2 — bring CLI's Tailwind context in line with Platform

Components in `@nebula-docs/components` use Tailwind utilities like
`text-foreground`, `bg-muted`, `border-border`, plus `dark:` variants.
The CLI defined NONE of the underlying tokens, and Tailwind v4's default
`dark:` is media-query-based (not class-based). Added to CLI's global.css:

- `@custom-variant dark (&:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *))` — class/attr-based dark mode that matches BOTH the Platform's `.dark` convention and the CLI's existing `[data-theme="dark"]` toggle.
- Shadcn-style root tokens (`--background`, `--foreground`, `--card`, `--muted`, `--border`, etc.) mapped to CLI's existing `--mcoe-*` palette.
- `@theme inline` block exposing those tokens as Tailwind color names.
- `@layer base` reset (`* { border-color }`, `body { bg-background text-foreground }`).

### Round 3 — Callout

`<Callout type="info">` was rendering as the gray "custom" variant with
no icon and no color in CLI. Root cause: my auto-import plugin injects
`import { Callout } from "@nebula-docs/components"` into MDX, which
shadows the page's `components` map (where a `CalloutShim` translates
`type` → `variant`). Fix: made `Callout` natively accept BOTH `type`
(Mintlify-style alias) and `variant`. No shim needed in either consumer.

### Round 4 — `_sharedDark` surfaces missing from generated tokens.css

Dark mode was painting white body bg + light text → unreadable. The
theme's `darkMode` block (where `bgPrimary`/`borderDefault`/etc. live)
was generated into TS but never emitted into `tokens.css` —
`generateTokensCss` only emitted `globals.darkOverrides` (text colors),
assuming a runtime React provider would handle the rest. The CLI is
static + has no provider. Fix in `packages/theme/src/cssGen.ts` to merge
`theme.darkMode` into the static `[data-theme="dark"]` block alongside
`globals.darkOverrides`.

### Round 5 — dark-mode FOUC

White flash on every navigation in dark mode. Root cause: the theme
toggle script lived at the end of the navbar (`<body>`); the page
painted with default light tokens, THEN the script ran and flipped
`data-theme="dark"`, then the browser re-painted. Fix: moved the
localStorage read + attribute-set into a blocking `<head>` script in
`DocsLayout.astro` so the correct theme is set before any paint.

### Round 6 — Card body underlining on hover

Card-as-link inherited the prose `:where(.mdx-prose) a:hover { underline }`
rule, underlining the title and body text on hover. Two fixes stacked:
(a) added `text-inherit no-underline hover:no-underline focus:no-underline`
to the Card wrapper so it manages its own link affordance; (b) wrapped
the entire `.mdx-prose` block in `@layer base` so Tailwind utilities
(in `@layer utilities`) win regardless of selector specificity. Without
(b), unlayered prose rules beat ANY layered Tailwind utility regardless
of specificity (CSS `@layer` ordering: unlayered > layered).

### Round 7 — Tabs not rendering

`<Tabs>` was rendering nothing in CLI; only the panels were emitted.
Root cause: same auto-import shadowing as Callout. The auto-import
plugin injects `import { Tabs, Tab } from "@nebula-docs/components"`,
shadowing the page's `components` map (which routes those tags to the
Astro variants in `runtime/components/`). The React Tabs has the
Astro+React+MDX children-introspection issue and renders nothing useful.
Fix: removed Tabs/Tab/Steps/Step from the auto-import map. Added a
prominent comment block — any future component with an Astro variant
must NOT be auto-imported.

### Round 8 — Accordion

(a) `icon="dollar-sign"` rendered the literal string "dollar-sign" as
text. Card had the same prop shape but converts `typeof icon === 'string' ? <Icon icon={icon}/> : icon`. Ported the same logic to Accordion.
(b) Icon + chevron were vertically centered with title + description,
floating to the visual midpoint when there was a description. Switched
the summary `flex` from `items-center` → `items-start` so the icon
column pins to the top of the row, with a `mt-0.5` nudge so 16px
glyphs sit on the title's cap-line.

### Round 9 — Mermaid

CLI rendered 5 empty `<div role="img">` containers with no SVG.
Root cause: the React Mermaid component lazy-loads the mermaid library
in `useEffect`, but Astro renders React components SSR-only by default.
`useEffect` doesn't fire on the server.

Fix: created `packages/cli/src/runtime/components/Mermaid.astro` that
wraps `<MermaidReact client:visible>` so it hydrates as a client island.
Also handled an HTML-entity bug — `Astro.slots.render()` returns HTML
so `-->` became `&gt;` and broke Mermaid parsing; added an entity
decoder in the wrapper. Registered Mermaid in [...slug].astro AND
removed it from the auto-import map (Astro-variant pattern). Verified:
5 hydrated islands, all 5 render real `<svg>` flowcharts on
`client:visible`.

Also updated the Mermaid component's dark-mode detection to check
BOTH `.dark` class AND `[data-theme="dark"]` attribute so the diagram
theme tracks the page theme in either consumer.

### Round 10 — Editor Mermaid (RESOLVED via Round 19)

User reported Mermaid broken in the editor too. Couldn't reproduce —
when I navigated to a Mermaid file the editor unmounted before I could
inspect it. Resolved by Round 19's full rebuild of `MdxMermaidView`
(stacked preview + source layout, zoom controls, height floor) — user
confirmed the editor render is correct.

### Round 11 — Tree

CLI rendered every Tree.Folder/Tree.File at `aria-level="1"` with no
visible nesting hierarchy. Root cause: the React `Tree` component uses
`TreeLevelContext` to propagate depth to nested children, but the
Astro+React+MDX SSR boundary makes each MDX-rendered component its own
React tree on the server, so the parent's Context Provider never connects
to descendants — every folder/file reads `level=1` and computes the same
padding-left. Same shape as Tabs/Steps (Round 7) and Mermaid (Round 9):
React component → Astro wrapper.

Fix: Astro variants in `packages/cli/src/runtime/components/`:

- `Tree.astro` — root + the global stylesheet that handles indentation,
  vertical guide lines, open/closed visibility, and icon-swap. Inline
  script wires click + Enter/Space to toggle `data-open` on each folder.
- `TreeFolder.astro` — folder header with both Folder and FolderOpen SVGs
  inlined (lucide paths), CSS hides the wrong one based on `data-open`.
  Children rendered into `<slot />`, hidden when `data-open="false"`.
- `TreeFile.astro` — file row with inlined File SVG.

Indentation: each `[data-component-part="tree-folder-children"]` adds
`padding-left: 22px`, so depth accumulates naturally through CSS without
needing a level prop or context. Every header has `pl-1.5` (6px) so the
visible indents land at 6, 28, 50, 72px per level — matches Mintlify's
`calculatePaddingLeft(level) = 6 + (level-1)*22` intent. Vertical guide
line is absolute-positioned at `left: 14px` of each children wrapper so it
passes through the parent folder icon's vertical center column at every
depth (header pl:6 + icon size/2 ≈ 14).

Registered in `[...slug].astro` as `Tree = Object.assign(TreeRoot, { Folder, File })`
so MDX dotted-name resolution (`<Tree.Folder>` → `components.Tree.Folder`)
finds the Astro variants. Removed `Tree` from the auto-import skip list
in `astro.config.mjs` (per Pattern 3 — auto-import would shadow the
components map and force the broken React variant).

Verified: 4 trees on the page render correct hierarchy, click-to-toggle
works on closed folders, light + dark mode both match the editor's
rendering.

Side note: the React `Tree` in `@nebula-docs/components/src/tree/Tree.tsx`
has a separate latent bug — it puts `padding-left: calculatePaddingLeft(level)`
on the folder *wrapper* instead of on the header item, so nested folders
accumulate padding (level 3 ends up at 84px instead of 50px). The Mintlify
reference puts the padding on the header. Doesn't affect the CLI now (we
use Astro variants); would affect the editor's preview-mode render if it
ever exercises this component directly. Defer the React fix until a round
audits the editor preview.

### Round 12 — Request/ResponseExample stray buttons

CLI render of `<RequestExample>` / `<ResponseExample>` showed three orphan

CLI render of `<RequestExample>` / `<ResponseExample>` showed three orphan
controls in the tab row: an `X` next to the title, a `+` "Add" button, and
a `Trash` "Delete" button on the right. They didn't do anything — the
component's docstring called them "Phase 4+ visual placeholders". The
editor doesn't use this shared component at all (it has its own
`MdxRequestExample` / `MdxResponseExample` Tiptap NodeViews under
`products/nebula-platform/src/components/mdx/MdxApiNodes.tsx` that
render their own UI with input fields + kebab popover for editing).

Fix: deleted the three buttons from the production component at
`packages/components/src/example/Example.tsx`. Both consumers benefit —
CLI is cleaner, editor was unaffected (different code path).

### Round 13 — CodeGroup

CodeGroup was documented as expected-broken. Same root cause as Round 7
(Tabs) and Round 9 (Mermaid): the React `CodeGroup` uses
`Children.toArray(children).filter(isValidElement)` to introspect each
fenced code-block child for `filename` / `language` props, but Astro+MDX
pre-renders nested code blocks to `<pre>` HTML strings before they
reach the parent React component, so the introspection sees zero valid
elements and the wrapper renders empty.

Fix:
- `packages/cli/src/runtime/components/CodeGroup.astro` — slot wrapper
  with the rounded-card chrome + tab strip placeholder. A small inline
  script walks each direct `<pre>` child at hydration, reads
  `data-filename` (filename if set) or `data-language` (fallback) for
  the tab label, builds the tab strip dynamically, hides all but the
  active panel, and wires click + arrow-key handling.
- `packages/cli/astro.config.mjs` — added a Shiki transformer
  `shikiFilenameTransformer` that lifts the filename token out of the
  fence's `meta` (e.g. ` ```ts add.ts ` → `add.ts`) and stamps it on
  the rendered `<pre>` as `data-filename` so CodeGroup can label the
  tab. Same transformer is registered globally; benefits any future
  consumer that wants the filename.
- Registered `CodeGroup` in `[...slug].astro`'s components map and
  removed it from the auto-import skip list (Pattern 3).

Live regression target on the CodeGroup docs page now mounts two real
`<CodeGroup>` blocks — one with bare languages, one with filenames.
Both render, switch, and label correctly in light + dark.

### Round 14 — Fenced code blocks: dual-theme Shiki

Astro's MDX integration ships a single Shiki theme by default
(`github-dark`); every `<pre class="astro-code">` rendered with
hardcoded `background-color:#24292e;color:#e1e4e8`, so light-mode pages
showed a jarring dark island wherever a fenced block appeared. The
user's "codeblocks inside tabs example on index not rendering correctly"
note traced to this — codeblocks looked off in any light-mode page,
not specifically inside Tabs.

Fix in `packages/cli/astro.config.mjs`:

```js
markdown: {
  shikiConfig: {
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
    transformers: [shikiFilenameTransformer],
  },
}
```

`defaultColor: false` makes Shiki emit dual CSS variables
(`--shiki-light` / `--shiki-dark` per token + `-bg` on the wrapper)
instead of inlining a single theme's hex values. CSS in `global.css`
resolves those vars per-theme via the same `:where(.dark, [data-theme='dark'])`
toggle the rest of the runtime uses:

```css
:where(.astro-code, .astro-code span) {
  color: var(--shiki-light);
  background-color: var(--shiki-light-bg);
}
:where(.dark, [data-theme='dark']) :where(.astro-code, .astro-code span) {
  color: var(--shiki-dark);
  background-color: var(--shiki-dark-bg);
}
```

Verified: code-block backgrounds switch white ↔ dark with the page theme;
syntax-highlight token colors swap accordingly.

### Round 15 — Editor CodeBlock configurable options

The editor's CodeBlock NodeView had only a language dropdown + copy
button. Per user, it needed a kebab menu exposing per-block options that
round-trip through the fence's meta string. New supported options:

- **With filename** — toggles the inline-editable filename header.
- **With line numbers** — emits `lines` in fence meta; CSS counter renders
  the gutter in the preview.
- **Wrap code** — emits `wrap` in fence meta; `white-space: pre-wrap`
  on the preview's `<pre>` and `<code>`.
- **Duplicate** — clones the codeBlock node after itself.
- **Delete** — removes the node.

Explicitly excluded: Expandable and Twoslash (per user — not needed in
either consumer).

Files touched:

- `products/nebula-platform/src/components/mdx/MdxCodeBlockNode.tsx` —
  added `showLineNumbers` + `wrapCode` attrs, kebab dropdown built on
  Radix `DropdownMenuCheckboxItem` (with `e.preventDefault()` on `onSelect`
  so the menu stays open while toggling), filename header row with an
  `<input>` that updates the attr on every keystroke and clears it back
  to `null` on blur if empty (so toggling "With filename" off via empty
  input collapses the header).
- `products/nebula-platform/src/lib/mdx/mdastToTiptap.ts` — replaced
  `parseFilenameFromMeta` with `parseCodeMeta` that handles filename +
  the `lines` / `wrap` flags. `key=value` tokens (Mintlify-style
  highlights) are skipped and pass through untouched.
- `products/nebula-platform/src/lib/mdx/tiptapToMdx.ts` — codeBlock
  serializer emits ` ```lang [filename] [lines] [wrap] ` based on attrs.
- `products/nebula-platform/src/index.css` — CSS rules driven by
  `[data-mdx-code-block][data-show-line-numbers='true']` /
  `[data-wrap-code='true']` on the wrapper. Counter increments on each
  Shiki `<span class="line">` and renders a numeric gutter via `::before`.

Round-trip verified: `\`\`\`json ThisFileNameEditsInline.json lines wrap`
parses to `{ filename: 'ThisFileNameEditsInline.json', language: 'json',
showLineNumbers: true, wrapCode: true }` and serializes back identically.
Toggling each option in the kebab updates both the visible chrome and
the underlying node attribute. Inline editing the filename input updates
the attribute on every keystroke.

CLI follow-up (next round): the same flags need to drive the CLI's
fenced-block render — line-number gutter via a Shiki transformer + CSS
for wrap. The Shiki filename transformer (Round 13) already stamps
`data-filename` so the filename header is feasible there too.

### Round 17 — CLI parity for code-block flags + editor gap fix

Two follow-ups bundled.

**Editor gap:** the new filename header in Round 15 left a 16px gap below
the header (browser default `<pre>` margin). Tailwind's `[&_pre]:m-0`
arbitrary variant on the preview wrapper doesn't reach `<pre>` elements
that arrive via `dangerouslySetInnerHTML` — the CSS rule generates but
the user-agent margin still paints. Added an explicit reset in
`products/nebula-platform/src/index.css`:

```css
[data-mdx-code-block] .mdx-code-block > pre,
[data-mdx-code-block] .mdx-code-block-light > pre,
[data-mdx-code-block] .mdx-code-block-dark > pre { margin: 0; }
```

Also conditionally drop the pre's `pt-9` (which was reserving space for
the absolute-positioned controls) when the filename header is visible —
the controls already overlay the header row, so the padding becomes a
pure dead gap.

**CLI parity:** the editor's `lines` and `wrap` flags (Round 15) need to
drive the CLI render too. Renamed `shikiFilenameTransformer` to
`shikiCodeMetaTransformer` in `packages/cli/astro.config.mjs` and folded
the same `parseCodeMeta` logic in:

- First non-`key=value` token  → `data-filename` on `<pre>`
- `lines` flag                  → `data-show-line-numbers="true"`
- `wrap`  flag                  → `data-wrap-code="true"`

CSS in `packages/cli/src/styles/global.css`:

- `.astro-code[data-filename]::before` chip lives INSIDE the pre's top
  padding (the pre has `overflow: auto` from Shiki — a chip positioned
  above the pre's box gets clipped). The pre gets `padding-top: 2.5rem`
  to leave room; `::before` is absolute-positioned at `top: 0` with the
  filename via `attr(data-filename)`.
- Inside `.nebula-code-group`, the chip is hidden (`display: none`) and
  the extra padding-top reverts to the default — the CodeGroup tab
  strip is the filename label.
- Line-number gutter: `[data-show-line-numbers='true'] code .line` gets
  `counter-increment` + a `::before` numeric label; matches the editor's
  CSS pattern from Round 15.
- Wrap: `[data-wrap-code='true']` toggles `white-space: pre-wrap` +
  `word-break: break-word` on both `<pre>` and `<code>`.

Tenant fixture extended at
`tenants/nebula-docs-starter/content/components/code-group.mdx` with six
CodeGroup examples covering: bare languages, filenames, install matrix,
multi-client API call, line-numbers flag, wrap flag.

Round-trip verified end-to-end:
- Editor toggles "With filename" / "With line numbers" / "Wrap code" →
  emits ` ```ts add.ts lines wrap` in MDX
- CLI build picks up the flags → `<pre data-filename="add.ts"
  data-show-line-numbers="true" data-wrap-code="true">` →
  CSS renders the chip + gutter + soft-wrap.

**Follow-up — square top corners under header.** With the filename
header showing, the pre's rounded top corners curved away from the
header's straight bottom edge, leaving visible page-bg gaps in the
upper corners. Tailwind's `[&_pre]:rounded-t-none` arbitrary variant
on the wrapper didn't reach the inline-injected Shiki pre (same
cascade caveat as the margin reset earlier in the round). Added a
`data-has-filename-header` attribute to the editor's NodeViewWrapper
and an explicit `!important` rule in `index.css` zeroing
`border-top-{left,right}-radius` on descendant pre's when that attr
is true. CLI side: the chip lives inside the pre via `::before`, so
gave the chip `border-top-{left,right}-radius: inherit` so its top
corners trace the same curve as the pre's — the chip and code read
as a single unified card.

**Follow-up — copy-to-clipboard button on CLI.** The editor's
codeBlock NodeView has had a copy button since Round 15; the CLI
render shipped without one. Added an inline hydration script in
`packages/cli/src/layouts/DocsLayout.astro` that walks every
`pre.astro-code` after `DOMContentLoaded` and appends a `<button
class="nebula-code-copy">`. CSS in `global.css` positions it
`absolute; top: 0.375rem; right: 0.5rem` of the pre — when the
filename chip is present, the button sits at the top-right of the
chip; without the chip, at the top-right of the code area. Hidden
by default (opacity 0), revealed on `pre:hover` or button focus.
Click handler reads `pre.textContent` (chip text isn't in textContent
since it's a `::before` pseudo-element), shows a check icon for
1.5s on success. Falls back silently if `navigator.clipboard` is
unavailable.

**Follow-up — `.nebula-tabs` class collision.** User reported MDX
Tabs broken: the panel content was rendering to the right of the
tab buttons instead of below. Root cause: both `Navbar.astro` and
`Tabs.astro` defined `.nebula-tabs` rules in `<style is:global>`
blocks, and the navbar's `display: flex` leaked to every MDX Tabs
block, turning the (list + panels) sibling pair into a flex row.
Fix: renamed the navbar's class to `.nebula-navbar-tabs` (selectors
in both the `<nav>` markup and the `<style>` block). MDX Tabs is
back to `display: block` with panels stacked below the buttons.

Pattern note: any new chrome-side `<style is:global>` block needs
unique selectors that don't collide with the MDX block components
(checked the rest — `.nebula-tab` is navbar-only, `.nebula-tabs-list`
and `.nebula-tabs-panels` are MDX-only, no other clashes today).

### Round 18b — Frame: full Mintlify HTML alignment

After the initial Round 18 padding pass, the frame still didn't look
right. User pulled the actual Mintlify production HTML and shared it.
Five real divergences in our component:

1. **Caption had `bg-white`** — Mintlify's caption has NO background. It
   sits directly on the frame's `bg-stone-50/50` pattern surface.
   Removed `bg-white dark:bg-stone-800` from the description div.
2. **Caption padding L/R was 20px** — Mintlify is `px-8` (32px). The
   user's earlier "20px" spec was eyeballed; matched the source instead.
3. **Pattern was dots, Mintlify is a grid** — Mintlify uses
   `bg-grid-neutral-200/20` (a Tailwind plugin utility). Replaced our
   `radial-gradient(circle ...)` dot pattern with two crossed
   `linear-gradient`s drawing 1px hairlines at every 14px:
   ```
   linear-gradient(to right, rgb(214 211 209 / 0.45) 1px, transparent 1px),
   linear-gradient(to bottom, rgb(214 211 209 / 0.45) 1px, transparent 1px)
   ```
   Plus the same vertical mask gradient Mintlify ships
   (`mask-image: linear-gradient(0deg, #fff, rgba(255,255,255,0.6))`)
   so the grid fades and doesn't compete with the content.
4. **Caption-link styling didn't match** — Mintlify links inside a frame
   caption are `font-semibold no-underline border-b border-primary` with
   `border-b-2` on hover. Added the same Tailwind arbitrary-variant
   chain `[&_a]:font-semibold [&_a]:no-underline [&_a]:border-b
   [&_a]:border-current [&_a:hover]:border-b-2 dark:[&_a]:text-white`
   to the caption div.
5. **Inner content div had `bg-white`** — Mintlify's content div is just
   `relative rounded-xl overflow-hidden flex justify-center` with no
   background. Stripped the bg classes; the rounded-xl clips the image
   directly.

Verified in CLI: caption padding `mt:12 / pl,pr:32 / pt:0 / pb:8`,
background transparent, text-align center; pattern uses two
linear-gradients with the mask. Editor picks up the same shared
component.

### Round 18 — Frame: Mintlify-spec padding + markdown captions

Two adjustments to the shared `@nebula-docs/components` Frame so the
editor and CLI both inherit:

- **Padding**: per the user's Mintlify spec — frame card has `p-2`
  (8px) on all four sides (already correct). Caption row gets
  `mt-3` (12px margin-top, was 8px) and `px-5` (20px L/R padding,
  was 16px) so it doesn't crowd the side edges.
- **Markdown in caption**: tiny inline parser added to
  `packages/components/src/frame/Frame.tsx` (`renderCaptionMarkdown`).
  Recognises `[text](url)` → `<a>` and `**text**` → `<strong>`.
  Mirrors Mintlify behavior. Not a full markdown impl — captions are
  short single-line strings; richer formatting belongs outside the
  caption attr.

Tenant fixture `tenants/nebula-docs-starter/content/components/frame.mdx`
gained two new sections demonstrating link-only and bold-plus-link
caption strings.

Verified in the CLI: 5 frames on the page, padding measurements all
match spec exactly, the link caption produces `<a href="/quickstart">`
and the bold-plus-link caption produces both `<strong>Note:</strong>`
and `<a href="https://example.com">` as expected. Editor uses the same
shared Frame component (via the `MdxFrameView` NodeView) so it picks up
the same behavior automatically.

### Round 20 — Property + ParamField param-location aliases

Audited Property in the CLI (renders correctly via the shared
`@nebula-docs/components/Property`). Editor side had two gaps:

1. `Property` wasn't in the editor's component registry —
   `<Property>` blocks fell back to `MdxRaw` raw-source view instead
   of a visual preview. Added `Property` to
   `products/nebula-platform/src/components/mdx/registry.tsx` so the
   editor renders it the same way the CLI does.
2. `<ParamField query="include">` (and `header`, `body`, `cookie`)
   rendered with an empty name. Mintlify uses any of these attribute
   names AS the parameter declaration — the attr name doubles as the
   parameter location. Three fixes stacked:
   - **Tiptap schema** (`MdxApiNodes.tsx` `FIELD_ATTRS`): added
     `query`/`header`/`body`/`cookie`. ProseMirror silently drops
     attrs not declared in `addAttributes()`, so without this the
     attrs never reached the Tiptap node.
   - **Editor NodeView** (`MdxApiNodes.tsx` `paramFieldName`):
     reused for both `headerName` and `rendererName` callbacks;
     resolves the parameter name and surfaces the matching key as
     the `location` pill.
   - **Shared component** (`@nebula-docs/components/Property`):
     `ParamField` alias loops over `[path, query, header, body,
     cookie]`, picks the first non-empty string, and forwards it
     as `name` + `location` to the underlying `<Property>`. CLI
     and editor both pick this up via the shared component.

**Defensive guard.** The audit also surfaced a Property crash via the
editor (React error boundary): when MDX uses `pre={['Required']}`,
the editor's mdast attr extractor can't `JSON.parse` the JS literal
(single quotes) and falls through to a `{ __expression: "[...]" }`
sentinel. `pre.map(...)` then throws. Added an `Array.isArray` guard
on `pre`/`post` in `Property.tsx` so a non-array value renders as
no pre/post pills instead of crashing the whole component tree.

Verified: 14 fields render in both CLI and editor with matching
names + location pills (path / query / header / body / cookie); no
empty names; no React errors.

### Round 19 — Mermaid editor UX + CLI hydration fix

Two-part round.

**Editor:** the Mermaid NodeView previously toggled between preview-only
and source-only modes. User wanted both visible at once: rendered diagram
on top, editable source markdown below. New
`products/nebula-platform/src/components/mdx/MdxMermaidNode.tsx`:

- Two stacked panels inside one rounded card.
- Top panel: rendered Mermaid via the shared `<Mermaid>` component, with
  zoom controls (zoom-in / zoom-out / reset) anchored top-left. Zoom is
  CSS `transform: scale()` on a wrapper around the SVG; range
  `[0.3, 3]`, step `1.2`, transform-origin `center top` so the diagram
  grows downward and stays anchored to the toolbar.
- Bottom panel: monospace textarea on a dark background, framed with
  visible `\`\`\`mermaid` / `\`\`\`` fences (orange chips) so the editor
  reads as a fenced code block. Live-updates the node attr on every
  keystroke.
- The "Controls" / "Placement" config rows from Mintlify's reference
  were intentionally dropped — user struck them out.

**CLI hydration regression.** While verifying, Mermaid stopped rendering
in the CLI: 5 islands queued, 0 SVGs. Root cause: Astro wraps the React
component in an `<astro-island display:contents>` element, and elements
with `display: contents` generate no CSS box — `IntersectionObserver`
(used by `client:visible`) reports zero intersection ratio forever, so
hydration never fires. Switched `Mermaid.astro` from `client:visible` to
`client:load`. Trade-off: the ~600KB mermaid bundle now loads on every
page even if no diagram is visible. Cost is acceptable because (a) only
a handful of pages have diagrams, (b) tenants without any
`<Mermaid>` calls don't hit this code path at all (the wrapper renders
nothing), and (c) the alternative — building a manual visibility
observer on the inner `<div>` — adds complexity for a marginal saving.

Verified: 5 SVGs render on `/components/mermaid` in the CLI; editor
shows preview + source stacked; zoom buttons increment / decrement /
reset the scale.

### Round 16 — CodeBlock-inside-CodeGroup

The CodeGroup NodeView's tab strip already exposes filename as the tab
label (one input per codeBlock). After Round 15, every codeBlock also
rendered its own filename header above the code — duplicate UI when
nested inside a CodeGroup.

Fix in `MdxCodeBlockNode.tsx`: detect parent type via a `useEditorState`
selector that resolves the node's position and reads `$pos.parent.type.name`.
When `parent === 'mdxCodeGroup'`:

- Suppress the standalone filename header (the CodeGroup tab already
  provides filename editing).
- Drop "With filename" from the per-block kebab (would conflict with
  the tab-strip source of truth).

Kept inside the kebab in either context:

- With line numbers
- Wrap code
- Duplicate (clones the codeBlock; lands in same parent — naturally
  becomes a sibling tab inside a CodeGroup)
- Delete (removes the codeBlock; if it was the last child, ProseMirror's
  `codeBlock+` content rule collapses the empty CodeGroup)

Verified end-to-end with a programmatically-inserted CodeGroup containing
two codeBlocks (`client.ts` / `client.py`):

- 0 filename inputs render inside the group's codeBlocks (suppressed).
- Kebab on a codeBlock inside the group shows 4 items: line numbers,
  wrap, duplicate, delete.
- Kebab on a standalone codeBlock shows all 5 items including
  "With filename".

---

## Patterns established (read before touching any component)

These are the recurring shapes — every component fix has been one of these:

1. **Mintlify prop alias on the component.** When MDX uses a Mintlify-style
   prop name (`type`, `icon` as a string) but the React component prop is
   different, add the alias on the component itself (per Round 3 + Round 8a).
   Beats a per-consumer shim because both editor and CLI benefit.
2. **Astro wrapper for React-with-useEffect.** Any React component that
   needs browser-side execution (lazy import, hover state derived from
   document, scroll observers) needs an Astro wrapper with `client:visible`
   (or `client:load`). Wrapper lives in `packages/cli/src/runtime/components/`.
   Per Round 9.
3. **Auto-import skip list for Astro-variant components.** Anything with
   an Astro variant in `runtime/components/` MUST be removed from the
   auto-import map in `astro.config.mjs`. Otherwise the auto-injected
   `import { X } from "@nebula-docs/components"` shadows the components
   map and forces the React variant. Per Rounds 7 + 9.
4. **Block-level link components manage their own link styling.** Any
   component whose root is `<a>` (Card, Tile, etc.) must add
   `text-inherit no-underline hover:no-underline focus:no-underline` to
   the wrapper to suppress the prose link-style cascade. Per Round 6.
5. **`@layer base` for prose rules.** Anything CSS-styling MDX block
   elements via `:where(.mdx-prose) X` belongs in `@layer base` so
   Tailwind utilities (which live in `@layer utilities`) can override.
   Already done globally in Round 6.

---

## Components verified rendering = editor

Callout · Card · Tabs / Tab · Accordion · Mermaid · Snippets ·
Tree / Tree.Folder / Tree.File · Columns / Column · Expandable ·
Steps / Step · Update · ParamField (path/query/header/body/cookie
aliases) · ResponseField · Icon · RequestExample / ResponseExample
· CodeGroup · CodeBlock · Frame · Property.

## Components NOT yet audited against editor

(none — full block surface audited.)

## Editor-side config UX follow-ups (Platform, not CLI)

Per user's pass — small tweaks to the attribute-popover / config UX in
the editor:

- **CodeBlock** — DONE (Round 15). Kebab with With filename / With line
  numbers / Wrap code / Duplicate / Delete; filename header inline-editable.
- **Frame** — DONE (Rounds 18 / 18b / 18c). Padding + solid bg + balanced
  caption + markdown captions all landed.
- **Mermaid** — DONE (Round 19). Stacked preview + source with zoom
  controls.
- **Update** — DONE (Round 21 + 21b). Right column top-aligns with
  the version label. First pass added `[&>:first-child]:mt-0` on the
  shared component (works in CLI). Editor needed a deeper selector —
  Tiptap nests prose elements two divs deep
  (`[data-node-view-content]` > `[data-node-view-wrapper]` > `<p>`),
  so the prose `p { my-4 }` rule still fired on the actual visible
  text. Added `[data-component-part="update-content"] :where(p, ul,
  ol, blockquote, h1..h6, pre):first-child { margin-top: 0 }` to
  `products/nebula-platform/src/index.css` to cascade through the
  Tiptap wrapper chain. Verified: 3 update entries on the page now
  show `delta: 0` between the version label's top and the first
  paragraph's top in both consumers.

## Durable follow-ups (defer until rounds settle)

- **Extract `.mdx-prose` rules into `@nebula-docs/styles`** so both
  consumers `@import` the same source. Right now Platform's
  `index.css` and CLI's `global.css` have parallel copies that need to
  stay in sync manually. Inevitable bit-rot otherwise.
- **Tenant-local component auto-import.** Auto-import map is hard-coded
  to `@nebula-docs/components` only. Tenants with custom components
  in `tenants/*/components/*.tsx` still need explicit `import` lines.
- **Mermaid editor repro** — Round 10 above.
- **Tree padding-left bug in `@nebula-docs/components`** — see Round 11
  side note. Padding belongs on the header, not the wrapper.

---

## Kickoff prompt for the next chat

Paste verbatim:

> Read `CLAUDE.md`, `.claude/architecture.md`, `.claude/nebula-cli.md`,
> `.claude/status.md`, and `.claude/visual-audit.md`. The CLI render
> visual-parity work is mid-flight — most chrome and several core
> components are aligned with the editor; a list of un-audited
> components is at the bottom of `visual-audit.md`. Default the CLI
> dev server to `tenants/nebula-docs-starter` (launch config name
> `nebula-cli-starter`) per the user's preference.
>
> Pick the next un-audited component (Badge is a good first because
> it's small and self-contained). For each component:
> 1. Open the corresponding page in the CLI (`/components/<x>`) and
>    the same MDX in the editor side-by-side.
> 2. Catalog every visible difference.
> 3. Fix at the source — usually one of the five patterns at the top
>    of `visual-audit.md`'s "Patterns established" section.
> 4. Verify in the browser; only mark complete when light + dark mode
>    both match the editor.
>
> Don't add features. Don't relitigate any of Rounds 1-9. Don't touch
> the editor unless the change benefits both consumers (e.g. a Mintlify
> prop alias on a shared component).
>
> Open question to resolve early: ask the user where they saw Mermaid
> broken in the editor (Round 10 is parked on missing repro).
