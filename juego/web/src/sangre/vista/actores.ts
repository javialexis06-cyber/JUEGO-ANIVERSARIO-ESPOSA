// Lo que se mueve en el campo de batalla (menos los jugadores): la horda, los jefes, los cadáveres que se desintegran,
// los aliados, los prisioneros y las cosas del objetivo (carreta, campana, cofres, santuarios). Más una sombra redonda
// debajo de cada uno (barata y se lee muy bien desde arriba).
import * as THREE from 'three';
import { COLOR_MOD } from '../datos/mundo';
import { TIPOS, esJefe } from '../sim/catalogo';
import { ALI, ENT, type Aliado, type Entidad, type Enemigos } from '../sim/estado';
import { BAJADA_ATAUD, BAJADA_CAMPANA } from '../sim/objetivos';
import type { Biblioteca } from './modelos';
import { LotePiezas } from './piezas';
import type { ModeloFijo } from './reemplazos_mapa';

interface Cadaver {
  modelo: string;
  x: number;
  z: number;
  rot: number;
  esc: number;
  t: number;
  tinte: number;
}

const DUR_MUERTE = 0.7;
const COLORES_MOD = Object.fromEntries(Object.entries(COLOR_MOD).map(([k, v]) => [k, new THREE.Color(v)]));
const C_MARCA = new THREE.Color('#ff2020');
const C_ORO = new THREE.Color('#ffc040');
const C_ALIADO = new THREE.Color('#5ab0ff');
const C_ESPIRITU = new THREE.Color('#ffd070');
const C_ANIMA = new THREE.Color('#7af0ff');
const C_CUERVO = new THREE.Color('#a070ff');
const C_HIELO = new THREE.Color('#60c8ff');
const C_MALDITO = new THREE.Color('#b040ff');
const C_JUZGADO = new THREE.Color('#ffe080');
const NEGRO = new THREE.Color(0, 0, 0);

const MODELO_ALIADO: Record<number, string> = {
  [ALI.CABALLERO]: 'aliado_caballero', [ALI.BALLESTERO]: 'aliado_ballestero', [ALI.ESQUELETO]: 'esqueleto', [ALI.ESPIRITU]: 'espectro', [ALI.ANIMA]: 'espectro',
  [ALI.TORRETA]: 'torreta', [ALI.TRAMPA]: 'trampa', [ALI.CUERVO]: 'cuervo', [ALI.TOTEM]: 'totem', [ALI.ESPIGA]: 'espiga',
};

export interface VistaEnemigos {
  E: Enemigos;
  A: Aliado[];
  ent: Entidad[];
  jefeFase: number;
  t: number;
  rieles: { x: number; y: number }[];
}

export class Actores {
  grupo = new THREE.Group();
  private lotes = new Map<string, LotePiezas>();
  private cadaveres: Cadaver[] = [];
  private sombras: THREE.InstancedMesh;
  private nSombras = 0;
  private cosas = new Map<number, THREE.Object3D>();
  /** Última posición y giro de las entidades que caminan (prisioneros). */
  private antes = new Map<number, { x: number; y: number; rot: number }>();
  private M = new THREE.Matrix4();
  private Q = new THREE.Quaternion();
  private V = new THREE.Vector3();
  private S = new THREE.Vector3();
  private Y = new THREE.Vector3(0, 1, 0);
  /** Sombras de verdad (calidad alta): los enemigos también proyectan. */
  sombraReal = false;

  constructor(private bib: Biblioteca) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(0,0,0,0.75)');
    gr.addColorStop(0.55, 'rgba(0,0,0,0.45)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    this.sombras = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, color: '#000000' }), 1200);
    this.sombras.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.sombras.frustumCulled = false;
    this.sombras.renderOrder = 1;
    this.grupo.add(this.sombras);
  }

