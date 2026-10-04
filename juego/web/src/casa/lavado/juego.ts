// «Lavarse la cara» de punta a punta: el menú, el tutorial, las partidas (solo, o de 2 a 4 en una sala: Javier,
// Laura y amigos, cada uno en su celular), el bucle a 30 cuadros con paso fijo, los controles (arrastrar el dedo en
// cualquier parte o WASD/flechas; con el ataque «a mano», el segundo dedo o el mouse apuntan), la pausa (sola si la
// app se va a segundo plano o si se corta la conexión), el final con el progreso guardado y lo que se le devuelve
// a la casa (higiene y monedas). Cuando juega un amigo o hay amigos en la sala, todo va en modo neutro (textos.ts).
import './salas.css';
import { activar, alternar as alternarSonido, silenciado } from '../../sonido';
import * as fondo from '../../segundo_plano';
import { COLOR_PUESTO, crearSala, normalizarCodigo, unirseSala, usarSalasLocales, yoMismo } from '../../salas/sala';
import { esperarEnSala } from '../../salas/espera';
import { caritaSvg } from '../../salas/carita';
import { idAparato } from '../../salas/perfil';
import type { AspectoJugador, JugadorSala, OpcionesSala, Sala } from '../../salas/tipos';
import { CARTAS } from './cartas';
import { DISFRAZ, puedeApuntar } from './disfraces';
import { DURACION, ESCENARIOS } from './escenarios';
import { ENEMIGOS } from './enemigos';
import { Dibujo } from './dibujo/dibujo';
import { cargarIconos } from './iconos';
import { Interfaz, type Acciones } from './interfaz';
import {
  Espejo, FOTO_CARGANDO, FOTO_CORTE, MSJ, aplicarInventario, inventarioDe, restanteEspejo, tomarFoto, type Accion, type ConfigPartida, type Mando,
} from './linea';
import { Menu, retrato } from './menu';
import { Motor, VEL_JUGADOR, xpPara, type OpcionesJugador } from './motor';
import { cartasDe, SECRETO_LOGRO, secretoAbierto, sumarPartida, type ProgresoLavado, type ResumenPartida } from './progreso';
import { musicaLavado, sonarEfecto } from './sonidos';
import { botPaso } from './bot';
import { disfrazVisto, ponerNeutro } from './textos';
import { Tutorial } from './tutorial';
import type { IdArma, IdCarta, IdPasiva, Rol, Stat } from './tipos';

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
  /** Javier o Laura; para un amigo, el cuerpo de su muñeco. */
  rol: Rol;
  nombres: Record<Rol, string>;
  progreso: ProgresoLavado;
  guardar: (p: ProgresoLavado) => Promise<void>;
  /** Jugar en pareja desde la casa: cómo se manda la invitación (con el código de la sala) a la casa del otro. */
  pareja: null | { modo: 'local' | 'linea'; invitar: (codigo: string) => Promise<void> };
  /** Llegó por una invitación: el código de la sala de quien invitó. */
  unirse?: string;
  /** Juega un amigo (sin casa, en modo neutro): su nombre y cómo se ve. */
  amigo?: { nombre: string; aspecto: AspectoJugador };
  /** El botón de salir del menú (volver a la casa o a la sala de juegos de amigos). */
  textoSalir?: string;
  /** Mostrar «Con amigos» y «Unirme con código» (sí, salvo que se diga lo contrario). */
  salas?: boolean;
}

const PASO = 1 / 30;
const otro = (r: Rol): Rol => (r === 'el' ? 'ella' : 'el');
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
/** Segundos que se espera a alguien sin conexión antes de seguir sin él (vuelve a entrar apenas regrese). */
const ESPERA_CORTE = 20;

/** Monedas de la casa por una partida: 1 cada 2 minutos, +3 si llegó a la Ducha Helada, máximo 15. */
export const monedasPorPartida = (segundos: number, gano: boolean) => Math.min(15, Math.floor(segundos / 120) + (gano ? 3 : 0));

/** Lo que el motor necesita de cada jugador según su progreso. */
export function opcionesJugador(rol: Rol, p: ProgresoLavado): OpcionesJugador {
  const disfraz = DISFRAZ[p.disfraz]?.rol === rol ? p.disfraz : rol === 'el' ? 'el_panda' : 'ella_pulga';
  return {
    rol,
    disfraz,
    poderes: { ...p.poderes },
    carta: p.carta || null,
    secretos: (Object.keys(SECRETO_LOGRO) as (IdArma | IdPasiva)[]).filter((id) => secretoAbierto(p, id)),
    cartas: cartasDe(p),
    manual: p.manual && puedeApuntar(disfraz),
  };
}

