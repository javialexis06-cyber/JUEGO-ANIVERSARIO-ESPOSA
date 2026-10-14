// Las reglas de «El Show de Nosotros»: las seis rondas, cómo se escogen las preguntas (sin repetir hasta agotar la
// categoría), qué contesta cada uno, cuántos puntos da cada respuesta y el medidor de conexión.
// Todo es puro (sin pantalla ni red): el show lo usa igual en línea, en el mismo celular y jugando solo.
import type { ShowCasa } from '../../casa/show_casa';
import { BANCO, type Categoria, CATEGORIAS, pregunta, type Pregunta, type Rol, type TipoPregunta } from './preguntas';

export type ModoShow = 'linea' | 'local' | 'solo';
export const otroRol = (r: Rol): Rol => (r === 'el' ? 'ella' : 'el');
export const ROLES: Rol[] = ['el', 'ella'];

/** Una pregunta del plan; `s` es de quién se habla (en «¿cuánto me conoces?» y el termómetro). */
export interface Item {
  id: string;
  s?: Rol;
}
export interface RondaPlan {
  tipo: TipoPregunta;
  items: Item[];
}
export interface Perrito {
  nombre: string;
  pelaje: string;
  hembra: boolean;
}
/** El guion del episodio: lo arma un celular y viaja al otro, así los dos ven las mismas preguntas. */
export interface Plan {
  v: 1;
  id: string;
  empieza: Rol;
  rondas: RondaPlan[];
  perro: Perrito;
}

export interface InfoRonda {
  tipo: TipoPregunta;
  n: number;
  titulo: string;
  sub: string;
  /** Segundos para contestar cada pregunta (en el relámpago: para las diez). */
  seg: number;
  color: string;
}

export const RONDAS: InfoRonda[] = [
  { tipo: 'quien', n: 4, titulo: '¿Quién es más probable?', sub: 'Señalen en secreto a Él o a Ella. Si coinciden, ¡puntos para los dos!', seg: 15, color: '#F6CF5A' },
  { tipo: 'prefiere', n: 4, titulo: '¿Qué prefieres?', sub: 'Escoge lo tuyo y adivina lo que escogió tu pareja.', seg: 24, color: '#8FD3B6' },
  { tipo: 'conoce', n: 4, titulo: '¿Cuánto me conoces?', sub: 'Uno contesta sobre sí mismo, el otro adivina. ¡Sin mirar!', seg: 24, color: '#9CCBEF' },
  { tipo: 'termo', n: 4, titulo: 'El termómetro', sub: 'Del 1 al 10. Entre más cerca, más puntos.', seg: 18, color: '#F29B38' },
  { tipo: 'historia', n: 4, titulo: 'Nuestra historia', sub: '¿Quién se acuerda mejor de lo que han vivido juntos?', seg: 20, color: '#B48CE0' },
  { tipo: 'zapato', n: 10, titulo: 'Final relámpago', sub: '¡Diez preguntas en treinta segundos y puntos dobles!', seg: 30, color: '#E4574B' },
];
export const infoRonda = (t: TipoPregunta) => RONDAS.find((r) => r.tipo === t)!;
/** Segundos para una abierta (hay que escribir). */
export const SEG_ABIERTA = 45;

/** Lo que contesta cada uno en una pregunta: `a` lo propio (o su voto) y `g` lo que adivina del otro. '-' = no alcanzó. */
export interface Resp {
  a?: string;
  g?: string;
}

/** Qué le toca contestar a `quien` en esta pregunta. */
export function tarea(p: Pregunta, item: Item, quien: Rol): { a: boolean; g: boolean } {
  switch (p.tipo) {
    case 'quien':
    case 'zapato':
    case 'historia':
      return { a: true, g: false };
    case 'prefiere':
      return { a: true, g: true };
    case 'conoce':
    case 'termo':
      return item.s === quien ? { a: true, g: false } : { a: false, g: true };
  }
}

/** ¿Ya contestó todo lo que le tocaba? */
export function completa(p: Pregunta, item: Item, quien: Rol, r: Resp | undefined): boolean {
  if (!r) return false;
  const t = tarea(p, item, quien);
  return (!t.a || r.a !== undefined) && (!t.g || r.g !== undefined);
}

export const esAbierta = (p: Pregunta) => p.tipo === 'conoce' && !p.o;

