// El vestidor de los amigos: pone sobre el muñeco (el de Javier o el de Laura como molde) lo que el amigo armó en el
// creador de personajes: peinado, ropa, zapatos y accesorios del clóset genérico (`prendas.ts`), con los colores que
// escogió en cada prenda, y su cara (piel, pelo, ojos, cejas, rubor) y sus joyas (aretes y collares, `joyas.ts`).
// Lo usan el creador, la sala de juegos, Lavarse la cara y Sangre y Ceniza: un solo lugar para vestir a un amigo
// «tal cual» lo hizo (docs/salas.md).
import * as THREE from 'three';
import { clone as clonarConEsqueleto } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { Personaje } from '../personaje';
import { cargarAnimado, liberarEsqueletos } from '../recursos';
import { TAPA } from '../casa/ropa_tapa';
import { ponerJoyas } from './joyas';
import { joyasDe, trajeDe, type Cuerpo, type Pieza, type RanuraAmigo } from './prendas';
import { teñirMallas } from './tinte';
import type { AspectoJugador } from './tipos';

interface Puesta {
  pieza: Pieza;
  mallas: THREE.SkinnedMesh[];
  /** Material de fábrica de cada malla (para volver a pintar sin acumular copias). */
  originales: Map<THREE.Mesh, THREE.Material | THREE.Material[]>;
}

/** Viste a UN muñeco y lo vuelve a vestir cuando cambia algo (lo que no cambia de modelo no se vuelve a cargar). */
export class Vestidor {
  private puestas = new Map<RanuraAmigo, Puesta>();
  private turno = 0;
  private propios: THREE.Material[] = [];
  private originalesBase = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  private joyas: { quitar(): void } | null = null;
  private claveJoyas = '';

  constructor(private p: Personaje, private cuerpo: Cuerpo) {}

  /**
   * Pone este aspecto. `piezas` cambia la ropa (los disfraces del lavado traen la suya); por defecto, la del amigo.
   * Devuelve false si mientras cargaba llegó otro cambio (y este se descartó).
   */
  async aplicar(a: AspectoJugador, piezas: Partial<Record<RanuraAmigo, Pieza>> = trajeDe(a)): Promise<boolean> {
    const turno = ++this.turno;
    // Lo que ya no va (o cambió de modelo) se quita; lo nuevo se carga en paralelo
    for (const [r, puesta] of [...this.puestas]) if (piezas[r]?.modelo !== puesta.pieza.modelo) this.quitar(r);
    const nuevas = (Object.entries(piezas) as [RanuraAmigo, Pieza][]).filter(([r, pz]) => this.puestas.get(r)?.pieza.modelo !== pz.modelo);
    const cargadas = await Promise.all(nuevas.map(async ([r, pz]) => [r, pz, await this.cargar(pz.modelo).catch(() => null)] as const));
    if (turno !== this.turno) {
      for (const [, , m] of cargadas) if (m) liberarEsqueletos(...m);
      return false;
    }
    const raiz = this.p.raizMallas;
    for (const [r, pz, mallas] of cargadas) {
      if (!mallas || !raiz) continue;
      for (const m of mallas) raiz.add(m);
      this.puestas.set(r, { pieza: pz, mallas, originales: new Map(mallas.map((m) => [m, m.material])) });
    }
    for (const [r, puesta] of this.puestas) puesta.pieza = piezas[r] ?? puesta.pieza;
    this.teñirBase(a);
    for (const puesta of this.puestas.values()) this.pintar(puesta, a);
    this.taparFabrica(a);
    const j = joyasDe(a);
    const clave = JSON.stringify(j);
    if (clave !== this.claveJoyas) {
      this.claveJoyas = clave;
      this.joyas?.quitar();
      this.joyas = ponerJoyas(this.p, j);
    }
    return true;
  }

  /** Las mallas de lo que está puesto en una ranura (para los retoques de los disfraces del lavado). */
  mallasDe(r: RanuraAmigo): THREE.Object3D[] {
    return this.puestas.get(r)?.mallas ?? [];
  }

  private quitar(r: RanuraAmigo) {
    const puesta = this.puestas.get(r);
    if (!puesta) return;
    for (const m of puesta.mallas) {
      m.removeFromParent();
      for (const x of Array.isArray(m.material) ? m.material : [m.material]) if (!this.esOriginal(puesta, x)) x.dispose();
    }
    liberarEsqueletos(...puesta.mallas);
    this.puestas.delete(r);
  }

