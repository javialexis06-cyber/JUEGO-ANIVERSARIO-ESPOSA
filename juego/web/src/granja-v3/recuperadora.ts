import { ARTICULOS } from './catalogo';
import { obtenerObjeto, RECETAS } from './objetos';
import type { Calidad } from './inventario';
import { RECETAS_CORRESPONDENCIA } from './correspondencia-datos';

/** Recuperadora: se le mete cualquier cosa que se haya fabricado o conseguido y devuelve un porcentaje de los
 * materiales que cuesta. El porcentaje sube con el nivel de la máquina y con la calidad de lo que se mete. */
export const NIVEL_RECUPERADORA:Record<string,number>={recuperadora_cobre:1,recuperadora_hierro:2,recuperadora_astral:3};
const BASE=[0,.4,.6,.8],POR_CALIDAD=[1,1.1,1.25,1.5];
/** Nunca devuelve todo: así no se puede ganar material fabricando y recuperando. */
export const TOPE_RECUPERACION=.95;
export function porcentajeRecuperacion(nivel:number,calidad:Calidad=0){return Math.min(TOPE_RECUPERACION,(BASE[nivel]??0)*(POR_CALIDAD[calidad]??1));}

/** Materiales por unidad que cuesta un objeto, o null si no se puede recuperar (herramientas, recursos básicos). */
export function materialesDe(articulo:string):Record<string,number>|null{
 if(articulo.startsWith('herramienta_')||NIVEL_RECUPERADORA[articulo])return null;
 if(articulo.startsWith('creacion_')){const a=ARTICULOS.find(a=>a.id===articulo.slice(9));return a&&Object.keys(a.receta).length?{...a.receta}:null;}
 // La receta básica (la primera) del objeto, repartida entre lo que produce.
 // Sin identidad de receta en cada pila, las alternativas usan solo materiales compartidos y su coste mínimo.
 // Así un aspersor con madera nunca devuelve hierro, ni un guiso de pan produce leche o trufas al reciclarlo.
 const r=RECETAS.find(r=>r.salida.articulo===articulo);
 if(r&&Object.keys(r.ingredientes).length){const c:Record<string,number>={},alternativas=(RECETAS_CORRESPONDENCIA.some(r=>r.salida.articulo===articulo)||['trampa_cebo','conector_produccion'].includes(articulo))?RECETAS.filter(r=>r.salida.articulo===articulo):[r];for(const [k,v] of Object.entries(r.ingredientes)){const minimo=Math.min(v/r.salida.cantidad,...alternativas.map(a=>(a.ingredientes[k]??0)/a.salida.cantidad));if(minimo>0)c[k]=minimo;}return Object.keys(c).length?c:null;}
 const d=obtenerObjeto(articulo);if(!d||d.categoria==='recurso'||d.categoria==='herramienta'||d.categoria==='insumo')return null;
 // Lo que no tiene receta se vuelve materia prima: minerales y gemas en piedra, lo orgánico en abono
 if(d.categoria==='mineral')return {piedra:Math.max(1,Math.round(d.precioVenta/15))};
 if(['comida','producto','pez','semilla'].includes(d.categoria))return {fertilizante:Math.max(.5,d.precioVenta/40)};
 return null;
}

/** Lo que saldría (en promedio) de recuperar `cantidad` unidades. */
export function previsionRecuperacion(articulo:string,cantidad:number,nivel:number,calidad:Calidad=0):Record<string,number>|null{
 const m=materialesDe(articulo);if(!m)return null;const p=porcentajeRecuperacion(nivel,calidad),r:Record<string,number>={};
 for(const [k,v] of Object.entries(m))r[k]=v*cantidad*p;return r;
}
