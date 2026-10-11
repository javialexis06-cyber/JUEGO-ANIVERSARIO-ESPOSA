import { capacidadRefugio, camaAnimal, esperaCorral } from './refugios';
import type { Animal, Edificio, EstadoGranja } from './estado';

export type ActividadGanado='caminar'|'pastorear'|'descansar'|'dormir'|'esperar';
/** Posiciones locales: mover o girar el refugio también mueve su manada. */
export interface RutinaAnimal {
 version:1;lugar:'corral'|'refugio';u:number;v:number;objetivoU:number;objetivoV:number;
 actividad:ActividadGanado;espera:number;paso:number;direccion:number;pausa:number;
}
const limite=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const semilla=(id:string,paso:number)=>{let h=2166136261;for(const c of id)h=Math.imul(h^c.charCodeAt(0),16777619);h=Math.imul(h^(paso+1),0x85ebca6b);h=Math.imul(h^(h>>>13),0xc2b2ae35);return ((h^(h>>>16))>>>0)/4294967296;};
export function crearRutina(indice:number,lugar:'corral'|'refugio'='refugio',capacidad=6):RutinaAnimal {
 const {u,v}=lugar==='corral'?esperaCorral(indice,capacidad):camaAnimal(indice,capacidad);
 return {version:1,lugar,u,v,objetivoU:u,objetivoV:v,actividad:'descansar',espera:indice*.7,paso:0,direccion:0,pausa:0};
}
export function rutinaValida(r:unknown):r is RutinaAnimal {
 if(!r||typeof r!=='object')return false;const a=r as RutinaAnimal;
 const rango=(v:number,x:number,y:number)=>Number.isFinite(v)&&v>=x&&v<=y;
 const min=a.lugar==='corral'?4.3:.3,max=a.lugar==='corral'?7.7:3.85;
 return a.version===1&&['corral','refugio'].includes(a.lugar)&&['caminar','pastorear','descansar','dormir','esperar'].includes(a.actividad)&&rango(a.u,.3,3.7)&&rango(a.v,min,max)&&rango(a.objetivoU,.3,3.7)&&rango(a.objetivoV,min,max)&&rango(a.espera,0,60)&&rango(a.pausa,0,3)&&rango(a.direccion,-Math.PI,Math.PI)&&Number.isSafeInteger(a.paso)&&a.paso>=0&&a.paso<=1e9;
}
export const puertaAbierta=(b:Edificio)=>b.puertaGanado!==false;
export function puedePastorear(s:EstadoGranja,b:Edificio,tiempo:string){return s.jornada.minutos>=360&&s.jornada.minutos<1020&&!['lluvia','tormenta','nieve'].includes(tiempo)&&!(Math.floor(s.jornada.diasCompletados/28)%4===3&&b.clima==='templado');}
export function animalVisible(s:Pick<EstadoGranja,'interior'>,a:Animal){return !a.rutina||(s.interior===a.edificioId?a.rutina.lugar==='refugio':!s.interior&&a.rutina.lugar==='corral');}
export const clipRutina=(a:Animal)=>a.rutina?.actividad==='caminar'?'caminar':a.rutina?.actividad==='pastorear'?'comer':'reposo';
export function textoRutina(a:Animal){const r=a.rutina;return !r?'En su refugio':({caminar:'Paseando',pastorear:'Pastoreando',descansar:'Descansando',dormir:'Durmiendo',esperar:'Esperando que abras la puerta'}[r.actividad])+` · ${r.lugar==='corral'?'corral':'refugio'}`;}
export function pausaAnimal(a:Animal,segundos=1.2){if(a.rutina)a.rutina.pausa=limite(segundos,0,3);}
export function reiniciarRutinas(s:EstadoGranja){const grupos=new Map<string,number>();for(const a of s.animales){const i=grupos.get(a.edificioId)??0;grupos.set(a.edificioId,i+1);a.rutina=crearRutina(i,'refugio',capacidadRefugio(s.edificios.find(b=>b.id===a.edificioId)!));}}

