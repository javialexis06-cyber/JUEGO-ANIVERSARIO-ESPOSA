// Parchís para dos tal cual está en docs/juegos-mesa.md: la vuelta clásica de 68 casillas con 12 seguros, pasillo
// de 7 casillas y la meta. Se juega de dos maneras:
// - Un color cada uno: 4 fichas en esquinas opuestas y un dado (el 6 repite, tres seises castigan).
// - Dos colores cada uno: 8 fichas (Él azul y amarillo, Ella rosado y verde) y dos dados que caen al centro;
//   cada dado mueve una ficha, se sale con un 5 (o si los dos suman 5) y los pares repiten.
// Los dados los tira quien juega y viajan dentro del movimiento; los premios de 20 y 10 se cuentan aparte.
import { otro, type Rol } from '../../casa/modelo';
import type { Final, Reglas } from '../tipos';

/**
 * Cada ficha se guarda contada desde la salida de SU color: -1 en casa, 0..63 en la vuelta (0 = su salida,
 * 63 = la punta de su brazo, donde entra al pasillo), 64..70 el pasillo y 71 la meta.
 * Con dos colores, las fichas 0..3 son del primer color y las 4..7 del segundo.
 */
export const CASA = -1;
export const ENTRADA = 63;
export const META = 71;
export const VUELTA = 68;
export const FICHAS = 4;
/** Casilla de la vuelta (0..67, la 1 del tablero clásico es la 0) donde sale el primer color de cada uno. */
export const SALIDA: Record<Rol, number> = { el: 21, ella: 55 };
/** Salidas de los dos colores de cada uno (el segundo solo cuenta jugando con dos colores). */
export const SALIDAS: Record<Rol, [number, number]> = { el: [21, 4], ella: [55, 38] };
/** Seguros: las cuatro salidas (4, 21, 38, 55) y las ocho marcadas. */
export const SEGUROS = new Set([4, 11, 16, 21, 28, 33, 38, 45, 50, 55, 62, 67]);
export const PREMIO_COMER = 20;
export const PREMIO_META = 10;
const ROLES: Rol[] = ['el', 'ella'];

export interface EstadoParchis {
  /** Colores de cada uno: 1 (4 fichas, un dado) o 2 (8 fichas, dos dados). Sin el campo, 1. */
  colores?: 1 | 2;
  fichas: Record<Rol, number[]>;
  turno: Rol;
  /** 'tirar': toca tirar. 'mover': toca mover con los dados (o con el premio si `bono` > 0). */
  fase: 'tirar' | 'mover';
  /** Último dado tirado (0 al empezar). Con dos colores, el primero de los dos. */
  dado: number;
  /** Con dos colores: los dos dados de la tirada y cuáles ya se usaron. */
  dados?: [number, number];
  usados?: [boolean, boolean];
  /** Seises seguidos en este turno (con dos colores, pares seguidos). */
  seises: number;
  /** Premio por contar (20 por comer, 10 por llegar a la meta); 0 si no hay. */
  bono: number;
  /** Última ficha movida en este turno (-1 ninguna): la que se castiga con el tercer seis (o par). */
  ultima: number;
}

export type MovParchis =
  /** Tirada: `dado` y, con dos colores, `dado2`. */
  | { t: 'tirar'; dado: number; dado2?: number }
  /**
   * Mueve la ficha `ficha` `pasos` casillas (sacarla de casa también cuenta como `pasos` = 5). Con dos colores,
   * `cual` dice con qué dado (0 o 1, o 2 = los dos, para salir cuando suman 5); sin `cual` se cuenta el premio.
   */
  | { t: 'mover'; ficha: number; pasos: number; cual?: 0 | 1 | 2 }
  /** No hay con qué mover: pasa (o se pierde el premio). */
  | { t: 'pasar' };

export const dosColores = (e: EstadoParchis) => e.colores === 2;
/** De cuál de sus dos colores es la ficha `i` (0 o 1). */
export const colorDe = (i: number) => (i >= FICHAS ? 1 : 0);
/** Casilla de la vuelta (0..67) de la ficha `i` de `r` que va en `p` (0..63). */
export const absoluta = (r: Rol, p: number, i = 0) => (SALIDAS[r][colorDe(i)] + p) % VUELTA;
export const enVuelta = (p: number) => p >= 0 && p <= ENTRADA;

