// Arma `src/salas/prendas.json`: la ropa del creador de personajes de los amigos (peinados, ropa, zapatos y
// accesorios), sacada del clóset de la casa (`src/casa/ropa.json` + los modelos de `public/modelos/ropa/`), SOLO con
// lo genérico: nada con nombres, frases o recuerdos de la pareja ni sus disfraces de pareja. La lista es una LISTA
// BLANCA: un modelo nuevo del clóset no les aparece a los amigos hasta que se agregue aquí con su nombre neutro.
// Además guarda, sin nombres, las prendas que usan los disfraces de «Lavarse la cara» (la versión para amigos las
// necesita para vestir esos disfraces y no lleva el catálogo de la casa).
// Uso: node scripts/prendas-amigos.mjs   (después de cambiar el clóset o esta lista)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ROPA = JSON.parse(readFileSync('src/casa/ropa.json', 'utf8'));
const DIR = 'public/modelos/ropa';

/** Lo que ven los amigos: modelo → [nombre, grupo]. El grupo arma las pestañitas dentro de cada categoría. */
const LISTA = {
  // Peinados
  pelo_rapado: ['Rapado', 'corto'], pelo_lado: ['De lado', 'corto'], pelo_copete: ['Copete rockero', 'corto'], pelo_mohicano: ['Mohicano', 'corto'],
  pelo_afro: ['Afro', 'rizado'], pelo_rizos: ['Rizos', 'rizado'], pelo_rizado: ['Largo rizado', 'rizado'],
  pelo_colita: ['Colita de samurái', 'recogido'], pelo_cola: ['Cola de caballo', 'recogido'], pelo_mono: ['Moño alto', 'recogido'],
  pelo_trenzas: ['Dos trenzas', 'recogido'], pelo_colitas: ['Dos colitas', 'recogido'],
  pelo_largo_el: ['Largo suelto', 'largo'], pelo_corto: ['Bob con flequillo', 'largo'], pelo_flequillo: ['Largo con flequillo', 'largo'],
  pelo_ondas: ['Largo ondulado', 'largo'], pelo_mono_bajo: ['Moño bajo', 'recogido'], pelo_calvo: ['Calvo con canas', 'corto'],
  // Cabeza
  gorra: ['Gorra', 'gorros'], boina: ['Boina', 'gorros'], gorro_lana: ['Gorro de lana', 'gorros'], gorro_navidad: ['Gorro de Navidad', 'gorros'],
  gorro_chef: ['Gorro de chef', 'gorros'], gorro_fiesta: ['Gorro de fiesta', 'gorros'],
  sombrero_vueltiao: ['Sombrero vueltiao', 'sombreros'], sombrero_paja: ['Sombrero de paja', 'sombreros'], sombrero_vaquero: ['Sombrero vaquero', 'sombreros'],
  sombrero_bruja: ['Sombrero de bruja', 'sombreros'], sombrero_pirata: ['Sombrero de pirata', 'sombreros'], sombrero_copa: ['Sombrero de copa', 'sombreros'],
  corona: ['Corona', 'brillos'], tiara: ['Tiara', 'brillos'], aureola: ['Aureola', 'brillos'], diadema_mono: ['Diadema con moño', 'brillos'],
  flor_pelo: ['Flor en el pelo', 'brillos'],
  orejas_gato: ['Orejitas de gato', 'orejas'], orejas_conejo: ['Orejas de conejo', 'orejas'], orejas_oso: ['Orejitas de osito', 'orejas'],
  cuernos: ['Cuernitos', 'orejas'], antenas_abeja: ['Antenas de abejita', 'orejas'],
  capucha_oso: ['Capucha de osito', 'capuchas'], capucha_conejo: ['Capucha de conejito', 'capuchas'], capucha_dino: ['Capucha de dinosaurio', 'capuchas'],
  capucha_unicornio: ['Capucha de unicornio', 'capuchas'], capucha_dragon: ['Capucha de dragón', 'capuchas'], capucha_zorro: ['Capucha de zorrito', 'capuchas'],
  capucha_raton: ['Capucha de ratoncito', 'capuchas'], capucha_rana: ['Capucha de ranita', 'capuchas'], capucha_vaca: ['Capucha de vaquita', 'capuchas'],
  capucha_cascaron: ['Capucha de pollito', 'capuchas'], capucha_tigre: ['Capucha de tigre', 'capuchas'], capucha_oveja: ['Capucha de ovejita', 'capuchas'],
  capucha_leon: ['Capucha de leoncito', 'capuchas'],
  sombrero_arriero: ['Sombrero arriero', 'sombreros'], sombrero_pescador: ['Sombrero de pescador', 'sombreros'],
  casco_minero: ['Casco de minero', 'gorros'], panoleta: ['Pañoleta', 'gorros'],
  // Cara
  gafas_redondas: ['Gafas redondas', 'gafas'], gafas_sol: ['Gafas de sol', 'gafas'], gafas_corazon: ['Gafas de corazón', 'gafas'],
  gafas_estrella: ['Gafas de estrella', 'gafas'], antifaz: ['Antifaz', 'disfraz'], parche: ['Parche de pirata', 'disfraz'],
  nariz_payaso: ['Nariz de payaso', 'disfraz'], bigote: ['Bigote', 'disfraz'], bigotes_gato: ['Bigotes de gatito', 'disfraz'],
  barba: ['Barba de candado', 'disfraz'],
  // Arriba
  camiseta: ['Camiseta', 'camisetas'], camiseta_rayas: ['Camiseta marinera', 'camisetas'], camiseta_corazon: ['Camiseta con corazón', 'camisetas'],
  camiseta_estrella: ['Camiseta de héroe', 'camisetas'], camiseta_futbol: ['Camiseta de fútbol', 'camisetas'], esqueleto: ['Camiseta de esqueleto', 'camisetas'],
  blusa: ['Blusa de boleros', 'camisetas'],
  buzo: ['Buzo con capota', 'abrigos'], sueter: ['Suéter', 'abrigos'], sueter_corazones: ['Suéter de corazones', 'abrigos'],
  sueter_navidad: ['Suéter navideño', 'abrigos'], chaqueta: ['Chaqueta', 'abrigos'], chaqueta_cuero: ['Chaqueta de cuero', 'abrigos'],
  camisa: ['Camisa', 'camisas'], camisa_hawaiana: ['Camisa hawaiana', 'camisas'], camisa_cuadros: ['Camisa de cuadros', 'camisas'],
  chaleco: ['Chaleco con camiseta', 'camisas'], saco_corbata: ['Saco con corbata', 'camisas'], saco_corbatin: ['Esmoquin con corbatín', 'camisas'],
  chaqueta_chef: ['Chaqueta de chef', 'oficios'], delantal: ['Delantal con camisa', 'oficios'], ruana: ['Ruana', 'abrigos'], bata_medico: ['Bata de médico', 'oficios'], traje_astronauta: ['Traje de astronauta', 'oficios'],
  vestido: ['Vestido', 'vestidos'], vestido_puntos: ['Vestido de puntos', 'vestidos'], vestido_princesa: ['Vestido de princesa', 'vestidos'],
  pijama_oso: ['Pijama de osito', 'enterizos'], pijama_dino: ['Pijama de dinosaurio', 'enterizos'], pijama_corazones: ['Pijama de corazones', 'enterizos'],
  enterizo_dragon: ['Enterizo de dragón', 'enterizos'], enterizo_zorro: ['Enterizo de zorrito', 'enterizos'], enterizo_raton: ['Enterizo de ratoncito', 'enterizos'],
  enterizo_rana: ['Enterizo de ranita', 'enterizos'], enterizo_vaca: ['Enterizo de vaquita', 'enterizos'], enterizo_pollito: ['Enterizo de pollito', 'enterizos'],
  enterizo_tigre: ['Enterizo de tigre', 'enterizos'], enterizo_oveja: ['Enterizo de ovejita', 'enterizos'], enterizo_leon: ['Enterizo de leoncito', 'enterizos'],
  // Abajo
  pantalon: ['Pantalón', 'pantalones'], jogger: ['Jogger', 'pantalones'], pantalon_pijama: ['Pantalón de pijama', 'pantalones'], overol: ['Overol', 'pantalones'],
  bermuda: ['Bermuda', 'cortos'], short: ['Short deportivo', 'cortos'],
  falda: ['Falda', 'faldas'], falda_larga: ['Falda larga', 'faldas'], tutu: ['Tutú', 'faldas'],
  // Pies
  tenis: ['Tenis', 'zapatos'], zapatos: ['Zapatos elegantes', 'zapatos'], tacones: ['Tacones', 'zapatos'], sandalias: ['Sandalias', 'zapatos'],
  botas: ['Botas', 'botas'], botas_vaqueras: ['Botas vaqueras', 'botas'], botas_lluvia: ['Botas de lluvia', 'botas'],
  pantuflas_conejo: ['Pantuflas de conejito', 'pantuflas'], pantuflas_oso: ['Pantuflas de osito', 'pantuflas'], pantuflas_dragon: ['Pantuflas de dragón', 'pantuflas'],
  pantuflas_zorro: ['Patitas de zorrito', 'pantuflas'], pantuflas_rana: ['Patas de ranita', 'pantuflas'], pantuflas_pollito: ['Patitas de pollito', 'pantuflas'],
  // Espalda
  capa: ['Capa', 'capas'], mochila: ['Mochila', 'capas'], carriel: ['Carriel', 'capas'],
  alas_angel: ['Alas de angelito', 'alas'], alas_mariposa: ['Alas de mariposa', 'alas'], alas_abeja: ['Alitas de abeja', 'alas'],
  alas_murcielago: ['Alas de murciélago', 'alas'], alas_dragon: ['Alas de dragón', 'alas'],
  // Cola
  cola_gato: ['Cola de gatito', 'colas'], cola_conejo: ['Colita de conejo', 'colas'], cola_oso: ['Colita de osito', 'colas'], cola_dino: ['Cola de dinosaurio', 'colas'],
  cola_diablo: ['Cola de diablito', 'colas'], cola_zorro: ['Cola de zorrito', 'colas'], cola_zorro_esponjosa: ['Cola esponjosa', 'colas'],
  cola_dragon: ['Cola de dragón', 'colas'], cola_raton: ['Colita de ratón', 'colas'], cola_vaca: ['Colita de vaquita', 'colas'],
  cola_tigre: ['Cola de tigre', 'colas'], cola_leon: ['Cola de leoncito', 'colas'],
};

