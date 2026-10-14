// El Escudo de las Hermanas (escudo.html): tower defense del lore de Astra. La batalla del Borde en la misión P23 de
// la granja (empalma con la película C09 «Una estrella sin dueño»), que también se juega cuando se quiera desde el
// Cuarto de Juegos de la casa y, sin nada de la pareja, en la Sala de Juegos de los amigos.
//
//   escudo.html                 portada y niveles
//   escudo.html?mision=P23      la batalla de la historia (desde la granja): escena, batalla, escena y de vuelta
//   escudo.html?nivel=<id>      entra directo a un nivel (también ?nivel=infinito)
//   escudo.html?bot=1           el bot juega solo (con ?nivel=… y ?rapido=N para probar el balance)
//   escudo.html?vitrina=1       todos los modelos en fila (para revisarlos)
//   escudo.html?escena=inicio|final   solo la escena
import '../deslizar';
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import './escudo.css';
import * as THREE from 'three';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { musica as musicaCasa, alternar as alternarSonido, silenciado } from '../sonido';
import { cuadros } from '../segundo_plano';
import { vigilarContexto } from '../contexto';
import { esModoAmigo } from '../salas/perfil';
import { ELEMENTOS, ENEMIGOS, HABILIDADES, INFINITO, NIVELES, ORDEN_ELEMENTOS, ORDEN_TORRES, TORRES, type IdTorre, type Nivel, type Punto } from './datos';
import { Motor, PASO, type Evento } from './motor';
import { EscenaEscudo } from './escena';
import { hacerIconos, type Iconos } from './iconos';
import { crearBot, type Bot } from './bot';
import { callarVoz, decir, despertar, fx, poner as ponerMusica, refrescarVolumen } from './audio';
import { NOMBRES, VOZ_NIVEL, type Linea } from './guion';
import { CON_PAREJA, ESCENA_FINAL, ESCENA_INICIO, LAZO, constelacion, defensores, type Defensores } from './pareja';
import { actuar, animarMuneco, santas, type Muneco } from './actores';
import { CLAVE_MISION, desbloqueado, guardarMision, guardarProgreso, leerProgreso, totalEstrellas, type Progreso } from './progreso';

const params = new URLSearchParams(location.search);
const MISION = params.get('mision') === 'P23';
const AMIGO = esModoAmigo();
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
const lienzo = $<HTMLCanvasElement>('#escudo-lienzo');
const capa = $('#escudo-ui');
const carga = $('#escudo-carga');

let escena: EscenaEscudo;
let iconos: Iconos;
let progreso: Progreso = leerProgreso(AMIGO);
let motor: Motor | null = null;
let bot: Bot | null = null;
let velocidad: 1 | 2 = progreso.velocidad;
let pausado = false;
let acumulado = 0;
let pantalla: 'carga' | 'menu' | 'batalla' | 'cine' | 'fin' = 'carga';
let santasVista: { eliana: Muneco; serena: Muneco } | null = null;
let defensa: Defensores | null = null;
let cielo: ReturnType<typeof constelacion> = null;
let reloj = 0;
const rapido = Math.max(1, Math.min(20, Number(params.get('rapido') ?? 1) || 1));

// ------------------------------------------------------------------------------------------------- arranque

async function arrancar() {
  if (Capacitor.isNativePlatform()) document.body.dataset.nativo = '1';
  escena = new EscenaEscudo(lienzo);
  escena.capaTextos = $('#escudo-textos');
  vigilarContexto(lienzo);
  const ajustar = () => escena.tamano(window.innerWidth, window.innerHeight);
  ajustar();
  window.addEventListener('resize', ajustar);
  const barra = $('#escudo-carga-barra');
  try {
    await escena.cargar((f) => (barra.style.width = `${Math.round(f * 80)}%`));
    iconos = hacerIconos(escena);
    barra.style.width = '100%';
  } catch (e) {
    console.error(e);
    $('#escudo-carga-frase').textContent = 'No se pudo cargar el Borde. Revisa la conexión e intenta otra vez.';
    return;
  }
  document.addEventListener('pointerdown', () => despertar(), { once: false, passive: true });
  instalarControles();
  instalarAtras();
  cuadros(cuadro, 0.25);
  (window as any).__escudo = { motor: () => motor, bot: () => bot,
    /** Para las pruebas: corre la simulación n pasos de una (con el bot si hay). */
    avanzar: (n: number) => { for (let i = 0; i < n && motor && !motor.terminado; i++) { bot?.pensar(motor); motor.paso(); const ev = motor.eventos.splice(0); if (i > n - 60) escena.eventos(motor, ev); const fin = ev.filter((e) => e.k === 'fin'); if (fin.length) reaccionar(fin); } }, escena: () => escena, progreso: () => progreso, jugar: (id: string) => jugarNivel(nivelPorId(id)), saltar: () => saltarCine?.() };
  carga.classList.add('fuera');
  setTimeout(() => carga.remove(), 700);
  if (params.has('vitrina')) return vitrina();
  const soloEscena = params.get('escena');
  if (soloEscena === 'inicio' || soloEscena === 'final') {
    await montarFondo(NIVELES[5]);
    await correrCine(soloEscena === 'inicio' ? ESCENA_INICIO : ESCENA_FINAL, soloEscena);
    return menu();
  }
  if (MISION) {
    const n = NIVELES.find((x) => x.historia)!;
    await montarFondo(n);
    await correrCine(ESCENA_INICIO, 'inicio');
    progreso.inicioVisto = true;
    guardarProgreso(AMIGO, progreso);
    return jugarNivel(n);
  }
  const directo = params.get('nivel');
  if (directo) return jugarNivel(nivelPorId(directo));
  await menu();
}

function nivelPorId(id: string): Nivel {
  return id === 'infinito' ? INFINITO : NIVELES.find((n) => n.id === id) ?? NIVELES[0];
}

// ------------------------------------------------------------------------------------------------- el fondo (mapa + defensores)

