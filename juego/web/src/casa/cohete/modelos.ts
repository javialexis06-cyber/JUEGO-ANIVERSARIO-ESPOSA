// Modelos del retrete espacial: los retretes de la tienda, los poderes, el rollito dorado, la basura espacial,
// los ovnis… vienen de Blender (personajes/blender/cohete_piezas.py → cohete_retretes.glb y cohete_cosas.glb).
// Los asteroides se arman aquí (esferas abolladas con cráteres y color por vértice). Si un modelo no carga, se usa
// una versión sencilla hecha a mano para que el juego nunca se quede sin nada.
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { cargar } from '../../recursos';
import type { IdPoder } from './datos';

// ---------------------------------------------------------------------------
// Ruido 3D de valor (para las rocas)
// ---------------------------------------------------------------------------
function hash3(x: number, y: number, z: number) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function ruido3(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const s = (t: number) => t * t * (3 - 2 * t);
  const fx = s(x - xi), fy = s(y - yi), fz = s(z - zi);
  const l = (a: number, b: number, k: number) => a + (b - a) * k;
  const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), fx), l(c(0, 1, 0), c(1, 1, 0), fx), fy),
    l(l(c(0, 0, 1), c(1, 0, 1), fx), l(c(0, 1, 1), c(1, 1, 1), fx), fy),
    fz,
  );
}
const fbm3 = (x: number, y: number, z: number, oct: number) => {
  let a = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) {
    a += amp * ruido3(x * f, y * f, z * f);
    amp *= 0.5;
    f *= 2.03;
  }
  return a;
};

/** Asteroide: esfera abollada con cráteres (hundidos con su borde levantado) y vetas de color. */
export function geometriaAsteroide(semilla: number, detalle = 4, alargado = 1): THREE.BufferGeometry {
  let s = semilla * 7919 + 13;
  const az = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const base = new THREE.IcosahedronGeometry(1, detalle);
  base.deleteAttribute('normal');
  base.deleteAttribute('uv');
  const g = mergeVertices(base);
  const crateres: { d: THREE.Vector3; r: number; h: number }[] = [];
  const n = 7 + Math.floor(az() * 7);
  for (let k = 0; k < n; k++) {
    const d = new THREE.Vector3(az() - 0.5, az() - 0.5, az() - 0.5).normalize();
    crateres.push({ d, r: 0.18 + Math.pow(az(), 2) * 0.42, h: 0.06 + az() * 0.1 });
  }
  const off = az() * 100;
  const pos = g.attributes.position as THREE.BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    let h = 1 + (fbm3(v.x * 1.6 + off, v.y * 1.6, v.z * 1.6, 4) - 0.5) * 0.55 + (fbm3(v.x * 5 + off, v.y * 5, v.z * 5, 3) - 0.5) * 0.12;
    let oscuro = 0;
    for (const c of crateres) {
      const a = Math.acos(Math.max(-1, Math.min(1, v.dot(c.d)))) / c.r;
      if (a < 1) {
        h -= c.h * (1 - a * a);
        oscuro = Math.max(oscuro, 0.35 * (1 - a));
      } else if (a < 1.45) {
        const b = (a - 1) / 0.45;
        h += c.h * 0.45 * Math.sin(b * Math.PI) * (1 - b * 0.3);
        oscuro = Math.min(oscuro, -0.12 * Math.sin(b * Math.PI));
      }
    }
    v.multiplyScalar(h);
    v.x *= alargado;
    pos.setXYZ(i, v.x, v.y, v.z);
    // Color: roca con vetas, más oscura en el fondo de los cráteres y clarita en los bordes
    const veta = fbm3(v.x * 3 + off, v.y * 3, v.z * 3, 3);
    const k = 0.78 + (veta - 0.5) * 0.5 - oscuro;
    col[i * 3] = k;
    col[i * 3 + 1] = k * 0.96;
    col[i * 3 + 2] = k * 0.92;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

/** Color de las rocas en cada tramo (multiplica el color por vértice). */
export const COLOR_ROCA = ['#B9A898', '#A9A2A0', '#C2C0C8', '#C8735A', '#B88A5C', '#A98AC8', '#D88AA8'];

// ---------------------------------------------------------------------------
// Ajustes de materiales que vienen de Blender
// ---------------------------------------------------------------------------
/** El cargador general deja todo mate (plastilina): aquí se devuelve el brillo al oro, el cromo y los diamantes. */
function brillar(raiz: THREE.Object3D) {
  raiz.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of mats as THREE.MeshStandardMaterial[]) {
      if ((mat as any).__cohete) continue;
      (mat as any).__cohete = true;
      const n = mat.name.toLowerCase();
      if (/oro|dorad|gold/.test(n)) {
        // Con la luz del espacio el oro se ve café: se le sube el reflejo y un brillo propio suavecito
        mat.metalness = 1;
        mat.roughness = 0.22;
        mat.color.set('#FFD45A');
        (mat as any).envMapIntensity = 1.8;
        if (mat.emissive) {
          mat.emissive.set('#5A3A00');
          mat.emissiveIntensity = 0.55;
        }
        mat.normalScale?.set(0.05, 0.05);
      } else if (/cromo|acero|metal|plata|aluminio|lata/.test(n)) {
        mat.metalness = 1;
        mat.roughness = 0.2;
        (mat as any).envMapIntensity = 1.6;
        mat.normalScale?.set(0.04, 0.04);
      } else if (/diamante|gema|cristal/.test(n)) {
        mat.metalness = 0.1;
        mat.roughness = 0.05;
        mat.normalMap = null;
        (mat as any).envMapIntensity = 2.2;
      } else if (/porcelana|laca|brillo|cer[aá]mica/.test(n)) {
        mat.roughness = 0.28;
        mat.normalScale?.set(0.06, 0.06);
      } else if (/vidrio|burbuja/.test(n)) {
        mat.transparent = true;
        mat.opacity = Math.min(mat.opacity, 0.35);
        mat.roughness = 0.05;
        mat.depthWrite = false;
        mat.normalMap = null;
      }
      if (/\bluz\b|led|rgb|neon|fuego/.test(n) && mat.emissive) {
        mat.toneMapped = false;
        if (mat.emissive.getHex() === 0) mat.emissive.copy(mat.color);
        mat.emissiveIntensity = Math.max(mat.emissiveIntensity, 1.6);
      }
      mat.needsUpdate = true;
    }
  });
}

