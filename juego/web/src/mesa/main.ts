// Juegos de Mesa: Él contra Ella en Dados Party, Mancala, Puntos y Cajas y Parchís.
// La mesa lleva los turnos (contra la IA, los dos en el mismo celular o cada uno en el suyo por internet)
// y los dos muñequitos reaccionan arriba a cada jugada.
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
import { otro, type Rol } from '../casa/modelo';
import { leer } from '../casa/sincro';
import * as sonido from '../sonido';
import { Canal, type Invitacion } from './canal';
import { Escenario } from './escenario';
import { type Entrada, JUEGOS } from './juegos';
import type { Final, JuegoMesa, Modo, NivelIA, Suceso, Vista } from './tipos';

const params = new URLSearchParams(location.search);
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const CLAVE_SUELDO = 'nuestro-hogar-sueldo';
const CLAVE_PREFS = 'mesa-preferencias';
export const nombreDe = (r: Rol) => (r === 'el' ? 'Él' : 'Ella');

function rolJugador(): Rol {
  const p = params.get('rol');
  if (p === 'el' || p === 'ella') return p;
  const m = leer<{ rol?: Rol }>('nuestro-hogar-modo');
  return m?.rol === 'ella' ? 'ella' : 'el';
}
const yo = rolJugador();
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
let prefs: Prefs = { modo: 'ia', nivel: 'normal', ...leer<Prefs>(CLAVE_PREFS) };
const guardarPrefs = () => {
  try {
    localStorage.setItem(CLAVE_PREFS, JSON.stringify(prefs));
  } catch {
    /* sin almacenamiento */
  }
};

// ---------------------------------------------------------------------------
// Avisos y hojas
let tAviso = 0;
export function aviso(texto: string, ms = 2200) {
  const a = $('aviso');
  a.textContent = texto;
  a.hidden = false;
  clearTimeout(tAviso);
  tAviso = window.setTimeout(() => (a.hidden = true), ms);
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
  cont.innerHTML = JUEGOS.map(
    (j) => `<button class="juego-carta" data-juego="${j.id}" style="--color:${j.color}">
      <span class="juego-icono">${j.icono}</span>
      <span class="juego-texto"><b>${j.nombre}</b><small>${j.resumen}</small></span>
    </button>`,
  ).join('');
  for (const s of document.querySelectorAll('[data-otro]')) s.textContent = nombreDe(otro(yo));
  for (const b of document.querySelectorAll<HTMLElement>('[data-modo]')) b.setAttribute('aria-pressed', String(b.dataset.modo === prefs.modo));
  for (const b of document.querySelectorAll<HTMLElement>('[data-nivel]')) b.setAttribute('aria-pressed', String(b.dataset.nivel === prefs.nivel));
  $('mesa-nivel').hidden = prefs.modo !== 'ia';
  const nota = $('menu-nota');
  nota.hidden = prefs.modo !== 'linea';
  if (prefs.modo === 'linea') {
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

class Partida {
  e: unknown;
  vista!: Vista<unknown, unknown>;
  private esperando: ((m: unknown) => void) | null = null;
  private turnoPermitido: Rol | null = null;
  private terminada = false;
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
        if (this.modo === 'linea') canal?.movimiento(this.id, this.n, m);
      } else if (this.modo === 'ia') {
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
        else canal?.pedir(this.id, n);
      }, 4000);
      this.alRecibir();
    });
  }

  llegaMovimiento(n: number, m: unknown) {
    if (n < this.n) return;
    this.recibidos.set(n, m);
    this.alRecibir?.();
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
    if (this.modo === 'linea') canal?.salir(this.id);
  }
}

function premioDe(p: Partida, fin: Final) {
  if (p.modo === 'ia') {
    if (fin.ganador !== yo) return fin.ganador === null ? 4 : 2;
    return p.nivel === 'dificil' ? 25 : p.nivel === 'normal' ? 15 : 8;
  }
  // Entre los dos: cada celular cobra lo suyo (en local se paga una vez)
  if (p.modo === 'local') return 10;
  return fin.ganador === yo ? 12 : 6;
}

