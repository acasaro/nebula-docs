/**
 * spa-fallback.mjs
 *
 * OOSS / S3 serves objects by exact key — there's no "error document" rewrite
 * when requests hit the REST endpoint (only the website-hosting endpoint
 * supports that, and OOSS routes through the REST endpoint).
 *
 * For an SPA with client-side routing we need every known route to resolve to
 * index.html. This script copies dist/index.html into each route as
 * dist/<route>/index.html. S3 serves index.html when the request path ends
 * with a trailing slash, and the .html extension ensures the correct
 * Content-Type: text/html header.
 *
 * IMPORTANT: External redirects that carry query strings (e.g. the GitHub App
 * callback) MUST use a trailing slash in the configured URL so S3 serves the
 * directory index directly without a 302 redirect that strips query params.
 * Example: https://example.com/install/callback/?installation_id=123
 *
 * Dynamic routes (editor/:branch/~/*) can't be enumerated — users reach those
 * by navigating from within the app, so the SPA is already loaded.
 */

import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const DIST = new URL('../dist', import.meta.url).pathname;
const SRC = join(DIST, 'index.html');

// Every static route defined in App.tsx that a user or external redirect
// (e.g. GitHub App callback) might hit as a fresh page load.
const routes = [
  'sign-in',
  'settings/github-app',
  'settings/github',
  'settings/git',
  'install/callback',
  'dev/icons',
];

for (const route of routes) {
  const target = join(DIST, route, 'index.html');
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(SRC, target);
}

// Also copy a top-level 404.html for hosts that support it.
copyFileSync(SRC, join(DIST, '404.html'));

console.log(`✓ spa-fallback: copied index.html to ${routes.length} route paths + 404.html`);
