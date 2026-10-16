// El Escudo de las Hermanas: los datos del juego (torres, enemigos, niveles y oleadas). Nada de three.js aquí: lo usa
// el motor (motor.ts), que también corre sin pantalla para probar el balance (scripts/_escudo_balance.mjs).
//
// Coordenadas del mapa: las de three.js en el piso (x a la derecha, z hacia la cámara). La ceniza entra por la
// izquierda (el abismo de Astra) y camina hasta el escudo de luz, a la derecha.

export type IdTorre = 'aura' | 'lara' | 'dragon' | 'grifo' | 'unicornio' | 'fuatia';
export type IdEnemigo = 'mota' | 'motita' | 'sombra' | 'golem' | 'polilla' | 'divisora' | 'jefe';
export type Elemento = 'fuego' | 'agua' | 'tierra' | 'aire';
export type Rama = 'a' | 'b';

/** Lo que hace una torre en un nivel (1, 2, 3) o en una de sus ramas finales. */
export interface Etapa {
  /** Lo que cuesta llegar aquí (construir, mejorar o escoger la rama). */
  costo: number;
  nombre: string;
  /** Una línea de qué gana (para el menú). */
  desc: string;
  alcance: number;
  /** Segundos entre disparos (o entre pulsos). */
  cada: number;
  dano: number;
  /** Radio de la explosión (Aura). */
  radio?: number;
  /** Cuántas bolas o blancos a la vez. */
  multi?: number;
  /** Quema: daño por segundo y segundos. */
  quema?: [number, number];
  /** Ralentiza: fracción (0,4 = 40 % más lento) y segundos. */
  lento?: [number, number];
  /** Multiplicador contra voladores (0: no les llega) y contra los de tierra. */
  aire: number;
  tierra: number;
  /** Ignora la armadura de los gólems. */
  perfora?: boolean;
  /** Salta a otros N enemigos cercanos (Garra de tormenta). */
  cadena?: number;
  /** Lara: las almas con menos de esta fracción de vida se van con la luz. */
  acompana?: number;
  /** Lara (rama b): cada tantos segundos las rosas enraízan a todos los del radio (segundos quietos). */
  aturde?: [number, number];
  /** Unicornio: más daño (fracción) y más rapidez a las torres del radio; y cura un corazón del escudo cada tantos s. */
  apoyo?: { dano: number; rapidez?: number; alcance?: number };
  cura?: number;
  /** Unicornio (rama b): quita la armadura a los del radio. */
  purifica?: boolean;
  /** Dragón: ancho del cono de la llamarada (grados). */
  cono?: number;
  /** Dragón (rama b): deja el piso ardiendo (daño por segundo, segundos). */
  charco?: [number, number];
  /** Fuatia: multiplicador del daño de los elementos. */
  elementos?: number;
}

export interface DefTorre {
  id: IdTorre;
  nombre: string;
  /** Quién la cuida (sale en el menú). */
  de: string;
  desc: string;
  color: string;
  etapas: [Etapa, Etapa, Etapa];
  ramas: Record<Rama, Etapa>;
}

const nada = { aire: 0, tierra: 1 };

