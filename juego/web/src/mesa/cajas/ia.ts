// IA de Puntos y Cajas.
// Suave: juega al azar pero casi siempre se come las cajas servidas. Normal: come todo, evita la tercera línea
// y cuando ya no puede, regala la cadena más corta. Sin piedad: además cuenta cadenas y lazos al final y hace
// el «trato doble» (deja las dos últimas cajas de una cadena, o cuatro de un lazo) para quedarse con el control;
// cuando quedan pocas líneas seguras busca (alfa-beta con tabla) quién va a tener que abrir la primera cadena.
import type { NivelIA } from '../tipos';
import { type EstadoCajas, type Geometria, type MovCajas, geo } from './reglas';

/** Tablero en arreglos planos (rápido de trazar y borrar). */
interface Pos {
  g: Geometria;
  /** 1 = línea trazada. */
  ln: Uint8Array;
  /** Lados trazados de cada caja (4 = cerrada). */
  lados: Int8Array;
  /** Huella Zobrist de las líneas trazadas (dos mitades de 32 bits). */
  h1: number;
  h2: number;
  /** Líneas libres y cajas con tres lados (se llevan al trazar y borrar). */
  libres: number;
  tres: number;
}

/** Números al azar fijos por línea para la huella de cada posición. */
const zobrist: number[] = [];
function azarZobrist(n: number) {
  let s = 0x9e3779b9;
  while (zobrist.length < n * 2) {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    zobrist.push((t ^ (t >>> 14)) | 0);
  }
}

function crearPos(e: EstadoCajas): Pos {
  const g = geo(e);
  azarZobrist(g.nl);
  const p: Pos = { g, ln: new Uint8Array(g.nl), lados: new Int8Array(g.nc), h1: 0, h2: 0, libres: g.nl, tres: 0 };
  e.lineas.forEach((x, l) => x && trazar(p, l));
  return p;
}

/** Traza `l` y dice cuántas cajas cerró. */
function trazar(p: Pos, l: number): number {
  p.ln[l] = 1;
  p.h1 ^= zobrist[2 * l];
  p.h2 ^= zobrist[2 * l + 1];
  p.libres--;
  let n = 0;
  for (const b of p.g.cajasDe[l]) {
    const x = ++p.lados[b];
    if (x === 3) p.tres++;
    else if (x === 4) {
      p.tres--;
      n++;
    }
  }
  return n;
}
function borrar(p: Pos, l: number) {
  p.ln[l] = 0;
  p.h1 ^= zobrist[2 * l];
  p.h2 ^= zobrist[2 * l + 1];
  p.libres++;
  for (const b of p.g.cajasDe[l]) {
    const x = --p.lados[b];
    if (x === 3) p.tres++;
    else if (x === 2) p.tres--;
  }
}
/** Una línea libre de la caja `b` distinta de `salvo` (-1 si no hay). */
function libreDe(p: Pos, b: number, salvo = -1): number {
  for (const l of p.g.lineasDe[b]) if (!p.ln[l] && l !== salvo) return l;
  return -1;
}
/** La caja al otro lado de `l` visto desde `b` (-1 = el borde). */
function otraCaja(p: Pos, b: number, l: number): number {
  const cs = p.g.cajasDe[l];
  return cs.length === 2 ? (cs[0] === b ? cs[1] : cs[0]) : -1;
}
function segura(p: Pos, l: number): boolean {
  if (p.ln[l]) return false;
  for (const b of p.g.cajasDe[l]) if (p.lados[b] >= 2) return false;
  return true;
}
function seguras(p: Pos): number[] {
  const r: number[] = [];
  for (let l = 0; l < p.g.nl; l++) if (segura(p, l)) r.push(l);
  return r;
}
function libres(p: Pos): number[] {
  const r: number[] = [];
  for (let l = 0; l < p.g.nl; l++) if (!p.ln[l]) r.push(l);
  return r;
}
function servidas(p: Pos): number[] {
  const r: number[] = [];
  for (let b = 0; b < p.g.nc; b++) if (p.lados[b] === 3) r.push(b);
  return r;
}
const alAzar = <T>(xs: T[], azar: () => number): T => xs[Math.min(xs.length - 1, Math.floor(azar() * xs.length))];

