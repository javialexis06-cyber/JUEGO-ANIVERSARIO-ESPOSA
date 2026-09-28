// Cien Puertas: escape room de un jugador con el otro personaje de narrador.
// Flujo de cada puerta: el narrador cuenta → se juega → la puerta se abre → celebra → se cruza a la siguiente.
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '../estilos.css';
import './puertas.css';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import * as THREE from 'three';
import { otro, type Rol } from '../casa/modelo';
import { elegirModelos, liberarEsqueletos } from '../recursos';
import * as sonido from '../sonido';
import { tema } from './cuarto';
import { Entrada } from './entrada';
import { Escena, OJO } from './escena';
import { CAPITULOS, capituloDe, FINAL_DE, INICIO, PUERTAS, RECUERDOS, recuerdoDe, voz } from './historia';
import { azar, grupo, iconoItem } from './kit';
import { Narrador } from './narrador';
import type { Ctx, Nivel } from './nivel';
import { NIVELES } from './niveles';
import { ProbadorReal } from './probador';
import { Puerta } from './puerta';
import { Sensores } from './sensores';
import { $, aviso, esc, Inventario, mostrar, Paneles, pausa, tarjetaRecuerdo } from './ui';

const params = new URLSearchParams(location.search);
const CLAVE = 'cien-puertas';
const CLAVE_SUELDO = 'nuestro-hogar-sueldo';
const MONEDAS_PUERTA = 5;
const MONEDAS_CAPITULO = 40;
const PISTA_TRAS = 40;
const SIN_HISTORIA = params.get('sinhistoria') === '1';

interface Progreso {
  /** Última puerta abierta (0 = ninguna). */
  hasta: number;
  estrellas: Record<number, number>;
  vioInicio: boolean;
  /** Capítulos cuyo recuerdo ya se recuperó. */
  recuerdos?: number[];
}

const leer = <T,>(k: string): T | null => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
};
const escribir = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* sin almacenamiento */
  }
};

function rolJugador(): Rol {
  const p = params.get('rol');
  if (p === 'el' || p === 'ella') return p;
  const m = leer<{ rol?: Rol }>('nuestro-hogar-modo');
  return m?.rol === 'ella' ? 'ella' : 'el';
}

const yo = rolJugador();
let progreso: Progreso = { hasta: 0, estrellas: {}, vioInicio: false, ...leer<Progreso>(CLAVE) };
const guardar = () => escribir(CLAVE, progreso);

let escena: Escena;
let sensores: Sensores;
let entrada: Entrada;
let narrador: Narrador;
const paneles = new Paneles();
const inv = new Inventario();
let cuarto: THREE.Group | null = null;
let puerta: Puerta | null = null;
let capActual = 0;
let jugando = 0;
let ctx: (Ctx & { _salir: () => void; _resuelto: Promise<void>; _fallos: number; _ultimoToque: number }) | null = null;

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------
async function iniciar() {
  const barra = (k: number, t?: string) => {
    $('carga-barra').style.width = `${Math.round(k * 100)}%`;
    if (t) $('carga-texto').textContent = t;
  };
  barra(0.1, 'Buscando las llaves…');
  escena = new Escena($('lienzo') as HTMLCanvasElement);
  escena.rapidez = Number(params.get('rapido')) || 1;
  sensores = new Sensores();
  sensores.teclado();
  entrada = new Entrada($('lienzo') as HTMLCanvasElement, escena.camara);
  entrada.alGastar = (item) => inv.quitar(item);
  entrada.on('usoFallido', () => inv.noSirve());
  inv.alElegir = (item) => (entrada.item = item);
  paneles.alFallar = () => ctx?.mal();
  await elegirModelos();
  barra(0.4, 'Despertando a quien te acompaña…');
  narrador = new Narrador(otro(yo), escena);
  await narrador.cargar();
  barra(1, 'Listo');
  let antes = performance.now();
  const bucle = (t: number) => {
    const dt = (t - antes) / 1000;
    antes = t;
    sensores.actualizar();
    escena.cuadro(dt);
    requestAnimationFrame(bucle);
  };
  requestAnimationFrame(bucle);
  controles();
  mostrar('carga', false);
  const n = Number(params.get('puerta'));
  if (n >= 1 && n <= 100) void jugar(n);
  else mapa();
  (window as unknown as Record<string, unknown>).__listo = true;
}