export const TORRES: Record<IdTorre, DefTorre> = {
  aura: {
    id: 'aura', nombre: 'Altar de Aura', de: 'El fuego de la Hermana mayor', color: '#ff9a2a',
    desc: 'Bolas de fuego que estallan en área. No alcanza a los que vuelan.',
    etapas: [
      { costo: 70, nombre: 'Altar de Aura', desc: 'Bola de fuego con estallido', alcance: 4.2, cada: 1.6, dano: 26, radio: 1.25, ...nada },
      { costo: 95, nombre: 'Altar encendido', desc: '+ daño y estallido más grande', alcance: 4.6, cada: 1.5, dano: 44, radio: 1.45, ...nada },
      { costo: 140, nombre: 'Altar del mediodía', desc: '+ daño, + alcance', alcance: 5.0, cada: 1.4, dano: 70, radio: 1.65, ...nada },
    ],
    ramas: {
      a: { costo: 230, nombre: 'Sol del Alba', desc: 'Un sol enorme que deja todo ardiendo', alcance: 5.4, cada: 2.0, dano: 150, radio: 2.4, quema: [18, 3], ...nada },
      b: { costo: 210, nombre: 'Lluvia de chispas', desc: 'Tres bolas a la vez, una por enemigo', alcance: 5.2, cada: 1.1, dano: 52, radio: 1.4, multi: 3, ...nada },
    },
  },
  lara: {
    id: 'lara', nombre: 'Altar de Lara', de: 'El descanso de la Hermana menor', color: '#b9a4f0',
    desc: 'Pulsos que ralentizan a todos (también a los que vuelan). Quien cae en su luz se va acompañado y deja más luz de estrellas.',
    etapas: [
      { costo: 80, nombre: 'Altar de Lara', desc: 'Pulso que ralentiza', alcance: 3.2, cada: 1.0, dano: 6, lento: [0.32, 1.4], aire: 1, tierra: 1 },
      { costo: 100, nombre: 'Altar de la calma', desc: 'Más lento y más lejos', alcance: 3.6, cada: 1.0, dano: 10, lento: [0.42, 1.5], aire: 1, tierra: 1 },
      { costo: 150, nombre: 'Altar del ocaso', desc: 'Más daño en cada pulso', alcance: 4.0, cada: 0.9, dano: 17, lento: [0.5, 1.6], aire: 1, tierra: 1 },
    ],
    ramas: {
      a: { costo: 220, nombre: 'Velo del Ocaso', desc: 'Las almas débiles se van con la luz de una vez', alcance: 4.3, cada: 0.9, dano: 20, lento: [0.6, 1.6], acompana: 0.14, aire: 1, tierra: 1 },
      b: { costo: 200, nombre: 'Rosal de la Calma', desc: 'Las rosas enraízan a todos cada tanto', alcance: 4.2, cada: 0.9, dano: 28, lento: [0.5, 1.6], aturde: [6, 1.6], aire: 1, tierra: 1 },
    },
  },
  dragon: {
    id: 'dragon', nombre: 'Nido del Dragón', de: 'Guardián del fuego de la mina', color: '#5fd39a',
    desc: 'Llamarada en cono que quema a todos los de adelante. Corto alcance, mucho daño.',
    etapas: [
      { costo: 110, nombre: 'Nido del Dragón', desc: 'Llamarada corta', alcance: 3.0, cada: 0.25, dano: 44, cono: 55, aire: 0.5, tierra: 1 },
      { costo: 130, nombre: 'Dragón joven', desc: '+ daño y más lejos', alcance: 3.4, cada: 0.25, dano: 72, cono: 58, aire: 0.5, tierra: 1 },
      { costo: 190, nombre: 'Dragón guardián', desc: '+ daño', alcance: 3.8, cada: 0.25, dano: 110, cono: 60, aire: 0.5, tierra: 1 },
    ],
    ramas: {
      a: { costo: 260, nombre: 'Jade ancestral', desc: 'Atraviesa la armadura de los gólems', alcance: 4.1, cada: 0.25, dano: 165, cono: 62, perfora: true, aire: 0.6, tierra: 1 },
      b: { costo: 240, nombre: 'Fuego de la mina', desc: 'Deja el camino ardiendo', alcance: 4.0, cada: 0.25, dano: 120, cono: 66, charco: [40, 3], aire: 0.5, tierra: 1 },
    },
  },
  grifo: {
    id: 'grifo', nombre: 'Percha del Grifo', de: 'Patrulla de la frontera', color: '#f2c94c',
    desc: 'Plumas de oro de un solo blanco. Fortísimo contra los que vuelan (los prefiere).',
    etapas: [
      { costo: 90, nombre: 'Percha del Grifo', desc: 'Pluma de oro', alcance: 5.4, cada: 0.95, dano: 38, aire: 2.3, tierra: 0.7 },
      { costo: 110, nombre: 'Grifo veloz', desc: '+ daño y alcance', alcance: 6.0, cada: 0.85, dano: 64, aire: 2.3, tierra: 0.7 },
      { costo: 160, nombre: 'Grifo de la Campana', desc: '+ daño', alcance: 6.5, cada: 0.8, dano: 100, aire: 2.3, tierra: 0.7 },
    ],
    ramas: {
      a: { costo: 230, nombre: 'Garra de tormenta', desc: 'El rayo salta a cuatro enemigos más', alcance: 6.6, cada: 0.8, dano: 120, cadena: 4, aire: 2.3, tierra: 0.8 },
      b: { costo: 210, nombre: 'Vigía de la frontera', desc: 'Alcance enorme y golpe tremendo', alcance: 9.5, cada: 1.1, dano: 270, aire: 2.6, tierra: 0.8 },
    },
  },
  unicornio: {
    id: 'unicornio', nombre: 'Fuente del Unicornio', de: 'Guardián de la pureza', color: '#bfe6ff',
    desc: 'Apoyo: las torres cercanas pegan más duro y cada tanto le devuelve un corazón al escudo. Su cuerno también dispara.',
    etapas: [
      { costo: 100, nombre: 'Fuente del Unicornio', desc: '+15 % de daño alrededor; cura el escudo', alcance: 3.4, cada: 1.2, dano: 10, apoyo: { dano: 0.15 }, cura: 32, aire: 1, tierra: 1 },
      { costo: 120, nombre: 'Fuente clara', desc: '+25 % de daño; cura más seguido', alcance: 3.8, cada: 1.1, dano: 16, apoyo: { dano: 0.25 }, cura: 26, aire: 1, tierra: 1 },
      { costo: 170, nombre: 'Fuente de plata', desc: '+35 % de daño', alcance: 4.2, cada: 1.0, dano: 24, apoyo: { dano: 0.35 }, cura: 20, aire: 1, tierra: 1 },
    ],
    ramas: {
      a: { costo: 220, nombre: 'Luz plateada', desc: '+50 % de daño, disparan más rápido y más lejos', alcance: 4.6, cada: 1.0, dano: 30, apoyo: { dano: 0.5, rapidez: 0.2, alcance: 0.15 }, cura: 20, aire: 1, tierra: 1 },
      b: { costo: 200, nombre: 'Lágrimas de alegría', desc: 'Cura cada 9 s y les quita la armadura a los gólems', alcance: 4.4, cada: 1.0, dano: 30, apoyo: { dano: 0.35 }, cura: 9, purifica: true, aire: 1, tierra: 1 },
    },
  },
  fuatia: {
    id: 'fuatia', nombre: 'Pilar de Fuatia', de: 'Los cuatro elementos', color: '#9fe3d6',
    desc: 'Tócalo para cambiar de elemento: fuego quema, agua ralentiza, tierra rompe armaduras, aire tumba a los que vuelan.',
    etapas: [
      { costo: 120, nombre: 'Pilar de Fuatia', desc: 'Un elemento a la vez', alcance: 4.5, cada: 1.0, dano: 1, elementos: 1, aire: 1, tierra: 1 },
      { costo: 140, nombre: 'Pilar despierto', desc: 'Elementos más fuertes', alcance: 4.8, cada: 0.95, dano: 1, elementos: 1.6, aire: 1, tierra: 1 },
      { costo: 200, nombre: 'Pilar de los núcleos', desc: 'Elementos mucho más fuertes', alcance: 5.1, cada: 0.9, dano: 1, elementos: 2.4, aire: 1, tierra: 1 },
    ],
    ramas: {
      a: { costo: 240, nombre: 'La Balanza', desc: 'Cambia sola de elemento en cada disparo, +40 %', alcance: 5.4, cada: 0.85, dano: 1, elementos: 3.4, aire: 1, tierra: 1 },
      b: { costo: 260, nombre: 'Los Cuatro Núcleos', desc: 'Dispara los cuatro elementos a la vez', alcance: 5.2, cada: 1.0, dano: 1, elementos: 1.6, aire: 1, tierra: 1 },
    },
  },
};

