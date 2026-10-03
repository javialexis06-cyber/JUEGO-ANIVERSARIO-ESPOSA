// Prueba de «Lavarse la cara» en pareja: dos «celulares» (dos contextos del navegador) con un Supabase de mentiras
// que reenvía el canal (broadcast + presencia) con demoras al azar y mensajes perdidos. Nunca toca la casa real.
// Él invita, Ella entra desde su espejo con su disfraz, juegan juntos (Él con el bot, Ella con el teclado),
// suben de nivel (cada uno escoge su carta), se corta la conexión de Ella (pausa y vuelve), Ella cae en burbujita
// y Él la levanta, y al final los dos ven la pantalla final con el mismo tiempo.
// Uso (con el servidor de desarrollo prendido): node scripts/probar-lavado-linea.mjs [url] [carpeta]
//   PERDER=0.08 (mensajes perdidos), DEMORA=250 (ms máximos de demora)
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';

const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const carpeta = process.argv[3] ?? 'test-results/lavado-linea';
mkdirSync(carpeta, { recursive: true });
const PERDER = Number(process.env.PERDER ?? 0.08);
const DEMORA = Number(process.env.DEMORA ?? 250);

const paginas = new Set();
const cortadas = new Set();
const errores = [];
const presencia = new Map(); // canal → Map(pagina → clave)
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function entregar(desde, nombre, evento, payload) {
  if (cortadas.has(desde)) return;
  for (const p of paginas) {
    if (p === desde || cortadas.has(p)) continue;
    // Red de celular: demoras y a veces se pierde un mensaje
    if (Math.random() < PERDER) continue;
    setTimeout(() => void p.evaluate(([n, e, m]) => window.__llega?.(n, e, m), [nombre, evento, payload]).catch(() => {}), 20 + Math.random() * DEMORA);
  }
}
async function sincronizar(nombre) {
  const estado = {};
  for (const [p, clave] of presencia.get(nombre) ?? []) if (!cortadas.has(p)) (estado[clave] ??= []).push({ rol: clave });
  for (const p of paginas) void p.evaluate(([n, e]) => window.__presencia?.(n, e), [nombre, estado]).catch(() => {});
}
async function servidor(pagina, a) {
  await espera(10 + Math.random() * 80);
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
    for (const c of canales) if (c.nombre === nombre && c.vivo) for (const s of c.subs) if (s.tipo === 'broadcast' && s.filtro.event === evento) s.cb({ payload });
  };
  window.__presencia = (nombre, estado) => {
    for (const c of canales) {
      if (c.nombre !== nombre || !c.vivo) continue;
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
        this.vivo = true;
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
      async unsubscribe() {
        this.vivo = false;
        return 'ok';
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
};

// Una página mínima con solo el lavado (la casa no hace falta: la invitación se pasa a mano, como haría la casa)
const PAGINA = (rol) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#c7c1ba"><script type="module">
import '/src/estilos.css';
const L = await import('/src/casa/lavado.ts');
const prog = L.progresoLavadoNuevo('${rol}');
window.__arrancar = (unirse) => L.jugarLavado({
  rol: '${rol}', nombres: { el: 'Él', ella: 'Ella' }, progreso: prog, unirse,
  guardar: async (p) => { window.__guardado = p; },
  pareja: { modo: 'linea', invitar: async (id) => { window.__invitacion = id; } },
}).then((r) => (window.__resultado = r));
window.__pagina = true;
</script></body></html>`;

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
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errores.push(`${rol}: ${m.text()}`));
  await p.exposeFunction('__srv', (a) => servidor(p, a));
  await p.addInitScript(CLIENTE, [rol]);
  await p.route(/_lavado_linea\.html/, (r) => r.fulfill({ contentType: 'text/html', body: PAGINA(rol) }));
  paginas.add(p);
  await p.goto(`${url}/_lavado_linea.html?sin3d`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await p.waitForFunction(() => window.__pagina, null, { timeout: 120000 });
  return p;
}
const revisar = (ok, texto) => {
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${texto}`);
  if (!ok) errores.push(texto);
};
const estado = (p) => p.evaluate(() => window.__lavado?.actual?.probar('nada'));
const probar = (p, que, v) => p.evaluate(([q, v]) => window.__lavado.actual.probar(q, v), [que, v]);
const foto = (p, n) => p.screenshot({ path: `${carpeta}/${p.rol}-${n}.png` });
const esperarQue = async (fn, ms, cada = 300) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (await fn().catch(() => false)) return true;
    await espera(cada);
  }
  return false;
};

