// Zonas protegidas: lo importante de cada puerta nunca queda tapado. Lo importante se deduce solo (la puerta, todo
// lo que se toca o se arrastra, los letreros y cuadros pintados con pistas, lo que el nivel marca con
// `c.proteger(...)` y los papelitos que se encuentran) y de ahí sale una máscara de la pantalla que el desorden
// respeta al regarse y al quedarse quieto. La decoración fija del escenario que estorbe se quita mientras dura la
// puerta, y en las pruebas se revisa con rayos desde la cámara qué tapa qué (en la vista general y en cada
// acercamiento que use el nivel).
import * as THREE from 'three';
import type { Entrada } from './entrada';
import type { Puerta } from './puerta';
import { Mascara, pintar } from './revision';

export interface Importante {
  obj: THREE.Object3D;
  /** Nombre para los informes. */
  que: string;
  /** Lo que no cuenta como «tapar» (el objeto mismo, la pieza del acertijo a la que pertenece). */
  propios: THREE.Object3D[];
}

export interface Fuentes {
  g: THREE.Object3D;
  puerta: Puerta;
  entrada: Entrada;
  /** Marcado a mano por el nivel (`c.proteger`) y los papelitos que ya se ven. */
  extra: THREE.Object3D[];
}

export const esDe = (o: THREE.Object3D | null, padre: THREE.Object3D) => {
  for (let x = o; x; x = x.parent) if (x === padre) return true;
  return false;
};

export function nombreDe(o: THREE.Object3D) {
  const partes: string[] = [];
  for (let x: THREE.Object3D | null = o; x && partes.length < 3; x = x.parent) {
    if (x.name === 'cuarto' || x.name.startsWith('acertijo') || x.name === 'desorden') break;
    if (x.name) partes.unshift(x.name);
  }
  return partes.join(' › ') || o.type;
}

const visibleTodo = (o: THREE.Object3D) => {
  for (let x: THREE.Object3D | null = o; x; x = x.parent) if (!x.visible) return false;
  return true;
};

/** Malla que se dibuja (no un área de toque invisible). `ahora`: además que tape lo de atrás (un vidrio, un brillo
 *  o algo casi transparente deja ver a través). */
function seDibuja(m: THREE.Mesh, ahora: boolean) {
  const mats = (Array.isArray(m.material) ? m.material : [m.material]) as THREE.Material[];
  return mats.some((mt) => mt && mt.visible !== false && (!ahora || ((!mt.transparent || mt.opacity > 0.6) && mt.blending !== THREE.AdditiveBlending)));
}

/** La pieza del acertijo (hijo directo de `raiz`) a la que pertenece un objeto. */
export function unidad(o: THREE.Object3D, raiz: THREE.Object3D) {
  let u = o;
  while (u.parent && u.parent !== raiz) u = u.parent;
  return u;
}

const tam = new THREE.Vector3();
function grande(o: THREE.Object3D, max = 2.4) {
  const b = new THREE.Box3().setFromObject(o);
  if (b.isEmpty()) return false;
  b.getSize(tam);
  return Math.max(tam.x, tam.y) > max;
}

function soloInvisible(o: THREE.Object3D) {
  let algo = false;
  o.traverse((x) => {
    const m = x as THREE.Mesh;
    if (m.isMesh && seDibuja(m, false)) algo = true;
  });
  return !algo;
}

