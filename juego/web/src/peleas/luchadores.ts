// Los luchadores del Torneo del Despertar Dorado que ve cualquiera (también los amigos): las dos Santas del pueblo,
// dos vecinos de Astra (Tarek de Brasaviva y Otto de Nieveclara), dos vecinos disfrazados con las máscaras de feria
// del Conde y de Vael'Thor, el Dragón de Trapo y «el retador» (el muñeco de quien juega en la sala de amigos).
// Javier y Laura van aparte, en `pareja.ts` (la versión para amigos lo cambia por uno vacío).
// Cada uno con su estilo: números, alcance, especial y súper propios, y lo que dice (con voz en public/audio/peleas/).
import { aliento, contra, cuerda, embestida, lluvia, niebla, normales, ola, proyectil, rafaga, rayo, trampa, voladora } from './golpes';
import { PAREJA_LUCHADORES, ORDEN_PAREJA } from './pareja';
import type { DefLuchador, Frase, FrasesLuchador } from './tipos';

const f = (id: string, t: string, d?: string): Frase => ({ id, t, d });

/** Las frases de un luchador con sus ids estables (`<luchador>.<clave><n>`). */
function frases(id: string, o: { entrada: [string, string?][]; especial: [string, string?]; super: [string, string?]; victoria: [string, string?][]; derrota: [string, string?]; gana?: [string, string?] }): FrasesLuchador {
  return {
    entrada: o.entrada.map(([t, d], i) => f(`${id}.entrada${i + 1}`, t, d)),
    especial: [f(`${id}.especial`, o.especial[0], o.especial[1])],
    super: [f(`${id}.super`, o.super[0], o.super[1])],
    victoria: o.victoria.map(([t, d], i) => f(`${id}.victoria${i + 1}`, t, d)),
    derrota: [f(`${id}.derrota`, o.derrota[0], o.derrota[1])],
    gana: o.gana ? f(`presentador.gana_${id}`, o.gana[0], o.gana[1]) : undefined,
  };
}

export const ELIANA: DefLuchador = {
  id: 'eliana', nombre: 'Eliana', titulo: 'La Santa del Alba', estilo: 'A distancia: chispas doradas y un rayo de sol', color: '#f2b632', cuerpo: 'ella',
  aspecto: { cuerpo: 'ella', piel: '#f6d7c1', pelo: '#f0d48a', detalles: { peinado: 'pelo_ondas#f0d48a', cabeza: 'aureola#ffe39a', arriba: 'vestido_princesa#f6e2a8#ffffff', pies: 'sandalias#e8c77a', espalda: 'alas_angel#ffffff', ojos: '#c9822a' } },
  brillo: '#ffd98a', vida: 1240, velocidad: 3.0, salto: 12.8, peso: 1.05, aguante: 380,
  golpes: { ...normales({ fuerza: 0.92, alcance: 1.05, efecto: 'luz' }), especial: proyectil('Chispa del alba', 'luz', { dano: 58, vel: 8.8 }), super: rayo('Despertar Dorado', 'luz', 285) },
  poses: { entrada: 'saludo_a', victoria: ['celebrar', 'baile_a'], derrota: 'triste' }, voz: 'eliana',
  frases: frases('eliana', {
    entrada: [['¡Que el sol de Aura nos encuentre despiertos!', '[bright, joyful] ¡Que el sol de Aura nos encuentre despiertos!'], ['Hoy se siembra… ¡y se pelea con alegría!', '[playful] Hoy se siembra… [excited] ¡y se pelea con alegría!']],
    especial: ['¡Chispa del alba!', '[energetic shout] ¡Chispa del alba!'], super: ['¡Despierta, oro de la mañana!', '[powerful, radiant] ¡Despierta, oro de la mañana!'],
    victoria: [['¡Eso fue un brote bien regado!', '[laughs, cheerful] ¡Eso fue un brote bien regado!'], ['Aura sonríe. Yo también.', '[warm, satisfied] Aura sonríe. Yo también.']],
    derrota: ['Ay… se me quemó el pan de miel.', '[sighs, embarrassed] Ay… se me quemó el pan de miel.'], gana: ['¡Gana Eliana!', '[announcer, excited] ¡Gana Eliana!'],
  }),
};

