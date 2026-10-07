// El perfil de un amigo o una amiga en este aparato: nombre, cuerpo (el muñeco de Javier o el de Laura como molde),
// colores de piel y pelo, y todo lo que armó en el creador de personajes (peinado, ropa con sus colores, zapatos,
// accesorios, ojos, cejas, rubor y joyas, en `traje`, ver `prendas.ts`). Vive solo en el aparato (localStorage) con
// un id propio: los amigos no tienen casa ni entran a la de la pareja. Mientras el perfil esté «activo», index.html
// manda directo a la sala de juegos de amigos (amigos.html) y nunca carga la casa.
import { normalizarDetalles } from './prendas';
import type { AspectoJugador } from './tipos';

export interface PerfilAmigo {
  id: string;
  nombre: string;
  cuerpo: 'el' | 'ella';
  piel: string;
  pelo: string;
  /** Camiseta de fábrica (si no lleva otra prenda arriba). */
  ropa: string;
  /** Pantalón o short de fábrica. */
  ropa2: string;
  /** Tenis de fábrica. */
  zapatos: string;
  /** Lo del creador: prendas por ranura («peinado», «arriba»…), ojos, cejas, rubor, medias, aretes y collar. */
  traje: Record<string, string>;
  /** Este aparato es de un amigo: la casa queda cerrada. */
  activo: boolean;
  creado: number;
}

/** La misma clave que lee la guardia de index.html (no cambiarla sin cambiar allá). */
export const CLAVE_AMIGO = 'nuestro-hogar-amigo';
const CLAVE_APARATO = 'salas-aparato';

/** Tonos de piel: de los clarísimos a los más oscuros, y unos de fantasía para los atrevidos. */
export const PIELES = [
  '#ffeadb', '#ffe0c7', '#fbd3b4', '#f6c8a4', '#f2b38a', '#eab48a', '#e0a37a', '#d99a6c', '#cc8a5c', '#c27f52', '#b07045', '#a5653d',
  '#94572f', '#83492a', '#703d24', '#5e3320', '#4a2819', '#3a1f14',
];
export const PIELES_FANTASIA = ['#b9e3c6', '#a8d4f0', '#d7c2f2', '#f7b6cf', '#bfc4cc', '#9fd37a'];
/** Colores de pelo: naturales y de tinte. */
export const PELOS = [
  '#121012', '#2a1a12', '#3b2418', '#4a2e22', '#6b3f22', '#7a4a2a', '#9a6233', '#b5482f', '#c96a3a', '#c99a5b', '#e3c27a', '#e8cf8f',
  '#f4e4b8', '#e9e4dd', '#9a9aa2', '#d76b9a', '#f29bb8', '#b69ae0', '#7d4bb0', '#5a6fd8', '#5b8fd9', '#58b38a', '#7fd6b9', '#e85d5d',
];
/** Colores de ropa. */
export const ROPAS = [
  '#e85d5d', '#c2354a', '#f29b38', '#f2c94c', '#fff1a8', '#7ccf6b', '#2f8f5b', '#3fb5a3', '#8ec5f0', '#4f8fe0', '#2a4f9e', '#6c5ce7',
  '#c46bd6', '#f28bb5', '#ffd1dc', '#f4efe6', '#d8c3a5', '#9c6b43', '#5b3a29', '#8a8f98', '#4a4a52', '#1d1d24',
];
/** Colores de ojos. */
export const OJOS = ['#17120f', '#3b2418', '#6b3f22', '#8a5a2b', '#b07a2a', '#4f7a3a', '#2f8f5b', '#3d7cc9', '#6fa8dc', '#7d8a96', '#7d4bb0', '#c2354a'];
/** Rubor y labios. */
export const RUBORES = ['#f07a85', '#f59ac0', '#ff9a7a', '#e8456b', '#d2697a', '#c46bd6', '#ffb38a'];

const aleatorio = (n = 10) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => (b % 36).toString(36)).join('');

