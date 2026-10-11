/** Fotografía los objetos de la granja (cosechas, semillas, minerales, peces, comidas, armaduras…) con el estudio
 * `src/granja-v3/iconos3d.ts` y guarda los webp en public/modelos/granja-v3/iconos/obj_<id>.webp, más la lista
 * `src/granja-v3/iconos-lista.ts` que dice cuáles tienen foto. Con Vite andando:
 *   node scripts/granja-v3/iconos-objetos.mjs [url-base] [regex-de-ids] */
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs/promises';
const base = process.argv[2] ?? 'http://localhost:5300/', solo = process.argv[3] ?? '';
const out = 'public/modelos/granja-v3/iconos';
await fs.mkdir(out, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage();
p.on('pageerror', (e) => console.log('PAGE', e.message));
p.on('console', (m) => (m.type() === 'error' || m.text().startsWith('sin figura')) && console.log(m.text()));
await p.goto(base + 'scripts/granja-v3/objetos-fotos.html' + (solo ? '?solo=' + encodeURIComponent(solo) : ''));
await p.waitForFunction(() => window.fotos, null, { timeout: 600000 });
const fotos = await p.evaluate(() => window.fotos);
for (const [id, url] of Object.entries(fotos)) {
  await sharp(Buffer.from(url.split(',')[1], 'base64')).trim({ threshold: 1 }).resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 88, alphaQuality: 100 }).toFile(`${out}/obj_${id}.webp`);
}
const todos = (await fs.readdir(out)).filter((f) => f.startsWith('obj_')).map((f) => f.slice(4, -5)).sort();
await fs.writeFile('src/granja-v3/iconos-lista.ts', `// Generado por scripts/granja-v3/iconos-objetos.mjs: objetos que tienen foto en public/modelos/granja-v3/iconos.\nexport const CON_FOTO = new Set(${JSON.stringify(todos)});\n`);
console.log(Object.keys(fotos).length, 'fotos;', todos.length, 'en total');
await b.close();
