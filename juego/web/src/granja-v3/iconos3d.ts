// Estudio de fotos de los íconos de la granja: cada objeto como figurita 3D (estilo plastilina y fieltro) para
// fotografiarla con `scripts/granja-v3/iconos-objetos.mjs`. Solo lo usa ese script: el juego carga las fotos (webp).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { CULTIVOS } from './catalogo';
import { FRUTALES } from './frutales-datos';
import { OBJETOS } from './objetos';
import { crearHerramienta } from './herramientas3d';

type V3 = [number, number, number];
const mats = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: string, o: { metal?: number; rough?: number; brillo?: number; opacidad?: number } = {}) {
  const k = [color, o.metal, o.rough, o.brillo, o.opacidad].join();
  let m = mats.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, metalness: o.metal ?? 0, roughness: o.rough ?? 0.7 });
    if (o.brillo) { m.emissive = new THREE.Color(color); m.emissiveIntensity = o.brillo; }
    if (o.opacidad) { m.transparent = true; m.opacity = o.opacidad; }
    mats.set(k, m);
  }
  return m;
}
const M = (g: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, p: V3 = [0, 0, 0], r: V3 = [0, 0, 0], s: V3 = [1, 1, 1]) => { const x = new THREE.Mesh(geo, m); x.position.set(...p); x.rotation.set(...r); x.scale.set(...s); g.add(x); return x; };
const bola = (g: THREE.Object3D, r: number, c: string | THREE.Material, p: V3 = [0, 0, 0], s: V3 = [1, 1, 1]) => M(g, new THREE.SphereGeometry(r, 24, 16), typeof c === 'string' ? mat(c) : c, p, [0, 0, 0], s);
const caja = (g: THREE.Object3D, s: V3, c: string | THREE.Material, p: V3 = [0, 0, 0], r: V3 = [0, 0, 0], radio = 0.04) => M(g, new RoundedBoxGeometry(...s, 3, Math.min(radio, Math.min(...s) * 0.45)), typeof c === 'string' ? mat(c) : c, p, r);
const cil = (g: THREE.Object3D, rt: number, rb: number, h: number, c: string | THREE.Material, p: V3 = [0, 0, 0], r: V3 = [0, 0, 0], seg = 20) => M(g, new THREE.CylinderGeometry(rt, rb, h, seg), typeof c === 'string' ? mat(c) : c, p, r);
const aclarar = (c: string, t: number) => '#' + new THREE.Color(c).lerp(new THREE.Color('#ffffff'), t).getHexString();
const oscurecer = (c: string, t: number) => '#' + new THREE.Color(c).multiplyScalar(1 - t).getHexString();
function hojaPlana(g: THREE.Object3D, largo: number, ancho: number, color: string, p: V3, r: V3) {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(ancho, largo * 0.4, 0, largo); s.quadraticCurveTo(-ancho, largo * 0.4, 0, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 });
  return M(g, geo, mat(color), p, r);
}
/** Perfil de torno (raíces, botellas, frascos…). */
function torno(g: THREE.Object3D, perfil: [number, number][], c: string | THREE.Material, p: V3 = [0, 0, 0], r: V3 = [0, 0, 0]) {
  return M(g, new THREE.LatheGeometry(perfil.map(([x, y]) => new THREE.Vector2(x, y)), 28), typeof c === 'string' ? mat(c) : c, p, r);
}

