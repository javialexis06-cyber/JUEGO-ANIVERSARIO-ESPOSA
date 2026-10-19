// Plantas contra Zombis: La Semilla Madre en el navegador, sobre el build servido.
// 1) Partida nueva sin piloto: título, prólogo y radio (se saltan con «Saltar»), el 1-1 con toques reales (sobre →
//    casilla, recoger un sol), pausa que congela el motor y el arte de Blender cargado (hojas webp y escenario).
// 2) Mundo 1 completo con el piloto (?bot): el mismo motor a paso fijo, del 1-1 al 1-10, guardando cada premio.
// 3) Los patios clásicos siguen abriendo en jardin.html?clasicos=1.
// Uso: npm run build && npx vite preview --port 4184 --strictPort
//      node scripts/probar-pvz-interfaz.mjs [http://127.0.0.1:4184/] [carpeta de salida]
// AMIGO=1 prueba la versión de amigos (clave amigo-pvz-v1). CHROME_PATH si el Chromium no coincide con Playwright.
// Límites: piloto y avance a paso fijo; dibujo por captura con SwiftShader. No mide rendimiento de teléfono.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.argv[2] ?? 'http://127.0.0.1:4184/';
const out = process.argv[3] ?? 'test-results/pvz-interfaz';
const amigo = process.env.AMIGO === '1';
const clave = amigo ? 'amigo-pvz-v1' : 'pvz-v1';
await mkdir(out, { recursive: true });
const b = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
const errores = [];
const malos = [];
const resumen = { amigo, niveles: [] };

async function pagina() {
  const c = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true });
  const p = await c.newPage();
  p.setDefaultTimeout(60000);
  p.on('pageerror', (e) => errores.push(e.message));
  p.on('response', (r) => { if (r.status() >= 400) malos.push(`${r.status()} ${r.url()}`); });
  if (amigo) {
    await p.addInitScript(() => localStorage.setItem('nuestro-hogar-amigo', JSON.stringify({ id: 'amigo-defensor0001', nombre: 'Defensor', cuerpo: 'el', piel: '#f6c8a4', pelo: '#c99a5b', ropa: '#3fb5a3', ropa2: '#4a4a52', zapatos: '#f4efe6', activo: true, creado: 1 })));
  }
  return { c, p };
}

/** Salta diálogos (prólogo, radio, Dave) hasta que el motor esté jugando. */
async function hastaJugar(p) {
  for (let i = 0; i < 40; i++) {
    const estado = await p.evaluate(() => window.__pvz.motor()?.estado ?? null);
    if (estado === 'jugando') return;
    const saltar = p.locator('.pvz-dialogo:not(.saliendo) .saltar');
    if (await saltar.count()) await saltar.first().click().catch(() => {});
    await p.waitForTimeout(500);
  }
  throw new Error('El nivel no empezó');
}

async function casilla(p, fila, col) {
  return p.evaluate(([f, c]) => {
    const v = window.__pvz.vista();
    const r = v.lienzo.getBoundingClientRect();
    const q = v.aPantalla(c * 80 + 40, 80 + f * 100 + 55);
    return { x: r.left + q.x, y: r.top + q.y };
  }, [fila, col]);
}

