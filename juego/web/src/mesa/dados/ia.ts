// IA de Dados Party. Suave: guarda lo que más se repite y a veces se equivoca. Normal: mira un tiro adelante
// con una tarjeta sensata. Sin piedad: expectimax exacto sobre los tiros que quedan (todas las formas de
// guardar), con una valoración de casillas que cuida el bono de arriba, y al final juega a ganar.
import { otro, type Rol } from '../../casa/modelo';
import type { NivelIA } from '../tipos';
import {
  ABAJO,
  ARRIBA,
  CASILLAS,
  type Casilla,
  type EstadoDados,
  META_ARRIBA,
  type MovDados,
  type Tarjeta,
  TIROS,
  conteo,
  libre,
  llenas,
  opcionesDe,
  puedeTirar,
  puntaje,
  sumaArriba,
  tirar,
  totalDe,
} from './reglas';

// ---------------------------------------------------------------------------
// Tablas (una vez): todos los multiconjuntos de 0 a 5 dados, cómo se completan al tirar y sus subconjuntos
const clave = (c: number[]) => c[1] + 6 * c[2] + 36 * c[3] + 216 * c[4] + 1296 * c[5] + 7776 * c[6];
const MULTI: number[][] = [];
const TAM: number[] = [];
const INDICE = new Int16Array(46656).fill(-1);
(function generar(v: number, resto: number, c: number[]) {
  if (v > 6) {
    INDICE[clave(c)] = MULTI.length;
    MULTI.push(c.slice());
    TAM.push(5 - resto);
    return;
  }
  for (let k = 0; k <= resto; k++) {
    c[v] = k;
    generar(v + 1, resto - k, c);
  }
  c[v] = 0;
})(1, 5, [0, 0, 0, 0, 0, 0, 0]);
const N = MULTI.length; // 462
const CINCO = MULTI.map((_, i) => i).filter((i) => TAM[i] === 5); // 252
const FACT = [1, 1, 2, 6, 24, 120];

// Tiros: de cada multiconjunto guardado, a qué manos de 5 se llega y con qué probabilidad
const trIni = new Int32Array(N + 1);
const trDest: number[] = [];
const trProb: number[] = [];
for (let k = 0; k < N; k++) {
  trIni[k] = trDest.length;
  const n = 5 - TAM[k];
  for (let r = 0; r < N; r++) {
    if (TAM[r] !== n) continue;
    let p = FACT[n] / 6 ** n;
    const s = [0];
    for (let v = 1; v <= 6; v++) {
      p /= FACT[MULTI[r][v]];
      s.push(MULTI[k][v] + MULTI[r][v]);
    }
    trDest.push(INDICE[clave(s)]);
    trProb.push(p);
  }
}
trIni[N] = trDest.length;
const TR_DEST = Int16Array.from(trDest);
const TR_PROB = Float64Array.from(trProb);

// Subconjuntos propios de cada mano de 5 (lo que se puede guardar antes de volver a tirar)
const subIni = new Int32Array(N + 1);
const subs: number[] = [];
for (let d = 0; d < N; d++) {
  subIni[d] = subs.length;
  if (TAM[d] !== 5) continue;
  const c = MULTI[d];
  (function sub(v: number, s: number[]) {
    if (v > 6) {
      if (s.some((x, i) => x !== c[i])) subs.push(INDICE[clave(s)]);
      return;
    }
    for (let k = 0; k <= c[v]; k++) {
      s[v] = k;
      sub(v + 1, s);
    }
    s[v] = 0;
  })(1, [0, 0, 0, 0, 0, 0, 0]);
}
subIni[N] = subs.length;
const SUBS = Int16Array.from(subs);

const MANO: number[][] = MULTI.map((c) => c.flatMap((k, v) => Array<number>(k).fill(v)));
const YATZI = MULTI.map((c, i) => TAM[i] === 5 && c.includes(5));
const NC = CASILLAS.length;
const PTS = new Float64Array(N * NC);
const PTS_COMODIN = new Float64Array(N * NC);
for (const d of CINCO)
  CASILLAS.forEach((b, j) => {
    PTS[d * NC + j] = puntaje(b, MANO[d]);
    PTS_COMODIN[d * NC + j] = puntaje(b, MANO[d], true);
  });