/** Cuántas fichas de cada uno hay en cada casilla de la vuelta: [a * 2] Él, [a * 2 + 1] Ella. */
export function mapa(e: EstadoParchis): Uint8Array {
  const m = new Uint8Array(VUELTA * 2);
  for (const r of ROLES) e.fichas[r].forEach((p, i) => {
    if (enVuelta(p)) m[absoluta(r, p, i) * 2 + (r === 'el' ? 0 : 1)]++;
  });
  return m;
}
const cuantas = (m: Uint8Array, a: number, r: Rol) => m[a * 2 + (r === 'el' ? 0 : 1)];
/** Dos fichas del mismo jugador en la casilla: no pasa nadie. */
export const esBarrera = (m: Uint8Array, a: number) => m[a * 2] === 2 || m[a * 2 + 1] === 2;

export interface Destino {
  /** Casilla (relativa) donde queda. */
  q: number;
  /** Ficha del otro que se come (-1 ninguna). */
  come: number;
}

/**
 * A dónde llega la ficha `i` de `r` contando `pasos` (desde casa, `pasos` = 5 la saca), o null si no puede:
 * se topa con una barrera, se pasa de la meta o la casilla ya está llena.
 */
export function destino(e: EstadoParchis, r: Rol, i: number, pasos: number, m = mapa(e)): Destino | null {
  const p = e.fichas[r][i];
  const o = otro(r);
  if (p === META) return null;
  if (p === CASA) {
    if (pasos !== 5) return null;
    const a = absoluta(r, 0, i);
    if (cuantas(m, a, r) >= 2) return null;
    // Quien sale come a la del otro que esté en su salida (aunque sea seguro)
    return { q: 0, come: cuantas(m, a, o) > 0 ? victima(e, o, a) : -1 };
  }
  const q = p + pasos;
  if (q > META) return null;
  for (let s = p + 1; s <= Math.min(q, ENTRADA); s++) if (esBarrera(m, absoluta(r, s, i))) return null;
  if (q <= ENTRADA) {
    const a = absoluta(r, q, i);
    const mias = cuantas(m, a, r), suyas = cuantas(m, a, o);
    if (mias + suyas >= 2) return null;
    if (suyas === 1 && !SEGUROS.has(a)) return { q, come: victima(e, o, a) };
    return { q, come: -1 };
  }
  // Pasillo (cada color tiene el suyo): caben dos por casilla; la meta recibe a todas
  if (q < META && e.fichas[r].filter((x, k) => x === q && colorDe(k) === colorDe(i)).length >= 2) return null;
  return { q, come: -1 };
}

function victima(e: EstadoParchis, o: Rol, a: number) {
  return e.fichas[o].findIndex((p, k) => enVuelta(p) && absoluta(o, p, k) === a);
}

/** ¿La ficha `i` de `r` hace barrera con otra suya? */
export function enBarrera(r: Rol, f: readonly number[], i: number) {
  const p = f[i];
  if (!enVuelta(p)) return false;
  const a = absoluta(r, p, i);
  return f.filter((x, k) => enVuelta(x) && absoluta(r, x, k) === a).length >= 2;
}

/** Casillas que cuenta el dado (un color): el 6 vale 7 si ya no le quedan fichas en casa. */
export const pasosDelDado = (e: EstadoParchis) => (e.dado === 6 && !e.fichas[e.turno].includes(CASA) ? 7 : e.dado);

function movsDado(e: EstadoParchis): MovParchis[] {
  const r = e.turno;
  const f = e.fichas[r];
  const m = mapa(e);
  if (e.dado === 5 && f.includes(CASA)) {
    // Con un 5 hay que sacar ficha si la salida lo permite
    const salen: MovParchis[] = [];
    f.forEach((p, i) => {
      if (p === CASA && destino(e, r, i, 5, m)) salen.push({ t: 'mover', ficha: i, pasos: 5 });
    });
    if (salen.length) return salen;
  }
  const pasos = pasosDelDado(e);
  const movs: { t: 'mover'; ficha: number; pasos: number }[] = [];
  f.forEach((p, i) => {
    if (p !== CASA && p !== META && destino(e, r, i, pasos, m)) movs.push({ t: 'mover', ficha: i, pasos });
  });
  if (e.dado === 6) {
    // Con un 6 hay que abrir la barrera propia si se puede
    const abren = movs.filter((mv) => enBarrera(r, f, mv.ficha));
    if (abren.length) return abren;
  }
  return movs;
}

