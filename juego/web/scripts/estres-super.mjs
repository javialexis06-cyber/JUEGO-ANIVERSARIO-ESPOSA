// Pruebas de estrés de Súper Manía (super.html):
//  1. partidas guardadas dañadas (el menú debe abrir igual),
//  2. entrar y salir de días muchas veces seguidas (memoria de la tarjeta gráfica y del navegador),
//  3. un día con el piloto y toques al azar encima (pausas, sonido, alertas, lienzo),
//  4. varios días de la tienda y un legendario con el piloto, de principio a fin.
// Uso: node scripts/estres-super.mjs [url de super.html] [carpeta] [partes: 1,2,3,4]
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:5173/super.html';
const carpeta = process.argv[3] ?? 'test-results/estres-super';
const partes = (process.argv[4] ?? '1,2,3,4').split(',');
mkdirSync(carpeta, { recursive: true });
const PRE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({
  executablePath: existsSync(PRE) ? PRE : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info'],
});
const fallas = [];
const revisar = (ok, texto) => {
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${texto}`);
  if (!ok) fallas.push(texto);
};

async function pagina(partida, extra = '') {
  const ctx = await navegador.newContext({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.errores = [];
  p.on('pageerror', (e) => p.errores.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && !m.text().startsWith('Failed to load resource') && p.errores.push(m.text()));
  if (partida !== undefined) await p.addInitScript((v) => localStorage.setItem('supermania-jugable1', v), partida);
  await p.goto(`${url}?bot${extra}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await p.waitForSelector('#menu:not([hidden])', { timeout: 180000 });
  return p;
}

// Partida con todo comprado y los 25 días abiertos (para días avanzados y el legendario)
const MEJOR = JSON.stringify({
  dinero: 3000,
  sitios: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i, 2])),
  estrellas: Object.fromEntries(Array.from({ length: 25 }, (_, i) => [i + 1, [true, true, true]])),
  mejoras: { zapatos: 3, carrito: 3, bodega: 3, alacena: 3, planta: 1, parlante: 1, canastas: 1, caneca2: 1, globos: 1, camara: 1, cajera: 1, aseo: 1, reponedor: 1, guardia: 1 },
  ayudas: { cafe: 3, musica: 3, limpieza: 3 },
  corazones: {},
  lunas: {},
});

// ---------------------------------------------------------------------------
if (partes.includes('1')) {
  console.log('\n1. Partidas guardadas dañadas');
  const casos = {
    'texto que no es JSON': 'esto { no es json',
    null: 'null',
    'una lista': '[]',
    'tipos equivocados': '{"dinero":"mucho","sitios":null,"estrellas":{"1":"si","2":[true]},"mejoras":[],"ayudas":{"cafe":"x"},"corazones":null,"lunas":5}',
    'números imposibles': '{"dinero":-500,"sitios":{"0":99,"2":-1},"estrellas":{"30":[true,true,true]},"mejoras":{"zapatos":1e308}}',
    'versión vieja (carrito suelto)': '{"dinero":50,"sitios":{"0":1},"estrellas":{},"carrito":2}',
  };
  for (const [nombre, valor] of Object.entries(casos)) {
    const p = await pagina(valor).catch((e) => ({ errores: [String(e)], falla: true }));
    let ok = !p.falla && !p.errores.length;
    let detalle = '';
    if (!p.falla) {
      const n = await p.$$eval('#niveles .etiqueta', (l) => l.length);
      const dinero = await p.textContent('#menu-dinero');
      ok = ok && n === 25 && /^\d+$/.test(dinero.trim());
      detalle = ` (25 días: ${n === 25}, monedas «${dinero.trim()}»)`;
      await p.context().close();
    }
    revisar(ok, `Partida «${nombre}»: el menú abre${detalle}${p.errores.length ? ` · errores: ${p.errores.slice(0, 2).join(' | ')}` : ''}`);
  }
}

