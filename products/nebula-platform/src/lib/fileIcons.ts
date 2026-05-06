// Material Icon Theme integration: maps a filename → SVG asset URL.
//
// Bundling strategy:
// - All SVGs in `material-icon-theme/icons/*.svg` are pulled in via
//   `import.meta.glob` with `?url`, so Vite emits each as a hashed asset and
//   the browser only fetches what's referenced.
// - The full manifest from `material-icon-theme/dist/material-icons.json`
//   gives us VS Code's lookup tables (`fileNames`, `fileExtensions`,
//   `languageIds`) so behavior matches VS Code as closely as possible.
import manifest from 'material-icon-theme/dist/material-icons.json';

const ICON_URLS = import.meta.glob<string>(
  '/node_modules/material-icon-theme/icons/*.svg',
  { eager: true, query: '?url', import: 'default' },
);

type Manifest = {
  file: string;
  fileNames: Record<string, string>;
  fileExtensions: Record<string, string>;
  languageIds: Record<string, string>;
};

const m = manifest as unknown as Manifest;

// Common extensions that VS Code resolves via languageId rather than
// fileExtensions (so they aren't in `m.fileExtensions` directly). We extend
// the lookup with a curated set of language fallbacks.
const EXT_LANGUAGE_FALLBACK: Record<string, string> = {
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  yml: 'yaml',
  yaml: 'yaml',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  sh: 'shellscript',
  bash: 'shellscript',
  toml: 'toml',
  graphql: 'graphql',
  gql: 'graphql',
};

function svgUrlFor(iconName: string): string | null {
  const key = `/node_modules/material-icon-theme/icons/${iconName}.svg`;
  return ICON_URLS[key] ?? null;
}

/**
 * Resolve a file path / filename to a Material Icon Theme SVG URL.
 * Falls back to the default file icon when no specific icon matches.
 */
export function fileIconUrl(name: string): string {
  const lower = name.toLowerCase();
  const base = lower.split('/').pop() ?? lower;

  // 1. Exact filename match (e.g. "package.json", ".gitignore", "Dockerfile")
  const byName = m.fileNames[base];
  if (byName) {
    const url = svgUrlFor(byName);
    if (url) return url;
  }

  // 2. Extension lookup
  const dot = base.lastIndexOf('.');
  if (dot > 0) {
    const ext = base.slice(dot + 1);
    const byExt = m.fileExtensions[ext];
    if (byExt) {
      const url = svgUrlFor(byExt);
      if (url) return url;
    }
    // 3. Language-id fallback for common extensions
    const lang = EXT_LANGUAGE_FALLBACK[ext];
    if (lang) {
      const byLang = m.languageIds[lang];
      if (byLang) {
        const url = svgUrlFor(byLang);
        if (url) return url;
      }
    }
  }

  // 4. Default file icon
  const defaultUrl = svgUrlFor(m.file);
  if (defaultUrl) return defaultUrl;
  // Final hard fallback — should never happen if the package is installed.
  return '';
}