let fondoDe: string | null = null;
async function montarFondo(n: Nivel, m?: Motor) {
  const mm = m ?? new Motor(n);
  escena.montarNivel(mm);
  fondoDe = n.id;
  escena.extras.clear();
  const fin = escena.finRuta as [number, number];
  santasVista ??= await santas().catch(() => null);
  if (santasVista) {
    const { eliana, serena } = santasVista;
    eliana.raiz.position.set(fin[0] - 1.5, 0, fin[1] - 2.6);
    serena.raiz.position.set(fin[0] - 1.5, 0, fin[1] + 2.6);
    eliana.raiz.rotation.y = -Math.PI / 2 + 0.3;
    serena.raiz.rotation.y = -Math.PI / 2 - 0.3;
    escena.extras.add(eliana.raiz, serena.raiz);
  }
  defensa = await defensores(fin).catch(() => null);
  if (defensa) escena.extras.add(defensa.grupo);
  cielo = constelacion();
  if (cielo) {
    cielo.grupo.position.set(fin[0] + 6, 13, fin[1] - 4);
    cielo.grupo.rotation.y = -0.35;
    escena.extras.add(cielo.grupo);
  }
}

// ------------------------------------------------------------------------------------------------- cada cuadro

let ultimoRender = 0;
function cuadro(dt: number, ahora: number) {
  reloj += dt;
  if (motor && pantalla === 'batalla' && !pausado) {
    acumulado += dt * velocidad * rapido;
    let pasos = 0;
    while (acumulado >= PASO && pasos < 12 * rapido) {
      bot?.pensar(motor);
      motor.paso();
      const evs = motor.eventos.splice(0);
      if (evs.length) {
        escena.eventos(motor, evs);
        reaccionar(evs);
      }
      acumulado -= PASO;
      pasos++;
    }
    if (pasos >= 12 * rapido) acumulado = 0;
    pintarHud();
  }
  // 30 cuadros por segundo
  if (ahora - ultimoRender < 1000 / 31) return;
  const dtR = Math.min(0.1, (ahora - ultimoRender) / 1000);
  const msReal = ahora - ultimoRender;
  const t0 = performance.now();
  ultimoRender = ahora;
  escena.actualizar(pausado && pantalla === 'batalla' ? 0 : dtR, motor && pantalla !== 'menu' ? motor : null);
  if (santasVista) { animarMuneco(santasVista.eliana, dtR, reloj); animarMuneco(santasVista.serena, dtR, reloj); }
  defensa?.actualizar(dtR, reloj);
  cielo?.actualizar(reloj, motor && motor.lazo > 0 ? 1 : pantalla === 'cine' ? 0.8 : 0.35);
  camaraMenu(dtR);
  escena.render(Math.max(performance.now() - t0, msReal < 400 ? msReal : 0));
}

/** En el menú la cámara pasea despacio por el mapa. */
function camaraMenu(dt: number) {
  if (pantalla !== 'menu') return;
  const t = reloj * 0.06;
  escena.mirarA(Math.sin(t) * 6, Math.cos(t * 0.7) * 2, 20);
  escena.giroCam = Math.sin(t * 0.8) * 0.25;
  void dt;
}

// ------------------------------------------------------------------------------------------------- el menú

async function menu() {
  pantalla = 'menu';
  motor = null;
  bot = null;
  pausado = false;
  limpiarCapa();
  ponerMusica('menu');
  const i = Math.max(0, NIVELES.findIndex((n, k) => desbloqueado(progreso, k) && !(progreso.estrellas[n.id] > 0)));
  if (!fondoDe) await montarFondo(NIVELES[Math.min(i, NIVELES.length - 1)]);
  const total = totalEstrellas(progreso);
  const el = document.createElement('div');
  el.className = 'escudo-menu';
  el.innerHTML = `
    <header>
      <button class="eb-volver" data-salir aria-label="Volver">‹</button>
      <div class="em-titulo"><b>El Escudo de las Hermanas</b><span>La defensa del Borde de Astra</span></div>
      <div class="em-estrellas">★ ${total}/${NIVELES.length * 3}</div>
      <button class="eb-redondo" data-sonido aria-label="Sonido">${silenciado() ? '🔇' : '🔊'}</button>
    </header>
    <div class="em-niveles">
      ${NIVELES.map((n, k) => {
        const abierto = desbloqueado(progreso, k);
        const est = progreso.estrellas[n.id] ?? 0;
        return `<button class="em-nivel ${abierto ? '' : 'cerrado'} ${n.historia ? 'historia' : ''}" data-nivel="${n.id}" ${abierto ? '' : 'disabled'}>
          <i>${n.sub}</i><b>${n.nombre}</b>
          <span class="em-est">${'★'.repeat(est)}<em>${'★'.repeat(3 - est)}</em></span>
          <small>${abierto ? `${n.oleadas.length} oleadas` : '🔒 Gana el anterior'}</small>
        </button>`;
      }).join('')}
      <button class="em-nivel infinito ${desbloqueado(progreso, 3) ? '' : 'cerrado'}" data-nivel="infinito" ${desbloqueado(progreso, 3) ? '' : 'disabled'}>
        <i>∞</i><b>${INFINITO.nombre}</b><span class="em-est mejor">Mejor: oleada ${progreso.infinito}</span>
        <small>${desbloqueado(progreso, 3) ? 'Hasta donde aguantes' : '🔒 Gana el nivel III'}</small>
      </button>
    </div>
    <footer>
      <button class="eb-chip" data-historia="inicio">▶ La llegada al Borde</button>
      ${progreso.finalVisto ? '<button class="eb-chip" data-historia="final">▶ Una estrella sin dueño</button>' : ''}
      <span class="em-pista">Toca un nivel para defender el escudo</span>
    </footer>`;
  capa.append(el);
  el.addEventListener('click', async (ev) => {
    const b = (ev.target as HTMLElement).closest('button');
    if (!b) return;
    fx.toque();
    if (b.dataset.salir !== undefined) return salir();
    if (b.dataset.sonido !== undefined) { alternarSonido(); refrescarVolumen(); b.textContent = silenciado() ? '🔇' : '🔊'; return; }
    if (b.dataset.historia) {
      el.remove();
      await montarFondo(NIVELES[5]);
      await correrCine(b.dataset.historia === 'final' ? ESCENA_FINAL : ESCENA_INICIO, b.dataset.historia as 'inicio' | 'final');
      fondoDe = null;
      return menu();
    }
    if (b.dataset.nivel) {
      const n = nivelPorId(b.dataset.nivel);
      el.remove();
      // La primera vez que se empieza la campaña: la escena de la llegada
      if (n === NIVELES[0] && !progreso.inicioVisto) {
        await montarFondo(NIVELES[5]);
        await correrCine(ESCENA_INICIO, 'inicio');
        progreso.inicioVisto = true;
        guardarProgreso(AMIGO, progreso);
      }
      jugarNivel(n);
    }
  });
}