const el = await celular('el');
const ella = await celular('ella');

// 1. Él invita desde su menú
await el.evaluate(() => void window.__arrancar());
await el.waitForSelector('.lv-menu:not([hidden]) [data-m="pareja"]', { timeout: 90000 });
await el.click('[data-m="pareja"]');
revisar(await esperarQue(() => el.evaluate(() => !!window.__invitacion), 20000), 'A Ella le llega la invitación (por la casa)');
const id = await el.evaluate(() => window.__invitacion);
await foto(el, '1-esperando');

// 2. Ella entra desde su espejo, escoge disfraz y dice que está lista
await ella.evaluate((id) => void window.__arrancar(id), id);
await ella.waitForSelector('.lv-menu:not([hidden]) [data-m="jugar"]', { timeout: 90000 });
await ella.click('[data-m="jugar"]');
const enJuego = (p) => p.evaluate(() => !!window.__lavado?.actual?.m && window.__lavado.actual.m.jug.length === 2);
const entraron = await esperarQue(async () => (await enJuego(el)) && (await enJuego(ella)), 90000);
if (!entraron) {
  await foto(el, 'x-no-entra');
  await foto(ella, 'x-no-entra');
  console.log('el', await el.evaluate(() => document.querySelector('.lv-capa:not([hidden]), .lv-espera')?.textContent?.slice(0, 120)));
  console.log('ella', await ella.evaluate(() => [...document.querySelectorAll('.lv-capa:not([hidden]), .lv-espera, .lv-menu:not([hidden])')].map((x) => x.className + ':' + x.textContent.slice(0, 80))));
}
revisar(entraron, 'Los dos entran a la misma cara');
await espera(3000);
await probar(el, 'aguante');
await probar(el, 'bot', 1);

// 3. Ella camina con el teclado: Él la ve moverse (y Ella ve a Él moverse con el bot)
const e0 = await estado(el);
const a0 = await estado(ella);
// (el teclado de Playwright no siempre llega a la página de atrás: se manda la tecla a la ventana)
const tecla = (p, tipo, k) => p.evaluate(([tipo, k]) => window.dispatchEvent(new KeyboardEvent(tipo, { key: k })), [tipo, k]);
await tecla(ella, 'keydown', 'd');
for (let k = 0; k < 4; k++) {
  await espera(1000);
  if (process.env.DEPURAR) console.log('  ella', JSON.stringify(await ella.evaluate(() => { const m = window.__lavado.actual.m; return { t: m.t.toFixed(2), x: m.jug[1].x.toFixed(1) }; })));
}
await tecla(ella, 'keyup', 'd');
await espera(1500);
const e1 = await estado(el);
const a1 = await estado(ella);
revisar(e1.jug[1].x - e0.jug[1].x > 25, `Él ve caminar a Ella (${e0.jug[1].x} → ${e1.jug[1].x})`);
revisar(Math.abs(a1.jug[0].x - a0.jug[0].x) + Math.abs(a1.jug[0].y - a0.jug[0].y) > 10, `Ella ve moverse a Él (${a0.jug[0].x},${a0.jug[0].y} → ${a1.jug[0].x},${a1.jug[0].y})`);
revisar(Math.abs(a1.t - e1.t) < 1.5, `El reloj va igual en los dos (${e1.t.toFixed(1)} / ${a1.t.toFixed(1)})`);
revisar(Math.abs(a1.jug[1].x - e1.jug[1].x) < 30, `Ella está en el mismo sitio en los dos (${e1.jug[1].x} / ${a1.jug[1].x})`);
await foto(el, '2-juntos');
await foto(ella, '2-juntos');

// 4. Experiencia compartida: suben de nivel juntos y cada uno escoge su carta
await probar(el, 'bot', 0);
await probar(el, 'xp', 30);
revisar(await esperarQue(() => ella.evaluate(() => !document.querySelector('.lv-c-nivel')?.hidden), 15000), 'A Ella le salen sus cartas al subir de nivel');
await foto(ella, '3-nivel');
const armasAntes = (await estado(el)).jug[1].armas;
const escogerTodo = async () => {
  for (let k = 0; k < 40; k++) {
    await ella.evaluate(() => document.querySelector('.lv-c-nivel:not([hidden]) .lv-carta')?.click());
    await el.evaluate(() => document.querySelector('.lv-c-nivel:not([hidden]) .lv-carta')?.click());
    await espera(700);
    const s = await estado(el);
    if (!s.jug[0].opciones && !s.jug[1].opciones && !s.pausa) {
      await espera(1500);
      const s2 = await estado(el);
      if (!s2.jug[0].opciones && !s2.jug[1].opciones && !s2.pausa) return true;
    }
  }
  return false;
};
await escogerTodo();
const tras = await estado(el);
revisar(!tras.jug[1].opciones && !tras.jug[0].opciones, 'Los dos escogieron y el juego sigue');
const sinCapas = (p) => p.evaluate(() => [...document.querySelectorAll('.lv-c-nivel, .lv-c-cofre, .lv-c-carta, .lv-c-espera')].every((c) => c.hidden));
revisar(await esperarQue(async () => (await sinCapas(el)) && (await sinCapas(ella)), 6000), 'A los dos se les cierran las cartas (no queda nada tapando el juego)');
revisar(tras.jug[1].armas >= armasAntes, `El inventario de Ella es suyo (${armasAntes} → ${tras.jug[1].armas} armas)`);
await probar(el, 'bot', 1);

