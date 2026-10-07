// Reglas de «¿Quién fue?» (el Clue clásico en su variante oficial para dos): el sobre con quién, con qué y dónde;
// 4 cartas boca abajo en los cuartos de las esquinas (las mira quien entra) y 7 para cada uno; dos dados, pasillos,
// puertas y pasadizos; sospechas que el otro desmiente mostrando una carta en secreto; una sola acusación.
// Reglas puras: el reparto y los dados vienen dentro de las jugadas (los tira quien juega), así los dos celulares
// llegan al mismo estado con solo mandarse las jugadas. Las cartas secretas viajan en el estado (es un juego de
// pareja: lo que se esconde es lo que pinta la vista).
import { otro, type Rol } from '../../casa/modelo';
import type { Final, Reglas } from '../tipos';
import { CUARTO, CUARTOS, ESQUINAS, INICIO, alcance, enCuarto, mismoLugar, type IdCuarto, type Lugar } from './tablero';

export type IdSospechoso = 'fresa' | 'maracuya' | 'arepa' | 'aguacate' | 'arandano' | 'mora';
export type IdArma = 'chancla' | 'rodillo' | 'olla' | 'control' | 'escoba' | 'matera';
export type Carta = IdSospechoso | IdArma | IdCuarto;
export type Tipo = 'sospechoso' | 'arma' | 'cuarto';

export const SOSPECHOSOS: { id: IdSospechoso; nombre: string; color: string; quien: string }[] = [
  { id: 'fresa', nombre: 'Señorita Fresa', color: '#e4574b', quien: 'Actriz de telenovela: llora cuando la miran.' },
  { id: 'maracuya', nombre: 'Coronel Maracuyá', color: '#f2b632', quien: 'Militar retirado de bigote enorme.' },
  { id: 'arepa', nombre: 'Doña Arepa', color: '#f4efe6', quien: 'La cocinera: se sabe todos los chismes.' },
  { id: 'aguacate', nombre: 'Don Aguacate', color: '#5aa94c', quien: 'El jardinero, con tierra hasta en las cejas.' },
  { id: 'arandano', nombre: 'Señora Arándano', color: '#4f8fe0', quien: 'La diva rica, con abanico y perlas.' },
  { id: 'mora', nombre: 'Profe Mora', color: '#8a4fc2', quien: 'Profesor de química, gafotas y bata.' },
];
export const ARMAS: { id: IdArma; nombre: string; porque: string }[] = [
  { id: 'chancla', nombre: 'La chancla', porque: 'El arma más temida de Colombia.' },
  { id: 'rodillo', nombre: 'El rodillo', porque: 'El de amasar las arepas.' },
  { id: 'olla', nombre: 'La olla exprés', porque: 'Pita antes del golpe.' },
  { id: 'control', nombre: 'El control de la tele', porque: 'Nadie lo suelta.' },
  { id: 'escoba', nombre: 'La escoba', porque: 'También sirve para barrer.' },
  { id: 'matera', nombre: 'La matera', porque: 'Se cayó «sola» del balcón.' },
];
export const IDS_SOSPECHOSOS = SOSPECHOSOS.map((s) => s.id);
export const IDS_ARMAS = ARMAS.map((a) => a.id);
export const IDS_CUARTOS = CUARTOS.map((c) => c.id);
export const TODAS: Carta[] = [...IDS_SOSPECHOSOS, ...IDS_ARMAS, ...IDS_CUARTOS];

export function tipoDe(c: Carta): Tipo {
  return (IDS_SOSPECHOSOS as string[]).includes(c) ? 'sospechoso' : (IDS_ARMAS as string[]).includes(c) ? 'arma' : 'cuarto';
}
export function nombreCarta(c: Carta): string {
  const t = tipoDe(c);
  return t === 'sospechoso' ? SOSPECHOSOS.find((s) => s.id === c)!.nombre : t === 'arma' ? ARMAS.find((a) => a.id === c)!.nombre : CUARTO[c as IdCuarto].nombre;
}

/** Una sospecha y cómo terminó (para el cuaderno de cada uno y para la IA). */
export interface Sospecha {
  quien: Rol;
  s: IdSospechoso;
  a: IdArma;
  c: IdCuarto;
  /** ¿El otro la desmintió? */
  desmentida: boolean;
  /** La carta que mostró (solo la ve quien preguntó). */
  carta: Carta | null;
}

