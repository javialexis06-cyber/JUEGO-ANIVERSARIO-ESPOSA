// El retrete espacial: lo que se guarda de cada uno (rollitos, mejoras, cosméticos, misiones y récords) y los
// catálogos de la tienda del retrete. Sin three.js: modelo.ts lo usa para normalizar la casa compartida.
import type { Rol } from '../modelo';

// ---------------------------------------------------------------------------
// Poderes que salen en el vuelo
// ---------------------------------------------------------------------------
export type IdPoder = 'escudo' | 'iman' | 'turbo' | 'lenta' | 'doble' | 'laser' | 'mini' | 'hormiga' | 'ambientador' | 'paca';
export const ID_PODERES: IdPoder[] = ['escudo', 'iman', 'turbo', 'lenta', 'doble', 'laser', 'mini', 'hormiga', 'ambientador', 'paca'];

export interface Poder {
  id: IdPoder;
  nombre: string;
  /** Lo que se grita al agarrarlo. */
  grito: string;
  color: string;
  /** Se gasta de una (no tiene duración). */
  instantaneo?: boolean;
  /** Hay que desbloquearlo en la tienda para que empiece a salir. */
  bloqueado?: boolean;
}

export const PODERES: Record<IdPoder, Poder> = {
  escudo: { id: 'escudo', nombre: 'Burbuja de jabón', grito: '¡Burbuja de jabón!', color: '#7FD8FF' },
  iman: { id: 'iman', nombre: 'Imán de rollitos', grito: '¡Imán de rollitos!', color: '#FF6B6B' },
  turbo: { id: 'turbo', nombre: 'Turbo de frijoles', grito: '¡TURBO DE FRIJOLES!', color: '#A3D65C' },
  lenta: { id: 'lenta', nombre: 'Cámara lenta', grito: 'Cáaamaaaraaa leeentaaa…', color: '#9CB8FF' },
  doble: { id: 'doble', nombre: 'Puntaje doble', grito: '¡Todo vale doble!', color: '#FFD23F' },
  laser: { id: 'laser', nombre: 'Desatascador láser', grito: '¡Desatascador láser!', color: '#FF4FA3', bloqueado: true },
  mini: { id: 'mini', nombre: 'Mini-retrete ayudante', grito: '¡Llegó el refuerzo!', color: '#8FE3C8', bloqueado: true },
  hormiga: { id: 'hormiga', nombre: 'Pastilla encogedora', grito: '¡Modo chiquitico!', color: '#F7A8D8', bloqueado: true },
  ambientador: { id: 'ambientador', nombre: 'Ambientador de lavanda', grito: '¡Pssssh! Aroma a lavanda', color: '#C3A6FF', instantaneo: true, bloqueado: true },
  paca: { id: 'paca', nombre: 'Paca de 12 rollos', grito: '¡Llovió papel!', color: '#FFE08A', instantaneo: true, bloqueado: true },
};

// ---------------------------------------------------------------------------
// Mejoras (permanentes, por niveles)
// ---------------------------------------------------------------------------
export type IdMejora =
  | IdPoder
  | 'fuerza_iman'
  | 'escudo_inicio'
  | 'revivir'
  | 'arranque'
  | 'suerte'
  | 'triple'
  | 'aero';

export interface Mejora {
  id: IdMejora;
  nombre: string;
  /** Archivo del ícono (iconos/cohete_<icono>.webp). */
  icono: string;
  /** Qué hace (corto). */
  texto: string;
  /** Lo que vale en cada nivel (el índice es el nivel; 0 = sin comprar). */
  valores: number[];
  /** Precio de cada nivel (el primero lleva al nivel 1). */
  precios: number[];
  /** Cómo se dice el valor de un nivel. */
  decir: (v: number) => string;
  grupo: 'poder' | 'vuelo';
}

const seg = (v: number) => `${v % 1 ? v.toFixed(1).replace('.', ',') : v} s`;
const dur = (id: IdPoder, nombre: string, icono: string, texto: string, valores: number[], precios: number[]): Mejora => ({
  id, nombre, icono, texto, valores, precios, decir: (v) => (v ? seg(v) : 'Bloqueado'), grupo: 'poder',
});

