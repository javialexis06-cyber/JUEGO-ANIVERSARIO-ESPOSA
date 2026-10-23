import {FrenteGardendless} from './frente-gardendless';
import {esModoAmigo} from '../../salas/perfil';
import './motores.css';

/** Entrada de revisión explícita. No conecta resultados ni recursos a una partida territorial. */
export function montarPruebaFrente(){
 const svg=(d:string)=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="${d}"/></svg>`;
 const pausa=svg('M8 5v14M16 5v14'),seguir=svg('M8 4 20 12 8 20Z');
 const root=document.createElement('main');root.className='motor-original';document.body.dataset.motorOriginal='pvz2';
 root.innerHTML=`<div class="motor-cargando" role="status"><strong>Prueba del motor · Gardendless</strong><span>Tutorial original, sin guardado territorial.</span><button data-frente="jugar" disabled>Preparando el jardín…</button></div><nav class="motor-controles"><button data-frente="volver" aria-label="Volver al jardín">${svg('M3 11 12 3 21 11M6 9v12h5v-7h3v7h4V9')}</button><button data-frente="pausa" aria-label="Pausar" aria-pressed="false" disabled>${pausa}</button><button data-frente="pantalla" aria-label="Pantalla completa">${svg('M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6')}</button></nav><div class="motor-error" role="alert" hidden></div>`;
 document.body.append(root);
 const frente=new FrenteGardendless(root,'casa',esModoAmigo()?'amigos':'pareja'),eventos=new AbortController();
 const jugar=root.querySelector<HTMLButtonElement>('[data-frente="jugar"]')!,botonPausa=root.querySelector<HTMLButtonElement>('[data-frente="pausa"]')!,carga=root.querySelector<HTMLElement>('.motor-cargando')!,error=root.querySelector<HTMLElement>('.motor-error')!;
 let cerrando=false;
 const mostrarError=(e:unknown)=>{if(cerrando)return;error.textContent=e instanceof Error?e.message:String(e);error.hidden=false;};
 const volver=()=>{const u=new URL('jardin.html',location.href);u.searchParams.set('modo','conquista');for(const k of['rol','local','salas']){const v=new URL(location.href).searchParams.get(k);if(v!==null)u.searchParams.set(k,v);}location.href=u.href;};
 const reflejarPausa=(si:boolean)=>{botonPausa.setAttribute('aria-pressed',String(si));botonPausa.setAttribute('aria-label',si?'Reanudar':'Pausar');botonPausa.innerHTML=si?seguir:pausa;};
 void frente.listo.then(()=>{jugar.disabled=false;jugar.textContent='Jugar la prueba';}).catch(mostrarError);
 root.addEventListener('click',async e=>{
  const b=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-frente]');if(!b||b.disabled)return;
  try{
   if(b.dataset.frente==='jugar'){b.disabled=true;b.textContent='Preparando la defensa…';await frente.iniciar();carga.hidden=true;botonPausa.disabled=false;}
   else if(b.dataset.frente==='volver'){
    if(cerrando)return;cerrando=true;await frente.cerrar();eventos.abort();
    volver();
   }
   else if(b.dataset.frente==='pausa'){b.disabled=true;try{const estado=await(b.getAttribute('aria-pressed')==='true'?frente.reanudar():frente.pausa());reflejarPausa(estado.pausada);}finally{b.disabled=false;}}
   else if(b.dataset.frente==='pantalla')await(document.fullscreenElement?document.exitFullscreen():root.requestFullscreen());
  }catch(e){if(cerrando){frente.destruir();volver();}else mostrarError(e);}
 },{signal:eventos.signal});
 window.addEventListener('message',e=>{if(e.source!==frente.frame.contentWindow||e.origin!==location.origin||e.data?.canal!=='semilla-motor-v1'||e.data.motor!=='pvz2')return;
  if(e.data.estado==='error')mostrarError(e.data.mensaje);
  if(e.data.estado==='cerrado'&&!cerrando){cerrando=true;frente.destruir();eventos.abort();volver();}
 },{signal:eventos.signal});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&!botonPausa.disabled&&botonPausa.getAttribute('aria-pressed')==='false')botonPausa.click();},{signal:eventos.signal});
 window.addEventListener('pagehide',()=>{cerrando=true;eventos.abort();frente.destruir();},{once:true});
}
