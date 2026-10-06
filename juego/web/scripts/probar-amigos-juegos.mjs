// Prueba de los juegos que los amigos abren sin la casa: el retrete espacial (retrete.html) y la cocina de chef
// (cocina.html), sola y en una sala con otro amigo (Supabase de mentiras). Celulares táctiles con toques de verdad.
// En ningún momento un amigo ve algo personal de la pareja: se revisa el texto de la pantalla, todo lo que pasó por
// ella (globos, avisos, letreros que salen y se van) y todo lo que se dibujó en los lienzos (banderitas del retrete,
// tiquetes, frases de los invitados), contra las palabras de docs/la-pareja.md (scripts/palabras-pareja.mjs) y lo que
// el mismo juego sabe que es de la pareja (`textosDeLaPareja()` del retrete y de la cocina). Tampoco se pide nada de
// la casa (cuartos, recuerdos). El progreso de cada juego queda en el celular y al salir vuelven a su sala de juegos.
// Uso (con el servidor de desarrollo prendido): node scripts/probar-amigos-juegos.mjs [url] [carpeta]
//
// Nota: «wafle», «frappé» y «fresas con crema» están en la lista de lo personal (son gustos de la pareja), pero en la
// cocina son los platos mismos del juego; ahí lo personal es la anécdota, que sí se revisa (frases de la pareja).
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { SupabaseFalso } from './supabase-falso.mjs';
import { PALABRAS_PAREJA, buscarPersonal } from './palabras-pareja.mjs';

