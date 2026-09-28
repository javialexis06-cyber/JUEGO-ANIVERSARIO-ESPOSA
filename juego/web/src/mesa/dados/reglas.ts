// Reglas de Dados Party: cinco dados, hasta tres tiros por turno y trece casillas por jugador.
// Puras y deterministas: los dados ya vienen tirados dentro del movimiento (los tira quien juega).
import { otro, type Rol } from '../../casa/modelo';
import type { Final, Reglas } from '../tipos';

export const ARRIBA = ['unos', 'doses', 'treses', 'cuatros', 'cincos', 'seises'] as const;
export const ABAJO = ['trio', 'poker', 'full', 'esc_peq', 'esc_gra', 'dados', 'chance'] as const;
export const CASILLAS = [...ARRIBA, ...ABAJO] as const;
export type Casilla = (typeof CASILLAS)[number];

/** Nombre en la tarjeta (corto, al estilo de Plato) y completo (ayuda, lectores de pantalla). */
export const NOMBRES: Record<Casilla, { corto: string; largo: string }> = {
  unos: { corto: '1', largo: 'Unos' },
  doses: { corto: '2', largo: 'Doses' },
  treses: { corto: '3', largo: 'Treses' },
  cuatros: { corto: '4', largo: 'Cuatros' },
  cincos: { corto: '5', largo: 'Cincos' },
  seises: { corto: '6', largo: 'Seises' },
  trio: { corto: '3X', largo: 'Trío' },
  poker: { corto: '4X', largo: 'Póker' },
  full: { corto: 'FH', largo: 'Full' },
  esc_peq: { corto: 'SM', largo: 'Escalera pequeña' },
  esc_gra: { corto: 'LG', largo: 'Escalera grande' },
  dados: { corto: '5X', largo: '5 iguales' },
  chance: { corto: 'CH', largo: 'Chance' },
};

export const TIROS = 3;
/** Bonificación superior: más de 62 en la sección de arriba. */
export const META_ARRIBA = 63;
export const BONO_ARRIBA = 35;
export const BONO_DADOS = 100;

/** Lo anotado por un jugador: casilla ausente = libre. */
export type Tarjeta = Partial<Record<Casilla, number>>;

export interface EstadoDados {
  turno: Rol;
  empieza: Rol;
  /** Los cinco dados (0 = aún sin tirar en este turno). */
  dados: number[];
  /** Qué dados quedaron guardados en el último tiro (siguen guardados hasta que se suelten). */
  retener: boolean[];
  /** Tiros hechos en este turno (0..3). */
  tiradas: number;
  tarjetas: Record<Rol, Tarjeta>;
  /** Puntos de bonificación de 5 iguales (+100 cada una). */
  extra: Record<Rol, number>;
}

/**
 * Tirar: `retener` dice qué dados se guardan y `dados` trae los cinco resultantes (los guardados iguales).
 * Anotar: la casilla elegida (con los dados actuales).
 */
export type MovDados = { t: 'tirar'; retener: boolean[]; dados: number[] } | { t: 'anotar'; casilla: Casilla };

// ---------------------------------------------------------------------------
// Combinaciones
export const conteo = (d: readonly number[]) => {
  const c = [0, 0, 0, 0, 0, 0, 0];
  for (const v of d) c[v]++;
  return c;
};
export const suma = (d: readonly number[]) => d.reduce((a, b) => a + b, 0);
export const cincoIguales = (d: readonly number[]) => d.length === 5 && d[0] >= 1 && d.every((v) => v === d[0]);

function escalera(c: number[], largo: number) {
  let seguidos = 0;
  for (let v = 1; v <= 6; v++) {
    seguidos = c[v] ? seguidos + 1 : 0;
    if (seguidos >= largo) return true;
  }
  return false;
}