/** Cuántas cajas se come el otro (comiendo todo) si trazo `l`. */
function regaloDe(p: Pos, l: number): number {
  const pila = [l];
  if (trazar(p, l)) {
    borrar(p, l);
    return 0;
  }
  let n = 0;
  for (;;) {
    let b = 0;
    while (b < p.g.nc && p.lados[b] !== 3) b++;
    if (b === p.g.nc) break;
    const k = libreDe(p, b);
    n += trazar(p, k);
    pila.push(k);
  }
  for (let i = pila.length - 1; i >= 0; i--) borrar(p, pila[i]);
  return n;
}

// ---------------------------------------------------------------------------
// Comer o hacer el trato

/**
 * Cadena servida que llega a su final: comer todo (`tomar`) o dejarle al otro las últimas 2 (cadena) o 4
 * (lazo) trazando `trato`, para que él coma y tenga que abrir la siguiente.
 */
interface Decision {
  tomar: number;
  trato: number;
  deja: 2 | 4;
}

/** null si comerse la caja servida `x` es lo mejor sin pensarlo; si no, la decisión que hay que tomar. */
function clasificar(p: Pos, x: number): Decision | null {
  const e = libreDe(p, x);
  const y = otraCaja(p, x, e);
  if (y < 0 || p.lados[y] !== 2) return null;
  const e2 = libreDe(p, y, e);
  const z = otraCaja(p, y, e2);
  if (z < 0 || p.lados[z] <= 1) return { tomar: e, trato: e2, deja: 2 };
  if (p.lados[z] === 3) return null;
  const e3 = libreDe(p, z, e2);
  const q = otraCaja(p, z, e3);
  if (q >= 0 && p.lados[q] === 3) return { tomar: e, trato: e2, deja: 4 };
  return null;
}

/** Decisiones distintas que hay servidas (un lazo abierto aparece por las dos puntas con el mismo trato). */
function decisiones(p: Pos): { bien: number; dec: Decision[] } {
  const dec: Decision[] = [];
  for (let b = 0; b < p.g.nc; b++) {
    if (p.lados[b] !== 3) continue;
    const d = clasificar(p, b);
    if (!d) return { bien: libreDe(p, b), dec };
    if (!dec.some((o) => o.trato === d.trato)) dec.push(d);
  }
  return { bien: -1, dec };
}

/** De varias cadenas servidas se guarda una para el final (mejor la de 2, que sale más barata regalar). */
const aGuardar = (dec: Decision[]) => dec.find((d) => d.deja === 2) ?? dec[0];

/**
 * Come todo lo que conviene comer siempre y, si hay varias cadenas servidas, todas menos una.
 * Devuelve lo que comió y la decisión que queda (si queda).
 */
const NADA = { n: 0, dec: null };
function comer(p: Pos, pila: number[]): { n: number; dec: Decision | null } {
  if (!p.tres) return NADA;
  let n = 0;
  for (;;) {
    if (!p.tres) return { n, dec: null };
    const { bien, dec } = decisiones(p);
    let l = bien;
    if (l < 0) {
      if (dec.length < 2) return { n, dec: dec[0] ?? null };
      const guardada = aGuardar(dec);
      l = dec.find((d) => d !== guardada)!.tomar;
    }
    n += trazar(p, l);
    pila.push(l);
  }
}

// ---------------------------------------------------------------------------
// Cadenas y lazos del final

interface Cadena {
  n: number;
  /** Líneas en orden: la de una punta, las de adentro, la de la otra punta (en un lazo, n líneas). */
  lineas: number[];
  lazo: boolean;
}

/** Las cadenas (cajas seguidas con dos lados) y los lazos del tablero. */
function cadenas(p: Pos): Cadena[] {
  const { nc } = p.g;
  const visto = new Uint8Array(nc);
  const r: Cadena[] = [];
  for (let b = 0; b < nc; b++) {
    if (visto[b] || p.lados[b] !== 2) continue;
    visto[b] = 1;
    const l1 = libreDe(p, b);
    const l2 = libreDe(p, b, l1);
    const adelante = [l1];
    let n = 1, cur = b, via = l1, lazo = false;
    for (;;) {
      const s = otraCaja(p, cur, via);
      if (s < 0 || p.lados[s] !== 2) break;
      if (s === b) {
        lazo = true;
        break;
      }
      visto[s] = 1;
      n++;
      via = libreDe(p, s, via);
      adelante.push(via);
      cur = s;
    }
    if (lazo) {
      r.push({ n, lineas: adelante, lazo });
      continue;
    }
    const atras = [l2];
    cur = b;
    via = l2;
    for (;;) {
      const s = otraCaja(p, cur, via);
      if (s < 0 || p.lados[s] !== 2) break;
      visto[s] = 1;
      n++;
      via = libreDe(p, s, via);
      atras.push(via);
      cur = s;
    }
    r.push({ n, lineas: atras.reverse().concat(adelante), lazo });
  }
  return r;
}

