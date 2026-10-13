// Las voces de la granja (Astra): cada personaje con su voz y cada línea del catálogo de producción con su audio.
//
//   node scripts/granja-v3/voces-astra.mjs reparto   → elige una voz de la biblioteca de ElevenLabs para cada personaje
//                                                     (español latino, por sexo y edad; las figuras y el narrador, a
//                                                     mano) y la prueba; queda en voces-guion/astra-reparto.json
//   SECO=1 node scripts/granja-v3/voces-astra.mjs     → cuenta lo que falta y lo que cuesta, no gasta nada
//   node scripts/granja-v3/voces-astra.mjs           → genera lo que falte (SOLO=<escena o prefijo>, LIMITE=n)
//   node scripts/granja-v3/voces-astra.mjs celestial → pasa al sonido celestial los audios de las diosas que ya existían
//
// Él y Ella usan sus voces clonadas («EL» y «ELLA»). Las líneas «(En señas)» no llevan voz (Maia habla en señas).
// Cada audio va a public/audio/astra/<id>-<huella>.ogg (Opus mono 24 kb/s, sin silencios en las puntas) y se declara en
// public/granja/astra/medios.json con la huella del texto: si el texto cambia, el juego no lo reproduce y aquí se rehace.
// Necesita ELEVENLABS_API_KEY en el entorno (nunca en archivos), ffmpeg y la red abierta a api.elevenlabs.io.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIOSAS, FILTRO_CELESTIAL } from './filtro-celestial.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PUB = join(RAIZ, 'public');
const DIR = join(PUB, 'audio', 'astra');
const MEDIOS = join(PUB, 'granja', 'astra', 'medios.json');
const REPARTO = join(RAIZ, 'voces-guion', 'astra-reparto.json');
const CLAVE = process.env.ELEVENLABS_API_KEY;
const MODELO = process.env.MODELO ?? 'eleven_v4';
const AJUSTES = { stability: 0.5, similarity_boost: 0.8 };
const PARALELO = Number(process.env.PARALELO) || 4;
const produccion = JSON.parse(readFileSync(join(PUB, 'granja', 'astra', 'produccion.json'), 'utf8'));

async function pedir(ruta, op = {}, intentos = 4) {
  for (let i = 0; ; i++) {
    const r = await fetch(`https://api.elevenlabs.io/v1${ruta}`, { ...op, headers: { 'xi-api-key': CLAVE, ...(op.headers ?? {}) } });
    if (r.ok) return r;
    const t = await r.text();
    if (i >= intentos || (r.status < 500 && r.status !== 429)) throw new Error(`${r.status} ${t.slice(0, 200)}`);
    await new Promise((ok) => setTimeout(ok, 2000 * (i + 1)));
  }
}

// ------------------------------------------------------------------ el reparto

