// Las poses de pelea: los muñecos traen poses de la casa (reposo, celebrar, tirado…) pero no de pelea, así que aquí se
// arman encima del esqueleto, hueso por hueso, con la misma convención que personajes/blender/poses.py (grados XYZ de
// Blender en el espacio de cada hueso; brazos y piernas: X negativo = hacia adelante; torso y cabeza: X positivo =
// hacia adelante). `brazo()` es la misma ayuda de poses.py: apunta el brazo en el marco del torso.
// «.L» es la derecha del muñeco cuando mira a la cámara: en la pelea es el brazo del lado de la cámara (el que se ve),
// así que golpea con ese; mirando a la izquierda se usa la pose en espejo.
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

const B = brazo;
const GL = B('L', 0.28, 0.85, 0.42);
const GR = B('R', 0.12, 0.92, 0.3);
const PIERNAS_GUARDIA = { 'pierna.L': [-20, 0, -7] as V3, 'pierna.R': [18, 0, 8] as V3, 'pie.L': [10, 0, 0] as V3, 'pie.R': [-10, 0, 0] as V3 };
const AGACHADO = { 'pierna.L': [-62, 0, -26] as V3, 'pierna.R': [-48, 0, 28] as V3, 'pie.L': [52, 0, 0] as V3, 'pie.R': [44, 0, 0] as V3 };

