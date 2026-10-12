import type {EstadoGranja} from './estado';
import {PREMIOS_NARRATIVOS,poseePremio,consultaPremio,premioDef} from './premios';
import {regionActual,regionAstra} from './astra';
import {obtenerObjeto,obtenerReceta} from './objetos';
import type {FamiliaPremio} from './premios-tipos';
const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const b=(t:string,a:string,id:string,extra='')=>`<button class="btn small" data-do="premio-${a}" data-id="${esc(id)}" ${extra}>${esc(t)}</button>`;
export function renderPremios(s:EstadoGranja,familia:FamiliaPremio='conocimiento',x=0,z=0){
 const h=s.historia!,u=h.utilidades,seleccion=u.seleccion&&consultaPremio(s,u.seleccion),here=regionActual(s);
 const lista=PREMIOS_NARRATIVOS.filter(r=>r.familia===familia&&poseePremio(s,r.id)).map(r=>{
  let acciones=b('Consultar datos y recibos','consultar',r.id);
  if(r.familia==='agenda')acciones+=b('Fijar para mañana','fijar',r.id,`data-dia="${s.jornada.diasCompletados+1}"`);
  if(r.familia==='trofeo')acciones+=b(u.exhibidos.includes(r.id)?'Guardar en el álbum':'Exhibir este recuerdo',u.exhibidos.includes(r.id)?'guardar_trofeo':'exhibir',r.id)+b('Retirar inscripción','retirar_inscripcion',r.id);
  if(r.familia==='tecnica')acciones+=b(u.tecnica===r.id?'Desactivar técnica':'Usar esta técnica','tecnica',r.id);
  if(r.plano?.tipo==='receta'){const base=obtenerReceta(r.plano.base);acciones+=`<p>Variante en Fabricación: ${esc(base?.nombre??r.plano.base)}. Conserva ${base?Object.entries(base.ingredientes).map(([id,n])=>`${n} ${esc(obtenerObjeto(id)?.nombre??id)}`).join(' · '):'los materiales base'}, estación, cantidad y requisitos.</p>`;for(const[ranura,id]of Object.entries(s.equipo))if(id===base?.salida.articulo)acciones+=b('Escoger patrón de '+ranura,'estilo',r.id,`data-ranura="${ranura}"`);}
  else if(r.plano&&!u.modulos.some(m=>m.premio===r.id)){
   const viviendas=here==='granja'?s.edificios:regionAstra(here)?.viviendas??[];
   acciones+=`<p>Materiales: ${Object.entries(r.plano.materiales).map(([id,n])=>`${n} ${esc(obtenerObjeto(id)?.nombre??id)}`).join(' · ')}. Se instala cerca de tu posición actual.</p><label>X <input type="number" id="premio-x-${r.id}" value="${Math.floor(x)}"></label><label>Z <input type="number" id="premio-z-${r.id}" value="${Math.floor(z)}"></label>${r.plano.tipo==='acceso'?`<label>Entrada <select id="premio-soporte-${r.id}">${viviendas.map(v=>`<option value="${v.id}">${esc('nombre'in v?v.nombre:v.articulo)}</option>`).join('')}</select></label>`:''}${b('Construir con estos materiales','instalar',r.id)}`;
  }
  return `<div class="card"><div class="caps">${esc(r.insignia)} · ${esc(r.familia)}</div><h4>${esc(r.nombre)}</h4><p>${esc(r.efecto_diseno)}</p><p>${esc(r.limite)}</p>${acciones}</div>`;
 }).join('');
 const modulos=u.modulos.map(m=>{const r=premioDef(m.premio)!;let acciones=b('Retirar y recuperar contenido','retirar_modulo',m.id);const tipo=r.plano!.tipo;
  if(tipo==='acceso')acciones+=b('Usar acceso reparable','usar_acceso',m.id);
  if(tipo==='cofre'){
   acciones+=`<p>${m.casillas.filter(Boolean).length}/${m.casillas.length} casillas ocupadas.</p><select id="premio-item-${m.id}">${s.casillasInventario.flatMap((p,i)=>p?[`<option value="${i}">${esc(obtenerObjeto(p.articulo)?.nombre??p.articulo)} × ${p.cantidad}</option>`]:[]).join('')}</select>${b('Guardar una unidad','guardar_modulo',m.id)}${m.casillas.flatMap((p,i)=>p?[b('Retirar '+(obtenerObjeto(p.articulo)?.nombre??p.articulo)+' ×1','sacar_modulo',m.id,`data-casilla="${i}"`)]:[]).join('')}`;
  }
  if(tipo==='trampa')acciones+=`<p>Usos: ${m.usos}/4 · cebos: ${m.cebo}/4 · ${m.casillas[0]?esc(obtenerObjeto(m.casillas[0].articulo)?.nombre):'Sin captura pendiente'}. Un intento por jornada dormida, máximo una captura; no repite con visitas o tiempo real.</p>${b('Cargar un cebo real','cebar_trampa',m.id)}${b('Recoger captura','recoger_trampa',m.id)}${b('Reparar · 4 maderas, 2 fibras','reparar_trampa',m.id)}<select id="premio-especie-${m.id}"><option value="">Sin selección</option>${Object.keys(s.estadisticas).filter(k=>k.startsWith('pez_')).map(k=>`<option value="${k.slice(4)}" ${m.especie===k.slice(4)?'selected':''}>${esc(obtenerObjeto(k.slice(4))?.nombre??k.slice(4))}</option>`).join('')}</select>${b('Configurar selección sin bonus de rareza','seleccion_trampa',m.id)}`;
  return `<div class="card"><h4>${esc(r.nombre)}</h4><p>${esc(regionAstra(m.region)?.nombre??m.region)} · ${m.x}, ${m.z}</p>${acciones}</div>`;
 }).join('');
 return `<h3>Premios y herramientas del diario</h3><p>${h.premios.length}/217 premios obtenidos. No se venden ni pagan por consultar o volver a exhibir. La técnica activa y los módulos se guardan en tu partida.</p>${(['conocimiento','agenda','plano','trofeo','acceso','tecnica'] as FamiliaPremio[]).map(f=>`<button class="btn small" data-do="premio-familia" data-familia="${f}">${esc(f)} · ${PREMIOS_NARRATIVOS.filter(r=>r.familia===f&&poseePremio(s,r.id)).length}</button>`).join('')}${seleccion?`<div class="card"><h4>${esc(seleccion.titulo)}</h4>${seleccion.lineas.map(l=>`<p>${esc(l)}</p>`).join('')}</div>`:''}<h4>Exposición · ${u.exhibidos.length}/6</h4>${u.exhibidos.map(id=>`<p>${esc(premioDef(id)?.nombre)} · ${u.inscripciones[id]?'inscripción autorizada':'sin inscripción'}</p>${b('Consultar recuerdo','consultar',id)}`).join('')||'<p>Escoge recuerdos del álbum para exponer.</p>'}<h4>Tres planes fijados</h4>${u.agenda.map(a=>`<p>${esc(premioDef(a.premio)?.nombre)} · jornada ${a.dia+1} · ${a.revisada?'revisado':a.dia<=s.jornada.diasCompletados?'para revisar':'programado'}</p>${b('Marcar revisión','revisar_agenda',a.premio)}${b('Quitar de agenda','quitar_agenda',a.premio)}`).join('')||'<p>No hay planes fijados.</p>'}<h4>${esc(familia)}</h4>${lista||'<p>Completa historias de esta familia para obtener sus herramientas.</p>'}<h4>Instalaciones</h4>${modulos||'<p>Construye una instalación desde un plano obtenido.</p>'}`;
}
