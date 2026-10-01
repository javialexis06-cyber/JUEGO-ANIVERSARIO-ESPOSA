// Él y Ella en 3D dentro de su cara: el modelo de verdad con el disfraz (ropa del clóset + accesorios del baño
// pegados a los huesos), caminando hacia donde van, encogiéndose cuando les pegan, celebrando al subir de nivel y
// quedando como burbujita cuando caen en pareja. Se inclinan un poquito hacia la cámara para que se les vea la
// carita igual que a los mugrosos.
import * as THREE from 'three';
import { Personaje, type Cara } from '../../../personaje';
import { cargar } from '../../../recursos';
import { Vestuario } from '../../ropa';
import type { Accesorio, DefDisfraz } from '../disfraces';
import type { Jugador } from '../motor';
import type { Rol } from '../tipos';
import { ELEVACION } from './sprites';

/** Ángulo al que se ven los sprites de los mugrosos (el personaje se inclina para verse igual). */
const VISTA_SPRITE = THREE.MathUtils.degToRad(30);
/** Alto del personaje en el mapa. */
export const ALTO_PERSONAJE = 50;

/** Dónde va cada accesorio: hueso, posición, giro (grados) y tamaño, en las medidas del personaje. */
const PEGAR: Record<Accesorio, { hueso: string; p: [number, number, number]; r: [number, number, number]; s: number }> = {
  toalla_hombro: { hueso: 'torso', p: [0, 0.62, 0.02], r: [0, 0, 0], s: 1.05 },
  espuma_cabeza: { hueso: 'cabeza', p: [0, 1.0, 0.0], r: [0, 0, 0], s: 0.85 },
  cepillo_mano: { hueso: 'manoL', p: [0, 0.05, 0.06], r: [80, 0, -20], s: 0.75 },
  espejo_frente: { hueso: 'cabeza', p: [0, 0.62, -0.04], r: [0, 0, 0], s: 1.0 },
  jabon_pecho: { hueso: 'torso', p: [0, 0.38, 0.42], r: [90, 0, 0], s: 0.42 },
  champu_mano: { hueso: 'manoL', p: [0, -0.02, 0.06], r: [0, 0, 0], s: 0.55 },
  casco_burbuja: { hueso: 'cabeza', p: [0, 0.58, 0.0], r: [0, 0, 0], s: 1.12 },
  casco_bombero: { hueso: 'cabeza', p: [0, 0.98, 0.0], r: [-6, 0, 0], s: 1.1 },
  manguera: { hueso: 'torso', p: [0, 0.4, -0.45], r: [0, 0, 0], s: 1.0 },
  hilo_mano: { hueso: 'manoL', p: [0, -0.05, 0.06], r: [0, 0, 0], s: 0.5 },
  varita_mano: { hueso: 'manoL', p: [0, 0.0, 0.05], r: [0, 0, 0], s: 0.7 },
  escudo: { hueso: 'manoR', p: [0, 0.0, 0.12], r: [90, 0, 0], s: 0.6 },
  perfume_mano: { hueso: 'manoL', p: [0, -0.02, 0.06], r: [0, 0, 0], s: 0.6 },
  turbante: { hueso: 'cabeza', p: [0, 0.82, -0.05], r: [-10, 0, 0], s: 1.25 },
  patico_mano: { hueso: 'manoL', p: [0, -0.05, 0.1], r: [0, 0, 0], s: 0.6 },
  ranita_cabeza: { hueso: 'cabeza', p: [0.05, 1.18, 0.05], r: [0, 0, 0], s: 0.6 },
  esponja_mano: { hueso: 'manoL', p: [0, -0.02, 0.06], r: [0, 0, 0], s: 0.55 },
  secador_mano: { hueso: 'manoL', p: [0, -0.05, 0.06], r: [0, 90, 0], s: 0.6 },
  rulos: { hueso: 'cabeza', p: [0, 0.75, 0.0], r: [0, 0, 0], s: 1.2 },
};

let accesorios: Promise<THREE.Group | null> | null = null;
function cargarAccesorios() {
  accesorios ??= cargar('lavado/accesorios.glb').catch(() => null);
  return accesorios;
}

export class Jugador3D {
  readonly raiz = new THREE.Group();
  readonly p: Personaje;
  private vest: Vestuario;
  private inclinado = new THREE.Group();
  private paso = 0;
  private dolor = 0;
  private fiesta = 0;
  private caraActual: Cara = 'normal';
  private escala: number;
  listo = false;