function limpiarCapa() {
  capa.innerHTML = '';
  escena?.marcarSitio(null);
  escena?.mostrarAlcance(null);
}

// ------------------------------------------------------------------------------------------------- la batalla

async function jugarNivel(n: Nivel) {
  limpiarCapa();
  const infinito = n.id === 'infinito';
  motor = new Motor(n, { infinito, luzExtra: MISION ? 60 : 0, semilla: Math.floor(Math.random() * 1e9), torres: MISION ? ORDEN_TORRES : undefined });
  bot = params.has('bot') ? crearBot(1) : null;
  await montarFondo(n, motor);
  pantalla = 'batalla';
  pausado = false;
  acumulado = 0;
  dichos.clear();
  escena.giroCam = 0;
  escena.encuadrar(true);
  ponerMusica('batalla');
  armarHud();
  const primera = n === NIVELES[0] && !progreso.consejos.includes('construir');
  void decir(primera ? 'IN6' : VOZ_NIVEL[n.id], subtitulo);
  if (primera) consejo('Toca un círculo de piedra para construir una torre. Después, «¡Que venga!».', 'construir');
}

let hud: { vidas: HTMLElement; luz: HTMLElement; oleada: HTMLElement; previa: HTMLElement; llamar: HTMLButtonElement; hab: Record<string, HTMLButtonElement>; vel: HTMLButtonElement } | null = null;

function armarHud() {
  const m = motor!;
  const el = document.createElement('div');
  el.className = 'escudo-hud';
  el.innerHTML = `
    <div class="eh-arriba">
      <div class="eh-cifra vidas" title="Vida del escudo"><i>♥</i><b data-vidas>20</b></div>
      <div class="eh-cifra luz" title="Luz de estrellas"><i>✦</i><b data-luz>0</b></div>
      <div class="eh-cifra oleada"><i>≋</i><b data-oleada>0</b></div>
      <span class="eh-nombre">${m.nivel.nombre}</span>
    </div>
    <div class="eh-botones">
      <button class="eb-redondo" data-vel aria-label="Velocidad">x${velocidad}</button>
      <button class="eb-redondo" data-centrar aria-label="Ver todo">⤢</button>
      <button class="eb-redondo" data-pausa aria-label="Pausa">❚❚</button>
    </div>
    <div class="eh-habilidades">
      <button class="eh-hab eliana" data-hab="eliana"><span class="eh-recarga"></span><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="8" fill="#ffd36b"/>${Array.from({ length: 8 }, (_, k) => `<rect x="19" y="4" width="2.6" height="7" rx="1.3" fill="#ffb040" transform="rotate(${k * 45} 20 20)"/>`).join('')}</svg><small>Eliana</small></button>
      <button class="eh-hab serena" data-hab="serena"><span class="eh-recarga"></span><svg viewBox="0 0 40 40"><path d="M25 8a12 12 0 1 0 0 24a10 10 0 1 1 0-24z" fill="#e9e4f5"/><circle cx="29" cy="12" r="1.6" fill="#fff"/><circle cx="31" cy="20" r="1.1" fill="#fff"/></svg><small>Serena</small></button>
      <button class="eh-hab lazo" data-hab="lazo"><span class="eh-recarga"></span><svg viewBox="0 0 40 40">${CON_PAREJA ? '<path d="M8 28 L14 20 L19 18 M32 28 L26 20 L21 18 M14 20 L20 13 M26 20 L20 13" stroke="#ffd9a0" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="20" cy="13" r="2.4" fill="#fff"/><circle cx="8" cy="28" r="2" fill="#ffd9a0"/><circle cx="32" cy="28" r="2" fill="#d9ccff"/>' : '<circle cx="20" cy="20" r="9" fill="#9fd08a"/><path d="M20 30 C14 24 14 16 20 10 C26 16 26 24 20 30z" fill="#5f9a4c"/>'}</svg><small>${LAZO.nombre}</small></button>
    </div>
    <div class="eh-oleadas">
      <div class="eh-previa" data-previa></div>
      <button class="eh-llamar" data-llamar>¡Que venga!</button>
    </div>
    <div class="eh-sub" data-sub hidden></div>`;
  capa.append(el);
  hud = {
    vidas: el.querySelector('[data-vidas]')!, luz: el.querySelector('[data-luz]')!, oleada: el.querySelector('[data-oleada]')!,
    previa: el.querySelector('[data-previa]')!, llamar: el.querySelector('[data-llamar]')!, vel: el.querySelector('[data-vel]')!,
    hab: Object.fromEntries([...el.querySelectorAll<HTMLButtonElement>('[data-hab]')].map((b) => [b.dataset.hab!, b])),
  };
  el.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest('button');
    if (!b || !motor) return;
    if (b.dataset.vel !== undefined) {
      velocidad = velocidad === 1 ? 2 : 1;
      progreso.velocidad = velocidad;
      guardarProgreso(AMIGO, progreso);
      b.textContent = `x${velocidad}`;
      b.classList.toggle('activo', velocidad === 2);
      fx.toque();
    } else if (b.dataset.centrar !== undefined) { escena.encuadrar(); fx.toque(); }
    else if (b.dataset.pausa !== undefined) abrirPausa();
    else if (b.dataset.llamar !== undefined) {
      capa.querySelector('.escudo-consejo')?.remove();
      const premio = motor.llamarOleada();
      fx.oleada();
      if (premio > 0) avisar(`+${premio} ✦ por adelantarla`);
      if (!progreso.consejos.includes('construir')) { progreso.consejos.push('construir'); guardarProgreso(AMIGO, progreso); }
    } else if (b.dataset.hab) armarHabilidad(b.dataset.hab as 'eliana' | 'serena' | 'lazo');
  });
  hud.vel.classList.toggle('activo', velocidad === 2);
  pintarHud(true);
}

