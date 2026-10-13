// El guion de la música y de los efectos (Eleven Music y Sound Effects de ElevenLabs): qué suena en cada juego.
// Lo genera scripts/musica-ia.mjs (docs/sistemas/musica.md). Cambiar un texto aquí rehace solo esa pista.
//
// Pistas: { id, juego, nombre, seg, bucle, pareja?, tomas?, prompt } (instrumental) o { …, plan, letra } (canción).
// - bucle: se repite con un cambio suave al final (las de jugar); false para canciones y remates cortos.
// - pareja: solo va en la versión de Javier y Laura (la app de amigos no la lleva).
// - tomas: cuántas versiones se generan para quedarse con la mejor (en las canciones, la que mejor se le entiende la letra).
// Javier pidió (11 de octubre de 2026): Sangre y Ceniza y Lavarse la cara con rock electrónico pesado o metal, sin
// letra; canciones con letra solo en la casa, Cien Puertas, el súper, el cohete y la cocina.

/** Lo que se le pide a toda pista de jugar: que se pueda repetir sin que se note. */
const BUCLE = 'Instrumental only, no vocals. Steady energy from the first second to the last: no intro build-up, no ending, no fade out, so it can loop seamlessly. Polished, professional video game soundtrack mix.';
const REMATE = 'Instrumental only, no vocals. A very short video game jingle (stinger), clean ending.';
const i = (id, juego, nombre, seg, estilo, extra = {}) => ({ id, juego, nombre, seg, bucle: true, prompt: `${estilo} ${BUCLE}`, ...extra });
const r = (id, juego, nombre, seg, estilo, extra = {}) => ({ id, juego, nombre, seg, bucle: false, prompt: `${estilo} ${REMATE}`, ...extra });
/** Una parte de canción: [nombre, segundos, letra, estilos]. */
const c = (nombre, seg, letra, estilos = []) => ({ nombre, seg, letra, estilos });

// ------------------------------------------------------------------------------------------------------ La casa
const CASA_ESTILO = 'warm acoustic Colombian pop, ukulele, nylon guitar, soft marimba, light hand percussion, cozy and happy';

