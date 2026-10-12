// Los mugrosos de la cara, del lavamanos, de la bañera y de la ducha. Como en el original, la vida de los enemigos comunes es
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
  | 'planta' // no se mueve (las maticas de La Matera): hay que ir a buscarla
  | 'morder' // no se mueve, pero si alguien se le acerca se estira y muerde
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
  pulga: E({ id: 'pulga', nombre: 'Pulga', desc: 'Chiquita y brincona. Salta cuando menos lo esperas.', vida: 9, vel: 90, dano: 7, xp: 1, radio: 9, tam: 30, comp: 'saltar' }),
  burbujaSucia: E({ id: 'burbujaSucia', nombre: 'Burbuja sucia', desc: 'Una burbuja con mugre adentro. Flota bravísima.', vida: 200, vel: 46, dano: 17, xp: 3, radio: 15, tam: 48, comp: 'flotar' }),
  babosa: E({ id: 'babosa', nombre: 'Babosa', desc: 'Deja un caminito brillante. Lenta pero tiene mucha vida.', vida: 1700, vel: 32, dano: 28, xp: 5, radio: 19, tam: 56, retro: 0.2 }),
  espinilla: E({ id: 'espinilla', nombre: 'Espinilla', desc: 'Con punta blanca y actitud. La élite del cutis.', vida: 460, vel: 52, dano: 23, xp: 3, radio: 16, tam: 48 }),
  // ------------------------------------------------------------------------------------------------ La Ducha
  gotaDura: E({ id: 'gotaDura', nombre: 'Gota de agua dura', desc: 'Azulita y con pecas de cal. Cae en chorro y en manada.', vida: 7, vel: 112, dano: 4, xp: 1, radio: 9, tam: 30, comp: 'enjambre' }),
  mosquitaDesague: E({ id: 'mosquitaDesague', nombre: 'Mosquita del desagüe', desc: 'Peludita y con alas de corazón. Vive en el sifón y sale de noche.', vida: 12, vel: 86, dano: 6, xp: 1, radio: 10, tam: 32, comp: 'revolotear' }),
  tapaChampu: E({ id: 'tapaChampu', nombre: 'Tapita de champú', desc: 'Se perdió hace meses y ahora brinca resentida.', vida: 28, vel: 88, dano: 9, xp: 1, radio: 11, tam: 36, comp: 'saltar' }),
  hongoPie: E({ id: 'hongoPie', nombre: 'Hongo del pie', desc: 'Amarillito y con esporas. Por eso se usan chanclas en la ducha.', vida: 95, vel: 44, dano: 12, xp: 2, radio: 15, tam: 46, retro: 0.6 }),
  espumaSucia: E({ id: 'espumaSucia', nombre: 'Espuma sucia', desc: 'Una nube de espuma con mugre adentro. Flota de mal genio.', vida: 230, vel: 46, dano: 17, xp: 3, radio: 15, tam: 50, comp: 'flotar' }),
  ciempies: E({ id: 'ciempies', nombre: 'Ciempiés', desc: 'Sale de la rejilla con sus cien patas. Rapidísimo.', vida: 250, vel: 74, dano: 16, xp: 3, radio: 14, tam: 50 }),
  estropajo: E({ id: 'estropajo', nombre: 'Estropajo mugroso', desc: 'Verde de un lado, amarillo del otro. Se lanza a raspar.', vida: 640, vel: 92, dano: 23, xp: 4, radio: 18, tam: 54, comp: 'embestir', retro: 0.3 }),
  cal: E({ id: 'cal', nombre: 'Costra de cal', desc: 'La piedrita blanca que tapa los huequitos de la regadera. Durísima.', vida: 1900, vel: 32, dano: 30, xp: 6, radio: 23, tam: 64, retro: 0.1 }),
  // ------------------------------------------------------------------------------------------------ La Jabonera
  pompa: E({ id: 'pompa', nombre: 'Pompita de jabón', desc: 'Tornasolada y picarona. Flota en bandada y se ríe sola.', vida: 8, vel: 80, dano: 5, xp: 1, radio: 10, tam: 32, comp: 'flotar' }),
  cuchilla: E({ id: 'cuchilla', nombre: 'Cuchillita de afeitar', desc: 'La que quedó en la repisa. Zumba y corta el aire.', vida: 12, vel: 80, dano: 6, xp: 1, radio: 10, tam: 34, comp: 'revolotear' }),
  algodon: E({ id: 'algodon', nombre: 'Motica de algodón', desc: 'Blanquita y brincona. Se escapó del frasco de los copitos.', vida: 26, vel: 80, dano: 8, xp: 1, radio: 12, tam: 38, comp: 'saltar' }),
  champuDerramado: E({ id: 'champuDerramado', nombre: 'Champú derramado', desc: 'Rosado y baboso. Se arrastra dejando el piso resbaloso.', vida: 110, vel: 40, dano: 13, xp: 2, radio: 16, tam: 48, retro: 0.5 }),
  hilacha: E({ id: 'hilacha', nombre: 'Hilacha de estropajo', desc: 'Un nudito de fibras que flota de lado a lado.', vida: 200, vel: 50, dano: 16, xp: 2, radio: 14, tam: 46, comp: 'flotar' }),
  frascoVacio: E({ id: 'frascoVacio', nombre: 'Frasco vacío', desc: 'Un tarrito de crema sin crema. Embiste de la rabia.', vida: 320, vel: 92, dano: 20, xp: 3, radio: 14, tam: 48, comp: 'embestir' }),
  mohoRosado: E({ id: 'mohoRosado', nombre: 'Moho rosado', desc: 'La mancha rosada de las esquinas de la ducha. Blandita y tercísima.', vida: 1600, vel: 34, dano: 30, xp: 5, radio: 22, tam: 62, retro: 0.15 }),
  // ------------------------------------------------------------------------------------------------ El Desagüe
  bolitaPelo: E({ id: 'bolitaPelo', nombre: 'Bolita de pelos', desc: 'Negra y enredada. Sale del sifón de a montones.', vida: 7, vel: 108, dano: 5, xp: 1, radio: 9, tam: 30, comp: 'enjambre' }),
  gusanito: E({ id: 'gusanito', nombre: 'Gusanito del desagüe', desc: 'Rojito y elástico. Se estira, se encoge y ya te alcanzó.', vida: 12, vel: 80, dano: 6, xp: 1, radio: 11, tam: 38 }),
  sapito: E({ id: 'sapito', nombre: 'Sapito del caño', desc: 'Cachetón y brincón. Vive donde nadie quiere vivir.', vida: 30, vel: 84, dano: 9, xp: 2, radio: 13, tam: 42, comp: 'saltar' }),
  grasaSifon: E({ id: 'grasaSifon', nombre: 'Grasa del sifón', desc: 'Negra, brillante y pegajosa. Tapa todo lo que toca.', vida: 110, vel: 46, dano: 13, xp: 2, radio: 15, tam: 48, retro: 0.6 }),
  burbujaGas: E({ id: 'burbujaGas', nombre: 'Burbuja de gas', desc: 'Verdosa y hediondita. Sube flotando del caño.', vida: 240, vel: 46, dano: 18, xp: 3, radio: 15, tam: 50, comp: 'flotar' }),
  rejillita: E({ id: 'rejillita', nombre: 'Rejillita suelta', desc: 'La rejilla del desagüe que se soltó y salió a caminar. De metal.', vida: 360, vel: 52, dano: 19, xp: 4, radio: 17, tam: 52, retro: 0.3 }),
  lodo: E({ id: 'lodo', nombre: 'Lodo del caño', desc: 'Una montaña café con cositas atrapadas adentro. Pesadísima.', vida: 2300, vel: 32, dano: 34, xp: 6, radio: 24, tam: 66, retro: 0.12 }),
  // ------------------------------------------------------------------------------------------------ La Matera de la ventana
  brotecito: E({ id: 'brotecito', nombre: 'Brotecito', desc: 'Una semillita que acaba de echar dos hojas. No camina: espera a que pases.', vida: 6, vel: 0, dano: 4, xp: 1, radio: 11, tam: 34, retro: 0, comp: 'planta' }),
  cactus: E({ id: 'cactus', nombre: 'Cactus de la ventana', desc: 'Redondo, con espinas y una flor. Bravo porque nadie lo abraza.', vida: 22, vel: 0, dano: 9, xp: 1, radio: 13, tam: 40, retro: 0, comp: 'planta' }),
  atrapamoscas: E({ id: 'atrapamoscas', nombre: 'Atrapamoscas', desc: 'Quietica… hasta que te le acercas. Entonces se estira y ¡ñam!', vida: 60, vel: 70, dano: 12, xp: 2, radio: 14, tam: 48, retro: 0.2, comp: 'morder' }),
  caracol: E({ id: 'caracol', nombre: 'Caracol', desc: 'Lentísimo y babosito, con su casita a la espalda. Pero no se cansa nunca.', vida: 50, vel: 24, dano: 8, xp: 2, radio: 13, tam: 40, retro: 0.5 }),
  dienteLeon: E({ id: 'dienteLeon', nombre: 'Diente de león', desc: 'Semillitas de pompón que el viento mete por la ventana.', vida: 9, vel: 70, dano: 4, xp: 1, radio: 10, tam: 36, comp: 'flotar' }),
  enredadera: E({ id: 'enredadera', nombre: 'Enredadera', desc: 'Un nudo de bejucos terco como él solo: tapa el camino.', vida: 280, vel: 0, dano: 16, xp: 3, radio: 17, tam: 54, retro: 0, comp: 'planta' }),
  helecho: E({ id: 'helecho', nombre: 'Helecho', desc: 'Frondoso, enorme y con una carita escondida entre las hojas.', vida: 900, vel: 0, dano: 22, xp: 5, radio: 22, tam: 66, retro: 0, comp: 'planta' }),
  // ------------------------------------------------------------------------------------------------ El Tobogán del desagüe
  patitoHule: E({ id: 'patitoHule', nombre: 'Patito de hule', desc: 'Bajaron todos juntos por el tobogán, felices y en manada.', vida: 8, vel: 96, dano: 4, xp: 1, radio: 10, tam: 32, comp: 'enjambre' }),
  chancleta: E({ id: 'chancleta', nombre: 'Chancleta perdida', desc: 'Quietica en el agua… y de pronto, ¡chancletazo!', vida: 60, vel: 62, dano: 9, xp: 2, radio: 14, tam: 44, comp: 'embestir' }),
  // ------------------------------------------------------------------------------------------------ Jefes (vida × nivel)
  espinillon: E({ id: 'espinillon', nombre: 'El Espinillón', desc: 'El rey de los granitos, con corona y todo. Embiste cuando se enoja.', vida: 420, vel: 56, dano: 30, xp: 120, radio: 40, tam: 130, retro: 0, comp: 'embestir', jefe: true, congelable: false }),
  reinaCaspa: E({ id: 'reinaCaspa', nombre: 'La Reina Caspa', desc: 'Llega nevando. Guarda una carta mágica perdida.', vida: 300, vel: 72, dano: 24, xp: 120, radio: 34, tam: 118, retro: 0, comp: 'revolotear', jefe: true, congelable: false }),
  granMoco: E({ id: 'granMoco', nombre: 'El Gran Moco', desc: 'Un moco del tamaño de una arepa grande. Baboso y orgulloso.', vida: 560, vel: 50, dano: 34, xp: 150, radio: 42, tam: 136, retro: 0, jefe: true, congelable: false }),
  senorLagana: E({ id: 'senorLagana', nombre: 'Don Lagaña', desc: 'Madruga más que el gallo y no se lava nunca.', vida: 700, vel: 48, dano: 38, xp: 160, radio: 42, tam: 136, retro: 0, jefe: true, congelable: false }),
  barroNegro: E({ id: 'barroNegro', nombre: 'El Barro Negro', desc: 'Mugre de una semana de paseo. Hace temblar el piso.', vida: 900, vel: 46, dano: 44, xp: 200, radio: 48, tam: 150, retro: 0, comp: 'embestir', jefe: true, congelable: false }),
  senorSarro: E({ id: 'senorSarro', nombre: 'El Señor Sarro', desc: 'Una muela de sarro con bigote. Odia el cepillo.', vida: 450, vel: 52, dano: 32, xp: 120, radio: 40, tam: 130, retro: 0, jefe: true, congelable: false }),
  donaCucaracha: E({ id: 'donaCucaracha', nombre: 'Doña Cucaracha', desc: 'La mamá de todas. Corre, vuela y no tiene vergüenza.', vida: 620, vel: 70, dano: 36, xp: 150, radio: 38, tam: 126, retro: 0, comp: 'embestir', jefe: true, congelable: false }),
  motaPelo: E({ id: 'motaPelo', nombre: 'La Mota de Pelo', desc: 'Todo el pelo del desagüe hecho una bola con ojos.', vida: 850, vel: 50, dano: 42, xp: 200, radio: 46, tam: 146, retro: 0, jefe: true, congelable: false }),
  tapon: E({ id: 'tapon', nombre: 'El Tapón', desc: 'El tapón de la bañera, harto de que lo jalen.', vida: 480, vel: 54, dano: 32, xp: 120, radio: 40, tam: 128, retro: 0, comp: 'embestir', jefe: true, congelable: false }),
  esponjaPodrida: E({ id: 'esponjaPodrida', nombre: 'La Esponja Podrida', desc: 'La esponja vieja que nadie botó. Huele a historia.', vida: 680, vel: 50, dano: 38, xp: 160, radio: 44, tam: 138, retro: 0, jefe: true, congelable: false }),
  peloDesague: E({ id: 'peloDesague', nombre: 'El Pelo del Desagüe', desc: 'Sale del sifón con tentáculos de pelo. Pesadilla de domingo.', vida: 950, vel: 48, dano: 46, xp: 220, radio: 50, tam: 156, retro: 0, jefe: true, congelable: false }),
  reyHongo: E({ id: 'reyHongo', nombre: 'El Rey Hongo', desc: 'El hongo del pie con corona y capa. Reina en el piso de la ducha.', vida: 470, vel: 56, dano: 32, xp: 130, radio: 40, tam: 132, retro: 0, jefe: true, congelable: false }),
  regaderaLoca: E({ id: 'regaderaLoca', nombre: 'La Regadera Loca', desc: 'Llena de cal y de rabia. Escupe chorros para todos lados.', vida: 650, vel: 66, dano: 36, xp: 160, radio: 40, tam: 134, retro: 0, comp: 'revolotear', jefe: true, congelable: false }),
  cortinaMohosa: E({ id: 'cortinaMohosa', nombre: 'La Cortina Mohosa', desc: 'Nadie la lavó nunca. Ahora camina sola, con argollas y todo.', vida: 920, vel: 46, dano: 44, xp: 210, radio: 48, tam: 152, retro: 0, jefe: true, congelable: false }),
  ciempiesGigante: E({ id: 'ciempiesGigante', nombre: 'El Ciempiés Gigante', desc: 'El papá de todos los ciempiés del sifón. Embiste con sus pinzas.', vida: 1000, vel: 62, dano: 48, xp: 230, radio: 50, tam: 156, retro: 0, comp: 'embestir', jefe: true, congelable: false }),
  donFrasco: E({ id: 'donFrasco', nombre: 'Don Frasco', desc: 'El tarro de champú con dosificador y bigote. Embiste a chorros.', vida: 480, vel: 58, dano: 32, xp: 130, radio: 40, tam: 132, retro: 0, comp: 'embestir', jefe: true, congelable: false }),
  reinaPompa: E({ id: 'reinaPompa', nombre: 'La Reina Pompa', desc: 'Una pompa de jabón enorme, con corona y séquito de pompitas.', vida: 620, vel: 66, dano: 34, xp: 160, radio: 40, tam: 132, retro: 0, comp: 'revolotear', jefe: true, congelable: false }),
  senorCuchillas: E({ id: 'senorCuchillas', nombre: 'El Señor Cuchillas', desc: 'Una máquina de tres hojas que no se afeita hace años.', vida: 880, vel: 74, dano: 44, xp: 210, radio: 44, tam: 140, retro: 0, comp: 'revolotear', jefe: true, congelable: false }),
  poteCrema: E({ id: 'poteCrema', nombre: 'El Pote de Crema', desc: 'El tarro gigante de la repisa, rebosado de crema. Lento pero imparable.', vida: 1050, vel: 44, dano: 50, xp: 240, radio: 52, tam: 158, retro: 0, jefe: true, congelable: false }),
  reySapo: E({ id: 'reySapo', nombre: 'El Rey Sapo', desc: 'El sapo más cachetón del caño, con corona y capa. Brinca encima.', vida: 500, vel: 60, dano: 34, xp: 140, radio: 40, tam: 132, retro: 0, comp: 'embestir', jefe: true, congelable: false }),
  pulpoDesague: E({ id: 'pulpoDesague', nombre: 'El Pulpo del Desagüe', desc: 'Morado, con tentáculos llenos de pelo enredado.', vida: 700, vel: 54, dano: 40, xp: 170, radio: 46, tam: 146, retro: 0, jefe: true, congelable: false }),
  bocaSifon: E({ id: 'bocaSifon', nombre: 'La Boca del Sifón', desc: 'El tubo en U del lavamanos con dientes. Se lo traga todo.', vida: 950, vel: 50, dano: 46, xp: 220, radio: 48, tam: 150, retro: 0, jefe: true, congelable: false }),
  reinaGrasa: E({ id: 'reinaGrasa', nombre: 'La Reina Grasa', desc: 'La dueña de todo el desagüe: negra, brillante y con corona.', vida: 1150, vel: 56, dano: 52, xp: 260, radio: 52, tam: 158, retro: 0, comp: 'embestir', jefe: true, congelable: false }),
  donCactus: E({ id: 'donCactus', nombre: 'Don Cactus', desc: 'El cactus más viejo de la ventana, con corona y brazos. Quiere un abrazo (mejor no).', vida: 480, vel: 40, dano: 30, xp: 150, radio: 40, tam: 130, retro: 0, jefe: true, congelable: false }),
  atrapamoscasGigante: E({ id: 'atrapamoscasGigante', nombre: 'La Atrapamoscas Gigante', desc: 'Una boca de planta con corona y muchísima hambre.', vida: 700, vel: 58, dano: 36, xp: 170, radio: 44, tam: 140, retro: 0, comp: 'embestir', jefe: true, congelable: false }),
  materaGigante: E({ id: 'materaGigante', nombre: 'La Matera Gigante', desc: 'La matera de barro se levantó y camina, con su girasol bravo encima.', vida: 1000, vel: 46, dano: 42, xp: 220, radio: 50, tam: 160, retro: 0, jefe: true, congelable: false }),
  patoInflable: E({ id: 'patoInflable', nombre: 'El Pato Inflable Gigante', desc: 'Se soltó de la piscina y baja por el tobogán con corona y todo.', vida: 620, vel: 62, dano: 34, xp: 170, radio: 46, tam: 150, retro: 0, comp: 'embestir', jefe: true, congelable: false }),
  donaFlotador: E({ id: 'donaFlotador', nombre: 'La Dona Flotadora', desc: 'Un flotador rosado con chispitas que da vueltas y vueltas… y muerde.', vida: 900, vel: 72, dano: 40, xp: 220, radio: 46, tam: 150, retro: 0, comp: 'revolotear', jefe: true, congelable: false }),
  // ------------------------------------------------------------------------------------------------ La Parca
  duchaHelada: E({ id: 'duchaHelada', nombre: 'La Ducha Helada', desc: '¡Se acabó el agua caliente! Si llega, ya ganaste… pero no la aguanta nadie.', vida: 655350, vel: 230, dano: 65535, xp: 0, radio: 34, tam: 140, retro: 0, comp: 'parca', jefe: true, congelable: false }),
};

export const ID_ENEMIGOS = Object.keys(ENEMIGOS) as IdEnemigo[];
/** Índice de cada tipo (viaja en las fotos del juego en pareja y elige el dibujo). */
export const INDICE_ENEMIGO = Object.fromEntries(ID_ENEMIGOS.map((id, i) => [id, i])) as Record<IdEnemigo, number>;
