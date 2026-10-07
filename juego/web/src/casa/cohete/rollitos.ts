// Los rollitos de papel higiénico dorados: cientos dibujados de una sola vez (instancias), en hileras y figuras
// (corazones, «ÉL ♥ ELLA», «TE AMO», flechas, olas, estrellas, un retrete…). Si se recoge una figura completa,
// paga un premio. Con un amigo (modo neutro) las palabras de la pareja se cambian por «WOW», «GOL» y «TOP».
import * as THREE from 'three';
import { esNeutroCohete } from './datos';
import { Auras, Borde, DORADO } from './resaltar';

/** Letras de 5 × 7 (filas de arriba a abajo). */
const LETRAS: Record<string, string[]> = {
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  É: ['...#.', '#####', '#....', '####.', '#....', '#....', '#####'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  '♥': ['.....', '.#.#.', '#####', '#####', '.###.', '..#..', '.....'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
};

const PASO = 0.62;

/** Puntos (x, y) de una figura; x crece hacia la derecha, centrada en y = 0. */
export type Figura = { nombre: string; puntos: [number, number][]; corazon?: boolean };

function texto(t: string, paso = 0.5): [number, number][] {
  const out: [number, number][] = [];
  let x = 0;
  for (const ch of t) {
    const filas = LETRAS[ch] ?? LETRAS[' '];
    filas.forEach((fila, j) => {
      for (let i = 0; i < fila.length; i++) if (fila[i] === '#') out.push([x + i * paso, (3 - j) * paso]);
    });
    x += (ch === ' ' ? 3 : 6) * paso;
  }
  return out;
}

function corazon(tam: number, relleno: boolean): [number, number][] {
  const out: [number, number][] = [];
  if (!relleno) {
    const n = Math.round(tam * 9);
    for (let k = 0; k < n; k++) {
      const t = (k / n) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      out.push([x * tam * 0.12, y * tam * 0.12]);
    }
    return out;
  }
  for (let y = -1.2; y <= 1.2; y += 0.2) {
    for (let x = -1.3; x <= 1.3; x += 0.2) {
      // Ecuación del corazón: (x² + y² − 1)³ − x² y³ ≤ 0
      const yy = y + 0.2;
      if (Math.pow(x * x + yy * yy - 1, 3) - x * x * yy * yy * yy <= 0) out.push([x * tam * 1.25, yy * tam * 1.25]);
    }
  }
  return out;
}

export const FIGURAS: (() => Figura)[] = [
  () => ({ nombre: 'hilera', puntos: Array.from({ length: 12 }, (_, i) => [i * PASO, 0] as [number, number]) }),
  () => ({ nombre: 'doble', puntos: Array.from({ length: 20 }, (_, i) => [(i % 10) * PASO, i < 10 ? 0.5 : -0.5] as [number, number]) }),
  () => ({ nombre: 'ola', puntos: Array.from({ length: 22 }, (_, i) => [i * PASO * 0.8, Math.sin(i * 0.5) * 1.6] as [number, number]) }),
  () => ({ nombre: 'subida', puntos: Array.from({ length: 14 }, (_, i) => [i * PASO, (i - 7) * 0.32] as [number, number]) }),
  () => ({ nombre: 'corazón', puntos: corazon(1.6, false), corazon: true }),
  () => ({ nombre: 'corazón lleno', puntos: corazon(1.25, true), corazon: true }),
  () => ({ nombre: 'ÉL ♥ ELLA', puntos: texto('ÉL♥ELLA', 0.42) }),
  () => ({ nombre: 'TE AMO', puntos: texto('TE AMO', 0.42) }),
  () => ({ nombre: 'TQM', puntos: texto('TQM', 0.45) }),
  () => ({
    nombre: 'flecha',
    puntos: [
      ...Array.from({ length: 9 }, (_, i) => [i * PASO, 0] as [number, number]),
      ...[1, 2, 3].flatMap((k) => [[(8 - k) * PASO, k * 0.55], [(8 - k) * PASO, -k * 0.55]] as [number, number][]),
    ],
  }),
  () => ({
    nombre: 'estrella',
    puntos: Array.from({ length: 30 }, (_, i) => {
      const k = Math.floor(i / 3), f = (i % 3) / 3;
      const a0 = (k * Math.PI * 2) / 10 - Math.PI / 2, a1 = ((k + 1) * Math.PI * 2) / 10 - Math.PI / 2;
      const r0 = k % 2 ? 0.8 : 2, r1 = k % 2 ? 2 : 0.8;
      return [Math.cos(a0) * r0 * (1 - f) + Math.cos(a1) * r1 * f, -(Math.sin(a0) * r0 * (1 - f) + Math.sin(a1) * r1 * f)] as [number, number];
    }),
  }),
  () => ({
    nombre: 'rombo',
    puntos: [
      ...Array.from({ length: 6 }, (_, i) => [i * 0.5, i * 0.45] as [number, number]),
      ...Array.from({ length: 6 }, (_, i) => [2.5 + i * 0.5, 2.25 - i * 0.45] as [number, number]),
      ...Array.from({ length: 5 }, (_, i) => [5 - (i + 1) * 0.5, -(i + 1) * 0.45] as [number, number]),
      ...Array.from({ length: 4 }, (_, i) => [2.5 - (i + 1) * 0.5, -2.25 + (i + 1) * 0.45] as [number, number]),
    ],
  }),
  () => ({
    nombre: 'carita feliz',
    puntos: [
      ...Array.from({ length: 22 }, (_, i) => [Math.cos((i / 22) * Math.PI * 2) * 2, Math.sin((i / 22) * Math.PI * 2) * 2] as [number, number]),
      [-0.7, 0.6], [0.7, 0.6], [-0.75, 0.95], [0.75, 0.95],
      ...Array.from({ length: 7 }, (_, i) => [Math.cos(Math.PI * (1.15 + i * 0.117)) * 1.1, Math.sin(Math.PI * (1.15 + i * 0.117)) * 1.1] as [number, number]),
    ],
  }),
  () => ({
    // Un retrete: tanque, taza y base
    nombre: 'retrete',
    puntos: [
      ...[0, 0.5, 1, 1.5].flatMap((y) => [[0, y + 0.6], [0.5, y + 0.6]] as [number, number][]),
      ...Array.from({ length: 7 }, (_, i) => [0.5 + i * 0.45, 0.3] as [number, number]),
      ...Array.from({ length: 5 }, (_, i) => [0.9 + i * 0.4, -0.35 - Math.sin((i / 4) * Math.PI) * 0.35] as [number, number]),
      [1.6, -1], [1.9, -1], [1.6, -1.5], [1.9, -1.5], [1.3, -1.9], [1.75, -1.9], [2.2, -1.9],
    ],
  }),
  () => ({ nombre: 'zigzag', puntos: Array.from({ length: 24 }, (_, i) => [i * PASO * 0.75, ((i % 8) < 4 ? i % 4 : 4 - (i % 4)) * 0.6 - 1.2] as [number, number]) }),
  () => ({ nombre: 'cuadrito', puntos: Array.from({ length: 25 }, (_, i) => [(i % 5) * PASO, Math.floor(i / 5) * PASO - 1.2] as [number, number]) }),
];

/** Las figuras con palabras de la pareja y lo que sale en su lugar cuando juega un amigo. */
const NEUTRAS: Record<number, () => Figura> = {
  6: () => ({ nombre: 'WOW', puntos: texto('WOW', 0.42) }),
  7: () => ({ nombre: 'GOL', puntos: texto('GOL', 0.45) }),
  8: () => ({ nombre: 'TOP', puntos: texto('TOP', 0.45) }),
};

/** La figura `i` (en modo neutro, sin las palabras de la pareja). */
export function figura(i: number): Figura {
  return ((esNeutroCohete() && NEUTRAS[i]) || FIGURAS[i])();
}

interface Rollo {
  x: number;
  y: number;
  vivo: boolean;
  fig: number;
  giro: number;
  /** Lo está jalando el imán o el ayudante. */
  jalado: boolean;
  vx: number;
  vy: number;
  /** Vale más (rollito gigante de la paca). */
  valor: number;
}

interface FiguraViva {
  id: number;
  total: number;
  cogidos: number;
  perdida: boolean;
  corazon: boolean;
  nombre: string;
}

export class Rollitos {
  readonly grupo = new THREE.Group();
  private mallas: THREE.InstancedMesh[] = [];
  private lista: Rollo[] = [];
  private max: number;
  private figuras = new Map<number, FiguraViva>();
  private sigFigura = 1;
  private dummy = new THREE.Object3D();
  private t = 0;
  /** Lo bueno brilla en dorado: un resplandor detrás de cada rollito y el borde dorado encendido. */
  private auras: Auras;
  private borde = new Borde(DORADO, 0.7, 2.4, 'oro');

  constructor(partes: { geo: THREE.BufferGeometry; mat: THREE.Material }[], max = 260) {
    this.max = max;
    this.auras = new Auras(DORADO, max, { borde: false, aditiva: false, opacidad: 0.7 });
    this.grupo.add(this.auras.malla);
    for (const p of partes) {
      const m = new THREE.InstancedMesh(p.geo, this.borde.material(p.mat), max);
      m.count = 0;
      m.frustumCulled = false;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.mallas.push(m);
      this.grupo.add(m);
    }
  }

  get cantidad() {
    return this.lista.length;
  }

  /** Pone una figura entrando por la derecha (x0) centrada en y0 (devuelve cuántos puso). */
  poner(f: Figura, x0: number, y0: number, limY: number): number {
    const id = this.sigFigura++;
    let n = 0;
    const minY = Math.min(...f.puntos.map((p) => p[1])), maxY = Math.max(...f.puntos.map((p) => p[1]));
    // Que la figura quepa en la pantalla
    const y = Math.max(-limY - minY, Math.min(limY - maxY, y0));
    for (const [px, py] of f.puntos) {
      if (this.lista.length >= this.max) break;
      this.lista.push({ x: x0 + px, y: y + py, vivo: true, fig: id, giro: Math.random() * 6, jalado: false, vx: 0, vy: 0, valor: 1 });
      n++;
    }
    this.figuras.set(id, { id, total: n, cogidos: 0, perdida: false, corazon: !!f.corazon, nombre: f.nombre });
    return n;
  }

  /** Un rollito suelto (lo que suelta un asteroide destruido). */
  suelto(x: number, y: number, valor = 1, vx = 0, vy = 0) {
    if (this.lista.length >= this.max) return;
    this.lista.push({ x, y, vivo: true, fig: 0, giro: Math.random() * 6, jalado: valor > 1, vx, vy, valor });
  }

  /** El rollito más cercano a (x, y) dentro de un radio (para el ayudante). */
  cercano(x: number, y: number, radio: number, adelante = -2): { x: number; y: number } | null {
    let mejor: Rollo | null = null, d = radio * radio;
    for (const r of this.lista) {
      if (!r.vivo || r.x < x + adelante) continue;
      const dd = (r.x - x) ** 2 + (r.y - y) ** 2;
      if (dd < d) {
        d = dd;
        mejor = r;
      }
    }
    return mejor;
  }

  /**
   * Avanza: se corren con el mundo, el imán los jala, y los que tocan algún recogedor se cuentan.
   * `recoger` dice si un punto toca la nave (o el ayudante) y `alCoger` avisa cada uno recogido.
   */
  actualizar(
    dt: number,
    avance: number,
    iman: { x: number; y: number; radio: number } | null,
    recoge: (x: number, y: number) => boolean,
    alCoger: (x: number, y: number, valor: number) => void,
    alFigura: (nombre: string, corazon: boolean) => void,
    ayudante: { x: number; y: number } | null,
  ) {
    this.t += dt;
    let w = 0;
    for (let i = 0; i < this.lista.length; i++) {
      const r = this.lista[i];
      if (!r.vivo) continue;
      r.x -= avance;
      r.giro += dt * 3;
      // Imán: los que están cerca vuelan hacia la nave (y ya no se sueltan)
      if (iman && !r.jalado && (r.x - iman.x) ** 2 + (r.y - iman.y) ** 2 < iman.radio * iman.radio) r.jalado = true;
      if (r.jalado) {
        const objetivo = ayudante && (r.x - ayudante.x) ** 2 + (r.y - ayudante.y) ** 2 < 2.2 ? ayudante : iman;
        if (objetivo) {
          const dx = objetivo.x - r.x, dy = objetivo.y - r.y;
          const d = Math.hypot(dx, dy) || 1;
          const vel = 9 + 22 / (d + 0.3);
          r.vx += ((dx / d) * vel - r.vx) * Math.min(1, dt * 8);
          r.vy += ((dy / d) * vel - r.vy) * Math.min(1, dt * 8);
        }
      }
      if (r.vx || r.vy) {
        r.x += r.vx * dt;
        r.y += r.vy * dt;
        if (!r.jalado) {
          r.vx *= 1 - Math.min(1, dt * 1.5);
          r.vy *= 1 - Math.min(1, dt * 1.5);
        }
      }
      if (recoge(r.x, r.y)) {
        r.vivo = false;
        alCoger(r.x, r.y, r.valor);
        const f = this.figuras.get(r.fig);
        if (f) {
          f.cogidos++;
          if (f.cogidos === f.total && !f.perdida) alFigura(f.nombre, f.corazon);
        }
        continue;
      }
      if (r.x < -26) {
        r.vivo = false;
        const f = this.figuras.get(r.fig);
        if (f) f.perdida = true;
        continue;
      }
      this.lista[w++] = r;
    }
    this.lista.length = w;
    // Figuras que ya no tienen rollitos vivos: se olvidan
    if (this.figuras.size > 40) {
      const vivas = new Set(this.lista.map((r) => r.fig));
      for (const id of this.figuras.keys()) if (!vivas.has(id)) this.figuras.delete(id);
    }
    // Dibujar
    this.borde.latir(this.t);
    this.auras.empezar();
    for (let i = 0; i < this.lista.length; i++) {
      const r = this.lista[i];
      const brillo = 1 + 0.08 * Math.sin(this.t * 6 + r.x);
      const y = r.y + Math.sin(this.t * 3 + r.x * 0.7) * 0.06;
      const tam = brillo * (r.valor > 1 ? 2.4 : 1);
      this.dummy.position.set(r.x, y, 0);
      this.dummy.rotation.set(0.35, r.giro, 0.5);
      this.dummy.scale.setScalar(tam);
      this.dummy.updateMatrix();
      for (const m of this.mallas) m.setMatrixAt(i, this.dummy.matrix);
      const a = 1.05 * tam * (1 + 0.12 * Math.sin(this.t * 7 + r.x * 1.3));
      this.auras.poner(r.x, y, -0.3, a, a);
    }
    this.auras.terminar();
    for (const m of this.mallas) {
      m.count = this.lista.length;
      m.instanceMatrix.needsUpdate = true;
    }
  }

  /** Recorre los vivos (para chispitas y para el bot de pruebas). */
  cada(fn: (x: number, y: number) => void) {
    for (const r of this.lista) if (r.vivo) fn(r.x, r.y);
  }

  vaciar() {
    this.lista.length = 0;
    this.figuras.clear();
    for (const m of this.mallas) m.count = 0;
    this.auras.empezar();
    this.auras.terminar();
  }

  liberar() {
    for (const m of this.mallas) m.dispose();
    this.auras.liberar();
    this.borde.liberar();
  }
}
