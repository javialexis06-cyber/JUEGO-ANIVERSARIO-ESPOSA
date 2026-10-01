// Genera los recortes de la cocina de chef (public/cocina/gente/<clave>_<pose>.webp): los invitados con sus poses
// (caminar, esperar, impacientarse, comer y reaccionar a la calificación), la pareja cuando llega de visita y Él y
// Ella de chef (las caritas de la esquina y el «modo chef» grande).
// Uso (con el servidor de desarrollo prendido): node scripts/generar-sprites-cocina.mjs [claves,...] [puerto]
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

/** Los invitados (los muñecos del súper solo tienen los ojos normales y los felices: lo bravo se nota en la pose). */
const INVITADO = [
  { nombre: 'camina_a', pose: 'caminar_a', cara: 'feliz', giro: 24 },
  { nombre: 'camina_b', pose: 'caminar_b', cara: 'feliz', giro: 24 },
  { nombre: 'feliz', pose: 'reposo', cara: 'feliz' },
  { nombre: 'espera', pose: 'reloj', cara: 'normal' },
  { nombre: 'impaciente', pose: 'impaciente_a', cara: 'enojado' },
  { nombre: 'bravo', pose: 'brazos_cruzados', cara: 'enojado' },
  { nombre: 'come_a', pose: 'comer_a', cara: 'feliz', giro: -10 },
  { nombre: 'come_b', pose: 'comer_b', cara: 'feliz', giro: -10 },
  { nombre: 'encantado', pose: 'aplauso_a', cara: 'carcajada' },
  { nombre: 'contento', pose: 'pulgares_a', cara: 'feliz' },
  { nombre: 'regular', pose: 'encogerse', cara: 'nervioso' },
];
/** La pareja de visita: más expresiva (tiene todas las caras). */
const PAREJA = [
  { nombre: 'camina_a', pose: 'caminar_a', cara: 'feliz', giro: 24 },
  { nombre: 'camina_b', pose: 'caminar_b', cara: 'feliz', giro: 24 },
  { nombre: 'feliz', pose: 'saludo_a', cara: 'feliz' },
  { nombre: 'espera', pose: 'pensando', cara: 'aburrido' },
  { nombre: 'impaciente', pose: 'impaciente_a', cara: 'puchero' },
  { nombre: 'bravo', pose: 'enojo_a', cara: 'enojado' },
  { nombre: 'come_a', pose: 'comer_a', cara: 'feliz', giro: -10 },
  { nombre: 'come_b', pose: 'comer_b', cara: 'beso', giro: -10 },
  { nombre: 'encantado', pose: 'beso_volado_a', cara: 'beso' },
  { nombre: 'contento', pose: 'pulgares_a', cara: 'guino' },
  { nombre: 'regular', pose: 'encogerse', cara: 'nervioso' },
];
/** El chef de la casa: concentradísimo, contento, celebrando, asustado (cuando algo se quema) y el del «modo chef». */
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

const pedidas = process.argv[2] && process.argv[2] !== 'todas' ? process.argv[2].split(',') : null;
const puerto = process.argv[3] ?? '5174';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage();
p.on('pageerror', (e) => console.log('ERR', e.message));
await p.goto(`http://localhost:${puerto}/mesa.html?sin3d`);
mkdirSync('public/cocina/gente', { recursive: true });
const trabajos = [
  ...['el', 'ella'].map((r) => ({ clave: r, salida: `${r}_chef`, pedidos: CHEF, ropa: { cabeza: 'gorro_chef', arriba: 'chaqueta_chef' }, alto: 420 })),
  ...['el', 'ella'].map((r) => ({ clave: r, salida: `${r}_chef`, pedidos: [{ nombre: 'intro', pose: 'puno_a', cara: 'concentrado', giro: 4 }], ropa: { cabeza: 'gorro_chef', arriba: 'chaqueta_chef' }, alto: 760 })),
  ...['el', 'ella'].map((r) => ({ clave: r, salida: `pareja_${r}`, pedidos: PAREJA, alto: 540 })),
  ...Object.entries(INVITADOS).map(([c, base]) => ({ clave: c, salida: c, pedidos: INVITADO, alto: 520, clipsDe: base })),
].filter((t) => !pedidas || pedidas.includes(t.salida) || pedidas.includes(t.clave));
for (const t of trabajos) {
  const imgs = await p.evaluate(async ([t]) => {
    const m = await import('/scripts/sprites-cocina.ts');
    return m.generar(t.clave, t.pedidos, { alto: t.alto, ropa: t.ropa, clipsDe: t.clipsDe });
  }, [t]);
  let total = 0;
  for (const [n, url] of Object.entries(imgs)) {
    const buf = Buffer.from(url.split(',')[1], 'base64');
    total += buf.length;
    writeFileSync(`public/cocina/gente/${t.salida}_${n}.webp`, buf);
  }
  console.log(t.salida, Object.keys(imgs).length, `${Math.round(total / 1024)} KB`);
}
await b.close();
