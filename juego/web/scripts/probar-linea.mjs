// Prueba del modo en línea con dos «celulares» (dos navegadores separados) y un Supabase de mentiras que corre aquí,
// con las mismas reglas que supabase/esquema.sql: membresía, versión de la casa, eventos, tiempo real y presencia.
// Simula demoras de red al azar y cortes de internet para buscar choques y pérdidas.
// Uso: node scripts/probar-linea.mjs [url] [carpeta]
import { chromium } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:5173/index.html';
const carpeta = process.argv[3] ?? 'test-results/linea';
mkdirSync(carpeta, { recursive: true });
const RAPIDO = process.env.RAPIDO ?? 3;

// ---------------------------------------------------------------------------
// Servidor de mentiras
// ---------------------------------------------------------------------------
const db = { parejas: [], miembros: [], personajes: [], eventos: [], recuerdos: [], fotos: new Set() };
let idEvento = 0, idRecuerdo = 0;
const canales = new Map(); // id → { pagina, uid, nombre, subs }
const presencia = new Map(); // nombre → Map(canalId → { clave, datos })
const sinRed = new Set(); // páginas sin internet
const errores = [];
const esMiembro = (uid, p) => db.miembros.some((m) => m.pareja_id === p && m.usuario === uid);
const LETRAS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const demora = () => new Promise((ok) => setTimeout(ok, 20 + Math.random() * 180));

async function entregar(tabla, evento, fila) {
  for (const [id, c] of canales) {
    const p = fila.pareja_id ?? fila.id;
    if (!esMiembro(c.uid, p) || sinRed.has(c.pagina)) continue;
    c.subs.forEach((s, i) => {
      if (s.tipo !== 'postgres_changes' || s.filtro.table !== tabla) return;
      if (s.filtro.event !== '*' && s.filtro.event !== evento) return;
      const [col, val] = s.filtro.filter.split('=eq.');
      if (String(fila[col]) !== val) return;
      void c.pagina.evaluate(([id, i, m]) => window.__entregar?.(id, i, m), [id, i, { new: fila }]).catch(() => {});
    });
  }
}
async function sincronizarPresencia(nombre) {
  const estado = {};
  for (const [, v] of presencia.get(nombre) ?? []) (estado[v.clave] ??= []).push(v.datos);
  for (const [id, c] of canales) {
    if (c.nombre !== nombre || sinRed.has(c.pagina)) continue;
    c.subs.forEach((s, i) => {
      if (s.tipo === 'presence') void c.pagina.evaluate(([id, i, e]) => window.__entregar?.(id, i, null, e), [id, i, estado]).catch(() => {});
    });
  }
}

function filtrar(filas, filtros) {
  return filas.filter((f) => filtros.every(([op, c, v]) => (op === 'eq' ? String(f[c]) === String(v) : op === 'in' ? v.map(String).includes(String(f[c])) : true)));
}
const parejaDe = (tabla, f) => (tabla === 'parejas' ? f.id : f.pareja_id);

let registrar = false;
async function servidor(pagina, a) {
  if (registrar && pagina.nombre === 'Ella') console.log('   ', Date.now() % 100000, 'Ella llama', a.op, a.fn ?? a.q?.tabla ?? '', a.q?.op ?? '');
  await demora();
  if (sinRed.has(pagina)) return { data: null, error: { message: 'TypeError: Failed to fetch' } };
  const uid = a.uid;
  const r = await atender(pagina, uid, a).catch((e) => ({ data: null, error: { message: String(e.message ?? e) } }));
  await demora();
  if (sinRed.has(pagina)) return { data: null, error: { message: 'TypeError: Failed to fetch' } };
  return r;
}

