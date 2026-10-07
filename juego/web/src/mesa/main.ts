// Juegos de Mesa: Él contra Ella en Dados Party, Mancala, Puntos y Cajas y Parchís.
// La mesa lleva los turnos (contra la IA, los dos en el mismo celular, cada uno en el suyo por internet o en una
// sala con código con amigos) y los dos muñequitos reaccionan arriba a cada jugada. Con amigos (o en el aparato de
// un amigo) todo va en modo neutro: nada personal de la pareja (src/neutro.ts).
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '../estilos.css';
import './mesa.css';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { NOMBRE_ROL, otro, type Rol } from '../casa/modelo';
import { leer } from '../casa/sincro';
import * as sonido from '../sonido';
import { enPausa } from '../segundo_plano';
import { avisoSuave, salirSuave } from '../transiciones';
import { Canal, type Invitacion } from './canal';
import { Escenario, type Lado } from './escenario';
import { type Entrada, JUEGOS } from './juegos';
import type { Final, JuegoMesa, Modo, NivelIA, Suceso, Vista } from './tipos';
import { alNeutro, amigoDeAqui, escHtml, esNeutro, modoAmigo, paginaDeSalida, ponerNeutro } from '../neutro';
import type { AspectoJugador, JugadorSala, Sala } from '../salas/tipos';

const params = new URLSearchParams(location.search);
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const CLAVE_SUELDO = 'nuestro-hogar-sueldo';
const CLAVE_PREFS = 'mesa-preferencias';
const CLAVE_VICTORIAS = 'nuestro-hogar-victorias';

function rolJugador(): Rol {
  if (modoAmigo()) return 'el';
  const p = params.get('rol');
  if (p === 'el' || p === 'ella') return p;
  const m = leer<{ rol?: Rol }>('nuestro-hogar-modo');
  return m?.rol === 'ella' ? 'ella' : 'el';
}
/** El lado del tablero de este celular («el» o «ella»: en una sala es el puesto que le tocó, no quién es). */
let yo = rolJugador();
/** El rol de este celular en la casa (o 'el' para un amigo): a esto se vuelve al salir de una sala. */
const yoCasa = yo;

/** Colores de los rivales de un amigo (nada de los muñecos de fábrica de la pareja). */
const RIVAL: Record<Rol, AspectoJugador> = {
  el: { cuerpo: 'el', piel: '#c27f52', pelo: '#3b2418', detalles: { ropa: '#f2c94c', ropa2: '#4a4a52', zapatos: '#f4efe6' } },
  ella: { cuerpo: 'ella', piel: '#f6c8a4', pelo: '#9a6233', detalles: { ropa: '#3fb5a3', ropa2: '#1d1d24', zapatos: '#e85d5d' } },
};
/**
 * Quién va en cada lado. Javier y Laura: Él y Ella con su ropa de la casa. Un amigo: él con su muñeco y sus colores
 * contra «Toto» o «Lulú» (la máquina) o contra el «Jugador 2» en el mismo celular. En una sala, lo que diga la sala.
 */
function ladosBase(modo: Modo = prefs.modo === 'local' ? 'local' : 'ia'): Record<Rol, Lado> {
  const a = amigoDeAqui();
  if (!a) return { el: { nombre: NOMBRE_ROL.el, cuerpo: 'el', vestir: true }, ella: { nombre: NOMBRE_ROL.ella, cuerpo: 'ella', vestir: true } };
  const otroCuerpo: Rol = a.aspecto.cuerpo === 'el' ? 'ella' : 'el';
  const rival = modo === 'local' ? 'Jugador 2' : otroCuerpo === 'el' ? 'Toto' : 'Lulú';
  return { el: { nombre: a.nombre, cuerpo: a.aspecto.cuerpo, aspecto: a.aspecto }, ella: { nombre: rival, cuerpo: otroCuerpo, aspecto: RIVAL[otroCuerpo] } };
}
let lados: Record<Rol, Lado>;
export const nombreDe = (r: Rol) => lados[r].nombre;
/** Pruebas: acelera las pausas de la IA y las reacciones. */
const RAPIDO = Math.max(1, Number(params.get('rapido')) || 1);

/** Azar con semilla (pruebas repetibles) o el del navegador. */
function crearAzar(semilla: number | null): () => number {
  if (semilla === null) return Math.random;
  let s = semilla >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const azar = crearAzar(params.has('semilla') ? Number(params.get('semilla')) : null);

const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms / RAPIDO));

interface Prefs {
  modo: Modo;
  nivel: NivelIA;
}
/** El menú tiene además la «Sala con código» (la partida en sí se juega «en línea»). */
type ModoMenu = Modo | 'sala';
let prefs: { modo: ModoMenu; nivel: NivelIA } = { modo: 'ia', nivel: 'normal', ...leer<Prefs>(CLAVE_PREFS) };
// Un amigo no tiene casa: no juega «en línea» (eso es por la casa de la pareja)
if (modoAmigo() && prefs.modo === 'linea') prefs.modo = 'sala';
lados = ladosBase();
const guardarPrefs = () => {
  try {
    localStorage.setItem(CLAVE_PREFS, JSON.stringify(prefs));
  } catch {
    /* sin almacenamiento */
  }
};

// ---------------------------------------------------------------------------
// Avisos y hojas
const relojAviso = { id: 0 };
/** Aviso abajo: entra con un brinquito y se va bajando suave. */
export function aviso(texto: string, ms = 2200) {
  avisoSuave($('aviso'), texto, ms, relojAviso);
}

function hoja(html: string, botones: { texto: string; clase?: string; alTocar?: () => void }[]) {
  const h = $('hoja');
  $('hoja-cuerpo').innerHTML = html;
  const fila = $('hoja-botones');
  fila.innerHTML = '';
  for (const b of botones) {
    const el = document.createElement('button');
    el.className = `boton ${b.clase ?? 'boton-papel'}`;
    el.textContent = b.texto;
    el.onclick = () => {
      salirSuave(h);
      h.hidden = true;
      b.alTocar?.();
    };
    fila.append(el);
  }
  h.hidden = false;
}

function pintarSonido() {
  for (const b of document.querySelectorAll('.boton-sonido')) b.classList.toggle('apagado', sonido.silenciado());
}

// ---------------------------------------------------------------------------
// Menú
function pintarMenu() {
  const cont = $('juegos');
  cont.innerHTML = JUEGOS.filter((j) => !j.oculto).map(
    (j) => `<button class="juego-carta" data-juego="${j.id}" style="--color:${j.color}">
      <span class="juego-icono">${j.icono}</span>
      <span class="juego-texto"><b>${j.nombre}</b><small>${j.resumen}</small></span>
    </button>`,
  ).join('');
  for (const s of document.querySelectorAll('[data-otro]')) s.textContent = modoAmigo() ? 'la máquina' : nombreDe(otro(yo));
  for (const b of document.querySelectorAll<HTMLElement>('[data-modo]')) b.setAttribute('aria-pressed', String(b.dataset.modo === prefs.modo));
  for (const b of document.querySelectorAll<HTMLElement>('[data-nivel]')) b.setAttribute('aria-pressed', String(b.dataset.nivel === prefs.nivel));
  $('mesa-nivel').hidden = prefs.modo !== 'ia';
  const nota = $('menu-nota');
  nota.hidden = prefs.modo !== 'linea' && prefs.modo !== 'sala';
  if (prefs.modo === 'sala') {
    nota.textContent = 'Toca un juego: se abre una sala con código para jugar con otra persona, cada uno en su celular. Quien quiera unirse toca «Unirme con código».';
  } else if (prefs.modo === 'linea') {
    nota.textContent = canal?.listo
      ? canal.otroPresente
        ? `${nombreDe(otro(yo))} está en la mesa. Elige un juego para invitarl${otro(yo) === 'ella' ? 'a' : 'o'}.`
        : `Elige un juego: le llega la invitación a ${nombreDe(otro(yo))} en la casa.`
      : 'Conectando con la casa en línea…';
  }
}

