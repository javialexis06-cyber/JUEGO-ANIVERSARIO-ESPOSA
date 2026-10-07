// Efectos del retrete espacial armados con las partículas: explosiones con escombros y onda expansiva, chispazos,
// bocanadas de humo, el fuego del cohete y las estelas que se compran en la tienda.
import * as THREE from 'three';
import { CUADRO } from './arte';
import type { Particulas } from './particulas';

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const elegir = <T,>(l: readonly T[]) => l[Math.floor(Math.random() * l.length)];

export class Efectos {
  /** Escombros (pedacitos de roca que salen volando). */
  private escombros: { m: THREE.Mesh; vx: number; vy: number; vz: number; g: THREE.Vector3; vida: number }[] = [];
  private libres: THREE.Mesh[] = [];
  private ondas: { s: THREE.Sprite; vida: number; total: number; tam: number }[] = [];
  private ondasLibres: THREE.Sprite[] = [];

  constructor(
    readonly brillo: Particulas,
    readonly humo: Particulas,
    readonly grupo: THREE.Group,
    private geoEscombro: THREE.BufferGeometry,
    private matEscombro: THREE.Material,
    private texAro: THREE.Texture,
  ) {}

  /** Explosión: destello, bolas de fuego, chispas, humo, escombros y una onda que se abre. */
  explotar(x: number, y: number, tam = 1, colores: readonly string[] = ['#FFF3B0', '#FFB347', '#FF6A3D'], escombros = true) {
    this.brillo.emitir({ x, y, z: 0.5, vida: 0.35, tam0: 3.2 * tam, tam1: 4.5 * tam, color0: '#FFFFFF', color1: '#FFC46B', cuadro: CUADRO.brillo, arrastre: 0.6 });
    for (let i = 0; i < 18 * tam + 6; i++) {
      const a = Math.random() * Math.PI * 2, v = rnd(1.5, 6) * tam;
      this.brillo.emitir({
        x, y, z: rnd(-0.3, 0.6), vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: rnd(0.35, 0.8), tam0: rnd(0.5, 1.1) * tam, tam1: 0.1,
        color0: elegir(colores), color1: '#C43B2A', cuadro: CUADRO.brillo, roce: 2.5, arrastre: 0.7,
      });
    }
    for (let i = 0; i < 14 * tam; i++) {
      const a = Math.random() * Math.PI * 2, v = rnd(5, 12) * tam;
      this.brillo.emitir({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: rnd(0.25, 0.6), tam0: 0.22, tam1: 0.05, color0: '#FFFFFF', color1: '#FFD36B',
        cuadro: CUADRO.chispa, roce: 3, gravedad: 4, arrastre: 0.5, giro: a,
      });
    }
    for (let i = 0; i < 10 * tam; i++) {
      const a = Math.random() * Math.PI * 2, v = rnd(0.6, 2.4) * tam;
      this.humo.emitir({
        x: x + Math.cos(a) * 0.3, y: y + Math.sin(a) * 0.3, z: -0.2, vx: Math.cos(a) * v, vy: Math.sin(a) * v + 0.4, vida: rnd(0.9, 1.6),
        tam0: rnd(0.8, 1.4) * tam, tam1: rnd(2, 3) * tam, color0: '#6B5A55', color1: '#2E2A33', alfa: 0.75, cuadro: CUADRO.humo, roce: 1.2,
        giro: Math.random() * 6, vgiro: rnd(-1, 1), arrastre: 0.8,
      });
    }
    this.onda(x, y, 4.2 * tam, 0.45, '#FFE2A8');
    if (escombros) for (let i = 0; i < Math.round(5 * tam + 2); i++) this.escombro(x, y, tam);
  }

