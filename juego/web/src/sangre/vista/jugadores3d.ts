// Los jugadores: los muñecos del proyecto (el cuerpo de Él o de Ella) con el traje serio de su clase
// (ropa/sangre_<clase>_<cuerpo>.glb; mientras no exista, la ropa de fábrica teñida + capa y tocado de la clase),
// el arma principal en la mano y sus animaciones: caminar, tajo, estocada, golpe al piso, disparo, conjuro, caer,
// levantarse, destellar al recibir daño y volverse sombra cuando es invisible.
import * as THREE from 'three';
import { clone as clonarConEsqueleto } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Personaje } from '../../personaje';
import { cargarAnimado, liberarEsqueletos } from '../../recursos';
import { ARMAS } from '../datos/armas';
import { CLASES } from '../datos/clases';
import type { IdClase } from '../tipos';
import { caja, cil, cono, mat, toro, bola, tf } from './formas';
import { iluminarObjeto } from './luz';
import type { Biblioteca } from './modelos';
import { fijo } from './reemplazos_mapa';

/** Altura del muñeco en metros (los enemigos comunes miden ≈ 1,1 m). */
const ALTO = 1.05;

const TAPA: Record<'el' | 'ella', string[]> = {
  el: ['torso camiseta', 'cuello camiseta', 'ribete', 'pespunte camiseta', 'suciedad ropa', 'pantalon', 'pespunte pantalon', 'tenis', 'suela'],
  ella: ['torso camiseta', 'cuello camiseta', 'ribete manga', 'pespunte camiseta', 'chaleco', 'solapa', 'tapa bolsillo', 'pespunte chaleco', 'suciedad ropa', 'pantalon',
    'dobladillo short', 'pespunte shorts', 'tenis', 'suela', 'cordon', 'media', 'puño media'],
};
const PELO = ['cabello base', 'mechon'];
const TAPA_CABEZA = /casco|capucha|corona|sombrero|yelmo|mitra|velo|gorro|capirote/i;

type Estilo = 'mele' | 'distancia' | 'magia';
function estiloDe(tipo: string): Estilo {
  if (tipo === 'barrido' || tipo === 'estocada' || tipo === 'latigo' || tipo === 'onda') return 'mele';
  if (tipo === 'proyectil' || tipo === 'bumeran' || tipo === 'lanzado' || tipo === 'cono') return 'distancia';
  return 'magia';
}

export interface PerfilVista {
  i: number;
  cuerpo: 'el' | 'ella';
  clase: IdClase;
  piel?: string;
  pelo?: string;
}

class Muneco3D {
  p: Personaje;
  listo = false;
  private mats: THREE.MeshStandardMaterial[] = [];
  private brillo = 0;
  private transparente = false;
  private sostener = new THREE.Object3D();
  private arma: THREE.Mesh | null = null;
  armaId = '';
  private estilo: Estilo = 'mele';
  private ataqueT = 0;
  private ataqueDur = 0.3;
  private ataqueTipo = 0;
  private ataqueAng = 0;
  private habilidadT = 0;
  private fase = 0;
  private rot = 0;
  private extras: THREE.Object3D[] = [];
  private traje: THREE.Object3D[] = [];
  escala = 0.42;
  manoMundo = new THREE.Vector3();

  constructor(public perfil: PerfilVista, private bib: Biblioteca, padre: THREE.Object3D) {
    this.p = new Personaje({ x: 0, y: 0 }, 0.42);
    padre.add(this.p.grupo);
  }

