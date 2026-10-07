// Revisa que la versión para amigos (dist-amigos, de `npm run build:amigos`) no tenga NADA de la pareja adentro:
// ni las palabras de `palabras-pareja.mjs`, ni los recuerdos (los títulos y frases de docs/sistemas/cien-puertas.md y todo lo
// de `src/casa/lavado/pareja.ts`), ni archivos de la casa, de Cien Puertas, de los recuerdos o de las voces. Busca
// en todo el texto (JavaScript, HTML, CSS, JSON, SVG) y dentro de los modelos GLB (nombres de mallas y materiales).
// Si encuentra algo, falla (así GitHub Actions no publica la APK ni el .exe de los amigos).
// Uso: node scripts/verificar-amigos.mjs [carpeta]   (por defecto dist-amigos)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { PALABRAS_PAREJA, buscarPersonal } from './palabras-pareja.mjs';

const carpeta = process.argv[2] ?? 'dist-amigos';
if (!existsSync(carpeta)) {
  console.error(`No existe ${carpeta}: primero npm run build:amigos`);
  process.exit(1);
}

// ------------------------------------------------------------------------------------------ Lo que no puede estar
/** Los recuerdos: títulos y frases de la tabla de docs/sistemas/cien-puertas.md («Los recuerdos (de verdad)»). */
function recuerdosDelDocumento() {
  const ruta = '../../docs/sistemas/cien-puertas.md';
  if (!existsSync(ruta)) return [];
  const md = readFileSync(ruta, 'utf8');
  const i = md.indexOf('## Los recuerdos');
  const j = md.indexOf('\n## ', i + 5);
  const lista = [];
  for (const fila of md.slice(i, j).split('\n')) {
    const c = fila.split('|').map((x) => x.trim());
    if (c.length < 4 || !/^\d+$/.test(c[1])) continue;
    lista.push(c[2].replace(/\s*\(.*?\)\s*/g, ' ').trim());
    for (const m of c[3].matchAll(/«([^»]+)»/g)) lista.push(m[1]);
  }
  return lista;
}

/** Todo lo de pareja.ts del lavado (nombres y frases de las cartas de amor, apodos de los disfraces…): los valores. */
function textosDelLavado() {
  let ts = readFileSync('src/casa/lavado/pareja.ts', 'utf8').replace(/\/\/.*$/gm, '');
  const ini = ts.indexOf('export const PAREJA');
  ts = ts.slice(ini, ts.indexOf('cartasViejas:', ini));
  const valores = [...ts.matchAll(/(?::|, ) *'((?:[^'\\]|\\.){6,})'/g)].map((m) => m[1]);
  return valores.map((t) => t.replace(/\\'/g, "'").replace(/^\P{L}+/u, '').trim());
}

/** Frases de los recuerdos que también son de uso común (no delatan nada): «Poderes para siempre». */
const COMUNES = new Set(['Para siempre']);

const FRASES = [...new Set([...recuerdosDelDocumento(), ...textosDelLavado()].filter((t) => t.length >= 8 && !COMUNES.has(t)))];
/** Platos que son parte de los juegos de los amigos (el kiosco de wafles del súper, sus productos): el plato solo no
 *  delata nada; lo personal es la anécdota («wafles cada vez que quieras»), que sí se busca. */
const PLATOS_DEL_JUEGO = new Set(['wafle']);
const LISTA = [...PALABRAS_PAREJA.filter((p) => !PLATOS_DEL_JUEGO.has(p)), ...FRASES];

/** Archivos que delatan la casa o lo personal (por su ruta). */
const RUTAS_PROHIBIDAS = [
  /(^|\/)recuerdos\//, /(^|\/)voces\//, /(^|\/)carga\//, /casa_[a-z]/, /(^|\/)deco_/, /(^|\/)comida_/, /(^|\/)regalo/, /(^|\/)puertas/,
  /(^|\/)mesa\b/, /casa\.json$/, /cocina\//, /cohete_/, /\.(mp3|ogg|m4a|wav)$/,
];
/** Las únicas páginas que puede tener (la sala de juegos y los juegos aptos; ver PAGINAS_AMIGOS en vite.config.ts). */
const config = readFileSync('vite.config.ts', 'utf8');
const PAGINAS = new Set(['index.html', ...JSON.parse((config.match(/PAGINAS_AMIGOS = (\[[^\]]*\])/)?.[1] ?? '[]').replace(/'/g, '"'))]);

// ------------------------------------------------------------------------------------------ Revisar
const fallas = [];
let revisados = 0;
function* archivos(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) yield* archivos(p);
    else yield p;
  }
}
for (const f of archivos(carpeta)) {
  const r = relative(carpeta, f).split('\\').join('/');
  if (RUTAS_PROHIBIDAS.some((rx) => rx.test(r))) fallas.push(`${r}: archivo que no va en la versión para amigos`);
  if (r.endsWith('.html') && !PAGINAS.has(r)) fallas.push(`${r}: página que no está en PAGINAS_AMIGOS`);
  let texto = null;
  if (/\.(js|mjs|html|css|json|svg|txt|webmanifest)$/.test(r)) texto = readFileSync(f, 'utf8');
  else if (r.endsWith('.glb')) {
    const b = readFileSync(f);
    texto = b.subarray(20, 20 + b.readUInt32LE(12)).toString();
  }
  if (texto === null) continue;
  revisados++;
  const hallado = buscarPersonal(texto, LISTA);
  if (hallado.length) fallas.push(`${r}: ${hallado.slice(0, 6).join(' | ')}`);
}

console.log(`Revisados ${revisados} archivos de ${carpeta} contra ${PALABRAS_PAREJA.length} palabras y ${FRASES.length} frases de los recuerdos.`);
if (fallas.length) {
  console.error(`\nLa versión para amigos tiene cosas de la pareja:\n${fallas.map((x) => `  - ${x}`).join('\n')}`);
  process.exit(1);
}
console.log('Limpia: la versión para amigos no trae nada de la pareja.');
