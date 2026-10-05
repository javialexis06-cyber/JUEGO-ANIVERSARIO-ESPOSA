// La partida de un invitado: no simula; arma cada etapa igual que el anfitrión (misma semilla), la dibuja con lo que
// llega en las fotos, mueve a su propio personaje sin esperar y le manda al anfitrión dónde está, su joystick, la
// habilidad y las cartas que escoge. Entre etapas hace su Forja aquí mismo y manda cómo quedó.
import * as fondo from '../../segundo_plano';
import { BIOMAS } from '../datos/mundo';
import { Expedicion } from '../expedicion';
import type { Sala } from '../../salas/tipos';
import type { ConfigExpedicion, Eleccion, PerfilJugador } from '../tipos';
import type { Escena3D } from '../vista/escena';
import { Hud } from '../ui/hud';
import { VistaEleccion } from '../ui/eleccion';
import type { Mando } from '../ui/mando';
import { Espejo } from './espejo';
import { MSJ, aplicarJugador, serializarJugador, type DatosJugador, type Foto } from './protocolo';
import type { FinEtapa } from '../sim/sim';
import type { IdObjetivo } from '../tipos';

export interface OpcionesInvitado {
  sala: Sala;
  cfg: ConfigExpedicion;
  perfiles: PerfilJugador[];
  local: number;
  escena: Escena3D;
  mando: Mando;
  nombre: (i: number) => string;
  alForja: (p: PartidaInvitado, seguir: () => void) => void;
  alTerminar: (p: PartidaInvitado) => void;
  alPausa: (p: PartidaInvitado) => void;
  alSucesos?: (p: PartidaInvitado) => void;
  alCarga: (si: boolean, texto?: string) => void;
}

export class PartidaInvitado {
  exp: Expedicion;
  espejo: Espejo | null = null;
  hud: Hud;
  eleccion = new VistaEleccion();
  terminada = false;
  pausado = false;
  pausaExterna = false;
  private bucle: { detener(): void } | null = null;
  private ultimoDibujo = 0;
  private mandoT = 0;
  private habCuenta = 0;
  private quitar: (() => void)[] = [];
  private pendiente: { e: Eleccion | null; tiradas: number; vetos: number; t: number; llego: number } | null = null;
  private armando = false;
  /** Fotos que llegaron mientras se armaba la etapa. */
  private fotoGuardada: Foto | null = null;
  readonly esInvitado = true;
  msSim = 0;

  constructor(public o: OpcionesInvitado) {
    this.exp = new Expedicion(o.cfg, o.perfiles);
    this.hud = new Hud(o.escena);
    this.hud.nombre = o.nombre;
    this.hud.alHabilidad = () => o.mando.pedirHabilidad();
    this.hud.alPausa = () => o.alPausa(this);
    o.mando.alNumero = (n) => {
      if (this.eleccion.abierta) this.eleccion.tecla(n);
    };
    o.escena.local = o.local;
    const s = o.sala;
    this.quitar.push(
      s.al(MSJ.FOTO, (d) => {
        const f = d as Foto;
        if (this.armando || !this.espejo) this.fotoGuardada = f;
        else this.espejo.aplicar(f);
      }),
      s.al(MSJ.CELDAS, (d) => {
        const x = d as { etapa: number; c: number[] };
        if (this.espejo && x.etapa === this.exp.etapa) this.espejo.celdas(x.c);
      }),
      s.al(MSJ.DETALLE, (d) => {
        const x = d as { etapa: number; J: DatosJugador[] };
        if (this.espejo && x.etapa === this.exp.etapa && !this.armando) this.espejo.detalle(x.J);
      }),
      s.al(MSJ.ELECCION, (d) => {
        const x = d as { e: Eleccion | null; n: number; tiradas: number; vetos: number; t: number };
        this.pendiente = { ...x, llego: performance.now() };
        if (!x.e) this.eleccion.cerrar();
      }),
      s.al(MSJ.ETAPA, (d) => void this.etapa((d as { etapa: number }).etapa)),
      s.al(MSJ.FIN_ETAPA, (d) => this.finEtapa(d as DatosFin)),
    );
  }

  get local() {
    return this.espejo?.sim.J[this.o.local] ?? null;
  }
  get sim() {
    return this.espejo?.sim ?? null;
  }

  /** El anfitrión arrancó la etapa `n`: se arma igual. */
  private async etapa(n: number) {
    if (this.terminada) return;
    while (this.exp.etapa < n) {
      this.armando = true;
      this.o.alCarga(true, `Etapa ${n}…`);
      const sim = this.exp.iniciarEtapa();
      this.espejo?.liberar();
      this.espejo = new Espejo(sim, this.o.local);
      for (const j of sim.J) j.remoto = true;
      const bioma = BIOMAS[this.o.cfg.bioma];
      await this.o.escena.prepararEtapa(sim.mapa, bioma, this.o.perfiles.map((p, i) => ({ i, cuerpo: p.cuerpo, clase: p.clase, piel: p.piel, pelo: p.pelo })), [...new Set(bioma.enemigos.map((e) => e.id))]);
      this.hud.construir(sim.J[this.o.local], this.o.local);
      this.armando = false;
      if (this.fotoGuardada) this.espejo.aplicar(this.fotoGuardada);
      this.fotoGuardada = null;
    }
    this.o.mando.mostrarZona(true);
    this.o.mando.activo = true;
    this.o.sala.mandar(MSJ.ETAPA_LISTA, { etapa: n });
    this.o.alCarga(false);
    this.arrancar();
  }

