// Personaje con esqueleto: cada pose del juego es una animación fija y se mezclan con pesos suaves
// (caminar = vaivén continuo entre las dos zancadas; tomar, reponer o cobrar = transición corta).
import * as THREE from 'three';
import { aTres } from './mundo';
import { Navegacion, P } from './navegacion';
import { cargarAnimado, copiaAnimada } from './recursos';

/** Qué tan rápido llega cada peso a su meta (1/s). */
const SUAVIDAD = 14;

/** Caras que se arman mostrando u ocultando mallas de expresión (vienen ocultas en el modelo). */
export type Cara = 'normal' | 'feliz' | 'hablar' | 'beso' | 'triste' | 'dormido' | 'enojado' | 'puchero' | 'sorprendido' | 'llorando'
  | 'carcajada' | 'concentrado' | 'aburrido' | 'guino' | 'presumido' | 'nervioso' | 'bostezo';

/** Ojo de un lado: abierto, ^ (feliz), > < (apretado), línea (cerrado) o con el párpado a media asta. */
type Ojo = 'abierto' | 'feliz' | 'apretado' | 'cerrado' | 'medio';
/** Cómo se arma cada cara (docs/reacciones.md): ojos y cejas [izq, der] (izq = izquierda de la pantalla), boca y lágrimas. */
interface Rostro { ojos: [Ojo, Ojo]; cejas?: [string, string]; boca: string; lagrimas?: boolean }
const AB: [Ojo, Ojo] = ['abierto', 'abierto'];
const ROSTROS: Record<Cara, Rostro> = {
  normal: { ojos: AB, boca: 'boca' },
  feliz: { ojos: ['feliz', 'feliz'], boca: 'boca' },
  hablar: { ojos: AB, boca: 'boca hablar' },
  beso: { ojos: ['feliz', 'feliz'], boca: 'boca beso' },
  triste: { ojos: AB, boca: 'boca triste' },
  dormido: { ojos: ['feliz', 'feliz'], boca: 'boca' },
  enojado: { ojos: AB, cejas: ['enojo', 'enojo'], boca: 'boca enojo' },
  puchero: { ojos: AB, cejas: ['triste', 'triste'], boca: 'boca puchero' },
  sorprendido: { ojos: AB, cejas: ['arriba', 'arriba'], boca: 'boca o' },
  llorando: { ojos: ['apretado', 'apretado'], cejas: ['triste', 'triste'], boca: 'boca llanto', lagrimas: true },
  carcajada: { ojos: ['apretado', 'apretado'], cejas: ['arriba', 'arriba'], boca: 'boca carcajada' },
  concentrado: { ojos: ['medio', 'medio'], cejas: ['seria', 'seria'], boca: 'boca recta' },
  aburrido: { ojos: ['medio', 'medio'], boca: 'boca recta' },
  guino: { ojos: ['abierto', 'feliz'], cejas: ['arriba', ''], boca: 'boca ladeada' },
  presumido: { ojos: ['medio', 'medio'], cejas: ['arriba', ''], boca: 'boca ladeada' },
  nervioso: { ojos: AB, cejas: ['triste', 'triste'], boca: 'boca ondulada' },
  bostezo: { ojos: ['cerrado', 'cerrado'], boca: 'boca o grande' },
};
/** Las caras de siempre parpadean con ^ ^; las nuevas, con una línea. */
const PARPADEO_FELIZ = new Set<Cara>(['normal', 'hablar', 'triste']);
const CEJAS = ['enojo', 'triste', 'arriba', 'seria'];
/** Cada boca con sus piezas (lengua, dientes, labio, rayitas de los dientes). */
const BOCAS = ['boca', 'boca hablar', 'boca beso', 'boca triste', 'boca enojo', 'boca puchero', 'boca o', 'boca o grande', 'boca llanto',
  'boca carcajada', 'boca recta', 'boca ladeada', 'boca ondulada'].map((b) => [b, new RegExp(`^${b}( lengua| dientes| labio| linea \\d+)?$`)] as const);
/** Nombre de malla sin el prefijo del personaje: «Ella_|_boca_hablar» → «boca hablar». */
const parte = (o: THREE.Object3D) => o.name.replace(/_/g, ' ').replace(/^.*\|\s*/, '').trim();

export class Personaje {
  grupo = new THREE.Group();
  cuerpo = new THREE.Group();
  pos: P;
  rot = 0;
  velocidad = 1.2;
  /** Qué tan rápido se llega a la pose nueva (1/s); las reacciones la suben para golpes secos. */
  suavidad = SUAVIDAD;
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
  modelo: THREE.Object3D | null = null;
  /** Hueso por nombre (p. ej. «comida» o «regalo», donde se sostienen cosas). */
  huesos = new Map<string, THREE.Object3D>();
  private mallas = new Map<string, THREE.Object3D[]>();
  private caraActual: Cara = 'normal';
  /** Partes del modelo base que tapa la ropa puesta (prefijos: «torso camiseta», «mechon»...). */
  private tapadas: string[] = [];
  private parpadeo = 2 + Math.random() * 3;
  private nivelSucio = 0;

