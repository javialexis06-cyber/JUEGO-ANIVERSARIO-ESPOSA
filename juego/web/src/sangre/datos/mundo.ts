// Enemigos, jefes, biomas, objetivos, eventos, peligros y mutadores.
import type { IdBioma, IdMutador, IdObjetivo, IdSecundario } from '../tipos';

export type Conducta =
  | 'perseguir' // camina hacia el jugador por el campo de flujo
  | 'enjambre' // como perseguir, rápido y en grupo
  | 'volador' // vuela por encima de las paredes zigzagueando
  | 'arquero' // guarda distancia y dispara
  | 'explosivo' // corre y revienta al lado
  | 'fantasma' // atraviesa las paredes
  | 'saltador' // se abalanza de un brinco
  | 'invocador' // levanta esqueletos
  | 'cargador' // toma impulso y embiste en línea recta
  | 'teletransporte' // desaparece y aparece al lado
  | 'encantador' // jala al jugador hacia ella
  | 'excavador' // sale de las paredes
  | 'quieto' // altares y cosas que no se mueven
  | 'jefe'; // cada jefe tiene su propia cabeza (sim/jefes.ts)

export interface DefEnemigo {
  id: string;
  nombre: string;
  vida: number;
  vel: number;
  dano: number;
  radio: number;
  xp: number;
  conducta: Conducta;
  /** 0 = lo mueve cualquier golpe, 1 = no lo mueve nada. */
  masa: number;
  /** Altura del modelo (m). */
  alto: number;
  vuela?: boolean;
  /** Bestia (no muerto): el daño contra muertos no le aplica. */
  vivo?: boolean;
  vampiro?: boolean;
  proyectil?: { tipo: string; dano: number; vel: number; cada: number; alcance: number };
  /** Colores del modelo de reemplazo. */
  color: [string, string];
}

