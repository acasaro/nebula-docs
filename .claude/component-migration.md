# Component Migration Plan

Plan for stripping legacy landing-page components from `products/docs/` and converting them into Nebula editor components or tenant-scoped snippets. Workstream-specific complement to [status.md](status.md); the rules here defer to [conventions.md](conventions.md) for anything overlapping.

For Platform architecture, see [nebula.md](nebula.md). For CLI architecture (where snippet auto-discovery lives), see [nebula-cli.md](nebula-cli.md).

---

## Naming convention

All new editor components follow these rules:

- **Single-noun, structural** — sibling to the existing family: `Card`, `Callout`, `Frame`, `Tabs`, `Accordion`, `Steps`, `Tree`. Avoid semantic baggage; semantic intents (`Note`, `Tip`, `Warning`) stay reserved for `Callout` variants.
- **Compound names** are allowed when shape is distinctly different from `Card` — `FeatureCard`, `TopicCard`, `MediaCard`.
- **Parent + children** components use plural-singular pairs — `StageList` + `Stage`, `Stats` + `Stat`. Or compound parent + compound child where the child role isn't a clean pluralization — `TopicCard` + `TopicLink`.

---

## Decision matrix

| Source (legacy) | Outcome | Lives at |
|---|---|---|
| FeatureCards (4 visual patterns) | New `FeatureCard` | `packages/components/` |
| PlatformCard (left-accent labeled wrapper) | New `Sheet` | `packages/components/` |
| TopicCard with sublinks | New `TopicCard` + `TopicLink` | `packages/components/` |
| StageStatus | New `StageList` + `Stage` | `packages/components/` |
| StatsGrid | New `Stats` + `Stat` | `packages/components/` |
| Resource card grid | New `MediaCard` (static, not data-driven) | `packages/components/` |
| Mission statement | Composed: `Card` tweak (vanilla wrapper mode) + Badge + centered text | `packages/components/` |
| Animated app-icon hero | Snippet (`apps-hero.tsx`) | `tenants/mcoe-docs/snippets/` |
| Approval Steps | Snippet (`approval-steps.tsx`) for v1; future `Steps` extension | `tenants/mcoe-docs/snippets/` |
| Timeline (products landing) | Leave behind | — |
| `PlatformNav` | Leave behind | — |
| `BitrisePrereq` | Leave behind | — |

---

## Component specifications

### `FeatureCard`

Self-contained data card for landing-page feature highlights. Covers four visual patterns the legacy site previously implemented as separate components: top-bar+icon, horizontal Quick Access, top-bar text-only, top-bar+status-pill.

**Attributes:**

- `color` — brand hue dropdown (`purple` / `blue` / `teal` / `green` / `orange` / `red` / `yellow` / `neutral`). Drives accent bar, icon tile bg, icon color, status-pill bg.
- `accent` — `top-bar` / `pill` / `none`
- `layout` — `vertical` / `horizontal`
- `icon` — optional (uses shared icon picker)
- `title`, `description`, `linkText`, `linkUrl`

Color shades auto-derive from the brand palette in `packages/theme/`: tile bg = `lightest`, icon = `mid`, accent bar = `mid`, pill bg = `dark` with white text. The user picks one color; everything stays coherent.

### `Sheet`

Freeform labeled content wrapper. Distinct from `Callout` (reserved for semantic alerts) and `Card` (generic and unlabeled). Used by the legacy `PlatformCard` (iOS / Android sections, etc.).

**Attributes:**

- `color` — brand hue dropdown
- `icon` — optional (shared icon picker)
- `label` — optional header text
- children — free MDX

**Visual:** left accent bar in `color-mid`, tinted bg via `color-mix(in srgb, var(--brand-{color}-mid) 8%, transparent)`. The dark-mode "ghost" effect comes free from the same low-alpha mix on a dark canvas — one CSS value handles both modes, no theme branching.

### `TopicCard` + `TopicLink`

Topic-hub card that contains a list of child links plus an optional "View all" link. Distinct from `FeatureCard` because it has structural children, not just one optional CTA.

**Attributes:**

- `TopicCard` (parent): `icon`, `color`, `title`, `description`, `viewAllHref`, children
- `TopicLink` (child): `label`, `href`

### `StageList` + `Stage`

Pipeline status indicator (legacy `StageStatus`). Each stage carries a semantic status enum, not a freeform color — pipeline stages have meaning that should look identical across docs.

**Attributes:**

- `StageList`: children only (drag-reorder, slash-add)
- `Stage`: `label`, `status` (`done` / `active` / `pending` / `blocked`), `meta` (descriptive right-side text — never a link)

