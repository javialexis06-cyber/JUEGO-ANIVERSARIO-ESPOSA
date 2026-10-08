// El espejo de un invitado: una simulación que no simula. Se arma igual que la del anfitrión (misma semilla: mismo
// mapa y mismos objetivos) y cada foto le pone encima dónde está cada cosa. Entre foto y foto, todo sigue andando
// con su velocidad (así no se ve a saltos), y el jugador propio se mueve aquí mismo con su joystick (sin esperar al
// anfitrión), chocando con las paredes del espejo.
import { C } from '../tipos';
import { ENT, Entidad, Sucesos } from '../sim/estado';
import type { Jugador } from '../sim/jugador';
import type { Sim } from '../sim/sim';
import { TAM_A, TAM_E, TAM_P, TAM_R, aplicarJugador, deB64, type DatosJugador, type Foto } from './protocolo';

export class Espejo {
  /** Sucesos de las fotos que llegaron (los consume la escena cada cuadro). */
  sucOut = new Sucesos(4096);
  private porUid = new Map<number, number>();
  private objetivo = new Map<number, { x: number; y: number; vx: number; vy: number }>();
  private objetivoA = new Map<number, { x: number; y: number }>();
  private ultimaFoto = 0;
  /** Para el aviso de conexión: cuándo llegó la última foto. */
  llegada = performance.now();
  private nFoto = 0;

  constructor(public sim: Sim, public local: number) {
    // Lo que trae la simulación al armarse (altares, prisioneros…) llega en la primera foto
    for (let i = 0; i < sim.E.max; i++) if (sim.E.vivo[i]) sim.E.quitar(i);
  }

  get yo(): Jugador {
    return this.sim.J[this.local];
  }