export const SERENA: DefLuchador = {
  id: 'serena', nombre: 'Serena', titulo: 'La Santa de la Calma', estilo: 'Contraataque: espera tu golpe y te lo devuelve', color: '#8a72d6', cuerpo: 'ella',
  aspecto: { cuerpo: 'ella', piel: '#e5b48f', pelo: '#2a2238', detalles: { peinado: 'pelo_flequillo#2a2238', cabeza: 'tiara#c9b6ea', arriba: 'vestido#5d4f8a#c9b6ea', pies: 'botas#3a2f4a', espalda: 'capa#3a2f5c', ojos: '#6b55a8' } },
  brillo: '#c9b2ff', vida: 1300, velocidad: 2.9, salto: 12.2, peso: 0.95, aguante: 430,
  golpes: { ...normales({ fuerza: 0.98, efecto: 'lirio' }), especial: contra('Velo de calma', 'lirio'), super: lluvia('Lluvia de lirios', 'lirio', 275) },
  poses: { entrada: 'reverencia', victoria: ['reverencia', 'brazos_cruzados'], derrota: 'rodillas_a' }, voz: 'serena',
  frases: frases('serena', {
    entrada: [['Respira. Esto va a ser rápido.', '[calm, confident] Respira. Esto va a ser rápido.'], ['Lara me enseñó a esperar… y a no fallar.', '[serene, quietly confident] Lara me enseñó a esperar… y a no fallar.']],
    especial: ['¡Velo de calma!', '[firm, calm] ¡Velo de calma!'], super: ['Que caigan los lirios del ocaso.', '[solemn, powerful] Que caigan los lirios del ocaso.'],
    victoria: [['Descansa. Te lo ganaste.', '[gentle, kind] Descansa. Te lo ganaste.'], ['La calma también pega duro.', '[smirks] La calma también pega duro.']],
    derrota: ['Mmm… me apresuré.', '[soft sigh] Mmm… me apresuré.'], gana: ['¡Gana Serena!', '[announcer, excited] ¡Gana Serena!'],
  }),
};

export const TAREK: DefLuchador = {
  id: 'tarek', nombre: 'Tarek', titulo: 'El Toro de Brasaviva', estilo: 'Pesado: aguanta golpes y embiste como sus vacas de lava', color: '#e0572e', cuerpo: 'el',
  aspecto: { cuerpo: 'el', piel: '#a8714d', pelo: '#1f1a18', detalles: { peinado: 'pelo_rapado#1f1a18', cabeza: 'sombrero_vaquero#8a3a2a', cara: 'barba#1f1a18', arriba: 'camisa_cuadros#c4553f#2b2422', abajo: 'pantalon#6b3a2a', pies: 'botas_vaqueras#5a2a1a' } },
  escala: 1.08, vida: 1500, velocidad: 2.5, salto: 11.2, peso: 0.78, aguante: 520,
  golpes: { ...normales({ fuerza: 1.16, alcance: 1.06, lentitud: 3, efecto: 'fuego', armadura: 1 }), especial: embestida('Embestida volcánica', 'fuego', { dano: 96, vel: 9.5, armadura: 1 }), super: rafaga('Estampida de lava', 'fuego', 325) },
  poses: { entrada: 'musculo', victoria: ['musculo', 'jarras'], derrota: 'tirado' }, voz: 'tarek',
  frases: frases('tarek', {
    entrada: [['¡Ni las vacas de lava me tumban!', '[deep, booming] ¡Ni las vacas de lava me tumban!'], ['Vine a ganar y a cuidar el agua. En ese orden.', '[gruff, amused] Vine a ganar y a cuidar el agua. En ese orden.']],
    especial: ['¡Embestida volcánica!', '[roaring shout] ¡Embestida volcánica!'], super: ['¡Estampida!', '[thunderous battle cry] ¡Estampida!'],
    victoria: [['Como arrear terneros.', '[chuckles, proud] Como arrear terneros.'], ['¡Brasaviva no se arrodilla!', '[proud, loud] ¡Brasaviva no se arrodilla!']],
    derrota: ['Uf… necesito un baño termal.', '[exhausted groan] Uf… necesito un baño termal.'], gana: ['¡Gana Tarek!', '[announcer, excited] ¡Gana Tarek!'],
  }),
};

