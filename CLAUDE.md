# Nebula Docs — Claude Guide

pnpm-workspace monorepo for **Nebula Docs**, a multi-tenant documentation platform shipping:

- **Nebula Docs Platform** — the editor SPA in `products/nebula/`. Vite + React 19 + Tailwind v4 + shadcn/ui + Tiptap. Substantially built; Phase 3 editor work in flight. See [.claude/nebula.md](.claude/nebula.md).
- **Nebula Docs SSG** — the multi-tenant static site generator planned at `packages/ssg/`. Astro + MDX + React + Tailwind v4. Not yet bootstrapped (a separate chat is starting on it). See [.claude/nebula-ssg.md](.claude/nebula-ssg.md).
- **Shared packages** in `packages/{components,schemas,theme,firebase}` — read by both the Platform and the SSG.
- **Cloud Functions** in `functions/` — three deployed prod functions (`mintGithubToken`, `getInstallation`, `githubWebhook`) plus three deployed dev variants for the parallel `nebula-docs-dev` GitHub App.

`products/docs/` is the legacy MCOE Docusaurus site, kept as content archive. It will become tenant zero of the SSG once the SSG is buildable. Don't develop new features there — content moves; the rendering layer changes.

For workstream-by-workstream status, see [.claude/status.md](.claude/status.md). For repo conventions, see [.claude/conventions.md](.claude/conventions.md).

## Repo layout

```
products/
  nebula/                # Nebula Docs Platform (editor SPA). Vite + React 19 + Tailwind v4
                         #   + shadcn/ui + Tiptap. The active product.
  docs/                  # Legacy MCOE Docusaurus site. Content archive — will become
                         #   tenant zero of the SSG. No new features here.

packages/
  components/            # React MDX block components (callout, card, frame, code-block,
                         #   tabs, accordion, mermaid, property, steps, tree, update, etc.).
                         #   Single source of truth, consumed by Platform + SSG + docs.
  schemas/               # Zod schemas, one per block type. Used editor-side for prop
                         #   validation when serializing back to MDX.
  theme/                 # TS-first design tokens. Source in src/themes/*.ts (frozen data).
                         #   Generates dist/tokens.css consumed by Docusaurus customCss.
  firebase/              # Slim init + auth helpers (Google + email). Imported directly by
                         #   the Platform. Accepts an optional firestoreDbId to target
                         #   either Firestore database (default vs nebula-docs-plat-dev).

functions/               # Firebase Cloud Functions. Three prod functions (enterprise GH
                         #   App, VPC-bound to nebula-connector) + three dev variants
                         #   (public-GH dev App, no VPC). Shared webhook handler factory.
                         #   All deployed to mcoe-d.

vendor/
  mintlify-components/   # Reference implementation only — read source when porting MDX
  mint-docs-ref/         #   components or matching SSG behavior. MIT-licensed; vendored
  mint-starter-docs-template/   # verbatim. Names retained because they're MIT verbatim
                         # copies; renaming would be wrong. Refer to components in our own
                         # code by their generic names (Frame, Card, etc.) — never as
                         # "Mintlify-style". Delete once we no longer reference.

.claude/
  nebula.md              # Platform architecture + settled decisions
  nebula-ssg.md          # SSG architecture + locked decisions + tenant model
  conventions.md         # Repo-wide patterns
  status.md              # Live workstream snapshot
  archive/               # Historical context (old docs-site arch, April 2026 refactor log)
```

## Stack (workspace-wide)

- **Package manager**: pnpm v10.33 (workspace at root)
- **Node**: ≥22 (pinned via `.nvmrc`)
- **TypeScript**: strict everywhere; per-package `tsconfig.json` extends `tsconfig.base.json`
- **CI**: GitHub Actions on `uhg-runner` → JFrog mirror → OOSS (deploys SPA + docs site). Functions are deployed manually for now (`deploy-functions.yml` is a stub).
- **Backend**: Firebase project `mcoe-d`. Auth + Firestore + Functions. Two Firestore databases: `(default)` for prod-Enterprise data, `nebula-docs-plat-dev` for dev work.

