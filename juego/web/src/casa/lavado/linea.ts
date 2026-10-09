// «Lavarse la cara» en línea, de 2 a 4 jugadores (Javier, Laura y amigos), cada uno en su celular, sobre las salas
// de `src/salas/` (como el cooperativo del original). El anfitrión (puesto 0, se juega dentro de su cara) simula
// todo con el motor y cada décima de segundo manda UNA «foto» compacta (binaria, en base64) para todos: mugrosos,
// proyectiles, gotitas, cosas del piso, zonas y lo que pasó, de lo que alcanza a ver cualquiera de los jugadores.
// Cada posición va anclada al jugador que la ve (un byte + dos enteros cortos), así no importa qué tan lejos estén
// unos de otros. Los demás son espejos: dibujan la foto con movimiento suave entre una y otra y mueven a su propio
// personaje apenas tocan el joystick (le mandan su posición y hacia dónde apuntan al anfitrión). El inventario, las
// cartas al subir de nivel y los cofres viajan aparte, en JSON, cuando cambian.
import { ID_ARMAS, ID_PASIVAS, baseEnNivel } from './armas';
import { ID_ENEMIGOS, ENEMIGOS } from './enemigos';
import { LIMITE_COFRE, LIMITE_ESCOGER, MAX_ENEMIGOS, type CofreAbierto, type Jugador, type Motor, type Opcion, type OpcionesJugador } from './motor';
import type { ResumenPartida } from './progreso';
import type { Efecto, IdArma, IdCarta, IdEscenario, IdObjeto, IdPasiva, Stats, TipoEfecto } from './tipos';

export interface ConfigPartida {
  escenario: IdEscenario;
  apurado: boolean;
  semilla: number;
  /** En el orden de los puestos de la sala: el 0 es el anfitrión (y la cara es la suya). */
  jugadores: OpcionesJugador[];
}

/** Lo de cada jugador que no cambia cuadro a cuadro (viaja en JSON cuando cambia). */
export interface InvJugador {
  armas: [IdArma, number][];
  pasivas: [IdPasiva, number][];
  st: Stats;
  cartas: IdCarta[];
  opciones: Opcion[] | null;
  cofre: CofreAbierto | null;
  cartaOpciones: IdCarta[] | null;
  usados: [number, number, number, number];
  acciones: number;
  vetadas: string[];
  danos: [IdArma, number, number][];
}

/** Lo que se dicen los celulares durante la partida (tipos de mensaje de la sala). */
export const MSJ = {
  /** Anfitrión → todos, rápido: la foto. */
  foto: 'lv:foto',
  /** Anfitrión → todos, rápido (se repite): inventarios. */
  inv: 'lv:inv',
  /** Jugador → anfitrión, rápido: dónde está, hacia dónde va y hacia dónde apunta. */
  mando: 'lv:mando',
  /** Jugador → anfitrión, fiable: escoger carta, tirar, saltar, vetar, cerrar cofre, carta mágica. */
  accion: 'lv:acc',
  /** Cualquiera → todos, fiable: pausa. */
  pausa: 'lv:pausa',
  /** Jugador → anfitrión, fiable: ya cargó y está adentro. */
  dentro: 'lv:dentro',
  /** Jugador → anfitrión, fiable: se retira (los demás siguen). */
  sale: 'lv:sale',
  /** Anfitrión → todos, fiable: se acabó (con el resumen de cada uno). */
  fin: 'lv:fin',
} as const;

export interface Mando {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  ax: number;
  ay: number;
  man: boolean;
}
export interface Accion {
  a: 'escoger' | 'tirar' | 'saltar' | 'vetar' | 'cofre' | 'carta';
  k?: number;
  c?: IdCarta | null;
  n?: number;
}