let ultimaPrevia = '';
function pintarHud(forzar = false) {
  const m = motor;
  if (!m || !hud) return;
  hud.vidas.textContent = String(m.vidas);
  hud.vidas.parentElement!.classList.toggle('bajo', m.vidas <= 6);
  hud.luz.textContent = String(m.luz);
  hud.oleada.textContent = m.infinito ? `${m.oleada}` : `${m.oleada}/${m.totalOleadas}`;
  for (const [id, b] of Object.entries(hud.hab)) {
    const h = HABILIDADES[id as 'eliana'];
    const r = m.recargas[id as 'eliana'];
    (b.firstElementChild as HTMLElement).style.height = `${(r / h.recarga) * 100}%`;
    b.disabled = r > 0;
    b.classList.toggle('armada', habilidadArmada === id);
  }
  // La vista previa de la oleada que viene y el botón para llamarla
  const sig = m.oleada < m.totalOleadas ? m.oleadaSiguiente() : null;
  const puedeLlamar = !!sig && (m.oleada === 0 || (m.cuenta !== null && !m.saliendo));
  const clave = `${m.oleada}|${puedeLlamar}|${m.cuenta !== null ? Math.ceil(m.cuenta) : ''}`;
  if (clave === ultimaPrevia && !forzar) return;
  ultimaPrevia = clave;
  hud.llamar.hidden = !puedeLlamar;
  if (puedeLlamar) {
    const bono = m.oleada > 0 && m.cuenta !== null ? Math.round(m.cuenta * 2.2) : 0;
    hud.llamar.innerHTML = m.oleada === 0 ? '¡Que venga!' : `¡Que venga! <small>+${bono} ✦ · ${Math.ceil(m.cuenta ?? 0)} s</small>`;
  }
  if (sig) {
    const cuenta = new Map<string, number>();
    for (const g of sig) cuenta.set(g.t, (cuenta.get(g.t) ?? 0) + g.n);
    hud.previa.innerHTML = `<span>${m.oleada === 0 ? 'Primera oleada' : 'Próxima'}</span>${[...cuenta].map(([t, n]) => `<i title="${ENEMIGOS[t as 'mota'].nombre}"><img src="${iconos.enemigo[t as 'mota']}" alt="">×${Math.round(n)}</i>`).join('')}`;
    hud.previa.hidden = false;
  } else hud.previa.hidden = true;
}

/** El letrero de abajo con lo que se dice (nombre y texto). */
let quitaSub = 0;
function subtitulo(l: Linea, seg: number) {
  const el = document.querySelector<HTMLElement>('[data-sub]') ?? document.querySelector<HTMLElement>('.escudo-cine .ec-sub');
  if (!el) return;
  el.hidden = false;
  el.innerHTML = `${NOMBRES[l.quien] ? `<b class="q-${l.quien}">${NOMBRES[l.quien]}</b>` : ''}<span>${l.texto}</span>`;
  el.classList.remove('sale');
  void el.offsetWidth;
  el.classList.add('entra');
  clearTimeout(quitaSub);
  quitaSub = window.setTimeout(() => { el.hidden = true; }, (seg + 0.8) * 1000);
  if (santasVista) {
    santasVista.eliana.hablando = l.quien === 'eliana';
    santasVista.serena.hablando = l.quien === 'serena';
    setTimeout(() => { if (santasVista) santasVista.eliana.hablando = santasVista.serena.hablando = false; }, seg * 1000);
  }
}

function avisar(texto: string, clase = '') {
  const a = document.createElement('div');
  a.className = `escudo-aviso ${clase}`;
  a.textContent = texto;
  capa.append(a);
  setTimeout(() => a.remove(), 2600);
}

function consejo(texto: string, id: string) {
  const c = document.createElement('div');
  c.className = 'escudo-consejo';
  c.innerHTML = `<span>${texto}</span><button>Entendido</button>`;
  capa.append(c);
  c.querySelector('button')!.onclick = () => {
    c.remove();
    if (!progreso.consejos.includes(id)) progreso.consejos.push(id);
    guardarProgreso(AMIGO, progreso);
  };
}

// ------------------------------------------------------------------------------------------------- lo que pasa en la batalla

const dichos = new Set<string>();
let ultimoFx = 0;
function reaccionar(evs: Evento[]) {
  const m = motor!;
  const ahora = performance.now();
  const sonar = (f: () => void, cada = 60) => { if (ahora - ultimoFx > cada) { ultimoFx = ahora; f(); } };
  for (const ev of evs) {
    switch (ev.k) {
      case 'disparo':
        if (ev.tipo === 'aura') sonar(fx.fuego, 90);
        else if (ev.tipo === 'grifo') sonar(fx.pluma, 70);
        else if (ev.tipo === 'unicornio') sonar(fx.luz, 120);
        break;
      case 'pulso': sonar(fx.pulso, 200); break;
      case 'llamarada': sonar(fx.llama, 220); break;
      case 'impacto': if (ev.radio > 0) sonar(fx.estallido, 80); break;
      case 'muerte': if (ev.acompanado) sonar(fx.alma, 80); else sonar(fx.muerte, 50); break;
      case 'fuga':
        fx.fuga();
        if (m.vidas <= 6 && !dichos.has('bajo')) { dichos.add('bajo'); void decir('BE1', subtitulo); }
        break;
      case 'oleada':
        fx.oleada();
        avisar(m.infinito ? `Oleada ${ev.n}` : ev.n === m.totalOleadas ? '¡Última oleada!' : `Oleada ${ev.n} de ${m.totalOleadas}`, 'oleada');
        if (!m.infinito && ev.n === m.totalOleadas && !dichos.has('ultima')) { dichos.add('ultima'); void decir('BU1', subtitulo); }
        break;
      case 'jefe':
        fx.jefe();
        if (!dichos.has('jefe')) { dichos.add('jefe'); void decir('NJ1', subtitulo); }
        avisar('¡La sombra de Nath’Gora!', 'jefe');
        break;
      case 'jefeMitad': if (!dichos.has('mitad')) { dichos.add('mitad'); void decir('NJ2', subtitulo); } break;
      case 'apaga':
        if (!dichos.has('apaga')) { dichos.add('apaga'); void decir('NJ3', subtitulo); }
        break;
      case 'cura': fx.cura(); break;
      case 'construye': fx.construir(); break;
      case 'mejora': fx.mejorar(); break;
      case 'vende': fx.vender(); break;
      case 'habilidad':
        if (ev.id === 'eliana') {
          fx.meteoro();
          if (santasVista) actuar(santasVista.eliana, 'lanzar', 1.4);
          void decir(Math.random() < 0.5 ? 'EH1' : 'EH2', subtitulo);
        } else if (ev.id === 'serena') {
          fx.velo();
          if (santasVista) actuar(santasVista.serena, 'senalar_arriba', 1.8);
          void decir(Math.random() < 0.5 ? 'SH1' : 'SH2', subtitulo);
        } else {
          fx.lazo();
          defensa?.estado('lazo');
          void decir('LZ1', subtitulo);
        }
        break;
      case 'fin': void terminar(ev.gano); break;
      default: break;
    }
  }
}

