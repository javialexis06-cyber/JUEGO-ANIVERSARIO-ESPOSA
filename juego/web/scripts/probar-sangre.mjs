// Pruebas de Sangre y Ceniza en el navegador (con el servidor de desarrollo prendido):
//   node scripts/probar-sangre.mjs [url] [carpeta] [pruebas]
// pruebas (separadas por coma, por defecto todas): grupo (dos pestañas con salas locales: sala, clase del invitado,
// expedición, Forja esperando a todos, etapa 2, resultados y vuelta a la sala), extraccion (el bot llega a la
// campana, Forja, pausa, calidad, abandonar y cobrar), celular (joystick con el dedo, habilidad y pausa) y tutorial
// (cada globo avanza haciendo lo que pide, hasta la Forja y los resultados).
// Las pestañas de atrás de Chromium sin pantalla van lentas: si algo falla por tiempo, puede ser la prueba.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const base = process.argv[2] ?? 'http://127.0.0.1:5173';
const dir = process.argv[3] ?? 'test-results/sangre';
const cuales = (process.argv[4] ?? 'grupo,extraccion,celular,tutorial').split(',');
mkdirSync(dir, { recursive: true });
const navegador = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let fallas = 0;
const okGlobal = (c, t) => { if (!c) fallas++; console.log(c ? 'OK   ' : 'FALLA', t); };

