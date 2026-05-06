import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { localTenantPlugin } from './vite-plugin-local-tenant';

const here = path.dirname(fileURLToPath(import.meta.url));

// Allow `PORT=…` to override the dev/preview port so two concurrent Claude
// Code sessions can each run their own server (one on 8081, one on 8082) by
// invoking different named configs in `.claude/launch.json`. Default stays
// 8081 so anything launching directly with `pnpm dev` is unchanged.
const port = Number(process.env.PORT) || 8081;

const envDir = path.resolve(here, '../..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, ['NEBULA_']);
  const isLocalBackend = env.NEBULA_BACKEND === 'local';
  const tenant = env.NEBULA_LOCAL_TENANT?.trim() || 'nebula-docs-starter';

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(isLocalBackend
        ? [
            localTenantPlugin({
              tenantsRoot: path.resolve(here, '../../tenants'),
              tenant,
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(here, './src'),
      },
    },
    envDir,
    envPrefix: ['FIREBASE_', 'NEBULA_', 'FIRESTORE_'],
    server: {
      port,
      strictPort: true,
    },
    preview: {
      port,
      strictPort: true,
    },
  };
});
