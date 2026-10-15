// Las fotos de las tarjetas del menú de la carrera: la postal de cada pista y el retrato de cada criatura, sacadas del
// mismo juego (los modelos de Blender) con Chromium. Uso: node scripts/carreras/fotos.mjs [url base]
//   (con el servidor de pruebas andando; salen en public/carreras/pistas/ y public/carreras/criaturas/)
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const base = process.argv[2] ?? 'http://localhost:5192/carreras.html';
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
mkdirSync('public/carreras/pistas', { recursive: true });
mkdirSync('public/carreras/criaturas', { recursive: true });
const foto = async (q, vp, salida, transparente) => {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 2 });
  await p.routeWebSocket(u => u.host === new URL(base).host && u.searchParams.has('token'), s => s.send(JSON.stringify({type:'connected'})));
  await p.goto(`${base}?${q}&rol=el`, {waitUntil:'domcontentloaded'});
  await p.waitForFunction(() => document.body.dataset.foto === 'lista', null, { timeout: 240000 });
  await p.waitForTimeout(500);
  await p.locator('#lienzo').screenshot({ path: '/tmp/_foto.png', omitBackground: transparente });
  execFileSync('python3', ['-c', 'import sys; from PIL import Image; Image.open(sys.argv[1]).save(sys.argv[2], "WEBP", quality=82, method=6)', '/tmp/_foto.png', salida]);
  console.log('ok', salida);
  await p.close();
};
const solo = process.argv[3];
for (const id of (process.env.PISTAS ?? 'valle,brasa,nieve,cielo,puerto,mina,bosque,desierto,jardines,cristal,fortaleza,pantano,mercado,acantilado,observatorio,estacion,arena_plaza,arena_hornos,arena_cristal').split(',')) if (!solo || solo === 'pistas') await foto(`postal=${id}`, { width: 192, height: 116 }, `public/carreras/pistas/${id}.webp`, false);
for (const id of (!solo || solo === 'criaturas') ? ['unicornio', 'grifo', 'dragon', 'cria', 'zorro', 'carnero'] : []) await foto(`retrato=${id}`, { width: 96, height: 96 }, `public/carreras/criaturas/${id}.webp`, true);
await b.close();