// ── Cosechas ──────────────────────────────────────────────────────────
function cosecha(id: string, forma: string, color: string): THREE.Group {
  const g = new THREE.Group(), verde = '#5e9a45';
  if (id === 'maiz') {
    torno(g, [[0, -0.42], [0.12, -0.3], [0.15, 0], [0.12, 0.3], [0, 0.42]], color);
    for (let i = 0; i < 40; i++) { const a = (i % 8) / 8 * Math.PI * 2, y = -0.32 + Math.floor(i / 8) * 0.15; bola(g, 0.038, aclarar(color, 0.15), [Math.cos(a) * 0.14, y, Math.sin(a) * 0.14]); }
    for (const s of [-1, 1]) hojaPlana(g, 0.8, 0.13, verde, [s * 0.06, -0.45, 0.05], [0.1, 0, s * 0.3]);
    return g;
  }
  if (id === 'trigo' || id === 'arroz' || id === 'amaranto' || forma === 'cereal') {
    for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.1; const t = new THREE.Group(); g.add(t); t.rotation.z = a; cil(t, 0.012, 0.015, 0.8, '#c9a85c', [0, 0, 0]); for (let k = 0; k < 6; k++) for (const s of [-1, 1]) bola(t, 0.035, color, [s * 0.025, 0.3 + k * 0.045, 0], [0.7, 1.4, 0.7]); }
    M(g, new THREE.TorusGeometry(0.06, 0.02, 8, 20), mat('#b0563f'), [0, -0.05, 0], [Math.PI / 2, 0, 0]);
    return g;
  }
  if (id === 'uva') { for (let i = 0; i < 14; i++) { const fila = Math.floor(Math.sqrt(i * 2)), a = i * 2.4; bola(g, 0.09, color, [Math.cos(a) * fila * 0.05, 0.25 - fila * 0.11, Math.sin(a) * fila * 0.05]); } cil(g, 0.015, 0.015, 0.15, '#7a5a35', [0, 0.36, 0]); hojaPlana(g, 0.3, 0.18, verde, [0.02, 0.3, 0], [0, 0, -1]); return g; }
  if (id === 'pina') { torno(g, [[0, -0.35], [0.2, -0.3], [0.24, -0.05], [0.2, 0.18], [0, 0.22]], color); for (let i = 0; i < 6; i++) hojaPlana(g, 0.35, 0.08, verde, [0, 0.18, 0], [0, i, (i % 2 ? 0.3 : -0.3)]); return g; }
  switch (forma) {
    case 'raiz': {
      const r = id === 'patata' || id === 'batata' || id === 'name' || id === 'taro';
      if (r) { bola(g, 0.27, color, [0, 0, 0], [1.25, 0.85, 0.95]); for (let i = 0; i < 6; i++) bola(g, 0.025, oscurecer(color, 0.25), [Math.cos(i * 2) * 0.22, Math.sin(i * 3) * 0.12, 0.2]); return g; }
      torno(g, [[0, -0.48], [0.05, -0.36], [0.12, -0.1], [0.16, 0.12], [0.13, 0.2], [0, 0.22]], color);
      for (let i = 0; i < 5; i++) M(g, new THREE.TorusGeometry(0.12 - i * 0.015, 0.006, 6, 20), mat(oscurecer(color, 0.18)), [0, 0.05 - i * 0.09, 0], [Math.PI / 2, 0, 0]);
      for (let i = 0; i < 5; i++) hojaPlana(g, 0.35, 0.09, verde, [0, 0.18, 0], [0, i * 1.25, (i - 2) * 0.25]);
      return g;
    }
    case 'cabeza': {
      bola(g, 0.28, color, [0, 0, 0], [1, 0.9, 1]);
      for (let i = 0; i < 9; i++) bola(g, 0.1, aclarar(color, 0.08), [Math.cos(i * 0.7) * 0.18, 0.12 + Math.sin(i) * 0.04, Math.sin(i * 0.7) * 0.18]);
      for (let i = 0; i < 6; i++) hojaPlana(g, 0.38, 0.22, verde, [0, -0.15, 0], [0.9, i * 1.05, 0]);
      return g;
    }
    case 'hoja': { for (let i = 0; i < 5; i++) hojaPlana(g, 0.75, 0.2, i % 2 ? color : verde, [0, -0.38, 0], [0, i * 0.6, (i - 2) * 0.22]); M(g, new THREE.TorusGeometry(0.05, 0.018, 8, 20), mat('#c79a5c'), [0, -0.25, 0], [Math.PI / 2, 0, 0]); return g; }
    case 'vaina': { for (let i = 0; i < 3; i++) { const v = M(g, new THREE.CapsuleGeometry(0.06, 0.6, 8, 12), mat(color), [(i - 1) * 0.13, 0, 0], [0, 0, (i - 1) * 0.25]); v.scale.set(1, 1, 0.75); } return g; }
    case 'flor': {
      cil(g, 0.018, 0.02, 0.7, verde, [0, -0.25, 0]); hojaPlana(g, 0.25, 0.1, verde, [0, -0.3, 0], [0, 0, -0.9]);
      const grande = id.includes('girasol'), n = grande ? 16 : 7, cabeza = new THREE.Group(); cabeza.position.set(0, 0.12, 0.02); cabeza.rotation.x = 0.5; g.add(cabeza);
      for (let capa = 0; capa < 2; capa++) for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + capa * 0.3; bola(cabeza, grande ? 0.07 : 0.1, capa ? aclarar(color, 0.2) : color, [Math.cos(a) * (grande ? 0.2 : 0.12), Math.sin(a) * (grande ? 0.2 : 0.12), capa * 0.03], [1.6, 0.7, 0.4]).rotation.z = a; }
      bola(cabeza, grande ? 0.13 : 0.06, grande ? '#6b4423' : '#f4cf55', [0, 0, 0.05], [1, 1, 0.5]);
      return g;
    }
    case 'baya': {
      const pimiento = id === 'pimiento';
      if (pimiento) { torno(g, [[0, -0.4], [0.12, -0.3], [0.2, 0], [0.18, 0.2], [0.05, 0.27], [0, 0.27]], color); cil(g, 0.025, 0.03, 0.12, verde, [0, 0.3, 0]); return g; }
      for (let i = 0; i < 9; i++) { const a = i * 2.3, r = i < 1 ? 0 : 0.17; bola(g, 0.12, color, [Math.cos(a) * r, -0.05 + (i % 3) * 0.05, Math.sin(a) * r]); }
      hojaPlana(g, 0.3, 0.16, verde, [0, 0.12, 0], [0.5, 0, -0.8]);
      return g;
    }
    case 'cactus': { torno(g, [[0, -0.32], [0.17, -0.22], [0.22, 0.05], [0.15, 0.3], [0, 0.34]], color); for (let i = 0; i < 12; i++) bola(g, 0.02, '#f3e7c2', [Math.cos(i) * 0.19, -0.2 + (i % 4) * 0.13, Math.sin(i) * 0.19]); return g; }
    case 'hongo': {
      for (const [x, s] of [[-0.13, 1], [0.16, 0.75]] as [number, number][]) { cil(g, 0.06 * s, 0.08 * s, 0.35 * s, '#efe3cf', [x, -0.18 * s, 0]); const c = M(g, new THREE.SphereGeometry(0.22 * s, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(color), [x, 0, 0]); c.scale.y = 0.7; for (let i = 0; i < 5; i++) bola(g, 0.03 * s, '#f6ead8', [x + Math.cos(i * 1.3) * 0.12 * s, 0.1 * s, Math.sin(i * 1.3) * 0.12 * s]); }
      return g;
    }
    default: {
      // Fruto grande y redondo (tomate, melón, calabaza, berenjena…)
      const calabaza = /calabaz/.test(id), alargado = /berenjena|pepino|calabacin/.test(id);
      const geo = new THREE.SphereGeometry(0.33, 32, 20);
      if (calabaza) { const pp = geo.attributes.position; for (let i = 0; i < pp.count; i++) { const x = pp.getX(i), z = pp.getZ(i), a = Math.atan2(z, x), k = 0.86 + 0.14 * Math.abs(Math.cos(a * 4)); pp.setXYZ(i, x * k, pp.getY(i) * 0.75, z * k); } geo.computeVertexNormals(); }
      const f = M(g, geo, mat(color, { rough: 0.45 }));
      if (alargado) f.scale.set(0.7, 1.35, 0.7);
      if (id.includes('melon')) for (let i = 0; i < 8; i++) M(g, new THREE.TorusGeometry(0.33, 0.008, 6, 40, Math.PI), mat(aclarar(color, 0.4)), [0, 0, 0], [0, i * 0.39, Math.PI / 2]);
      cil(g, 0.025, 0.035, 0.14, calabaza ? '#7a6038' : verde, [0, alargado ? 0.48 : 0.3, 0], [0, 0, 0.3]);
      for (let i = 0; i < 5; i++) hojaPlana(g, 0.13, 0.06, verde, [0, alargado ? 0.44 : 0.25, 0], [1.3, i * 1.26, 0]);
      bola(g, 0.07, aclarar(color, 0.55), [-0.13, 0.12, 0.25], [1, 1.2, 0.4]);
      return g;
    }
  }
}
function fruta(id: string, color: string, hojas: string): THREE.Group {
  const g = new THREE.Group();
  if (id === 'banano') { for (let i = 0; i < 3; i++) { const b = M(g, new THREE.TorusGeometry(0.35, 0.07, 12, 24, 1.6), mat(color), [0, -0.1 + i * 0.03, (i - 1) * 0.12], [0, 0, 0.6 + i * 0.05]); b.scale.set(1, 1, 1.1); } cil(g, 0.04, 0.05, 0.15, '#7a6038', [0.25, 0.32, 0]); return g; }
  if (id === 'cereza') { for (const s of [-1, 1]) { bola(g, 0.17, color, [s * 0.16, -0.18, 0]); M(g, new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(s * 0.16, -0.05, 0), new THREE.Vector3(s * 0.05, 0.25, 0), new THREE.Vector3(0, 0.38, 0)), 12, 0.015, 6), mat('#6f8a45')); } hojaPlana(g, 0.25, 0.12, hojas, [0, 0.36, 0], [0, 0, -1.1]); return g; }
  const f = bola(g, 0.32, mat(color, { rough: 0.45 }), [0, 0, 0], id === 'mango' ? [0.85, 1.1, 0.85] : [1, 0.95, 1]);
  if (id === 'naranja') f.material = mat(color, { rough: 0.8 });
  cil(g, 0.02, 0.03, 0.12, '#7a6038', [0, 0.33, 0], [0, 0, 0.3]);
  hojaPlana(g, 0.22, 0.11, hojas, [0.03, 0.36, 0], [0, 0, -1.2]);
  bola(g, 0.07, aclarar(color, 0.55), [-0.13, 0.12, 0.24], [1, 1.2, 0.4]);
  if (id === 'granada') for (let i = 0; i < 5; i++) hojaPlana(g, 0.07, 0.04, oscurecer(color, 0.2), [0, -0.3, 0], [Math.PI, i * 1.26, 0.4]);
  return g;
}

