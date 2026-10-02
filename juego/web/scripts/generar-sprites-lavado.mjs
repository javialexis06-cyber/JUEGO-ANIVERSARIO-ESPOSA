// Genera los retratos de los disfraces del lavado (public/lavado/disfraces/<id>.webp).
// Uso (con el servidor de desarrollo prendido): PUERTO=5173 node scripts/generar-sprites-lavado.mjs [ids…]
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const puerto = process.env.PUERTO ?? '5173';
const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const p = await b.newPage();
p.on('pageerror', (e) => console.log('ERR', e.message));
await p.route('**/_retratos.html', (r) => r.fulfill({ contentType: 'text/html', body: '<!doctype html><meta charset="utf-8"><body></body>' }));
await p.goto(`http://127.0.0.1:${puerto}/_retratos.html`);
const ids = process.argv.slice(2).length
  ? process.argv.slice(2)
  : await p.evaluate(async () => (await import('/src/casa/lavado/disfraces.ts')).DISFRACES.map((d) => d.id));
for (const id of ids) {
  const imgs = await p.evaluate(async (id) => (await import('/scripts/sprites-lavado.ts')).generar([id]), id);
  for (const [n, url] of Object.entries(imgs)) writeFileSync(`public/lavado/disfraces/${n}.webp`, Buffer.from(url.split(',')[1], 'base64'));
  console.log(id, Object.keys(imgs).length ? 'listo' : 'NO');
}
await b.close();
