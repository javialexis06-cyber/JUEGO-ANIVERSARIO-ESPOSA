import type {EstadoGranja,Resultado} from './estado';
import type {AccionVidaAstra,EstadoVidaAstra,PasoVida} from './vida-astra-tipos';
import {PERFILES_VIDA,RELACIONES_VIDA,ESCENAS_VIDA} from './vida-astra-datos';
import {destinoReunion} from './reuniones';
import {npcAstra,regionAstra,regionActual,libreRegionAstra,planoAstra,posicionNpcAstra} from './astra';
import {comisionHistoria} from './historia-ubicaciones';
import {fechaValle} from './jornada';
import {tiempoDia,tiempoRegion} from './clima';
import {obtenerObjeto} from './objetos';
import {calidadPila} from './inventario';
export {PERFILES_VIDA,RELACIONES_VIDA,ESCENAS_VIDA};
export const perfilVida=(id:string)=>PERFILES_VIDA.find(p=>p.id===id);
export function crearVidaAstra():EstadoVidaAstra{return {version:1,pasos:{},regalos:{},compras:{},encuentros:{},notas:{},actual:null};}
export function migrarVidaAstra(s:EstadoGranja){if(s.astra&&!Object.hasOwn(s.astra,'vida'))s.astra.vida=crearVidaAstra();}
const mal=(mensaje:string):Resultado=>({ok:false,mensaje}),bien=(mensaje:string):Resultado=>({ok:true,mensaje});
const puntoCasa=(id:string)=>{const n=npcAstra(id)!,r=regionAstra(n.region)!;return {x:-2+r.npc.filter(i=>npcAstra(i)?.hogar===n.hogar).indexOf(id)*3,z:1,interior:n.hogar};};
export function estadoRelacion(s:EstadoGranja,id:string){const r=RELACIONES_VIDA.find(r=>r.id===id);if(!r)return null;const cierre=s.historia?.completadas[r.revela];const conocidas=s.astra?.conocidos.includes(r.a)&&s.astra?.conocidos.includes(r.b);return {...r,visible:!!conocidas&&(!r.secreto||!!cierre&&cierre.opcion===0),activa:!!cierre,privada:!!r.secreto&&!!cierre&&cierre.opcion===1,opcion:cierre?.opcion??null};}
/** La agenda sigue el calendario agrícola; ninguna hora real mueve a alguien fuera de la escena. */
export function destinoVida(s:EstadoGranja,id:string):PasoVida['destino']&{actividad:string}{
 const n=npcAstra(id)!,p=perfilVida(id)!,r=regionAstra(n.region)!,dia=s.jornada.diasCompletados,min=s.jornada.minutos,fecha=fechaValle(dia),t=tiempoRegion(tiempoDia(s.tiempo,dia),n.region.includes('nieve')?'polar':n.region.includes('brasa')||n.region==='confluencia_fuego'?'volcanico':'templado');
 const abre=p.nocturno?780:p.abre,cierra=p.nocturno?1200:p.cierra;
 const descanso=dia%7===p.descanso,malTiempo=t==='tormenta'||t==='ceniza'&&p.oficio==='semillas';
 if(min<abre||min>=(p.menor?1140:1260)||descanso&&(min<600||min>=1080)||malTiempo)return {...puntoCasa(id),actividad:malTiempo?'Resguardándose del clima':'En casa'};
 if(p.menor&&min>=p.merienda&&min<p.merienda+60)return {...puntoCasa(id),actividad:'Merienda y descanso'};
 const reunionComunitaria=!descanso&&destinoReunion(s,id);if(reunionComunitaria)return reunionComunitaria;
 if(min>=750&&min<810&&!p.menor)return {...n.plaza,interior:null,actividad:'Pausa del oficio'};
 const reunion=RELACIONES_VIDA.some(a=>!a.secreto&&(a.a===id||a.b===id)&&s.historia?.completadas[a.revela]&&npcAstra(a.a)?.region===npcAstra(a.b)?.region);
 if(reunion&&dia%7===5&&min>=960&&min<1020)return {...n.plaza,interior:null,actividad:'Revisión de acuerdos en la plaza'};
 if(descanso||min>=cierra)return {...n.plaza,interior:null,actividad:descanso?'Día de descanso':'Paseo y conversación'};
 return {...n.oficio,interior:null,actividad:p.estacional?'Trabajo de '+fecha.estacion:'En su oficio'};
}
export function posicionVida(s:EstadoGranja,id:string){const n=npcAstra(id),v=s.astra?.vida?.pasos[id];return n&&v&&v.region===regionActual(s)&&v.dia===s.jornada.diasCompletados?{x:v.x,z:v.z,interior:v.interior}:null;}
type Punto={x:number;z:number};
const segmento=(region:string,a:Punto,b:Punto)=>{const d=Math.hypot(a.x-b.x,a.z-b.z),n=Math.max(1,Math.ceil(d/.16));for(let i=0;i<=n;i++)if(!libreRegionAstra(region,a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n))return false;return true;};
export function sitioVida(region:string,p:Punto):Punto{if(libreRegionAstra(region,p.x,p.z))return {...p};for(let d=.5;d<8;d+=.5)for(let a=0;a<16;a++){const q={x:p.x+Math.cos(a*Math.PI/8)*d,z:p.z+Math.sin(a*Math.PI/8)*d};if(libreRegionAstra(region,q.x,q.z))return q;}return {...(planoAstra(region)?.inicio??{x:0,z:8})};}
/** Malla de un metro, sin diagonales que atraviesen esquinas. Se descarta tras cada cambio de meta. */
export function rutaVida(region:string,desde:Punto,hasta:Punto):Punto[]{
 if(segmento(region,desde,hasta))return [{...hasta}];
 const lim=planoAstra(region)?.limites??{x:24,z:28},x0=-Math.floor(lim.x)+1,z0=-Math.floor(lim.z)+1,nx=Math.floor(lim.x)*2-1,nz=Math.floor(lim.z)*2-1;
 const p=(i:number)=>({x:x0+i%nx,z:z0+Math.floor(i/nx)}),nodo=(q:Punto)=>{let out:number|undefined,best=Infinity;for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const x=Math.round(q.x)+dx,z=Math.round(q.z)+dz;if(x<x0||x>=x0+nx||z<z0||z>=z0+nz)continue;const i=(z-z0)*nx+x-x0,pp=p(i),d=Math.hypot(pp.x-q.x,pp.z-q.z);if(d<best&&segmento(region,q,pp)){out=i;best=d;}}return out;};
 const a=nodo(desde),b=nodo(hasta);if(a===undefined||b===undefined)return [];
 const padres=new Int32Array(nx*nz).fill(-2),cola=[a];padres[a]=-1;let cabeza=0;
 while(cabeza<cola.length&&padres[b]===-2){const i=cola[cabeza++],x=i%nx,z=Math.floor(i/nx);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,zz=z+dz,j=zz*nx+xx;if(xx<0||xx>=nx||zz<0||zz>=nz||padres[j]!==-2||!segmento(region,p(i),p(j)))continue;padres[j]=i;cola.push(j);}}
 if(padres[b]===-2)return [];const out:Punto[]=[];for(let i=b;i!==a;i=padres[i])out.push(p(i));out.reverse();out.push({...hasta});return out;
}
export function avanzarVidaAstra(s:EstadoGranja,dt:number){
 const t=s.astra,v=t?.vida,region=regionActual(s);if(!v||!t?.actual||t.escena||v.actual||s.comunidad?.reuniones.actual||s.aventura.destinoActual||s.jornada.resumenPendiente||!Number.isFinite(dt)||dt<=0)return;
 for(const id of Object.keys(v.pasos))if(v.pasos[id].region!==region)delete v.pasos[id];
 for(const n of regionAstra(region)?.npc??[]){const perfil=perfilVida(n);if(!perfil||perfil.original||comisionHistoria(s,n))continue;const d=destinoVida(s,n),h=regionAstra(region)?.viviendas.find(h=>h.id===npcAstra(n)!.hogar),p=d.interior?sitioVida(region,h?.entrada??{x:0,z:8}):sitioVida(region,d);
  let estado=v.pasos[n];if(!estado||estado.dia!==s.jornada.diasCompletados){estado={region,dia:s.jornada.diasCompletados,x:d.interior?d.x:p.x,z:d.interior?d.z:p.z,interior:d.interior,destino:{...p,interior:d.interior},ruta:[],actividad:d.actividad,andando:false};v.pasos[n]=estado;continue;}
  if(!d.interior&&estado.interior){const salida=sitioVida(region,h?.entrada??p);estado.x=salida.x;estado.z=salida.z;estado.interior=null;estado.ruta=[];}
  const cambio=estado.destino.x!==p.x||estado.destino.z!==p.z||estado.destino.interior!==d.interior;estado.actividad=d.actividad;
  if(cambio){estado.destino={...p,interior:d.interior};if(!estado.interior)estado.ruta=rutaVida(region,{x:estado.x,z:estado.z},p);}
  let presupuesto=Math.min(dt,5)*2.4;estado.andando=false;
  while(!estado.interior&&estado.ruta.length&&presupuesto>0){const q=estado.ruta[0],dist=Math.hypot(q.x-estado.x,q.z-estado.z),paso=Math.min(presupuesto,dist),dx=q.x-estado.x,dz=q.z-estado.z;if(dist<.001){estado.ruta.shift();continue;}const next={x:estado.x+dx/dist*paso,z:estado.z+dz/dist*paso};if(!segmento(region,estado,next)){estado.ruta=[];break;}estado.x=next.x;estado.z=next.z;estado.andando=true;presupuesto-=paso;if(paso>=dist-.001)estado.ruta.shift();}
  if(!estado.interior&&d.interior&&!estado.ruta.length&&Math.hypot(estado.x-p.x,estado.z-p.z)<.3){Object.assign(estado,puntoCasa(n));estado.andando=false;}
 }
}
const cercaNpc=(s:EstadoGranja,id:string,x:number,z:number)=>{const p=posicionNpcAstra(s,id);return !!p&&p.interior===(s.astra?.interior??null)&&Number.isFinite(x)&&Number.isFinite(z)&&Math.hypot(p.x-x,p.z-z)<=3;};
const amistad=(s:EstadoGranja,id:string,puntos:number)=>{const v=s.astra!.charlas[id]??{dia:s.jornada.diasCompletados,puntos:0};v.puntos=Math.max(0,Math.min(2500,v.puntos+puntos));s.astra!.charlas[id]=v;};
export function encuentroDisponible(s:EstadoGranja,id:string,nivel:number){const p=perfilVida(id),key='SOC_'+id+'_'+nivel;return !!p&&!p.original&&Number.isInteger(nivel)&&nivel>=1&&nivel<=3&&s.astra?.conocidos.includes(id)&&s.astra.lecturas.includes('VID_'+id+'_1')&&(s.astra.charlas[id]?.puntos??0)>=[50,250,500][nivel-1]&&!s.astra.vida.encuentros[key]&&(nivel===1||!p.mision||!!s.historia?.completadas[p.mision]);}
export function ofertasVida(s:EstadoGranja,npc:string){const p=perfilVida(npc);return p?.mercancia.map(articulo=>{const precio=obtenerObjeto(articulo)?.precioCompra??0,registro=s.astra?.vida?.compras[npc+':'+articulo],semana=Math.floor(s.jornada.diasCompletados/7);return {articulo,precio,disponible:(npc==='orbita_rita'?2:6)-(registro?.semana===semana?registro.cantidad:0)};}).filter(o=>o.precio>0)??[];}
export function actuarVidaAstra(s:EstadoGranja,a:AccionVidaAstra,x:number,z:number,agregar:(id:string,n:number,calidad?:0|1|2|3)=>void):Resultado{
 const v=s.astra!.vida,dia=s.jornada.diasCompletados,semana=Math.floor(dia/7);
 if(a.tipo==='cancelar'){if(!v.actual)return mal('No hay un encuentro abierto.');v.actual=null;s.astra!.escena=null;return bien('Puedes retomar este encuentro sin cambiar la decisión.');}
 if(a.tipo==='continuar'){if(!v.actual)return mal('No hay un encuentro abierto.');const lineas=ESCENAS_VIDA[v.actual.id];if(v.actual.linea>=lineas.length-1)return mal('Elige cómo acompañar el recuerdo.');v.actual.linea++;s.astra!.escena={id:v.actual.id,linea:v.actual.linea};return bien('Continúa el recuerdo.');}
 if(a.tipo==='elegir'){if(!v.actual||![0,1].includes(a.opcion)||v.actual.linea!==ESCENAS_VIDA[v.actual.id].length-1)return mal('Escucha el recuerdo antes de responder.');const id=v.actual.id,npc=id.slice(4).replace(/_[123]$/,'');v.encuentros[id]={dia,opcion:a.opcion};amistad(s,npc,20);v.actual=null;s.astra!.escena=null;return bien(a.opcion===0?'Quedó guardado tu ofrecimiento de acompañarle.':'Quedó guardada tu decisión de escuchar sin prometer por otra persona.');}
 if(v.actual||s.astra!.escena)return mal('Termina o deja el encuentro abierto.');
 if(a.tipo==='nota'){const r=estadoRelacion(s,a.id);if(!r?.visible||!r.activa||r.privada||![r.a,r.b].includes(a.npc)||!cercaNpc(s,a.npc,x,z))return mal('Visita al participante de un acuerdo autorizado.');const n=v.notas[r.id]?.semana===semana?v.notas[r.id]:{semana,firmas:[]};if(n.firmas.includes(a.npc))return mal('Ya revisaste su nota esta semana.');n.firmas.push(a.npc);v.notas[r.id]=n;if(n.firmas.length===2){for(const id of n.firmas){if(!perfilVida(id)?.original)amistad(s,id,10);}return bien('Las dos revisiones quedaron registradas. Acompañar no obliga a perdonar ni cambia sus vínculos.');}return bien('Nota revisada. Falta escuchar al otro participante en su localidad.');}
 const p=perfilVida(a.npc);if(!p||p.original||!s.astra!.conocidos.includes(a.npc)||!cercaNpc(s,a.npc,x,z))return mal('Conoce y acércate al residente según su agenda.');
 if(a.tipo==='encuentro'){if(!encuentroDisponible(s,a.npc,a.nivel))return mal('Este encuentro necesita amistad, su primer recuerdo y, después, su historia personal.');const id='SOC_'+a.npc+'_'+a.nivel;v.actual={id,linea:0};s.astra!.escena={id,linea:0};return bien('Un momento de amistad.');}
 if(a.tipo==='regalo'){
  if(p.naturaleza!=='persona_viva')return mal('Su memoria se acompaña con diálogo y documentos; no consume obsequios materiales.');
  const registro=v.regalos[p.id]??{semana,dias:[],gustos:{},cumpleanos:null};if(registro.semana!==semana){registro.semana=semana;registro.dias=[];}
  if(registro.dias.includes(dia)||registro.dias.length>=3)return mal('Un regalo por jornada y tres por semana. La amistad también se construye conversando.');
  if(!Number.isInteger(a.casilla)||a.casilla<0||a.casilla>=s.casillasInventario.length)return mal('Elige una casilla válida.');const pila=s.casillasInventario[a.casilla],obj=pila&&obtenerObjeto(pila.articulo);if(!pila||!obj||['herramienta','equipo','maquina','contenedor','estructura'].includes(obj.categoria)||obj.equipo||pila.articulo.startsWith('huevo_'))return mal('Elige una provisión o material, sin equipo ni una cría.');
  const gusto=p.encanta.includes(pila.articulo)?'encanta':p.gusta.includes(pila.articulo)?'gusta':p.desagrada.includes(pila.articulo)?'desagrada':'neutral',base={encanta:35,gusta:20,neutral:5,desagrada:-5}[gusto],fecha=fechaValle(dia),cumple=fecha.dia===p.cumpleanos.dia&&fecha.estacion===p.cumpleanos.estacion&&registro.cumpleanos!==fecha.ano;
  const id=pila.articulo,calidad=calidadPila(pila);agregar(id,-1,calidad);registro.dias.push(dia);registro.gustos[id]=gusto;if(cumple)registro.cumpleanos=fecha.ano;v.regalos[p.id]=registro;amistad(s,p.id,base+(cumple?15:0));return bien(npcAstra(p.id)!.nombre+' '+(gusto==='desagrada'?'prefiere otra cosa; su límite quedó anotado.':'agradece el detalle. Preferencia descubierta: '+gusto)+(cumple?' · cumpleaños':'') );
 }
 if(a.tipo==='comprar'){const d=destinoVida(s,p.id),oferta=ofertasVida(s,p.id).find(o=>o.articulo===a.articulo);if(regionActual(s)!==p.region||!oferta||s.astra!.vida.pasos[p.id]?.andando||!(d.actividad==='En su oficio'||d.actividad.startsWith('Trabajo de'))||d.interior||s.jornada.minutos<p.abre||s.jornada.minutos>=p.cierra||!Number.isInteger(a.cantidad)||a.cantidad<1||a.cantidad>oferta.disponible)return mal('Visita su puesto abierto y elige una cantidad disponible.');const coste=oferta.precio*a.cantidad;if(s.monedas<coste)return mal('No tienes suficientes monedas.');agregar(a.articulo,a.cantidad);s.monedas-=coste;const key=p.id+':'+a.articulo,prev=v.compras[key];v.compras[key]={semana,cantidad:(prev?.semana===semana?prev.cantidad:0)+a.cantidad};return bien('Compra registrada. La reserva vuelve con la semana agrícola.');}
 return mal('Acción social desconocida.');
}
const entero=(x:unknown,min:number,max:number)=>typeof x==='number'&&Number.isInteger(x)&&x>=min&&x<=max;
const objeto=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
export function vidaAstraValida(v:EstadoVidaAstra|undefined,dia:number){
 if(!v||v.version!==1||![v.pasos,v.regalos,v.compras,v.encuentros,v.notas].every(objeto))return false;
 const residentes=PERFILES_VIDA.filter(p=>!p.original).length;
 if(Object.keys(v.pasos).length>residentes||Object.keys(v.regalos).length>residentes||Object.keys(v.compras).length>PERFILES_VIDA.filter(p=>!p.original).reduce((n,p)=>n+p.mercancia.length,0)||Object.keys(v.encuentros).length>Object.keys(ESCENAS_VIDA).length||Object.keys(v.notas).length>RELACIONES_VIDA.length)return false;
 for(const [id,p]of Object.entries(v.pasos)){const n=npcAstra(id);if(!n||perfilVida(id)?.original||p.region!==n.region||!entero(p.dia,0,dia)||![p.x,p.z,p.destino?.x,p.destino?.z].every(n=>Number.isFinite(n)&&Math.abs(n)<500)||p.interior!==null&&p.interior!==n.hogar||p.destino.interior!==null&&p.destino.interior!==n.hogar||(p.interior?p.x!==puntoCasa(id).x||p.z!==puntoCasa(id).z:!libreRegionAstra(n.region,p.x,p.z))||typeof p.actividad!=='string'||p.actividad.length>100||typeof p.andando!=='boolean'||!Array.isArray(p.ruta)||p.ruta.length>512||p.ruta.some(q=>!q||!Number.isFinite(q.x)||!Number.isFinite(q.z)||!libreRegionAstra(n.region,q.x,q.z)))return false;}
 for(const [id,r]of Object.entries(v.regalos)){if(!perfilVida(id)||perfilVida(id)!.original||!entero(r.semana,0,Math.floor(dia/7))||!Array.isArray(r.dias)||r.dias.length>3||new Set(r.dias).size!==r.dias.length||r.dias.some(d=>!entero(d,0,dia)||Math.floor(d/7)!==r.semana)||!objeto(r.gustos)||Object.keys(r.gustos).length>1000||Object.entries(r.gustos).some(([id,g])=>!obtenerObjeto(id)||!['encanta','gusta','neutral','desagrada'].includes(g))||r.cumpleanos!==null&&!entero(r.cumpleanos,1,fechaValle(dia).ano))return false;}
 for(const [id,c]of Object.entries(v.compras)){const [npc,art]=id.split(':');if(!perfilVida(npc)?.mercancia.includes(art)||!entero(c.semana,0,Math.floor(dia/7))||!entero(c.cantidad,1,npc==='orbita_rita'?2:6))return false;}
 for(const [id,e]of Object.entries(v.encuentros))if(!ESCENAS_VIDA[id]||perfilVida(id.slice(4).replace(/_[123]$/,''))?.original||!entero(e.dia,0,dia)||![0,1].includes(e.opcion))return false;
 for(const [id,n]of Object.entries(v.notas)){const r=RELACIONES_VIDA.find(r=>r.id===id);if(!r||!entero(n.semana,0,Math.floor(dia/7))||!Array.isArray(n.firmas)||n.firmas.length<1||n.firmas.length>2||new Set(n.firmas).size!==n.firmas.length||n.firmas.some(f=>f!==r.a&&f!==r.b))return false;}
 if(v.actual!==null&&(!v.actual||!ESCENAS_VIDA[v.actual.id]||Object.hasOwn(v.encuentros,v.actual.id)||!entero(v.actual.linea,0,ESCENAS_VIDA[v.actual.id].length-1)))return false;
 return true;
}