/** Sexo de cada vecino: el del muñeco que lo viste (vecinos3d.ts, vecinos-astra.ts y la ropa de la vida de los pueblos). */
function sexos() {
  const s = {};
  const v3 = readFileSync(join(RAIZ, 'src/granja-v3/vecinos3d.ts'), 'utf8');
  for (const m of v3.matchAll(/^\s+(\w+): \{ c: '(el|ella)'/gm)) s[m[1]] = m[2];
  const va = readFileSync(join(RAIZ, 'src/granja-v3/vecinos-astra.ts'), 'utf8');
  for (const m of va.matchAll(/^\s+(\w+): \['(el|ella)'/gm)) s[m[1]] = m[2];
  for (const n of produccion.npc) if (n.ropa) s[n.id] = n.ropa[0];
  return s;
}
/** Edad que dice la biografía («Bastián, 48», «tiene ocho años», «murió con 63 años»). */
const NUMEROS = { ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, siete: 7, seis: 6, trece: 13 };
function edad(texto = '') {
  let m = texto.match(/^[^,.]{2,30}, (\d{1,3})\b/) || texto.match(/(?:murió|vivió)(?: con)? (\d{1,3}) años/) || texto.match(/tiene (\d{1,3}) años/);
  if (m) return Number(m[1]);
  m = texto.match(/tiene (\w+) años/);
  return m && NUMEROS[m[1]] ? NUMEROS[m[1]] : null;
}
const franja = (e) => (e == null ? 'middle_aged' : e < 14 ? 'nino' : e < 36 ? 'young' : e < 60 ? 'middle_aged' : 'old');

// Las figuras, el narrador y algunos que piden una voz muy particular (ids de la biblioteca de ElevenLabs)
const A_MANO = {
  narrador: { voz: 'SAGbayTufdvOWwIvhMH2', nombre: 'Josué Maya', motivo: 'Grave y sereno: cercano, sin anunciar emociones grandiosas' },
  fuatia: { voz: '2rigMbVWLdqtBSCahJFX', nombre: 'Tatiana Martin', motivo: 'Amable y precisa, con una reserva: sabia y calmada' },
  vaelthor: { voz: 'k8cFOyAg7B9qwBlDDNTC', nombre: 'Miguel', motivo: 'Profundo y cinematográfico' },
  nathgora: { voz: '5egO01tkUjEzu7xSSE8M', nombre: 'Carmelo', motivo: 'Maduro y misterioso' },
  conde: { voz: 'HMCmDsbKeaSZp5LMOYKR', nombre: 'Johnny', motivo: 'Burlón y rico, el Conde de Sangre y Ceniza' },
};
const ACENTOS = ['latin american', 'colombian', 'mexican', 'argentine', 'chilean', 'peruvian', 'venezuelan', 'cuban', 'ecuadorian', 'uruguayan', 'caribbean'];

async function piscina(gender, age, paginas = 5) {
  const out = [];
  for (let page = 0; page < paginas; page++) {
    const q = new URLSearchParams({ page_size: '100', page: String(page), language: 'es', sort: 'usage_character_count_1y', ...(gender ? { gender } : {}), ...(age ? { age } : {}) });
    const d = await (await pedir(`/shared-voices?${q}`)).json();
    out.push(...d.voices.filter((v) => ACENTOS.includes(v.accent) && ['high_quality', 'professional'].includes(v.category) && !(v.rate > 1)));
    if (!d.has_more) break;
  }
  return out;
}

async function probar(voz) {
  try {
    await pedir(`/text-to-speech/${voz}?output_format=mp3_22050_32`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hola.', model_id: MODELO, voice_settings: AJUSTES, language_code: 'es' }),
    }, 1);
    return true;
  } catch {
    return false;
  }
}

async function reparto() {
  const hablantes = [...new Set(produccion.lineas.map((l) => l.hablante))].filter((h) => h !== 'el' && h !== 'ella');
  const bios = Object.fromEntries(produccion.biografias.map((b) => [b.id, b]));
  const sx = sexos();
  // Las diosas y Celia: mujeres; los demás sin muñeco, según A_MANO o por defecto
  Object.assign(sx, { aura: 'ella', lara: 'ella', celia: 'ella', fuatia: 'ella', vaelthor: 'el', nathgora: 'el', conde: 'el', narrador: 'el' });
  const viejo = existsSync(REPARTO) ? JSON.parse(readFileSync(REPARTO, 'utf8')) : {};
  const usadas = new Set([...Object.values(A_MANO).map((a) => a.voz), ...Object.values(viejo).map((v) => v.voz)]);
  const pisc = {};
  const dame = async (g, f) => {
    const clave = g + '|' + f;
    if (!pisc[clave]) {
      if (f === 'nino') {
        const q = new URLSearchParams({ page_size: '100', language: 'es', use_cases: 'characters_animation', age: 'young' });
        const d = await (await pedir(`/shared-voices?${q}`)).json();
        pisc[clave] = d.voices.filter((v) => ACENTOS.includes(v.accent) && /niñ|child|kid|adorable|playful|cute|sweet|infantil|tierna|dulce/i.test(`${v.name} ${v.description ?? ''} ${v.descriptive ?? ''}`));
      } else pisc[clave] = await piscina(g === 'el' ? 'male' : 'female', f);
      console.log(`  piscina ${clave}: ${pisc[clave].length} voces`);
    }
    return pisc[clave];
  };
  const salida = {};
  for (const h of hablantes) {
    if (viejo[h]) { salida[h] = viejo[h]; continue; }
    if (A_MANO[h]) { salida[h] = { ...A_MANO[h], sexo: sx[h], edad: null }; continue; }
    const b = bios[h], e = edad(b?.pasado), g = sx[h] ?? 'ella';
    let f = franja(e);
    // Los de Verdia son almas: la edad con que murieron; los mayores suenan mayores
    let lista = await dame(g, f);
    if (f === 'nino' && !lista.length) lista = await dame(g, (f = 'young'));
    let elegida = null;
    for (const v of lista) {
      if (usadas.has(v.voice_id)) continue;
      if (await probar(v.voice_id)) { elegida = v; break; }
      usadas.add(v.voice_id);
    }
    // Si se acabaron las de su franja, una vecina (más joven o mayor) sin repetir
    if (!elegida) for (const f2 of ['middle_aged', 'young', 'old']) {
      for (const v of await dame(g, f2)) if (!usadas.has(v.voice_id) && (await probar(v.voice_id))) { elegida = v; break; }
      if (elegida) break;
    }
    if (!elegida) throw new Error(`Sin voz para ${h}`);
    usadas.add(elegida.voice_id);
    salida[h] = { voz: elegida.voice_id, nombre: elegida.name, sexo: g, edad: e, franja: f, acento: elegida.accent, motivo: (elegida.descriptive || elegida.use_case || '').toString() };
    console.log(`  ${h} (${g}, ${e ?? '?'}) → ${elegida.name} · ${elegida.accent}`);
  }
  writeFileSync(REPARTO, JSON.stringify(salida, null, 1) + '\n');
  console.log(`reparto: ${Object.keys(salida).length} personajes con voz propia (más Él y Ella)`);
}

// ------------------------------------------------------------------ las líneas

const enSenas = (l) => /^\(En señas\)/.test(l.texto);
const decir = (l) => l.texto.replace(/^\([^)]*\)\s*/, '');
// Las diosas llevan el sonido celestial de las películas (filtro-celestial.mjs); entra en la huella para rehacerlas
const celestial = (l) => DIOSAS.has(l.hablante);
const huellaCruda = (l, voz) => createHash('sha1').update(`${MODELO}|${JSON.stringify(AJUSTES)}|${voz}|${decir(l)}`).digest('hex').slice(0, 5);
const huellaAudio = (l, voz) => (celestial(l) ? createHash('sha1').update(`${huellaCruda(l, voz)}|${FILTRO_CELESTIAL}`).digest('hex').slice(0, 5) : huellaCruda(l, voz));
const filtroDe = (l) => `silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,${celestial(l) ? `${FILTRO_CELESTIAL},apad=pad_dur=0.6` : 'apad=pad_dur=0.1'},loudnorm=I=-18:TP=-2:LRA=11`;
const archivoDe = (l, voz) => `${l.id}-${huellaAudio(l, voz)}.ogg`;

