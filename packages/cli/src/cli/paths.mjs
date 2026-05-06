import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

/** Absolute path of `packages/cli/` — the Astro project root. */
export const CLI_ROOT = resolve(here, '..', '..');
