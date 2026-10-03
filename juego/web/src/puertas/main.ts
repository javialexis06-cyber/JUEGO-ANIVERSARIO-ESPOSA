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
import { sesionGuardada } from '../casa/sincro';
import { elegirModelos, liberarEsqueletos } from '../recursos';
import * as sonido from '../sonido';
import * as fondo from '../segundo_plano';
import { tema } from './cuarto';
import { Desorden, esquinaNarrador, zonasNarrador } from './desorden';
import { Entrada } from './entrada';
import { Escena, MIRA, OJO } from './escena';
import { CAPITULOS, capituloDe, elegir, FINAL_DE, HALLAZGO, INICIO, PUERTAS, RECUERDOS, recuerdoDe, voz } from './historia';
import { azar, grupo, iconoItem } from './kit';
import { Narrador } from './narrador';
import type { Ctx, Nivel } from './nivel';
import { NIVELES } from './niveles';
import { ProbadorReal } from './probador';
import { Puerta } from './puerta';
import { Sensores } from './sensores';
import { idRecuerdo } from './voces';
import { gastarMonedas, saldo } from './monedero';
import { HUECO } from './puerta';
import { rectDeCaja } from './revision';
import { despejar, esDe, listarImportantes, mascaraImportante } from './protegidas';
import { Pareja, retrato, SENAS, type Juego, type Papel } from './pareja';
import { CanalPuertas, type InvPuertas } from './pareja_red';
import type { PlanoDesorden } from './desorden';
import * as sonidoEco from './sonido_eco';
import { Efectos, estrellas as celebrarEstrellas, quitarTarjeta, tarjetaPuerta, toque as ondaToque } from './efectos';
import * as sfx from './sonidos';
import { $, ANTOJOS, aviso, esc, Inventario, mostrar, Paneles, pausa, tarjetaRecuerdo, type Antojo } from './ui';

const params = new URLSearchParams(location.search);
const CLAVE = 'cien-puertas';
const CLAVE_SUELDO = 'nuestro-hogar-sueldo';
// Las monedas van a la casa (un cuarto de lo que era: la casa se gana despacio)
const MONEDAS_PUERTA = 1;
const MONEDAS_CAPITULO = 10;
/** A partir de cuándo late el botón de los antojos (siempre está, pero cuesta). */
const PISTA_TRAS = 60;
const SIN_HISTORIA = params.get('sinhistoria') === '1';
/** Pruebas: semilla del desorden (para revisar cada puerta con varios regueros distintos). */
const SEMILLA = params.has('semilla') ? Number(params.get('semilla')) || 0 : null;
/** Pruebas: al abrirse la puerta no se sigue a la siguiente. */
const UNA = params.get('una') === '1';

