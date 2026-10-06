// La máquina de «¿Quién fue?»: lleva su cuaderno (lo que sabe que no está en el sobre, lo que el otro no pudo
// desmentir y las cartas boca abajo que ya miró), saca qué tríos (quién, con qué, dónde) siguen siendo posibles,
// camina hacia los cuartos que le sirven y acusa cuando solo le queda uno. Fácil: solo cuenta lo que ve y a veces
// pierde el rumbo. Normal y difícil: también lo que implica que el otro no pueda desmentir; difícil además usa sus
// propias cartas para aislar lo que le falta.
import type { Rol } from '../../casa/modelo';
import type { NivelIA } from '../tipos';
import {
  IDS_ARMAS, IDS_CUARTOS, IDS_SOSPECHOSOS, TODAS, cartasParaMostrar, destinos, reglas, repartir, sabidas, suma,
  type Carta, type EstadoClue, type IdArma, type IdSospechoso, type MovClue,
} from './reglas';
import { ANCHO, ALTO, CUARTO, ESQUINAS, enCuarto, pasillo, type IdCuarto, type Lugar } from './tablero';

export interface Deduccion {
  s: IdSospechoso[];
  a: IdArma[];
  c: IdCuarto[];
  /** Tríos posibles (cuántos). */
  posibles: number;
  /** Lo que el otro seguro no tiene (no lo pudo desmentir): preguntarlo otra vez no enseña nada. */
  noTiene: Set<Carta>;
  /** Esquinas con carta boca abajo que todavía no ha mirado. */
  sinMirar: IdCuarto[];
}

/** Qué puede estar en el sobre, desde lo que sabe `yo`. `fino` usa también lo que el otro no pudo desmentir. */
export function deducir(e: EstadoClue, yo: Rol, fino = true): Deduccion {
  const sabe = sabidas(e, yo);
  const ocultas = TODAS.filter((c) => !sabe.has(c));
  // Lo que el otro seguro NO tiene: lo que no pudo desmentir en mis sospechas
  const noTiene = new Set<Carta>();
  if (fino) for (const q of e.sospechas) if (q.quien === yo && !q.desmentida) [q.s, q.a, q.c].forEach((c) => noTiene.add(c));
  // Cartas boca abajo que no he mirado
  const esquinas = ESQUINAS.filter((c) => e.bocaAbajo[c] && !e.miradas[yo].includes(c));
  const sinMirar = esquinas.length;
  const ss = IDS_SOSPECHOSOS.filter((c) => !sabe.has(c));
  const aa = IDS_ARMAS.filter((c) => !sabe.has(c));
  const cc = IDS_CUARTOS.filter((c) => !sabe.has(c));
  const r = { s: new Set<IdSospechoso>(), a: new Set<IdArma>(), c: new Set<IdCuarto>() };
  let posibles = 0;
  for (const s of ss)
    for (const a of aa)
      for (const c of cc) {
        // Lo que no está en el sobre y el otro no tiene, tiene que estar boca abajo sin mirar
        let forzadas = 0;
        for (const x of ocultas) if (x !== s && x !== a && x !== c && noTiene.has(x)) forzadas++;
        if (forzadas > sinMirar) continue;
        posibles++;
        r.s.add(s);
        r.a.add(a);
        r.c.add(c);
      }
  return { s: [...r.s], a: [...r.a], c: [...r.c], posibles, noTiene, sinMirar: esquinas };
}

const resuelto = (d: Deduccion) => d.s.length === 1 && d.a.length === 1 && d.c.length === 1;

/** Distancia de cada casilla de pasillo a la puerta más cercana de alguno de los cuartos meta. */
function campo(metas: IdCuarto[]): Int16Array {
  const d = new Int16Array(ANCHO * ALTO).fill(999);
  const cola: number[] = [];
  for (const m of metas)
    for (const [x, y] of CUARTO[m].puertas) {
      const k = y * ANCHO + x;
      if (d[k] > 1) {
        d[k] = 1;
        cola.push(k);
      }
    }
  for (let i = 0; i < cola.length; i++) {
    const k = cola[i];
    const x = k % ANCHO, y = Math.floor(k / ANCHO);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (!pasillo(nx, ny)) continue;
      const n = ny * ANCHO + nx;
      if (d[n] <= d[k] + 1) continue;
      d[n] = d[k] + 1;
      cola.push(n);
    }
  }
  return d;
}

/** Lo que todavía se puede averiguar preguntando: candidatos que el otro podría tener. */
const preguntables = <T extends Carta>(cand: T[], d: Deduccion) => (cand.length > 1 ? cand.filter((x) => !d.noTiene.has(x)) : []);

/** Cuánto le sirve llegar a un cuarto: mirar una carta boca abajo, o sospechar con algo que el otro pueda desmentir. */
function valorCuarto(e: EstadoClue, yo: Rol, c: IdCuarto, d: Deduccion): number {
  if (e.sospechoEn[yo] === c) return 0;
  let v = 0;
  if (d.sinMirar.includes(c)) v += 3;
  if (preguntables(d.c, d).includes(c)) v += 2;
  if (preguntables(d.s, d).length || preguntables(d.a, d).length) v += 1;
  return v;
}

