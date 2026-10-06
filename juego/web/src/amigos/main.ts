// La sala de juegos de amigos (amigos.html): lo que ve quien entra con «Soy un amigo / una amiga» (o abre la app para
// amigos). Su muñeco en 3D tal cual lo armó en el creador de personajes, los juegos aptos para amigos
// (`juegos.ts`), «Crear sala», «Unirme con un código» y «Editar mi personaje». NUNCA carga la casa, ni el Supabase
// de la pareja, ni recuerdos, ni notas, ni nada personal: solo el perfil del amigo (guardado en el aparato) y las
// salas de juego. En la versión de la pareja, index.html manda aquí mientras el perfil esté activo y «¿Eres Javier
// o Laura?» pide confirmar y apaga el modo amigo; en la versión para amigos (`--mode amigos`) la app arranca aquí y
// no hay casa a la cual volver.
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '../estilos.css';
import './amigos.css';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import * as sonido from '../sonido';
import { caritaSvg } from '../salas/carita';
import { aspectoDe, dejarModoAmigo, perfilAmigo, perfilNuevo, type PerfilAmigo } from '../salas/perfil';
import { averiguarJuego, normalizarCodigo } from '../salas/sala';
import { abrirCreador, type Creador } from './creador';
import { JUEGOS, disponible, type JuegoAmigos } from './juegos';
import { Muneco } from './muneco';

/** Esta es la app aparte para amigos (no hay casa ni «¿Eres Javier o Laura?»). */
const SOLO_AMIGOS = import.meta.env.MODE === 'amigos';
const raiz = document.getElementById('amigos')!;
const params = new URLSearchParams(location.search);
const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const CLAVE_LAVADO = 'amigo-lavado-progreso';

let perfil: PerfilAmigo = perfilAmigo() ?? perfilNuevo(Math.random() < 0.5 ? 'el' : 'ella');
let muneco: Muneco | null = null;
let creador: Creador | null = null;
let pantalla: 'creador' | 'sala' | 'juego' = 'creador';

function aviso(texto: string) {
  const a = document.createElement('div');
  a.className = 'am-aviso';
  a.textContent = texto;
  document.body.append(a);
  setTimeout(() => a.remove(), 3200);
}

function soltar() {
  creador?.liberar();
  creador = null;
  muneco?.liberar();
  muneco = null;
}

// ---------------------------------------------------------------------------------------------------- Creador
function abrirElCreador() {
  soltar();
  pantalla = 'creador';
  const yaEra = !!perfilAmigo()?.activo;
  creador = abrirCreador({
    raiz,
    perfil,
    yaEra,
    puedeVolver: !SOLO_AMIGOS,
    alListo: (p) => {
      perfil = p;
      sala();
    },
    alVolver: () => {
      if (yaEra) {
        perfil = perfilAmigo() ?? perfil;
        sala();
      } else if (!SOLO_AMIGOS) location.replace('./index.html');
    },
  });
}

// ---------------------------------------------------------------------------------------------------- La sala de juegos
function tarjeta(j: JuegoAmigos) {
  return `<button class="am-juego ${j.tema} pronto" data-j="${j.id}"><span class="arte">${j.arte}</span>
    <span class="txt"><b>${j.nombre}</b><small>${j.desc}</small></span><em class="estado">…</em></button>`;
}

