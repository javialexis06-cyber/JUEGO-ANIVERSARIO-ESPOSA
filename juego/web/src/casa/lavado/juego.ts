// «Lavarse la cara» de punta a punta: el menú, las partidas (solo, de anfitrión o de invitado en pareja), el bucle
// a 30 cuadros con paso fijo, los controles (arrastrar el dedo en cualquier parte o WASD/flechas), la pausa (sola
// si la app se va a segundo plano o si se corta la conexión), el final con el progreso guardado y lo que se le
// devuelve a la casa (higiene y monedas).
import { activar, alternar as alternarSonido, silenciado } from '../../sonido';
import { DISFRAZ } from './disfraces';
import { DURACION } from './escenarios';
import { ENEMIGOS } from './enemigos';
import { Dibujo } from './dibujo/dibujo';
import { cargarIconos } from './iconos';
import { Interfaz, type Acciones } from './interfaz';
import { CanalLavado, Espejo, aplicarInventario, inventarioDe, tomarFoto, type ConfigPartida, type MensajeLavado } from './linea';
import { Menu } from './menu';
import { Motor, VEL_JUGADOR, type OpcionesJugador } from './motor';
import { cartasDe, SECRETO_LOGRO, secretoAbierto, sumarPartida, type ProgresoLavado, type ResumenPartida } from './progreso';
import { musicaLavado, sonarEfecto } from './sonidos';
import { botPaso } from './bot';
import type { IdArma, IdPasiva, Rol } from './tipos';

export interface ResultadoLavado {
  /** Lo más que aguantó en las partidas de esta vez (segundos del reloj de la partida). */
  segundos: number;
  gano: boolean;
  eliminados: number;
  nivel: number;
  jefe: boolean;
  /** Monedas de la casa que se ganó (escasas: como mucho ~15 por partida larga). */
  monedas: number;
  partidas: number;
  progreso: ProgresoLavado;
}

export interface OpcionesLavado {
  rol: Rol;
  nombres: Record<Rol, string>;
  progreso: ProgresoLavado;
  guardar: (p: ProgresoLavado) => Promise<void>;
  /** Jugar en pareja: por dónde se habla y cómo se manda la invitación a la casa del otro. */
  pareja: null | { modo: 'local' | 'linea'; invitar: (id: string) => Promise<void> };
  /** Llegó por una invitación: el id de la partida del otro. */
  unirse?: string;
}

const PASO = 1 / 30;
const otro = (r: Rol): Rol => (r === 'el' ? 'ella' : 'el');
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();

/** Monedas de la casa por una partida: 1 cada 2 minutos, +3 si llegó a la Ducha Helada, máximo 15. */
export const monedasPorPartida = (segundos: number, gano: boolean) => Math.min(15, Math.floor(segundos / 120) + (gano ? 3 : 0));

/** Lo que el motor necesita de cada jugador según su progreso. */
export function opcionesJugador(rol: Rol, p: ProgresoLavado): OpcionesJugador {
  return {
    rol,
    disfraz: DISFRAZ[p.disfraz]?.rol === rol ? p.disfraz : rol === 'el' ? 'el_panda' : 'ella_pulga',
    poderes: { ...p.poderes },
    carta: p.carta || null,
    secretos: (Object.keys(SECRETO_LOGRO) as (IdArma | IdPasiva)[]).filter((id) => secretoAbierto(p, id)),
    cartas: cartasDe(p),
  };
}

export const lavado: { actual: Lavado | null } = { actual: null };

export function jugarLavado(o: OpcionesLavado): Promise<ResultadoLavado> {
  return new Promise((listo) => {
    const l = new Lavado(o, listo);
    lavado.actual = l;
    void l.correr();
  });
}

type Papel = 'solo' | 'anfitrion' | 'invitado';

export class Lavado {
  readonly raiz: HTMLElement;
  private lienzo: HTMLCanvasElement;
  private menu: Menu;
  private p: ProgresoLavado;
  private resultado: ResultadoLavado;
  /** La partida en curso (para las pruebas). */
  m: Motor | null = null;
  dib: Dibujo | null = null;
  ui: Interfaz | null = null;
  private canal: CanalLavado | null = null;
  /** Las pruebas pueden poner el bot a jugar. */
  bot = params.has('botlavado');