  /** Destello chiquito (al coger un rollito, al chocar con la burbuja). */
  chispazo(x: number, y: number, color: string, n = 8, tam = 0.35) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.4, v = rnd(2, 4.5);
      this.brillo.emitir({ x, y, z: 0.4, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: rnd(0.25, 0.45), tam0: tam, tam1: 0.04, color0: '#FFFFFF', color1: color, cuadro: CUADRO.chispa, roce: 4, giro: a });
    }
    this.brillo.emitir({ x, y, z: 0.4, vida: 0.22, tam0: tam * 3, tam1: tam * 4.5, color0: color, color1: color, cuadro: CUADRO.brillo, alfa: 0.8 });
  }

  /** Lluvia de figuritas (corazones, flores, estrellas) que salen de un punto. */
  estallido(x: number, y: number, cuadro: number, colores: readonly string[], n = 16, v = 5, tam = 0.45, aditivo = false) {
    const p = aditivo ? this.brillo : this.humo;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, vv = rnd(v * 0.4, v);
      p.emitir({
        x, y, z: rnd(0, 1), vx: Math.cos(a) * vv, vy: Math.sin(a) * vv, vida: rnd(0.7, 1.3), tam0: tam, tam1: tam * 0.6, color0: elegir(colores),
        cuadro, roce: 1.8, gravedad: 2, giro: Math.random() * 6, vgiro: rnd(-5, 5), arrastre: 0.3,
      });
    }
  }

  /** Onda que se abre (aro de luz). */
  onda(x: number, y: number, tam: number, vida: number, color: string) {
    const s = this.ondasLibres.pop() ?? new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texAro, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    (s.material as THREE.SpriteMaterial).color.set(color);
    s.position.set(x, y, 0.6);
    s.scale.setScalar(0.1);
    s.visible = true;
    s.renderOrder = 7;
    if (!s.parent) this.grupo.add(s);
    this.ondas.push({ s, vida, total: vida, tam });
  }

  private escombro(x: number, y: number, tam: number) {
    const m = this.libres.pop() ?? new THREE.Mesh(this.geoEscombro, this.matEscombro);
    m.position.set(x, y, rnd(-0.5, 0.5));
    m.scale.setScalar(rnd(0.08, 0.2) * Math.sqrt(tam));
    m.visible = true;
    if (!m.parent) this.grupo.add(m);
    const a = Math.random() * Math.PI * 2, v = rnd(3, 8) * Math.sqrt(tam);
    this.escombros.push({ m, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: rnd(-2, 2), g: new THREE.Vector3(rnd(-6, 6), rnd(-6, 6), rnd(-6, 6)), vida: rnd(0.8, 1.4) });
  }

  actualizar(dt: number, mundo: number) {
    for (let i = this.escombros.length - 1; i >= 0; i--) {
      const e = this.escombros[i];
      e.vida -= dt;
      e.m.position.x += (e.vx - mundo * 0.6) * dt;
      e.m.position.y += e.vy * dt;
      e.m.position.z += e.vz * dt;
      e.vx *= 1 - dt * 0.8;
      e.vy *= 1 - dt * 0.8;
      e.m.rotation.x += e.g.x * dt;
      e.m.rotation.y += e.g.y * dt;
      e.m.rotation.z += e.g.z * dt;
      if (e.vida < 0.3) e.m.scale.multiplyScalar(1 - dt * 6);
      if (e.vida <= 0) {
        e.m.visible = false;
        this.libres.push(e.m);
        this.escombros.splice(i, 1);
      }
    }
    for (let i = this.ondas.length - 1; i >= 0; i--) {
      const o = this.ondas[i];
      o.vida -= dt;
      const k = 1 - o.vida / o.total;
      o.s.scale.setScalar(0.2 + o.tam * (1 - Math.pow(1 - k, 3)));
      (o.s.material as THREE.SpriteMaterial).opacity = (1 - k) * 0.9;
      o.s.position.x -= mundo * 0.5 * dt;
      if (o.vida <= 0) {
        o.s.visible = false;
        this.ondasLibres.push(o.s);
        this.ondas.splice(i, 1);
      }
    }
  }

  vaciar() {
    for (const e of this.escombros) {
      e.m.visible = false;
      this.libres.push(e.m);
    }
    this.escombros.length = 0;
    for (const o of this.ondas) {
      o.s.visible = false;
      this.ondasLibres.push(o.s);
    }
    this.ondas.length = 0;
    this.brillo.vaciar();
    this.humo.vaciar();
  }
}

