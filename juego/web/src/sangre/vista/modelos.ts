// La biblioteca de modelos de Sangre y Ceniza: lee los GLB del contrato de arte (modelos/sangre/*.glb) y, si alguno
// todavía no existe, usa los reemplazos hechos por código. Todo lo que devuelve ya lee la rejilla de luz.
// En calidad alta lee además `bioma_<id>_alta.glb`: las losas del piso con su textura nítida (modelos/sangre/alta/) y
// las piezas de detalle (`det_*`) que el mapa riega solo en la vista.
import * as THREE from 'three';
import { cargar } from '../../recursos';
import { BIOMAS } from '../datos/mundo';
import type { IdBioma } from '../tipos';
import { geoFloat } from './formas';
import { conLuz } from './luz';
import { conRoca, esRoca, inyectarRoca, prepararTextura, type InyectorRoca } from './roca';
import { modeloDeNodo, PIEZA, type ModeloPiezas } from './piezas';
import { reemplazo } from './reemplazos';
import { armaReemplazo, cosaReemplazo, proyectilReemplazo } from './reemplazos_cosas';
import { antorchaReemplazo, decoReemplazo, fijo, paredesReemplazo, velasReemplazo, type ModeloFijo, type ModelosPared } from './reemplazos_mapa';

const RUTA = 'sangre/';
const RUTA_TEXTURAS = './modelos/sangre/alta/';

/** Una pieza de detalle de la calidad alta: dónde va (piso abierto, pie de pared, colgada) y qué tan seguido sale. */
export interface Detalle {
  mod: ModeloFijo;
  lugar: 'suelo' | 'pie' | 'muro';
  peso: number;
}

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
  private pisosB: ModeloFijo[] | null = null;
  private detallesB: Detalle[] | null = null;
  /** Texturas de las losas de la calidad alta (color y relieve), por nombre. */
  private texturas = new Map<string, [THREE.Texture, THREE.Texture]>();
  /** La roca de las paredes del bioma en calidad alta (o null). */
  private texRoca: THREE.Texture | null = null;
  bioma: IdBioma = 'cementerio';
  /** ¿Se pidió lo de la calidad alta para este bioma? */
  private altaPedida = false;

  /** Lee los GLB que haya (los que falten se reemplazan). `alta`: también el detalle de la calidad alta. */
  async cargar(bioma: IdBioma, alta = false) {
    if (bioma !== this.bioma || alta !== this.altaPedida) {
      // Lo del escenario es de cada bioma
      this.paredesB = null;
      this.pisosB = null;
      this.detallesB = null;
      for (const k of [...this.fijos.keys()]) if (k.startsWith('deco:') || k === 'antorcha' || k === 'velas') this.fijos.delete(k);
    }
    if (bioma !== this.bioma) {
      for (const [t, n] of this.texturas.values()) (t.dispose(), n.dispose());
      this.texturas.clear();
      this.texRoca?.dispose();
      this.texRoca = null;
    }
    this.bioma = bioma;
    this.altaPedida = alta;
    const nombres = ['enemigos', 'jefes', 'armas', 'proyectiles', 'cosas', `bioma_${bioma}`];
    if (alta) nombres.push(`bioma_${bioma}_alta`);
    await Promise.all(nombres.map(async (n) => {
      if (this.glb.has(n)) return;
      try {
        const g = await cargar(`${RUTA}${n}.glb`);
        this.glb.set(n, g);
      } catch {
        this.glb.set(n, null);
      }
    }));
    // Las texturas de las losas (si no llegan, la losa se queda con el color en los vértices de la calidad media)
    const g = alta ? this.glb.get(`bioma_${bioma}_alta`) : null;
    if (g) {
      const cargador = new THREE.TextureLoader();
      const leer = (url: string, srgb: boolean) =>
        cargador.loadAsync(url).then((t) => {
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
          t.anisotropy = 8;
          return t;
        });
      const pedidas: Promise<void>[] = [];
      g.traverse((o) => {
        const tex = o.userData?.textura as string | undefined;
        if (!tex || this.texturas.has(tex) || o.parent !== g) return;
        pedidas.push(
          Promise.all([leer(`${RUTA_TEXTURAS}${tex}.webp`, true), leer(`${RUTA_TEXTURAS}${tex}_n.webp`, false)])
            .then((par) => void this.texturas.set(tex, par))
            .catch(() => undefined),
        );
      });
      if (!this.texRoca)
        pedidas.push(
          cargador.loadAsync(`${RUTA_TEXTURAS}${bioma}_roca.webp`).then((t) => void (this.texRoca = prepararTextura(t))).catch(() => undefined),
        );
      await Promise.all(pedidas);
    }
  }

  /** El detalle de roca de las paredes (la textura del bioma; si no llegó, la genérica). */
  get rocaParedes(): InyectorRoca {
    return this.texRoca ? conRoca(this.texRoca) : inyectarRoca;
  }

  /** ¿Llegó el detalle de la calidad alta de este bioma? */
  get hayAlta() {
    return this.altaPedida && this.tiene(`bioma_${this.bioma}_alta`);
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
    m = iluminar(m, tipo === 'deco' && this.hayAlta ? inyectarRoca : undefined);
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
    const roca = this.hayAlta ? this.rocaParedes : undefined;
    for (const k of Object.keys(p) as (keyof ModelosPared)[]) p[k] = p[k].map((m) => iluminar(m, roca));
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



  /** Losas del piso del bioma (si llegaron): bloques de 2 × 2 m. En calidad alta, las de textura nítida. */
  pisos(): ModeloFijo[] {
    if (this.pisosB) return this.pisosB;
    const normal = this.glb.get(`bioma_${this.bioma}`);
    if (!normal) return [];
    const alta = this.hayAlta ? this.glb.get(`bioma_${this.bioma}_alta`)! : null;
    const l: ModeloFijo[] = [];
    normal.traverse((o) => {
      if (!/^piso_/.test(o.name) || o.parent !== normal) return;
      const n = alta?.children.find((x) => x.name === o.name);
      const tex = n ? this.texturas.get(n.userData?.textura) : undefined;
      l.push(n && tex ? losaConTextura(deNodo(n, false), tex) : iluminar(deNodo(o, false)));
    });
    this.pisosB = l;
    return l;
  }

  /** Las piezas de detalle de la calidad alta (vacío si no se pidieron o no llegaron). */
  detalles(): Detalle[] {
    if (this.detallesB) return this.detallesB;
    const g = this.hayAlta ? this.glb.get(`bioma_${this.bioma}_alta`)! : null;
    const l: Detalle[] = [];
    g?.children.forEach((o) => {
      const lugar = o.userData?.lugar;
      if (!/^det_/.test(o.name) || (lugar !== 'suelo' && lugar !== 'pie' && lugar !== 'muro')) return;
      l.push({ mod: iluminar(deNodo(o, false)), lugar, peso: Number(o.userData?.peso) || 1 });
    });
    this.detallesB = l;
    return l;
  }
}

