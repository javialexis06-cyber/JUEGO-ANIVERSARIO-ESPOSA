import type { EstadoGranja, Resultado } from './estado';
import { aldeanoDef, puedeConversar, atencionServicio } from './aldeanos';
import { tiempoDia, lluviaRiega } from './clima';
import { calidadPila, cambiarCantidad, resumirCasillas, type Calidad } from './inventario';

import { ENCARGOS, PLANTILLAS_ENCARGOS, type DefEncargo } from './encargos-datos';
export { ENCARGOS, PLANTILLAS_ENCARGOS } from './encargos-datos';
export type { DefEncargo, ObjetivoEncargo, EtapaEncargo } from './encargos-datos';

export type FaseEncargo='activo'|'completado'|'vencido'|'cancelado';
export interface EntregaEncargo {objetivo:number;articulo:string;cantidad:number;calidad:Calidad}
export interface RegistroEncargo {id:string;aceptadoDia:number;venceDia:number;fase:FaseEncargo;inicios:number[];entregas:EntregaEncargo[];etapa?:number}
export interface EstadoEncargos {version:2;semilla:number;registros:RegistroEncargo[]}
export type AccionEncargo={tipo:'aceptar'|'reclamar'|'cancelar';id:string}|{tipo:'avanzar';id:string;etapa:number}|{tipo:'entregar';id:string;objetivo:number;casilla:number;cantidad:number};
export const crearEncargos=(semilla=1):EstadoEncargos=>({version:2,semilla,registros:[]});
export const MAX_REGISTROS_ROTACION=64,HISTORIAL_ROTACION=24;
export type TipoOferta='diario'|'semanal'|'especial';
export interface EdicionEncargo {tipo:TipoOferta;periodo:number;indice:number;desdeDia:number;hastaDia:number}
export function edicionEncargo(id:string):EdicionEncargo|null{
 if(typeof id!=='string')return null;const m=/^(diario|semanal|especial)_(0|[1-9][0-9]{0,6})_([01])$/.exec(id);if(!m)return null;
 const tipo=m[1] as TipoOferta,periodo=Number(m[2]),indice=Number(m[3]),duracion=tipo==='diario'?1:7;
 if(periodo>Math.floor(1e6/duracion)||tipo!=='diario'&&indice!==0)return null;
 return {tipo,periodo,indice,desdeDia:periodo*duracion,hastaDia:(periodo+1)*duracion};
}
/** Permutación fija por semilla/periodo. Consultar o recargar no consume azar ni modifica el estado. */
export function encargoDef(id:string,encargos?:EstadoEncargos):DefEncargo|undefined{
 const fijo=ENCARGOS.find(d=>d.id===id);if(fijo)return fijo;const e=edicionEncargo(id);if(!e||!encargos)return;
 const catalogo=PLANTILLAS_ENCARGOS[e.tipo],sal=e.tipo==='diario'?0x13579:e.tipo==='semanal'?0x24680:0xabcdef;
 const inicio=(Math.imul(encargos.semilla^sal,1664525)>>>0)%catalogo.length;
 return {...catalogo[(inicio+e.periodo+e.indice)%catalogo.length],id};
}
export function ofertasEncargos(s:EstadoGranja){const dia=s.jornada.diasCompletados,semana=Math.floor(dia/7);return [`diario_${dia}_0`,`diario_${dia}_1`,`semanal_${semana}_0`,`especial_${semana}_0`].map(id=>encargoDef(id,s.encargos)!);}
export function objetivosEtapa(d:DefEncargo,r:RegistroEncargo){return d.etapas?.[r.etapa??0].objetivos??d.objetivos.map((_,i)=>i);}
function progreso(d:DefEncargo,r:RegistroEncargo,stats:Record<string,number>){return d.objetivos.map((o,i)=>o.tipo==='actividad'?Math.min(o.cantidad,Math.max(0,(stats[o.clave]??0)-r.inicios[i])):r.entregas.filter(e=>e.objetivo===i).reduce((n,e)=>n+e.cantidad,0));}
export function progresoEncargo(s:EstadoGranja,r:RegistroEncargo){return progreso(encargoDef(r.id,s.encargos)!,r,s.estadisticas);}
/** Nunca elimina reservas ni pedidos antiguos fijos; solo archiva ediciones cerradas que ya no pueden aceptarse. */
export function archivarEncargos(s:EstadoGranja,limite=MAX_REGISTROS_ROTACION){
 const antiguos=s.encargos.registros.filter(r=>{const e=edicionEncargo(r.id);return e&&e.hastaDia<=s.jornada.diasCompletados&&['completado','cancelado'].includes(r.fase);});
 const protegidos=s.encargos.registros.filter(r=>edicionEncargo(r.id)).length-antiguos.length,conservar=Math.min(HISTORIAL_ROTACION,Math.max(0,limite-protegidos));
 const borrar=new Set(antiguos.slice(0,Math.max(0,antiguos.length-conservar)).map(r=>r.id));s.encargos.registros=s.encargos.registros.filter(r=>!borrar.has(r.id));
}
export function vencerEncargos(s:EstadoGranja){for(const r of s.encargos.registros)if(r.fase==='activo'&&s.jornada.diasCompletados>=r.venceDia)r.fase='vencido';archivarEncargos(s);}
export function cercaCliente(s:EstadoGranja,npcId:string,x:number,z:number){return puedeConversar(s,npcId,x,z,lluviaRiega(tiempoDia(s.tiempo,s.jornada.diasCompletados)));}
export function puedeAceptarEncargo(s:EstadoGranja,d:DefEncargo,x:number,z:number){return cercaCliente(s,d.npcId,x,z)||s.zona==='pueblo'&&!s.interior&&s.servicio==='archivo'&&atencionServicio('archivo',s.jornada.diasCompletados,s.jornada.minutos).abierto;}
const ok=(mensaje:string):Resultado=>({ok:true,mensaje}),no=(mensaje:string):Resultado=>({ok:false,mensaje});
/** MotorGranja garantiza rollback de cualquier fallo; se valida antes de gastar. */
export function actuarEncargo(s:EstadoGranja,a:AccionEncargo,x:number,z:number):Resultado{
 if(!a||!['aceptar','entregar','reclamar','cancelar','avanzar'].includes(a.tipo))return no('Acción de encargo desconocida.');
 const d=encargoDef(a.id,s.encargos);if(!d)return no('Encargo desconocido.');let r=s.encargos.registros.find(r=>r.id===a.id);const dia=s.jornada.diasCompletados,e=edicionEncargo(a.id);
 if(a.tipo==='aceptar'){
  if(e&&(dia<e.desdeDia||dia>=e.hastaDia))return no('Esta oferta ya no está en el tablón. Consulta las ofertas de la jornada actual.');
  if(r&&(r.fase!=='cancelado'||e))return no('Este encargo ya está registrado. Cada oferta renovable se acepta una sola vez por edición.');
  if(s.encargos.registros.filter(r=>r.fase==='activo').length>=5)return no('Termina un encargo: puedes llevar cinco a la vez.');
  if(e?.tipo==='especial'&&s.encargos.registros.some(r=>{const anterior=encargoDef(r.id,s.encargos);return ['activo','vencido'].includes(r.fase)&&anterior?.etapas&&anterior.nombre===d.nombre;}))return no('Cierra el pedido especial anterior de este tipo antes de aceptar otra edición.');
  if(!puedeAceptarEncargo(s,d,x,z))return no('Acepta el encargo junto a su vecino o en el tablón de la Casa de los Oficios.');
  if(e){archivarEncargos(s,MAX_REGISTROS_ROTACION-1);if(s.encargos.registros.filter(r=>edicionEncargo(r.id)).length>=MAX_REGISTROS_ROTACION)return no('Recupera materiales de los pedidos vencidos para liberar espacio en el registro.');}
  const nuevo:RegistroEncargo={id:d.id,aceptadoDia:dia,venceDia:dia+d.dias,fase:'activo',inicios:d.objetivos.map(o=>o.tipo==='actividad'?s.estadisticas[o.clave]??0:0),entregas:[],...(d.etapas?{etapa:0}:{})};
  if(r)Object.assign(r,nuevo);else s.encargos.registros.push(nuevo);return ok(`Encargo aceptado: ${d.nombre}. Tienes ${d.dias} jornadas jugadas.`);
 }
 if(!r)return no('Primero acepta este encargo.');
 if(a.tipo==='cancelar'){
  if(!['activo','vencido'].includes(r.fase))return no('Este encargo ya está cerrado.');
  let casillas=s.casillasInventario;for(const e of r.entregas){const copia=cambiarCantidad(casillas,e.articulo,e.cantidad,e.calidad);if(!copia)return no('Libera espacio para recuperar todas las entregas con su calidad.');casillas=copia;}
  s.casillasInventario=casillas;s.inventario=resumirCasillas(casillas);r.entregas=[];r.fase='cancelado';archivarEncargos(s);return ok('Encargo cancelado. Recuperaste los materiales entregados.'+(e?' Podrás aceptar nuevas ediciones al renovar el tablón.':' Puedes volver a aceptarlo.'));
 }
 if(r.fase!=='activo'||dia>=r.venceDia)return no('El encargo ya no está activo. Si venció, recupera tus entregas desde el diario.');
 if(!cercaCliente(s,d.npcId,x,z))return no('Acércate al vecino que solicitó el encargo.');
 const progreso=progresoEncargo(s,r);
 if(a.tipo==='avanzar'){
  if(!d.etapas||!Number.isInteger(a.etapa)||a.etapa!==r.etapa||a.etapa>=d.etapas.length-1)return no('Esta etapa ya cambió o no admite continuación.');
  if(objetivosEtapa(d,r).some(i=>progreso[i]<d.objetivos[i].cantidad))return no('Completa los objetivos de esta etapa antes de continuar.');
  r.etapa=a.etapa+1;return ok(d.etapas[r.etapa].texto);
 }
 if(a.tipo==='entregar'){
  if(!Number.isInteger(a.objetivo)||a.objetivo<0||a.objetivo>=d.objetivos.length||!Number.isInteger(a.casilla)||a.casilla<0||a.casilla>=s.casillasInventario.length||!Number.isInteger(a.cantidad)||a.cantidad<1)return no('Elige una cantidad y una casilla válidas.');
  if(!objetivosEtapa(d,r).includes(a.objetivo))return no('Esta entrega pertenece a otra etapa del pedido.');
  const o=d.objetivos[a.objetivo],p=s.casillasInventario[a.casilla];if(o.tipo!=='entrega'||!p||p.articulo!==o.clave||calidadPila(p)<(o.calidadMinima??0)||a.cantidad>p.cantidad||a.cantidad>o.cantidad-progreso[a.objetivo])return no('La pila, calidad o cantidad no corresponde al pedido pendiente.');
  const calidad=calidadPila(p),prev=r.entregas.find(e=>e.objetivo===a.objetivo&&e.calidad===calidad);if(prev)prev.cantidad+=a.cantidad;else r.entregas.push({objetivo:a.objetivo,articulo:p.articulo,cantidad:a.cantidad,calidad});p.cantidad-=a.cantidad;if(!p.cantidad)s.casillasInventario[a.casilla]=null;s.inventario=resumirCasillas(s.casillasInventario);return ok('Entrega registrada. Los demás objetos y calidades permanecen en tu mochila.');
 }
 if(d.etapas&&r.etapa!==d.etapas.length-1)return no('Continúa con las etapas del pedido antes de cobrar.');
 if(progreso.some((n,i)=>n<d.objetivos[i].cantidad))return no('Quedan objetivos pendientes.');
 if(s.monedas+d.monedas>1e9)return no('La recompensa supera el límite de monedas.');
 let casillas=s.casillasInventario;for(const p of d.premios??[]){const copia=cambiarCantidad(casillas,p.articulo,p.cantidad,p.calidad);if(!copia)return no('Libera espacio para recibir todos los objetos del premio.');casillas=copia;}
 s.casillasInventario=casillas;s.inventario=resumirCasillas(casillas);
 const vecino=s.pueblo.relaciones.find(n=>n.id===d.npcId)!;vecino.conocido=true;vecino.amistad=Math.min(2500,vecino.amistad+d.amistad);s.estadisticas['amistad_'+d.npcId]=vecino.amistad;s.monedas+=d.monedas;r.fase='completado';r.entregas=[];s.estadisticas.encargos_completados=(s.estadisticas.encargos_completados??0)+1;archivarEncargos(s);return ok(`Encargo completado: ${d.nombre}. +${d.monedas} monedas y amistad. ${d.cierre??''}`.trim());
}
export function encargosValidos(v:unknown,dia:number,stats:Record<string,number>):v is EstadoEncargos{
 return registrosValidos(v,dia,stats,false);
}
/** Solo transforma un formato anterior íntegro; una corrupción presente nunca se reinicia. */
export function migrarEncargos(v:unknown,dia:number,stats:Record<string,number>):unknown{
 if(registrosValidos(v,dia,stats,true))return {...crearEncargos(),registros:(v as EstadoEncargos).registros};return v;
}
function registrosValidos(v:unknown,dia:number,stats:Record<string,number>,anterior:boolean){
 const s=v as EstadoEncargos,int=(v:unknown,a:number,b:number)=>typeof v==='number'&&Number.isInteger(v)&&v>=a&&v<=b;
 if(!s||!int(dia,0,1e6)||s.version!==(anterior?1:2)||!anterior&&!int(s.semilla,0,0xffffffff)||!Array.isArray(s.registros)||s.registros.length>ENCARGOS.length+(anterior?0:MAX_REGISTROS_ROTACION))return false;
 const ids=new Set<string>(),especiales=new Set<string>();let activos=0;
 let renovables=0;
 for(const r of s.registros){const d=r&&encargoDef(r.id,anterior?undefined:s),e=r&&edicionEncargo(r.id);if(!d||ids.has(r.id)||!aldeanoDef(d.npcId)||!int(r.aceptadoDia,0,dia)||r.venceDia!==r.aceptadoDia+d.dias||!['activo','completado','vencido','cancelado'].includes(r.fase)||r.fase==='activo'&&dia>=r.venceDia||r.fase==='vencido'&&dia<r.venceDia||!Array.isArray(r.inicios)||r.inicios.length!==d.objetivos.length||!Array.isArray(r.entregas)||r.entregas.length>d.objetivos.length*4)return false;
  if(e){renovables++;if(r.aceptadoDia<e.desdeDia||r.aceptadoDia>=e.hastaDia)return false;}
  if(d.etapas?!int(r.etapa,0,d.etapas.length-1)||r.fase==='completado'&&r.etapa!==d.etapas.length-1:r.etapa!==undefined)return false;
  if(d.etapas&&['activo','vencido'].includes(r.fase)){if(especiales.has(d.nombre))return false;especiales.add(d.nombre);}
  if(r.inicios.some((n,i)=>!int(n,0,d.objetivos[i].tipo==='actividad'?stats[d.objetivos[i].clave]??0:0)))return false;
  if(['cancelado','completado'].includes(r.fase)&&r.entregas.length)return false;
  const permitidos=d.etapas?.slice(0,(r.etapa??0)+1).flatMap(e=>e.objetivos);
  const keys=new Set<string>();for(const e of r.entregas){if(!e||!int(e.objetivo,0,d.objetivos.length-1)||!int(e.calidad,0,3)||!int(e.cantidad,1,d.objetivos[e.objetivo].cantidad))return false;const o=d.objetivos[e.objetivo],k=e.objetivo+':'+e.calidad;if(o.tipo!=='entrega'||o.clave!==e.articulo||e.calidad<(o.calidadMinima??0)||keys.has(k)||permitidos&&!permitidos.includes(e.objetivo))return false;keys.add(k);}
  if(d.objetivos.some((o,i)=>r.entregas.filter(e=>e.objetivo===i).reduce((n,e)=>n+e.cantidad,0)>o.cantidad))return false;
  if(d.etapas&&r.fase!=='completado'&&r.fase!=='cancelado'){const p=progreso(d,r,stats);if(d.etapas.slice(0,r.etapa).some(e=>e.objetivos.some(i=>p[i]<d.objetivos[i].cantidad)))return false;}
  ids.add(r.id);if(r.fase==='activo')activos++;
 }return activos<=5&&renovables<=MAX_REGISTROS_ROTACION;
}
