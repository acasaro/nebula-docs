# Kickoff: Nebula Dashboard, Home Screen

You're building the Home screen of the Nebula dashboard. Nebula is a git-based MDX editor (a Mintlify clone) for the MCoE docs platform. The Home screen mirrors Mintlify's per-deployment dashboard, with Nebula branding. Two screenshots are attached showing the two tab states (Activity and Previews). Match them as closely as possible.

---

## Step 1, Required reading (do this before anything else)

Read these files in order. Confirm you've read each.

1. `CLAUDE.md` at repo root, workspace-wide architecture and conventions
2. `.claude/nebula.md`, the Nebula rebuild plan, especially the Stack table, "What stays from prior work", and Phase breakdown
3. `packages/theme/src/themes/*.ts`, the frozen design tokens you'll consume
4. `packages/components/src/`, the existing component file/folder patterns
5. `vendor/mintlify-components/`, reference-only Mintlify component source, useful for visual cues, do not import as a dep

## Step 2, Verify state

Run `ls products/nebula/` and inspect.

- If `products/nebula/` does not exist or is empty, complete Phase 0 from `.claude/nebula.md` first (Vite + React 19 + Tailwind v4 + shadcn/ui scaffold, workspace deps wired up, `pnpm --filter @nebula-docs/platform dev` shows a Hello page on `localhost:8081`). Then proceed.
- If Phase 0 is done, confirm Tailwind v4, shadcn/ui, react-router, and the four workspace deps (`@nebula-docs/components`, `@nebula-docs/schemas`, `@nebula-docs/theme`, `@nebula-docs/firebase`) are present in `package.json` before continuing.

## Step 3, Confirm scope with me, then propose a plan

Before writing any feature code, post:

1. A 5-line summary of what you understood from the reading
2. Answers (or open questions) to the items in "Open questions" below
3. A proposed component tree and file plan, list every file you'll create with a one-line purpose, plus any shadcn primitives you'll add

Wait for my approval before implementing.

---

## Mission

Implement the Home screen of the Nebula dashboard. It's the per-deployment landing page, exactly one repo's status. Match the attached Mintlify screenshots 1:1 in **layout, spacing, and information density**, but NOT in color. Brand swaps:

- **Color semantics**, the Mintlify screenshots use one green for two different roles. Map them to two different tokens: brand-coded elements (Live pill backdrop, "Add custom domain" link, bot avatar ring, hover/active accents) use the existing Nebula primary brand token, status-coded elements (Successful status pill, deployment log checkmarks) use a separate success token. Use whatever tokens are already wired up in the Nebula app, do not introduce new ones.
- Nebula branding everywhere (no "Mintlify" copy or logo)
- The bot actor `nebula-docs[bot]` keeps the orbit/satellite glyph as the Nebula bot avatar
- "Powered by mintlify" footer in the thumbnail becomes "Powered by Nebula" or is dropped

## In-scope UI

The screenshots are two states of the same page (Activity tab vs Previews tab). Build both, the tab toggle switches between them.

### Header band
- Top-right user avatar, initial-in-circle for now, hooks into Firebase Auth later
- Time-aware greeting, "Good morning/afternoon/evening, {firstName}"

### Deployment hero card
- Left: browser-frame thumbnail of the rendered docs site (static placeholder image is fine)
- Right column:
  - Site name + green "● Live" status pill
  - "Last updated {relativeTime} by {actorAvatar} {actorName}"
  - Three icon-only ghost buttons (use lucide-react), then a "Visit site" button with globe icon, all in one row
  - Domain section, label + monospace URL with external-arrow
  - "Add custom domain" inline link with a dashed-circle plus icon, green accent
  - GitHub repo line, octicon + `{owner} / {repo}` link
  - Branch line, branch icon + `branch {name}`

### Section heading + tab toggle
- Heading reads "Activity" on the Live tab, "Previews" on the Previews tab
- Pill-style segmented control top-right, two options: Live | Previews
- Previews tab also shows a "+ Create custom preview" outlined button under the heading

### Activity / Previews table
- Columns: Update, (Branch only on Previews), Status, Changes, (chevron)
- Row anatomy:
  - Avatar/icon column, user photo for humans, Nebula bot mark for `nebula-docs[bot]`
  - Name + relative timestamp stacked
  - Branch pill (Previews only), branch icon + name in a subtle pill
  - Green "● Successful" status pill
  - Change summary + small "{n} file(s) edited/added/removed" line below
  - Expand chevron right-aligned
- Hover state on rows, expand on click

### Expanded row (Previews tab, see screenshot 1)
Two-column expansion:
- Left:
  - "✓ Update successful" + supporting line
  - "Preview URL" header + URL link
  - "Commit details" header + source ref + short SHA
  - "Files changed" header + list of file links with external-arrow icons
- Right:
  - "Redeploy ⟳" and "Visit ↗" buttons top-right of this column
  - "Deployment log" header
  - Vertical checklist of deployment steps with green checkmarks

The Live tab (screenshot 2) row expansion can be a simpler diff view, scope it small or stub it for now and call it out.

