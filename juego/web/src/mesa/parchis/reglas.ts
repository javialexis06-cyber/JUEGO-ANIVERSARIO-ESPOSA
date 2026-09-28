// Parchís para dos tal cual está en docs/juegos-mesa.md: la vuelta clásica de 68 casillas con 12 seguros,
// cada uno con 4 fichas en esquinas opuestas, un dado, pasillo de 7 casillas y la meta.
// El dado lo tira quien juega y viaja dentro del movimiento; los premios de 20 y 10 se cuentan aparte.
import { otro, type Rol } from '../../casa/modelo';
import type { Final, Reglas } from '../tipos';

/**
 * Cada ficha se guarda contada desde SU salida: -1 en casa, 0..63 en la vuelta (0 = su salida,
 * 63 = la punta de su brazo, donde entra al pasillo), 64..70 el pasillo y 71 la meta.
 */
export const CASA = -1;
export const ENTRADA = 63;
export const META = 71;
export const VUELTA = 68;
export const FICHAS = 4;
/** Casilla de la vuelta (0..67, la 1 del tablero clásico es la 0) donde sale cada uno: esquinas opuestas. */
export const SALIDA: Record<Rol, number> = { el: 21, ella: 55 };
/** Seguros: las cuatro salidas (4, 21, 38, 55) y las ocho marcadas. */
export const SEGUROS = new Set([4, 11, 16, 21, 28, 33, 38, 45, 50, 55, 62, 67]);
export const PREMIO_COMER = 20;
export const PREMIO_META = 10;
const ROLES: Rol[] = ['el', 'ella'];

export interface EstadoParchis {
  fichas: Record<Rol, number[]>;
  turno: Rol;
  /** 'tirar': toca tirar el dado. 'mover': toca mover con el dado (o con el premio si `bono` > 0). */
  fase: 'tirar' | 'mover';
  /** Último dado tirado (0 al empezar). */
  dado: number;
  /** Seises seguidos en este turno. */
  seises: number;
  /** Premio por contar (20 por comer, 10 por llegar a la meta); 0 si no hay. */
  bono: number;
  /** Última ficha movida en este turno (-1 ninguna): la que se castiga con el tercer seis. */
  ultima: number;
}

export type MovParchis =
  | { t: 'tirar'; dado: number }
  /** Mueve la ficha `ficha` `pasos` casillas (sacarla de casa también cuenta como `pasos` = 5). */
  | { t: 'mover'; ficha: number; pasos: number }
  /** No hay con qué mover: pasa (o se pierde el premio). */
  | { t: 'pasar' };

/** Casilla de la vuelta (0..67) de una ficha de `r` que va en `p` (0..63). */
export const absoluta = (r: Rol, p: number) => (SALIDA[r] + p) % VUELTA;
export const enVuelta = (p: number) => p >= 0 && p <= ENTRADA;

/** Cuántas fichas de cada uno hay en cada casilla de la vuelta: [a * 2] Él, [a * 2 + 1] Ella. */
export function mapa(e: EstadoParchis): Uint8Array {
  const m = new Uint8Array(VUELTA * 2);
  for (const r of ROLES) for (const p of e.fichas[r]) if (enVuelta(p)) m[absoluta(r, p) * 2 + (r === 'el' ? 0 : 1)]++;
  return m;
}
const cuantas = (m: Uint8Array, a: number, r: Rol) => m[a * 2 + (r === 'el' ? 0 : 1)];
/** Dos fichas del mismo color en la casilla: no pasa nadie. */
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
    const a = SALIDA[r];
    if (cuantas(m, a, r) >= 2) return null;
    // Quien sale come a la del otro que esté en su salida (aunque sea seguro)
    return { q: 0, come: cuantas(m, a, o) > 0 ? victima(e, o, a) : -1 };
  }
  const q = p + pasos;
  if (q > META) return null;
  for (let s = p + 1; s <= Math.min(q, ENTRADA); s++) if (esBarrera(m, absoluta(r, s))) return null;
  if (q <= ENTRADA) {
    const a = absoluta(r, q);
    const mias = cuantas(m, a, r), suyas = cuantas(m, a, o);
    if (mias + suyas >= 2) return null;
    if (suyas === 1 && !SEGUROS.has(a)) return { q, come: victima(e, o, a) };
    return { q, come: -1 };
  }
  // Pasillo: caben dos por casilla; la meta recibe a todas
  if (q < META && e.fichas[r].filter((x) => x === q).length >= 2) return null;
  return { q, come: -1 };
}

