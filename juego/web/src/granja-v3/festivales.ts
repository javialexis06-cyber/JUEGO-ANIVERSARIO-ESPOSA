import type { EstadoGranja, Resultado } from './estado';
import { CULTIVOS } from './catalogo';
import { calidadPila, resumirCasillas, type Calidad } from './inventario';
import { fechaValle } from './jornada';
import { librePueblo } from './pueblo-datos';
import { FESTIVALES, festivalDef, festivalHoy, diaFestival, PLAZA_FESTIVAL, INICIO_INSCRIPCION, FIN_INSCRIPCION } from './festivales-datos';

export interface MuestraFestival {casilla:number;articulo:string;calidad:Calidad}
export interface SesionFestival {
 id:string;dia:number;minutosInicio:number;retorno:{x:number;z:number};preparado:boolean;respuestas:number[];muestra:MuestraFestival|null;
}
export interface EdicionFestival {id:string;dia:number;puntos:number;monedas:number}
export interface EstadoFestivales {version:1;invitaciones:{id:string;dia:number}[];ediciones:EdicionFestival[];actual:SesionFestival|null}
export type AccionFestival={tipo:'entrar'|'comenzar'|'retirarse'|'cobrar';id:string}|{tipo:'responder';id:string;paso:number;eleccion:number}|{tipo:'muestra';id:string;casilla:number};
export const crearFestivales=():EstadoFestivales=>({version:1,invitaciones:[],ediciones:[],actual:null});
export function invitarFestivales(s:EstadoGranja){
 const hoy=s.jornada.diasCompletados,ano=fechaValle(hoy).ano;
 for(const d of FESTIVALES){const dia=diaFestival(d,ano);if(hoy<dia-3||hoy>dia)continue;
  const anterior=s.festivales.invitaciones.find(i=>i.id===d.id);if(anterior&&fechaValle(anterior.dia).ano===ano)continue;
  s.festivales.invitaciones=s.festivales.invitaciones.filter(i=>i.id!==d.id).concat({id:d.id,dia:hoy});
 }
}
export function cercaFestival(s:EstadoGranja,x:number,z:number){return s.zona==='pueblo'&&!s.interior&&!s.servicio&&!s.aventura.destinoActual&&!s.compania.montada&&Number.isFinite(x)&&Number.isFinite(z)&&Math.hypot(x-PLAZA_FESTIVAL.x,z-PLAZA_FESTIVAL.z)<=2.8&&librePueblo(x,z,.27);}
export function edicionCelebrada(s:EstadoGranja,id:string){return s.festivales.ediciones.some(e=>e.id===id&&fechaValle(e.dia).ano===fechaValle(s.jornada.diasCompletados).ano);}
export function muestraDisponible(s:EstadoGranja,casilla:number){const p=s.casillasInventario[casilla];return Number.isInteger(casilla)&&!!p&&p.cantidad>0&&CULTIVOS.some(c=>c.producto===p.articulo);}
export function puntosFestival(a:SesionFestival){const d=festivalDef(a.id)!;return a.respuestas.reduce((p,r,i)=>p+Number(r===d.preguntas[i].correcta),a.muestra?1+a.muestra.calidad:0);}
export const monedasFestival=(puntos:number)=>20+10*puntos;
export function actividadTerminada(a:SesionFestival){return !!a.preparado&&a.respuestas.length===festivalDef(a.id)!.preguntas.length&&(festivalDef(a.id)!.actividad!=='cosecha'||!!a.muestra);}
export function actuarFestival(s:EstadoGranja,a:AccionFestival,x:number,z:number):Resultado {
 const d=festivalDef(a.id),actual=s.festivales.actual,mal=(mensaje:string)=>({ok:false,mensaje});
 if(!d)return mal('Celebración desconocida.');
 if(a.tipo==='entrar'){
  if(actual||festivalHoy(s.jornada.diasCompletados)?.id!==d.id||s.jornada.minutos<INICIO_INSCRIPCION||s.jornada.minutos>=FIN_INSCRIPCION||edicionCelebrada(s,d.id)||!cercaFestival(s,x,z))return mal('Ven a la plaza el día del festival entre las 10:00 y las 16:00. Cada edición se premia una sola vez.');
  s.festivales.actual={id:d.id,dia:s.jornada.diasCompletados,minutosInicio:s.jornada.minutos,retorno:{x,z},preparado:false,respuestas:[],muestra:null};
  return {ok:true,mensaje:'Bienvenido a '+d.nombre+'. El reloj del valle espera mientras participas.'};
 }
 if(!actual||actual.id!==d.id||actual.dia!==s.jornada.diasCompletados||!cercaFestival(s,x,z))return mal('Esta actividad no está abierta o debes regresar a la plaza.');
 if(a.tipo==='retirarse'){
  s.jornada.minutos=actual.minutosInicio+30;s.festivales.actual=null;
  return {ok:true,mensaje:'Volviste a la plaza media hora después. Conservas tu muestra y puedes participar de nuevo antes de las 16:00.',posicionZona:actual.retorno};
 }
 if(a.tipo==='comenzar'){
  if(actual.preparado)return mal('La actividad ya comenzó.');actual.preparado=true;return {ok:true,mensaje:'La actividad está preparada.'};
 }
 if(!actual.preparado)return mal('Lee la presentación y comienza la actividad.');
 if(a.tipo==='muestra'){
  if(d.actividad!=='cosecha'||actual.muestra||actual.respuestas.length||!muestraDisponible(s,a.casilla))return mal('Elige una casilla con una cosecha real, antes de responder.');
  const p=s.casillasInventario[a.casilla]!;actual.muestra={casilla:a.casilla,articulo:p.articulo,calidad:calidadPila(p)};return {ok:true,mensaje:'Muestra reservada. Se entregará solo al cobrar el premio.'};
 }
 if(a.tipo==='responder'){
  const pregunta=d.preguntas[actual.respuestas.length];
  if(!pregunta||a.paso!==actual.respuestas.length||!Number.isInteger(a.eleccion)||a.eleccion<0||a.eleccion>=pregunta.opciones.length||d.actividad==='cosecha'&&!actual.muestra)return mal('Elige una opción de la ronda actual.');
  actual.respuestas.push(a.eleccion);return {ok:true,mensaje:'Respuesta guardada. Continúa la ronda.'};
 }
 if(a.tipo!=='cobrar'||!actividadTerminada(actual)||edicionCelebrada(s,d.id))return mal('Completa la actividad antes de recibir el premio.');
 const puntos=puntosFestival(actual),monedas=monedasFestival(puntos);
 if(s.monedas+monedas>1e9)return mal('Tu saldo está lleno. Puedes retirarte conservando la muestra y liberar saldo antes de volver.');
 if(actual.muestra){const m=actual.muestra,p=s.casillasInventario[m.casilla];if(!p||p.articulo!==m.articulo||calidadPila(p)!==m.calidad||p.cantidad<1)return mal('La muestra reservada ya no está en su casilla.');p.cantidad--;if(!p.cantidad)s.casillasInventario[m.casilla]=null;s.inventario=resumirCasillas(s.casillasInventario);}
 s.monedas+=monedas;
 for(const id of d.participantes){const r=s.pueblo.relaciones.find(r=>r.id===id)!;if(!r.conocido)s.estadisticas.vecinos_conocidos=(s.estadisticas.vecinos_conocidos??0)+1;r.conocido=true;r.amistad=Math.min(2500,r.amistad+10);s.estadisticas['amistad_'+id]=r.amistad;}
 s.estadisticas.festivales=(s.estadisticas.festivales??0)+1;s.estadisticas['festival_'+d.id]=(s.estadisticas['festival_'+d.id]??0)+1;
 s.festivales.ediciones=s.festivales.ediciones.filter(e=>e.id!==d.id).concat({id:d.id,dia:actual.dia,puntos,monedas});
 s.jornada.minutos=actual.minutosInicio+90;s.festivales.actual=null;
 return {ok:true,mensaje:`${d.recuerdo} guardado · ${puntos} puntos · +${monedas} monedas. Vuelves a la plaza una hora y media después.`,posicionZona:actual.retorno};
}
const entero=(n:unknown,min:number,max:number):n is number=>typeof n==='number'&&Number.isInteger(n)&&n>=min&&n<=max;
export function festivalesValidos(s:EstadoGranja):boolean {
 const v=s.festivales,hoy=s.jornada?.diasCompletados;
 if(!v||v.version!==1||!Array.isArray(v.invitaciones)||v.invitaciones.length>FESTIVALES.length||!Array.isArray(v.ediciones)||v.ediciones.length>FESTIVALES.length)return false;
 for(const lista of [v.invitaciones,v.ediciones]){const ids=new Set<string>();for(const e of lista){const d=festivalDef(e?.id);if(!d||ids.has(e.id)||!entero(e.dia,0,hoy))return false;ids.add(e.id);const fecha=diaFestival(d,fechaValle(e.dia).ano);if(lista===v.invitaciones?(e.dia<fecha-3||e.dia>fecha):e.dia!==fecha)return false;}}
 for(const e of v.ediciones){const d=festivalDef(e.id)!;if(!entero(e.puntos,0,d.preguntas.length+(d.actividad==='cosecha'?4:0))||e.monedas!==monedasFestival(e.puntos)||d.actividad==='cosecha'&&e.puntos<1)return false;}
 const a=v.actual;if(a===null)return true;
 const d=festivalDef(a?.id);if(!d||a.dia!==hoy||festivalHoy(hoy)?.id!==d.id||edicionCelebrada(s,d.id)||s.vidaSocial?.actual||s.jornada.resumenPendiente||typeof a.minutosInicio!=='number'||!Number.isFinite(a.minutosInicio)||a.minutosInicio<INICIO_INSCRIPCION||a.minutosInicio>=FIN_INSCRIPCION||s.jornada.minutos!==a.minutosInicio||!a.retorno||!cercaFestival(s,a.retorno.x,a.retorno.z)||typeof a.preparado!=='boolean'||!Array.isArray(a.respuestas)||a.respuestas.length>d.preguntas.length)return false;
 if(a.respuestas.some((r,i)=>!entero(r,0,d.preguntas[i].opciones.length-1))||!a.preparado&&(a.respuestas.length>0||a.muestra!==null))return false;
 if(a.muestra!==null){const m=a.muestra;if(d.actividad!=='cosecha'||!entero(m?.casilla,0,s.casillasInventario?.length-1)||!entero(m.calidad,0,3)||!muestraDisponible(s,m.casilla))return false;const p=s.casillasInventario[m.casilla]!;if(p.articulo!==m.articulo||calidadPila(p)!==m.calidad)return false;}
 return !(d.actividad==='cosecha'&&a.respuestas.length>0&&!a.muestra);
}
