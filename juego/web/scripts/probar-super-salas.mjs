// Súper Manía en una sala con código (de 2 a 4: Javier, Laura y amigos), con el Supabase de mentiras (pierde y
// demora mensajes). Un amigo abre la sala desde su sala de juegos (super.html?amigo), entran otro amigo y Javier
// con «Unirme con código», tocan «Estoy listo» y juegan un día completo: el anfitrión simula (con el piloto
// automático para que el día pase rápido) y los demás mueven su muñeco con el joystick (teclado). Revisa que cada
// uno vea a los demás moverse, la pausa para todos cuando a uno se le corta el internet, el mismo tiquete en todos,
// que cada amigo guarde su progreso en su aparato (sin sueldo para ninguna casa), que con amigos nadie vea nada
// personal de la pareja y que todos vuelvan juntos a la sala de espera. Al final el anfitrión se va y a los demás
// se les acaba la sala con un aviso.
// Uso (con el servidor de desarrollo prendido): node scripts/probar-super-salas.mjs [url] [carpeta] [jugadores 2-4]
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { SupabaseFalso } from './supabase-falso.mjs';
import { PALABRAS_PAREJA, buscarPersonal } from './palabras-pareja.mjs';

const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const carpeta = process.argv[3] ?? 'test-results/super-salas';
const cuantos = Math.max(2, Math.min(4, Number(process.argv[4] ?? 3)));
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
const red = new SupabaseFalso({ perder: 0.05, demora: 160 });

const AMIGOS = [
  { id: 'amigo-pipe00001', nombre: 'Pipe', cuerpo: 'el', piel: '#c27f52', pelo: '#d76b9a', ropa: '#3fb5a3', ropa2: '#1d1d24', zapatos: '#f2c94c' },
  { id: 'amigo-caro00002', nombre: 'Caro', cuerpo: 'ella', piel: '#f6c8a4', pelo: '#5a6fd8', ropa: '#f29b38', ropa2: '#4a4a52', zapatos: '#f4efe6' },
  { id: 'amigo-tato00003', nombre: 'Tato', cuerpo: 'el', piel: '#83492a', pelo: '#e8cf8f', ropa: '#6c5ce7', ropa2: '#4f8fe0', zapatos: '#e85d5d' },
];

