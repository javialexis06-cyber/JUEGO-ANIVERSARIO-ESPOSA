// Las aventuras de «Lavarse la cara» (como las del original): mini campañas de capítulos cortos, cada uno con su
// escenario, su disfraz fijo, su carta y sus reglas (el piso que corre, el reloj al doble, la ruleta…). Un capítulo
// se gana aguantando su tiempo o, si tiene jefe final, venciéndolo; no llega la Ducha Helada. Aquí van solo las
// reglas (con ids neutros): la historia de cada capítulo (las aventuras de «la protagonista») vive en `pareja.ts`,
// así que en la versión para amigos las aventuras ni se ven.
import type { EventoOleada } from './escenarios';
import type { IdCarta, IdEnemigo, IdEscenario, IdModo, Rol } from './tipos';

export interface DefCapitulo {
  id: string;
  /** La aventura a la que pertenece y su número dentro de ella (desde 1). */
  aventura: string;
  numero: number;
  escenario: IdEscenario;
  /** Lo que hay que aguantar (segundos del reloj: con Apurado pasan al doble). */
  duracion: number;
  /** Desde qué minuto del escenario arrancan las oleadas (para que no empiece en lo más fácil). */
  desde: number;
  apurado?: boolean;
  modos?: IdModo[];
  /** El disfraz de cada uno (fijo, lo tenga o no). */
  disfraz: Record<Rol, string>;
  carta: IdCarta;
  /** Los eventos del capítulo (en vez de los del escenario). */
  eventos: EventoOleada[];
  /** El jefe que llega cuando se acaba el tiempo: el capítulo se gana al vencerlo. */
  jefeFinal?: IdEnemigo;
  /** Qué tan duros son los mugrosos (vida y, un poco menos, lo que pegan): los capítulos son cortos y se empiezan en
   *  nivel 1, así que van más suaves que una partida normal y se ponen más difíciles capítulo a capítulo. */
  dureza: number;
  /** Gotas doradas la primera vez que se pasa. */
  premio: number;
}

export interface DefAventura {
  id: string;
  /** Lo que se ve en la ficha (el título y la historia, en `pareja.ts`). */
  emoji: string;
  color: string;
  /** Gotas doradas al terminar todos sus capítulos. */
  premio: number;
  capitulos: DefCapitulo[];
}

const m = (mm: number, ss = 0) => mm * 60 + ss;
const EL = 'el_panda';

