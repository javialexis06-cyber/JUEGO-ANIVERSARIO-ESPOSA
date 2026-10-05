// La sala de juegos de amigos (amigos.html): lo que ve quien entra con «Soy un amigo / una amiga». Su muñeco en 3D
// con sus colores, los juegos permitidos (Sangre y Ceniza y Lavarse la cara en modo neutro) y «Unirme con un
// código». NUNCA carga la casa, ni el Supabase de la pareja, ni recuerdos, ni notas, ni nada personal: solo el
// perfil del amigo (guardado en el aparato) y las salas de juego. index.html manda aquí directo mientras el perfil
// esté activo (también al recargar o con el botón atrás), y desde aquí no hay enlace a la casa: solo «¿Eres Javier
// o Laura?», que pide confirmar y apaga el modo amigo.
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
import {
  PELOS, PIELES, ROPAS, aspectoDe, dejarModoAmigo, guardarPerfilAmigo, limpiarNombre, perfilAmigo, perfilNuevo, type PerfilAmigo,
} from '../salas/perfil';
import { averiguarJuego, normalizarCodigo } from '../salas/sala';
import { Muneco } from './muneco';

const raiz = document.getElementById('amigos')!;
const params = new URLSearchParams(location.search);
const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const CLAVE_LAVADO = 'amigo-lavado-progreso';

let perfil: PerfilAmigo = perfilAmigo() ?? perfilNuevo();
let muneco: Muneco | null = null;
let pantalla: 'creador' | 'sala' | 'juego' = 'creador';
/** ¿Ya existe Sangre y Ceniza en esta versión? (la hace otro frente: mientras tanto, «Muy pronto») */
let haySangre: boolean | null = null;

function aviso(texto: string) {
  const a = document.createElement('div');
  a.className = 'am-aviso';
  a.textContent = texto;
  document.body.append(a);
  setTimeout(() => a.remove(), 3200);
}

// ---------------------------------------------------------------------------------------------------- El muñeco
function ponerMuneco(lienzo: HTMLCanvasElement) {
  muneco?.liberar();
  muneco = null;
  try {
    muneco = new Muneco(lienzo);
    void muneco.poner(aspectoDe(perfil)).catch((e) => console.error(e));
    muneco.arrancar();
  } catch (e) {
    // (sin WebGL: queda la carita)
    console.error(e);
    lienzo.insertAdjacentHTML('afterend', `<div class="am-carita-grande">${caritaSvg(aspectoDe(perfil), 180, 'feliz')}</div>`);
  }
}

// ---------------------------------------------------------------------------------------------------- Creador
function filaColores(campo: 'piel' | 'pelo' | 'ropa' | 'ropa2' | 'zapatos', titulo: string, lista: string[]) {
  return `<div class="am-fila" role="radiogroup" aria-label="${titulo}"><span>${titulo}</span><div class="am-muestras">${lista
    .map((c) => `<button type="button" class="am-muestra ${perfil[campo] === c ? 'si' : ''}" data-campo="${campo}" data-color="${c}" style="--m:${c}" aria-label="${titulo} ${c}" role="radio" aria-checked="${perfil[campo] === c}"></button>`)
    .join('')}</div></div>`;
}

