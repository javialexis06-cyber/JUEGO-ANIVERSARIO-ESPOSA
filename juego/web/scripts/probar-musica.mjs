// Prueba de la música en archivos (docs/sistemas/musica.md): abre cada juego y revisa que suene su pista (y no la
// sintetizada), que todos los archivos de las listas existan y que los efectos carguen.
// Uso (con un servidor del juego corriendo): node scripts/probar-musica.mjs [http://localhost:5176]
import { chromium } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5176';
const RAIZ = join(import.meta.dirname, '..');
const errores = [];

// 1. Las listas contra los archivos
for (const dir of ['musica', 'musica/pareja', 'sfx']) {
  const lista = JSON.parse(readFileSync(join(RAIZ, 'public', dir, 'lista.json'), 'utf8'));
  for (const [id, [archivo, seg]] of Object.entries(lista)) {
    if (!existsSync(join(RAIZ, 'public', dir, archivo))) errores.push(`${dir}: falta ${archivo}`);
    if (!(seg > 0.3)) errores.push(`${dir}: ${id} dura ${seg} s`);
  }
  console.log(`${dir}: ${Object.keys(lista).length} archivos`);
}

const PREINSTALADO = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({
  executablePath: existsSync(PREINSTALADO) ? PREINSTALADO : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
const contexto = await navegador.newContext({ viewport: { width: 844, height: 390 } });
const pista = (p) => p.evaluate(() => window.__musica?.().pista ?? null);
async function esperarPista(p, nombre, quiero, ms = 30000) {
  const ok = await p.waitForFunction((q) => q.includes(window.__musica?.().pista ?? ''), quiero, { timeout: ms }).then(() => true, () => false);
  const v = await pista(p);
  console.log(`${nombre}: ${v ?? '(nada)'}`);
  if (!ok) errores.push(`${nombre}: sonaba «${v}» y se esperaba ${quiero.join(' o ')}`);
}
async function abrir(ruta) {
  const p = await contexto.newPage();
  p.setDefaultTimeout(180000);
  p.on('pageerror', (e) => errores.push(`${ruta}: ${e}`));
  p.on('response', (r) => /\/(musica|sfx)\//.test(r.url()) && r.status() >= 400 && errores.push(`${ruta}: ${r.status()} ${r.url()}`));
  await p.goto(`${base}/${ruta}`);
  return p;
}

// La casa: de día o de noche según la hora
{
  const p = await abrir('index.html?rol=el&local=1&rapido=3');
  await p.waitForFunction(() => window.__listo === true, null, { timeout: 180000 });
  await p.mouse.click(420, 200);
  await esperarPista(p, 'casa', ['casa-dia', 'casa-noche', 'casa-patio']);
  await p.close();
}
// Súper Manía: la canción en el menú
{
  const p = await abrir('super.html');
  await p.waitForTimeout(4000);
  await p.mouse.click(420, 200);
  await esperarPista(p, 'súper (menú)', ['super-cancion']);
  await p.close();
}
// La mesa: la del menú
{
  const p = await abrir('mesa.html');
  await p.waitForTimeout(3000);
  await p.mouse.click(420, 30);
  await esperarPista(p, 'mesa (menú)', ['mesa-menu']);
  await p.close();
}
// Cien Puertas: el menú y el capítulo 1
{
  const p = await abrir('puertas.html?rol=el&local=1');
  await p.waitForTimeout(4000);
  await p.mouse.click(420, 380);
  await esperarPista(p, 'puertas (menú)', ['puertas-menu']);
  await p.getByText('Empezar', { exact: true }).click();
  await esperarPista(p, 'puertas (puerta 1)', ['puertas-cap1']);
  await p.close();
}
// Sangre y Ceniza: el menú
{
  const p = await abrir('sangre.html');
  await p.waitForTimeout(5000);
  await p.mouse.click(420, 200);
  await esperarPista(p, 'sangre (menú)', ['sangre-menu']);
  await p.close();
}
// Los efectos de las reacciones: se cargan al primer sonido
{
  const p = await abrir('mesa.html');
  await p.waitForTimeout(2500);
  await p.mouse.click(420, 30);
  const n = await p.evaluate(async () => {
    const m = await import('/src/reacciones/sonidos.ts');
    m.sonar('beso');
    await new Promise((ok) => setTimeout(ok, 3000));
    const r = await fetch('./sfx/lista.json').then((x) => x.json());
    return Object.keys(r).length;
  });
  console.log(`efectos en la lista: ${n}`);
  if (n < 40) errores.push(`efectos: solo ${n}`);
  await p.close();
}

await navegador.close();
if (errores.length) {
  console.log(`\n✗ ${errores.length} problemas:\n` + errores.slice(0, 30).join('\n'));
  process.exit(1);
}
console.log('\n✓ música bien');
