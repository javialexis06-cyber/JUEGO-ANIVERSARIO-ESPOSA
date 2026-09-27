// Prueba corta: Él come sentado, ve tele en el sofá y va a la nevera; captura justo en cada acción.
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
const url = process.argv[2] ?? 'http://localhost:5173/index.html';
const carpeta = process.argv[3] ?? 'test-results/acciones';
mkdirSync(carpeta, { recursive: true });
const PRE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const b = await chromium.launch({ executablePath: existsSync(PRE) ? PRE : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errores = [];
p.on('pageerror', (e) => errores.push(String(e)));
await p.goto(url);
await p.evaluate(() => localStorage.clear());
await p.goto(`${url}?rol=el&local=1&rapido=3`);
await p.waitForFunction(() => window.__listo === true, null, { timeout: 120000 });
const accion = async (cuarto, boton, clave, nombre, extra) => {
  await p.click(`[data-cuarto="${cuarto}"]`);
  await p.click(`[data-accion="${boton}"]`);
  if (extra) await p.click(extra);
  await p.waitForFunction((c) => window.__escena('el').includes(c), clave, { timeout: 90000 }).catch(() => errores.push(`no llegó a ${clave}`));
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${carpeta}/${nombre}.png`, animations: 'disabled', timeout: 120000 });
};
await accion('cocina', 'comer', '|comer|', '1-come', '[data-comer="pan"]');
await accion('sala', 'tv', '|tv|', '2-tele');
await accion('sala', 'sofa', '|sofa|', '3-sofa');
await accion('cuarto', 'closet', '|closet|', '4-closet');
console.log(errores.length ? errores.join('\n') : 'sin errores');
await b.close();
