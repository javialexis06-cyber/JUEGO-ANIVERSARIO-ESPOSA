// Servidor local del juego para el computador: entrega los archivos de `juego/` (el mismo juego compilado que va
// en la APK) en http://localhost con un puerto fijo. El puerto no cambia porque el progreso que el juego guarda
// en el navegador (localStorage) va amarrado a esa dirección; si cambiara, cada apertura empezaría de cero.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

/** Si el primero está ocupado por otro programa se prueba el siguiente. */
// (la versión para amigos usa otros, en package.json: así las dos apps pueden estar abiertas a la vez sin cambiar
// de dirección ni perder lo guardado)
const PUERTOS = require('./package.json').puertos ?? [47615, 47616, 47617, 47618];

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ktx2': 'image/ktx2',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

/** Arranca el servidor sobre la carpeta `raiz` y devuelve el puerto en el que quedó. */
function servir(raiz) {
  const base = path.resolve(raiz);
  const servidor = http.createServer((pedido, respuesta) => {
    let ruta;
    try {
      ruta = decodeURIComponent(new URL(pedido.url ?? '/', 'http://localhost').pathname);
    } catch {
      respuesta.writeHead(400).end();
      return;
    }
    if (ruta.endsWith('/')) ruta += 'index.html';
    const archivo = path.normalize(path.join(base, ruta));
    // Nada por fuera de la carpeta del juego
    if (archivo !== base && !archivo.startsWith(base + path.sep)) {
      respuesta.writeHead(403).end();
      return;
    }
    fs.stat(archivo, (error, info) => {
      if ((error || !info.isFile()) && ruta === '/favicon.ico') {
        // El navegador lo pide solo; el ícono de la ventana ya lo pone el programa
        respuesta.writeHead(204).end();
        return;
      }
      if (error || !info.isFile()) {
        respuesta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No está');
        return;
      }
      const cabeceras = {
        'Content-Type': TIPOS[path.extname(archivo).toLowerCase()] ?? 'application/octet-stream',
        'Cache-Control': 'no-cache',
        'Accept-Ranges': 'bytes',
      };
      // Pedazos (los audios los piden así para poder adelantar)
      const rango = /^bytes=(\d*)-(\d*)$/.exec(pedido.headers.range ?? '');
      if (rango && (rango[1] || rango[2])) {
        let ini = rango[1] ? Number(rango[1]) : info.size - Number(rango[2]);
        let fin = rango[1] && rango[2] ? Number(rango[2]) : info.size - 1;
        ini = Math.max(0, ini);
        fin = Math.min(info.size - 1, fin);
        if (ini > fin) {
          respuesta.writeHead(416, { 'Content-Range': `bytes */${info.size}` }).end();
          return;
        }
        respuesta.writeHead(206, { ...cabeceras, 'Content-Range': `bytes ${ini}-${fin}/${info.size}`, 'Content-Length': fin - ini + 1 });
        if (pedido.method === 'HEAD') return respuesta.end();
        fs.createReadStream(archivo, { start: ini, end: fin }).pipe(respuesta);
        return;
      }
      respuesta.writeHead(200, { ...cabeceras, 'Content-Length': info.size });
      if (pedido.method === 'HEAD') return respuesta.end();
      fs.createReadStream(archivo).pipe(respuesta);
    });
  });
  return new Promise((listo, falla) => {
    let i = 0;
    const probar = () => {
      servidor.once('error', (e) => {
        if (e.code === 'EADDRINUSE' && ++i < PUERTOS.length) probar();
        else falla(e);
      });
      servidor.listen(PUERTOS[i], '127.0.0.1', () => listo(PUERTOS[i]));
    };
    probar();
  });
}

module.exports = { servir };
