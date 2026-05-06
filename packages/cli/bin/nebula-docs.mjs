#!/usr/bin/env node
// Nebula Docs CLI entry. Thin dispatcher — resolves the tenant directory,
// sets NEBULA_TENANT_ROOT, and hands off to the subcommand implementations
// in src/cli/index.mjs.
//
// In the monorepo this is invoked via `node --import tsx ./bin/nebula-docs.mjs`
// (see scripts in package.json) so workspace TS deps load without a build step.
// Phase 6 will ship a bundled JS build for the published npm package.
import { run } from '../src/cli/index.mjs';

run(process.argv.slice(2)).catch((err) => {
  process.stderr.write(`\nnebula-docs: ${err.message ?? err}\n`);
  if (process.env.NEBULA_DEBUG) {
    process.stderr.write(`${err.stack ?? ''}\n`);
  }
  process.exit(1);
});
