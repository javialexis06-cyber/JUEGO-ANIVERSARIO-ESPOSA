// «Lavarse la cara» en pareja, cada uno en su celular (como el cooperativo del original). El que invita
// (anfitrión) simula todo con el motor y cada décima de segundo le manda al otro una «foto» compacta (binaria, en
// base64) de lo que el otro alcanza a ver: mugrosos, proyectiles, gotitas, cosas del piso, zonas y lo que pasó. El
// invitado es un espejo: dibuja la foto con movimiento suave entre una y otra y mueve a su personaje apenas toca
// el joystick (le manda su posición al anfitrión). El inventario, las cartas al subir de nivel y los cofres
// viajan aparte, en JSON, cuando cambian. Si se corta la conexión, los dos quedan en pausa con aviso.
import type { RealtimeChannel } from '@supabase/supabase-js';
import { ID_ARMAS, ID_PASIVAS, baseEnNivel } from './armas';
import { ID_ENEMIGOS, ENEMIGOS } from './enemigos';
import { MAX_ENEMIGOS, type CofreAbierto, type Jugador, type Motor, type Opcion, type OpcionesJugador } from './motor';
import type { ResumenPartida } from './progreso';
import type { Efecto, IdArma, IdCarta, IdEscenario, IdObjeto, IdPasiva, Rol, Stats, TipoEfecto } from './tipos';

export interface Invitacion {
  id: string;
  de: Rol;
}

export interface ConfigPartida {
  escenario: IdEscenario;
  apurado: boolean;
  semilla: number;
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
  vetadas: string[];
  danos: [IdArma, number, number][];
}

export type MensajeLavado =
  | { t: 'hola'; de: Rol }
  | { t: 'inv'; id: string; de: Rol }
  | { t: 'cancelar'; id: string }
  | { t: 'unirse'; id: string; jugador: OpcionesJugador }
  | { t: 'empezar'; id: string; config: ConfigPartida }
  | { t: 'foto'; id: string; b: string }
  | { t: 'inventario'; id: string; jug: InvJugador[] }
  | { t: 'mando'; id: string; x: number; y: number; vx: number; vy: number; w: number; h: number }
  | { t: 'escoger'; id: string; k: number }
  | { t: 'tirar'; id: string }
  | { t: 'saltar'; id: string }
  | { t: 'vetar'; id: string; k: number }
  | { t: 'cofre'; id: string }
  | { t: 'carta'; id: string; c: IdCarta | null }
  | { t: 'pausa'; id: string; si: boolean; de: Rol; n?: number }
  | { t: 'latido'; id: string; de: Rol }
  | { t: 'fin'; id: string; retiro: boolean; resumen?: ResumenPartida }
  | { t: 'salir'; id: string; de: Rol };

const otro = (r: Rol): Rol => (r === 'el' ? 'ella' : 'el');

/** Pruebas: demoras y pérdidas de mentiras en el modo local (?red=mala). */
const RED_MALA = typeof location !== 'undefined' && new URLSearchParams(location.search).get('red') === 'mala';

export class CanalLavado {
  listo = false;
  otroPresente = false;
  error = '';
  alMensaje: (m: MensajeLavado) => void = () => undefined;
  alCambiar: () => void = () => undefined;
  private canal: RealtimeChannel | null = null;
  private local: BroadcastChannel | null = null;
  private vistoOtro = 0;
  private latido = 0;
  avisarCasa: ((datos: Record<string, unknown>) => Promise<void>) | null = null;

  constructor(public yo: Rol, private modo: 'local' | 'linea') {}

