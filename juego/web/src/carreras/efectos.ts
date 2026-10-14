// Partículas de la carrera (chispas del derrape, fuego del turbo, polvo, nieve, gotas, ceniza y confeti): bolitas de
// felpa en UNA malla con instancias (una sola llamada de dibujo para todas), cada una con su color, tamaño y vida.
import * as THREE from 'three';

interface Particula {
  vivo: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  vida: number;
  total: number;
  tam: number;
  crece: number;
  grav: number;
  color: THREE.Color;
}

export class Efectos {
  malla: THREE.InstancedMesh;
  private ps: Particula[] = [];
  private sig = 0;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private v = new THREE.Vector3();
  private e = new THREE.Vector3();

  constructor(escena: THREE.Scene, private max = 420) {
    const g = new THREE.IcosahedronGeometry(1, 1);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.85, emissive: '#ffffff', emissiveIntensity: 0.0 });
    // Las chispas brillan: el color de cada instancia también va a la emisión
    mat.onBeforeCompile = (s) => {
      s.fragmentShader = s.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance = diffuseColor.rgb * 0.55;');
    };
    this.malla = new THREE.InstancedMesh(g, mat, max);
    this.malla.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.malla.frustumCulled = false;
    this.malla.castShadow = false;
    for (let i = 0; i < max; i++) {
      this.ps.push({ vivo: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, vida: 0, total: 1, tam: 0.1, crece: 0, grav: 0, color: new THREE.Color() });
      this.malla.setColorAt(i, new THREE.Color('#fff'));
      this.m.makeScale(0, 0, 0);
      this.malla.setMatrixAt(i, this.m);
    }
    escena.add(this.malla);
  }

  echar(x: number, y: number, z: number, vx: number, vy: number, vz: number, color: string | THREE.Color, tam: number, vida: number, grav = 0, crece = 0) {
    const p = this.ps[this.sig];
    this.sig = (this.sig + 1) % this.max;
    p.vivo = true;
    p.x = x;
    p.y = y;
    p.z = z;
    p.vx = vx;
    p.vy = vy;
    p.vz = vz;
    p.vida = p.total = vida;
    p.tam = tam;
    p.grav = grav;
    p.crece = crece;
    p.color.set(color as THREE.ColorRepresentation);
  }

  /** Un puñado alrededor de un punto. */
  explosion(x: number, y: number, z: number, colores: string[], n: number, fuerza: number, tam = 0.18, vida = 0.9, grav = 12) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI - Math.PI / 2;
      const f = fuerza * (0.4 + Math.random() * 0.6);
      this.echar(x, y, z, Math.cos(a) * Math.cos(b) * f, Math.abs(Math.sin(b)) * f + fuerza * 0.3, Math.sin(a) * Math.cos(b) * f,
        colores[k % colores.length], tam * (0.6 + Math.random() * 0.8), vida * (0.6 + Math.random() * 0.6), grav);
    }
  }

  actualizar(dt: number) {
    for (let i = 0; i < this.max; i++) {
      const p = this.ps[i];
      if (!p.vivo) continue;
      p.vida -= dt;
      if (p.vida <= 0) {
        p.vivo = false;
        this.m.makeScale(0, 0, 0);
        this.malla.setMatrixAt(i, this.m);
        continue;
      }
      p.vy -= p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      const f = p.vida / p.total;
      const s = p.tam * (p.crece ? 1 + (1 - f) * p.crece : Math.min(1, f * 2.5));
      this.v.set(p.x, p.y, p.z);
      this.e.set(s, s, s);
      this.m.compose(this.v, this.q, this.e);
      this.malla.setMatrixAt(i, this.m);
      this.malla.setColorAt(i, p.color);
    }
    this.malla.instanceMatrix.needsUpdate = true;
    if (this.malla.instanceColor) this.malla.instanceColor.needsUpdate = true;
  }

  limpiar() {
    for (const p of this.ps) p.vivo = false;
    this.actualizar(0);
  }
}
