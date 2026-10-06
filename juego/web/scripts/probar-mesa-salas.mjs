// Juegos de mesa con amigos, con el Supabase de mentiras (pierde y demora mensajes):
// 1. Un amigo (mesa.html?amigo) juega cada juego contra la máquina: su muñeco con sus colores contra «Toto» o
//    «Lulú», sin monedas para ninguna casa y sin escenas premium.
// 2. Abre una sala con código, otra amiga entra con «Unirme con código» y juegan los cinco juegos (Dados, Mancala,
//    Puntos y Cajas, Parchís y Parchís a 2 colores) uno tras otro: el anfitrión cambia el juego en la sala de espera,
//    los dos tocan «Estoy listo», juegan con la IA de cada lado tocando por ellos y al final los dos celulares deben
//    quedar con el mismo estado. En una partida a la invitada se le corta el internet: al anfitrión le sale la pausa.
// En todo momento revisa que ninguno vea nada personal de la pareja (lo que aparece en la pantalla, los globitos de
// los muñequitos y lo que se dibuja en los lienzos).
// Uso (con el servidor de desarrollo prendido): node scripts/probar-mesa-salas.mjs [url] [carpeta] [juegos]
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { SupabaseFalso } from './supabase-falso.mjs';
import { PALABRAS_PAREJA, buscarPersonal } from './palabras-pareja.mjs';

const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const carpeta = process.argv[3] ?? 'test-results/mesa-salas';
const JUEGOS = (process.argv[4] ?? 'dados,mancala,cajas,parchis,parchis2').split(',');
/** Velocidad de las animaciones (RAPIDO=8 para que el parchís no tarde tanto en una máquina lenta). */
const RAPIDO = Number(process.env.RAPIDO) || 4;
/** Los juegos contra la máquina (por defecto los mismos; JUEGOS_IA=parchis2 para repetir solo uno). */
const JUEGOS_IA = process.env.JUEGOS_IA === '-' ? [] : process.env.JUEGOS_IA ? process.env.JUEGOS_IA.split(',') : JUEGOS;
mkdirSync(carpeta, { recursive: true });
const errores = [];
const revisar = (ok, texto) => {
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${texto}`);
  if (!ok) errores.push(texto);
};
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const PRE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({
  executablePath: existsSync(PRE) ? PRE : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const red = new SupabaseFalso({ perder: 0.06, demora: 160 });
const PIPE = { id: 'amigo-pipe00001', nombre: 'Pipe', cuerpo: 'el', piel: '#c27f52', pelo: '#d76b9a', ropa: '#3fb5a3', ropa2: '#1d1d24', zapatos: '#f2c94c' };
const CARO = { id: 'amigo-caro00002', nombre: 'Caro', cuerpo: 'ella', piel: '#f6c8a4', pelo: '#5a6fd8', ropa: '#f29b38', ropa2: '#4a4a52', zapatos: '#f4efe6' };

/** Todo lo que aparece en la pantalla (también lo que sale un momentico: globitos, avisos) y lo que se dibuja. */
const VIGILAR = () => {
  window.__vistos = [];
  const guardar = (t) => t && t.trim() && window.__vistos.length < 4000 && window.__vistos.push(t.trim());
  new MutationObserver((ms) => {
    for (const m of ms) {
      if (m.type === 'characterData') guardar(m.target.textContent);
      for (const n of m.addedNodes) guardar(n.textContent);
    }
  }).observe(document.documentElement, { subtree: true, childList: true, characterData: true });
  const orig = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (t, ...r) {
    guardar(String(t));
    return orig.call(this, t, ...r);
  };
};

async function celular(nombre, amigo, extra = '') {
  const ctx = await navegador.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.nombre = nombre;
  p.on('pageerror', (e) => errores.push(`${nombre}: ${e}`));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|status of 403/.test(m.text()) && errores.push(`${nombre}: ${m.text()}`));
  await red.conectar(p, 'amigo');
  await p.addInitScript((a) => localStorage.setItem('nuestro-hogar-amigo', JSON.stringify({ ...a, activo: true, creado: 1 })), amigo);
  await p.addInitScript(VIGILAR);
  await p.goto(`${url}/mesa.html?amigo&rapido=${RAPIDO}${extra}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await p.waitForSelector('#menu:not([hidden]) .juego-carta', { timeout: 120000 });
  return p;
}