export const ORDEN_TORRES: IdTorre[] = ['aura', 'lara', 'dragon', 'grifo', 'unicornio', 'fuatia'];

/** Lo que hace cada elemento de Fuatia con el multiplicador 1. */
export const ELEMENTOS: Record<Elemento, { nombre: string; color: string; dano: number; aire: number; tierra: number; quema?: [number, number];
  lento?: [number, number]; perfora?: boolean; empuja?: number }> = {
  fuego: { nombre: 'Fuego', color: '#ff8a2a', dano: 22, aire: 0, tierra: 1, quema: [10, 2.5] },
  agua: { nombre: 'Agua', color: '#4fa8e8', dano: 16, aire: 0.6, tierra: 1, lento: [0.45, 1.4] },
  tierra: { nombre: 'Tierra', color: '#a8c060', dano: 40, aire: 0, tierra: 1, perfora: true },
  aire: { nombre: 'Aire', color: '#d6eef8', dano: 22, aire: 1.9, tierra: 0.6, empuja: 0.7 },
};
export const ORDEN_ELEMENTOS: Elemento[] = ['fuego', 'agua', 'tierra', 'aire'];

// ------------------------------------------------------------------------------------------------- los enemigos

export interface DefEnemigo {
  id: IdEnemigo;
  nombre: string;
  desc: string;
  vida: number;
  /** Metros por segundo. */
  vel: number;
  armadura: number;
  aereo: boolean;
  /** Luz de estrellas que deja. */
  valor: number;
  /** Corazones que le quita al escudo si llega. */
  dano: number;
  /** Tamaño (para elegir blanco y para dibujar). */
  radio: number;
}