/** Copia de una geometría con todos sus datos en decimales (las comprimidas vienen en enteros normalizados). */
export function aDecimales(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const out = new THREE.BufferGeometry();
  for (const [nombre, a] of Object.entries(g.attributes)) {
    const at = a as THREE.BufferAttribute;
    const arr = new Float32Array(at.count * at.itemSize);
    for (let i = 0; i < at.count; i++) for (let k = 0; k < at.itemSize; k++) arr[i * at.itemSize + k] = at.getComponent(i, k);
    out.setAttribute(nombre, new THREE.BufferAttribute(arr, at.itemSize));
  }
  if (g.index) out.setIndex(Array.from(g.index.array as ArrayLike<number>));
  return out;
}

/** Pone un objeto a un tamaño dado (su lado más largo) y con la base o el centro en el origen. */
export function ajustar(o: THREE.Object3D, lado: number, centrar: 'centro' | 'base' = 'centro') {
  o.updateMatrixWorld(true);
  const caja = new THREE.Box3().setFromObject(o);
  const tam = caja.getSize(new THREE.Vector3());
  const k = lado / Math.max(tam.x, tam.y, tam.z, 1e-3);
  const g = new THREE.Group();
  o.position.set(0, 0, 0);
  const centro = caja.getCenter(new THREE.Vector3());
  o.position.set(-centro.x * k, (centrar === 'base' ? -caja.min.y : -centro.y) * k, -centro.z * k);
  o.scale.multiplyScalar(k);
  g.add(o);
  return g;
}

// ---------------------------------------------------------------------------
// Versiones de emergencia (si un modelo no carga)
// ---------------------------------------------------------------------------
const porcelana = () => new THREE.MeshStandardMaterial({ color: '#F7F5F0', roughness: 0.25 });

function retreteSencillo(): THREE.Group {
  const p = porcelana();
  const base = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.13, 0), new THREE.Vector2(0.12, 0.2), new THREE.Vector2(0.2, 0.38), new THREE.Vector2(0.001, 0.4)], 24), p);
  const taza = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.055, 10, 28), p);
  taza.rotation.x = Math.PI / 2;
  taza.scale.set(1, 1.2, 1);
  taza.position.set(0, 0.41, 0.05);
  const tanque = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.2), p);
  tanque.position.set(0, 0.62, -0.22);
  const g = new THREE.Group();
  g.add(base, taza, tanque);
  return g;
}

function rollitoSencillo(): THREE.Group {
  const perfil = [
    [0.075, -0.15], [0.2, -0.15], [0.215, -0.135], [0.215, 0.135], [0.2, 0.15], [0.075, 0.15], [0.07, 0.14], [0.07, -0.14],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  perfil.push(perfil[0].clone());
  const papel = new THREE.Mesh(new THREE.LatheGeometry(perfil, 28), new THREE.MeshStandardMaterial({ color: '#FFD45C', metalness: 0.85, roughness: 0.28, name: 'oro rollito' }));
  const g = new THREE.Group();
  g.add(papel);
  return g;
}

const COLOR_PODER: Record<IdPoder, string> = {
  escudo: '#7FD8FF', iman: '#FF5A5A', turbo: '#8BC34A', lenta: '#9CB8FF', doble: '#FFD23F', laser: '#FF4FA3', mini: '#F5F5F5', hormiga: '#F7A8D8',
  ambientador: '#C3A6FF', paca: '#FFF3C4',
};
function poderSencillo(id: IdPoder): THREE.Group {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 1), new THREE.MeshStandardMaterial({ color: COLOR_PODER[id], roughness: 0.3, emissive: COLOR_PODER[id], emissiveIntensity: 0.25 }));
  g.add(m);
  return g;
}

