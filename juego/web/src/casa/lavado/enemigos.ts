// Los mugrosos de la cara, del lavamanos y de la bañera. Como en el original, la vida de los enemigos comunes es
// fija (la dificultad sube porque cada minuto llegan tipos nuevos y más duros, y más de ellos); la de los jefes se
// multiplica por el nivel de quien juega. La Ducha Helada (la Parca del original) llega a los 30 minutos.
import type { IdEnemigo } from './tipos';

export type CompEnemigo =
  | 'perseguir' // camina derechito hacia el más cercano
  | 'revolotear' // como los murciélagos: persigue culebreando
  | 'enjambre' // cruza la pantalla en línea recta y se va
  | 'flotar' // cruza en ondas (las cabezas de medusa)
  | 'saltar' // a brincos
  | 'embestir' // se queda quieto y se lanza
  | 'parca';

export interface DefEnemigo {
  id: IdEnemigo;
  nombre: string;
  /** Para la colección (el bestiario). */
  desc: string;
  vida: number;
  /** Unidades por segundo. */
  vel: number;
  /** Daño por toque. */
  dano: number;
  xp: number;
  /** Radio para los choques. */
  radio: number;
  /** Alto del dibujo (unidades). */
  tam: number;
  /** Cuánto lo mueve un golpe (0 = nada). */
  retro: number;
  comp: CompEnemigo;
  jefe?: boolean;
  /** Se puede congelar con el hielo y el hilo dental (los jefes grandes no tanto). */
  congelable?: boolean;
}

const E = (d: Omit<DefEnemigo, 'retro' | 'comp'> & Partial<Pick<DefEnemigo, 'retro' | 'comp'>>): DefEnemigo => ({ retro: 1, comp: 'perseguir', congelable: true, ...d });

