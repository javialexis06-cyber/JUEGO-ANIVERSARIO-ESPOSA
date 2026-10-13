// El Torneo del Despertar Dorado (peleas.html): el torneo de la Fiesta del Despertar Dorado con muñecos de peluche.
// Pantallas: título → modo (arcade contra la escalera de seis rivales, contra la máquina, dos en el mismo aparato,
// en línea por sala, práctica) → luchador → escenario → pelea → resultado. La pelea corre a 60 pasos por segundo y
// se dibuja a 30 cuadros. Javier y Laura vienen de la casa (y vuelven a ella); un amigo, de su sala de juegos (y vuelve
// allá), con su propio muñeco como luchador y sin nada de la pareja.
import '../deslizar';
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import './peleas.css';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import * as THREE from 'three';
import * as sonido from '../sonido';
import * as fondo from '../segundo_plano';
import { elegirModelos } from '../recursos';
import { esModoAmigo } from '../salas/perfil';
import { yoMismo } from '../salas/sala';
import type { AspectoJugador } from '../salas/tipos';
import { Bot } from './ia';
import { elenco, escalera, frasesComunes } from './luchadores';
import { PRESENTADOR } from './presentador';
import { BARRA_MAX, Sim } from './sim';
import * as son from './sonidos';
import { DT, type DefLuchador, type Entrada, type IdEscenario } from './tipos';
import { Hud } from './ui/hud';
import { Mando } from './ui/mando';
import { ESCENARIOS, EscenaPelea, ORDEN_ESCENARIOS, type Calidad } from './vista/escena';
import { Muneco } from './vista/muneco';
import { VistaPelea } from './vista/pelea';
import { retrato } from './vista/retratos';
import { entrarEnLinea, type Linea } from './red';

const params = new URLSearchParams(location.search);
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// ------------------------------------------------------------------------------------------------ Quién juega
const yo = yoMismo();
/** Sin nada de la pareja: un amigo en este aparato (o en la sala), o la versión para amigos. */
let neutro = esModoAmigo() || params.has('amigo') || yo.tipo === 'amigo';
const aspectoYo: AspectoJugador = yo.aspecto;
let ELENCO = elenco(neutro, yo.nombre);
son.prepararSonidos(neutro);

function calidadInicial(): Calidad {
  const q = params.get('calidad');
  if (q === 'alta' || q === 'media' || q === 'baja') return q;
  try {
    const g = localStorage.getItem('peleas-calidad');
    if (g === 'alta' || g === 'media' || g === 'baja') return g;
  } catch {
    /* sin almacenamiento */
  }
  return matchMedia('(pointer: coarse)').matches ? 'media' : 'alta';
}

const escena = new EscenaPelea($<HTMLCanvasElement>('#lienzo'), calidadInicial());
const hud = new Hud($('#capa'));
hud.mostrar(false);
let mando = new Mando($('#capa'), false);
mando.mostrar(false);
const retratos = new Map<string, string>();

function aspectoDe(d: DefLuchador) {
  return d.aspecto === 'jugador' ? aspectoYo : undefined;
}
function nombreDe(d: DefLuchador) {
  return d.aspecto === 'jugador' ? yo.nombre : d.nombre;
}
async function caraDe(d: DefLuchador) {
  const url = await retrato(escena.renderer, d, aspectoDe(d)).catch(() => '');
  retratos.set(d.id, url);
  return url;
}

// ------------------------------------------------------------------------------------------------ El bucle
/** Lo que se dibuja ahora (el menú con sus muñecos o la pelea). */
let director: { cuadro(dt: number): void } | null = null;
let acumulado = 0;
fondo.cuadros((dt) => {
  // 30 cuadros por segundo (la pantalla va a 60: se dibuja uno sí y otro no)
  acumulado += dt;
  if (acumulado < 1 / 31) return;
  const paso = Math.min(0.1, acumulado);
  acumulado = 0;
  director?.cuadro(paso);
  escena.dibujar(paso);
});

// ------------------------------------------------------------------------------------------------ El fondo de los menús
/** Los muñecos de los menús (en el escenario, posando). */
class Vitrina {
  private cache = new Map<string, Promise<Muneco>>();
  private puestos: (Muneco | null)[] = [null, null];
  private turno = [0, 0];
  private t = 0;

  async poner(lado: number, d: DefLuchador | null) {
    const turno = ++this.turno[lado];
    const viejo = this.puestos[lado];
    if (!d) {
      viejo?.raiz.removeFromParent();
      this.puestos[lado] = null;
      return;
    }
    const clave = `${d.id}|${lado}`;
    let p = this.cache.get(clave);
    if (!p) {
      const m = new Muneco(d, aspectoDe(d));
      if (lado === 1 && this.puestos[0]?.def.id === d.id) m.alterno = true;
      p = m.cargar().then(() => m);
      this.cache.set(clave, p);
    }
    const m = await p;
    if (turno !== this.turno[lado]) return;
    viejo?.raiz.removeFromParent();
    this.puestos[lado] = m;
    escena.capa.add(m.raiz);
  }