export const PISTAS = [
  {
    id: 'casa-cancion', juego: 'casa', nombre: '«Nuestro Hogar»', seg: 150, bucle: false, pareja: true, tomas: 2,
    estilos: ['warm acoustic Latin pop', 'Colombian', 'ukulele', 'nylon guitar', 'soft marimba', 'hand claps', 'male and female duet vocals in Spanish', 'cozy, romantic and playful'],
    partes: [
      c('Intro', 8, '{ukelele y marimba, cálido}'),
      c('Verso 1 - voz masculina', 18, 'Abro la puerta y huele a café,\ntú cantas bajito sin saber que te escuché;\n«dime, esposa», te digo al llegar,\ny tú, con un «muak», me vuelves a ganar.', ['warm male vocal in Spanish']),
      c('Verso 1 - voz femenina', 18, 'Hay un panda dormido en mitad del sofá,\nla cobija en el piso y la tele prendida ya;\n«ay, deos, este hombre», me río al mirar…\nqué bonito es tener a dónde llegar.', ['sweet female vocal in Spanish']),
      c('Coro - dúo', 20, 'Es nuestro hogar, nuestro hogar,\ncon cuatro paredes y mil betitos más;\nsi se nos cae el cielo, lo volvemos a pintar,\nporque en tus brazos, mi amor, es nuestro hogar.', ['male and female duet', 'catchy chorus', 'hand claps']),
      c('Verso 2 - voz masculina y luego femenina', 18, 'Pulga aventurera, ¿qué aventura hiciste hoy?\nCuéntamelo todo, que aquí siempre estoy.\nTe traje un heladito y un abrazo de oso,\nmi perro lanudo, mi niño hermoso.', ['male vocal then female vocal']),
      c('Coro - dúo', 20, 'Es nuestro hogar, nuestro hogar,\ncon cuatro paredes y mil betitos más;\nsi se nos cae el cielo, lo volvemos a pintar,\nporque en tus brazos, mi amor, es nuestro hogar.', ['male and female duet', 'catchy chorus']),
      c('Puente - se contestan', 14, '¿Me amas? Shi.\n¿Oki? Okis.\nTi amu. Y yo te amodoro.', ['playful call and response', 'softer']),
      c('Coro final - dúo', 22, 'Si se nos cae el cielo, lo volvemos a pintar,\nporque en tus brazos, mi amor, es nuestro hogar.\nEs nuestro hogar, nuestro hogar.', ['male and female duet', 'big happy final chorus']),
      c('Outro', 12, '{palmas, ukelele y una risita}', ['gentle ending']),
    ],
  },
  i('casa-dia', 'casa', 'La casa de día', 150, `Warm cozy acoustic instrumental for a cute life-sim video game at home: ${CASA_ESTILO}, gentle bossa groove, 92 bpm.`),
  i('casa-noche', 'casa', 'De noche', 120, 'Soft lullaby instrumental for bedtime in a cozy video game: music box, felt piano, soft strings, very calm and tender, 70 bpm.'),
  i('casa-patio', 'casa', 'El patio', 120, 'Bright cheerful acoustic instrumental for a sunny garden in a cozy video game: acoustic guitar, flute, ukulele, light shakers, birds-like flute trills, 100 bpm.'),

  // --------------------------------------------------------------------------------------------- Súper Manía
  {
    id: 'super-cancion', juego: 'super', nombre: '«¡Súper Manía!»', seg: 75, bucle: false, tomas: 2,
    estilos: ['Colombian cumbia', 'accordion', 'guacharaca', 'bass', 'timbales', 'festive group chorus in Spanish', 'danceable and happy'],
    partes: [
      c('Intro - coro', 7, '¡Súper, súper, Súper Manía!', ['group chorus shout']),
      c('Verso 1', 16, 'Abran las puertas, que llegó la clientela:\nla señora del pan, el señor de la cazuela;\nque no falte el arroz, que no falte el café,\nque nadie se vaya sin lo que vino a ver.', ['lead vocal in Spanish']),
      c('Coro', 16, '¡Es Súper Manía, Súper Manía!\nReponga el estante, que se acaba el día;\ncobre ligerito, sonría al cliente,\nque en esta tiendita se atiende a la gente.', ['catchy group chorus']),
      c('Verso 2', 14, 'Zumban las neveras, el carrito se va,\nla abuela pregunta: «¿y el aguacate qué tal?»;\nuno corre que corre por todo el pasillo…\n¡hoy sí cerramos con plata en el bolsillo!', ['lead vocal in Spanish']),
      c('Mambo', 10, '{acordeón al frente, instrumental, gritos de fiesta}', ['accordion solo', 'instrumental']),
      c('Coro final', 12, '¡Es Súper Manía, Súper Manía!\n¡Súper, súper, Súper Manía!', ['catchy group chorus', 'clean ending']),
    ],
  },
  i('super-dia', 'super', 'Un día en el súper', 90, 'Upbeat Colombian cumbia instrumental for a busy supermarket management video game: accordion melody, guacharaca, bass, timbales, congas, festive and energetic, 100 bpm.'),
  i('super-legendario', 'super', 'Día legendario', 90, 'High-energy Colombian cumbia instrumental with brass section, accordion, fast guacharaca and timbales, triumphant and intense, for the hardest level of a supermarket video game, 112 bpm.'),
  i('super-dia100', 'super', 'Día 100: el aniversario', 90, 'Romantic slow Colombian cumbia instrumental for an anniversary celebration: warm accordion, soft guitar, gentle percussion, strings, tender and festive, 88 bpm.', { pareja: true }),
  r('super-abrir', 'super', 'Abrir el local', 4, 'Bright cumbia accordion fanfare, opening the shop doors.'),
  r('super-ganado', 'super', 'Día ganado', 5, 'Happy triumphant cumbia accordion and brass jingle, winning the day.'),
  r('super-perdido', 'super', 'Día perdido', 4, 'Comic sad accordion jingle, descending notes, losing the day.'),
  r('super-estrella', 'super', 'Una estrella', 3, 'Sparkly magical chime with a little accordion flourish, earning a star.'),

  // ---------------------------------------------------------------------------------------- Mesa de juegos
  i('mesa-menu', 'mesa', 'Menú de la mesa', 90, 'Cozy café jazz instrumental for a board game menu: Rhodes piano, upright bass, brushed drums, warm and relaxed bossa feel, 92 bpm.'),
  i('mesa-clue', 'mesa', '¿Quién fue?', 120, 'Film noir detective jazz instrumental for a mystery murder board game: muted trumpet, upright bass walking, brushed drums, piano, suspenseful but playful, 84 bpm.'),
  i('mesa-parchis', 'mesa', 'Parchís', 90, 'Light Latin salsa instrumental for a family board game: piano montuno, congas, timbales, soft brass, cheerful, 96 bpm.'),
  i('mesa-mancala', 'mesa', 'Mancala', 90, 'Calm African-inspired instrumental for a strategy board game: kalimba, marimba, djembe, shakers, warm and thoughtful, 90 bpm.'),
  i('mesa-dados', 'mesa', 'Dados', 90, 'Playful rumba flamenca instrumental for a dice game: Spanish guitar strumming, cajón, palmas, upbeat, 104 bpm.'),
  i('mesa-cajas', 'mesa', 'Cajas', 90, 'Playful lo-fi instrumental for a pen-and-paper board game: soft chiptune lead, mellow beat, plucky synth, cute and focused, 88 bpm.'),
  r('mesa-ganar', 'mesa', 'Ganar', 6, 'Joyful jazzy victory jingle with piano and brass hits.'),
  r('mesa-perder', 'mesa', 'Perder', 5, 'Funny jazzy losing jingle, sad trombone wah-wah, playful.'),

  // ------------------------------------------------------------------------------------------ Cien Puertas
  i('puertas-menu', 'puertas', 'Menú', 90, 'Magical music box instrumental for a puzzle adventure menu: celesta, music box, soft piano, light strings, tender and mysterious, 80 bpm.', { pareja: true }),
  i('puertas-cap1', 'puertas', '1 · Nuestra casa', 90, 'Gentle puzzle game instrumental inside a cozy home: felt piano and music box, soft pizzicato strings, curious and warm, 84 bpm.', { pareja: true }),
  i('puertas-cap2', 'puertas', '2 · El jardín', 90, 'Pastoral puzzle game instrumental in a sunny garden: wooden flute, acoustic guitar, harp, light percussion, playful and fresh, 92 bpm.', { pareja: true }),
  i('puertas-cap3', 'puertas', '3 · La cafetería', 90, 'Relaxed bossa nova instrumental in a little café for a puzzle game: nylon guitar, soft piano, upright bass, brushes, 88 bpm.', { pareja: true }),
  i('puertas-cap4', 'puertas', '4 · La terminal', 90, 'Gentle travel lo-fi instrumental at a bus terminal for a puzzle game: clean electric guitar, soft keys, mellow beat, nostalgic, 82 bpm.', { pareja: true }),
  i('puertas-cap5', 'puertas', '5 · La playa', 90, 'Light tropical acoustic instrumental at the Caribbean beach for a puzzle game: steel drums, acoustic guitar, marimba, soft shakers, breezy, 96 bpm.', { pareja: true }),
  i('puertas-cap6', 'puertas', '6 · El bosque de las luciérnagas', 90, 'Enchanted night forest instrumental for a puzzle game: celesta, harp, soft choir pads, glockenspiel sparkles, magical and calm, 76 bpm.', { pareja: true }),
  i('puertas-cap7', 'puertas', '7 · La feria', 90, 'Whimsical carousel waltz instrumental at a fun fair for a puzzle game: band organ, accordion, glockenspiel, oom-pah bass, playful 3/4.', { pareja: true }),
  i('puertas-cap8', 'puertas', '8 · El castillo de los cuentos', 90, 'Fairy tale castle orchestral instrumental for a puzzle game: strings, harp, woodwinds, light horns, storybook adventure, 86 bpm.', { pareja: true }),
  i('puertas-cap9', 'puertas', '9 · Entre las estrellas', 90, 'Dreamy space ambient instrumental for a puzzle game among the stars: warm synth pads, soft arpeggios, celesta, slow and wondrous, 74 bpm.', { pareja: true }),
  i('puertas-cap10', 'puertas', '10 · Nuestro hogar para siempre', 90, 'Emotional warm instrumental for the last chapter of a love story puzzle game: piano, strings, soft acoustic guitar, hopeful and tender, 78 bpm.', { pareja: true }),
  {
    id: 'puertas-final', juego: 'puertas', nombre: '«Cien Puertas»', seg: 180, bucle: false, pareja: true, tomas: 2,
    estilos: ['emotional Latin pop ballad', 'acoustic', 'piano and acoustic guitar', 'strings that grow', 'male and female duet vocals in Spanish', 'romantic, tender, cinematic ending'],
    partes: [
      c('Intro', 8, '{piano suave}', ['solo piano']),
      c('Verso 1 - voz femenina', 18, 'Te quise estafar en una villa de Transformice\ny me diste todo sin pensar;\nyo iba por las cositas de un juego cualquiera\ny tú me robaste el corazón.', ['sweet female vocal in Spanish', 'piano and guitar']),
      c('Verso 1 - voz masculina', 18, 'Te hablé de matemáticas y de filosofía,\ndijiste que nada de eso te gustaba…\ntreinta días o cuarenta, ¿quién los iba a contar?\nSi contigo el tiempo se me va.', ['warm male vocal in Spanish']),
      c('Pre-coro - dúo', 10, 'Y una noche el Olvido, un nubarrón travieso,\nse llevó nuestros recuerdos y los escondió…', ['male and female duet', 'building']),
      c('Coro - dúo', 22, 'Cien puertas, cien llaves,\ncien veces volver;\ny en cada recuerdo\nte vuelvo a querer.\nSi el Olvido regresa\nlo vamos a vencer:\ntú eres mi hogar,\nmi hogar eres tú.', ['male and female duet', 'emotional chorus', 'strings']),
      c('Verso 2 - voz femenina y luego masculina', 16, 'En Cartagena dormí en una banca de piedra\nmientras tú, en tu hotel de cinco estrellas…\n…te pensé toda la noche, te lo juro, mi amor;\nla próxima, el aeropuerto me toca a mí.', ['female vocal then male vocal', 'a little playful']),
      c('Verso 3 - voz femenina y respuesta', 16, 'Una cajita en mis manos, yo en pijama,\ny una vocecita: «es el anillo, es el anillo»…\nY lloraste muchísimo.\n¡Lloré lo justo!', ['female vocal, then male and female call and response']),
      c('Coro - dúo', 22, 'Cien puertas, cien llaves,\ncien veces volver;\ny en cada recuerdo\nte vuelvo a querer.\nSi el Olvido regresa\nlo vamos a vencer:\ntú eres mi hogar,\nmi hogar eres tú.', ['male and female duet', 'emotional chorus', 'full strings']),
      c('Puente - suave', 14, 'Katherine.\nLexy Katherine.\nKatherine…\nBueno, está bien: Lexy Katherine.', ['soft, intimate call and response', 'piano only']),
      c('Final - dúo', 24, 'Nuestro cuento de hadas,\ncon final de Disney:\nfelices para siempre.\nTú eres mi hogar… mi hogar eres tú.', ['male and female duet', 'big cinematic final', 'full strings']),
      c('Outro', 12, '{piano y cuerdas, se apaga suave}', ['gentle ending']),
    ],
  },
  r('puertas-abierta', 'puertas', 'Puerta abierta', 4, 'Magical sparkling harp and chimes jingle, a door opens.', { pareja: true }),
  r('puertas-recuerdo', 'puertas', 'Recuerdo encontrado', 6, 'Tender emotional music box and strings jingle, a precious memory is found.', { pareja: true }),

  // ----------------------------------------------------------------------- Sangre y Ceniza (metal, sin letra)
  i('sangre-menu', 'sangre', 'Menú', 120, 'Dark gothic metal instrumental for a vampire survivors-like game menu: church organ, heavy distorted guitars, choir pads without words, slow and menacing, 90 bpm.'),
  i('sangre-noche', 'sangre', 'El mapa de la Noche', 90, 'Dark atmospheric industrial instrumental for a gothic world map: low synth drones, distant heavy guitars, toms, ominous bells, brooding, 80 bpm.'),
  i('sangre-batalla', 'sangre', 'La batalla', 150, 'Hard electronic rock and metal instrumental for intense action in a gothic horde survival game: heavy distorted riffs, driving drums, aggressive synths, organ stabs, 140 bpm.'),
  i('sangre-horda', 'sangre', 'La horda', 120, 'Extremely intense industrial metal instrumental for an overwhelming horde in a survival game: fast double bass drums, crushing riffs, screaming synth leads, 160 bpm.'),
  i('sangre-jefe', 'sangre', 'El jefe', 120, 'Epic symphonic metal instrumental for a vampire lord boss fight: heavy guitars, orchestra, organ, wordless choir, powerful and dramatic, 150 bpm.'),
  r('sangre-final', 'sangre', 'Final de la Noche', 30, 'Epic emotional symphonic metal instrumental finale: soaring guitar solo over orchestra and organ, triumphant and bittersweet, with a big ending.'),

  // ----------------------------------------------------------------------- Lavarse la cara (rock electrónico pesado)
  i('lavado-menu', 'lavado', 'Menú', 60, 'Hard electronic rock instrumental for an arcade survivors-like game menu: heavy guitars, punchy drums, retro synth lead, catchy and energetic, 130 bpm.'),
  i('lavado-partida', 'lavado', 'La partida', 150, 'Driving hard electronic rock instrumental for a fast arcade horde shooter: heavy palm-muted riffs, energetic drums, chiptune-like synth leads, relentless, 145 bpm.'),
  i('lavado-intensa', 'lavado', 'La partida, a tope', 120, 'Heavy electronic metal instrumental, faster and more intense, for the late waves of an arcade horde shooter: double bass drums, distorted riffs, screaming synth, 160 bpm.'),
  // Rotan con la de la partida y la intensa para no oír siempre la misma (src/casa/lavado/sonidos.ts)
  i('lavado-partida2', 'lavado', 'La partida · 2', 120, 'Upbeat synthwave metal instrumental for a fast arcade horde shooter: driving retro synth arpeggios over chunky distorted guitars, punchy electronic drums, bright and fun, 140 bpm.'),
  i('lavado-partida3', 'lavado', 'La partida · 3', 120, 'Energetic pop-punk electronic rock instrumental for a cartoon arcade shooter: fast power chords, bouncy bass, 8-bit chiptune melody on top, playful and catchy, 150 bpm.'),
  i('lavado-partida4', 'lavado', 'La partida · 4', 120, 'Groovy industrial electronic rock instrumental for an arcade survivors game: stomping beat, crunchy bass synth, staccato guitar riffs, funky and heavy at the same time, 128 bpm.'),
  i('lavado-intensa2', 'lavado', 'La partida, a tope · 2', 120, 'Fast djent electronic metal instrumental for the late waves of an arcade horde shooter: tight low riffs, glitchy synths, blast-beat bursts, exciting but not dark, 165 bpm.'),
  i('lavado-intensa3', 'lavado', 'La partida, a tope · 3', 120, 'Speed metal meets drum and bass instrumental for the frantic final waves of an arcade game: shredding guitar leads, rolling breakbeats, heroic synth stabs, 170 bpm.'),
  i('lavado-jefe', 'lavado', 'El jefe', 120, 'Heavy metal boss battle instrumental for an arcade game: crushing riffs, epic guitar leads, pounding drums, dramatic, 150 bpm.'),
  r('lavado-victoria', 'lavado', 'Victoria', 6, 'Triumphant electric guitar and synth victory riff, rock.'),
  r('lavado-derrota', 'lavado', 'Derrota', 5, 'Short heavy guitar game over riff, descending, a little funny.'),

  // ------------------------------------------------------------------------------------------- Retrete cohete
  {
    id: 'cohete-cancion', juego: 'cohete', nombre: '«Del baño a la NASA»', seg: 60, bucle: false, tomas: 2,
    estilos: ['comedy cumbia ska', 'space theme', 'trumpets', 'retro synthesizer', 'upbeat lead vocal and group chorus in Spanish', 'funny and energetic'],
    partes: [
      c('Intro', 5, '{trompetas y sintetizador espacial}', ['instrumental']),
      c('Verso', 16, 'Me senté tranquilo, todo iba normal,\nleyendo el champú, que es lo usual;\nde pronto el inodoro empezó a temblar…\n¡tres, dos, uno… y a despegar!', ['lead vocal in Spanish', 'funny']),
      c('Coro', 16, '¡Del baño a la NASA, del baño a la NASA!\nCon el rollo de papel y sin salir de la casa;\nesquivando asteroides, saludando a la Luna,\n¡el primer astronauta que salió de la taza!', ['catchy group chorus']),
      c('Solo', 9, '{solo de trompetas}', ['trumpet solo', 'instrumental']),
      c('Coro final', 14, '¡Del baño a la NASA, del baño a la NASA!\n¡El primer astronauta que salió de la taza!', ['catchy group chorus', 'clean ending']),
    ],
  },
  i('cohete-tramo0', 'cohete', 'El barrio', 60, 'Cheerful cumbia pop instrumental for the take-off over the neighborhood in a funny flying game: accordion, synth, bright percussion, 108 bpm.'),
  i('cohete-tramo1', 'cohete', 'La órbita', 60, 'Floating spacey instrumental for orbit in a funny flying game: warm synth pads, light arpeggios, soft beat, 96 bpm.'),
  i('cohete-tramo2', 'cohete', 'La Luna', 60, 'Dreamy waltz instrumental on the Moon for a flying game: celesta, soft synths, gentle strings, 3/4.'),
  i('cohete-tramo3', 'cohete', 'Marte', 60, 'Tense rock instrumental on Mars for a flying game: driving electric guitars, tribal toms, red desert mood, 120 bpm.'),
  i('cohete-tramo4', 'cohete', 'El cinturón de asteroides', 60, 'Epic driving instrumental through an asteroid belt in a flying game: orchestral hits, fast drums, synth bass, heroic, 132 bpm.'),
  i('cohete-tramo5', 'cohete', 'La nebulosa', 60, 'Bright synthwave instrumental inside a colorful nebula in a flying game: retro synths, gated drums, shimmering arpeggios, 110 bpm.'),
  i('cohete-tramo6', 'cohete', 'La galaxia del amor', 60, 'Romantic synth ballad instrumental in a pink galaxy for a flying game: warm pads, soft electric piano, gentle beat, dreamy, 84 bpm.'),

  // ---------------------------------------------------------------------------------------- Cocina de chef
  {
    id: 'cocina-cancion', juego: 'cocina', nombre: '«Hecho con amor»', seg: 60, bucle: false, tomas: 2,
    estilos: ['happy jazz swing bossa', 'piano', 'upright bass', 'brushed drums', 'playful female lead vocal with group chorus in Spanish', 'restaurant'],
    partes: [
      c('Intro', 6, '{piano y contrabajo}', ['instrumental']),
      c('Verso', 16, 'Una pizca de canela, un poquito de sal,\nla estufa prendida y la fila en el portal;\nwafles doraditos, fresas con su crema,\nun frappé bien frío, ¡y aquí no hay problema!', ['playful female lead vocal in Spanish']),
      c('Coro', 16, 'Hecho con amor, hecho con amor,\ncada plato que sale lleva su sabor;\nsi se quema un poquito, se arregla con humor:\n¡en esta cocina todo es hecho con amor!', ['catchy chorus with group vocals']),
      c('Solo', 8, '{solo de piano}', ['piano solo', 'instrumental']),
      c('Coro final', 14, 'Hecho con amor, hecho con amor,\n¡en esta cocina todo es hecho con amor!', ['catchy chorus', 'clean ending']),
    ],
  },
  i('cocina-wafles', 'cocina', 'Wafles', 90, 'Cheerful gypsy jazz manouche instrumental for a cooking game making waffles: acoustic swing guitar, violin, upright bass, 120 bpm.'),
  i('cocina-fresas', 'cocina', 'Fresas con crema', 90, 'Sweet pop bossa instrumental for a cooking game with strawberries and cream: soft electric piano, nylon guitar, light percussion, 100 bpm.'),
  i('cocina-frappes', 'cocina', 'Frappés', 90, 'Chill lo-fi café instrumental for a cooking game making iced coffee: mellow keys, vinyl texture, soft hip hop beat, 86 bpm.'),
  i('cocina-pico', 'cocina', 'Hora pico', 60, 'Fast busy kitchen swing instrumental for the rush hour of a cooking game: big band brass, walking bass, fast drums, 150 bpm.'),

  // ---------------------------------------------------------------------------------------- Sala de amigos
  i('amigos-sala', 'amigos', 'Sala de juegos', 90, 'Happy upbeat pop instrumental for a friends game lobby: bright guitars, claps, synth plucks, friendly and fun, 112 bpm.'),

  // ---------------------------------------------------------------------------------------- Cine de la granja
  // Las películas de la historia principal (src/granja-v3/cine-*.ts). Javier pidió (12 de octubre de 2026) que todo
  // lo de las diosas suene «armonioso y celestial». No van en bucle: acompañan la película de principio a fin.
  // El prólogo se queda con M12 («Heaven Theme Loop») y M13 («First Light Particles»), CC0, de la granja: a Javier le
  // gustaron (12 de octubre de 2026). Las demás películas usan la pieza de su cinemática (MUSICA_ESCENAS_ASTRA).
  // La boda de la película de Astra (docs/en-obra/pelicula-de-astra.md, capítulo 4): no había nada gratuito a la altura
  // del final, así que se compone. Un solo tema de amor que nace en la ceremonia, baila en la fiesta y vuelve en los
  // créditos.
  {
    id: 'cine-boda-ceremonia', juego: 'granja', nombre: 'La boda · Ceremonia en Eterna', seg: 150, bucle: false, pareja: true,
    prompt: 'Romantic cinematic wedding score for the finale of an animated fantasy film set in a tropical garden by a river at sunset. Opens with soft nylon guitar and warm strings as guests arrive with lanterns; glass celesta and harp sparkles as goddesses light candles and bloom a rose arch; a tender, unforgettable main love theme on solo piano and cello as the bride walks down the candlelit aisle; a calm, reverent passage with soft wordless female choir while the ceremony is blessed; then a radiant full-orchestra swell with choir as a constellation of two joined hands lights up the night sky; ends on a warm, luminous held chord. 66 bpm, emotional, heartfelt, instrumental only, no lyrics.',
  },
  {
    id: 'cine-boda-fiesta', juego: 'granja', nombre: 'La boda · La fiesta', seg: 90, bucle: false, pareja: true,
    prompt: 'Warm, joyful wedding party music for an animated film: a gentle slow-dance waltz version of a romantic love theme, Colombian-flavored with nylon guitar, soft marimba, light hand percussion, strings and accordion-like warmth; cozy fairy lights, a long table under a pavilion, friends toasting; ends softly as the couple walks alone to a riverside bonfire. 92 bpm in 3/4, heartfelt and playful, instrumental only, no lyrics.',
  },
  {
    id: 'cine-boda-creditos', juego: 'granja', nombre: 'La boda · Créditos «Siempre te elegiré»', seg: 120, bucle: false, pareja: true,
    prompt: 'End credits theme for an animated fantasy love story: begins with a solo piano statement of a tender love theme under a starry night, then grows with warm strings, harp and celesta, a soft wordless choir and a hopeful, sweeping orchestral climax remembering a whole journey across worlds, finally returning to a quiet piano and a gentle morning feeling with a simple acoustic guitar; ends with a soft, resolved final chord. 70 bpm, nostalgic, grateful, deeply romantic, instrumental only, no lyrics.',
  },
];

