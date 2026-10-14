// Las voces de La Carrera de las Tres Lunas (src/carreras/frases.ts y src/carreras/pareja.ts): el presentador, los
// vecinos que corren y Javier y Laura (solo en la versión de la pareja).
//
//   node scripts/carreras/voces.mjs reparto   → busca en la biblioteca de ElevenLabs la voz del presentador (los vecinos
//                                              usan la suya de la granja, voces-guion/astra-reparto.json; Javier y Laura,
//                                              sus voces clonadas «EL» y «ELLA»). Queda en voces-guion/carreras-reparto.json
//   SECO=1 node scripts/carreras/voces.mjs     → cuenta lo que falta y los caracteres, no gasta nada
//   node scripts/carreras/voces.mjs            → genera lo que falte (TOPE=5000 caracteres por defecto)
//
// Salida: public/audio/carreras/<id>-<huella>.ogg con su índice lista.json (id → [archivo, segundos]); las de la
// pareja en public/audio/carreras-pareja/ (la versión para amigos no las lleva). Si cambia cómo se dice una línea, se
// rehace solo esa. Necesita ELEVENLABS_API_KEY en el entorno (nunca en archivos), ffmpeg y la red a api.elevenlabs.io.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLAVE = process.env.ELEVENLABS_API_KEY;
const MODELO = process.env.MODELO ?? 'eleven_v4';
const AJUSTES = { stability: 0.5, similarity_boost: 0.8, style: 0.4 };
const TOPE = Number(process.env.TOPE ?? 5000);
const REPARTO = join(RAIZ, 'voces-guion', 'carreras-reparto.json');
const ASTRA = join(RAIZ, 'voces-guion', 'astra-reparto.json');

async function pedir(ruta, op = {}, intentos = 4) {
  for (let i = 0; ; i++) {
    const r = await fetch(`https://api.elevenlabs.io/v1${ruta}`, { ...op, headers: { 'xi-api-key': CLAVE, ...(op.headers ?? {}) } });
    if (r.ok) return r;
    const t = await r.text();
    if (i >= intentos || (r.status < 500 && r.status !== 429)) throw new Error(`${r.status} ${t.slice(0, 200)}`);
    await new Promise((ok) => setTimeout(ok, 2000 * (i + 1)));
  }
}

async function frases() {
  const dir = mkdtempSync(join(tmpdir(), 'carreras-voces-'));
  const sal = join(dir, 'f.mjs');
  await build({
    stdin: { contents: "export { PRESENTADOR, FRASES_VECINOS } from './frases'; export { FRASES_PAREJA } from './pareja';", resolveDir: join(RAIZ, 'src', 'carreras'), loader: 'ts' },
    bundle: true, format: 'esm', platform: 'node', outfile: sal, logLevel: 'silent',
  });
  const m = await import(pathToFileURL(sal).href);
  rmSync(dir, { recursive: true, force: true });
  return m;
}

async function reparto() {
  if (!CLAVE) throw new Error('Falta ELEVENLABS_API_KEY');
  const salida = existsSync(REPARTO) ? JSON.parse(readFileSync(REPARTO, 'utf8')) : {};
  if (!salida.presentador) {
    for (const q of ['sports announcer', 'announcer energetic', 'radio host energetic']) {
      const params = new URLSearchParams({ page_size: '30', language: 'es', gender: 'male', search: q, sort: 'usage_character_count_1y' });
      const d = await (await pedir(`/shared-voices?${params}`)).json();
      const v = (d.voices ?? []).find((x) => /latin|mexican|colombian|argentin|neutral|standard/i.test(`${x.accent} ${x.descriptive} ${x.description ?? ''}`));
      if (v) {
        salida.presentador = { voz: v.voice_id, nombre: v.name, acento: v.accent, motivo: 'presentador de la carrera, enérgico' };
        break;
      }
    }
  }
  writeFileSync(REPARTO, JSON.stringify(salida, null, 1) + '\n');
  console.log('presentador:', salida.presentador?.nombre);
}

const huella = (l, voz) => createHash('sha1').update(`${MODELO}|${JSON.stringify(AJUSTES)}|${voz}|${l.d}`).digest('hex').slice(0, 6);
const segundos = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());

