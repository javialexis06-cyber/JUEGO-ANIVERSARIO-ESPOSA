import { nivelEdificio } from './refugios';
export { nivelEdificio, capacidadRefugio } from './refugios';
import { ARTICULOS, sectorDeCelda, type Articulo } from './catalogo';
import type { Edificio, EstadoGranja } from './estado';
import { calidadPila, limitePila, type Pila } from './inventario';
import { aguaEn, huecoEn } from './paisaje';
import { huellaProduccion } from './produccion';
import { esSenderoGranja } from './caminos-mundo';

export interface Emplazamiento {x:number;z:number;giro:number}
export interface EncargoObra {
 id:string;tipo:'nueva'|'mejora';articulo:string;edificioId:string|null;nivel:1|2|3;
 encargadaDia:number;colocadaDia:number|null;lugar:Emplazamiento|null;jornadas:number;
 monedas:number;materiales:Pila[];
}
export interface EstadoObras {version:1;encargos:EncargoObra[]}
export interface ObraTerminada {edificioId:string;articulo:string;tipo:'nueva'|'mejora';nivel:1|2|3}
export const crearObras=():EstadoObras=>({version:1,encargos:[]});
export const MAX_ENCARGOS=8;
export const requiereObra=(a:Articulo)=>a.categoria==='casa'||a.categoria==='refugio'||a.id==='invernadero';
export function costeObra(a:Articulo,nivel:1|2|3=1){
 if(nivel===1)return {monedas:a.precio,materiales:a.receta,noches:3};
 return {monedas:a.precio*(nivel===2?2:4),materiales:{madera:nivel===2?40:70,piedra:nivel===2?20:35,...(nivel===2?{cobre:4}:{hierro:6}),...(a.clima==='templado'?{}:{cristal:nivel===2?4:8})} as Record<string,number>,noches:2};
}
export function huellaObra(o:Pick<EncargoObra,'articulo'|'lugar'>){const a=ARTICULOS.find(a=>a.id===o.articulo)!,p=o.lugar!,d=a.fondo+(a.corral??0);return {x:p.x,z:p.z,ancho:p.giro%2?d:a.ancho,fondo:p.giro%2?a.ancho:d};}
export const contieneObra=(h:{x:number;z:number;ancho:number;fondo:number},x:number,z:number)=>x>=h.x&&x<h.x+h.ancho&&z>=h.z&&z<h.z+h.fondo;
export const intersectaHuellaObra=(h:{x:number;z:number;ancho:number;fondo:number},x:number,z:number,radio=.24)=>x+radio>h.x&&x-radio<h.x+h.ancho&&z+radio>h.z&&z-radio<h.z+h.fondo;
export function entradaObra(o:Pick<EncargoObra,'articulo'|'lugar'>){const h=huellaObra(o),p=o.lugar!;return p.giro===0?{x:h.x+Math.floor(h.ancho/2),z:h.z+h.fondo}:p.giro===1?{x:h.x-1,z:h.z+Math.floor(h.fondo/2)}:p.giro===2?{x:h.x+Math.floor(h.ancho/2),z:h.z-1}:{x:h.x+h.ancho,z:h.z+Math.floor(h.fondo/2)};}
export function celdaReservadaObra(s:Pick<EstadoGranja,'obras'>,x:number,z:number,entrada=true){return s.obras.encargos.some(o=>{if(o.tipo!=='nueva'||!o.lugar)return false;const p=entradaObra(o);return contieneObra(huellaObra(o),x,z)||entrada&&p.x===x&&p.z===z;});}
/** La cuadrilla solo atiende una obra emplazada. Los contratos sin lugar no frenan otras obras. */
export const obraActiva=(s:Pick<EstadoGranja,'obras'>)=>s.obras.encargos.find(o=>o.lugar!==null);
export function plazoObra(s:Pick<EstadoGranja,'obras'>,o:EncargoObra){if(!o.lugar)return null;let noches=0;for(const e of s.obras.encargos){if(!e.lugar)continue;noches+=costeObra(ARTICULOS.find(a=>a.id===e.articulo)!,e.nivel).noches-e.jornadas;if(e.id===o.id)return noches;}return null;}