function creador() {
  pantalla = 'creador';
  const yaEra = !!perfilAmigo()?.activo;
  raiz.innerHTML = `<section class="am-creador">
    <div class="am-escenario"><div class="am-luces" aria-hidden="true">${'<i></i>'.repeat(14)}</div><canvas class="am-lienzo" aria-label="Tu muñeco"></canvas>
      <p class="am-pista">Arrástralo para darle la vuelta</p></div>
    <form class="am-panel" autocomplete="off">
      <h1>${yaEra ? 'Tu muñeco' : '¡Bienvenido a la sala de juegos!'}</h1>
      <label class="am-nombre"><span>¿Cómo te llamas?</span><input name="nombre" maxlength="16" placeholder="Tu nombre" value="${esc(perfil.nombre === 'Amigo' && !yaEra ? '' : perfil.nombre)}" enterkeyhint="done"></label>
      <div class="am-fila"><span>Muñeco</span><div class="am-cuerpos">
        <button type="button" class="am-cuerpo ${perfil.cuerpo === 'el' ? 'si' : ''}" data-cuerpo="el">${caritaSvg({ ...aspectoDe(perfil), cuerpo: 'el' }, 34)}<b>Pelo corto</b></button>
        <button type="button" class="am-cuerpo ${perfil.cuerpo === 'ella' ? 'si' : ''}" data-cuerpo="ella">${caritaSvg({ ...aspectoDe(perfil), cuerpo: 'ella' }, 34)}<b>Pelo largo</b></button>
      </div></div>
      ${filaColores('piel', 'Piel', PIELES)}
      ${filaColores('pelo', 'Pelo', PELOS)}
      ${filaColores('ropa', 'Camiseta', ROPAS)}
      ${filaColores('ropa2', 'Pantalón', ROPAS)}
      ${filaColores('zapatos', 'Zapatos', ROPAS)}
      <p class="am-error" role="status"></p>
      <div class="am-botones">
        <button type="button" class="boton boton-papel" data-a="volver">← ${yaEra ? 'Volver' : 'Atrás'}</button>
        <button type="button" class="boton boton-papel" data-a="azar">🎲 Al azar</button>
        <button type="submit" class="boton boton-tomate">¡Listo!</button>
      </div>
    </form></section>`;
  ponerMuneco(raiz.querySelector('canvas')!);
  const form = raiz.querySelector('form')!;
  const input = form.querySelector<HTMLInputElement>('input[name="nombre"]')!;
  input.addEventListener('input', () => {
    perfil.nombre = input.value;
    form.querySelector('.am-error')!.textContent = '';
  });
  const refrescar = () => {
    form.querySelectorAll<HTMLElement>('.am-muestra').forEach((b) => {
      const si = perfil[b.dataset.campo as 'piel'] === b.dataset.color;
      b.classList.toggle('si', si);
      b.setAttribute('aria-checked', String(si));
    });
    form.querySelectorAll<HTMLElement>('.am-cuerpo').forEach((b) => {
      b.classList.toggle('si', b.dataset.cuerpo === perfil.cuerpo);
      b.querySelector('svg')!.outerHTML = caritaSvg({ ...aspectoDe(perfil), cuerpo: b.dataset.cuerpo as 'el' | 'ella' }, 34);
    });
    void muneco?.poner(aspectoDe(perfil)).catch(() => undefined);
  };
  form.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const m = t.closest<HTMLElement>('.am-muestra');
    const c = t.closest<HTMLElement>('.am-cuerpo');
    const a = t.closest<HTMLElement>('[data-a]');
    sonido.activar();
    if (m) {
      (perfil as unknown as Record<string, string>)[m.dataset.campo!] = m.dataset.color!;
      sonido.nota(660, 0.08, 0, 'sine', 0.05);
      refrescar();
    } else if (c) {
      perfil.cuerpo = c.dataset.cuerpo as 'el' | 'ella';
      sonido.nota(520, 0.1, 0, 'triangle', 0.05);
      refrescar();
    } else if (a?.dataset.a === 'azar') {
      const nuevo = perfilNuevo(Math.random() < 0.5 ? 'el' : 'ella');
      perfil = { ...perfil, cuerpo: nuevo.cuerpo, piel: nuevo.piel, pelo: nuevo.pelo, ropa: nuevo.ropa, ropa2: nuevo.ropa2, zapatos: nuevo.zapatos };
      refrescar();
    } else if (a?.dataset.a === 'volver') {
      if (yaEra) {
        perfil = perfilAmigo() ?? perfil;
        sala();
      } else location.replace('./index.html');
    }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = limpiarNombre(input.value);
    if (!nombre) {
      form.querySelector('.am-error')!.textContent = '¿Cómo te llamas? Así te ven los demás en las salas.';
      input.focus();
      return;
    }
    perfil = { ...perfil, nombre, activo: true };
    guardarPerfilAmigo(perfil);
    sonido.nota(784, 0.12, 0, 'triangle', 0.06);
    sala();
  });
}

