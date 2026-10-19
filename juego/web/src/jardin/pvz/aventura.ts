// Una partida de la aventura: une el motor, la vista, la interfaz, el sonido, la historia y el guardado.
// Flujo de un nivel, como en PvZ: radio de Rosa (al empezar un mundo) → Dave habla → la cámara va a la calle y se
// eligen las semillas → vuelve → «¡Preparados… listos… a plantar!» → partida → premio (sobre, nota u objeto) →
// Dave presenta la planta → nota de los zombis → siguiente nivel.
import { cargarArteBlender, cargarFondoBlender } from './arte/blender';
import { centroFila, PIE_ZOMBI } from './arte/geometria';
import { nivelPorId, NIVELES, siguienteNivel } from './datos/niveles';
import { defPlanta } from './datos/plantas';
import type { Guardado } from './guardado';
import { escenaDe, intermedioTras, INTERMEDIO_ACTO2, INTERMEDIO_ACTO3, FINAL, PROLOGO } from './historia/guion';
import { crearBot } from './motor/bot';
import { MotorPvZ } from './motor/motor';
import { DT } from './motor/reglas';
import { sonido, type Efecto, type Musica } from './sonido';
import type { DefNivel, Evento } from './tipos';
import { mostrarDialogo, mostrarNota, mostrarRadio } from './ui/dialogo';
import { HudPvZ, type Herramienta } from './ui/hud';
import { elegirSemillas, menuPausa, mensaje, pantallaDerrota, pantallaPremio } from './ui/pantallas';
import { arteDelNivel, VistaPvZ } from './vista/escena';

export interface ContextoPartida {
  raiz: HTMLElement;
  guardado: Guardado;
  /** Modo de prueba: el piloto juega solo (?bot). */
  bot: boolean;
  /** Pasos extra por cuadro en el modo de prueba (?rapido). */
  rapido: number;
  /** Semilla fija (?semilla) para pruebas. */
  semilla: number | null;
  alSalir(destino: 'mapa' | 'titulo', mundo?: number): void;
}

const MUSICA_AREA: Record<string, Musica> = {
  dia: 'dia', noche: 'noche', piscina: 'piscina', niebla: 'niebla', tejado: 'tejado', rio: 'piscina', vias: 'dia', desierto: 'dia',
  paramo: 'niebla', invernadero: 'jefe',
};

const SONIDO_EVENTO: Partial<Record<Evento['t'], Efecto>> = {
  siembra: 'siembra', disparo: 'disparo', muerde: 'mordida', pierdeCabeza: 'cabeza', explosion: 'explosion', cortacesped: 'cortacesped',
  oleadaEnorme: 'sirena', ultimaOleada: 'ultima', recogeSol: 'sol', recogeMoneda: 'moneda', recogeAbono: 'recogeAbono', abono: 'abono',
  traga: 'traga', arma: 'arma', pala: 'pala', rebote: 'rebote',
};

/** Plantas que el jugador puede elegir en este nivel. */
function plantasDelNivel(g: Guardado, nivel: DefNivel, primeraVez: boolean): string[] {
  if (primeraVez) return [...nivel.plantasDisponibles];
  // Al repetir se pueden usar todas las ganadas (en el orden de la aventura).
  const orden = new Map<string, number>();
  NIVELES.forEach((n, i) => { for (const p of n.plantasDisponibles) if (!orden.has(p)) orden.set(p, i); });
  return g.progreso.plantas.filter((p) => defPlanta(p) && !defPlanta(p)!.soloMinijuego).sort((a, b) => (orden.get(a) ?? 999) - (orden.get(b) ?? 999));
}

