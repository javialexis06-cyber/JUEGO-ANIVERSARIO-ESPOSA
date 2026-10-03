// Prueba de la cocina de chef en pareja: dos «celulares» (dos contextos del navegador) con un Supabase de mentiras que
// reenvía los mensajes del canal «cocina-<pareja>» con demoras al azar y mensajes perdidos. Él es el anfitrión, Ella
// le ayuda: ven el mismo día, Ella toma un pedido y lo entrega, los dos ven la misma calificación, la pausa llega
// al otro, un corte de red pone la pausa de conexión y al volver sigue, salir de la app pausa a los dos y al final
// los dos terminan el mismo día con las mismas propinas.
// Uso (con el servidor de desarrollo prendido): node scripts/probar-cocina-linea.mjs [receta] [url] [carpeta]
// Variables: PERDER (fracción de mensajes que se pierden, 0.1 por defecto).
// Nunca toca el Supabase de verdad: el cliente de mentiras entra por globalThis.__crearSupabase.
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';

const receta = process.argv[2] ?? 'wafles';
const url = process.argv[3] ?? 'http://127.0.0.1:5173/scripts/cocina-prueba.html';
const carpeta = process.argv[4] ?? 'test-results/cocina-linea';
mkdirSync(carpeta, { recursive: true });
let PERDER = Number(process.env.PERDER ?? 0.1);
let cortado = false;

const paginas = new Set();
const errores = [];
const presencia = new Map();

// ---------------------------------------------------------------------------------- El servidor de mentiras
function entregar(desde, nombre, evento, payload) {
  for (const p of paginas) {
    if (p === desde || cortado) continue;
    if (Math.random() < PERDER) continue; // red de celular: a veces se pierde un paquete
    setTimeout(() => void p.evaluate(([n, e, m]) => window.__llega?.(n, e, m), [nombre, evento, payload]).catch(() => {}), 30 + Math.random() * 220);
  }
}
async function servidor(pagina, a) {
  await new Promise((ok) => setTimeout(ok, 15 + Math.random() * 90));
  if (a.op === 'rpc') return { data: 'pareja-de-prueba', error: null };
  if (a.op === 'insert') return { data: null, error: null };
  if (a.op === 'track') {
    if (!presencia.has(a.nombre)) presencia.set(a.nombre, new Map());
    presencia.get(a.nombre).set(pagina, a.clave);
    return {};
  }
  if (a.op === 'send') entregar(pagina, a.nombre, a.evento, a.payload);
  return {};
}

