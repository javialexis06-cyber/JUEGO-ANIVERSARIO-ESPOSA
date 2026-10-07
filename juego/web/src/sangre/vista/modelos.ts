// La biblioteca de modelos de Sangre y Ceniza: lee los GLB del contrato de arte (modelos/sangre/*.glb) y, si alguno
// todavía no existe, usa los reemplazos hechos por código. Todo lo que devuelve ya lee la rejilla de luz.
import * as THREE from 'three';
import { cargar } from '../../recursos';
import { BIOMAS } from '../datos/mundo';
import type { IdBioma } from '../tipos';
import { geoFloat } from './formas';
import { conLuz } from './luz';
import { modeloDeNodo, PIEZA, type ModeloPiezas } from './piezas';
import { reemplazo } from './reemplazos';
import { armaReemplazo, cosaReemplazo, proyectilReemplazo } from './reemplazos_cosas';
import { antorchaReemplazo, decoReemplazo, fijo, paredesReemplazo, velasReemplazo, type ModeloFijo, type ModelosPared } from './reemplazos_mapa';

const RUTA = 'sangre/';

/** Movimiento de cada tipo (piernas, brazos, rebote, aleteo) para los modelos del GLB. */
const MOV: Record<string, [number, number, number, number]> = {
  cuervo: [0, 0, 0.3, 2.2], murcielago: [0, 0, 0.3, 3], perro_huesos: [1.2, 0, 1, 1], arana_cripta: [0.5, 0, 0.4, 1], espectro: [0, 0.6, 0.2, 1],
  rata_peste: [1.4, 0, 0.6, 1], abominacion: [0.6, 0.6, 1.5, 1], gargola: [0.4, 0.5, 0.6, 1.2], abadesa: [0, 0.6, 0.2, 1], gusano_sangre: [0, 0, 0.6, 1],
  zombi: [0.8, 0.4, 1, 1], monje_caido: [0.4, 0.5, 0.8, 1], novia_vampira: [0.2, 0.5, 0.4, 1],
};

export class Biblioteca {
  private glb = new Map<string, THREE.Group | null>();
  private piezas = new Map<string, ModeloPiezas>();
  private fijos = new Map<string, ModeloFijo>();
  private paredesB: ModelosPared | null = null;
  bioma: IdBioma = 'cementerio';

  /** Lee los GLB que haya (los que falten se reemplazan). */
  async cargar(bioma: IdBioma) {
    if (bioma !== this.bioma) {
      // Lo del escenario es de cada bioma
      this.paredesB = null;
      for (const k of [...this.fijos.keys()]) if (k.startsWith('deco:') || k === 'antorcha' || k === 'velas') this.fijos.delete(k);
    }
    this.bioma = bioma;
    const nombres = ['enemigos', 'jefes', 'armas', 'proyectiles', 'cosas', `bioma_${bioma}`];
    await Promise.all(nombres.map(async (n) => {
      if (this.glb.has(n)) return;
      try {
        const g = await cargar(`${RUTA}${n}.glb`);
        this.glb.set(n, g);
      } catch {
        this.glb.set(n, null);
      }
    }));
  }

  /** ¿Llegó el modelo de verdad de este archivo? */
  tiene(archivo: string) {
    return !!this.glb.get(archivo);
  }

  private nodo(archivo: string, nombre: string): THREE.Object3D | null {
    const g = this.glb.get(archivo);
    if (!g) return null;
    return g.getObjectByName(nombre) ?? null;
  }

  /** Enemigo, jefe o aliado por piezas. */
  enemigo(id: string): ModeloPiezas {
    let m = this.piezas.get(id);
    if (m) return m;
    const alas = id === 'conde_alas';
    const base = alas ? 'conde' : id;
    const n = this.nodo('enemigos', `enemigo_${base}`) ?? this.nodo('jefes', `jefe_${base}`) ?? this.nodo('cosas', `c_${base}`);
    if (n) {
      const copia = n.clone(true);
      // El Conde: las alas solo en la segunda fase
      if (base === 'conde' && !alas) copia.getObjectByName('extra_alas')?.removeFromParent();
      const mov = MOV[base];
      m = modeloDeNodo(copia, mov ? new THREE.Vector4(...mov) : undefined) ?? reemplazo(id);
    } else m = reemplazo(id);
    this.piezas.set(id, m);
    return m;
  }

  /** Un modelo fijo (arma en la mano, proyectil, cosa del piso, decoración). */
  fijo(tipo: 'arma' | 'proyectil' | 'cosa' | 'deco', id: string): ModeloFijo {
    const k = `${tipo}:${id}`;
    let m = this.fijos.get(k);
    if (m) return m;
    const archivo = tipo === 'arma' ? 'armas' : tipo === 'proyectil' ? 'proyectiles' : tipo === 'cosa' ? 'cosas' : `bioma_${this.bioma}`;
    const prefijo = tipo === 'arma' ? 'arma_' : tipo === 'proyectil' ? 'p_' : tipo === 'cosa' ? 'c_' : 'deco_';
    // (las luces de piso del bioma, como el farol o el brasero, entran como decoración con «__»)
    const n = this.nodo(archivo, id.startsWith('__') ? id.slice(2) : prefijo + id);
    if (n) m = deNodo(n, tipo === 'deco');
    else if (tipo === 'arma') m = armaReemplazo(id);
    else if (tipo === 'proyectil') m = proyectilReemplazo(id);
    else if (tipo === 'cosa') m = cosaReemplazo(id);
    else m = decoReemplazo(id, BIOMAS[this.bioma]);
    m = iluminar(m);
    this.fijos.set(k, m);
    return m;
  }