/** Lo que no se puede tapar en la puerta que se está jugando. */
export function listarImportantes(f: Fuentes): Importante[] {
  const lista: Importante[] = [];
  const agregar = (obj: THREE.Object3D, propios: THREE.Object3D[]) => {
    if (lista.some((i) => esDe(obj, i.obj))) return;
    for (let i = lista.length - 1; i >= 0; i--) if (esDe(lista[i].obj, obj)) lista.splice(i, 1);
    lista.push({ obj, que: nombreDe(obj), propios });
  };
  f.g.updateWorldMatrix(true, true);
  agregar(f.puerta.toque, [f.puerta.grupo]);
  for (const [obj] of f.entrada.registrados()) {
    if (obj === f.puerta.toque || /^oscuridad/.test(obj.name)) continue;
    if (esDe(obj, f.g)) {
      // Áreas de gestos de pantalla entera (sin nada que se vea) no son «cosas»
      if (soloInvisible(obj) && grande(obj, 1.6)) continue;
      agregar(obj, [unidad(obj, f.g)]);
    } else if (esDe(obj, f.puerta.grupo)) agregar(obj, [obj, f.puerta.grupo]);
  }
  // Letreros, cuadros y notas pintados (ahí van las pistas y las claves) y lo marcado como importante
  f.g.traverse((o) => {
    const m = o as THREE.Mesh;
    const lienzo = m.isMesh && ((m.material as THREE.MeshStandardMaterial)?.map as THREE.CanvasTexture | null)?.isCanvasTexture;
    if ((lienzo && !grande(m) && seDibuja(m, false)) || o.userData.importante) agregar(o, [unidad(o, f.g)]);
  });
  for (const o of f.extra) if (o.parent) agregar(o, [o]);
  return lista;
}

/** Máscara de la pantalla con lo importante (y un margen alrededor), vista desde `cam`. */
export function mascaraImportante(lista: Importante[], cam: THREE.Camera, W: number, H: number, margen = 10) {
  const m = new Mascara(W, H);
  for (const i of lista) pintar(m, i.obj, cam, { ocultas: false, saltar: (o) => !o.visible });
  return m.engordar(margen);
}

// ---------------------------------------------------------------------------
// Rayos desde la cámara
// ---------------------------------------------------------------------------
const rc = new THREE.Raycaster();
const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();

/** Puntos sobre lo que se ve de un objeto (centros de sus triángulos, repartidos). */
export function muestras(obj: THREE.Object3D, max = 36): THREE.Vector3[] {
  obj.updateWorldMatrix(true, true);
  const mallas: { m: THREE.Mesh; n: number }[] = [];
  let total = 0;
  obj.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m as THREE.SkinnedMesh).isSkinnedMesh || !visibleTodo(m) || !seDibuja(m, false)) return;
    const geo = m.geometry;
    const n = Math.floor((geo.index ? geo.index.count : geo.attributes.position.count) / 3);
    if (!n) return;
    mallas.push({ m, n });
    total += n;
  });
  if (!total) {
    const b = new THREE.Box3().setFromObject(obj);
    return b.isEmpty() ? [] : [b.getCenter(new THREE.Vector3())];
  }
  const out: THREE.Vector3[] = [];
  const cuantas = Math.min(max, total);
  for (let j = 0; j < cuantas; j++) {
    let i = Math.floor(((j + 0.5) * total) / cuantas);
    let k = 0;
    while (k < mallas.length - 1 && i >= mallas[k].n) i -= mallas[k++].n;
    const e = mallas[k];
    i = Math.min(i, e.n - 1);
    const geo = e.m.geometry, pos = geo.attributes.position, idx = geo.index;
    const a = idx ? idx.getX(i * 3) : i * 3, b = idx ? idx.getX(i * 3 + 1) : i * 3 + 1, c = idx ? idx.getX(i * 3 + 2) : i * 3 + 2;
    va.fromBufferAttribute(pos, a);
    vb.fromBufferAttribute(pos, b);
    vc.fromBufferAttribute(pos, c);
    out.push(va.add(vb).add(vc).divideScalar(3).applyMatrix4(e.m.matrixWorld).clone());
  }
  return out;
}

