// Clientes: toman canasta, recorren su lista, esperan si falta producto, hacen fila, pagan y se van.
// La paciencia baja más rápido esperando producto o en la fila (y más si nadie está cobrando); si se acaba, se va
// bravo desde donde esté (también desde la fila) con una pataleta, y cuenta como perdido.
import {
  ALIVIO_DECORACION, CANASTA_ABANDONO, CLIENTES, PRECIO, PROPINA, RESBALON, RITMO_PACIENCIA, TipoCliente,
} from './balance';
import type { Juego } from './juego';
import { P } from './navegacion';
import { Personaje } from './personaje';
import { cargar, copia } from './recursos';
import * as sonido from './sonido';
import { Vitrina } from './tienda';

export type { TipoCliente } from './balance';

type Estado = 'entrando' | 'sinCanasta' | 'buscando' | 'tomando' | 'esperando' | 'afila' | 'enfila' | 'saliendo' | 'fuera';
let siguienteId = 1;

export interface ItemLista {
  vitrina: Vitrina;
  producto: string;
  cantidad: number;
  tomadas: number;
}

export class Cliente extends Personaje {
  id = siguienteId++;
  estado: Estado = 'entrando';
  lista: ItemLista[] = [];
  paso = 0;
  gasto = 0;
  unidades = 0;
  paciencia = 1;
  enojado = false;
  /** Segundos que se queda quieto mirando al famoso o sobándose después de resbalar. */
  pausa = 0;
  /** Pataleta antes de irse bravo. */
  private berrinche = 0;
  private pacienciaMax: number;
  private accion = 0;
  private inicioFila = 0;
  private dejoBasura = false;
  private lugarFila = -1;
  /** En qué caja hace la fila. */
  private numCaja = 0;
  private get miFila() {
    return this.juego.filas[this.numCaja] ?? this.juego.filas[0];
  }
  private tieneCanasta = false;
  private canasta: import('three').Object3D | null = null;
  private charcosPisados = new Set<number>();

  constructor(public tipo: TipoCliente, pos: P, escala: number, multPaciencia: number, private juego: Juego) {
    super(pos, escala);
    this.velocidad = CLIENTES[tipo].velocidad;
    this.pacienciaMax = CLIENTES[tipo].paciencia * multPaciencia;
  }

  get datos() {
    return CLIENTES[this.tipo];
  }

  async preparar() {
    await this.cargarPoses(this.tipo);
    const canasta = copia(await cargar('canasta.glb'));
    canasta.scale.setScalar(0.9);
    canasta.position.set(-0.55, 0.62, 0.05);
    canasta.rotation.y = Math.PI / 2;
    canasta.visible = false;
    this.canasta = canasta;
    this.cuerpo.add(canasta);
  }

  /** Lo que busca ahora (para el globo). */
  get deseo(): string | null {
    return this.estado === 'buscando' || this.estado === 'esperando' || this.estado === 'tomando' || this.estado === 'entrando' || this.estado === 'sinCanasta'
      ? this.lista[this.paso]?.producto ?? null
      : null;
  }
  get cantidadDeseada() {
    const it = this.lista[this.paso];
    return it ? it.cantidad - it.tomadas : 0;
  }
  get listoParaPagar() {
    return this.estado === 'enfila' && this.miFila[0] === this && !this.moviendo;
  }
  get esperandoCanasta() {
    return this.estado === 'sinCanasta';
  }
  /** Carita según la paciencia: verde contento, amarillo impaciente, rojo a punto de irse. */
  get animo(): 'feliz' | 'medio' | 'bravo' {
    return this.paciencia >= 0.66 ? 'feliz' : this.paciencia >= 0.3 ? 'medio' : 'bravo';
  }

  empezar() {
    const j = this.juego;
    this.estado = 'entrando';
    this.ir(j.tienda.nav, { x: j.tienda.entrada.x + 0.6, y: j.tienda.entrada.y }, () => this.tomarCanasta());
  }

  /** Sin canasta no se compra: si el puesto está vacío, espera en la puerta. */
  private tomarCanasta() {
    const j = this.juego;
    if (j.canastas > 0) {
      j.canastas--;
      this.tieneCanasta = true;
      if (this.canasta) this.canasta.visible = true;
      this.siguiente();
    } else {
      this.estado = 'sinCanasta';
      this.quieto();
    }
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
      this.accion = 0.4;
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
    // La fila más corta (y si están iguales, donde ya estén cobrando)
    const puntaje = (i: number) => j.filas[i].length + (j.cobrandoEn(i) ? 0 : 0.5);
    this.numCaja = j.filas.reduce((mejor, _, i) => (puntaje(i) < puntaje(mejor) ? i : mejor), 0);
    this.miFila.push(this);
    this.inicioFila = j.tiempo;
    this.moverEnFila();
  }

  /** Se acomoda en su puesto de la fila (se llama cuando la fila avanza). */
  moverEnFila() {
    const j = this.juego;
    const k = this.miFila.indexOf(this);
    if (k < 0 || k === this.lugarFila) return;
    this.lugarFila = k;
    const caja = j.tienda.cajas[this.numCaja] ?? j.tienda.caja;
    this.ir(j.tienda.nav, caja.puestoFila(k), () => {
      this.estado = 'enfila';
      this.mirarA(caja.vitrina.centro());
      this.quieto();
    });
  }