// ---------------------------------------------------------------------------
if (partes.includes('2')) {
  console.log('\n2. Entrar y salir de días muchas veces');
  const p = await pagina(MEJOR, '&rapido=1');
  const memoria = () =>
    p.evaluate(() => {
      const r = window.__mundo().renderer.info.memory;
      return { geometrias: r.geometries, texturas: r.textures, heap: Math.round((performance.memory?.usedJSHeapSize ?? 0) / 1e6) };
    });
  const ciclo = async (n) => {
    await p.click(`#niveles .etiqueta:nth-child(${n})`);
    await p.click('#btn-abrir');
    await p.waitForSelector('#hud:not([hidden])', { timeout: 120000 });
    await p.waitForTimeout(1500);
    await p.click('#btn-pausa');
    await p.click('#btn-salir');
    await p.waitForSelector('#menu:not([hidden])', { timeout: 120000 });
  };
  for (let i = 0; i < 2; i++) await ciclo(1 + i);
  const antes = await memoria();
  for (let i = 0; i < 10; i++) await ciclo(1 + (i % 25));
  await p.evaluate(() => window.gc?.());
  const despues = await memoria();
  console.log('   memoria antes', JSON.stringify(antes), 'después de 10 días', JSON.stringify(despues));
  revisar(despues.geometrias - antes.geometrias < 60, `Geometrías estables tras 10 entradas y salidas (${antes.geometrias} → ${despues.geometrias})`);
  revisar(despues.texturas - antes.texturas < 40, `Texturas estables (${antes.texturas} → ${despues.texturas})`);
  revisar(!p.errores.length, `Sin errores al entrar y salir${p.errores.length ? `: ${p.errores.slice(0, 3).join(' | ')}` : ''}`);
  // Compras seguidas en la tienda de mejoras (dos toques rápidos)
  await p.click('#btn-mejoras');
  const antesPlata = Number(await p.textContent('#mej-dinero'));
  const botones = await p.$$('#mej-lista .boton-precio:not([disabled])');
  if (botones.length) {
    await Promise.all([botones[0].click().catch(() => {}), botones[0].click().catch(() => {})]);
    await p.waitForTimeout(3000);
  }
  const despuesPlata = Number(await p.textContent('#mej-dinero'));
  const escenas = await p.evaluate(() => window.__mundo().escena.children.filter((o) => o.type === 'Group').length);
  revisar(despuesPlata <= antesPlata && escenas <= 3, `Doble toque comprando: no quedan tiendas repetidas en la escena (${escenas} grupos)`);
  await p.context().close();
}

