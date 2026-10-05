// Modelos de reemplazo hechos por código, con las mismas piezas que pide el contrato de arte: así el juego se ve
// completo mientras llegan los modelos de verdad (enemigos.glb, jefes.glb…) y se cambian solos cuando existen.
// Estilo: muñecos de arcilla oscura, cabezas grandes, ojos que brillan en la oscuridad. Todos miran hacia −Z.
import * as THREE from 'three';
import { bola, caja, capsula, cil, cono, hueso, mat, toro, tf, mergeGeometries } from './formas';
import { PIEZA, modeloDePiezas, type ModeloPiezas, type PiezaSuelta } from './piezas';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

class Armado {
  piezas: PiezaSuelta[] = [];
  piv: Partial<Record<number, THREE.Vector3>> = {};
  mats: Record<string, THREE.MeshStandardMaterial> = {};
  constructor(public escala = 1) {}
  material(clave: string, m: THREE.MeshStandardMaterial) {
    this.mats[clave] = m;
    return clave;
  }
  add(pieza: keyof typeof PIEZA, g: THREE.BufferGeometry, m: string) {
    this.piezas.push({ pieza: PIEZA[pieza], geo: g, mat: m });
  }
  pivote(pieza: keyof typeof PIEZA, x: number, y: number, z: number) {
    this.piv[PIEZA[pieza]] = V(x, y, z);
  }
  fin(mov = new THREE.Vector4(1, 1, 1, 1)): ModeloPiezas {
    if (this.escala !== 1) {
      for (const p of this.piezas) p.geo.scale(this.escala, this.escala, this.escala);
      for (const k of Object.keys(this.piv)) this.piv[+k]!.multiplyScalar(this.escala);
    }
    return modeloDePiezas(this.piezas, this.piv, this.mats, mov);
  }
}

interface OpHumano {
  piel: string;
  ropa: string;
  ropa2?: string;
  ojos: string;
  /** Cuánto adelantan los brazos (0 colgando, 1 al frente como zombi). */
  brazos?: number;
  /** Cuerpo de huesos (delgado). */
  huesos?: boolean;
  /** Túnica larga en vez de piernas. */
  tunica?: boolean;
  panza?: number;
  cabeza?: 'caja' | 'calavera' | 'capucha' | 'lobo' | 'mitra' | 'casco';
  ancho?: number;
  encorvado?: number;
  /** Mandíbula separada (se abre al atacar). */
  mandibula?: boolean;
}

/** Un humanoide de arcilla con sus piezas (piernas, torso, brazos, cabeza). */
function humano(a: Armado, o: OpHumano) {
  const piel = a.material('piel', mat(o.piel));
  const ropa = a.material('ropa', mat(o.ropa));
  const ropa2 = a.material('ropa2', mat(o.ropa2 ?? o.ropa, { rug: 0.9 }));
  const ojos = a.material('ojos', mat('#111111', { e: o.ojos, ei: 3.2, relieve: 0 }));
  const oscuro = a.material('oscuro', mat('#0c0a0a', { relieve: 0 }));
  const w = o.ancho ?? 1;
  const enc = o.encorvado ?? 0;
  const r = o.huesos ? 0.045 : 0.075;
  // Piernas (o túnica)
  if (o.tunica) {
    a.add('cuerpo', cono(0.3 * w, 0.62, { y: 0.31 }, 10), ropa2);
    a.pivote('pierna_izq', -0.08, 0.3, 0);
    a.pivote('pierna_der', 0.08, 0.3, 0);
  } else {
    a.pivote('pierna_izq', -0.1 * w, 0.42, 0);
    a.pivote('pierna_der', 0.1 * w, 0.42, 0);
    a.add('pierna_izq', hueso(V(-0.1 * w, 0.42, 0), V(-0.11 * w, 0.08, 0.01), r + 0.01), o.huesos ? piel : ropa2);
    a.add('pierna_der', hueso(V(0.1 * w, 0.42, 0), V(0.11 * w, 0.08, 0.01), r + 0.01), o.huesos ? piel : ropa2);
    a.add('pierna_izq', caja(0.13, 0.08, 0.2, 0.03, { x: -0.11 * w, y: 0.04, z: -0.03 }), oscuro);
    a.add('pierna_der', caja(0.13, 0.08, 0.2, 0.03, { x: 0.11 * w, y: 0.04, z: -0.03 }), oscuro);
  }
  // Torso
  if (o.huesos) {
    a.add('cuerpo', cil(0.03, 0.03, 0.36, { y: 0.58 }), piel);
    for (let k = 0; k < 4; k++) a.add('cuerpo', toro(0.12 - k * 0.012, 0.022, { y: 0.7 - k * 0.07, rx: Math.PI / 2, sz: 0.75 }), piel);
    a.add('cuerpo', caja(0.24, 0.08, 0.14, 0.03, { y: 0.42 }), piel);
  } else {
    a.add('cuerpo', caja(0.38 * w, 0.38, 0.26, 0.09, { y: 0.6, rx: enc * 0.4, z: -enc * 0.08 }), ropa);
    if (o.panza) a.add('cuerpo', bola(0.24 * o.panza, { y: 0.55, z: -0.08, sy: 0.9 }), ropa);
    a.add('cuerpo', caja(0.4 * w, 0.06, 0.28, 0.02, { y: 0.44 }), ropa2);
  }
  // Brazos
  const b = o.brazos ?? 0;
  const hy = 0.74 - enc * 0.05;
  a.pivote('brazo_izq', -0.24 * w, hy, -enc * 0.1);
  a.pivote('brazo_der', 0.24 * w, hy, -enc * 0.1);
  const mano = (s: number) => V(s * 0.27 * w, hy - 0.32 + b * 0.22, -enc * 0.1 - b * 0.3);
  a.add('brazo_izq', hueso(V(-0.24 * w, hy, -enc * 0.1), mano(-1), r), o.huesos ? piel : ropa);
  a.add('brazo_der', hueso(V(0.24 * w, hy, -enc * 0.1), mano(1), r), o.huesos ? piel : ropa);
  a.add('brazo_izq', bola(r + 0.025, { x: mano(-1).x, y: mano(-1).y, z: mano(-1).z }), piel);
  a.add('brazo_der', bola(r + 0.025, { x: mano(1).x, y: mano(1).y, z: mano(1).z }), piel);
  // Cabeza (grande, como los muñecos)
  const cy = 0.97 - enc * 0.08, cz = -enc * 0.16;
  a.pivote('cabeza', 0, 0.78 - enc * 0.06, cz * 0.5);
  const forma = o.cabeza ?? 'caja';
  if (forma === 'calavera') {
    a.add('cabeza', caja(0.3, 0.27, 0.3, 0.11, { y: cy + 0.02, z: cz }), piel);
    a.add('cabeza', bola(0.045, { x: -0.07, y: cy + 0.02, z: cz - 0.135, sz: 0.5 }), oscuro);
    a.add('cabeza', bola(0.045, { x: 0.07, y: cy + 0.02, z: cz - 0.135, sz: 0.5 }), oscuro);
  } else if (forma === 'lobo') {
    a.add('cabeza', caja(0.34, 0.3, 0.32, 0.12, { y: cy, z: cz }), piel);
    a.add('cabeza', caja(0.16, 0.13, 0.22, 0.05, { y: cy - 0.05, z: cz - 0.22 }), piel);
    a.add('cabeza', cono(0.06, 0.16, { x: -0.11, y: cy + 0.2, z: cz }, 5), piel);
    a.add('cabeza', cono(0.06, 0.16, { x: 0.11, y: cy + 0.2, z: cz }, 5), piel);
  } else {
    a.add('cabeza', caja(0.36, 0.33, 0.33, 0.13, { y: cy, z: cz }), piel);
  }
  // Ojos que brillan
  const oz = cz - (forma === 'lobo' ? 0.165 : 0.168);
  a.add('cabeza', bola(0.032, { x: -0.075, y: cy + 0.02, z: oz, sz: 0.5 }, 8), ojos);
  a.add('cabeza', bola(0.032, { x: 0.075, y: cy + 0.02, z: oz, sz: 0.5 }, 8), ojos);
  if (o.mandibula) {
    a.pivote('mandibula', 0, cy - 0.1, cz - 0.05);
    a.add('mandibula', caja(0.24, 0.07, 0.2, 0.03, { y: cy - 0.15, z: cz - 0.06 }), forma === 'calavera' ? piel : oscuro);
  }
  if (forma === 'capucha') a.add('cabeza', caja(0.42, 0.4, 0.38, 0.16, { y: cy + 0.04, z: cz + 0.03 }), ropa2);
  if (forma === 'mitra') {
    a.add('cabeza', cono(0.15, 0.36, { y: cy + 0.32, z: cz }, 4), ropa2);
    a.add('cabeza', caja(0.4, 0.38, 0.36, 0.15, { y: cy + 0.03, z: cz + 0.03 }), ropa);
  }
  if (forma === 'casco') {
    a.add('cabeza', caja(0.4, 0.3, 0.38, 0.12, { y: cy + 0.06, z: cz + 0.01 }), ropa);
    a.add('cabeza', cono(0.05, 0.2, { x: -0.16, y: cy + 0.24, rz: 0.5 }, 5), ropa2);
    a.add('cabeza', cono(0.05, 0.2, { x: 0.16, y: cy + 0.24, rz: -0.5 }, 5), ropa2);
  }
  return { piel, ropa, ropa2, ojos, oscuro, mano, cy, cz };
}