// ---------------------------------------------------------------------------------------------------- La sala de juegos
const ARTE_SANGRE = `<svg viewBox="0 0 200 110" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
  <defs><radialGradient id="sl" cx="70%" cy="30%" r="60%"><stop offset="0" stop-color="#5a1418"/><stop offset="1" stop-color="#0d0709"/></radialGradient>
  <linearGradient id="sn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8e1b1b" stop-opacity="0"/><stop offset="1" stop-color="#8e1b1b" stop-opacity=".55"/></linearGradient></defs>
  <rect width="200" height="110" fill="url(#sl)"/>
  <circle cx="150" cy="30" r="17" fill="#f2e3c4"/><circle cx="144" cy="26" r="16" fill="#3a0f12" opacity=".35"/>
  <path d="M0 110 V84 L14 84 L14 70 L20 64 L26 70 L26 84 L44 84 L44 58 L52 50 L60 58 L60 84 L72 84 L72 40 L78 30 L84 40 L84 84 L98 84 L98 62 L106 54 L114 62 L114 84 L130 84 L130 74 L140 74 L140 84 L160 84 L160 66 L168 58 L176 66 L176 84 L200 84 V110 Z" fill="#050304"/>
  <rect x="77" y="52" width="3" height="5" fill="#ffb347"/><rect x="104" y="68" width="3" height="4" fill="#ffb347"/><rect x="166" y="70" width="3" height="4" fill="#ff8a3d"/>
  <path d="M30 30 q4 -4 8 0 q4 -4 8 0 q-4 1 -8 4 q-4 -3 -8 -4z M118 18 q3 -3 6 0 q3 -3 6 0 q-3 1 -6 3 q-3 -2 -6 -3z M60 16 q2.5 -2.5 5 0 q2.5 -2.5 5 0 q-2.5 1 -5 2.5 q-2.5 -1.5 -5 -2.5z" fill="#050304"/>
  <rect y="70" width="200" height="40" fill="url(#sn)"/></svg>`;

