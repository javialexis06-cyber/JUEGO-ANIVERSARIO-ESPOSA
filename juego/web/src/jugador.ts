// Él y Ella: se mueven con el joystick (o con toques, que arman una fila de acciones con números) y, al quedarse
// quietos junto a algo, trabajan solos: la bodega llena el carrito, el estante de al lado se repone, la caja cobra,
// el balde lava el trapero… Cada herramienta tiene su capacidad y se recarga (o se vacía) en su puesto.
import * as THREE from 'three';
import {
  BOLSA_BASURA, CANASTAS_EN_MANO, CARGA_BODEGA, CARRITO_UNIDADES, CHOQUE, COMBO, LAVAR, RECOGER, REPONER, TRAPERO, VELOCIDAD_EL,
} from './balance';
import type { Juego } from './juego';
import { dePantalla } from './mundo';
import { P } from './navegacion';
import { Personaje } from './personaje';
import type { CanastaSuelta, Mugre, Perseguible } from './problemas';
import { cargar, copia, Productos } from './recursos';
import * as sonido from './sonido';
import { CAJA_SECCION, Vitrina } from './tienda';
import { vestirAmigo } from './neutro';
import { NOMBRE_PAREJA } from './nombres';
import type { AspectoJugador } from './salas/tipos';

export type Rol = 'el' | 'ella';

/**
 * Quién maneja a este personaje. Con Él y Ella (solo, los dos en un celular o en línea entre ellos) basta el rol;
 * en una sala (de 2 a 4: Javier, Laura y amigos) cada uno trae su id del día, su nombre, su color y, si es un
 * amigo, los colores de su muñeco.
 */
export interface InfoJugador {
  /** Identificador del día: «el»/«ella» entre la pareja, «j0»…«j3» en una sala (marca lo que cada uno reservó). */
  id: string;
  /** El muñeco base: el de Javier (pelo corto) o el de Laura (pelo largo). */
  cuerpo: Rol;
  nombre: string;
  /** Color de su nombre, su tira de herramientas y sus números (el de su puesto en la sala). */
  color?: string;
  /** Colores del amigo (piel, pelo, ropa); sin esto, el muñeco de fábrica. */
  aspecto?: AspectoJugador;
}

export type Tarea =
  | { id: number; tipo: 'reponer'; vitrina: Vitrina }
  | { id: number; tipo: 'caja' }
  | { id: number; tipo: 'mugre'; mugre: Mugre }
  | { id: number; tipo: 'canasta'; canasta: CanastaSuelta }
  | { id: number; tipo: 'atrapar'; objetivo: Perseguible }
  | { id: number; tipo: 'lavar' };

/** Tarea sin id (Omit que se reparte sobre cada variante de la unión). */
export type NuevaTarea = Tarea extends infer T ? (T extends Tarea ? Omit<T, 'id'> : never) : never;

let siguienteId = 1;
const distancia = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);
/** Qué tan cerca hay que quedarse (m) para que trabaje solo, o para recoger al pasar por encima. */
const CERCA = { bodega: 1.5, vitrina: 0.95, caja: 0.95, lavadero: 1.1, caneca: 1.0, canastas: 1.3, mugre: 0.75, recoger: 0.6, atrapar: 0.9, corazon: 0.7 };
/** Zona muerta del joystick. */
const MUERTA = 0.25;
const trapeable = (m: Mugre) => m.tipo === 'charco' || m.tipo === 'sucio';

