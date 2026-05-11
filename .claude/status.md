# Status — current open work

What's currently open and what's next. Completed-work narrative lives in git history, not here. Locked decisions live in [decisions.md](decisions.md).

## Open follow-ups

### Editor (Platform)

- `<Icon>`, `<VideoLoop>`, and standalone `<Example>` round-trip via `MdxRaw` (no editing UI). Add a NodeView if/when editor-time UI is needed.
- Verify edit-in-place inside child slots of Card / Frame / Step / Tab / Accordion / Column / Expandable works for paragraphs, headings, and lists.
- `mdxCodeBlock` has no popover schema (its only user-facing attr is `language`, exposed via the inline dropdown). Add a schema if more attrs (filename, title) get modeled.
- Slug field on the page form is read-only. Renaming a page (slug change → file move) needs path-aware tracking; not yet wired.
- Inline edit for existing nav-tree entries (rename a tab/group/page from the row) is not wired — only new entries are inline-editable.
- Time-aware greeting bound to the authenticated user on the Home dashboard.

### Webhook / Firestore

- Verify Firestore rules on `nebula-docs-plat-dev` allow `activity` / `builds` reads — rules are per-database, dev DB needs the prod rules applied separately.
- Prod webhook URL / secret config in the `nebula-docs` (Enterprise) GH App settings — only when ready to roll out to prod.
- Smoke-test the preview-cleanup workflow on the dev tenant.

### CLI

- **Distribution build.** Bin runs via `tsx ./bin/nebula.mjs` today; for npm-published consumption, bundle (tsup/esbuild) the CLI + workspace deps into shippable JS.
- **Visual-parity audit** between Platform editor preview and CLI render. Drift sources: Tailwind `@source` config, font stacks, prose context rules. Plan: catalog every visible difference once both surfaces stabilize, then extract component-level rules into a shared `@nebula-docs/styles` package both sides import.
- **CodeGroup convergence.** Astro shim covers the CLI side; Platform-side CodeGroup work in parallel. Diff the two APIs and pick one before they drift further.
- **Other introspection-pattern blocks.** Accordion, Columns, and anything else that needs to read child props at render time will hit the Astro+React+MDX SSR boundary. Apply the Astro slot wrapper pattern when a tenant exercises them (see [decisions.md](decisions.md)).
- **Snippet path convention.** `<Snippet file="disclaimer" />` resolves to `content/snippets/disclaimer.mdx` (relative to the snippets dir, not content). Worth a doc note in the JSON Schema once Phase 6 lands.
- **Tenant-local component auto-discovery.** `remarkAutoComponentImports` only covers `@nebula-docs/components`. Tenant-local React components in `<tenant>/components/*.tsx` still need explicit imports. Extend the catalog when a tenant has tenant-local components.

### Analytics (v1)

- **Prod function deploy.** `getAnalyticsSummary` was written but only `:dev` deployed. Run `pnpm --filter @nebula-docs/functions deploy:prod` before flipping the SPA to `NEBULA_ENV=prod`.
- **Top Users column always empty** (GA4 Data API limitation on anonymous traffic). BigQuery export or a sign-in flow on docs are the only ways forward; dashboard column shows "No active users yet" honestly.
- **No caching on the function.** Add a 5-min Firestore cache the moment the dashboard goes wider than editors.
- **`data-analytics-surface` tagging** on Nebula components (Card / FeatureCard / navbar tabs / footer columns) — would give cleaner aggregations than the current generic `surface: "link"`.
- **`deriveSiteContext` is MCOE-specific.** Lift the instance set into a tenant config when tenant #2 lands.
- **Home dashboard widgets.** Visitors / Views / Top Pages cards on the Home dashboard, once the `/analytics` page settles.

### Snippets (Phase B+ extensions)

- **Variable substitution depth.** `{propName}` in snippet bodies uses a simple regex; doesn't handle nested expressions or computed values. `extractExports` is ready for Phase B's reusable-variable model (`import { brandName } from "/snippets/vars.mdx"`) but the rendering side isn't wired.
- **`.jsx` snippet live-render in editor** — currently shows a placeholder. Sandboxed eval, defer until a tenant wants it.
- **Snippet props editor in AttributesPopover** — `mdxImportedSnippet` schema not yet defined. Editing `word="bananas"` requires source mode today.

## Next workstreams

### Custom theming (designed, not implemented)

`theme.json` overrides on top of a base theme → CSS vars at build. Editor surface for tenants to pick primary color, fonts, logo.

- `@nebula-docs/theme` — frozen base tokens (exists)
- `@nebula-docs/schemas` — `theme.json` schema (exists)
- `@nebula-docs/cli` — composition pipeline (exists — globals → tenant base → `theme.json` → CSS vars)
- `products/nebula-platform/` — new "Branding" settings panel parallel to GitHub App settings. Color picker for primary, font selectors, logo upload. Serializes to `theme.json`, commits via existing dirty-tracking.

Most of the plumbing is in place; the open work is the editor UI for tenants to author overrides without hand-editing JSON.

### OOSS hosting port

Add OOSS as a parallel deploy target for tenants behind UHG firewall. Handoff is in [ooss-hosting-port.md](ooss-hosting-port.md). The Firebase Hosting implementation is shipped; OOSS templates exist at `packages/cli/template/.github/workflows-ooss/` but haven't been executed for a real tenant.

## Status conventions

When a workstream item lands, update this doc rather than spinning up a handoff file. Decisions discovered during work go into [decisions.md](decisions.md). If a workstream becomes substantial enough to need its own architecture doc, add it under `.claude/<topic>.md` and link from here.
