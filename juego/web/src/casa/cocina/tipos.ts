// La cocina de chef: lo que comparten los tres restaurantes (waflería, fresería y frappés) y el progreso guardado.
import type { Rol } from '../modelo';
import type { AspectoJugador, Sala } from '../../salas/tipos';

export type RecetaId = 'wafles' | 'fresas' | 'frappes';
export const RECETAS: RecetaId[] = ['wafles', 'fresas', 'frappes'];

/** Los tres restaurantes como se presentan en los menús (la hoja de la casa, la cocina de amigos y la sala). */
export const RESTAURANTES: { id: RecetaId; nombre: string; emoji: string; texto: string; plato: string; icono: string }[] = [
  { id: 'wafles', nombre: 'La Waflería', emoji: '🧇', texto: 'Wafles en la plancha, toppings y jugos', plato: 'wafle_chef', icono: 'wafle_clasica_1' },
  { id: 'fresas', nombre: 'La Fresería', emoji: '🍓', texto: 'Fresas picadas, crema batida y queso', plato: 'fresas_chef', icono: 'vasofresa_M' },
  { id: 'frappes', nombre: 'La Frapería', emoji: '🥤', texto: 'Frappés licuados con crema y salsas', plato: 'frape_chef', icono: 'vasofrappe_M' },
];
export const esReceta = (v: unknown): v is RecetaId => typeof v === 'string' && (RECETAS as string[]).includes(v);

/** Lo que se lleva de cada restaurante (en la casa compartida, uno por cada uno). */
export interface ProgresoCocina {
  /** El próximo día que toca jugar. */
  dia: number;
  /** Puntos de chef: suben el rango y el rango trae ingredientes e invitados nuevos. */
  xp: number;
  /** Las propinas del restaurante: con ellas se compran las mejoras de la cocina. */
  propinas: number;
  /** Nivel de cada mejora comprada. */
  mejoras: Record<string, number>;
  /** El mejor promedio de un día (%). */
  mejor: number;
  servidos: number;
  /** Platos con 100 % (o casi). */
  perfectos: number;
}

export const progresoNuevo = (): ProgresoCocina => ({ dia: 1, xp: 0, propinas: 0, mejoras: {}, mejor: 0, servidos: 0, perfectos: 0 });

const num = (v: unknown, d: number, min = 0, max = 1e9) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, Math.floor(v))) : d);

export function normalizarProgreso(p: unknown): ProgresoCocina {
  const b = progresoNuevo();
  if (!p || typeof p !== 'object' || Array.isArray(p)) return b;
  const o = p as Record<string, unknown>;
  const mejoras: Record<string, number> = {};
  if (o.mejoras && typeof o.mejoras === 'object' && !Array.isArray(o.mejoras)) {
    for (const [k, v] of Object.entries(o.mejoras as Record<string, unknown>)) if (/^[a-z_]{1,24}$/.test(k)) mejoras[k] = num(v, 0, 0, 9);
  }
  return {
    dia: num(o.dia, 1, 1, 9999),
    xp: num(o.xp, 0),
    propinas: num(o.propinas, 0),
    mejoras,
    mejor: num(o.mejor, 0, 0, 100),
    servidos: num(o.servidos, 0),
    perfectos: num(o.perfectos, 0),
  };
}

/** Puntos que hacen falta para llegar a cada rango (el 1 es el de arranque). */
export const umbralRango = (r: number) => (r <= 1 ? 0 : 150 * (r - 1) + 50 * ((r - 1) * (r - 2)) / 2);
export function rangoDe(xp: number) {
  let r = 1;
  while (xp >= umbralRango(r + 1)) r++;
  return r;
}
export const NOMBRE_RANGO = [
  '', 'Aprendiz', 'Ayudante de cocina', 'Cocinero de casa', 'Cocinero con estilo', 'Chef en entrenamiento', 'Chef de la cuadra', 'Chef del barrio',
  'Chef reconocido', 'Chef estrella', 'Chef de revista', 'Gran chef', 'Chef legendario', 'Leyenda de la cocina',
];
export const nombreRango = (r: number) => NOMBRE_RANGO[Math.min(r, NOMBRE_RANGO.length - 1)] + (r >= NOMBRE_RANGO.length ? ` ${r - NOMBRE_RANGO.length + 2}` : '');

