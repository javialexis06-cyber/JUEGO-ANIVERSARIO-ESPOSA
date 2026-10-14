// Días desde progreso nuevo con un piloto que usa las acciones y estaciones normales. Adelanta el reloj,
// pero no entrega platos preparados, propinas, mejoras ni resultados. No certifica precisión táctil en Android.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const url = process.argv[2] ?? 'http://127.0.0.1:4182/';
const carpeta = process.argv[3] ?? 'test-results/cocina-recorridos';
const recetas = process.argv[4]?.split(',') ?? ['wafles', 'fresas', 'frappes'];
assert.ok(recetas.every((r) => ['wafles', 'fresas', 'frappes'].includes(r)));
await mkdir(carpeta, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const resultados = [];
try {
  for (const receta of recetas) {
    console.log(`Abriendo ${receta} desde progreso nuevo…`);
    const contexto = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
    const p = await contexto.newPage();
    const errores = [];
    p.on('pageerror', (e) => errores.push(e.message));
    await p.addInitScript(() => {
      if (!localStorage.getItem('nuestro-hogar-amigo')) localStorage.setItem('nuestro-hogar-amigo', JSON.stringify({
        id: 'amigo-prueba-chef', nombre: 'Chef', cuerpo: 'el', piel: '#f6c8a4', pelo: '#c99a5b', ropa: '#3fb5a3', ropa2: '#4a4a52', zapatos: '#f4efe6', activo: true, creado: 1,
      }));
      const escribir = Storage.prototype.setItem;
      window.__fallosCocina = 0;
      Storage.prototype.setItem = function (k, v) {
        if (k === 'amigo-cocina-progreso' && window.__fallosCocina-- > 0) throw new DOMException('Lleno', 'QuotaExceededError');
        return escribir.call(this, k, v);
      };
    });
    await p.goto(new URL(`cocina.html?receta=${receta}`, url).href, { timeout: 180000 });
    await p.waitForFunction(() => window.__cocinaMotor, null, { timeout: 180000 });
    assert.equal(await p.evaluate(() => localStorage.getItem('amigo-cocina-progreso')), null);
    await p.evaluate(() => { const m = window.__cocinaMotor; m.bucle?.detener(); m.probar('intro'); });
    await p.locator('[data-c="jugar"]').click();
    await p.waitForFunction(() => window.__cocinaMotor.s.fase === 'jugando');
    console.log(`Cocinando el primer día de ${receta}…`);
    // Wafles: comprobar además dos escrituras fallidas de verdad en el almacenamiento del aparato.
    if (receta === 'wafles') await p.evaluate(() => { window.__fallosCocina = 2; });
    const cocinarDia = (receta) => p.evaluate((id) => {
      const m = window.__cocinaMotor, defs = m.receta.pruebas;
      // El reloj sigue por el motor; dibujar cada décima de segundo simulada vuelve lenta la prueba sin GPU.
      const dibujar = m.dibujar.bind(m);
      m.dibujar = () => {};
      const avanzar = (s) => m.probar('avanzar', s);
      const hasta = (fn, max = 180) => {
        for (let i = 0; i < max * 10 && !fn(); i++) avanzar(0.1);
        if (!fn()) throw Error(`Se trabó ${id}: ${JSON.stringify(m.resumen())}`);
      };
      const punto = (r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
      const tocar = (tipo, q) => m.tocar(tipo, q.x, q.y);
      const click = (r) => { const q = punto(r); tocar('bajar', q); tocar('subir', q); };
      const mantener = (r, fn) => { const q = punto(r); tocar('bajar', q); hasta(fn, 20); tocar('subir', q); };
      const ir = (i) => { m.irA(i); avanzar(0.4); };
      const decorar = (e, pd, o) => {
        for (const t of pd.toppings) {
          const d = defs.TOP[t.id];
          click(e.botones().find((b) => b.id === t.id));
          const uv = (u, v) => ({ x: o.x + o.rx * u, y: o.y + o.ry * v });
          if (d.tipo === 'pieza') {
            const n = t.n ?? 1;
            const ps = n === 1 ? [[0, 0]] : n === 2 ? [[-0.45, 0], [0.45, 0]] : Array.from({ length: n }, (_, i) => [Math.cos(-Math.PI / 2 + i / n * 2 * Math.PI) * 0.55, Math.sin(-Math.PI / 2 + i / n * 2 * Math.PI) * 0.55]);
            for (const [u, v] of ps) { tocar('bajar', uv(u, v)); tocar('subir', uv(u, v)); }
          } else {
            // Recorrer la superficie con la salsa o el salero, sin escribir directamente la obra.
            for (let v = -0.7; v <= 0.71; v += 0.25) {
              const q = uv(-0.65, v); tocar('bajar', q);
              for (let u = -0.6; u <= 0.61; u += 0.08) { tocar('mover', uv(u, v)); avanzar(0.04); }
              tocar('subir', uv(0.65, v));
            }
          }
        }
      };
      const pedidos = [];
      while (m.s.fase !== 'fin') {
        hasta(() => m.s.invitados.some((e) => e.estado === 'fila') || m.s.fase === 'fin');
        if (m.s.fase === 'fin') break;
        ir(0);
        m.tomarPedido(m.yo.id);
        hasta(() => !m.s.invitados.some((e) => e.estado === 'pidiendo'));
        const tk = m.s.tickets[m.s.tickets.length - 1];
        if (!tk) throw Error('No salió el tiquete');
        m.activo = tk;
        const pd = tk.pedido;
        pedidos.push(structuredClone(pd));
        if (pedidos.length > m.s.invitados.length) throw Error('Se repitió un pedido sin avanzar el día');
        ir(1);
        const a = m.estaciones[0];
        if (id === 'wafles') {
          if (a.c.jarra !== pd.masa) click(a.jarras().find((r) => r.id === pd.masa));
          for (let i = 0; i < pd.n; i++) {
            const r = a.planchaRect(0).caja, plancha = a.c.planchas[0], meta = defs.PUNTOS[pd.punto];
            click(r); hasta(() => plancha.fase === 'cocinando'); hasta(() => plancha.a >= meta);
            click(r); hasta(() => plancha.fase === 'cocinando'); hasta(() => plancha.b >= meta);
            click(r); avanzar(0.6);
          }
          ir(2);
          const b = m.estaciones[1];
          for (let i = 0; i < pd.n; i++) click(defs.rectsRejilla(m, 320)[0]);
          if (tk.obra.wafles.length !== pd.n) throw Error('No se pudieron poner los wafles en el plato');
          decorar(b, pd, defs.superficieDe(defs.ovaloPlato(m), tk.obra.wafles.length));
          click(b.rEntregar());
        } else if (id === 'fresas') {
          click(a.rVasos().find((r) => r.tam === pd.vaso));
          for (let i = 0; i < defs.VASOS[pd.vaso].fresas; i++) {
            click(a.rCanasta());
            const q = a.tablaPos();
            for (const l of defs.CORTES[pd.corte].lineas) {
              const cx = q.x + Math.sin(l.a) * l.d * q.r, cy = q.y - Math.cos(l.a) * l.d * q.r;
              const x = Math.cos(l.a) * q.r * 1.1, y = Math.sin(l.a) * q.r * 1.1;
              tocar('bajar', { x: cx - x, y: cy - y }); tocar('mover', { x: cx + x, y: cy + y }); tocar('subir', { x: cx + x, y: cy + y });
            }
            click(a.rAlVaso());
          }
          ir(2);
          const b = m.estaciones[1];
          click(b.rTazon(0).caja);
          mantener(b.herramientas().find((r) => r.id === 'crema'), () => tk.obra.tazon.nivel >= 0.8);
          for (let i = 0; i < pd.dulce; i++) click(b.herramientas().find((r) => r.id === 'condensada'));
          if (pd.sabor) click(b.herramientas().find((r) => r.id === pd.sabor));
          click(b.rTazon(0).boton); hasta(() => tk.obra.tazon.textura >= defs.PUNTO_CREMA[pd.punto]); click(b.rTazon(0).boton);
          ir(3);
          const c = m.estaciones[2];
          mantener(c.rCrema(), () => tk.obra.crema >= 0.9);
          decorar(c, pd, c.superficie()); click(c.rEntregar());
        } else {
          click(a.rVasos().find((r) => r.tam === pd.vaso));
          for (let i = 0; i < defs.VASOS[pd.vaso].bombas; i++) click(a.rBombas().find((r) => r.id === pd.base));
          for (let i = 0; i < pd.hielo; i++) click(a.rHielo());
          mantener(a.rLeche(), () => tk.obra.vaso.leche >= 0.85);
          ir(2);
          const b = m.estaciones[1], r = b.rLicuadora(0);
          click(r.caja); click(r.boton);
          hasta(() => b.licuadoras[0]?.valor >= defs.LICUADO[pd.licuado]);
          click(r.boton); click(r.servir);
          ir(3);
          const c = m.estaciones[2];
          if (pd.crema !== 'sin') mantener(c.rCrema(), () => tk.obra.crema >= defs.CREMA[pd.crema]);
          decorar(c, pd, c.superficie()); click(c.rPitillos()[0]); click(c.rEntregar());
        }
        hasta(() => m.s.fase !== 'juicio', 30);
        avanzar(2);
      }
      m.dibujar = dibujar;
      dibujar();
      return { resultado: m.s.resultado, progreso: structuredClone(m.progreso), pedidos };
    }, receta);
    const dia = await cocinarDia(receta);
    if (receta === 'wafles') {
      await p.waitForFunction(() => document.querySelector('[data-c="reintentar"]'));
      assert.equal(await p.evaluate(() => localStorage.getItem('amigo-cocina-progreso')), null);
      await p.locator('[data-c="salir"]').click();
      await p.waitForFunction(() => window.__fallosCocina <= 0);
      assert.equal(await p.evaluate(() => window.__cocinaMotor.terminado), false);
      await p.locator('[data-c="reintentar"]').click();
    }
    await p.waitForFunction(() => window.__cocinaMotor.guardadoN === window.__cocinaMotor.s.n);
    const guardado = await p.evaluate((r) => JSON.parse(localStorage.getItem('amigo-cocina-progreso'))[r], receta);
    assert.deepEqual(guardado, dia.progreso);
    assert.equal(guardado.dia, 2);
    assert.equal(guardado.xp, dia.resultado.xp);
    assert.equal(guardado.servidos, dia.resultado.servidos);
    assert.equal(guardado.propinas, dia.resultado.propinas);
    assert.ok(dia.resultado.servidos >= 3);
    await p.locator('.cocina-fin').waitFor({ state: 'visible' });
    await p.waitForFunction(() => {
      const e = document.querySelector('.cocina-fin');
      return !!e && Number(getComputedStyle(e).opacity) > 0.99;
    });
    const desplazable = await p.evaluate(() => {
      const e = document.querySelector('.cocina-fin');
      e.scrollTop = 0;
      return e.scrollHeight > e.clientHeight;
    });
    if (desplazable) {
      const cdp = await contexto.newCDPSession(p);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 420, y: 300 }] });
      for (let i = 1; i <= 12; i++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 420, y: 300 - i * 15 }] });
        await p.waitForTimeout(20);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await p.waitForFunction(() => document.querySelector('.cocina-fin').scrollTop > 0);
      await cdp.detach();
    }
    await p.screenshot({ path: `${carpeta}/${receta}-fin.png` });
    await p.reload();
    await p.waitForFunction(() => window.__cocinaMotor, null, { timeout: 180000 });
    assert.deepEqual(await p.evaluate(() => window.__cocinaMotor.progreso), guardado);
    assert.equal(await p.evaluate(() => window.__cocinaMotor.s.dia), 2);
    await p.evaluate(() => { const m = window.__cocinaMotor; m.bucle?.detener(); m.probar('intro'); });
    await p.locator('[data-c="jugar"]').click();
    await p.waitForFunction(() => window.__cocinaMotor.s.fase === 'jugando');
    const segundo = await cocinarDia(receta);
    await p.waitForFunction(() => window.__cocinaMotor.guardadoN === window.__cocinaMotor.s.n);
    const acumulado = await p.evaluate(() => structuredClone(window.__cocinaMotor.progreso));
    assert.equal(acumulado.dia, 3);
    assert.equal(acumulado.xp, dia.resultado.xp + segundo.resultado.xp);
    assert.equal(acumulado.propinas, dia.resultado.propinas + segundo.resultado.propinas);
    assert.equal(acumulado.servidos, dia.resultado.servidos + segundo.resultado.servidos);
    const mejora = await p.evaluate(() => {
      const m = window.__cocinaMotor;
      const a = m.receta.mejoras.find((a) => a.precios[0] <= m.progreso.propinas);
      if (!a) throw Error('Los dos días no alcanzaron para una mejora');
      return { id: a.id, precio: a.precios[0] };
    });
    await p.locator('.cocina-fin [data-c="tienda"]').click();
    await p.evaluate(() => { window.__fallosCocina = 1; });
    await p.locator(`[data-c="comprar:${mejora.id}"]`).click();
    await p.waitForFunction(() => window.__fallosCocina <= 0 && !window.__cocinaMotor.comprando);
    assert.deepEqual(await p.evaluate(() => window.__cocinaMotor.progreso), acumulado);
    assert.deepEqual(await p.evaluate((r) => JSON.parse(localStorage.getItem('amigo-cocina-progreso'))[r], receta), acumulado);
    await p.locator(`[data-c="comprar:${mejora.id}"]`).click();
    await p.waitForFunction((id) => window.__cocinaMotor.progreso.mejoras[id] === 1, mejora.id);
    const comprado = await p.evaluate(() => structuredClone(window.__cocinaMotor.progreso));
    assert.equal(comprado.propinas, acumulado.propinas - mejora.precio);
    assert.equal(comprado.xp, acumulado.xp);
    await p.waitForFunction(() => {
      const e = document.querySelector('.cocina-tienda');
      return !!e && Number(getComputedStyle(e).opacity) > 0.99;
    });
    await p.screenshot({ path: `${carpeta}/${receta}-mejora.png` });
    await p.reload();
    await p.waitForFunction(() => window.__cocinaMotor, null, { timeout: 180000 });
    assert.deepEqual(await p.evaluate(() => window.__cocinaMotor.progreso), comprado);
    assert.deepEqual(errores, []);
    resultados.push({ receta, ...dia, segundo, mejora, comprado, conserva: true, errores });
    console.log(`✓ ${receta}: día 1 completo, ${dia.resultado.servidos} invitados, promedio ${dia.resultado.promedio}, ${guardado.propinas} propinas, recarga en día 2`);
    console.log(`✓ Día 2: ${segundo.resultado.servidos} invitados, promedio ${segundo.resultado.promedio}; ${mejora.id} pagada con ${mejora.precio} propinas tras un fallo, recarga en día 3`);
    await writeFile(`${carpeta}/resultados.json`, JSON.stringify(resultados, null, 2));
    await contexto.close();
  }
} finally { await browser.close(); }
