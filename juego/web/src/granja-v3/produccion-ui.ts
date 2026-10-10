import { recetaAprendida, requisitoReceta, NOMBRES_HABILIDAD } from './habilidades';
import { calidadPila } from './inventario';
import { nombreCalidad } from './agricultura';
import type { EstadoGranja, Resultado } from './estado';
import type { Pila } from './inventario';
import { iconoInventario } from './inventario-ui';
import { RECETAS, obtenerObjeto, obtenerReceta } from './objetos';
import type { RecetaProduccion, EstacionProduccion } from './objetos';
import { gruposProduccion, recetaPermitida } from './produccion';
import type { EstadoProduccion, AccionProduccion, ReferenciaCasilla, MaquinaProduccion } from './produccion';
import './produccion-ui.css';

const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const normalizar=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const estaciones:Record<EstacionProduccion,string>={mano:'A mano',banco_trabajo:'Banco de trabajo',horno:'Horno',fundidora:'Fundidora',prensa:'Prensa',molino_artesanal:'Molino artesanal',cocina:'Cocina',fermentador:'Fermentador',telar:'Telar',recicladora:'Recicladora',forja:'Forja'};
const categorias:Record<string,string>={todas:'Todas',materiales:'Materiales',comida:'Cocina',equipo:'Equipo',taller:'Taller y cofres',granja:'Granja',viajes:'Portales y viajes'};
const tiempo=(ms:number)=>ms<=0?'Al instante':ms<60_000?`${Math.ceil(ms/1000)} s`:`${Math.floor(ms/60_000)} min${ms%60_000?` ${Math.ceil(ms%60_000/1000)} s`:''}`;
const categoria=(r:RecetaProduccion)=>r.salida.articulo.startsWith('portal_')||r.salida.articulo==='nave_exploradora'?'viajes':obtenerObjeto(r.salida.articulo)?.categoria==='comida'?'comida':obtenerObjeto(r.salida.articulo)?.equipo?'equipo':obtenerObjeto(r.salida.articulo)?.maquina||obtenerObjeto(r.salida.articulo)?.contenedor?'taller':obtenerObjeto(r.salida.articulo)?.aspersor||['fertilizante','fertilizante_mejorado','cebo_refinado'].includes(r.salida.articulo)?'granja':'materiales';

export interface OpcionesProduccion {
 nombre:(id:string)=>string;
 seleccionado?:string;
 filtro?:string;
 /** Debe ser el mismo nivel que se entrega al motor de producción. */
 nivel?:number;
 ahora?:number;
}
type EstadoConProduccion=EstadoGranja&{produccion:EstadoProduccion};
type TabProduccion='recetas'|'taller'|'almacen';

