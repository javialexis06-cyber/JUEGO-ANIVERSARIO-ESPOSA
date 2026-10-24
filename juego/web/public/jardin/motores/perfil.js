/* Adaptador propio: aislamiento de guardados y ciclo de vida. Se carga antes de cada motor. */
(() => {
  'use strict';
  const parametros = new URLSearchParams(location.search);
  const perfil = parametros.get('perfil') === 'amigos' ? 'amigos' : 'pareja';
  const motor = location.pathname.includes('/pvz1/') ? 'pvz1' : 'pvz2';
  const zona = parametros.get('frente'), sesion = parametros.get('sesion');
  const frente = motor === 'pvz2' && /^[a-z0-9_-]{1,64}$/.test(zona || '') && /^[a-z0-9-]{16,64}$/.test(sesion || '') ? {zona, sesion} : null;
  const prefijo = frente ? `semilla-frente-pvz2-${perfil}:${zona}:${sesion}:` : `semilla-${motor}-${perfil}:`;
  // Un frente todavía no dispone de instantáneas: su perfil nativo es temporal y nunca aparenta ser un guardado territorial.
  const memoria = new Map();
  const storage = frente ? {getItem: k => memoria.get(k) ?? null, setItem: (k, v) => memoria.set(k, String(v)), removeItem: k => memoria.delete(k)} : window.localStorage;
  const claves = () => (frente ? [...memoria.keys()] : Object.keys(storage)).filter(k => k.startsWith(prefijo));
  const almacen = {
    getItem: k => storage.getItem(prefijo + k), setItem: (k, v) => storage.setItem(prefijo + k, String(v)),
    removeItem: k => storage.removeItem(prefijo + k), clear: () => claves().forEach(k => storage.removeItem(k)),
    key: i => claves()[i]?.slice(prefijo.length) ?? null, get length() { return claves().length; },
  };
  Object.defineProperty(window, 'localStorage', { value: new Proxy(almacen, {
    get: (t, k) => typeof k === 'symbol' || k in t ? Reflect.get(t, k) : t.getItem(k),
    set: (t, k, v) => { t.setItem(k, v); return true; },
    deleteProperty: (t, k) => { t.removeItem(k); return true; },
    ownKeys: () => claves().map(k => k.slice(prefijo.length)),
    getOwnPropertyDescriptor: (t, k) => storage.getItem(prefijo + k) === null ? undefined : { enumerable: true, configurable: true, writable: true, value: t.getItem(k) },
  }) });
  const abrir = indexedDB.open.bind(indexedDB), borrar = indexedDB.deleteDatabase.bind(indexedDB), basesTemporales = new Set(), conexionesTemporales = new Set();
  indexedDB.open = (nombre, version) => {
    const pedido = version === undefined ? abrir(prefijo + nombre) : abrir(prefijo + nombre, version);
    if (frente) { basesTemporales.add(prefijo + nombre); pedido.addEventListener('success', () => conexionesTemporales.add(pedido.result)); }
    return pedido;
  };
  indexedDB.deleteDatabase = nombre => borrar(prefijo + nombre);
  const contextos = new Set(), medios = new Set();
  let silencio = !!frente && parametros.get('historia') === '1';
  for (const nombre of ['AudioContext', 'webkitAudioContext']) if (window[nombre]) {
    window[nombre] = new Proxy(window[nombre], { construct(T, args) { const a = Reflect.construct(T, args); contextos.add(a); return a; } });
  }
  window.Audio = new Proxy(window.Audio, { construct(T, args) { const a = Reflect.construct(T, args); a.muted = silencio; medios.add(a); return a; } });
  let pausada = false, reproduciendo = [];
  const avisar = (estado, mensaje = '') => parent.postMessage({ canal: 'semilla-motor-v1', motor, estado, mensaje }, location.origin);
  window.semillaMotor = {
    perfil, motor, prefijo, frente, avisar,
    sonido(si) { if(silencio === !si) return; silencio = !si; medios.forEach(a => {a.muted = silencio;}); },
    async pausa(si) {
      if (si === pausada) return;
      pausada = si;
      if (motor === 'pvz1') window.Module?.[si ? 'pauseMainLoop' : 'resumeMainLoop']?.();
      else if (window.System) { const cc = await System.import('cc'); cc.game[this.controlExterno || si ? 'pause' : 'resume'](); }
      if (si) {
        reproduciendo = [...medios].filter(a => !a.paused); reproduciendo.forEach(a => a.pause());
        await Promise.all([...contextos].filter(a => a.state === 'running').map(a => a.suspend()));
      } else {
        await Promise.all([...contextos].filter(a => a.state === 'suspended').map(a => a.resume()));
        reproduciendo.forEach(a => a.play().catch(() => {})); reproduciendo = [];
      }
    },
    async cerrar() {
      if (this.puedeCerrar && !this.puedeCerrar()) {
        avisar('error', this.mensajeCierre || 'Para guardar la partida en curso, usa «Salir» dentro de PvZ 1. El juego guardará el nivel y te devolverá al jardín.');
        return;
      }
      await this.pausa(true);
      if (motor === 'pvz1' && window.Module?.FS) {
        if (this.guardar) await this.guardar();
        else await new Promise((ok, mal) => Module.FS.syncfs(false, e => e ? mal(e) : ok()));
      }
      if (motor === 'pvz2') window.System?.get('chunks:///_virtual/PlayerProperties.ts')?.AllPlayerProperties?.savePP?.();
      medios.forEach(a => { a.pause(); a.removeAttribute('src'); a.load(); });
      await Promise.all([...contextos].filter(a => a.state !== 'closed').map(a => a.close()));
      conexionesTemporales.forEach(db => db.close()); basesTemporales.forEach(nombre => borrar(nombre));
      avisar('cerrado');
    },
  };
  addEventListener('message', async e => {
    if (e.source !== parent || e.origin !== location.origin || e.data?.canal !== 'semilla-motor-v1') return;
    try {
      if (e.data.orden === 'cerrar') await semillaMotor.cerrar();
      else if (e.data.orden === 'pausa') await semillaMotor.pausa(true);
      else if (e.data.orden === 'reanudar') await semillaMotor.pausa(false);
    } catch (error) { avisar('error', 'No se pudo completar la operación. Conserva la ventana abierta y exporta tu partida.'); console.error(error); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) void semillaMotor.pausa(true); });
})();
