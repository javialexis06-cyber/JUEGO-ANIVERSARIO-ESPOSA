// Aretes y collares para el muñeco de un amigo, hechos aquí mismo con piezas de three.js (perlas, argollas,
// corazones, estrellas, gotas, cerecitas…) y colgados de los huesos del muñeco: los aretes del lóbulo de cada oreja
// (hueso «cabeza») y el collar en la base del cuello (hueso «torso»), así siguen todas las poses y animaciones.
// El sitio de cada oreja y del cuello se mide en las mallas de fábrica (pose de amarre), sirve para los dos moldes.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Personaje } from '../personaje';
import { ARETES, COLLARES, type Joyas } from './prendas';

// ------------------------------------------------------------------------------------------------ Formas
const formas = new Map<string, THREE.BufferGeometry>();
function forma(clave: string, crear: () => THREE.BufferGeometry) {
  let g = formas.get(clave);
  if (!g) {
    g = crear();
    g.computeVertexNormals();
    formas.set(clave, g);
  }
  return g;
}

const extruir = (s: THREE.Shape, fondo = 0.28) => {
  const g = new THREE.ExtrudeGeometry(s, { depth: fondo, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.07, bevelSegments: 3, curveSegments: 10 });
  g.center();
  return g;
};
const corazon = () => {
  const s = new THREE.Shape();
  s.moveTo(0, -0.55);
  s.bezierCurveTo(-0.2, -0.32, -0.62, -0.12, -0.6, 0.18);
  s.bezierCurveTo(-0.58, 0.48, -0.2, 0.58, 0, 0.3);
  s.bezierCurveTo(0.2, 0.58, 0.58, 0.48, 0.6, 0.18);
  s.bezierCurveTo(0.62, -0.12, 0.2, -0.32, 0, -0.55);
  return extruir(s);
};
const estrella = () => {
  const s = new THREE.Shape();
  for (let k = 0; k < 10; k++) {
    const r = k % 2 ? 0.25 : 0.6;
    const a = Math.PI / 2 + (k * Math.PI) / 5;
    k ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  return extruir(s);
};
const luna = () => {
  const s = new THREE.Shape();
  s.absarc(0, 0, 0.55, Math.PI * 0.35, Math.PI * 1.65, false);
  s.absarc(0.25, 0, 0.42, Math.PI * 1.55, Math.PI * 0.45, true);
  return extruir(s, 0.22);
};
const rayo = () => {
  const s = new THREE.Shape();
  [[0.1, 0.6], [-0.35, 0], [-0.02, 0], [-0.15, -0.6], [0.35, 0.08], [0.02, 0.08], [0.1, 0.6]].forEach(([x, y], k) => (k ? s.lineTo(x, y) : s.moveTo(x, y)));
  return extruir(s, 0.2);
};
/** Gota de cristal (torneada, con la punta arriba). */
const gota = () => {
  const p: THREE.Vector2[] = [];
  for (let k = 0; k <= 16; k++) {
    const t = k / 16;
    const y = 0.6 - t * 1.1;
    const r = Math.sin(Math.PI * Math.min(1, t * 1.08)) ** 0.8 * 0.36 * (0.55 + t * 0.6);
    p.push(new THREE.Vector2(Math.max(0.001, r), y));
  }
  return new THREE.LatheGeometry(p, 16);
};
const diamante = () => {
  const g = new THREE.OctahedronGeometry(0.42, 0);
  g.scale(1, 1.25, 1);
  return g;
};
const flor = () => {
  const partes: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    const p = new THREE.SphereGeometry(0.26, 10, 8);
    p.scale(1, 1, 0.55);
    p.translate(Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0);
    partes.push(p);
  }
  return mergeGeometries(partes)!;
};

// ------------------------------------------------------------------------------------------------ Materiales
function material(color: string, tipo: 'metal' | 'perla' | 'gema' | 'tela' | 'esmalte') {
  const c = new THREE.Color(color);
  if (tipo === 'metal') return new THREE.MeshStandardMaterial({ color: c, metalness: 0.85, roughness: 0.28 });
  if (tipo === 'perla') return new THREE.MeshStandardMaterial({ color: c, metalness: 0.1, roughness: 0.22, emissive: c, emissiveIntensity: 0.08 });
  if (tipo === 'gema') return new THREE.MeshStandardMaterial({ color: c, metalness: 0.3, roughness: 0.08, emissive: c, emissiveIntensity: 0.25, transparent: true, opacity: 0.9 });
  if (tipo === 'tela') return new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 });
  return new THREE.MeshStandardMaterial({ color: c, metalness: 0.15, roughness: 0.35 });
}