/** ¿Todas las cajas abiertas tienen dos lados? (solo cadenas y lazos sueltos: se resuelve con la fórmula) */
function esSimple(p: Pos): boolean {
  for (let b = 0; b < p.g.nc; b++) if (p.lados[b] < 2) return false;
  return true;
}

const memoSimple = new Map<string, number>();

/**
 * Valor exacto (cajas mías menos del otro de aquí en adelante) para el que tiene que abrir, con solo
 * cadenas y lazos sueltos: abre una; el otro come todo y abre él, o come todo menos 2 (4 en lazo) y le toca
 * abrir otra vez a este. Las cadenas de 1 y 2 no dejan trato (la de 2 se abre por el medio).
 */
function valorSimple(cad: number[], laz: number[]): number {
  if (!cad.length && !laz.length) return 0;
  const k = `${cad.join(',')}|${laz.join(',')}`;
  const hecho = memoSimple.get(k);
  if (hecho !== undefined) return hecho;
  let mejor = -Infinity;
  for (let i = 0; i < cad.length; i++) {
    if (i && cad[i] === cad[i - 1]) continue;
    const n = cad[i];
    const fr = valorSimple(cad.slice(0, i).concat(cad.slice(i + 1)), laz);
    const v = n <= 2 ? -(n + fr) : -Math.max(n + fr, n - 4 - fr);
    if (v > mejor) mejor = v;
  }
  for (let i = 0; i < laz.length; i++) {
    if (i && laz[i] === laz[i - 1]) continue;
    const n = laz[i];
    const fr = valorSimple(cad, laz.slice(0, i).concat(laz.slice(i + 1)));
    const v = -Math.max(n + fr, n - 8 - fr);
    if (v > mejor) mejor = v;
  }
  memoSimple.set(k, mejor);
  return mejor;
}

/** Valor de una posición simple sin armar las listas de líneas: solo largos de cadenas y lazos. */
const visto = { arr: new Uint8Array(0) };
function valorSimpleDe(p: Pos): number {
  const { nc } = p.g;
  if (visto.arr.length < nc) visto.arr = new Uint8Array(nc);
  const v = visto.arr;
  v.fill(0, 0, nc);
  const cad: number[] = [], laz: number[] = [];
  for (let b = 0; b < nc; b++) {
    if (v[b] || p.lados[b] !== 2) continue;
    v[b] = 1;
    const l1 = libreDe(p, b);
    let n = 1, cur = b, via = l1, lazo = false;
    for (;;) {
      const s = otraCaja(p, cur, via);
      if (s < 0) break;
      if (s === b) {
        lazo = true;
        break;
      }
      v[s] = 1;
      n++;
      via = libreDe(p, s, via);
      cur = s;
    }
    if (!lazo) {
      cur = b;
      via = libreDe(p, b, l1);
      for (;;) {
        const s = otraCaja(p, cur, via);
        if (s < 0) break;
        v[s] = 1;
        n++;
        via = libreDe(p, s, via);
        cur = s;
      }
    }
    (lazo ? laz : cad).push(n);
  }
  return valorSimple(cad.sort((a, b) => a - b), laz.sort((a, b) => a - b));
}

/** Por dónde vale la pena abrir cada cadena: las dos puntas y el medio (en un lazo da igual). */
function aperturas(cs: Cadena[]): number[] {
  const r: number[] = [];
  for (const c of [...cs].sort((a, b) => a.n - b.n)) {
    const ls = c.lineas;
    const cand = c.lazo ? [ls[0]] : c.n === 1 ? ls : [ls[0], ls[ls.length - 1], ls[ls.length >> 1]];
    for (const l of cand) if (!r.includes(l)) r.push(l);
  }
  return r;
}

