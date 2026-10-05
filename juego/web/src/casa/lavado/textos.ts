// El modo neutro de «Lavarse la cara»: cuando juega un amigo o hay amigos en la sala, nada personal de la pareja
// se ve ni se oye (ni las cartas de amor con sus recuerdos, ni los apodos de los disfraces, ni Yanbal, ni «¡Levántate,
// mi amor!»). Los efectos del juego son los mismos; solo cambia lo que se lee. Todo texto que se pinte pasa por
// aquí: `cartaVista`, `disfrazVisto`, `logroVisto`, `enemigoVisto`, `neutralizar` y `FRASES`.
import { CARTAS, type DefCarta } from './cartas';
import type { DefDisfraz } from './disfraces';
import type { DefEnemigo } from './enemigos';
import type { DefLogro } from './progreso';
import type { IdCarta } from './tipos';

let neutro = false;
/** Lo prende el juego cuando juega un amigo o hay amigos en la sala (y lo apaga al volver a jugar a solas). */
export function ponerNeutro(si: boolean) {
  neutro = si;
}
export const esNeutro = () => neutro;

/** Las cartas en modo neutro: los mismos efectos, nombres de cartas mágicas y frases sin recuerdos. */
const CARTAS_NEUTRAS: Record<IdCarta, { nombre: string; recuerdo: string; efecto?: string }> = {
  transformice: { nombre: 'La alcancía de oro', recuerdo: '«Lo que brilla, también cura.»' },
  matematicas: { nombre: 'El golpe certero', recuerdo: 'Cuenta bien y pega donde duele.' },
  buscarte: { nombre: 'El silbato', recuerdo: 'Un pitazo y todos vienen hacia ti… ¿listo?' },
  octubre: { nombre: 'El comienzo', recuerdo: 'Así empiezan las grandes lavadas.' },
  videollamadas: { nombre: 'La maratón', recuerdo: 'Lo que dura, dura más. Y cada rato, más fuerte.' },
  estudio: {
    nombre: 'El doble turno', recuerdo: 'Dos veces lo mismo, por si acaso.',
    efecto: 'Cada arma tiene 25 % de probabilidad de dispararse dos veces seguidas, como en doble turno.',
  },
  psicologia: { nombre: 'La curita mágica', recuerdo: 'Curarse también es pegar.' },
  primeraVez: { nombre: 'El reloj quieto', recuerdo: 'Un segundito… y otro más.' },
  metaDiciembre: { nombre: 'La rueda de la fortuna', recuerdo: 'Cada minuto, una meta distinta.' },
  cartagena: {
    nombre: 'Sol de playa', recuerdo: 'Calor del bueno, de ese que revienta mugre.',
    efecto: 'Las velitas explotan al romperse y uno de cada diez mugrosos revienta como un sol de playa.',
  },
  lucesMedellin: { nombre: 'Luces de feria', recuerdo: 'Lucecitas por todas partes.' },
  sopetran: { nombre: 'El viaje largo', recuerdo: 'Caminando se llega a todas partes.' },
  halloween: { nombre: 'Fiesta de disfraces', recuerdo: 'Cada golpe trae su copia disfrazada.' },
  reina: { nombre: 'La corona de hierro', recuerdo: 'El que pega, recibe.' },
  planetario: { nombre: 'Las estrellas', recuerdo: 'Las zonas brillan como constelaciones.' },
  hogar: { nombre: 'Con lo justo', recuerdo: 'Menos es más.' },
  propuesta: { nombre: 'El diamante', recuerdo: 'Duro como un diamante, quieto como una piedra.' },
  paraSiempre: { nombre: 'Rebote sin fin', recuerdo: 'Y vuelve, y vuelve, y vuelve…' },
};

export function cartaVista(id: IdCarta): DefCarta {
  const c = CARTAS[id];
  if (!neutro) return c;
  const n = CARTAS_NEUTRAS[id];
  return { ...c, nombre: n.nombre, recuerdo: n.recuerdo, efecto: n.efecto ?? c.efecto };
}

/** Los disfraces con apodos o recuerdos de la pareja, en versión para todos. */
const DISFRACES_NEUTROS: Record<string, Partial<Pick<DefDisfraz, 'nombre' | 'desc' | 'especial' | 'grito' | 'alCrecer'>>> = {
  // (el panda es un apodo de la pareja: para los amigos es un osito)
  el_panda: {
    nombre: 'Osito en pijama', desc: 'Enterizo de osito blanco y negro, pantuflas de garra y la toalla mojada al hombro, listo para el toallazo.',
    grito: '🧸 ¡Toallazo de osito! Cada 10 niveles pega más duro', alCrecer: '🧸 ¡El osito se puso bravo! +10 % de daño',
  },
  el_perro: {
    nombre: 'Perrito peludo', desc: 'Tan peludo que la espuma se le enreda en el pelo. Recoge todo de lejos (pero es un poquito más frágil).',
    grito: '🐶 Perrito peludo: todo se le pega al pelo (imán +25 %)', alCrecer: '🐶 El pelo jala más: imán +10 %',
  },
  el_astronauta: { desc: 'Casco de burbuja, traje espacial y un bombillo con corriente. Listo para despegar.' },
  el_barbero: { desc: 'Sombrero vueltiao, chaleco y bigote. Depila cejas con hilo como todo un profesional.' },
  ella_pulga: {
    nombre: 'Pulguita saltarina', desc: 'Enterizo de pulga, patitas de más y una varita que hace burbujas. Aprende rapidísimo.',
    grito: '🐜 Pulguita saltarina: aprende rapidísimo (+10 % de experiencia)', alCrecer: '🐜 ¡Pulguita pila! +5 % de experiencia',
  },
  ella_guerrera: {
    nombre: 'Guerrera del escudo', desc: 'Siempre se vuelve a parar. Capa, corona y un escudo de corazón.',
    grito: '👑 Guerrera del escudo: si cae, se vuelve a parar', alCrecer: '👑 ¡Otra vida extra! La guerrera no se rinde',
  },
  ella_yanbal: {
    nombre: 'Diva del perfume', desc: 'Vestido negro, gafas de sol y su perfume favorito. No la para nadie.',
    grito: '💄 Diva del perfume: cada nivel, más poder', alCrecer: '💄 ¡Más glamur! +10 % de daño',
  },
  ella_turbante: { desc: 'Recién bañada, con el turbante de toalla y las pantuflas de conejo. Se cura solita.' },
};