export class Jugador extends Personaje {
  tareas: Tarea[] = [];
  actual: Tarea | null = null;
  /** Unidades en el carrito: sirven para cualquier estante. */
  carga = 0;
  /** Manchas que ha limpiado el trapero desde la última lavada. */
  trapero = 0;
  /** Basuras en la bolsa y canastas sueltas que lleva en la mano. */
  bolsa = 0;
  canastasEnMano = 0;
  /** Está cargando en la bodega o lavando el trapero (para el HUD). */
  cargandoBodega = false;
  lavando = false;
  /** Joystick de este personaje: x a la derecha, y hacia arriba de la pantalla (de -1 a 1). */
  mando = { x: 0, y: 0 };
  /** Velocidad real del último cuadro (m/s), para saber si un choque fue de frente y rápido. */
  vel = { x: 0, y: 0 };
  /** Segundos atontado después de un choque. */
  mareo = 0;
  /** Duración de la acción en curso (para la barrita sobre la cabeza). */
  accionTotal = 0;
  private empujon: { x: number; y: number; t: number } | null = null;
  private calma = 0;
  private manual = false;
  /** Lo último que le pidieron fue con toques: lo que quede en la mano lo lleva solo a su puesto. */
  private porToques = false;
  private quietoT = 0;
  private avisado = '';
  private reservadaCerca: Mugre | null = null;
  private carrito = new THREE.Group();
  private huecosCarrito: THREE.Object3D[] = [];
  private accion = 0;
  private alTerminarAccion: (() => void) | null = null;
  private cobrando = false;
  private esperaCaja = 0;
  private cobroEn = 0;
  private cobrosSeguidos = 0;
  private repuestasEnViaje = 0;
  private repensar = 0;

  /** Identificador del día (lo que reserva queda a su nombre). */
  readonly id: string;
  /** Color de su puesto en la sala (en pareja, el azul de Él y el rosado de Ella van por CSS). */
  readonly color: string | undefined;
  private readonly nombrePropio: string | undefined;
  private readonly aspecto: AspectoJugador | undefined;
  /** Materiales propios del amigo (sus colores), para soltarlos al final del día. */
  propios: THREE.Material[] = [];

  /** `rol` es el muñeco base (el de Él o el de Ella); `info` lo que trae cada uno en una sala. */
  constructor(pos: P, escala: number, private juego: Juego, public rol: Rol = 'el', info?: InfoJugador) {
    super(pos, escala);
    this.poseCaminar = ['carrito_a', 'carrito_b'];
    this.poseQuieto = 'carrito_a';
    this.id = info?.id ?? rol;
    this.color = info?.color;
    this.nombrePropio = info?.nombre;
    this.aspecto = info?.aspecto;
  }

  get nombre() {
    return this.nombrePropio ?? NOMBRE_PAREJA[this.rol];
  }
  private get mejoras() {
    return this.juego.mejoras;
  }
  /** Reposiciones que le caben al carrito (cada una deja lleno un estante). */
  get capacidadCarrito() {
    return CARRITO_UNIDADES[Math.max(1, Math.min(4, this.mejoras.carrito ?? 1))];
  }
  get espacioCarrito() {
    return Math.max(0, this.capacidadCarrito - this.carga);
  }
  /** Manchas que aguanta el trapero antes de lavarlo. */
  get capacidadTrapero() {
    return TRAPERO[Math.max(0, Math.min(2, this.mejoras.trapero ?? 0))];
  }
  get traperoLleno() {
    return this.trapero >= this.capacidadTrapero;
  }
  get haciendo() {
    return this.accion > 0;
  }
  get progresoAccion() {
    return this.accionTotal > 0 ? 1 - this.accion / this.accionTotal : 0;
  }
  get puedeChocar() {
    return this.mareo <= 0 && !this.empujon && this.calma <= 0;
  }
  /** Se está moviendo con el joystick (o el teclado). */
  get manejado() {
    return this.manual;
  }
  get atontado() {
    return this.mareo > 0 || !!this.empujon;
  }

  async preparar(productos: Productos) {
    await this.cargarPoses(this.rol);
    // Un amigo con sus colores (piel, pelo, camiseta, pantalón y zapatos)
    this.propios = vestirAmigo(this.modelo, this.aspecto);
    const modelo = copia(await cargar('carrito_1.glb'));
    modelo.traverse((o) => {
      if (o.userData?.producto) this.huecosCarrito.push(o);
    });
    for (const h of this.huecosCarrito) {
      const pr = productos.crear(h.userData.producto);
      if (pr) h.add(pr);
      h.visible = false;
    }
    this.carrito.add(modelo);
    const k = this.escala;
    this.carrito.position.set(0.1 * k, 0, 0.65 * k);
    this.carrito.scale.setScalar(1.3 * k);
    this.grupo.add(this.carrito);
  }

  private igual(x: Tarea, t: NuevaTarea) {
    if (x.tipo !== t.tipo) return false;
    if (t.tipo === 'reponer') return (x as any).vitrina === t.vitrina;
    if (t.tipo === 'mugre') return (x as any).mugre === t.mugre;
    if (t.tipo === 'canasta') return (x as any).canasta === t.canasta;
    if (t.tipo === 'atrapar') return (x as any).objetivo === t.objetivo;
    return true;
  }