// ---------------------------------------------------------------------------
// Búsqueda (negamax con poda alfa-beta y tabla de posiciones)

const AGOTADO = { agotado: true };
let nodos = 0;
let limite = 0;
/** Además del presupuesto de nodos, un tope de tiempo (celulares lentos, primera jugada sin compilar). */
let hasta = Infinity;
const MAX_MS = 45;
const ahora = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
/**
 * Posición → ((valor + 256) * 4 + tipo) * 128 + mejor línea (127 = ninguna); tipo 0 exacto, 1 cota inferior,
 * 2 cota superior. Sirve entre jugadas y partidas (el valor solo depende de las líneas trazadas).
 */
const tabla = new Map<number, number>();
let tablaDe = '';

const SIN_PILA: number[] = [];
const clave = (p: Pos) => (p.h1 >>> 0) * 2097152 + (p.h2 & 0x1fffff);

/** Cajas mías menos las del otro de aquí al final, para el que tiene el turno. */
function buscar(p: Pos, alfa: number, beta: number): number {
  if (++nodos > limite || ((nodos & 511) === 0 && ahora() > hasta)) throw AGOTADO;
  const pila: number[] = p.tres ? [] : SIN_PILA;
  const { n, dec } = comer(p, pila);
  let v: number;
  if (dec) {
    // Comer todo y seguir, o hacer el trato y que el otro coma y abra
    const c = trazar(p, dec.tomar);
    const a = c + buscar(p, alfa - n - c, beta - n - c);
    borrar(p, dec.tomar);
    let b = -Infinity;
    if (n + a < beta) {
      trazar(p, dec.trato);
      b = -buscar(p, n - beta, n - Math.max(alfa, n + a));
      borrar(p, dec.trato);
    }
    v = n + Math.max(a, b);
  } else v = n + libre(p, alfa - n, beta - n);
  for (let i = pila.length - 1; i >= 0; i--) borrar(p, pila[i]);
  return v;
}

/** Posición sin cajas servidas. */
function libre(p: Pos, alfa: number, beta: number): number {
  if (!p.libres) return 0;
  const k = clave(p);
  const t = tabla.get(k);
  let ml = 127;
  if (t !== undefined) {
    ml = t % 128;
    const r = (t - ml) / 128, tipo = r % 4, tv = (r - tipo) / 4 - 256;
    if (tipo === 0 || (tipo === 1 && tv >= beta) || (tipo === 2 && tv <= alfa)) return tv;
  }
  let cands = seguras(p);
  if (!cands.length) {
    if (esSimple(p)) {
      const v = valorSimpleDe(p);
      tabla.set(k, (v + 256) * 4 * 128 + 127);
      return v;
    }
    cands = aperturas(cadenas(p));
  }
  if (ml !== 127) {
    const i = cands.indexOf(ml);
    if (i > 0) {
      cands[i] = cands[0];
      cands[0] = ml;
    }
  }
  const alfa0 = alfa;
  let mejor = -Infinity, mejorL = 127;
  for (const l of cands) {
    trazar(p, l);
    const v = -buscar(p, -beta, -alfa);
    borrar(p, l);
    if (v > mejor) {
      mejor = v;
      mejorL = l;
    }
    if (v > alfa) alfa = v;
    if (alfa >= beta) break;
  }
  if (tabla.size > 300_000) tabla.clear();
  tabla.set(k, ((mejor + 256) * 4 + (mejor <= alfa0 ? 2 : mejor >= beta ? 1 : 0)) * 128 + mejorL);
  return mejor;
}

/** La tabla es de un solo tamaño de tablero (la huella no sabe de filas y columnas). */
function empezarBusqueda(e: EstadoCajas, presupuesto: number) {
  const t = `${e.filas}x${e.columnas}`;
  if (tablaDe !== t) {
    tabla.clear();
    tablaDe = t;
  }
  nodos = 0;
  limite = presupuesto;
  hasta = presupuesto === Infinity ? Infinity : ahora() + MAX_MS;
}

/** Nodos por jugada: pocos milisegundos en el celular. */
const PRESUPUESTO = 12_000;
/** Con más líneas seguras que esto todavía no se busca (se juega una segura al azar). */
const MAX_SEGURAS = 14;

