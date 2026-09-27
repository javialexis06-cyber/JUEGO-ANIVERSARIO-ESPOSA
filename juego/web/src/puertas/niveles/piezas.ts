// Piezas que se repiten entre acertijos: llaves, muebles simples, planos para arrastrar y física de canicas.
import * as THREE from 'three';
import { caja, cilindro, en, esfera, grupo, mat, toro } from '../kit';

/** Plano de la pared del fondo (un poco por delante) para arrastrar cosas colgadas. */
export const planoPared = (z = 0.04) => new THREE.Plane(new THREE.Vector3(0, 0, 1), -z);
/** Plano del piso (o de una mesa a cierta altura). */
export const planoPiso = (y = 0) => new THREE.Plane(new THREE.Vector3(0, 1, 0), -y);

/** Caja límite para arrastrar (min y max en el mundo). */
export const limites = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) =>
  new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1));

/** Llave dorada (acostada: plana sobre XZ; de pie: en XY). */
export function llave(nombre = 'llave', color = '#f2c75c', acostada = true) {
  const g = grupo(nombre);
  const m = mat(color, { rough: 0.3, metal: 0.75 });
  const aro = toro(0.05, 0.016, m);
  en(aro, -0.07, 0, 0);
  const cana = caja(0.14, 0.022, 0.022, m, 0.008);
  en(cana, 0.04, 0, 0);
  const d1 = caja(0.02, 0.04, 0.02, m, 0.006);
  en(d1, 0.09, -0.025, 0);
  const d2 = caja(0.02, 0.028, 0.02, m, 0.006);
  en(d2, 0.06, -0.02, 0);
  g.add(aro, cana, d1, d2);
  if (acostada) g.rotation.x = -Math.PI / 2;
  // Área de toque más grande que la llave (es chiquita)
  const toque = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  toque.name = `${nombre} toque`;
  g.add(toque);
  return g;
}

/** Sofá de dos puestos. */
export function sofa(color = '#9ccbef', nombre = 'sofa') {
  const g = grupo(nombre);
  const m = mat(color);
  g.add(en(caja(2.0, 0.42, 0.85, m, 0.12), 0, 0.33, 0));
  g.add(en(caja(2.0, 0.7, 0.26, m, 0.12), 0, 0.72, -0.34));
  for (const s of [-1, 1]) g.add(en(caja(0.26, 0.6, 0.85, m, 0.12), s * 1.0, 0.44, 0));
  for (const x of [-0.8, 0.8]) for (const z of [-0.32, 0.32]) g.add(en(cilindro(0.04, 0.03, 0.12, mat('#8a5e40')), x, 0.06, z));
  return g;
}

/** Mesita o repisa de madera. */
export function mesa(ancho: number, fondo: number, alto: number, color = '#c49468', nombre = 'mesa') {
  const g = grupo(nombre);
  const m = mat(color);
  g.add(en(caja(ancho, 0.06, fondo, m, 0.02), 0, alto - 0.03, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(en(caja(0.06, alto - 0.06, 0.06, m, 0.015), sx * (ancho / 2 - 0.06), (alto - 0.06) / 2, sz * (fondo / 2 - 0.06)));
  return g;
}

/** Lámpara de mesa con pantalla de color (la pantalla se puede encender). */
export function lamparita(color: string, nombre: string) {
  const g = grupo(nombre);
  g.add(en(cilindro(0.08, 0.1, 0.05, mat('#fff8ee')), 0, 0.025, 0));
  g.add(en(cilindro(0.015, 0.015, 0.3, mat('#d9b25a', { metal: 0.6, rough: 0.3 })), 0, 0.2, 0));
  const pantalla = cilindro(0.09, 0.15, 0.2, new THREE.MeshStandardMaterial({ color, roughness: 0.7, emissive: color, emissiveIntensity: 0 }), `${nombre} pantalla`);
  en(pantalla, 0, 0.42, 0);
  g.add(pantalla);
  const luz = new THREE.PointLight(color, 0, 1.6, 2);
  en(luz, 0, 0.4, 0.1);
  g.add(luz);
  g.userData.prender = (si: boolean) => {
    (pantalla.material as THREE.MeshStandardMaterial).emissiveIntensity = si ? 1.4 : 0;
    luz.intensity = si ? 1.4 : 0;
  };
  return g;
}

/** Canica que rueda dentro de un tablero con repisas (física 2D sencilla). */
export interface Tabla {
  w: number;
  h: number;
  /** Rectángulos sólidos [x0, y0, x1, y1] en coordenadas del tablero (0,0 abajo a la izquierda). */
  solidos: [number, number, number, number][];
}

export class Canica {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  constructor(public tabla: Tabla, x: number, y: number, public r = 0.035) {
    this.x = x;
    this.y = y;
  }

  /** Avanza con la gravedad (ax, ay) del tablero. */
  paso(dt: number, ax: number, ay: number) {
    const sub = 4;
    const h = dt / sub;
    for (let i = 0; i < sub; i++) {
      this.vx += ax * h;
      this.vy += ay * h;
      this.vx *= 0.995;
      this.vy *= 0.995;
      this.x += this.vx * h;
      this.y += this.vy * h;
      this.chocar();
    }
  }

  private chocar() {
    const { w, h } = this.tabla;
    const r = this.r;
    if (this.x < r) (this.x = r), (this.vx = Math.abs(this.vx) * 0.3);
    if (this.x > w - r) (this.x = w - r), (this.vx = -Math.abs(this.vx) * 0.3);
    if (this.y < r) (this.y = r), (this.vy = Math.abs(this.vy) * 0.3);
    if (this.y > h - r) (this.y = h - r), (this.vy = -Math.abs(this.vy) * 0.3);
    for (const [x0, y0, x1, y1] of this.tabla.solidos) {
      const cx = Math.max(x0, Math.min(this.x, x1)), cy = Math.max(y0, Math.min(this.y, y1));
      const dx = this.x - cx, dy = this.y - cy;
      const d = Math.hypot(dx, dy);
      if (d >= r || d === 0) continue;
      const nx = dx / d, ny = dy / d;
      this.x = cx + nx * r;
      this.y = cy + ny * r;
      const vn = this.vx * nx + this.vy * ny;
      if (vn < 0) {
        this.vx -= 1.3 * vn * nx;
        this.vy -= 1.3 * vn * ny;
      }
    }
  }
}

/** Bolita brillante para marcar algo que se puede tocar (se ve solo de cerca). */
export function brillo(color = '#fff6d8') {
  return esfera(0.02, new THREE.MeshBasicMaterial({ color }));
}