// ---------------------------------------------------------------------------
// Fuego del cohete y estelas (lo que sale por debajo del retrete)
// ---------------------------------------------------------------------------
export interface Boca {
  x: number;
  y: number;
  /** Dirección de salida del chorro (hacia atrás y abajo). */
  dx: number;
  dy: number;
}

const ESTELA: Record<string, { cuadros: number[]; colores: string[]; aditivo: boolean; tam: [number, number]; ritmo: number; gravedad?: number }> = {
  frijoles: { cuadros: [CUADRO.humo, CUADRO.humo, CUADRO.frijol], colores: ['#A6D66A', '#8BC34A', '#C9E39A', '#7A4E2D'], aditivo: false, tam: [0.5, 1.4], ritmo: 26 },
  burbujas: { cuadros: [CUADRO.burbuja], colores: ['#BFF0FF', '#D9C8FF', '#FFD6EE', '#C8FFF4'], aditivo: false, tam: [0.3, 0.6], ritmo: 16 },
  corazones: { cuadros: [CUADRO.corazon], colores: ['#FF4F7E', '#FF7FA3', '#E8396E', '#FFB0C6'], aditivo: false, tam: [0.42, 0.3], ritmo: 15 },
  chispitas: { cuadros: [CUADRO.chispa, CUADRO.estrella], colores: ['#FFE27A', '#FFD23F', '#FFF5C2', '#FFB627'], aditivo: true, tam: [0.5, 0.1], ritmo: 26 },
  notas: { cuadros: [CUADRO.nota], colores: ['#FF6B6B', '#4ECDC4', '#FFD23F', '#A06CD5', '#FF9F1C'], aditivo: false, tam: [0.45, 0.35], ritmo: 12 },
  confeti: { cuadros: [CUADRO.confeti], colores: ['#FCD116', '#FCD116', '#2456C9', '#CE1126'], aditivo: false, tam: [0.28, 0.24], ritmo: 26, gravedad: 2.5 },
  petalos: { cuadros: [CUADRO.petalo], colores: ['#E8395B', '#FF6F91', '#C9184A', '#FF9EB5'], aditivo: false, tam: [0.38, 0.3], ritmo: 18, gravedad: 1.2 },
  arcoiris: { cuadros: [CUADRO.cuadrado], colores: ['#FF4B4B', '#FF9F1C', '#FFE66D', '#5BD46B', '#4AA8FF', '#9B6BFF'], aditivo: false, tam: [0.32, 0.32], ritmo: 0 },
  estrellas: { cuadros: [CUADRO.estrella, CUADRO.chispa], colores: ['#FFFFFF', '#FFF2A8', '#BFE3FF', '#FFD6F5'], aditivo: true, tam: [0.55, 0.12], ritmo: 18 },
};

export class Propulsor {
  private acum = 0;
  private acumEstela = 0;
  estela = 'fuego';
  /** 1 normal; más con el turbo. */
  fuerza = 1;
  /** El turbo de frijoles pinta el fuego de verde. */
  verde = 0;
  /** La cinta suave de las estelas especiales (las de más rareza llevan más capas). */
  readonly cinta: Cinta;

  constructor(private fx: Efectos) {
    this.cinta = new Cinta(fx.grupo);
  }

  liberar() {
    this.cinta.liberar();
  }