// ------------------------------------------------------------------------------------- Efectos de sonido
// Los de las reacciones de la mesa y de las escenas premium (src/reacciones/sonidos.ts): mismo nombre, sonido de
// verdad. Muñequitos de peluche: todo con tono de caricatura, tierno y sin palabras.
const P = 'cute cartoon, for a cozy plush toy video game';
export const EFECTOS = {
  tin: [1.2, `Sparkly magic chime twinkle, ${P}`],
  pop: [0.6, `Short bubbly pop sound, ${P}`],
  boing: [1, `Springy cartoon boing bounce, ${P}`],
  si: [0.8, `Positive two-note confirmation ding, ${P}`],
  sacudir: [0.8, `Quick cloth shake rustle, ${P}`],
  musiquita: [1.6, `Happy short xylophone melody flourish, ${P}`],
  fanfarria: [2, `Short triumphant trumpet fanfare, ${P}`],
  puchero: [1.2, `Cute cartoon pouting whimper sound, high pitched, no words, ${P}`],
  plaf: [0.6, `Soft cartoon slap thud, comedic, ${P}`],
  wawa: [2, `Sad trombone wah wah wah waaah, comedic failure, ${P}`],
  duda: [0.8, `Questioning cartoon hmm two-note sound, ${P}`],
  gota: [0.5, `Single water droplet plip, ${P}`],
  uf: [1, `Relieved exhale whoosh, soft, ${P}`],
  enojo: [1, `Cartoon angry grumble steam puff, no words, ${P}`],
  pisoton: [0.6, `Cartoon foot stomp on wooden floor, ${P}`],
  hmph: [0.8, `Cute cartoon character huffing hmph, no words, ${P}`],
  sorpresa: [0.8, `Cartoon surprise gasp whoosh up, ${P}`],
  palmada: [0.5, `Light hand clap, ${P}`],
  palmada_fuerte: [1, `Big enthusiastic high five slap with sparkle, ${P}`],
  risita: [1.2, `Cute high pitched cartoon giggle, plush toy character, no words, ${P}`],
  carcajada: [2, `Cute cartoon character belly laughing hard, plush toy, no words, ${P}`],
  frotar: [1.2, `Hands rubbing together mischievously, ${P}`],
  beso: [0.6, `Cute cartoon smooch kiss mwah sound, ${P}`],
  corazon: [1, `Sweet romantic heart sparkle chime, ${P}`],
  abrazo: [1.2, `Warm soft hug squeeze with gentle sparkle, ${P}`],
  idea: [0.8, `Light bulb idea ding, ${P}`],
  tictac: [1.2, `Clock ticking tick tock, ${P}`],
  tic: [0.5, `Single soft UI tick, ${P}`],
  bostezo: [1.6, `Cute cartoon sleepy yawn, plush toy, no words, ${P}`],
  agitar: [1, `Shaking maracas-like rattle, ${P}`],
  soplo: [1, `Gentle blowing air puff, ${P}`],
  llanto: [2, `Cute exaggerated cartoon crying waaah, plush toy, no words, ${P}`],
  porque: [1.2, `Dramatic cartoon why moan slide down, no words, ${P}`],
  rendirse: [1.6, `Defeated descending three note jingle, comedic, ${P}`],
  otra: [0.8, `Eager two-note again jingle, ${P}`],
  desmayo: [1.4, `Dramatic cartoon fainting slide whistle down and soft thud, ${P}`],
  flash: [0.6, `Camera flash click and pop, ${P}`],
  guitarra: [2, `Romantic acoustic guitar strum chord, ${P}`],
  almohadazo: [0.7, `Soft pillow hit whump with feathers, ${P}`],
  splash: [1, `Playful water splash, ${P}`],
  pasos: [1.2, `Cartoon tiptoe footsteps, ${P}`],
  tada: [1.4, `Ta-da reveal fanfare with sparkle, ${P}`],
  huida: [1.4, `Cartoon running away scramble footsteps zoom, ${P}`],
};
