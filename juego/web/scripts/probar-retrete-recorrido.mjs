// Vuelo desde progreso nuevo con el piloto normal: sin dios, saltos, rollitos regalados ni choque forzado.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { cargarDatosRetrete } from './retrete-datos-prueba.mjs';

const url = process.argv[2] ?? 'http://127.0.0.1:4182/';
const carpeta = process.argv[3] ?? 'test-results/retrete-recorrido';
const fallos = process.env.FALLOS === '1';
const { datos, liberar } = await cargarDatosRetrete();
const progresoEnDisco = datos.normalizarCohete;
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
    if (fallos && n === 1) await p.evaluate(() => {
      window.__escribirRetrete = Storage.prototype.setItem;
      window.__fallarRetrete = true;
      Storage.prototype.setItem = function (k, v) {
        if (k === 'amigo-retrete-progreso' && window.__fallarRetrete) throw new DOMException('Sin espacio', 'QuotaExceededError');
        return window.__escribirRetrete.call(this, k, v);
      };
    });
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
    await p.evaluate(() => window.__cohete.simular(5));
    await p.locator('.cohete-resultado.contado').waitFor({ state: 'visible', timeout: 60000 });
    if (fallos && n === 1) {
      assert.equal(await p.evaluate(() => localStorage.getItem('amigo-retrete-progreso')), null);
      await p.locator('.ch-guardado').waitFor({ state: 'visible' });
      for (const selector of ['[data-otra]', '[data-tienda]', '[data-casa]']) {
        await p.locator(selector).click();
        await p.waitForFunction(() => !!document.querySelector('.ch-guardado'));
        assert.equal(await p.evaluate(() => window.__cohete.estado().fase), 'resultado');
        assert.equal(await p.locator('.cohete-resultado.abierta').count(), 1);
      }
      await p.keyboard.press('Escape');
      assert.equal(await p.evaluate(() => window.__cohete.estado().fase), 'resultado');
      await p.screenshot({ path: `${carpeta}/vuelo-guardado-pendiente.png` });
      await p.evaluate(() => { window.__fallarRetrete = false; });
      await p.locator('[data-reintentar-guardado]').click();
      await p.locator('.ch-guardado').waitFor({ state: 'detached' });
      console.log('✓ El resultado permanece abierto ante cuota agotada; volver, tienda y atrás esperan el reintento');
    }
    const guardado = await p.evaluate(() => JSON.parse(localStorage.getItem('amigo-retrete-progreso')));
    assert.deepEqual(guardado, progresoEnDisco(fin.progreso));
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
  if (fallos) await p.evaluate(() => { window.__fallarRetrete = true; });
  await p.locator(`[data-mejora="${compra.id}"]`).click();
  await p.waitForFunction(id => window.__cohete.estado().progreso.mejoras[id] === 1, compra.id);
  const antes = await p.evaluate(() => structuredClone(window.__cohete.estado().progreso));
  assert.equal(antes.mejoras[compra.id], 1);
  const misionCompra = antesCompra.misiones.find(m => !m.hecha && m.tipo === 'compras_total' && m.avance + 1 >= m.meta);
  const premioMision = misionCompra ? datos.premioMision(antesCompra.nivel) : 0;
  const premioNivel = antes.nivel > antesCompra.nivel ? datos.premioNivel(antesCompra.nivel) : 0;
  assert.equal(antes.rollitos, antesCompra.rollitos - compra.precio + premioMision + premioNivel);
  assert.equal(antes.vuelos, 2);
  if (fallos) {
    await p.locator('.ch-guardado').waitFor({ state: 'visible' });
    assert.deepEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('amigo-retrete-progreso'))), progresoEnDisco(antesCompra));
    await p.locator(`[data-mejora="${compra.id}"]`).click();
    await p.locator('.ct-cerrar').click();
    await p.keyboard.press('Escape');
    assert.equal(await p.evaluate(() => window.__cohete.estado().fase), 'taller');
    assert.deepEqual(await p.evaluate(() => window.__cohete.estado().progreso), antes);
    await p.screenshot({ path: `${carpeta}/compra-guardado-pendiente.png` });
    await p.evaluate(() => { window.__fallarRetrete = false; });
    await p.locator('[data-reintentar-guardado]').click();
    await p.locator('.ch-guardado').waitFor({ state: 'detached' });
    assert.deepEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('amigo-retrete-progreso'))), progresoEnDisco(antes));
    console.log('✓ La compra pendiente no vuelve a cobrar y la tienda espera antes de cerrar');
  }
  await p.screenshot({ path: `${carpeta}/mejora-pagada.png` });
  await abrir();
  assert.deepEqual(await p.evaluate(() => window.__cohete.estado().progreso), progresoEnDisco(antes));
  assert.deepEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('amigo-retrete-progreso'))), progresoEnDisco(antes));
  // Regreso por los botones normales, sin abandonar un vuelo activo al recargar.
  await p.locator('.ch-pausa').click();
  await p.locator('[data-rendirse]').click();
  await p.evaluate(() => window.__cohete.simular(4));
  await p.locator('[data-casa]').waitFor({ state: 'visible', timeout: 60000 });
  await p.locator('[data-casa]').click();
  await p.waitForURL(/amigos.html/, { timeout: 60000 });
  assert.deepEqual(errores, []);
  await writeFile(`${carpeta}/resultado.json`, JSON.stringify({ vuelos, compra, progresoFinalAntesSalida: antes, pausa: true, conserva: true, fallosGuardado: fallos, regresoSala: true, errores }, null, 2));
  console.log(`✓ ${compra.id} pagada con ${compra.precio} rollitos; progreso conservado tras recargar`);
} finally { await browser.close(); await liberar(); }
