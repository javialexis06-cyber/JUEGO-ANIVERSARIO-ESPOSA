// Las voces de Él y Ella con ElevenLabs (docs/sistemas/voces.md). Tres pasos:
//
//   node scripts/voces-ia.mjs guion    → lee las frases del juego (los mismos datos que usa el juego) y actualiza
//                                        voces-guion/<parte>.json: conserva lo ya escrito en «d» (cómo se dice, con
//                                        las emociones entre corchetes) y avisa qué frases son nuevas o ya no están.
//   SECO=1 node scripts/voces-ia.mjs   → cuenta lo que falta por generar (no gasta nada)
//   node scripts/voces-ia.mjs          → genera lo que falte (SOLO=puertas para una parte, LIMITE=3 para probar) en public/voces/*.ogg y
//                                        arma public/voces/lista.json (código → [archivo, segundos])
//
// Necesita ELEVENLABS_API_KEY (en la configuración del entorno, nunca en el código), ffmpeg y dos voces en la cuenta
// llamadas «Ella» y «El» (o sus códigos en VOZ_ELLA y VOZ_EL). El código de cada frase es el de src/voces.ts.
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const RAIZ = join(import.meta.dirname, '..');
const DIR = join(RAIZ, 'public', 'voces');
const GUION = join(RAIZ, 'voces-guion');
const API = 'https://api.elevenlabs.io/v1';
const CLAVE = process.env.ELEVENLABS_API_KEY;
const MODELO = process.env.MODELO ?? 'eleven_v4';
const AJUSTES = { stability: 0.5, similarity_boost: 0.8 };
const PARALELO = 3;

// ---------------------------------------------------------------------------------------------------------------
// El guion: las frases de cada parte, sacadas de los módulos del juego (con Vite, como los carga el juego)
// ---------------------------------------------------------------------------------------------------------------

const otro = (q) => (q === 'el' ? 'ella' : 'el');
const ROLES = ['el', 'ella'];

