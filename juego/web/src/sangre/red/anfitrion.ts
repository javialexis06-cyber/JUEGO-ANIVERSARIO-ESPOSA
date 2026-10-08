// El anfitrión de una partida en grupo: simula el mundo para todos, recibe el mando de cada invitado (cada uno se
// mueve en su aparato y manda dónde está; aquí se excava, se pelea y se cobra), le manda a cada uno sus cartas y
// reparte la foto del mundo 8 veces por segundo (más los sucesos para los efectos y los sonidos).
import * as mec from '../sim/mecanicas';
import { escoger, vetar, volverATirar } from '../sim/opciones';
import type { Sim } from '../sim/sim';
import type { Sala } from '../../salas/tipos';
import { Buzon, MSJ, TAM_A, TAM_E, TAM_P, TAM_R, aB64, q, serializarJugador, type Foto, type LuzJugador } from './protocolo';

const CADA_FOTO = 1 / 8;
const CADA_DETALLE = 1;
const MAX_E = 280, MAX_P = 200, MAX_R = 360, MAX_A = 60;

interface Remoto {
  i: number;
  id: string;
  hab: number;
  /** Cuántas veces ha tocado algo para recogerlo (para no repetir el pedido). */
  toma: number;
  eligiendoT: number;
  claveEleccion: string;
  ultimo: number;
}

export class Anfitrion {
  private buzon = new Buzon();
  private fotoT = 0;
  private detalleT = 0;
  private nFoto = 0;
  private copia: Uint8Array | null = null;
  private version = -1;
  private remotos = new Map<string, Remoto>();
  private quitar: (() => void)[] = [];
  private bufE = new Int16Array(MAX_E * TAM_E);
  private bufP = new Int16Array(MAX_P * TAM_P);
  private bufR = new Int16Array(MAX_R * TAM_R);
  private bufA = new Int16Array(MAX_A * TAM_A);
  sim: Sim | null = null;
  /** Invitados que ya armaron la etapa. */
  listos = new Set<string>();

  constructor(private sala: Sala, ids: string[], private local: number) {
    ids.forEach((id, i) => {
      if (i !== local) this.remotos.set(id, { i, id, hab: 0, toma: 0, eligiendoT: 0, claveEleccion: '', ultimo: 0 });
    });
    this.quitar.push(
      sala.al(MSJ.MANDO, (d, de) => this.alMando(d as number[], de.id)),
      sala.al(MSJ.ESCOGER, (d, de) => this.alEscoger(d as { a: string; k: number }, de.id)),
      sala.al(MSJ.ETAPA_LISTA, (d, de) => {
        if ((d as { etapa: number }).etapa === this.sim?.cfg.etapa) this.listos.add(de.id);
      }),
    );
  }

  /** Etapa nueva: se olvida el mapa viejo. */
  nuevaEtapa(sim: Sim) {
    this.sim = sim;
    this.copia = sim.mapa.c.slice();
    this.version = sim.mapa.version;
    this.listos.clear();
    for (const r of this.remotos.values()) {
      r.claveEleccion = '';
      r.eligiendoT = 0;
      const j = sim.J[r.i];
      if (j) j.remoto = true;
    }
    this.sala.mandar(MSJ.ETAPA, { etapa: sim.cfg.etapa });
  }

  get faltan() {
    return [...this.remotos.values()].filter((r) => !this.listos.has(r.id)).map((r) => r.i);
  }

  private alMando(d: number[], id: string) {
    const r = this.remotos.get(id);
    const j = r && this.sim?.J[r.i];
    if (!r || !j) return;
    const [x, y, vx, vy, fx, fy, mx, my, hab, tx, ty, toma] = d;
    r.ultimo = performance.now();
    // Si el anfitrión lo está moviendo (embestida, encanto), manda el anfitrión
    if (j.estado === 0 && !mec.embistiendo(j) && j.encantoT <= 0 && this.sim!.mapa.libre(Math.floor(x), Math.floor(y))) {
      j.x = x;
      j.y = y;
      j.vx = vx;
      j.vy = vy;
    }
    if (fx || fy) {
      j.fx = fx;
      j.fy = fy;
    }
    j.mx = mx;
    j.my = my;
    if (hab > r.hab) {
      r.hab = hab;
      j.pideHabilidad = true;
    }
    // (los invitados de antes no mandan el toque: llega undefined)
    if (typeof toma === 'number' && toma > r.toma) {
      r.toma = toma;
      j.pideTomar = { x: tx, y: ty };
    }
  }

  private alEscoger(d: { a: string; k: number }, id: string) {
    const r = this.remotos.get(id);
    const sim = this.sim;
    const j = r && sim?.J[r.i];
    if (!r || !j || !sim) return;
    if (d.a === 'escoger') escoger(sim, j, d.k);
    else if (d.a === 'tirar') volverATirar(sim, j);
    else if (d.a === 'vetar') vetar(sim, j, d.k);
    r.eligiendoT = 0;
    r.claveEleccion = '';
  }