  /** Bloques de pared del bioma (variantes por tipo de roca). */
  paredes(): ModelosPared {
    if (this.paredesB) return this.paredesB;
    const r = paredesReemplazo(BIOMAS[this.bioma]);
    const b = `bioma_${this.bioma}`;
    const variantes = (claves: string[], antes: ModeloFijo[]) => {
      const l = claves.map((c) => this.nodo(b, c)).filter((x): x is THREE.Object3D => !!x).map((x) => deNodo(x, false));
      return l.length ? l : antes;
    };
    const p: ModelosPared = {
      blanda: variantes(['pared_blanda_a', 'pared_blanda_b', 'pared_blanda_c'], r.blanda),
      dura: variantes(['pared_dura_a', 'pared_dura_b'], r.dura),
      borde: variantes(['pared_borde'], r.borde),
      hierro: variantes(['veta_hierro'], r.hierro),
      sangre: variantes(['veta_sangre'], r.sangre),
      oro: variantes(['veta_oro'], r.oro),
      huevo: r.huevo,
      escombro: variantes(['pared_escombro'], r.escombro),
    };
    for (const k of Object.keys(p) as (keyof ModelosPared)[]) p[k] = p[k].map(iluminar);
    this.paredesB = p;
    return p;
  }

  antorcha(): ModeloFijo {
    const k = 'antorcha';
    let m = this.fijos.get(k);
    if (!m) {
      const n = this.nodo(`bioma_${this.bioma}`, 'luz_antorcha');
      m = iluminar(n ? deNodo(n, true) : antorchaReemplazo());
      this.fijos.set(k, m);
    }
    return m;
  }

  velas(): ModeloFijo {
    const k = 'velas';
    let m = this.fijos.get(k);
    if (!m) {
      const n = this.nodo(`bioma_${this.bioma}`, 'luz_vela');
      m = iluminar(n ? deNodo(n, true) : velasReemplazo());
      this.fijos.set(k, m);
    }
    return m;
  }

  /** Dónde va la llama de la antorcha del GLB (nodo vacío «llama»); por defecto, la del reemplazo. */
  llamaAntorcha(): THREE.Vector3 {
    return this.antorcha().llamas?.[0]?.clone() ?? new THREE.Vector3(0, 1.38, -0.24);
  }

  /** ¿Las paredes y pisos son los modelados (no se giran) o los reemplazos? */
  get escenarioModelado() {
    return this.tiene(`bioma_${this.bioma}`);
  }



  /** Losas del piso del bioma (si llegaron): bloques de 2 × 2 m. */
  pisos(): ModeloFijo[] {
    const g = this.glb.get(`bioma_${this.bioma}`);
    if (!g) return [];
    const l: ModeloFijo[] = [];
    g.traverse((o) => {
      if (/^piso_/.test(o.name) && o.parent === g) l.push(iluminar(deNodo(o, false)));
    });
    return l;
  }
}

const MEDIA_VUELTA = new THREE.Matrix4().makeRotationY(Math.PI);

/**
 * Junta las mallas de un nodo (en su propio espacio) en un modelo fijo, con sus datos (userData) y sus llamas.
 * `girar`: media vuelta para que el frente quede hacia −Z como en los reemplazos (decoración y luces; las paredes y
 * los pisos de los biomas no se giran nunca).
 */
function deNodo(n: THREE.Object3D, girar: boolean): ModeloFijo {
  n.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(n.matrixWorld).invert();
  if (girar) inv.premultiply(MEDIA_VUELTA);
  const partes: [THREE.BufferGeometry, THREE.Material][] = [];
  const llamas: THREE.Vector3[] = [];
  n.traverse((o) => {
    if (o !== n && o.name.startsWith('llama')) llamas.push(new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)));
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const g = geoFloat(m.geometry);
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    partes.push([g, mats[0]]);
  });
  if (!partes.length) return fijo([[new THREE.BoxGeometry(0.01, 0.01, 0.01), new THREE.MeshBasicMaterial()]]);
  const r = fijo(partes);
  r.datos = { ...n.userData };
  r.llamas = llamas;
  return r;
}

/** Materiales de fuego ya iluminados (todas las llamas modeladas titilan juntas). */
export const FUEGOS: THREE.MeshStandardMaterial[] = [];

/** Copia los materiales y les pone la rejilla de luz. */
function iluminar(m: ModeloFijo): ModeloFijo {
  if ((m as any).__luz) return m;
  const mats = m.mats.map((x) => {
    const c = conLuz(x.clone());
    if (/^(fuego|brasa|lava)/.test(x.name) && (c as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
      const s = c as THREE.MeshStandardMaterial;
      s.userData.emisionBase = s.emissiveIntensity;
      FUEGOS.push(s);
    }
    return c;
  });
  const r: ModeloFijo = { geo: m.geo, mats, datos: m.datos, llamas: m.llamas };
  (r as any).__luz = true;
  return r;
}

export { PIEZA };
