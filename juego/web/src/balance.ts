// Números del juego en un solo lugar (se ajustan probando). Coordenadas en metros de Blender.

// ---------- Vitrinas ----------
/** Unidades por tipo de vitrina y nivel (como en el original: un estante lleno aguanta varios clientes). */
export const CAPACIDAD: Record<string, number[]> = {
  estante: [0, 8, 12, 16], frutas: [0, 8, 12, 16], nevera: [0, 8, 12, 15], vitrina: [0, 6, 9, 13],
  congelador: [0, 7, 10, 14], panaderia: [0, 7, 10, 14], bebidas: [0, 8, 12, 16], wafles: [0, 6, 9, 12], arepas: [0, 6, 9, 12],
};
/** Lo que cuesta comprar un sitio vacío (vitrina de nivel 1) y mejorar una vitrina o la caja (con monedas). */
export const PRECIO_COMPRA: Record<string, number> = {
  frutas: 40, abarrotes: 40, bebidas: 40, lacteos: 55, panaderia: 55, congelados: 70, carnes: 70, wafles: 80, arepas: 80,
};
export const PRECIO_MEJORA_VITRINA = 65;
export const PRECIO_MEJORA_CAJA = 85;
/** Monedas por unidad vendida. */
export const PRECIO: Record<string, number> = {
  frutas: 5, lacteos: 6, abarrotes: 6, bebidas: 5, panaderia: 6, congelados: 8, carnes: 9, wafles: 10, arepas: 9,
};

// ---------- Él, Ella y las mejoras que los aceleran ----------
// (todo va más rápido que al principio: los días duran 1:30)
export const VELOCIDAD_EL = [2.6, 2.95, 3.3, 3.7]; // m/s según «zapatos»
/** Cargar el carrito en la bodega: base + un poquito por cada reposición que le cabe, × «bodega». */
export const CARGA_BODEGA = { base: 1.0, porUnidad: 0.3, mejora: [1, 0.72, 0.52, 0.36] }; // s
export const REPONER = { base: 1.4, mejora: [1, 0.72, 0.52, 0.36] }; // s por vitrina, × «alacena»
/** Reposiciones que lleva el carrito según «carrito»: cada una deja lleno un estante (el que sea). Como en el
 *  original: un carrito lleno alcanza para unos 5 estantes y con la mejora para 7 (el último es de partidas viejas). */
export const CARRITO_UNIDADES = [0, 5, 6, 7, 7];
/** Manchas que limpia el trapero antes de tener que lavarlo, según «trapero» (0, 1, 2). */
export const TRAPERO = [4, 6, 9];
/** Segundos para lavar el trapero en el balde. */
export const LAVAR = 1.3;
/** Basuras que caben en la bolsa antes de ir a la caneca, y canastas sueltas que se cargan a la vez. */
export const BOLSA_BASURA = 4;
export const CANASTAS_EN_MANO = 3;
/** Choque entre Él y Ella (en pareja): solo cuando van de frente y rápido. */
export const CHOQUE = {
  radio: 0.3, // m: distancia entre los dos para chocar (el doble)
  acercandose: 1.4, // m/s: cada uno debe ir hacia el otro al menos así de rápido
  empuje: 3.2, // m/s del empujón (dura `empujeDura` s)
  empujeDura: 0.26,
  mareo: 0.8, // s atontados
  calma: 1.6, // s sin volver a chocar
  cargaLlena: 0.75, // fracción del carrito para que se riegue
};
export const COBRO = { base: [0, 1.2, 0.8, 0.55], porUnidad: [0, 0.45, 0.3, 0.2] }; // s por cliente, según nivel de la caja
export const RECOGER = { basura: 0.6, botar: 0.4, trapear: 1.6, caidos: 0.9, canasta: 0.4, calmar: 0.55, dejarCanastas: 0.4 };

