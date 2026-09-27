// Progreso guardado en el navegador (partida en solitario de la tiendita).
import type { TiendaDato } from './tienda';

export interface Partida {
  dinero: number;
  sitios: Record<number, number>;
  estrellas: Record<number, boolean[]>;
  /** Nivel de cada mejora comprada (zapatos, carrito, bodega, cajera…). El carrito empieza en 1. */
  mejoras: Record<string, number>;
  /** Ayudas de un solo uso que se tienen guardadas (tinto, canción, limpieza). */
  ayudas: Record<string, number>;
  corazones: Record<number, boolean>;
  lunas: Record<number, boolean>;
}

const CLAVE = 'supermania-jugable1';

export function nueva(t: TiendaDato): Partida {
  const sitios: Record<number, number> = {};
  for (const s of t.sitios) sitios[s.id] = s.inicio ? 1 : 0;
  return { dinero: 0, sitios, estrellas: {}, mejoras: { carrito: 1 }, ayudas: {}, corazones: {}, lunas: {} };
}

export function cargar(t: TiendaDato): Partida {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (raw) {
      const p = JSON.parse(raw) as Partida & { carrito?: number };
      for (const s of t.sitios) if (p.sitios[s.id] === undefined) p.sitios[s.id] = s.inicio ? 1 : 0;
      // Partidas de la primera versión: el carrito estaba suelto
      p.mejoras ??= { carrito: p.carrito ?? 1 };
      p.mejoras.carrito ??= 1;
      p.ayudas ??= {};
      p.corazones ??= {};
      p.lunas ??= {};
      delete p.carrito;
      return p;
    }
  } catch {
    /* sin almacenamiento disponible: partida nueva */
  }
  return nueva(t);
}

export function guardar(p: Partida) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(p));
  } catch {
    /* navegador sin almacenamiento: se juega igual, sin guardar */
  }
}

export function borrar() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* nada que borrar */
  }
}

export const totalEstrellas = (p: Partida) => Object.values(p.estrellas).reduce((a, e) => a + e.filter(Boolean).length, 0);
export const cuenta = (r: Record<number, boolean>) => Object.values(r).filter(Boolean).length;
