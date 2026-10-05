// Reemplazos del escenario (mientras llegan los bioma_<id>.glb): bloques de roca excavable con variantes, vetas con
// cristales que brillan, antorchas y la decoración de cada bioma. Todo como «modelos fijos» (geometría con grupos y
// sus materiales) para dibujarlos con instancias.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { hash2 } from '../../casa/lavado/azar';
import type { DefBioma } from '../datos/mundo';
import { bola, caja, capsula, cil, cono, hueso, mat, toro } from './formas';

export interface ModeloFijo {
  geo: THREE.BufferGeometry;
  mats: THREE.Material[];
  /** Datos del modelo del GLB (userData: tipo, huella, alto, lugar, luz…). */
  datos?: Record<string, any>;
  /** Dónde van las llamas (vacíos «llama» del GLB), en el espacio del modelo. */
  llamas?: THREE.Vector3[];
}

/** Junta partes [geometría, material] en un modelo fijo con un grupo por material. */
export function fijo(partes: [THREE.BufferGeometry, THREE.Material][]): ModeloFijo {
  const porMat = new Map<THREE.Material, THREE.BufferGeometry[]>();
  // Color en los vértices (los GLB de los biomas lo traen horneado): si alguno lo trae, todos lo llevan
  const conColor = partes.some(([g]) => !!g.getAttribute('color'));
  for (const [g0, m] of partes) {
    let g = g0.index ? g0.toNonIndexed() : g0;
    if (!g.getAttribute('uv')) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.getAttribute('position').count * 2), 2));
    if (!g.getAttribute('normal')) g.computeVertexNormals();
    if (conColor && !g.getAttribute('color')) g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.getAttribute('position').count * 3).fill(1), 3));
    const quedan = conColor ? ['position', 'normal', 'uv', 'color'] : ['position', 'normal', 'uv'];
    for (const n of Object.keys(g.attributes)) if (!quedan.includes(n)) g = (g.deleteAttribute(n), g);
    const l = porMat.get(m) ?? [];
    l.push(g);
    porMat.set(m, l);
  }
  const mats = [...porMat.keys()];
  const juntas = mats.map((m) => mergeGeometries(porMat.get(m)!, false)!);
  const geo = mergeGeometries(juntas, true)!;
  geo.computeBoundingSphere();
  return { geo, mats };
}

// ------------------------------------------------------------------------------------------------- Rocas
/** Un bloque de roca de 1 × 1,5 × 1 m con las caras deformadas (el piso queda plano). */
function bloqueRoca(semilla: number, alto = 1.5, rugoso = 1): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(1, alto, 1, 3, 4, 3);
  g.translate(0, alto / 2, 0);
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    if (v.y < 0.01) continue;
    const n = (hash2(Math.round(v.x * 8), Math.round(v.z * 8) + Math.round(v.y * 8) * 31, semilla) - 0.5) * 0.12 * rugoso;
    const arriba = v.y > alto - 0.01;
    // Bordes de arriba redondeados hacia adentro (como piedra gastada)
    if (arriba) {
      v.x *= 0.9 + n * 0.5;
      v.z *= 0.9 - n * 0.5;
      v.y += n * 1.2;
    } else {
      const k = 1 + n;
      v.x *= Math.abs(v.x) > 0.49 ? k : 1;
      v.z *= Math.abs(v.z) > 0.49 ? k : 1;
    }
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

export interface ModelosPared {
  blanda: ModeloFijo[];
  dura: ModeloFijo[];
  borde: ModeloFijo[];
  hierro: ModeloFijo[];
  sangre: ModeloFijo[];
  oro: ModeloFijo[];
  huevo: ModeloFijo[];
  escombro: ModeloFijo[];
}