const D = (o: DefEnemigo) => o;
export const ENEMIGOS_LISTA: DefEnemigo[] = [
  D({ id: 'zombi', nombre: 'Zombi aldeano', vida: 10, vel: 1.55, dano: 6, radio: 0.36, xp: 1, conducta: 'perseguir', masa: 0.1, alto: 1.1, color: ['#5e6b4a', '#4a3a30'] }),
  D({ id: 'zombi_gordo', nombre: 'Zombi hinchado', vida: 42, vel: 1.1, dano: 10, radio: 0.6, xp: 4, conducta: 'perseguir', masa: 0.55, alto: 1.3, color: ['#6b7a4e', '#3e3428'] }),
  D({ id: 'esqueleto', nombre: 'Esqueleto', vida: 13, vel: 2.0, dano: 7, radio: 0.34, xp: 1, conducta: 'perseguir', masa: 0.05, alto: 1.1, color: ['#d8d0b8', '#5a4a3a'] }),
  D({ id: 'esqueleto_arquero', nombre: 'Esqueleto arquero', vida: 10, vel: 1.8, dano: 6, radio: 0.34, xp: 2, conducta: 'arquero', masa: 0.05, alto: 1.1,
    proyectil: { tipo: 'flecha', dano: 7, vel: 9, cada: 2.6, alcance: 8 }, color: ['#d0c8b0', '#3a4a3a'] }),
  D({ id: 'cuervo', nombre: 'Cuervo carroñero', vida: 5, vel: 3.6, dano: 4, radio: 0.3, xp: 1, conducta: 'volador', masa: 0, alto: 0.5, vuela: true, vivo: true, color: ['#1e1c22', '#3a3640'] }),
  D({ id: 'perro_huesos', nombre: 'Perro de huesos', vida: 12, vel: 3.1, dano: 6, radio: 0.4, xp: 2, conducta: 'saltador', masa: 0.1, alto: 0.7, color: ['#d8d0b8', '#6a2a2a'] }),
  D({ id: 'ghoul', nombre: 'Ghoul', vida: 22, vel: 2.6, dano: 8, radio: 0.42, xp: 2, conducta: 'saltador', masa: 0.15, alto: 1.0, color: ['#7a8070', '#3a3a32'] }),
  D({ id: 'arana_cripta', nombre: 'Araña de cripta', vida: 9, vel: 3.3, dano: 5, radio: 0.4, xp: 1, conducta: 'excavador', masa: 0.05, alto: 0.5, vivo: true, color: ['#2a2420', '#7a2020'] }),
  D({ id: 'espectro', nombre: 'Espectro', vida: 16, vel: 1.9, dano: 8, radio: 0.4, xp: 2, conducta: 'fantasma', masa: 0, alto: 1.2, vuela: true, color: ['#a8c8d8', '#3a5a6a'] }),
  D({ id: 'minero_maldito', nombre: 'Minero maldito', vida: 24, vel: 1.7, dano: 9, radio: 0.42, xp: 2, conducta: 'perseguir', masa: 0.25, alto: 1.1, color: ['#5a4a3a', '#d8a030'] }),
  D({ id: 'rata_peste', nombre: 'Rata de la peste', vida: 4, vel: 3.8, dano: 3, radio: 0.26, xp: 1, conducta: 'enjambre', masa: 0, alto: 0.35, vivo: true, color: ['#4a4038', '#8a6a5a'] }),
  D({ id: 'abominacion', nombre: 'Abominación', vida: 130, vel: 1.25, dano: 18, radio: 0.85, xp: 10, conducta: 'cargador', masa: 0.8, alto: 1.7, color: ['#8a5a5a', '#5a2a2a'] }),
  D({ id: 'lacayo_explosivo', nombre: 'Lacayo explosivo', vida: 12, vel: 2.9, dano: 22, radio: 0.4, xp: 2, conducta: 'explosivo', masa: 0.1, alto: 1.0, color: ['#6a5a3a', '#e05a1a'] }),
  D({ id: 'monje_caido', nombre: 'Monje caído', vida: 20, vel: 1.8, dano: 8, radio: 0.4, xp: 2, conducta: 'perseguir', masa: 0.15, alto: 1.15, color: ['#3a2e28', '#8a7a60'] }),
  D({ id: 'gargola', nombre: 'Gárgola', vida: 45, vel: 2.3, dano: 11, radio: 0.55, xp: 4, conducta: 'cargador', masa: 0.6, alto: 1.2, vuela: true, color: ['#6a6a68', '#3a3a3a'] }),
  D({ id: 'inquisidor_muerto', nombre: 'Inquisidor no muerto', vida: 36, vel: 1.6, dano: 10, radio: 0.45, xp: 3, conducta: 'arquero', masa: 0.3, alto: 1.2,
    proyectil: { tipo: 'fuego', dano: 10, vel: 7, cada: 3.0, alcance: 7.5 }, color: ['#5a1a1a', '#c8a040'] }),
  D({ id: 'nigromante', nombre: 'Nigromante', vida: 32, vel: 1.4, dano: 6, radio: 0.45, xp: 5, conducta: 'invocador', masa: 0.2, alto: 1.2, color: ['#2a2238', '#7a5ab8'] }),
  D({ id: 'vampiro', nombre: 'Vampiro menor', vida: 40, vel: 2.6, dano: 9, radio: 0.42, xp: 4, conducta: 'teletransporte', masa: 0.3, alto: 1.15, vampiro: true, color: ['#1e1a22', '#8a1a2a'] }),
  D({ id: 'novia_vampira', nombre: 'Novia del Conde', vida: 34, vel: 2.0, dano: 8, radio: 0.42, xp: 4, conducta: 'encantador', masa: 0.2, alto: 1.15, vampiro: true, color: ['#e8e0e8', '#7a1a2a'] }),
  D({ id: 'hombre_lobo', nombre: 'Hombre lobo', vida: 95, vel: 2.5, dano: 16, radio: 0.6, xp: 8, conducta: 'cargador', masa: 0.6, alto: 1.5, vivo: true, color: ['#4a3e34', '#8a7a6a'] }),
  D({ id: 'murcielago', nombre: 'Murciélago', vida: 5, vel: 4.0, dano: 3, radio: 0.26, xp: 1, conducta: 'volador', masa: 0, alto: 0.35, vuela: true, vivo: true, color: ['#2a2024', '#5a3a40'] }),
  D({ id: 'caballero_muerte', nombre: 'Caballero de la muerte', vida: 260, vel: 1.7, dano: 20, radio: 0.62, xp: 22, conducta: 'perseguir', masa: 0.85, alto: 1.5, color: ['#2a2a30', '#6a1a1a'] }),
];
export const ENEMIGOS: Record<string, DefEnemigo> = Object.fromEntries(ENEMIGOS_LISTA.map((e) => [e.id, e]));
/** Índice de cada tipo (para la red y las piscinas por tipo). */
export const INDICE_ENEMIGO: Record<string, number> = Object.fromEntries(ENEMIGOS_LISTA.map((e, i) => [e.id, i]));