const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const carpeta = process.argv[3] ?? 'test-results/amigos-juegos';
mkdirSync(carpeta, { recursive: true });
const errores = [];
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const revisar = (ok, texto) => {
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${texto}`);
  if (!ok) errores.push(texto);
};
const esperar = (p, fn, arg, ms = 30000) => p.waitForFunction(fn, arg, { timeout: ms, polling: 250 }).then(() => true, () => false);

const PRE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({
  executablePath: existsSync(PRE) ? PRE : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const red = new SupabaseFalso({ perder: 0.05, demora: 150 });

/** Lo que corre en cada página antes que el juego: el perfil del amigo y el registro de todo lo que se ve. */
const ESPIA = ([perfil]) => {
  localStorage.setItem('nuestro-hogar-amigo', JSON.stringify(perfil));
  window.__dibujados = new Set();
  window.__vistos = new Set();
  for (const f of ['fillText', 'strokeText']) {
    const orig = CanvasRenderingContext2D.prototype[f];
    CanvasRenderingContext2D.prototype[f] = function (t, ...r) {
      try {
        if (window.__dibujados.size < 20000) window.__dibujados.add(String(t));
      } catch {
        /* nada */
      }
      return orig.call(this, t, ...r);
    };
  }
  addEventListener('DOMContentLoaded', () => {
    new MutationObserver((ms) => {
      for (const m of ms) {
        const el = m.target.nodeType === 1 ? m.target : m.target.parentElement;
        const t = el?.textContent?.trim();
        if (t && t.length < 3000 && !/^[\d.,\s m×]+$/.test(t)) window.__vistos.add(t);
      }
    }).observe(document.documentElement, { subtree: true, childList: true, characterData: true });
  });
};

async function celular(nombre, perfil) {
  const ctx = await navegador.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.nombre = nombre;
  p.pedidos = [];
  p.on('pageerror', (e) => errores.push(`${nombre}: ${e}`));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|403|WebGL|GPU stall/.test(m.text()) && errores.push(`${nombre}: ${m.text()}`));
  p.on('request', (r) => p.pedidos.push(r.url()));
  await red.conectar(p, 'el');
  await p.addInitScript(ESPIA, [perfil]);
  return p;
}
const foto = (p, n) => p.screenshot({ path: `${carpeta}/${p.nombre}-${n}.png` }).catch(() => {});

/** Lo que el juego sabe que es de la pareja (se pide al mismo juego en la página). */
let personales = [];
const SIN_PLATOS = PALABRAS_PAREJA.filter((x) => !['wafle', 'frappé', 'fresas con crema'].includes(x));
async function nadaPersonal(p, momento, lista = PALABRAS_PAREJA) {
  const texto = await p.evaluate(() => `${document.body.innerText}\n${[...window.__vistos].join('\n')}\n${[...window.__dibujados].join('\n')}`);
  const hallado = buscarPersonal(texto, [...lista, ...personales]);
  revisar(!hallado.length, `${p.nombre} no ve nada personal: ${momento}${hallado.length ? ` (${hallado.slice(0, 5).join(' | ')})` : ''}`);
}
function nadaDeLaCasa(p, momento) {
  const casa = p.pedidos.filter((u) => /\/recuerdos\/|casa_[a-z]+\.glb|\/index\.html|supabase\.co/.test(u));
  revisar(!casa.length, `${p.nombre} no pide nada de la casa: ${momento}${casa.length ? ` (${casa.slice(0, 3).join(' | ')})` : ''}`);
}

const PIPE = { id: 'amigo-pipe12345', nombre: 'Pipe', cuerpo: 'ella', piel: '#a5653d', pelo: '#d76b9a', ropa: '#3fb5a3', ropa2: '#4a4a52', zapatos: '#f4efe6', activo: true, creado: 1 };
const CARO = { id: 'amigo-caro12345', nombre: 'Caro', cuerpo: 'el', piel: '#f6c8a4', pelo: '#c99a5b', ropa: '#e85d5d', ropa2: '#1d1d24', zapatos: '#f4efe6', activo: true, creado: 2 };

// ================================================================================================ 1. El retrete
const p = await celular('pipe', PIPE);
// (con un récord guardado, para que salga la banderita de «Tu récord» y ver que la de la pareja no)
await p.addInitScript(() => {
  if (!localStorage.getItem('amigo-retrete-progreso')) localStorage.setItem('amigo-retrete-progreso', JSON.stringify({ mejor: 400, vuelos: 3, rollitos: 50 }));
});
await p.goto(`${url}/retrete.html`, { waitUntil: 'domcontentloaded', timeout: 180000 });
revisar(await esperar(p, () => window.__cohete?.estado()?.fase === 'juego', null, 180000), 'El retrete despega sin la casa');
personales = await p.evaluate(async () => (await import('/src/casa/cohete.ts')).textosDeLaPareja());
revisar(personales.length > 20, `Se sabe qué es de la pareja en el retrete (${personales.length} textos)`);
const pelo = await p.evaluate(() => {
  let c = '';
  window.__cohete.juego().muneco.p.modelo.traverse((o) => {
    const mats = o.isMesh ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of mats) if (/cabello|\bpelo\b/i.test(m.name) && !c) c = `#${m.color.getHexString()}`;
  });
  return c;
});
revisar(pelo === PIPE.pelo, `Vuela con su muñeco y su color de pelo (${pelo})`);
await foto(p, '1-retrete-despega');
// Recorre todos los tramos con el piloto automático (y anota cada figura de rollitos que sale)
await p.evaluate(() => {
  const j = window.__cohete.juego();
  window.__figuras = [];
  const poner = j.rollos.poner.bind(j.rollos);
  j.rollos.poner = (f, ...r) => {
    window.__figuras.push(f.nombre);
    return poner(f, ...r);
  };
  window.__cohete.manual();
  window.__cohete.dios();
  window.__cohete.bot();
});
for (const m of [0, 500, 800, 1000, 1000, 1200, 1700, 600, 400, 400]) {
  await p.evaluate((m) => {
    window.__cohete.saltar(m);
    window.__cohete.simular(16);
  }, m);
}
const figuras = await p.evaluate(() => [...new Set(window.__figuras)]);
console.log('      figuras:', figuras.join(' · '));
revisar(!figuras.some((f) => /ELLA|AMO|TQM/.test(f)), 'Ninguna figura de rollitos con palabras de la pareja');
const tramo = await p.evaluate(() => document.querySelector('.cohete-tramo')?.textContent ?? '');
revisar(/chicle/.test(tramo), `La galaxia del amor se llama distinto (${tramo})`);
await p.evaluate(() => window.__cohete.simular(0.2));
await foto(p, '2-retrete-galaxia');
await nadaPersonal(p, 'el vuelo por todos los tramos');
// Choca: la pantalla del vuelo sin récords de la pareja ni monedas de la casa
await p.evaluate(() => {
  window.__cohete.dios(false);
  window.__cohete.chocar();
  window.__cohete.simular(4);
});
await p.waitForSelector('.cohete-resultado [data-otra]', { timeout: 30000 });
await espera(2500);
await foto(p, '3-retrete-resultado');
const resultado = await p.evaluate(() => document.querySelector('.cohete-resultado').innerText);
revisar(/Mis juegos/.test(resultado) && !/Volver a casa|para la casa|Le ganaste|Récord de/.test(resultado), 'La pantalla del vuelo vuelve a sus juegos, sin casa ni récords de la pareja');
// La tienda, pestaña por pestaña
await p.tap('.cohete-resultado [data-tienda]');
await p.waitForSelector('.cohete-tienda', { timeout: 20000 });
for (const t of ['mejoras', 'retrete', 'estela', 'casco', 'misiones']) {
  await p.tap(`.ct-pestanas [data-pestana="${t}"]`);
  await espera(400);
}
await p.tap('.ct-pestanas [data-pestana="estela"]');
await espera(500);
await foto(p, '4-retrete-tienda');
revisar(!/enamorado|Romántico/i.test(await p.evaluate(() => document.querySelector('.cohete-tienda').innerText)), 'La tienda no tiene descripciones románticas');
await nadaPersonal(p, 'la tienda del retrete');
await p.tap('.ct-cerrar');
await p.waitForSelector('.cohete-resultado [data-otra]', { timeout: 20000 });
// Volar otra vez (dice algo del modo neutro) y aterrizar en su sala de juegos
await espera(600);
await p.tap('.cohete-resultado [data-otra]');
// (el retrete sigue en manual: el tiempo lo lleva la prueba)
revisar(await esperar(p, () => ['intro', 'juego'].includes(window.__cohete?.estado()?.fase), null, 30000), '«Volar otra vez» vuelve a despegar');
await p.evaluate(() => window.__cohete.simular(3));
revisar(await p.evaluate(() => window.__cohete.estado().fase === 'juego'), 'Y vuela otra vez');
await p.evaluate(() => {
  window.__cohete.simular(3);
  window.__cohete.chocar();
  window.__cohete.simular(4);
});
await p.waitForSelector('.cohete-resultado [data-casa]', { timeout: 30000 });
await nadaPersonal(p, 'volar otra vez');
nadaDeLaCasa(p, 'el retrete');
const progRetrete = await p.evaluate(() => JSON.parse(localStorage.getItem('amigo-retrete-progreso') ?? 'null'));
revisar(progRetrete?.vuelos >= 5 && progRetrete.mejor > 400, `El progreso del retrete queda en el celular (${progRetrete?.vuelos} vuelos, récord ${progRetrete?.mejor} m)`);
await espera(800);
await p.tap('.cohete-resultado [data-casa]');
await p.waitForURL(/amigos\.html/, { timeout: 20000 }).catch(() => undefined);
revisar(/amigos\.html/.test(p.url()), 'Al salir del retrete vuelve a su sala de juegos');
await p.waitForSelector('.am-sala', { timeout: 30000 }).catch(() => undefined);
await espera(3000);

