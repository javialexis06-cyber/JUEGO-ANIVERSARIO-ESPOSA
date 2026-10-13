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
  SC2: async () => (await import('./cine-acto2')).SC2,
  T03: async () => (await import('./cine-acto2')).T03,
  SC3: async () => (await import('./cine-acto2')).SC3,
  C04: async () => (await import('./cine-acto2')).C04,
  C05: async () => (await import('./cine-acto2')).C05,
  SC4: async () => (await import('./cine-acto2')).SC4,
};
