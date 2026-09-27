// Él o Ella dentro de la casa: camina entre los puntos del cuarto, come, duerme en la cama, se baña,
// se sienta en el sofá y reacciona a caricias, abrazos, besos y regalos (con caras y corazones).
import * as THREE from 'three';
import { Cara, Personaje } from '../personaje';
import { copia, Productos } from '../recursos';
import type { Casa3D, Punto } from './escena_casa';
import { modeloItem } from './escena_casa';
import { ITEM } from './catalogo';
import { Actividad, alDia, animo, Cuarto, EstadoPersonaje, Rol } from './modelo';
import { Vestuario } from './ropa';

type P = { x: number; y: number };
/** Dirección «a lo ancho de la pantalla» en el piso de la casa (la cámara está girada 38°). */
const AZ = THREE.MathUtils.degToRad(38);
const ANCHO_PANTALLA = { x: Math.cos(AZ), y: Math.sin(AZ) };

/** Paso de una coreografía: una pose (o vaivén entre dos) durante un tiempo. */
interface Paso {
  pose: string;
  pose2?: string;
  ritmo?: number;
  dur: number;
  cara?: Cara;
  alEmpezar?: () => void;
}

export type TipoMimo = 'caricia' | 'abrazo' | 'beso' | 'regalo';
interface Coreo {
  tipo: TipoMimo;
  otra: Mascota;
  yo: boolean;
  item?: string;
  /** ir: camina hacia el otro · esperar: aguarda a que llegue · pose: el mimo · dormido: sonríe dormido */
  fase: 'ir' | 'esperar' | 'pose' | 'dormido';
  t: number;
  dur: number;
  total: number;
}

export interface Efecto {
  tipo: 'corazones' | 'zzz' | 'burbujas' | 'nota' | 'brillos';
  rol: Rol;
}

export class Mascota {
  p: Personaje;
  cuarto: Cuarto = 'sala';
  /** Lo que muestra ahora (para no repetir la misma escena al recibir el mismo estado). */
  private escena = '';
  private pasos: Paso[] = [];
  private tPaso = 0;
  private enMano: THREE.Object3D | null = null;
  private huesoMano: THREE.Object3D | null = null;
  private tumbado = 0;
  private alto = 0;
  private metaTumbado = 0;
  private metaAlto = 0;
  private reposo = 'reposo';
  private caraReposo: Cara = 'normal';
  private coreo: Coreo | null = null;
  private espera = 3 + Math.random() * 4;
  private retener = 0;
  private desdeActual = 0;
  private sonrisa = 0;
  private vistas = new Map<number, number>();
  /** Cada objeto que se pone en la mano tiene su turno: si se suelta mientras carga, no aparece después. */
  private turnoMano = 0;
  /** Burbujas, corazones y «zzz» que dibuja la interfaz encima del personaje. */
  efecto: Efecto['tipo'] | null = null;
  pickeable: THREE.Mesh;

