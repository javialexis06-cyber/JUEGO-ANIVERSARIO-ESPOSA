// Para que se lea de un vistazo en pleno vuelo: todo lo que hace perder lleva el borde encendido en ROJO y un aura
// roja alrededor, y todo lo bueno (rollitos y poderes) brilla en DORADO. Hecho para que rinda en el celular: el borde
// va dentro del mismo material (sin dibujar nada dos veces) y las auras de todos se pintan de una sola vez.
import * as THREE from 'three';

export const ROJO_PELIGRO = '#FF2A1F';
export const DORADO = '#FFC83A';

/**
 * Copias de los materiales con el borde encendido (fresnel en el emisivo, con un pulso que late). Una sola copia por
 * material original, así los obstáculos que se repiten comparten todo.
 */
export class Borde {
  private copias = new Map<THREE.Material, THREE.Material>();
  private uColor: { value: THREE.Color };
  private uFuerza = { value: 1 };

  constructor(color: string, private fuerza: number, private potencia: number, private clave: string) {
    this.uColor = { value: new THREE.Color(color) };
  }

  /** El mismo material con el borde (si no se puede, el original). */
  material(m: THREE.Material): THREE.Material {
    const ya = this.copias.get(m);
    if (ya) return ya;
    const std = m as THREE.MeshStandardMaterial;
    if (!('emissive' in std)) {
      this.copias.set(m, m);
      return m;
    }
    const c = std.clone();
    const potencia = this.potencia.toFixed(2);
    c.onBeforeCompile = (sh) => {
      sh.uniforms.uBordeColor = this.uColor;
      sh.uniforms.uBordeFuerza = this.uFuerza;
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uBordeColor;\nuniform float uBordeFuerza;')
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
          float bordeK = 1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0);
          totalEmissiveRadiance += uBordeColor * (pow(bordeK, ${potencia}) * uBordeFuerza);`,
        );
    };
    c.customProgramCacheKey = () => `borde-${this.clave}`;
    this.copias.set(m, c);
    return c;
  }

  /** Le pone el borde a todas las mallas de un objeto. */
  aplicar(o: THREE.Object3D) {
    o.traverse((x) => {
      const m = x as THREE.Mesh;
      if (!m.isMesh || m.userData.sinBorde) return;
      m.material = Array.isArray(m.material) ? m.material.map((mt) => this.material(mt)) : this.material(m.material);
    });
  }

  /** El latido del borde (uno solo para todos). */
  latir(t: number) {
    this.uFuerza.value = this.fuerza * (0.8 + 0.2 * Math.sin(t * 6.5));
  }

  liberar() {
    for (const [o, c] of this.copias) if (o !== c) c.dispose();
    this.copias.clear();
  }
}

/**
 * Aura suave: el brillo más fuerte queda justo en el borde del objeto (al 55 % del cuadro) y se apaga hacia afuera; el
 * centro lo tapa el mismo objeto, así se ve como luz que le sale del borde.
 */
function texturaAura(borde: boolean) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  if (borde) {
    gr.addColorStop(0, 'rgba(255,255,255,0.45)');
    gr.addColorStop(0.4, 'rgba(255,255,255,0.7)');
    gr.addColorStop(0.55, 'rgba(255,255,255,1)');
    gr.addColorStop(0.66, 'rgba(255,255,255,0.62)');
    gr.addColorStop(0.82, 'rgba(255,255,255,0.18)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
  } else {
    gr.addColorStop(0, 'rgba(255,255,255,0.9)');
    gr.addColorStop(0.35, 'rgba(255,255,255,0.5)');
    gr.addColorStop(0.7, 'rgba(255,255,255,0.12)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
  }
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Qué tan grande va el cuadro del aura para que el brillo caiga en un borde de radio `r`. */
export const ladoAura = (r: number) => r / 0.55 * 2;

/** Muchas auras dibujadas de una sola vez (instancias): se llenan cada cuadro con `poner`. */
export class Auras {
  readonly malla: THREE.InstancedMesh;
  private mat: THREE.MeshBasicMaterial;
  private tex: THREE.Texture;
  private n = 0;
  private dummy = new THREE.Object3D();

  constructor(color: string, max: number, opciones: { borde: boolean; aditiva: boolean; opacidad: number }) {
    this.tex = texturaAura(opciones.borde);
    this.mat = new THREE.MeshBasicMaterial({
      map: this.tex,
      color,
      transparent: true,
      opacity: opciones.opacidad,
      depthWrite: false,
      toneMapped: false,
      blending: opciones.aditiva ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.malla = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), this.mat, max);
    this.malla.count = 0;
    this.malla.frustumCulled = false;
    this.malla.renderOrder = 2;
    this.malla.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }

  empezar() {
    this.n = 0;
  }

  /** Un aura en (x, y, z) de ancho `ax` y alto `ay`, girada `rot`. */
  poner(x: number, y: number, z: number, ax: number, ay: number, rot = 0) {
    if (this.n >= this.malla.instanceMatrix.count) return;
    const d = this.dummy;
    d.position.set(x, y, z);
    d.rotation.set(0, 0, rot);
    d.scale.set(ax, ay, 1);
    d.updateMatrix();
    this.malla.setMatrixAt(this.n++, d.matrix);
  }

  terminar(opacidad?: number) {
    this.malla.count = this.n;
    this.malla.instanceMatrix.needsUpdate = true;
    if (opacidad !== undefined) this.mat.opacity = opacidad;
  }

  liberar() {
    this.malla.geometry.dispose();
    this.mat.dispose();
    this.tex.dispose();
    this.malla.dispose();
  }
}
