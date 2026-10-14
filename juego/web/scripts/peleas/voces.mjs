// Las voces del Torneo del Despertar Dorado: el presentador y lo que dice cada luchador (src/peleas/luchadores.ts,
// presentador.ts y pareja.ts), con ElevenLabs (modelo eleven_v4, las emociones en inglés entre corchetes).
//   SECO=1 node scripts/peleas/voces.mjs   → cuenta lo que falta y los caracteres que gasta
//   node scripts/peleas/voces.mjs          → genera lo que falte
// Reparto: voces-guion/peleas-reparto.json (las de la granja para Eliana, Serena, Tarek, Otto, el Conde y Vael'Thor;
// un comentarista para el presentador; las voces clonadas «EL» y «ELLA» para Javier y Laura).
// Salida: public/audio/peleas/comun/ (lo de todos: también va en la versión de amigos) y public/audio/peleas/pareja/
// (Javier y Laura), cada carpeta con su lista.json (id → [archivo, segundos]). La huella sale de la voz y de cómo se
// dice: si cambia, se rehace solo esa. Necesita ELEVENLABS_API_KEY en el entorno (nunca en archivos), ffmpeg y red.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SALIDA = join(RAIZ, 'public', 'audio', 'peleas');
const REPARTO = JSON.parse(readFileSync(join(RAIZ, 'voces-guion', 'peleas-reparto.json'), 'utf8'));
const CLAVE = process.env.ELEVENLABS_API_KEY;
const MODELO = process.env.MODELO ?? 'eleven_v4';
const AJUSTES = { stability: 0.4, similarity_boost: 0.8, style: 0.45 };
const TOPE = Number(process.env.TOPE ?? 6000);

// Las frases salen del código del juego (compilado aparte)
const tmp = join(RAIZ, 'modelos-crudos', '_voces_peleas');
mkdirSync(tmp, { recursive: true });
writeFileSync(join(tmp, 'entrada.ts'), `export { frasesComunes } from '${join(RAIZ, 'src/peleas/luchadores.ts')}';
export { FRASES_PRESENTADOR } from '${join(RAIZ, 'src/peleas/presentador.ts')}';
export { PAREJA_LUCHADORES } from '${join(RAIZ, 'src/peleas/pareja.ts')}';\n`);
await build({ entryPoints: [join(tmp, 'entrada.ts')], outfile: join(tmp, 'frases.mjs'), bundle: true, format: 'esm', platform: 'node', logLevel: 'silent' });
const { frasesComunes, FRASES_PRESENTADOR, PAREJA_LUCHADORES } = await import(pathToFileURL(join(tmp, 'frases.mjs')).href);

const lineas = [];
for (const f of FRASES_PRESENTADOR) lineas.push({ quien: 'presentador', f, carpeta: 'comun' });
for (const { quien, f } of frasesComunes()) lineas.push({ quien, f, carpeta: 'comun' });
for (const d of PAREJA_LUCHADORES) {
  const F = d.frases;
  for (const f of [...F.entrada, ...F.especial, ...F.super, ...F.victoria, ...F.derrota, ...Object.values(F.contra ?? {})]) lineas.push({ quien: d.voz, f, carpeta: 'pareja' });
  if (F.gana) lineas.push({ quien: 'presentador', f: F.gana, carpeta: 'pareja' });
}

async function pedir(ruta, op = {}, intentos = 4) {
  for (let i = 0; ; i++) {
    const r = await fetch(`https://api.elevenlabs.io/v1${ruta}`, { ...op, headers: { 'xi-api-key': CLAVE, ...(op.headers ?? {}) } });
    if (r.ok) return r;
    const t = await r.text();
    if (i >= intentos || (r.status < 500 && r.status !== 429)) throw new Error(`${r.status} ${t.slice(0, 200)}`);
    await new Promise((ok) => setTimeout(ok, 2000 * (i + 1)));
  }
}

let VOZ = {};
if (CLAVE) {
  const sinTilde = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const { voices } = await (await pedir('/voices')).json();
  VOZ = { el: voices.find((v) => sinTilde(v.name) === 'el')?.voice_id, ella: voices.find((v) => sinTilde(v.name) === 'ella')?.voice_id };
}
const voz = (q) => VOZ[q] ?? REPARTO[q]?.voz;
const decir = (l) => l.f.d || l.f.t;
const huella = (l) => createHash('sha1').update(`${MODELO}|${JSON.stringify(AJUSTES)}|${voz(l.quien) ?? l.quien}|${decir(l)}`).digest('hex').slice(0, 6);
const archivo = (l) => `${l.f.id.replace(/[^\w.-]/g, '_')}-${huella(l)}.ogg`;
const ruta = (l) => join(SALIDA, l.carpeta, archivo(l));
const segundos = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());

const falta = lineas.filter((l) => !existsSync(ruta(l)));
const chars = falta.reduce((a, l) => a + decir(l).length, 0);
console.log(`${lineas.length} líneas · faltan ${falta.length} (${chars} caracteres)${CLAVE ? '' : ' · sin clave: solo se cuenta'}`);
if (!process.env.SECO && CLAVE) {
  if (chars > TOPE) throw new Error(`Pasa del tope de ${TOPE} caracteres (TOPE=… para subirlo)`);
  for (const c of ['comun', 'pareja']) mkdirSync(join(SALIDA, c), { recursive: true });
  let gastados = 0;
  for (const l of falta) {
    const v = voz(l.quien);
    if (!v) {
      console.log(`  (sin voz para ${l.quien})`);
      continue;
    }
    const r = await pedir(`/text-to-speech/${v}?output_format=mp3_44100_128`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: decir(l), model_id: MODELO, voice_settings: AJUSTES, language_code: 'es' }),
    });
    gastados += decir(l).length;
    const mp3 = join(tmp, 'linea.mp3');
    writeFileSync(mp3, Buffer.from(await r.arrayBuffer()));
    const af = 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,highpass=f=70,apad=pad_dur=0.12,loudnorm=I=-16:TP=-1.5:LRA=11';
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', mp3, '-af', af, '-ac', '1', '-ar', '48000', '-c:a', 'libopus', '-b:a', '32k', ruta(l)]);
    unlinkSync(mp3);
    console.log(`  ✓ ${l.f.id} (${l.quien})`);
  }
  console.log(`caracteres gastados: ${gastados}`);
}
// Las listas (y se borran los audios que ya no se usan)
for (const c of ['comun', 'pareja']) {
  const dir = join(SALIDA, c);
  if (!existsSync(dir)) continue;
  const lista = {}, usados = new Set();
  for (const l of lineas.filter((x) => x.carpeta === c)) {
    if (!existsSync(ruta(l))) continue;
    usados.add(archivo(l));
    lista[l.f.id] = [archivo(l), Math.round(segundos(ruta(l)) * 100) / 100];
  }
  for (const f of readdirSync(dir)) if (f.endsWith('.ogg') && !usados.has(f)) unlinkSync(join(dir, f));
  writeFileSync(join(dir, 'lista.json'), JSON.stringify(lista, null, 0).replace(/],/g, '],\n') + '\n');
  console.log(`${c}/lista.json: ${Object.keys(lista).length} voces`);
}
