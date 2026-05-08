# Inline editor toolbars

Floating UI that appears over the Tiptap canvas in the Platform editor. Pure
editor chrome — none of these components are MDX nodes, none are serialized,
and none ship to the CLI render. Live in
`products/nebula-platform/src/components/mdx/`.

## What's there

- **TextToolbar** ([TextToolbar.tsx](../products/nebula-platform/src/components/mdx/TextToolbar.tsx))
  — bubble menu over any non-empty text selection. Type-change dropdown
  (paragraph / H1–H4 / lists), inline marks (B / I / U / S / inline-code /
  link), overflow menu (Tooltip).
- **LinkBubble** ([LinkBubble.tsx](../products/nebula-platform/src/components/mdx/LinkBubble.tsx))
  — second bubble that fires when the cursor is inside a link mark. URL
  input + Open / Copy / Trash actions. The TextToolbar's link button just
  applies an empty-href link mark and collapses the cursor; LinkBubble
  takes over for URL entry.

Both are mounted from [MdxEditor.tsx](../products/nebula-platform/src/components/mdx/MdxEditor.tsx)
next to `<EditorContent>`, both portal to `document.body`, both bail out
when the editor isn't editable.

## Positioning model

- Selection rect from `window.getSelection().getRangeAt(0).getClientRects()[0]`
  (live, accurate for wrapped text). Falls back to
  `editor.view.coordsAtPos()` when the DOM selection is cleared (e.g.
  while a Radix dropdown trigger has focus).
- `position: fixed`, `transform: translate(-50%, …)` to center horizontally
  on the selection start. Default 10px gap above; flips below when the
  selection is too close to the viewport top.
- `onMouseDown={e => e.preventDefault()}` on the toolbar container is
  required — without it the editor blurs before the React click handler
  runs and the chain command fails.

## Slot-aware dropdown

When the cursor lives in a fixed-purpose node (e.g. `mdxFeatureCardTitle`),
the type dropdown swaps to slot-specific options instead of the generic
list. Look for `SLOT_NAMES` / `buildSlotOptions` in TextToolbar.tsx — adding
a new fixed slot (Card title, Accordion title, Step title…) is a one-entry
change there plus the matching `editor.isActive(nodeName, attrs)` checks.

The slot's apply function uses `updateAttributes(nodeName, { ... })` so the
mutation stays scoped to the title node and doesn't touch sibling
description blocks.

## Styling

Both bubbles use `bg-background text-muted-foreground ring-1 ring-border`
so they blend into the editor surface (intentional — earlier versions used
white/black contrast and read as too loud). Buttons are `size-6`, icons
`size-3.5`, divider `bg-border`. Match this if you add new toolbars.

## FeatureCard title slot — the case study

The title slot pattern in [MdxFeatureCardNode.tsx](../products/nebula-platform/src/components/mdx/MdxFeatureCardNode.tsx)
is the reference implementation for "an attribute that should feel like
editable text in the editor."

- Editor schema: `mdxFeatureCard` content is `mdxFeatureCardTitle block*`.
  The title is its own ProseMirror node with a `level: 1|2|3|4` attr, so
  the bubble menu naturally fires over it and `updateAttributes` changes
  the heading level without affecting siblings.
- MDX disk shape: flat attrs on the parent JSX —
  `<FeatureCard title="..." titleLevel={N}>`. `titleLevel` is omitted when
  it's the default 3.
- CLI render: `FeatureCard` reads `title` + `titleLevel` props and picks
  the matching `<hN>` tag.

**Hard constraint that forced this shape**: the Astro+React+MDX boundary
pre-renders nested React children to HTML strings before they reach a
React parent component. Concretely — if you put a `<FeatureCardTitle>` JSX
child inside `<FeatureCard>` in MDX, the parent React component receives
the title pre-rendered as a string and can't introspect children to
extract the slot. The CLI registry comment at
[packages/cli/src/runtime/components/registry.tsx](../packages/cli/src/runtime/components/registry.tsx)
spells this out: components that need to introspect children's props live
as `.astro` files alongside the registry. Plain React parents with React
children can't.

So: any "title slot"-style data has to round-trip via flat attrs on the
parent JSX, not as a sub-component child. To stamp out the same pattern
for Card title, Accordion title, etc., copy what FeatureCard's title does:

1. Editor: add a `mdx<Component>Title` Node with `inline*` content + a
   `level` attr; update the parent's `content` schema to `<title> block*`.
2. Editor parser ([mdastToTiptap.ts](../products/nebula-platform/src/lib/mdx/mdastToTiptap.ts)):
   read `title` + `titleLevel` attrs, inject them as the title sub-node.
3. Editor serializer ([tiptapToMdx.ts](../products/nebula-platform/src/lib/mdx/tiptapToMdx.ts)):
   pull the sub-node's text + level back into flat attrs.
4. Component ([packages/components/src/<name>/](../packages/components/src/)):
   accept `title` + `titleLevel` props, render the matching `<hN>`.
5. TextToolbar: add the new node name to `SLOT_NAMES` and its options to
   `buildSlotOptions` so the dropdown shows H1–H4 when the cursor is in
   that slot.

## What's POC-lossy

Marks (bold/italic/link) inside title slots survive in the editor session
but are stripped on save — the disk shape is `title="..."` and a string
attr can't carry marks. Promoting marks to durable would require either
making the parent component an `.astro` file with slots, or encoding
marks as JSX expression syntax in the attr value. Not done yet.