export const ENEMIGOS: Record<IdEnemigo, DefEnemigo> = {
  mota: { id: 'mota', nombre: 'Mota de ceniza', desc: 'Llegan muchas. Sola no asusta.', vida: 60, vel: 1.45, armadura: 0, aereo: false, valor: 5, dano: 1, radio: 0.4 },
  motita: { id: 'motita', nombre: 'Motita', desc: 'Lo que suelta la brasa partida.', vida: 39, vel: 1.9, armadura: 0, aereo: false, valor: 2, dano: 1, radio: 0.3 },
  sombra: { id: 'sombra', nombre: 'Sombra veloz', desc: 'Corre el doble. Ralentízala con Lara.', vida: 48, vel: 2.9, armadura: 0, aereo: false, valor: 6, dano: 1, radio: 0.4 },
  golem: { id: 'golem', nombre: 'Gólem de ceniza', desc: 'Blindado: la armadura le quita la mitad del daño. Tierra, jade y el unicornio se la rompen.', vida: 450, vel: 0.72, armadura: 0.55, aereo: false, valor: 22, dano: 3, radio: 0.7 },
  polilla: { id: 'polilla', nombre: 'Polilla de ceniza', desc: 'Vuela: el fuego no le llega. Grifos, aire y Lara sí.', vida: 93, vel: 1.65, armadura: 0, aereo: true, valor: 8, dano: 1, radio: 0.45 },
  divisora: { id: 'divisora', nombre: 'Brasa partida', desc: 'Al romperla suelta tres motitas.', vida: 225, vel: 1.05, armadura: 0, aereo: false, valor: 10, dano: 2, radio: 0.6 },
  jefe: { id: 'jefe', nombre: 'La sombra de Nath’Gora', desc: 'Llama a la ceniza y apaga torres. Si llega al escudo, lo rompe.', vida: 8400, vel: 0.42, armadura: 0.3, aereo: false, valor: 250, dano: 20, radio: 1.2 },
};

// ------------------------------------------------------------------------------------------------- los niveles

export type Punto = [number, number];

export interface Grupo {
  t: IdEnemigo;
  n: number;
  /** Segundos entre uno y otro. */
  cada: number;
  /** Por cuál ruta (índice); sin ruta: se reparten. */
  r?: number;
  /** Segundos después de empezar la oleada. */
  tras?: number;
}
export type Oleada = Grupo[];

export interface Nivel {
  id: string;
  nombre: string;
  sub: string;
  /** Lo que cuenta el narrador al entrar (una línea). */
  intro: string;
  /** Caminos de la ceniza (del portal al escudo). Los que comparten el principio se bifurcan. */
  rutas: Punto[][];
  /** Cuántos sitios para construir se escogen (los mejores, junto al camino). */
  sitios: number;
  /** Sitios fijos además de los escogidos. */
  sitiosExtra?: Punto[];
  /** Islas de 4 m (celdas de la cuadrícula) que NO están: huecos al abismo. */
  huecos?: Punto[];
  luz: number;
  /** Multiplica la vida de la ceniza (se suma un 8 % por oleada). */
  fuerza: number;
  /** Cuánto más dura la ceniza en cada oleada (0,14 = 14 % más por oleada). */
  crece?: number;
  oleadas: Oleada[];
  /** Torres que se pueden construir aquí. */
  torres: IdTorre[];
  /** Color del cielo y de la niebla. */
  cielo: [string, string];
  /** Utilería del nivel (claves del kit escudo_mapa). */
  utileria: string[];
  /** Es la batalla de la misión P23. */
  historia?: boolean;
}

const g = (t: IdEnemigo, n: number, cada: number, tras = 0, r?: number): Grupo => ({ t, n, cada, tras, r });

const T4: IdTorre[] = ['aura', 'lara', 'dragon', 'grifo'];
const T5: IdTorre[] = [...T4, 'unicornio'];
const T6: IdTorre[] = [...T5, 'fuatia'];

