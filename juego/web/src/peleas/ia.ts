// La máquina: pelea como una persona con reflejos (ve lo que hace el otro con unos cuadros de retraso), tapa, castiga
// lo que queda descubierto, sigue los combos, corta los saltos con el gancho, se escapa de los agarres y usa su
// especial y su súper según su estilo. El nivel (1 a 7) sube los reflejos y las ganas de tapar y castigar.
import { BARRA_MAX, type Peleador, type Sim } from './sim';
import { NADA, type Entrada, type IdGolpe } from './tipos';

interface Visto {
  estado: string;
  t: number;
  golpe: IdGolpe | null;
  nivelGolpe: string | null;
  arranque: number;
  activo: number;
  dur: number;
  x: number;
  y: number;
  vy: number;
}

type Plan =
  | { k: 'tapar'; bajo: boolean; hasta: number }
  | { k: 'caminar'; dir: number; hasta: number }
  | { k: 'agachar'; hasta: number }
  | { k: 'saltar'; dir: number; atacar: 'a' | 'b'; hasta: number }
  | { k: 'quieto'; hasta: number };

/** Distancia que le gusta a cada estilo. */
function distanciaPreferida(id: string, especial: string | undefined): number {
  if (especial === 'proyectil') return 4.2;
  if (especial === 'trampa') return 3.6;
  if (especial === 'cuerda') return 3.0;
  if (especial === 'embestida') return 2.2;
  if (id === 'tarek') return 1.2;
  return 1.6;
}

export class Bot {
  private vistos: Visto[] = [];
  private plan: Plan | null = null;
  private apretar: 'a' | 'b' | 'e' | 'g' | 's' | null = null;
  private abajo = false;
  private arriba = false;
  private t = 0;
  private soltar = false;
  private tapadas = 0;
  private reaccion: number;
  private pTapar: number;
  private pCastigo: number;
  private pCombo: number;
  private pAntiAereo: number;
  private pEscape: number;
  private ganas: number;
  private azarS: number;

  constructor(public yo: number, public nivel: number, semilla = 99) {
    const k = Math.max(0, Math.min(1, (nivel - 1) / 6));
    this.reaccion = Math.round(26 - k * 18);
    this.pTapar = 0.12 + k * 0.72;
    this.pCastigo = 0.1 + k * 0.8;
    this.pCombo = 0.25 + k * 0.72;
    this.pAntiAereo = 0.08 + k * 0.72;
    this.pEscape = 0.05 + k * 0.55;
    this.ganas = 0.025 + k * 0.05;
    this.azarS = semilla >>> 0;
  }

  private azar() {
    this.azarS = (this.azarS * 1664525 + 1013904223) >>> 0;
    return this.azarS / 4294967296;
  }

  /** Lo que aprieta en este paso. */
  decidir(sim: Sim): Entrada {
    this.t++;
    const yo = sim.L[this.yo];
    const o = sim.L[1 - this.yo];
    this.vistos.push(ver(o));
    if (this.vistos.length > 40) this.vistos.shift();
    const visto = this.vistos[Math.max(0, this.vistos.length - 1 - this.reaccion)];
    if (sim.fase !== 'pelea') return NADA;
    // Un botón es un toque: se aprieta un cuadro y se suelta el siguiente
    if (this.soltar) {
      this.soltar = false;
      return this.armar(yo, null);
    }
    const boton = this.elegir(sim, yo, o, visto);
    if (boton) this.soltar = true;
    return this.armar(yo, boton);
  }

  private armar(yo: Peleador, boton: 'a' | 'b' | 'e' | 'g' | 's' | null): Entrada {
    let h = 0, v = 0;
    const p = this.plan;
    if (p && this.t <= p.hasta) {
      if (p.k === 'tapar') {
        h = -yo.lado;
        v = p.bajo ? -1 : 0;
      } else if (p.k === 'caminar') h = p.dir;
      else if (p.k === 'agachar') v = -1;
      else if (p.k === 'saltar') {
        h = p.dir;
        v = this.t <= p.hasta - 30 ? 1 : 0;
      }
    } else this.plan = null;
    if (this.abajo) v = -1;
    if (this.arriba) v = 1;
    this.abajo = this.arriba = false;
    return { h, v, a: boton === 'a', b: boton === 'b', e: boton === 'e', g: boton === 'g', s: boton === 's' };
  }

