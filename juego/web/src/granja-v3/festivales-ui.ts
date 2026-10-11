import type { EstadoGranja } from './estado';
import { fechaValle } from './jornada';
import { nombreCalidad } from './agricultura';
import { obtenerObjeto } from './objetos';
import { aldeanoDef } from './aldeanos';
import { FESTIVALES, festivalDef, festivalHoy, diaFestival, PLAZA_FESTIVAL } from './festivales-datos';
import { actividadTerminada, cercaFestival, edicionCelebrada, muestraDisponible, puntosFestival, monedasFestival } from './festivales';
const esc=(s:unknown)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const estaciones={primavera:'primavera',verano:'verano',otono:'otoño',invierno:'invierno'};
const boton=(id:string,tipo:string,texto:string,extra='')=>`<button class="btn" data-do="festival-${tipo}" data-id="${id}" ${extra}>${esc(texto)}</button>`;
export function renderFestivales(s:EstadoGranja,x:number,z:number){
 const f=fechaValle(s.jornada.diasCompletados),actual=s.festivales.actual;
 if(actual){const d=festivalDef(actual.id)!;let contenido='';
  if(!actual.preparado)contenido=`<p>${esc(d.descripcion)}</p>${boton(d.id,'comenzar','Comenzar actividad')}`;
  else if(d.actividad==='cosecha'&&!actual.muestra){contenido='<p>Elige una unidad de cosecha. Su calidad suma de 1 a 4 puntos; solo se consume al cobrar.</p>'+s.casillasInventario.map((p,i)=>muestraDisponible(s,i)?boton(d.id,'muestra',`${obtenerObjeto(p!.articulo)?.nombre??p!.articulo} · ${nombreCalidad(p!.calidad??0)} · Casilla ${i+1}`,`data-casilla="${i}"`):'').join('');if(!s.casillasInventario.some((_,i)=>muestraDisponible(s,i)))contenido+='<p>Necesitas traer una cosecha de la granja. Puedes retirarte y volver antes de las 16:00.</p>';}
  else if(actividadTerminada(actual)){const puntos=puntosFestival(actual);contenido=`<p>Actividad completada: ${puntos} puntos.</p><p>Recibirás ${monedasFestival(puntos)} monedas, hasta 10 de amistad con cada participante y el recuerdo «${esc(d.recuerdo)}».</p>${actual.muestra?'<p>Al cobrar se entregará una unidad de la muestra reservada.</p>':''}${boton(d.id,'cobrar','Recibir premio y volver a la plaza')}`;}
  else {const i=actual.respuestas.length,p=d.preguntas[i];contenido=`<p>Ronda ${i+1} / ${d.preguntas.length}</p><h3>${esc(p.texto)}</h3><div class="buttons">${p.opciones.map((o,j)=>boton(d.id,'responder',o,`data-paso="${i}" data-eleccion="${j}"`)).join('')}</div>`;}
  return `<div class="card"><h3>${esc(d.nombre)}</h3><p>${d.participantes.map(id=>esc(aldeanoDef(id)?.nombre)).join(' · ')}</p><p class="small-text">El calendario está en pausa; los cuidados siguen en tiempo real. Puedes continuar después de recargar.</p>${contenido}<div class="buttons">${boton(d.id,'retirarse','Retirarme sin premio')}</div></div>`;
 }
 return '<p>Las celebraciones se hacen al sur de la fuente del Pueblo del Sol. Inscripción de 10:00 a 16:00. Toca el reloj para consultar sus fechas.</p>'+FESTIVALES.map(d=>{
  const e=s.festivales.ediciones.find(e=>e.id===d.id),hoy=festivalHoy(s.jornada.diasCompletados)?.id===d.id,terminado=edicionCelebrada(s,d.id),invitada=s.festivales.invitaciones.some(i=>i.id===d.id&&fechaValle(i.dia).ano===f.ano);
  return `<div class="card"><h3>${esc(d.nombre)}</h3><p>${d.dia} de ${estaciones[d.estacion]} · Año ${f.ano}</p><p>${esc(d.descripcion)}</p>${invitada?'<p>Invitación recibida al dormir: te esperamos en la plaza.</p>':''}${hoy&&!terminado?boton(d.id,'entrar','Participar',cercaFestival(s,x,z)&&s.jornada.minutos>=600&&s.jornada.minutos<960?'':'disabled'):''}${hoy&&!terminado&&!cercaFestival(s,x,z)?`<p>Acércate al sur de la fuente (${PLAZA_FESTIVAL.x}, ${PLAZA_FESTIVAL.z}).</p>`:''}${terminado?'<p>Ya participaste en esta edición. Vuelve el próximo año.</p>':''}${e?`<p>Último recuerdo: ${esc(d.recuerdo)} · Año ${fechaValle(e.dia).ano} · ${e.puntos} puntos.</p>`:''}</div>`;
 }).join('');
}
export function avisoFestival(s:EstadoGranja){
 const f=fechaValle(s.jornada.diasCompletados),d=FESTIVALES.find(d=>d.estacion===f.estacion),dia=d?diaFestival(d,f.ano):0;
 return d?`<div class="card"><h3>${esc(d.nombre)}</h3><p>${d.dia} de ${estaciones[d.estacion]} · Inscripción de 10:00 a 16:00.</p><p>${s.jornada.diasCompletados===dia?'Hoy nos reunimos junto a la fuente.':s.jornada.diasCompletados<dia?'La invitación llega al dormir durante los tres días anteriores.':'La próxima edición será el año siguiente.'}</p><button class="btn" data-do="abrir-festivales">Ver actividades y recuerdos</button></div>`:'';
}
