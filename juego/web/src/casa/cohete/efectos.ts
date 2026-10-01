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
    private grupo: THREE.Group,
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
  private arco = 0;
  estela = 'fuego';
  /** 1 normal; más con el turbo. */
  fuerza = 1;
  /** El turbo de frijoles pinta el fuego de verde. */
  verde = 0;

  constructor(private fx: Efectos) {}

  /** Sale fuego (y la estela comprada) de la boca del retrete. `mundo` es la velocidad del mundo. */
  actualizar(dt: number, b: Boca, mundo: number, encendido: boolean) {
    if (!encendido) return;
    const { brillo, humo } = this.fx;
    const f = this.fuerza;
    this.acum += dt * 70 * Math.min(2.2, f);
    const vChorro = 4.5 + f * 2.5;
    while (this.acum >= 1) {
      this.acum--;
      const ab = rnd(-0.35, 0.35);
      const vx = (b.dx + ab * b.dy) * vChorro, vy = (b.dy - ab * b.dx) * vChorro;
      const caliente = this.verde > 0.5 ? '#E9FFB8' : '#FFF6C8';
      const medio = this.verde > 0.5 ? '#9BE05A' : '#FF9A3C';
      brillo.emitir({
        x: b.x + rnd(-0.06, 0.06), y: b.y + rnd(-0.04, 0.04), z: rnd(-0.1, 0.25), vx, vy, vida: rnd(0.16, 0.3) * (0.8 + f * 0.25),
        tam0: rnd(0.55, 0.85) * (0.8 + f * 0.3), tam1: 0.12, color0: caliente, color1: medio, cuadro: CUADRO.llama, roce: 1.5, arrastre: 0.9,
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
      // Seis bandas que salen de la boca como una cinta
      this.acumEstela += dt * 40;
      this.arco += dt * 9;
      while (this.acumEstela >= 1) {
        this.acumEstela--;
        e.colores.forEach((col, k) => {
          brillo.emitir({
            x: b.x - 0.1, y: b.y + 0.55 - k * 0.2 + Math.sin(this.arco) * 0.08, z: -0.2, vx: -mundo * 0.15 - 1, vy: 0, vida: 0.9, tam0: 0.34, tam1: 0.3,
            color0: col, cuadro: CUADRO.cuadrado, arrastre: 1, alfa: 0.55,
          });
        });
      }
      return;
    }
    this.acumEstela += dt * e.ritmo;
    while (this.acumEstela >= 1) {
      this.acumEstela--;
      const p = e.aditivo ? brillo : humo;
      p.emitir({
        x: b.x + rnd(-0.15, 0.15), y: b.y + rnd(-0.15, 0.15), z: rnd(-0.4, 0.4), vx: b.dx * 2.5 + rnd(-0.8, 0.8), vy: b.dy * 2.5 + rnd(-0.8, 0.8),
        vida: rnd(0.8, 1.4), tam0: e.tam[0] * rnd(0.8, 1.2), tam1: e.tam[1], color0: elegir(e.colores), cuadro: elegir(e.cuadros), roce: 1.2,
        gravedad: e.gravedad ?? 0, giro: rnd(-0.5, 0.5), vgiro: rnd(-2, 2), arrastre: 1, alfa: 0.95,
      });
    }
  }
}