  lote(id: string): LotePiezas {
    let l = this.lotes.get(id);
    if (!l) {
      l = new LotePiezas(this.bib.enemigo(id), this.grupo, id.startsWith('jefe') || ['golem_osarios', 'abadesa', 'gusano_sangre', 'obispo_hueco', 'conde', 'conde_alas'].includes(id) ? 2 : 48, this.sombraReal);
      this.lotes.set(id, l);
    }
    return l;
  }

  /** Precarga los modelos que va a necesitar el bioma (para que no se trabe la primera vez que aparecen). */
  precargar(ids: string[]) {
    for (const id of ids) this.lote(id);
  }

  sombra(x: number, z: number, r: number, alfa = 1) {
    if (this.nSombras >= 1200) return;
    this.Q.identity();
    this.V.set(x, 0.015, z);
    this.S.set(r * 2.4 * alfa, 1, r * 2.4 * alfa);
    this.M.compose(this.V, this.Q, this.S);
    this.sombras.setMatrixAt(this.nSombras++, this.M);
  }

  /** Un enemigo murió: queda su cadáver desintegrándose un momento. */
  muerte(x: number, z: number, tipo: number, esc: number, rot: number, fase: number) {
    let modelo: string;
    let tinte = 0;
    if (tipo >= 200) {
      modelo = MODELO_ALIADO[tipo - 200] ?? 'esqueleto';
      tinte = 1;
    } else modelo = TIPOS[tipo]?.id ?? 'zombi';
    if (modelo === 'conde' && fase >= 2) modelo = 'conde_alas';
    this.cadaveres.push({ modelo, x, z, rot, esc: esc || 1, t: 0, tinte });
    if (this.cadaveres.length > 160) this.cadaveres.shift();
  }

