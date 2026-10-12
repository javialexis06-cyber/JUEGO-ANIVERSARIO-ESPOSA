// Los efectos de sonido de la granja, hechos con ElevenLabs (Sound Effects): las herramientas, los cuidados, cada
// especie, las monedas, las puertas, las rutas y los ambientes (pájaros de día, grillos de noche, lluvia, mar).
//
//   SECO=1 node scripts/granja-v3/efectos-granja.mjs   → cuenta lo que falta y lo que cuesta (≈ 40 créditos por segundo)
//   node scripts/granja-v3/efectos-granja.mjs          → genera lo que falte (SOLO=<nombre>)
//
// Van a public/sfx/granja/<nombre>-<huella>.ogg con su lista.json (nombre → [archivo, segundos]); los toca
// src/granja-v3/sonidos-granja.ts. La huella sale de la descripción: si se cambia, se rehace ese efecto solo.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = join(RAIZ, 'public', 'sfx', 'granja');
const CLAVE = process.env.ELEVENLABS_API_KEY;
const P = 'cozy farming life-sim video game, soft and cute, clean, no music';

/** nombre → [segundos, descripción, bucle] */
export const EFECTOS_GRANJA = {
  // Herramientas y trabajo
  labrar: [0.9, `Garden hoe digging into soft moist soil, one stroke, ${P}`],
  regar: [1.4, `Watering can pouring a gentle shower of water onto soil, ${P}`],
  plantar: [0.8, `Planting seeds, soft pat of hands on soil, ${P}`],
  recoger: [0.8, `Pulling a vegetable out of the ground with a leafy rustle and a happy pop, ${P}`],
  recoger_frutal: [1, `Picking fruit from a tree, leaves rustling and a fruit falling into a basket, ${P}`],
  arbol: [0.8, `Axe chopping into a wooden log, solid thunk, ${P}`],
  roca: [0.7, `Pickaxe striking stone, crisp clink with small pebbles, ${P}`],
  mina: [0.9, `Pickaxe hitting an ore vein in a cave, metallic clink with a little sparkle, ${P}`],
  maleza: [0.7, `Sickle swishing through tall grass and weeds, ${P}`],
  golpear: [0.6, `Soft tool thud on the ground, ${P}`],
  pescar: [1.6, `Fishing rod cast whoosh, then a little plop in a pond, ${P}`],
  pez: [1.4, `Fish caught: splash of water and quick reel clicks, cheerful, ${P}`],
  fabricar: [1.4, `Crafting at a wooden workbench: small hammer taps and a satisfying click, ${P}`],
  construir: [1.8, `Building a wooden structure: hammering nails and wood planks, ${P}`],
  // Cuidados de los animales
  alimentar: [1.2, `Animal happily munching feed from a wooden trough, ${P}`],
  acariciar: [1, `Gentle petting on soft fur with a content little animal sigh, ${P}`],
  cepillar: [1.1, `Brushing an animal's fur with a soft brush, ${P}`],
  medico: [1, `Opening a small medical kit, gentle bandage rustle and a soft reassuring chime, ${P}`],
  cuento: [1, `Turning the page of an old book, soft paper flip, ${P}`],
  esquilar: [1.2, `Electric sheep shearing clippers buzzing through wool, ${P}`],
  trufas: [1.2, `Little pig sniffing and snorting in the dirt, then a happy oink, ${P}`],
  huevo: [0.6, `Picking up an egg from straw, tiny cute pop, ${P}`],
  // Cada especie
  gallina: [1, `Cute hen clucking, ${P}`],
  vaca: [1.4, `Gentle friendly cow moo, ${P}`],
  oveja: [1, `Soft cute sheep baa, ${P}`],
  cabra: [1, `Playful goat bleat, ${P}`],
  cerdito: [0.9, `Cute piglet oink oink, ${P}`],
  pato: [0.8, `Cheerful duck quacks, ${P}`],
  conejo: [0.7, `Tiny bunny squeak and thump, ${P}`],
  avestruz: [1.1, `Ostrich low booming and clucking call, cartoon, ${P}`],
  dinosaurio: [1.3, `Small friendly baby dinosaur roar, cute and goofy, ${P}`],
  unicornio: [1.3, `Magical unicorn whinny with sparkling chimes, ${P}`],
  dragon: [1.3, `Little friendly dragon purring growl with a tiny puff of fire, ${P}`],
  grifo: [1.2, `Griffin cry, half eagle screech half soft lion purr, majestic but friendly, ${P}`],
  // Monedas, compras, puertas, viajes
  monedas: [0.8, `Coins dropping into a pouch, bright jingle, ${P}`],
  comprar: [0.9, `Friendly shop bell ding and coins, ${P}`],
  puerta: [0.9, `Wooden cottage door opening with a gentle creak, ${P}`],
  cofre: [1, `Wooden chest lid opening with a sparkle, ${P}`],
  mochila: [0.6, `Rustle of a cloth backpack being opened, ${P}`],
  ruta: [1.5, `Magical travel whoosh like stepping through a portal, airy and warm, ${P}`],
  dormir: [2, `Soft sleepy lullaby chimes fading out, going to bed, ${P}`],
  logro: [1.4, `Happy achievement jingle with sparkles, short, ${P}`],
  // Ambientes (en bucle)
  ambiente_dia: [10, 'Peaceful countryside morning ambience: birds singing, light breeze in leaves, distant farm, seamless loop', true],
  ambiente_noche: [10, 'Calm night countryside ambience: crickets chirping, soft wind, an owl far away, seamless loop', true],
  ambiente_lluvia: [10, 'Gentle steady rain falling on grass and a wooden roof, cozy, seamless loop', true],
  ambiente_mar: [10, 'Soft ocean waves on a harbor shore with a few seagulls, calm, seamless loop', true],
};