export class Partida {
  private readonly caja: HTMLElement;
  private readonly vista: VistaPvZ;
  private readonly hud: HudPvZ;
  private m: MotorPvZ | null = null;
  private nivel!: DefNivel;
  private raf = 0;
  private t0 = performance.now();
  private reloj = 0;
  private acumulado = 0;
  private pausa = false;
  private velocidad = 1;
  private bot: ((m: MotorPvZ) => void) | null = null;
  private menu: HTMLElement | null = null;
  private terminado = false;
  private finVisto = false;
  private premioTomado = false;
  private premioT = 0;
  private arrastre: { x: number; y: number; desdeSobre: boolean } | null = null;
  private ultimoMazo: string[] = [];
  private destruida = false;

  constructor(private readonly ctx: ContextoPartida) {
    this.caja = document.createElement('div');
    this.caja.className = 'pvz-partida';
    ctx.raiz.append(this.caja);
    this.vista = new VistaPvZ(this.caja);
    this.hud = new HudPvZ(this.caja, {
      alElegir: (h) => this.alElegir(h),
      alMenu: () => this.abrirMenu(),
    });
    const lienzo = this.vista.lienzo;
    lienzo.addEventListener('pointerdown', this.alTocar);
    lienzo.addEventListener('pointermove', this.alMover);
    lienzo.addEventListener('pointerleave', () => { this.vista.fantasma = null; this.vista.resaltada = null; });
    document.addEventListener('pointerup', this.alSoltar);
    document.addEventListener('visibilitychange', this.alOcultar);
    window.addEventListener('keydown', this.alTecla);
    this.raf = requestAnimationFrame(this.cuadro);
  }

  // --------------------------------------------------------------------------------------------------------------
  // Flujo del nivel

  async jugar(id: string, repetir = false): Promise<void> {
    const nivel = nivelPorId(id);
    if (!nivel) {
      this.ctx.alSalir('mapa');
      return;
    }
    this.nivel = nivel;
    const g = this.ctx.guardado;
    const primeraVez = !g.progreso.completados.includes(id);
    const escena = escenaDe(id);
    const disponibles = plantasDelNivel(g, nivel, primeraVez);
    const ranuras = Math.max(nivel.ranuras, g.progreso.ranuras);
    const cintaPlantas = nivel.cinta?.plantas.map((p) => p.tipo) ?? [];
    this.terminado = false;
    this.finVisto = false;
    this.premioTomado = false;
    this.pausa = false;
    this.m = null;
    this.vista.previos = [];
    this.vista.filasActivas = [...nivel.filasActivas];
    sonido.ponerMusica('seleccion');
    await Promise.all([cargarArteBlender(), cargarFondoBlender(nivel.filasActivas)]);
    await this.vista.cargar(arteDelNivel([...disponibles, ...cintaPlantas], nivel.zombis));
    if (this.destruida) return;

    // Historia antes de jugar (solo la primera vez; al repetir no se cuenta otra vez).
    const contar = primeraVez && !repetir && !this.ctx.bot;
    if (contar && id === NIVELES[0].id && !g.visto('prologo')) {
      await mostrarDialogo(this.caja, PROLOGO);
      g.marcarVisto('prologo');
    }
    if (contar && escena.radio?.length && !g.visto('radio:' + id)) {
      await mostrarRadio(this.caja, escena.radio);
      g.marcarVisto('radio:' + id);
    }
    if (contar && escena.antes?.length && !g.visto('antes:' + id)) {
      await mostrarDialogo(this.caja, escena.antes);
      g.marcarVisto('antes:' + id);
    }
    if (this.destruida) return;

    // La calle: se ven los zombis que vienen y, si hay más plantas que ranuras, se eligen las semillas.
    this.vista.previos = this.zombisDeMuestra(nivel);
    this.vista.moverCamara(this.vista.xCalle());
    let mazo = disponibles.slice(0, ranuras);
    if (!nivel.cinta && disponibles.length > ranuras) {
      mazo = this.ctx.bot ? disponibles.slice(0, ranuras) : await elegirSemillas(this.caja, nivel, disponibles, ranuras, this.ultimoMazo);
    } else await esperar(this.ctx.bot ? 50 : 1400);
    if (this.destruida) return;
    this.ultimoMazo = mazo;
    this.vista.previos = [];
    this.vista.moverCamara(this.vista.xJuego());

    const semilla = this.ctx.semilla ?? (Math.floor(Math.random() * 1e9) >>> 0) + 1;
    const m = new MotorPvZ(nivel, { semilla, mazo, ranuras, repeticion: !primeraVez });
    this.m = m;
    this.vista.montar(m);
    this.hud.montar(m, `Nivel ${nivel.id}`);
    this.vista.fijarMargen(this.hud.anchoBanco());
    this.bot = this.ctx.bot ? crearBot() : null;
    this.actualizarDestinoSol();
    await esperar(this.ctx.bot ? 30 : 700);
    if (this.destruida) return;

    // 1-5: antes de los bolos hay que arrancar las plantas de Dave con la pala.
    if (nivel.palearAntes && m.plantas.length && !this.bot) {
      this.hud.mostrarAviso('Arranca con la pala las plantas de Dave', 'consejo', 600);
      this.hud.elegir({ tipo: 'pala' });
      await new Promise<void>((listo) => {
        const mirar = () => (this.destruida || !m.plantas.some((p) => p.vida > 0) ? listo() : void window.setTimeout(mirar, 120));
        mirar();
      });
      this.hud.elegir(null);
    }
    if (!this.bot) await this.preparadosListos();
    if (this.destruida) return;
    if (m.estado === 'intro') m.comenzar();
    sonido.ponerMusica(MUSICA_AREA[nivel.area] ?? 'dia');
    if (nivel.esperaPlantas && !this.bot) this.hud.mostrarAviso('Toca el sobre y luego una casilla del césped', 'consejo', 6);
    else if (nivel.cinta && nivel.minijuego === 'bolera') this.hud.mostrarAviso('¡A jugar a los bolos! Pon las nueces antes de la línea roja', 'consejo', 4);
  }