function ingredientes(r:RecetaProduccion,disponible:Record<string,number>,nombre:(id:string)=>string){
 return `<ul class="prod-ingredientes">${Object.entries(r.ingredientes).map(([id,n])=>`<li class="${(disponible[id]||0)>=n?'listo':'falta'}" data-prod-material data-coste="${n}" data-disponible="${disponible[id]||0}"><span class="prod-mini-icon">${iconoInventario(id)}</span><span>${esc(nombre(id))}</span><strong><span data-prod-necesario>${n}</span><span class="prod-disponible"> / ${disponible[id]||0}</span></strong></li>`).join('')}</ul>`;
}
function casillas(pilas:(Pila|null)[],tipo:ReferenciaCasilla['tipo'],nombre:(id:string)=>string,id=''){
 return `<div class="prod-casillas" aria-label="${tipo==='mochila'?'Mochila':tipo==='maquina'?'Productos terminados':'Contenido del cofre'}">${pilas.map((p,i)=>`<button type="button" class="prod-casilla${p?' ocupada':''}${tipo==='maquina'?' salida':''}" data-prod-casilla="${i}" data-prod-tipo="${tipo}" data-prod-id="${esc(id)}" data-articulo="${esc(p?.articulo||'')}" data-nombre="${esc(p?nombre(p.articulo)+(calidadPila(p)>0?' · '+nombreCalidad(calidadPila(p)):''):'Casilla vacía')}" data-cantidad="${p?.cantidad||0}" draggable="${!!p}" aria-pressed="false" aria-label="${tipo==='maquina'?'Salida':'Casilla'} ${i+1}: ${p?`${esc(nombre(p.articulo)+(calidadPila(p)>0?' · '+nombreCalidad(calidadPila(p)):''))}, ${p.cantidad}`:'vacía'}" title="${p?`${esc(nombre(p.articulo)+(calidadPila(p)>0?' · '+nombreCalidad(calidadPila(p)):''))} · ${p.cantidad}`:'Casilla vacía'}"><span class="prod-casilla-num">${i+1}</span>${p?`<span class="prod-icon">${iconoInventario(p.articulo)}</span><strong class="prod-cantidad">${p.cantidad}</strong>${calidadPila(p)>0?`<span class="calidad-estrella calidad-${calidadPila(p)}">★</span>`:''}`:'<span class="prod-vacia" aria-hidden="true">·</span>'}</button>`).join('')}</div>`;
}
function recetaCard(r:RecetaProduccion,s:EstadoConProduccion,opts:OpcionesProduccion){
 const nivel=opts.nivel??0,permitida=recetaPermitida(r,{casillas:s.casillasInventario,nivel,desbloqueos:s.desbloqueos,habilidades:s.habilidades});
 const disponibles=s.produccion.maquinas.filter(m=>m.zona===s.zona&&obtenerObjeto(m.articulo)?.maquina?.estacion===r.estacion);
 const materiales=Object.entries(r.ingredientes).every(([id,n])=>(s.inventario[id]||0)>=n),hayEstacion=r.estacion==='mano'||disponibles.length>0;
 const textoBuscar=normalizar([r.nombre,opts.nombre(r.salida.articulo),estaciones[r.estacion],...Object.keys(r.ingredientes).map(opts.nombre)].join(' '));
 return `<article class="prod-receta" data-prod-receta="${esc(r.id)}" data-categoria="${categoria(r)}" data-buscar="${esc(textoBuscar)}" data-permitida="${permitida}" data-estacion="${r.estacion}" data-hay-estacion="${hayEstacion}"><div class="prod-receta-head"><span class="prod-item-icon">${iconoInventario(r.salida.articulo)}</span><div><h3>${esc(r.nombre)}</h3><p>${r.salida.cantidad} ${r.salida.cantidad===1?'unidad':'unidades'} · ${tiempo(r.duracionMs)}</p></div></div><div class="prod-meta"><span>${estaciones[r.estacion]}</span><span${nivel<r.nivel?' class="falta"':''}>Herramienta ${r.nivel}</span></div>${ingredientes(r,s.inventario,opts.nombre)}${!permitida?`<p class="prod-bloqueo">${!recetaAprendida(s.habilidades,r)?`Aprende ${NOMBRES_HABILIDAD[requisitoReceta(r).habilidad]} ${requisitoReceta(r).nivel} y duerme para desbloquearla.`:nivel<r.nivel?`Necesita una herramienta de nivel ${r.nivel}.`:'Necesitas descubrir esta receta en tus aventuras.'}</p>`:''}${r.estacion!=='mano'?(disponibles.length?`<label class="prod-label">Preparar en<select data-prod-estacion aria-label="Estación para ${esc(r.nombre)}">${disponibles.map((m,i)=>`<option value="${esc(m.id)}" ${m.id===opts.seleccionado?'selected':''}>${esc(opts.nombre(m.articulo))} ${i+1} · ${m.x}, ${m.z}</option>`).join('')}</select></label>`:`<p class="prod-bloqueo">Coloca un ${estaciones[r.estacion].toLowerCase()} en esta zona.</p>`):''}<div class="prod-fabricar"><label class="prod-label">Lotes<input data-prod-lotes type="number" inputmode="numeric" min="1" max="100" step="1" value="1" aria-label="Lotes de ${esc(r.nombre)}"></label><button class="btn small${materiales&&permitida&&hayEstacion?' primary':''}" data-prod-accion="fabricar" data-receta="${esc(r.id)}" ${materiales&&permitida&&hayEstacion?'':'disabled'}>${r.estacion==='mano'?'Fabricar':'Añadir a la cola'}</button></div></article>`;
}

