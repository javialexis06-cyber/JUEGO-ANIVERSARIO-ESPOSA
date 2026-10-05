// Una partida en marcha: la expedición, la simulación a paso fijo (30 por segundo), el dibujo a 30 cuadros, el
// mando, las elecciones (en solitario el juego espera; en grupo sigue y quien escoge queda protegido un momento),
// la pausa, el paso entre etapas y la Forja. La red (anfitrión e invitados) se engancha con `RedPartida`.
import * as fondo from '../segundo_plano';
import { BIOMAS } from './datos/mundo';
import { botEscoger, botPaso } from './bot';
import { Expedicion } from './expedicion';
import { Sucesos } from './sim/estado';
import { escoger, vetar, volverATirar } from './sim/opciones';
import type { Sim } from './sim/sim';
import type { ConfigExpedicion, PerfilJugador } from './tipos';
import type { Escena3D, EstadoVista } from './vista/escena';
import { Hud } from './ui/hud';
import { VistaEleccion } from './ui/eleccion';
import type { Mando } from './ui/mando';

export const DT = 1 / 30;

export interface OpcionesPartida {
  cfg: ConfigExpedicion;
  perfiles: PerfilJugador[];
  local: number;
  escena: Escena3D;
  mando: Mando;
  /** Jugadores que maneja el bot (pruebas, o el local con ?bot). */
  bots?: number[];
  /** Acelerar (pruebas). */
  rapido?: number;
  nombre: (i: number) => string;
  /** Entre etapas: muestra la Forja y llama `seguir` cuando todos están listos. */
  alForja: (p: Partida, seguir: () => void) => void;
  /** Terminó la expedición (ganada o perdida). */
  alTerminar: (p: Partida) => void;
  alPausa: (p: Partida) => void;
  /** Gancho para la red (anfitrión): cada paso de la simulación. */
  alPaso?: (sim: Sim, suc: Sucesos) => void;
  /** La etapa quedó armada (la red avisa a los invitados). */
  alEtapa?: (p: Partida, sim: Sim) => void;
  /** Terminó una etapa (antes de la Forja o del final). */
  alFinEtapa?: (p: Partida) => void;
  /** Gancho para el tutorial. */
  alCuadro?: (p: Partida, dt: number) => void;
  /** Sonidos de los sucesos. */
  alSucesos?: (suc: Sucesos, sim: Sim) => void;
}

export class Partida {
  exp: Expedicion;
  sim: Sim | null = null;
  hud: Hud;
  eleccion = new VistaEleccion();
  private acum = new Sucesos(8192);
  private acc = 0;
  private bucle: { detener(): void } | null = null;
  pausado = false;
  /** Pausa por otra razón (globo del tutorial, corte de red). */
  pausaExterna = false;
  private finT = 0;
  private ultimoDibujo = 0;
  private eligiendoT = 0;
  private vista: EstadoVista | null = null;
  terminada = false;
  /** Tiempos de la última simulación (para las pruebas de rendimiento). */
  msSim = 0;

  constructor(public o: OpcionesPartida) {
    this.exp = new Expedicion(o.cfg, o.perfiles);
    this.hud = new Hud(o.escena);
    this.hud.nombre = o.nombre;
    this.hud.alHabilidad = () => o.mando.pedirHabilidad();
    this.hud.alPausa = () => o.alPausa(this);
    o.mando.alNumero = (n) => {
      if (this.eleccion.abierta) this.eleccion.tecla(n);
    };
    o.escena.local = o.local;
  }

  get local() {
    return this.sim?.J[this.o.local] ?? null;
  }

  async empezar() {
    await this.etapaNueva();
  }

  private async etapaNueva() {
    const sim = this.exp.iniciarEtapa();
    this.sim = sim;
    const bioma = BIOMAS[this.o.cfg.bioma];
    const precarga = [...new Set(bioma.enemigos.map((e) => e.id))];
    await this.o.escena.prepararEtapa(sim.mapa, bioma, this.o.perfiles.map((p, i) => ({ i, cuerpo: p.cuerpo, clase: p.clase, piel: p.piel, pelo: p.pelo })), precarga);
    const v = Object.create(sim) as EstadoVista;
    (v as { suc: Sucesos }).suc = this.acum;
    this.vista = v;
    this.hud.construir(sim.J[this.o.local], this.o.local);
    this.o.mando.mostrarZona(true);
    this.o.mando.activo = true;
    this.finT = 0;
    this.acc = 0;
    this.o.alEtapa?.(this, sim);
    this.arrancar();
  }

  private arrancar() {
    this.bucle?.detener();
    this.ultimoDibujo = 0;
    this.bucle = fondo.cuadros((dt, ahora) => this.cuadro(dt, ahora));
  }

  detener() {
    this.bucle?.detener();
    this.bucle = null;
  }

  pausar(si: boolean) {
    this.pausado = si;
    this.o.mando.activo = !si;
    if (si) this.o.mando.soltar();
    this.hud.tenue(si);
  }

