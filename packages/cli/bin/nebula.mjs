#!/usr/bin/env node
// Nebula Docs CLI entry. Binary is `nebula` — the only place "Nebula Docs"
// is shortened (every other identifier in the system uses the full brand:
// `@nebula-docs/cli`, `tenants/nebula-docs-starter*`, etc.).
//
// Thin dispatcher — resolves the tenant directory, sets NEBULA_TENANT_ROOT,
// and hands off to the subcommand implementations in src/cli/index.mjs.
//
// In the monorepo this is invoked via `tsx ./bin/nebula.mjs` (see scripts
// in package.json) so workspace TS deps load without a build step. The
// `tsx` CLI is required, not `node --import tsx` — the latter doesn't
// resolve directory imports in workspace barrel files (e.g. theme exporting
// `from './themes'`), which the CLI form handles natively.
// Phase 6 will ship a bundled JS build for the published npm package.
import { run } from '../src/cli/index.mjs';

run(process.argv.slice(2)).catch((err) => {
  process.stderr.write(`\nnebula: ${err.message ?? err}\n`);
  if (process.env.NEBULA_DEBUG) {
    process.stderr.write(`${err.stack ?? ''}\n`);
  }
  process.exit(1);
});
