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
  /** Disfraz: qué tan elaborado es (el precio sube con la rareza). */
  rareza?: Rareza;
  /** Prenda que solo viene con su disfraz (no se vende suelta). */
  exclusiva?: boolean;
  /** Plato que solo sale de la cocina de chef (no se vende): llena mucho más y se puede regalar. */
  cocina?: boolean;
  /** Decoración con luces o partes que se pueden pintar de otro color (neón, LED, lava…). */
  tintable?: boolean;
  /** Decoración que viene con un concepto (gamer, griego…): sale en la tienda con el concepto. */
  concepto?: string;
}

/** Rareza de los disfraces: blanco es la calidad de siempre; verde el doble de detalle, azul el triple, morado cinco
 *  veces y dorado diez. */
export type Rareza = 'blanco' | 'verde' | 'azul' | 'morado' | 'dorado';
export const RAREZAS: Rareza[] = ['dorado', 'morado', 'azul', 'verde', 'blanco'];
export const RAREZA: Record<Rareza, { nombre: string; factor: number; minimo: number }> = {
  blanco: { nombre: 'Común', factor: 1, minimo: 20 },
  verde: { nombre: 'Especial', factor: 1.5, minimo: 180 },
  azul: { nombre: 'Raro', factor: 2, minimo: 300 },
  morado: { nombre: 'Épico', factor: 3, minimo: 520 },
  dorado: { nombre: 'Legendario', factor: 5, minimo: 900 },
};

const comida = (id: string, nombre: string, precio: number, hambre: number, extra: Partial<Record<Necesidad, number>> = {}): Item =>
  ({ id, nombre, tipo: 'comida', precio, producto: id, efecto: { hambre, ...extra } });
const plato = (id: string, nombre: string, precio: number, hambre: number, extra: Partial<Record<Necesidad, number>> = {}): Item =>
  ({ id, nombre, tipo: 'comida', precio, modelo: `comida_${id}`, efecto: { hambre, ...extra } });
const deco = (id: string, nombre: string, precio: number, sitio: TipoSitio, texto?: string): Item =>
  ({ id, nombre, tipo: 'deco', precio, modelo: `deco_${id}`, sitio, ...(texto ? { texto } : {}) });
