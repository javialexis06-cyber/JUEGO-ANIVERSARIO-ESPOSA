// Un muñequito que actúa: toma una coreografía (pasos con pose, cara, movimiento, efectos y sonido) y la
// ejecuta sobre el personaje 3D, sumando encima el movimiento procedimental (saltos con estirar y aplastar,
// temblores, cabeceos, giros) y la utilería en las manos. Cuando no actúa, respira, mira y se aburre.
import * as THREE from 'three';
import type { Rol } from '../casa/modelo';
import { type Cara, Personaje } from '../personaje';
import { COREOS, PARECIDA } from './coreografias';
import { utileria } from './utileria';
import { sonar } from './sonidos';
import type { Coreografia, Fx, Mov, Paso, Prop } from './tipos';

const rad = THREE.MathUtils.degToRad;
const suave = (x: number) => x * x * (3 - 2 * x);
const acercarA = (v: number, meta: number, k: number) => v + (meta - v) * k;

/** Qué hace mientras no reacciona a nada. */
export type Espera = 'nada' | 'turno' | 'pensando' | 'mirando';

export class Muneco {
  p: Personaje;
  /** Dónde vive en el escenario (three) y hacia dónde mira en reposo. */
  base = new THREE.Vector3();
  rotBase = 0;
  otro: Muneco | null = null;
  espera: Espera = 'nada';
  /** Avisos hacia el escenario (efectos 2D y globitos). */
  alEfecto: (fx: Fx, quien: Muneco) => void = () => undefined;
  alHablar: (quien: Muneco) => void = () => undefined;

  private coreo: Coreografia | null = null;
  private siguiente: Coreografia | null = null;
  private iPaso = -1;
  private tPaso = 0;
  private t = 0;
  private fase = 0;
  private alTerminar: (() => void) | null = null;
  // Estado suavizado del cuerpo (se acerca a la meta de cada paso para que nada salte)
  private giroExtra = 0;
  private acercamiento = 0;
  private caida = 0;
  private hundido = 0;
  private estirado = 0;
  private inflado = 0;
  private cabezaAbajo = 0;
  private props = new Map<Prop, THREE.Object3D>();
  private propActual: Prop | null = null;
  private tQuieto = 3;
  private mirarOtroHasta = 0;
  alto = 1;
  private altoCabeza = 0.8;
  listo = false;

  constructor(public rol: Rol, escala: number) {
    this.p = new Personaje({ x: 0, y: 0 }, escala);
    this.p.suavidad = 14;
  }

  async cargar() {
    await this.p.cargarPoses(this.rol);
    // Medidas del modelo (para la utilería y los efectos)
    this.p.grupo.updateMatrixWorld(true);
    const caja = new THREE.Box3().setFromObject(this.p.cuerpo);
    this.alto = caja.max.y - caja.min.y || 1;
    const cab = this.p.huesos.get('cabeza');
    if (cab) this.altoCabeza = (caja.max.y - cab.getWorldPosition(new THREE.Vector3()).y) / this.alto;
    this.listo = true;
  }

  /** Coloca al muñeco en su sitio (three) mirando hacia `rot`. */
  ubicar(x: number, z: number, rot: number) {
    this.base.set(x, 0, z);
    this.rotBase = rot;
    this.p.pos = { x, y: -z };
    this.p.rot = rot;
    this.p.sincronizar();
  }

  /** La pose que exista: la pedida o la más parecida de las que trae el modelo. */
  private pose(nombre: string | undefined): string | undefined {
    if (!nombre) return undefined;
    if (nombre === 'abrazo') nombre = this.otro && this.otro.base.x > this.base.x ? 'abrazo_der' : 'abrazo_izq';
    let n: string | undefined = nombre;
    for (let i = 0; i < 4 && n; i++) {
      if (this.p.tienePose(n)) return n;
      n = PARECIDA[n];
    }
    return this.p.tienePose('reposo') ? 'reposo' : undefined;
  }

  get actuando() {
    return !!this.coreo && !this.coreo.bucle;
  }
  get nombreActual() {
    return this.coreo?.nombre ?? '';
  }

  /**
   * Actúa una coreografía (por nombre del catálogo o armada a mano). Si ya está en una más importante,
   * esta queda en fila y se hace después. Devuelve una promesa que se cumple al terminar.
   */
  actuar(c: string | Coreografia, demora = 0): Promise<void> {
    const coreo = typeof c === 'string' ? COREOS[c] : c;
    if (!coreo) return Promise.resolve();
    return new Promise((listo) => {
      const empezar = () => {
        const actual = this.coreo;
        if (actual && !actual.bucle && (actual.prioridad ?? 0) > (coreo.prioridad ?? 0)) {
          this.siguiente = coreo;
          const antes = this.alTerminar;
          this.alTerminar = () => {
            antes?.();
            listo();
          };
          return;
        }
        this.alTerminar?.();
        this.alTerminar = listo;
        this.coreo = coreo;
        this.iPaso = -1;
        this.avanzar();
      };
      if (demora > 0) setTimeout(empezar, demora * 1000);
      else empezar();
    });
  }