/** Cómo se dibuja en la carita SVG de las salas (familia de forma). */
const FAMILIA = (m) => {
  if (m.startsWith('pelo_')) return m.slice(5);
  for (const [rx, f] of [
    [/^gorra/, 'gorra'], [/^boina/, 'boina'], [/^gorro_(lana|navidad)/, 'gorro'], [/^gorro_chef/, 'chef'], [/^gorro_fiesta/, 'fiesta'],
    [/^sombrero_bruja/, 'bruja'], [/^sombrero_copa/, 'copa'], [/^sombrero_pirata/, 'pirata'], [/^sombrero/, 'sombrero'], [/^(corona|tiara)/, 'corona'],
    [/^aureola/, 'aureola'], [/^diadema/, 'diadema'], [/^flor/, 'flor'], [/^orejas_conejo|capucha_conejo/, 'conejo'], [/^(orejas_|capucha_)/, 'orejas'],
    [/^cuernos/, 'cuernos'], [/^antenas/, 'antenas'], [/^gafas_sol/, 'gafas_sol'], [/^gafas/, 'gafas'], [/^antifaz/, 'antifaz'], [/^parche/, 'parche'],
    [/^nariz/, 'nariz'], [/^bigotes_gato/, 'bigotes_gato'], [/^bigote/, 'bigote'],
  ]) if (rx.test(m)) return f;
  return '';
};

