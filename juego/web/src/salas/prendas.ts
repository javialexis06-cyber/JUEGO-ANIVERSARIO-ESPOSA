// El clóset genérico de los amigos (sin three.js: lo pueden leer el perfil, las salas y la carita SVG): los modelos
// de `prendas.json` (los arma `scripts/prendas-amigos.mjs` desde el clóset de la casa, solo con lo genérico), cómo
// se escribe lo que lleva puesto un amigo en `AspectoJugador.detalles` y las joyas que se pueden poner. Quien viste
// el muñeco en 3D es `vestir.ts`.
//
// Cómo viaja el aspecto (AspectoJugador.detalles, cortico porque va por la red a las salas):
//   ropa, ropa2, zapatos  → colores de la camiseta, el pantalón y los tenis de fábrica (lo de antes)
//   peinado, cabeza, cara, arriba, abajo, pies, espalda, cola → «modelo[#color1[#color2]]» (p. ej. «gorra#e85d5d#ffffff»)
//   ojos, cejas, rubor, medias → «#rrggbb» (cejas, rubor y medias también «no»)
//   aretes, collar → «tipo[#rrggbb]» (ARETES y COLLARES)
import PRENDAS from './prendas.json';
import type { AspectoJugador } from './tipos';

export type Cuerpo = 'el' | 'ella';
export type RanuraAmigo = 'pelo' | 'cabeza' | 'cara' | 'arriba' | 'abajo' | 'pies' | 'espalda' | 'cola';
export const RANURAS_AMIGO: RanuraAmigo[] = ['pelo', 'cabeza', 'cara', 'arriba', 'abajo', 'pies', 'espalda', 'cola'];
/** La clave de cada ranura en `detalles` (el pelo se llama «peinado»: `pelo` ya es el color del pelo). */
export const CLAVE: Record<RanuraAmigo, string> = {
  pelo: 'peinado', cabeza: 'cabeza', cara: 'cara', arriba: 'arriba', abajo: 'abajo', pies: 'pies', espalda: 'espalda', cola: 'cola',
};

/** Un modelo del clóset genérico (ver scripts/prendas-amigos.mjs). */
export interface ModeloPrenda {
  /** Modelo: public/modelos/ropa/<m>_<cuerpo>.glb */
  m: string;
  /** Nombre para mostrar. */
  n: string;
  r: RanuraAmigo;
  /** Grupo dentro de la categoría (camisetas, abrigos, vestidos…). */
  g: string;
  para: Cuerpo[];
  /** Otras ranuras que ocupa (un vestido: arriba y abajo). */
  t?: RanuraAmigo[];
  /** Partes de fábrica que tapa además («copete», «medias»). */
  o?: string[];
  /** Papeles de los materiales que se pueden pintar (el primero es el principal). */
  pp?: string[];
  /** Colores de muestra (las variantes del clóset). */
  mu?: [string | null, string | null][];
  /** Familia de forma para la carita SVG. */
  f?: string;
  /** Ícono: modelos/iconos/ropa_<i>_<cuerpo>.webp */
  i: string;
}

interface DatosPrendas {
  modelos: ModeloPrenda[];
  items: Record<string, { modelo: string; ranura: RanuraAmigo; para: Cuerpo[]; tambien?: RanuraAmigo[]; oculta?: string[]; colores?: Record<string, string> }>;
}
const DATOS = PRENDAS as unknown as DatosPrendas;
export const MODELOS: ModeloPrenda[] = DATOS.modelos;
export const MODELO: Record<string, ModeloPrenda> = Object.fromEntries(MODELOS.map((m) => [m.m, m]));

/** Una prenda lista para ponerse. */
export interface Pieza {
  modelo: string;
  ranura: RanuraAmigo;
  tambien: RanuraAmigo[];
  oculta: string[];
  /** Color por papel del material («principal», «visera»…). */
  colores: Record<string, string>;
}

const HEX = /^#[0-9a-f]{6}$/i;
export const esColor = (v: unknown): v is string => typeof v === 'string' && HEX.test(v);

/** «modelo#c1#c2» → la prenda (null si el modelo no existe, no es de esa ranura o no le sirve a ese cuerpo). */
export function piezaDe(valor: string | undefined, ranura: RanuraAmigo, cuerpo: Cuerpo): Pieza | null {
  if (!valor) return null;
  const [m, c1, c2] = valor.split('#');
  const d = MODELO[m];
  if (!d || d.r !== ranura || !d.para.includes(cuerpo)) return null;
  const colores: Record<string, string> = {};
  const pp = d.pp ?? [];
  if (pp[0] && c1 && HEX.test(`#${c1}`)) colores[pp[0]] = `#${c1}`;
  if (pp[1] && c2 && HEX.test(`#${c2}`)) colores[pp[1]] = `#${c2}`;
  return { modelo: m, ranura, tambien: d.t ?? [], oculta: d.o ?? [], colores };
}