export const MEJORAS: Mejora[] = [
  dur('escudo', 'Burbuja de jabón', 'poder_escudo', 'Aguanta un golpe (y explota en espuma)', [8, 10, 12, 15, 18, 22], [120, 280, 550, 950, 1600]),
  dur('iman', 'Imán de rollitos', 'poder_iman', 'Jala los rollitos que pasan cerca', [8, 10, 12, 15, 18, 22], [100, 250, 500, 900, 1500]),
  dur('turbo', 'Turbo de frijoles', 'poder_turbo', 'Velocidad loca: atraviesa todo sin chocar', [3.5, 4.2, 5, 6, 7, 8.5], [150, 320, 650, 1100, 1800]),
  dur('lenta', 'Cámara lenta', 'poder_lenta', 'Todo va despacito… menos tú', [6, 7.5, 9, 11, 13, 15], [100, 250, 500, 900, 1500]),
  dur('doble', 'Puntaje doble', 'poder_doble', 'Rollitos y puntos valen el doble', [10, 13, 16, 20, 24, 30], [100, 250, 500, 900, 1500]),
  dur('laser', 'Desatascador láser', 'poder_laser', 'Dispara solo y destapa asteroides', [0, 6, 8, 10, 12, 15], [400, 300, 600, 1000, 1700]),
  dur('mini', 'Mini-retrete ayudante', 'poder_mini', 'Un retretico vuela contigo recogiendo rollitos', [0, 10, 13, 16, 20, 25], [350, 280, 550, 950, 1600]),
  dur('hormiga', 'Pastilla encogedora', 'poder_hormiga', 'Te vuelves chiquitico: cabes por cualquier hueco', [0, 7, 8.5, 10, 12, 15], [300, 250, 500, 900, 1500]),
  {
    id: 'ambientador', nombre: 'Ambientador de lavanda', icono: 'poder_ambientador', texto: 'Un pssssh que vuelve flores todo lo que hay en pantalla',
    valores: [0, 1], precios: [450], decir: (v) => (v ? 'Desbloqueado' : 'Bloqueado'), grupo: 'poder',
  },
  {
    id: 'paca', nombre: 'Paca de 12 rollos', icono: 'poder_paca', texto: 'Llueven rollitos por montones',
    valores: [0, 1], precios: [350], decir: (v) => (v ? 'Desbloqueada' : 'Bloqueada'), grupo: 'poder',
  },
  {
    id: 'fuerza_iman', nombre: 'Imán más fuerte', icono: 'poder_iman', texto: 'El imán alcanza más lejos',
    valores: [3, 3.8, 4.6, 5.5, 6.5, 8], precios: [150, 300, 600, 1000, 1600], decir: (v) => `alcance ${v.toFixed(1).replace('.', ',')} m`, grupo: 'vuelo',
  },
  {
    id: 'escudo_inicio', nombre: 'Burbuja de arranque', icono: 'icono_burbuja_inicio', texto: 'Sales del baño con la burbuja puesta',
    valores: [0, 6, 10, 15], precios: [300, 700, 1400], decir: (v) => (v ? seg(v) : 'Sin burbuja'), grupo: 'vuelo',
  },
  {
    id: 'revivir', nombre: 'Segunda oportunidad', icono: 'icono_revivir', texto: 'Al chocar, revives (una vez por vuelo)',
    valores: [0, 1, 1, 2], precios: [800, 1600, 3200],
    decir: (v) => (v === 0 ? 'Sin revivir' : v === 1 ? 'Revive 1 vez' : 'Revive 2 veces'), grupo: 'vuelo',
  },
  {
    id: 'arranque', nombre: 'Arranque con frijoles', icono: 'poder_turbo', texto: 'Sales disparado con turbo los primeros metros',
    valores: [0, 300, 600, 1000], precios: [400, 900, 1800], decir: (v) => (v ? `${v} m de turbo` : 'Sin turbo'), grupo: 'vuelo',
  },
  {
    id: 'suerte', nombre: 'Poderes más seguidos', icono: 'icono_suerte', texto: 'Salen poderes más a menudo',
    valores: [1, 0.88, 0.78, 0.68, 0.6, 0.52], precios: [150, 350, 700, 1200, 2000], decir: (v) => (v >= 1 ? 'Normal' : `+${Math.round((1 / v - 1) * 100)} %`), grupo: 'vuelo',
  },
  {
    id: 'triple', nombre: 'Papel triple hoja', icono: 'icono_triple', texto: 'Cada vuelo te deja más rollitos',
    valores: [0, 0.15, 0.3, 0.5], precios: [500, 1200, 2500], decir: (v) => (v ? `+${Math.round(v * 100)} % rollitos` : 'Hoja sencilla'), grupo: 'vuelo',
  },
  {
    id: 'aero', nombre: 'Taza aerodinámica', icono: 'icono_aero', texto: 'Rozas sin chocar: el retrete ocupa menos',
    valores: [1, 0.9, 0.82, 0.75], precios: [300, 800, 1600], decir: (v) => (v >= 1 ? 'De fábrica' : `−${Math.round((1 - v) * 100)} % de tamaño`), grupo: 'vuelo',
  },
];
export const MEJORA = Object.fromEntries(MEJORAS.map((m) => [m.id, m])) as Record<IdMejora, Mejora>;

