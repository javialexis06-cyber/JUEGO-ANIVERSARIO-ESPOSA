// Prueba de «El Show de Nosotros» en línea: dos «celulares» (dos navegadores) con un Supabase de mentiras que reenvía
// los mensajes del canal (con demoras al azar y un 8 % de mensajes perdidos) y guarda la casa compartida con versión
// (como guardar_casa). Él abre la cabina del show e invita, Ella acepta desde la invitación y los dos contestan con un
// bot que toca los botones del panel. A mitad del show Ella se va a segundo plano un momento (el show se pausa con aviso
// en los dos) y vuelve. Al final se revisa que los dos vean el mismo marcador y la misma conexión, y que el libro
// (la casa compartida) tenga las respuestas de los dos y un solo episodio.
// Uso: node scripts/probar-show-linea.mjs [url] [carpeta]     (PERDER=0.08 por defecto)
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:5174/mesa.html';
const carpeta = process.argv[3] ?? 'test-results/show-linea';
mkdirSync(carpeta, { recursive: true });
const PERDER = Number(process.env.PERDER ?? 0.08);

const paginas = new Set();
const errores = [];
const presencia = new Map(); // canal → Map(pagina → clave)
// La casa compartida (la tabla «parejas» de mentiras)
const casa = { casa: { monedas: 40, perro: { nombre: 'Lulú', pelaje: 'manchas', hembra: true, desde: 0, hambre: 80, energia: 80, higiene: 80, alegria: 80, t: 0, xp: 0, popos: [] } }, version: 1 };
let guardados = 0, choques = 0;

async function entregar(desde, nombre, evento, payload) {
  for (const p of paginas) {
    if (p === desde) continue;
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
  if (a.op === 'rpc') {
    if (a.fn === 'guardar_casa') {
      if (Number(a.args.version_leida) !== casa.version) {
        choques++;
        return { data: -1, error: null };
      }
      casa.casa = JSON.parse(JSON.stringify(a.args.nueva));
      casa.version++;
      guardados++;
      return { data: casa.version, error: null };
    }
    return { data: 'pareja-de-prueba', error: null };
  }
  if (a.op === 'leer') return { data: JSON.parse(JSON.stringify(casa)), error: null };
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
    const tabla = () => {
      const q = {
        select: () => q,
        eq: () => q,
        single: () => srv('leer', {}),
        insert: () => srv('insert', {}),
      };
      return q;
    };
    return {
      auth: { getSession: async () => ({ data: { session: { user: { id: rol } } } }), signInAnonymously: async () => ({ error: null }) },
      rpc: async (fn, args) => srv('rpc', { fn, args }),
      from: () => tabla(),
      channel: (n, o) => new Canal(n, o),
    };
  };
  localStorage.setItem('nuestro-hogar-supabase', JSON.stringify({ url: 'https://prueba.supabase.co', clave: 'clave-publica-de-prueba' }));
  localStorage.setItem('nuestro-hogar-sesion', JSON.stringify({ parejaId: 'pareja-de-prueba', codigo: 'ABC123', rol }));
  localStorage.setItem('nuestro-hogar-modo', JSON.stringify({ modo: 'linea', rol }));
  localStorage.setItem('mesa-preferencias', JSON.stringify({ modo: 'linea', nivel: 'normal' }));
};

// El bot: cada tanto mira el panel y toca algo (una opción, el número del termómetro, escribe la abierta o califica)
const BOT = () => {
  const panel = document.querySelector('.show-panel:not([hidden])');
  const libre = (b) => b && !b.disabled && b.offsetParent !== null;
  const cortina = document.querySelector('.show-cortina:not([hidden]) button');
  if (libre(cortina)) return cortina.click();
  if (!panel || panel.classList.contains('sale')) return;
  const ops = [...panel.querySelectorAll('.show-op')].filter(libre);
  const decidido = panel.querySelector('.show-opciones.decidido');
  if (ops.length && !decidido) return ops[Math.floor(Math.random() * ops.length)].click();
  const rango = panel.querySelector('input[type=range]');
  if (rango && libre(panel.querySelector('.show-termo-ok'))) {
    rango.value = String(1 + Math.floor(Math.random() * 10));
    rango.dispatchEvent(new Event('input'));
    return panel.querySelector('.show-termo-ok').click();
  }
  const texto = panel.querySelector('.show-abierta input');
  if (texto && !texto.value) {
    texto.value = ['wafles', 'frappé', 'dormir', 'Transformice', 'la playa'][Math.floor(Math.random() * 5)];
    panel.querySelector('.show-abierta').requestSubmit();
  }
};

