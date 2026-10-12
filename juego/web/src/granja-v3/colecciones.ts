import type { EstadoGranja, Resultado } from './estado';
import { CULTIVOS } from './catalogo';
import { atencionServicio } from './aldeanos';
import { calidadPila, cambiarCantidad, resumirCasillas, type Calidad, type Pila } from './inventario';
import { LOTES_COLECCION, loteDef, desbloqueoLote, type DefLote, type RequisitoLote } from './colecciones-datos';

export interface EntregaLote {objetivo:number;articulo:string;cantidad:number;calidad:Calidad}
export interface RegistroLote {id:string;iniciadoDia:number|null;completadoDia:number|null;entregas:EntregaLote[]}
export interface EstadoColecciones {version:1;lotes:RegistroLote[]}
export type AccionColeccion=
 |{tipo:'entregar';id:string;objetivo:number;casilla:number;cantidad:number}
 |{tipo:'retirar'|'completar';id:string}
 |{tipo:'comprar_semilla';cultivoId:string;cantidad:number};
const entero=(n:unknown,min=0,max=1e9):n is number=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=min&&n<=max;
const registro=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const mal=(mensaje:string):Resultado=>({ok:false,mensaje});
const bien=(mensaje:string):Resultado=>({ok:true,mensaje});
export const crearColecciones=():EstadoColecciones=>({version:1,lotes:LOTES_COLECCION.map(l=>({id:l.id,iniciadoDia:null,completadoDia:null,entregas:[]}))});
export const aceptaLote=(r:RequisitoLote,p:Pila)=>r.articulos.includes(p.articulo)&&calidadPila(p)>=r.calidad;
export const progresoLote=(r:RegistroLote,d:DefLote)=>d.requisitos.map((_,i)=>r.entregas.filter(e=>e.objetivo===i).reduce((n,e)=>n+e.cantidad,0));
export function puedeUsarArchivo(s:EstadoGranja,x:number,z:number){return s.zona==='pueblo'&&(s.servicio==='archivo'||s.servicio==='museo')&&!s.interior&&!s.aventura.destinoActual&&!s.jornada.resumenPendiente&&!s.festivales.actual&&!s.vidaSocial.actual&&Number.isFinite(x)&&Number.isFinite(z)&&x>=-4&&x<4&&z>=-3&&z<4&&atencionServicio(s.servicio,s.jornada.diasCompletados,s.jornada.minutos).abierto;}
export function semillasArchivo(s:EstadoGranja){const ids=new Set(s.colecciones.lotes.filter(r=>r.completadoDia!==null).flatMap(r=>loteDef(r.id)!.cultivos));return CULTIVOS.filter(c=>ids.has(c.id));}
export function donacionesColeccion(s:EstadoGranja){const resumen=new Map<string,EntregaLote>();for(const r of s.colecciones.lotes)if(r.completadoDia!==null)for(const e of r.entregas){const k=e.articulo+':'+e.calidad,antes=resumen.get(k);resumen.set(k,{...e,cantidad:(antes?.cantidad??0)+e.cantidad});}return [...resumen.values()];}
/** Todas las operaciones se preparan antes de alterar inventario, progreso o recompensa. */
export function actuarColeccion(s:EstadoGranja,a:AccionColeccion,x:number,z:number):Resultado {
 if(!puedeUsarArchivo(s,x,z))return mal('Visita el Museo del Valle durante su horario de atención.');
 if(a.tipo==='comprar_semilla'){
  const c=semillasArchivo(s).find(c=>c.id===a.cultivoId);if(!c||!entero(a.cantidad,1,99))return mal('Completa su lote y elige entre 1 y 99 semillas de la reserva.');
  if(c.requiere&&!s.desbloqueos.includes(c.requiere))return mal('Todavía no conoces el lugar de origen de esa semilla.');const coste=c.precio*a.cantidad;
  if(s.monedas<coste)return mal('No tienes suficientes monedas.');const casillas=cambiarCantidad(s.casillasInventario,c.semilla,a.cantidad);if(!casillas)return mal('Libera espacio para las semillas.');
  s.casillasInventario=casillas;s.inventario=resumirCasillas(casillas);s.monedas-=coste;return bien(`Guardaste ${a.cantidad} semillas de ${c.nombre.toLowerCase()}. Conservan sus requisitos de estación y clima.`);
 }
 const d=loteDef(a.id),r=s.colecciones.lotes.find(r=>r.id===a.id);if(!d||!r)return mal('Lote desconocido.');if(r.completadoDia!==null)return mal('Este lote ya quedó donado y su premio ya fue entregado.');
 if(a.tipo==='entregar'){
  if(!entero(a.objetivo,0,d.requisitos.length-1)||!entero(a.casilla,0,s.casillasInventario.length-1)||!entero(a.cantidad,1,999))return mal('Elige un requisito, una casilla y una cantidad válidos.');
  const q=d.requisitos[a.objetivo],p=s.casillasInventario[a.casilla];if(!p||!aceptaLote(q,p)||p.cantidad<a.cantidad)return mal('Esta pila no cumple el artículo, la cantidad o la calidad mínima.');
  if(progresoLote(r,d)[a.objetivo]+a.cantidad>q.cantidad)return mal('La cantidad supera lo pendiente en este requisito.');
  const casillas=s.casillasInventario.map(p=>p?{...p}:null),calidad=calidadPila(p);casillas[a.casilla]!.cantidad-=a.cantidad;if(!casillas[a.casilla]!.cantidad)casillas[a.casilla]=null;
  const entrega=r.entregas.find(e=>e.objetivo===a.objetivo&&e.articulo===p.articulo&&e.calidad===calidad);if(entrega)entrega.cantidad+=a.cantidad;else r.entregas.push({objetivo:a.objetivo,articulo:p.articulo,cantidad:a.cantidad,calidad});
  r.iniciadoDia??=s.jornada.diasCompletados;s.casillasInventario=casillas;s.inventario=resumirCasillas(casillas);return bien('Entrega reservada. Puedes recuperarla hasta cerrar el lote.');
 }
 if(a.tipo==='retirar'){
  if(!r.entregas.length)return mal('Este lote no tiene entregas reservadas.');let casillas=s.casillasInventario;
  for(const e of r.entregas){const copia=cambiarCantidad(casillas,e.articulo,e.cantidad,e.calidad);if(!copia)return mal('Libera espacio para recuperar todas las entregas con su calidad.');casillas=copia;}
  s.casillasInventario=casillas;s.inventario=resumirCasillas(casillas);r.entregas=[];r.iniciadoDia=null;return bien('Recuperaste todas las entregas y sus calidades.');
 }
 if(a.tipo!=='completar')return mal('Acción de colección desconocida.');
 if(progresoLote(r,d).some((n,i)=>n!==d.requisitos[i].cantidad))return mal('Completa todos los requisitos antes de donar el lote.');
 const flag=desbloqueoLote(d.id);if(s.monedas+d.monedas>1e9||s.desbloqueos.length>=100||s.desbloqueos.includes(flag))return mal('No se puede registrar la recompensa de este lote.');let casillas=s.casillasInventario;
 for(const p of d.premio){const copia=cambiarCantidad(casillas,p.articulo,p.cantidad,calidadPila(p));if(!copia)return mal('Libera espacio para recibir el premio completo.');casillas=copia;}
 s.casillasInventario=casillas;s.inventario=resumirCasillas(casillas);s.monedas+=d.monedas;s.desbloqueos.push(flag);r.completadoDia=s.jornada.diasCompletados;
 return bien(d.nombre+' donado. Recibiste su premio único.'+(d.cultivos.length?' Su reserva de semillas ya está abierta todo el año.':''));
}
/** Importaciones estrictas: no completar, devolver ni reiniciar registros dañados. */
export function coleccionesValidas(s:EstadoGranja):boolean {
 const v:unknown=s.colecciones,dia=s.jornada?.diasCompletados;if(!entero(dia)||!registro(v)||v.version!==1||!Array.isArray(v.lotes)||v.lotes.length!==LOTES_COLECCION.length)return false;
 const ids=new Set<string>();for(const valor of v.lotes){
  if(!registro(valor)||typeof valor.id!=='string'||ids.has(valor.id))return false;const d=loteDef(valor.id);if(!d)return false;ids.add(d.id);
  if(valor.iniciadoDia!==null&&!entero(valor.iniciadoDia,0,dia)||valor.completadoDia!==null&&!entero(valor.completadoDia,0,dia)||!Array.isArray(valor.entregas)||valor.entregas.length>d.requisitos.reduce((n,q)=>n+q.articulos.length*4,0))return false;
  const unicos=new Set<string>(),totales=d.requisitos.map(()=>0);for(const e of valor.entregas){
   if(!registro(e)||!entero(e.objetivo,0,d.requisitos.length-1)||typeof e.articulo!=='string'||!entero(e.calidad,0,3)||!entero(e.cantidad,1,d.requisitos[e.objetivo].cantidad)||!aceptaLote(d.requisitos[e.objetivo],{articulo:e.articulo,cantidad:e.cantidad,calidad:e.calidad as Calidad}))return false;
   const k=e.objetivo+':'+e.articulo+':'+e.calidad;if(unicos.has(k))return false;unicos.add(k);totales[e.objetivo]+=e.cantidad;if(totales[e.objetivo]>d.requisitos[e.objetivo].cantidad)return false;
  }
  if((valor.entregas.length===0)!==(valor.iniciadoDia===null))return false;
  if(valor.completadoDia!==null&&(valor.iniciadoDia===null||Number(valor.completadoDia)<Number(valor.iniciadoDia)||totales.some((n,i)=>n!==d.requisitos[i].cantidad)))return false;
  if(!Array.isArray(s.desbloqueos)||s.desbloqueos.includes(desbloqueoLote(d.id))!==(valor.completadoDia!==null))return false;
 }return true;
}
