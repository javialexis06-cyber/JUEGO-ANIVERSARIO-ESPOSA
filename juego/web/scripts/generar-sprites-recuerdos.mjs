// Genera los recortes de Él y Ella para los recuerdos (public/recuerdos/<rol>_<pose>.webp).
// Uso (con el servidor de desarrollo prendido en 5174): node scripts/generar-sprites-recuerdos.mjs
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const PEDIDOS = [
  { nombre: 'feliz', pose: 'reposo', cara: 'feliz' },
  { nombre: 'habla', pose: 'hablar_a', cara: 'hablar' },
  { nombre: 'risa', pose: 'risita_a', cara: 'carcajada' },
  { nombre: 'beso', pose: 'beso', cara: 'beso' },
  { nombre: 'abrazo', pose: 'abrazo_der', cara: 'feliz', giro: 35 },
  { nombre: 'saludo', pose: 'saludo_a', cara: 'feliz' },
  { nombre: 'celebra', pose: 'celebrar', cara: 'carcajada' },
  { nombre: 'piensa', pose: 'pensando', cara: 'concentrado' },
  { nombre: 'sorpresa', pose: 'boca_abierta', cara: 'sorprendido' },
  { nombre: 'llora', pose: 'llorar_a', cara: 'llorando' },
  { nombre: 'puchero', pose: 'brazos_cruzados', cara: 'puchero' },
  { nombre: 'regalo', pose: 'regalo', cara: 'feliz' },
  { nombre: 'arriba', pose: 'senalar_arriba', cara: 'feliz' },
  { nombre: 'sentado', pose: 'sentado', cara: 'feliz' },
  { nombre: 'presume', pose: 'jarras', cara: 'presumido' },
  { nombre: 'guino', pose: 'pulgares_a', cara: 'guino' },
  { nombre: 'timido', pose: 'encogerse', cara: 'nervioso' },
  { nombre: 'rodillas', pose: 'rodillas_a', cara: 'nervioso' },
  { nombre: 'baile', pose: 'baile_a', cara: 'carcajada' },
  { nombre: 'duerme', pose: 'sentado', cara: 'dormido' },
];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const p = await b.newPage();
p.on('pageerror', (e) => console.log('ERR', e.message));
await p.goto('http://localhost:5174/mesa.html?sin3d');
for (const rol of ['el', 'ella']) {
  const imgs = await p.evaluate(async ([rol, pedidos]) => {
    const m = await import('/scripts/sprites-recuerdos.ts');
    return m.generar(rol, pedidos);
  }, [rol, PEDIDOS]);
  for (const [n, url] of Object.entries(imgs)) {
    writeFileSync(`public/recuerdos/${rol}_${n}.webp`, Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log(rol, Object.keys(imgs).length);
}
await b.close();
