import './jardin.css';
import './duelo.css';
import { crearSala,unirseSala,normalizarCodigo } from '../salas/sala';
import { esperarEnSala } from '../salas/espera';
import * as fondo from '../segundo_plano';
import type { Sala } from '../salas/tipos';
import { PLANTAS,ZOMBIS,type IdPlanta,type IdZombi } from './datos';
import { MotorDuelo,PATIO_DUELO,RECLUTAS,DURACION_DUELO,PREPARACION_DUELO,opuesto,type Bando,type OrdenDuelo } from './duelo-motor';
import { RedDuelo,configSegura,type ConfigDuelo } from './duelo-red';
import { VistaJardin } from './vista';

const params=new URLSearchParams(location.search),root=document.createElement('main');document.body.append(root);
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const ICONOS:Record<IdPlanta,string>={margarita:'🌼',frijol:'🫛',calabaza:'🎃',menta:'🌿',hongo:'🍄',chile:'🌶',gemela:'🌱',campanilla:'🌸'};
const ICONOS_Z:Record<IdZombi,string>={remiendo:'🧟',olla:'🍲',corredor:'👟',paraguas:'☂',grandote:'🧸'};
let sala:Sala|null=null,red:RedDuelo|null=null,local:MotorDuelo|null=null,vista:VistaJardin|null=null;
let bandoCrear:Bando='plantas',planta:IdPlanta|'pala'='frijol',zombi:IdZombi='remiendo',pausaLocal=false,cargando=false;
let acumulado=0,hudT=0,firmaCapa='',firmaBancos='',sesionLocal=0,generacion=0;
function volver(){const u=new URL('./jardin.html',location.href);for(const k of ['rol','local','salas'])if(params.has(k))u.searchParams.set(k,params.get(k)!);location.href=u.href;}
function soltar(){generacion++;red?.soltar();red=null;sala?.salir();sala=null;local=null;vista?.destruir();vista=null;document.body.classList.remove('duelo-local');}
function menu(error=''){
 soltar();cargando=false;
 root.innerHTML=`<header><button data-d="volver">‹ Jardín</button><div><h1>Plantas contra zombis</h1><small>Jardín de los Desvelados · para dos</small></div></header>
 <section class="duelo-menu"><article><span class="duelo-icono">🌻 ⚔ 🧟</span><h2>Un jardín, dos bandos</h2><p>Una persona siembra y defiende la casa. La otra recluta zombis y escoge por dónde atacar.</p>
 <div class="reglas-duelo"><p><b>🌻 Plantas:</b> recoge luz, siembra y protege cinco carriles durante tres minutos.</p><p><b>🧟 Zombis:</b> usa la niebla para enviar visitas; cruza un carril después de gastar su farol.</p><p>Las plantas tienen ${PREPARACION_DUELO} segundos de preparación. Cada bando maneja sus propios recursos.</p></div>
 <button data-d="local">Dos en este dispositivo</button></article>
 <article><h2>Cada uno en su dispositivo</h2><p>Crea una sala y comparte su código con la otra persona.</p>
 <div class="elegir-bando"><button data-d="plantas" aria-pressed="true">🌻 Quiero defender</button><button data-d="zombis" aria-pressed="false">🧟 Quiero atacar</button></div>
 <button data-d="crear">Crear sala</button><form id="unirse-duelo"><label>Código de la sala<input name="codigo" aria-label="Código de la sala" maxlength="8" autocomplete="off" autocapitalize="characters" required></label><button>Unirme</button></form>
 <p role="alert" id="error-duelo">${esc(error)}</p></article></section>`;
 bandoCrear='plantas';
}
async function entrar(crear:boolean,codigo=''){
 if(cargando)return;cargando=true;
 const n=++generacion;root.innerHTML='<section class="cargando"><h2>Abriendo el jardín…</h2><p>Preparando la sala para dos.</p></section>';
 let s:Sala|null=null;
 try{
  s=crear?await crearSala({juego:'jardin',max:2}):await unirseSala(normalizarCodigo(codigo),'jardin');
  if(n!==generacion){s.salir();return;}sala=s;cargando=false;s.ponerDatos({bando:bandoCrear});
  const espera=esperarEnSala({sala:s,titulo:'Plantas contra zombis',subtitulo:'Una persona defiende; la otra ataca. Tres minutos por ronda.',contenedor:root,
   detalle:j=>{const h=s!.jugadores.find(x=>x.puesto===0);const b=h?.datos?.bando==='zombis'?'zombis':'plantas';return (j.puesto===0?b:opuesto(b))==='plantas'?'🌻 Defiende con plantas':'🧟 Ataca con zombis';},
   extras:s.soyAnfitrion?[{id:'bandos',texto:'Intercambiar bandos',alTocar:()=>s!.ponerDatos({bando:s!.yo.datos?.bando==='zombis'?'plantas':'zombis'})}]:[],
   alEmpezar:()=>{const otro=s!.jugadores.find(j=>j.id!==s!.yo.id)!;const plantas=s!.yo.datos?.bando!=='zombis';return{sesion:crypto.randomUUID(),semilla:23,plantas:plantas?s!.yo.id:otro.id,zombis:plantas?otro.id:s!.yo.id} satisfies ConfigDuelo;},
  });
  const r=await espera.resultado;if(n!==generacion)return;
  if(r.que==='salir')return menu(r.motivo??'');
  if(!configSegura(r.datos,s))return menu('La sala no pudo acordar los bandos. Crea una nueva.');
  red=new RedDuelo(s,r.datos);await preparar();
 }catch(e){if(n===generacion){s?.salir();menu((e as Error).message);}}
}
async function preparar(){
 const n=++generacion;cargando=true;firmaCapa='sin-pintar';firmaBancos='';planta='frijol';zombi='remiendo';acumulado=0;pausaLocal=false;
 root.innerHTML=`<header><button data-d="pausa">Pausa</button><div><h1>Plantas contra zombis</h1><small id="duelo-bando"></small></div><b id="duelo-reloj">3:00</b><button data-d="abandonar">Salir</button></header><div id="bancos-duelo"></div><div id="campo-jardin"></div><div id="luces-jardin"></div><footer><span id="descripcion-jardin"></span><span id="aviso-jardin" role="status"></span></footer><div id="capa-jardin"><section class="resultado"><h2>Preparando las figuras…</h2></section></div>`;
 try{
  vista?.destruir();const v=new VistaJardin(document.getElementById('campo-jardin')!);vista=v;await v.cargar();
  if(n!==generacion){v.destruir();return;}v.montar({nivel:PATIO_DUELO});
  v.renderer.domElement.onpointerup=e=>{if(cargando||pausada())return;const q=v.tocar(e.clientX,e.clientY);if(!q)return;
   if(!local&&red?.bando==='zombis')ordenar('zombis',{tipo:'enviar',zombi,fila:q.fila});
   else ordenar('plantas',planta==='pala'?{tipo:'quitar',...q}:{tipo:'plantar',planta,...q});
  };
  cargando=false;red?.listo();actualizar();
 }catch{if(n===generacion)menu('No se pudieron cargar las figuras. Revisa la conexión y vuelve a intentarlo.');}
}
function pausada(){return cargando||(local?pausaLocal:red?.pausada??true);}
function estado(){return local?.estado()??red?.estado()??null;}
function ordenar(b:Bando,a:OrdenDuelo){
 if(pausada())return;
 if(local){if(!local.ordenar(b,a))aviso('Revisa los recursos, la preparación, la recarga y el carril.');}
 else if(red?.bando===b)red.ordenar(a);
 actualizar();
}
function aviso(t:string){const a=document.getElementById('aviso-jardin');if(a){a.textContent=t;setTimeout(()=>{if(a.textContent===t)a.textContent='';},3000);}}
function bancos(){
 const b=red?.bando??'ambos';const firma=local?'local':b;if(firma===firmaBancos)return;firmaBancos=firma;
 document.body.classList.toggle('duelo-local',!!local);
 const p=`<aside class="semillero banco-plantas" aria-label="Plantas"><b class="recurso-duelo" id="duelo-luz"></b>${Object.entries(PLANTAS).map(([id,p])=>`<button data-pd="${id}" title="${p.desc}"><span>${ICONOS[id as IdPlanta]}</span><b>${p.nombre}</b><small>${p.costo} ☀ <i data-rp="${id}"></i></small></button>`).join('')}<button data-pala>🪏<b>Pala</b></button></aside>`;
 const z=`<aside class="semillero banco-zombis" aria-label="Zombis"><b class="recurso-duelo" id="duelo-niebla"></b>${Object.entries(ZOMBIS).map(([id,z])=>`<button data-zd="${id}"><span>${ICONOS_Z[id as IdZombi]}</span><b>${z.nombre}</b><small>${RECLUTAS[id as IdZombi].costo} ☁ <i data-rz="${id}"></i></small></button>`).join('')}<div class="filas-envio"><b>Enviar al carril</b>${Array.from({length:5},(_,i)=>`<button data-fila="${i}" aria-label="Enviar zombi al carril ${i+1}">${i+1}</button>`).join('')}</div></aside>`;
 document.getElementById('bancos-duelo')!.innerHTML=local?p+z:b==='plantas'?p:z;
 document.getElementById('duelo-bando')!.textContent=local?'Dos en la misma pantalla · plantas a la izquierda, zombis a la derecha':`${b==='plantas'?'🌻 Tú defiendes con plantas':'🧟 Tú atacas con zombis'} · sala ${sala?.codigo}`;
 document.getElementById('descripcion-jardin')!.textContent=local?'Plantas: toca el campo para sembrar. Zombis: escoge unidad y carril.':b==='plantas'?'Recoge las luces. Escoge una planta y toca una casilla.':'Escoge un zombi y toca su carril de entrada.';
}
function actualizar(){
 if(!vista||cargando)return;const m=estado();if(!m)return;bancos();
 const t=Math.max(0,Math.ceil(DURACION_DUELO-m.t));document.getElementById('duelo-reloj')!.textContent=`${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`;
 const luz=document.getElementById('duelo-luz');if(luz)luz.textContent=`☀ ${m.luces}`;
 const niebla=document.getElementById('duelo-niebla');if(niebla)niebla.textContent=`☁ ${m.niebla}`;
 for(const b of root.querySelectorAll<HTMLButtonElement>('[data-pd]')){const id=b.dataset.pd as IdPlanta,r=m.recargas[id]??0;b.classList.toggle('seleccionada',planta===id);b.classList.toggle('sin-luz',m.luces<PLANTAS[id].costo||r>0);b.querySelector('[data-rp]')!.textContent=r>.1?`${Math.ceil(r)}s`:'';}
 root.querySelector('[data-pala]')?.classList.toggle('seleccionada',planta==='pala');
 for(const b of root.querySelectorAll<HTMLButtonElement>('[data-zd]')){const id=b.dataset.zd as IdZombi,r=m.reclutas[id]??0;b.classList.toggle('seleccionada',zombi===id);b.classList.toggle('sin-luz',m.niebla<RECLUTAS[id].costo||r>0);b.querySelector('[data-rz]')!.textContent=r>.1?`${Math.ceil(r)}s`:'';}
 for(const b of root.querySelectorAll<HTMLButtonElement>('[data-fila]'))b.disabled=m.t<PREPARACION_DUELO||pausada()||!!m.terminado;
 const luces=document.getElementById('luces-jardin')!;
 const ids=(local||red?.bando==='plantas')?m.soles.map(s=>s.id).join(','):'';
 if(luces.dataset.ids!==ids){luces.dataset.ids=ids;luces.innerHTML=ids?m.soles.map(s=>`<button data-ld="${s.id}" aria-label="Recoger 25 luces">☀<small>25</small></button>`).join(''):'';}
 for(const s of m.soles){const b=root.querySelector<HTMLElement>(`[data-ld="${s.id}"]`);if(b){const p=vista.punto(s.x,s.fila,.85);b.style.left=p.x+'px';b.style.top=p.y+'px';}}
 const foto=red?.foto;
 let capa='';
 if(red?.aviso)capa=`<h2>La sala se cerró</h2><p>${esc(red.aviso)}</p><button data-d="menu">Volver al menú</button>`;
 else if(red?.corte||foto?.corte)capa='<h2>Esperando la conexión</h2><p>La partida está detenida para ambos. No se concede una victoria por este corte.</p><button data-d="abandonar">Salir</button>';
 else if(red&&(!foto||foto.listos.length<2))capa='<h2>Preparando al otro jugador…</h2><p>El tiempo empieza cuando las figuras estén listas en ambos dispositivos.</p>';
 else if(m.terminado){const ganador=m.terminado==='gano'?'plantas':'zombis',mio=local?'':ganador===red?.bando?'¡Ganaste! ':'Esta vez ganó el otro bando. ';
  capa=`<h2>${mio}${ganador==='plantas'?'🌻 Ganaron las plantas':'🧟 Ganaron los zombis'}</h2><p>${ganador==='plantas'?'La casa resistió los tres minutos.':'Los zombis cruzaron un carril sin farol.'}</p><button data-d="revancha" ${foto?.revancha.includes(sala?.yo.id??'')?'disabled':''}>${local?'Otra partida':'Revancha intercambiando bandos'}</button><button data-d="abandonar">Salir</button>${foto?.revancha.length?'<p>Esperando que la otra persona acepte la revancha.</p>':''}`;
 }else if(pausada())capa=`<h2>Un respiro para ambos</h2><p>${!local&&!red?.miPausa?'La otra persona puso pausa. Espera a que vuelva.':'El reloj y los dos bandos están detenidos.'}</p>${local||red?.miPausa?'<button data-d="pausa">Seguir jugando</button>':''}<button data-d="abandonar">Salir</button>`;
 const firma=capa;if(firma!==firmaCapa){firmaCapa=firma;document.getElementById('capa-jardin')!.innerHTML=capa?`<section class="resultado">${capa}</section>`:'';}
 if(!capa&&m.t<PREPARACION_DUELO)document.getElementById('duelo-bando')!.textContent=(local?'Dos en este dispositivo':red?.bando==='plantas'?'🌻 Tú defiendes':'🧟 Tú atacas')+` · preparación ${Math.ceil(PREPARACION_DUELO-m.t)} s`;
 else if(!capa)document.getElementById('duelo-bando')!.textContent=local?'Plantas a la izquierda · zombis a la derecha':`${red?.bando==='plantas'?'🌻 Tú defiendes':'🧟 Tú atacas'} · sala ${sala?.codigo}`;
}
root.addEventListener('submit',e=>{if((e.target as Element).id==='unirse-duelo'){e.preventDefault();const f=e.target as HTMLFormElement;void entrar(false,String(new FormData(f).get('codigo')??''));}});
root.addEventListener('click',e=>{
 const b=(e.target as Element).closest<HTMLButtonElement>('button');if(!b)return;
 if(b.dataset.pd){planta=b.dataset.pd as IdPlanta;aviso(PLANTAS[planta].desc);}else if(b.hasAttribute('data-pala'))planta='pala';
 else if(b.dataset.zd)zombi=b.dataset.zd as IdZombi;
 else if(b.dataset.fila!==undefined)ordenar('zombis',{tipo:'enviar',zombi,fila:Number(b.dataset.fila)});
 else if(b.dataset.ld)ordenar('plantas',{tipo:'recoger',id:Number(b.dataset.ld)});
 else switch(b.dataset.d){
  case 'volver':volver();break;
  case 'plantas':case 'zombis':bandoCrear=b.dataset.d;for(const p of root.querySelectorAll('[data-d="plantas"],[data-d="zombis"]'))p.setAttribute('aria-pressed',String((p as HTMLElement).dataset.d===bandoCrear));break;
  case 'crear':void entrar(true);break;
  case 'local':local=new MotorDuelo(++sesionLocal);void preparar();break;
  case 'pausa':if(local)pausaLocal=!pausaLocal;else red?.pausar(!red.miPausa);break;
  case 'revancha':if(local){local=new MotorDuelo(++sesionLocal);pausaLocal=false;vista?.montar({nivel:PATIO_DUELO});firmaCapa='sin-pintar';}else red?.revancha();break;
  case 'menu':case 'abandonar':menu();break;
 }
 actualizar();
});
fondo.alPausar(()=>{if(local)pausaLocal=true;else red?.pausar(true);actualizar();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&vista){if(local)pausaLocal=!pausaLocal;else red?.pausar(!red.miPausa);actualizar();}});
window.addEventListener('pagehide',()=>{red?.soltar();sala?.salir();vista?.destruir();});
function cuadro(dt:number,t:number){
 if(vista&&!cargando){if(!pausada()){acumulado+=dt;while(acumulado>=1/30){if(local)local.paso();else red?.paso();acumulado-=1/30;}}
  red?.publicar();const m=estado();if(m)vista.dibujar({...m,nivel:PATIO_DUELO});if(t-hudT>100){actualizar();hudT=t;}}
}fondo.cuadros(cuadro);
(window as any).__duelo={estado,red:()=>red,motor:()=>local??red?.motor,vista:()=>vista,sala:()=>sala,listo:()=>!!vista&&!cargando,
 avanzar:(n:number)=>{if(pausada())return;for(let i=0;i<Math.min(n,30*200);i++){if(local)local.paso();else red?.paso();}red?.publicar(true);actualizar();}};
menu();if(params.has('sala'))void entrar(true);else if(params.get('unirse'))void entrar(false,params.get('unirse')!);