/** Los cuartos que le conviene visitar (los de más valor). */
function metas(e: EstadoClue, yo: Rol, d: Deduccion, azar: () => number, nivel: NivelIA): IdCuarto[] {
  // Fácil: a veces se le olvida para dónde iba
  if (nivel === 'facil' && azar() < 0.35) return [IDS_CUARTOS[Math.floor(azar() * IDS_CUARTOS.length)]];
  let mejor = 0;
  for (const c of IDS_CUARTOS) mejor = Math.max(mejor, valorCuarto(e, yo, c, d));
  const l = IDS_CUARTOS.filter((c) => valorCuarto(e, yo, c, d) === mejor && mejor > 0);
  return l.length ? l : [...IDS_CUARTOS];
}

/** Qué tan bueno es llegar a un lugar (menos es mejor). */
function costo(e: EstadoClue, yo: Rol, a: Lugar, objetivo: IdCuarto[], dist: Int16Array): number {
  if (enCuarto(a)) {
    // No sirve volver a sospechar donde ya sospechó sin salir
    if (e.sospechoEn[yo] === a.c) return 500;
    return objetivo.includes(a.c) ? -10 : 60;
  }
  return dist[a.y * ANCHO + a.x];
}

function elegirDestino(e: EstadoClue, yo: Rol, dado: number, d: Deduccion, nivel: NivelIA, azar: () => number): Lugar | null {
  const l = destinos(e, dado);
  if (!l.length) return null;
  const objetivo = metas(e, yo, d, azar, nivel);
  const dist = campo(objetivo);
  let mejor: Lugar = l[0];
  let mc = Infinity;
  for (const a of l) {
    const c = costo(e, yo, a, objetivo, dist) + azar() * 0.5;
    if (c < mc) {
      mc = c;
      mejor = a;
    }
  }
  return mejor;
}

function sospecha(e: EstadoClue, yo: Rol, d: Deduccion, nivel: NivelIA, azar: () => number): MovClue {
  const mano = e.manos[yo];
  const uno = <T,>(l: T[]) => l[Math.floor(azar() * l.length)];
  const escoger = <T extends Carta>(cand: T[], todos: T[]): T => {
    if (nivel === 'facil') return uno(azar() < 0.7 ? cand : todos);
    // Pregunta por lo que el otro todavía puede tener (lo que ya no pudo desmentir no enseña nada)
    const utiles = preguntables(cand, d);
    if (utiles.length) return uno(utiles);
    if (cand.length > 1) return uno(cand);
    // Ya lo sabe: difícil pregunta con una carta suya (así aísla lo demás); normal, con la que ya sabe
    const propias = todos.filter((x) => mano.includes(x));
    return nivel === 'dificil' && propias.length ? uno(propias) : cand[0] ?? uno(todos);
  };
  return { t: 'sospechar', s: escoger(d.s, IDS_SOSPECHOSOS), a: escoger(d.a, IDS_ARMAS) };
}

export function ia(e: EstadoClue, nivel: NivelIA, azar: () => number): MovClue {
  if (e.fase === 'repartir') return repartir(azar);
  const t = reglas.turno(e);
  if (e.fase === 'mostrar') {
    // Muestra, si puede, una carta que ya le mostró antes (no regala información nueva)
    const c = cartasParaMostrar(e);
    if (!c.length) return { t: 'mostrar', carta: null };
    const repetida = c.find((x) => e.mostradas[t].includes(x));
    return { t: 'mostrar', carta: repetida ?? c[Math.floor(azar() * c.length)] };
  }
  const d = deducir(e, t, nivel !== 'facil');
  const acusar = (): MovClue => ({ t: 'acusar', s: d.s[0], a: d.a[0], c: d.c[0] });
  if (resuelto(d) && e.fase !== 'mover') return acusar();
  switch (e.fase) {
    case 'turno': {
      const p = e.pos[t];
      // El pasadizo, si lleva a un cuarto que le sirve
      if (enCuarto(p) && CUARTO[p.c].pasadizo) {
        const al = CUARTO[p.c].pasadizo!;
        if (metas(e, t, d, () => 0.99, nivel).includes(al) && e.sospechoEn[t] !== al) return { t: 'pasadizo' };
      }
      const dados: [number, number] = [1 + Math.floor(azar() * 6), 1 + Math.floor(azar() * 6)];
      const a = elegirDestino(e, t, dados[0] + dados[1], d, nivel, azar);
      return a ? { t: 'tirar_ir', dados, a } : { t: 'tirar', dados };
    }
    case 'mover': {
      const a = elegirDestino(e, t, suma(e.dados), d, nivel, azar);
      return a ? { t: 'ir', a } : { t: 'terminar' };
    }
    case 'sospechar':
      return sospecha(e, t, d, nivel, azar);
    default:
      return { t: 'terminar' };
  }
}