// ---------- Clientes ----------
export type TipoCliente = 'abuelita' | 'mama' | 'adolescente' | 'ejecutivo' | 'deportista' | 'famoso';
export interface DatosCliente {
  nombre: string;
  velocidad: number;
  paciencia: number; // segundos de espera a ritmo 1
  basura: number; // probabilidad de tirar basura después de tomar algo
  propinaExtra: number; // se suma si sale feliz
  prefiere: string[]; // secciones que elige más seguido
  desde: number; // día de la tiendita en que aparece
}
export const CLIENTES: Record<TipoCliente, DatosCliente> = {
  abuelita: { nombre: 'Abuelita', velocidad: 1.15, paciencia: 63, basura: 0, propinaExtra: 0, prefiere: ['panaderia', 'lacteos', 'frutas', 'arepas'], desde: 1 },
  mama: { nombre: 'Mamá', velocidad: 1.5, paciencia: 50, basura: 0, propinaExtra: 0, prefiere: ['lacteos', 'frutas', 'abarrotes', 'carnes'], desde: 1 },
  adolescente: { nombre: 'Adolescente', velocidad: 1.8, paciencia: 38, basura: 0.5, propinaExtra: 0, prefiere: ['bebidas', 'abarrotes', 'congelados', 'wafles'], desde: 6 },
  ejecutivo: { nombre: 'Ejecutivo apurado', velocidad: 2.0, paciencia: 29, basura: 0, propinaExtra: 3, prefiere: ['bebidas', 'congelados', 'abarrotes', 'arepas'], desde: 11 },
  deportista: { nombre: 'Chica deportista', velocidad: 1.95, paciencia: 40, basura: 0, propinaExtra: 1, prefiere: ['frutas', 'bebidas', 'carnes'], desde: 16 },
  famoso: { nombre: 'Famoso', velocidad: 1.35, paciencia: 32, basura: 0, propinaExtra: 12, prefiere: ['bebidas', 'panaderia', 'frutas', 'wafles'], desde: 999 },
};
/** Ritmo al que baja la paciencia según lo que esté haciendo el cliente. */
export const RITMO_PACIENCIA = {
  caminando: 0.08, esperandoProducto: 1.0, enFila: 0.7, siendoAtendido: 0.2, filaSinCajero: 1.2, esperandoCanasta: 1.0, cercaDeMugre: 0.35,
};
/** Cada adorno baja un 10 % el ritmo al que se pierde paciencia. */
export const ALIVIO_DECORACION = 0.1;
export const RESBALON = 0.18; // paciencia que se pierde al pisar un charco
export const PROPINA = [0, 1, 3]; // enojado, normal, feliz
export const UNIDADES_MAX = (dia: number) => (dia <= 2 ? 1 : 2); // unidades que lleva de cada producto

// ---------- Problemas del día ----------
export const PROBLEMAS = {
  derrameCada: 26, // s entre derrames (el día lluvioso, la mitad)
  ladronVel: 1.95,
  ladronRoba: 2,
  ninaVel: 2.4,
  ninaTumba: 2,
  ninaVitrinas: 4,
  famosoMirar: 3, // s que los demás se quedan mirando
};
export const CANASTAS_INICIO = 8;
/** Con cuánto arranca cada estante (fracción de lo que le cabe): el camión acaba de llegar y hay que llenarlos.
 *  Así no se gana el día quedándose en la caja: sin reponer se acaba todo y los clientes se van. */
export function stockInicial(dia: number, evento: string | null, legendario: boolean) {
  if (legendario) return 0.3;
  if (dia <= 1) return 0.8;
  if (evento === 'Hora pico' || evento === 'Gran día' || evento === 'Gran final') return 0.3;
  return dia <= 3 ? 0.55 : 0.4;
}
export const CANASTA_ABANDONO = { enojado: 0.3, normal: 0.05 };

