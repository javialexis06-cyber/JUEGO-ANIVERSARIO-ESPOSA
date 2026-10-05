// Prueba de «Lavarse la cara» de a cuatro en una sala: Javier, Laura y dos amigos (Pipe y Caro), cada uno en su
// «celular» (contextos de Playwright con toques de verdad), con un Supabase de mentiras que demora y pierde mensajes.
// Javier crea la sala desde el menú, Laura entra por la invitación de la casa, Pipe escribe el código y Caro entra
// también; se alistan y Javier empieza. Juegan (Javier con el bot, los demás con el teclado), suben de nivel (Caro no
// escoge y se le escoge solo), a Caro se le corta el internet (pausa con aviso, vuelve; después se corta largo, siguen
// sin ella y vuelve a entrar), Laura cae y la levantan, y al final todos ven la pantalla final con el mismo tiempo y
// vuelven a la sala. Todo el rato revisa que NADIE vea nada personal de la pareja (hay amigos en la sala): ni en la
// pantalla ni en los avisos del juego.
// Uso (con el servidor de desarrollo prendido): node scripts/probar-lavado-salas.mjs [url] [carpeta]
//   PERDER=0.06 (mensajes perdidos), DEMORA=220 (ms máximos de demora)
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { SupabaseFalso } from './supabase-falso.mjs';
import { PALABRAS_PAREJA, buscarPersonal } from './palabras-pareja.mjs';

