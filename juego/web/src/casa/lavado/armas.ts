// Las armas y las pasivas de «Lavarse la cara»: las del Vampire Survivors original, una por una, con su mismo
// comportamiento, sus ocho niveles y su evolución, pero de aseo y de pareja (la toalla es el látigo, las burbujas
// la varita, el cepillo de dientes los cuchillos, el champú el hacha…). Las cifras están en unidades del mapa
// (el personaje camina 130 por segundo y la pantalla del celular muestra unas 780 × 360).
import type { IdArma, IdPasiva, Stat } from './tipos';

/** Cómo se comporta cada arma (el arma del original en que se inspira). */
export type Comp =
  | 'latigo' // Whip: golpe horizontal que alterna de lado
  | 'varita' // Magic Wand: al enemigo más cercano
  | 'cuchillo' // Knife: hacia donde se mira
  | 'hacha' // Axe: sube y cae en parábola
  | 'cruz' // Cross: va, frena y vuelve (bumerán)
  | 'biblia' // King Bible: le da vueltas al personaje
  | 'fuego' // Fire Wand: ráfaga fuerte hacia un enemigo al azar
  | 'ajo' // Garlic: aura que pega y empuja
  | 'agua' // Santa Water: botellitas que dejan charcos
  | 'runa' // Runetracer: rebota en los bordes de la pantalla
  | 'rayo' // Lightning Ring: rayos sobre enemigos al azar
  | 'pentagrama' // Pentagram: borra la pantalla
  | 'pajaro' // Peachone / Ebony Wings: pájaros que bombardean dando vueltas lejos
  | 'gato' // Gatti Amari: animalitos que corretean
  | 'cancion' // Song of Mana: columna vertical
  | 'reloj' // Clock Lancet: haz que congela
  | 'pistola' // Phiera / Eight the Sparrow: disparos en direcciones fijas
  | 'espiral' // Death Spiral
  | 'laser' // Phieraggi
  // Versión 2
  | 'chancla' // Shadow Pinion: huellitas al caminar que salen disparadas al frenar
  | 'tajo' // Vento Sacro: tajos adelante, más seguido y más fuertes mientras más camine sin parar
  | 'plancha' // Victory Sword: combo de tajos al más cercano y contraataque al recibir un golpe
  | 'vapor' // Flames of Misspell: conos de vapor hacia donde se mira
  | 'mariposa' // Pako Battiliar: bandadas que cruzan la pantalla (y salen más cuando le quitan vida)
  | 'pistolaAgua' // Ammo Appalate: al que esté adelante; si no hay nadie, guarda los tiros
  | 'brillantina' // Unearthly Bolt: rayitos al más cercano; el crítico revienta y se encadena
  | 'cubito' // Glass Fandango: más fuerte caminando y contra los congelados
  | 'lanza' // Santa Javelin: caen del cielo en abanico y revientan en el piso
  | 'mascarilla' // Gaze of Gaea: una gota adelante que a veces deja al mugroso sin dientes
  | 'piedra' // Magi-Stone: cae de arriba y se parte en pedacitos; daño fijo por nivel
  | 'luces' // Phas3r: rayitas delgadas horizontales sobre un mugroso
  | 'letras' // Chaos Rune: suben desde abajo y caen locas (solo pegan cayendo)
  | 'cortina' // Laurel: escudo con cargas
  | 'selector' // Candybox y Arma Dio: no se tienen; al escogerlos se escoge otra cosa
  | 'pez' // Penshin Fatcha: salen nadando hasta un mugroso y vuelven
  | 'confeti' // Greatest Jubilee: fuegos artificiales arriba en la pantalla (y velitas)
  | 'rebote' // Bone y Cherry Bomb: rebotan en los bordes y en los mugrosos
  | 'barco' // Carréllo: de lado a lado, rebotando en los bordes
  | 'talco' // Celestial Dusting: hacia atrás, rebotando; al final suelta pétalos
  | 'gel'; // La Robba: llueven desde arriba y rebotan en los mugrosos

export interface BaseArma {
  /** Daño de cada golpe. */
  dano: number;
  /** Tamaño (1 = normal). */
  area: number;
  /** Velocidad del proyectil (1 = normal). */
  vel: number;
  cant: number;
  /** Segundos que dura (proyectiles, charcos, órbitas). */
  dur: number;
  /** Cuántos enemigos atraviesa (999 = todos). */
  perfora: number;
  /** Segundos de recarga. */
  enfr: number;
  /** Segundos entre los proyectiles de una misma ráfaga. */
  inter: number;
  /** Empuje (1 = normal). */
  retro: number;
  /** Probabilidad de crítico y su multiplicador. */
  crit: number;
  critX: number;
  /** Cada cuánto vuelve a pegarle al mismo enemigo (lo que se queda: aura, charcos, órbitas). */
  golpeCada: number;
  /** Rapidez en unidades por segundo con vel = 1. */
  rapidez: number;
  /** Radio del golpe con área = 1. */
  radio: number;
  /** Congelar (segundos), para el hilo dental. */
  congela: number;
}

export interface NivelArma {
  txt: string;
  d: Partial<BaseArma>;
}

export interface DefArma {
  id: IdArma;
  nombre: string;
  /** Lo que hace (la carta del nivel 1). */
  desc: string;
  /** El del original, para la colección. */
  original: string;
  comp: Comp;
  base: BaseArma;
  /** Del nivel 2 al 8. */
  niveles: NivelArma[];
  /** Con qué evoluciona (al nivel máximo + la pasiva, abriendo un cofre después del minuto 10). Sin pasiva ni arma
   *  (el copito): con el nivel máximo basta. `y`: una segunda pasiva (los dos anillos, los dos aretes). */
  evo?: { pasiva?: IdPasiva; y?: IdPasiva; arma?: IdArma; a: IdArma };
  /** Es la evolución de… */
  de?: IdArma[];
  /** Qué tan seguido sale en las cartas (como la rareza del original). */
  rareza: number;
  /** Se gana jugando (si no, está desde el principio). */
  secreta?: boolean;
}

const B = (b: Partial<BaseArma>): BaseArma => ({
  dano: 10, area: 1, vel: 1, cant: 1, dur: 2, perfora: 1, enfr: 2, inter: 0.1, retro: 1, crit: 0, critX: 2, golpeCada: 0.5,
  rapidez: 300, radio: 10, congela: 0, ...b,
});
const n = (txt: string, d: Partial<BaseArma>): NivelArma => ({ txt, d });

