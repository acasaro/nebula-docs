# Nebula Docs — Architecture

The 10000-ft view of the whole framework. For per-pillar deep-dives see [nebula.md](nebula.md) (Platform) and [nebula-cli.md](nebula-cli.md) (CLI). For the live workstream snapshot see [status.md](status.md). For repo-wide rules see [conventions.md](conventions.md).

## What Nebula Docs is

A multi-tenant documentation platform for UHG. Each tenant team owns a docs repo (MDX content + a `docs.json` config + an optional `theme.json`), pulls in `@nebula-docs/cli` as a dev dep, and runs `nebula-docs build` in CI to produce a static site they upload to their OOSS bucket. Editors sign into the **Nebula Docs Platform** SPA to edit visually; the Platform commits MDX changes to the tenant repo via a custom GitHub App; CI rebuilds the site.

## The four pillars

```
┌────────────────────┐     ┌──────────────────┐
│  Platform (SPA)    │     │  CLI (npm pkg)   │
│  products/         │     │  packages/       │
│    nebula-platform │     │    cli           │
│                    │     │                  │
│  Edits MDX +       │     │  Builds tenant   │
│  docs.json via     │     │  docs.json +     │
│  GitHub App        │     │  content into    │
│                    │     │  static dist/    │
└─────────┬──────────┘     └────────┬─────────┘
          │                         │
          │   reads & writes        │   reads
          ▼                         ▼
   ┌─────────────────────────────────────────┐
   │            Tenant docs repo              │
   │  docs.json · theme.json · content/ ·    │
   │  assets/ · components/ · package.json   │
   └─────────────────────────────────────────┘
          ▲                         │
          │                         │  CI runs
          │  webhooks → Firestore   │  nebula-docs build
          │                         │
   ┌──────┴───────┐           ┌────▼─────────┐
   │  Functions   │           │  OOSS bucket │
   │  functions/  │           │  (live site) │
   │              │           └──────────────┘
   │  GH App auth │
   │  + webhooks  │
   └──────────────┘
```

| Pillar | Lives at | Role |
|---|---|---|
| **Platform** | `products/nebula-platform/` | Editor SPA. Vite + React 19 + Tailwind v4 + shadcn/ui + Tiptap (ProseMirror). Users sign into this. |
| **CLI** | `packages/cli/` (planned) | Renderer + tooling. Astro + MDX + React + Tailwind v4. Distributed as `@nebula-docs/cli`; binary `nebula-docs`. Tenants invoke this in CI. |
| **Shared packages** | `packages/{components,schemas,theme,firebase,mdx,analytics}` | Six libraries consumed by Platform + CLI. Single source of truth for components, schemas, tokens, MDX parsing, analytics, and Firebase auth. |
| **Cloud Functions** | `functions/` | Server-side glue for the Platform: GitHub App token minting, installation lookup, webhook receiver. Six functions deployed (three prod + three dev). |

## The seven-package framework

Five exist today; two are planned. None of the upcoming features (preview, snippets, theming, analytics dashboard, search) requires an eighth package.

| Package | Role | Status |
|---|---|---|
| `@nebula-docs/cli` | CLI binary + Astro integration + runtime islands + default layouts + starter template, all in one publishable package. | Planned |
| `@nebula-docs/components` | React MDX block components (callout, card, frame, code-block, tabs, accordion, mermaid, property, steps, tree, update, etc.). Single source of truth for both editor canvas and rendered output. | Exists |
| `@nebula-docs/schemas` | Zod schemas + emitted JSON Schemas for `docs.json`, `theme.json`, MDX frontmatter, and per-block prop schemas. | Exists |
| `@nebula-docs/theme` | Frozen design tokens. Composed at build time → CSS vars. | Exists |
| `@nebula-docs/firebase` | Firebase init + auth helpers. Platform-only consumer. | Exists |
| `@nebula-docs/mdx` | Pure MDX parse / serialize / frontmatter helpers + snippet resolver. Two consumers (Platform editor at edit-time + CLI at build-time) so they can't drift. | Planned |
| `@nebula-docs/analytics` | Pluggable analytics providers (GA4, Firebase, PostHog, Plausible). Subpath exports per provider; tenants tree-shake to zero JS if they skip analytics. | Planned |

### Naming convention

- Scoped: `@nebula-docs/*`
- Lowercase, hyphen-separated, singular noun
- Directory name matches the package name's last segment
- One package = one concern; the name says the concern

### Rule for adding a new package

> "Will at least two consumers import from this, OR is the surface area its own concern with its own version cadence?"

If yes, extract. If no, keep it inline. That's the whole policy.

## Tenants

A tenant is a docs repo (docs.json + content + theme.json). Tenant repos are owned by the tenant team and live in their own GitHub repo. During development, two tenant fixtures live inside this monorepo for convenience:

| Fixture | Role |
|---|---|
| `tenants/example-docs/` | Synthetic dev fixture. Designed to exercise every block in `@nebula-docs/components` so the CLI can iterate against it without round-tripping through GitHub. |
| `tenants/mcoe-docs/` | MCOE migration target. Carved out of `products/docs/` during the Docusaurus → CLI migration. Eventually extracted to its own external repo. |

Five vendored references in `vendor/` informed our designs and serve as study sources:

| Vendor folder | Role |
|---|---|
| `vendor/mintlify-nodemodule/` | Architecture study (CLI/build package layout) |
| `vendor/mintlify-components/` | Component port reference |
| `vendor/mint-docs-ref/` | Full upstream rendering reference |
| `vendor/mint-empty-starter-main/` | Blueprint for `packages/cli/template/` (what `nebula-docs init` produces) |
| `vendor/mcoe-docs-main/` | Reference for a populated tenant repo's shape and content |

