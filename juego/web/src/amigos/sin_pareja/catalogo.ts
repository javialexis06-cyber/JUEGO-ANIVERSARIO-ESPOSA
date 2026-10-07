// Versión para amigos: reemplaza a `src/casa/catalogo.ts` (la tienda de la casa) al compilar con
// `vite build --mode amigos`. Solo trae, sin nombres, las prendas con que se visten los disfraces de «Lavarse la
// cara» (las saca `scripts/prendas-amigos.mjs` del clóset a `src/salas/prendas.json`).
import PRENDAS from '../../salas/prendas.json';
import type { Item } from '../../casa/catalogo';

export const ITEM: Record<string, Item> = Object.fromEntries(
  Object.entries(PRENDAS.items as Record<string, Omit<Item, 'id' | 'nombre' | 'tipo' | 'precio'>>).map(([id, it]) => [
    id, { id, nombre: '', tipo: 'ropa', precio: 0, ...it } as Item,
  ]),
);
