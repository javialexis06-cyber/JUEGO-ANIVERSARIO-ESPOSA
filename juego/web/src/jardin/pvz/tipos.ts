// Contratos compartidos de «Plantas contra Zombis: La Semilla Madre» (ver docs/en-obra/pvz-arquitectura.md).
// Solo tipos: el motor (motor/), los datos (datos/), los comportamientos (comportamiento/), la vista y la interfaz
// se entienden a través de estas formas. Pensado para TODOS los mundos aunque por ahora solo exista el 1.
//
// Unidades: píxeles de PvZ 1 (columna de 80 de ancho, fila de 100 o de 85 en piscina y niebla) y segundos.
// El motor nunca toca la vista: la vista lee las entidades y la lista `eventos` de cada paso.
import type { MotorPvZ } from './motor/motor';

// ---------------------------------------------------------------------------------------------------------------
// Básicos

/** Escenarios de la aventura. 'tienda' no es un área: las mejoras de la tienda viven en datos/tienda.ts. */
export type Area = 'dia' | 'noche' | 'piscina' | 'niebla' | 'tejado' | 'rio' | 'vias' | 'desierto' | 'paramo' | 'invernadero';

/** Suelo de una casilla. 'tierra' = sin pasto (no se planta, como las filas apagadas de 1-1 a 1-3). */
export type Terreno = 'cesped' | 'tierra' | 'agua' | 'tejado';

/**
 * Capas de una casilla, de abajo arriba: 'base' (Nenúfar, Maceta), 'principal' (casi todas), 'cubierta'
 * (Calabaza, que envuelve a la principal) y 'temporal' (Grano de café, que despierta a una seta y desaparece).
 */
export type Capa = 'base' | 'principal' | 'cubierta' | 'temporal';

/** Por dónde va un zombi. Los guisantes solo pegan en 'suelo' y 'agua' (nadando a flote). */
export type Altura = 'suelo' | 'aire' | 'agua' | 'bajo agua' | 'bajo tierra';

/**
 * Tipos de daño:
 * - 'recto': guisante o espora; el escudo (puerta, periódico, escalera) lo detiene si llega de frente;
 * - 'lanzado': parabólico (col, maíz, melón); pasa por encima del escudo;
 * - 'perforante': humo o espinas; daña el escudo y además el cuerpo con todo el golpe;
 * - 'explosion': petacereza, patatapum…; daña escudo y cuerpo y, si mata, deja ceniza;
 * - 'fuego': jalapeño o guisante encendido; atraviesa escudos y quita la lentitud;
 * - 'hielo': seta congelada; atraviesa escudos;
 * - 'aplastar': apisonaflor, cortacésped, Zombistein; atraviesa todo;
 * - 'mordida': un zombi que muerde a otro (hipnotizados); pasa por encima del escudo.
 */
export type TipoDano = 'recto' | 'lanzado' | 'perforante' | 'explosion' | 'fuego' | 'hielo' | 'aplastar' | 'mordida';

export type FamiliaPlanta =
  | 'productora' | 'tiradora' | 'barrera' | 'explosiva' | 'lanzadora' | 'hongo' | 'apoyo' | 'acuatica' | 'devoradora';

