// Sangre y Ceniza: los tipos que comparten la simulación, el dibujo, la red y las pantallas.
// La simulación no usa el DOM ni three.js: corre igual en el celular, en el anfitrión de una partida de hasta 4 y en
// las pruebas de Node con el bot (scripts/balance-sangre.mjs).

export type IdClase =
  | 'monarca' | 'campesino' | 'prisionero' | 'caballero' | 'cazador' | 'herrero'
  | 'alquimista' | 'sepulturero' | 'inquisidor' | 'verdugo' | 'bruja' | 'juglar';
export const CLASES_ORDEN: IdClase[] = [
  'monarca', 'campesino', 'prisionero', 'caballero', 'cazador', 'herrero',
  'alquimista', 'sepulturero', 'inquisidor', 'verdugo', 'bruja', 'juglar',
];

export type IdBioma = 'cementerio' | 'catacumbas' | 'minas' | 'abadia' | 'castillo';
export const BIOMAS_ORDEN: IdBioma[] = ['cementerio', 'catacumbas', 'minas', 'abadia', 'castillo'];

/** Etiquetas de daño y de forma: las mejoras y las bendiciones suben las que nombran. */
export type Etiqueta = 'fisico' | 'fuego' | 'sagrado' | 'veneno' | 'sangre' | 'sombra' | 'hielo' | 'cuerpo' | 'distancia' | 'area' | 'invocacion' | 'construccion';
export const ETIQUETAS: Etiqueta[] = ['fisico', 'fuego', 'sagrado', 'veneno', 'sangre', 'sombra', 'hielo', 'cuerpo', 'distancia', 'area', 'invocacion', 'construccion'];

/** Estadísticas del personaje. Las de porcentaje van en fracción (0,25 = +25 %). */
export interface Stats {
  vida: number; // vida máxima (puntos)
  regen: number; // vida por segundo
  armadura: number; // puntos (reduce el daño: a / (a + 12))
  esquiva: number; // probabilidad (0-0,6)
  velocidad: number; // % de velocidad al caminar
  dano: number; // % de daño de todo
  cadencia: number; // % de velocidad de ataque
  area: number; // % de área
  cantidad: number; // proyectiles / golpes extra (entero)
  velProy: number; // % de velocidad de proyectiles
  duracion: number; // % de duración de zonas, órbitas y efectos
  critico: number; // probabilidad extra de crítico
  danoCritico: number; // multiplicador extra del crítico (base ×1,5)
  iman: number; // % del radio para recoger
  suerte: number; // puntos (rarezas, botín, cofres)
  experiencia: number; // % de experiencia
  oro: number; // % de oro
  excavar: number; // % de velocidad de excavar
  roboVida: number; // fracción del daño que vuelve como vida
  enfriamiento: number; // % menos de recarga de la habilidad
  luz: number; // % del radio de luz propia
  espinas: number; // daño devuelto al que pega (puntos)
  danoElite: number; // % de daño contra élites y jefes
  alcance: number; // % de alcance para buscar blanco
  curacion: number; // % de curación recibida
  invocaciones: number; // % de daño y vida de lo invocado
  vetas: number; // % más de lo que dan las vetas al romperlas
}

export const STATS_CERO: Stats = {
  vida: 0, regen: 0, armadura: 0, esquiva: 0, velocidad: 0, dano: 0, cadencia: 0, area: 0, cantidad: 0, velProy: 0, duracion: 0,
  critico: 0, danoCritico: 0, iman: 0, suerte: 0, experiencia: 0, oro: 0, excavar: 0, roboVida: 0, enfriamiento: 0, luz: 0,
  espinas: 0, danoElite: 0, alcance: 0, curacion: 0, invocaciones: 0, vetas: 0,
};
export type Stat = keyof Stats;
export const nuevasStats = (): Stats => ({ ...STATS_CERO });

/** Daño extra por etiqueta (fracción). */
export type DanoEtiqueta = Partial<Record<Etiqueta, number>>;

export type Rareza = 0 | 1 | 2 | 3 | 4;
export const NOMBRE_RAREZA = ['Común', 'Poco común', 'Rara', 'Épica', 'Legendaria'] as const;
/** Cuánto vale cada rareza respecto a la común. */
export const PESO_RAREZA = [1, 1.5, 2.1, 2.8, 3.8];

