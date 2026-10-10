import { leerHuevo } from './ganaderia';
/** Casillas y cantidades son datos de juego; inventario es su índice de consulta. */
import { obtenerObjeto } from './objetos';
export type Calidad=0|1|2|3;
export interface Pila {articulo:string;cantidad:number;calidad?:Calidad}
export const calidadPila=(p:Pila|null|undefined):Calidad=>p?.calidad??0;
export const mismaPila=(a:Pila,b:Pila)=>a.articulo===b.articulo&&calidadPila(a)===calidadPila(b);
export const MAX_PILA=999;
export const articuloValido=(id:unknown):id is string=>typeof id==='string'&&/^[a-z0-9_]{1,99}$/.test(id)&&(!id.startsWith('huevo_fertil_')||!!leerHuevo(id))&&!['__proto__','constructor','prototype'].includes(id);
export const limitePila=(articulo:string)=>obtenerObjeto(articulo)?.pilaMax??MAX_PILA;
export const CASILLAS_INICIALES=24;
export const CASILLAS_AMPLIADAS=36;
export function resumirCasillas(casillas:(Pila|null)[]):Record<string,number>{
 const total:Record<string,number>={};for(const p of casillas)if(p)total[p.articulo]=(total[p.articulo]||0)+p.cantidad;return total;
}
/** Devuelve una copia modificada o null. Nunca modifica parcialmente una mochila. */
export function cambiarCantidad(casillas:(Pila|null)[],articulo:string,cantidad:number,calidad?:Calidad):(Pila|null)[]|null{
 if(!Number.isSafeInteger(cantidad)||!articuloValido(articulo)||!Array.isArray(casillas)||(calidad!==undefined&&![0,1,2,3].includes(calidad)))return null;
 const limite=limitePila(articulo);
 const copia=casillas.map(p=>p?{...p}:null);let restante=Math.abs(cantidad);
 if(cantidad<0){
  if(copia.reduce((n,p)=>n+(p?.articulo===articulo&&(calidad===undefined||calidadPila(p)===calidad)?p.cantidad:0),0)<restante)return null;
  for(let i=copia.length-1;i>=0&&restante;i--){const p=copia[i];if(p?.articulo!==articulo||(calidad!==undefined&&calidadPila(p)!==calidad))continue;const n=Math.min(p.cantidad,restante);p.cantidad-=n;restante-=n;if(!p.cantidad)copia[i]=null;}
 }else{
  for(const p of copia)if(p?.articulo===articulo&&calidadPila(p)===(calidad??0)&&restante){const n=Math.min(Math.max(0,limite-p.cantidad),restante);p.cantidad+=n;restante-=n;}
  for(let i=0;i<copia.length&&restante;i++)if(!copia[i]){const n=Math.min(limite,restante);copia[i]={articulo,cantidad:n,...(calidad?{calidad}:{})};restante-=n;}
 }
 return restante?null:copia;
}
/** Conserva excedentes de versiones anteriores en un almacén recuperable, sin borrarlos. */
export function distribuirInventario(inventario:Record<string,number>,capacidad=CASILLAS_INICIALES){
 let casillas:(Pila|null)[]=Array(capacidad).fill(null);const almacen:Record<string,number>={};
 for(const [articulo,total] of Object.entries(inventario)){
  if(!articuloValido(articulo)||!Number.isSafeInteger(total)||total<0)throw new Error("Inventario inválido.");
  let resto=total;while(resto>0){const n=Math.min(limitePila(articulo),resto),nuevas=cambiarCantidad(casillas,articulo,n);if(!nuevas){almacen[articulo]=resto;break;}casillas=nuevas;resto-=n;}
 }
 return {casillas,almacen};
}
export function moverPila(casillas:(Pila|null)[],desde:number,hasta:number,cantidad?:number):(Pila|null)[]|null{
 if(!Number.isInteger(desde)||!Number.isInteger(hasta)||desde<0||hasta<0||desde>=casillas.length||hasta>=casillas.length||desde===hasta)return null;
 const copia=casillas.map(p=>p?{...p}:null),origen=copia[desde],destino=copia[hasta];if(!origen)return null;
 const n=cantidad??origen.cantidad;if(!Number.isInteger(n)||n<1||n>origen.cantidad)return null;
 if(destino&&!mismaPila(destino,origen)){if(n!==origen.cantidad)return null;copia[desde]=destino;copia[hasta]=origen;return copia;}
 const movido=Math.min(n,limitePila(origen.articulo)-(destino?.cantidad||0));if(movido<=0)return null;
 copia[hasta]={...origen,cantidad:(destino?.cantidad||0)+movido};origen.cantidad-=movido;if(!origen.cantidad)copia[desde]=null;return copia;
}