  constructor(readonly rol: Rol, readonly disfraz: DefDisfraz) {
    this.escala = ALTO_PERSONAJE / 2.6;
    this.p = new Personaje({ x: 0, y: 0 }, 1);
    this.p.suavidad = 12;
    this.vest = new Vestuario(this.p, rol);
    // Inclinado hacia atrás: la cámara lo ve como ve a los sprites
    this.inclinado.rotation.x = -(ELEVACION - VISTA_SPRITE);
    this.inclinado.scale.setScalar(this.escala / Math.cos(VISTA_SPRITE));
    this.inclinado.add(this.p.grupo);
    this.raiz.add(this.inclinado);
  }

  async cargar() {
    await this.p.cargarPoses(this.rol);
    await this.vest.aplicar(this.disfraz.ropa).catch(() => undefined);
    const lib = await cargarAccesorios();
    if (lib) {
      for (const a of this.disfraz.accesorios) {
        const molde = lib.getObjectByName(a);
        const d = PEGAR[a];
        const hueso = this.p.huesos.get(d.hueso) ?? this.p.huesos.get(d.hueso.replace('.', ''));
        if (!molde || !hueso) continue;
        const o = molde.clone(true);
        o.position.set(...d.p);
        o.rotation.set(...(d.r.map((g) => THREE.MathUtils.degToRad(g)) as [number, number, number]));
        // Las medidas del accesorio van en las del personaje (el hueso puede venir escalado)
        const s = new THREE.Vector3();
        hueso.getWorldScale(s);
        o.scale.setScalar(d.s / Math.max(1e-3, s.x));
        o.traverse((m) => {
          if ((m as THREE.Mesh).isMesh) (m as THREE.Mesh).frustumCulled = false;
        });
        hueso.add(o);
      }
      // El turbante y los cascos tapan el pelo
      if (this.disfraz.accesorios.some((a) => a === 'turbante' || a === 'casco_bombero')) {
        for (const [n, l] of this.p.partes) if (/^mechon/.test(n)) for (const o of l) o.visible = false;
      }
    }
    this.p.pose('reposo', true);
    this.p.sincronizar();
    this.listo = true;
  }

  /** Lo que pasó: golpe, celebración (al subir de nivel) o lo que sea con cara propia. */
  golpe() {
    this.dolor = 0.35;
  }

  celebrar(seg = 1.2) {
    this.fiesta = seg;
  }

  private cara(c: Cara) {
    if (c !== this.caraActual) {
      this.caraActual = c;
      this.p.cara(c);
    }
  }

  actualizar(j: Jugador, dt: number, pausa: boolean) {
    if (!this.listo) return;
    this.raiz.position.set(j.x, 0, j.y);
    const v = Math.hypot(j.vx, j.vy);
    const camina = v > 12 && !pausa && !j.caido;
    // Mira hacia donde camina (0 = de frente a la cámara)
    if (camina) {
      const meta = Math.atan2(j.vx, j.vy);
      let d = meta - this.p.rot;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.p.rot += d * Math.min(1, dt * 12);
    } else if (pausa || this.fiesta > 0) {
      let d = 0 - this.p.rot;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.p.rot += d * Math.min(1, dt * 6);
    }
    this.dolor = Math.max(0, this.dolor - dt);
    this.fiesta = Math.max(0, this.fiesta - dt);
    let rebote = 0;
    if (j.caido) {
      this.p.pose('tirado');
      this.cara('llorando');
    } else if (this.fiesta > 0) {
      this.p.vaiven('celebrar', 'baile_a', 0.5 + 0.5 * Math.sin(this.fiesta * 9));
      this.cara('carcajada');
      rebote = Math.abs(Math.sin(this.fiesta * 9)) * 0.06;
    } else if (this.dolor > 0) {
      this.p.pose('encogerse');
      this.cara('sorprendido');
    } else if (camina) {
      this.paso += dt * (5 + v / 40);
      this.p.vaiven('caminar_a', 'caminar_b', 0.5 + 0.5 * Math.sin(this.paso));
      rebote = Math.abs(Math.sin(this.paso)) * 0.035;
      this.cara(j.vida < j.vidaMax * 0.3 ? 'nervioso' : 'normal');
    } else {
      this.p.pose('reposo');
      this.cara(j.vida < j.vidaMax * 0.3 ? 'nervioso' : 'normal');
    }
    this.p.update(dt);
    // Personaje.update lo pone en su sitio de la casa: aquí vive en el centro de su grupo
    this.p.grupo.position.set(0, rebote, 0);
    this.p.grupo.rotation.y = this.p.rot;
    // Aplastarse un poquito al recibir golpe
    const s = this.dolor > 0 ? 1 + Math.sin(this.dolor * 30) * 0.05 : 1;
    this.p.cuerpo.scale.set(s, 1 / s, s);
  }

  liberar() {
    this.vest.liberar();
    this.raiz.removeFromParent();
  }
}