export const NIVELES: Nivel[] = [
  {
    id: 'mirador', nombre: 'El Mirador de las Santas', sub: 'I', luz: 260, fuerza: 0.95, sitios: 11, torres: ['aura', 'lara', 'dragon'],
    intro: 'Aquí las Santas miraban las estrellas. Hoy la ceniza viene por el camino viejo.',
    rutas: [
      [[-17, -3], [-10, -3], [-10, 3.5], [-3, 3.5], [-3, -4], [4, -4], [4, 2.5], [10, 2.5], [10, -1], [17, -1]],
      [[-17, -3], [-10, -3], [-10, 3.5], [-3, 3.5], [-3, -4], [4, -4], [4, 2.5], [4, 6.2], [12.5, 6.2], [12.5, -1], [17, -1]],
    ],
    oleadas: [
      [g('mota', 8, 1.3)],
      [g('mota', 12, 1.0)],
      [g('mota', 8, 1.0), g('sombra', 4, 1.4, 6)],
      [g('sombra', 8, 0.8), g('mota', 8, 0.9, 3)],
      [g('mota', 14, 0.7), g('divisora', 2, 3, 6)],
      [g('divisora', 4, 2.4), g('sombra', 10, 0.6, 4)],
      [g('mota', 20, 0.5), g('golem', 1, 1, 8)],
      [g('golem', 2, 4), g('sombra', 12, 0.5, 2), g('divisora', 3, 2, 8)],
    ],
    cielo: ['#2a2350', '#0b0a1e'], utileria: ['farol_estrella', 'banco_madera', 'telescopio', 'arbol_estelar', 'flores_estrella', 'cristal_azul', 'columna_rota', 'estandarte_aura', 'estandarte_lara'],
  },
  {
    id: 'arcos', nombre: 'Los Arcos Rotos', sub: 'II', luz: 280, fuerza: 1.25, sitios: 12, torres: T4,
    intro: 'Las ruinas de las Santas de antes. Por encima vuelan las polillas de ceniza.',
    rutas: [
      [[-17, 4], [-11, 4], [-11, -3.5], [-4, -3.5], [-4, 1], [3, 1], [3, -5], [9, -5], [9, 1.5], [17, 1.5]],
      [[-17, 4], [-11, 4], [-11, -3.5], [-4, -3.5], [-4, 1], [-4, 5.5], [6, 5.5], [9, 5.5], [9, 1.5], [17, 1.5]],
    ],
    oleadas: [
      [g('mota', 10, 1.0)],
      [g('polilla', 6, 1.3)],
      [g('mota', 10, 0.8), g('polilla', 5, 1.2, 5)],
      [g('sombra', 10, 0.7), g('divisora', 2, 3, 5)],
      [g('polilla', 10, 0.9), g('mota', 10, 0.7, 2)],
      [g('golem', 2, 5), g('mota', 16, 0.5, 1)],
      [g('divisora', 5, 2), g('polilla', 8, 0.9, 4)],
      [g('sombra', 16, 0.45), g('golem', 2, 4, 6)],
      [g('polilla', 14, 0.6), g('golem', 3, 3.5, 3), g('mota', 14, 0.5, 8)],
    ],
    cielo: ['#3a2150', '#100a1e'], utileria: ['arco_roto', 'columna_rota', 'cristal_morado', 'hongos_luz', 'farol_estrella', 'roca_lunar_1', 'flores_estrella', 'provisiones'],
  },
  {
    id: 'cantera', nombre: 'La Cantera de Cristal', sub: 'III', luz: 300, fuerza: 1.0, sitios: 12, torres: T5,
    intro: 'Dos grietas a la vez. El unicornio de Celia vino a sostener la luz.',
    rutas: [
      [[-17, -5.5], [-9, -5.5], [-9, -1], [-1, -1], [-1, 3.5], [7, 3.5], [7, 0], [17, 0]],
      [[-17, 5.5], [-12, 5.5], [-12, 1.5], [-5, 1.5], [-5, 6], [3, 6], [3, 3.5], [7, 3.5], [7, 0], [17, 0]],
      [[-17, -5.5], [-9, -5.5], [-9, -1], [-1, -1], [-1, -5], [11, -5], [11, 0], [17, 0]],
    ],
    oleadas: [
      [g('mota', 8, 1.0, 0, 0), g('mota', 8, 1.0, 0, 1)],
      [g('sombra', 10, 0.7), g('polilla', 4, 1.2, 4)],
      [g('divisora', 4, 2.5), g('mota', 12, 0.6, 2)],
      [g('golem', 3, 4), g('sombra', 10, 0.6, 3)],
      [g('polilla', 12, 0.7), g('divisora', 3, 3, 3)],
      [g('mota', 30, 0.35), g('golem', 2, 5, 6)],
      [g('sombra', 18, 0.4), g('polilla', 10, 0.8, 3)],
      [g('golem', 5, 3), g('divisora', 4, 2.5, 4)],
      [g('polilla', 16, 0.5), g('sombra', 14, 0.5, 2), g('golem', 3, 4, 6)],
      [g('golem', 4, 3, 0, 0), g('golem', 4, 3, 0, 1), g('mota', 24, 0.4, 4), g('divisora', 4, 2, 10)],
    ],
    cielo: ['#1f3550', '#08121e'], utileria: ['cristal_azul', 'cristal_dorado', 'cristal_morado', 'provisiones', 'roca_lunar_2', 'roca_lunar_1', 'farol_estrella', 'tienda_campana'],
  },
  {
    id: 'rosal', nombre: 'El Rosal de la Noche', sub: 'IV', luz: 320, fuerza: 1.35, crece: 0.22, sitios: 13, torres: T6,
    intro: 'Donde Lara deja descansar a las almas. Fuatia trajo sus cuatro elementos.',
    rutas: [
      [[-17, 0], [-11, 0], [-11, -5], [-5, -5], [-5, 0], [1, 0], [1, -5], [7, -5], [7, 1], [12, 1], [12, -1], [17, -1]],
      [[-17, 0], [-11, 0], [-11, 5], [-5, 5], [-5, 0], [1, 0], [1, 5], [7, 5], [7, 1], [12, 1], [12, -1], [17, -1]],
    ],
    oleadas: [
      [g('mota', 14, 0.7)],
      [g('sombra', 12, 0.6), g('polilla', 6, 1, 5)],
      [g('golem', 3, 3.5), g('mota', 12, 0.6, 2)],
      [g('divisora', 6, 2), g('sombra', 10, 0.5, 3)],
      [g('polilla', 16, 0.6), g('golem', 2, 4, 5)],
      [g('mota', 30, 0.3), g('divisora', 4, 2, 4)],
      [g('golem', 6, 2.5), g('polilla', 10, 0.7, 6)],
      [g('sombra', 24, 0.35), g('divisora', 5, 2, 5)],
      [g('polilla', 20, 0.45), g('golem', 4, 3, 2)],
      [g('golem', 8, 2), g('sombra', 20, 0.4, 4), g('divisora', 6, 1.6, 8)],
    ],
    cielo: ['#2e1d48', '#0c0818'], utileria: ['rosal_lara', 'estandarte_lara', 'flores_estrella', 'hongos_luz', 'arbol_estelar', 'columna_rota', 'farol_estrella'],
  },
  {
    id: 'puente', nombre: 'El Puente de las Brasas', sub: 'V', luz: 340, fuerza: 1.35, crece: 0.24, sitios: 13, torres: T6,
    intro: 'El paso angosto sobre el abismo. Si la ceniza cruza aquí, llega al escudo.',
    huecos: [[-1, -2], [0, -2], [1, -2], [-1, 2], [0, 2], [1, 2]],
    rutas: [
      [[-17, -6], [-10, -6], [-10, -2], [-4, -2], [-4, 0], [5, 0], [5, -4], [11, -4], [11, 0.5], [17, 0.5]],
      [[-17, 6], [-10, 6], [-10, 2], [-4, 2], [-4, 0], [5, 0], [5, 4], [11, 4], [11, 0.5], [17, 0.5]],
    ],
    oleadas: [
      [g('mota', 10, 0.7, 0, 0), g('mota', 10, 0.7, 0, 1)],
      [g('sombra', 16, 0.5), g('polilla', 6, 0.9, 4)],
      [g('golem', 4, 3), g('divisora', 3, 2.5, 5)],
      [g('polilla', 18, 0.5), g('mota', 16, 0.5, 2)],
      [g('divisora', 8, 1.6), g('sombra', 14, 0.45, 3)],
      [g('golem', 6, 2.4), g('polilla', 12, 0.6, 5)],
      [g('mota', 40, 0.25), g('golem', 4, 3, 5)],
      [g('sombra', 26, 0.3), g('divisora', 6, 1.6, 4), g('polilla', 12, 0.6, 8)],
      [g('golem', 8, 2, 0, 0), g('golem', 8, 2, 0, 1), g('polilla', 16, 0.5, 6)],
      [g('divisora', 10, 1.2), g('sombra', 30, 0.3, 2), g('golem', 6, 2, 8)],
      [g('polilla', 30, 0.35), g('golem', 10, 1.6, 3), g('mota', 40, 0.25, 6)],
    ],
    cielo: ['#3d1f2a', '#140a0e'], utileria: ['brasero_aura', 'estandarte_aura', 'provisiones', 'cristal_dorado', 'roca_lunar_1', 'farol_estrella', 'tienda_campana'],
  },
  {
    id: 'grieta', nombre: 'La Estrella sin Dueño', sub: 'VI · P23', luz: 400, fuerza: 1.3, crece: 0.26, sitios: 15, torres: T6, historia: true,
    intro: 'La última autorización. Nath’Gora en persona viene por el escudo.',
    rutas: [
      [[-17, -4], [-11, -4], [-11, 1], [-5, 1], [-5, -5], [2, -5], [2, -1], [8, -1], [8, 3], [12, 3], [12, 0], [17, 0]],
      [[-17, 4.5], [-13, 4.5], [-13, 6.5], [-6, 6.5], [-6, 3.5], [0, 3.5], [0, 6], [6, 6], [8, 6], [8, 3], [12, 3], [12, 0], [17, 0]],
      [[-17, -4], [-11, -4], [-11, 1], [-5, 1], [-5, 3.5], [0, 3.5], [0, 6], [6, 6], [8, 6], [8, 3], [12, 3], [12, 0], [17, 0]],
    ],
    oleadas: [
      [g('mota', 12, 0.6, 0, 0), g('mota', 12, 0.6, 0, 1)],
      [g('sombra', 18, 0.45), g('polilla', 8, 0.8, 4)],
      [g('golem', 4, 2.8), g('divisora', 4, 2.2, 4)],
      [g('polilla', 20, 0.45), g('sombra', 14, 0.45, 3)],
      [g('divisora', 8, 1.5), g('golem', 4, 3, 5)],
      [g('mota', 40, 0.25), g('polilla', 14, 0.5, 4)],
      [g('golem', 8, 2), g('sombra', 22, 0.35, 4)],
      [g('polilla', 24, 0.4), g('divisora', 8, 1.4, 4)],
      [g('golem', 10, 1.6), g('mota', 30, 0.3, 4), g('polilla', 12, 0.5, 10)],
      [g('sombra', 30, 0.28), g('divisora', 10, 1.2, 3), g('golem', 6, 2, 10)],
      [g('jefe', 1, 1, 6), g('mota', 20, 0.6), g('polilla', 16, 0.8, 10), g('golem', 6, 4, 18)],
    ],
    cielo: ['#141a3a', '#03030a'], utileria: ['estandarte_aura', 'estandarte_lara', 'brasero_aura', 'cristal_azul', 'cristal_morado', 'roca_lunar_2', 'provisiones', 'tienda_campana', 'farol_estrella'],
  },
];