  /** ¿Ya está en la fila (o es la acción actual)? */
  tiene(t: NuevaTarea) {
    return (this.actual && this.igual(this.actual, t)) || this.tareas.some((x) => this.igual(x, t));
  }

  /** Agrega una acción a la fila. Devuelve false si ya estaba. Atrapar va primero: no hay tiempo que perder. */
  agregar(t: NuevaTarea): boolean {
    if (this.tiene(t)) return false;
    this.porToques = true;
    const nueva = { ...t, id: siguienteId++ } as Tarea;
    if (t.tipo === 'mugre') t.mugre.reservado = this.id;
    if (t.tipo === 'canasta') t.canasta.reservado = this.id;
    if (t.tipo === 'atrapar') {
      t.objetivo.reservado = this.id;
      this.tareas.unshift(nueva);
    } else this.tareas.push(nueva);
    return true;
  }

  /** Quita de la fila una acción que todavía no empezó (segundo toque sobre lo mismo). */
  cancelar(t: NuevaTarea): boolean {
    const i = this.tareas.findIndex((x) => this.igual(x, t));
    if (i < 0) return false;
    const [x] = this.tareas.splice(i, 1);
    this.soltarReserva(x);
    return true;
  }

  private soltarReserva(x: Tarea) {
    if (x.tipo === 'mugre' && x.mugre.reservado === this.id) x.mugre.reservado = undefined;
    if (x.tipo === 'canasta' && x.canasta.reservado === this.id) x.canasta.reservado = undefined;
    if (x.tipo === 'atrapar' && x.objetivo.reservado === this.id) x.objetivo.reservado = undefined;
  }

  /** Todas las acciones pendientes, en orden (la actual primero). */
  get fila(): Tarea[] {
    return this.actual ? [this.actual, ...this.tareas] : [...this.tareas];
  }

  /** ¿Alguna tarea de reponer (actual o en fila) apunta a esta vitrina? */
  vaAReponer(v: Vitrina) {
    return this.fila.some((t) => t.tipo === 'reponer' && t.vitrina === v);
  }

  private actualizarCarrito() {
    const n = this.carga > 0 ? Math.max(1, Math.round((this.carga / this.capacidadCarrito) * this.huecosCarrito.length)) : 0;
    this.huecosCarrito.forEach((h, i) => (h.visible = i < n));
  }

  private hacer(segundos: number, pose: string, luego: () => void) {
    this.accion = segundos;
    this.accionTotal = segundos;
    this.pose(pose);
    this.alTerminarAccion = luego;
  }

  private cancelarAccion() {
    this.accion = 0;
    this.accionTotal = 0;
    this.alTerminarAccion = null;
    this.cargandoBodega = false;
    this.lavando = false;
    if (this.reservadaCerca?.reservado === this.id) this.reservadaCerca.reservado = undefined;
    this.reservadaCerca = null;
  }

  private terminar() {
    // Si no alcanzó a limpiarla (o a recogerla), queda libre para otro
    if (this.actual) this.soltarReserva(this.actual);
    this.actual = null;
    this.quieto();
  }

  /** Aviso corto (solo a quien juega con el joystick, y una vez por parada). */
  private avisar(clave: string, texto: string) {
    if (this.porToques || this.avisado === clave) return;
    this.avisado = clave;
    this.juego.avisar(this.juego.pareja ? `${this.nombre}: ${texto}` : texto);
  }

  // ---------- Herramientas: carrito, trapero, bolsa y canastas ----------

  /** En la bodega: llena el carrito hasta el tope (tarda un poquito por unidad). */
  private cargarEnBodega(luego: () => void) {
    const j = this.juego;
    this.mirarA({ x: j.tienda.bodega.x, y: j.tienda.bodega.y + 1 });
    const faltan = this.espacioCarrito;
    if (faltan <= 0) return luego();
    this.cargandoBodega = true;
    this.hacer((CARGA_BODEGA.base + CARGA_BODEGA.porUnidad * faltan) * CARGA_BODEGA.mejora[this.mejoras.bodega ?? 0], 'reponer', () => {
      this.cargandoBodega = false;
      this.carga = this.capacidadCarrito;
      this.repuestasEnViaje = 0;
      this.actualizarCarrito();
      sonido.toque();
      luego();
    });
  }

