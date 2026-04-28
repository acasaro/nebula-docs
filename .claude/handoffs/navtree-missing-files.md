# NavTree: Flag missing pages from docs.json

## Problem

The Navigation tab in the RepoBrowser reads page entries from `docs.json`
and renders them without cross-referencing the actual repo file tree. If a
page is listed in `docs.json` but the corresponding `.mdx` file has been
deleted from the repo, it still appears in the nav — clicking it 404s.

Example: `accordian.mdx` was deleted from `main` but `docs.json` still
references it, so the Navigation tab still shows it.

## Proposed fix

Cross-reference `docs.json` page entries against `allPaths` (the file tree
from `fetchRepoTree`). For entries whose resolved file path doesn't exist
in the tree:

- **Option A (recommended):** Show the entry dimmed/grayed with a warning
  icon and a tooltip ("File not found in repo"). Clicking it could show an
  inline message instead of a loading spinner → 404 error.
- **Option B:** Filter them out entirely (simpler but hides config drift
  from the editor).

## Key files

- `products/nebula/src/routes/RepoBrowser.tsx` — owns `allPaths` state and
  renders `<NavTree>`
- `products/nebula/src/components/NavTree.tsx` — renders the tree from
  `DocsConfig`
- `products/nebula/src/lib/docsConfig.ts` — `pageEntryToFilePath()` already
  resolves entry → file path; use this for the cross-reference