function controles() {
  const sonar = () => {
    sonido.activar();
    sonido.musica.iniciar('menu', 76, 'hogar');
  };
  window.addEventListener('pointerdown', sonar, { once: true });
  $('btn-mapa').onclick = () => {
    sonido.toque();
    salirAlMapa();
  };
  $('btn-pista').onclick = () => pista();
  $('btn-volver').onclick = () => void ctx?.volver();
  $('btn-sonido').onclick = () => {
    const callado = sonido.alternar();
    $('btn-sonido').classList.toggle('apagado', callado);
  };
  $('btn-sonido').classList.toggle('apagado', sonido.silenciado());
  $('btn-recuerdos').onclick = () => {
    sonido.toque();
    album();
  };
  $('btn-continuar').onclick = () => {
    sonido.toque();
    void jugar(Math.min(100, progreso.hasta + 1));
  };
  if (Capacitor.isNativePlatform()) {
    void App.addListener('backButton', () => {
      if (paneles.abierto) paneles.quitar();
      else if (jugando) salirAlMapa();
      else location.href = './index.html';
    });
  }
}

// ---------------------------------------------------------------------------
// Mapa de puertas
// ---------------------------------------------------------------------------
function mapa() {
  jugando = 0;
  mostrar('hud', false);
  mostrar('mapa', true);
  const siguiente = Math.min(100, progreso.hasta + 1);
  $('btn-continuar').textContent = progreso.hasta ? `Seguir: puerta ${siguiente}` : 'Empezar';
  $('mapa-abiertas').textContent = `${progreso.hasta} de 100 puertas`;
  $('btn-recuerdos').textContent = `Recuerdos ${(progreso.recuerdos ?? []).length}/${RECUERDOS.length}`;
  $('capitulos').innerHTML = CAPITULOS.map((c) => {
    const desde = (c.n - 1) * 10 + 1;
    const hechas = Math.max(0, Math.min(10, progreso.hasta - desde + 1));
    const puertas = Array.from({ length: 10 }, (_, i) => {
      const n = desde + i;
      const abierta = n <= progreso.hasta, disponible = n <= siguiente;
      const est = progreso.estrellas[n] ?? 0;
      return `<button class="mini-puerta${abierta ? ' abierta' : ''}${n === siguiente ? ' siguiente' : ''}" data-n="${n}" ${disponible ? '' : 'disabled'} aria-label="Puerta ${n}">
        <b>${n}</b>${abierta ? `<i class="estrellas">${'★'.repeat(est)}${'☆'.repeat(3 - est)}</i>` : ''}</button>`;
    }).join('');
    const bloqueado = desde > siguiente;
    return `<section class="capitulo${bloqueado ? ' bloqueado' : ''}"><header><span class="cap-n">${c.n}</span><h3>${esc(c.titulo)}</h3><small>${hechas}/10</small></header>
      <div class="mini-puertas">${puertas}</div></section>`;
  }).join('');
  for (const b of $('capitulos').querySelectorAll<HTMLButtonElement>('.mini-puerta')) {
    b.onclick = () => {
      sonido.toque();
      void jugar(Number(b.dataset.n));
    };
  }
  $('capitulos').querySelector('.siguiente')?.scrollIntoView({ block: 'center' });
}

const nombreDe = (r: Rol) => (r === 'el' ? 'Él' : 'Ella');

/** Los recuerdos recuperados, para volver a leerlos. */
function album() {
  const tengo = new Set(progreso.recuerdos ?? []);
  const html = RECUERDOS.map((r) =>
    tengo.has(r.capitulo)
      ? `<article><h4>${esc(r.titulo)}</h4><small>${esc(r.fecha)}</small>${r.dialogo
          .map(([q, t]) => `<p><span class="quien ${q}">${nombreDe(q)}:</span> ${esc(voz(t, q))}</p>`)
          .join('')}</article>`
      : `<article class="bloqueado"><h4>Recuerdo ${r.capitulo}</h4><small>Se recupera al terminar el capítulo ${r.capitulo}</small></article>`,
  ).join('');
  void paneles.nota(`<div class="album">${html}</div>`, 'album-recuerdos');
}

function salirAlMapa() {
  paneles.quitar();
  terminarCtx();
  narrador.esconder();
  mapa();
}

