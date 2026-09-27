import { defineConfig } from 'vite';

// base relativa: el juego funciona servido desde cualquier carpeta (también como Artifact)
export default defineConfig({
  base: './',
  build: { outDir: 'dist', assetsInlineLimit: 0, chunkSizeWarningLimit: 2000, modulePreload: { polyfill: false } },
  server: { host: true },
});