function mostrar(id: 'menu' | 'partida' | 'final') {
  $('menu').hidden = id !== 'menu';
  // El final sale encima del tablero: arriba siguen los muñequitos celebrando o haciendo drama
  $('partida').hidden = id === 'menu';
  $('final').hidden = id !== 'final';
}

// ---------------------------------------------------------------------------
// Partida
let escenario: Escenario | null = null;
let partida: Partida | null = null;
let canal: Canal | null = null;

/** Por dónde viajan las jugadas en línea: el canal de la pareja o una sala con código. */
interface RedMesa {
  movimiento(id: string, n: number, m: unknown): void;
  pedir(id: string, desde: number): void;
  salir(id: string): void;
  escena?(id: string, escena: string): void;
}

class Partida {
  e: unknown;
  vista!: Vista<unknown, unknown>;
  /** En línea: por dónde van las jugadas (el canal de la pareja si no se dice otra cosa). */
  red: RedMesa | null = null;
  /** En una sala: la sala y el id del otro jugador en ella (para saber si se cortó). */
  sala: Sala | null = null;
  otroSala = '';
  private esperando: ((m: unknown) => void) | null = null;
  private turnoPermitido: Rol | null = null;
  terminada = false;
  /** Movimientos jugados (en línea: el número de orden de cada mensaje). */
  n = 0;
  private recibidos = new Map<number, unknown>();
  private turnoAnterior: Rol | null = null;
  private alRecibir: (() => void) | null = null;

  constructor(
    public juego: JuegoMesa,
    public modo: Modo,
    public nivel: NivelIA,
    public empieza: Rol,
    /** En línea: identificador de la partida (los dos celulares lo comparten). */
    public id = `${Date.now().toString(36)}${Math.floor(azar() * 1e6).toString(36)}`,
  ) {
    this.e = juego.reglas.inicial(empieza);
  }

  /** ¿El que tiene el turno juega en este celular? */
  private humanoAqui(t: Rol) {
    return this.modo === 'local' || t === yo;
  }

  async correr() {
    const { juego } = this;
    const reglas = juego.reglas;
    const tablero = $('tablero');
    tablero.innerHTML = '';
    tablero.className = `tablero tablero-${juego.id}`;
    this.vista = juego.crearVista({
      raiz: tablero,
      yo,
      modo: this.modo,
      nombres: { el: nombreDe('el'), ella: nombreDe('ella') },
      jugar: (m) => {
        if (!this.esperando) return;
        const f = this.esperando;
        this.esperando = null;
        f(m);
      },
      suceso: (s) => this.suceso(s),
      azar,
      sonido: (n) => (sonido as unknown as Record<string, (() => void) | undefined>)[n]?.(),
    });
    this.vista.pintar(this.e);
    this.marcador();
    await escenario!.inicio(this.empieza);
    while (!this.terminada) {
      const fin = reglas.fin(this.e);
      if (fin) {
        await this.terminar(fin);
        return;
      }
      const t = reglas.turno(this.e);
      this.pintarTurno(t);
      escenario!.turno(t, this.humanoAqui(t));
      let m: unknown;
      if (this.humanoAqui(t)) {
        this.turnoPermitido = t;
        this.vista.permitir(t);
        m = await new Promise((r) => (this.esperando = r));
        this.vista.permitir(null);
        this.turnoPermitido = null;
        if (this.terminada) return;
        if (this.modo === 'linea') this.redActual()?.movimiento(this.id, this.n, m);
      } else if (this.modo === 'ia') {
        // Deja terminar las reacciones de la jugada anterior antes de jugar (se alcanzan a ver); durante una
        // escena premium la IA espera a que termine
        await cineLibre();
        await escenario!.calma(this.turnoAnterior === t ? 1800 : 3200);
        if (this.terminada) return;
        escenario!.pensar(t, true);
        const t0 = performance.now();
        m = juego.ia(this.e, this.nivel, azar);
        // Que se note que piensa, sin hacer esperar de más (si sigue jugando él mismo, va más rápido)
        const sigue = this.turnoAnterior === t;
        await esperar(Math.max(0, (sigue ? 280 + azar() * 220 : 650 + azar() * 700) - (performance.now() - t0)));
        escenario!.pensar(t, false);
        if (this.terminada) return;
      } else {
        escenario!.pensar(t, true);
        m = await this.recibir(this.n);
        escenario!.pensar(t, false);
        if (this.terminada) return;
      }
      this.turnoAnterior = t;
      const antes = this.e;
      const puntosAntes = reglas.puntos(antes);
      this.e = reglas.aplicar(antes, m);
      this.n++;
      await this.vista.animar(antes, m, this.e);
      if (this.terminada) return;
      this.marcador(puntosAntes);
      guardarPartida(this);
    }
  }

  /** En línea: espera el movimiento número `n` del otro celular. */
  private recibir(n: number): Promise<unknown> {
    return new Promise((r) => {
      const mirar = () => {
        if (this.terminada) return r(null);
        if (!this.recibidos.has(n)) return;
        this.alRecibir = null;
        const m = this.recibidos.get(n);
        this.recibidos.delete(n);
        r(m);
      };
      this.alRecibir = () => {
        mirar();
        if (this.alRecibir === null || this.terminada) clearInterval(repetir);
      };
      // Si se perdió el mensaje, se vuelve a pedir cada tanto
      const repetir = window.setInterval(() => {
        if (this.terminada || this.alRecibir === null) clearInterval(repetir);
        else this.redActual()?.pedir(this.id, n);
      }, 4000);
      this.alRecibir();
    });
  }

  llegaMovimiento(n: number, m: unknown) {
    if (n < this.n) return;
    this.recibidos.set(n, m);
    this.alRecibir?.();
  }

  /** Volvió de segundo plano: si estaba esperando la jugada del otro, la pide de una (se pudo perder afuera). */
  alVolver() {
    if (this.modo === 'linea' && !this.terminada && this.alRecibir) this.redActual()?.pedir(this.id, this.n);
  }

  redActual(): RedMesa | null {
    return this.red ?? canal;
  }

  private suceso(s: Suceso) {
    escenario?.suceso(s);
    if ('texto' in s && s.texto) etiqueta(s.texto, s.tipo === 'jugada' && s.calidad === 'genial');
  }

  private pintarTurno(t: Rol) {
    const p = $('turno');
    p.textContent = this.modo === 'local' ? `Turno de ${nombreDe(t)}` : t === yo ? 'Te toca' : `Le toca a ${nombreDe(t)}`;
    p.dataset.quien = t;
  }

  marcador(antes?: Record<Rol, number>) {
    const pts = this.juego.reglas.puntos(this.e);
    escenario?.marcador(pts);
    if (antes) {
      const lider = (p: Record<Rol, number>): Rol | null => (p.el > p.ella ? 'el' : p.ella > p.el ? 'ella' : null);
      const a = lider(antes), b = lider(pts);
      if (b && a !== b) escenario?.adelante(b);
    }
  }

