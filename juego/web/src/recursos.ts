// Carga de modelos GLB (comprimidos con meshopt) y utilidades de materiales.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { clone as clonarConEsqueleto } from 'three/examples/jsm/utils/SkeletonUtils.js';

export const RUTA = './modelos/';
let rutaModelos = RUTA;
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const cache = new Map<string, Promise<THREE.Group>>();
const cacheAnimados = new Map<string, Promise<{ escena: THREE.Group; clips: THREE.AnimationClip[] }>>();

/** Si el navegador bloquea WebAssembly (y con él meshopt), se usan los modelos sin esa compresión. */
export async function elegirModelos() {
  try {
    await MeshoptDecoder.ready;
    // Descomprimir los modelos en hilos aparte: la pantalla no se traba mientras cargan y en un celular de varios
    // núcleos los cuartos y los personajes llegan antes (una sola vez por página)
    if (!trabajadores && typeof Worker !== 'undefined') {
      trabajadores = true;
      (MeshoptDecoder as unknown as { useWorkers?: (n: number) => void }).useWorkers?.(Math.max(1, Math.min(2, (navigator.hardwareConcurrency || 2) - 1)));
    }
  } catch {
    rutaModelos = './modelos-plano/';
  }
}
let trabajadores = false;

let relieve: THREE.Texture | null = null;

/** Textura de relieve suave (ruido) que imita la plastilina y el fieltro de los renders. */
export function texturaRelieve(): THREE.Texture {
  if (relieve) return relieve;
  const n = 128;
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const ctx = c.getContext('2d')!;
  const alto = new Float32Array(n * n);
  for (let i = 0; i < alto.length; i++) alto[i] = Math.random();
  // suavizado simple para que no sea ruido duro
  for (let pasada = 0; pasada < 2; pasada++) {
    const copia = alto.slice();
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        let s = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += copia[((y + dy + n) % n) * n + ((x + dx + n) % n)];
        alto[y * n + x] = s / 9;
      }
  }
  const img = ctx.createImageData(n, n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const h = (xx: number, yy: number) => alto[((yy + n) % n) * n + ((xx + n) % n)];
      const dx = (h(x + 1, y) - h(x - 1, y)) * 6;
      const dy = (h(x, y + 1) - h(x, y - 1)) * 6;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * n + x) * 4;
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = (1 / len) * 255;
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  relieve = new THREE.CanvasTexture(c);
  relieve.wrapS = relieve.wrapT = THREE.RepeatWrapping;
  relieve.repeat.set(6, 6);
  return relieve;
}

interface Baldosa {
  tipo: 'ladrillo' | 'ajedrez';
  c1: number[];
  c2: number[];
  escala: number;
  mortero?: number[];
  mortero_tam?: number;
}
const LADO = 4; // baldosas por lado en la textura (se repite)
const texturasBaldosa = new Map<string, { color: THREE.Texture; relieve: THREE.Texture }>();