export function paredesReemplazo(b: DefBioma): ModelosPared {
  const [r0, r1, r2] = b.roca;
  const blanda = mat(r0, { rug: 0.95, relieve: 0.8 });
  const blanda2 = mat(r2, { rug: 0.95, relieve: 0.8 });
  const dura = mat(r1, { rug: 0.75, relieve: 1, met: 0.05 });
  const borde = mat('#141214', { rug: 1, relieve: 0.6 });
  const tierra = mat(new THREE.Color(r0).multiplyScalar(0.7).getStyle(), { rug: 1, relieve: 0.9 });
  const hierroMat = mat('#2a2c30', { met: 0.75, rug: 0.35, relieve: 0.4 });
  const brilloHierro = mat('#8a94a8', { met: 0.9, rug: 0.2, e: '#3a4a6a', ei: 0.6, relieve: 0 });
  const cristal = mat('#5a0a14', { rug: 0.15, met: 0.1, e: '#ff1a30', ei: 2.2, relieve: 0 });
  const oro = mat('#d8a830', { met: 0.85, rug: 0.25, e: '#5a3a08', ei: 0.4, relieve: 0 });
  const huevo = mat('#6a6458', { rug: 0.6, relieve: 0.5 });
  const huevoBrillo = mat('#3a2a10', { e: '#ffb040', ei: 2, relieve: 0 });
  const madera = mat('#4a3424', { rug: 0.9 });
  const cristales = (s: number, n: number, matC: THREE.Material, tam = 1): [THREE.BufferGeometry, THREE.Material][] => {
    const r: [THREE.BufferGeometry, THREE.Material][] = [];
    for (let k = 0; k < n; k++) {
      const a = hash2(k, s, 3) * Math.PI * 2;
      const lado = hash2(k, s, 4) < 0.5 ? -1 : 1;
      const x = Math.cos(a) * 0.35, z = hash2(k, s, 5) < 0.6 ? -0.52 : lado * 0.52, y = 0.35 + hash2(k, s, 6) * 0.9;
      r.push([cono(0.07 * tam, 0.35 * tam, { x, y, z, rx: (z < 0 ? -1 : 1) * (0.9 + hash2(k, s, 7) * 0.5), rz: Math.cos(a) * 0.4 }, 5), matC]);
    }
    return r;
  };
  const vetas = (s: number, roca: THREE.Material, matC: THREE.Material, n: number, tam = 1) => fijo([[bloqueRoca(s, 1.45), roca], ...cristales(s, n, matC, tam)]);
  return {
    blanda: [1, 2, 3].map((s) => fijo([[bloqueRoca(s * 7, 1.45 + s * 0.04), s === 2 ? blanda2 : blanda]])),
    dura: [4, 5].map((s) => fijo([[bloqueRoca(s * 7, 1.6, 0.7), dura]])),
    borde: [fijo([[bloqueRoca(77, 1.9, 0.5), borde]])],
    hierro: [6, 7].map((s) => fijo([[bloqueRoca(s * 7, 1.45), hierroMat], ...cristales(s, 7, brilloHierro, 0.8)])),
    sangre: [8, 9].map((s) => vetas(s * 7, dura, cristal, 6, 1.3)),
    oro: [10].map((s) => fijo([[bloqueRoca(s * 7, 1.45), blanda], ...Array.from({ length: 6 }, (_, k): [THREE.BufferGeometry, THREE.Material] => [bola(0.06 + hash2(k, s, 1) * 0.04, { x: -0.3 + hash2(k, s, 2) * 0.6, y: 0.3 + hash2(k, s, 3) * 1.0, z: -0.52 }, 6), oro])])),
    huevo: [fijo([[bloqueRoca(91, 1.45), blanda], [bola(0.32, { y: 0.55, z: -0.4, sy: 1.3 }), huevo], [toro(0.3, 0.02, { y: 0.6, z: -0.4, rx: 0.3 }), huevoBrillo]])],
    escombro: [fijo([
      [bloqueRoca(55, 0.7, 1.4), tierra],
      [caja(0.5, 0.3, 0.4, 0.08, { x: 0.2, y: 0.75, z: -0.1, ry: 0.5 }), tierra],
      [caja(0.9, 0.08, 0.12, 0.02, { y: 0.8, z: 0.2, ry: 0.3, rz: 0.15 }), madera],
    ])],
  };
}

