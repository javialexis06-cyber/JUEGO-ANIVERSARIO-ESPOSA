/** Fotografía las herramientas de la granja en sus cinco calidades y guarda los íconos (webp) que usan la barra y
 * la mochila. Con el servidor de Vite andando: node scripts/granja-v3/iconos-herramientas.mjs [url-base]
 * (la página `scripts/granja-v3/herramientas-fotos.html` arma la escena con `src/granja-v3/herramientas3d.ts`). */
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs/promises';
const base = process.argv[2] ?? 'http://localhost:5300/';
const out = 'public/modelos/granja-v3/iconos';
await fs.mkdir(out, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage();
p.on('pageerror', (e) => console.log('PAGE', e.message));
await p.goto(base + 'scripts/granja-v3/herramientas-fotos.html');
await p.waitForFunction(() => window.fotos, null, { timeout: 120000 });
const fotos = await p.evaluate(() => window.fotos);
for (const [id, url] of Object.entries(fotos)) {
  await sharp(Buffer.from(url.split(',')[1], 'base64')).trim({ threshold: 1 }).resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 90, alphaQuality: 100 }).toFile(`${out}/herr_${id}.webp`);
}
console.log(Object.keys(fotos).length, 'íconos en', out);
await b.close();