function sala() {
  soltar();
  pantalla = 'sala';
  const hola = ['¡Hola', '¡Quiubo', '¡Bienvenido', '¡Qué más'][Math.floor(Math.random() * 4)];
  raiz.innerHTML = `<section class="am-sala">
    <div class="am-escenario"><canvas class="am-lienzo" aria-label="Tu muñeco"></canvas>
      <div class="am-placa"><span class="cara">${caritaSvg(aspectoDe(perfil), 30, 'feliz')}</span><b>${esc(perfil.nombre)}</b>
        <button class="am-editar" data-a="editar">✏️ Editar mi personaje</button></div></div>
    <div class="am-lado">
      <header><h1>Sala de juegos</h1><p>${hola}, ${esc(perfil.nombre)}! Escoge un juego, arma una sala o entra a la de tus amigos.</p></header>
      <div class="am-acciones">
        <button class="am-crear" data-a="crear"><i>➕</i><span><b>Crear sala</b><small>Juega con tus amigos</small></span></button>
        <form class="am-codigo" autocomplete="off"><span>🔑 Unirme con un código</span>
          <input name="c" maxlength="7" placeholder="ABCDE" aria-label="Código de la sala" autocapitalize="characters" spellcheck="false" enterkeyhint="go">
          <button class="boton boton-menta">Entrar</button></form>
      </div>
      <div class="am-juegos">${JUEGOS.map(tarjeta).join('')}</div>
      ${SOLO_AMIGOS ? '' : '<button class="am-no-soy" data-a="pareja">¿Eres Javier o Laura?</button>'}
    </div></section>`;
  const lienzo = raiz.querySelector<HTMLCanvasElement>('canvas')!;
  try {
    muneco = new Muneco(lienzo);
    muneco.alTocar = () => muneco?.siguientePose();
    void muneco.poner(aspectoDe(perfil), false).catch((e) => console.error(e));
    muneco.arrancar();
  } catch (e) {
    console.error(e);
    lienzo.insertAdjacentHTML('afterend', `<div class="am-carita-grande">${caritaSvg(aspectoDe(perfil), 160, 'feliz')}</div>`);
  }
  for (const j of JUEGOS) {
    void disponible(j).then((si) => {
      const b = raiz.querySelector<HTMLElement>(`.am-juego[data-j="${j.id}"]`);
      if (!b) return;
      b.classList.toggle('pronto', !si);
      b.querySelector('.estado')!.textContent = si ? 'Jugar' : 'Muy pronto';
    });
  }
  const input = raiz.querySelector<HTMLInputElement>('.am-codigo input')!;
  input.addEventListener('input', () => (input.value = normalizarCodigo(input.value)));
  raiz.querySelector('.am-codigo')!.addEventListener('submit', (e) => {
    e.preventDefault();
    void unirse(input.value);
  });
  raiz.querySelector('.am-sala')!.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const j = t.closest<HTMLElement>('[data-j]');
    const a = t.closest<HTMLElement>('[data-a]');
    sonido.activar();
    if (j) void jugar(JUEGOS.find((x) => x.id === j.dataset.j)!);
    else if (a?.dataset.a === 'editar') abrirElCreador();
    else if (a?.dataset.a === 'crear') void crearSala();
    else if (a?.dataset.a === 'pareja') noSoyAmigo();
  });
}

async function jugar(j: JuegoAmigos, como: { crear?: boolean; unirse?: string } = {}) {
  if (!(await disponible(j))) return aviso(`${j.nombre} llega muy pronto. ¡Mientras tanto, a lavarse la cara!`);
  sonido.nota(660, 0.08, 0, 'triangle', 0.05);
  if (j.id === 'lavado') return lavarse(como);
  if (!j.url) return;
  location.href = como.unirse ? j.urlUnirse?.(como.unirse) ?? `${j.url}${j.url.includes('?') ? '&' : '?'}unirse=${encodeURIComponent(como.unirse)}`
    : como.crear ? j.urlCrear ?? `${j.url}${j.url.includes('?') ? '&' : '?'}sala` : j.url;
}

/** «Crear sala»: escoge el juego y abre su sala (el código sale ahí para pasárselo a los amigos). */
async function crearSala() {
  const conSala = JUEGOS.filter((j) => j.sala);
  const capa = document.createElement('div');
  capa.className = 'am-capa';
  capa.innerHTML = `<div class="am-dialogo am-escoger"><h2>¿A qué juegan?</h2><p>Se abre la sala con su código para pasárselo a tus amigos (hasta 4).</p>
    <div class="am-juegos chicas">${conSala.map(tarjeta).join('')}</div>
    <div class="am-botones"><button class="boton boton-papel" data-r="no">Cancelar</button></div></div>`;
  document.body.append(capa);
  for (const j of conSala) {
    void disponible(j).then((si) => {
      const b = capa.querySelector<HTMLElement>(`[data-j="${j.id}"]`);
      if (!b) return;
      b.classList.toggle('pronto', !si);
      b.querySelector('.estado')!.textContent = si ? 'Crear' : 'Muy pronto';
    });
  }
  capa.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const j = t.closest<HTMLElement>('[data-j]');
    if (j) {
      capa.remove();
      void jugar(JUEGOS.find((x) => x.id === j.dataset.j)!, { crear: true });
    } else if (t.closest('[data-r="no"]') || t === capa) capa.remove();
  });
}