  private zombisDeMuestra(nivel: DefNivel) {
    const tipos = nivel.zombis.filter((z) => z !== 'abanderado' || nivel.zombis.length === 1);
    const filas = nivel.filasActivas;
    const n = Math.min(9, 3 + tipos.length * 2);
    return Array.from({ length: n }, (_, i) => {
      const tipo = tipos[i % tipos.length] ?? 'zombi';
      const f = filas[i % filas.length] ?? 2;
      return { tipo, x: 830 + ((i * 97) % 300), y: centroFila(f, nivel.filas) + PIE_ZOMBI - 10 + ((i * 37) % 30), semilla: i * 13 + 1 };
    }).sort((a, b) => a.y - b.y);
  }

  private async preparadosListos(): Promise<void> {
    this.hud.mostrarAviso('¡Preparados...', 'listos', 0.8);
    sonido.efecto('listos');
    await esperar(750);
    this.hud.mostrarAviso('¡Listos...', 'listos', 0.8);
    sonido.efecto('listos');
    await esperar(750);
    this.hud.mostrarAviso('¡A PLANTAR!', 'plantar', 1.1);
    sonido.efecto('plantar');
    await esperar(350);
  }

  // --------------------------------------------------------------------------------------------------------------
  // Bucle

  private cuadro = (ahora: number): void => {
    if (this.destruida) return;
    const dt = Math.min(0.1, (ahora - this.t0) / 1000);
    this.t0 = ahora;
    const m = this.m;
    if (!this.pausa) this.reloj += dt;
    if (m && !this.pausa && m.estado === 'jugando') {
      this.acumulado += dt * this.velocidad * (this.bot ? this.ctx.rapido : 1);
      let n = 0;
      while (this.acumulado >= DT && n < 600) {
        this.bot?.(m);
        if (m.paso()) this.procesar(m, m.eventos);
        this.acumulado -= DT;
        n++;
        if (m.estado !== 'jugando') break;
      }
    } else if (m && this.bot && m.estado === 'intro') {
      this.bot(m);
    }
    if (m && (m.estado === 'gano' || m.estado === 'perdio') && !this.finVisto) this.alTerminar(m);
    if (m && m.estado === 'gano' && !this.premioTomado && (this.bot || this.reloj - this.premioT > 12)) void this.tomarPremio();
    this.vista.avanzar(dt, m, this.pausa);
    this.vista.dibujar(m, this.reloj);
    if (m) this.hud.actualizar(m);
    this.raf = requestAnimationFrame(this.cuadro);
  };

