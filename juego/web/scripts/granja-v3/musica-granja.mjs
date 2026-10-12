// La música de la granja (las 23 claves M01–M23 de docs/narrativa/06-produccion.md). Lo general (la granja, los pueblos,
// los reinos, la estación) se descarga de OpenGameArt con licencia CC0 (libre, sin pedir crédito; igual queda el
// crédito en docs/sistemas/musica.md); lo muy propio de las cinemáticas se compone con Eleven Music.
//
//   SECO=1 node scripts/granja-v3/musica-granja.mjs   → cuenta lo que falta y lo que cuesta, no gasta ni descarga
//   node scripts/granja-v3/musica-granja.mjs          → descarga y genera lo que falte (SOLO=M05)
//
// Cada pista queda en public/audio/astra/musica/<clave>-<huella>.ogg (Opus estéreo 64 kb/s, −16 LUFS) y se declara en
// public/granja/astra/medios.json → musica (la toca AudioAstra en bucle, bajita, y baja más cuando alguien habla).
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = join(RAIZ, 'public', 'audio', 'astra', 'musica');
const MEDIOS = join(RAIZ, 'public', 'granja', 'astra', 'medios.json');
const CRUDO = join(RAIZ, 'modelos-crudos', '_musica_granja');
const CLAVE = process.env.ELEVENLABS_API_KEY;
const OGA = 'https://opengameart.org/sites/default/files/';
const P = 'gentle instrumental for a cozy plush-toy farming life-sim game, warm and soft, no vocals';

/** clave → descargada {url, titulo, autor, pagina, zip?} o compuesta {prompt, seg} */
export const MUSICA_GRANJA = {
  M01: { titulo: 'Town Theme RPG', autor: 'cynicmusic', pagina: 'town-theme-rpg', url: OGA + 'TownTheme.mp3' },
  M02: { titulo: 'Medieval: The Old Tower Inn (loop)', autor: 'RandomMind', pagina: 'medieval-the-old-tower-inn', url: OGA + 'Loop_The_Old_Tower_Inn.wav' },
  M03: { titulo: 'Etirwer (looped)', autor: 'Kistol', pagina: 'etirwer', url: OGA + 'Etirwer%20%28Looped%29_0.ogg' },
  M04: { titulo: 'Forest', autor: 'symphony', pagina: 'forest-3', url: OGA + 'cubedcanada%2Bforest.mp3' },
  M05: { titulo: 'Crystal Cave (song18)', autor: 'cynicmusic', pagina: 'crystal-cave-song18', url: OGA + 'song18_0.mp3' },
  M06: { titulo: 'Hot Springs Town', autor: 'Kistol', pagina: 'hot-springs-town', url: OGA + 'hot_spring_town_1.ogg' },
  M07: { titulo: 'Snow Theme', autor: 'CleytonKauffman', pagina: 'snow-theme', url: OGA + 'snow_theme_1.zip', zip: true },
  M08: { titulo: 'Waiting II', autor: 'Kistol', pagina: 'waiting-ii', url: OGA + 'Waiting%20II_0.ogg' },
  M09: { titulo: 'At Home - Orchestral', autor: 'Wolfgang_', pagina: 'at-home-orchestral', url: OGA + 'cinematic-calm.wav' },
  M10: { seg: 120, prompt: `Cinematic ${P}: a seed motif on felted piano and a veil motif on soft strings, one brief bell, careful and tender before a subtle tension rises, 76 bpm` },
  M11: { seg: 180, prompt: 'Cinematic instrumental, no vocals: begins as a restrained orchestral build, transitions into heavy electronic metal with driving drums and distorted guitars, then descends back to a lonely solo piano and fades into silence for a confinement scene' },
  M12: { titulo: 'Heaven Theme Loop', autor: 'beardalaxy', pagina: 'heaven-theme-loop', url: OGA + 'heaven_in_game.ogg' },
  M13: { titulo: 'First Light Particles', autor: 'Yoiyami', pagina: 'first-light-particles-%E2%80%93-cc0-atmospheric-pianoambient-track', url: OGA + 'first_light_particles_0.wav' },
  M14: { seg: 180, prompt: `Uneasy but understandable ${P}: a perfect mechanical ostinato on celesta and pizzicato strings that slowly loses one note per cycle, tension without sudden jumps, 72 bpm` },
  M15: { titulo: 'Mysterious Ambience (song21)', autor: 'cynicmusic', pagina: 'mysterious-ambience-song21', url: OGA + 'song21_0.mp3' },
  M16: { titulo: 'Another August', autor: 'cynicmusic', pagina: 'another-august', url: OGA + '013_Another_August_0.mp3' },
  M17: { titulo: 'Negev Desert (loop)', autor: 'Dizzy Crow', pagina: 'desert-calmness-and-fighting-orchestral-141', url: OGA + 'Negev%20Desert%20Loop.wav' },
  M18: { titulo: 'Besai Crystal Gardens 2: Forbidden Pathway', autor: 'Tozan', pagina: 'besai-crystal-gardens-2-forbidden-pathway', url: OGA + 'Crystal2_0.ogg' },
  M19: { seg: 180, prompt: 'Cinematic instrumental, no vocals: complete melodic motifs set against a rhythmic void, a restrained electronic metal undertone, wide airy space at the edge of the universe, ends in a long quiet silence' },
  M20: { seg: 110, prompt: `Finale ${P}: felted piano, wood and soft strings, a second instrumental voice answering, one gentle pause, satisfied and open ending, 76 bpm` },
  M21: { seg: 150, prompt: `Treaty scene ${P}: three gentle motifs (woodwind, strings, harp) alternating without any one dominating, dignified but not a coronation fanfare, 78 bpm` },
  M22: { seg: 140, prompt: `${P}: a rigid repeated ostinato that gradually opens into wooden instruments and breathing pads, warm resolution, 92 bpm` },
  M23: { titulo: 'Somnium', autor: 'Adiutorium', pagina: 'somnium', url: OGA + 'somnium.mp3' },
};