// ------------------------------------------------------------------------------------------------- Enemigos
type Hacer = () => ModeloPiezas;

const HACER: Record<string, Hacer> = {
  zombi: () => {
    const a = new Armado(1.0);
    const h = humano(a, { piel: '#6f7d58', ropa: '#4a3b2e', ropa2: '#3a3026', ojos: '#d8ff6a', brazos: 0.95, encorvado: 0.35, mandibula: true });
    a.add('cuerpo', caja(0.1, 0.12, 0.02, 0.01, { x: 0.1, y: 0.62, z: -0.14 }), h.piel);
    return a.fin(new THREE.Vector4(0.8, 0.4, 1, 1));
  },
  zombi_gordo: () => {
    const a = new Armado(1.25);
    const h = humano(a, { piel: '#7a8a5a', ropa: '#5a4636', ojos: '#e8ff7a', brazos: 0.7, panza: 1.25, ancho: 1.35, encorvado: 0.2, mandibula: true });
    a.add('cuerpo', bola(0.08, { x: 0.12, y: 0.5, z: -0.27 }), h.piel);
    return a.fin(new THREE.Vector4(0.5, 0.4, 1.4, 1));
  },
  esqueleto: () => {
    const a = new Armado(1.0);
    humano(a, { piel: '#d9d0b6', ropa: '#3a3428', ojos: '#ff3a2a', huesos: true, cabeza: 'calavera', mandibula: true });
    return a.fin();
  },
  esqueleto_arquero: () => {
    const a = new Armado(1.0);
    const h = humano(a, { piel: '#d4cab0', ropa: '#2e3a2e', ropa2: '#28322a', ojos: '#ff5a2a', huesos: true, cabeza: 'capucha', brazos: 0.6, mandibula: true });
    const mano = h.mano(-1);
    a.add('brazo_izq', toro(0.26, 0.018, { x: mano.x - 0.02, y: mano.y + 0.05, z: mano.z, ry: Math.PI / 2 }, Math.PI), a.material('madera', mat('#5a3a20')));
    return a.fin();
  },
  cuervo: () => {
    const a = new Armado(1.0);
    const negro = a.material('negro', mat('#17151a', { rug: 0.7 }));
    const pico = a.material('pico', mat('#3a3428'));
    const ojos = a.material('ojos', mat('#111', { e: '#ff2a2a', ei: 3.5, relieve: 0 }));
    a.add('cuerpo', bola(0.16, { y: 0.0, sz: 1.5 }), negro);
    a.add('cola', cono(0.09, 0.22, { y: 0, z: 0.28, rx: -Math.PI / 2, sx: 1.6, sy: 0.4 }, 5), negro);
    a.pivote('cola', 0, 0, 0.18);
    a.add('cabeza', bola(0.11, { y: 0.08, z: -0.2 }), negro);
    a.add('cabeza', cono(0.04, 0.14, { y: 0.06, z: -0.33, rx: -Math.PI / 2 }, 5), pico);
    a.add('cabeza', bola(0.022, { x: -0.06, y: 0.1, z: -0.27 }, 6), ojos);
    a.add('cabeza', bola(0.022, { x: 0.06, y: 0.1, z: -0.27 }, 6), ojos);
    a.pivote('cabeza', 0, 0.05, -0.16);
    a.pivote('ala_izq', -0.1, 0.05, 0);
    a.pivote('ala_der', 0.1, 0.05, 0);
    a.add('ala_izq', caja(0.42, 0.03, 0.22, 0.01, { x: -0.3, y: 0.05, z: 0.02 }), negro);
    a.add('ala_der', caja(0.42, 0.03, 0.22, 0.01, { x: 0.3, y: 0.05, z: 0.02 }), negro);
    return a.fin(new THREE.Vector4(0, 0, 0.3, 2.2));
  },
  murcielago: () => {
    const a = new Armado(0.9);
    const piel = a.material('piel', mat('#2a2024'));
    const ala = a.material('ala', mat('#3a262c', { rug: 0.6 }));
    const ojos = a.material('ojos', mat('#111', { e: '#ff3a3a', ei: 3.5, relieve: 0 }));
    a.add('cuerpo', bola(0.12, { sy: 1.2 }), piel);
    a.add('cabeza', bola(0.1, { y: 0.12, z: -0.05 }), piel);
    a.add('cabeza', cono(0.04, 0.1, { x: -0.06, y: 0.24, z: -0.04 }, 4), piel);
    a.add('cabeza', cono(0.04, 0.1, { x: 0.06, y: 0.24, z: -0.04 }, 4), piel);
    a.add('cabeza', bola(0.02, { x: -0.04, y: 0.13, z: -0.14 }, 6), ojos);
    a.add('cabeza', bola(0.02, { x: 0.04, y: 0.13, z: -0.14 }, 6), ojos);
    a.pivote('cabeza', 0, 0.06, 0);
    a.pivote('ala_izq', -0.08, 0.05, 0);
    a.pivote('ala_der', 0.08, 0.05, 0);
    a.add('ala_izq', cono(0.22, 0.42, { x: -0.28, y: 0.04, rz: Math.PI / 2, sz: 0.12 }, 3), ala);
    a.add('ala_der', cono(0.22, 0.42, { x: 0.28, y: 0.04, rz: -Math.PI / 2, sz: 0.12 }, 3), ala);
    return a.fin(new THREE.Vector4(0, 0, 0.3, 3));
  },
  perro_huesos: () => {
    const a = new Armado(1.0);
    const hueso_ = a.material('hueso', mat('#d8cfb4'));
    const ojos = a.material('ojos', mat('#111', { e: '#ff3a1a', ei: 3, relieve: 0 }));
    const rojo = a.material('carne', mat('#5a1a1a'));
    a.add('cuerpo', capsula(0.13, 0.36, { y: 0.42, rx: Math.PI / 2 }), hueso_);
    for (let k = 0; k < 4; k++) a.add('cuerpo', toro(0.11, 0.02, { y: 0.42, z: -0.15 + k * 0.1 }), hueso_);
    a.pivote('pierna_izq', 0, 0.36, 0);
    a.pivote('pierna_der', 0, 0.36, 0);
    a.add('pierna_izq', hueso(V(-0.1, 0.36, -0.2), V(-0.1, 0.03, -0.24), 0.035), hueso_);
    a.add('pierna_izq', hueso(V(0.1, 0.36, 0.2), V(0.1, 0.03, 0.18), 0.035), hueso_);
    a.add('pierna_der', hueso(V(0.1, 0.36, -0.2), V(0.1, 0.03, -0.24), 0.035), hueso_);
    a.add('pierna_der', hueso(V(-0.1, 0.36, 0.2), V(-0.1, 0.03, 0.18), 0.035), hueso_);
    a.pivote('cabeza', 0, 0.48, -0.25);
    a.add('cabeza', caja(0.2, 0.17, 0.3, 0.06, { y: 0.55, z: -0.38 }), hueso_);
    a.add('cabeza', bola(0.025, { x: -0.06, y: 0.6, z: -0.5 }, 6), ojos);
    a.add('cabeza', bola(0.025, { x: 0.06, y: 0.6, z: -0.5 }, 6), ojos);
    a.pivote('mandibula', 0, 0.5, -0.3);
    a.add('mandibula', caja(0.16, 0.05, 0.26, 0.02, { y: 0.46, z: -0.42 }), rojo);
    a.pivote('cola', 0, 0.45, 0.25);
    a.add('cola', hueso(V(0, 0.45, 0.25), V(0, 0.6, 0.5), 0.025), hueso_);
    return a.fin(new THREE.Vector4(1.2, 0, 1, 1));
  },
  ghoul: () => {
    const a = new Armado(1.0);
    const h = humano(a, { piel: '#7c8276', ropa: '#4a4c44', ropa2: '#3a3a34', ojos: '#fff07a', brazos: 0.5, encorvado: 0.6, mandibula: true });
    // Garras largas
    for (const s of [-1, 1]) {
      const m = h.mano(s);
      for (let k = -1; k <= 1; k++) a.add(s < 0 ? 'brazo_izq' : 'brazo_der', cono(0.015, 0.12, { x: m.x + k * 0.03, y: m.y - 0.07, z: m.z - 0.02, rx: Math.PI }, 4), h.oscuro);
    }
    return a.fin(new THREE.Vector4(1.1, 0.8, 1.3, 1));
  },
  arana_cripta: () => {
    const a = new Armado(1.15);
    const negro = a.material('negro', mat('#221c1a', { rug: 0.6 }));
    const rojo = a.material('marca', mat('#6a1414'));
    const ojos = a.material('ojos', mat('#111', { e: '#ff2020', ei: 3.5, relieve: 0 }));
    a.add('cuerpo', bola(0.17, { y: 0.24, z: 0.16, sz: 1.3 }), negro);
    a.add('cuerpo', bola(0.06, { y: 0.4, z: 0.18 }), rojo);
    a.add('cabeza', bola(0.11, { y: 0.22, z: -0.08 }), negro);
    for (let k = 0; k < 4; k++) a.add('cabeza', bola(0.018, { x: -0.045 + k * 0.03, y: 0.27 + (k % 2) * 0.02, z: -0.17 }, 6), ojos);
    a.pivote('cabeza', 0, 0.22, 0);
    a.pivote('pierna_izq', 0, 0.24, 0);
    a.pivote('pierna_der', 0, 0.24, 0);
    for (let k = 0; k < 4; k++) {
      const z = -0.12 + k * 0.1;
      a.add(k % 2 ? 'pierna_der' : 'pierna_izq', hueso(V(-0.08, 0.25, z), V(-0.3, 0.32, z - 0.03), 0.02), negro);
      a.add(k % 2 ? 'pierna_der' : 'pierna_izq', hueso(V(-0.3, 0.32, z - 0.03), V(-0.38, 0.02, z - 0.05), 0.018), negro);
      a.add(k % 2 ? 'pierna_izq' : 'pierna_der', hueso(V(0.08, 0.25, z), V(0.3, 0.32, z - 0.03), 0.02), negro);
      a.add(k % 2 ? 'pierna_izq' : 'pierna_der', hueso(V(0.3, 0.32, z - 0.03), V(0.38, 0.02, z - 0.05), 0.018), negro);
    }
    return a.fin(new THREE.Vector4(0.5, 0, 0.4, 1));
  },
  espectro: () => {
    const a = new Armado(1.05);
    const tela = a.material('tela', mat('#9ec4d8', { e: '#3a6a8a', ei: 0.9, rug: 0.5, transp: 0.78 }));
    const ojos = a.material('ojos', mat('#111', { e: '#c8f4ff', ei: 4, relieve: 0 }));
    const hueco = a.material('hueco', mat('#06080c', { relieve: 0 }));
    a.add('cuerpo', cono(0.3, 0.85, { y: 0.48, rx: Math.PI, sx: 1, sz: 0.85 }, 9), tela);
    a.add('cuerpo', caja(0.34, 0.3, 0.26, 0.1, { y: 0.78 }), tela);
    a.pivote('cabeza', 0, 0.9, 0);
    a.add('cabeza', caja(0.36, 0.38, 0.34, 0.15, { y: 1.04 }), tela);
    a.add('cabeza', caja(0.24, 0.24, 0.05, 0.08, { y: 1.02, z: -0.16 }), hueco);
    a.add('cabeza', bola(0.03, { x: -0.06, y: 1.05, z: -0.19 }, 6), ojos);
    a.add('cabeza', bola(0.03, { x: 0.06, y: 1.05, z: -0.19 }, 6), ojos);
    a.pivote('brazo_izq', -0.2, 0.84, 0);
    a.pivote('brazo_der', 0.2, 0.84, 0);
    a.add('brazo_izq', hueso(V(-0.2, 0.84, 0), V(-0.3, 0.62, -0.3), 0.05), tela);
    a.add('brazo_der', hueso(V(0.2, 0.84, 0), V(0.3, 0.62, -0.3), 0.05), tela);
    return a.fin(new THREE.Vector4(0, 0.6, 0.2, 1));
  },
  minero_maldito: () => {
    const a = new Armado(1.0);
    const h = humano(a, { piel: '#7a7462', ropa: '#4a3c2c', ropa2: '#33291e', ojos: '#ffb03a', brazos: 0.4, encorvado: 0.2, cabeza: 'casco', mandibula: true });
    a.add('cabeza', bola(0.05, { y: h.cy + 0.14, z: h.cz - 0.19 }, 8), a.material('lampara', mat('#fff', { e: '#ffcf6a', ei: 4, relieve: 0 })));
    const m = h.mano(1);
    a.add('brazo_der', cil(0.018, 0.018, 0.5, { x: m.x, y: m.y + 0.1, z: m.z }), a.material('madera', mat('#5a3a20')));
    a.add('brazo_der', caja(0.36, 0.05, 0.05, 0.02, { x: m.x, y: m.y + 0.35, z: m.z }), a.material('hierro', mat('#55585e', { met: 0.5, rug: 0.5 })));
    return a.fin();
  },
  rata_peste: () => {
    const a = new Armado(1.0);
    const piel = a.material('piel', mat('#4c4038'));
    const rosa = a.material('rosa', mat('#9a6a62'));
    const ojos = a.material('ojos', mat('#111', { e: '#ff3030', ei: 3, relieve: 0 }));
    a.add('cuerpo', capsula(0.09, 0.18, { y: 0.11, rx: Math.PI / 2 }), piel);
    a.pivote('cabeza', 0, 0.12, -0.14);
    a.add('cabeza', cono(0.08, 0.18, { y: 0.12, z: -0.24, rx: -Math.PI / 2 }, 7), piel);
    a.add('cabeza', bola(0.035, { x: -0.06, y: 0.19, z: -0.16 }, 6), rosa);
    a.add('cabeza', bola(0.035, { x: 0.06, y: 0.19, z: -0.16 }, 6), rosa);
    a.add('cabeza', bola(0.015, { x: -0.04, y: 0.15, z: -0.24 }, 5), ojos);
    a.add('cabeza', bola(0.015, { x: 0.04, y: 0.15, z: -0.24 }, 5), ojos);
    a.pivote('cola', 0, 0.1, 0.15);
    a.add('cola', hueso(V(0, 0.1, 0.15), V(0.05, 0.06, 0.42), 0.015), rosa);
    a.pivote('pierna_izq', 0, 0.08, 0);
    a.pivote('pierna_der', 0, 0.08, 0);
    a.add('pierna_izq', bola(0.035, { x: -0.07, y: 0.03, z: -0.08 }, 6), piel);
    a.add('pierna_der', bola(0.035, { x: 0.07, y: 0.03, z: 0.08 }, 6), piel);
    return a.fin(new THREE.Vector4(1.4, 0, 0.6, 1));
  },
  abominacion: () => {
    const a = new Armado(1.55);
    const carne = a.material('carne', mat('#8a5a56'));
    const herida = a.material('herida', mat('#4a1414', { e: '#5a0a0a', ei: 0.6 }));
    const ojos = a.material('ojos', mat('#111', { e: '#ffe04a', ei: 3, relieve: 0 }));
    const hilo = a.material('hilo', mat('#2a2018'));
    a.add('cuerpo', bola(0.36, { y: 0.55, sy: 0.9 }), carne);
    a.add('cuerpo', bola(0.16, { x: 0.2, y: 0.75, z: -0.15 }), herida);
    a.add('cuerpo', cil(0.01, 0.01, 0.4, { x: -0.05, y: 0.6, z: -0.33, rz: 0.6 }), hilo);
    a.pivote('cabeza', 0, 0.86, -0.1);
    a.add('cabeza', caja(0.26, 0.22, 0.24, 0.08, { y: 0.95, z: -0.18 }), carne);
    a.add('cabeza', bola(0.03, { x: -0.06, y: 0.97, z: -0.3 }, 6), ojos);
    a.add('cabeza', bola(0.04, { x: 0.07, y: 0.95, z: -0.3 }, 6), ojos);
    a.pivote('brazo_izq', -0.33, 0.7, 0);
    a.pivote('brazo_der', 0.33, 0.7, 0);
    a.add('brazo_izq', hueso(V(-0.33, 0.7, 0), V(-0.42, 0.2, -0.15), 0.11), carne);
    a.add('brazo_der', hueso(V(0.33, 0.7, 0), V(0.45, 0.25, -0.2), 0.14), carne);
    a.add('brazo_der', bola(0.17, { x: 0.46, y: 0.18, z: -0.22 }), carne);
    a.pivote('pierna_izq', -0.15, 0.3, 0);
    a.pivote('pierna_der', 0.15, 0.3, 0);
    a.add('pierna_izq', hueso(V(-0.15, 0.3, 0), V(-0.18, 0.06, 0), 0.1), carne);
    a.add('pierna_der', hueso(V(0.15, 0.3, 0), V(0.18, 0.06, 0), 0.1), carne);
    return a.fin(new THREE.Vector4(0.6, 0.6, 1.5, 1));
  },
  lacayo_explosivo: () => {
    const a = new Armado(1.0);
    const h = humano(a, { piel: '#7a6a52', ropa: '#4a3a2a', ojos: '#ffd040', brazos: 0.8, encorvado: 0.3 });
    a.add('cuerpo', cil(0.17, 0.17, 0.28, { y: 0.62, z: -0.12 }), a.material('barril', mat('#5a3a20')));
    a.add('cuerpo', toro(0.175, 0.02, { y: 0.7, z: -0.12, rx: Math.PI / 2 }), a.material('aro', mat('#3a3a3a', { met: 0.5 })));
    a.add('cuerpo', bola(0.05, { y: 0.82, z: -0.12 }, 8), a.material('mecha', mat('#222', { e: '#ff7a1a', ei: 5, relieve: 0 })));
    void h;
    return a.fin(new THREE.Vector4(1.1, 0.4, 1.2, 1));
  },
  monje_caido: () => {
    const a = new Armado(1.0);
    const h = humano(a, { piel: '#8a7c6a', ropa: '#3c2e26', ropa2: '#322620', ojos: '#ff9a3a', tunica: true, cabeza: 'capucha', brazos: 0.55, encorvado: 0.25 });
    a.add('cuerpo', toro(0.2, 0.02, { y: 0.48, rx: Math.PI / 2 }), a.material('cuerda', mat('#a08a5a')));
    const m = h.mano(1);
    a.add('brazo_der', cil(0.025, 0.025, 0.12, { x: m.x, y: m.y + 0.08, z: m.z }), a.material('vela', mat('#e8dcc0')));
    a.add('brazo_der', bola(0.03, { x: m.x, y: m.y + 0.17, z: m.z }, 6), a.material('llama', mat('#222', { e: '#ffb040', ei: 5, relieve: 0 })));
    return a.fin(new THREE.Vector4(0.4, 0.5, 0.8, 1));
  },
  gargola: () => {
    const a = new Armado(1.15);
    const piedra = a.material('piedra', mat('#6c6a66', { rug: 0.95, relieve: 0.6 }));
    const ojos = a.material('ojos', mat('#111', { e: '#ff8a2a', ei: 3.5, relieve: 0 }));
    a.add('cuerpo', caja(0.38, 0.38, 0.32, 0.1, { y: 0.48, rx: 0.4 }), piedra);
    a.pivote('cabeza', 0, 0.68, -0.15);
    a.add('cabeza', caja(0.3, 0.26, 0.3, 0.09, { y: 0.78, z: -0.24 }), piedra);
    a.add('cabeza', cono(0.04, 0.18, { x: -0.1, y: 0.95, z: -0.2, rz: 0.3 }, 5), piedra);
    a.add('cabeza', cono(0.04, 0.18, { x: 0.1, y: 0.95, z: -0.2, rz: -0.3 }, 5), piedra);
    a.add('cabeza', bola(0.03, { x: -0.07, y: 0.8, z: -0.39 }, 6), ojos);
    a.add('cabeza', bola(0.03, { x: 0.07, y: 0.8, z: -0.39 }, 6), ojos);
    a.pivote('ala_izq', -0.15, 0.6, 0.1);
    a.pivote('ala_der', 0.15, 0.6, 0.1);
    a.add('ala_izq', cono(0.3, 0.6, { x: -0.45, y: 0.72, z: 0.15, rz: Math.PI / 2 + 0.4, sz: 0.1 }, 3), piedra);
    a.add('ala_der', cono(0.3, 0.6, { x: 0.45, y: 0.72, z: 0.15, rz: -Math.PI / 2 - 0.4, sz: 0.1 }, 3), piedra);
    a.pivote('pierna_izq', -0.12, 0.3, 0);
    a.pivote('pierna_der', 0.12, 0.3, 0);
    a.add('pierna_izq', hueso(V(-0.12, 0.3, 0), V(-0.15, 0.04, -0.05), 0.07), piedra);
    a.add('pierna_der', hueso(V(0.12, 0.3, 0), V(0.15, 0.04, -0.05), 0.07), piedra);
    a.pivote('brazo_izq', -0.22, 0.6, -0.1);
    a.pivote('brazo_der', 0.22, 0.6, -0.1);
    a.add('brazo_izq', hueso(V(-0.22, 0.6, -0.1), V(-0.26, 0.3, -0.3), 0.06), piedra);
    a.add('brazo_der', hueso(V(0.22, 0.6, -0.1), V(0.26, 0.3, -0.3), 0.06), piedra);
    return a.fin(new THREE.Vector4(0.4, 0.5, 0.6, 1.2));
  },
  inquisidor_muerto: () => {
    const a = new Armado(1.05);
    const h = humano(a, { piel: '#a89a88', ropa: '#5a1616', ropa2: '#c8a040', ojos: '#ffcf4a', tunica: true, cabeza: 'mitra', brazos: 0.5 });
    const m = h.mano(1);
    const oro = a.material('oro', mat('#c8a040', { met: 0.6, rug: 0.4 }));
    a.add('brazo_der', cil(0.02, 0.02, 0.7, { x: m.x, y: m.y + 0.2, z: m.z }), oro);
    a.add('brazo_der', caja(0.2, 0.04, 0.04, 0.01, { x: m.x, y: m.y + 0.48, z: m.z }), oro);
    a.add('brazo_der', bola(0.05, { x: m.x, y: m.y + 0.6, z: m.z }, 8), a.material('fuego', mat('#222', { e: '#ff7a2a', ei: 5, relieve: 0 })));
    return a.fin(new THREE.Vector4(0.3, 0.5, 0.6, 1));
  },
  nigromante: () => {
    const a = new Armado(1.05);
    const h = humano(a, { piel: '#c8c0b0', ropa: '#2a2036', ropa2: '#3a2c4c', ojos: '#c88aff', tunica: true, cabeza: 'capucha', brazos: 0.4 });
    const m = h.mano(1);
    a.add('brazo_der', cil(0.022, 0.022, 0.9, { x: m.x, y: m.y + 0.25, z: m.z }), a.material('baston', mat('#2a1e18')));
    a.add('brazo_der', bola(0.07, { x: m.x, y: m.y + 0.72, z: m.z }, 10), a.material('orbe', mat('#222', { e: '#b07aff', ei: 4, relieve: 0 })));
    a.add('cabeza', caja(0.24, 0.2, 0.05, 0.06, { y: h.cy - 0.01, z: h.cz - 0.17 }), a.material('mascara', mat('#e0d8c8')));
    return a.fin(new THREE.Vector4(0.3, 0.5, 0.6, 1));
  },
  vampiro: () => {
    const a = new Armado(1.05);
    const h = humano(a, { piel: '#d8d0d4', ropa: '#1c181e', ropa2: '#14121a', ojos: '#ff1a2a', brazos: 0.3 });
    a.pivote('extra_capa', 0, 0.76, 0.1);
    a.add('extra_capa', caja(0.5, 0.62, 0.04, 0.02, { y: 0.44, z: 0.17, rx: 0.12 }), a.material('capa', mat('#5a0c16', { rug: 0.7 })));
    a.add('extra_capa', caja(0.5, 0.18, 0.06, 0.02, { y: 0.78, z: 0.05, rx: -0.3 }), a.material('capa', mat('#5a0c16', { rug: 0.7 })));
    a.add('cabeza', caja(0.38, 0.1, 0.34, 0.04, { y: h.cy + 0.15, z: h.cz + 0.01 }), h.oscuro);
    return a.fin(new THREE.Vector4(1, 0.6, 0.6, 1));
  },
  novia_vampira: () => {
    const a = new Armado(1.05);
    const h = humano(a, { piel: '#e2dce4', ropa: '#e8e2e8', ropa2: '#d0c8d4', ojos: '#ff2a4a', tunica: true, brazos: 0.6 });
    a.add('cabeza', caja(0.44, 0.38, 0.06, 0.03, { y: h.cy + 0.02, z: h.cz + 0.16 }), a.material('velo', mat('#f0ecf4', { transp: 0.7, rug: 0.5 })));
    a.add('cabeza', caja(0.08, 0.03, 0.02, 0.01, { y: h.cy - 0.09, z: h.cz - 0.17 }), a.material('labios', mat('#8a0a1a')));
    a.add('cuerpo', cono(0.32, 0.4, { y: 0.2 }, 10), a.material('falda', mat('#c8c0cc')));
    return a.fin(new THREE.Vector4(0.2, 0.5, 0.4, 1));
  },
  hombre_lobo: () => {
    const a = new Armado(1.35);
    const h = humano(a, { piel: '#4e4036', ropa: '#5a4a3e', ropa2: '#3a2e26', ojos: '#ffd02a', cabeza: 'lobo', brazos: 0.5, encorvado: 0.45, ancho: 1.25, mandibula: true });
    for (const s of [-1, 1]) {
      const m = h.mano(s);
      for (let k = -1; k <= 1; k++) a.add(s < 0 ? 'brazo_izq' : 'brazo_der', cono(0.02, 0.14, { x: m.x + k * 0.035, y: m.y - 0.08, z: m.z, rx: Math.PI }, 4), a.material('garra', mat('#d8d0c0')));
    }
    a.pivote('cola', 0, 0.45, 0.13);
    a.add('cola', hueso(V(0, 0.45, 0.13), V(0, 0.3, 0.45), 0.06), h.piel);
    return a.fin(new THREE.Vector4(1.1, 0.8, 1.3, 1));
  },
  caballero_muerte: () => {
    const a = new Armado(1.4);
    const h = humano(a, { piel: '#3a3c42', ropa: '#2e3036', ropa2: '#6a1414', ojos: '#ff2a1a', cabeza: 'casco', brazos: 0.35, ancho: 1.2 });
    const acero = a.material('acero', mat('#7a7e86', { met: 0.6, rug: 0.45 }));
    a.add('cuerpo', caja(0.5, 0.14, 0.32, 0.05, { y: 0.74 }), acero);
    const m = h.mano(1);
    a.add('brazo_der', caja(0.06, 0.7, 0.02, 0.01, { x: m.x, y: m.y + 0.3, z: m.z - 0.05 }), acero);
    a.add('brazo_der', caja(0.2, 0.04, 0.05, 0.01, { x: m.x, y: m.y - 0.04, z: m.z - 0.05 }), h.oscuro);
    a.pivote('extra_capa', 0, 0.76, 0.1);
    a.add('extra_capa', caja(0.5, 0.65, 0.04, 0.02, { y: 0.42, z: 0.17, rx: 0.1 }), h.ropa2);
    return a.fin(new THREE.Vector4(0.7, 0.4, 0.6, 1));
  },
  // ----------------------------------------------------------------------------------------- Altar y jefes
  altar: () => {
    const a = new Armado(1.0);
    const piedra = a.material('piedra', mat('#4a4440', { rug: 0.95, relieve: 0.6 }));
    const sangre = a.material('sangre', mat('#300', { e: '#c0101a', ei: 2.4, relieve: 0 }));
    const cera = a.material('cera', mat('#d8ccb0'));
    const llama = a.material('llama', mat('#222', { e: '#ffb050', ei: 5, relieve: 0 }));
    a.add('cuerpo', caja(1.1, 0.75, 0.75, 0.06, { y: 0.375 }), piedra);
    a.add('cuerpo', caja(1.25, 0.1, 0.9, 0.03, { y: 0.8 }), piedra);
    a.add('cuerpo', cil(0.28, 0.2, 0.18, { y: 0.94 }), piedra);
    a.add('cuerpo', cil(0.24, 0.24, 0.04, { y: 1.02 }), sangre);
    for (const [x, z] of [[-0.5, -0.32], [0.5, -0.32], [-0.52, 0.3], [0.48, 0.32]]) {
      a.add('cuerpo', cil(0.04, 0.045, 0.22 + Math.abs(x) * 0.1, { x, y: 0.97, z }), cera);
      a.add('cuerpo', cono(0.025, 0.07, { x, y: 1.15 + Math.abs(x) * 0.05, z }, 6), llama);
    }
    a.add('cuerpo', caja(0.5, 0.3, 0.05, 0.02, { y: 0.45, z: -0.39 }), sangre);
    return a.fin(new THREE.Vector4(0, 0, 0, 0));
  },
  golem_osarios: () => {
    const a = new Armado(2.2);
    const hueso_ = a.material('hueso', mat('#d6ccb0', { relieve: 0.5 }));
    const viejo = a.material('viejo', mat('#a89c80', { relieve: 0.5 }));
    const ojos = a.material('ojos', mat('#111', { e: '#ff2a1a', ei: 4, relieve: 0 }));
    const az = (k: number) => Math.sin(k * 12.9898) * 0.5 + 0.5;
    // Cuerpo: un montón de huesos y calaveras
    for (let k = 0; k < 26; k++) {
      const t = k / 26;
      const ang = k * 2.4;
      const r = 0.22 + az(k) * 0.12;
      a.add('cuerpo', capsula(0.035, 0.24, { x: Math.cos(ang) * r, y: 0.45 + t * 0.45, z: Math.sin(ang) * r * 0.8, rx: az(k + 1) * 3, rz: az(k + 2) * 3 }), k % 3 ? hueso_ : viejo);
    }
    for (let k = 0; k < 5; k++) a.add('cuerpo', caja(0.12, 0.11, 0.12, 0.05, { x: Math.cos(k * 1.3) * 0.25, y: 0.55 + k * 0.08, z: -0.22 + Math.sin(k) * 0.05 }), viejo);
    a.pivote('cabeza', 0, 0.95, -0.05);
    a.add('cabeza', caja(0.32, 0.28, 0.3, 0.1, { y: 1.1, z: -0.08 }), hueso_);
    a.add('cabeza', bola(0.045, { x: -0.07, y: 1.11, z: -0.24, sz: 0.5 }), ojos);
    a.add('cabeza', bola(0.045, { x: 0.07, y: 1.11, z: -0.24, sz: 0.5 }), ojos);
    a.pivote('mandibula', 0, 1.0, -0.1);
    a.add('mandibula', caja(0.24, 0.07, 0.22, 0.03, { y: 0.96, z: -0.14 }), viejo);
    for (const s of [-1, 1]) {
      const p = s < 0 ? 'brazo_izq' : 'brazo_der';
      a.pivote(p, s * 0.32, 0.85, 0);
      a.add(p, hueso(V(s * 0.32, 0.85, 0), V(s * 0.48, 0.45, -0.1), 0.08), hueso_);
      a.add(p, bola(0.16, { x: s * 0.5, y: 0.36, z: -0.12 }), viejo);
      const q = s < 0 ? 'pierna_izq' : 'pierna_der';
      a.pivote(q, s * 0.15, 0.45, 0);
      a.add(q, hueso(V(s * 0.15, 0.45, 0), V(s * 0.2, 0.08, 0), 0.09), hueso_);
    }
    return a.fin(new THREE.Vector4(0.5, 0.5, 1, 1));
  },
  abadesa: () => {
    const a = new Armado(1.9);
    const tela = a.material('tela', mat('#c8d4dc', { e: '#3a5a6a', ei: 0.7, rug: 0.5, transp: 0.85 }));
    const negro = a.material('negro', mat('#14181e'));
    const ojos = a.material('ojos', mat('#111', { e: '#dff6ff', ei: 4.5, relieve: 0 }));
    const boca = a.material('boca', mat('#020304', { relieve: 0 }));
    a.add('cuerpo', cono(0.38, 1.0, { y: 0.55, rx: Math.PI, sz: 0.8 }, 10), tela);
    a.add('cuerpo', caja(0.4, 0.34, 0.28, 0.1, { y: 0.92 }), negro);
    a.pivote('cabeza', 0, 1.06, 0);
    a.add('cabeza', caja(0.34, 0.36, 0.32, 0.13, { y: 1.22 }), tela);
    a.add('cabeza', caja(0.48, 0.5, 0.42, 0.18, { y: 1.26, z: 0.04 }), negro);
    a.add('cabeza', bola(0.035, { x: -0.07, y: 1.27, z: -0.165 }, 6), ojos);
    a.add('cabeza', bola(0.035, { x: 0.07, y: 1.27, z: -0.165 }, 6), ojos);
    a.pivote('mandibula', 0, 1.14, -0.12);
    a.add('mandibula', caja(0.1, 0.14, 0.03, 0.02, { y: 1.12, z: -0.165 }), boca);
    for (const s of [-1, 1]) {
      const p = s < 0 ? 'brazo_izq' : 'brazo_der';
      a.pivote(p, s * 0.22, 1.0, 0);
      a.add(p, hueso(V(s * 0.22, 1.0, 0), V(s * 0.45, 0.65, -0.35), 0.06), tela);
      a.add(p, hueso(V(s * 0.45, 0.65, -0.35), V(s * 0.5, 0.5, -0.5), 0.03), a.material('dedos', mat('#d0d8e0')));
    }
    return a.fin(new THREE.Vector4(0, 0.6, 0.2, 1));
  },
  gusano_sangre: () => {
    const a = new Armado(2.0);
    const carne = a.material('carne', mat('#7a2424', { rug: 0.6 }));
    const anillo = a.material('anillo', mat('#a85a4a'));
    const dientes = a.material('dientes', mat('#e8dcc0'));
    const garganta = a.material('garganta', mat('#200', { e: '#8a0a0a', ei: 1.5, relieve: 0 }));
    for (let k = 0; k < 7; k++) {
      const y = 0.15 + k * 0.17, z = k * 0.04 - 0.05;
      a.add('cuerpo', bola(0.3 - k * 0.015, { y, z, sy: 0.75 }), carne);
      a.add('cuerpo', toro(0.27 - k * 0.015, 0.03, { y: y + 0.08, z, rx: Math.PI / 2 }), anillo);
    }
    a.pivote('cabeza', 0, 1.25, 0.2);
    a.add('cabeza', bola(0.3, { y: 1.42, z: 0.05, sy: 0.9 }), carne);
    a.add('cabeza', cil(0.2, 0.2, 0.06, { y: 1.42, z: -0.22, rx: Math.PI / 2 }), garganta);
    for (let k = 0; k < 10; k++) {
      const ang = (k / 10) * Math.PI * 2;
      a.add('cabeza', cono(0.035, 0.12, { x: Math.cos(ang) * 0.19, y: 1.42 + Math.sin(ang) * 0.19, z: -0.25, rx: -Math.PI / 2 }, 4), dientes);
    }
    return a.fin(new THREE.Vector4(0, 0, 0.6, 1));
  },
  obispo_hueco: () => {
    const a = new Armado(2.1);
    const h = humano(a, { piel: '#c8baa0', ropa: '#e2d4b0', ropa2: '#8a1a1a', ojos: '#ff8a2a', tunica: true, cabeza: 'mitra', brazos: 0.4 });
    a.add('cabeza', caja(0.24, 0.22, 0.05, 0.08, { y: h.cy, z: h.cz - 0.17 }), a.material('hueco', mat('#100604', { e: '#ff5a10', ei: 1.8, relieve: 0 })));
    const m = h.mano(1);
    const oro = a.material('oro', mat('#c8a040', { met: 0.6, rug: 0.4 }));
    a.add('brazo_der', cil(0.025, 0.025, 1.1, { x: m.x, y: m.y + 0.35, z: m.z }), oro);
    a.add('brazo_der', toro(0.09, 0.02, { x: m.x + 0.06, y: m.y + 0.95, z: m.z }, Math.PI * 1.3), oro);
    a.add('cuerpo', caja(0.14, 0.5, 0.02, 0.01, { y: 0.55, z: -0.27 }), h.ropa2);
    return a.fin(new THREE.Vector4(0.2, 0.5, 0.4, 1));
  },
  conde: () => conde(false),
  conde_alas: () => conde(true),
  // ----------------------------------------------------------------------------------------- Aliados y cosas con piezas
  aliado_caballero: () => {
    const a = new Armado(1.0);
    const h = humano(a, { piel: '#9aa4b0', ropa: '#8a96a6', ropa2: '#2a4a8a', ojos: '#a8d8ff', cabeza: 'casco', brazos: 0.3 });
    const oro = a.material('oro', mat('#c8a040', { met: 0.6, rug: 0.4 }));
    const m = h.mano(1), mi = h.mano(-1);
    a.add('brazo_der', caja(0.05, 0.5, 0.02, 0.01, { x: m.x, y: m.y + 0.22, z: m.z - 0.04 }), a.material('acero', mat('#c8ccd4', { met: 0.6, rug: 0.35 })));
    a.add('brazo_izq', caja(0.26, 0.32, 0.04, 0.03, { x: mi.x - 0.04, y: mi.y + 0.05, z: mi.z - 0.08 }), h.ropa2);
    a.add('brazo_izq', caja(0.06, 0.2, 0.02, 0.01, { x: mi.x - 0.04, y: mi.y + 0.05, z: mi.z - 0.1 }), oro);
    return a.fin();
  },
  aliado_ballestero: () => {
    const a = new Armado(1.0);
    const h = humano(a, { piel: '#c8a888', ropa: '#5a4a32', ropa2: '#2a4a3a', ojos: '#a8ffd0', cabeza: 'capucha', brazos: 0.75 });
    const m = h.mano(1);
    a.add('brazo_der', caja(0.36, 0.04, 0.06, 0.01, { x: m.x - 0.05, y: m.y, z: m.z - 0.05 }), a.material('madera', mat('#5a3a20')));
    return a.fin();
  },
  torreta: () => {
    const a = new Armado(1.0);
    const madera = a.material('madera', mat('#5a4028'));
    const hierro = a.material('hierro', mat('#55585e', { met: 0.6, rug: 0.45 }));
    for (let k = 0; k < 3; k++) {
      const ang = (k / 3) * Math.PI * 2;
      a.add('cuerpo', hueso(V(0, 0.55, 0), V(Math.cos(ang) * 0.32, 0, Math.sin(ang) * 0.32), 0.03), madera);
    }
    a.pivote('cabeza', 0, 0.6, 0);
    a.add('cabeza', caja(0.12, 0.12, 0.6, 0.03, { y: 0.66 }), madera);
    a.add('cabeza', toro(0.28, 0.02, { y: 0.66, z: -0.2, rx: Math.PI / 2, rz: Math.PI }, Math.PI), hierro);
    a.add('cabeza', caja(0.04, 0.04, 0.4, 0.01, { y: 0.74, z: -0.15 }), hierro);
    return a.fin(new THREE.Vector4(0, 0, 0, 0));
  },
  trampa: () => {
    const a = new Armado(1.0);
    const hierro = a.material('hierro', mat('#4a4c52', { met: 0.6, rug: 0.5 }));
    a.add('cuerpo', toro(0.26, 0.025, { y: 0.03, rx: Math.PI / 2 }), hierro);
    for (let k = 0; k < 10; k++) {
      const ang = (k / 10) * Math.PI * 2;
      a.add('cuerpo', cono(0.025, 0.12, { x: Math.cos(ang) * 0.24, y: 0.09, z: Math.sin(ang) * 0.24, rz: Math.cos(ang) * 0.6, rx: -Math.sin(ang) * 0.6 }, 4), hierro);
    }
    return a.fin(new THREE.Vector4(0, 0, 0, 0));
  },
  totem: () => {
    const a = new Armado(1.0);
    const madera = a.material('madera', mat('#3a2a1e'));
    const hueso_ = a.material('hueso', mat('#d8ccb0'));
    const ojos = a.material('ojos', mat('#111', { e: '#b07aff', ei: 4, relieve: 0 }));
    a.add('cuerpo', cil(0.07, 0.09, 1.3, { y: 0.65 }), madera);
    for (let k = 0; k < 3; k++) {
      a.add('cuerpo', caja(0.2, 0.18, 0.2, 0.07, { y: 0.55 + k * 0.32, ry: k }), hueso_);
      a.add('cuerpo', bola(0.025, { x: -0.04, y: 0.57 + k * 0.32, z: -0.1 }, 6), ojos);
      a.add('cuerpo', bola(0.025, { x: 0.04, y: 0.57 + k * 0.32, z: -0.1 }, 6), ojos);
    }
    for (let k = 0; k < 5; k++) a.add('cuerpo', cono(0.03, 0.3, { x: Math.cos(k) * 0.12, y: 1.3, z: Math.sin(k) * 0.12, rz: Math.cos(k) * 0.6 }, 3), a.material('pluma', mat('#1a161e')));
    return a.fin(new THREE.Vector4(0, 0, 0, 0));
  },
  espiga: () => {
    const a = new Armado(1.0);
    const oro = a.material('trigo', mat('#c8a040', { e: '#5a4010', ei: 0.4 }));
    const tallo = a.material('tallo', mat('#8a7a3a'));
    for (let k = 0; k < 7; k++) {
      const ang = k * 0.9, r = 0.05 + (k % 3) * 0.02;
      a.add('cuerpo', hueso(V(Math.cos(ang) * 0.02, 0, Math.sin(ang) * 0.02), V(Math.cos(ang) * r * 2, 0.55, Math.sin(ang) * r * 2), 0.008), tallo);
      a.add('cuerpo', capsula(0.025, 0.12, { x: Math.cos(ang) * r * 2.1, y: 0.62, z: Math.sin(ang) * r * 2.1, rz: Math.cos(ang) * 0.3 }), oro);
    }
    a.add('cuerpo', toro(0.06, 0.015, { y: 0.2, rx: Math.PI / 2 }), a.material('lazo', mat('#8a2a1a')));
    return a.fin(new THREE.Vector4(0, 0, 0, 0));
  },
  prisionero: () => {
    const a = new Armado(1.0);
    const h = humano(a, { piel: '#c8a48a', ropa: '#6a6458', ropa2: '#5a544a', ojos: '#e8e0d0', brazos: 0.2, encorvado: 0.3 });
    const hierro = a.material('hierro', mat('#4a4c52', { met: 0.6, rug: 0.5 }));
    for (const s of [-1, 1]) {
      const m = h.mano(s);
      a.add(s < 0 ? 'brazo_izq' : 'brazo_der', toro(0.045, 0.015, { x: m.x, y: m.y + 0.04, z: m.z, rx: Math.PI / 2 }), hierro);
    }
    return a.fin(new THREE.Vector4(0.8, 0.4, 0.6, 1));
  },
};