  /** Sale fuego (y la estela comprada) de la boca del retrete. `mundo` es la velocidad del mundo. */
  actualizar(dt: number, b: Boca, mundo: number, encendido: boolean) {
    this.cinta.actualizar(dt, b, mundo, encendido, this.estela);
    if (!encendido) return;
    const { brillo, humo } = this.fx;
    const f = this.fuerza;
    this.acum += dt * 90 * Math.min(2.2, f);
    const vChorro = 4.5 + f * 2.5;
    while (this.acum >= 1) {
      this.acum--;
      const ab = rnd(-0.35, 0.35);
      const vx = (b.dx + ab * b.dy) * vChorro, vy = (b.dy - ab * b.dx) * vChorro;
      const caliente = this.verde > 0.5 ? '#E9FFB8' : '#FFF6C8';
      const medio = this.verde > 0.5 ? '#9BE05A' : '#FF9A3C';
      brillo.emitir({
        x: b.x + rnd(-0.06, 0.06), y: b.y + rnd(-0.04, 0.04), z: rnd(-0.1, 0.25), vx, vy, vida: rnd(0.16, 0.3) * (0.8 + f * 0.25),
        tam0: rnd(0.75, 1.15) * (0.8 + f * 0.3), tam1: 0.15, color0: caliente, color1: medio, cuadro: CUADRO.llama, roce: 1.5, arrastre: 0.9,
        giro: Math.atan2(-vx, vy), alfa: 0.95,
      });
      if (Math.random() < 0.55) {
        brillo.emitir({
          x: b.x, y: b.y, z: 0.1, vx: vx * 1.2 + rnd(-1, 1), vy: vy * 1.2 + rnd(-1, 1), vida: rnd(0.25, 0.5), tam0: 0.12, tam1: 0.03,
          color0: '#FFFFFF', color1: medio, cuadro: CUADRO.punto, roce: 1, arrastre: 1,
        });
      }
    }
    // Humito que se queda atrás
    if (this.estela === 'fuego' && Math.random() < dt * 34) {
      humo.emitir({
        x: b.x + b.dx * 0.7, y: b.y + b.dy * 0.7, z: -0.3, vx: b.dx * 2, vy: b.dy * 2 + 0.3, vida: rnd(0.8, 1.3), tam0: 0.5, tam1: rnd(1.4, 2),
        color0: this.verde > 0.5 ? '#C8E6A0' : '#E8E4F0', color1: this.verde > 0.5 ? '#7FA060' : '#8A8698', alfa: 0.55, cuadro: CUADRO.humo,
        roce: 1.5, giro: Math.random() * 6, vgiro: rnd(-1, 1), arrastre: 1,
      });
    }
    // La estela comprada
    const e = ESTELA[this.estela];
    if (!e) return;
    if (this.estela === 'arcoiris') {
      // La cinta hace las bandas; de vez en cuando sale una chispita de colores
      this.acumEstela += dt * 7;
      while (this.acumEstela >= 1) {
        this.acumEstela--;
        brillo.emitir({
          x: b.x + rnd(-0.3, 0.1), y: b.y + rnd(-0.5, 0.3), z: 0.05, vx: b.dx * 1.5 + rnd(-0.5, 0.5), vy: b.dy * 1.5 + rnd(-0.5, 0.5), vida: rnd(0.5, 0.8),
          tam0: 0.36, tam1: 0.06, color0: '#FFFFFF', color1: elegir(e.colores), cuadro: CUADRO.estrella, roce: 1.2, arrastre: 1, giro: rnd(-0.5, 0.5), vgiro: rnd(-3, 3),
        });
      }
      return;
    }
    this.acumEstela += dt * e.ritmo;
    while (this.acumEstela >= 1) {
      this.acumEstela--;
      const p = e.aditivo ? brillo : humo;
      p.emitir({
        x: b.x + rnd(-0.15, 0.15), y: b.y + rnd(-0.15, 0.15), z: rnd(-0.08, 0.2), vx: b.dx * 2.5 + rnd(-0.8, 0.8), vy: b.dy * 2.5 + rnd(-0.8, 0.8),
        vida: rnd(0.8, 1.4), tam0: e.tam[0] * rnd(0.9, 1.15), tam1: e.tam[1], color0: elegir(e.colores), cuadro: elegir(e.cuadros), roce: 1.2,
        gravedad: e.gravedad ?? 0, giro: rnd(-0.5, 0.5), vgiro: rnd(-2, 2), arrastre: 1, alfa: 1,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// La cinta: una franja suave que sale de la boca y se queda flotando atrás (como la del gatito del arcoíris)
// ---------------------------------------------------------------------------
interface CapaCinta {
  /** Ancho en unidades del mundo. */
  ancho: number;
  /** Colores de la cabeza a la cola. */
  colores: string[];
  alfa: number;
  aditivo?: boolean;
  /** Corrida a un lado (para las bandas del arcoíris y de la bandera). */
  lado?: number;
  /** Cuánto se ondula. */
  onda?: number;
  /** Bordes nítidos (bandas) en vez de difuminados (luz). */
  nitida?: boolean;
  /** El ancho no se adelgaza hacia la cola. */
  pareja?: boolean;
}
interface EstiloCinta {
  /** Segundos que dura cada pedacito. */
  vida: number;
  capas: CapaCinta[];
}
/** Más rareza, más capas y más suave. Las comunes (fuego, frijoles, burbujas) no llevan cinta: son puras partículas. */
const CINTAS: Record<string, EstiloCinta> = {
  corazones: {
    vida: 0.65,
    capas: [
      { ancho: 0.78, colores: ['#FF9EB8', '#FF4F7E'], alfa: 0.62 },
      { ancho: 0.13, colores: ['#FFFFFF', '#FF7FA3'], alfa: 0.9, nitida: true },
    ],
  },
  chispitas: {
    vida: 0.65,
    capas: [
      { ancho: 0.72, colores: ['#FFD23F', '#FF9A1F'], alfa: 0.68 },
      { ancho: 0.12, colores: ['#FFFFFF', '#FFD23F'], alfa: 0.95, nitida: true },
    ],
  },
  // Un pentagrama que se ondula (las notas salen encima)
  notas: {
    vida: 0.9,
    capas: [0, 1, 2, 3, 4].map((k) => ({
      ancho: 0.04, colores: ['#FFFFFF', '#E9DDFF'], alfa: 0.9, lado: 0.24 - k * 0.12, nitida: true, pareja: true, onda: 0.2,
    })),
  },
  // La bandera: mitad amarillo, un cuarto azul y un cuarto rojo
  confeti: {
    vida: 0.9,
    capas: [
      { ancho: 0.3, colores: ['#FCD116'], alfa: 0.95, lado: 0.15, nitida: true, pareja: true, onda: 0.1 },
      { ancho: 0.15, colores: ['#2456C9'], alfa: 0.95, lado: -0.075, nitida: true, pareja: true, onda: 0.1 },
      { ancho: 0.15, colores: ['#CE1126'], alfa: 0.95, lado: -0.225, nitida: true, pareja: true, onda: 0.1 },
    ],
  },
  petalos: {
    vida: 1.05,
    capas: [
      { ancho: 1.35, colores: ['#FFB3C6', '#FF6F91'], alfa: 0.5, onda: 0.24 },
      { ancho: 0.62, colores: ['#FF7FA0', '#E8395B'], alfa: 0.8, onda: 0.24 },
      { ancho: 0.13, colores: ['#FFFFFF', '#FFD3DE'], alfa: 0.95, onda: 0.24, nitida: true },
    ],
  },
  arcoiris: {
    vida: 1.1,
    capas: ['#FF4B4B', '#FF9F1C', '#FFE66D', '#5BD46B', '#4AA8FF', '#9B6BFF'].map((c, k) => ({
      ancho: 0.15, colores: [c], alfa: 0.95, lado: 0.375 - k * 0.15, nitida: true, pareja: true, onda: 0.07,
    })),
  },
  estrellas: {
    vida: 1.25,
    capas: [
      { ancho: 1.5, colores: ['#CFE6FF', '#FFC9EF', '#B9A2FF'], alfa: 0.5, onda: 0.14 },
      { ancho: 0.7, colores: ['#FFE680', '#9FD3FF', '#FFB8E8'], alfa: 0.82, onda: 0.14 },
      { ancho: 0.17, colores: ['#FFFFFF', '#FFF8D6'], alfa: 1, aditivo: true, onda: 0.14, nitida: true },
    ],
  },
};
const MAX_CAPAS = 6;
const PUNTOS = 64;
/** Cada cuánto queda un punto (en segundos): con eso la cinta sale lisa aunque el celular vaya a 30 cuadros. */
const PASO = 1 / 60;

/** Textura de una sola columna: cuánto se ve de un borde al otro de la cinta. */
function texturaBorde(nitida: boolean) {
  const n = 64;
  const datos = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const v = Math.abs((i + 0.5) / n * 2 - 1);
    // (la suave es llena en el centro y se desvanece solo en el borde: si no, a la luz del día no se ve)
    const a = nitida ? THREE.MathUtils.smoothstep(1 - v, 0, 0.12) : 1 - Math.pow(v, 2.4);
    datos.set([255, 255, 255, Math.round(a * 255)], i * 4);
  }
  const t = new THREE.DataTexture(datos, 1, n);
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

class Cinta {
  // Los puntos, del más nuevo (0) al más viejo
  private x = new Float32Array(PUNTOS);
  private y = new Float32Array(PUNTOS);
  private vx = new Float32Array(PUNTOS);
  private vy = new Float32Array(PUNTOS);
  private edad = new Float32Array(PUNTOS);
  private fase = new Float32Array(PUNTOS);
  private n = 0;
  private acum = 0;
  private t = 0;
  private antes: { x: number; y: number } | null = null;
  private mallas: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>[] = [];
  private texSuave = texturaBorde(false);
  private texNitida = texturaBorde(true);
  private estilo = '';
  private color = new THREE.Color();
  private c1 = new THREE.Color();

  constructor(private grupo: THREE.Group) {
    // Todas las capas se arman desde el principio (vacías): así el sombreador ya está listo cuando se estrena una estela
    const vert = (PUNTOS + 1) * 2;
    const indices: number[] = [];
    for (let i = 0; i < PUNTOS; i++) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    for (let k = 0; k < MAX_CAPAS; k++) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vert * 3), 3).setUsage(THREE.DynamicDrawUsage));
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(vert * 4), 4).setUsage(THREE.DynamicDrawUsage));
      const uv = new Float32Array(vert * 2);
      for (let i = 0; i < vert; i++) uv.set([0.5, i % 2], i * 2);
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      geo.setIndex(indices);
      geo.setDrawRange(0, 0);
      const m = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({ map: this.texSuave, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
      );
      m.frustumCulled = false;
      m.renderOrder = 2;
      grupo.add(m);
      this.mallas.push(m);
    }
  }