async function sinNadaPersonal(p, momento) {
  const texto = await p.evaluate(() => [document.body.innerText, document.title, ...(window.__vistos ?? []),
    ...[...document.querySelectorAll('[title],[aria-label]')].map((e) => `${e.getAttribute('title') ?? ''} ${e.getAttribute('aria-label') ?? ''}`)].join('\n'));
  const hallado = buscarPersonal(texto, PALABRAS_PAREJA);
  revisar(!hallado.length, `${p.nombre} no ve nada personal: ${momento}${hallado.length ? ` (${hallado.join(' | ')})` : ''}`);
}

/** Juega por los humanos de estas páginas con la IA (como si tocaran el tablero) hasta que termine la partida. */
/** Hasta cuánto puede durar una partida con WebGL por software: el parchís de cuatro fichas por jugador pasa de 12 min
 *  y en sala (dos celulares animando cada jugada) todo tarda el doble. */
const limiteDe = (juego, enSala = false) => (juego === 'parchis2' ? 30 : juego === 'parchis' ? 20 : 12) * (enSala ? 2 : 1) * 60_000;
async function jugarHastaElFinal(paginas, limite = 12 * 60_000) {
  const t0 = Date.now();
  let ultimaFoto = t0;
  for (;;) {
    for (const p of paginas) {
      await p.evaluate(() => {
        const pt = window.__mesa.partida;
        if (!pt || !pt.esperando) return;
        const mov = pt.juego.ia(pt.e, 'normal', Math.random);
        const f = pt.esperando;
        pt.esperando = null;
        f(mov);
      }).catch(() => {});
    }
    const fin = (await Promise.all(paginas.map((p) => p.evaluate(() => !document.getElementById('final').hidden)))).every(Boolean);
    if (fin) return true;
    if (Date.now() - t0 > limite) return false;
    if (Date.now() - ultimaFoto > 5 * 60_000) {
      ultimaFoto = Date.now();
      await paginas[0].screenshot({ path: `${carpeta}/progreso-${new Date().toTimeString().slice(0, 5).replace(':', 'h')}.png` }).catch(() => {});
    }
    await espera(250);
  }
}

