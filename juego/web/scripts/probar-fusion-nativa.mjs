/** Minijuego Fusión sobre Gardendless real (`jardin.html?modo=fusion`) y tarjetas de Minijuegos con su juego de
 * origen. Requiere Vite sirviendo el proyecto y los recursos remotos fijados de Gardendless.
 *   node scripts/probar-fusion-nativa.mjs [URL base] [carpeta de salida]
 * Siembra con el ratón: un lanzaguisantes y encima un girasol, que forman el Lanzasoles. No certifica balance. */
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const base = process.argv[2] ?? 'http://localhost:5176/', out = path.resolve(process.argv[3] ?? 'test-results/fusion-nativa');
fs.mkdirSync(out, {recursive: true});
const px = process.env.HTTPS_PROXY;
const browser = await chromium.launch({executablePath: process.env.CHROME_PATH || undefined, proxy: px ? {server: px, bypass: 'localhost,127.0.0.1'} : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
const checks = [], errores = [];
const ok = t => { checks.push(t); console.log('OK ' + t); };
try {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 720}}), p = await ctx.newPage();
    p.on('pageerror', e => errores.push(e.message));
    // Minijuegos: cada uno dice de qué juego viene.
    await p.goto(new URL('jardin.html?rol=ella&local=1', base).href);
    await p.click('[data-cq="biblioteca"]');
    await p.waitForSelector('.cq-biblioteca');
    const tarjetas = await p.$$eval('.cq-juego-carta', l => l.map(b => [b.dataset.cq, b.querySelector('.cq-juego-etiqueta').textContent]));
    const etiqueta = Object.fromEntries(tarjetas);
    assert.equal(etiqueta.pvz1, 'PvZ 1'); assert.equal(etiqueta.pvz2, 'PvZ 2'); assert.equal(etiqueta.fusion, 'PvZ Fusión');
    assert.ok(tarjetas.every(([, e]) => e.length > 0));
    await p.screenshot({path: path.join(out, 'minijuegos.png')});
    ok('Minijuegos muestra el juego de origen de cada uno (PvZ 1, PvZ 2, PvZ Fusión, propio)');
    await p.click('[data-cq="fusion"]');
    await p.waitForSelector('.fu-nivel', {timeout: 30000});
    await p.goto(new URL('jardin.html?modo=fusion&prueba', base).href);
    await p.waitForSelector('.fu-nivel', {timeout: 30000});
    assert.equal(await p.locator('.fu-nivel').count(), 12);
    assert.equal(await p.locator('.fu-nivel:disabled').count(), 11, 'solo el primer nivel abierto');
    await p.screenshot({path: path.join(out, 'niveles.png')});
    await p.click('[data-fu-nivel="0"]');
    await p.waitForSelector('.fu-recetas');
    assert.ok((await p.evaluate(() => window.__fusion.recetas())).includes('fus_sunshooter'), 'el mazo inicial trae la receta del Lanzasoles');
    await p.screenshot({path: path.join(out, 'preparar.png')});
    ok('Doce niveles (uno por mundo) y recetas posibles con el mazo elegido');
    await p.click('[data-fu="jugar"]');
    await p.waitForFunction(() => document.querySelector('.fu-capa')?.innerHTML === '', null, {timeout: 240000});
    const frame = p.frames().find(f => f.url().includes('pvz2/index.html'));
    const datos = (tipo, fila, col) => frame.evaluate(([tipo, fila, col]) => {
        const m = n => System.get(`chunks:///_virtual/${n}.ts`), s = m('Square').Square, c = m('Cards').Cards.component, canvas = cc.game.canvas, r = canvas.getBoundingClientRect();
        const cams = cc.director.getScene().getComponentsInChildren(cc.Camera).filter(k => k.enabledInHierarchy);
        const proyectar = n => { const cam = cams.find(k => (k.visibility & n.layer) !== 0); const q = cam.worldToScreen(n.worldPosition); return { x: r.left + q.x / canvas.width * r.width, y: r.top + (canvas.height - q.y) / canvas.height * r.height }; };
        const i = c.CFs.findIndex(x => x.Type === tipo);
        return { carta: proyectar(c.CFs[i].node), celda: proyectar(s.getLnC(fila, col).plantPoint), lista: !!c.CUs[i]?.selectable, sol: m('SunCount').SunCount.Value,
            plantas: m('CharacterManager').PlantPool.pool().filter(x => x.node?.isValid && x.health > 0).map(x => [x.Plant_Type, x.plantInLnC?.lIndex, x.plantInLnC?.cIndex]) };
    }, [tipo, fila, col]);
    const sembrar = async (tipo, fila, col) => {
        let d = await datos(tipo, fila, col);
        for (let i = 0; i < 80 && !(d.lista && d.sol >= 100); i++) {
            // Recoge los soles que caen (el piloto mueve el ratón sobre ellos, como la prueba de la historia).
            await p.waitForTimeout(500); d = await datos(tipo, fila, col);
        }
        assert.ok(d.lista, 'carta lista: ' + tipo);
        await p.mouse.click(d.carta.x, d.carta.y); await p.waitForTimeout(250); await p.mouse.click(d.celda.x, d.celda.y);
        await p.waitForTimeout(600);
        return datos(tipo, fila, col);
    };
    let d = await sembrar('peashooter', 2, 1);
    assert.ok(d.plantas.some(([t, f, c]) => t === 'peashooter' && f === 2 && c === 1), JSON.stringify(d.plantas));
    // Soles: el día da soles del cielo; se recogen pasando el ratón por encima.
    for (let i = 0; i < 60; i++) {
        const s = await frame.evaluate(() => { const m = n => System.get(`chunks:///_virtual/${n}.ts`), canvas = cc.game.canvas, r = canvas.getBoundingClientRect(); const cams = cc.director.getScene().getComponentsInChildren(cc.Camera).filter(k => k.enabledInHierarchy); return { sol: m('SunCount').SunCount.Value, soles: (m('Droppings').droppings.controller?.sunPool ?? []).filter(x => x.node?.isValid).map(x => { const cam = cams.find(k => (k.visibility & x.node.layer) !== 0); const q = cam.worldToScreen(x.node.worldPosition); return { x: r.left + q.x / canvas.width * r.width, y: r.top + (canvas.height - q.y) / canvas.height * r.height }; }) }; });
        if (s.sol >= 50) break;
        for (const q of s.soles) { await p.mouse.move(q.x, q.y); await p.waitForTimeout(120); }
        await p.waitForTimeout(500);
    }
    d = await sembrar('sunflower', 2, 1);
    assert.ok(d.plantas.some(([t, f, c]) => t === 'fus_sunshooter' && f === 2 && c === 1), 'girasol sobre lanzaguisantes forma el Lanzasoles: ' + JSON.stringify(d.plantas));
    await p.screenshot({path: path.join(out, 'fusion.png')});
    ok('Sembrar un girasol sobre un lanzaguisantes forma el Lanzasoles en el motor nativo');
    await p.click('[data-fu="recetas"]');
    await p.waitForSelector('.fu-panel');
    await p.click('.fu-panel [data-fu="pausa"]');
    await p.waitForFunction(() => document.querySelector('.fu-capa')?.innerHTML === '');
    p.once('dialog', dlg => dlg.accept());
    await p.click('[data-fu="salir"]');
    await p.waitForSelector('.fu-nivel');
    assert.equal(await p.evaluate(() => document.querySelectorAll('iframe').length), 0);
    ok('Recetas en pausa y salir del nivel liberan el tablero');
    assert.deepEqual(errores, []);
    console.log(JSON.stringify({checks: checks.length, errores}));
} finally { await browser.close(); }
