// Todas las películas de la granja por id (docs/en-obra/pelicula-de-astra.md): se cargan solo cuando se van a ver.
import type { Guion } from './cine-granja';

export const PELICULAS: Record<string, () => Promise<Guion>> = {
  prologo: async () => (await import('./cine-prologo')).PROLOGO,
  C01: async () => (await import('./cine-acto1')).C01,
  C11: async () => (await import('./cine-acto1')).C11,
  SC0: async () => (await import('./cine-acto1')).SC0,
  C02: async () => (await import('./cine-acto1')).C02,
  ELI: async () => (await import('./cine-acto1')).ELIANA,
  SC1: async () => (await import('./cine-acto1')).SC1,
  C03: async () => (await import('./cine-acto1')).C03,
};
