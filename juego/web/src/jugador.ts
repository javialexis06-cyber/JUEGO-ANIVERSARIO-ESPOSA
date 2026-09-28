// Él: fila de acciones por toques (reponer, cobrar, limpiar, recoger canastas, atrapar) y el carrito de reposición.
import * as THREE from 'three';
import { CARGA_BODEGA, COMBO, ESTANTES_CARRITO, RECOGER, REPONER, VELOCIDAD_EL } from './balance';
import type { Juego } from './juego';
import { P } from './navegacion';
import { Personaje } from './personaje';
import type { CanastaSuelta, Mugre, Perseguible } from './problemas';
import { cargar, copia, Productos } from './recursos';
import * as sonido from './sonido';
import { CAJA_SECCION, Vitrina } from './tienda';

export type Tarea =
  | { id: number; tipo: 'reponer'; vitrina: Vitrina }
  | { id: number; tipo: 'caja' }
  | { id: number; tipo: 'mugre'; mugre: Mugre }
  | { id: number; tipo: 'canasta'; canasta: CanastaSuelta }
  | { id: number; tipo: 'atrapar'; objetivo: Perseguible };

/** Tarea sin id (Omit que se reparte sobre cada variante de la unión). */
export type NuevaTarea = Tarea extends infer T ? (T extends Tarea ? Omit<T, 'id'> : never) : never;

let siguienteId = 1;
const distancia = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);

/** Lo que lleva el carrito para un estante: su sección y las unidades que quedan (se carga lo justo para llenarlo). */
export interface CargaCarrito {
  seccion: string;
  producto: string;
  unidades: number;
  max: number;
}

export class Jugador extends Personaje {
  tareas: Tarea[] = [];
  actual: Tarea | null = null;
  /** Lo que lleva en el carrito (se ve arriba en la pantalla). */
  carga: CargaCarrito[] = [];
  /** Está cargando en la bodega (para animar el carrito de la pantalla). */
  cargandoBodega = false;
  private carrito = new THREE.Group();
  private huecosCarrito: THREE.Object3D[] = [];
  private accion = 0;
  private alTerminarAccion: (() => void) | null = null;
  private cobrando = false;
  private esperaCaja = 0;
  private cobroEn = 0;
  private cobrosSeguidos = 0;
  private repuestasEnViaje = 0;
  private basuraEnMano = 0;
  private repensar = 0;

  constructor(pos: P, escala: number, private juego: Juego) {
    super(pos, escala);
    this.poseCaminar = ['carrito_a', 'carrito_b'];
    this.poseQuieto = 'carrito_a';
  }

  private get mejoras() {
    return this.juego.mejoras;
  }
  /** Estantes que alcanza a llenar en un viaje. */
  get capacidadCarrito() {
    return ESTANTES_CARRITO[Math.max(1, Math.min(3, this.mejoras.carrito ?? 1))];
  }
  /** Secciones que lleva (una por estante cargado que todavía tiene algo). */
  get cajas() {
    return this.carga.filter((c) => c.unidades > 0).map((c) => c.seccion);
  }
  unidadesDe(seccion: string) {
    return this.carga.reduce((a, c) => a + (c.seccion === seccion ? c.unidades : 0), 0);
  }
  /** Saca del carrito hasta `n` unidades de una sección y dice cuántas sacó. */
  private sacar(seccion: string, n: number) {
    let sacadas = 0;
    for (const c of this.carga) {
      if (c.seccion !== seccion || sacadas >= n) continue;
      const k = Math.min(c.unidades, n - sacadas);
      c.unidades -= k;
      sacadas += k;
    }
    this.carga = this.carga.filter((c) => c.unidades > 0);
    return sacadas;
  }

