// IA del Mancala. Suave: juega casi al azar, pero le encanta repetir turno. Normal: la jugada que más semillas
// mete ya (siguiendo las cadenas de turnos extra). Sin piedad: alfa-beta tan hondo como dé el reloj (~0,1 s).
import type { Rol } from '../../casa/modelo';
import type { Calidad, NivelIA } from '../tipos';
import { base, CASILLAS, type EstadoMancala, HOYOS, type Jugada, mejorCaptura, recorrer, reglas } from './reglas';

const ahora = typeof performance !== 'undefined' ? () => performance.now() : () => Date.now();

// ---------------------------------------------------------------------------
// Siembra rápida para la búsqueda: t = 0 (Él) o 1 (Ella), cambia `b` en su lugar.
const EXTRA = 1;
const FIN = 2;
function sembrar(b: number[], t: number, hoyo: number): number {
  const desde = t * 7 + hoyo;
  const mio = t === 0 ? 6 : 13;
  const saltar = t === 0 ? 13 : 6;
  let n = b[desde];
  b[desde] = 0;
  let i = desde;
  while (n > 0) {
    i = i === 13 ? 0 : i + 1;
    if (i === saltar) continue;
    b[i]++;
    n--;
  }
  let r = i === mio ? EXTRA : 0;
  if (i >= t * 7 && i < t * 7 + 6 && b[i] === 1) {
    b[mio] += 1 + b[12 - i];
    b[i] = 0;
    b[12 - i] = 0;
  }
  let a = 0, e = 0;
  for (let k = 0; k < 6; k++) {
    a += b[k];
    e += b[7 + k];
  }
  if (a === 0 || e === 0) {
    for (let k = 0; k < 6; k++) {
      b[k] = 0;
      b[7 + k] = 0;
    }
    b[6] += a;
    b[13] += e;
    r |= FIN;
  }
  return r;
}

const PESOS = { mov: 0.25, lado: 0.1, libres: 4 };
/** Valor para Él (Ella quiere que sea bajo): diferencia de almacenes + movilidad + semillas de su lado. */
function evaluar(b: number[], fin: boolean): number {
  const dif = b[6] - b[13];
  // Más de la mitad de las 48 semillas en el almacén ya es partida ganada
  if (fin || b[6] > 24 || b[13] > 24) return dif === 0 ? 0 : (dif > 0 ? 1000 : -1000) + dif;
  let mov = 0, lado = 0;
  for (let k = 0; k < 6; k++) {
    if (b[k] > 0) mov++;
    if (b[7 + k] > 0) mov--;
    lado += b[k] - b[7 + k];
  }
  return dif + PESOS.mov * mov + PESOS.lado * lado;
}

class Corte extends Error {}

/** Orden de exploración: primero los turnos extra, luego las capturas, luego del almacén hacia atrás. */
function ordenar(b: number[], t: number): number[] {
  const hs: number[] = [];
  const pesos: number[] = [];
  for (let k = HOYOS - 1; k >= 0; k--) {
    const n = b[t * 7 + k];
    if (n === 0) continue;
    const llega = k + n;
    let p = 0;
    if (llega === 6) p = 3;
    else if (llega < 6 && b[t * 7 + llega] === 0 && b[12 - (t * 7 + llega)] > 0) p = 2;
    hs.push(k);
    pesos.push(p);
  }
  return hs.map((h, i) => [h, pesos[i]] as const).sort((x, y) => y[1] - x[1]).map((x) => x[0]);
}

interface Busqueda {
  limite: number;
  nodos: number;
}