// 5. Se le corta el internet a Ella: los dos quedan en pausa y siguen al volver
cortadas.add(ella);
await sincronizar('lavado-pareja-de-prueba');
const textoCorte = (p) => p.evaluate(() => /conexión/.test(document.querySelector('.lv-c-espera:not([hidden])')?.textContent ?? ''));
revisar(await esperarQue(() => textoCorte(el), 15000), 'Él ve que se cortó la conexión');
revisar(await esperarQue(() => textoCorte(ella), 15000), 'Ella ve que se cortó la conexión');
const tCorte1 = (await estado(el)).t;
await espera(2500);
const tCorte2 = (await estado(el)).t;
revisar(tCorte2 - tCorte1 < 0.3, `El tiempo no avanza sin el otro (${tCorte1.toFixed(1)} → ${tCorte2.toFixed(1)})`);
await foto(ella, '4-corte');
cortadas.delete(ella);
await sincronizar('lavado-pareja-de-prueba');
revisar(await esperarQue(async () => !(await textoCorte(el)) && !(await textoCorte(ella)), 15000), 'Vuelve la conexión y siguen');
await espera(1500);
const tVuelta = (await estado(el)).t;
revisar(tVuelta > tCorte2, `El juego sigue andando (${tVuelta.toFixed(1)})`);

// 6. Ella cae en burbujita y Él la levanta quedándose a su lado
await probar(el, 'caer', 1);
revisar(await esperarQue(async () => (await estado(ella)).jug[1].caido, 8000), 'Ella cae en burbujita (y lo ve en su celular)');
await foto(ella, '5-burbuja');
let levantada = false;
for (let k = 0; k < 40 && !levantada; k++) {
  await probar(el, 'juntar', 1);
  await espera(400);
  levantada = !(await estado(el)).jug[1].caido;
}
revisar(levantada, '¡Levántate, mi amor! Él la levantó');
revisar(await esperarQue(async () => !(await estado(ella)).jug[1].caido, 8000), 'Ella ya se ve de pie en su celular');
await foto(ella, '6-levanta');

// 7. Pausa de uno: se pausa en los dos
await el.click('.lv-pausa');
const pausada = (p) => p.evaluate(() => !document.querySelector('.lv-c-pausa')?.hidden);
revisar(await esperarQue(() => pausada(ella), 8000), 'La pausa de Él le llega a Ella');
await el.click('[data-p="seguir"]');
revisar(await esperarQue(async () => !(await pausada(ella)), 8000), 'Y al seguir, sigue en los dos');

// 8. Fin: los dos ven la pantalla final con el mismo tiempo
await probar(el, 'tiempo', 300);
await espera(1500);
await probar(el, 'fin');
const finVisible = (p) => p.evaluate(() => !document.querySelector('.lv-c-fin')?.hidden);
revisar(await esperarQue(() => finVisible(el), 15000), 'Él ve la pantalla final');
revisar(await esperarQue(() => finVisible(ella), 15000), 'Ella ve la pantalla final');
await espera(800);
const tiempoFin = (p) => p.evaluate(() => document.querySelector('.lv-c-fin .lv-fin-datos b, .lv-c-fin b')?.textContent ?? '');
const [fe, fa] = [await tiempoFin(el), await tiempoFin(ella)];
revisar(fe && fe === fa, `El mismo resumen en los dos (${fe} / ${fa})`);
await foto(el, '7-fin');
await foto(ella, '7-fin');

await navegador.close();
console.log(errores.length ? `\n${errores.length} problema(s):\n${errores.slice(0, 20).join('\n')}` : '\nTodo bien');
process.exit(errores.length ? 1 : 0);