async function generar() {
  const { PRESENTADOR, FRASES_VECINOS, FRASES_PAREJA } = await frases();
  const rep = existsSync(REPARTO) ? JSON.parse(readFileSync(REPARTO, 'utf8')) : {};
  const astra = existsSync(ASTRA) ? JSON.parse(readFileSync(ASTRA, 'utf8')) : {};
  const VOZ = {};
  if (CLAVE) {
    const sinTilde = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    const { voices } = await (await pedir('/voices')).json();
    VOZ.el = voices.find((v) => sinTilde(v.name) === 'el')?.voice_id;
    VOZ.ella = voices.find((v) => sinTilde(v.name) === 'ella')?.voice_id;
  }
  const voz = (q) => VOZ[q] ?? rep[q]?.voz ?? astra[q]?.voz;
  const todas = [...PRESENTADOR, ...FRASES_VECINOS].map((l) => ({ ...l, dir: 'carreras' })).concat(FRASES_PAREJA.map((l) => ({ ...l, dir: 'carreras-pareja' })));
  const archivo = (l) => `${l.id.replace(/[^a-z0-9_.-]/gi, '_')}-${huella(l, voz(l.quien))}.ogg`;
  const falta = todas.filter((l) => voz(l.quien) && !existsSync(join(RAIZ, 'public', 'audio', l.dir, archivo(l))));
  const sinVoz = [...new Set(todas.filter((l) => !voz(l.quien)).map((l) => l.quien))];
  const chars = falta.reduce((a, l) => a + l.d.length, 0);
  console.log(`${todas.length} líneas · faltan ${falta.length} (${chars} caracteres)${sinVoz.length ? ` · sin voz: ${sinVoz.join(', ')}` : ''}`);
  if (process.env.SECO) return;
  if (!CLAVE) throw new Error('Falta ELEVENLABS_API_KEY');
  let gastado = 0;
  const tmp = mkdtempSync(join(tmpdir(), 'carreras-mp3-'));
  for (const l of falta) {
    if (gastado + l.d.length > TOPE) {
      console.log(`  (tope de ${TOPE} caracteres: queda ${l.id} y las demás)`);
      break;
    }
    const r = await pedir(`/text-to-speech/${voz(l.quien)}?output_format=mp3_44100_128`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: l.d, model_id: MODELO, voice_settings: AJUSTES, language_code: 'es' }),
    });
    gastado += l.d.length;
    const mp3 = join(tmp, 'x.mp3');
    writeFileSync(mp3, Buffer.from(await r.arrayBuffer()));
    const dir = join(RAIZ, 'public', 'audio', l.dir);
    mkdirSync(dir, { recursive: true });
    const af = 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,highpass=f=70,apad=pad_dur=0.15,loudnorm=I=-16:TP=-2:LRA=11';
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', mp3, '-af', af, '-ac', '1', '-ar', '48000', '-c:a', 'libopus', '-b:a', '32k', join(dir, archivo(l))]);
    console.log(`  ✓ ${l.id} (${l.d.length})`);
  }
  rmSync(tmp, { recursive: true, force: true });
  console.log(`caracteres enviados: ${gastado}`);
  // Índices
  for (const dirN of ['carreras', 'carreras-pareja']) {
    const dir = join(RAIZ, 'public', 'audio', dirN);
    if (!existsSync(dir)) continue;
    const lista = {}, usados = new Set();
    for (const l of todas.filter((x) => x.dir === dirN && voz(x.quien))) {
      const a = archivo(l);
      if (!existsSync(join(dir, a))) continue;
      usados.add(a);
      lista[l.id] = [a, Math.round(segundos(join(dir, a)) * 100) / 100];
    }
    for (const f of readdirSync(dir)) if (f.endsWith('.ogg') && !usados.has(f)) unlinkSync(join(dir, f));
    writeFileSync(join(dir, 'lista.json'), JSON.stringify(lista, null, 0) + '\n');
    console.log(`${dirN}/lista.json: ${Object.keys(lista).length} voces`);
  }
}

if (process.argv[2] === 'reparto') await reparto();
else await generar();
