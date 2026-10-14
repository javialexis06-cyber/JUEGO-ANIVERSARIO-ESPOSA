// Un luchador en 3D: el muñeco de peluche (el cuerpo de Javier o el de Laura) vestido con su ropa de torneo, de lado
// pero girado hacia la cámara (2,5D), con las poses de pelea de `poses.ts` encima del esqueleto, la cara de cada
// momento (concentrado, enojado al pegar, sorprendido al recibir, mareado, feliz al ganar) y sus sacudidas.
import * as THREE from 'three';
import { Personaje, type Cara } from '../../personaje';
import { elegirModelos } from '../../recursos';
import { Vestidor } from '../../salas/vestir';
import { teñirModelo } from '../../salas/tinte';
import type { AspectoJugador } from '../../salas/tipos';
import { HUESOS, poseQ, type Hueso } from '../poses';
import type { Peleador } from '../sim';
import type { DefLuchador } from '../tipos';

const ALTO_BASE = 0.69;
/** Cuánto se gira hacia la cámara (0 = de perfil). */
const GIRO_CAMARA = 0.3;

/** Lo que la vista necesita de un peleador (lo cumplen la simulación y el espejo de los invitados en línea). */
export type PeleadorVista = Pick<Peleador, 'i' | 'x' | 'y' | 'vx' | 'vy' | 'lado' | 'estado' | 't' | 'dur' | 'golpe' | 'vida' | 'barra' | 'combo' | 'ultimoGolpe' | 'ko' | 'entrada' | 'suelo' | 'rondas' | 'comboDano'> & { def: DefLuchador };