  cuadro(dt: number) {
    this.t += dt;
    this.puestos.forEach((m, i) => {
      if (!m) return;
      const lado = i === 0 ? 1 : -1;
      m.actualizar(dt, {
        i, x: i === 0 ? -1.7 : 1.7, y: 0, vx: 0, vy: 0, lado, estado: 'entrada', t: Math.floor(this.t * 60), dur: 999, golpe: null, vida: 1, barra: 0, combo: 0,
        ultimoGolpe: -99, ko: false, entrada: { h: 0, v: 0, a: false, b: false, e: false, g: false, s: false }, suelo: true, rondas: 0, comboDano: 0, def: m.def,
      }, 0);
    });
    escena.camaraPelea(dt, new THREE.Vector3(-1.7, 0, 0), new THREE.Vector3(1.7, 0, 0), { borde: 8, menu: true });
    escena.animar(dt, 0.2);
  }

  limpiar() {
    for (let i = 0; i < 2; i++) void this.poner(i, null);
  }
}
const vitrina = new Vitrina();

// ------------------------------------------------------------------------------------------------ Pantallas
function pantalla(html: string, clase = '') {
  const p = $('#pantallas');
  p.innerHTML = `<div class="pantalla ${clase}">${html}</div>`;
  return p.firstElementChild as HTMLElement;
}
function quitarPantalla() {
  $('#pantallas').innerHTML = '';
}
function carga(si: boolean, texto?: string) {
  const c = $('#carga');
  c.classList.toggle('fuera', !si);
  if (texto) $('#carga-frase').textContent = texto;
}

let atrasActual: (() => void) | null = null;

function volverAfuera() {
  director = null;
  escena.liberar();
  location.replace(esModoAmigo() ? './amigos.html' : './index.html');
}

async function titulo() {
  atrasActual = () => confirmarSalir();
  hud.mostrar(false);
  mando.mostrar(false);
  director = vitrina;
  sonido.musica.pista('amigos-sala', { bucle: true });
  const dos = [...ELENCO].sort(() => Math.random() - 0.5).slice(0, 2);
  void vitrina.poner(0, dos[0]);
  void vitrina.poner(1, dos[1]);
  const p = pantalla(`
    <div class="titulo-logo"><div class="sol"></div><small>La Fiesta del Despertar Dorado presenta</small><h1>El Torneo<br><span>del Despertar Dorado</span></h1></div>
    <nav class="titulo-menu">
      <button class="boton grande" data-m="arcade"><b>Arcade</b><small>Seis rivales hasta la copa</small></button>
      <button class="boton" data-m="libre"><b>Contra la máquina</b><small>Escoge rival y dificultad</small></button>
      <button class="boton" data-m="versus"><b>Dos en este aparato</b><small>Cada uno en su orilla</small></button>
      <button class="boton" data-m="linea"><b>En línea</b><small>Sala con código</small></button>
      <button class="boton" data-m="practica"><b>Práctica</b><small>Aprende los golpes</small></button>
    </nav>
    <div class="titulo-abajo"><button class="boton chico" data-m="salir">${neutro ? '🎮 Mis juegos' : '🏠 Volver a la casa'}</button>
      <button class="boton chico" data-m="sonido">${sonido.silenciado() ? '🔇' : '🔊'}</button><button class="boton chico" data-m="ayuda">❔ Cómo se juega</button></div>`, 'titulo');
  p.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-m]');
    if (!b) return;
    sonido.toque();
    const m = b.dataset.m;
    if (m === 'arcade') void modoArcade();
    else if (m === 'libre') void modoLibre();
    else if (m === 'versus') void modoVersus();
    else if (m === 'linea') void modoLinea();
    else if (m === 'practica') void modoPractica();
    else if (m === 'salir') confirmarSalir();
    else if (m === 'sonido') {
      sonido.alternar();
      b.textContent = sonido.silenciado() ? '🔇' : '🔊';
    } else if (m === 'ayuda') ayuda();
  });
  if (!titulo.saludo) {
    titulo.saludo = true;
    setTimeout(() => void son.decir(PRESENTADOR.bienvenida.id), 600);
  }
}
titulo.saludo = false;

