// Prueba del modo amigo: un celular nuevo toca «Soy un amigo / una amiga», arma su muñeco, llega a su sala de juegos
// y, por ningún camino (recargar, ir a la casa, a las páginas de la pareja, atrás), vuelve a ver la casa. Juega
// Lavarse la cara (menú, disfraces, cartas, colección, una partida) y en NINGÚN momento ve algo personal de la
// pareja (busca en la pantalla las palabras de docs/la-pareja.md y los recuerdos de las cartas), ni se pide nada de
// la casa (modelos de los cuartos, recuerdos, el Supabase de la pareja). Al final, «¿Eres Javier o Laura?» lo saca.
// Uso (con el servidor de desarrollo prendido): node scripts/probar-amigos.mjs [url] [carpeta]
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { SupabaseFalso } from './supabase-falso.mjs';
import { PALABRAS_PAREJA, buscarPersonal } from './palabras-pareja.mjs';

const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const carpeta = process.argv[3] ?? 'test-results/amigos';
mkdirSync(carpeta, { recursive: true });
const errores = [];
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const revisar = (ok, texto) => {
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${texto}`);
  if (!ok) errores.push(texto);
};

const PRE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({
  executablePath: existsSync(PRE) ? PRE : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const ctx = await navegador.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
const p = await ctx.newPage();
p.on('pageerror', (e) => errores.push(`error: ${e}`));
const red = new SupabaseFalso({ perder: 0, demora: 40 });
await red.conectar(p, 'el');
// Lo que se pide a la red después de volverse amigo (no puede ser nada de la casa)
let pedidos = [];
p.on('request', (r) => pedidos.push(r.url()));
const foto = (n) => p.screenshot({ path: `${carpeta}/${n}.png` });
/** Lo personal de las cartas y los disfraces (lo que cambia en modo neutro), sacado del juego mismo. */
let personal = [];
async function sinNadaPersonal(momento) {
  const texto = await p.evaluate(() => `${document.body.innerText}\n${(window.__avisos ?? []).join('\n')}`);
  const hallado = buscarPersonal(texto, [...PALABRAS_PAREJA, ...personal]);
  revisar(!hallado.length, `No ve nada personal: ${momento}${hallado.length ? ` (${hallado.slice(0, 5).join(' | ')})` : ''}`);
}

// 1. Celular nuevo: la primera pantalla tiene «Soy un amigo / una amiga»
await p.goto(`${url}/index.html`, { waitUntil: 'domcontentloaded', timeout: 180000 });
await p.waitForSelector('#bienvenida:not([hidden]) .rol-amigo', { timeout: 240000 });
const botones = await p.evaluate(() => [...document.querySelectorAll('.rol-carta b')].map((b) => b.textContent));
console.log('      botones:', botones.join(' · '));
revisar(botones.some((b) => /amig/i.test(b)), 'La primera pantalla ofrece «Soy un amigo / una amiga»');
await foto('0-quien-eres');
await p.tap('.rol-amigo');
await p.waitForURL(/amigos\.html/, { timeout: 30000 });
pedidos = [];
await p.waitForSelector('.am-creador', { timeout: 30000 });
await espera(2500);
await foto('1-creador');

// 2. Arma su muñeco y entra a su sala de juegos
await p.tap('.am-creador [type="submit"]');
revisar(/Cómo te llamas/.test(await p.textContent('.am-error')), 'Sin nombre no lo deja seguir');
await p.fill('.am-nombre input', 'Pipe');
await p.tap('.am-cuerpo[data-cuerpo="ella"]');
await p.tap('.am-muestra[data-campo="piel"][data-color="#a5653d"]');
await p.tap('.am-muestra[data-campo="pelo"][data-color="#d76b9a"]');
await p.tap('.am-muestra[data-campo="ropa"][data-color="#3fb5a3"]');
await espera(1800);
await foto('2-creador-colores');
await p.tap('.am-creador [type="submit"]');
await p.waitForSelector('.am-sala', { timeout: 20000 });
await espera(2500);
await foto('3-sala');
const perfil = await p.evaluate(() => JSON.parse(localStorage.getItem('nuestro-hogar-amigo')));
revisar(perfil.nombre === 'Pipe' && perfil.cuerpo === 'ella' && perfil.piel === '#a5653d' && /^amigo-/.test(perfil.id), 'El perfil queda guardado en el aparato con su id');
await sinNadaPersonal('sala de juegos');

// 3. Por ningún camino llega a la casa
for (const pagina of ['index.html', 'index.html?rol=el&local=1', 'puertas.html', 'mesa.html', 'super.html']) {
  await p.goto(`${url}/${pagina}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForURL(/amigos\.html/, { timeout: 15000 }).catch(() => undefined);
  revisar(/amigos\.html/.test(p.url()), `Abrir ${pagina} lo devuelve a su sala de juegos`);
}
await p.reload({ waitUntil: 'domcontentloaded' });
await p.waitForSelector('.am-sala', { timeout: 20000 });
revisar(true, 'Al recargar sigue en su sala de juegos');
await p.goBack({ timeout: 15000 }).catch(() => undefined);
await espera(1500);
revisar(!/index\.html/.test(p.url()) || /amigos/.test(p.url()) || (await p.evaluate(() => !document.querySelector('#bienvenida:not([hidden]), #hogar-hud:not([hidden])'))), `Con «atrás» no aparece la casa (${p.url().replace(url, '')})`);
if (!/amigos\.html/.test(p.url())) await p.goto(`${url}/amigos.html`, { waitUntil: 'domcontentloaded' });
await p.waitForSelector('.am-sala', { timeout: 20000 });