/** Redibuja el patrón del piso de Blender (textura de ladrillo o ajedrez, con colores lineales). */
function texturaBaldosa(json: string, b: Baldosa) {
  let t = texturasBaldosa.get(json);
  if (t) return t;
  const px = 128;
  const n = px * LADO;
  const color = document.createElement('canvas');
  const alto = document.createElement('canvas');
  color.width = color.height = alto.width = alto.height = n;
  const cc = color.getContext('2d')!, ca = alto.getContext('2d')!;
  const css = (c: number[]) => new THREE.Color().setRGB(c[0], c[1], c[2], THREE.LinearSRGBColorSpace).getStyle();
  const mezcla = (k: number) => b.c1.map((v, i) => v + (b.c2[i] - v) * k);
  ca.fillStyle = '#fff';
  ca.fillRect(0, 0, n, n);
  let semilla = 7;
  const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  for (let j = 0; j < LADO; j++)
    for (let i = 0; i < LADO; i++) {
      cc.fillStyle = css(b.tipo === 'ajedrez' ? ((i + j) % 2 ? b.c2 : b.c1) : mezcla(azar()));
      cc.fillRect(i * px, j * px, px, px);
    }
  if (b.tipo === 'ladrillo' && b.mortero) {
    const g = Math.max(2.5, (b.mortero_tam ?? 0.012) * px);
    cc.fillStyle = css(b.mortero);
    ca.fillStyle = '#555';
    for (let k = 0; k <= LADO; k++) {
      for (const c of [cc, ca]) {
        c.fillRect(k * px - g / 2, 0, g, n);
        c.fillRect(0, k * px - g / 2, n, g);
      }
    }
  }
  const tc = new THREE.CanvasTexture(color);
  tc.colorSpace = THREE.SRGBColorSpace;
  const ta = new THREE.CanvasTexture(alto);
  for (const x of [tc, ta]) {
    x.wrapS = x.wrapT = THREE.RepeatWrapping;
    x.anisotropy = 4;
  }
  t = { color: tc, relieve: ta };
  texturasBaldosa.set(json, t);
  return t;
}

/** UV a partir de la posición en metros, igual que las "coordenadas de objeto" que usa Blender para el piso.
 *  Ojo: al comprimir, las posiciones quedan normalizadas y la escala real pasa al nodo; por eso se usa la matriz. */
function uvDeObjeto(m: THREE.Mesh, raiz: THREE.Object3D, escala: number) {
  raiz.updateMatrixWorld(true);
  const mat = new THREE.Matrix4().copy(raiz.matrixWorld).invert().multiply(m.matrixWorld);
  const pos = m.geometry.getAttribute('position');
  const uv = new Float32Array(pos.count * 2);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(mat);
    uv[2 * i] = (v.x * escala) / LADO;
    uv[2 * i + 1] = (-v.z * escala) / LADO;
  }
  m.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

/** Colores del piso para el juego (sRGB): la luz del juego es más suave que la de Cycles, así que se usan
 *  los tonos que el piso muestra en el render y no los del material original. */
const PISO_JUEGO: Record<string, { c1: string; c2: string; mortero: string }> = {
  'Piso | madera': { c1: '#FFC69C', c2: '#FCBF95', mortero: '#DE9A76' },
};

function prepararMateriales(raiz: THREE.Object3D) {
  raiz.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.castShadow = true;
    m.receiveShadow = true;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of mats as THREE.MeshStandardMaterial[]) {
      const baldosa = mat?.userData?.baldosa as string | undefined;
      if (baldosa) {
        const b = JSON.parse(baldosa) as Baldosa;
        const ajuste = PISO_JUEGO[mat.name];
        if (ajuste) {
          const lin = (h: string) => new THREE.Color(h).toArray() as number[];
          b.c1 = lin(ajuste.c1);
          b.c2 = lin(ajuste.c2);
          b.mortero = lin(ajuste.mortero);
        }
        uvDeObjeto(m, raiz, b.escala);
        m.castShadow = false;
        if ((mat as any).__listo) continue;
        (mat as any).__listo = true;
        const t = texturaBaldosa(baldosa, b);
        mat.color.set('#ffffff');
        mat.map = t.color;
        mat.bumpMap = t.relieve;
        mat.bumpScale = 0.7;
        mat.roughness = 0.42;
        mat.needsUpdate = true;
        continue;
      }
      if (!mat || (mat as any).__listo) continue;
      (mat as any).__listo = true;
      if (mat.transparent || mat.opacity < 1) {
        mat.depthWrite = false;
        m.castShadow = false;
        continue;
      }
      const fieltro = !!mat.userData?.fieltro;
      mat.normalMap = texturaRelieve();
      mat.normalScale = new THREE.Vector2(fieltro ? 0.5 : 0.18, fieltro ? 0.5 : 0.18);
      mat.roughness = Math.max(mat.roughness ?? 0.6, fieltro ? 0.85 : 0.5);
    }
  });
}