// ------------------------------------------------------------------------------------------------- Élites
export const MOD_ELITE = {
  RAPIDO: 1, // +45 % de velocidad
  ESCUDO: 2, // escudo que absorbe la mitad de su vida
  EXPLOSIVO: 4, // revienta al morir
  REGENERA: 8, // se cura 3 % por segundo
  VAMPIRICO: 16, // se cura al pegar y roba
  INVOCA: 32, // llama esqueletos
} as const;
export const NOMBRE_MOD: Record<number, string> = {
  1: 'Veloz', 2: 'Acorazado', 4: 'Explosivo', 8: 'Regenerante', 16: 'Vampírico', 32: 'Invocador',
};
export const COLOR_MOD: Record<number, string> = {
  1: '#ffd84a', 2: '#9ab8ff', 4: '#ff7a2a', 8: '#6aff8a', 16: '#ff2a4a', 32: '#b07aff',
};

// ------------------------------------------------------------------------------------------------- Jefes
export interface DefJefe {
  id: string;
  nombre: string;
  titulo: string;
  vida: number;
  vel: number;
  radio: number;
  alto: number;
  dano: number;
  fases: number;
  color: [string, string];
}
export const JEFES: Record<string, DefJefe> = {
  golem_osarios: { id: 'golem_osarios', nombre: 'El Gólem de Osarios', titulo: 'Mil huesos y una sola rabia', vida: 3600, vel: 1.45, radio: 1.4, alto: 3.0, dano: 22, fases: 2, color: ['#d8ceb0', '#6a5a48'] },
  abadesa: { id: 'abadesa', nombre: 'La Abadesa de los Lamentos', titulo: 'Su grito despierta a los muertos', vida: 3100, vel: 1.9, radio: 1.0, alto: 2.4, dano: 18, fases: 2, color: ['#c8d8e8', '#2a3a4a'] },
  gusano_sangre: { id: 'gusano_sangre', nombre: 'El Gusano de Sangre', titulo: 'Lo que vive bajo las minas', vida: 4200, vel: 2.6, radio: 1.5, alto: 2.6, dano: 24, fases: 2, color: ['#8a2a2a', '#d8a080'] },
  obispo_hueco: { id: 'obispo_hueco', nombre: 'El Obispo Hueco', titulo: 'Predica fuego a los vivos', vida: 3800, vel: 1.5, radio: 1.1, alto: 2.8, dano: 20, fases: 2, color: ['#e8d8b0', '#7a1a1a'] },
  conde: { id: 'conde', nombre: 'El Conde Sangrevil', titulo: 'Señor de la Noche Eterna', vida: 5600, vel: 2.2, radio: 1.0, alto: 2.4, dano: 26, fases: 3, color: ['#1a1418', '#a01a2a'] },
};

// ------------------------------------------------------------------------------------------------- Biomas
export interface DefBioma {
  id: IdBioma;
  nombre: string;
  desc: string;
  estilo: 'abierto' | 'cueva' | 'ruinas';
  /** Enemigos que salen: desde qué segundo de la etapa (la etapa 1 cuenta normal; cada etapa siguiente adelanta todo). */
  enemigos: { id: string; desde: number; peso: number }[];
  jefe: string;
  /** Cuántas antorchas por cada 100 celdas abiertas. */
  antorchas: number;
  /** Color de la luz de las antorchas, de la niebla, del ambiente y de la luna. */
  luz: { antorcha: string; niebla: string; ambiente: string; luna: string; fuerzaLuna: number; densidadNiebla: number };
  /** Colores del piso y la roca para los reemplazos. */
  piso: [string, string, string];
  roca: [string, string, string];
  /** Agua o lava en el mapa. */
  liquido?: 'agua' | 'lava';
  /** Glifo y color de la tarjeta. */
  glifo: string;
  color: string;
}

