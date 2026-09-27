// Arma la versión para publicar como enlace (Artifact): una sola página con el JS y el CSS adentro,
// sin <html>/<head>/<body> (el visor los pone), más las carpetas de modelos y datos al lado.
// Uso: npm run build && node scripts/empaquetar-artefacto.mjs
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const SALIDA = 'artefacto';
rmSync(SALIDA, { recursive: true, force: true });
mkdirSync(SALIDA, { recursive: true });

let html = readFileSync(join(DIST, 'index.html'), 'utf8');
const leer = (ruta) => readFileSync(join(DIST, ruta.replace(/^\.\//, '')), 'utf8');

// JS y CSS del juego, adentro de la página
let js = '';
html = html.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>\s*/g, (_, src) => {
  js += leer(src);
  return '';
});
let css = '';
html = html.replace(/<link rel="stylesheet" crossorigin href="([^"]+)">\s*/g, (_, href) => {
  css += leer(href);
  return '';
});
if (!js) throw new Error('No se encontró el script del juego en dist/index.html');

const titulo = html.match(/<title>[\s\S]*?<\/title>/)[0];
const fuentes = [...html.matchAll(/<link rel="(?:preconnect|stylesheet)" href="https:\/\/fonts\.[^>]+>/g)].map((m) => m[0]).join('\n');
const cuerpo = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>')).trim();

const pagina = [
  titulo,
  fuentes,
  `<style>\n${css}\n</style>`,
  cuerpo,
  '<script>window.__modelosEnTexto = true;</script>',
  `<script type="module">\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`,
  '',
].join('\n');
writeFileSync(join(SALIDA, 'index.html'), pagina);

// Letras (el CSS de adentro las pide en ./assets/)
mkdirSync(join(SALIDA, 'assets'), { recursive: true });
for (const f of readdirSync(join(DIST, 'assets')).filter((f) => /\.woff2?$/.test(f))) cpSync(join(DIST, 'assets', f), join(SALIDA, 'assets', f));

// Modelos, íconos y datos (se leen con fetch relativo)
for (const carpeta of ['modelos', 'modelos-plano', 'datos']) if (existsSync(join(DIST, carpeta))) cpSync(join(DIST, carpeta), join(SALIDA, carpeta), { recursive: true });
// El visor no sirve .glb: cada modelo va como texto base64 (.glb.txt) y el juego lo decodifica al cargar
for (const carpeta of ['modelos', 'modelos-plano']) {
  const d = join(SALIDA, carpeta);
  if (!existsSync(d)) continue;
  for (const f of readdirSync(d).filter((f) => f.endsWith('.glb'))) {
    writeFileSync(join(d, `${f}.txt`), readFileSync(join(d, f)).toString('base64'));
    rmSync(join(d, f));
  }
}

const archivos = [];
const recorrer = (d) => {
  for (const f of readdirSync(d)) {
    const r = join(d, f);
    if (statSync(r).isDirectory()) recorrer(r);
    else archivos.push(r);
  }
};
recorrer(SALIDA);
const lista = archivos.filter((f) => !f.endsWith('index.html')).map((f) => relative(SALIDA, f));
const total = archivos.reduce((a, f) => a + statSync(f).size, 0);
const mayor = archivos.reduce((a, f) => Math.max(a, statSync(f).size), 0);
writeFileSync(join(SALIDA, 'archivos.json'), JSON.stringify(Object.fromEntries(lista.map((f) => [f, f])), null, 1));
console.log(`página ${(statSync(join(SALIDA, 'index.html')).size / 1e6).toFixed(2)} MB · ${lista.length} archivos más · total ${(total / 1e6).toFixed(1)} MB · el mayor ${(mayor / 1e6).toFixed(2)} MB`);