  /** Deja el estante lleno y gasta una reposición del carrito. */
  private reponerEn(v: Vitrina, luego: () => void) {
    if (v.stock >= v.capacidad || !v.nivel || v.tumbada || this.carga <= 0) return luego();
    this.mirarA(v.centro());
    this.hacer(REPONER.base * REPONER.mejora[this.mejoras.alacena ?? 0], 'reponer', () => {
      const puestas = v.tumbada || this.carga <= 0 ? 0 : v.capacidad - v.stock;
      if (puestas > 0) {
        v.ponerStock(v.stock + puestas);
        this.carga -= 1;
        this.actualizarCarrito();
        this.juego.alReponer(v, this);
        this.repuestasEnViaje++;
        const n = this.repuestasEnViaje;
        if (n >= 2) this.juego.bono(COMBO.porVitrinaExtra, `Combo x${n}`, v.centro(), n);
      }
      luego();
    });
  }

  /** Limpia una mugre que tiene a los pies: trapea (llena el trapero), echa la basura a la bolsa o sube los productos al carrito. */
  private limpiar(m: Mugre, luego: () => void) {
    const j = this.juego;
    const v = m.vitrina;
    if (trapeable(m)) {
      if (this.traperoLleno) return luego();
      this.hacer(RECOGER.trapear, 'reponer', () => {
        if (!j.mugres.includes(m)) return luego();
        j.quitarMugre(m);
        this.trapero++;
        j.trabajoHecho(this, m.pos);
        luego();
      });
    } else if (m.tipo === 'basura') {
      if (this.bolsa >= BOLSA_BASURA) return luego();
      this.hacer(RECOGER.basura, 'reponer', () => {
        if (!j.mugres.includes(m)) return luego();
        j.quitarMugre(m);
        this.bolsa++;
        luego();
      });
    } else if (this.espacioCarrito > 0) {
      // Productos caídos: van al carrito (sirven para cualquier estante)
      this.hacer(RECOGER.caidos, 'reponer', () => {
        if (!j.mugres.includes(m)) return luego();
        this.subirCaidos(m);
        luego();
      });
    } else if (v) {
      // Con el carrito lleno se devuelven a mano a su estante
      this.hacer(RECOGER.caidos, 'reponer', () => {
        if (!j.mugres.includes(m)) return luego();
        j.quitarMugre(m);
        this.ir(j.tienda.nav, v.frente(), () => {
          this.mirarA(v.centro());
          this.hacer(0.8, 'reponer', () => {
            v.ponerStock(v.stock + (m.unidades ?? 1));
            j.alReponer(v, this);
            luego();
          });
        });
      });
    } else luego();
  }

  /** Sube al carrito los productos caídos (cuentan como una reposición, si cabe). */
  private subirCaidos(m: Mugre) {
    if (this.espacioCarrito <= 0) return;
    this.carga += 1;
    this.actualizarCarrito();
    this.juego.quitarMugre(m);
  }

  private irALavar(luego: () => void) {
    const j = this.juego;
    this.ir(j.tienda.nav, j.tienda.puestoLavado, () => this.lavar(luego));
  }

  /** En el balde: el trapero queda limpio otra vez. */
  private lavar(luego: () => void) {
    const j = this.juego;
    this.mirarA(j.tienda.lavadero);
    if (this.trapero <= 0) return luego();
    this.lavando = true;
    this.hacer(LAVAR, 'reponer', () => {
      this.lavando = false;
      this.trapero = 0;
      sonido.limpio();
      luego();
    });
  }

  private botarBasura(luego: () => void) {
    const j = this.juego;
    const caneca = j.tienda.canecaCercana(this.pos);
    this.ir(j.tienda.nav, caneca, () => {
      this.mirarA(caneca);
      this.hacer(RECOGER.botar, 'reponer', () => {
        if (this.bolsa > 0) j.trabajoHecho(this, caneca);
        this.bolsa = 0;
        sonido.limpio();
        luego();
      });
    });
  }