  /** Después de cada paso de la simulación. */
  alPaso(sim: Sim, dt: number) {
    this.buzon.meter(sim.suc);
    // Los que están escogiendo: protegidos y, si se demoran, se les escoge la primera
    for (const r of this.remotos.values()) {
      const j = sim.J[r.i];
      if (!j) continue;
      if (j.cola.length) {
        j.invul = Math.max(j.invul, 0.15);
        r.eligiendoT += dt;
        if (r.eligiendoT > 13) {
          escoger(sim, j, 0);
          r.eligiendoT = 0;
        }
      } else r.eligiendoT = 0;
    }
  }

  /** Cada cuadro (después de los pasos). */
  alCuadro(sim: Sim, dt: number) {
    // Paredes que cambiaron (fiable, en orden)
    if (this.copia && sim.mapa.version !== this.version) {
      this.version = sim.mapa.version;
      const c = sim.mapa.c, cambios: number[] = [];
      for (let i = 0; i < c.length; i++)
        if (c[i] !== this.copia[i]) {
          this.copia[i] = c[i];
          cambios.push(i, c[i]);
        }
      if (cambios.length) this.sala.mandar(MSJ.CELDAS, { etapa: sim.cfg.etapa, c: cambios });
    }
    // Cartas de cada invitado
    for (const r of this.remotos.values()) {
      const j = sim.J[r.i];
      if (!j) continue;
      const e = j.cola[0];
      const clave = e ? JSON.stringify([e.titulo, e.opciones.map((o) => o.id + o.rareza), j.tiradas, j.vetos, j.cola.length]) : '';
      if (clave !== r.claveEleccion) {
        r.claveEleccion = clave;
        this.sala.mandar(MSJ.ELECCION, { e: e ?? null, n: j.cola.length, tiradas: j.tiradas, vetos: j.vetos, t: 13 - r.eligiendoT }, { a: r.id });
      }
    }
    this.fotoT += dt;
    this.detalleT += dt;
    if (this.fotoT >= CADA_FOTO) {
      this.fotoT = 0;
      this.sala.mandar(MSJ.FOTO, this.foto(sim), { rapido: true });
    }
    if (this.detalleT >= CADA_DETALLE) {
      this.detalleT = 0;
      this.sala.mandar(MSJ.DETALLE, { etapa: sim.cfg.etapa, J: sim.J.map((j) => serializarJugador(j)) }, { rapido: true });
    }
  }