function ayuda() {
  const h = document.createElement('div');
  h.className = 'hoja';
  h.innerHTML = `<div class="hoja-caja"><h2>Cómo se juega</h2>
    <div class="ayuda-cols"><div><h3>Moverse</h3><p>Joystick (o flechas / WASD): adelante y atrás caminan, <b>arriba salta</b>, <b>abajo se agacha</b>.</p>
      <p><b>Tapar</b>: mantener hacia atrás. Lo bajo (barridas) se tapa agachado hacia atrás; lo que viene saltando, de pie.</p></div>
    <div><h3>Golpes</h3><p><b>Rápido</b> (J): tres seguidos son un combo. Con abajo, uno bajito.</p>
      <p><b>Fuerte</b> (K): con abajo es una barrida que tumba; con arriba, un gancho que manda a volar (y corta los saltos).</p>
      <p><b>Especial</b> (L): el golpe propio de cada luchador. <b>Agarre</b> (U): no se tapa; se escapa apretando agarre a tiempo.</p>
      <p><b>Súper</b> (I): con la barra dorada llena. Pegando y recibiendo se llena.</p></div>
    <div><h3>Trucos</h3><p>Un golpe que pega se puede cortar con el siguiente: rápido → rápido → fuerte → especial.</p>
      <p>Con poca vida se vuela más lejos. Muchos golpes seguidos marean (salen estrellitas): ¡aprovecha!</p>
      <p>Al mejor de tres rondas de 60 segundos.</p></div></div>
    <button class="boton" data-cerrar>¡Entendido!</button></div>`;
  $('#hojas').append(h);
  const cerrar = () => {
    h.remove();
    atrasActual = viejo;
  };
  const viejo = atrasActual;
  atrasActual = cerrar;
  h.querySelector('[data-cerrar]')!.addEventListener('click', cerrar);
}

function confirmar(titulo: string, texto: string, si: string, no: string): Promise<boolean> {
  return new Promise((ok) => {
    const h = document.createElement('div');
    h.className = 'hoja';
    h.innerHTML = `<div class="hoja-caja chica"><h2>${esc(titulo)}</h2><p>${esc(texto)}</p><div class="fila"><button class="boton" data-r="1">${esc(si)}</button><button class="boton gris" data-r="0">${esc(no)}</button></div></div>`;
    $('#hojas').append(h);
    const viejo = atrasActual;
    const fin = (r: boolean) => {
      h.remove();
      atrasActual = viejo;
      ok(r);
    };
    atrasActual = () => fin(false);
    h.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-r]');
      if (b) fin(b.dataset.r === '1');
    });
  });
}

async function confirmarSalir() {
  if (await confirmar('¿Salir del torneo?', neutro ? 'Vuelves a tus juegos.' : 'Vuelves a la casa.', 'Salir', 'Quedarme')) volverAfuera();
}

// ------------------------------------------------------------------------------------------------ Escoger
interface OpcionesEscoger {
  titulo: string;
  /** Lado de la vitrina donde se muestra lo escogido. */
  lado: number;
  /** Lo que ya está escogido del otro lado (se queda posando). */
  otro?: DefLuchador | null;
  inicial?: string;
  /** Se puede escoger «al azar». */
  azar?: boolean;
}

function escogerLuchador(o: OpcionesEscoger): Promise<DefLuchador | null> {
  return new Promise((ok) => {
    let sel = ELENCO.find((d) => d.id === o.inicial) ?? ELENCO[o.lado === 0 ? 0 : 1] ?? ELENCO[0];
    void vitrina.poner(o.lado, sel);
    void vitrina.poner(1 - o.lado, o.otro ?? null);
    const tarjetas = ELENCO.map((d) => `<button class="tarjeta" data-id="${d.id}" style="--color:${d.color}"><img alt="" data-cara="${d.id}"><b>${esc(nombreDe(d))}</b></button>`).join('');
    const p = pantalla(`
      <header class="sel-titulo"><button class="boton chico" data-volver>‹ Volver</button><h2>${esc(o.titulo)}</h2></header>
      <div class="sel-ficha lado-${o.lado}"></div>
      <div class="sel-grilla">${tarjetas}${o.azar ? '<button class="tarjeta azar" data-id="azar"><span>?</span><b>Al azar</b></button>' : ''}</div>
      <button class="boton grande sel-listo" data-listo>¡Listo!</button>`, `seleccion lado-${o.lado}`);
    const ficha = p.querySelector<HTMLElement>('.sel-ficha')!;
    const pintar = () => {
      const g = sel.golpes;
      ficha.style.setProperty('--color', sel.color);
      ficha.innerHTML = `<small>${esc(sel.titulo)}</small><h3>${esc(nombreDe(sel))}</h3><p>${esc(sel.estilo)}</p>
        <ul><li><i>★</i>${esc(g.especial.nombre ?? '')}</li><li><i>⚡</i>${esc(g.super.nombre ?? '')}</li></ul>
        <div class="sel-numeros"><span>Vida <b style="--k:${sel.vida / 1150}"></b></span><span>Rapidez <b style="--k:${sel.velocidad / 3.8}"></b></span><span>Fuerza <b style="--k:${sel.golpes.fuerte.dano / 95}"></b></span></div>`;
      p.querySelectorAll('.tarjeta').forEach((t) => t.classList.toggle('activa', (t as HTMLElement).dataset.id === sel.id));
    };
    pintar();
    for (const d of ELENCO) {
      void caraDe(d).then((url) => {
        const img = p.querySelector<HTMLImageElement>(`[data-cara="${d.id}"]`);
        if (img && url) img.src = url;
      });
    }
    const fin = (d: DefLuchador | null) => {
      atrasActual = null;
      ok(d);
    };
    atrasActual = () => fin(null);
    p.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-volver]')) return fin(null);
      if (t.closest('[data-listo]')) {
        sonido.toque();
        return fin(sel);
      }
      const b = t.closest<HTMLElement>('.tarjeta');
      if (!b) return;
      sonido.toque();
      if (b.dataset.id === 'azar') {
        sel = ELENCO[Math.floor(Math.random() * ELENCO.length)];
        return fin(sel);
      }
      const d = ELENCO.find((x) => x.id === b.dataset.id)!;
      if (d === sel) return fin(sel);
      sel = d;
      void vitrina.poner(o.lado, sel);
      pintar();
    });
    if (!escogerLuchador.dicho) {
      escogerLuchador.dicho = true;
      void son.decir(PRESENTADOR.elige.id);
    }
  });
}
escogerLuchador.dicho = false;