function conde(alas: boolean): ModeloPiezas {
  const a = new Armado(1.9);
  const h = humano(a, { piel: '#e4dcdc', ropa: '#16121a', ropa2: '#7a0a16', ojos: '#ff1020', brazos: 0.3, ancho: 1.05 });
  const oro = a.material('oro', mat('#c8a040', { met: 0.6, rug: 0.4 }));
  a.pivote('extra_capa', 0, 0.78, 0.1);
  a.add('extra_capa', caja(0.6, 0.7, 0.04, 0.02, { y: 0.42, z: 0.18, rx: 0.12 }), h.ropa2);
  a.add('extra_capa', caja(0.6, 0.28, 0.05, 0.02, { y: 0.92, z: 0.14, rx: -0.5 }), h.ropa2);
  a.add('cuerpo', caja(0.1, 0.1, 0.03, 0.02, { y: 0.66, z: -0.14 }), oro);
  a.add('cabeza', caja(0.38, 0.12, 0.34, 0.05, { y: h.cy + 0.16, z: h.cz + 0.02 }), h.oscuro);
  a.add('cabeza', cono(0.05, 0.12, { y: h.cy + 0.23, z: h.cz - 0.12, rx: -0.4 }, 4), h.oscuro);
  if (alas) {
    a.pivote('extra_alas', 0, 0.75, 0.15);
    const membrana = a.material('membrana', mat('#3a0a12', { rug: 0.6 }));
    a.add('extra_alas', cono(0.45, 0.9, { x: -0.6, y: 0.9, z: 0.2, rz: Math.PI / 2 + 0.3, sz: 0.08 }, 3), membrana);
    a.add('extra_alas', cono(0.45, 0.9, { x: 0.6, y: 0.9, z: 0.2, rz: -Math.PI / 2 - 0.3, sz: 0.08 }, 3), membrana);
  }
  return a.fin(new THREE.Vector4(0.9, 0.5, 0.6, 1));
}

const hechos = new Map<string, ModeloPiezas>();

/** El modelo de reemplazo de un tipo (se arma una sola vez). */
export function reemplazo(id: string): ModeloPiezas {
  let m = hechos.get(id);
  if (!m) {
    m = (HACER[id] ?? HACER.zombi)();
    hechos.set(id, m);
  }
  return m;
}

/** Junta geometrías (para piezas estáticas sin animación). */
export function juntar(gs: THREE.BufferGeometry[]) {
  return mergeGeometries(gs.map((g) => (g.index ? g.toNonIndexed() : g)), false);
}

export { tf };