export const AVENTURAS: DefAventura[] = [
  {
    id: 'a1', emoji: '🚗', color: '#F29B38', premio: 1000,
    capitulos: [
      {
        id: 'a1c1', aventura: 'a1', numero: 1, escenario: 'tobogan', duracion: m(4), desde: 0, dureza: 0.5, carta: 'viajeLargo', premio: 200,
        disfraz: { ella: 'ella_pulga', el: EL },
        eventos: [
          { t: m(1), tipo: 'enjambre', enemigo: 'mosquitaDesague', cant: 16 },
          { t: m(2, 20), tipo: 'elite', enemigo: 'sapito' },
          { t: m(3, 20), tipo: 'enjambre', enemigo: 'gusanito', cant: 20 },
        ],
      },
      {
        id: 'a1c2', aventura: 'a1', numero: 2, escenario: 'tobogan', duracion: m(6), desde: 0, dureza: 0.5, apurado: true, carta: 'viajeLargo', premio: 300,
        disfraz: { ella: 'ella_pulga', el: EL }, jefeFinal: 'patoInflable',
        eventos: [
          { t: m(1, 30), tipo: 'muro', enemigo: 'chancleta', cant: 20, aviso: '¡Una fila de chancletas en la carretera!' },
          { t: m(3), tipo: 'elite', enemigo: 'chancleta' },
          { t: m(4, 30), tipo: 'enjambre', enemigo: 'gusanito', cant: 26 },
        ],
      },
      {
        id: 'a1c3', aventura: 'a1', numero: 3, escenario: 'lavamanos', duracion: m(5), desde: 0, dureza: 0.5, modos: ['hiper'], carta: 'viajeLargo', premio: 400,
        disfraz: { ella: 'ella_pulga', el: EL },
        eventos: [
          { t: m(1), tipo: 'muro', enemigo: 'sarro', cant: 22 },
          { t: m(2), tipo: 'enjambre', enemigo: 'gotaGrasa', cant: 22 },
          { t: m(3, 20), tipo: 'elite', enemigo: 'cucaracha' },
          { t: m(4, 20), tipo: 'enjambre', enemigo: 'gotaGrasa', cant: 28 },
        ],
      },
      {
        id: 'a1c4', aventura: 'a1', numero: 4, escenario: 'banera', duracion: m(6), desde: 1, dureza: 0.6, carta: 'viajeLargo', premio: 500,
        disfraz: { ella: 'ella_guerrera', el: EL }, jefeFinal: 'barroNegro',
        eventos: [
          { t: m(1, 30), tipo: 'elite', enemigo: 'piojo' },
          { t: m(3), tipo: 'enjambre', enemigo: 'pulga', cant: 26 },
          { t: m(4, 30), tipo: 'anillo', enemigo: 'pulga', cant: 30, aviso: '¡Rodeados!' },
        ],
      },
    ],
  },
  {
    id: 'a2', emoji: '🚌', color: '#6FC3A0', premio: 1000,
    capitulos: [
      {
        id: 'a2c1', aventura: 'a2', numero: 1, escenario: 'jabonera', duracion: m(4), desde: 0, dureza: 0.55, carta: 'maraton', premio: 200,
        disfraz: { ella: 'ella_diva', el: 'el_perro' },
        eventos: [
          { t: m(1), tipo: 'muro', enemigo: 'cuchilla', cant: 18, aviso: '¡Fila en la taquilla!' },
          { t: m(2, 20), tipo: 'elite', enemigo: 'algodon' },
          { t: m(3, 20), tipo: 'enjambre', enemigo: 'cuchilla', cant: 20 },
        ],
      },
      {
        id: 'a2c2', aventura: 'a2', numero: 2, escenario: 'espejo', duracion: m(5), desde: 0, dureza: 0.7, carta: 'maraton', premio: 300,
        disfraz: { ella: 'ella_diva', el: 'el_perro' },
        eventos: [
          { t: m(1), tipo: 'enjambre', enemigo: 'gotaGrasa', cant: 20 },
          { t: m(2, 30), tipo: 'elite', enemigo: 'acaro' },
          { t: m(4), tipo: 'anillo', enemigo: 'espumaSucia', cant: 24 },
        ],
      },
      {
        id: 'a2c3', aventura: 'a2', numero: 3, escenario: 'tobogan', duracion: m(5), desde: 1, dureza: 0.45, modos: ['ruleta'], carta: 'maraton', premio: 400,
        disfraz: { ella: 'ella_diva', el: 'el_perro' },
        eventos: [
          { t: m(1, 30), tipo: 'elite', enemigo: 'sapito' },
          { t: m(3), tipo: 'muro', enemigo: 'chancleta', cant: 24 },
        ],
      },
      {
        id: 'a2c4', aventura: 'a2', numero: 4, escenario: 'matera', duracion: m(5), desde: 1, dureza: 0.8, carta: 'maraton', premio: 500,
        disfraz: { ella: 'ella_guerrera', el: 'el_perro' },
        eventos: [
          { t: m(1), tipo: 'elite', enemigo: 'cactus' },
          { t: m(2, 30), tipo: 'anillo', enemigo: 'brotecito', cant: 26 },
          { t: m(4), tipo: 'elite', enemigo: 'atrapamoscas' },
        ],
      },
    ],
  },
  {
    id: 'a3', emoji: '✈️', color: '#7DB7E8', premio: 1500,
    capitulos: [
      {
        id: 'a3c1', aventura: 'a3', numero: 1, escenario: 'cara', duracion: m(4), desde: 0, dureza: 0.55, carta: 'relojQuieto', premio: 200,
        disfraz: { ella: 'ella_sirena', el: 'el_astronauta' },
        eventos: [
          { t: m(1), tipo: 'enjambre', enemigo: 'germen', cant: 18 },
          { t: m(2), tipo: 'anillo', enemigo: 'puntoNegro', cant: 22, aviso: '¡Todo el mundo al mostrador!' },
          { t: m(3, 20), tipo: 'elite', enemigo: 'acaro' },
        ],
      },
      {
        id: 'a3c2', aventura: 'a3', numero: 2, escenario: 'jabonera', duracion: m(5), desde: 0, dureza: 0.5, carta: 'relojQuieto', premio: 300,
        disfraz: { ella: 'ella_sirena', el: 'el_astronauta' }, jefeFinal: 'donFrasco',
        eventos: [
          { t: m(1), tipo: 'enjambre', enemigo: 'algodon', cant: 18, aviso: '¡La fila no se mueve!' },
          { t: m(2, 30), tipo: 'elite', enemigo: 'champuDerramado' },
          { t: m(4), tipo: 'elite', enemigo: 'hilacha' },
        ],
      },
      {
        id: 'a3c3', aventura: 'a3', numero: 3, escenario: 'laberinto', duracion: m(5), desde: 0, dureza: 0.45, carta: 'relojQuieto', premio: 400,
        disfraz: { ella: 'ella_sirena', el: 'el_astronauta' },
        eventos: [
          { t: m(1, 20), tipo: 'elite', enemigo: 'ratoncito' },
          { t: m(3), tipo: 'enjambre', enemigo: 'pulga', cant: 16 },
          { t: m(4, 10), tipo: 'elite', enemigo: 'cucaracha' },
        ],
      },
      {
        id: 'a3c4', aventura: 'a3', numero: 4, escenario: 'espejo', duracion: m(6), desde: 2, dureza: 0.65, carta: 'relojQuieto', premio: 500,
        disfraz: { ella: 'ella_muneca', el: 'el_panda' },
        eventos: [
          { t: m(1), tipo: 'flotar', enemigo: 'burbujaSucia', cant: 20 },
          { t: m(2, 30), tipo: 'elite', enemigo: 'bacteria' },
          { t: m(4), tipo: 'anillo', enemigo: 'lagana', cant: 28, aviso: '¡Las lagañas no la dejan dormir!' },
          { t: m(5, 20), tipo: 'elite', enemigo: 'lagana' },
        ],
      },
      {
        id: 'a3c5', aventura: 'a3', numero: 5, escenario: 'desfile', duracion: m(6), desde: 1, dureza: 0.6, carta: 'relojQuieto', premio: 600,
        disfraz: { ella: 'ella_guerrera', el: 'el_heroe' }, jefeFinal: 'reinaCremas',
        eventos: [
          { t: m(1), tipo: 'jefe', enemigo: 'reinaPompa', aviso: '¡La Reina Pompa se coló en la fila!' },
          { t: m(2, 30), tipo: 'jefe', enemigo: 'regaderaLoca' },
          { t: m(4), tipo: 'jefe', enemigo: 'reyRaton' },
          { t: m(5, 15), tipo: 'enjambre', enemigo: 'pulga', cant: 24 },
        ],
      },
    ],
  },
];