// ================================================================================================ 2. La cocina sola
p.pedidos = [];
await p.goto(`${url}/cocina.html`, { waitUntil: 'domcontentloaded', timeout: 180000 });
await p.waitForSelector('.cz-menu .cz-carta', { timeout: 120000 });
personales = await p.evaluate(async () => (await import('/src/casa/cocina/invitados.ts')).textosDeLaPareja());
revisar(personales.length > 20, `Se sabe qué es de la pareja en la cocina (${personales.length} textos)`);
await espera(1200);
await foto(p, '5-cocina-menu');
await nadaPersonal(p, 'el menú de la cocina', SIN_PLATOS);
await p.tap('.cz-carta[data-r="wafles"]');
revisar(await esperar(p, () => window.__cocinaMotor?.vista === 'intro', null, 60000), 'Abre la waflería con el «modo chef»');
await espera(3500);
await foto(p, '6-cocina-modo-chef');
revisar(await esperar(p, () => window.__cocinaMotor.vista === 'juego', null, 90000), 'Termina el «modo chef»');
const motor = await p.evaluate(() => {
  const m = window.__cocinaMotor;
  return { neutro: m.neutro, pareja: !!m.pareja, chef: m.imgChef(m.yo, 'intro').src.slice(0, 15), titulo: m.receta.titulo(m.duenoCocina.nombre) };
});
revisar(motor.neutro && !motor.pareja, 'La cocina del amigo va en modo neutro y la pareja no llega a comer');
revisar(/^data:image\/(webp|png)/.test(motor.chef), `Su chef es su muñeco renderizado (${motor.chef})`);
revisar(motor.titulo === 'La Waflería de Pipe', `El letrero dice su nombre (${motor.titulo})`);
await p.tap('.cocina-capa [data-c="jugar"]');
for (let dia = 0; dia < 2; dia++) {
  await p.evaluate(() => window.__cocinaMotor.probar('llegar', 0));
  for (let k = 0; k < 3; k++) {
    await p.evaluate(() => {
      const m = window.__cocinaMotor;
      m.probar('avanzar', 2);
      m.probar('tomar');
      m.probar('avanzar', 1);
      if (m.s.tickets[0]) m.entregar(m.s.tickets[0]);
      m.probar('avanzar', 3.5);
      m.probar('juicio');
    });
    await espera(400);
  }
  await foto(p, `7-cocina-dia${dia + 1}`);
  const ids = await p.evaluate(() => window.__cocinaMotor.s.invitados.map((e) => e.id));
  revisar(!ids.some((i) => /pareja/.test(i)), `Día ${dia + 1}: no llega la pareja a comer (${ids.join(', ')})`);
  await p.evaluate(() => window.__cocinaMotor.probar('fin'));
  await p.waitForSelector('.cocina-fin', { timeout: 20000 });
  await espera(1200);
  const fin = await p.evaluate(() => document.querySelector('.cocina-fin').innerText);
  revisar(!/casa|despensa|regalar|pareja/i.test(fin) && /Mis juegos/.test(fin), `Día ${dia + 1}: el final no habla de la casa`);
  if (dia === 0) {
    await foto(p, '8-cocina-fin');
    await p.tap('.cocina-fin [data-c="siguiente"]');
    await p.waitForSelector('.cocina-capa [data-c="jugar"]', { timeout: 20000 });
    await p.tap('.cocina-capa [data-c="jugar"]');
  }
}
await nadaPersonal(p, 'dos días en la waflería', SIN_PLATOS);
const progCocina = await p.evaluate(() => JSON.parse(localStorage.getItem('amigo-cocina-progreso') ?? 'null'));
revisar(progCocina?.wafles?.dia === 3 && progCocina.wafles.xp > 0, `El progreso de la cocina queda en el celular (día ${progCocina?.wafles?.dia}, ${progCocina?.wafles?.xp} puntos)`);
await p.tap('.cocina-fin [data-c="salir"]');
await p.waitForSelector('.cz-menu .cz-carta', { timeout: 20000 });
revisar(/Día 3/.test(await p.evaluate(() => document.querySelector('.cz-carta[data-r="wafles"]').innerText)), 'El menú muestra el día en que va');