export const ARMAS: Record<IdArma, DefArma> = {
  // ------------------------------------------------------------------------------------------------ Látigo
  toalla: {
    id: 'toalla', nombre: 'Toalla mojada', original: 'Látigo',
    desc: 'Un toallazo horizontal que atraviesa a todos. Cada vez del otro lado.',
    comp: 'latigo', rareza: 100,
    base: B({ dano: 10, enfr: 1.35, inter: 0.12, perfora: 999, radio: 17, rapidez: 0, retro: 1 }),
    niveles: [
      n('Un toallazo más, hacia atrás', { cant: 1 }),
      n('+5 de daño', { dano: 5 }),
      n('+10 % de área y +5 de daño', { area: 0.1, dano: 5 }),
      n('+5 de daño', { dano: 5 }),
      n('+10 % de área y +5 de daño', { area: 0.1, dano: 5 }),
      n('+5 de daño', { dano: 5 }),
      n('+5 de daño', { dano: 5 }),
    ],
    evo: { pasiva: 'crema', a: 'toallazo' },
  },
  toallazo: {
    id: 'toallazo', nombre: 'Toallazo de vapor', original: 'Bloody Tear', de: ['toalla'],
    desc: 'La toalla hirviendo: críticos que te devuelven vida.',
    comp: 'latigo', rareza: 0,
    base: B({ dano: 45, area: 1.3, cant: 2, enfr: 1.1, inter: 0.1, perfora: 999, radio: 17, crit: 0.25, critX: 2, retro: 1.2 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Varita
  burbujas: {
    id: 'burbujas', nombre: 'Varita de burbujas', original: 'Varita mágica',
    desc: 'Burbujas de jabón al germen más cercano.',
    comp: 'varita', rareza: 100,
    base: B({ dano: 10, enfr: 1.2, inter: 0.1, perfora: 1, rapidez: 330, radio: 9, dur: 3 }),
    niveles: [
      n('+1 burbuja', { cant: 1 }),
      n('Se recarga 0,2 s más rápido', { enfr: -0.2 }),
      n('+1 burbuja', { cant: 1 }),
      n('+10 de daño', { dano: 10 }),
      n('+1 burbuja', { cant: 1 }),
      n('Atraviesa a uno más', { perfora: 1 }),
      n('+10 de daño', { dano: 10 }),
    ],
    evo: { pasiva: 'relojArena', a: 'burbujero' },
  },
  burbujero: {
    id: 'burbujero', nombre: 'Burbujero sin fin', original: 'Holy Wand', de: ['burbujas'],
    desc: 'Burbujas sin parar, una detrás de otra.',
    comp: 'varita', rareza: 0,
    base: B({ dano: 30, cant: 1, enfr: 0.1, inter: 0.05, perfora: 2, rapidez: 400, radio: 11, dur: 3 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Cuchillos
  cepillo: {
    id: 'cepillo', nombre: 'Cepillo de dientes', original: 'Cuchillo',
    desc: 'Cepillos volando hacia donde miras. Rapidísimos.',
    comp: 'cuchillo', rareza: 100,
    base: B({ dano: 6.5, enfr: 1, inter: 0.08, perfora: 1, rapidez: 540, radio: 7, dur: 1.6 }),
    niveles: [
      n('+1 cepillo', { cant: 1 }),
      n('+1 cepillo y +5 de daño', { cant: 1, dano: 5 }),
      n('+1 cepillo', { cant: 1 }),
      n('Atraviesa a uno más', { perfora: 1 }),
      n('+1 cepillo', { cant: 1 }),
      n('+1 cepillo y +5 de daño', { cant: 1, dano: 5 }),
      n('Atraviesa a uno más', { perfora: 1 }),
    ],
    evo: { pasiva: 'liga', a: 'milCerdas' },
  },
  milCerdas: {
    id: 'milCerdas', nombre: 'Mil cerdas', original: 'Thousand Edge', de: ['cepillo'],
    desc: 'Una lluvia de cepillos que no se acaba.',
    comp: 'cuchillo', rareza: 0,
    base: B({ dano: 18, cant: 3, enfr: 0.16, inter: 0.03, perfora: 3, rapidez: 620, radio: 8, dur: 1.4, crit: 0.1, critX: 2 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Hacha
  champu: {
    id: 'champu', nombre: 'Champú volador', original: 'Hacha',
    desc: 'Frascos de champú que suben y caen dando vueltas.',
    comp: 'hacha', rareza: 100,
    base: B({ dano: 20, enfr: 4, inter: 0.15, perfora: 3, rapidez: 330, radio: 14, dur: 3 }),
    niveles: [
      n('+1 frasco', { cant: 1 }),
      n('+20 de daño', { dano: 20 }),
      n('Atraviesa a dos más', { perfora: 2 }),
      n('+1 frasco', { cant: 1 }),
      n('+20 de daño', { dano: 20 }),
      n('Atraviesa a dos más', { perfora: 2 }),
      n('+20 de daño', { dano: 20 }),
    ],
    evo: { pasiva: 'lupa', a: 'remolino' },
  },
  remolino: {
    id: 'remolino', nombre: 'Remolino de champú', original: 'Death Spiral', de: ['champu'],
    desc: 'Nueve frascos en espiral que lo atraviesan todo.',
    comp: 'espiral', rareza: 0,
    base: B({ dano: 60, cant: 9, area: 1.3, enfr: 3.5, perfora: 999, rapidez: 260, radio: 16, dur: 2.6 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Cruz
  peinilla: {
    id: 'peinilla', nombre: 'Peinilla bumerán', original: 'Cruz',
    desc: 'Va hasta el más cercano, frena y vuelve. Atraviesa a todos.',
    comp: 'cruz', rareza: 90,
    base: B({ dano: 5, enfr: 2, inter: 0.12, perfora: 999, rapidez: 340, radio: 12, dur: 3, golpeCada: 0.35 }),
    niveles: [
      n('+10 de daño', { dano: 10 }),
      n('+10 % de área', { area: 0.1 }),
      n('+1 peinilla', { cant: 1 }),
      n('+10 de daño', { dano: 10 }),
      n('+25 % de velocidad', { vel: 0.25 }),
      n('+1 peinilla', { cant: 1 }),
      n('+10 de daño', { dano: 10 }),
    ],
    evo: { pasiva: 'trebol', a: 'peinillaOro' },
  },
  peinillaOro: {
    id: 'peinillaOro', nombre: 'Peinilla de oro', original: 'Heaven Sword', de: ['peinilla'],
    desc: 'Peinillas doradas con golpes críticos de peluquería fina.',
    comp: 'cruz', rareza: 0,
    base: B({ dano: 35, cant: 3, area: 1.25, enfr: 1.5, inter: 0.1, perfora: 999, rapidez: 400, radio: 14, dur: 3, crit: 0.3, critX: 3, golpeCada: 0.3 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Biblia
  esponjas: {
    id: 'esponjas', nombre: 'Esponjas orbitales', original: 'Biblia del rey',
    desc: 'Esponjas que te dan vueltas un rato.',
    comp: 'biblia', rareza: 80,
    base: B({ dano: 10, enfr: 3, dur: 3, perfora: 999, rapidez: 3.2, radio: 14, golpeCada: 0.6 }),
    niveles: [
      n('+1 esponja', { cant: 1 }),
      n('+30 % de velocidad y +25 % de área', { vel: 0.3, area: 0.25 }),
      n('Duran 0,5 s más y +10 de daño', { dur: 0.5, dano: 10 }),
      n('+1 esponja', { cant: 1 }),
      n('+30 % de velocidad y +25 % de área', { vel: 0.3, area: 0.25 }),
      n('Duran 0,5 s más y +10 de daño', { dur: 0.5, dano: 10 }),
      n('+1 esponja', { cant: 1 }),
    ],
    evo: { pasiva: 'sales', a: 'esponjasEternas' },
  },
  esponjasEternas: {
    id: 'esponjasEternas', nombre: 'Esponjas eternas', original: 'Unholy Vespers', de: ['esponjas'],
    desc: 'Las esponjas ya no se cansan: te dan vueltas para siempre.',
    comp: 'biblia', rareza: 0,
    base: B({ dano: 40, cant: 5, area: 1.6, vel: 1.6, enfr: 0, dur: 9999, perfora: 999, rapidez: 3.2, radio: 15, golpeCada: 0.5 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Varita de fuego
  secador: {
    id: 'secador', nombre: 'Secador de pelo', original: 'Varita de fuego',
    desc: 'Ráfagas de aire caliente hacia un mugroso al azar. Mucho daño.',
    comp: 'fuego', rareza: 80,
    base: B({ dano: 20, cant: 3, enfr: 3, inter: 0, perfora: 1, rapidez: 230, radio: 13, dur: 2.5 }),
    niveles: [
      n('+10 de daño', { dano: 10 }),
      n('+10 de daño y +20 % de velocidad', { dano: 10, vel: 0.2 }),
      n('+10 de daño', { dano: 10 }),
      n('+10 de daño y +20 % de velocidad', { dano: 10, vel: 0.2 }),
      n('+10 de daño', { dano: 10 }),
      n('+10 de daño y +20 % de velocidad', { dano: 10, vel: 0.2 }),
      n('+10 de daño', { dano: 10 }),
    ],
    evo: { pasiva: 'jabonFuerte', a: 'secadorInfernal' },
  },
  secadorInfernal: {
    id: 'secadorInfernal', nombre: 'Secador del infierno', original: 'Hellfire', de: ['secador'],
    desc: 'Bolas de aire hirviendo, gigantes, que lo atraviesan todo.',
    comp: 'fuego', rareza: 0,
    base: B({ dano: 100, cant: 2, area: 1.6, enfr: 2.6, inter: 0.2, perfora: 999, rapidez: 190, radio: 22, dur: 3 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Ajo
  espuma: {
    id: 'espuma', nombre: 'Aura de espuma', original: 'Ajo',
    desc: 'Espuma alrededor tuyo que pica y empuja a los que se acercan.',
    comp: 'ajo', rareza: 100,
    base: B({ dano: 5, enfr: 0, perfora: 999, radio: 52, golpeCada: 1.3, retro: 1.4 }),
    niveles: [
      n('+40 % de área y +2 de daño', { area: 0.4, dano: 2 }),
      n('Pica 0,1 s más seguido y +1 de daño', { golpeCada: -0.1, dano: 1 }),
      n('+20 % de área y +1 de daño', { area: 0.2, dano: 1 }),
      n('Pica 0,1 s más seguido y +2 de daño', { golpeCada: -0.1, dano: 2 }),
      n('+20 % de área y +1 de daño', { area: 0.2, dano: 1 }),
      n('Pica 0,1 s más seguido y +1 de daño', { golpeCada: -0.1, dano: 1 }),
      n('+20 % de área y +1 de daño', { area: 0.2, dano: 1 }),
    ],
    evo: { pasiva: 'cremaNoche', a: 'espumaDevoradora' },
  },
  espumaDevoradora: {
    id: 'espumaDevoradora', nombre: 'Espuma devoradora', original: 'Soul Eater', de: ['espuma'],
    desc: 'La espuma crece con cada mugroso que se traga y te devuelve vida.',
    comp: 'ajo', rareza: 0,
    base: B({ dano: 14, area: 1.9, enfr: 0, perfora: 999, radio: 52, golpeCada: 0.8, retro: 1.6 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Agua bendita
  botellas: {
    id: 'botellas', nombre: 'Botellitas de agua', original: 'Agua bendita',
    desc: 'Botellitas que caen cerca y dejan charcos que mojan a los que pasan.',
    comp: 'agua', rareza: 90,
    base: B({ dano: 10, enfr: 4.5, dur: 2, perfora: 999, radio: 44, golpeCada: 0.45, inter: 0.18 }),
    niveles: [
      n('+1 botellita y +20 % de área', { cant: 1, area: 0.2 }),
      n('+10 de daño y duran 0,5 s más', { dano: 10, dur: 0.5 }),
      n('+1 botellita y +20 % de área', { cant: 1, area: 0.2 }),
      n('+10 de daño y duran 0,3 s más', { dano: 10, dur: 0.3 }),
      n('+1 botellita y +20 % de área', { cant: 1, area: 0.2 }),
      n('+5 de daño y duran 0,3 s más', { dano: 5, dur: 0.3 }),
      n('+5 de daño y +20 % de área', { dano: 5, area: 0.2 }),
    ],
    evo: { pasiva: 'iman', a: 'inundacion' },
  },
  inundacion: {
    id: 'inundacion', nombre: 'La inundación', original: 'La Borra', de: ['botellas'],
    desc: 'Charcos enormes que te persiguen y crecen cada vez que mojan a alguien.',
    comp: 'agua', rareza: 0,
    base: B({ dano: 25, cant: 4, area: 1.8, enfr: 3.5, dur: 4.5, perfora: 999, radio: 44, golpeCada: 0.4, inter: 0.12 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Runetracer
  jabon: {
    id: 'jabon', nombre: 'Jabón resbaloso', original: 'Runetracer',
    desc: 'Un jabón que se resbala y rebota en los bordes de la pantalla.',
    comp: 'runa', rareza: 90,
    base: B({ dano: 10, enfr: 3, dur: 2.25, perfora: 999, rapidez: 290, radio: 12, golpeCada: 0.4 }),
    niveles: [
      n('+5 de daño y +20 % de velocidad', { dano: 5, vel: 0.2 }),
      n('+5 de daño y dura 0,3 s más', { dano: 5, dur: 0.3 }),
      n('+1 jabón', { cant: 1 }),
      n('+5 de daño y +20 % de velocidad', { dano: 5, vel: 0.2 }),
      n('+5 de daño y dura 0,3 s más', { dano: 5, dur: 0.3 }),
      n('+1 jabón', { cant: 1 }),
      n('Dura 0,5 s más', { dur: 0.5 }),
    ],
    evo: { pasiva: 'gorro', a: 'jabonExplosivo' },
  },
  jabonExplosivo: {
    id: 'jabonExplosivo', nombre: 'Jabón explosivo', original: 'NO FUTURE', de: ['jabon'],
    desc: 'Cada rebote es una explosión de espuma.',
    comp: 'runa', rareza: 0,
    base: B({ dano: 30, cant: 3, area: 1.2, enfr: 2.4, dur: 3.2, perfora: 999, rapidez: 360, radio: 14, golpeCada: 0.35 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Anillo de rayos
  bombillo: {
    id: 'bombillo', nombre: 'Bombillo travieso', original: 'Anillo de rayos',
    desc: 'Corrientazos del bombillo del baño sobre mugrosos al azar.',
    comp: 'rayo', rareza: 80,
    base: B({ dano: 15, cant: 2, enfr: 4.5, perfora: 999, radio: 38, inter: 0.06 }),
    niveles: [
      n('+1 rayo', { cant: 1 }),
      n('+10 % de área y +10 de daño', { area: 0.1, dano: 10 }),
      n('+1 rayo', { cant: 1 }),
      n('+10 % de área y +20 de daño', { area: 0.1, dano: 20 }),
      n('+1 rayo', { cant: 1 }),
      n('+10 % de área y +20 de daño', { area: 0.1, dano: 20 }),
      n('+1 rayo', { cant: 1 }),
    ],
    evo: { pasiva: 'espejoDoble', a: 'tormenta' },
  },
  tormenta: {
    id: 'tormenta', nombre: 'Tormenta de bombillos', original: 'Thunder Loop', de: ['bombillo'],
    desc: 'Cada rayo cae dos veces.',
    comp: 'rayo', rareza: 0,
    base: B({ dano: 65, cant: 6, area: 1.4, enfr: 4, perfora: 999, radio: 40, inter: 0.05 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Pentagrama
  toallita: {
    id: 'toallita', nombre: 'Toallita desmaquillante', original: 'Pentagrama', secreta: true,
    desc: 'De vez en cuando borra a todos los mugrosos de la pantalla (y no sueltan nada).',
    comp: 'pentagrama', rareza: 30,
    base: B({ dano: 0, enfr: 60, perfora: 999 }),
    niveles: [
      n('Se recarga 10 s más rápido', { enfr: -10 }),
      n('Se recarga 5 s más rápido', { enfr: -5 }),
      n('Se recarga 5 s más rápido', { enfr: -5 }),
      n('Se recarga 5 s más rápido', { enfr: -5 }),
      n('Se recarga 5 s más rápido', { enfr: -5 }),
      n('Se recarga 5 s más rápido', { enfr: -5 }),
      n('Se recarga 5 s más rápido', { enfr: -5 }),
    ],
    evo: { pasiva: 'corona', a: 'lunaDeMiel' },
  },
  lunaDeMiel: {
    id: 'lunaDeMiel', nombre: 'Luna de miel', original: 'Gorgeous Moon', de: ['toallita'],
    desc: 'Borra la pantalla, te trae todas las gotitas y regala más experiencia.',
    comp: 'pentagrama', rareza: 0,
    base: B({ dano: 0, enfr: 25, perfora: 999 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Pájaros
  patoAmarillo: {
    id: 'patoAmarillo', nombre: 'Patico amarillo', original: 'Peachone',
    desc: 'Un patico de hule vuela lejos a tu alrededor y bombardea con burbujas.',
    comp: 'pajaro', rareza: 70,
    base: B({ dano: 10, enfr: 1, perfora: 999, rapidez: 1.15, radio: 36, inter: 0.1 }),
    niveles: [
      n('+1 bombazo', { cant: 1 }),
      n('+25 % de área y +5 de daño', { area: 0.25, dano: 5 }),
      n('Bombardea 0,2 s más seguido', { enfr: -0.2 }),
      n('+1 bombazo', { cant: 1 }),
      n('+25 % de área y +5 de daño', { area: 0.25, dano: 5 }),
      n('Bombardea 0,2 s más seguido', { enfr: -0.2 }),
      n('+10 de daño', { dano: 10 }),
    ],
    evo: { arma: 'patoMorado', a: 'patosEnamorados' },
  },
  patoMorado: {
    id: 'patoMorado', nombre: 'Patico morado', original: 'Ebony Wings', secreta: true,
    desc: 'Su pareja: vuela al otro lado y bombardea también.',
    comp: 'pajaro', rareza: 70,
    base: B({ dano: 10, enfr: 1, perfora: 999, rapidez: -1.15, radio: 36, inter: 0.1 }),
    niveles: [
      n('+1 bombazo', { cant: 1 }),
      n('+25 % de área y +5 de daño', { area: 0.25, dano: 5 }),
      n('Bombardea 0,2 s más seguido', { enfr: -0.2 }),
      n('+1 bombazo', { cant: 1 }),
      n('+25 % de área y +5 de daño', { area: 0.25, dano: 5 }),
      n('Bombardea 0,2 s más seguido', { enfr: -0.2 }),
      n('+10 de daño', { dano: 10 }),
    ],
    evo: { arma: 'patoAmarillo', a: 'patosEnamorados' },
  },
  patosEnamorados: {
    id: 'patosEnamorados', nombre: 'Patos enamorados', original: 'Vandalier', de: ['patoAmarillo', 'patoMorado'],
    desc: 'Los dos paticos juntos, enamorados, llenan todo de burbujas.',
    comp: 'pajaro', rareza: 0,
    base: B({ dano: 32, cant: 3, area: 1.7, enfr: 0.6, perfora: 999, rapidez: 1.3, radio: 36, inter: 0.08 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Gatos
  ranitas: {
    id: 'ranitas', nombre: 'Ranitas de la bañera', original: 'Gatti Amari',
    desc: 'Ranitas de hule que saltan por ahí aplastando mugre (y a veces traen cosas).',
    comp: 'gato', rareza: 70,
    base: B({ dano: 10, enfr: 5, dur: 4, perfora: 999, rapidez: 130, radio: 14, golpeCada: 0.5 }),
    niveles: [
      n('+1 ranita', { cant: 1 }),
      n('+10 de daño', { dano: 10 }),
      n('Duran 1 s más', { dur: 1 }),
      n('+1 ranita', { cant: 1 }),
      n('+10 de daño', { dano: 10 }),
      n('Duran 1 s más', { dur: 1 }),
      n('+1 ranita', { cant: 1 }),
    ],
    evo: { pasiva: 'alcancia', a: 'ranaGlotona' },
  },
  ranaGlotona: {
    id: 'ranaGlotona', nombre: 'Rana glotona', original: 'Vicious Hunger', de: ['ranitas'],
    desc: 'Una rana enorme que se traga la mugre y la escupe en gotas doradas.',
    comp: 'gato', rareza: 0,
    base: B({ dano: 40, cant: 4, area: 1.4, enfr: 4, dur: 6, perfora: 999, rapidez: 170, radio: 18, golpeCada: 0.4 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Song of Mana
  ducha: {
    id: 'ducha', nombre: 'Chorro de la ducha', original: 'Canción de maná',
    desc: 'Un chorro de ducha cae de arriba a abajo por donde estés.',
    comp: 'cancion', rareza: 80,
    base: B({ dano: 10, enfr: 2, dur: 2, perfora: 999, radio: 34, golpeCada: 0.5, retro: 0.6 }),
    niveles: [
      n('+5 de daño y +20 % de área', { dano: 5, area: 0.2 }),
      n('Dura 0,5 s más', { dur: 0.5 }),
      n('+10 de daño', { dano: 10 }),
      n('+20 % de área', { area: 0.2 }),
      n('Dura 0,5 s más y +5 de daño', { dur: 0.5, dano: 5 }),
      n('+10 de daño', { dano: 10 }),
      n('+20 % de área y +10 de daño', { area: 0.2, dano: 10 }),
    ],
    evo: { pasiva: 'espejoRoto', a: 'diluvio' },
  },
  diluvio: {
    id: 'diluvio', nombre: 'El diluvio', original: 'Mannajja', de: ['ducha'],
    desc: 'Una cascada enorme que además los deja lentos.',
    comp: 'cancion', rareza: 0,
    base: B({ dano: 40, enfr: 2, dur: 3.5, area: 2.1, perfora: 999, radio: 34, golpeCada: 0.4, retro: 0.4 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Clock Lancet
  hilo: {
    id: 'hilo', nombre: 'Hilo dental', original: 'Lanceta del reloj',
    desc: 'Un hilo dental que amarra y deja quietos a los que toca. Va dando la vuelta como un reloj.',
    comp: 'reloj', rareza: 50,
    base: B({ dano: 4, enfr: 1.6, perfora: 999, radio: 10, rapidez: 320, congela: 1.2 }),
    niveles: [
      n('Los deja quietos 0,3 s más', { congela: 0.3 }),
      n('+20 % de área', { area: 0.2 }),
      n('Se recarga 0,2 s más rápido', { enfr: -0.2 }),
      n('Los deja quietos 0,3 s más y +4 de daño', { congela: 0.3, dano: 4 }),
      n('+20 % de área', { area: 0.2 }),
      n('Se recarga 0,2 s más rápido', { enfr: -0.2 }),
      n('Los deja quietos 0,4 s más y +6 de daño', { congela: 0.4, dano: 6 }),
    ],
    evo: { pasiva: 'pantuflas', a: 'hiloSeda' },
  },
  hiloSeda: {
    id: 'hiloSeda', nombre: 'Hilo de seda', original: 'Infinite Corridor', de: ['hilo'],
    desc: 'Cuatro hilos a la vez que amarran y cortan.',
    comp: 'reloj', rareza: 0,
    base: B({ dano: 28, cant: 4, area: 1.5, enfr: 1, perfora: 999, radio: 12, rapidez: 360, congela: 2.4 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Pistolas
  perfume: {
    id: 'perfume', nombre: 'Perfume', original: 'Phiera Der Tuphello',
    desc: 'Chorritos de perfume en cruz: arriba, abajo y a los lados.',
    comp: 'pistola', rareza: 70,
    base: B({ dano: 9, enfr: 1.4, inter: 0.08, perfora: 1, rapidez: 470, radio: 8, dur: 1.3 }),
    niveles: [
      n('+1 chorrito por lado', { cant: 1 }),
      n('+5 de daño', { dano: 5 }),
      n('Se recarga 0,2 s más rápido', { enfr: -0.2 }),
      n('+1 chorrito por lado', { cant: 1 }),
      n('+5 de daño y +20 % de velocidad', { dano: 5, vel: 0.2 }),
      n('Atraviesa a uno más', { perfora: 1 }),
      n('+1 chorrito por lado', { cant: 1 }),
    ],
    evo: { arma: 'colonia', a: 'perfumeAmor' },
  },
  colonia: {
    id: 'colonia', nombre: 'Colonia', original: 'Eight the Sparrow', secreta: true,
    desc: 'Chorritos de colonia en equis, por las diagonales.',
    comp: 'pistola', rareza: 70,
    base: B({ dano: 9, enfr: 1.4, inter: 0.08, perfora: 1, rapidez: 470, radio: 8, dur: 1.3 }),
    niveles: [
      n('+1 chorrito por lado', { cant: 1 }),
      n('+5 de daño', { dano: 5 }),
      n('Se recarga 0,2 s más rápido', { enfr: -0.2 }),
      n('+1 chorrito por lado', { cant: 1 }),
      n('+5 de daño y +20 % de velocidad', { dano: 5, vel: 0.2 }),
      n('Atraviesa a uno más', { perfora: 1 }),
      n('+1 chorrito por lado', { cant: 1 }),
    ],
    evo: { arma: 'perfume', a: 'perfumeAmor' },
  },
  perfumeAmor: {
    id: 'perfumeAmor', nombre: 'Perfume del amor', original: 'Phieraggi', de: ['perfume', 'colonia'],
    desc: 'Ocho rayos de perfume que giran a tu alrededor. Huele a enamorados.',
    comp: 'laser', rareza: 0,
    base: B({ dano: 22, cant: 8, area: 1.2, enfr: 0, perfora: 999, radio: 9, rapidez: 1.1, golpeCada: 0.25, dur: 9999 }),
    niveles: [],
  },
  // ================================================================================================ Versión 2
  // ------------------------------------------------------------------------------------------------ Shadow Pinion
  chancletas: {
    id: 'chancletas', nombre: 'Chancletas mojadas', original: 'Shadow Pinion', secreta: true,
    desc: 'Al caminar dejas huellitas de agua que pican a los que las pisan; al frenar, salen todas disparadas hacia donde miras.',
    comp: 'chancla', rareza: 50,
    base: B({ dano: 10, cant: 1, dur: 2.5, enfr: 1.6, inter: 0.32, perfora: 999, radio: 12, rapidez: 430, golpeCada: 1.2, retro: 1 }),
    niveles: [
      n('+1 huellita a la vez', { cant: 1 }),
      n('+5 de daño', { dano: 5 }),
      n('Duran 0,3 s más', { dur: 0.3 }),
      n('+5 de daño', { dano: 5 }),
      n('Duran 0,3 s más', { dur: 0.3 }),
      n('+5 de daño', { dano: 5 }),
      n('Duran 0,3 s más', { dur: 0.3 }),
    ],
    evo: { pasiva: 'pantuflas', a: 'pisoton' },
  },
  pisoton: {
    id: 'pisoton', nombre: 'Pisotón de charco', original: 'Valkyrie Turner', de: ['chancletas'],
    desc: 'Huellas enormes que, al salir disparadas, revientan en charcos.',
    comp: 'chancla', rareza: 0,
    base: B({ dano: 32, cant: 3, area: 1.4, dur: 3.6, enfr: 1.1, inter: 0.22, perfora: 999, radio: 15, rapidez: 500, golpeCada: 0.8, retro: 1.3 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Vento Sacro
  maquina: {
    id: 'maquina', nombre: 'Máquina de afeitar', original: 'Vento Sacro', secreta: true,
    desc: 'Tajos rapidísimos adelante. Se recarga más rápido caminando y pega más mientras más camines sin parar. Críticos.',
    comp: 'tajo', rareza: 50,
    base: B({ dano: 3, area: 1, cant: 4, enfr: 2, inter: 0.05, perfora: 999, radio: 13, rapidez: 110, crit: 0.05, critX: 2, retro: 0.6 }),
    niveles: [
      n('+2 de daño', { dano: 2 }),
      n('+1 tajo y +20 % de área', { cant: 1, area: 0.2 }),
      n('+2 de daño', { dano: 2 }),
      n('+1 tajo y +20 % de área', { cant: 1, area: 0.2 }),
      n('+2 de daño', { dano: 2 }),
      n('+1 tajo y +20 % de área', { cant: 1, area: 0.2 }),
      n('+2 de daño', { dano: 2 }),
    ],
    evo: { arma: 'toallazo', a: 'afeitada' },
  },
  afeitada: {
    id: 'afeitada', nombre: 'Afeitada perfecta', original: 'Fuwalafuwaloo', de: ['maquina', 'toallazo'],
    desc: 'La máquina y la toalla hirviendo juntas: tajos a lado y lado que no fallan y críticos que te curan.',
    comp: 'tajo', rareza: 0,
    base: B({ dano: 26, area: 1.9, cant: 7, enfr: 1.1, inter: 0.04, perfora: 999, radio: 15, rapidez: 120, crit: 0.2, critX: 3, retro: 0.9 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Bracelet
  copito: {
    id: 'copito', nombre: 'Copito', original: 'Bracelet', secreta: true,
    desc: 'Tres copitos a un mugroso al azar. Al nivel máximo evoluciona solo (sin pasiva).',
    comp: 'fuego', rareza: 40,
    base: B({ dano: 10, area: 0.9, cant: 3, dur: 0.62, enfr: 1.4, inter: 0.04, perfora: 1, rapidez: 430, radio: 8 }),
    niveles: [
      n('+10 de daño', { dano: 10 }),
      n('Atraviesa a uno más', { perfora: 1 }),
      n('+1 copito y +10 % de área', { cant: 1, area: 0.1 }),
      n('Atraviesa a uno más', { perfora: 1 }),
      n('+10 de daño', { dano: 10 }),
      n('+1 copito', { cant: 1 }),
      n('Llegan más lejos', { dur: 0.1 }),
    ],
    evo: { a: 'dobleCopito' },
  },
  dobleCopito: {
    id: 'dobleCopito', nombre: 'Doble copito', original: 'Bi-Bracelet', de: ['copito'],
    desc: 'Copitos de dos puntas, más fuertes. Al nivel máximo se vuelve triple.',
    comp: 'fuego', rareza: 20,
    base: B({ dano: 30, area: 1, cant: 4, dur: 0.66, enfr: 1.4, inter: 0.04, perfora: 3, rapidez: 450, radio: 9 }),
    niveles: [
      n('Atraviesa a uno más', { perfora: 1 }),
      n('+1 copito y +10 % de área', { cant: 1, area: 0.1 }),
      n('Llegan más lejos y se recarga 0,2 s más rápido', { dur: 0.1, enfr: -0.2 }),
      n('+1 copito y +10 % de área', { cant: 1, area: 0.1 }),
      n('Atraviesa a uno más', { perfora: 1 }),
      n('+10 de daño', { dano: 10 }),
      n('+1 copito', { cant: 1 }),
    ],
    evo: { a: 'tripleCopito' },
  },
  tripleCopito: {
    id: 'tripleCopito', nombre: 'Triple copito', original: 'Tri-Bracelet', de: ['dobleCopito'],
    desc: 'La caja entera de copitos.',
    comp: 'fuego', rareza: 20,
    base: B({ dano: 34, area: 1.2, cant: 5, dur: 0.72, enfr: 1.3, inter: 0.03, perfora: 4, rapidez: 470, radio: 10 }),
    niveles: [
      n('+1 copito y +10 % de área', { cant: 1, area: 0.1 }),
      n('Llegan más lejos y se recarga 0,1 s más rápido', { dur: 0.1, enfr: -0.1 }),
      n('+1 copito y +10 de daño', { cant: 1, dano: 10 }),
      n('Llegan más lejos y se recarga 0,1 s más rápido', { dur: 0.1, enfr: -0.1 }),
      n('+10 % de área', { area: 0.1 }),
      n('+10 de daño', { dano: 10 }),
      n('Atraviesa a uno más', { perfora: 1 }),
    ],
  },
  // ------------------------------------------------------------------------------------------------ Victory Sword
  plancha: {
    id: 'plancha', nombre: 'Plancha del pelo', original: 'Victory Sword', secreta: true,
    desc: 'Combo de planchazos al más cercano. Si te pegan, contraataca alrededor. Al nivel 8: críticos y remate.',
    comp: 'plancha', rareza: 30,
    base: B({ dano: 6, area: 1, cant: 2, enfr: 1.85, inter: 0.1, perfora: 999, radio: 28, retro: 1 }),
    niveles: [
      n('+1 planchazo', { cant: 1 }),
      n('+15 % de área y +4 de daño', { area: 0.15, dano: 4 }),
      n('+1 planchazo', { cant: 1 }),
      n('+15 % de área y +6 de daño', { area: 0.15, dano: 6 }),
      n('+1 planchazo', { cant: 1 }),
      n('+15 % de área y +6 de daño', { area: 0.15, dano: 6 }),
      n('Críticos y remate (cada cinco planchazos, uno enorme)', { crit: 0.1, enfr: -0.3 }),
    ],
    evo: { pasiva: 'cajitaMusica', a: 'planchaDiva' },
  },
  planchaDiva: {
    id: 'planchaDiva', nombre: 'Plancha de diva', original: 'Sole Solution', de: ['plancha'],
    desc: 'Planchazos de salón: cada mugroso que cae la pone más fuerte.',
    comp: 'plancha', rareza: 0,
    base: B({ dano: 26, area: 1.5, cant: 4, enfr: 1.2, inter: 0.08, perfora: 999, radio: 30, crit: 0.15, critX: 2.5, retro: 1.2 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Flames of Misspell
  vaporizador: {
    id: 'vaporizador', nombre: 'Vaporizador', original: 'Flames of Misspell', secreta: true,
    desc: 'Conos de vapor hirviendo hacia donde miras.',
    comp: 'vapor', rareza: 30,
    base: B({ dano: 14, area: 1, cant: 12, dur: 0.6, enfr: 4, inter: 0.04, perfora: 999, radio: 13, rapidez: 260, golpeCada: 9, retro: 0.5 }),
    niveles: [
      n('+25 % de velocidad', { vel: 0.25 }),
      n('+10 de daño', { dano: 10 }),
      n('+50 % de área y se recarga 0,5 s más rápido', { area: 0.5, enfr: -0.5 }),
      n('+25 % de velocidad', { vel: 0.25 }),
      n('+10 de daño', { dano: 10 }),
      n('+50 % de área y se recarga 0,5 s más rápido', { area: 0.5, enfr: -0.5 }),
      n('Se recarga 0,5 s más rápido', { enfr: -0.5 }),
    ],
    evo: { pasiva: 'cajitaMusica', a: 'sauna' },
  },
  sauna: {
    id: 'sauna', nombre: 'Sauna', original: 'Ashes of Muspell', de: ['vaporizador'],
    desc: 'Vapor adelante y atrás, y más caliente con cada mugroso que cae.',
    comp: 'vapor', rareza: 0,
    base: B({ dano: 28, area: 2, cant: 16, dur: 0.62, enfr: 2.2, inter: 0.03, perfora: 999, radio: 14, rapidez: 300, vel: 1.4, golpeCada: 9, retro: 0.6 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Pako Battiliar
  mariposas: {
    id: 'mariposas', nombre: 'Mariposas de la cortina', original: 'Pako Battiliar', secreta: true,
    desc: 'Bandadas de mariposas que cruzan la pantalla. Cuando te quitan vida, sale otra bandada.',
    comp: 'mariposa', rareza: 60,
    base: B({ dano: 20, cant: 10, enfr: 8, inter: 0, perfora: 1, rapidez: 170, radio: 10, retro: 0.8 }),
    niveles: [
      n('Atraviesan a uno más y +30 % de velocidad', { perfora: 1, vel: 0.3 }),
      n('+1 mariposa y se recarga 0,5 s más rápido', { cant: 1, enfr: -0.5 }),
      n('+1 mariposa y +10 de daño', { cant: 1, dano: 10 }),
      n('Atraviesan a dos más y +30 % de velocidad', { perfora: 2, vel: 0.3 }),
      n('+1 mariposa y se recarga 0,5 s más rápido', { cant: 1, enfr: -0.5 }),
      n('+1 mariposa y atraviesan a tres más', { cant: 1, perfora: 3 }),
      n('+1 mariposa y +10 de daño', { cant: 1, dano: 10 }),
    ],
    evo: { pasiva: 'crema', a: 'mariposario' },
  },
  mariposario: {
    id: 'mariposario', nombre: 'Mariposario', original: 'Mazo Familiar', de: ['mariposas'],
    desc: 'Nubes de mariposas que no se acaban; cada vez que te pegan te traen un poquito de vida.',
    comp: 'mariposa', rareza: 0,
    base: B({ dano: 36, cant: 18, enfr: 4.5, inter: 0, perfora: 8, rapidez: 250, radio: 12, retro: 1 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Ammo Appalate
  pistolaAgua: {
    id: 'pistolaAgua', nombre: 'Pistola de agua', original: 'Ammo Appalate', secreta: true,
    desc: 'Chorritos al mugroso que tengas adelante. Si no hay nadie, guarda los tiros para después.',
    comp: 'pistolaAgua', rareza: 60,
    base: B({ dano: 10, cant: 3, enfr: 2, inter: 0.1, perfora: 1, rapidez: 540, radio: 6, dur: 1.1 }),
    niveles: [
      n('+10 % de área y atraviesan a tres más', { area: 0.1, perfora: 3 }),
      n('+1 chorrito y +1 de daño', { cant: 1, dano: 1 }),
      n('+1 chorrito y +1 de daño', { cant: 1, dano: 1 }),
      n('+10 % de área y atraviesan a tres más', { area: 0.1, perfora: 3 }),
      n('+1 chorrito y +1 de daño', { cant: 1, dano: 1 }),
      n('+3 de daño', { dano: 3 }),
      n('+2 chorritos', { cant: 2 }),
    ],
    evo: { pasiva: 'liga', a: 'hidrolavadora' },
  },
  hidrolavadora: {
    id: 'hidrolavadora', nombre: 'Hidrolavadora', original: 'Gunastrophe', de: ['pistolaAgua'],
    desc: 'Ráfagas a presión y, cada tanto, un chorrazo que rebota por toda la pantalla.',
    comp: 'pistolaAgua', rareza: 0,
    base: B({ dano: 22, cant: 6, area: 1.3, enfr: 1.2, inter: 0.06, perfora: 6, rapidez: 620, radio: 7, dur: 1.2 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Unearthly Bolt
  brillantina: {
    id: 'brillantina', nombre: 'Brillantina', original: 'Unearthly Bolt', secreta: true,
    desc: 'Rayitos de brillantina al más cercano. El crítico revienta alrededor y, si se encadena, pega cada vez más. Cada vida extra le suma un rayito.',
    comp: 'brillantina', rareza: 70,
    base: B({ dano: 14, area: 1, cant: 1, enfr: 2.4, inter: 0.1, perfora: 999, radio: 34, crit: 0.22, critX: 1 }),
    niveles: [
      n('+1 rayito', { cant: 1 }),
      n('+1 rayito y +10 % de área', { cant: 1, area: 0.1 }),
      n('Se recarga 0,1 s más rápido y +5 de daño', { enfr: -0.1, dano: 5 }),
      n('+1 rayito', { cant: 1 }),
      n('+1 rayito y +10 % de área', { cant: 1, area: 0.1 }),
      n('+1 rayito', { cant: 1 }),
      n('Se recarga 0,1 s más rápido y +5 de daño', { enfr: -0.1, dano: 5 }),
    ],
    evo: { pasiva: 'curita', a: 'lluviaBrillantina' },
  },
  lluviaBrillantina: {
    id: 'lluviaBrillantina', nombre: 'Lluvia de brillantina', original: 'Spirit Disturbance', de: ['brillantina'],
    desc: 'Llueve brillantina: muchos más rayitos y críticos que revientan en grande.',
    comp: 'brillantina', rareza: 0,
    base: B({ dano: 26, area: 1.5, cant: 9, enfr: 2.2, inter: 0.07, perfora: 999, radio: 38, crit: 0.36, critX: 1 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Glass Fandango
  cubitos: {
    id: 'cubitos', nombre: 'Cubitos de hielo', original: 'Glass Fandango', secreta: true,
    desc: 'Cubitos cortos hacia donde miras. Más rápidos caminando, a veces congelan, y a los congelados les pegan el doble.',
    comp: 'cubito', rareza: 50,
    base: B({ dano: 14, area: 0.7, cant: 1, dur: 0.4, enfr: 1.4, inter: 0.03, perfora: 999, radio: 12, rapidez: 430, golpeCada: 9, congela: 0.6 }),
    niveles: [
      n('+10 % de área y +2,5 de daño', { area: 0.1, dano: 2.5 }),
      n('+1 cubito', { cant: 1 }),
      n('+10 % de área y +2,5 de daño', { area: 0.1, dano: 2.5 }),
      n('+1 cubito', { cant: 1 }),
      n('+10 % de área y +2,5 de daño', { area: 0.1, dano: 2.5 }),
      n('+1 cubito', { cant: 1 }),
      n('+1 cubito y +2,5 de daño', { cant: 1, dano: 2.5 }),
    ],
    evo: { pasiva: 'anilloPlata', y: 'anilloOro', a: 'granizada' },
  },
  granizada: {
    id: 'granizada', nombre: 'Granizada', original: 'Celestial Voulge', de: ['cubitos'],
    desc: 'Caminando, granizo adelante; quieto, para todos lados. Congela mucho más.',
    comp: 'cubito', rareza: 0,
    base: B({ dano: 44, area: 1.3, cant: 5, dur: 0.45, enfr: 0.9, inter: 0.03, perfora: 999, radio: 14, rapidez: 470, golpeCada: 9, congela: 1.2 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Santa Javelin
  cepilloEspalda: {
    id: 'cepilloEspalda', nombre: 'Cepillo de espalda', original: 'Santa Javelin', secreta: true,
    desc: 'Cepillos que caen del cielo en abanico y revientan en espuma. La duración trae más cepillos. Críticos.',
    comp: 'lanza', rareza: 60,
    base: B({ dano: 20, area: 1, cant: 1, dur: 1, enfr: 6.5, inter: 0.125, perfora: 999, radio: 40, crit: 0.05, critX: 2, retro: 1.2 }),
    niveles: [
      n('+50 % de área', { area: 0.5 }),
      n('+1 cepillo y se recarga 0,5 s más rápido', { cant: 1, enfr: -0.5 }),
      n('+10 de daño', { dano: 10 }),
      n('+50 % de área y se recarga 0,5 s más rápido', { area: 0.5, enfr: -0.5 }),
      n('+1 cepillo', { cant: 1 }),
      n('Se recarga 0,5 s más rápido y +10 de daño', { enfr: -0.5, dano: 10 }),
      n('+30 de daño', { dano: 30 }),
    ],
    evo: { pasiva: 'trebol', a: 'cepilloCeleste' },
  },
  cepilloCeleste: {
    id: 'cepilloCeleste', nombre: 'Cepillo celestial', original: 'Seraphic Cry', de: ['cepilloEspalda'],
    desc: 'Una lluvia de cepillos dorados; cada uno revienta dos veces.',
    comp: 'lanza', rareza: 0,
    base: B({ dano: 62, area: 2.2, cant: 4, dur: 1, enfr: 3.6, inter: 0.1, perfora: 999, radio: 42, crit: 0.2, critX: 3, retro: 1.4 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Gaze of Gaea
  mascarilla: {
    id: 'mascarilla', nombre: 'Mascarilla de pepino', original: 'Gaze of Gaea', secreta: true,
    desc: 'Una gota de mascarilla adelante que pica a los que toca. A veces los deja «sin dientes»: ya no te pueden pegar.',
    comp: 'mascarilla', rareza: 50,
    base: B({ dano: 8, area: 1, cant: 1, dur: 0.6, enfr: 2, inter: 0.2, perfora: 999, radio: 34, golpeCada: 0.3, retro: 0.4 }),
    niveles: [
      n('+1 gota', { cant: 1 }),
      n('+5 de daño', { dano: 5 }),
      n('Dura 0,2 s más', { dur: 0.2 }),
      n('+15 % de área', { area: 0.15 }),
      n('+1 gota', { cant: 1 }),
      n('Dura 0,2 s más', { dur: 0.2 }),
      n('+15 % de área y deja sin dientes más seguido', { area: 0.15, crit: 0.02 }),
    ],
    evo: { pasiva: 'bataGruesa', a: 'spa' },
  },
  spa: {
    id: 'spa', nombre: 'Spa completo', original: 'Embrace of Gaea', de: ['mascarilla'],
    desc: 'Mascarillas grandes que duran más, dejan sin dientes muy seguido y te consienten con un poquito de vida.',
    comp: 'mascarilla', rareza: 0,
    base: B({ dano: 30, area: 1.7, cant: 3, dur: 1.3, enfr: 1.5, inter: 0.15, perfora: 999, radio: 36, golpeCada: 0.25, retro: 0.6, crit: 0.05 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Magi-Stone
  piedraPomez: {
    id: 'piedraPomez', nombre: 'Piedra pómez', original: 'Magi-Stone', secreta: true,
    desc: 'Cae de arriba y se parte en pedacitos. Daño fijo según su nivel: no le importa el poder.',
    comp: 'piedra', rareza: 60,
    base: B({ dano: 10, area: 1, vel: 1.2, cant: 1, enfr: 3.5, inter: 0.2, perfora: 1, radio: 13, rapidez: 380, dur: 0.4 }),
    niveles: [
      n('+1 piedra y +10 de daño', { cant: 1, dano: 10 }),
      n('+10 % de área y +10 de daño', { area: 0.1, dano: 10 }),
      n('+20 % de velocidad, se recarga 0,2 s más rápido y +10 de daño', { vel: 0.2, enfr: -0.2, dano: 10 }),
      n('+1 piedra y +10 de daño', { cant: 1, dano: 10 }),
      n('+10 % de área y +10 de daño', { area: 0.1, dano: 10 }),
      n('+20 % de velocidad, se recarga 0,2 s más rápido y +10 de daño', { vel: 0.2, enfr: -0.2, dano: 10 }),
      n('+20 % de área y +10 de daño', { area: 0.2, dano: 10 }),
    ],
    evo: { pasiva: 'velaAromatica', a: 'piedrasCalientes' },
  },
  piedrasCalientes: {
    id: 'piedrasCalientes', nombre: 'Piedras calientes', original: 'Kyra-Stones', de: ['piedraPomez'],
    desc: 'Piedras de masaje hirviendo: revientan al caer y sus pedacitos queman.',
    comp: 'piedra', rareza: 0,
    base: B({ dano: 110, area: 1.5, vel: 1.6, cant: 3, enfr: 2.4, inter: 0.15, perfora: 2, radio: 15, rapidez: 420, dur: 0.5 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Phas3r
  lucesLED: {
    id: 'lucesLED', nombre: 'Luces del espejo', original: 'Phas3r', secreta: true,
    desc: 'Las lucecitas LED del espejo: rayitas delgadas de colores sobre los mugrosos. Cada proyectil extra son cuatro rayitas.',
    comp: 'luces', rareza: 50,
    base: B({ dano: 5, area: 1, cant: 1, enfr: 5, inter: 0.1, perfora: 999, radio: 5, rapidez: 92 }),
    niveles: [
      n('+1 (cuatro rayitas más)', { cant: 1, inter: -0.01 }),
      n('+50 % de largo y +3 de daño', { area: 0.5, dano: 3, inter: -0.01 }),
      n('+1 (cuatro rayitas más)', { cant: 1, inter: -0.01 }),
      n('+50 % de largo y +3 de daño', { area: 0.5, dano: 3, inter: -0.01 }),
      n('+1 (cuatro rayitas más)', { cant: 1, inter: -0.01 }),
      n('+50 % de largo y +4 de daño', { area: 0.5, dano: 4, inter: -0.01 }),
      n('+1 (cuatro rayitas más)', { cant: 1, inter: -0.01 }),
    ],
    evo: { pasiva: 'relojArena', a: 'camerino' },
  },
  camerino: {
    id: 'camerino', nombre: 'Camerino de estrella', original: 'Photonstorm', de: ['lucesLED'],
    desc: 'Todas las luces del camerino: rayas acostadas y paradas, más gruesas y sin parar.',
    comp: 'luces', rareza: 0,
    base: B({ dano: 16, area: 2.6, cant: 6, enfr: 2.4, inter: 0.04, perfora: 999, radio: 8, rapidez: 92 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Chaos Rune
  letrasEspuma: {
    id: 'letrasEspuma', nombre: 'Letras de espuma', original: 'Chaos Rune', secreta: true,
    desc: 'Letras de espuma que suben desde abajo y caen locas; solo pegan cayendo. La velocidad y la duración las hacen pegar a más.',
    comp: 'letras', rareza: 40,
    base: B({ dano: 20, cant: 1, enfr: 2.5, inter: 0.25, perfora: 2, radio: 13, rapidez: 1 }),
    niveles: [
      n('+1 letra', { cant: 1 }),
      n('Pegan a dos más', { perfora: 2 }),
      n('+1 letra', { cant: 1 }),
      n('+10 de daño', { dano: 10 }),
      n('+1 letra', { cant: 1 }),
      n('Pegan a dos más', { perfora: 2 }),
      n('+10 de daño', { dano: 10 }),
    ],
    evo: { pasiva: 'sales', a: 'abecedario' },
  },
  abecedario: {
    id: 'abecedario', nombre: 'Abecedario loco', original: 'Wicked Ruler', de: ['letrasEspuma'],
    desc: 'Todo el abecedario a la vez, rebotando abajo antes de irse.',
    comp: 'letras', rareza: 0,
    base: B({ dano: 55, area: 1.3, cant: 5, enfr: 2, inter: 0.14, perfora: 10, radio: 15, rapidez: 1 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Laurel
  cortina: {
    id: 'cortina', nombre: 'Cortina de baño', original: 'Laurel', secreta: true,
    desc: 'Una cortina que te ataja los golpes: cada golpe gasta una carga y te deja invencible un ratito. Solo le importa la recarga.',
    comp: 'cortina', rareza: 60,
    base: B({ dano: 0, cant: 1, dur: 0.3, enfr: 10, perfora: 999, radio: 70 }),
    niveles: [
      n('Se recarga 0,5 s más rápido y te protege 0,2 s más', { enfr: -0.5, dur: 0.2 }),
      n('Se recarga 0,5 s más rápido y te protege 0,2 s más', { enfr: -0.5, dur: 0.2 }),
      n('+1 carga', { cant: 1 }),
      n('Se recarga 0,5 s más rápido y te protege 0,2 s más', { enfr: -0.5, dur: 0.2 }),
      n('Se recarga 0,5 s más rápido y te protege 0,2 s más', { enfr: -0.5, dur: 0.2 }),
      n('+1 carga', { cant: 1 }),
      n('Se recarga 0,5 s más rápido', { enfr: -0.5 }),
    ],
    evo: { pasiva: 'aretIzq', y: 'aretDer', a: 'cortinaTerciopelo' },
  },
  cortinaTerciopelo: {
    id: 'cortinaTerciopelo', nombre: 'Cortina de terciopelo', original: 'Crimson Shroud', de: ['cortina'],
    desc: 'Ningún golpe te quita más de 10, y cada carga que se gasta revienta y les devuelve el golpe a los de alrededor.',
    comp: 'cortina', rareza: 0,
    base: B({ dano: 0, cant: 3, dur: 1.1, enfr: 6, perfora: 999, radio: 80 }),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Candybox
  neceser: {
    id: 'neceser', nombre: 'Neceser', original: 'Candybox', secreta: true,
    desc: 'Se abre y te deja escoger cualquier arma que ya hayas desbloqueado (no ocupa puesto).',
    comp: 'selector', rareza: 10,
    base: B({}),
    niveles: [],
  },
  neceserLujo: {
    id: 'neceserLujo', nombre: 'Neceser de lujo', original: 'Super Candybox II Turbo', de: ['neceser'],
    desc: 'El regalo del neceser: sale en un cofre después del minuto 10 y te deja escoger un arma ya evolucionada.',
    comp: 'selector', rareza: 0,
    base: B({}),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Arma Dio
  bolsillo: {
    id: 'bolsillo', nombre: 'Bolsillo de la bata', original: 'Arma Dio', secreta: true,
    desc: 'Un puesto más para pasivas y escoges una de una vez (no ocupa puesto de arma).',
    comp: 'selector', rareza: 30,
    base: B({}),
    niveles: [],
  },
  // ------------------------------------------------------------------------------------------------ Penshin Fatcha
  pececitos: {
    id: 'pececitos', nombre: 'Pececitos de la pecera', original: 'Penshin Fatcha', secreta: true,
    desc: 'Pececitos que salen nadando hasta los mugrosos y vuelven. Al nivel máximo evolucionan solos.',
    comp: 'pez', rareza: 50,
    base: B({ dano: 12, cant: 2, enfr: 2.4, inter: 0.12, perfora: 999, rapidez: 300, radio: 11, dur: 2.4, golpeCada: 0.35 }),
    niveles: [
      n('+1 pececito', { cant: 1 }),
      n('+5 de daño', { dano: 5 }),
      n('+1 pececito', { cant: 1 }),
      n('+20 % de área', { area: 0.2 }),
      n('+1 pececito', { cant: 1 }),
      n('+5 de daño y +20 % de velocidad', { dano: 5, vel: 0.2 }),
      n('+1 pececito', { cant: 1 }),
    ],
    evo: { a: 'peceraInfinita' },
  },
  peceraInfinita: {
    id: 'peceraInfinita', nombre: 'La pecera infinita', original: 'Miracle of Multiplication', de: ['pececitos'],
    desc: 'Pececitos dorados que no paran de multiplicarse.',
    comp: 'pez', rareza: 20,
    base: B({ dano: 18, cant: 5, area: 1.3, enfr: 1.9, inter: 0.08, perfora: 999, rapidez: 340, radio: 12, dur: 2.6, golpeCada: 0.3 }),
    niveles: [
      n('+1 pececito', { cant: 1 }),
      n('+5 de daño', { dano: 5 }),
      n('+1 pececito', { cant: 1 }),
      n('+15 % de área', { area: 0.15 }),
      n('+1 pececito', { cant: 1 }),
      n('+5 de daño', { dano: 5 }),
      n('+2 pececitos', { cant: 2 }),
    ],
  },
  // ------------------------------------------------------------------------------------------------ Greatest Jubilee
  confeti: {
    id: 'confeti', nombre: 'Confeti de espuma', original: 'Greatest Jubilee', secreta: true,
    desc: 'Fuegos artificiales de espuma arriba en la pantalla. A veces hacen aparecer velitas. Al nivel 8, un show de luces abajo.',
    comp: 'confeti', rareza: 20,
    base: B({ dano: 8, area: 1, cant: 1, enfr: 3, inter: 0.2, perfora: 999, radio: 46, crit: 0.05, critX: 2, rapidez: 300 }),
    niveles: [
      n('+1 cohete', { cant: 1 }),
      n('Se recarga 0,5 s más rápido y +10 de daño', { enfr: -0.5, dano: 10 }),
      n('+1 cohete', { cant: 1 }),
      n('+25 % de área y +10 de daño', { area: 0.25, dano: 10 }),
      n('+1 cohete', { cant: 1 }),
      n('+25 % de área y se recarga 0,5 s más rápido', { area: 0.25, enfr: -0.5 }),
      n('+1 cohete y el show de luces', { cant: 1 }),
    ],
  },
  // ------------------------------------------------------------------------------------------------ Las de rebote
  hueso: {
    id: 'hueso', nombre: 'Hueso del perrito', original: 'Bone', secreta: true,
    desc: 'Un hueso que rebota en los mugrosos y en los bordes de la pantalla.',
    comp: 'rebote', rareza: 15,
    base: B({ dano: 8, area: 1.2, vel: 0.75, cant: 1, dur: 2, enfr: 3, inter: 0.05, perfora: 999, rapidez: 320, radio: 9, golpeCada: 0.3 }),
    niveles: [
      n('+20 % de área y dura 0,2 s más', { area: 0.2, dur: 0.2 }),
      n('+1 hueso y +15 de daño', { cant: 1, dano: 15 }),
      n('+20 % de área y +50 % de velocidad', { area: 0.2, vel: 0.5 }),
      n('+1 hueso y +15 de daño', { cant: 1, dano: 15 }),
      n('Dura 0,2 s más', { dur: 0.2 }),
      n('+15 de daño', { dano: 15 }),
      n('Dura 0,2 s más y +50 % de velocidad', { dur: 0.2, vel: 0.5 }),
    ],
  },
  bombaBano: {
    id: 'bombaBano', nombre: 'Bomba de baño', original: 'Cherry Bomb', secreta: true,
    desc: 'Rebota por ahí y a veces revienta en espuma de colores.',
    comp: 'rebote', rareza: 15,
    base: B({ dano: 14, area: 1, cant: 1, dur: 2, enfr: 3, inter: 0.3, perfora: 999, rapidez: 300, radio: 10, golpeCada: 0.3, crit: 0.4, critX: 1 }),
    niveles: [
      n('+25 % de área y +30 % de velocidad', { area: 0.25, vel: 0.3 }),
      n('Revienta más seguido (50 %)', { crit: 0.1 }),
      n('+1 bomba', { cant: 1 }),
      n('+25 % de área y +5 de daño', { area: 0.25, dano: 5 }),
      n('Revienta más seguido (60 %)', { crit: 0.1 }),
      n('+25 % de área y +30 % de velocidad', { area: 0.25, vel: 0.3 }),
      n('+25 % de área y +5 de daño', { area: 0.25, dano: 5 }),
    ],
  },
  barquito: {
    id: 'barquito', nombre: 'Barquito de papel', original: 'Carréllo', secreta: true,
    desc: 'Navega de lado a lado de la pantalla atropellando mugre; la cantidad le da más rebotes y al final se deshace de un golpe.',
    comp: 'barco', rareza: 15,
    base: B({ dano: 15, area: 0.8, cant: 2, enfr: 5.5, inter: 0, perfora: 999, rapidez: 260, radio: 16, golpeCada: 0.4, retro: 1.4 }),
    niveles: [
      n('+20 % de área', { area: 0.2 }),
      n('+30 de daño (y se recarga 0,3 s más lento)', { dano: 30, enfr: 0.3 }),
      n('+50 % de velocidad', { vel: 0.5 }),
      n('+30 de daño (y se recarga 0,3 s más lento)', { dano: 30, enfr: 0.3 }),
      n('+20 % de área', { area: 0.2 }),
      n('+30 de daño (y se recarga 0,3 s más lento)', { dano: 30, enfr: 0.3 }),
      n('+50 % de velocidad', { vel: 0.5 }),
    ],
  },
  talco: {
    id: 'talco', nombre: 'Talco de florecitas', original: 'Celestial Dusting', secreta: true,
    desc: 'Florecitas de talco hacia atrás que rebotan en los bordes y al final sueltan pétalos. Se recarga caminando.',
    comp: 'talco', rareza: 15,
    base: B({ dano: 12, cant: 1, vel: 0.7, dur: 0.6, enfr: 4, inter: 0.1, perfora: 999, rapidez: 330, radio: 14, golpeCada: 0.3 }),
    niveles: [
      n('Duran 1 s más', { dur: 1 }),
      n('+30 % de velocidad', { vel: 0.3 }),
      n('+5 de daño', { dano: 5 }),
      n('+30 % de velocidad', { vel: 0.3 }),
      n('+1 florecita', { cant: 1 }),
      n('+30 % de velocidad', { vel: 0.3 }),
      n('Los mugrosos que caen a veces sueltan corazoncitos (vida)', {}),
    ],
  },
  bolitasGel: {
    id: 'bolitasGel', nombre: 'Bolitas de gel', original: 'La Robba', secreta: true,
    desc: 'Llueven bolitas de gel desde arriba que rebotan de mugroso en mugroso.',
    comp: 'gel', rareza: 15,
    base: B({ dano: 10, cant: 3, dur: 2, enfr: 4.5, inter: 0.3, perfora: 999, rapidez: 330, radio: 9, golpeCada: 0.5 }),
    niveles: [
      n('+1 bolita y duran 0,3 s más', { cant: 1, dur: 0.3 }),
      n('+10 de daño', { dano: 10 }),
      n('+1 bolita y duran 0,3 s más', { cant: 1, dur: 0.3 }),
      n('+10 de daño y +50 % de velocidad', { dano: 10, vel: 0.5 }),
      n('+1 bolita y duran 0,3 s más', { cant: 1, dur: 0.3 }),
      n('+10 de daño', { dano: 10 }),
      n('+1 bolita y duran 0,3 s más', { cant: 1, dur: 0.3 }),
    ],
  },
};

/** Las uniones (como Vandalier y Phieraggi) piden además una pasiva. */
export const UNION_PIDE: Partial<Record<IdArma, IdPasiva>> = { perfumeAmor: 'curita' };

export const BASICAS = (Object.values(ARMAS) as DefArma[]).filter((a) => !a.de).map((a) => a.id);
/** Las que de verdad disparan (sin el neceser ni el bolsillo, que solo dejan escoger). */
export const DISPARAN = BASICAS.filter((id) => ARMAS[id].comp !== 'selector');
export const EVOLUCIONADAS = (Object.values(ARMAS) as DefArma[]).filter((a) => a.de).map((a) => a.id);
export const MAX_ARMA = 8;

/** Las estadísticas del arma en un nivel (suma los cambios de cada nivel). */
export function baseEnNivel(id: IdArma, nivel: number): BaseArma {
  const a = ARMAS[id];
  const b = { ...a.base };
  for (let i = 0; i < Math.min(nivel - 1, a.niveles.length); i++) {
    for (const [k, v] of Object.entries(a.niveles[i].d) as [keyof BaseArma, number][]) b[k] += v;
  }
  return b;
}

/** Las básicas llegan al 8; las evolucionadas, al 1 (salvo las que siguen subiendo, como el doble copito). */
export const maxNivelArma = (id: IdArma) => (ARMAS[id].de || ARMAS[id].comp === 'selector' ? ARMAS[id].niveles.length + 1 : MAX_ARMA);

/** Todo lo que un arma lleva adentro (la afeitada lleva la máquina, el toallazo y la toalla): si ya tiene una de
 *  esas, no vuelve a salir en las cartas. */
export function linaje(id: IdArma, l = new Set<IdArma>()): Set<IdArma> {
  for (const d of ARMAS[id].de ?? []) if (!l.has(d)) {
    l.add(d);
    linaje(d, l);
  }
  return l;
}

/** Las pasivas que pide una evolución (la de siempre, la segunda de los anillos y la de las uniones). */
export const pasivasDeEvo = (def: DefArma): IdPasiva[] =>
  def.evo ? [def.evo.pasiva, def.evo.y, UNION_PIDE[def.evo.a]].filter((x): x is IdPasiva => !!x) : [];

// ------------------------------------------------------------------------------------------------------ Pasivas
export interface DefPasiva {
  id: IdPasiva;
  nombre: string;
  original: string;
  desc: string;
  stat: Stat;
  /** Lo que suma cada nivel. */
  paso: number;
  max: number;
  rareza: number;
  secreta?: boolean;
  /** Otras estadísticas que suma cada nivel (la cajita de música sube cuatro a la vez). */
  mas?: Partial<Record<Stat, number>>;
  /** Lo que trae además el último nivel (la maldición de la cajita). */
  ultimo?: Partial<Record<Stat, number>>;
  /** No sale en las cartas: se encuentra escondida en un escenario (los anillos y los aretes). */
  escondida?: boolean;
}

export const PASIVAS: Record<IdPasiva, DefPasiva> = {
  jabonFuerte: { id: 'jabonFuerte', nombre: 'Jabón extra fuerte', original: 'Espinaca', desc: '+10 % de daño', stat: 'poder', paso: 0.1, max: 5, rareza: 100 },
  gorro: { id: 'gorro', nombre: 'Gorro de baño', original: 'Armadura', desc: '+1 de armadura (cada golpe duele menos)', stat: 'armadura', paso: 1, max: 5, rareza: 100 },
  crema: { id: 'crema', nombre: 'Crema hidratante', original: 'Corazón hueco', desc: '+20 % de vida máxima', stat: 'vida', paso: 0.2, max: 5, rareza: 100 },
  cremaNoche: { id: 'cremaNoche', nombre: 'Crema de noche', original: 'Pummarola', desc: 'Recuperas 0,2 de vida por segundo', stat: 'recuperacion', paso: 0.2, max: 5, rareza: 100 },
  relojArena: { id: 'relojArena', nombre: 'Reloj de arena', original: 'Tomo vacío', desc: 'Las armas se recargan 8 % más rápido', stat: 'enfriamiento', paso: 0.08, max: 5, rareza: 100 },
  lupa: { id: 'lupa', nombre: 'Espejo de aumento', original: 'Candelabrador', desc: '+10 % de área', stat: 'area', paso: 0.1, max: 5, rareza: 100 },
  liga: { id: 'liga', nombre: 'Liga del pelo', original: 'Brazalete', desc: '+10 % de velocidad de los proyectiles', stat: 'velocidad', paso: 0.1, max: 5, rareza: 100 },
  sales: { id: 'sales', nombre: 'Sales de baño', original: 'Hechizo', desc: '+10 % de duración de los efectos', stat: 'duracion', paso: 0.1, max: 5, rareza: 100 },
  espejoDoble: { id: 'espejoDoble', nombre: 'Espejo doble', original: 'Duplicador', desc: '+1 proyectil en todas las armas', stat: 'cantidad', paso: 1, max: 2, rareza: 60 },
  pantuflas: { id: 'pantuflas', nombre: 'Pantuflas veloces', original: 'Alas', desc: '+10 % de velocidad al caminar', stat: 'movimiento', paso: 0.1, max: 5, rareza: 100 },
  iman: { id: 'iman', nombre: 'Imán de gotitas', original: 'Atractorbe', desc: 'Recoges las gotitas desde 40 % más lejos', stat: 'iman', paso: 0.4, max: 5, rareza: 100 },
  trebol: { id: 'trebol', nombre: 'Trébol de la suerte', original: 'Trébol', desc: '+10 % de suerte', stat: 'suerte', paso: 0.1, max: 5, rareza: 100 },
  corona: { id: 'corona', nombre: 'Corona de espuma', original: 'Corona', desc: '+8 % de experiencia', stat: 'crecimiento', paso: 0.08, max: 5, rareza: 80 },
  alcancia: { id: 'alcancia', nombre: 'Alcancía de cerdito', original: 'Máscara de piedra', desc: '+10 % de gotas doradas', stat: 'codicia', paso: 0.1, max: 5, rareza: 80 },
  espejoRoto: { id: 'espejoRoto', nombre: 'Espejo roto', original: 'Calavera', desc: 'Siete años de mala suerte: +10 % de enemigos, más rápidos y más duros (y más experiencia)', stat: 'maldicion', paso: 0.1, max: 5, rareza: 60, secreta: true },
  curita: { id: 'curita', nombre: 'Curita de corazón', original: 'Tiramisú', desc: 'Revives una vez más cuando te tumban', stat: 'revivir', paso: 1, max: 2, rareza: 40, secreta: true },
  // Versión 2
  cajitaMusica: {
    id: 'cajitaMusica', nombre: 'Cajita de música', original: "Torrona's Box", secreta: true,
    desc: '+4 % de daño, área, velocidad y duración por nivel… pero el nivel 9 trae +50 % de maldición',
    stat: 'poder', paso: 0.04, mas: { area: 0.04, velocidad: 0.04, duracion: 0.04 }, ultimo: { maldicion: 0.5 }, max: 9, rareza: 40,
  },
  anilloPlata: {
    id: 'anilloPlata', nombre: 'Anillo de plata', original: 'Silver Ring', secreta: true, escondida: true,
    desc: '+5 % de duración y +5 % de área (escondido en La Cara)', stat: 'duracion', paso: 0.05, mas: { area: 0.05 }, max: 5, rareza: 0,
  },
  anilloOro: {
    id: 'anilloOro', nombre: 'Anillo de oro', original: 'Gold Ring', secreta: true, escondida: true,
    desc: '+6 % de experiencia y +5 % de maldición (escondido en El Lavamanos)', stat: 'crecimiento', paso: 0.06, mas: { maldicion: 0.05 }, max: 5, rareza: 0,
  },
  aretIzq: {
    id: 'aretIzq', nombre: 'Arete izquierdo', original: 'Metaglio Left', secreta: true, escondida: true,
    desc: '+5 % de vida y recuperas 0,1 por segundo (escondido en La Bañera)', stat: 'vida', paso: 0.05, mas: { recuperacion: 0.1 }, max: 5, rareza: 0,
  },
  aretDer: {
    id: 'aretDer', nombre: 'Arete derecho', original: 'Metaglio Right', secreta: true, escondida: true,
    desc: '+5 % de gotas doradas y +5 % de maldición (escondido en La Cara)', stat: 'codicia', paso: 0.05, mas: { maldicion: 0.05 }, max: 5, rareza: 0,
  },
  bataGruesa: {
    id: 'bataGruesa', nombre: 'Bata gruesa', original: 'Parm Aegis', secreta: true,
    desc: 'Después de un golpe quedas invencible un momentico más (+0,12 s) y +5 % de vida', stat: 'vida', paso: 0.05, max: 5, rareza: 60,
  },
  velaAromatica: {
    id: 'velaAromatica', nombre: 'Vela aromática', original: "Karoma's Mana", secreta: true,
    desc: 'Su olor atrae: +8 % de mugrosos (más experiencia) y +5 % de área', stat: 'area', paso: 0.05, max: 5, rareza: 50,
  },
};

/** Los anillos y los aretes: dónde están escondidos (lejos del comienzo, cuidados por un mugroso de élite). Salen
 *  después de conseguir el espejito de mano (el logro «El espejito de mano»). */
export const ESCONDIDAS: { id: IdPasiva; escenario: string; x: number; y: number; pista: string }[] = [
  { id: 'anilloPlata', escenario: 'cara', x: 1750, y: -1380, pista: 'muy arriba a la derecha de La Cara' },
  { id: 'aretDer', escenario: 'cara', x: -1900, y: 1300, pista: 'muy abajo a la izquierda de La Cara' },
  { id: 'anilloOro', escenario: 'lavamanos', x: 3200, y: -120, pista: 'bien a la derecha de El Lavamanos' },
  { id: 'aretIzq', escenario: 'banera', x: -1500, y: -1500, pista: 'muy arriba a la izquierda de La Bañera' },
];

export const ID_PASIVAS = Object.keys(PASIVAS) as IdPasiva[];
export const ID_ARMAS = Object.keys(ARMAS) as IdArma[];
export const MAX_RANURAS = 6;