// ---------------------------------------------------------------------------------------------------------------
// 1. Contra la máquina
const pipe = await celular('Pipe', PIPE);
await sinNadaPersonal(pipe, 'menú de la mesa');
const menu = await pipe.evaluate(() => ({
  linea: document.querySelector('[data-modo="linea"]').hidden, contra: document.querySelector('[data-modo="ia"]').textContent,
  casa: document.querySelector('.boton-casa').getAttribute('href'), logo: document.querySelector('.logo-pareja').textContent,
}));
revisar(menu.linea && /máquina/.test(menu.contra) && /amigos\.html/.test(menu.casa), `El amigo juega contra la máquina, sin «En línea» y vuelve a su sala (${menu.contra} · ${menu.casa})`);
await pipe.screenshot({ path: `${carpeta}/0-menu.png` });
for (const [k, juego] of JUEGOS_IA.entries()) {
  await pipe.click('[data-modo="ia"]');
  if (juego === 'parchis' || juego === 'parchis2') {
    await pipe.click('[data-juego="parchis"]');
    await pipe.waitForSelector('#hoja:not([hidden]) #hoja-botones button', { timeout: 30000 });
    await pipe.click(`#hoja-botones button:nth-child(${juego === 'parchis' ? 1 : 2})`);
  } else await pipe.click(`[data-juego="${juego}"]`);
  await pipe.waitForSelector('#partida:not([hidden])', { timeout: 60000 });
  await espera(k === 0 ? 4000 : 1500);
  const nombres = await pipe.evaluate(() => [...document.querySelectorAll('.marcador-nombre')].map((m) => m.textContent));
  revisar(nombres[0] === 'Pipe' && /Toto|Lulú/.test(nombres[1]), `${juego}: Pipe contra ${nombres[1]}`);
  revisar(await pipe.evaluate(() => document.getElementById('btn-escenas').hidden), `${juego}: sin escenas premium`);
  await pipe.screenshot({ path: `${carpeta}/1-ia-${juego}.png` });
  const ok = await jugarHastaElFinal([pipe], limiteDe(juego));
  revisar(ok, `${juego}: la partida contra la máquina termina`);
  await espera(1500);
  await pipe.screenshot({ path: `${carpeta}/1-ia-${juego}-final.png` });
  const premio = await pipe.evaluate(() => ({ visible: !document.getElementById('final-premio').hidden, sueldo: localStorage.getItem('nuestro-hogar-sueldo'), victorias: localStorage.getItem('nuestro-hogar-victorias') }));
  revisar(!premio.visible && !premio.sueldo && !premio.victorias, `${juego}: ni monedas ni victorias para ninguna casa`);
  await sinNadaPersonal(pipe, `${juego} contra la máquina`);
  await pipe.click('#btn-menu');
  await pipe.waitForSelector('#menu:not([hidden])', { timeout: 30000 });
}

// ---------------------------------------------------------------------------------------------------------------
// 2. En una sala con otra amiga
const caro = await celular('Caro', CARO);
await pipe.click('[data-modo="sala"]');
await pipe.click(`[data-juego="${JUEGOS[0] === 'parchis2' ? 'parchis' : JUEGOS[0]}"]`);
if (JUEGOS[0].startsWith('parchis')) {
  await pipe.waitForSelector('#hoja:not([hidden]) #hoja-botones button', { timeout: 30000 });
  await pipe.click(`#hoja-botones button:nth-child(${JUEGOS[0] === 'parchis' ? 1 : 2})`);
}
await pipe.waitForSelector('.sala-espera.visible .se-codigo', { timeout: 60000 });
const codigo = (await pipe.textContent('.sala-espera .se-codigo')).replace(/\s/g, '');
revisar(/^[A-Z2-9]{5}$/.test(codigo), `Pipe abrió la sala ${codigo}`);
await caro.click('#btn-unirme');
await caro.waitForSelector('#hoja:not([hidden]) .mesa-codigo', { timeout: 10000 });
await caro.fill('.mesa-codigo', codigo.toLowerCase());
await caro.click('#hoja-botones .boton-tomate');
await caro.waitForSelector('.sala-espera.visible .se-puesto.yo', { timeout: 60000 });
revisar(true, 'Caro entró a la sala con el código');

