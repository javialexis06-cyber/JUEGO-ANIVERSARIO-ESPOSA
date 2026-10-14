// Botones reales sobre un escenario aislado preparado, sin horda ni regeneración que alteren los cobros.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const base = process.argv[2] ?? 'http://127.0.0.1:4182';
const out = process.argv[3] ?? 'test-results/sangre-costes';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
const page = await ctx.newPage(), errores = [], checks = [];
page.on('pageerror', e => errores.push(e.message));
const done = t => { checks.push(t); console.log(`✓ ${t}`); };
try {
  await page.goto(`${base}/sangre.html?prueba=1&clase=campesino&calidad=baja&semilla=8919`);
  await page.waitForFunction(() => window.__listo && window.__sangre(), null, { timeout: 120000 });
  await page.evaluate(() => {
    const s = window.__sangre(); s.sinHorda = true; s.sinReloj = true;
    for (let i = 0; i < s.E.max; i++) s.E.quitar(i);
    const j = s.J[0]; j.hpMax = 200; j.hp = 150; j.st.regen = 0;
  });
  await page.waitForFunction(() => document.querySelector('[data-e="astralC"]')?.textContent === '−10%');
  assert.match(await page.locator('[data-e="astral"]').getAttribute('title'), /10 % de vida máxima/);
  await page.locator('[data-e="astral"]').tap();
  await page.waitForFunction(() => window.__sangre().J[0].hp === 130);
  done('El botón Astral muestra 10 % y cobra 20 sobre vida máxima 200 aunque queden 150');
  await page.evaluate(() => { const j = window.__sangre().J[0]; j.hpMax = 1000; j.hp = 500; j.astralT = 0; });
  await page.keyboard.press('q');
  await page.waitForFunction(() => window.__sangre().J[0].hp === 400);
  done('El teclado cobra 100 al aumentar la vida máxima a 1000');
  await page.evaluate(() => { const j = window.__sangre().J[0]; j.hp = 101; j.astralT = 0; });
  await page.locator('[data-e="astral"]').tap();
  await page.waitForFunction(() => document.body.textContent.includes('Te falta vida para la visión astral'));
  assert.equal(await page.evaluate(() => window.__sangre().J[0].hp), 101);
  done('Vida insuficiente da aviso y no cobra');
  await page.evaluate(() => { const j = window.__sangre().J[0]; j.hpMax = 200; j.hp = 180; });
  await page.locator('[data-n="0"].hud-sigilo').tap();
  await page.waitForFunction(() => window.__sangre().J[0].hp === 40);
  assert.ok(await page.evaluate(() => window.__sangre().J[0].brujulaT > 0));
  await page.locator('[data-n="0"].hud-sigilo').tap();
  await page.waitForFunction(() => document.body.textContent.includes('Brújula de sangre: falta'));
  assert.equal(await page.evaluate(() => window.__sangre().J[0].hp), 40);
  done('Brújula cobra 70 % de vida máxima, inicia su efecto y bloquea el doble toque durante recarga');
  await page.screenshot({ path: `${out}/sigilos-horizontal.png` });
  assert.deepEqual(errores, []);
} catch (e) { errores.push(String(e.stack)); process.exitCode = 1; await page.screenshot({ path: `${out}/fallo.png` }).catch(() => {}); }
finally { writeFileSync(`${out}/verificacion.json`, JSON.stringify({ checks, errores, preparado: 'Horda desactivada y vida máxima/actual sin regeneración para aislar el cobro; no es una campaña.', dispositivosFisicos: [] }, null, 2)); await browser.close(); }
