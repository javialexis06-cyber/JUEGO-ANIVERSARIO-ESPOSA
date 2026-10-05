import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// base relativa: el juego funciona servido desde cualquier carpeta (también como Artifact)
export default defineConfig({
  base: './',
  // Las páginas: la casa (index.html, el juego principal), los minijuegos y la sala de juegos de amigos con los juegos
  // que se abren sin la casa (retrete.html, cocina.html)
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000,
    modulePreload: { polyfill: false },
    rollupOptions: { input: { casa: resolve(__dirname, 'index.html'), super: resolve(__dirname, 'super.html'), puertas: resolve(__dirname, 'puertas.html'), mesa: resolve(__dirname, 'mesa.html'), amigos: resolve(__dirname, 'amigos.html'), sangre: resolve(__dirname, 'sangre.html'), retrete: resolve(__dirname, 'retrete.html'), cocina: resolve(__dirname, 'cocina.html') } },
  },
  server: { host: true },
});