  async terminar(fin: Final) {
    if (this.terminada) return;
    this.terminada = true;
    borrarPartida();
    $('turno').textContent = '';
    await escenario!.final(fin);
    const g = fin.ganador;
    $('final-titulo').textContent = g === null ? '¡Empate!' : this.modo === 'local' ? `¡Ganó ${nombreDe(g)}!` : g === yo ? '¡Ganaste!' : `Ganó ${nombreDe(g)}`;
    $('final-marcador').innerHTML = `${nombreDe('el')} <b>${fin.puntos.el}</b> · ${nombreDe('ella')} <b>${fin.puntos.ella}</b>`;
    const premio = premioDe(this, fin);
    const pp = $('final-premio');
    pp.hidden = !premio;
    if (premio) {
      pagar(premio);
      pp.textContent = `+${premio} monedas para la casa`;
    }
    // Para los trofeos de la casa: cuántas ha ganado quien juega en este celular
    if (g === yo && !modoAmigo()) contarVictoria();
    sonido.fin(g === null || g === yo || this.modo === 'local');
    mostrar('final');
  }

  /** Salir a media partida. */
  abandonar() {
    this.terminada = true;
    if (this.esperando) this.esperando(null);
    this.alRecibir?.();
    this.vista?.destruir();
    borrarPartida();
    if (this.modo === 'linea') this.redActual()?.salir(this.id);
  }
}

/** Monedas para la casa (la economía va a la cuarta parte de lo que era: se gana con calma). */
function premioDe(p: Partida, fin: Final) {
  // (un amigo no tiene casa: nada de monedas)
  if (modoAmigo()) return 0;
  if (p.modo === 'ia') {
    if (fin.ganador !== yo) return fin.ganador === null ? 1 : 0;
    return p.nivel === 'dificil' ? 6 : p.nivel === 'normal' ? 4 : 2;
  }
  // Entre los dos: cada celular cobra lo suyo (en local se paga una vez)
  if (p.modo === 'local') return 3;
  return fin.ganador === yo ? 3 : 1;
}

function pagar(monedas: number) {
  try {
    localStorage.setItem(CLAVE_SUELDO, String((Number(localStorage.getItem(CLAVE_SUELDO)) || 0) + monedas));
  } catch {
    /* sin almacenamiento */
  }
}

function contarVictoria() {
  try {
    localStorage.setItem(CLAVE_VICTORIAS, String((Number(localStorage.getItem(CLAVE_VICTORIAS)) || 0) + 1));
  } catch {
    /* sin almacenamiento */
  }
}

let tEtiqueta = 0;
function etiqueta(texto: string, grande = false) {
  const el = $('etiqueta');
  el.textContent = texto;
  el.classList.toggle('grande', grande);
  el.hidden = false;
  el.classList.remove('sale');
  void el.offsetWidth;
  el.classList.add('sale');
  clearTimeout(tEtiqueta);
  tEtiqueta = window.setTimeout(() => (el.hidden = true), (grande ? 2200 : 1500) / RAPIDO);
}

// Partida guardada (contra la IA o local): se retoma si se cierra la app
const CLAVE_PARTIDA = modoAmigo() ? 'amigo-mesa-partida' : 'mesa-partida';
interface Guardada {
  juego: JuegoMesa['id'];
  modo: Modo;
  nivel: NivelIA;
  empieza: Rol;
  e: unknown;
  n: number;
}
function guardarPartida(p: Partida) {
  if (p.modo === 'linea') return;
  try {
    localStorage.setItem(CLAVE_PARTIDA, JSON.stringify({ juego: p.juego.id, modo: p.modo, nivel: p.nivel, empieza: p.empieza, e: p.e, n: p.n } satisfies Guardada));
  } catch {
    /* sin almacenamiento */
  }
}
function borrarPartida() {
  try {
    localStorage.removeItem(CLAVE_PARTIDA);
  } catch {
    /* nada */
  }
}

let quienEmpieza: Rol = azar() < 0.5 ? 'el' : 'ella';

async function jugar(
  entrada: Entrada,
  modo: Modo,
  opciones: { empieza?: Rol; id?: string; e?: unknown; n?: number; red?: RedMesa; sala?: Sala; otroSala?: string } = {},
) {
  const juego = await entrada.cargar();
  if (!juego) {
    aviso(`${entrada.nombre} está en construcción.`);
    return;
  }
  partida?.abandonar();
  const empieza = opciones.empieza ?? quienEmpieza;
  quienEmpieza = otro(empieza);
  $('partida-juego').textContent = juego.nombre;
  mostrar('partida');
  // Fuera de una sala, cada lado es el de siempre (Él y Ella, o el amigo contra la máquina o el Jugador 2)
  if (!opciones.sala) lados = ladosBase(modo);
  escenario ??= new Escenario($<HTMLCanvasElement>('escenario-lienzo'), $('efectos'), RAPIDO);
  await escenario.preparar(yo, lados);
  const p = new Partida(juego, modo, prefs.nivel, empieza, opciones.id);
  p.red = opciones.red ?? null;
  p.sala = opciones.sala ?? null;
  p.otroSala = opciones.otroSala ?? '';
  otroFuera = false;
  if (opciones.e !== undefined) {
    p.e = opciones.e;
    p.n = opciones.n ?? 0;
  }
  partida = p;
  try {
    await p.correr();
  } catch (err) {
    console.error(err);
    aviso('Algo falló en la partida. Vuelve a intentarlo.');
  }
}

async function elegirJuego(id: string, colores?: 1 | 2) {
  const entrada = JUEGOS.find((j) => j.id === id);
  if (!entrada) return;
  sonido.activar();
  sonido.toque();
  // El Parchís se juega con un color cada uno (un dado) o con dos (dos dados al centro)
  if (id === 'parchis' && !colores) {
    hoja(`<h3>Parchís</h3><p>¿Cada uno con <b>un color</b> (4 fichas y un dado) o con <b>dos colores</b> (8 fichas y dos dados que caen al centro)?</p>`, [
      { texto: '1 color', alTocar: () => void elegirJuego('parchis', 1) },
      { texto: '2 colores', clase: 'boton-tomate', alTocar: () => void elegirJuego('parchis2', 2) },
    ]);
    return;
  }
  // Con cartas secretas no se puede compartir el celular: contra la máquina, en línea o en sala
  if (prefs.modo === 'local' && entrada.secreto) {
    hoja(`<h3>${entrada.nombre}</h3><p>Aquí cada uno tiene <b>cartas secretas</b>, así que no se puede jugar pasándose el mismo celular. ¿Contra la máquina o en línea, cada uno en su celular?</p>`, [
      { texto: 'Contra la máquina', alTocar: () => void jugar(entrada, 'ia') },
      {
        texto: 'En línea',
        clase: 'boton-tomate',
        alTocar: () => {
          prefs.modo = modoAmigo() ? 'sala' : 'linea';
          if (prefs.modo === 'linea') iniciarCanal();
          pintarMenu();
          void elegirJuego(id, colores);
        },
      },
    ]);
    return;
  }
  if (prefs.modo === 'sala') return abrirSalaMesa(entrada.id);
  if (prefs.modo !== 'linea') return jugar(entrada, prefs.modo);
  // En línea: invitar al otro y esperar a que acepte
  if (!canal?.listo) {
    hoja(`<h3>Sin conexión</h3><p>Para jugar en línea, los dos tienen que estar en la misma casa en línea (se configura en la casa, en Ajustes).</p>`, [
      { texto: 'Entendido', clase: 'boton-tomate' },
    ]);
    return;
  }
  const inv: Invitacion = { id: `${Date.now().toString(36)}${Math.floor(azar() * 1e6).toString(36)}`, juego: entrada.id, empieza: quienEmpieza, de: yo };
  quienEmpieza = otro(quienEmpieza);
  hoja(`<h3>Invitaste a ${nombreDe(otro(yo))}</h3><p>${entrada.nombre}: esperando a que acepte…</p>`, [
    { texto: 'Cancelar', alTocar: () => canal?.cancelar(inv.id) },
  ]);
  const ok = await canal.invitar(inv);
  if (!ok) {
    $('hoja').hidden = true;
    aviso(`${nombreDe(otro(yo))} no aceptó (o no estaba). Intenta en un ratico.`, 3000);
    return;
  }
  $('hoja').hidden = true;
  await jugar(entrada, 'linea', { empieza: inv.empieza, id: inv.id });
}

