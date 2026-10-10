import type { CultivoDef } from './catalogo';
import type { CropCare } from './cuidados';
import { crearCultivo } from './cuidados';
import type { Calidad } from './inventario';
import { CRECIMIENTO_NOCHE_MS } from './jornada';

export interface CampoCultivo {fertilizante:0|1|2;cosechas:number;ciclo:'inicial'|'rebrote';semilla:number;riegoDia:number|null;riegoManualDia?:number|null}
export const nombreCalidad=(q:Calidad)=>['Normal','Plata','Oro','Estelar'][q];
export { multiplicadorCalidad } from './valor-venta';
/** El catálogo anterior conserva horas solo para migración; cada valor ahora representa días. */
export function diasCultivo(d:CultivoDef,ciclo:'inicial'|'rebrote'='inicial'){return ciclo==='rebrote'?d.rebroteDias??d.rebroteHoras??d.dias??d.horas:d.dias??d.horas;}
/** Las unidades históricas se conservan en el guardado como puntos de crecimiento, nunca tiempo transcurrido. */
export function tiempoCosecha(c:CropCare,campo?:CampoCultivo,dia?:number):string{
 if(c.status==='maduro')return 'Lista para cosechar';if(c.status==='arruinado')return 'Cultivo seco: retíralo';
 const dias=Math.max(1,Math.ceil((c.growthMs-c.grownMs)/CRECIMIENTO_NOCHE_MS));
 const necesita=c.lastWateredAt===null||c.lastEvaluatedAt-c.lastWateredAt>=24*3_600_000||dia!==undefined&&campo?.riegoDia!==dia;
 return `${dias} ${dias===1?'día':'días'} de crecimiento · Avanza al dormir${necesita?' · Necesita agua hoy':''}`;
}
export function crearCampo(semilla=0):CampoCultivo{return {fertilizante:0,cosechas:0,ciclo:'inicial',semilla:semilla>>>0,riegoDia:null,riegoManualDia:null};}
export function duracionCampo(d:CultivoDef,c:CampoCultivo){return diasCultivo(d,c.ciclo)*CRECIMIENTO_NOCHE_MS;}
/** La tirada pertenece a esta parcela y cosecha; rechazar por mochila llena no la vuelve a sortear. */
export function calidadCosecha(c:CampoCultivo,nivel=0,bono=0):Calidad{
 let n=(c.semilla+Math.imul(c.cosechas+1,0x9e3779b9))>>>0;n=Math.imul(n^(n>>>16),0x85ebca6b);n=Math.imul(n^(n>>>13),0xc2b2ae35);const r=((n^(n>>>16))>>>0)/4294967296;
 const oro=Math.min(.55,.04+Math.max(0,Math.min(10,nivel))*.025+c.fertilizante*.12+Math.max(0,Math.min(.2,bono))),plata=Math.min(.9,oro+.15+c.fertilizante*.14);
 return c.fertilizante===2&&r<.08?3:r<oro?2:r<plata?1:0;
}
export function faseCampo(d:CultivoDef,c:CampoCultivo,cuidado:CropCare):number{
 if(cuidado.status==='maduro')return 3;if(c.ciclo==='rebrote')return cuidado.grownMs/cuidado.growthMs<.6?1:2;
 const p=cuidado.grownMs/cuidado.growthMs;let hasta=0;for(let i=0;i<(d.fases??[.18,.27,.3,.25]).length;i++){hasta+=(d.fases??[.18,.27,.3,.25])[i];if(p<hasta)return Math.min(3,i);}return 3;
}
export function siguienteCosecha(d:CultivoDef,c:CampoCultivo,ahora:number):{campo:CampoCultivo;cuidado:CropCare}|null{
 if(!d.rebroteHoras&&!d.rebroteDias)return null;const campo={...c,ciclo:'rebrote' as const,cosechas:c.cosechas+1,riegoDia:null,riegoManualDia:null};return {campo,cuidado:crearCultivo(duracionCampo(d,campo),ahora,false)};
}
export function campoValido(c:unknown):c is CampoCultivo{
 const v=c as CampoCultivo;return !!v&&[0,1,2].includes(v.fertilizante)&&Number.isSafeInteger(v.cosechas)&&v.cosechas>=0&&v.cosechas<1e9&&['inicial','rebrote'].includes(v.ciclo)&&Number.isInteger(v.semilla)&&v.semilla>=0&&v.semilla<=0xffffffff&&(v.riegoDia===null||Number.isInteger(v.riegoDia)&&v.riegoDia>=0&&v.riegoDia<=1_000_000)&&(v.riegoManualDia===undefined||v.riegoManualDia===null||Number.isInteger(v.riegoManualDia)&&v.riegoManualDia>=0&&v.riegoManualDia<=1_000_000);
}
