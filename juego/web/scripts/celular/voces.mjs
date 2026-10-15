// Las notas de voz de «Desaparecidos de Astra» (src/celular/casos/*.ts, `voces` de cada caso) con ElevenLabs.
//
//   node scripts/celular/voces.mjs reparto   → escoge en la biblioteca de ElevenLabs una voz distinta para cada
//                                              personaje (voces-guion/celular-reparto.json; se puede corregir a mano)
//   SECO=1 node scripts/celular/voces.mjs     → cuenta lo que falta y cuántos caracteres cuesta, sin gastar
//   node scripts/celular/voces.mjs            → genera lo que falte
//
// Cada audio va a public/audio/celular/<id>-<huella>.ogg y se declara con su duración en public/audio/celular/voces.json.
// La huella sale del modelo, la voz y cómo se dice: si algo cambia, se rehace solo esa nota. Nunca usa las voces
// clonadas de la pareja. Necesita ELEVENLABS_API_KEY en el entorno (nunca en archivos), ffmpeg y la red abierta a
// api.elevenlabs.io. Presupuesto del juego: 9.000 caracteres.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = join(RAIZ, 'public', 'audio', 'celular');
const INDICE = join(DIR, 'voces.json');
const REPARTO = join(RAIZ, 'voces-guion', 'celular-reparto.json');
const CLAVE = process.env.ELEVENLABS_API_KEY;
const MODELO = process.env.MODELO ?? 'eleven_v4';
const AJUSTES = { stability: 0.45, similarity_boost: 0.8, style: 0.35 };
const TOPE = 9000;

async function pedir(ruta, op = {}, intentos = 4) {
  for (let i = 0; ; i++) {
    const r = await fetch(`https://api.elevenlabs.io/v1${ruta}`, { ...op, headers: { 'xi-api-key': CLAVE, ...(op.headers ?? {}) } });
    if (r.ok) return r;
    const t = await r.text();
    if (i >= intentos || (r.status < 500 && r.status !== 429)) throw new Error(`${r.status} ${t.slice(0, 200)}`);
    await new Promise((ok) => setTimeout(ok, 2000 * (i + 1)));
  }
}

// Los casos (TypeScript) se compilan a un archivo temporal para leer sus voces
const tmp = join(tmpdir(), `celular-casos-${process.pid}.mjs`);
await build({ entryPoints: [join(RAIZ, 'src/celular/casos/index.ts')], bundle: true, format: 'esm', outfile: tmp, logLevel: 'error' });
const { CASOS } = await import(tmp);
unlinkSync(tmp);
const VOCES = CASOS.flatMap((c) => c.voces).filter(v => !v.historial);

/** Cómo se busca a cada quien en la biblioteca (género, edad y palabras). «marcela_hoy» usa la voz de Marcela. */
const PERFIL = {
  marcela: ['female', 'young', 'soft sweet'], teresa: ['female', 'old', 'warm grandmother'], mama: ['female', 'middle_aged', 'warm mother'],
  tobias: ['male', 'young', 'nervous young'], abundio: ['male', 'old', 'old grandfather'], quintero: ['male', 'middle_aged', 'rough strong'],
  julian: ['male', 'young', 'friendly energetic'], ursula: ['female', 'middle_aged', 'clear calm'], rosalba: ['female', 'young', 'strong confident'],
  eloy: ['male', 'middle_aged', 'deep serious'], esteban: ['male', 'old', 'wise narrator'], abril: ['female', 'young', 'bright teen'],
  sora: ['female', 'middle_aged', 'gentle soothing'], teofilo: ['male', 'middle_aged', 'gentle storyteller'], matea: ['female', 'young', 'confident friendly'],
  simon: ['male', 'young', 'casual warm'], ezequiel: ['male', 'old', 'gruff'], zora: ['female', 'middle_aged', 'firm leader'],
  orin: ['male', 'middle_aged', 'calm soft'], maia: ['female', 'young', 'cheerful'], nahuel: ['male', 'young', 'warm clear'],
  joaquin: ['male', 'middle_aged', 'friendly casual'], carmela: ['female', 'middle_aged', 'warm funny'], petra: ['female', 'young', 'playful'],
  hugo: ['male', 'middle_aged', 'calm practical'], gregoria: ['female', 'old', 'gentle grandmother'], iria: ['female', 'middle_aged', 'serious caring'],
  celestina: ['female', 'middle_aged', 'cheerful teacher'], bernardo: ['male', 'old', 'tired'], samira: ['female', 'young', 'news'],
  kenzo: ['male', 'young', 'adventurous'], mauro: ['male', 'middle_aged', 'whisper'], boris: ['male', 'middle_aged', 'deep friendly'], said: ['male', 'middle_aged', 'calm doctor'], helena: ['female', 'middle_aged', 'authoritative'],
};
const vozDe = (rep, q) => rep[q === 'marcela_hoy' ? 'marcela' : q]?.voz;

