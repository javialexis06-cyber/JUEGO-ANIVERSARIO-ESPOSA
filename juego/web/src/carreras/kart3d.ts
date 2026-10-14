// Un corredor en 3D: el carro de madera y fieltro (pintado con su color), la criatura que lo tira (galopa según la
// velocidad) y el muñeco al volante (Personaje + Vestidor, sentado, con caras según lo que pasa).
//
// Marco del carro: adelante es +z de three.js (Blender −y). El origen del grupo es el centro del carro en la física.
import * as THREE from 'three';
import { Personaje, type Cara } from '../personaje';
import { cargar, cargarAnimado, liberarEsqueletos } from '../recursos';
import { Vestidor } from '../salas/vestir';
import { CRIATURAS, type Corredor } from './datos';

/** Cuánto se corre todo hacia atrás para que el centro físico quede entre el carro y la criatura. */
const ATRAS = -1.25;
/** Altura del muñeco sentado. */
const ALTO_MUNECO = 1.25;

const buscar = (raiz: THREE.Object3D, rx: RegExp) => {
  let r: THREE.Object3D | null = null;
  raiz.traverse((o) => {
    if (!r && rx.test(o.name)) r = o;
  });
  return r as THREE.Object3D | null;
};

/** Caja del muñeco con la pose puesta (solo lo visible, con el esqueleto aplicado). */
function cajaVisible(raiz: THREE.Object3D) {
  const caja = new THREE.Box3();
  const v = new THREE.Vector3();
  const visita = (o: THREE.Object3D) => {
    if (!o.visible) return;
    const m = o as THREE.SkinnedMesh;
    if (m.isMesh && m.geometry.getAttribute('position')) {
      const pos = m.geometry.getAttribute('position');
      const paso = Math.max(1, Math.floor(pos.count / 400));
      for (let i = 0; i < pos.count; i += paso) {
        m.getVertexPosition(i, v);
        v.applyMatrix4(m.matrixWorld);
        caja.expandByPoint(v);
      }
    }
    for (const h of o.children) visita(h);
  };
  visita(raiz);
  return caja;
}

/** Copia de una pieza «m_<clave>» de carreras_cosas.glb (comparte geometría; los materiales se copian si se pintan). */
export async function pieza(clave: string): Promise<THREE.Object3D> {
  const g = await cargar('carreras/carreras_cosas.glb');
  const base = g.getObjectByName(clave);
  if (!base) throw new Error(`Falta la pieza ${clave}`);
  const c = base.clone(true);
  c.position.set(0, 0, 0);
  return c;
}

function pintar(raiz: THREE.Object3D, color: string) {
  const hechos = new Map<THREE.Material, THREE.Material>();
  const claro = new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.45);
  raiz.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const conv = (mat: THREE.Material) => {
      if (!/tinte/i.test(mat.name)) return mat;
      let n = hechos.get(mat);
      if (!n) {
        n = mat.clone();
        (n as THREE.MeshStandardMaterial).color.set(/claro|capota/i.test(mat.name) ? claro : new THREE.Color(color));
        hechos.set(mat, n);
      }
      return n;
    };
    m.material = Array.isArray(m.material) ? m.material.map(conv) : conv(m.material);
  });
  return [...hechos.values()];
}

export class Kart3D {
  grupo = new THREE.Group();
  /** Lo que se inclina, gira en el derrape y da vueltas al recibir un golpe. */
  cuerpo = new THREE.Group();
  carro: THREE.Object3D | null = null;
  criatura: THREE.Object3D | null = null;
  muneco: Personaje | null = null;
  private vestidor: Vestidor | null = null;
  private ruedas: { o: THREE.Object3D; r: number }[] = [];
  private patas: THREE.Object3D[] = [];
  private cabeza: THREE.Object3D | null = null;
  private cola: THREE.Object3D | null = null;
  private mezclador: THREE.AnimationMixer | null = null;
  private galope: THREE.AnimationAction | null = null;
  private quieto: THREE.AnimationAction | null = null;
  private fase = Math.random() * 10;
  private propios: THREE.Material[] = [];
  private asiento = new THREE.Vector3(0, 0.66, 0.2);
  escape = new THREE.Vector3(0, 0.5, -1.1);
  private caraHasta = 0;
  private reloj = 0;
  private alto = 1.6;
  /** Todos sus materiales (para el velo de Lara: transparentes). */
  private mats: THREE.Material[] = [];
  private transparente = false;