/** Decoración de un concepto (y si se le puede cambiar el color). */
const dc = (concepto: string, id: string, nombre: string, precio: number, sitio: TipoSitio, tintable = false): Item =>
  ({ ...deco(id, nombre, precio, sitio, tintable ? 'Se le puede cambiar el color' : undefined), concepto, ...(tintable ? { tintable } : {}) });

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
  exclusiva?: boolean;
}
const ROPA: Item[] = (ropaDatos as unknown as DatoRopa[])
  .slice()
  .sort((a, b) => a.orden - b.orden)
  .map((r) => ({
    id: r.id, nombre: r.nombre, tipo: 'ropa', precio: r.precio, modelo: r.modelo, ranura: r.ranura, para: r.para,
    ...(r.tambien.length ? { tambien: r.tambien } : {}), ...(r.oculta.length ? { oculta: r.oculta } : {}),
    ...(Object.keys(r.colores).length ? { colores: r.colores } : {}),
    ...(r.exclusiva ? { exclusiva: true } : {}),
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
const disfraz = (id: string, nombre: string, piezas: Partial<Record<Rol, string[]>>, texto: string, rareza: Rareza = 'blanco'): Item => ({
  id: `disfraz_${id}`, nombre, tipo: 'disfraz', precio: 0, piezas, texto, rareza,
});
const DISFRACES: Item[] = [
  disfraz('gatitos', 'Pareja de gatitos', ambos('orejas_gato', 'cola_gato', 'bigotes_gato'), 'Orejitas, cola y bigotes para los dos'),
  disfraz('conejitos', 'Pareja de conejitos', ambos('pijama_conejo', 'capucha_conejo', 'cola_conejo', 'pantuflas_conejo'),
    'Pijama, capucha con orejas largas, colita y pantuflas'),
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
  // --- Dorados (diez veces más detalle) ---
  disfraz('stitch_angel', 'Stitch y Angel', {
    el: ['enterizo_stitch', 'capucha_stitch', 'pantuflas_stitch', 'cola_stitch'],
    ella: ['enterizo_angel', 'capucha_angel', 'pantuflas_angel', 'cola_angel'],
  }, 'Enterizos de peluche con panza, manchas y púas, capuchas con orejotas, ojazos y la antena de Angel, garritas y pantuflas con deditos', 'dorado'),
  disfraz('silleteros', 'Silleteros de la Feria de las Flores', {
    el: ['sombrero_aguadeno', 'ruana_paisa', 'silleta_flores', 'alpargatas'],
    ella: ['sombrero_flores', 'vestido_chapolera', 'silleta_corazon', 'alpargatas_rojas'],
  }, 'Sombrero aguadeño, ruana con carriel y silletas de madera llenas de flores a la espalda', 'dorado'),
  disfraz('dragones', 'Dragones', {
    el: ['enterizo_dragon', 'capucha_dragon', 'alas_dragon', 'cola_dragon', 'pantuflas_dragon'],
    ella: ['enterizo_dragona', 'capucha_dragona', 'alas_dragona', 'cola_dragona', 'pantuflas_dragona'],
  }, 'Escamas, cuernos, alas con membrana, cola con púas y garras', 'dorado'),
  // --- Morados (cinco veces) ---
  disfraz('pandas_bambu', 'Pandas con bambú', ambos('enterizo_panda', 'capucha_panda_bambu', 'mochila_bambu', 'pantuflas_panda_garra'),
    'Panda de verdad: brazos y piernas negros, manchas en los ojos, mochila de bambú', 'morado'),
  disfraz('perrito_pulga', 'El perrito y la pulguita', {
    el: ['enterizo_perrito', 'capucha_perrito', 'cola_perrito', 'pantuflas_perrito'],
    ella: ['enterizo_pulga', 'capucha_pulga', 'patitas_pulga', 'pantuflas_pulga'],
  }, 'Él de perrito con collar y placa; Ella de pulguita con antenas, ojazos y patitas de más', 'morado'),
  disfraz('sirena_triton', 'Sirena y tritón', {
    el: ['corona_triton', 'chaleco_escamas', 'pantalon_escamas', 'tridente'],
    ella: ['corona_conchas', 'top_conchas', 'cola_sirena'],
  }, 'Cola de escamas con aleta, conchas, collar de perlas, coronas y tridente dorado', 'morado'),
  disfraz('zorritos', 'Zorritos del bosque', ambos('enterizo_zorro', 'capucha_zorro', 'cola_zorro_esponjosa', 'pantuflas_zorro'),
    'Pecho blanco, orejas de punta, cola esponjosa y coronita de hojas', 'morado'),
  disfraz('arepa_chocolate', 'Arepa y chocolatico', { el: ['traje_arepa', 'gorro_mantequilla'], ella: ['traje_chocolate', 'gorro_espuma'] },
    'Él de arepa con queso derretido; Ella de taza de chocolate con espuma y malvaviscos', 'morado'),
  disfraz('ratoncitos', 'Ratoncitos de Transformice', ambos('enterizo_raton', 'capucha_raton', 'cola_raton', 'queso_espalda'),
    'Como cuando se conocieron: orejotas, bigotes, colita y un queso a la espalda', 'morado'),
  // --- Azules (el triple) ---
  disfraz('lilo_stitch', 'Lilo y Stitch', { el: ['diadema_stitch', 'camiseta_stitch', 'bermuda_caqui', 'sandalias_cafe'], ella: ['vestido_lilo', 'flor_pelo_roja', 'sandalias_cafe'] },
    'Él con orejas de Stitch y su camiseta; Ella con el vestido rojo de hojas y collar de flores', 'azul'),
  disfraz('ranitas', 'Ranitas', ambos('enterizo_rana', 'capucha_rana', 'pantuflas_rana'), 'Ojos saltones, panza con pintas y patas de rana', 'azul'),
  disfraz('vaquitas', 'Vaquitas', ambos('enterizo_vaca', 'capucha_vaca', 'cola_vaca'), 'Manchas, cachitos, orejas y campanita', 'azul'),
  disfraz('pollitos', 'Pollitos', ambos('enterizo_pollito', 'capucha_cascaron', 'pantuflas_pollito'), 'Plumitas amarillas, cascarón en la cabeza y patas', 'azul'),
  // --- Verdes (el doble) ---
  disfraz('tigres', 'Tigres', ambos('enterizo_tigre', 'capucha_tigre', 'cola_tigre'), 'Rayas, orejas y cola a rayas', 'verde'),
  disfraz('ovejitas', 'Ovejitas', ambos('enterizo_oveja', 'capucha_oveja'), 'Lanita esponjosa y orejitas', 'verde'),
  disfraz('leoncitos', 'Leoncitos', ambos('enterizo_leon', 'capucha_leon', 'cola_leon'), 'Melena, orejas y cola con borla', 'verde'),
];

/** Lo que le cae pesado a cada uno: a Ella la leche, a Él el picante (el retrete sale volando). */
export const LE_CAE_MAL: Record<'el' | 'ella', string[]> = { ella: ['leche', 'yogur', 'arroz_leche'], el: ['empanada', 'tacos'] };

/** La comida y los regalos son lo de todos los días: baratos, para que el bono diario alcance para cuidarse. */
// ---------------------------------------------------------------------------
// Conceptos de decoración para los cuartos propios (personajes/blender/deco_conceptos.py)
// ---------------------------------------------------------------------------
const DECO_CONCEPTOS: Item[] = [
  // Gamer
  dc('gamer', 'neon_gg', 'Letrero neón «GG»', 55, 'cuadro', true),
  dc('gamer', 'paneles_hex', 'Paneles de luz hexagonales', 60, 'cuadro', true),
  dc('gamer', 'poster_control', 'Afiche de control', 30, 'cuadro'),
  dc('gamer', 'audifonos', 'Audífonos gamer con soporte', 45, 'mesa', true),
  dc('gamer', 'consola', 'Consola portátil', 50, 'mesa'),
  dc('gamer', 'slime', 'Slime de peluche', 35, 'peluche'),
  dc('gamer', 'torre_pc', 'Torre gamer con ventiladores de luz', 70, 'piso', true),
  dc('gamer', 'lampara_led', 'Barra de luz LED', 50, 'piso', true),
  // Griego
  dc('griego', 'meandro', 'Placa del templo griego', 45, 'cuadro'),
  dc('griego', 'laurel', 'Corona de laurel dorada', 40, 'cuadro'),
  dc('griego', 'anfora', 'Ánfora pequeña', 30, 'mesa'),
  dc('griego', 'busto', 'Busto de mármol', 50, 'mesa'),
  dc('griego', 'pegaso', 'Pegaso de peluche', 45, 'peluche'),
  dc('griego', 'columna', 'Columna jónica con hiedra', 70, 'piso'),
  dc('griego', 'anfora_grande', 'Ánfora grande con olivo', 55, 'piso'),
  // Egipcio
  dc('egipcio', 'papiro', 'Papiro con jeroglíficos', 35, 'cuadro'),
  dc('egipcio', 'escarabajo', 'Escarabajo sagrado', 40, 'cuadro'),
  dc('egipcio', 'piramide', 'Pirámide de luz', 40, 'mesa'),
  dc('egipcio', 'gato_egipcio', 'Gato egipcio', 45, 'mesa'),
  dc('egipcio', 'momia', 'Momia de peluche', 40, 'peluche'),
  dc('egipcio', 'obelisco', 'Obelisco', 65, 'piso'),
  // Espacial
  dc('espacial', 'planetas', 'Sistema solar', 50, 'cuadro'),
  dc('espacial', 'cuadro_astronauta', 'Cuadro de astronauta', 35, 'cuadro'),
  dc('espacial', 'lampara_luna', 'Lámpara de luna', 45, 'mesa'),
  dc('espacial', 'cohete_mesa', 'Cohete de juguete', 35, 'mesa'),
  dc('espacial', 'alien', 'Extraterrestre de peluche', 40, 'peluche'),
  dc('espacial', 'telescopio', 'Telescopio', 70, 'piso'),
  // Tropical
  dc('tropical', 'cuadro_ola', 'Cuadro de la ola', 35, 'cuadro'),
  dc('tropical', 'flotador', 'Salvavidas', 35, 'cuadro'),
  dc('tropical', 'concha', 'Caracola y estrella de mar', 25, 'mesa'),
  dc('tropical', 'tortuga', 'Tortuga de peluche', 40, 'peluche'),
  dc('tropical', 'tabla_surf', 'Tabla de surf', 60, 'piso'),
  // Japonés
  dc('japones', 'abanico', 'Abanico japonés', 35, 'cuadro'),
  dc('japones', 'cuadro_fuji', 'Cuadro del monte Fuji', 40, 'cuadro'),
  dc('japones', 'maneki', 'Gato de la suerte', 40, 'mesa'),
  dc('japones', 'farol_papel', 'Farol de papel', 55, 'piso'),
  dc('japones', 'cerezo', 'Cerezo en flor', 65, 'piso'),
  // Princesa
  dc('princesa', 'espejo_princesa', 'Espejo de princesa', 55, 'cuadro'),
  dc('princesa', 'corona_pared', 'Corona de luces', 45, 'cuadro'),
  dc('princesa', 'tiara_cojin', 'Tiara en su cojín', 45, 'mesa'),
  dc('princesa', 'joyero', 'Joyero con perlas', 45, 'mesa'),
  dc('princesa', 'castillo', 'Castillo de princesa', 75, 'piso'),
  // Música
  dc('musica', 'vinilos', 'Discos de vinilo', 40, 'cuadro'),
  dc('musica', 'poster_rock', 'Afiche de rock', 30, 'cuadro'),
  dc('musica', 'microfono', 'Micrófono retro', 40, 'mesa'),
  dc('musica', 'guitarra_electrica', 'Guitarra eléctrica', 80, 'piso', true),
  dc('musica', 'amplificador', 'Amplificador', 60, 'piso'),
  // Fútbol
  dc('futbol', 'camiseta', 'Camiseta del 10 enmarcada', 50, 'cuadro'),
  dc('futbol', 'bufanda', 'Bufanda de hincha', 30, 'cuadro'),
  dc('futbol', 'copa', 'Copa de campeón', 45, 'mesa'),
  dc('futbol', 'balon', 'Balón', 30, 'piso'),
  dc('futbol', 'arco', 'Arco de fútbol', 60, 'piso'),
  // Colombiano
  dc('colombiano', 'vueltiao_pared', 'Sombrero vueltiao', 50, 'cuadro'),
  dc('colombiano', 'mochila_wayuu', 'Mochila wayuu', 45, 'cuadro'),
  dc('colombiano', 'chiva', 'Chiva de artesanía', 50, 'mesa'),
  dc('colombiano', 'guacamaya', 'Guacamaya de peluche', 40, 'peluche'),
  dc('colombiano', 'silleta', 'Silleta de flores', 75, 'piso'),
  dc('colombiano', 'bulto_cafe', 'Bulto de café', 40, 'piso'),
  // Pirata
  dc('pirata', 'timon', 'Timón de barco', 45, 'cuadro'),
  dc('pirata', 'mapa_tesoro', 'Mapa del tesoro', 35, 'cuadro'),
  dc('pirata', 'barco_botella', 'Barco en botella', 45, 'mesa'),
  dc('pirata', 'loro', 'Loro pirata de peluche', 40, 'peluche'),
  dc('pirata', 'cofre', 'Cofre del tesoro', 65, 'piso'),
  dc('pirata', 'barril', 'Barril', 45, 'piso'),
  // Bosque
  dc('bosque', 'reloj_cucu', 'Reloj cucú', 50, 'cuadro'),
  dc('bosque', 'cuadro_pinos', 'Cuadro del bosque', 35, 'cuadro'),
  dc('bosque', 'hongos', 'Lámpara de hongos', 40, 'mesa', true),
  dc('bosque', 'zorro', 'Zorro de peluche', 40, 'peluche'),
  dc('bosque', 'tronco', 'Tronco con hongos', 45, 'piso'),
  dc('bosque', 'pino', 'Pino en matera', 50, 'piso'),
  // Kawaii
  dc('kawaii', 'nube_arcoiris', 'Arcoíris con nubes', 40, 'cuadro'),
  dc('kawaii', 'neon_corazon', 'Corazón de neón', 55, 'cuadro', true),
  dc('kawaii', 'leche_fresa', 'Leche de fresa kawaii', 25, 'mesa'),
  dc('kawaii', 'nube_peluche', 'Nube de peluche', 35, 'peluche'),
  dc('kawaii', 'lampara_estrella', 'Lámpara de estrella', 55, 'piso', true),
  // Biblioteca
  dc('biblioteca', 'repisa_libros', 'Repisa con libros', 45, 'cuadro'),
  dc('biblioteca', 'cuadro_cerebro', 'Lámina del cerebro', 35, 'cuadro'),
  dc('biblioteca', 'lampara_banquero', 'Lámpara verde de estudio', 45, 'mesa'),
  dc('biblioteca', 'buho', 'Búho lector de peluche', 40, 'peluche'),
  dc('biblioteca', 'pila_libros', 'Torre de libros', 45, 'piso'),
  // Navidad
  dc('navidad', 'corona_navidad', 'Corona de Navidad', 40, 'cuadro'),
  dc('navidad', 'medias', 'Medias de Navidad', 35, 'cuadro'),
  dc('navidad', 'casita_jengibre', 'Casita de jengibre', 35, 'mesa'),
  dc('navidad', 'reno', 'Reno de peluche', 40, 'peluche'),
  dc('navidad', 'muneco_nieve', 'Muñeco de nieve', 60, 'piso'),
  dc('navidad', 'regalos', 'Pila de regalos', 45, 'piso'),
  // Halloween
  dc('halloween', 'murcielagos', 'Murciélagos de papel', 25, 'cuadro'),
  dc('halloween', 'luna_bruja', 'Cuadro de la bruja', 35, 'cuadro'),
  dc('halloween', 'calabaza', 'Calabaza con cara', 30, 'mesa'),
  dc('halloween', 'caldero', 'Caldero de bruja', 40, 'mesa'),
  dc('halloween', 'fantasma', 'Fantasmita de peluche', 35, 'peluche'),
  dc('halloween', 'calabaza_grande', 'Calabaza gigante', 55, 'piso'),
  dc('halloween', 'escoba', 'Escoba de bruja', 40, 'piso'),
  // Cine
  dc('cine', 'poster_cine', 'Afiche de película', 35, 'cuadro'),
  dc('cine', 'claqueta', 'Claqueta', 35, 'cuadro'),
  dc('cine', 'balde_crispetas', 'Balde de crispetas', 25, 'mesa'),
  dc('cine', 'rollo_pelicula', 'Rollo de película', 35, 'mesa'),
  dc('cine', 'silla_director', 'Silla de director', 65, 'piso'),
  dc('cine', 'foco_cine', 'Reflector de cine', 60, 'piso'),
  // Retro 80s
  dc('retro', 'neon_palmera', 'Neón de palmera', 55, 'cuadro', true),
  dc('retro', 'cassette', 'Cassette gigante', 40, 'cuadro'),
  dc('retro', 'lava', 'Lámpara de lava', 40, 'mesa', true),
  dc('retro', 'bola_disco', 'Bola de discoteca', 45, 'mesa'),
  dc('retro', 'patines', 'Patines', 50, 'piso'),
  dc('retro', 'arcade_mini', 'Maquinita de arcade', 85, 'piso'),
  // Romántico
  dc('romantico', 'luces_corazon', 'Corazón de bombillitos', 45, 'cuadro'),
  dc('romantico', 'cuadro_amor', 'Cuadro de los dos corazones', 35, 'cuadro'),
  dc('romantico', 'rosas', 'Docena de rosas', 45, 'mesa'),
  dc('romantico', 'rosal', 'Rosal', 60, 'piso'),
  // Nórdico
  dc('nordico', 'cuadro_geometrico', 'Cuadro geométrico', 35, 'cuadro'),
  dc('nordico', 'espejo_sol', 'Espejo de sol', 45, 'cuadro'),
  dc('nordico', 'jarron_nordico', 'Jarrón con pampas', 35, 'mesa'),
  dc('nordico', 'lampara_arco', 'Lámpara de arco', 70, 'piso'),
  dc('nordico', 'canasta_manta', 'Canasta con manta', 40, 'piso'),
];

/** Colores para lo que se puede pintar (luces, neón, lava…). */
export const COLORES_TINTE = ['#35F0FF', '#FF4FA3', '#8E3BFF', '#7BD66B', '#F7C948', '#FF7A45', '#3B6FB6', '#FFFFFF'];

/**
 * Un concepto llena los 9 sitios de un cuarto propio (3 cuadros, 2 mesas, 1 peluche y 3 de piso) y pinta las
 * paredes. Trae piezas nuevas y algunas de las de siempre que combinan; todo queda en el inventario, así se puede
 * mezclar después con piezas de otros conceptos.
 */
export interface Concepto {
  id: string;
  nombre: string;
  texto: string;
  pared: string;
  cuadro: [string, string, string];
  mesa: [string, string];
  peluche: string;
  piso: [string, string, string];
}

export const CONCEPTOS: Concepto[] = [
  { id: 'gamer', nombre: 'Gamer', texto: 'Luces de colores, torre gamer y audífonos', pared: '#3A3F5C',
    cuadro: ['neon_gg', 'paneles_hex', 'poster_control'], mesa: ['audifonos', 'consola'], peluche: 'slime', piso: ['torre_pc', 'lampara_led', 'puf'] },
  { id: 'griego', nombre: 'Griego', texto: 'Mármol, laureles y columnas', pared: '#EAF2F8',
    cuadro: ['meandro', 'laurel', 'espejo'], mesa: ['anfora', 'busto'], peluche: 'pegaso', piso: ['columna', 'anfora_grande', 'palma'] },
  { id: 'egipcio', nombre: 'Egipcio', texto: 'Pirámides, papiros y un obelisco', pared: '#F2D9A6',
    cuadro: ['papiro', 'escarabajo', 'cuadro_atardecer'], mesa: ['piramide', 'gato_egipcio'], peluche: 'momia', piso: ['obelisco', 'palma', 'cactus'] },
  { id: 'espacial', nombre: 'Espacial', texto: 'Planetas, cohete y telescopio', pared: '#34406B',
    cuadro: ['planetas', 'cuadro_astronauta', 'cuadro_noche'], mesa: ['lampara_luna', 'cohete_mesa'], peluche: 'alien',
    piso: ['telescopio', 'lampara_bola', 'lampara_estrella'] },
  { id: 'tropical', nombre: 'Playa tropical', texto: 'Surf, olas y palmeras', pared: '#BFE9E4',
    cuadro: ['cuadro_ola', 'flotador', 'guirnalda'], mesa: ['concha', 'pecera'], peluche: 'tortuga', piso: ['tabla_surf', 'palma', 'monstera'] },
  { id: 'japones', nombre: 'Japonés', texto: 'Cerezo, farol de papel y el monte Fuji', pared: '#F6E7DA',
    cuadro: ['abanico', 'cuadro_fuji', 'cuadro_flores'], mesa: ['maneki', 'bonsai'], peluche: 'panda', piso: ['farol_papel', 'cerezo', 'puf'] },
  { id: 'princesa', nombre: 'Princesa', texto: 'Castillo, tiara y espejo dorado', pared: '#F9D5E5',
    cuadro: ['espejo_princesa', 'corona_pared', 'banderin'], mesa: ['tiara_cojin', 'joyero'], peluche: 'unicornio',
    piso: ['castillo', 'lampara_bola', 'cojin_corazon'] },
  { id: 'musica', nombre: 'Rock y música', texto: 'Guitarra eléctrica, amplificador y vinilos', pared: '#4A4A5E',
    cuadro: ['vinilos', 'poster_rock', 'guirnalda'], mesa: ['microfono', 'tocadiscos'], peluche: 'dino_peluche',
    piso: ['guitarra_electrica', 'amplificador', 'guitarra'] },
  { id: 'futbol', nombre: 'Fútbol', texto: 'La camiseta del 10, la copa y el arco', pared: '#F8E27A',
    cuadro: ['camiseta', 'bufanda', 'banderin'], mesa: ['copa', 'radio'], peluche: 'perro_peluche', piso: ['balon', 'arco', 'puf'] },
  { id: 'colombiano', nombre: 'Colombiano', texto: 'Silleta, vueltiao, chiva y café', pared: '#F5E6CA',
    cuadro: ['vueltiao_pared', 'mochila_wayuu', 'cuadro_mapa'], mesa: ['chiva', 'taza_corazon'], peluche: 'guacamaya',
    piso: ['silleta', 'bulto_cafe', 'palma'] },
  { id: 'pirata', nombre: 'Pirata', texto: 'Cofre del tesoro, timón y barril', pared: '#C8D8E4',
    cuadro: ['timon', 'mapa_tesoro', 'flotador'], mesa: ['barco_botella', 'globo_terraqueo'], peluche: 'loro', piso: ['cofre', 'barril', 'palma'] },
  { id: 'bosque', nombre: 'Cabaña del bosque', texto: 'Pinos, hongos que brillan y reloj cucú', pared: '#DCE8D2',
    cuadro: ['reloj_cucu', 'cuadro_pinos', 'cuadro_paisaje'], mesa: ['hongos', 'vela_frasco'], peluche: 'zorro', piso: ['tronco', 'pino', 'lampara'] },
  { id: 'kawaii', nombre: 'Kawaii', texto: 'Nubes, arcoíris y todo pastel', pared: '#FBE3F0',
    cuadro: ['nube_arcoiris', 'neon_corazon', 'cuadro_gato'], mesa: ['leche_fresa', 'caja_musical'], peluche: 'nube_peluche',
    piso: ['lampara_estrella', 'puf', 'cojin_corazon'] },
  { id: 'biblioteca', nombre: 'Biblioteca', texto: 'Libros, lámpara de estudio y el cerebrito', pared: '#EDE3D1',
    cuadro: ['repisa_libros', 'cuadro_cerebro', 'reloj'], mesa: ['lampara_banquero', 'libros'], peluche: 'buho', piso: ['pila_libros', 'estanteria', 'lampara'] },
  { id: 'navidad', nombre: 'Navidad', texto: 'Arbolito, medias, muñeco de nieve y regalos', pared: '#E9F2EC',
    cuadro: ['corona_navidad', 'medias', 'guirnalda'], mesa: ['casita_jengibre', 'bola_nieve'], peluche: 'reno',
    piso: ['arbol_navidad', 'muneco_nieve', 'regalos'] },
  { id: 'halloween', nombre: 'Halloween', texto: 'Calabazas, caldero y murciélagos', pared: '#4E3D63',
    cuadro: ['murcielagos', 'luna_bruja', 'cuadro_noche'], mesa: ['calabaza', 'caldero'], peluche: 'fantasma', piso: ['calabaza_grande', 'escoba', 'lampara_bola'] },
  { id: 'cine', nombre: 'Cine', texto: 'Crispetas, claqueta y silla de director', pared: '#5A2E3A',
    cuadro: ['poster_cine', 'claqueta', 'guirnalda'], mesa: ['balde_crispetas', 'rollo_pelicula'], peluche: 'corazon_peluche', piso: ['silla_director', 'foco_cine', 'puf'] },
  { id: 'retro', nombre: 'Retro 80s', texto: 'Neón, lámpara de lava, patines y arcade', pared: '#46306E',
    cuadro: ['neon_palmera', 'cassette', 'vinilos'], mesa: ['lava', 'bola_disco'], peluche: 'gato_peluche', piso: ['patines', 'arcade_mini', 'lampara_led'] },
  { id: 'romantico', nombre: 'Romántico', texto: 'Rosas, corazones y bombillitos', pared: '#F7D6D6',
    cuadro: ['luces_corazon', 'cuadro_amor', 'letrero_amor'], mesa: ['rosas', 'velas'], peluche: 'corazon_peluche', piso: ['rosal', 'cojin_corazon', 'globos'] },
  { id: 'nordico', nombre: 'Nórdico', texto: 'Madera clara, pampas y una lámpara de arco', pared: '#EFEFEA',
    cuadro: ['cuadro_geometrico', 'espejo_sol', 'reloj'], mesa: ['jarron_nordico', 'suculentas'], peluche: 'conejo_peluche',
    piso: ['lampara_arco', 'canasta_manta', 'monstera'] },
];

/** Las 9 piezas de un concepto en el orden de los sitios de un cuarto propio (por tipo). */
export const piezasConcepto = (c: Concepto): { tipo: TipoSitio; id: string }[] => [
  ...c.cuadro.map((id) => ({ tipo: 'cuadro' as TipoSitio, id })),
  ...c.mesa.map((id) => ({ tipo: 'mesa' as TipoSitio, id })),
  { tipo: 'peluche', id: c.peluche },
  ...c.piso.map((id) => ({ tipo: 'piso' as TipoSitio, id })),
];

export const CATALOGO: Item[] = [
  comida('manzana', 'Manzana', 1, 8),
  comida('banano', 'Banano', 1, 8),
  comida('uvas', 'Uvas', 1, 10),
  comida('pan', 'Pan', 2, 15),
  comida('croissant', 'Croissant', 2, 16),
  comida('galletas', 'Galletas', 2, 10, { carino: 2 }),
  comida('yogur', 'Yogur', 2, 10),
  comida('leche', 'Vaso de leche', 1, 6, { energia: 2 }),
  comida('queso', 'Queso', 2, 12),
  comida('arepa', 'Arepa', 3, 22),
  comida('wafle', 'Wafle', 3, 20, { carino: 3 }),
  comida('helado', 'Helado', 3, 12, { carino: 4, energia: 2 }),
  comida('pizza', 'Pizza', 5, 35),
  comida('torta', 'Torta', 6, 25, { carino: 6 }),
  comida('jugo', 'Jugo', 1, 6, { energia: 3 }),
  comida('cafe', 'Café', 2, 4, { energia: 12 }),
  // Nuevas (modelo propio comida_<id>.glb)
  plato('empanada', 'Empanada con ají', 2, 14),
  plato('bunuelos', 'Buñuelos', 2, 14, { carino: 2 }),
  plato('pandebono', 'Pandebonos', 2, 14),
  plato('arepa_queso', 'Arepa con queso', 2, 20),
  plato('bandeja_paisa', 'Bandeja paisa', 7, 50, { energia: 5 }),
  plato('ajiaco', 'Ajiaco', 5, 38, { energia: 3 }),
  plato('tamal', 'Tamal', 4, 32),
  plato('obleas', 'Obleas con arequipe', 2, 10, { carino: 4 }),
  plato('cholado', 'Cholado', 3, 12, { energia: 4, carino: 2 }),
  plato('mango_biche', 'Mango biche con sal', 1, 8, { energia: 2 }),
  plato('mazorca', 'Mazorca asada', 2, 14),
  plato('churros', 'Churros', 2, 14, { carino: 2 }),
  plato('arroz_leche', 'Arroz con leche', 2, 14, { carino: 3 }),
  plato('perro', 'Perro caliente', 3, 26),
  plato('hamburguesa', 'Hamburguesa', 5, 34),
  plato('salchipapa', 'Salchipapa', 3, 26),
  plato('sushi', 'Sushi', 5, 24, { carino: 4 }),
  plato('tacos', 'Tacos', 4, 26),
  plato('fresas_crema', 'Fresas con crema', 3, 12, { carino: 6 }),
  plato('brownie', 'Brownie con helado', 3, 14, { carino: 4 }),
  plato('dona', 'Dona rosada', 2, 12, { carino: 3 }),
  plato('cupcake', 'Cupcake', 2, 12, { carino: 5 }),
  plato('flan', 'Flan de caramelo', 2, 12, { carino: 4 }),
  plato('galletas_corazon', 'Galletas de corazón', 2, 8, { carino: 7 }),
  plato('chocolate', 'Chocolate con queso', 2, 8, { energia: 8, carino: 4 }),
  plato('te', 'Té caliente', 1, 2, { energia: 8 }),
  plato('limonada', 'Limonada', 1, 4, { energia: 6 }),
  plato('malteada', 'Malteada de fresa', 3, 10, { energia: 4, carino: 4 }),
  plato('palomitas', 'Palomitas', 2, 10, { carino: 3 }),
  plato('sandia', 'Tajada de sandía', 1, 8, { energia: 3 }),
  plato('ensalada_frutas', 'Ensalada de frutas', 3, 18, { energia: 4 }),
  // Los de la cocina de chef (solo se cocinan): llenan mucho más y se pueden regalar
  { ...plato('wafle_chef', 'Wafles de chef', 0, 70, { carino: 12, energia: 10 }), cocina: true },
  { ...plato('fresas_chef', 'Fresas con crema de chef', 0, 55, { carino: 18, energia: 6 }), cocina: true },
  { ...plato('frape_chef', 'Frappé de chef', 0, 40, { energia: 30, carino: 12 }), cocina: true },
  { id: 'carta', nombre: 'Carta de amor', tipo: 'regalo', precio: 2, modelo: 'regalo_carta', efecto: { carino: 15 }, texto: 'Con un mensaje tuyo' },
  { id: 'flores', nombre: 'Ramo de flores', tipo: 'regalo', precio: 8, modelo: 'regalo_flores', efecto: { carino: 30 }, texto: 'Después se puede poner en un florero' },
  { id: 'chocolates', nombre: 'Chocolates', tipo: 'regalo', precio: 7, modelo: 'regalo_chocolates', efecto: { carino: 25, hambre: 8 } },
  { id: 'cajita', nombre: 'Cajita sorpresa', tipo: 'regalo', precio: 5, modelo: 'regalo_cajita', efecto: { carino: 20 }, texto: 'Trae una comida al azar adentro' },
  { id: 'osito', nombre: 'Osito de peluche', tipo: 'regalo', precio: 13, modelo: 'deco_osito', efecto: { carino: 40 }, sitio: 'peluche',
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
  ...DECO_CONCEPTOS,
  ...ROPA,
  ...TINTES,
  ...DISFRACES,
];

export const ITEM: Record<string, Item> = Object.fromEntries(CATALOGO.map((i) => [i.id, i]));

// Un disfraz solo trae piezas que existen para quien las lleva; su precio es el de las piezas con descuento
// (los nuevos solo salen cuando ya están todas sus piezas: uno a medio hacer no se vende)
const incompletos = new Set<string>();
for (const d of DISFRACES) {
  for (const r of ['el', 'ella'] as Rol[]) {
    const todas = d.piezas![r] ?? [];
    d.piezas![r] = todas.filter((id) => ITEM[id]?.para?.includes(r));
    if (d.rareza !== 'blanco' && d.piezas![r]!.length < todas.length) incompletos.add(d.id);
  }
  const ids = new Set([...(d.piezas!.el ?? []), ...(d.piezas!.ella ?? [])]);
  const r = RAREZA[d.rareza ?? 'blanco'];
  d.precio = Math.max(r.minimo, Math.round(([...ids].reduce((t, id) => t + (ITEM[id]?.precio ?? 0), 0) * 0.75 * r.factor) / 5) * 5);
}
/** Los disfraces que ya tienen sus piezas, de los más elaborados a los de siempre. */
export const DISFRACES_LISTA = DISFRACES.filter((d) => !incompletos.has(d.id) && (d.piezas!.el?.length ?? 0) + (d.piezas!.ella?.length ?? 0) > 0).sort(
  (a, b) => RAREZAS.indexOf(a.rareza ?? 'blanco') - RAREZAS.indexOf(b.rareza ?? 'blanco'),
);
/** ¿Le queda a este personaje? (los tintes y los disfraces les sirven a los dos) */
export const lePasa = (it: Item, r: Rol) => !it.para || it.para.includes(r);

/** Precio de un concepto: sus 9 piezas con 30 % de descuento. */
export const precioConcepto = (c: Concepto) => Math.round((piezasConcepto(c).reduce((t, p) => t + (ITEM[p.id]?.precio ?? 0), 0) * 0.7) / 5) * 5;

/** Qué objetos sirven para un tipo de sitio (incluye regalos que se quedan como decoración). */
export const paraSitio = (t: TipoSitio) => CATALOGO.filter((i) => i.sitio === t && i.tipo === 'deco');

export const EFECTO_CARINO: Record<string, { mio: number; suyo: number }> = {
  caricia: { mio: 4, suyo: 10 },
  abrazo: { mio: 15, suyo: 15 },
  beso: { mio: 20, suyo: 20 },
  // (la nalgada: a él le da risa; a ella, después del berrinche, también un poquito)
  nalgada: { mio: 8, suyo: 5 },
};
// Economía (ver docs/sistemas/nuestro-hogar.md, «Monedas»): se gana poco y despacio; los mimos no dan monedas.
/** Bono por abrir la app, uno por persona y por día. */
export const BONO_DIARIO = 5;
/** El día del aniversario, una vez al año. */
export const BONO_ANIVERSARIO = 13;
/** Del sueldo del súper pasa a la casa un tercio de lo ganado en el día. */
export const SUELDO_FRACCION = 1 / 3;