function escogerEscenario(): Promise<IdEscenario | null> {
  return new Promise((ok) => {
    const p = pantalla(`<header class="sel-titulo"><button class="boton chico" data-volver>‹ Volver</button><h2>¿Dónde pelean?</h2></header>
      <div class="escenarios">${ORDEN_ESCENARIOS.map((id) => `<button class="escenario esc-${id}" data-id="${id}"><span class="esc-arte"></span><b>${esc(ESCENARIOS[id].nombre)}</b><small>${esc(ESCENARIOS[id].lema)}</small></button>`).join('')}
      <button class="escenario esc-azar" data-id="azar"><span class="esc-arte">?</span><b>Al azar</b><small>Que decida la suerte</small></button></div>`, 'escoger-escenario');
    const fin = (r: IdEscenario | null) => {
      atrasActual = null;
      ok(r);
    };
    atrasActual = () => fin(null);
    p.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-volver]')) return fin(null);
      const b = t.closest<HTMLElement>('[data-id]');
      if (!b) return;
      sonido.toque();
      const id = b.dataset.id === 'azar' ? ORDEN_ESCENARIOS[Math.floor(Math.random() * 3)] : (b.dataset.id as IdEscenario);
      fin(id);
    });
  });
}

function escogerDificultad(): Promise<number | null> {
  return new Promise((ok) => {
    const niveles: [number, string, string][] = [[2, 'Tranquilo', 'Para aprender'], [4, 'Normal', 'Tapa y castiga a veces'], [6, 'Difícil', 'Reflejos de campeón'], [7, 'Maestro', 'No perdona nada']];
    const p = pantalla(`<header class="sel-titulo"><button class="boton chico" data-volver>‹ Volver</button><h2>¿Qué tan duro?</h2></header>
      <div class="dificultad">${niveles.map(([n, t, d]) => `<button class="boton" data-n="${n}"><b>${t}</b><small>${d}</small></button>`).join('')}</div>`, 'escoger-dificultad');
    const fin = (r: number | null) => {
      atrasActual = null;
      ok(r);
    };
    atrasActual = () => fin(null);
    p.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-volver]')) return fin(null);
      const b = t.closest<HTMLElement>('[data-n]');
      if (b) fin(Number(b.dataset.n));
    });
  });
}

// ------------------------------------------------------------------------------------------------ La pelea
type Control = { k: 'mando'; i: number } | { k: 'bot'; nivel: number } | { k: 'red' };
export interface ConfigPelea {
  defs: [DefLuchador, DefLuchador];
  escenario: IdEscenario;
  controles: [Control, Control];
  practica?: boolean;
  /** Dos en el mismo aparato (cada uno con su mando). */
  dos?: boolean;
  semilla?: number;
  /** En línea (soy el anfitrión): lo que llega del otro y cómo mandar lo mío. */
  linea?: Linea;
  /** Nombres que se muestran (en línea, los de los jugadores). */
  nombres?: [string, string];
  aspectos?: [AspectoJugador | undefined, AspectoJugador | undefined];
}
export interface Resultado {
  ganador: number;
  salir?: boolean;
  revancha?: boolean;
}

let pausado = false;
let peleaActual: { sim: Sim; vista: VistaPelea } | null = null;