const CLIENTE = ([rol]) => {
  const canales = [];
  window.__llega = (nombre, evento, payload) => {
    for (const c of canales) if (c.nombre === nombre) for (const s of c.subs) if (s.tipo === 'broadcast' && s.filtro.event === evento) s.cb({ payload });
  };
  window.__crearSupabase = () => {
    const srv = (op, args) => window.__srv({ op, ...args });
    class Canal {
      constructor(nombre, opts) {
        this.nombre = nombre;
        this.clave = opts?.config?.presence?.key;
        this.subs = [];
        canales.push(this);
      }
      on(tipo, filtro, cb) {
        this.subs.push({ tipo, filtro, cb });
        return this;
      }
      subscribe(cb) {
        setTimeout(() => cb?.('SUBSCRIBED'), 60);
        return this;
      }
      presenceState() {
        return {};
      }
      track() {
        return srv('track', { nombre: this.nombre, clave: this.clave });
      }
      send(m) {
        return srv('send', { nombre: this.nombre, evento: m.event, payload: m.payload });
      }
      unsubscribe() {
        canales.splice(canales.indexOf(this), 1);
        return Promise.resolve('ok');
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
};

// ---------------------------------------------------------------------------------- Los dos celulares
const PRE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({
  executablePath: existsSync(PRE) ? PRE : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
async function celular(rol, modo) {
  const ctx = await navegador.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.rol = rol;
  p.on('pageerror', (e) => errores.push(`${rol}: ${e}`));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|403/.test(m.text()) && errores.push(`${rol}: ${m.text()}`));
  await p.exposeFunction('__srv', (a) => servidor(p, a));
  await p.addInitScript(CLIENTE, [rol]);
  paginas.add(p);
  await p.goto(`${url}?rol=${rol}&receta=${receta}&xp=900&dia=4&linea=${modo}&id=prueba-linea&transporte=supabase`, { timeout: 180000 });
  await p.waitForFunction(() => window.__cocinaMotor, null, { timeout: 120000 });
  return p;
}
const revisar = (ok, texto) => {
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${texto}`);
  if (!ok) errores.push(texto);
};
const resumen = (p) => p.evaluate(() => window.__cocinaMotor.resumen());
const esperar = (p, fn, arg, ms = 30000) => p.waitForFunction(fn, arg, { timeout: ms, polling: 200 }).then(() => true, () => false);
const foto = (p, n) => p.screenshot({ path: `${carpeta}/${receta}-${p.rol}-${n}.png` }).catch(() => {});

const el = await celular('el', 'anfitrion');
const ella = await celular('ella', 'invitado');

// 1) Se encuentran en la misma cocina
revisar(await esperar(el, () => window.__cocinaMotor.resumen().juntos), 'Él ve que Ella llegó a su cocina');
revisar(await esperar(ella, () => window.__cocinaMotor.resumen().juntos), 'Ella está en la cocina de Él');
await Promise.all([el, ella].map((p) => p.evaluate(() => window.__cocinaMotor.probar('intro'))));
await esperar(ella, () => window.__cocinaMotor.resumen().dia === 4);
await foto(ella, '1-dia');

// 2) Ella le da «¡A cocinar!» (se lo pide al anfitrión) y los dos arrancan
await ella.evaluate(() => window.__cocinaMotor.probar('jugar'));
revisar(await esperar(el, () => window.__cocinaMotor.resumen().fase === 'jugando'), 'El «¡A cocinar!» de Ella arranca el día en el celular de Él');
revisar(await esperar(ella, () => window.__cocinaMotor.resumen().fase === 'jugando'), 'Ella también ve el día andando');
await el.evaluate(() => window.__cocinaMotor.probar('llegar', 0));
await esperar(el, () => window.__cocinaMotor.resumen().invitados.some((e) => e === 'fila'), null, 20000);
await el.waitForTimeout(3500);

// 3) Ella toma un pedido: el tiquete lo cuelga el anfitrión y les sale a los dos
await ella.evaluate(() => window.__cocinaMotor.probar('tomar'));
revisar(await esperar(el, () => window.__cocinaMotor.resumen().tickets.length >= 1), 'El pedido que tomó Ella queda colgado donde Él');
revisar(await esperar(ella, () => window.__cocinaMotor.resumen().tickets.length >= 1), 'Ella ve el tiquete en su riel');
await el.waitForTimeout(1500);
await foto(ella, '2-tiquete');

// 4) Ella entrega el plato: Él lo califica y los dos ven la calificación y la propina
await ella.evaluate(() => {
  const m = window.__cocinaMotor;
  m.entregar(m.s.tickets[0]);
});
revisar(await esperar(el, () => window.__cocinaMotor.resumen().puntajes.length === 1), 'La entrega de Ella llega y Él la califica');
revisar(await esperar(ella, () => window.__cocinaMotor.resumen().puntajes.length === 1), 'Ella ve su calificación');
await ella.waitForTimeout(1200);
await foto(ella, '3-juicio');
await el.evaluate(() => window.__cocinaMotor.probar('juicio'));
revisar(await esperar(ella, () => window.__cocinaMotor.resumen().fase === 'jugando'), 'Se cierra la calificación en los dos');

// 5) Pausa: Ella pone pausa y a Él le sale; Él le da seguir
await ella.evaluate(() => window.__cocinaMotor.pausar('mano'));
revisar(await esperar(el, () => window.__cocinaMotor.resumen().fase === 'pausa'), 'La pausa de Ella le llega a Él');
await foto(el, '4-pausa');
await el.click('[data-c="seguir"]');
revisar(await esperar(ella, () => window.__cocinaMotor.resumen().fase === 'jugando'), 'El «seguir» de Él quita la pausa en los dos');

// 6) Ella se va a otra app: se pausa sola y a Él le sale que salió un momentico
await ella.evaluate(() => document.dispatchEvent(new Event('freeze')));
revisar(await esperar(el, () => window.__cocinaMotor.s.fase === 'pausa' && window.__cocinaMotor.s.pausa?.motivo === 'fondo'), 'Salir de la app pausa la cocina de los dos');
await foto(el, '5-fondo');
await ella.evaluate(() => document.dispatchEvent(new Event('resume')));
await ella.waitForTimeout(800);
await ella.click('[data-c="seguir"]').catch(() => {});
revisar(await esperar(el, () => window.__cocinaMotor.resumen().fase === 'jugando'), 'Al volver, Ella le da seguir y siguen cocinando');

// 7) Se corta la red: pausa de conexión; al volver, siguen solos
cortado = true;
revisar(await esperar(el, () => window.__cocinaMotor.s.pausa?.por === 'red', null, 15000), 'Con la red cortada, a Él le sale la pausa de conexión');
await foto(el, '6-corte');
cortado = false;
revisar(await esperar(el, () => window.__cocinaMotor.resumen().fase === 'jugando', null, 15000), 'Al volver la red, la cocina sigue sola');

// 8) Fin del día: los dos con el mismo día, las mismas propinas y los mismos puntajes
await el.evaluate(() => window.__cocinaMotor.probar('fin'));
revisar(await esperar(ella, () => window.__cocinaMotor.resumen().fase === 'fin', null, 20000), 'Ella ve el fin del día');
await ella.waitForTimeout(1500);
const [a, b] = await Promise.all([resumen(el), resumen(ella)]);
revisar(a.dia === b.dia && a.propinas === b.propinas && JSON.stringify(a.puntajes) === JSON.stringify(b.puntajes),
  `Mismo día, propinas y puntajes en los dos (Él ${a.dia}/${a.propinas}/${a.puntajes}, Ella ${b.dia}/${b.propinas}/${b.puntajes})`);
const guardEl = await el.evaluate(() => window.__guardados.length);
const guardElla = await ella.evaluate(() => window.__guardados.length);
revisar(guardEl >= 1 && guardElla >= 1, `Cada uno guarda su propio progreso (Él ${guardEl}, Ella ${guardElla})`);
await foto(el, '7-fin');
await foto(ella, '7-fin');
const st = await Promise.all([el, ella].map((p) => p.evaluate(() => window.__cocinaMotor.resumen().stats)));
console.log('Mensajes', JSON.stringify(st));

await navegador.close();
if (errores.length) {
  console.log(`\n${errores.length} problema(s):\n${errores.slice(0, 20).join('\n')}`);
  process.exit(1);
}
console.log('\nTodo bien: la cocina en pareja quedó sincronizada.');