/** Al publicarse como enlace, los .glb viajan como texto base64 (.glb.txt): el visor no sirve archivos .glb. */
const EN_TEXTO = (globalThis as any).__modelosEnTexto === true;

function base64ABytes(b64: string): ArrayBuffer {
  const bin = atob(b64.trim());
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function leerModelo(nombre: string) {
  if (!EN_TEXTO) return loader.loadAsync(rutaModelos + nombre);
  const r = await fetch(`${rutaModelos}${nombre}.txt`);
  if (!r.ok) throw new Error(`No se pudo leer ${nombre}`);
  return loader.parseAsync(base64ABytes(await r.text()), rutaModelos);
}

export function cargar(nombre: string): Promise<THREE.Group> {
  let p = cache.get(nombre);
  if (!p) {
    p = leerModelo(nombre).then((g) => {
      prepararMateriales(g.scene);
      return g.scene;
    });
    cache.set(nombre, p);
    // Si falla (memoria, archivo a medias), la próxima vez se vuelve a intentar en vez de fallar siempre
    p.catch(() => cache.get(nombre) === p && cache.delete(nombre));
  }
  return p;
}

/** Personaje con esqueleto y sus poses (una animación por pose). */
export function cargarAnimado(nombre: string): Promise<{ escena: THREE.Group; clips: THREE.AnimationClip[] }> {
  let p = cacheAnimados.get(nombre);
  if (!p) {
    p = leerModelo(nombre).then((g) => {
      prepararMateriales(g.scene);
      g.scene.traverse((o) => ((o as THREE.SkinnedMesh).isSkinnedMesh ? (o.frustumCulled = false) : null));
      return { escena: g.scene, clips: g.animations };
    });
    cacheAnimados.set(nombre, p);
    p.catch(() => cacheAnimados.get(nombre) === p && cacheAnimados.delete(nombre));
  }
  return p;
}

/** Copia de un personaje con esqueleto propio (comparte geometría y materiales). */
export function copiaAnimada<T extends THREE.Object3D>(o: T): T {
  return clonarConEsqueleto(o) as T;
}

/** Suelta lo propio de copias animadas que ya salieron de la escena: cada malla con esqueleto tiene su propia
 *  textura de huesos en la tarjeta gráfica (la geometría y los materiales se comparten y se quedan). */
export function liberarEsqueletos(...raices: THREE.Object3D[]) {
  for (const raiz of raices) {
    raiz.traverse((o) => {
      const m = o as THREE.SkinnedMesh;
      if (m.isSkinnedMesh) m.skeleton.dispose();
    });
  }
}

/** Copia que comparte geometría y materiales (liviana). */
export function copia<T extends THREE.Object3D>(o: T): T {
  return o.clone(true) as T;
}

export async function cargarJSON<T>(nombre: string, ruta = RUTA): Promise<T> {
  const r = await fetch(ruta + nombre);
  if (!r.ok) throw new Error(`No se pudo leer ${nombre}`);
  return (await r.json()) as T;
}

/** Biblioteca de productos: prod_<nombre> → objeto listo para copiar. */
export class Productos {
  mapa = new Map<string, THREE.Object3D>();
  static async cargar(): Promise<Productos> {
    const p = new Productos();
    const g = await cargar('productos.glb');
    for (const hijo of [...g.children]) {
      if (hijo.name.startsWith('prod_')) {
        hijo.position.set(0, 0, 0);
        p.mapa.set(hijo.name.slice(5).replace(/_/g, ' '), hijo);
      }
    }
    return p;
  }
  crear(nombre: string): THREE.Object3D | null {
    const base = this.mapa.get(nombre) ?? this.mapa.get(nombre.replace(/ /g, '_'));
    return base ? copia(base) : null;
  }
}

export const icono = (producto: string) => `${RUTA}iconos/${producto.replace(/ /g, '_')}.png`;
