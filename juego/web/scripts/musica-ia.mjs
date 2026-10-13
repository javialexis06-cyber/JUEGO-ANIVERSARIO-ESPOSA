// La música y los efectos de sonido con ElevenLabs (docs/sistemas/musica.md), desde musica-guion/guion.mjs.
//
//   SECO=1 node scripts/musica-ia.mjs   → cuenta lo que falta (segundos y créditos aproximados), no gasta nada
//   node scripts/musica-ia.mjs          → genera lo que falte: SOLO=casa (un juego), SOLO=efectos, SOLO=casa-dia (una pista)
//
// Salida: public/musica/<id>-<huella>.ogg (las de la pareja en public/musica/pareja/) y public/sfx/<nombre>-<huella>.ogg,
// cada carpeta con su lista.json (código → [archivo, segundos]). La huella sale del texto del guion: si se cambia, se
// rehace solo esa. Las tomas crudas quedan en modelos-crudos/_musica/ (no se suben) por si se quiere escoger otra.
// En las canciones se generan varias tomas y se queda la que mejor se le entiende la letra (se transcribe con Scribe).
// Necesita ELEVENLABS_API_KEY, ffmpeg y la red abierta a api.elevenlabs.io.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { EFECTOS, PISTAS } from '../musica-guion/guion.mjs';

const RAIZ = join(import.meta.dirname, '..');
const DIR = join(RAIZ, 'public', 'musica');
const DIR_PAREJA = join(DIR, 'pareja');
const DIR_SFX = join(RAIZ, 'public', 'sfx');
const CRUDO = join(RAIZ, 'modelos-crudos', '_musica');
const API = 'https://api.elevenlabs.io/v1';
const CLAVE = process.env.ELEVENLABS_API_KEY;
const MODELO = 'music_v2_5';
const PARALELO = Number(process.env.PARALELO) || 3;
const CREDITOS_MIN = 800; // medido el 11 de octubre de 2026
const SOLO = process.env.SOLO;

const huella = (x) => createHash('sha1').update(JSON.stringify(x)).digest('hex').slice(0, 5);
const archivoPista = (p) => `${p.id}-${huella([MODELO, p.prompt ?? p.partes, p.estilos, p.seg])}.ogg`;
const dirPista = (p) => (p.pareja ? DIR_PAREJA : DIR);
const archivoEfecto = (n, [seg, txt]) => `${n}-${huella([seg, txt])}.ogg`;

/** El plan por partes de una canción (Music v2.5: «chunks» con la letra y sus estilos). */
function plan(p) {
  return {
    chunks: p.partes.map((parte, k) => ({
      text: `[${parte.nombre}]\n${parte.letra}`,
      duration_ms: parte.seg * 1000,
      positive_styles: k === 0 ? [...p.estilos, ...parte.estilos] : parte.estilos.length ? [...parte.estilos, ...p.estilos.slice(0, 2)] : p.estilos.slice(0, 4),
      ...(k === 0 ? { negative_styles: ['English lyrics', 'out of tune', 'muffled vocals'] } : {}),
    })),
  };
}
/** La letra de verdad (sin acotaciones) para comparar con lo que se oye. */
const letraDe = (p) => p.partes.map((x) => x.letra.replace(/\{[^}]*\}/g, '')).join(' ');
const palabras = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().match(/[a-zñ]+/g) ?? [];
/** Qué tanto de la letra se le entiende a la toma (0 a 1): palabras de la letra que aparecen en la transcripción. */
function parecido(letra, oido) {
  const bolsa = new Map();
  for (const w of palabras(oido)) bolsa.set(w, (bolsa.get(w) ?? 0) + 1);
  const ws = palabras(letra).filter((w) => w.length > 2);
  let ok = 0;
  for (const w of ws) if ((bolsa.get(w) ?? 0) > 0) (ok++, bolsa.set(w, bolsa.get(w) - 1));
  return ws.length ? ok / ws.length : 0;
}