/** Ids de plantas (minúsculas, sin tildes ni espacios). Las 49 de PvZ 1, las de PvZ 2 del acto 2 y las de minijuegos. */
export type IdPlantaConocida =
  // Día
  | 'lanzaguisantes' | 'girasol' | 'petacereza' | 'nuez' | 'patatapum' | 'hielaguisantes' | 'carnivora' | 'repetidora'
  | 'desesporada'
  // Noche
  | 'setasolar' | 'humoseta' | 'comepiedras' | 'hipnoseta' | 'miedica' | 'setacongelada' | 'petaseta' | 'nenufar'
  // Piscina
  | 'apisonaflor' | 'tripitidora' | 'zampalga' | 'jalapeno' | 'pinchohierba' | 'plantorcha' | 'nuezalta' | 'marseta'
  // Niebla
  | 'planterna' | 'cactus' | 'trebolador' | 'bipetidora' | 'frustrella' | 'calabaza' | 'magnetoseta' | 'coltapulta'
  // Tejado
  | 'maceta' | 'lanzamaiz' | 'cafe' | 'ajo' | 'paraplanta' | 'margarita' | 'melonpulta'
  // Tienda (mejoras de PvZ 1 y la Imitadora)
  | 'guisantralladora' | 'birasol' | 'gasoseta' | 'rabodegato' | 'melonhelada' | 'magnetodorada' | 'pinchorroca'
  | 'mazorcanon' | 'imitadora'
  // Acto 2 (PvZ 2) y el Frailejón
  | 'bocadedragon' | 'frijuelle' | 'cococanon' | 'frijol' | 'vaina' | 'juncoelectrico' | 'bumeran' | 'lechugaiceberg'
  | 'bonkchoi' | 'papacaliente' | 'frailejon' | 'lanzachiles' | 'guardacelga'
  // Minijuegos (no salen en el almanaque)
  | 'nuezbolos' | 'nuezexplosiva' | 'nuezgigante';
/** Se aceptan ids nuevos (fusión, minijuegos) sin tocar este archivo; el autocompletado sigue funcionando. */
export type IdPlanta = IdPlantaConocida | (string & {});

/** Ids de zombis de PvZ 1. Los del acto 2 se agregan como texto libre en su datos/<area>.ts. */
export type IdZombiConocido =
  | 'zombi' | 'abanderado' | 'caracono' | 'pertiga' | 'caracubo'
  | 'lector' | 'portero' | 'deportista' | 'bailon' | 'extra'
  | 'playero' | 'buzo' | 'zombictor' | 'bobsleigh' | 'delfin'
  | 'cajita' | 'globo' | 'excavador' | 'saltarin' | 'yeti'
  | 'colgao' | 'escalador' | 'zombipulta' | 'zombistein' | 'zombidito' | 'zomboss';
export type IdZombi = IdZombiConocido | (string & {});

// ---------------------------------------------------------------------------------------------------------------
// Definiciones (datos/)

export interface DefPlanta {
  id: IdPlanta;
  nombre: string;
  /** Costo en sol. */
  sol: number;
  /** Recarga del sobre en segundos (7,5 rápida, 30 lenta, 50 muy lenta). */
  recarga: number;
  /** Recarga con la que empieza el sobre al iniciar el nivel. Si falta, se usa la regla de PvZ (ver reglas.ts). */
  recargaInicial?: number;
  /** Puntos de vida (los zombis muerden 100 por segundo). */
  vida: number;
  familia: FamiliaPlanta;
  /** Seta: duerme de día (Día, Piscina, Tejado) salvo con Grano de café. */
  nocturna?: boolean;
  /** 'solo' = solo en agua (Nenúfar, Zampalga); 'tambien' = en agua o en tierra (Marseta no: es 'solo'). */
  agua?: 'solo' | 'tambien';
  /** Capa que ocupa; por defecto 'principal'. */
  capa?: Capa;
  /** Mejora que se siembra encima de esta planta (Guisantralladora sobre Repetidora). */
  mejoraDe?: IdPlanta;
  /** false = los zombis no la muerden ni se detienen (Petacereza, Jalapeño). Por defecto true. */
  mordible?: boolean;
  /** false = el saltador de pértiga y el saltarín no pueden saltarla (Nuez cáscara-rabias). Por defecto true. */
  saltable?: boolean;
  /** Va pegada al suelo: los zombis caminan encima y no se salta (Pinchohierba). */
  rastrera?: boolean;
  /** Solo existe en minijuegos (nueces de la bolera): no entra al almanaque ni a la selección. */
  soloMinijuego?: boolean;
  /** Texto corto de cuándo se gana (la ficha larga vive en historia/almanaque.ts). */
  desbloqueo: string;
  descripcion: string;
  /** Números propios de cada planta (daño, intervalo, alcance en casillas, armado…). */
  datos?: Record<string, number>;
}