/** Un arete (colgando hacia −Y desde el origen, en unidades donde la oreja mide ~1). */
function arete(tipo: string, color: string, mats: THREE.Material[]): THREE.Object3D {
  const g = new THREE.Group();
  const m = (mat: THREE.Material) => (mats.push(mat), mat);
  const oro = () => m(material('#f2c14e', 'metal'));
  const malla = (geo: THREE.BufferGeometry, mat: THREE.Material, y: number, s = 1) => {
    const o = new THREE.Mesh(geo, mat);
    o.position.y = y;
    o.scale.setScalar(s);
    g.add(o);
    return o;
  };
  const gancho = (largo: number) => {
    const c = malla(forma('cil', () => new THREE.CylinderGeometry(0.035, 0.035, 1, 6)), oro(), -largo / 2);
    c.scale.set(1, largo, 1);
    malla(forma('bola', () => new THREE.SphereGeometry(0.5, 14, 10)), oro(), 0, 0.12);
  };
  switch (tipo) {
    case 'boton':
      malla(forma('bola', () => new THREE.SphereGeometry(0.5, 14, 10)), m(material(color, 'metal')), -0.06, 0.26);
      break;
    case 'perla':
      malla(forma('bola', () => new THREE.SphereGeometry(0.5, 14, 10)), m(material(color, 'perla')), -0.1, 0.34);
      break;
    case 'argolla':
    case 'argolla_grande': {
      const r = tipo === 'argolla' ? 0.28 : 0.46;
      const o = malla(forma(`aro${r}`, () => new THREE.TorusGeometry(r, 0.045, 8, 28)), m(material(color, 'metal')), -r + 0.02);
      o.rotation.y = Math.PI / 2;
      break;
    }
    case 'corazon':
      gancho(0.22);
      malla(forma('corazon', corazon), m(material(color, 'esmalte')), -0.42, 0.42);
      break;
    case 'estrella':
      gancho(0.2);
      malla(forma('estrella', estrella), m(material(color, 'esmalte')), -0.42, 0.45);
      break;
    case 'luna':
      gancho(0.2);
      malla(forma('luna', luna), m(material(color, 'metal')), -0.44, 0.45);
      break;
    case 'rayo':
      gancho(0.16);
      malla(forma('rayo', rayo), m(material(color, 'esmalte')), -0.45, 0.48);
      break;
    case 'gota':
      gancho(0.18);
      malla(forma('gota', gota), m(material(color, 'gema')), -0.5, 0.5);
      break;
    case 'diamante':
      malla(forma('diamante', diamante), m(material(color, 'gema')), -0.14, 0.34);
      break;
    case 'flor': {
      const f = malla(forma('flor', flor), m(material(color, 'esmalte')), -0.1, 0.4);
      f.rotation.y = Math.PI / 2;
      malla(forma('bola', () => new THREE.SphereGeometry(0.5, 14, 10)), m(material('#ffd34d', 'esmalte')), -0.1, 0.14);
      break;
    }
    case 'cereza': {
      const verde = m(material('#4f9a3a', 'tela'));
      const rojo = m(material(color, 'esmalte'));
      for (const lado of [-1, 1]) {
        const tallo = malla(forma('cil', () => new THREE.CylinderGeometry(0.035, 0.035, 1, 6)), verde, -0.22);
        tallo.scale.set(0.8, 0.42, 0.8);
        tallo.rotation.z = lado * 0.42;
        tallo.position.x = lado * 0.08;
        const b = malla(forma('bola', () => new THREE.SphereGeometry(0.5, 14, 10)), rojo, -0.46, 0.3);
        b.position.x = lado * 0.17;
      }
      const hoja = malla(forma('bola', () => new THREE.SphereGeometry(0.5, 14, 10)), verde, -0.02, 0.16);
      hoja.scale.set(0.2, 0.08, 0.12);
      break;
    }
  }
  return g;
}