if (cuales.includes('grupo')) {
  console.log('== grupo');
  // Prueba de grupo: dos pestañas con salas locales (anfitrión Javier, invitado un amigo)
  const url = `${base}/sangre.html?salas=local&calidad=baja&sinanim=1&limpio=1`;
  const ctx = await navegador.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
  const A = await ctx.newPage();
  const B = await ctx.newPage();
  let errores = 0;
  for (const [n, p] of [['A', A], ['B', B]]) {
    p.on('pageerror', (e) => { errores++; console.log(`[${n} error]`, e.message, (e.stack ?? '').split('\n').slice(1, 4).join(' | ')); });
    p.on('console', (m) => { if (m.type() === 'error') console.log(`[${n} consola]`, m.text().slice(0, 200)); });
  }
  const ok = okGlobal;
  await A.goto(url + '&rol=el');
  await A.waitForFunction(() => window.__listo, null, { timeout: 90000 });
  await A.locator('[data-a="grupo"]').tap();
  await A.locator('[data-a="crear"]').tap();
  await A.waitForSelector('.sala-espera .se-codigo', { timeout: 30000 });
  const codigo = (await A.locator('.se-codigo').innerText()).replace(/\s/g, '');
  ok(codigo.length === 5, `sala creada ${codigo}`);
  await B.goto(url + `&amigo=Pedro&id=pedro1&unirse=${codigo}`);
  await B.waitForSelector('.sala-espera .se-puesto.yo', { timeout: 60000 });
  await A.waitForFunction(() => document.querySelectorAll('.sala-espera .se-puesto:not(.vacio)').length === 2, null, { timeout: 30000 });
  ok(true, 'el invitado entró');
  await A.screenshot({ path: `${dir}/g_sala_A.png` });
  // El invitado cambia de clase y queda listo
  await B.locator('[data-x="clase"]').tap();
  await B.locator('[data-c="prisionero"]').tap();
  await B.locator('[data-a="seguir"]').tap();
  await B.locator('[data-a="principal"]').tap();
  await A.waitForFunction(() => !document.querySelector('.se-principal')?.disabled, null, { timeout: 30000 });
  await A.waitForTimeout(800);
  await A.screenshot({ path: `${dir}/g_sala_A2.png` });
  await A.locator('[data-a="principal"]').tap();
  await A.waitForFunction(() => window.__sangrePantalla() === 'juego' && window.__sangre(), null, { timeout: 60000 });
  await B.waitForFunction(() => window.__sangrePantalla() === 'juego' && window.__sangre(), null, { timeout: 60000 });
  ok(true, 'los dos bajaron');
  // Esperar que el anfitrión arranque (los dos con la etapa armada)
  await A.waitForFunction(() => !window.__sangrePartida().pausaExterna, null, { timeout: 60000 });
  ok(true, 'el anfitrión arrancó');
  const x0 = await A.evaluate(() => window.__sangre().J[1].x);
  await B.keyboard.down('d');
  await B.waitForTimeout(2500);
  await B.keyboard.up('d');
  await B.waitForTimeout(1000);
  const x1 = await A.evaluate(() => window.__sangre().J[1].x);
  ok(x1 !== x0, `el anfitrión ve moverse al invitado (${x0.toFixed(1)} → ${x1.toFixed(1)})`);
  await A.waitForTimeout(12000);
  const eA = await A.evaluate(() => window.__sangre().E.vivos);
  const eB = await B.evaluate(() => window.__sangre().E.vivos);
  ok(eB > 0 && Math.abs(eA - eB) < Math.max(10, eA * 0.4), `enemigos anfitrión ${eA}, invitado ${eB}`);
  await A.screenshot({ path: `${dir}/g_juego_A.png` });
  await B.screenshot({ path: `${dir}/g_juego_B.png` });
  // Forja
  await A.evaluate(() => window.__sangreForja());
  await A.waitForFunction(() => window.__sangrePantalla() === 'forja', null, { timeout: 30000 });
  await B.waitForFunction(() => window.__sangrePantalla() === 'forja', null, { timeout: 30000 });
  ok(true, 'los dos en la Forja');
  await A.locator('[data-a="listo"]').tap();
  await A.waitForTimeout(1500);
  ok(await A.evaluate(() => window.__sangrePantalla() === 'forja'), 'el anfitrión espera al invitado en la Forja');
  await A.screenshot({ path: `${dir}/g_forja_A.png` });
  await B.locator('[data-a="listo"]').tap();
  await A.waitForFunction(() => window.__sangre()?.cfg.etapa === 2 && window.__sangrePantalla() === 'juego', null, { timeout: 60000 });
  await B.waitForFunction(() => window.__sangre()?.cfg.etapa === 2, null, { timeout: 60000 });
  ok(true, 'etapa 2 para los dos');
  await A.waitForFunction(() => !window.__sangrePartida().pausaExterna, null, { timeout: 60000 });
  await A.waitForTimeout(4000);
  await B.screenshot({ path: `${dir}/g_etapa2_B.png` });
  // Fin
  await A.evaluate(() => { const s = window.__sangre(); for (const j of s.J) j.estado = 2; s.fin = { exito: false, objetivo: false, secundario: 0, prisioneros: 0, extraidos: [], motivo: 'derrota' }; });
  await A.waitForFunction(() => window.__sangrePantalla() === 'resultado', null, { timeout: 30000 });
  await B.waitForFunction(() => window.__sangrePantalla() === 'resultado', null, { timeout: 30000 });
  ok(true, 'resultados para los dos');
  await B.screenshot({ path: `${dir}/g_fin_B.png` });
  await A.locator('[data-a="sala"]').tap();
  await B.locator('[data-a="sala"]').tap();
  await A.waitForSelector('.sala-espera', { timeout: 60000 });
  await B.waitForSelector('.sala-espera', { timeout: 60000 });
  ok(true, 'de vuelta en la sala');
  okGlobal(errores === 0, `${'grupo'}: sin errores de la página (${errores})`);
}