export interface DefArmadura {
  /** Nombre para la vista: 'cono', 'cubo', 'casco', 'puerta', 'periodico', 'escalera'… */
  nombre: string;
  vida: number;
  /** La Magnetoseta se lo lleva y suena metálico. */
  metal?: boolean;
}

export interface DefZombi {
  id: IdZombi;
  nombre: string;
  /** Vida del cuerpo. El brazo cae al bajar de 2/3 y la cabeza al bajar de 1/3 (después se desploma). */
  vida: number;
  /** Casco: se gasta antes que el cuerpo con cualquier daño (cono, cubo, casco de deportista, de minero). */
  casco?: DefArmadura;
  /** Escudo: solo detiene el daño 'recto' que llega de frente (puerta mosquitera, periódico, escalera). */
  escudo?: DefArmadura;
  /** Velocidad base en px/s (80 / segundos por casilla). Cada zombi la varía un poco al aparecer. */
  velocidad: number;
  /** Daño por segundo al morder (100 en PvZ 1). */
  mordida: number;
  area: Area;
  /** Altura al aparecer (por defecto 'suelo'). */
  altura?: Altura;
  /** Costo en puntos de oleada. */
  puntos: number;
  /** Peso al elegir tipos al azar dentro de una oleada (0 = solo aparece fijo, como el abanderado). */
  peso: number;
  /** Primera oleada (contando desde 1) en la que puede salir por puntos. */
  oleadaMinima: number;
  /** false = la Carnívora no se lo puede tragar (Zombistein, Zomboss): le da mordiscos de 40. */
  tragable?: boolean;
  /** false = no muerde plantas (globo en el aire, colgao). */
  muerde?: boolean;
  /** Filas donde puede salir: 'no' = solo tierra (por defecto), 'solo' = solo agua, 'tambien' = ambas. */
  agua?: 'no' | 'solo' | 'tambien';
  desbloqueo: string;
  descripcion: string;
  datos?: Record<string, number>;
}

/** Una oleada de la tabla de la primera vuelta (wiki): zombis fijos y puntos que se gastan al azar. */
export interface DefOleada {
  fijos?: Partial<Record<IdZombi, number>>;
  extra?: number;
}

export type TipoNivel = 'normal' | 'cinta' | 'minijuego' | 'jefe' | 'proteger';