  private dejarCanastas(luego: () => void) {
    const j = this.juego;
    this.ir(j.tienda.nav, j.tienda.puestoCanastas, () => {
      this.hacer(RECOGER.dejarCanastas, 'reponer', () => {
        j.canastas += this.canastasEnMano;
        this.canastasEnMano = 0;
        sonido.limpio();
        luego();
      });
    });
  }

  // ---------- Fila de acciones (toques) ----------

  private empezar(t: Tarea) {
    this.actual = t;
    const j = this.juego;
    const nav = j.tienda.nav;
    const fin = () => this.terminar();
    if (t.tipo !== 'caja') this.cobrosSeguidos = 0;
    if (t.tipo === 'reponer') {
      const v = t.vitrina;
      const falta = Math.max(0, v.capacidad - v.stock);
      // Ya está llena (la llenó alguien más): nada que hacer
      if (falta <= 0 || !v.nivel || v.tumbada) return fin();
      const irAVitrina = () => this.ir(nav, v.frente(), () => this.reponerEn(v, fin));
      // Si le queda alguna reposición en el carrito va directo; si no, pasa primero por la bodega
      if (this.carga >= 1) irAVitrina();
      else this.ir(nav, j.tienda.bodega, () => this.cargarEnBodega(irAVitrina));
    } else if (t.tipo === 'caja') {
      if (j.cajera || j.otroCobrando(this)) return fin();
      this.ir(nav, j.tienda.caja.puestoCajero(), () => this.empezarCobro());
    } else if (t.tipo === 'mugre') {
      const m = t.mugre;
      const ir = () =>
        this.ir(nav, m.pos, () => {
          if (!j.mugres.includes(m)) return fin(); // ya la limpiaron
          this.limpiar(m, () => {
            // Si lo siguiente también es basura (y cabe en la bolsa), la recoge antes de ir a la caneca
            const sig = this.tareas[0];
            if (m.tipo === 'basura' && this.bolsa >= BOLSA_BASURA && !(sig?.tipo === 'mugre' && sig.mugre.tipo === 'basura')) return this.botarBasura(fin);
            fin();
          });
        });
      if (trapeable(m) && this.traperoLleno) return this.irALavar(ir);
      if (m.tipo === 'basura' && this.bolsa >= BOLSA_BASURA) return this.botarBasura(ir);
      ir();
    } else if (t.tipo === 'canasta') {
      const c = t.canasta;
      const ir = () =>
        this.ir(nav, c.pos, () => {
          if (!j.canastasSueltas.includes(c)) return fin();
          this.hacer(RECOGER.canasta, 'reponer', () => {
            j.quitarCanasta(c);
            this.canastasEnMano++;
            const sig = this.tareas[0];
            if (sig?.tipo === 'canasta' && this.canastasEnMano < CANASTAS_EN_MANO) return fin();
            this.dejarCanastas(fin);
          });
        });
      if (this.canastasEnMano >= CANASTAS_EN_MANO) return this.dejarCanastas(ir);
      ir();
    } else if (t.tipo === 'lavar') {
      this.irALavar(fin);
    } else {
      this.repensar = 0;
    }
  }

  private empezarCobro() {
    const j = this.juego;
    const caja = j.tienda.caja;
    if (j.cajera || j.otroCobrando(this)) return this.terminar();
    this.mirarA(caja.puestoFila(0));
    this.cobrando = true;
    this.esperaCaja = 0;
    this.cobroEn = 0;
    this.carrito.visible = false;
    this.pose('cobrar');
  }

  private soltarCaja() {
    this.cobrando = false;
    this.cobrosSeguidos = 0;
    this.carrito.visible = true;
  }

  // ---------- Joystick, choques y trabajo por cercanía ----------

  private libre(p: P) {
    const nav = this.juego.tienda.nav;
    const [i, k] = nav.aCelda(p);
    return nav.esLibre(i, k);
  }

  /** El joystick manda: se cancela lo que estaba haciendo. */
  private tomarControl() {
    for (const t of this.fila) this.soltarReserva(t);
    this.tareas = [];
    this.actual = null;
    this.cancelarAccion();
    if (this.cobrando) this.soltarCaja();
    this.ruta = [];
    this.alLlegar = null;
  }