export const OTTO: DefLuchador = {
  id: 'otto', nombre: 'Otto', titulo: 'El Rescatista de Nieveclara', estilo: 'Control: atrapa de lejos con su cuerda de rescate', color: '#3d9be0', cuerpo: 'el',
  aspecto: { cuerpo: 'el', piel: '#e5b48f', pelo: '#a45a2a', detalles: { peinado: 'pelo_copete#a45a2a', cabeza: 'gorro_lana#e4574b', cara: 'barba#a45a2a', arriba: 'chaqueta#e4574b', abajo: 'pantalon#3e4248', pies: 'botas#3b2a22', espalda: 'mochila#e08a2a' } },
  vida: 1300, velocidad: 3.0, salto: 12.6, peso: 1.0, aguante: 430,
  golpes: { ...normales({ efecto: 'hielo' }), especial: cuerda('Cuerda de rescate', 'hielo'), super: ola('Avalancha', 'hielo', 275) },
  poses: { entrada: 'jarras', victoria: ['pulgares_a', 'celebrar'], derrota: 'desmayo' }, voz: 'otto',
  frases: frases('otto', {
    entrada: [['Tranquilo: sé sacar gente de los aprietos… y meterla.', '[confident, teasing] Tranquilo: sé sacar gente de los aprietos… y meterla.'], ['Cuerda lista, botas puestas.', '[energetic] Cuerda lista, botas puestas.']],
    especial: ['¡Te tengo!', '[shouting] ¡Te tengo!'], super: ['¡Avalancha!', '[huge shout] ¡Avalancha!'],
    victoria: [['Rescate completo.', '[satisfied] Rescate completo.'], ['Ahora sí, a desayunar con calma.', '[relaxed, laughing] Ahora sí, a desayunar con calma.']],
    derrota: ['Me faltó el relevo…', '[tired, rueful] Me faltó el relevo…'], gana: ['¡Gana Otto!', '[announcer, excited] ¡Gana Otto!'],
  }),
};

export const CONDE: DefLuchador = {
  id: 'conde', nombre: 'Máscara del Conde', titulo: 'Un vecino disfrazado de Conde', estilo: 'Tramposo: se esfuma en niebla y cada golpe le devuelve vida', color: '#c2273e', cuerpo: 'el',
  aspecto: { cuerpo: 'el', piel: '#ecdcd2', pelo: '#1a1418', detalles: { peinado: 'pelo_lado#1a1418', cabeza: 'corona#c9a03a', cara: 'antifaz#2a0a12', arriba: 'saco_corbata#5a1020#c9a03a', abajo: 'pantalon#1a1418', pies: 'zapatos#1a1418', espalda: 'capa#2a0a12#c9a03a', ojos: '#a01020' } },
  brillo: '#ff4a5a', vida: 1240, velocidad: 3.2, salto: 12.6, peso: 1.05, aguante: 380, roba: 0.15,
  golpes: { ...normales({ fuerza: 0.95, efecto: 'sombra' }), especial: niebla('Niebla de medianoche', 'sombra'), super: { ...lluvia('Banquete de murciélagos', 'sombra', 265), roba: 0.5 } },
  poses: { entrada: 'reverencia', victoria: ['presumir_a', 'reverencia'], derrota: 'desmayo' }, voz: 'conde',
  frases: frases('conde', {
    entrada: [['¡Tiemblen, mortales! …Uy, se me corrió el maquillaje.', '[theatrical, villainous] ¡Tiemblen, mortales! [breaks character, embarrassed] …Uy, se me corrió el maquillaje.'], ['Vengo de muy lejos… bueno, de la panadería de la esquina.', '[dramatic] Vengo de muy lejos… [casual] bueno, de la panadería de la esquina.']],
    especial: ['¡Niebla de medianoche!', '[sinister whisper] ¡Niebla de medianoche!'], super: ['¡A cenar, mis murcielaguitos!', '[evil laugh] ¡A cenar, mis murcielaguitos!'],
    victoria: [['¡Muajajá! …¿Quedó bien la risa?', '[over-the-top evil laugh] ¡Muajajá! [unsure] …¿Quedó bien la risa?'], ['La noche es mía. Hasta las nueve.', '[grand, villainous] La noche es mía. [matter-of-fact] Hasta las nueve.']],
    derrota: ['¡Mi capa! Era alquilada…', '[dismayed] ¡Mi capa! Era alquilada…'], gana: ['¡Gana la Máscara del Conde!', '[announcer, excited] ¡Gana la Máscara del Conde!'],
  }),
};

