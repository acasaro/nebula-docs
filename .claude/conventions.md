# Conventions

Repo-wide patterns for Nebula Docs work. These apply across `products/nebula/`, `packages/*`, `functions/`, and any new package added to the workspace.

For Platform architecture, see [nebula.md](nebula.md). For SSG architecture, see [nebula-ssg.md](nebula-ssg.md). For the live workstream snapshot, see [status.md](status.md).

## Hard rules (non-negotiable)

### No component code in `index.tsx`

Every component folder uses this shape:

```
FolderName/
  ExportedName.tsx        ← component, styled parts, logic
  index.ts                ← pure re-export barrel
```

The barrel:

```ts
export { default } from './ExportedName';
export * from './ExportedName';
```

Folder name, `.tsx` filename, and exported component name must all match.

Applies to: `products/nebula/src/components/**`, `packages/components/src/**`, future `packages/ssg/**`. The repo currently has zero `index.tsx` files; keep it that way.

**Exception — Docusaurus swizzles in `products/docs/src/theme/**`.** Docusaurus's swizzle resolver treats the folder path as the module identity, so the folder name is fixed by Docusaurus (`Logo/`, `Layout/`, etc.), but the `.tsx` filename still matches the exported component (`Logo/NavbarLogo.tsx`). This exception goes away when MCOE migrates onto the SSG.

### Tokens are frozen

The data in `packages/theme/src/themes/{mcoeDefault,uhc,optum}.ts` is the approved foundation. Don't change color values, add themes, or restructure the `ThemeTokens` interface. The consumer layer (CSS-var generation, theme switching plumbing, `applyTokensToDOM()`) is fair game.

### No "Mintlify" in shipped source

Shipped code, MDX, READMEs, JSDoc, identifiers, filenames, and commit messages must not contain "Mintlify" or variants ("mintl", "mint-style", "Mintlify-style"). Refer to components by their generic name (`Frame`, `Card`, `Tabs`) or use "Nebula Docs <X>" when disambiguation is needed.

`.claude/` design docs MAY name Mintlify when factually describing the actual reference being studied (e.g., "patterns drawn from `vendor/mint-docs-ref/`", "inspected the upstream dashboard editor"). What is NOT OK in design docs either: positioning language ("clone of X", "we're like X"). Describe what we're building on its own terms.

The vendored references at `vendor/mintlify-components/`, `vendor/mint-docs-ref/`, `vendor/mint-starter-docs-template/` keep their original directory names because they're MIT-licensed verbatim copies — renaming would be wrong. Delete them when we no longer need to reference them.

### Brand: "Nebula Docs"

- The editor SPA → "Nebula Docs Platform" (default) or "Nebula Docs Studio" (alternative).
- The renderer → "Nebula Docs SSG".
- The product family → "Nebula Docs".
- Never "Nebula CMS".

Generic technical terms ("runtime CMS" describing an architectural pattern) are fine — the rule targets brand naming, not category nouns.

### No `.env.example` files

Use gitignored `.env` files only. The unified root `.env` is the single source for shared values (`FIREBASE_*`, `NEBULA_*`, `FIRESTORE_*`). Don't commit env-file templates.

If you need to document env vars, do it in the gitignored `.env` itself or in inline source comments at the consumer.

### Behavior preservation on `products/docs/`

The legacy MCOE Docusaurus site at `products/docs/` functions exactly as the user wants today. Refactors there must be behavior-preserving. After non-trivial changes, run `pnpm --filter @mcoe/docs typecheck && pnpm --filter @mcoe/docs build` and treat broken-link warnings as errors.

The same standard applies to the upcoming SSG migration: visual fidelity with the existing Docusaurus output is the cutover gate.

### GitHub host is Enterprise Cloud

UHG's GitHub is GitHub Enterprise Cloud at `github.com/<org>`, not GHES. Don't propose `baseUrl: 'https://<host>/api/v3'` overrides on Octokit. `api.github.com` is correct for all clients.

### Firebase secrets via `--data-file`

Set Firebase Functions secrets using `--data-file=/absolute/path`, never interactive paste. Matters most for the GitHub App PEM private keys.

```bash
firebase functions:secrets:set <NAME> --data-file=/absolute/path
```

## Conventions

### Workspace deps

- Workspace deps use `"@nebula-docs/<name>": "workspace:*"`. Never reach across `products/*` for code; share via `packages/*`.
- The `@mcoe/docs` package is a special case (the legacy Docusaurus site that becomes tenant zero of the SSG). Everything else is `@nebula-docs/*`.
- Adding a workspace dep: `pnpm --filter @nebula-docs/<consumer> add @nebula-docs/<dep>` (uses `workspace:*` automatically when target is local).

### TypeScript

- `strict: true` is on across the workspace.
- No `any` in first-party code. Use `unknown` and narrow, use `never` for "accepts anything" positions, or use proper generics.
- Type public component props explicitly; internal helpers can infer.

### Styling

Each package has one styling system; don't cross streams.

| Package | System |
|---|---|
| `products/nebula/` | Tailwind v4 only |
| `packages/components/` | Tailwind v4 only |
| `packages/ssg/` (planned) | Tailwind v4 + emotion (where existing components use it) + token CSS vars |
| `products/docs/` (legacy) | emotion + CSS modules (swizzles) + global tokens — three systems scoped by location |

### Imports

- Path aliases over deep relative paths (`@/lib/utils`, not `../../lib/utils`).
- Folder-level barrels (`from '@/components/dashboard'`, not `from '@/components/dashboard/DashboardHomePage'`).

### MDX components

Add new MDX block components to `packages/components/src/<name>/` and add a Zod schema to `packages/schemas/src/`. Both consumers (the Platform's `MdxEditor` and the SSG) read from the same package.

For block types that need an editor NodeView (rich Tiptap UI) in addition to the renderer, add a `Mdx<Name>Node.tsx` under `products/nebula/src/components/mdx/` and register it in the Tiptap `extensions` list. Components without a NodeView round-trip via `MdxRaw` (preserves source verbatim, no editing UI).

### Function deploys

Manual via `pnpm --filter @nebula-docs/functions deploy:dev` or `deploy:prod` from a workstation. Never use the unfiltered `deploy` script — it touches both env sets and risks deploying local dev code into the prod function slots. CI deploy of functions is not yet wired (`deploy-functions.yml` is a stub).

### Git, commits, PRs

- Run `pnpm --filter <package> typecheck && pnpm --filter <package> build` before pushing. CI does not run these.
- Don't commit changes you weren't asked to commit. If unclear, ask first.
- Branches: `feat/<topic>`, `fix/<topic>`, `docs/<topic>`. PRs target `main`.

### ScheduleWakeup

Don't use `ScheduleWakeup` as a general "sleep". It's only for `/loop` dynamic-pacing mode and creates a `scheduled_tasks.lock` artifact. For waiting on background work, use `Bash` with `run_in_background`. For polling, use `Monitor` with an until-loop. For inline async, just keep working.