export interface DefNivel {
  /** '1-1'… */
  id: string;
  nombre: string;
  /** Acto de la historia. */
  parte: 1 | 2 | 3;
  mundo: number;
  numero: number;
  area: Area;
  /** Número de filas del jardín: 5, o 6 en piscina y niebla. */
  filas: 5 | 6;
  /** Filas con césped donde salen zombis y hay cortacésped (las demás son 'tierra'). */
  filasActivas: number[];
  /** Filas de agua (piscina, niebla). */
  filasAgua?: number[];
  /** Terreno por fila (un valor) o por casilla (9 valores). Manda sobre filasActivas/filasAgua. */
  terreno?: (Terreno | Terreno[])[];
  /** Noche: sin sol del cielo y con las setas despiertas. */
  noche: boolean;
  solDelCielo: boolean;
  solInicial: number;
  tipo: TipoNivel;
  /** Minijuego: 'bolera' (La bolera)… */
  minijuego?: 'bolera' | (string & {});
  /** Zombis que pueden salir (incluido el abanderado si hay banderas). */
  zombis: IdZombi[];
  /** Zombi que presenta el nivel: sale seguro en la oleada de la mitad y en la final. */
  zombiNuevo?: IdZombi;
  /** Oleadas enormes (cada 10 oleadas, o la última si hay menos). */
  banderas: number;
  /** Número de oleadas (por defecto banderas × 10). */
  oleadas: number;
  /** Tabla de la primera vuelta. Si falta, se usa el algoritmo de puntos de PvZ 1. */
  tablaOleadas?: DefOleada[];
  /** Multiplica los puntos de cada oleada en el algoritmo (cintas x-10 = 3). */
  multiplicadorPuntos?: number;
  /** Cómo cambia al repetir el nivel después de terminar la aventura. */
  repeticion?: { oleadas: number; banderas: number; zombisExtra?: IdZombi[]; filasActivas?: number[] };
  /** Plantas que se pueden elegir (las desbloqueadas hasta este nivel en la primera vuelta). */
  plantasDisponibles: IdPlanta[];
  /** Hay pantalla de selección (más plantas que ranuras). */
  seleccion: boolean;
  /** Ranuras del banco al llegar a este nivel en la primera vuelta. */
  ranuras: number;
  /** Cinta transportadora: tipos y pesos al azar. Sin banco de semillas ni sol. */
  cinta?: { plantas: { tipo: IdPlanta; peso: number }[] };
  /** Bolera: solo se coloca en las columnas menores que esta (línea roja). */
  lineaRoja?: number;
  /** Plantas ya sembradas al empezar (1-5: los tres Lanzaguisantes que Dave pide arrancar). */
  plantasIniciales?: { tipo: IdPlanta; fila: number; col: number }[];
  /** No se puede empezar hasta arrancar con la pala las plantasIniciales. */
  palearAntes?: boolean;
  /** Las oleadas no empiezan hasta tener sembradas estas plantas (1-1: dos Lanzaguisantes). */
  esperaPlantas?: { tipo: IdPlanta; cantidad: number };
  /** Sin zombis brillantes ni abono (bolera). */
  sinAbono?: boolean;
  /** Sin cortacéspedes. */
  sinCortacesped?: boolean;
  /** Lápidas al empezar (noche). */
  lapidas?: number;
  /** Macetas ya puestas en el tejado. */
  materas?: [number, number][];
  /** Columnas tapadas por la niebla, contadas desde la derecha. */
  niebla?: number;
  /** Lo que se gana la primera vez (igual a historia/estrenos.ts). */
  premio?: { planta?: IdPlanta; objeto?: string; nota?: boolean };
}

/**
 * Nivel tal como lo escribe datos/<area>.ts: el índice (datos/niveles.ts) completa las plantas disponibles (las
 * ganadas en los niveles anteriores de la aventura), las ranuras y si hay selección.
 */
export type DefNivelBase = Omit<DefNivel, 'plantasDisponibles' | 'seleccion' | 'ranuras'> &
  Partial<Pick<DefNivel, 'plantasDisponibles' | 'seleccion' | 'ranuras'>>;

// ---------------------------------------------------------------------------------------------------------------
// Entidades vivas del motor (la vista las lee; solo el motor y los comportamientos las cambian)

/** Estados de animación de una planta (los que entiende el arte; cada planta usa los suyos). */
export type EstadoPlanta =
  | 'quieto' | 'ataca' | 'herida' | 'dormida' | 'masticando' | 'enterrada' | 'armada' | 'inflandose' | (string & {});

export interface Planta {
  id: number;
  tipo: IdPlanta;
  fila: number;
  col: number;
  capa: Capa;
  /** Centro de la casilla (x) y centro de la fila (y), en px de mundo. */
  x: number;
  y: number;
  vida: number;
  vidaMax: number;
  /** Coraza metálica del abono de la Nuez (se gasta antes que la vida). */
  coraza: number;
  estado: EstadoPlanta;
  /** Segundos desde que cambió `estado` (la vista calcula la fase con la duración del arte). */
  tEstado: number;
  dormida: boolean;
  /** Segundos que le quedan brillando por el abono (mientras brilla es invulnerable y no se palea). */
  abono: number;
  /** Temporizador principal del comportamiento (disparo, sol, armado…). */
  reloj: number;
  /** Momento (t del motor) en que se sembró. */
  nacio: number;
  /** Segundos que le quedan al destello de golpe (mordida). */
  golpe: number;
  /** Estado propio del comportamiento (ráfagas, contadores…). Solo números para que sea serializable. */
  datos: Record<string, number>;
}