/** Con dos colores: cada dado que falta mueve una ficha; con un 5 hay que sacar si se puede. */
function movsDados(e: EstadoParchis): MovParchis[] {
  const r = e.turno;
  const f = e.fichas[r];
  const m = mapa(e);
  const [a, b] = e.dados ?? [0, 0];
  const usados = e.usados ?? [true, true];
  const salenCon = (cual: 0 | 1 | 2): MovParchis[] => {
    // Una sola ficha por casa (las de un mismo color en casa son iguales)
    const out: MovParchis[] = [];
    const vistas = new Set<number>();
    f.forEach((p, i) => {
      if (p === CASA && !vistas.has(colorDe(i)) && destino(e, r, i, 5, m)) {
        vistas.add(colorDe(i));
        out.push({ t: 'mover', ficha: i, pasos: 5, cual });
      }
    });
    return out;
  };
  const movs: MovParchis[] = [];
  for (const cual of [0, 1] as const) {
    if (usados[cual]) continue;
    const d = cual === 0 ? a : b;
    // Par: los dos dados dan lo mismo, se ofrece solo el primero que falte
    if (cual === 1 && !usados[0] && a === b) continue;
    if (d === 5) {
      const salen = salenCon(cual);
      if (salen.length) {
        movs.push(...salen);
        continue;
      }
    }
    f.forEach((p, i) => {
      if (p !== CASA && p !== META && destino(e, r, i, d, m)) movs.push({ t: 'mover', ficha: i, pasos: d, cual });
    });
  }
  // Los dos dados suman 5 (1 y 4, 2 y 3): también se puede sacar con los dos
  if (!usados[0] && !usados[1] && a !== 5 && b !== 5 && a + b === 5) movs.push(...salenCon(2));
  return movs;
}

function movsBono(e: EstadoParchis): MovParchis[] {
  const r = e.turno;
  const m = mapa(e);
  const movs: MovParchis[] = [];
  e.fichas[r].forEach((p, i) => {
    if (p !== CASA && p !== META && destino(e, r, i, e.bono, m)) movs.push({ t: 'mover', ficha: i, pasos: e.bono });
  });
  return movs;
}

const clonar = (e: EstadoParchis): EstadoParchis => ({
  ...e,
  fichas: { el: e.fichas.el.slice(), ella: e.fichas.ella.slice() },
  ...(e.dados ? { dados: [...e.dados] as [number, number] } : {}),
  ...(e.usados ? { usados: [...e.usados] as [boolean, boolean] } : {}),
});

function cambiarTurno(s: EstadoParchis): EstadoParchis {
  s.turno = otro(s.turno);
  s.fase = 'tirar';
  s.seises = 0;
  s.bono = 0;
  s.ultima = -1;
  if (dosColores(s)) s.usados = [true, true];
  return s;
}
/** ¿La tirada da para repetir? (un seis, o un par con dos dados). */
const repite = (s: EstadoParchis) => (dosColores(s) ? !!s.dados && s.dados[0] === s.dados[1] : s.dado === 6);
/** Terminó la jugada de los dados (y sus premios): con un 6 (o un par) vuelve a tirar, si no le toca al otro. */
function seguir(s: EstadoParchis): EstadoParchis {
  if (!repite(s)) return cambiarTurno(s);
  s.fase = 'tirar';
  if (dosColores(s)) s.usados = [true, true];
  return s;
}
/** Con dos colores: ¿queda algún dado sin usar? */
const quedanDados = (s: EstadoParchis) => dosColores(s) && !!s.usados && (!s.usados[0] || !s.usados[1]);

export const enMeta = (e: EstadoParchis, r: Rol) => e.fichas[r].filter((p) => p === META).length;
/** Casillas recorridas por las fichas de `r` (salir = 1, meta = 72 cada una). */
export const recorrido = (e: EstadoParchis, r: Rol) => e.fichas[r].reduce((s, p) => s + (p === CASA ? 0 : p + 1), 0);

