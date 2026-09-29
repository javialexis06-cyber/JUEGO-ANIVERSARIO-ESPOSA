// Ropa, peinados, accesorios y disfraces puestos sobre Él y Ella.
// Cada prenda viene con el mismo esqueleto del personaje: sus mallas se amarran a los huesos del personaje por
// nombre (así siguen todas las poses) y se ocultan las partes de fábrica que tapa (la camiseta, el pelo...).
import * as THREE from 'three';
import { clone as clonarConEsqueleto } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { Personaje } from '../personaje';
import { cargarAnimado, liberarEsqueletos } from '../recursos';
import { ITEM, type Item } from './catalogo';
import { RANURAS, type Rol, type Ropa, type Ranura } from './modelo';

/** Partes de fábrica que tapa cada ranura (prefijos del nombre de la malla). */
const TAPA: Record<Rol, Partial<Record<Ranura | 'medias' | 'copete', string[]>>> = {
  el: {
    copete: ['mechon copete', 'mechon flequillo'],
    arriba: ['torso camiseta', 'cuello camiseta', 'ribete', 'pespunte camiseta', 'suciedad ropa'],
    abajo: ['pantalon', 'pespunte pantalon'],
    pies: ['tenis', 'suela'],
    pelo: ['cabello base', 'mechon'],
  },
  ella: {
    arriba: ['torso camiseta', 'cuello camiseta', 'ribete manga', 'pespunte camiseta', 'chaleco', 'solapa', 'tapa bolsillo', 'pespunte chaleco',
      'suciedad ropa'],
    abajo: ['pantalon', 'dobladillo short', 'pespunte shorts'],
    pies: ['tenis', 'suela', 'cordon'],
    pelo: ['cabello base', 'mechon'],
    medias: ['media', 'puño media'],
  },
};

/** En la tina quedan en ropa interior: se esconden los zapatos, el chaleco y los detalles de la ropa… */
const BANO_TAPA: Record<Rol, string[]> = {
  el: ['cuello camiseta', 'ribete', 'pespunte', 'suciedad ropa', 'tenis', 'suela'],
  ella: ['chaleco', 'solapa', 'tapa bolsillo', 'pespunte', 'cuello camiseta', 'ribete manga', 'suciedad ropa', 'tenis', 'suela', 'cordon', 'media', 'puño media'],
};
/** …y la camiseta y el pantalón de fábrica cambian de color: Él sin camisa y en bóxer, Ella en ropa interior rosada. */
const BANO_COLOR: Record<Rol, Record<string, string>> = {
  el: { 'torso camiseta': 'piel', pantalon: '#6b8fd6' },
  ella: { 'torso camiseta': '#f7c6d2', pantalon: '#f7c6d2' },
};

/** Colores de pelo (tintes): el negro de fábrica no necesita tinte. */
const MATERIAL_PELO = /cabello|\bpelo\b/i;

interface Puesto {
  id: string;
  mallas: THREE.Object3D[];
}

/** Qué ranuras ocupa una prenda (un vestido ocupa arriba y abajo). */
export const ranurasDe = (it: Item): Ranura[] => [it.ranura!, ...(it.tambien ?? [])];

export class Vestuario {
  private puestos = new Map<Ranura, Puesto>();
  private turno = 0;
  private clave = '';
  private coloresPelo = new Map<THREE.Material, THREE.Color>();
  private bano = false;
  private originales = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();

  constructor(private p: Personaje, private rol: Rol) {}

  /** Pone exactamente esta ropa (lo que ya estaba puesto y no cambia se queda). */
  async aplicar(ropa: Ropa | undefined, colorPelo?: string) {
    const clave = JSON.stringify([ropa ?? {}, colorPelo ?? '']);
    if (clave === this.clave) return;
    this.clave = clave;
    const turno = ++this.turno;
    const deseado = new Map<Ranura, string>();
    for (const r of RANURAS) {
      const id = ropa?.[r];
      const it = id ? ITEM[id] : undefined;
      if (it?.tipo === 'ropa' && it.ranura === r && (it.para ?? ['el', 'ella']).includes(this.rol)) deseado.set(r, id!);
    }
    // Quitar lo que ya no va
    for (const [r, puesto] of [...this.puestos]) {
      if (deseado.get(r) !== puesto.id) this.quitar(r);
    }
    // Cargar lo nuevo (en paralelo); si mientras carga llega otro cambio, este se descarta
    const nuevos = [...deseado].filter(([r, id]) => this.puestos.get(r)?.id !== id);
    const cargados = await Promise.all(nuevos.map(async ([r, id]) => [r, id, await this.cargar(id).catch(() => null)] as const));
    if (turno !== this.turno) {
      for (const [, , mallas] of cargados) if (mallas) liberarEsqueletos(...mallas);
      return;
    }
    const raiz = this.p.raizMallas;
    for (const [r, id, mallas] of cargados) {
      if (!mallas || !raiz) continue;
      for (const m of mallas) raiz.add(m);
      this.puestos.set(r, { id, mallas });
    }
    this.taparFabrica();
    this.teñir(colorPelo);
    if (this.bano) this.ponerBano(true);
  }