/** Lo primero que se atraviesa entre la cámara y el punto (sin contar lo propio ni lo invisible). */
export function primeroDelante(cam: THREE.Camera, p: THREE.Vector3, raices: THREE.Object3D[], propios: THREE.Object3D[]) {
  const ojo = cam.getWorldPosition(new THREE.Vector3());
  const dir = p.clone().sub(ojo);
  const d = dir.length();
  if (d < 1e-4) return { cual: null as THREE.Mesh | null, propio: false };
  rc.set(ojo, dir.divideScalar(d));
  rc.near = 0.05;
  rc.far = d - 0.02;
  const hits = rc.intersectObjects(raices, true);
  for (const h of hits) {
    const m = h.object as THREE.Mesh;
    // (los pedazos de algo roto se desvanecen solos en un momento)
    if (!m.isMesh || m.name === 'pedazo' || !visibleTodo(m) || !seDibuja(m, true)) continue;
    if (propios.some((x) => esDe(m, x))) return { cual: null, propio: true };
    return { cual: m, propio: false };
  }
  return { cual: null, propio: false };
}

// ---------------------------------------------------------------------------
// La decoración fija que estorba se quita mientras dura la puerta
// ---------------------------------------------------------------------------
/** Grupos de piezas sueltas de la decoración del escenario (las que se tocan entre sí van juntas: la lámpara con su
 *  cable y su foco). Las paredes, el piso, el techo, la puerta y las luces no cuentan. */
export function decoracion(cuarto: THREE.Object3D, puerta: THREE.Object3D) {
  const piezas: { o: THREE.Object3D; b: THREE.Box3 }[] = [];
  for (const o of cuarto.children) {
    if (o === puerta || (o as THREE.Light).isLight || /^(piso|techo|pared|cielo|fondo|marco)/.test(o.name) || o.userData.estructura) continue;
    const b = new THREE.Box3().setFromObject(o);
    if (b.isEmpty()) continue;
    b.getSize(tam);
    if (Math.max(tam.x, tam.y, tam.z) > 2.5) continue;
    piezas.push({ o, b: b.expandByScalar(0.03) });
  }
  // Uniones por contacto (componentes conexas)
  const padre = piezas.map((_, i) => i);
  const raiz = (i: number): number => (padre[i] === i ? i : (padre[i] = raiz(padre[i])));
  for (let i = 0; i < piezas.length; i++)
    for (let j = i + 1; j < piezas.length; j++) if (piezas[i].b.intersectsBox(piezas[j].b)) padre[raiz(i)] = raiz(j);
  const grupos = new Map<number, THREE.Object3D[]>();
  piezas.forEach((p, i) => {
    const r = raiz(i);
    if (!grupos.has(r)) grupos.set(r, []);
    grupos.get(r)!.push(p.o);
  });
  return [...grupos.values()];
}

/** Esconde la decoración fija que tape algo importante (desde la vista general). Devuelve cómo volverla a poner. */
export function despejar(cuarto: THREE.Object3D, puerta: THREE.Object3D, lista: Importante[], cam: THREE.Camera) {
  const grupos = decoracion(cuarto, puerta);
  if (!grupos.length) return { quitados: [] as string[], poner: () => {} };
  const deGrupo = new Map<THREE.Object3D, number>();
  grupos.forEach((g, i) => g.forEach((o) => deGrupo.set(o, i)));
  const raices = grupos.flat();
  const votos = new Map<number, number>();
  for (const imp of lista) {
    const ps = muestras(imp.obj, 24);
    const cuenta = new Map<number, number>();
    for (const p of ps) {
      const { cual } = primeroDelante(cam, p, raices, imp.propios);
      if (!cual) continue;
      const u = unidad(cual, cuarto);
      const gi = deGrupo.get(u);
      if (gi !== undefined) cuenta.set(gi, (cuenta.get(gi) ?? 0) + 1);
    }
    for (const [gi, n] of cuenta) if (n >= 2 || n / Math.max(1, ps.length) >= 0.08) votos.set(gi, Math.max(votos.get(gi) ?? 0, n));
  }
  const quitados: THREE.Object3D[] = [];
  for (const gi of votos.keys()) for (const o of grupos[gi]) if (o.visible) {
    o.visible = false;
    quitados.push(o);
  }
  return {
    quitados: quitados.map(nombreDe),
    poner: () => {
      for (const o of quitados) o.visible = true;
    },
  };
}