export function obrasTerminadasValidas(v:unknown):v is ObraTerminada[]{return Array.isArray(v)&&v.length<=MAX_ENCARGOS&&v.every(o=>o&&typeof o.edificioId==='string'&&/^[a-z0-9_]{1,99}$/.test(o.edificioId)&&ARTICULOS.some(a=>a.id===o.articulo&&requiereObra(a))&&['nueva','mejora'].includes(o.tipo)&&[1,2,3].includes(o.nivel)&&(o.tipo!=='nueva'||o.nivel===1));}
/** Valida pagos, calendario, vínculo y reservas antes de aceptar una partida. */
export function errorObras(s:EstadoGranja):string|null {
 const v=s.obras;if(!v||v.version!==1||!Array.isArray(v.encargos)||v.encargos.length>MAX_ENCARGOS)return 'encargos de carpintería inválidos';
 const int=(x:unknown,a=0,b=1e9)=>Number.isSafeInteger(x)&&Number(x)>=a&&Number(x)<=b;
 // Primero la forma de todos los contratos: las comparaciones entre reservas no leen datos corruptos.
 if(v.encargos.some(o=>!o||!['nueva','mejora'].includes(o.tipo)||!ARTICULOS.some(a=>a.id===o.articulo&&requiereObra(a))||o.lugar!==null&&(!o.lugar||!int(o.lugar.x,-1000,1000)||!int(o.lugar.z,-1000,1000)||!int(o.lugar.giro,0,3))))return 'forma de contrato inválida';
 const ids=new Set([...s.edificios,...s.animales,...s.obstaculos,...s.drops,...s.frutales,...s.compania.animales,...s.produccion.cofres,...s.produccion.maquinas,...s.produccion.estructuras,...s.ganaderia.trufas].map(e=>e.id));const mejoras=new Set<string>();
 for(const o of v.encargos){
  const a=ARTICULOS.find(a=>a.id===o?.articulo);if(!o||!a||!requiereObra(a)||typeof o.id!=='string'||!/^[a-z0-9_]{1,99}$/.test(o.id)||ids.has(o.id)||!['nueva','mejora'].includes(o.tipo)||!int(o.nivel,1,3)||!int(o.encargadaDia,0,s.jornada.diasCompletados))return 'contrato de obra inválido';ids.add(o.id);
  const c=costeObra(a,o.nivel);if(o.monedas!==c.monedas||!int(o.jornadas,0,c.noches-1)||!Array.isArray(o.materiales)||o.materiales.length>32)return 'pago o plazo de obra inválido';
  const pagado:Record<string,number>={};for(const p of o.materiales){if(!p||!Object.hasOwn(c.materiales,p.articulo)||!int(p.cantidad,1,limitePila(p.articulo))||p.calidad!==undefined&&!int(p.calidad,0,3))return 'materiales de obra inválidos';pagado[p.articulo]=(pagado[p.articulo]??0)+p.cantidad;}
  if(Object.entries(c.materiales).some(([k,n])=>pagado[k]!==n))return 'materiales de obra incompletos';
  if(o.lugar===null){if(o.tipo!=='nueva'||o.colocadaDia!==null||o.jornadas!==0)return 'obra sin emplazamiento incoherente';}
  else {const p=o.lugar;if(!p||!int(p.x,-1000,1000)||!int(p.z,-1000,1000)||!int(p.giro,0,3)||!int(o.colocadaDia,o.encargadaDia,s.jornada.diasCompletados)||o.jornadas>s.jornada.diasCompletados-o.colocadaDia!)return 'emplazamiento de obra inválido';}
  if(o.tipo==='nueva'){if(o.edificioId!==null||o.nivel!==1)return 'nueva construcción incoherente';}
  else {const b=s.edificios.find(b=>b.id===o.edificioId);if(!b?.especie||b.articulo!==o.articulo||o.nivel!==nivelEdificio(b)+1||mejoras.has(b.id)||!o.lugar||b.x!==o.lugar.x||b.z!==o.lugar.z||b.giro!==o.lugar.giro)return 'ampliación de refugio inválida';mejoras.add(b.id);}
  if(o.tipo==='nueva'&&o.lugar){const h=huellaObra(o),p=entradaObra(o),celdas=[p];if(s.posicionExterior?.zona==='granja'&&intersectaHuellaObra(h,s.posicionExterior.x,s.posicionExterior.z)||s.compania.animales.some(a=>a.posicion.zona==='granja'&&intersectaHuellaObra(h,a.posicion.x,a.posicion.z,a.tipo==='caballo'?.45:.2)))return 'obra encierra un habitante';for(let z=h.z;z<h.z+h.fondo;z++)for(let x=h.x;x<h.x+h.ancho;x++)celdas.push({x,z});
   for(const {x,z} of celdas){if(!s.sectorIds.includes(sectorDeCelda(x,z)?.id??-1)||aguaEn(s.paisaje,x,z)||huecoEn(s.paisaje,x,z)||esSenderoGranja(x,z)||s.parcelas.some(p=>p.x===x&&p.z===z)||s.frutales.some(f=>!f.edificioId&&f.x===x&&f.z===z)||s.obstaculos.some(n=>(n.zona??'granja')==='granja'&&n.hp>0&&n.x===x&&n.z===z)||s.edificios.some(b=>contieneObra(huellaObra({articulo:b.articulo,lugar:b}),x,z))||[...s.produccion.cofres,...s.produccion.maquinas,...s.produccion.estructuras].some(n=>n.zona==='granja'&&contieneObra(huellaProduccion(n),x,z)))return 'reserva de obra ocupada';}
   for(const otra of v.encargos){if(otra.id===o.id||otra.tipo!=='nueva'||!otra.lugar)continue;const hh=huellaObra(otra),puerta=entradaObra(otra);if(celdas.some(p=>contieneObra(hh,p.x,p.z)||p.x===puerta.x&&p.z===puerta.z))return 'obras superpuestas';}
   for(const b of s.edificios){const a=ARTICULOS.find(a=>a.id===b.articulo)!;if(requiereObra(a)||a.id==='hogar_mascota'){const p=entradaObra({articulo:b.articulo,lugar:b});if(contieneObra(h,p.x,p.z))return 'obra bloquea una entrada';}}
  }
 }
 const activa=obraActiva(s);if(v.encargos.some(o=>o.jornadas>0&&o.id!==activa?.id))return 'cuadrilla de obras incoherente';
 if(s.edificios.length+v.encargos.filter(o=>o.tipo==='nueva').length>1500||s.invernaderos.length+v.encargos.filter(o=>o.tipo==='nueva'&&o.articulo==='invernadero').length>30)return 'límite de construcciones excedido';
 return null;
}

/** Reserva las calidades concretas consumidas; cancelar podrá restituirlas exactamente. */
export function materialesObra(casillas:(Pila|null)[],receta:Record<string,number>){const resultado:Pila[]=[];for(const [articulo,cantidad] of Object.entries(receta)){let resto=cantidad;for(let i=casillas.length-1;i>=0&&resto;i--){const p=casillas[i];if(p?.articulo!==articulo)continue;const n=Math.min(resto,p.cantidad);resultado.push({articulo,cantidad:n,...(calidadPila(p)?{calidad:calidadPila(p)}:{})});resto-=n;}}return resultado;}
