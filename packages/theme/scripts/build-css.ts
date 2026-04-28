#!/usr/bin/env tsx
/**
 * Generate dist/tokens.css from the TS theme + globals.
 *
 * Run via: pnpm --filter @nebula-docs/theme build:css
 * Output: tokens.css containing :root + [data-theme="dark"] blocks.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mcoeDefaultTokens } from '../src/themes/mcoeDefault';
import { globalTokens } from '../src/globals';
import { generateTokensCss } from '../src/cssGen';

const __dirname = dirname(fileURLToPath(import.meta.url));
const target = process.argv[2];
if (!target) {
  console.error('Usage: tsx scripts/build-css.ts <output-path>');
  process.exit(1);
}

const outPath = resolve(__dirname, '..', target);
mkdirSync(dirname(outPath), { recursive: true });

const css = generateTokensCss(mcoeDefaultTokens, globalTokens);
writeFileSync(outPath, css, 'utf8');
console.log(`✓ wrote ${outPath} (${css.length} bytes)`);