// ---------- Mejoras que se compran entre días ----------
export type GrupoMejora = 'Él' | 'Bodega' | 'Tienda' | 'Ayudantes';
export interface Mejora {
  id: string;
  grupo: GrupoMejora;
  nombre: string;
  niveles: { precio: number; texto: string }[];
  desde: number; // día en que aparece en el catálogo
}
/** Las mejoras se compran con estrellas: cada estrella nueva de un día da 1 y cada luna nueva da 5. */
export const FICHAS = { estrella: 1, luna: 5 };
export const MEJORAS: Mejora[] = [
  { id: 'zapatos', grupo: 'Él', nombre: 'Tenis nuevos', desde: 2, niveles: [
    { precio: 3, texto: 'Caminan 15 % más rápido' }, { precio: 6, texto: 'Caminan 30 % más rápido' }, { precio: 10, texto: 'Caminan 47 % más rápido' }] },
  { id: 'carrito', grupo: 'Él', nombre: 'Carrito grande', desde: 5, niveles: [
    { precio: 6, texto: `Alcanza para ${CARRITO_UNIDADES[2]} estantes por viaje (ahora ${CARRITO_UNIDADES[1]})` },
    { precio: 12, texto: `Alcanza para ${CARRITO_UNIDADES[3]} estantes por viaje` }] },
  { id: 'trapero', grupo: 'Él', nombre: 'Trapero grande', desde: 8, niveles: [
    { precio: 3, texto: `Limpia ${TRAPERO[1]} manchas antes de lavarlo (ahora ${TRAPERO[0]})` }, { precio: 6, texto: `Limpia ${TRAPERO[2]} manchas antes de lavarlo` }] },
  { id: 'bodega', grupo: 'Bodega', nombre: 'Bodega ordenada', desde: 2, niveles: [
    { precio: 2, texto: 'Carga el carrito 28 % más rápido' }, { precio: 4, texto: 'Carga el carrito 48 % más rápido' }, { precio: 7, texto: 'Carga el carrito 64 % más rápido' }] },
  { id: 'alacena', grupo: 'Bodega', nombre: 'Estantes fáciles de llenar', desde: 3, niveles: [
    { precio: 2, texto: 'Arregla los estantes 28 % más rápido' }, { precio: 4, texto: 'Arregla los estantes 48 % más rápido' }, { precio: 7, texto: 'Arregla los estantes 64 % más rápido' }] },
  { id: 'planta', grupo: 'Tienda', nombre: 'Matera con flores', desde: 3, niveles: [{ precio: 2, texto: 'Los clientes pierden paciencia 10 % más lento' }] },
  { id: 'parlante', grupo: 'Tienda', nombre: 'Música en la tienda', desde: 6, niveles: [{ precio: 3, texto: 'Otro 10 % más de paciencia' }] },
  { id: 'canastas', grupo: 'Tienda', nombre: 'Más canastas', desde: 6, niveles: [{ precio: 2, texto: '11 canastas en la entrada (ahora 8)' }] },
  { id: 'caneca2', grupo: 'Tienda', nombre: 'Segunda caneca', desde: 7, niveles: [{ precio: 2, texto: 'Una caneca al fondo: menos camino para botar basura' }] },
  { id: 'globos', grupo: 'Tienda', nombre: 'Globos de fiesta', desde: 10, niveles: [{ precio: 4, texto: 'Otro 10 % más de paciencia' }] },
  { id: 'camara', grupo: 'Tienda', nombre: 'Cámara de seguridad', desde: 12, niveles: [{ precio: 5, texto: 'El ladrón se ve desde que entra y corre más lento' }] },
  { id: 'caja2', grupo: 'Tienda', nombre: 'Segunda caja', desde: 12, niveles: [{ precio: 12, texto: 'Otra caja con su propio cajero: cada cliente hace la fila más corta' }] },
  { id: 'cajera', grupo: 'Ayudantes', nombre: 'Cajera', desde: 7, niveles: [{ precio: 8, texto: 'Cobra sola en la caja, aunque más despacio que ustedes' }] },
  { id: 'aseo', grupo: 'Ayudantes', nombre: 'Aseo', desde: 9, niveles: [{ precio: 6, texto: 'Recoge basura, trapea charcos (y lava su trapero) y levanta productos caídos' }] },
  { id: 'reponedor', grupo: 'Ayudantes', nombre: 'Reponedor', desde: 10, niveles: [{ precio: 8, texto: 'Repone solo las vitrinas que están por acabarse' }] },
  { id: 'capacitacion', grupo: 'Ayudantes', nombre: 'Capacitación del equipo', desde: 11, niveles: [
    { precio: 6, texto: 'Los ayudantes caminan y trabajan 20 % más rápido' }, { precio: 10, texto: 'Caminan y trabajan 40 % más rápido' }] },
  { id: 'guardia', grupo: 'Ayudantes', nombre: 'Guardia', desde: 13, niveles: [{ precio: 6, texto: 'Atrapa ladrones y calma a la niña traviesa' }] },
  { id: 'reponedor2', grupo: 'Ayudantes', nombre: 'Segundo reponedor', desde: 15, niveles: [{ precio: 12, texto: 'Otro reponedor: se reparten las vitrinas' }] },
];

/** Ayudas de un solo uso: se compran entre días y se usan con un botón durante el día. */
export interface Ayuda {
  id: 'cafe' | 'musica' | 'limpieza';
  nombre: string;
  texto: string;
  precio: number;
  desde: number;
  duracion: number;
}
export const AYUDAS: Ayuda[] = [
  { id: 'cafe', nombre: 'Tinto', texto: 'Corren 40 % más rápido por 15 s', precio: 20, desde: 4, duracion: 15 },
  { id: 'musica', nombre: 'Canción favorita', texto: 'Nadie pierde paciencia por 10 s', precio: 25, desde: 6, duracion: 10 },
  { id: 'limpieza', nombre: 'Limpieza total', texto: 'Deja la tienda limpia al instante', precio: 25, desde: 8, duracion: 0 },
];
export const AYUDAS_MAX = 3;

// ---------- Combos ----------
export const COMBO = { cajaMax: 5, porVitrinaExtra: 2, pareja: 3, parejaVentana: 3.5 };

// ---------- Ayudantes ----------
export const AYUDANTE = { velocidad: 1.95, lentitud: 1.3, lentitudCajera: 1.7, cargaReponedor: 2, umbralReponedor: 0.34 };
/** Capacitación del equipo (nivel 0, 1, 2): más rápidos caminando y trabajando. */
export const CAPACITACION = [1, 1.2, 1.4];