function alInvitacion(inv: Invitacion) {
  const entrada = JUEGOS.find((j) => j.id === inv.juego);
  if (!entrada || inv.de === yo || salaMesa) return;
  sonido.aviso();
  hoja(`<h3>¡${nombreDe(inv.de)} te invita!</h3><p>¿Una partida de <b>${entrada.nombre}</b>?</p>`, [
    { texto: 'Ahora no', alTocar: () => canal?.responder(inv, false) },
    {
      texto: '¡Juguemos!',
      clase: 'boton-tomate',
      alTocar: () => {
        canal?.responder(inv, true);
        void jugar(entrada, 'linea', { empieza: inv.empieza, id: inv.id });
      },
    },
  ]);
}

// ---------------------------------------------------------------------------
// Conexión en línea: si el otro se va a segundo plano (otra app, pantalla bloqueada) o se le cae el internet, la
// partida se pausa con «se cortó la conexión» hasta que vuelva
let otroFuera = false;
/** Desde cuándo se ve cortada (la presencia de Supabase titila un instante al reconectar: se espera un poquito). */
let cortadaDesde = 0;
function revisarConexion() {
  const p = partida;
  if (p?.sala) return revisarConexionSala(p, p.sala);
  const enLinea = !!p && p.modo === 'linea' && !p.terminada && !!canal && $('final').hidden;
  const cortada = enLinea && (otroFuera || !canal!.listo || !canal!.otroPresente);
  if (!cortada) cortadaDesde = 0;
  else if (!cortadaDesde) cortadaDesde = performance.now();
  const ver = cortada && (otroFuera || performance.now() - cortadaDesde > 2500);
  const caja = $('pausa-linea');
  if (ver === !caja.hidden) return;
  caja.hidden = !ver;
  if (ver) {
    $('pausa-linea-texto').textContent = otroFuera
      ? `${nombreDe(otro(yo))} salió de la app un momentico… esperando a que vuelva.`
      : `Se cortó la conexión con ${nombreDe(otro(yo))}… esperando a que vuelva.`;
  } else if (enLinea) aviso(`¡${nombreDe(otro(yo))} volvió! Sigan jugando.`);
}
/** En una sala: la sala sabe si el otro está conectado (latidos y segundo plano). */
function revisarConexionSala(p: Partida, s: Sala) {
  const enJuego = !p.terminada && $('final').hidden;
  const cortada = enJuego && !s.conectado(p.otroSala);
  const caja = $('pausa-linea');
  if (cortada === !caja.hidden) return;
  caja.hidden = !cortada;
  const o = nombreDe(otro(yo));
  if (cortada) $('pausa-linea-texto').textContent = `Se cortó la conexión con ${o} (o salió de la app un momentico)… esperando a que vuelva.`;
  else if (enJuego) aviso(`¡${o} volvió! Sigan jugando.`);
}
window.setInterval(() => {
  if (!enPausa()) revisarConexion();
}, 500);

function iniciarCanal() {
  if (canal) return;
  canal = new Canal(yo, {
    alCambiar: () => {
      if (!$('menu').hidden) pintarMenu();
      revisarConexion();
    },
    alFuera: (si) => {
      otroFuera = si;
      revisarConexion();
    },
    alVolver: () => partida?.alVolver(),
    alInvitacion,
    alMovimiento: (id, n, m) => {
      if (partida && partida.id === id) partida.llegaMovimiento(n, m);
    },
    alEscena: (id, escena, de) => {
      if (partida && partida.id === id && !esNeutro()) void lanzarEscena(escena, de, false);
    },
    alSalir: (id) => {
      if (partida && partida.id === id && partida.modo === 'linea') {
        partida.abandonar();
        partida = null;
        aviso(`${nombreDe(otro(yo))} salió de la partida.`, 3000);
        mostrar('menu');
        pintarMenu();
      }
    },
  });
  void canal.conectar();
}

// ---------------------------------------------------------------------------
// Botones
// Música suave de fondo (arranca con el primer toque: los navegadores no dejan sonar antes)
let conMusica = false;
function arrancarMusica() {
  if (conMusica) return;
  conMusica = true;
  sonido.activar();
  sonido.musica.iniciar('menu', 84, 'mesa');
}
function pintarMusica() {
  for (const b of document.querySelectorAll('.boton-musica')) b.classList.toggle('apagado', sonido.musica.apagada());
}

document.addEventListener('pointerdown', arrancarMusica, { once: true });
document.addEventListener('click', (ev) => {
  const t = ev.target as HTMLElement;
  const b = t.closest<HTMLElement>('button');
  if (!b) return;
  if (b.classList.contains('boton-musica')) {
    sonido.musica.alternar();
    pintarMusica();
    return;
  }
  if (b.closest('.juego-sala')) return;
  if (b.dataset.juego) void elegirJuego(b.dataset.juego);
  else if (b.id === 'btn-unirme') void unirseSalaMesa();
  else if (b.dataset.modo) {
    prefs.modo = b.dataset.modo as ModoMenu;
    guardarPrefs();
    if (prefs.modo === 'linea') iniciarCanal();
    pintarMenu();
  } else if (b.dataset.nivel) {
    prefs.nivel = b.dataset.nivel as NivelIA;
    guardarPrefs();
    pintarMenu();
  } else if (b.classList.contains('boton-sonido')) {
    sonido.alternar();
    pintarSonido();
  } else if (b.id === 'btn-escenas') {
    if (!esNeutro()) void elegirEscena();
  } else if (b.dataset.escena) {
    $('hoja').hidden = true;
    void lanzarEscena(b.dataset.escena, yo, true);
  } else if (b.id === 'btn-ayuda' && partida) {
    hoja(`<h3>${partida.juego.nombre}</h3>${ayudaDe(partida.juego)}`, [{ texto: 'A jugar', clase: 'boton-tomate' }]);
  } else if (b.id === 'btn-pausa-salir') {
    partida?.abandonar();
    partida = null;
    otroFuera = false;
    $('pausa-linea').hidden = true;
    revisarConexion();
    if (salaMesa) return terminarPartidaSala('salir');
    mostrar('menu');
    pintarMenu();
  } else if (b.id === 'btn-salir') {
    hoja('<h3>¿Salir de la partida?</h3><p>Se pierde lo que llevan de esta partida.</p>', [
      { texto: 'Seguir jugando' },
      {
        texto: 'Salir',
        clase: 'boton-tomate',
        alTocar: () => {
          partida?.abandonar();
          partida = null;
          if (salaMesa) return terminarPartidaSala('salir');
          mostrar('menu');
          pintarMenu();
        },
      },
    ]);
  } else if (b.id === 'btn-menu') {
    partida = null;
    if (salaMesa) return terminarPartidaSala('salir');
    mostrar('menu');
    pintarMenu();
  } else if (b.id === 'btn-revancha' && salaMesa) {
    partida = null;
    terminarPartidaSala('sala');
  } else if (b.id === 'btn-revancha' && partida) {
    const entrada = JUEGOS.find((j) => j.id === partida!.juego.id)!;
    if (partida.modo === 'linea') void elegirJuego(entrada.id);
    else void jugar(entrada, partida.modo);
  }
});