  constructor(public rol: Rol, private casa: Casa3D, private productos: Productos) {
    this.p = new Personaje({ x: 0, y: 0 }, casa.dato.escala_personas);
    this.p.velocidad = 1.1;
    // Cápsula invisible para tocar al personaje
    this.pickeable = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.6, 8), new THREE.MeshBasicMaterial({ visible: false }));
    this.pickeable.position.y = 0.8;
    this.p.grupo.add(this.pickeable);
  }

  async cargar() {
    await this.p.cargarPoses(this.rol);
    this.vestuario = new Vestuario(this.p, this.rol);
  }

  /** Ropa puesta, peinado y tinte (lo que diga su estado). */
  vestuario: Vestuario | null = null;

  get lado() {
    return this.rol === 'el' ? 'izq' : 'der';
  }

  /** Punto del cuarto para este personaje (usa la versión _izq/_der si existe). */
  punto(nombre: string, cuarto = this.cuarto): Punto {
    const pts = this.casa.puntos(cuarto);
    return pts[`${nombre}_${this.lado}`] ?? pts[nombre] ?? pts[`centro_${this.lado}`];
  }

  private ponerEn(c: Cuarto, pt: P, rot?: number) {
    if (this.p.grupo.parent !== this.casa.cuarto(c)) {
      this.casa.cuarto(c).add(this.p.grupo);
      if (this.enMano) this.casa.cuarto(c).add(this.enMano);
    }
    this.cuarto = c;
    this.p.pos = { x: pt.x, y: pt.y };
    this.p.ruta = [];
    if (rot !== undefined) this.p.rot = THREE.MathUtils.degToRad(rot);
    this.p.sincronizar();
  }

  /** Camina hasta un punto del mismo cuarto; si viene de otro, entra por la puerta. */
  private ir(c: Cuarto, pt: Punto, alLlegar?: () => void) {
    if (c !== this.cuarto || !this.p.grupo.parent) {
      const e = this.casa.puntos(c).entrada;
      this.ponerEn(c, e, e.rot);
    }
    this.p.ruta = [{ x: pt.x, y: pt.y }];
    this.p.alLlegar = () => {
      this.p.rot = THREE.MathUtils.degToRad(pt.rot);
      alLlegar?.();
    };
  }

  /** Muestra lo que el estado dice que está haciendo (dormir, comer, bañarse...) o lo deja libre en el cuarto. */
  private clave(e: EstadoPersonaje, ahora: number) {
    const a = e.actividad;
    const accion = a.tipo === 'dormir' ? 'dormir' : this.vigente(a, ahora) ? a.accion! : '';
    return { accion, clave: `${e.cuarto}|${accion}|${a.item ?? ''}|${a.desde}` };
  }

  /** ¿Sigue la acción corta (comer, bañarse...)? Se mide con la duración (hasta - desde, del mismo reloj) desde que
   *  este celular la vio, así una diferencia de hora entre los dos celulares no la alarga ni la corta. */
  private vigente(a: Actividad, ahora: number) {
    if (!a.accion || typeof a.hasta !== 'number') return false;
    const dur = a.hasta - a.desde;
    if (!(dur > 0 && dur <= 120000)) return false;
    let visto = this.vistas.get(a.desde);
    if (visto === undefined) {
      visto = ahora;
      this.vistas.set(a.desde, ahora);
      if (this.vistas.size > 16) this.vistas.delete(this.vistas.keys().next().value!);
    }
    // Y si empezó hace rato (abrir la app horas después), ya pasó
    return ahora - visto < dur && ahora - a.desde < dur + 120000;
  }

  /** ¿Ya está mostrando este estado (llegó a su sitio y está haciendo lo que dice)? */
  mostrando(e: EstadoPersonaje, ahora = Date.now()) {
    return this.escena === this.clave(e, ahora).clave && !this.p.moviendo && !this.coreo;
  }

  aplicar(e: EstadoPersonaje, ahora = Date.now(), animado = true) {
    void this.vestuario?.aplicar(e.ropa, e.colorPelo);
    const a = e.actividad;
    const { accion, clave } = this.clave(e, ahora);
    const ahoraEstado = alDia(e, ahora);
    const sucio = ahoraEstado.higiene < 15 ? 3 : ahoraEstado.higiene < 35 ? 2 : ahoraEstado.higiene < 55 ? 1 : 0;
    this.p.suciedad(sucio);
    const an = animo(ahoraEstado);
    this.reposo = an === 'triste' ? 'triste' : 'reposo';
    this.caraReposo = an === 'triste' ? 'triste' : 'normal';
    if (!this.pasos.length && !this.coreo) this.p.cara(this.caraReposo);
    if (clave === this.escena && this.p.grupo.parent) return;
    // La acción se ve completa aunque haya tardado en llegar: si solo se venció (mismo momento), se deja terminar
    if (!accion && a.desde === this.desdeActual && (this.p.moviendo || this.retener > 0)) return;
    // Durante una coreografía (un abrazo) no se cambia nada: se vuelve a aplicar en la siguiente vuelta
    if (this.coreo) return;
    this.escena = clave;
    this.desdeActual = a.desde;
    this.retener = 0;
    this.soltar();
    this.pasos = [];
    this.efecto = null;
    this.metaTumbado = 0;
    this.metaAlto = 0;
    const c = e.cuarto;
    const llegar = (nombre: string, luego: () => void) => {
      const pt = this.punto(nombre, c);
      if (animado) this.ir(c, pt, luego);
      else {
        this.ponerEn(c, pt, pt.rot);
        luego();
        this.sinTransicion();
      }
    };
    switch (accion) {
      case 'dormir':
        llegar('cama', () => {
          this.metaTumbado = 1;
          this.metaAlto = 0.76;
          this.bucle([{ pose: 'dormido', dur: 99, cara: 'dormido' }]);
          this.efecto = 'zzz';
        });
        break;
      case 'comer':
        // Sentado en la silla del comedor, mirando a la mesa
        llegar('comer', () => {
          this.metaAlto = 0.14;
          void this.sostener(a.item ?? 'pan', 'comida');
          this.bucle([{ pose: 'comer_sentado_a', pose2: 'comer_sentado_b', ritmo: 1.6, dur: 99, cara: 'feliz' }]);
        });
        break;
      case 'banar':
        llegar('tina', () => {
          this.metaAlto = 0.12;
          this.bucle([{ pose: 'frotar_a', pose2: 'frotar_b', ritmo: 2.4, dur: 99, cara: 'feliz' }]);
          this.efecto = 'burbujas';
        });
        break;
      case 'lavar':
        llegar('espejo', () => this.bucle([{ pose: 'frotar_a', pose2: 'frotar_b', ritmo: 2.4, dur: 99 }]));
        break;
      case 'sofa':
      case 'tv':
        llegar('sofa', () => {
          this.metaAlto = 0.25;
          this.bucle([{ pose: accion === 'tv' ? 'sentado_feliz' : 'sentado', dur: 99, cara: accion === 'tv' ? 'feliz' : 'normal' }]);
        });
        break;
      case 'nevera':
        llegar('nevera', () => this.bucle([{ pose: 'pensando', dur: 99 }]));
        break;
      case 'closet':
        llegar('closet', () => this.bucle([{ pose: 'pensando', dur: 99 }]));
        break;
      case 'saludo':
        llegar('centro', () => this.bucle([{ pose: 'saludo_a', pose2: 'saludo_b', ritmo: 3, dur: 99, cara: 'feliz' }]));
        break;
      case 'pensar':
        llegar('centro', () => this.bucle([{ pose: 'pensando', dur: 99 }]));
        break;
      default:
        llegar('centro', () => this.bucle([]));
    }
  }

  /** Sin animación (al abrir la app): ya acostado o sentado, sin la transición. */
  private sinTransicion() {
    this.tumbado = this.metaTumbado;
    this.alto = this.metaAlto;
  }

  private bucle(pasos: Paso[]) {
    // Al llegar: la acción se muestra al menos 5 s (comer, bañarse, sentarse...)
    this.retener = pasos.length ? 5 : 0;
    this.pasos = pasos;
    this.tPaso = 0;
    pasos[0]?.alEmpezar?.();
    if (pasos[0]) this.p.cara(pasos[0].cara ?? this.caraReposo);
    else this.p.cara(this.caraReposo);
  }

  /** Pone una comida o un regalo en las manos: el objeto sigue al hueso «comida» o «regalo» del esqueleto. */
  async sostener(item: string, hueso: 'comida' | 'regalo') {
    this.soltar();
    const turno = this.turnoMano;
    const it = ITEM[item];
    const obj = it?.producto ? this.productos.crear(it.producto) : await modeloItem(item).catch(() => null);
    const h = this.p.huesos.get(hueso);
    if (turno !== this.turnoMano || !obj || !h || !this.p.grupo.parent) return;
    const g = new THREE.Group();
    g.add(obj);
    g.scale.setScalar(hueso === 'comida' ? 0.75 : 0.9);
    this.p.grupo.parent.add(g);
    this.enMano = g;
    this.huesoMano = h;
    this.moverMano();
  }

  private moverMano() {
    if (!this.enMano || !this.huesoMano) return;
    const v = new THREE.Vector3();
    this.huesoMano.getWorldPosition(v);
    this.enMano.parent?.worldToLocal(v);
    // El objeto cuelga un poco por debajo del hueso (la mano lo sostiene por abajo)
    this.enMano.position.set(v.x, v.y - (this.huesoMano.name === 'comida' ? 0.1 : 0.16), v.z);
    this.enMano.rotation.y = this.p.rot;
  }

  soltar() {
    this.turnoMano++;
    this.enMano?.removeFromParent();
    this.enMano = null;
    this.huesoMano = null;
  }

  /** Coreografía con el otro personaje: caricia, abrazo, beso o regalo. `quien` = el que la hace.
   *  Todo se mide con el reloj del juego: quien recibe espera a que el otro llegue y posan juntos. */
  interactuar(tipo: TipoMimo, otra: Mascota, quien: Rol, item?: string) {
    const yo = this.rol === quien;
    const dormido = this.escena.includes('|dormir|') || otra.escena.includes('|dormir|');
    const dur = 3.4;
    if (dormido && !yo) {
      // Quien duerme sigue dormido: solo sonríe entre sueños
      this.coreo = { tipo, otra, yo, item, fase: 'dormido', t: 0, dur, total: 0 };
      this.p.cara('feliz');
      this.efecto = 'corazones';
      return;
    }
    this.soltar();
    this.metaTumbado = 0;
    this.metaAlto = 0;
    this.pasos = [];
    this.coreo = { tipo, otra, yo, item, fase: yo ? 'ir' : 'esperar', t: 0, dur, total: 0 };
    if (!yo) return;
    // Quien lo hace camina hasta el otro (entra por la puerta si está en otro cuarto)
    const o = otra.p.pos;
    const sep = tipo === 'abrazo' ? 0.5 : tipo === 'beso' ? 0.44 : 0.62;
    // A lo ancho de la pantalla (la cámara mira en diagonal), así se ven los dos de perfil y ninguno tapa al otro
    const lado = this.rol === 'el' ? -1 : 1;
    const x = o.x + lado * sep * ANCHO_PANTALLA.x;
    const y = o.y + lado * sep * ANCHO_PANTALLA.y;
    const mira = THREE.MathUtils.radToDeg(Math.atan2(o.x - x, -(o.y - y)));
    const destino: Punto = dormido ? { x: o.x, y: o.y - 1.25, rot: 0 } : { x, y, rot: mira };
    const llegar = () => {
      if (this.coreo?.fase === 'ir') this.posar();
    };
    if (this.cuarto === otra.cuarto && this.p.grupo.parent && Math.hypot(this.p.pos.x - destino.x, this.p.pos.y - destino.y) < 0.05) {
      this.p.ruta = [];
      this.p.rot = THREE.MathUtils.degToRad(destino.rot);
      llegar();
    } else this.ir(otra.cuarto, destino, llegar);
  }

  /** Arranca la pose del mimo (los dos a la vez). */
  private posar() {
    const c = this.coreo;
    if (!c) return;
    c.fase = 'pose';
    c.t = 0;
    const { tipo, yo } = c;
    let pose: string;
    let cara: Cara = 'feliz';
    if (tipo === 'caricia') pose = yo ? 'acariciar' : 'recibir_caricia';
    else if (tipo === 'abrazo') pose = this.rol === 'el' ? 'abrazo_izq' : 'abrazo_der';
    else if (tipo === 'beso') {
      pose = 'beso';
      cara = 'beso';
    } else pose = yo ? 'regalo' : 'celebrar';
    this.p.mirarA(c.otra.p.pos);
    if (yo && tipo === 'regalo' && c.item) void this.sostener(c.item, 'regalo');
    this.pasos = [{ pose, dur: 99, cara }];
    this.tPaso = 0;
    this.p.cara(cara);
    this.efecto = tipo === 'regalo' ? 'brillos' : 'corazones';
    // Quien espera arranca justo cuando llega el otro
    const o = c.otra.coreo;
    if (o && o.fase === 'esperar' && o.otra === this) c.otra.posar();
  }

  private terminarCoreo() {
    const c = this.coreo;
    this.coreo = null;
    if (c?.fase === 'dormido') {
      // Sigue dormido: misma pose, ojos cerrados y «zzz»
      this.efecto = 'zzz';
      this.p.cara('dormido');
      return;
    }
    this.soltar();
    this.pasos = [];
    this.efecto = null;
    this.escena = '';
    this.p.cara(this.caraReposo);
  }

  /** Caminar hasta donde se tocó el piso: solo si está libre (no comiendo, durmiendo ni en un mimo). */
  pasear(x: number, y: number) {
    if (this.coreo || this.pasos.length || this.metaTumbado > 0 || this.metaAlto > 0 || this.p.moviendo || !this.p.grupo.parent) return false;
    this.p.ruta = [{ x, y }];
    this.p.alLlegar = null;
    return true;
  }

  get ocupado() {
    return !!this.coreo;
  }

  /** Qué está mostrando ahora (cuarto|acción|...), para las pruebas. */
  get escenaActual() {
    return this.p.moviendo ? '' : this.escena;
  }

  get fase() {
    return this.coreo?.fase ?? null;
  }

  update(dt: number) {
    const p = this.p;
    if (this.retener > 0 && !p.moviendo) this.retener -= dt;
    const c = this.coreo;
    if (c) {
      c.total += dt;
      if (c.fase === 'pose' || c.fase === 'dormido') c.t += dt;
      // Si quien espera ve que el otro ya llegó (o se tarda demasiado), posa igual
      if (c.fase === 'esperar' && (c.otra.coreo?.fase === 'pose' || c.total > 12)) this.posar();
      if (c.fase === 'ir' && c.total > 14) this.posar();
      if (c.t >= c.dur || c.total > 20) this.terminarCoreo();
    }
    // Coreografía en curso
    if (!p.moviendo && this.pasos.length) {
      const paso = this.pasos[0];
      this.tPaso += dt;
      if (paso.pose2) {
        const w = 0.5 + 0.5 * Math.sin(this.tPaso * (paso.ritmo ?? 2) * Math.PI);
        p.pose(w > 0.5 ? paso.pose2 : paso.pose);
      } else p.pose(p.tienePose(paso.pose) ? paso.pose : 'reposo');
      if (this.tPaso >= paso.dur && this.pasos.length > 1) {
        this.pasos.shift();
        this.tPaso = 0;
        this.pasos[0].alEmpezar?.();
        p.cara(this.pasos[0].cara ?? this.caraReposo);
      }
    } else if (!p.moviendo) {
      p.pose(this.reposo);
      if (this.sonrisa > 0 && (this.sonrisa -= dt) <= 0) p.cara(this.caraReposo);
      // De vez en cuando, libre en el cuarto, sonríe o mira a su alrededor
      this.espera -= dt;
      if (this.espera <= 0) {
        this.espera = 4 + Math.random() * 6;
        if (this.caraReposo === 'normal') {
          p.cara('feliz');
          this.sonrisa = 1.2;
        }
      }
    }
    // Acostarse en la cama o sentarse: se gira el cuerpo y se sube
    const k = Math.min(1, dt * 5);
    this.tumbado += (this.metaTumbado - this.tumbado) * k;
    this.alto += (this.metaAlto - this.alto) * k;
    p.update(dt);
    // sincronizar() deja el grupo en el piso cada cuadro; aquí se sube, se acuesta y se corre hacia la almohada
    const g = p.grupo;
    g.rotation.order = 'YXZ';
    g.rotation.x = -this.tumbado * Math.PI / 2;
    g.position.y += this.alto;
    if (this.tumbado > 0.001) {
      const avance = this.tumbado * 0.5;
      g.position.x += Math.sin(p.rot) * avance;
      g.position.z += Math.cos(p.rot) * avance;
    }
    if (this.enMano) {
      g.updateMatrixWorld(true);
      this.moverMano();
    }
  }

  /** Punto sobre la cabeza (o sobre la almohada si duerme) para los globos. */
  cabeza(): THREE.Vector3 {
    this.p.grupo.updateMatrixWorld(true);
    const v = this.p.grupo.localToWorld(new THREE.Vector3(0, 2.35 * this.p.escala, 0));
    v.y += 0.3;
    return v;
  }

  get visible() {
    return this.cuarto === this.casa.actual && !!this.p.grupo.parent;
  }
}

export const copiaProducto = (productos: Productos, id: string) => {
  const it = ITEM[id];
  return it?.producto ? productos.crear(it.producto) : null;
};
export { copia };