// ---------------------------------------------------------------------------
// Cosméticos: retretes, estelas y cascos
// ---------------------------------------------------------------------------
export type TipoCosmetico = 'retrete' | 'estela' | 'casco';
export interface Cosmetico {
  id: string;
  nombre: string;
  texto: string;
  precio: number;
}

export const RETRETES: Cosmetico[] = [
  { id: 'porcelana', nombre: 'Porcelana de la casa', texto: 'El de siempre: blanquito y con fe', precio: 0 },
  { id: 'madera', nombre: 'Letrina de finca', texto: 'Tabla de madera, balde y tusa de repuesto', precio: 300 },
  { id: 'portatil', nombre: 'Baño portátil de concierto', texto: 'Azul, con lunita en la puerta', precio: 700 },
  { id: 'chiva', nombre: 'Retrete chiva', texto: 'Pintado como chiva de pueblo, con parrilla y todo', precio: 900 },
  { id: 'nave', nombre: 'Nave espacial', texto: 'Cromado, con aletas, ventanilla y antena', precio: 1200 },
  { id: 'princesa', nombre: 'Retrete de princesa', texto: 'Rosadito, con corazones y tiara', precio: 1200 },
  { id: 'gamer', nombre: 'Retrete gamer RGB', texto: 'Luces de colores y portavasos', precio: 1500 },
  { id: 'trono', nombre: 'Trono dorado', texto: 'Oro y terciopelo: digno de la realeza', precio: 2000 },
  { id: 'diamantes', nombre: 'Oro con diamantes', texto: 'Para ir al baño como millonario', precio: 3500 },
];
export const ESTELAS: Cosmetico[] = [
  { id: 'fuego', nombre: 'Fuego de cohete', texto: 'El clásico: candela y humito', precio: 0 },
  { id: 'frijoles', nombre: 'Nube de frijoles', texto: 'Verdecita y… aromática', precio: 250 },
  { id: 'burbujas', nombre: 'Burbujas de jabón', texto: 'Limpiecito hasta en el espacio', precio: 400 },
  { id: 'corazones', nombre: 'Corazones', texto: 'Para que sepan que vas enamorado', precio: 450 },
  { id: 'chispitas', nombre: 'Chispitas doradas', texto: 'Brillas por donde pasas', precio: 550 },
  { id: 'notas', nombre: 'Notas de cumbia', texto: 'Vas volando y bailando', precio: 600 },
  { id: 'confeti', nombre: 'Confeti tricolor', texto: 'Amarillo, azul y rojo: ¡Colombia en el espacio!', precio: 650 },
  { id: 'petalos', nombre: 'Pétalos de rosa', texto: 'Romántico hasta en el baño', precio: 800 },
  { id: 'arcoiris', nombre: 'Arcoíris', texto: 'Como gatito de internet', precio: 900 },
  { id: 'estrellas', nombre: 'Estrellitas fugaces', texto: 'Pide un deseo cuando pases', precio: 1100 },
];
export const CASCOS: Cosmetico[] = [
  { id: 'ninguno', nombre: 'Sin casco', texto: 'Al natural, con el pelo al viento', precio: 0 },
  { id: 'desatascador', nombre: 'Desatascador en la frente', texto: 'Se pegó y no hubo forma de quitarlo', precio: 250 },
  { id: 'ducha', nombre: 'Gorro de baño con patitos', texto: 'Para no mojarse el peinado', precio: 300 },
  { id: 'rollo', nombre: 'Sombrero de rollo', texto: 'Papel higiénico de gala', precio: 400 },
  { id: 'antenas', nombre: 'Antenas de marciano', texto: 'Para hacer amigos en Marte', precio: 450 },
  { id: 'aviador', nombre: 'Gorro de aviador', texto: 'Con gafas de piloto de verdad', precio: 700 },
  { id: 'vikingo', nombre: 'Casco vikingo', texto: 'Cuernos y barba de guerrero del baño', precio: 900 },
  { id: 'astronauta', nombre: 'Casco de astronauta', texto: 'Burbuja de vidrio: ya era hora', precio: 1100 },
  { id: 'galactica', nombre: 'Corona galáctica', texto: 'Planeticas y estrellas dándote vueltas', precio: 1600 },
];
export const COSMETICOS: Record<TipoCosmetico, Cosmetico[]> = { retrete: RETRETES, estela: ESTELAS, casco: CASCOS };
export const GRATIS: Record<TipoCosmetico, string> = { retrete: 'porcelana', estela: 'fuego', casco: 'ninguno' };

