// Él y Ella en 3D dentro de su cara: el modelo de verdad con el disfraz (ropa del clóset + accesorios del baño
// pegados a los huesos), caminando hacia donde van, encogiéndose cuando les pegan, celebrando al subir de nivel y
// quedando como burbujita cuando caen en pareja. Se inclinan un poquito hacia la cámara para que se les vea la
// carita igual que a los mugrosos.
import * as THREE from 'three';
import { Personaje, type Cara } from '../../../personaje';
import { cargar } from '../../../recursos';
import { Vestuario } from '../../ropa';
import type { Accesorio, Ajuste, DefDisfraz } from '../disfraces';
import type { Ranura } from '../../modelo';
import type { Jugador } from '../motor';
import type { Rol } from '../tipos';
import type { AspectoJugador } from '../../../salas/tipos';
import { teñirModelo } from '../../../salas/tinte';
import { ELEVACION } from './sprites';



/** Ángulo al que se ven los sprites de los mugrosos (el personaje se inclina para verse igual). */
const VISTA_SPRITE = THREE.MathUtils.degToRad(30);
/** Alto del personaje en el mapa. */
export const ALTO_PERSONAJE = 50;

/** Dónde va cada accesorio: hueso, posición, giro (grados) y tamaño, en las medidas del personaje. */
export const PEGAR: Record<Accesorio, { hueso: string; p: [number, number, number]; r: [number, number, number]; s: number }> = {
  // (el muñeco mide 2,5 de alto: la cabeza nace en el hueso a 0,98 y llega a 2,5; las manos están a 0,67)
  // Lo de la mano va grande (en el juego el personaje mide 50 puntos y si no, no se ve)
  toalla_hombro: { hueso: 'torso', p: [0, 0.36, 0.1], r: [0, 0, 0], s: 1.5 },
  toalla_mano: { hueso: 'manoL', p: [0, -0.04, 0.1], r: [0, 0, 0], s: 1.35 },
  espuma_cabeza: { hueso: 'cabeza', p: [0, 1.75, -0.05], r: [0, 0, 0], s: 1.6 },
  cepillo_mano: { hueso: 'manoL', p: [0, 0.02, 0.1], r: [0, -90, 105], s: 1.55 },
  espejo_frente: { hueso: 'cabeza', p: [0, 0.95, 0.02], r: [0, 0, 0], s: 1.75 },
  jabon_pecho: { hueso: 'torso', p: [0, -0.12, 0.36], r: [0, 0, 0], s: 0.75 },
  champu_mano: { hueso: 'manoL', p: [0, -0.08, 0.1], r: [0, 0, 0], s: 1.55 },
  casco_burbuja: { hueso: 'cabeza', p: [0, 0.86, 0.0], r: [0, 0, 0], s: 1.75 },
  casco_bombero: { hueso: 'cabeza', p: [0, 0.93, -0.02], r: [-6, 0, 0], s: 1.62 },
  manguera: { hueso: 'torso', p: [0, 0.12, -0.42], r: [0, 0, 0], s: 1.05 },
  hilo_mano: { hueso: 'manoL', p: [-0.05, -0.08, 0.1], r: [0, 0, 0], s: 1.45 },
  varita_mano: { hueso: 'manoL', p: [-0.05, -0.05, 0.1], r: [0, 0, 0], s: 1.6 },
  escudo: { hueso: 'manoR', p: [0.05, 0.0, 0.16], r: [0, 0, 0], s: 1.26 },
  perfume_mano: { hueso: 'manoL', p: [-0.05, -0.08, 0.1], r: [0, 0, 0], s: 1.55 },
  turbante: { hueso: 'cabeza', p: [0, 0.95, -0.06], r: [-8, 0, 0], s: 1.9 },
  patico_mano: { hueso: 'manoL', p: [0, -0.05, 0.12], r: [0, 0, 0], s: 1.25 },
  ranita_cabeza: { hueso: 'cabeza', p: [0.15, 1.42, 0.0], r: [0, 0, 8], s: 1.0 },
  esponja_mano: { hueso: 'manoL', p: [0, -0.06, 0.1], r: [0, 0, 0], s: 1.4 },
  secador_mano: { hueso: 'manoL', p: [-0.05, -0.08, 0.1], r: [0, 0, 0], s: 1.4 },
  rulos: { hueso: 'cabeza', p: [0, 0.88, -0.1], r: [-10, 0, 0], s: 2.0 },
  // Las de la cara y el pelo vienen modeladas en su sitio (en medidas de la cabeza)
  antifaz_heroe: { hueso: 'cabeza', p: [0, 0, 0], r: [0, 0, 0], s: 1 },
  bigote_lenador: { hueso: 'cabeza', p: [0, 0, 0], r: [0, 0, 0], s: 1 },
  bigote_barbero: { hueso: 'cabeza', p: [0, 0, 0], r: [0, 0, 0], s: 1 },
  rulos_cabeza: { hueso: 'cabeza', p: [0, 0, 0], r: [0, 0, 0], s: 1 },
  corona_guerrera: { hueso: 'cabeza', p: [0, 0, 0], r: [0, 0, 0], s: 1 },
};

