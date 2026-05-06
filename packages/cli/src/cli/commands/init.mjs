export async function runInit({ target }) {
  process.stderr.write(
    `nebula-docs init: not implemented yet (Phase 0 stub).\n` +
      `\n` +
      `Planned behavior: scaffold a tenant repo at ${target ?? '<cwd>'} with\n` +
      `  - docs.json (subset of the published schema)\n` +
      `  - theme.json (extends "mcoe-default", empty tokens)\n` +
      `  - content/index.mdx + content/snippets/\n` +
      `  - .github/workflows/deploy.yml (uhg-runner)\n` +
      `  - package.json with @nebula-docs/cli pinned as a dev dep\n` +
      `\n` +
      `For now, copy tenants/example-docs/ as a starting point.\n`,
  );
  process.exit(1);
}