  private cuadro(dt: number, ahora: number) {
    const sim = this.sim;
    if (!sim || this.terminada) return;
    // 30 cuadros por segundo (el celular no se calienta); en pausa, 8 (casi nada se mueve)
    const minimo = this.pausado || this.pausaExterna ? 120 : 30;
    if (this.ultimoDibujo && ahora - this.ultimoDibujo < minimo) return;
    const dtReal = this.ultimoDibujo ? Math.min(0.1, (ahora - this.ultimoDibujo) / 1000) : DT;
    this.ultimoDibujo = ahora;
    const t0 = performance.now();
    const rapido = this.o.rapido ?? 1;
    const solo = this.o.perfiles.length === 1;
    const j = sim.J[this.o.local];
    // Elecciones
    const bots = this.o.bots ?? [];
    for (const b of bots) if (sim.J[b]?.cola.length) botEscoger(sim, sim.J[b]);
    const eligiendo = !!j && j.cola.length > 0 && !bots.includes(this.o.local);
    if (eligiendo) this.mostrarEleccion(sim, dtReal, solo);
    else if (this.eleccion.abierta) {
      this.eleccion.cerrar();
      this.eligiendoT = 0;
    }
    const quieto = this.pausado || this.pausaExterna || (solo && eligiendo);
    if (!quieto && !sim.fin) {
      // Mando del jugador local (o el bot)
      if (j) {
        if (bots.includes(this.o.local)) botPaso(sim, j);
        else {
          j.mx = this.o.mando.mx;
          j.my = this.o.mando.my;
          if (this.o.mando.tomarHabilidad()) j.pideHabilidad = true;
        }
        // En grupo, mientras escoge: protegido y quieto
        if (eligiendo && !solo) {
          j.invul = Math.max(j.invul, 0.15);
          j.mx = j.my = 0;
        }
      }
      for (const b of bots) if (b !== this.o.local && sim.J[b]) botPaso(sim, sim.J[b]);
      this.acc += dtReal * rapido;
      let pasos = 0;
      while (this.acc >= DT && pasos < 3 * rapido) {
        sim.paso(DT);
        this.copiarSucesos(sim.suc);
        this.o.alPaso?.(sim, sim.suc);
        this.acc -= DT;
        pasos++;
      }
      if (this.acc > DT * 3) this.acc = 0;
    } else this.o.mando.tomarHabilidad();
    this.msSim = performance.now() - t0;
    // Dibujo
    this.o.alCuadro?.(this, dtReal);
    if (this.acum.n) this.o.alSucesos?.(this.acum, sim);
    this.o.escena.actualizar(quieto ? 0 : dtReal, this.vista!);
    this.hud.procesar(this.acum);
    this.hud.actualizar(dtReal, sim);
    this.acum.limpiar();
    this.o.escena.dibujar();
    this.o.escena.medir(performance.now() - t0, dtReal);
    // Fin de la etapa
    if (sim.fin && !this.terminada) {
      this.finT += dtReal;
      if (this.finT > (sim.fin.exito ? 1.6 : 2.4)) this.terminarEtapa();
    }
  }

  private copiarSucesos(s: Sucesos) {
    const n = Math.min(s.n, (this.acum.d.length / 7) - this.acum.n);
    if (n <= 0) return;
    this.acum.d.set(s.d.subarray(0, n * 7), this.acum.n * 7);
    this.acum.n += n;
  }

  private mostrarEleccion(sim: Sim, dt: number, solo: boolean) {
    const j = sim.J[this.o.local];
    const e = j.cola[0];
    if (!solo) {
      this.eligiendoT += dt;
      // En grupo hay 12 s; después se escoge solo la primera
      if (this.eligiendoT > 12) {
        escoger(sim, j, 0);
        this.eligiendoT = 0;
        return;
      }
    }
    this.o.mando.soltar();
    this.eleccion.mostrar(e, {
      tiradas: j.tiradas,
      vetos: j.vetos,
      tiempo: solo ? null : 12 - this.eligiendoT,
      alEscoger: (k) => {
        escoger(sim, j, k);
        this.eligiendoT = 0;
        if (!j.cola.length) this.eleccion.cerrar();
      },
      alTirar: () => volverATirar(sim, j),
      alVetar: (k) => vetar(sim, j, k),
    });
  }

  private terminarEtapa() {
    const sim = this.sim!;
    this.detener();
    this.eleccion.cerrar();
    this.exp.terminarEtapa();
    this.o.alFinEtapa?.(this);
    this.o.mando.mostrarZona(false);
    if (this.exp.fase === 'forja') {
      this.hud.esconder();
      this.o.alForja(this, () => {
        void this.etapaNueva();
      });
    } else {
      this.terminada = true;
      this.hud.esconder();
      this.o.alTerminar(this);
    }
    void sim;
  }

  liberar() {
    this.detener();
    this.eleccion.cerrar();
    this.hud.esconder();
    this.hud.liberar();
  }
}