## Workspace conventions (canonical: [.claude/conventions.md](.claude/conventions.md))

- Workspace deps: `"@nebula-docs/<name>": "workspace:*"`. Never reach across `products/*` for code; share via `packages/*`. The legacy docs site is `@mcoe/docs`.
- `packages/components/` is the canonical home for MDX block components. New components go there with a Zod schema in `packages/schemas/`.
- `packages/theme` data is **frozen**. Don't change color values, add themes, or restructure the `ThemeTokens` interface. Consumer plumbing is fair game.
- Folder-per-component: `FolderName/ExportedName.tsx` + `index.ts` re-export barrel. Folder, filename, and exported component name match. **Zero `index.tsx` files** in the repo. (Docusaurus swizzles in `products/docs/src/theme/**` are the documented exception.)

## Hard rules

These override anything else, including memory guidance.

- **No "Mintlify" in shipped source.** Code, MDX, READMEs, JSDoc, identifiers, filenames, and commit messages must not contain "Mintlify" or variants. `.claude/` design docs MAY name Mintlify when factually describing the actual reference being studied (e.g., `vendor/mint-docs-ref/`); never use positioning ("clone of X"). Refer to components by their generic name or "Nebula Docs <X>".
- **Brand is "Nebula Docs".** The editor app is "Nebula Docs Platform" (or "Studio"). The renderer is "Nebula Docs SSG". Never "Nebula CMS".
- **No `.env.example` files.** Use gitignored `.env`. The unified root `.env` (Vite envDir + dotenv) is the single source for `FIREBASE_*`, `NEBULA_*`, `FIRESTORE_*` shared values.
- **Tokens are frozen.** Per above.
- **Behavior preservation on `products/docs/`.** Until SSG migration completes, the Docusaurus site must build and render exactly as it does today. Run `pnpm --filter @mcoe/docs build` and treat broken-link warnings as errors.
- **GitHub host is GitHub Enterprise Cloud (`github.com/<org>`).** Not GHES. No `baseUrl` overrides on Octokit.
- **Firebase Functions secrets via `--data-file`.** Never interactive paste. Matters most for the GitHub App PEM private keys.
- **No component code in `index.tsx`.** Always `index.ts` re-export + `ComponentName.tsx`. Zero tolerance.

## Cross-cutting tips

- **Run from root**: `pnpm --filter @<scope>/<name> <script>`. Scopes: `@mcoe/docs` for the legacy site, `@nebula-docs/*` for everything else.
- **Adding a workspace dep**: `pnpm --filter @<scope>/<consumer> add @<scope>/<dep>` (uses `workspace:*` automatically when target is local).
- **Cleanup**: `pnpm clean` removes per-package `node_modules`, `dist`, `build`, `.docusaurus`, plus root `node_modules`.
- **Function deploys**: `pnpm --filter @nebula-docs/functions deploy:dev` or `deploy:prod`. Never the unfiltered `deploy` script — it touches both env sets and risks deploying local dev code into the prod function slots.
- **Active env switch**: `NEBULA_ENV=dev|prod` in the root `.env`. Picks the GitHub App pair, the Firestore database (`nebula-docs-plat-dev` vs `(default)`), and the deployed Cloud Function names (`*Dev` suffix vs unsuffixed) the SPA calls.

## Where to start in a new chat

1. Read [.claude/status.md](.claude/status.md) for the live workstream snapshot — what's done, what's open, where the code lives.
2. Read [.claude/nebula.md](.claude/nebula.md) (Platform) and / or [.claude/nebula-ssg.md](.claude/nebula-ssg.md) (SSG) depending on which workstream you're touching.
3. Read [.claude/conventions.md](.claude/conventions.md) for repo-wide patterns.
4. The decisions documented in `nebula.md` and `nebula-ssg.md` are settled — don't relitigate without flagging in the doc first.