/**
 * Retoca una prenda con esqueleto: la corre o la agranda en la pose de amarre, alrededor de su centro, así sigue
 * todas las poses igual. La geometría se copia (la del clóset la comparten todos) y pasa a números de verdad
 * (viene cuantizada para pesar menos).
 */
function retocar(m: THREE.SkinnedMesh, a: Ajuste) {
  if (!m.isSkinnedMesh) return;
  const g = m.geometry.clone();
  for (const nombre of ['position', 'normal']) {
    const at = g.getAttribute(nombre) as THREE.BufferAttribute | undefined;
    if (!at) continue;
    const f = new Float32Array(at.count * 3);
    for (let i = 0; i < at.count; i++) {
      f[i * 3] = at.getX(i);
      f[i * 3 + 1] = at.getY(i);
      f[i * 3 + 2] = at.getZ(i);
    }
    g.setAttribute(nombre, new THREE.BufferAttribute(f, 3));
  }
  // (se agranda alrededor de su propio centro, en la pose de amarre)
  g.computeBoundingBox();
  const pivote = g.boundingBox!.getCenter(new THREE.Vector3()).applyMatrix4(m.bindMatrix);
  const s = a.s ?? 1, sxz = a.sxz ?? 1;
  const T = new THREE.Matrix4()
    .makeTranslation(pivote.x + (a.x ?? 0), pivote.y + (a.y ?? 0), pivote.z + (a.z ?? 0))
    .multiply(new THREE.Matrix4().makeScale(s * sxz, s, s * sxz))
    .multiply(new THREE.Matrix4().makeTranslation(-pivote.x, -pivote.y, -pivote.z));
  g.applyMatrix4(new THREE.Matrix4().copy(m.bindMatrixInverse).multiply(T).multiply(m.bindMatrix));
  g.computeBoundingSphere();
  m.geometry = g;
}

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

  /** Materiales propios (los del modelo los comparten todos: el tinte de un amigo no se le pega a nadie). */
  private propios: THREE.Material[] = [];

  constructor(readonly rol: Rol, readonly disfraz: DefDisfraz, readonly aspecto?: AspectoJugador) {
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
    for (const [r, a] of Object.entries(this.disfraz.ajustes ?? {}) as [Ranura, Ajuste][]) for (const m of this.vest.mallasDe(r)) retocar(m as THREE.SkinnedMesh, a);
    const lib = await cargarAccesorios();
    if (lib) {
      for (const a of this.disfraz.accesorios) {
        const molde = lib.getObjectByName(a);
        const d = PEGAR[a];
        const hueso = this.p.huesos.get(d.hueso) ?? this.p.huesos.get(d.hueso.replace('.', ''));
        if (!molde || !hueso) continue;
        // El nodo del GLB trae su propia escala y posición (la compresión las usa para descomprimir la malla):
        // se respeta y el acomodo va en un grupo de afuera
        const o = new THREE.Group();
        o.add(molde.clone(true));
        o.position.set(...d.p);
        o.rotation.set(...(d.r.map((g) => THREE.MathUtils.degToRad(g)) as [number, number, number]));
        // Las medidas del accesorio van en las del personaje (el hueso puede venir escalado respecto al muñeco;
        // la escala del mapa, la del grupo de afuera, no cuenta)
        const s = new THREE.Vector3(), sg = new THREE.Vector3();
        this.raiz.updateMatrixWorld(true);
        hueso.getWorldScale(s);
        this.p.grupo.getWorldScale(sg);
        o.scale.setScalar(d.s / Math.max(1e-3, s.x / Math.max(1e-6, sg.x)));
        o.traverse((m) => {
          const malla = m as THREE.Mesh;
          if (!malla.isMesh) return;
          malla.frustumCulled = false;
          // El vidrio con transmisión obliga a dibujar la escena dos veces: en el celular, transparente sencillo
          const mat = malla.material as THREE.MeshPhysicalMaterial;
          // (el vidrio clarito, como el casco de burbuja, casi no se ve; un frasco de perfume sí deja ver su color)
          if (mat && mat.transmission > 0) {
            const claro = mat.color.r + mat.color.g + mat.color.b > 2.4;
            const opacidad = claro ? 0.26 : THREE.MathUtils.clamp(1 - mat.transmission * 0.8, 0.3, 0.85);
            malla.material = new THREE.MeshStandardMaterial({ color: mat.color, roughness: 0.1, metalness: 0.1, transparent: true, opacity: opacidad, depthWrite: false });
          }
        });
        hueso.add(o);
      }
    }
    // Los gorros, cascos y el turbante tapan el pelo (así no se sale por encima)
    if (this.disfraz.sinPelo) {
      const que = this.disfraz.sinPelo === 'todo' ? /^(mechon|cabello)/ : /^mechon/;
      for (const [n, l] of this.p.partes) if (que.test(n)) for (const o of l) o.visible = false;
    }
    if (this.aspecto) this.teñir(this.aspecto);
    this.p.pose('reposo', true);
    this.p.sincronizar();
    this.listo = true;
  }

  /** Los colores del perfil de amigo: piel, pelo, camiseta, pantalón y zapatos (en copias de los materiales). */
  private teñir(a: AspectoJugador) {
    if (this.p.modelo) this.propios.push(...teñirModelo(this.p.modelo, a));
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
    for (const m of this.propios) m.dispose();
    this.propios = [];
    this.raiz.removeFromParent();
  }
}