/** Los papeles de los materiales de un modelo («principal», «detalle»…) que se pueden pintar, en los dos cuerpos. */
function papeles(modelo, para) {
  const porRol = para.map((rol) => {
    const f = `${DIR}/${modelo}_${rol}.glb`;
    if (!existsSync(f)) return null;
    const b = readFileSync(f);
    const j = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString());
    const s = new Set();
    for (const m of j.materials ?? []) {
      const n = String(m.name ?? '');
      if (!n.startsWith(`${modelo} `)) continue;
      const p = n.slice(modelo.length + 1).split(' ')[0];
      // (los brillos, metales y luces no se pintan: se ven raros)
      if (p && !/^(brillo|metal|luz|ojos?|pupila|iris|destellos|nariz|dientes|lengua|vidrio|reflejo|boca)$/.test(p)) s.add(p);
    }
    return s;
  });
  if (porRol.some((s) => !s)) return null;
  const comunes = [...porRol[0]].filter((p) => porRol.every((s) => s.has(p)));
  // «principal» primero
  return comunes.sort((a, b) => (a === 'principal' ? -1 : b === 'principal' ? 1 : 0));
}

const porModelo = new Map();
for (const it of ROPA) {
  const l = porModelo.get(it.modelo) ?? [];
  l.push(it);
  porModelo.set(it.modelo, l);
}