// ------------------------------------------------------------------------------------------------- tocar el mapa

let habilidadArmada: 'eliana' | 'serena' | 'lazo' | null = null;
let punteroHab: Punto | null = null;
let seleccion: { sitio: number; tipo?: IdTorre; rama?: 'a' | 'b'; vender?: boolean } | null = null;

function armarHabilidad(id: 'eliana' | 'serena' | 'lazo') {
  if (!motor?.habilidadLista(id)) return fx.no();
  cerrarMenuTorre();
  fx.toque();
  if (id === 'lazo') { motor.usarHabilidad('lazo'); return; }
  habilidadArmada = habilidadArmada === id ? null : id;
  punteroHab = null;
  escena.mostrarAlcance(null);
  quitarConfirmar();
  if (habilidadArmada) avisar(id === 'eliana' ? 'Toca dónde cae la brasa de Eliana' : 'Toca dónde cae el velo de Serena', 'pista');
  pintarHud(true);
}

function confirmarBoton(x: number, y: number, texto: string, alConfirmar: () => void) {
  quitarConfirmar();
  const b = document.createElement('button');
  b.className = 'escudo-confirmar';
  b.innerHTML = texto;
  b.style.left = `${Math.min(window.innerWidth - 70, Math.max(70, x))}px`;
  b.style.top = `${Math.min(window.innerHeight - 40, Math.max(60, y))}px`;
  b.onclick = (e) => { e.stopPropagation(); alConfirmar(); quitarConfirmar(); };
  capa.append(b);
}
function quitarConfirmar() {
  capa.querySelector('.escudo-confirmar')?.remove();
}

function tocar(px: number, py: number) {
  const m = motor;
  if (!m || pantalla !== 'batalla' || pausado) return;
  const p = escena.puntoEnPiso(px, py);
  if (!p) return;
  if (habilidadArmada) {
    const id = habilidadArmada;
    punteroHab = p;
    escena.mostrarAlcance(p, HABILIDADES[id].radio, id === 'eliana' ? '#ffb040' : '#c9b6ff');
    const [sx, sy] = escena.aPantalla(p[0], 0, p[1]);
    confirmarBoton(sx, sy - 54, '✓ Aquí', () => {
      if (punteroHab && motor?.usarHabilidad(id, punteroHab[0], punteroHab[1])) { habilidadArmada = null; escena.mostrarAlcance(null); pintarHud(true); }
    });
    return;
  }
  // ¿Un sitio?
  let mejor = -1, md = 1.25;
  m.sitios.forEach(([x, z], i) => { const d = Math.hypot(x - p[0], z - p[1]); if (d < md) { md = d; mejor = i; } });
  if (mejor < 0) return cerrarMenuTorre();
  fx.toque();
  abrirMenuSitio(mejor);
}

function cerrarMenuTorre() {
  capa.querySelector('.escudo-menu-torre')?.remove();
  quitarConfirmar();
  seleccion = null;
  escena.marcarSitio(null);
  if (!habilidadArmada) escena.mostrarAlcance(null);
}