export const CAPITULOS: DefCapitulo[] = AVENTURAS.flatMap((a) => a.capitulos);
export const CAPITULO: Record<string, DefCapitulo> = Object.fromEntries(CAPITULOS.map((c) => [c.id, c]));
export const ID_CAPITULOS = CAPITULOS.map((c) => c.id);
export const AVENTURA: Record<string, DefAventura> = Object.fromEntries(AVENTURAS.map((a) => [a.id, a]));

/** El capítulo que sigue en la misma aventura (null si era el último). */
export function siguienteCapitulo(id: string): string | null {
  const c = CAPITULO[id];
  const a = c && AVENTURA[c.aventura];
  return a?.capitulos[c.numero]?.id ?? null;
}

/** Un capítulo se abre cuando se pasó el anterior (el primero de cada aventura, siempre). */
export const capituloAbierto = (hechos: readonly string[], id: string) => {
  const c = CAPITULO[id];
  if (!c) return false;
  return c.numero === 1 || hechos.includes(AVENTURA[c.aventura].capitulos[c.numero - 2].id);
};

/** ¿Ya pasó todos los capítulos de la aventura? */
export const aventuraCompleta = (hechos: readonly string[], id: string) => !!AVENTURA[id]?.capitulos.every((c) => hechos.includes(c.id));
