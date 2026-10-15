// Dos amigos en la app compilada, con modelos 3D y la misma red falsa de las pruebas de salas.
// Escenario preparado: tutorial visto, vida de prueba y nivel alto para aislar el movimiento de las elecciones.
// DIBUJO_POR_CAPTURA=1 actualiza modelos y controles y dibuja las capturas; no mide rendimiento físico.
// CHROME_PATH=/usr/bin/chromium node scripts/probar-lavado-fluidez.mjs URL carpeta
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { SupabaseFalso } from './supabase-falso.mjs';

const url = process.argv[2] ?? 'http://127.0.0.1:4183';
const carpeta = process.argv[3] ?? 'test-results/lavado-fluidez';
mkdirSync(carpeta, { recursive: true });
const perder = Number(process.env.PERDER ?? 0.08), demora = Number(process.env.DEMORA ?? 180);
const red = new SupabaseFalso({ perder, demora });
const porCaptura = process.env.DIBUJO_POR_CAPTURA === '1';
const errores = [], comprobaciones = [], mediciones = [];
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const paginas = [];
const espera = ms => new Promise(r => setTimeout(r, ms));
const hecho = s => { comprobaciones.push(s); console.log('OK ' + s); };
const tecla = (p, tipo, key) => p.evaluate(([tipo, key]) => window.dispatchEvent(new KeyboardEvent(tipo, { key })), [tipo, key]);
async function captura(p, nombre) {
  if (porCaptura) await p.evaluate(() => { const d = window.__lavado.actual.dib; d.__renderPrueba(d.escena, d.camara); });
  await p.screenshot({ path: `${carpeta}/${nombre}.png` });
}
try {
  for (const [i, nombre] of ['Pipe', 'Caro'].entries()) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); paginas.push(p);
    p.on('pageerror', e => errores.push(`${nombre}: ${e.message}`));
    await red.conectar(p, 'el');
    await p.addInitScript(([i, nombre]) => {
      localStorage.setItem('nuestro-hogar-amigo', JSON.stringify({ id: `fluidez-amigo-${i}`, nombre, cuerpo: i ? 'ella' : 'el', activo: true, creado: 1 }));
      localStorage.setItem('amigo-lavado-progreso', JSON.stringify({ tutorial: true }));
    }, [i, nombre]);
    await p.goto(`${url}/amigos.html?calidad=0`, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await p.locator('[data-j="lavado"]:not(.pronto)').click();
    await p.locator('.lv-menu:not([hidden]) [data-m="amigos"]').waitFor({ timeout: 90000 });
  }
  const [host, invitado] = paginas;
  await host.locator('[data-m="amigos"]').click();
  await host.locator('.sala-espera.visible').waitFor();
  const codigo = await host.evaluate(() => window.__lavado.actual.probar('sala').codigo);
  await invitado.locator('[data-m="codigo"]').click();
  await invitado.locator('.lv-codigo-panel input').fill(codigo);
  await invitado.locator('.lv-codigo-panel .rosa').click();
  await invitado.locator('.sala-espera.visible').waitFor();
  await host.waitForFunction(() => document.querySelectorAll('.se-puesto:not(.vacio)').length === 2);
  await invitado.locator('.se-principal').click();
  await host.locator('.se-principal:not(:disabled)').click();
  for (const p of paginas) {
    await p.waitForFunction(() => window.__lavado?.actual?.m?.jug.length === 2 && window.__lavado.actual.dib?.jugadores.every(j => j?.listo), null, { timeout: 180000 });
    await p.waitForFunction(() => window.__lavado.actual.red && !window.__lavado.actual.red.cargando, null, { timeout: 60000 });
  }
  await host.evaluate(() => { const l = window.__lavado.actual; l.probar('aguante'); l.m.nivel = 60; });
  for (const p of paginas) await p.evaluate(porCaptura => {
    const l = window.__lavado.actual, d = l.dib;
    window.__muestrasMovimiento = [];
    if (porCaptura) { d.__renderPrueba = d.renderer.render.bind(d.renderer); d.renderer.render = () => {}; }
    const dibujar = d.dibujar.bind(d);
    d.dibujar = (...args) => {
      dibujar(...args);
      const t = performance.now();
      window.__muestrasMovimiento.push({ t, yo: l.red.yo, quieto: l.red.pausado || l.red.esperaCorte || l.red.cargando || l.m.pausa,
        j: l.m.jug.map((j, i) => { const v = d.jugadorEnVista(i), p = d.jugadores[i]; return { x: j.x, y: j.y, vx: j.vx, vy: j.vy,
          vistaX: v.x, vistaY: v.y, modeloX: p.raiz.position.x, modeloY: p.raiz.position.z, localDirecto: v === j }; }) });
    };
  }, porCaptura);
  hecho('Dos amigos crean y entran a una sala con sus modelos 3D en la app compilada');
  for (const [i, p] of paginas.entries()) {
    const yo = await p.evaluate(() => window.__lavado.actual.red.yo);
    const antes = await p.evaluate(yo => window.__lavado.actual.m.jug[yo].x, yo);
    await tecla(p, 'keydown', 'd');
    await p.waitForFunction(([yo, antes]) => window.__lavado.actual.m.jug[yo].x - antes > 90, [yo, antes], { timeout: 30000 });
    await espera(1700); await tecla(p, 'keyup', 'd'); await espera(1200);
    const despues = await p.evaluate(yo => window.__lavado.actual.m.jug[yo].x, yo);
    assert.ok(despues - antes > 90);
    await captura(p, `${i}-movimiento`);
    await tecla(p, 'keydown', 'a'); await espera(1800); await tecla(p, 'keyup', 'a'); await espera(1400);
    hecho(`${i ? 'Invitado' : 'Anfitrión'} camina, frena y cambia de dirección con el mando real`);
  }
  for (const [i, p] of paginas.entries()) {
    const muestras = await p.evaluate(() => window.__muestrasMovimiento);
    let entreMensajes = 0, cuadros = 0;
    for (let k = 1; k < muestras.length; k++) {
      const a = muestras[k - 1], b = muestras[k]; if (b.quieto) continue;
      for (let j = 0; j < b.j.length; j++) {
        const q = b.j[j];
        assert.ok(Math.abs(q.vistaX - q.modeloX) < 1e-5 && Math.abs(q.vistaY - q.modeloY) < 1e-5, 'El modelo 3D debe seguir la vista, con su barra y sombra');
        if (j === b.yo) assert.equal(q.localDirecto, true, 'El propio no espera mensajes');
        else { cuadros++; if (Math.hypot(q.x - a.j[j].x, q.y - a.j[j].y) < 0.01 && Math.hypot(q.vistaX - a.j[j].vistaX, q.vistaY - a.j[j].vistaY) > 0.05) entreMensajes++; }
      }
    }
    assert.ok(entreMensajes >= 3, 'El modelo remoto debe avanzar también en cuadros sin una posición nueva');
    mediciones.push({ lado: i ? 'invitado' : 'anfitrion', cuadros, movimientoEntreMensajes: entreMensajes });
    await p.evaluate(() => { window.__muestrasMovimiento = []; });
    await captura(p, `${i}-detenido`);
  }
  hecho('Ambos modelos remotos avanzan entre mensajes; el personaje propio conserva su movimiento directo');
  red.cortar(invitado, true);
  await host.waitForFunction(() => window.__lavado.actual.red.esperaCorte, null, { timeout: 15000 });
  await captura(host, 'corte');
  red.cortar(invitado, false);
  await host.waitForFunction(() => !window.__lavado.actual.red.esperaCorte, null, { timeout: 15000 });
  await espera(1200);
  hecho('El corte pausa la sala y la reconexión recupera la partida');
  for (const p of paginas) {
    const resultado = await p.evaluate(() => {
      const d = window.__lavado.actual.dib, l = window.__lavado.actual, yo = l.red.yo, i = 1 - yo;
      const j = l.m.jug[i], v = d.jugadorEnVista(i), [x, y] = d.aPantalla(v.x, v.y);
      const etiqueta = document.querySelector(`.lv-etiqueta[data-i="${i}"]`), matriz = new DOMMatrix(getComputedStyle(etiqueta).transform);
      return { distancia: Math.hypot(j.x - v.x, j.y - v.y), etiqueta: Math.hypot(matriz.e - x, matriz.f - (y - 66)), visible: etiqueta.classList.contains('si') };
    });
    assert.ok(resultado.distancia < 1, 'Tras detenerse, posición visual y real vuelven a coincidir');
    if (resultado.visible) assert.ok(resultado.etiqueta < 1, 'El nombre sigue la posición dibujada');
  }
  hecho('Al frenar y volver de un corte coinciden posición, modelo y nombre');
  await host.evaluate(() => window.__lavado.actual.probar('fin'));
  for (const p of paginas) await p.locator('.lv-c-fin:not([hidden])').waitFor({ timeout: 30000 });
  const finales = await Promise.all(paginas.map(p => p.locator('.lv-resumen b').first().innerText()));
  assert.equal(finales[0], finales[1]);
  for (const p of paginas) { await p.locator('[data-f="otra"]').click(); await p.locator('.sala-espera.visible').waitFor({ timeout: 30000 }); }
  hecho('El final preparado muestra el mismo tiempo y ambos vuelven a la sala');
  assert.deepEqual(errores, []);
} catch (e) {
  errores.push(String(e.stack)); process.exitCode = 1;
  for (const [i, p] of paginas.entries()) await captura(p, `fallo-${i}`).catch(() => {});
} finally {
  writeFileSync(`${carpeta}/verificacion.json`, JSON.stringify({ comprobaciones, mediciones, errores, perder, demora, dibujoPorCaptura: porCaptura,
    alcance: 'Integración preparada de movimiento y sala; no es una campaña completa ni una medición de teléfonos o de Supabase real.' }, null, 2));
  console.log(JSON.stringify({ comprobaciones: comprobaciones.length, mediciones, errores }));
  await browser.close();
}