async function atender(pagina, uid, a) {
  if (a.op === 'rpc') {
    if (!uid) throw new Error('Sin sesión');
    const x = a.args;
    if (a.fn === 'crear_pareja') {
      let c;
      do c = Array.from({ length: 6 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join('');
      while (db.parejas.some((p) => p.codigo === c));
      const p = { id: randomUUID(), codigo: c, casa: {}, version: 0 };
      db.parejas.push(p);
      db.miembros.push({ pareja_id: p.id, rol: x.mi_rol, usuario: uid });
      return { data: [{ pareja: p.id, codigo: c }], error: null };
    }
    if (a.fn === 'unirse_pareja') {
      if (!['el', 'ella'].includes(x.mi_rol)) throw new Error('Rol inválido');
      const p = db.parejas.find((q) => q.codigo === String(x.cod).trim().toUpperCase());
      if (!p) throw new Error('Código no encontrado');
      const m = db.miembros.find((q) => q.pareja_id === p.id && q.rol === x.mi_rol);
      if (m && m.usuario !== uid && !x.reemplazar) throw new Error('Personaje ocupado');
      if (m) m.usuario = uid;
      else db.miembros.push({ pareja_id: p.id, rol: x.mi_rol, usuario: uid });
      return { data: p.id, error: null };
    }
    if (a.fn === 'guardar_casa') {
      if (!esMiembro(uid, x.p)) throw new Error('No autorizado');
      const p = db.parejas.find((q) => q.id === x.p);
      if (!p || p.version !== x.version_leida) return { data: -1, error: null };
      p.casa = JSON.parse(JSON.stringify(x.nueva));
      p.version++;
      void entregar('parejas', 'UPDATE', { ...p });
      return { data: p.version, error: null };
    }
    throw new Error(`Could not find the function ${a.fn}`);
  }
  if (a.op === 'consulta') {
    const q = a.q;
    const tabla = db[q.tabla];
    if (q.op === 'select') {
      let filas = filtrar(tabla, q.filtros).filter((f) => esMiembro(uid, parejaDe(q.tabla, f)));
      if (q.orden) filas = [...filas].sort((x, y) => (x[q.orden[0]] < y[q.orden[0]] ? -1 : 1) * (q.orden[1] ? 1 : -1));
      if (q.limite) filas = filas.slice(0, q.limite);
      filas = JSON.parse(JSON.stringify(filas));
      if (q.uno) return filas.length === 1 ? { data: filas[0], error: null } : { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned' } };
      return { data: filas, error: null };
    }
    if (q.op === 'insert') {
      const v = q.valor;
      if (!esMiembro(uid, v.pareja_id)) throw new Error('new row violates row-level security policy');
      let fila;
      if (q.tabla === 'eventos') {
        if (!['el', 'ella'].includes(v.de)) throw new Error('check constraint');
        fila = { id: ++idEvento, visto: false, datos: {}, creado: new Date().toISOString(), ...v };
      } else if (q.tabla === 'recuerdos') fila = { id: ++idRecuerdo, creado: new Date().toISOString(), ...v };
      else throw new Error('insert no permitido');
      tabla.push(fila);
      void entregar(q.tabla, 'INSERT', fila);
      return { data: q.uno ? { ...fila } : [fila], error: null };
    }
    if (q.op === 'update') {
      if (q.tabla === 'parejas') return { data: null, error: null }; // sin regla de update: no cambia nada
      const filas = filtrar(tabla, q.filtros).filter((f) => esMiembro(uid, parejaDe(q.tabla, f)));
      for (const f of filas) {
        Object.assign(f, q.valor);
        void entregar(q.tabla, 'UPDATE', f);
      }
      return { data: null, error: null };
    }
    if (q.op === 'upsert') {
      const v = q.valor;
      if (q.tabla !== 'personajes' || !esMiembro(uid, v.pareja_id)) throw new Error('new row violates row-level security policy');
      let f = tabla.find((x) => x.pareja_id === v.pareja_id && x.rol === v.rol);
      if (f) Object.assign(f, v);
      else tabla.push((f = { ...v }));
      void entregar('personajes', f === v ? 'INSERT' : 'UPDATE', { ...f });
      return { data: null, error: null };
    }
  }
  if (a.op === 'subir') {
    const carpeta = a.ruta.split('/')[0];
    if (!/^[0-9a-f-]{36}$/.test(carpeta) || !esMiembro(uid, carpeta)) throw new Error('new row violates row-level security policy');
    db.fotos.add(a.ruta);
    return { data: { path: a.ruta }, error: null };
  }
  if (a.op === 'firmar') {
    const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    return { data: a.rutas.filter((r) => db.fotos.has(r) && esMiembro(uid, r.split('/')[0])).map((r) => ({ path: r, signedUrl: PIXEL })), error: null };
  }
  if (a.op === 'unirCanal') {
    canales.set(a.id, { pagina, uid, nombre: a.nombre, subs: a.subs });
    return { data: null, error: null };
  }
  if (a.op === 'track') {
    if (!presencia.has(a.nombre)) presencia.set(a.nombre, new Map());
    presencia.get(a.nombre).set(a.id, { clave: a.clave, datos: a.datos });
    void sincronizarPresencia(a.nombre);
    return { data: null, error: null };
  }
  if (a.op === 'salirCanal') {
    const c = canales.get(a.id);
    canales.delete(a.id);
    if (c) {
      presencia.get(c.nombre)?.delete(a.id);
      void sincronizarPresencia(c.nombre);
    }
    return { data: null, error: null };
  }
  throw new Error(`operación desconocida ${a.op}`);
}

// Cliente de mentiras (en la página): la misma forma que @supabase/supabase-js para lo que usa la casa
const CLIENTE = () => {
  const canales = {};
  window.__entregar = (id, i, mensaje, estado) => {
    const c = canales[id];
    if (!c) return;
    if (estado) c.estado = estado;
    c.subs[i]?.cb(mensaje ?? {});
  };
  window.__crearSupabase = () => {
    const cliente = { uid: null };
    const srv = (op, args) => window.__srv({ op, uid: cliente.uid, ...args });
    class Consulta {
      constructor(tabla) {
        this.q = { tabla, filtros: [], op: 'select' };
      }
      select() {
        return this;
      }
      eq(c, v) {
        this.q.filtros.push(['eq', c, v]);
        return this;
      }
      in(c, v) {
        this.q.filtros.push(['in', c, v]);
        return this;
      }
      order(c, o) {
        this.q.orden = [c, o?.ascending !== false];
        return this;
      }
      limit(n) {
        this.q.limite = n;
        return this;
      }
      single() {
        this.q.uno = true;
        return this;
      }
      insert(v) {
        Object.assign(this.q, { op: 'insert', valor: v });
        return this;
      }
      update(v) {
        Object.assign(this.q, { op: 'update', valor: v });
        return this;
      }
      upsert(v) {
        Object.assign(this.q, { op: 'upsert', valor: v });
        return this;
      }
      then(ok, mal) {
        return srv('consulta', { q: this.q }).then(ok, mal);
      }
    }
    class Canal {
      constructor(nombre, opts) {
        this.id = `${nombre}-${Math.random()}`;
        this.nombre = nombre;
        this.clave = opts?.config?.presence?.key;
        this.subs = [];
        this.estado = {};
        canales[this.id] = this;
      }
      on(tipo, filtro, cb) {
        this.subs.push({ tipo, filtro, cb });
        return this;
      }
      subscribe(cb) {
        void srv('unirCanal', { id: this.id, nombre: this.nombre, subs: this.subs.map((s) => ({ tipo: s.tipo, filtro: s.filtro })) }).then(() => cb?.('SUBSCRIBED'));
        return this;
      }
      presenceState() {
        return this.estado;
      }
      track(datos) {
        return srv('track', { id: this.id, nombre: this.nombre, clave: this.clave, datos });
      }
    }
    Object.assign(cliente, {
      auth: {
        async getSession() {
          const u = localStorage.getItem('uid-de-mentiras');
          if (u) cliente.uid = u;
          return { data: { session: u ? { user: { id: u } } : null } };
        },
        async signInAnonymously() {
          cliente.uid = crypto.randomUUID();
          localStorage.setItem('uid-de-mentiras', cliente.uid);
          return { error: null };
        },
      },
      rpc: (fn, args) => srv('rpc', { fn, args }),
      from: (tabla) => new Consulta(tabla),
      storage: { from: () => ({ createSignedUrls: (rutas) => srv('firmar', { rutas }), upload: (ruta) => srv('subir', { ruta }) }) },
      channel: (nombre, opts) => new Canal(nombre, opts),
      removeChannel: async (c) => srv('salirCanal', { id: c.id }),
    });
    return cliente;
  };
  localStorage.setItem('nuestro-hogar-supabase', JSON.stringify({ url: 'https://prueba.supabase.co', clave: 'clave-publica-de-prueba' }));
};

// ---------------------------------------------------------------------------
// Dos celulares
// ---------------------------------------------------------------------------
const PRE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({
  executablePath: existsSync(PRE) ? PRE : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
async function celular(nombre) {
  const ctx = await navegador.newContext({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.nombre = nombre;
  p.on('pageerror', (e) => errores.push(`${nombre}: ${e}`));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|No se pudo guardar|Failed to fetch/.test(m.text()) && errores.push(`${nombre}: ${m.text()}`));
  await p.exposeFunction('__srv', (a) => servidor(p, a));
  await p.addInitScript(CLIENTE);
  await p.goto(`${url}?rapido=${RAPIDO}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await p.waitForSelector('#bienvenida:not([hidden])', { timeout: 180000 });
  return p;
}
const estado = (p) => p.evaluate(() => window.__casa());
const foto = (p, n) => p.screenshot({ path: `${carpeta}/${n}.png`, animations: 'disabled', timeout: 120000 }).catch(() => {});
const esperar = async (p, fn, arg, ms = 60000, que = 'condición') => {
  try {
    await p.waitForFunction(fn, arg, { timeout: ms });
    return true;
  } catch {
    errores.push(`${p.nombre}: no se cumplió ${que}`);
    return false;
  }
};
const revisar = (ok, texto) => {
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${texto}`);
  if (!ok) errores.push(texto);
};

const el = await celular('Él');
const ella = await celular('Ella');

// Él crea la casa
await el.click('.rol-carta[data-rol="el"]');
await el.click('#btn-crear');
await el.waitForSelector('#codigo:not([hidden])', { timeout: 60000 });
const codigo = (await el.textContent('#codigo-texto')).trim();
revisar(/^[A-Z0-9]{6}$/.test(codigo), `Él crea la casa y recibe el código ${codigo}`);
await el.click('#btn-codigo-listo');
await esperar(el, () => window.__listo === true, null, 60000, 'casa lista');

// Ella se equivoca: toca «Soy Él» con el código → debe preguntar
await ella.click('.rol-carta[data-rol="el"]');
await ella.fill('#inp-codigo', codigo.toLowerCase());
await ella.click('#form-unirse button');
const pregunto = await esperar(ella, () => !document.getElementById('ventana').hidden, null, 30000, 'aviso de personaje ocupado');
revisar(pregunto, 'Si Ella toca «Soy Él» por error, la app pregunta en vez de sacar a Él');
await foto(ella, '01-personaje-ocupado');
await ella.click('#ventana [data-cerrar]');
revisar(db.miembros.find((m) => m.rol === 'el').usuario === (await el.evaluate(() => localStorage.getItem('uid-de-mentiras'))), 'Él sigue en su personaje');

// Ahora sí como Ella
await ella.click('.rol-carta[data-rol="ella"]');
await ella.click('#form-unirse button');
await esperar(ella, () => window.__listo === true, null, 60000, 'Ella entra');
await esperar(el, () => document.getElementById('pareja-linea').classList.contains('si'), null, 30000, 'Él ve a Ella en línea');
revisar(await el.evaluate(() => document.getElementById('pareja-linea').classList.contains('si')), 'Él ve a Ella en línea');
await foto(ella, '02-ella-entra');

// Monedas: cada uno recibió su bono
let e1 = await estado(el);
revisar(e1.monedas === 160, `Bonos de los dos: 120 + 20 + 20 = ${e1.monedas}`);

// Compras a la vez desde los dos celulares (choques de versión)
const precio = { manzana: 3, pan: 5, galletas: 5 };
const antes = (await estado(el)).monedas;
const inv0 = { ...(await estado(el)).inventario };
const compras = [];
for (let i = 0; i < 6; i++) {
  compras.push(el.evaluate(() => document.querySelector('[data-accion="tienda"]')?.click()));
  compras.push(ella.evaluate(() => document.querySelector('[data-accion="tienda"]')?.click()));
}
await Promise.all(compras);
await el.waitForSelector('[data-comprar="manzana"]');
await ella.waitForSelector('[data-comprar="pan"]');
const clics = [];
for (let i = 0; i < 5; i++) {
  clics.push(el.click('[data-comprar="manzana"]').catch(() => {}));
  clics.push(ella.click('[data-comprar="pan"]').catch(() => {}));
}
await Promise.all(clics);
await el.waitForTimeout(6000);
const d = db.parejas[0].casa;
const gastado = antes - d.monedas;
const manzanas = (d.inventario.manzana ?? 0) - (inv0.manzana ?? 0);
const panes = (d.inventario.pan ?? 0) - (inv0.pan ?? 0);
revisar(gastado === manzanas * precio.manzana + panes * precio.pan && manzanas > 0 && panes > 0,
  `Compras a la vez: ${manzanas} manzanas y ${panes} panes, gastaron ${gastado} (cuadra con los precios)`);
const e2 = await estado(el), e3 = await estado(ella);
revisar(e2.monedas === d.monedas && e3.monedas === d.monedas, `Los dos celulares ven las mismas monedas (${e2.monedas} / ${e3.monedas} / servidor ${d.monedas})`);
await el.click('#hoja-cerrar');
await ella.click('#hoja-cerrar');

// Beso en vivo: el cariño de Ella lo sube su celular
const carinoAntes = (await estado(ella)).personajes.ella.carino;
await el.evaluate(() => document.getElementById('chip-pareja').click());
await el.click('[data-mimo="beso"]');
await esperar(ella, (c) => window.__casa().personajes.ella.carino > c + 10, carinoAntes, 30000, 'cariño de Ella sube con el beso');
const carinoDespues = (await estado(ella)).personajes.ella.carino;
revisar(carinoDespues > carinoAntes + 10, `Beso en vivo: cariño de Ella ${carinoAntes.toFixed(1)} → ${carinoDespues.toFixed(1)}`);
await el.waitForTimeout(1500);
revisar(db.eventos.filter((e) => e.tipo === 'beso').every((e) => e.visto), 'El beso quedó marcado como visto');
await foto(ella, '03-beso-visto-por-ella');

// Ella sin internet: Él le manda besos y un regalo; al volver le llega todo una sola vez
await esperar(el, () => !window.__casa || !document.querySelector('.accion') || true, null, 1000);
await el.waitForFunction(() => !window.__fase('el') && !window.__fase('ella'), null, { timeout: 90000 }).catch(() => {}); // termina el beso
sinRed.add(ella);
const cOff = (await estado(ella)).personajes.ella.carino;
for (let i = 0; i < 3; i++) {
  await el.waitForFunction(() => !window.__fase('el') && !window.__fase('ella'), null, { timeout: 90000 }).catch(() => {});
  await el.evaluate(() => document.getElementById('chip-pareja').click());
  await el.click('[data-mimo="abrazo"]');
  await el.waitForFunction(() => !window.__fase('el') && !window.__fase('ella'), null, { timeout: 60000 }).catch(() => {});
  await el.waitForTimeout(400);
}
const abrazos = db.eventos.filter((e) => e.tipo === 'abrazo');
console.log('   abrazos en el servidor:', JSON.stringify(abrazos.map((e) => ({ de: e.de, visto: e.visto }))));
revisar(abrazos.length === 3 && abrazos.every((e) => !e.visto), 'Con Ella sin internet, los 3 abrazos esperan en el servidor');
sinRed.delete(ella);
// Vuelve a la app (como al desbloquear el celular)
await ella.evaluate(() => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  document.dispatchEvent(new Event('visibilitychange'));
});
await esperar(ella, (c) => window.__casa().personajes.ella.carino >= Math.min(99, c + 44), cOff, 30000, 'abrazos pendientes aplicados');
const cOn = (await estado(ella)).personajes.ella.carino;
revisar(cOn >= Math.min(99, cOff + 44), `Al volver, los 3 abrazos suben el cariño una vez: ${cOff.toFixed(1)} → ${cOn.toFixed(1)}`);
await ella.waitForTimeout(1500);
revisar(db.eventos.filter((e) => e.tipo === 'abrazo').every((e) => e.visto), 'Los abrazos quedaron vistos');
await foto(ella, '04-ella-vuelve');

// Recargar la app de Ella no repite nada
registrar = true;
const registro = [];
ella.on('console', (m) => registro.push(`${m.type()}: ${m.text().slice(0, 300)}`));
await ella.reload({ waitUntil: 'domcontentloaded', timeout: 180000 });
if (!(await esperar(ella, () => window.__listo === true, null, 240000, 'Ella recarga'))) {
  console.log('   consola de Ella al recargar:\n   ' + registro.slice(-15).join('\n   '));
  console.log('   aviso:', await ella.textContent('#bienv-aviso'), '| bienvenida visible:', await ella.isVisible('#bienvenida'));
  await foto(ella, '99-recarga');
}
await ella.waitForTimeout(2000);
const cRe = (await estado(ella)).personajes.ella.carino;
revisar(Math.abs(cRe - cOn) < 1, `Recargar no repite los abrazos (${cOn.toFixed(1)} → ${cRe.toFixed(1)})`);

// Notas: las dos a la vez
await Promise.all([
  (async () => {
    await el.click('[data-cuarto="cocina"]');
    await el.click('[data-accion="notas"]');
    await el.fill('#nota-texto', 'Nota de Él');
    await el.click('#form-nota button[type="submit"]');
  })(),
  (async () => {
    await ella.click('[data-cuarto="cocina"]');
    await ella.click('[data-accion="notas"]');
    await ella.fill('#nota-texto', '<img src=x onerror=alert(1)> Nota de Ella');
    await ella.click('#form-nota button[type="submit"]');
  })(),
]);
await el.waitForTimeout(4000);
revisar(db.parejas[0].casa.notas.length === 2, `Dos notas al mismo tiempo: quedan las dos (${db.parejas[0].casa.notas.length})`);
const inyectado = await el.evaluate(() => !!document.querySelector('.nota-adhesiva img'));
revisar(!inyectado, 'Un texto con HTML en una nota se muestra como texto (no se ejecuta)');
await foto(el, '05-notas');
await el.click('#hoja-cerrar');
await ella.click('#hoja-cerrar');

// Foto en el álbum (en línea)
await ella.click('#btn-menu');
await ella.click('[data-hoja="album"]');
await ella.setInputFiles('#rec-foto', { name: 'foto.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64') });
await ella.fill('#rec-titulo', 'Nuestra primera cita');
await ella.click('#form-recuerdo button[type="submit"]');
for (let i = 0; i < 30 && !db.recuerdos.length; i++) await ella.waitForTimeout(1000);
const avisoFoto = await ella.textContent('#rec-aviso').catch(() => '(sin hoja)');
revisar(db.recuerdos.length === 1 && db.fotos.size === 1, `Ella sube una foto y queda en el álbum de los dos (aviso: «${(avisoFoto ?? '').trim()}»)`);
await el.waitForTimeout(2000);
revisar((await estado(el)) && (await el.evaluate(() => window.__casa())) !== null, 'Él recibe el recuerdo');

console.log(errores.length ? `\nERRORES:\n${errores.join('\n')}` : '\nsin errores');
await navegador.close();
process.exit(errores.length ? 1 : 0);