  async conectar(): Promise<boolean> {
    if (this.modo === 'local') return this.conectarLocal();
    try {
      const { conexionPareja, eventoPareja } = await import('../sincro');
      const c = await conexionPareja();
      if (!c) {
        this.error = 'Este celular no está en la casa en línea.';
        return false;
      }
      this.yo = c.sesion.rol;
      this.avisarCasa = (datos) => eventoPareja(c.sb, c.sesion, 'juego', datos);
      await new Promise<void>((listo) => {
        let hecho = false;
        const fin = () => {
          if (!hecho) {
            hecho = true;
            listo();
          }
        };
        this.canal = c.sb
          .channel(`lavado-${c.sesion.parejaId}`, { config: { broadcast: { self: false }, presence: { key: this.yo } } })
          .on('broadcast', { event: 'lavado' }, ({ payload }) => this.llega(payload as MensajeLavado))
          .on('presence', { event: 'sync' }, () => {
            const estado = this.canal!.presenceState();
            const antes = this.otroPresente;
            this.otroPresente = !!estado[otro(this.yo)]?.length;
            if (antes !== this.otroPresente) this.alCambiar();
          })
          .subscribe((s) => {
            if (s === 'SUBSCRIBED') {
              this.listo = true;
              void this.canal!.track({ rol: this.yo, t: Date.now() });
              this.alCambiar();
              fin();
            } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
              this.listo = false;
              this.alCambiar();
              fin();
            }
          });
        setTimeout(fin, 12000);
      });
      return this.listo;
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
      return false;
    }
  }

  private conectarLocal() {
    this.local = new BroadcastChannel('lavado-linea');
    this.local.onmessage = (e) => {
      const m = e.data as MensajeLavado & { para?: Rol };
      if (m.para && m.para !== this.yo) return;
      if (m.t === 'hola') {
        if (m.de === this.yo) return;
        const antes = this.otroPresente;
        this.vistoOtro = Date.now();
        this.otroPresente = true;
        if (!antes) this.alCambiar();
        return;
      }
      if (RED_MALA) {
        if (Math.random() < 0.06 && m.t !== 'empezar' && m.t !== 'unirse') return;
        setTimeout(() => this.llega(m), 30 + Math.random() * 220);
        return;
      }
      this.llega(m);
    };
    const hola = () => {
      this.local?.postMessage({ t: 'hola', de: this.yo });
      if (this.otroPresente && Date.now() - this.vistoOtro > 3500) {
        this.otroPresente = false;
        this.alCambiar();
      }
    };
    hola();
    this.latido = window.setInterval(hola, 1000);
    this.listo = true;
    return true;
  }

  private llega(m: MensajeLavado) {
    try {
      this.alMensaje(m);
    } catch (e) {
      console.error(e);
    }
  }

  mandar(m: MensajeLavado) {
    if (this.local) this.local.postMessage({ ...m, para: otro(this.yo) });
    else void this.canal?.send({ type: 'broadcast', event: 'lavado', payload: m });
  }

  cerrar() {
    clearInterval(this.latido);
    this.local?.close();
    this.local = null;
    void this.canal?.unsubscribe();
    this.canal = null;
    this.listo = false;
  }
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
      return { id, nivel, b: baseEnNivel(id, nivel), t: 0, rafaga: 0, tr: 0, total: a?.total ?? 1, k: a?.k ?? 0, ang: a?.ang ?? 0, activo: a?.activo ?? 0, desde: a?.desde ?? 0 };
    });
    j.pasivas = new Map(d.pasivas);
    j.st = { ...d.st };
    j.vidaMax = d.st.vida;
    j.cartas = [...d.cartas];
    j.opciones = d.opciones;
    j.cofre = d.cofre;
    j.cartaOpciones = d.cartaOpciones;
    [j.usadosTirar, j.usadosSaltar, j.usadosVetar, j.revivesUsados] = d.usados;
    j.vetadas = new Set(d.vetadas);
    j.danos = new Map(d.danos.map(([id, dano, desde]) => [id, { dano, desde }]));
  });
}

// ---------------------------------------------------------------------------------------------------- La foto
const TIPOS_EF: TipoEfecto[] = ['golpe', 'muere', 'latigo', 'rayo', 'charco', 'limpiar', 'explosion', 'gema', 'moneda', 'curar', 'nivel', 'cofre', 'herido',
  'revive', 'cae', 'levanta', 'congela', 'jefe', 'aviso', 'romper', 'evolucion', 'columna', 'haz', 'fuego'];
const IDX_EF = new Map(TIPOS_EF.map((t, i) => [t, i]));
const IDX_ARMA = new Map(ID_ARMAS.map((a, i) => [a, i]));
const OBJETOS: IdObjeto[] = ['arepa', 'ola', 'hielo', 'aspiradora', 'moneda', 'bolsa', 'frasco', 'trebolito', 'aji', 'cofre'];
const IDX_OBJ = new Map(OBJETOS.map((o, i) => [o, i]));

const buf = new ArrayBuffer(96 * 1024);
const dv = new DataView(buf);
const u8 = new Uint8Array(buf);

function aBase64(n: number): string {
  let s = '';
  for (let i = 0; i < n; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(u8.subarray(i, Math.min(n, i + 0x8000))));
  return btoa(s);
}

