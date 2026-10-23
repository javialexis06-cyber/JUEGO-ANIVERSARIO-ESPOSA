/* Interfaz de recursos y persistencia propia; el combate sigue en PvZ-Portable. */
(() => {
  const $ = s => document.querySelector(s);
  document.documentElement.lang = 'es';
  $('h1 a').textContent = 'Plants vs. Zombies 1';
  const parrafos = [...document.querySelectorAll('#upload-screen > p')];
  parrafos[1].innerHTML = 'Importa los datos de tu copia de <strong>PvZ GOTY</strong>: <code>main.pak</code> y la carpeta <code>properties</code>. Se conservan en este dispositivo.';
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
  startGame = async function () {
    try { await memoria('readwrite', s => s.put([...collectedFiles], 'paquete')); }
    catch (e) { console.warn('No se pudieron conservar los recursos; las partidas tienen su exportador independiente.', e); }
    return comenzar();
  };
  void memoria('readonly', s => s.get('paquete')).then(archivos => {
    if (!Array.isArray(archivos) || collectedFiles.size) return;
    for (const [ruta, archivo] of archivos) if (typeof ruta === 'string' && archivo instanceof Blob) collectedFiles.set(ruta, archivo);
    refreshUI();
  }).catch(e => console.warn('No se pudieron recuperar los recursos importados.', e));
  void window.moduleReadyPromise.then(() => semillaMotor.avisar('listo')).catch(e => semillaMotor.avisar('error', 'No se pudo cargar PvZ 1. Vuelve al jardín y reintenta.'));
})();