export const VAELTHOR: DefLuchador = {
  id: 'vaelthor', nombre: 'Máscara de Vael’Thor', titulo: 'Un vecino disfrazado de Ceramista', estilo: 'Trampas: deja jarrones de sombra que marean', color: '#9a5ad8', cuerpo: 'el',
  aspecto: { cuerpo: 'el', piel: '#d9c7b8', pelo: '#2a1f33', detalles: { peinado: 'pelo_lado#2a1f33', cabeza: 'sombrero_copa#2a1f33', cara: 'antifaz#f4efe6', arriba: 'saco_corbata#3a2350#b07cff', abajo: 'pantalon#2a1f33', pies: 'zapatos#1d1d24', espalda: 'capa#4b2468#e0c46a', ojos: '#b07cff' } },
  brillo: '#b07cff', vida: 1270, velocidad: 2.9, salto: 12.2, peso: 1.0, aguante: 400,
  golpes: { ...normales({ alcance: 1.05, efecto: 'porcelana' }), especial: trampa('Jarrón de sombras', 'porcelana'), super: lluvia('Laberinto de porcelana', 'porcelana', 250, 90) },
  poses: { entrada: 'brazos_cruzados', victoria: ['reverencia', 'aplauso_a'], derrota: 'rodillas_a' }, voz: 'vaelthor',
  frases: frases('vaelthor', {
    entrada: [['Bienvenido a mi laberinto… de cartón, pero laberinto.', '[mysterious, grand] Bienvenido a mi laberinto… [dry] de cartón, pero laberinto.'], ['Esta máscara la pinté yo. ¿Se nota?', '[proud, theatrical] Esta máscara la pinté yo. [curious] ¿Se nota?']],
    especial: ['¡Jarrón de sombras!', '[sly] ¡Jarrón de sombras!'], super: ['¡Que se cierre el laberinto!', '[commanding, dramatic] ¡Que se cierre el laberinto!'],
    victoria: [['Atrapado. Como en mis mejores teatros.', '[smug] Atrapado. Como en mis mejores teatros.'], ['Bravo, bravo. Para mí.', '[clapping, self-satisfied] Bravo, bravo. Para mí.']],
    derrota: ['Se me rompió el jarrón… y el orgullo.', '[deflated] Se me rompió el jarrón… y el orgullo.'], gana: ['¡Gana la Máscara de Vael’Thor!', '[announcer, excited] ¡Gana la Máscara de Vael’Thor!'],
  }),
};

export const DRAGON: DefLuchador = {
  id: 'dragon', nombre: 'Dragón de Trapo', titulo: 'Un vecino con disfraz de dragón', estilo: 'Fuego de cerca: un aliento que pega varias veces', color: '#4fae5a', cuerpo: 'el',
  aspecto: { cuerpo: 'el', piel: '#e5b48f', pelo: '#3b2a22', detalles: { peinado: 'pelo_copete#3b2a22', cabeza: 'capucha_dragon#4fae5a#f2c94c', arriba: 'enterizo_dragon#4fae5a#f2c94c', pies: 'pantuflas_dragon#4fae5a', cola: 'cola_dragon#4fae5a#f2c94c', espalda: 'alas_dragon#3f8f4a' } },
  vida: 1270, velocidad: 3.0, salto: 12.6, peso: 1.05, aguante: 410,
  golpes: { ...normales({ fuerza: 1.02, efecto: 'fuego' }), especial: aliento('Aliento de dragón', 'fuego'), super: rayo('Rugido de fuego', 'fuego', 280) },
  poses: { entrada: 'enojo_a', victoria: ['baile_a', 'celebrar'], derrota: 'llorar_a' }, voz: 'dragon',
  frases: frases('dragon', {
    entrada: [['¡Grrraaar! Soy un dragón de verdad, no pregunten.', '[playful roar] ¡Grrraaar! [insistent] Soy un dragón de verdad, no pregunten.'], ['Este disfraz me lo cosió mi abuela. ¡Cuidado!', '[proud, cheeky] Este disfraz me lo cosió mi abuela. ¡Cuidado!']],
    especial: ['¡Aliento de dragón!', '[shouting] ¡Aliento de dragón!'], super: ['¡Rugido de fuego!', '[huge roar] ¡Rugido de fuego!'],
    victoria: [['¡Grrraaar! ¡Gané!', '[excited roar] ¡Grrraaar! ¡Gané!'], ['Los dragones también bailan.', '[giggles] Los dragones también bailan.']],
    derrota: ['Se me cayó la cola…', '[whiny] Se me cayó la cola…'], gana: ['¡Gana el Dragón de Trapo!', '[announcer, excited] ¡Gana el Dragón de Trapo!'],
  }),
};