// 4. Lavarse la cara, en modo neutro de punta a punta
pedidos = [];
await p.evaluate(() => {
  window.__avisos = [];
  new MutationObserver(() => document.querySelectorAll('.lv-aviso, .lv-jefe').forEach((a) => a.textContent && window.__avisos.push(a.textContent))).observe(document.body, { subtree: true, childList: true, characterData: true });
});
await p.tap('.am-juego.lavado');
await p.waitForSelector('.lv-menu:not([hidden]) [data-m="jugar"]', { timeout: 90000 });
personal = await p.evaluate(async () => {
  // Todo lo personal del lavado vive en pareja.ts (lo que la versión para amigos ni compila)
  const { PAREJA } = await import('/src/casa/lavado/pareja.ts');
  const textos = [];
  const juntar = (v) => {
    if (typeof v === 'string') textos.push(v.replace(/^\P{L}+/u, '').trim());
    else if (v && typeof v === 'object' && !(v instanceof RegExp)) Object.values(v).forEach(juntar);
  };
  juntar([PAREJA.cartas, PAREJA.disfraces, PAREJA.logros, PAREJA.enemigos]);
  return [...new Set(textos.filter((t) => t.length > 5))];
});
revisar(personal.length > 20, `Se sabe qué es personal (${personal.length} textos de cartas y disfraces)`);
await espera(800);
await foto('4-lavado-menu');
const menu = await p.evaluate(() => document.querySelector('.lv-menu').innerText);
revisar(!/Jugar con/.test(menu) && /Volver a la sala de juegos/.test(menu), 'El menú no ofrece jugar en pareja y vuelve a la sala de juegos');
await sinNadaPersonal('menú del lavado');
for (const [boton, nombre] of [['disfraces', 'disfraces'], ['cartas', 'cartas'], ['coleccion', 'colección']]) {
  await p.tap(`.lv-menu [data-m="${boton}"]`);
  await espera(500);
  // (en las listas, se toca cada cosa para ver su detalle)
  const n = await p.evaluate(() => document.querySelectorAll('.lv-pantalla [data-sel]').length);
  for (let k = 0; k < n; k++) {
    await p.evaluate((k) => document.querySelectorAll('.lv-pantalla [data-sel]')[k]?.dispatchEvent(new MouseEvent('click', { bubbles: true })), k);
    if (k % 4 === 0) await sinNadaPersonal(`${nombre}, detalle ${k + 1}`);
  }
  if (boton === 'coleccion') {
    for (const tab of ['pasivas', 'mugrosos', 'logros']) {
      await p.evaluate((t) => document.querySelector(`.lv-pantalla [data-tab="${t}"]`)?.dispatchEvent(new MouseEvent('click', { bubbles: true })), tab);
      const m = await p.evaluate(() => document.querySelectorAll('.lv-pantalla [data-sel]').length);
      for (let k = 0; k < m; k++) await p.evaluate((k) => document.querySelectorAll('.lv-pantalla [data-sel]')[k]?.dispatchEvent(new MouseEvent('click', { bubbles: true })), k);
      await sinNadaPersonal(`colección: ${tab}`);
    }
  }
  await foto(`5-${boton}`);
  await sinNadaPersonal(nombre);
  await p.tap('.lv-pantalla [data-v="volver"]');
}
// Una partida (la primera vez sale el tutorial: se salta)
await p.tap('.lv-menu [data-m="jugar"]');
await p.waitForSelector('.lv-tuto [data-t="saltar"]', { timeout: 90000 });
await sinNadaPersonal('tutorial');
await p.tap('.lv-tuto [data-t="saltar"]');
await p.waitForFunction(() => window.__lavado?.actual?.m && !window.__lavado.actual.tuto, null, { timeout: 90000 });
await p.evaluate(() => {
  const L = window.__lavado.actual;
  L.probar('aguante');
  L.probar('tiempo', 655);
  // Una carta mágica perdida para él
  L.m.jug[0].cartaOpciones = ['comienzo', 'solPlaya', 'diamante'];
});
await p.waitForSelector('.lv-c-carta:not([hidden]) .lv-sobre', { timeout: 30000 });
await espera(700);
await foto('6-carta-magica');
await sinNadaPersonal('carta mágica');
await p.evaluate(() => document.querySelector('.lv-c-carta .lv-sobre').dispatchEvent(new MouseEvent('click', { bubbles: true })));
await p.evaluate(() => window.__lavado.actual.probar('bot', 1));
await espera(8000);
await foto('7-jugando');
await sinNadaPersonal('jugando (con avisos)');
await p.evaluate(() => window.__lavado.actual.probar('fin'));
await p.waitForSelector('.lv-c-fin:not([hidden])', { timeout: 30000 });
await foto('8-fin');
await sinNadaPersonal('pantalla final');
await p.tap('.lv-c-fin [data-f="menu"]');
await p.waitForSelector('.lv-menu:not([hidden]) [data-m="salir"]', { timeout: 30000 });
await p.tap('.lv-menu [data-m="salir"]');
await p.waitForSelector('.am-sala', { timeout: 30000 });
revisar(true, 'Del lavado vuelve a su sala de juegos');
const deLaCasa = pedidos.filter((u) => /casa_|recuerdos\/|retratos\/|\/rest\/v1|eventos|sincro/.test(u));
revisar(!deLaCasa.length, `No pidió nada de la casa${deLaCasa.length ? `: ${deLaCasa.slice(0, 4).join(' ')}` : ''}`);

// 5. Si en realidad era Javier o Laura, puede volver al inicio (con confirmación)
await p.tap('.am-no-soy');
await p.waitForSelector('.am-dialogo', { timeout: 5000 });
await foto('9-no-soy');
await p.tap('.am-dialogo [data-r="si"]');
await p.waitForURL(/index\.html/, { timeout: 20000 });
await p.waitForSelector('#bienvenida:not([hidden])', { timeout: 240000 });
revisar(true, '«¿Eres Javier o Laura?» vuelve a la pantalla de inicio');

await navegador.close();
if (errores.length) {
  console.log('\nFallas:\n' + errores.join('\n'));
  process.exit(1);
}
console.log('\nTodo bien: los amigos juegan sin ver nada de la pareja.');
