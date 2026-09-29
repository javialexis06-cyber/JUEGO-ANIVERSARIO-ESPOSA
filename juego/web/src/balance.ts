// Números del juego en un solo lugar (se ajustan probando). Coordenadas en metros de Blender.
import type { P } from './navegacion';

// ---------- Vitrinas ----------
/** Unidades por tipo de vitrina y nivel (el carrito carga lo justo para llenar una: cada viaje rinde lo que ella tenga). */
export const CAPACIDAD: Record<string, number[]> = {
  estante: [0, 5, 8, 12], frutas: [0, 5, 8, 12], nevera: [0, 5, 8, 11], vitrina: [0, 4, 6, 9],
  congelador: [0, 5, 7, 10], panaderia: [0, 5, 7, 10], bebidas: [0, 5, 8, 12],
};
/** Monedas por unidad vendida. */
export const PRECIO: Record<string, number> = { frutas: 5, lacteos: 6, abarrotes: 6, bebidas: 5, panaderia: 6, congelados: 8, carnes: 9 };

// ---------- Él y las mejoras que lo aceleran ----------
// (todo va más rápido que al principio: los días duran 1:30)
export const VELOCIDAD_EL = [2.6, 2.95, 3.3, 3.7]; // m/s según «zapatos»
export const CARGA_BODEGA = { base: 1.5, porEstante: 0.25, mejora: [1, 0.72, 0.52, 0.36] }; // s, × «bodega»
export const REPONER = { base: 1.4, mejora: [1, 0.72, 0.52, 0.36] }; // s por vitrina, × «alacena»
/** Estantes que alcanza a llenar el carrito en un viaje, según «carrito»: carga lo justo para dejar cada uno lleno. */
export const ESTANTES_CARRITO = [0, 1, 2, 3];
export const COBRO = { base: [0, 1.2, 0.8, 0.55], porUnidad: [0, 0.45, 0.3, 0.2] }; // s por cliente, según nivel de la caja
export const RECOGER = { basura: 0.6, botar: 0.4, trapear: 1.6, caidos: 0.9, canasta: 0.4, calmar: 0.55 };

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
  abuelita: { nombre: 'Abuelita', velocidad: 1.15, paciencia: 63, basura: 0, propinaExtra: 0, prefiere: ['panaderia', 'lacteos', 'frutas'], desde: 1 },
  mama: { nombre: 'Mamá', velocidad: 1.5, paciencia: 50, basura: 0, propinaExtra: 0, prefiere: ['lacteos', 'frutas', 'abarrotes'], desde: 1 },
  adolescente: { nombre: 'Adolescente', velocidad: 1.8, paciencia: 38, basura: 0.5, propinaExtra: 0, prefiere: ['bebidas', 'abarrotes', 'congelados'], desde: 6 },
  ejecutivo: { nombre: 'Ejecutivo apurado', velocidad: 2.0, paciencia: 29, basura: 0, propinaExtra: 3, prefiere: ['bebidas', 'congelados', 'abarrotes'], desde: 11 },
  deportista: { nombre: 'Chica deportista', velocidad: 1.95, paciencia: 40, basura: 0, propinaExtra: 1, prefiere: ['frutas', 'bebidas'], desde: 16 },
  famoso: { nombre: 'Famoso', velocidad: 1.35, paciencia: 32, basura: 0, propinaExtra: 12, prefiere: ['bebidas', 'panaderia', 'frutas'], desde: 99 },
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
export const CANASTA_ABANDONO = { enojado: 0.3, normal: 0.05 };

// ---------- Tiendita: puntos fijos ----------
export const PUNTOS_TIENDA: Record<number, {
  caneca: P; caneca2: P; canastas: P; guardia: P;
  decoracion: Record<string, { p: P; rot: number; escala: number; obstaculo?: [number, number, number, number] }>;
}> = {
  1: {
    caneca: { x: 3.3, y: -3.95 },
    caneca2: { x: 5.45, y: 2.5 },
    canastas: { x: -5.4, y: -3.65 },
    guardia: { x: -4.3, y: -1.5 },
    decoracion: {
      planta: { p: { x: 5.5, y: 0.0 }, rot: 0, escala: 1.1, obstaculo: [5.1, -0.4, 5.9, 0.4] },
      parlante: { p: { x: 5.5, y: -1.1 }, rot: -Math.PI / 2, escala: 1.0, obstaculo: [5.2, -1.4, 5.8, -0.8] },
      globos: { p: { x: -4.6, y: -4.05 }, rot: 0, escala: 1.0, obstaculo: [-4.9, -4.35, -4.3, -3.75] },
      camara: { p: { x: -5.95, y: 0.4 }, rot: -Math.PI / 2, escala: 1.0 },
    },
  },
};

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
  { id: 'zapatos', grupo: 'Él', nombre: 'Tenis para Él', desde: 2, niveles: [
    { precio: 3, texto: 'Camina 15 % más rápido' }, { precio: 6, texto: 'Camina 30 % más rápido' }, { precio: 10, texto: 'Camina 47 % más rápido' }] },
  { id: 'carrito', grupo: 'Él', nombre: 'Carrito grande', desde: 3, niveles: [
    { precio: 5, texto: 'Alcanza para llenar 2 estantes por viaje (ahora 1)' }, { precio: 10, texto: 'Alcanza para 3 estantes por viaje' }] },
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
  { id: 'cajera', grupo: 'Ayudantes', nombre: 'Cajera', desde: 7, niveles: [{ precio: 8, texto: 'Cobra sola en la caja, aunque más despacio que Él' }] },
  { id: 'aseo', grupo: 'Ayudantes', nombre: 'Aseo', desde: 9, niveles: [{ precio: 6, texto: 'Recoge basura, trapea charcos y levanta productos caídos' }] },
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
  { id: 'cafe', nombre: 'Tinto', texto: 'Él corre 40 % más rápido por 15 s', precio: 20, desde: 4, duracion: 15 },
  { id: 'musica', nombre: 'Canción favorita', texto: 'Nadie pierde paciencia por 10 s', precio: 25, desde: 6, duracion: 10 },
  { id: 'limpieza', nombre: 'Limpieza total', texto: 'Deja la tienda limpia al instante', precio: 25, desde: 8, duracion: 0 },
];
export const AYUDAS_MAX = 3;

// ---------- Combos ----------
export const COMBO = { cajaMax: 5, porVitrinaExtra: 2 };

// ---------- Ayudantes ----------
export const AYUDANTE = { velocidad: 1.95, lentitud: 1.3, lentitudCajera: 1.7, cargaReponedor: 2, umbralReponedor: 0.34 };
/** Capacitación del equipo (nivel 0, 1, 2): más rápidos caminando y trabajando. */
export const CAPACITACION = [1, 1.2, 1.4];