  constructor(private o: OpcionesLavado, private listo: (r: ResultadoLavado) => void) {
    this.p = structuredClone(o.progreso);
    this.resultado = { segundos: 0, gano: false, eliminados: 0, nivel: 0, jefe: false, monedas: 0, partidas: 0, progreso: this.p };
    this.raiz = document.createElement('section');
    this.raiz.className = 'lv';
    this.raiz.innerHTML = '<canvas class="lv-lienzo"></canvas>';
    this.lienzo = this.raiz.querySelector('canvas')!;
    document.body.append(this.raiz);
    this.menu = new Menu(this.raiz, {
      rol: o.rol,
      nombre: o.nombres[o.rol],
      nombreOtro: o.nombres[otro(o.rol)],
      progreso: this.p,
      guardar: (p) => o.guardar(p),
      puedePareja: !!o.pareja,
    });
    requestAnimationFrame(() => this.raiz.classList.add('visible'));
  }

  async correr() {
    await cargarIconos();
    activar();
    musicaLavado.iniciar();
    try {
      if (this.o.unirse && this.o.pareja) await this.comoInvitado(this.o.unirse);
      for (;;) {
        const a = await this.menu.abrir();
        if (a === 'salir') break;
        this.menu.cerrar();
        if (a === 'jugar') await this.partidaSola();
        else if (a === 'pareja') await this.comoAnfitrion();
      }
    } catch (e) {
      console.error(e);
    }
    this.cerrar();
  }

  private cerrar() {
    musicaLavado.detener();
    this.canal?.cerrar();
    this.canal = null;
    this.raiz.classList.remove('visible');
    setTimeout(() => this.raiz.remove(), 650);
    lavado.actual = null;
    this.resultado.progreso = this.p;
    this.listo(this.resultado);
  }

  // ------------------------------------------------------------------------------------------------- Solo
  private async partidaSola() {
    for (;;) {
      const config: ConfigPartida = {
        escenario: this.p.escenario,
        apurado: this.p.apurado,
        semilla: (Math.random() * 1e9) >>> 0,
        jugadores: [opcionesJugador(this.o.rol, this.p)],
      };
      const r = await this.partida(config, 'solo', 0);
      if (r !== 'otra') return;
    }
  }

  // ------------------------------------------------------------------------------------------------- Pareja
  private async conectar(): Promise<CanalLavado | null> {
    if (!this.o.pareja) return null;
    this.canal?.cerrar();
    const c = new CanalLavado(this.o.rol, this.o.pareja.modo);
    if (!(await c.conectar())) {
      this.aviso(c.error || 'No se pudo conectar.');
      return null;
    }
    this.canal = c;
    return c;
  }

  /** Una capa de espera (con botón para cancelar). Devuelve una función para cerrarla. */
  private espera(titulo: string, texto: string, alCancelar: () => void) {
    const capa = document.createElement('div');
    capa.className = 'lv-capa';
    capa.style.zIndex = '5';
    capa.innerHTML = `<div class="lv-espera"><h2>${titulo}<span class="puntos"></span></h2><p>${texto}</p><button class="lv-boton">Cancelar</button></div>`;
    capa.querySelector('button')!.addEventListener('click', alCancelar);
    this.raiz.append(capa);
    return { cerrar: () => capa.remove(), texto: (t: string) => (capa.querySelector('p')!.textContent = t) };
  }

  private aviso(texto: string) {
    const capa = document.createElement('div');
    capa.className = 'lv-capa';
    capa.style.zIndex = '6';
    capa.innerHTML = `<div class="lv-espera"><h2>${texto}</h2><button class="lv-boton">Listo</button></div>`;
    capa.querySelector('button')!.addEventListener('click', () => capa.remove());
    this.raiz.append(capa);
  }