const ARTE_LAVADO = `<svg viewBox="0 0 200 110" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="lf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c8ecff"/><stop offset="1" stop-color="#ffd3e0"/></linearGradient>
  <radialGradient id="lb" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".55" stop-color="#d9f2ff" stop-opacity=".25"/><stop offset="1" stop-color="#ffc4dd" stop-opacity=".45"/></radialGradient></defs>
  <rect width="200" height="110" fill="url(#lf)"/>
  ${[[30, 30, 14], [168, 22, 10], [150, 80, 18], [20, 85, 9], [110, 18, 7], [60, 92, 6], [188, 60, 7]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#lb)" stroke="#fff" stroke-width="1.4"/>`).join('')}
  <g transform="translate(92 62)">
    ${Array.from({ length: 12 }, (_, k) => `<circle cx="${Math.cos((k / 12) * Math.PI * 2) * 25}" cy="${Math.sin((k / 12) * Math.PI * 2) * 25}" r="6" fill="#7ccf6b"/>`).join('')}
    <circle r="23" fill="#8fdb7c"/><circle r="23" fill="#5aa94c" opacity=".25" transform="translate(4 5)"/>
    <ellipse cx="-8" cy="-3" rx="5" ry="6.5" fill="#fff"/><ellipse cx="8" cy="-3" rx="5" ry="6.5" fill="#fff"/>
    <circle cx="-7" cy="-2" r="3" fill="#1d1d24"/><circle cx="9" cy="-2" r="3" fill="#1d1d24"/>
    <path d="M-8 9 q8 6 16 0" stroke="#2c5a24" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M-15 -12 l6 3 M15 -12 l-6 3" stroke="#2c5a24" stroke-width="2.2" stroke-linecap="round"/></g>
  <g transform="translate(150 50) rotate(-14)"><rect x="-20" y="-11" width="40" height="22" rx="8" fill="#f8b6c7"/><rect x="-20" y="-11" width="40" height="9" rx="6" fill="#fff" opacity=".45"/></g></svg>`;

async function revisarSangre() {
  if (haySangre !== null) return haySangre;
  try {
    const r = await fetch('./sangre.html', { cache: 'no-store' });
    // (el servidor de desarrollo contesta la casa cuando no existe: se mira que el título sea el del juego)
    haySangre = r.ok && /<title>[^<]*sangre/i.test(await r.text());
  } catch {
    haySangre = false;
  }
  return haySangre;
}

function sala() {
  pantalla = 'sala';
  raiz.innerHTML = `<section class="am-sala">
    <div class="am-escenario"><div class="am-luces" aria-hidden="true">${'<i></i>'.repeat(14)}</div><canvas class="am-lienzo" aria-label="Tu muñeco"></canvas>
      <div class="am-placa"><b>${esc(perfil.nombre)}</b><button class="am-editar" data-a="editar">✏️ Mi muñeco</button></div></div>
    <div class="am-lado">
      <header><h1>Sala de juegos</h1><p>¡Hola, ${esc(perfil.nombre)}! Escoge un juego o entra a la sala de tus amigos.</p></header>
      <div class="am-juegos">
        <button class="am-juego sangre" data-j="sangre"><span class="arte">${ARTE_SANGRE}</span><span class="txt"><b>Sangre y Ceniza</b><small>Sobrevive la noche eterna · hasta 4</small></span><em class="estado">…</em></button>
        <button class="am-juego lavado" data-j="lavado"><span class="arte">${ARTE_LAVADO}</span><span class="txt"><b>Lavarse la cara</b><small>Mugrosos sin fin · hasta 4</small></span><em class="estado">Jugar</em></button>
      </div>
      <form class="am-codigo" autocomplete="off"><span>🔑 Unirme con un código</span>
        <input name="c" maxlength="7" placeholder="ABCDE" aria-label="Código de la sala" autocapitalize="characters" spellcheck="false" enterkeyhint="go">
        <button class="boton boton-menta">Entrar</button></form>
      <button class="am-no-soy" data-a="pareja">¿Eres Javier o Laura?</button>
    </div></section>`;
  ponerMuneco(raiz.querySelector('canvas')!);
  void revisarSangre().then((si) => {
    const e = raiz.querySelector<HTMLElement>('.am-juego.sangre .estado');
    if (!e) return;
    e.textContent = si ? 'Jugar' : 'Muy pronto';
    raiz.querySelector('.am-juego.sangre')!.classList.toggle('pronto', !si);
  });
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
    if (j?.dataset.j === 'lavado') void lavarse();
    else if (j?.dataset.j === 'sangre') {
      if (haySangre) location.href = './sangre.html';
      else aviso('Sangre y Ceniza llega muy pronto. ¡Mientras tanto, a lavarse la cara!');
    } else if (a?.dataset.a === 'editar') creador();
    else if (a?.dataset.a === 'pareja') noSoyAmigo();
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
  if (juego === 'lavado') return lavarse(c);
  if (juego === 'sangre') {
    location.href = `./sangre.html?unirse=${encodeURIComponent(c)}`;
    return;
  }
  if (juego) return aviso('Esa sala es de un juego que todavía no está aquí.');
  aviso('No encontramos esa sala. Revisa el código (y que quien la creó siga adentro).');
}

// ---------------------------------------------------------------------------------------------------- Lavarse la cara
async function lavarse(unirseA?: string) {
  if (pantalla === 'juego') return;
  pantalla = 'juego';
  muneco?.detener();
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
      unirse: unirseA,
    });
  } catch (e) {
    console.error(e);
    aviso('No se pudo abrir el juego. Intenta otra vez.');
  }
  raiz.classList.remove('tapado');
  sala();
}

// ---------------------------------------------------------------------------------------------------- Arranque
function atras() {
  const aLaVista = (sel: string) => [...document.querySelectorAll<HTMLElement>(sel)].find((b) => b.offsetParent !== null);
  const enLavado = aLaVista('.lv-pausa') ?? aLaVista('.lv-pantalla [data-v="volver"]') ?? aLaVista('.lv-menu [data-m="salir"]');
  const capa = document.querySelector<HTMLElement>('.am-capa');
  if (enLavado) enLavado.click();
  else if (capa) capa.remove();
  else if (pantalla === 'creador' && perfilAmigo()?.activo) sala();
  // (nunca hacia la casa: atrás desde la sala de juegos cierra la app)
  else if (Capacitor.isNativePlatform()) void App.exitApp();
}
if (Capacitor.isNativePlatform()) void App.addListener('backButton', atras);
else document.addEventListener('keydown', (e) => e.key === 'Escape' && !e.repeat && atras());

const activo = perfilAmigo()?.activo;
if (activo && !params.has('perfil')) sala();
else creador();
(window as unknown as { __amigos: unknown }).__amigos = { perfil: () => perfil, pantalla: () => pantalla, lavarse, unirse };