interface Progreso {
  /** Última puerta abierta (0 = ninguna). */
  hasta: number;
  estrellas: Record<number, number>;
  vioInicio: boolean;
  /** (Versión vieja: capítulos cuyo recuerdo se vio; ahora un recuerdo se tiene si su puerta ya se abrió.) */
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
let efectos: Efectos;
const paneles = new Paneles();
const inv = new Inventario();
let cuarto: THREE.Group | null = null;
let puerta: Puerta | null = null;
let capActual = 0;
let jugando = 0;
type CtxJuego = Ctx & {
  _salir: () => void;
  _resuelto: Promise<void>;
  _fallos: number;
  _ultimoToque: number;
  _desorden?: Desorden;
  /** Lo que el nivel marcó como importante con `proteger`. */
  _protegidos: THREE.Object3D[];
  /** La decoración fija que se quitó porque tapaba algo importante. */
  _quitados: string[];
  /** Pruebas: lo que se revisó en cada acercamiento de la cámara. */
  _vistas: unknown[];
  /** En pareja (invitado): la puerta la abre el anfitrión. */
  _forzar: () => void;
  /** En pareja, puerta repartida: lo que solo ve uno de los dos. */
  _pista: THREE.Object3D[];
};
let ctx: CtxJuego | null = null;
/** En pareja: la partida con el otro celular (y el canal donde llegan las invitaciones). */
let pareja: Pareja | null = null;
let canal: CanalPuertas | null = null;

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
  // Revisión automática: sin dibujar (va mucho más rápido)
  if (params.get('revisar') === '1') escena.dibujar = false;
  sensores = new Sensores();
  sensores.teclado();
  entrada = new Entrada($('lienzo') as HTMLCanvasElement, escena.camara);
  entrada.alGastar = (item) => inv.quitar(item);
  entrada.alTocar = (x, y, algo) => ondaToque(x, y, algo);
  efectos = new Efectos(escena);
  inv.alElegir = (item) => (entrada.item = item);
  paneles.alFallar = () => ctx?.mal();
  await elegirModelos();
  barra(0.4, 'Despertando a quien te acompaña…');
  narrador = new Narrador(otro(yo), escena);
  await narrador.cargar();
  // El narrador empuja lo que tenga en los pies cuando camina
  escena.cada(() => {
    if (ctx?._desorden && narrador.p.moviendo && narrador.p.grupo.visible) ctx._desorden.empujar(narrador.p.pos.x, -narrador.p.pos.y);
    if (tamPuerta !== `${window.innerWidth}x${window.innerHeight}`) ubicarPuerta();
  });
  barra(1, 'Listo');
  // El bucle de dibujo se detiene solo en segundo plano (y vuelve sin saltos); a lo sumo 30 cuadros por segundo para
  // que el celular no se caliente
  let acumulado = 0;
  fondo.cuadros((dt) => {
    acumulado += dt;
    if (acumulado < 1 / 31) return;
    const paso = Math.min(acumulado, 0.1);
    acumulado = 0;
    sensores.actualizar();
    escena.cuadro(paso);
  });
  controles();
  mostrar('carga', false);
  const n = Number(params.get('puerta'));
  const unirse = params.get('unirse');
  if (unirse) {
    // Invitación que llegó a la casa: se acepta aquí
    mapa();
    iniciarCanal().recordar({ id: unirse, puerta: n >= 1 && n <= 100 ? n : 1, de: otro(yo) });
  } else if (n >= 1 && n <= 100) void jugar(n);
  else mapa();
  // Si este celular está en la casa en línea, se escuchan las invitaciones de la pareja
  if (!unirse && sesionGuardada() && !params.has('sinpareja')) iniciarCanal();
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
  $('btn-pista').onclick = () => void antojo();
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
  // En pareja
  $('btn-pareja').onclick = () => {
    sonido.toque();
    void menuPareja();
  };
  $('btn-sena').onclick = () => {
    sonido.toque();
    const m = $('senas');
    m.hidden = !m.hidden;
  };
  $('senas').innerHTML = `${SENAS.map((x) => `<button class="sena sena-${x.k}" data-k="${x.k}">${esc(x.boton)}</button>`).join('')}<button class="sena sena-notica" data-k="notica">Escribirle una notica…</button>`;
  for (const b of $('senas').querySelectorAll<HTMLButtonElement>('button')) {
    b.onclick = () => {
      mostrar('senas', false);
      if (b.dataset.k === 'notica') {
        mostrar('libretica', true);
        ($('libretica-texto') as HTMLInputElement).value = '';
        $('libretica-texto').focus();
      } else pareja?.sena(b.dataset.k!);
    };
  }
  ($('libretica') as HTMLFormElement).onsubmit = (e) => {
    e.preventDefault();
    pareja?.notica(($('libretica-texto') as HTMLInputElement).value);
    mostrar('libretica', false);
  };
  $('libretica-cerrar').onclick = () => mostrar('libretica', false);
  $('pareja-pausa-salir').onclick = () => {
    sonido.toque();
    salirAlMapa();
  };
  if (Capacitor.isNativePlatform()) {
    void App.addListener('backButton', () => {
      if (!$('hoja-pareja').hidden) mostrar('hoja-pareja', false);
      else if (paneles.abierto) paneles.quitar();
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
  $('btn-recuerdos').textContent = `Recuerdos ${RECUERDOS.filter((r) => r.puerta <= progreso.hasta).length}/${RECUERDOS.length}`;
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
      if (eligiendoPareja) {
        eligiendoPareja = false;
        $('mapa').classList.remove('eligiendo-pareja');
        void invitar(Number(b.dataset.n));
      } else void jugar(Number(b.dataset.n));
    };
  }
  $('btn-pareja').classList.toggle('en-linea', !!canal?.otroPresente);
  $('capitulos').querySelector('.siguiente')?.scrollIntoView({ block: 'center' });
}

const nombreDe = (r: Rol) => (r === 'el' ? 'Él' : 'Ella');

/** Los recuerdos recuperados, para volver a leerlos. */
function album() {
  const html = RECUERDOS.map((r, i) =>
    r.puerta <= progreso.hasta
      ? `<article><h4>${esc(r.titulo)}</h4><small>${esc(r.fecha)}</small>${r.dialogo
          .map(([q, t]) => `<p><span class="quien ${q}">${nombreDe(q)}:</span> ${esc(voz(t, q))}</p>`)
          .join('')}</article>`
      : `<article class="bloqueado"><h4>Recuerdo ${i + 1}</h4><small>Vuelve al abrir la puerta ${r.puerta}</small></article>`,
  ).join('');
  void paneles.nota(`<div class="album">${html}</div>`, 'album-recuerdos');
}

function salirAlMapa(texto?: string) {
  if (pareja) {
    pareja.salir(!texto);
    pareja = null;
  }
  mostrar('pareja-espera', false);
  mostrar('senas', false);
  if (texto) aviso(texto, 3200);
  mostrar('fundido', false);
  $('tarjeta-puerta').hidden = true;
  tarjetaDe = 0;
  document.body.classList.remove('animando');
  efectos?.apagar();
  paneles.quitar();
  terminarCtx();
  narrador.esconder();
  mapa();
}


// ---------------------------------------------------------------------------
// En pareja: invitar, aceptar y jugar la misma puerta cada uno en su celular
// ---------------------------------------------------------------------------
let eligiendoPareja = false;

/** Hoja de diálogo de la pareja (invitaciones, esperas). */
function hojaPareja(html: string, botones: { texto: string; clase?: string; alTocar?: () => void }[]) {
  $('hoja-pareja-cuerpo').innerHTML = html;
  const fila = $('hoja-pareja-botones');
  fila.innerHTML = '';
  for (const b of botones) {
    const el = document.createElement('button');
    el.className = `boton ${b.clase ?? 'boton-papel'}`;
    el.textContent = b.texto;
    el.onclick = () => {
      sonido.toque();
      mostrar('hoja-pareja', false);
      b.alTocar?.();
    };
    fila.appendChild(el);
  }
  mostrar('hoja-pareja', true);
}

const cara = (r: Rol) => `<i class="cara-pareja grande" style="background-image:url('${retrato(r)}')"></i>`;

/** El canal de la pareja (para invitar y para que lleguen las invitaciones mientras se está aquí). */
function iniciarCanal() {
  if (canal) return canal;
  canal = new CanalPuertas(yo, {
    alCambiar: () => {
      if (!$('mapa').hidden) $('btn-pareja').classList.toggle('en-linea', !!canal?.otroPresente);
    },
    alInvitacion,
  });
  void canal.conectar();
  return canal;
}

async function menuPareja() {
  const c = iniciarCanal();
  const de = otro(yo);
  if (!c.listo) {
    hojaPareja(`${cara(de)}<h3>Conectando…</h3><p>Buscando la casa en línea para jugar con ${nombreDe(de)}.</p>`, [{ texto: 'Entendido' }]);
    for (let i = 0; i < 40 && !c.listo && !c.error; i++) await pausa(150);
    if (!c.listo) {
      hojaPareja(`${cara(de)}<h3>Sin conexión</h3><p>${esc(c.error || 'No se pudo conectar.')}</p><p>Para jugar en pareja, los dos tienen que estar en la misma casa en línea (se configura en la casa, en Ajustes).</p>`, [{ texto: 'Entendido', clase: 'boton-tomate' }]);
      return;
    }
    mostrar('hoja-pareja', false);
  }
  const siguiente = Math.min(100, progreso.hasta + 1);
  hojaPareja(
    `${cara(de)}<h3>Cien Puertas en pareja</h3><p>Los dos resuelven la misma puerta al tiempo, cada uno en su celular: lo que uno mueve, el otro lo ve.${c.otroPresente ? ` <b>${nombreDe(de)} está aquí ahorita.</b>` : ` A ${nombreDe(de)} le llega la invitación en la casa.`}</p>`,
    [
      { texto: 'Elegir en el mapa', alTocar: () => {
        eligiendoPareja = true;
        $('mapa').classList.add('eligiendo-pareja');
        aviso(`Toca la puerta a la que quieres invitar a ${nombreDe(de)}.`, 3200);
      } },
      { texto: `Puerta ${siguiente}`, clase: 'boton-tomate', alTocar: () => void invitar(siguiente) },
    ],
  );
}

async function invitar(n: number) {
  const c = iniciarCanal();
  if (!c.listo) return void menuPareja();
  const de = otro(yo);
  const inv: InvPuertas = { id: `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`, puerta: n, de: yo };
  hojaPareja(`${cara(de)}<h3>Invitaste a ${nombreDe(de)}</h3><p>Puerta ${n}: esperando a que acepte…</p>`, [{ texto: 'Cancelar', alTocar: () => c.cancelar(inv.id) }]);
  const ok = await c.invitar(inv);
  mostrar('hoja-pareja', false);
  if (!ok) {
    aviso(`${nombreDe(de)} no aceptó (o no estaba). Intenta en un ratico.`, 3200);
    return;
  }
  empezarPareja('anfitrion', inv);
}

function alInvitacion(inv: InvPuertas) {
  if (inv.de === yo || pareja) return;
  sonido.aviso();
  hojaPareja(`${cara(inv.de)}<h3>¡${nombreDe(inv.de)} te invita!</h3><p>¿Abrimos juntos la <b>puerta ${inv.puerta}</b>? Cada uno en su celular.</p>`, [
    { texto: 'Ahora no', alTocar: () => canal?.responder(inv, false) },
    { texto: '¡Vamos!', clase: 'boton-tomate', alTocar: () => empezarPareja('invitado', inv) },
  ]);
}

/** Empieza la partida en pareja (el invitado espera a que el anfitrión arme la puerta). */
function empezarPareja(papel: Papel, inv: InvPuertas) {
  if (!canal) return;
  eligiendoPareja = false;
  $('mapa').classList.remove('eligiendo-pareja');
  if (pareja) pareja.salir(false);
  // Si estaba jugando sola/o, se sale de esa puerta
  terminarCtx();
  narrador.esconder();
  pareja = new Pareja(papel, inv.id, yo, canal, juegoPareja);
  if (papel === 'invitado') {
    canal.responder(inv, true);
    mostrar('mapa', false);
    esperarPuerta();
    // Si el anfitrión no aparece, se vuelve al mapa
    const p = pareja;
    window.setTimeout(() => {
      if (pareja === p && !jugando && !p.cuenta.movs) salirAlMapa(`No se pudo conectar con ${nombreDe(otro(yo))}. Intenten otra vez.`);
    }, 20000);
  } else void jugar(inv.puerta);
}

/** Lo que la pareja necesita del juego. */
const juegoPareja: Juego = {
  get escena() {
    return escena;
  },
  get entrada() {
    return entrada;
  },
  get sensores() {
    return sensores;
  },
  inv,
  paneles,
  jugar: (n, plano) => void jugar(n, plano),
  puerta: () => jugando,
  resuelta: (n) => {
    if (jugando === n) ctx?._forzar();
  },
  cara: (k) => {
    if (k === 'bien') {
      sonido.repuesto();
      narrador.sonreir();
    } else {
      sonido.vacia();
      if (ctx) {
        ctx._fallos++;
        if (ctx._fallos % 3 === 0) narrador.animar(jugando);
      }
    }
  },
  pista: (nivel) => void pistaQueLlega(nivel),
  salirAlMapa: (texto) => salirAlMapa(texto),
  raices: () => [cuarto, ctx?.g, ctx?._desorden?.grupo].filter((x) => !!x) as THREE.Object3D[],
};

/** El otro compró una pista: el narrador se come el dulce y la dice aquí también. */
async function pistaQueLlega(nivel: number) {
  const n = jugando;
  const nv = NIVELES[n];
  if (!nv || !ctx || nivel <= pistaDada.length) return;
  pistaDada = nv.pistas.slice(0, nivel);
  const a = ANTOJOS[nivel - 1];
  if (!escena.enVistaGeneral) await ctx.volver();
  aviso(`${nombreDe(otro(yo))} le compró ${a.nombre.toLowerCase()} a cambio de una pista`, 2600);
  await narrador.comer();
  if (jugando !== n) return;
  await narrador.decir([nv.pistas[nivel - 1]]);
  void narrador.irEsquina();
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

async function jugar(n: number, plano?: PlanoDesorden) {
  const turno = ++jugadas;
  const papel: Papel | 'solo' = pareja?.papel ?? 'solo';
  // La tarjeta con el número de la puerta mientras se arma (sobre el fundido)
  const tapada = cubrir(n);
  mostrar('mapa', false);
  mostrar('pareja-espera', false);
  terminarCtx();
  efectos.apagar();
  const cap = Math.ceil(n / 10);
  if (cap !== capActual || !puerta) armarCapitulo(cap);
  else puerta.cerrar();
  escena.vistaGeneral();
  jugando = n;
  const nivel: Nivel = NIVELES[n] ?? pendiente(n);
  const c = crearCtx(n, papel);
  ctx = c;
  entrada.bloqueoRemoto = true;
  // (en pareja, si el anfitrión ya la abrió mientras el invitado seguía en la anterior)
  if (papel === 'invitado' && pareja?.resueltas.has(n)) c._forzar();
  await nivel.montar(c);
  if (turno !== jugadas) return;
  // Las cosas regadas del cuarto (sin tapar la puerta ni lo del acertijo)
  narrador.esquina = esquinaNarrador(escena.camara);
  c._desorden = new Desorden(c, escena, cap, {
    interfaz: zonasInterfaz(),
    narrador: zonasNarrador(narrador.esquina),
    voz: (t) => voz(t, otro(yo)),
    alRomper: (primera) => narrador.susto(primera && !pistaDada.length ? elegir(ROTO, n) : undefined),
    semilla: SEMILLA !== null ? SEMILLA * 7919 + n * 104729 + 17 : undefined,
    protegida: () => mascaraImportante(importantesDe(c), camaraVista(), window.innerWidth, window.innerHeight, 8),
    firma: nombreDe(otro(yo)),
  });
  // En pareja el invitado riega lo mismo que el anfitrión (sus pantallas pueden ser de otro tamaño)
  if (papel === 'invitado' && plano) c._desorden.sembrarDesde(plano);
  else c._desorden.sembrar(nivel.desorden);
  if (pareja) {
    pareja.empezarPuerta(n, raicesEspejo(c), papel === 'anfitrion' ? c._desorden.plano() : undefined);
    // Puerta repartida: uno ve la pista y el otro tiene el candado
    c._pista = (nivel.pareja?.pista ?? []).map((x) => c.g.getObjectByName(x)).filter((x): x is THREE.Object3D => !!x);
    pareja.repartir(n, c._pista);
  }
  // La decoración fija del escenario que tape algo importante se quita mientras dura la puerta
  const despeje = despejar(cuarto!, puerta!.grupo, importantesDe(c), camaraVista());
  c._quitados = despeje.quitados;
  c.alSalir(despeje.poner);
  ubicarPuerta();
  // Se destapa la puerta nueva (con la cámara asentándose suavecito)
  await tapada;
  if (turno !== jugadas) return;
  destapar();
  $('hud-puerta').textContent = `Puerta ${n}`;
  $('hud-lugar').textContent = capituloDe(n).titulo;
  mostrar('hud', true);
  mostrar('btn-pista', false);
  mostrar('btn-volver', false);
  $('btn-pista').classList.remove('latiendo');
  // El narrador cuenta la historia (en pareja el otro ya puede ir jugando)
  entrada.bloqueada = true;
  entrada.bloqueoRemoto = false;
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
  if (pareja && nivel.pareja?.aviso) aviso(nivel.pareja.aviso, 6000);
  const t0 = escena.t;
  c._ultimoToque = escena.t;
  // El ambiente del escenario (pájaros, olas, grillos…)
  const amb = sfx.AMBIENTE[cap];
  const cadaPropio = (fn: (dt: number, t: number) => void) => c.alSalir(escena.cada(fn));
  if (amb && !sfx.SIN_AMBIENTE.has(n)) {
    let falta = 2 + Math.random() * 3;
    cadaPropio((dt) => {
      falta -= dt;
      if (falta > 0) return;
      falta = amb.cada[0] + Math.random() * (amb.cada[1] - amb.cada[0]);
      amb.sonar();
    });
  }
  // Los antojos (pistas pagadas) están desde el comienzo; el botón late después de un rato
  mostrar('btn-pista', true);
  let pistaLate = false;
  cadaPropio((_, t) => {
    if (!pistaLate && t - t0 > (c._fallos >= 3 ? PISTA_TRAS / 2 : PISTA_TRAS)) {
      pistaLate = true;
      $('btn-pista').classList.add('latiendo');
    }
    // Un buen rato sin tocar nada: ánimo (nunca pistas)
    if (t - c._ultimoToque > 55) {
      c._ultimoToque = t;
      narrador.animar(n);
    }
  });
  await c._resuelto;
  if (turno !== jugadas) return;
  pareja?.resuelta(n);
  // ¡Abierta!
  entrada.bloqueada = true;
  entrada.bloqueoRemoto = true;
  paneles.quitar();
  mostrar('btn-pista', false);
  mostrar('btn-volver', false);
  if (!escena.enVistaGeneral) await escena.volver();
  // Mientras se abre, la interfaz se hace a un lado (semitransparente)
  document.body.classList.add('animando');
  efectos.abrir(puerta!.cerradura.getWorldPosition(new THREE.Vector3()), LUZ_PUERTA[cap] ?? '#fff1c8');
  await puerta!.abrir();
  efectos.confetiAbrir();
  void efectos.recuerdo();
  const primera = n > progreso.hasta;
  const segundos = escena.t - t0;
  // Con pista grande, una estrella; con la pistica, máximo dos
  const estrellas = pistaDada.length >= 2 ? 1 : pistaDada.length === 1 ? Math.min(2, segundos < 90 ? 3 : 2) : segundos < 90 ? 3 : 2;
  progreso.estrellas[n] = Math.max(progreso.estrellas[n] ?? 0, estrellas);
  // En pareja la casa es una sola: las monedas las manda el anfitrión (y el avance se cuenta si era la que seguía)
  if (papel === 'solo' ? primera : n === progreso.hasta + 1) progreso.hasta = n;
  const ganadas = primera && papel !== 'invitado' ? MONEDAS_PUERTA + (n % 10 === 0 ? MONEDAS_CAPITULO : 0) : 0;
  if (ganadas) pagar(ganadas);
  celebrarEstrellas(n, estrellas, ganadas);
  guardar();
  if (UNA) return;
  if (!SIN_HISTORIA) {
    await narrador.celebrar(n);
    if (n % 10 === 0) await narrador.decir(capituloDe(n).despedida);
    // Cada cinco puertas vuelve un recuerdo de verdad, contado por los dos
    const r = recuerdoDe(n);
    if (r) {
      if (n % 10 !== 0) await narrador.decir([elegir(HALLAZGO, n / 5)]);
      await tarjetaRecuerdo(r, RECUERDOS.indexOf(r) + 1, RECUERDOS.length);
      await narrador.conversar(r.dialogo, nombreDe(yo), r.dialogo.map((_, i) => idRecuerdo(r.puerta, i)));
    }
    if (n === 100) await narrador.decir(FINAL_DE[otro(yo)], FINAL_DE[otro(yo)].map((_, i) => `final-${otro(yo)}-${i + 1}`));
  }
  if (turno !== jugadas) return;
  // Cruzar la puerta
  void narrador.cruzar();
  await cruzar(n < 100 && papel !== 'invitado' ? n + 1 : null);
  if (turno !== jugadas) return;
  terminarCtx();
  // En pareja, el invitado espera a que el anfitrión arme la siguiente
  if (papel === 'invitado' && pareja) {
    if (n < 100) esperarPuerta();
    pareja.listo();
  } else if (n < 100) void jugar(n + 1);
  else {
    escena.vistaGeneral();
    mapa();
  }
}

/** Lo que se sigue en el espejo de pareja: lo del acertijo, el desorden y lo pegado a la puerta. */
function raicesEspejo(c: CtxJuego) {
  return [c.g, ...(c._desorden ? [c._desorden.grupo] : []), ...c.puerta.pegadas];
}

/** (invitado) Mientras el anfitrión arma la siguiente puerta. */
function esperarPuerta() {
  $('pareja-espera-texto').textContent = `Esperando a que ${nombreDe(otro(yo))} abra la siguiente puerta…`;
  mostrar('pareja-espera', true);
}
let jugadas = 0;
/** Las pistas que ya soltó el narrador en esta puerta (de la 1 a la 3). */
let pistaDada: string[] = [];

/** Lo que dice el narrador cuando algo se rompe (una vez por puerta). */
const ROTO = ['¡Ay, eso era de mi abuela!', 'Tranquil{a|o}… después lo pegamos.', '¡Uy! Hagamos como que no pasó.', 'Eso no era la llave, mi amor.', '¡Mi cosita favorita!'];

/** Rectángulo de la puerta en la pantalla: el globo del narrador se acomoda sin taparla. */
let tamPuerta = '';
function ubicarPuerta() {
  if (!escena || !narrador) return;
  tamPuerta = `${window.innerWidth}x${window.innerHeight}`;
  const cam = escena.camara.clone();
  cam.position.copy(OJO);
  cam.lookAt(0, 1.15, 0);
  cam.updateMatrixWorld();
  const caja = new THREE.Box3(new THREE.Vector3(-HUECO.w / 2 - 0.12, 0, 0), new THREE.Vector3(HUECO.w / 2 + 0.12, HUECO.h + 0.12, 0.05));
  narrador.globo.evitar = rectDeCaja(caja, cam, window.innerWidth, window.innerHeight);
}

/** La cámara de la vista general (la de verdad puede estar acercada a algo). */
function camaraVista() {
  const cam = escena.camara.clone();
  cam.position.copy(OJO);
  cam.lookAt(MIRA);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  return cam;
}

/** Lo que no se puede tapar en esta puerta (ver protegidas.ts). */
function importantesDe(c: CtxJuego) {
  return listarImportantes({ g: c.g, puerta: c.puerta, entrada, extra: [...c._protegidos, ...(c._desorden?.papeles ?? [])] });
}

/** Zonas de la interfaz donde no se riegan cosas (se tocarían los botones en vez de ellas). */
function zonasInterfaz() {
  const W = window.innerWidth, H = window.innerHeight;
  return [
    { x0: 0, y0: 0, x1: 150, y1: 70 },
    { x0: W - 190, y0: 0, x1: W, y1: 70 },
    { x0: W - 80, y0: 60, x1: W, y1: H },
    { x0: W - 130, y0: H - 70, x1: W, y1: H },
  ];
}

/** Cruza la puerta abierta: la cámara entra por la luz, todo se pone blanco y sale la tarjeta de la siguiente. */
async function cruzar(siguiente: number | null) {
  const f = $('fundido');
  f.className = 'fundido';
  f.style.transition = '';
  f.style.opacity = '0';
  f.hidden = false;
  efectos.atenuarRayos();
  const desde = OJO.clone();
  await escena.animar(1100, (k) => {
    escena.camara.position.set(0, desde.y - 0.1 * k, desde.z - 4.6 * k);
    escena.camara.lookAt(0, 1.25, -2);
    f.style.opacity = String(Math.max(0, (k - 0.45) / 0.55));
  });
  f.style.opacity = '1';
  if (siguiente) {
    tarjetaPuerta(siguiente, capituloDe(siguiente), siguiente % 10 === 1);
    tarjetaDesde = performance.now();
    tarjetaDe = siguiente;
  }
  escena.vistaGeneral();
}
let tarjetaDesde = 0;
let tarjetaDe = 0;

/** Tapa el cuarto mientras se arma la puerta n (con su tarjeta). Termina cuando ya se alcanzó a leer. */
async function cubrir(n: number) {
  if (escena.dibujar === false) return;
  const f = $('fundido');
  if (f.hidden) {
    // Desde el mapa: de noche, con la tarjeta
    f.className = 'fundido noche';
    f.style.transition = '';
    f.style.opacity = '1';
    f.hidden = false;
  }
  if (tarjetaDe !== n || $('tarjeta-puerta').hidden) {
    tarjetaPuerta(n, capituloDe(n), n % 10 === 1);
    tarjetaDesde = performance.now();
    tarjetaDe = n;
  }
  const falta = (n % 10 === 1 ? 1300 : 800) - (performance.now() - tarjetaDesde);
  if (falta > 0) await pausa(falta);
}

/** Se destapa la puerta nueva: se va el fundido y la cámara se asienta suavecito. */
function destapar() {
  const f = $('fundido');
  document.body.classList.remove('animando');
  mostrar('pareja-espera', false);
  if (f.hidden) return;
  quitarTarjeta();
  tarjetaDe = 0;
  const ojo0 = OJO.clone().add(new THREE.Vector3(0, 0.1, -0.4));
  escena.camara.position.copy(ojo0);
  escena.camara.lookAt(MIRA);
  void escena.animar(750, (k) => {
    escena.camara.position.lerpVectors(ojo0, OJO, k);
    escena.camara.lookAt(MIRA);
    if (k >= 1) escena.vistaGeneral();
  });
  requestAnimationFrame(() => {
    f.style.transition = 'opacity .6s';
    f.style.opacity = '0';
    window.setTimeout(() => {
      if (f.style.opacity !== '0') return;
      f.hidden = true;
      f.style.transition = '';
    }, 640);
  });
}

/** El color de la luz que sale por la puerta de cada capítulo. */
const LUZ_PUERTA: Record<number, string> = { 1: '#fff1c8', 2: '#f4ffd0', 3: '#ffe2c0', 4: '#dff0ff', 5: '#ffd9a0', 6: '#d8ffb8', 7: '#ffd0e8', 8: '#e8d8ff', 9: '#cfe6ff', 10: '#ffd6e4' };

function pagar(monedas: number) {
  try {
    localStorage.setItem(CLAVE_SUELDO, String((Number(localStorage.getItem(CLAVE_SUELDO)) || 0) + monedas));
  } catch {
    /* sin almacenamiento */
  }
}

/** Lo que dice el narrador antes de soltar la pista (según el dulce). */
const ANTES_DE_PISTA: Record<number, string[]> = {
  1: ['Mmm, rico… Bueno, solo un poquito:', 'Un caramelo, una pistica:', 'Ay, qué dulce eres. Te digo algo chiquito:'],
  2: ['¡Chocolates! Así sí se habla:', 'Con chocolate hasta te ayudo un poco más:', 'Mmm… Está bien, te lo digo más claro:'],
  3: ['¡Fresas con crema! Por esto te lo digo casi todo:', 'Me compraste, lo admito. Escucha bien:', 'Con fresas no me puedo negar:'],
};
const SIN_PLATA = ['¿Sin dulce? Así no se vale, mi amor.', 'Primero mi antojo… y no alcanza.', 'Esa alcancía está flaquita. Tú puedes sin mí.'];

/** Los antojos del narrador: se le compra un dulce y a cambio suelta una pista (más grande mientras más cueste). */
async function antojo() {
  const n = jugando;
  const nivel = NIVELES[n];
  if (!nivel || !ctx || entrada.bloqueada || paneles.abierto) return;
  sonido.toque();
  const quien = nombreDe(otro(yo));
  const elegido = await paneles.antojos({ quien, yaDio: pistaDada, saldo: saldo().then((s) => s.total) });
  if (!elegido || jugando !== n) return;
  entrada.bloqueada = true;
  try {
    if (!(await gastarMonedas(elegido.precio))) {
      narrador.negarse(elegir(SIN_PLATA, n + pistaDada.length));
      return;
    }
    sfx.monedas(3);
    // Si la cámara estaba acercada a algo, se vuelve para ver al narrador comer
    if (!escena.enVistaGeneral) await ctx?.volver();
    await darDulce(elegido);
    if (jugando !== n) return;
    // En pareja la pista es de los dos: al otro también se la dice su narrador
    pareja?.mandar({ t: 'pista', nivel: elegido.nivel });
    await narrador.comer();
    pistaDada = nivel.pistas.slice(0, elegido.nivel);
    await narrador.decir([elegir(ANTES_DE_PISTA[elegido.nivel], n), nivel.pistas[elegido.nivel - 1]]);
    void narrador.irEsquina();
  } finally {
    if (jugando === n) entrada.bloqueada = false;
  }
}

/** El dulce vuela del botón hasta el narrador. */
function darDulce(a: Antojo) {
  const el = document.createElement('div');
  el.className = 'item-volando';
  el.innerHTML = a.icono;
  const b = $('btn-pista').getBoundingClientRect();
  el.style.left = `${b.left + b.width / 2}px`;
  el.style.top = `${b.top + b.height / 2}px`;
  document.body.appendChild(el);
  const cabeza = narrador.p.grupo.localToWorld(new THREE.Vector3(0, 1.3, 0));
  const s = escena.aPantalla(cabeza);
  requestAnimationFrame(() => {
    el.style.left = `${s.x}px`;
    el.style.top = `${s.y}px`;
  });
  return new Promise<void>((listo) =>
    setTimeout(() => {
      el.remove();
      listo();
    }, 650),
  );
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
function crearCtx(n: number, papel: Papel | 'solo' = 'solo') {
  const g = grupo(`acertijo ${n}`);
  escena.escena.add(g);
  const quitar: (() => void)[] = [];
  let resolver!: () => void;
  const resuelto = new Promise<void>((r) => (resolver = r));
  let hecho = false;
  /** Al salir de la puerta queda muerta: lo que un montaje lento registre tarde ya no se cuela en la siguiente. */
  let vivo = true;
  /** En pareja el invitado no aplica las reglas del acertijo (las aplica el anfitrión y llegan en el espejo). */
  const invitado = papel === 'invitado', anfitrion = papel === 'anfitrion';
  const reglas = !invitado;
  /** Quién pidió el acercamiento de la cámara que está puesto (en pareja, puede ser el otro). */
  let enfocadoPor: 'yo' | 'otro' | null = null;
  /** ¿Esto lo hizo el otro (en pareja, siendo anfitrión)? Entonces el candado o el acercamiento le salen a él. */
  const delOtro = () => anfitrion && !!pareja && (entrada.delOtro() || enfocadoPor === 'otro');
  const uiPara = () => (delOtro() && pareja?.panelesOtro ? pareja.panelesOtro : paneles);
  /** En una puerta repartida, ¿quién hizo esto (el anfitrión o el invitado)? */
  const actor = (): Papel => (entrada.delOtro() ? 'invitado' : 'anfitrion');
  const avisoPara = (quien: Papel, texto: string) => (quien === 'anfitrion' ? aviso(texto, 3400) : pareja?.mandar({ t: 'aviso', texto, ms: 3400 }));
  const rolDe = (quien: Papel) => (quien === 'anfitrion' ? yo : otro(yo));
  /** Puerta repartida: el candado no lo abre quien ve la pista. */
  const candadoAjeno = () => {
    if (!anfitrion || !pareja?.vigia || actor() !== pareja.vigia) return false;
    const cerrajero: Papel = pareja.vigia === 'anfitrion' ? 'invitado' : 'anfitrion';
    avisoPara(pareja.vigia, `El candado lo abre ${nombreDe(rolDe(cerrajero))} esta vez: cuéntale lo que ves (o mándale una notica).`);
    return true;
  };
  /** Puerta repartida: la pista no la toca quien tiene el candado. */
  const pistaAjena = (obj: THREE.Object3D) => {
    if (!anfitrion || !pareja?.vigia || actor() === pareja.vigia) return false;
    if (!c._pista.some((x) => esDe(obj, x) || esDe(x, obj))) return false;
    avisoPara(actor(), `Eso lo ve ${nombreDe(rolDe(pareja.vigia))} esta vez: pídele que te cuente.`);
    return true;
  };
  const ui = {
    ruedas: (op: Parameters<Paneles['ruedas']>[0]) => (candadoAjeno() ? Promise.resolve(false) : uiPara().ruedas(op)),
    teclado: (op: Parameters<Paneles['teclado']>[0]) => (candadoAjeno() ? Promise.resolve(false) : uiPara().teclado(op)),
    nota: (html: string, clase?: string) => uiPara().nota(html, clase),
    quitar: () => uiPara().quitar(),
    get abierto() {
      return uiPara().abierto;
    },
  } as unknown as Paneles;
  pistaDada = [];
  entrada.limpiar();
  entrada.on('usoFallido', () => !entrada.delOtro() && inv.noSirve());
  inv.vaciar();
  const p = puerta!;
  const reg = (obj: THREE.Object3D, r: Parameters<Entrada['registrar']>[1]) => void (vivo && entrada.registrar(obj, r));
  const sensor = (tipo: 'sacudida' | 'volteo' | 'pantalla' | 'soplido', fn: (ms: number) => void) => {
    if (vivo && reglas) quitar.push(sensores.on(tipo, (ms) => !entrada.bloqueada && fn(ms)));
  };
  const c: CtxJuego = {
    n,
    escena,
    g,
    puerta: p,
    sensores,
    ui,
    azar: azar(n * 31 + 7),
    _fallos: 0,
    _ultimoToque: 0,
    _resuelto: resuelto,
    _protegidos: [],
    _quitados: [],
    _vistas: [],
    _pista: [],
    _forzar: () => {
      if (hecho || !vivo) return;
      hecho = true;
      resolver();
    },
    tocar: (obj, fn, prioridad) => reg(obj, { tocar: (hit) => !pistaAjena(obj) && fn(hit), ...(prioridad ? { prioridad } : {}) }),
    mantener: (obj, bajar, soltar) => reg(obj, { bajar, soltar }),
    arrastrar: (obj, op) => reg(obj, { arrastre: op }),
    frotar: (obj, fn) => reg(obj, { frotar: fn }),
    quitarToque: (obj) => vivo && entrada.quitar(obj),
    usar: (obj, item, fn) =>
      reg(obj, {
        usar: (it) => {
          if (it !== item) return false;
          fn();
          return true;
        },
      }),
    conLlave: (item = 'llave') =>
      reg(p.toque, {
        usar: (it) => {
          if (it !== item) return false;
          sonidoEco.nota(900, 0.05, 0, 'square', 0.05);
          c.resolver();
          return true;
        },
      }),
    gesto: {
      toque: (fn) => void (vivo && reglas && entrada.on('toque', fn)),
      deslizar: (fn) => void (vivo && reglas && entrada.on('deslizar', fn)),
      trazo: (fn) => void (vivo && reglas && entrada.on('trazo', fn)),
      mover: (fn) => void (vivo && reglas && entrada.on('mover', fn)),
      dedos: (fn) => void (vivo && reglas && entrada.on('dedos', fn)),
      pellizco: (fn) => void (vivo && reglas && entrada.on('pellizco', fn)),
      giro: (fn) => void (vivo && reglas && entrada.on('giro', fn)),
    },
    sensor: {
      sacudida: (fn) => sensor('sacudida', () => fn()),
      volteo: (fn) => sensor('volteo', () => fn()),
      pantalla: (fn) => sensor('pantalla', fn),
      soplido: (fn) => sensor('soplido', () => fn()),
    },
    enPlano: (x, y, plano) => entrada.enPlano(x, y, plano),
    dar: (item, desde) => {
      if (!vivo || invitado) return;
      if (desde) {
        const inicio = desde.getWorldPosition(new THREE.Vector3());
        desde.visible = false;
        // (si lo recogió el otro, el vuelo se ve en su celular: aquí solo aparece en el inventario)
        if (!entrada.delOtro()) {
          const s = escena.aPantalla(inicio);
          volarAlInventario(item, s.x, s.y);
        }
      }
      inv.agregar(item);
      c.bien();
    },
    tiene: (item) => vivo && inv.items.includes(item),
    cada: (fn) => {
      if (vivo && reglas) quitar.push(escena.cada(fn));
    },
    despues: (ms, fn) => {
      if (!vivo || !reglas) return;
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
      if (!vivo) return;
      const punto = obj instanceof THREE.Vector3 ? obj : new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());
      // En pareja: si lo pidió el dedo del otro, la cámara se acerca en su celular (la de aquí se queda)
      if (anfitrion && pareja && entrada.delOtro()) {
        enfocadoPor = 'otro';
        pareja.mandar({ t: 'enfocar', p: punto.toArray().map((v) => Math.round(v * 1000) / 1000), d: distancia });
        await pausa(680);
        return;
      }
      enfocadoPor = 'yo';
      mostrar('btn-volver', true);
      narrador.p.grupo.visible = false;
      await escena.enfocar(punto, distancia);
      // Pruebas: en cada acercamiento se revisa que nada tape lo importante
      if (vivo && (window as unknown as { __revisarVistas?: boolean }).__revisarVistas) {
        const { revisarImportantes } = await import('./revisar');
        const vista = `acercamiento a ${obj instanceof THREE.Vector3 ? 'un punto' : obj.name || 'algo'}`;
        c._vistas.push(...revisarImportantes({ escena, cam: escena.camara, vista, puerta: p, cuarto: cuarto!, g, desorden: c._desorden ?? null, narrador: null, entrada, extra: [...c._protegidos, ...(c._desorden?.papeles ?? [])], soloEnVista: true }));
      }
    },
    volver: async () => {
      if (anfitrion && pareja && enfocadoPor === 'otro') {
        enfocadoPor = null;
        pareja.panelesOtro?.quitar();
        pareja.mandar({ t: 'volver' });
        return;
      }
      enfocadoPor = null;
      mostrar('btn-volver', false);
      paneles.quitar();
      await escena.volver();
      if (jugando === n) narrador.p.grupo.visible = true;
    },
    bien: () => {
      if (!vivo) return;
      sonido.repuesto();
      narrador.sonreir();
      if (anfitrion) pareja?.mandar({ t: 'cara', k: 'bien' });
    },
    mal: () => {
      if (!vivo) return;
      c._fallos++;
      sonido.vacia();
      if (c._fallos % 3 === 0) narrador.animar(n);
      if (anfitrion) pareja?.mandar({ t: 'cara', k: 'mal' });
    },
    resolver: () => {
      if (hecho || !vivo || invitado) return;
      hecho = true;
      resolver();
    },
    alSalir: (fn) => {
      if (vivo) quitar.push(fn);
      else fn();
    },
    aviso: (texto, ms) => {
      if (!vivo) return;
      aviso(texto, ms);
      if (anfitrion) pareja?.mandar({ t: 'aviso', texto, ...(ms ? { ms } : {}) });
    },
    proteger: (obj) => void (vivo && c._protegidos.push(obj)),
    _salir: () => {
      vivo = false;
      for (const fn of quitar.splice(0)) fn();
      entrada.limpiar();
      inv.vaciar();
      escena.escena.remove(g);
      liberar(g);
      p.despegar();
      escena.atenuar(1);
      sensores.simular.soltar();
      mostrar('btn-volver', false);
      pareja?.panelesOtro?.quitar();
      pareja?.sinReparto();
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
    pistas: ['Esta puerta todavía se está construyendo.', 'Tócala para pasar.', 'Tócala para pasar.'],
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
  estado: () => ({ jugando, progreso, bloqueada: entrada?.bloqueada, abierta: puerta?.abierta, items: inv.items, listo: !entrada?.bloqueada && $('fundido').hidden && escena.enVistaGeneral }),
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
  /** Qué tapa la puerta desde la cámara de siempre (objetos, narrador, interfaz). */
  tapan: async () => {
    const { revisarPuerta } = await import('./revisar');
    return revisarPuerta(escena, puerta!, cuarto!, ctx?.g ?? null, ctx?._desorden ?? null, narrador);
  },
  /** Revisión completa de la puerta que se está jugando: qué tapa la puerta, qué tapa lo importante (con rayos
   *  desde la cámara; también lo que se revisó en los acercamientos), la decoración que se quitó y lo que quedó
   *  fuera del cuarto. */
  revision: async () => {
    const { revisarPuerta, revisarImportantes } = await import('./revisar');
    if (!ctx) return null;
    const c = ctx;
    const tapados = revisarImportantes({ escena, cam: camaraVista(), vista: 'general', puerta: c.puerta, cuarto: cuarto!, g: c.g, desorden: c._desorden ?? null, narrador, entrada, extra: [...c._protegidos, ...(c._desorden?.papeles ?? [])] });
    const fuera: string[] = [];
    // (los topos se esconden un poquito debajo del piso y en los escenarios de afuera hay cosas lejos, en el mar o en
    // el cielo: «fuera» es lo que se fue de verdad, o quedó con posiciones rotas)
    const caja = new THREE.Box3(new THREE.Vector3(-14, -1, -24), new THREE.Vector3(14, 14, 9));
    c.g.traverse((o) => {
      if (!(o as THREE.Mesh).isMesh || !o.visible) return;
      const p = o.getWorldPosition(new THREE.Vector3());
      if (![p.x, p.y, p.z].every(Number.isFinite) || !caja.containsPoint(p)) fuera.push(`acertijo: ${o.name || o.parent?.name || o.type} (${p.toArray().map((v) => v.toFixed(2)).join(', ')})`);
    });
    const cajaCuarto = new THREE.Box3(new THREE.Vector3(-4, -0.05, -0.1), new THREE.Vector3(4, 3.4, 3.5));
    for (const b of c._desorden?.cuerpos ?? []) {
      if (b.roto) continue;
      if (![b.pos.x, b.pos.y, b.pos.z].every(Number.isFinite) || !cajaCuarto.containsPoint(b.pos)) fuera.push(`desorden: ${b.id} (${b.pos.toArray().map((v) => v.toFixed(2)).join(', ')})`);
    }
    return { n: c.n, puerta: revisarPuerta(escena, c.puerta, cuarto!, c.g, c._desorden ?? null, narrador).tapan, tapados, vistas: c._vistas, quitados: c._quitados, fuera, papeles: c._desorden?.papeles.length ?? 0 };
  },
  /** Revuelve el desorden: cada cosa sale volando con una velocidad al azar (como alguien que lo tira todo). */
  revolver: (semilla = 1) => {
    const d = ctx?._desorden;
    if (!d) return 0;
    const r = azar(semilla * 977 + jugando);
    d.cuerpos.forEach((_, i) => d.lanzar(i, new THREE.Vector3((r() - 0.5) * 7, 1 + r() * 4, (r() - 0.5) * 3)));
    return d.cuerpos.length;
  },
  /** Lo que sigue moviéndose del desorden (pruebas). */
  despiertos: () => ctx?._desorden?.cuerpos.filter((b) => !b.roto && !b.dormido).map((b) => `${b.id} ${b.pos.toArray().map((v) => v.toFixed(2))} v${b.vel.length().toFixed(2)} e${b.empujes} ${b.tomado ? 'tomado' : ''}${b.colgado ? 'colgado' : ''}`),
  /** ¿Ya quedó quieto todo el desorden? */
  quieto: () => !ctx?._desorden || ctx._desorden.cuerpos.every((b) => b.roto || b.dormido),
  /** Destapa lo escondido bajo el desorden (pruebas de los papelitos): devuelve dónde quedó cada cosa en la pantalla. */
  papelitos: () => {
    const d = ctx?._desorden;
    if (!d) return [];
    return d.cuerpos.filter((b) => b.escondido).map((b) => ({ cosa: b.id, tipo: b.escondido!.tipo, visto: b.escondido!.visto, en: escena.aPantalla(b.escondido!.obj.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.04, 0))), cuerpo: escena.aPantalla(b.pos) }));
  },
  /** Pareja (pruebas): invitar a una puerta, cómo va la partida y simular irse a segundo plano. */
  parejaInvitar: (n: number) => void invitar(n),
  pareja: () =>
    pareja
      ? { papel: pareja.papel, huella: pareja.huella(), cuenta: pareja.cuenta, pendientes: pareja.enlace.pendientes, conectado: pareja.enlace.conectado, otroFuera: pareja.enlace.otroFuera, pausada: escena.pausada, jugando, items: inv.items, panel: paneles.abierto }
      : null,
  segundoPlano: (si: boolean) => pareja?.enlace.ponerFuera(si),
  /** Dónde está un objeto del cuarto (pruebas), si se ve y cuánta luz hay. */
  posicion: (nombre: string) => probador().obj(nombre).getWorldPosition(new THREE.Vector3()).toArray(),
  visible: (nombre: string) => {
    let o: THREE.Object3D | null = probador().obj(nombre);
    for (; o; o = o.parent) if (!o.visible) return false;
    return true;
  },
  luz: () => escena.nivelLuz,
  tiempo: () => escena.t,
  giro: (nombre: string) => probador().obj(nombre).rotation.y,
  /** Cuántas cosas hay regadas y cuántas se rompieron (pruebas). */
  desorden: () => ({
    cosas: ctx?._desorden?.cuerpos.length ?? 0,
    rotas: ctx?._desorden?.cuerpos.filter((b) => b.roto).length ?? 0,
    lista: ctx?._desorden?.cuerpos.map((b) => `${b.id} ${b.pos.toArray().map((v) => v.toFixed(2)).join(',')} desde ${b.origen.toArray().map((v) => v.toFixed(2)).join(',')}`),
  }),
  /** Tira una cosa del desorden con cierta velocidad (pruebas de la física). */
  lanzar: (i: number, vx: number, vy: number, vz: number) => ctx?._desorden?.lanzar(i, new THREE.Vector3(vx, vy, vz)),
  /** Compra un antojo (pruebas). */
  antojo: () => antojo(),
  /** Un dato de un objeto del cuarto (si es función, lo que devuelve). */
  dato: (nombre: string, clave: string) => {
    const v = probador().obj(nombre).userData[clave];
    return typeof v === 'function' ? v() : v;
  },
};

void iniciar();
