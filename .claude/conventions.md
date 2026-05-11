# Conventions

Negotiable repo patterns. Hard rules and locked decisions live in [CLAUDE.md](../CLAUDE.md) and [decisions.md](decisions.md).

## Workspace deps

- `"@nebula-docs/<name>": "workspace:*"`. Never reach across `products/*` for code; share via `packages/*`.
- The legacy Docusaurus site is `@mcoe/docs` (special case until the CLI migration lands).
- Add a workspace dep: `pnpm --filter @nebula-docs/<consumer> add @nebula-docs/<dep>` (uses `workspace:*` automatically when target is local).

## TypeScript

- `strict: true` across the workspace.
- No `any` in first-party code. Use `unknown` and narrow, `never` for "accepts anything" positions, or proper generics.
- Type public component props explicitly; internal helpers can infer.

## Styling

Each package has one styling system; don't cross streams.

| Package | System |
|---|---|
| `products/nebula-platform/` | Tailwind v4 only |
| `packages/components/` | Tailwind v4 only |
| `packages/cli/` | Tailwind v4 + emotion (where existing components use it) + token CSS vars |
| `products/docs/` (legacy) | emotion + CSS modules (swizzles) + global tokens — three systems scoped by location |

## Imports

- Path aliases over deep relative paths (`@/lib/utils`, not `../../lib/utils`).
- Folder-level barrels (`from '@/components/dashboard'`, not `from '@/components/dashboard/DashboardHomePage'`).

## MDX components

Add new MDX block components to `packages/components/src/<name>/` with a Zod schema in `packages/schemas/src/blocks/`. Both consumers (the Platform's `MdxEditor` and the CLI) read from the same package.

**End-to-end checklist for a new block** (every step in one change — half-ports break silently in one surface):

1. React component in `packages/components/src/<name>/` (folder + `<Name>.tsx` + `index.ts` re-export).
2. Zod schema in `packages/schemas/src/blocks/`.
3. NodeView in `products/nebula-platform/src/components/mdx/Mdx<Name>Node.tsx` if editor-time UI is needed (components without a NodeView round-trip via `MdxRaw`).
4. Tiptap registration in the editor's extensions list.
5. MDX parser/serializer hooks in `lib/mdx/mdastToTiptap.ts` + `tiptapToMdx.ts` if attrs need round-tripping.
6. Slash menu entry in `slashItems.tsx`.
7. CLI runtime: if the component needs to introspect children, add an Astro shim in `packages/cli/src/runtime/components/<Name>.astro` and the page route's component map. Otherwise it works through the auto-import map.

## Folder-per-component

```
FolderName/
  ExportedName.tsx        ← component, styled parts, logic
  index.ts                ← pure re-export barrel
```

Folder name, `.tsx` filename, and exported component name must match. Zero `index.tsx` files (hard rule in [CLAUDE.md](../CLAUDE.md)).

## Git, commits, PRs

- Run `pnpm --filter <package> typecheck && pnpm --filter <package> build` before pushing. CI does not run these.
- Don't commit changes you weren't asked to commit. If unclear, ask first.
- Branches: `feat/<topic>`, `fix/<topic>`, `docs/<topic>`. PRs target `main`.

## ScheduleWakeup

Don't use `ScheduleWakeup` as a general "sleep". It's only for `/loop` dynamic-pacing mode and creates a `scheduled_tasks.lock` artifact. For background work, use `Bash` with `run_in_background`. For polling, use `Monitor` with an until-loop.