/** Cada parte devuelve [grupo, quien, texto] en el orden en que conviene leerlas. */
const PARTES = {
  async puertas(m) {
    const h = await m('/src/puertas/historia.ts');
    const out = [];
    const narra = (grupo, lista) => {
      for (const q of ROLES) for (const t of lista) out.push([grupo, q, h.voz(t, q)]);
    };
    for (const r of h.RECUERDOS) for (const [q, t] of r.dialogo) out.push([`Recuerdo · ${r.titulo} (puerta ${r.puerta})`, q, h.voz(t, q)]);
    for (const q of ROLES) for (const t of h.FINAL_DE[q]) out.push(['Final (puerta 100)', q, h.voz(t, q)]);
    narra('Inicio', h.INICIO);
    for (const [i, c] of h.CAPITULOS.entries()) {
      narra(`Capítulo ${i + 1} · ${c.titulo} · llegada`, c.llegada ?? []);
      narra(`Capítulo ${i + 1} · ${c.titulo} · despedida`, c.despedida ?? []);
    }
    for (const [n, l] of Object.entries(h.PUERTAS)) narra(`Al empezar la puerta ${n}`, l);
    narra('Cuando aparece un recuerdo', h.HALLAZGO);
    narra('Ánimos', h.ANIMO);
    for (const q of ROLES) for (const t of h.ANIMO_DE[q]) out.push(['Ánimos propios', q, h.voz(t, q)]);
    narra('Al abrir una puerta', h.FELICITAR);
    narra('Algo bonito al abrir', h.BONITO);
    for (const q of ROLES) for (const t of h.BONITO_DE[q]) out.push(['Algo bonito propio', q, h.voz(t, q)]);
    narra('Cuando algo se rompe', h.ROTO);
    for (const [nivel, l] of Object.entries(h.ANTES_DE_PISTA)) narra(`Antes de la pista (dulce ${nivel})`, l);
    narra('Sin plata para el dulce', h.SIN_PLATA);
    return out;
  },

  async casa(m) {
    const mi = await m('/src/casa/mimos.ts');
    const rp = await m('/src/casa/recuerdos_panel.ts');
    const b = await m('/src/casa/bano_frases.ts');
    const out = [];
    for (const q of ROLES) for (const t of mi.SALUDOS[q]) out.push(['Saludos', q, t]);
    for (const [tipo, lista] of Object.entries(mi.VARIANTES)) {
      for (const v of lista) {
        for (const quien of v.de ? [v.de] : ROLES) {
          for (const p of v.da) if (typeof p.dice === 'string') out.push([`Mimo · ${tipo} · ${v.nombre}`, quien, b.conGenero(quien, p.dice)]);
          for (const p of v.recibe) if (typeof p.dice === 'string') out.push([`Mimo · ${tipo} · ${v.nombre}`, otro(quien), b.conGenero(otro(quien), p.dice)]);
        }
      }
    }
    for (const [nombre, lista] of [['Discusión', rp.DISCUSIONES], ['Sueño', rp.DESEOS]]) {
      for (const v of lista) for (const [q, t] of v.lineas) out.push([`Recuerdo flotante · ${nombre} · ${v.sub ?? v.titulo}`, q, t]);
    }
    // El baño: todas las frases que pueden salir en la rutina (se sacan probando muchas semillas) y en los eventos
    for (const q of ROLES) {
      const vistas = new Set();
      for (let s = 0; s < 40000; s++) for (const p of b.rutinaInodoro(q, s)) if (p.frase) vistas.add(p.frase);
      for (const t of vistas) out.push(['Baño · rutina', q, t]);
      for (const ev of b.EVENTOS_BANO) for (const p of b.pasosEvento(ev, q)) if (p.frase) out.push([`Baño · ${ev.nombre ?? ev.id}`, q, p.frase]);
    }
    return out;
  },

  async juegos(m) {
    const r = await m('/src/reacciones/pareja.ts');
    const c = await m('/src/casa/cohete/pareja.ts');
    const k = await m('/src/casa/cocina/pareja.ts');
    const s = await m('/src/recuerdos_super.ts');
    const sa = await m('/src/sangre/historia_pareja.ts');
    const out = [];
    for (const [sit, porRol] of Object.entries(r.FRASES_PAREJA ?? {})) for (const q of ROLES) for (const t of porRol[q]) out.push([`Reacción · ${sit}`, q, t]);
    for (const q of ROLES) {
      for (const t of c.FRASES[q]) out.push(['Cohete · en el espacio', q, t]);
      for (const t of c.FRASES_TRAMO[q]) out.push(['Cohete · tramos del viaje', q, t]);
      for (const [poder, f] of Object.entries(c.FRASE_PODER)) out.push([`Cohete · poder ${poder}`, q, f[q]]);
      for (const t of c.OTRA_VEZ[q]) out.push(['Cohete · otra vez', q, t]);
      out.push(['Cohete · te pasé', q, c.PASO_PAREJA[q]]);
    }
    for (const q of ROLES) {
      for (const [receta, l] of Object.entries(k.SALUDOS_PAREJA[q])) for (const t of l) out.push([`Cocina · llega a comer (${receta})`, q, t]);
      for (const [tono, l] of Object.entries(k.REACCIONES_PAREJA[q])) for (const t of l) out.push([`Cocina · reacción ${tono}`, q, t]);
      for (const [receta, t] of Object.entries(k.FAVORITO[q] ?? {})) out.push([`Cocina · su favorito (${receta})`, q, t]);
    }
    for (const c2 of s.RECUERDOS_SUPER) out.push([`Carta del súper · día ${c2.dia} · ${c2.titulo}`, 'el', `${c2.texto}\n${c2.firma}`]);
    for (const [id, e] of Object.entries(sa.ESCENAS)) for (const l of e.lineas) if (l.quien === 'el' || l.quien === 'ella') out.push([`Sangre y Ceniza · ${e.subtitulo} · ${e.titulo}`, l.quien, l.texto]);
    return out;
  },
};

