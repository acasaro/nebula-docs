export async function runInit({ target, flags }) {
  const variant = flags.empty ? 'empty' : 'full';
  process.stderr.write(
    `nebula init: not implemented yet (Phase 0 stub).\n` +
      `\n` +
      `Planned behavior: scaffold a tenant repo at ${target ?? '<cwd>'} from\n` +
      `the ${variant === 'empty' ? '"empty"' : '"full"'} starter.\n` +
      `\n` +
      `Two starters live in the monorepo and ship in the published package:\n` +
      `  tenants/nebula-docs-starter        — full kitchen-sink (default)\n` +
      `  tenants/nebula-docs-starter-empty  — minimal valid tenant (--empty)\n` +
      `\n` +
      `Both contain: docs.json, theme.json, content/, package.json (with\n` +
      `@nebula-docs/cli pinned as a dev dep), .github/workflows/deploy.yml\n` +
      `(uhg-runner). The full starter additionally exercises every component\n` +
      `block, multiple tabs, nested groups, snippets, and long-form prose so\n` +
      `tenants can copy + modify rather than start from a blank slate.\n` +
      `\n` +
      `For now, copy the desired starter directory directly:\n` +
      `  cp -r tenants/nebula-docs-starter${variant === 'empty' ? '-empty' : ''} <your-target>\n`,
  );
  process.exit(1);
}
