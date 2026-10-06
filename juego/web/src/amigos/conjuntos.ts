// Conjuntos completos para el creador de personajes (un toque y queda vestido de pies a cabeza) y el botón «Al azar»,
// que arma pintas que combinan. Solo usa el clóset genérico (`src/salas/prendas.ts`): nada de la pareja.
import { PELOS, PIELES, ROPAS, OJOS, RUBORES, type PerfilAmigo } from '../salas/perfil';
import { ARETES, COLLARES, CLAVE, MODELOS, RANURAS_AMIGO, piezaDe, valorPieza, type Cuerpo, type RanuraAmigo } from '../salas/prendas';

/** Lo que pone un conjunto: claves de `detalles` («arriba», «cabeza»…) con «modelo#color#color». */
type Pinta = Record<string, string>;

export interface Conjunto {
  id: string;
  n: string;
  ico: string;
  /** Para los dos cuerpos o, si cambia, uno para cada uno. */
  el: Pinta;
  ella?: Pinta;
}

export const CONJUNTOS: Conjunto[] = [
  { id: 'deporte', n: 'Deportista', ico: '⚽', el: { arriba: 'camiseta_futbol#e4566b#26375e', abajo: 'short#26375e#f6f2ea', pies: 'tenis#f6f2ea#e4566b', cabeza: 'gorra#26375e#e4566b' } },
  { id: 'playa', n: 'Día de playa', ico: '🏖️', el: { arriba: 'camisa_hawaiana#3fb5a3#f6f2ea', abajo: 'bermuda#d8c3a5#8a5a3c', pies: 'sandalias#9c6b43#e7d3b5', cabeza: 'sombrero_paja#e8c98a#e4566b', cara: 'gafas_sol#1d1d24#2f3e4f' } },
  { id: 'vaquero', n: 'Vaquero', ico: '🤠', el: { arriba: 'camisa_cuadros#c2354a#f6f2ea', abajo: 'pantalon#2a4f9e#e3a53b', pies: 'botas_vaqueras#6b4632#e5b85c', cabeza: 'sombrero_vaquero#8a5a3c#1d1d24' },
    ella: { arriba: 'camisa_cuadros#c2354a#f6f2ea', abajo: 'falda#2a4f9e#e3a53b', pies: 'botas_vaqueras#6b4632#e5b85c', cabeza: 'sombrero_vaquero#f6f2ea#8a5a3c' } },
  { id: 'invierno', n: 'Friíto', ico: '❄️', el: { arriba: 'buzo#8ec5f0#f6f2ea', abajo: 'jogger#4a4a52#f6f2ea', pies: 'botas#5b3a29#d8c3a5', cabeza: 'gorro_lana#f6f2ea#8ec5f0' } },
  { id: 'elegante', n: 'Elegante', ico: '🎩', el: { arriba: 'saco_corbata#1d1d24#c2354a', abajo: 'pantalon#1d1d24#4a4a52', pies: 'zapatos#1d1d24#1d1d24' },
    ella: { arriba: 'vestido#1d1d24#e5b85c', pies: 'tacones#1d1d24#2a2626', aretes: 'perla', collar: 'perlas' } },
  { id: 'gala', n: 'Noche de gala', ico: '✨', el: { arriba: 'saco_corbatin#1d1d24#1d1d24', abajo: 'pantalon#1d1d24#4a4a52', pies: 'zapatos#1d1d24#1d1d24', cabeza: 'sombrero_copa#1d1d24#c2354a' },
    ella: { arriba: 'vestido_princesa#6c5ce7#f2c14e', pies: 'tacones#e5b85c#2a2626', cabeza: 'tiara#e5b85c#d8f4ff', aretes: 'diamante', collar: 'gema#7a5cf0' } },
  { id: 'rock', n: 'Rockero', ico: '🎸', el: { arriba: 'chaqueta_cuero#1d1d24#c9ccd2', abajo: 'pantalon#1d1d24#4a4a52', pies: 'botas#1d1d24#a3a3a8', cara: 'gafas_sol#1d1d24#1d1d24', peinado: 'pelo_mohicano', aretes: 'argolla#c9ccd2' },
    ella: { arriba: 'chaqueta_cuero#1d1d24#c9ccd2', abajo: 'falda#1d1d24#4a4a52', pies: 'botas#1d1d24#a3a3a8', cara: 'gafas_sol#1d1d24#1d1d24', aretes: 'argolla_grande#c9ccd2', collar: 'gargantilla' } },
  { id: 'chef', n: 'Chef', ico: '👩‍🍳', el: { arriba: 'chaqueta_chef', abajo: 'pantalon#1d1d24#4a4a52', pies: 'zapatos#1d1d24#1d1d24', cabeza: 'gorro_chef' } },
  { id: 'doctor', n: 'Doctor', ico: '🩺', el: { arriba: 'bata_medico', abajo: 'pantalon#2a4f9e#4a4a52', pies: 'zapatos#f4efe6#f4efe6', cara: 'gafas_redondas#5b3a29' } },
  { id: 'astronauta', n: 'Astronauta', ico: '🚀', el: { arriba: 'traje_astronauta', pies: 'botas#f4efe6#f4efe6' } },
  { id: 'pirata', n: 'Pirata', ico: '🏴‍☠️', el: { arriba: 'camisa#f4efe6#5b3a29', abajo: 'pantalon#5b3a29#2a1a12', pies: 'botas#1d1d24#a3a3a8', cabeza: 'sombrero_pirata', cara: 'parche', aretes: 'argolla' } },
  { id: 'heroe', n: 'Superhéroe', ico: '🦸', el: { arriba: 'camiseta_estrella#2a4f9e#f2c94c', abajo: 'jogger#2a4f9e#c2354a', pies: 'botas_lluvia#c2354a#f6f2ea', espalda: 'capa#c2354a#f2c94c', cara: 'antifaz#c2354a' } },
  { id: 'brujo', n: 'Hechicero', ico: '🧙', el: { arriba: 'sueter#6c5ce7', abajo: 'pantalon#1d1d24#4a4a52', pies: 'botas#1d1d24#a3a3a8', cabeza: 'sombrero_bruja#2a1a12#f29b38', espalda: 'capa#1d1d24#f29b38' },
    ella: { arriba: 'vestido#1d1d24#f29b38', pies: 'botas#1d1d24#a3a3a8', cabeza: 'sombrero_bruja#1d1d24#f29b38', espalda: 'capa#6c5ce7#f29b38', collar: 'estrella#f29b38' } },
  { id: 'angel', n: 'Angelito', ico: '😇', el: { arriba: 'camiseta#f4efe6', abajo: 'pantalon#f4efe6#d8c3a5', pies: 'tenis#f4efe6#f4efe6', cabeza: 'aureola', espalda: 'alas_angel' },
    ella: { arriba: 'vestido#f4efe6#f2c14e', pies: 'sandalias#f2c14e#f6f2ea', cabeza: 'aureola', espalda: 'alas_angel', aretes: 'perla' } },
  { id: 'diablito', n: 'Diablito', ico: '😈', el: { arriba: 'camiseta#c2354a', abajo: 'pantalon#1d1d24#4a4a52', pies: 'botas#1d1d24#a3a3a8', cabeza: 'cuernos#c2354a', cola: 'cola_diablo#c2354a', espalda: 'alas_murcielago#1d1d24' } },
  { id: 'hada', n: 'Hada de mariposa', ico: '🦋', el: { arriba: 'camiseta_rayas#ffd1dc#c46bd6', abajo: 'jogger#c46bd6#f6f2ea', pies: 'tenis#c46bd6#f6f2ea', cabeza: 'flor_pelo#f28bb5#f2c94c', espalda: 'alas_mariposa#c46bd6#8ec5f0' },
    ella: { arriba: 'vestido_puntos#c46bd6#f6f2ea', pies: 'sandalias#c46bd6#f6f2ea', cabeza: 'flor_pelo#f28bb5#f2c94c', espalda: 'alas_mariposa#c46bd6#8ec5f0', aretes: 'flor', collar: 'flores' } },
  { id: 'osito', n: 'Pijamada de osito', ico: '🧸', el: { arriba: 'pijama_oso#c99a5b#f4efe6', cabeza: 'capucha_oso#c99a5b#f4efe6', pies: 'pantuflas_oso#c99a5b#f4efe6', cola: 'cola_oso#c99a5b' } },
  { id: 'dino', n: 'Dinosaurio', ico: '🦖', el: { arriba: 'pijama_dino', cabeza: 'capucha_dino', cola: 'cola_dino', pies: 'pantuflas_dragon#7ccf6b#2f8f5b' } },
  { id: 'dragon', n: 'Dragón', ico: '🐉', el: { arriba: 'enterizo_dragon#8a62d6#b597ec', cabeza: 'capucha_dragon#8a62d6#5e3fae', espalda: 'alas_dragon#8a62d6#2e1f45', cola: 'cola_dragon#8a62d6#f6b8da', pies: 'pantuflas_dragon#8a62d6#5e3fae' } },
  { id: 'gatito', n: 'Gatito', ico: '🐱', el: { arriba: 'buzo#4a4a52#f6f2ea', abajo: 'jogger#4a4a52#f6f2ea', pies: 'tenis#1d1d24#f6f2ea', cabeza: 'orejas_gato#4a4a52#f39ab0', cara: 'bigotes_gato', cola: 'cola_gato#4a4a52' } },
  { id: 'conejito', n: 'Conejito', ico: '🐰', el: { arriba: 'pijama_oso#ffd1dc#ffffff', cabeza: 'capucha_conejo#ffd1dc#ffffff', pies: 'pantuflas_conejo#ffd1dc#f6f2ea', cola: 'cola_conejo#ffffff' } },
  { id: 'zorro', n: 'Zorrito', ico: '🦊', el: { arriba: 'enterizo_zorro', cabeza: 'capucha_zorro', cola: 'cola_zorro_esponjosa', pies: 'pantuflas_zorro' } },
  { id: 'tigre', n: 'Tigre', ico: '🐯', el: { arriba: 'enterizo_tigre', cabeza: 'capucha_tigre', cola: 'cola_tigre', pies: 'pantuflas_zorro' } },
  { id: 'leon', n: 'Leoncito', ico: '🦁', el: { arriba: 'enterizo_leon', cabeza: 'capucha_leon', cola: 'cola_leon', pies: 'pantuflas_pollito#f2c94c#9c6b43' } },
  { id: 'vaquita', n: 'Vaquita', ico: '🐮', el: { arriba: 'enterizo_vaca', cabeza: 'capucha_vaca', cola: 'cola_vaca', pies: 'pantuflas_oso#f4efe6#1d1d24' } },
  { id: 'ranita', n: 'Ranita', ico: '🐸', el: { arriba: 'enterizo_rana', cabeza: 'capucha_rana', pies: 'pantuflas_rana' } },
  { id: 'ovejita', n: 'Ovejita', ico: '🐑', el: { arriba: 'enterizo_oveja', cabeza: 'capucha_oveja', pies: 'pantuflas_oso#f4efe6#4a4a52' } },
  { id: 'raton', n: 'Ratoncito', ico: '🐭', el: { arriba: 'enterizo_raton', cabeza: 'capucha_raton', cola: 'cola_raton', pies: 'pantuflas_conejo#a3a3a8#f39ab0' } },
  { id: 'pollito', n: 'Pollito', ico: '🐣', el: { arriba: 'enterizo_pollito', cabeza: 'capucha_cascaron', pies: 'pantuflas_pollito' } },
  { id: 'unicornio', n: 'Unicornio', ico: '🦄', el: { arriba: 'buzo#faf6f2#c46bd6', abajo: 'jogger#c46bd6#f6f2ea', pies: 'tenis#c46bd6#f6f2ea', cabeza: 'capucha_unicornio#faf6f2#8ec5f0', espalda: 'alas_mariposa#ffd1dc#8ec5f0' },
    ella: { arriba: 'vestido_princesa#ffd1dc#c46bd6', pies: 'sandalias#c46bd6#f6f2ea', cabeza: 'capucha_unicornio#faf6f2#8ec5f0', aretes: 'estrella#c46bd6' } },
  { id: 'abeja', n: 'Abejita', ico: '🐝', el: { arriba: 'camiseta_rayas#f2c94c#1d1d24', abajo: 'short#1d1d24#f2c94c', pies: 'tenis#1d1d24#f2c94c', cabeza: 'antenas_abeja', espalda: 'alas_abeja' } },
  { id: 'navidad', n: 'Navidad', ico: '🎄', el: { arriba: 'sueter_navidad', abajo: 'pantalon#c2354a#f6f2ea', pies: 'botas#5b3a29#d8c3a5', cabeza: 'gorro_navidad' } },
  { id: 'fiesta', n: 'Cumpleañero', ico: '🎉', el: { arriba: 'camiseta_corazon#f2c94c#c46bd6', abajo: 'overol#8ec5f0#f6f2ea', pies: 'tenis#e85d5d#f6f2ea', cabeza: 'gorro_fiesta#6c5ce7#f2c94c', collar: 'bolitas' } },
  { id: 'escuela', n: 'Pa’l colegio', ico: '🎒', el: { arriba: 'camisa#f4efe6#2a4f9e', abajo: 'pantalon#2a4f9e#4a4a52', pies: 'zapatos#1d1d24#1d1d24', espalda: 'mochila#e85d5d#2a4f9e' },
    ella: { arriba: 'blusa#f4efe6#2a4f9e', abajo: 'falda#2a4f9e#4a4a52', pies: 'zapatos#1d1d24#1d1d24', espalda: 'mochila#f28bb5#2a4f9e', cabeza: 'diadema_mono#2a4f9e' } },
  { id: 'bailarina', n: 'Bailarín de ballet', ico: '🩰', el: { arriba: 'camiseta#ffd1dc', abajo: 'jogger#ffd1dc#f6f2ea', pies: 'sandalias#ffd1dc#f6f2ea' },
    ella: { arriba: 'blusa#ffd1dc#f28bb5', abajo: 'tutu#ffd1dc', pies: 'sandalias#ffd1dc#f6f2ea', cabeza: 'tiara#f2c14e#ffd1dc', aretes: 'perla', peinado: 'pelo_mono' } },
  { id: 'rey', n: 'Realeza', ico: '👑', el: { arriba: 'saco_corbata#6c5ce7#f2c14e', abajo: 'pantalon#1d1d24#4a4a52', pies: 'botas#1d1d24#a3a3a8', cabeza: 'corona#f2c14e#c2354a', espalda: 'capa#c2354a#f2c14e' },
    ella: { arriba: 'vestido_princesa#c2354a#f2c14e', pies: 'tacones#f2c14e#2a2626', cabeza: 'corona#f2c14e#7a5cf0', espalda: 'capa#6c5ce7#f2c14e', aretes: 'gota#c2354a', collar: 'gema#c2354a' } },
];

