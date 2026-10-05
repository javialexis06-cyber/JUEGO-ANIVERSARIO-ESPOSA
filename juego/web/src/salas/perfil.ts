// El perfil de un amigo o una amiga en este aparato: nombre, cuerpo (el muñeco de Javier o el de Laura como base)
// y unos colores de piel, pelo y ropa. Vive solo en el aparato (localStorage) con un id propio: los amigos no tienen
// casa ni entran a la de la pareja. Mientras el perfil esté «activo», index.html manda directo a la sala de juegos
// de amigos (amigos.html) y nunca carga la casa. El creador de personajes completo llega después: estos campos
// son la base y lo que sobre va en `detalles`.
import type { AspectoJugador } from './tipos';

export interface PerfilAmigo {
  id: string;
  nombre: string;
  cuerpo: 'el' | 'ella';
  piel: string;
  pelo: string;
  /** Camiseta (o la prenda de arriba). */
  ropa: string;
  /** Pantalón o short. */
  ropa2: string;
  zapatos: string;
  /** Este aparato es de un amigo: la casa queda cerrada. */
  activo: boolean;
  creado: number;
}

/** La misma clave que lee la guardia de index.html (no cambiarla sin cambiar allá). */
export const CLAVE_AMIGO = 'nuestro-hogar-amigo';
const CLAVE_APARATO = 'salas-aparato';

/** Paletas para escoger (tonos de piel, pelo y ropa del estilo de los muñecos). */
export const PIELES = ['#ffe0c7', '#f6c8a4', '#eab48a', '#d99a6c', '#c27f52', '#a5653d', '#83492a', '#5e3320'];
export const PELOS = ['#121012', '#3b2418', '#6b3f22', '#9a6233', '#c99a5b', '#e8cf8f', '#b5482f', '#d76b9a', '#5a6fd8', '#58b38a', '#e9e4dd', '#7d4bb0'];
export const ROPAS = ['#e85d5d', '#f29b38', '#f2c94c', '#7ccf6b', '#3fb5a3', '#4f8fe0', '#6c5ce7', '#c46bd6', '#f28bb5', '#f4efe6', '#4a4a52', '#1d1d24'];

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

const color = (v: unknown, lista: string[], def: string) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : lista.includes(def) ? def : lista[0]);

/** El perfil guardado (siempre con la forma esperada) o null si este aparato nunca fue de un amigo. */
export function perfilAmigo(): PerfilAmigo | null {
  const p = leer<Partial<PerfilAmigo>>(CLAVE_AMIGO);
  if (!p || typeof p !== 'object') return null;
  const nombre = typeof p.nombre === 'string' ? limpiarNombre(p.nombre) : '';
  return {
    id: typeof p.id === 'string' && /^amigo-[a-z0-9]{6,}$/.test(p.id) ? p.id : `amigo-${aleatorio(10)}`,
    nombre: nombre || 'Amigo',
    cuerpo: p.cuerpo === 'ella' ? 'ella' : 'el',
    piel: color(p.piel, PIELES, PIELES[2]),
    pelo: color(p.pelo, PELOS, PELOS[0]),
    ropa: color(p.ropa, ROPAS, ROPAS[5]),
    ropa2: color(p.ropa2, ROPAS, ROPAS[10]),
    zapatos: color(p.zapatos, ROPAS, ROPAS[9]),
    activo: p.activo !== false,
    creado: typeof p.creado === 'number' ? p.creado : Date.now(),
  };
}

/** Un perfil nuevo (todavía sin guardar) con colores al azar bonitos. */
export function perfilNuevo(cuerpo: 'el' | 'ella' = 'el'): PerfilAmigo {
  const uno = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)];
  return {
    id: `amigo-${aleatorio(10)}`, nombre: '', cuerpo, piel: uno(PIELES.slice(1, 6)), pelo: uno(PELOS.slice(0, 6)), ropa: uno(ROPAS.slice(0, 9)),
    ropa2: uno([ROPAS[10], ROPAS[11], ROPAS[5]]), zapatos: uno([ROPAS[9], ROPAS[11], ROPAS[0]]), activo: true, creado: Date.now(),
  };
}

export function guardarPerfilAmigo(p: PerfilAmigo) {
  escribir(CLAVE_AMIGO, { ...p, nombre: limpiarNombre(p.nombre) || 'Amigo' });
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
  return { cuerpo: p.cuerpo, piel: p.piel, pelo: p.pelo, detalles: { ropa: p.ropa, ropa2: p.ropa2, zapatos: p.zapatos } };
}