  /** Cambia lo que hace mientras espera; si estaba en un bucle (pensar, estudiar), lo suelta. */
  esperar(e: Espera) {
    if (e === this.espera) return;
    this.espera = e;
    if (this.coreo?.bucle) {
      this.coreo = null;
      this.p.suavidad = 8;
      this.p.quieto();
      this.p.cara('normal');
      const fin = this.alTerminar;
      this.alTerminar = null;
      fin?.();
    }
  }

  /** Deja lo que esté haciendo (para cambiar de partida). */
  calmar() {
    this.coreo = null;
    this.siguiente = null;
    this.alTerminar?.();
    this.alTerminar = null;
    this.ponerProp(null);
    this.p.quieto();
    this.p.cara('normal');
  }

  private get paso(): Paso | null {
    return this.coreo && this.iPaso >= 0 ? this.coreo.pasos[this.iPaso] ?? null : null;
  }

  private avanzar() {
    if (!this.coreo) return;
    this.iPaso++;
    if (this.iPaso >= this.coreo.pasos.length) {
      if (this.coreo.bucle) this.iPaso = 0;
      else {
        const fin = this.alTerminar;
        this.alTerminar = null;
        this.coreo = null;
        if (!this.coreo && this.siguiente) {
          const s = this.siguiente;
          this.siguiente = null;
          this.coreo = s;
          this.iPaso = -1;
          this.alTerminar = fin;
          this.avanzar();
          return;
        }
        this.ponerProp(null);
        this.p.suavidad = 10;
        this.p.quieto();
        this.p.cara('normal');
        this.tQuieto = 2 + Math.random() * 3;
        fin?.();
        return;
      }
    }
    const paso = this.coreo.pasos[this.iPaso];
    this.tPaso = 0;
    this.fase = 0;
    this.p.suavidad = paso.suave ?? 14;
    const pose = this.pose(paso.pose);
    if (pose && !paso.pose2) this.p.pose(pose);
    if (paso.cara) this.p.cara(paso.cara as Cara);
    if (paso.prop !== undefined) this.ponerProp(paso.prop);
    sonar(paso.sonido);
    for (const fx of paso.fx ?? []) this.alEfecto(fx, this);
    if (paso.habla) this.alHablar(this);
  }

  // --------------------------------------------------------------- Utilería
  private ponerProp(cual: Prop | null) {
    if (cual === this.propActual) return;
    if (this.propActual) {
      const o = this.props.get(this.propActual);
      if (o) o.visible = false;
    }
    this.propActual = cual;
    if (!cual) return;
    let o = this.props.get(cual);
    if (!o) {
      o = utileria(cual, this.alto);
      this.props.set(cual, o);
      this.p.grupo.add(o);
    }
    o.visible = true;
    o.scale.setScalar(0.01);
    o.userData.aparecer = 0;
  }

  private moverProp(dt: number) {
    const cual = this.propActual;
    if (!cual) return;
    const o = this.props.get(cual)!;
    const hueso = (n: string) => this.p.huesos.get(n)?.getWorldPosition(new THREE.Vector3());
    const mD = hueso('mano.R'), mI = hueso('mano.L'), cab = this.p.huesos.get('cabeza');
    let mundo: THREE.Vector3 | undefined;
    if (cual === 'corona' && cab) {
      mundo = cab.localToWorld(new THREE.Vector3(0, 0, 0));
      const arriba = new THREE.Vector3(0, 1, 0).applyQuaternion(cab.getWorldQuaternion(new THREE.Quaternion()));
      mundo.addScaledVector(arriba, this.altoCabeza * this.alto * this.p.escala * 0.93);
      o.quaternion.copy(this.p.grupo.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(cab.getWorldQuaternion(new THREE.Quaternion())));
    } else if (cual === 'dados' && mD && mI) {
      mundo = mD.clone().add(mI).multiplyScalar(0.5);
      o.quaternion.identity();
    } else if (mI) {
      // La mano derecha del personaje es el hueso «.L» (la que queda a la izquierda de la pantalla)
      mundo = mI;
      o.quaternion.identity();
    }
    if (!mundo) return;
    o.position.copy(this.p.grupo.worldToLocal(mundo));
    const k = (o.userData.aparecer = Math.min(1, (o.userData.aparecer ?? 0) + dt * 5));
    const pop = k < 1 ? 1 + Math.sin(k * Math.PI) * 0.25 : 1;
    o.scale.setScalar(Math.max(0.01, suave(k) * pop) * this.p.escala);
    if (cual === 'bandera') o.rotation.z = Math.sin(this.t * 7) * 0.12;
  }