// ------------------------------------------------------------------------------------------------- Armas
export type Comportamiento =
  | 'barrido' // tajo en arco delante (espadas, hachas, hoces)
  | 'estocada' // golpe recto y largo (horca, lanza)
  | 'latigo' // línea larga que alterna de lado (cadena, soga)
  | 'proyectil' // disparos rectos (virotes, dagas, notas)
  | 'lanzado' // vuela en parábola y revienta donde cae (frascos, bombas)
  | 'orbita' // cosas que giran alrededor (cuervos, bola de hierro, páginas)
  | 'aura' // daño constante alrededor (incienso, miedo)
  | 'onda' // anillo que crece desde el jugador (martillazo, laúd, campana)
  | 'cadena' // salta de enemigo en enemigo (rayo sagrado, muñeco de vudú)
  | 'rayo' // cae del cielo sobre un enemigo (yunque, guillotina)
  | 'bumeran' // va y vuelve atravesando todo
  | 'cono' // abanico inmediato delante (fuego, chispas, trabuco)
  | 'zona' // charco o pantano que se queda en el piso
  | 'torreta' // construye una torreta que dispara sola
  | 'trampa' // deja trampas al caminar
  | 'invocar'; // llama aliados que pelean

/** Hacia dónde apunta un arma. */
/** veta: a la veta más cercana (minería; si no hay, al montón). */
export type Apunte = 'cercano' | 'mira' | 'azar' | 'denso' | 'fuerte' | 'veta';

/** Banderas de comportamiento (las sobrecargas las prenden). */
export const F = {
  EXPLOTA: 1 << 0, // el proyectil revienta al pegar
  REBOTA: 1 << 1, // rebota en las paredes
  TELEDIRIGIDO: 1 << 2, // busca al enemigo más cercano
  DIVIDE: 1 << 3, // al pegar se parte en dos
  VUELVE: 1 << 4, // regresa al dueño
  ATRAE: 1 << 5, // jala a los enemigos hacia el centro
  CHARCO: 1 << 6, // deja un charco al pegar o al caer
  EXCAVA: 1 << 7, // rompe paredes blandas
  SALTA: 1 << 8, // salta a otro enemigo al pegar
  DOBLE: 1 << 9, // golpea dos veces
  CONGELA: 1 << 10, // congela un instante
  FANTASMA: 1 << 11, // atraviesa paredes
  EJECUTA: 1 << 12, // remata a los débiles
  CURA: 1 << 13, // cura a los aliados que toca
  ATURDE: 1 << 14, // aturde
  ESPIRAL: 1 << 15, // sale en espiral
  GIRA: 1 << 16, // el golpe da la vuelta completa
  LLUEVE: 1 << 17, // cae en lluvia alrededor
  MARCA: 1 << 18, // marca a lo que toca
  ENCADENA: 1 << 19, // ata a los enemigos cercanos al golpeado
  PERSIGUE: 1 << 20, // la órbita sale disparada contra el enemigo
  DETRAS: 1 << 21, // también ataca hacia atrás
  CARGADO: 1 << 22, // dispara menos pero mucho más fuerte
  SANGRA: 1 << 23, // hace sangrar
  ENCANTA: 1 << 24, // el enemigo pelea un rato del lado de uno
  ORO: 1 << 25, // los muertos sueltan más oro
  MINA: 1 << 26, // la explosión también rompe las vetas (y suelta lo que tienen)
} as const;

export interface ParamsArma {
  dano: number;
  cadencia: number; // segundos entre ataques
  cantidad: number;
  area: number; // m
  alcance: number; // m
  vel: number; // m/s
  perfora: number;
  duracion: number; // s
  rebotes: number;
  empuje: number;
  critico: number;
  arco: number; // radianes
  quema: number; // daño por segundo de quemadura
  veneno: number;
  sangrado: number;
  lento: number; // fracción de lentitud (0-0,8)
  aturde: number; // segundos
  maldicion: number; // acumulaciones por golpe
  flags: number;
}

export type ParamsParcial = Partial<Omit<ParamsArma, 'flags'>>;

export interface DefSobrecarga {
  id: string;
  nombre: string;
  desc: string;
  /** Multiplica los parámetros (1,5 = +50 %). */
  por?: ParamsParcial;
  /** Suma a los parámetros. */
  mas?: ParamsParcial;
  flags?: number;
  /** Etiqueta que se agrega (el fuego de «Hoja ardiente»). */
  etiqueta?: Etiqueta;
}

export interface DefArma {
  id: string;
  nombre: string;
  clase: IdClase | 'comun';
  tipo: Comportamiento;
  apunta: Apunte;
  etiquetas: Etiqueta[];
  base: ParamsArma;
  desc: string;
  /** Nodo de armas.glb que se lleva en la mano (sin el prefijo «arma_»). */
  modelo: string;
  /** Nodo de proyectiles.glb (sin «p_»). */
  proyectil?: string;
  sobrecargas: DefSobrecarga[];
  /** Arma al máximo + este objeto (o reliquia) = la evolución. */
  evoluciona?: { con: string; a: string };
  /** Solo existe como evolución (no sale en las mejoras). */
  evolucion?: boolean;
  /** Color del destello (tajos, estelas). */
  color: string;
  /** Glifo de reemplazo para el ícono. */
  glifo: string;
}

