// Ayudantes que se contratan en la tienda de mejoras: cajera, reponedor, aseo y guardia.
// Cada uno trabaja solo, un poco más lento que Él, y no toma lo que Él (o Ella) ya tiene en su fila.
import * as THREE from 'three';
import { AYUDANTE, CAPACITACION, CARGA_BODEGA, LAVAR, RECOGER, REPONER, TRAPERO } from './balance';
import type { Juego } from './juego';
import { P } from './navegacion';
import { Personaje } from './personaje';
import type { Mugre, Perseguible } from './problemas';
import { cargar, copia, Productos } from './recursos';
import { Vitrina } from './tienda';

export type TipoAyudante = 'cajera' | 'reponedor' | 'aseo' | 'guardia';
const distancia = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);

export class Ayudante extends Personaje {
  ocupado = false;
  private accion = 0;
  private alTerminar: (() => void) | null = null;
  private repensar = 0;
  private persiguiendo: Perseguible | null = null;
  /** Vitrina que el reponedor va a llenar (para que Él no vaya a la misma). */
  vitrina: Vitrina | null = null;
  private cobroEn = 0;
  private carrito: THREE.Group | null = null;
  private huecos: THREE.Object3D[] = [];
  /** Manchas en el trapero del aseo (también lo lava en el balde cuando se llena). */
  private trapero = 0;

  constructor(public tipo: TipoAyudante, pos: P, escala: number, private juego: Juego, public numCaja = 0) {
    super(pos, escala);
    this.velocidad = (tipo === 'guardia' ? 2.5 : AYUDANTE.velocidad) * this.capacitacion;
  }

  /** Cuánto más rápido trabaja por la capacitación del equipo. */
  private get capacitacion() {
    return CAPACITACION[Math.min(2, this.juego.mejoras.capacitacion ?? 0)];
  }
  private get miCaja() {
    return this.juego.tienda.cajas[this.numCaja] ?? this.juego.tienda.caja;
  }

  async preparar(productos: Productos) {
    await this.cargarPoses(this.tipo);
    if (this.tipo === 'reponedor') {
      this.poseCaminar = ['carrito_a', 'carrito_b'];
      this.poseQuieto = 'carrito_a';
      const modelo = copia(await cargar('carrito_1.glb'));
      modelo.traverse((o) => {
        if (o.userData?.producto) this.huecos.push(o);
      });
      for (const h of this.huecos) {
        const pr = productos.crear(h.userData.producto);
        if (pr) h.add(pr);
        h.visible = false;
      }
      this.carrito = new THREE.Group();
      this.carrito.add(modelo);
      const k = this.escala;
      this.carrito.position.set(0.1 * k, 0, 0.65 * k);
      this.carrito.scale.setScalar(1.3 * k);
      this.grupo.add(this.carrito);
    }
    this.quieto();
  }

  /** La cajera cobra sola: Él queda libre para reponer. */
  get cobrando() {
    return this.tipo === 'cajera' && !this.moviendo;
  }

  empezar() {
    const j = this.juego;
    if (this.tipo === 'cajera') {
      const caja = this.miCaja;
      this.ir(j.tienda.nav, caja.puestoCajero(), () => {
        this.mirarA(caja.puestoFila(0));
        this.pose('cobrar');
      });
    } else if (this.tipo === 'guardia') {
      this.ir(j.tienda.nav, j.tienda.puestoGuardia, () => this.mirarA(j.tienda.entrada));
    }
  }

  private hacer(s: number, pose: string, luego: () => void) {
    this.accion = (s * AYUDANTE.lentitud) / this.capacitacion;
    this.pose(pose);
    this.alTerminar = luego;
  }

  private libre() {
    this.ocupado = false;
    this.vitrina = null;
    this.quieto();
  }

  update(dt: number) {
    super.update(dt);
    if (this.accion > 0) {
      this.accion -= dt;
      if (this.accion <= 0) {
        const cb = this.alTerminar;
        this.alTerminar = null;
        cb?.();
      }
      return;
    }
    if (this.tipo === 'cajera') return this.cajera(dt);
    if (this.tipo === 'guardia') return this.guardia(dt);
    if (this.ocupado || this.moviendo) return;
    if (this.tipo === 'reponedor') this.buscarVitrina();
    else this.buscarMugre();
  }