`status` drives color from the brand palette: `done` → green, `active` → blue, `pending` → neutral, `blocked` → red. Bg = `lightest`, dot = `mid`. Auto-derived.

### `Stats` + `Stat`

Numeric stats grid (legacy `StatsGrid`). Layout-agnostic name so a vertical or alternate-column variant doesn't require renaming.

**Attributes:**

- `Stats`: children, optional `columns` (default auto-fit)
- `Stat`: `value` (string — handles "40+", "100%" without conversion gymnastics), `label`, optional `color` (brand hue, default primary)

Color is per-child. If users want all-matching (the common case), they pick the same color on each — keeps the parent attribute surface trivial.

### `MediaCard`

Hero-image card for resource indexes. Image dominates the upper half of the card; pill-style category badge sits inline above the title.

**Attributes:**

- `image` (required)
- `title` (required)
- `description` (required)
- `href` (required — whole card is clickable)
- `category` (optional pill text)
- `categoryColor` (optional brand hue)

Static use only — author hand-places each card. If a data-driven variant becomes a real need later (e.g., a "Latest Updates" feed pulling from frontmatter), add a sibling island. Don't preempt.

### `Card` tweak (mission statement)

Add a "vanilla wrapper" mode to the existing `Card` so the mission-statement layout (centered Badge + centered text) composes from existing blocks without a new component.

**New attributes (additive, non-breaking):**

- `align` — `start` (default) / `center`
- Bare-wrapper mode toggle — TBD pending review of the current Card API. May be expressible via existing prop combos rather than a new flag.

---

## Snippet model

Snippets are tenant-scoped React or MDX files. They are escape hatches for behavior and one-off content that doesn't warrant a first-class editor component.

```
tenants/<tenant>/snippets/
  apps-hero.tsx          # Component snippet (React, behavior)
  approval-steps.tsx     # Component snippet (React, behavior)
  common-warning.mdx     # MDX snippet (reusable content fragment)
```

**Two types in one directory:**

1. **Component snippets (`.tsx`)** — React for behavior the editor can't host (animations, complex interactives).
2. **MDX snippets (`.mdx`)** — reusable content fragments (recurring notes, shared sections).

**Rules:**

- **Always tenant-scoped.** No shared `packages/snippets/`. Anything genuinely reusable graduates to a real component in `packages/components/`.
- Snippets surface in the editor slash menu under a "Snippets" section, auto-discovered from the directory.
- Snippet blocks are not deeply editable in the editor (black box). Behavior changes by editing the source file.
- MDX snippets render their content in the editor preview; component snippets show a placeholder card.

**CLI render:** snippets import as normal React/MDX at build time. Auto-discovery + slash-menu integration may need plumbing in `packages/cli/`.

---

## Build order

**Parallel setup** (independent of editor components):

- Snippet directory convention + move existing one-offs:
  - `tenants/mcoe-docs/components/AppsHeroComponent.tsx` → `tenants/mcoe-docs/snippets/apps-hero.tsx` (rename export to `AppsHero`).
  - Approval-steps logic → `tenants/mcoe-docs/snippets/approval-steps.tsx`.

The shared icon picker (Lucide / Material / Symbols / Custom tabs) already exists and is in use across the `Card` and `Steps` attribute panels. New component editors import and consume it directly.

**Editor components, in dependency order:**

1. **`Sheet`** — simplest. Validates the brand-color enum + icon picker integration end-to-end with one component.
2. **`FeatureCard`** — reuses Sheet's color/icon machinery; adds the variant preset system.
3. **`StageList` + `Stage`** — first parent-children component. Validates drag-reorder + slash-add patterns.
4. **`Stats` + `Stat`** — second parent-children, simpler shape than `StageList` (no status enum).
5. **`TopicCard` + `TopicLink`** — third parent-children, confirms pattern reuse.
6. **`MediaCard`** — image-heavy. Independent of the icon picker.

**Polish:**

7. **`Card` tweak for mission statement** — small, can land any time after `Sheet`.

---

## Open questions

- **CLI snippet conventions:** does `packages/cli/` already have auto-discovery for tenant snippets and editor slash-menu integration, or does this need plumbing?

---

## Out of scope

Explicitly not migrating in this workstream:

- Timeline (products landing page)
- `PlatformNav`
- `BitrisePrereq`

Already converted in prior work (do not touch as part of this plan):

- Hero / Carousel — existing editor component.
- Profile — existing editor component.

---

## Reference

- Brand palette: `packages/theme/src/themes/*.ts` — color tokens used by the variant systems above.
- Existing Hero (carousel) editor component — reference for `FeatureCard`'s variant attribute pattern.
- `vendor/mintlify-components/` — structural reference only; do not name-clone (per [conventions.md](conventions.md)).