// ---------------------------------------------------------------------------
// Tramos del viaje (cada uno con su cielo, luz y música: escenario.ts)
// ---------------------------------------------------------------------------
export interface InfoTramo {
  id: string;
  nombre: string;
  /** Metros desde donde empieza. */
  desde: number;
}
export const TRAMOS: InfoTramo[] = [
  { id: 'cielo', nombre: 'El cielo del barrio', desde: 0 },
  { id: 'orbita', nombre: 'La órbita', desde: 450 },
  { id: 'luna', nombre: 'La Luna', desde: 1200 },
  { id: 'marte', nombre: 'Marte', desde: 2200 },
  { id: 'cinturon', nombre: 'El cinturón de asteroides', desde: 3400 },
  { id: 'nebulosa', nombre: 'La nebulosa', desde: 4800 },
  { id: 'amor', nombre: 'La galaxia del amor', desde: 6500 },
];
export const tramoDe = (m: number) => {
  let i = 0;
  while (i + 1 < TRAMOS.length && m >= TRAMOS[i + 1].desde) i++;
  return i;
};

// ---------------------------------------------------------------------------
// Misiones (de a tres): al completar las tres sube el multiplicador del puntaje
// ---------------------------------------------------------------------------
export type TipoMision =
  | 'rollitos_vuelo'
  | 'rollitos_total'
  | 'metros_vuelo'
  | 'casi_vuelo'
  | 'turbos_vuelo'
  | 'poderes_vuelo'
  | 'laser_total'
  | 'escudos_total'
  | 'cometas_total'
  | 'tramo_vuelo'
  | 'figuras_vuelo'
  | 'corazon_vuelo'
  | 'compras_total'
  | 'sinpoder_vuelo'
  | 'ovnis_total'
  | 'chanclas_total'
  | 'puntaje_vuelo'
  | 'lluvias_total'
  | 'agujeros_total'
  | 'destruidos_total';

/** Lo que se cuenta en un vuelo (y que las misiones miran). */
export interface Cuentas {
  rollitos: number;
  metros: number;
  casi: number;
  turbos: number;
  poderes: number;
  laser: number;
  escudos: number;
  cometas: number;
  tramo: number;
  figuras: number;
  corazon: number;
  compras: number;
  sinpoder: number;
  ovnis: number;
  chanclas: number;
  puntaje: number;
  lluvias: number;
  agujeros: number;
  destruidos: number;
}
export const cuentasNuevas = (): Cuentas => ({
  rollitos: 0, metros: 0, casi: 0, turbos: 0, poderes: 0, laser: 0, escudos: 0, cometas: 0, tramo: 0, figuras: 0, corazon: 0, compras: 0,
  sinpoder: 0, ovnis: 0, chanclas: 0, puntaje: 0, lluvias: 0, agujeros: 0, destruidos: 0,
});

interface DefMision {
  tipo: TipoMision;
  cuenta: keyof Cuentas;
  /** En un solo vuelo (si no, se va sumando entre vuelos). */
  vuelo: boolean;
  meta: (n: number) => number;
  texto: (meta: number) => string;
  /** Desde qué nivel de misiones sale. */
  desde?: number;
  /** Solo si ya tiene lo que la misión necesita. */
  requiere?: (p: ProgresoCohete) => boolean;
}