// ---------------------------------------------------------------------------------------------------- Inventario
export function inventarioDe(m: Motor): InvJugador[] {
  return m.jug.map((j) => ({
    armas: j.armas.map((a): [IdArma, number] => [a.id, a.nivel]),
    pasivas: [...j.pasivas],
    st: { ...j.st },
    cartas: [...j.cartas],
    opciones: j.opciones ? j.opciones.map((o) => ({ ...o })) : null,
    cofre: j.cofre ? JSON.parse(JSON.stringify(j.cofre)) : null,
    cartaOpciones: j.cartaOpciones ? [...j.cartaOpciones] : null,
    usados: [j.usadosTirar, j.usadosSaltar, j.usadosVetar, j.revivesUsados],
    acciones: j.acciones,
    vetadas: [...j.vetadas],
    danos: [...j.danos].map(([id, d]): [IdArma, number, number] => [id, Math.round(d.dano), d.desde]),
  }));
}

/** En el espejo: pone el inventario que mandó el anfitrión (sin perder el estado de dibujo de cada arma). */
export function aplicarInventario(m: Motor, inv: InvJugador[]) {
  inv.forEach((d, i) => {
    const j = m.jug[i];
    if (!j) return;
    const viejas = new Map(j.armas.map((a) => [a.id, a]));
    j.armas = d.armas.map(([id, nivel]) => {
      const a = viejas.get(id);
      if (a && a.nivel === nivel) return a;
      return { id, nivel, b: baseEnNivel(id, nivel), t: 0, rafaga: 0, tr: 0, total: a?.total ?? 1, k: a?.k ?? 0, k2: 0, k3: 0, ang: a?.ang ?? 0, activo: a?.activo ?? 0, desde: a?.desde ?? 0 };
    });
    j.pasivas = new Map(d.pasivas);
    j.st = { ...d.st };
    j.vidaMax = d.st.vida;
    j.cartas = [...d.cartas];
    j.opciones = d.opciones;
    j.cofre = d.cofre;
    j.cartaOpciones = d.cartaOpciones;
    [j.usadosTirar, j.usadosSaltar, j.usadosVetar, j.revivesUsados] = d.usados;
    j.acciones = d.acciones ?? j.acciones;
    j.vetadas = new Set(d.vetadas);
    j.danos = new Map(d.danos.map(([id, dano, desde]) => [id, { dano, desde }]));
  });
}

// ---------------------------------------------------------------------------------------------------- La foto
const TIPOS_EF: TipoEfecto[] = ['golpe', 'muere', 'latigo', 'rayo', 'charco', 'limpiar', 'explosion', 'gema', 'moneda', 'curar', 'nivel', 'cofre', 'herido',
  'revive', 'cae', 'levanta', 'congela', 'jefe', 'aviso', 'romper', 'evolucion', 'columna', 'haz', 'fuego', 'tajo', 'lanza', 'luces'];
const IDX_EF = new Map(TIPOS_EF.map((t, i) => [t, i]));
const IDX_ARMA = new Map(ID_ARMAS.map((a, i) => [a, i]));
const OBJETOS: IdObjeto[] = ['arepa', 'ola', 'hielo', 'aspiradora', 'moneda', 'bolsa', 'frasco', 'trebolito', 'aji', 'cofre', 'tesoro'];
const IDX_OBJ = new Map(OBJETOS.map((o, i) => [o, i]));

const buf = new ArrayBuffer(128 * 1024);
const dv = new DataView(buf);
const u8 = new Uint8Array(buf);

function aBase64(n: number): string {
  let s = '';
  for (let i = 0; i < n; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(u8.subarray(i, Math.min(n, i + 0x8000))));
  return btoa(s);
}

/** Banderas de la foto. */
export const FOTO_GANO = 1, FOTO_FIN = 2, FOTO_CORTE = 4, FOTO_PAUSA = 8, FOTO_CARGANDO = 16;

/** Las anclas: la posición redondeada de cada jugador (las dos puntas la calculan igual con lo que viaja). */
const anclaX = new Float64Array(4), anclaY = new Float64Array(4);