export type Fase =
  /** Antes de empezar: quien empieza reparte (la jugada lleva el reparto). */
  | 'repartir'
  /** Empieza el turno: tirar los dados, el pasadizo o acusar. */
  | 'turno'
  /** Ya tiró: escoger a dónde caminar. */
  | 'mover'
  /** Llegó a un cuarto: sospechar (o no) y acusar si quiere. */
  | 'sospechar'
  /** El otro escoge qué carta mostrar. */
  | 'mostrar'
  /** Ya vio (o no) la carta: acusar o terminar el turno. */
  | 'despues';

export interface EstadoClue {
  fase: Fase;
  /** El detective del turno (en «mostrar», el turno lo tiene quien muestra: ver `turno`). */
  activo: Rol;
  empieza: Rol;
  sobre: { s: IdSospechoso; a: IdArma; c: IdCuarto } | null;
  manos: Record<Rol, Carta[]>;
  /** Las cartas boca abajo de las esquinas (variante para dos). */
  bocaAbajo: Partial<Record<IdCuarto, Carta>>;
  /** Qué cartas boca abajo ya miró cada uno (por cuarto). */
  miradas: Record<Rol, IdCuarto[]>;
  pos: Record<Rol, Lugar>;
  /** Dónde está la figurita de cada sospechoso y cada arma. */
  sospechosos: Record<IdSospechoso, IdCuarto>;
  armas: Record<IdArma, IdCuarto>;
  /** Los dos dados que sacó (se camina la suma). */
  dados: [number, number] | null;
  /** Desde dónde arrancó a caminar este turno (no se vuelve al mismo cuarto). */
  desde: Lugar | null;
  /** En qué cuarto sospechó la última vez sin haber salido (no se repite sin salir). */
  sospechoEn: Record<Rol, IdCuarto | null>;
  sospechas: Sospecha[];
  /** Qué cartas le ha mostrado cada uno al otro (la IA prefiere repetir las mismas). */
  mostradas: Record<Rol, Carta[]>;
  acusacion: { quien: Rol; s: IdSospechoso; a: IdArma; c: IdCuarto; acerto: boolean } | null;
  ganador: Rol | null;
  /** Turnos jugados (para el marcador y la IA). */
  turnos: number;
}

export type MovClue =
  | { t: 'repartir'; sobre: { s: IdSospechoso; a: IdArma; c: IdCuarto }; bocaAbajo: Partial<Record<IdCuarto, Carta>>; manos: Record<Rol, Carta[]>; sospechosos: Record<IdSospechoso, IdCuarto>; armas: Record<IdArma, IdCuarto> }
  | { t: 'tirar'; dados: [number, number] }
  /** La máquina tira y camina en una sola jugada (la mesa hace esperar entre jugadas de la IA). */
  | { t: 'tirar_ir'; dados: [number, number]; a: Lugar }
  | { t: 'ir'; a: Lugar }
  | { t: 'pasadizo' }
  | { t: 'sospechar'; s: IdSospechoso; a: IdArma }
  | { t: 'mostrar'; carta: Carta | null }
  | { t: 'acusar'; s: IdSospechoso; a: IdArma; c: IdCuarto }
  | { t: 'terminar' };

const copiar = (e: EstadoClue): EstadoClue => JSON.parse(JSON.stringify(e));