  private async comoAnfitrion() {
    const c = await this.conectar();
    if (!c || !this.o.pareja) return;
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const ella = this.o.nombres[otro(this.o.rol)];
    let cancelado = false;
    const e = this.espera(`Esperando a ${ella}`, `Le llegó la invitación a la casa: cuando se mire al espejo, entra a tu cara.`, () => {
      cancelado = true;
      c.mandar({ t: 'cancelar', id });
    });
    void this.o.pareja.invitar(id).catch(() => undefined);
    const repetir = window.setInterval(() => c.mandar({ t: 'inv', id, de: this.o.rol }), 3000);
    c.mandar({ t: 'inv', id, de: this.o.rol });
    const invitado = await new Promise<OpcionesJugador | null>((ok) => {
      const limite = setTimeout(() => ok(null), 5 * 60_000);
      c.alMensaje = (m) => {
        if (m.t === 'unirse' && m.id === id) {
          clearTimeout(limite);
          ok(m.jugador);
        }
      };
      const mirar = window.setInterval(() => {
        if (cancelado) {
          clearInterval(mirar);
          clearTimeout(limite);
          ok(null);
        }
      }, 200);
    });
    clearInterval(repetir);
    e.cerrar();
    if (!invitado) return;
    if (invitado.rol === this.o.rol) invitado.rol = otro(this.o.rol);
    for (;;) {
      const config: ConfigPartida = {
        escenario: this.p.escenario,
        apurado: this.p.apurado,
        semilla: (Math.random() * 1e9) >>> 0,
        jugadores: [opcionesJugador(this.o.rol, this.p), invitado],
      };
      const r = await this.partida(config, 'anfitrion', 0, id);
      if (r !== 'otra') break;
      // Otra lavada juntos: se le avisa y se espera que diga que sí (vuelve a mandar «unirse»)
      const e2 = this.espera(`Esperando a ${ella}`, '¿Otra lavada juntos?', () => (cancelado = true));
      const sigue = await new Promise<boolean>((ok) => {
        const lim = setTimeout(() => ok(false), 90_000);
        c.alMensaje = (m) => {
          if (m.t === 'unirse' && m.id === id) {
            clearTimeout(lim);
            ok(true);
          }
          if (m.t === 'salir') ok(false);
        };
        const mirar = window.setInterval(() => {
          if (cancelado) {
            clearInterval(mirar);
            ok(false);
          }
        }, 200);
      });
      e2.cerrar();
      if (!sigue) break;
    }
    c.mandar({ t: 'salir', id, de: this.o.rol });
  }

  private async comoInvitado(id: string) {
    const c = await this.conectar();
    if (!c) return;
    const el = this.o.nombres[otro(this.o.rol)];
    for (;;) {
      // Primero escoge su disfraz (el menú, con «¡A lavarse!» para decir que está lista)
      const a = await this.menu.abrir();
      this.menu.cerrar();
      if (a === 'salir') {
        c.mandar({ t: 'salir', id, de: this.o.rol });
        return;
      }
      let cancelado = false;
      const e = this.espera(`Entrando a la cara de ${el}`, 'Un momentico…', () => (cancelado = true));
      const yo = opcionesJugador(this.o.rol, this.p);
      const config = await new Promise<ConfigPartida | null>((ok) => {
        const repetir = window.setInterval(() => c.mandar({ t: 'unirse', id, jugador: yo }), 1500);
        c.mandar({ t: 'unirse', id, jugador: yo });
        const limite = setTimeout(() => {
          clearInterval(repetir);
          ok(null);
        }, 45_000);
        c.alMensaje = (m) => {
          if (m.t === 'empezar' && m.id === id) {
            clearInterval(repetir);
            clearTimeout(limite);
            ok(m.config);
          }
          if ((m.t === 'cancelar' || m.t === 'salir') && m.id === id) {
            clearInterval(repetir);
            clearTimeout(limite);
            ok(null);
          }
        };
        const mirar = window.setInterval(() => {
          if (cancelado) {
            clearInterval(mirar);
            clearInterval(repetir);
            clearTimeout(limite);
            ok(null);
          }
        }, 200);
      });
      e.cerrar();
      if (!config) {
        if (!cancelado) this.aviso(`${el} ya no está esperando. ¡Otra vez será!`);
        return;
      }
      const r = await this.partida(config, 'invitado', 1, id);
      if (r !== 'otra') return;
    }
  }