export interface Resultado {
  pts: Record<Rol, number>;
  /** Qué tanto se conectaron en esta pregunta (0 a 1); null si todavía no se puede saber. */
  con: number | null;
  /** Falta lo del otro (jugando solo): queda guardada hasta que conteste. */
  pendiente: boolean;
  tono: 'bien' | 'casi' | 'mal' | 'nada';
  etiqueta: string;
  /** Quién le atinó (para las reacciones de cada uno). */
  atino: Partial<Record<Rol, 'si' | 'casi' | 'no'>>;
}

const vale = (v: string | undefined) => v !== undefined && v !== '-' && v !== '';
const PTS_TERMO = [100, 70, 40, 15, 0];

/**
 * Califica una pregunta con las respuestas de los dos. `nota` es la calificación del dueño en las abiertas
 * ('2' exacto, '1' casi, '0' ni cerca). Lo que falte (jugando solo) deja la pregunta pendiente.
 */
export function calificar(p: Pregunta, item: Item, r: Partial<Record<Rol, Resp>>, nota?: string): Resultado {
  const res: Resultado = { pts: { el: 0, ella: 0 }, con: null, pendiente: false, tono: 'nada', etiqueta: '', atino: {} };
  const a = (q: Rol) => r[q]?.a;
  const g = (q: Rol) => r[q]?.g;
  switch (p.tipo) {
    case 'quien':
    case 'zapato': {
      const x = a('el'), y = a('ella');
      if (x === undefined || y === undefined) {
        res.pendiente = true;
        res.etiqueta = 'Queda guardada';
        return res;
      }
      if (!vale(x) || !vale(y)) {
        res.con = 0;
        res.etiqueta = '¡Se les fue el tiempo!';
        return res;
      }
      const ok = x === y;
      const pts = p.tipo === 'zapato' ? 60 : 100;
      res.pts = { el: ok ? pts : 0, ella: ok ? pts : 0 };
      res.con = ok ? 1 : 0;
      res.tono = ok ? 'bien' : 'mal';
      res.atino = { el: ok ? 'si' : 'no', ella: ok ? 'si' : 'no' };
      res.etiqueta = ok ? '¡Coinciden!' : '¡No coinciden!';
      return res;
    }
    case 'prefiere': {
      let suma = 0, cuantos = 0;
      for (const q of ['el', 'ella'] as Rol[]) {
        const suyo = g(q), delOtro = a(otroRol(q));
        if (suyo === undefined || delOtro === undefined) {
          res.pendiente = true;
          continue;
        }
        const ok = vale(suyo) && suyo === delOtro;
        res.atino[q] = ok ? 'si' : 'no';
        if (ok) res.pts[q] += 100;
        suma += ok ? 1 : 0;
        cuantos++;
      }
      const gemelos = vale(a('el')) && a('el') === a('ella');
      if (gemelos) {
        res.pts.el += 50;
        res.pts.ella += 50;
      }
      res.con = cuantos ? suma / cuantos : null;
      res.tono = res.con === null ? 'nada' : res.con >= 1 ? 'bien' : res.con > 0 ? 'casi' : 'mal';
      res.etiqueta = res.con === null ? 'Queda guardada' : res.con >= 1 ? (gemelos ? '¡Almas gemelas!' : '¡Los dos atinaron!') : res.con > 0 ? '¡Uno atinó!' : gemelos ? '¡Iguales… pero ninguno atinó!' : '¡Ninguno atinó!';
      return res;
    }
    case 'conoce':
    case 'termo': {
      const s = item.s ?? 'el', q = otroRol(s);
      const verdad = a(s), intento = g(q);
      if (verdad === undefined || intento === undefined) {
        res.pendiente = true;
        res.etiqueta = 'Queda guardada';
        return res;
      }
      if (!vale(verdad) || !vale(intento)) {
        res.con = 0;
        res.etiqueta = '¡Se fue el tiempo!';
        return res;
      }
      if (p.tipo === 'termo') {
        const d = Math.abs(Number(verdad) - Number(intento));
        const t = PTS_TERMO[Math.min(4, Math.round(d))] ?? 0;
        res.pts[q] = t;
        res.pts[s] = Math.round(t / 2);
        res.con = t / 100;
        res.tono = d === 0 ? 'bien' : d <= 2 ? 'casi' : 'mal';
        res.atino[q] = d === 0 ? 'si' : d <= 2 ? 'casi' : 'no';
        res.etiqueta = d === 0 ? '¡Exacto!' : d === 1 ? '¡Por un pelito!' : d === 2 ? '¡Caliente, caliente!' : d === 3 ? 'Tibio…' : '¡Frío, frío!';
        return res;
      }
      let k: number;
      if (p.o) k = intento === verdad ? 2 : 0;
      else {
        if (nota === undefined) {
          res.pendiente = true;
          res.etiqueta = 'Falta calificar';
          return res;
        }
        k = Number(nota) || 0;
      }
      res.pts[q] = k === 2 ? 100 : k === 1 ? 50 : 0;
      res.pts[s] = k === 2 ? 50 : k === 1 ? 25 : 0;
      res.con = k / 2;
      res.tono = k === 2 ? 'bien' : k === 1 ? 'casi' : 'mal';
      res.atino[q] = k === 2 ? 'si' : k === 1 ? 'casi' : 'no';
      res.etiqueta = k === 2 ? '¡Le atinó!' : k === 1 ? '¡Casi casi!' : '¡Ni cerca!';
      return res;
    }
    case 'historia': {
      let hits = 0, cuantos = 0;
      for (const q of ['el', 'ella'] as Rol[]) {
        const v = a(q);
        if (v === undefined) {
          res.pendiente = true;
          continue;
        }
        const ok = v === String(p.ok);
        res.atino[q] = ok ? 'si' : 'no';
        if (ok) res.pts[q] = 100;
        hits += ok ? 1 : 0;
        cuantos++;
      }
      res.con = cuantos ? hits / cuantos : null;
      res.pendiente = false;
      res.tono = hits === cuantos && cuantos ? 'bien' : hits ? 'casi' : 'mal';
      res.etiqueta = hits === 2 ? '¡Los dos se acordaron!' : hits === 1 && cuantos === 2 ? '¡Solo uno se acordó!' : hits === 1 ? '¡Correcto!' : '¡Mala memoria!';
      return res;
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Escoger las preguntas

/** Ids que ya salieron alguna vez (en el libro de cualquiera de los dos o en un show visto en este celular). */
export function yaUsadas(show: ShowCasa, vistas: Iterable<string>): Set<string> {
  const u = new Set<string>(vistas);
  for (const r of ROLES) {
    for (const k of Object.keys(show.r[r])) u.add(k);
    for (const k of Object.keys(show.g[r])) u.add(k);
  }
  for (const d of show.dias) u.add(d.q);
  if (show.dia) u.add(show.dia.q);
  return u;
}

function barajar<T>(lista: T[], azar: () => number): T[] {
  const l = [...lista];
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l;
}

/** ¿El otro ya dejó guardado lo necesario para revelar esta pregunta jugando solo? */
export function revelable(show: ShowCasa, p: Pregunta, item: Item, yo: Rol): boolean {
  const o = otroRol(yo);
  switch (p.tipo) {
    case 'quien':
    case 'zapato':
      return vale(show.r[o][p.id]);
    case 'prefiere':
      return vale(show.r[o][p.id]);
    case 'conoce':
    case 'termo':
      return item.s === o ? vale(show.r[o][p.id]) : vale(show.g[o][p.id]);
    case 'historia':
      return true;
  }
}

/**
 * Arma el guion del episodio: seis rondas con preguntas de categorías variadas, primero las que nunca han salido
 * (cuando una categoría se agota, vuelve a empezar). Jugando solo se prefieren las que el otro ya contestó, para
 * que haya contra qué adivinar.
 */
export function armarPlan(o: { id: string; modo: ModoShow; yo: Rol; empieza: Rol; show: ShowCasa; vistas: Iterable<string>; azar: () => number; perro: Perrito }): Plan {
  const usadas = yaUsadas(o.show, o.vistas);
  const elegidas = new Set<string>();
  const rondas: RondaPlan[] = [];
  for (const info of RONDAS) {
    const items: Item[] = [];
    let abiertas = 0;
    let ultimaCat: Categoria | null = null;
    const catsUsadas = new Map<Categoria, number>();
    for (let i = 0; i < info.n; i++) {
      const s: Rol | undefined = info.tipo === 'conoce' || info.tipo === 'termo' ? (i % 2 === 0 ? o.empieza : otroRol(o.empieza)) : undefined;
      const valida = (p: Pregunta) => {
        if (elegidas.has(p.id)) return false;
        if ((p.tipo === 'conoce' || p.tipo === 'termo') && p.de && p.de !== s) return false;
        if (p.tipo === 'conoce' && !p.o) {
          // Una abierta por show como mucho; jugando solo, solo si hay contra qué compararla
          if (abiertas >= 1) return false;
          if (o.modo === 'solo' && !revelable(o.show, p, { id: p.id, s }, o.yo)) return false;
        }
        return true;
      };
      const pool = BANCO[info.tipo].filter(valida);
      // Categorías que todavía tienen preguntas sin usar en este tipo (las agotadas vuelven a empezar)
      const frescas = (c: Categoria) => pool.some((p) => p.cat === c && !usadas.has(p.id));
      const puntaje = (p: Pregunta) => {
        let v = 0;
        if (!usadas.has(p.id)) v += 10;
        else if (!frescas(p.cat)) v += 6; // categoría agotada: vuelve a salir
        if (o.modo === 'solo' && revelable(o.show, p, { id: p.id, s }, o.yo)) v += 14;
        // Variedad: castiga repetir categoría seguida y las categorías ya muy vistas en esta ronda
        if (p.cat === ultimaCat) v -= 7;
        v -= (catsUsadas.get(p.cat) ?? 0) * 3;
        // Abiertas: que salgan de vez en cuando (no siempre)
        if (p.tipo === 'conoce' && !p.o) v -= o.modo === 'solo' ? 0 : 2;
        return v + o.azar() * 4;
      };
      const mejor = barajar(pool, o.azar).sort((x, y) => puntaje(y) - puntaje(x))[0] ?? BANCO[info.tipo][Math.floor(o.azar() * BANCO[info.tipo].length)];
      elegidas.add(mejor.id);
      if (mejor.tipo === 'conoce' && !mejor.o) abiertas++;
      ultimaCat = mejor.cat;
      catsUsadas.set(mejor.cat, (catsUsadas.get(mejor.cat) ?? 0) + 1);
      items.push(s ? { id: mejor.id, s } : { id: mejor.id });
    }
    rondas.push({ tipo: info.tipo, items });
  }
  return { v: 1, id: o.id, empieza: o.empieza, rondas, perro: o.perro };
}

/** Lo que el otro dejó guardado en la casa para una pregunta (jugando solo). */
export function guardadoDe(show: ShowCasa, p: Pregunta, item: Item, quien: Rol): Resp {
  const t = tarea(p, item, quien);
  const r: Resp = {};
  if (t.a && show.r[quien][p.id] !== undefined) r.a = show.r[quien][p.id];
  if (t.g && show.g[quien][p.id] !== undefined) r.g = show.g[quien][p.id];
  return r;
}

// ---------------------------------------------------------------------------------------------------------------
// La pregunta del día: una de «qué prefieres», «cuánto me conoces» (con opciones) o el termómetro, que los dos
// contestan sobre sí mismos y adivinando al otro. Sale de la fecha, así los dos celulares escogen la misma.

export function candidatasDelDia(): Pregunta[] {
  return [...BANCO.prefiere, ...BANCO.conoce.filter((p) => p.tipo === 'conoce' && p.o && !p.de), ...BANCO.termo.filter((p) => p.tipo === 'termo' && !p.de)];
}

export function preguntaDelDia(show: ShowCasa, fecha: string): string {
  const todas = candidatasDelDia();
  const vistas = new Set([...show.dias.map((d) => d.q), ...ROLES.flatMap((r) => Object.keys(show.r[r]))]);
  const libres = todas.filter((p) => !vistas.has(p.id));
  const lista = libres.length ? libres : todas;
  let h = 2166136261;
  for (let i = 0; i < fecha.length; i++) h = Math.imul(h ^ fecha.charCodeAt(i), 16777619);
  return lista[(h >>> 0) % lista.length].id;
}

/** El medidor de conexión: promedio de lo conectados que estuvieron en cada pregunta (0 a 100). */
export function conexion(resultados: (Resultado | null | undefined)[]): number {
  const v = resultados.filter((r): r is Resultado => !!r && r.con !== null).map((r) => r.con!);
  if (!v.length) return 0;
  return Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100);
}

/** Cómo se llama su nivel de conexión. */
export function nivelConexion(c: number): { nombre: string; frase: string } {
  if (c >= 90) return { nombre: 'Telepatía total', frase: 'Ya ni necesitan hablar: se leen la mente.' };
  if (c >= 75) return { nombre: 'Almas gemelas', frase: 'Se conocen de memoria. Qué envidia (dice el perrito).' };
  if (c >= 60) return { nombre: 'Complemento perfecto', frase: 'Lo que no sabe uno, lo sabe el otro.' };
  if (c >= 40) return { nombre: 'Novios de Transformice', frase: 'Van bien… pero hay que hablar más por videollamada.' };
  if (c >= 20) return { nombre: 'Recién conocidos', frase: '¿Seguros que no se acaban de conocer en la villa?' };
  return { nombre: 'Señal perdida', frase: 'Hubo interferencia. ¡Revancha ya!' };
}

export const categoriaDe = (id: string) => {
  const p = pregunta(id);
  return p ? CATEGORIAS[p.cat] : null;
};