/** Arma la foto para el invitado `para` (solo lo que él alcanza a ver, más un margen). efDesde: desde qué efecto. */
export function tomarFoto(m: Motor, para: number, efDesde: number, seq: number): { b: string; efHasta: number } {
  const g = m.jug[para];
  const rx = Math.round(g.x), ry = Math.round(g.y);
  const mx = g.vistaW / 2 + 220, my = g.vistaH / 2 + 260;
  const dentro = (x: number, y: number) => Math.abs(x - rx) < mx && Math.abs(y - ry) < my;
  const q = (v: number, ref: number) => Math.max(-32767, Math.min(32767, Math.round(v - ref)));
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
  f32(seq);
  f32(rx);
  f32(ry);
  f32(m.t);
  f32(m.tReal);
  f32(m.nivel);
  f32(m.xp);
  f32(m.eliminados);
  f32(m.oro);
  f32(m.hielo);
  b8((m.gano ? 1 : 0) | (m.fin ? 2 : 0));
  // Jugadores
  b8(m.jug.length);
  for (const j of m.jug) {
    f32(j.x);
    f32(j.y);
    f32(j.vx);
    f32(j.vy);
    f32(j.dx);
    f32(j.dy);
    f32(j.vida);
    f32(j.vidaMax);
    b8((j.caido ? 1 : 0) | (j.mira > 0 ? 2 : 0) | (j.invul > 0 ? 4 : 0));
    b8(j.rescate * 255);
    f32(j.aji);
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
  for (let k = 0; k < m.nVivos && n < MAX_ENEMIGOS + 40; k++) {
    const e = m.en[m.vivos[k]];
    if (!e.vivo || (!e.jefe && !dentro(e.x, e.y))) continue;
    dv.setUint16(o, e.uid & 0xffff, true);
    o += 2;
    b8(e.ti);
    b8((e.elite ? 1 : 0) | (e.jefe ? 2 : 0) | (e.luz ? 4 : 0) | (e.congelado > 0 ? 8 : 0) | (e.lento > 0 ? 16 : 0) | (e.flash > 0 ? 32 : 0));
    i16(q(e.x, rx));
    i16(q(e.y, ry));
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
    if (!p.vivo || !dentro(p.x, p.y) || n > 400) continue;
    b8(IDX_ARMA.get(p.arma) ?? 0);
    b8(p.comp | (p.mini ? 16 : 0));
    i16(q(p.x, rx));
    i16(q(p.y, ry));
    i16(Math.round(Math.max(-32767, Math.min(32767, p.vx))));
    i16(Math.round(Math.max(-32767, Math.min(32767, p.vy))));
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
    i16(q(z.x, rx));
    i16(q(z.y, ry));
    i16(Math.round(z.tipo ? z.w : z.r));
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
    if (!gm.vivo || !dentro(gm.x, gm.y)) continue;
    i16(q(gm.x, rx));
    i16(q(gm.y, ry));
    b8(gm.tipo);
    n++;
  }
  dv.setInt16(pos3, n, true);
  // Cosas del piso
  const pos4 = o;
  b8(0);
  n = 0;
  for (const ob of m.objs) {
    if (!ob.vivo || !dentro(ob.x, ob.y) || n > 200) continue;
    b8(IDX_OBJ.get(ob.tipo) ?? 0);
    b8(ob.calidad);
    i16(q(ob.x, rx));
    i16(q(ob.y, ry));
    n++;
  }
  dv.setUint8(pos4, n);
  // Lo que pasó (los golpes solo si se ven; los avisos van con su texto)
  const pos5 = o;
  i16(0);
  n = 0;
  const avisos: string[] = [];
  if (m.nEf - efDesde > m.ef.length) efDesde = m.nEf - m.ef.length;
  for (let k = efDesde; k < m.nEf && n < 160; k++) {
    const e = m.ef[k % m.ef.length];
    if ((e.tipo === 'golpe' || e.tipo === 'muere' || e.tipo === 'gema') && !dentro(e.x, e.y)) continue;
    b8(IDX_EF.get(e.tipo) ?? 0);
    i16(q(e.x, rx));
    i16(q(e.y, ry));
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

/** El celular del invitado: aplica las fotos sobre un motor que no simula (solo guarda lo que se dibuja). */
export class Espejo {
  private pasados = new Map<number, Pasado>();
  private porUid = new Map<number, number>();
  private tFoto = 0;
  seq = -1;
  /** Hora local de la última foto (para detectar cortes). */
  ultimaFoto = 0;

  constructor(readonly m: Motor, readonly yo: number) {}

  aplicar(b64: string) {
    const bin = atob(b64);
    const n = bin.length;
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
    const seq = f32();
    if (seq <= this.seq) return;
    this.seq = seq;
    this.ultimaFoto = performance.now();
    this.tFoto = 0;
    const m = this.m;
    const rx = f32(), ry = f32();
    m.t = f32();
    m.tReal = f32();
    m.nivel = f32();
    m.xp = f32();
    m.eliminados = f32();
    m.oro = f32();
    m.hielo = f32();
    const banderas = b8();
    m.gano = !!(banderas & 1);
    m.fin = !!(banderas & 2);
    const nj = b8();
    for (let i = 0; i < nj; i++) {
      const j = m.jug[i];
      const x = f32(), y = f32(), vx = f32(), vy = f32(), dx = f32(), dy = f32(), vida = f32(), vidaMax = f32();
      const bj = b8();
      const rescate = b8() / 255;
      const aji = f32();
      const na = b8();
      const estado: [number, number, number, number, number][] = [];
      for (let k = 0; k < na; k++) estado.push([b8(), b8(), f32(), f32(), f32()]);
      if (!j) continue;
      // El propio se mueve aquí; los demás, como llegan
      if (i !== this.yo) {
        (j as Jugador & { meta?: [number, number] }).meta = [x, y];
        j.vx = vx;
        j.vy = vy;
        j.dx = dx;
        j.dy = dy;
        j.mira = bj & 2 ? 1 : -1;
      }
      const caidoAntes = j.caido;
      j.caido = !!(bj & 1);
      if (i === this.yo && caidoAntes !== j.caido && !j.caido) {
        j.x = x;
        j.y = y;
      }
      if (i === this.yo && j.caido) {
        j.x = x;
        j.y = y;
      }
      j.vida = vida;
      j.vidaMax = vidaMax;
      j.invul = bj & 4 ? 0.1 : 0;
      j.rescate = rescate;
      j.aji = aji;
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
      const x = i16() + rx, y = i16() + ry;
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
    for (let k = 0; k < np && k < m.pr.length; k++) {
      const p = m.pr[k];
      p.vivo = true;
      p.arma = ID_ARMAS[b8()];
      const c = b8();
      p.comp = c & 15;
      p.mini = !!(c & 16);
      p.x = i16() + rx;
      p.y = i16() + ry;
      p.vx = i16();
      p.vy = i16();
      p.ang = (b8() / 255) * Math.PI * 2;
      p.ex = (b8() / 255) * 0.5;
      p.t = 0;
      p.r = b8() / 4;
    }
    // Zonas
    for (const z of m.zonas) z.vivo = false;
    const nz = b8();
    for (let k = 0; k < nz && k < m.zonas.length; k++) {
      const z = m.zonas[k];
      z.vivo = true;
      z.arma = ID_ARMAS[b8()];
      z.tipo = b8();
      z.x = i16() + rx;
      z.y = i16() + ry;
      const a = i16();
      z.h = i16();
      if (z.tipo) z.w = a;
      else z.r = a;
      z.vida = b8() / 40;
      z.t = b8() / 40;
    }
    // Gotitas
    for (const g of m.gemas) g.vivo = false;
    const ng = i16();
    for (let k = 0; k < ng && k < m.gemas.length; k++) {
      const g = m.gemas[k];
      g.vivo = true;
      g.x = i16() + rx;
      g.y = i16() + ry;
      g.tipo = b8();
    }
    // Cosas del piso
    for (const ob of m.objs) ob.vivo = false;
    const no = b8();
    for (let k = 0; k < no && k < m.objs.length; k++) {
      const ob = m.objs[k];
      ob.vivo = true;
      ob.tipo = OBJETOS[b8()] ?? 'moneda';
      ob.calidad = b8();
      ob.x = i16() + rx;
      ob.y = i16() + ry;
    }
    // Efectos
    const nf = i16();
    const efs: [TipoEfecto, number, number, number, number, number, number][] = [];
    for (let k = 0; k < nf; k++) {
      const tipo = TIPOS_EF[b8()] ?? 'golpe';
      const x = i16() + rx, y = i16() + ry;
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
      const meta = (j as Jugador & { meta?: [number, number] }).meta;
      if (!meta) continue;
      const kk = 1 - Math.exp(-dt * 12);
      j.x += (meta[0] - j.x) * kk;
      j.y += (meta[1] - j.y) * kk;
    }
  }
}

/** Las armas y pasivas que existen (para validar lo que llega). */
export const ES_ARMA = (x: string): x is IdArma => ID_ARMAS.includes(x as IdArma);
export const ES_PASIVA = (x: string): x is IdPasiva => ID_PASIVAS.includes(x as IdPasiva);

export type { Efecto };
