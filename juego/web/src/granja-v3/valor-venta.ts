import { obtenerObjeto } from './objetos';
import { PRECIOS_VENTA } from './catalogo';
import type { Pila, Calidad } from './inventario';
/** Precio compartido por tiendas y envíos; redondeo por unidad antes de multiplicar. */
export const multiplicadorCalidad=(q:Calidad)=>[1,1.25,1.5,2][q];
export const valorVenta=(p:Pila)=>Math.floor((obtenerObjeto(p.articulo)?.precioVenta??PRECIOS_VENTA[p.articulo]??0)*multiplicadorCalidad(p.calidad??0));