// ── Semillas y plantones ─────────────────────────────────────────────
function sobre(color: string, dentro: THREE.Group | null): THREE.Group {
  const g = new THREE.Group();
  caja(g, [0.62, 0.8, 0.08], '#dcbf8c', [0, 0, 0], [0, 0, 0], 0.03);
  caja(g, [0.5, 0.5, 0.09], '#f6ecd6', [0, -0.02, 0], [0, 0, 0], 0.03);
  caja(g, [0.64, 0.16, 0.1], color, [0, 0.36, 0], [0, 0, 0], 0.03);
  caja(g, [0.5, 0.06, 0.1], aclarar(color, 0.5), [0, -0.33, 0], [0, 0, 0], 0.02);
  for (const x of [-0.24, -0.08, 0.08, 0.24]) bola(g, 0.035, oscurecer(color, 0.25), [x, 0.36, 0.05], [1, 1, 0.4]);
  if (dentro) { const b = new THREE.Box3().setFromObject(dentro), t = b.getSize(new THREE.Vector3()); dentro.scale.setScalar(0.48 / Math.max(t.x, t.y, 0.01)); dentro.position.set(0, -0.03, 0.14); g.add(dentro); }
  return g;
}
function planton(hojas: string): THREE.Group {
  const g = new THREE.Group();
  torno(g, [[0, -0.42], [0.2, -0.42], [0.25, -0.12], [0.27, -0.1], [0, -0.1]], '#c2714f');
  cil(g, 0.24, 0.24, 0.03, '#6b4a33', [0, -0.12, 0]);
  cil(g, 0.025, 0.035, 0.5, '#7a5a3a', [0, 0.12, 0]);
  for (let i = 0; i < 6; i++) hojaPlana(g, 0.25, 0.12, hojas, [0, 0.2 + (i % 3) * 0.08, 0], [0.3, i * 1.05, 0.9]);
  return g;
}