  actualizar(dt: number, b: Boca, mundo: number, encendido: boolean, estela: string) {
    const e = CINTAS[estela];
    if (estela !== this.estilo) {
      this.estilo = estela;
      this.n = 0;
      this.antes = null;
      this.mallas.forEach((m, k) => {
        const c = e?.capas[k];
        m.visible = !!c;
        if (!c) return;
        m.material.map = c.nitida ? this.texNitida : this.texSuave;
        m.material.blending = c.aditivo ? THREE.AdditiveBlending : THREE.NormalBlending;
        m.material.needsUpdate = true;
      });
    }
    if (!e) return;
    this.t += dt;
    // Lo que ya salió se queda atrás (el mundo corre) y se va frenando
    for (let i = 0; i < this.n; i++) {
      this.edad[i] += dt;
      this.x[i] += (this.vx[i] - mundo) * dt;
      this.y[i] += this.vy[i] * dt;
      const f = Math.max(0, 1 - dt * 2.5);
      this.vx[i] *= f;
      this.vy[i] *= f;
    }
    while (this.n > 0 && this.edad[this.n - 1] > e.vida) this.n--;
    // La cabeza, un poquito detrás del fuego
    const hx = b.x + b.dx * 0.32, hy = b.y + b.dy * 0.32;
    if (encendido) {
      const desde = this.antes ?? { x: hx, y: hy };
      this.acum += dt;
      const nuevos = Math.min(PUNTOS, Math.floor(this.acum / PASO));
      this.acum -= nuevos * PASO;
      for (let j = nuevos - 1; j >= 0; j--) {
        // Repartidos entre donde estaba la boca el cuadro pasado y donde está ahora
        const k = 1 - j / Math.max(1, nuevos);
        this.meter(desde.x + (hx - desde.x) * k, desde.y + (hy - desde.y) * k, b, j * PASO, mundo);
      }
      this.antes = { x: hx, y: hy };
    } else this.antes = null;
    this.dibujar(e, encendido ? hx : null, hy);
  }

