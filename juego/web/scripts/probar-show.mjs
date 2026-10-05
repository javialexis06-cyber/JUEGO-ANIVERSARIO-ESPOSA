// Prueba de «El Show de Nosotros» en un solo celular: primero Ella juega SOLA (sus respuestas quedan en el sobre),
// después Él juega SOLO contra lo que Ella dejó guardado (se revelan) y al final los DOS AQUÍ en el mismo celular
// (se pasan el celular con el telón). Un bot toca los botones. Revisa que cada show termine, que el libro guarde lo
// de cada uno, que jugando solo se revelen las que el otro ya había contestado y que la pregunta del día funcione.
// Uso: node scripts/probar-show.mjs [url] [carpeta]
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:5174/mesa.html';
const carpeta = process.argv[3] ?? 'test-results/show';
mkdirSync(carpeta, { recursive: true });
const errores = [];
const revisar = (ok, texto) => {
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${texto}`);
  if (!ok) errores.push(texto);
};

const BOT = () => {
  const libre = (b) => b && !b.disabled && b.offsetParent !== null;
  const cortina = document.querySelector('.show-cortina:not([hidden]) button');
  if (libre(cortina)) return cortina.click();
  const panel = document.querySelector('.show-panel:not([hidden])');
  if (!panel || panel.classList.contains('sale')) return;
  const ops = [...panel.querySelectorAll('.show-op')].filter(libre);
  if (ops.length && !panel.querySelector('.show-opciones.decidido')) return ops[Math.floor(Math.random() * ops.length)].click();
  const rango = panel.querySelector('input[type=range]');
  if (rango && libre(panel.querySelector('.show-termo-ok'))) {
    rango.value = String(1 + Math.floor(Math.random() * 10));
    rango.dispatchEvent(new Event('input'));
    return panel.querySelector('.show-termo-ok').click();
  }
  const texto = panel.querySelector('.show-abierta input');
  if (texto && !texto.value) {
    texto.value = 'wafles con fresas';
    panel.querySelector('.show-abierta').requestSubmit();
  }
};

const PRE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({
  executablePath: existsSync(PRE) ? PRE : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const ctx = await navegador.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
// Un celular sin casa en línea: el libro queda «suelto» en este celular (sirve igual para jugar solo y los dos aquí)
await ctx.addInitScript(() => {
  if (!sessionStorage.getItem('limpio')) {
    localStorage.clear();
    sessionStorage.setItem('limpio', '1');
  }
});

async function unShow(rol, modo, nombre) {
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errores.push(`${nombre}: ${e}`));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|WebGL|GL_/.test(m.text()) && errores.push(`${nombre}: ${m.text()}`));
  await p.goto(`${url}?juego=show&modo=${modo}&rol=${rol}&rapido=4&sin3d`, { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('#show', { timeout: 60000 });
  const t0 = Date.now();
  let fin = false;
  let foto = 0;
  while (!fin && Date.now() - t0 < 15 * 60_000) {
    await p.evaluate(BOT).catch(() => {});
    if (Date.now() - t0 > (foto + 1) * 45_000 && foto < 3) {
      foto++;
      await p.evaluate(() => window.__show?.show?.estudio?.pintar()).catch(() => {});
      await p.screenshot({ path: `${carpeta}/${nombre}-${foto}.png` });
    }
    fin = await p.evaluate(() => !!document.querySelector('.show-final:not([hidden]) .show-final-carta')).catch(() => false);
    await new Promise((ok) => setTimeout(ok, 250));
  }
  revisar(fin, `${nombre}: el show termina`);
  const r = await p.evaluate(() => {
    const s = window.__show.show;
    return { res: s.resultados.filter(Boolean).length, pend: s.resultados.filter((x) => x?.pendiente).length, puntos: s.puntos };
  });
  await p.evaluate(() => window.__show?.show?.estudio?.pintar()).catch(() => {});
  await p.screenshot({ path: `${carpeta}/${nombre}-final.png` });
  await p.close();
  return r;
}

const libro = () =>
  ctx.pages()[0]?.evaluate(() => JSON.parse(localStorage.getItem('show-libro-suelto') ?? 'null')) ?? null;

// 1. Ella sola: todo lo que dependa de Él queda en el sobre
const a = await unShow('ella', 'ia', 'ella-sola');
revisar(a.pend >= 10, `Ella sola: las preguntas sin respuesta de Él quedan en el sobre (${a.pend})`);
const p0 = await ctx.newPage();
await p0.goto(`${url}?rapido=4`, { waitUntil: 'domcontentloaded' });
let lib = await p0.evaluate(() => JSON.parse(localStorage.getItem('show-libro-suelto') ?? 'null'));
revisar(lib && Object.keys(lib.r.ella).length > 15, `El libro guarda lo de Ella (${lib ? Object.keys(lib.r.ella).length : 0})`);

// 2. Él solo: le salen primero las que Ella ya contestó y se revelan
const b = await unShow('el', 'ia', 'el-solo');
revisar(b.res - b.pend >= 20, `Él solo: se revelan las que Ella ya había contestado (${b.res - b.pend} de ${b.res})`);

// 3. Los dos aquí, pasándose el celular
const c = await unShow('el', 'local', 'los-dos');
revisar(c.pend === 0, 'Los dos aquí: nada queda en el sobre');
lib = await p0.evaluate(() => JSON.parse(localStorage.getItem('show-libro-suelto') ?? 'null'));
revisar((lib?.ep ?? []).length === 3, `Tres episodios en el libro (${(lib?.ep ?? []).length})`);

// 4. La pregunta del día desde la cabina: Él contesta, luego Ella, y se revela
for (const rol of ['el', 'ella']) {
  await p0.goto(`${url}?rol=${rol}&rapido=4`, { waitUntil: 'domcontentloaded' });
  await p0.click('[data-modo="ia"]');
  await p0.click('[data-juego="show"]');
  await p0.waitForSelector('.cabina [data-c="dia"]');
  await p0.evaluate(() => document.querySelector('.cabina [data-c="dia"]').click());
  await p0.waitForSelector('.cabina-dia-cuerpo .dia-op, .cabina-dia-cuerpo input[type=range]', { timeout: 30000 });
  for (let paso = 0; paso < 2; paso++) {
    await p0.waitForTimeout(400);
    await p0.evaluate(() => {
      const c = document.querySelector('.cabina-dia-cuerpo');
      const op = c.querySelector('.dia-op');
      if (op) op.click();
      else c.querySelector('[data-listo]')?.click();
    });
  }
  await p0.waitForSelector(rol === 'el' ? '.dia-espera' : '.dia-revela', { timeout: 30000 }).catch(() => {});
  await p0.screenshot({ path: `${carpeta}/dia-${rol}.png` });
}
revisar(await p0.evaluate(() => !!document.querySelector('.dia-revela')), 'La pregunta del día se revela cuando contestan los dos');
// 5. El libro
await p0.goto(`${url}?libro&rol=el`, { waitUntil: 'domcontentloaded' });
await p0.waitForSelector('.libro .libro-ficha', { timeout: 30000 }).catch(() => {});
await p0.screenshot({ path: `${carpeta}/libro.png` });
revisar(await p0.evaluate(() => document.querySelectorAll('.libro .libro-ficha').length > 40), 'El libro muestra los episodios');
console.log(errores.length ? `ERRORES:\n${errores.join('\n')}` : 'Sin errores');
await navegador.close();
process.exit(errores.length ? 1 : 0);