/** Un celular: un amigo (con su perfil) o Javier (rol el, sin perfil de amigo). */
async function celular(nombre, amigo, extra = '') {
  const ctx = await navegador.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.nombre = nombre;
  p.on('pageerror', (e) => errores.push(`${nombre}: ${e}`));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|status of 403/.test(m.text()) && errores.push(`${nombre}: ${m.text()}`));
  await red.conectar(p, amigo ? 'amigo' : 'el');
  if (amigo) await p.addInitScript((a) => localStorage.setItem('nuestro-hogar-amigo', JSON.stringify({ ...a, activo: true, creado: 1 })), amigo);
  else await p.addInitScript(() => localStorage.setItem('nuestro-hogar-modo', JSON.stringify({ rol: 'el' })));
  await p.goto(`${url}/super.html?${amigo ? 'amigo&' : 'rol=el&'}prueba${extra}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await p.waitForSelector('#menu:not([hidden]) #niveles .etiqueta', { timeout: 240000 });
  return p;
}

/** Nada personal de la pareja en la pantalla (texto, títulos y lo que se dibujó en los lienzos 2D). */
async function sinNadaPersonal(p, momento) {
  const texto = await p.evaluate(() => [
    document.body.innerText, document.title,
    ...[...document.querySelectorAll('[title],[aria-label]')].map((e) => `${e.getAttribute('title') ?? ''} ${e.getAttribute('aria-label') ?? ''}`),
    ...(window.__dibujados ?? []),
  ].join('\n'));
  const hallado = buscarPersonal(texto, PALABRAS_PAREJA);
  revisar(!hallado.length, `${p.nombre} no ve nada personal: ${momento}${hallado.length ? ` (${hallado.join(' | ')})` : ''}`);
}

// 1. Los celulares (el anfitrión con el piloto automático para que el día pase rápido)
const anfitrion = await celular('Pipe (anfitrión)', AMIGOS[0], '&bot&rapido=6');
const invitados = [];
invitados.push(await celular('Javier', null));
if (cuantos >= 3) invitados.push(await celular('Caro', AMIGOS[1]));
if (cuantos >= 4) invitados.push(await celular('Tato', AMIGOS[2]));
const todos = [anfitrion, ...invitados];
for (const p of todos) {
  // Lo que se escribe en los lienzos 2D (pantalla de carga, efectos) también cuenta
  await p.evaluate(() => {
    window.__dibujados = [];
    const orig = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (t, ...r) {
      if (window.__dibujados.length < 400) window.__dibujados.push(String(t));
      return orig.call(this, t, ...r);
    };
  });
}
await sinNadaPersonal(anfitrion, 'menú del súper');
const menu = await anfitrion.evaluate(() => ({ casa: document.getElementById('btn-casa').textContent, linea: document.getElementById('btn-modo-linea').hidden }));
revisar(/sala de juegos/.test(menu.casa) && menu.linea, `El amigo no ve «En línea» ni la casa («${menu.casa}»)`);

// 2. El anfitrión abre la sala desde la tarjeta del día
await anfitrion.click('#niveles .etiqueta:nth-child(1)');
await anfitrion.click('#btn-modo-sala');
await anfitrion.screenshot({ path: `${carpeta}/1-tarjeta-sala.png` });
await anfitrion.click('#btn-abrir');
await anfitrion.waitForSelector('.sala-espera.visible .se-codigo', { timeout: 60000 });
const codigo = (await anfitrion.textContent('.sala-espera .se-codigo')).replace(/\s/g, '');
revisar(/^[A-Z2-9]{5}$/.test(codigo), `La sala tiene código (${codigo})`);

// 3. Los demás entran con el código (botón «Unirme con código» del menú)
for (const p of invitados) {
  await p.click('#btn-unirme');
  await p.fill('#codigo-input', codigo.toLowerCase());
  await p.click('#codigo-form .boton-tomate');
  await p.waitForSelector('.sala-espera.visible .se-puesto.yo', { timeout: 60000 });
}
await anfitrion.waitForFunction((n) => document.querySelectorAll('.sala-espera .se-puesto:not(.vacio)').length === n, todos.length, { timeout: 60000 });
revisar(true, `Entraron los ${todos.length} a la sala`);
// Javier, con amigos en la sala, ya está en modo neutro
revisar(await invitados[0].evaluate(() => document.body.classList.contains('neutro')), 'Javier queda en modo neutro con amigos en la sala');
// El anfitrión escoge el día 2 (el único otro abierto es el 1: se queda en el 1)
await anfitrion.click('.sala-espera [data-x="dia"]');
await anfitrion.waitForSelector('.dia-sala', { timeout: 10000 });
await anfitrion.screenshot({ path: `${carpeta}/2-escoger-dia.png` });
await anfitrion.click('.dia-sala [data-cerrar]');
for (const p of invitados) await p.tap('.sala-espera [data-a="principal"]', { force: true });
await anfitrion.waitForSelector('.sala-espera [data-a="principal"]:not([disabled])', { timeout: 60000 });
await anfitrion.screenshot({ path: `${carpeta}/3-sala-lista.png` });
await invitados[0].screenshot({ path: `${carpeta}/3-sala-javier.png` });
for (const p of todos) await sinNadaPersonal(p, 'sala de espera');
await anfitrion.tap('.sala-espera [data-a="principal"]', { force: true });

// 4. El día arranca en todos
await Promise.all(todos.map((p) => p.waitForFunction(() => !document.getElementById('hud').hidden && document.getElementById('sala').hidden, null, { timeout: 180000 })));
revisar(true, 'El día arrancó en todos los celulares');
const estado = await anfitrion.evaluate(() => window.__estado());
revisar(estado.jugadores.length === todos.length, `En la tienda hay ${estado.jugadores.length} personajes: ${estado.jugadores.map((j) => j.rol).join(', ')}`);
// Un invitado se mueve con su joystick (teclado) y el anfitrión lo ve (los navegadores de prueba van lentos: se
// sostiene la tecla hasta que el anfitrión lo vea moverse, máximo 25 s)
const quien = invitados[invitados.length - 1];
const nombreQuien = quien.nombre;
const posDe = async () => (await anfitrion.evaluate(() => window.__estado())).jugadores.find((j) => j.rol === nombreQuien)?.pos;
// (el piloto del anfitrión no le pone tareas a los demás mientras tanto)
await anfitrion.evaluate(() => (window.__soloAnfitrion = true));
const antes = await posDe();
await quien.keyboard.down('KeyA');
let movio = 0;
for (let t0 = Date.now(); Date.now() - t0 < 25000 && movio < 0.4; ) {
  await espera(700);
  const p = await posDe();
  movio = antes && p ? Math.hypot(p.x - antes.x, p.y - antes.y) : 0;
}
await quien.keyboard.up('KeyA');
await anfitrion.evaluate(() => (window.__soloAnfitrion = false));
revisar(movio > 0.4, `${nombreQuien} se movió con su joystick y el anfitrión lo vio (${movio.toFixed(2)} m)`);
await Promise.all(todos.map((p, k) => p.screenshot({ path: `${carpeta}/4-jugando-${k}.png` })));
for (const p of todos) await sinNadaPersonal(p, 'jugando');

// 5. A Javier se le corta el internet: el día se pausa para todos hasta que vuelve
red.cortar(invitados[0], true);
await anfitrion.waitForFunction(() => !document.getElementById('pausa').hidden && /Se cortó la conexión/.test(document.getElementById('pausa-nota').textContent), null, { timeout: 30000 }).catch(() => {});
const nota = await anfitrion.evaluate(() => document.getElementById('pausa-nota').textContent);
revisar(/Se cortó la conexión con Javier/.test(nota), `Al anfitrión le sale la pausa («${nota}»)`);
await anfitrion.screenshot({ path: `${carpeta}/5-corte.png` });
red.cortar(invitados[0], false);
await anfitrion.waitForFunction(() => document.getElementById('pausa').hidden, null, { timeout: 30000 }).catch(() => {});
revisar(await anfitrion.evaluate(() => document.getElementById('pausa').hidden), 'Javier volvió y el día siguió solo');

// 6. Termina el día (se adelanta el reloj del anfitrión: tres navegadores con WebGL por software van muy lentos)
await anfitrion.evaluate(() => {
  const j = window.__juego();
  j.tiempo = Math.max(j.tiempo, j.nivel.duracion_s + 36);
});
await Promise.all(todos.map((p) => p.waitForSelector('#resultado:not([hidden])', { timeout: 300000 })));
await espera(1500);
await Promise.all(todos.map((p, k) => p.screenshot({ path: `${carpeta}/6-tiquete-${k}.png` })));
const tiquetes = await Promise.all(todos.map((p) => p.evaluate(() => document.getElementById('rec-total').textContent)));
revisar(new Set(tiquetes).size === 1, `Todos ven la misma ganancia (${tiquetes.join(' / ')})`);
for (const p of todos) await sinNadaPersonal(p, 'tiquete');
for (const [k, p] of todos.entries()) {
  const g = await p.evaluate(() => ({
    amigo: localStorage.getItem('amigo-supermania'), pareja: localStorage.getItem('supermania-jugable1'), sueldo: localStorage.getItem('nuestro-hogar-sueldo'),
    sala: !document.getElementById('btn-rsala').hidden, sueldoVisible: !document.getElementById('rec-sueldo').hidden,
  }));
  const esAmigo = p !== invitados[0];
  revisar(g.sala, `${p.nombre}: el tiquete ofrece «Volver a la sala»`);
  if (esAmigo) revisar(!!g.amigo && !g.pareja && !g.sueldo && !g.sueldoVisible, `${p.nombre}: guarda su progreso aparte y no le paga sueldo a ninguna casa`);
  else revisar(!!g.pareja && !g.amigo, `${p.nombre}: guarda en la partida de la pareja`);
  if (k === 0) console.log('      estrellas del anfitrión:', JSON.parse(g.amigo ?? '{}').estrellas);
}

// 7. Todos vuelven a la sala de espera
for (const p of todos) await p.click('#btn-rsala');
await Promise.all(todos.map((p) => p.waitForSelector('.sala-espera.visible', { timeout: 30000 })));
revisar(true, 'Todos volvieron a la sala de espera');
await espera(800);
await anfitrion.screenshot({ path: `${carpeta}/7-de-vuelta.png` });

// 8. El anfitrión se va: a los demás se les acaba la sala con un aviso y vuelven a su menú
await anfitrion.click('.sala-espera [data-a="salir"]');
await Promise.all(invitados.map((p) => p.waitForSelector('#menu:not([hidden])', { timeout: 90000 })));
revisar(true, 'Al irse el anfitrión, los demás vuelven a su menú');
await invitados[0].screenshot({ path: `${carpeta}/8-fin-sala.png` });
revisar(!(await invitados[0].evaluate(() => document.body.classList.contains('neutro'))), 'Javier sale del modo neutro al dejar la sala');

console.log(errores.length ? `ERRORES:\n${errores.join('\n')}` : 'Sin errores');
await navegador.close();
process.exit(errores.length ? 1 : 0);
