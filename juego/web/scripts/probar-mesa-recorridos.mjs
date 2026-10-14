// Inicio → resultado → menú en cada juego de mesa. El piloto elige movimientos legales por el callback
// de entrada de la partida: comprueba integración, no la precisión física de tocar fichas con el dedo.
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const base = process.argv[2] ?? 'http://127.0.0.1:4182/';
const carpeta = resolve(process.argv[3] ?? 'test-results/mesa-recorridos');
mkdirSync(carpeta, { recursive: true });
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const resultados = [];
try {
  for (const id of ['dados', 'mancala', 'cajas', 'parchis', 'parchis2', 'clue']) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
    const p = await ctx.newPage(), errores = [];
    p.on('pageerror', e => errores.push(e.message));
    p.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errores.push(r.status() + ' ' + r.url()); });
    const url = new URL('mesa.html', base);
    url.search = new URLSearchParams({ juego: id, modo: 'ia', rol: 'el', rapido: '40', sin3d: '1', semilla: '12345' }).toString();
    await p.goto(url.href);
    await p.waitForFunction(() => !!window.__mesa?.partida, null, { timeout: 120000 });
    const t0 = Date.now();
    while (!(await p.locator('#final').isVisible()) && Date.now() - t0 < 10 * 60000) {
      await p.evaluate(() => {
        document.querySelector('.clue-capa:not([hidden]) :is(.clue-hoja-cartas, .clue-hoja-revela) [data-ok]')?.click();
        const pt = window.__mesa.partida;
        if (!pt?.esperando) return;
        const m = pt.juego.ia(pt.e, 'normal', Math.random);
        const jugar = pt.esperando;
        pt.esperando = null;
        jugar(m);
      });
      await p.waitForTimeout(25);
    }
    assert.ok(await p.locator('#final').isVisible(), `${id}: la partida no terminó`);
    const fin = await p.evaluate(() => {
      const pt = window.__mesa.partida;
      return pt.juego.reglas.fin(pt.e);
    });
    assert.ok(fin);
    await p.screenshot({ path: resolve(carpeta, id + '-final.png') });
    await p.locator('#btn-menu').click();
    await p.locator('#menu').waitFor({ state: 'visible' });
    assert.deepEqual(errores, [], `${id}: errores de ejecución`);
    resultados.push({ id, fin, segundos: Math.round((Date.now() - t0) / 1000), errores });
    console.log(`OK ${id}: inicio → resultado → menú (${resultados.at(-1).segundos}s)`);
    await ctx.close();
  }
} finally {
  writeFileSync(resolve(carpeta, 'resultados.json'), JSON.stringify({ resultados, alcance: 'Integración del motor con piloto; sin pruebas físicas de controles ni red.' }, null, 2));
  await browser.close();
}