async function pelear(cfg: ConfigPelea): Promise<Resultado> {
  quitarPantalla();
  carga(true, 'Armando el escenario…');
  vitrina.limpiar();
  director = null;
  mando.liberar();
  mando = new Mando($('#capa'), !!cfg.dos);
  await escena.ponerEscenario(cfg.escenario);
  const nombres = cfg.nombres ?? [nombreDe(cfg.defs[0]), nombreDe(cfg.defs[1])];
  const vista = new VistaPelea(escena, hud, cfg.defs, cfg.aspectos ?? [aspectoDe(cfg.defs[0]), aspectoDe(cfg.defs[1])], nombres);
  await vista.cargar();
  for (let i = 0; i < 2; i++) void caraDe(cfg.defs[i]).then((u) => {
    hud.cara(i, u);
    vista.caras[i] = u;
  });
  void son.precargar([...Object.values(PRESENTADOR).map((f) => f.id), ...cfg.defs.flatMap((d) => [...d.frases.entrada, ...d.frases.super, ...d.frases.victoria, ...d.frases.derrota, ...d.frases.especial].map((f) => f.id)), 'almohadazo', 'palmada', 'plaf', 'pisoton']);
  const sim = new Sim({ luchadores: cfg.defs, borde: ESCENARIOS[cfg.escenario].borde, semilla: cfg.semilla ?? Date.now() % 100000, practica: cfg.practica, sinPresentacion: cfg.practica || params.has('sin-presentacion') });
  peleaActual = { sim, vista };
  const bots = cfg.controles.map((c, i) => (c.k === 'bot' ? new Bot(i, c.nivel, (cfg.semilla ?? 7) + i * 31) : null));
  hud.mostrar(true);
  hud.sinReloj(!!cfg.practica);
  mando.mostrar(cfg.controles.some((c) => c.k === 'mando'));
  escena.calmar(3);
  carga(false);
  sonido.musica.pista(ESCENARIOS[cfg.escenario].musica, { bucle: true });
  return new Promise((ok) => {
    let acc = 0;
    let terminado = false;
    const terminar = (r: Resultado) => {
      if (terminado) return;
      terminado = true;
      director = null;
      hud.mostrar(false);
      mando.mostrar(false);
      peleaActual = null;
      ok(r);
      // (la vista se suelta después de mostrar el resultado)
      setTimeout(() => vista.liberar(), 0);
    };
    hud.alPausa = () => void pausar(cfg, terminar);
    mando.alPausar = () => void pausar(cfg, terminar);
    atrasActual = () => void pausar(cfg, terminar);
    cfg.linea?.alFin(() => terminar({ ganador: -1, salir: true }));
    director = {
      cuadro(dt) {
        if (!pausado && !cfg.linea?.cortado()) {
          const vel = sim.lento > 0 ? 0.3 : 1;
          acc += dt * vel;
          while (acc >= DT) {
            acc -= DT;
            const ent = cfg.controles.map((c, i): Entrada => (c.k === 'mando' ? mando.leer(c.i) : c.k === 'bot' ? bots[i]!.decidir(sim) : cfg.linea!.entrada())) as [Entrada, Entrada];
            sim.paso(ent);
          }
          cfg.linea?.mandarFoto(sim);
        }
        vista.cuadro(dt, sim);
        cfg.controles.forEach((c, i) => c.k === 'mando' && mando.superLista(c.i, sim.L[i].barra >= BARRA_MAX));
        if (sim.fase === 'fin' && sim.faseT > 100) terminar({ ganador: sim.ganador });
      },
    };
  });
}

async function pausar(cfg: ConfigPelea, terminar: (r: Resultado) => void) {
  if (pausado || $('#hojas').childElementCount) return;
  // En línea no se detiene el tiempo (el otro sigue): solo se ofrece salir
  pausado = !cfg.linea;
  mando.soltar();
  const h = document.createElement('div');
  h.className = 'hoja';
  h.innerHTML = `<div class="hoja-caja chica"><h2>${cfg.linea ? 'Menú' : 'Pausa'}</h2>
    <div class="col"><button class="boton" data-p="seguir">Seguir peleando</button>
    ${cfg.linea ? '' : '<button class="boton gris" data-p="reiniciar">Empezar de nuevo</button>'}
    <button class="boton gris" data-p="ayuda">Cómo se juega</button>
    <div class="fila"><button class="boton chico" data-p="sonido">${sonido.silenciado() ? '🔇 Sonido' : '🔊 Sonido'}</button><button class="boton chico" data-p="musica">${sonido.musica.apagada() ? '🎵 Música: no' : '🎵 Música: sí'}</button><button class="boton chico" data-p="sacudidas">Sacudidas: ${escena.sacudidas ? 'sí' : 'no'}</button></div>
    <button class="boton rojo" data-p="salir">Salir de la pelea</button></div></div>`;
  $('#hojas').append(h);
  const viejo = atrasActual;
  const cerrar = () => {
    h.remove();
    pausado = false;
    atrasActual = viejo;
  };
  atrasActual = cerrar;
  h.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-p]');
    if (!b) return;
    sonido.toque();
    const q = b.dataset.p;
    if (q === 'seguir') cerrar();
    else if (q === 'reiniciar') {
      cerrar();
      terminar({ ganador: -1, revancha: true });
    } else if (q === 'salir') {
      cerrar();
      terminar({ ganador: -1, salir: true });
    } else if (q === 'ayuda') ayuda();
    else if (q === 'sonido') {
      sonido.alternar();
      b.textContent = sonido.silenciado() ? '🔇 Sonido' : '🔊 Sonido';
    } else if (q === 'musica') {
      sonido.musica.alternar();
      b.textContent = sonido.musica.apagada() ? '🎵 Música: no' : '🎵 Música: sí';
    } else if (q === 'sacudidas') {
      escena.sacudidas = !escena.sacudidas;
      b.textContent = `Sacudidas: ${escena.sacudidas ? 'sí' : 'no'}`;
    }
  });
}