// Botón «atrás» de Android (en el computador, la tecla Esc)
const atras = () => {
  const espera = document.querySelector<HTMLElement>('.sala-espera.visible [data-a="salir"]');
  const juegoSala = document.querySelector<HTMLElement>('.juego-sala');
  if (juegoSala) juegoSala.remove();
  else if (!$('hoja').hidden) $('hoja').hidden = true;
  else if (espera) espera.click();
  else if (!$('final').hidden) $(salaMesa ? 'btn-revancha' : 'btn-menu').click();
  else if (!$('partida').hidden) $('btn-salir').click();
  else location.href = paginaDeSalida();
};
if (Capacitor.isNativePlatform()) void App.addListener('backButton', atras);
else document.addEventListener('keydown', (e) => e.key === 'Escape' && !e.repeat && atras());

// ---------------------------------------------------------------------------
// Modo neutro: un amigo juega aquí, o hay un amigo en la sala. Los textos con `data-neutro` traen su versión neutra,
// las escenas premium (🎭) no salen y los muñequitos hablan como parceros (reacciones/frases.ts).
function pintarNeutro() {
  const n = esNeutro();
  document.body.classList.toggle('neutro', n);
  document.title = 'Juegos de Mesa';
  for (const el of document.querySelectorAll<HTMLElement>('[data-neutro]')) {
    el.dataset.normal ??= el.innerHTML;
    el.innerHTML = n ? el.dataset.neutro! : el.dataset.normal;
  }
  $('btn-escenas').hidden = n;
  const casa = document.querySelector<HTMLAnchorElement>('.boton-casa');
  if (casa) {
    casa.href = paginaDeSalida();
    casa.setAttribute('aria-label', modoAmigo() ? 'Volver a la sala de juegos' : 'Volver a la casa');
  }
  const linea = document.querySelector<HTMLElement>('[data-modo="linea"]');
  if (linea) linea.hidden = modoAmigo();
  document.querySelector('.mesa-modos')?.classList.toggle('cuatro', !modoAmigo());
  const vitrina = document.querySelector<HTMLAnchorElement>('.mesa-vitrina');
  if (vitrina && modoAmigo()) vitrina.href = './mesa.html?amigo&vitrina';
}
alNeutro(pintarNeutro);

/** La ayuda de cada juego con los nombres de quienes juegan (y sin corazones con amigos). */
function ayudaDe(j: JuegoMesa): string {
  let h = j.ayuda
    .replace('Las de Él llevan estrella y las de Ella, corazón.', `Las de ${escHtml(nombreDe('el'))} llevan estrella y las de ${escHtml(nombreDe('ella'))}, ${esNeutro() ? 'rayo' : 'corazón'}.`)
    .replace('(Él azul y amarillo, Ella rosado y verde)', `(${escHtml(nombreDe('el'))} azul y amarillo, ${escHtml(nombreDe('ella'))} rosado y verde)`);
  if (esNeutro()) h = h.replace(/\bÉl\b/g, escHtml(nombreDe('el'))).replace(/\bElla\b/g, escHtml(nombreDe('ella')));
  return h;
}

// ---------------------------------------------------------------------------
// Sala con código: dos celulares (Javier, Laura o amigos) juegan cualquier juego de la mesa. Quien abre la sala
// escoge el juego; el otro entra con «Unirme con código». Las jugadas viajan por la sala (fiables y en orden) y cada
// celular aplica las mismas reglas, como en línea por la casa. Después de cada partida vuelven a la sala de espera.
// ---------------------------------------------------------------------------
/** Mensajes de la mesa dentro de la sala. */
const MSJ_MESA = 'mesa';
type MsjMesa =
  | { t: 'mov'; id: string; n: number; m: unknown }
  | { t: 'pedir'; id: string; desde: number }
  | { t: 'salir'; id: string }
  | { t: 'escena'; id: string; escena: string; k: number };

/** Lo que manda el anfitrión al empezar: el juego, quién empieza y en qué lado va cada uno. */
interface ConfigMesa {
  id: string;
  juego: JuegoMesa['id'];
  empieza: Rol;
  jugadores: { salaId: string; rol: Rol; nombre: string; cuerpo: Rol; aspecto: AspectoJugador | null; casa: boolean }[];
}

/** Las jugadas por la sala (con su historial, por si el otro pide de nuevo alguna). */
class RedSala implements RedMesa {
  private historial = new Map<string, unknown[]>();
  private escenasVistas = new Set<string>();
  constructor(private s: Sala) {}
  private mandar(m: MsjMesa) {
    this.s.mandar(MSJ_MESA, m);
  }
  movimiento(id: string, n: number, m: unknown) {
    const h = this.historial.get(id) ?? [];
    h[n] = m;
    this.historial.set(id, h);
    this.mandar({ t: 'mov', id, n, m });
  }
  pedir(id: string, desde: number) {
    this.mandar({ t: 'pedir', id, desde });
  }
  salir(id: string) {
    this.mandar({ t: 'salir', id });
    this.historial.delete(id);
  }
  escena(id: string, escena: string) {
    this.mandar({ t: 'escena', id, escena, k: Date.now() });
  }
  llega(d: unknown, de: JugadorSala) {
    const m = d as MsjMesa;
    if (!m || typeof m !== 'object' || typeof m.id !== 'string') return;
    const p = partida;
    if (m.t === 'mov') {
      if (p?.sala === this.s && p.id === m.id && Number.isInteger(m.n)) p.llegaMovimiento(m.n, m.m);
    } else if (m.t === 'pedir') {
      const h = this.historial.get(m.id);
      if (h) for (let n = Math.max(0, m.desde); n < h.length; n++) if (h[n] !== undefined) this.mandar({ t: 'mov', id: m.id, n, m: h[n] });
    } else if (m.t === 'salir') {
      if (p?.sala === this.s && p.id === m.id && !p.terminada) {
        p.abandonar();
        partida = null;
        $('pausa-linea').hidden = true;
        aviso(`${de.nombre} salió de la partida.`, 3000);
        terminarPartidaSala('sala');
      }
    } else if (m.t === 'escena') {
      const clave = `${de.id}-${m.k}`;
      if (this.escenasVistas.has(clave) || esNeutro() || p?.id !== m.id) return;
      this.escenasVistas.add(clave);
      void lanzarEscena(m.escena, otro(yo), false);
    }
  }
}

