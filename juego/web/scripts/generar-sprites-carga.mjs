// Genera los recortes de las pantallas de carga (public/carga/<rol>_<pose>.webp y public/carga/recortes.json con
// dónde quedan los pies de cada uno). Uso (con el servidor de desarrollo en 5174): node scripts/generar-sprites-carga.mjs
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const POSES = [
  ['corre_a', 'caminar_a', 'carcajada'], ['corre_b', 'caminar_b', 'carcajada'], ['lanza', 'lanzar', 'presumido'], ['salta', 'salto', 'carcajada'],
  ['agacha', 'preparar_salto', 'sorprendido'], ['tirado', 'tirado', 'carcajada'], ['esquiva', 'encogerse', 'sorprendido'],
  ['risa_a', 'risita_a', 'carcajada'], ['risa_b', 'risita_b', 'carcajada'], ['baile_a', 'baile_a', 'carcajada'], ['baile_b', 'baile_b', 'carcajada'],
  ['enojo', 'enojo_a', 'enojado'], ['enojo_b', 'enojo_b', 'enojado'], ['puchero', 'puchero', 'puchero'], ['susto', 'boca_abierta', 'sorprendido'],
  ['musculo', 'musculo', 'presumido'], ['desmayo', 'desmayo', 'dormido'], ['agita_a', 'agitar_a', 'feliz'], ['agita_b', 'agitar_b', 'feliz'],
  ['beso_volado', 'beso_volado_a', 'beso'], ['senala', 'senalar_a', 'carcajada'], ['sentado', 'sentado_feliz', 'feliz'], ['regalo', 'regalo', 'feliz'],
  ['duerme', 'sentado', 'dormido'], ['pulgares', 'pulgares_a', 'guino'], ['timido', 'encogerse', 'nervioso'], ['beso', 'beso', 'beso'],
  ['aplauso', 'aplauso_a', 'carcajada'], ['sopla', 'soplar', 'beso'], ['reposo', 'reposo', 'feliz'], ['piensa', 'pensando', 'concentrado'],
  ['llora', 'llorar_a', 'llorando'], ['frota', 'frotar_manos_a', 'presumido'],
].map(([nombre, pose, cara]) => ({ nombre, pose, cara }));

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const p = await b.newPage();
p.on('pageerror', (e) => console.log('ERR', e.message));
await p.goto('http://localhost:5174/mesa.html?sin3d');
mkdirSync('public/carga', { recursive: true });
const datos = {};
for (const rol of ['el', 'ella']) {
  const imgs = await p.evaluate(async ([rol, pedidos]) => {
    const m = await import('/scripts/sprites-carga.ts');
    return m.generar(rol, pedidos, 200);
  }, [rol, POSES]);
  let total = 0;
  for (const [n, r] of Object.entries(imgs)) {
    const buf = Buffer.from(r.url.split(',')[1], 'base64');
    total += buf.length;
    writeFileSync(`public/carga/${rol}_${n}.webp`, buf);
    datos[`${rol}_${n}`] = [r.w, r.h, r.ox, r.oy];
  }
  console.log(rol, Object.keys(imgs).length, `${Math.round(total / 1024)} KB`);
}
writeFileSync('src/carga_recortes.json', JSON.stringify(datos));
await b.close();