/** El reparto (lo arma quien empieza, con su azar). */
export function repartir(azar: () => number): Extract<MovClue, { t: 'repartir' }> {
  const barajar = <T,>(l: T[]) => {
    const r = [...l];
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(azar() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  };
  const s = barajar(IDS_SOSPECHOSOS)[0];
  const a = barajar(IDS_ARMAS)[0];
  const c = barajar(IDS_CUARTOS)[0];
  const resto = barajar(TODAS.filter((x) => x !== s && x !== a && x !== c));
  const bocaAbajo: Partial<Record<IdCuarto, Carta>> = {};
  ESQUINAS.forEach((q, k) => (bocaAbajo[q] = resto[k]));
  const manos = { el: resto.slice(4, 11), ella: resto.slice(11, 18) };
  const cuartos = barajar(IDS_CUARTOS);
  const sospechosos = Object.fromEntries(IDS_SOSPECHOSOS.map((id, k) => [id, cuartos[k]])) as Record<IdSospechoso, IdCuarto>;
  const cuartos2 = barajar(IDS_CUARTOS);
  const armas = Object.fromEntries(IDS_ARMAS.map((id, k) => [id, cuartos2[k]])) as Record<IdArma, IdCuarto>;
  return { t: 'repartir', sobre: { s, a, c }, bocaAbajo, manos, sospechosos, armas };
}

/** ¿La casilla está ocupada por el otro detective? (no se pasa por encima de él) */
export const ocupadaPor = (e: EstadoClue, quien: Rol) => (x: number, y: number) => {
  const p = e.pos[otro(quien)];
  return !enCuarto(p) && p.x === x && p.y === y;
};

/** Lo que se camina con los dados que salieron. */
export const suma = (d: [number, number] | null) => (d ? d[0] + d[1] : 0);

/** A dónde puede ir el activo con lo que sacó en los dados. */
export function destinos(e: EstadoClue, dado = suma(e.dados)): Lugar[] {
  const a = alcance(e.pos[e.activo], dado, ocupadaPor(e, e.activo));
  const l: Lugar[] = a.cuartos.map((c) => ({ c: c.c }));
  for (const c of a.casillas) l.push({ x: c.x, y: c.y });
  return l;
}

/** Quién puede desmentir y con qué cartas. */
export function cartasParaMostrar(e: EstadoClue): Carta[] {
  const q = e.sospechas[e.sospechas.length - 1];
  if (!q) return [];
  const mano = e.manos[otro(q.quien)];
  return mano.filter((x) => x === q.s || x === q.a || x === q.c);
}

/** Lo que cada uno sabe que NO está en el sobre (sus cartas, las que le mostraron y las boca abajo que miró). */
export function sabidas(e: EstadoClue, quien: Rol): Set<Carta> {
  const r = new Set<Carta>(e.manos[quien]);
  for (const c of e.miradas[quien]) if (e.bocaAbajo[c]) r.add(e.bocaAbajo[c]!);
  for (const q of e.sospechas) if (q.quien === quien && q.carta) r.add(q.carta);
  return r;
}

function entrar(e: EstadoClue, quien: Rol, c: IdCuarto) {
  e.pos[quien] = { c };
  if (e.bocaAbajo[c] && !e.miradas[quien].includes(c)) e.miradas[quien].push(c);
}

export const reglas: Reglas<EstadoClue, MovClue> = {
  inicial(empieza) {
    return {
      fase: 'repartir',
      activo: empieza,
      empieza,
      sobre: null,
      manos: { el: [], ella: [] },
      bocaAbajo: {},
      miradas: { el: [], ella: [] },
      pos: { el: { x: INICIO.el[0], y: INICIO.el[1] }, ella: { x: INICIO.ella[0], y: INICIO.ella[1] } },
      sospechosos: { fresa: 'salon', maracuya: 'salon', arepa: 'salon', aguacate: 'salon', arandano: 'salon', mora: 'salon' },
      armas: { chancla: 'salon', rodillo: 'salon', olla: 'salon', control: 'salon', escoba: 'salon', matera: 'salon' },
      dados: null,
      desde: null,
      sospechoEn: { el: null, ella: null },
      sospechas: [],
      mostradas: { el: [], ella: [] },
      acusacion: null,
      ganador: null,
      turnos: 0,
    };
  },

  turno(e) {
    if (e.fase === 'mostrar') return otro(e.activo);
    return e.activo;
  },

  movimientos(e) {
    if (e.ganador) return [];
    const yo = e.activo;
    const acusar = (): MovClue[] => {
      // (todas las combinaciones: la IA y la vista escogen; aquí basta con que sean legales)
      const l: MovClue[] = [];
      for (const s of IDS_SOSPECHOSOS) for (const a of IDS_ARMAS) for (const c of IDS_CUARTOS) l.push({ t: 'acusar', s, a, c });
      return l;
    };
    switch (e.fase) {
      case 'repartir':
        return [];
      case 'turno': {
        const l: MovClue[] = [];
        for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) l.push({ t: 'tirar', dados: [a, b] });
        const p = e.pos[yo];
        if (enCuarto(p) && CUARTO[p.c].pasadizo) l.push({ t: 'pasadizo' });
        return [...l, ...acusar()];
      }
      case 'mover': {
        const d = destinos(e);
        return d.length ? d.map((a) => ({ t: 'ir', a }) as MovClue) : [{ t: 'terminar' }];
      }
      case 'sospechar': {
        const l: MovClue[] = [];
        for (const s of IDS_SOSPECHOSOS) for (const a of IDS_ARMAS) l.push({ t: 'sospechar', s, a });
        return [...l, { t: 'terminar' }, ...acusar()];
      }
      case 'mostrar': {
        const c = cartasParaMostrar(e);
        return c.length ? c.map((carta) => ({ t: 'mostrar', carta }) as MovClue) : [{ t: 'mostrar', carta: null }];
      }
      case 'despues':
        return [{ t: 'terminar' }, ...acusar()];
    }
  },

  aplicar(e0, m) {
    const e = copiar(e0);
    const yo = e.activo;
    const llegar = (a: Lugar) => {
      if (enCuarto(a)) {
        entrar(e, yo, a.c);
        // Puede sospechar si no es el mismo cuarto donde ya sospechó sin salir
        e.fase = e.sospechoEn[yo] === a.c ? 'despues' : 'sospechar';
      } else {
        e.pos[yo] = { x: a.x, y: a.y };
        e.sospechoEn[yo] = null;
        e.fase = 'despues';
      }
      e.dados = null;
    };
    switch (m.t) {
      case 'repartir':
        e.sobre = m.sobre;
        e.bocaAbajo = m.bocaAbajo;
        e.manos = m.manos;
        e.sospechosos = m.sospechosos;
        e.armas = m.armas;
        e.fase = 'turno';
        break;
      case 'tirar':
        e.dados = m.dados;
        e.desde = e.pos[yo];
        e.fase = 'mover';
        // Sin a dónde ir (encerrado): pierde el movimiento
        if (!destinos(e).length) {
          e.dados = null;
          e.fase = 'despues';
        }
        break;
      case 'tirar_ir':
        e.dados = m.dados;
        e.desde = e.pos[yo];
        if (enCuarto(e.pos[yo]) && (!enCuarto(m.a) || m.a.c !== (e.pos[yo] as { c: IdCuarto }).c)) e.sospechoEn[yo] = null;
        llegar(m.a);
        break;
      case 'ir':
        if (enCuarto(e.pos[yo])) e.sospechoEn[yo] = null;
        llegar(m.a);
        break;
      case 'pasadizo': {
        const p = e.pos[yo];
        if (enCuarto(p) && CUARTO[p.c].pasadizo) {
          e.sospechoEn[yo] = null;
          e.desde = p;
          llegar({ c: CUARTO[p.c].pasadizo! });
        }
        break;
      }
      case 'sospechar': {
        const p = e.pos[yo];
        if (!enCuarto(p)) break;
        e.sospechosos[m.s] = p.c;
        e.armas[m.a] = p.c;
        e.sospechoEn[yo] = p.c;
        e.sospechas.push({ quien: yo, s: m.s, a: m.a, c: p.c, desmentida: false, carta: null });
        e.fase = 'mostrar';
        break;
      }
      case 'mostrar': {
        const q = e.sospechas[e.sospechas.length - 1];
        if (q && m.carta) {
          q.desmentida = true;
          q.carta = m.carta;
          if (!e.mostradas[otro(q.quien)].includes(m.carta)) e.mostradas[otro(q.quien)].push(m.carta);
        }
        e.fase = 'despues';
        break;
      }
      case 'acusar': {
        const acerto = !!e.sobre && e.sobre.s === m.s && e.sobre.a === m.a && e.sobre.c === m.c;
        e.acusacion = { quien: yo, s: m.s, a: m.a, c: m.c, acerto };
        // Con dos detectives, el que se equivoca le deja el caso al otro
        e.ganador = acerto ? yo : otro(yo);
        break;
      }
      case 'terminar':
        e.activo = otro(yo);
        e.fase = 'turno';
        e.dados = null;
        e.desde = null;
        e.turnos++;
        break;
    }
    return e;
  },

  puntos(e) {
    // El marcador: cuántas de las 21 cartas ya tiene descartadas cada uno (pistas)
    return { el: sabidas(e, 'el').size, ella: sabidas(e, 'ella').size };
  },

  fin(e): Final | null {
    if (!e.ganador) return null;
    return { ganador: e.ganador, puntos: this.puntos(e) };
  },
};

/** ¿La jugada es legal? (la red y la IA la revisan antes de aplicarla) */
export function legal(e: EstadoClue, m: MovClue): boolean {
  if (m.t === 'repartir') return e.fase === 'repartir';
  if (m.t === 'tirar_ir') {
    if (e.fase !== 'turno') return false;
    return destinos(e, suma(m.dados)).some((a) => mismoLugar(a, m.a));
  }
  return reglas.movimientos(e).some((x) => JSON.stringify(x) === JSON.stringify(m));
}
