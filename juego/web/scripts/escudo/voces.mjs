// Las voces del Escudo de las Hermanas (src/escudo/guion.ts, src/escudo/pareja.ts y su versión para amigos
// src/amigos/sin_pareja/escudo.ts): el narrador, las Santas Eliana y Serena y Nath'Gora, con las MISMAS voces que ya
// tienen en la granja (voces-guion/cine-reparto.json y astra-reparto.json) y el modelo con etiquetas de actuación.
//
//   SECO=1 node scripts/escudo/voces.mjs   → cuenta lo que falta y lo que cuesta, no gasta nada
//   node scripts/escudo/voces.mjs          → genera lo que falte (tope: 4000 caracteres por corrida; TOPE=n lo cambia)
//
// Las líneas del mito (y las neutras de los amigos) van a public/audio/escudo/; las que nombran a la pareja, a
// public/audio/escudo-pareja/ (la versión para amigos no copia esa carpeta). Cada carpeta lleva su voces.json con la
// duración de cada línea. La huella sale del modelo, la voz, el procesado y el texto: si algo cambia, se rehace esa.
// Necesita ELEVENLABS_API_KEY en el entorno (nunca en archivos), ffmpeg y la red abierta a api.elevenlabs.io.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PUB = join(RAIZ, 'public');
const CLAVE = process.env.ELEVENLABS_API_KEY;
const MODELO = process.env.MODELO ?? 'eleven_v4';
const AJUSTES = { stability: 0.45, similarity_boost: 0.8, style: 0.35 };
const TOPE = Number(process.env.TOPE ?? 4000);
const FILTRO = { narrador: 'highpass=f=70,aecho=0.8:0.6:45|90:0.16|0.08', normal: 'highpass=f=70', sombra: 'highpass=f=60,aecho=0.8:0.7:60|120:0.2|0.1' };
const procesado = (q) => (q === 'narrador' ? 'narrador' : q === 'nathgora' ? 'sombra' : 'normal');

// Las líneas: se compilan los .ts sin traerse three.js ni los muñecos (no hacen falta para leer textos)
const tmp = mkdtempSync(join(tmpdir(), 'escudo-voces-'));
const entrada = join(tmp, 'e.ts');
writeFileSync(entrada, `export { LINEAS } from '${RAIZ}/src/escudo/guion';
export { LINEAS_PAREJA as PAREJA } from '${RAIZ}/src/escudo/pareja';
export { LINEAS_PAREJA as AMIGOS } from '${RAIZ}/src/amigos/sin_pareja/escudo';`);
const vacio = { name: 'vacio', setup(b) { b.onResolve({ filter: /actores$|^three$|sueltos\/comun$/ }, (a) => ({ path: a.path, namespace: 'vacio' })); b.onLoad({ filter: /.*/, namespace: 'vacio' }, () => ({ contents: 'export const actuar=0,animarMuneco=0,muneco=0,amigoDelAparato=0; export const Group=class{}; export default {};' })); } };
await build({ entryPoints: [entrada], outfile: join(tmp, 'e.mjs'), bundle: true, format: 'esm', platform: 'node', logLevel: 'error', plugins: [vacio] });
const T = await import(pathToFileURL(join(tmp, 'e.mjs')).href);
const comunes = [...Object.values(T.LINEAS), ...Object.values(T.AMIGOS)].map((l) => ({ ...l, dir: 'escudo' }));
const pareja = Object.values(T.PAREJA).map((l) => ({ ...l, dir: 'escudo-pareja' }));
const todas = [...comunes, ...pareja];

const cine = JSON.parse(readFileSync(join(RAIZ, 'voces-guion/cine-reparto.json'), 'utf8'));
const astra = JSON.parse(readFileSync(join(RAIZ, 'voces-guion/astra-reparto.json'), 'utf8'));
const VOZ = { narrador: cine.narrador?.voz ?? astra.narrador?.voz, nathgora: astra.nathgora?.voz, eliana: astra.canalizadora_aura?.voz, serena: astra.canalizadora_lara?.voz };

const decir = (l) => l.d || l.texto;
const huella = (l) => createHash('sha1').update(`${MODELO}|${JSON.stringify(AJUSTES)}|${VOZ[l.quien]}|${FILTRO[procesado(l.quien)]}|${decir(l)}`).digest('hex').slice(0, 6);
const archivo = (l) => `${l.id}-${huella(l)}.ogg`;
const segundos = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());

async function pedir(ruta, op = {}, intentos = 4) {
  for (let i = 0; ; i++) {
    const r = await fetch(`https://api.elevenlabs.io/v1${ruta}`, { ...op, headers: { 'xi-api-key': CLAVE, ...(op.headers ?? {}) } });
    if (r.ok) return r;
    const t = await r.text();
    if (i >= intentos || (r.status < 500 && r.status !== 429)) throw new Error(`${r.status} ${t.slice(0, 200)}`);
    await new Promise((ok) => setTimeout(ok, 2000 * (i + 1)));
  }
}

const falta = todas.filter((l) => VOZ[l.quien] && !existsSync(join(PUB, 'audio', l.dir, archivo(l))));
const chars = falta.reduce((a, l) => a + decir(l).length, 0);
console.log(`${todas.length} líneas · faltan ${falta.length} (${chars} caracteres)`);
if (!process.env.SECO) {
  if (chars > TOPE) throw new Error(`Se pasa del tope de ${TOPE} caracteres (TOPE=n para cambiarlo).`);
  if (falta.length && !CLAVE) throw new Error('Falta ELEVENLABS_API_KEY (se agrega en la configuración del entorno).');
  const crudo = join(RAIZ, 'modelos-crudos', '_voces_escudo');
  mkdirSync(crudo, { recursive: true });
  for (const l of falta) {
    const r = await pedir(`/text-to-speech/${VOZ[l.quien]}?output_format=mp3_44100_128`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: decir(l), model_id: MODELO, voice_settings: AJUSTES, language_code: 'es' }),
    });
    const mp3 = join(crudo, `${l.id}.mp3`);
    writeFileSync(mp3, Buffer.from(await r.arrayBuffer()));
    mkdirSync(join(PUB, 'audio', l.dir), { recursive: true });
    const af = `silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,${FILTRO[procesado(l.quien)]},apad=pad_dur=0.25,loudnorm=I=-17:TP=-2:LRA=11`;
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', mp3, '-af', af, '-ac', '1', '-ar', '48000', '-c:a', 'libopus', '-b:a', '40k', join(PUB, 'audio', l.dir, archivo(l))]);
    unlinkSync(mp3);
    console.log(`  ✓ ${l.id} (${l.quien}, ${decir(l).length})`);
  }
  // Los índices (y fuera los audios viejos)
  for (const dir of ['escudo', 'escudo-pareja']) {
    const carpeta = join(PUB, 'audio', dir);
    if (!existsSync(carpeta)) continue;
    const voces = {}, usados = new Set();
    for (const l of todas.filter((x) => x.dir === dir)) {
      const f = join(carpeta, archivo(l));
      if (!existsSync(f)) continue;
      usados.add(archivo(l));
      voces[l.id] = { archivo: `./audio/${dir}/${archivo(l)}`, seg: Math.round(segundos(f) * 100) / 100 };
    }
    for (const f of readdirSync(carpeta)) if (f.endsWith('.ogg') && !usados.has(f)) unlinkSync(join(carpeta, f));
    writeFileSync(join(carpeta, 'voces.json'), JSON.stringify(voces, null, 1) + '\n');
    console.log(`${dir}/voces.json: ${Object.keys(voces).length} voces`);
  }
}