/** `libres`: turnos extra que todavía no gastan profundidad (las cadenas se miran enteras, hasta un punto). */
function alfabeta(b: number[], t: number, prof: number, alfa: number, beta: number, s: Busqueda, libres = PESOS.libres): number {
  if ((++s.nodos & 511) === 0 && ahora() > s.limite) throw new Corte();
  if (prof === 0 || b[6] > 24 || b[13] > 24) return evaluar(b, false);
  const hs = ordenar(b, t);
  if (t === 0) {
    let v = -Infinity;
    for (const h of hs) {
      const nb = b.slice();
      const r = sembrar(nb, t, h);
      const gratis = r & EXTRA && libres > 0 ? 1 : 0;
      const w = r & FIN ? evaluar(nb, true) : alfabeta(nb, r & EXTRA ? t : 1 - t, prof - 1 + gratis, alfa, beta, s, libres - gratis);
      if (w > v) v = w;
      if (v > alfa) alfa = v;
      if (alfa >= beta) break;
    }
    return v;
  }
  let v = Infinity;
  for (const h of hs) {
    const nb = b.slice();
    const r = sembrar(nb, t, h);
    const gratis = r & EXTRA && libres > 0 ? 1 : 0;
    const w = r & FIN ? evaluar(nb, true) : alfabeta(nb, r & EXTRA ? t : 1 - t, prof - 1 + gratis, alfa, beta, s, libres - gratis);
    if (w < v) v = w;
    if (v < beta) beta = v;
    if (alfa >= beta) break;
  }
  return v;
}

/**
 * Valor de cada hoyo jugable para quien tiene el turno (más alto = mejor para él), a profundidad fija.
 * `exacto`: el valor justo de cada hoyo (para juzgar jugadas); si no, los peores solo se acotan (más rápido).
 */
function valores(e: EstadoMancala, prof: number, s: Busqueda, orden?: number[], exacto = false): Map<number, number> {
  const t = e.turno === 'el' ? 0 : 1;
  const signo = t === 0 ? 1 : -1;
  const out = new Map<number, number>();
  let mejor = -Infinity;
  for (const h of orden ?? ordenar(e.c, t)) {
    const nb = e.c.slice();
    const r = sembrar(nb, t, h);
    // Ventana: basta saber si iguala (con 0.02 de margen, para los empates) o supera al mejor hasta ahora
    const piso = exacto ? -Infinity : mejor - 0.02;
    const w = r & FIN
      ? evaluar(nb, true)
      : alfabeta(nb, r & EXTRA ? t : 1 - t, prof - 1, t === 0 ? piso : -Infinity, t === 0 ? Infinity : -piso, s);
    out.set(h, signo * w);
    mejor = Math.max(mejor, signo * w);
  }
  return out;
}

/**
 * Sin piedad: profundización iterativa con alfa-beta, cortada por el reloj (en un celular llega a 8–10 jugadas;
 * al final, con pocas semillas, mucho más hondo).
 */
function sinPiedad(e: EstadoMancala, azar: () => number, ms = 100, maxProf = 12): number {
  const t = e.turno === 'el' ? 0 : 1;
  let quedan = 0;
  for (let k = 0; k < HOYOS; k++) quedan += e.c[k] + e.c[7 + k];
  if (quedan <= 12) maxProf += 8;
  const s: Busqueda = { limite: ahora() + ms, nodos: 0 };
  let mejor = new Map<number, number>();
  let orden = ordenar(e.c, t);
  for (let p = 1; p <= maxProf; p++) {
    try {
      mejor = valores(e, p, s, orden);
    } catch (err) {
      if (err instanceof Corte) break;
      throw err;
    }
    orden = [...mejor.entries()].sort((a, b) => b[1] - a[1]).map((x) => x[0]);
    // Ya ganó (o ya no hay nada que hacer): no hace falta pensar más
    if (Math.abs(mejor.get(orden[0])!) >= 1000) break;
  }
  const top = Math.max(...mejor.values());
  const empatados = [...mejor.entries()].filter(([, v]) => v >= top - 0.01).map(([h]) => h);
  return empatados[Math.floor(azar() * empatados.length)] ?? orden[0];
}