function victima(e: EstadoParchis, o: Rol, a: number) {
  return e.fichas[o].findIndex((p) => enVuelta(p) && absoluta(o, p) === a);
}

/** ¿La ficha que va en `p` hace barrera con otra suya? */
export const enBarrera = (f: readonly number[], p: number) => enVuelta(p) && f.filter((x) => x === p).length >= 2;

/** Casillas que cuenta el dado: el 6 vale 7 si ya no le quedan fichas en casa. */
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
    const abren = movs.filter((mv) => enBarrera(f, f[mv.ficha]));
    if (abren.length) return abren;
  }
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

const clonar = (e: EstadoParchis): EstadoParchis => ({ ...e, fichas: { el: e.fichas.el.slice(), ella: e.fichas.ella.slice() } });

function cambiarTurno(s: EstadoParchis): EstadoParchis {
  s.turno = otro(s.turno);
  s.fase = 'tirar';
  s.seises = 0;
  s.bono = 0;
  s.ultima = -1;
  return s;
}
/** Terminó la jugada del dado (y su premio): con un 6 vuelve a tirar, si no le toca al otro. */
function seguir(s: EstadoParchis): EstadoParchis {
  if (s.dado !== 6) return cambiarTurno(s);
  s.fase = 'tirar';
  return s;
}

export const enMeta = (e: EstadoParchis, r: Rol) => e.fichas[r].filter((p) => p === META).length;
/** Casillas recorridas por las cuatro fichas (salir = 1, meta = 72 cada una). */
export const recorrido = (e: EstadoParchis, r: Rol) => e.fichas[r].reduce((s, p) => s + (p === CASA ? 0 : p + 1), 0);

export const reglas: Reglas<EstadoParchis, MovParchis> = {
  inicial(empieza) {
    return { fichas: { el: [CASA, CASA, CASA, CASA], ella: [CASA, CASA, CASA, CASA] }, turno: empieza, fase: 'tirar', dado: 0, seises: 0, bono: 0, ultima: -1 };
  },
  turno: (e) => e.turno,
  movimientos(e) {
    if (reglas.fin(e)) return [];
    if (e.fase === 'tirar') return [1, 2, 3, 4, 5, 6].map((dado): MovParchis => ({ t: 'tirar', dado }));
    const movs = e.bono > 0 ? movsBono(e) : movsDado(e);
    return movs.length ? movs : [{ t: 'pasar' }];
  },
  aplicar(e, mv) {
    const s = clonar(e);
    const r = s.turno;
    if (mv.t === 'tirar') {
      s.dado = Math.min(6, Math.max(1, Math.round(mv.dado)));
      s.seises = s.dado === 6 ? s.seises + 1 : 0;
      if (s.seises >= 3) {
        // Tres seises: la última ficha movida vuelve a casa (salvo si ya va por el pasillo o llegó)
        if (s.ultima >= 0 && enVuelta(s.fichas[r][s.ultima])) s.fichas[r][s.ultima] = CASA;
        return cambiarTurno(s);
      }
      s.fase = 'mover';
      return s;
    }
    if (mv.t === 'mover') {
      const d = destino(e, r, mv.ficha, mv.pasos);
      if (!d) {
        s.bono = 0;
        return seguir(s);
      }
      s.fichas[r][mv.ficha] = d.q;
      if (d.come >= 0) s.fichas[otro(r)][d.come] = CASA;
      s.ultima = mv.ficha;
      s.bono = d.come >= 0 ? PREMIO_COMER : d.q === META ? PREMIO_META : 0;
      if (s.bono > 0) {
        s.fase = 'mover';
        return s;
      }
      return seguir(s);
    }
    s.bono = 0;
    return seguir(s);
  },
  puntos(e) {
    // Qué tanto del camino llevan (100 = las cuatro en la meta)
    return { el: Math.floor((recorrido(e, 'el') * 100) / (FICHAS * (META + 1))), ella: Math.floor((recorrido(e, 'ella') * 100) / (FICHAS * (META + 1))) };
  },
  fin(e): Final | null {
    const g = ROLES.find((r) => enMeta(e, r) === FICHAS);
    return g ? { ganador: g, puntos: reglas.puntos(e) } : null;
  },
};