/** La sala de este celular (si está en una) y cómo sigue la partida que está en curso. */
let salaMesa: Sala | null = null;
let finPartidaSala: ((que: 'sala' | 'salir') => void) | null = null;
let avisoSala = '';
/** Abrir o buscar una sala toma un rato: si se cancela, lo que llegue tarde se suelta. */
let turnoSala = 0;

const nombreJuego = (id: unknown) => {
  const e = JUEGOS.find((j) => j.id === id);
  return e ? (e.id === 'parchis2' ? 'Parchís a 2 colores' : e.nombre) : 'Juego';
};

/** Quien abre la sala escoge el juego (desde el menú, con el modo «Sala con código»). */
async function abrirSalaMesa(juegoId: JuegoMesa['id']) {
  if (salaMesa) return;
  const turno = ++turnoSala;
  hoja('<h3>Abriendo la sala…</h3><p>Un momentico: ya te damos el código para tu amigo.</p>', [{ texto: 'Cancelar', alTocar: () => void turnoSala++ }]);
  try {
    const { crearSala } = await import('../salas/sala');
    const s = await crearSala({ juego: 'mesa', max: 2 });
    if (turno !== turnoSala) return s.salir();
    $('hoja').hidden = true;
    void cicloSalaMesa(s, juegoId);
  } catch (e) {
    if (turno !== turnoSala) return;
    hoja(`<h3>No se pudo abrir la sala</h3><p>${escHtml(e instanceof Error ? e.message : 'Revisa el internet e intenta otra vez.')}</p>`, [{ texto: 'Entendido', clase: 'boton-tomate' }]);
  }
}

/** Pide el código de la sala (5 letras y números). */
function pedirCodigo(error = ''): Promise<string | null> {
  return new Promise((ok) => {
    hoja(`<h3>🔑 Unirme con código</h3><p>Quien abrió la sala te pasa el código: 5 letras y números.</p>
      <input class="mesa-codigo" maxlength="7" placeholder="ABCDE" aria-label="Código de la sala" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="go">
      <p class="mesa-codigo-error" role="status">${escHtml(error)}</p>`, [
      { texto: 'Volver', alTocar: () => ok(null) },
      { texto: 'Entrar', clase: 'boton-tomate', alTocar: () => ok(leerCodigo()) },
    ]);
    const input = document.querySelector<HTMLInputElement>('.mesa-codigo')!;
    const leerCodigo = () => normalizarCodigo(input.value);
    input.addEventListener('input', () => (input.value = normalizarCodigo(input.value)));
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      document.querySelector<HTMLElement>('#hoja-botones .boton-tomate')?.click();
    });
    setTimeout(() => input.focus(), 60);
  });
}
const normalizarCodigo = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').split('').filter((c) => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'.includes(c)).join('').slice(0, 5);

/** Entrar a la sala de otro (botón del menú, o mesa.html?sala=CÓDIGO). */
async function unirseSalaMesa(codigo?: string) {
  if (salaMesa) return;
  let c = codigo ? normalizarCodigo(codigo) : await pedirCodigo();
  while (c !== null && c.length !== 5) c = await pedirCodigo('El código tiene 5 letras y números.');
  if (!c) return;
  (document.activeElement as HTMLElement | null)?.blur?.();
  const turno = ++turnoSala;
  hoja(`<h3>Buscando la sala…</h3><p>Entrando a la sala ${c.split('').join(' ')}</p>`, [{ texto: 'Cancelar', alTocar: () => void turnoSala++ }]);
  try {
    const { unirseSala } = await import('../salas/sala');
    const s = await unirseSala(c, 'mesa');
    if (turno !== turnoSala) return s.salir();
    $('hoja').hidden = true;
    void cicloSalaMesa(s, null);
  } catch (e) {
    if (turno !== turnoSala) return;
    hoja(`<h3>No se pudo entrar</h3><p>${escHtml(e instanceof Error ? e.message : 'Revisa el código e intenta otra vez.')}</p>`, [{ texto: 'Entendido', clase: 'boton-tomate' }]);
  }
}

/** Sala de espera → partida → sala de espera…, hasta que se salgan (o quien abrió la sala la cierre). */
async function cicloSalaMesa(s: Sala, juegoInicial: JuegoMesa['id'] | null) {
  salaMesa = s;
  avisoSala = '';
  const red = new RedSala(s);
  const { esperarEnSala } = await import('../salas/espera');
  const neutro = () => ponerNeutro(s.hayAmigos);
  neutro();
  const quitar = [
    s.alCambiar(() => {
      neutro();
      // El otro se fue de la sala en plena partida: se vuelve a la sala de espera
      const p = partida;
      if (p?.sala === s && !p.terminada && !s.jugadores.some((j) => j.id === p.otroSala)) {
        p.abandonar();
        partida = null;
        $('pausa-linea').hidden = true;
        aviso(`${nombreDe(otro(yo))} salió de la partida.`, 3000);
        terminarPartidaSala('sala');
      }
    }),
    s.al(MSJ_MESA, (d, de) => red.llega(d, de)),
    s.alFin((_m, texto) => {
      avisoSala = texto;
      if (partida?.sala === s) {
        partida.abandonar();
        partida = null;
      }
      terminarPartidaSala('salir');
    }),
  ];
  let juegoId: JuegoMesa['id'] = juegoInicial ?? 'dados';
  // Se turnan para empezar (la primera, al azar)
  let empiezaAnfitrion = azar() < 0.5;
  try {
    for (;;) {
      s.ponerDatos({ jugando: false, juego: juegoId });
      const e = esperarEnSala({
        sala: s,
        titulo: 'Juegos de Mesa',
        subtitulo: s.soyAnfitrion ? `${nombreJuego(juegoId)}: tú escoges el juego. Uno contra uno, cada uno en su celular.` : 'Quien abrió la sala escoge el juego.',
        tema: 'casa',
        detalle: (j) => (j.puesto === 0 && j.datos?.juego ? `🎲 ${escHtml(nombreJuego(j.datos.juego))}` : ''),
        extras: s.soyAnfitrion
          ? [{
              id: 'juego', texto: '🎲 Cambiar juego', alTocar: () => escogerJuegoSala(juegoId, (id) => {
                juegoId = id;
                s.ponerDatos({ juego: id });
                const sub = e.raiz.querySelector('.se-sub');
                if (sub) sub.textContent = `${nombreJuego(id)}: tú escoges el juego. Uno contra uno, cada uno en su celular.`;
              }),
            }]
          : [],
        minimo: 2,
        alEmpezar: () => configMesa(s, juegoId, empiezaAnfitrion),
        invitacion: (c) => `¡Echémonos una partida en los Juegos de Mesa! Abre «Nuestro Hogar», toca «Soy un amigo / una amiga», «Unirme con un código» y escribe: ${c}`,
      });
      const r = await e.resultado;
      document.querySelector('.juego-sala')?.remove();
      if (r.que !== 'empezar') {
        if (r.motivo) avisoSala = r.motivo;
        break;
      }
      const cfg = configMesaSegura(r.datos, s);
      if (!cfg) {
        avisoSala = 'No se pudo empezar la partida. Intenten otra vez.';
        break;
      }
      empiezaAnfitrion = !empiezaAnfitrion;
      juegoId = cfg.juego;
      const que = await partidaEnSala(s, cfg, red);
      if (que === 'salir' || avisoSala) break;
    }
  } finally {
    for (const q of quitar) q();
    s.salir();
    partida?.abandonar();
    partida = null;
    salaMesa = null;
    finPartidaSala = null;
    yo = yoCasa;
    lados = ladosBase();
    ponerNeutro(false);
    $('pausa-linea').hidden = true;
    botonesFinal(false);
    mostrar('menu');
    pintarMenu();
    if (avisoSala) aviso(avisoSala, 3500);
    avisoSala = '';
  }
}

