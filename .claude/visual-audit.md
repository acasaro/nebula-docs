# Visual fidelity audit — CLI renderer

The user's actual ask, after I misread it as "make CLI prettier from
scratch": **make the CLI's rendering of components, spacing, and prose
style match what the editor already shows.** The chrome (sidebar, navbar,
page header, TOC) is fine. The drift is in the prose layer that wraps
shared `@nebula-docs/components` blocks.

Reference target: the Platform's editor preview (`products/nebula-platform/src/index.css`'s `.mdx-prose` block).

Scope: `tenants/nebula-docs-starter` until every page renders identically
to its editor preview. No new components. No editor changes.

Iteration model: a small batch of changes per round, then user reviews
in the browser. Each round captured below — what changed, why, where.

---

## Round 1 — port `.mdx-prose` from Platform to CLI (LANDED)

The CLI had its own `.nebula-prose` block in `packages/cli/src/styles/global.css`
that diverged from the Platform's `.mdx-prose` rules in
`products/nebula-platform/src/index.css`. Same MDX file, two different
typographic treatments.

**Changes:**

1. Renamed the CLI wrapper class `.nebula-prose` → `.mdx-prose` (in
   `packages/cli/src/layouts/DocsLayout.astro`). Both consumers now use
   the same class name on the prose container.
2. Replaced the CLI's prose CSS with a copy of the Platform's `.mdx-prose`
   block, mapping shadcn-style tokens (`--foreground`, `--muted`,
   `--border`) to the CLI's `--mcoe-*` equivalents. EFFECTIVE values
   match — heading sizes, line-heights, margins, list indentation,
   `<pre>` background, inline-code padding, blockquote border, table
   chrome, `<hr>`, link underline-offset.
3. Added the same component-margin reset rules:
   - `[data-callout-type] [data-component-part="callout-content"]` strips
     default `<p>` margins so callouts render tight around their body.
   - `.mdx-prose [data-component-part="step-content"]` does the same for
     Steps so the step number and content align without extra slack.
4. Reverted body line-height to `1.6` (briefly bumped to `1.7` in an
   abandoned redesign attempt — kept the existing chrome behavior).

**Where:**
- `packages/cli/src/styles/global.css` — replaced the `.nebula-prose`
  block (~80 lines) with the new `.mdx-prose` block. Page header
  rules (`.nebula-page-header`, `.nebula-eyebrow`, `.nebula-page-title`,
  `.nebula-page-description`) untouched — user likes those.
- `packages/cli/src/layouts/DocsLayout.astro` — wrapper class rename.

**Open follow-up (durable fix):** extract the `.mdx-prose` rules into a
shared module in `@nebula-docs/styles` (or as a CSS file in
`@nebula-docs/components`) so both consumers `@import` the same source.
The current "keep two copies in sync" comment is a tax that visual
parity will pay forever otherwise.

---

## Round 2 (open)

Compare each page in `tenants/nebula-docs-starter` against its editor
preview. Catalog any remaining drift per component (Tabs, Cards, Steps,
ParamFields, etc.) and fix at the source (component file in
`@nebula-docs/components` or per-element rule in `.mdx-prose`).