// ---------------------------------------------------------------------------
// Una puerta
// ---------------------------------------------------------------------------
function armarCapitulo(cap: number) {
  if (cuarto) {
    escena.escena.remove(cuarto);
    liberar(cuarto);
  }
  const t = tema(cap);
  escena.luces(t.luces);
  cuarto = grupo('cuarto');
  t.armar(cuarto);
  puerta = new Puerta(t.puerta, escena, t.opPuerta);
  cuarto.add(puerta.grupo);
  escena.escena.add(cuarto);
  capActual = cap;
}

async function jugar(n: number) {
  const turno = ++jugadas;
  mostrar('mapa', false);
  terminarCtx();
  const cap = Math.ceil(n / 10);
  if (cap !== capActual || !puerta) armarCapitulo(cap);
  else puerta.cerrar();
  escena.vistaGeneral();
  jugando = n;
  const nivel: Nivel = NIVELES[n] ?? pendiente(n);
  const c = crearCtx(n);
  ctx = c;
  await nivel.montar(c);
  if (turno !== jugadas) return;
  $('hud-puerta').textContent = `Puerta ${n}`;
  $('hud-lugar').textContent = capituloDe(n).titulo;
  mostrar('hud', true);
  mostrar('btn-pista', false);
  mostrar('btn-volver', false);
  // El narrador cuenta la historia
  entrada.bloqueada = true;
  narrador.animos = 0;
  narrador.aparecer();
  const lineas = [
    ...(n === 1 && !progreso.vioInicio ? INICIO : []),
    ...(n % 10 === 1 ? capituloDe(n).llegada : []),
    ...(PUERTAS[n] ?? []),
  ];
  if (!SIN_HISTORIA) await narrador.decir(lineas);
  if (turno !== jugadas) return;
  if (n === 1 && !progreso.vioInicio) {
    progreso.vioInicio = true;
    guardar();
  }
  void narrador.irEsquina();
  entrada.bloqueada = false;
  const t0 = escena.t;
  c._ultimoToque = escena.t;
  let pistaVisible = false;
  c.cada((_, t) => {
    if (!pistaVisible && t - t0 > (c._fallos >= 3 ? PISTA_TRAS / 2 : PISTA_TRAS)) {
      pistaVisible = true;
      mostrar('btn-pista', true);
    }
    // Un buen rato sin tocar nada: ánimo (nunca pistas)
    if (t - c._ultimoToque > 55) {
      c._ultimoToque = t;
      narrador.animar(n);
    }
  });
  await c._resuelto;
  if (turno !== jugadas) return;
  // ¡Abierta!
  entrada.bloqueada = true;
  paneles.quitar();
  mostrar('btn-pista', false);
  mostrar('btn-volver', false);
  if (!escena.enVistaGeneral) await escena.volver();
  await puerta!.abrir();
  const primera = n > progreso.hasta;
  const segundos = escena.t - t0;
  const estrellas = pistasUsadas ? 1 : segundos < 90 ? 3 : 2;
  progreso.estrellas[n] = Math.max(progreso.estrellas[n] ?? 0, estrellas);
  if (primera) {
    progreso.hasta = n;
    pagar(MONEDAS_PUERTA + (n % 10 === 0 ? MONEDAS_CAPITULO : 0));
  }
  guardar();
  if (!SIN_HISTORIA) {
    await narrador.celebrar(n);
    if (n % 10 === 0) {
      const cap = n / 10;
      await narrador.decir(capituloDe(n).despedida);
      // El recuerdo real que devuelve el capítulo, contado por los dos
      const r = recuerdoDe(cap);
      if (r) {
        await tarjetaRecuerdo(r, cap, RECUERDOS.length);
        await narrador.conversar(r.dialogo, nombreDe(yo));
      }
      if (n === 100) await narrador.decir(FINAL_DE[otro(yo)]);
    }
  }
  if (n % 10 === 0 && !(progreso.recuerdos ?? []).includes(n / 10)) {
    progreso.recuerdos = [...(progreso.recuerdos ?? []), n / 10];
    guardar();
  }
  if (turno !== jugadas) return;
  // Cruzar la puerta
  void narrador.cruzar();
  await cruzar();
  if (turno !== jugadas) return;
  terminarCtx();
  if (n < 100) void jugar(n + 1);
  else {
    escena.vistaGeneral();
    mapa();
  }
}
let jugadas = 0;
let pistasUsadas = 0;