  private esOriginal(puesta: Puesta, mat: THREE.Material) {
    for (const o of puesta.originales.values()) if (o === mat || (Array.isArray(o) && o.includes(mat))) return true;
    return false;
  }

  /** Carga la prenda y amarra sus mallas a los huesos del muñeco (como el clóset de la casa). */
  private async cargar(modelo: string): Promise<THREE.SkinnedMesh[] | null> {
    const { escena } = await cargarAnimado(`ropa/${modelo}_${this.cuerpo}.glb`);
    const copia = clonarConEsqueleto(escena);
    const mallas: THREE.SkinnedMesh[] = [];
    copia.traverse((o) => {
      const m = o as THREE.SkinnedMesh;
      if (!m.isSkinnedMesh) return;
      const huesos = m.skeleton.bones.map((b) => this.p.huesos.get(b.name));
      if (huesos.some((h) => !h)) return;
      m.bind(new THREE.Skeleton(huesos as THREE.Bone[], m.skeleton.boneInverses), m.bindMatrix);
      m.frustumCulled = false;
      m.castShadow = true;
      mallas.push(m);
    });
    return mallas;
  }

  /** La piel, el pelo, los ojos, las cejas, el rubor y la ropa de fábrica (en copias de los materiales). */
  private teñirBase(a: AspectoJugador) {
    for (const m of this.propios) m.dispose();
    this.propios = [];
    const modelo = this.p.modelo;
    if (!modelo) return;
    // Siempre desde los materiales de fábrica (si no, cada cambio pintaría sobre la copia anterior)
    const ropa = new Set<THREE.Object3D>();
    for (const puesta of this.puestas.values()) for (const m of puesta.mallas) ropa.add(m);
    modelo.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || ropa.has(m)) return;
      if (!this.originalesBase.has(m)) this.originalesBase.set(m, m.material);
      m.material = this.originalesBase.get(m)!;
    });
    this.propios = teñirMallas(this.originalesBase.keys(), a);
  }

  /** Los colores de una prenda: los que escogió el amigo, y la piel y el pelo donde la prenda los muestra. */
  private pintar(puesta: Puesta, a: AspectoJugador) {
    const colores = puesta.pieza.colores;
    for (const m of puesta.mallas) {
      const orig = puesta.originales.get(m)!;
      for (const x of Array.isArray(m.material) ? m.material : [m.material]) if (!this.esOriginal(puesta, x)) x.dispose();
      const cambiar = (mat: THREE.Material) => {
        const n = mat.name;
        let color: string | undefined;
        if (/piel/i.test(n)) color = a.piel;
        else if (/\bpelo\b|cabello/i.test(n)) color = a.pelo;
        else {
          const papel = Object.keys(colores).find((k) => new RegExp(`\\b${k}\\b`).test(n.slice(puesta.pieza.modelo.length)));
          color = papel ? colores[papel] : undefined;
        }
        if (!color) return mat;
        const c = mat.clone() as THREE.MeshStandardMaterial;
        c.color?.set(color);
        return c;
      };
      m.material = Array.isArray(orig) ? orig.map(cambiar) : cambiar(orig);
    }
  }

  /** Esconde lo de fábrica que queda debajo de la ropa puesta (y las medias, si no quiere medias). */
  private taparFabrica(a: AspectoJugador) {
    const tapa = TAPA[this.cuerpo];
    const prefijos: string[] = [];
    for (const [r, puesta] of this.puestas) {
      prefijos.push(...(tapa[r] ?? []));
      for (const x of [...puesta.pieza.tambien, ...puesta.pieza.oculta]) prefijos.push(...(tapa[x as RanuraAmigo] ?? []));
    }
    if (a.detalles?.medias === 'no') prefijos.push(...(tapa.medias ?? []));
    this.p.tapar(prefijos);
  }

  /** Suelta todo (al cerrar el creador o el juego). */
  liberar() {
    this.turno++;
    for (const r of [...this.puestas.keys()]) this.quitar(r);
    for (const m of this.propios) m.dispose();
    this.propios = [];
    this.joyas?.quitar();
    this.joyas = null;
  }
}