  /** En la tina: en ropa interior (sin la ropa comprada, salvo el peinado). Al salir se vuelve a vestir. */
  enBano(si: boolean) {
    if (si === this.bano) return;
    this.bano = si;
    this.ponerBano(si);
  }

  private ponerBano(si: boolean) {
    for (const [r, puesto] of this.puestos) if (r !== 'pelo') for (const m of puesto.mallas) m.visible = !si;
    if (!si) {
      for (const [m, mat] of this.originales) m.material = mat;
      this.originales.clear();
      this.taparFabrica();
      return;
    }
    const tapa = TAPA[this.rol];
    this.p.tapar([...BANO_TAPA[this.rol], ...(this.puestos.has('pelo') ? tapa.pelo ?? [] : [])]);
    const piel = (this.p.partes.get('brazo der')?.[0] as THREE.Mesh | undefined)?.material as THREE.MeshStandardMaterial | undefined;
    for (const [parte, color] of Object.entries(BANO_COLOR[this.rol])) {
      for (const o of this.p.partes.get(parte) ?? []) {
        const m = o as THREE.Mesh;
        if (!m.isMesh || this.originales.has(m)) continue;
        this.originales.set(m, m.material);
        const nuevo = color === 'piel' && piel ? piel : ((Array.isArray(m.material) ? m.material[0] : m.material).clone() as THREE.MeshStandardMaterial);
        if (color !== 'piel') nuevo.color.set(color);
        m.material = nuevo;
      }
    }
  }

  private quitar(r: Ranura) {
    const puesto = this.puestos.get(r);
    if (!puesto) return;
    for (const m of puesto.mallas) m.removeFromParent();
    liberarEsqueletos(...puesto.mallas);
    this.puestos.delete(r);
  }

  /** Carga la prenda y amarra sus mallas a los huesos del personaje. */
  private async cargar(id: string): Promise<THREE.Object3D[] | null> {
    const it = ITEM[id];
    if (!it?.modelo) return null;
    const { escena } = await cargarAnimado(`ropa/${it.modelo}_${this.rol}.glb`);
    const copia = clonarConEsqueleto(escena);
    const mallas: THREE.SkinnedMesh[] = [];
    copia.traverse((o) => {
      if ((o as THREE.SkinnedMesh).isSkinnedMesh) mallas.push(o as THREE.SkinnedMesh);
    });
    const listas: THREE.Object3D[] = [];
    for (const m of mallas) {
      const huesos = m.skeleton.bones.map((b) => this.p.huesos.get(b.name));
      if (huesos.some((h) => !h)) continue;
      m.bind(new THREE.Skeleton(huesos as THREE.Bone[], m.skeleton.boneInverses), m.bindMatrix);
      m.frustumCulled = false;
      m.castShadow = true;
      if (it.colores) this.colorear(m, it.colores);
      listas.push(m);
    }
    return listas;
  }

  /** Colores de la variante: cada material se llama por su papel («principal», «detalle»...). */
  private colorear(m: THREE.Mesh, colores: Record<string, string>) {
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    const nuevos = mats.map((mat) => {
      const papel = Object.keys(colores).find((k) => new RegExp(`\\b${k}\\b`).test(mat.name));
      if (!papel) return mat;
      const c = mat.clone() as THREE.MeshStandardMaterial;
      c.color.set(colores[papel]);
      return c;
    });
    m.material = Array.isArray(m.material) ? nuevos : nuevos[0];
  }

  private taparFabrica() {
    const tapa = TAPA[this.rol];
    const prefijos: string[] = [];
    for (const [r, puesto] of this.puestos) {
      prefijos.push(...(tapa[r] ?? []));
      for (const extra of ITEM[puesto.id]?.oculta ?? []) prefijos.push(...(tapa[extra as Ranura] ?? []));
      for (const otra of ITEM[puesto.id]?.tambien ?? []) prefijos.push(...(tapa[otra] ?? []));
    }
    this.p.tapar(prefijos);
  }

  /** Tinte: el pelo de fábrica y el de los peinados comprados toman el color elegido. */
  private teñir(color?: string) {
    const mallas: THREE.Mesh[] = [];
    this.p.modelo?.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) mallas.push(o as THREE.Mesh);
    });
    for (const m of mallas) {
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats as THREE.MeshStandardMaterial[]) {
        if (!MATERIAL_PELO.test(mat.name) || !mat.color) continue;
        if (!this.coloresPelo.has(mat)) this.coloresPelo.set(mat, mat.color.clone());
        if (color) mat.color.set(color);
        else mat.color.copy(this.coloresPelo.get(mat)!);
      }
    }
  }

  /** Suelta todo (al cerrar la casa). */
  liberar() {
    for (const r of [...this.puestos.keys()]) this.quitar(r);
  }
}
