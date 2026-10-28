/** Versus de dos personas sobre Gardendless real (`jardin.html?modo=versus`). Requiere Vite sirviendo el proyecto y
 * acceso a los recursos remotos fijados de Gardendless. Las salas usan el modo local entre pestañas (BroadcastChannel).
 *   node scripts/probar-versus-nativo.mjs [URL base] [carpeta de salida]
 * Los cerebros añadidos y el reloj adelantado son casos preparados: comprueban reglas y resultados, no el balance. */
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const base = process.argv[2] ?? 'http://localhost:5176/', out = path.resolve(process.argv[3] ?? 'test-results/versus-nativo');
fs.mkdirSync(out, {recursive: true});
const px = process.env.HTTPS_PROXY;
const browser = await chromium.launch({executablePath: process.env.CHROME_PATH || undefined, proxy: px ? {server: px, bypass: 'localhost,127.0.0.1'} : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-certificate-errors']});
const checks = [], errores = [];
const ok = t => { checks.push(t); console.log('OK ' + t); };
const vigilar = (p, n) => p.on('pageerror', e => errores.push(n + ': ' + e.message));
const url = q => new URL('jardin.html?modo=versus&prueba' + q, base).href;
const listo = p => p.waitForFunction(() => window.__vs?.tablero(), null, {timeout: 300000, polling: 1000});
async function local(zona) {
    const ctx = await browser.newContext({viewport: {width: 1100, height: 620}, ignoreHTTPSErrors: true}), p = await ctx.newPage();
    vigilar(p, 'local');
    await p.goto(url(''));
    await p.click('[data-vs=local]');
    await p.click(`[data-zona="${zona}"]`);
    await p.click('[data-vs=jugar]');
    await listo(p);
    return {ctx, p};
}
try {
    {
        const {ctx, p} = await local(2);
        assert.equal(await p.locator('.vs-carril').count(), 5);
        const tops = await p.$$eval('.vs-carril', b => b.map(x => parseFloat(x.style.top)));
        assert.ok(tops.every((y, i) => !i || y > tops[i - 1]) && tops[0] > 20 && tops.at(-1) < 95, 'Flechas alineadas con las filas: ' + tops);
        await p.click('[data-zombi="tutorial"]'); await p.click('.vs-carril[data-fila="1"]');
        await p.click('[data-zombi="tutorial_armor1"]'); await p.click('.vs-carril[data-fila="2"]');
        await p.waitForTimeout(2500);
        const e = await p.evaluate(() => ({r: window.__vs.reglas().estado, z: window.__vs.tablero().zombis}));
        assert.ok(e.r.cerebros <= 50 && e.r.recargas.tutorial_armor1 > 0, JSON.stringify(e.r));
        assert.deepEqual(e.z.map(z => [z.tipo, z.fila]).sort(), [['tutorial', 1], ['tutorial_armor1', 2]]);
        assert.equal(await p.isDisabled('[data-zombi="tutorial_armor2"]'), true);
        await p.screenshot({path: path.join(out, 'local.png')});
        ok('En un dispositivo: cada zombi cuesta cerebros, se recarga y sale en el carril elegido del motor nativo');
        await p.evaluate(() => window.__vs.adelantar(400));
        await p.waitForFunction(() => window.__vs.ganador(), null, {timeout: 20000});
        assert.equal(await p.evaluate(() => window.__vs.ganador()), 'plantas');
        ok('Las plantas ganan cuando el reloj llega a cero sin que un zombi entre a la casa');
        await ctx.close();
    }
    {
        const {ctx, p} = await local(0);
        // Primero se gasta la podadora del carril y luego un segundo zombi llega a la casa.
        for (let i = 0; i < 2; i++) {
            if (i) await p.waitForTimeout(30000);
            await p.evaluate(() => { const r = window.__vs.reglas(); r.estado.cerebros = 999; r.estado.recargas = {}; });
            await p.waitForTimeout(300);
            await p.click('[data-zombi="modern_allstar"]'); await p.click('.vs-carril[data-fila="2"]');
        }
        await p.waitForFunction(() => window.__vs.ganador(), null, {timeout: 240000, polling: 1000});
        assert.equal(await p.evaluate(() => window.__vs.ganador()), 'zombis');
        await p.screenshot({path: path.join(out, 'zombis-ganan.png')});
        ok('Los zombis ganan cuando uno llega a la casa (la podadora nativa protege una vez por carril)');
        await ctx.close();
    }
    {
        const ctx = await browser.newContext({viewport: {width: 1000, height: 580}, ignoreHTTPSErrors: true}), A = await ctx.newPage(), B = await ctx.newPage();
        vigilar(A, 'anfitrion'); vigilar(B, 'invitado');
        await A.goto(url('&salas=local&rol=el')); await B.goto(url('&salas=local&rol=ella'));
        await A.click('[data-vs=crear]');
        await A.waitForSelector('.se-codigo', {timeout: 30000});
        const codigo = (await A.textContent('.se-codigo')).replace(/\s/g, '');
        await B.fill('input[name=codigo]', codigo); await B.click('.vs-unirse button');
        await B.waitForSelector('[data-a=principal]', {timeout: 30000}); await B.waitForTimeout(800); await B.$eval('[data-a=principal]', e => e.click());
        await A.waitForFunction(() => !document.querySelector('[data-a=principal]')?.disabled); await A.$eval('[data-a=principal]', e => e.click());
        await A.waitForSelector('[data-zona]', {timeout: 30000}); await A.click('[data-zona="5"]'); await A.click('[data-vs=jugar]');
        await B.waitForSelector('.vs-lienzo', {timeout: 60000});
        await listo(A); await B.waitForFunction(() => window.__vs?.tablero(), null, {timeout: 60000});
        assert.deepEqual([await A.evaluate(() => window.__vs.rol()), await B.evaluate(() => window.__vs.rol())], ['anfitrion', 'invitado']);
        assert.equal(await A.locator('[data-zombi]').count(), 0);
        await B.click('[data-zombi="tutorial"]'); await B.click('.vs-carril[data-fila="0"]');
        await B.waitForTimeout(500); await B.click('[data-zombi="tutorial_armor1"]'); await B.click('.vs-carril[data-fila="3"]');
        await A.waitForTimeout(5000);
        const za = await A.evaluate(() => window.__vs.tablero().zombis.map(z => z.tipo + ':' + z.fila).sort()), zb = await B.evaluate(() => window.__vs.tablero().zombis.map(z => z.tipo + ':' + z.fila).sort());
        assert.deepEqual(za, ['tutorial:0', 'tutorial_armor1:3']); assert.deepEqual(zb, za);
        assert.equal(await B.evaluate(() => window.__vs.reglas().estado.cerebros), await A.evaluate(() => window.__vs.reglas().estado.cerebros));
        await A.screenshot({path: path.join(out, 'sala-anfitrion.png')}); await B.screenshot({path: path.join(out, 'sala-invitado.png')});
        ok('En sala: el invitado manda zombis, el anfitrión los suelta en su motor y ambos ven el mismo tablero y cerebros');
        await B.click('[data-vs=pausa]'); await A.waitForTimeout(800);
        const t1 = await A.evaluate(() => window.__vs.reglas().estado.t); await A.waitForTimeout(1500);
        assert.equal(await A.evaluate(() => window.__vs.reglas().estado.t), t1);
        await B.click('[data-vs=pausa]'); await A.waitForTimeout(800);
        ok('La pausa pedida por el invitado detiene el reloj del anfitrión');
        await A.evaluate(() => window.__vs.adelantar(400));
        await B.waitForFunction(() => window.__vs.ganador(), null, {timeout: 20000});
        assert.deepEqual([await A.evaluate(() => window.__vs.ganador()), await B.evaluate(() => window.__vs.ganador())], ['plantas', 'plantas']);
        await A.click('[data-vs=otra]'); await B.waitForSelector('.vs-carga', {timeout: 10000});
        ok('El resultado llega a los dos y la revancha devuelve al invitado a la espera');
        await ctx.close();
    }
    assert.deepEqual(errores, []);
    console.log(JSON.stringify({checks: checks.length, errores, alcance: 'Casos preparados con reglas y motor reales; no certifican el balance del versus.'}));
} finally { await browser.close(); }