  private moverManual(dt: number, f: number) {
    if (!this.manual) this.tomarControl();
    this.manual = true;
    this.porToques = false;
    this.quietoT = 0;
    this.avisado = '';
    const d = dePantalla(this.mando.x / f, this.mando.y / f);
    const antes = { ...this.pos };
    const v0 = this.velocidad;
    // Joystick análogo: poquito = despacio
    this.velocidad = v0 * Math.max(0.3, Math.min(1, (f - MUERTA) / 0.55));
    this.ruta = [{ x: this.pos.x + d.x * 3, y: this.pos.y + d.y * 3 }];
    this.alLlegar = null;
    super.update(dt);
    this.velocidad = v0;
    // Los muebles no se atraviesan: se desliza por el borde
    if (!this.libre(this.pos) && this.libre(antes)) {
      const soloX = { x: this.pos.x, y: antes.y }, soloY = { x: antes.x, y: this.pos.y };
      this.pos = this.libre(soloX) ? soloX : this.libre(soloY) ? soloY : antes;
      this.sincronizar();
    }
    this.alPasar();
  }

  private soltarMando() {
    this.manual = false;
    this.ruta = [];
    this.alLlegar = null;
    this.quietoT = 0;
    this.quieto();
  }

  /** Choque con el otro: sale empujado hacia `dir`, queda atontado un momento y suelta lo que hacía. */
  chocar(dir: P) {
    this.tomarControl();
    this.empujon = { x: dir.x * CHOQUE.empuje, y: dir.y * CHOQUE.empuje, t: CHOQUE.empujeDura };
    this.mareo = CHOQUE.mareo;
    this.calma = CHOQUE.calma + CHOQUE.empujeDura + CHOQUE.mareo;
    this.pose(this.tienePose('boca_abierta') ? 'boca_abierta' : this.poseQuieto, true);
  }

  /** Le riega todo lo que lleva el carrito (queda vacío). */
  regarCarrito() {
    this.carga = 0;
    this.actualizarCarrito();
  }

  private aturdido(dt: number) {
    this.ruta = [];
    super.update(dt);
    const e = this.empujon;
    if (e) {
      e.t -= dt;
      const sig = { x: this.pos.x + e.x * dt, y: this.pos.y + e.y * dt };
      if (this.libre(sig) || !this.libre(this.pos)) this.pos = sig;
      else {
        // Se estrelló contra un mueble
        this.juego.golpeContra(this, sig);
        e.t = 0;
      }
      const fr = 1 - Math.max(0, e.t) / CHOQUE.empujeDura;
      this.cuerpo.position.y = Math.sin(fr * Math.PI) * 0.1;
      this.cuerpo.rotation.z = Math.sin(fr * Math.PI) * 0.15;
      if (e.t <= 0) {
        this.empujon = null;
        this.pose(this.tienePose('rascarse') ? 'rascarse' : this.poseQuieto);
      }
    } else {
      // Mareado: se tambalea con las estrellitas dando vueltas
      this.mareo -= dt;
      this.cuerpo.rotation.z = Math.sin(this.mareo * 16) * 0.07;
      if (this.mareo <= 0) {
        this.mareo = 0;
        this.cuerpo.rotation.z = 0;
        this.quieto();
      }
    }
    this.sincronizar();
  }

  /** Al pasar por encima (con el joystick): recoge basura, productos caídos y canastas, y bota o deja lo que lleva. */
  private alPasar() {
    const j = this.juego;
    const t = j.tienda;
    const mio = (r?: string) => !r || r === this.id;
    for (const c of [...j.canastasSueltas]) {
      if (this.canastasEnMano >= CANASTAS_EN_MANO || !mio(c.reservado) || distancia(this.pos, c.pos) > CERCA.recoger) continue;
      j.quitarCanasta(c);
      this.canastasEnMano++;
      sonido.toque();
    }
    for (const m of [...j.mugres]) {
      if (!mio(m.reservado) || distancia(this.pos, m.pos) > CERCA.recoger) continue;
      if (m.tipo === 'basura' && this.bolsa < BOLSA_BASURA) {
        j.quitarMugre(m);
        this.bolsa++;
      } else if (m.tipo === 'caidos' && this.espacioCarrito > 0) {
        this.subirCaidos(m);
        sonido.toque();
      }
    }
    if (this.bolsa > 0 && distancia(this.pos, t.canecaCercana(this.pos)) < CERCA.caneca) {
      j.trabajoHecho(this, this.pos);
      this.bolsa = 0;
      sonido.limpio();
    }
    if (this.canastasEnMano > 0 && distancia(this.pos, t.puestoCanastas) < CERCA.canastas) {
      j.canastas += this.canastasEnMano;
      this.canastasEnMano = 0;
      sonido.limpio();
    }
  }

