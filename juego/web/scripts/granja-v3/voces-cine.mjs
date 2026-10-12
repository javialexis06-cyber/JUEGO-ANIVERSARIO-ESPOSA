// Las voces de las películas de la granja (src/granja-v3/cine-lineas.ts): el prólogo y las escenas grandes de la
// historia principal. Javier pidió (12 de octubre de 2026) que todo lo de las diosas suene «armonioso y celestial».
//
//   node scripts/granja-v3/voces-cine.mjs reparto   → busca en la biblioteca de ElevenLabs voces etéreas en español para
//                                                    Celia, Aura y Lara (y deja el narrador de la granja); queda en
//                                                    voces-guion/cine-reparto.json (se puede corregir a mano)
//   SECO=1 node scripts/granja-v3/voces-cine.mjs     → cuenta lo que falta y lo que cuesta, no gasta nada
//   node scripts/granja-v3/voces-cine.mjs            → genera lo que falte
//
// Las diosas pasan por un procesado celestial suave (eco corto, un coro que casi no se nota y algo de brillo arriba); el
// narrador, por una sala cálida. Cada audio va a public/audio/cine/<id>-<huella>.ogg y se declara con su duración en
// public/granja/cine/medios.json (el cine mide así cada toma sin cargar el audio). La huella sale del modelo, la voz,
// el procesado y cómo se dice: si algo cambia, se rehace solo esa línea.
// Necesita ELEVENLABS_API_KEY en el entorno (nunca en archivos), ffmpeg y la red abierta a api.elevenlabs.io.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compilarModulo } from './modulos-prueba.mjs';
import { FILTRO_CELESTIAL } from './filtro-celestial.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PUB = join(RAIZ, 'public');
const DIR = join(PUB, 'audio', 'cine');
const MEDIOS = join(PUB, 'granja', 'cine', 'medios.json');
const REPARTO = join(RAIZ, 'voces-guion', 'cine-reparto.json');
const REPARTO_ASTRA = join(RAIZ, 'voces-guion', 'astra-reparto.json');
const CLAVE = process.env.ELEVENLABS_API_KEY;
const MODELO = process.env.MODELO ?? 'eleven_v4';
const AJUSTES = { stability: 0.45, similarity_boost: 0.8, style: 0.35 };
const DIVINAS = new Set(['celia', 'aura', 'lara']);
/** Cómo se procesa cada quien (ffmpeg). */
const FILTRO = {
  celestial: FILTRO_CELESTIAL, // filtro-celestial.mjs
  narrador: 'highpass=f=70,aecho=0.8:0.6:45|90:0.16|0.08',
  normal: 'highpass=f=70',
};
const procesado = (quien) => (DIVINAS.has(quien) ? 'celestial' : quien === 'narrador' ? 'narrador' : 'normal');

async function pedir(ruta, op = {}, intentos = 4) {
  for (let i = 0; ; i++) {
    const r = await fetch(`https://api.elevenlabs.io/v1${ruta}`, { ...op, headers: { 'xi-api-key': CLAVE, ...(op.headers ?? {}) } });
    if (r.ok) return r;
    const t = await r.text();
    if (i >= intentos || (r.status < 500 && r.status !== 429)) throw new Error(`${r.status} ${t.slice(0, 200)}`);
    await new Promise((ok) => setTimeout(ok, 2000 * (i + 1)));
  }
}

const { LINEAS_CINE } = await import(await compilarModulo(new URL('../../src/granja-v3/cine-lineas.ts', import.meta.url)));

// ------------------------------------------------------------------ el reparto

/** Lo que se busca para cada diosa en la biblioteca (voces latinas de mujer, suaves y luminosas). */
const BUSCAR = {
  celia: ['soft gentle young warm', 'ethereal sweet', 'calm soothing'],
  aura: ['warm radiant bright', 'passionate warm', 'expressive warm'],
  lara: ['calm serene mature', 'soothing deep motherly', 'storyteller calm'],
};
async function reparto() {
  if (!CLAVE) throw new Error('Falta ELEVENLABS_API_KEY (se agrega en la configuración del entorno).');
  const astra = existsSync(REPARTO_ASTRA) ? JSON.parse(readFileSync(REPARTO_ASTRA, 'utf8')) : {};
  const salida = existsSync(REPARTO) ? JSON.parse(readFileSync(REPARTO, 'utf8')) : {};
  if (!salida.narrador && astra.narrador) salida.narrador = astra.narrador;
  const usadas = new Set(Object.values(salida).map((v) => v.voz));
  for (const [quien, busquedas] of Object.entries(BUSCAR)) {
    if (salida[quien]) continue;
    let elegida = null;
    for (const q of busquedas) {
      const params = new URLSearchParams({ page_size: '30', language: 'es', gender: 'female', search: q, sort: 'usage_character_count_1y' });
      const d = await (await pedir(`/shared-voices?${params}`)).json();
      elegida = (d.voices ?? []).find((v) => !usadas.has(v.voice_id) && /latin|mexican|colombian|argentin|neutral|standard/i.test(`${v.accent} ${v.descriptive} ${v.description ?? ''}`));
      if (elegida) break;
    }
    if (!elegida && astra[quien]) { salida[quien] = { ...astra[quien], motivo: 'la de la granja' }; continue; }
    if (!elegida) throw new Error(`No encontré voz para ${quien}`);
    usadas.add(elegida.voice_id);
    salida[quien] = { voz: elegida.voice_id, nombre: elegida.name, acento: elegida.accent, motivo: 'celestial' };
    console.log(`${quien}: ${elegida.name}`);
  }
  writeFileSync(REPARTO, JSON.stringify(salida, null, 1) + '\n');
  console.log(`reparto: ${Object.keys(salida).length} voces en voces-guion/cine-reparto.json`);
}