/** Solo recibe segundos de juego activo. Nunca se llama desde la reconciliación offline. */
export function avanzarRutinas(s:EstadoGranja,segundos:number,tiempo:(b:Edificio)=>string):boolean {
 if(!Number.isFinite(segundos)||segundos<=0||s.jornada.resumenPendiente||s.zona!=='granja'||s.servicio||s.aventura.destinoActual)return false;
 const dt=Math.min(segundos,.25),grupos=new Map<string,Animal[]>();for(const a of s.animales){const grupo=grupos.get(a.edificioId)??[];grupo.push(a);grupos.set(a.edificioId,grupo);}
 let cambió=false;
 for(const b of s.edificios){const animales=grupos.get(b.id);if(!animales)continue;const exterior=puedePastorear(s,b,tiempo(b)),abierta=puertaAbierta(b),capacidad=capacidadRefugio(b);
  for(const [indice,a] of animales.entries()){
   if(!a.rutina){a.rutina=crearRutina(indice,exterior&&abierta?'corral':'refugio',capacidad);cambió=true;}
   const r=a.rutina,cama=camaAnimal(indice,capacidad),corral=esperaCorral(indice,capacidad);if(r.pausa>0){r.pausa=Math.max(0,r.pausa-dt);continue;}
   const sano=a.cuidado.illnessSince===null,salir=exterior&&abierta&&sano;
   const quiereCambiar=r.lugar==='refugio'?salir:!exterior||!sano;
   if(quiereCambiar){
    r.objetivoU=!abierta&&r.lugar==='corral'?corral.u:2;r.objetivoV=r.lugar==='refugio'?(Math.abs(r.u-2)>.035?r.v:3.8):!abierta?corral.v:4.45;r.espera=0;
    if(Math.hypot(r.u-r.objetivoU,r.v-r.objetivoV)<.035&&(r.lugar==='corral'||Math.abs(r.v-3.8)<.035)){
     if(!abierta){r.actividad='esperar';continue;}
     r.lugar=r.lugar==='refugio'?'corral':'refugio';r.u=2;r.v=r.lugar==='refugio'?3.8:4.45;r.objetivoU=r.u;r.objetivoV=r.v;r.actividad='descansar';r.espera=0;cambió=true;continue;
    }
   }else {
    // Una puerta cerrada no cancela la vuelta de quien ya está afuera.
    if(r.actividad==='esperar'){r.espera=0;r.objetivoU=r.u;r.objetivoV=r.v;}
    const noche=s.jornada.minutos>=1080,quieto=r.lugar==='refugio';
    if(quieto){const camaU=cama.u,camaV=cama.v;if(Math.abs(r.v-camaV)>.035){r.objetivoU=2;r.objetivoV=Math.abs(r.u-2)>.035?r.v:camaV;}else{r.objetivoU=camaU;r.objetivoV=camaV;}}
    else if(r.espera>0){r.espera=Math.max(0,r.espera-dt);r.actividad=r.lugar==='corral'&&b.pasto>0?'pastorear':'descansar';continue;}
    else if(Math.hypot(r.u-r.objetivoU,r.v-r.objetivoV)<.035){
     r.paso=(r.paso+1)%1_000_000_001;r.objetivoU=.7+semilla(a.id,r.paso*2)*2.6;r.objetivoV=(r.lugar==='corral'?4.8:.7)+semilla(a.id,r.paso*2+1)*(r.lugar==='corral'?2.5:2.1);
    }
    if(quieto&&Math.abs(r.u-cama.u)<.035&&Math.abs(r.v-cama.v)<.035){r.actividad=noche?'dormir':'descansar';continue;}
   }
   const du=r.objetivoU-r.u,dv=r.objetivoV-r.v,dist=Math.hypot(du,dv),velocidad=['gallina','pato','conejo'].includes(a.especie)?.55:.38,paso=Math.min(dist,velocidad*dt);
   if(dist>.001){r.u+=du/dist*paso;r.v+=dv/dist*paso;r.direccion=Math.atan2(du,dv);r.actividad='caminar';}
   if(dist<=paso+.001){r.u=r.objetivoU;r.v=r.objetivoV;r.espera=2+semilla(a.id,r.paso+17)*5;r.actividad=r.lugar==='corral'&&b.pasto>0?'pastorear':'descansar';}
  }
 }
 return cambió;
}
