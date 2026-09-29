// Él o Ella dentro de la casa: camina entre los puntos del cuarto (esquivando los muebles y saliendo y entrando por
// las puertas), come, duerme en la cama, se baña, se sienta en el sofá y reacciona a caricias, abrazos, besos y
// regalos (con caras y corazones).
import * as THREE from 'three';
import { Cara, Personaje } from '../personaje';
import { copia, Productos } from '../recursos';
import type { Casa3D, Punto } from './escena_casa';
import { modeloItem } from './escena_casa';
import { ITEM } from './catalogo';
import { Actividad, alDia, animo, Cuarto, EstadoPersonaje, Rol } from './modelo';
import { Vestuario } from './ropa';

type P = { x: number; y: number };
/** Un destino: punto del cuarto (con su giro y su acceso) o un sitio libre del piso. */
type Destino = P & { rot?: number; acceso?: [number, number][]; nombre?: string };
/** Cómo salir del mueble en el que está (los pasos del acceso al revés). */
interface Salida {
  pasos: P[];
  alto: number;
  rot: number;
}
/** Un tramo del camino: caminar recto a un punto (con la altura y el giro del cuerpo mientras llega), buscar
 *  camino esquivando los muebles o cruzar la puerta a otro cuarto. */
type Tramo = { a: P; alto?: number; rot?: number; salida?: Salida } | { ruta: P } | { cruzar: Cuarto };
/** Altura del cuerpo mientras se sube al mueble (y al bajarse): se ve que se sienta, se mete a la tina o se sube a la cama. */
const SUBIR: Record<string, number> = { sofa: 0.48, comer: 0.34, tina: 0.72, cama: 0.8, inodoro: 0.36 };
/** Altura final de cada acción (medida con el cuerpo en su pose contra el cojín, la silla, el agua y el colchón). */
const ALTO = { sofa: 0.48, comer: 0.34, tina: 0.12, cama: 0.74, inodoro: 0.36 };
const rad = THREE.MathUtils.degToRad;
const EJE_Y = new THREE.Vector3(0, 1, 0);
/** Cuánto se recuesta en la cama (90° sería plano). */
const RECLINADO = rad(76);
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
  /** Cuarto donde se hace el mimo (un estado nuevo en otro cuarto o con otra acción lo corta). */
  cuarto: Cuarto;
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
  /** Camino en curso (tramo por tramo) y qué hacer al terminarlo. */
  private plan: Tramo[] = [];
  private finPlan: (() => void) | null = null;
  private meta: P | null = null;
  /** Giro fijo mientras se mete al mueble (se sienta de espaldas al sofá, no dándole la cara). */
  private rotTramo: number | null = null;
  /** Si está sentado, acostado o en la tina: por dónde se sale. */
  private salida: Salida | null = null;
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
  /** Abrazados en la cama (los dos durmiendo): boca arriba juntitos o en cucharita (Él detrás). */
  private abrazo: 'arriba' | 'cucharita' | null = null;
  /** Giro sobre el eje largo del cuerpo (acostado de lado) y corrimiento hacia el centro de la cama. */
  private rodar = 0;
  private juntar = 0;
  /** Lo que va pensando en el inodoro (globito). */
  frase: string | null = null;
  /** El retrete cohete: altura extra (despega o cae del cielo) y temblor antes de despegar. */
  vuelo = 0;
  temblor = 0;

  get lado() {
    return this.rol === 'el' ? 'izq' : 'der';
  }

  /** Punto del cuarto para este personaje (usa la versión _izq/_der si existe). */
  punto(nombre: string, cuarto = this.cuarto): Punto & { nombre: string } {
    const pts = this.casa.puntos(cuarto);
    return { ...(pts[`${nombre}_${this.lado}`] ?? pts[nombre] ?? pts[`centro_${this.lado}`]), nombre };
  }

  private ponerEn(c: Cuarto, pt: P, rot?: number) {
    if (this.p.grupo.parent !== this.casa.cuarto(c)) {
      this.casa.cuarto(c).add(this.p.grupo);
      if (this.enMano) this.casa.cuarto(c).add(this.enMano);
    }
    this.cuarto = c;
    this.salida = null;
    this.p.pos = { x: pt.x, y: pt.y };
    this.p.ruta = [];
    if (rot !== undefined) this.p.rot = rad(rot);
    this.p.sincronizar();
  }

  /** Aparece en la puerta de un cuarto, mirando hacia adentro. */
  private cruzar(c: Cuarto) {
    const pu = this.casa.puerta(c);
    this.ponerEn(c, pu, pu.rot);
    this.metaAlto = this.alto = 0;
    this.metaTumbado = this.tumbado = 0;
  }

  /** Camina hasta un punto esquivando los muebles: primero se levanta del mueble donde esté (por donde entró); si el
   *  punto es de otro cuarto, sale por la puerta de este y entra por la del otro; si el punto tiene acceso (sofá,
   *  silla, tina, cama), llega por esos pasos y se sube al mueble. */
  private ir(c: Cuarto, pt: Destino, alLlegar?: () => void) {
    this.p.ruta = [];
    this.p.alLlegar = null;
    this.rotTramo = null;
    const acceso = (pt.acceso ?? []).map(([x, y]) => ({ x, y }));
    const alto = SUBIR[pt.nombre ?? ''] ?? 0;
    const fin = () => {
      if (pt.rot !== undefined) this.p.rot = rad(pt.rot);
      alLlegar?.();
    };
    this.meta = { x: pt.x, y: pt.y };
    // Ya está sentado justo ahí (del sofá a ver tele): no se levanta
    if (this.salida && c === this.cuarto && this.p.grupo.parent && Math.hypot(this.p.pos.x - pt.x, this.p.pos.y - pt.y) < 0.05) {
      this.plan = [];
      this.finPlan = null;
      fin();
      return;
    }
    const plan: Tramo[] = [];
    if (!this.p.grupo.parent || (c !== this.cuarto && this.casa.actual !== this.cuarto)) this.cruzar(c);
    if (this.salida) {
      const sal = this.salida;
      this.salida = null;
      this.metaTumbado = 0;
      sal.pasos.forEach((q, i) => plan.push(i === 0 ? { a: q, alto: sal.alto, rot: sal.rot } : { a: q, alto: 0 }));
    }
    if (c !== this.cuarto) {
      const e = this.casa.puntos(this.cuarto).entrada;
      plan.push({ ruta: e }, { a: this.casa.puerta(this.cuarto), alto: 0 }, { cruzar: c }, { a: this.casa.puntos(c).entrada });
    }
    if (acceso.length) {
      plan.push({ ruta: acceso[0] });
      for (const q of acceso.slice(1)) plan.push({ a: q });
      plan.push({ a: pt, alto, rot: pt.rot, salida: { pasos: [...acceso].reverse(), alto, rot: pt.rot ?? 0 } });
    } else plan.push({ ruta: pt });
    this.plan = plan;
    this.finPlan = fin;
    this.avanzar();
  }

  /** Siguiente tramo del camino (o lo que tocaba hacer al llegar). */
  private avanzar = () => {
    const t = this.plan.shift();
    this.rotTramo = null;
    if (!t) {
      const f = this.finPlan;
      this.finPlan = null;
      f?.();
      return;
    }
    if ('cruzar' in t) {
      this.cruzar(t.cruzar);
      this.avanzar();
      return;
    }
    if ('ruta' in t) {
      this.metaAlto = 0;
      this.metaTumbado = 0;
      this.p.ruta = this.casa.nav(this.cuarto).ruta(this.p.pos, t.ruta);
    } else {
      if (t.alto !== undefined) this.metaAlto = t.alto;
      if (t.rot !== undefined) this.rotTramo = rad(t.rot);
      if (t.salida) this.salida = t.salida;
      this.p.ruta = [{ x: t.a.x, y: t.a.y }];
    }
    this.p.alLlegar = this.avanzar;
  };

  /** Si el cuarto que deja no está a la vista, no hace falta verlo caminar hasta la puerta: entra de una al otro. */
  private saltarAPuerta() {
    const k = this.plan.findIndex((t) => 'cruzar' in t);
    if (k < 0) return;
    const t = this.plan[k] as { cruzar: Cuarto };
    this.plan = this.plan.slice(k + 1);
    this.p.ruta = [];
    this.p.alLlegar = null;
    this.rotTramo = null;
    this.cruzar(t.cruzar);
    this.avanzar();
  }

  /** Deja de caminar donde va (sin levantarse). */
  private parar() {
    this.plan = [];
    this.finPlan = null;
    this.meta = null;
    this.rotTramo = null;
    this.p.ruta = [];
    this.p.alLlegar = null;
  }

  /** ¿Va caminando a algún lado? */
  get enCamino() {
    return this.p.moviendo || this.plan.length > 0;
  }

  /** Dónde va a quedar parado (para que el otro llegue a su lado y no a donde estaba). */
  dondeQueda(): P {
    return this.enCamino && this.meta ? this.meta : this.p.pos;
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
    // Las acciones son cortas; ver tele dura lo que duren los videos (se alarga de a 20 min mientras está en
    // grande; si se cierra la app, a los 20 min se paran solos)
    if (!(dur > 0 && dur <= (a.accion === 'tv' ? 6 * 3600_000 : 120000))) return false;
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
    if (this.enCamino || this.coreo) return false;
    // (o la acción que ya se venció mientras llegaba y se deja ver unos segundos)
    return this.escena === this.clave(e, ahora).clave || (this.retener > 0 && this.desdeActual === e.actividad.desde && this.escena.startsWith(`${e.cuarto}|`));
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
    if (!accion && a.desde === this.desdeActual && (this.enCamino || this.retener > 0)) return;
    // Durante una coreografía (un abrazo) no se cambia nada, salvo que llegue otra orden (otra acción u otro cuarto): esa la corta
    if (this.coreo) {
      if (!accion && e.cuarto === this.coreo.cuarto) return;
      this.cortarCoreo();
    }
    this.escena = clave;
    this.desdeActual = a.desde;
    this.retener = 0;
    this.soltar();
    this.vestuario?.enBano(false);
    if (accion !== 'dormir') this.abrazo = null;
    this.frase = null;
    this.pasos = [];
    this.efecto = null;
    this.metaTumbado = 0;
    this.metaAlto = 0;
    const c = e.cuarto;
    const llegar = (nombre: string, luego: () => void) => {
      const pt = this.punto(nombre, c);
      if (animado) this.ir(c, pt, luego);
      else {
        this.parar();
        this.ponerEn(c, pt, pt.rot);
        const alto = SUBIR[pt.nombre ?? ''] ?? 0;
        if (pt.acceso?.length) this.salida = { pasos: pt.acceso.map(([x, y]) => ({ x, y })).reverse(), alto, rot: pt.rot };
        luego();
        this.sinTransicion();
      }
    };
    switch (accion) {
      case 'dormir':
        llegar('cama', () => {
          this.metaTumbado = 1;
          this.metaAlto = ALTO.cama;
          this.bucle([{ pose: this.poseCama(), dur: 99, cara: 'dormido' }]);
          this.efecto = 'zzz';
        });
        break;
      case 'comer':
        // Sentado en la silla del comedor, mirando a la mesa
        llegar('comer', () => {
          this.metaAlto = ALTO.comer;
          void this.sostener(a.item ?? 'pan', 'comida');
          this.bucle([{ pose: 'comer_sentado_a', pose2: 'comer_sentado_b', ritmo: 1.6, dur: 99, cara: 'feliz' }]);
        });
        break;
      case 'banar':
        llegar('tina', () => {
          this.metaAlto = ALTO.tina;
          // Adentro de la tina, en ropa interior
          this.vestuario?.enBano(true);
          this.bucle([{ pose: 'frotar_a', pose2: 'frotar_b', ritmo: 2.4, dur: 99, cara: 'feliz' }]);
          this.efecto = 'burbujas';
        });
        break;
      case 'inodoro':
        // Sentado en el inodoro con caras exageradas (y lo que va pensando)
        llegar('inodoro', () => {
          this.metaAlto = ALTO.inodoro;
          const f = (frase: string | null) => () => (this.frase = frase);
          this.bucle([
            { pose: 'sentado', dur: 1.6, cara: 'concentrado', alEmpezar: f('Mmm…') },
            { pose: 'comer_sentado_a', dur: 1.4, cara: 'enojado', alEmpezar: f('¡Ugh!') },
            { pose: 'sentado', dur: 1.0, cara: 'sorprendido', alEmpezar: f('¡¿Qué fue eso?!') },
            { pose: 'comer_sentado_b', dur: 1.5, cara: 'nervioso', alEmpezar: f('Vamos… tú puedes…') },
            { pose: 'sentado', dur: 1.3, cara: 'llorando', alEmpezar: f('¿Por qué me haces esto, estómago?') },
            { pose: 'sentado', dur: 1.4, cara: 'bostezo', alEmpezar: f('…') },
            { pose: 'comer_sentado_a', dur: 1.2, cara: 'puchero', alEmpezar: f('¿Y el papel?') },
            { pose: 'sentado', dur: 1.2, cara: 'enojado', alEmpezar: f('¡Último esfuerzo!') },
            { pose: 'sentado_feliz', dur: 99, cara: 'carcajada', alEmpezar: f('¡Victoria! 😌') },
          ]);
        });
        break;
      case 'lavar':
        llegar('espejo', () => this.bucle([{ pose: 'frotar_a', pose2: 'frotar_b', ritmo: 2.4, dur: 99 }]));
        break;
      case 'sofa':
      case 'tv':
        llegar('sofa', () => {
          this.metaAlto = ALTO.sofa;
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
        // Libre: si ya está en ese cuarto se queda donde está (si estaba sentado, se levanta y sale del mueble;
        // si iba caminando a donde lo mandaron, sigue); si viene de otro cuarto, entra por la puerta
        if (animado && c === this.cuarto && this.p.grupo.parent) {
          const sal = this.salida;
          if (sal) {
            const q = sal.pasos[sal.pasos.length - 1];
            this.ir(c, { x: q.x, y: q.y }, () => this.bucle([]));
          } else if (!this.enCamino) this.bucle([]);
          else {
            // Iba a sentarse (o a otra acción) y ya no: sigue caminando pero no se sube al mueble
            this.plan = this.plan.filter((t) => !('a' in t) || !t.salida);
            this.finPlan = () => this.bucle([]);
          }
        } else llegar('centro', () => this.bucle([]));
    }
  }

  /** Los dos durmiendo en la cama: se juntan y se abrazan (o se separan si uno se despierta). */
  abrazarEnCama(v: 'arriba' | 'cucharita' | null) {
    if (v === this.abrazo) return;
    this.abrazo = v;
    if (this.escena.split('|')[1] === 'dormir' && !this.enCamino) this.bucle([{ pose: this.poseCama(), dur: 99, cara: 'dormido' }]);
  }

  private poseCama() {
    if (!this.abrazo) return 'dormido';
    // En cucharita Él abraza desde atrás; boca arriba cada uno estira el brazo hacia el otro
    if (this.abrazo === 'cucharita') return this.rol === 'el' ? 'abrazo_der' : 'dormido';
    return this.rol === 'el' ? 'abrazo_der' : 'abrazo_izq';
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
    // Si ya estaba en otro mimo, ese termina aquí (una orden nueva corta la anterior)
    if (this.coreo) this.cortarCoreo();
    const cuarto = yo ? otra.cuarto : this.cuarto;
    if (dormido && !yo) {
      // Quien duerme sigue dormido: solo sonríe entre sueños
      this.coreo = { tipo, otra, yo, item, fase: 'dormido', cuarto, t: 0, dur, total: 0 };
      this.p.cara('feliz');
      this.efecto = 'corazones';
      return;
    }
    this.soltar();
    this.pasos = [];
    this.coreo = { tipo, otra, yo, item, fase: yo ? 'ir' : 'esperar', cuarto, t: 0, dur, total: 0 };
    if (!yo) {
      // Quien recibe deja lo que hacía: si estaba sentado (o en la tina) se levanta y sale del mueble; si caminaba, para
      const sal = this.salida;
      if (sal) {
        const q = sal.pasos[sal.pasos.length - 1];
        this.ir(this.cuarto, { x: q.x, y: q.y, rot: 0 });
      } else {
        this.parar();
        this.metaTumbado = 0;
        this.metaAlto = 0;
      }
      return;
    }
    // Quien lo hace camina hasta el otro (sale por la puerta y entra por la del otro si está en otro cuarto)
    const o = otra.dondeQueda();
    const sep = tipo === 'abrazo' ? 0.5 : tipo === 'beso' ? 0.44 : 0.62;
    // A lo ancho de la pantalla (la cámara mira en diagonal), así se ven los dos de perfil y ninguno tapa al otro;
    // si ese lado queda dentro de un mueble, el otro lado, y si no, lo libre más cerca
    const lado = this.rol === 'el' ? -1 : 1;
    const junto = (k: number) => ({ x: o.x + k * sep * ANCHO_PANTALLA.x, y: o.y + k * sep * ANCHO_PANTALLA.y });
    let p = junto(lado);
    if (dormido) {
      // Junto a la cama, por el lado de quien duerme
      const pie = otra.salida?.pasos[otra.salida.pasos.length - 1];
      p = pie ? { x: pie.x, y: pie.y } : { x: o.x, y: o.y - 1.25 };
    } else if (!this.casa.libre(cuarto, p)) p = this.casa.libre(cuarto, junto(-lado)) ? junto(-lado) : junto(lado);
    p = this.casa.cercaLibre(cuarto, p);
    const destino: Destino = { ...p, rot: THREE.MathUtils.radToDeg(Math.atan2(o.x - p.x, -(o.y - p.y))) };
    const llegar = () => {
      if (this.coreo?.fase === 'ir') this.posar();
    };
    if (this.cuarto === cuarto && this.p.grupo.parent && !this.salida && Math.hypot(this.p.pos.x - destino.x, this.p.pos.y - destino.y) < 0.05) {
      this.parar();
      this.p.rot = rad(destino.rot!);
      llegar();
    } else this.ir(cuarto, destino, llegar);
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

  /** Termina el mimo en curso ya (una orden nueva lo interrumpe), y también el del otro si lo estaba haciendo con este. */
  cortarCoreo() {
    const c = this.coreo;
    if (!c) return;
    this.terminarCoreo();
    if (c.fase !== 'dormido') this.parar();
    if (c.otra.coreo?.otra === this) {
      const fase = c.otra.coreo.fase;
      c.otra.terminarCoreo();
      if (fase !== 'dormido') c.otra.parar();
    }
  }

  /** Caminar hasta donde se tocó el piso (a lo libre más cerca si fue sobre un mueble). Interrumpe lo que esté
   *  haciendo: se levanta del mueble, suelta lo que tiene en la mano y deja el mimo. */
  pasear(x: number, y: number) {
    if (!this.p.grupo.parent || this.escena.includes('|dormir|')) return false;
    this.cortarCoreo();
    this.soltar();
    this.pasos = [];
    this.efecto = null;
    this.retener = 0;
    this.metaTumbado = 0;
    this.ir(this.cuarto, this.casa.cercaLibre(this.cuarto, { x, y }), () => this.bucle([]));
    return true;
  }

  get ocupado() {
    return !!this.coreo;
  }

  /** El mimo que está haciendo este personaje (no el que recibe). */
  get mimo(): TipoMimo | null {
    return this.coreo?.yo ? this.coreo.tipo : null;
  }

  /** Qué está mostrando ahora (cuarto|acción|...), para las pruebas. */
  get escenaActual() {
    return this.enCamino ? '' : this.escena;
  }

  get fase() {
    return this.coreo?.fase ?? null;
  }

  update(dt: number) {
    const p = this.p;
    if (this.retener > 0 && !this.enCamino) this.retener -= dt;
    // Va para otro cuarto y el suyo ya no está a la vista: entra de una por la puerta del otro
    if (this.casa.actual !== this.cuarto && this.plan.some((t) => 'cruzar' in t)) this.saltarAPuerta();
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
    if (!this.enCamino && this.pasos.length) {
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
    } else if (!this.enCamino) {
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
    const rotAntes = p.rot;
    p.update(dt);
    // Metiéndose al mueble: gira hacia donde queda sentado en vez de mirar hacia donde camina
    if (this.rotTramo !== null && p.moviendo) {
      const d = Math.atan2(Math.sin(this.rotTramo - rotAntes), Math.cos(this.rotTramo - rotAntes));
      p.rot = rotAntes + d * Math.min(1, dt * 8);
      p.grupo.rotation.y = p.rot;
    }
    // sincronizar() deja el grupo en el piso cada cuadro; aquí se sube, se acuesta y se corre hacia la almohada
    const g = p.grupo;
    g.rotation.order = 'YXZ';
    // Acostado no del todo plano: la cabeza (grande) queda apoyada en la almohada, no hundida en el colchón
    g.rotation.x = -this.tumbado * RECLINADO;
    g.rotation.z = 0;
    g.position.y += this.alto + this.vuelo;
    if (this.temblor > 0) {
      g.position.x += (Math.random() - 0.5) * this.temblor;
      g.position.z += (Math.random() - 0.5) * this.temblor;
    }
    if (this.tumbado > 0.001) {
      const avance = this.tumbado * 0.5;
      g.position.x += Math.sin(p.rot) * avance;
      g.position.z += Math.cos(p.rot) * avance;
    }
    // Abrazados: de lado (cucharita, los dos mirando hacia el lado de Ella) o boca arriba girados el uno al otro
    const hacia = this.rol === 'el' ? 1 : -1;
    const metaRodar = this.abrazo === 'cucharita' ? rad(68) : this.abrazo === 'arriba' ? rad(22) * hacia : 0;
    const metaJuntar = this.abrazo === 'cucharita' ? (this.rol === 'el' ? 0.26 : -0.14) : this.abrazo === 'arriba' ? 0.14 * hacia : 0;
    const kc = Math.min(1, dt * 2.5);
    this.rodar += (metaRodar - this.rodar) * kc;
    this.juntar += (metaJuntar - this.juntar) * kc;
    if (this.tumbado > 0.3) {
      g.position.x += this.juntar * this.tumbado;
      if (Math.abs(this.rodar) > 0.001) g.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(EJE_Y, this.rodar * this.tumbado));
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
