// Lo que se compra en la tienda de la casa: comida, regalos y decoración.
import type { Necesidad, Ranura, Rol } from './modelo';
import ropaDatos from './ropa.json';

export type TipoItem = 'comida' | 'regalo' | 'deco' | 'ropa' | 'disfraz';
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
  /** Ropa: dónde va, qué otras ranuras ocupa (un vestido: arriba y abajo) y a quién le queda. */
  ranura?: Ranura;
  tambien?: Ranura[];
  para?: Rol[];
  /** Colores de la variante por papel del material («principal», «detalle»...). */
  colores?: Record<string, string>;
  /** Otras partes de fábrica que tapa (p. ej. «medias» con sandalias). */
  oculta?: string[];
  /** Disfraz: las prendas que trae para cada uno (se compran juntas y se ponen de una). */
  piezas?: Partial<Record<Rol, string[]>>;
  /** Tinte de pelo: el color que pone. */
  tinte?: string;
}

const comida = (id: string, nombre: string, precio: number, hambre: number, extra: Partial<Record<Necesidad, number>> = {}): Item =>
  ({ id, nombre, tipo: 'comida', precio, producto: id, efecto: { hambre, ...extra } });
const plato = (id: string, nombre: string, precio: number, hambre: number, extra: Partial<Record<Necesidad, number>> = {}): Item =>
  ({ id, nombre, tipo: 'comida', precio, modelo: `comida_${id}`, efecto: { hambre, ...extra } });
const deco = (id: string, nombre: string, precio: number, sitio: TipoSitio, texto?: string): Item =>
  ({ id, nombre, tipo: 'deco', precio, modelo: `deco_${id}`, sitio, ...(texto ? { texto } : {}) });

/** Ropa, peinados y accesorios: los arma personajes/blender/ropa.py (modelo = ropa/<modelo>_<rol>.glb). */
interface DatoRopa {
  id: string;
  nombre: string;
  precio: number;
  modelo: string;
  ranura: Ranura;
  tambien: Ranura[];
  oculta: string[];
  colores: Record<string, string>;
  para: Rol[];
  orden: number;
}
const ROPA: Item[] = (ropaDatos as unknown as DatoRopa[])
  .slice()
  .sort((a, b) => a.orden - b.orden)
  .map((r) => ({
    id: r.id, nombre: r.nombre, tipo: 'ropa', precio: r.precio, modelo: r.modelo, ranura: r.ranura, para: r.para,
    ...(r.tambien.length ? { tambien: r.tambien } : {}), ...(r.oculta.length ? { oculta: r.oculta } : {}),
    ...(Object.keys(r.colores).length ? { colores: r.colores } : {}),
  }));

/** Tintes: cambian el color del pelo (de fábrica o comprado); se compran una vez y sirven para los dos. */
const tinte = (id: string, nombre: string, color: string): Item => ({ id: `tinte_${id}`, nombre, tipo: 'ropa', precio: 20, tinte: color });
export const TINTES: Item[] = [
  tinte('castano', 'Tinte castaño', '#6B4A33'), tinte('chocolate', 'Tinte chocolate', '#4A2E22'), tinte('rubio', 'Tinte rubio', '#E3C27A'),
  tinte('pelirrojo', 'Tinte pelirrojo', '#B5502E'), tinte('caoba', 'Tinte caoba', '#7A2E2E'), tinte('rosado', 'Tinte rosado', '#F29BB8'),
  tinte('lila', 'Tinte lila', '#B69AE0'), tinte('azul', 'Tinte azul', '#5B8FD9'), tinte('menta', 'Tinte verde menta', '#7FD6B9'),
  tinte('plateado', 'Tinte plateado', '#CFCFD6'), tinte('morado', 'Tinte morado', '#6E3FA8'),
];