function maquinaCard(m:MaquinaProduccion,s:EstadoConProduccion,{nombre,nivel=0,ahora=s.ultimoTiempo}:OpcionesProduccion){
 const estacion=obtenerObjeto(m.articulo)!.maquina!.estacion,recetas=RECETAS.filter(r=>r.estacion===estacion);
 const grupo=gruposProduccion(s.produccion).find(g=>g.ids.includes(m.id));
 const almacen:Record<string,number>={};for(const c of s.produccion.cofres.filter(c=>grupo?.cofres.includes(c.id)))for(const p of c.casillas)if(p)almacen[p.articulo]=(almacen[p.articulo]||0)+p.cantidad;
 const actual=m.proceso&&obtenerReceta(m.proceso.recetaId),restante=m.proceso?Math.max(0,m.proceso.terminaEn-ahora):0;
 const auto=m.recetaId&&obtenerReceta(m.recetaId),faltantes=auto?Object.entries(auto.ingredientes).filter(([id,n])=>(almacen[id]||0)<n).map(([id,n])=>`${n-(almacen[id]||0)} ${nombre(id)}`):[];
 const local=m.zona===s.zona&&!s.interior&&!s.servicio,seleccion=m.recetaId||recetas[0]?.id||'';
 return `<article class="prod-dispositivo" data-prod-maquina="${esc(m.id)}"><div class="prod-dispositivo-head"><span class="prod-item-icon">${iconoInventario(m.articulo)}</span><div><h3>${esc(nombre(m.articulo))}</h3><p>${esc(m.zona.replaceAll('_',' '))} · ${m.x}, ${m.z}</p></div></div>${!local?'<p class="prod-bloqueo">Ve a su zona para utilizarla.</p>':''}<div class="prod-proceso">${actual?`<strong>${esc(actual.nombre)}</strong><span data-produccion-fin="${m.proceso!.terminaEn}" data-produccion-duracion="${actual.duracionMs}">${restante?`Listo en ${tiempo(restante)}`:'Esperando espacio en la salida'}</span><progress max="100" value="${Math.min(100,Math.max(0,100-restante/actual.duracionMs*100))}" aria-label="Progreso de ${esc(actual.nombre)}"></progress>`:m.salida.some(Boolean)?'<strong>Producción terminada</strong><span>Recoge la salida o deja espacio en un cofre conectado.</span>':'<strong>Lista para trabajar</strong><span>Prepara un lote o elige una receta automática.</span>'}</div><h4>Salida</h4>${casillas(m.salida,'maquina',nombre,m.id)}<p class="prod-ayuda">Toca un producto y después una casilla de tu mochila para recogerlo.</p><h4>Preparar desde tu mochila</h4><label class="prod-label">Receta<select data-prod-manual-receta ${local?'':'disabled'}>${recetas.map(r=>`<option value="${esc(r.id)}" ${r.id===seleccion?'selected':''} ${recetaPermitida(r,{casillas:s.casillasInventario,nivel,desbloqueos:s.desbloqueos,habilidades:s.habilidades})?'':'disabled'}>${esc(r.nombre)}${r.nivel>nivel?` · nivel ${r.nivel}`:''}</option>`).join('')}</select></label>${recetas.map(r=>`<div data-prod-manual-detalle="${esc(r.id)}" ${r.id===seleccion?'':'hidden'}>${ingredientes(r,s.inventario,nombre)}<p class="prod-ayuda">${r.salida.cantidad} unidades · ${tiempo(r.duracionMs)} por lote.</p></div>`).join('')}<div class="prod-fabricar"><label class="prod-label">Lotes<input type="number" data-prod-manual-lotes min="1" max="100" step="1" value="1" inputmode="numeric"></label><button class="btn small primary" data-prod-accion="encolar" data-id="${esc(m.id)}" ${local&&recetas.length?'':'disabled'}>Preparar</button></div>${m.cola.length?`<h4>En espera</h4><ul class="prod-cola">${m.cola.map(p=>`<li><span>${esc(obtenerReceta(p.recetaId)?.nombre||p.recetaId)}</span><strong>${p.cantidad} ${p.cantidad===1?'lote':'lotes'}</strong></li>`).join('')}</ul><button class="btn small quiet" data-prod-accion="cancelar-cola" data-id="${esc(m.id)}" ${local?'':'disabled'}>Devolver ingredientes en espera</button><p class="prod-ayuda">El lote que ya está en proceso continúa.</p>`:''}<h4>Producción automática</h4><p class="prod-ayuda">${grupo?.cofres.length?`${grupo.cofres.length} ${grupo.cofres.length===1?'cofre conectado':'cofres conectados'}. La máquina toma materiales y guarda sus productos allí.`:'Coloca un cofre junto a esta máquina y guarda en él los ingredientes.'}</p><label class="prod-label">Repetir mientras haya materiales<select data-prod-automatica data-id="${esc(m.id)}" ${local?'':'disabled'}><option value="" ${m.recetaId===null?'selected':''}>Desactivada</option>${recetas.map(r=>`<option value="${esc(r.id)}" ${r.id===m.recetaId?'selected':''} ${recetaPermitida(r,{casillas:s.casillasInventario,nivel,desbloqueos:s.desbloqueos,habilidades:s.habilidades})?'':'disabled'}>${esc(r.nombre)}${r.nivel>nivel?` · nivel ${r.nivel}`:''}</option>`).join('')}</select></label>${auto?`<p class="prod-ayuda ${faltantes.length?'falta':''}">${faltantes.length?`Falta en los cofres: ${esc(faltantes.join(', '))}.`:'Hay materiales para el próximo lote automático.'}</p>`:''}<div class="prod-acciones-dispositivo"><button class="btn small quiet" data-prod-accion="mover" data-id="${esc(m.id)}" ${local?'':'disabled'}>Mover</button><button class="btn small quiet" data-prod-accion="retirar" data-id="${esc(m.id)}" ${local?'':'disabled'}>Guardar máquina</button></div><p class="prod-ayuda">Para guardarla, recoge sus productos y termina o devuelve los lotes pendientes.</p></article>`;
}

