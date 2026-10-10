// Las herramientas de la granja con su calidad a la vista (Básica, Cobre, Hierro, Acero estelar y Cristal de Celia):
// la misma figura en la mano del personaje y en los íconos (`scripts/granja-v3/iconos-herramientas.mjs` las fotografía).
// Convención: el mango va a lo largo de +Y, de y=-0.53 (la punta de abajo) a y≈0.13, y la cabeza arriba, como las
// herramientas de antes, para que la animación del golpe y la mano no cambien.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export const NOMBRES_CALIDAD = ['Básica', 'Cobre', 'Hierro', 'Acero estelar', 'Cristal de Celia'];

interface Tono { metal: THREE.MeshStandardMaterial; filo: THREE.MeshStandardMaterial; mango: THREE.MeshStandardMaterial; agarre: THREE.MeshStandardMaterial; adorno: THREE.MeshStandardMaterial; gema?: THREE.MeshStandardMaterial }
const tonos = new Map<number, Tono>();
function tono(nivel: number): Tono {
  const n = Math.max(0, Math.min(4, nivel | 0));
  const hecho = tonos.get(n);
  if (hecho) return hecho;
  const std = (color: string, metalness: number, roughness: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  const t: Tono = [
    // Básica: hierro viejo y mango de madera clara con cuerda
    { metal: std('#8f938e', 0.5, 0.6), filo: std('#b9bcb6', 0.55, 0.45), mango: std('#b88a58', 0, 0.85), agarre: std('#8a6d4c', 0, 0.95), adorno: std('#6f5a44', 0, 0.9) },
    // Cobre: rosado brillante, con remaches
    { metal: std('#c8743c', 0.8, 0.32), filo: std('#f0a873', 0.85, 0.22), mango: std('#9a6a40', 0, 0.75), agarre: std('#5f3f2a', 0, 0.85), adorno: std('#e3a066', 0.8, 0.3) },
    // Hierro: acero claro y cuero oscuro
    { metal: std('#b9c3c9', 0.85, 0.24), filo: std('#eef3f6', 0.9, 0.12), mango: std('#6e4a33', 0, 0.7), agarre: std('#3b2a22', 0, 0.8), adorno: std('#8a949a', 0.85, 0.3) },
    // Acero estelar: azul noche con estrellitas doradas
    { metal: std('#3b4a92', 0.85, 0.2, { emissive: new THREE.Color('#1e2c7a'), emissiveIntensity: 0.35 }), filo: std('#a9c2ff', 0.9, 0.1, { emissive: new THREE.Color('#5b7cff'), emissiveIntensity: 0.4 }), mango: std('#3d2c4f', 0, 0.6), agarre: std('#271b33', 0, 0.7), adorno: std('#f2c75a', 0.9, 0.25, { emissive: new THREE.Color('#a27a1c'), emissiveIntensity: 0.3 }), gema: std('#ffe9a8', 0.2, 0.2, { emissive: new THREE.Color('#ffd25e'), emissiveIntensity: 0.9 }) },
    // Cristal de Celia: cristal turquesa que brilla, mango de marfil y oro
    { metal: std('#3fc4dc', 0.2, 0.06, { emissive: new THREE.Color('#0f8fb0'), emissiveIntensity: 0.45, transparent: true, opacity: 0.92 }), filo: std('#a8f2ff', 0.2, 0.03, { emissive: new THREE.Color('#5fe0f5'), emissiveIntensity: 0.6 }), mango: std('#e9d9b8', 0, 0.45), agarre: std('#b99a6a', 0, 0.55), adorno: std('#f2c75a', 0.9, 0.22, { emissive: new THREE.Color('#a27a1c'), emissiveIntensity: 0.3 }), gema: std('#ffffff', 0.1, 0.05, { emissive: new THREE.Color('#c8fbff'), emissiveIntensity: 1.2 }) },
  ][n];
  // Compartidos entre todas las herramientas de ese nivel: no se sueltan al cambiar de herramienta
  for (const m of Object.values(t)) if (m) { m.name = 'herramienta_' + n; m.userData.compartido = true; }
  tonos.set(n, t);
  return t;
}

const malla = (g: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number] = [0, 0, 0], rot: [number, number, number] = [0, 0, 0]) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos); m.rotation.set(...rot);
  m.castShadow = true;
  g.add(m);
  return m;
};
/** Silueta 2D extruida con bisel (cabezas de hacha, pico, guadaña, espada). */
function silueta(puntos: [number, number][], grosor: number, bisel = 0.008) {
  const s = new THREE.Shape(puntos.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth: grosor, bevelEnabled: true, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 2, curveSegments: 10 });
  g.translate(0, 0, -grosor / 2);
  return g;
}
function curva(desde: [number, number], control: [number, number], hasta: [number, number], pasos = 10): [number, number][] {
  const r: [number, number][] = [];
  for (let i = 0; i <= pasos; i++) { const t = i / pasos, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t; r.push([a * desde[0] + b * control[0] + c * hasta[0], a * desde[1] + b * control[1] + c * hasta[1]]); }
  return r;
}