/** El menú de un sitio: construir (vacío) o mejorar, escoger rama, cambiar de elemento o vender (con torre). */
function abrirMenuSitio(sitio: number, sel: Partial<NonNullable<typeof seleccion>> = {}) {
  const m = motor!;
  capa.querySelector('.escudo-menu-torre')?.remove();
  quitarConfirmar();
  seleccion = { sitio, ...sel };
  const [x, z] = m.sitios[sitio];
  escena.marcarSitio([x, z]);
  const t = m.torreEn(sitio);
  const el = document.createElement('div');
  el.className = 'escudo-menu-torre';
  let alcance = 0, color = '#ffe9a8';
  if (!t) {
    const tipo = sel.tipo;
    el.innerHTML = `<div class="emt-fila">${ORDEN_TORRES.map((id) => {
      const d = TORRES[id];
      const costo = d.etapas[0].costo;
      const permitida = m.torresPermitidas.includes(id);
      return `<button class="emt-torre ${tipo === id ? 'sel' : ''} ${!permitida ? 'cerrada' : m.luz < costo ? 'cara' : ''}" data-tipo="${id}" ${permitida ? '' : 'disabled'}>
        <img src="${iconos.torre[id]}" alt=""><b>${permitida ? `✦${costo}` : '🔒'}</b></button>`;
    }).join('')}</div>
    ${tipo ? `<div class="emt-info"><b>${TORRES[tipo].nombre}</b><small>${TORRES[tipo].de}</small><p>${TORRES[tipo].desc}</p></div>` : '<div class="emt-info"><p>Escoge una torre. Toca otra vez para ver su alcance y confírmala.</p></div>'}`;
    if (tipo) { alcance = TORRES[tipo].etapas[0].alcance; color = TORRES[tipo].color; }
  } else {
    const d = TORRES[t.tipo];
    const et = m.etapa(t);
    const costo = m.costoMejora(t);
    alcance = m.alcanceDe(t);
    color = d.color;
    const sig = costo !== null ? d.etapas[t.nivel as 1 | 2] : null;
    el.innerHTML = `
      <div class="emt-cabeza"><img src="${t.rama ? iconos.rama[`${t.tipo}_${t.rama}`] : iconos.torre[t.tipo]}" alt=""><div><b>${et.nombre}</b>
        <small>${'◆'.repeat(t.rama ? 4 : t.nivel)}${'◇'.repeat(t.rama ? 0 : 4 - t.nivel)} · ${t.bajas} vencidos${t.bono.dano > 0 ? ` · 🦄 +${Math.round(t.bono.dano * 100)}%` : ''}</small></div></div>
      ${t.tipo === 'fuatia' && t.rama !== 'b' ? `<div class="emt-elementos">${ORDEN_ELEMENTOS.map((e) => `<button class="emt-el ${t.elemento === e ? 'sel' : ''}" data-elemento="${e}" style="--c:${ELEMENTOS[e].color}" ${t.rama === 'a' ? 'disabled' : ''}>${ELEMENTOS[e].nombre}</button>`).join('')}</div>` : ''}
      <div class="emt-acciones">
        ${sig ? `<button class="emt-accion mejorar ${sel.rama === undefined && sel.tipo === t.tipo ? 'sel' : ''} ${m.luz < costo! ? 'cara' : ''}" data-mejorar><b>Mejorar ✦${costo}</b><small>${sig.nombre}: ${sig.desc}</small></button>` : ''}
        ${!sig && !t.rama ? (['a', 'b'] as const).map((r) => {
          const rr = d.ramas[r];
          return `<button class="emt-accion rama ${sel.rama === r ? 'sel' : ''} ${m.luz < rr.costo ? 'cara' : ''}" data-rama="${r}"><img src="${iconos.rama[`${t.tipo}_${r}`]}" alt=""><b>${rr.nombre} ✦${rr.costo}</b><small>${rr.desc}</small></button>`;
        }).join('') : ''}
        ${t.rama ? `<div class="emt-max">Rama final: ${et.desc}</div>` : ''}
        <button class="emt-accion vender ${sel.vender ? 'sel' : ''}" data-vender><b>Vender ✦${m.valorVenta(t)}</b></button>
      </div>`;
    if (sel.rama) alcance = d.ramas[sel.rama].alcance * (1 + t.bono.alcance);
    else if (sel.tipo === t.tipo && sig) alcance = sig.alcance * (1 + t.bono.alcance);
  }
  capa.append(el);
  escena.mostrarAlcance(alcance ? [x, z] : null, alcance, color);
  // Que el menú no tape el sitio: a la derecha o a la izquierda según dónde quede
  const [sx, sy] = escena.aPantalla(x, 0.5, z);
  const w = el.offsetWidth, h = el.offsetHeight;
  const izq = sx > window.innerWidth / 2 ? sx - w - 46 : sx + 46;
  el.style.left = `${Math.max(8, Math.min(window.innerWidth - w - 8, izq))}px`;
  el.style.top = `${Math.max(8, Math.min(window.innerHeight - h - 8, sy - h / 2))}px`;
  el.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const b = (ev.target as HTMLElement).closest('button');
    if (!b || !motor) return;
    fx.toque();
    if (b.dataset.tipo) {
      const id = b.dataset.tipo as IdTorre;
      if (seleccion?.tipo !== id) return abrirMenuSitio(sitio, { tipo: id });
    }
    if (b.dataset.elemento && t) { motor.cambiarElemento(t, b.dataset.elemento as 'fuego'); return abrirMenuSitio(sitio); }
    // Lo que gasta luz se confirma (primer toque escoge y muestra el alcance; el botón ✓ lo hace)
    const confirmar = (texto: string, hacer: () => boolean) => {
      quitarConfirmar();
      const c = document.createElement('button');
      c.className = 'escudo-confirmar en-menu';
      c.innerHTML = texto;
      c.onclick = (e) => {
        e.stopPropagation();
        if (hacer()) cerrarMenuTorre();
        else { fx.no(); avisar('No alcanza la luz de estrellas', 'pista'); }
      };
      el.append(c);
      // Que siga cabiendo en la pantalla
      const r = el.getBoundingClientRect();
      if (r.bottom > window.innerHeight - 6) el.style.top = `${Math.max(6, window.innerHeight - r.height - 6)}px`;
    };
    if (b.dataset.tipo) {
      const id = b.dataset.tipo as IdTorre;
      return confirmar(`✓ Construir ✦${TORRES[id].etapas[0].costo}`, () => !!motor!.construir(sitio, id));
    }
    if (!t) return;
    if (b.dataset.mejorar !== undefined) {
      if (seleccion?.tipo !== t.tipo || seleccion.rama) return abrirMenuSitio(sitio, { tipo: t.tipo });
      return confirmar(`✓ Mejorar ✦${motor.costoMejora(t)}`, () => motor!.mejorar(t));
    }
    if (b.dataset.rama) {
      const r = b.dataset.rama as 'a' | 'b';
      if (seleccion?.rama !== r) return abrirMenuSitio(sitio, { rama: r });
      return confirmar(`✓ ${TORRES[t.tipo].ramas[r].nombre}`, () => motor!.escogerRama(t, r));
    }
    if (b.dataset.vender !== undefined) {
      if (!seleccion?.vender) return abrirMenuSitio(sitio, { vender: true });
      return confirmar(`✓ Vender por ✦${motor.valorVenta(t)}`, () => { motor!.vender(t); return true; });
    }
  });
}

// ------------------------------------------------------------------------------------------------- dedos y ratón

function instalarControles() {
  const dedos = new Map<number, { x: number; y: number; x0: number; y0: number }>();
  let pellizco = 0;
  let movido = false;
  lienzo.addEventListener('pointerdown', (e) => {
    lienzo.setPointerCapture(e.pointerId);
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY });
    movido = dedos.size > 1;
    if (dedos.size === 2) { const [a, b] = [...dedos.values()]; pellizco = Math.hypot(a.x - b.x, a.y - b.y); }
  });
  lienzo.addEventListener('pointermove', (e) => {
    const d = dedos.get(e.pointerId);
    if (!d || pantalla !== 'batalla') return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    d.x = e.clientX;
    d.y = e.clientY;
    if (dedos.size === 1) {
      if (Math.hypot(d.x - d.x0, d.y - d.y0) > 9) movido = true;
      if (movido) escena.arrastrar(dx, dy);
    } else if (dedos.size === 2) {
      const [a, b] = [...dedos.values()];
      const nd = Math.hypot(a.x - b.x, a.y - b.y);
      if (pellizco > 0) escena.acercar(pellizco / nd);
      pellizco = nd;
    }
  });
  const soltar = (e: PointerEvent) => {
    const d = dedos.get(e.pointerId);
    dedos.delete(e.pointerId);
    if (d && !movido && dedos.size === 0) tocar(e.clientX, e.clientY);
    if (dedos.size < 2) pellizco = 0;
  };
  lienzo.addEventListener('pointerup', soltar);
  lienzo.addEventListener('pointercancel', (e) => dedos.delete(e.pointerId));
  lienzo.addEventListener('wheel', (e) => { if (pantalla === 'batalla') { e.preventDefault(); escena.acercar(e.deltaY > 0 ? 1.1 : 0.9); } }, { passive: false });
}

