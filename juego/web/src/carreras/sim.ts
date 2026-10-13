// La carrera por dentro (sin three.js): los carros, la física arcade (acelerar, girar, derrapar con mini-turbo,
// saltos con truco, rebufo, choques), las cajas y los objetos, las vueltas, los puestos y la máquina que maneja a los
// que no son personas. Corre a 60 pasos por segundo; la vista solo lee el estado.
//
// En línea (src/carreras/red.ts) cada aparato mueve SU carro (`control: 'local'`) y el anfitrión mueve a la máquina,
// las cajas y los objetos; los carros de los demás llegan por la red (`control: 'remoto'`).
import { CRIATURAS, pesosObjeto, VUELTAS, type Corredor, type IdObjeto, type Stats } from './datos';
import { angulo, CAIDA, HIELO, LAVA, type Lugar, type Pista } from './pista';

export const PASO = 1 / 60;
const VMAX = 30;
const GRAVEDAD = 30;

export interface Entrada {
  /** −1 (izquierda) … 1 (derecha). */
  giro: number;
  /** 1 acelera, 0 suelta, −1 frena / reversa. */
  acel: number;
  derrape: boolean;
  /** Se tocó «objeto» (un solo paso). */
  objeto: boolean;
  /** Lanzar hacia atrás (joystick abajo). */
  atras: boolean;
  /** Lanzar hacia adelante (joystick arriba). */
  adelante: boolean;
}
export const entradaVacia = (): Entrada => ({ giro: 0, acel: 0, derrape: false, objeto: false, atras: false, adelante: false });

export type Control = 'local' | 'ia' | 'remoto';

export interface Kart {
  i: number;
  c: Corredor;
  control: Control;
  /** Es una persona (para el empuje de la máquina y los avisos). */
  humano: boolean;
  st: Stats;
  x: number;
  y: number;
  z: number;
  /** Hacia dónde mira (adelante = (sin h, cos h)). */
  h: number;
  /** Hacia dónde se mueve (se acerca a h según el agarre: así se ve el derrape). */
  m: number;
  v: number;
  vy: number;
  suelo: boolean;
  aire: number;
  lugar: Lugar;
  vuelta: number;
  control50: boolean;
  /** Progreso total (vuelta * n + metro). */
  prog: number;
  puesto: number;
  terminado: boolean;
  tiempo: number;
  vueltas: number[];
  inicioVuelta: number;
  // estado
  derrape: number;
  carga: number;
  turbo: number;
  turboNivel: number;
  rebufo: number;
  giroT: number;
  inmune: number;
  invisible: number;
  mojado: number;
  cayendo: number;
  truco: number;
  trucoListo: boolean;
  trucoHecho: boolean;
  fueraPista: boolean;
  enHielo: boolean;
  objeto: IdObjeto | null;
  ruleta: number;
  usos: number;
  arranque: number;
  entrada: Entrada;
  ia: IA | null;
  /** Efecto del golpe (para la vista: 0..1 del giro). */
  giroVis: number;
  /** Para el bot de pruebas: vueltas sin moverse. */
  quieto: number;
}

interface IA {
  carril: number;
  fase: number;
  habilidad: number;
  esperaObjeto: number;
  derrapando: number;
  atascado: number;
}

export type TipoCosa = 'enredadera' | 'charco' | 'semilla_vuela' | 'brasa' | 'lucero';
export interface Cosa {
  id: number;
  tipo: TipoCosa;
  x: number;
  y: number;
  z: number;
  /** Rumbo (los que se mueven). */
  h: number;
  v: number;
  vy: number;
  s: number;
  vida: number;
  dueno: number;
  objetivo: number;
  /** Cuánto ha crecido (la enredadera) o girado (para la vista). */
  t: number;
  /** La ceniza lanzada adelante cae como charco. */
  charco?: boolean;
}

export interface Caja {
  s: number;
  lat: number;
  x: number;
  y: number;
  z: number;
  vuelve: number;
}

export type Evento =
  | { t: 'caja'; k: number }
  | { t: 'objeto'; k: number; o: IdObjeto }
  | { t: 'usa'; k: number; o: IdObjeto }
  | { t: 'golpe'; k: number; por: number; como: TipoCosa | 'choque' }
  | { t: 'turbo'; k: number; nivel: number }
  | { t: 'chispas'; k: number; nivel: number }
  | { t: 'rebufo'; k: number }
  | { t: 'salto'; k: number }
  | { t: 'truco'; k: number }
  | { t: 'aterriza'; k: number; truco: boolean }
  | { t: 'vuelta'; k: number; vuelta: number; tiempo: number }
  | { t: 'meta'; k: number; puesto: number; tiempo: number }
  | { t: 'adelanta'; k: number; a: number }
  | { t: 'muro'; k: number; fuerza: number }
  | { t: 'caida'; k: number }
  | { t: 'lluvia'; k: number; mojados: number[] }
  | { t: 'choque'; k: number; con: number };

