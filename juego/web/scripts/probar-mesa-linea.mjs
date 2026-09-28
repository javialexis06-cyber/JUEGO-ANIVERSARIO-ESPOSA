// Prueba de la mesa en línea: dos «celulares» (dos navegadores) con un Supabase de mentiras que reenvía los
// mensajes del canal (broadcast + presencia), con demoras al azar y mensajes perdidos. Él invita, Ella acepta
// y juegan una partida completa haciendo clic en su tablero con el bot del juego; al final los dos estados
// deben ser idénticos.
// Uso: node scripts/probar-mesa-linea.mjs <juego> [url] [carpeta]
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';

const juego = process.argv[2] ?? 'cajas';
const url = process.argv[3] ?? 'http://localhost:5174/mesa.html';
const carpeta = process.argv[4] ?? 'test-results/mesa-linea';
mkdirSync(carpeta, { recursive: true });
const PERDER = Number(process.env.PERDER ?? 0.08);

const paginas = new Set();
const errores = [];
const presencia = new Map(); // canal → Map(pagina → clave)

async function entregar(desde, nombre, evento, payload) {
  for (const p of paginas) {
    if (p === desde) continue;
    // Red de celular: demoras y a veces se pierde un mensaje (el que espera lo vuelve a pedir)
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

const PRE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({
  executablePath: existsSync(PRE) ? PRE : undefined,
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
async function celular(rol) {
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.rol = rol;
  p.on('pageerror', (e) => errores.push(`${rol}: ${e}`));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errores.push(`${rol}: ${m.text()}`));
  await p.exposeFunction('__srv', (a) => servidor(p, a));
  await p.addInitScript(CLIENTE, [rol]);
  paginas.add(p);
  await p.goto(`${url}?rapido=4`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  return p;
}
const revisar = (ok, texto) => {
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${texto}`);
  if (!ok) errores.push(texto);
};

const el = await celular('el');
const ella = await celular('ella');
await el.waitForFunction(() => /está en la mesa/.test(document.getElementById('menu-nota')?.textContent ?? ''), null, { timeout: 120000 }).catch(() => {});
revisar(await el.evaluate(() => /está en la mesa/.test(document.getElementById('menu-nota').textContent)), 'Él ve que Ella está en la mesa');
await el.click(`[data-juego="${juego}"]`);
await ella.waitForSelector('#hoja:not([hidden]) .boton-tomate', { timeout: 60000 });
await ella.screenshot({ path: `${carpeta}/${juego}-invitacion.png` });
await ella.click('#hoja:not([hidden]) .boton-tomate');
await Promise.all([el, ella].map((p) => p.waitForSelector('#partida:not([hidden])', { timeout: 60000 })));
revisar(true, 'Los dos entran a la partida');

// Juegan con la IA de cada lado haciendo el movimiento por la partida (como si tocaran el tablero)
const t0 = Date.now();
let fin = false;
while (!fin && Date.now() - t0 < 15 * 60_000) {
  for (const p of [el, ella]) {
    await p
      .evaluate(() => {
        const m = window.__mesa;
        const pt = m.partida;
        if (!pt || !pt.esperando) return;
        const mov = pt.juego.ia(pt.e, 'normal', Math.random);
        const f = pt.esperando;
        pt.esperando = null;
        f(mov);
      })
      .catch(() => {});
  }
  fin = (await Promise.all([el, ella].map((p) => p.evaluate(() => !document.getElementById('final').hidden)))).every(Boolean);
  await new Promise((ok) => setTimeout(ok, 300));
}
revisar(fin, 'La partida termina en los dos celulares');
const [a, b] = await Promise.all([el, ella].map((p) => p.evaluate(() => JSON.stringify(window.__mesa.partida?.e))));
revisar(a === b, 'Los dos llegan exactamente al mismo estado');
await el.screenshot({ path: `${carpeta}/${juego}-final-el.png` });
await ella.screenshot({ path: `${carpeta}/${juego}-final-ella.png` });
console.log(errores.length ? `ERRORES:\n${errores.join('\n')}` : 'Sin errores');
await navegador.close();
process.exit(errores.length ? 1 : 0);