// ------------------------------------------------------------------------------------------------- pausa, fin y salida

function abrirPausa() {
  if (pausado || pantalla !== 'batalla') return;
  pausado = true;
  cerrarMenuTorre();
  const el = document.createElement('div');
  el.className = 'escudo-velo';
  el.innerHTML = `<div class="escudo-tarjeta">
    <h2>En pausa</h2>
    <button class="eb-grande" data-seguir>Seguir</button>
    <button class="eb-grande sec" data-reiniciar>Empezar de nuevo</button>
    ${MISION ? '' : '<button class="eb-grande sec" data-niveles>Niveles</button>'}
    <button class="eb-grande sec" data-sonido>${silenciado() ? 'Prender el sonido' : 'Apagar el sonido'}</button>
    <button class="eb-grande sec" data-musica>${musicaCasa.apagada() ? 'Prender la música' : 'Apagar la música'}</button>
    <button class="eb-grande sec" data-salir>${MISION ? 'Volver a la granja' : 'Salir'}</button></div>`;
  capa.append(el);
  el.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest('button');
    if (!b) return;
    fx.toque();
    if (b.dataset.seguir !== undefined) { el.remove(); pausado = false; }
    else if (b.dataset.reiniciar !== undefined) { el.remove(); void jugarNivel(motor!.nivel); }
    else if (b.dataset.niveles !== undefined) { el.remove(); fondoDe = null; void menu(); }
    else if (b.dataset.sonido !== undefined) { alternarSonido(); refrescarVolumen(); b.textContent = silenciado() ? 'Prender el sonido' : 'Apagar el sonido'; }
    else if (b.dataset.musica !== undefined) { musicaCasa.alternar(); refrescarVolumen(); b.textContent = musicaCasa.apagada() ? 'Prender la música' : 'Apagar la música'; }
    else if (b.dataset.salir !== undefined) salir();
  });
}

async function terminar(gano: boolean) {
  const m = motor!;
  pantalla = 'fin';
  cerrarMenuTorre();
  habilidadArmada = null;
  const n = m.nivel;
  const est = m.estrellas();
  defensa?.estado(gano ? 'gano' : 'perdio');
  if (santasVista) { actuar(santasVista.eliana, gano ? 'celebrar' : 'triste', 4); actuar(santasVista.serena, gano ? 'aplauso_a' : 'triste', 4); }
  if (m.infinito) {
    progreso.infinito = Math.max(progreso.infinito, m.oleada - 1);
  } else if (gano) progreso.estrellas[n.id] = Math.max(progreso.estrellas[n.id] ?? 0, est);
  guardarProgreso(AMIGO, progreso);
  if (gano) { fx.ganar(); ponerMusica('final'); void decir('BV1', subtitulo); } else { fx.perder(); void decir('BD1', subtitulo); }
  await new Promise((r) => setTimeout(r, 2200));
  // Ganar la batalla de la historia: la escena del final (y el recibo para la granja)
  if (gano && n.historia) {
    if (MISION) guardarMision(est);
    capa.querySelector('.escudo-hud')?.remove();
    await correrCine(ESCENA_FINAL, 'final');
    progreso.finalVisto = true;
    guardarProgreso(AMIGO, progreso);
  }
  mostrarResultado(gano, est);
}

function mostrarResultado(gano: boolean, est: number) {
  const m = motor!;
  const n = m.nivel;
  pantalla = 'fin';
  capa.querySelector('.escudo-hud')?.remove();
  const i = NIVELES.indexOf(n);
  const sig = i >= 0 && i < NIVELES.length - 1 ? NIVELES[i + 1] : null;
  const el = document.createElement('div');
  el.className = 'escudo-velo';
  el.innerHTML = `<div class="escudo-tarjeta resultado ${gano ? 'gano' : 'perdio'}">
    <h2>${m.infinito ? `Aguantaste ${Math.max(0, m.oleada - 1)} oleadas` : gano ? '¡El escudo resistió!' : 'El escudo cedió'}</h2>
    ${gano && !m.infinito ? `<div class="er-estrellas">${[1, 2, 3].map((k) => `<i class="${k <= est ? 'si' : ''}" style="--d:${k * 0.25}s">★</i>`).join('')}</div>` : ''}
    <p>${m.vencidos} vencidos · ${m.acompanados} almas acompañadas por Lara · ${m.vidas} ♥</p>
    ${m.infinito ? `<p>Tu mejor marca: oleada ${progreso.infinito}</p>` : ''}
    <div class="er-botones">
      ${MISION ? `<button class="eb-grande" data-granja>${gano ? 'Volver a la granja' : 'Volver a la granja'}</button>${gano ? '' : '<button class="eb-grande sec" data-otra>Intentar otra vez</button>'}` : `
      ${gano && sig ? `<button class="eb-grande" data-siguiente>Siguiente: ${sig.nombre}</button>` : ''}
      <button class="eb-grande ${gano && sig ? 'sec' : ''}" data-otra>${gano ? 'Jugar otra vez' : 'Intentar otra vez'}</button>
      <button class="eb-grande sec" data-niveles>Niveles</button>`}
    </div></div>`;
  capa.append(el);
  el.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest('button');
    if (!b) return;
    fx.toque();
    if (b.dataset.siguiente !== undefined && sig) void jugarNivel(sig);
    else if (b.dataset.otra !== undefined) void jugarNivel(n);
    else if (b.dataset.niveles !== undefined) { fondoDe = null; void menu(); }
    else if (b.dataset.granja !== undefined) salir();
  });
}