  async cargar() {
    await this.p.cargarPoses(this.perfil.cuerpo);
    // Materiales propios (para destellar y volverse sombra sin tocar a los demás)
    iluminarObjeto(this.p.modelo!, true);
    this.p.modelo!.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      for (const x of Array.isArray(m.material) ? m.material : [m.material]) this.mats.push(x as THREE.MeshStandardMaterial);
    });
    // Escala para que mida ALTO
    this.p.grupo.updateMatrixWorld(true);
    const caja3 = new THREE.Box3().setFromObject(this.p.cuerpo);
    const alto = caja3.max.y - caja3.min.y;
    if (alto > 0.1) this.escala = (0.42 * ALTO) / alto;
    this.p.escala = this.escala;
    this.p.cuerpo.scale.setScalar(this.escala);
    this.teñir();
    await this.vestir();
    this.p.grupo.add(this.sostener);
    this.listo = true;
  }

  /** Piel y pelo de los amigos (Él y Ella usan los suyos). */
  private teñir() {
    const { piel, pelo } = this.perfil;
    for (const m of this.mats) {
      const n = m.name.toLowerCase();
      if (piel && /piel/.test(n)) m.color.set(piel);
      if (pelo && /cabello|pelo/.test(n)) m.color.set(pelo);
    }
  }

  /** El traje de la clase: el de verdad si existe, si no la ropa teñida con capa y tocado. */
  private async vestir() {
    for (const o of this.traje) o.removeFromParent();
    liberarEsqueletos(...this.traje);
    this.traje = [];
    for (const o of this.extras) o.removeFromParent();
    this.extras = [];
    const { clase, cuerpo } = this.perfil;
    let tapa = [...TAPA[cuerpo]];
    try {
      const { escena } = await cargarAnimado(`ropa/sangre_${clase}_${cuerpo}.glb`);
      const copia = clonarConEsqueleto(escena);
      const raiz = this.p.raizMallas;
      let tapaPelo = false;
      copia.traverse((o) => {
        const m = o as THREE.SkinnedMesh;
        if (!m.isSkinnedMesh) return;
        const huesos = m.skeleton.bones.map((b) => this.p.huesos.get(b.name));
        if (huesos.some((h) => !h)) return;
        m.bind(new THREE.Skeleton(huesos as THREE.Bone[], m.skeleton.boneInverses), m.bindMatrix);
        m.frustumCulled = false;
        m.castShadow = true;
        if (TAPA_CABEZA.test(m.name) || TAPA_CABEZA.test((m.material as THREE.Material)?.name ?? '')) tapaPelo = true;
        this.traje.push(m);
      });
      if (raiz) for (const m of this.traje) raiz.add(m);
      for (const m of this.traje) iluminarObjeto(m, true);
      for (const m of this.traje) m.traverse((o) => {
        const mm = o as THREE.Mesh;
        if (mm.isMesh) for (const x of Array.isArray(mm.material) ? mm.material : [mm.material]) this.mats.push(x as THREE.MeshStandardMaterial);
      });
      if (tapaPelo) tapa = [...tapa, ...PELO];
      if (!this.traje.length) throw new Error('sin mallas');
    } catch {
      // Reemplazo: ropa de fábrica teñida con los colores de la clase + capa y tocado
      tapa = [];
      this.trajeReemplazo();
    }
    this.p.tapar(tapa);
  }

  private trajeReemplazo() {
    const [c0, c1, c2] = CLASES[this.perfil.clase].colores;
    const oscuro = (c: string, k: number) => new THREE.Color(c).multiplyScalar(k);
    for (const m of this.mats) {
      const n = m.name.toLowerCase();
      if (/camiseta|chaleco|blusa|torso/.test(n)) m.color.copy(oscuro(c0, 1));
      else if (/pantal|short/.test(n)) m.color.copy(oscuro(c1, 0.8));
      else if (/tenis|zapato|suela|cordon/.test(n)) m.color.set('#2a2220');
      else if (/media/.test(n)) m.color.copy(oscuro(c1, 0.6));
    }
    const torso = this.hueso('torso');
    const cabeza = this.hueso('cabeza');
    const inv = 1 / this.escala;
    // Capa (de los hombros a las rodillas, por detrás)
    if (torso) {
      const capa = mallaFija([[caja(0.5, 0.62, 0.035, 0.015, { y: -0.18, z: -0.17, rx: -0.12 }), mat(oscuro(c0, 0.55).getStyle(), { rug: 0.92 })], [caja(0.52, 0.08, 0.1, 0.02, { y: 0.1, z: -0.12 }), mat(c2, { met: 0.4, rug: 0.5 })]]);
      this.colgar(torso, capa, inv);
    }
    if (cabeza) {
      const t = this.tocado(this.perfil.clase, c0, c1, c2);
      if (t) this.colgar(cabeza, t, inv);
    }
  }

  private colgar(hueso: THREE.Object3D, o: THREE.Object3D, inv: number) {
    // El hueso lleva la escala del muñeco: el adorno se arma en metros y se compensa
    const ancla = new THREE.Object3D();
    void inv;
    this.p.grupo.updateMatrixWorld(true);
    const s = new THREE.Vector3();
    hueso.getWorldScale(s);
    ancla.scale.setScalar(1 / Math.max(1e-4, s.x));
    ancla.add(o);
    hueso.add(ancla);
    iluminarObjeto(o, false);
    o.traverse((x) => {
      const m = x as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        for (const y of Array.isArray(m.material) ? m.material : [m.material]) this.mats.push(y as THREE.MeshStandardMaterial);
      }
    });
    this.extras.push(ancla);
  }

  /** Los tocados de reemplazo de cada clase (en metros, sobre el hueso de la cabeza). */
  private tocado(clase: IdClase, c0: string, c1: string, c2: string): THREE.Object3D | null {
    const y = 0.5;
    const m0 = mat(c0), m1 = mat(c1), m2 = mat(c2, { met: 0.5, rug: 0.45 });
    const oro = mat('#c8a040', { met: 0.75, rug: 0.35 });
    switch (clase) {
      case 'monarca':
        return mallaFija([[toro(0.17, 0.025, { y: y + 0.02, rx: Math.PI / 2 }), oro], ...[0, 1, 2, 3, 4].map((k): [THREE.BufferGeometry, THREE.Material] => [cono(0.03, k === 2 ? 0.05 : 0.1, { x: Math.cos(k * 1.256) * 0.17, y: y + 0.08, z: Math.sin(k * 1.256) * 0.17, rz: k === 2 ? 0.6 : 0 }, 4), oro])]);
      case 'campesino':
        return mallaFija([[cono(0.36, 0.16, { y: y + 0.06 }, 14), mat('#b8984a')], [toro(0.2, 0.02, { y: y + 0.01, rx: Math.PI / 2 }), mat('#6a4a2a')]]);
      case 'caballero':
        return mallaFija([[caja(0.42, 0.36, 0.42, 0.14, { y: y - 0.12 }), m2], [caja(0.3, 0.03, 0.02, 0.005, { y: y - 0.12, z: 0.22 }), mat('#111')], [cono(0.03, 0.18, { y: y + 0.14 }, 5), m1]]);
      case 'cazador':
        return mallaFija([[cil(0.13, 0.15, 0.2, { y: y + 0.08 }), mat('#2a2420')], [cil(0.3, 0.3, 0.02, { y: y }), mat('#2a2420')], [toro(0.14, 0.015, { y: y + 0.02, rx: Math.PI / 2 }), m1]]);
      case 'herrero':
        return mallaFija([[caja(0.38, 0.1, 0.4, 0.04, { y: y - 0.02 }), mat('#3a2a1e')], [bola(0.06, { x: 0.12, y: y, z: 0.18 }), mat('#9ad8ff', { met: 0.5, rug: 0.2 })], [bola(0.06, { x: -0.12, y: y, z: 0.18 }), mat('#9ad8ff', { met: 0.5, rug: 0.2 })]]);
      case 'alquimista':
      case 'sepulturero':
        if (clase === 'sepulturero') return mallaFija([[cil(0.13, 0.14, 0.3, { y: y + 0.13 }), mat('#1a1a1e')], [cil(0.24, 0.24, 0.02, { y: y }), mat('#1a1a1e')], [toro(0.135, 0.012, { y: y + 0.03, rx: Math.PI / 2 }), mat('#5a1a1a')]]);
        return mallaFija([[caja(0.46, 0.42, 0.46, 0.18, { y: y - 0.1, z: -0.02 }), m0]]);
      case 'inquisidor':
        return mallaFija([[cono(0.16, 0.4, { y: y + 0.18 }, 4), m0], [caja(0.36, 0.08, 0.36, 0.03, { y: y }), m1], [caja(0.03, 0.14, 0.02, 0.005, { y: y + 0.18, z: 0.12 }), oro], [caja(0.1, 0.03, 0.02, 0.005, { y: y + 0.21, z: 0.12 }), oro]]);
      case 'verdugo':
        return mallaFija([[caja(0.46, 0.5, 0.46, 0.2, { y: y - 0.12 }), mat('#121012')], [cono(0.16, 0.25, { y: y + 0.2 }, 4), mat('#121012')], [bola(0.03, { x: -0.07, y: y - 0.1, z: 0.23 }), mat('#111', { e: '#ff3020', ei: 2, relieve: 0 })], [bola(0.03, { x: 0.07, y: y - 0.1, z: 0.23 }), mat('#111', { e: '#ff3020', ei: 2, relieve: 0 })]]);
      case 'bruja':
        return mallaFija([[cono(0.16, 0.5, { y: y + 0.25, rz: 0.25, x: -0.04 }, 10), mat('#1e1626')], [cil(0.34, 0.34, 0.02, { y: y }, 16), mat('#1e1626')], [toro(0.16, 0.015, { y: y + 0.03, rx: Math.PI / 2 }), m1]]);
      case 'juglar':
        return mallaFija([[caja(0.38, 0.1, 0.38, 0.04, { y: y }), m0], [cono(0.08, 0.36, { x: -0.18, y: y + 0.12, rz: 1.2 }, 6), m0], [cono(0.08, 0.36, { x: 0.18, y: y + 0.12, rz: -1.2 }, 6), m1], [bola(0.04, { x: -0.36, y: y + 0.05 }), oro], [bola(0.04, { x: 0.36, y: y + 0.05 }), oro]]);
      case 'prisionero':
        return null;
    }
    return null;
  }

  hueso(n: string) {
    return this.p.huesos.get(n) ?? this.p.huesos.get(n.replace(/\./g, '')) ?? null;
  }

  /** Pone el arma principal en la mano. */
  ponerArma(id: string) {
    if (id === this.armaId) return;
    this.armaId = id;
    if (this.arma) this.sostener.remove(this.arma);
    const def = ARMAS[id];
    if (!def) return;
    const m = this.bib.fijo('arma', def.modelo);
    this.arma = new THREE.Mesh(m.geo, m.mats);
    this.arma.castShadow = true;
    this.sostener.add(this.arma);
    this.estilo = estiloDe(def.tipo);
  }

  /** Empieza la animación de un ataque (0 tajo, 1 estocada, 2 golpe al piso, 3 disparo, 4 conjuro). */
  atacar(tipo: number, ang: number, dur = 0.3) {
    this.ataqueTipo = tipo;
    this.ataqueAng = ang;
    this.ataqueT = dur;
    this.ataqueDur = dur;
  }

  habilidad() {
    this.habilidadT = 0.7;
  }

  herido() {
    this.brillo = 1;
  }

  actualizar(dt: number, x: number, y: number, vx: number, vy: number, fx: number, fy: number, estado: number, invisible: boolean, levantando: boolean, t: number) {
    if (!this.listo) return;
    const p = this.p;
    p.grupo.visible = estado === 0 || estado === 1;
    if (!p.grupo.visible) return;
    p.pos = { x, y: -y };
    const vel = Math.hypot(vx, vy);
    // Hacia dónde mira: al atacar, hacia el golpe; si no, hacia donde camina
    let objetivo = Math.atan2(fx, fy);
    if (this.ataqueT > 0) objetivo = Math.atan2(Math.cos(this.ataqueAng), Math.sin(this.ataqueAng));
    let d = objetivo - this.rot;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    this.rot += d * Math.min(1, dt * (this.ataqueT > 0 ? 22 : 14));
    p.rot = this.rot;
    // Pose
    if (estado === 1) {
      p.suavidad = 8;
      p.pose(p.tienePose('tirado') ? 'tirado' : 'desmayo');
      p.cara('llorando');
    } else if (levantando) {
      p.suavidad = 10;
      p.pose(p.tienePose('rodillas_a') ? 'rodillas_a' : 'reposo');
      p.cara('concentrado');
    } else if (this.habilidadT > 0) {
      this.habilidadT -= dt;
      p.suavidad = 18;
      p.pose(p.tienePose('musculo') ? 'musculo' : 'celebrar');
      p.cara('enojado');
    } else if (vel > 0.3) {
      this.fase += dt * (1.6 + vel * 0.55);
      p.suavidad = 20;
      p.vaiven('caminar_a', 'caminar_b', 0.5 - 0.5 * Math.cos(this.fase * Math.PI));
      p.cara(this.ataqueT > 0 ? 'enojado' : 'concentrado');
    } else {
      p.suavidad = 9;
      p.pose('reposo');
      p.cara(this.ataqueT > 0 ? 'enojado' : 'normal');
    }
    p.update(dt);
    // Rebote al caminar
    if (vel > 0.3 && estado === 0) p.cuerpo.position.y = Math.abs(Math.sin(this.fase * Math.PI)) * 0.04;
    else p.cuerpo.position.y *= 0.8;
    if (estado === 1) p.cuerpo.position.y = 0;
    p.sincronizar();
    // Brillo al recibir daño, sombra si es invisible
    if (this.brillo > 0) this.brillo = Math.max(0, this.brillo - dt * 5);
    for (const m of this.mats) {
      m.emissive.setRGB(this.brillo * 0.9, this.brillo * 0.1, this.brillo * 0.08);
      if (invisible !== this.transparente) {
        m.transparent = invisible;
        m.opacity = invisible ? 0.3 : 1;
        m.depthWrite = !invisible;
        m.needsUpdate = true;
      }
    }
    this.transparente = invisible;
    this.moverArma(dt, t, estado);
  }

  /** El arma sigue a la mano con la orientación del estilo y del ataque en curso. */
  private moverArma(dt: number, t: number, estado: number) {
    const mano = this.hueso('mano.L') ?? this.hueso('manoL');
    if (!this.arma || !mano) return;
    this.sostener.visible = estado === 0;
    if (estado !== 0) return;
    mano.getWorldPosition(this.manoMundo);
    const g = this.p.grupo;
    const local = g.worldToLocal(this.manoMundo.clone());
    this.sostener.position.copy(local);
    // Orientación en el espacio del muñeco (mira hacia +Z): el arma apunta con su +Y
    const e = new THREE.Euler();
    let avance = 0;
    if (this.ataqueT > 0) {
      this.ataqueT -= dt;
      const u = 1 - Math.max(0, this.ataqueT) / this.ataqueDur;
      switch (this.ataqueTipo) {
        case 0: {
          // Tajo horizontal: de atrás a la derecha hacia adelante a la izquierda
          const s = u < 0.25 ? -1.4 * (u / 0.25) : -1.4 + 3.4 * Math.min(1, (u - 0.25) / 0.35);
          e.set(Math.PI / 2 - 0.2, 0, -s);
          break;
        }
        case 1:
          e.set(Math.PI / 2, 0, 0);
          avance = Math.sin(Math.min(1, u * 1.6) * Math.PI) * 0.22;
          break;
        case 2: {
          const s = u < 0.3 ? -0.6 * (u / 0.3) : -0.6 + 2.3 * Math.min(1, (u - 0.3) / 0.25);
          e.set(s, 0, 0);
          break;
        }
        case 3:
          e.set(Math.PI / 2 - Math.sin(u * Math.PI) * 0.35, 0, 0);
          avance = -Math.sin(u * Math.PI) * 0.06;
          break;
        default:
          e.set(-0.1 - Math.sin(u * Math.PI) * 0.5, 0, 0);
          break;
      }
    } else if (this.estilo === 'distancia') e.set(Math.PI / 2 - 0.15 + Math.sin(t * 2) * 0.03, 0, 0);
    else if (this.estilo === 'magia') e.set(0.15 + Math.sin(t * 1.7) * 0.05, 0, -0.1);
    else e.set(0.55 + Math.sin(t * 1.5) * 0.04, 0, -0.25);
    this.sostener.quaternion.setFromEuler(e);
    this.sostener.position.z += avance;
    this.sostener.scale.setScalar(1);
  }

  liberar() {
    this.p.grupo.removeFromParent();
    liberarEsqueletos(this.p.grupo);
  }
}

function mallaFija(partes: [THREE.BufferGeometry, THREE.Material][]): THREE.Mesh {
  const m = fijo(partes);
  return new THREE.Mesh(m.geo, m.mats);
}

export class Jugadores3D {
  grupo = new THREE.Group();
  munecos = new Map<number, Muneco3D>();

  constructor(private bib: Biblioteca) {}

  async preparar(perfiles: PerfilVista[]) {
    await Promise.all(perfiles.map(async (pf) => {
      const m = new Muneco3D(pf, this.bib, this.grupo);
      this.munecos.set(pf.i, m);
      await m.cargar().catch((e) => console.error(e));
    }));
  }

  de(i: number) {
    return this.munecos.get(i) ?? null;
  }

  liberar() {
    for (const m of this.munecos.values()) m.liberar();
    this.munecos.clear();
  }
}

export { tf };