/** Puntos de una casilla con estos dados. `comodin`: 5 iguales que valen como Full y escaleras. */
export function puntaje(casilla: Casilla, d: readonly number[], comodin = false): number {
  const c = conteo(d);
  const i = ARRIBA.indexOf(casilla as (typeof ARRIBA)[number]);
  if (i >= 0) return c[i + 1] * (i + 1);
  const max = Math.max(...c);
  switch (casilla) {
    case 'trio':
      return max >= 3 ? suma(d) : 0;
    case 'poker':
      return max >= 4 ? suma(d) : 0;
    case 'full':
      return comodin || (c.includes(3) && c.includes(2)) ? 25 : 0;
    case 'esc_peq':
      return comodin || escalera(c, 4) ? 30 : 0;
    case 'esc_gra':
      return comodin || escalera(c, 5) ? 40 : 0;
    case 'dados':
      return max === 5 ? 50 : 0;
    default:
      return suma(d);
  }
}

export const libre = (t: Tarjeta, c: Casilla) => t[c] === undefined;
export const llenas = (t: Tarjeta) => CASILLAS.filter((c) => t[c] !== undefined).length;
export const sumaArriba = (t: Tarjeta) => ARRIBA.reduce((a, c) => a + (t[c] ?? 0), 0);
export const bonoArriba = (t: Tarjeta) => (sumaArriba(t) >= META_ARRIBA ? BONO_ARRIBA : 0);

/** Comodín: 5 iguales cuando la casilla de 5 iguales ya se usó (con 50 o con 0). No se puede seguir tirando. */
export const hayComodin = (t: Tarjeta, d: readonly number[]) => cincoIguales(d) && !libre(t, 'dados');

export interface Opcion {
  casilla: Casilla;
  /** Lo que vale la casilla (sin la bonificación de +100). */
  valor: number;
}

/** Casillas donde se puede anotar con estos dados (reglas del comodín incluidas). */
export function opcionesDe(t: Tarjeta, d: readonly number[]): Opcion[] {
  const libres = CASILLAS.filter((c) => libre(t, c));
  if (!hayComodin(t, d)) return libres.map((casilla) => ({ casilla, valor: puntaje(casilla, d) }));
  const suya = ARRIBA[d[0] - 1];
  if (libre(t, suya)) return [{ casilla: suya, valor: puntaje(suya, d) }];
  const abajo = ABAJO.filter((c) => libre(t, c));
  if (abajo.length) return abajo.map((casilla) => ({ casilla, valor: puntaje(casilla, d, true) }));
  return libres.map((casilla) => ({ casilla, valor: 0 }));
}

/** +100 si salen 5 iguales y la casilla de 5 iguales ya tiene 50. */
export const bonoDados = (t: Tarjeta, d: readonly number[]) => (cincoIguales(d) && t.dados === 50 ? BONO_DADOS : 0);

export const totalDe = (e: EstadoDados, r: Rol) => {
  const t = e.tarjetas[r];
  return CASILLAS.reduce((a, c) => a + (t[c] ?? 0), 0) + bonoArriba(t) + e.extra[r];
};

/** Ronda (1..13) del jugador que tiene el turno. */
export const ronda = (e: EstadoDados) => Math.min(13, llenas(e.tarjetas[e.turno]) + 1);

/** ¿Puede tirar otra vez el que tiene el turno? */
export const puedeTirar = (e: EstadoDados) =>
  !terminada(e) && e.tiradas < TIROS && !(e.tiradas > 0 && hayComodin(e.tarjetas[e.turno], e.dados));

const terminada = (e: EstadoDados) => llenas(e.tarjetas.el) === 13 && llenas(e.tarjetas.ella) === 13;

/** Arma un tiro de verdad: los guardados se quedan y los demás salen de `azar`. */
export function tirar(e: EstadoDados, retener: boolean[], azar: () => number): MovDados {
  const r = e.tiradas === 0 ? [false, false, false, false, false] : retener.slice(0, 5);
  return { t: 'tirar', retener: r, dados: r.map((g, i) => (g ? e.dados[i] : 1 + Math.min(5, Math.floor(azar() * 6)))) };
}

