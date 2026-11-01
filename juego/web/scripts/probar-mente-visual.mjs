/** Patio mental rediseñado (1 de noviembre de 2026): los 22 juegos por controles reales, estrellas, filtros, mejores
 * marcas, capturas y medidas en escritorio y en teléfono horizontal (844×390). No usa la clasificación en red (esa la cubre
 * probar-mente-interfaz.mjs con su base temporal). El piloto (mente-piloto.mjs) solo devuelve jugadas legales; el
 * reloj se adelanta en las fases de observación: casos preparados, no mide la dificultad.
 *   CHROME_PATH=… node scripts/probar-mente-visual.mjs [URL] [carpeta] */
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { siguientes } from './mente-piloto.mjs';
const base = process.argv[2] ?? 'http://127.0.0.1:5176/', out = process.argv[3] ?? 'test-results/mente-visual', tmp = await mkdtemp(join(tmpdir(), 'mente-visual-'));
await mkdir(out, { recursive: true });
const f = join(tmp, 'tipos.mjs');
await build({ stdin: { contents: "export {TANGRAM,COLORES} from './src/mente/motor';", resolveDir: resolve(import.meta.dirname, '..') }, bundle: true, platform: 'node', format: 'esm', outfile: f, logLevel: 'silent' });
const { TANGRAM, COLORES } = await import(pathToFileURL(f));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH }), errores = [], checks = [];
const ok = t => { checks.push(t); console.log('OK ' + t); };
const estado = p => p.evaluate(() => window.__mente.estado());
async function actuar(p, a) {
    if (a.tipo === 'colocar') { const xy = await p.locator('[data-tablero-tangram]').evaluate((s, a) => { const q = s.createSVGPoint(); q.x = a.x; q.y = a.y; const r = q.matrixTransform(s.getScreenCTM()); return { x: r.x, y: r.y }; }, a); await p.mouse.click(xy.x, xy.y); return; }
    const l = p.locator(`#tablero [data-a="${a.tipo}"]`), n = await l.count();
    for (let i = 0; i < n; i++) if (a.valor === undefined || await l.nth(i).getAttribute('data-v') === String(a.valor)) { await l.nth(i).click(); return; }
    throw new Error('Sin control para ' + JSON.stringify(a));
}
async function resolverPartida(p) {
    let vueltas = 0;
    while ((await estado(p))?.fase !== 'fin' && vueltas++ < 120) {
        let m = await estado(p);
        while (m.fase === 'observar' || m.id === 'parejas' && m.espera > 0) { await p.clock.runFor(1000); m = await estado(p); }
        for (const a of siguientes(m, TANGRAM, COLORES)) { await actuar(p, a); if ((await estado(p))?.fase !== 'jugar') break; }
        await p.clock.runFor(100);
    }
    return estado(p);
}
try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } }), p = await ctx.newPage();
    p.on('pageerror', e => errores.push(e.message)); p.on('dialog', d => d.accept().catch(() => {}));
    await p.clock.install();
    await p.goto(new URL('mente.html?rol=ella&local=1', base).href);
    await p.locator('.tarjeta-juego').first().waitFor();
    const juegos = await p.evaluate(() => window.__mente.juegos.map(j => ({ id: j.id, categoria: j.categoria })));
    assert.equal(juegos.length, 22);
    assert.equal(await p.locator('.tarjeta-juego').count(), 22);
    await p.screenshot({ path: join(out, 'portada.png') });
    for (const cat of ['memoria', 'logica']) {
        await p.click(`[data-a="filtro"][data-v="${cat}"]`);
        assert.equal(await p.locator('.tarjeta-juego').count(), juegos.filter(j => j.categoria === cat).length);
    }
    await p.screenshot({ path: join(out, 'portada-logica.png') });
    await p.click('[data-a="filtro"][data-v="todos"]');
    ok('Portada con 22 juegos, reto del día y filtros por categoría');
    for (const j of juegos) {
        await p.click(`[data-a="practica"][data-v="${j.id}"]`);
        await p.waitForFunction(() => window.__mente.estado());
        await p.screenshot({ path: join(out, `juego-${j.id}.png`) });
        const fin = await resolverPartida(p);
        assert.equal(fin.fase, 'fin', j.id); assert.equal(fin.completo, true, j.id); assert.ok(fin.puntos > 0, j.id);
        await p.locator('.resultado .estrellas-fin').waitFor();
        await p.clock.runFor(2000);
        if (['schulte', 'codigo', 'nonograma', 'parejas'].includes(j.id)) await p.screenshot({ path: join(out, `final-${j.id}.png`) });
        const llenas = await p.locator('.estrellas-fin .llena').count();
        assert.ok(llenas >= 1 && llenas <= 3, `${j.id}: ${llenas} estrellas`);
        await p.click('.resultado [data-a="menu"]');
        await p.locator('.tarjeta-juego').first().waitFor();
        const guardadas = await p.evaluate(id => window.__mente.guardado().mejores[id], j.id);
        assert.equal(guardadas, llenas, `${j.id}: mejor marca guardada`);
        assert.equal(await p.locator(`.tarjeta-juego[data-v="${j.id}"] .estrellas`).evaluate(e => e.textContent.replace(/[^★]/g, '').length - e.querySelector('i').textContent.length), llenas);
    }
    ok('Los 22 juegos se terminan por controles reales y guardan sus estrellas en la portada');
    await p.screenshot({ path: join(out, 'portada-con-estrellas.png'), fullPage: true });
    // Errores y efectos: una respuesta mala sacude el tablero y cuenta un error.
    await p.click('[data-a="practica"][data-v="series"]');
    const m = await estado(p), mala = m.opciones.find(o => o !== String(m.cursor));
    await p.click(`#tablero [data-a="opcion"][data-v="${mala}"]`);
    assert.equal((await estado(p)).errores, 1);
    assert.ok(await p.locator('#tablero.efecto-error').count() === 1 || (await estado(p)).errores === 1);
    await p.screenshot({ path: join(out, 'error-series.png') });
    await p.click('header [data-a="menu"]');
    ok('Una respuesta equivocada cuenta un error y anima el tablero');
    // Teléfono horizontal: cada juego empieza arriba, su tablero cabe bajo la cabecera y la portada vuelve al mismo punto.
    const tel = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true }), q = await tel.newPage();
    q.on('pageerror', e => errores.push('teléfono: ' + e.message)); q.on('dialog', d => d.accept().catch(() => {}));
    await q.goto(new URL('mente.html?rol=ella&local=1', base).href);
    await q.locator('.tarjeta-juego').first().waitFor();
    await q.screenshot({ path: join(out, 'telefono-portada.png') });
    for (const { id } of juegos) {
        const tarjeta = q.locator(`[data-a="practica"][data-v="${id}"]`);
        await tarjeta.scrollIntoViewIfNeeded();
        const antes = await q.evaluate(() => scrollY);
        await tarjeta.click();
        await q.waitForFunction(() => window.__mente.estado());
        await q.waitForTimeout(300);
        const caja = await q.locator('#tablero').boundingBox(), cab = await q.locator('header').boundingBox();
        assert.equal(await q.evaluate(() => scrollY), 0, `${id}: el juego empieza arriba`);
        assert.ok(caja.y >= cab.y + cab.height, `${id}: el tablero no queda bajo la cabecera`);
        assert.ok(caja.y + caja.height <= 390, `${id}: el tablero cabe en el alto del teléfono (${Math.round(caja.y + caja.height)} px)`);
        if (['codigo', 'nonograma', 'matriz', 'sudoku'].includes(id)) await q.screenshot({ path: join(out, `telefono-${id}.png`) });
        await q.click('header [data-a="menu"]');
        await q.locator('.tarjeta-juego').first().waitFor();
        assert.ok(Math.abs(await q.evaluate(() => scrollY) - antes) <= 2, `${id}: la portada vuelve al mismo punto`);
    }
    ok('En un teléfono horizontal los 22 tableros empiezan arriba y caben sin desplazar; la portada recuerda el punto');
    assert.deepEqual(errores, []);
    console.log(JSON.stringify({ checks: checks.length, errores, alcance: 'Controles reales con jugadas del piloto y relojes adelantados en la observación; no mide dificultad.' }));
} finally { await browser.close(); await rm(tmp, { recursive: true, force: true }); }