  constructor(pos: P, public escala: number) {
    this.pos = { ...pos };
    this.grupo.add(this.cuerpo);
    this.cuerpo.scale.setScalar(escala);
  }

  async cargarPoses(clave: string) {
    const { escena, clips } = await cargarAnimado(`${clave}.glb`);
    const modelo = copiaAnimada(escena);
    this.modelo = modelo;
    this.cuerpo.add(modelo);
    modelo.traverse((o) => {
      if ((o as THREE.Bone).isBone) this.huesos.set(o.name, o);
      if (!(o as THREE.Mesh).isMesh) return;
      const n = parte(o);
      const lista = this.mallas.get(n) ?? [];
      lista.push(o);
      this.mallas.set(n, lista);
    });
    this.aplicarCara();
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

  private ver(nombre: string | RegExp, si: boolean) {
    for (const [n, lista] of this.mallas) {
      if (typeof nombre === 'string' ? n === nombre : nombre.test(n)) for (const o of lista) o.visible = si;
    }
  }

  /** Arma la cara: ojos (o el parpadeo), cejas, la boca que toca y las lágrimas. */
  private aplicarCara(ojosCerrados = false) {
    if (!this.mallas.size) return;
    const c = this.caraActual;
    const r = ROSTROS[c] ?? ROSTROS.normal;
    const cierre: Ojo = PARPADEO_FELIZ.has(c) ? 'feliz' : 'cerrado';
    (['izq', 'der'] as const).forEach((lado, i) => {
      let o = r.ojos[i];
      if (ojosCerrados && (o === 'abierto' || o === 'medio')) o = cierre;
      this.ver(`ojo ${lado}`, o === 'abierto' || o === 'medio');
      // Con el párpado a media asta solo queda el destello de abajo
      this.ver(`destello ${lado} 0`, o === 'abierto');
      this.ver(`destello ${lado} 1`, o === 'abierto' || o === 'medio');
      this.ver(`ojo feliz ${lado}`, o === 'feliz');
      this.ver(`ojo apretado ${lado}`, o === 'apretado');
      this.ver(`ojo cerrado ${lado}`, o === 'cerrado');
      this.ver(new RegExp(`^parpado medio (linea )?${lado}$`), o === 'medio');
      const ceja = r.cejas?.[i] ?? '';
      this.ver(`ceja ${lado}`, !ceja);
      for (const v of CEJAS) this.ver(`ceja ${v} ${lado}`, ceja === v);
    });
    for (const [b, rx] of BOCAS) this.ver(rx, b === r.boca);
    this.ver(/^lagrima /, !!r.lagrimas);
    for (let k = 0; k < 3; k++) {
      this.ver(`suciedad cara ${k}`, this.nivelSucio > k);
      // El barro de la camiseta de fábrica no se pinta encima de otra prenda
      this.ver(`suciedad ropa ${k}`, this.nivelSucio > k && !this.tapada(`suciedad ropa ${k}`));
    }
  }

  private tapada(n: string) {
    return this.tapadas.some((t) => n.startsWith(t));
  }

  /** Oculta las partes de fábrica que tapa la ropa puesta (y muestra las que ya no). */
  tapar(prefijos: string[]) {
    this.tapadas = prefijos;
    for (const [n, lista] of this.mallas) {
      if (/^(ojo|destello|boca|suciedad)/.test(n)) continue;
      for (const o of lista) o.visible = !this.tapada(n);
    }
    this.aplicarCara();
  }

  /** Donde se cuelgan las mallas con esqueleto del personaje (la ropa va al lado). */
  get raizMallas(): THREE.Object3D | null {
    let r: THREE.Object3D | null = null;
    this.modelo?.traverse((o) => {
      if (!r && (o as THREE.SkinnedMesh).isSkinnedMesh) r = o.parent;
    });
    return r;
  }

  /** Todas las mallas del modelo de fábrica, por parte («cabello base», «mechon copete 1»...). */
  get partes(): ReadonlyMap<string, THREE.Object3D[]> {
    return this.mallas;
  }

  cara(c: Cara) {
    if (c === this.caraActual) return;
    this.caraActual = c;
    this.aplicarCara();
  }

  get caraVisible() {
    return this.caraActual;
  }

  /** Barro en la cara y la ropa: 0 (limpio) a 3 (muy sucio). */
  suciedad(n: number) {
    if (n === this.nivelSucio) return;
    this.nivelSucio = n;
    this.aplicarCara();
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
  vaiven(a: string, b: string, w: number) {
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
    this.parpadear(dt);
    this.mezclar(dt);
    this.sincronizar();
  }

  /** Parpadeo cada pocos segundos (solo con los ojos abiertos). */
  private parpadear(dt: number) {
    if (!this.mallas.size) return;
    const antes = this.parpadeo;
    this.parpadeo -= dt;
    if (antes > 0 && this.parpadeo <= 0) this.aplicarCara(true);
    if (this.parpadeo <= -0.13) {
      this.parpadeo = 2.2 + Math.random() * 3.5;
      this.aplicarCara();
    }
  }

  private mezclar(dt: number) {
    if (!this.mezclador) return;
    const k = Math.min(1, dt * this.suavidad);
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