  private procesar(m: MotorPvZ, eventos: readonly Evento[]): void {
    this.vista.procesar(m, eventos);
    for (const e of eventos) {
      const s = SONIDO_EVENTO[e.t];
      if (s) sonido.efecto(s);
      if (e.t === 'impacto') sonido.efecto(e.metal ? 'metal' : 'impacto');
      if (e.t === 'oleadaEnorme') this.hud.mostrarAviso('¡Se acerca una oleada enorme de zombis!', 'rojo', 4);
      else if (e.t === 'ultimaOleada') this.hud.mostrarAviso('¡ÚLTIMA OLEADA!', 'rojo grande', 3);
    }
  }

  private alTerminar(m: MotorPvZ): void {
    this.finVisto = true;
    this.hud.elegir(null);
    if (m.estado === 'gano') {
      sonido.ponerMusica(null);
      sonido.efecto('gana');
      this.premioT = this.reloj;
      if (!this.bot) this.hud.mostrarAviso(m.premio?.tipo === 'nota' ? '¡Toca la nota!' : '¡Toca el premio!', 'consejo', 12);
    } else {
      void this.perder();
    }
  }

  private async perder(): Promise<void> {
    sonido.ponerMusica(null);
    sonido.efecto('pierde');
    await esperar(this.bot ? 50 : 1600);
    if (this.destruida) return;
    const r = await pantallaDerrota(this.caja);
    if (this.destruida) return;
    if (r === 'reintentar') void this.jugar(this.nivel.id, true);
    else this.ctx.alSalir('mapa', this.nivel.mundo);
  }

  /** Toca el sobre (o la nota) que soltó el último zombi: se guarda y sigue la historia. */
  private async tomarPremio(): Promise<void> {
    const m = this.m;
    if (!m || this.premioTomado || m.estado !== 'gano') return;
    this.premioTomado = true;
    const g = this.ctx.guardado;
    const nivel = this.nivel;
    const id = nivel.id;
    const primeraVez = !g.progreso.completados.includes(id);
    const p = g.progreso;
    if (!p.completados.includes(id)) p.completados.push(id);
    const premio = nivel.premio;
    if (primeraVez && premio?.planta && !p.plantas.includes(premio.planta)) p.plantas.push(premio.planta);
    if (primeraVez && premio?.objeto) {
      const objetos = premio.objeto === 'pala-y-abono' ? ['pala', 'abono'] : [premio.objeto];
      for (const o of objetos) if (!p.objetos.includes(o)) p.objetos.push(o);
    }
    p.dinero = Math.min(999990, p.dinero + m.dinero);
    await this.guardarConReintento();
    if (this.destruida) return;
    m.premio = null;
    const escena = escenaDe(id);
    const contar = primeraVez && !this.ctx.bot;
    if (primeraVez && (premio?.planta || premio?.objeto) && !this.ctx.bot) await pantallaPremio(this.caja, premio);
    if (contar && escena.despues?.length) await mostrarDialogo(this.caja, escena.despues);
    if (contar && escena.nota) await mostrarNota(this.caja, escena.nota);
    const inter = intermedioTras(id);
    if (contar && inter) {
      const lineas = inter === 'acto2' ? INTERMEDIO_ACTO2 : inter === 'acto3' ? INTERMEDIO_ACTO3 : FINAL;
      await mostrarDialogo(this.caja, lineas);
    }
    if (this.destruida) return;
    const sig = siguienteNivel(id);
    if (sig && primeraVez) void this.jugar(sig.id);
    else this.ctx.alSalir('mapa', sig?.mundo ?? nivel.mundo);
  }

