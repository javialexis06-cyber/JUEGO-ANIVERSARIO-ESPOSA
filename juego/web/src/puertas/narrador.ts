// El narrador: el otro personaje (con la ropa que tenga puesta en la casa) cuenta la historia al empezar,
// acompaña desde una esquina sin estorbar y celebra junto a la puerta al final.
import * as THREE from 'three';
import { Vestuario } from '../casa/ropa';
import type { Rol, Ropa } from '../casa/modelo';
import { Personaje } from '../personaje';
import * as sonido from '../sonido';
import { Escena, OJO } from './escena';
import { ANIMO, BONITO, elegir, FELICITAR, voz } from './historia';
import { Globo } from './ui';

const ESCALA = 0.68;
/** Personaje (x, y) ↔ three (x, 0, -y). */
const P = (x: number, z: number) => ({ x, y: -z });

export class Narrador {
  p = new Personaje(P(-1.2, 1.4), ESCALA);
  globo = new Globo();
  private hablando = false;
  private tHablar = 0;
  private poseHablar = 'hablar_a';
  private hasta = 0;
  /** Ánimos dados en esta puerta (máximo dos). */
  animos = 0;
  private listo = false;

  constructor(public rol: Rol, private escena: Escena) {
    escena.escena.add(this.p.grupo);
    this.p.grupo.visible = false;
    escena.cada((dt) => this.cuadro(dt));
  }

  async cargar() {
    await this.p.cargarPoses(this.rol);
    this.p.velocidad = 1.6;
    // Viste como en la casa
    try {
      const v = JSON.parse(localStorage.getItem('nuestro-hogar-vestidos') ?? 'null') as Record<Rol, { ropa?: Ropa; colorPelo?: string }> | null;
      const mio = v?.[this.rol];
      if (mio?.ropa || mio?.colorPelo) await new Vestuario(this.p, this.rol).aplicar(mio.ropa, mio.colorPelo);
    } catch {
      /* sin ropa guardada */
    }
    this.p.grupo.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    this.listo = true;
  }

  private cuadro(dt: number) {
    if (!this.listo) return;
    this.p.update(dt);
    if (!this.p.moviendo) this.mirarCamara(dt);
    if (this.hablando) {
      this.tHablar += dt;
      if (this.tHablar > 0.9) {
        this.tHablar = 0;
        this.poseHablar = this.poseHablar === 'hablar_a' ? 'hablar_b' : 'hablar_a';
        this.p.pose(this.poseHablar);
      }
    }
    if (this.hasta && this.escena.t > this.hasta) {
      this.hasta = 0;
      if (!this.hablando && !this.p.moviendo) {
        this.p.quieto();
        this.p.cara('normal');
      }
    }
    // El globo sigue la cabeza
    const c = this.p.grupo.localToWorld(new THREE.Vector3(0, 2.45 * ESCALA, 0));
    const s = this.escena.aPantalla(c);
    this.globo.ubicar(s.x, s.y);
  }

  private mirarCamara(dt: number) {
    const obj = Math.atan2(OJO.x - this.p.pos.x, -(-OJO.z - this.p.pos.y));
    let d = obj - this.p.rot;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.p.rot += d * Math.min(1, dt * 7);
  }

  /** Aparece en el centro del cuarto (al empezar la puerta). */
  aparecer() {
    this.p.grupo.visible = true;
    this.p.pos = P(-1.15, 1.5);
    this.p.ruta = [];
    this.p.rot = 0.5;
    this.p.quieto();
    this.p.cara('feliz');
    this.p.sincronizar();
    const g = this.p.cuerpo;
    void this.escena.animar(380, (k) => g.scale.setScalar(ESCALA * (0.6 + 0.4 * k)));
  }

  /** Cuenta algo (varias líneas, tocar para seguir). */
  async decir(lineas: string[]) {
    if (!lineas.length) return;
    this.hablando = true;
    this.p.pose('hablar_a');
    await this.globo.decir(lineas.map((l) => voz(l, this.rol)), (h) => this.p.cara(h ? 'hablar' : 'normal'));
    this.hablando = false;
    this.p.quieto();
    this.p.cara('feliz');
  }

  /** Se corre a la esquina (queda asomado sin tapar el acertijo). */
  irEsquina(): Promise<void> {
    const z = 0.75;
    const dist = OJO.z - z;
    const cam = this.escena.camara;
    const medioAncho = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * dist * cam.aspect;
    const destino = P(-Math.min(3.3, medioAncho - 0.9), z);
    return new Promise((listo) => {
      this.p.ruta = [destino];
      this.p.alLlegar = () => {
        this.p.quieto();
        this.p.cara('normal');
        listo();
      };
    });
  }

  /** Algo salió bien: sonríe un momento. */
  sonreir() {
    if (this.hablando) return;
    this.p.cara('feliz');
    this.p.pose('celebrar');
    this.hasta = this.escena.t + 1.1;
  }

  /** Ánimo corto (nunca pistas), como mucho dos veces por puerta. */
  animar(n: number) {
    if (this.animos >= 2 || this.hablando) return;
    this.globo.susurrar(voz(elegir(ANIMO, n + this.animos * 3), this.rol));
    this.animos++;
    this.p.cara('feliz');
    this.p.pose('saludo_a');
    this.hasta = this.escena.t + 1.6;
    sonido.aviso();
  }

  /** Al abrir la puerta: se acerca, celebra y dice algo bonito. */
  async celebrar(n: number) {
    this.globo.callar();
    await new Promise<void>((listo) => {
      this.p.ruta = [P(-1.05, 1.05)];
      this.p.alLlegar = () => listo();
    });
    this.p.pose('celebrar');
    this.p.cara('feliz');
    sonido.corazon();
    await this.escena.esperar(500);
    await this.decir([`${elegir(FELICITAR, n)} ${elegir(BONITO, n)}`]);
    this.p.pose('beso');
    this.p.cara('beso');
    sonido.beso();
    await this.escena.esperar(650);
    this.p.quieto();
    this.p.cara('feliz');
  }

  /** Cruza la puerta delante de la cámara. */
  async cruzar() {
    await new Promise<void>((listo) => {
      this.p.ruta = [P(-0.2, 0.4), P(0, -0.8)];
      this.p.alLlegar = () => listo();
    });
    this.p.grupo.visible = false;
  }

  esconder() {
    this.p.grupo.visible = false;
    this.globo.callar();
  }
}
