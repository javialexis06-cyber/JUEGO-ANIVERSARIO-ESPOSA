// Prueba de Nuestro Hogar con dos jugadores simulados en el mismo navegador (modo local:
// comparten el almacenamiento y se hablan por BroadcastChannel, como dos celulares).
// Uso: node scripts/probar-casa.mjs [url] [carpeta] [ancho]x[alto]
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:5173/index.html';
const carpeta = process.argv[3] ?? 'test-results/casa';
const [ancho, alto] = (process.argv[4] ?? '1280x720').split('x').map(Number);
mkdirSync(carpeta, { recursive: true });

const PREINSTALADO = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({
  executablePath: existsSync(PREINSTALADO) ? PREINSTALADO : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const contexto = await navegador.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1 });
const errores = [];
async function abrir(rol) {
  const p = await contexto.newPage();
  // Sin tarjeta gráfica (y con otras pruebas corriendo) cargar y hacer clic puede tardar más de 30 s
  p.setDefaultTimeout(180000);
  p.on('pageerror', (e) => errores.push(`${rol}: ${e}`));
  p.on('console', (m) => m.type() === 'error' && !m.text().startsWith('Failed to load resource') && errores.push(`${rol}: ${m.text()}`));
  p.on('response', (r) => r.status() >= 400 && errores.push(`${rol}: ${r.status()} ${r.url()}`));
  const t0 = Date.now();
  await p.goto(`${url}?rol=${rol}&local=1&rapido=${process.env.RAPIDO ?? 3}`);
  await p.waitForFunction(() => window.__listo === true, null, { timeout: 180000 });
  console.log(rol, 'lista en', ((Date.now() - t0) / 1000).toFixed(1), 's');
  return p;
}
const foto = (p, n) => p.screenshot({ path: `${carpeta}/${n}.png`, animations: 'disabled', timeout: 120000 }).catch((e) => errores.push(`foto ${n}: ${e.message.split('\n')[0]}`));
const estado = (p) => p.evaluate(() => window.__casa());
/** Espera a que el personaje llegue y termine de acomodarse (o a que el mimo esté en su pose). */
const quieto = async (p, rol, extra = 1200) => {
  await p.waitForFunction((r) => window.__quieto(r), rol, { timeout: 90000 }).catch(() => errores.push(`${rol} no se quedó quieto`));
  await p.waitForTimeout(extra);
};
const posando = async (p, rol) => {
  await p.waitForFunction((r) => window.__fase(r) === 'pose', rol, { timeout: 90000 }).catch(() => errores.push(`${rol} no llegó a la pose`));
  await p.waitForTimeout(500);
};
// Sin tarjeta gráfica la casa va a ~1 cuadro por segundo: Playwright necesita varios cuadros para ver el botón quieto
const clic = async (p, sel) => {
  await p.click(sel, { timeout: 90000 });
  await p.waitForTimeout(300);
};

// Casa limpia
const limpia = await contexto.newPage();
await limpia.goto(url.replace(/\?.*$/, ''));
// Con monedas de sobra para las compras de la prueba (una casa nueva empieza con 40)
await limpia.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('nuestro-hogar-local', JSON.stringify({ casa: { monedas: 150 } }));
});
await limpia.close();

const el = await abrir('el');
await el.waitForTimeout(4000);
await foto(el, '01-el-sala');
console.log('estado inicial', JSON.stringify(await estado(el)));

// Él come en la cocina
await clic(el, '[data-cuarto="cocina"]');
await clic(el, '[data-accion="comer"]');
await foto(el, '02-despensa');
await clic(el, '[data-comer="pan"]');
await quieto(el, 'el');
await foto(el, '03-el-come');

// Compra en la tienda: flores, un marco y un osito de decoración
await clic(el, '[data-accion="tienda"]');
await foto(el, '04-tienda');
await clic(el, '[data-p="regalo"]');
await clic(el, '[data-comprar="flores"]');
await clic(el, '[data-p="deco"]');
await clic(el, '[data-comprar="cuadro_corazon"]');
await clic(el, '[data-comprar="florero"]');
await clic(el, '#hoja-cerrar');
console.log('después de comprar', JSON.stringify((await estado(el)).inventario), (await estado(el)).monedas);

// Llega Ella
const ella = await abrir('ella');
await ella.waitForTimeout(3000);
await foto(ella, '05-ella-llega');

