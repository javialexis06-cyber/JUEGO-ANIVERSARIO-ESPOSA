// Partículas del retrete espacial: un solo dibujo para cientos de chispas, llamas, humo, corazones, notas…
// Todo vive en arreglos fijos (nada se crea por cuadro). Cada partícula sale de una casilla del atlas (arte.ts),
// cambia de color de `color0` a `color1`, de tamaño de `tam0` a `tam1`, gira y se desvanece.
import * as THREE from 'three';

const VERTICE = /* glsl */ `
attribute float tam;
attribute vec4 tinte;
attribute vec2 extra; // casilla del atlas, giro
varying vec4 vTinte;
varying vec2 vExtra;
uniform float escala;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = tam * escala / -mv.z;
  vTinte = tinte;
  vExtra = extra;
}`;

const FRAGMENTO = /* glsl */ `
uniform sampler2D atlas;
varying vec4 vTinte;
varying vec2 vExtra;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float c = cos(vExtra.y), s = sin(vExtra.y);
  p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) + 0.5;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) discard;
  float n = vExtra.x;
  vec2 celda = vec2(mod(n, 4.0), floor(n / 4.0));
  vec2 uv = (celda + vec2(p.x, 1.0 - p.y) * 0.96 + 0.02) / 4.0;
  vec4 t = texture2D(atlas, vec2(uv.x, 1.0 - uv.y));
  gl_FragColor = vec4(vTinte.rgb * t.rgb, t.a * vTinte.a);
  if (gl_FragColor.a < 0.004) discard;
}`;

export interface Emision {
  x: number;
  y: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  vida: number;
  tam0: number;
  tam1?: number;
  color0: THREE.ColorRepresentation | THREE.Color;
  color1?: THREE.ColorRepresentation | THREE.Color;
  alfa?: number;
  cuadro?: number;
  giro?: number;
  vgiro?: number;
  /** Frena (1/s). */
  roce?: number;
  /** Gravedad hacia abajo (unidades/s²). */
  gravedad?: number;
  /** Se va con el mundo hacia la izquierda (fracción de la velocidad del mundo). */
  arrastre?: number;
}

const tmp = new THREE.Color();
const tmp2 = new THREE.Color();

export class Particulas {
  readonly puntos: THREE.Points;
  private max: number;
  private n = 0;
  // Estado por partícula (estructura de arreglos)
  private pos: Float32Array;
  private vel: Float32Array;
  private vida: Float32Array;
  private vidaTotal: Float32Array;
  private tam0: Float32Array;
  private tam1: Float32Array;
  private c0: Float32Array;
  private c1: Float32Array;
  private alfa: Float32Array;
  private giro: Float32Array;
  private vgiro: Float32Array;
  private roce: Float32Array;
  private grav: Float32Array;
  private arr: Float32Array;
  private cuadro: Float32Array;
  // Lo que va a la tarjeta gráfica
  private aPos: THREE.BufferAttribute;
  private aTam: THREE.BufferAttribute;
  private aTinte: THREE.BufferAttribute;
  private aExtra: THREE.BufferAttribute;
  /** Cuántas se dejan salir (baja con calidad baja). */
  densidad = 1;
  private material: THREE.ShaderMaterial;