/** Las prendas de un conjunto para este cuerpo (las que no le sirvan se saltan). */
export function pintaDe(c: Conjunto, cuerpo: Cuerpo): Pinta {
  const p = (cuerpo === 'ella' ? c.ella : undefined) ?? c.el;
  const r: Pinta = {};
  for (const [k, v] of Object.entries(p)) {
    const ranura = RANURAS_AMIGO.find((x) => CLAVE[x] === k);
    if (ranura) {
      if (piezaDe(v, ranura, cuerpo)) r[k] = v;
    } else r[k] = v;
  }
  return r;
}

/** Pone un conjunto encima de un perfil: cambia toda la ropa y los accesorios (el peinado solo si el conjunto trae). */
export function ponerConjunto(perfil: PerfilAmigo, c: Conjunto): PerfilAmigo {
  const t = { ...perfil.traje };
  for (const r of RANURAS_AMIGO) if (r !== 'pelo') delete t[CLAVE[r]];
  delete t.aretes;
  delete t.collar;
  return { ...perfil, traje: { ...t, ...pintaDe(c, perfil.cuerpo) } };
}

// ------------------------------------------------------------------------------------------------ Al azar
const uno = <T,>(l: readonly T[]) => l[Math.floor(Math.random() * l.length)];
const quizas = (p: number) => Math.random() < p;