const huella = (n, [seg, d]) => createHash('sha1').update(`${seg}|${d}`).digest('hex').slice(0, 5);
const archivoDe = (n, e) => `${n}-${huella(n, e)}.ogg`;
const segundos = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());

async function generar() {
  const todos = Object.entries(EFECTOS_GRANJA).filter(([n]) => !process.env.SOLO || process.env.SOLO === n);
  const falta = todos.filter(([n, e]) => !existsSync(join(DIR, archivoDe(n, e))));
  const seg = falta.reduce((a, [, e]) => a + e[0], 0);
  console.log(`Efectos de la granja: ${todos.length}, faltan ${falta.length} (${seg.toFixed(1)} s ≈ ${Math.round(seg * 40)} créditos)`);
  if (process.env.SECO) return;
  if (!CLAVE) throw new Error('Falta ELEVENLABS_API_KEY (se agrega en la configuración del entorno).');
  mkdirSync(DIR, { recursive: true });
  const tmp = join(RAIZ, 'modelos-crudos', '_sfx_granja');
  mkdirSync(tmp, { recursive: true });
  let hechos = 0, errores = 0;
  const cola = [...falta];
  async function trabajador() {
    for (let x = cola.shift(); x; x = cola.shift()) {
      const [n, [dur, desc, bucle]] = x;
      try {
        const r = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {
          method: 'POST', headers: { 'xi-api-key': CLAVE, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: desc, duration_seconds: Math.max(0.5, dur), prompt_influence: 0.45, ...(bucle ? { loop: true } : {}) }),
        });
        if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`);
        const mp3 = join(tmp, `${n}.mp3`);
        writeFileSync(mp3, Buffer.from(await r.arrayBuffer()));
        // Efectos cortos: mono y sin silencio al final; ambientes: estéreo y enteros (son bucles)
        const filtro = bucle ? 'loudnorm=I=-24:TP=-3' : 'areverse,silenceremove=start_periods=1:start_threshold=-55dB,areverse,loudnorm=I=-18:TP=-2';
        execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', mp3, '-af', filtro, '-ar', '48000', '-ac', bucle ? '2' : '1', '-c:a', 'libopus', '-b:a', bucle ? '48k' : '40k', join(DIR, archivoDe(n, [dur, desc]))]);
        unlinkSync(mp3);
        hechos++;
        console.log(`  ✓ ${n}`);
      } catch (err) {
        errores++;
        console.error(`  ✗ ${n}: ${String(err).slice(0, 200)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Number(process.env.PARALELO) || 1 }, trabajador));
  console.log(`listo: ${hechos} hechos, ${errores} con error`);
  const lista = {}, usados = new Set(['lista.json']);
  for (const [n, e] of Object.entries(EFECTOS_GRANJA)) {
    const a = archivoDe(n, e);
    if (!existsSync(join(DIR, a))) continue;
    usados.add(a);
    lista[n] = [a, Math.round(segundos(join(DIR, a)) * 100) / 100];
  }
  for (const f of readdirSync(DIR)) if (!usados.has(f)) unlinkSync(join(DIR, f));
  writeFileSync(join(DIR, 'lista.json'), JSON.stringify(lista, null, 0).replace(/\],"/g, '],\n"') + '\n');
  console.log(`lista.json: ${Object.keys(lista).length} efectos`);
}

await generar();