/** La prenda de un ítem del clóset (los de los disfraces del lavado; sin nombres, en prendas.json). */
export function piezaDeItem(id: string, cuerpo: Cuerpo): Pieza | null {
  const it = DATOS.items[id];
  if (!it || !it.para.includes(cuerpo)) return null;
  return { modelo: it.modelo, ranura: it.ranura, tambien: it.tambien ?? [], oculta: it.oculta ?? [], colores: { ...(it.colores ?? {}) } };
}

/** Escribe una prenda como va en `detalles`. */
export function valorPieza(m: string, c1?: string | null, c2?: string | null): string {
  const a = c1 && HEX.test(c1) ? c1.slice(1).toLowerCase() : '';
  const b = c2 && HEX.test(c2) ? c2.slice(1).toLowerCase() : '';
  return b ? `${m}#${a}#${b}` : a ? `${m}#${a}` : m;
}

/** Lo que trae puesto un amigo (sin las ranuras que tapa otra prenda, como el pantalón debajo de un vestido). */
export function trajeDe(a: AspectoJugador): Partial<Record<RanuraAmigo, Pieza>> {
  const t: Partial<Record<RanuraAmigo, Pieza>> = {};
  const d = a.detalles ?? {};
  for (const r of RANURAS_AMIGO) {
    const p = piezaDe(d[CLAVE[r]], r, a.cuerpo);
    if (p) t[r] = p;
  }
  for (const p of Object.values(t)) for (const otra of p.tambien) if (otra !== p.ranura) delete t[otra];
  return t;
}

/** Los detalles de un aspecto que llegó de otro aparato, limpios (solo claves conocidas, modelos que existen, colores). */
export function normalizarDetalles(d: unknown, cuerpo: Cuerpo): Record<string, string> {
  const r: Record<string, string> = {};
  if (!d || typeof d !== 'object') return r;
  const x = d as Record<string, unknown>;
  for (const k of ['ropa', 'ropa2', 'zapatos', 'ojos']) if (esColor(x[k])) r[k] = (x[k] as string).toLowerCase();
  for (const k of ['cejas', 'rubor', 'medias']) if (esColor(x[k]) || x[k] === 'no') r[k] = (x[k] as string).toLowerCase();
  for (const ra of RANURAS_AMIGO) {
    const v = x[CLAVE[ra]];
    if (typeof v === 'string' && v.length < 60 && piezaDe(v, ra, cuerpo)) r[CLAVE[ra]] = v;
  }
  for (const [k, tipos] of [['aretes', ARETES], ['collar', COLLARES]] as const) {
    const v = x[k];
    if (typeof v !== 'string') continue;
    const [t, c] = v.split('#');
    if (t in tipos && (!c || HEX.test(`#${c}`))) r[k] = v.toLowerCase();
  }
  return r;
}

/** Las joyas de un aspecto. */
export function joyasDe(a: AspectoJugador): Joyas {
  const d = a.detalles ?? {};
  const leer = (v: string | undefined, tipos: Record<string, unknown>) => {
    if (!v) return null;
    const [t, c] = v.split('#');
    return t in tipos ? { tipo: t, color: c && HEX.test(`#${c}`) ? `#${c}` : null } : null;
  };
  return { aretes: leer(d.aretes, ARETES), collar: leer(d.collar, COLLARES) };
}


export interface Joya {
  tipo: string;
  color: string | null;
}
export interface Joyas {
  aretes: Joya | null;
  collar: Joya | null;
}

/** Los aretes: nombre para mostrar y color de fábrica. */
export const ARETES: Record<string, { n: string; c: string; metal?: boolean }> = {
  boton: { n: 'Botoncitos', c: '#f2c14e', metal: true },
  perla: { n: 'Perlas', c: '#fbf3e6' },
  argolla: { n: 'Argollas', c: '#f2c14e', metal: true },
  argolla_grande: { n: 'Argollas grandes', c: '#f2c14e', metal: true },
  corazon: { n: 'Corazoncitos', c: '#e8456b' },
  estrella: { n: 'Estrellitas', c: '#ffd34d' },
  luna: { n: 'Lunitas', c: '#dfe6f2', metal: true },
  gota: { n: 'Gotas de cristal', c: '#5ec8f2' },
  flor: { n: 'Florecitas', c: '#f59ac0' },
  cereza: { n: 'Cerecitas', c: '#d6243a' },
  rayo: { n: 'Rayitos', c: '#ffcf33' },
  diamante: { n: 'Diamantes', c: '#d8f4ff' },
};

/** Los collares. */
export const COLLARES: Record<string, { n: string; c: string; metal?: boolean }> = {
  perlas: { n: 'Collar de perlas', c: '#fbf3e6' },
  cadena: { n: 'Cadenita', c: '#f2c14e', metal: true },
  corazon: { n: 'Dije de corazón', c: '#e8456b' },
  estrella: { n: 'Dije de estrella', c: '#ffd34d' },
  gema: { n: 'Dije de gema', c: '#7a5cf0' },
  gargantilla: { n: 'Gargantilla', c: '#2b2a2e' },
  flores: { n: 'Collar de flores', c: '#ff8fb1' },
  medalla: { n: 'Medalla', c: '#f2c14e', metal: true },
  bolitas: { n: 'Bolitas de colores', c: '#4fb0e8' },
};