/** El retador: el muñeco de quien juega en la sala de amigos (sin voz: es cada uno). */
export function retador(nombre: string): DefLuchador {
  return {
    id: 'retador', nombre, titulo: 'El retador', estilo: 'Equilibrado: de todo un poco y una ráfaga de estrellas', color: '#ff7aa8', cuerpo: 'el', aspecto: 'jugador',
    vida: 1300, velocidad: 3.3, salto: 13, peso: 1.0, aguante: 430,
    golpes: { ...normales({}), especial: proyectil('Estrella fugaz', 'estrella', { dano: 60, vel: 8.2 }), super: rafaga('Ráfaga estelar', 'estrella', 300) },
    poses: { entrada: 'saludo_a', victoria: ['celebrar', 'trofeo'], derrota: 'triste' },
    frases: { entrada: [], especial: [], super: [], victoria: [], derrota: [] },
  };
}

/** Los luchadores de todos (los de la pareja se suman en su versión). */
export const COMUNES: DefLuchador[] = [ELIANA, SERENA, TAREK, OTTO, CONDE, VAELTHOR, DRAGON];

/**
 * El elenco que se puede escoger. Con la pareja (y sin amigos a la vista): Javier, Laura, las Santas, Tarek, Otto y
 * las dos máscaras. En modo neutro (amigos): el retador (su propio muñeco), el Dragón de Trapo y los demás.
 */
export function elenco(neutro: boolean, nombreRetador = 'Tú'): DefLuchador[] {
  const por = new Map([...COMUNES, ...PAREJA_LUCHADORES].map((d) => [d.id, d]));
  if (!neutro && PAREJA_LUCHADORES.length) return ORDEN_PAREJA.map((id) => por.get(id)!).filter(Boolean);
  return [retador(nombreRetador), DRAGON, ELIANA, SERENA, TAREK, OTTO, CONDE, VAELTHOR];
}

/** La escalera del modo arcade: seis rivales, de menos a más (el último, la Máscara de Vael’Thor o quien toque). */
export function escalera(elegido: string, lista: DefLuchador[]): DefLuchador[] {
  const orden = ['otto', 'dragon', 'tarek', 'serena', 'eliana', 'el', 'ella', 'conde', 'vaelthor'];
  const rivales = lista.filter((d) => d.id !== elegido && d.id !== 'retador');
  rivales.sort((a, b) => orden.indexOf(a.id) - orden.indexOf(b.id));
  // En la versión de la pareja, el otro de los dos sale de penúltimo (la pelea «de la casa»)
  const otro = rivales.findIndex((d) => (elegido === 'el' && d.id === 'ella') || (elegido === 'ella' && d.id === 'el'));
  if (otro >= 0) rivales.splice(rivales.length - 1, 0, ...rivales.splice(otro, 1));
  return rivales.slice(-6);
}

/** Todas las frases con voz de los luchadores comunes (las usa scripts/peleas/voces.mjs). */
export function frasesComunes(): { quien: string; f: Frase }[] {
  const out: { quien: string; f: Frase }[] = [];
  for (const d of COMUNES) {
    const F = d.frases;
    for (const fr of [...F.entrada, ...F.especial, ...F.super, ...F.victoria, ...F.derrota]) out.push({ quien: d.voz!, f: fr });
    if (F.gana) out.push({ quien: 'presentador', f: F.gana });
  }
  return out;
}
