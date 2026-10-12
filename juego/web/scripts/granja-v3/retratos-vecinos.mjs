// Retratos de los vecinos (los peluches de Blender vestidos con su ropa): una foto de cara y hombros de cada uno,
// con fondo transparente, en public/granja/retratos/<id>.webp. Se corre con el servidor de Vite prendido:
//   node scripts/granja-v3/retratos-vecinos.mjs [http://127.0.0.1:5176] [ids,separados,por,comas]
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const base = process.argv[2] ?? 'http://127.0.0.1:5176';
const solo = process.argv[3]?.split(',').filter(Boolean);
const salida = fileURLToPath(new URL('../../public/granja/retratos/', import.meta.url));
mkdirSync(salida, { recursive: true });
const PRE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const nav = await chromium.launch({ executablePath: existsSync(PRE) ? PRE : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await nav.newPage({ viewport: { width: 400, height: 400 } });
p.setDefaultTimeout(300000);
p.on('pageerror', (e) => console.log('ERR', String(e)));
await p.route(/_retratos\.html$/, (r) => r.fulfill({ contentType: 'text/html', body: `<!doctype html><html><body style="margin:0;background:#0000"><canvas id="c" width="320" height="320"></canvas><script type="module" src="/scripts/granja-v3/retratos-pagina.ts"></script></body></html>` }));
await p.goto(`${base}/_retratos.html`);
await p.waitForFunction(() => window.listo, null, { timeout: 300000 });
const ids = solo ?? (await p.evaluate(() => window.ids));
let n = 0;
for (const [i, id] of ids.entries()) {
  const url = await p.evaluate(([id, i]) => window.foto(id, i), [id, i]);
  writeFileSync(salida + id + '.webp', Buffer.from(url.split(',')[1], 'base64'));
  n++; if (n % 20 === 0) console.log(n, 'de', ids.length);
}
console.log('retratos', n);
await nav.close();