function salir() {
  callarVoz();
  ponerMusica(null);
  const destino = MISION ? `./granja-v3.html${localStorage.getItem(CLAVE_MISION) ? '?escudo=P23' : ''}` : AMIGO ? './amigos.html' : './index.html';
  try { escena.liberar(); } catch { /* ya estaba suelta */ }
  location.replace(destino);
}

function instalarAtras() {
  const atras = () => {
    if (capa.querySelector('.escudo-confirmar') || capa.querySelector('.escudo-menu-torre')) return cerrarMenuTorre();
    if (habilidadArmada) { habilidadArmada = null; escena.mostrarAlcance(null); return; }
    if (pantalla === 'cine') return saltarCine?.();
    if (pantalla === 'batalla') {
      const velo = capa.querySelector('.escudo-velo');
      if (velo) { velo.remove(); pausado = false; return; }
      return abrirPausa();
    }
    if (pantalla === 'fin') { fondoDe = null; return void menu(); }
    salir();
  };
  if (Capacitor.isNativePlatform()) void App.addListener('backButton', atras);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !e.repeat) atras(); });
}

// ------------------------------------------------------------------------------------------------- las escenas (30 s)

let saltarCine: (() => void) | null = null;

/** Una escena con el motor del propio juego: planos de cámara sobre el Borde, las voces y sus letreros. */
async function correrCine(ids: string[], cual: 'inicio' | 'final') {
  pantalla = 'cine';
  limpiarCapa();
  ponerMusica(cual === 'final' ? 'final' : 'batalla');
  const el = document.createElement('div');
  el.className = 'escudo-cine';
  el.innerHTML = `<div class="ec-banda arriba"></div><div class="ec-banda abajo"></div>
    <div class="ec-titulo"><small>${cual === 'inicio' ? 'El Escudo de las Hermanas' : 'Capítulo XXIII'}</small><b>${cual === 'inicio' ? 'La llegada al Borde' : 'Una estrella sin dueño'}</b></div>
    <div class="ec-sub" hidden></div><button class="ec-saltar">Saltar ›</button>`;
  capa.append(el);
  const fin = escena.finRuta;
  // La sombra de Nath'Gora, enorme, allá en el abismo
  const sombra = escena.enemigoSuelto('jefe').o;
  sombra.scale.setScalar(4);
  sombra.position.set(-34, -6, -2);
  sombra.rotation.y = Math.PI / 2;
  escena.extras.add(sombra);
  let cortado = false;
  let despertarEspera: (() => void) | null = null;
  saltarCine = () => { cortado = true; despertarEspera?.(); };
  el.querySelector('.ec-saltar')!.addEventListener('click', () => saltarCine?.());
  const esperar = (seg: number) => new Promise<void>((r) => { const t = setTimeout(r, seg * 1000); despertarEspera = () => { clearTimeout(t); r(); }; });
  const plano = (x: number, z: number, d: number, giro: number, incl: number) => { escena.mirarA(x, z, d, d < 12 ? 1.1 : 0); escena.giroCam = giro; escena.inclinacion = incl; escena.fijar(); };
  // Planos por línea: quién habla manda la cámara
  const planos: Record<string, () => void> = {
    IN1: () => plano(-6, 0, 30, -0.35, 0.55),
    IN5: () => plano(fin[0] - 0.5, fin[1], 10, -1.57, 0.32),
    IN2: () => { plano(-14, 0, 22, -0.5, 0.35); sombra.position.set(-30, -4, 0); },
    IN3: () => plano(fin[0] - 1.5, fin[1] - 2.6, 5, -1.35, 0.22),
    IN4: () => plano(fin[0] - 1.5, fin[1] + 2.6, 5, -1.8, 0.22),
    IN6: () => plano(2, 1, 24, 0.15, 0.85),
    FI1: () => { plano(-14, 0, 22, -0.5, 0.35); sombra.position.set(-30, -4, 0); },
    FI2: () => plano(fin[0] - 1.5, fin[1] + 2.6, 5, -1.8, 0.22),
    FI3: () => plano(fin[0] - 1.5, fin[1] - 2.6, 5, -1.35, 0.22),
    FI4: () => plano(-4, 0, 30, -0.2, 0.5),
    FI5: () => { defensa?.estado('mano'); plano(fin[0] - 0.9, fin[1], 6, -1.57, 0.2); },
  };
  await esperar(1.6);
  el.querySelector('.ec-titulo')!.classList.add('sale');
  for (const id of ids) {
    if (cortado) break;
    planos[id]?.();
    const seg = await decir(id, subtitulo);
    // La sombra se aleja al final (pierde el conducto)
    if (id === 'FI4') sombra.position.x = -60;
    await esperar(seg + 0.45);
  }
  if (cual === 'final' && !cortado) {
    plano(fin[0] + 1, fin[1], 12, -1.57, 0.12);
    await esperar(2.5);
  }
  callarVoz();
  escena.extras.remove(sombra);
  escena.inclinacion = 0.98;
  escena.giroCam = 0;
  escena.encuadrar(true);
  el.remove();
  saltarCine = null;
}

// ------------------------------------------------------------------------------------------------- vitrina (revisar modelos)

async function vitrina() {
  pantalla = 'cine';
  const n = NIVELES[0];
  await montarFondo(n);
  const g = new THREE.Group();
  ORDEN_TORRES.forEach((t, i) => {
    ([[1, null], [2, null], [3, null], [3, 'a'], [3, 'b']] as const).forEach(([nv, r], j) => {
      const o = escena.armarTorreSuelta(t, nv as 1, r);
      o.position.set(-12 + j * 2.6, 0, -6 + i * 2.4);
      g.add(o);
    });
  });
  (['mota', 'motita', 'sombra', 'golem', 'polilla', 'divisora', 'jefe'] as const).forEach((e, i) => {
    const { o } = escena.enemigoSuelto(e);
    o.position.set(3 + i * 2, e === 'polilla' ? 1.5 : 0, 2);
    g.add(o);
  });
  escena.extras.add(g);
  escena.mirarA(-3, 0, 20);
  (window as any).__vitrina = (x: number, z: number, d: number, giro = 0, incl = 0.9) => { escena.mirarA(x, z, d); escena.giroCam = giro; escena.inclinacion = incl; };
}


void arrancar();