// ── Minerales, lingotes y recursos ───────────────────────────────────
const COLOR_MINERAL: Record<string, string> = { carbon: '#3a3533', cobre: '#c8743c', hierro: '#b7c0c6', oro: '#f2c14a', cuarzo: '#f2eef8', rubi: '#d8364c', jade: '#4fb48a', obsidiana: '#352a44', plata: '#dfe4ea', titanio: '#9aa7c9', meteorita: '#5b4a6e', cristal_astral: '#8fd6ff', acero: '#8d98a6', astral: '#a98bff' };
function gema(color: string, brillo = 0.15): THREE.Group {
  const g = new THREE.Group();
  const geo = new THREE.OctahedronGeometry(0.3, 0); geo.scale(0.9, 1.25, 0.9);
  M(g, geo, mat(color, { metal: 0.1, rough: 0.12, brillo, opacidad: 0.92 }));
  for (const [x, s] of [[-0.26, 0.5], [0.24, 0.6]] as [number, number][]) { const p = new THREE.OctahedronGeometry(0.3 * s, 0); p.scale(0.9, 1.3, 0.9); M(g, p, mat(color, { metal: 0.1, rough: 0.12, brillo, opacidad: 0.92 }), [x, -0.15, 0.05], [0, 0, x > 0 ? -0.4 : 0.4]); }
  return g;
}
function mena(color: string, metal = true): THREE.Group {
  const g = new THREE.Group();
  M(g, new THREE.DodecahedronGeometry(0.33, 1), mat('#8b857c', { rough: 0.9 }), [0, 0, 0], [0.3, 0.5, 0], [1.1, 0.85, 1]);
  for (let i = 0; i < 6; i++) M(g, new THREE.DodecahedronGeometry(0.09, 0), mat(color, { metal: metal ? 0.75 : 0, rough: metal ? 0.3 : 0.9 }), [Math.cos(i * 1.1) * 0.27, -0.05 + (i % 3) * 0.12, Math.sin(i * 1.1) * 0.22 + 0.08], [i, i * 2, 0]);
  return g;
}
function lingote(color: string): THREE.Group {
  const g = new THREE.Group();
  const geo = new THREE.CylinderGeometry(0.25, 0.36, 0.22, 4, 1); geo.rotateY(Math.PI / 4); geo.scale(1.5, 1, 0.75);
  M(g, geo, mat(color, { metal: 0.85, rough: 0.25 }));
  M(g, geo.clone(), mat(color, { metal: 0.85, rough: 0.25 }), [0.12, 0.2, -0.1], [0, 0.15, 0], [0.92, 0.92, 0.92]);
  return g;
}
function saco(color: string, etiqueta: string): THREE.Group {
  const g = new THREE.Group();
  torno(g, [[0, -0.4], [0.3, -0.38], [0.34, -0.1], [0.28, 0.2], [0.12, 0.3], [0.16, 0.42], [0, 0.42]], color);
  M(g, new THREE.TorusGeometry(0.13, 0.025, 8, 20), mat('#8a6a43'), [0, 0.3, 0], [Math.PI / 2, 0, 0]);
  caja(g, [0.3, 0.22, 0.04], etiqueta, [0, -0.1, 0.3], [0, 0, 0], 0.02);
  return g;
}
function botella(color: string, liquido: string, brillo = 0): THREE.Group {
  const g = new THREE.Group();
  torno(g, [[0, -0.42], [0.22, -0.4], [0.24, 0.05], [0.1, 0.2], [0.08, 0.36], [0, 0.36]], mat(color, { rough: 0.1, opacidad: 0.55 }));
  torno(g, [[0, -0.39], [0.2, -0.37], [0.21, 0.0], [0, 0.0]], mat(liquido, { brillo }));
  cil(g, 0.09, 0.09, 0.08, '#b98a5c', [0, 0.4, 0]);
  return g;
}
function frasco(liquido: string, tapa = '#e4574b'): THREE.Group {
  const g = new THREE.Group();
  torno(g, [[0, -0.35], [0.27, -0.33], [0.28, 0.18], [0.22, 0.24], [0, 0.24]], mat('#ffffff', { rough: 0.1, opacidad: 0.4 }));
  torno(g, [[0, -0.32], [0.25, -0.3], [0.26, 0.12], [0, 0.12]], mat(liquido, { rough: 0.35 }));
  cil(g, 0.25, 0.25, 0.1, tapa, [0, 0.28, 0]);
  caja(g, [0.3, 0.18, 0.04], '#fff4dc', [0, -0.08, 0.27], [0, 0, 0], 0.02);
  return g;
}
function plato(): THREE.Group { const g = new THREE.Group(); cil(g, 0.42, 0.34, 0.06, '#f6f1e6', [0, -0.25, 0], [0, 0, 0], 32); cil(g, 0.32, 0.32, 0.02, '#e8dfcf', [0, -0.21, 0], [0, 0, 0], 32); return g; }
function tazon(sopa: string): THREE.Group { const g = new THREE.Group(); const b = M(g, new THREE.SphereGeometry(0.38, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat('#d9a679'), [0, 0.05, 0]); b.material.side = THREE.DoubleSide; cil(g, 0.35, 0.35, 0.02, sopa, [0, 0.03, 0], [0, 0, 0], 32); return g; }
function pez(color: string): THREE.Group {
  const g = new THREE.Group();
  bola(g, 0.25, mat(color, { rough: 0.35 }), [0, 0, 0], [1.6, 0.85, 0.55]);
  bola(g, 0.18, mat(aclarar(color, 0.45), { rough: 0.4 }), [0.05, -0.08, 0.02], [1.6, 0.5, 0.5]);
  const cola = new THREE.ConeGeometry(0.17, 0.25, 4); cola.rotateZ(Math.PI / 2); cola.scale(1, 1.2, 0.25);
  M(g, cola, mat(oscurecer(color, 0.15)), [-0.48, 0, 0]);
  const aleta = new THREE.ConeGeometry(0.1, 0.18, 3); aleta.scale(1, 1, 0.2); M(g, aleta, mat(oscurecer(color, 0.15)), [0, 0.22, 0], [0, 0, 0.5]);
  bola(g, 0.045, '#ffffff', [0.28, 0.06, 0.11]); bola(g, 0.025, '#1d1a19', [0.3, 0.06, 0.14]);
  for (let i = 0; i < 4; i++) M(g, new THREE.TorusGeometry(0.08, 0.008, 6, 12, Math.PI), mat(oscurecer(color, 0.2)), [0.05 - i * 0.1, 0.02, 0.13], [0, 0, -Math.PI / 2]);
  return g;
}
function armadura(tipo: string, color: string): THREE.Group {
  const g = new THREE.Group(), m = mat(color, { metal: 0.8, rough: 0.3 });
  if (tipo === 'casco') { M(g, new THREE.SphereGeometry(0.34, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), m, [0, -0.1, 0]); M(g, new THREE.TorusGeometry(0.34, 0.035, 8, 32), m, [0, -0.1, 0], [Math.PI / 2, 0, 0]); caja(g, [0.06, 0.3, 0.04], m, [0, 0.0, 0.33]); }
  else if (tipo === 'pechera') { torno(g, [[0, -0.36], [0.3, -0.34], [0.36, 0.1], [0.28, 0.32], [0, 0.34]], m); for (const s of [-1, 1]) bola(g, 0.14, m, [s * 0.34, 0.26, 0], [1, 0.7, 1]); }
  else { for (const s of [-1, 1]) { caja(g, [0.17, 0.4, 0.2], m, [s * 0.15, 0.05, 0]); caja(g, [0.2, 0.12, 0.34], m, [s * 0.15, -0.2, 0.07]); } }
  return g;
}

// ── Catálogo de qué figura lleva cada objeto ─────────────────────────
const RECURSOS: Record<string, () => THREE.Group> = {
  madera: () => { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { cil(g, 0.13, 0.13, 0.75, '#a87447', [0, -0.15 + i * 0.22 - (i === 2 ? 0.05 : 0), i === 2 ? 0 : (i - 0.5) * 0.28], [0, 0, Math.PI / 2]); cil(g, 0.11, 0.11, 0.77, '#e3c08d', [0, -0.15 + i * 0.22 - (i === 2 ? 0.05 : 0), i === 2 ? 0 : (i - 0.5) * 0.28], [0, 0, Math.PI / 2]).scale.set(1, 0.99, 1); } return g; },
  madera_ancestral: () => { const g = RECURSOS.madera(); g.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = mat((o as THREE.Mesh).position.y > 0.1 ? '#b8a3d6' : '#7d6a99'); }); return g; },
  piedra: () => { const g = new THREE.Group(); for (const [x, y, s] of [[-0.15, -0.1, 1], [0.18, -0.15, 0.8], [0.02, 0.15, 0.75]] as V3[]) M(g, new THREE.DodecahedronGeometry(0.22 * s, 1), mat('#a39d92', { rough: 0.95 }), [x, y, 0], [x * 5, y * 4, 0]); return g; },
  fibra: () => { const g = new THREE.Group(); for (let i = 0; i < 9; i++) cil(g, 0.02, 0.02, 0.8, i % 2 ? '#8fb15e' : '#a6c26f', [(i - 4) * 0.035, 0, 0], [0, 0, (i - 4) * 0.06]); M(g, new THREE.TorusGeometry(0.1, 0.03, 8, 20), mat('#c4a46a'), [0, 0, 0], [Math.PI / 2, 0, 0]); return g; },
  heno: () => { const g = new THREE.Group(); caja(g, [0.75, 0.48, 0.48], '#dcc06e', [0, 0, 0], [0, 0, 0], 0.1); for (const x of [-0.2, 0.2]) caja(g, [0.04, 0.5, 0.5], '#a2492f', [x, 0, 0], [0, 0, 0], 0.02); return g; },
  cristal: () => gema('#b6a6f2', 0.25),
  arcilla: () => { const g = new THREE.Group(); bola(g, 0.3, '#b9744f', [0, 0, 0], [1.2, 0.75, 1]); return g; },
  arena: () => saco('#e3cc96', '#d9b46a'), sal: () => saco('#f1eee8', '#9fc4e3'), azucar: () => saco('#fbf6ee', '#f4b6c2'), harina: () => saco('#f3ead8', '#e8b75a'),
  resina: () => { const g = new THREE.Group(); M(g, new THREE.SphereGeometry(0.3, 24, 16), mat('#e8a03a', { rough: 0.15, opacidad: 0.85 }), [0, 0, 0], [0, 0, 0], [0.9, 1.15, 0.9]); return g; },
  cuero: () => { const g = new THREE.Group(); caja(g, [0.75, 0.06, 0.55], '#9a6040', [0, 0, 0], [0.5, 0.2, 0.1], 0.03); return g; },
  aceite: () => botella('#e7d79a', '#d6b12e'), tela: () => { const g = new THREE.Group(); cil(g, 0.2, 0.2, 0.7, '#d98fa3', [0, 0, 0], [0, 0, Math.PI / 2]); cil(g, 0.05, 0.05, 0.76, '#e6c89a', [0, 0, 0], [0, 0, Math.PI / 2]); return g; },
  cuerda: () => { const g = new THREE.Group(); for (let i = 0; i < 4; i++) M(g, new THREE.TorusGeometry(0.28 - i * 0.03, 0.04, 8, 28), mat('#c9a46a'), [0, i * 0.05 - 0.1, 0], [Math.PI / 2, 0, 0]); return g; },
  vidrio: () => { const g = new THREE.Group(); caja(g, [0.6, 0.7, 0.05], mat('#cfeff5', { rough: 0.05, opacidad: 0.6 }), [0, 0, 0], [0, 0.3, 0.1], 0.02); return g; },
  bateria: () => { const g = new THREE.Group(); cil(g, 0.2, 0.2, 0.62, '#3e8e6f'); cil(g, 0.21, 0.21, 0.2, '#e8d067', [0, 0.18, 0]); cil(g, 0.07, 0.07, 0.08, '#cfd4d8', [0, 0.35, 0]); return g; },
  engranaje: () => { const g = new THREE.Group(); cil(g, 0.26, 0.26, 0.12, mat('#9aa3aa', { metal: 0.8, rough: 0.3 }), [0, 0, 0], [Math.PI / 2, 0, 0]); for (let i = 0; i < 10; i++) caja(g, [0.1, 0.1, 0.12], mat('#9aa3aa', { metal: 0.8, rough: 0.3 }), [Math.cos(i * 0.628) * 0.3, Math.sin(i * 0.628) * 0.3, 0], [0, 0, i * 0.628], 0.02); cil(g, 0.08, 0.08, 0.14, '#5d666d', [0, 0, 0], [Math.PI / 2, 0, 0]); return g; },
  circuito_astral: () => { const g = new THREE.Group(); caja(g, [0.6, 0.06, 0.6], '#2f5d55', [0, 0, 0], [0.6, 0.3, 0], 0.02); for (let i = 0; i < 4; i++) caja(g, [0.12, 0.05, 0.12], mat('#9fe7ff', { brillo: 0.6 }), [(i % 2 - 0.5) * 0.25, 0.05 + (Math.floor(i / 2) - 0.5) * 0.15, (Math.floor(i / 2) - 0.5) * 0.2], [0.6, 0.3, 0], 0.02); return g; },
  combustible_estelar: () => botella('#e8f6ff', '#7ec8ff', 0.6), grano_cafe: () => { const g = new THREE.Group(); for (let i = 0; i < 5; i++) bola(g, 0.12, '#6b4127', [Math.cos(i * 1.3) * 0.17, (i % 2) * 0.08, Math.sin(i * 1.3) * 0.12], [1, 0.7, 0.75]); return g; },
  leche: () => botella('#ffffff', '#fbf9f2'), leche_cabra: () => botella('#ffffff', '#f6efdf'),
  huevo: () => { const g = new THREE.Group(); bola(g, 0.27, '#f0d6b4', [0, 0, 0], [0.85, 1.12, 0.85]); return g; },
  huevo_pato: () => { const g = new THREE.Group(); bola(g, 0.29, '#cfe3dc', [0, 0, 0], [0.85, 1.12, 0.85]); return g; },
  huevo_avestruz: () => { const g = new THREE.Group(); bola(g, 0.36, '#f3ead8', [0, 0, 0], [0.88, 1.08, 0.88]); return g; },
  huevo_dinosaurio: () => { const g = new THREE.Group(); bola(g, 0.36, '#a7c47c', [0, 0, 0], [0.85, 1.12, 0.85]); for (let i = 0; i < 8; i++) bola(g, 0.05, '#5f8a4a', [Math.cos(i) * 0.25, -0.2 + (i % 4) * 0.13, Math.sin(i) * 0.25 + 0.05]); return g; },
  trufa: () => { const g = new THREE.Group(); M(g, new THREE.DodecahedronGeometry(0.28, 1), mat('#5a4136', { rough: 1 })); return g; },
  lana: () => { const g = new THREE.Group(); for (let i = 0; i < 7; i++) bola(g, 0.17, '#f5efe2', [Math.cos(i) * 0.18, (i % 3 - 1) * 0.1, Math.sin(i) * 0.15]); return g; },
  fibra_suave: () => { const g = RECURSOS.lana(); g.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = mat('#e6cfe0'); }); return g; },
  polvo_estelar: () => { const g = new THREE.Group(); for (let i = 0; i < 9; i++) { const e = new THREE.OctahedronGeometry(0.07 + (i % 3) * 0.03, 0); M(g, e, mat('#ffe39a', { brillo: 0.7 }), [Math.cos(i * 2.1) * 0.25, Math.sin(i * 1.7) * 0.25, 0]); } return g; },
  escama_ignea: () => { const g = new THREE.Group(); const s = new THREE.SphereGeometry(0.3, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2); s.scale(1, 0.35, 1.2); M(g, s, mat('#e0603f', { brillo: 0.35, rough: 0.3 }), [0, 0, 0], [0.9, 0, 0]); return g; },
  pluma_real: () => { const g = new THREE.Group(); hojaPlana(g, 0.85, 0.28, '#b6a3d0', [0, -0.42, 0], [0, 0, -0.4]); return g; },
  pluma_pato: () => { const g = new THREE.Group(); hojaPlana(g, 0.75, 0.24, '#e9eef0', [0, -0.38, 0], [0, 0, -0.4]); return g; },
  manzana: () => fruta('manzana', '#c26b59', '#819a58'),
  // Insumos
  semilla_pasto: () => sobre('#7fae55', RECURSOS.fibra()), alimento_mascota: () => { const g = tazon('#b07a46'); for (let i = 0; i < 6; i++) bola(g, 0.06, '#9a5f37', [Math.cos(i) * 0.15, 0.06, Math.sin(i) * 0.15]); return g; },
  lombriz: () => { const g = new THREE.Group(); M(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-0.35, -0.1, 0], [-0.15, 0.1, 0], [0.05, -0.1, 0], [0.25, 0.08, 0], [0.38, 0, 0]].map((p) => new THREE.Vector3(...p))), 30, 0.06, 10), mat('#d58e86')); return g; },
  pez_cebo: () => pez('#a0b7b0'), cebo_magico: () => botella('#f1e9ff', '#c8a6ff', 0.5), cebo_refinado: () => frasco('#c48a6a', '#5f8a4a'),
  antorcha: () => { const g = new THREE.Group(); cil(g, 0.04, 0.05, 0.7, '#8a5a35', [0, -0.15, 0]); bola(g, 0.12, mat('#ffb347', { brillo: 0.9 }), [0, 0.28, 0], [1, 1.5, 1]); bola(g, 0.07, mat('#fff1a8', { brillo: 1 }), [0, 0.3, 0.05], [1, 1.4, 1]); return g; },
  fertilizante: () => saco('#a07a4f', '#7fae55'), fertilizante_mejorado: () => saco('#8a6a9f', '#f6cf5a'),
  carbon: () => { const g = new THREE.Group(); for (let i = 0; i < 4; i++) M(g, new THREE.DodecahedronGeometry(0.17, 0), mat('#3a3533', { rough: 0.6, metal: 0.2 }), [Math.cos(i * 1.6) * 0.17, (i % 2) * 0.12 - 0.05, Math.sin(i * 1.6) * 0.12], [i, i, 0]); return g; },
};
const COMIDAS: Record<string, () => THREE.Group> = {
  pan: () => { const g = new THREE.Group(); bola(g, 0.32, '#d29a5a', [0, -0.05, 0], [1.3, 0.7, 0.9]); for (let i = 0; i < 3; i++) caja(g, [0.04, 0.03, 0.4], '#f2d6a2', [(i - 1) * 0.18, 0.13, 0], [0.1, 0.4, 0], 0.01); return g; },
  tortilla: () => { const g = plato(); cil(g, 0.3, 0.3, 0.08, '#f2c95a', [0, -0.16, 0], [0, 0, 0], 32); return g; },
  sopa_verduras: () => { const g = tazon('#e6a253'); for (let i = 0; i < 5; i++) bola(g, 0.05, i % 2 ? '#e58f3d' : '#7fae55', [Math.cos(i) * 0.18, 0.05, Math.sin(i) * 0.18]); return g; },
  ensalada: () => { const g = tazon('#7fae55'); for (let i = 0; i < 6; i++) bola(g, 0.08, i % 3 ? '#9fcb6a' : '#d9453d', [Math.cos(i) * 0.17, 0.08, Math.sin(i) * 0.17], [1, 0.5, 1]); return g; },
  trucha_asada: () => { const g = plato(); const p = pez('#c98f5e'); p.scale.setScalar(0.8); p.position.y = -0.05; g.add(p); return g; },
  pescado_empanado: () => { const g = plato(); for (let i = 0; i < 3; i++) caja(g, [0.25, 0.08, 0.12], '#e2a95a', [(i - 1) * 0.2, -0.13, 0], [0, i * 0.4, 0], 0.04); return g; },
  pastel_calabaza: () => { const g = plato(); cil(g, 0.32, 0.34, 0.14, '#e8913a', [0, -0.12, 0], [0, 0, 0], 32); M(g, new THREE.TorusGeometry(0.32, 0.04, 8, 32), mat('#d6a05e'), [0, -0.06, 0], [Math.PI / 2, 0, 0]); bola(g, 0.07, '#fff8ee', [0, -0.02, 0], [1, 0.6, 1]); return g; },
  guiso_minero: () => tazon('#8a5a3a'), estofado_lunar: () => tazon('#7f7ab8'), racion_viajera: () => { const g = new THREE.Group(); caja(g, [0.6, 0.35, 0.4], '#c9a46a', [0, 0, 0], [0, 0.3, 0], 0.06); M(g, new THREE.TorusGeometry(0.2, 0.025, 6, 20), mat('#8a5a3a'), [0, 0, 0], [0, 0.3, 0]); return g; },
  cafe: () => { const g = new THREE.Group(); torno(g, [[0, -0.3], [0.25, -0.28], [0.28, 0.2], [0, 0.2]], '#f4ece0'); cil(g, 0.25, 0.25, 0.02, '#5a3622', [0, 0.17, 0]); M(g, new THREE.TorusGeometry(0.1, 0.03, 8, 16), mat('#f4ece0'), [0.3, 0, 0], [0, 0, 0]); return g; },
  elixir_astral: () => botella('#f1e9ff', '#a98bff', 0.6), jugo_manzana: () => botella('#ffffff', '#f2c14a'),
  queso: () => { const g = new THREE.Group(); const c = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 3, 1, false, 0, Math.PI / 2.2); M(g, c, mat('#f6d26a')); return g; }, queso_cabra: () => { const g = new THREE.Group(); cil(g, 0.3, 0.3, 0.25, '#f7f0df'); return g; },
  mayonesa: () => frasco('#f8eec6', '#f2c14a'), mayonesa_pato: () => frasco('#eef3e1', '#7fae55'), mayonesa_avestruz: () => frasco('#f6e7cf', '#c9a46a'), mayonesa_antigua: () => frasco('#d8e6b8', '#5f8a4a'),
  galleta_escarcha: () => { const g = new THREE.Group(); cil(g, 0.3, 0.3, 0.08, '#d9a066', [0, 0, 0], [0.9, 0, 0], 32); for (let i = 0; i < 5; i++) bola(g, 0.04, '#cfeff5', [Math.cos(i) * 0.15, 0.05 + Math.sin(i) * 0.12, 0.06]); return g; },
  mermelada_fresa: () => frasco('#d23a4f'),
};
const FRUTA_MERMELADA: Record<string, string> = { manzana: '#d9894c', cereza: '#a8233a', albaricoque: '#f0a046', durazno: '#f08a66', naranja: '#f39a2c', granada: '#b8263f', mango: '#f2b42e', banano: '#ead36a' };