/** Un color que combine con la base: el mismo tono más claro, el complementario o un neutro. */
function combina(base: string): string {
  const neutros = ['#f4efe6', '#1d1d24', '#4a4a52', '#d8c3a5', '#8a8f98'];
  if (quizas(0.4)) return uno(neutros);
  const n = parseInt(base.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  if (quizas(0.5)) return `#${[255 - r, 255 - g, 255 - b].map((v) => Math.round(v * 0.85 + 30).toString(16).padStart(2, '0')).join('')}`;
  return `#${[r, g, b].map((v) => Math.round(v + (255 - v) * 0.55).toString(16).padStart(2, '0')).join('')}`;
}

function prendaAlAzar(r: RanuraAmigo, cuerpo: Cuerpo, grupos?: string[]): string | undefined {
  const l = MODELOS.filter((m) => m.r === r && m.para.includes(cuerpo) && (!grupos || grupos.includes(m.g)));
  if (!l.length) return undefined;
  const m = uno(l);
  const pp = m.pp ?? [];
  if (r === 'pelo') return valorPieza(m.m, null, pp[1] ? uno(ROPAS) : null);
  // A veces los colores de una variante del clóset; si no, uno de la paleta y otro que combine
  if (m.mu?.length && quizas(0.45)) {
    const [a, b] = uno(m.mu);
    return valorPieza(m.m, a, b);
  }
  if (!pp.length) return m.m;
  const c1 = uno(ROPAS);
  return valorPieza(m.m, c1, pp[1] ? combina(c1) : null);
}

/** Una pinta al azar que combina (mismo nombre y cuerpo; a veces también cambia piel, pelo y ojos). */
export function alAzar(p: PerfilAmigo, todo = true): PerfilAmigo {
  const cuerpo = p.cuerpo;
  const t: Record<string, string> = {};
  if (quizas(0.7)) t.peinado = prendaAlAzar('pelo', cuerpo) ?? '';
  // Arriba: a veces un vestido o un enterizo (que también tapa abajo)
  const arriba = prendaAlAzar('arriba', cuerpo, quizas(0.18) ? ['vestidos', 'enterizos'] : ['camisetas', 'abrigos', 'camisas']);
  if (arriba) t.arriba = arriba;
  const tapaAbajo = !!arriba && !!piezaDe(arriba, 'arriba', cuerpo)?.tambien.includes('abajo');
  if (!tapaAbajo) t.abajo = prendaAlAzar('abajo', cuerpo) ?? '';
  t.pies = prendaAlAzar('pies', cuerpo, quizas(0.15) ? ['pantuflas'] : ['zapatos', 'botas']) ?? '';
  if (quizas(0.5)) t.cabeza = prendaAlAzar('cabeza', cuerpo, quizas(0.3) ? ['capuchas', 'orejas'] : ['gorros', 'sombreros', 'brillos']) ?? '';
  if (quizas(0.3)) t.cara = prendaAlAzar('cara', cuerpo, ['gafas']) ?? '';
  if (quizas(0.18)) t.espalda = prendaAlAzar('espalda', cuerpo) ?? '';
  if (quizas(0.1)) t.cola = prendaAlAzar('cola', cuerpo) ?? '';
  if (quizas(cuerpo === 'ella' ? 0.6 : 0.25)) t.aretes = `${uno(Object.keys(ARETES))}`;
  if (quizas(0.25)) t.collar = `${uno(Object.keys(COLLARES))}`;
  for (const k of Object.keys(t)) if (!t[k]) delete t[k];
  // La cara de siempre se queda, salvo que sea «todo al azar»
  for (const k of ['ojos', 'cejas', 'rubor', 'medias']) if (p.traje[k]) t[k] = p.traje[k];
  const nuevo: PerfilAmigo = { ...p, traje: t, ropa: uno(ROPAS), ropa2: uno([ROPAS[10], ROPAS[20], ROPAS[21], ROPAS[16], ROPAS[17]]), zapatos: uno(ROPAS) };
  if (todo) {
    nuevo.piel = uno(PIELES);
    nuevo.pelo = quizas(0.75) ? uno(PELOS.slice(0, 14)) : uno(PELOS);
    t.ojos = uno(OJOS);
    if (quizas(0.3)) t.rubor = uno(RUBORES);
  }
  return nuevo;
}