const mil = (v: number) => v.toLocaleString('es-CO');
const tope = (v: number, max: number) => Math.min(max, Math.round(v));
const DEF_MISIONES: DefMision[] = [
  { tipo: 'rollitos_vuelo', cuenta: 'rollitos', vuelo: true, meta: (n) => tope(40 + 18 * n, 600), texto: (m) => `Recoge ${mil(m)} rollitos en un vuelo` },
  { tipo: 'rollitos_total', cuenta: 'rollitos', vuelo: false, meta: (n) => tope(150 + 90 * n, 3000), texto: (m) => `Recoge ${mil(m)} rollitos en total` },
  { tipo: 'metros_vuelo', cuenta: 'metros', vuelo: true, meta: (n) => tope(350 + 180 * n, 7000), texto: (m) => `Vuela ${mil(m)} m sin estrellarte` },
  { tipo: 'casi_vuelo', cuenta: 'casi', vuelo: true, meta: (n) => tope(3 + n * 0.7, 25), texto: (m) => (m === 1 ? 'Esquiva algo por un pelito' : `Esquiva ${m} cosas por un pelito en un vuelo`) },
  { tipo: 'turbos_vuelo', cuenta: 'turbos', vuelo: true, meta: (n) => tope(1 + n / 5, 4), texto: (m) => (m === 1 ? 'Usa un turbo de frijoles' : `Usa ${m} turbos de frijoles en un vuelo`) },
  { tipo: 'poderes_vuelo', cuenta: 'poderes', vuelo: true, meta: (n) => tope(2 + n / 3, 10), texto: (m) => (m === 1 ? 'Agarra un poder en un vuelo' : `Agarra ${m} poderes en un vuelo`) },
  { tipo: 'laser_total', cuenta: 'laser', vuelo: false, meta: (n) => tope(6 + 2 * n, 60), texto: (m) => `Destapa ${m} asteroides con el desatascador`, requiere: (p) => nivelDe(p, 'laser') > 0 },
  { tipo: 'escudos_total', cuenta: 'escudos', vuelo: false, meta: (n) => tope(2 + n / 3, 10), texto: (m) => `Revienta ${m} burbujas de jabón chocando` },
  { tipo: 'cometas_total', cuenta: 'cometas', vuelo: false, meta: (n) => tope(3 + n / 2, 15), texto: (m) => `Esquiva ${m} cometas`, desde: 2 },
  { tipo: 'tramo_vuelo', cuenta: 'tramo', vuelo: true, meta: (n) => Math.min(TRAMOS.length - 1, 1 + Math.floor(n / 3)), texto: (m) => `Llega hasta ${TRAMOS[m]?.nombre.replace(/^(El|La) /, (x) => x.toLowerCase()) ?? 'lejos'}` },
  { tipo: 'figuras_vuelo', cuenta: 'figuras', vuelo: true, meta: (n) => tope(1 + n / 4, 6), texto: (m) => (m === 1 ? 'Recoge una figura de rollitos completa' : `Recoge ${m} figuras de rollitos completas`) },
  { tipo: 'corazon_vuelo', cuenta: 'corazon', vuelo: true, meta: () => 1, texto: () => 'Recoge completico un corazón de rollitos' },
  { tipo: 'compras_total', cuenta: 'compras', vuelo: false, meta: (n) => tope(1 + n / 6, 3), texto: (m) => (m === 1 ? 'Compra algo en la tienda del retrete' : `Compra ${m} cosas en la tienda del retrete`) },
  { tipo: 'sinpoder_vuelo', cuenta: 'sinpoder', vuelo: true, meta: (n) => tope(300 + 90 * n, 3000), texto: (m) => `Vuela ${mil(m)} m sin agarrar ningún poder`, desde: 1 },
  { tipo: 'ovnis_total', cuenta: 'ovnis', vuelo: false, meta: (n) => tope(1 + n / 4, 8), texto: (m) => (m === 1 ? 'Tumba un ovni (con turbo o con láser)' : `Tumba ${m} ovnis (con turbo o con láser)`), desde: 3 },
  { tipo: 'chanclas_total', cuenta: 'chanclas', vuelo: false, meta: (n) => tope(3 + n / 2, 15), texto: (m) => `Esquiva ${m} chanclas voladoras` },
  { tipo: 'puntaje_vuelo', cuenta: 'puntaje', vuelo: true, meta: (n) => tope(1500 * (n + 1), 150000), texto: (m) => `Haz ${mil(m)} puntos en un vuelo` },
  { tipo: 'lluvias_total', cuenta: 'lluvias', vuelo: false, meta: (n) => tope(1 + n / 5, 5), texto: (m) => (m === 1 ? 'Sobrevive a una lluvia de meteoritos' : `Sobrevive a ${m} lluvias de meteoritos`), desde: 4 },
  { tipo: 'agujeros_total', cuenta: 'agujeros', vuelo: false, meta: (n) => tope(1 + n / 6, 4), texto: (m) => (m === 1 ? 'Escápate de un agujero negro' : `Escápate de ${m} agujeros negros`), desde: 6 },
  { tipo: 'destruidos_total', cuenta: 'destruidos', vuelo: false, meta: (n) => tope(10 + 4 * n, 120), texto: (m) => `Destruye ${m} cosas con turbo, láser o ambientador`, desde: 1 },
];
const DEF = Object.fromEntries(DEF_MISIONES.map((d) => [d.tipo, d])) as Record<TipoMision, DefMision>;