export function figuraObjeto(id: string): THREE.Group | null {
  const def = OBJETOS[id];
  if (id.startsWith('mermelada_')) { const fruta = id.slice(10); return COMIDAS[id]?.() ?? frasco(FRUTA_MERMELADA[fruta] ?? '#d23a4f'); }
  if (COMIDAS[id]) return COMIDAS[id]();
  if (RECURSOS[id]) return RECURSOS[id]();
  const frutal = FRUTALES.find((f) => f.producto === id);
  if (frutal) return fruta(id, frutal.color, frutal.hojas);
  const cultivo = CULTIVOS.find((c) => c.producto === id);
  if (cultivo) return cosecha(id, cultivo.forma ?? 'fruto', cultivo.color ?? '#d9453d');
  if (id.startsWith('semilla_')) {
    const c = CULTIVOS.find((c) => c.semilla === id) ?? CULTIVOS.find((c) => 'semilla_' + c.id === id);
    const dentro = c ? cosecha(c.producto, c.forma ?? 'fruto', c.color ?? '#d9453d') : null;
    return sobre(c?.color ?? '#9cc77a', dentro);
  }
  if (id.startsWith('planton_')) { const f = FRUTALES.find((f) => f.planton === id); return planton(f?.hojas ?? '#7fae55'); }
  if (id.startsWith('lingote_')) return lingote(COLOR_MINERAL[id.slice(8)] ?? '#b7c0c6');
  if (def?.categoria === 'mineral' || COLOR_MINERAL[id]) {
    const c = COLOR_MINERAL[id] ?? '#b7c0c6';
    return ['cuarzo', 'rubi', 'jade', 'obsidiana', 'cristal_astral', 'meteorita'].includes(id) ? gema(c, id === 'cristal_astral' ? 0.4 : 0.08) : mena(c);
  }
  if (def?.categoria === 'pez') return pez(({ carpa: '#bb9b62', perca: '#83a877', trucha: '#b18c9e', bagre: '#7f92a3', lucio: '#739482', sardina_lago: '#a8bdc5', salmon: '#e39987', anguila: '#827d9c', pez_sol: '#e3b75f', esturion: '#8090a1', trucha_arcoiris: '#99bcb2', tenca: '#a0a77b', pez_hielo: '#a3dce0', koi_lunar: '#a09ac8', anguila_cristal: '#c0b7dc', pez_lava: '#e48966', carpa_ancestral: '#96ae7a', pez_aurora: '#c2a9d9' } as Record<string, string>)[id] ?? '#99b8b0');
  if (def?.categoria === 'equipo') {
    const [tipo, material] = id.split('_'), color = COLOR_MINERAL[material] ?? '#b7c0c6';
    if (tipo === 'espada') { const nivel = { cobre: 1, hierro: 2, oro: 2, obsidiana: 3, titanio: 3, astral: 4 }[material] ?? 1; return crearHerramienta('espada', nivel); }
    return armadura(tipo, color);
  }
  return null;
}
