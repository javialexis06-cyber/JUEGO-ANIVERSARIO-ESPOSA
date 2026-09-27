// Pruebas de estrés de Nuestro Hogar (modo local, dos pestañas como dos celulares):
//  1. datos guardados dañados, 2. días sin abrir la app (saltos de tiempo), 3. textos raros y muy largos,
//  4. compras y regalos con toques rapidísimos, 5. almacenamiento lleno y fotos que no son fotos,
//  6. toques al azar por toda la casa en las dos pestañas a la vez.
// Uso: node scripts/estres-casa.mjs [url de index.html] [carpeta] [partes]
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:5173/index.html';
const carpeta = process.argv[3] ?? 'test-results/estres-casa';
const partes = (process.argv[4] ?? '1,2,3,4,5,6').split(',');
mkdirSync(carpeta, { recursive: true });
const PRE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({
  executablePath: existsSync(PRE) ? PRE : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const fallas = [];
const revisar = (ok, texto) => {
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${texto}`);
  if (!ok) fallas.push(texto);
};
const HORA = 3600000;

/** Una pestaña con datos iniciales opcionales (se escriben antes de que cargue la página). */
async function abrir(ctx, rol, datos, extra = '') {
  const p = await ctx.newPage();
  p.errores = [];
  p.on('pageerror', (e) => p.errores.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|No se pudo guardar|No cabe/.test(m.text()) && p.errores.push(m.text()));
  if (datos !== undefined) await p.addInitScript(([k, v]) => {
    if (!sessionStorage.getItem('sembrado')) {
      localStorage.setItem(k, v);
      sessionStorage.setItem('sembrado', '1');
    }
  }, ['nuestro-hogar-local', datos]);
  await p.goto(`${url}?rol=${rol}&local=1&rapido=3${extra}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  const listo = await p.waitForFunction(() => window.__listo === true, null, { timeout: 180000 }).then(() => true, () => false);
  p.listo = listo;
  return p;
}
const contexto = () => navegador.newContext({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
const estado = (p) => p.evaluate(() => window.__casa());
const sano = (e) => ['hambre', 'energia', 'higiene', 'carino'].every((n) => Number.isFinite(e[n]) && e[n] >= 0 && e[n] <= 100);

// ---------------------------------------------------------------------------
if (partes.includes('1')) {
  console.log('\n1. Datos guardados dañados');
  const casos = {
    'texto que no es JSON': '{ esto no es json',
    'una lista': '[1,2,3]',
    'personajes vacíos': JSON.stringify({ casa: {}, personajes: {}, recuerdos: [], eventos: [] }),
    'tipos equivocados': JSON.stringify({
      casa: { monedas: 'mil', inventario: { pan: 'dos', manzana: -4, torta: 1e9 }, deco: { sala_cuadro: 5 }, notas: [{ texto: 7 }, null, { id: 'n1', texto: 'hola', color: 'red;position:fixed' }], fechas: 'hoy', regalos: [{}], diario: null },
      personajes: { el: { hambre: 'x', energia: null, actividad: 'dormir', cuarto: 'garaje' }, ella: 42 },
      recuerdos: 'fotos', eventos: [{ de: 'nadie', tipo: 'beso' }, { id: 'e1', de: 'ella', tipo: 'hackear', datos: null }],
    }),
    'números imposibles': JSON.stringify({
      casa: { monedas: -9999, inventario: { pan: NaN } },
      personajes: { el: { hambre: 1e9, energia: -50, higiene: Infinity, carino: 50, t: 'ayer', actividad: { tipo: 'dormir', desde: 'x' } } },
    }),
  };
  for (const [nombre, datos] of Object.entries(casos)) {
    const ctx = await contexto();
    const p = await abrir(ctx, 'el', datos);
    let detalle = 'no abrió';
    let ok = p.listo && !p.errores.length;
    if (p.listo) {
      const e = await estado(p);
      const monedasOk = Number.isInteger(e.monedas) && e.monedas >= 0;
      const inv = Object.values(e.inventario).every((v) => Number.isInteger(v) && v >= 0);
      ok = ok && sano(e.personajes.el) && sano(e.personajes.ella) && monedasOk && inv;
      detalle = `monedas ${e.monedas}, necesidades sanas ${sano(e.personajes.el) && sano(e.personajes.ella)}, inventario sano ${inv}`;
      // Probar que se puede jugar después
      await p.click('[data-accion="tienda"]');
      await p.click('[data-comprar="manzana"]').catch(() => {});
      await p.click('#hoja-cerrar');
      const inyectado = await p.evaluate(() => [...document.querySelectorAll('.nota-adhesiva')].some((n) => getComputedStyle(n).position === 'fixed'));
      ok = ok && !inyectado;
    }
    revisar(ok, `Datos «${nombre}»: la casa abre y se puede jugar (${detalle})${p.errores.length ? ` · errores: ${p.errores.slice(0, 2).join(' | ')}` : ''}`);
    await ctx.close();
  }
}

// ---------------------------------------------------------------------------
if (partes.includes('2')) {
  console.log('\n2. Días sin abrir la app');
  const ahora = Date.now();
  const datos = JSON.stringify({
    casa: { monedas: 50, inventario: { pan: 1 }, deco: {}, notas: [], fechas: [], regalos: [], aniversario: '', diario: {} },
    personajes: {
      el: { hambre: 90, energia: 30, higiene: 80, carino: 70, t: ahora - 72 * HORA, cuarto: 'cuarto', actividad: { tipo: 'dormir', desde: ahora - 72 * HORA }, visto: ahora - 72 * HORA },
      ella: { hambre: 90, energia: 90, higiene: 90, carino: 90, t: ahora - 400 * HORA, cuarto: 'cocina', actividad: { tipo: 'nada', desde: ahora - 400 * HORA, accion: 'comer', hasta: ahora - 400 * HORA + 7000, item: 'pan' }, visto: ahora - 400 * HORA },
    },
    recuerdos: [], eventos: [],
  });
  const ctx = await contexto();
  const p = await abrir(ctx, 'el', datos);
  await p.waitForTimeout(3000);
  const e = await estado(p);
  revisar(p.listo && sano(e.personajes.el) && sano(e.personajes.ella), `Tras 3 días y 16 días sin abrir, las necesidades siguen entre 0 y 100`);
  revisar(e.personajes.el.energia >= 99, `Él durmió 3 días: energía llena (${e.personajes.el.energia.toFixed(1)})`);
  const dormido = await p.evaluate(() => !!document.querySelector('[data-accion="despertar"]'));
  revisar(!dormido, 'Con la energía llena se despierta solo');
  revisar(e.personajes.ella.hambre === 0, `Ella lleva 16 días sin comer: comida en 0 (${e.personajes.ella.hambre})`);
  const escenaElla = await p.evaluate(() => window.__escena('ella'));
  revisar(!escenaElla.includes('|comer|'), `La comida de hace 16 días ya no se sigue mostrando (${escenaElla || 'caminando'})`);
  revisar(e.monedas === 70, `El bono del día llega una sola vez (${e.monedas})`);
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.__listo === true, null, { timeout: 180000 });
  revisar((await estado(p)).monedas === 70, 'Recargar no da el bono otra vez');
  // Sueldo del súper: llega una vez
  await p.evaluate(() => localStorage.setItem('nuestro-hogar-sueldo', '37'));
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.__listo === true, null, { timeout: 180000 });
  await p.waitForTimeout(1500);
  const m = (await estado(p)).monedas;
  const queda = await p.evaluate(() => localStorage.getItem('nuestro-hogar-sueldo'));
  revisar(m === 107 && !queda, `El sueldo del súper (37) entra una vez y se borra del sobre (${m}, sobre ${queda})`);
  revisar(!p.errores.length, `Sin errores${p.errores.length ? `: ${p.errores.slice(0, 2).join(' | ')}` : ''}`);
  await ctx.close();
}

// ---------------------------------------------------------------------------
if (partes.includes('3')) {
  console.log('\n3. Textos raros y muy largos');
  const ctx = await contexto();
  const p = await abrir(ctx, 'ella', JSON.stringify({ casa: { monedas: 500 } }));
  const raro = '<script>alert(1)</script><img src=x onerror="document.title=\'hackeado\'">"\'&🥰💕 ñandú ' + 'á'.repeat(500);
  await p.click('[data-cuarto="cocina"]');
  for (let i = 0; i < 35; i++) {
    await p.evaluate(() => (document.querySelector('[data-accion="notas"]') ?? document.querySelector('#btn-menu'))?.click());
    await p.waitForSelector('#nota-texto', { timeout: 10000 }).catch(() => {});
    await p.fill('#nota-texto', i === 0 ? raro : `nota ${i}`).catch(() => {});
    await p.click('#form-nota button[type="submit"]').catch(() => {});
    await p.waitForTimeout(60);
  }
  await p.waitForTimeout(1000);
  const e = await estado(p);
  revisar(e.notas <= 30, `Se guardan como máximo 30 notas (${e.notas})`);
  const titulo = await p.title();
  const scripts = await p.evaluate(() => document.querySelectorAll('.nota-adhesiva script, .nota-adhesiva img').length);
  revisar(titulo !== 'hackeado' && scripts === 0, 'El HTML dentro de una nota no se ejecuta');
  await p.click('#hoja-cerrar').catch(() => {});
  // Fechas con nombres largos y fechas raras
  await p.click('#btn-menu');
  await p.click('[data-hoja="fechas"]');
  await p.fill('#fecha-nombre', raro);
  await p.fill('#fecha-dia', '2024-02-29');
  await p.click('#form-fecha button');
  await p.waitForTimeout(500);
  await p.fill('#aniv-fecha', '2019-12-31');
  await p.click('#form-aniversario button');
  await p.waitForTimeout(800);
  const fechasOk = await p.evaluate(() => document.querySelectorAll('.calendario').length >= 2 && document.title !== 'hackeado');
  revisar(fechasOk, 'Fechas con nombres raros y 29 de febrero se muestran bien');
  await p.screenshot({ path: `${carpeta}/3-fechas.png`, animations: 'disabled', timeout: 120000 }).catch(() => {});
  revisar(!p.errores.length, `Sin errores${p.errores.length ? `: ${p.errores.slice(0, 2).join(' | ')}` : ''}`);
  await ctx.close();
}

// ---------------------------------------------------------------------------
if (partes.includes('4')) {
  console.log('\n4. Toques rapidísimos: compras, regalos y mimos');
  const ctx = await contexto();
  const el = await abrir(ctx, 'el', JSON.stringify({ casa: { monedas: 100, inventario: {} } }));
  const ella = await abrir(ctx, 'ella');
  await el.bringToFront();
  await el.click('[data-accion="tienda"]');
  await el.click('[data-p="regalo"]');
  // 30 toques seguidos comprando flores (25 cada una): con 100+20+20 monedas alcanzan para 5
  await Promise.all(Array.from({ length: 30 }, () => el.evaluate(() => document.querySelector('[data-comprar="flores"]')?.click())));
  await el.waitForTimeout(800);
  let e = await estado(el);
  revisar(e.monedas >= 0 && e.monedas === 140 - 25 * (e.inventario.flores ?? 0), `30 toques comprando: monedas ${e.monedas}, flores ${e.inventario.flores} (nunca negativo y cuadra)`);
  await el.click('#hoja-cerrar');
  // Regalar dos veces seguidas con un solo ramo... y con varios
  await el.evaluate(() => document.getElementById('chip-pareja').click());
  await el.click('[data-hoja="regalar"]');
  await el.fill('#regalo-mensaje', 'Para ti');
  await Promise.all([0, 1, 2].map(() => el.evaluate(() => document.querySelector('#form-regalo')?.requestSubmit())));
  await el.waitForTimeout(1500);
  e = await estado(el);
  const enviados = e.regalos.filter((r) => r.de === 'el').length;
  revisar(enviados === 1, `Tres envíos seguidos del formulario mandan un solo regalo (${enviados})`);
  // Ella abre el regalo con muchos toques
  await ella.bringToFront();
  await ella.waitForFunction(() => !!document.querySelector('[data-accion="abrir-regalo"]'), null, { timeout: 30000 }).catch(() => {});
  const c0 = (await estado(ella)).personajes.ella.carino;
  await Promise.all(Array.from({ length: 6 }, () => ella.evaluate(() => document.querySelector('[data-accion="abrir-regalo"]')?.click())));
  await ella.waitForTimeout(1500);
  const e2 = await estado(ella);
  const abiertos = e2.regalos.filter((r) => r.abierto).length;
  revisar(abiertos === 1 && e2.personajes.ella.carino - c0 <= 31, `Abrir el regalo con 6 toques: se abre una vez y el cariño sube una vez (+${(e2.personajes.ella.carino - c0).toFixed(1)})`);
  await ella.click('#ventana [data-cerrar]').catch(() => {});
  // Mimos muy seguidos: uno a la vez
  await el.bringToFront();
  await el.evaluate(() => document.getElementById('chip-pareja').click());
  await Promise.all(Array.from({ length: 8 }, () => el.evaluate(() => document.querySelector('[data-mimo="beso"]')?.click())));
  await el.waitForTimeout(2000);
  const besos = (await estado(el)).eventos;
  revisar(besos <= 3, `8 toques a «Beso» seguidos no mandan 8 besos (eventos: ${besos})`);
  revisar(!el.errores.length && !ella.errores.length, `Sin errores${[...el.errores, ...ella.errores].length ? `: ${[...el.errores, ...ella.errores].slice(0, 3).join(' | ')}` : ''}`);
  await ctx.close();
}

// ---------------------------------------------------------------------------
if (partes.includes('5')) {
  console.log('\n5. Almacenamiento lleno y archivos que no son fotos');
  const ctx = await contexto();
  const p = await abrir(ctx, 'el', JSON.stringify({ casa: { monedas: 300 } }));
  // Foto que no es foto
  await p.click('#btn-menu');
  await p.click('[data-hoja="album"]');
  await p.setInputFiles('#rec-foto', { name: 'virus.png', mimeType: 'image/png', buffer: Buffer.from('esto no es una imagen') });
  await p.fill('#rec-titulo', 'Falsa');
  await p.click('#form-recuerdo button[type="submit"]');
  await p.waitForTimeout(1500);
  const aviso = await p.textContent('#rec-aviso');
  revisar(/foto/i.test(aviso) && (await estado(p)).monedas >= 0, `Un archivo que no es foto da un aviso claro («${aviso.trim()}»)`);
  await p.click('#hoja-cerrar');
  // Llenar el almacenamiento del navegador con basura hasta que no quepa más
  const lleno = await p.evaluate(() => {
    const trozo = 'x'.repeat(256 * 1024);
    let i = 0;
    try {
      for (; i < 400; i++) localStorage.setItem(`basura-${i}`, trozo);
    } catch {
      /* lleno */
    }
    return i;
  });
  await p.click('[data-accion="tienda"]');
  await p.click('[data-comprar="pan"]').catch(() => {});
  await p.waitForTimeout(800);
  const toast = await p.textContent('#toast').catch(() => '');
  await p.click('#hoja-cerrar').catch(() => {});
  const sigue = await p.evaluate(() => !!window.__casa());
  revisar(sigue, `Con el almacenamiento lleno (${lleno} trozos) la casa sigue funcionando y avisa («${(toast ?? '').trim()}»)`);
  await p.evaluate(() => {
    for (let i = 0; i < 400; i++) localStorage.removeItem(`basura-${i}`);
  });
  revisar(!p.errores.length, `Sin errores${p.errores.length ? `: ${p.errores.slice(0, 2).join(' | ')}` : ''}`);
  await ctx.close();
}

// ---------------------------------------------------------------------------
if (partes.includes('6')) {
  console.log('\n6. Toques al azar por toda la casa en las dos pestañas');
  const ctx = await contexto();
  const el = await abrir(ctx, 'el', JSON.stringify({ casa: { monedas: 2000, inventario: { pan: 5, flores: 3, osito: 2, cuadro_corazon: 2, cactus: 2, velas: 2 } } }));
  const ella = await abrir(ctx, 'ella');
  const selectores = ['[data-cuarto]', '[data-accion]', '[data-mimo]', '[data-hoja]', '[data-comprar]', '[data-comer]', '[data-llevar]', '[data-poner]',
    '[data-quitar-deco]', '[data-elegir-regalo]', '[data-color]', '#chip-pareja', '#chip-yo', '#btn-menu', '#hoja-cerrar', '[data-cerrar]', '[data-p]'];
  const mono = async (p, ms) => {
    const fin = Date.now() + ms;
    let n = 0;
    while (Date.now() < fin) {
      if (Math.random() < 0.35) await p.mouse.click(Math.random() * 960, Math.random() * 540).catch(() => {});
      else {
        await p.evaluate((sels) => {
          const s = sels[Math.floor(Math.random() * sels.length)];
          const l = [...document.querySelectorAll(s)].filter((b) => b.offsetParent !== null && !b.closest('[hidden]'));
          if (l.length) l[Math.floor(Math.random() * l.length)].click();
          const t = document.querySelector('#nota-texto, #regalo-mensaje');
          if (t && Math.random() < 0.3) {
            t.value = 'hola ' + Math.random();
            t.form?.requestSubmit();
          }
        }, selectores).catch(() => {});
      }
      n++;
      await p.waitForTimeout(40);
    }
    return n;
  };
  const [n1, n2] = await Promise.all([mono(el, 150000), mono(ella, 150000)]);
  await el.waitForTimeout(3000);
  const e1 = await estado(el), e2 = await estado(ella);
  const inv = Object.values(e1.inventario).every((v) => Number.isInteger(v) && v >= 0);
  revisar(e1.monedas >= 0 && inv && sano(e1.personajes.el) && sano(e1.personajes.ella), `Tras ${n1 + n2} toques al azar: monedas ${e1.monedas}, inventario y necesidades sanos`);
  revisar(e1.monedas === e2.monedas && JSON.stringify(e1.deco) === JSON.stringify(e2.deco), 'Las dos pestañas terminan viendo la misma casa');
  // Ningún objeto de decoración fantasma: lo que se ve en 3D es lo que dice la casa
  const fantasmas = await el.evaluate(() => {
    const deco = window.__casa().deco;
    let n = 0;
    window.__mundo().escena.traverse((o) => {
      if (/^(deco_|planta$|globos$)/.test(o.name) && o.parent?.type === 'Group') n++;
    });
    return { enEscena: n, enCasa: Object.keys(deco).length };
  });
  console.log('   decoración en la escena', JSON.stringify(fantasmas));
  await el.screenshot({ path: `${carpeta}/6-mono-el.png`, animations: 'disabled', timeout: 120000 }).catch(() => {});
  await ella.screenshot({ path: `${carpeta}/6-mono-ella.png`, animations: 'disabled', timeout: 120000 }).catch(() => {});
  revisar(!el.errores.length && !ella.errores.length, `Sin errores${[...el.errores, ...ella.errores].length ? `: ${[...new Set([...el.errores, ...ella.errores])].slice(0, 4).join(' | ')}` : ''}`);
  await ctx.close();
}

console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\nTODO OK');
await navegador.close();
process.exit(fallas.length ? 1 : 0);