/** Estados de animación de un zombi. */
export type EstadoZombi =
  | 'camina' | 'come' | 'corre' | 'salta' | 'quieto' | 'sincabeza' | 'nada' | 'vuela' | 'cava' | (string & {});

export interface ArmaduraViva {
  nombre: string;
  vida: number;
  max: number;
  metal: boolean;
}

export type CausaMuerte = 'normal' | 'ceniza' | 'comido' | 'cortacesped' | 'aplastado' | 'fuera';

export interface Zombi {
  id: number;
  tipo: IdZombi;
  fila: number;
  /** Posición de los pies (ancla del arte). La caja de golpe va de x − 25 a x + 25. */
  x: number;
  altura: Altura;
  vida: number;
  vidaMax: number;
  casco: ArmaduraViva | null;
  escudo: ArmaduraViva | null;
  /** Velocidad propia en px/s (la de su tipo con una pequeña variación). */
  vel: number;
  estado: EstadoZombi;
  tEstado: number;
  /** -1 camina hacia la casa; 1 hipnotizado (camina hacia la calle). */
  dir: -1 | 1;
  /** Segundos que le quedan a cada estado alterado. */
  lento: number;
  congelado: number;
  mantequilla: number;
  hipnotizado: boolean;
  /** Lleva abono: brilla en verde y lo suelta al morir. */
  brillante: boolean;
  sinBrazo: boolean;
  sinCabeza: boolean;
  /** Destello blanco al recibir un golpe (s). */
  golpe: number;
  /** Id de la planta (o del zombi hipnotizado) que está mordiendo; 0 si ninguno. */
  mordiendo: number;
  /** Oleada en la que salió (1…). 0 = puesto a mano. */
  oleada: number;
  /** Segundos de vida (para desfasar animaciones). */
  edad: number;
  /** Estado propio del comportamiento. */
  datos: Record<string, number>;
}

/** Zombi que acaba de morir: la vista lo anima unos segundos (desplomarse, ceniza, salir volando). */
export interface ZombiCaido extends Zombi {
  causa: CausaMuerte;
  /** Segundos desde la muerte y duración total de la animación. */
  tCaida: number;
  duracion: number;
}

export type FormaProyectil = 'recto' | 'lanzado' | 'rodante';

export interface Proyectil {
  id: number;
  /** 'guisante', 'guisanteHielo', 'espora', 'guisanteGigante', 'nuezbolos', 'nuezexplosiva'… */
  tipo: string;
  forma: FormaProyectil;
  fila: number;
  x: number;
  /** Suelo de la fila (y del centro de la fila; en las nueces rodantes se mueve entre filas). */
  y: number;
  /** Altura sobre el suelo para la vista (px). */
  h: number;
  /** Velocidad horizontal (px/s). */
  vx: number;
  dano: number;
  tipoDano: TipoDano;
  /** Efecto al pegar en el cuerpo o el casco: lento (hielo), mantequilla… */
  efecto?: 'lento' | 'mantequilla';
  /** Duración del efecto (s). */
  efectoT?: number;
  /** Id de la planta que lo lanzó. */
  origen: number;
  /** Recto: se disipa al pasar de esta x (esporas de alcance corto). */
  xMax?: number;
  /** Lanzado: zombi al que sigue y datos de la parábola. */
  blanco?: number;
  x0?: number;
  x1?: number;
  vuelo?: number;
  tVuelo?: number;
  cima?: number;
  /** Rodante: fila continua (para rebotar en diagonal), dirección vertical (-1, 0, 1), golpes y último golpeado. */
  fy?: number;
  dirY?: number;
  golpes?: number;
  ultimo?: number;
}

