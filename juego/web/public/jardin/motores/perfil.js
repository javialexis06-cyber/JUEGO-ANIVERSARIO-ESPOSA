/* Adaptador propio: aislamiento de guardados y ciclo de vida. Se carga antes de cada motor. */
(() => {
  'use strict';
  const perfil = new URLSearchParams(location.search).get('perfil') === 'amigos' ? 'amigos' : 'pareja';
  const motor = location.pathname.includes('/pvz1/') ? 'pvz1' : 'pvz2';
  const prefijo = `semilla-${motor}-${perfil}:`;
  const storage = window.localStorage;
  const claves = () => Object.keys(storage).filter(k => k.startsWith(prefijo));
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
  const abrir = indexedDB.open.bind(indexedDB), borrar = indexedDB.deleteDatabase.bind(indexedDB);
  indexedDB.open = (nombre, version) => version === undefined ? abrir(prefijo + nombre) : abrir(prefijo + nombre, version);
  indexedDB.deleteDatabase = nombre => borrar(prefijo + nombre);
  const contextos = new Set(), medios = new Set();
  for (const nombre of ['AudioContext', 'webkitAudioContext']) if (window[nombre]) {
    window[nombre] = new Proxy(window[nombre], { construct(T, args) { const a = Reflect.construct(T, args); contextos.add(a); return a; } });
  }
  window.Audio = new Proxy(window.Audio, { construct(T, args) { const a = Reflect.construct(T, args); medios.add(a); return a; } });
  let pausada = false, reproduciendo = [];
  const avisar = (estado, mensaje = '') => parent.postMessage({ canal: 'semilla-motor-v1', motor, estado, mensaje }, location.origin);
  window.semillaMotor = {
    perfil, motor, prefijo, avisar,
    async pausa(si) {
      if (si === pausada) return;
      pausada = si;
      if (motor === 'pvz1') window.Module?.[si ? 'pauseMainLoop' : 'resumeMainLoop']?.();
      else if (window.System) { const cc = await System.import('cc'); cc.game[si ? 'pause' : 'resume'](); }
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
        avisar('error', 'Para guardar la partida en curso, usa «Salir» dentro de PvZ 1. El juego guardará el nivel y te devolverá al jardín.');
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