function leer<T>(k: string): T | null {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}
function escribir(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* sin almacenamiento: dura lo que dure la página */
  }
}

/** Identificador estable de este aparato (para Javier y Laura en las salas). */
export function idAparato(): string {
  let id = leer<string>(CLAVE_APARATO);
  if (typeof id !== 'string' || id.length < 6) {
    id = aleatorio(10);
    escribir(CLAVE_APARATO, id);
  }
  return id;
}

const color = (v: unknown, def: string) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : def);

/** Un perfil con la forma esperada (venga de donde venga). */
export function normalizarPerfil(p: Partial<PerfilAmigo> | null | undefined): PerfilAmigo | null {
  if (!p || typeof p !== 'object') return null;
  const nombre = typeof p.nombre === 'string' ? limpiarNombre(p.nombre) : '';
  const cuerpo = p.cuerpo === 'ella' ? 'ella' : 'el';
  return {
    id: typeof p.id === 'string' && /^amigo-[a-z0-9]{6,}$/.test(p.id) ? p.id : `amigo-${aleatorio(10)}`,
    nombre: nombre || 'Amigo',
    cuerpo,
    piel: color(p.piel, PIELES[5]),
    pelo: color(p.pelo, PELOS[0]),
    ropa: color(p.ropa, ROPAS[9]),
    ropa2: color(p.ropa2, ROPAS[20]),
    zapatos: color(p.zapatos, ROPAS[15]),
    traje: normalizarDetalles(p.traje, cuerpo),
    activo: p.activo !== false,
    creado: typeof p.creado === 'number' ? p.creado : Date.now(),
  };
}

/** El perfil guardado (siempre con la forma esperada) o null si este aparato nunca fue de un amigo. */
export function perfilAmigo(): PerfilAmigo | null {
  return normalizarPerfil(leer<Partial<PerfilAmigo>>(CLAVE_AMIGO));
}

const uno = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)];

/** Un perfil nuevo (todavía sin guardar) con colores al azar bonitos y la ropa de fábrica. */
export function perfilNuevo(cuerpo: 'el' | 'ella' = 'el'): PerfilAmigo {
  return {
    id: `amigo-${aleatorio(10)}`, nombre: '', cuerpo, piel: uno(PIELES.slice(2, 14)), pelo: uno(PELOS.slice(0, 9)), ropa: uno(ROPAS.slice(0, 14)),
    ropa2: uno([ROPAS[10], ROPAS[20], ROPAS[21], ROPAS[16]]), zapatos: uno([ROPAS[15], ROPAS[21], ROPAS[0]]), traje: {}, activo: true, creado: Date.now(),
  };
}

export function guardarPerfilAmigo(p: PerfilAmigo) {
  escribir(CLAVE_AMIGO, { ...p, nombre: limpiarNombre(p.nombre) || 'Amigo', traje: normalizarDetalles(p.traje, p.cuerpo) });
}

/** ¿Este aparato está en modo amigo? (la casa no se abre). */
export function esModoAmigo(): boolean {
  return !!perfilAmigo()?.activo;
}

/** Javier o Laura se equivocaron de botón: el aparato vuelve a la pantalla de inicio (el perfil queda guardado). */
export function dejarModoAmigo() {
  const p = perfilAmigo();
  if (p) escribir(CLAVE_AMIGO, { ...p, activo: false });
}

/** Nombres cortos, sin etiquetas ni saltos (se pintan en HTML y en 3D). */
export function limpiarNombre(s: string): string {
  return s.replace(/[<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
}

/** Cómo se ve el muñeco del amigo en las salas y en los juegos. */
export function aspectoDe(p: PerfilAmigo): AspectoJugador {
  return { cuerpo: p.cuerpo, piel: p.piel, pelo: p.pelo, detalles: { ropa: p.ropa, ropa2: p.ropa2, zapatos: p.zapatos, ...p.traje } };
}
