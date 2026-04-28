import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const here = path.dirname(fileURLToPath(import.meta.url));

// Allow `PORT=…` to override the dev/preview port so two concurrent Claude
// Code sessions can each run their own server (one on 8081, one on 8082) by
// invoking different named configs in `.claude/launch.json`. Default stays
// 8081 so anything launching directly with `pnpm dev` is unchanged.
const port = Number(process.env.PORT) || 8081;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(here, './src'),
    },
  },
  envDir: path.resolve(here, '../..'),
  envPrefix: ['FIREBASE_', 'NEBULA_', 'FIRESTORE_'],
  server: {
    port,
    strictPort: true,
  },
  preview: {
    port,
    strictPort: true,
  },
});