/** La pantalla después de la pelea (con los dos todavía en el escenario: el que ganó celebra). */
function resultado(texto: string, sub: string, botones: [string, string, string?][]): Promise<string> {
  return new Promise((ok) => {
    const p = pantalla(`<div class="resultado"><h2>${texto}</h2><p>${sub}</p><div class="fila">${botones.map(([id, t, c]) => `<button class="boton ${c ?? ''}" data-r="${id}">${t}</button>`).join('')}</div></div>`, 'pantalla-resultado');
    atrasActual = () => {
      atrasActual = null;
      ok('menu');
    };
    p.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-r]');
      if (!b) return;
      sonido.toque();
      atrasActual = null;
      ok(b.dataset.r!);
    });
  });
}

// ------------------------------------------------------------------------------------------------ Modos
async function modoArcade() {
  const elegido = await escogerLuchador({ titulo: 'Arcade: elige a tu luchador', lado: 0, azar: true });
  if (!elegido) return titulo();
  const rivales = escalera(elegido.id, ELENCO);
  let k = 0;
  while (k < rivales.length) {
    const rival = rivales[k];
    const ok = await escaleraPantalla(elegido, rivales, k);
    if (!ok) return titulo();
    const escenario = ORDEN_ESCENARIOS[k % 3];
    const r = await pelear({ defs: [elegido, rival], escenario, controles: [{ k: 'mando', i: 0 }, { k: 'bot', nivel: 1 + k * 1.1 }] });
    if (r.salir) return titulo();
    if (r.revancha) continue;
    if (r.ganador === 0) {
      k++;
      if (k >= rivales.length) {
        await campeon(elegido);
        return titulo();
      }
    } else {
      const q = await resultado('Te ganaron…', `${esc(nombreDe(rival))} sigue en el torneo. ¿Otra vez?`, [['otra', 'Revancha'], ['menu', 'Al menú', 'gris']]);
      if (q !== 'otra') return titulo();
    }
  }
}

function escaleraPantalla(elegido: DefLuchador, rivales: DefLuchador[], k: number): Promise<boolean> {
  return new Promise((ok) => {
    director = vitrina;
    void vitrina.poner(0, elegido);
    void vitrina.poner(1, rivales[k]);
    const p = pantalla(`<div class="escalera"><h2>${k === rivales.length - 1 ? 'La pelea final' : `Rival ${k + 1} de ${rivales.length}`}</h2>
      <div class="escalera-fila">${rivales.map((r, i) => `<div class="peldano ${i < k ? 'ganado' : i === k ? 'actual' : ''}" style="--color:${r.color}"><img alt="" data-cara="${r.id}"><b>${esc(nombreDe(r))}</b></div>`).join('')}</div>
      <p class="escalera-vs"><b>${esc(nombreDe(elegido))}</b> contra <b>${esc(nombreDe(rivales[k]))}</b> · ${esc(ESCENARIOS[ORDEN_ESCENARIOS[k % 3]].nombre)}</p>
      <div class="fila"><button class="boton grande" data-r="1">¡A pelear!</button><button class="boton gris" data-r="0">Al menú</button></div></div>`, 'pantalla-escalera');
    for (const r of rivales) void caraDe(r).then((u) => {
      const img = p.querySelector<HTMLImageElement>(`[data-cara="${r.id}"]`);
      if (img && u) img.src = u;
    });
    void son.decir((k === rivales.length - 1 ? PRESENTADOR.ultimo : PRESENTADOR.siguiente).id);
    atrasActual = () => {
      atrasActual = null;
      ok(false);
    };
    p.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-r]');
      if (!b) return;
      sonido.toque();
      atrasActual = null;
      ok(b.dataset.r === '1');
    });
    if (params.has('auto')) setTimeout(() => ok(true), 300);
  });
}

