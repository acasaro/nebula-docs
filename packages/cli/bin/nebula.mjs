#!/usr/bin/env node
// Nebula Docs CLI entry. Binary is `nebula` — the only place "Nebula Docs"
// is shortened (every other identifier in the system uses the full brand:
// `@nebula-docs/cli`, `tenants/nebula-docs-starter*`, etc.).
//
// Thin dispatcher — resolves the tenant directory, sets NEBULA_TENANT_ROOT,
// and hands off to the subcommand implementations in src/cli/index.mjs.
//
// Two invocation paths:
//   1. Published (tenant repo): tenants `pnpm install @nebula-docs/cli` from
//      JFrog, pnpm symlinks `node_modules/.bin/nebula` here, this file runs
//      under plain node via the shebang above. No tsx needed — every file
//      under src/cli/ is plain .mjs; TS files in src/runtime/ are processed
//      by Astro/Vite at tenant build time, not by this dispatcher.
//   2. In-monorepo dev: invoked as `pnpm --filter @nebula-docs/cli dev` which
//      runs `tsx ./bin/nebula.mjs dev` (see scripts in package.json). tsx is
//      used here so workspace TS deps resolve without a build step.
import { run } from '../src/cli/index.mjs';

run(process.argv.slice(2)).catch((err) => {
  process.stderr.write(`\nnebula: ${err.message ?? err}\n`);
  if (process.env.NEBULA_DEBUG) {
    process.stderr.write(`${err.stack ?? ''}\n`);
  }
  process.exit(1);
});
