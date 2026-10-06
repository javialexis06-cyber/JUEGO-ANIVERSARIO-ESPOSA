// Progreso guardado en el navegador (partida en solitario de la tiendita).
import { FICHAS } from './balance';
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
  /** Estrellas ya gastadas en mejoras (las ganadas salen de las estrellas y lunas conseguidas). */
  gastadas: number;
}

import { modoAmigo } from './neutro';

/** La partida de Javier y Laura; la de un amigo va aparte en su aparato (nunca se mezclan). */
const CLAVE_PAREJA = 'supermania-jugable1';
const CLAVE_AMIGO = 'amigo-supermania';
const clave = () => (modoAmigo() ? CLAVE_AMIGO : CLAVE_PAREJA);

export function nueva(t: TiendaDato): Partida {
  const sitios: Record<number, number> = {};
  for (const s of t.sitios) sitios[s.id] = s.inicio ? 1 : 0;
  return { dinero: 0, sitios, estrellas: {}, mejoras: { carrito: 1 }, ayudas: {}, corazones: {}, lunas: {}, gastadas: 0 };
}

const esObjeto = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const entero = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : d);
function numeros(o: unknown): Record<string, number> {
  const r: Record<string, number> = {};
  if (esObjeto(o)) for (const [k, v] of Object.entries(o)) if (typeof v === 'number' && Number.isFinite(v)) r[k] = Math.max(0, Math.floor(v));
  return r;
}
function banderas(o: unknown): Record<number, boolean> {
  const r: Record<number, boolean> = {};
  if (esObjeto(o)) for (const [k, v] of Object.entries(o)) if (v === true) r[Number(k)] = true;
  return r;
}

/** Partida guardada confiable: si algo viene dañado (otra versión, datos a medias) se arregla en vez de romper el menú. */
export function normalizar(raw: unknown, t: TiendaDato): Partida {
  const base = nueva(t);
  if (!esObjeto(raw)) return base;
  const p: Partida = {
    dinero: entero(raw.dinero),
    sitios: { ...base.sitios, ...numeros(raw.sitios) },
    estrellas: {},
    mejoras: numeros(raw.mejoras),
    ayudas: numeros(raw.ayudas),
    corazones: banderas(raw.corazones),
    lunas: banderas(raw.lunas),
    gastadas: entero(raw.gastadas),
  };
  // Partidas de la primera versión: el carrito estaba suelto
  if (!esObjeto(raw.mejoras)) p.mejoras = { carrito: entero(raw.carrito, 1) || 1 };
  p.mejoras.carrito = Math.max(1, p.mejoras.carrito ?? 1);
  for (const s of t.sitios) p.sitios[s.id] = Math.min(p.sitios[s.id] ?? 0, t.tope ?? 2);
  if (esObjeto(raw.estrellas)) {
    for (const [k, v] of Object.entries(raw.estrellas)) {
      if (Array.isArray(v)) p.estrellas[Number(k)] = [0, 1, 2].map((i) => v[i] === true);
    }
  }
  return p;
}

export function cargar(t: TiendaDato): Partida {
  try {
    const raw = localStorage.getItem(clave());
    if (raw) return normalizar(JSON.parse(raw), t);
  } catch {
    /* sin almacenamiento o datos ilegibles: partida nueva */
  }
  return nueva(t);
}

export function guardar(p: Partida) {
  try {
    localStorage.setItem(clave(), JSON.stringify(p));
  } catch {
    /* navegador sin almacenamiento: se juega igual, sin guardar */
  }
}

export function borrar() {
  try {
    localStorage.removeItem(clave());
  } catch {
    /* nada que borrar */
  }
}

export const totalEstrellas = (p: Partida) => Object.values(p.estrellas).reduce((a, e) => a + e.filter(Boolean).length, 0);
export const cuenta = (r: Record<number, boolean>) => Object.values(r).filter(Boolean).length;
/** Estrellas para mejorar: 1 por cada estrella conseguida y 5 por cada luna, menos lo ya gastado. */
export const fichasGanadas = (p: Partida) => totalEstrellas(p) * FICHAS.estrella + cuenta(p.lunas) * FICHAS.luna;
export const fichas = (p: Partida) => Math.max(0, fichasGanadas(p) - p.gastadas);
