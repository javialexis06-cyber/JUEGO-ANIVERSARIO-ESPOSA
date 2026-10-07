// Nuestro Hogar para computador (Windows): el mismo juego de la APK en una ventana propia. La casa en línea es la
// misma (Supabase), así que uno puede jugar desde el celular y el otro desde el computador.
// - El juego está pensado para un celular acostado (~844×390): se agranda con el zoom para que se vea igual de
//   cómodo en una pantalla grande, en vez de quedar con botones diminutos.
// - F11: pantalla completa. Esc: lo mismo que el botón «atrás» de Android (lo maneja el juego).
// - Al minimizar, el juego se duerme solo (deja de dibujar y calla la música), como en el celular.
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('node:path');
const { servir } = require('./servidor.cjs');
// (la versión para amigos cambia el nombre en package.json al armarse: «Sala de Juegos»)
const { productName = 'Nuestro Hogar' } = require('./package.json');

/** Alto de la pantalla del juego en píxeles CSS (como un celular acostado). */
const ALTO_CSS = 420;

// La tele arranca el siguiente video sola, como en la APK; y WebGL aunque la tarjeta de video sea vieja
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

let ventana = null;

function abrir(puerto) {
  const inicio = `http://localhost:${puerto}`;
  ventana = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 760,
    minHeight: 400,
    backgroundColor: '#f6e3dd',
    title: productName,
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: { backgroundThrottling: true, spellcheck: false },
  });
  ventana.webContents.setUserAgent(`${ventana.webContents.getUserAgent()} NuestroHogarEscritorio`);

  const ajustarZoom = () => {
    if (!ventana || ventana.isDestroyed()) return;
    const [, alto] = ventana.getContentSize();
    ventana.webContents.setZoomFactor(Math.max(1, Math.min(4, alto / ALTO_CSS)));
  };
  ventana.on('resize', ajustarZoom);
  ventana.on('enter-full-screen', ajustarZoom);
  ventana.on('leave-full-screen', ajustarZoom);
  ventana.webContents.on('did-finish-load', ajustarZoom);

  ventana.once('ready-to-show', () => {
    ventana.maximize();
    ventana.show();
  });

  // F11: pantalla completa
  ventana.webContents.on('before-input-event', (evento, tecla) => {
    if (tecla.type === 'keyDown' && tecla.key === 'F11') {
      ventana.setFullScreen(!ventana.isFullScreen());
      evento.preventDefault();
    }
  });

  // Enlaces de afuera (YouTube, etc.) en el navegador de siempre; la ventana solo muestra el juego
  ventana.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });
  ventana.webContents.on('will-navigate', (evento, url) => {
    if (!url.startsWith(inicio)) {
      evento.preventDefault();
      if (/^https?:\/\//.test(url)) void shell.openExternal(url);
    }
  });

  ventana.on('closed', () => (ventana = null));
  void ventana.loadURL(`${inicio}/index.html`);
}

if (!app.requestSingleInstanceLock()) {
  // Ya estaba abierto: se muestra esa ventana en vez de abrir otra (dos a la vez se pelearían el progreso)
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!ventana) return;
    if (ventana.isMinimized()) ventana.restore();
    ventana.focus();
  });
  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    const puerto = await servir(path.join(__dirname, 'juego'));
    abrir(puerto);
  });
  app.on('window-all-closed', () => app.quit());
}
