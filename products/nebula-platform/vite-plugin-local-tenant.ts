import path from 'node:path';
import { promises as fsp } from 'node:fs';
import { createHash } from 'node:crypto';
import type { Plugin, Connect } from 'vite';

/**
 * Dev-only Vite plugin: serves a tenant directory under `tenants/<name>/`
 * through `/api/fs/*` so the editor can read/write MDX without GitHub.
 * Activated when `NEBULA_BACKEND=local`. Skipped (no middleware mounted)
 * for any other value, including production builds — there is no
 * corresponding production endpoint, by design.
 *
 * Endpoints (all JSON, all scoped to the tenant root):
 *   GET  /api/fs/tree              → { paths, truncated, treeSha }
 *   GET  /api/fs/file?path=foo.mdx → { content, sha }
 *   POST /api/fs/commit            → { commitSha }   body: { changes, message }
 */

interface FileChange {
  path: string;
  content?: string;
  delete?: boolean;
}

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  '.docusaurus',
  '.next',
  '.astro',
]);
const SKIP_FILES = new Set(['.DS_Store']);

// Static asset types served from `tenants/<tenant>/public/`. Restricted
// to known media so a stray `.tsx` or `.mdx` in public/ doesn't get
// served as a file (it would short-circuit the SPA fallback and the
// editor route would 404).
const TENANT_PUBLIC_MIME: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.pdf': 'application/pdf',
};

function safeJoin(root: string, rel: string): string {
  const normalized = path.posix.normalize(rel.replace(/^[/\\]+/, ''));
  if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
    throw new Error(`Path escapes tenant root: ${rel}`);
  }
  const abs = path.resolve(root, normalized);
  if (!abs.startsWith(root + path.sep) && abs !== root) {
    throw new Error(`Path escapes tenant root: ${rel}`);
  }
  return abs;
}

async function walk(root: string, rel = ''): Promise<string[]> {
  const here = rel ? path.join(root, rel) : root;
  const entries = await fsp.readdir(here, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const sub = rel ? path.posix.join(rel, entry.name) : entry.name;
      out.push(...(await walk(root, sub)));
    } else if (entry.isFile()) {
      if (SKIP_FILES.has(entry.name)) continue;
      out.push(rel ? path.posix.join(rel, entry.name) : entry.name);
    }
  }
  return out;
}

function sha1(content: string): string {
  return createHash('sha1').update(content, 'utf8').digest('hex');
}

function sendJson(res: Parameters<Connect.SimpleHandleFunction>[1], status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function readBody(req: Parameters<Connect.SimpleHandleFunction>[0]): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return Buffer.concat(chunks).toString('utf8');
}

export interface LocalTenantOptions {
  /** Absolute path to the `tenants/` directory containing tenant folders. */
  tenantsRoot: string;
  /** Tenant folder name (subdirectory of `tenantsRoot`). */
  tenant: string;
}

export function localTenantPlugin(options: LocalTenantOptions): Plugin {
  const tenantRoot = path.resolve(options.tenantsRoot, options.tenant);

  const tenantPublic = path.resolve(tenantRoot, 'public');

  return {
    name: 'nebula:local-tenant',
    apply: 'serve',
    configureServer(server) {
      // Serve tenant `public/*` from the dev origin so MDX page assets
      // and `.tsx` snippets that reference absolute paths like
      // `/images/icons/foo.svg` resolve when rendered live in the editor.
      // The CLI side already does this through Astro's publicDir; this
      // mirrors it for the editor preview. Mounted before `/api/fs` so
      // anything matching a real file short-circuits and never falls
      // through to the SPA HTML fallback.
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();
        const reqUrl = req.url ?? '/';
        if (reqUrl.startsWith('/api/') || reqUrl.startsWith('/@') || reqUrl.startsWith('/src/')) {
          return next();
        }
        const pathname = new URL(reqUrl, 'http://x').pathname;
        if (pathname === '/' || pathname.includes('..')) return next();
        let abs: string;
        try {
          abs = safeJoin(tenantPublic, pathname);
        } catch {
          return next();
        }
        let stat;
        try {
          stat = await fsp.stat(abs);
        } catch {
          return next();
        }
        if (!stat.isFile()) return next();
        const ext = path.extname(abs).toLowerCase();
        const ct = TENANT_PUBLIC_MIME[ext];
        if (!ct) return next();
        res.statusCode = 200;
        res.setHeader('Content-Type', ct);
        res.setHeader('Cache-Control', 'no-cache');
        if (req.method === 'HEAD') {
          res.end();
          return;
        }
        const data = await fsp.readFile(abs);
        res.end(data);
      });

      server.middlewares.use('/api/fs', async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://x');
        try {
          await fsp.access(tenantRoot).catch(() => {
            throw new Error(
              `Local tenant not found at ${tenantRoot}. Set NEBULA_LOCAL_TENANT to a folder under tenants/.`,
            );
          });

          if (req.method === 'GET' && url.pathname === '/tree') {
            const paths = await walk(tenantRoot);
            paths.sort();
            sendJson(res, 200, {
              paths,
              truncated: false,
              treeSha: `local-${Date.now()}`,
            });
            return;
          }

          if (req.method === 'GET' && url.pathname === '/file') {
            const rel = url.searchParams.get('path');
            if (!rel) {
              sendJson(res, 400, { error: 'Missing path' });
              return;
            }
            const abs = safeJoin(tenantRoot, rel);
            const content = await fsp.readFile(abs, 'utf8').catch((err) => {
              if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
              throw err;
            });
            if (content === null) {
              sendJson(res, 404, { error: `Not found: ${rel}` });
              return;
            }
            sendJson(res, 200, { content, sha: sha1(content) });
            return;
          }

          // Resolve a tenant snippet path to a Vite-compiled ES module URL.
          // Used by the editor's MdxSnippet NodeView to live-render `.tsx`
          // snippets that live outside the platform's source tree. The
          // 302 hands off to Vite's `/@fs` handler, which transforms the
          // file on demand and resolves bare imports (`react`) against the
          // platform's module graph.
          if (req.method === 'GET' && url.pathname === '/snippet/module') {
            const rel = url.searchParams.get('path');
            if (!rel) {
              sendJson(res, 400, { error: 'Missing path' });
              return;
            }
            const abs = safeJoin(tenantRoot, rel);
            try {
              await fsp.access(abs);
            } catch {
              sendJson(res, 404, { error: `Not found: ${rel}` });
              return;
            }
            res.statusCode = 302;
            res.setHeader('Location', `/@fs${abs}`);
            res.end();
            return;
          }

          if (req.method === 'POST' && url.pathname === '/commit') {
            const raw = await readBody(req);
            const body = JSON.parse(raw) as {
              changes?: FileChange[];
              message?: string;
            };
            const changes = body.changes ?? [];
            if (!Array.isArray(changes) || changes.length === 0) {
              sendJson(res, 400, { error: 'No changes' });
              return;
            }
            for (const change of changes) {
              const abs = safeJoin(tenantRoot, change.path);
              if (change.delete === true) {
                await fsp.unlink(abs).catch((err) => {
                  if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
                });
              } else {
                if (typeof change.content !== 'string') {
                  throw new Error(`Missing content for upsert: ${change.path}`);
                }
                await fsp.mkdir(path.dirname(abs), { recursive: true });
                await fsp.writeFile(abs, change.content, 'utf8');
              }
            }
            sendJson(res, 200, { commitSha: `local-${Date.now()}` });
            return;
          }

          next();
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          sendJson(res, 500, { error: message });
        }
      });
    },
  };
}