// ---------------------------------------------------------------------------
// Bono de arriba: probabilidad de pasar de 62 con las casillas de arriba que quedan (cada una sale con
// «cuántos dados de su número» según una distribución típica de partida).
const REPARTO = [0.04, 0.12, 0.27, 0.34, 0.18, 0.05];
const P_BONO: Float64Array[] = [];
for (let mask = 0; mask < 64; mask++) {
  let dist = [1];
  for (let f = 1; f <= 6; f++) {
    if (!(mask & (1 << (f - 1)))) continue;
    const nueva = Array<number>(dist.length + 5 * f).fill(0);
    dist.forEach((p, s) => REPARTO.forEach((q, k) => (nueva[s + k * f] += p * q)));
    dist = nueva;
  }
  const t = new Float64Array(META_ARRIBA + 1);
  for (let falta = 0; falta <= META_ARRIBA; falta++) t[falta] = dist.reduce((a, p, s) => a + (s >= falta ? p : 0), 0);
  P_BONO.push(t);
}
const MEDIA_REPARTO = REPARTO.reduce((a, p, k) => a + p * k, 0);
const pBono = (arriba: number, mask: number) => (arriba >= META_ARRIBA ? 1 : P_BONO[mask][META_ARRIBA - arriba]);

// ---------------------------------------------------------------------------
// Valoración de anotar la casilla b con la mano d: puntos de hoy + cambio en el bono − lo que la casilla
// valdría si se dejara para después (costo de oportunidad).
interface Ajustes {
  /** Lo que vale en promedio cada casilla de abajo si se guarda para más adelante. */
  costoAbajo: Record<(typeof ABAJO)[number], number>;
  /** Peso del bono de arriba (0 = no le importa). */
  bono: number;
  /** Cuánto pesa el costo de oportunidad (0 = codicioso). */
  costo: number;
  /** Las casillas difíciles valen menos cuando quedan pocos turnos. */
  turnos: boolean;
}
const AJUSTES: Record<'normal' | 'dificil', Ajustes> = {
  dificil: {
    costoAbajo: { trio: 19, poker: 11, full: 20, esc_peq: 26, esc_gra: 29, dados: 15, chance: 21 },
    bono: 1,
    costo: 1,
    turnos: true,
  },
  normal: {
    costoAbajo: { trio: 17, poker: 9, full: 16, esc_peq: 22, esc_gra: 22, dados: 10, chance: 20 },
    bono: 0.3,
    costo: 0.2,
    turnos: false,
  },
};
/** Probabilidad por turno de lograr cada casilla difícil cuando se busca a ratos. */
const P_TURNO: Partial<Record<Casilla, number>> = { poker: 0.2, full: 0.22, esc_peq: 0.3, esc_gra: 0.2, dados: 0.03 };
const alcance = (p: number, turnos: number) => (1 - (1 - p) ** turnos) / (1 - (1 - p) ** 12);

interface Contexto {
  t: Tarjeta;
  /** Valor de cada casilla con cada mano (−Infinity si no se puede). */
  v0: Float64Array;
  mejor: Int8Array;
  forzado: Uint8Array;
}