export function renderProduccion(s:EstadoConProduccion,opts:OpcionesProduccion):string {
 const e=s.produccion,{nombre}=opts,seleccionado=opts.seleccionado||'',maquina=e.maquinas.find(m=>m.id===seleccionado),cofre=e.cofres.find(c=>c.id===seleccionado),estructura=e.estructuras.find(c=>c.id===seleccionado);
 const tipo:TabProduccion=cofre?'almacen':maquina||estructura?'taller':'recetas';
 const colocables=Object.entries(s.inventario).filter(([id,n])=>{const d=obtenerObjeto(id);return n>0&&(d?.maquina||d?.contenedor||d?.aspersor||id.startsWith('portal_')||id==='nave_exploradora');});
 const nodos=[...e.maquinas,...e.cofres,...e.estructuras];
 return `<section class="produccion" data-prod-seleccion="${esc(seleccionado)}" data-prod-tab-inicial="${tipo}" data-prod-filtro-inicial="${esc(opts.filtro||'todas')}" aria-label="Fabricación y almacenamiento"><div class="prod-intro"><p>Transforma lo que encuentras en herramientas, comida y nuevos caminos.</p><span>Nivel ${opts.nivel??0}</span></div><div class="prod-tabs" role="tablist" aria-label="Secciones de fabricación">${([['recetas','Fabricar'],['taller','Taller'],['almacen','Cofres']] as [TabProduccion,string][]).map(([id,label])=>`<button type="button" role="tab" data-prod-tab="${id}" aria-selected="${id===tipo}" aria-controls="prod-panel-${id}" id="prod-tab-${id}">${label}</button>`).join('')}</div><div class="prod-transferencia" hidden data-prod-transferencia><p data-prod-origen>Elige un objeto para moverlo.</p><div class="prod-transferir-mandos"><button class="btn small quiet" data-prod-cantidad="todo" aria-pressed="true">Todo</button><button class="btn small quiet" data-prod-cantidad="mitad" aria-pressed="false">Mitad</button><button class="btn small quiet" data-prod-cantidad="uno" aria-pressed="false">Uno</button><button class="btn small quiet" data-prod-accion="soltar">Soltar</button></div></div><p class="prod-estado" data-prod-estado role="status" aria-live="polite"></p><section role="tabpanel" id="prod-panel-recetas" aria-labelledby="prod-tab-recetas" data-prod-panel="recetas"><label class="prod-label">Buscar una receta<input type="search" data-prod-buscar placeholder="Objeto, material o estación…" autocomplete="off"></label><label class="prod-label">Mostrar<select data-prod-filtro>${Object.entries(categorias).map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</select></label><p class="prod-ayuda">Los materiales se toman de tu mochila. Las cifras muestran lo necesario / lo que llevas.</p><div class="prod-recetas">${RECETAS.map(r=>recetaCard(r,s,opts)).join('')}</div><p class="prod-vacio" data-prod-sin-recetas hidden>No hay recetas que coincidan con la búsqueda.</p></section><section role="tabpanel" id="prod-panel-taller" aria-labelledby="prod-tab-taller" data-prod-panel="taller"><h3 class="prod-section-title">Para colocar</h3>${colocables.length?`<div class="prod-colocables">${colocables.map(([id,n])=>`<button class="prod-colocable" data-prod-accion="colocar" data-articulo="${esc(id)}"><span class="prod-item-icon">${iconoInventario(id)}</span><span><strong>${esc(nombre(id))}</strong><small>${n} en tu mochila · Colocar</small></span></button>`).join('')}</div>`:'<p class="prod-vacio">Empieza fabricando un banco de trabajo, un cofre o un horno. Cuando lo tengas en la mochila, podrás colocarlo aquí.</p>'}<h3 class="prod-section-title">Tu taller</h3>${nodos.length?`<div class="prod-lista-nodos">${nodos.map(n=>`<button class="prod-nodo${n.id===seleccionado?' elegido':''}" data-prod-accion="seleccionar" data-id="${esc(n.id)}" aria-pressed="${n.id===seleccionado}"><span class="prod-mini-icon">${iconoInventario(n.articulo)}</span><span><strong>${esc(nombre(n.articulo))}</strong><small>${esc(n.zona.replaceAll('_',' '))} · ${n.x}, ${n.z}</small></span></button>`).join('')}</div>`:'<p class="prod-vacio">Todavía no has colocado máquinas o cofres.</p>'}${maquina?maquinaCard(maquina,s,opts):estructura?`<div class="prod-dispositivo"><h3>${esc(nombre(estructura.articulo))}</h3><p class="prod-ayuda">${esc(obtenerObjeto(estructura.articulo)?.descripcion||'')} · ${esc(estructura.zona.replaceAll('_',' '))}</p><div class="prod-acciones-dispositivo"><button class="btn small quiet" data-prod-accion="mover" data-id="${esc(estructura.id)}">Mover</button><button class="btn small quiet" data-prod-accion="retirar" data-id="${esc(estructura.id)}">Guardar objeto</button></div></div>`:'<p class="prod-ayuda">Selecciona una máquina para preparar recetas y recoger sus productos.</p>'}<details class="prod-conexiones"><summary>Cómo conectar tu taller</summary><p>Coloca máquinas y cofres en casillas vecinas. Los materiales pasan de los cofres a las máquinas; los productos vuelven a un cofre con espacio. Las máquinas también conectan unas con otras.</p><label class="prod-label">Casillas que se conectan<select data-prod-conexion><option value="cardinal" ${e.adyacencia==='cardinal'?'selected':''}>Solo por los lados</option><option value="diagonal" ${e.adyacencia==='diagonal'?'selected':''}>Lados y esquinas</option></select></label><p>La producción se detiene si falta un ingrediente o no queda espacio. Nunca se desechan productos.</p></details></section><section role="tabpanel" id="prod-panel-almacen" aria-labelledby="prod-tab-almacen" data-prod-panel="almacen"><h3 class="prod-section-title">Tus cofres</h3>${e.cofres.length?`<label class="prod-label">Abrir cofre<select data-prod-elegir-cofre><option value="">Elige un cofre</option>${e.cofres.map((c,i)=>`<option value="${esc(c.id)}" ${c.id===seleccionado?'selected':''}>${esc(nombre(c.articulo))} ${i+1} · ${esc(c.zona.replaceAll('_',' '))} (${c.x}, ${c.z})</option>`).join('')}</select></label>`:'<p class="prod-vacio">Fabrica un cofre de madera y colócalo en la granja para guardar tus recursos.</p>'}${cofre?`<article class="prod-dispositivo"><div class="prod-dispositivo-head"><span class="prod-item-icon">${iconoInventario(cofre.articulo)}</span><div><h3>${esc(nombre(cofre.articulo))}</h3><p>${cofre.casillas.filter(Boolean).length} / ${cofre.casillas.length} casillas ocupadas</p></div></div>${cofre.zona!==s.zona?'<p class="prod-bloqueo">Ve a la zona del cofre para transferir objetos.</p>':''}${casillas(cofre.casillas,'cofre',nombre,cofre.id)}<label class="prod-label">Preferencia para recibir productos<select data-prod-prioridad data-id="${esc(cofre.id)}">${Array.from({length:10},(_,i)=>`<option value="${i}" ${i===((cofre as typeof cofre&{prioridadSalida?:number}).prioridadSalida||0)?'selected':''}>${i===0?'Normal':i===9?'Máxima':`Prioridad ${i}`}</option>`).join('')}</select></label><p class="prod-ayuda">Las máquinas conectadas intentan guardar primero en los cofres con mayor prioridad.</p><div class="prod-acciones-dispositivo"><button class="btn small quiet" data-prod-accion="mover" data-id="${esc(cofre.id)}">Mover</button><button class="btn small quiet" data-prod-accion="retirar" data-id="${esc(cofre.id)}">Guardar cofre</button></div></article>`:'<p class="prod-ayuda">Selecciona el cofre que quieres usar.</p>'}</section><section class="prod-mochila" data-prod-mochila><h3 class="prod-section-title">Tu mochila</h3><p class="prod-ayuda">Toca el objeto y luego su destino. En computador también puedes arrastrarlo.</p>${casillas(s.casillasInventario,'mochila',nombre)}</section></section>`;
}

