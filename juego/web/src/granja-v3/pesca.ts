import type {EstadoGranja,Resultado} from './estado';
import type {EstadoPesca,SesionPesca,AccionPesca} from './pesca-tipos';
import {PERFILES_SEDAL} from './pesca-datos';
import {PECES,type PezDef} from './catalogo';
import {puedePescarComunidad,pecesRegion} from './comunidad';
import {efectosHabilidades,nivelHabilidad} from './habilidades';
import {cambiarCantidad,type Calidad} from './inventario';
import {fechaValle,relojValle} from './jornada';
import {tiempoDia,tiempoRegion,biomaZona} from './clima';
export {PERFILES_SEDAL};
export const crearPesca=():EstadoPesca=>({version:1,secuencia:0,actual:null});
export const perfilSedal=(id:string)=>PERFILES_SEDAL.find(p=>p.pez===id)!;
const limitar=(n:number,a=0,b=1)=>Math.max(a,Math.min(b,n));
const bien=(mensaje:string):Resultado=>({ok:true,mensaje}),mal=(mensaje:string):Resultado=>({ok:false,mensaje});
export function pecesEnPesca(s:EstadoGranja,cebo:string):PezDef[]{const hora=relojValle(s.jornada).hora,estacion=fechaValle(s.jornada.diasCompletados).estacion,clima=tiempoRegion(tiempoDia(s.tiempo,s.jornada.diasCompletados),biomaZona(s.zona,s));return pecesRegion(s).filter(p=>p.cebo===cebo&&p.estaciones.includes(estacion)&&(!p.tiempos||p.tiempos.includes(clima))&&(p.desde<p.hasta?hora>=p.desde&&hora<p.hasta:hora>=p.desde||hora<p.hasta));}
export function parametrosSedal(s:EstadoGranja){const nivel=nivelHabilidad(s.habilidades,'pesca'),ef=efectosHabilidades(s.habilidades),herramienta=s.nivelesHerramienta.cana??0;return {nivel,cantidad:1+(ef.pecesExtra??0),calidadBase:Math.max(0,ef.calidadPez??0) as Calidad,bono:Math.min(1,herramienta*.035+nivel*.01+(ef.precision??0)),ancho:Math.min(.36,.24+herramienta*.012+nivel*.004)};}
/** Trayectoria estable del ejemplar reservado; no consume azar por cuadro. */
export function posicionPez(a:SesionPesca,p=perfilSedal(a.pez)){const fase=(a.semilla%10000)/10000*Math.PI*2,t=a.combate,w=t*Math.PI*2/p.periodo+fase;let onda=Math.sin(w);
 if(p.movimiento==='zigzag')onda=2/Math.PI*Math.asin(Math.sin(w));
 if(p.movimiento==='rafaga')onda=Math.sin(w)*Math.abs(Math.sin(w));
 if(p.movimiento==='ondulante')onda=.75*Math.sin(w)+.25*Math.sin(w*.53+1.2);
 if(p.movimiento==='erratico')onda=.62*Math.sin(w)+.38*Math.sin(w*2.17+.7);
 return limitar(p.centro+p.amplitud*onda,.08,.92);
}
/** Segundos de juego visible, en pasos de 20 ms. Una pestaña ausente no ejecuta esta función. */
export function avanzarPesca(s:EstadoGranja,dt:number,sujetar:boolean){const a=s.pesca?.actual;if(!a||!Number.isFinite(dt)||dt<=0||dt>5||['lista','escapo'].includes(a.fase))return;
 let restante=Math.min(dt,.25);const p=perfilSedal(a.pez),ancho=parametrosSedal(s).ancho;
 while(restante>1e-8&&!['lista','escapo'].includes(a.fase)){const paso=Math.min(.02,restante);restante-=paso;a.segundos+=paso;
  if(a.fase==='espera'){if(a.segundos>=a.espera){a.fase='picada';a.segundos=0;}continue;}
  if(a.fase==='picada'){if(a.segundos>=p.ventana){a.fase='escapo';a.segundos=p.ventana;}continue;}
  const usado=Math.min(paso,30-a.combate);a.combate+=usado;a.jugador=limitar(a.jugador+paso*(sujetar?.58:-.38),ancho/2,1-ancho/2);
  const dentro=Math.abs(a.jugador-posicionPez(a,p))<=ancho/2;
  if(dentro)a.acierto+=usado;
  a.tension=limitar(a.tension+paso*(sujetar?(dentro?.025:.18):-.22));
  a.progreso=limitar(a.progreso+paso*(dentro&&a.tension<.9?p.ganancia:-.085));
  if(a.tension>=1||a.progreso<=0||a.combate>=30)a.fase='escapo';else if(a.progreso>=1)a.fase='lista';
 }
}
export function vistaSedal(s:EstadoGranja){const a=s.pesca?.actual;return a?{objetivo:posicionPez(a),jugador:a.jugador,ancho:parametrosSedal(s).ancho,progreso:a.progreso,tension:a.tension,fase:a.fase}:null;}
export function precisionSedal(a:SesionPesca){return a.combate>0?limitar(a.acierto/a.combate):0;}
export function calidadSedal(s:EstadoGranja,a:SesionPesca):Calidad{const p=parametrosSedal(s),precision=Math.min(1,precisionSedal(a)+p.bono);return Math.min(2,Math.max(p.calidadBase,p.nivel>=7&&precision>=.9?1:0)) as Calidad;}
export interface ContextoPesca {azar:()=>number;energia:number;herramientaDisponible:boolean;pagar:(materiales:Record<string,number>)=>void;agregar:(id:string,n:number,calidad?:Calidad)=>void;captura:(pez:PezDef,cantidad:number,azar:()=>number)=>boolean}
export function actuarPesca(s:EstadoGranja,a:AccionPesca,x:number,z:number,c:ContextoPesca):Resultado{
 const v=s.pesca!,actual=v.actual;
 if(actual&&a.tipo!=='cancelar'&&(!Number.isFinite(x)||!Number.isFinite(z)||Math.hypot(x-actual.x,z-actual.z)>.75))return mal('Permanece junto al lugar del lanzamiento o recoge la caña.');
 if(a.tipo==='cancelar'){if(!actual)return mal('No hay un lanzamiento abierto.');v.actual=null;return bien('Recogiste la caña. El cebo usado y la energía del lanzamiento no se devuelven.');}
 if(a.tipo==='enganchar'){if(!actual||actual.fase!=='picada')return mal('Espera la picada y recoge durante su aviso.');actual.fase='tiron';actual.segundos=0;actual.combate=0;actual.jugador=.5;actual.progreso=.35;actual.tension=.12;actual.acierto=0;return bien('Mantén y suelta para seguir al pez. Suelta si el sedal se tensa.');}
 if(a.tipo==='cobrar'){if(!actual||actual.fase!=='lista')return mal('Acompaña al pez hasta la orilla antes de recoger.');const pez=PECES.find(p=>p.id===actual.pez)!,n=parametrosSedal(s).cantidad,calidad=calidadSedal(s,actual);c.agregar(pez.id,n,calidad);let semilla=(actual.semilla^0xa5314577)>>>0;const hallazgo=c.captura(pez,n,()=>{semilla=(Math.imul(semilla,1664525)+1013904223)>>>0;return semilla/0x100000000;});v.actual=null;return bien('Captura recogida: '+n+' × '+pez.nombre.toLowerCase()+'.'+(hallazgo?' Hallazgo pendiente: retíralo en Comunidad.':''));}
 if(a.tipo!=='lanzar'||actual)return mal('Termina o cancela el lanzamiento antes de comenzar otro.');
 if(s.astra?.escena||s.astra?.vida.actual||s.historia?.reto||s.comunidad?.reuniones.actual||s.regional?.reto||s.festivales.actual||s.vidaSocial.actual)return mal('Termina o deja la conversación antes de preparar la caña.');
 if(!puedePescarComunidad(s,x,z)||s.herramienta!=='cana'||!c.herramientaDisponible||s.enemigo>0)return mal('Equipa una caña disponible y acércate a una orilla o puesto seguro.');
 const disponibles=pecesEnPesca(s,a.cebo),parametros=parametrosSedal(s);if(!disponibles.length)return mal('Revisa cebo, hora, temporada y clima del puesto.');
 if(s.energia<c.energia||(s.inventario[a.cebo]??0)<1)return mal('Reserva un cebo y energía para el lanzamiento.');
 const despues=cambiarCantidad(s.casillasInventario,a.cebo,-1);if(!despues||disponibles.some(p=>[...new Set([parametros.calidadBase,Math.max(parametros.calidadBase,parametros.nivel>=7?1:0)])].some(calidad=>!cambiarCantidad(despues,p.id,parametros.cantidad,calidad as Calidad))))return mal('Reserva sitio para cualquier pez disponible antes de lanzar.');
 const pesos=disponibles.map(p=>1/p.rareza**2);let n=c.azar()*pesos.reduce((a,b)=>a+b,0),i=0;while(i<pesos.length-1&&n>=pesos[i])n-=pesos[i++];const pez=disponibles[i],semilla=Math.floor(c.azar()*0x100000000)>>>0;
 c.pagar({[a.cebo]:1});s.energia=Math.max(0,s.energia-c.energia);v.secuencia++;
 v.actual={id:v.secuencia,pez:pez.id,cebo:a.cebo,semilla,zona:s.zona,region:s.astra?.actual??null,dia:s.jornada.diasCompletados,minutos:s.jornada.minutos,x,z,fase:'espera',espera:2+(semilla%2000)/1000,segundos:0,combate:0,jugador:.5,progreso:.35,tension:.12,acierto:0};
 return bien('Caña lanzada. Un cebo y la energía quedaron usados; espera la picada.');
}
const entero=(x:unknown,a=0,b=1e9)=>typeof x==='number'&&Number.isInteger(x)&&x>=a&&x<=b;
const finito=(x:unknown,a:number,b:number)=>typeof x==='number'&&Number.isFinite(x)&&x>=a&&x<=b;
export function pescaValida(s:EstadoGranja){const v=s.pesca;if(!v||v.version!==1||!entero(v.secuencia))return false;if(v.actual===null)return true;const a=v.actual,p=a&&PECES.find(p=>p.id===a.pez),perfil=p&&perfilSedal(p.id);
 if(!a||!p||!perfil||a.id!==v.secuencia||a.id<1||!entero(a.semilla,0,0xffffffff)||a.espera!==2+(a.semilla%2000)/1000||a.cebo!==p.cebo||a.zona!==s.zona||a.region!==(s.astra?.actual??null)||a.dia!==s.jornada.diasCompletados||a.minutos!==s.jornada.minutos||!finito(a.x,-1000,1000)||!finito(a.z,-1000,1000)||!puedePescarComunidad(s,a.x,a.z)||a.fase!=='lista'&&s.herramienta!=='cana'||s.enemigo>0||!pecesEnPesca(s,a.cebo).some(p=>p.id===a.pez))return false;
 if(s.interior||s.servicio||s.aventura.destinoActual||s.astra?.escena||s.astra?.vida.actual||s.historia?.reto||s.comunidad?.reuniones.actual||s.regional?.reto||s.festivales.actual||s.vidaSocial.actual||s.jornada.resumenPendiente||!['espera','picada','tiron','lista','escapo'].includes(a.fase)||!finito(a.segundos,0,31)||!finito(a.combate,0,30)||!finito(a.jugador,0,1)||!finito(a.progreso,0,1)||!finito(a.tension,0,1)||!finito(a.acierto,0,a.combate+.001))return false;
 if(a.fase==='espera'&&(a.segundos>=a.espera||a.combate!==0)||a.fase==='picada'&&(a.segundos>=perfil.ventana||a.combate!==0)||a.fase==='tiron'&&(a.combate>=30||a.progreso<=0||a.progreso>=1||a.tension>=1)||a.fase==='lista'&&(a.progreso!==1||a.tension>=1||a.combate<=0)||a.fase==='escapo'&&!(a.progreso===0||a.tension===1||a.combate===30||a.segundos===perfil.ventana))return false;
 if(a.combate===0&&(a.jugador!==.5||a.progreso!==.35||a.tension!==.12||a.acierto!==0)||a.fase==='tiron'&&Math.abs(a.segundos-a.combate)>.001)return false;
 return true;
}