/** Por qué un movimiento no vale (null si vale). */
export function problema(e: EstadoDados, m: MovDados): string | null {
  if (terminada(e)) return 'la partida ya terminó';
  if (!m || typeof m !== 'object') return 'movimiento raro';
  if (m.t === 'tirar') {
    if (!puedeTirar(e)) return 'no quedan tiros';
    if (!Array.isArray(m.retener) || m.retener.length !== 5 || !m.retener.every((g) => typeof g === 'boolean')) return 'retener raro';
    if (!Array.isArray(m.dados) || m.dados.length !== 5 || !m.dados.every((v) => Number.isInteger(v) && v >= 1 && v <= 6)) return 'dados raros';
    if (e.tiradas === 0 && m.retener.some(Boolean)) return 'en el primer tiro no se guarda nada';
    if (m.retener.every(Boolean)) return 'hay que tirar al menos un dado';
    if (m.retener.some((g, i) => g && m.dados[i] !== e.dados[i])) return 'un dado guardado cambió';
    return null;
  }
  if (m.t === 'anotar') {
    if (e.tiradas === 0) return 'primero hay que tirar';
    if (!opcionesDe(e.tarjetas[e.turno], e.dados).some((o) => o.casilla === m.casilla)) return 'esa casilla no se puede usar';
    return null;
  }
  return 'movimiento desconocido';
}

export const reglas: Reglas<EstadoDados, MovDados> = {
  inicial(empieza) {
    return {
      turno: empieza,
      empieza,
      dados: [0, 0, 0, 0, 0],
      retener: [false, false, false, false, false],
      tiradas: 0,
      tarjetas: { el: {}, ella: {} },
      extra: { el: 0, ella: 0 },
    };
  },
  turno: (e) => e.turno,
  /**
   * Anotar: todas las casillas legales. Tirar: uno por cada forma de guardar los dados, con los guardados
   * puestos y 0 en los que se tiran (de muestra: el tiro de verdad se arma con `tirar(e, retener, azar)`).
   */
  movimientos(e) {
    if (terminada(e)) return [];
    const ms: MovDados[] = [];
    if (puedeTirar(e)) {
      const n = e.tiradas === 0 ? 1 : 31;
      for (let k = 0; k < n; k++) {
        const retener = [0, 1, 2, 3, 4].map((i) => ((k >> i) & 1) === 1);
        ms.push({ t: 'tirar', retener, dados: retener.map((g, i) => (g ? e.dados[i] : 0)) });
      }
    }
    if (e.tiradas > 0) for (const o of opcionesDe(e.tarjetas[e.turno], e.dados)) ms.push({ t: 'anotar', casilla: o.casilla });
    return ms;
  },
  aplicar(e, m) {
    const mal = problema(e, m);
    if (mal) throw new Error(`Dados Party: movimiento ilegal (${mal})`);
    if (m.t === 'tirar') return { ...e, dados: m.dados.slice(), retener: m.retener.slice(), tiradas: e.tiradas + 1 };
    const quien = e.turno;
    const t = e.tarjetas[quien];
    const valor = opcionesDe(t, e.dados).find((o) => o.casilla === m.casilla)!.valor;
    const extra = { ...e.extra, [quien]: e.extra[quien] + bonoDados(t, e.dados) };
    return {
      ...e,
      turno: otro(quien),
      dados: [0, 0, 0, 0, 0],
      retener: [false, false, false, false, false],
      tiradas: 0,
      tarjetas: { ...e.tarjetas, [quien]: { ...t, [m.casilla]: valor } },
      extra,
    };
  },
  puntos: (e) => ({ el: totalDe(e, 'el'), ella: totalDe(e, 'ella') }),
  fin(e) {
    if (!terminada(e)) return null;
    const puntos = reglas.puntos(e);
    return { ganador: puntos.el > puntos.ella ? 'el' : puntos.ella > puntos.el ? 'ella' : null, puntos } satisfies Final;
  },
};