  actualizar(dt: number, v: VistaEnemigos) {
    for (const l of this.lotes.values()) l.empezar();
    this.nSombras = 0;
    const E = v.E;
    const C = new THREE.Color();
    for (let i = 0; i < E.max; i++) {
      if (!E.vivo[i]) continue;
      const t = E.tipo[i];
      const def = TIPOS[t];
      let id = def.id;
      if (id === 'conde' && v.jefeFase >= 2) id = 'conde_alas';
      // Brillo: élite, marcado, juzgado, congelado, maldito
      let ta = 0;
      C.copy(NEGRO);
      if (E.marcadoObj[i] === 1) {
        C.copy(C_MARCA);
        ta = 1.2;
      } else if (E.elite[i]) {
        const bit = E.elite[i] & -E.elite[i];
        C.copy(COLORES_MOD[bit] ?? C_MARCA);
        ta = 0.8;
      } else if (E.juzgado[i] > 0) {
        C.copy(C_JUZGADO);
        ta = 0.7;
      } else if (E.condenaT[i] > 0) {
        C.copy(C_MALDITO);
        ta = 1.4;
      } else if (E.lento[i] > 0.45) {
        C.copy(C_HIELO);
        ta = 0.4;
      } else if (E.maldicion[i] >= 6) {
        C.copy(C_MALDITO);
        ta = E.maldicion[i] * 0.05;
      }
      const alt = E.alt[i] < 0 ? E.alt[i] * def.alto * 1.15 * E.esc[i] : E.alt[i];
      const transp = def.conducta === 'fantasma' ? 0.3 : 0;
      this.lote(id).poner(E.x[i], E.y[i], E.rot[i], E.esc[i] * (esJefe(t) ? 1 : 1), E.fase[i], E.ataque[i], E.golpe[i], 0, alt, C.r, C.g, C.b, ta, E.aturdido[i] > 0 ? 1 : 0, transp);
      if (E.alt[i] > -0.6) this.sombra(E.x[i], E.y[i], E.r[i] * (def.vuela ? 0.7 : 1), def.vuela ? 0.7 : 1);
    }
    // Cadáveres que se desintegran
    for (let k = this.cadaveres.length - 1; k >= 0; k--) {
      const c = this.cadaveres[k];
      c.t += dt;
      const u = c.t / DUR_MUERTE;
      if (u >= 1) {
        this.cadaveres.splice(k, 1);
        continue;
      }
      this.lote(c.modelo).poner(c.x, c.z, c.rot, c.esc, 0, 0, Math.max(0, 1 - u * 4), u, 0, c.tinte ? C_ALIADO.r : 0, c.tinte ? C_ALIADO.g : 0, c.tinte ? C_ALIADO.b : 0, c.tinte ? 0.5 : 0);
    }
    // Aliados
    for (const a of v.A) {
      if (!a.vivo) continue;
      let id = MODELO_ALIADO[a.tipo];
      let col = C_ALIADO, ta = 0.5, esc = 1, transp = 0, alt = 0;
      if (a.tipo === ALI.ENCANTADO) {
        id = TIPOS[a.imita]?.id ?? 'zombi';
        col = C_ORO;
        ta = 1;
      } else if (a.tipo === ALI.ESPIRITU) {
        col = C_ESPIRITU;
        transp = 0.25;
      } else if (a.tipo === ALI.ANIMA) {
        col = C_ANIMA;
        transp = 0.3;
        alt = 0.2;
      } else if (a.tipo === ALI.CUERVO) {
        col = C_CUERVO;
        alt = 1.1;
        esc = 0.8;
      } else if (a.tipo === ALI.ESPIGA) {
        esc = 0.3 + a.a * 0.7;
        col = C_ORO;
        ta = a.a >= 1 ? 0.6 + 0.4 * Math.sin(v.t * 5) : 0;
      } else if (a.tipo === ALI.TORRETA || a.tipo === ALI.TRAMPA || a.tipo === ALI.TOTEM) {
        ta = a.tipo === ALI.TOTEM ? 0.4 : 0;
      }
      if (!id) continue;
      this.lote(id).poner(a.x, a.y, a.rot, esc, a.fase, a.ataque, a.golpe, 0, alt, col.r, col.g, col.b, ta, 0, transp);
      if (a.tipo !== ALI.TRAMPA) this.sombra(a.x, a.y, a.r, alt > 0.5 ? 0.6 : 1);
    }
    // Entidades del objetivo
    const vistas = new Set<number>();
    for (const e of v.ent) {
      if (!e.vivo || e.tipo < 0) continue;
      if (e.tipo === ENT.PRISIONERO) {
        const encadenado = e.est === 0;
        const a = this.antes.get(e.id) ?? { x: e.x, y: e.y, rot: 0 };
        if (Math.hypot(e.x - a.x, e.y - a.y) > 0.01) a.rot = Math.atan2(e.x - a.x, e.y - a.y);
        a.x = e.x;
        a.y = e.y;
        this.antes.set(e.id, a);
        // (mientras lo liberan forcejea con las cadenas, más fuerte a medida que se sueltan)
        const forcejeo = encadenado && e.prog > 0.01 ? Math.sin(v.t * 21) * 0.18 * (0.4 + e.prog) : 0;
        this.lote('prisionero').poner(e.x, e.y, a.rot + forcejeo, encadenado ? 0.9 : 1, encadenado ? 0 : e.t * 3, 0, 0, 0, 0, encadenado ? 0 : C_ALIADO.r, encadenado ? 0 : C_ALIADO.g, encadenado ? 0 : C_ALIADO.b, encadenado ? 0 : 0.35);
        this.sombra(e.x, e.y, 0.35);
        continue;
      }
      if (e.tipo === ENT.EXTRACCION) {
        // La Campana de Extracción baja del cielo por su haz de luz y se queda colgando sobre el círculo
        vistas.add(e.id);
        let o = this.cosas.get(e.id);
        if (!o) {
          o = mallaFija(this.bib.fijo('cosa', 'campana_extraccion'));
          o.castShadow = false;
          this.grupo.add(o);
          this.cosas.set(e.id, o);
        }
        const bajada = e.est === 0 ? Math.min(1, e.t / BAJADA_CAMPANA) : 1;
        const suave = 1 - (1 - bajada) ** 3;
        o.position.set(e.x, 1.6 + (1 - suave) * 20 + (e.est === 1 ? Math.sin(v.t * 1.3) * 0.08 : 0), e.y);
        o.rotation.z = e.est === 1 ? Math.sin(v.t * 1.1) * 0.05 : 0;
        o.rotation.x = e.est === 1 ? Math.sin(v.t * 0.9 + 1) * 0.04 : 0;
        this.sombra(e.x, e.y, 0.4 + suave * 0.9, 0.5 + suave * 0.5);
        continue;
      }
      const clave = e.tipo === ENT.CARRETA ? 'carreta' : e.tipo === ENT.CAMPANA_DEF ? 'campana' : e.tipo === ENT.COFRE_RELIQUIA ? 'cofre_reliquia' : e.tipo === ENT.SANTUARIO ? 'santuario' : e.tipo === ENT.COFRE_MALDITO ? 'cofre_maldito' : e.tipo === ENT.SEPULCRO ? (e.est >= 1 ? 'sepulcro_abierto' : 'sepulcro')
        : e.tipo === ENT.SUMINISTRO && e.est >= 1 ? (e.est >= 3 ? 'ataud_abierto' : 'ataud_suministros')
        : e.tipo === ENT.VAGONETA ? 'carreta' : e.tipo === ENT.ARMADURA ? 'guardia_real' : e.tipo === ENT.CAMPANARIO ? 'campana' : e.tipo === ENT.PINCHOS ? 'pinchos' : '';
      if (!clave) continue;
      vistas.add(e.id);
      let o = this.cosas.get(e.id);
      // (el sepulcro cambia de modelo al abrirse)
      if (o && o.userData.clave !== clave) {
        this.grupo.remove(o);
        this.cosas.delete(e.id);
        o = undefined;
      }
      if (!o) {
        if (clave === 'pinchos') {
          // (la reja y las púas aparte: las púas suben y bajan)
          o = new THREE.Group();
          const placa = mallaFija(this.bib.fijo('cosa', 'pinchos_placa'));
          const puas = mallaFija(this.bib.fijo('cosa', 'pinchos_puas'));
          puas.name = 'puas';
          o.add(placa, puas);
        } else o = mallaFija(this.bib.fijo('cosa', clave));
        o.userData.clave = clave;
        if (e.tipo === ENT.CAMPANA_DEF || e.tipo === ENT.CAMPANARIO) o.scale.setScalar(e.tipo === ENT.CAMPANARIO ? 0.75 : 0.55);
        this.grupo.add(o);
        this.cosas.set(e.id, o);
      }
      o.position.set(e.x, 0, e.y);
      // El ataúd de suministros baja del cielo colgado de sus cadenas (y se mece un poquito al bajar)
      if (e.tipo === ENT.SUMINISTRO && e.est === 1) {
        const b = Math.min(1, e.t / BAJADA_ATAUD);
        const suave = 1 - (1 - b) ** 3;
        o.position.y = (1 - suave) * 16;
        o.rotation.z = Math.sin(v.t * 2.3) * 0.06 * (1 - b);
        this.sombra(e.x, e.y, 0.3 + suave * 0.5, 0.4 + suave * 0.5);
        continue;
      }
      if (e.tipo === ENT.SUMINISTRO) o.rotation.z = e.est === 2 && e.prog > 0.01 ? Math.sin(v.t * 30) * 0.03 * e.prog : 0;
      // La vagoneta suelta: mira hacia donde rueda y traquetea antes de arrancar
      if (e.tipo === ENT.VAGONETA) {
        const d = [[1, 0], [-1, 0], [0, 1], [0, -1]][e.k] ?? [1, 0];
        o.rotation.y = Math.atan2(d[0], d[1]) + Math.PI;
        o.position.y = Math.abs(Math.sin(v.t * (e.est === 0 ? 30 : 14))) * (e.est === 0 ? 0.03 : 0.05);
      }
      // Las púas: escondidas, asomándose (el aviso) o arriba
      if (e.tipo === ENT.PINCHOS) {
        const puas = o.getObjectByName('puas');
        if (puas) puas.position.y += ((e.est === 2 ? 0 : e.est === 1 ? -0.3 + Math.sin(v.t * 40) * 0.02 : -0.46) - puas.position.y) * Math.min(1, dt * (e.est === 2 ? 30 : 8));
      }
      if (e.tipo === ENT.ARMADURA) o.rotation.y = (e.k * Math.PI) / 2;
      // El campanario: se mece mientras llama la oleada
      if (e.tipo === ENT.CAMPANARIO) o.rotation.z = e.est === 1 ? Math.sin(v.t * 3) * 0.12 : e.prog > 0.01 ? Math.sin(v.t * 20) * 0.02 * e.prog : 0;
      if (e.tipo === ENT.CARRETA) {
        const r0 = v.rieles[Math.max(0, e.k - 1)], r1 = v.rieles[Math.min(v.rieles.length - 1, e.k)];
        if (r0 && r1 && (r0.x !== r1.x || r0.y !== r1.y)) o.rotation.y = Math.atan2(r1.x - r0.x, r1.y - r0.y) + Math.PI;
        o.position.y = Math.abs(Math.sin(v.t * 9)) * 0.02 * (e.cuenta ? 1 : 0);
      }
      if (e.tipo === ENT.COFRE_RELIQUIA || e.tipo === ENT.SANTUARIO) o.visible = true;
      // Mientras lo abren: el cofre tiembla y salta cada vez más; el santuario late
      if (e.est === 0 && e.prog > 0.01 && (e.tipo === ENT.COFRE_RELIQUIA || e.tipo === ENT.COFRE_MALDITO)) {
        o.rotation.z = Math.sin(v.t * 38) * 0.05 * e.prog;
        o.position.y = Math.abs(Math.sin(v.t * 19)) * 0.05 * e.prog;
      } else if (e.tipo === ENT.COFRE_RELIQUIA || e.tipo === ENT.COFRE_MALDITO) o.rotation.z = 0;
      if (e.est === 0 && e.tipo === ENT.SANTUARIO) o.scale.setScalar(1 + (e.prog > 0.01 ? Math.sin(v.t * 9) * 0.03 * e.prog : 0));
      if (e.est === 2 && (e.tipo === ENT.COFRE_RELIQUIA || e.tipo === ENT.SANTUARIO)) o.scale.setScalar(Math.max(0.001, o.scale.x - dt * 2));
      if (e.tipo !== ENT.PINCHOS) this.sombra(e.x, e.y, e.tipo === ENT.CARRETA || e.tipo === ENT.VAGONETA ? 1 : 0.6);
    }
    for (const [id, o] of this.cosas) {
      if (vistas.has(id)) continue;
      this.grupo.remove(o);
      this.cosas.delete(id);
    }
    for (const l of this.lotes.values()) l.terminar();
    this.sombras.count = this.nSombras;
    this.sombras.instanceMatrix.needsUpdate = true;
  }

  /** Una sombra para un jugador u otra cosa que se dibuja aparte (llamar antes de actualizar no sirve: va después). */
  sombraExtra(x: number, z: number, r: number) {
    this.sombra(x, z, r);
    this.sombras.count = this.nSombras;
  }

  liberar() {
    for (const l of this.lotes.values()) l.liberar();
    this.lotes.clear();
  }
}

/** Una malla con un modelo fijo (no instanciada). */
export function mallaFija(m: ModeloFijo): THREE.Mesh {
  const malla = new THREE.Mesh(m.geo, m.mats);
  malla.castShadow = true;
  malla.receiveShadow = true;
  return malla;
}