/**
 * Lados del tablero: Javier y Laura conservan el suyo (él azul, ella rosado); con un amigo, el amigo toma el que
 * quede libre; entre dos amigos, quien abrió la sala va con «el» y el otro con «ella».
 */
function configMesa(s: Sala, juegoId: JuegoMesa['id'], empiezaAnfitrion: boolean): ConfigMesa {
  const js = s.jugadores.filter((j) => j.puesto >= 0).slice(0, 2);
  const roles = new Map<string, Rol>();
  const deCasa = js.filter((j) => j.tipo !== 'amigo');
  if (deCasa.length === 2 && deCasa[0].tipo !== deCasa[1].tipo) for (const j of deCasa) roles.set(j.id, j.tipo as Rol);
  else if (deCasa.length >= 1) {
    roles.set(deCasa[0].id, deCasa[0].tipo as Rol);
    const otroJ = js.find((j) => j !== deCasa[0]);
    if (otroJ) roles.set(otroJ.id, otro(deCasa[0].tipo as Rol));
  } else js.forEach((j, k) => roles.set(j.id, k === 0 ? 'el' : 'ella'));
  const anfitrion = js[0];
  const invitado = js[1] ?? js[0];
  return {
    id: `${Date.now().toString(36)}${Math.floor(azar() * 1e6).toString(36)}`,
    juego: juegoId,
    empieza: roles.get((empiezaAnfitrion ? anfitrion : invitado).id) ?? 'el',
    jugadores: js.map((j) => ({
      salaId: j.id,
      rol: roles.get(j.id) ?? 'el',
      nombre: String(j.nombre ?? '').slice(0, 16) || 'Jugador',
      cuerpo: j.aspecto?.cuerpo === 'ella' ? 'ella' : 'el',
      aspecto: j.tipo === 'amigo' ? j.aspecto : null,
      casa: j.tipo !== 'amigo',
    })),
  };
}

/** Revisa lo que mandó el anfitrión (nunca se confía a ciegas en lo que llega de otro celular). */
function configMesaSegura(x: unknown, s: Sala): ConfigMesa | null {
  const c = x as Partial<ConfigMesa> | null;
  if (!c || typeof c !== 'object' || !Array.isArray(c.jugadores) || c.jugadores.length !== 2) return null;
  if (!JUEGOS.some((j) => j.id === c.juego)) return null;
  const color = (v: unknown) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : undefined);
  const jugadores = c.jugadores.map((q) => ({
    salaId: typeof q?.salaId === 'string' ? q.salaId : '',
    rol: (q?.rol === 'ella' ? 'ella' : 'el') as Rol,
    nombre: typeof q?.nombre === 'string' ? q.nombre.replace(/[<>&"'`\\]/g, '').slice(0, 16) || 'Jugador' : 'Jugador',
    cuerpo: (q?.cuerpo === 'ella' ? 'ella' : 'el') as Rol,
    aspecto: q?.aspecto && typeof q.aspecto === 'object'
      ? { cuerpo: (q.cuerpo === 'ella' ? 'ella' : 'el') as Rol, piel: color(q.aspecto.piel), pelo: color(q.aspecto.pelo), detalles: { ropa: color(q.aspecto.detalles?.ropa) ?? '', ropa2: color(q.aspecto.detalles?.ropa2) ?? '', zapatos: color(q.aspecto.detalles?.zapatos) ?? '' } }
      : null,
    casa: !!q?.casa,
  }));
  if (jugadores[0].rol === jugadores[1].rol || !jugadores.some((q) => q.salaId === s.yo.id)) return null;
  return { id: typeof c.id === 'string' ? c.id.slice(0, 24) : 'sala', juego: c.juego as JuegoMesa['id'], empieza: c.empieza === 'ella' ? 'ella' : 'el', jugadores };
}

/** Una partida en la sala: se juega «en línea» y termina cuando tocan «Volver a la sala» (o alguien se va). */
function partidaEnSala(s: Sala, cfg: ConfigMesa, red: RedSala): Promise<'sala' | 'salir'> {
  return new Promise((listo) => {
    finPartidaSala = listo;
    const mio = cfg.jugadores.find((q) => q.salaId === s.yo.id)!;
    const suyo = cfg.jugadores.find((q) => q !== mio)!;
    yo = mio.rol;
    const lado = (q: ConfigMesa['jugadores'][number]): Lado => ({ nombre: q.nombre, cuerpo: q.cuerpo, aspecto: q.aspecto, vestir: q.casa && q.cuerpo === q.rol });
    lados = mio.rol === 'el' ? { el: lado(mio), ella: lado(suyo) } : { el: lado(suyo), ella: lado(mio) };
    s.ponerDatos({ jugando: true, listo: false });
    botonesFinal(true);
    const entrada = JUEGOS.find((j) => j.id === cfg.juego)!;
    void jugar(entrada, 'linea', { empieza: cfg.empieza, id: cfg.id, red, sala: s, otroSala: suyo.salaId });
  });
}

/** El final de una partida en la sala: volver a la sala de espera o salirse. */
function terminarPartidaSala(que: 'sala' | 'salir') {
  const f = finPartidaSala;
  finPartidaSala = null;
  f?.(avisoSala ? 'salir' : que);
}

/** En una sala, la tarjeta del final ofrece volver a la sala (no revancha directa: cada uno toca «Estoy listo»). */
function botonesFinal(enSala: boolean) {
  const rev = $('btn-revancha'), menu = $('btn-menu');
  rev.dataset.normal ??= rev.textContent ?? '';
  menu.dataset.normal ??= menu.textContent ?? '';
  rev.textContent = enSala ? 'Volver a la sala' : rev.dataset.normal;
  menu.textContent = enSala ? 'Salir de la sala' : menu.dataset.normal;
}

/** Quien abrió la sala escoge el juego (encima de la sala de espera). */
function escogerJuegoSala(actual: JuegoMesa['id'], alEscoger: (id: JuegoMesa['id']) => void) {
  document.querySelector('.juego-sala')?.remove();
  const capa = document.createElement('div');
  capa.className = 'juego-sala';
  const opciones = [...JUEGOS.filter((j) => !j.oculto), JUEGOS.find((j) => j.id === 'parchis2')!];
  capa.innerHTML = `<div class="juego-sala-caja" role="dialog" aria-label="Escoger juego"><h3>¿A qué jugamos?</h3><div class="juego-sala-lista">${opciones
    .map((j) => `<button class="juego-carta" data-sala-juego="${j.id}" aria-pressed="${j.id === actual}" style="--color:${j.color}">
      <span class="juego-icono">${j.icono || JUEGOS.find((x) => x.id === 'parchis')!.icono}</span>
      <span class="juego-texto"><b>${nombreJuego(j.id)}</b><small>${j.resumen}</small></span></button>`)
    .join('')}</div></div>`;
  capa.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-sala-juego]');
    if (!b && ev.target !== capa) return;
    capa.remove();
    if (b) {
      sonido.toque();
      alEscoger(b.dataset.salaJuego as JuegoMesa['id']);
    }
  });
  document.body.append(capa);
}