  // --------------------------------------------------------------- Cada cuadro
  update(dt: number) {
    if (!this.listo) return;
    this.t += dt;
    const paso = this.paso;
    if (paso) {
      this.tPaso += dt;
      if (paso.pose2) {
        const a = this.pose(paso.pose)!, b = this.pose(paso.pose2)!;
        const ritmo = paso.ritmo ?? 2;
        const antes = this.fase;
        this.fase += dt * ritmo;
        this.p.vaiven(a, b, 0.5 - 0.5 * Math.cos(this.fase * Math.PI * 2));
        if (paso.sonidoRitmo && Math.floor(antes * 2) !== Math.floor(this.fase * 2)) sonar(paso.sonidoRitmo);
      }
      if (this.tPaso >= paso.dur) this.avanzar();
    } else {
      this.quieto(dt);
    }
    this.p.update(dt);
    this.cuerpo(dt, this.paso);
    this.moverProp(dt);
  }

  /** Sin coreografía: respira, mira al otro de vez en cuando y se entretiene según esté esperando o pensando. */
  private quieto(dt: number) {
    if (this.espera === 'pensando') {
      void this.actuar('pensando');
      return;
    }
    if (this.espera === 'turno') {
      void this.actuar('estudiar');
      return;
    }
    this.tQuieto -= dt;
    if (this.tQuieto <= 0) {
      this.tQuieto = 3 + Math.random() * 4;
      const r = Math.random();
      if (r < 0.45) this.mirarOtroHasta = this.t + 1.2 + Math.random();
      else if (r < 0.6) void this.actuar('asentir');
    }
  }

