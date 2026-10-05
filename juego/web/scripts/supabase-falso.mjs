// Un Supabase de mentiras para las pruebas con varios «celulares» (contextos de Playwright): reenvía los canales de
// tiempo real (difusión + presencia) entre las páginas con demoras al azar y mensajes perdidos, y deja «cortar» a
// una página (no manda ni recibe nada) para probar los cortes. Nunca toca el Supabase de verdad.
//
//   import { SupabaseFalso } from './supabase-falso.mjs';
//   const red = new SupabaseFalso({ perder: 0.06, demora: 220 });
//   await red.conectar(pagina, 'nombre');      // antes de pagina.goto(...)
//   red.cortar(pagina, true);                   // se le cae el internet
//   red.mensajes                                // cuántos mensajes pasaron por la red

export class SupabaseFalso {
  constructor({ perder = 0.06, demora = 220 } = {}) {
    this.perder = perder;
    this.demora = demora;
    this.paginas = new Set();
    this.cortadas = new Set();
    this.presencia = new Map(); // canal → Map(pagina → clave)
    this.mensajes = 0;
    this.bytes = 0;
  }

  cortar(pagina, si) {
    if (si) this.cortadas.add(pagina);
    else this.cortadas.delete(pagina);
    for (const nombre of this.presencia.keys()) this.sincronizar(nombre);
  }

  entregar(desde, nombre, evento, payload) {
    if (this.cortadas.has(desde)) return;
    this.mensajes++;
    this.bytes += JSON.stringify(payload ?? null).length;
    for (const p of this.paginas) {
      if (p === desde || this.cortadas.has(p)) continue;
      if (Math.random() < this.perder) continue;
      setTimeout(() => void p.evaluate(([n, e, m]) => window.__llega?.(n, e, m), [nombre, evento, payload]).catch(() => {}), 15 + Math.random() * this.demora);
    }
  }

  sincronizar(nombre) {
    const estado = {};
    for (const [p, clave] of this.presencia.get(nombre) ?? []) if (!this.cortadas.has(p)) (estado[clave] ??= []).push({ id: clave });
    for (const p of this.paginas) void p.evaluate(([n, e]) => window.__presencia?.(n, e), [nombre, estado]).catch(() => {});
  }

  async servidor(pagina, a) {
    await new Promise((r) => setTimeout(r, 5 + Math.random() * 40));
    if (a.op === 'rpc') return { data: 'pareja-de-prueba', error: null };
    if (a.op === 'insert') return { data: null, error: null };
    if (a.op === 'track' || a.op === 'untrack') {
      if (!this.presencia.has(a.nombre)) this.presencia.set(a.nombre, new Map());
      if (a.op === 'track') this.presencia.get(a.nombre).set(pagina, a.clave);
      else this.presencia.get(a.nombre).delete(pagina);
      this.sincronizar(a.nombre);
      return {};
    }
    if (a.op === 'send') {
      this.entregar(pagina, a.nombre, a.evento, a.payload);
      return {};
    }
    return {};
  }

  /** Le pone el Supabase de mentiras a la página (antes de abrirla). */
  async conectar(pagina, rol = 'el') {
    this.paginas.add(pagina);
    pagina.on('close', () => this.paginas.delete(pagina));
    await pagina.exposeFunction('__srv', (a) => this.servidor(pagina, a));
    await pagina.addInitScript(CLIENTE, [rol]);
  }
}

/** Lo que corre dentro de cada página: un cliente con la misma forma que el de supabase-js. */
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
        this.nombre = nombre.replace(/^realtime:/, '');
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
        setTimeout(() => cb?.('SUBSCRIBED'), 40);
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
  try {
    localStorage.setItem('nuestro-hogar-supabase', JSON.stringify({ url: 'https://prueba.supabase.co', clave: 'clave-publica-de-prueba' }));
  } catch {
    /* sin almacenamiento */
  }
};