/** Un collar alrededor del cuello (anillo en el plano XZ de radios rx, rz, con el frente hacia +Z). */
function collar(tipo: string, color: string, rx: number, rz: number, grosor: number, mats: THREE.Material[]): THREE.Object3D {
  const g = new THREE.Group();
  const m = (mat: THREE.Material) => (mats.push(mat), mat);
  const punto = (a: number) => new THREE.Vector3(Math.sin(a) * rx, -Math.max(0, Math.cos(a)) * grosor * 1.2, Math.cos(a) * rz);
  const cuentas = (n: number, tam: number, mat: THREE.Material | ((k: number) => THREE.Material)) => {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      const o = new THREE.Mesh(forma('bola', () => new THREE.SphereGeometry(0.5, 14, 10)), typeof mat === 'function' ? mat(k) : mat);
      o.position.copy(punto(a));
      o.scale.setScalar(tam);
      g.add(o);
    }
  };
  const cadena = (mat: THREE.Material) => {
    const curva = new THREE.CatmullRomCurve3(Array.from({ length: 24 }, (_, k) => punto((k / 24) * Math.PI * 2)), true);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 64, grosor * 0.12, 6, true), mat));
  };
  const dije = (geo: THREE.BufferGeometry, mat: THREE.Material, s: number) => {
    const o = new THREE.Mesh(geo, mat);
    const p = punto(0);
    o.position.set(p.x, p.y - s * 0.62, p.z + grosor * 0.15);
    o.scale.setScalar(s);
    g.add(o);
  };
  switch (tipo) {
    case 'perlas':
      cuentas(26, grosor * 0.62, m(material(color, 'perla')));
      break;
    case 'bolitas': {
      const tonos = ['#e8456b', '#ffd34d', '#4fb0e8', '#7ccf6b', '#c46bd6', color].map((c) => m(material(c, 'esmalte')));
      cuentas(22, grosor * 0.7, (k) => tonos[k % tonos.length]);
      break;
    }
    case 'cadena':
      cadena(m(material(color, 'metal')));
      break;
    case 'corazon':
      cadena(m(material('#f2c14e', 'metal')));
      dije(forma('corazon', corazon), m(material(color, 'esmalte')), grosor * 1.6);
      break;
    case 'estrella':
      cadena(m(material('#f2c14e', 'metal')));
      dije(forma('estrella', estrella), m(material(color, 'esmalte')), grosor * 1.7);
      break;
    case 'gema':
      cadena(m(material('#dfe6f2', 'metal')));
      dije(forma('gota', gota), m(material(color, 'gema')), grosor * 1.6);
      break;
    case 'medalla': {
      cadena(m(material(color, 'metal')));
      const disco = () => new THREE.CylinderGeometry(0.5, 0.5, 0.12, 24).rotateX(Math.PI / 2);
      dije(forma('disco', disco), m(material(color, 'metal')), grosor * 1.8);
      break;
    }
    case 'gargantilla': {
      const banda = new THREE.Mesh(new THREE.TorusGeometry(1, 0.1, 8, 40), m(material(color, 'tela')));
      banda.rotation.x = Math.PI / 2;
      banda.scale.set(rx * 0.93, rz * 0.93, grosor * 3.2);
      banda.position.y = grosor * 0.6;
      g.add(banda);
      const o = new THREE.Mesh(forma('diamante', diamante), m(material('#d8f4ff', 'gema')));
      o.position.set(0, grosor * 0.15, rz * 0.97);
      o.scale.setScalar(grosor * 0.8);
      g.add(o);
      break;
    }
    case 'flores': {
      const tonos = [color, '#ffd34d', '#ffffff', '#ff9a5c'].map((c) => m(material(c, 'esmalte')));
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        const o = new THREE.Mesh(forma('flor', flor), tonos[k % tonos.length]);
        const p = punto(a);
        o.position.copy(p);
        o.lookAt(p.clone().multiplyScalar(2));
        o.scale.setScalar(grosor * 0.95);
        g.add(o);
      }
      break;
    }
  }
  return g;
}

// ------------------------------------------------------------------------------------------------ Dónde van
interface Ancla {
  hueso: THREE.Object3D;
  /** De la pose de amarre (espacio del modelo) al espacio del hueso. */
  matriz: THREE.Matrix4;
}

