import type { CropCare } from './cuidados';
import { crearCultivo, reconciliarCultivo, avanzarCultivoDia, regarCultivo } from './cuidados';
import { CRECIMIENTO_NOCHE_MS, fechaValle } from './jornada';
import { frutalDef } from './frutales-datos';
export interface Frutal {id:string;tipo:string;x:number;z:number;edificioId?:string;cuidado:CropCare;riegoDia:number|null;frutos:number;ultimaProduccionDia:number|null;fructificaciones:number;semilla:number;golpes:number}
export function crearFrutal(id:string,tipo:string,x:number,z:number,ahora:number,edificioId?:string):Frutal {return {id,tipo,x,z,...(edificioId?{edificioId}:{}),cuidado:crearCultivo(frutalDef(tipo)!.dias*CRECIMIENTO_NOCHE_MS,ahora,false),riegoDia:null,frutos:0,ultimaProduccionDia:null,fructificaciones:0,semilla:(ahora+x*73471+z*93811)>>>0,golpes:0};}
export const regarFrutal=(f:Frutal,dia:number,now:number)=>{f.cuidado=regarCultivo(f.cuidado,now);if(f.cuidado.status==='creciendo')f.riegoDia=dia;};
/** La fruta se añade únicamente al cerrar jornadas; el día de madurez aún no produce. */
export function avanzarFrutal(f:Frutal,dia:number,now:number,despejado:boolean){
 f.cuidado=reconciliarCultivo(f.cuidado,now);const antes=f.cuidado.grownMs;
 if(f.cuidado.status==='creciendo'&&f.riegoDia===dia&&despejado)f.cuidado=avanzarCultivoDia(f.cuidado,CRECIMIENTO_NOCHE_MS,now);
 let producido=0;if(f.cuidado.status==='maduro'&&antes===f.cuidado.growthMs&&f.ultimaProduccionDia!==dia){
  f.ultimaProduccionDia=dia;if((f.edificioId||frutalDef(f.tipo)!.estaciones.includes(fechaValle(dia).estacion))&&f.frutos<3){f.frutos++;f.fructificaciones++;producido=1;}
 }
 return {crecio:f.cuidado.grownMs>antes,maduro:antes<f.cuidado.growthMs&&f.cuidado.status==='maduro',producido};
}
export const faseFrutal=(f:Frutal)=>f.cuidado.status==='maduro'?4:Math.min(3,Math.floor(f.cuidado.grownMs/f.cuidado.growthMs*4));
export const vidaFrutal=(f:Frutal)=>f.cuidado.status==='maduro'?12:4;
export function frutalValido(f:unknown,ahora:number,dia:number):f is Frutal{
 const v=f as Frutal,d=v&&frutalDef(v.tipo),c=v?.cuidado;const n=(v:unknown,min=0,max=1e9)=>typeof v==='number'&&Number.isInteger(v)&&v>=min&&v<=max;const t=(v:unknown,min=0,max=ahora)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
 if(!v||!d||!n(v.x,-1000,1000)||!n(v.z,-1000,1000)||!n(v.frutos,0,3)||!n(v.fructificaciones)||!n(v.semilla,0,0xffffffff)||!n(v.golpes,0,11)||(v.riegoDia!==null&&!n(v.riegoDia,0,dia))||(v.ultimaProduccionDia!==null&&!n(v.ultimaProduccionDia,0,dia))||!c||!['creciendo','maduro','arruinado'].includes(c.status)||c.growthMs!==d.dias*CRECIMIENTO_NOCHE_MS||!t(c.grownMs,0,c.growthMs)||!t(c.plantedAt)||!t(c.lastEvaluatedAt,c.plantedAt)||!(c.lastWateredAt===null||t(c.lastWateredAt,c.plantedAt,c.lastEvaluatedAt))||!(c.maturedAt===null||t(c.maturedAt,c.plantedAt,c.lastEvaluatedAt))||!(c.ruinedAt===null||t(c.ruinedAt,c.plantedAt,c.lastEvaluatedAt)))return false;
 if(v.frutos>v.fructificaciones||c.status!=='maduro'&&(v.frutos||v.fructificaciones||v.ultimaProduccionDia!==null)||v.golpes>=vidaFrutal(v))return false;
 return c.status==='maduro'?c.grownMs===c.growthMs&&c.maturedAt!==null&&c.ruinedAt===null:c.status==='arruinado'?c.grownMs<c.growthMs&&c.ruinedAt!==null&&c.maturedAt===null:c.grownMs<c.growthMs&&c.ruinedAt===null&&c.maturedAt===null;
}
