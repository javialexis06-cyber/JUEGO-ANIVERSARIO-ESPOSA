// Los disfraces (los personajes desbloqueables del original, pero de Él y de Ella): ocho para cada uno. Solo
// existen dentro de este juego. Cada uno trae su arma inicial, sus bonos y su crecimiento por nivel, como Antonio,
// Imelda, Gennaro, Krochi o Poe, y un look que se reconoce (ropa del clóset + un accesorio del baño en la mano o en
// la cabeza).
import type { Ropa } from '../modelo';
import type { IdArma, Rol, Stat, Stats } from './tipos';

/** Accesorios que se le ponen encima (modelos del baño, ver personajes/blender/lavado_objetos.py). */
export type Accesorio =
  | 'toalla_hombro' | 'espuma_cabeza' | 'cepillo_mano' | 'espejo_frente' | 'jabon_pecho' | 'champu_mano' | 'casco_burbuja' | 'casco_bombero'
  | 'manguera' | 'hilo_mano' | 'varita_mano' | 'escudo' | 'perfume_mano' | 'turbante' | 'patico_mano' | 'ranita_cabeza' | 'esponja_mano'
  | 'secador_mano' | 'rulos';

export interface Crecimiento {
  /** Cada cuántos niveles (1 = cada nivel). */
  cada: number;
  stat: Stat;
  paso: number;
  /** Hasta qué nivel sigue creciendo. */
  hasta: number;
  /** Desde qué nivel (para «una vez al nivel 33»). */
  desde?: number;
}

export interface DefDisfraz {
  id: string;
  rol: Rol;
  nombre: string;
  /** El personaje del original en que se inspira. */
  original: string;
  desc: string;
  /** Lo que lo hace especial, en una línea. */
  especial: string;
  arma: IdArma;
  /** Arma extra con la que empieza (la Directora Yanbal trae perfume y colonia). */
  arma2?: IdArma;
  base: Partial<Stats>;
  crece: Crecimiento[];
  /** Porta: al empezar, las armas se recargan mucho más rápido y se va pasando en estos segundos. */
  arranque?: number;
  ropa: Ropa;
  accesorios: Accesorio[];
  /** Cómo se gana (si no es el de siempre). */
  logro?: string;
  precio: number;
  inicial?: boolean;
}

