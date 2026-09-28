// Mancala (Kalah) tal cual está en docs/juegos-mesa.md: 6 hoyos por lado, un almacén en cada extremo,
// 4 semillas por hoyo y siembra en sentido antihorario.
import { otro, type Rol } from '../../casa/modelo';
import type { Final, Reglas } from '../tipos';

export const HOYOS = 6;
export const SEMILLAS = 4;
/**
 * Las 14 casillas en el orden de la siembra (antihorario): 0–5 hoyos de Él, 6 su almacén,
 * 7–12 hoyos de Ella, 13 su almacén. El hoyo de enfrente de `i` es `12 - i`.
 */
export const CASILLAS = 14;

export interface EstadoMancala {
  /** Semillas en cada casilla (ver CASILLAS). */
  c: number[];
  turno: Rol;
  /** Ya terminó (y quien tenía semillas en sus hoyos se las llevó a su almacén). */
  fin: boolean;
}

/** Hoyo de 0 a 5 contado desde el lado de quien juega (0 = el más lejos de su almacén). */
export interface Jugada {
  hoyo: number;
}

export const base = (r: Rol) => (r === 'el' ? 0 : 7);
export const almacen = (r: Rol) => (r === 'el' ? 6 : 13);
export const enfrente = (i: number) => 12 - i;
export const esAlmacen = (i: number) => i === 6 || i === 13;
/** De quién es la casilla (hoyo o almacén). */
export const duenoDe = (i: number): Rol => (i <= 6 ? 'el' : 'ella');
const esHoyoDe = (i: number, r: Rol) => i >= base(r) && i < base(r) + HOYOS;
const ladoVacio = (c: readonly number[], r: Rol) => c.slice(base(r), base(r) + HOYOS).every((n) => n === 0);

/** Todo lo que pasa en una jugada, paso a paso (la vista lo anima tal cual). */
export interface Recorrido {
  quien: Rol;
  /** Casilla de donde salen las semillas. */
  desde: number;
  /** Casilla donde cae cada semilla, en orden (nunca el almacén del otro). */
  caidas: number[];
  /** La última cayó en su almacén: vuelve a jugar. */
  extra: boolean;
  /**
   * La última cayó en un hoyo vacío de su lado: esa semilla y las de enfrente se van a su almacén.
   * Al pie de la letra: si enfrente no hay nada, igual se lleva su semilla (`ajenas` = 0).
   */
  captura: { hoyo: number; enfrente: number; ajenas: number } | null;
  /** Al terminar: lo que cada uno se lleva de sus hoyos a su almacén (semillas por hoyo, 0–5). */
  barrido: Record<Rol, number[]> | null;
  /** Casillas después de la jugada. */
  c: number[];
}

/** Siembra el hoyo `hoyo` (0–5) de `quien` y cuenta lo que pasa. No valida que sea legal. */
export function recorrer(c: readonly number[], quien: Rol, hoyo: number): Recorrido {
  const b = c.slice();
  const desde = base(quien) + hoyo;
  const saltar = almacen(otro(quien));
  const caidas: number[] = [];
  let n = b[desde];
  b[desde] = 0;
  let i = desde;
  while (n > 0) {
    i = (i + 1) % CASILLAS;
    if (i === saltar) continue;
    b[i]++;
    n--;
    caidas.push(i);
  }
  const extra = caidas.length > 0 && i === almacen(quien);
  let captura: Recorrido['captura'] = null;
  if (caidas.length > 0 && esHoyoDe(i, quien) && b[i] === 1) {
    const f = enfrente(i);
    captura = { hoyo: i, enfrente: f, ajenas: b[f] };
    b[almacen(quien)] += 1 + b[f];
    b[i] = 0;
    b[f] = 0;
  }
  let barrido: Recorrido['barrido'] = null;
  if (ladoVacio(b, 'el') || ladoVacio(b, 'ella')) {
    barrido = { el: [], ella: [] };
    for (const r of ['el', 'ella'] as Rol[]) {
      for (let k = 0; k < HOYOS; k++) {
        const j = base(r) + k;
        barrido[r].push(b[j]);
        b[almacen(r)] += b[j];
        b[j] = 0;
      }
    }
  }
  return { quien, desde, caidas, extra, captura, barrido, c: b };
}

export const reglas: Reglas<EstadoMancala, Jugada> = {
  inicial(empieza) {
    const c = Array.from({ length: CASILLAS }, (_, i) => (esAlmacen(i) ? 0 : SEMILLAS));
    return { c, turno: empieza, fin: false };
  },
  turno: (e) => e.turno,
  movimientos(e) {
    if (e.fin) return [];
    const b = base(e.turno);
    const ms: Jugada[] = [];
    for (let k = 0; k < HOYOS; k++) if (e.c[b + k] > 0) ms.push({ hoyo: k });
    return ms;
  },
  aplicar(e, m) {
    const k = m?.hoyo;
    if (e.fin || !Number.isInteger(k) || k < 0 || k >= HOYOS || e.c[base(e.turno) + k] === 0) {
      throw new Error(`Mancala: jugada ilegal ${JSON.stringify(m)}`);
    }
    const r = recorrer(e.c, e.turno, k);
    const fin = r.barrido !== null;
    return { c: r.c, turno: fin || r.extra ? e.turno : otro(e.turno), fin };
  },
  puntos: (e) => ({ el: e.c[6], ella: e.c[13] }),
  fin(e): Final | null {
    if (!e.fin) return null;
    const puntos = { el: e.c[6], ella: e.c[13] };
    return { ganador: puntos.el > puntos.ella ? 'el' : puntos.ella > puntos.el ? 'ella' : null, puntos };
  },
};

/** La mejor captura que tendría `quien` si le tocara ya (semillas que se llevaría al almacén). */
export function mejorCaptura(c: readonly number[], quien: Rol): number {
  let mejor = 0;
  for (let k = 0; k < HOYOS; k++) {
    if (c[base(quien) + k] === 0) continue;
    const r = recorrer(c, quien, k);
    if (r.captura && r.captura.ajenas > 0) mejor = Math.max(mejor, 1 + r.captura.ajenas);
  }
  return mejor;
}