async function pedir(ruta, op = {}) {
  for (let intento = 0; ; intento++) {
    const r = await fetch(`${API}${ruta}`, { ...op, headers: { 'xi-api-key': CLAVE, ...(op.headers ?? {}) } });
    if (r.ok) return r;
    if ((r.status === 429 || r.status >= 500) && intento < 5) {
      await new Promise((ok) => setTimeout(ok, 3000 * 2 ** intento));
      continue;
    }
    throw new Error(`ElevenLabs respondió ${r.status}: ${(await r.text()).slice(0, 300)}`);
  }
}

const segundos = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());
/** Volumen medio (dB): para descartar tomas mudas. */
function volumenMedio(f) {
  const r = execFileSync('bash', ['-c', `ffmpeg -hide_banner -nostats -i "${f}" -af volumedetect -f null - 2>&1 | grep mean_volume || true`]).toString();
  return Number(r.match(/mean_volume: (-?[\d.]+)/)?.[1] ?? -99);
}

/** A opus con el volumen parejo (las pistas a −16 LUFS, los efectos a −18): estéreo 64 kb/s la música, mono 48 los efectos. */
function convertir(de, a, tipo) {
  const filtro = tipo === 'efecto' ? 'loudnorm=I=-18:TP=-1.5:LRA=11' : 'loudnorm=I=-16:TP=-1.5:LRA=11';
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', de, '-af', `${filtro},aresample=48000`, ...(tipo === 'efecto' ? ['-ac', '1', '-b:a', '48k'] : ['-ac', '2', '-b:a', '64k']), '-c:a', 'libopus', a]);
}

async function transcribir(f) {
  const fd = new FormData();
  fd.append('model_id', 'scribe_v1');
  fd.append('language_code', 'spa');
  fd.append('file', new Blob([readFileSync(f)]), 'toma.mp3');
  const r = await pedir('/speech-to-text', { method: 'POST', body: fd });
  return (await r.json()).text ?? '';
}

async function hacerPista(p) {
  const tomas = p.tomas ?? 1;
  const cuerpo = p.partes ? { model_id: MODELO, composition_plan: plan(p) } : { model_id: MODELO, prompt: p.prompt, music_length_ms: p.seg * 1000, force_instrumental: true };
  let mejor = null;
  for (let t = 1; t <= tomas; t++) {
    const crudo = join(CRUDO, `${p.id}-toma${t}.mp3`);
    const r = await pedir('/music?output_format=mp3_44100_192', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
    writeFileSync(crudo, Buffer.from(await r.arrayBuffer()));
    const seg = segundos(crudo);
    const vol = volumenMedio(crudo);
    // (los remates cortos a veces salen un poco más cortos de lo pedido: con 2 s alcanza)
    let nota = seg >= (p.seg <= 8 ? Math.min(2, p.seg) : p.seg * 0.8) && vol > -40 ? 1 : 0;
    let detalle = `${seg.toFixed(1)} s, ${vol} dB`;
    if (nota && p.partes) {
      nota = parecido(letraDe(p), await transcribir(crudo));
      detalle += `, letra ${(nota * 100).toFixed(0)} %`;
    }
    console.log(`  ${p.id} toma ${t}: ${detalle}`);
    if (!mejor || nota > mejor.nota) mejor = { crudo, nota };
  }
  if (!mejor || mejor.nota === 0) throw new Error(`ninguna toma sirvió para ${p.id}`);
  convertir(mejor.crudo, join(dirPista(p), archivoPista(p)), 'musica');
}

async function hacerEfecto(nombre, def) {
  const [seg, txt] = def;
  const r = await pedir('/sound-generation?output_format=mp3_44100_128', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: txt, duration_seconds: seg, prompt_influence: 0.6 }),
  });
  const crudo = join(CRUDO, `sfx-${nombre}.mp3`);
  writeFileSync(crudo, Buffer.from(await r.arrayBuffer()));
  convertir(crudo, join(DIR_SFX, archivoEfecto(nombre, def)), 'efecto');
}