/** Lo que llega de otro celular, revisado (nunca se confía a ciegas). */
function opcionesSeguras(x: unknown, rol: Rol): OpcionesJugador {
  const o = (x && typeof x === 'object' ? x : {}) as Partial<OpcionesJugador>;
  const disfraz = typeof o.disfraz === 'string' && DISFRAZ[o.disfraz]?.rol === rol ? o.disfraz : rol === 'el' ? 'el_panda' : 'ella_pulga';
  const poderes: Partial<Record<Stat, number>> = {};
  if (o.poderes && typeof o.poderes === 'object')
    for (const [k, v] of Object.entries(o.poderes)) if (typeof v === 'number' && Number.isFinite(v)) poderes[k as Stat] = Math.max(0, Math.min(10, Math.floor(v)));
  const carta = typeof o.carta === 'string' && o.carta in CARTAS ? (o.carta as IdCarta) : null;
  const lista = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string').slice(0, 40) : []);
  return {
    rol, disfraz, poderes, carta, secretos: lista(o.secretos), cartas: lista(o.cartas).filter((c) => c in CARTAS) as IdCarta[],
    manual: !!o.manual && puedeApuntar(disfraz),
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
  /** La sala en la que está (si está jugando con otros). */
  sala: Sala | null = null;
  tuto: Tutorial | null = null;
  /** Para las pruebas: por qué está quieto el juego en este celular. */
  red: Record<string, unknown> = {};
  /** Las pruebas pueden poner el bot a jugar. */
  bot = params.has('botlavado');
  /** Un amigo juega siempre en modo neutro; Javier y Laura, solo cuando hay amigos en la sala. */
  private readonly neutroBase: boolean;
  private readonly tactil = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;

  constructor(private o: OpcionesLavado, private listo: (r: ResultadoLavado) => void) {
    this.p = structuredClone(o.progreso);
    this.neutroBase = !!o.amigo;
    ponerNeutro(this.neutroBase);
    usarSalasLocales(o.pareja?.modo === 'local');
    this.resultado = { segundos: 0, gano: false, eliminados: 0, nivel: 0, jefe: false, monedas: 0, partidas: 0, progreso: this.p };
    this.raiz = document.createElement('section');
    this.raiz.className = 'lv';
    this.raiz.innerHTML = '<canvas class="lv-lienzo"></canvas>';
    this.lienzo = this.raiz.querySelector('canvas')!;
    document.body.append(this.raiz);
    this.menu = new Menu(this.raiz, {
      rol: o.rol,
      nombre: o.amigo?.nombre ?? o.nombres[o.rol],
      nombreOtro: o.nombres[otro(o.rol)],
      progreso: this.p,
      guardar: (p) => o.guardar(p),
      puedePareja: !!o.pareja && !o.amigo,
      puedeSalas: o.salas !== false,
      textoSalir: o.textoSalir ?? '🏠 Volver a la casa',
    });
    requestAnimationFrame(() => this.raiz.classList.add('visible'));
  }

  async correr() {
    await cargarIconos();
    activar();
    musicaLavado.iniciar();
    try {
      if (this.o.unirse) await this.enSala(() => unirseSala(this.o.unirse!, 'lavado', this.yoEnSala()));
      for (;;) {
        const a = await this.menu.abrir();
        if (a === 'salir') break;
        this.menu.cerrar();
        if (a === 'jugar') {
          // La primera vez, el tutorial (se puede saltar; si lo salta o termina, sigue a la partida de verdad)
          if (!this.p.tutorial && (await this.tutorial(true)) === 'menu') continue;
          await this.partidaSola();
        } else if (a === 'tutorial') {
          if ((await this.tutorial(false)) === 'jugar') await this.partidaSola();
        } else if (a === 'pareja' && this.o.pareja) {
          const invitar = this.o.pareja.invitar;
          await this.enSala(() => crearSala({ juego: 'lavado', max: 4, yo: this.yoEnSala() }), invitar);
        } else if (a === 'amigos') {
          await this.enSala(() => crearSala({ juego: 'lavado', max: 4, yo: this.yoEnSala() }));
        } else if (a === 'codigo') {
          const c = await this.pedirCodigo();
          if (c) await this.enSala(() => unirseSala(c, 'lavado', this.yoEnSala()));
        }
      }
    } catch (e) {
      console.error(e);
    }
    this.cerrar();
  }

  private cerrar() {
    musicaLavado.detener();
    this.sala?.salir();
    this.sala = null;
    ponerNeutro(false);
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
        jugadores: [this.misOpciones()],
      };
      const r = await this.partida(config, 'solo', 0, null);
      if (r !== 'otra') return;
    }
  }

  private misOpciones(): OpcionesJugador {
    return { ...opcionesJugador(this.o.rol, this.p), nombre: this.o.amigo?.nombre ?? this.o.nombres[this.o.rol], aspecto: this.o.amigo?.aspecto };
  }

  /** El tutorial: una partidita guiada. Devuelve si después se juega de verdad o se vuelve al menú. */
  private async tutorial(primeraVez: boolean): Promise<'jugar' | 'menu'> {
    const config: ConfigPartida = { escenario: 'cara', apurado: false, semilla: 7, jugadores: [this.misOpciones()] };
    let que: 'jugar' | 'menu' = 'menu';
    await this.partida(config, 'solo', 0, null, (m) => {
      return new Tutorial(this.raiz, this.tactil, puedeApuntar(m.jug[0].disfraz.id), m.jug[0].manual, (como) => {
        // (la primera vez, saltarlo es querer jugar ya; desde «Cómo se juega», saltarlo es volver al menú)
        que = como === 'jugar' || (como === 'saltar' && primeraVez) ? 'jugar' : 'menu';
        m.terminar(true);
      });
    });
    if (!this.p.tutorial) {
      this.p.tutorial = true;
      void this.o.guardar(this.p).catch(() => undefined);
    }
    return que;
  }

  // ------------------------------------------------------------------------------------------------- Salas
  /** Quién soy en la sala: un amigo con su perfil, o Javier o Laura (con su nombre de la casa). */
  private yoEnSala(): OpcionesSala['yo'] {
    if (this.o.amigo) return { tipo: 'amigo', nombre: this.o.amigo.nombre, aspecto: this.o.amigo.aspecto };
    const rol = this.o.rol;
    return { id: `${rol}-${idAparato()}`, tipo: rol, nombre: this.o.nombres[rol], aspecto: { cuerpo: rol } };
  }

  /** Lo que los demás ven de mí en la sala de espera y lo que se usa para armar la partida. */
  private ponerMisDatos(sala: Sala) {
    const op = opcionesJugador(sala.yo.aspecto.cuerpo, this.p);
    sala.ponerDatos({ op, disfraz: op.disfraz, jugando: false });
  }

  /** La configuración que arma el anfitrión con lo que escogió cada uno (en el orden de los puestos). */
  private configSala(sala: Sala): ConfigPartida {
    const js = sala.jugadores.filter((j) => j.puesto >= 0);
    return {
      escenario: this.p.escenario,
      apurado: this.p.apurado,
      semilla: (Math.random() * 1e9) >>> 0,
      jugadores: js.map((j) => {
        const rol: Rol = j.tipo === 'amigo' ? j.aspecto.cuerpo : j.tipo;
        return { ...opcionesSeguras(j.datos?.op, rol), id: j.id, nombre: j.nombre, aspecto: j.tipo === 'amigo' ? j.aspecto : undefined };
      }),
    };
  }

  /** Revisa la configuración que mandó el anfitrión. */
  private configSegura(x: unknown): ConfigPartida | null {
    const c = x as Partial<ConfigPartida> | null;
    if (!c || !Array.isArray(c.jugadores) || !c.jugadores.length || c.jugadores.length > 4) return null;
    if (!c.escenario || !(c.escenario in ESCENARIOS)) return null;
    return {
      escenario: c.escenario,
      apurado: !!c.apurado,
      semilla: Number(c.semilla) >>> 0,
      jugadores: c.jugadores.map((j) => {
        const rol: Rol = j?.rol === 'ella' ? 'ella' : 'el';
        return {
          ...opcionesSeguras(j, rol), id: typeof j?.id === 'string' ? j.id : '', nombre: typeof j?.nombre === 'string' ? j.nombre.slice(0, 16) : '',
          aspecto: j?.aspecto && typeof j.aspecto === 'object' ? j.aspecto : undefined,
        };
      }),
    };
  }

  /** Abre (o entra a) una sala, la sala de espera y las partidas, hasta que se salga. */
  private async enSala(abrir: () => Promise<Sala>, invitar?: (codigo: string) => Promise<void>) {
    const carga = this.espera('Abriendo la sala', 'Un momentico…', null);
    let sala: Sala;
    try {
      sala = await abrir();
    } catch (e) {
      carga.cerrar();
      this.aviso(e instanceof Error ? e.message : 'No se pudo abrir la sala.');
      return;
    }
    carga.cerrar();
    this.sala = sala;
    if (invitar) void invitar(sala.codigo).catch(() => undefined);
    const neutro = () => ponerNeutro(this.neutroBase || sala.hayAmigos);
    neutro();
    const quitar = sala.alCambiar(neutro);
    try {
      for (;;) {
        this.ponerMisDatos(sala);
        const pareja = !!invitar;
        const e = esperarEnSala({
          sala,
          titulo: 'Lavarse la cara',
          subtitulo: pareja ? `Le llegó la invitación a ${this.o.nombres[otro(this.o.rol)]}: cuando se mire al espejo, entra. Con el código también entran amigos.` : 'Hasta 4 en la misma cara: más mugrosos por cada uno.',
          tema: 'burbujas',
          contenedor: this.raiz,
          retrato: (j) => this.retratoEnSala(j),
          detalle: (j) => {
            const d = DISFRAZ[String(j.datos?.disfraz ?? '')];
            const op = j.datos?.op as OpcionesJugador | undefined;
            return d ? `${esc(disfrazVisto(d).nombre)}${op?.manual ? ' · 🎯 a mano' : ''}` : '';
          },
          extras: [{
            id: 'disfraz', texto: '👗 Disfraz', alTocar: async () => {
              await this.menu.pantallaSuelta('disfraces');
              this.ponerMisDatos(sala);
              e.repintar();
            },
          }, {
            id: 'ataque', texto: '🎯 Ataque', alTocar: () => {
              if (!puedeApuntar(this.p.disfraz)) return e.aviso('Ese disfraz es de área: dispara solito');
              this.p.manual = !this.p.manual;
              void this.o.guardar(this.p).catch(() => undefined);
              this.ponerMisDatos(sala);
              e.aviso(this.p.manual ? '🎯 Ataque a mano: segundo dedo o mouse' : '🎯 Ataque solito');
            },
          }],
          minimo: 2,
          alEmpezar: () => this.configSala(sala),
          invitacion: (c) => `¡Ven a lavarte la cara conmigo! Abre «Nuestro Hogar», toca «Soy un amigo / una amiga» (o tu espejo), «Unirme con un código» y escribe: ${c}`,
        });
        const r = await e.resultado;
        if (r.que !== 'empezar') {
          if (r.motivo) this.aviso(r.motivo);
          break;
        }
        const config = this.configSegura(r.datos);
        const yo = config ? config.jugadores.findIndex((j) => j.id === sala.yo.id) : -1;
        if (!config || yo < 0) {
          this.aviso('No se pudo entrar a la partida.');
          break;
        }
        const que = await this.partida(config, yo === 0 ? 'anfitrion' : 'invitado', yo, sala);
        if (que === 'menu' || this.salaAcabada) break;
      }
    } finally {
      quitar();
      sala.salir();
      this.sala = null;
      this.salaAcabada = false;
      ponerNeutro(this.neutroBase);
    }
  }
  private salaAcabada = false;

  /** El retrato de cada uno en la sala: su disfraz (y la carita con sus colores si es un amigo). */
  private retratoEnSala(j: JugadorSala) {
    const d = DISFRAZ[String(j.datos?.disfraz ?? '')];
    if (!d) return '';
    const mini = j.tipo === 'amigo' ? `<span class="lv-mini-carita">${caritaSvg(j.aspecto, 30, 'feliz')}</span>` : '';
    return `${retrato(d, '')}${mini}`;
  }

  /** Pide el código de una sala (5 letras y números). */
  private pedirCodigo(): Promise<string | null> {
    return new Promise((ok) => {
      const capa = document.createElement('div');
      capa.className = 'lv-capa lv-codigo';
      capa.style.zIndex = '6';
      capa.innerHTML = `<form class="lv-panel lv-codigo-panel"><h2>🔑 Unirme con un código<small>El que creó la sala te lo pasa (5 letras y números)</small></h2>
        <input name="c" maxlength="7" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCDE" aria-label="Código de la sala" enterkeyhint="go">
        <p class="lv-codigo-error" role="status"></p>
        <div class="lv-fila"><button type="button" class="lv-boton" data-c="no">Cancelar</button><button class="lv-boton rosa grande">Entrar</button></div></form>`;
      this.raiz.append(capa);
      const input = capa.querySelector('input')!;
      input.addEventListener('input', () => (input.value = normalizarCodigo(input.value)));
      setTimeout(() => input.focus(), 50);
      const fin = (v: string | null) => {
        capa.remove();
        ok(v);
      };
      capa.querySelector('[data-c="no"]')!.addEventListener('click', () => fin(null));
      capa.querySelector('form')!.addEventListener('submit', (e) => {
        e.preventDefault();
        const c = normalizarCodigo(input.value);
        if (c.length !== 5) {
          capa.querySelector('.lv-codigo-error')!.textContent = 'El código tiene 5 letras y números.';
          return;
        }
        fin(c);
      });
    });
  }

  /** Una capa de espera (con botón para cancelar si se quiere). Devuelve cómo cerrarla. */
  private espera(titulo: string, texto: string, alCancelar: (() => void) | null) {
    const capa = document.createElement('div');
    capa.className = 'lv-capa';
    capa.style.zIndex = '5';
    capa.innerHTML = `<div class="lv-espera"><h2>${titulo}<span class="puntos"></span></h2><p>${texto}</p>${alCancelar ? '<button class="lv-boton">Cancelar</button>' : ''}</div>`;
    if (alCancelar) capa.querySelector('button')!.addEventListener('click', alCancelar);
    this.raiz.append(capa);
    return { cerrar: () => capa.remove(), texto: (t: string) => (capa.querySelector('p')!.textContent = t) };
  }

  private aviso(texto: string) {
    const capa = document.createElement('div');
    capa.className = 'lv-capa';
    capa.style.zIndex = '6';
    capa.innerHTML = `<div class="lv-espera"><h2>${esc(texto)}</h2><button class="lv-boton">Listo</button></div>`;
    capa.querySelector('button')!.addEventListener('click', () => capa.remove());
    this.raiz.append(capa);
  }

  // ------------------------------------------------------------------------------------------------- Una partida
  private async partida(config: ConfigPartida, papel: Papel, yo: number, sala: Sala | null, conTutorial?: (m: Motor) => Tutorial): Promise<'otra' | 'menu'> {
    const m = new Motor({ escenario: config.escenario, apurado: config.apurado, jugadores: config.jugadores, semilla: config.semilla, tutorial: !!conTutorial });
    this.m = m;
    const n = config.jugadores.length;
    const varios = n > 1;
    const nombres = config.jugadores.map((j) => j.nombre || this.o.nombres[j.rol]);
    const colores = config.jugadores.map((_, i) => COLOR_PUESTO[i]);
    const ids = config.jugadores.map((j) => j.id ?? '');
    const indice = new Map(ids.map((id, i) => [id, i]));
    let pausado = false;
    let terminar: ((r: ResumenPartida | null) => void) | null = null;
    let numeros = true;
    const yoJ = m.jug[yo];
    const quitar: (() => void)[] = [];
    const mandar = (tipo: string, datos: unknown, rapido = false) => sala?.mandar(tipo, datos, rapido ? { rapido: true } : undefined);
    /** Pausas propias mandadas y la última que llegó de cada uno. */
    let nPausa = 0;
    const nPausaDe = new Map<string, number>();
    const local = papel !== 'invitado';
    const pedir = (a: Accion) => mandar(MSJ.accion, a);
    const me = { retire: false };
    if (sala) sala.ponerDatos({ jugando: true, listo: false });
    const acciones: Acciones = {
      escoger: (k, nn) => (local ? m.escoger(yo, k, nn) : pedir({ a: 'escoger', k, n: nn })),
      tirar: (nn) => (local ? m.tirarCartas(yo, nn) : pedir({ a: 'tirar', n: nn })),
      saltar: (nn) => (local ? m.saltarCartas(yo, nn) : pedir({ a: 'saltar', n: nn })),
      vetar: (k, nn) => (local ? m.vetar(yo, k, nn) : pedir({ a: 'vetar', k, n: nn })),
      cerrarCofre: (nn) => (local ? m.cerrarCofre(yo, nn) : pedir({ a: 'cofre', n: nn })),
      escogerCarta: (cc, nn) => (local ? m.escogerCarta(yo, cc, nn) : pedir({ a: 'carta', c: cc, n: nn })),
      pausa: (si) => {
        pausado = si;
        ui.mostrarPausa(m, si, musicaLavado.muda, silenciado(), numeros);
        musicaLavado.pausar(si);
        if (varios) mandar(MSJ.pausa, { si, n: ++nPausa });
      },
      retirarse: () => {
        pausado = false;
        ui.mostrarPausa(m, false, false, false, numeros);
        if (papel === 'invitado') {
          // Me retiro yo: los demás siguen (el anfitrión me saca de la partida)
          mandar(MSJ.sale, {});
          me.retire = true;
          m.retiro = true;
          m.fin = true;
        } else m.terminar(true);
      },
      musica: () => musicaLavado.alternar(),
      sonido: () => alternarSonido(),
      numeros: () => {
        numeros = !numeros;
        if (this.dib) this.dib.numerosVisibles = numeros;
        return numeros;
      },
      ataque: () => {
        if (!puedeApuntar(yoJ.disfraz.id)) return false;
        yoJ.manual = !yoJ.manual;
        this.p.manual = yoJ.manual;
        void this.o.guardar(this.p).catch(() => undefined);
        return yoJ.manual;
      },
    };
    const ui = new Interfaz(this.raiz, yo, nombres, acciones, colores, papel !== 'invitado');
    this.ui = ui;
    const dib = new Dibujo({ lienzo: this.lienzo, yo, colores: varios ? colores : [] });
    this.dib = dib;
    const carga = this.espera(conTutorial ? 'El tutorial' : 'Entrando a la cara', 'Mojando la toalla…', null);
    try {
      // La piel es la de quien tiene la sala (se juega dentro de su cara)
      await dib.cargar(m, config.jugadores[0].rol, config.jugadores[0].aspecto?.piel);
    } finally {
      carga.cerrar();
    }
    dib.alEfecto = (e) => {
      sonarEfecto(e, yo);
      ui.efecto(e, m);
    };
    const espejo = papel === 'invitado' ? new Espejo(m, yo) : null;
    if (papel === 'invitado') {
      for (const j of m.jug) j.remoto = j.i !== yo;
      ui.restante = (_m, j) => restanteEspejo(j);
      mandar(MSJ.dentro, {});
    }
    if (papel === 'anfitrion') for (const j of m.jug) j.remoto = j.i !== 0;
    const tuto = conTutorial?.(m) ?? null;
    this.tuto = tuto;

    // ------------------------------------------------------------------ Controles
    type Dedo = { id: number; x0: number; y0: number; x: number; y: number };
    let dedo: Dedo | null = null;
    let dedoMira: Dedo | null = null;
    /** El mouse apunta (en el computador, con el ataque a mano). */
    let raton: [number, number] | null = null;
    const teclas = new Set<string>();
    const joy = document.createElement('div');
    joy.className = 'lv-joy';
    joy.innerHTML = '<i></i>';
    const joyMira = document.createElement('div');
    joyMira.className = 'lv-joy lv-joy-mira';
    joyMira.innerHTML = '<i></i>';
    this.raiz.append(joy, joyMira);
    const ponerJoy = (el: HTMLElement, x: number, y: number) => {
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.classList.add('si');
    };
    const abajo = (e: PointerEvent) => {
      if ((e.target as HTMLElement) !== this.lienzo) return;
      activar();
      // Con el ataque a mano en el celular: la mitad derecha apunta y la izquierda camina
      const derecha = yoJ.manual && e.pointerType !== 'mouse' && e.clientX > this.raiz.clientWidth * 0.5;
      if (derecha) {
        if (dedoMira) return;
        dedoMira = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY };
        ponerJoy(joyMira, e.clientX, e.clientY);
        return;
      }
      if (dedo) return;
      dedo = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY };
      ponerJoy(joy, e.clientX, e.clientY);
    };
    const moverJoy = (d: Dedo, el: HTMLElement, e: PointerEvent) => {
      d.x = e.clientX;
      d.y = e.clientY;
      const dx = d.x - d.x0, dy = d.y - d.y0, dd = Math.hypot(dx, dy);
      // El centro sigue al dedo si se va muy lejos
      if (dd > 56) {
        d.x0 = d.x - (dx / dd) * 56;
        d.y0 = d.y - (dy / dd) * 56;
        el.style.left = `${d.x0}px`;
        el.style.top = `${d.y0}px`;
      }
      const k = Math.min(1, dd / 56);
      (el.firstChild as HTMLElement).style.transform = `translate(${(dx / (dd || 1)) * k * 30}px, ${(dy / (dd || 1)) * k * 30}px)`;
    };
    const mueve = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') raton = [e.clientX, e.clientY];
      if (dedo && e.pointerId === dedo.id) moverJoy(dedo, joy, e);
      if (dedoMira && e.pointerId === dedoMira.id) moverJoy(dedoMira, joyMira, e);
    };
    const arriba = (e: PointerEvent) => {
      if (dedo && e.pointerId === dedo.id) {
        dedo = null;
        joy.classList.remove('si');
        (joy.firstChild as HTMLElement).style.transform = '';
      }
      if (dedoMira && e.pointerId === dedoMira.id) {
        dedoMira = null;
        joyMira.classList.remove('si');
        (joyMira.firstChild as HTMLElement).style.transform = '';
      }
    };
    const tecla = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.type === 'keydown') {
        teclas.add(k);
        if ((k === 'escape' || k === 'p') && !m.pausa && !tuto) acciones.pausa(!pausado);
      } else teclas.delete(k);
    };
    // Al irse el celular a segundo plano se abre la pausa (y al volver sigue ahí, esperando)
    const quitarFondo = fondo.alPausar(() => {
      if (!pausado && !m.fin && !tuto) acciones.pausa(true);
    });
    this.lienzo.addEventListener('pointerdown', abajo);
    window.addEventListener('pointermove', mueve);
    window.addEventListener('pointerup', arriba);
    window.addEventListener('pointercancel', arriba);
    window.addEventListener('keydown', tecla);
    window.addEventListener('keyup', tecla);
    const redimensionar = () => dib.ajustar();
    window.addEventListener('resize', redimensionar);
    let contextoPerdido = false;
    const perdido = (e: Event) => {
      e.preventDefault();
      contextoPerdido = true;
      if (!pausado && !tuto) acciones.pausa(true);
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
          my = (dy / d) * k;
        }
      }
      if (teclas.has('arrowleft') || teclas.has('a')) mx -= 1;
      if (teclas.has('arrowright') || teclas.has('d')) mx += 1;
      if (teclas.has('arrowup') || teclas.has('w')) my -= 1;
      if (teclas.has('arrowdown') || teclas.has('s')) my += 1;
      return [mx, my];
    };
    /** Hacia dónde apunta (segundo dedo o mouse); si no apunta a nada nuevo, se queda donde iba. */
    const apuntar = () => {
      if (!yoJ.manual) return;
      if (dedoMira) {
        const dx = dedoMira.x - dedoMira.x0, dy = dedoMira.y - dedoMira.y0, d = Math.hypot(dx, dy);
        if (d > 8) {
          yoJ.ax = dx / d;
          yoJ.ay = dy / d;
        }
      } else if (raton) {
        const [px, py] = dib.aPantalla(yoJ.x, yoJ.y);
        const dx = raton[0] - px, dy = raton[1] - (py - 20), d = Math.hypot(dx, dy);
        if (d > 10) {
          yoJ.ax = dx / d;
          yoJ.ay = dy / d;
        }
      } else if (Math.hypot(yoJ.vx, yoJ.vy) > 20 && !dedoMira) {
        // Sin segundo dedo, apunta hacia donde camina (como antes) hasta que se use el otro dedo
        if (this.tactil && !apuntoAlgunaVez) {
          yoJ.ax = yoJ.dx;
          yoJ.ay = yoJ.dy;
        }
      }
      if (dedoMira) apuntoAlgunaVez = true;
    };
    let apuntoAlgunaVez = false;

    // ------------------------------------------------------------------ Con otros (sala)
    let efDesde = 0;
    let seq = 0;
    let tFoto = 0;
    let tInv = 0;
    let claveInv = '';
    let tInvRepetir = -1;
    let tMando = 0;
    let ultimoMando = '';
    let resumenLlegado: ResumenPartida | null = null;
    let notaFin = '';
    let anfitrionSeFue = false;
    let anfitrionCortado = false;
    /** Anfitrión: quién ya cargó, quién está sin conexión (desde cuándo), quién se fue. */
    const cargados = new Set<number>();
    const cortados = new Map<number, number>();
    const porCorte = new Set<number>();
    const salieron = new Set<number>();
    const t0 = performance.now();
    const sacar = (i: number, texto: string) => {
      const j = m.jug[i];
      if (!j || salieron.has(i)) return;
      salieron.add(i);
      j.fuera = true;
      ui.aviso(texto, 3);
    };
    if (sala && varios) {
      quitar.push(
        sala.al(MSJ.pausa, (d, de) => {
          const x = d as { si: boolean; n: number };
          const antes = nPausaDe.get(de.id) ?? 0;
          if (x.n <= antes) return;
          nPausaDe.set(de.id, x.n);
          if (pausado === !!x.si) return;
          pausado = !!x.si;
          ui.mostrarPausa(m, pausado, musicaLavado.muda, silenciado(), numeros);
          if (pausado) ui.aviso(`${de.nombre} pausó el juego`);
          musicaLavado.pausar(pausado);
        }),
        sala.alCorte((cortado, q) => {
          const i = indice.get(q.id);
          if (i === undefined) return;
          if (i === 0 && papel === 'invitado') anfitrionCortado = cortado;
          if (papel !== 'anfitrion') return;
          if (cortado) {
            if (!cortados.has(i)) cortados.set(i, performance.now());
          } else {
            cortados.delete(i);
            // Volvió: entra de una, al ladito de alguien que esté jugando
            if (porCorte.has(i) && !salieron.has(i)) {
              porCorte.delete(i);
              const j = m.jug[i];
              const guia = m.jug.find((x) => x.activo && x !== j) ?? m.jug[0];
              j.fuera = false;
              j.x = guia.x + 30;
              j.y = guia.y;
              j.invul = 2.5;
              ui.aviso(`¡${nombres[i]} volvió!`, 2.4);
            }
          }
        }),
      );
      if (papel === 'anfitrion') {
        quitar.push(
          sala.al(MSJ.mando, (d, de) => {
            const i = indice.get(de.id);
            if (i === undefined || i === 0) return;
            const x = d as Mando;
            const j = m.jug[i];
            cargados.add(i);
            if (!j.caido && !j.fuera && Number.isFinite(x.x) && Number.isFinite(x.y)) {
              j.x = x.x;
              j.y = x.y;
            }
            j.vx = Number(x.vx) || 0;
            j.vy = Number(x.vy) || 0;
            j.vistaW = Math.max(300, Math.min(1400, Number(x.w) || 780));
            j.vistaH = Math.max(200, Math.min(1400, Number(x.h) || 360));
            const l = Math.hypot(x.ax, x.ay);
            if (l > 0.1) {
              j.ax = x.ax / l;
              j.ay = x.ay / l;
            }
            j.manual = !!x.man && puedeApuntar(j.disfraz.id);
          }),
          sala.al(MSJ.accion, (d, de) => {
            const i = indice.get(de.id);
            if (i === undefined || i === 0) return;
            const x = d as Accion;
            if (x.a === 'escoger') m.escoger(i, Number(x.k), x.n);
            else if (x.a === 'tirar') m.tirarCartas(i, x.n);
            else if (x.a === 'saltar') m.saltarCartas(i, x.n);
            else if (x.a === 'vetar') m.vetar(i, Number(x.k), x.n);
            else if (x.a === 'cofre') m.cerrarCofre(i, x.n);
            else if (x.a === 'carta') m.escogerCarta(i, (x.c ?? null) as IdCarta | null, x.n);
          }),
          sala.al(MSJ.dentro, (_d, de) => {
            const i = indice.get(de.id);
            if (i !== undefined) cargados.add(i);
          }),
          sala.al(MSJ.sale, (_d, de) => {
            const i = indice.get(de.id);
            if (i !== undefined && i > 0) sacar(i, `${nombres[i]} se retiró. ¡Los demás siguen!`);
          }),
          sala.alCambiar((js) => {
            // Si alguien se fue de la sala, se sale de la partida
            for (const [id, i] of indice) if (i > 0 && !js.some((x) => x.id === id)) sacar(i, `${nombres[i]} se fue. ¡Los demás siguen!`);
          }),
        );
      } else {
        quitar.push(
          sala.al(MSJ.foto, (d) => espejo?.aplicar((d as { b: string }).b)),
          sala.al(MSJ.inv, (d) => aplicarInventario(m, (d as { jug: ReturnType<typeof inventarioDe> }).jug)),
          sala.al(MSJ.fin, (d) => {
            const x = d as { resumenes?: ResumenPartida[] };
            resumenLlegado = x.resumenes?.[yo] ?? null;
            m.fin = true;
          }),
          sala.alFin((_motivo, texto) => {
            anfitrionSeFue = true;
            this.salaAcabada = true;
            notaFin = texto;
            m.fin = true;
          }),
        );
      }
    }

    // ------------------------------------------------------------------ El bucle
    let ultimo = performance.now();
    let acumulado = 0;
    let tJefe = 0;
    let tFinEspera = 0;
    musicaLavado.jefe = false;
    musicaLavado.intensidad = 0;
    const resumen = await new Promise<ResumenPartida | null>((ok) => {
      terminar = ok;
      // El bucle se detiene solo en segundo plano (no gasta batería escondido) y vuelve sin saltos
      const bucle = (_: number, ahora: number) => {
        if (!terminar) return cuadrosJuego.detener();
        // 30 cuadros por segundo como máximo (el celular no se calienta)
        if (ahora - ultimo < 1000 / 31) return;
        const dt = Math.min(0.1, (ahora - ultimo) / 1000);
        ultimo = ahora;
        // ¿Hay que esperar a alguien? (sin conexión o todavía cargando)
        let esperaCorte = false, cargando = false;
        const sinConexion: string[] = [];
        if (papel === 'anfitrion' && varios) {
          for (const [i, desde] of cortados) {
            const j = m.jug[i];
            if (j.fuera) continue;
            if (ahora - desde > ESPERA_CORTE * 1000) {
              j.fuera = true;
              porCorte.add(i);
              ui.aviso(`Seguimos sin ${nombres[i]}: cuando vuelva, entra de una`, 3.4);
            } else {
              esperaCorte = true;
              sinConexion.push(nombres[i]);
            }
          }
          for (let i = 1; i < n; i++) if (!cargados.has(i) && !salieron.has(i) && ahora - t0 < 15000) cargando = true;
          if (esperaCorte) ui.conexion(`Se cortó la conexión con ${sinConexion.join(' y ')}`, `Lo esperamos un ratico; si no vuelve, siguen sin ${sinConexion.length > 1 ? 'ellos' : 'él o ella'}.`);
          else if (cargando) ui.conexion('Esperando a que todos entren', 'Ya casi…');
          else ui.conexion(null);
        } else if (papel === 'invitado') {
          const sinFoto = !espejo!.ultimaFoto || ahora - espejo!.ultimaFoto > 3500;
          const otros: string[] = [];
          if (espejo!.banderas & FOTO_CORTE) for (let i = 0; i < n; i++) if (espejo!.cortados & (1 << i) && i !== yo) otros.push(nombres[i]);
          cargando = !espejo!.ultimaFoto || !!(espejo!.banderas & FOTO_CARGANDO);
          esperaCorte = (sinFoto && !!espejo!.ultimaFoto) || anfitrionCortado || otros.length > 0;
          if (anfitrionCortado || (sinFoto && espejo!.ultimaFoto)) ui.conexion(`Se cortó la conexión con ${nombres[0]}`, `${nombres[0]} tiene la partida: el juego quedó en pausa hasta que vuelva.`);
          else if (otros.length) ui.conexion(`Se cortó la conexión con ${otros.join(' y ')}`, 'Lo esperamos un ratico.');
          else if (cargando) ui.conexion('Esperando a que todos entren', 'Ya casi…');
          else ui.conexion(null);
        }
        const quieto = pausado || esperaCorte || cargando || contextoPerdido;

        const [mx, my] = entrada();
        this.red = {
          yo, pausado, esperaCorte, cargando, foto: espejo ? Math.round(ahora - espejo.ultimaFoto) : -1, banderas: espejo?.banderas ?? 0, cargados: [...cargados].join(','),
          pausa: m.pausa, mx, my, caido: yoJ.caido, fuera: yoJ.fuera, fin: m.fin,
        };
        apuntar();
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
          tuto?.actualizar(m, quieto ? 0 : dt);
        } else {
          espejo!.avanzar(dt);
          // Mi personaje se mueve aquí mismo (sin esperar la foto)
          if (!quieto && !m.pausa && !yoJ.caido && !yoJ.fuera && !m.fin) {
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
          // Le cuento al anfitrión dónde estoy y hacia dónde apunto (más seguido si me muevo)
          tMando += dt;
          const clave = `${Math.round(yoJ.x)},${Math.round(yoJ.y)},${Math.round(yoJ.ax * 20)},${Math.round(yoJ.ay * 20)},${yoJ.manual}`;
          if (tMando >= (clave !== ultimoMando ? 0.08 : 0.3)) {
            tMando = 0;
            ultimoMando = clave;
            const x: Mando = { x: yoJ.x, y: yoJ.y, vx: yoJ.vx, vy: yoJ.vy, w: dib.vistaW, h: dib.vistaH, ax: yoJ.ax, ay: yoJ.ay, man: yoJ.manual };
            mandar(MSJ.mando, x, true);
          }
        }
        // Al anfitrión le toca mandar la foto y el inventario
        if (papel === 'anfitrion' && sala && varios) {
          tFoto += dt;
          tInv += dt;
          if (tFoto >= 0.1) {
            tFoto = 0;
            let mascara = 0;
            for (const [i] of cortados) mascara |= 1 << i;
            const f = tomarFoto(m, efDesde, seq++, { banderas: (esperaCorte ? FOTO_CORTE : 0) | (cargando ? FOTO_CARGANDO : 0), cortados: mascara });
            efDesde = f.efHasta;
            mandar(MSJ.foto, { b: f.b }, true);
          }
          const inv = inventarioDe(m);
          // (el daño de cada arma cambia todo el tiempo: no cuenta como cambio, viaja en los repasos)
          const k = JSON.stringify(inv.map((x) => ({ ...x, danos: 0 })));
          if (k !== claveInv) {
            claveInv = k;
            tInv = 0;
            tInvRepetir = 0.35;
            mandar(MSJ.inv, { jug: inv }, true);
          } else if (tInv > 1.2 || (tInvRepetir > 0 && (tInvRepetir -= dt) <= 0)) {
            tInv = 0;
            tInvRepetir = -1;
            mandar(MSJ.inv, { jug: inv }, true);
          }
        }
        dib.dibujar(m, dt, quieto || !!m.pausa);
        ui.actualizar(m, dt, (i) => !sala || salieron.has(i) || sala.conectado(ids[i]));
        ui.revisar(m);
        if (varios) ui.companeros(m, (x, y) => dib.aPantalla(x, y));
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
          // El invitado espera un ratico el resumen del anfitrión (si no llega, arma el suyo)
          if (papel === 'invitado' && !resumenLlegado && !anfitrionSeFue && !me.retire) {
            tFinEspera += dt;
            if (tFinEspera < 2.5) return;
          }
          const t = terminar;
          terminar = null;
          // Al anfitrión le toca avisar (con el resumen de cada uno: el oro y el daño son de cada quien)
          if (papel === 'anfitrion' && sala && varios) mandar(MSJ.fin, { resumenes: m.jug.map((_, i) => m.resumen(i, true)) });
          setTimeout(() => t(papel === 'invitado' ? resumenLlegado : m.resumen(yo, varios)), 900);
        }
      };
      const cuadrosJuego = fondo.cuadros(bucle);
    });

    // ------------------------------------------------------------------ Final
    for (const q of quitar) q();
    this.lienzo.removeEventListener('pointerdown', abajo);
    window.removeEventListener('pointermove', mueve);
    window.removeEventListener('pointerup', arriba);
    window.removeEventListener('pointercancel', arriba);
    window.removeEventListener('keydown', tecla);
    window.removeEventListener('keyup', tecla);
    quitarFondo();
    window.removeEventListener('resize', redimensionar);
    joy.remove();
    joyMira.remove();
    tuto?.quitar();
    this.tuto = null;
    let que: 'otra' | 'menu' = 'menu';
    if (!tuto) {
      // Si es invitado y no llegó el resumen, se arma uno con lo que se ve
      const r: ResumenPartida = resumen ?? m.resumen(yo, varios);
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
      que = await ui.mostrarFin(r, { logros, monedas: this.o.amigo ? 0 : monedas, pareja: varios, nombreOtro: nombres[1 - yo] ?? '', nota: notaFin });
    }
    // Se suelta todo lo de la partida (y el contexto WebGL)
    this.lienzo.removeEventListener('webglcontextlost', perdido);
    this.lienzo.removeEventListener('webglcontextrestored', recuperado);
    dib.liberar();
    this.raiz.querySelectorAll('.lv-hud, .lv-pausa, .lv-capa, .lv-reloj, [class^="lv-velo"]').forEach((e) => e.remove());
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
    if (que === 'sala') return this.sala ? { codigo: this.sala.codigo, jugadores: this.sala.jugadores.length, anfitrion: this.sala.soyAnfitrion, amigos: this.sala.hayAmigos } : null;
    if (que === 'tutorial') return this.tuto ? { paso: this.tuto.paso, titulo: this.tuto.titulo } : null;
    if (!m) return null;
    const j = m.jug[0];
    switch (que) {
      case 'tiempo':
        m.t = v;
        break;
      case 'xp':
        m.xp += v;
        break;
      case 'subir':
        // Justo lo que falta para subir un nivel
        m.xp = Math.max(m.xp, m.xpReq());
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
      case 'caer': {
        // Tumba al jugador v (para probar la burbujita y que lo levanten)
        const q = m.jug[v];
        if (q) {
          q.vida = 1;
          q.invul = 0;
          q.revivesUsados = 99;
          m.herirJugador(q, 1e6, null);
        }
        break;
      }
      case 'juntar': {
        // Pone al jugador 0 al ladito del v
        const q = m.jug[v];
        if (q && m.jug[0] !== q) {
          m.jug[0].x = q.x + 14;
          m.jug[0].y = q.y;
        }
        break;
      }
    }
    return {
      t: m.t, nivel: m.nivel, enemigos: m.nVivos, eliminados: m.eliminados, vida: j.vida, calidad: this.dib?.calidad, pausa: m.pausa, oro: m.oro,
      jug: m.jug.map((q) => ({
        x: Math.round(q.x), y: Math.round(q.y), caido: q.caido, fuera: q.fuera, opciones: !!q.opciones, armas: q.armas.length, nombre: q.nombre,
        cofre: !!q.cofre, carta: !!q.cartaOpciones, pend: q.nivelesPend + q.cofresPend.length, acciones: q.acciones, manual: q.manual, oro: q.oro,
      })),
      fin: m.fin,
    };
  }
}

(window as unknown as { __lavado: typeof lavado }).__lavado = lavado;
export { yoMismo };