  // ------------------------------------------------------------------------------------------------- Una partida
  private async partida(config: ConfigPartida, papel: Papel, yo: number, idPartida = ''): Promise<'otra' | 'menu'> {
    const m = new Motor({ escenario: config.escenario, apurado: config.apurado, jugadores: config.jugadores, semilla: config.semilla });
    this.m = m;
    const pareja = config.jugadores.length > 1;
    const nombres = config.jugadores.map((j) => this.o.nombres[j.rol]);
    const c = this.canal;
    let pausado = false;
    let caida = false;
    let terminar: ((r: ResumenPartida | null) => void) | null = null;
    let numeros = true;
    const yoJ = m.jug[yo];
    // Lo que hace este celular cuando toca algo (local o se le pide al anfitrión)
    const pedir = (msg: MensajeLavado) => c?.mandar(msg);
    const local = papel !== 'invitado';
    const acciones: Acciones = {
      escoger: (k) => (local ? m.escoger(yo, k) : pedir({ t: 'escoger', id: idPartida, k })),
      tirar: () => (local ? m.tirarCartas(yo) : pedir({ t: 'tirar', id: idPartida })),
      saltar: () => (local ? m.saltarCartas(yo) : pedir({ t: 'saltar', id: idPartida })),
      vetar: (k) => (local ? m.vetar(yo, k) : pedir({ t: 'vetar', id: idPartida, k })),
      cerrarCofre: () => (local ? m.cerrarCofre(yo) : pedir({ t: 'cofre', id: idPartida })),
      escogerCarta: (cc) => (local ? m.escogerCarta(yo, cc) : pedir({ t: 'carta', id: idPartida, c: cc })),
      pausa: (si) => {
        pausado = si;
        ui.mostrarPausa(m, si, musicaLavado.muda, silenciado(), numeros);
        musicaLavado.pausar(si);
        if (pareja) pedir({ t: 'pausa', id: idPartida, si, de: this.o.rol });
      },
      retirarse: () => {
        pausado = false;
        ui.mostrarPausa(m, false, false, false, numeros);
        if (papel === 'invitado') pedir({ t: 'fin', id: idPartida, retiro: true });
        else m.terminar();
      },
      musica: () => musicaLavado.alternar(),
      sonido: () => alternarSonido(),
      numeros: () => {
        numeros = !numeros;
        if (this.dib) this.dib.numerosVisibles = numeros;
        return numeros;
      },
    };
    const ui = new Interfaz(this.raiz, yo, nombres, acciones);
    this.ui = ui;
    const dib = new Dibujo({ lienzo: this.lienzo, yo });
    this.dib = dib;
    const carga = this.espera('Entrando a la cara', 'Mojando la toalla…', () => undefined);
    try {
      // La piel es la de quien invitó (se juega dentro de su cara)
      await dib.cargar(m, config.jugadores[0].rol);
    } finally {
      carga.cerrar();
    }
    dib.alEfecto = (e) => {
      sonarEfecto(e, yo);
      ui.efecto(e, m);
    };
    const espejo = papel === 'invitado' ? new Espejo(m, yo) : null;
    if (papel === 'invitado') for (const j of m.jug) j.remoto = j.i !== yo;
    if (papel === 'anfitrion') m.jug[1].remoto = true;

    // ------------------------------------------------------------------ Controles
    let dedo: { id: number; x0: number; y0: number; x: number; y: number } | null = null;
    const teclas = new Set<string>();
    const joy = document.createElement('div');
    joy.className = 'lv-joy';
    joy.innerHTML = '<i></i>';
    this.raiz.append(joy);
    const abajo = (e: PointerEvent) => {
      if ((e.target as HTMLElement) !== this.lienzo || dedo) return;
      dedo = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY };
      joy.style.left = `${e.clientX}px`;
      joy.style.top = `${e.clientY}px`;
      joy.classList.add('si');
      activar();
    };
    const mueve = (e: PointerEvent) => {
      if (!dedo || e.pointerId !== dedo.id) return;
      dedo.x = e.clientX;
      dedo.y = e.clientY;
      const dx = dedo.x - dedo.x0, dy = dedo.y - dedo.y0, d = Math.hypot(dx, dy);
      // El centro sigue al dedo si se va muy lejos
      if (d > 56) {
        dedo.x0 = dedo.x - (dx / d) * 56;
        dedo.y0 = dedo.y - (dy / d) * 56;
        joy.style.left = `${dedo.x0}px`;
        joy.style.top = `${dedo.y0}px`;
      }
      const k = Math.min(1, d / 56);
      (joy.firstChild as HTMLElement).style.transform = `translate(${(dx / (d || 1)) * k * 30}px, ${(dy / (d || 1)) * k * 30}px)`;
    };
    const arriba = (e: PointerEvent) => {
      if (!dedo || e.pointerId !== dedo.id) return;
      dedo = null;
      joy.classList.remove('si');
      (joy.firstChild as HTMLElement).style.transform = '';
    };
    const tecla = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.type === 'keydown') {
        teclas.add(k);
        if ((k === 'escape' || k === 'p') && !m.pausa) acciones.pausa(!pausado);
      } else teclas.delete(k);
    };
    const visible = () => {
      if (document.visibilityState === 'hidden' && !pausado && !m.fin) acciones.pausa(true);
    };
    this.lienzo.addEventListener('pointerdown', abajo);
    window.addEventListener('pointermove', mueve);
    window.addEventListener('pointerup', arriba);
    window.addEventListener('pointercancel', arriba);
    window.addEventListener('keydown', tecla);
    window.addEventListener('keyup', tecla);
    document.addEventListener('visibilitychange', visible);
    const redimensionar = () => dib.ajustar();
    window.addEventListener('resize', redimensionar);
    let contextoPerdido = false;
    const perdido = (e: Event) => {
      e.preventDefault();
      contextoPerdido = true;
      if (!pausado) acciones.pausa(true);
    };
    const recuperado = () => (contextoPerdido = false);
    this.lienzo.addEventListener('webglcontextlost', perdido);
    this.lienzo.addEventListener('webglcontextrestored', recuperado);

    const entrada = () => {
      let mx = 0, my = 0;
      if (dedo) {
        const dx = dedo.x - dedo.x0, dy = dedo.y - dedo.y0, d = Math.hypot(dx, dy);
        if (d > 6) {
          const k = Math.min(1, d / 46);
          mx = (dx / d) * k;
          // La pantalla se ve desde arriba en ángulo: lo vertical se estira para que se sienta igual
          my = (dy / d) * k;
        }
      }
      if (teclas.has('arrowleft') || teclas.has('a')) mx -= 1;
      if (teclas.has('arrowright') || teclas.has('d')) mx += 1;
      if (teclas.has('arrowup') || teclas.has('w')) my -= 1;
      if (teclas.has('arrowdown') || teclas.has('s')) my += 1;
      return [mx, my];
    };

    // ------------------------------------------------------------------ En pareja
    let ultimoDelOtro = performance.now();
    let efDesde = 0;
    let seq = 0;
    let tFoto = 0;
    let tInv = 0;
    let claveInv = '';
    let tMando = 0;
    let resumenLlegado: ResumenPartida | null = null;
    if (c && pareja) {
      c.alMensaje = (msg) => {
        if ('id' in msg && msg.id !== idPartida) return;
        ultimoDelOtro = performance.now();
        const otroI = 1 - yo;
        switch (msg.t) {
          case 'mando': {
            if (papel !== 'anfitrion') break;
            const j = m.jug[otroI];
            if (!j.caido) {
              j.x = msg.x;
              j.y = msg.y;
            }
            j.vx = msg.vx;
            j.vy = msg.vy;
            j.vistaW = msg.w;
            j.vistaH = msg.h;
            break;
          }
          case 'escoger':
            if (papel === 'anfitrion') m.escoger(otroI, msg.k);
            break;
          case 'tirar':
            if (papel === 'anfitrion') m.tirarCartas(otroI);
            break;
          case 'saltar':
            if (papel === 'anfitrion') m.saltarCartas(otroI);
            break;
          case 'vetar':
            if (papel === 'anfitrion') m.vetar(otroI, msg.k);
            break;
          case 'cofre':
            if (papel === 'anfitrion') m.cerrarCofre(otroI);
            break;
          case 'carta':
            if (papel === 'anfitrion') m.escogerCarta(otroI, msg.c);
            break;
          case 'pausa':
            pausado = msg.si;
            ui.mostrarPausa(m, msg.si, musicaLavado.muda, silenciado(), numeros);
            if (msg.si) ui.aviso(`${nombres[otroI]} pausó el juego`);
            musicaLavado.pausar(msg.si);
            break;
          case 'foto':
            espejo?.aplicar(msg.b);
            break;
          case 'inventario':
            if (papel === 'invitado') aplicarInventario(m, msg.jug);
            break;
          case 'fin':
            if (papel === 'anfitrion' && msg.retiro) m.terminar();
            if (papel === 'invitado') {
              resumenLlegado = msg.resumen ?? null;
              m.fin = true;
            }
            break;
          case 'salir':
            ui.aviso(`${nombres[otroI]} se salió de la partida`, 3);
            if (papel === 'invitado') m.fin = true;
            else m.jug[otroI].caido = true;
            break;
        }
      };
    }

    // ------------------------------------------------------------------ El bucle
    let ultimo = performance.now();
    let acumulado = 0;
    let tJefe = 0;
    musicaLavado.jefe = false;
    musicaLavado.intensidad = 0;
    const resumen = await new Promise<ResumenPartida | null>((ok) => {
      terminar = ok;
      const bucle = (ahora: number) => {
        if (!terminar) return;
        requestAnimationFrame(bucle);
        // 30 cuadros por segundo como máximo (el celular no se calienta)
        if (ahora - ultimo < 1000 / 31) return;
        const dt = Math.min(0.1, (ahora - ultimo) / 1000);
        ultimo = ahora;
        // ¿Se cortó la conexión?
        if (pareja) {
          const sin = papel === 'invitado' ? performance.now() - (espejo!.ultimaFoto || ultimoDelOtro) > 3000 : performance.now() - ultimoDelOtro > 3000;
          if (sin !== caida) {
            caida = sin;
            ui.conexion(sin ? `Se cortó la conexión con ${nombres[1 - yo]}` : null);
          }
        }
        const quieto = pausado || caida || contextoPerdido;
        const [mx, my] = entrada();
        if (papel !== 'invitado') {
          if (this.bot) botPaso(m);
          else {
            yoJ.mx = mx;
            yoJ.my = my;
          }
          yoJ.vistaW = dib.vistaW;
          yoJ.vistaH = dib.vistaH;
          if (!quieto) {
            acumulado += dt;
            let pasos = 0;
            while (acumulado >= PASO && pasos < 3) {
              m.paso(PASO);
              acumulado -= PASO;
              pasos++;
            }
            if (pasos >= 3) acumulado = 0;
          }
        } else {
          espejo!.avanzar(dt);
          // Mi personaje se mueve aquí mismo (sin esperar la foto)
          if (!quieto && !m.pausa && !yoJ.caido && !m.fin) {
            const l = Math.hypot(mx, my);
            const ux = l > 1 ? mx / l : mx, uy = l > 1 ? my / l : my;
            const v = VEL_JUGADOR * Math.max(0.2, 1 + yoJ.st.movimiento);
            yoJ.vx = ux * v;
            yoJ.vy = uy * v;
            yoJ.x += yoJ.vx * dt;
            yoJ.y += yoJ.vy * dt;
            const lim = m.esc.limites;
            if (lim) yoJ.y = Math.max(lim.yMin + 18, Math.min(lim.yMax - 18, yoJ.y));
            if (l > 0.15) {
              yoJ.dx = ux / Math.max(l, 1e-6);
              yoJ.dy = uy / Math.max(l, 1e-6);
              if (Math.abs(ux) > 0.12) yoJ.mira = ux > 0 ? 1 : -1;
            }
          } else {
            yoJ.vx = yoJ.vy = 0;
          }
          tMando += dt;
          if (tMando >= 0.05) {
            tMando = 0;
            pedir({ t: 'mando', id: idPartida, x: yoJ.x, y: yoJ.y, vx: yoJ.vx, vy: yoJ.vy, w: dib.vistaW, h: dib.vistaH });
          }
        }
        // Al anfitrión le toca mandar la foto y el inventario
        if (papel === 'anfitrion' && c) {
          tFoto += dt;
          tInv += dt;
          if (tFoto >= 0.1) {
            tFoto = 0;
            const f = tomarFoto(m, 1, efDesde, seq++);
            efDesde = f.efHasta;
            c.mandar({ t: 'foto', id: idPartida, b: f.b });
          }
          const inv = inventarioDe(m);
          const k = JSON.stringify(inv);
          if (k !== claveInv || tInv > 2) {
            claveInv = k;
            tInv = 0;
            c.mandar({ t: 'inventario', id: idPartida, jug: inv });
          }
        }
        dib.dibujar(m, dt, quieto || !!m.pausa);
        ui.actualizar(m, dt, !caida);
        ui.revisar(m);
        // Flecha hacia el otro si no se ve
        if (pareja) {
          const o2 = m.jug[1 - yo];
          const [px, py] = dib.aPantalla(o2.x, o2.y);
          const w = this.raiz.clientWidth, h = this.raiz.clientHeight;
          const fuera = px < 0 || py < 0 || px > w || py > h;
          ui.flecha(fuera ? Math.max(20, Math.min(w - 20, px)) : null, Math.max(60, Math.min(h - 20, py)));
        }
        // Música: se anima con los minutos y se pone seria con los jefes
        tJefe += dt;
        if (tJefe > 0.5) {
          tJefe = 0;
          musicaLavado.intensidad = Math.min(3, Math.floor(m.t / 480));
          let jefe = false;
          for (let q = 0; q < m.nVivos; q++) {
            const e = m.en[m.vivos[q]];
            if (e.vivo && e.jefe && !e.luz) jefe = true;
          }
          musicaLavado.jefe = jefe;
        }
        if (m.fin) {
          const t = terminar;
          terminar = null;
          // Al anfitrión le toca avisar (varias veces, por si se pierde)
          if (papel === 'anfitrion' && c) {
            const r2 = m.resumen(1, true);
            for (const d of [0, 400, 1200]) setTimeout(() => c.mandar({ t: 'fin', id: idPartida, retiro: false, resumen: r2 }), d);
          }
          setTimeout(() => t(papel === 'invitado' ? resumenLlegado : m.resumen(yo, pareja)), 900);
        }
      };
      requestAnimationFrame(bucle);
    });

    // ------------------------------------------------------------------ Final
    this.lienzo.removeEventListener('pointerdown', abajo);
    window.removeEventListener('pointermove', mueve);
    window.removeEventListener('pointerup', arriba);
    window.removeEventListener('pointercancel', arriba);
    window.removeEventListener('keydown', tecla);
    window.removeEventListener('keyup', tecla);
    document.removeEventListener('visibilitychange', visible);
    window.removeEventListener('resize', redimensionar);
    joy.remove();
    // Si es invitado y no llegó el resumen, se arma uno con lo que se ve
    const r: ResumenPartida = resumen ?? m.resumen(yo, pareja);
    const logros = sumarPartida(this.p, r);
    const monedas = monedasPorPartida(r.segundos, r.gano);
    this.resultado.partidas++;
    this.resultado.segundos = Math.max(this.resultado.segundos, Math.round(Math.min(r.segundos, DURACION + 600)));
    this.resultado.gano ||= r.gano;
    this.resultado.eliminados += r.eliminados;
    this.resultado.nivel = Math.max(this.resultado.nivel, r.nivel);
    this.resultado.jefe ||= r.jefes.some((j) => ENEMIGOS[j].jefe && j !== 'duchaHelada');
    this.resultado.monedas += monedas;
    void this.o.guardar(this.p).catch(() => undefined);
    const que = await ui.mostrarFin(r, { logros, monedas, pareja, nombreOtro: nombres[1 - yo] ?? '' });
    // Se suelta todo lo de la partida (y el contexto WebGL)
    this.lienzo.removeEventListener('webglcontextlost', perdido);
    this.lienzo.removeEventListener('webglcontextrestored', recuperado);
    dib.liberar();
    this.raiz.querySelectorAll('.lv-hud, .lv-pausa, .lv-capa, [class^="lv-velo"]').forEach((e) => e.remove());
    // Un lienzo nuevo para la próxima (el viejo quedó sin contexto)
    const nuevo = document.createElement('canvas');
    nuevo.className = 'lv-lienzo';
    this.lienzo.replaceWith(nuevo);
    this.lienzo = nuevo;
    this.m = null;
    this.dib = null;
    this.ui = null;
    await esperar(50);
    return que;
  }

  /** Para las pruebas: adelantar el reloj, dar experiencia, abrir un cofre, aguantar, ganar. */
  probar(que: string, v = 0) {
    const m = this.m;
    if (!m) return null;
    const j = m.jug[0];
    switch (que) {
      case 'tiempo':
        m.t = v;
        break;
      case 'xp':
        m.xp += v;
        break;
      case 'cofre':
        m.soltar('cofre', j.x + 30, j.y, v || 2);
        break;
      case 'aguante':
        for (const x of m.jug) x.vida = x.vidaMax = 1e9;
        break;
      case 'arma':
        m.darArma(j, String(v) as IdArma);
        break;
      case 'fin':
        m.terminar();
        break;
      case 'bot':
        this.bot = !!v;
        break;
    }
    return { t: m.t, nivel: m.nivel, enemigos: m.nVivos, eliminados: m.eliminados, vida: j.vida, calidad: this.dib?.calidad, pausa: m.pausa };
  }
}

(window as unknown as { __lavado: typeof lavado }).__lavado = lavado;