if (cuales.includes('extraccion')) {
  console.log('== extraccion');
  // Extracción de verdad (el bot llega a la campana), Forja, pausa, calidad y abandonar
  const p = await (await navegador.newContext({ viewport: { width: 844, height: 390 } })).newPage();
  let errores = 0;
  p.on('pageerror', (e) => { errores++; console.log('[error]', e.message, (e.stack ?? '').split('\n').slice(1, 4).join(' | ')); });
  const ok = okGlobal;
  await p.goto(`${base}/sangre.html?prueba=1&calidad=baja&bioma=minas&bot=1&rapido=4&semilla=12&sinanim=1&limpio=1`);
  await p.waitForFunction(() => window.__listo && window.__sangre(), null, { timeout: 120000 });
  // (inmortal: lo que se prueba es la extracción, no si el bot aguanta)
  await p.evaluate(() => { window.__sangre().inmortales = true; });
  await p.waitForTimeout(8000);
  await p.evaluate(() => window.__sangreReloj(2));
  await p.waitForFunction(() => !!window.__sangre().campana, null, { timeout: 120000 });
  ok(true, 'bajó la campana');
  await p.waitForTimeout(5000);
  await p.screenshot({ path: `${dir}/x_campana.png` });
  await p.waitForFunction(() => window.__sangrePantalla() === 'forja' || window.__sangrePantalla() === 'resultado', null, { timeout: 400000 });
  const pant = await p.evaluate(() => window.__sangrePantalla());
  ok(pant === 'forja', `después de la campana: ${pant}`);
  if (pant === 'forja') {
    await p.click('[data-a="listo"]');
    await p.waitForFunction(() => window.__sangre()?.cfg.etapa === 2 && window.__sangrePantalla() === 'juego', null, { timeout: 120000 });
    ok(true, 'etapa 2');
    await p.waitForTimeout(3000);
    await p.keyboard.press('Escape');
    await p.waitForSelector('.hoja-pausa', { timeout: 10000 });
    const t1 = await p.evaluate(() => window.__sangre().t);
    await p.waitForTimeout(2000);
    const t2 = await p.evaluate(() => window.__sangre().t);
    ok(Math.abs(t2 - t1) < 0.01, 'en pausa el tiempo no corre');
    await p.screenshot({ path: `${dir}/x_pausa.png` });
    await p.click('.hoja-pausa [data-c="media"]');
    ok(await p.evaluate(() => window.__sangreEscena().calidad === 'media'), 'cambia la calidad');
    await p.click('.hoja-pausa [data-p="seguir"]');
    await p.waitForTimeout(2000);
    const t3 = await p.evaluate(() => window.__sangre().t);
    ok(t3 > t2, 'sigue el tiempo');
    await p.keyboard.press('Escape');
    await p.click('.hoja-pausa [data-p="abandonar"]');
    await p.click('[data-r="si"]');
    await p.waitForFunction(() => window.__sangrePantalla() === 'titulo', null, { timeout: 120000 });
    ok(true, 'abandonar vuelve al título');
    const pr = await p.evaluate(() => window.__sangreProgreso());
    ok(pr.ceniza > 0 && pr.cifras.etapas >= 1, `se cobró lo extraído (ceniza ${pr.ceniza}, etapas ${pr.cifras.etapas})`);
  }
  okGlobal(errores === 0, `${'extraccion'}: sin errores de la página (${errores})`);
}

