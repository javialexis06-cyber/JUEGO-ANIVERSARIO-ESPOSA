import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { CultivoDef } from './catalogo';

// Cultivos con hojas curvas de verdad, degradé de verde (oscuro abajo, claro en las puntas), frutos con brillo y
// su cáliz, todo en UNA malla por planta y fase (color por vértice). Las mallas se guardan por cultivo y fase:
// cien parcelas de zanahoria comparten la misma geometría.

const VERDE = new THREE.Color('#4f8a3c'), VERDE_CLARO = new THREE.Color('#9fcb6a'), TALLO = new THREE.Color('#5f8f45');
type Parte = THREE.BufferGeometry;
const azar = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

function pintar(g: THREE.BufferGeometry, color: (y: number, p: THREE.Vector3) => THREE.Color): Parte {
  g = g.index ? g.toNonIndexed() : g;
  g.deleteAttribute('uv');
  if (!g.attributes.normal) g.computeVertexNormals();
  const p = g.attributes.position, col = new Float32Array(p.count * 3), v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const c = color(v.y, v); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
const liso = (c: THREE.Color | string, brillo = 0) => { const cc = new THREE.Color(c); return (_y: number, p: THREE.Vector3) => (brillo && p.x < 0 && p.y > 0 ? cc.clone().lerp(new THREE.Color('#ffffff'), brillo) : cc); };
/** Hoja curva con nervio: sale del origen hacia +Y; luego se gira y se pone en su sitio. */
function hoja(largo: number, ancho: number, curva = 0.25, color0 = VERDE, color1 = VERDE_CLARO): Parte {
  const filas = 6, pos: number[] = [], idx: number[] = [];
  for (let j = 0; j <= filas; j++) {
    const t = j / filas, w = Math.sin(Math.PI * Math.min(1, t * 1.05)) * ancho / 2, y = largo * t, z = curva * largo * t * t;
    pos.push(-w, y, z + w * 0.35, 0, y, z - 0.004, w, y, z + w * 0.35);
  }
  for (let j = 0; j < filas; j++) for (const k of [0, 1]) { const a = j * 3 + k, b = a + 3; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return pintar(g, (y, p) => color0.clone().lerp(color1, Math.min(1, y / largo + Math.abs(p.x) * 2)));
}
function poner(g: Parte, rx: number, ry: number, rz: number, x: number, y: number, z: number): Parte { g.rotateX(rx); g.rotateZ(rz); g.rotateY(ry); g.translate(x, y, z); return g; }
function bola(r: number, c: THREE.Color | string, x: number, y: number, z: number, sy = 1, brillo = 0.25, seg = 10): Parte {
  const g = new THREE.SphereGeometry(r, seg, Math.max(6, seg - 3)); g.scale(1, sy, 1);
  const base = new THREE.Color(c), luz = base.clone().lerp(new THREE.Color('#fff7e8'), brillo), sombra = base.clone().multiplyScalar(0.72);
  const p = pintar(g, (_y, v) => (v.y > r * 0.35 && v.x < 0 ? luz : v.y < -r * 0.4 ? sombra : base));
  p.translate(x, y, z);
  return p;
}
function tallo(h: number, r = 0.016, x = 0, z = 0, inclina = 0): Parte {
  const g = new THREE.CylinderGeometry(r * 0.7, r, h, 5, 2); g.translate(0, h / 2, 0); g.rotateZ(inclina); g.translate(x, 0, z);
  return pintar(g, liso(TALLO));
}
function caliz(x: number, y: number, z: number, s = 1): Parte[] {
  const r: Parte[] = [];
  for (let i = 0; i < 5; i++) r.push(poner(hoja(0.05 * s, 0.025 * s, 0.4, VERDE, VERDE), -1.3, i * 1.26, 0, x, y, z));
  return r;
}
/** Roseta de hojas alrededor del centro. */
function roseta(n: number, largo: number, ancho: number, abre: number, y = 0, c0 = VERDE, c1 = VERDE_CLARO, gira = 0): Parte[] {
  const r: Parte[] = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + gira; r.push(poner(hoja(largo * (0.85 + azar(i) * 0.3), ancho, 0.3, c0, c1), -abre - azar(i + 9) * 0.2, a, 0, 0, y, 0)); }
  return r;
}

function brote(): Parte[] {
  return [tallo(0.06), poner(hoja(0.07, 0.05, 0.2), -1.0, 0, 0, 0, 0.05, 0), poner(hoja(0.07, 0.05, 0.2), -1.0, Math.PI, 0, 0, 0.05, 0)];
}

function plantaPartes(d: CultivoDef, fase: number, rebrote: boolean): Parte[] {
  if (fase <= 0) return brote();
  const s = [0.3, 0.6, 0.82, 1][fase], color = new THREE.Color(d.color ?? '#caa774'), madura = fase >= 3 || (fase >= 2 && !rebrote);
  const p: Parte[] = [];
  switch (d.forma) {
    case 'raiz': {
      // Hojas plumosas arriba y el hombro de la raíz asomando de la tierra
      p.push(...roseta(7, 0.32 * s, 0.07, 0.25, 0.03));
      if (fase >= 2) { const r = new THREE.SphereGeometry(0.09 * s, 12, 9); r.scale(1, 1.25, 1); p.push(pintar(r, (y) => (y > 0.05 * s ? color.clone().lerp(new THREE.Color('#ffffff'), 0.15) : color)).translate(0, 0.03, 0) as Parte); }
      break;
    }
    case 'cabeza': {
      p.push(...roseta(8, 0.26 * s, 0.2 * s, 1.15, 0.02, VERDE, VERDE_CLARO));
      if (fase >= 2) {
        const cab = new THREE.IcosahedronGeometry(0.15 * s, 3);
        const tono = color.clone();
        p.push(pintar(cab, (_y, v) => tono.clone().multiplyScalar(0.85 + 0.25 * Math.max(0, Math.sin(v.x * 70) * Math.cos(v.z * 70)))).translate(0, 0.14 * s, 0) as Parte);
        p.push(...roseta(5, 0.2 * s, 0.17 * s, 0.35, 0.04, color.clone().multiplyScalar(0.8), color, 0.6));
      }
      break;
    }
    case 'hoja': {
      for (let i = 0; i < 9; i++) { const a = i * 0.7; p.push(poner(hoja(0.36 * s * (0.8 + azar(i) * 0.4), 0.13 * s, 0.35, VERDE, i % 3 ? VERDE_CLARO : color), -0.35 - azar(i + 3) * 0.4, a, 0, 0, 0.01, 0)); }
      if (d.id === 'ruibarbo') for (let i = 0; i < 4; i++) p.push(tallo(0.3 * s, 0.018, Math.cos(i * 1.6) * 0.06, Math.sin(i * 1.6) * 0.06, 0.3).translate(0, 0, 0) as Parte);
      break;
    }
    case 'cereal': {
      for (let i = 0; i < 7; i++) {
        const x = (azar(i) - 0.5) * 0.4, z = (azar(i + 5) - 0.5) * 0.4, h = 0.8 * s * (0.85 + azar(i + 2) * 0.3);
        p.push(tallo(h, 0.012, x, z, (azar(i + 7) - 0.5) * 0.2));
        p.push(poner(hoja(0.3 * s, 0.035, 0.6), -0.4, azar(i) * 6, 0, x, h * 0.3, z));
        if (fase >= 2) for (let k = 0; k < 5; k++) p.push(bola(0.022, fase >= 3 ? color : new THREE.Color('#b8cc86'), x + (k % 2 ? 0.018 : -0.018), h - 0.02 + k * 0.03, z, 1.5, 0.3, 6));
      }
      break;
    }
    case 'flor': {
      const h = 0.42 * s;
      p.push(tallo(h, 0.014), ...roseta(4, 0.16 * s, 0.07, 0.6, 0.02));
      p.push(poner(hoja(0.12 * s, 0.05, 0.3), -0.8, 1, 0, 0, h * 0.5, 0));
      if (madura) {
        const grande = d.id === 'girasol', n = grande ? 14 : 8, r = (grande ? 0.13 : 0.07) * Math.max(0.8, s);
        for (let capa = 0; capa < 2; capa++) for (let i = 0; i < n; i++) p.push(poner(hoja(r, r * 0.55, 0.15, color.clone().multiplyScalar(0.85), color.clone().lerp(new THREE.Color('#ffffff'), 0.2)), -1.2 + capa * 0.35, (i / n) * Math.PI * 2 + capa * 0.3, 0, 0, h, 0));
        p.push(bola(grande ? 0.06 : 0.025, grande ? '#6b4423' : '#f4cf55', 0, h + 0.015, 0, 0.6, 0.2));
      } else if (fase >= 2) p.push(bola(0.035, color.clone().lerp(VERDE, 0.4), 0, h, 0, 1.4));
      break;
    }
    case 'baya': case 'vaina': {
      // Matica con racimos
      for (let i = 0; i < 4; i++) p.push(tallo(0.4 * s, 0.013, (azar(i) - 0.5) * 0.1, (azar(i + 3) - 0.5) * 0.1, (azar(i + 1) - 0.5) * 0.6));
      for (let i = 0; i < 12; i++) p.push(poner(hoja(0.14 * s, 0.08 * s, 0.3), -0.6 - azar(i) * 0.6, i * 0.53, 0, (azar(i + 4) - 0.5) * 0.12, 0.08 + azar(i + 8) * 0.3 * s, (azar(i + 6) - 0.5) * 0.12));
      if (madura) for (let i = 0; i < (d.forma === 'vaina' ? 5 : 8); i++) {
        const x = Math.cos(i * 1.9) * 0.13, z = Math.sin(i * 1.9) * 0.13, y = 0.12 + azar(i + 11) * 0.25 * s;
        if (d.forma === 'vaina') { const v = new THREE.CapsuleGeometry(0.017, 0.12, 4, 6); p.push(pintar(v, liso(color, 0.2)).translate(x, y - 0.06, z) as Parte); }
        else p.push(bola(0.035, color, x, y, z, 1, 0.35, 8));
      }
      break;
    }
    case 'fruto': {
      for (let i = 0; i < 6; i++) p.push(poner(hoja(0.26 * s, 0.2 * s, 0.25), -1.1, i * 1.05, 0, 0, 0.03, 0));
      if (madura) {
        const calabaza = /calabaz|zapallo|melon|sandia/.test(d.id), r = calabaza ? 0.19 : 0.16;
        const f = new THREE.SphereGeometry(r, 18, 12); f.scale(1, calabaza ? 0.78 : 0.9, 1);
        const pf = pintar(f, (_y, v) => { const a = Math.atan2(v.z, v.x), surco = calabaza ? 0.82 + 0.18 * Math.abs(Math.cos(a * 4)) : 1; const c = color.clone().multiplyScalar(surco); return v.y > r * 0.35 && v.x < 0 ? c.lerp(new THREE.Color('#fff7e8'), 0.25) : c; });
        p.push(pf.translate(0.04, r * 0.75, 0.02) as Parte, tallo(0.06, 0.015, 0.04, 0.02).translate(0, r * 1.45, 0) as Parte);
        if (d.id.includes('melon')) for (let i = 0; i < 6; i++) p.push(poner(hoja(r * 1.7, 0.012, 0.6, new THREE.Color('#e4e8b8'), new THREE.Color('#e4e8b8')), -0.2, i * 1.05, 0, 0.04, 0.03, 0.02));
      }
      break;
    }
    case 'cactus': {
      const c = new THREE.CylinderGeometry(0.11 * s, 0.13 * s, 0.55 * s, 10, 4); c.translate(0, 0.27 * s, 0);
      p.push(pintar(c, (_y, v) => VERDE.clone().multiplyScalar(0.8 + 0.3 * Math.abs(Math.cos(Math.atan2(v.z, v.x) * 5)))));
      if (fase >= 2) for (const sx of [-1, 1]) { const b = new THREE.CapsuleGeometry(0.06, 0.14, 4, 8); p.push(pintar(b, liso(VERDE)).translate(sx * 0.17, 0.32 * s, 0) as Parte); }
      if (madura) p.push(bola(0.06, color, 0, 0.58 * s, 0, 0.8, 0.3));
      break;
    }
    case 'hongo': {
      for (let i = 0; i < 4; i++) {
        const x = Math.cos(i * 1.7) * 0.12, z = Math.sin(i * 1.7) * 0.12, h = 0.16 * s * (0.8 + azar(i) * 0.4), r = 0.08 * s * (0.8 + azar(i + 2) * 0.4);
        const pie = new THREE.CylinderGeometry(r * 0.35, r * 0.45, h, 7); pie.translate(x, h / 2, z); p.push(pintar(pie, liso('#efe3cf')));
        const som = new THREE.SphereGeometry(r, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2); som.scale(1, 0.7, 1);
        p.push(pintar(som, (_y, v) => (azar(Math.round(v.x * 200) + Math.round(v.z * 200) * 7) > 0.85 ? new THREE.Color('#f3e6d4') : color)).translate(x, h, z) as Parte);
      }
      break;
    }
    default: {
      p.push(...roseta(6, 0.25 * s, 0.12 * s, 0.7));
      if (madura) p.push(bola(0.1, color, 0, 0.12, 0));
    }
  }
  if (d.enrejado) {
    const madera = new THREE.Color('#b99770');
    for (const x of [-0.3, 0.3]) { const v = new THREE.BoxGeometry(0.045, 1.35, 0.045); v.translate(x, 0.675, 0); p.push(pintar(v, liso(madera))); }
    for (const y of [0.35, 0.75, 1.15]) { const v = new THREE.BoxGeometry(0.66, 0.035, 0.035); v.translate(0, y, 0); p.push(pintar(v, liso(madera))); }
    // La enredadera trepa por el enrejado
    for (let i = 0; i < 10 * s; i++) p.push(poner(hoja(0.12, 0.08, 0.2), -0.3, azar(i) * 6, 0, (azar(i + 1) - 0.5) * 0.55, 0.15 + i * 0.11, 0.03));
  }
  return p;
}

const cache = new Map<string, THREE.BufferGeometry>();
const materialPlanta = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.85 });
materialPlanta.userData.compartido = true;

export function plantaCultivo(d: CultivoDef, fase: number, rebrote = false): THREE.Group {
  const clave = `${d.id}:${fase}:${rebrote ? 1 : 0}`;
  let geo = cache.get(clave);
  if (!geo) {
    const partes = plantaPartes(d, fase, rebrote).map((g) => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'color'].includes(k)) n.deleteAttribute(k); if (!n.attributes.normal) n.computeVertexNormals(); return n; });
    geo = mergeGeometries(partes, false)!;
    geo.userData.compartido = true;
    cache.set(clave, geo);
  }
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, materialPlanta);
  m.castShadow = true; m.receiveShadow = true;
  // Cada mata un poquito girada, para que el sembrado no se vea copiado
  m.rotation.y = azar(d.id.length + fase) * Math.PI * 2;
  // Que llene la casilla, como en Stardew
  m.scale.setScalar(1.5);
  g.add(m);
  return g;
}