const modelos = [];
const faltan = [];
for (const [m, [nombre, grupo]] of Object.entries(LISTA)) {
  const vs = porModelo.get(m);
  if (!vs) {
    faltan.push(m);
    continue;
  }
  const v0 = vs[0];
  const para = [...new Set(vs.flatMap((v) => v.para))].filter((r) => existsSync(`${DIR}/${m}_${r}.glb`));
  if (!para.length) {
    faltan.push(m);
    continue;
  }
  const pp = papeles(m, para) ?? [];
  // Colores de muestra: los de las variantes del clóset (para el «principal» y el segundo papel)
  const muestras = [];
  for (const v of vs) {
    const c = v.colores ?? {};
    const a = c[pp[0]] ?? null;
    const b = pp[1] ? c[pp[1]] ?? null : null;
    if ((a || b) && !muestras.some((x) => x[0] === a && x[1] === b)) muestras.push([a, b]);
  }
  modelos.push({
    m, n: nombre, r: v0.ranura, g: grupo, para,
    ...(v0.tambien?.length ? { t: v0.tambien } : {}), ...(v0.oculta?.length ? { o: v0.oculta } : {}),
    ...(pp.length ? { pp: pp.slice(0, 2) } : {}), ...(muestras.length ? { mu: muestras.slice(0, 8) } : {}),
    ...(FAMILIA(m) ? { f: FAMILIA(m) } : {}),
    // ícono de la primera variante (sin color) para cada cuerpo
    i: (vs.find((v) => !Object.keys(v.colores ?? {}).length) ?? v0).id,
  });
}

// Las prendas de los disfraces del lavado (sin nombre: solo para vestirlos en la versión para amigos)
const disfraces = readFileSync('src/casa/lavado/disfraces.ts', 'utf8');
const usadas = new Set();
for (const m of disfraces.matchAll(/ropa: \{([^}]*)\}/g)) for (const x of m[1].matchAll(/'([a-z0-9_]+)'/g)) usadas.add(x[1]);
/** Prendas de disfraces cuyo modelo lleva por dentro un apodo de la pareja: en la versión para amigos se visten con otro. */
const REEMPLAZOS = { pantuflas_panda_garra: { modelo: 'pantuflas_oso', colores: { principal: '#2B2A2E', interior: '#F4EFE6' } } };
const items = {};
for (const id of [...usadas].sort()) {
  const it0 = ROPA.find((r) => r.id === id);
  const it = it0 && REEMPLAZOS[id] ? { ...it0, ...REEMPLAZOS[id] } : it0;
  if (!it) {
    faltan.push(`(lavado) ${id}`);
    continue;
  }
  items[id] = { modelo: it.modelo, ranura: it.ranura, para: it.para, ...(it.tambien?.length ? { tambien: it.tambien } : {}),
    ...(it.oculta?.length ? { oculta: it.oculta } : {}), ...(Object.keys(it.colores ?? {}).length ? { colores: it.colores } : {}) };
}

writeFileSync('src/salas/prendas.json', `${JSON.stringify({ modelos, items }, null, 0).replace(/\},\{"m"/g, '},\n{"m"')}\n`);
console.log(`${modelos.length} modelos para el creador, ${Object.keys(items).length} prendas de disfraces del lavado`);
if (faltan.length) console.log('No se encontraron:', faltan.join(', '));
