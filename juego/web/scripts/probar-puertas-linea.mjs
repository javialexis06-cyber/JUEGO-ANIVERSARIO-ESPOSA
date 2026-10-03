// Prueba de Cien Puertas en pareja: dos «celulares» (dos páginas) con un Supabase de mentiras que reenvía los
// mensajes del canal (broadcast + presencia) con demoras al azar y mensajes perdidos. Él invita, Ella acepta y
// resuelven puertas juntos: unas las resuelve Ella con sus dedos (llegan al celular de Él, que aplica las reglas) y
// otras Él con la prueba automática de la puerta. Se revisa que lo que uno mueve se vea en el otro, que los candados
// le salgan a quien los tocó, que el inventario se comparta, que la pausa salga si uno se va a segundo plano o se
// corta la conexión, y que al final de cada puerta los dos estados queden idénticos.
// Uso: node scripts/probar-puertas-linea.mjs [url] [carpeta]    (PERDER=0.08 la fracción de mensajes perdidos)
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:5173/puertas.html';
const carpeta = process.argv[3] ?? 'test-results/puertas-linea';
mkdirSync(carpeta, { recursive: true });
const PERDER = Number(process.env.PERDER ?? 0.08);

const paginas = new Set();
const errores = [];
const presencia = new Map();
/** Pruebas de corte: mientras está puesto, lo que manda ese rol no llega. */
const cortado = new Set();

async function entregar(desde, nombre, evento, payload) {
  if (cortado.has(desde.rol)) return;
  for (const p of paginas) {
    if (p === desde) continue;
    // Red de celular: demoras y a veces se pierde un mensaje (los movimientos se repiten hasta que el otro confirma)
    if (Math.random() < PERDER) continue;
    setTimeout(() => void p.evaluate(([n, e, m]) => window.__llega?.(n, e, m), [nombre, evento, payload]).catch(() => {}), 30 + Math.random() * 250);
  }
}
async function sincronizar(nombre) {
  const estado = {};
  for (const [, clave] of presencia.get(nombre) ?? []) (estado[clave] ??= []).push({ rol: clave });
  for (const p of paginas) void p.evaluate(([n, e]) => window.__presencia?.(n, e), [nombre, estado]).catch(() => {});
}
async function servidor(pagina, a) {
  await new Promise((ok) => setTimeout(ok, 20 + Math.random() * 120));
  if (a.op === 'rpc') return { data: 'pareja-de-prueba', error: null };
  if (a.op === 'insert') return { data: null, error: null };
  if (a.op === 'track') {
    if (!presencia.has(a.nombre)) presencia.set(a.nombre, new Map());
    presencia.get(a.nombre).set(pagina, a.clave);
    await sincronizar(a.nombre);
    return {};
  }
  if (a.op === 'send') {
    await entregar(pagina, a.nombre, a.evento, a.payload);
    return {};
  }
  return {};
}

const CLIENTE = ([rol]) => {
  const canales = [];
  window.__llega = (nombre, evento, payload) => {
    for (const c of canales) if (c.nombre === nombre) for (const s of c.subs) if (s.tipo === 'broadcast' && s.filtro.event === evento) s.cb({ payload });
  };
  window.__presencia = (nombre, estado) => {
    for (const c of canales) {
      if (c.nombre !== nombre) continue;
      c.estado = estado;
      for (const s of c.subs) if (s.tipo === 'presence') s.cb({});
    }
  };
  window.__crearSupabase = () => {
    const srv = (op, args) => window.__srv({ op, ...args });
    class Canal {
      constructor(nombre, opts) {
        this.nombre = nombre;
        this.clave = opts?.config?.presence?.key;
        this.subs = [];
        this.estado = {};
        canales.push(this);
      }
      on(tipo, filtro, cb) {
        this.subs.push({ tipo, filtro, cb });
        return this;
      }
      subscribe(cb) {
        setTimeout(() => cb?.('SUBSCRIBED'), 50);
        return this;
      }
      presenceState() {
        return this.estado;
      }
      track() {
        return srv('track', { nombre: this.nombre, clave: this.clave });
      }
      send(m) {
        return srv('send', { nombre: this.nombre, evento: m.event, payload: m.payload });
      }
      unsubscribe() {}
    }
    return {
      auth: { getSession: async () => ({ data: { session: { user: { id: rol } } } }), signInAnonymously: async () => ({ error: null }) },
      rpc: async () => srv('rpc', {}),
      from: () => ({ insert: () => srv('insert', {}) }),
      channel: (n, o) => new Canal(n, o),
    };
  };
  localStorage.setItem('nuestro-hogar-supabase', JSON.stringify({ url: 'https://prueba.supabase.co', clave: 'clave-publica-de-prueba' }));
  localStorage.setItem('nuestro-hogar-sesion', JSON.stringify({ parejaId: 'pareja-de-prueba', codigo: 'ABC123', rol }));
  localStorage.setItem('nuestro-hogar-modo', JSON.stringify({ rol }));
};

