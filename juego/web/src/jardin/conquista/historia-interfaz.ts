import './conquista.css';
import './historia.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/900.css';
import {CinematicaConquista} from './cinematica';
import {botonRedondo,icono} from './iconos';
import {PAISES_CONQUISTA,ciudadesConquista,ubicacionConquista,zonasCiudad,zonasPais,POSICIONES_ZONA,type EscalaMapa} from './mapa';
import {HistoriaConquistaPvZ,type PartidaHistoriaPvZ} from './historia-motor';
import {GuardadoHistoriaPvZ} from './historia-guardado';
import {escenarioHistoriaPvZ} from './historia-datos';
import {regionesHistoria,trazoRegionHistoria,puntoZonaHistoria} from './regiones';
import {EnManoPvZ} from '../pvz/ui/en-mano';
import {volarSobrePvZ} from '../pvz/ui/baraja';
import '../pvz/ui/manipulacion.css';
import {PASOS_DAVE} from './tutorial-dave';
import {AtlasPvZ} from '../pvz/arte/atlas';
import {urlArtePvZ,type HojaPvZ} from '../pvz/arte/catalogo';
import {RetratosPvZ} from '../pvz/ui/retratos';
import {EscenaPvZ} from '../pvz/vista/escena';
import {SonidoPvZ} from '../pvz/sonido';
import {PLANTAS_PVZ} from '../pvz/datos/plantas';
import {ZOMBIS_PVZ} from '../pvz/datos/zombis';
import type {OrdenPvZ} from '../pvz/tipos';
import {esModoAmigo} from '../../salas/perfil';

