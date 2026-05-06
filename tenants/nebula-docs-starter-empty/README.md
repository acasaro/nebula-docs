# Example Docs (synthetic tenant)

Dev fixture for the Nebula Docs CLI. Lives in the monorepo so the CLI can iterate against a real tenant shape without round-tripping through GitHub. Once the CLI is shipping, real tenants live in their own repos.

## What's here

- `docs.json` — tenant config (navigation, theme reference, search). Mirrors the schema the Nebula Docs Platform edits.
- `theme.json` — theme override layer. Currently extends `mcoe-default` with no overrides; tenants that need branding add tokens here.
- `content/` — MDX pages. Routes derive from file paths; `content/foo/bar.mdx` → `/foo/bar`.
  - `content/snippets/` — reusable MDX fragments resolved via `<Snippet file="..." />`. Resolved at both build-time (CLI) and editor-time (Platform).
- `assets/` — passthrough static assets (favicon, logos, images).

## Goal of the content

Every block in `@nebula-docs/components` is exercised by at least one page:

- **Layout** — headings, paragraphs, lists, code, tables (in `index.mdx` and `getting-started/installation.mdx`)
- **Card / CardGroup / Frame** — `components/cards.mdx`
- **Tabs / Tab** — `components/tabs.mdx`
- **Steps / Step** — `getting-started/installation.mdx`
- **Callout family** (`Callout`, `Note`, `Tip`, `Info`, `Warning`, `Danger`, `Check`) — sprinkled across pages
- **ParamField / ResponseField / RequestExample / ResponseExample** — `api/users.mdx`
- **Snippet** — `getting-started/installation.mdx` includes `snippets/disclaimer`

## Running

The CLI doesn't exist yet. When it ships:

```
pnpm --filter @nebula-docs/cli dev tenants/example-docs
pnpm --filter @nebula-docs/cli build tenants/example-docs
```

Until then, this tenant is read-only fixture data.

## Status

This tenant is intentionally small. It will grow as the CLI lands and we discover what shapes need test coverage. See [.claude/status.md](../../.claude/status.md) for the active roadmap.