/** Nuevas defensas del Borde. Reutilizan presupuestos y oleadas de la campaña original; cambia el terreno. */
function expedicion(base: string, mapa: Pick<Nivel, 'id' | 'nombre' | 'sub' | 'intro' | 'rutas' | 'cielo' | 'utileria'>): Nivel {
  const origen = NIVELES.find(n => n.id === base)!;
  return { ...structuredClone(origen), ...mapa, historia: false, huecos: undefined, sitiosExtra: undefined };
}

NIVELES.push(
  expedicion('cantera', {
    id: 'observatorio', nombre: 'El Observatorio del Alba', sub: 'VII',
    intro: 'Dos senderos rodean el telescopio. Las patrullas deben cubrir también el regreso de la curva.',
    rutas: [
      [[-17,-5],[-12,-5],[-12,1],[-7,1],[-7,-5],[0,-5],[0,4],[7,4],[7,-2],[12,-2],[12,1],[17,1]],
      [[-17,5],[-12,5],[-12,1],[-7,1],[-7,6],[0,6],[0,4],[7,4],[7,-2],[12,-2],[12,1],[17,1]],
      [[-17,-5],[-12,-5],[-12,1],[-7,1],[-7,6],[0,6],[0,4],[7,4],[7,-2],[12,-2],[12,1],[17,1]],
    ],
    cielo: ['#37456b','#10172b'], utileria: ['telescopio','farol_estrella','cristal_dorado','banco_madera','estandarte_aura','columna_rota'],
  }),
  expedicion('cantera', {
    id: 'canales', nombre: 'Los Canales de Cristal', sub: 'VIII',
    intro: 'Tres entradas desembocan entre cristales. El paso central une las rutas antes del escudo.',
    rutas: [
      [[-17,-6],[-11,-6],[-11,-1],[-4,-1],[-4,-5],[3,-5],[3,0],[10,0],[10,-4],[14,-4],[14,0],[17,0]],
      [[-17,6],[-11,6],[-11,1],[-4,1],[-4,5],[3,5],[3,0],[10,0],[10,4],[14,4],[14,0],[17,0]],
      [[-17,0],[-14,0],[-14,-3],[-8,-3],[-8,1],[-4,1],[-4,5],[3,5],[3,0],[10,0],[10,4],[14,4],[14,0],[17,0]],
    ],
    cielo: ['#194b58','#081722'], utileria: ['cristal_azul','cristal_morado','cristal_dorado','roca_lunar_2','farol_estrella','provisiones'],
  }),
  expedicion('rosal', {
    id: 'luciernagas', nombre: 'El Jardín de las Luciérnagas', sub: 'IX',
    intro: 'La ceniza rodea dos jardines de luz. Las curvas interiores permiten acompañar más de un sendero.',
    rutas: [
      [[-17,0],[-13,0],[-13,-5],[-6,-5],[-6,4],[1,4],[1,-4],[8,-4],[8,4],[13,4],[13,0],[17,0]],
      [[-17,0],[-13,0],[-13,5],[-6,5],[-6,4],[1,4],[1,-4],[8,-4],[8,4],[13,4],[13,0],[17,0]],
    ],
    cielo: ['#1e453e','#081b1b'], utileria: ['hongos_luz','flores_estrella','arbol_estelar','rosal_lara','farol_estrella','estandarte_lara'],
  }),
  expedicion('rosal', {
    id: 'terrazas', nombre: 'Las Terrazas del Ocaso', sub: 'X',
    intro: 'Dos grietas bordean las terrazas en sentidos opuestos antes de compartir el último corredor.',
    rutas: [
      [[-17,-6],[-8,-6],[-8,-1],[-12,-1],[-12,5],[-3,5],[-3,-4],[5,-4],[5,2],[11,2],[11,-1],[17,-1]],
      [[-17,6],[-14,6],[-14,2],[-8,2],[-8,6],[-3,6],[-3,-4],[5,-4],[5,2],[11,2],[11,-1],[17,-1]],
    ],
    cielo: ['#543452','#1d1028'], utileria: ['rosal_lara','estandarte_lara','arco_roto','columna_rota','banco_madera','flores_estrella','cristal_morado'],
  }),
  expedicion('puente', {
    id: 'braseros', nombre: 'La Ronda de los Braseros', sub: 'XI',
    intro: 'Las dos columnas de ceniza rodean los braseros y se cruzan en el centro del campamento.',
    rutas: [
      [[-17,-5],[-11,-5],[-11,4],[-4,4],[-4,-4],[3,-4],[3,4],[10,4],[10,-2],[14,-2],[14,0],[17,0]],
      [[-17,5],[-14,5],[-14,-1],[-7,-1],[-7,6],[0,6],[0,0],[7,0],[7,-5],[13,-5],[13,0],[17,0]],
    ],
    cielo: ['#5a352c','#1b0f16'], utileria: ['brasero_aura','estandarte_aura','tienda_campana','provisiones','cristal_dorado','farol_estrella'],
  }),
  expedicion('grieta', {
    id: 'corona', nombre: 'La Corona del Borde', sub: 'XII',
    intro: 'Tres pasos forman una corona alrededor del campamento. Un eco de Nath’Gora sigue a la última patrulla.',
    rutas: [
      [[-17,-6],[-10,-6],[-10,-1],[-4,-1],[-4,-6],[3,-6],[3,1],[8,1],[8,-3],[13,-3],[13,0],[17,0]],
      [[-17,6],[-10,6],[-10,1],[-4,1],[-4,6],[3,6],[3,1],[8,1],[8,-3],[13,-3],[13,0],[17,0]],
      [[-17,0],[-14,0],[-14,-3],[-7,-3],[-7,3],[0,3],[0,-2],[5,-2],[5,5],[11,5],[11,0],[17,0]],
    ],
    cielo: ['#352653','#090e22'], utileria: ['estandarte_aura','estandarte_lara','arco_roto','cristal_dorado','cristal_morado','telescopio','farol_estrella'],
  }),
);