/** Mango con su agarre: más adornado según la calidad. */
function mango(g: THREE.Group, t: Tono, nivel: number, largo = 0.66, arriba = 0.13) {
  const abajo = arriba - largo;
  malla(g, new THREE.CylinderGeometry(0.026, 0.031, largo, 10, 1), t.mango, [0, (arriba + abajo) / 2, 0]);
  // Puntera
  malla(g, new THREE.SphereGeometry(0.034, 10, 8), nivel >= 1 ? t.adorno : t.mango, [0, abajo, 0]);
  // Agarre: cuerda (básica) o cuero con vueltas (las demás)
  const vueltas = nivel === 0 ? 5 : 7;
  for (let i = 0; i < vueltas; i++) malla(g, new THREE.TorusGeometry(0.031, nivel === 0 ? 0.007 : 0.009, 6, 14), t.agarre, [0, abajo + 0.07 + i * 0.026, 0], [Math.PI / 2 + (i % 2 ? 0.12 : -0.12), 0, 0]);
  if (nivel >= 2) for (const y of [abajo + 0.055, abajo + 0.075 + vueltas * 0.026]) malla(g, new THREE.TorusGeometry(0.033, 0.006, 6, 16), t.adorno, [0, y, 0], [Math.PI / 2, 0, 0]);
}
/** Detalles de las calidades altas: estrellitas (acero estelar) y astillas de cristal (Celia). */
function adornos(g: THREE.Group, t: Tono, nivel: number, puntos: [number, number, number][]) {
  if (nivel >= 3 && t.gema) for (const p of puntos) {
    const e = new THREE.OctahedronGeometry(0.018, 0); e.scale(1, 1, 0.5);
    malla(g, e, t.gema, p);
  }
  if (nivel >= 4) for (const [x, y, z] of puntos.slice(0, 2)) malla(g, new THREE.ConeGeometry(0.014, 0.06, 5), t.metal, [x + 0.02, y + 0.04, z], [0, 0, -0.5]);
}