// Él le da un abrazo y un beso a Ella (los mimos son en el mismo cuarto: Él vuelve a la sala, donde está Ella)
await el.bringToFront();
await clic(el, '[data-cuarto="sala"]');
await quieto(el, 'el');
await clic(el, '#chip-pareja');
await foto(el, '06-hoja-pareja');
await clic(el, '[data-mimo="abrazo"]');
await posando(el, 'el');
await foto(el, '07-abrazo-el');
await ella.bringToFront();
await ella.waitForTimeout(600);
await foto(ella, '08-abrazo-visto-por-ella');
await el.bringToFront();
await el.waitForTimeout(3500);
await clic(el, '#chip-pareja');
await clic(el, '[data-mimo="beso"]');
await posando(el, 'el');
await foto(el, '09-beso');

// Él le regala flores con un mensaje
await el.waitForTimeout(3000);
await clic(el, '#chip-pareja');
await clic(el, '[data-hoja="regalar"]');
await el.fill('#regalo-mensaje', 'Para la mujer más linda de Medellín');
await clic(el, '#form-regalo button[type="submit"]');
await posando(el, 'el');
await foto(el, '10-regalo');
await ella.bringToFront();
await ella.waitForTimeout(1500);
await foto(ella, '11-ella-recibe');
await clic(ella, '[data-accion="abrir-regalo"]');
await ella.waitForTimeout(800);
await foto(ella, '12-ella-abre');
await clic(ella, '[data-cerrar]');

// Ella deja una nota en la nevera
await clic(ella, '[data-cuarto="cocina"]');
await clic(ella, '[data-accion="notas"]');
await ella.fill('#nota-texto', 'Te extraño, Bucaramanga queda lejos pero te llevo conmigo');
await clic(ella, '#form-nota button[type="submit"]');
await foto(ella, '13-nota');
await clic(ella, '#hoja-cerrar');
await quieto(ella, 'ella');
await foto(ella, '14-nevera');

// Él decora la sala
await el.bringToFront();

await clic(el, '[data-cuarto="sala"]');
await clic(el, '[data-accion="decorar"]');
await el.waitForTimeout(500);
await foto(el, '15-modo-decorar');
for (const [sitio, item] of [['sala_cuadro', 'cuadro_corazon'], ['sala_mesa', 'florero']]) {
  const pt = await el.evaluate((id) => window.__sitio(id), sitio);
  await el.mouse.click(pt.x, pt.y);
  await el.waitForTimeout(400);
  await foto(el, `15-decorar-${sitio}`);
  await clic(el, `[data-poner="${item}"]`);
  await el.waitForTimeout(1200);
}
await clic(el, '[data-accion="decorar"]');
await el.waitForTimeout(800);
await foto(el, '15-sala-decorada');

// Ella se baña y se va a dormir
await ella.bringToFront();
await clic(ella, '[data-cuarto="bano"]');
await clic(ella, '[data-accion="banar"]');
await quieto(ella, 'ella');
await foto(ella, '16-ella-bano');
await ella.evaluate(() => {
  // cansarla para poder dormir
  const k = 'nuestro-hogar-local';
  const d = JSON.parse(localStorage.getItem(k));
  d.personajes.ella.energia = 30;
  localStorage.setItem(k, JSON.stringify(d));
});
await ella.reload();
await ella.waitForFunction(() => window.__listo === true, null, { timeout: 180000 });
await clic(ella, '[data-cuarto="cuarto"]');
await clic(ella, '[data-accion="dormir"]');
await quieto(ella, 'ella', 2500);
await foto(ella, '17-ella-duerme');

// Él se sienta en el sofá
await el.bringToFront();
await clic(el, '[data-cuarto="sala"]');
await clic(el, '[data-accion="tv"]');
await quieto(el, 'el', 2000);
await foto(el, '18-el-sofa');

// Menú, fechas y minijuegos
await clic(el, '#btn-menu');
await foto(el, '19-menu');
await clic(el, '[data-hoja="fechas"]');
await el.fill('#aniv-fecha', '2021-10-02');
await clic(el, '#form-aniversario button');
await el.waitForTimeout(500);
await foto(el, '20-fechas');
await clic(el, '#hoja-cerrar');
await clic(el, '#btn-menu');
await clic(el, '[data-hoja="juegos"]');
await foto(el, '21-minijuegos');
await clic(el, '#hoja-cerrar');

console.log('final el', JSON.stringify(await estado(el)));
console.log('final ella', JSON.stringify(await estado(ella)));
console.log(errores.length ? `ERRORES:\n${errores.slice(0, 20).join('\n')}` : 'sin errores');
await navegador.close();