  async preparar(productos: Productos) {
    await this.cargarPoses('el');
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
    const nueva = { ...t, id: siguienteId++ } as Tarea;
    if (t.tipo === 'mugre') t.mugre.reservado = 'el';
    if (t.tipo === 'canasta') t.canasta.reservado = 'el';
    if (t.tipo === 'atrapar') {
      t.objetivo.reservado = 'el';
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
    if (x.tipo === 'mugre' && x.mugre.reservado === 'el') x.mugre.reservado = undefined;
    if (x.tipo === 'canasta' && x.canasta.reservado === 'el') x.canasta.reservado = undefined;
    if (x.tipo === 'atrapar' && x.objetivo.reservado === 'el') x.objetivo.reservado = undefined;
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
    this.huecosCarrito.forEach((h, i) => (h.visible = i < this.cajas.length));
  }

  private hacer(segundos: number, pose: string, luego: () => void) {
    this.accion = segundos;
    this.pose(pose);
    this.alTerminarAccion = luego;
  }

  private terminar() {
    this.actual = null;
    this.quieto();
  }

  private empezar(t: Tarea) {
    this.actual = t;
    const j = this.juego;
    const nav = j.tienda.nav;
    if (t.tipo !== 'caja') this.cobrosSeguidos = 0;
    if (t.tipo === 'reponer') {
      const v = t.vitrina;
      const falta = () => Math.max(0, v.capacidad - v.stock);
      const irAVitrina = () =>
        this.ir(nav, v.frente(), () => {
          this.mirarA(v.centro());
          if (v.stock >= v.capacidad || !v.nivel) return this.terminar(); // ya la llenó alguien más
          this.hacer(REPONER.base * REPONER.mejora[this.mejoras.alacena ?? 0], 'reponer', () => {
            const puestas = this.sacar(v.seccion, falta());
            v.ponerStock(v.stock + puestas);
            this.actualizarCarrito();
            if (puestas > 0) {
              j.alReponer(v);
              this.repuestasEnViaje++;
              if (this.repuestasEnViaje >= 2) j.bono(COMBO.porVitrinaExtra, `Combo x${this.repuestasEnViaje}`, v.centro(), this.repuestasEnViaje);
            }
            this.terminar();
          });
        });
      // Ya está llena (la llenó alguien más): nada que hacer
      if (falta() <= 0 || !v.nivel) return this.terminar();
      // Si lo que queda en el carrito alcanza para llenarla, va directo; si no, pasa por la bodega
      if (this.unidadesDe(v.seccion) >= falta()) irAVitrina();
      else
        this.ir(nav, j.tienda.bodega, () => {
          this.mirarA({ x: j.tienda.bodega.x, y: j.tienda.bodega.y + 1 });
          // Carga lo justo para dejar llena esta vitrina (y las siguientes de la fila, si el carrito es grande).
          // Lo que sobraba de otras secciones se queda en la bodega.
          const pendientes = [v, ...this.tareas.filter((x) => x.tipo === 'reponer').map((x) => (x as any).vitrina as Vitrina)];
          const cargar: Vitrina[] = [];
          for (const p of pendientes) if (cargar.length < this.capacidadCarrito && !cargar.includes(p) && p.capacidad > 0) cargar.push(p);
          const tiempo = (CARGA_BODEGA.base + CARGA_BODEGA.porEstante * cargar.length) * CARGA_BODEGA.mejora[this.mejoras.bodega ?? 0];
          this.cargandoBodega = true;
          this.hacer(tiempo, 'reponer', () => {
            this.cargandoBodega = false;
            this.carga = cargar.map((p) => ({ seccion: p.seccion, producto: p.productos[0], unidades: p.capacidad, max: p.capacidad }));
            this.repuestasEnViaje = 0;
            this.actualizarCarrito();
            irAVitrina();
          });
        });
    } else if (t.tipo === 'caja') {
      const caja = j.tienda.caja;
      this.ir(nav, caja.puestoCajero(), () => {
        this.mirarA(caja.puestoFila(0));
        this.cobrando = true;
        this.esperaCaja = 0;
        this.cobroEn = 0;
        this.carrito.visible = false;
        this.pose('cobrar');
      });
    } else if (t.tipo === 'mugre') {
      const m = t.mugre;
      this.ir(nav, m.pos, () => {
        if (!j.mugres.includes(m)) return this.terminar(); // ya la limpiaron
        if (m.tipo === 'charco') {
          this.hacer(RECOGER.trapear, 'reponer', () => {
            j.quitarMugre(m);
            this.terminar();
          });
        } else if (m.tipo === 'basura') {
          this.hacer(RECOGER.basura, 'reponer', () => {
            j.quitarMugre(m);
            this.basuraEnMano++;
            // Si lo siguiente también es basura, la recoge antes de ir a la caneca
            const sig = this.tareas[0];
            if (sig && sig.tipo === 'mugre' && sig.mugre.tipo === 'basura') return this.terminar();
            this.botarBasura();
          });
        } else {
          // Productos caídos: se recogen y vuelven a su vitrina
          this.hacer(RECOGER.caidos, 'reponer', () => {
            j.quitarMugre(m);
            const v = m.vitrina;
            if (!v) return this.terminar();
            this.ir(nav, v.frente(), () => {
              this.mirarA(v.centro());
              this.hacer(0.8, 'reponer', () => {
                v.ponerStock(v.stock + (m.unidades ?? 1));
                j.alReponer(v);
                this.terminar();
              });
            });
          });
        }
      });
    } else if (t.tipo === 'canasta') {
      const c = t.canasta;
      this.ir(nav, c.pos, () => {
        if (!j.canastasSueltas.includes(c)) return this.terminar();
        this.hacer(RECOGER.canasta, 'reponer', () => {
          j.quitarCanasta(c);
          this.ir(nav, j.tienda.puestoCanastas, () => {
            this.hacer(0.4, 'reponer', () => {
              j.canastas++;
              sonido.limpio();
              this.terminar();
            });
          });
        });
      });
    } else {
      this.repensar = 0;
    }
  }

  private botarBasura() {
    const j = this.juego;
    const caneca = j.tienda.canecaCercana(this.pos);
    this.ir(j.tienda.nav, caneca, () => {
      this.mirarA(caneca);
      this.hacer(RECOGER.botar, 'reponer', () => {
        this.basuraEnMano = 0;
        sonido.limpio();
        this.terminar();
      });
    });
  }

  update(dt: number) {
    this.velocidad = VELOCIDAD_EL[this.mejoras.zapatos ?? 0] * (this.juego.cafeActivo ? 1.4 : 1);
    super.update(dt);
    if (this.accion > 0) {
      this.accion -= dt;
      if (this.accion <= 0) {
        const cb = this.alTerminarAccion;
        this.alTerminarAccion = null;
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
      } else if (distancia(this.pos, o.pos) < 0.9) {
        o.alcanzado();
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
        this.cobrando = false;
        this.cobrosSeguidos = 0;
        this.carrito.visible = true;
        this.terminar();
        return;
      }
      if (primero && primero.listoParaPagar) {
        this.esperaCaja = 0;
        this.cobroEn += dt;
        this.pose('cobrar');
        if (this.cobroEn >= j.tienda.caja.tiempoCobro(primero.unidades)) {
          this.cobroEn = 0;
          j.cobrar(primero);
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
          this.cobrando = false;
          this.cobrosSeguidos = 0;
          this.carrito.visible = true;
          this.terminar();
        }
      }
      return;
    }
    if (!this.actual && !this.moviendo && this.tareas.length) this.empezar(this.tareas.shift()!);
    else if (!this.actual && !this.moviendo && this.basuraEnMano) this.botarBasura(); // quedó basura en la mano
  }

  /** Posiciones donde dibujar los números de la fila de acciones. */
  objetivo(t: Tarea): P {
    if (t.tipo === 'reponer') return t.vitrina.centro();
    if (t.tipo === 'caja') return this.juego.tienda.caja.vitrina.centro();
    if (t.tipo === 'mugre') return t.mugre.pos;
    if (t.tipo === 'canasta') return t.canasta.pos;
    return t.objetivo.pos;
  }

  get estaCobrando() {
    return this.cobrando;
  }
}

export const cajaDeSeccion = (s: string) => CAJA_SECCION[s] ?? 'caja abarrotes';