  private cajera(dt: number) {
    if (this.moviendo) return;
    const j = this.juego;
    const primero = (j.filas[this.numCaja] ?? [])[0];
    if (primero && primero.listoParaPagar) {
      this.pose('cobrar');
      this.cobroEn += dt;
      if (this.cobroEn >= (this.miCaja.tiempoCobro(primero.unidades) * AYUDANTE.lentitudCajera) / this.capacitacion) {
        this.cobroEn = 0;
        j.cobrar(primero);
      }
    } else {
      this.cobroEn = 0;
      this.quieto('reposo');
    }
  }

  private guardia(dt: number) {
    const j = this.juego;
    if (this.persiguiendo && !this.persiguiendo.activo) this.persiguiendo = null;
    if (!this.persiguiendo) {
      this.persiguiendo = j.perseguibles().find((o) => o.visible && o.activo) ?? null;
      if (!this.persiguiendo) {
        if (!this.moviendo && distancia(this.pos, j.tienda.puestoGuardia) > 0.3) this.ir(j.tienda.nav, j.tienda.puestoGuardia, () => this.mirarA(j.tienda.entrada));
        return;
      }
    }
    const o = this.persiguiendo;
    if (distancia(this.pos, o.pos) < 0.9) {
      o.alcanzado();
      this.persiguiendo = null;
      return;
    }
    this.repensar -= dt;
    if (this.repensar <= 0 || !this.moviendo) {
      this.repensar = 0.3;
      this.ir(j.tienda.nav, o.pos);
    }
  }

  private buscarVitrina() {
    const j = this.juego;
    const otras = j.ayudantes.filter((a) => a !== this && a.vitrina).map((a) => a.vitrina);
    const candidatas = j.tienda.enVenta
      .filter((v) => v.fraccion <= AYUDANTE.umbralReponedor && !v.tumbada && !j.vaAReponer(v) && !otras.includes(v))
      .sort((a, b) => a.fraccion - b.fraccion);
    const v = candidatas[0];
    if (!v) return;
    this.ocupado = true;
    this.vitrina = v;
    this.ir(j.tienda.nav, j.tienda.bodega, () => {
      this.hacer((CARGA_BODEGA.base + CARGA_BODEGA.porUnidad * v.capacidad) * CARGA_BODEGA.mejora[j.mejoras.bodega ?? 0], 'reponer', () => {
        if (this.huecos[0]) this.huecos[0].visible = true;
        this.ir(j.tienda.nav, v.frente(), () => {
          this.mirarA(v.centro());
          if (v.stock >= v.capacidad) {
            if (this.huecos[0]) this.huecos[0].visible = false;
            return this.libre();
          }
          this.hacer(REPONER.base * REPONER.mejora[j.mejoras.alacena ?? 0], 'reponer', () => {
            v.ponerStock(v.capacidad);
            if (this.huecos[0]) this.huecos[0].visible = false;
            j.alReponer(v);
            this.libre();
          });
        });
      });
    });
  }

  private buscarMugre() {
    const j = this.juego;
    const libres = j.mugres.filter((m) => !m.reservado).sort((a, b) => distancia(this.pos, a.pos) - distancia(this.pos, b.pos));
    const m: Mugre | undefined = libres[0];
    if (m) {
      this.ocupado = true;
      m.reservado = 'aseo';
      this.ir(j.tienda.nav, m.pos, () => {
        if (!j.mugres.includes(m)) return this.libre();
        const trapea = m.tipo === 'charco' || m.tipo === 'sucio';
        const t = trapea ? RECOGER.trapear : m.tipo === 'basura' ? RECOGER.basura : RECOGER.caidos;
        this.hacer(t, 'reponer', () => {
          j.quitarMugre(m);
          if (trapea && ++this.trapero >= TRAPERO[Math.min(2, j.mejoras.trapero ?? 0)]) {
            // Trapero lleno: a lavarlo en el balde
            this.ir(j.tienda.nav, j.tienda.puestoLavado, () =>
              this.hacer(LAVAR, 'reponer', () => {
                this.trapero = 0;
                this.libre();
              }),
            );
          } else if (m.tipo === 'basura') {
            const c = j.tienda.canecaCercana(this.pos);
            this.ir(j.tienda.nav, c, () => this.hacer(RECOGER.botar, 'reponer', () => this.libre()));
          } else if (m.tipo === 'caidos' && m.vitrina) {
            const v = m.vitrina;
            this.ir(j.tienda.nav, v.frente(), () =>
              this.hacer(0.6, 'reponer', () => {
                v.ponerStock(v.stock + (m.unidades ?? 1));
                j.alReponer(v);
                this.libre();
              }),
            );
          } else this.libre();
        });
      });
    }
  }
}