// ---------------------------------------------------------------------------
// Arranque
pintarSonido();
pintarMusica();
pintarNeutro();
pintarMenu();
// Entrar directo a la sala de alguien (desde «Unirme con un código» de la sala de juegos de amigos): ?sala=CÓDIGO
const codigoSala = params.get('sala');
if (codigoSala) void unirseSalaMesa(codigoSala);
if (prefs.modo === 'linea') iniciarCanal();
// Entrar directo a un juego (desde la invitación de la casa o en pruebas): ?juego=dados&modo=local
const directo = params.get('juego');
const guardada = leer<Guardada>(CLAVE_PARTIDA);
const unirse = params.get('unirse');
if (unirse && directo) {
  // Invitación que llegó a la casa: se acepta aquí
  prefs.modo = 'linea';
  iniciarCanal();
  const em = params.get('empieza');
  canal!.recordar({ id: unirse, juego: directo as JuegoMesa['id'], empieza: em === 'ella' ? 'ella' : 'el', de: otro(yo) });
  pintarMenu();
} else if (directo) {
  const m = params.get('modo');
  if (m === 'ia' || m === 'local' || m === 'sala' || (m === 'linea' && !modoAmigo())) prefs.modo = m;
  const nv = params.get('nivel');
  if (nv === 'facil' || nv === 'normal' || nv === 'dificil') prefs.nivel = nv;
  const em = params.get('empieza');
  const entrada = JUEGOS.find((j) => j.id === directo);
  if (prefs.modo === 'linea') {
    iniciarCanal();
    pintarMenu();
  } else if (prefs.modo === 'sala') {
    if (entrada) void abrirSalaMesa(entrada.id);
  } else if (entrada) void jugar(entrada, prefs.modo === 'local' && entrada.secreto ? 'ia' : prefs.modo, em === 'el' || em === 'ella' ? { empieza: em } : {});
} else if (!params.has('vitrina') && guardada && JUEGOS.some((j) => j.id === guardada.juego)) {
  const entrada = JUEGOS.find((j) => j.id === guardada.juego)!;
  prefs.nivel = guardada.nivel;
  void jugar(entrada, guardada.modo, { empieza: guardada.empieza, e: guardada.e, n: guardada.n });
}

// Vitrina de reacciones (mesa.html?vitrina): los dos muñequitos y un botón por reacción, para verlas todas
/** Las reacciones de cariño de la pareja (con amigos no salen). */
const ROMANTICAS = new Set(['beso_volado', 'sonrojarse', 'abrazo']);
async function vitrina() {
  const { COREOS } = await import('../reacciones/coreografias');
  $('partida-juego').textContent = 'Reacciones';
  mostrar('partida');
  escenario ??= new Escenario($<HTMLCanvasElement>('escenario-lienzo'), $('efectos'), RAPIDO);
  await escenario.preparar(yo, lados);
  let quien: Rol = yo;
  const tablero = $('tablero');
  tablero.className = 'tablero tablero-vitrina';
  const pintar = () => {
    tablero.innerHTML = `<div class="vitrina-quien">${(['el', 'ella'] as Rol[])
      .map((r) => `<button data-vitrina-rol="${r}" aria-pressed="${r === quien}">${nombreDe(r)}</button>`)
      .join('')}</div><div class="vitrina-lista">${Object.entries(COREOS)
      .filter(([k, c]) => !c.bucle && !(esNeutro() && ROMANTICAS.has(k)))
      .map(([k, c]) => `<button data-vitrina="${k}">${c.nombre}</button>`)
      .join('')}</div>`;
  };
  pintar();
  tablero.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('button');
    if (!b) return;
    if (b.dataset.vitrinaRol) {
      quien = b.dataset.vitrinaRol as Rol;
      pintar();
    } else if (b.dataset.vitrina) void escenario!.probar(quien, b.dataset.vitrina);
  });
}
if (params.has('vitrina')) void vitrina();

// ---------------------------------------------------------------------------
// Escenas premium: se compran en la tienda de la casa y se lanzan aquí con 🎭 (en línea, en los dos celulares)
const CLAVE_ESCENAS = 'nuestro-hogar-escenas';
let cine: Promise<void> | null = null;
/** Se cumple cuando no hay ninguna escena en pantalla. */
const cineLibre = () => cine ?? Promise.resolve();

function escenasMias(): Set<string> {
  if (params.has('todas')) return new Set(['*']);
  return new Set(leer<string[]>(CLAVE_ESCENAS) ?? []);
}

async function elegirEscena() {
  const { ESCENAS } = await import('../escenas/catalogo');
  const mias = escenasMias();
  const tiene = (id: string) => mias.has('*') || mias.has(id);
  const lugar: Record<string, string> = { grande: '🎭', sala: '🛋️', cocina: '🍳', bano: '🛁', cuarto: '🛏️' };
  const propias = ESCENAS.filter((e) => tiene(e.id));
  const faltan = ESCENAS.filter((e) => !tiene(e.id));
  const boton = (e: (typeof ESCENAS)[number]) =>
    `<button class="escena-opcion" data-escena="${e.id}"><i>${lugar[e.lugar]}</i><b>${e.nombre}</b><small>${e.descripcion}</small></button>`;
  hoja(
    `<h3>Escenas premium</h3>${
      propias.length
        ? `<div class="escenas-lista">${propias.map(boton).join('')}</div>`
        : '<p>Todavía no tienen escenas. Se compran con monedas en la tienda de la casa, en la pestaña «Escenas».</p>'
    }${
      faltan.length && propias.length
        ? `<p class="escenas-faltan">Faltan ${faltan.length} por comprar en la tienda de la casa.</p>`
        : ''
    }`,
    [{ texto: 'Cerrar' }],
  );
}

/** Pone una escena a pantalla completa; las del escenario grande dejan el tablero chiquito en una esquina. */
async function lanzarEscena(id: string, quien: Rol, avisar: boolean) {
  if (cine || esNeutro()) return;
  const [{ escenaDe }, { Cine }] = await Promise.all([import('../escenas/catalogo'), import('../escenas/cine')]);
  const e = escenaDe(id);
  if (!e) return aviso('No existe esa escena.');
  if (avisar && partida?.modo === 'linea') partida.redActual()?.escena?.(partida.id, id);
  const mini = e.lugar === 'grande' && !$('partida').hidden;
  $('partida').classList.toggle('cine-mini', mini);
  cine = Cine.reproducir(e, quien, RAPIDO).finally(() => {
    cine = null;
    $('partida').classList.remove('cine-mini');
  });
  await cine;
}

// Ver una escena sola (pruebas y la vista previa de la tienda): ?escena=<id> (nunca para un amigo)
const escenaPedida = params.get('escena');
if (escenaPedida && !modoAmigo()) void lanzarEscena(escenaPedida, yo, false);

// Para las pruebas automáticas
(globalThis as Record<string, unknown>).__mesa = {
  get estado() {
    return partida?.e;
  },
  get partida() {
    return partida;
  },
  get escenario() {
    return escenario;
  },
  cine: () => import('../escenas/cine').then((m) => m.cineActual.c),
  escena: (id: string) => lanzarEscena(id, yo, false),
  escenas: () => import('../escenas/catalogo').then((m) => m.ESCENAS.map((e) => ({ id: e.id, dur: e.dur, lugar: e.lugar }))),
  yo,
};
