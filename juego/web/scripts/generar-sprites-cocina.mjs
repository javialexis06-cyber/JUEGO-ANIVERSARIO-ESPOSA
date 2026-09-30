// Genera los recortes de la cocina de chef (public/cocina/<clave>_<pose>.webp): los invitados y Él y Ella de chef.
// Uso (con el servidor de desarrollo prendido en 5174): node scripts/generar-sprites-cocina.mjs [claves,...]
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

/** Los invitados: contentos esperando, impacientes, bravos y encantados con lo que les sirvieron (los muñecos del súper
 *  solo tienen los ojos normales y los felices: lo bravo se nota en la pose y en lo que se dibuja encima). */
const INVITADO = [
  { nombre: 'feliz', pose: 'reposo', cara: 'feliz' },
  { nombre: 'espera', pose: 'pensando', cara: 'normal' },
  { nombre: 'bravo', pose: 'brazos_cruzados', cara: 'normal' },
  { nombre: 'encantado', pose: 'celebrar', cara: 'feliz' },
];
/** El chef de la casa: concentradísimo, contento, celebrando y asustado (cuando algo se quema). */
const CHEF = [
  { nombre: 'concentrado', pose: 'pensando', cara: 'concentrado', giro: 8 },
  { nombre: 'feliz', pose: 'frotar_manos_a', cara: 'feliz', giro: 8 },
  { nombre: 'celebra', pose: 'celebrar', cara: 'carcajada', giro: 8 },
  { nombre: 'susto', pose: 'boca_abierta', cara: 'sorprendido', giro: 8 },
  { nombre: 'presume', pose: 'jarras', cara: 'presumido', giro: 8 },
];
/** Cada muñeco del súper con la base de la que salió (para prestarle las poses). */
const INVITADOS = { abuelita: 'ella', ejecutivo: 'el', mama: 'ella', deportista: 'ella', adolescente: 'el', nina: 'ella',
  famoso: 'el', ladron: 'el', cajera: 'ella', reponedor: 'el', guardia: 'el', aseo: 'ella' };

const pedidas = process.argv[2]?.split(',');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const p = await b.newPage();
p.on('pageerror', (e) => console.log('ERR', e.message));
await p.goto('http://localhost:5174/mesa.html?sin3d');
mkdirSync('public/cocina', { recursive: true });
const trabajos = [
  ...['el', 'ella'].map((r) => ({ clave: r, salida: `${r}_chef`, pedidos: CHEF, ropa: { cabeza: 'gorro_chef', arriba: 'chaqueta_chef' }, alto: 360 })),
  ...Object.entries(INVITADOS).map(([c, base]) => ({ clave: c, salida: c, pedidos: INVITADO, alto: 300, clipsDe: base })),
].filter((t) => !pedidas || pedidas.includes(t.clave));
for (const t of trabajos) {
  const imgs = await p.evaluate(async ([t]) => {
    const m = await import('/scripts/sprites-cocina.ts');
    return m.generar(t.clave, t.pedidos, { alto: t.alto, ropa: t.ropa, clipsDe: t.clipsDe });
  }, [t]);
  let total = 0;
  for (const [n, url] of Object.entries(imgs)) {
    const buf = Buffer.from(url.split(',')[1], 'base64');
    total += buf.length;
    writeFileSync(`public/cocina/${t.salida}_${n}.webp`, buf);
  }
  console.log(t.salida, Object.keys(imgs).length, `${Math.round(total / 1024)} KB`);
}
await b.close();
