/* Interfaz de recursos y persistencia propia; el combate sigue en PvZ-Portable. */
(() => {
  const $ = s => document.querySelector(s);
  document.documentElement.lang = 'es';
  $('h1 a').textContent = 'Plants vs. Zombies 1';
  const parrafos = [...document.querySelectorAll('#upload-screen > p')];
  parrafos[1].innerHTML = 'Los recursos del juego se descargan una sola vez (unos 25 MB) y quedan guardados en este dispositivo.';
  parrafos.slice(2).forEach(p => p.hidden = true);
  $('#drop-zone-title').textContent = 'Tu jardín clásico';
  $('#drop-zone-subtitle').textContent = 'Elige la carpeta del juego o un ZIP con sus recursos.';
  $('#browse-folder-btn').innerHTML = '<strong>Elegir carpeta</strong><span>main.pak + properties</span>';
  $('#browse-zip-btn').innerHTML = '<strong>Importar ZIP</strong><span>Recursos de PvZ GOTY</span>';
  $('#drop-zone-ready-title').textContent = '¡A jugar!';
  $('#drop-zone-ready-subtitle').textContent = 'Los recursos están preparados.';
  $('#drop-zone-reselect a').textContent = 'Cambiar recursos';
  for (const [id, texto] of Object.entries({ 'save-export-btn': 'Exportar partida', 'upload-save-import-btn': 'Importar partida ZIP', 'upload-save-import-dir-btn': 'Importar carpeta de partidas', 'upload-save-clear-btn': 'Borrar partidas', 'fullscreen-btn': 'Pantalla completa' })) {
    const b = document.getElementById(id); if (b) b.textContent = texto;
  }
  const recursos = new Promise((ok, mal) => {
    const r = indexedDB.open('recursos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('archivos');
    r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error);
  });
  async function memoria(modo, accion) {
    const db = await recursos;
    return new Promise((ok, mal) => { const tx = db.transaction('archivos', modo), r = accion(tx.objectStore('archivos')); tx.oncomplete = () => ok(r.result); tx.onabort = tx.onerror = () => mal(tx.error); });
  }
  const comenzar = startGame;
  semillaMotor.puedeCerrar = () => !gameStarted;
  semillaMotor.guardar = async () => {
    if (saveSyncIntervalId !== null) clearInterval(saveSyncIntervalId);
    saveSyncIntervalId = null;
    if (saveSyncInFlight) await saveSyncInFlight;
    await new Promise((ok, mal) => Module.FS.syncfs(false, e => e ? mal(e) : ok()));
    lastSaveSyncAt = Date.now();
  };
  // El cierre nativo ejecuta ShutdownHook/TryToSaveGame antes de este callback.
  window.onGameExit = () => {
    gameStarted = false;
    void semillaMotor.cerrar().catch(e => { semillaMotor.avisar('error', 'No se pudo guardar. Exporta la partida antes de cerrar.'); console.error(e); });
  };
  // El main.pak fijado es anterior a GOTY y solo trae las animaciones y partículas precompiladas (compiled/).
  // PvZ-Portable lee esas compilaciones como archivos sueltos (no desde el paquete) con el mismo formato de 32 bits,
  // así que se copian del paquete al sistema de archivos. Cinco nombres cambiaron en GOTY y se agregan como alias.
  const ALIAS = {
    'compiled/reanim/IceShroom.reanim.compiled': 'compiled/reanim/Iceshroom.reanim.compiled',
    'compiled/reanim/TwinSunflower.reanim.compiled': 'compiled/reanim/TwinSunFlower.reanim.compiled',
    'compiled/reanim/Zombie_disco.reanim.compiled': 'compiled/reanim/Zombie_jackson.reanim.compiled',
    'compiled/reanim/Zombie_backup.reanim.compiled': 'compiled/reanim/Zombie_dancer.reanim.compiled',
    'compiled/reanim/zombatar_zombie_head.reanim.compiled': 'compiled/reanim/Zombie.reanim.compiled',
  };
  async function compilados() {
    const pak = collectedFiles.get('main.pak');
    if (!pak || [...collectedFiles.keys()].some(k => k.startsWith('compiled/') && !(k in ALIAS))) return;
    const d = new Uint8Array(await pak.arrayBuffer()), x = i => d[i] ^ 0xF7;
    const u32 = i => (x(i) | x(i + 1) << 8 | x(i + 2) << 16 | x(i + 3) << 24) >>> 0;
    if (u32(0) !== 0xBAC04AC0) return;
    let p = 8, renombrar = -1; const entradas = [];
    while (p < d.length && !(x(p) & 0x80)) {
      p++; const n = x(p++); let nombre = '';
      for (let k = 0; k < n; k++) nombre += String.fromCharCode(x(p + k));
      nombre = nombre.replaceAll('\\', '/');
      if (nombre.toLowerCase() === 'properties/resources.xml') renombrar = p;
      p += n; entradas.push([nombre, u32(p)]); p += 12;
    }
    let o = p + 1; const leidos = new Map();
    for (const [nombre, t] of entradas) {
      if (nombre.startsWith('compiled/')) {
        const b = d.slice(o, o + t);
        for (let k = 0; k < t; k++) b[k] ^= 0xF7;
        leidos.set(nombre, b);
        collectedFiles.set(nombre, new File([b], nombre.split('/').pop()));
      }
      o += t;
    }
    for (const [alias, original] of Object.entries(ALIAS))
      if (leidos.has(original) && !collectedFiles.has(alias)) collectedFiles.set(alias, new File([leidos.get(original)], alias.split('/').pop()));
    // El motor prefiere el paquete al archivo suelto: la entrada antigua se renombra (mismo largo) para que lea
    // el manifiesto compatible de abajo.
    if (renombrar >= 0) {
      const nuevo = 'properties\\resources.vie';
      for (let k = 0; k < nuevo.length; k++) d[renombrar + k] = nuevo.charCodeAt(k) ^ 0xF7;
      collectedFiles.set('main.pak', new File([d], 'main.pak'));
    }
    await manifiesto();
  }
  // Manifiesto con los grupos que PvZ-Portable exige (grupos-goty.json, de sus fuentes fijadas). Los recursos del
  // resources.xml antiguo conservan su archivo; los que GOTY agregó (Zombatar, logros…) usan un sustituto existente.
  async function manifiesto() {
    const archivo = collectedFiles.get('properties/resources.xml');
    if (!archivo) return;
    const grupos = await (await fetch('grupos-goty.json')).json();
    const xml = new DOMParser().parseFromString(await archivo.text(), 'application/xml');
    if (xml.querySelector('parsererror')) throw Error('resources.xml ilegible');
    const antiguos = new Map(), deGrupo = new Map();
    for (const g of xml.querySelectorAll('Resources')) {
      let ruta = '', prefijo = '';
      for (const e of g.children) {
        if (e.tagName === 'SetDefaults') { ruta = e.getAttribute('path') ?? ''; prefijo = e.getAttribute('idprefix') ?? ''; continue; }
        const id = prefijo + e.getAttribute('id');
        antiguos.set(id, {ruta, e}); deGrupo.set(id, g.getAttribute('id'));
      }
    }
    const esc = v => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const elemento = (ruta, e, id) => `<SetDefaults path="${esc(ruta)}" idprefix="" /><${e.tagName} ${[...e.attributes].map(a => `${a.name}="${esc(a.name === 'id' ? id : a.value)}"`).join(' ')} />`;
    const SUSTITUTO = {I: ['images', 'Image', 'blank'], F: ['data', 'Font', 'BrianneTod16.txt'], S: ['sounds', 'Sound', 'buttonclick']};
    const usados = new Set(), salida = new Map();
    for (const [grupo, ids] of Object.entries(grupos))
      salida.set(grupo, ids.map(([tipo, id]) => {
        usados.add(id);
        const a = antiguos.get(id);
        if (a) return elemento(a.ruta, a.e, id);
        const [ruta, etiqueta, archivo] = SUSTITUTO[tipo];
        return `<SetDefaults path="${ruta}" idprefix="" /><${etiqueta} id="${id}" path="${archivo}" />`;
      }));
    for (const [id, a] of antiguos) if (!usados.has(id)) {
      const g = deGrupo.get(id);
      if (!salida.has(g)) salida.set(g, []);
      salida.get(g).push(elemento(a.ruta, a.e, id));
    }
    const texto = `<?xml version="1.0"?>\n<ResourceManifest>\n${[...salida].map(([g, l]) => `<Resources id="${g}">\n${l.join('\n')}\n</Resources>`).join('\n')}\n</ResourceManifest>\n`;
    collectedFiles.set('properties/resources.xml', new File([texto], 'resources.xml'));
  }
  startGame = async function () {
    // Se conservan los archivos tal como se descargaron; las compilaciones y el manifiesto se rehacen al empezar.
    try { await memoria('readwrite', s => s.put([...collectedFiles], 'paquete')); }
    catch (e) { console.warn('No se pudieron conservar los recursos; las partidas tienen su exportador independiente.', e); }
    try { await compilados(); }
    catch (e) { console.warn('No se pudieron preparar los recursos del paquete.', e); }
    return comenzar();
  };

  // Recursos remotos fijados por commit (motores.lock.json): main.pak y properties/ del repositorio
  // ruslan831/PlantsVsZombies-decompilation. No se suben al repositorio del juego.
  const FUENTE = 'https://raw.githubusercontent.com/ruslan831/PlantsVsZombies-decompilation/325b2229a7225d73870bb69322eefcda3a45bf8d/SexyAppFramework/DebugVS2005/';
  const ARCHIVOS = ['main.pak', 'properties/resources.xml', 'properties/LawnStrings.txt', 'properties/PATCH', 'properties/ZombatarTOS.txt', 'properties/partner.xml', 'properties/partner.xml.sig', 'properties/partner.xml.sig2', 'properties/partner_logo.jpg'];
  async function descargar() {
    const sub = $('#drop-zone-subtitle');
    for (const [i, ruta] of ARCHIVOS.entries()) {
      if (sub) sub.textContent = `Descargando recursos del juego (${i + 1} de ${ARCHIVOS.length})…`;
      const r = await fetch(FUENTE + ruta);
      if (!r.ok) throw Error(`No se pudo descargar ${ruta} (${r.status}).`);
      collectedFiles.set(ruta, new File([await r.blob()], ruta.split('/').pop()));
    }
    refreshUI();
    try { await memoria('readwrite', s => s.put([...collectedFiles], 'paquete')); }
    catch (e) { console.warn('No se pudieron conservar los recursos descargados.', e); }
    if (sub) sub.textContent = 'Los recursos están preparados.';
  }
  void memoria('readonly', s => s.get('paquete')).then(archivos => {
    if (Array.isArray(archivos) && !collectedFiles.size)
      for (const [ruta, archivo] of archivos) if (typeof ruta === 'string' && archivo instanceof Blob) collectedFiles.set(ruta, archivo);
    refreshUI();
  }).catch(e => console.warn('No se pudieron recuperar los recursos guardados.', e))
    .then(() => collectedFiles.has('main.pak') ? null : descargar())
    .catch(e => { console.error(e); semillaMotor.avisar('error', 'No se pudieron descargar los recursos de PvZ 1. Revisa la conexión y reintenta.'); });
  void window.moduleReadyPromise.then(() => semillaMotor.avisar('listo')).catch(e => semillaMotor.avisar('error', 'No se pudo cargar PvZ 1. Vuelve al jardín y reintenta.'));
})();