  constructor(public c: Corredor) {
    this.grupo.add(this.cuerpo);
  }

  async cargar(conMuneco = true) {
    const c = this.c;
    // Carro
    const carro = await pieza(`m_carro_${c.carro}`);
    this.propios.push(...pintar(carro, c.color));
    carro.position.z = ATRAS;
    this.cuerpo.add(carro);
    this.carro = carro;
    for (const n of ['di', 'dd', 'ti', 'td']) {
      const o = buscar(carro, new RegExp(`^rueda_${n}\\d*$`));
      if (o) this.ruedas.push({ o, r: n[0] === 'd' ? 0.33 : 0.44 });
    }
    carro.updateMatrixWorld(true);
    const a = buscar(carro, /^asiento\d*$/);
    if (a) this.asiento.copy(a.position).add(carro.position);
    const esc = buscar(carro, /^escape\d*$/);
    if (esc) this.escape.copy(esc.position).add(carro.position);
    const eng = buscar(carro, /^enganche\d*$/);
    const zEng = (eng ? eng.position.z : 1.95) + ATRAS;
    // Criatura
    const cr = CRIATURAS[c.criatura];
    let bicho: THREE.Object3D;
    if ('glb' in cr.modelo) {
      const { escena, clips } = await cargarAnimado(cr.modelo.glb);
      bicho = escena.clone(true);
      this.mezclador = new THREE.AnimationMixer(bicho);
      const cam = clips.find((x) => x.name === 'caminar');
      const rep = clips.find((x) => x.name === 'reposo');
      if (cam) {
        this.galope = this.mezclador.clipAction(cam);
        this.galope.play();
      }
      if (rep) {
        this.quieto = this.mezclador.clipAction(rep);
        this.quieto.play();
      }
    } else {
      bicho = await pieza(cr.modelo.pieza);
      for (const n of ['di', 'dd', 'ti', 'td']) {
        const o = buscar(bicho, new RegExp(`^pata_${n}\\d*$`));
        if (o) this.patas.push(o);
      }
      this.cabeza = buscar(bicho, /^cabeza\d*$/);
      this.cola = buscar(bicho, /^cola\d*$/);
    }
    const envoltura = new THREE.Group();
    envoltura.add(bicho);
    bicho.scale.setScalar(cr.escala);
    envoltura.updateMatrixWorld(true);
    const caja = new THREE.Box3().setFromObject(bicho);
    // La cola de la criatura justo delante del yugo
    bicho.position.z = zEng - caja.min.z - 0.15 * cr.escala;
    bicho.position.y = -caja.min.y;
    this.alto = caja.max.y - caja.min.y;
    this.cuerpo.add(envoltura);
    this.criatura = envoltura;
    bicho.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    carro.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    if (conMuneco) await this.cargarMuneco();
    this.grupo.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) for (const x of Array.isArray(m.material) ? m.material : [m.material]) this.mats.push(x);
    });
  }

  private async cargarMuneco() {
    const c = this.c;
    const p = new Personaje({ x: 0, y: 0 }, 1);
    await p.cargarPoses(c.aspecto.cuerpo);
    this.vestidor = new Vestidor(p, c.aspecto.cuerpo);
    if (c.aspecto.piel || c.aspecto.pelo || c.aspecto.detalles) await this.vestidor.aplicar(c.aspecto).catch(() => false);
    // Escala para que mida ALTO_MUNECO de pie
    p.grupo.updateMatrixWorld(true);
    const caja = new THREE.Box3().setFromObject(p.cuerpo);
    const alto = caja.max.y - caja.min.y;
    const e = alto > 0.1 ? ALTO_MUNECO / alto : 0.4;
    p.escala = e;
    p.cuerpo.scale.setScalar(e);
    p.pose(p.tienePose('sentado') ? 'sentado' : 'reposo', true);
    p.cara('concentrado');
    p.update(0.01);
    p.grupo.updateMatrixWorld(true);
    // Sentado: se mide la pose de verdad (con el esqueleto) y se apoya la cola en el cojín y la espalda en el espaldar
    const sentado = cajaVisible(p.grupo);
    const soporte = new THREE.Group();
    soporte.add(p.grupo);
    soporte.position.copy(this.asiento);
    soporte.position.y += -sentado.min.y - 0.02;
    soporte.position.z += -sentado.min.z - 0.3;
    this.cuerpo.add(soporte);
    p.grupo.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    this.muneco = p;
  }

  /** Una cara por un rato (luego vuelve a la de manejar). */
  cara(c: Cara, seg = 1.6) {
    if (!this.muneco) return;
    this.muneco.cara(c);
    this.caraHasta = this.reloj + seg;
  }

  pose(nombre: string) {
    if (this.muneco?.tienePose(nombre)) this.muneco.pose(nombre);
  }

  /** Pone el carro donde dice la física y anima todo. */
  actualizar(dt: number, x: number, y: number, z: number, h: number, v: number, extra: { derrape: number; giro: number; giroVis: number; suelo: boolean; invisible: boolean; truco: number; cayendo: boolean }) {
    this.reloj += dt;
    this.grupo.position.set(x, y, z);
    this.grupo.rotation.y = h;
    // Derrape: el cuerpo se tuerce hacia adentro; golpe: da vueltas; truco: una voltereta
    const yaw = extra.derrape * 0.42 + extra.giroVis * Math.PI * 2;
    this.cuerpo.rotation.y += (yaw - this.cuerpo.rotation.y) * Math.min(1, dt * (extra.giroVis ? 30 : 8));
    const inclina = -extra.giro * Math.min(1, Math.abs(v) / 20) * 0.08 - extra.derrape * 0.06;
    this.cuerpo.rotation.z += (inclina - this.cuerpo.rotation.z) * Math.min(1, dt * 6);
    this.cuerpo.rotation.x = extra.truco > 0 ? -(1 - extra.truco / 0.6) * Math.PI * 2 : extra.suelo ? Math.sin(this.reloj * 18) * Math.min(0.012, Math.abs(v) * 0.0006) : -0.06;
    // Ruedas
    for (const r of this.ruedas) r.o.rotation.x += (v * dt) / r.r;
    // Criatura: galope según la velocidad
    const cr = CRIATURAS[this.c.criatura];
    const rapidez = Math.min(1, Math.abs(v) / 8);
    if (this.mezclador) {
      if (this.galope) {
        this.galope.setEffectiveWeight(rapidez);
        this.galope.timeScale = 0.6 + Math.abs(v) * 0.11;
      }
      this.quieto?.setEffectiveWeight(1 - rapidez);
      this.mezclador.update(dt);
    } else {
      this.fase += Math.abs(v) * dt * cr.paso * 2.2 + dt * 0.5;
      const f = this.fase * Math.PI * 2;
      const amp = 0.7 * rapidez;
      this.patas.forEach((p, k) => (p.rotation.x = Math.sin(f + (k < 2 ? 0 : Math.PI) + (k % 2) * 0.6) * amp));
      if (this.cabeza) this.cabeza.rotation.x = Math.sin(f * 2) * 0.06 * rapidez;
      if (this.cola) this.cola.rotation.z = Math.sin(this.reloj * 7) * 0.25;
      if (this.criatura) this.criatura.position.y = Math.abs(Math.sin(f)) * 0.12 * rapidez * (this.c.criatura === 'cria' ? 2 : 1);
    }
    // Muñeco
    if (this.muneco) {
      if (this.caraHasta && this.reloj > this.caraHasta) {
        this.caraHasta = 0;
        this.muneco.cara('concentrado');
      }
      this.muneco.update(dt);
    }
    this.velo(extra.invisible);
    this.grupo.visible = true;
  }

  private velo(si: boolean) {
    if (si === this.transparente) return;
    this.transparente = si;
    // Se copian los materiales la primera vez (son compartidos entre los carros)
    this.grupo.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const conv = (mat: THREE.Material) => {
        const ud = mat.userData as { velo?: THREE.Material; normal?: THREE.Material };
        if (si) {
          if (ud.normal) return mat;
          const n = mat.clone();
          n.transparent = true;
          n.opacity = 0.28;
          n.depthWrite = false;
          n.userData = { normal: mat };
          this.propios.push(n);
          return n;
        }
        return ud.normal ?? mat;
      };
      m.material = Array.isArray(m.material) ? m.material.map(conv) : conv(m.material);
      m.castShadow = !si;
    });
  }

  get altoCriatura() {
    return this.alto;
  }

  liberar() {
    this.vestidor?.liberar();
    if (this.muneco) liberarEsqueletos(this.muneco.grupo);
    for (const m of this.propios) m.dispose();
    this.mezclador?.stopAllAction();
    this.grupo.removeFromParent();
  }
}