function obstaculoSencillo(tipo: string): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: tipo === 'chancla' ? '#2F7DE1' : tipo === 'ovni' ? '#C9CCD1' : '#DDDDDD', roughness: 0.5, metalness: tipo === 'ovni' ? 0.6 : 0 });
  if (tipo === 'ovni') {
    const plato = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), mat);
    plato.scale.set(1, 0.28, 1);
    const domo = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#9FE7FF', transparent: true, opacity: 0.6 }));
    domo.position.y = 0.15;
    g.add(plato, domo);
  } else if (tipo === 'chancla') {
    const suela = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.5, 6, 12), mat);
    suela.scale.set(1, 1, 0.25);
    suela.rotation.z = Math.PI / 2;
    g.add(suela);
  } else if (tipo === 'inodoro') {
    g.add(retreteSencillo());
  } else {
    const caja = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: '#E8C35A', metalness: 0.6, roughness: 0.4 }));
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.04), new THREE.MeshStandardMaterial({ color: '#2B4C9B', metalness: 0.3, roughness: 0.4 }));
    g.add(caja, panel);
  }
  return g;
}

// ---------------------------------------------------------------------------
// Biblioteca
// ---------------------------------------------------------------------------
export type TipoBasura = 'satelite' | 'inodoro' | 'chancla' | 'ovni' | 'avion' | 'pajaro' | 'lata';

export class Modelos {
  private retretes = new Map<string, THREE.Object3D>();
  private cosas = new Map<string, THREE.Object3D>();
  /** Formas de asteroide (grandes con más detalle, pequeñas con menos). */
  asteroides: THREE.BufferGeometry[] = [];
  asteroidesChicos: THREE.BufferGeometry[] = [];
  matRocas: THREE.MeshStandardMaterial[] = [];
  /** Partes del rollito para dibujarlo por instancias (una malla por material). */
  rollito: { geo: THREE.BufferGeometry; mat: THREE.Material }[] = [];

  static async cargar(): Promise<Modelos> {
    const m = new Modelos();
    for (let k = 0; k < 6; k++) m.asteroides.push(geometriaAsteroide(k + 1, 4, k === 5 ? 1.5 : 1));
    for (let k = 0; k < 4; k++) m.asteroidesChicos.push(geometriaAsteroide(k + 11, 2));
    m.matRocas = COLOR_ROCA.map((c) => new THREE.MeshStandardMaterial({ color: c, vertexColors: true, roughness: 0.93, metalness: 0.02 }));
    const [retretes, cosas] = await Promise.all([cargar('cohete_retretes.glb').catch(() => null), cargar('cohete_cosas.glb').catch(() => null)]);
    if (retretes) {
      brillar(retretes);
      for (const o of retretes.children) if (o.name.startsWith('retrete_')) m.retretes.set(o.name.slice(8), o);
    }
    if (cosas) {
      brillar(cosas);
      for (const o of cosas.children) m.cosas.set(o.name, o);
    }
    // El rollito: se juntan sus mallas por material para dibujar cientos de una
    const rollo = m.cosas.get('rollito') ?? rollitoSencillo();
    const r = ajustar(rollo.clone(true), 0.5);
    r.updateMatrixWorld(true);
    r.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      // La malla viene cuantizada (enteros): se pasa a decimales para poder transformarla
      const geo = aDecimales(mesh.geometry).applyMatrix4(mesh.matrixWorld);
      m.rollito.push({ geo, mat: mesh.material as THREE.Material });
    });
    return m;
  }

  /** El retrete de la tienda, listo para sentarse (la taza a la altura de la cadera, el frente hacia la cámara). */
  retrete(id: string): THREE.Object3D {
    const o = this.retretes.get(id) ?? this.retretes.get('porcelana');
    if (!o) return retreteSencillo();
    const c = o.clone(true);
    c.position.set(0, 0, 0);
    return c;
  }

  poder(id: IdPoder): THREE.Object3D {
    const o = this.cosas.get(`poder_${id}`);
    return ajustar(o ? o.clone(true) : poderSencillo(id), 0.95);
  }

  basura(tipo: TipoBasura, lado: number): THREE.Object3D {
    const o = this.cosas.get(`obst_${tipo}`);
    return ajustar(o ? o.clone(true) : obstaculoSencillo(tipo), lado);
  }

  cosa(nombre: string, lado: number, centrar: 'centro' | 'base' = 'centro'): THREE.Object3D | null {
    const o = this.cosas.get(nombre);
    return o ? ajustar(o.clone(true), lado, centrar) : null;
  }

  tiene(nombre: string) {
    return this.cosas.has(nombre);
  }

  liberar() {
    for (const g of [...this.asteroides, ...this.asteroidesChicos]) g.dispose();
    for (const m of this.matRocas) m.dispose();
    for (const r of this.rollito) r.geo.dispose();
  }
}