export interface Sol {
  id: number;
  x: number;
  y: number;
  /** Altura donde se queda quieto. */
  yFinal: number;
  valor: number;
  origen: 'cielo' | 'planta' | 'abono';
  /** 'cae' (del cielo), 'salta' (de una planta), 'quieto' (esperando a que lo recojan). */
  estado: 'cae' | 'salta' | 'quieto';
  /** Segundos que le quedan quieto antes de desaparecer. */
  vida: number;
}

export type TipoMoneda = 'plata' | 'oro' | 'diamante' | 'bolsa';

export interface Moneda {
  id: number;
  tipo: TipoMoneda;
  valor: number;
  x: number;
  y: number;
  vida: number;
}

/** Hoja de abono que suelta un zombi brillante. */
export interface AbonoSuelto {
  id: number;
  x: number;
  y: number;
  vida: number;
}

export interface Cortacesped {
  fila: number;
  x: number;
  /** 'listo' esperando, 'corre' barriendo la fila, 'usado' ya no está. */
  estado: 'listo' | 'corre' | 'usado';
}

export interface Lapida {
  id: number;
  fila: number;
  col: number;
  vida: number;
}

export interface Crater {
  id: number;
  fila: number;
  col: number;
  /** Segundos hasta que se pueda volver a sembrar. */
  t: number;
}

/** Sobre en la cinta transportadora. `x` = posición en ranuras desde la izquierda (0 = primera). */
export interface ItemCinta {
  id: number;
  tipo: IdPlanta;
  x: number;
}

/** Sobre del banco de semillas. */
export interface Tarjeta {
  tipo: IdPlanta;
  sol: number;
  /** Recarga total y lo que falta (s). La vista dibuja la sombra con restante / recarga. */
  recarga: number;
  restante: number;
  /** Recargada. */
  lista: boolean;
  /** Recargada y con sol suficiente. */
  disponible: boolean;
}

export type EstadoJuego = 'intro' | 'jugando' | 'gano' | 'perdio';

export type MotivoRechazo =
  | 'estado' | 'tipo' | 'recarga' | 'sol' | 'casilla' | 'terreno' | 'ocupada' | 'lapida' | 'crater' | 'linea'
  | 'cinta' | 'base' | 'sinPlanta' | 'sinPala' | 'sinAbono' | 'sinCargas' | 'sinEfecto' | 'brillando' | 'faltaPalear'
  | 'mejora';

export interface Resultado {
  ok: boolean;
  motivo?: MotivoRechazo;
}

/** Lo que se gana al terminar: la vista lo hace caer donde murió el último zombi y la interfaz lo recoge. */
export interface Premio {
  tipo: 'planta' | 'objeto' | 'nota' | 'bolsa';
  id?: string;
  valor?: number;
  x: number;
  y: number;
  fila: number;
}

// ---------------------------------------------------------------------------------------------------------------
// Eventos de un paso (m.eventos se vacía al empezar cada paso)