  aplicar(f: Foto) {
    if (f.n <= this.nFoto || f.etapa !== this.sim.cfg.etapa) return;
    this.nFoto = f.n;
    const sim = this.sim;
    const dtFoto = this.ultimaFoto ? Math.min(0.5, (performance.now() - this.ultimaFoto) / 1000) : 0.125;
    this.ultimaFoto = this.llegada = performance.now();
    sim.t = f.t;
    sim.avance = f.av ?? 0;
    sim.oleadasHechas = f.ol ?? 0;
    sim.guardianVisto = !!f.gv;
    sim.impaciencia = f.imp ?? 0;
    sim.fase = f.fase;
    Object.assign(sim.obj, f.obj);
    Object.assign(sim.sec, f.sec);
    sim.jefeFase = f.jefeFase;
    sim.eclipse = f.ecl;
    sim.niebla = f.nie ?? 0;
    // Enemigos
    const E = sim.E;
    const de = new Int16Array(deB64(f.e));
    const vistos = new Set<number>();
    for (let o = 0; o + TAM_E <= de.length; o += TAM_E) {
      const uid = de[o] + 32768;
      vistos.add(uid);
      let i = this.porUid.get(uid);
      const x = de[o + 2] / 100, y = de[o + 3] / 100;
      if (i === undefined || !E.vivo[i] || E.uid[i] !== uid) {
        i = E.nuevoConUid(uid);
        if (i < 0) continue;
        this.porUid.set(uid, i);
        E.x[i] = x;
        E.y[i] = y;
        this.objetivo.set(i, { x, y, vx: 0, vy: 0 });
      } else {
        const ob = this.objetivo.get(i)!;
        ob.vx = (x - ob.x) / dtFoto;
        ob.vy = (y - ob.y) / dtFoto;
        ob.x = x;
        ob.y = y;
      }
      E.tipo[i] = de[o + 1];
      E.rot[i] = de[o + 4] / 1000;
      E.hpMax[i] = 1;
      E.hp[i] = de[o + 5] / 1000;
      E.elite[i] = de[o + 6];
      E.esc[i] = de[o + 7] / 100;
      const fl = de[o + 8];
      E.aturdido[i] = fl & 1 ? 0.5 : 0;
      E.lento[i] = fl & 2 ? 0.3 : 0;
      E.maldicion[i] = fl & 4 ? 1 : 0;
      E.marcadoObj[i] = fl & 8 ? 1 : fl & 128 ? 3 : 0;
      E.condenaT[i] = fl & 16 ? 1 : 0;
      E.juzgado[i] = fl & 32 ? 1 : 0;
      E.escudo[i] = fl & 64 ? 1 : 0;
      E.alt[i] = de[o + 9] / 100;
      E.ataque[i] = Math.max(E.ataque[i], de[o + 10] / 100);
      E.golpe[i] = Math.max(E.golpe[i], de[o + 11] / 100);
      E.r[i] = 0.4 * E.esc[i];
    }
    for (const [uid, i] of this.porUid) {
      if (vistos.has(uid)) continue;
      this.porUid.delete(uid);
      this.objetivo.delete(i);
      if (E.vivo[i] && E.uid[i] === uid) E.quitar(i);
    }
    sim.jefe = f.jefe >= 0 ? this.porUid.get(f.jefe) ?? -1 : -1;
    sim.guardian = f.g >= 0 ? this.porUid.get(f.g) ?? -1 : -1;
    // Proyectiles
    const dp = new Int16Array(deB64(f.p));
    let k = 0;
    for (let o = 0; o + TAM_P <= dp.length && k < sim.P.length; o += TAM_P, k++) {
      const p = sim.P[k];
      p.vivo = true;
      p.arma = dp[o];
      p.mov = dp[o + 1];
      p.mini = !!(dp[o + 2] & 1);
      p.dueno = dp[o + 2] & 2 ? -1 : dp[o + 2] & 4 ? -2 : 0;
      p.aliado = !!(dp[o + 2] & 4);
      p.x = dp[o + 3] / 100;
      p.y = dp[o + 4] / 100;
      p.z = dp[o + 5] / 100;
      p.ang = dp[o + 6] / 1000;
      p.vx = dp[o + 7] / 50;
      p.vy = dp[o + 8] / 50;
    }
    for (; k < sim.P.length; k++) sim.P[k].vivo = false;
    // Recogibles
    const dr = new Int16Array(deB64(f.r));
    k = 0;
    for (let o = 0; o + TAM_R <= dr.length && k < sim.R.length; o += TAM_R, k++) {
      const r = sim.R[k];
      r.vivo = true;
      r.id = dr[o];
      r.tipo = dr[o + 1];
      r.x = dr[o + 2] / 100;
      r.y = dr[o + 3] / 100;
      r.z = dr[o + 4] / 100;
    }
    for (; k < sim.R.length; k++) sim.R[k].vivo = false;
    // Aliados
    const da = new Int16Array(deB64(f.a));
    k = 0;
    for (let o = 0; o + TAM_A <= da.length && k < sim.A.length; o += TAM_A, k++) {
      const a = sim.A[k];
      const nuevo = !a.vivo || a.id !== da[o];
      a.vivo = true;
      a.id = da[o];
      a.tipo = da[o + 1] % 64;
      a.imita = Math.floor(da[o + 1] / 64) - 1;
      const x = da[o + 2] / 100, y = da[o + 3] / 100;
      if (nuevo) {
        a.x = x;
        a.y = y;
      }
      a.vx = (x - a.x) / dtFoto;
      a.vy = (y - a.y) / dtFoto;
      this.objetivoA.set(a.id, { x, y });
      a.rot = da[o + 4] / 1000;
      a.hpMax = 1;
      a.hp = da[o + 5] / 1000;
      a.ataque = Math.max(a.ataque, da[o + 6] / 100);
      a.golpe = Math.max(a.golpe, da[o + 7] / 100);
    }
    for (; k < sim.A.length; k++) sim.A[k].vivo = false;
    // Zonas
    k = 0;
    for (const z0 of f.z) {
      if (k >= sim.Z.length) break;
      const z = sim.Z[k++];
      const [id, tipo, x, y, r, vida, total, retraso, enemiga, arma, sigue] = z0;
      z.vivo = true;
      z.id = id;
      z.tipo = tipo;
      z.x = x;
      z.y = y;
      z.r = r;
      z.vida = vida;
      z.total = total;
      z.t = total - vida;
      z.retraso = retraso;
      z.enemiga = !!enemiga;
      z.arma = arma;
      z.sigue = sigue;
    }
    for (; k < sim.Z.length; k++) sim.Z[k].vivo = false;
    // Entidades (objetivos, campana, cofres)
    const viejas = new Map(sim.ent.map((e) => [e.id, e]));
    const nuevas = f.ent.map((d) => {
      const [id, tipo, x, y, hp, hpMax, prog, est, quien, cuenta, kk, vivo, dato, t] = d as number[];
      const e = viejas.get(id) ?? new Entidad();
      Object.assign(e, { id, tipo, x, y, hp, hpMax, prog, est, quien, cuenta, k: kk, vivo: !!vivo, dato: String(dato ?? ''), t });
      return e;
    });
    sim.ent = nuevas;
    sim.campana = nuevas.find((e) => e.tipo === ENT.EXTRACCION && e.vivo) ?? null;
    // Jugadores
    f.J.forEach((d, i) => {
      const j = sim.J[i];
      if (!j) return;
      const [x, y, vx, vy, fx, fy, hp, hpMax, estado, nivel, xp, oro, hierro, sangre, habT, habActiva, invisible, levantar, caidoT, exc, hpCelda, forzado, invul] = d;
      const propio = i === this.local;
      if (!propio || forzado || estado !== 0 || j.estado !== 0 || Math.hypot(x - j.x, y - j.y) > 2.5) {
        if (!propio) {
          this.objetivo.set(-1 - i, { x, y, vx, vy });
        } else {
          j.x = x;
          j.y = y;
        }
        if (!propio || forzado) {
          j.vx = vx;
          j.vy = vy;
        }
      }
      if (!propio) {
        j.fx = fx;
        j.fy = fy;
      }
      j.hp = hp;
      j.hpMax = hpMax;
      j.estado = estado;
      j.nivel = nivel;
      j.xp = xp;
      j.oro = oro;
      j.hierro = hierro;
      j.sangre = sangre;
      j.habT = habT;
      j.habActiva = habActiva;
      j.invisible = invisible;
      j.levantar = levantar;
      j.caidoT = caidoT;
      j.excavando = exc;
      j.invul = invul;
      (j as Jugador & { forzado?: number }).forzado = forzado;
      if (exc >= 0) sim.mapa.hp[exc] = hpCelda;
    });
    // Sucesos
    const ds = new Float32Array(deB64(f.s));
    const out = this.sucOut;
    for (let o = 0; o + 7 <= ds.length; o += 7) out.push(ds[o], ds[o + 1], ds[o + 2], ds[o + 3], ds[o + 4], ds[o + 5], ds[o + 6]);
  }

