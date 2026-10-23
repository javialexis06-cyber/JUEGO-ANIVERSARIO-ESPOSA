import {esModoAmigo} from '../../salas/perfil';
import './motores.css';

/** Cada motor conserva su bucle, interfaz y guardados. No usa el progreso territorial. */
export function montarMotorOriginal(motor:'pvz1'|'pvz2') {
 const svg=(d:string)=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="${d}"/></svg>`;
 const casa=svg('M3 11 12 3 21 11M6 9v12h5v-7h3v7h4V9'),pausaIcono=svg('M8 5v14M16 5v14'),seguir=svg('M8 4 20 12 8 20Z'),pantalla=svg('M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6');
 const amigo=esModoAmigo(),perfil=amigo?'amigos':'pareja',eventos=new AbortController();
 document.body.dataset.motorOriginal=motor;
 const root=document.createElement('main');root.className='motor-original';document.body.append(root);
 root.innerHTML=`<div class="motor-cargando" role="status"><strong>${motor==='pvz1'?'Plants vs. Zombies 1':'Plants vs. Zombies 2 · Gardendless'}</strong><span>Preparando el jardín…</span></div><iframe title="${motor==='pvz1'?'PvZ 1 · PvZ-Portable':'PvZ 2 · Gardendless'}" allow="autoplay; fullscreen; gamepad" sandbox="allow-scripts allow-same-origin allow-downloads allow-pointer-lock allow-popups allow-popups-to-escape-sandbox"></iframe><nav class="motor-controles"><button data-motor="volver" aria-label="Volver al jardín">${casa}</button><button data-motor="pausa" aria-label="Pausar" aria-pressed="false">${pausaIcono}</button><button data-motor="pantalla" aria-label="Pantalla completa">${pantalla}</button></nav><div class="motor-error" role="alert" hidden></div>`;
 const frame=root.querySelector('iframe')!,carga=root.querySelector<HTMLElement>('.motor-cargando')!,error=root.querySelector<HTMLElement>('.motor-error')!;
 let pausada=false,cerrando=false,destruido=false;
 const ordenar=(orden:string)=>frame.contentWindow?.postMessage({canal:'semilla-motor-v1',orden},location.origin);
 const volver=()=>{const u=new URL('jardin.html',location.href);u.searchParams.set('modo','conquista');for(const k of ['rol','local','salas']){const v=new URL(location.href).searchParams.get(k);if(v!==null)u.searchParams.set(k,v);}location.href=u.href;};
 function destruir(){if(destruido)return;destruido=true;eventos.abort();frame.remove();root.remove();delete document.body.dataset.motorOriginal;}
 frame.src=new URL(`jardin/motores/${motor}/index.html?perfil=${perfil}`,document.baseURI).href;
 frame.addEventListener('load',()=>{carga.hidden=true;},{signal:eventos.signal});
 window.addEventListener('message',e=>{if(e.source!==frame.contentWindow||e.origin!==location.origin||e.data?.canal!=='semilla-motor-v1'||e.data.motor!==motor)return;
  if(e.data.estado==='cerrado'){destruir();volver();}
  if(e.data.estado==='error'){cerrando=false;error.textContent=String(e.data.mensaje).slice(0,300);error.hidden=false;}
 },{signal:eventos.signal});
 root.addEventListener('click',e=>{const accion=(e.target as HTMLElement).closest<HTMLElement>('[data-motor]')?.dataset.motor;if(accion==='volver'){if(cerrando)return;cerrando=true;ordenar('cerrar');}
  else if(accion==='pausa'){pausada=!pausada;ordenar(pausada?'pausa':'reanudar');const b=root.querySelector<HTMLButtonElement>('[data-motor="pausa"]')!;b.setAttribute('aria-pressed',String(pausada));b.setAttribute('aria-label',pausada?'Reanudar':'Pausar');b.innerHTML=pausada?seguir:pausaIcono;}
  else if(accion==='pantalla')void(document.fullscreenElement?document.exitFullscreen():root.requestFullscreen()).catch(()=>{});
 },{signal:eventos.signal});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&!pausada)root.querySelector<HTMLButtonElement>('[data-motor="pausa"]')?.click();},{signal:eventos.signal});
 window.addEventListener('pagehide',()=>{ordenar('cerrar');destruir();},{once:true});
}
