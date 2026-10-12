import type {EstadoGranja,Resultado} from './estado';
import type {AccionReunion,EstadoReuniones} from './reuniones-tipos';
import {REUNIONES} from './reuniones-datos';
import {npcAstra,regionActual,puntoArchivo,posicionNpcAstra,libreRegionAstra} from './astra';
import {PERFILES_VIDA} from './vida-astra-datos';
import {comisionHistoria} from './historia-ubicaciones';
import {tiempoDia,tiempoRegion} from './clima';
import {cambiarCantidad,resumirCasillas,type Calidad} from './inventario';
export {REUNIONES};
export const crearReuniones=():EstadoReuniones=>({version:1,cola:[],actual:null});
export function migrarReuniones(s:EstadoGranja){if(s.comunidad&&!Object.hasOwn(s.comunidad,'reuniones'))s.comunidad.reuniones=crearReuniones();}
export const definicionReunion=(id:string)=>REUNIONES.find(d=>d.id===id);
export function lineaActualReunion(s:EstadoGranja){const a=s.comunidad?.reuniones.actual;return a?definicionReunion(a.id)?.lineas[a.linea]??null:null;}
export const climaReunion=(s:EstadoGranja,region:string,dia=s.jornada.diasCompletados)=>tiempoRegion(tiempoDia(s.tiempo,dia),region.includes('nieve')?'polar':region.includes('brasa')?'volcanico':'templado');
const dificil=(s:EstadoGranja,region:string,dia:number)=>['tormenta','ceniza','nieve'].includes(climaReunion(s,region,dia));
export function requisitoReunion(s:EstadoGranja,id:string,desde:number){const d=definicionReunion(id);return !!d&&s.astra?.visitas.includes(d.region)&&(
 d.tipo==='mesa'?desde%7===0:d.tipo==='clima'?desde>0&&dificil(s,d.region,desde-1):d.tipo==='cuidado'?!!s.regional?.habitats[d.region]&&s.regional.habitats[d.region].dia<=desde:!!s.comunidad?.obras.some(o=>o.id==='terminal'&&o.abierta&&o.lista<=desde));}
