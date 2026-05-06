import { CLI_ROOT } from '../paths.mjs';
import { prepareAstroEnv } from '../prepareAstro.mjs';

export async function runDev({ tenant, flags }) {
  await prepareAstroEnv({ tenant });
  // Defer the import so prepareAstroEnv can write the generated tokens.css
  // before Vite scans for stylesheets.
  const { dev } = await import('astro');
  const port = flags.port ? Number(flags.port) : undefined;

  process.stdout.write(`nebula dev: ${tenant}\n`);
  await dev({
    root: CLI_ROOT,
    server: port ? { port } : undefined,
    logLevel: flags.verbose ? 'info' : 'info',
  });
}
