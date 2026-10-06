// Prueba de las cuentas con contraseña: la primera vez «Soy Javier» + la contraseña de base (TEAMO) deja crear la casa
// y la cuenta se crea sola; Laura igual con el código; un amigo sin la contraseña no entra como ellos; el «computador»
// de Javier entra con la contraseña y le llega su progreso; el celular sigue abierto sin pedir nada; dos aparatos que
// avanzaron por separado juntan su progreso; cambiar la contraseña y cerrar sesión.
// Usa el mismo Supabase de mentiras de probar-linea.mjs, con las reglas de supabase/cambios-pendientes.sql (sección 9).
// Uso: node scripts/probar-cuentas.mjs [url] [carpeta]
import { chromium } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:5173/index.html';
const carpeta = process.argv[3] ?? 'test-results/cuentas';
mkdirSync(carpeta, { recursive: true });
const RAPIDO = process.env.RAPIDO ?? 3;

// ---------------------------------------------------------------------------
// Servidor de mentiras
// ---------------------------------------------------------------------------
const db = { parejas: [], miembros: [], personajes: [], eventos: [], recuerdos: [], fotos: new Set(), cuentas: [], aparatos: [] };
let idEvento = 0, idRecuerdo = 0;
const canales = new Map(); // id → { pagina, uid, nombre, subs }
const presencia = new Map(); // nombre → Map(canalId → { clave, datos })
const sinRed = new Set(); // páginas sin internet
const errores = [];
const esMiembro = (uid, p) => db.miembros.some((m) => m.pareja_id === p && m.usuario === uid) || db.aparatos.some((m) => m.pareja_id === p && m.usuario === uid);
const esRol = (uid, p, r) => db.miembros.some((m) => m.pareja_id === p && m.rol === r && m.usuario === uid) || db.aparatos.some((m) => m.pareja_id === p && m.rol === r && m.usuario === uid);
const cuentaDe = (p, r) => db.cuentas.find((c) => c.pareja_id === p && c.rol === r);
const ponerAparato = (p, r, uid) => {
  db.aparatos = db.aparatos.filter((a) => !(a.pareja_id === p && a.usuario === uid));
  db.aparatos.push({ pareja_id: p, rol: r, usuario: uid });
};
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
    if (a.fn === 'unirse_pareja' || a.fn === 'volver_a_casa') {
      if (!['el', 'ella'].includes(x.mi_rol)) throw new Error('Rol inválido');
      const p = db.parejas.find((q) => q.codigo === String(x.cod).trim().toUpperCase());
      if (!p) return { data: null, error: null };
      if (esRol(uid, p.id, x.mi_rol)) return { data: p.id, error: null };
      if (cuentaDe(p.id, x.mi_rol)) throw new Error('Cuenta requerida: este personaje tiene usuario y contraseña');
      if (a.fn === 'volver_a_casa') x.reemplazar = true;
      const m = db.miembros.find((q) => q.pareja_id === p.id && q.rol === x.mi_rol);
      if (m && m.usuario !== uid && !x.reemplazar) throw new Error('Personaje ocupado');
      if (m) m.usuario = uid;
      else db.miembros.push({ pareja_id: p.id, rol: x.mi_rol, usuario: uid });
      return { data: p.id, error: null };
    }
    if (a.fn === 'crear_cuenta') {
      const u = String(x.nombre).trim().toLowerCase();
      if (!esRol(uid, x.p, x.mi_rol)) throw new Error('No autorizado');
      if (!/^[a-z0-9_.-]{3,24}$/.test(u)) throw new Error('El usuario debe tener de 3 a 24 letras o números, sin espacios ni tildes');
      if (String(x.contrasena ?? '').trim().length < 4) throw new Error('La contraseña debe tener al menos 4 caracteres');
      if (cuentaDe(x.p, x.mi_rol)) throw new Error('Este personaje ya tiene cuenta');
      if (db.cuentas.some((c) => c.usuario === u)) throw new Error('Ese usuario ya existe: escoge otro');
      db.cuentas.push({ pareja_id: x.p, rol: x.mi_rol, usuario: u, clave: String(x.contrasena).trim().toLowerCase() });
      ponerAparato(x.p, x.mi_rol, uid);
      return { data: null, error: null };
    }
    if (a.fn === 'entrar_cuenta') {
      const c = db.cuentas.find((q) => q.usuario === String(x.nombre).trim().toLowerCase());
      if (!c) throw new Error('Cuenta no existe');
      if (c.clave !== String(x.contrasena ?? '').trim().toLowerCase()) return { data: [], error: null };
      ponerAparato(c.pareja_id, c.rol, uid);
      return { data: [{ pareja: c.pareja_id, papel: c.rol, codigo_casa: db.parejas.find((p) => p.id === c.pareja_id).codigo }], error: null };
    }
    if (a.fn === 'cuentas_de') {
      if (!esMiembro(uid, x.p)) throw new Error('No autorizado');
      return { data: db.cuentas.filter((c) => c.pareja_id === x.p).map((c) => ({ papel: c.rol, usuario: c.usuario })), error: null };
    }
    if (a.fn === 'cambiar_contrasena') {
      if (!esRol(uid, x.p, x.mi_rol)) throw new Error('No autorizado');
      const c = cuentaDe(x.p, x.mi_rol);
      if (!c) throw new Error('Este personaje todavía no tiene cuenta');
      c.clave = String(x.nueva).trim().toLowerCase();
      return { data: null, error: null };
    }
    if (a.fn === 'salir_de_casa') {
      db.aparatos = db.aparatos.filter((q) => !(q.pareja_id === x.p && q.usuario === uid));
      db.miembros = db.miembros.filter((q) => !(q.pareja_id === x.p && q.usuario === uid && cuentaDe(x.p, q.rol)));
      return { data: null, error: null };
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
        async signOut() {
          cliente.uid = null;
          localStorage.removeItem('uid-de-mentiras');
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
async function celular(nombre, guardado = {}) {
  const ctx = await navegador.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.addInitScript((g) => {
    if (sessionStorage.getItem('sembrado')) return;
    sessionStorage.setItem('sembrado', '1');
    for (const [k, v] of Object.entries(g)) localStorage.setItem(k, v);
  }, guardado);
  p.nombre = nombre;
  p.on('pageerror', (e) => errores.push(`${nombre}: ${e}`));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|No se pudo guardar|Failed to fetch/.test(m.text()) && errores.push(`${nombre}: ${m.text()}`));
  await p.exposeFunction('__srv', (a) => servidor(p, a));
  await p.addInitScript(CLIENTE);
  await p.goto(`${url}?rapido=${RAPIDO}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await p.waitForSelector('#bienvenida:not([hidden])', { timeout: 300000 });
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


const SUPER_CEL = JSON.stringify({ dinero: 40, sitios: {}, estrellas: { 1: [true, true, true], 2: [true, false, false] }, mejoras: { carrito: 2 }, ayudas: {}, corazones: {}, lunas: {}, gastadas: 1 });
const el = await celular('Él', { 'supermania-jugable1': SUPER_CEL, 'cien-puertas': JSON.stringify({ hasta: 12, estrellas: { 3: 2 }, vioInicio: true }), 'nuestro-hogar-victorias': '4' });
const ella = await celular('Ella');
const deAqui = (p) => p.evaluate(() => ({ super: localStorage.getItem('supermania-jugable1'), puertas: localStorage.getItem('cien-puertas'), victorias: localStorage.getItem('nuestro-hogar-victorias') }));
const conClave = async (p, rol, clave) => {
  await p.click(`.rol-carta[data-rol="${rol}"]`);
  await p.waitForSelector('#form-cuenta:not([hidden])', { timeout: 20000 });
  await p.fill('#inp-contrasena', clave);
  await p.click('#form-cuenta button[type="submit"]');
};
const avisoClave = (p) => p.evaluate(() => document.querySelector('#cuenta-aviso')?.textContent ?? '');

// Él, la primera vez: sin la contraseña no aparece «Crear nuestra casa»
await el.click('.rol-carta[data-rol="el"]');
revisar(await el.evaluate(() => document.querySelector('#bienv-conexion').hidden && !document.querySelector('#form-cuenta').hidden), 'al tocar «Soy Javier» pide la contraseña (sin ella no hay crear ni unirse)');
await foto(el, '00-pide-contrasena');
await conClave(el, 'el', 'hola');
await esperar(el, () => /equivocada/i.test(document.querySelector('#cuenta-aviso')?.textContent ?? ''), null, 30000, 'contraseña equivocada la primera vez');
revisar(await el.evaluate(() => document.querySelector('#bienv-conexion').hidden), 'con otra contraseña tampoco');
await conClave(el, 'el', 'TEAMO');
await el.waitForSelector('#bienv-conexion:not([hidden])', { timeout: 30000 });
revisar(true, 'con TEAMO (la primera vez) deja crear la casa o unirse');
await el.click('#btn-crear');
await el.waitForSelector('#codigo:not([hidden])', { timeout: 60000 });
const codigo = (await el.textContent('#codigo-texto')).trim();
await el.click('#btn-codigo-listo');
await esperar(el, () => window.__listo === true, null, 60000, 'casa de Él lista');
await el.waitForTimeout(3000);
revisar(db.cuentas.some((c) => c.usuario === 'javier' && c.rol === 'el' && c.clave === 'teamo'), 'la cuenta de Javier se crea sola con la contraseña de base');

// Ella entra con el código (también con la contraseña)
await conClave(ella, 'ella', 'teamo');
await ella.waitForSelector('#bienv-conexion:not([hidden])', { timeout: 30000 });
await ella.fill('#inp-codigo', codigo);
await ella.click('#form-unirse button');
await esperar(ella, () => window.__listo === true, null, 60000, 'casa de Ella lista');
await ella.waitForTimeout(3000);
revisar(db.cuentas.some((c) => c.usuario === 'laura' && c.rol === 'ella'), 'la cuenta de Laura también se crea sola');
const nube = () => db.parejas[0].casa.progreso ?? {};
revisar(nube().el?.['supermania-jugable1']?.v === SUPER_CEL, 'el progreso del súper del celular de Javier sube a la nube');
revisar(nube().el?.['cien-puertas'] && nube().el?.['nuestro-hogar-victorias']?.v === '4', 'y también Cien Puertas y las victorias de la mesa');

// Un amigo con la app no puede entrar como Laura
const amigo = await celular('Amigo');
await conClave(amigo, 'ella', 'laura123');
await esperar(amigo, () => /equivocada/i.test(document.querySelector('#cuenta-aviso')?.textContent ?? ''), null, 30000, 'el amigo ve contraseña equivocada');
revisar(await amigo.evaluate(() => document.querySelector('#bienv-conexion').hidden && !window.__listo), 'un amigo sin la contraseña no entra como Laura (ni puede crear casa)');
await foto(amigo, '01-amigo-sin-clave');
// (sin tarjeta gráfica, cuatro casas en 3D a la vez ahogan la máquina de pruebas: lo que ya no se usa se cierra)
await amigo.context().close();
await ella.context().close();

// El computador de Javier: «Soy Javier» y la contraseña → su casa y su progreso
const pc = await celular('Computador');
await conClave(pc, 'el', 'TeAmO');
await esperar(pc, () => window.__listo === true, null, 90000, 'el computador entra a la casa');
revisar((await pc.evaluate(() => window.__casa().yo)) === 'el', 'el computador entra como Javier a la misma casa (sin código)');
await pc.waitForTimeout(2500);
const enPc = await deAqui(pc);
revisar(enPc.super === SUPER_CEL && JSON.parse(enPc.puertas ?? '{}').hasta === 12 && enPc.victorias === '4', 'y le llega el progreso del súper, Cien Puertas y la mesa');
await foto(pc, '02-pc-en-la-casa');

// Queda abierto para siempre: al volver a abrir no pide nada
await pc.reload({ waitUntil: 'domcontentloaded', timeout: 240000 });
await esperar(pc, () => window.__listo === true, null, 90000, 'el computador vuelve a abrir solo');
revisar(await pc.evaluate(() => document.querySelector('#bienvenida').hidden), 'al volver a abrir el computador entra solo (no pide contraseña)');
await el.reload({ waitUntil: 'domcontentloaded', timeout: 240000 });
await esperar(el, () => window.__listo === true, null, 90000, 'el celular vuelve a entrar');
revisar(true, 'el celular de Javier sigue abierto a la vez (varios aparatos por persona)');

// Los dos aparatos avanzan por separado y se juntan sin perder nada
await pc.evaluate(() => {
  const p = JSON.parse(localStorage.getItem('supermania-jugable1'));
  p.estrellas[5] = [true, true, false];
  p.lunas = { 1: true };
  localStorage.setItem('supermania-jugable1', JSON.stringify(p));
  localStorage.setItem('cien-puertas', JSON.stringify({ ...JSON.parse(localStorage.getItem('cien-puertas')), hasta: 20 }));
});
await el.evaluate(() => {
  const p = JSON.parse(localStorage.getItem('supermania-jugable1'));
  p.estrellas[2] = [true, true, true];
  p.mejoras.zapatos = 1;
  localStorage.setItem('supermania-jugable1', JSON.stringify(p));
  localStorage.setItem('nuestro-hogar-victorias', '6');
});
await pc.reload({ waitUntil: 'domcontentloaded', timeout: 240000 });
await esperar(pc, () => window.__listo === true, null, 90000, 'el computador abre otra vez');
await pc.waitForTimeout(2000);
await el.reload({ waitUntil: 'domcontentloaded', timeout: 240000 });
await esperar(el, () => window.__listo === true, null, 90000, 'el celular abre otra vez');
await el.waitForTimeout(2000);
const juntado = JSON.parse((await deAqui(el)).super);
revisar(
  juntado.estrellas[5]?.[1] === true && juntado.estrellas[2]?.[2] === true && juntado.lunas[1] === true && juntado.mejoras.zapatos === 1,
  'lo que avanzó cada aparato se junta: las estrellas del computador y las del celular',
);
revisar(JSON.parse((await deAqui(el)).puertas).hasta === 20 && (await deAqui(el)).victorias === '6', 'la puerta más lejana y las victorias también');
revisar(!nube().ella?.['supermania-jugable1'], 'el progreso de Laura va aparte');

// Mi cuenta: cambiar la contraseña desde el computador
await pc.click('#btn-menu');
await pc.click('[data-hoja="ajustes"]');
await esperar(pc, () => !!document.querySelector('#form-cambiar-contrasena'), null, 20000, 'sección Mi cuenta');
await foto(pc, '03-mi-cuenta');
await pc.fill('#cta-nueva', 'Girasol');
await pc.fill('#cta-nueva2', 'Girasol');
await pc.click('#form-cambiar-contrasena button[type="submit"]');
for (let i = 0; i < 20 && db.cuentas.find((c) => c.usuario === 'javier').clave !== 'girasol'; i++) await pc.waitForTimeout(500);
revisar(db.cuentas.find((c) => c.usuario === 'javier').clave === 'girasol', 'Javier cambia su contraseña en Ajustes');

// Cerrar sesión en el computador: ya no entra con la vieja, sí con la nueva
await pc.click('[data-cerrar-sesion]');
await pc.click('#btn-si-cerrar-sesion');
await pc.waitForSelector('#bienvenida:not([hidden])', { timeout: 240000 });
revisar(db.aparatos.filter((a) => a.rol === 'el').length === 1, 'al cerrar sesión el computador suelta su permiso');
await conClave(pc, 'el', 'teamo');
await esperar(pc, () => /equivocada/i.test(document.querySelector('#cuenta-aviso')?.textContent ?? ''), null, 30000, 'la contraseña vieja ya no sirve');
await conClave(pc, 'el', 'girasol');
await esperar(pc, () => window.__listo === true, null, 90000, 'entra con la nueva');
revisar(true, 'con la contraseña nueva vuelve a entrar');

console.log(errores.length ? `\nERRORES:\n${errores.join('\n')}` : '\nsin errores');
await navegador.close();
process.exit(errores.length ? 1 : 0);