async function campeon(d: DefLuchador) {
  director = vitrina;
  void vitrina.poner(0, d);
  void vitrina.poner(1, null);
  void son.decir(PRESENTADOR.campeon.id, true);
  void son.efecto('fanfarria', 0.9);
  const p = pantalla(`<div class="campeon"><div class="copa"></div><small>Campeón del Torneo del Despertar Dorado</small><h2>${esc(nombreDe(d))}</h2>
    <p>Seis rivales, seis victorias. ¡El pueblo entero te aplaude!</p><button class="boton grande" data-r>¡Qué gloria!</button></div>`, 'pantalla-campeon');
  await new Promise<void>((ok) => {
    atrasActual = () => ok();
    p.querySelector('[data-r]')!.addEventListener('click', () => ok());
  });
  atrasActual = null;
}

async function modoLibre() {
  const a = await escogerLuchador({ titulo: 'Elige a tu luchador', lado: 0, azar: true });
  if (!a) return titulo();
  const b = await escogerLuchador({ titulo: 'Elige a tu rival', lado: 1, otro: a, inicial: ELENCO.find((d) => d.id !== a.id)?.id, azar: true });
  if (!b) return titulo();
  const nivel = await escogerDificultad();
  if (nivel === null) return titulo();
  const escenario = await escogerEscenario();
  if (!escenario) return titulo();
  await bucleRevancha({ defs: [a, b], escenario, controles: [{ k: 'mando', i: 0 }, { k: 'bot', nivel }] });
}

async function modoVersus() {
  const a = await escogerLuchador({ titulo: 'Jugador 1 elige', lado: 0, azar: true });
  if (!a) return titulo();
  const b = await escogerLuchador({ titulo: 'Jugador 2 elige', lado: 1, otro: a, inicial: ELENCO.find((d) => d.id !== a.id)?.id, azar: true });
  if (!b) return titulo();
  const escenario = await escogerEscenario();
  if (!escenario) return titulo();
  await bucleRevancha({ defs: [a, b], escenario, controles: [{ k: 'mando', i: 0 }, { k: 'mando', i: 1 }], dos: true });
}

async function modoPractica() {
  const a = await escogerLuchador({ titulo: 'Práctica: elige a tu luchador', lado: 0 });
  if (!a) return titulo();
  const b = ELENCO.find((d) => d.id !== a.id) ?? a;
  const r = await pelear({ defs: [a, b], escenario: 'plaza', controles: [{ k: 'mando', i: 0 }, { k: 'bot', nivel: 1 }], practica: true });
  void r;
  return titulo();
}

async function bucleRevancha(cfg: ConfigPelea) {
  for (;;) {
    const r = await pelear(cfg);
    if (r.salir) return titulo();
    if (r.revancha) continue;
    const g = r.ganador;
    const texto = g < 0 ? 'Empate' : `¡Gana ${esc(nombreDe(cfg.defs[g]))}!`;
    const q = await resultado(texto, cfg.dos ? 'Jugador 1 contra jugador 2' : g === 0 ? '¡Bien peleado!' : 'Casi… la próxima es tuya.', [['otra', 'Revancha'], ['elegir', 'Elegir otros', 'gris'], ['menu', 'Al menú', 'gris']]);
    if (q === 'otra') continue;
    if (q === 'elegir') {
      if (cfg.dos) return modoVersus();
      return modoLibre();
    }
    return titulo();
  }
}

async function modoLinea(codigo?: string) {
  const r = await entrarEnLinea({
    codigo, elenco: () => ELENCO, escogerLuchador, escogerEscenario, pantalla, quitarPantalla, carga, vitrina, retratos: caraDe, nombreDe,
    alNeutro: (si) => {
      if (si === neutro) return;
      neutro = si;
      ELENCO = elenco(neutro, yo.nombre);
      son.prepararSonidos(neutro);
    },
    pelear, verComo: mirarComoInvitado, resultado, setAtras: (f) => (atrasActual = f),
  });
  void r;
  return titulo();
}