/** Colores de reemplazo para el mismo luchador en los dos lados (gira el tono de su ropa). */
function otroTono(a: AspectoJugador): AspectoJugador {
  const d = { ...(a.detalles ?? {}) };
  const girar = (hex: string) => {
    const c = new THREE.Color(hex);
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    c.setHSL((hsl.h + 0.45) % 1, Math.min(1, hsl.s * 1.1 + 0.05), hsl.l);
    return `#${c.getHexString()}`;
  };
  for (const k of ['arriba', 'abajo', 'espalda', 'cabeza', 'pies', 'cola', 'ropa', 'ropa2']) {
    if (d[k]) d[k] = d[k].replace(/#[0-9a-f]{6}/gi, (m) => girar(m));
  }
  return { ...a, detalles: d };
}

export class Muneco {
  /** Donde está en el escenario (x, y del piso). */
  raiz = new THREE.Group();
  /** Hacia dónde mira, inclinaciones y el cuerpo tumbado. */
  private giro = new THREE.Group();
  private alzar = new THREE.Group();
  p: Personaje;
  private huesos = new Map<Hueso, THREE.Object3D>();
  private actual = new Map<Hueso, THREE.Quaternion>();
  private aplicado = new Map<Hueso, THREE.Quaternion>();
  private y = 0;
  private rotY = 0;
  private tumbado = 0;
  private vuelta = 0;
  private sacudida = 0;
  private ultimoVisto = -99;
  private tiempo = Math.random() * 10;
  private clip = '';
  private propios: THREE.Material[] = [];
  private vestidor: Vestidor | null = null;
  escala = 1;
  listo = false;
  /** El muñeco del lado derecho cuando los dos escogieron al mismo: otro tono. */
  alterno = false;

  constructor(public def: DefLuchador, private aspectoJugador?: AspectoJugador) {
    const cuerpo = def.aspecto === 'jugador' ? (aspectoJugador?.cuerpo ?? 'el') : def.cuerpo;
    this.escala = ALTO_BASE * (def.escala ?? 1) * (cuerpo === 'ella' ? 1.015 : 1);
    this.p = new Personaje({ x: 0, y: 0 }, this.escala);
    this.raiz.add(this.giro);
    this.giro.add(this.alzar);
    this.alzar.add(this.p.grupo);
  }

  get cuerpo(): 'el' | 'ella' {
    return this.def.aspecto === 'jugador' ? (this.aspectoJugador?.cuerpo ?? 'el') : this.def.cuerpo;
  }

  async cargar() {
    await elegirModelos();
    await this.p.cargarPoses(this.cuerpo);
    const d = this.def;
    let aspecto: AspectoJugador | null = d.aspecto === 'jugador' ? (this.aspectoJugador ?? { cuerpo: this.cuerpo }) : d.aspecto;
    if (aspecto) {
      if (this.alterno) aspecto = otroTono(aspecto);
      this.vestidor = new Vestidor(this.p, this.cuerpo);
      await this.vestidor.aplicar(aspecto);
    } else if (this.alterno && this.p.modelo) {
      // Javier o Laura contra sí mismos: la camiseta y el pantalón de otro color
      this.propios = teñirModelo(this.p.modelo, { cuerpo: this.cuerpo, detalles: { ropa: '#3fb5a3', ropa2: '#3a2f5c', zapatos: '#f2c94c' } });
    }
    this.p.modelo?.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = false;
      }
    });
    for (const h of HUESOS) {
      const b = this.p.huesos.get(h) ?? this.p.huesos.get(h.replace('.', '')) ?? this.p.huesos.get(h.replace('.', '_'));
      if (b) {
        this.huesos.set(h, b);
        this.actual.set(h, new THREE.Quaternion());
        this.aplicado.set(h, new THREE.Quaternion());
      }
    }
    this.p.pose('reposo', true);
    this.listo = true;
  }

  /** Pone una pose de la casa (entrada, victoria, derrota) en vez de las de pelea. */
  private ponerClip(clip: string) {
    if (this.clip === clip) return;
    this.clip = clip;
    if (this.p.tienePose(clip)) this.p.pose(clip);
  }

  actualizar(dt: number, f: PeleadorVista, pasos: number) {
    if (!this.listo) return;
    this.tiempo += dt;
    const { pose, cara, clip, rapidez } = this.elegir(f);
    this.ponerClip(clip);
    this.p.cara(cara);
    this.p.suavidad = 16;
    // (la animación solo reescribe los huesos cuando cambia de pose: antes de mezclar se quita lo que se puso encima
    //  el cuadro anterior, así no se acumula)
    for (const [h, b] of this.huesos) b.quaternion.multiply(this.aplicado.get(h)!.clone().invert());
    this.p.update(dt);
    // Las poses de pelea encima del esqueleto (mezcladas suavecito, o de golpe en los golpes)
    const espejo = f.lado < 0;
    const meta = poseQ(pose.nombre, espejo);
    const k = 1 - Math.exp(-rapidez * dt);
    const mezcla = pose.b ? poseQ(pose.b, espejo) : null;
    for (const [h, b] of this.huesos) {
      const q = this.actual.get(h)!;
      let objetivo = meta.q.get(h)!;
      if (mezcla) objetivo = objetivo.clone().slerp(mezcla.q.get(h)!, pose.w ?? 0);
      if (clip !== 'reposo') objetivo = IDENT;
      q.slerp(objetivo, k);
      b.quaternion.multiply(q);
      this.aplicado.get(h)!.copy(q);
      // Brazos y piernas que se estiran como de caricatura en los golpes (a lo largo del hueso: su eje Y)
      const e = clip !== 'reposo' ? 1 : meta.estira.get(h)! * (1 - (pose.w ?? 0)) + (mezcla ? mezcla.estira.get(h)! * (pose.w ?? 0) : 0);
      const ky = b.scale.y + (e - b.scale.y) * Math.min(1, k * 1.4);
      b.scale.set(1 + (ky - 1) * 0.35, ky, 1 + (ky - 1) * 0.35);
    }
    const yMeta = clip !== 'reposo' ? 0 : meta.y * (1 - (pose.w ?? 0)) + (mezcla ? mezcla.y * (pose.w ?? 0) : 0);
    this.y += (yMeta - this.y) * k;
    // Girado hacia el otro (y un poco hacia la cámara)
    const finRonda = f.estado === 'victoria' || f.estado === 'derrota' || f.estado === 'entrada';
    const rotMeta = finRonda ? f.lado * 0.35 : f.lado * (Math.PI / 2 - GIRO_CAMARA);
    let d = rotMeta - this.rotY;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.rotY += d * Math.min(1, dt * 14);
    this.p.rot = this.rotY;
    // Tumbado en el piso, dando vueltas en el aire
    const tumbadoMeta = f.estado === 'suelo' || f.estado === 'ko' ? 1 : 0;
    this.tumbado += (tumbadoMeta - this.tumbado) * Math.min(1, dt * 9);
    if (f.estado === 'volando') this.vuelta += dt * (f.ko ? 9 : 5) * -f.lado * Math.sign(f.vx || 1) * (Math.abs(f.vx) > 3 ? 1 : 0.4);
    else this.vuelta *= Math.pow(0.0005, dt);
    this.giro.rotation.set(0, 0, 0);
    this.giro.rotation.z = this.vuelta * 0.5 + this.tumbado * (Math.PI / 2) * -f.lado * 0.98;
    // Sacudida al recibir un golpe
    if (f.ultimoGolpe !== this.ultimoVisto) {
      if (pasos - f.ultimoGolpe < 4) this.sacudida = 1;
      this.ultimoVisto = f.ultimoGolpe;
    }
    this.sacudida = Math.max(0, this.sacudida - dt * 5);
    const temblor = this.sacudida * 0.06 * Math.sin(this.tiempo * 90);
    const mareo = f.estado === 'mareado' ? Math.sin(this.tiempo * 5) * 0.08 : 0;
    this.alzar.position.set(temblor, this.y, 0);
    this.alzar.rotation.z = mareo;
    this.raiz.position.set(f.x, f.y + this.tumbado * 0.3 * this.escala, 0);
  }

  private elegir(f: PeleadorVista): { pose: { nombre: string; b?: string; w?: number }; cara: Cara; clip: string; rapidez: number } {
    const g = f.golpe;
    const t = f.t;
    const resp = Math.sin(this.tiempo * 3.2) * 0.5 + 0.5;
    switch (f.estado) {
      case 'entrada':
        return { pose: { nombre: 'neutra' }, cara: 'presumido', clip: this.def.poses.entrada, rapidez: 8 };
      case 'victoria':
        return { pose: { nombre: 'neutra' }, cara: t % 160 < 120 ? 'carcajada' : 'feliz', clip: this.def.poses.victoria[t > 70 ? 1 : 0] ?? this.def.poses.victoria[0], rapidez: 8 };
      case 'derrota':
        return { pose: { nombre: 'neutra' }, cara: 'llorando', clip: this.def.poses.derrota, rapidez: 8 };
      case 'caminar': {
        const fase = Math.sin(this.tiempo * 9);
        return { pose: { nombre: 'caminar_a', b: 'caminar_b', w: fase * 0.5 + 0.5 }, cara: 'concentrado', clip: 'reposo', rapidez: 18 };
      }
      case 'agachado':
        return { pose: { nombre: f.entrada.h === -f.lado ? 'tapar_bajo' : 'agachado' }, cara: 'concentrado', clip: 'reposo', rapidez: 22 };
      case 'saltoPre':
        return { pose: { nombre: 'agachado' }, cara: 'concentrado', clip: 'reposo', rapidez: 30 };
      case 'aire':
        return { pose: { nombre: 'aire' }, cara: 'concentrado', clip: 'reposo', rapidez: 14 };
      case 'aterrizaje':
        return { pose: { nombre: 'agachado' }, cara: 'concentrado', clip: 'reposo', rapidez: 26 };
      case 'bloqueo':
        return { pose: { nombre: f.entrada.v < 0 ? 'tapar_bajo' : 'tapar' }, cara: 'nervioso', clip: 'reposo', rapidez: 40 };
      case 'ataque': {
        if (!g) break;
        const carga = t < g.arranque;
        const rec = t >= g.arranque + g.activo;
        const casiFin = rec && t > g.arranque + g.activo + g.recup * 0.55;
        const nombre = carga ? (g.poseCarga ?? g.pose) : casiFin ? (f.suelo ? 'guardia' : 'aire') : g.pose;
        return { pose: { nombre }, cara: g.id === 'super' || g.id === 'especial' ? 'carcajada' : 'enojado', clip: 'reposo', rapidez: carga ? 26 : casiFin ? 10 : 46 };
      }
      case 'golpeado':
        return { pose: { nombre: f.ultimoGolpe % 2 ? 'golpeado_alto' : 'golpeado_bajo' }, cara: 'sorprendido', clip: 'reposo', rapidez: 40 };
      case 'agarrado':
        return { pose: { nombre: 'golpeado_alto' }, cara: 'llorando', clip: 'reposo', rapidez: 30 };
      case 'volando':
        return { pose: { nombre: 'volando' }, cara: f.ko ? 'llorando' : 'sorprendido', clip: 'reposo', rapidez: 20 };
      case 'suelo':
      case 'ko':
        return { pose: { nombre: 'tumbado' }, cara: f.estado === 'ko' ? 'dormido' : 'llorando', clip: 'reposo', rapidez: 10 };
      case 'levantarse':
        return { pose: { nombre: 'agachado' }, cara: 'enojado', clip: 'reposo', rapidez: 12 };
      case 'mareado':
        return { pose: { nombre: 'mareado' }, cara: 'nervioso', clip: 'reposo', rapidez: 10 };
      case 'agarrando':
        return { pose: { nombre: t > 18 ? 'lanzar_agarre' : 'agarrar' }, cara: 'enojado', clip: 'reposo', rapidez: 24 };
      case 'rafaga': {
        const n = Math.floor(t / 7) % 3;
        return { pose: { nombre: ['jab', 'cruzado', 'fuerte'][n] }, cara: 'carcajada', clip: 'reposo', rapidez: 50 };
      }
      case 'contraataque':
        return { pose: { nombre: 'contraataque' }, cara: 'concentrado', clip: 'reposo', rapidez: 46 };
      default:
        break;
    }
    return { pose: { nombre: 'guardia', b: 'guardia_b', w: resp }, cara: 'concentrado', clip: 'reposo', rapidez: 12 };
  }

  /** Punto sobre la cabeza (para estrellitas del mareo y textos). */
  cabeza(v = new THREE.Vector3()) {
    return v.set(this.raiz.position.x, this.raiz.position.y + 2.05 * (this.escala / ALTO_BASE), 0);
  }

  liberar() {
    this.vestidor?.liberar();
    for (const m of this.propios) m.dispose();
    this.raiz.removeFromParent();
  }
}

const IDENT = new THREE.Quaternion();