let p;
try {
  // 1) Toques reales.
  ({ p } = await pagina());
  await p.goto(new URL('jardin.html', base).href);
  await p.locator('.pvz-titulo').waitFor();
  assert.equal(await p.evaluate((k) => localStorage.getItem(k), clave), null);
  await p.screenshot({ path: `${out}/titulo.png` });
  await p.locator('[data-accion="aventura"]').click();
  await hastaJugar(p);
  const m0 = await p.evaluate(() => ({ id: window.__pvz.motor().nivel.id, filas: window.__pvz.motor().filasActivas }));
  assert.equal(m0.id, '1-1');
  assert.deepEqual(m0.filas, [2]);
  const recursos = await p.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name.split('/').pop()));
  for (const r of ['indice.json', 'lanzaguisantes.webp', 'zombi.webp', 'fondo-dia-una.webp']) assert.ok(recursos.includes(r), `falta ${r}`);
  // Sobre del lanzaguisantes y casilla de la fila 2 (sol inicial del 1-1).
  const sol0 = await p.evaluate(() => window.__pvz.motor().sol);
  await p.locator('.pvz-sobre[data-planta="lanzaguisantes"]').click();
  const xy = await casilla(p, 2, 1);
  await p.touchscreen.tap(xy.x, xy.y);
  await p.waitForTimeout(200);
  const planta = await p.evaluate(() => window.__pvz.motor().plantas.map((q) => `${q.tipo}@${q.fila},${q.col}`));
  assert.deepEqual(planta, ['lanzaguisantes@2,1']);
  assert.equal(await p.evaluate(() => window.__pvz.motor().sol), sol0 - 100);
  // Que caiga un sol del cielo y recogerlo tocándolo.
  await p.evaluate(() => window.__pvz.avanzar(60 * 12));
  const s = await p.evaluate(() => {
    const m = window.__pvz.motor();
    const sol = m.soles[0];
    if (!sol) return null;
    const v = window.__pvz.vista();
    const r = v.lienzo.getBoundingClientRect();
    const q = v.aPantalla(sol.x, sol.y + 80);
    return { x: r.left + q.x, y: r.top + q.y, antes: m.sol };
  });
  assert.ok(s, 'no cayó ningún sol');
  await p.touchscreen.tap(s.x, s.y);
  await p.waitForTimeout(150);
  await p.evaluate(() => window.__pvz.avanzar(60));
  assert.ok((await p.evaluate(() => window.__pvz.motor().sol)) >= s.antes + 25, 'el sol tocado no se sumó');
  // Pausa: el motor no avanza mientras el menú está abierto.
  await p.locator('.pvz-boton-menu').click();
  await p.locator('.pvz-pausa').waitFor();
  const t = await p.evaluate(() => window.__pvz.motor().t);
  await p.waitForTimeout(400);
  assert.equal(await p.evaluate(() => window.__pvz.motor().t), t);
  await p.screenshot({ path: `${out}/pausa.png` });
  await p.locator('.pvz-pausa [data-a="seguir"]').click();
  await p.screenshot({ path: `${out}/1-1-toques.png` });
  resumen.toques = { planta, sol: true, pausa: true };
  console.log('OK toques reales en el 1-1: siembra, sol y pausa');
  await p.context().close();

  // 2) Mundo 1 con el piloto, desde una partida nueva.
  ({ p } = await pagina());
  await p.goto(new URL('jardin.html?bot&rapido=4&semilla=7', base).href);
  await p.locator('.pvz-titulo').waitFor();
  await p.locator('[data-accion="aventura"]').click();
  const ids = ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8', '1-9', '1-10'];
  for (const id of ids) {
    await p.waitForFunction((i) => window.__pvz.motor()?.nivel.id === i && window.__pvz.motor().estado === 'jugando', id, { timeout: 90000 });
    if (id === '1-1') {
      // El primer guardado falla (sin espacio): aparece el aviso y «Reintentar» lo recupera sin perder el premio.
      await p.evaluate((k) => {
        const original = Storage.prototype.setItem;
        window.__falloPvz = true;
        Storage.prototype.setItem = function (key, v) {
          if (key === k && window.__falloPvz) throw new DOMException('Sin espacio', 'QuotaExceededError');
          return original.call(this, key, v);
        };
      }, clave);
    }
    await p.evaluate(() => window.__pvz.avanzar(60 * 40));
    await p.screenshot({ path: `${out}/${id}-partida.png` });
    for (let k = 0; k < 40 && (await p.evaluate(() => window.__pvz.motor().estado)) === 'jugando'; k++) await p.evaluate(() => window.__pvz.avanzar(60 * 30));
    const m = await p.evaluate(() => { const m = window.__pvz.motor(); return { id: m.nivel.id, estado: m.estado, t: Math.round(m.t), caidos: m.caidos ?? null }; });
    assert.equal(m.estado, 'gano', `${id}: ${m.estado}`);
    if (id === '1-1') {
      const boton = p.getByRole('button', { name: 'Reintentar' });
      await boton.waitFor();
      await p.screenshot({ path: `${out}/guardado-fallido.png` });
      await p.evaluate(() => { window.__falloPvz = false; });
      await boton.click();
      resumen.guardadoFallidoRecuperado = true;
    }
    await p.waitForFunction((i) => window.__pvz.progreso().completados.includes(i), id);
    resumen.niveles.push(m);
    console.log('OK', id, 'ganado en', m.t, 's de juego');
  }
  await p.waitForFunction(() => window.__pvz.estado() === 'mapa' || window.__pvz.motor()?.nivel.id !== '1-10', null, { timeout: 30000 }).catch(() => {});
  const g = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), clave);
  assert.ok(g, 'no se guardó la partida');
  for (const id of ids) assert.ok(g.completados.includes(id), `sin guardar ${id}`);
  for (const pl of ['girasol', 'petacereza', 'nuez', 'patatapum', 'hielaguisantes', 'carnivora', 'repetidora', 'desesporada']) assert.ok(g.plantas.includes(pl), `falta ${pl}`);
  assert.ok(g.objetos.includes('pala') && g.objetos.includes('abono'));
  await p.reload();
  await p.locator('.pvz-titulo').waitFor();
  assert.deepEqual(await p.evaluate((k) => JSON.parse(localStorage.getItem(k)).completados, clave), g.completados);
  await p.screenshot({ path: `${out}/titulo-tras-mundo-1.png` });

  // 3) Patios clásicos.
  await p.goto(new URL('jardin.html?clasicos=1', base).href);
  await p.waitForFunction(() => window.__jardin);
  assert.ok(await p.locator('[data-nivel]').count() > 0);
  await p.context().close();

  assert.deepEqual(errores, []);
  assert.deepEqual(malos, []);
  await writeFile(`${out}/resultado.json`, JSON.stringify({ ...resumen, errores, malos, limites: 'Piloto con costes y recargas normales, avance del mismo motor a paso fijo y dibujo por captura con SwiftShader. No certifica teléfonos.' }, null, 2));
  console.log('OK PvZ: toques reales, mundo 1 completo con piloto, guardado y patios clásicos');
} catch (e) {
  await p?.screenshot({ path: `${out}/fallo.png` }).catch(() => {});
  console.error('errores', errores, 'malos', malos);
  throw e;
} finally {
  await b.close();
}
