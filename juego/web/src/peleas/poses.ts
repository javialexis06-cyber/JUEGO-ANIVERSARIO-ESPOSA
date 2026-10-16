// Poses del Torneo horneadas desde personajes/blender/peleas_poses.py.
// La biblioteca es común a ambos cuerpos; no modifica las animaciones de la casa ni de granja.
import biblioteca from './poses-blender.json';
import * as THREE from 'three';

export type Hueso = 'pelvis' | 'torso' | 'cabeza' | 'brazo.L' | 'brazo.R' | 'mano.L' | 'mano.R' | 'pierna.L' | 'pierna.R' | 'pie.L' | 'pie.R';
export const HUESOS: Hueso[] = ['pelvis', 'torso', 'cabeza', 'brazo.L', 'brazo.R', 'mano.L', 'mano.R', 'pierna.L', 'pierna.R', 'pie.L', 'pie.R'];
type V3 = [number, number, number];
export interface PoseDef {
  huesos: Partial<Record<Hueso, V3>>;
  /** Sube o baja el cuerpo (metros) y lo inclina hacia adelante (grados, todo el muñeco). */
  y?: number;
  incl?: number;
  /** Estira huesos a lo largo (brazos y piernas de caricatura en los golpes). */
  estira?: Partial<Record<Hueso, number>>;
}

const RAD = Math.PI / 180;
const REPOSO_BRAZO = new THREE.Vector3(Math.sin(34 * RAD), 0.08, -Math.cos(34 * RAD)).normalize();
const E = new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1);
const ET = E.clone().transpose();

/** Rotación (grados XYZ de Blender) que apunta el brazo hacia (afuera, adelante, arriba), en el marco del torso. */
export function brazo(lado: 'L' | 'R', afuera: number, adelante: number, arriba: number): V3 {
  const sx = lado === 'L' ? -1 : 1;
  const reposo = new THREE.Vector3(sx * REPOSO_BRAZO.x, REPOSO_BRAZO.y, REPOSO_BRAZO.z);
  const meta = new THREE.Vector3(sx * afuera, -adelante, arriba).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(reposo, meta);
  const m = ET.clone().multiply(new THREE.Matrix4().makeRotationFromQuaternion(q)).multiply(E);
  const e = new THREE.Euler().setFromRotationMatrix(m, 'ZYX');
  return [e.x / RAD, e.y / RAD, e.z / RAD];
}

interface PoseExportada { q: Record<string, number[]>; y: number; estira: Record<string, number> }
export const POSES = biblioteca as Record<string, PoseExportada>;
export interface PoseQ {
  q: Map<Hueso, THREE.Quaternion>;
  y: number;
  estira: Map<Hueso, number>;
}
const cache = new Map<string, PoseQ>();
const pruebas = new Map<string, PoseExportada>();
const otroLado = (h: Hueso) => (h.endsWith('.L') ? h.slice(0, -2) + '.R' : h.endsWith('.R') ? h.slice(0, -2) + '.L' : h) as Hueso;

/** Huesos completos y sus espejos, sin recalcular Euler en cada cuadro. */
export function poseQ(nombre: string, espejado: boolean): PoseQ {
  const clave = `${nombre}|${espejado ? 1 : 0}`;
  let p = cache.get(clave);
  if (!p) {
    const base = pruebas.get(nombre) ?? POSES[nombre] ?? POSES.neutra;
    const q = new Map<Hueso, THREE.Quaternion>(HUESOS.map(h => [h, new THREE.Quaternion()]));
    for (const [h, v] of Object.entries(base.q)) {
      const lado = espejado ? otroLado(h as Hueso) : h as Hueso;
      q.set(lado, new THREE.Quaternion(v[0], espejado ? -v[1] : v[1], espejado ? -v[2] : v[2], v[3]).normalize());
    }
    const estira = new Map<Hueso, number>(HUESOS.map(h => [h, 1]));
    for (const [h, k] of Object.entries(base.estira)) estira.set(espejado ? otroLado(h as Hueso) : h as Hueso, k);
    p = { q, y: base.y, estira };
    cache.set(clave, p);
  }
  return p;
}

/** Ajuste visual de prueba: el recurso publicado sigue proviniendo de Blender. */
export function probarPose(nombre: string, def: PoseDef) {
  const q: Record<string, number[]> = {};
  for (const [h, v] of Object.entries(def.huesos)) if (v) q[h] = new THREE.Quaternion().setFromEuler(new THREE.Euler(v[0] * RAD, v[1] * RAD, v[2] * RAD, 'ZYX')).toArray();
  pruebas.set(nombre, { q, y: def.y ?? 0, estira: def.estira ?? {} });
  cache.clear();
}
