// Ayudantes para armar geometría por código (los modelos de reemplazo): cajas redondeadas, bolas, cápsulas,
// cilindros y conos ya movidos y girados, y una paleta de materiales de «arcilla oscura».
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { texturaRelieve } from '../../recursos';

export interface Tf {
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  sx?: number;
  sy?: number;
  sz?: number;
}

export function tf<G extends THREE.BufferGeometry>(g: G, t: Tf = {}): G {
  if (t.sx !== undefined || t.sy !== undefined || t.sz !== undefined) g.scale(t.sx ?? 1, t.sy ?? 1, t.sz ?? 1);
  if (t.rx) g.rotateX(t.rx);
  if (t.ry) g.rotateY(t.ry);
  if (t.rz) g.rotateZ(t.rz);
  g.translate(t.x ?? 0, t.y ?? 0, t.z ?? 0);
  return g;
}

export const caja = (w: number, h: number, d: number, r: number, t?: Tf) => tf(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3)), t);
export const bola = (r: number, t?: Tf, seg = 12) => tf(new THREE.SphereGeometry(r, seg, Math.max(6, Math.round(seg * 0.75))), t);
export const capsula = (r: number, l: number, t?: Tf, seg = 8) => tf(new THREE.CapsuleGeometry(r, l, 3, seg), t);
export const cil = (rt: number, rb: number, h: number, t?: Tf, seg = 10) => tf(new THREE.CylinderGeometry(rt, rb, h, seg), t);
export const cono = (r: number, h: number, t?: Tf, seg = 8) => tf(new THREE.ConeGeometry(r, h, seg), t);
export const toro = (r: number, tubo: number, t?: Tf, arco = Math.PI * 2) => tf(new THREE.TorusGeometry(r, tubo, 6, 14, arco), t);

/** Una extremidad entre dos puntos (cápsula orientada). */
export function hueso(a: THREE.Vector3Like, b: THREE.Vector3Like, r: number): THREE.BufferGeometry {
  const A = new THREE.Vector3(a.x, a.y, a.z), B = new THREE.Vector3(b.x, b.y, b.z);
  const d = new THREE.Vector3().subVectors(B, A);
  const l = d.length();
  const g = new THREE.CapsuleGeometry(r, Math.max(0.001, l), 3, 7);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  g.applyQuaternion(q);
  const m = A.add(B).multiplyScalar(0.5);
  g.translate(m.x, m.y, m.z);
  return g;
}

// ------------------------------------------------------------------------------------------------- Materiales
const cache = new Map<string, THREE.MeshStandardMaterial>();

/** Material de arcilla/fieltro oscuro. `e` = color de brillo propio (ojos, cristales). */
export function mat(color: string, o: { rug?: number; met?: number; e?: string; ei?: number; relieve?: number; transp?: number } = {}): THREE.MeshStandardMaterial {
  const clave = `${color}|${o.rug ?? ''}|${o.met ?? ''}|${o.e ?? ''}|${o.ei ?? ''}|${o.relieve ?? ''}|${o.transp ?? ''}`;
  let m = cache.get(clave);
  if (m) return m;
  m = new THREE.MeshStandardMaterial({
    color, roughness: o.rug ?? 0.86, metalness: o.met ?? 0,
    emissive: o.e ? new THREE.Color(o.e) : new THREE.Color(0), emissiveIntensity: o.ei ?? (o.e ? 2.2 : 0),
  });
  const rel = o.relieve ?? 0.35;
  if (rel > 0) {
    m.normalMap = texturaRelieve();
    m.normalScale = new THREE.Vector2(rel, rel);
  }
  if (o.transp) {
    m.transparent = true;
    m.opacity = o.transp;
    m.depthWrite = false;
  }
  m.name = clave;
  cache.set(clave, m);
  return m;
}

/** Junta varias geometrías en una sola (para piezas con varias partes del mismo material). */
export { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