/** Una mejora de la tienda del restaurante (cada nivel cuesta más). */
export interface Mejora {
  id: string;
  nombre: string;
  icono: string;
  /** Lo que da cada nivel (la longitud es el nivel máximo). */
  niveles: string[];
  precios: number[];
}

/** Lo que se desbloquea al subir de rango (se anuncia al final del día). */
export interface Desbloqueo {
  rango: number;
  texto: string;
}

/** Cómo le fue a un día en la cocina (lo que se guarda y se paga en la casa). */
export interface ResultadoDia {
  receta: RecetaId;
  dia: number;
  servidos: number;
  promedio: number;
  propinas: number;
  perfectos: number;
  xp: number;
  /** Monedas de la casa y platos de chef que se llevan a la despensa. */
  monedas: number;
  platos: number;
}

/** Quién cocina: Javier, Laura o un amigo (con su muñeco: el de Javier o el de Laura como base, y sus colores). */
export interface JugadorCocina {
  /** El id de la sala (o el rol, cocinando solo). */
  id: string;
  nombre: string;
  tipo: 'el' | 'ella' | 'amigo';
  /** El muñeco de base (para los recortes del chef y las frases con «mijo|mija»). */
  rol: Rol;
  /** Los colores del amigo (Javier y Laura usan los suyos de siempre). */
  aspecto?: AspectoJugador;
  /** Su puesto en la sala (0 = anfitrión): su color. */
  puesto: number;
}

/** Lo que el anfitrión les manda a todos al empezar: su restaurante (receta, día, rango y mejoras) y quién cocina. */
export interface ConfigCocina {
  receta: RecetaId;
  dia: number;
  rango: number;
  mejoras: Record<string, number>;
  jugadores: JugadorCocina[];
}

/** Cocinar juntos (de 2 a 4, cada uno en su celular) en una sala: el anfitrión lleva la verdad del día. */
export interface LineaCocina {
  sala: Sala;
  config: ConfigCocina;
}

/** Cómo se cerró la cocina: se salió del todo o se volvió a la sala de espera (para cocinar otra vez). */
export type SalidaCocina = 'salir' | 'sala';

export interface OpcionesCocina {
  /** El muñeco de base de quien cocina (Javier, Laura o el que escogió el amigo). */
  rol: Rol;
  receta: RecetaId;
  progreso: ProgresoCocina;
  /** Quién cocina (si no viene: Javier o Laura, por su rol). */
  yo?: JugadorCocina;
  /** La pareja que llega a comer como invitada especial (solo Javier y Laura, sin amigos de por medio). */
  pareja?: { rol: Rol; nombre: string } | null;
  /** Modo neutro: juega un amigo o hay amigos en la sala (nada personal ni romántico de la pareja). */
  neutro?: boolean;
  /** El día deja monedas y platos de chef para la casa (Javier y Laura, en su casa). */
  premioCasa?: boolean;
  /** El botón de salir (volver a la casa o a la sala de juegos de amigos). */
  textoSalir?: string;
  /** Se llama al terminar cada día y al comprar mejoras: guarda (en la casa o, un amigo, en el aparato). */
  guardar: (p: ProgresoCocina, dia?: ResultadoDia) => Promise<void>;
  /** Cocinar juntos en una sala (si no viene, se cocina solo). */
  linea?: LineaCocina;
  /**
   * Gancho para escenas especiales al terminar cada día (antes de la tarjeta del final). Si devuelve una promesa, la
   * cocina espera a que termine. También se pueden registrar en `cocina.alTerminarDia` (index.ts).
   */
  alTerminarDia?: (dia: ResultadoDia, info: InfoFinDia) => void | Promise<void>;
}

/** Lo que se le cuenta a quien engancha una escena al final del día. */
export interface InfoFinDia {
  receta: RecetaId;
  rol: Rol;
  /** Si se cocinó con alguien más (y quién abrió la sala). */
  enPareja: boolean;
  /** Quiénes cocinaron (solo, o los de la sala). */
  jugadores: JugadorCocina[];
  anfitrion: boolean;
  /** Rango antes y después del día (para celebrar si subió). */
  rangoAntes: number;
  rango: number;
  /** El lienzo de la cocina, por si la escena quiere dibujar encima. */
  raiz: HTMLElement;
}