/** El invitado en línea: ve lo que manda el anfitrión (las dos peleas se ven igual) y manda su mando. */
async function mirarComoInvitado(cfg: { defs: [DefLuchador, DefLuchador]; escenario: IdEscenario; nombres: [string, string]; aspectos: [AspectoJugador | undefined, AspectoJugador | undefined]; linea: Linea }): Promise<Resultado> {
  quitarPantalla();
  carga(true, 'Armando el escenario…');
  vitrina.limpiar();
  director = null;
  mando.liberar();
  mando = new Mando($('#capa'), false);
  await escena.ponerEscenario(cfg.escenario);
  const vista = new VistaPelea(escena, hud, cfg.defs, cfg.aspectos, cfg.nombres);
  await vista.cargar();
  for (let i = 0; i < 2; i++) void caraDe(cfg.defs[i]).then((u) => {
    hud.cara(i, u);
    vista.caras[i] = u;
  });
  hud.mostrar(true);
  hud.sinReloj(false);
  mando.mostrar(true);
  carga(false);
  sonido.musica.pista(ESCENARIOS[cfg.escenario].musica, { bucle: true });
  const espejo = cfg.linea.espejo(cfg.defs);
  vista.saltarEventos(espejo.ultimoEvento);
  return new Promise((ok) => {
    let terminado = false;
    const terminar = (r: Resultado) => {
      if (terminado) return;
      terminado = true;
      director = null;
      hud.mostrar(false);
      mando.mostrar(false);
      ok(r);
      setTimeout(() => vista.liberar(), 0);
    };
    const cfgPausa = { ...cfg, controles: [{ k: 'red' }, { k: 'mando', i: 0 }], linea: cfg.linea } as unknown as ConfigPelea;
    hud.alPausa = () => void pausar(cfgPausa, terminar);
    mando.alPausar = () => void pausar(cfgPausa, terminar);
    atrasActual = () => void pausar(cfgPausa, terminar);
    cfg.linea.alFin(() => terminar({ ganador: -1, salir: true }));
    director = {
      cuadro(dt) {
        cfg.linea.mandarEntrada(mando.leer(0));
        espejo.avanzar(dt);
        vista.cuadro(dt, espejo);
        mando.superLista(0, espejo.L[1].barra >= BARRA_MAX);
        if (espejo.fase === 'fin' && espejo.faseT > 100) terminar({ ganador: espejo.ganador });
      },
    };
  });
}

// ------------------------------------------------------------------------------------------------ Atrás y arranque
function atras() {
  if (atrasActual) atrasActual();
  else confirmarSalir();
}
if (Capacitor.isNativePlatform()) void App.addListener('backButton', atras);
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !e.repeat && !peleaActual) atras();
});
const despertar = () => sonido.activar();
addEventListener('pointerdown', despertar, { capture: true });
addEventListener('keydown', despertar, { capture: true });

// Ganchos de prueba
const w = window as unknown as Record<string, unknown>;
w.__peleas = () => peleaActual?.sim ?? null;
w.__peleasVista = () => peleaActual?.vista ?? null;
w.__peleasEscena = () => escena;
w.__peleasFrases = () => frasesComunes();

async function arrancar() {
  carga(true, 'Colgando los banderines dorados…');
  await elegirModelos();
  await escena.ponerEscenario((params.get('escenario') as IdEscenario) ?? 'plaza').catch(() => undefined);
  // Pruebas: ?prueba=poses&p1=el (window.__pose('jab', lado) pone una pose de pelea de lado)
  if (params.get('prueba') === 'poses') {
    const d = ELENCO.find((x) => x.id === params.get('p1')) ?? ELENCO[0];
    const m = new Muneco(d, aspectoDe(d));
    await m.cargar();
    escena.capa.add(m.raiz);
    let nombre = 'guardia', lado = 1, t = 0;
    w.__pose = (n: string, l = 1) => {
      nombre = n;
      lado = l;
    };
    director = {
      cuadro(dt) {
        t += dt;
        const g = { ...d.golpes.rapido1, pose: nombre, poseCarga: nombre, arranque: 0, activo: 9999, recup: 1 };
        m.actualizar(dt, { i: 0, x: 0, y: 0, vx: 0, vy: 0, lado, estado: nombre === 'guardia' ? 'quieto' : 'ataque', t: 5, dur: 99999, golpe: g, vida: 1, barra: 0, combo: 0, ultimoGolpe: -99, ko: false,
          entrada: { h: 0, v: 0, a: false, b: false, e: false, g: false, s: false }, suelo: true, rondas: 0, comboDano: 0, def: d }, 0);
        escena.camaraPelea(dt, new THREE.Vector3(-0.6, 0, 0), new THREE.Vector3(0.6, 0, 0), { borde: 8, menu: true });
      },
    };
    carga(false);
    w.__listo = true;
    return;
  }
  // Pruebas: ?prueba=pelea&p1=eliana&p2=tarek&bot1=4&bot2=4 (los dos con la máquina si se pide bot1)
  if (params.get('prueba') === 'pelea') {
    const d = (id: string | null, def: number) => ELENCO.find((x) => x.id === id) ?? ELENCO[def];
    const a = d(params.get('p1'), 0), b = d(params.get('p2'), 1);
    const c1: Control = params.has('bot1') ? { k: 'bot', nivel: Number(params.get('bot1')) || 4 } : { k: 'mando', i: 0 };
    const c2: Control = { k: 'bot', nivel: Number(params.get('bot2')) || 4 };
    w.__listo = true;
    await bucleRevancha({ defs: [a, b], escenario: (params.get('escenario') as IdEscenario) ?? 'plaza', controles: [c1, c2], semilla: Number(params.get('semilla')) || 5, practica: params.has('practica') });
    return;
  }
  carga(false);
  await titulo();
  w.__listo = true;
  const unirse = params.get('unirse');
  if (unirse) void modoLinea(unirse);
  else if (params.has('sala')) void modoLinea();
}

void arrancar();