async function cruzar() {
  const f = $('fundido');
  f.hidden = false;
  const desde = OJO.clone();
  await escena.animar(1100, (k) => {
    escena.camara.position.set(0, desde.y - 0.1 * k, desde.z - 4.6 * k);
    escena.camara.lookAt(0, 1.25, -2);
    f.style.opacity = String(Math.max(0, (k - 0.45) / 0.55));
  });
  await pausa(150);
  escena.vistaGeneral();
  requestAnimationFrame(() => {
    f.style.transition = 'opacity .5s';
    f.style.opacity = '0';
    setTimeout(() => {
      f.hidden = true;
      f.style.transition = '';
    }, 520);
  });
}

function pagar(monedas: number) {
  try {
    localStorage.setItem(CLAVE_SUELDO, String((Number(localStorage.getItem(CLAVE_SUELDO)) || 0) + monedas));
  } catch {
    /* sin almacenamiento */
  }
  aviso(`+${monedas} monedas para la casa`);
}

async function pista() {
  const n = jugando;
  const nivel = NIVELES[n];
  if (!nivel) return;
  sonido.aviso();
  pistasUsadas++;
  const segunda = $('btn-pista').dataset.vista === String(n);
  $('btn-pista').dataset.vista = String(n);
  await paneles.nota(`<p class="pista-titulo">💡 Pista${segunda ? ' (la más clara)' : ''}</p><p>${esc(nivel.pistas[segunda ? 1 : 0])}</p>`, 'pista');
}

function terminarCtx() {
  if (!ctx) return;
  ctx._salir();
  ctx = null;
}

function liberar(o: THREE.Object3D) {
  liberarEsqueletos(o);
  o.traverse((x) => {
    const m = x as THREE.Mesh;
    if (!m.isMesh) return;
    m.geometry?.dispose();
  });
}

// ---------------------------------------------------------------------------
// Lo que ve cada acertijo
// ---------------------------------------------------------------------------
function crearCtx(n: number) {
  const g = grupo(`acertijo ${n}`);
  escena.escena.add(g);
  const quitar: (() => void)[] = [];
  let resolver!: () => void;
  const resuelto = new Promise<void>((r) => (resolver = r));
  let hecho = false;
  pistasUsadas = 0;
  entrada.limpiar();
  inv.vaciar();
  $('btn-pista').dataset.vista = '';
  const p = puerta!;
  const c: Ctx & { _salir: () => void; _resuelto: Promise<void>; _fallos: number; _ultimoToque: number } = {
    n,
    escena,
    g,
    puerta: p,
    sensores,
    ui: paneles,
    azar: azar(n * 31 + 7),
    _fallos: 0,
    _ultimoToque: 0,
    _resuelto: resuelto,
    tocar: (obj, fn) => entrada.registrar(obj, { tocar: fn }),
    mantener: (obj, bajar, soltar) => entrada.registrar(obj, { bajar, soltar }),
    arrastrar: (obj, op) => entrada.registrar(obj, { arrastre: op }),
    frotar: (obj, fn) => entrada.registrar(obj, { frotar: fn }),
    quitarToque: (obj) => entrada.quitar(obj),
    usar: (obj, item, fn) =>
      entrada.registrar(obj, {
        usar: (it) => {
          if (it !== item) return false;
          fn();
          return true;
        },
      }),
    conLlave: (item = 'llave') =>
      entrada.registrar(p.toque, {
        usar: (it) => {
          if (it !== item) return false;
          sonido.nota(900, 0.05, 0, 'square', 0.05);
          c.resolver();
          return true;
        },
      }),
    gesto: {
      toque: (fn) => void entrada.on('toque', fn),
      deslizar: (fn) => void entrada.on('deslizar', fn),
      trazo: (fn) => void entrada.on('trazo', fn),
      mover: (fn) => void entrada.on('mover', fn),
      dedos: (fn) => void entrada.on('dedos', fn),
      pellizco: (fn) => void entrada.on('pellizco', fn),
      giro: (fn) => void entrada.on('giro', fn),
    },
    sensor: {
      sacudida: (fn) => void quitar.push(sensores.on('sacudida', () => !entrada.bloqueada && fn())),
      volteo: (fn) => void quitar.push(sensores.on('volteo', () => !entrada.bloqueada && fn())),
      pantalla: (fn) => void quitar.push(sensores.on('pantalla', (ms) => !entrada.bloqueada && fn(ms))),
      soplido: (fn) => void quitar.push(sensores.on('soplido', () => !entrada.bloqueada && fn())),
    },
    enPlano: (x, y, plano) => entrada.enPlano(x, y, plano),
    dar: (item, desde) => {
      if (desde) {
        const inicio = desde.getWorldPosition(new THREE.Vector3());
        desde.visible = false;
        const s = escena.aPantalla(inicio);
        volarAlInventario(item, s.x, s.y);
      }
      inv.agregar(item);
      c.bien();
    },
    tiene: (item) => inv.items.includes(item),
    cada: (fn) => void quitar.push(escena.cada(fn)),
    despues: (ms, fn) => {
      let t = 0;
      const q = escena.cada((dt) => {
        t += dt * 1000;
        if (t >= ms) {
          q();
          fn();
        }
      });
      quitar.push(q);
    },
    enfocar: async (obj, distancia = 1.3) => {
      const punto = obj instanceof THREE.Vector3 ? obj : new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());
      mostrar('btn-volver', true);
      narrador.p.grupo.visible = false;
      await escena.enfocar(punto, distancia);
    },
    volver: async () => {
      mostrar('btn-volver', false);
      paneles.quitar();
      await escena.volver();
      if (jugando === n) narrador.p.grupo.visible = true;
    },
    bien: () => {
      sonido.repuesto();
      narrador.sonreir();
    },
    mal: () => {
      c._fallos++;
      sonido.vacia();
      if (c._fallos % 3 === 0) narrador.animar(n);
    },
    resolver: () => {
      if (hecho) return;
      hecho = true;
      resolver();
    },
    alSalir: (fn) => void quitar.push(fn),
    aviso: (texto, ms) => aviso(texto, ms),
    _salir: () => {
      for (const fn of quitar.splice(0)) fn();
      entrada.limpiar();
      inv.vaciar();
      escena.escena.remove(g);
      liberar(g);
      p.despegar();
      escena.atenuar(1);
      sensores.simular.soltar();
      mostrar('btn-volver', false);
    },
  };
  // La puerta cerrada se sacude al tocarla
  entrada.registrar(p.toque, { tocar: () => (p.bloqueada ? void p.sacudir() : c.resolver()) });
  entrada.on('toque', () => (c._ultimoToque = escena.t));
  return c;
}