  private meter(x: number, y: number, b: Boca, edad: number, mundo: number) {
    const n = Math.min(this.n + 1, PUNTOS);
    for (let i = n - 1; i > 0; i--) {
      this.x[i] = this.x[i - 1];
      this.y[i] = this.y[i - 1];
      this.vx[i] = this.vx[i - 1];
      this.vy[i] = this.vy[i - 1];
      this.edad[i] = this.edad[i - 1];
      this.fase[i] = this.fase[i - 1];
    }
    this.n = n;
    this.x[0] = x - mundo * edad;
    this.y[0] = y;
    this.vx[0] = b.dx * 1.6;
    this.vy[0] = b.dy * 0.9;
    this.edad[0] = edad;
    this.fase[0] = (this.t - edad) * 7.5;
  }

  private dibujar(e: EstiloCinta, hx: number | null, hy: number) {
    // Los puntos que se dibujan: la cabeza pegada a la boca (si está prendido) y los que van quedando
    const cuantos = this.n + (hx !== null ? 1 : 0);
    const px = (i: number) => (hx !== null ? (i === 0 ? hx : this.x[i - 1]) : this.x[i]);
    const py = (i: number) => (hx !== null ? (i === 0 ? hy : this.y[i - 1]) : this.y[i]);
    const pe = (i: number) => (hx !== null ? (i === 0 ? 0 : this.edad[i - 1]) : this.edad[i]);
    const pf = (i: number) => (hx !== null ? (i === 0 ? this.t * 7.5 : this.fase[i - 1]) : this.fase[i]);
    e.capas.forEach((c, k) => {
      const m = this.mallas[k];
      const pos = m.geometry.attributes.position as THREE.BufferAttribute;
      const col = m.geometry.attributes.color as THREE.BufferAttribute;
      if (cuantos < 2) {
        m.geometry.setDrawRange(0, 0);
        return;
      }
      const P = pos.array as Float32Array, C = col.array as Float32Array;
      for (let i = 0; i < cuantos; i++) {
        // Hacia dónde va la cinta en este punto (con los vecinos) y su perpendicular
        const a = Math.max(0, i - 1), z = Math.min(cuantos - 1, i + 1);
        let tx = px(z) - px(a), ty = py(z) - py(a);
        const l = Math.hypot(tx, ty) || 1;
        tx /= l;
        ty /= l;
        const nx = -ty, ny = tx;
        const t = Math.min(1, pe(i) / e.vida);
        const w = c.ancho * 0.5 * (c.pareja ? 1 : 1 - t * 0.55) * Math.min(1, 0.45 + pe(i) * 14);
        const off = (c.lado ?? 0) + (c.onda ?? 0) * Math.sin(pf(i)) * Math.min(1, pe(i) * 6);
        const cx = px(i) + nx * off, cy = py(i) + ny * off;
        P.set([cx + nx * w, cy + ny * w, -0.25 - k * 0.002, cx - nx * w, cy - ny * w, -0.25 - k * 0.002], i * 6);
        // Color: de la cabeza a la cola por la lista de colores
        const u = t * (c.colores.length - 1);
        const j = Math.min(c.colores.length - 1, Math.floor(u));
        this.color.set(c.colores[j]);
        if (j + 1 < c.colores.length) this.color.lerp(this.c1.set(c.colores[j + 1]), u - j);
        const alfa = c.alfa * Math.pow(1 - t, c.pareja ? 0.6 : 1.3) * Math.min(1, 0.2 + pe(i) * 20);
        C.set([this.color.r, this.color.g, this.color.b, alfa, this.color.r, this.color.g, this.color.b, alfa], i * 8);
      }
      pos.needsUpdate = true;
      col.needsUpdate = true;
      m.geometry.setDrawRange(0, (cuantos - 1) * 6);
    });
  }

  liberar() {
    for (const m of this.mallas) {
      m.removeFromParent();
      m.geometry.dispose();
      m.material.dispose();
    }
    this.mallas = [];
    this.texSuave.dispose();
    this.texNitida.dispose();
  }
}