const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const carpeta = process.argv[3] ?? 'test-results/lavado-salas';
mkdirSync(carpeta, { recursive: true });
const red = new SupabaseFalso({ perder: Number(process.env.PERDER ?? 0.06), demora: Number(process.env.DEMORA ?? 220) });
const errores = [];
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const revisar = (ok, texto) => {
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${texto}`);
  if (!ok) errores.push(texto);
};
const esperarQue = async (fn, ms, cada = 300) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (await fn().catch(() => false)) return true;
    await espera(cada);
  }
  return false;
};

// Una página con solo el lavado (sin la casa): Javier y Laura con su sesión; los amigos con su perfil
const PAGINA = (k) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#c7c1ba"><script type="module">
import '/src/estilos.css';
const L = await import('/src/casa/lavado.ts');
const { CARTAS } = await import('/src/casa/lavado/cartas.ts');
const { DISFRACES } = await import('/src/casa/lavado/disfraces.ts');
const T = await import('/src/casa/lavado/textos.ts');
// Lo personal de las cartas y los disfraces: lo que cambia en modo neutro (los nombres y frases de la pareja)
T.ponerNeutro(true);
window.__personal = [
  ...Object.values(CARTAS).flatMap((c) => [c.nombre, c.recuerdo].filter((x, k) => x !== [T.cartaVista(c.id).nombre, T.cartaVista(c.id).recuerdo][k])),
  ...DISFRACES.flatMap((d) => [d.nombre, d.desc, d.grito].filter((x, k) => x !== [T.disfrazVisto(d).nombre, T.disfrazVisto(d).desc, T.disfrazVisto(d).grito][k])),
];
T.ponerNeutro(false);
const amigo = ${k >= 2};
const rol = ${k === 1 ? "'ella'" : k === 3 ? "'ella'" : "'el'"};
const prog = L.progresoLavadoNuevo(rol);
prog.tutorial = true;
// (los de la pareja con disfraces y carta de amor que dirían cosas personales si no estuviera el modo neutro)
if (!amigo) { prog.disfraz = rol === 'el' ? 'el_panda' : 'ella_pulga'; prog.carta = 'octubre'; prog.logros = ['sobrevivir5']; }
window.__avisos = [];
new MutationObserver(() => document.querySelectorAll('.lv-aviso, .lv-jefe').forEach((a) => a.textContent && window.__avisos.push(a.textContent))).observe(document.body, { subtree: true, childList: true, characterData: true });
window.__arrancar = (unirse) => L.jugarLavado({
  rol, nombres: { el: 'Javier', ella: 'Laura' }, progreso: prog, unirse,
  amigo: amigo ? { nombre: ${k === 2 ? "'Pipe'" : "'Caro'"}, aspecto: { cuerpo: rol, piel: '${k === 2 ? '#8a5a3b' : '#f6c8a4'}', pelo: '${k === 2 ? '#b5482f' : '#d76b9a'}', detalles: { ropa: '#4f8fe0', ropa2: '#1d1d24', zapatos: '#f4efe6' } } } : undefined,
  textoSalir: amigo ? '🎮 Volver a la sala de juegos' : undefined,
  guardar: async (p) => { window.__guardado = p; },
  pareja: amigo ? null : { modo: 'linea', invitar: async (id) => { window.__invitacion = id; } },
}).then((r) => (window.__resultado = r));
window.__pagina = true;
</script></body></html>`;

const PRE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({
  executablePath: existsSync(PRE) ? PRE : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const NOMBRES = ['Javier', 'Laura', 'Pipe', 'Caro'];
async function celular(k) {
  const ctx = await navegador.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.nombre = NOMBRES[k];
  p.on('pageerror', (e) => { if (!errores.some((x) => x === `${p.nombre}: ${e}`)) console.log('      error en', p.nombre, String(e).slice(0, 300)); errores.push(`${p.nombre}: ${e}`); });
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|403/.test(m.text()) && errores.push(`${p.nombre}: ${m.text()}`));
  await red.conectar(p, k === 1 ? 'ella' : 'el');
  await p.addInitScript(([k, n]) => {
    localStorage.clear();
    if (k === 0) localStorage.setItem('nuestro-hogar-sesion', JSON.stringify({ parejaId: 'p', codigo: 'ABC123', rol: 'el' }));
    else if (k === 1) localStorage.setItem('nuestro-hogar-sesion', JSON.stringify({ parejaId: 'p', codigo: 'ABC123', rol: 'ella' }));
    else localStorage.setItem('nuestro-hogar-amigo', JSON.stringify({ id: `amigo-prueba${k}xyz`, nombre: n, cuerpo: k === 3 ? 'ella' : 'el', activo: true }));
  }, [k, NOMBRES[k]]);
  await p.route(/_lavado_salas\.html/, (r) => r.fulfill({ contentType: 'text/html', body: PAGINA(k) }));
  await p.goto(`${url}/_lavado_salas.html?sin3d&calidad=0`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await p.waitForFunction(() => window.__pagina, null, { timeout: 120000 });
  return p;
}
/** Los invitados escogen lo que les salga (cartas, cofres, cartas mágicas) hasta que el juego siga. */
async function resolverCapas(ms = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (!(await javier.evaluate(() => window.__lavado.actual?.m?.pausa))) return true;
    for (const p of ps.slice(1)) {
      await p.evaluate(() => {
        const toque = (el) => el && el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        toque(document.querySelector('.lv-c-nivel:not([hidden]) .lv-carta'));
        toque(document.querySelector('.lv-c-carta:not([hidden]) .lv-sobre'));
        toque(document.querySelector('.lv-c-cofre:not([hidden]) [data-listo]'));
      });
    }
    await espera(700);
  }
  return false;
}
const foto = (p, n) => p.screenshot({ path: `${carpeta}/${p.nombre}-${n}.png` });
const estado = (p) => p.evaluate(() => window.__lavado?.actual?.probar('nada'));
const probar = (p, que, v) => p.evaluate(([q, v]) => window.__lavado.actual.probar(q, v), [que, v]);
const tecla = (p, tipo, k) => p.evaluate(([tipo, k]) => window.dispatchEvent(new KeyboardEvent(tipo, { key: k })), [tipo, k]);
/** Nada personal en la pantalla ni en los avisos que han salido. */
async function sinNadaPersonal(p, momento) {
  const r = await p.evaluate(() => ({ texto: document.body.innerText, avisos: window.__avisos.join('\n'), personal: window.__personal }));
  const hallado = buscarPersonal(`${r.texto}\n${r.avisos}`, [...PALABRAS_PAREJA, ...r.personal]);
  revisar(!hallado.length, `${p.nombre} no ve nada personal (${momento})${hallado.length ? `: ${hallado.slice(0, 5).join(' | ')}` : ''}`);
}

const ps = [];
for (let k = 0; k < 4; k++) ps.push(await celular(k));
const [javier, laura, pipe, caro] = ps;

// 1. Javier crea la sala desde el menú («Jugar con Laura»: la invitación le llega a la casa de ella)
await javier.evaluate(() => void window.__arrancar());
await javier.waitForSelector('.lv-menu:not([hidden]) [data-m="pareja"]', { timeout: 90000 });
await javier.tap('[data-m="pareja"]');
revisar(await esperarQue(() => javier.evaluate(() => !!window.__invitacion), 20000), 'A Laura le llega la invitación con el código de la sala');
const codigo = await javier.evaluate(() => window.__invitacion);
await javier.waitForSelector('.sala-espera.visible', { timeout: 20000 });

// 2. Laura entra por la invitación; Pipe escribe el código; Caro entra también
await laura.evaluate((c) => void window.__arrancar(c), codigo);
await pipe.evaluate(() => void window.__arrancar());
await pipe.waitForSelector('.lv-menu:not([hidden]) [data-m="codigo"]', { timeout: 90000 });
await pipe.tap('[data-m="codigo"]');
await pipe.fill('.lv-codigo-panel input', codigo.toLowerCase());
await foto(pipe, '0-codigo');
await pipe.tap('.lv-codigo-panel .lv-boton.rosa');
await caro.evaluate((c) => void window.__arrancar(c), codigo);
const cuatro = await esperarQue(async () => (await Promise.all(ps.map((p) => p.evaluate(() => document.querySelectorAll('.se-puesto:not(.vacio)').length)))).every((n) => n === 4), 30000);
revisar(cuatro, 'Los cuatro están en la sala de espera');
for (const p of ps) await sinNadaPersonal(p, 'sala de espera');
await foto(javier, '1-sala');
await foto(caro, '1-sala');

// 3. Se alistan y Javier empieza
for (const p of [laura, pipe, caro]) await p.tap('.se-principal');
revisar(await esperarQue(() => javier.evaluate(() => !document.querySelector('.se-principal').disabled), 15000), 'Con todos listos, Javier puede empezar');
await javier.click('.se-principal', { force: true });
const enJuego = (p) => p.evaluate(() => window.__lavado?.actual?.m?.jug.length === 4);
revisar(await esperarQue(async () => (await Promise.all(ps.map(enJuego))).every(Boolean), 90000), 'Los cuatro entran a la misma cara');
await esperarQue(() => javier.evaluate(() => !document.querySelector('.lv-c-espera:not([hidden])')), 30000);
await probar(javier, 'aguante');
await probar(javier, 'bot', 1);
// (para que las subidas de nivel no pausen a cada rato mientras se prueba lo demás: las pone la prueba)
await javier.evaluate(() => (window.__lavado.actual.m.nivel = 60));
await resolverCapas();
const dificultad = await javier.evaluate(() => window.__lavado.actual.m.porJugadores('densidad'));
revisar(dificultad > 2, `Con cuatro hay más mugrosos a la vez (×${dificultad})`);

// 4. Los demás caminan: Javier los ve moverse
await resolverCapas();
// (en el navegador de prueba, con cuatro celulares en la misma máquina, los de atrás van lentos: se espera a que
// cada uno camine de verdad en su celular y después se mira que Javier lo vea donde está)
// (el puesto de cada uno depende de quién llegó primero)
const idx = {};
(await javier.evaluate(() => window.__lavado.actual.m.jug.map((j) => j.nombre))).forEach((n, i) => (idx[n] = i));
console.log('      puestos:', JSON.stringify(idx));
const antes = await estado(javier);
let movieron = true;
for (const [p, i, k] of [[laura, idx.Laura, 'd'], [pipe, idx.Pipe, 'w'], [caro, idx.Caro, 'a']]) {
  const yo0 = (await estado(p)).jug[i];
  await tecla(p, 'keydown', k);
  const camino = await esperarQue(async () => {
    const yo = (await estado(p)).jug[i];
    return Math.hypot(yo.x - yo0.x, yo.y - yo0.y) > 90;
  }, 30000, 400);
  if (!camino) console.log('      no camina', p.nombre, JSON.stringify(await p.evaluate(() => window.__lavado.actual.red)), JSON.stringify(yo0), JSON.stringify((await estado(p)).jug[i]));
  await tecla(p, 'keyup', k);
  const loVe = camino && (await esperarQue(async () => {
    const [mio, deJavier] = [(await estado(p)).jug[i], (await estado(javier)).jug[i]];
    return Math.hypot(deJavier.x - antes.jug[i].x, deJavier.y - antes.jug[i].y) > 60 && Math.hypot(deJavier.x - mio.x, deJavier.y - mio.y) < 60;
  }, 15000, 400));
  if (!loVe) movieron = false;
}
const despues = await estado(javier);
if (!movieron) for (const p of ps) console.log('     ', p.nombre, JSON.stringify(await p.evaluate(() => window.__lavado.actual.red)), JSON.stringify((await estado(p)).jug.map((j) => [j.x, j.y])));
revisar(movieron, `Javier ve caminar a los tres (${[idx.Laura, idx.Pipe, idx.Caro].map((i) => `${despues.jug[i].x},${despues.jug[i].y}`).join(' · ')})`);
const vistaLaura = await estado(laura);
revisar(Math.hypot(vistaLaura.jug[idx.Pipe].x - despues.jug[idx.Pipe].x, vistaLaura.jug[idx.Pipe].y - despues.jug[idx.Pipe].y) < 80, 'Laura ve a Pipe donde está');
await foto(javier, '2-jugando');
await foto(pipe, '2-jugando');

// 5. Suben de nivel: Laura y Pipe escogen; Caro se demora y se le escoge solo
await probar(javier, 'subir');
// (a Javier le escoge el bot al instante: se mira a los otros tres)
const cartas = await esperarQue(async () => (await Promise.all(ps.slice(1).map((p) => p.evaluate(() => !document.querySelector('.lv-c-nivel').hidden)))).every(Boolean), 40000);
if (!cartas) for (const p of ps) console.log('     ', p.nombre, JSON.stringify(await p.evaluate(() => window.__lavado.actual.red)), JSON.stringify((await estado(p)).jug.map((j) => [j.opciones, j.acciones, j.pend])), (await estado(p)).nivel);
revisar(cartas, 'A todos les salen las cartas');
await foto(caro, '3-cartas');
for (const p of [laura, pipe]) {
  await espera(500);
  await p.locator('.lv-c-nivel:not([hidden]) .lv-carta').first().tap({ timeout: 10000 });
}
await esperarQue(() => javier.evaluate(() => !!document.querySelector('.lv-c-espera:not([hidden]) .lv-escogen')), 8000);
await foto(laura, '3-esperando');
await sinNadaPersonal(javier, 'subiendo de nivel');
// Javier escoge con el bot; Caro no hace nada: en 15 s se le escoge solo
// (15 s del reloj del juego: en el navegador de prueba, cargado, pueden ser bastantes más de verdad)
const solo = await esperarQue(() => javier.evaluate(() => !window.__lavado.actual.m.pausa), 70000, 500);
revisar(solo, 'A Caro se le escogió sola la mejora y el juego siguió');

// 6. Cartas mágicas: a Pipe le sale una carta perdida y no ve recuerdos de la pareja
await javier.evaluate((i) => (window.__lavado.actual.m.jug[i].cartaOpciones = ['octubre', 'cartagena', 'sopetran']), idx.Pipe);
revisar(await esperarQue(() => pipe.evaluate(() => !document.querySelector('.lv-c-carta').hidden), 10000), 'A Pipe le sale una carta perdida');
await espera(600);
await foto(pipe, '4-carta');
await sinNadaPersonal(pipe, 'carta mágica');
await pipe.locator('.lv-c-carta:not([hidden]) .lv-sobre').first().tap({ timeout: 10000 });
await esperarQue(() => javier.evaluate(() => !window.__lavado.actual.m.pausa), 10000);

// 7. A Caro se le corta el internet: pausa con aviso y vuelve
await resolverCapas();
red.cortar(caro, true);
revisar(await esperarQue(() => javier.evaluate(() => /conexión con Caro/.test(document.querySelector('.lv-c-espera')?.innerText ?? '')), 9000), 'Al cortarse Caro, a Javier le sale el aviso y se pausa');
await foto(javier, '5-corte');
const t1 = (await estado(javier)).t;
await espera(2500);
revisar(Math.abs((await estado(javier)).t - t1) < 0.3, 'El reloj no corre mientras se espera a Caro');
red.cortar(caro, false);
revisar(await esperarQue(() => javier.evaluate(() => document.querySelector('.lv-c-espera').hidden), 10000), 'Cuando Caro vuelve, siguen');
// Corte largo: siguen sin ella y vuelve a entrar
red.cortar(caro, true);
revisar(await esperarQue(async () => (await estado(javier)).jug[idx.Caro].fuera, 40000, 1000), 'Con el corte largo siguen sin Caro');
const t2 = (await estado(javier)).t;
revisar(await esperarQue(async () => (await estado(javier)).t > t2 + 0.5, 15000), 'Y el juego sigue corriendo para los demás');
red.cortar(caro, false);
revisar(await esperarQue(async () => !(await estado(javier)).jug[idx.Caro].fuera, 20000), 'Caro vuelve a entrar apenas regresa');

// 8. Laura cae y la levantan
await probar(javier, 'aguante');
await probar(javier, 'caer', idx.Laura);
revisar(await esperarQue(async () => (await estado(laura)).jug[idx.Laura].caido, 8000), 'Laura cae en burbujita (y ella lo ve)');
await foto(laura, '6-caida');
await probar(javier, 'bot', 0);
for (let k = 0; k < 90; k++) {
  await probar(javier, 'juntar', idx.Laura);
  if (!(await estado(javier)).jug[idx.Laura].caido) break;
  await espera(400);
}
revisar(!(await estado(javier)).jug[idx.Laura].caido, 'Javier se queda al lado y la levanta');
await espera(800);
for (const p of ps) await sinNadaPersonal(p, 'jugando');

// 9. Se acaba: todos ven la pantalla final con el mismo tiempo y vuelven a la sala
await probar(javier, 'fin');
const finales = await esperarQue(async () => (await Promise.all(ps.map((p) => p.evaluate(() => !document.querySelector('.lv-c-fin')?.hidden)))).every(Boolean), 20000);
revisar(finales, 'Los cuatro ven la pantalla final');
const tiempos = await Promise.all(ps.map((p) => p.evaluate(() => document.querySelector('.lv-resumen b')?.textContent)));
revisar(new Set(tiempos).size === 1, `Con el mismo tiempo (${tiempos.join(', ')})`);
const oros = await Promise.all(ps.map((p) => p.evaluate(() => window.__guardado?.oro ?? 0)));
console.log('      gotas doradas de cada uno:', oros.join(', '));
for (const p of ps) await sinNadaPersonal(p, 'pantalla final');
await foto(caro, '7-fin');
for (const p of ps) await p.tap('[data-f="otra"]');
revisar(await esperarQue(async () => (await Promise.all(ps.map((p) => p.evaluate(() => !!document.querySelector('.sala-espera.visible'))))).every(Boolean), 15000), 'Todos vuelven a la sala de espera');
await foto(javier, '8-otra-vez');

// 10. Javier cierra la sala: a los demás les avisa
await javier.tap('.se-salir');
revisar(await esperarQue(async () => (await Promise.all([laura, pipe, caro].map((p) => p.evaluate(() => /cerró la sala/.test(document.body.innerText))))).every(Boolean), 12000), 'Si Javier se va, a los demás les avisa');
await foto(pipe, '9-se-fue');
console.log(`      (pasaron ${red.mensajes} mensajes por la red, ${Math.round(red.bytes / 1024)} KB)`);

await navegador.close();
if (errores.length) {
  console.log('\nFallas:\n' + errores.join('\n'));
  process.exit(1);
}
console.log('\nTodo bien: de a cuatro en Lavarse la cara.');