/**
 * La mejor de `cands` según la búsqueda (entre iguales gana la primera: vienen barajadas u ordenadas),
 * o null si la cuenta no cupo en el presupuesto.
 */
function mejorPorBusqueda(e: EstadoCajas, cands: number[]): number | null {
  empezarBusqueda(e, PRESUPUESTO);
  let mejor = -Infinity, mejorL = cands[0];
  for (const l of cands) {
    // Cada candidata en una posición nueva: si la búsqueda se corta deja líneas trazadas
    const p = crearPos(e);
    const c = trazar(p, l);
    let v: number;
    try {
      v = c ? c + buscar(p, mejor - c, Infinity) : -buscar(p, -Infinity, -mejor);
    } catch (x) {
      if (x !== AGOTADO) throw x;
      return null;
    }
    if (v > mejor) {
      mejor = v;
      mejorL = l;
    }
  }
  return mejorL;
}

function barajar<T>(xs: T[], azar: () => number): T[] {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
}

// ---------------------------------------------------------------------------
// Los tres niveles

function facil(e: EstadoCajas, azar: () => number): number {
  const p = crearPos(e);
  const sv = servidas(p);
  if (sv.length && azar() < 0.8) return libreDe(p, alAzar(sv, azar));
  const segs = seguras(p);
  if (segs.length && azar() < 0.72) return alAzar(segs, azar);
  if (!segs.length && !sv.length && azar() < 0.5) return menorRegalo(p, azar);
  return alAzar(libres(p), azar);
}

/** La línea que menos cajas regala (en una cadena de 2, mejor la del medio: no deja trato). */
function menorRegalo(p: Pos, azar: () => number): number {
  let min = Infinity;
  let mejores: number[] = [];
  for (const l of libres(p)) {
    const r = regaloDe(p, l);
    if (r < min) {
      min = r;
      mejores = [l];
    } else if (r === min) mejores.push(l);
  }
  return alAzar(mejores, azar);
}

function normal(e: EstadoCajas, azar: () => number): number {
  const p = crearPos(e);
  const sv = servidas(p);
  if (sv.length) return libreDe(p, alAzar(sv, azar));
  const segs = seguras(p);
  if (segs.length) return alAzar(segs, azar);
  return menorRegalo(p, azar);
}

function dificil(e: EstadoCajas, azar: () => number): number {
  const p = crearPos(e);
  // Cajas servidas: se comen, salvo el final de la última cadena, donde se piensa si conviene el trato
  if (servidas(p).length) {
    const { bien, dec } = decisiones(p);
    if (bien >= 0) return bien;
    if (dec.length > 1) {
      const guardada = aGuardar(dec);
      return dec.find((d) => d !== guardada)!.tomar;
    }
    const d = dec[0];
    return mejorPorBusqueda(e, [d.tomar, d.trato]) ?? d.tomar;
  }
  const segs = seguras(p);
  if (segs.length) {
    const l = segs.length <= MAX_SEGURAS ? mejorPorBusqueda(e, barajar(segs, azar)) : null;
    return l ?? alAzar(segs, azar);
  }
  // Final: abrir la cadena que convenga (la búsqueda sabe cuándo regalar poco y cuándo ceder el control);
  // entre iguales, la que menos regala
  const cands = barajar(aperturas(cadenas(p)), azar)
    .map((l) => ({ l, r: regaloDe(p, l) }))
    .sort((a, b) => a.r - b.r)
    .map((x) => x.l);
  return mejorPorBusqueda(e, cands) ?? menorRegalo(p, azar);
}

export function ia(e: EstadoCajas, nivel: NivelIA, azar: () => number): MovCajas {
  const l = nivel === 'facil' ? facil(e, azar) : nivel === 'normal' ? normal(e, azar) : dificil(e, azar);
  return { l };
}

/** Para las pruebas: cuántos nodos usó la última búsqueda y cuánto hay en la tabla. */
export const _prueba = {
  nodos: () => nodos,
  tabla: () => tabla.size,
  valorSimple,
  crearPos,
  cadenas,
  /** Valor exacto (sin presupuesto) para el que tiene el turno. */
  valor(e: EstadoCajas) {
    empezarBusqueda(e, Infinity);
    return buscar(crearPos(e), -Infinity, Infinity);
  },
};