// ------------------------------------------------------------------------------------------------- Antorchas y velas
export function antorchaReemplazo(): ModeloFijo {
  const hierro = mat('#2a2a2c', { met: 0.6, rug: 0.5 });
  const madera = mat('#4a3020');
  return fijo([
    [caja(0.16, 0.22, 0.05, 0.02, { y: 1.0, z: 0.02 }), hierro],
    [hueso({ x: 0, y: 0.92, z: -0.05 }, { x: 0, y: 1.22, z: -0.2 }, 0.035), madera],
    [cil(0.07, 0.05, 0.1, { y: 1.25, z: -0.22 }), hierro],
  ]);
}
export function velasReemplazo(): ModeloFijo {
  const cera = mat('#d8ccb0', { rug: 0.6 });
  const cera2 = mat('#c8b890', { rug: 0.6 });
  const partes: [THREE.BufferGeometry, THREE.Material][] = [];
  const pos = [[0, 0, 0.3], [0.13, 0.05, 0.22], [-0.1, 0.08, 0.18], [0.04, -0.12, 0.14], [-0.14, -0.08, 0.1]];
  for (const [x, z, h] of pos) {
    partes.push([cil(0.035, 0.04, h, { x, y: h / 2, z }), Math.abs(x) > 0.05 ? cera2 : cera]);
    partes.push([bola(0.045, { x, y: 0.015, z, sy: 0.3 }), cera]);
  }
  return fijo(partes);
}
/** Alturas de las llamas de las velas (para poner los brillos). */
export const LLAMAS_VELAS = [[0, 0, 0.33], [0.13, 0.05, 0.25], [-0.1, 0.08, 0.21], [0.04, -0.12, 0.17], [-0.14, -0.08, 0.13]];

