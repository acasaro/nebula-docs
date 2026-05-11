#!/usr/bin/env node
// scripts/release.mjs
//
// Bump the six publishable @nebula-docs/* package versions in lockstep and
// rewrite their internal `workspace:*` references to literal versions, so a
// CI workflow (or a developer running this locally) can `pnpm publish` each
// package against JFrog with self-consistent metadata.
//
// Modes:
//   node scripts/release.mjs <version>           Local: writes files, runs
//                                                pnpm install, commits, tags.
//   node scripts/release.mjs <version> --ci      CI: writes files only.
//                                                Leaves working tree dirty
//                                                for the workflow's followup
//                                                lockfile refresh + publish.
//   node scripts/release.mjs <version> --dry     Print intended writes; no
//                                                file changes. Implies --ci
//                                                semantics (no install/commit).
//
// Source of truth for which packages get bumped is the PUBLISHABLE constant
// below. Keep that list in sync with .github/workflows/publish-cli.yml's
// publish loop.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const PUBLISHABLE = [
  'packages/schemas',
  'packages/theme',
  'packages/mdx',
  'packages/components',
  'packages/analytics',
  'packages/cli',
];

const PUBLISHABLE_NAMES = new Set([
  '@nebula-docs/schemas',
  '@nebula-docs/theme',
  '@nebula-docs/mdx',
  '@nebula-docs/components',
  '@nebula-docs/analytics',
  '@nebula-docs/cli',
]);

const SEMVER_RE = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/;

function parseArgs(argv) {
  const positional = [];
  const flags = new Set();
  for (const arg of argv) {
    if (arg.startsWith('--')) flags.add(arg.slice(2));
    else positional.push(arg);
  }
  return { positional, flags };
}

function usage(msg) {
  if (msg) process.stderr.write(`release.mjs: ${msg}\n`);
  process.stderr.write(
    'Usage: node scripts/release.mjs <version> [--ci|--dry]\n' +
      '  <version>  Semver to write into all six publishable packages.\n' +
      '  --ci       Skip git checks, install, commit, and tag.\n' +
      '  --dry      Print intended writes; touch nothing.\n',
  );
  process.exit(1);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, obj) {
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function rewriteDeps(deps, version) {
  if (!deps) return false;
  let changed = false;
  for (const name of Object.keys(deps)) {
    if (PUBLISHABLE_NAMES.has(name) && deps[name] === 'workspace:*') {
      deps[name] = version;
      changed = true;
    }
  }
  return changed;
}

function bumpPackage(relPath, version, { dry }) {
  const pkgPath = join(ROOT, relPath, 'package.json');
  const pkg = readJson(pkgPath);
  const before = JSON.stringify(pkg);

  pkg.version = version;
  rewriteDeps(pkg.dependencies, version);
  rewriteDeps(pkg.devDependencies, version);
  rewriteDeps(pkg.peerDependencies, version);

  const after = JSON.stringify(pkg);
  const changed = before !== after;

  if (dry) {
    if (changed) {
      process.stdout.write(`would update ${relPath}/package.json → ${version}\n`);
    } else {
      process.stdout.write(`unchanged       ${relPath}/package.json\n`);
    }
    return;
  }

  if (changed) {
    writeJson(pkgPath, pkg);
    process.stdout.write(`✓ ${relPath}/package.json → ${version}\n`);
  } else {
    process.stdout.write(`= ${relPath}/package.json (already ${version})\n`);
  }
}

function exec(cmd) {
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

function workingTreeClean() {
  const out = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8' });
  return out.trim().length === 0;
}

function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const version = positional[0];
  if (!version) usage('missing <version>');
  if (!SEMVER_RE.test(version)) usage(`invalid semver: ${version}`);

  const dry = flags.has('dry');
  const ci = flags.has('ci');

  if (!dry && !ci) {
    if (!workingTreeClean()) usage('working tree not clean (commit or stash first, or pass --ci)');
  }

  for (const pkg of PUBLISHABLE) bumpPackage(pkg, version, { dry });

  if (dry) {
    process.stdout.write(`\n(dry run — no files changed)\n`);
    return;
  }

  if (ci) {
    process.stdout.write(`\nCI mode — leaving working tree dirty for the workflow.\n`);
    return;
  }

  process.stdout.write(`\nRefreshing pnpm-lock.yaml...\n`);
  exec('pnpm install --lockfile-only');

  process.stdout.write(`\nCommitting + tagging v${version}...\n`);
  exec('git add -A');
  exec(`git commit -m "release: v${version}"`);
  exec(`git tag v${version}`);

  process.stdout.write(`\nDone. Push with: git push --follow-tags\n`);
}

main();
