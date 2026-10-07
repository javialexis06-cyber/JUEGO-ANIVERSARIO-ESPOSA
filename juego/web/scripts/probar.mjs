// Prueba automática: abre el juego, juega un nivel con el piloto (?bot) y guarda capturas.
// Uso: node scripts/probar.mjs [url] [nivel] [carpeta] [ancho]x[alto]
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:5173/';
const nivel = Number(process.argv[3] ?? 1);
const carpeta = process.argv[4] ?? 'test-results';
const [ancho, alto] = (process.argv[5] ?? '1280x800').split('x').map(Number);
mkdirSync(carpeta, { recursive: true });

// Chromium preinstalado del entorno (si existe) para no descargar otro
const PREINSTALADO = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({
  executablePath: existsSync(PREINSTALADO) ? PREINSTALADO : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1 });
const errores = [];
pagina.on('pageerror', (e) => errores.push(String(e)));
pagina.on('console', (m) => m.type() === 'error' && !m.text().startsWith('Failed to load resource') && errores.push(m.text()));
pagina.on('response', (r) => r.status() >= 400 && errores.push(`${r.status()} ${r.url()}`));
pagina.on('requestfailed', (r) => errores.push(`falló ${r.url()}`));

// Partida inicial opcional (JSON con mejoras y estrellas) para probar días avanzados
if (process.argv[6]) {
  const partida = readFileSync(process.argv[6], 'utf8');
  await pagina.addInitScript((p) => localStorage.setItem('supermania-jugable1', p), partida);
}
const t0 = Date.now();
await pagina.goto(`${url}${url.includes('?') ? '&' : '?'}bot&rapido=40`);
await pagina.waitForSelector('#menu:not([hidden])', { timeout: 120000 });
console.log('menú listo en', ((Date.now() - t0) / 1000).toFixed(1), 's');
await pagina.waitForTimeout(800);
await pagina.screenshot({ path: `${carpeta}/1-menu.png` });
await pagina.click(`#niveles .etiqueta:nth-of-type(${nivel})`);
await pagina.waitForTimeout(500);
await pagina.screenshot({ path: `${carpeta}/2-tarjeta.png` });
if (process.env.LEGENDARIO) await pagina.click('#btn-legendario');
await pagina.click('#btn-abrir');
await pagina.waitForSelector('#hud:not([hidden])', { timeout: 60000 });
for (let k = 0; k < 3; k++) {
  await pagina.waitForTimeout(6000);
  await pagina.screenshot({ path: `${carpeta}/3-juego-${k}.png` });
  console.log('estado', JSON.stringify(await pagina.evaluate(() => window.__estado())));
}
// Acercamiento a Él para revisar el detalle de los modelos
await pagina.evaluate(() => {
  const j = window.__juego();
  if (!j) return;
  const p = j.jugador.pos;
  window.__mundo().enfocar({ x: p.x, y: 0.9, z: -p.y }, 2.6);
});
await pagina.waitForTimeout(1500);
await pagina.screenshot({ path: `${carpeta}/3-juego-cerca.png` });
await pagina.evaluate(() => window.__mundo().fijarZoom(1));
await pagina.waitForSelector('#resultado:not([hidden])', { timeout: 240000 });
await pagina.waitForTimeout(1500);
await pagina.screenshot({ path: `${carpeta}/4-resultado.png`, animations: 'disabled' });
const r = await pagina.evaluate(() => window.__estado());
console.log('resultado', JSON.stringify(r.resultado));
console.log('errores', errores.length ? errores : 'ninguno');
await navegador.close();