/** Cómo se dice por defecto: sin emojis ni caritas de texto (las emociones se le ponen a mano en el guion). */
function hablado(t, limpiar) {
  return limpiar(t.replace(/\n+/g, ' '))
    .replace(/(^|\s)(:3|:v|\.c|:c|:D|:\)|:\(|;\)|xD|XD|<3)(?=[\s,.!?…]|$)/g, '$1')
    .replace(/\bbb\b/g, 'bebé')
    .replace(/\s+([,.!?…])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

async function armarGuion() {
  const { createServer } = await import('vite');
  const vite = await createServer({ root: RAIZ, configFile: join(RAIZ, 'vite.config.ts'), server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } });
  const m = (ruta) => vite.ssrLoadModule(ruta);
  const { idFrase, limpiar } = await m('/src/voces.ts');
  mkdirSync(GUION, { recursive: true });
  const todos = new Map();
  for (const [parte, sacar] of Object.entries(PARTES)) {
    const archivo = join(GUION, `${parte}.json`);
    const antes = existsSync(archivo) ? JSON.parse(readFileSync(archivo, 'utf8')) : [];
    const viejo = new Map(antes.map((e) => [e.id, e]));
    const nuevo = [];
    const vistos = new Set();
    for (const [g, q, t] of await sacar(m)) {
      const id = idFrase(q, t);
      if (vistos.has(id)) continue;
      vistos.add(id);
      const choque = todos.get(id);
      if (choque && (choque.q !== q || limpiar(choque.t) !== limpiar(t))) throw new Error(`Dos frases con el mismo código ${id}: «${choque.t}» y «${t}»`);
      if (choque) continue; // ya está en otra parte (suena igual)
      todos.set(id, { q, t });
      const v = viejo.get(id);
      nuevo.push({ id, g, q, t, d: v ? v.d : hablado(t, limpiar), ...(v?.revisada ? { revisada: true } : {}) });
    }
    const quitadas = antes.filter((e) => !vistos.has(e.id));
    writeFileSync(archivo, JSON.stringify(nuevo, null, 1) + '\n');
    const car = nuevo.reduce((a, e) => a + (e.d ? e.d.length : 0), 0);
    console.log(`${parte}: ${nuevo.length} frases (${nuevo.filter((e) => !viejo.has(e.id)).length} nuevas, ${quitadas.length} ya no están) · ${car} caracteres`);
  }
  await vite.close();
}

// ---------------------------------------------------------------------------------------------------------------
// Generar los audios
// ---------------------------------------------------------------------------------------------------------------

async function pedir(ruta, op = {}) {
  for (let intento = 0; ; intento++) {
    const r = await fetch(`${API}${ruta}`, { ...op, headers: { 'xi-api-key': CLAVE, ...(op.headers ?? {}) } });
    if (r.ok) return r;
    if ((r.status === 429 || r.status >= 500) && intento < 5) {
      await new Promise((ok) => setTimeout(ok, 2000 * 2 ** intento));
      continue;
    }
    throw new Error(`ElevenLabs respondió ${r.status}: ${(await r.text()).slice(0, 300)}`);
  }
}

/** El archivo lleva un pedacito de la huella de cómo se dice: si se cambia el texto o la emoción, se rehace. */
const archivoDe = (e) => `${e.id}-${createHash('sha1').update(`${MODELO}|${JSON.stringify(AJUSTES)}|${e.d}`).digest('hex').slice(0, 5)}.ogg`;

