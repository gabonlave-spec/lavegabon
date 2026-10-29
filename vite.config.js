import { defineConfig } from 'vite';

// base './' : fonctionne sur Cloudflare Pages (racine) comme en sous-dossier.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', sourcemap: false }
});
