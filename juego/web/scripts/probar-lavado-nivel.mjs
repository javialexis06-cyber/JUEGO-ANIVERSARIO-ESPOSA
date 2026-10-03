// Prueba de «Lavarse la cara» con el dedo: que las capas de subir de nivel, cofres y cartas de amor se cierren
// siempre y el juego siga. En un celular emulado (táctil, 844×390) con toques de verdad:
//   1. sube de nivel 20 veces seguidas escogiendo con un toque,
//   2. una cola de muchos niveles juntos (con dobles toques rápidos, volver a tirar, saltar y vetar),
//   3. un cofre, un cofre que llega mientras escoge cartas y una carta de amor,
//   4. pausa y segundo plano con las cartas abiertas,
// y al final mira que no quede ninguna capa encima, que el reloj corra y que el joystick mueva al personaje.
// Después repite lo básico con el mouse (versión de computador).
// Uso (con el servidor de desarrollo prendido): node scripts/probar-lavado-nivel.mjs [url] [carpeta]
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';

const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const carpeta = process.argv[3] ?? 'test-results/lavado-nivel';
mkdirSync(carpeta, { recursive: true });
const errores = [];
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const revisar = (ok, texto) => {
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${texto}`);
  if (!ok) errores.push(texto);
};

// Una página mínima con solo el lavado (con la tienda de volver a tirar, saltar y vetar comprada)
const PAGINA = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#c7c1ba"><script type="module">
import '/src/estilos.css';
const L = await import('/src/casa/lavado.ts');
const prog = L.progresoLavadoNuevo('ella');
prog.poderes = { tirar: 5, saltar: 5, vetar: 5 };
window.__arrancar = () => L.jugarLavado({ rol: 'ella', nombres: { el: 'Él', ella: 'Ella' }, progreso: prog, guardar: async () => {}, pareja: null })
  .then((r) => (window.__resultado = r));
window.__pagina = true;
</script></body></html>`;

const PRE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({
  executablePath: existsSync(PRE) ? PRE : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

async function partida(tactil) {
  const nombre = tactil ? 'dedo' : 'mouse';
  const ctx = await navegador.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: tactil, isMobile: tactil });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errores.push(`${nombre}: ${e}`));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|403/.test(m.text()) && errores.push(`${nombre}: ${m.text()}`));
  await p.route(/_lavado_nivel\.html/, (r) => r.fulfill({ contentType: 'text/html', body: PAGINA }));
  await p.goto(`${url}/_lavado_nivel.html?sin3d`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await p.waitForFunction(() => window.__pagina, null, { timeout: 120000 });

  // Un toque (o clic) en el centro de lo que se ve
  const tocar = async (sel) => {
    const b = await p.locator(sel).first().boundingBox();
    if (!b) return false;
    const x = b.x + b.width / 2, y = b.y + b.height / 2;
    if (tactil) await p.touchscreen.tap(x, y);
    else await p.mouse.click(x, y);
    return true;
  };
  const estado = () => p.evaluate(() => window.__lavado.actual.probar('nada'));
  const probar = (que, v) => p.evaluate(([q, v]) => window.__lavado.actual.probar(q, v), [que, v]);
  const visible = (sel) => p.evaluate((s) => { const e = document.querySelector(s); return !!e && !e.hidden; }, sel);
  const capasAbiertas = () => p.evaluate(() => [...document.querySelectorAll('.lv-capa')].filter((c) => !c.hidden).map((c) => c.className));
  /** Espera a que la capa se vea y un ratico más (las cartas no aceptan toques en sus primeras décimas). */
  const verCapa = async (sel, ms = 4000) => (await esperarQue(() => visible(sel), ms)) && (await espera(320), true);
  const esperarQue = async (fn, ms, cada = 100) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if (await fn().catch(() => false)) return true;
      await espera(cada);
    }
    return false;
  };
  /** Escoge todo lo que salga (cartas, cofres, cartas de amor) hasta que no quede nada; devuelve cuántas cosas tocó. */
  const escogerTodo = async (doble = false, max = 60) => {
    let n = 0;
    for (let k = 0; k < max; k++) {
      const s = await estado();
      const yo = s.jug[0];
      if (!yo.opciones && !yo.cofre && !yo.carta && !yo.pend && !s.pausa) {
        // ¿quedó alguna capa encima aunque ya no haya nada que escoger?
        if (await esperarQue(async () => (await capasAbiertas()).length === 0, 1500)) return n;
        return -1;
      }
      if (yo.opciones && (await verCapa('.lv-c-nivel', 2000))) {
        await tocar('.lv-c-nivel .lv-carta');
        if (doble) await tocar('.lv-c-nivel .lv-carta');
        n++;
      } else if (yo.cofre && (await esperarQue(() => p.evaluate(() => document.querySelector('.lv-c-cofre [data-listo]')?.style.visibility === 'visible'), 8000))) {
        await tocar('.lv-c-cofre [data-listo]');
        if (doble) await tocar('.lv-c-cofre [data-listo]');
        n++;
      } else if (yo.carta && (await verCapa('.lv-c-carta', 2000))) {
        await tocar('.lv-c-carta .lv-sobre');
        n++;
      }
      // Lo que se tocó tiene que cambiar ya (no puede quedarse la misma capa)
      await esperarQue(async () => (await estado()).jug[0].acciones !== yo.acciones, 2500);
      await espera(60);
    }
    return -1;
  };
  const sigueCorriendo = async (texto) => {
    const capas = await capasAbiertas();
    const t0 = (await estado()).t;
    await espera(1500);
    const s = await estado();
    revisar(capas.length === 0 && !s.pausa && s.t - t0 > 0.5, `${nombre} · ${texto} (capas: ${capas.join(' ') || 'ninguna'}, reloj ${t0.toFixed(1)} → ${s.t.toFixed(1)})`);
  };

  await p.evaluate(() => void window.__arrancar());
  await p.waitForSelector('.lv-menu:not([hidden]) [data-m="jugar"]', { timeout: 90000 });
  await tocar('[data-m="jugar"]');
  await p.waitForFunction(() => window.__lavado?.actual?.m, null, { timeout: 90000 });
  await espera(1500);
  await probar('aguante');

  // 1. Veinte subidas de nivel seguidas, cada una con su toque
  let bien = 0;
  const veces = tactil ? 20 : 8;
  for (let k = 0; k < veces; k++) {
    await probar('subir');
    if (!(await verCapa('.lv-c-nivel'))) break;
    if (k === 0) await p.screenshot({ path: `${carpeta}/${nombre}-1-cartas.png` });
    const antes = (await estado()).jug[0].acciones;
    await tocar('.lv-c-nivel .lv-carta');
    const cerro = await esperarQue(async () => !(await visible('.lv-c-nivel')) && (await estado()).jug[0].acciones > antes, 3000);
    const s = await estado();
    if (cerro && !s.pausa) bien++;
    else {
      await p.screenshot({ path: `${carpeta}/${nombre}-x-trabado-${k}.png` });
      break;
    }
    await probar('aguante');
  }
  revisar(bien === veces, `${nombre} · ${bien}/${veces} subidas de nivel seguidas: la capa se cierra y el juego sigue`);
  await sigueCorriendo('después de las subidas de nivel el reloj corre sin capas encima');

  if (tactil) {
    // 2. Una cola de muchos niveles juntos, con dobles toques rápidos
    await p.evaluate(() => { const m = window.__lavado.actual.m; m.xp += 2500; });
    await verCapa('.lv-c-nivel');
    revisar((await estado()).jug[0].pend >= 3, `${nombre} · subió varios niveles de un solo golpe (${(await estado()).jug[0].pend + 1} en cola)`);
    const nCola = await escogerTodo(true);
    revisar(nCola > 3, `${nombre} · cola de niveles con dobles toques: ${nCola} escogidos y no queda nada abierto`);
    await sigueCorriendo('después de la cola');

    // Volver a tirar, saltar y vetar
    await probar('subir');
    await verCapa('.lv-c-nivel');
    let a0 = (await estado()).jug[0].acciones;
    await tocar('[data-accion="tirar"]');
    revisar(await esperarQue(async () => (await estado()).jug[0].acciones > a0 && (await visible('.lv-c-nivel')), 3000), `${nombre} · volver a tirar pinta cartas nuevas`);
    await espera(320);
    a0 = (await estado()).jug[0].acciones;
    await tocar('[data-accion="vetar"]');
    // (se veta una carta de arma o pasiva: la arepa y las gotas no se pueden vetar)
    const kv = await p.evaluate(() => window.__lavado.actual.m.jug[0].opciones.findIndex((o) => o.tipo === 'arma' || o.tipo === 'pasiva'));
    await tocar(`.lv-c-nivel .lv-carta[data-k="${Math.max(0, kv)}"]`);
    revisar(await esperarQue(async () => (await estado()).jug[0].acciones > a0 && (await visible('.lv-c-nivel')), 3000), `${nombre} · vetar una carta pinta otras`);
    await espera(320);
    await p.screenshot({ path: `${carpeta}/${nombre}-2-vetar.png` });
    await tocar('[data-accion="saltar"]');
    revisar(await esperarQue(async () => !(await visible('.lv-c-nivel')), 3000), `${nombre} · saltar cierra las cartas`);
    await sigueCorriendo('después de tirar, vetar y saltar');

    // 3. Un cofre; un cofre que llega mientras escoge cartas; una carta de amor
    await probar('cofre', 2);
    await p.evaluate(() => { const j = window.__lavado.actual.m.jug[0]; j.x += 30; });
    revisar(await esperarQue(() => visible('.lv-c-cofre'), 6000), `${nombre} · se abre el cofre`);
    await p.screenshot({ path: `${carpeta}/${nombre}-3-cofre.png` });
    revisar((await escogerTodo()) >= 1, `${nombre} · el cofre se cierra con «¡Listo!»`);
    await sigueCorriendo('después del cofre');
    await probar('subir');
    await verCapa('.lv-c-nivel');
    await p.evaluate(() => { const m = window.__lavado.actual.m; m.jug[0].cofresPend.push(2, 3); });
    // (tocar el cofre a medio girar lo adelanta)
    await tocar('.lv-c-nivel .lv-carta');
    await esperarQue(() => visible('.lv-c-cofre'), 4000);
    await tocar('.lv-c-cofre');
    revisar((await escogerTodo(true)) >= 1, `${nombre} · cartas, cofre y carta de amor en cola: todo se cierra`);
    await sigueCorriendo('después de la cola de cofres');

    // 4. Pausa y segundo plano con las cartas abiertas
    await tocar('.lv-pausa');
    revisar(await esperarQue(() => visible('.lv-c-pausa'), 3000), `${nombre} · se abre la pausa`);
    await probar('subir');
    await tocar('[data-p="seguir"]');
    revisar(await esperarQue(async () => !(await visible('.lv-c-pausa')) && (await visible('.lv-c-nivel')), 3000), `${nombre} · al seguir salen las cartas`);
    await espera(320);
    await p.evaluate(() => document.dispatchEvent(new Event('freeze')));
    await espera(300);
    await p.evaluate(() => document.dispatchEvent(new Event('resume')));
    revisar(await esperarQue(() => visible('.lv-c-pausa'), 3000), `${nombre} · al volver del segundo plano está en pausa`);
    await tocar('[data-p="seguir"]');
    revisar((await escogerTodo()) >= 1, `${nombre} · y se puede escoger la carta después`);
    await sigueCorriendo('después de la pausa y el segundo plano');
  }

  // El joystick mueve al personaje (con el dedo arrastrando, o el teclado en computador; sin subir de nivel en medio)
  await p.evaluate(() => (window.__lavado.actual.m.xp = -1e6));
  const x0 = (await estado()).jug[0].x;
  if (tactil) {
    const cdp = await ctx.newCDPSession(p);
    const toque = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
    await toque('touchStart', 300, 250);
    for (let k = 1; k <= 8; k++) await toque('touchMove', 300 + k * 10, 250), await espera(30);
    await espera(1200);
    await toque('touchEnd', 380, 250);
  } else {
    await p.keyboard.down('d');
    await espera(1200);
    await p.keyboard.up('d');
  }
  await espera(200);
  const x1 = (await estado()).jug[0].x;
  revisar(x1 - x0 > 20, `${nombre} · el personaje se mueve (${x0} → ${x1})`);
  await p.screenshot({ path: `${carpeta}/${nombre}-4-sigue.png` });

  // 5. Retirarse desde la pausa, «Otra lavada», otra vez al final, al menú, la tienda, los disfraces y a la casa
  const retirarse = async () => {
    await tocar('.lv-pausa');
    await esperarQue(() => visible('.lv-c-pausa'), 3000);
    await tocar('[data-p="retirarse"]');
    await tocar('[data-p="retirarse"]');
    return esperarQue(() => visible('.lv-c-fin'), 8000);
  };
  revisar(await retirarse(), `${nombre} · retirarse y cobrar abre la pantalla final`);
  await p.screenshot({ path: `${carpeta}/${nombre}-5-fin.png` });
  const t0 = Date.now();
  await tocar('[data-f="otra"]');
  const otra = await esperarQue(async () => (await p.evaluate(() => { const m = window.__lavado?.actual?.m; return !!m && !m.fin && m.t > 0.5; })) && (await capasAbiertas()).length === 0, 30000);
  revisar(otra, `${nombre} · «Otra lavada» arranca otra partida sin capas encima (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  revisar(await retirarse(), `${nombre} · y se puede volver a terminar`);
  await tocar('[data-f="menu"]');
  revisar(await esperarQue(() => visible('.lv-menu'), 8000), `${nombre} · «Al menú» vuelve al menú`);
  for (const [boton, texto] of [['[data-m="tienda"]', 'la tienda de poderes'], ['[data-m="disfraces"]', 'los disfraces'], ['[data-m="coleccion"]', 'la colección']]) {
    await tocar(`.lv-menu ${boton}`);
    const abre = await esperarQue(() => visible('.lv-pantalla'), 3000);
    if (boton.includes('disfraces')) {
      await tocar('.lv-pantalla [data-sel]');
      await espera(300);
    }
    await tocar('.lv-pantalla [data-v="volver"]');
    const cierra = await esperarQue(async () => !(await visible('.lv-pantalla')) && (await visible('.lv-menu')), 3000);
    revisar(abre && cierra, `${nombre} · se abre y se cierra ${texto}`);
  }
  await tocar('.lv-menu [data-m="salir"]');
  revisar(await esperarQue(() => p.evaluate(() => !!window.__resultado), 6000), `${nombre} · «Volver a la casa» sale del juego`);
  await ctx.close();
}

await partida(true);
await partida(false);
await navegador.close();
console.log(errores.length ? `\n${errores.length} problema(s):\n${errores.slice(0, 20).join('\n')}` : '\nTodo bien');
process.exit(errores.length ? 1 : 0);