/** V0: lo que vale terminar el turno con cada mano de 5 (la mejor casilla permitida). */
function valorar(e: EstadoDados, quien: Rol, aj: Ajustes, ganar: boolean): Contexto {
  const t = e.tarjetas[quien];
  const arriba = sumaArriba(t);
  let mask = 0;
  ARRIBA.forEach((c, i) => libre(t, c) && (mask |= 1 << i));
  const pAhora = pBono(arriba, mask);
  const quedan = 13 - llenas(t) - 1; // turnos que quedan después de este
  // Costo de dejar cada casilla libre para después
  const costo = new Float64Array(NC);
  CASILLAS.forEach((b, j) => {
    if (j < 6) costo[j] = MEDIA_REPARTO * (j + 1);
    else {
      const base = aj.costoAbajo[b as (typeof ABAJO)[number]];
      const p = P_TURNO[b];
      costo[j] = aj.turnos && p ? base * alcance(p, quedan) : base;
    }
    costo[j] *= aj.costo;
  });
  // Si ya anotó 50 en 5 iguales, otro 5 iguales trae +100 (y vale la pena buscarlo)
  const futuroDados = 100 * (1 - (1 - 0.025) ** quedan);
  // Final: si el otro ya terminó, se juega a ganar (probabilidad), no a sumar
  const rival = ganar ? totalDe(e, otro(quien)) : 0;
  const mio = ganar ? totalDe(e, quien) : 0;

  const v0 = new Float64Array(N).fill(-Infinity);
  const mejor = new Int8Array(N).fill(-1);
  const forzado = new Uint8Array(N);
  for (const d of CINCO) {
    const ops = opcionesDe(t, MANO[d]);
    const comodin = YATZI[d] && !libre(t, 'dados');
    forzado[d] = comodin ? 1 : 0;
    const extra = YATZI[d] && t.dados === 50 ? 100 : 0;
    for (const o of ops) {
      const j = CASILLAS.indexOf(o.casilla);
      let w: number;
      if (ganar) {
        let pts = o.valor + extra;
        if (j < 6 && arriba < META_ARRIBA && arriba + o.valor >= META_ARRIBA) pts += 35;
        const fin = mio + pts;
        w = (fin > rival ? 1 : fin === rival ? 0.5 : 0) * 1000 + pts;
      } else {
        w = o.valor + extra - costo[j];
        if (j < 6 && pAhora < 1) w += aj.bono * 35 * (pBono(arriba + o.valor, mask & ~(1 << j)) - pAhora);
        if (o.casilla === 'dados' && o.valor === 50) w += futuroDados * aj.costo;
      }
      if (w > v0[d]) {
        v0[d] = w;
        mejor[d] = j;
      }
    }
  }
  return { t, v0, mejor, forzado };
}

/** E[k]: valor esperado de guardar k y tirar el resto, sabiendo lo que vale cada mano después (r). */
function esperado(r: Float64Array): Float64Array {
  const E = new Float64Array(N);
  for (let k = 0; k < N; k++) {
    let s = 0;
    for (let i = trIni[k]; i < trIni[k + 1]; i++) s += TR_PROB[i] * r[TR_DEST[i]];
    E[k] = s;
  }
  return E;
}

/** R: valor de tener cada mano con un tiro más por delante (anotar ya o guardar lo mejor y tirar). */
function conTiro(ctx: Contexto, E: Float64Array): Float64Array {
  const R = new Float64Array(N);
  for (const d of CINCO) {
    let m = ctx.v0[d];
    if (!ctx.forzado[d]) for (let i = subIni[d]; i < subIni[d + 1]; i++) if (E[SUBS[i]] > m) m = E[SUBS[i]];
    R[d] = m;
  }
  return R;
}

const indiceMano = (d: readonly number[]) => INDICE[clave(conteo(d))];

/** Máscara de dados a guardar para quedarse con el multiconjunto k. */
function mascara(dados: readonly number[], k: number): boolean[] {
  const quiero = MULTI[k].slice();
  return dados.map((v) => (quiero[v] > 0 ? (quiero[v]--, true) : false));
}

function anotar(ctx: Contexto, d: number): MovDados {
  return { t: 'anotar', casilla: CASILLAS[ctx.mejor[d]] };
}

