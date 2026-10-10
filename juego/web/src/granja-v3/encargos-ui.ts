import type { EstadoGranja } from './estado';
import { ENCARGOS, progresoEncargo, puedeAceptarEncargo, cercaCliente } from './encargos';
import { aldeanoDef } from './aldeanos';
import { fechaValle } from './jornada';
import { calidadPila } from './inventario';
import { nombreCalidad } from './agricultura';
const esc=(v:unknown)=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const boton=(id:string,op:string,texto:string,habilitado:boolean,extra='')=>`<button class="btn" data-do="encargo-${op}" data-id="${id}" ${habilitado?'':'disabled'} ${extra}>${texto}</button>`;
export function renderEncargos(s:EstadoGranja,x:number,z:number){return `<div class="section-label">Encargos de los vecinos</div><p class="small-text">Hasta cinco activos. Acepta junto al solicitante o en el archivo; entrega y cobra junto a su vecino. Los plazos solo pasan al dormir. Cancelar devuelve materiales con su calidad.</p>${ENCARGOS.map(d=>{
 const r=s.encargos.registros.find(r=>r.id===d.id),cerca=cercaCliente(s,d.npcId,x,z),progress=r?progresoEncargo(s,r):d.objetivos.map(()=>0);let contenido='';
 if(!r||r.fase==='cancelado')contenido=boton(d.id,'aceptar','Aceptar · '+d.dias+' jornadas',puedeAceptarEncargo(s,d,x,z));
 else if(r.fase==='activo'){
  const fecha=fechaValle(r.venceDia-1);contenido=`<p class="small-text">Última jornada: ${fecha.dia} de ${fecha.estacion}, año ${fecha.ano}. Quedan ${r.venceDia-s.jornada.diasCompletados} jornadas, incluida hoy.</p>`;
  contenido+=d.objetivos.map((o,i)=>{let entrega='';if(o.tipo==='entrega'&&progress[i]<o.cantidad){const opciones=s.casillasInventario.map((p,k)=>p?.articulo===o.clave&&calidadPila(p)>=(o.calidadMinima??0)?`<option value="${k}">Casilla ${k+1} · ${nombreCalidad(calidadPila(p))} · ${p.cantidad}</option>`:'').join('');entrega=`<label>Elegir pila<select id="encargo-pila-${d.id}-${i}" ${cerca&&opciones?'':'disabled'}>${opciones||'<option value="">Sin pila compatible</option>'}</select></label><label>Cantidad<input id="encargo-cantidad-${d.id}-${i}" type="number" min="1" max="${o.cantidad-progress[i]}" value="1"></label>`+boton(d.id,'entregar','Entregar',cerca&&!!opciones,`data-objetivo="${i}"`);}return `<div class="card"><strong>${esc(o.texto)} · ${progress[i]} / ${o.cantidad}</strong>${entrega}</div>`;}).join('');
  contenido+=boton(d.id,'reclamar','Cobrar · '+d.monedas+' monedas',cerca&&progress.every((n,i)=>n>=d.objetivos[i].cantidad))+boton(d.id,'cancelar','Cancelar y recuperar materiales',true);
 }else if(r.fase==='vencido')contenido='<p>Vencido. Tus entregas siguen reservadas para recuperarlas.</p>'+boton(d.id,'cancelar','Recuperar materiales',true);
 else contenido='<span class="pill">Completado · recompensa entregada</span>';
 return `<article class="card"><div class="caps">${esc(aldeanoDef(d.npcId)?.nombre)} · ${r?.fase??'disponible'}</div><h3>${esc(d.nombre)}</h3><p>${esc(d.texto)}</p><p class="small-text">Recompensa: ${d.monedas} monedas y ${d.amistad} amistad.</p>${contenido}${!cerca?'<p class="small-text">Busca al solicitante en el pueblo para entregar o cobrar.</p>':''}</article>`;
 }).join('')}`;}