/** Caja de una malla de fábrica en la pose de amarre y cómo pasar de ahí a un hueso. */
function medir(p: Personaje, parte: string, hueso: string): { caja: THREE.Box3; ancla: Ancla } | null {
  const m = p.partes.get(parte)?.[0] as THREE.SkinnedMesh | undefined;
  const h = p.huesos.get(hueso);
  if (!m || !h || !m.geometry) return null;
  const pos = m.geometry.getAttribute('position');
  const caja = new THREE.Box3();
  const v = new THREE.Vector3();
  let aBind: THREE.Matrix4;
  let matriz: THREE.Matrix4;
  if (m.isSkinnedMesh) {
    const i = m.skeleton.bones.indexOf(h as THREE.Bone);
    if (i < 0) return null;
    aBind = m.bindMatrix;
    matriz = m.skeleton.boneInverses[i].clone();
  } else {
    // (malla suelta: su lugar respecto al hueso, tal como está ahora)
    p.modelo?.updateMatrixWorld(true);
    aBind = m.matrixWorld;
    matriz = h.matrixWorld.clone().invert();
  }
  for (let k = 0; k < pos.count; k++) caja.expandByPoint(v.fromBufferAttribute(pos, k).applyMatrix4(aBind));
  return { caja, ancla: { hueso: h, matriz } };
}

/** Pone un objeto hecho en «espacio de amarre» (Y arriba, Z al frente) colgado de un hueso, en el punto dado. */
function colgar(o: THREE.Object3D, ancla: Ancla, punto: THREE.Vector3, tam: number) {
  const m = ancla.matriz;
  const pos = punto.clone().applyMatrix4(m);
  const ejes = new THREE.Matrix3().setFromMatrix4(m);
  const arriba = new THREE.Vector3(0, 1, 0).applyMatrix3(ejes);
  const frente = new THREE.Vector3(0, 0, 1).applyMatrix3(ejes);
  const escala = arriba.length();
  arriba.normalize();
  frente.normalize();
  const lado = new THREE.Vector3().crossVectors(arriba, frente).normalize();
  frente.crossVectors(lado, arriba).normalize();
  const giro = new THREE.Matrix4().makeBasis(lado, arriba, frente);
  const contenedor = new THREE.Group();
  contenedor.position.copy(pos);
  contenedor.quaternion.setFromRotationMatrix(giro);
  contenedor.scale.setScalar(tam * escala);
  contenedor.add(o);
  o.traverse((x) => {
    const mm = x as THREE.Mesh;
    if (mm.isMesh) {
      mm.castShadow = true;
      mm.frustumCulled = false;
    }
  });
  ancla.hueso.add(contenedor);
  return contenedor;
}

/** Cuelga los aretes y el collar del muñeco; devuelve cómo quitarlos. */
export function ponerJoyas(p: Personaje, j: Joyas): { quitar(): void } {
  const puestos: THREE.Object3D[] = [];
  const mats: THREE.Material[] = [];
  if (j.aretes && ARETES[j.aretes.tipo]) {
    const color = j.aretes.color ?? ARETES[j.aretes.tipo].c;
    for (const lado of ['der', 'izq']) {
      const med = medir(p, `oreja ${lado}`, 'cabeza');
      if (!med) continue;
      const c = med.caja;
      const alto = c.max.y - c.min.y;
      const centro = c.getCenter(new THREE.Vector3());
      // El lóbulo: abajo de la oreja, un poquito hacia afuera
      const fuera = Math.sign(centro.x) || (lado === 'der' ? -1 : 1);
      const punto = new THREE.Vector3(centro.x + fuera * (c.max.x - c.min.x) * 0.12, c.min.y + alto * 0.16, centro.z);
      puestos.push(colgar(arete(j.aretes.tipo, color, mats), med.ancla, punto, alto * 0.42));
    }
  }
  if (j.collar && COLLARES[j.collar.tipo]) {
    const color = j.collar.color ?? COLLARES[j.collar.tipo].c;
    const med = medir(p, 'cuello', 'torso');
    if (med) {
      const c = med.caja;
      const centro = c.getCenter(new THREE.Vector3());
      const rx = (c.max.x - c.min.x) / 2;
      const rz = (c.max.z - c.min.z) / 2;
      const base = new THREE.Vector3(centro.x, c.min.y + (c.max.y - c.min.y) * 0.22, centro.z + rz * 0.08);
      const grosor = Math.max(rx, rz) * 0.16;
      puestos.push(colgar(collar(j.collar.tipo, color, rx * 1.28 + grosor, rz * 1.32 + grosor, grosor, mats), med.ancla, base, 1));
    }
  }
  return {
    quitar() {
      for (const o of puestos) {
        o.removeFromParent();
        o.traverse((x) => {
          const mm = x as THREE.Mesh;
          // (las formas compartidas se quedan en caché; las del collar son propias)
          if (mm.isMesh && ![...formas.values()].includes(mm.geometry)) mm.geometry.dispose();
        });
      }
      for (const m of mats) m.dispose();
    },
  };
}