function volarAlInventario(item: string, x: number, y: number) {
  const el = document.createElement('div');
  el.className = 'item-volando';
  el.innerHTML = iconoItem(item);
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.dataset.item = item;
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    const destino = $('inventario').getBoundingClientRect();
    el.style.left = `${destino.left + destino.width / 2}px`;
    el.style.top = `${destino.top + destino.height / 2}px`;
    el.style.opacity = '0';
  });
  setTimeout(() => el.remove(), 700);
}

/** Puerta todavía sin acertijo: se abre tocándola (para poder recorrer el juego mientras se construye). */
function pendiente(n: number): Nivel {
  return {
    titulo: `Puerta ${n}`,
    pistas: ['Esta puerta todavía se está construyendo.', 'Tócala para pasar.'],
    montar(c) {
      c.puerta.bloqueada = false;
      c.tocar(c.puerta.toque, () => c.resolver());
    },
    async prueba(p) {
      await p.tocar(p.obj('puerta toque'));
    },
  };
}

// ---------------------------------------------------------------------------
// Pruebas
// ---------------------------------------------------------------------------
const probador = () => new ProbadorReal(() => escena.escena, escena, entrada, paneles, inv, sensores);

(window as unknown as Record<string, unknown>).__puertas = {
  jugar: (n: number) => jugar(n),
  estado: () => ({ jugando, progreso, bloqueada: entrada?.bloqueada, abierta: puerta?.abierta, items: inv.items }),
  /** Resuelve la puerta que se está jugando con su prueba (toques y sensores simulados). */
  probar: async () => {
    const n = jugando;
    const nivel = NIVELES[n] ?? pendiente(n);
    await new Promise<void>((r) => {
      const esperar = () => (!entrada.bloqueada ? r() : setTimeout(esperar, 50));
      esperar();
    });
    await nivel.prueba(probador());
  },
  sensores: () => sensores.simular,
  /** Qué objeto recibe un toque sobre `nombre` (para depurar). */
  buscar: (nombre: string) => {
    const pr = probador();
    const s = pr.pantalla(nombre);
    const b = entrada.buscar(s.x, s.y);
    return { ...s, obj: b?.obj.name ?? null, cual: b?.hit.object.name ?? null };
  },
  camara: () => escena.camara.position.toArray(),
};

void iniciar();
