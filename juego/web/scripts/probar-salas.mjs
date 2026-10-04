// Prueba de las salas (src/salas/): cinco «celulares» con un Supabase de mentiras que pierde y demora mensajes.
// Uno crea la sala y abre la sala de espera; entran tres más y al quinto le dice que está llena; todos se mandan
// mensajes fiables (llegan todos, una vez y en orden) y rápidos; a uno se le corta la conexión (los demás se
// enteran y vuelve); se van a segundo plano; el anfitrión empieza (la entrada se cierra y nadie más entra) y al
// final se va (a los demás les avisa que se acabó la sala).
// Uso (con el servidor de desarrollo prendido): node scripts/probar-salas.mjs [url] [carpeta]
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { SupabaseFalso } from './supabase-falso.mjs';

const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const carpeta = process.argv[3] ?? 'test-results/salas';
mkdirSync(carpeta, { recursive: true });
const red = new SupabaseFalso({ perder: Number(process.env.PERDER ?? 0.08), demora: Number(process.env.DEMORA ?? 250) });
const errores = [];
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const revisar = (ok, texto) => {
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${texto}`);
  if (!ok) errores.push(texto);
};
const esperarQue = async (fn, ms, cada = 200) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (await fn().catch(() => false)) return true;
    await espera(cada);
  }
  return false;
};

const PAGINA = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#c7c1ba;font-family:sans-serif"><script type="module">
import '/src/estilos.css';
import { crearSala, unirseSala } from '/src/salas/sala.ts';
import { esperarEnSala } from '/src/salas/espera.ts';
window.__log = [];
window.__cortes = [];
window.__fin = null;
const escuchar = (s) => {
  window.__sala = s;
  s.al('prueba', (d, de) => window.__log.push([de.id, d.n]));
  s.al('rapido', (d, de) => (window.__rapidos = (window.__rapidos ?? 0) + 1));
  s.alCorte((c, q) => window.__cortes.push([c, q.nombre]));
  s.alFin((m, t) => (window.__fin = [m, t]));
};
window.__crear = async () => { const s = await crearSala({ juego: 'prueba', max: 4 }); escuchar(s); return s.codigo; };
window.__unirse = async (c) => { try { const s = await unirseSala(c, 'prueba'); escuchar(s); return 'ok'; } catch (e) { return String(e.message); } };
window.__espera = () => { const e = esperarEnSala({ sala: window.__sala, titulo: 'Lavarse la cara', subtitulo: 'Hasta 4 en la misma cara', tema: new URLSearchParams(location.search).get('tema') || 'burbujas', alEmpezar: () => ({ semilla: 42 }) }); e.resultado.then((r) => (window.__resultado = r)); };
window.__mandar = (n) => { for (let k = 0; k < n; k++) window.__sala.mandar('prueba', { n: k }); };
window.__pagina = true;
</script></body></html>`;

const PRE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({ executablePath: existsSync(PRE) ? PRE : undefined });
const nombres = ['Javier', 'Laura', 'Pipe', 'Caro', 'Quinto'];
async function celular(k) {
  const ctx = await navegador.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.nombre = nombres[k];
  p.on('pageerror', (e) => errores.push(`${p.nombre}: ${e}`));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errores.push(`${p.nombre}: ${m.text()}`));
  await red.conectar(p, k === 1 ? 'ella' : 'el');
  // Javier y Laura con su sesión de la casa; los demás, amigos
  await p.addInitScript(([k, n]) => {
    localStorage.clear();
    if (k === 0) localStorage.setItem('nuestro-hogar-sesion', JSON.stringify({ parejaId: 'p', codigo: 'ABC123', rol: 'el' }));
    else if (k === 1) localStorage.setItem('nuestro-hogar-sesion', JSON.stringify({ parejaId: 'p', codigo: 'ABC123', rol: 'ella' }));
    else localStorage.setItem('nuestro-hogar-amigo', JSON.stringify({ id: `amigo-prueba${k}x`, nombre: n, cuerpo: k % 2 ? 'ella' : 'el', piel: '#c27f52', pelo: '#b5482f', ropa: '#4f8fe0', ropa2: '#1d1d24', zapatos: '#f4efe6', activo: true }));
  }, [k, nombres[k]]);
  await p.route(/_salas\.html/, (r) => r.fulfill({ contentType: 'text/html', body: PAGINA }));
  await p.goto(`${url}/_salas.html?tema=${process.env.TEMA ?? 'burbujas'}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await p.waitForFunction(() => window.__pagina, null, { timeout: 120000 });
  return p;
}

const ps = [];
for (let k = 0; k < 5; k++) ps.push(await celular(k));
const [a, b, c, d, e] = ps;

// 1. Javier crea la sala y abre la sala de espera
const codigo = await a.evaluate(() => window.__crear());
revisar(/^[A-HJKMNP-Z2-9]{5}$/.test(codigo), `Código de 5 sin letras confusas: ${codigo}`);
await a.evaluate(() => window.__espera());
await espera(600);
await a.screenshot({ path: `${carpeta}/1-sala-sola.png` });

// 2. Entran tres; el quinto no cabe
for (const p of [b, c, d]) revisar((await p.evaluate((x) => window.__unirse(x), codigo)) === 'ok', `${p.nombre} entra a la sala`);
for (const p of [b, c, d]) await p.evaluate(() => window.__espera());
const lleno = await e.evaluate((x) => window.__unirse(x), codigo);
revisar(/llena/.test(lleno), `Al quinto le dice que está llena («${lleno}»)`);
const malo = await e.evaluate(() => window.__unirse('ZZZZZ'));
revisar(/No encontramos/.test(malo), 'Un código que no existe avisa con cariño');
const cuatro = await esperarQue(async () => (await Promise.all(ps.slice(0, 4).map((p) => p.evaluate(() => window.__sala.jugadores.length)))).every((n) => n === 4), 8000);
revisar(cuatro, 'Los cuatro ven a los cuatro');
const puestos = await a.evaluate(() => window.__sala.jugadores.map((j) => `${j.puesto}:${j.nombre}:${j.tipo}`).join(' '));
console.log('     ', puestos);
revisar(await b.evaluate(() => window.__sala.hayAmigos), 'La sala sabe que hay amigos');
await a.screenshot({ path: `${carpeta}/2-cuatro.png` });

// 3. Los invitados se alistan; el anfitrión ve «Empezar»
for (const p of [b, c, d]) await p.click('.se-principal');
const puede = await esperarQue(() => a.evaluate(() => !document.querySelector('.se-principal').disabled), 8000);
revisar(puede, 'Con todos listos el anfitrión puede empezar');
await a.screenshot({ path: `${carpeta}/3-listos-anfitrion.png` });
await c.screenshot({ path: `${carpeta}/3-listos-invitado.png` });

// 4. Mensajes fiables con pérdidas: llegan todos, una vez y en orden
const N = 60;
for (const p of ps.slice(0, 4)) await p.evaluate((n) => window.__mandar(n), N);
for (const p of ps.slice(0, 4)) await p.evaluate(() => { for (let k = 0; k < 20; k++) window.__sala.mandar('rapido', { k }, { rapido: true }); });
const todos = await esperarQue(async () => (await Promise.all(ps.slice(0, 4).map((p) => p.evaluate(() => window.__log.length)))).every((n) => n >= 3 * 60), 20000);
let enOrden = true;
for (const p of ps.slice(0, 4)) {
  const log = await p.evaluate(() => window.__log);
  const por = {};
  for (const [de, n] of log) (por[de] ??= []).push(n);
  for (const l of Object.values(por)) if (l.length !== N || l.some((n, i) => n !== i)) enOrden = false;
}
revisar(todos && enOrden, `Fiables: ${N} de cada uno a cada uno, sin repetidos y en orden (con ${Math.round(red.perder * 100)} % perdidos)`);
const rapidos = await b.evaluate(() => window.__rapidos ?? 0);
revisar(rapidos > 30 && rapidos <= 60, `Rápidos sin garantía: llegaron ${rapidos} de 60`);

// 5. Se le corta el internet a Pipe: los demás se enteran; vuelve
red.cortar(c, true);
const seCorto = await esperarQue(() => a.evaluate(() => window.__cortes.some(([x, n]) => x && n === 'Pipe')), 7000);
revisar(seCorto, 'Al cortarse Pipe, a los demás les sale el corte');
await a.screenshot({ path: `${carpeta}/4-corte.png` });
red.cortar(c, false);
const volvio = await esperarQue(() => a.evaluate(() => window.__cortes.some(([x, n]) => !x && n === 'Pipe')), 7000);
revisar(volvio, 'Y cuando vuelve, se enteran también');

// 6. Segundo plano: Caro esconde la app y los demás lo saben de una
await d.evaluate(() => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
  document.dispatchEvent(new Event('visibilitychange'));
});
const fondo = await esperarQue(() => b.evaluate(() => window.__cortes.some(([x, n]) => x && n === 'Caro')), 3000);
revisar(fondo, 'Si alguien se va a segundo plano, los demás pausan al instante');
await d.evaluate(() => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  document.dispatchEvent(new Event('visibilitychange'));
});
await esperarQue(() => b.evaluate(() => window.__cortes.some(([x, n]) => !x && n === 'Caro')), 5000);

// 7. Empezar: a todos les llegan los datos y la entrada se cierra
await esperarQue(() => a.evaluate(() => !document.querySelector('.se-principal').disabled), 8000);
await a.click('.se-principal', { force: true });
const empezaron = await esperarQue(async () => (await Promise.all(ps.slice(0, 4).map((p) => p.evaluate(() => window.__resultado?.que === 'empezar' && window.__resultado.datos?.semilla === 42)))).every(Boolean), 10000);
revisar(empezaron, 'Al empezar, a todos les llegan los datos de la partida');
const tarde = await e.evaluate((x) => window.__unirse(x), codigo);
revisar(/empezó/.test(tarde), `Quien llega con la partida empezada no entra («${tarde}»)`);

// 8. El anfitrión se va: a los demás les avisa
await a.evaluate(() => window.__sala.salir());
const fin = await esperarQue(async () => (await Promise.all([b, c, d].map((p) => p.evaluate(() => window.__fin?.[0] === 'anfitrion')))).every(Boolean), 8000);
revisar(fin, 'Si el anfitrión se va, la sala se acaba con aviso para todos');
console.log(`      (pasaron ${red.mensajes} mensajes, ${Math.round(red.bytes / 1024)} KB)`);

await navegador.close();
if (errores.length) {
  console.log('\nErrores:\n' + errores.join('\n'));
  process.exit(1);
}
console.log('\nTodo bien con las salas.');