## Stack (per `.claude/nebula.md` and current state)

- Vite + React 19 + React Router 7
- Tailwind CSS v4
- **Radix-based component infra is already set up in the Nebula app, use what's there.** Do not re-bootstrap shadcn or pull in a parallel UI lib. If a primitive you need (Tabs, Collapsible, etc.) isn't already wired up, add it via the existing pattern (likely `pnpm dlx shadcn@canary add <component>`, but verify by looking at how existing primitives were added).
- lucide-react for icons
- TypeScript strict, no `any`
- Workspace deps via `workspace:*`

## Conventions (per `CLAUDE.md`)

- **No `index.tsx` for component code, ever.** Pattern is `Folder/Folder.tsx` (the code) + `Folder/index.ts` (pure re-export). Folder name, filename, and exported component name must all match.
- Folder-level barrels for imports, e.g., `from '@/components/dashboard'`, not nested paths
- Path aliases configured in `tsconfig.json`
- All colors come from `@nebula-docs/theme` tokens, no hardcoded hex
- Use commas instead of em dashes (—) in code comments and any user-visible copy

## Mock data approach

Phase 5 wires real Firestore data via `onSnapshot`. For this work:

- Types in `products/nebula/src/features/dashboard/types.ts`, e.g., `Deployment`, `ActivityEntry`, `PreviewEntry`, `DeploymentLogStep`, `FileChange`, `Actor`
- Fixtures in `products/nebula/src/features/dashboard/mockData.ts`, realistic data matching the screenshots (the bot commit, the human commits, log steps, file lists)
- Components are presentational, consume props, not stores
- A single top-level `<DashboardHomePage>` reads the fixture and passes it down, easy to swap for a Firestore subscription in Phase 5

## Anti-patterns, do not do these

- Do NOT reuse the deleted Nebula scaffolding (MUI starter, `BlockEditor`, `EditableText`, `<CmsPage>` based on contenteditable). That lineage was the failed attempt.
- Do NOT replace `@nebula-docs/theme` with another tokens system, the data is frozen.
- Do NOT introduce MUI, Nebula is Tailwind + shadcn only.
- Do NOT introduce a 4th styling system, Tailwind only inside `products/nebula/`.
- Do NOT use `any` or `as unknown as` to escape types.
- Do NOT use em dashes in copy or comments, use commas.
- Do NOT drop into deep relative imports like `../../components/foo`, use the path alias.
- Do NOT add `index.tsx` files for components.

## Process I want you to follow

1. Read all required files (Step 1)
2. Verify state (Step 2)
3. Post understanding + plan (Step 3), wait for approval
4. Implement in checkpoints, after each of:
   - Header + hero card
   - Tab toggle + section heading
   - Activity table (Live tab)
   - Previews table + expanded row
   Run `pnpm --filter @nebula-docs/platform typecheck`, `pnpm --filter @nebula-docs/platform build`, and post a screenshot from `pnpm dev` (or describe the rendered state) before moving on.
5. Visual fidelity pass at the end, side-by-side mental compare against both screenshots, list any deltas you couldn't match and why.

## Definition of done

- Both tab states render at the target route with mock data
- Visual match against screenshots is tight, deltas are documented
- `pnpm --filter @nebula-docs/platform typecheck` passes
- `pnpm --filter @nebula-docs/platform build` passes
- Every component follows `Folder/Folder.tsx` + `Folder/index.ts`
- No `any`, no inline hex colors, no em dashes
- Mock data is isolated to one fixtures file, easy to swap for real Phase 5 wiring
- All shadcn primitives added are listed in your final summary

## Open questions, raise these in Step 3

1. **Route**, `/` (single default repo) or `/repo/{owner}/{repo}` (per the file-browser plan in `.claude/nebula.md` Phase 2)? My current thinking is `/` for now, with the dashboard reading the active repo from a Firestore connection record (per Phase 1), confirm.
2. **Multi-repo listing**, this design is for a single deployment. If a user has multiple repos connected, we'll need a switcher/list. Out of scope for this task or stub it now?
3. **Nebula bot mark**, do you have an SVG asset, or should I create one inline matching the screenshot's orbit/satellite glyph?
4. **Browser-frame thumbnail**, static placeholder image now, real screenshot service later? If yes to placeholder, I'll generate one from the actual docs site URL via a screenshot tool, or use a generic asset.
5. **Live tab row expansion**, the screenshots only show Previews tab expanded. Stub the Live expansion or design something simple (commit diff summary)?

---

## Reference, layout and element notes

Layout and element identification only, do not prescribe colors, surfaces, or typography, use the tokens already in the Nebula app.

- Pills are rounded-full
- Tab toggle is a rounded-full segmented container with the active option filled
- Row dividers are subtle, low-emphasis
- External-link arrows on URLs use the `↗` glyph or lucide `ArrowUpRight`
- Branch pill uses lucide `GitBranch`
- GitHub repo link uses an octicon-style mark or lucide `Github`
- Domain URL renders in monospace
