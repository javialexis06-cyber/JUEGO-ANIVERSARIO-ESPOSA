/* Reinicio general (pedido de Javier, 1 de noviembre de 2026): cada dispositivo empieza desde cero una sola vez al abrir
 * esta versión, para que no queden partidas de versiones anteriores. Borra almacenamiento local, de sesión y las bases
 * de datos del juego (partidas, perfiles, compras, sesión de la casa). Conserva la caché de recursos descargados.
 * Los navegadores automatizados de las pruebas (navigator.webdriver) no se tocan. */
(function () {
  var EPOCA = '2026-11-01', CLAVE = 'nuestro-hogar-epoca';
  try {
    if (navigator.webdriver || localStorage.getItem(CLAVE) === EPOCA) return;
    try { window.stop(); } catch (e) { /* nada */ }
    var bases = indexedDB.databases ? indexedDB.databases() : Promise.resolve([]);
    var terminar = function () {
      try { localStorage.clear(); sessionStorage.clear(); localStorage.setItem(CLAVE, EPOCA); } catch (e) { /* nada */ }
      location.reload();
    };
    bases.then(function (lista) {
      return Promise.all((lista || []).map(function (d) {
        return new Promise(function (ok) { if (!d.name) return ok(); var r = indexedDB.deleteDatabase(d.name); r.onsuccess = r.onerror = r.onblocked = function () { ok(); }; });
      }));
    }).then(terminar, terminar);
  } catch (e) { /* sin almacenamiento: nada que reiniciar */ }
})();