export interface CallbacksProduccion {
 actuar:(accion:AccionProduccion)=>Promise<Resultado>;
 colocar:(articulo:string)=>void;
 mover:(id:string)=>void;
 seleccionar:(id:string)=>void;
 refrescar:()=>void;
}
interface MemoriaUI {tab:TabProduccion;busqueda:string;filtro:string;seleccion:string;recetas:Record<string,string>;scroll:number}
const memorias=new WeakMap<HTMLElement,MemoriaUI>(),conexiones=new WeakMap<HTMLElement,AbortController>();
const referencia=(el:HTMLElement):ReferenciaCasilla=>({tipo:el.dataset.prodTipo as ReferenciaCasilla['tipo'],...(el.dataset.prodId?{id:el.dataset.prodId}:{}),casilla:Number(el.dataset.prodCasilla)});
const misma=(a:ReferenciaCasilla,b:ReferenciaCasilla)=>a.tipo===b.tipo&&a.id===b.id&&a.casilla===b.casilla;

/** Sin mutación optimista: los movimientos sólo se reflejan después de la aceptación del motor. */
export function conectarProduccion(root:HTMLElement,callbacks:CallbacksProduccion):()=>void {
 conexiones.get(root)?.abort();const controller=new AbortController();conexiones.set(root,controller);const {signal}=controller;
 const panel=root.querySelector<HTMLElement>('.produccion');if(!panel)return()=>controller.abort();
 const seleccion=panel.dataset.prodSeleccion||'';
 const memoria=memorias.get(root)||{tab:panel.dataset.prodTabInicial as TabProduccion,busqueda:'',filtro:panel.dataset.prodFiltroInicial||'todas',seleccion,recetas:{},scroll:0};
 if(memoria.seleccion!==seleccion&&seleccion)memoria.tab=panel.dataset.prodTabInicial as TabProduccion;
 memoria.seleccion=seleccion;memorias.set(root,memoria);
 let ocupado=false,origen:ReferenciaCasilla|null=null,modo:'todo'|'mitad'|'uno'='todo';
 const mensaje=(texto:string,error=false)=>{const e=root.querySelector<HTMLElement>('[data-prod-estado]');if(e){e.textContent=texto;e.classList.toggle('error',error);}};
 const botonesCasillas=()=>[...root.querySelectorAll<HTMLButtonElement>('[data-prod-casilla]')];
 const buscarCasilla=(ref:ReferenciaCasilla)=>botonesCasillas().find(b=>misma(referencia(b),ref));
 const elegirOrigen=(ref:ReferenciaCasilla|null)=>{
  origen=ref;modo='todo';const el=ref?buscarCasilla(ref):undefined;
  botonesCasillas().forEach(b=>{const activa=!!ref&&misma(referencia(b),ref);b.classList.toggle('seleccionada',activa);b.setAttribute('aria-pressed',String(activa));});
  const mandos=root.querySelector<HTMLElement>('[data-prod-transferencia]');if(mandos)mandos.hidden=!el;
  const texto=root.querySelector<HTMLElement>('[data-prod-origen]');if(texto)texto.textContent=el?`${el.dataset.nombre} · ${el.dataset.cantidad} unidades. Elige una casilla de destino.`:'';
  root.querySelectorAll<HTMLButtonElement>('[data-prod-cantidad]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.prodCantidad==='todo'));b.disabled=b.dataset.prodCantidad==='mitad'&&Number(el?.dataset.cantidad||0)<2;});
 };
 const tab=(valor:TabProduccion)=>{
  memoria.tab=valor;root.querySelectorAll<HTMLElement>('[data-prod-panel]').forEach(e=>{e.hidden=e.dataset.prodPanel!==valor;});
  root.querySelectorAll<HTMLElement>('[data-prod-tab]').forEach(e=>{const activa=e.dataset.prodTab===valor;e.setAttribute('aria-selected',String(activa));e.tabIndex=activa?0:-1;});
  const mochila=root.querySelector<HTMLElement>('[data-prod-mochila]');if(mochila)mochila.hidden=valor==='recetas';
  elegirOrigen(null);
 };
 const filtrar=()=>{
  const busqueda=normalizar(memoria.busqueda);let visibles=0;
  root.querySelectorAll<HTMLElement>('[data-prod-receta]').forEach(e=>{e.hidden=!(memoria.filtro==='todas'||e.dataset.categoria===memoria.filtro)||!e.dataset.buscar?.includes(busqueda);if(!e.hidden)visibles++;});
  const vacio=root.querySelector<HTMLElement>('[data-prod-sin-recetas]');if(vacio)vacio.hidden=visibles>0;
 };
 const mostrarRecetaManual=(maquina:HTMLElement,receta:string)=>{maquina.querySelectorAll<HTMLElement>('[data-prod-manual-detalle]').forEach(e=>{e.hidden=e.dataset.prodManualDetalle!==receta;});memoria.recetas[maquina.dataset.prodMaquina!]=receta;};
 const ejecutar=async(accion:AccionProduccion)=>{
  if(ocupado)return;ocupado=true;panel.setAttribute('aria-busy','true');memoria.scroll=root.scrollTop;
  try{const r=await callbacks.actuar(accion);if(signal.aborted)return;if(r.ok){elegirOrigen(null);callbacks.refrescar();}mensaje(r.mensaje,!r.ok);}
  catch{if(!signal.aborted)mensaje('No se pudo completar la acción. Tus objetos siguen a salvo.',true);}
  finally{ocupado=false;if(!signal.aborted)panel.removeAttribute('aria-busy');}
 };
 const transferir=(hasta:ReferenciaCasilla)=>{
  if(!origen||ocupado)return;if(misma(origen,hasta)){elegirOrigen(null);return;}
  if(hasta.tipo==='maquina'&&!(origen.tipo==='maquina'&&origen.id===hasta.id)){mensaje('Esta casilla es una salida. Los ingredientes se preparan con una receta o desde un cofre conectado.',true);return;}
  const pila=buscarCasilla(origen),cantidad=Number(pila?.dataset.cantidad||0);if(!cantidad){elegirOrigen(null);return;}
  void ejecutar({tipo:'transferir',desde:origen,hasta,...(modo==='mitad'?{cantidad:Math.ceil(cantidad/2)}:modo==='uno'?{cantidad:1}:{})});
 };
 const lotes=(el:HTMLInputElement|null)=>{const n=Number(el?.value||1);if(!Number.isInteger(n)||n<1||n>100){el?.reportValidity();mensaje('Elige entre 1 y 100 lotes enteros.',true);return null;}return n;};
 const actualizarLotes=(card:HTMLElement)=>{
  const entrada=card.querySelector<HTMLInputElement>('[data-prod-lotes]'),n=Number(entrada?.value||1);let materiales=Number.isInteger(n)&&n>=1&&n<=100;
  card.querySelectorAll<HTMLElement>('[data-prod-material]').forEach(li=>{const coste=Number(li.dataset.coste)*n,disponible=Number(li.dataset.disponible);li.classList.toggle('falta',!(disponible>=coste));li.classList.toggle('listo',disponible>=coste);const cantidad=li.querySelector('[data-prod-necesario]');if(cantidad)cantidad.textContent=Number.isFinite(coste)?String(coste):'—';if(disponible<coste)materiales=false;});
  const b=card.querySelector<HTMLButtonElement>('[data-prod-accion="fabricar"]');if(b){b.disabled=!(materiales&&card.dataset.permitida==='true'&&card.dataset.hayEstacion==='true');b.classList.toggle('primary',!b.disabled);}
 };
 root.addEventListener('click',event=>{
  const target=event.target as Element;if(!target.closest('.produccion')||ocupado)return;
  const boton=target.closest<HTMLButtonElement>('button');if(boton?.disabled)return;
  const pestaña=target.closest<HTMLElement>('[data-prod-tab]');if(pestaña){tab(pestaña.dataset.prodTab as TabProduccion);return;}
  const cantidad=target.closest<HTMLElement>('[data-prod-cantidad]');if(cantidad){modo=cantidad.dataset.prodCantidad as typeof modo;root.querySelectorAll<HTMLElement>('[data-prod-cantidad]').forEach(b=>b.setAttribute('aria-pressed',String(b===cantidad)));return;}
  const casilla=target.closest<HTMLElement>('[data-prod-casilla]');if(casilla){const ref=referencia(casilla);if(origen)transferir(ref);else if(Number(casilla.dataset.cantidad)>0)elegirOrigen(ref);return;}
  const control=target.closest<HTMLElement>('[data-prod-accion]');if(!control)return;
  const id=control.dataset.id||'';
  switch(control.dataset.prodAccion){
   case 'soltar':elegirOrigen(null);break;
   case 'seleccionar':memoria.scroll=0;callbacks.seleccionar(id);break;
   case 'colocar':callbacks.colocar(control.dataset.articulo!);break;
   case 'mover':callbacks.mover(id);break;
   case 'retirar':void ejecutar({tipo:'retirar_produccion',id});break;
   case 'cancelar-cola':void ejecutar({tipo:'cancelar_cola',id});break;
   case 'fabricar':{
    const card=control.closest<HTMLElement>('[data-prod-receta]')!,n=lotes(card.querySelector('[data-prod-lotes]'));if(n===null)return;
    const recetaId=control.dataset.receta!,estacion=card.querySelector<HTMLSelectElement>('[data-prod-estacion]');
    void ejecutar(estacion?{tipo:'encolar_receta',id:estacion.value,recetaId,cantidad:n}:{tipo:'fabricar',recetaId,cantidad:n});break;
   }
   case 'encolar':{
    const card=control.closest<HTMLElement>('[data-prod-maquina]')!,n=lotes(card.querySelector('[data-prod-manual-lotes]')),recetaId=card.querySelector<HTMLSelectElement>('[data-prod-manual-receta]')?.value;if(n!==null&&recetaId)void ejecutar({tipo:'encolar_receta',id,recetaId,cantidad:n});break;
   }
  }
 },{signal});
 root.addEventListener('input',event=>{
  const target=event.target as HTMLInputElement;
  if(target.matches('[data-prod-buscar]')){memoria.busqueda=target.value;filtrar();}
  if(target.matches('[data-prod-lotes]'))actualizarLotes(target.closest<HTMLElement>('[data-prod-receta]')!);
 },{signal});
 root.addEventListener('change',event=>{
  const target=event.target as HTMLSelectElement;if(ocupado)return;
  if(target.matches('[data-prod-filtro]')){memoria.filtro=target.value;filtrar();}
  else if(target.matches('[data-prod-elegir-cofre]')&&target.value){memoria.scroll=0;callbacks.seleccionar(target.value);}
  else if(target.matches('[data-prod-manual-receta]'))mostrarRecetaManual(target.closest<HTMLElement>('[data-prod-maquina]')!,target.value);
  else if(target.matches('[data-prod-automatica]'))void ejecutar({tipo:'receta_maquina',id:target.dataset.id!,recetaId:target.value||null});
  else if(target.matches('[data-prod-conexion]'))void ejecutar({tipo:'adyacencia',modo:target.value as 'cardinal'|'diagonal'});
  else if(target.matches('[data-prod-prioridad]'))void ejecutar({tipo:'prioridad_cofre',id:target.dataset.id!,prioridad:Number(target.value)});
 },{signal});
 root.addEventListener('keydown',event=>{
  const boton=(event.target as Element).closest<HTMLElement>('[data-prod-tab]');if(!boton)return;
  const tabs:TabProduccion[]=['recetas','taller','almacen'];let i=tabs.indexOf(memoria.tab);
  if(event.key==='ArrowRight')i=(i+1)%tabs.length;else if(event.key==='ArrowLeft')i=(i+tabs.length-1)%tabs.length;else if(event.key==='Home')i=0;else if(event.key==='End')i=tabs.length-1;else return;
  event.preventDefault();tab(tabs[i]);root.querySelector<HTMLElement>(`[data-prod-tab="${tabs[i]}"]`)?.focus();
 },{signal});
 root.addEventListener('dragstart',event=>{
  const casilla=(event.target as Element).closest<HTMLElement>('[data-prod-casilla]');if(!casilla||!Number(casilla.dataset.cantidad)||ocupado){event.preventDefault();return;}
  elegirOrigen(referencia(casilla));event.dataTransfer?.setData('application/x-granjita-produccion',JSON.stringify(origen));if(event.dataTransfer)event.dataTransfer.effectAllowed='move';casilla.classList.add('arrastrando');
 },{signal});
 root.addEventListener('dragover',event=>{
  const casilla=(event.target as Element).closest<HTMLElement>('[data-prod-casilla]');if(!casilla||!origen||ocupado)return;
  if(casilla.dataset.prodTipo==='maquina'&&!(origen.tipo==='maquina'&&origen.id===casilla.dataset.prodId))return;
  event.preventDefault();casilla.classList.add('destino');if(event.dataTransfer)event.dataTransfer.dropEffect='move';
 },{signal});
 root.addEventListener('dragleave',event=>(event.target as Element).closest<HTMLElement>('[data-prod-casilla]')?.classList.remove('destino'),{signal});
 root.addEventListener('drop',event=>{
  const casilla=(event.target as Element).closest<HTMLElement>('[data-prod-casilla]');if(!casilla)return;event.preventDefault();casilla.classList.remove('destino');if(origen)transferir(referencia(casilla));
 },{signal});
 root.addEventListener('dragend',()=>botonesCasillas().forEach(b=>b.classList.remove('arrastrando','destino')),{signal});
 root.addEventListener('scroll',()=>{memoria.scroll=root.scrollTop;},{signal,passive:true});
 const buscar=root.querySelector<HTMLInputElement>('[data-prod-buscar]'),filtro=root.querySelector<HTMLSelectElement>('[data-prod-filtro]');if(buscar)buscar.value=memoria.busqueda;if(filtro)filtro.value=memoria.filtro;
 root.querySelectorAll<HTMLElement>('[data-prod-maquina]').forEach(m=>{const select=m.querySelector<HTMLSelectElement>('[data-prod-manual-receta]'),recordada=memoria.recetas[m.dataset.prodMaquina!];if(select&&recordada&&[...select.options].some(o=>o.value===recordada&&!o.disabled)){select.value=recordada;mostrarRecetaManual(m,recordada);}});
 tab(memoria.tab);filtrar();root.scrollTop=memoria.scroll;
 return()=>controller.abort();
}