All `vendor/*` folders are MIT-licensed verbatim copies. Each gets deleted as we stop referencing it.

## End-to-end editing flow

```
1. Editor signs into the Platform (Firebase Auth)
2. Platform → mintGithubToken Cloud Function → short-lived installation token
3. Platform reads tenant repo via Octokit (file tree, MDX, docs.json)
4. Editor opens an MDX file → Platform parses to MDAST → loads into Tiptap
5. Editor edits visually → Tiptap doc serializes back to MDX on every change
6. Editor clicks "Commit & PR":
     → Platform creates branch, commits MDX, opens PR
     → Commit attribution: nebula-docs[bot]; user noted in commit body
7. GitHub Actions runs `nebula-docs build` in the tenant repo
     → If main: build to bucket root
     → If PR: build with --base /previews/<PR#>/ to bucket sub-path
8. Static site live in tenant's OOSS bucket
9. GitHub fires webhook events to githubWebhook Cloud Function
     → Function verifies signature, writes to Firestore (activity/, builds/)
10. Platform subscribes via onSnapshot — dashboard updates with build status
```

## Dev / prod GitHub App split

The Platform supports two parallel GitHub Apps under the same Firebase project (`mcoe-d`):

- **Enterprise** (`nebula-docs`) — installed on UHG private docs orgs. Functions: `mintGithubToken`, `getInstallation`, `githubWebhook` (VPC-bound to `nebula-connector` for the GitHub Enterprise IP allowlist).
- **Dev** (`nebula-docs-dev`) — installed on a public demo repo. Functions: `mintGithubTokenDev`, `getInstallationDev`, `githubWebhookDev` (no VPC, direct egress).

The active env is selected by `NEBULA_ENV=dev|prod` in the root `.env`. This drives:

- Which GitHub App's install URL the Platform shows
- Which Firestore database the Platform reads/writes (`(default)` for prod, `nebula-docs-plat-dev` for dev)
- Which Cloud Function names the Platform calls (`*Dev` suffix vs unsuffixed)

Deploys are scoped: `pnpm --filter @nebula-docs/functions deploy:dev` / `deploy:prod`. Never the unfiltered `deploy`.

## Settled architectural decisions

These are documented in detail in `nebula.md` and `nebula-cli.md`. Don't relitigate without flagging in those docs first.

**Platform:**

- Tiptap (ProseMirror) for the editor surface. Per-block contenteditable was tried and reverted; MDXEditor was rejected.
- Tiptap doc is in-memory state, MDX is the I/O format (load: MDX → MDAST → Tiptap doc; serialize: Tiptap doc → MDX on every update).
- Edit storage: in-memory until commit. No Firestore drafts.
- Hosting: OOSS bucket `mcoe-dev-nebula`. Same firewall + deploy chain as the docs site.

**CLI:**

- Astro 5+ with `@astrojs/mdx`, `@astrojs/react`, Tailwind v4. Static-first.
- Single consolidated package. Splits later only when a concrete trigger arrives (e.g., Platform needs to invoke a build server-side).
- Search: Pagefind. Build-time index, zero runtime dependency, multi-tenant by construction.
- CI: `uhg-runner` only. Hosting: per-tenant OOSS bucket behind UHG firewall.

**Multi-tenancy:**

- Per-tenant repo, owned by the tenant team. The CLI is an npm dep, not a hosted service.
- Schema versioning: pin CLI version in tenant `package.json`. Tenants upgrade when they choose.
- Concurrency: assume single-editor per tenant. No file-locking.
- API reference / OpenAPI: deferred until first tenant asks.

**Brand & shipped-source rules:**

- Brand: "Nebula Docs". Editor SPA: "Nebula Docs Platform". Renderer + tooling: "Nebula Docs CLI". Never "Nebula CMS".
- "Mintlify" never appears in shipped source. Design docs in `.claude/` may name Mintlify factually as a study reference; never as positioning ("clone of X").

## Where each upcoming feature lives

The five upcoming features map cleanly to existing packages — none requires a new top-level package.

| Feature | Package(s) involved | Notes |
|---|---|---|
| Preview before merge | `@nebula-docs/cli` (`--base` flag), tenant template (workflow YAML), `functions/` (preview URL on builds), `products/nebula-platform/` (Preview button) | Per-PR build at `bucket/previews/<PR-number>/`. |
| Snippets | `@nebula-docs/mdx` (remark-snippets plugin) | Resolves both at build-time and editor-time so the editor shows resolved content. |
| Custom theming | `@nebula-docs/theme` (tokens), `@nebula-docs/schemas` (`theme.json` schema), `@nebula-docs/cli` (composition pipeline), `products/nebula-platform/` (Branding settings panel) | `theme.json` overrides layered onto a base theme → CSS vars. |
| Analytics dashboard | `@nebula-docs/analytics` (provider system), `functions/getAnalyticsSummary.ts` (Firebase reader), `products/nebula-platform/` (dashboard widgets) | v1 ships Firebase Analytics provider; abstraction supports GA4/PostHog/Plausible later. |
| Search | `@nebula-docs/cli/src/runtime/search/` (Pagefind integration + UI island) | Tenants opt in via `docs.json`. Zero JS for tenants who skip it. |

## See also

- [nebula.md](nebula.md) — Platform architecture deep-dive
- [nebula-cli.md](nebula-cli.md) — CLI architecture deep-dive (Astro stack, multi-tenancy, build phases, locked decisions)
- [status.md](status.md) — live workstream snapshot + Upcoming workstreams
- [conventions.md](conventions.md) — repo-wide rules
- [archive/](archive/) — historical context
