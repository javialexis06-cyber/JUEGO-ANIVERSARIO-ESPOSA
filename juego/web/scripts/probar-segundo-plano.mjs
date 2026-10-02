// Prueba del segundo plano (src/segundo_plano.ts): al esconder la página (otra app, pantalla bloqueada) se detienen
// los bucles de dibujo, la música y el reloj de la música; al volver todo sigue. En línea (súper y mesa) al otro le
// sale «se cortó la conexión» y retoman al volver.
// La página «se esconde» simulando visibilitychange con document.hidden = true (como hace Android al pausar el WebView).
// Uso: node scripts/probar-segundo-plano.mjs [casa,super,mesa] [base] [carpeta]
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';

const partes = (process.argv[2] ?? 'casa,super,mesa').split(',');
const base = (process.argv[3] ?? 'http://localhost:5173').replace(/\/$/, '');
const carpeta = process.argv[4] ?? 'test-results/segundo-plano';
mkdirSync(carpeta, { recursive: true });

const PRE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({
  executablePath: existsSync(PRE) ? PRE : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const errores = [];
const revisar = (ok, texto) => {
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${texto}`);
  if (!ok) errores.push(texto);
};

/** Cuenta los cuadros pedidos y guarda los AudioContext para poder mirarlos. */
const ESPIA = () => {
  window.__cuadros = 0;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf((t) => {
    window.__cuadros++;
    cb(t);
  });
  window.__audios = [];
  const AC = window.AudioContext;
  window.AudioContext = class extends AC {
    constructor(...a) {
      super(...a);
      window.__audios.push(this);
    }
  };
  // Intervalos vivos (el de la música es de 30 ms)
  window.__intervalos = new Map();
  const si = window.setInterval.bind(window), ci = window.clearInterval.bind(window);
  window.setInterval = (fn, ms, ...a) => {
    const id = si(fn, ms, ...a);
    window.__intervalos.set(id, ms);
    return id;
  };
  window.clearInterval = (id) => {
    window.__intervalos.delete(id);
    ci(id);
  };
  window.__esconder = (si) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => si });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (si ? 'hidden' : 'visible') });
    document.dispatchEvent(new Event('visibilitychange'));
  };
};

async function abrir(ctx, ruta, nombre) {
  const p = await ctx.newPage();
  p.setDefaultTimeout(180000);
  p.on('pageerror', (e) => errores.push(`${nombre}: ${e}`));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errores.push(`${nombre}: ${m.text()}`));
  await p.addInitScript(ESPIA);
  await p.goto(`${base}/${ruta}`, { waitUntil: 'domcontentloaded' });
  return p;
}
const cuadrosEn = async (p, ms) => {
  const a = await p.evaluate(() => window.__cuadros);
  await p.waitForTimeout(ms);
  return (await p.evaluate(() => window.__cuadros)) - a;
};
const audio = (p) => p.evaluate(() => window.__audios.map((a) => a.state));
const musicaViva = (p) => p.evaluate(() => [...window.__intervalos.values()].filter((ms) => ms === 30).length);

// ---------------------------------------------------------------------------
if (partes.includes('casa')) {
  console.log('— Casa');
  const ctx = await navegador.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  const p = await abrir(ctx, 'index.html?rol=el&local=1', 'casa');
  await p.waitForFunction(() => window.__listo === true, null, { timeout: 180000 });
  // El primer toque despierta el sonido (como exige el navegador)
  await p.mouse.click(420, 120);
  await p.waitForTimeout(1500);
  revisar((await cuadrosEn(p, 4000)) >= 1, 'la casa se dibuja (sin tarjeta gráfica va a ~1 cuadro por segundo)');
  revisar((await audio(p)).includes('running'), 'el sonido arrancó con el toque');
  revisar((await musicaViva(p)) === 1, 'el reloj de la música corre');
  await p.evaluate(() => window.__esconder(true));
  await p.waitForTimeout(600);
  const quietos = await cuadrosEn(p, 5000);
  revisar(quietos <= 1, `en segundo plano no se dibuja (${quietos} cuadros en 5 s)`);
  revisar(!(await audio(p)).includes('running'), `en segundo plano el sonido se suspende (${await audio(p)})`);
  revisar((await musicaViva(p)) === 0, 'en segundo plano el reloj de la música se detiene');
  await p.evaluate(() => window.__esconder(false));
  await p.waitForTimeout(1500);
  revisar((await cuadrosEn(p, 4000)) >= 1, 'al volver la casa se dibuja otra vez');
  revisar((await audio(p)).includes('running'), 'al volver suena otra vez');
  revisar((await musicaViva(p)) === 1, 'al volver la música sigue (un solo reloj)');
  await p.screenshot({ path: `${carpeta}/casa-vuelve.png` });
  await ctx.close();
}

// ---------------------------------------------------------------------------
if (partes.includes('super')) {
  console.log('— Súper en línea (dos pestañas)');
  const ctx = await navegador.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  const limpia = await ctx.newPage();
  await limpia.goto(`${base}/super.html`, { waitUntil: 'domcontentloaded' });
  await limpia.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('supermania-modo', 'linea');
  });
  await limpia.close();
  const el = await abrir(ctx, 'super.html?linea=local&rol=el&prueba', 'súper Él');
  const ella = await abrir(ctx, 'super.html?linea=local&rol=ella&prueba', 'súper Ella');
  const menu = (p) => p.waitForSelector('#menu:not([hidden]) #niveles .etiqueta', { timeout: 240000 });
  await Promise.all([menu(el), menu(ella)]);
  await el.bringToFront();
  await el.click('#niveles .etiqueta');
  await el.click('#btn-modo-linea');
  await el.waitForTimeout(1500);
  await el.click('#btn-abrir');
  await ella.bringToFront();
  await ella.waitForSelector('#sala:not([hidden]) #btn-sala-si:not([hidden])', { timeout: 60000 });
  await ella.click('#btn-sala-si');
  const jugando = (p) => p.waitForFunction(() => document.getElementById('hud') && !document.getElementById('hud').hidden && document.getElementById('sala').hidden, null, { timeout: 240000 });
  await Promise.all([jugando(el), jugando(ella)]).catch(() => errores.push('no arrancó el día en línea'));
  await el.waitForTimeout(2500);
  revisar(await el.evaluate(() => document.getElementById('pausa').hidden), 'jugando en línea los dos');
  // Ella se va a otra app
  await ella.evaluate(() => window.__esconder(true));
  await el.bringToFront();
  await el.waitForFunction(() => !document.getElementById('pausa').hidden && /salió de la app/.test(document.getElementById('pausa-nota').textContent), null, { timeout: 30000 })
    .catch(() => {});
  const nota = await el.evaluate(() => document.getElementById('pausa-nota').textContent);
  revisar(/Se cortó la conexión con Ella: salió de la app/.test(nota), `a Él le sale la pausa de conexión («${nota}»)`);
  revisar(await el.evaluate(() => document.getElementById('btn-continuar').disabled), 'Él no puede seguir sin Ella');
  await el.screenshot({ path: `${carpeta}/super-el-espera.png` });
  // Ella vuelve
  await ella.evaluate(() => window.__esconder(false));
  await el.waitForFunction(() => !/salió de la app/.test(document.getElementById('pausa-nota').textContent), null, { timeout: 30000 }).catch(() => {});
  const nota2 = await el.evaluate(() => document.getElementById('pausa-nota').textContent);
  revisar(/Ella pausó el juego/.test(nota2), `al volver Ella, Él ve que ella pausó («${nota2}»)`);
  await ella.bringToFront();
  await ella.waitForSelector('#pausa:not([hidden]) #btn-continuar:not([disabled])', { timeout: 30000 });
  await ella.click('#btn-continuar');
  await el.bringToFront();
  await el.waitForFunction(() => document.getElementById('pausa').hidden, null, { timeout: 30000 }).catch(() => {});
  revisar(await el.evaluate(() => document.getElementById('pausa').hidden), 'siguen jugando los dos');
  await el.screenshot({ path: `${carpeta}/super-siguen.png` });
  await ctx.close();
}

// ---------------------------------------------------------------------------
// Mesa: Supabase de mentiras que reenvía los mensajes del canal y la presencia (como probar-mesa-linea.mjs)
if (partes.includes('mesa')) {
  console.log('— Mesa en línea');
  const paginas = new Set();
  const presencia = new Map();
  const sincronizar = (nombre) => {
    const estado = {};
    for (const [, clave] of presencia.get(nombre) ?? []) (estado[clave] ??= []).push({ rol: clave });
    for (const p of paginas) void p.evaluate(([n, e]) => window.__presencia?.(n, e), [nombre, estado]).catch(() => {});
  };
  const servidor = async (pagina, a) => {
    await new Promise((ok) => setTimeout(ok, 20 + Math.random() * 80));
    if (a.op === 'rpc') return { data: 'pareja-de-prueba', error: null };
    if (a.op === 'track' || a.op === 'untrack') {
      if (!presencia.has(a.nombre)) presencia.set(a.nombre, new Map());
      if (a.op === 'track') presencia.get(a.nombre).set(pagina, a.clave);
      else presencia.get(a.nombre).delete(pagina);
      sincronizar(a.nombre);
      return {};
    }
    if (a.op === 'send') {
      for (const p of paginas) if (p !== pagina) void p.evaluate(([n, e, m]) => window.__llega?.(n, e, m), [a.nombre, a.evento, a.payload]).catch(() => {});
    }
    return { data: null, error: null };
  };
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
        untrack() {
          return srv('untrack', { nombre: this.nombre, clave: this.clave });
        }
        send(m) {
          return srv('send', { nombre: this.nombre, evento: m.event, payload: m.payload });
        }
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
    localStorage.setItem('mesa-preferencias', JSON.stringify({ modo: 'linea', nivel: 'normal' }));
  };
  const celular = async (rol) => {
    const ctx = await navegador.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errores.push(`mesa ${rol}: ${e}`));
    p.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errores.push(`mesa ${rol}: ${m.text()}`));
    await p.exposeFunction('__srv', (a) => servidor(p, a));
    await p.addInitScript(CLIENTE, [rol]);
    await p.addInitScript(ESPIA);
    paginas.add(p);
    await p.goto(`${base}/mesa.html?rapido=4&sin3d`, { waitUntil: 'domcontentloaded', timeout: 180000 });
    return p;
  };
  const el = await celular('el');
  const ella = await celular('ella');
  await el.waitForFunction(() => /está en la mesa/.test(document.getElementById('menu-nota')?.textContent ?? ''), null, { timeout: 120000 }).catch(() => {});
  await el.click('[data-juego="cajas"]');
  await ella.waitForSelector('#hoja:not([hidden]) .boton-tomate', { timeout: 60000 });
  await ella.click('#hoja:not([hidden]) .boton-tomate');
  await Promise.all([el, ella].map((p) => p.waitForSelector('#partida:not([hidden])', { timeout: 60000 })));
  await el.waitForTimeout(1500);
  revisar(await el.evaluate(() => document.getElementById('pausa-linea').hidden), 'en la partida no hay pausa');
  await ella.evaluate(() => window.__esconder(true));
  await el.waitForSelector('#pausa-linea:not([hidden])', { timeout: 15000 }).catch(() => {});
  const texto = await el.evaluate(() => (document.getElementById('pausa-linea').hidden ? '' : document.getElementById('pausa-linea-texto').textContent));
  revisar(/salió de la app/.test(texto), `a Él le sale la pausa («${texto}»)`);
  await el.screenshot({ path: `${carpeta}/mesa-el-espera.png` });
  await ella.evaluate(() => window.__esconder(false));
  await el.waitForSelector('#pausa-linea', { state: 'hidden', timeout: 15000 }).catch(() => {});
  revisar(await el.evaluate(() => document.getElementById('pausa-linea').hidden), 'al volver Ella se quita la pausa');
  // Se le cae el internet a Ella (sin avisar): la presencia se va y a los 2,5 s sale la pausa
  await ella.evaluate(() => window.__crearSupabase && null);
  for (const [, m] of presencia) for (const p of [...m.keys()]) if (p === ella) m.delete(p);
  for (const n of presencia.keys()) sincronizar(n);
  await el.waitForSelector('#pausa-linea:not([hidden])', { timeout: 15000 }).catch(() => {});
  const texto2 = await el.evaluate(() => (document.getElementById('pausa-linea').hidden ? '' : document.getElementById('pausa-linea-texto').textContent));
  revisar(/Se cortó la conexión/.test(texto2), `sin internet de Ella, a Él le sale «${texto2}»`);
  await el.screenshot({ path: `${carpeta}/mesa-el-sin-red.png` });
  for (const p of paginas) await p.context().close();
}

await navegador.close();
console.log(errores.length ? `\nERRORES:\n${errores.join('\n')}` : '\nTodo bien');
process.exit(errores.length ? 1 : 0);
