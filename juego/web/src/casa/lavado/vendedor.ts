// El vendedor ambulante (el mercader del original): un señor con su carrito de jabones que se para en un sitio del
// escenario. Al acercarse se abre su puesto (la partida se pausa, como con un cofre) y se le compra con las gotas
// doradas recogidas en la partida (lo que se gasta ya no se lleva a la casa): las cinco armas de rebote, patitos
// dorados, el Monedero y, del otro lado del espejo, más tiradas, saltos, vetos y una carta.
import type { IdArma, IdEscenario } from './tipos';

export type IdVenta = 'hueso' | 'bombaBano' | 'barquito' | 'talco' | 'bolitasGel' | 'patito' | 'monedero' | 'tirar' | 'saltar' | 'vetar' | 'carta';

export interface DefVenta {
  id: IdVenta;
  nombre: string;
  desc: string;
  /** Gotas doradas (las de la partida). */
  precio: number;
  /** Lo que sube el precio con cada compra (para lo que se puede comprar varias veces). */
  sube?: number;
  /** Cuántas veces se puede comprar en una partida (sin esto, una sola). */
  max?: number;
  /** El ícono (del atlas de objetos). */
  icono: string;
  /** Solo del otro lado del espejo. */
  inverso?: boolean;
  /** Las armas de rebote: cuál da. */
  arma?: IdArma;
}

export const VENTAS: DefVenta[] = [
  { id: 'hueso', nombre: 'Hueso del perrito', desc: 'Rebota por toda la pantalla', precio: 300, icono: 'hueso', arma: 'hueso' },
  { id: 'bombaBano', nombre: 'Bomba de baño', desc: 'Rebota y revienta en espuma', precio: 300, icono: 'bombaBano', arma: 'bombaBano' },
  { id: 'barquito', nombre: 'Barquito de papel', desc: 'Navega de lado a lado atropellando mugrosos', precio: 300, icono: 'barquito', arma: 'barquito' },
  { id: 'talco', nombre: 'Talco de florecitas', desc: 'Nubecitas que rebotan y pican', precio: 300, icono: 'talco', arma: 'talco' },
  { id: 'bolitasGel', nombre: 'Bolitas de gel', desc: 'Bolitas de colores que rebotan entre los mugrosos', precio: 300, icono: 'bolitasGel', arma: 'bolitasGel' },
  { id: 'patito', nombre: 'Patito dorado', desc: 'Tu disfraz sube para siempre un poquito', precio: 400, sube: 100, max: 99, icono: 'patito' },
  { id: 'monedero', nombre: 'El Monedero', desc: 'Tesoro: el vendedor sale en todos los escenarios', precio: 1500, icono: 'monedero' },
  { id: 'tirar', nombre: 'Volver a tirar', desc: '+1 para esta partida', precio: 150, sube: 50, max: 20, icono: 'tirar', inverso: true },
  { id: 'saltar', nombre: 'Saltar', desc: '+1 para esta partida', precio: 60, sube: 20, max: 20, icono: 'saltar', inverso: true },
  { id: 'vetar', nombre: 'Vetar', desc: '+1 para esta partida', precio: 250, sube: 80, max: 20, icono: 'vetar', inverso: true },
  { id: 'carta', nombre: 'Una carta más', desc: 'Escoges otra carta mágica para esta partida', precio: 2500, icono: 'cofre', inverso: true },
];
export const VENTA = Object.fromEntries(VENTAS.map((v) => [v.id, v])) as Record<IdVenta, DefVenta>;
export const ID_VENTAS = VENTAS.map((v) => v.id);

/** Dónde se para el carrito en cada escenario (cerquita del principio, para que se vea pronto). */
export const PUESTO: Record<IdEscenario, [number, number]> = { cara: [620, -380], lavamanos: [820, -60], banera: [-700, 420], ducha: [700, 380], jabonera: [150, 620], desague: [-650, -420], desfile: [600, 420], espejo: [-620, 380], matera: [640, -360], tobogan: [900, 150] };
/** Sin el Monedero, el vendedor solo pasa por aquí. */
export const ESCENARIO_VENDEDOR: IdEscenario = 'lavamanos';
/** Qué tan cerca hay que llegar para que abra el puesto. */
export const RADIO_PUESTO = 46;