export const POSES: Record<string, PoseDef> = {
  neutra: { huesos: {} },
  guardia: { huesos: { torso: [10, 0, 0], cabeza: [-6, 0, 0], 'brazo.L': GL, 'brazo.R': GR, ...PIERNAS_GUARDIA }, y: -0.03 },
  guardia_b: { huesos: { torso: [14, 0, 2], cabeza: [-4, 0, -2], 'brazo.L': B('L', 0.3, 0.85, 0.32), 'brazo.R': B('R', 0.14, 0.92, 0.2), ...PIERNAS_GUARDIA }, y: -0.06 },
  caminar_a: { huesos: { torso: [12, 0, 0], cabeza: [-6, 0, 0], 'brazo.L': GL, 'brazo.R': GR, 'pierna.L': [-34, 0, -4], 'pierna.R': [26, 0, 4], 'pie.L': [16, 0, 0] } },
  caminar_b: { huesos: { torso: [12, 0, 0], cabeza: [-6, 0, 0], 'brazo.L': GL, 'brazo.R': GR, 'pierna.L': [24, 0, -4], 'pierna.R': [-32, 0, 4], 'pie.R': [16, 0, 0] }, y: 0.03 },
  agachado: { huesos: { torso: [26, 0, 0], cabeza: [-20, 0, 0], 'brazo.L': B('L', 0.3, 0.9, 0.2), 'brazo.R': B('R', 0.2, 0.9, 0.1), ...AGACHADO }, y: -0.24 },
  tapar: { huesos: { torso: [-6, 0, 0], cabeza: [16, 0, 0], 'brazo.L': B('L', -0.3, 0.85, 0.55), 'brazo.R': B('R', -0.3, 0.85, 0.48), ...PIERNAS_GUARDIA }, y: -0.04 },
  tapar_bajo: { huesos: { torso: [22, 0, 0], cabeza: [0, 0, 0], 'brazo.L': B('L', -0.3, 0.9, 0.3), 'brazo.R': B('R', -0.3, 0.9, 0.25), ...AGACHADO }, y: -0.24 },
  jab_carga: { huesos: { torso: [10, 12, 0], cabeza: [-6, -8, 0], 'brazo.L': B('L', 0.35, 0.35, 0.25), 'brazo.R': GR, ...PIERNAS_GUARDIA } },
  jab: { huesos: { torso: [14, -24, 0], cabeza: [-8, 18, 0], 'brazo.L': B('L', 0.0, 1, 0.14), 'brazo.R': B('R', 0.2, 0.7, 0.35), 'pierna.L': [-28, 0, -6], 'pierna.R': [24, 0, 8] }, y: -0.03 , estira: { 'brazo.L': 1.55 } },
  cruzado_carga: { huesos: { torso: [12, -14, 0], cabeza: [-6, 10, 0], 'brazo.L': GL, 'brazo.R': B('R', 0.4, 0.3, 0.2), ...PIERNAS_GUARDIA } },
  cruzado: { huesos: { torso: [16, 26, 0], cabeza: [-8, -16, 0], 'brazo.L': B('L', 0.3, 0.6, 0.4), 'brazo.R': B('R', -0.05, 1, 0.14), 'pierna.L': [-30, 0, -6], 'pierna.R': [26, 0, 8] }, y: -0.04 , estira: { 'brazo.R': 1.55 } },
  patada_carga: { huesos: { torso: [-4, 0, 0], cabeza: [-4, 0, 0], 'brazo.L': B('L', 0.6, 0.4, 0.3), 'brazo.R': B('R', 0.5, 0.5, 0.35), 'pierna.L': [-60, 0, -4], 'pie.L': [50, 0, 0], 'pierna.R': [6, 0, 6] }, y: 0.02 },
  patada: { huesos: { torso: [-20, 0, 6], cabeza: [12, 0, -6], 'brazo.L': B('L', 0.95, -0.25, 0.25), 'brazo.R': B('R', 0.9, 0.35, 0.35), 'pierna.L': [-105, 0, -8], 'pie.L': [25, 0, 0], 'pierna.R': [8, 0, 10] }, y: 0.04 , estira: { 'pierna.L': 1.45 } },
  fuerte_carga: { huesos: { torso: [-2, 34, 0], cabeza: [-8, -22, 0], 'brazo.L': B('L', 0.45, -0.75, 0.35), 'brazo.R': B('R', 0.2, 0.8, 0.3), 'pierna.L': [-12, 0, -6], 'pierna.R': [24, 0, 8] }, y: -0.04 },
  fuerte: { huesos: { torso: [24, -38, 0], cabeza: [-12, 22, 0], 'brazo.L': B('L', -0.08, 1, 0.22), 'brazo.R': B('R', 0.5, -0.3, 0.1), 'pierna.L': [-40, 0, -6], 'pierna.R': [34, 0, 8], 'pie.R': [-14, 0, 0] }, y: -0.07 , estira: { 'brazo.L': 1.75 } },
  barrida_carga: { huesos: { torso: [30, 0, 0], cabeza: [-18, 0, 0], 'brazo.L': B('L', 0.4, 0.5, -0.3), 'brazo.R': B('R', 0.4, 0.4, -0.3), ...AGACHADO }, y: -0.26 },
  barrida: { huesos: { torso: [16, 0, 22], cabeza: [-14, 0, -14], 'brazo.L': B('L', 0.7, 0.2, -0.6), 'brazo.R': B('R', 0.8, 0.1, -0.5), 'pierna.L': [-88, 0, -22], 'pie.L': [20, 0, 0], 'pierna.R': [-36, 0, 42], 'pie.R': [40, 0, 0] }, y: -0.32 , estira: { 'pierna.L': 1.5 } },
  gancho_carga: { huesos: { torso: [28, 0, 0], cabeza: [-14, 0, 0], 'brazo.L': B('L', 0.3, 0.6, -0.6), 'brazo.R': GR, ...AGACHADO }, y: -0.18 },
  gancho: { huesos: { torso: [-20, -22, 0], cabeza: [-22, 10, 0], 'brazo.L': B('L', 0.05, 0.3, 1), 'brazo.R': B('R', 0.6, 0.2, -0.4), 'pierna.L': [-22, 0, 0], 'pierna.R': [26, 0, 0], 'pie.R': [-20, 0, 0] }, y: 0.14 , estira: { 'brazo.L': 1.6 } },
  aire: { huesos: { torso: [-6, 0, 0], cabeza: [-10, 0, 0], 'brazo.L': B('L', 0.5, 0.6, 0.45), 'brazo.R': B('R', 0.5, 0.6, 0.35), 'pierna.L': [-55, 0, -8], 'pierna.R': [-35, 0, 8], 'pie.L': [45, 0, 0], 'pie.R': [40, 0, 0] } },
  aereo: { huesos: { torso: [-12, 0, 0], cabeza: [6, 0, 0], 'brazo.L': B('L', 0.85, -0.2, 0.45), 'brazo.R': B('R', 0.75, 0.25, 0.5), 'pierna.L': [-85, 0, -5], 'pie.L': [20, 0, 0], 'pierna.R': [-60, 0, 12], 'pie.R': [65, 0, 0] } , estira: { 'pierna.L': 1.45 } },
  aereo_fuerte_carga: { huesos: { torso: [-18, 0, 0], cabeza: [-16, 0, 0], 'brazo.L': B('L', 0.3, 0.3, 0.95), 'brazo.R': B('R', 0.3, 0.3, 0.9), 'pierna.L': [-50, 0, -8], 'pierna.R': [-40, 0, 8], 'pie.L': [45, 0, 0], 'pie.R': [40, 0, 0] } },
  aereo_fuerte: { huesos: { torso: [34, 0, 0], cabeza: [-20, 0, 0], 'brazo.L': B('L', 0.1, 0.9, -0.35), 'brazo.R': B('R', 0.1, 0.9, -0.35), 'pierna.L': [-55, 0, -8], 'pierna.R': [-45, 0, 8], 'pie.L': [45, 0, 0], 'pie.R': [40, 0, 0] } , estira: { 'brazo.L': 1.4, 'brazo.R': 1.4 } },
  agarrar_carga: { huesos: { torso: [8, 0, 0], cabeza: [-8, 0, 0], 'brazo.L': B('L', 0.95, 0.55, 0.25), 'brazo.R': B('R', 0.95, 0.55, 0.25), ...PIERNAS_GUARDIA } },
  agarrar: { huesos: { torso: [20, 0, 0], cabeza: [-12, 0, 0], 'brazo.L': B('L', 0.12, 1, 0.08), 'brazo.R': B('R', 0.12, 1, 0.08), 'pierna.L': [-30, 0, -6], 'pierna.R': [26, 0, 8] }, y: -0.04 , estira: { 'brazo.L': 1.45, 'brazo.R': 1.45 } },
  lanzar_agarre: { huesos: { torso: [10, -55, 0], cabeza: [-10, 30, 0], 'brazo.L': B('L', 0.9, 0.5, 0.5), 'brazo.R': B('R', 0.2, 1, 0.6), 'pierna.L': [-30, 0, -10], 'pierna.R': [30, 0, 10] } },
  lanzar_carga: { huesos: { torso: [-12, 0, 0], cabeza: [-8, 0, 0], 'brazo.L': B('L', 0.45, -0.75, 0.3), 'brazo.R': B('R', 0.45, -0.75, 0.3), 'pierna.L': [-10, 0, -6], 'pierna.R': [20, 0, 8] } },
  lanzar: { huesos: { torso: [22, 0, 0], cabeza: [-16, 0, 0], 'brazo.L': B('L', -0.08, 1, 0.12), 'brazo.R': B('R', -0.08, 1, 0.12), 'pierna.L': [-34, 0, -8], 'pierna.R': [28, 0, 8] }, y: -0.06 , estira: { 'brazo.L': 1.45, 'brazo.R': 1.45 } },
  embestida_carga: { huesos: { torso: [34, 0, 0], cabeza: [-24, 0, 0], 'brazo.L': B('L', 0.5, -0.6, -0.2), 'brazo.R': B('R', 0.5, -0.6, -0.2), ...AGACHADO }, y: -0.14 },
  embestida: { huesos: { torso: [38, -26, 0], cabeza: [-26, 12, 0], 'brazo.L': B('L', 0.15, 0.95, 0.15), 'brazo.R': B('R', 0.6, -0.6, -0.1), 'pierna.L': [-50, 0, -6], 'pierna.R': [38, 0, 8], 'pie.R': [-20, 0, 0] }, y: -0.08 , estira: { 'brazo.L': 1.35 } },
  preparar: { huesos: { torso: [30, 0, 0], cabeza: [-18, 0, 0], 'brazo.L': B('L', 0.4, -0.7, -0.3), 'brazo.R': B('R', 0.4, -0.7, -0.3), ...AGACHADO }, y: -0.2 },
  voladora: { huesos: { torso: [-24, 0, 0], cabeza: [10, 0, 0], 'brazo.L': B('L', 0.7, -0.6, 0.35), 'brazo.R': B('R', 0.7, -0.6, 0.4), 'pierna.L': [-100, 0, -8], 'pie.L': [20, 0, 0], 'pierna.R': [-45, 0, 10], 'pie.R': [60, 0, 0] } , estira: { 'pierna.L': 1.5 } },
  contra: { huesos: { torso: [-6, 18, 0], cabeza: [-4, -10, 0], 'brazo.L': B('L', 0.1, 0.8, 0.7), 'brazo.R': B('R', 0.45, 0.45, -0.25), 'pierna.L': [-16, 0, -6], 'pierna.R': [16, 0, 8] }, y: -0.02 },
  contraataque: { huesos: { torso: [18, -28, 0], cabeza: [-10, 16, 0], 'brazo.L': B('L', 0.0, 1, 0.32), 'brazo.R': B('R', 0.5, -0.2, 0.0), 'pierna.L': [-34, 0, -6], 'pierna.R': [30, 0, 8] }, y: -0.04 , estira: { 'brazo.L': 1.6 } },
  niebla: { huesos: { torso: [26, 0, 0], cabeza: [-10, 0, 0], 'brazo.L': B('L', -0.45, 0.8, 0.35), 'brazo.R': B('R', -0.45, 0.8, 0.3), ...AGACHADO }, y: -0.14 },
  poner_carga: { huesos: { torso: [20, 0, 0], cabeza: [-10, 0, 0], 'brazo.L': B('L', 0.3, 0.2, 0.6), 'brazo.R': GR, ...PIERNAS_GUARDIA } },
  poner: { huesos: { torso: [38, 0, 0], cabeza: [-20, 0, 0], 'brazo.L': B('L', 0.15, 0.9, -0.5), 'brazo.R': B('R', 0.4, 0.3, -0.3), ...AGACHADO }, y: -0.16 , estira: { 'brazo.L': 1.3 } },
  cuerda_carga: { huesos: { torso: [-8, 14, 0], cabeza: [-10, -6, 0], 'brazo.L': B('L', 0.35, 0.1, 1), 'brazo.R': GR, ...PIERNAS_GUARDIA } },
  aliento_carga: { huesos: { torso: [-18, 0, 0], cabeza: [-26, 0, 0], 'brazo.L': B('L', 0.7, -0.4, 0.2), 'brazo.R': B('R', 0.7, -0.4, 0.2), ...PIERNAS_GUARDIA } },
  aliento: { huesos: { torso: [22, 0, 0], cabeza: [12, 0, 0], 'brazo.L': B('L', 0.8, -0.5, -0.1), 'brazo.R': B('R', 0.8, -0.5, -0.1), 'pierna.L': [-30, 0, -6], 'pierna.R': [26, 0, 8] }, y: -0.04 },
  super_carga: { huesos: { torso: [-10, 0, 0], cabeza: [-18, 0, 0], 'brazo.L': B('L', 0.85, 0.2, -0.55), 'brazo.R': B('R', 0.85, 0.2, -0.55), 'pierna.L': [0, 0, -14], 'pierna.R': [0, 0, 14] }, y: -0.06 },
  rayo: { huesos: { torso: [16, 0, 0], cabeza: [-12, 0, 0], 'brazo.L': B('L', -0.1, 1, 0.2), 'brazo.R': B('R', -0.1, 1, 0.16), 'pierna.L': [-38, 0, -10], 'pierna.R': [32, 0, 10] }, y: -0.08 , estira: { 'brazo.L': 1.4, 'brazo.R': 1.4 } },
  invocar: { huesos: { torso: [-14, 0, 0], cabeza: [-26, 0, 0], 'brazo.L': B('L', 0.75, 0.2, 0.75), 'brazo.R': B('R', 0.75, 0.2, 0.75), 'pierna.L': [0, 0, -10], 'pierna.R': [0, 0, 10] } },
  pisoton: { huesos: { torso: [28, 0, 0], cabeza: [-16, 0, 0], 'brazo.L': B('L', 0.85, 0, 0.45), 'brazo.R': B('R', 0.85, 0, 0.45), ...AGACHADO }, y: -0.18 },
  golpeado_alto: { huesos: { torso: [-24, 0, 6], cabeza: [-28, 0, 12], 'brazo.L': B('L', 0.85, -0.45, 0.3), 'brazo.R': B('R', 0.8, -0.35, 0.2), 'pierna.L': [-16, 0, -6], 'pierna.R': [10, 0, 8] } },
  golpeado_bajo: { huesos: { torso: [36, 0, 0], cabeza: [12, 0, 0], 'brazo.L': B('L', 0.4, 0.6, -0.4), 'brazo.R': B('R', 0.4, 0.6, -0.4), 'pierna.L': [-12, 0, -6], 'pierna.R': [12, 0, 6] }, y: -0.08 },
  volando: { huesos: { torso: [-30, 0, 0], cabeza: [-30, 0, 0], 'brazo.L': B('L', 0.9, -0.45, 0.5), 'brazo.R': B('R', 0.9, -0.4, 0.45), 'pierna.L': [-42, 0, -26], 'pierna.R': [-18, 0, 26] } },
  tumbado: { huesos: { cabeza: [-10, 0, 0], 'brazo.L': B('L', 0.95, 0, 0.3), 'brazo.R': B('R', 0.95, 0, 0.2), 'pierna.L': [0, 0, -18], 'pierna.R': [0, 0, 18] } },
  mareado: { huesos: { torso: [-4, 0, 10], cabeza: [-12, 0, 16], 'brazo.L': B('L', 0.4, 0.15, -0.9), 'brazo.R': B('R', 0.4, 0.15, -0.9), 'pierna.L': [0, 0, -10], 'pierna.R': [0, 0, 12] }, y: -0.05 },
};

