// Lo que se compra en la tienda de la casa: comida, regalos y decoración.
import type { Necesidad } from './modelo';

export type TipoItem = 'comida' | 'regalo' | 'deco';
/** Dónde va una decoración: en la pared, en el piso, sobre una mesa o en el sofá/la cama. */
export type TipoSitio = 'cuadro' | 'piso' | 'mesa' | 'peluche';

export interface Item {
  id: string;
  nombre: string;
  tipo: TipoItem;
  precio: number;
  /** Cuánto sube cada necesidad (comida y regalos). */
  efecto?: Partial<Record<Necesidad, number>>;
  /** Producto del súper (productos.glb) o archivo .glb propio. */
  producto?: string;
  modelo?: string;
  sitio?: TipoSitio;
  texto?: string;
}

const comida = (id: string, nombre: string, precio: number, hambre: number, extra: Partial<Record<Necesidad, number>> = {}): Item =>
  ({ id, nombre, tipo: 'comida', precio, producto: id, efecto: { hambre, ...extra } });

export const CATALOGO: Item[] = [
  comida('manzana', 'Manzana', 3, 8),
  comida('banano', 'Banano', 3, 8),
  comida('uvas', 'Uvas', 4, 10),
  comida('pan', 'Pan', 5, 15),
  comida('croissant', 'Croissant', 6, 16),
  comida('galletas', 'Galletas', 5, 10, { carino: 2 }),
  comida('yogur', 'Yogur', 5, 10),
  comida('queso', 'Queso', 7, 12),
  comida('arepa', 'Arepa', 8, 22),
  comida('wafle', 'Wafle', 10, 20, { carino: 3 }),
  comida('helado', 'Helado', 8, 12, { carino: 4, energia: 2 }),
  comida('pizza', 'Pizza', 15, 35),
  comida('torta', 'Torta', 18, 25, { carino: 6 }),
  comida('jugo', 'Jugo', 4, 6, { energia: 3 }),
  comida('cafe', 'Café', 5, 4, { energia: 12 }),
  { id: 'carta', nombre: 'Carta de amor', tipo: 'regalo', precio: 5, modelo: 'regalo_carta', efecto: { carino: 15 }, texto: 'Con un mensaje tuyo' },
  { id: 'flores', nombre: 'Ramo de flores', tipo: 'regalo', precio: 25, modelo: 'regalo_flores', efecto: { carino: 30 }, texto: 'Después se puede poner en un florero' },
  { id: 'chocolates', nombre: 'Chocolates', tipo: 'regalo', precio: 20, modelo: 'regalo_chocolates', efecto: { carino: 25, hambre: 8 } },
  { id: 'cajita', nombre: 'Cajita sorpresa', tipo: 'regalo', precio: 15, modelo: 'regalo_cajita', efecto: { carino: 20 }, texto: 'Trae una comida al azar adentro' },
  { id: 'osito', nombre: 'Osito de peluche', tipo: 'regalo', precio: 40, modelo: 'deco_osito', efecto: { carino: 40 }, sitio: 'peluche',
    texto: 'Se queda en la casa como decoración' },
  { id: 'cuadro_corazon', nombre: 'Cuadro de corazón', tipo: 'deco', precio: 30, modelo: 'deco_cuadro_corazon', sitio: 'cuadro' },
  { id: 'cuadro_paisaje', nombre: 'Cuadro de montañas', tipo: 'deco', precio: 35, modelo: 'deco_cuadro_paisaje', sitio: 'cuadro' },
  { id: 'cuadro_foto', nombre: 'Marco para una foto', tipo: 'deco', precio: 20, modelo: 'deco_cuadro_foto', sitio: 'cuadro',
    texto: 'Muestra una foto del álbum' },
  { id: 'planta', nombre: 'Matera con flores', tipo: 'deco', precio: 25, modelo: 'planta', sitio: 'piso' },
  { id: 'cactus', nombre: 'Cactus', tipo: 'deco', precio: 20, modelo: 'deco_cactus', sitio: 'piso' },
  { id: 'lampara', nombre: 'Lámpara de pie', tipo: 'deco', precio: 45, modelo: 'deco_lampara', sitio: 'piso' },
  { id: 'globos', nombre: 'Globos', tipo: 'deco', precio: 30, modelo: 'globos', sitio: 'piso' },
  { id: 'osito_deco', nombre: 'Osito de peluche', tipo: 'deco', precio: 40, modelo: 'deco_osito', sitio: 'peluche' },
  { id: 'florero', nombre: 'Florero', tipo: 'deco', precio: 25, modelo: 'deco_florero', sitio: 'mesa' },
  { id: 'velas', nombre: 'Velas', tipo: 'deco', precio: 20, modelo: 'deco_velas', sitio: 'mesa' },
];

export const ITEM: Record<string, Item> = Object.fromEntries(CATALOGO.map((i) => [i.id, i]));

/** Qué objetos sirven para un tipo de sitio (incluye regalos que se quedan como decoración). */
export const paraSitio = (t: TipoSitio) => CATALOGO.filter((i) => i.sitio === t && i.tipo === 'deco');

/** Premios de cariño: la primera caricia, abrazo y beso de cada día dan monedas. */
export const PREMIO_CARINO: Record<string, number> = { caricia: 5, abrazo: 8, beso: 10 };
export const EFECTO_CARINO: Record<string, { mio: number; suyo: number }> = {
  caricia: { mio: 4, suyo: 10 },
  abrazo: { mio: 15, suyo: 15 },
  beso: { mio: 20, suyo: 20 },
};
export const BONO_DIARIO = 20;
/** Del sueldo del súper pasa a la casa un tercio de lo ganado en el día. */
export const SUELDO_FRACCION = 1 / 3;
