// Prueba de las voces de Él y Ella (docs/sistemas/voces.md): que el guion tenga todos sus audios, que la casa diga
// con su voz lo que sale en el globito y que el narrador de Cien Puertas hable al empezar.
// Uso (con un servidor del juego corriendo): node scripts/probar-voces.mjs [http://localhost:5176]
import { chromium } from '@playwright/test';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5176';
const RAIZ = join(import.meta.dirname, '..');
const errores = [];

// 1. El guion contra la lista: cada frase con voz tiene su audio, y cada audio de la lista existe
const lista = JSON.parse(readFileSync(join(RAIZ, 'public', 'voces', 'lista.json'), 'utf8'));
let conVoz = 0;
for (const f of readdirSync(join(RAIZ, 'voces-guion'))) {
  for (const e of JSON.parse(readFileSync(join(RAIZ, 'voces-guion', f), 'utf8'))) {
    if (!e.d) continue;
    conVoz++;
    if (!lista[e.id]) errores.push(`sin audio: ${f} ${e.id} «${e.t.slice(0, 50)}»`);
  }
}
for (const [id, [archivo, seg]] of Object.entries(lista)) {
  if (!existsSync(join(RAIZ, 'public', 'voces', archivo))) errores.push(`falta el archivo ${archivo}`);
  if (!(seg > 0.2)) errores.push(`audio vacío: ${id} (${seg} s)`);
}
const segundos = Object.values(lista).reduce((a, [, s]) => a + s, 0);
console.log(`guion: ${conVoz} frases con voz · lista: ${Object.keys(lista).length} audios · ${(segundos / 60).toFixed(1)} min`);

const PREINSTALADO = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({
  executablePath: existsSync(PREINSTALADO) ? PREINSTALADO : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
const contexto = await navegador.newContext({ viewport: { width: 844, height: 390 } });
async function abrir(ruta) {
  const p = await contexto.newPage();
  p.setDefaultTimeout(180000);
  p.on('pageerror', (e) => errores.push(`${ruta}: ${e}`));
  p.on('response', (r) => r.url().includes('/voces/') && r.status() >= 400 && errores.push(`${ruta}: ${r.status()} ${r.url()}`));
  await p.goto(`${base}/${ruta}`);
  return p;
}
const sonadas = (p) => p.evaluate(() => window.__voces?.sonadas.length ?? 0);

// 2. La casa: lo que dice el globito suena con su voz
{
  const p = await abrir('index.html?rol=el&local=1&rapido=3');
  await p.waitForFunction(() => window.__listo === true, null, { timeout: 180000 });
  await p.mouse.click(420, 200);
  await p.waitForTimeout(800);
  const antes = await sonadas(p);
  await p.evaluate(() => (window.__mascotas().el.frase = '¡Hola, mimilona! 👋'));
  await p.waitForTimeout(2500);
  await p.evaluate(() => (window.__mascotas().ella.frase = 'Hola, perro lanudo 🐶'));
  await p.waitForTimeout(2500);
  const n = (await sonadas(p)) - antes;
  console.log(`casa: ${n} frases sonaron`, await p.evaluate(() => window.__voces.sonadas.slice(-2)));
  if (n < 2) errores.push(`casa: sonaron ${n} de 2 saludos`);
  await p.close();
}

// 3. Cien Puertas: el narrador habla al empezar la puerta
{
  const p = await abrir('puertas.html?rol=el&local=1');
  await p.getByText('Empezar', { exact: true }).click();
  await p.waitForFunction(() => (window.__voces?.sonadas.length ?? 0) > 0, null, { timeout: 120000 }).catch(() => errores.push('puertas: el narrador no habló'));
  for (let i = 0; i < 2; i++) {
    await p.waitForTimeout(2500);
    await p.mouse.click(420, 300);
    await p.waitForTimeout(400);
    await p.mouse.click(420, 300);
  }
  await p.waitForTimeout(1500);
  console.log(`puertas: ${await sonadas(p)} frases sonaron`, await p.evaluate(() => window.__voces.sonadas.slice(-3)));
  if ((await sonadas(p)) < 2) errores.push('puertas: el narrador no siguió hablando al tocar');
  await p.close();
}

await navegador.close();
if (errores.length) {
  console.log(`\n✗ ${errores.length} problemas:\n` + errores.slice(0, 40).join('\n'));
  process.exit(1);
}
console.log('\n✓ voces bien');
