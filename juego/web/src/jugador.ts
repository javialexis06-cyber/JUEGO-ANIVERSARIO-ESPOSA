// Él: fila de acciones por toques (reponer, cobrar, recoger basura) y el carrito de reposición.
import * as THREE from 'three';
import type { Juego } from './juego';
import { P } from './navegacion';
import { Personaje } from './personaje';
import { cargar, copia, Productos } from './recursos';
import { CAJA_SECCION, Vitrina } from './tienda';

export type Tarea =
  | { id: number; tipo: 'reponer'; vitrina: Vitrina }
  | { id: number; tipo: 'caja' }
  | { id: number; tipo: 'basura'; basura: { id: number; pos: P } };

/** Tarea sin id (Omit que se reparte sobre cada variante de la unión). */
export type NuevaTarea = Tarea extends infer T ? (T extends Tarea ? Omit<T, 'id'> : never) : never;

let siguienteId = 1;

export class Jugador extends Personaje {
  tareas: Tarea[] = [];
  actual: Tarea | null = null;
  cajas: string[] = [];
  capacidadCarrito = 5;
  private carrito = new THREE.Group();
  private huecosCarrito: THREE.Object3D[] = [];
  private accion = 0;
  private alTerminarAccion: (() => void) | null = null;
  private cobrando = false;
  private esperaCaja = 0;
  private cobroEn = 0;

  constructor(pos: P, escala: number, private juego: Juego) {
    super(pos, escala);
    this.velocidad = 2.1;
    this.poseCaminar = ['carrito_a', 'carrito_b'];
    this.poseQuieto = 'carrito_a';
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

  /** Agrega una acción a la fila. Devuelve false si ya estaba. */
  agregar(t: NuevaTarea): boolean {
    const igual = (x: Tarea) =>
      x.tipo === t.tipo &&
      (t.tipo !== 'reponer' || (x as any).vitrina === (t as any).vitrina) &&
      (t.tipo !== 'basura' || (x as any).basura === (t as any).basura);
    if ((this.actual && igual(this.actual)) || this.tareas.some(igual)) return false;
    this.tareas.push({ ...t, id: siguienteId++ } as Tarea);
    return true;
  }

  /** Todas las acciones pendientes, en orden (la actual primero). */
  get fila(): Tarea[] {
    return this.actual ? [this.actual, ...this.tareas] : [...this.tareas];
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
    if (t.tipo === 'reponer') {
      const v = t.vitrina;
      const irAVitrina = () =>
        this.ir(j.tienda.nav, v.frente(), () => {
          this.mirarA(v.centro());
          this.hacer(1.1, 'reponer', () => {
            v.ponerStock(v.capacidad);
            const i = this.cajas.indexOf(v.seccion);
            if (i >= 0) this.cajas.splice(i, 1);
            this.actualizarCarrito();
            j.alReponer(v);
            this.terminar();
          });
        });
      if (this.cajas.includes(v.seccion)) irAVitrina();
      else
        this.ir(j.tienda.nav, j.tienda.bodega, () => {
          this.mirarA({ x: j.tienda.bodega.x, y: j.tienda.bodega.y + 1 });
          this.hacer(0.8, 'reponer', () => {
            // Carga en un solo viaje las cajas de esta y de las siguientes reposiciones de la fila
            const pendientes = [v, ...this.tareas.filter((x) => x.tipo === 'reponer').map((x) => (x as any).vitrina as Vitrina)];
            this.cajas = [];
            for (const p of pendientes) if (this.cajas.length < this.capacidadCarrito) this.cajas.push(p.seccion);
            this.actualizarCarrito();
            irAVitrina();
          });
        });
    } else if (t.tipo === 'caja') {
      const caja = j.tienda.caja;
      this.ir(j.tienda.nav, caja.puestoCajero(), () => {
        this.mirarA(caja.puestoFila(0));
        this.cobrando = true;
        this.esperaCaja = 0;
        this.cobroEn = 0;
        this.carrito.visible = false;
        this.pose('cobrar');
      });
    } else {
      const b = t.basura;
      this.ir(j.tienda.nav, b.pos, () => {
        this.hacer(0.6, 'reponer', () => {
          j.recogerBasura(b.id);
          this.terminar();
        });
      });
    }
  }

  update(dt: number) {
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
    if (this.cobrando) {
      const j = this.juego;
      const primero = j.fila[0];
      if (primero && primero.listoParaPagar) {
        this.esperaCaja = 0;
        this.cobroEn += dt;
        this.pose('cobrar');
        if (this.cobroEn >= j.tienda.caja.tiempoCobro) {
          this.cobroEn = 0;
          j.cobrar(primero);
        }
      } else {
        this.esperaCaja += dt;
        // Si no hay nadie por cobrar un momento, o hay otras tareas esperando, se suelta la caja
        if ((!j.fila.length && this.esperaCaja > 1.2) || (this.tareas.length && !j.fila.length)) {
          this.cobrando = false;
          this.carrito.visible = true;
          this.terminar();
        }
      }
      return;
    }
    if (!this.actual && !this.moviendo && this.tareas.length) this.empezar(this.tareas.shift()!);
  }

  /** Posiciones donde dibujar los números de la fila de acciones. */
  objetivo(t: Tarea): P {
    if (t.tipo === 'reponer') return t.vitrina.centro();
    if (t.tipo === 'caja') return this.juego.tienda.caja.vitrina.centro();
    return t.basura.pos;
  }

  get estaCobrando() {
    return this.cobrando;
  }
}

export const cajaDeSeccion = (s: string) => CAJA_SECCION[s] ?? 'caja abarrotes';