/** La misma pose reflejada (izquierda ↔ derecha): se cambian los lados y se invierten Y y Z. */
function espejo(p: PoseDef): PoseDef {
  const h: Partial<Record<Hueso, V3>> = {};
  for (const [k, v] of Object.entries(p.huesos) as [Hueso, V3][]) {
    const o = (k.endsWith('.L') ? k.slice(0, -2) + '.R' : k.endsWith('.R') ? k.slice(0, -2) + '.L' : k) as Hueso;
    h[o] = [v[0], -v[1], -v[2]];
  }
  return { ...p, huesos: h };
}

export interface PoseQ {
  q: Map<Hueso, THREE.Quaternion>;
  y: number;
  estira: Map<Hueso, number>;
}
const cache = new Map<string, PoseQ>();
const IDENT = new THREE.Quaternion();

/** La pose en cuaterniones (con su espejo si mira a la izquierda). */
export function poseQ(nombre: string, espejado: boolean): PoseQ {
  const clave = `${nombre}|${espejado ? 1 : 0}`;
  let p = cache.get(clave);
  if (!p) {
    const base = POSES[nombre] ?? POSES.neutra;
    const def = espejado ? espejo(base) : base;
    const q = new Map<Hueso, THREE.Quaternion>();
    for (const h of HUESOS) {
      const v = def.huesos[h];
      q.set(h, v ? new THREE.Quaternion().setFromEuler(new THREE.Euler(v[0] * RAD, v[1] * RAD, v[2] * RAD, 'ZYX')) : IDENT.clone());
    }
    const estira = new Map<Hueso, number>();
    for (const h of HUESOS) estira.set(h, 1);
    for (const [h, k] of Object.entries(def.estira ?? {}) as [Hueso, number][]) {
      const o = (espejado ? (h.endsWith('.L') ? h.slice(0, -2) + '.R' : h.endsWith('.R') ? h.slice(0, -2) + '.L' : h) : h) as Hueso;
      estira.set(o, k);
    }
    p = { q, y: def.y ?? 0, estira };
    cache.set(clave, p);
  }
  return p;
}
