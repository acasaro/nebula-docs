// Subcommand dispatcher. Phase 0: dev/build/preview/validate/init/upgrade
// signatures present; only dev/build/preview/validate are wired to Astro.
// init/upgrade are stubs that explain their planned behavior.
import { resolveTenantRoot } from './resolveTenant.mjs';
import { runDev } from './commands/dev.mjs';
import { runBuild } from './commands/build.mjs';
import { runPreview } from './commands/preview.mjs';
import { runValidate } from './commands/validate.mjs';
import { runInit } from './commands/init.mjs';
import { runUpgrade } from './commands/upgrade.mjs';

const HELP = `nebula-docs <command> [tenant-path] [options]

Commands:
  dev       [tenant-path]   Start the dev server (default port 4321).
  build     [tenant-path]   Build the static site to <tenant>/dist.
  preview   [tenant-path]   Preview a built site locally.
  validate  [tenant-path]   Validate docs.json + theme.json + frontmatter.
  init      [target-dir]    Scaffold a new tenant repo. (Phase 0 stub.)
  upgrade                   Bump @nebula-docs/cli + run codemods. (Phase 0 stub.)

Options:
  --help, -h                Show this help.
  --port <number>           Dev server port (dev, preview).
  --base <path>             Base URL path passed to Astro (build).

If [tenant-path] is omitted the current working directory is used. Inside this
monorepo \`pnpm --filter @nebula-docs/cli dev tenants/example-docs\` works because
pnpm forwards the tenant arg.`;

export async function run(argv) {
  const [cmd, ...rest] = argv;

  if (!cmd || cmd === '--help' || cmd === '-h' || cmd === 'help') {
    process.stdout.write(`${HELP}\n`);
    return;
  }

  const { positional, flags } = parseArgs(rest);

  switch (cmd) {
    case 'dev': {
      const tenant = await resolveTenantRoot(positional[0]);
      await runDev({ tenant, flags });
      return;
    }
    case 'build': {
      const tenant = await resolveTenantRoot(positional[0]);
      await runBuild({ tenant, flags });
      return;
    }
    case 'preview': {
      const tenant = await resolveTenantRoot(positional[0]);
      await runPreview({ tenant, flags });
      return;
    }
    case 'validate': {
      const tenant = await resolveTenantRoot(positional[0]);
      await runValidate({ tenant, flags });
      return;
    }
    case 'init': {
      await runInit({ target: positional[0], flags });
      return;
    }
    case 'upgrade': {
      await runUpgrade({ flags });
      return;
    }
    default: {
      process.stderr.write(`unknown command: ${cmd}\n\n${HELP}\n`);
      process.exit(1);
    }
  }
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const name = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags[name] = next;
        i++;
      } else {
        flags[name] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}
