// Vuelo desde progreso nuevo con el piloto normal: sin dios, saltos, rollitos regalados ni choque forzado.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const url = process.argv[2] ?? 'http://127.0.0.1:4182/';
const carpeta = process.argv[3] ?? 'test-results/retrete-recorrido';
await mkdir(carpeta, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
  const p = await ctx.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(e.message));
  await p.addInitScript(() => {
    if (!localStorage.getItem('nuestro-hogar-amigo')) localStorage.setItem('nuestro-hogar-amigo', JSON.stringify({
      id: 'amigo-prueba-vuelo', nombre: 'Piloto', cuerpo: 'el', piel: '#f6c8a4', pelo: '#c99a5b', ropa: '#3fb5a3', ropa2: '#4a4a52', zapatos: '#f4efe6', activo: true, creado: 1,
    }));
  });
  const abrir = async () => {
    console.log('Abriendo el retrete…');
    await p.goto(new URL('retrete.html', url).href, { timeout: 180000 });
    await p.waitForFunction(() => window.__cohete?.estado()?.fase === 'juego', null, { timeout: 180000 });
    await p.evaluate(() => { window.__cohete.manual(); window.__cohete.bot(); });
  };
  await abrir();
  assert.equal(await p.evaluate(() => localStorage.getItem('amigo-retrete-progreso')), null);
  assert.equal(await p.evaluate(() => window.__cohete.estado().progreso.vuelos), 0);
  await p.locator('.ch-pausa').click();
  const pausado = await p.evaluate(() => window.__cohete.estado().t);
  await p.evaluate(() => window.__cohete.manual(false));
  await p.waitForTimeout(1000);
  assert.equal(await p.evaluate(() => window.__cohete.estado().t), pausado);
  await p.locator('[data-seguir]').click();
  await p.evaluate(() => window.__cohete.manual());
  const vuelos = [];
  for (let n = 1; n <= 2; n++) {
    if (n === 2) {
      await p.locator('[data-otra]').click();
      await p.evaluate(() => window.__cohete.simular(4));
      assert.equal(await p.evaluate(() => window.__cohete.estado().fase), 'juego');
    }
    const fin = await p.evaluate(() => {
      const c = window.__cohete;
      const j = c.juego(), render = j.renderer.render.bind(j.renderer);
      j.renderer.render = () => {};
      for (let s = 0; s < 600 && c.estado().fase !== 'resultado'; s += 2) c.simular(2);
      // El Retrete es infinito: si el piloto sobrevive, terminar con el botón normal de aterrizar de la pausa.
      if (c.estado().fase === 'juego') {
        document.querySelector('.ch-pausa').click();
        document.querySelector('[data-rendirse]').click();
        c.simular(4);
      }
      j.renderer.render = render;
      render(j.escena, j.camara);
      if (c.estado().fase !== 'resultado') throw Error('El vuelo no llegó al resultado');
      return c.estado();
    });
    assert.ok(fin.metros > 0);
    assert.equal(fin.progreso.vuelos, n);
    assert.deepEqual(fin.progreso.mejoras, {});
    assert.equal(fin.progreso.mejor, Math.max(fin.metros, ...vuelos.map((v) => v.metros)));
    const guardado = await p.evaluate(() => JSON.parse(localStorage.getItem('amigo-retrete-progreso')));
    assert.deepEqual(guardado, fin.progreso);
    await p.evaluate(() => window.__cohete.simular(5));
    await p.locator('.cohete-resultado.contado').waitFor({ state: 'visible', timeout: 60000 });
    await p.screenshot({ path: `${carpeta}/vuelo-${n}-fin.png` });
    vuelos.push(fin);
    console.log(`✓ Vuelo ${n}: ${fin.metros} metros, ${fin.rollitos} rollitos recogidos, resultado por ${fin.causa}`);
  }
  const antesCompra = vuelos.at(-1).progreso;
  await p.locator('[data-tienda]').click();
  const compra = await p.evaluate(() => {
    const b = document.querySelector('.ct-precio:not(.caro)[data-mejora]');
    if (!b) throw Error('Los vuelos no alcanzaron para una mejora');
    return { id: b.dataset.mejora, precio: Number(b.querySelector('b').textContent.replace(/\D/g, '')) };
  });
  await p.locator(`[data-mejora="${compra.id}"]`).click();
  const antes = await p.evaluate(() => structuredClone(window.__cohete.estado().progreso));
  assert.equal(antes.mejoras[compra.id], 1);
  assert.equal(antes.rollitos, antesCompra.rollitos - compra.precio);
  assert.equal(antes.vuelos, 2);
  await p.screenshot({ path: `${carpeta}/mejora-pagada.png` });
  await abrir();
  assert.deepEqual(await p.evaluate(() => window.__cohete.estado().progreso), antes);
  assert.deepEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('amigo-retrete-progreso'))), antes);
  assert.deepEqual(errores, []);
  await writeFile(`${carpeta}/resultado.json`, JSON.stringify({ vuelos, compra, progresoFinal: antes, pausa: true, conserva: true, errores }, null, 2));
  console.log(`✓ ${compra.id} pagada con ${compra.precio} rollitos; progreso conservado tras recargar`);
} finally { await browser.close(); }