export const DISFRACES: DefDisfraz[] = [
  // ------------------------------------------------------------------------------------------------ Él
  {
    id: 'el_panda', rol: 'el', nombre: 'Panda en pijama', original: 'Antonio', inicial: true, precio: 0,
    desc: 'Así le dice ella. Enterizo de panda, pantuflas de garra y la toalla mojada al hombro, listo para el toallazo.',
    especial: '+20 de vida y 1 de armadura. Cada 10 niveles pega 10 % más duro (hasta +50 %).',
    arma: 'toalla', base: { vida: 20, armadura: 1 }, crece: [{ cada: 10, stat: 'poder', paso: 0.1, hasta: 50 }],
    ropa: { arriba: 'enterizo_panda', cabeza: 'capucha_panda_bambu', pies: 'pantuflas_panda_garra', espalda: 'mochila_bambu' },
    accesorios: ['toalla_hombro'],
  },
  {
    id: 'el_perro', rol: 'el', nombre: 'Perro lanudo', original: 'Poe Ratcho', precio: 600, logro: 'sobrevivir5',
    desc: 'Tan lanudo que la espuma se le enreda en el pelo. Recoge todo de lejos (pero es un poquito más frágil).',
    especial: 'Empieza con el Aura de espuma. Imán +25 %, pero 30 de vida menos.',
    arma: 'espuma', base: { iman: 0.25, vida: -30 }, crece: [{ cada: 1, stat: 'iman', paso: 0.01, hasta: 30 }],
    ropa: { arriba: 'enterizo_perrito', cabeza: 'capucha_perrito', cola: 'cola_perrito', pies: 'pantuflas_perrito' },
    accesorios: ['espuma_cabeza'],
  },
  {
    id: 'el_dentista', rol: 'el', nombre: 'Dentista del barrio', original: 'Gennaro', precio: 500, logro: 'eliminar1000',
    desc: 'Bata blanca, espejito en la frente y un cepillo de dientes en cada bolsillo.',
    especial: 'Empieza con el Cepillo de dientes y +1 proyectil en todas las armas.',
    arma: 'cepillo', base: { cantidad: 1 }, crece: [],
    ropa: { arriba: 'bata_medico', abajo: 'pantalon_jean', cara: 'gafas_redondas', pies: 'zapatos_blancos' },
    accesorios: ['espejo_frente', 'cepillo_mano'],
  },
  {
    id: 'el_heroe', rol: 'el', nombre: 'Súper Jabón', original: 'Pasqualina', precio: 700, logro: 'nivel20',
    desc: 'Capa roja, antifaz y un jabón en el pecho. Resbala el mal.',
    especial: 'Empieza con el Jabón resbaloso. Sus proyectiles van 10 % más rápido cada 5 niveles (hasta +30 %).',
    arma: 'jabon', base: { velocidad: 0.1 }, crece: [{ cada: 5, stat: 'velocidad', paso: 0.1, hasta: 15 }],
    ropa: { arriba: 'camiseta_heroe_azul', abajo: 'pantalon_jean', espalda: 'capa_roja', cara: 'antifaz_negro', pies: 'botas_lluvia_rojas' },
    accesorios: ['jabon_pecho'],
  },
  {
    id: 'el_lenador', rol: 'el', nombre: 'Leñador del champú', original: 'Lama Ladonna', precio: 800, logro: 'evolucionar',
    desc: 'Camisa de cuadros, gorro de lana y bigote de leñador. Tira frascos de champú como si fueran hachas.',
    especial: 'Empieza con el Champú volador. Cada 10 niveles: +5 % de daño, de velocidad y de maldición.',
    arma: 'champu', base: {}, crece: [
      { cada: 10, stat: 'poder', paso: 0.05, hasta: 40 }, { cada: 10, stat: 'movimiento', paso: 0.05, hasta: 40 }, { cada: 10, stat: 'maldicion', paso: 0.05, hasta: 40 },
    ],
    ropa: { arriba: 'camisa_lenador', abajo: 'pantalon_jean', cabeza: 'gorro_lana_rojo', cara: 'bigote', pies: 'botas_cafe' },
    accesorios: ['champu_mano'],
  },
  {
    id: 'el_astronauta', rol: 'el', nombre: 'Astronauta del retrete', original: 'Porta Ladonna', precio: 1200, logro: 'ganarCara',
    desc: 'El mismo que salió volando del baño después del picante. Ahora con casco y un bombillo con corriente.',
    especial: 'Empieza con el Bombillo travieso. +30 % de área y al principio todo se recarga rapidísimo.',
    arma: 'bombillo', base: { area: 0.3 }, crece: [], arranque: 25,
    ropa: { arriba: 'traje_astronauta', pies: 'botas_blancas' },
    accesorios: ['casco_burbuja'],
  },
  {
    id: 'el_bombero', rol: 'el', nombre: 'Bombero de la ducha', original: 'Poppea Pecorina', precio: 600, logro: 'cofres5',
    desc: 'Casco rojo, botas de caucho y la manguera de la ducha. Si hay mugre, hay chorro.',
    especial: 'Empieza con el Chorro de la ducha. +1 % de duración por nivel (hasta +50 %).',
    arma: 'ducha', base: {}, crece: [{ cada: 1, stat: 'duracion', paso: 0.01, hasta: 50 }],
    ropa: { arriba: 'chaqueta_roja', abajo: 'pantalon_negro', pies: 'botas_lluvia' },
    accesorios: ['casco_bombero', 'manguera'],
  },
  {
    id: 'el_barbero', rol: 'el', nombre: 'Barbero de vueltiao', original: 'Concetta Caciotta', precio: 900, logro: 'velitas50',
    desc: 'Sombrero vueltiao, chaleco y bigote. Depila cejas con hilo como un profesional… (peinar a su esposa ya es otra historia).',
    especial: 'Empieza con el Hilo dental. +1 % de velocidad al caminar por nivel (hasta +40 %).',
    arma: 'hilo', base: { movimiento: 0.05 }, crece: [{ cada: 1, stat: 'movimiento', paso: 0.01, hasta: 40 }],
    ropa: { arriba: 'camisa_blanca', abajo: 'pantalon_negro', cabeza: 'sombrero_vueltiao', cara: 'bigote', pies: 'zapatos_negros' },
    accesorios: ['hilo_mano'],
  },
  // ------------------------------------------------------------------------------------------------ Ella
  {
    id: 'ella_pulga', rol: 'ella', nombre: 'Pulga aventurera', original: 'Imelda Belpaese', inicial: true, precio: 0,
    desc: 'Así le dice él. Enterizo de pulga, patitas de más y una varita que hace burbujas. Aprende rapidísimo.',
    especial: '+10 % de experiencia y +5 % más en los niveles 5, 10 y 15.',
    arma: 'burbujas', base: { crecimiento: 0.1 }, crece: [{ cada: 5, stat: 'crecimiento', paso: 0.05, hasta: 15 }],
    ropa: { arriba: 'enterizo_pulga', cabeza: 'capucha_pulga', espalda: 'patitas_pulga', pies: 'pantuflas_pulga' },
    accesorios: ['varita_mano'],
  },
  {
    id: 'ella_guerrera', rol: 'ella', nombre: 'La mejor guerrera de Dios', original: 'Krochi Freetto', precio: 900, logro: 'sobrevivir5',
    desc: 'Le ha pasado de todo y siempre se vuelve a parar. Capa, corona y un escudo de corazón.',
    especial: 'Empieza con la Peinilla bumerán, 1 vida extra (y otra al nivel 33) y +30 % de velocidad.',
    arma: 'peinilla', base: { revivir: 1, movimiento: 0.3 }, crece: [{ cada: 33, stat: 'revivir', paso: 1, hasta: 33, desde: 33 }],
    ropa: { arriba: 'vestido_rojo', espalda: 'capa_morada', cabeza: 'corona', pies: 'botas_negras' },
    accesorios: ['escudo'],
  },
  {
    id: 'ella_yanbal', rol: 'ella', nombre: 'Directora Yanbal', original: 'Pugnala Provola', precio: 1000, logro: 'nivel20',
    desc: 'Vestido negro, gafas de sol y el perfume de la marca. Llegó a directora y no la para nadie.',
    especial: 'Empieza con el Perfume y la Colonia. +1 % de daño por nivel (hasta +60 %).',
    arma: 'perfume', arma2: 'colonia', base: {}, crece: [{ cada: 1, stat: 'poder', paso: 0.01, hasta: 60 }],
    ropa: { arriba: 'vestido_negro', cara: 'gafas_sol', pies: 'tacones_negros' },
    accesorios: ['perfume_mano'],
  },
  {
    id: 'ella_turbante', rol: 'ella', nombre: 'Bata y turbante', original: 'Suor Clerici', precio: 500, logro: 'eliminar1000',
    desc: 'Recién bañada, con el turbante de toalla y las pantuflas de conejo. Se va a demorar horas arreglándose.',
    especial: 'Empieza con las Botellitas de agua. Recupera 0,5 de vida por segundo y +25 % de área, pero 20 de vida menos.',
    arma: 'botellas', base: { recuperacion: 0.5, area: 0.25, vida: -20 }, crece: [{ cada: 1, stat: 'area', paso: 0.01, hasta: 15 }],
    ropa: { arriba: 'pijama_enteriza_corazones', pies: 'pantuflas_conejo_rosa' },
    accesorios: ['turbante'],
  },
  {
    id: 'ella_sirena', rol: 'ella', nombre: 'Sirena de la bañera', original: 'Gallo Valletto', precio: 700, logro: 'cofres5',
    desc: 'Cola de sirena, corona de conchas y su patico amarillo, que la sigue a todas partes.',
    especial: 'Empieza con el Patico amarillo. +20 % de duración y +1 % de suerte por nivel (hasta +30 %).',
    arma: 'patoAmarillo', base: { duracion: 0.2 }, crece: [{ cada: 1, stat: 'suerte', paso: 0.01, hasta: 30 }],
    ropa: { arriba: 'top_conchas', abajo: 'cola_sirena', cabeza: 'corona_conchas' },
    accesorios: ['patico_mano'],
  },
  {
    id: 'ella_ranita', rol: 'ella', nombre: 'Ranita de la bañera', original: 'Giovanna Grana', precio: 1200, logro: 'ganarCara',
    desc: 'Enterizo de rana y pantuflas con dedos. Sus ranitas de hule le traen de todo.',
    especial: 'Empieza con las Ranitas. +1 % de velocidad de los proyectiles por nivel (hasta +60 %).',
    arma: 'ranitas', base: {}, crece: [{ cada: 1, stat: 'velocidad', paso: 0.01, hasta: 60 }],
    ropa: { arriba: 'enterizo_rana', cabeza: 'capucha_rana', pies: 'pantuflas_rana' },
    accesorios: ['ranita_cabeza'],
  },
  {
    id: 'ella_princesa', rol: 'ella', nombre: 'Princesa del spa', original: 'Dommario', precio: 800, logro: 'evolucionar',
    desc: 'Vestido de princesa y tiara. Sus esponjas le dan la vuelta despacito, como en un spa de lujo.',
    especial: 'Empieza con las Esponjas orbitales. +40 % de duración y de velocidad de los proyectiles, pero camina 40 % más lento.',
    arma: 'esponjas', base: { duracion: 0.4, velocidad: 0.4, movimiento: -0.4 }, crece: [],
    ropa: { arriba: 'vestido_princesa_azul', cabeza: 'tiara', pies: 'sandalias_doradas' },
    accesorios: ['esponja_mano'],
  },
  {
    id: 'ella_estilista', rol: 'ella', nombre: 'Estilista del secador', original: 'Arca Ladonna', precio: 700, logro: 'velitas50',
    desc: 'Rulos, gafas de corazón y el secador en la mano. Nadie sale despeinado de su salón.',
    especial: 'Empieza con el Secador de pelo. Las armas se recargan 5 % más rápido en los niveles 10, 20 y 30.',
    arma: 'secador', base: {}, crece: [{ cada: 10, stat: 'enfriamiento', paso: 0.05, hasta: 30 }],
    ropa: { arriba: 'blusa_rosada', abajo: 'falda_rosada', cara: 'gafas_corazon', pies: 'botas_rosadas' },
    accesorios: ['secador_mano', 'rulos'],
  },
];

export const DISFRAZ = Object.fromEntries(DISFRACES.map((d) => [d.id, d])) as Record<string, DefDisfraz>;
export const disfracesDe = (r: Rol) => DISFRACES.filter((d) => d.rol === r);
export const disfrazInicial = (r: Rol) => DISFRACES.find((d) => d.rol === r && d.inicial)!;