/** Generador de azar con semilla (las partidas en línea usan la misma). */
export function azar(semilla: number) {
  let s = semilla >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

export interface OpcionesSim {
  pista: Pista;
  corredores: { c: Corredor; control: Control; humano: boolean }[];
  /** Fuerza de la máquina (0.86 paseo … 1 leyenda). */
  ia: number;
  semilla: number;
  /** Contrarreloj: sin objetos ni cajas, con tres chispas al salir. */
  contrarreloj?: boolean;
  vueltas?: number;
  /** En línea, el invitado no mueve a la máquina ni las cosas (llegan del anfitrión). */
  autoridad?: boolean;
}

export class Sim {
  pista: Pista;
  karts: Kart[] = [];
  cosas: Cosa[] = [];
  cajas: Caja[] = [];
  eventos: Evento[] = [];
  /** Segundos de carrera (negativo durante la cuenta regresiva). */
  t = -4;
  vueltasTotal: number;
  terminada = false;
  orden: number[] = [];
  private rnd: () => number;
  private sigId = 1;
  private llegaron = 0;
  autoridad: boolean;

  constructor(public o: OpcionesSim) {
    this.pista = o.pista;
    this.rnd = azar(o.semilla);
    this.vueltasTotal = o.vueltas ?? VUELTAS;
    this.autoridad = o.autoridad ?? true;
    const p = this.pista;
    // Parrilla: de a dos, detrás de la línea
    o.corredores.forEach((r, i) => {
      const fila = Math.floor(i / 2);
      const s = p.n - 7 - fila * 6.5 - (i % 2) * 2.5;
      const lat = (i % 2 ? -1 : 1) * p.hw[p.idx(s)] * 0.42;
      const q = p.punto(s, lat);
      const h = p.rumbo(s);
      const k: Kart = {
        i, c: r.c, control: r.control, humano: r.humano, st: CRIATURAS[r.c.criatura].stats,
        x: q.x, y: q.y, z: q.z, h, m: h, v: 0, vy: 0, suelo: true, aire: 0, lugar: { s, lat, y: q.y, i: p.idx(s) },
        vuelta: 0, control50: true, prog: s, puesto: i, terminado: false, tiempo: 0, vueltas: [], inicioVuelta: 0,
        derrape: 0, carga: 0, turbo: 0, turboNivel: 0, rebufo: 0, giroT: 0, inmune: 0, invisible: 0, mojado: 0, cayendo: 0,
        truco: 0, trucoListo: false, trucoHecho: false, fueraPista: false, enHielo: false, objeto: null, ruleta: 0, usos: 0, arranque: 0,
        entrada: entradaVacia(), giroVis: 0, quieto: 0,
        ia: r.control === 'ia' ? { carril: (this.rnd() - 0.5) * 0.9, fase: this.rnd() * 10, habilidad: 0.9 + this.rnd() * 0.1, esperaObjeto: 0, derrapando: 0, atascado: 0 } : null,
      };
      if (o.contrarreloj) {
        k.objeto = 'tres';
        k.usos = 3;
      }
      this.karts.push(k);
    });
    if (!o.contrarreloj) {
      for (const s of p.d.cajas) {
        const hw = p.hw[p.idx(s)];
        for (const f of [-0.62, -0.21, 0.21, 0.62]) {
          const q = p.punto(s, f * hw);
          this.cajas.push({ s, lat: f * hw, x: q.x, y: q.y + 1.15, z: q.z, vuelve: 0 });
        }
      }
    }
    this.ordenar();
  }

  get enCuenta() {
    return this.t < 0;
  }

  paso() {
    const dt = PASO;
    this.t += dt;
    for (const k of this.karts) {
      if (k.control === 'remoto') continue;
      if (k.control === 'ia' && this.autoridad) this.pilotar(k);
      if (this.t < 0) {
        // Turbo de salida: acelerar justo en el «¡dos!» (entre 1,2 y 0,4 s antes)
        if (k.entrada.acel > 0) {
          if (this.t > -1.2 && this.t < -0.4 && k.arranque === 0) k.arranque = 1;
          else if (this.t < -1.2) k.arranque = -1;
        }
        continue;
      }
      if (k.arranque === 1) {
        k.turbo = 1.1;
        k.turboNivel = 2;
        this.eventos.push({ t: 'turbo', k: k.i, nivel: 2 });
      }
      k.arranque = 2;
      if (k.control === 'ia' && !this.autoridad) continue;
      this.mover(k, dt);
    }
    if (this.t >= 0 && this.autoridad) {
      this.chocar();
      this.cajasYCosas(dt);
    }
    if (this.t >= 0) this.rebufos(dt);
    this.ordenar();
  }

  // ------------------------------------------------------------------------------------------ física de un carro

  private mover(k: Kart, dt: number) {
    const p = this.pista;
    const e = k.entrada;
    if (k.terminado && k.control !== 'ia') {
      // Después de la meta maneja la máquina, despacito
      this.pilotar(k);
    }
    // Cayendo (lava o fuera de la cinta): un grifo lo devuelve a la pista
    if (k.cayendo > 0) {
      k.cayendo -= dt;
      k.vy -= GRAVEDAD * dt;
      k.y += k.vy * dt;
      k.v *= 1 - dt;
      if (k.cayendo <= 0) this.devolver(k);
      return;
    }
    for (const c of ['turbo', 'giroT', 'inmune', 'invisible', 'mojado', 'truco'] as const) if (k[c] > 0) k[c] = Math.max(0, k[c] - dt);
    if (k.ruleta > 0) {
      k.ruleta -= dt;
      if (k.ruleta <= 0 && k.objeto) this.eventos.push({ t: 'objeto', k: k.i, o: k.objeto });
    }
    const L = k.lugar;
    const i = p.idx(L.s);
    const hw = p.hw[i], hombro = p.hombro[i], fl = p.flags[i];
    const absLat = Math.abs(L.lat);
    k.fueraPista = absLat > hw + 1.0;
    k.enHielo = (fl & HIELO) !== 0 && absLat < hw + 1;
    const st = k.st;
    const iaF = k.control === 'ia' ? this.fuerzaIA(k) : 1;
    let vmax = VMAX * st.vmax * iaF;
    if (k.fueraPista && k.invisible <= 0 && k.turbo <= 0 && k.suelo) vmax *= 0.5;
    if (k.mojado > 0) vmax *= 0.72;
    if (k.turbo > 0) vmax *= k.turboNivel >= 3 ? 1.42 : 1.32;
    if (k.giroT > 0) vmax *= 0.3;
    // Acelerar, frenar, reversa
    const acel = k.giroT > 0 ? 0 : e.acel;
    if (k.turbo > 0 && k.v < vmax) k.v += 46 * dt;
    else if (acel > 0) {
      if (k.v < vmax) k.v += st.acel * 19 * Math.max(0.15, 1 - k.v / vmax) * dt;
    } else if (acel < 0) {
      k.v -= (k.v > 0 ? 34 : 14) * dt;
      if (k.v < -8) k.v = -8;
    } else k.v -= Math.sign(k.v) * Math.min(Math.abs(k.v), 7 * dt);
    if (k.v > vmax) k.v -= Math.min(k.v - vmax, (k.v - vmax) * 2.2 * dt + 4 * dt);
    // Girar (y derrapar)
    const giro = k.giroT > 0 ? 0 : Math.max(-1, Math.min(1, e.giro));
    const rapidez = Math.min(1, Math.abs(k.v) / 9);
    if (e.derrape && k.derrape === 0 && k.suelo && k.v > 11 && Math.abs(giro) > 0.25 && k.giroT <= 0) {
      k.derrape = giro > 0 ? 1 : -1;
      k.carga = 0;
      k.vy = 3.6;
      k.suelo = false;
    }
    let tasa: number;
    if (k.derrape !== 0) {
      tasa = k.derrape * (0.95 + 0.7 * giro * k.derrape) * 1.22 * st.giro;
      if (k.suelo) {
        const antes = k.carga;
        k.carga += dt * (1 + 0.5 * Math.max(0, giro * k.derrape));
        for (const [u, n] of [[0.8, 1], [1.6, 2], [2.6, 3]] as const) if (antes < u && k.carga >= u) this.eventos.push({ t: 'chispas', k: k.i, nivel: n });
      }
      if (!e.derrape || k.v < 7 || k.giroT > 0) {
        const nivel = k.carga >= 2.6 ? 3 : k.carga >= 1.6 ? 2 : k.carga >= 0.8 ? 1 : 0;
        if (nivel && k.giroT <= 0) {
          k.turbo = Math.max(k.turbo, [0, 0.55, 1.0, 1.5][nivel]);
          k.turboNivel = nivel;
          this.eventos.push({ t: 'turbo', k: k.i, nivel });
        }
        k.derrape = 0;
        k.carga = 0;
      }
    } else tasa = giro * 2.05 * st.giro * (1 - 0.25 * Math.min(1, k.v / VMAX));
    k.h += tasa * rapidez * dt * (k.v < 0 ? -1 : 1) * (k.suelo || k.derrape ? 1 : 0.4);
    // Agarre: el rumbo de la velocidad persigue al del carro
    let agarre = k.derrape ? 3.2 : 10;
    if (k.enHielo) agarre = k.derrape ? 1.4 : 2.2;
    if (k.mojado > 0) agarre *= 0.6;
    if (k.giroT > 0) agarre = 0.8;
    if (!k.suelo) agarre *= 0.15;
    k.m += angulo(k.h - k.m) * Math.min(1, agarre * dt);
    // Mover
    k.x += Math.sin(k.m) * k.v * dt;
    k.z += Math.cos(k.m) * k.v * dt;
    p.lugar(k.x, k.z, L.s, L);
    // Piso: camino + rampas
    let piso = L.y;
    const ii = p.idx(L.s);
    let enRampa = false;
    for (const [ri, rlat, rmed] of p.d.rampas) {
      const ds = p.delta(ri, L.s);
      if (ds > -1.6 && ds < 1.6 && Math.abs(L.lat - rlat) < rmed) {
        piso += 1.15 * Math.pow((ds + 1.6) / 3.2, 1.6);
        enRampa = true;
      } else if (ds >= 1.6 && ds < 3.5 && Math.abs(L.lat - rlat) < rmed && k.suelo && k.v > 8) {
        // Despega al final de la rampa
        k.suelo = false;
        k.vy = 5 + k.v * 0.22;
        k.trucoListo = true;
        this.eventos.push({ t: 'salto', k: k.i });
      }
    }
    // Turbos del piso y anillos del cielo
    for (const [ti, tlat] of p.d.turbos) {
      const ds = p.delta(ti, L.s);
      if (Math.abs(ds) < 2.2 && Math.abs(L.lat - tlat) < 1.8 && k.suelo && k.turbo < 0.7) {
        k.turbo = 0.9;
        k.turboNivel = 2;
        this.eventos.push({ t: 'turbo', k: k.i, nivel: 2 });
      }
    }
    for (const ai of p.d.anillos ?? []) {
      const ds = p.delta(ai, L.s);
      if (Math.abs(ds) < 1.2 && Math.abs(L.lat) < 6 && k.turbo < 0.9) {
        k.turbo = 1.1;
        k.turboNivel = 3;
        this.eventos.push({ t: 'turbo', k: k.i, nivel: 3 });
      }
    }
    // Vertical
    if (k.suelo) {
      if (enRampa || k.y - piso < 0.6) k.y = piso;
      else k.suelo = false;
    }
    if (!k.suelo) {
      k.aire += dt;
      k.vy -= GRAVEDAD * dt;
      k.y += k.vy * dt;
      if (k.y <= piso) {
        k.y = piso;
        if (k.aire > 0.35) this.eventos.push({ t: 'aterriza', k: k.i, truco: k.trucoHecho });
        if (k.trucoHecho) {
          k.turbo = Math.max(k.turbo, 0.8);
          k.turboNivel = 2;
          this.eventos.push({ t: 'turbo', k: k.i, nivel: 2 });
        }
        k.trucoHecho = false;
        k.trucoListo = false;
        k.suelo = true;
        k.vy = 0;
        k.aire = 0;
      }
    }
    // Truco: tocar «derrape» en el aire después de una rampa o un salto de pluma
    if (!k.suelo && k.trucoListo && e.derrape && k.aire > 0.08) {
      k.trucoListo = false;
      k.truco = 0.6;
      k.trucoHecho = true;
      this.eventos.push({ t: 'truco', k: k.i });
    }
    // Orillas: baranda (rebota) o caída (lava, cinta del cielo)
    const fl2 = p.flags[ii];
    const borde = p.hw[ii] + p.hombro[ii];
    const lat = L.lat;
    if (fl2 & (CAIDA | LAVA)) {
      if (Math.abs(lat) > borde + 0.4 && k.cayendo <= 0) {
        k.cayendo = 1.5;
        k.suelo = false;
        k.vy = 2;
        k.derrape = 0;
        this.eventos.push({ t: 'caida', k: k.i });
      }
    } else if (Math.abs(lat) > borde - 1.0) {
      const sgn = Math.sign(lat);
      const sobra = Math.abs(lat) - (borde - 1.0);
      k.x -= p.nx[ii] * sgn * sobra;
      k.z -= p.nz[ii] * sgn * sobra;
      // Cuánto iba contra la baranda
      const contra = (Math.sin(k.m) * p.nx[ii] + Math.cos(k.m) * p.nz[ii]) * sgn;
      if (contra > 0.05) {
        const tan = Math.atan2(p.tx[ii], p.tz[ii]);
        const haciaAdelante = Math.cos(angulo(k.m - tan)) >= 0 ? tan : tan + Math.PI;
        k.m = haciaAdelante - sgn * 0.12 * Math.sign(Math.cos(angulo(k.m - tan)) || 1);
        k.v *= 1 - Math.min(0.5, contra * 0.7);
        k.h += angulo(haciaAdelante - k.h) * 0.35;
        if (contra > 0.25) this.eventos.push({ t: 'muro', k: k.i, fuerza: contra });
      }
      p.lugar(k.x, k.z, L.s, L);
    }
    this.contarVuelta(k);
    // Usar objeto
    if (e.objeto && k.objeto && k.ruleta <= 0 && k.giroT <= 0 && this.t > 0) this.usar(k, e.atras, e.adelante);
    e.objeto = false;
    // Atascado (el bot de pruebas y la máquina): si no avanza, se le devuelve
    k.quieto = Math.abs(k.v) < 2 && !k.terminado ? k.quieto + dt : 0;
    if (k.control === 'ia' && k.quieto > 4) this.devolver(k);
  }

  private devolver(k: Kart) {
    const p = this.pista;
    let s = k.lugar.s - 6;
    for (let n = 0; n < 40 && p.flags[p.idx(s)] & (CAIDA | LAVA) && Math.abs(p.curva[p.idx(s)]) > 0.02; n++) s -= 2;
    const q = p.punto(s, 0);
    k.x = q.x;
    k.z = q.z;
    k.y = q.y + 3;
    k.vy = 0;
    k.h = k.m = p.rumbo(s);
    k.v = 6;
    k.suelo = false;
    k.cayendo = 0;
    k.inmune = 2;
    k.quieto = 0;
    p.lugar(k.x, k.z, s, k.lugar);
  }

  private contarVuelta(k: Kart) {
    const p = this.pista, n = p.n, s = k.lugar.s;
    const antes = k.prog - k.vuelta * n;
    if (s > n * 0.4 && s < n * 0.6) k.control50 = true;
    if (antes > n * 0.75 && s < n * 0.25) {
      if (k.control50) {
        k.vuelta++;
        k.control50 = false;
        if (k.vuelta >= 2) {
          const tv = this.t - k.inicioVuelta;
          k.vueltas.push(tv);
          this.eventos.push({ t: 'vuelta', k: k.i, vuelta: k.vuelta, tiempo: tv });
        } else this.eventos.push({ t: 'vuelta', k: k.i, vuelta: 1, tiempo: 0 });
        k.inicioVuelta = this.t;
        if (k.vuelta > this.vueltasTotal && !k.terminado) this.llegar(k, this.t);
      }
    } else if (antes < n * 0.25 && s > n * 0.75) {
      k.vuelta--;
      k.control50 = true;
    }
    k.prog = k.vuelta * n + s;
  }

  /** Llega a la meta (también lo usa la red para los carros de los demás). */
  llegar(k: Kart, tiempo: number) {
    if (k.terminado) return;
    k.terminado = true;
    k.tiempo = tiempo;
    this.llegaron++;
    k.puesto = this.llegaron - 1;
    this.eventos.push({ t: 'meta', k: k.i, puesto: this.llegaron, tiempo });
    if (this.karts.filter((x) => x.humano).every((x) => x.terminado)) this.terminarResto();
  }

  /** Cuando todas las personas llegaron, los demás «llegan» con su tiempo estimado. */
  terminarResto() {
    const p = this.pista;
    const resto = this.karts.filter((k) => !k.terminado).sort((a, b) => b.prog - a.prog);
    for (const k of resto) {
      const falta = (this.vueltasTotal + 1) * p.n - k.prog;
      this.llegar(k, this.t + falta / Math.max(14, VMAX * 0.85));
    }
    this.terminada = true;
  }

  // ------------------------------------------------------------------------------------------ puestos y rebufo

  ordenar() {
    const ks = [...this.karts].sort((a, b) => {
      if (a.terminado && b.terminado) return a.tiempo - b.tiempo;
      if (a.terminado !== b.terminado) return a.terminado ? -1 : 1;
      return b.prog - a.prog;
    });
    const antes = this.orden;
    this.orden = ks.map((k) => k.i);
    ks.forEach((k, idx) => {
      if (!k.terminado) {
        if (antes.length && idx < k.puesto && this.t > 2) {
          const pasado = antes[idx];
          if (pasado !== undefined && pasado !== k.i) this.eventos.push({ t: 'adelanta', k: k.i, a: pasado });
        }
        k.puesto = idx;
      }
    });
  }

  private rebufos(dt: number) {
    for (const a of this.karts) {
      if (a.control === 'remoto' || a.cayendo > 0) continue;
      let detras = false;
      if (a.v > 14 && a.suelo) {
        const fx = Math.sin(a.h), fz = Math.cos(a.h);
        for (const b of this.karts) {
          if (b === a || b.invisible > 0) continue;
          const dx = b.x - a.x, dz = b.z - a.z;
          const d = Math.hypot(dx, dz);
          if (d < 4 || d > 22) continue;
          if ((dx * fx + dz * fz) / d > 0.975) {
            detras = true;
            break;
          }
        }
      }
      if (detras) {
        a.rebufo += dt;
        if (a.rebufo > 1.1) {
          a.rebufo = 0;
          a.turbo = Math.max(a.turbo, 0.9);
          a.turboNivel = 1;
          this.eventos.push({ t: 'rebufo', k: a.i });
        }
      } else a.rebufo = Math.max(0, a.rebufo - dt * 2);
    }
  }

  private chocar() {
    const ks = this.karts;
    for (let i = 0; i < ks.length; i++)
      for (let j = i + 1; j < ks.length; j++) {
        const a = ks[i], b = ks[j];
        if (a.invisible > 0 || b.invisible > 0 || a.cayendo > 0 || b.cayendo > 0) continue;
        if (Math.abs(a.y - b.y) > 1.6) continue;
        const dx = b.x - a.x, dz = b.z - a.z;
        const d = Math.hypot(dx, dz);
        const R = 2.6;
        if (d >= R || d < 1e-4) continue;
        const nx = dx / d, nz = dz / d;
        const sobra = R - d;
        const pa = a.st.peso, pb = b.st.peso;
        const wa = pb / (pa + pb), wb = pa / (pa + pb);
        // Los remotos no se mueven aquí (se mueven en su aparato), pero sí empujan
        if (a.control !== 'remoto') {
          a.x -= nx * sobra * wa;
          a.z -= nz * sobra * wa;
          a.m += angulo(Math.atan2(-nx, -nz) - a.m) * 0.08 * wa;
        }
        if (b.control !== 'remoto') {
          b.x += nx * sobra * wb;
          b.z += nz * sobra * wb;
          b.m += angulo(Math.atan2(nx, nz) - b.m) * 0.08 * wb;
        }
        if (sobra > 0.5) this.eventos.push({ t: 'choque', k: a.i, con: b.i });
      }
  }

  // ------------------------------------------------------------------------------------------ cajas y objetos

  private cajasYCosas(dt: number) {
    const p = this.pista;
    for (const c of this.cajas) {
      if (c.vuelve > 0) {
        c.vuelve -= dt;
        continue;
      }
      for (const k of this.karts) {
        if (k.cayendo > 0) continue;
        const d2 = (k.x - c.x) ** 2 + (k.z - c.z) ** 2;
        if (d2 < 2.6 * 2.6 && Math.abs(k.y + 0.8 - c.y) < 2.2) {
          c.vuelve = 2.5;
          this.eventos.push({ t: 'caja', k: k.i });
          if (!k.objeto) this.darObjeto(k);
          break;
        }
      }
    }
    for (const c of this.cosas) {
      c.vida -= dt;
      c.t += dt;
      if (c.tipo === 'semilla_vuela') {
        c.x += Math.sin(c.h) * c.v * dt;
        c.z += Math.cos(c.h) * c.v * dt;
        c.vy -= GRAVEDAD * 0.7 * dt;
        c.y += c.vy * dt;
        const L = p.lugar(c.x, c.z, c.s);
        c.s = L.s;
        if (c.y <= L.y) {
          c.tipo = c.charco ? 'charco' : 'enredadera';
          c.y = L.y;
          c.t = 0;
          c.vida = 25;
          // Dentro de la pista
          const lim = p.hw[L.i] + p.hombro[L.i] - 1.5;
          if (Math.abs(L.lat) > lim) {
            const q = p.punto(L.s, Math.sign(L.lat) * lim);
            c.x = q.x;
            c.z = q.z;
          }
        }
        continue;
      }
      if (c.tipo === 'brasa' || c.tipo === 'lucero') this.moverProyectil(c, dt);
      // ¿Le pegó a alguien?
      const radio = c.tipo === 'enredadera' ? 2.2 : c.tipo === 'charco' ? 2.4 : 2.0;
      for (const k of this.karts) {
        if (k.invisible > 0 || k.inmune > 0 || k.cayendo > 0) continue;
        if (c.dueno === k.i && c.t < 0.6) continue;
        if (!k.suelo && k.y - this.pisoDe(k) > 1.2 && (c.tipo === 'enredadera' || c.tipo === 'charco')) continue;
        const d2 = (k.x - c.x) ** 2 + (k.z - c.z) ** 2;
        if (d2 < radio * radio && Math.abs(k.y - c.y) < 2.5) {
          this.golpear(k, c.dueno, c.tipo);
          c.vida = 0;
          break;
        }
      }
    }
    this.cosas = this.cosas.filter((c) => c.vida > 0);
  }

  private pisoDe(k: Kart) {
    return k.lugar.y;
  }

  private moverProyectil(c: Cosa, dt: number) {
    const p = this.pista;
    const L = p.lugar(c.x, c.z, c.s);
    c.s = L.s;
    if (c.tipo === 'lucero') {
      const obj = this.karts[c.objetivo];
      if (obj && !obj.terminado) {
        const dx = obj.x - c.x, dz = obj.z - c.z;
        const d = Math.hypot(dx, dz);
        let meta: number;
        if (d < 14) meta = Math.atan2(dx, dz);
        else {
          // Sigue la pista hacia adelante, acercándose al carril del objetivo
          const q = p.punto(L.s + 10, obj.lugar.lat * 0.8);
          meta = Math.atan2(q.x - c.x, q.z - c.z);
        }
        c.h += angulo(meta - c.h) * Math.min(1, dt * 7);
      } else {
        const q = p.punto(L.s + 10, 0);
        c.h += angulo(Math.atan2(q.x - c.x, q.z - c.z) - c.h) * Math.min(1, dt * 5);
      }
    }
    c.x += Math.sin(c.h) * c.v * dt;
    c.z += Math.cos(c.h) * c.v * dt;
    c.y += (L.y + 0.7 - c.y) * Math.min(1, dt * 8);
    const borde = p.hw[L.i] + p.hombro[L.i] - 0.6;
    if (Math.abs(L.lat) > borde) {
      if (p.flags[L.i] & (CAIDA | LAVA) && c.tipo === 'brasa') {
        c.vida = 0;
        return;
      }
      // Rebota: refleja el rumbo contra la normal de la orilla
      const nx = p.nx[L.i] * Math.sign(L.lat), nz = p.nz[L.i] * Math.sign(L.lat);
      let vx = Math.sin(c.h), vz = Math.cos(c.h);
      const dot = vx * nx + vz * nz;
      if (dot > 0) {
        vx -= 2 * dot * nx;
        vz -= 2 * dot * nz;
        c.h = Math.atan2(vx, vz);
      }
      c.x -= nx * (Math.abs(L.lat) - borde);
      c.z -= nz * (Math.abs(L.lat) - borde);
    }
  }

  golpear(k: Kart, por: number, como: TipoCosa | 'choque') {
    if (k.inmune > 0 || k.invisible > 0) return;
    k.giroT = como === 'lucero' ? 1.35 : como === 'charco' ? 1.0 : 1.15;
    k.inmune = k.giroT + 0.8;
    k.v *= como === 'charco' ? 0.55 : 0.35;
    k.derrape = 0;
    k.carga = 0;
    k.turbo = 0;
    if (como === 'lucero' || como === 'brasa') {
      k.vy = 4;
      k.suelo = false;
    }
    this.eventos.push({ t: 'golpe', k: k.i, por, como });
  }

  darObjeto(k: Kart, o?: IdObjeto) {
    if (!o) {
      const n = this.karts.length;
      const frac = n > 1 ? k.puesto / (n - 1) : 0.5;
      const pesos = pesosObjeto(frac);
      let total = 0;
      for (const v of Object.values(pesos)) total += v!;
      let r = this.rnd() * total;
      o = 'chispa';
      for (const [id, v] of Object.entries(pesos) as [IdObjeto, number][]) {
        r -= v;
        if (r <= 0) {
          o = id;
          break;
        }
      }
    }
    k.objeto = o;
    k.usos = o === 'tres' ? 3 : 1;
    k.ruleta = 1.15;
  }

  /** Usa el objeto que tiene (el anfitrión lo hace también con los de los invitados). */
  usar(k: Kart, atras = false, adelante = false) {
    const o = k.objeto;
    if (!o) return;
    k.usos--;
    if (k.usos <= 0) k.objeto = null;
    this.eventos.push({ t: 'usa', k: k.i, o });
    if (!this.autoridad && o !== 'chispa' && o !== 'tres' && o !== 'velo' && o !== 'pluma') return;
    const p = this.pista;
    const fx = Math.sin(k.h), fz = Math.cos(k.h);
    const nueva = (tipo: TipoCosa, x: number, z: number, h: number, v: number, vida: number, extra: Partial<Cosa> = {}): Cosa => {
      const c: Cosa = { id: this.sigId++, tipo, x, y: k.y + 0.6, z, h, v, vy: 0, s: k.lugar.s, vida, dueno: k.i, objetivo: -1, t: 0, ...extra };
      this.cosas.push(c);
      if (this.cosas.length > 40) this.cosas.shift();
      return c;
    };
    switch (o) {
      case 'chispa':
      case 'tres':
        k.turbo = Math.max(k.turbo, 1.3);
        k.turboNivel = 3;
        this.eventos.push({ t: 'turbo', k: k.i, nivel: 3 });
        break;
      case 'velo':
        k.invisible = 5;
        break;
      case 'pluma':
        k.vy = 13;
        k.suelo = false;
        k.trucoListo = true;
        k.turbo = Math.max(k.turbo, 0.6);
        k.turboNivel = 2;
        this.eventos.push({ t: 'salto', k: k.i });
        break;
      case 'semilla':
        if (adelante) nueva('semilla_vuela', k.x + fx * 3, k.z + fz * 3, k.h, Math.max(20, k.v + 10), 6, { vy: 9 });
        else nueva('enredadera', k.x - fx * 4.2, k.z - fz * 4.2, k.h, 0, 25, { y: k.lugar.y });
        break;
      case 'ceniza':
        if (adelante) nueva('semilla_vuela', k.x + fx * 3, k.z + fz * 3, k.h, Math.max(20, k.v + 10), 6, { vy: 9, charco: true });
        else nueva('charco', k.x - fx * 4.2, k.z - fz * 4.2, k.h, 0, 22, { y: k.lugar.y });
        break;
      case 'brasa':
        if (atras) nueva('brasa', k.x - fx * 3.5, k.z - fz * 3.5, k.h + Math.PI, 40, 5);
        else nueva('brasa', k.x + fx * 3.5, k.z + fz * 3.5, k.h, Math.max(44, k.v + 18), 5);
        break;
      case 'lucero': {
        const delante = this.orden[k.puesto - 1];
        nueva('lucero', k.x + fx * 3.5, k.z + fz * 3.5, k.h, Math.max(42, k.v + 16), 8, { objetivo: delante ?? -1 });
        break;
      }
      case 'lluvia': {
        const mojados: number[] = [];
        for (const otro of this.karts) {
          if (otro.puesto < k.puesto && otro.invisible <= 0 && !otro.terminado) {
            otro.mojado = 3.6;
            mojados.push(otro.i);
          }
        }
        this.eventos.push({ t: 'lluvia', k: k.i, mojados });
        break;
      }
    }
  }

  // ------------------------------------------------------------------------------------------ la máquina

  /** Empuje de la máquina: rápida si va detrás de las personas, más calmada si va muy adelante. */
  private fuerzaIA(k: Kart) {
    let mejor = -Infinity;
    for (const x of this.karts) if (x.humano && !x.terminado) mejor = Math.max(mejor, x.prog);
    const base = this.o.ia * (k.ia?.habilidad ?? 1);
    if (mejor === -Infinity) return base;
    const d = k.prog - mejor;
    const f = d > 0 ? 1 - Math.min(0.09, d / 2500) : 1 + Math.min(0.07, -d / 1800);
    return base * f;
  }

  private pilotar(k: Kart) {
    const p = this.pista;
    const ia = k.ia ?? (k.ia = { carril: 0, fase: 0, habilidad: 0.95, esperaObjeto: 0, derrapando: 0, atascado: 0 });
    const e = k.entrada;
    const L = k.lugar;
    const adelante = 7 + Math.max(0, k.v) * 0.42;
    const s2 = L.s + adelante;
    const i2 = p.idx(s2);
    // Carril: el suyo, con un vaivén lento; esquiva lo que hay en el piso y busca cajas si no tiene objeto
    let carril = (ia.carril + Math.sin(this.t * 0.3 + ia.fase) * 0.25) * p.hw[i2];
    const curvaAdelante = p.curva[p.idx(L.s + adelante * 0.6)];
    carril -= Math.sign(curvaAdelante) * Math.min(1, Math.abs(curvaAdelante) * 20) * p.hw[i2] * 0.35;
    if (!k.objeto) {
      for (const c of this.cajas) {
        const ds = p.delta(L.s, c.s);
        if (ds > 4 && ds < 40 && c.vuelve <= 0) {
          carril = c.lat * 0.9;
          break;
        }
      }
    }
    for (const c of this.cosas) {
      if (c.tipo !== 'enredadera' && c.tipo !== 'charco') continue;
      const ds = p.delta(L.s, c.s);
      if (ds > 0 && ds < 30) {
        const cl = p.lugar(c.x, c.z, c.s).lat;
        if (Math.abs(cl - carril) < 3) carril = cl + (cl > 0 ? -4 : 4);
      }
    }
    const q = p.punto(s2, carril);
    const meta = Math.atan2(q.x - k.x, q.z - k.z);
    const dif = angulo(meta - k.h);
    e.giro = Math.max(-1, Math.min(1, dif * 2.6));
    e.acel = k.terminado ? (k.v > 12 ? 0 : 1) : 1;
    // Derrapa en las curvas largas
    const curvaFuerte = Math.abs(p.curva[p.idx(L.s + 12)]) > 0.022;
    if (ia.derrapando > 0) {
      ia.derrapando -= PASO;
      e.derrape = ia.derrapando > 0 && Math.abs(dif) < 0.9;
    } else if (curvaFuerte && k.v > 18 && Math.abs(dif) > 0.12 && k.ia!.habilidad > 0.92 && !k.terminado) {
      ia.derrapando = 0.9 + (k.ia!.habilidad - 0.9) * 18;
      e.derrape = true;
    } else e.derrape = false;
    // Objetos
    e.objeto = false;
    e.atras = false;
    e.adelante = false;
    if (k.objeto && k.ruleta <= 0 && this.t > 1) {
      ia.esperaObjeto += PASO;
      const o = k.objeto;
      const otro = (desplaz: number) => this.karts[this.orden[k.puesto + desplaz]];
      const delante = otro(-1), detras = otro(1);
      const dDel = delante ? p.delta(L.s, delante.lugar.s) : 999;
      const dDet = detras ? p.delta(detras.lugar.s, L.s) : 999;
      const recta = Math.abs(p.curva[p.idx(L.s + 20)]) < 0.012;
      let usar = false;
      if (o === 'chispa' || o === 'tres' || o === 'pluma') usar = recta && ia.esperaObjeto > 0.8;
      else if (o === 'lucero') usar = dDel < 90 || ia.esperaObjeto > 6;
      else if (o === 'brasa') usar = (dDel > 6 && dDel < 45) || (dDet > 3 && dDet < 18) || ia.esperaObjeto > 7;
      else if (o === 'semilla' || o === 'ceniza') usar = (dDet > 3 && dDet < 25) || ia.esperaObjeto > 6;
      else if (o === 'velo') usar = ia.esperaObjeto > 2.5;
      else if (o === 'lluvia') usar = ia.esperaObjeto > 1;
      if (usar) {
        e.objeto = true;
        if (o === 'brasa') e.atras = !(dDel > 6 && dDel < 45) && dDet < 18;
        ia.esperaObjeto = o === 'tres' ? 0.2 : 0;
      }
    }
  }
}