function pagar(monedas: number) {
  try {
    localStorage.setItem(CLAVE_SUELDO, String((Number(localStorage.getItem(CLAVE_SUELDO)) || 0) + monedas));
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
const CLAVE_PARTIDA = 'mesa-partida';
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

async function jugar(entrada: Entrada, modo: Modo, opciones: { empieza?: Rol; id?: string; e?: unknown; n?: number } = {}) {
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
  escenario ??= new Escenario($<HTMLCanvasElement>('escenario-lienzo'), $('efectos'), RAPIDO);
  await escenario.preparar(yo);
  const p = new Partida(juego, modo, prefs.nivel, empieza, opciones.id);
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

async function elegirJuego(id: string) {
  const entrada = JUEGOS.find((j) => j.id === id);
  if (!entrada) return;
  sonido.activar();
  sonido.toque();
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
  if (!entrada || inv.de === yo) return;
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

function iniciarCanal() {
  if (canal) return;
  canal = new Canal(yo, {
    alCambiar: () => {
      if (!$('menu').hidden) pintarMenu();
    },
    alInvitacion,
    alMovimiento: (id, n, m) => {
      if (partida && partida.id === id) partida.llegaMovimiento(n, m);
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
document.addEventListener('click', (ev) => {
  const t = ev.target as HTMLElement;
  const b = t.closest<HTMLElement>('button');
  if (!b) return;
  if (b.dataset.juego) void elegirJuego(b.dataset.juego);
  else if (b.dataset.modo) {
    prefs.modo = b.dataset.modo as Modo;
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
  } else if (b.id === 'btn-ayuda' && partida) {
    hoja(`<h3>${partida.juego.nombre}</h3>${partida.juego.ayuda}`, [{ texto: 'A jugar', clase: 'boton-tomate' }]);
  } else if (b.id === 'btn-salir') {
    hoja('<h3>¿Salir de la partida?</h3><p>Se pierde lo que llevan de esta partida.</p>', [
      { texto: 'Seguir jugando' },
      {
        texto: 'Salir',
        clase: 'boton-tomate',
        alTocar: () => {
          partida?.abandonar();
          partida = null;
          mostrar('menu');
          pintarMenu();
        },
      },
    ]);
  } else if (b.id === 'btn-menu') {
    partida = null;
    mostrar('menu');
    pintarMenu();
  } else if (b.id === 'btn-revancha' && partida) {
    const entrada = JUEGOS.find((j) => j.id === partida!.juego.id)!;
    if (partida.modo === 'linea') void elegirJuego(entrada.id);
    else void jugar(entrada, partida.modo);
  }
});

if (Capacitor.isNativePlatform()) {
  void App.addListener('backButton', () => {
    if (!$('hoja').hidden) $('hoja').hidden = true;
    else if (!$('partida').hidden) $('btn-salir').click();
    else if (!$('final').hidden) $('btn-menu').click();
    else location.href = './index.html';
  });
}

// ---------------------------------------------------------------------------
// Arranque
pintarSonido();
pintarMenu();
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
  if (m === 'ia' || m === 'local' || m === 'linea') prefs.modo = m;
  const nv = params.get('nivel');
  if (nv === 'facil' || nv === 'normal' || nv === 'dificil') prefs.nivel = nv;
  const em = params.get('empieza');
  if (prefs.modo === 'linea') {
    iniciarCanal();
    pintarMenu();
  } else {
    const entrada = JUEGOS.find((j) => j.id === directo);
    if (entrada) void jugar(entrada, prefs.modo, em === 'el' || em === 'ella' ? { empieza: em } : {});
  }
} else if (!params.has('vitrina') && guardada && JUEGOS.some((j) => j.id === guardada.juego)) {
  const entrada = JUEGOS.find((j) => j.id === guardada.juego)!;
  prefs.nivel = guardada.nivel;
  void jugar(entrada, guardada.modo, { empieza: guardada.empieza, e: guardada.e, n: guardada.n });
}

// Vitrina de reacciones (mesa.html?vitrina): los dos muñequitos y un botón por reacción, para verlas todas
async function vitrina() {
  const { COREOS } = await import('../reacciones/coreografias');
  $('partida-juego').textContent = 'Reacciones';
  mostrar('partida');
  escenario ??= new Escenario($<HTMLCanvasElement>('escenario-lienzo'), $('efectos'), RAPIDO);
  await escenario.preparar(yo);
  let quien: Rol = yo;
  const tablero = $('tablero');
  tablero.className = 'tablero tablero-vitrina';
  const pintar = () => {
    tablero.innerHTML = `<div class="vitrina-quien">${(['el', 'ella'] as Rol[])
      .map((r) => `<button data-vitrina-rol="${r}" aria-pressed="${r === quien}">${nombreDe(r)}</button>`)
      .join('')}</div><div class="vitrina-lista">${Object.entries(COREOS)
      .filter(([, c]) => !c.bucle)
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
  yo,
};
