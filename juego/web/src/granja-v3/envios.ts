import { cambiarCantidad, calidadPila, limitePila } from './inventario';
import type { Pila } from './inventario';
import { obtenerObjeto } from './objetos';
import { valorVenta } from './valor-venta';
export const ARTICULO_ENVIO='caja_envio', CASILLAS_ENVIO=24;
export interface CajaEnvio {edificioId:string;casillas:(Pila|null)[]}
export interface EstadoEnvios {version:1;cajas:CajaEnvio[]}
export interface LineaEnvio extends Pila {unitario:number;total:number}
export interface ResumenEnvios {version:1;lineas:LineaEnvio[];total:number;cajas:number}
export const crearEnvios=():EstadoEnvios=>({version:1,cajas:[]});
export const crearCajaEnvio=(edificioId:string):CajaEnvio=>({edificioId,casillas:Array(CASILLAS_ENVIO).fill(null)});
export function admiteEnvio(p:Pila){const d=obtenerObjeto(p.articulo);return !!d&&valorVenta(p)>0&&!['herramienta','equipo','estructura','maquina','contenedor'].includes(d.categoria);}
export const valorCaja=(c:CajaEnvio)=>c.casillas.reduce((n,p)=>n+(p?valorVenta(p)*p.cantidad:0),0);
export const valorEnvios=(e:EstadoEnvios)=>e.cajas.reduce((n,c)=>n+valorCaja(c),0);
/** Transferencia completa: una mochila/caja llena conserva ambas fuentes intactas. */
export function transferirEnvio(c:CajaEnvio,mochila:(Pila|null)[],sentido:'depositar'|'retirar',casilla:number,cantidad:number){
 const origen=sentido==='depositar'?mochila:c.casillas;
 if(!Number.isInteger(casilla)||casilla<0||casilla>=origen.length||!Number.isInteger(cantidad)||cantidad<1)return {ok:false as const,mensaje:'Casilla o cantidad inválida.'};
 const p=origen[casilla];if(!p||cantidad>p.cantidad)return {ok:false as const,mensaje:'No hay esa cantidad en la casilla.'};
 if(sentido==='depositar'&&!admiteEnvio(p))return {ok:false as const,mensaje:'Guarda herramientas, equipo y construcciones en un cofre. La caja envía productos y materiales.'};
 const destino=cambiarCantidad(sentido==='depositar'?c.casillas:mochila,p.articulo,cantidad,calidadPila(p));
 if(!destino)return {ok:false as const,mensaje:sentido==='depositar'?'La caja está llena. Retira productos o coloca otra.':'La mochila está llena. Libera espacio antes de retirar.'};
 const fuente=origen.map(p=>p?{...p}:null);fuente[casilla]!.cantidad-=cantidad;if(!fuente[casilla]!.cantidad)fuente[casilla]=null;
 return {ok:true as const,mochila:sentido==='depositar'?fuente:destino,casillas:sentido==='depositar'?destino:fuente};
}
/** Solo se invoca dentro de la transacción nocturna; consultar no vende ni vacía. */
export function resumenEnvios(e:EstadoEnvios):ResumenEnvios {
 const lineas=new Map<string,LineaEnvio>();let cajas=0,total=0;
 for(const c of e.cajas){if(c.casillas.some(Boolean))cajas++;for(const p of c.casillas)if(p){const calidad=calidadPila(p),key=p.articulo+':'+calidad,unitario=valorVenta(p),v=unitario*p.cantidad,prev=lineas.get(key);if(prev){prev.cantidad+=p.cantidad;prev.total+=v;}else lineas.set(key,{articulo:p.articulo,calidad,cantidad:p.cantidad,unitario,total:v});total+=v;}}
 return {version:1,lineas:[...lineas.values()].sort((a,b)=>a.articulo.localeCompare(b.articulo)||calidadPila(a)-calidadPila(b)),total,cajas};
}
const entero=(v:unknown,min=0,max=1e9)=>typeof v==='number'&&Number.isInteger(v)&&v>=min&&v<=max;
export function enviosValidos(v:unknown,edificios:{id:string;articulo:string}[]):v is EstadoEnvios{
 const e=v as EstadoEnvios;if(!e||e.version!==1||!Array.isArray(e.cajas)||e.cajas.length>1500)return false;
 const ids=new Set<string>(),fisicas=edificios.filter(e=>e.articulo===ARTICULO_ENVIO);if(e.cajas.length!==fisicas.length)return false;
 return e.cajas.every(c=>!!c&&typeof c.edificioId==='string'&&!ids.has(c.edificioId)&&(ids.add(c.edificioId),true)&&fisicas.some(e=>e.id===c.edificioId)&&Array.isArray(c.casillas)&&c.casillas.length===CASILLAS_ENVIO&&c.casillas.every(p=>p===null||!!p&&entero(p.cantidad,1,limitePila(p.articulo))&&(p.calidad===undefined||entero(p.calidad,0,3))&&admiteEnvio(p)));
}
export function resumenEnviosValido(v:unknown):v is ResumenEnvios{
 const r=v as ResumenEnvios;if(!r||r.version!==1||!Array.isArray(r.lineas)||r.lineas.length>2000||!entero(r.total)||!entero(r.cajas,0,1500)||!!r.cajas!==!!r.lineas.length)return false;
 const ids=new Set<string>();return r.lineas.every(p=>{const key=p?.articulo+':'+(p?.calidad??0);return !!p&&!ids.has(key)&&(ids.add(key),true)&&admiteEnvio(p)&&(p.calidad===undefined||entero(p.calidad,0,3))&&entero(p.cantidad,1)&&entero(p.unitario,1)&&entero(p.total,1)&&p.total===p.cantidad*p.unitario;})&&r.total===r.lineas.reduce((n,p)=>n+p.total,0);
}