export interface Mision {
  tipo: TipoMision;
  meta: number;
  /** Lo logrado (en las de un vuelo: lo mejor de un vuelo). */
  avance: number;
  hecha: boolean;
}

export const textoMision = (m: Mision) => DEF[m.tipo]?.texto(m.meta) ?? '';
export const esDeVuelo = (m: Mision) => !!DEF[m.tipo]?.vuelo;
/** Rollitos que da cada misión y el cofre de completar las tres. */
export const premioMision = (nivel: number) => Math.min(600, 60 + 25 * nivel);
export const premioNivel = (nivel: number) => Math.min(2000, 150 + 70 * nivel);
export const MAX_NIVEL = 30;

/** Tres misiones nuevas para el nivel (distintas y que se puedan hacer con lo que tiene). */
export function nuevasMisiones(p: ProgresoCohete, azar = Math.random): Mision[] {
  const n = p.nivel;
  const posibles = DEF_MISIONES.filter((d) => (d.desde ?? 0) <= n && (!d.requiere || d.requiere(p)));
  const out: Mision[] = [];
  const usadas = new Set<keyof Cuentas>();
  while (out.length < 3 && posibles.length) {
    const i = Math.floor(azar() * posibles.length);
    const d = posibles.splice(i, 1)[0];
    // Dos misiones que cuentan lo mismo (rollitos en un vuelo y en total) se estorban: una sola
    if (usadas.has(d.cuenta)) continue;
    usadas.add(d.cuenta);
    out.push({ tipo: d.tipo, meta: Math.max(1, d.meta(n)), avance: 0, hecha: false });
  }
  return out;
}

/** El valor de una misión con lo de este vuelo (las de total suman a lo que ya tenía). */
export function valorMision(m: Mision, c: Cuentas, alEmpezar: number) {
  const d = DEF[m.tipo];
  if (!d) return 0;
  const v = c[d.cuenta];
  return d.vuelo ? Math.max(alEmpezar, v) : alEmpezar + v;
}

// ---------------------------------------------------------------------------
// Progreso de cada uno
// ---------------------------------------------------------------------------
export interface ProgresoCohete {
  /** Saldo para la tienda del retrete. */
  rollitos: number;
  /** Todos los que ha recogido en la vida. */
  ganados: number;
  mejoras: Partial<Record<IdMejora, number>>;
  /** Cosméticos comprados («retrete:chiva», «estela:corazones», «casco:vikingo»). */
  tengo: string[];
  puesto: Record<TipoCosmetico, string>;
  /** Juegos de misiones completados: el multiplicador es 1 + nivel. */
  nivel: number;
  misiones: Mision[];
  /** Mejor distancia (m) y mejor puntaje de un vuelo. */
  mejor: number;
  mejorPuntaje: number;
  vuelos: number;
}

export function progresoNuevo(): ProgresoCohete {
  const p: ProgresoCohete = {
    rollitos: 0, ganados: 0, mejoras: {}, tengo: [], puesto: { ...GRATIS }, nivel: 0, misiones: [], mejor: 0, mejorPuntaje: 0, vuelos: 0,
  };
  // Las primeras son fáciles y siempre las mismas: se aprende jugando
  p.misiones = [
    { tipo: 'rollitos_vuelo', meta: 30, avance: 0, hecha: false },
    { tipo: 'metros_vuelo', meta: 300, avance: 0, hecha: false },
    { tipo: 'poderes_vuelo', meta: 1, avance: 0, hecha: false },
  ];
  return p;
}

