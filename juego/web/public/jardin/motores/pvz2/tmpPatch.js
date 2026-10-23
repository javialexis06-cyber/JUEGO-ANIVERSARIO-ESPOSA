const electron = {
  isFullscreen: () => {
    return document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
  },
  enterFullscreen: (element = document.documentElement) => {
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) { // Firefox
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) { // Chrome, Safari and Opera
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) { // IE/Edge
      element.msRequestFullscreen();
    }
  },
  exitFullscreen: () => {
    if (electron.isFullscreen() && document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { // Firefox
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { // IE/Edge
      document.msExitFullscreen();
    }
  },
  ipcRenderer: {
    send: function (channel, ...data) {
      switch (channel) {
        case "e_isFullScreen":
          return electron.isFullscreen();
        case "e_fullScreen":
          return electron.isFullscreen() ? electron.exitFullscreen() : electron.enterFullscreen();
        case "e_window":
          return electron.exitFullscreen();
        case "e_openURL":
          return electron.shell.openExternal(data[0]);
      }
    },
    sendSync: function (channel, data) {
      switch (channel) {
        case "e_isFullScreen":
          return electron.isFullscreen();
      }
    },
    on: function (channel, callback) {
    }
  },
  shell: {
    openExternal: function (url) {
      const parsed = new URL(url, location.href); if (parsed.protocol !== 'https:') return false; return window.open(parsed.href, '_blank', 'noopener,noreferrer');
    }
  }
};

window.electron = electron;
// 0.16.0 platform bridge. Level paths are logical IndexedDB keys, not OS paths.
const levelDatabase = new Promise((resolve, reject) => {
  const request = indexedDB.open('pvzge-github-levels', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('levels');
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
async function levelRequest(mode, operation) {
  const database = await levelDatabase;
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('levels', mode);
    const request = operation(transaction.objectStore('levels'));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onabort = () => reject(transaction.error);
    transaction.onerror = () => reject(transaction.error);
  });
}
const listenWindow = (event, callback) => {
  window.addEventListener(event, callback);
  return () => window.removeEventListener(event, callback);
};
window.electronAPI = {
  center: () => window.moveTo((screen.availWidth - window.outerWidth) / 2, (screen.availHeight - window.outerHeight) / 2),
  setSize: (width, height) => window.resizeTo(width, height),
  quit: () => window.semillaMotor.cerrar().catch(e => { window.semillaMotor.avisar('error', 'No se pudo guardar el perfil. Reintenta antes de salir.'); console.error(e); }),
  // Browsers do not expose developer-tool window control.
  openDevTools: () => false,
  closeDevTools: () => false,
  toggleDevTools: () => false,
  isFullScreen: () => Boolean(electron.isFullscreen()),
  fullScreen: () => electron.enterFullscreen(),
  window: () => electron.exitFullscreen(),
  openUrl: url => electron.shell.openExternal(url),
  getCurrentResolutionSync: () => '',
  onWindowFocused: callback => listenWindow('focus', callback),
  onWindowUnfocused: callback => listenWindow('blur', callback),
  saveLevel: (path, content) => levelRequest('readwrite', store => store.put(content, path)),
  loadLevel: path => levelRequest('readonly', store => store.get(path)).then(value => value ?? null),
  removeLevel: path => levelRequest('readwrite', store => store.delete(path)),
  listLevels: () => levelRequest('readonly', store => store.getAllKeys()),
};