/** lista.json de una carpeta con lo que tiene audio; borra lo que ya no está en el guion. */
function armarLista(dir, entradas) {
  mkdirSync(dir, { recursive: true });
  const vieja = existsSync(join(dir, 'lista.json')) ? JSON.parse(readFileSync(join(dir, 'lista.json'), 'utf8')) : {};
  const lista = {};
  const usados = new Set(['lista.json', 'pareja']);
  for (const [id, archivo] of entradas) {
    if (!existsSync(join(dir, archivo))) continue;
    usados.add(archivo);
    lista[id] = [archivo, vieja[id]?.[0] === archivo ? vieja[id][1] : Math.round(segundos(join(dir, archivo)) * 100) / 100];
  }
  // Solo archivos sueltos: las subcarpetas (public/sfx/granja/, de efectos-granja.mjs) son de otros scripts
  for (const f of readdirSync(dir)) if (!usados.has(f) && statSync(join(dir, f)).isFile()) unlinkSync(join(dir, f));
  writeFileSync(join(dir, 'lista.json'), JSON.stringify(lista, null, 0).replace(/\],"/g, '],\n"') + '\n');
  return Object.keys(lista).length;
}

// ---------------------------------------------------------------------------------------------------------------
for (const d of [DIR, DIR_PAREJA, DIR_SFX, CRUDO]) mkdirSync(d, { recursive: true });
const pistas = PISTAS.filter((p) => !SOLO || p.juego === SOLO || p.id === SOLO);
const efectos = Object.entries(EFECTOS).filter(([n]) => !SOLO || SOLO === 'efectos' || SOLO === n);
const faltan = pistas.filter((p) => !existsSync(join(dirPista(p), archivoPista(p))));
const faltanEf = SOLO && SOLO !== 'efectos' && !EFECTOS[SOLO] ? [] : efectos.filter(([n, d]) => !existsSync(join(DIR_SFX, archivoEfecto(n, d))));
const segMusica = faltan.reduce((a, p) => a + p.seg * (p.tomas ?? 1), 0);
const segEf = faltanEf.reduce((a, [, [s]]) => a + s, 0);
console.log(`Música: ${pistas.length} pistas, faltan ${faltan.length} (${(segMusica / 60).toFixed(1)} min con tomas ≈ ${Math.round((segMusica / 60) * CREDITOS_MIN)} créditos)`);
console.log(`Efectos: ${efectos.length}, faltan ${faltanEf.length} (${segEf.toFixed(1)} s ≈ ${Math.round(segEf * 40)} créditos)`);
if (!process.env.SECO) {
  if (!CLAVE) throw new Error('Falta ELEVENLABS_API_KEY (se agrega en la configuración del entorno).');
  const trabajos = [...faltanEf.map(([n, d]) => [`efecto ${n}`, () => hacerEfecto(n, d)]), ...faltan.map((p) => [p.id, () => hacerPista(p)])];
  let hechos = 0;
  let errores = 0;
  const cola = [...trabajos];
  await Promise.all(
    Array.from({ length: PARALELO }, async () => {
      for (let t = cola.shift(); t; t = cola.shift()) {
        try {
          await t[1]();
          hechos++;
          console.log(`✓ ${t[0]} (${hechos}/${trabajos.length})`);
        } catch (e) {
          errores++;
          console.error(`✗ ${t[0]}: ${String(e).slice(0, 240)}`);
        }
      }
    }),
  );
  console.log(`listo: ${hechos} hechos, ${errores} con error`);
}
const nNeutras = armarLista(DIR, PISTAS.filter((p) => !p.pareja).map((p) => [p.id, archivoPista(p)]));
const nPareja = armarLista(DIR_PAREJA, PISTAS.filter((p) => p.pareja).map((p) => [p.id, archivoPista(p)]));
const nEf = armarLista(DIR_SFX, Object.entries(EFECTOS).map(([n, d]) => [n, archivoEfecto(n, d)]));
console.log(`listas: ${nNeutras} pistas para todos, ${nPareja} de la pareja, ${nEf} efectos`);