// ---------------------------------------------------------------------------
if (partes.includes('3')) {
  console.log('\n3. Un día con el piloto y toques al azar encima');
  const p = await pagina(MEJOR, '&rapido=8');
  await p.click('#niveles .etiqueta:nth-child(14)');
  await p.click('#btn-abrir');
  await p.waitForSelector('#hud:not([hidden])', { timeout: 120000 });
  let toques = 0;
  // Sin tarjeta gráfica la página va a menos de un cuadro por segundo y Playwright no alcanza a ver quieto el botón:
  // «Seguir jugando» se toca directo
  const seguir = () => p.evaluate(() => { const b = document.getElementById('btn-continuar'); if (b && b.offsetParent) b.click(); }).catch(() => {});
  const fin = Date.now() + 150000;
  while (Date.now() < fin && !(await p.isVisible('#resultado'))) {
    // Si quedó en pausa (el toque a «Seguir» no alcanzó), se quita antes de seguir tocando: un toque al azar sobre
    // «Salir» sacaría del día, que no es lo que se prueba aquí
    await seguir();
    const r = Math.random();
    if (r < 0.75) await p.mouse.click(Math.random() * 960, 60 + Math.random() * 420).catch(() => {});
    else if (r < 0.83) await p.click('#alertas .alerta', { timeout: 300 }).catch(() => {});
    else if (r < 0.88) await p.click('#ayudas button', { timeout: 300 }).catch(() => {});
    else if (r < 0.92) await p.click('#btn-sonido', { timeout: 300 }).catch(() => {});
    else if (r < 0.96) {
      await p.click('#btn-pausa', { timeout: 300 }).catch(() => {});
      await p.waitForTimeout(300);
      await seguir();
    } else await p.mouse.dblclick(Math.random() * 960, 60 + Math.random() * 420).catch(() => {});
    toques++;
    if (toques % 50 === 0) await p.waitForTimeout(200);
  }
  // Ya sin toques, el día tiene que terminar solo
  await seguir();
  const terminado = await p.waitForSelector('#resultado:not([hidden])', { timeout: 900000 }).then(() => true, () => false);
  const est = await p.evaluate(() => window.__estado());
  if (!terminado) {
    const pantallas = await p.evaluate(() => [...document.querySelectorAll('body *[id]')]
      .filter((e) => !e.hidden && e.parentElement === document.body && getComputedStyle(e).display !== 'none').map((e) => e.id));
    const t1 = est.juego?.tiempo;
    await p.waitForTimeout(5000);
    const t2 = (await p.evaluate(() => window.__estado())).juego?.tiempo;
    console.log('   pantallas a la vista', JSON.stringify(pantallas), '· oculta', await p.evaluate(() => document.hidden), `· tiempo ${t1} → ${t2} en 5 s`);
  }
  await p.screenshot({ path: `${carpeta}/3-toques-al-azar.png`, animations: 'disabled', timeout: 120000 }).catch(() => {});
  revisar(terminado, `El día 14 termina aunque se toque todo al azar (${toques} toques)${terminado ? ` · ${JSON.stringify(est.resultado?.estrellas)}` : ` · estado ${JSON.stringify(est.juego)}`}`);
  revisar(!p.errores.length, `Sin errores con toques al azar${p.errores.length ? `: ${p.errores.slice(0, 3).join(' | ')}` : ''}`);
  await p.context().close();
}

// ---------------------------------------------------------------------------
if (partes.includes('4')) {
  console.log('\n4. Días completos con el piloto');
  const dias = (process.env.DIAS ?? '1,6,8,12,16,20,25').split(',').map(Number);
  const p = await pagina(MEJOR, '&rapido=40');
  const jugar = async (n, legendario = false) => {
    await p.click(`#niveles .etiqueta:nth-child(${n})`);
    if (legendario) await p.click('#btn-legendario');
    await p.click('#btn-abrir');
    await p.waitForSelector('#hud:not([hidden])', { timeout: 120000 });
    const ok = await p.waitForSelector('#resultado:not([hidden])', { timeout: 600000 }).then(() => true, () => false);
    const r = await p.evaluate(() => window.__estado());
    const e = r.resultado;
    revisar(ok && !p.errores.length, `Día ${n}${legendario ? ' legendario' : ''}: ${ok ? `termina · estrellas ${JSON.stringify(e?.estrellas)} · ganancia ${e?.ganancia}${legendario ? ` · luna ${e?.luna}` : ''} · se fueron bravos ${e?.stats?.perdidos}` : `no terminó ${JSON.stringify(r.juego)}`}${p.errores.length ? ` · errores: ${p.errores.slice(0, 2).join(' | ')}` : ''}`);
    p.errores.length = 0;
    await p.click('#btn-rmenu');
    await p.waitForSelector('#menu:not([hidden])', { timeout: 120000 });
  };
  for (const n of dias) await jugar(n);
  await jugar(10, true);
  const sueldo = await p.evaluate(() => localStorage.getItem('nuestro-hogar-sueldo'));
  revisar(Number(sueldo) > 0, `El sueldo para la casa se acumula (${sueldo} monedas esperando)`);
  await p.context().close();
}

console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\nTODO OK');
await navegador.close();
process.exit(fallas.length ? 1 : 0);