// ================================================================================================ 3. Cocina con otro amigo
const q = await celular('caro', CARO);
await p.evaluate(() => {
  window.__vistos.clear();
  window.__dibujados.clear();
});
await p.tap('.cz-menu [data-a="amigos"]');
await p.waitForSelector('.cocina-elegir [data-r="fresas"]', { timeout: 20000 });
await p.tap('.cocina-elegir [data-r="fresas"]');
revisar(await esperar(p, () => !!document.querySelector('.sala-espera .se-codigo'), null, 60000), 'Pipe abre una cocina para amigos');
const codigo = await p.evaluate(() => document.querySelector('.se-codigo').getAttribute('aria-label').replace(/^Código /, '').replace(/ /g, ''));
await q.goto(`${url}/cocina.html?unirse=${codigo}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
revisar(await esperar(q, () => document.querySelectorAll('.sala-espera .se-puesto:not(.vacio)').length === 2, null, 120000), `Caro entra con el código ${codigo}`);
revisar(/Fresería/.test(await q.evaluate(() => document.querySelector('.sala-espera').innerText)), 'Caro ve qué restaurante abrió Pipe');
await espera(4000);
await foto(q, '9-sala-espera');
await q.tap('.sala-espera [data-a="principal"]', { force: true });
revisar(await esperar(p, () => !document.querySelector('.sala-espera [data-a="principal"]')?.disabled, null, 30000), 'Pipe ve a Caro lista');
await p.tap('.sala-espera [data-a="principal"]', { force: true });
revisar(await esperar(p, () => window.__cocinaMotor?.resumen().juntos && window.__cocinaMotor.receta.id === 'fresas', null, 60000), 'Pipe cocina con Caro en la fresería');
revisar(await esperar(q, () => window.__cocinaMotor?.resumen().juntos, null, 60000), 'Caro está en la cocina de Pipe');
for (const c of [p, q]) {
  const m = await c.evaluate(() => ({ neutro: window.__cocinaMotor.neutro, pareja: !!window.__cocinaMotor.pareja, n: window.__cocinaMotor.jugadores.length }));
  revisar(m.neutro && !m.pareja && m.n === 2, `${c.nombre}: modo neutro, sin pareja y dos cocineros`);
}
await Promise.all([p, q].map((c) => c.evaluate(() => window.__cocinaMotor.probar('intro'))));
revisar(await esperar(q, () => window.__cocinaMotor.resumen().n > 0, null, 30000), 'Caro recibe el día de Pipe');
await q.evaluate(() => window.__cocinaMotor.probar('jugar'));
revisar(await esperar(p, () => window.__cocinaMotor.resumen().fase === 'jugando', null, 30000), 'El «¡A cocinar!» de Caro arranca el día');
await p.evaluate(() => window.__cocinaMotor.probar('llegar', 0));
await esperar(p, () => window.__cocinaMotor.resumen().invitados.includes('fila'), null, 20000);
await espera(3000);
await q.evaluate(() => window.__cocinaMotor.probar('tomar'));
revisar(await esperar(q, () => window.__cocinaMotor.resumen().tickets.length >= 1, null, 30000), 'El pedido que toma Caro les sale a los dos');
// Caro se va a «Picar» y toca: Pipe ve su carita en la pestaña y su mano
await q.evaluate(() => {
  const m = window.__cocinaMotor;
  m.irA(1);
  m.dedo = { x: m.W * 0.4, y: m.H * 0.5 };
});
await p.evaluate(() => window.__cocinaMotor.irA(1));
revisar(await esperar(p, () => window.__cocinaMotor.otros().some((o) => o.p.est === 1 && o.p.dedo), null, 20000), 'Pipe ve a Caro en la misma estación, con su mano');
revisar(await esperar(p, () => window.__cocinaMotor.otros().every((o) => !o.j.aspecto || !window.__cocinaMotor.imgChef(o.j, 'feliz').src.startsWith('data:image/svg')), null, 90000), 'La carita de Caro es su chef renderizado');
await espera(1200);
await foto(p, '10-juntos-estacion');
await q.evaluate(() => {
  const m = window.__cocinaMotor;
  m.dedo = null;
  m.entregar(m.s.tickets[0]);
});
revisar(await esperar(p, () => window.__cocinaMotor.resumen().puntajes.length === 1, null, 30000), 'Pipe califica lo que entregó Caro');
revisar(await esperar(q, () => window.__cocinaMotor.s.fase === 'juicio', null, 30000), 'Caro ve la calificación');
await espera(2500);
await foto(q, '11-juntos-juicio');
await p.evaluate(() => window.__cocinaMotor.probar('juicio'));
await p.evaluate(() => window.__cocinaMotor.probar('fin'));
revisar(await esperar(q, () => window.__cocinaMotor.resumen().fase === 'fin', null, 30000), 'Los dos terminan el día');
await espera(1500);
await foto(q, '12-juntos-fin');
const finCaro = await q.evaluate(() => document.querySelector('.cocina-fin')?.innerText ?? '');
revisar(/propia fresería/.test(finCaro) && !/casa/i.test(finCaro), 'A Caro sus puntos le van a su propia fresería (sin casa)');
const [pp, pq] = await Promise.all([p, q].map((c) => c.evaluate(() => JSON.parse(localStorage.getItem('amigo-cocina-progreso') ?? 'null')?.fresas)));
revisar(pp?.xp > 0 && pq?.xp > 0 && pp.dia === 2 && pq.dia === 1, `Cada uno guarda lo suyo (Pipe día ${pp?.dia}, Caro día ${pq?.dia})`);
for (const c of [p, q]) await nadaPersonal(c, 'la cocina en sala', SIN_PLATOS);
// «A la sala»: los dos vuelven; Caro sale; Pipe sale a su menú y a su sala de juegos
await p.tap('.cocina-fin [data-c="sala"]');
revisar(await esperar(q, () => !!document.querySelector('.sala-espera.visible'), null, 30000), 'Los dos vuelven a la sala de espera');
await espera(800);
await q.tap('.sala-espera [data-a="salir"]');
revisar(await esperar(q, () => !!document.querySelector('.cz-menu .cz-carta'), null, 30000), 'Caro sale de la sala a su cocina');
revisar(await esperar(p, () => document.querySelectorAll('.sala-espera .se-puesto:not(.vacio)').length === 1, null, 30000), 'Pipe ve que Caro se fue');
await p.tap('.sala-espera [data-a="salir"]');
await p.waitForSelector('.cz-menu .cz-carta', { timeout: 30000 });
nadaDeLaCasa(p, 'la cocina');
nadaDeLaCasa(q, 'la cocina');
await p.tap('.cz-menu [data-a="volver"]');
await p.waitForURL(/amigos\.html/, { timeout: 20000 }).catch(() => undefined);
revisar(/amigos\.html/.test(p.url()), 'Al salir de la cocina vuelve a su sala de juegos');

// ================================================================================================ 4. Sin modo amigo, a la casa
const r = await (await navegador.newContext({ viewport: { width: 844, height: 390 } })).newPage();
await r.goto(`${url}/retrete.html`, { waitUntil: 'domcontentloaded' });
await r.waitForURL(/index\.html/, { timeout: 15000 }).catch(() => undefined);
revisar(/index\.html/.test(r.url()), 'Un celular que no es de amigo no abre retrete.html: va a la casa');
await r.goto(`${url}/cocina.html`, { waitUntil: 'domcontentloaded' });
await r.waitForURL(/index\.html/, { timeout: 15000 }).catch(() => undefined);
revisar(/index\.html/.test(r.url()), 'Ni cocina.html');

await navegador.close();
if (errores.length) {
  console.log(`\n${errores.length} problema(s):\n${errores.slice(0, 25).join('\n')}`);
  process.exit(1);
}
console.log('\nTodo bien: los amigos juegan el retrete y la cocina sin la casa y sin ver nada de la pareja.');
