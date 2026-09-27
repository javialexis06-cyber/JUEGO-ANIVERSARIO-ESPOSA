// Clientes: entran, recorren su lista, esperan si falta producto, hacen fila, pagan y se van.
import * as THREE from 'three';
import type { Juego } from './juego';
import { P } from './navegacion';
import { Personaje } from './personaje';
import { cargar, copia } from './recursos';
import { PRECIO, Vitrina } from './tienda';

export type TipoCliente = 'abuelita' | 'mama' | 'adolescente';
export const TIPOS: Record<TipoCliente, { velocidad: number; paciencia: number; basura: number }> = {
  abuelita: { velocidad: 0.85, paciencia: 70, basura: 0 },
  mama: { velocidad: 1.1, paciencia: 55, basura: 0 },
  adolescente: { velocidad: 1.4, paciencia: 45, basura: 0.55 },
};

type Estado = 'entrando' | 'buscando' | 'tomando' | 'esperando' | 'afila' | 'enfila' | 'saliendo' | 'fuera';
let siguienteId = 1;

export class Cliente extends Personaje {
  id = siguienteId++;
  estado: Estado = 'entrando';
  lista: { vitrina: Vitrina; producto: string }[] = [];
  paso = 0;
  gasto = 0;
  paciencia = 1;
  enojado = false;
  private pacienciaMax: number;
  private accion = 0;
  private inicioFila = 0;
  private dejoBasura = false;
  private lugarFila = -1;

  constructor(public tipo: TipoCliente, pos: P, escala: number, multPaciencia: number, private juego: Juego) {
    super(pos, escala);
    this.velocidad = TIPOS[tipo].velocidad;
    this.pacienciaMax = TIPOS[tipo].paciencia * multPaciencia;
  }

  async preparar() {
    await this.cargarPoses(this.tipo);
    const canasta = copia(await cargar('canasta.glb'));
    canasta.scale.setScalar(0.9);
    canasta.position.set(-0.55, 0.62, 0.05);
    canasta.rotation.y = Math.PI / 2;
    this.cuerpo.add(canasta);
  }

  /** Lo que busca ahora (para el globo). */
  get deseo(): string | null {
    return this.estado === 'buscando' || this.estado === 'esperando' || this.estado === 'tomando' || this.estado === 'entrando'
      ? this.lista[this.paso]?.producto ?? null
      : null;
  }
  get listoParaPagar() {
    return this.estado === 'enfila' && this.juego.fila[0] === this && !this.moviendo;
  }

  empezar() {
    const j = this.juego;
    this.estado = 'entrando';
    this.ir(j.tienda.nav, { x: j.tienda.entrada.x + 0.6, y: j.tienda.entrada.y }, () => this.siguiente());
  }

  private siguiente() {
    const j = this.juego;
    if (this.paso >= this.lista.length) return this.aLaFila();
    const item = this.lista[this.paso];
    this.estado = 'buscando';
    const f = item.vitrina.frente();
    const jitter = { x: f.x + (Math.random() - 0.5) * 0.5, y: f.y + (Math.random() - 0.5) * 0.2 };
    this.ir(j.tienda.nav, jitter, () => this.enVitrina());
  }

  private enVitrina() {
    const item = this.lista[this.paso];
    this.mirarA(item.vitrina.centro());
    if (item.vitrina.stock > 0) {
      this.estado = 'tomando';
      this.accion = 0.8;
      this.pose('tomar');
    } else {
      this.estado = 'esperando';
      this.quieto();
    }
  }

  private aLaFila() {
    const j = this.juego;
    if (this.gasto === 0) return this.salir(false);
    this.estado = 'afila';
    j.fila.push(this);
    this.inicioFila = j.tiempo;
    this.moverEnFila();
  }

  /** Se acomoda en su puesto de la fila (se llama cuando la fila avanza). */
  moverEnFila() {
    const j = this.juego;
    const k = j.fila.indexOf(this);
    if (k < 0 || k === this.lugarFila) return;
    this.lugarFila = k;
    this.ir(j.tienda.nav, j.tienda.caja.puestoFila(k), () => {
      this.estado = 'enfila';
      this.mirarA(j.tienda.caja.vitrina.centro());
      this.quieto();
    });
  }

  /** Le cobraron: paga, deja propina según su paciencia y se va. */
  pagar(): { monto: number; propina: number; espera: number; feliz: boolean } {
    const propina = this.paciencia >= 0.66 ? 3 : this.paciencia >= 0.33 ? 1 : 0;
    const r = { monto: this.gasto, propina, espera: this.juego.tiempo - this.inicioFila, feliz: this.paciencia >= 0.66 };
    this.salir(false);
    return r;
  }

  salir(enojado: boolean) {
    const j = this.juego;
    this.enojado = enojado;
    const k = j.fila.indexOf(this);
    if (k >= 0) {
      j.fila.splice(k, 1);
      j.fila.forEach((c) => c.moverEnFila());
    }
    this.estado = 'saliendo';
    this.ir(j.tienda.nav, { x: j.tienda.entrada.x - 0.2, y: j.tienda.entrada.y }, () => {
      this.ruta = [{ x: j.tienda.entrada.x - 1.2, y: j.tienda.entrada.y }];
      this.alLlegar = () => (this.estado = 'fuera');
    });
  }

  update(dt: number) {
    super.update(dt);
    if (this.estado === 'fuera' || this.estado === 'saliendo') return;
    const j = this.juego;
    // Paciencia: baja rápido esperando producto o en la fila, lento caminando
    const ritmo = this.estado === 'esperando' ? 1 : this.estado === 'enfila' || this.estado === 'afila' ? 0.8 : 0.2;
    this.paciencia -= (dt * ritmo) / this.pacienciaMax;
    if (this.paciencia <= 0) {
      this.paciencia = 0;
      j.clientePerdido(this);
      this.salir(true);
      return;
    }
    if (this.estado === 'tomando') {
      this.accion -= dt;
      if (this.accion <= 0) {
        const item = this.lista[this.paso];
        if (item.vitrina.stock > 0) {
          item.vitrina.ponerStock(item.vitrina.stock - 1);
          this.gasto += PRECIO[item.vitrina.seccion] ?? 5;
          this.paso++;
          this.soltarBasura();
          this.siguiente();
        } else {
          this.estado = 'esperando';
          this.quieto();
        }
      }
    } else if (this.estado === 'esperando') {
      const item = this.lista[this.paso];
      if (item.vitrina.stock > 0) this.enVitrina();
    }
  }

  private soltarBasura() {
    const prob = TIPOS[this.tipo].basura * (this.juego.problemas.includes('basura') ? 1 : 0);
    if (!this.dejoBasura && Math.random() < prob) {
      this.dejoBasura = true;
      this.juego.nuevaBasura({ x: this.pos.x + 0.3, y: this.pos.y - 0.2 });
    }
  }

  get visible() {
    return this.estado !== 'fuera';
  }
}

export function quitarDelMundo(c: Cliente, escena: THREE.Scene) {
  escena.remove(c.grupo);
}