function azada(g: THREE.Group, t: Tono, n: number) {
  mango(g, t, n);
  // Cuello curvo y hoja ancha con filo
  malla(g, new THREE.CylinderGeometry(0.03, 0.034, 0.05, 10), n >= 1 ? t.adorno : t.metal, [0, 0.14, 0]);
  const cuello = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.15, 0), new THREE.Vector3(0, 0.2, 0.04), new THREE.Vector3(0, 0.19, 0.11)]), 8, 0.017, 6);
  malla(g, cuello, t.metal);
  const hoja = new RoundedBoxGeometry(0.25, 0.026, 0.15, 2, 0.012);
  malla(g, hoja, t.metal, [0, 0.165, 0.17], [0.5, 0, 0]);
  malla(g, new RoundedBoxGeometry(0.25, 0.012, 0.03, 1, 0.005), t.filo, [0, 0.13, 0.238], [0.5, 0, 0]);
  adornos(g, t, n, [[0.07, 0.19, 0.16], [-0.07, 0.19, 0.16]]);
}
function hacha(g: THREE.Group, t: Tono, n: number) {
  mango(g, t, n, 0.66, 0.16);
  const cabeza = silueta([[-0.035, -0.045], [0.06, -0.05], ...curva([0.13, -0.11], [0.2, 0], [0.13, 0.11]), [0.06, 0.05], [-0.035, 0.045], [-0.06, 0]], 0.045);
  malla(g, cabeza, t.metal, [0, 0.12, 0], [0, -Math.PI / 2, 0]);
  const filo = silueta(curva([0.12, -0.115], [0.215, 0], [0.12, 0.115]).concat(curva([0.135, 0.09], [0.185, 0], [0.135, -0.09])), 0.02, 0.004);
  malla(g, filo, t.filo, [0, 0.12, 0], [0, -Math.PI / 2, 0]);
  malla(g, new THREE.CylinderGeometry(0.034, 0.034, 0.1, 10), t.metal, [0, 0.12, 0]);
  adornos(g, t, n, [[0, 0.12, 0.09], [0.03, 0.15, 0.05]]);
}
function pico(g: THREE.Group, t: Tono, n: number) {
  mango(g, t, n);
  const arco = [...curva([-0.24, -0.06], [0, 0.09], [0.24, -0.06], 14), ...curva([0.21, -0.02], [0, 0.0], [-0.21, -0.02], 14), [-0.24, -0.06] as [number, number]];
  malla(g, silueta(arco, 0.055), t.metal, [0, 0.15, 0]);
  malla(g, new THREE.CylinderGeometry(0.038, 0.038, 0.07, 10), n >= 1 ? t.adorno : t.metal, [0, 0.15, 0], [Math.PI / 2, 0, 0]);
  for (const s of [-1, 1]) malla(g, new THREE.ConeGeometry(0.016, 0.05, 6), t.filo, [s * 0.255, 0.098, 0], [0, 0, s * 2.2]);
  adornos(g, t, n, [[0.1, 0.17, 0.03], [-0.1, 0.17, 0.03]]);
}
function guadana(g: THREE.Group, t: Tono, n: number) {
  mango(g, t, n, 0.72, 0.18);
  // Agarre lateral
  malla(g, new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8), t.mango, [0.05, -0.12, 0], [0, 0, Math.PI / 2]);
  const hoja = [...curva([0, 0.03], [0.22, 0.07], [0.4, -0.06], 14), ...curva([0.4, -0.06], [0.24, 0.0], [0, -0.02], 14).slice(1)];
  malla(g, silueta(hoja, 0.018, 0.005), t.metal, [0, 0.17, 0]);
  malla(g, silueta(curva([0.02, -0.02], [0.24, 0.005], [0.4, -0.06], 12).concat(curva([0.38, -0.062], [0.24, -0.012], [0.02, -0.03], 12)), 0.012, 0.003), t.filo, [0, 0.17, 0.004]);
  malla(g, new THREE.CylinderGeometry(0.034, 0.034, 0.06, 10), n >= 1 ? t.adorno : t.metal, [0, 0.17, 0]);
  adornos(g, t, n, [[0.15, 0.21, 0.01], [0.28, 0.18, 0.01]]);
}
function regadera(g: THREE.Group, t: Tono, n: number) {
  const perfil = [[0, -0.27], [0.13, -0.27], [0.155, -0.24], [0.16, -0.12], [0.15, -0.04], [0.12, -0.01], [0.06, 0.0], [0, 0.0]].map(([x, y]) => new THREE.Vector2(x, y));
  malla(g, new THREE.LatheGeometry(perfil, 20), t.metal, [0, -0.02, 0]);
  // Bandas de la lata
  for (const y of [-0.26, -0.16]) malla(g, new THREE.TorusGeometry(0.158, 0.008, 6, 24), n >= 1 ? t.adorno : t.filo, [0, y, 0], [Math.PI / 2, 0, 0]);
  // Pico y regadera de flor
  const pico = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.2, 0.13), new THREE.Vector3(0, -0.1, 0.24), new THREE.Vector3(0, 0.02, 0.34)]), 10, 0.022, 8);
  malla(g, pico, t.metal);
  malla(g, new THREE.CylinderGeometry(0.05, 0.022, 0.05, 12), t.filo, [0, 0.04, 0.355], [-0.9, 0, 0]);
  // Asa de arriba y asa de atrás
  malla(g, new THREE.TorusGeometry(0.1, 0.016, 8, 20, Math.PI), t.metal, [0, -0.02, -0.02], [0, Math.PI / 2, 0]);
  malla(g, new THREE.TorusGeometry(0.07, 0.014, 8, 16, Math.PI), n >= 2 ? t.adorno : t.metal, [0, -0.15, -0.16], [0, Math.PI / 2, Math.PI / 2]);
  adornos(g, t, n, [[0, -0.13, 0.16], [0.1, -0.1, 0.12]]);
}
function cana(g: THREE.Group, t: Tono, n: number) {
  malla(g, new THREE.CylinderGeometry(0.014, 0.03, 1.35, 8), t.mango, [0, 0.43, 0]);
  for (let i = 0; i < 6; i++) malla(g, new THREE.TorusGeometry(0.016 - i * 0.0015, 0.004, 5, 10), n >= 1 ? t.adorno : t.metal, [0.02, 0.0 + i * 0.2, 0], [0, Math.PI / 2, 0]);
  for (let i = 0; i < 5; i++) malla(g, new THREE.TorusGeometry(0.027, 0.007, 6, 12), t.agarre, [0, -0.2 + i * 0.022, 0], [Math.PI / 2, 0, 0]);
  // Carrete
  malla(g, new THREE.CylinderGeometry(0.05, 0.05, 0.035, 16), t.metal, [0.055, -0.08, 0], [0, 0, Math.PI / 2]);
  malla(g, new THREE.CylinderGeometry(0.008, 0.008, 0.06, 6), t.adorno, [0.09, -0.11, 0], [0, 0, 0.6]);
  // Hilo que cuelga de la punta
  malla(g, new THREE.CylinderGeometry(0.002, 0.002, 0.3, 4), new THREE.MeshStandardMaterial({ color: '#f4f1e8' }), [0.02, 0.96, 0]);
  malla(g, new THREE.SphereGeometry(0.025, 10, 8), new THREE.MeshStandardMaterial({ color: '#e4574b', roughness: 0.4 }), [0.02, 0.8, 0]);
  adornos(g, t, n, [[0.02, 0.4, 0.02], [0.02, 0.7, 0.02]]);
}
function espada(g: THREE.Group, t: Tono, n: number) {
  malla(g, new THREE.CylinderGeometry(0.024, 0.026, 0.14, 10), t.agarre, [0, -0.2, 0]);
  for (let i = 0; i < 5; i++) malla(g, new THREE.TorusGeometry(0.026, 0.006, 6, 12), t.mango, [0, -0.255 + i * 0.027, 0], [Math.PI / 2, 0.2, 0]);
  malla(g, new THREE.SphereGeometry(0.035, 12, 10), t.adorno, [0, -0.285, 0]);
  malla(g, new RoundedBoxGeometry(0.2, 0.035, 0.05, 2, 0.012), n >= 1 ? t.adorno : t.metal, [0, -0.12, 0]);
  const hoja = silueta([[-0.035, 0], [0.035, 0], [0.032, 0.48], [0, 0.56], [-0.032, 0.48]], 0.016, 0.006);
  malla(g, hoja, t.metal, [0, -0.1, 0]);
  malla(g, silueta([[-0.008, 0.03], [0.008, 0.03], [0.006, 0.44], [-0.006, 0.44]], 0.004, 0.002), t.filo, [0, -0.1, 0.013]);
  adornos(g, t, n, [[0, -0.12, 0.03], [0, 0.1, 0.012]]);
}

const HACER: Record<string, (g: THREE.Group, t: Tono, n: number) => void> = { azada, hacha, pico, guadana, regadera, cana, espada };
export const HERRAMIENTAS_3D = Object.keys(HACER);

/** Grupo listo para la mano (o para la foto del ícono). Devuelve null si no es una herramienta de las de calidad. */
export function crearHerramienta(id: string, nivel = 0): THREE.Group | null {
  const hacer = HACER[id];
  if (!hacer) return null;
  const g = new THREE.Group();
  g.name = `herramienta_${id}_${nivel}`;
  g.userData.id = id; g.userData.nivel = nivel;
  hacer(g, tono(nivel), Math.max(0, Math.min(4, nivel | 0)));
  return g;
}