/** Juego fuerte (y el normal, con menos vista): expectimax sobre los tiros que quedan. */
function pensar(e: EstadoDados, aj: Ajustes, profundo: boolean, azar: () => number): MovDados {
  const quien = e.turno;
  if (e.tiradas === 0) return tirar(e, [false, false, false, false, false], azar);
  const ganar = profundo && llenas(e.tarjetas[quien]) === 12 && llenas(e.tarjetas[otro(quien)]) === 13;
  const ctx = valorar(e, quien, aj, ganar);
  const d = indiceMano(e.dados);
  if (!puedeTirar(e)) return anotar(ctx, d);
  const quedan = TIROS - e.tiradas;
  // E con (quedan − 1) tiros después del que se va a hacer
  let E = esperado(ctx.v0);
  if (profundo) for (let j = 1; j < quedan; j++) E = esperado(conTiro(ctx, E));
  let mejorK = -1;
  let mejorV = ctx.v0[d] + 1e-9;
  for (let i = subIni[d]; i < subIni[d + 1]; i++) {
    const k = SUBS[i];
    if (E[k] > mejorV) {
      mejorV = E[k];
      mejorK = k;
    }
  }
  if (mejorK < 0) return anotar(ctx, d);
  return tirar(e, mascara(e.dados, mejorK), azar);
}

// ---------------------------------------------------------------------------
// Suave: juega como alguien que apenas aprende (guarda lo repetido, anota lo que más da ahora)
function suave(e: EstadoDados, azar: () => number): MovDados {
  if (e.tiradas === 0) return tirar(e, [false, false, false, false, false], azar);
  const t = e.tarjetas[e.turno];
  const ops = opcionesDe(t, e.dados);
  const elegir = (): MovDados => {
    // Lo que más da ahora (con un empujoncito a las de arriba si hay 3 o más)
    const c = conteo(e.dados);
    const val = ops.map((o) => {
      const i = ARRIBA.indexOf(o.casilla as (typeof ARRIBA)[number]);
      return o.valor + (i >= 0 && c[i + 1] >= 3 ? 6 : 0) - (o.casilla === 'chance' ? 6 : 0) + azar() * 3;
    });
    const orden = ops.map((_, i) => i).sort((a, b) => val[b] - val[a]);
    // Descuido: a veces se va por la segunda o tercera opción
    const pick = azar() < 0.2 ? orden[Math.min(orden.length - 1, Math.floor(azar() * 3))] : orden[0];
    return { t: 'anotar', casilla: ops[pick].casilla };
  };
  if (!puedeTirar(e)) return elegir();
  // Se planta si ya tiene algo bueno
  const buena = ops.some((o) => ['full', 'esc_peq', 'esc_gra', 'dados'].includes(o.casilla) && o.valor > 0 && (o.casilla !== 'esc_peq' || azar() < 0.5));
  if (buena || (azar() < 0.1 && ops.some((o) => o.valor >= 20))) return elegir();
  const c = conteo(e.dados);
  let retener: boolean[];
  // Escalera de 4 a la vista y la grande libre: a veces la persigue
  const seguidos = [1, 2, 3].find((a) => c[a] && c[a + 1] && c[a + 2] && c[a + 3]);
  if (seguidos && libre(t, 'esc_gra') && azar() < 0.6) {
    const quiero = new Set([seguidos, seguidos + 1, seguidos + 2, seguidos + 3]);
    retener = e.dados.map((v) => quiero.delete(v));
  } else {
    let v = 6;
    for (let x = 6; x >= 1; x--) if (c[x] > c[v]) v = x;
    retener = c[v] >= 2 ? e.dados.map((x) => x === v) : e.dados.map((x) => x >= 5 && azar() < 0.5);
  }
  // Descuido: suelta o guarda un dado de más
  if (azar() < 0.12) {
    const i = Math.floor(azar() * 5);
    retener[i] = !retener[i];
  }
  if (retener.every(Boolean)) return elegir();
  return tirar(e, retener, azar);
}

export function iaDados(e: EstadoDados, nivel: NivelIA, azar: () => number): MovDados {
  if (nivel === 'facil') return suave(e, azar);
  if (nivel === 'normal') return pensar(e, AJUSTES.normal, false, azar);
  return pensar(e, AJUSTES.dificil, true, azar);
}

/** Para las pruebas: cambiar los ajustes de un nivel. */
export const _ajustes = AJUSTES;