const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
type Editor={zona:number;semillas:string[];revision:number};
type Localizador={tipo:string;zona:number;escala:EscalaMapa;pais:number;ciudad:number};
export async function montarHistoriaConquista(){
 const params=new URLSearchParams(location.search),prueba=params.has('prueba'),amigo=esModoAmigo(),portatil=!!document.body.dataset.portatil;
 document.body.dataset.conquista='1';document.title='La Semilla Madre · Historia';
 const root=document.createElement('main');root.id='cq-app';root.className='cq-historia';document.body.append(root);
 let rutas:Partial<Record<HojaPvZ,string>>&{dave?:string}={};try{rutas=JSON.parse(document.getElementById('cq-arte-inline')?.textContent??'{}');}catch{/* recursos servidos */}
 const atlas=new AtlasPvZ(rutas),retratos=new RetratosPvZ(atlas),audio=new SonidoPvZ(),eventos=new AbortController();
 root.style.setProperty('--cq-fondo',`url("${rutas.fondos??urlArtePvZ('fondos-mundos.webp')}")`);
 const guardado=new GuardadoHistoriaPvZ({getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)},amigo?'amigo-conquista-historia-v2':'conquista-historia-v2');
 const $=<T extends HTMLElement=HTMLElement>(q:string)=>root.querySelector<T>(q);
 let mundo:HistoriaConquistaPvZ|null=null,almacenado:PartidaHistoriaPvZ|null=null,vista:EscenaPvZ|null=null,cine:CinematicaConquista|null=null,escuchasCampo:AbortController|null=null;
 let muerto=false,pantalla='carga',zona=8,escala:EscalaMapa='ciudad',pais=2,ciudad=6,vistaActual:'mapa'|'batalla'='mapa',seleccion=false;
 let editor:Editor|null=null,localizador:Localizador|null=null,firmaReservas='',modal='',carta:string|null=null,pala=false,sonido=false,errorGuardar=false,ocupado=false;
 let liberar:()=>void=()=>{},tieneLock=false,anterior=performance.now(),acumulado=0,frame=0,hudEn=0,guardarEn=8,noticiaHasta=0,ultimoAviso=0,firmaBanco='',firmaDetalle='';
 let mano:EnManoPvZ|null=null;
 let firmaFrentes='';
 let tutorialPaso=0,pausaAntesTutorial=false,numeroMapa=0;
 let piloto:((m:HistoriaConquistaPvZ)=>void)|null=null,importada:PartidaHistoriaPvZ|null=null;
 const imagen=(tipo:string)=>`<img src="${retratos.planta(tipo)}" alt="${esc(PLANTAS_PVZ[tipo].nombre)}" draggable="false">`;
 const rutaArte=(hoja:HojaPvZ,archivo:string)=>rutas[hoja]??urlArtePvZ(archivo);
 function navegar(modo:string){const u=new URL('jardin.html',location.href);u.searchParams.set('modo',modo);for(const k of['rol','local','salas'])if(params.has(k))u.searchParams.set(k,params.get(k)!);location.href=u.href;}
 function noticia(texto:string){const n=$('#cq-noticia');if(n){n.textContent=texto;n.classList.remove('cq-oculto');noticiaHasta=performance.now()+4500;}}
 function cerrarCampo(){mano?.destruir();mano=null;escuchasCampo?.abort();escuchasCampo=null;vista?.destruir();vista=null;}
 function pararCine(){cine?.destruir();cine=null;}
 function fondoAudio(){if(!sonido)return;if(mundo?.defensas.pausada&&modal!=='final'){audio.pausa();return;}audio.activar();const m=mundo?.defensas.observar(String(zona));if(pantalla==='menu')audio.tema('musica-inicio','ambiente-dia');else if(vistaActual==='mapa')audio.tema('musica-mapa','ambiente-dia');else audio.tema(!mundo?.estado.inicioCasa&&mundo?.estado.zonas[zona].incursion?.tipo==='defensa'?'musica-frontera':m?.esNoche?'musica-noche':m?.nivel.area==='piscina'?'musica-piscina':'musica-dia',m?.esNoche?'ambiente-noche':m?.nivel.area==='piscina'?'ambiente-agua':m&&m.filas>=7?'ambiente-almacen':m&&m.filas<=4?'ambiente-carretera':'ambiente-dia');}
 let completarAtlas:Promise<void>=Promise.resolve();
 function pelicula(final=false,portada=false){pararCine();if(sonido){audio.activar();void audio.anticipar(['alarma-frontera','captura','reserva']);audio.tema(final?'musica-final':'musica-inicio','ambiente-dia');}const nodo=$('.cq-cine');if(nodo){cine=new CinematicaConquista(atlas,nodo,!final&&!portada,final,portada,audio);cine.activarSonido(sonido&&!final);}}
 function archivo(nombre:string,contenido:string){const url=URL.createObjectURL(new Blob([contenido],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=nombre;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function exportar(){if(mundo)archivo('semilla-madre-historia.json',JSON.stringify(mundo.exportar(),null,2));}
 function guardar(){if(!mundo)return true;const ok=guardado.guardar(mundo.exportar());if(!ok){errorGuardar=true;mundo.pausar(true);audio.pausa();modal='guardado';pintarModal();}else{errorGuardar=false;almacenado=mundo.exportar();guardarEn=mundo.t+8;}return ok;}
 async function adquirir(){
  if(muerto)return false;if(tieneLock)return true;if(!navigator.locks){tieneLock=true;return true;}
  return new Promise<boolean>(resolve=>{void navigator.locks.request(guardado.clave,{ifAvailable:true},async lock=>{if(!lock||muerto){resolve(false);return;}tieneLock=true;const espera=new Promise<void>(r=>{liberar=()=>{tieneLock=false;r();};});resolve(true);await espera;}).catch(()=>resolve(false));});
 }
 function soltar(){cerrarCampo();pararCine();audio.pausa();mundo=null;piloto=null;importada=null;editor=null;localizador=null;modal='';liberar();tieneLock=false;liberar=()=>{};}
 function menu(){soltar();pantalla='menu';almacenado=guardado.leer();let anteriorGuardado=false;try{anteriorGuardado=!!localStorage.getItem(amigo?'amigo-conquista-prototipo-v1':'conquista-prototipo-v1');}catch{/* error visible en el archivo nuevo */}
  // La historia de verdad es la del mapa (modo=historia): «Continuar» va ahí si ya hay una guardada. La versión
  // portátil sigue con su historia propia. Importar/exportar viven dentro de cada historia.
  let nativa=false;try{nativa=!!localStorage.getItem(amigo?'amigo-conquista-historia-nativa-v3':'conquista-historia-nativa-v3');}catch{/* sin almacenamiento */}void anteriorGuardado;
  const acciones=portatil?[...(almacenado?[['continuar','Continuar historia','continuar']]:[]),['historia','Historia','historia'],['importar','Abrir respaldo','exportar']]
   :[['historia',nativa?'Continuar historia':'Historia','historia'],['biblioteca','Minijuegos','minijuegos'],['versus','Versus','versus']];
  root.innerHTML=`<section class="cq-menu cq-menu-inmersivo"><div class="cq-cine"></div><div class="cq-marca-mini"><small>PLANTAS CONTRA ZOMBIS</small><h1>La Semilla Madre</h1></div><nav class="cq-herramientas">${botonRedondo('pantalla','Pantalla completa','pantalla')}${botonRedondo('sonido','Sonido','sonido')}${botonRedondo('ayuda','Cómo jugar','ayuda')}</nav><nav class="cq-menu-dock">${acciones.map(([a,t,i])=>'<div>'+botonRedondo(a,t,i)+'<span>'+t+'</span></div>').join('')}</nav><input type="file" id="cq-respaldo" accept="application/json,.json" hidden><p class="cq-error cq-error-menu" role="alert">${esc(guardado.error)}</p></section><div class="cq-noticia cq-oculto" id="cq-noticia" role="status"></div><div id="cq-capa"></div>`;pelicula(false,true);
 }
 async function comenzar(continuar:boolean){
  if(ocupado)return;ocupado=true;
  try{await completarAtlas;if(!await adquirir()){noticia('Esta historia está abierta en otra pestaña. Ciérrala para continuar aquí.');return;}almacenado=guardado.leer();
   if(guardado.error){noticia(guardado.error);liberar();tieneLock=false;return;}
   if(continuar){if(almacenado)iniciar(HistoriaConquistaPvZ.restaurar(almacenado));else{noticia('Todavía no hay una historia guardada.');liberar();tieneLock=false;}}
   else if(almacenado){modal='nueva';pintarModal();}else iniciar(new HistoriaConquistaPvZ());
  }finally{ocupado=false;}
 }
 function iniciar(nuevo:HistoriaConquistaPvZ){pararCine();firmaFrentes='-';mundo=nuevo;piloto=null;errorGuardar=false;pantalla='juego';zona=8;vistaActual=nuevo.estado.inicioCasa?'batalla':'mapa';escala='ciudad';({pais,ciudad}=ubicacionConquista(nuevo.estado,zona));seleccion=false;editor=null;modal='';ultimoAviso=nuevo.estado.avisos.at(-1)?.id??0;acumulado=0;anterior=performance.now();guardarEn=nuevo.t+8;dibujarJuego();guardar();actualizar();}
 function dibujarJuego(){cerrarCampo();root.innerHTML=`<section class="cq-juego cq-inmersivo"><div class="cq-principal" id="cq-principal"></div><nav class="cq-herramientas cq-herramientas-juego">${botonRedondo('mapa','Mapa de la ciudad','ciudad')}${botonRedondo('subir-mapa','Mapa del país o del mundo','mapa')}${botonRedondo('pausa','Pausa global','pausa')}${botonRedondo('ayuda','Dave te explica cómo jugar','ayuda')}${botonRedondo('sonido','Sonido','sonido')}${botonRedondo('pantalla','Pantalla completa','pantalla')}${botonRedondo('salir','Volver al inicio','salir')}</nav></section><div class="cq-noticia cq-oculto" id="cq-noticia" role="status"></div><div id="cq-capa"></div><nav class="cq-frentes" id="cq-frentes" aria-label="Frentes que necesitan atención"></nav>`;pintarCuerpo();}
 function cartografia(escala:EscalaMapa,pais:number,ciudad:number){
  if(!mundo)return'';const s=mundo.estado;let puntos='';
  if(escala==='mundo')puntos=PAISES_CONQUISTA.map(p=>`<button class="cq-pin cq-pin-region" data-pais="${p.id}" style="--x:${p.x}%;--y:${p.y}%" aria-label="${p.nombre}"><span class="cq-emblema">${icono('pais')}</span><b>${p.nombre}</b><small></small></button>`).join('');
  else if(escala==='pais')puntos=ciudadesConquista(s,pais).map(c=>`<button class="cq-pin cq-pin-region" data-ciudad="${c.id}" style="--x:${c.x}%;--y:${c.y}%" aria-label="${c.nombre}"><span class="cq-emblema">${icono('ciudad')}</span><b>${c.nombre}</b><small></small></button>`).join('');
  else puntos=zonasCiudad(s,ciudad).map(z=>{const p=puntoZonaHistoria(z.id);return`<button class="cq-pin" data-zona="${z.id}" style="--x:${p.x}%;--y:${p.y}%" aria-label="${esc(z.nombre)}"><span class="cq-emblema">${icono(z.base?'historia':'atacar')}</span><b>${esc(z.nombre)}</b><small></small></button>`;}).join('');
  const nombre=escala==='mundo'?'El mundo':escala==='pais'?PAISES_CONQUISTA[pais].nombre:ciudadesConquista(s,pais).find(c=>c.id===ciudad)?.nombre??'Ciudad';
  const patron='cq-mixta-'+(++numeroMapa),bordes=`<svg class="cq-regiones" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="${patron}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="4" height="8" fill="#77d84f" fill-opacity=".2"/><rect x="4" width="4" height="8" fill="#9959d9" fill-opacity=".23"/></pattern></defs>${regionesHistoria(s,escala,pais,ciudad).map(r=>`<g class="cq-region ${r.estado}" data-region-zonas="${r.zonas.join(',')}"><path class="cq-trazo-mixto" d="${trazoRegionHistoria(r.poligono)}"/><path class="cq-trazo-parcela" d="${trazoRegionHistoria(r.poligono)}"/></g>`).join('')}</svg>`;
  return`<div class="cq-cartografia cq-cartografia-${escala}" style="background-image:url('${rutaArte(escala,`mapa-${escala}.webp`)}')">${bordes}${puntos}</div><div class="cq-nombre-mapa"><small>${escala==='mundo'?'MUNDO':escala==='pais'?'PAÍS':'CIUDAD'}</small><b>${esc(nombre)}</b></div>`;
 }
 function pintarCuerpo(){cerrarCampo();firmaBanco=firmaDetalle='';firmaFrentes='-';const cont=$('#cq-principal');if(!cont||!mundo)return;
  if(vistaActual==='mapa'){
   fondoAudio();mundo.seleccionar(null);cont.innerHTML=cartografia(escala,pais,ciudad)+'<div class="cq-ordenes cq-oculto" id="cq-detalle"></div>';
  }else{fondoAudio();mundo.seleccionar(zona);cont.innerHTML='<div class="cq-combate"><div class="cq-arena" id="cq-arena"></div><div class="cq-banco" id="cq-banco"></div></div><nav class="cq-intervencion">'+botonRedondo('pala','Pala: retirar una planta','equipo').replace(icono('equipo'),`<img class="cq-pala-imagen" src="${retratos.objeto(6)}" alt="">`)+'</nav><div class="cq-estado-frente" id="cq-estado-frente" role="status"></div>';vista=new EscenaPvZ(atlas,$('#cq-arena')!);escuchasCampo=new AbortController();mano=new EnManoPvZ(vista.canvas,root);vista.canvas.addEventListener('pointerdown',tocar,{signal:escuchasCampo.signal});vista.canvas.addEventListener('pointermove',e=>{const m=mundo?.defensas.observar(String(zona)),q=m&&vista?.tocar(e.clientX,e.clientY,m);vista?.resaltar((carta||pala)&&q?{fila:q.fila,col:q.col}:null);},{signal:escuchasCampo.signal});vista.canvas.addEventListener('pointerleave',()=>vista?.resaltar(null),{signal:escuchasCampo.signal});vista.canvas.addEventListener('contextmenu',e=>{e.preventDefault();carta=null;pala=false;actualizar();},{signal:escuchasCampo.signal});const m=mundo.defensas.observar(String(zona));if(m)vista.dibujar(m);}
 }
 function irMapa(subir=false){if(!mundo)return;vistaActual='mapa';seleccion=false;if(subir)escala=escala==='ciudad'?'pais':'mundo';else{escala='ciudad';({pais,ciudad}=ubicacionConquista(mundo.estado,zona));}pintarCuerpo();actualizar();}
 function verDefensa(id:number){if(!mundo?.defensas.observar(String(id)))return;zona=id;vistaActual='batalla';seleccion=false;carta=null;pala=false;pintarCuerpo();actualizar();}
 function ordenar(orden:OrdenPvZ){if(!mundo)return false;const ok=mundo.ordenar(zona,orden),m=mundo.defensas.observar(String(zona));if(m){const e=m.consumirEventos();vista?.eventos(e,m.t,m);if(sonido)audio.eventos(e);}if(ok)actualizar();return ok;}
 function tocar(e:PointerEvent){e.preventDefault();const m=mundo?.defensas.observar(String(zona));if(!m||!vista)return;const q=vista.tocar(e.clientX,e.clientY,m);if(!q)return;if(q.sol!==undefined)ordenar({tipo:'recoger',id:q.sol});else if(pala){if(ordenar({tipo:'pala',fila:q.fila,col:q.col})){pala=false;actualizar();}}else if(carta&&ordenar({tipo:'plantar',planta:carta,fila:q.fila,col:q.col})){carta=null;actualizar();}}
 function abrirEditor(){if(!mundo||mundo.estado.zonas[zona].incursion)return;editor={zona,semillas:[...mundo.defensas.semillas(String(zona))],revision:mundo.defensas.revision};modal='editor';pintarModal();}
 function localizar(tipo:string){
  if(!mundo||!editor)return;const origen=mundo.defensas.propietaria(tipo);
  if(origen===null){noticia('Esta semilla ya está disponible.');pintarModal();return;}
  localizador={tipo,zona:Number(origen),escala:'ciudad',...ubicacionConquista(mundo.estado,Number(origen))};modal='localizar';pintarModal();actualizar();
 }
 function pintarEditor(){if(!mundo||!editor)return'';const e=editor,z=mundo.estado.zonas[e.zona],d=escenarioHistoriaPvZ(e.zona);
  const fichas=mundo.estado.desbloqueadas.map(id=>{
   const origen=mundo!.defensas.propietaria(id),ocupada=origen!==null&&origen!==String(e.zona),activa=ocupada&&!!mundo!.estado.zonas[Number(origen)].incursion;
   const nombre=origen===null?'Disponible':origen===String(e.zona)?'En esta zona':mundo!.estado.zonas[Number(origen)].nombre;
   return`<div class="cq-grupo-semilla" data-grupo-semilla="${id}"><button class="cq-ficha ${e.semillas.includes(id)?'cq-elegida':''}" data-semilla-equipo="${id}" aria-pressed="${e.semillas.includes(id)}" ${activa?'disabled':''} title="${esc(PLANTAS_PVZ[id].descripcion)}">${imagen(id)}<b>${esc(PLANTAS_PVZ[id].nombre)}</b><small>☀ ${PLANTAS_PVZ[id].sol}</small></button>${origen===null?'<span class="cq-origen-semilla">Disponible</span>':`<button class="cq-origen-semilla" data-localizar-semilla="${id}" aria-label="Localizar ${esc(PLANTAS_PVZ[id].nombre)} en ${esc(mundo!.estado.zonas[Number(origen)].nombre)}">${icono('mapa')}${esc(nombre)}${activa?' · ⚔':''}</button>`}</div>`;
  }).join('');
  return`<section class="cq-modal cq-editor cq-semillas-editor" role="dialog" aria-modal="true" aria-label="Semillas de ${esc(z.nombre)}"><header><div><small>${d.nivel.tablero!.filas} CARRILES</small><h2>${esc(z.nombre)}</h2></div><div class="cq-enemigos-previstos" aria-label="Enemigos de esta zona">${d.nivel.zombis.map(id=>`<img src="${retratos.zombi(id)}" alt="${esc(ZOMBIS_PVZ[id].nombre)}" title="${esc(ZOMBIS_PVZ[id].nombre)}">`).join('')}</div>${botonRedondo('cerrar-modal','Cerrar selección','cerrar')}</header>${barajaEditor()}<div class="cq-catalogo">${fichas}</div><p class="cq-traslados">${e.semillas.length}/10 tipos · Cada tipo queda reservado para esta zona. Los tipos trasladados se retiran de su defensa anterior sin devolver soles. Toca su procedencia para localizarla. Las oleadas continúan.</p><p class="cq-error" id="cq-error-editor" role="alert"></p><div class="cq-linea"><button data-cq="cerrar-modal">Cancelar</button><button class="cq-verde" data-cq="confirmar-equipo">Guardar equipo</button></div></section>`;
 }
 function barajaEditor(){if(!editor)return'';return`<div class="pvz-baraja-elegida" aria-label="Baraja de esta zona"><span>${editor.semillas.length}/10</span>${Array.from({length:10},(_,i)=>{const id=editor!.semillas[i];return id?`<button class="pvz-ranura" data-quitar-semilla="${id}" aria-label="Retirar ${esc(PLANTAS_PVZ[id].nombre)} de la baraja">${imagen(id)}<small>${PLANTAS_PVZ[id].sol}</small></button>`:'<div class="pvz-ranura" aria-hidden="true"></div>';}).join('')}</div>`;}
 function pintarLocalizador(){if(!mundo||!localizador)return'';const l=localizador;
  return`<section class="cq-localizador" role="dialog" aria-modal="true" aria-label="Ubicación de ${esc(PLANTAS_PVZ[l.tipo].nombre)}">${cartografia(l.escala,l.pais,l.ciudad)}<nav class="cq-herramientas cq-localizador-controles">${botonRedondo('volver-equipo','Volver al equipo sin perder la selección','retirarse')}${botonRedondo('centrar-reserva','Localizar la reserva actual','equipo')}${botonRedondo('subir-reserva','Mapa del país o del mundo','mapa')}</nav><div class="cq-reserva-localizada">${imagen(l.tipo)}<div><b>${esc(PLANTAS_PVZ[l.tipo].nombre)}</b><small id="cq-estado-reserva"></small></div></div></section>`;
 }
 function abrirTutorial(){if(errorGuardar)return;tutorialPaso=0;pausaAntesTutorial=mundo?.defensas.pausada??false;if(mundo){mundo.pausar(true);if(!guardar())return;}modal='ayuda';audio.pausa();pintarModal();if(sonido)audio.dave(PASOS_DAVE[0].audio);}
 function cerrarTutorial(){audio.cancelarDave();if(mundo)mundo.pausar(pausaAntesTutorial);modal=pausaAntesTutorial&&mundo?'pausa':'';pintarModal();actualizar();anterior=performance.now();acumulado=0;fondoAudio();if(mundo)guardar();}
 function avanzarTutorial(delta:number){tutorialPaso=Math.max(0,Math.min(PASOS_DAVE.length-1,tutorialPaso+delta));pintarModal();if(sonido)audio.dave(PASOS_DAVE[tutorialPaso].audio);}
 function pintarTutorial(){const paso=PASOS_DAVE[tutorialPaso],mapas=tutorialPaso===1||tutorialPaso===2;
  const muestra=mapas?`<div class="cq-tutorial-mapas" aria-hidden="true">${(['mundo','pais','ciudad'] as const).map(hoja=>`<img src="${rutaArte(hoja,'mapa-'+hoja+'.webp')}" alt="">`).join('')}</div>`:`<div class="cq-tutorial-ejemplo" aria-hidden="true">${imagen(paso.planta)}<span>${icono(paso.icono)}</span></div>`;
  return`<section class="cq-tutorial" role="dialog" aria-modal="true" aria-label="Guía de Dave"><img class="cq-dave" src="${rutas.dave??urlArtePvZ('dave-tutorial.webp')}" alt="Dave, tu vecino jardinero"><div class="cq-tutorial-globo"><header><small>DAVE · ${tutorialPaso+1} / ${PASOS_DAVE.length}</small>${botonRedondo('cerrar-tutorial','Volver al jardín','cerrar')}</header><h2>${esc(paso.titulo)}</h2>${muestra}<p aria-live="polite">${esc(paso.texto)}</p><nav>${tutorialPaso?botonRedondo('dave-anterior','Explicación anterior','retirarse'):''}${botonRedondo('sonido','Activar o desactivar el sonido','sonido')}${tutorialPaso===PASOS_DAVE.length-1?'<button class="cq-verde" data-cq="cerrar-tutorial">¡Vamos al jardín!</button>':botonRedondo('dave-siguiente','Siguiente explicación','continuar')}</nav></div></section>`;
 }
 function pintarModal(){if(modal)mano?.habilitar(false);const capa=$('#cq-capa');if(!capa)return;
  for(const nodo of root.children)if(nodo instanceof HTMLElement&&nodo!==capa&&nodo.id!=='cq-noticia')nodo.inert=!!modal;
  if(!modal){capa.innerHTML='';return;}let contenido='';
  if(modal==='editor'){firmaReservas=estadoReservas();contenido=pintarEditor();}
  else if(modal==='localizar')contenido=pintarLocalizador();
  else if(modal==='pausa')contenido=`<section class="cq-modal cq-pausa-breve" role="dialog" aria-modal="true" aria-label="Pausa global"><h2>Un respiro en el jardín</h2><nav>${botonRedondo('pausa','Continuar','reanudar')}${botonRedondo('exportar','Exportar historia','exportar')}${botonRedondo('salir','Volver al inicio','salir')}</nav></section>`;
  else if(modal==='guardado')contenido=`<section class="cq-modal" role="dialog" aria-modal="true"><h2>La historia está en pausa</h2><p>${esc(guardado.error)}</p><button data-cq="reintentar">Reintentar guardado</button><button data-cq="exportar">Exportar esta historia</button></section>`;
  else if(modal==='nueva')contenido=`<section class="cq-modal" role="dialog" aria-modal="true"><h2>¿Comenzar otra historia?</h2><p>La historia guardada tiene ${almacenado?.mundo.zonas.filter(z=>z.dueno==='plantas').length??0} zonas recuperadas. Puedes exportarla antes de reemplazarla. Las partidas anteriores y los minijuegos se conservan.</p><button data-cq="exportar-almacenada">Exportar la historia guardada</button><button data-cq="confirmar-nueva">Comenzar otra historia</button><button data-cq="cancelar-nueva">Conservar y volver</button></section>`;
  else if(modal==='importar'&&importada)contenido=`<section class="cq-modal" role="dialog" aria-modal="true"><h2>Abrir este respaldo</h2><p>${importada.mundo.zonas.filter(z=>z.dueno==='plantas').length} zonas recuperadas · ${importada.mundo.zonas.filter(z=>z.incursion).length} combates en curso.</p><p>${almacenado?'Reemplazará la historia actual de esta versión. Puedes exportarla antes de continuar.':'Se guardará como tu historia de esta versión.'} Los archivos del prototipo y los minijuegos se conservan.</p>${almacenado?'<button data-cq="exportar-almacenada">Exportar historia actual</button>':''}<button data-cq="confirmar-importacion">Abrir respaldo</button><button data-cq="cancelar-nueva">Conservar y volver</button></section>`;
  else if(modal==='biblioteca')contenido=`<section class="cq-modal" role="dialog" aria-modal="true"><h2>Más formas de jugar</h2><button data-cq="pvz2">Jardín clásico 2</button><button data-cq="pvz1">Jardín clásico 1 <small>(con tus propios archivos del juego)</small></button><button data-cq="aventura">Aventura de 40 niveles</button><button data-cq="clasicos">Patios de los Desvelados</button><button data-cq="historia-v2">Primera campaña</button><button data-cq="versus-clasico">Versus clásico <small>(36 territorios)</small></button><button data-cq="anterior">Conquista y versus</button><button data-cq="cerrar-modal">Volver</button></section>`;
  else if(modal==='ayuda')contenido=pintarTutorial();
  else if(modal==='final')contenido=mundo?.estado.ganador==='plantas'?`<div class="cq-cine cq-cine-final"></div><div class="cq-final-rotulo"><small>100% PURIFICADO</small><h2>Un mundo vuelve a florecer</h2></div><nav class="cq-final-controles">${botonRedondo('salir','Volver al jardín','historia')}${botonRedondo('exportar','Exportar historia','exportar')}</nav>`:`<div class="cq-derrota-mapa" aria-hidden="true">${cartografia('ciudad',2,6)}</div><div class="cq-final-rotulo cq-derrota-rotulo"><h2>Los zombis tomaron la casa</h2></div><nav class="cq-final-controles">${botonRedondo('salir','Volver al jardín','historia')}${botonRedondo('exportar','Exportar historia','exportar')}</nav>`;
  capa.innerHTML=`<div class="cq-modal-fondo ${modal==='final'?'cq-fin-inmersivo':modal==='localizar'?'cq-localizador-fondo':''}">${contenido}</div>`;if(modal==='final'){if(mundo?.estado.ganador==='plantas')pelicula(true);else pararCine();}
 }
 function estadoReservas(){return mundo?[mundo.defensas.revision,...mundo.estado.zonas.map(z=>[z.dueno,!!z.incursion].join(':'))].join('|'):'';}
 function actualizar(){if(!mundo||pantalla!=='juego')return;const s=mundo.estado,frentes=mundo.activos.filter(z=>z.id!==zona||vistaActual==='mapa'),firma=frentes.map(z=>z.id+':'+z.incursion?.id).join(',');if(firma!==firmaFrentes){firmaFrentes=firma;const nav=$('#cq-frentes');if(nav)nav.innerHTML=frentes.map(z=>`<button class="cq-alerta-frente ${z.base==='plantas'?'cq-alerta-casa':''}" data-frente="${z.id}" aria-label="${esc(z.nombre)} bajo ataque: localizar en el mapa">${icono(z.base==='plantas'?'historia':'atacar')}<span>${esc(z.base==='plantas'?'¡La casa!':z.nombre)}</span></button>`).join('');}const m=mundo.defensas.observar(String(zona));
  if(modal==='editor'&&firmaReservas!==estadoReservas()){const scroll=$('.cq-catalogo')?.scrollTop??0;pintarModal();const catalogo=$('.cq-catalogo');if(catalogo)catalogo.scrollTop=scroll;}
  for(const region of root.querySelectorAll<SVGGElement>('[data-region-zonas]')){const ids=region.dataset.regionZonas!.split(',').map(Number),n=ids.filter(id=>s.zonas[id].dueno==='plantas').length;for(const estado of['plantas','zombis','mixta'])region.classList.toggle(estado,estado===(n===0?'zombis':n===ids.length?'plantas':'mixta'));}
  for(const pin of root.querySelectorAll<HTMLButtonElement>('.cq-pin')){const ids=pin.dataset.zona!==undefined?[Number(pin.dataset.zona)]:pin.dataset.ciudad!==undefined?zonasCiudad(s,Number(pin.dataset.ciudad)).map(z=>z.id):zonasPais(s,Number(pin.dataset.pais)).map(z=>z.id);const zs=ids.map(id=>s.zonas[id]),n=zs.filter(z=>z.dueno==='plantas').length,activos=zs.filter(z=>z.incursion).length;pin.classList.toggle('plantas',n===zs.length);pin.classList.toggle('zombis',n===0);pin.classList.toggle('mixta',n>0&&n<zs.length);pin.classList.toggle('en-guerra',activos>0);pin.classList.toggle('cq-reserva-objetivo',modal==='localizar'&&!!localizador&&ids.includes(localizador.zona));pin.querySelector('small')!.textContent=activos?'⚔ '+activos:ids.length>1?n+'/'+ids.length:'';}
  if(modal==='localizar'&&localizador){const origen=mundo.defensas.propietaria(localizador.tipo),estado=$('#cq-estado-reserva');if(estado)estado.textContent=origen===null?'Disponible · la reserva se ha liberado':s.zonas[Number(origen)].nombre+(s.zonas[Number(origen)].incursion?' · Batalla en curso':' · Reservada');}
  if(vistaActual==='mapa'){
   const z=s.zonas[zona],d=$('#cq-detalle'),firma=[zona,seleccion,z.dueno,!!z.incursion,mundo.puedeLlegar(zona),mundo.defensas.revision,!!m,mundo.defensas.pausada,Math.ceil(Math.max(0,z.descanso-mundo.t))].join(':');
   if(d&&firma!==firmaDetalle){firmaDetalle=firma;d.classList.toggle('cq-oculto',!seleccion);if(seleccion)d.innerHTML=`<div class="cq-orden-titulo"><b>${esc(z.nombre)}</b>${botonRedondo('cerrar-zona','Cerrar selección','cerrar')}</div><div class="cq-opciones-zona">${z.incursion?botonRedondo('intervenir','Intervenir en esta defensa','atacar'):mundo.puedeLlegar(zona)?`${botonRedondo('equipo','Preparar semillas de esta zona','equipo')}${z.dueno==='zombis'?botonRedondo('expedicion','Iniciar expedición','atacar'):m?botonRedondo('intervenir','Ver la defensa conservada','formacion'):''}`:''}</div><small class="cq-dato-util">${esc(z.incursion?'Batalla en curso':mundo.estado.inicioCasa&&zona!==8?'Completa primero la defensa de la casa':zona===3&&!mundo.puedeLlegar(zona)?'Recupera primero las otras once zonas':!mundo.puedeLlegar(zona)?'Necesitas una ruta conectada':z.dueno==='plantas'?'Zona recuperada':mundo.defensas.semillas(String(zona)).length?'Equipo listo':'Prepara un equipo antes de salir')}</small><div class="cq-equipo-mini">${mundo.defensas.semillas(String(zona)).map(imagen).join('')}</div>`;}
   const expedicion=$<HTMLButtonElement>('[data-cq="expedicion"]');if(expedicion)expedicion.disabled=!mundo.puedeExpedicion(zona)||!mundo.defensas.semillas(String(zona)).length;
  }else if(m){const firma=m.semillas.join(',');if(firma!==firmaBanco){firmaBanco=firma;$('#cq-banco')!.innerHTML='<span class="cq-reserva-sol" title="Sol de esta zona">☀<b id="cq-sol-local"></b></span>'+m.semillas.map((id,i)=>`<button class="cq-carta" data-carta="${id}" title="${esc(PLANTAS_PVZ[id].nombre)}" aria-label="${esc(PLANTAS_PVZ[id].nombre)}, ${PLANTAS_PVZ[id].sol} de sol">${imagen(id)}<span>${PLANTAS_PVZ[id].sol}</span><small>${(i+1)%10}</small><i></i></button>`).join('');}
   $('#cq-sol-local')!.textContent=String(m.sol);for(const b of root.querySelectorAll<HTMLButtonElement>('[data-carta]')){const id=b.dataset.carta!,rec=m.recargas[id]??0;b.classList.toggle('cq-elegida',!pala&&carta===id);b.setAttribute('aria-pressed',String(!pala&&carta===id));b.disabled=!!m.terminado||mundo.defensas.pausada||m.sol<PLANTAS_PVZ[id].sol||rec>0;b.style.setProperty('--recarga',Math.min(1,rec/Math.max(.01,PLANTAS_PVZ[id].recarga))*100+'%');}
   mano?.elegir(pala?retratos.objeto(6):carta?retratos.planta(carta):null,pala);mano?.habilitar(!mundo.defensas.pausada&&!modal&&!m.terminado);const botonPala=$('[data-cq="pala"]');botonPala?.classList.toggle('cq-pala-activa',pala);botonPala?.setAttribute('aria-pressed',String(pala));
   const estado=$('#cq-estado-frente');if(estado)estado.textContent=m.terminado==='gano'?'Defensa conservada':m.terminado==='perdio'?'Los zombis tomaron esta zona':m.oleada?'Oleada '+m.oleada+' / '+(m.director?.total??0):'';
  }else{mano?.habilitar(false);const banco=$('#cq-banco'),estado=$('#cq-estado-frente');if(banco)banco.innerHTML='';if(estado)estado.textContent='Los zombis tomaron esta zona';}
  const aviso=s.avisos.at(-1);if(aviso&&aviso.id!==ultimoAviso){ultimoAviso=aviso.id;noticia(aviso.texto);if(sonido){audio.efecto(s.zonas[aviso.zona]?.incursion?.tipo==='defensa'?'alarma-frontera':s.zonas[aviso.zona]?.dueno==='plantas'?'captura':'oleada');if(vistaActual==='batalla'&&aviso.zona===zona)fondoAudio();}}
  if(s.ganador&&modal!=='final'&&!errorGuardar){modal='final';editor=null;guardar();pintarModal();}
  else if(mundo.defensas.pausada&&!modal){modal='pausa';pintarModal();}
 }
 function pausa(){if(!mundo||errorGuardar||mundo.estado.ganador)return;mundo.pausar(!mundo.defensas.pausada);editor=null;modal=mundo.defensas.pausada?'pausa':'';acumulado=0;anterior=performance.now();pintarModal();actualizar();fondoAudio();guardar();}
 root.addEventListener('click',e=>{const b=(e.target as Element).closest<HTMLButtonElement>('button');if(!b||b.disabled)return;if(sonido)audio.activar();
  if(b.dataset.localizarSemilla){localizar(b.dataset.localizarSemilla);return;}
  if(modal==='localizar'&&localizador){
   if(b.dataset.pais!==undefined){localizador.pais=Number(b.dataset.pais);localizador.escala='pais';pintarModal();actualizar();return;}
   if(b.dataset.ciudad!==undefined){localizador.ciudad=Number(b.dataset.ciudad);localizador.escala='ciudad';pintarModal();actualizar();return;}
   if(b.dataset.zona!==undefined)return; // Consulta del mapa: no explora ni reasigna tipos.
  }
  if(b.dataset.pais!==undefined){pais=Number(b.dataset.pais);escala='pais';seleccion=false;pintarCuerpo();actualizar();return;}
  if(b.dataset.ciudad!==undefined){ciudad=Number(b.dataset.ciudad);escala='ciudad';seleccion=false;pintarCuerpo();actualizar();return;}
  if(b.dataset.zona!==undefined&&mundo){zona=Number(b.dataset.zona);mundo.explorar(zona);seleccion=true;actualizar();guardar();return;}
  if(b.dataset.frente!==undefined&&mundo){zona=Number(b.dataset.frente);irMapa();seleccion=true;actualizar();return;}
  if(b.dataset.carta){carta=b.dataset.carta;pala=false;actualizar();return;}
  if(b.dataset.quitarSemilla&&editor){editor.semillas=editor.semillas.filter(id=>id!==b.dataset.quitarSemilla);pintarModal();return;}
  if(b.dataset.semillaEquipo&&editor){const id=b.dataset.semillaEquipo,desde=b.getBoundingClientRect(),anadir=!editor.semillas.includes(id)&&editor.semillas.length<10;editor.semillas=editor.semillas.includes(id)?editor.semillas.filter(t=>t!==id):editor.semillas.length<10?[...editor.semillas,id]:editor.semillas;pintarModal();if(anadir)volarSobrePvZ(root,retratos.planta(id),desde,$(`[data-quitar-semilla="${id}"]`));return;}
  switch(b.dataset.cq){
   case'historia':if(portatil||params.get('modo')==='historia-v2')void comenzar(false);else navegar('historia');break;case'continuar':void comenzar(true);break;
   case'importar':$('#cq-respaldo')?.click();break;case'confirmar-importacion':if(importada){const m=HistoriaConquistaPvZ.restaurar(importada);importada=null;void completarAtlas.then(()=>iniciar(m));}break;
   case'confirmar-nueva':void completarAtlas.then(()=>iniciar(new HistoriaConquistaPvZ()));break;case'cancelar-nueva':menu();break;
   case'exportar-almacenada':if(almacenado)archivo('semilla-madre-anterior.json',JSON.stringify(almacenado,null,2));break;
   case'biblioteca':modal='biblioteca';pintarModal();break;case'pvz1':navegar('pvz1');break;case'pvz2':navegar('pvz2');break;case'prueba-frente':navegar('prueba-frente');break;case'historia-v2':navegar('historia-v2');break;case'aventura':navegar('aventura');break;case'clasicos':navegar('clasicos');break;case'anterior':case'versus':navegar('versus');break;case'versus-clasico':navegar('prototipo');break;
   case'mapa':irMapa();break;case'subir-mapa':irMapa(true);break;case'cerrar-zona':seleccion=false;firmaDetalle='';actualizar();break;
   case'equipo':abrirEditor();break;
   case'volver-equipo':if(editor){localizador=null;modal='editor';pintarModal();actualizar();}break;
   case'centrar-reserva':if(localizador)localizar(localizador.tipo);break;
   case'subir-reserva':if(localizador){localizador.escala=localizador.escala==='ciudad'?'pais':'mundo';pintarModal();actualizar();}break;
   case'confirmar-equipo':if(editor&&mundo){const error=mundo.preparar(editor.zona,editor.semillas,editor.revision);if(error){$('#cq-error-editor')!.textContent=error;editor.revision=mundo.defensas.revision;}else{if(sonido)audio.efecto('reserva');editor=null;modal='';pintarModal();actualizar();guardar();}}break;
   case'expedicion':if(mundo?.expedicion(zona)){guardar();verDefensa(zona);}else noticia('Revisa las semillas, la ruta y los combates abiertos.');break;
   case'intervenir':verDefensa(zona);break;case'pala':pala=!pala;carta=null;actualizar();break;
   case'pausa':pausa();break;case'reintentar':if(guardar()&&mundo){mundo.pausar(false);modal='';pintarModal();acumulado=0;anterior=performance.now();actualizar();fondoAudio();}break;
   case'salir':if(guardar())menu();break;case'exportar':exportar();break;
   case'ayuda':abrirTutorial();break;case'dave-anterior':avanzarTutorial(-1);break;case'dave-siguiente':avanzarTutorial(1);break;case'cerrar-tutorial':cerrarTutorial();break;case'cerrar-modal':editor=null;modal='';pintarModal();break;
   case'sonido':sonido=!sonido;audio.habilitado=sonido;if(sonido){audio.activar();if(modal==='ayuda')audio.dave(PASOS_DAVE[tutorialPaso].audio);else fondoAudio();}cine?.activarSonido(sonido);b.setAttribute('aria-pressed',String(sonido));break;
   case'pantalla':if(document.fullscreenElement)void document.exitFullscreen();else void document.documentElement.requestFullscreen().catch(()=>noticia('El navegador no permite pantalla completa.'));break;
  }
 },{signal:eventos.signal});
 root.addEventListener('change',async e=>{if((e.target as HTMLInputElement).id!=='cq-respaldo'||ocupado)return;const input=e.target as HTMLInputElement,file=input.files?.[0];input.value='';if(!file)return;ocupado=true;
  try{if(file.size>16*1024*1024)throw Error('El respaldo es demasiado grande.');const preparada=HistoriaConquistaPvZ.restaurar(JSON.parse(await file.text())).exportar();if(muerto)return;
   if(!await adquirir()){noticia('Esta historia está abierta en otra pestaña.');return;}almacenado=guardado.leer();if(guardado.error){noticia(guardado.error);liberar();tieneLock=false;return;}
   importada=preparada;modal='importar';pintarModal();
  }catch{noticia('No se pudo abrir ese respaldo. No se ha cambiado ningún archivo.');}finally{ocupado=false;}
 },{signal:eventos.signal});
 document.addEventListener('keydown',e=>{if((e.target as HTMLElement).matches('input,textarea'))return;if(modal==='ayuda'){if(e.key==='Escape')cerrarTutorial();else if(e.key==='ArrowRight')avanzarTutorial(1);else if(e.key==='ArrowLeft')avanzarTutorial(-1);return;}if(!mundo)return;if(e.key===' '){e.preventDefault();pausa();}else if(e.key==='Escape'&&editor){if(modal==='localizar'){localizador=null;modal='editor';}else{editor=null;modal='';}pintarModal();actualizar();}else if(!modal&&e.key==='Escape'){carta=null;pala=false;actualizar();}else if(!modal&&(e.key.toLowerCase()==='m'||e.key==='Tab')){e.preventDefault();irMapa();}else if(/^\d$/.test(e.key)){const id=mundo.defensas.semillas(String(zona))[(Number(e.key)+9)%10];if(id){carta=id;pala=false;actualizar();}}},{signal:eventos.signal});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&mundo&&!mundo.estado.ganador){mundo.pausar(true);audio.pausa();if(!modal){modal='pausa';pintarModal();}guardar();}},{signal:eventos.signal});
 window.addEventListener('storage',e=>{if(e.key===guardado.clave&&mundo)guardar();},{signal:eventos.signal});
 function paso(){if(!mundo)return;const empezando=!!mundo.estado.inicioCasa;piloto?.(mundo);const anterior=mundo.defensas.observar(String(zona)),es=mundo.paso();for(const e of es)if(e.zona===String(zona)&&vista){const m=mundo.defensas.observar(e.zona)??anterior;if(m){vista.eventos(e.eventos,m.t,m);if(!mundo.defensas.observar(e.zona))vista.dibujar(m);if(sonido)audio.eventos(e.eventos);}}if(empezando&&!mundo.estado.inicioCasa&&!mundo.estado.ganador){irMapa();noticia('La casa está a salvo. Sus plantas se conservan; ya puedes preparar la siguiente expedición.');}}
 function cuadro(t:number){if(muerto)return;cine?.dibujar(t);const dt=Math.min(.2,Math.max(0,(t-anterior)/1000));anterior=t;if(mundo&&pantalla==='juego'){if(!mundo.defensas.pausada&&!mundo.estado.ganador){acumulado=Math.min(.2,acumulado+dt);while(acumulado>=1/60){paso();acumulado-=1/60;}}const m=mundo.defensas.observar(String(zona));if(vista&&m){vista.dibujar(m);if(sonido&&!mundo.defensas.pausada)audio.actualizar(m);}if(t-hudEn>150){actualizar();hudEn=t;}if(mundo.t>=guardarEn&&!errorGuardar)guardar();if(t>noticiaHasta)$('#cq-noticia')?.classList.add('cq-oculto');}frame=requestAnimationFrame(cuadro);}
 function destruir(){if(muerto)return;guardar();muerto=true;cancelAnimationFrame(frame);eventos.abort();soltar();retratos.destruir();atlas.destruir();audio.destruir();root.remove();delete document.body.dataset.conquista;delete(window as any).__historiaPvZ;}
 const volver=(e:PageTransitionEvent)=>{if(e.persisted&&muerto)location.reload();};window.addEventListener('pageshow',volver);window.addEventListener('pagehide',e=>{destruir();if(!e.persisted)window.removeEventListener('pageshow',volver);},{once:true});
 root.innerHTML='<section class="cq-carga"><div class="cq-cine"></div><div class="cq-carga-panel"><small>LA SEMILLA MADRE</small><h1>Despertando los jardines</h1><progress max="18" value="0"></progress></div></section>';pelicula();frame=requestAnimationFrame(cuadro);
 try{await atlas.cargar(()=>{const p=$<HTMLProgressElement>('progress');if(p)p.value=atlas.cargadas;},['interfaz','portada']);if(muerto)return;for(const[i,nombre]of['marco','sobre','tablilla','boton-verde','boton-zombi','papel','laurel','boton-crema'].entries())root.style.setProperty('--cq-'+nombre,`url("${atlas.miniatura({hoja:'interfaz',celda:i})}")`);menu();
  // El menú sale con lo justo (botones y portada); lo demás sigue cargando por detrás
  const resto=atlas.cargar();resto.catch(()=>{});completarAtlas=resto;
  if(prueba)(window as any).__historiaPvZ={mundo:()=>mundo,vista:()=>vista,guardado:()=>guardado,atlas:()=>atlas,audio:()=>audio,editor:()=>editor,pantalla:()=>pantalla,zona:()=>zona,ordenar,destruir,
   avanzar:(n:number)=>{if(!Number.isSafeInteger(n)||n<0||n>90000)throw Error('Pasos inválidos');for(let i=0;i<n&&!mundo?.estado.ganador;i++)paso();actualizar();const m=mundo?.defensas.observar(String(zona));if(m&&vista)vista.dibujar(m);guardar();return mundo?.exportar();},
   detenerPiloto:()=>{piloto=null;},activarPilotoCasa:async()=>{const lib=await import('../pvz/motor/bot');const bot=lib.crearPilotoPvZ();piloto=h=>{const m=h.defensas.observar('8');if(h.estado.inicioCasa&&m)bot(m);};},
   activarPiloto:async()=>{const lib=await import('./historia-piloto');piloto=lib.crearPilotoHistoriaPvZ();},
  };
 }catch(e){pararCine();root.innerHTML='<section class="cq-carga"><h1>No se pudo abrir el jardín</h1><p>Vuelve a cargar para reintentar.</p></section>';console.error('Historia PvZ:',e);}
}