/**
 * Arma la foto para todos: lo que alcanza a ver cualquiera de los que juegan (más un margen), cada cosa anclada al
 * primero que la ve. `extra`: banderas de la pausa del anfitrión y quiénes están sin conexión (bit por jugador).
 */
export function tomarFoto(m: Motor, efDesde: number, seq: number, extra = { banderas: 0, cortados: 0 }): { b: string; efHasta: number } {
  const nj = Math.min(4, m.jug.length);
  for (let i = 0; i < nj; i++) {
    // (desde el número que viaja en la foto: el espejo calcula exactamente la misma ancla)
    anclaX[i] = Math.round(Math.fround(m.jug[i].x));
    anclaY[i] = Math.round(Math.fround(m.jug[i].y));
  }
  /** ¿Quién lo ve? (índice del ancla o -1). */
  const quienVe = (x: number, y: number) => {
    for (let i = 0; i < nj; i++) {
      const g = m.jug[i];
      if (g.fuera) continue;
      if (Math.abs(x - anclaX[i]) < g.vistaW / 2 + 220 && Math.abs(y - anclaY[i]) < g.vistaH / 2 + 260) return i;
    }
    return -1;
  };
  /** El ancla más cercana (para los jefes, que se mandan siempre). */
  const cercana = (x: number, y: number) => {
    let mejor = 0, d = Infinity;
    for (let i = 0; i < nj; i++) {
      const dd = (x - anclaX[i]) ** 2 + (y - anclaY[i]) ** 2;
      if (dd < d) {
        d = dd;
        mejor = i;
      }
    }
    return mejor;
  };
  const q = (v: number) => Math.max(-32767, Math.min(32767, Math.round(v)));
  let o = 0;
  const f32 = (v: number) => {
    dv.setFloat32(o, v, true);
    o += 4;
  };
  const i16 = (v: number) => {
    dv.setInt16(o, v, true);
    o += 2;
  };
  const b8 = (v: number) => {
    dv.setUint8(o, Math.max(0, Math.min(255, Math.round(v))));
    o += 1;
  };
  /** Una posición anclada: el ancla y la diferencia. */
  const pos = (k: number, x: number, y: number) => {
    b8(k);
    i16(q(x - anclaX[k]));
    i16(q(y - anclaY[k]));
  };
  f32(seq);
  f32(m.t);
  f32(m.tReal);
  f32(m.nivel);
  f32(m.xp);
  f32(m.eliminados);
  f32(m.oro);
  f32(m.hielo);
  b8((m.gano ? FOTO_GANO : 0) | (m.fin ? FOTO_FIN : 0) | extra.banderas);
  b8(extra.cortados);
  // Jugadores
  b8(nj);
  for (let i = 0; i < nj; i++) {
    const j = m.jug[i];
    f32(j.x);
    f32(j.y);
    f32(j.vx);
    f32(j.vy);
    f32(j.dx);
    f32(j.dy);
    f32(j.vida);
    f32(j.vidaMax);
    b8((j.caido ? 1 : 0) | (j.mira > 0 ? 2 : 0) | (j.invul > 0 ? 4 : 0) | (j.fuera ? 8 : 0) | (j.manual ? 16 : 0));
    b8(j.rescate * 255);
    f32(j.aji);
    f32(j.oro);
    b8(j.tEscoger * 10);
    b8((j.ax + 1) * 127.5);
    b8((j.ay + 1) * 127.5);
    b8(j.armas.length);
    for (const a of j.armas) {
      b8(IDX_ARMA.get(a.id) ?? 0);
      b8(a.total);
      f32(a.ang);
      f32(a.activo);
      f32(a.k);
    }
  }
  // Mugrosos (y velitas) que se ven
  const pos0 = o;
  i16(0);
  let n = 0;
  for (let k = 0; k < m.nVivos && n < MAX_ENEMIGOS + 60; k++) {
    const e = m.en[m.vivos[k]];
    if (!e.vivo) continue;
    let a = quienVe(e.x, e.y);
    if (a < 0) {
      if (!e.jefe) continue;
      a = cercana(e.x, e.y);
    }
    dv.setUint16(o, e.uid & 0xffff, true);
    o += 2;
    b8(e.ti);
    b8((e.elite ? 1 : 0) | (e.jefe ? 2 : 0) | (e.luz ? 4 : 0) | (e.congelado > 0 ? 8 : 0) | (e.lento > 0 ? 16 : 0) | (e.flash > 0 ? 32 : 0) | (e.sinDientes ? 64 : 0));
    pos(a, e.x, e.y);
    b8((e.hp / e.hpMax) * 255);
    b8(e.luz ? e.fase * 255 : (e.fase * 10) % 255);
    n++;
  }
  dv.setInt16(pos0, n, true);
  // Proyectiles
  const pos1 = o;
  i16(0);
  n = 0;
  for (const p of m.pr) {
    if (!p.vivo || n > 460) continue;
    const a = quienVe(p.x, p.y);
    if (a < 0) continue;
    b8(IDX_ARMA.get(p.arma) ?? 0);
    b8(p.comp | (p.mini ? 16 : 0));
    pos(a, p.x, p.y);
    i16(q(p.vx));
    i16(q(p.vy));
    b8(((p.ang % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2) * 255);
    b8((((p.t + p.ex) % 0.5) / 0.5) * 255);
    b8(Math.min(255, p.r * 4));
    n++;
  }
  dv.setInt16(pos1, n, true);
  // Zonas
  const pos2 = o;
  b8(0);
  n = 0;
  for (const z of m.zonas) {
    if (!z.vivo || n > 120) continue;
    b8(IDX_ARMA.get(z.arma) ?? 0);
    b8(z.tipo);
    pos(cercana(z.x, z.y), z.x, z.y);
    i16(Math.round(z.tipo === 1 ? z.w : z.r));
    i16(Math.round(z.h));
    b8(Math.min(255, z.vida * 40));
    b8(Math.min(255, z.t * 40));
    n++;
  }
  dv.setUint8(pos2, n);
  // Gotitas
  const pos3 = o;
  i16(0);
  n = 0;
  for (const gm of m.gemas) {
    if (!gm.vivo) continue;
    const a = quienVe(gm.x, gm.y);
    if (a < 0) continue;
    pos(a, gm.x, gm.y);
    b8(gm.tipo);
    n++;
  }
  dv.setInt16(pos3, n, true);
  // Cosas del piso (el cofre lleva su dueño cuando es de uno solo)
  const pos4 = o;
  b8(0);
  n = 0;
  for (const ob of m.objs) {
    if (!ob.vivo || n > 200) continue;
    const a = quienVe(ob.x, ob.y);
    if (a < 0) continue;
    b8(IDX_OBJ.get(ob.tipo) ?? 0);
    b8((ob.calidad & 15) | ((ob.dueno + 1) << 4));
    pos(a, ob.x, ob.y);
    n++;
  }
  dv.setUint8(pos4, n);
  // Lo que pasó (los golpes solo si se ven; los avisos van con su texto)
  const pos5 = o;
  i16(0);
  n = 0;
  const avisos: string[] = [];
  if (m.nEf - efDesde > m.ef.length) efDesde = m.nEf - m.ef.length;
  for (let k = efDesde; k < m.nEf && n < 220; k++) {
    const e = m.ef[k % m.ef.length];
    let a = quienVe(e.x, e.y);
    if (a < 0) {
      if (e.tipo === 'golpe' || e.tipo === 'muere' || e.tipo === 'gema') continue;
      a = cercana(e.x, e.y);
    }
    b8(IDX_EF.get(e.tipo) ?? 0);
    pos(a, e.x, e.y);
    f32(e.c);
    f32(e.d);
    f32(e.e);
    b8(e.f);
    if (e.tipo === 'aviso') avisos.push(e.t);
    n++;
  }
  dv.setInt16(pos5, n, true);
  const texto = JSON.stringify(avisos);
  i16(texto.length);
  for (let k = 0; k < texto.length; k++) i16(texto.charCodeAt(k));
  return { b: aBase64(o), efHasta: m.nEf };
}

/** Lo que el espejo necesita para mover suave a cada mugroso entre una foto y otra. */
interface Pasado {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** El celular de un invitado: aplica las fotos sobre un motor que no simula (solo guarda lo que se dibuja). */
export class Espejo {
  private pasados = new Map<number, Pasado>();
  private porUid = new Map<number, number>();
  private tFoto = 0;
  seq = -1;
  /** Hora local de la última foto (para detectar cortes). */
  ultimaFoto = 0;
  /** Lo que dice el anfitrión: en pausa por un corte, en pausa (alguien la puso), cargando, y quién está cortado. */
  banderas = 0;
  cortados = 0;
  private metas: ([number, number] | null)[] = [];

  constructor(readonly m: Motor, readonly yo: number) {}

  aplicar(b64: string) {
    const bin = atob(b64);
    const n = bin.length;
    if (n > u8.length) return;
    for (let i = 0; i < n; i++) u8[i] = bin.charCodeAt(i);
    let o = 0;
    const f32 = () => {
      const v = dv.getFloat32(o, true);
      o += 4;
      return v;
    };
    const i16 = () => {
      const v = dv.getInt16(o, true);
      o += 2;
      return v;
    };
    const b8 = () => dv.getUint8(o++);
    const leerPos = (): [number, number] => {
      const k = Math.min(3, b8());
      return [i16() + anclaX[k], i16() + anclaY[k]];
    };
    const seq = f32();
    if (seq <= this.seq) return;
    this.seq = seq;
    this.ultimaFoto = performance.now();
    this.tFoto = 0;
    const m = this.m;
    m.t = f32();
    m.tReal = f32();
    m.nivel = f32();
    m.xp = f32();
    m.eliminados = f32();
    m.oro = f32();
    m.hielo = f32();
    const banderas = b8();
    m.gano = !!(banderas & FOTO_GANO);
    if (banderas & FOTO_FIN) m.fin = true;
    this.banderas = banderas;
    this.cortados = b8();
    const nj = b8();
    for (let i = 0; i < nj; i++) {
      const j = m.jug[i];
      const x = f32(), y = f32(), vx = f32(), vy = f32(), dx = f32(), dy = f32(), vida = f32(), vidaMax = f32();
      const bj = b8();
      const rescate = b8() / 255;
      const aji = f32();
      const oro = f32();
      const tEscoger = b8() / 10;
      const ax = b8() / 127.5 - 1, ay = b8() / 127.5 - 1;
      const na = b8();
      const estado: [number, number, number, number, number][] = [];
      for (let k = 0; k < na; k++) estado.push([b8(), b8(), f32(), f32(), f32()]);
      // (las anclas salen de las posiciones que viajan, igual que en el anfitrión)
      if (i < 4) {
        anclaX[i] = Math.round(x);
        anclaY[i] = Math.round(y);
      }
      if (!j) continue;
      // El propio se mueve aquí; los demás, como llegan
      if (i !== this.yo) {
        this.metas[i] = [x, y];
        j.vx = vx;
        j.vy = vy;
        j.dx = dx;
        j.dy = dy;
        j.mira = bj & 2 ? 1 : -1;
        j.ax = ax;
        j.ay = ay;
        j.manual = !!(bj & 16);
      }
      const caidoAntes = j.caido, fueraAntes = j.fuera;
      j.caido = !!(bj & 1);
      j.fuera = !!(bj & 8);
      // Me levantaron, volví de un corte o estoy en burbujita: donde diga el anfitrión
      if (i === this.yo && ((caidoAntes && !j.caido) || (fueraAntes && !j.fuera) || j.caido)) {
        j.x = x;
        j.y = y;
      }
      if (i !== this.yo && (fueraAntes && !j.fuera)) {
        j.x = x;
        j.y = y;
      }
      j.vida = vida;
      j.vidaMax = vidaMax;
      j.invul = bj & 4 ? 0.1 : 0;
      j.rescate = rescate;
      j.aji = aji;
      j.oro = oro;
      j.tEscoger = tEscoger;
      estado.forEach(([ia, total, ang, activo, kk], k) => {
        const a = j.armas[k];
        if (!a || a.id !== ID_ARMAS[ia]) return;
        a.total = total;
        a.ang = ang;
        a.activo = activo;
        a.k = kk;
      });
    }
    // Mugrosos
    const ne = i16();
    const vistos = new Set<number>();
    for (let k = 0; k < ne; k++) {
      const uid = dv.getUint16(o, true);
      o += 2;
      const ti = b8(), fl = b8();
      const [x, y] = leerPos();
      const hp = b8() / 255, fase = b8();
      vistos.add(uid);
      let idx = this.porUid.get(uid);
      let e = idx !== undefined ? m.en[idx] : undefined;
      if (!e || !e.vivo) {
        idx = m.en.findIndex((c) => !c.vivo);
        if (idx < 0) continue;
        e = m.en[idx];
        e.vivo = true;
        e.uid = uid;
        e.x = x;
        e.y = y;
        e.fase = Math.random() * 10;
        this.porUid.set(uid, idx);
        this.pasados.set(uid, { x0: x, y0: y, x1: x, y1: y });
      }
      const id = ID_ENEMIGOS[ti];
      e.ti = ti;
      e.tipo = id;
      e.def = ENEMIGOS[id];
      e.elite = !!(fl & 1);
      e.jefe = !!(fl & 2);
      e.luz = !!(fl & 4);
      e.congelado = fl & 8 ? 0.2 : 0;
      e.lento = fl & 16 ? 0.2 : 0;
      if (fl & 32) e.flash = 0.13;
      e.sinDientes = !!(fl & 64);
      e.esc = e.elite ? 1.8 : 1;
      e.r = e.luz ? 14 : e.def.radio * e.esc;
      e.hp = hp;
      e.hpMax = 1;
      if (e.luz) e.fase = fase / 255;
      const p = this.pasados.get(uid)!;
      p.x0 = e.x;
      p.y0 = e.y;
      p.x1 = x;
      p.y1 = y;
    }
    for (const [uid, idx] of this.porUid) {
      if (vistos.has(uid)) continue;
      m.en[idx].vivo = false;
      this.porUid.delete(uid);
      this.pasados.delete(uid);
    }
    m.nVivos = 0;
    for (const idx of this.porUid.values()) m.vivos[m.nVivos++] = idx;
    // Proyectiles
    for (const p of m.pr) p.vivo = false;
    const np = i16();
    for (let k = 0; k < np; k++) {
      const ia = b8(), c = b8();
      const [x, y] = leerPos();
      const vx = i16(), vy = i16(), ang = b8(), ex = b8(), r = b8();
      const p = m.pr[k];
      if (!p) continue;
      p.vivo = true;
      p.arma = ID_ARMAS[ia];
      p.comp = c & 15;
      p.mini = !!(c & 16);
      p.x = x;
      p.y = y;
      p.vx = vx;
      p.vy = vy;
      p.ang = (ang / 255) * Math.PI * 2;
      p.ex = (ex / 255) * 0.5;
      p.t = 0;
      p.r = r / 4;
    }
    // Zonas
    for (const z of m.zonas) z.vivo = false;
    const nz = b8();
    for (let k = 0; k < nz; k++) {
      const arma = b8(), tipo = b8();
      const [x, y] = leerPos();
      const a = i16(), h = i16(), vida = b8(), t = b8();
      const z = m.zonas[k];
      if (!z) continue;
      z.vivo = true;
      z.arma = ID_ARMAS[arma];
      z.tipo = tipo;
      z.x = x;
      z.y = y;
      z.h = h;
      if (z.tipo === 1) z.w = a;
      else z.r = a;
      z.vida = vida / 40;
      z.t = t / 40;
    }
    // Gotitas
    for (const g of m.gemas) g.vivo = false;
    const ng = i16();
    for (let k = 0; k < ng; k++) {
      const [x, y] = leerPos();
      const tipo = b8();
      const g = m.gemas[k];
      if (!g) continue;
      g.vivo = true;
      g.x = x;
      g.y = y;
      g.tipo = tipo;
    }
    // Cosas del piso
    for (const ob of m.objs) ob.vivo = false;
    const no = b8();
    for (let k = 0; k < no; k++) {
      const tipo = b8(), cal = b8();
      const [x, y] = leerPos();
      const ob = m.objs[k];
      if (!ob) continue;
      ob.vivo = true;
      ob.tipo = OBJETOS[tipo] ?? 'moneda';
      ob.calidad = cal & 15;
      ob.dueno = (cal >> 4) - 1;
      ob.x = x;
      ob.y = y;
    }
    // Efectos
    const nf = i16();
    const efs: [TipoEfecto, number, number, number, number, number, number][] = [];
    for (let k = 0; k < nf; k++) {
      const tipo = TIPOS_EF[b8()] ?? 'golpe';
      const [x, y] = leerPos();
      efs.push([tipo, x, y, f32(), f32(), f32(), b8()]);
    }
    const largo = i16();
    let texto = '';
    for (let k = 0; k < largo; k++) texto += String.fromCharCode(i16());
    let avisos: string[] = [];
    try {
      avisos = JSON.parse(texto) as string[];
    } catch {
      avisos = [];
    }
    let ia = 0;
    for (const [tipo, x, y, c, d, e, f] of efs) m.emitir(tipo, x, y, c, d, e, f, tipo === 'aviso' ? avisos[ia++] ?? '' : '');
  }

  /** Movimiento suave entre fotos (las fotos llegan cada 0,1 s). */
  avanzar(dt: number) {
    this.tFoto += dt;
    const k = Math.min(1, this.tFoto / 0.1);
    const m = this.m;
    for (const [uid, idx] of this.porUid) {
      const e = m.en[idx];
      const p = this.pasados.get(uid);
      if (!p || !e.vivo) continue;
      const nx = p.x0 + (p.x1 - p.x0) * k, ny = p.y0 + (p.y1 - p.y0) * k;
      e.vx = (nx - e.x) / Math.max(dt, 1e-3);
      e.vy = (ny - e.y) / Math.max(dt, 1e-3);
      e.x = nx;
      e.y = ny;
      e.fase += dt;
      e.flash = Math.max(0, e.flash - dt);
    }
    for (const p of m.pr) {
      if (!p.vivo) continue;
      if (p.comp === 0 || p.comp === 3) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      p.t += dt;
    }
    for (const z of m.zonas) if (z.vivo) z.t += dt;
    for (const j of m.jug) {
      if (j.i === this.yo) continue;
      const meta = this.metas[j.i];
      if (!meta) continue;
      const kk = 1 - Math.exp(-dt * 12);
      j.x += (meta[0] - j.x) * kk;
      j.y += (meta[1] - j.y) * kk;
    }
  }
}

/** Lo que le queda a un jugador para escoger (con lo que dice la foto). */
export function restanteEspejo(j: Jugador) {
  return Math.max(0, (j.cofre ? LIMITE_COFRE : LIMITE_ESCOGER) - j.tEscoger);
}

/** Las armas y pasivas que existen (para validar lo que llega). */
export const ES_ARMA = (x: string): x is IdArma => ID_ARMAS.includes(x as IdArma);
export const ES_PASIVA = (x: string): x is IdPasiva => ID_PASIVAS.includes(x as IdPasiva);

export type { Efecto, ResumenPartida };