async function generar() {
  const partes = readdirSync(GUION).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
  const frases = partes.flatMap((p) => JSON.parse(readFileSync(join(GUION, `${p}.json`), 'utf8')).map((e) => ({ ...e, parte: p })));
  const listaVieja = existsSync(join(DIR, 'lista.json')) ? JSON.parse(readFileSync(join(DIR, 'lista.json'), 'utf8')) : {};
  const conVoz = frases.filter((e) => e.d);
  const falta = conVoz.filter((e) => (!process.env.SOLO || e.parte === process.env.SOLO) && !existsSync(join(DIR, archivoDe(e)))).slice(0, Number(process.env.LIMITE) || Infinity);
  console.log(`${conVoz.length} frases con voz · faltan ${falta.length} (${falta.reduce((a, e) => a + e.d.length, 0)} caracteres)`);
  if (process.env.SECO) return;
  if (!CLAVE) throw new Error('Falta ELEVENLABS_API_KEY (se agrega en la configuración del entorno).');

  const sinTilde = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const { voices } = await (await pedir('/voices')).json();
  const buscar = (nombre, env) => process.env[env] ?? voices.find((v) => sinTilde(v.name) === nombre)?.voice_id;
  const VOZ = { ella: buscar('ella', 'VOZ_ELLA'), el: buscar('el', 'VOZ_EL') };
  for (const [q, id] of Object.entries(VOZ)) if (!id) throw new Error(`No encontré la voz de ${q === 'el' ? 'Él' : 'Ella'} (voces: ${voices.map((v) => v.name).join(', ')})`);

  mkdirSync(DIR, { recursive: true });
  const tmp = join(RAIZ, 'modelos-crudos', '_voces');
  mkdirSync(tmp, { recursive: true });
  let hechas = 0;
  let errores = 0;
  const cola = [...falta];
  async function trabajador() {
    for (let e = cola.shift(); e; e = cola.shift()) {
      try {
        const r = await pedir(`/text-to-speech/${VOZ[e.q]}?output_format=mp3_44100_128`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: e.d, model_id: MODELO, voice_settings: AJUSTES, language_code: 'es' }),
        });
        const mp3 = join(tmp, `${e.id}.mp3`);
        writeFileSync(mp3, Buffer.from(await r.arrayBuffer()));
        // Opus mono a 32 kb/s: liviano para la APK y de sobra para una voz. Se recortan los silencios de las puntas.
        execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', mp3, '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.08', '-ac', '1', '-c:a', 'libopus', '-b:a', '32k', join(DIR, archivoDe(e))]);
        unlinkSync(mp3);
        if (++hechas % 25 === 0) console.log(`  ${hechas}/${falta.length}`);
      } catch (err) {
        errores++;
        console.error(`  ✗ ${e.id} (${e.parte}): ${String(err).slice(0, 200)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: PARALELO }, trabajador));
  console.log(`listo: ${hechas} nuevas, ${errores} con error`);
  armarLista(conVoz, listaVieja);
}

/** lista.json con todo lo que tiene audio; borra los audios que ya no se usan. */
function armarLista(conVoz, listaVieja) {
  const lista = {};
  const usados = new Set(['lista.json']);
  for (const e of conVoz) {
    const a = archivoDe(e);
    if (!existsSync(join(DIR, a))) continue;
    usados.add(a);
    const vieja = listaVieja[e.id];
    const seg = Array.isArray(vieja) && vieja[0] === a ? vieja[1] : Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', join(DIR, a)]).toString().trim());
    lista[e.id] = [a, Math.round(seg * 100) / 100];
  }
  let borrados = 0;
  for (const f of readdirSync(DIR)) if (!usados.has(f)) (unlinkSync(join(DIR, f)), borrados++);
  writeFileSync(join(DIR, 'lista.json'), JSON.stringify(lista, null, 0).replace(/\],"/g, '],\n"') + '\n');
  console.log(`lista.json: ${Object.keys(lista).length} voces${borrados ? ` (${borrados} audios viejos borrados)` : ''}`);
}

if (process.argv[2] === 'guion') await armarGuion();
else await generar();