const huella = (m) => createHash('sha1').update(JSON.stringify(m)).digest('hex').slice(0, 5);
const archivoDe = (id, m) => `${id}-${huella(m)}.ogg`;
const convertir = (de, a) => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', de, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-ac', '2', '-c:a', 'libopus', '-b:a', '64k', a]);

async function hacer(id, m) {
  mkdirSync(CRUDO, { recursive: true });
  let crudo;
  if (m.url) {
    const ext = m.url.split('.').pop();
    crudo = join(CRUDO, `${id}.${ext}`);
    execFileSync('curl', ['-s', '-L', '-m', '300', '-A', 'Mozilla/5.0', '-o', crudo, m.url]);
    if (m.zip) {
      const dir = join(CRUDO, id);
      mkdirSync(dir, { recursive: true });
      execFileSync('unzip', ['-o', '-q', crudo, '-d', dir]);
      const audios = execFileSync('find', [dir, '-type', 'f', '-regex', '.*\\.\\(ogg\\|mp3\\|wav\\|flac\\)']).toString().trim().split('\n').filter(Boolean);
      if (!audios.length) throw new Error('el zip no trae audio');
      crudo = audios.sort((a, b) => (/\.ogg$/.test(b) ? 1 : 0) - (/\.ogg$/.test(a) ? 1 : 0))[0];
    }
  } else {
    if (!CLAVE) throw new Error('Falta ELEVENLABS_API_KEY');
    const r = await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', {
      method: 'POST', headers: { 'xi-api-key': CLAVE, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_id: 'music_v2_5', prompt: m.prompt, music_length_ms: m.seg * 1000, force_instrumental: true }),
    });
    if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`);
    crudo = join(CRUDO, `${id}.mp3`);
    writeFileSync(crudo, Buffer.from(await r.arrayBuffer()));
  }
  mkdirSync(DIR, { recursive: true });
  convertir(crudo, join(DIR, archivoDe(id, m)));
}

const todas = Object.entries(MUSICA_GRANJA).filter(([id]) => !process.env.SOLO || id === process.env.SOLO);
const falta = todas.filter(([id, m]) => !existsSync(join(DIR, archivoDe(id, m))));
const comp = falta.filter(([, m]) => m.prompt);
console.log(`Música de la granja: ${todas.length} pistas, faltan ${falta.length} (${falta.length - comp.length} para descargar, ${comp.length} para componer ≈ ${Math.round(comp.reduce((a, [, m]) => a + m.seg, 0) / 60 * 720)} créditos)`);
if (!process.env.SECO) {
  let errores = 0;
  for (const [id, m] of falta) {
    try {
      await hacer(id, m);
      console.log(`  ✓ ${id} ${m.titulo ?? '(compuesta)'}`);
    } catch (e) {
      errores++;
      console.error(`  ✗ ${id}: ${String(e).slice(0, 200)}`);
    }
  }
  // Declarar en medios.json lo que haya y borrar las pistas viejas
  const medios = JSON.parse(readFileSync(MEDIOS, 'utf8'));
  const usados = new Set();
  medios.musica = {};
  for (const [id, m] of Object.entries(MUSICA_GRANJA)) {
    const a = archivoDe(id, m);
    if (!existsSync(join(DIR, a))) continue;
    usados.add(a);
    medios.musica[id] = `./audio/astra/musica/${a}`;
  }
  if (existsSync(DIR)) for (const f of readdirSync(DIR)) if (!usados.has(f)) unlinkSync(join(DIR, f));
  writeFileSync(MEDIOS, JSON.stringify(medios, null, 2) + '\n');
  console.log(`listo: ${Object.keys(medios.musica).length} pistas declaradas, ${errores} con error`);
}
