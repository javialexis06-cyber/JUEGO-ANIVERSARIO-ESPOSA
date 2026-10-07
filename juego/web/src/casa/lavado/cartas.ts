// Las cartas mágicas: los Arcanos del original. Se escoge una al empezar y, al vencer a los que traen cartas perdidas
// (minutos 11 y 21), otra más. Cada una cambia mucho la partida, como en el original. Se desbloquean con logros.
// Aquí van en su versión para todos (la que ven los amigos); en la versión de la pareja cada una lleva además el
// nombre y la frase de un recuerdo de verdad, que viven aparte en `pareja.ts` (la versión para amigos ni lo compila).
import type { IdCarta } from './tipos';

export interface DefCarta {
  id: IdCarta;
  numero: string;
  nombre: string;
  /** La frase de la carta (en la versión de la pareja, la del recuerdo). */
  frase: string;
  efecto: string;
  original: string;
  color: string;
}

export const CARTAS: Record<IdCarta, DefCarta> = {
  oroBrillante: {
    id: 'oroBrillante', numero: '0', nombre: 'La alcancía de oro', original: 'Disco of Gold', color: '#F2C14E',
    frase: '«Lo que brilla, también cura.»',
    efecto: 'Las gotas doradas valen el doble y cada una te cura un poquito.',
  },
  certero: {
    id: 'certero', numero: 'I', nombre: 'El golpe certero', original: 'Slash', color: '#7DB7E8',
    frase: 'Cuenta bien y pega donde duele.',
    efecto: 'Todas las armas pueden dar golpes críticos (10 % + tu suerte) y los críticos pegan el doble.',
  },
  silbato: {
    id: 'silbato', numero: 'II', nombre: 'El silbato', original: 'Mad Groove', color: '#E58BB5',
    frase: 'Un pitazo y todos vienen hacia ti… ¿listo?',
    efecto: 'Cada 2 minutos todos los mugrosos y las velitas del mapa vienen hacia ti. Mucha experiencia… y mucho susto.',
  },
  comienzo: {
    id: 'comienzo', numero: 'III', nombre: 'El comienzo', original: 'Beginning', color: '#F29B38',
    frase: 'Así empiezan las grandes lavadas.',
    efecto: '+1 proyectil en todas las armas y empiezas con un arma más, al azar.',
  },
  maraton: {
    id: 'maraton', numero: 'IV', nombre: 'La maratón', original: 'Lost & Found Painting', color: '#9C8CE0',
    frase: 'Lo que dura, dura más. Y cada rato, más fuerte.',
    efecto: 'Todo lo que dura, dura 60 % más. Y cada 6 minutos le pegas 10 % más duro (se acumula).',
  },
  dobleTurno: {
    id: 'dobleTurno', numero: 'V', nombre: 'El doble turno', original: 'Gemini', color: '#6FC3A0',
    frase: 'Dos veces lo mismo, por si acaso.',
    efecto: 'Cada arma tiene 25 % de probabilidad de dispararse dos veces seguidas, como en doble turno.',
  },
  curitaMagica: {
    id: 'curitaMagica', numero: 'VI', nombre: 'La curita mágica', original: 'Sarabande of Healing', color: '#F2A5B8',
    frase: 'Curarse también es pegar.',
    efecto: 'Te curas el doble, y cada vez que te curas, la curita revienta en espuma que pega alrededor.',
  },
  relojQuieto: {
    id: 'relojQuieto', numero: 'VII', nombre: 'El reloj quieto', original: 'Out of Bounds', color: '#8FD3F2',
    frase: 'Un segundito… y otro más.',
    efecto: 'El tiempo se detiene: cada minuto todos se quedan quietos 4 segundos, y los quietos reciben 50 % más daño.',
  },
  ruedaFortuna: {
    id: 'ruedaFortuna', numero: 'VIII', nombre: 'La rueda de la fortuna', original: 'Wicked Season', color: '#D9534F',
    frase: 'Cada minuto, una meta distinta.',
    efecto: 'Cada minuto cambia la meta: +50 % de experiencia, de suerte, de gotas doradas o de maldición, por turnos.',
  },
  solPlaya: {
    id: 'solPlaya', numero: 'IX', nombre: 'Sol de playa', original: 'Heart of Fire', color: '#FF8A3D',
    frase: 'Calor del bueno, de ese que revienta mugre.',
    efecto: 'Las velitas explotan al romperse y uno de cada diez mugrosos revienta como un sol de playa.',
  },
  lucesFeria: {
    id: 'lucesFeria', numero: 'X', nombre: 'Luces de feria', original: 'Twilight Requiem', color: '#FFD45C',
    frase: 'Lucecitas por todas partes.',
    efecto: 'Los proyectiles que se acaban estallan en lucecitas que pegan alrededor.',
  },
  viajeLargo: {
    id: 'viajeLargo', numero: 'XI', nombre: 'El viaje largo', original: 'Tragic Princess', color: '#7FB069',
    frase: 'Caminando se llega a todas partes.',
    efecto: 'Mientras caminas, las armas se recargan 30 % más rápido. Quieto no hay viaje.',
  },
  fiestaDisfraces: {
    id: 'fiestaDisfraces', numero: 'XII', nombre: 'Fiesta de disfraces', original: 'Boogaloo of Illusions', color: '#9B59B6',
    frase: 'Cada golpe trae su copia disfrazada.',
    efecto: 'Cuando un proyectil pega, a veces suelta una copia chiquita disfrazada que sigue de largo.',
  },
  coronaHierro: {
    id: 'coronaHierro', numero: 'XIII', nombre: 'La corona de hierro', original: 'Divine Bloodline', color: '#E4574B',
    frase: 'El que pega, recibe.',
    efecto: 'Tu armadura y tu vida máxima te suben el daño, y el que te pega recibe su merecido.',
  },
  estrellas: {
    id: 'estrellas', numero: 'XIV', nombre: 'Las estrellas', original: 'Blood Astronomia', color: '#3D5A98',
    frase: 'Las zonas brillan como constelaciones.',
    efecto: 'Las armas de zona (espuma, charcos, ducha, esponjas y paticos) pegan 50 % más y crecen con tu daño y tu área.',
  },
  conLoJusto: {
    id: 'conLoJusto', numero: 'XV', nombre: 'Con lo justo', original: 'Silent Old Sanctuary', color: '#C98A4B',
    frase: 'Menos es más.',
    efecto: 'Con lo que tienes basta: cada ranura de arma vacía te da +10 % de daño, +5 % de recarga y +0,2 de recuperación.',
  },
  diamante: {
    id: 'diamante', numero: 'XVI', nombre: 'El diamante', original: 'Jail of Crystal', color: '#BFE6F5',
    frase: 'Duro como un diamante, quieto como una piedra.',
    efecto: 'Los proyectiles a veces dejan al mugroso quieto como un diamante (12 %).',
  },
  reboteSinFin: {
    id: 'reboteSinFin', numero: 'XVII', nombre: 'Rebote sin fin', original: 'Waltz of Pearls', color: '#FF7AA8',
    frase: 'Y vuelve, y vuelve, y vuelve…',
    efecto: 'Los proyectiles rebotan de un mugroso a otro, una y otra vez (+2 rebotes).',
  },
};

export const ID_CARTAS = Object.keys(CARTAS) as IdCarta[];
/** Minutos en que el que trae la carta perdida la suelta (como los arcanos del original). */
export const MINUTOS_CARTA = [11, 21];