/**
 * Losa de la calidad alta: el campo (material `tierra`) lleva la textura de color y la de relieve; sus vértices
 * traen solo la oclusión y los bordes en gris (`textura_escala` lo devuelve a 1). Las coordenadas de la textura
 * salen de la posición (la losa mide 2 × 2 m y está centrada en su origen).
 */
function losaConTextura(m: ModeloFijo, [mapa, relieve]: [THREE.Texture, THREE.Texture]): ModeloFijo {
  const p = m.geo.getAttribute('position');
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = p.getX(i) / 2 + 0.5;
    uv[i * 2 + 1] = -p.getZ(i) / 2 + 0.5;
  }
  m.geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const escala = Number(m.datos?.textura_escala) || 1;
  m.mats = m.mats.map((x) => {
    if (!x.name.startsWith('tierra')) return x;
    const c = x.clone() as THREE.MeshStandardMaterial;
    c.map = mapa;
    c.normalMap = relieve;
    c.normalScale = new THREE.Vector2(1.4, 1.4);
    c.color.setScalar(escala);
    return c;
  });
  return iluminar(m);
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

/** Copia los materiales y les pone la rejilla de luz (y, en calidad alta, el grano de roca a la piedra y la tierra). */
function iluminar(m: ModeloFijo, roca?: InyectorRoca): ModeloFijo {
  if ((m as any).__luz) return m;
  const mats = m.mats.map((x) => {
    const c = roca && esRoca(x.name) ? conLuz(x.clone(), roca, 'roca') : conLuz(x.clone());
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