const PRE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({
  executablePath: existsSync(PRE) ? PRE : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
async function celular(rol, tam, sinDibujar = false) {
  const ctx = await navegador.newContext({ viewport: tam, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.rol = rol;
  p.on('pageerror', (e) => errores.push(`${rol}: ${e}`));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|favicon/.test(m.text()) && errores.push(`${rol}: ${m.text()}`));
  await p.exposeFunction('__srv', (a) => servidor(p, a));
  await p.addInitScript(CLIENTE, [rol]);
  paginas.add(p);
  // (el celular de Él corre sin dibujar: la prueba va mucho más rápido y las reglas son las mismas)
  await p.goto(`${url}?sinhistoria=1&rapido=2${sinDibujar ? '&revisar=1' : ''}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await p.waitForFunction(() => window.__listo, null, { timeout: 180000 });
  return p;
}
const revisar = (ok, texto) => {
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${texto}`);
  if (!ok) errores.push(texto);
};
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const estado = (p) => p.evaluate(() => window.__puertas.pareja());
/** Espera a que se cumpla algo en una página; si no, cuenta cómo estaba cada una (para entender qué pasó). */
async function esperarEn(p, fn, arg, ms = 90000) {
  try {
    await p.waitForFunction(fn, arg, { timeout: ms, polling: 250 });
    return true;
  } catch {
    for (const q of [el, ella]) {
      const e = await q.evaluate(() => ({ pareja: window.__puertas.pareja(), estado: { ...window.__puertas.estado(), progreso: undefined } })).catch((x) => String(x));
      console.log(`  (${q.rol}: ${JSON.stringify(e).slice(0, 600)})`);
    }
    return false;
  }
}

// Él y Ella con pantallas de distinto tamaño (el reguero tiene que quedar igual en las dos)
const el = await celular('el', { width: 844, height: 390 }, !process.env.FOTOS_EL);
const ella = await celular('ella', { width: 740, height: 360 });

// --- Invitación ----------------------------------------------------------------
await el.waitForFunction(() => document.querySelector('#btn-pareja.en-linea'), null, { timeout: 60000 }).catch(() => {});
revisar(await el.evaluate(() => !!document.querySelector('#btn-pareja.en-linea')), 'Él ve que Ella está en Cien Puertas');
await el.evaluate(() => window.__puertas.parejaInvitar(1));
await ella.waitForSelector('#hoja-pareja:not([hidden]) .boton-tomate', { timeout: 60000 });
await ella.screenshot({ path: `${carpeta}/1-invitacion.png` });
await ella.click('#hoja-pareja:not([hidden]) .boton-tomate');
revisar((await Promise.all([el, ella].map((p) => esperarEn(p, () => window.__puertas.pareja()?.jugando === 1 && window.__puertas.estado().listo)))).every(Boolean), 'Los dos entran a la puerta 1');
revisar((await estado(el)).papel === 'anfitrion' && (await estado(ella)).papel === 'invitado', 'Él es el anfitrión y Ella la invitada');

/** Pantalla (en el celular de `p`) de un objeto por nombre. */
const donde = (p, nombre) => p.evaluate((n) => window.__puertas.buscar(n), nombre);
async function arrastrar(p, desde, hasta, pasos = 14) {
  await p.mouse.move(desde.x, desde.y);
  await p.mouse.down();
  for (let i = 1; i <= pasos; i++) {
    await p.mouse.move(desde.x + ((hasta.x - desde.x) * i) / pasos, desde.y + ((hasta.y - desde.y) * i) / pasos);
    await esperar(30);
  }
  await p.mouse.up();
}
async function tocar(p, nombre) {
  const d = await donde(p, nombre);
  await p.mouse.click(d.x, d.y);
}
/** Espera a que los dos tengan lo mismo (el espejo se pone al día) y compara. */
async function iguales(texto) {
  let a, b;
  for (let i = 0; i < 30; i++) {
    await esperar(400);
    a = (await estado(el))?.huella;
    b = (await estado(ella))?.huella;
    if (a && b && a.puerta === b.puerta && a.o === b.o && a.m === b.m && a.inv === b.inv) break;
  }
  const ok = a && b && a.puerta === b.puerta && a.o === b.o && a.m === b.m && a.inv === b.inv;
  if (!ok && a && b) {
    const oa = a.o.split(';'), ob = b.o.split(';');
    const dif = oa.map((x, i) => (x !== ob[i] ? `${i}: ${x} ≠ ${ob[i]}` : '')).filter(Boolean);
    const ma = a.m.split(';'), mb = b.m.split(';');
    const difm = ma.map((x, i) => (x !== mb[i] ? `${i}: ${x} ≠ ${mb[i]}` : '')).filter(Boolean);
    console.log(`  (puerta ${a.puerta}/${b.puerta}, ${a.objetos}/${b.objetos} objetos, ${dif.length} distintos: ${dif.slice(0, 6).join(' | ')}; materiales ${difm.slice(0, 6).join(' | ') || 'iguales'}; inventario ${a.inv}/${b.inv})`);
  }
  revisar(!!ok, texto);
}

// --- Puerta 1: la resuelve Ella con sus dedos -----------------------------------------
{
  const t = await donde(ella, 'tapete');
  await arrastrar(ella, t, { x: t.x + 230, y: t.y + 30 });
  await esperar(1200);
  // Lo que Ella arrastró se movió en el celular de Él
  await el.screenshot({ path: `${carpeta}/2-el-ve-el-tapete.png` });
  await ella.screenshot({ path: `${carpeta}/2-ella-movio-el-tapete.png` });
  const posEl = await el.evaluate(() => window.__puertas.posicion('tapete'));
  const posElla = await ella.evaluate(() => window.__puertas.posicion('tapete'));
  revisar(Math.hypot(posEl[0] - posElla[0], posEl[2] - posElla[2]) < 0.05 && Math.abs(posEl[0] - 0.05) > 0.3, `El tapete que movió Ella se movió también donde Él (${posEl.map((v) => v.toFixed(2))} / ${posElla.map((v) => v.toFixed(2))})`);
  await tocar(ella, 'abrigo');
  await ella.waitForFunction(() => window.__puertas.visible('llave'), null, { timeout: 15000 }).catch(() => {});
  revisar(await ella.evaluate(() => window.__puertas.visible('llave')), 'La llave que soltó el abrigo se ve donde Ella');
  // (en las pruebas sin pantalla los cuadros van lentos: se espera a que la llave termine de caer donde Ella)
  await ella.waitForFunction(() => window.__puertas.posicion('llave')[1] < 0.05, null, { timeout: 60000, polling: 300 }).catch(() => {});
  await tocar(ella, 'llave');
  await ella.waitForFunction(() => window.__puertas.pareja()?.items.includes('llave'), null, { timeout: 15000 }).catch(() => {});
  revisar(await el.evaluate(() => window.__puertas.pareja()?.items.includes('llave')), 'La llave que recogió Ella está en el inventario de Él (compartido)');
  revisar(await ella.evaluate(() => window.__puertas.pareja()?.items.includes('llave')), '…y en el de Ella');
  await iguales('Puerta 1 a medio camino: los dos ven lo mismo');
  // Usa la llave en la puerta (desde el inventario de Ella)
  await ella.click('#inventario [data-item="llave"]');
  await esperar(150);
  await tocar(ella, 'puerta toque');
  await Promise.all([el, ella].map((p) => esperarEn(p, () => window.__puertas.pareja()?.jugando === 2 && window.__puertas.estado().listo, null, 90000)));
  revisar((await estado(el)).jugando === 2 && (await estado(ella)).jugando === 2, 'Ella abrió la puerta 1 y los dos pasaron a la 2');
}

// --- Señas y la manito del otro ---------------------------------------------------------
{
  const c = await donde(el, 'aldaba toque');
  await el.mouse.click(c.x, c.y);
  // La manito de Él aparece en el celular de Ella donde él tocó
  await ella.waitForFunction(() => !document.getElementById('dedo-otro').hidden, null, { timeout: 8000 }).catch(() => {});
  revisar(await ella.evaluate(() => !document.getElementById('dedo-otro').hidden), 'Ella ve la manito de Él donde tocó');
  await el.click('#btn-sena');
  await el.click('#senas [data-k="mira"]');
  await ella.waitForSelector('#sena-globo:not([hidden])', { timeout: 10000 }).catch(() => {});
  const texto = await ella.evaluate(() => document.getElementById('sena-globo').textContent);
  revisar(/Mira aquí/.test(texto ?? ''), `A Ella le llega la seña de Él: «${texto}»`);
  revisar(/(esposa|pulga aventurera|protagonista|mi amor)/.test(texto ?? ''), 'La seña usa cómo le dice Él a Ella');
  await ella.screenshot({ path: `${carpeta}/3-sena.png` });
}

// --- Puerta 2: la resuelve Él con la prueba automática (tres golpecitos y uno largo) -----------
{
  const r = await el.evaluate(() => window.__puertas.probar().then(() => 'ok', (e) => String(e)));
  revisar(r === 'ok', `Él resolvió la puerta 2 con su prueba (${r})`);
  await Promise.all([el, ella].map((p) => esperarEn(p, () => window.__puertas.pareja()?.jugando === 3, null, 90000)));
  revisar((await estado(ella)).jugando === 3, 'A Ella se le abrió la puerta 2 también y pasó a la 3');
  await Promise.all([el, ella].map((p) => esperarEn(p, () => window.__puertas.estado().listo, null, 60000)));
}

// --- Pausa: Ella se va a segundo plano y luego se corta la conexión -----------------------------
{
  await ella.evaluate(() => window.__puertas.segundoPlano(true));
  await el.waitForFunction(() => window.__puertas.pareja()?.pausada, null, { timeout: 10000 }).catch(() => {});
  revisar(await el.evaluate(() => window.__puertas.pareja()?.pausada && !document.getElementById('pareja-pausa').hidden), 'Ella se fue a segundo plano: Él ve la pausa con aviso');
  await el.screenshot({ path: `${carpeta}/4-pausa.png` });
  await ella.evaluate(() => window.__puertas.segundoPlano(false));
  await el.waitForFunction(() => !window.__puertas.pareja()?.pausada, null, { timeout: 10000 }).catch(() => {});
  revisar(await el.evaluate(() => !window.__puertas.pareja()?.pausada), 'Ella volvió: se quita la pausa');
  cortado.add('ella');
  await el.waitForFunction(() => window.__puertas.pareja()?.conectado === false, null, { timeout: 15000 }).catch(() => {});
  revisar(await el.evaluate(() => window.__puertas.pareja()?.conectado === false && window.__puertas.pareja()?.pausada), 'Se cortó la conexión de Ella: Él queda en pausa');
  cortado.delete('ella');
  await el.waitForFunction(() => window.__puertas.pareja()?.conectado && !window.__puertas.pareja()?.pausada, null, { timeout: 15000 }).catch(() => {});
  revisar(await el.evaluate(() => window.__puertas.pareja()?.conectado && !window.__puertas.pareja()?.pausada), 'Volvió la conexión: siguen jugando');
}

// --- Puerta 3: la resuelve Él; luego la 4 con los cojines (Ella levanta uno) -----------------------
{
  const r = await el.evaluate(() => window.__puertas.probar().then(() => 'ok', (e) => String(e)));
  revisar(r === 'ok', `Él resolvió la puerta 3 (${r})`);
  await Promise.all([el, ella].map((p) => esperarEn(p, () => window.__puertas.pareja()?.jugando === 4 && window.__puertas.estado().listo, null, 90000)));
  revisar((await estado(ella)).jugando === 4, 'Los dos pasaron a la puerta 4');
  await iguales('Puerta 4 al empezar: los dos ven lo mismo (mismo desorden en pantallas distintas)');
}

// --- Puerta 8 (candado): Ella abre la cajita fuerte; el candado le sale a ella ---------------------
{
  await el.evaluate(() => void window.__puertas.jugar(8));
  await Promise.all([el, ella].map((p) => esperarEn(p, () => window.__puertas.pareja()?.jugando === 8 && window.__puertas.estado().listo, null, 90000)));
  revisar((await estado(ella)).jugando === 8, 'Él saltó a la puerta 8 y Ella lo siguió');
  await tocar(ella, 'interruptor');
  await el.waitForFunction(() => window.__puertas.luz() < 0.3, null, { timeout: 15000 }).catch(() => {});
  await esperar(800);
  revisar(await ella.evaluate(() => window.__puertas.luz() < 0.3), 'Ella apagó la luz y quedó oscuro en los dos celulares');
  await ella.screenshot({ path: `${carpeta}/5-oscuro-ella.png` });
  await tocar(ella, 'cajita fuerte');
  await ella.waitForFunction(() => window.__puertas.pareja()?.panel === 'ruedas', null, { timeout: 15000 }).catch(() => {});
  revisar(await ella.evaluate(() => window.__puertas.pareja()?.panel === 'ruedas'), 'El candado le salió a Ella (que lo tocó)');
  revisar(await el.evaluate(() => !window.__puertas.pareja()?.panel), '…y no le tapa la pantalla a Él');
  // Gira las ruedas: 4, 1, 7 (cada clic va al celular de Él, que dice si abrió)
  const clics = [4, 1, 7];
  for (let r = 0; r < 3; r++)
    for (let k = 0; k < clics[r]; k++) {
      await ella.evaluate((r) => document.querySelectorAll('#panel-carta .rueda')[r]?.querySelector('.flecha[data-d="1"]')?.click(), r);
      await esperar(260);
    }
  await ella.screenshot({ path: `${carpeta}/6-candado-ella.png` });
  await el.waitForFunction(() => window.__puertas.visible('llave'), null, { timeout: 60000 }).catch(() => {});
  revisar(await el.evaluate(() => window.__puertas.visible('llave')), 'Ella abrió la cajita con 4-1-7 y la llave apareció donde Él');
  // (que la puertica de la cajita termine de abrirse donde Ella)
  await ella.waitForFunction(() => window.__puertas.giro('puertita') < -1.8, null, { timeout: 60000, polling: 300 }).catch(() => {});
  await tocar(ella, 'llave');
  await ella.waitForFunction(() => window.__puertas.pareja()?.items.includes('llave'), null, { timeout: 15000 }).catch(() => {});
  await iguales('Puerta 8 con la llave en el bolsillo: los dos ven lo mismo');
  await el.click('#inventario [data-item="llave"]');
  await esperar(150);
  await tocar(el, 'puerta toque');
  await Promise.all([el, ella].map((p) => esperarEn(p, () => window.__puertas.pareja()?.jugando === 9, null, 90000)));
  revisar((await estado(ella)).jugando === 9, 'Él usó la llave que recogió Ella: los dos pasaron a la 9');
}

// --- Salir --------------------------------------------------------------------------------
{
  const enviados = await el.evaluate(() => window.__puertas.pareja()?.cuenta);
  console.log(`  (Él recibió ${enviados.fotos} fotos y ${enviados.movs} movimientos)`);
  await ella.click('#btn-mapa');
  await el.waitForFunction(() => !window.__puertas.pareja(), null, { timeout: 15000 }).catch(() => {});
  revisar(await el.evaluate(() => !window.__puertas.pareja() && !document.getElementById('mapa').hidden), 'Ella salió: a Él le avisan y vuelve al mapa');
}

await navegador.close();
console.log(errores.length ? `\n${errores.length} fallas:\n - ${errores.join('\n - ')}` : '\nTodo bien');
process.exit(errores.length ? 1 : 0);
