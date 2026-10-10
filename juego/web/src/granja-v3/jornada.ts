import { obrasTerminadasValidas, type ObraTerminada } from './construccion';
import type { Aprendizaje } from './habilidades';
import { resumenEnviosValido, type ResumenEnvios } from './envios';
import type { Estacion } from './catalogo';
export const INICIO_DIA=6*60,FIN_DIA=26*60,SEGUNDOS_JORNADA=30*60;
/** Unidad lógica de crecimiento por noche, independiente del tiempo real. */
export const CRECIMIENTO_NOCHE_MS=30*60_000;
export interface FechaValle {dia:number;estacion:Estacion;ano:number}
export interface ResumenJornada {
 obras?:ObraTerminada[];aprendizajes?:Aprendizaje[];envios?:ResumenEnvios;id:number;fecha:FechaValle;fechaSiguiente:FechaValle;guardadoAt:number;monedasInicio:number;monedasFin:number;actividades:Record<string,number>;cultivosAvanzados:number;cultivosMaduros:number}
export interface Jornada {version:2;diasCompletados:number;minutos:number;monedasInicio:number;contadoresInicio:Record<string,number>;ultimaNoche:ResumenJornada|null;resumenPendiente:boolean}
export function fechaValle(dias:number):FechaValle{return {dia:dias%28+1,estacion:(['primavera','verano','otono','invierno'] as Estacion[])[Math.floor(dias/28)%4],ano:Math.floor(dias/112)+1};}
export function crearJornada(monedas:number,contadores:Record<string,number>={},diasCompletados=0,minutos=INICIO_DIA):Jornada{return {version:2,diasCompletados,minutos,monedasInicio:monedas,contadoresInicio:{...contadores},ultimaNoche:null,resumenPendiente:false};}
export function avanzarReloj(j:Jornada,segundos:number){if(!Number.isFinite(segundos)||segundos<=0||j.resumenPendiente)return;const delta=Math.min(segundos,5)*(FIN_DIA-INICIO_DIA)/SEGUNDOS_JORNADA;j.minutos=Math.min(FIN_DIA,j.minutos+delta);}
export function relojValle(j:Jornada){const total=Math.floor((j.minutos+1e-7)/10)*10;return {...fechaValle(j.diasCompletados),hora:Math.floor(total%1440/60),minuto:total%60,finDelDia:j.minutos>=FIN_DIA};}
export function cerrarJornada(j:Jornada,now:number,monedas:number,contadores:Record<string,number>,cultivosAvanzados:number,cultivosMaduros:number):ResumenJornada{
 const actividades:Record<string,number>={};for(const [k,v]of Object.entries(contadores)){const n=v-(j.contadoresInicio[k]??0);if(n>0)actividades[k]=n;}
 const id=j.diasCompletados+1,resumen:ResumenJornada={id,fecha:fechaValle(j.diasCompletados),fechaSiguiente:fechaValle(id),guardadoAt:now,monedasInicio:j.monedasInicio,monedasFin:monedas,actividades,cultivosAvanzados,cultivosMaduros};
 j.diasCompletados=id;j.minutos=INICIO_DIA;j.monedasInicio=monedas;j.contadoresInicio={...contadores};j.ultimaNoche=resumen;j.resumenPendiente=true;return resumen;
}
const entero=(v:unknown,min=0,max=1e9)=>typeof v==='number'&&Number.isInteger(v)&&v>=min&&v<=max;
const cuenta=(v:unknown):v is Record<string,number>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length<=500&&Object.entries(v).every(([k,n])=>/^[a-z0-9_]{1,99}$/.test(k)&&!['__proto__','constructor','prototype'].includes(k)&&entero(n));
const fecha=(v:unknown):v is FechaValle=>!!v&&typeof v==='object'&&entero((v as FechaValle).dia,1,28)&&entero((v as FechaValle).ano,1,1e9)&&['primavera','verano','otono','invierno'].includes((v as FechaValle).estacion);
const mismaFecha=(a:FechaValle,b:FechaValle)=>a.dia===b.dia&&a.ano===b.ano&&a.estacion===b.estacion;
export function jornadaValida(v:unknown,now:number):v is Jornada{
 const j=v as Jornada;if(!j||j.version!==2||!entero(j.diasCompletados,0,1_000_000)||typeof j.minutos!=='number'||!Number.isFinite(j.minutos)||j.minutos<INICIO_DIA||j.minutos>FIN_DIA||!entero(j.monedasInicio)||!cuenta(j.contadoresInicio)||typeof j.resumenPendiente!=='boolean')return false;
 if(j.ultimaNoche===null)return !j.resumenPendiente;const r=j.ultimaNoche;if(r?.obras!==undefined&&!obrasTerminadasValidas(r.obras))return false;if(r?.envios!==undefined&&!resumenEnviosValido(r.envios))return false;
 return !!r&&entero(r.id,1,1_000_000)&&r.id===j.diasCompletados&&fecha(r.fecha)&&fecha(r.fechaSiguiente)&&mismaFecha(r.fecha,fechaValle(r.id-1))&&mismaFecha(r.fechaSiguiente,fechaValle(r.id))&&typeof r.guardadoAt==='number'&&Number.isFinite(r.guardadoAt)&&r.guardadoAt>=0&&r.guardadoAt<=now&&entero(r.monedasInicio)&&entero(r.monedasFin)&&cuenta(r.actividades)&&entero(r.cultivosAvanzados,0,10680)&&entero(r.cultivosMaduros,0,r.cultivosAvanzados);
}