  private elegir(sim: Sim, yo: Peleador, o: Peleador, v: Visto): 'a' | 'b' | 'e' | 'g' | 's' | null {
    const dx = o.x - yo.x;
    const dist = Math.abs(dx);
    const hacia = Math.sign(dx) || yo.lado;
    const r = () => this.azar();
    const lleno = yo.barra >= BARRA_MAX;
    const g = yo.golpe;

    // Agarrado: zafarse (con reflejos)
    if (yo.estado === 'agarrado') {
      if (yo.t > Math.floor(this.reaccion / 3) && yo.t < 9 && r() < this.pEscape * 0.25) return 'g';
      return null;
    }
    // Siguiendo un combo
    if (yo.estado === 'ataque' && g) {
      const fin = g.arranque + g.activo;
      if (yo.pego && yo.t >= fin - 1 && yo.t <= fin + 3) {
        if (r() > this.pCombo) return null;
        const golpeado = o.estado === 'golpeado' || o.estado === 'volando' || o.estado === 'agarrado';
        if (!golpeado) return null; // si lo taparon, no se regala
        if (lleno && g.cancela?.includes('super') && r() < 0.7) return 's';
        if (g.id === 'rapido1') return r() < 0.75 ? 'a' : 'b';
        if (g.id === 'rapido2') return r() < 0.6 ? 'a' : 'e';
        if (g.id === 'rapidoAbajo') return r() < 0.5 ? 'a' : 'b';
        if ((g.id === 'fuerte' || g.id === 'rapido3') && g.cancela?.includes('especial') && r() < 0.6) return 'e';
        if (g.id === 'fuerteArriba' && r() < 0.5) {
          this.arriba = true;
          return null;
        }
      }
      return null;
    }
    if (yo.estado === 'aire') {
      // Saltando encima: pegar al bajar
      if (yo.vy < 2 && dist < 1.5 && yo.y > 0.4) return r() < 0.6 ? 'b' : 'a';
      return null;
    }
    const libre = yo.estado === 'quieto' || yo.estado === 'caminar' || yo.estado === 'agachado';
    if (!libre) return null;

    // 1. Tapar lo que viene (lo que «vio» hace unos cuadros)
    const atacando = v.estado === 'ataque' && v.golpe && v.t < v.arranque + v.activo;
    const alcance = v.golpe === 'especial' || v.golpe === 'super' ? 14 : 2.4;
    if (atacando && dist < alcance && this.plan?.k !== 'tapar') {
      if (r() < this.pTapar) {
        this.plan = { k: 'tapar', bajo: v.nivelGolpe === 'bajo' ? r() < 0.85 : false, hasta: this.t + Math.max(12, v.dur - v.t + 4) };
        this.tapadas++;
        return null;
      }
    }
    // Proyectiles que vienen
    for (const x of sim.P) {
      if (x.dueno === yo.i || x.muerto) continue;
      const hacia2 = Math.sign(yo.x - x.x) === Math.sign(x.vx);
      const lejos = Math.abs(yo.x - x.x);
      if ((x.tipo === 'bala' && hacia2 && lejos < 3.2) || (x.tipo === 'ola' && hacia2 && lejos < 3)) {
        if (r() < this.pTapar) {
          if (x.tipo === 'ola' || r() < 0.35) this.plan = { k: 'saltar', dir: hacia, atacar: 'b', hasta: this.t + 40 };
          else this.plan = { k: 'tapar', bajo: false, hasta: this.t + 20 };
          return null;
        }
      }
      if (x.tipo === 'caida' || x.tipo === 'rayo') {
        if (r() < this.pTapar * 0.4) this.plan = { k: 'tapar', bajo: false, hasta: this.t + 16 };
      }
    }
    if (this.plan?.k === 'tapar' && this.t <= this.plan.hasta) return null;

    // 2. Castigar: el otro quedó descubierto (recuperándose de un golpe que falló o que le taparon)
    const recuperando = v.estado === 'ataque' && v.golpe && v.t >= v.arranque + v.activo;
    if ((recuperando || v.estado === 'aterrizaje' || v.estado === 'mareado') && dist < 1.6) {
      if (r() < this.pCastigo) {
        if (lleno && r() < 0.6) return 's';
        if (v.estado === 'mareado') return r() < 0.5 ? 'b' : 'a';
        return r() < 0.55 ? 'a' : 'b';
      }
    }
    // 3. Cortar el salto con el gancho
    if (o.estado === 'aire' || (o.estado === 'ataque' && o.y > 0.5)) {
      if (dist < 2.1 && o.vy < 4 && r() < this.pAntiAereo * 0.3) {
        this.arriba = true;
        return 'b';
      }
    }
    // 4. Súper cuando está a tiro
    if (lleno && r() < 0.012 && (dist < 2.2 || yo.def.golpes.super.superTipo !== 'rafaga')) return 's';
    // Tumbado: esperarlo cerca
    if (o.estado === 'suelo' || o.estado === 'levantarse') {
      if (dist > 1.4) this.plan = { k: 'caminar', dir: hacia, hasta: this.t + 6 };
      return null;
    }

    // 5. El juego de cada estilo
    const esp = yo.def.golpes.especial.especial;
    const quiere = distanciaPreferida(yo.def.id, esp);
    const ganas = this.ganas * (1 + Math.min(1, this.tapadas / 6) * 0.5);
    if (esp === 'proyectil' && dist > 2.6 && !sim.P.some((x) => x.dueno === yo.i) && r() < ganas * 1.4) return 'e';
    if (esp === 'trampa' && dist > 2.2 && !sim.P.some((x) => x.dueno === yo.i && x.tipo === 'trampa') && r() < ganas * 1.6) return 'e';
    if (esp === 'cuerda' && dist > 1.6 && dist < 3.6 && r() < ganas) return 'e';
    if (esp === 'embestida' && dist > 1.8 && dist < 4.5 && r() < ganas * 0.8) return 'e';
    if (esp === 'niebla' && dist > 2.5 && r() < ganas * 0.5) return 'e';
    if (esp === 'voladora' && dist > 2 && dist < 4 && r() < ganas * 0.8) return 'e';
    if (esp === 'fuego' && dist < 2 && r() < ganas * 1.2) return 'e';
    if (esp === 'contra' && dist < 2.4 && (o.estado === 'ataque' || r() < 0.002) && r() < this.pTapar * 0.2) return 'e';

    if (dist < 1.25) {
      if (r() < ganas * 2.4) {
        const q = r();
        const tapa = Math.min(1, this.tapadas / 8);
        if (q < 0.42) return 'a';
        if (q < 0.52 + tapa * 0.2) return 'g';
        if (q < 0.72) {
          this.abajo = true;
          return 'b';
        }
        if (q < 0.85) {
          this.abajo = true;
          return 'a';
        }
        return 'b';
      }
    }
    if (dist >= 1.25 && dist < 2.4 && r() < ganas * 0.6) {
      if (r() < 0.45) {
        this.plan = { k: 'saltar', dir: hacia, atacar: 'b', hasta: this.t + 40 };
        return null;
      }
      return 'b';
    }
    // Caminar a la distancia que le gusta (a veces se queda quieto o retrocede tapando)
    if (!this.plan || this.t > this.plan.hasta) {
      const q = r();
      if (dist > quiere + 0.6) this.plan = { k: 'caminar', dir: hacia, hasta: this.t + 8 + Math.floor(r() * 18) };
      else if (dist < quiere - 0.6 && q < 0.6) this.plan = { k: 'caminar', dir: -hacia, hasta: this.t + 6 + Math.floor(r() * 14) };
      else if (q < 0.15) this.plan = { k: 'agachar', hasta: this.t + 10 };
      else this.plan = { k: 'quieto', hasta: this.t + 6 + Math.floor(r() * 16) };
    }
    return null;
  }
}

function ver(o: Peleador): Visto {
  const g = o.golpe;
  return { estado: o.estado, t: o.t, golpe: (g?.id as IdGolpe) ?? null, nivelGolpe: g?.nivel ?? null, arranque: g?.arranque ?? 0, activo: g?.activo ?? 0, dur: o.dur, x: o.x, y: o.y, vy: o.vy };
}