export type Evento =
  | { t: 'inicio' }
  | { t: 'siembra'; planta: number; tipo: IdPlanta; fila: number; col: number }
  | { t: 'pala'; planta: number; tipo: IdPlanta; fila: number; col: number }
  | { t: 'disparo'; planta: number; tipo: IdPlanta; proyectil: number; fila: number; x: number }
  | { t: 'impacto'; proyectil: number; tipo: string; zombi: number; fila: number; x: number; dano: number; metal: boolean; escudo: boolean }
  | { t: 'disipa'; proyectil: number; fila: number; x: number }
  | { t: 'muerde'; zombi: number; planta: number; fila: number; x: number }
  | { t: 'pierdeBrazo'; zombi: number; fila: number; x: number }
  | { t: 'pierdeCabeza'; zombi: number; fila: number; x: number }
  | { t: 'pierdeArmadura'; zombi: number; cual: 'casco' | 'escudo'; nombre: string; fila: number; x: number }
  | { t: 'muere'; zombi: number; tipo: IdZombi; causa: CausaMuerte; fila: number; x: number }
  | { t: 'ceniza'; zombi: number; fila: number; x: number }
  | { t: 'explosion'; tipo: IdPlanta; fila: number; col: number; x: number; radio: number }
  | { t: 'arma'; planta: number; fila: number; col: number }
  | { t: 'traga'; planta: number; zombi: number; fila: number; col: number }
  | { t: 'salta'; zombi: number; fila: number; x: number }
  | { t: 'plantaComida'; planta: number; tipo: IdPlanta; fila: number; col: number; zombi: number }
  | { t: 'plantaMuere'; planta: number; tipo: IdPlanta; fila: number; col: number }
  | { t: 'sol'; sol: number; x: number; y: number; valor: number; origen: Sol['origen'] }
  | { t: 'recogeSol'; sol: number; x: number; y: number; valor: number }
  | { t: 'moneda'; moneda: number; tipo: TipoMoneda; x: number; y: number }
  | { t: 'recogeMoneda'; moneda: number; tipo: TipoMoneda; valor: number; x: number; y: number }
  | { t: 'abonoSuelto'; abono: number; x: number; y: number }
  | { t: 'recogeAbono'; abono: number; x: number; y: number; cargas: number }
  | { t: 'abono'; planta: number; tipo: IdPlanta; fila: number; col: number }
  | { t: 'oleada'; n: number; total: number; enorme: boolean; final: boolean; zombis: number }
  | { t: 'oleadaEnorme'; n: number }
  | { t: 'ultimaOleada' }
  | { t: 'cortacesped'; fila: number }
  | { t: 'cinta'; item: number; tipo: IdPlanta }
  | { t: 'rebote'; proyectil: number; fila: number; x: number; golpes: number }
  | { t: 'premio'; premio: Premio }
  | { t: 'fin'; gano: boolean; fila?: number };

// ---------------------------------------------------------------------------------------------------------------
// Comportamientos (comportamiento/<area>.ts). El motor resuelve lo común; esto añade lo propio de cada uno.

export interface ComportamientoPlanta {
  /** Al sembrarla (o al crearla el motor). */
  iniciar?(m: MotorPvZ, p: Planta): void;
  /** Cada paso mientras viva. */
  paso?(m: MotorPvZ, p: Planta, dt: number): void;
  /** Efecto del abono. Devuelve false si no tiene efecto (entonces no se gasta la carga). */
  abono?(m: MotorPvZ, p: Planta): boolean;
  /** Al recibir daño (después de aplicarlo). */
  alDanar?(m: MotorPvZ, p: Planta, cantidad: number, origen: Zombi | null): void;
  /** Al morir o al quitarla con la pala. */
  alMorir?(m: MotorPvZ, p: Planta): void;
  /** Si los zombis la pueden morder ahora (la Patatapum armada no). Por defecto, DefPlanta.mordible. */
  mordible?(m: MotorPvZ, p: Planta): boolean;
}

export interface ComportamientoZombi {
  iniciar?(m: MotorPvZ, z: Zombi): void;
  /**
   * Cada paso (antes de caminar y morder). Devuelve true si ya se movió o actuó en este paso y el motor no debe
   * hacerlo caminar ni morder (salto con pértiga, nado, vuelo…).
   */
  paso?(m: MotorPvZ, z: Zombi, dt: number): boolean;
  /** Al recibir daño (después de aplicarlo). */
  alDanar?(m: MotorPvZ, z: Zombi, cantidad: number, tipo: TipoDano): void;
  alMorir?(m: MotorPvZ, z: Zombi, causa: CausaMuerte): void;
}

/** Lo que exporta cada comportamiento/<area>.ts y junta el índice. */
export interface RegistroComportamientos {
  plantas: Record<string, ComportamientoPlanta>;
  zombis: Record<string, ComportamientoZombi>;
}

/** Lo que exporta cada datos/<area>.ts y juntan los índices. */
export interface DatosArea {
  plantas: DefPlanta[];
  zombis: DefZombi[];
  niveles: DefNivelBase[];
}
