// Vuelos con física normal; acceso preparado por __volar para comprobar el adaptador real de la casa local.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { cargarDatosRetrete } from './retrete-datos-prueba.mjs';

const url = process.argv[2] ?? 'http://127.0.0.1:4182/';
const carpeta = process.argv[3] ?? 'test-results/retrete-casa';
const { datos, liberar } = await cargarDatosRetrete();
const progresoEnDisco = datos.normalizarCohete;
await mkdir(carpeta, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  const p = await browser.newPage({ viewport: { width: 844, height: 390 } }), errores = [], vuelos = [];
  p.on('pageerror', e => errores.push(e.message));
  const casa = () => p.evaluate(() => JSON.parse(localStorage.getItem('nuestro-hogar-local')).casa);
  await p.goto(new URL('index.html?rol=el&local=1', url).href, { timeout: 180000 });
  await p.waitForFunction(() => window.__listo === true, null, { timeout: 180000 });
  await p.evaluate(() => {
    const m = window.__mundo(); m.dibujar = () => {};
    window.__vueloCasa = window.__volar();
  });
  await p.waitForFunction(() => window.__cohete?.estado()?.fase === 'juego', null, { timeout: 180000 });
  // Ejercita la rama nativa de la función de Atrás en Chromium, sin simular que esto es un teléfono real.
  await p.evaluate(() => {
    window.__cohete.manual(); window.__cohete.bot();
    window.__esNativo = window.Capacitor.isNativePlatform;
    window.Capacitor.isNativePlatform = () => true;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: false }));
    window.__cohete.manual(false);
  });
  await p.locator('.ch-pausa-capa:not([hidden])').waitFor({ state: 'visible' });
  const tiempoPausado = await p.evaluate(() => window.__cohete.estado().t);
  await p.waitForTimeout(1000);
  assert.equal(await p.evaluate(() => window.__cohete.estado().t), tiempoPausado);
  await p.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: false }));
    window.Capacitor.isNativePlatform = window.__esNativo;
    window.__cohete.manual();
  });
  await p.locator('.ch-pausa-capa').waitFor({ state: 'hidden' });
  console.log('✓ La ruta nativa de Atrás pausa y reanuda el vuelo; comprobación simulada en navegador');
  await p.evaluate(() => {
    window.__cohete.manual(); window.__cohete.bot();
    window.__escribirCasa = Storage.prototype.setItem;
    window.__fallarCasa = 'antes';
    window.__intentosCasa = 0;
    Storage.prototype.setItem = function(k, v) {
      if (k === 'nuestro-hogar-local') window.__intentosCasa++;
      if (k === 'nuestro-hogar-local' && window.__fallarCasa === 'antes') throw new DOMException('Sin espacio', 'QuotaExceededError');
      const r = window.__escribirCasa.call(this, k, v);
      if (k === 'nuestro-hogar-local' && window.__fallarCasa === 'respuesta') throw new DOMException('Respuesta perdida', 'QuotaExceededError');
      return r;
    };
  });
  const inicial = await casa(); let suma = 0;
  for (let n = 1; n <= 2; n++) {
    if (n === 2) {
      await p.locator('[data-otra]').click();
      await p.evaluate(() => { window.__cohete.simular(4); window.__fallarCasa = 'respuesta'; });
      assert.equal(await p.evaluate(() => window.__cohete.estado().fase), 'juego');
    }
    const fin = await p.evaluate(() => {
      const c = window.__cohete, j = c.juego(), render = j.renderer.render.bind(j.renderer);
      j.renderer.render = () => {};
      for (let s = 0; s < 600 && c.estado().fase !== 'resultado'; s += 2) c.simular(2);
      if (c.estado().fase === 'juego') {
        document.querySelector('.ch-pausa').click(); document.querySelector('[data-rendirse]').click(); c.simular(4);
      }
      j.renderer.render = render; render(j.escena, j.camara);
      if (c.estado().fase !== 'resultado') throw Error('No aterrizó');
      return c.estado();
    });
    const premio = Math.max(0, Math.min(datos.monedasVuelo(fin.t), datos.TOPE_MONEDAS_DIA - suma));
    await p.locator('.cohete-resultado.contado').waitFor({ state: 'visible', timeout: 60000 });
    await p.locator('.ch-guardado').waitFor({ state: 'visible' });
    const conFallo = await casa();
    assert.equal(conFallo.monedas, inicial.monedas + suma + (n === 2 ? premio : 0));
    if (n === 1) assert.deepEqual(conFallo.cohete, inicial.cohete);
    else assert.deepEqual(conFallo.cohete.el, progresoEnDisco(fin.progreso));
    for (const sel of ['[data-casa]', '[data-otra]']) {
      await p.locator(sel).click();
      await p.waitForFunction(() => !!document.querySelector('.ch-guardado'));
      assert.equal(await p.evaluate(() => window.__cohete.estado().fase), 'resultado');
      assert.equal((await casa()).monedas, conFallo.monedas);
    }
    const intentos = await p.evaluate(() => window.__intentosCasa);
    await p.keyboard.press('Escape');
    await p.waitForFunction(n => window.__intentosCasa > n, intentos);
    assert.equal(await p.evaluate(() => window.__cohete.estado().fase), 'resultado');
    assert.equal((await casa()).monedas, conFallo.monedas);
    await p.screenshot({ path: `${carpeta}/vuelo-${n}-pendiente.png` });
    await p.evaluate(() => { window.__fallarCasa = false; });
    await p.locator('[data-reintentar-guardado]').click();
    await p.locator('.ch-guardado').waitFor({ state: 'detached' });
    suma += premio;
    const confirmado = await casa();
    assert.equal(confirmado.monedas, inicial.monedas + suma);
    assert.deepEqual(confirmado.cohete.el, progresoEnDisco(fin.progreso));
    assert.equal(await p.evaluate(() => window.__cohete.juego().resultado.casa.monedas), premio);
    assert.equal(await p.evaluate(() => window.__cohete.juego().monedasSesion), suma);
    vuelos.push({ ...fin, premio });
    console.log(`✓ Vuelo ${n}: ${fin.metros} m, ${premio} monedas; ${n === 1 ? 'cuota agotada' : 'respuesta perdida'} recuperada sin doble pago`);
  }
  const final = await casa();
  await p.locator('[data-casa]').click();
  await p.waitForFunction(() => !window.__cohete.juego(), null, { timeout: 60000 });
  await p.evaluate(() => window.__vueloCasa);
  const regreso = await casa();
  assert.deepEqual(regreso.cohete.el, final.cohete.el);
  await p.reload({ timeout: 180000 });
  await p.waitForFunction(() => window.__listo === true, null, { timeout: 180000 });
  const recargada = await casa();
  assert.deepEqual(recargada.cohete.el, final.cohete.el);
  // El retorno puede conceder un trofeo normal; no se confunde ese premio con las monedas del vuelo.
  assert.equal(recargada.monedas, regreso.monedas);
  assert.deepEqual(errores, []);
  await writeFile(`${carpeta}/resultado.json`, JSON.stringify({ vuelos, monedasIniciales: inicial.monedas,
    monedasFinales: regreso.monedas, monedasVuelos: suma, premiosAlVolver: regreso.monedas - final.monedas,
    progresoFinal: final.cohete.el, regresoCasa: true, recarga: true,
    accesoPreparado: true, atrasNativoSimulado: true, errores }, null, 2));
  console.log('✓ Retorno y recarga conservan el progreso y las monedas de ambos vuelos');
} finally { await browser.close(); await liberar(); }
