// Qué se ve delante de qué desde la cámara: una rejilla gruesa de la pantalla donde se «pintan» los triángulos de
// los objetos. Sirve para acomodar el desorden sin tapar la puerta ni lo del acertijo, y para revisar (en las pruebas)
// que nada tape la puerta en ninguna pantalla.
import * as THREE from 'three';

/** Tamaño de cada celda de la rejilla, en píxeles de la pantalla. */
const CELDA = 4;

export class Mascara {
  readonly w: number;
  readonly h: number;
  readonly d: Uint8Array;

  constructor(public ancho: number, public alto: number) {
    this.w = Math.ceil(ancho / CELDA);
    this.h = Math.ceil(alto / CELDA);
    this.d = new Uint8Array(this.w * this.h);
  }

  /** Marca un rectángulo en píxeles. */
  rect(x0: number, y0: number, x1: number, y1: number) {
    const a = Math.max(0, Math.floor(x0 / CELDA)), b = Math.min(this.w - 1, Math.floor(x1 / CELDA));
    const c = Math.max(0, Math.floor(y0 / CELDA)), e = Math.min(this.h - 1, Math.floor(y1 / CELDA));
    for (let y = c; y <= e; y++) for (let x = a; x <= b; x++) this.d[y * this.w + x] = 1;
  }

  /** ¿Algo marcado dentro del rectángulo (px)? */
  tocaRect(x0: number, y0: number, x1: number, y1: number) {
    const a = Math.max(0, Math.floor(x0 / CELDA)), b = Math.min(this.w - 1, Math.floor(x1 / CELDA));
    const c = Math.max(0, Math.floor(y0 / CELDA)), e = Math.min(this.h - 1, Math.floor(y1 / CELDA));
    for (let y = c; y <= e; y++) for (let x = a; x <= b; x++) if (this.d[y * this.w + x]) return true;
    return false;
  }

  /** Triángulo en píxeles (se marcan las celdas cuyo centro cae adentro y las de los vértices). */
  tri(ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
    // Triángulos rotos (vértices en el infinito, casi en el plano de la cámara) no cuentan
    if (![ax, ay, bx, by, cx, cy].every(Number.isFinite)) return;
    if (Math.max(ax, bx, cx) - Math.min(ax, bx, cx) > this.ancho * 3 || Math.max(ay, by, cy) - Math.min(ay, by, cy) > this.alto * 3) return;
    ax /= CELDA; ay /= CELDA; bx /= CELDA; by /= CELDA; cx /= CELDA; cy /= CELDA;
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx))), x1 = Math.min(this.w - 1, Math.floor(Math.max(ax, bx, cx)));
    const y0 = Math.max(0, Math.floor(Math.min(ay, by, cy))), y1 = Math.min(this.h - 1, Math.floor(Math.max(ay, by, cy)));
    if (x0 > x1 || y0 > y1) return;
    const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (Math.abs(area) < 1e-9) {
      for (const [x, y] of [[ax, ay], [bx, by], [cx, cy]]) this.punto(x, y);
      return;
    }
    const s = area > 0 ? 1 : -1;
    for (let y = y0; y <= y1; y++) {
      const py = y + 0.5;
      for (let x = x0; x <= x1; x++) {
        const px = x + 0.5;
        const e0 = ((bx - ax) * (py - ay) - (by - ay) * (px - ax)) * s;
        const e1 = ((cx - bx) * (py - by) - (cy - by) * (px - bx)) * s;
        const e2 = ((ax - cx) * (py - cy) - (ay - cy) * (px - cx)) * s;
        if (e0 >= 0 && e1 >= 0 && e2 >= 0) this.d[y * this.w + x] = 1;
      }
    }
    for (const [x, y] of [[ax, ay], [bx, by], [cx, cy]]) this.punto(x, y);
  }

  private punto(x: number, y: number) {
    const i = Math.floor(x), j = Math.floor(y);
    if (i >= 0 && j >= 0 && i < this.w && j < this.h) this.d[j * this.w + i] = 1;
  }

  /** Celdas marcadas en las dos. */
  cruce(o: Mascara) {
    let n = 0;
    for (let i = 0; i < this.d.length; i++) if (this.d[i] && o.d[i]) n++;
    return n;
  }

  get marcadas() {
    let n = 0;
    for (const v of this.d) n += v;
    return n;
  }

  /** Rectángulo (px) que abarca lo marcado. */
  caja() {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++)
        if (this.d[y * this.w + x]) {
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
        }
    return x0 === Infinity ? null : { x0: x0 * CELDA, y0: y0 * CELDA, x1: (x1 + 1) * CELDA, y1: (y1 + 1) * CELDA };
  }
}