/** Disfraces para los dos: traen todas sus piezas (algunas distintas para Él y para Ella). */
const ambos = (...piezas: string[]) => ({ el: piezas, ella: piezas });
const disfraz = (id: string, nombre: string, piezas: Partial<Record<Rol, string[]>>, texto: string): Item => ({
  id: `disfraz_${id}`, nombre, tipo: 'disfraz', precio: 0, piezas, texto,
});
const DISFRACES: Item[] = [
  disfraz('gatitos', 'Pareja de gatitos', ambos('orejas_gato', 'cola_gato', 'bigotes_gato'), 'Orejitas, cola y bigotes para los dos'),
  disfraz('conejitos', 'Pareja de conejitos', ambos('orejas_conejo', 'cola_conejo', 'pantuflas_conejo'), 'Orejas largas, colita y pantuflas'),
  disfraz('ositos', 'Pareja de ositos', ambos('pijama_oso', 'capucha_oso', 'cola_oso', 'pantuflas_oso'), 'Pijama enteriza con capucha de osito'),
  disfraz('pandas', 'Pareja de pandas', ambos('pijama_panda', 'capucha_panda', 'cola_panda', 'pantuflas_panda'), 'Pijama y capucha de panda'),
  disfraz('dinos', 'Pareja de dinosaurios', ambos('pijama_dino', 'capucha_dino', 'cola_dino'), 'Pijama con púas, capucha con ojos y cola'),
  disfraz('unicornios', 'Pareja de unicornios', ambos('pijama_unicornio', 'capucha_unicornio', 'alas_hada'), 'Pijama lila, capucha y alitas'),
  disfraz('heroes', 'Súper héroes', { el: ['camiseta_heroe', 'capa_roja', 'antifaz_rojo'], ella: ['camiseta_heroe_azul', 'capa_azul', 'antifaz_azul'] },
    'Camiseta con estrella, capa y antifaz'),
  disfraz('piratas', 'Piratas', ambos('sombrero_pirata', 'parche', 'camiseta_rayas_roja', 'botas_negras'), 'Sombrero, parche, rayas y botas'),
  disfraz('magos', 'Brujita y brujo', { el: ['sombrero_bruja_negro', 'capa_negra'], ella: ['sombrero_bruja', 'capa_morada'] }, 'Sombrero de punta y capa'),
  disfraz('angel_diablo', 'Angelito y diablito', { el: ['cuernos', 'cola_diablo', 'alas_diablito'], ella: ['aureola', 'alas_angel', 'vestido_novia'] },
    'Él de diablito y Ella de angelito'),
  disfraz('abejitas', 'Abejitas', ambos('antenas_abeja', 'alas_abeja', 'camiseta_abeja'), 'Antenas, alitas y rayas'),
  disfraz('chefs', 'Chefs', ambos('gorro_chef', 'chaqueta_chef'), 'Gorro y chaqueta de chef'),
  disfraz('novios', 'Novios', { el: ['saco_novio', 'sombrero_copa', 'zapatos_negros'], ella: ['vestido_novia', 'velo_novia', 'tacones_dorados'] },
    'Saco con corbatín y vestido con velo'),
  disfraz('realeza', 'Rey y reina', { el: ['corona', 'saco_principe', 'capa_roja'], ella: ['tiara', 'vestido_princesa', 'tacones_rosados'] },
    'Corona, capa y vestido de princesa'),
  disfraz('vaqueros', 'Vaqueros', ambos('sombrero_vaquero', 'botas_vaqueras', 'camisa_lenador'), 'Sombrero, botas y camisa de cuadros'),
  disfraz('futbol', 'Hinchas de la selección', ambos('camiseta_tricolor', 'short_azul', 'tenis_blancos'), 'Camiseta amarilla, short y tenis'),
  disfraz('navidad', 'Navidad', { el: ['gorro_navidad', 'sueter_navidad'], ella: ['gorro_navidad_verde', 'sueter_navidad_verde'] }, 'Gorros y suéteres navideños'),
  disfraz('astronautas', 'Astronautas', ambos('traje_astronauta', 'botas_blancas'), 'Traje espacial y botas blancas'),
  disfraz('payasos', 'Payasitos', ambos('nariz_payaso', 'pelo_afro', 'gorro_fiesta'), 'Nariz roja, pelo loco y gorrito'),
  disfraz('medicos', 'Doctores', ambos('bata_medico', 'gafas_redondas'), 'Bata con fonendoscopio y gafas'),
  disfraz('hawaianos', 'Vacaciones en la playa', ambos('camisa_hawaiana', 'bermuda_caqui', 'sandalias_cafe', 'gafas_sol'), 'Camisa de flores, bermuda y sandalias'),
];

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
  // Nuevas (modelo propio comida_<id>.glb)
  plato('empanada', 'Empanada con ají', 5, 14),
  plato('bunuelos', 'Buñuelos', 6, 14, { carino: 2 }),
  plato('pandebono', 'Pandebonos', 6, 14),
  plato('arepa_queso', 'Arepa con queso', 7, 20),
  plato('bandeja_paisa', 'Bandeja paisa', 22, 50, { energia: 5 }),
  plato('ajiaco', 'Ajiaco', 16, 38, { energia: 3 }),
  plato('tamal', 'Tamal', 12, 32),
  plato('obleas', 'Obleas con arequipe', 5, 10, { carino: 4 }),
  plato('cholado', 'Cholado', 8, 12, { energia: 4, carino: 2 }),
  plato('mango_biche', 'Mango biche con sal', 4, 8, { energia: 2 }),
  plato('mazorca', 'Mazorca asada', 5, 14),
  plato('churros', 'Churros', 6, 14, { carino: 2 }),
  plato('arroz_leche', 'Arroz con leche', 7, 14, { carino: 3 }),
  plato('perro', 'Perro caliente', 10, 26),
  plato('hamburguesa', 'Hamburguesa', 14, 34),
  plato('salchipapa', 'Salchipapa', 10, 26),
  plato('sushi', 'Sushi', 16, 24, { carino: 4 }),
  plato('tacos', 'Tacos', 12, 26),
  plato('fresas_crema', 'Fresas con crema', 9, 12, { carino: 6 }),
  plato('brownie', 'Brownie con helado', 9, 14, { carino: 4 }),
  plato('dona', 'Dona rosada', 6, 12, { carino: 3 }),
  plato('cupcake', 'Cupcake', 7, 12, { carino: 5 }),
  plato('flan', 'Flan de caramelo', 7, 12, { carino: 4 }),
  plato('galletas_corazon', 'Galletas de corazón', 6, 8, { carino: 7 }),
  plato('chocolate', 'Chocolate con queso', 6, 8, { energia: 8, carino: 4 }),
  plato('te', 'Té caliente', 4, 2, { energia: 8 }),
  plato('limonada', 'Limonada', 4, 4, { energia: 6 }),
  plato('malteada', 'Malteada de fresa', 8, 10, { energia: 4, carino: 4 }),
  plato('palomitas', 'Palomitas', 5, 10, { carino: 3 }),
  plato('sandia', 'Tajada de sandía', 4, 8, { energia: 3 }),
  plato('ensalada_frutas', 'Ensalada de frutas', 9, 18, { energia: 4 }),
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
  // Pared
  deco('cuadro_mapa', 'Mapa Medellín–Bucaramanga', 45, 'cuadro', 'Con un camino de corazones entre las dos ciudades'),
  deco('cuadro_pareja', 'Cuadro de los dos', 35, 'cuadro'),
  deco('cuadro_atardecer', 'Cuadro de atardecer', 35, 'cuadro'),
  deco('cuadro_flores', 'Cuadro de flores', 30, 'cuadro'),
  deco('cuadro_noche', 'Cuadro de noche estrellada', 35, 'cuadro'),
  deco('cuadro_gato', 'Cuadro de gatito', 30, 'cuadro'),
  deco('letrero_amor', 'Letrero «Te amo»', 40, 'cuadro'),
  deco('reloj', 'Reloj de pared', 30, 'cuadro'),
  deco('espejo', 'Espejo redondo', 40, 'cuadro'),
  deco('guirnalda', 'Guirnalda de luces', 35, 'cuadro'),
  deco('banderin', 'Banderines de corazones', 25, 'cuadro'),
  deco('corona_flores', 'Corona de flores', 30, 'cuadro'),
  // Piso
  deco('monstera', 'Monstera', 40, 'piso'),
  deco('girasoles', 'Girasoles', 35, 'piso'),
  deco('palma', 'Palmera en matera', 40, 'piso'),
  deco('arbol_navidad', 'Arbolito de Navidad', 60, 'piso'),
  deco('guitarra', 'Guitarra', 70, 'piso'),
  deco('estanteria', 'Estantería con libros', 65, 'piso'),
  deco('lampara_bola', 'Lámpara de bola', 55, 'piso'),
  deco('puf', 'Puf rosado', 35, 'piso'),
  deco('cojin_corazon', 'Cojín de corazón', 30, 'piso'),
  deco('perro_grande', 'Perro de peluche gigante', 80, 'piso'),
  // Mesa
  deco('lampara_mesa', 'Lámpara de mesa', 35, 'mesa'),
  deco('pecera', 'Pecera con pececito', 45, 'mesa'),
  deco('tocadiscos', 'Tocadiscos', 60, 'mesa'),
  deco('globo_terraqueo', 'Globo terráqueo', 40, 'mesa'),
  deco('bonsai', 'Bonsái', 45, 'mesa'),
  deco('suculentas', 'Suculentas', 25, 'mesa'),
  deco('vela_frasco', 'Vela en frasco', 20, 'mesa'),
  deco('portarretrato', 'Portarretratos doble', 30, 'mesa'),
  deco('despertador', 'Despertador', 25, 'mesa'),
  deco('taza_corazon', 'Taza de corazón', 15, 'mesa'),
  deco('caja_musical', 'Caja musical', 50, 'mesa'),
  deco('bola_nieve', 'Bola de nieve', 35, 'mesa'),
  deco('libros', 'Pila de libros', 20, 'mesa'),
  deco('radio', 'Radio antiguo', 40, 'mesa'),
  // Peluches (sofá y cama)
  deco('conejo_peluche', 'Conejo de peluche', 35, 'peluche'),
  deco('gato_peluche', 'Gato de peluche', 35, 'peluche'),
  deco('perro_peluche', 'Perrito de peluche', 35, 'peluche'),
  deco('dino_peluche', 'Dinosaurio de peluche', 40, 'peluche'),
  deco('pinguino', 'Pingüino de peluche', 35, 'peluche'),
  deco('unicornio', 'Unicornio de peluche', 45, 'peluche'),
  deco('panda', 'Panda de peluche', 40, 'peluche'),
  deco('elefante', 'Elefante de peluche', 40, 'peluche'),
  deco('corazon_peluche', 'Corazón de peluche', 30, 'peluche'),
  ...ROPA,
  ...TINTES,
  ...DISFRACES,
];

export const ITEM: Record<string, Item> = Object.fromEntries(CATALOGO.map((i) => [i.id, i]));

// Un disfraz solo trae piezas que existen para quien las lleva; su precio es el de las piezas con descuento
for (const d of DISFRACES) {
  for (const r of ['el', 'ella'] as Rol[]) d.piezas![r] = (d.piezas![r] ?? []).filter((id) => ITEM[id]?.para?.includes(r));
  const ids = new Set([...(d.piezas!.el ?? []), ...(d.piezas!.ella ?? [])]);
  d.precio = Math.max(20, Math.round(([...ids].reduce((t, id) => t + (ITEM[id]?.precio ?? 0), 0) * 0.75) / 5) * 5);
}
export const DISFRACES_LISTA = DISFRACES.filter((d) => (d.piezas!.el?.length ?? 0) + (d.piezas!.ella?.length ?? 0) > 0);
/** ¿Le queda a este personaje? (los tintes y los disfraces les sirven a los dos) */
export const lePasa = (it: Item, r: Rol) => !it.para || it.para.includes(r);

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