async function generar() {
  if (!existsSync(REPARTO)) throw new Error('Primero: node scripts/granja-v3/voces-astra.mjs reparto');
  const rep = JSON.parse(readFileSync(REPARTO, 'utf8'));
  let VOZ = {};
  if (CLAVE) {
    const sinTilde = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    const { voices } = await (await pedir('/voices')).json();
    VOZ = { el: voices.find((v) => sinTilde(v.name) === 'el')?.voice_id, ella: voices.find((v) => sinTilde(v.name) === 'ella')?.voice_id };
  }
  const voz = (h) => VOZ[h] ?? rep[h]?.voz;
  const conVoz = produccion.lineas.filter((l) => !enSenas(l) && (rep[l.hablante] || l.hablante === 'el' || l.hablante === 'ella'));
  const falta = conVoz.filter((l) => (!process.env.SOLO || l.id.startsWith(process.env.SOLO)) && voz(l.hablante) && !existsSync(join(DIR, archivoDe(l, voz(l.hablante)))))
    .slice(0, Number(process.env.LIMITE) || Infinity);
  const sinVoz = produccion.lineas.filter((l) => !enSenas(l) && !voz(l.hablante)).length;
  console.log(`${conVoz.length} líneas con voz · faltan ${falta.length} (${falta.reduce((a, l) => a + decir(l).length, 0)} caracteres, ≈ ${Math.round(falta.reduce((a, l) => a + decir(l).length, 0) * 0.13)} créditos)${sinVoz ? ` · ${sinVoz} sin voz asignada` : ''}`);
  if (process.env.SECO) return;
  if (!CLAVE) throw new Error('Falta ELEVENLABS_API_KEY (se agrega en la configuración del entorno).');
  if (!VOZ.el || !VOZ.ella) throw new Error('No encontré las voces clonadas EL y ELLA en la cuenta');
  mkdirSync(DIR, { recursive: true });
  const tmp = join(RAIZ, 'modelos-crudos', '_voces_astra');
  mkdirSync(tmp, { recursive: true });
  let hechas = 0, errores = 0;
  const cola = [...falta];
  async function trabajador() {
    for (let l = cola.shift(); l; l = cola.shift()) {
      try {
        const r = await pedir(`/text-to-speech/${voz(l.hablante)}?output_format=mp3_44100_128`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: decir(l), model_id: MODELO, voice_settings: AJUSTES, language_code: 'es' }),
        });
        const mp3 = join(tmp, `${l.id}.mp3`);
        writeFileSync(mp3, Buffer.from(await r.arrayBuffer()));
        execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', mp3, '-af', filtroDe(l), '-ar', '48000', '-ac', '1', '-c:a', 'libopus', '-b:a', '24k', join(DIR, archivoDe(l, voz(l.hablante)))]);
        unlinkSync(mp3);
        if (++hechas % 50 === 0) console.log(`  ${hechas}/${falta.length}`);
      } catch (err) {
        errores++;
        console.error(`  ✗ ${l.id} (${l.hablante}): ${String(err).slice(0, 200)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: PARALELO }, trabajador));
  console.log(`listo: ${hechas} nuevas, ${errores} con error`);
  armarMedios(conVoz, voz);
}

/** medios.json: cada línea con audio y la huella de su texto; los audios que ya no se usan se borran. */
function armarMedios(conVoz, voz) {
  const medios = existsSync(MEDIOS) ? JSON.parse(readFileSync(MEDIOS, 'utf8')) : { version: 1, voces: {}, musica: {}, modelos: {} };
  const voces = {}, usados = new Set();
  for (const l of conVoz) {
    if (!voz(l.hablante)) continue;
    const a = archivoDe(l, voz(l.hablante));
    if (!existsSync(join(DIR, a))) continue;
    usados.add(a);
    voces[l.id] = { archivo: `./audio/astra/${a}`, huella_texto: l.huella_texto };
  }
  let borrados = 0;
  // Solo los audios de voz de esta carpeta (la música de la granja vive en audio/astra/musica/)
  if (existsSync(DIR)) for (const f of readdirSync(DIR)) if (f.endsWith('.ogg') && !usados.has(f)) (unlinkSync(join(DIR, f)), borrados++);
  medios.voces = voces;
  writeFileSync(MEDIOS, JSON.stringify(medios, null, 2) + '\n');
  console.log(`medios.json: ${Object.keys(voces).length} voces${borrados ? ` (${borrados} audios viejos borrados)` : ''}`);
}

/** Pasa al sonido celestial los audios de las diosas que ya existían con la misma voz (sin gastar créditos). */
async function celestialSinGastar() {
  const rep = JSON.parse(readFileSync(REPARTO, 'utf8'));
  let n = 0;
  for (const l of produccion.lineas) {
    const v = rep[l.hablante]?.voz;
    if (!celestial(l) || !v || enSenas(l)) continue;
    const viejo = join(DIR, `${l.id}-${huellaCruda(l, v)}.ogg`), nuevo = join(DIR, archivoDe(l, v));
    if (!existsSync(viejo) || existsSync(nuevo)) continue;
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', viejo, '-af', `${FILTRO_CELESTIAL},apad=pad_dur=0.6,loudnorm=I=-18:TP=-2:LRA=11`, '-ac', '1', '-ar', '48000', '-c:a', 'libopus', '-b:a', '24k', nuevo]);
    n++;
  }
  console.log(`celestial: ${n} audios de las diosas reprocesados`);
}

if (process.argv[2] === 'reparto') await reparto();
else if (process.argv[2] === 'celestial') await celestialSinGastar();
else await generar();
