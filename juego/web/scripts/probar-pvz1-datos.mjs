/** PvZ 1 (PvZ-Portable) con sus datos remotos fijados por commit: descarga main.pak y properties sin pedir
 * archivos, los conserva en el dispositivo y arranca el juego real hasta dibujar su pantalla.
 *   node scripts/probar-pvz1-datos.mjs [URL base] [carpeta de salida]   (requiere Vite y red) */
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const base = process.argv[2] ?? 'http://localhost:5176/', out = path.resolve(process.argv[3] ?? 'test-results/pvz1-datos');
fs.mkdirSync(out, {recursive: true});
const px = process.env.HTTPS_PROXY;
const browser = await chromium.launch({executablePath: process.env.CHROME_PATH || undefined, proxy: px ? {server: px, bypass: 'localhost,127.0.0.1'} : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-certificate-errors']});
const contexto = await browser.newContext({viewport: {width: 1100, height: 650}, ignoreHTTPSErrors: true}), page = await contexto.newPage(), checks = [], errores = [];
page.on('pageerror', e => errores.push(e.message));
const consola = [];
page.on('console', m => consola.push(m.type() + ' ' + m.text().slice(0, 300)));
const ok = t => { checks.push(t); console.log('OK ' + t); };
const marco = () => page.frames().find(f => f.url().includes('/motores/pvz1/'));
const esperarMarco = async () => { for (let i = 0; i < 240 && !marco(); i++) await page.waitForTimeout(500); assert.ok(marco(), 'marco de PvZ 1: ' + page.frames().map(f => f.url()).join(' ')); return marco(); };
try {
    await page.goto(new URL('jardin.html?modo=pvz1&local=1', base).href);
    await page.waitForFunction(() => !!document.querySelector('iframe'), null, {timeout: 60000});
    await page.waitForFunction(() => document.querySelector('iframe')?.contentWindow?.document?.readyState === 'complete', null, {timeout: 120000});
    await (await esperarMarco()).waitForFunction(() => typeof collectedFiles !== 'undefined' && collectedFiles.has('main.pak'), null, {timeout: 600000, polling: 2000});
    const archivos = await (await esperarMarco()).evaluate(() => [...collectedFiles.entries()].map(([k, v]) => [k, v.size]));
    assert.ok(archivos.some(([k, n]) => k === 'main.pak' && n > 20e6), JSON.stringify(archivos));
    assert.ok(archivos.some(([k]) => k === 'properties/resources.xml'));
    ok('Descarga main.pak y properties del repositorio fijado sin pedir archivos al usuario');
    await page.waitForTimeout(3000);
    // Al volver a abrir, los recursos salen del dispositivo (IndexedDB), no de la red.
    let descargas = 0;
    page.on('request', r => { if (r.url().includes('PlantsVsZombies-decompilation')) descargas++; });
    await page.reload();
    await page.waitForFunction(() => document.querySelector('iframe')?.contentWindow?.document?.readyState === 'complete', null, {timeout: 120000});
    await (await esperarMarco()).waitForFunction(() => typeof collectedFiles !== 'undefined' && collectedFiles.has('main.pak'), null, {timeout: 120000, polling: 1000});
    assert.equal(descargas, 0, 'no vuelve a descargar');
    ok('Al reabrir usa los recursos guardados en el dispositivo');
    await (await esperarMarco()).evaluate(() => window.moduleReadyPromise);
    // Como la persona: pulsa «¡A jugar!» en la pantalla del juego.
    await (await esperarMarco()).click('#drop-zone', {position: {x: 60, y: 30}});
    await (await esperarMarco()).waitForFunction(() => typeof gameStarted !== 'undefined' && gameStarted === true, null, {timeout: 120000});
    await page.waitForTimeout(30000);
    await page.screenshot({path: path.join(out, 'pvz1-juego.png'), timeout: 120000});
    fs.writeFileSync(path.join(out, 'consola.txt'), consola.join('\n'));
    const vista = await (await esperarMarco()).evaluate(() => { const c = document.querySelector('canvas'), r = c?.getBoundingClientRect(); return {lienzo: r ? [r.width, r.height] : null, subida: getComputedStyle(document.querySelector('#upload-screen')).display}; });
    fs.writeFileSync(path.join(out, 'consola.txt'), consola.join('\n'));
    assert.equal(vista.subida, 'none', 'la pantalla de recursos se oculta');
    assert.ok(vista.lienzo && vista.lienzo[0] > 300 && vista.lienzo[1] > 200, JSON.stringify(vista));
    ok('PvZ 1 arranca con los datos descargados y dibuja su pantalla');
    // Del título al menú y a la Aventura con clics sobre el lienzo (coordenadas del juego, 800×600).
    const tocar = async (x, y) => { const c = await (await esperarMarco()).evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }); const m = await page.$('iframe'), b = await m.boundingBox(); await page.mouse.click(b.x + c[0] + x / 800 * c[2], b.y + c[1] + y / 600 * c[3]); };
    await tocar(400, 560); await page.waitForTimeout(15000);
    await page.screenshot({path: path.join(out, 'pvz1-menu.png'), timeout: 120000});
    // Usuario nuevo (perfil temporal de la prueba) y Aventura.
    await page.keyboard.type('Prueba'); await tocar(280, 394); await page.waitForTimeout(8000);
    await tocar(566, 138); await page.waitForTimeout(45000);
    await page.screenshot({path: path.join(out, 'pvz1-aventura.png'), timeout: 120000});
    fs.writeFileSync(path.join(out, 'consola.txt'), consola.join('\n'));
    assert.ok(!consola.some(l => /FATAL|CppException|Failed to start/.test(l)), 'sin errores fatales del motor');
    assert.ok(await (await esperarMarco()).evaluate(() => gameStarted === true), 'el juego sigue abierto');
    ok('Del título pasa al menú, crea un usuario temporal y abre la Aventura sin errores fatales (revisar capturas)');
    assert.deepEqual(errores, []);
    console.log(JSON.stringify({checks: checks.length, errores}));
} finally { await browser.close(); }
