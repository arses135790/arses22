import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  root: path.join(here, 'renderer'),
  base: './',
  plugins: [react()],
  resolve: { alias: { '@kits/shadcn': path.join(here, 'renderer/ui/index.js') } },
  build: { outDir: 'dist', emptyOutDir: true, target: 'chrome120', sourcemap: false }
});