const num = (v: unknown, d: number, min = 0, max = 1e9) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, Math.floor(v))) : d);
const esObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Progreso confiable aunque venga dañado, viejo o de otra versión. */
export function normalizarCohete(p: unknown): ProgresoCohete {
  const b = progresoNuevo();
  if (!esObj(p)) return b;
  const mejoras: Partial<Record<IdMejora, number>> = {};
  if (esObj(p.mejoras)) {
    for (const m of MEJORAS) {
      const v = num(p.mejoras[m.id], 0, 0, m.precios.length);
      if (v > 0) mejoras[m.id] = v;
    }
  }
  const validos = new Set<string>(Object.entries(COSMETICOS).flatMap(([t, l]) => l.map((c) => `${t}:${c.id}`)));
  const tengo = Array.isArray(p.tengo) ? [...new Set(p.tengo.filter((x: unknown): x is string => typeof x === 'string' && validos.has(x)))] : [];
  const puesto = { ...GRATIS };
  if (esObj(p.puesto)) {
    for (const t of Object.keys(GRATIS) as TipoCosmetico[]) {
      const v = p.puesto[t];
      if (typeof v === 'string' && (v === GRATIS[t] || tengo.includes(`${t}:${v}`))) puesto[t] = v;
    }
  }
  const misiones: Mision[] = Array.isArray(p.misiones)
    ? p.misiones
        .filter((m: unknown) => esObj(m) && typeof m.tipo === 'string' && m.tipo in DEF)
        .slice(0, 3)
        .map((m: any) => ({ tipo: m.tipo as TipoMision, meta: num(m.meta, 1, 1, 1e7), avance: num(m.avance, 0, 0, 1e9), hecha: !!m.hecha }))
    : [];
  return {
    rollitos: num(p.rollitos, 0, 0, 1e8),
    ganados: num(p.ganados, 0, 0, 1e9),
    mejoras,
    tengo,
    puesto,
    nivel: num(p.nivel, 0, 0, MAX_NIVEL),
    misiones: misiones.length === 3 ? misiones : b.misiones,
    mejor: num(p.mejor, 0, 0, 1e7),
    mejorPuntaje: num(p.mejorPuntaje, 0, 0, 1e9),
    vuelos: num(p.vuelos, 0, 0, 1e6),
  };
}

export const copiaProgreso = (p: ProgresoCohete): ProgresoCohete => normalizarCohete(JSON.parse(JSON.stringify(p)));

export const nivelDe = (p: ProgresoCohete, id: IdMejora) => p.mejoras[id] ?? 0;
export const valorDe = (p: ProgresoCohete, id: IdMejora) => {
  const m = MEJORA[id];
  return m.valores[Math.min(nivelDe(p, id), m.valores.length - 1)];
};
/** Lo que dura un poder con las mejoras compradas (0: bloqueado). */
export const duracionPoder = (p: ProgresoCohete, id: IdPoder) => valorDe(p, id);
export const poderDisponible = (p: ProgresoCohete, id: IdPoder) => !PODERES[id].bloqueado || nivelDe(p, id) > 0;
export const multiplicador = (p: ProgresoCohete) => 1 + Math.min(MAX_NIVEL, p.nivel);
export const precioMejora = (p: ProgresoCohete, id: IdMejora): number | null => MEJORA[id].precios[nivelDe(p, id)] ?? null;
export const tieneCosmetico = (p: ProgresoCohete, t: TipoCosmetico, id: string) => id === GRATIS[t] || p.tengo.includes(`${t}:${id}`);

/** Compra el siguiente nivel de una mejora o un cosmético (devuelve false si no alcanza o ya lo tiene). */
export function comprar(p: ProgresoCohete, que: { mejora: IdMejora } | { tipo: TipoCosmetico; id: string }): boolean {
  if ('mejora' in que) {
    const precio = precioMejora(p, que.mejora);
    if (precio === null || p.rollitos < precio) return false;
    p.rollitos -= precio;
    p.mejoras[que.mejora] = nivelDe(p, que.mejora) + 1;
  } else {
    const c = COSMETICOS[que.tipo].find((x) => x.id === que.id);
    if (!c || tieneCosmetico(p, que.tipo, que.id) || p.rollitos < c.precio) return false;
    p.rollitos -= c.precio;
    p.tengo.push(`${que.tipo}:${que.id}`);
    p.puesto[que.tipo] = que.id;
  }
  // La compra cuenta para las misiones de la tienda
  for (const m of p.misiones) if (!m.hecha && m.tipo === 'compras_total') m.avance++;
  return true;
}

