// Personaje con esqueleto: cada pose del juego es una animación fija y se mezclan con pesos suaves
// (caminar = vaivén continuo entre las dos zancadas; tomar, reponer o cobrar = transición corta).
import * as THREE from 'three';
import { aTres } from './mundo';
import { Navegacion, P } from './navegacion';
import { cargarAnimado, copiaAnimada } from './recursos';

/** Qué tan rápido llega cada peso a su meta (1/s). */
const SUAVIDAD = 14;

export class Personaje {
  grupo = new THREE.Group();
  cuerpo = new THREE.Group();
  pos: P;
  rot = 0;
  velocidad = 1.2;
  ruta: P[] = [];
  private t = Math.random() * 10;
  private mezclador: THREE.AnimationMixer | null = null;
  private acciones = new Map<string, THREE.AnimationAction>();
  private pesos = new Map<string, number>();
  private metas = new Map<string, number>();
  private poseActual = '';
  poseCaminar: [string, string] = ['caminar_a', 'caminar_b'];
  poseQuieto = 'reposo';
  alLlegar: (() => void) | null = null;

  constructor(pos: P, public escala: number) {
    this.pos = { ...pos };
    this.grupo.add(this.cuerpo);
    this.cuerpo.scale.setScalar(escala);
  }

  async cargarPoses(clave: string) {
    const { escena, clips } = await cargarAnimado(`${clave}.glb`);
    const modelo = copiaAnimada(escena);
    this.cuerpo.add(modelo);
    this.mezclador = new THREE.AnimationMixer(modelo);
    for (const clip of clips) {
      const a = this.mezclador.clipAction(clip);
      a.setEffectiveWeight(0);
      a.play();
      this.acciones.set(clip.name, a);
      this.pesos.set(clip.name, 0);
      this.metas.set(clip.name, 0);
    }
    this.pose(this.poseQuieto, true);
    this.sincronizar();
  }

  tienePose(nombre: string) {
    return this.acciones.has(nombre);
  }

  /** Cambia a una pose fija (con transición corta, o de golpe si `ya`). */
  pose(nombre: string, ya = false) {
    if (!this.acciones.has(nombre)) return;
    this.poseActual = nombre;
    for (const k of this.metas.keys()) this.metas.set(k, k === nombre ? 1 : 0);
    if (ya) for (const k of this.pesos.keys()) this.pesos.set(k, k === nombre ? 1 : 0);
  }

  /** Mezcla continua entre dos poses (0 = a, 1 = b). */
  private vaiven(a: string, b: string, w: number) {
    this.poseActual = a;
    for (const k of this.metas.keys()) this.metas.set(k, k === a ? 1 - w : k === b ? w : 0);
  }

  ir(nav: Navegacion, destino: P, alLlegar?: () => void) {
    this.ruta = nav.ruta(this.pos, destino);
    this.alLlegar = alLlegar ?? null;
  }

  get moviendo() {
    return this.ruta.length > 0;
  }

  mirarA(p: P) {
    this.rot = Math.atan2(p.x - this.pos.x, -(p.y - this.pos.y));
  }

  update(dt: number) {
    this.t += dt;
    if (this.ruta.length) {
      const meta = this.ruta[0];
      const dx = meta.x - this.pos.x, dy = meta.y - this.pos.y;
      const d = Math.hypot(dx, dy);
      const paso = this.velocidad * dt;
      if (d <= paso) {
        this.pos = { ...meta };
        this.ruta.shift();
        if (!this.ruta.length) {
          const cb = this.alLlegar;
          this.alLlegar = null;
          cb?.();
        }
      } else {
        this.pos.x += (dx / d) * paso;
        this.pos.y += (dy / d) * paso;
        const objetivo = Math.atan2(dx, -dy);
        let delta = objetivo - this.rot;
        delta = Math.atan2(Math.sin(delta), Math.cos(delta));
        this.rot += delta * Math.min(1, dt * 12);
      }
      // Zancadas: vaivén continuo entre las dos poses de caminar y un rebote leve
      const fase = this.t * this.velocidad * 4.2;
      if (this.ruta.length) this.vaiven(this.poseCaminar[0], this.poseCaminar[1], 0.5 + 0.5 * Math.sin(fase));
      this.cuerpo.position.y = Math.abs(Math.sin(fase)) * 0.035;
      this.cuerpo.rotation.z = Math.sin(fase) * 0.02;
    } else {
      this.cuerpo.position.y = Math.max(0, this.cuerpo.position.y - dt * 0.6);
      this.cuerpo.rotation.z *= 0.8;
      // respiración suave
      this.cuerpo.scale.setScalar(this.escala * (1 + Math.sin(this.t * 2.2) * 0.008));
    }
    this.mezclar(dt);
    this.sincronizar();
  }

  private mezclar(dt: number) {
    if (!this.mezclador) return;
    const k = Math.min(1, dt * SUAVIDAD);
    let suma = 0;
    for (const [n, w] of this.pesos) {
      const nw = w + ((this.metas.get(n) ?? 0) - w) * k;
      this.pesos.set(n, nw);
      suma += nw;
    }
    // Normalizados: la suma siempre es 1, así nunca se cuela la pose de fábrica del esqueleto
    for (const [n, a] of this.acciones) a.setEffectiveWeight(suma > 0 ? (this.pesos.get(n) ?? 0) / suma : 0);
    this.mezclador.update(dt);
  }

  quieto(pose?: string) {
    this.pose(pose ?? this.poseQuieto);
  }

  get poseVisible() {
    return this.poseActual;
  }

  sincronizar() {
    this.grupo.position.copy(aTres(this.pos.x, this.pos.y));
    this.grupo.rotation.y = this.rot;
  }

  /** Punto sobre la cabeza (para globos y caritas). */
  cabeza(): THREE.Vector3 {
    return aTres(this.pos.x, this.pos.y, 2.55 * this.escala);
  }
}
