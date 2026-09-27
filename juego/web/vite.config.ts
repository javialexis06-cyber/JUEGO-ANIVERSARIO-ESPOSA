import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// base relativa: el juego funciona servido desde cualquier carpeta (también como Artifact)
export default defineConfig({
  base: './',
  // Dos páginas: la casa (index.html, el juego principal) y el súper (super.html, el minijuego)
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000,
    modulePreload: { polyfill: false },
    rollupOptions: { input: { casa: resolve(__dirname, 'index.html'), super: resolve(__dirname, 'super.html') } },
  },
  server: { host: true },
});
