// Genera con ElevenLabs las voces de los recuerdos de Cien Puertas (y el final) con las voces clonadas de la pareja.
// Necesita la variable ELEVENLABS_API_KEY (en la configuración del entorno, nunca en el código) y dos voces en la
// cuenta llamadas «Ella» y «Él» (o sus códigos en VOZ_ELLA y VOZ_EL). Guarda public/voces/<código>.mp3 y arma la lista.
// Uso:
//   SECO=1 node scripts/voces-ia.mjs      → solo cuenta frases y caracteres (no gasta nada)
//   node scripts/voces-ia.mjs             → genera lo que falte (FORZAR=1 rehace todo; SOLO=r005 filtra por código)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const RAIZ = join(import.meta.dirname, '..');
const DIR = join(RAIZ, 'public', 'voces');
const API = 'https://api.elevenlabs.io/v1';
const CLAVE = process.env.ELEVENLABS_API_KEY;
const MODELO = process.env.MODELO ?? 'eleven_multilingual_v2';
const AJUSTES = { stability: 0.42, similarity_boost: 0.85, style: 0.35, use_speaker_boost: true };

/** Las frases, con su código y quién las dice (se leen de historia.ts, igual que el juego). */
function frases() {
  const s = readFileSync(join(RAIZ, 'src', 'puertas', 'historia.ts'), 'utf8');
  const bloque = s.slice(s.indexOf('export const RECUERDOS'), s.indexOf('/** Lo que dice el narrador al empezar cada puerta'));
  const lineas = (t) => [...t.matchAll(/\['(el|ella)', '((?:[^'\\]|\\.)*)'\]/g)].map((m) => [m[1], m[2].replace(/\\'/g, "'")]);
  const out = [];
  for (const m of bloque.matchAll(/puerta: (\d+),[\s\S]*?dialogo: \[([\s\S]*?)\n {4}\],/g)) {
    const dialogo = lineas(m[2]);
    dialogo.forEach(([quien, texto], i) =>
      out.push({ id: `r${m[1].padStart(3, '0')}-${String(i + 1).padStart(2, '0')}`, quien, texto, antes: dialogo[i - 1]?.[1], despues: dialogo[i + 1]?.[1] }),
    );
  }
  const fin = s.slice(s.indexOf('export const FINAL_DE'));
  for (const quien of ['ella', 'el']) {
    const m = fin.match(new RegExp(`${quien}: \\[([\\s\\S]*?)\\]`));
    [...m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].forEach((x, i) => out.push({ id: `final-${quien}-${i + 1}`, quien, texto: x[1] }));
  }
  return out;
}

async function pedir(ruta, op = {}) {
  for (let intento = 0; ; intento++) {
    const r = await fetch(`${API}${ruta}`, { ...op, headers: { 'xi-api-key': CLAVE, ...(op.headers ?? {}) } });
    if (r.ok) return r;
    if ((r.status === 429 || r.status >= 500) && intento < 4) {
      await new Promise((ok) => setTimeout(ok, 2000 * 2 ** intento));
      continue;
    }
    throw new Error(`ElevenLabs respondió ${r.status}: ${(await r.text()).slice(0, 300)}`);
  }
}

const todas = frases().filter((f) => !process.env.SOLO || f.id.startsWith(process.env.SOLO));
const cuenta = (q) => todas.filter((f) => f.quien === q);
console.log(`${todas.length} frases · Ella ${cuenta('ella').length} · Él ${cuenta('el').length} · ${todas.reduce((a, f) => a + f.texto.length, 0)} caracteres`);
if (process.env.SECO) process.exit(0);
if (!CLAVE) {
  console.error('Falta ELEVENLABS_API_KEY (se agrega en la configuración del entorno).');
  process.exit(1);
}

const sinTilde = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const { voices } = await (await pedir('/voices')).json();
const buscar = (nombre, env) => process.env[env] ?? voices.find((v) => sinTilde(v.name) === nombre)?.voice_id;
const VOZ = { ella: buscar('ella', 'VOZ_ELLA'), el: buscar('el', 'VOZ_EL') };
for (const [q, id] of Object.entries(VOZ)) if (!id) throw new Error(`No encontré la voz de ${q === 'el' ? 'Él' : 'Ella'} en la cuenta (voces: ${voices.map((v) => v.name).join(', ')})`);

mkdirSync(DIR, { recursive: true });
let hechas = 0;
for (const f of todas) {
  const archivo = join(DIR, `${f.id}.mp3`);
  if (existsSync(archivo) && !process.env.FORZAR) continue;
  const cuerpo = { text: f.texto, model_id: MODELO, voice_settings: AJUSTES, ...(f.antes ? { previous_text: f.antes } : {}), ...(f.despues ? { next_text: f.despues } : {}) };
  const r = await pedir(`/text-to-speech/${VOZ[f.quien]}?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify(cuerpo),
  });
  writeFileSync(archivo, Buffer.from(await r.arrayBuffer()));
  hechas++;
  console.log(`${f.id} (${f.quien}) ${f.texto.slice(0, 60)}`);
}
console.log(`${hechas} audios nuevos`);
execFileSync('node', [join(RAIZ, 'scripts', 'voces.mjs')], { stdio: 'inherit' });