/** Lo que pasó con las misiones al terminar o durante el vuelo. */
export interface AvanceMisiones {
  /** Misiones que se acaban de cumplir (con su premio ya sumado al saldo). */
  cumplidas: { texto: string; premio: number }[];
  /** Si con eso se completaron las tres: el nivel nuevo y el cofre. */
  subio?: { nivel: number; premio: number };
}

/**
 * Revisa las misiones con lo de este vuelo: las cumplidas pagan su premio y quedan hechas. `inicio` es el avance de
 * cada misión al empezar el vuelo. Si `cerrar`, se guarda el avance (fin del vuelo) y, si las tres están hechas,
 * se sube de nivel y llegan tres misiones nuevas.
 */
export function revisarMisiones(p: ProgresoCohete, c: Cuentas, inicio: number[], cerrar: boolean): AvanceMisiones {
  const r: AvanceMisiones = { cumplidas: [] };
  p.misiones.forEach((m, i) => {
    if (m.hecha) return;
    const v = valorMision(m, c, inicio[i] ?? m.avance);
    if (cerrar || v >= m.meta) m.avance = Math.min(v, m.meta);
    if (v >= m.meta) {
      m.hecha = true;
      const premio = premioMision(p.nivel);
      p.rollitos += premio;
      r.cumplidas.push({ texto: textoMision(m), premio });
    }
  });
  if (cerrar) r.subio = subirNivel(p);
  return r;
}

/** Con las tres misiones hechas: un nivel más (multiplicador) y tres misiones nuevas. */
export function subirNivel(p: ProgresoCohete, azar = Math.random): { nivel: number; premio: number } | undefined {
  if (!p.misiones.length || !p.misiones.every((m) => m.hecha)) return undefined;
  const premio = premioNivel(p.nivel);
  p.rollitos += premio;
  p.nivel = Math.min(MAX_NIVEL, p.nivel + 1);
  p.misiones = nuevasMisiones(p, azar);
  return { nivel: p.nivel, premio };
}

/**
 * Los récords viejos (segundos, de antes de los poderes) en metros: 15 s, 45 s y 90 s eran bronce, plata y oro, y
 * quedan en 500, 2000 y 5000 m (los mismos metales de ahora).
 */
export function segundosAMetros(s: number) {
  const t: [number, number][] = [[0, 0], [15, 500], [45, 2000], [90, 5000]];
  for (let i = 1; i < t.length; i++) if (s <= t[i][0]) return Math.floor(t[i - 1][1] + ((s - t[i - 1][0]) / (t[i][0] - t[i - 1][0])) * (t[i][1] - t[i - 1][1]));
  return Math.floor(5000 + (s - 90) * 60);
}

/** Récord para el trofeo: la mejor distancia (con los récords viejos en segundos pasados a metros). */
export function mejorDistancia(cohete: Partial<Record<Rol, ProgresoCohete>> | undefined, segundos: Partial<Record<Rol, number>> | undefined, r: Rol) {
  return Math.max(cohete?.[r]?.mejor ?? 0, segundosAMetros(Math.max(0, segundos?.[r] ?? 0)));
}

/**
 * ¿Ya descubrió el retrete espacial? (la primera vez hay que comerse la leche o el picante; después vuela cada vez que
 * se sienta en el inodoro). Quien ya tenga récord, vuelos o compras del retrete cuenta como que ya lo descubrió.
 */
export function yaDescubrio(
  c: { cohete?: Partial<Record<Rol, ProgresoCohete>>; retrete?: Partial<Record<Rol, number>>; coheteVisto?: Partial<Record<Rol, number>> },
  r: Rol,
) {
  const p = c.cohete?.[r];
  return !!c.coheteVisto?.[r] || (c.retrete?.[r] ?? 0) > 0 || !!p && (p.vuelos > 0 || p.mejor > 0 || p.ganados > 0 || p.tengo.length > 0);
}

/** Monedas de la casa que da el retrete por persona y por día (volver a volar no es una mina de oro). */
export const TOPE_MONEDAS_DIA = 6;
/** Monedas de la casa por un vuelo: 1 cada 15 s, hasta 3. */
export const monedasVuelo = (segundos: number) => Math.max(0, Math.min(3, Math.floor(segundos / 15)));