// ------------------------------------------------------------------------------------------------- Mejoras
export type TipoOpcion = 'stat' | 'arma' | 'nueva' | 'don' | 'oro' | 'vida' | 'sobrecarga' | 'evolucion' | 'bendicion' | 'equipo' | 'reliquia';

/** Una de las opciones que se ofrecen al subir de nivel, al abrir un cofre o en un altar. */
export interface Opcion {
  tipo: TipoOpcion;
  id: string;
  rareza: Rareza;
  /** Para armas: en qué ranura. */
  ranura?: number;
  /** Texto ya armado (nombre, descripción, nivel). */
  nombre: string;
  desc: string;
  glifo: string;
  icono?: string;
  nivel?: number;
}

export type MotivoEleccion = 'nivel' | 'sobrecarga' | 'cofre' | 'bendicion' | 'evolucion';

export interface Eleccion {
  motivo: MotivoEleccion;
  opciones: Opcion[];
  /** Ranura del arma (sobrecargas). */
  ranura?: number;
  titulo: string;
}

// ------------------------------------------------------------------------------------------------- Equipo
export type RanuraEquipo = 'casco' | 'armadura' | 'guantes' | 'botas' | 'amuleto' | 'anillo';
export const RANURAS_EQUIPO: RanuraEquipo[] = ['casco', 'armadura', 'guantes', 'botas', 'amuleto', 'anillo'];

// ------------------------------------------------------------------------------------------------- Mapa
/** Tipos de celda de la rejilla del mapa. */
export const C = {
  VACIO: 0,
  BLANDA: 1,
  DURA: 2,
  BORDE: 3,
  HIERRO: 4,
  SANGRE: 5,
  ORO: 6,
  HUEVO: 7,
  ESCOMBRO: 8, // tapa los rieles de la carreta (blanda)
  AGUA: 9, // se camina lento
  LAVA: 10, // no se pisa, alumbra
} as const;
export type Celda = (typeof C)[keyof typeof C];

/** Vida de cada tipo de pared (segundos de excavar con velocidad 1). */
export const VIDA_CELDA: Record<number, number> = {
  [C.BLANDA]: 0.55, [C.DURA]: 1.7, [C.HIERRO]: 1.3, [C.SANGRE]: 2.1, [C.ORO]: 1.1, [C.HUEVO]: 2.6, [C.ESCOMBRO]: 0.8,
};
export const esSolida = (c: number) => c !== C.VACIO && c !== C.AGUA;
export const esExcavable = (c: number) => c !== C.VACIO && c !== C.BORDE && c !== C.AGUA && c !== C.LAVA;
/** ¿Tapa la vista y la luz? (la lava y el agua no). */
export const tapaLuz = (c: number) => esSolida(c) && c !== C.LAVA;

// ------------------------------------------------------------------------------------------------- Objetivos
export type IdObjetivo = 'hierro' | 'altares' | 'prisioneros' | 'carreta' | 'campana' | 'elite';
export type IdSecundario = 'huevos' | 'frascos' | 'cofres';

// ------------------------------------------------------------------------------------------------- Peligro
export type IdMutador = 'sangrienta' | 'sin_antorchas' | 'elites_dobles' | 'plaga' | 'roca_dura' | 'codicia' | 'eclipse' | 'fragiles' | 'enjambres' | 'velocidad';

/** Cómo arranca una expedición. */
export interface ConfigExpedicion {
  bioma: IdBioma;
  peligro: number; // 1-5
  mutadores: IdMutador[];
  semilla: number;
  /** Prueba guiada (mapa fijo y pasos). */
  tutorial?: boolean;
}

/** Lo que trae cada jugador al empezar (clase, especialización, equipo inicial del Pozo y lo permanente). */
export interface PerfilJugador {
  id: string;
  nombre: string;
  puesto: number;
  clase: IdClase;
  spec: number;
  /** Estadísticas permanentes del Pozo de las Almas y la maestría. */
  meta: Partial<Stats>;
  /** Equipo inicial escogido del Pozo. */
  equipo: Partial<Record<RanuraEquipo, string>>;
  /** Armas de la clase desbloqueadas (por maestría). */
  arsenal: string[];
  /** Armas comunes desbloqueadas (por logros). */
  comunes: string[];
  tiradas: number; // volver a tirar por expedición
  vetos: number; // descartar por expedición
  cuerpo: 'el' | 'ella';
  piel?: string;
  pelo?: string;
  tipo: 'el' | 'ella' | 'amigo';
}
