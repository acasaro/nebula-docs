import { resolve } from 'node:path';
import { CLI_ROOT } from '../paths.mjs';
import { prepareAstroEnv } from '../prepareAstro.mjs';

export async function runBuild({ tenant, flags }) {
  await prepareAstroEnv({ tenant });
  const { build } = await import('astro');

  if (flags.base) {
    process.env.NEBULA_BASE = String(flags.base);
  }

  const outDir = resolve(tenant, 'dist');
  process.env.NEBULA_OUT_DIR = outDir;

  process.stdout.write(`nebula build: ${tenant} -> ${outDir}\n`);
  await build({ root: CLI_ROOT });
}