async function reparto() {
  if (!CLAVE) throw new Error('Falta ELEVENLABS_API_KEY (se agrega en la configuración del entorno).');
  const salida = existsSync(REPARTO) ? JSON.parse(readFileSync(REPARTO, 'utf8')) : {};
  const usadas = new Set(Object.values(salida).map((v) => v.voz));
  const quienes = [...new Set(VOCES.map((v) => (v.quien === 'marcela_hoy' ? 'marcela' : v.quien)))];
  for (const q of quienes) {
    if (salida[q]) continue;
    const [gender, age, palabras] = PERFIL[q] ?? ['female', 'middle_aged', ''];
    let elegida = null;
    for (const search of [palabras, palabras.split(' ')[0], '']) {
      const params = new URLSearchParams({ page_size: '40', language: 'es', gender, age, sort: 'usage_character_count_1y' });
      if (search) params.set('search', search);
      const d = await (await pedir(`/shared-voices?${params}`)).json();
      const lista = (d.voices ?? []).filter((v) => !usadas.has(v.voice_id));
      elegida = lista.find((v) => /latin|colombian|mexican|venezuelan|argentin|chilean|peruvian/i.test(`${v.accent} ${v.description ?? ''}`)) ?? (search ? null : lista[0]);
      if (elegida) break;
    }
    if (!elegida) throw new Error(`No encontré voz para ${q}`);
    usadas.add(elegida.voice_id);
    salida[q] = { voz: elegida.voice_id, dueno: elegida.public_owner_id, nombre: elegida.name, acento: elegida.accent, edad: age };
    console.log(`${q}: ${elegida.name} (${elegida.accent})`);
  }
  mkdirSync(dirname(REPARTO), { recursive: true });
  writeFileSync(REPARTO, JSON.stringify(salida, null, 1) + '\n');
}

const decir = (v) => v.d || v.texto;
const huella = (v, voz) => createHash('sha1').update(`${MODELO}|${JSON.stringify(AJUSTES)}|${voz}|${decir(v)}`).digest('hex').slice(0, 6);
const archivoDe = (v, voz) => `${v.id}-${huella(v, voz)}.ogg`;
const segundos = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());

async function generar() {
  const rep = existsSync(REPARTO) ? JSON.parse(readFileSync(REPARTO, 'utf8')) : {};
  const total = VOCES.reduce((a, v) => a + decir(v).length, 0);
  const falta = VOCES.filter((v) => vozDe(rep, v.quien) && !existsSync(join(DIR, archivoDe(v, vozDe(rep, v.quien)))));
  const sinVoz = VOCES.filter((v) => !vozDe(rep, v.quien)).map((v) => v.id);
  const chars = falta.reduce((a, v) => a + decir(v).length, 0);
  console.log(`${VOCES.length} notas de voz (${total} caracteres en total, tope ${TOPE}) · faltan ${falta.length} (${chars} caracteres)${sinVoz.length ? ` · sin voz: ${sinVoz.join(', ')}` : ''}`);
  if (total > TOPE) throw new Error(`Las notas de voz pasan del tope de ${TOPE} caracteres`);
  if (process.env.SECO) return;
  if (!CLAVE) throw new Error('Falta ELEVENLABS_API_KEY (se agrega en la configuración del entorno).');
  mkdirSync(DIR, { recursive: true });
  const agregadas = new Set();
  for (const v of falta) {
    const q = v.quien === 'marcela_hoy' ? 'marcela' : v.quien;
    const voz = vozDe(rep, v.quien);
    const tts = () => pedir(`/text-to-speech/${voz}?output_format=mp3_44100_128`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: decir(v), model_id: MODELO, voice_settings: AJUSTES, language_code: 'es' }),
    }, 2);
    let r;
    try { r = await tts(); } catch (e) {
      // Las voces de la biblioteca compartida hay que agregarlas a la cuenta antes de usarlas
      if (agregadas.has(q) || !rep[q]?.dueno) throw e;
      agregadas.add(q);
      await pedir(`/voices/add/${rep[q].dueno}/${voz}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ new_name: `celular ${q}` }) });
      r = await tts();
    }
    const mp3 = join(tmpdir(), `${v.id}.mp3`);
    writeFileSync(mp3, Buffer.from(await r.arrayBuffer()));
    const af = 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,highpass=f=80,acompressor=threshold=-20dB:ratio=3,apad=pad_dur=0.25,loudnorm=I=-17:TP=-2:LRA=11';
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', mp3, '-af', af, '-ac', '1', '-ar', '48000', '-c:a', 'libopus', '-b:a', '40k', join(DIR, archivoDe(v, voz))]);
    unlinkSync(mp3);
    console.log(`  ✓ ${v.id} (${v.quien}, ${decir(v).length})`);
  }
  // El índice (y se borra lo viejo)
  const voces = {}, usados = new Set();
  for (const v of VOCES) {
    const voz = vozDe(rep, v.quien);
    if (!voz) continue;
    const a = archivoDe(v, voz), f = join(DIR, a);
    if (!existsSync(f)) continue;
    usados.add(a);
    voces[v.id] = { archivo: `./audio/celular/${a}`, seg: Math.round(segundos(f) * 100) / 100 };
  }
  for (const f of readdirSync(DIR)) if (f.endsWith('.ogg') && !usados.has(f)) unlinkSync(join(DIR, f));
  writeFileSync(INDICE, JSON.stringify({ version: 1, caracteres: total, voces }, null, 1) + '\n');
  console.log(`listo: ${Object.keys(voces).length} notas en public/audio/celular/voces.json`);
}

if (process.argv[2] === 'reparto') await reparto();
else await generar();
