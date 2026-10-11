import type { EstadoGranja } from './estado';
import { ENCARGOS, encargoDef, ofertasEncargos, edicionEncargo, objetivosEtapa, progresoEncargo, puedeAceptarEncargo, cercaCliente, type DefEncargo } from './encargos';
import { aldeanoDef } from './aldeanos';
import { fechaValle } from './jornada';
import { calidadPila } from './inventario';
import { obtenerObjeto } from './objetos';
import { nombreCalidad } from './agricultura';
const esc=(v:unknown)=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const boton=(id:string,op:string,texto:string,habilitado:boolean,extra='')=>`<button class="btn" data-do="encargo-${op}" data-id="${id}" ${habilitado?'':'disabled'} ${extra}>${texto}</button>`;
const fecha=(dia:number)=>{const f=fechaValle(dia);return `${f.dia} de ${f.estacion}, año ${f.ano}`;};
function tarjeta(s:EstadoGranja,d:DefEncargo,x:number,z:number){
 const r=s.encargos.registros.find(r=>r.id===d.id),edicion=edicionEncargo(d.id),cerca=cercaCliente(s,d.npcId,x,z),progress=r?progresoEncargo(s,r):d.objetivos.map(()=>0);let contenido='';
 if(!r||r.fase==='cancelado'&&!edicion){
  contenido=`<p class="small-text">${d.objetivos.map(o=>`${esc(o.texto)} × ${o.cantidad}`).join(' · ')}</p>`;
  if(d.etapas)contenido+=`<p>${d.etapas.length} etapas: ${d.etapas.map(e=>esc(e.nombre)).join(' → ')}.</p>`;
  if(edicion)contenido+=`<p class="small-text">Disponible hasta ${fecha(edicion.hastaDia-1)}. Una aceptación por edición.</p>`;
  contenido+=boton(d.id,'aceptar','Aceptar · '+d.dias+' jornadas',puedeAceptarEncargo(s,d,x,z));
 }else if(r.fase==='activo'){
  contenido=`<p class="small-text">Última jornada: ${fecha(r.venceDia-1)}. Quedan ${r.venceDia-s.jornada.diasCompletados} jornadas, incluida hoy.</p>`;
  const indices=objetivosEtapa(d,r),etapa=d.etapas?.[r.etapa!];
  if(etapa)contenido+=`<h4>Etapa ${r.etapa!+1} / ${d.etapas!.length} · ${esc(etapa.nombre)}</h4><p>${esc(etapa.texto)}</p>`;
  contenido+=indices.map(i=>{const o=d.objetivos[i];let entrega='';if(o.tipo==='entrega'&&progress[i]<o.cantidad){const opciones=s.casillasInventario.map((p,k)=>p?.articulo===o.clave&&calidadPila(p)>=(o.calidadMinima??0)?`<option value="${k}">Casilla ${k+1} · ${nombreCalidad(calidadPila(p))} · ${p.cantidad}</option>`:'').join('');entrega=`<label>Elegir pila<select id="encargo-pila-${d.id}-${i}" ${cerca&&opciones?'':'disabled'}>${opciones||'<option value="">Sin pila compatible</option>'}</select></label><label>Cantidad<input id="encargo-cantidad-${d.id}-${i}" type="number" min="1" max="${o.cantidad-progress[i]}" value="1"></label>`+boton(d.id,'entregar','Entregar',cerca&&!!opciones,`data-objetivo="${i}"`);}return `<div class="card"><strong>${esc(o.texto)} · ${progress[i]} / ${o.cantidad}</strong>${entrega}</div>`;}).join('');
  if(d.etapas&&r.etapa!<d.etapas.length-1)contenido+=boton(d.id,'avanzar','Revisar etapa con el solicitante',cerca&&indices.every(i=>progress[i]>=d.objetivos[i].cantidad),`data-etapa="${r.etapa}"`);
  else contenido+=boton(d.id,'reclamar','Cobrar · '+d.monedas+' monedas',cerca&&progress.every((n,i)=>n>=d.objetivos[i].cantidad));
  contenido+=boton(d.id,'cancelar','Cancelar y recuperar materiales',true);
 }else if(r.fase==='vencido')contenido='<p>Vencido. Tus entregas siguen reservadas para recuperarlas.</p>'+boton(d.id,'cancelar','Recuperar materiales',true);
 else if(r.fase==='cancelado')contenido='<span class="pill">Cancelado · materiales recuperados</span>';
 else contenido='<span class="pill">Completado · recompensa entregada</span>'+(d.cierre?`<p>${esc(d.cierre)}</p>`:'');
 const origen=edicion?`${edicion.tipo} · ${fecha(edicion.desdeDia)}`:'pedido permanente';
 const premios=(d.premios??[]).map(p=>`${p.cantidad} ${esc(obtenerObjeto(p.articulo)?.nombre??p.articulo)}`).join(' · ');
 return `<article class="card" data-encargo="${d.id}"><div class="caps">${esc(aldeanoDef(d.npcId)?.nombre)} · ${r?.fase??'disponible'} · ${esc(origen)}</div><h3>${esc(d.nombre)}</h3><p>${esc(d.texto)}</p><p class="small-text">Recompensa: ${d.monedas} monedas y ${d.amistad} amistad.${premios?' Además: '+premios+'.':''}</p>${contenido}${!cerca&&(!r||r.fase==='activo')?'<p class="small-text">Busca al solicitante en el pueblo para entregar, revisar etapas o cobrar.</p>':''}</article>`;
}
export function renderEncargos(s:EstadoGranja,x:number,z:number){
 const nuevos=ofertasEncargos(s).filter(d=>!s.encargos.registros.some(r=>r.id===d.id)),rotacion=s.encargos.registros.filter(r=>edicionEncargo(r.id)),pendientes=rotacion.filter(r=>['activo','vencido'].includes(r.fase)),historial=rotacion.filter(r=>['completado','cancelado'].includes(r.fase));
 const cartas=(ds:readonly DefEncargo[])=>ds.map(d=>tarjeta(s,d,x,z)).join(''),registrados=(rs:typeof rotacion)=>cartas(rs.map(r=>encargoDef(r.id,s.encargos)!));
 return `<div class="section-label">Encargos de los vecinos</div><p class="small-text">Hasta cinco activos entre todos los pedidos. Acepta junto al solicitante o en la Casa de los Oficios; entrega y cobra junto a su vecino. Los plazos y las ofertas solo pasan al dormir. Cancelar devuelve materiales con su calidad.</p>
 ${pendientes.length?'<div class="section-label">Tus encargos renovables · '+pendientes.length+'</div>'+registrados(pendientes):''}
 <div class="section-label">Ofertas de hoy</div><p class="small-text">Dos ofertas por jornada. Cambian al dormir; los pedidos aceptados mantienen su plazo.</p>${cartas(nuevos.filter(d=>edicionEncargo(d.id)!.tipo==='diario'))||'<p>Ya aceptaste las ofertas de hoy.</p>'}
 <div class="section-label">Ofertas de la semana</div><p class="small-text">Cambian cada lunes del calendario del valle. Un pedido semanal y un especial de varias etapas.</p>${cartas(nuevos.filter(d=>edicionEncargo(d.id)!.tipo!=='diario'))||'<p>Ya aceptaste las ofertas de esta semana.</p>'}
 ${historial.length?'<details><summary>Historial de encargos renovables · '+historial.length+'</summary>'+registrados([...historial].reverse())+'</details>':''}
 <details open><summary>Los doce pedidos permanentes</summary>${cartas(ENCARGOS)}</details>`;
}
