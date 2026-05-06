import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { CLI_ROOT } from '../paths.mjs';
import { prepareAstroEnv } from '../prepareAstro.mjs';

export async function runPreview({ tenant, flags }) {
  await prepareAstroEnv({ tenant });

  const outDir = resolve(tenant, 'dist');
  if (!existsSync(outDir)) {
    throw new Error(`no built output at ${outDir} — run \`nebula build\` first.`);
  }
  process.env.NEBULA_OUT_DIR = outDir;

  const { preview } = await import('astro');
  const port = flags.port ? Number(flags.port) : undefined;

  process.stdout.write(`nebula preview: ${tenant}\n`);
  await preview({
    root: CLI_ROOT,
    server: port ? { port } : undefined,
  });
}