for (const [k, juego] of JUEGOS.entries()) {
  if (k > 0) {
    // El anfitrión cambia el juego en la sala de espera
    await pipe.click('.sala-espera [data-x="juego"]');
    await pipe.waitForSelector(`.juego-sala [data-sala-juego="${juego}"]`, { timeout: 10000 });
    if (k === 1) await pipe.screenshot({ path: `${carpeta}/2-escoger-juego.png` });
    await pipe.click(`.juego-sala [data-sala-juego="${juego}"]`);
  }
  await caro.waitForFunction((j) => (document.querySelector('.sala-espera .se-detalle')?.textContent ?? '').length > 2 && !!j, juego, { timeout: 20000 }).catch(() => {});
  await caro.tap('.sala-espera [data-a="principal"]', { force: true });
  await pipe.waitForSelector('.sala-espera [data-a="principal"]:not([disabled])', { timeout: 60000 });
  if (k === 0) {
    await pipe.screenshot({ path: `${carpeta}/2-sala.png` });
    await sinNadaPersonal(pipe, 'sala de espera');
    await sinNadaPersonal(caro, 'sala de espera');
  }
  await pipe.tap('.sala-espera [data-a="principal"]', { force: true });
  await Promise.all([pipe, caro].map((p) => p.waitForSelector('#partida:not([hidden])', { timeout: 60000 })));
  const nombre = await pipe.evaluate(() => document.getElementById('partida-juego').textContent);
  revisar(true, `Sala · ${juego}: los dos entraron a la partida (${nombre})`);
  await espera(k === 0 ? 4000 : 1200);
  if (k === 0) await Promise.all([pipe, caro].map((p) => p.screenshot({ path: `${carpeta}/3-sala-${juego}-${p.nombre}.png` })));
  if (k === 2) {
    // A Caro se le corta el internet: a Pipe le sale la pausa hasta que vuelve
    red.cortar(caro, true);
    await pipe.waitForSelector('#pausa-linea:not([hidden])', { timeout: 20000 }).catch(() => {});
    const t = await pipe.evaluate(() => (document.getElementById('pausa-linea').hidden ? '' : document.getElementById('pausa-linea-texto').textContent));
    revisar(/Se cortó la conexión con Caro/.test(t), `Sala · ${juego}: al cortarse Caro, a Pipe le sale la pausa («${t}»)`);
    await pipe.screenshot({ path: `${carpeta}/4-corte.png` });
    red.cortar(caro, false);
    await pipe.waitForSelector('#pausa-linea', { state: 'hidden', timeout: 30000 }).catch(() => {});
    revisar(await pipe.evaluate(() => document.getElementById('pausa-linea').hidden), `Sala · ${juego}: Caro volvió y siguen`);
  }
  const ok = await jugarHastaElFinal([pipe, caro], limiteDe(juego, true));
  revisar(ok, `Sala · ${juego}: la partida termina en los dos celulares`);
  const [a, b] = await Promise.all([pipe, caro].map((p) => p.evaluate(() => JSON.stringify(window.__mesa.partida?.e))));
  revisar(!!a && a === b, `Sala · ${juego}: los dos quedan exactamente con el mismo estado`);
  await espera(1200);
  if (k === 0 || juego === 'cajas') await Promise.all([pipe, caro].map((p) => p.screenshot({ path: `${carpeta}/5-final-${juego}-${p.nombre}.png` })));
  for (const p of [pipe, caro]) await sinNadaPersonal(p, `sala · ${juego}`);
  // Los dos vuelven a la sala de espera
  for (const p of [pipe, caro]) await p.click('#btn-revancha');
  await Promise.all([pipe, caro].map((p) => p.waitForSelector('.sala-espera.visible', { timeout: 30000 })));
}
revisar(true, 'Volvieron a la sala después de cada juego');

// 3. Pipe cierra la sala: a Caro se le acaba con un aviso y vuelve a su menú
await pipe.click('.sala-espera [data-a="salir"]');
await caro.waitForSelector('#menu:not([hidden])', { timeout: 90000 });
await caro.waitForFunction(() => !document.querySelector('.sala-espera'), null, { timeout: 30000 }).catch(() => {});
revisar(await caro.evaluate(() => !document.querySelector('.sala-espera.visible')), 'Al cerrar Pipe la sala, Caro vuelve a su menú');
const progreso = await pipe.evaluate(() => ({ mesa: localStorage.getItem('mesa-partida'), sueldo: localStorage.getItem('nuestro-hogar-sueldo') }));
revisar(!progreso.mesa && !progreso.sueldo, 'Nada quedó en la partida ni en el sueldo de la pareja');

console.log(errores.length ? `ERRORES:\n${errores.join('\n')}` : 'Sin errores');
await navegador.close();
process.exit(errores.length ? 1 : 0);
