import type {EstadoGranja} from './estado';
import {colaReuniones,definicionReunion,puntoReunion,reunionDeTurno,actoresPresentes} from './reuniones';
import {npcAstra,regionAstra,regionActual} from './astra';
const esc=(v:unknown)=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const b=(nombre:string,tipo:string,datos='')=>`<button class="btn" data-do="comunidad-${tipo}" ${datos}>${esc(nombre)}</button>`;
export function renderConversacionComunitaria(s:EstadoGranja){
 const a=s.comunidad?.reuniones.actual;if(!a)return null;const d=definicionReunion(a.id)!,l=d.lineas[a.linea];
 return `<div data-reunion="${esc(d.id)}"><div class="caps">${esc(d.titulo)} · ${a.linea+1}/${d.lineas.length}</div><h3>${esc(npcAstra(l.hablante)?.nombre??l.hablante)}</h3><p class="vecino-dialogo">${esc(l.texto)}</p>${a.linea<d.lineas.length-1?b('Continuar','continuar_reunion'):d.opciones.map((o,i)=>b(o.titulo,'elegir_reunion',`data-opcion="${i}"`)).join('')}<p class="small-text">Aportar consume una madera local y una fibra, y entrega una cuerda. Escuchar conserva tus materiales. Ambas decisiones reconocen la escucha con cinco puntos de amistad por vecino, una sola vez.</p>${b('Dejar y retomar desde el principio','dejar_reunion')}</div>`;
}
export function renderColaReuniones(s:EstadoGranja){const region=regionActual(s),turno=reunionDeTurno(s,region);
 return `<details open><summary>Reuniones con los vecinos</summary><p>Junto a cada archivo regional, de 14 a 16 h. Los vecinos llegan por las calles; conoce a ambos y espera su llegada. Su descanso, el tiempo peligroso y los compromisos de la campaña se respetan. Los asuntos aplazados siguen disponibles y ceden el turno a los pendientes.</p>${colaReuniones(s).map(e=>{
 const d=definicionReunion(e.id)!,p=puntoReunion(d.region),nombres=d.actores.map(id=>npcAstra(id)?.nombre??id).join(' y '),lista=turno?.id===d.id&&actoresPresentes(s,d.id);
 return `<div class="card" data-asunto="${esc(d.id)}"><h4>${esc(d.titulo)}</h4><p>${esc(regionAstra(d.region)?.nombre??d.region)} · ${esc(nombres)} · prioridad ${d.prioridad} · ${esc(e.estado)}.</p>${e.estado==='visto'?`<p>${esc(d.opciones[e.opcion!].cierre)} Jornada ${e.cierre!+1}. ${e.opcion===0?'Cuerda preparada con materiales entregados.':'Sin entrega de materiales.'}</p>`:`<p>Espacio público ${p.x}, ${p.z.toFixed(1)}. ${lista?'Ambos vecinos llegaron.':turno?.id===d.id?'Esperando a los vecinos en el puesto.':'Consulta el horario, el clima y los compromisos de los vecinos.'}</p>${b('Escuchar en el puesto','reunion',`data-id="${d.id}"`)}${b('Aplazar este asunto','aplazar_reunion',`data-id="${d.id}"`)}`}</div>`;
 }).join('')||'<p>Visita una localidad y duerme para recibir sus asuntos. Las mesas llegan por semanas; el clima difícil y los refugios restaurados tienen sus propias condiciones.</p>'}</details>`;
}
