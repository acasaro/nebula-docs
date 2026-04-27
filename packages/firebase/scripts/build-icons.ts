/**
 * Pulls SVG corpora from the upstream npm packages, runs SVGO over each
 * file, and writes the result to `public/icons/{library}/[{type}/]{name}.svg`
 * with a per-library manifest at `public/manifest/{library}.json`.
 *
 * The output directory is gitignored — it's a deploy artifact, regenerated
 * before each `firebase deploy --only hosting:icons`.
 */
import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { optimize, type Config } from 'svgo';

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = join(HERE, '..');
const NODE_MODULES = join(PACKAGE_ROOT, 'node_modules');
const PUBLIC_DIR = join(PACKAGE_ROOT, 'public');
const ICONS_DIR = join(PUBLIC_DIR, 'icons');
const MANIFEST_DIR = join(PUBLIC_DIR, 'manifest');

interface ManifestFile {
  library: string;
  variants: string[] | null;
  icons: string[];
}

const SVGO_CONFIG: Config = {
  multipass: true,
  plugins: ['preset-default', 'removeDimensions'],
};

function toKebab(name: string): string {
  return name
    .replace(/_/g, '-')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

async function ensureDir(path: string): Promise<void> {
  await fs.mkdir(path, { recursive: true });
}

async function readSvg(path: string): Promise<string> {
  return fs.readFile(path, 'utf8');
}

async function optimizeAndWrite(svg: string, dst: string): Promise<void> {
  const result = optimize(svg, SVGO_CONFIG);
  await fs.writeFile(dst, result.data, 'utf8');
}

async function listSvgs(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.svg'))
    .map((e) => e.name);
}

/* ---------- Lucide ---------- */
async function buildLucide(): Promise<ManifestFile> {
  const src = join(NODE_MODULES, 'lucide-static/icons');
  const dst = join(ICONS_DIR, 'lucide');
  await ensureDir(dst);
  const files = await listSvgs(src);
  const names: string[] = [];
  for (const file of files) {
    const name = file.replace(/\.svg$/, '');
    const kebab = toKebab(name);
    const svg = await readSvg(join(src, file));
    await optimizeAndWrite(svg, join(dst, `${kebab}.svg`));
    names.push(kebab);
  }
  names.sort();
  return { library: 'lucide', variants: null, icons: names };
}

/* ---------- Material Icons (legacy) ---------- *
 * Layout: @material-design-icons/svg/{variant}/{name}.svg
 * Variants: filled / outlined / round / sharp / two-tone
 * We rename `round` → `rounded` for symmetry with Material Symbols. */
async function buildMaterial(): Promise<ManifestFile> {
  const root = join(NODE_MODULES, '@material-design-icons/svg');
  const variantMap: Record<string, string> = {
    filled: 'filled',
    outlined: 'outlined',
    round: 'rounded',
    sharp: 'sharp',
    'two-tone': 'two-tone',
  };
  const dstVariants = Object.values(variantMap);
  const allNames = new Set<string>();
  for (const [srcVariant, dstVariant] of Object.entries(variantMap)) {
    const srcDir = join(root, srcVariant);
    const dstDir = join(ICONS_DIR, 'material', dstVariant);
    await ensureDir(dstDir);
    const files = await listSvgs(srcDir);
    for (const file of files) {
      const name = file.replace(/\.svg$/, '');
      const kebab = toKebab(name);
      const svg = await readSvg(join(srcDir, file));
      await optimizeAndWrite(svg, join(dstDir, `${kebab}.svg`));
      allNames.add(kebab);
    }
  }
  const names = [...allNames].sort();
  return { library: 'material', variants: dstVariants, icons: names };
}

/* ---------- Material Symbols ---------- *
 * Layout: @material-symbols/svg-400/{variant}/{name}.svg
 * Variants: outlined / rounded / sharp */
async function buildMaterialSymbols(): Promise<ManifestFile> {
  const root = join(NODE_MODULES, '@material-symbols/svg-400');
  const variants = ['outlined', 'rounded', 'sharp'];
  const allNames = new Set<string>();
  for (const variant of variants) {
    const srcDir = join(root, variant);
    const dstDir = join(ICONS_DIR, 'material-symbols', variant);
    await ensureDir(dstDir);
    const files = await listSvgs(srcDir);
    for (const file of files) {
      const name = file.replace(/\.svg$/, '');
      const kebab = toKebab(name);
      const svg = await readSvg(join(srcDir, file));
      await optimizeAndWrite(svg, join(dstDir, `${kebab}.svg`));
      allNames.add(kebab);
    }
  }
  const names = [...allNames].sort();
  return { library: 'material-symbols', variants, icons: names };
}

/* ---------- Driver ---------- */
async function writeManifest(manifest: ManifestFile): Promise<void> {
  await ensureDir(MANIFEST_DIR);
  const path = join(MANIFEST_DIR, `${manifest.library}.json`);
  await fs.writeFile(path, JSON.stringify(manifest, null, 2), 'utf8');
}

async function main(): Promise<void> {
  const start = Date.now();
  await fs.rm(ICONS_DIR, { recursive: true, force: true });
  await fs.rm(MANIFEST_DIR, { recursive: true, force: true });

  const builders: Array<[string, () => Promise<ManifestFile>]> = [
    ['lucide', buildLucide],
    ['material', buildMaterial],
    ['material-symbols', buildMaterialSymbols],
  ];

  for (const [label, fn] of builders) {
    const t0 = Date.now();
    process.stdout.write(`Building ${label}… `);
    const manifest = await fn();
    await writeManifest(manifest);
    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`${manifest.icons.length} icons in ${dt}s`);
  }

  const total = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nDone in ${total}s. Output: ${PUBLIC_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