export const ENEMIGOS: Record<IdEnemigo, DefEnemigo> = {
  // ------------------------------------------------------------------------------------------------ La Cara
  germen: E({ id: 'germen', nombre: 'Germen', desc: 'Verde, peludito y metido. Vuela en bandadas como murciélago.', vida: 4, vel: 74, dano: 5, xp: 1, radio: 9, tam: 30, comp: 'revolotear' }),
  puntoNegro: E({ id: 'puntoNegro', nombre: 'Punto negro', desc: 'Lento pero terco. Siempre vuelve, sobre todo en la nariz.', vida: 14, vel: 46, dano: 6, xp: 1, radio: 11, tam: 34 }),
  gotaGrasa: E({ id: 'gotaGrasa', nombre: 'Gota de grasa', desc: 'Brillante y resbalosa. Llega en manada por la zona T.', vida: 8, vel: 92, dano: 3, xp: 1, radio: 10, tam: 30, comp: 'enjambre' }),
  acaro: E({ id: 'acaro', nombre: 'Ácaro', desc: 'Ocho patas, cero modales. Vive en la almohada y viene de visita.', vida: 16, vel: 82, dano: 8, xp: 1, radio: 10, tam: 34 }),
  granito: E({ id: 'granito', nombre: 'Granito', desc: 'Rosado, gordito y con la cabeza blanca. No lo espiches.', vida: 70, vel: 40, dano: 10, xp: 2, radio: 15, tam: 44, retro: 0.6 }),
  caspa: E({ id: 'caspa', nombre: 'Caspa', desc: 'Copitos que caen del pelo y cruzan la cara en ondas.', vida: 10, vel: 76, dano: 5, xp: 1, radio: 10, tam: 30, comp: 'flotar' }),
  bacteria: E({ id: 'bacteria', nombre: 'Bacteria', desc: 'Larga, azul y rápida. Se multiplica cuando nadie la ve.', vida: 220, vel: 68, dano: 15, xp: 2, radio: 13, tam: 44 }),
  pelusa: E({ id: 'pelusa', nombre: 'Pelusa', desc: 'Una motica gris del cobijo. Parece tierna. No lo es.', vida: 180, vel: 54, dano: 13, xp: 2, radio: 14, tam: 42 }),
  virus: E({ id: 'virus', nombre: 'Virus de gripa', desc: 'Lleno de chuzos. Llega justo antes del paseo.', vida: 420, vel: 58, dano: 19, xp: 3, radio: 14, tam: 44 }),
  barrito: E({ id: 'barrito', nombre: 'Barrito rojo', desc: 'Inflamado y bravo. Sale el día de la foto.', vida: 750, vel: 46, dano: 23, xp: 3, radio: 17, tam: 50 }),
  lagana: E({ id: 'lagana', nombre: 'Lagaña', desc: 'Pegajosa, amarillita y madrugadora.', vida: 1200, vel: 38, dano: 26, xp: 4, radio: 17, tam: 52, retro: 0.3 }),
  mugre: E({ id: 'mugre', nombre: 'Mugre', desc: 'Una bola de mugre de tres días. Pesada como lunes.', vida: 2600, vel: 34, dano: 32, xp: 6, radio: 23, tam: 66, retro: 0.15 }),
  moco: E({ id: 'moco', nombre: 'Moco', desc: 'Verde, baboso y con ganas de abrazar. Nadie lo quiere.', vida: 1700, vel: 58, dano: 30, xp: 5, radio: 18, tam: 54 }),
  // ------------------------------------------------------------------------------------------------ El Lavamanos
  sarro: E({ id: 'sarro', nombre: 'Sarro', desc: 'Costrita amarilla de las muelas. Se pega y no se va.', vida: 10, vel: 52, dano: 8, xp: 1, radio: 12, tam: 38 }),
  pastaSeca: E({ id: 'pastaSeca', nombre: 'Pasta seca', desc: 'El gusanito de crema dental que quedó en el lavamanos.', vida: 30, vel: 62, dano: 10, xp: 2, radio: 12, tam: 40 }),
  hongo: E({ id: 'hongo', nombre: 'Hongo', desc: 'Nace en las esquinas húmedas. Tiene sombrerito y mala cara.', vida: 240, vel: 50, dano: 16, xp: 2, radio: 14, tam: 46 }),
  cucaracha: E({ id: 'cucaracha', nombre: 'Cucaracha', desc: 'Se queda quieta, te mira… y se lanza. ¡Y a veces vuela!', vida: 100, vel: 96, dano: 15, xp: 2, radio: 13, tam: 42, comp: 'embestir' }),
  pelo: E({ id: 'pelo', nombre: 'Pelo suelto', desc: 'Un pelo largo que quedó en el jabón. Escalofriante.', vida: 450, vel: 70, dano: 19, xp: 3, radio: 13, tam: 48 }),
  moho: E({ id: 'moho', nombre: 'Moho', desc: 'Peludito, negro y verde. Huele a toalla olvidada.', vida: 1250, vel: 40, dano: 27, xp: 4, radio: 18, tam: 54, retro: 0.3 }),
  jabonSucio: E({ id: 'jabonSucio', nombre: 'Jabón sucio', desc: 'El jabón con pelos y rayitas negras. Un tanque.', vida: 2800, vel: 36, dano: 33, xp: 6, radio: 22, tam: 62, retro: 0.15 }),
  // ------------------------------------------------------------------------------------------------ La Bañera
  piojo: E({ id: 'piojo', nombre: 'Piojo', desc: 'Salta de cabeza en cabeza. Ahora salta hacia ti.', vida: 24, vel: 82, dano: 9, xp: 1, radio: 11, tam: 36, comp: 'saltar' }),
  mosquito: E({ id: 'mosquito', nombre: 'Mosquito', desc: 'Zumba en la oreja a las tres de la mañana. Viene en escuadrón.', vida: 7, vel: 122, dano: 3, xp: 1, radio: 10, tam: 34, comp: 'enjambre' }),
  pulga: E({ id: 'pulga', nombre: 'Pulga', desc: 'Chiquita y brincona. (No confundir con la pulga aventurera.)', vida: 9, vel: 90, dano: 7, xp: 1, radio: 9, tam: 30, comp: 'saltar' }),
  burbujaSucia: E({ id: 'burbujaSucia', nombre: 'Burbuja sucia', desc: 'Una burbuja con mugre adentro. Flota bravísima.', vida: 200, vel: 46, dano: 17, xp: 3, radio: 15, tam: 48, comp: 'flotar' }),
  babosa: E({ id: 'babosa', nombre: 'Babosa', desc: 'Deja un caminito brillante. Lenta pero tiene mucha vida.', vida: 1700, vel: 32, dano: 28, xp: 5, radio: 19, tam: 56, retro: 0.2 }),
  espinilla: E({ id: 'espinilla', nombre: 'Espinilla', desc: 'Con punta blanca y actitud. La élite del cutis.', vida: 460, vel: 52, dano: 23, xp: 3, radio: 16, tam: 48 }),
  // ------------------------------------------------------------------------------------------------ Jefes (vida × nivel)
  espinillon: E({ id: 'espinillon', nombre: 'El Espinillón', desc: 'El rey de los granitos, con corona y todo. Embiste cuando se enoja.', vida: 420, vel: 56, dano: 30, xp: 120, radio: 40, tam: 130, retro: 0, comp: 'embestir', jefe: true, congelable: false }),
  reinaCaspa: E({ id: 'reinaCaspa', nombre: 'La Reina Caspa', desc: 'Llega nevando. Guarda una carta de amor perdida.', vida: 300, vel: 72, dano: 24, xp: 120, radio: 34, tam: 118, retro: 0, comp: 'revolotear', jefe: true, congelable: false }),
  granMoco: E({ id: 'granMoco', nombre: 'El Gran Moco', desc: 'Un moco del tamaño de una arepa grande. Baboso y orgulloso.', vida: 560, vel: 50, dano: 34, xp: 150, radio: 42, tam: 136, retro: 0, jefe: true, congelable: false }),
  senorLagana: E({ id: 'senorLagana', nombre: 'Don Lagaña', desc: 'Madruga más que el gallo y no se lava nunca.', vida: 700, vel: 48, dano: 38, xp: 160, radio: 42, tam: 136, retro: 0, jefe: true, congelable: false }),
  barroNegro: E({ id: 'barroNegro', nombre: 'El Barro Negro', desc: 'Mugre de una semana de paseo. Hace temblar el piso.', vida: 900, vel: 46, dano: 44, xp: 200, radio: 48, tam: 150, retro: 0, comp: 'embestir', jefe: true, congelable: false }),
  senorSarro: E({ id: 'senorSarro', nombre: 'El Señor Sarro', desc: 'Una muela de sarro con bigote. Odia el cepillo.', vida: 450, vel: 52, dano: 32, xp: 120, radio: 40, tam: 130, retro: 0, jefe: true, congelable: false }),
  donaCucaracha: E({ id: 'donaCucaracha', nombre: 'Doña Cucaracha', desc: 'La mamá de todas. Corre, vuela y no tiene vergüenza.', vida: 620, vel: 70, dano: 36, xp: 150, radio: 38, tam: 126, retro: 0, comp: 'embestir', jefe: true, congelable: false }),
  motaPelo: E({ id: 'motaPelo', nombre: 'La Mota de Pelo', desc: 'Todo el pelo del desagüe hecho una bola con ojos.', vida: 850, vel: 50, dano: 42, xp: 200, radio: 46, tam: 146, retro: 0, jefe: true, congelable: false }),
  tapon: E({ id: 'tapon', nombre: 'El Tapón', desc: 'El tapón de la bañera, harto de que lo jalen.', vida: 480, vel: 54, dano: 32, xp: 120, radio: 40, tam: 128, retro: 0, comp: 'embestir', jefe: true, congelable: false }),
  esponjaPodrida: E({ id: 'esponjaPodrida', nombre: 'La Esponja Podrida', desc: 'La esponja vieja que nadie botó. Huele a historia.', vida: 680, vel: 50, dano: 38, xp: 160, radio: 44, tam: 138, retro: 0, jefe: true, congelable: false }),
  peloDesague: E({ id: 'peloDesague', nombre: 'El Pelo del Desagüe', desc: 'Sale del sifón con tentáculos de pelo. Pesadilla de domingo.', vida: 950, vel: 48, dano: 46, xp: 220, radio: 50, tam: 156, retro: 0, jefe: true, congelable: false }),
  // ------------------------------------------------------------------------------------------------ La Parca
  duchaHelada: E({ id: 'duchaHelada', nombre: 'La Ducha Helada', desc: '¡Se acabó el agua caliente! Si llega, ya ganaste… pero no la aguanta nadie.', vida: 655350, vel: 230, dano: 65535, xp: 0, radio: 34, tam: 140, retro: 0, comp: 'parca', jefe: true, congelable: false }),
};

export const ID_ENEMIGOS = Object.keys(ENEMIGOS) as IdEnemigo[];
/** Índice de cada tipo (viaja en las fotos del juego en pareja y elige el dibujo). */
export const INDICE_ENEMIGO = Object.fromEntries(ID_ENEMIGOS.map((id, i) => [id, i])) as Record<IdEnemigo, number>;