const PRE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({
  executablePath: existsSync(PRE) ? PRE : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
async function celular(rol) {
  const ctx = await navegador.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.rol = rol;
  p.on('pageerror', (e) => errores.push(`${rol}: ${e}`));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|WebGL|GL_/.test(m.text()) && errores.push(`${rol}: ${m.text()}`));
  await p.exposeFunction('__srv', (a) => servidor(p, a));
  await p.addInitScript(CLIENTE, [rol]);
  paginas.add(p);
  await p.goto(`${url}?rapido=4&sin3d`, { waitUntil: 'domcontentloaded', timeout: 180000 });
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
await el.click('[data-juego="show"]');
await el.waitForSelector('.cabina .cabina-empezar', { timeout: 30000 });
await el.screenshot({ path: `${carpeta}/cabina.png` });
await el.click('.cabina-empezar');
await ella.waitForSelector('#hoja:not([hidden]) .boton-tomate', { timeout: 60000 });
await ella.screenshot({ path: `${carpeta}/invitacion.png` });
await ella.click('#hoja:not([hidden]) .boton-tomate');
await Promise.all([el, ella].map((p) => p.waitForSelector('#show', { timeout: 60000 })));
revisar(true, 'Los dos entran al estudio');

const t0 = Date.now();
let fin = false;
let pausaProbada = false;
let vioPausa = false;
let fotos = 0;
while (!fin && Date.now() - t0 < 25 * 60_000) {
  for (const p of [el, ella]) await p.evaluate(BOT).catch(() => {});
  // A mitad del show Ella se va a segundo plano un momento
  if (!pausaProbada) {
    const ronda = await ella.evaluate(() => window.__show?.show?.resultados?.filter(Boolean).length ?? 0).catch(() => 0);
    if (ronda >= 6) {
      pausaProbada = true;
      await ella.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      for (let k = 0; k < 12 && !vioPausa; k++) {
        await new Promise((ok) => setTimeout(ok, 300));
        vioPausa = await el.evaluate(() => /pausó/.test(document.querySelector('.show-pausa:not([hidden])')?.textContent ?? '')).catch(() => false);
      }
      await el.screenshot({ path: `${carpeta}/pausa-el.png` });
      await ella.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
    }
  }
  if (Date.now() - t0 > (fotos + 1) * 40_000 && fotos < 6) {
    fotos++;
    for (const p of [el, ella]) {
      await p.evaluate(() => window.__show?.show?.estudio?.pintar()).catch(() => {});
      await p.screenshot({ path: `${carpeta}/durante-${fotos}-${p.rol}.png` });
    }
  }
  fin = (await Promise.all([el, ella].map((p) => p.evaluate(() => !!document.querySelector('.show-final:not([hidden]) .show-final-carta')).catch(() => false)))).every(Boolean);
  await new Promise((ok) => setTimeout(ok, 250));
}
revisar(pausaProbada && vioPausa, 'Cuando Ella se va a segundo plano, a Él le sale el aviso de pausa');
revisar(fin, 'El show termina en los dos celulares');
const resumen = (p) =>
  p.evaluate(() => {
    const s = window.__show.show;
    return JSON.stringify({ puntos: s.puntos, res: s.resultados.map((r) => (r ? [r.pts.el, r.pts.ella, r.con] : null)) });
  });
const [a, b] = await Promise.all([el, ella].map(resumen));
revisar(a === b, 'Los dos ven el mismo marcador y los mismos resultados');
console.log('   marcador', JSON.parse(a).puntos);
for (const p of [el, ella]) {
  await p.evaluate(() => window.__show?.show?.estudio?.pintar()).catch(() => {});
  await p.screenshot({ path: `${carpeta}/final-${p.rol}.png` });
}
// Lo guardado en la casa compartida (el libro)
await new Promise((ok) => setTimeout(ok, 4000));
const show = casa.casa.show ?? {};
const n = (r, k) => Object.keys(show[k]?.[r] ?? {}).length;
revisar(n('el', 'r') > 10 && n('ella', 'r') > 10, `El libro tiene las respuestas de los dos (Él ${n('el', 'r')}, Ella ${n('ella', 'r')})`);
revisar((show.ep ?? []).length === 1, `Queda un solo episodio en el libro (${(show.ep ?? []).length})`);
console.log(`   la casa se guardó ${guardados} veces (${choques} choques resueltos)`);
// El libro se abre y muestra el episodio
await el.click('.show-final [data-f="libro"]');
await el.waitForSelector('.libro .libro-ficha', { timeout: 30000 }).catch(() => {});
revisar(await el.evaluate(() => document.querySelectorAll('.libro .libro-ficha').length >= 20), 'El libro muestra las fichas del episodio');
await el.screenshot({ path: `${carpeta}/libro.png` });
console.log(errores.length ? `ERRORES:\n${errores.join('\n')}` : 'Sin errores');
await navegador.close();
process.exit(errores.length ? 1 : 0);
