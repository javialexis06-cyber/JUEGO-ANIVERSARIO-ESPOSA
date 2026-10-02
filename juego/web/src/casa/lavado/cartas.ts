// Las cartas de amor: los Arcanos del original, cada una con el nombre de un recuerdo de verdad (docs/cien-puertas.md,
// «Los recuerdos»). Se escoge una al empezar y, al vencer a los que traen cartas perdidas (minutos 11 y 21), otra
// más. Cada una cambia mucho la partida, como en el original. Se desbloquean con logros.
import type { IdCarta } from './tipos';

export interface DefCarta {
  id: IdCarta;
  numero: string;
  nombre: string;
  /** La frase del recuerdo. */
  recuerdo: string;
  efecto: string;
  original: string;
  color: string;
}

export const CARTAS: Record<IdCarta, DefCarta> = {
  transformice: {
    id: 'transformice', numero: '0', nombre: 'La villa de Transformice', original: 'Disco of Gold', color: '#F2C14E',
    recuerdo: '«Estás como necesitada, así que ten.»',
    efecto: 'Las gotas doradas valen el doble y cada una te cura un poquito.',
  },
  matematicas: {
    id: 'matematicas', numero: 'I', nombre: 'Matemáticas y filosofía', original: 'Slash', color: '#7DB7E8',
    recuerdo: '«La filosofía no sé. El filósofo, tal vez.»',
    efecto: 'Todas las armas pueden dar golpes críticos (10 % + tu suerte) y los críticos pegan el doble.',
  },
  buscarte: {
    id: 'buscarte', numero: 'II', nombre: 'Te busqué por todos lados', original: 'Mad Groove', color: '#E58BB5',
    recuerdo: 'Ella lo buscó por todo el juego… ¿y él de verdad la buscaba?',
    efecto: 'Cada 2 minutos todos los mugrosos y las velitas del mapa vienen hacia ti. Mucha experiencia… y mucho susto.',
  },
  octubre: {
    id: 'octubre', numero: 'III', nombre: 'El 25 de octubre', original: 'Beginning', color: '#F29B38',
    recuerdo: '¿Treinta días o cuarenta? Ahí empezó todo.',
    efecto: '+1 proyectil en todas las armas y empiezas con un arma más, al azar.',
  },
  videollamadas: {
    id: 'videollamadas', numero: 'IV', nombre: 'Videollamadas de 24 horas', original: 'Lost & Found Painting', color: '#9C8CE0',
    recuerdo: '¿Casi completaron las 24 horas o las completaron?',
    efecto: 'Todo lo que dura, dura 60 % más. Y cada 6 minutos le pegas 10 % más duro (se acumula).',
  },
  estudio: {
    id: 'estudio', numero: 'V', nombre: 'Compañeros de estudio', original: 'Gemini', color: '#6FC3A0',
    recuerdo: 'Las tareas de artística contra «casi todas» las de ella.',
    efecto: 'Cada arma tiene 25 % de probabilidad de dispararse dos veces seguidas, como haciendo la tarea en pareja.',
  },
  psicologia: {
    id: 'psicologia', numero: 'VI', nombre: 'Psicología', original: 'Sarabande of Healing', color: '#F2A5B8',
    recuerdo: '¿Insistente o persistente? Él la convenció.',
    efecto: 'Te curas el doble, y cada vez que te curas, la curita revienta en espuma que pega alrededor.',
  },
  primeraVez: {
    id: 'primeraVez', numero: 'VII', nombre: 'La primera vez que nos vimos', original: 'Out of Bounds', color: '#8FD3F2',
    recuerdo: '«Eras perfecta.» —«¿Era?»',
    efecto: 'El tiempo se detiene: cada minuto todos se quedan quietos 4 segundos, y los quietos reciben 50 % más daño.',
  },
  metaDiciembre: {
    id: 'metaDiciembre', numero: 'VIII', nombre: 'La meta de diciembre', original: 'Wicked Season', color: '#D9534F',
    recuerdo: 'Directora de Yanbal, justo antes de Cartagena.',
    efecto: 'Cada minuto cambia la meta: +50 % de experiencia, de suerte, de gotas doradas o de maldición, por turnos.',
  },
  cartagena: {
    id: 'cartagena', numero: 'IX', nombre: 'Cartagena', original: 'Heart of Fire', color: '#FF8A3D',
    recuerdo: 'Ella en una banca del aeropuerto, él en un hotel cinco estrellas. La moto acuática y el castillo.',
    efecto: 'Las velitas explotan al romperse y uno de cada diez mugrosos revienta como el sol de Cartagena.',
  },
  lucesMedellin: {
    id: 'lucesMedellin', numero: 'X', nombre: 'Las luces de diciembre', original: 'Twilight Requiem', color: '#FFD45C',
    recuerdo: '¿Las luces de Medellín o los ojos de ella?',
    efecto: 'Los proyectiles que se acaban estallan en lucecitas que pegan alrededor.',
  },
  sopetran: {
    id: 'sopetran', numero: 'XI', nombre: 'De Sopetrán a Bucaramanga', original: 'Tragic Princess', color: '#7FB069',
    recuerdo: '¿Ocho horas o nueve? Somos el complemento.',
    efecto: 'Mientras caminas, las armas se recargan 30 % más rápido. Quieto no hay viaje.',
  },
  halloween: {
    id: 'halloween', numero: 'XII', nombre: 'Halloween elegante', original: 'Boogaloo of Illusions', color: '#9B59B6',
    recuerdo: '«Me derrite.» —«Dímelo otra vez.»',
    efecto: 'Cuando un proyectil pega, a veces suelta una copia chiquita disfrazada que sigue de largo.',
  },
  reina: {
    id: 'reina', numero: 'XIII', nombre: 'Un cumpleaños de reina', original: 'Divine Bloodline', color: '#E4574B',
    recuerdo: 'El restaurante de súper lujo… ¿y quién pagó?',
    efecto: 'Tu armadura y tu vida máxima te suben el daño, y el que te pega recibe su merecido.',
  },
  planetario: {
    id: 'planetario', numero: 'XIV', nombre: 'El planetario', original: 'Blood Astronomia', color: '#3D5A98',
    recuerdo: 'Parque Explora. ¿Quién miraba a quién?',
    efecto: 'Las armas de zona (espuma, charcos, ducha, esponjas y paticos) pegan 50 % más y crecen con tu daño y tu área.',
  },
  hogar: {
    id: 'hogar', numero: 'XV', nombre: 'Mi hogar eres tú', original: 'Silent Old Sanctuary', color: '#C98A4B',
    recuerdo: '«Tú eres mi pilar.»',
    efecto: 'Con lo que tienes basta: cada ranura de arma vacía te da +10 % de daño, +5 % de recarga y +0,2 de recuperación.',
  },
  propuesta: {
    id: 'propuesta', numero: 'XVI', nombre: 'La propuesta', original: 'Jail of Crystal', color: '#BFE6F5',
    recuerdo: '¿Aretes, una cadena… o el anillo? «¡Lloré lo justo!»',
    efecto: 'Los proyectiles a veces dejan al mugroso quieto como un diamante (12 %).',
  },
  paraSiempre: {
    id: 'paraSiempre', numero: 'XVII', nombre: 'Para siempre', original: 'Waltz of Pearls', color: '#FF7AA8',
    recuerdo: '¿Katherine o Lexy Katherine? Los labios, la sonrisa y el final de Disney.',
    efecto: 'Los proyectiles rebotan de un mugroso a otro, una y otra vez (+2 rebotes).',
  },
};

export const ID_CARTAS = Object.keys(CARTAS) as IdCarta[];
/** Minutos en que el que trae la carta perdida la suelta (como los arcanos del original). */
export const MINUTOS_CARTA = [11, 21];