/** El mapa del modo infinito (las oleadas se arman solas, cada vez más duras). */
export const INFINITO: Nivel = {
  id: 'infinito', nombre: 'El Borde sin Fin', sub: '∞', luz: 360, fuerza: 1, sitios: 15, torres: T6,
  intro: 'La ceniza no se acaba. ¿Hasta qué oleada aguanta el escudo?',
  rutas: [
    [[-17, -5], [-10, -5], [-10, 0], [-3, 0], [-3, -5], [4, -5], [4, 0], [10, 0], [17, 0]],
    [[-17, 5], [-10, 5], [-10, 0], [-3, 0], [-3, 5], [4, 5], [4, 0], [10, 0], [17, 0]],
  ],
  oleadas: [],
  cielo: ['#1d2340', '#05060f'], utileria: ['farol_estrella', 'cristal_azul', 'cristal_dorado', 'cristal_morado', 'hongos_luz', 'roca_lunar_1', 'arco_roto', 'estandarte_aura', 'estandarte_lara'],
};

/** Oleada n (desde 0) del modo infinito: un presupuesto que crece y se reparte entre los tipos. */
export function oleadaInfinita(n: number, azar: () => number): Oleada {
  if (n > 0 && (n + 1) % 10 === 0) return [g('jefe', 1 + Math.floor(n / 30), 6, 4), g('mota', 20 + n, 0.4), g('polilla', 10 + n / 2, 0.6, 6)];
  const tipos: [IdEnemigo, number, number][] = [['mota', 5, 0], ['sombra', 6, 1], ['polilla', 8, 2], ['divisora', 12, 3], ['golem', 24, 4]];
  const posibles = tipos.filter(([, , desde]) => desde <= n);
  const out: Oleada = [];
  let presupuesto = 50 + n * 22;
  let tras = 0;
  while (presupuesto > 0 && out.length < 4) {
    const [t, costo] = posibles[Math.floor(azar() * posibles.length)];
    const cuantos = Math.max(2, Math.min(40, Math.round((presupuesto * (0.4 + azar() * 0.4)) / costo)));
    out.push(g(t, cuantos, t === 'golem' ? 2.2 : t === 'divisora' ? 1.5 : 0.45 + azar() * 0.3, tras));
    presupuesto -= cuantos * costo;
    tras += 3 + azar() * 4;
  }
  return out;
}

/** Vidas del escudo al empezar. */
export const VIDAS = 20;
/** Segundos entre oleadas (se pueden adelantar con premio). */
export const ESPERA = 14;

/** Las habilidades de las Santas (y la tercera: la del Lazo en la versión de la pareja). */
export interface DefHabilidad { id: 'eliana' | 'serena' | 'lazo'; recarga: number; radio: number }
export const HABILIDADES: Record<'eliana' | 'serena' | 'lazo', DefHabilidad> = {
  eliana: { id: 'eliana', recarga: 32, radio: 2.3 },
  serena: { id: 'serena', recarga: 40, radio: 2.8 },
  lazo: { id: 'lazo', recarga: 90, radio: 0 },
};