// ------------------------------------------------------------------ las líneas

const decir = (l) => l.d || l.texto;
const huella = (l, voz) => createHash('sha1').update(`${MODELO}|${JSON.stringify(AJUSTES)}|${voz}|${FILTRO[procesado(l.quien)]}|${decir(l)}`).digest('hex').slice(0, 6);
const archivoDe = (l, voz) => `${l.id}-${huella(l, voz)}.ogg`;
const segundos = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());

async function generar() {
  const rep = existsSync(REPARTO) ? JSON.parse(readFileSync(REPARTO, 'utf8')) : {};
  const astra = existsSync(REPARTO_ASTRA) ? JSON.parse(readFileSync(REPARTO_ASTRA, 'utf8')) : {};
  let VOZ = {};
  if (CLAVE) {
    const sinTilde = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    const { voices } = await (await pedir('/voices')).json();
    VOZ = { el: voices.find((v) => sinTilde(v.name) === 'el')?.voice_id, ella: voices.find((v) => sinTilde(v.name) === 'ella')?.voice_id };
  }
  const voz = (q) => VOZ[q] ?? rep[q]?.voz ?? astra[q]?.voz;
  const falta = LINEAS_CINE.filter((l) => voz(l.quien) && !existsSync(join(DIR, archivoDe(l, voz(l.quien)))));
  const sinVoz = LINEAS_CINE.filter((l) => !voz(l.quien)).map((l) => l.id);
  const chars = falta.reduce((a, l) => a + decir(l).length, 0);
  console.log(`${LINEAS_CINE.length} líneas · faltan ${falta.length} (${chars} caracteres, ≈ ${Math.round(chars * 0.13)} créditos)${sinVoz.length ? ` · sin voz: ${sinVoz.join(', ')}` : ''}`);
  if (process.env.SECO) return;
  if (!CLAVE) throw new Error('Falta ELEVENLABS_API_KEY (se agrega en la configuración del entorno).');
  mkdirSync(DIR, { recursive: true });
  const tmp = join(RAIZ, 'modelos-crudos', '_voces_cine');
  mkdirSync(tmp, { recursive: true });
  for (const l of falta) {
    const r = await pedir(`/text-to-speech/${voz(l.quien)}?output_format=mp3_44100_128`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: decir(l), model_id: MODELO, voice_settings: AJUSTES, language_code: 'es' }),
    });
    const mp3 = join(tmp, `${l.id}.mp3`);
    writeFileSync(mp3, Buffer.from(await r.arrayBuffer()));
    // Sin silencios en las puntas, el procesado de quien habla, cola para que respire la reverberación y volumen parejo
    const af = `silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,${FILTRO[procesado(l.quien)]},apad=pad_dur=${DIVINAS.has(l.quien) ? 0.8 : 0.2},loudnorm=I=-17:TP=-2:LRA=11`;
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', mp3, '-af', af, '-ac', '1', '-ar', '48000', '-c:a', 'libopus', '-b:a', '40k', join(DIR, archivoDe(l, voz(l.quien)))]);
    unlinkSync(mp3);
    console.log(`  ✓ ${l.id} (${l.quien})`);
  }
  armarMedios(voz);
}

function armarMedios(voz) {
  const voces = {}, usados = new Set();
  for (const l of LINEAS_CINE) {
    if (!voz(l.quien)) continue;
    const a = archivoDe(l, voz(l.quien)), f = join(DIR, a);
    if (!existsSync(f)) continue;
    usados.add(a);
    voces[l.id] = { archivo: `./audio/cine/${a}`, seg: Math.round(segundos(f) * 100) / 100 };
  }
  let borrados = 0;
  if (existsSync(DIR)) for (const f of readdirSync(DIR)) if (f.endsWith('.ogg') && !usados.has(f)) (unlinkSync(join(DIR, f)), borrados++);
  mkdirSync(dirname(MEDIOS), { recursive: true });
  writeFileSync(MEDIOS, JSON.stringify({ version: 1, voces }, null, 2) + '\n');
  console.log(`medios.json: ${Object.keys(voces).length} voces${borrados ? ` (${borrados} audios viejos borrados)` : ''}`);
}

if (process.argv[2] === 'reparto') await reparto();
else await generar();