// ---------------------------------------------------------------------------
/** Normal: lo que mete ya al almacén (menos lo que se lleva el otro), encadenando los turnos extra. */
function cadena(b: number[], t: number, h: number, hondo: number): number {
  const mio = t === 0 ? 6 : 13, suyo = t === 0 ? 13 : 6;
  const nb = b.slice();
  const antes = nb[mio] - nb[suyo];
  const r = sembrar(nb, t, h);
  let v = nb[mio] - nb[suyo] - antes;
  if (r & EXTRA && !(r & FIN) && hondo > 0) {
    let mejor = -Infinity;
    for (let k = 0; k < HOYOS; k++) if (nb[t * 7 + k] > 0) mejor = Math.max(mejor, cadena(nb, t, k, hondo - 1));
    v += Math.max(0, mejor) + 0.5;
  }
  return v;
}

function codicioso(e: EstadoMancala, azar: () => number): number {
  const t = e.turno === 'el' ? 0 : 1;
  let mejor = -Infinity, elegido = -1;
  for (let k = 0; k < HOYOS; k++) {
    if (e.c[t * 7 + k] === 0) continue;
    // Desempate: los hoyos cerca del almacén primero, con una pizca de azar
    const v = cadena(e.c, t, k, 6) + k * 0.01 + azar() * 0.05;
    if (v > mejor) {
      mejor = v;
      elegido = k;
    }
  }
  return elegido;
}

/** Suave: le encantan los turnos extra, a veces ve una captura y si no, juega lo que sea. */
function suave(e: EstadoMancala, azar: () => number): number {
  const hs = reglas.movimientos(e).map((m) => m.hoyo);
  const al = (xs: number[]) => xs[Math.floor(azar() * xs.length)];
  const extra = hs.filter((h) => recorrer(e.c, e.turno, h).extra);
  if (extra.length && azar() < 0.6) return al(extra);
  if (azar() < 0.3) {
    const caps = hs.filter((h) => (recorrer(e.c, e.turno, h).captura?.ajenas ?? 0) > 0);
    if (caps.length) return al(caps);
  }
  return al(hs);
}

export function ia(e: EstadoMancala, nivel: NivelIA, azar: () => number): Jugada {
  const ms = reglas.movimientos(e);
  if (ms.length <= 1) return ms[0] ?? { hoyo: 0 };
  const hoyo = nivel === 'facil' ? suave(e, azar) : nivel === 'normal' ? codicioso(e, azar) : sinPiedad(e, azar);
  return { hoyo };
}

// ---------------------------------------------------------------------------
/** Para las reacciones: qué tan buena fue la jugada comparada con las otras (búsqueda corta). */
export function juzgar(e: EstadoMancala, m: Jugada): { calidad: Calidad; regalo: boolean } {
  const quien: Rol = e.turno;
  const r = recorrer(e.c, quien, m.hoyo);
  // Regalo: deja al otro una captura jugosa que antes no tenía
  let regalo = false;
  if (!r.extra && !r.barrido) {
    const rival: Rol = quien === 'el' ? 'ella' : 'el';
    const despues = mejorCaptura(r.c, rival);
    regalo = despues >= 5 && despues >= mejorCaptura(e.c, rival) + 3;
  }
  const s: Busqueda = { limite: ahora() + 40, nodos: 0 };
  let vals: Map<number, number>;
  try {
    vals = valores(e, 4, s, undefined, true);
  } catch {
    return { calidad: 'normal', regalo };
  }
  const top = Math.max(...vals.values());
  const perdida = top - (vals.get(m.hoyo) ?? top);
  const gano = r.c[quien === 'el' ? 6 : 13] - e.c[quien === 'el' ? 6 : 13];
  const calidad: Calidad = perdida >= 4 && !r.extra && !r.captura ? 'mala' : perdida < 0.5 && gano >= 2 ? 'buena' : 'normal';
  return { calidad, regalo };
}

/** Pruebas: la búsqueda con otros límites. */
export const _pruebas = { PESOS, sinPiedad, codicioso, suave, sembrar, evaluar, CASILLAS, base };