  /** Paredes que cambiaron en el anfitrión. */
  celdas(c: number[]) {
    const m = this.sim.mapa;
    for (let k = 0; k + 1 < c.length; k += 2) {
      const i = c[k], t = c[k + 1];
      if (m.c[i] === t) continue;
      m.c[i] = t;
      m.hp[i] = 0;
    }
    m.version++;
  }

  /** El estado completo de cada jugador (armas, objetos…), cada segundo. */
  detalle(J: DatosJugador[]) {
    J.forEach((d, i) => {
      const j = this.sim.J[i];
      if (!j) return;
      const x = j.x, y = j.y, hp = j.hp, estado = j.estado;
      aplicarJugador(j, d, false);
      j.x = x;
      j.y = y;
      j.hp = hp;
      j.estado = estado;
    });
  }

  /** Entre fotos: todo sigue con su velocidad; el jugador propio se mueve con su joystick. */
  avanzar(dt: number, mx: number, my: number) {
    const sim = this.sim;
    const E = sim.E;
    for (const [i, ob] of this.objetivo) {
      if (i < 0) {
        const j = sim.J[-1 - i];
        if (!j) continue;
        ob.x += ob.vx * dt;
        ob.y += ob.vy * dt;
        const k = Math.min(1, dt * 10);
        j.x += (ob.x - j.x) * k;
        j.y += (ob.y - j.y) * k;
        j.vx = ob.vx;
        j.vy = ob.vy;
        continue;
      }
      if (!E.vivo[i]) continue;
      ob.x += ob.vx * dt * 0.9;
      ob.y += ob.vy * dt * 0.9;
      const k = Math.min(1, dt * 9);
      const nx = E.x[i] + (ob.x - E.x[i]) * k, ny = E.y[i] + (ob.y - E.y[i]) * k;
      const v = Math.hypot(nx - E.x[i], ny - E.y[i]) / Math.max(1e-3, dt);
      E.x[i] = nx;
      E.y[i] = ny;
      E.vx[i] = ob.vx;
      E.vy[i] = ob.vy;
      E.fase[i] += v * dt * 2.4;
      E.ataque[i] = Math.max(0, E.ataque[i] - dt * 2.5);
      E.golpe[i] = Math.max(0, E.golpe[i] - dt * 5);
    }
    for (const p of sim.P) {
      if (!p.vivo) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.t += dt;
    }
    for (const a of sim.A) {
      if (!a.vivo) continue;
      const ob = this.objetivoA.get(a.id);
      const k = Math.min(1, dt * 9);
      if (ob) {
        a.x += (ob.x - a.x) * k;
        a.y += (ob.y - a.y) * k;
      }
      a.fase += Math.hypot(a.vx, a.vy) * dt * 2.4;
      a.ataque = Math.max(0, a.ataque - dt * 2.5);
      a.golpe = Math.max(0, a.golpe - dt * 5);
    }
    for (const z of sim.Z) if (z.vivo) {
      z.t += dt;
      if (z.retraso > 0) z.retraso = Math.max(0, z.retraso - dt);
    }
    sim.t += dt;
    // El propio
    const j = this.yo;
    if (!j) return;
    const forzado = (j as Jugador & { forzado?: number }).forzado;
    if (j.estado !== 0 || forzado) {
      j.x += j.vx * dt;
      j.y += j.vy * dt;
      return;
    }
    let ix = mx, iy = my;
    const l = Math.hypot(ix, iy);
    if (l > 1) {
      ix /= l;
      iy /= l;
    }
    let vel = j.velocidad;
    if (sim.mapa.get(Math.floor(j.x), Math.floor(j.y)) === C.AGUA) vel *= 0.6;
    const kk = Math.min(1, dt * 14);
    j.vx += (ix * vel - j.vx) * kk;
    j.vy += (iy * vel - j.vy) * kk;
    if (l > 0.15) {
      j.fx = ix / Math.max(l, 1e-3);
      j.fy = iy / Math.max(l, 1e-3);
    }
    sim.moverCirculo(j, j.vx * dt, j.vy * dt);
  }

  liberar() {
    this.porUid.clear();
    this.objetivo.clear();
  }
}