export const BIOMAS: Record<IdBioma, DefBioma> = {
  cementerio: {
    id: 'cementerio', nombre: 'El Cementerio Hundido', desc: 'Lápidas torcidas, mausoleos y niebla sobre el lodo. Los muertos salen de la tierra.',
    estilo: 'abierto', jefe: 'golem_osarios', antorchas: 1.6, glifo: 'lapida', color: '#6a7a6a',
    enemigos: [
      { id: 'zombi', desde: 0, peso: 10 }, { id: 'cuervo', desde: 25, peso: 4 }, { id: 'esqueleto', desde: 40, peso: 6 },
      { id: 'perro_huesos', desde: 80, peso: 4 }, { id: 'esqueleto_arquero', desde: 110, peso: 3 }, { id: 'zombi_gordo', desde: 140, peso: 3 },
      { id: 'murcielago', desde: 170, peso: 2 }, { id: 'caballero_muerte', desde: 230, peso: 0.4 },
    ],
    luz: { antorcha: '#ff9a4a', niebla: '#1a2024', ambiente: '#2a3440', luna: '#9ab8e8', fuerzaLuna: 0.55, densidadNiebla: 0.035 },
    piso: ['#3a3a30', '#2c2a24', '#4a4636'], roca: ['#4a4a44', '#33332e', '#5a5850'], liquido: 'agua',
  },
  catacumbas: {
    id: 'catacumbas', nombre: 'Las Catacumbas', desc: 'Nichos llenos de calaveras, velas y agua negra. Las arañas salen de las paredes y los espectros las atraviesan.',
    estilo: 'cueva', jefe: 'abadesa', antorchas: 1.2, glifo: 'calavera', color: '#7a6a5a',
    enemigos: [
      { id: 'esqueleto', desde: 0, peso: 10 }, { id: 'arana_cripta', desde: 20, peso: 6 }, { id: 'ghoul', desde: 50, peso: 5 },
      { id: 'espectro', desde: 80, peso: 4 }, { id: 'esqueleto_arquero', desde: 100, peso: 3 }, { id: 'murcielago', desde: 130, peso: 3 },
      { id: 'zombi_gordo', desde: 170, peso: 2 }, { id: 'caballero_muerte', desde: 230, peso: 0.4 },
    ],
    luz: { antorcha: '#ffb06a', niebla: '#141010', ambiente: '#2a2420', luna: '#b8a888', fuerzaLuna: 0.28, densidadNiebla: 0.04 },
    piso: ['#3a342c', '#2a2620', '#4a4236'], roca: ['#5a5244', '#3a342c', '#6a6252'], liquido: 'agua',
  },
  minas: {
    id: 'minas', nombre: 'Las Minas de Sangre', desc: 'Rieles, vagonetas abandonadas, cristales rojos y ríos de lava. Algo grande se mueve bajo el suelo.',
    estilo: 'cueva', jefe: 'gusano_sangre', antorchas: 1.0, glifo: 'pico', color: '#9a3a2a',
    enemigos: [
      { id: 'minero_maldito', desde: 0, peso: 8 }, { id: 'rata_peste', desde: 0, peso: 8 }, { id: 'lacayo_explosivo', desde: 40, peso: 4 },
      { id: 'esqueleto', desde: 60, peso: 4 }, { id: 'abominacion', desde: 110, peso: 1.2 }, { id: 'murcielago', desde: 120, peso: 3 },
      { id: 'esqueleto_arquero', desde: 150, peso: 2 }, { id: 'caballero_muerte', desde: 230, peso: 0.4 },
    ],
    luz: { antorcha: '#ff8a3a', niebla: '#1a0c0a', ambiente: '#3a1e18', luna: '#ff8a6a', fuerzaLuna: 0.22, densidadNiebla: 0.045 },
    piso: ['#3a2a24', '#2a1e1a', '#4a3428'], roca: ['#5a3a30', '#3a2620', '#6a4a3a'], liquido: 'lava',
  },
  abadia: {
    id: 'abadia', nombre: 'La Abadía en Llamas', desc: 'Vitrales rotos, bancas quemadas y un campanario que no deja de sonar. Los monjes siguen rezando, pero a otro.',
    estilo: 'ruinas', jefe: 'obispo_hueco', antorchas: 1.8, glifo: 'campana', color: '#c86a2a',
    enemigos: [
      { id: 'monje_caido', desde: 0, peso: 10 }, { id: 'esqueleto', desde: 15, peso: 5 }, { id: 'inquisidor_muerto', desde: 50, peso: 3 },
      { id: 'gargola', desde: 90, peso: 2 }, { id: 'nigromante', desde: 120, peso: 1.5 }, { id: 'murcielago', desde: 140, peso: 3 },
      { id: 'zombi_gordo', desde: 170, peso: 2 }, { id: 'caballero_muerte', desde: 220, peso: 0.5 },
    ],
    luz: { antorcha: '#ffa050', niebla: '#1c1210', ambiente: '#3a2a22', luna: '#ffb88a', fuerzaLuna: 0.4, densidadNiebla: 0.03 },
    piso: ['#4a3e34', '#3a2e26', '#5a4a3c'], roca: ['#6a5e50', '#4a4036', '#7a6e5e'],
  },
  castillo: {
    id: 'castillo', nombre: 'El Castillo del Conde', desc: 'Salones con tapices, candelabros y sangre en las alfombras. Aquí espera el Conde Sangrevil.',
    estilo: 'ruinas', jefe: 'conde', antorchas: 2.0, glifo: 'castillo', color: '#8a1a2a',
    enemigos: [
      { id: 'esqueleto', desde: 0, peso: 7 }, { id: 'murcielago', desde: 30, peso: 6 }, { id: 'vampiro', desde: 40, peso: 4 },
      { id: 'novia_vampira', desde: 60, peso: 3 }, { id: 'hombre_lobo', desde: 100, peso: 1.5 }, { id: 'esqueleto_arquero', desde: 120, peso: 2 },
      { id: 'nigromante', desde: 160, peso: 1 }, { id: 'caballero_muerte', desde: 200, peso: 0.6 },
    ],
    luz: { antorcha: '#ff8a5a', niebla: '#140a10', ambiente: '#2a1420', luna: '#d88aa8', fuerzaLuna: 0.38, densidadNiebla: 0.03 },
    piso: ['#3a2428', '#2a1a1e', '#5a2a30'], roca: ['#4a4048', '#322a32', '#5a505a'],
  },
};