  /** Suma el movimiento del paso encima de la pose: posición, giro, escala y huesos. */
  private cuerpo(dt: number, paso: Paso | null) {
    const movs: Mov[] = paso?.mov ?? [];
    const s = paso ? Math.min(1, this.tPaso / paso.dur) : 0;
    const t = this.t;
    let y = 0, x = 0, rz = 0, ry = 0, sy = 1, sxz = 1;
    let metaGiro = this.otro && this.t < this.mirarOtroHasta ? this.anguloOtro() * 0.4 : 0;
    let metaAcerca = 0, metaCaida = 0, metaHundido = 0, metaEstirado = 0, metaInflado = 0, metaCabezaAbajo = 0;
    const huesos: [string, 'x' | 'y' | 'z', number][] = [];
    for (const m of movs) {
      switch (m.tipo) {
        case 'salto': {
          if (s < 0.14) sy *= 1 - 0.13 * suave(s / 0.14);
          else if (s < 0.86) {
            const u = (s - 0.14) / 0.72;
            y += m.alto * 4 * u * (1 - u);
            sy *= 1 + 0.12 * Math.abs(2 * u - 1) * (u < 0.5 ? 1 : 0.7);
          } else sy *= 1 - 0.12 * Math.sin(((s - 0.86) / 0.14) * Math.PI);
          break;
        }
        case 'rebote': {
          const f = Math.abs(Math.sin(Math.PI * m.frec * this.tPaso));
          y += m.alto * f;
          sy *= 1 + 0.05 * (f - 0.5);
          break;
        }
        case 'temblor': {
          const f = m.frec ?? 16;
          x += m.amp * Math.sin(t * f * 6.283) * 1.0;
          rz += m.amp * 1.4 * Math.sin(t * f * 5.1 + 1.3);
          break;
        }
        case 'balanceo':
          rz += rad(m.grados) * Math.sin(this.tPaso * m.frec * Math.PI * 2);
          break;
        case 'giro':
          ry += Math.PI * 2 * m.vueltas * suave(s);
          break;
        case 'cabeza': {
          const eje = m.eje === 'si' ? 'x' : m.eje === 'no' ? 'y' : 'z';
          huesos.push(['cabeza', eje, rad(m.grados) * Math.sin(this.tPaso * m.frec * Math.PI * 2)]);
          break;
        }
        case 'hueso':
          huesos.push([m.hueso, m.eje, rad(m.grados) * Math.sin(this.tPaso * m.frec * Math.PI * 2 + (m.fase ?? 0))]);
          break;
        case 'estirar':
          metaEstirado = m.cuanto;
          break;
        case 'inflarse':
          metaInflado = m.cuanto;
          break;
        case 'hundirse':
          metaHundido = m.cuanto;
          break;
        case 'mirar':
          // Hacia el otro o de espaldas a él, pero siempre de tres cuartos: que se le vea la cara
          metaGiro = m.a === 'otro' ? this.anguloOtro() * 0.5 : m.a === 'lejos' ? -Math.sign(this.anguloOtro()) * 0.8 - this.rotBase : -this.rotBase;
          if (m.a === 'tablero') metaCabezaAbajo = rad(14);
          break;
        case 'acercarse':
          metaAcerca = m.cuanto;
          break;
        case 'caer':
          metaCaida = 1;
          break;
      }
    }
    const k = (v: number) => Math.min(1, dt * v);
    this.giroExtra = acercarA(this.giroExtra, metaGiro, k(9));
    this.acercamiento = acercarA(this.acercamiento, metaAcerca, k(6));
    this.caida = acercarA(this.caida, metaCaida, k(metaCaida ? 7 : 4));
    this.hundido = acercarA(this.hundido, metaHundido, k(5));
    this.estirado = acercarA(this.estirado, metaEstirado, k(18));
    this.inflado = acercarA(this.inflado, metaInflado, k(10));
    this.cabezaAbajo = acercarA(this.cabezaAbajo, metaCabezaAbajo, k(6));

    // Posición: su sitio, más lo que se acerque al otro (a saltitos)
    const pos = this.base.clone();
    if (this.otro && this.acercamiento > 0.001) {
      pos.lerp(this.otro.base, this.acercamiento);
      y += Math.abs(Math.sin(t * 14)) * 0.05 * Math.min(1, Math.abs(metaAcerca - this.acercamiento) * 8);
    }
    // Las cantidades del catálogo van en «muñecos»: 1 = 60 % de su altura
    const u = 0.6 * this.alto * this.p.escala;
    x *= u;
    y *= u;
    this.p.pos = { x: pos.x + x, y: -pos.z };
    this.p.rot = this.rotBase + this.giroExtra + ry;
    this.p.sincronizar();
    const c = this.p.cuerpo;
    const e = this.p.escala;
    const respira = 1 + Math.sin(t * 2.2) * 0.008;
    sy *= (1 + this.estirado) * (1 - this.hundido * 0.6) * respira;
    sxz *= (1 - this.estirado * 0.45) * (1 + this.inflado) * (1 + this.hundido * 0.2);
    c.scale.set(e * sxz, e * sy * (1 + this.inflado * 0.4), e * sxz);
    c.position.set(0, y - this.hundido * u * 0.5, 0);
    c.rotation.set(-this.caida * Math.PI * 0.47, 0, rz);

    // Huesos encima de la pose (el mezclador los reescribe en cada cuadro, así que se suman sin acumular)
    if (this.cabezaAbajo > 0.001) huesos.push(['cabeza', 'x', -this.cabezaAbajo]);
    for (const [n, eje, ang] of huesos) {
      const h = this.p.huesos.get(n);
      if (!h) continue;
      const q = new THREE.Quaternion().setFromAxisAngle(eje === 'x' ? EJE_X : eje === 'y' ? EJE_Y : EJE_Z, ang);
      h.quaternion.multiply(q);
    }
  }

  /** Giro (relativo a su reposo) para quedar mirando al otro. */
  private anguloOtro() {
    if (!this.otro) return 0;
    const d = this.otro.base.clone().sub(this.base);
    return Math.atan2(d.x, d.z) - this.rotBase;
  }

  /** Puntos del cuerpo en el mundo (para anclar efectos). */
  puntoCabeza(): THREE.Vector3 {
    const cab = this.p.huesos.get('cabeza');
    const v = cab ? cab.getWorldPosition(new THREE.Vector3()) : this.p.grupo.position.clone().setY(this.alto * this.p.escala * 0.8);
    v.y += this.altoCabeza * this.alto * this.p.escala * 0.5;
    return v;
  }
  puntoCara(): THREE.Vector3 {
    const v = this.puntoCabeza();
    v.y -= this.altoCabeza * this.alto * this.p.escala * 0.08;
    const frente = new THREE.Vector3(0, 0, 1).applyAxisAngle(EJE_Y, this.p.rot);
    return v.addScaledVector(frente, this.alto * this.p.escala * 0.12);
  }
  puntoPies(): THREE.Vector3 {
    return this.p.grupo.position.clone();
  }
  /** Radio de la cabeza en el mundo. */
  get radioCabeza() {
    return this.altoCabeza * this.alto * this.p.escala * 0.5;
  }
}

const EJE_X = new THREE.Vector3(1, 0, 0);
const EJE_Y = new THREE.Vector3(0, 1, 0);
const EJE_Z = new THREE.Vector3(0, 0, 1);