/** Javier o Laura tocaron «Soy un amigo» por error: confirman y vuelven a la pantalla de inicio. */
function noSoyAmigo() {
  const capa = document.createElement('div');
  capa.className = 'am-capa';
  capa.innerHTML = `<div class="am-dialogo"><h2>¿Eres Javier o Laura?</h2>
    <p>Esto es solo para ellos dos: la casa les pide su código para entrar. Tu muñeco de amigo queda guardado por si vuelves.</p>
    <div class="am-botones"><button class="boton boton-papel" data-r="no">No, soy un amigo</button><button class="boton boton-tomate" data-r="si">Sí, volver al inicio</button></div></div>`;
  document.body.append(capa);
  capa.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-r]');
    if (!b && e.target !== capa) return;
    capa.remove();
    if (b?.dataset.r === 'si') {
      dejarModoAmigo();
      location.replace('./index.html');
    }
  });
}

async function unirse(codigo: string) {
  const c = normalizarCodigo(codigo);
  if (c.length !== 5) return aviso('El código tiene 5 letras y números.');
  const boton = raiz.querySelector<HTMLButtonElement>('.am-codigo button');
  if (boton) {
    boton.disabled = true;
    boton.textContent = 'Buscando…';
  }
  let juego: string | null = null;
  try {
    juego = await averiguarJuego(c);
  } catch (e) {
    aviso(e instanceof Error ? e.message : 'No hay conexión.');
  }
  if (boton) {
    boton.disabled = false;
    boton.textContent = 'Entrar';
  }
  const j = JUEGOS.find((x) => x.sala && x.sala === juego);
  if (j) return jugar(j, { unirse: c });
  if (juego) return aviso('Esa sala es de un juego que todavía no está aquí.');
  aviso('No encontramos esa sala. Revisa el código (y que quien la creó siga adentro).');
}

// ---------------------------------------------------------------------------------------------------- Lavarse la cara
async function lavarse(como: { crear?: boolean; unirse?: string } = {}) {
  if (pantalla === 'juego') return;
  pantalla = 'juego';
  // (el juego tiene su propio WebGL: el del muñeco se suelta para no tener dos prendidos en el celular)
  soltar();
  raiz.classList.add('tapado');
  try {
    const L = await import('../casa/lavado');
    const { normalizarProgresoLavado } = await import('../casa/lavado/progreso');
    let guardado: unknown = null;
    try {
      guardado = JSON.parse(localStorage.getItem(CLAVE_LAVADO) ?? 'null');
    } catch {
      guardado = null;
    }
    const progreso = normalizarProgresoLavado(guardado, perfil.cuerpo);
    await L.jugarLavado({
      rol: perfil.cuerpo,
      // (estos nombres no se muestran a un amigo: no hay botón de pareja)
      nombres: { el: 'Javier', ella: 'Laura' },
      progreso,
      guardar: async (p) => {
        try {
          localStorage.setItem(CLAVE_LAVADO, JSON.stringify(p));
        } catch {
          /* sin almacenamiento */
        }
      },
      pareja: null,
      amigo: { nombre: perfil.nombre, aspecto: aspectoDe(perfil) },
      textoSalir: '🎮 Volver a la sala de juegos',
      unirse: como.unirse,
      crear: como.crear,
    });
  } catch (e) {
    console.error(e);
    aviso('No se pudo abrir el juego. Intenta otra vez.');
  }
  raiz.classList.remove('tapado');
  pantalla = 'sala';
  sala();
}

// ---------------------------------------------------------------------------------------------------- Arranque
function atras() {
  const aLaVista = (sel: string) => [...document.querySelectorAll<HTMLElement>(sel)].find((b) => b.offsetParent !== null);
  const enLavado = aLaVista('.lv-pausa') ?? aLaVista('.lv-pantalla [data-v="volver"]') ?? aLaVista('.lv-menu [data-m="salir"]');
  const capa = document.querySelector<HTMLElement>('.am-capa');
  if (enLavado) enLavado.click();
  else if (capa) capa.remove();
  else if (pantalla === 'creador' && perfilAmigo()?.activo) {
    perfil = perfilAmigo() ?? perfil;
    sala();
  }
  // (nunca hacia la casa: atrás desde la sala de juegos cierra la app)
  else if (Capacitor.isNativePlatform()) void App.exitApp();
}
if (Capacitor.isNativePlatform()) void App.addListener('backButton', atras);
else document.addEventListener('keydown', (e) => e.key === 'Escape' && !e.repeat && atras());

const activo = perfilAmigo()?.activo;
if (activo && !params.has('perfil')) sala();
else abrirElCreador();
(window as unknown as { __amigos: unknown }).__amigos = { perfil: () => creador?.perfil() ?? perfil, pantalla: () => pantalla, lavarse, unirse, creador: () => creador };