// ------------------------------------------------------------------------------------------------- Decoración
export function decoReemplazo(tipo: string, b: DefBioma): ModeloFijo {
  const piedra = mat('#5a5852', { rug: 0.95, relieve: 0.7 });
  const piedraOsc = mat('#3e3c38', { rug: 0.95, relieve: 0.7 });
  const madera = mat('#4a3424');
  const maderaOsc = mat('#33241a');
  const hierro = mat('#3a3c40', { met: 0.6, rug: 0.5 });
  const hueso_ = mat('#d0c6aa');
  const cera = mat('#d8ccb0');
  const llama = mat('#222', { e: '#ffb050', ei: 5, relieve: 0 });
  const tela = mat('#5a1418', { rug: 0.9 });
  const musgo = mat('#3a4a2a', { rug: 1 });
  switch (tipo) {
    case 'lapida':
      return fijo([[caja(0.55, 0.75, 0.16, 0.08, { y: 0.37 }), piedra], [caja(0.6, 0.08, 0.25, 0.02, { y: 0.04 }), piedraOsc], [caja(0.3, 0.06, 0.02, 0.01, { y: 0.55, z: -0.09 }), piedraOsc], [caja(0.06, 0.3, 0.02, 0.01, { y: 0.5, z: -0.09 }), piedraOsc]]);
    case 'lapida_rota':
      return fijo([[caja(0.55, 0.45, 0.16, 0.06, { y: 0.22, rz: 0.15 }), piedra], [caja(0.3, 0.25, 0.14, 0.05, { x: 0.45, y: 0.07, rx: 1.4, ry: 0.5 }), piedra], [bola(0.15, { x: -0.2, y: 0.02, z: 0.15, sy: 0.3 }), musgo]]);
    case 'cruz':
      return fijo([[caja(0.12, 1.0, 0.12, 0.03, { y: 0.5, rz: 0.08 }), b.id === 'cementerio' ? maderaOsc : piedra], [caja(0.55, 0.12, 0.12, 0.03, { y: 0.72, rz: 0.08 }), b.id === 'cementerio' ? maderaOsc : piedra]]);
    case 'tumba':
      return fijo([[caja(0.8, 0.22, 1.5, 0.1, { y: 0.11 }), mat('#3a3024', { rug: 1, relieve: 0.9 })], [caja(0.5, 0.7, 0.12, 0.08, { y: 0.35, z: -0.8 }), piedra]]);
    case 'huesos':
      return fijo([
        [capsula(0.03, 0.26, { y: 0.03, rz: Math.PI / 2, ry: 0.4 }), hueso_], [capsula(0.03, 0.2, { x: 0.12, y: 0.03, z: 0.1, rz: Math.PI / 2, ry: -0.7 }), hueso_],
        [caja(0.14, 0.12, 0.14, 0.05, { x: -0.12, y: 0.06, z: 0.08 }), hueso_],
      ]);
    case 'calaveras': {
      const p: [THREE.BufferGeometry, THREE.Material][] = [];
      for (let k = 0; k < 7; k++) p.push([caja(0.15, 0.13, 0.15, 0.05, { x: Math.cos(k * 2.4) * (k > 3 ? 0.08 : 0.18), y: 0.065 + (k > 3 ? 0.12 : 0) + (k > 5 ? 0.1 : 0), z: Math.sin(k * 2.4) * (k > 3 ? 0.08 : 0.18), ry: k }), hueso_]);
      return fijo(p);
    }
    case 'velas':
      return velasReemplazo();
    case 'calabaza':
      return fijo([[bola(0.22, { y: 0.17, sy: 0.75 }), mat('#a8501a')], [cil(0.02, 0.03, 0.1, { y: 0.36 }), madera]]);
    case 'arbol_muerto':
      return fijo([
        [cil(0.06, 0.12, 1.4, { y: 0.7, rz: 0.08 }), maderaOsc], [hueso({ x: 0.04, y: 1.0, z: 0 }, { x: 0.5, y: 1.5, z: 0.1 }, 0.035), maderaOsc],
        [hueso({ x: 0.06, y: 1.25, z: 0 }, { x: -0.4, y: 1.7, z: -0.1 }, 0.03), maderaOsc], [hueso({ x: 0.1, y: 1.38, z: 0 }, { x: 0.2, y: 1.85, z: 0.3 }, 0.025), maderaOsc],
      ]);
    case 'farol':
      return fijo([[cil(0.03, 0.04, 1.4, { y: 0.7 }), hierro], [caja(0.16, 0.2, 0.16, 0.02, { y: 1.45 }), hierro], [bola(0.06, { y: 1.45 }), llama]]);
    case 'cadenas':
      return fijo(Array.from({ length: 6 }, (_, k): [THREE.BufferGeometry, THREE.Material] => [toro(0.05, 0.012, { x: k * 0.08 - 0.2, y: 0.02, rx: k % 2 ? Math.PI / 2 : 0, ry: 0.2 }), hierro]));
    case 'urna':
      return fijo([[bola(0.18, { y: 0.2, sy: 1.3 }), mat('#6a4a32')], [cil(0.08, 0.12, 0.1, { y: 0.45 }), mat('#6a4a32')]]);
    case 'sarcofago':
      return fijo([[caja(0.7, 0.45, 1.5, 0.06, { y: 0.22 }), piedra], [caja(0.76, 0.1, 1.56, 0.04, { y: 0.48, ry: 0.06 }), piedraOsc]]);
    case 'vagoneta':
      return fijo([
        [caja(0.7, 0.4, 1.0, 0.05, { y: 0.4 }), maderaOsc],
        ...[-0.3, 0.3].flatMap((z): [THREE.BufferGeometry, THREE.Material][] => [[cil(0.13, 0.13, 0.06, { x: -0.38, y: 0.13, z, rz: Math.PI / 2 }), hierro], [cil(0.13, 0.13, 0.06, { x: 0.38, y: 0.13, z, rz: Math.PI / 2 }), hierro]]),
        [bola(0.2, { y: 0.62, sy: 0.5 }), mat('#3a3436', { rug: 1 })],
      ]);
    case 'cristal': {
      const c = mat('#5a0a14', { rug: 0.15, e: '#ff1a30', ei: 2.4, relieve: 0 });
      return fijo(Array.from({ length: 5 }, (_, k): [THREE.BufferGeometry, THREE.Material] => [cono(0.08 + (k % 2) * 0.04, 0.5 + (k % 3) * 0.2, { x: Math.cos(k * 1.3) * 0.12, y: 0.25, z: Math.sin(k * 1.3) * 0.12, rx: Math.sin(k) * 0.4, rz: Math.cos(k) * 0.4 }, 5), c]));
    }
    case 'barril':
      return fijo([[cil(0.22, 0.22, 0.55, { y: 0.275 }), madera], [toro(0.225, 0.015, { y: 0.12, rx: Math.PI / 2 }), hierro], [toro(0.225, 0.015, { y: 0.43, rx: Math.PI / 2 }), hierro]]);
    case 'pico_roto':
      return fijo([[cil(0.02, 0.02, 0.6, { y: 0.03, rz: Math.PI / 2, ry: 0.4 }), madera], [caja(0.3, 0.04, 0.05, 0.01, { x: 0.25, y: 0.03, z: 0.12, ry: 1.9 }), hierro]]);
    case 'viga':
      return fijo([[caja(0.14, 1.4, 0.14, 0.02, { x: -0.4, y: 0.7 }), madera], [caja(0.14, 1.4, 0.14, 0.02, { x: 0.4, y: 0.7 }), madera], [caja(1.0, 0.14, 0.16, 0.02, { y: 1.4 }), madera]]);
    case 'banca':
      return fijo([[caja(1.3, 0.08, 0.36, 0.02, { y: 0.4 }), maderaOsc], [caja(1.3, 0.4, 0.06, 0.02, { y: 0.65, z: 0.18 }), maderaOsc], [caja(0.06, 0.4, 0.3, 0.01, { x: -0.55, y: 0.2 }), maderaOsc], [caja(0.06, 0.4, 0.3, 0.01, { x: 0.55, y: 0.2 }), maderaOsc]]);
    case 'vitral':
      return fijo([
        [caja(0.5, 0.04, 0.4, 0.01, { y: 0.02, ry: 0.4 }), mat('#2a4a8a', { e: '#1a3a8a', ei: 0.8, rug: 0.2 })], [caja(0.3, 0.04, 0.3, 0.01, { x: 0.35, y: 0.02, z: 0.2, ry: 1.2 }), mat('#8a1a2a', { e: '#8a1a1a', ei: 0.8, rug: 0.2 })],
        [caja(0.25, 0.04, 0.25, 0.01, { x: -0.3, y: 0.02, z: 0.25, ry: 0.2 }), mat('#c8a030', { e: '#6a4a10', ei: 0.6, rug: 0.2 })],
      ]);
    case 'candelabro':
      return fijo([
        [cil(0.03, 0.12, 1.3, { y: 0.65 }), hierro], [toro(0.18, 0.015, { y: 1.3, rx: Math.PI / 2 }), hierro],
        ...[0, 1, 2].flatMap((k): [THREE.BufferGeometry, THREE.Material][] => [[cil(0.025, 0.025, 0.14, { x: Math.cos(k * 2.1) * 0.18, y: 1.37, z: Math.sin(k * 2.1) * 0.18 }), cera], [cono(0.02, 0.06, { x: Math.cos(k * 2.1) * 0.18, y: 1.47, z: Math.sin(k * 2.1) * 0.18 }, 5), llama]]),
      ]);
    case 'libro':
      return fijo([[caja(0.3, 0.06, 0.22, 0.01, { y: 0.03, ry: 0.5 }), mat('#4a1a14')], [caja(0.28, 0.04, 0.2, 0.005, { y: 0.07, ry: 0.5 }), mat('#d8ccb0')]]);
    case 'escombro':
      return fijo([[caja(0.4, 0.25, 0.35, 0.08, { y: 0.12, ry: 0.4 }), piedra], [caja(0.3, 0.18, 0.25, 0.06, { x: 0.3, y: 0.09, z: 0.2, ry: 1.1 }), piedraOsc], [caja(0.2, 0.12, 0.18, 0.04, { x: -0.25, y: 0.06, z: 0.2 }), piedra]]);
    case 'estatua':
      return fijo([[caja(0.5, 0.25, 0.5, 0.04, { y: 0.12 }), piedraOsc], [cono(0.22, 0.9, { y: 0.7 }, 8), piedra], [caja(0.24, 0.24, 0.24, 0.08, { y: 1.25 }), piedra]]);
    case 'tapiz':
      return fijo([[cil(0.03, 0.03, 1.6, { y: 0.8 }), maderaOsc], [caja(0.6, 0.02, 0.02, 0.005, { y: 1.55 }), hierro], [caja(0.55, 0.9, 0.03, 0.01, { y: 1.08, z: -0.03 }), tela], [caja(0.12, 0.12, 0.035, 0.01, { y: 1.15, z: -0.05 }), mat('#c8a040', { met: 0.5 })]]);
    case 'armadura':
      return fijo([
        [caja(0.12, 0.6, 0.12, 0.02, { y: 0.3 }), maderaOsc], [caja(0.36, 0.38, 0.24, 0.08, { y: 0.8 }), mat('#7a7e86', { met: 0.7, rug: 0.4 })],
        [caja(0.26, 0.26, 0.26, 0.08, { y: 1.12 }), mat('#7a7e86', { met: 0.7, rug: 0.4 })], [caja(0.16, 0.03, 0.02, 0.005, { y: 1.12, z: -0.13 }), mat('#111')],
      ]);
    case 'mesa':
      return fijo([[caja(1.1, 0.07, 0.6, 0.02, { y: 0.55 }), maderaOsc], ...[[-0.45, -0.22], [0.45, -0.22], [-0.45, 0.22], [0.45, 0.22]].map(([x, z]): [THREE.BufferGeometry, THREE.Material] => [caja(0.07, 0.55, 0.07, 0.01, { x, y: 0.27, z }), maderaOsc]), [cil(0.05, 0.04, 0.12, { x: 0.2, y: 0.65 }), mat('#8a7a5a')]]);
    case 'alfombra':
      return fijo([[caja(1.2, 0.015, 0.8, 0.005, { y: 0.008, ry: 0.1 }), mat('#5a1018', { rug: 1, relieve: 0.9 })], [caja(1.0, 0.017, 0.6, 0.005, { y: 0.009, ry: 0.1 }), mat('#7a2018', { rug: 1, relieve: 0.9 })]]);
    case 'jaula':
      return fijo([
        ...Array.from({ length: 8 }, (_, k): [THREE.BufferGeometry, THREE.Material] => [cil(0.012, 0.012, 1.0, { x: Math.cos((k / 8) * Math.PI * 2) * 0.3, y: 0.5, z: Math.sin((k / 8) * Math.PI * 2) * 0.3 }), hierro]),
        [toro(0.3, 0.02, { y: 1.0, rx: Math.PI / 2 }), hierro], [toro(0.3, 0.02, { y: 0.02, rx: Math.PI / 2 }), hierro], [caja(0.16, 0.1, 0.12, 0.04, { y: 0.05 }), hueso_],
      ]);
    default:
      return fijo([[caja(0.3, 0.3, 0.3, 0.05, { y: 0.15 }), piedra]]);
  }
}

/** Qué decoración tiene luz propia (para la rejilla de luz): color e intensidad. */
export const DECO_LUZ: Record<string, [string, number, number]> = {
  velas: ['#ffb060', 0.9, 3.5],
  farol: ['#ffb060', 1.1, 4.5],
  candelabro: ['#ffb060', 1.1, 4.5],
  cristal: ['#ff2030', 0.8, 3.5],
};
