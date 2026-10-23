// Revisa que la versión para amigos (dist-amigos, de `npm run build:amigos`) no tenga NADA de la pareja adentro:
// ni las palabras de `palabras-pareja.mjs`, ni los recuerdos (los títulos y frases de docs/sistemas/cien-puertas.md y todo lo
// de `src/casa/lavado/pareja.ts`), ni archivos de la casa, de Cien Puertas, de los recuerdos o de las voces. Busca
// en todo el texto (JavaScript, HTML, CSS, JSON, SVG) y dentro de los modelos GLB (nombres de mallas y materiales).
// Si encuentra algo, falla (así GitHub Actions no publica la APK ni el .exe de los amigos).
// Uso: node scripts/verificar-amigos.mjs [carpeta]   (por defecto dist-amigos)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
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

/** Frases de los recuerdos que también son de uso común (no delatan nada): «Poderes para siempre», la «suerte» de los
 *  juegos, las «lucecitas» de la carta de todos. */
const COMUNES = new Set(['Para siempre', 'La suerte', 'Lucecitas']);

const FRASES = [...new Set([...recuerdosDelDocumento(), ...textosDelLavado()].filter((t) => t.length >= 8 && !COMUNES.has(t)))];
/** Platos que son parte de los juegos de los amigos (el kiosco de wafles del súper, los tres restaurantes de la cocina):
 *  el plato solo no delata nada; lo personal es la anécdota («wafles cada vez que quieras», el frappé de después del
 *  trabajo), que sí se busca. */
const PLATOS_DEL_JUEGO = new Set(['wafle', 'frappé', 'fresas con crema']);
const LISTA = [...PALABRAS_PAREJA.filter((p) => !PLATOS_DEL_JUEGO.has(p)), ...FRASES];

/** Archivos que delatan la casa o lo personal (por su ruta). */
const RUTAS_PROHIBIDAS = [
  /(^|\/)recuerdos\//, /(^|\/)voces\//, /(^|\/)carga\//, /casa_[a-z]/, /(^|\/)deco_/, /(^|\/)comida_/, /(^|\/)regalo/, /(^|\/)puertas/,
  /casa\.json$/,
  // audio: los efectos y la música del Jardín (jardin/pvz/audio/, sin voces), solo la música de los juegos de los amigos y los efectos (nunca la de la pareja ni las voces), las voces
  // del mito del Escudo (audio/escudo/: las de la pareja van aparte en audio/escudo-pareja/) con su música de la granja
  // las de la carrera (presentador y vecinos; las de la pareja van en audio/carreras-pareja/, que no se copia) y las
  // notas de voz del celular (ningún caso es de la pareja) y las voces comunes del torneo de peleas
  /^(?!musica\/(super|mesa|lavado|sangre|cohete|cocina|amigos)-|sfx\/|audio\/escudo\/|audio\/carreras\/|audio\/celular\/|audio\/peleas\/comun\/|audio\/astra\/musica\/M(16|19|20)-|jardin\/pvz\/audio\/).*\.(mp3|ogg|m4a|wav)$/, /(^|\/)musica\/pareja\//,
  // la pareja cuando llega a comer a la cocina y el cine de las escenas premium de la mesa (su CSS solo viene con el
  // cine de verdad: la versión para amigos lleva uno vacío, src/amigos/sin_pareja/cine.ts)
  /cocina\/gente\/pareja_/, /(^|\/)cine-[\w-]+\.css$/,
];
/** Las únicas páginas que puede tener (la sala de juegos y los juegos aptos; ver PAGINAS_AMIGOS en vite.config.ts). */
const config = readFileSync('vite.config.ts', 'utf8');
const PAGINAS = new Set(['index.html', ...JSON.parse((config.match(/PAGINAS_AMIGOS = (\[[^\]]*\])/)?.[1] ?? '[]').replace(/'/g, '"'))]);
// Páginas auxiliares incluidas en los motores, no entradas Vite de la casa.
for (const p of ['pvz1/index.html','pvz1/pvz-portable.html','pvz2/index.html']) PAGINAS.add('jardin/motores/'+p);
// Coincidencias públicas de Gardendless: mundo Halloween y detección de iPhone.
// Solo se admiten en los bytes revisados de esos cuatro distribuibles; las demás palabras/frases siguen activas.
const EXTERNOS_PVZ = {
  'pvz2/assets/main/index.js': ['3a982bfea707e5ce2fbb519c01f2b557be57026eadebc85fa6e793e202b31d3c', 'Halloween'],
  'pvz2/assets/resources/config.json': ['347d9145e173863487189617410959dc1bbb93fe27a15cba715dabc175c3adec', 'Halloween'],
  'pvz2/audio/manifest.json': ['77ccb8534419911f6430e45ed1f67cda99edde0c725577e018ed7980e9fc36f7', 'Halloween'],
  'pvz2/cocos-js/_virtual_cc-937a2166.js': ['cf800aff939138b976b7155adec58eada72d3831b0be5887bd806868e861c276', 'iPhone'],
};

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
  const externo = EXTERNOS_PVZ[r.replace(/^jardin\/motores\//,'')];
  const verificado = externo && r.startsWith('jardin/motores/') && createHash('sha256').update(texto).digest('hex') === externo[0];
  if (externo && !verificado) fallas.push(`${r}: distribuible externo distinto del revisado; revisar antes de admitir coincidencias comunes`);
  const hallado = buscarPersonal(texto, verificado ? LISTA.filter(p => p !== externo[1]) : LISTA);
  if (hallado.length) fallas.push(`${r}: ${hallado.slice(0, 6).join(' | ')}`);
}

console.log(`Revisados ${revisados} archivos de ${carpeta} contra ${PALABRAS_PAREJA.length} palabras y ${FRASES.length} frases de los recuerdos.`);
if (fallas.length) {
  console.error(`\nLa versión para amigos tiene cosas de la pareja:\n${fallas.map((x) => `  - ${x}`).join('\n')}`);
  process.exit(1);
}
console.log('Limpia: la versión para amigos no trae nada de la pareja.');