  /** Quieto junto a algo y sin nada en la fila: trabaja solo. */
  private cerca(dt: number) {
    this.quietoT += dt;
    if (this.quietoT < 0.15) return;
    const j = this.juego;
    const t = j.tienda;
    const listo = () => this.quieto();
    // 1) La caja: si hay fila y nadie cobra, cobra
    if (!j.cajera && j.fila.length && distancia(this.pos, t.caja.puestoCajero()) < CERCA.caja) {
      if (!j.otroCobrando(this)) return this.empezarCobro();
      this.avisar('caja', `${j.jugadores.find((o) => o !== this && o.estaCobrando)?.nombre ?? 'Alguien'} ya está cobrando`);
    }
    // 2) Mugre a los pies
    const m = j.mugres
      .filter((x) => (!x.reservado || x.reservado === this.id) && distancia(this.pos, x.pos) < CERCA.mugre)
      .sort((a, b) => distancia(this.pos, a.pos) - distancia(this.pos, b.pos))[0];
    if (m) {
      const puede = trapeable(m) ? !this.traperoLleno : m.tipo === 'basura' ? this.bolsa < BOLSA_BASURA : this.espacioCarrito > 0;
      if (puede) {
        m.reservado = this.id;
        this.reservadaCerca = m;
        return this.limpiar(m, () => {
          if (m.reservado === this.id) m.reservado = undefined;
          this.reservadaCerca = null;
          listo();
        });
      }
      if (trapeable(m)) this.avisar(`trapo${m.id}`, 'el trapero está lleno: lávalo en el balde');
      else if (m.tipo === 'basura') this.avisar(`bolsa${m.id}`, 'la bolsa está llena: bótala en la caneca');
      else this.avisar(`carro${m.id}`, 'el carrito está lleno');
    }
    // 3) La bodega llena el carrito
    if (this.espacioCarrito > 0 && distancia(this.pos, t.bodega) < CERCA.bodega) return this.cargarEnBodega(listo);
    // 4) El balde lava el trapero
    if (this.trapero > 0 && distancia(this.pos, t.puestoLavado) < CERCA.lavadero) return this.lavar(listo);
    // 5) La caneca y el puesto de canastas
    if (this.bolsa > 0 && distancia(this.pos, t.canecaCercana(this.pos)) < CERCA.caneca) {
      return this.hacer(RECOGER.botar, 'reponer', () => {
        j.trabajoHecho(this, this.pos);
        this.bolsa = 0;
        sonido.limpio();
        listo();
      });
    }
    if (this.canastasEnMano > 0 && distancia(this.pos, t.puestoCanastas) < CERCA.canastas) {
      return this.hacer(RECOGER.dejarCanastas, 'reponer', () => {
        j.canastas += this.canastasEnMano;
        this.canastasEnMano = 0;
        sonido.limpio();
        listo();
      });
    }
    // 6) El estante de al lado: lo repone con lo que haya en el carrito
    const v = t.enVenta
      .filter((x) => x.stock < x.capacidad && !x.tumbada && distancia(this.pos, x.frente()) < CERCA.vitrina)
      .sort((a, b) => distancia(this.pos, a.frente()) - distancia(this.pos, b.frente()))[0];
    if (v) {
      if (this.carga > 0) return this.reponerEn(v, listo);
      this.avisar(`vacio${v.dato.id}`, 'el carrito está vacío: llénalo en la bodega');
    }
  }