export function disfrazVisto(d: DefDisfraz): DefDisfraz {
  if (!neutro) return d;
  const n = DISFRACES_NEUTROS[d.id];
  return n ? { ...d, ...n } : d;
}

/** Los premios de los logros nombran cartas y disfraces: en neutro se arman con los nombres neutros. */
const LOGROS_NEUTROS: Record<string, Partial<Pick<DefLogro, 'nombre' | 'premio'>>> = {
  sobrevivir5: { premio: 'Disfraces: Perrito peludo y Guerrera del escudo · Carta «El comienzo»' },
  eliminar1000: { premio: 'Disfraces: Dentista del barrio y Bata y turbante · Carta «El golpe certero»' },
  nivel20: { premio: 'Disfraces: Súper Jabón y Diva del perfume · Carta «El doble turno»' },
  evolucionar: { premio: 'Disfraces: Leñador del champú y Princesa del spa · Carta «Luces de feria»' },
  cofres5: { premio: 'Disfraces: Bombero de la ducha y Sirena de la bañera · Carta «La alcancía de oro»' },
  velitas50: { premio: 'Disfraces: Barbero de vueltiao y Estilista del secador · Carta «Sol de playa»' },
  sobrevivir10: { premio: 'Arma: Patico morado · Carta «El silbato»' },
  cara15: { premio: 'Escenario: El Lavamanos · Carta «El viaje largo»' },
  lavamanos15: { premio: 'Escenario: La Bañera · Carta «Fiesta de disfraces»' },
  ganarCara: { premio: 'Disfraces: Astronauta del retrete y Ranita de la bañera · Modo Apurado · Carta «Rebote sin fin»' },
  ganarLavamanos: { premio: 'Carta «El diamante»' },
  ganarBanera: { premio: 'Carta «Con lo justo»' },
  espinillon: { premio: 'Carta «El reloj quieto»' },
  nivel40: { premio: 'Pasiva: Espejo roto · Carta «La rueda de la fortuna»' },
  eliminar10000: { premio: 'Arma: Colonia · Carta «Las estrellas»' },
  evoluciones3: { premio: 'Arma: Toallita desmaquillante · Carta «La corona de hierro»' },
  arepas20: { premio: 'Pasiva: Curita de corazón · Carta «La curita mágica»' },
  veinticuatro: { nombre: 'Maratón de lavado', premio: 'Carta «La maratón»' },
};

export function logroVisto(l: DefLogro): DefLogro {
  if (!neutro) return l;
  const n = LOGROS_NEUTROS[l.id];
  return n ? { ...l, ...n } : l;
}

const ENEMIGOS_NEUTROS: Record<string, string> = {
  pulga: 'Chiquita y brincona. Salta cuando menos lo esperas.',
  reinaCaspa: 'Llega nevando. Guarda una carta mágica perdida.',
};
export function enemigoVisto<T extends DefEnemigo>(e: T): T {
  if (!neutro || !ENEMIGOS_NEUTROS[e.id]) return e;
  return { ...e, desc: ENEMIGOS_NEUTROS[e.id] };
}

/** Lo que dice el juego en voz alta (avisos del motor y de los escenarios). */
export function neutralizar(t: string): string {
  if (!neutro || !t) return t;
  return t
    .replace(/cartas de amor/gi, 'cartas mágicas')
    .replace(/carta de amor/gi, 'carta mágica')
    .replace(/¡Te busqué por todos lados!/g, '¡Todos para acá!')
    .replace(/mi amor/gi, 'parce')
    .replace(/💌/g, '🃏')
    .replace(/[💞💖💕💗]/gu, '✨');
}

/** Las frases que dependen del modo. */
export const FRASES = {
  levanta: (quien: string, aMi: boolean) => (aMi ? (neutro ? '¡Te levantaron! A seguir ✨' : '¡Me levantaste! 💖') : neutro ? `¡Arriba, ${quien}! A seguir lavando ✨` : '¡Levántate, mi amor! 💖'),
  revive: () => (neutro ? '¡A seguir! Te volviste a parar ✨' : '¡A seguir! Te volviste a parar 💖'),
  cayo: (quien: string) => `¡${quien} cayó! Quédate a su ladito para levantarle`,
  tituloCartas: () => (neutro ? 'Cartas mágicas' : 'Cartas de amor'),
  sinCarta: () => (neutro ? 'Sin carta mágica' : 'Sin carta de amor'),
  iconoCarta: () => (neutro ? '🃏' : '💌'),
  cartaPerdida: () => (neutro ? '🃏 Una carta mágica perdida' : '💌 Una carta de amor perdida'),
  leyendoCarta: () => (neutro ? 'escogiendo una carta mágica' : 'leyendo una carta de amor'),
};