/** Solo el motor de la noche llama esta función. No crea escenas ni cambia posiciones. */
export function dormirReuniones(s:EstadoGranja){const v=s.comunidad!.reuniones,dia=s.jornada.diasCompletados;
 for(const d of REUNIONES)if(!v.cola.some(e=>e.id===d.id)&&requisitoReunion(s,d.id,dia))v.cola.push({id:d.id,desde:dia,hasta:dia+d.ventanaNoches,estado:'pendiente',opcion:null,cierre:null});
 for(const e of v.cola)if(e.estado==='pendiente'&&dia>e.hasta)e.estado='aplazado';
}
export function colaReuniones(s:EstadoGranja,region?:string){return [...(s.comunidad?.reuniones.cola??[])].filter(e=>!region||definicionReunion(e.id)?.region===region).sort((a,b)=>(a.estado==='aplazado'?1:0)-(b.estado==='aplazado'?1:0)||(definicionReunion(b.id)?.prioridad??0)-(definicionReunion(a.id)?.prioridad??0)||a.desde-b.desde||a.id.localeCompare(b.id));}
/** El descanso personal, la casa, las escenas y la comisión de campaña tienen prioridad. */
export function reunionDeTurno(s:EstadoGranja,region:string){
 if(s.astra?.interior||s.astra?.escena||s.historia?.reto||s.regional?.reto||s.festivales.actual||s.vidaSocial.actual||s.aventura.destinoActual||s.jornada.resumenPendiente||dificil(s,region,s.jornada.diasCompletados))return null;
 return colaReuniones(s,region).find(e=>e.estado!=='visto'&&(()=>{const d=definicionReunion(e.id)!;return s.jornada.minutos>=d.desdeMinuto&&s.jornada.minutos<d.hastaMinuto&&d.actores.every(id=>{const p=PERFILES_VIDA.find(p=>p.id===id);return p&&!p.original&&!p.menor&&s.jornada.diasCompletados%7!==p.descanso&&!comisionHistoria(s,id);});})())??null;
}
export function puntoReunion(region:string){const p=puntoArchivo(region);return {x:p.x,z:p.z+2.4};}
export function destinoReunion(s:EstadoGranja,id:string){const n=npcAstra(id);if(!n||n.region!==regionActual(s))return null;const e=reunionDeTurno(s,n.region);if(!e)return null;const d=definicionReunion(e.id)!,i=d.actores.indexOf(id);if(i<0)return null;const p=puntoReunion(n.region);return {x:p.x+(i===0?-1:1),z:p.z,interior:null,actividad:d.tipo==='terminal'?'Revisión del puesto de carga':'Reunión comunitaria'};}
export function actoresPresentes(s:EstadoGranja,id:string){const d=definicionReunion(id);if(!d)return false;return d.actores.every((id,i)=>{const p=posicionNpcAstra(s,id),centro=puntoReunion(d.region),paso=s.astra?.vida.pasos[id];return !!p&&!p.interior&&!paso?.andando&&paso?.dia===s.jornada.diasCompletados&&Math.hypot(p.x-(centro.x+(i===0?-1:1)),p.z-centro.z)<=.35;});}
const bien=(mensaje:string):Resultado=>({ok:true,mensaje}),mal=(mensaje:string):Resultado=>({ok:false,mensaje});
export function actuarReunion(s:EstadoGranja,a:AccionReunion,x:number,z:number,agregar:(id:string,n:number,calidad?:Calidad)=>void):Resultado{
 const v=s.comunidad!.reuniones,actual=v.actual;
 if(a.tipo==='dejar_reunion'){if(!actual)return mal('No hay una reunión abierta.');v.cola.find(e=>e.id===actual.id)!.estado='aplazado';v.actual=null;return bien('Puedes retomar desde el principio; no se entregaron materiales ni se guardó una respuesta.');}
 if(a.tipo==='continuar_reunion'){if(!actual)return mal('No hay una reunión abierta.');const d=definicionReunion(actual.id)!;if(actual.linea>=d.lineas.length-1)return mal('Elige cómo acompañar el acuerdo.');actual.linea++;return bien('La conversación continúa.');}
 if(a.tipo==='elegir_reunion'){
  if(!actual||![0,1].includes(a.opcion))return mal('No hay una decisión abierta.');const d=definicionReunion(actual.id)!;
  if(actual.linea!==d.lineas.length-1)return mal('Escucha antes de responder.');
  if(a.opcion===0){let next=s.casillasInventario;for(const [id,n]of Object.entries(d.materiales)){const p=cambiarCantidad(next,id,-n);if(!p)return mal('Reúne una madera local y una fibra, o elige escuchar.');next=p;}s.casillasInventario=next;s.inventario=resumirCasillas(next);agregar(d.salida.articulo,d.salida.cantidad);}
  const e=v.cola.find(e=>e.id===d.id)!;e.estado='visto';e.opcion=a.opcion;e.cierre=s.jornada.diasCompletados;
  for(const id of d.actores){const charla=s.astra!.charlas[id]??={dia:s.jornada.diasCompletados,puntos:0};charla.puntos=Math.min(2500,charla.puntos+d.amistad);}v.actual=null;return bien(d.opciones[a.opcion].cierre);
 }
 if(actual)return mal('Termina o deja la conversación antes de abrir otra.');
 if(a.tipo!=='reunion'&&a.tipo!=='aplazar_reunion')return mal('Acción de reunión desconocida.');
 const e=v.cola.find(e=>e.id===a.id),d=e&&definicionReunion(e.id),p=d&&puntoReunion(d.region);
 if(!e||!d||!p||e.estado==='visto'||regionActual(s)!==d.region||s.astra?.interior||s.interior||s.servicio||!Number.isFinite(x)||!Number.isFinite(z)||Math.hypot(x-p.x,z-p.z)>3)return mal('Acércate al espacio público junto al archivo de esa reunión.');
 if(a.tipo==='aplazar_reunion'){e.estado='aplazado';return bien('El asunto sigue disponible; los demás pendientes pueden atenderse primero.');}
 if(reunionDeTurno(s,d.region)?.id!==d.id)return mal('Visita de 14 a 16 h en una jornada segura y libre de compromisos; se atienden primero los asuntos pendientes de mayor prioridad.');
 if(!d.actores.every(id=>s.astra?.conocidos.includes(id))||!actoresPresentes(s,d.id))return mal('Conoce a ambos vecinos y espera a que lleguen caminando al puesto.');
 v.actual={id:d.id,linea:0};return bien('La comunidad se reúne. Puedes escuchar sin prometer un turno.');
}
const entero=(x:unknown,min:number,max:number)=>typeof x==='number'&&Number.isInteger(x)&&x>=min&&x<=max;
export function reunionesValidas(s:EstadoGranja){const v=s.comunidad?.reuniones,dia=s.jornada.diasCompletados;
 if(!v||v.version!==1||!Array.isArray(v.cola)||v.cola.length>REUNIONES.length||new Set(v.cola.map(e=>e?.id)).size!==v.cola.length)return false;
 for(const e of v.cola){const d=e&&definicionReunion(e.id);if(!d||!entero(e.desde,1,dia)||e.hasta!==e.desde+d.ventanaNoches||!requisitoReunion(s,d.id,e.desde)||!['pendiente','aplazado','visto'].includes(e.estado))return false;
  if(e.estado==='visto'?![0,1].includes(e.opcion!)||!entero(e.cierre,e.desde,dia):e.opcion!==null||e.cierre!==null)return false;
 }
 if(v.actual!==null){const a=v.actual,d=a&&definicionReunion(a.id),e=a&&v.cola.find(e=>e.id===a.id);if(!d||!e||e.estado==='visto'||!entero(a.linea,0,d.lineas.length-1)||s.astra?.actual!==d.region||s.astra.interior||s.astra.escena||s.astra.vida.actual||s.interior||s.servicio||s.historia?.reto||s.regional?.reto||s.festivales.actual||s.vidaSocial.actual||s.aventura.destinoActual||s.jornada.resumenPendiente||reunionDeTurno(s,d.region)?.id!==d.id||!d.actores.every(id=>s.astra?.conocidos.includes(id))||!actoresPresentes(s,d.id))return false;}
 return REUNIONES.every(d=>d.actores.every(id=>{const n=npcAstra(id),p=PERFILES_VIDA.find(p=>p.id===id),pos=puntoReunion(d.region);return n?.region===d.region&&p&&!p.original&&!p.menor&&libreRegionAstra(d.region,pos.x,pos.z);}));
}