  constructor(max: number, atlas: THREE.Texture, aditivo: boolean) {
    this.max = max;
    const f = (k: number) => new Float32Array(max * k);
    this.pos = f(3);
    this.vel = f(3);
    this.vida = f(1);
    this.vidaTotal = f(1);
    this.tam0 = f(1);
    this.tam1 = f(1);
    this.c0 = f(3);
    this.c1 = f(3);
    this.alfa = f(1);
    this.giro = f(1);
    this.vgiro = f(1);
    this.roce = f(1);
    this.grav = f(1);
    this.arr = f(1);
    this.cuadro = f(1);
    const g = new THREE.BufferGeometry();
    this.aPos = new THREE.BufferAttribute(f(3), 3).setUsage(THREE.DynamicDrawUsage);
    this.aTam = new THREE.BufferAttribute(f(1), 1).setUsage(THREE.DynamicDrawUsage);
    this.aTinte = new THREE.BufferAttribute(f(4), 4).setUsage(THREE.DynamicDrawUsage);
    this.aExtra = new THREE.BufferAttribute(f(2), 2).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.aPos);
    g.setAttribute('tam', this.aTam);
    g.setAttribute('tinte', this.aTinte);
    g.setAttribute('extra', this.aExtra);
    g.setDrawRange(0, 0);
    this.material = new THREE.ShaderMaterial({
      uniforms: { atlas: { value: atlas }, escala: { value: 400 } },
      vertexShader: VERTICE,
      fragmentShader: FRAGMENTO,
      transparent: true,
      depthWrite: false,
      blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.puntos = new THREE.Points(g, this.material);
    this.puntos.frustumCulled = false;
    this.puntos.renderOrder = aditivo ? 6 : 5;
  }

  /** Alto de la pantalla en píxeles de dibujo (el tamaño de las partículas se da en unidades del mundo). */
  ajustar(altoPx: number, fov: number) {
    this.material.uniforms.escala.value = altoPx / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)));
  }

  get vivas() {
    return this.n;
  }

  emitir(e: Emision) {
    if (this.densidad < 1 && Math.random() > this.densidad) return;
    let i: number;
    if (this.n < this.max) i = this.n++;
    else {
      // Llena: reemplaza a la más vieja aproximada (la primera)
      i = Math.floor(Math.random() * this.max);
    }
    this.pos[i * 3] = e.x;
    this.pos[i * 3 + 1] = e.y;
    this.pos[i * 3 + 2] = e.z ?? 0;
    this.vel[i * 3] = e.vx ?? 0;
    this.vel[i * 3 + 1] = e.vy ?? 0;
    this.vel[i * 3 + 2] = e.vz ?? 0;
    this.vida[i] = this.vidaTotal[i] = e.vida;
    this.tam0[i] = e.tam0;
    this.tam1[i] = e.tam1 ?? e.tam0;
    tmp.set(e.color0 as THREE.ColorRepresentation);
    tmp2.set((e.color1 ?? e.color0) as THREE.ColorRepresentation);
    this.c0[i * 3] = tmp.r;
    this.c0[i * 3 + 1] = tmp.g;
    this.c0[i * 3 + 2] = tmp.b;
    this.c1[i * 3] = tmp2.r;
    this.c1[i * 3 + 1] = tmp2.g;
    this.c1[i * 3 + 2] = tmp2.b;
    this.alfa[i] = e.alfa ?? 1;
    this.giro[i] = e.giro ?? 0;
    this.vgiro[i] = e.vgiro ?? 0;
    this.roce[i] = e.roce ?? 0;
    this.grav[i] = e.gravedad ?? 0;
    this.arr[i] = e.arrastre ?? 0;
    this.cuadro[i] = e.cuadro ?? 0;
  }

  /** Avanza todas; `mundo` es la velocidad con la que el mundo corre hacia la izquierda. */
  actualizar(dt: number, mundo = 0) {
    let n = this.n;
    const pos = this.aPos.array as Float32Array, tam = this.aTam.array as Float32Array;
    const tinte = this.aTinte.array as Float32Array, extra = this.aExtra.array as Float32Array;
    for (let i = 0; i < n; ) {
      this.vida[i] -= dt;
      if (this.vida[i] <= 0) {
        // Se cambia por la última (sin huecos)
        n--;
        if (i !== n) this.mover(n, i);
        continue;
      }
      const k = 1 - this.vida[i] / this.vidaTotal[i];
      const freno = 1 - Math.min(1, this.roce[i] * dt);
      this.vel[i * 3] *= freno;
      this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * freno - this.grav[i] * dt;
      this.vel[i * 3 + 2] *= freno;
      this.pos[i * 3] += (this.vel[i * 3] - mundo * this.arr[i]) * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.giro[i] += this.vgiro[i] * dt;
      pos[i * 3] = this.pos[i * 3];
      pos[i * 3 + 1] = this.pos[i * 3 + 1];
      pos[i * 3 + 2] = this.pos[i * 3 + 2];
      tam[i] = this.tam0[i] + (this.tam1[i] - this.tam0[i]) * k;
      tinte[i * 4] = this.c0[i * 3] + (this.c1[i * 3] - this.c0[i * 3]) * k;
      tinte[i * 4 + 1] = this.c0[i * 3 + 1] + (this.c1[i * 3 + 1] - this.c0[i * 3 + 1]) * k;
      tinte[i * 4 + 2] = this.c0[i * 3 + 2] + (this.c1[i * 3 + 2] - this.c0[i * 3 + 2]) * k;
      // Entra rápido y se desvanece al final
      tinte[i * 4 + 3] = this.alfa[i] * Math.min(1, k * 8) * Math.min(1, (1 - k) * 2.2);
      extra[i * 2] = this.cuadro[i];
      extra[i * 2 + 1] = this.giro[i];
      i++;
    }
    this.n = n;
    this.puntos.geometry.setDrawRange(0, n);
    if (n) {
      for (const a of [this.aPos, this.aTam, this.aTinte, this.aExtra]) {
        a.clearUpdateRanges();
        a.addUpdateRange(0, n * a.itemSize);
        a.needsUpdate = true;
      }
    }
  }

  private mover(de: number, a: number) {
    const c = (arr: Float32Array, k: number) => {
      for (let j = 0; j < k; j++) arr[a * k + j] = arr[de * k + j];
    };
    c(this.pos, 3);
    c(this.vel, 3);
    c(this.vida, 1);
    c(this.vidaTotal, 1);
    c(this.tam0, 1);
    c(this.tam1, 1);
    c(this.c0, 3);
    c(this.c1, 3);
    c(this.alfa, 1);
    c(this.giro, 1);
    c(this.vgiro, 1);
    c(this.roce, 1);
    c(this.grav, 1);
    c(this.arr, 1);
    c(this.cuadro, 1);
  }

  /** Borra todas (al revivir o al cambiar de escena). */
  vaciar() {
    this.n = 0;
    this.puntos.geometry.setDrawRange(0, 0);
  }

  liberar() {
    this.puntos.geometry.dispose();
    this.material.dispose();
  }
}