  private async guardarConReintento(): Promise<void> {
    const g = this.ctx.guardado;
    while (!g.guardar() && !this.destruida) {
      const r = await mensaje(this.caja, 'No se pudo guardar', 'El progreso de este nivel sigue aquí. Libera espacio o revisa el navegador y vuelve a intentarlo.', [{ texto: 'Reintentar', valor: 'otra' }]);
      void r;
    }
  }

  // --------------------------------------------------------------------------------------------------------------
  // Entrada

  private alElegir(h: Herramienta | null): void {
    sonido.desbloquear();
    if (h) sonido.efecto('sobre');
    this.vista.fantasma = null;
    this.vista.resaltada = null;
    if (h) this.arrastre = { x: -1, y: -1, desdeSobre: true };
  }

  private punto(e: PointerEvent): { x: number; y: number } {
    const r = this.vista.lienzo.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private alTocar = (e: PointerEvent): void => {
    sonido.desbloquear();
    const m = this.m;
    if (!m || this.pausa) return;
    const q = this.punto(e);
    this.arrastre = null;
    // Primero lo que se recoge (soles, monedas, abono, premio), como en PvZ.
    const r = this.vista.recogibleEn(m, q.x, q.y);
    if (r === 'premio') {
      void this.tomarPremio();
      return;
    }
    if (r) {
      m.recoger(r.id);
      return;
    }
    this.usarHerramienta(m, q.x, q.y);
  };

  private alMover = (e: PointerEvent): void => {
    const m = this.m;
    if (!m) return;
    const q = this.punto(e);
    if (this.ctx.guardado.progreso.ajustes.recogerAlPasar && !this.pausa) {
      const r = this.vista.recogibleEn(m, q.x, q.y);
      if (r && r !== 'premio') m.recoger(r.id);
    }
    const h = this.hud.herramienta;
    const c = this.vista.casilla(q.x, q.y);
    this.vista.fantasma = null;
    this.vista.resaltada = null;
    if (!h || !c) return;
    if (h.tipo === 'sobre') {
      this.vista.fantasma = { tipo: h.planta, fila: c.fila, col: c.col, valido: m.puedeSembrar(h.planta, c.fila, c.col).ok };
    } else if (h.tipo === 'cinta') {
      const d = defPlanta(h.planta);
      this.vista.fantasma = { tipo: h.planta, fila: c.fila, col: c.col, valido: !!d && m.estado === 'jugando' && m.validarCasilla(d, c.fila, c.col).ok };
    } else if (m.plantaEn(c.fila, c.col)) {
      this.vista.resaltada = { fila: c.fila, col: c.col, color: h.tipo === 'pala' ? '#ff5a4a' : '#7dff5a' };
    }
  };

  /** Soltar después de arrastrar un sobre hasta el césped (como en PvZ 2). */
  private alSoltar = (e: PointerEvent): void => {
    const m = this.m;
    if (!m || !this.arrastre?.desdeSobre || this.pausa) return;
    this.arrastre = null;
    const r = this.vista.lienzo.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
    if (document.elementFromPoint(e.clientX, e.clientY) !== this.vista.lienzo) return;
    const q = this.punto(e);
    if (this.vista.casilla(q.x, q.y)) this.usarHerramienta(m, q.x, q.y);
  };

  private usarHerramienta(m: MotorPvZ, px: number, py: number): void {
    const h = this.hud.herramienta;
    const c = this.vista.casilla(px, py);
    if (!h || !c) return;
    let ok = false;
    if (h.tipo === 'sobre') ok = m.sembrar(h.planta, c.fila, c.col).ok;
    else if (h.tipo === 'cinta') ok = m.sembrarCinta(h.item, c.fila, c.col).ok;
    else if (h.tipo === 'pala') ok = m.palear(c.fila, c.col).ok;
    else if (h.tipo === 'abono') ok = m.usarAbono(c.fila, c.col).ok;
    if (ok) {
      this.hud.elegir(null);
      this.vista.fantasma = null;
      this.vista.resaltada = null;
      // Los eventos de las órdenes llegan con el siguiente paso; en la intro (pala del 1-5) se oyen de una vez.
      if (m.estado === 'intro') sonido.efecto('pala');
    } else sonido.efecto('error');
  }

  private alTecla = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (this.menu) this.cerrarMenu();
      else if (this.hud.herramienta) this.hud.elegir(null);
      else this.abrirMenu();
    }
  };

  private alOcultar = (): void => {
    if (document.hidden) {
      if (this.m?.estado === 'jugando' && !this.menu) this.abrirMenu();
      sonido.suspender();
    } else sonido.reanudar();
  };

  private actualizarDestinoSol(): void {
    const s = this.hud.posicionSol();
    const r = this.vista.lienzo.getBoundingClientRect();
    this.vista.destinoSol = { x: s.x - r.left, y: s.y - r.top };
  }

  // --------------------------------------------------------------------------------------------------------------
  // Menú de pausa

  private abrirMenu(): void {
    if (this.menu || !this.m) return;
    this.pausa = true;
    const g = this.ctx.guardado.progreso.ajustes;
    this.menu = menuPausa(this.caja, {
      velocidad: this.velocidad, efectos: g.efectos, musica: g.musica,
      alElegir: (a) => {
        if (a === 'seguir') this.cerrarMenu();
        else if (a === 'velocidad') {
          this.velocidad = this.velocidad === 1 ? 2 : 1;
          this.refrescarMenu();
        } else if (a === 'efectos') {
          g.efectos = !g.efectos;
          sonido.efectos = g.efectos;
          this.ctx.guardado.guardar();
          this.refrescarMenu();
        } else if (a === 'musica') {
          g.musica = !g.musica;
          sonido.alternarMusica(g.musica);
          this.ctx.guardado.guardar();
          this.refrescarMenu();
        } else if (a === 'reiniciar') {
          this.cerrarMenu();
          void this.jugar(this.nivel.id, true);
        } else if (a === 'mapa') {
          this.cerrarMenu();
          this.ctx.alSalir('mapa', this.nivel.mundo);
        }
      },
    });
  }

  private refrescarMenu(): void {
    this.menu?.remove();
    this.menu = null;
    this.abrirMenu();
  }

  private cerrarMenu(): void {
    this.menu?.remove();
    this.menu = null;
    this.pausa = false;
    this.t0 = performance.now();
  }

  // --------------------------------------------------------------------------------------------------------------
  // Pruebas y salida

  /** Para las pruebas de navegador: avanza `n` pasos (con el piloto si está activo). */
  avanzar(n: number): void {
    const m = this.m;
    if (!m) return;
    for (let i = 0; i < n && (m.estado === 'jugando' || m.estado === 'intro'); i++) {
      this.bot?.(m);
      if (m.paso()) this.procesar(m, m.eventos);
    }
  }

  get motor(): MotorPvZ | null {
    return this.m;
  }

  /** Para las pruebas de navegador (coordenadas de pantalla de una casilla). */
  get escena(): VistaPvZ {
    return this.vista;
  }

  get enPausa(): boolean {
    return this.pausa;
  }

  destruir(): void {
    this.destruida = true;
    cancelAnimationFrame(this.raf);
    document.removeEventListener('pointerup', this.alSoltar);
    document.removeEventListener('visibilitychange', this.alOcultar);
    window.removeEventListener('keydown', this.alTecla);
    this.hud.destruir();
    this.vista.destruir();
    this.caja.remove();
  }
}

function esperar(ms: number): Promise<void> {
  return new Promise((r) => window.setTimeout(r, ms));
}