// ------------------------------------------------------------------------------------------------- Objetivos
export interface DefObjetivo {
  id: IdObjetivo;
  nombre: string;
  /** Texto con {n} para la meta. */
  texto: string;
  ayuda: string;
  glifo: string;
}
export const OBJETIVOS: Record<IdObjetivo, DefObjetivo> = {
  hierro: { id: 'hierro', nombre: 'Hierro negro', texto: 'Excava vetas de hierro negro', ayuda: 'Camina contra las vetas oscuras con brillo metálico para excavarlas.', glifo: 'hierro' },
  altares: { id: 'altares', nombre: 'Altares de sangre', texto: 'Destruye los altares de sangre', ayuda: 'Tus armas los rompen. Cada altar que cae llama una oleada.', glifo: 'altar' },
  prisioneros: { id: 'prisioneros', nombre: 'Prisioneros', texto: 'Libera a los prisioneros', ayuda: 'Quédate a su lado para romper las cadenas. Te siguen hasta la campana.', glifo: 'cadena' },
  carreta: { id: 'carreta', nombre: 'La carreta', texto: 'Escolta la carreta de reliquias', ayuda: 'Avanza por los rieles cuando estás cerca. Excava los escombros que la tapan y protégela.', glifo: 'carreta' },
  campana: { id: 'campana', nombre: 'La campana', texto: 'Defiende la campana mientras se carga', ayuda: 'Quédate dentro del círculo. Afuera no se carga.', glifo: 'campana' },
  elite: { id: 'elite', nombre: 'Cacería', texto: 'Caza al élite marcado', ayuda: 'Una flecha roja te lleva hasta él.', glifo: 'calavera' },
};
export const SECUNDARIOS: Record<IdSecundario, { nombre: string; texto: string; glifo: string }> = {
  huevos: { nombre: 'Huevos de dragón de piedra', texto: 'Saca los huevos de las paredes', glifo: 'huevo' },
  frascos: { nombre: 'Frascos de alquimia', texto: 'Recoge los frascos de alquimia', glifo: 'frasco' },
  cofres: { nombre: 'Cofres de reliquias', texto: 'Abre los cofres de reliquias (las llaves las sueltan los élites)', glifo: 'cofre' },
};