  update(dt: number) {
    this.velocidad = VELOCIDAD_EL[this.mejoras.zapatos ?? 0] * (this.juego.cafeActivo ? 1.4 : 1);
    this.calma = Math.max(0, this.calma - dt);
    const antes = { ...this.pos };
    if (this.atontado) this.aturdido(dt);
    else {
      const f = Math.hypot(this.mando.x, this.mando.y);
      if (f > MUERTA) this.moverManual(dt, Math.min(1, f));
      else {
        if (this.manual) this.soltarMando();
        this.trabajar(dt);
      }
      // Al ladrón o a la niña se les atrapa con solo alcanzarlos; el corazón se toma pasando por encima
      const j = this.juego;
      for (const o of j.perseguibles()) if (o.visible && distancia(this.pos, o.pos) < CERCA.atrapar) {
        o.alcanzado();
        j.trabajoHecho(this, o.pos);
      }
      if (j.corazonVisible && j.corazon && distancia(this.pos, j.corazon.pos) < CERCA.corazon) j.tomarCorazon();
    }
    const k = 1 / Math.max(dt, 1e-3);
    this.vel = { x: (this.pos.x - antes.x) * k, y: (this.pos.y - antes.y) * k };
  }

  /** Lo de siempre: hace la acción en curso, sigue la fila de toques o trabaja en lo que tenga cerca. */
  private trabajar(dt: number) {
    super.update(dt);
    if (this.accion > 0) {
      this.accion -= dt;
      if (this.accion <= 0) {
        const cb = this.alTerminarAccion;
        this.alTerminarAccion = null;
        this.accionTotal = 0;
        cb?.();
      }
      return;
    }
    const j = this.juego;
    // Persecución: se recalcula el camino porque el objetivo se mueve
    if (this.actual?.tipo === 'atrapar') {
      const o = this.actual.objetivo;
      if (!o.activo) {
        this.terminar();
      } else if (distancia(this.pos, o.pos) < CERCA.atrapar) {
        o.alcanzado();
        j.trabajoHecho(this, o.pos);
        this.terminar();
      } else {
        this.repensar -= dt;
        if (this.repensar <= 0 || !this.moviendo) {
          this.repensar = 0.3;
          this.ir(j.tienda.nav, o.pos);
        }
      }
      return;
    }
    if (this.cobrando) {
      const primero = j.fila[0];
      // Si le pediste otra cosa, termina con el cliente que está atendiendo y va
      const soltar = this.tareas.length > 0 && this.cobroEn === 0 && (this.cobrosSeguidos > 0 || !(primero && primero.listoParaPagar));
      if (soltar) {
        this.soltarCaja();
        this.terminar();
        return;
      }
      if (primero && primero.listoParaPagar) {
        this.esperaCaja = 0;
        this.cobroEn += dt;
        this.pose('cobrar');
        if (this.cobroEn >= j.tienda.caja.tiempoCobro(primero.unidades)) {
          this.cobroEn = 0;
          j.cobrar(primero, this);
          this.cobrosSeguidos++;
          if (this.cobrosSeguidos >= 2) {
            const b = Math.min(this.cobrosSeguidos - 1, COMBO.cajaMax);
            j.bono(b, `Combo x${this.cobrosSeguidos}`, j.tienda.caja.vitrina.centro(), this.cobrosSeguidos);
          }
        }
      } else {
        this.esperaCaja += dt;
        // Si no hay nadie por cobrar un momento, se suelta la caja
        if (!j.fila.length && this.esperaCaja > 1.2) {
          this.soltarCaja();
          this.terminar();
        }
      }
      return;
    }
    if (this.actual || this.moviendo) return;
    if (this.tareas.length) this.empezar(this.tareas.shift()!);
    // Con toques: lo que quedó en la mano va solo a su puesto
    else if (this.porToques && this.bolsa > 0) this.botarBasura(() => this.terminar());
    else if (this.porToques && this.canastasEnMano > 0) this.dejarCanastas(() => this.terminar());
    else this.cerca(dt);
  }

  /** Posiciones donde dibujar los números de la fila de acciones. */
  objetivo(t: Tarea): P {
    if (t.tipo === 'reponer') return t.vitrina.centro();
    if (t.tipo === 'caja') return this.juego.tienda.caja.vitrina.centro();
    if (t.tipo === 'mugre') return t.mugre.pos;
    if (t.tipo === 'canasta') return t.canasta.pos;
    if (t.tipo === 'lavar') return this.juego.tienda.lavadero;
    return t.objetivo.pos;
  }

  get estaCobrando() {
    return this.cobrando;
  }
}

export const cajaDeSeccion = (s: string) => CAJA_SECCION[s] ?? 'caja abarrotes';