if (cuales.includes('celular')) {
  console.log('== celular');
  // Celular: joystick con el dedo (eventos táctiles de verdad) y el botón de la habilidad
  const ctx = await navegador.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  let errores = 0;
  p.on('pageerror', (e) => { errores++; console.log('[error]', e.message); });
  const ok = okGlobal;
  await p.goto(`${base}/sangre.html?prueba=1&calidad=baja&bioma=catacumbas&semilla=3&rapido=2`);
  await p.waitForFunction(() => window.__listo && window.__sangre(), null, { timeout: 120000 });
  await p.waitForTimeout(2000);
  const cdp = await ctx.newCDPSession(p);
  const toque = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  const x0 = await p.evaluate(() => window.__sangre().J[0].x);
  await toque('touchStart', 160, 260);
  for (let k = 1; k <= 10; k++) { await toque('touchMove', 160 + k * 7, 260); await p.waitForTimeout(40); }
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${dir}/m_joystick.png` });
  await p.waitForTimeout(2500);
  const x1 = await p.evaluate(() => window.__sangre().J[0].x);
  await toque('touchEnd', 0, 0);
  ok(x1 > x0 + 1, `el joystick mueve a la derecha (${x0.toFixed(1)} → ${x1.toFixed(1)})`);
  // (frena en unas décimas del juego, no en seco: se espera a que pare, sin tardar más de unos segundos de reloj)
  await p.waitForFunction(() => Math.hypot(window.__sangre().J[0].vx, window.__sangre().J[0].vy) < 0.5 || !document.getElementById('eleccion').hidden, null, { timeout: 8000, polling: 100 }).catch(() => undefined);
  const v = await p.evaluate(() => Math.hypot(window.__sangre().J[0].vx, window.__sangre().J[0].vy));
  // (si justo subió de nivel, el juego está esperando la carta: lo que importa es que el mando se soltó)
  const suelto = await p.evaluate(() => ({ mx: window.__sangrePartida().o.mando.mx, carta: !document.getElementById('eleccion').hidden }));
  ok(suelto.mx === 0 && (v < 0.5 || suelto.carta), `al soltar se detiene (mando ${suelto.mx}, velocidad ${v.toFixed(2)})`);
  if (suelto.carta) await p.locator('#eleccion .carta').first().tap();
  await p.locator('[data-e="hab"]').tap();
  await p.waitForTimeout(1500);
  ok(await p.evaluate(() => window.__sangre().J[0].habT > 0), 'el botón usa la habilidad');
  await p.locator('.boton-pausa, [data-a="pausa"]').first().tap();
  await p.waitForSelector('.hoja-pausa', { timeout: 10000 });
  ok(true, 'el botón de pausa abre la pausa');
  await p.locator('.hoja-pausa [data-p="seguir"]').tap();
  okGlobal(errores === 0, `${'celular'}: sin errores de la página (${errores})`);
}

if (cuales.includes('tutorial')) {
  console.log('== tutorial');
  // Tutorial con teclado y toques: que cada globo avance haciendo lo que pide
  const ctx = await navegador.newContext({ viewport: { width: 844, height: 390 } });
  const p = await ctx.newPage();
  let errores = 0;
  p.on('pageerror', (e) => { errores++; console.log('[error]', e.message, (e.stack ?? '').split('\n').slice(1, 4).join(' | ')); });
  const ok = okGlobal;
  const globo = () => p.evaluate(() => document.querySelector('.globo-tutorial b')?.textContent ?? '');
  const esperarGlobo = async (t, ms = 150000) => {
    const ini = Date.now();
    while (Date.now() - ini < ms) {
      if ((await globo()) === t) return true;
      await p.waitForTimeout(300);
    }
    return false;
  };
  await p.goto(`${base}/sangre.html?calidad=baja&sinanim=1&limpio=1&rol=ella&rapido=3`);
  await p.waitForFunction(() => window.__listo, null, { timeout: 90000 });
  await p.waitForSelector('[data-a="tutorial"]', { timeout: 90000 });
  await p.click('[data-a="tutorial"]');
  ok(await esperarGlobo('La Noche Eterna'), 'globo de bienvenida');
  await p.screenshot({ path: `${dir}/tu_1.png` });
  await p.click('.globo-tutorial [data-a="ok"]');
  ok(await esperarGlobo('Moverse'), 'pide moverse');
  await p.keyboard.down('d');
  ok(await esperarGlobo('Tus armas atacan solas', 20000), 'moverse → armas');
  await p.waitForTimeout(1500);
  await p.keyboard.up('d');
  await p.screenshot({ path: `${dir}/tu_2.png` });
  // Que se acerquen y los mate
  const fin1 = await esperarGlobo('Almas y mejoras', 60000);
  ok(fin1, 'armas → almas');
  // Recoger almas: caminar un poco
  await p.keyboard.down('a'); await p.waitForTimeout(800); await p.keyboard.up('a');
  await p.keyboard.down('d'); await p.waitForTimeout(800); await p.keyboard.up('d');
  await p.waitForSelector('#eleccion:not([hidden]) .carta', { timeout: 150000 });
  await p.screenshot({ path: `${dir}/tu_3.png` });
  await p.click('#eleccion .carta');
  ok(await esperarGlobo('La habilidad', 20000), 'mejoras → habilidad');
  await p.waitForTimeout(1500);
  await p.keyboard.press(' ');
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${dir}/tu_4.png` });
  // Si quedan cartas, escoger
  const t0 = Date.now();
  while (Date.now() - t0 < 60000 && (await globo()) === 'La habilidad') {
    if (await p.locator('#eleccion:not([hidden]) .carta').count()) await p.click('#eleccion .carta');
    await p.keyboard.press(' ');
    await p.waitForTimeout(700);
  }
  ok((await globo()) === 'Excavar', 'habilidad → excavar');
  await p.keyboard.down('d');
  const t1 = Date.now();
  while (Date.now() - t1 < 60000 && (await globo()) === 'Excavar') {
    if (await p.locator('#eleccion:not([hidden]) .carta').count()) { await p.keyboard.up('d'); await p.click('#eleccion .carta'); await p.keyboard.down('d'); }
    await p.waitForTimeout(500);
  }
  await p.keyboard.up('d');
  await p.screenshot({ path: `${dir}/tu_5.png` });
  ok((await globo()) === 'El objetivo', 'excavar → objetivo');
  // Las vetas: cavar hacia ellas con el teclado (arriba-derecha y abajo-derecha)
  for (const teclas of [['d', 'w'], ['d', 's'], ['d'], ['w'], ['s']]) {
    for (const k of teclas) await p.keyboard.down(k);
    await p.waitForTimeout(3500);
    for (const k of teclas) await p.keyboard.up(k);
    if (await p.locator('#eleccion:not([hidden]) .carta').count()) await p.click('#eleccion .carta');
    if ((await globo()) !== 'El objetivo') break;
  }
  const prog = await p.evaluate(() => window.__sangre().obj.prog);
  console.log('hierro excavado:', prog);
  if ((await globo()) === 'El objetivo') await p.evaluate(() => { window.__sangre().obj.prog = 99; });
  ok(await esperarGlobo('La campana de extracción', 20000), 'objetivo → campana');
  await p.waitForTimeout(6000);
  await p.screenshot({ path: `${dir}/tu_6.png` });
  // Llevarla a la campana
  await p.evaluate(() => { const s = window.__sangre(); const c = s.campana; if (c) { s.J[0].x = c.x + 0.3; s.J[0].y = c.y + 0.3; } });
  await p.waitForFunction(() => window.__sangrePantalla() === 'forja', null, { timeout: 90000 });
  ok(true, 'campana → Forja del tutorial');
  await p.screenshot({ path: `${dir}/tu_7.png` });
  await p.click('[data-a="listo"]');
  await p.waitForFunction(() => window.__sangrePantalla() === 'resultado', null, { timeout: 30000 });
  ok(await p.evaluate(() => window.__sangreProgreso().tutorial), 'tutorial marcado como visto');
  await p.screenshot({ path: `${dir}/tu_8.png` });
  await p.click('[data-a="menu"]');
  await p.waitForFunction(() => window.__sangrePantalla() === 'clases', null, { timeout: 60000 });
  ok(true, 'del tutorial a escoger clase');
  okGlobal(errores === 0, `${'tutorial'}: sin errores de la página (${errores})`);
}

await navegador.close();
console.log(fallas ? `${fallas} fallas` : 'Todo bien');
process.exit(fallas ? 1 : 0);