// ------------------------------------------------------------------------------------------------- Eventos
export type IdEvento = 'enjambre' | 'cerco' | 'lluvia_huesos' | 'eclipse' | 'marea' | 'cofre_maldito';
export const EVENTOS: Record<IdEvento, { nombre: string; aviso: string }> = {
  enjambre: { nombre: 'Enjambre', aviso: '¡Un enjambre cruza la oscuridad!' },
  cerco: { nombre: 'Cerco', aviso: '¡Los muertos los rodean!' },
  lluvia_huesos: { nombre: 'Lluvia de huesos', aviso: '¡Llueven huesos! Fíjate en las sombras del piso.' },
  eclipse: { nombre: 'Eclipse', aviso: 'Eclipse: la oscuridad los vuelve más rápidos.' },
  marea: { nombre: 'Marea', aviso: '¡Una marea de muertos viene en camino!' },
  cofre_maldito: { nombre: 'Cofre maldito', aviso: 'Apareció un cofre maldito custodiado.' },
};

// ------------------------------------------------------------------------------------------------- Peligro y mutadores
export const PELIGROS = [
  { n: 1, nombre: 'Penumbra', desc: 'Para aprender. La horda tiene paciencia.', vida: 0.8, cantidad: 0.75, elites: 0.6, recompensa: 1 },
  { n: 2, nombre: 'Oscuridad', desc: 'La horda empieza a apretar.', vida: 1.0, cantidad: 1.0, elites: 1.0, recompensa: 1.35 },
  { n: 3, nombre: 'Noche cerrada', desc: 'Retador. Desde aquí hay mutadores.', vida: 1.3, cantidad: 1.2, elites: 1.35, recompensa: 1.8 },
  { n: 4, nombre: 'Noche Eterna', desc: 'Solo para los que ya conocen su clase.', vida: 1.7, cantidad: 1.4, elites: 1.7, recompensa: 2.4 },
  { n: 5, nombre: 'Sangre y Ceniza', desc: 'La muerte es segura. ¿Cuánto aguantan?', vida: 2.2, cantidad: 1.6, elites: 2.1, recompensa: 3.2 },
];

export const MUTADORES: Record<IdMutador, { nombre: string; desc: string; recompensa: number; glifo: string }> = {
  sangrienta: { nombre: 'Luna sangrienta', desc: 'Los enemigos hacen +30 % de daño.', recompensa: 0.2, glifo: 'luna' },
  sin_antorchas: { nombre: 'Sin antorchas', desc: 'No hay antorchas: solo su propia luz.', recompensa: 0.15, glifo: 'vela' },
  elites_dobles: { nombre: 'Élites dobles', desc: 'Salen el doble de élites.', recompensa: 0.25, glifo: 'calavera' },
  plaga: { nombre: 'Plaga', desc: 'Los muertos dejan charcos de veneno.', recompensa: 0.15, glifo: 'frasco' },
  roca_dura: { nombre: 'Roca dura', desc: 'Casi toda la roca es dura.', recompensa: 0.1, glifo: 'pico' },
  codicia: { nombre: 'Codicia', desc: '+50 % de oro, pero los enemigos tienen +25 % de vida.', recompensa: 0.1, glifo: 'oro' },
  eclipse: { nombre: 'Eclipse eterno', desc: 'Los eclipses llegan el doble de seguido.', recompensa: 0.15, glifo: 'luna' },
  fragiles: { nombre: 'Frágiles', desc: 'Tienen 25 % menos de vida, pero no hay curación de comida.', recompensa: 0.1, glifo: 'corazon' },
  enjambres: { nombre: 'Enjambres', desc: 'Más enemigos pequeños y rápidos.', recompensa: 0.2, glifo: 'murcielago' },
  velocidad: { nombre: 'Prisa de los muertos', desc: 'Los enemigos van 20 % más rápido.', recompensa: 0.2, glifo: 'bota' },
};

/** Cuánto dura cada etapa (s) y la cuenta de la campana de extracción. */
export const DURACION_ETAPA = 270;
/** Lo que se recupera de vida al bajar a la etapa siguiente (descanso junto al yunque), sobre la vida máxima. */
export const DESCANSO = 0.35;
export const CUENTA_EXTRACCION = 60;
export const ETAPAS = 4;