  private foto(sim: Sim): Foto {
    const cerca = (x: number, y: number) => {
      let d = 1e9;
      for (const j of sim.J) d = Math.min(d, (j.x - x) ** 2 + (j.y - y) ** 2);
      return d;
    };
    // Enemigos (los más cercanos a alguien si son demasiados)
    const E = sim.E;
    let idx: number[] = [];
    for (let i = 0; i < E.max; i++) if (E.vivo[i]) idx.push(i);
    if (idx.length > MAX_E) idx = idx.map((i) => [i, cerca(E.x[i], E.y[i])]).sort((a, b) => a[1] - b[1]).slice(0, MAX_E).map((x) => x[0]);
    const be = this.bufE;
    idx.forEach((i, k) => {
      const o = k * TAM_E;
      let fl = 0;
      if (E.aturdido[i] > 0) fl |= 1;
      if (E.lento[i] > 0) fl |= 2;
      if (E.maldicion[i] > 0) fl |= 4;
      if (E.marcadoObj[i] === 1) fl |= 8;
      if (E.marcadoObj[i] >= 3) fl |= 128;
      if (E.condenaT[i] > 0) fl |= 16;
      if (E.juzgado[i] > 0) fl |= 32;
      if (E.escudo[i] > 0) fl |= 64;
      be[o] = E.uid[i] - 32768;
      be[o + 1] = E.tipo[i];
      be[o + 2] = q(E.x[i]);
      be[o + 3] = q(E.y[i]);
      be[o + 4] = q(E.rot[i], 1000);
      be[o + 5] = q(E.hpMax[i] > 0 ? E.hp[i] / E.hpMax[i] : 1, 1000);
      be[o + 6] = E.elite[i];
      be[o + 7] = q(E.esc[i]);
      be[o + 8] = fl;
      be[o + 9] = q(E.alt[i]);
      be[o + 10] = q(E.ataque[i]);
      be[o + 11] = q(E.golpe[i]);
    });
    // Proyectiles
    const bp = this.bufP;
    let np = 0;
    for (const p of sim.P) {
      if (!p.vivo || np >= MAX_P) continue;
      const o = np * TAM_P;
      bp[o] = p.arma;
      bp[o + 1] = p.mov;
      bp[o + 2] = (p.mini ? 1 : 0) | (p.dueno < 0 && !p.aliado ? 2 : 0) | (p.aliado ? 4 : 0);
      bp[o + 3] = q(p.x);
      bp[o + 4] = q(p.y);
      bp[o + 5] = q(p.z);
      bp[o + 6] = q(p.ang, 1000);
      bp[o + 7] = q(p.vx, 50);
      bp[o + 8] = q(p.vy, 50);
      np++;
    }
    // Recogibles (los más cercanos)
    let rec = sim.R.filter((r) => r.vivo);
    if (rec.length > MAX_R) rec = rec.map((r) => [r, cerca(r.x, r.y)] as const).sort((a, b) => a[1] - b[1]).slice(0, MAX_R).map((x) => x[0]);
    const br = this.bufR;
    rec.forEach((r, k) => {
      const o = k * TAM_R;
      br[o] = r.id & 0x7fff;
      br[o + 1] = r.tipo;
      br[o + 2] = q(r.x);
      br[o + 3] = q(r.y);
      br[o + 4] = q(r.z);
    });
    // Aliados
    const ba = this.bufA;
    let na = 0;
    for (const a of sim.A) {
      if (!a.vivo || na >= MAX_A) continue;
      const o = na * TAM_A;
      ba[o] = a.id & 0x7fff;
      ba[o + 1] = a.tipo + (a.imita >= 0 ? (a.imita + 1) * 64 : 0);
      ba[o + 2] = q(a.x);
      ba[o + 3] = q(a.y);
      ba[o + 4] = q(a.rot, 1000);
      ba[o + 5] = q(a.hpMax > 0 ? a.hp / a.hpMax : 1, 1000);
      ba[o + 6] = q(a.ataque);
      ba[o + 7] = q(a.golpe);
      na++;
    }
    const J: LuzJugador[] = sim.J.map((j) => {
      const exc = j.excavando;
      return [
        +j.x.toFixed(2), +j.y.toFixed(2), +j.vx.toFixed(2), +j.vy.toFixed(2), +j.fx.toFixed(2), +j.fy.toFixed(2), Math.round(j.hp * 10) / 10, Math.round(j.hpMax), j.estado,
        j.nivel, Math.round(j.xp), Math.floor(j.oro), Math.floor(j.hierro), Math.floor(j.sangre), +j.habT.toFixed(2), +j.habActiva.toFixed(2), +j.invisible.toFixed(2),
        +j.levantar.toFixed(2), +j.caidoT.toFixed(1), exc, exc >= 0 ? Math.round(sim.mapa.hp[exc] * 10) / 10 : 0, mec.embistiendo(j) || j.encantoT > 0 ? 1 : 0, +j.invul.toFixed(2),
      ];
    });
    return {
      n: ++this.nFoto, etapa: sim.cfg.etapa, t: +sim.t.toFixed(2), av: +sim.avance.toFixed(4), ol: sim.oleadasHechas,
      g: sim.guardian >= 0 && E.vivo[sim.guardian] ? E.uid[sim.guardian] : -1, gv: sim.guardianVisto ? 1 : 0, imp: sim.impaciencia, fase: sim.fase, obj: { ...sim.obj }, sec: { ...sim.sec },
      jefe: sim.jefe >= 0 && E.vivo[sim.jefe] ? E.uid[sim.jefe] : -1, jefeFase: sim.jefeFase, ecl: +sim.eclipse.toFixed(2), J,
      e: aB64(be.subarray(0, idx.length * TAM_E)), p: aB64(bp.subarray(0, np * TAM_P)), r: aB64(br.subarray(0, rec.length * TAM_R)), a: aB64(ba.subarray(0, na * TAM_A)),
      z: sim.Z.filter((z) => z.vivo).slice(0, 80).map((z) => [z.id, z.tipo, +z.x.toFixed(2), +z.y.toFixed(2), +z.r.toFixed(2), +z.vida.toFixed(2), +z.total.toFixed(2), +z.retraso.toFixed(2), z.enemiga ? 1 : 0, z.arma, z.sigue]),
      ent: sim.ent.map((e) => [e.id, e.tipo, +e.x.toFixed(2), +e.y.toFixed(2), Math.round(e.hp), Math.round(e.hpMax), +e.prog.toFixed(3), e.est, e.quien, +e.cuenta.toFixed(1), e.k, e.vivo ? 1 : 0, e.dato, +e.t.toFixed(2)]),
      s: this.buzon.sacar(),
    };
  }

  /** ¿Cuánto hace que no se oye a cada invitado? (para el aviso de conexión). */
  silencio(i: number) {
    for (const r of this.remotos.values()) if (r.i === i) return r.ultimo ? (performance.now() - r.ultimo) / 1000 : 0;
    return 0;
  }

  liberar() {
    for (const q2 of this.quitar) q2();
    this.quitar = [];
  }
}
