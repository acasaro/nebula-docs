import { existsSync, statSync } from 'node:fs';
import { resolve, isAbsolute } from 'node:path';

/**
 * Resolve a user-supplied tenant path to an absolute directory containing a
 * `docs.json`. Falls back to the user's original cwd if no path is given.
 * Throws if the directory doesn't look like a tenant.
 *
 * pnpm runs lifecycle scripts from the *package* directory, not the user's
 * shell cwd, so a relative arg like `tenants/example-docs` would otherwise
 * fail to resolve. INIT_CWD (set by both npm and pnpm) preserves the original
 * working directory; we use it for relative-path resolution so that
 * `pnpm --filter @nebula-docs/cli dev tenants/example-docs` works from the
 * monorepo root the way users expect.
 */
export async function resolveTenantRoot(arg) {
  const baseCwd = process.env.INIT_CWD || process.cwd();

  if (!arg) {
    return verify(baseCwd);
  }

  const candidates = isAbsolute(arg)
    ? [arg]
    : [resolve(baseCwd, arg), resolve(process.cwd(), arg)];

  for (const c of candidates) {
    if (existsSync(c) && statSync(c).isDirectory()) {
      return verify(c);
    }
  }

  throw new Error(`tenant path does not exist: ${arg} (looked under ${candidates.join(', ')})`);
}

function verify(abs) {
  const docsJson = resolve(abs, 'docs.json');
  if (!existsSync(docsJson)) {
    throw new Error(
      `tenant path is missing docs.json: ${abs}\n` +
        `expected ${docsJson} — pass a directory containing docs.json or run \`nebula init\`.`,
    );
  }
  return abs;
}
