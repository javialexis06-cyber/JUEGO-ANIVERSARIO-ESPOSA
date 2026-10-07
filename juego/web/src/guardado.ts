// Progreso guardado en el navegador (la partida del súper: el mismo local que va creciendo).
import { FICHAS, PRECIO_COMPRA, PRECIO_MEJORA_VITRINA } from './balance';
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
  /** Tamaño del local que ya se estrenó (1 Tiendita … 4 Hipermercado): al crecer se regala la sección nueva. */
  tamano: number;
  /** 2: el local que crece (antes la Tiendita tenía 3 estantes, 2 neveras de bebidas y una isla de dos caras). */
  version: number;
}

/** Sitios de la Tiendita vieja que ya no existen (tercer estante, segunda nevera de bebidas e isla de dos caras). */
const SITIOS_VIEJOS: Record<number, string> = { 3: 'abarrotes', 8: 'bebidas', 10: 'abarrotes', 11: 'abarrotes' };

import { modoAmigo } from './neutro';

/** La partida de Javier y Laura; la de un amigo va aparte en su aparato (nunca se mezclan). */
const CLAVE_PAREJA = 'supermania-jugable1';
const CLAVE_AMIGO = 'amigo-supermania';
const clave = () => (modoAmigo() ? CLAVE_AMIGO : CLAVE_PAREJA);

/** `t`: el local en su tamaño más grande (trae todos los sitios); al empezar solo vienen los de la Tiendita. */
export function nueva(t: TiendaDato): Partida {
  const sitios: Record<number, number> = {};
  for (const s of t.sitios) sitios[s.id] = s.inicio && (s.tamano ?? 1) <= 1 ? 1 : 0;
  return { dinero: 0, sitios, estrellas: {}, mejoras: { carrito: 1 }, ayudas: {}, corazones: {}, lunas: {}, gastadas: 0, tamano: 1, version: 2 };
}

/** Al estrenar un tamaño del local llega de regalo su sección nueva (y lo que venga comprado de ese tamaño).
 *  Devuelve los nombres de las secciones regaladas (vacío si no había nada que estrenar). */
export function estrenar(p: Partida, t: TiendaDato, tamano: number): string[] {
  if (tamano <= p.tamano) return [];
  const regalos: string[] = [];
  for (const s of t.sitios) {
    const desde = s.tamano ?? 1;
    if (s.inicio && desde > p.tamano && desde <= tamano && !p.sitios[s.id]) {
      p.sitios[s.id] = 1;
      regalos.push(s.seccion);
    }
  }
  p.tamano = tamano;
  return regalos;
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
    tamano: Math.max(1, Math.min(4, entero(raw.tamano, 1))),
    version: 2,
  };
  // Partidas de antes del local que crece: se devuelve lo pagado por los sitios que ya no existen
  if (entero(raw.version) < 2) {
    for (const [id, seccion] of Object.entries(SITIOS_VIEJOS)) {
      const nivel = p.sitios[Number(id)] ?? 0;
      if (nivel > 0) p.dinero += (PRECIO_COMPRA[seccion] ?? 40) + (nivel - 1) * PRECIO_MEJORA_VITRINA;
    }
  }
  // Partidas de la primera versión: el carrito estaba suelto
  if (!esObjeto(raw.mejoras)) p.mejoras = { carrito: entero(raw.carrito, 1) || 1 };
  p.mejoras.carrito = Math.max(1, p.mejoras.carrito ?? 1);
  // Solo quedan los sitios que existen en el local (al nivel máximo del tamaño más grande)
  const sitios: Record<number, number> = {};
  for (const s of t.sitios) sitios[s.id] = Math.min(p.sitios[s.id] ?? 0, t.tope ?? 3);
  p.sitios = sitios;
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