/** Estado inicial con uno o dos colores por jugador. */
export function inicialCon(empieza: Rol, colores: 1 | 2): EstadoParchis {
  const n = FICHAS * colores;
  const e: EstadoParchis = {
    fichas: { el: Array<number>(n).fill(CASA), ella: Array<number>(n).fill(CASA) }, turno: empieza, fase: 'tirar', dado: 0, seises: 0, bono: 0, ultima: -1,
  };
  if (colores === 2) Object.assign(e, { colores: 2, dados: [0, 0], usados: [true, true] });
  return e;
}

const aDado = (d: number) => Math.min(6, Math.max(1, Math.round(d) || 1));

export const reglas: Reglas<EstadoParchis, MovParchis> = {
  inicial: (empieza) => inicialCon(empieza, 1),
  turno: (e) => e.turno,
  movimientos(e) {
    if (reglas.fin(e)) return [];
    if (e.fase === 'tirar') {
      if (!dosColores(e)) return [1, 2, 3, 4, 5, 6].map((dado): MovParchis => ({ t: 'tirar', dado }));
      const out: MovParchis[] = [];
      for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) out.push({ t: 'tirar', dado: a, dado2: b });
      return out;
    }
    const movs = e.bono > 0 ? movsBono(e) : dosColores(e) ? movsDados(e) : movsDado(e);
    return movs.length ? movs : [{ t: 'pasar' }];
  },
  aplicar(e, mv) {
    const s = clonar(e);
    const r = s.turno;
    const dos = dosColores(s);
    if (mv.t === 'tirar') {
      s.dado = aDado(mv.dado);
      if (dos) {
        s.dados = [s.dado, aDado(mv.dado2 ?? mv.dado)];
        s.usados = [false, false];
      }
      s.seises = repite(s) ? s.seises + 1 : 0;
      if (s.seises >= 3) {
        // Tres seises (o tres pares): la última ficha movida vuelve a casa (salvo si ya va por el pasillo o llegó)
        if (s.ultima >= 0 && enVuelta(s.fichas[r][s.ultima])) s.fichas[r][s.ultima] = CASA;
        return cambiarTurno(s);
      }
      s.fase = 'mover';
      return s;
    }
    if (mv.t === 'mover') {
      // El premio se cuenta antes que los dados que falten
      const conPremio = e.bono > 0;
      if (dos && !conPremio && s.usados) {
        if (mv.cual === 2) s.usados = [true, true];
        else s.usados[mv.cual ?? 0] = true;
      }
      const d = destino(e, r, mv.ficha, mv.pasos);
      if (!d) {
        s.bono = 0;
        return quedanDados(s) ? s : seguir(s);
      }
      s.fichas[r][mv.ficha] = d.q;
      if (d.come >= 0) s.fichas[otro(r)][d.come] = CASA;
      s.ultima = mv.ficha;
      s.bono = d.come >= 0 ? PREMIO_COMER : d.q === META ? PREMIO_META : 0;
      if (s.bono > 0 || quedanDados(s)) {
        s.fase = 'mover';
        return s;
      }
      return seguir(s);
    }
    // Pasar: se pierde el premio (y siguen los dados que falten) o se pierden los dados
    if (s.bono > 0) {
      s.bono = 0;
      if (quedanDados(s)) return s;
      return seguir(s);
    }
    if (dos) s.usados = [true, true];
    return seguir(s);
  },
  puntos(e) {
    // Qué tanto del camino llevan (100 = todas en la meta)
    const total = e.fichas.el.length * (META + 1);
    return { el: Math.floor((recorrido(e, 'el') * 100) / total), ella: Math.floor((recorrido(e, 'ella') * 100) / total) };
  },
  fin(e): Final | null {
    const g = ROLES.find((r) => enMeta(e, r) === e.fichas[r].length);
    return g ? { ganador: g, puntos: reglas.puntos(e) } : null;
  },
};

/** Las mismas reglas empezando con dos colores cada uno. */
export const reglas2: Reglas<EstadoParchis, MovParchis> = { ...reglas, inicial: (empieza) => inicialCon(empieza, 2) };