  private arrancar() {
    this.bucle?.detener();
    this.ultimoDibujo = 0;
    this.bucle = fondo.cuadros((_dt, ahora) => this.cuadro(ahora));
  }

  detener() {
    this.bucle?.detener();
    this.bucle = null;
  }

  pausar(si: boolean) {
    this.pausado = si;
    this.hud.tenue(si);
  }

  private cuadro(ahora: number) {
    const esp = this.espejo;
    if (!esp || this.terminada) return;
    if (this.ultimoDibujo && ahora - this.ultimoDibujo < (this.pausado ? 120 : 30)) return;
    const dt = this.ultimoDibujo ? Math.min(0.1, (ahora - this.ultimoDibujo) / 1000) : 1 / 30;
    this.ultimoDibujo = ahora;
    const t0 = performance.now();
    const m = this.o.mando;
    const eligiendo = !!this.pendiente?.e;
    const mx = eligiendo || this.pausado || this.pausaExterna ? 0 : m.mx, my = eligiendo || this.pausado || this.pausaExterna ? 0 : m.my;
    if (m.tomarHabilidad() && !eligiendo) this.habCuenta++;
    esp.avanzar(dt, mx, my);
    // Al anfitrión: dónde estoy y qué aprieto (15 veces por segundo)
    this.mandoT += dt;
    const j = esp.yo;
    if (this.mandoT >= 1 / 15 && j) {
      this.mandoT = 0;
      this.o.sala.mandar(MSJ.MANDO, [+j.x.toFixed(2), +j.y.toFixed(2), +j.vx.toFixed(2), +j.vy.toFixed(2), +j.fx.toFixed(2), +j.fy.toFixed(2), +mx.toFixed(2), +my.toFixed(2), this.habCuenta], { rapido: true });
    }
    // Cartas
    const p = this.pendiente;
    if (p?.e) {
      m.soltar();
      const queda = Math.max(0, p.t - (performance.now() - p.llego) / 1000);
      this.eleccion.mostrar(p.e, {
        tiradas: p.tiradas, vetos: p.vetos, tiempo: queda,
        alEscoger: (k) => this.mandarEleccion('escoger', k),
        alTirar: () => this.mandarEleccion('tirar', 0),
        alVetar: (k) => this.mandarEleccion('vetar', k),
      });
    } else if (this.eleccion.abierta) this.eleccion.cerrar();
    // Dibujo
    const sim = esp.sim;
    sim.suc = esp.sucOut;
    this.o.alSucesos?.(this);
    this.o.escena.actualizar(dt, sim);
    this.hud.procesar(esp.sucOut);
    this.hud.actualizar(dt, sim);
    esp.sucOut.limpiar();
    this.o.escena.dibujar();
    this.o.escena.medir(performance.now() - t0, dt);
  }

  private mandarEleccion(a: 'escoger' | 'tirar' | 'vetar', k: number) {
    this.o.sala.mandar(MSJ.ESCOGER, { a, k });
    // Se cierra ya (el anfitrión manda la siguiente si hay)
    if (a === 'escoger') {
      this.pendiente = null;
      this.eleccion.cerrar();
    }
  }

  private finEtapa(d: DatosFin) {
    if (this.terminada) return;
    this.detener();
    this.eleccion.cerrar();
    this.pendiente = null;
    this.o.mando.mostrarZona(false);
    this.hud.esconder();
    const exp = this.exp;
    d.J.forEach((x, i) => exp.J[i] && aplicarJugador(exp.J[i], x));
    exp.resultados = d.resultados;
    exp.tiempo = d.tiempo;
    exp.exito = d.exito;
    exp.fase = d.fase;
    if (d.fase === 'forja') {
      const j = exp.J[this.o.local];
      exp.forja.clear();
      exp.forja.set(j.i, { ofertas: exp.ofertasNuevas(j), renovaciones: 0, sangreUsada: {}, listo: false });
      this.o.alForja(this, () => {
        this.o.sala.mandar(MSJ.FORJA_LISTA, { etapa: exp.etapa, j: serializarJugador(j) });
        this.o.alCarga(true, 'Esperando a los demás…');
      });
    } else {
      this.terminada = true;
      this.o.alTerminar(this);
    }
  }

  liberar() {
    this.detener();
    for (const q of this.quitar) q();
    this.quitar = [];
    this.eleccion.cerrar();
    this.hud.esconder();
    this.hud.liberar();
    this.espejo?.liberar();
  }
}

export interface DatosFin {
  etapa: number;
  fase: 'etapa' | 'forja' | 'fin';
  exito: boolean;
  J: DatosJugador[];
  resultados: { etapa: number; fin: FinEtapa; objetivo: IdObjetivo; segundos: number }[];
  tiempo: number;
}