  /** Le cobraron: paga, deja propina según su paciencia y se va. */
  pagar(): { monto: number; propina: number; espera: number; feliz: boolean } {
    const animo = this.paciencia >= 0.66 ? 2 : this.paciencia >= 0.33 ? 1 : 0;
    const propina = PROPINA[animo] + (animo === 2 ? this.datos.propinaExtra : 0) + (animo >= 1 ? this.juego.efectos.propina_extra ?? 0 : 0);
    const r = { monto: this.gasto, propina, espera: this.juego.tiempo - this.inicioFila, feliz: animo === 2 };
    this.salir(false);
    return r;
  }

  salir(enojado: boolean) {
    const j = this.juego;
    this.enojado = enojado;
    const fila = this.miFila;
    const k = fila.indexOf(this);
    if (k >= 0) {
      fila.splice(k, 1);
      fila.forEach((c) => c.moverEnFila());
    }
    // La canasta: vuelve al puesto, o queda tirada en el piso (sobre todo si sale bravo)
    if (this.tieneCanasta) {
      this.tieneCanasta = false;
      if (this.canasta) this.canasta.visible = false;
      const prob = enojado ? CANASTA_ABANDONO.enojado : CANASTA_ABANDONO.normal;
      if (Math.random() < prob && this.estado !== 'entrando') void j.canastaTirada({ ...this.pos });
      else j.canastas++;
    }
    if (enojado) sonido.enojo();
    this.estado = 'saliendo';
    this.ir(j.tienda.nav, { x: j.tienda.entrada.x - 0.2, y: j.tienda.entrada.y }, () => {
      this.ruta = [{ x: j.tienda.entrada.x - 1.2, y: j.tienda.entrada.y }];
      this.alLlegar = () => (this.estado = 'fuera');
    });
  }

  /** Ritmo de pérdida de paciencia en este momento. */
  private ritmo(): number {
    const j = this.juego;
    let r: number;
    if (this.estado === 'esperando') r = RITMO_PACIENCIA.esperandoProducto;
    else if (this.estado === 'sinCanasta') r = RITMO_PACIENCIA.esperandoCanasta;
    else if (this.estado === 'enfila' || this.estado === 'afila') {
      // El primero de la fila: si nadie cobra se enoja rápido; si ya lo están atendiendo, casi no
      if (this.miFila[0] === this) r = j.cobrandoEn(this.numCaja) ? RITMO_PACIENCIA.siendoAtendido : RITMO_PACIENCIA.filaSinCajero;
      else r = RITMO_PACIENCIA.enFila;
    }
    else r = RITMO_PACIENCIA.caminando;
    if (j.mugreCerca(this.pos, 2.2)) r += RITMO_PACIENCIA.cercaDeMugre;
    return r * Math.max(0.4, 1 - ALIVIO_DECORACION * j.adornos);
  }

  update(dt: number) {
    if (this.berrinche > 0) {
      // Pataleta: brinca bravo en su puesto antes de salir
      this.berrinche -= dt;
      super.update(0);
      const k = Math.max(0, this.berrinche);
      this.cuerpo.position.y = Math.abs(Math.sin(k * 16)) * 0.07;
      this.cuerpo.rotation.z = Math.sin(k * 30) * 0.08;
      return;
    }
    if (this.pausa > 0 && this.estado !== 'saliendo' && this.estado !== 'fuera') {
      // Quieto mirando al famoso (o sobándose): no camina ni pierde paciencia
      this.pausa -= dt;
      super.update(0);
      return;
    }
    super.update(dt);
    if (this.estado === 'fuera' || this.estado === 'saliendo') return;
    const j = this.juego;
    // Resbalones en charcos
    if (this.moviendo) {
      const charco = j.charcoEn(this.pos, 0.45);
      if (charco && !this.charcosPisados.has(charco.id)) {
        this.charcosPisados.add(charco.id);
        this.paciencia -= RESBALON;
        this.pausa = 0.6;
        j.resbalon(this);
      }
    }
    if (!j.pacienciaCongelada) this.paciencia -= (dt * this.ritmo()) / this.pacienciaMax;
    if (this.paciencia <= 0) {
      this.paciencia = 0;
      j.clientePerdido(this);
      this.salir(true);
      this.berrinche = 0.7;
      this.quieto();
      return;
    }
    if (this.estado === 'sinCanasta') {
      if (j.canastas > 0) this.tomarCanasta();
      return;
    }
    if (this.estado === 'tomando') {
      this.accion -= dt;
      if (this.accion <= 0) {
        const item = this.lista[this.paso];
        if (item.vitrina.stock > 0) {
          item.vitrina.ponerStock(item.vitrina.stock - 1);
          if (item.vitrina.stock === 0) j.vitrinaVacia(item.vitrina);
          item.tomadas++;
          this.unidades++;
          this.gasto += PRECIO[item.vitrina.seccion] ?? 5;
          if (item.tomadas >= item.cantidad) {
            this.paso++;
            this.soltarBasura();
            this.siguiente();
          } else this.accion = 0.35;
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
    const prob = Math.min(0.95, this.datos.basura * (this.juego.efectos.basura_x ?? 1)) * (this.juego.problemas.includes('basura') ? 1 : 0);
    if (!this.dejoBasura && Math.random() < prob) {
      this.dejoBasura = true;
      void this.juego.nuevaMugre('basura', { x: this.pos.x + 0.3, y: this.pos.y - 0.2 });
    }
  }
}
