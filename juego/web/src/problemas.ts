// Problemas del día que caminan: el ladrón (roba y corre a la puerta) y la niña traviesa (tumba productos).
import * as THREE from 'three';
import { PRECIO, PROBLEMAS } from './balance';
import type { Juego } from './juego';
import { P } from './navegacion';
import { Personaje } from './personaje';
import * as sonido from './sonido';
import { Vitrina } from './tienda';

/** Basura, charcos, mugre (de un estante tumbado o un carrito regado) y productos caídos: todo lo que ensucia el piso. */
export interface Mugre {
  id: number;
  tipo: 'basura' | 'charco' | 'sucio' | 'caidos';
  pos: P;
  tiempo: number;
  obj: THREE.Object3D;
  /** Quién va en camino a limpiarla ('el', 'ella' o 'aseo'). */
  reservado?: string;
  vitrina?: Vitrina;
  unidades?: number;
  producto?: string;
}

export interface CanastaSuelta {
  id: number;
  pos: P;
  obj: THREE.Object3D;
  reservado?: string;
}

let siguienteId = 1;

/** Algo que se puede perseguir: Él o el guardia lo alcanzan y lo resuelven. */
export interface Perseguible {
  id: number;
  pos: P;
  activo: boolean;
  visible: boolean;
  reservado?: string;
  alcanzado(): void;
}

export class Ladron extends Personaje implements Perseguible {
  id = siguienteId++;
  estado: 'entrando' | 'robando' | 'huyendo' | 'atrapado' | 'saliendo' | 'fuera' = 'entrando';
  reservado?: string;
  private vitrina: Vitrina | null = null;
  private robadas = 0;
  private accion = 0;
  /** Se ve con su «!» desde que roba, o desde que entra si hay cámara. */
  visible = false;

  constructor(pos: P, escala: number, private juego: Juego, private camara: boolean) {
    super(pos, escala);
    this.velocidad = 1.5;
    this.visible = camara;
  }

  async preparar() {
    await this.cargarPoses('ladron');
  }

  get activo() {
    return this.estado === 'entrando' || this.estado === 'robando' || this.estado === 'huyendo';
  }

  empezar() {
    const j = this.juego;
    const opciones = j.tienda.enVenta.filter((v) => v.stock > 0);
    this.vitrina = opciones[Math.floor(Math.random() * opciones.length)] ?? j.tienda.enVenta[0] ?? null;
    if (!this.vitrina) return this.irse();
    this.ir(j.tienda.nav, this.vitrina.frente(), () => {
      this.estado = 'robando';
      this.mirarA(this.vitrina!.centro());
      this.pose('tomar');
      this.accion = 1.4;
    });
  }

  update(dt: number) {
    super.update(dt);
    if (this.estado === 'robando') {
      this.accion -= dt;
      if (this.accion <= 0 && this.vitrina) {
        this.robadas = Math.min(PROBLEMAS.ladronRoba, this.vitrina.stock);
        this.vitrina.ponerStock(this.vitrina.stock - this.robadas);
        if (this.vitrina.stock === 0) this.juego.vitrinaVacia(this.vitrina);
        this.visible = true;
        this.estado = 'huyendo';
        this.velocidad = PROBLEMAS.ladronVel * (this.camara ? 0.8 : 1);
        sonido.alarma();
        this.juego.avisar('¡Un ladrón! Tócalo antes de que salga');
        const e = this.juego.tienda.entrada;
        this.ir(this.juego.tienda.nav, { x: e.x - 0.2, y: e.y }, () => this.escapar());
      }
    }
  }

  private escapar() {
    if (this.estado !== 'huyendo') return;
    this.juego.robo(this.robadas * (PRECIO[this.vitrina?.seccion ?? ''] ?? 5));
    this.irse();
  }

  /** Él o el guardia lo alcanzaron: devuelve lo robado y se va. */
  alcanzado() {
    if (!this.activo) return;
    if (this.vitrina && this.robadas) this.vitrina.ponerStock(this.vitrina.stock + this.robadas);
    this.estado = 'atrapado';
    this.juego.ladronAtrapado(this);
    this.irse();
  }

  private irse() {
    const j = this.juego;
    if (this.estado !== 'atrapado') this.estado = 'saliendo';
    this.velocidad = 1.5;
    this.ir(j.tienda.nav, { x: j.tienda.entrada.x - 0.2, y: j.tienda.entrada.y }, () => {
      this.ruta = [{ x: j.tienda.entrada.x - 1.2, y: j.tienda.entrada.y }];
      this.alLlegar = () => (this.estado = 'fuera');
    });
  }
}

export class Nina extends Personaje implements Perseguible {
  id = siguienteId++;
  estado: 'entrando' | 'corriendo' | 'tumbando' | 'calmada' | 'saliendo' | 'fuera' = 'entrando';
  reservado?: string;
  visible = true;
  private tumbadas = 0;
  private accion = 0;
  private vitrina: Vitrina | null = null;

  constructor(pos: P, escala: number, private juego: Juego) {
    super(pos, escala);
    this.velocidad = PROBLEMAS.ninaVel;
  }

  async preparar() {
    await this.cargarPoses('nina');
  }

  get activo() {
    return this.estado === 'entrando' || this.estado === 'corriendo' || this.estado === 'tumbando';
  }

  empezar() {
    this.juego.avisar('¡Llegó la niña traviesa! Tócala para calmarla');
    this.aOtraVitrina();
  }

  private aOtraVitrina() {
    const j = this.juego;
    if (this.tumbadas >= PROBLEMAS.ninaVitrinas) return this.irse();
    const opciones = j.tienda.enVenta.filter((v) => v.stock > 0 && v !== this.vitrina);
    this.vitrina = opciones[Math.floor(Math.random() * opciones.length)] ?? null;
    if (!this.vitrina) return this.irse();
    this.estado = 'corriendo';
    this.ir(j.tienda.nav, this.vitrina.frente(), () => {
      this.estado = 'tumbando';
      this.mirarA(this.vitrina!.centro());
      this.pose('tomar');
      this.accion = 0.7;
    });
  }

  update(dt: number) {
    super.update(dt);
    if (this.estado === 'tumbando') {
      this.accion -= dt;
      if (this.accion <= 0 && this.vitrina) {
        const n = Math.min(PROBLEMAS.ninaTumba, this.vitrina.stock);
        if (n > 0) {
          this.vitrina.ponerStock(this.vitrina.stock - n);
          if (this.vitrina.stock === 0) this.juego.vitrinaVacia(this.vitrina);
          const f = this.vitrina.frente();
          void this.juego.nuevaMugre('caidos', { x: f.x + (Math.random() - 0.5) * 0.4, y: f.y - 0.25 }, this.vitrina, n);
          sonido.resbalon();
        }
        this.tumbadas++;
        this.aOtraVitrina();
      }
    }
  }

  alcanzado() {
    if (!this.activo) return;
    this.estado = 'calmada';
    this.juego.ninaCalmada(this);
    this.irse();
  }

  private irse() {
    const j = this.juego;
    if (this.estado !== 'calmada') this.estado = 'saliendo';
    this.velocidad = 1.35;
    this.ir(j.tienda.nav, { x: j.tienda.entrada.x - 0.2, y: j.tienda.entrada.y }, () => {
      this.ruta = [{ x: j.tienda.entrada.x - 1.2, y: j.tienda.entrada.y }];
      this.alLlegar = () => (this.estado = 'fuera');
    });
  }
}