const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();

/** Proyecta un punto del mundo a píxeles (null si queda detrás de la cámara). */
function aPx(v: THREE.Vector3, cam: THREE.Camera, W: number, H: number) {
  v.project(cam);
  if (v.z > 1 || v.z < -1) return null;
  return [(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H] as const;
}

export interface OpPintar {
  /** Solo los triángulos con algún vértice más adelante que este z del mundo (delante de la pared del fondo). */
  zMin?: number;
  /** Salta las mallas que cumplan esto (y todo lo que cuelga de ellas). */
  saltar?: (o: THREE.Object3D) => boolean;
  /** También las mallas ocultas (lo que aparece después: una llave que cae, un cofre que se abre) y las áreas de
   *  toque invisibles. */
  ocultas?: boolean;
}

/** Pinta en la máscara los triángulos de `raiz` tal como los ve la cámara. */
export function pintar(m: Mascara, raiz: THREE.Object3D, cam: THREE.Camera, op: OpPintar = {}) {
  raiz.updateWorldMatrix(true, true);
  const recorrer = (o: THREE.Object3D) => {
    if (op.saltar?.(o)) return;
    if (!op.ocultas && !o.visible) return;
    const malla = o as THREE.Mesh;
    const invisible = malla.isMesh && !Array.isArray(malla.material) && malla.material?.visible === false;
    if (malla.isMesh && malla.geometry?.attributes.position && (op.ocultas || !invisible)) pintarMalla(m, malla, cam, op.zMin);
    for (const h of o.children) recorrer(h);
  };
  recorrer(raiz);
}

function pintarMalla(m: Mascara, malla: THREE.Mesh, cam: THREE.Camera, zMin?: number) {
  const geo = malla.geometry;
  const pos = geo.attributes.position;
  const idx = geo.index;
  const n = idx ? idx.count : pos.count;
  const piel = (malla as THREE.SkinnedMesh).isSkinnedMesh;
  // Mallas muy grandes: se toma un triángulo de cada tantos (sobra para saber qué tapa qué)
  const paso = n / 3 > 6000 && !piel ? Math.ceil(n / 3 / 6000) : 1;
  const W = m.ancho, H = m.alto;
  const vertice = (i: number, v: THREE.Vector3) => {
    if (piel) malla.getVertexPosition(i, v);
    else v.fromBufferAttribute(pos, i);
    return v.applyMatrix4(malla.matrixWorld);
  };
  for (let t = 0; t < n / 3; t += paso) {
    const i0 = idx ? idx.getX(t * 3) : t * 3, i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
    vertice(i0, va);
    vertice(i1, vb);
    vertice(i2, vc);
    if (zMin !== undefined && va.z < zMin && vb.z < zMin && vc.z < zMin) continue;
    const a = aPx(va, cam, W, H), b = aPx(vb, cam, W, H), c = aPx(vc, cam, W, H);
    if (!a || !b || !c) continue;
    m.tri(a[0], a[1], b[0], b[1], c[0], c[1]);
  }
}

/** Rectángulo en pantalla (px) de una caja del mundo. */
export function rectDeCaja(caja: THREE.Box3, cam: THREE.Camera, W: number, H: number) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < 8; i++) {
    va.set(i & 1 ? caja.max.x : caja.min.x, i & 2 ? caja.max.y : caja.min.y, i & 4 ? caja.max.z : caja.min.z);
    const p = aPx(va, cam, W, H);
    if (!p) continue;
    x0 = Math.min(x0, p[0]);
    x1 = Math.max(x1, p[0]);
    y0 = Math.min(y0, p[1]);
    y1 = Math.max(y1, p[1]);
  }
  return { x0, y0, x1, y1 };
}

/** Rectángulos de la interfaz que están a la vista (px). */
export function rectsInterfaz(ids: string[]) {
  const out: { id: string; x0: number; y0: number; x1: number; y1: number }[] = [];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el || el.hidden || el.closest('[hidden]')) continue;
    for (const hijo of [el, ...(id === 'hud' ? [...el.children] : [])] as HTMLElement[]) {
      if (hijo !== el && hijo.hidden) continue;
      if (id === 'hud' && hijo === el) continue;
      const r = hijo.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      out.push({ id: hijo.id || id, x0: r.left, y0: r.top, x1: r.right, y1: r.bottom });
    }
  }
  return out;
}
