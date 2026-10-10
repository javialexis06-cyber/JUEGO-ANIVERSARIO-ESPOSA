import { ARTICULOS, SECTORES, type Clima, type Estacion, type Zona } from './catalogo';
import type { EstadoGranja } from './estado';
import { fechaValle } from './jornada';
export type Tiempo = 'sol'|'brisa'|'lluvia'|'tormenta'|'nieve'|'ceniza';
export interface EstadoTiempo {version:1;semilla:number}
export const TIEMPOS:Record<Tiempo,{nombre:string;icono:string;texto:string}>={
 sol:{nombre:'Despejado',icono:'☀',texto:'El cielo está despejado. Riega los cultivos de esta jornada.'},
 brisa:{nombre:'Brisa',icono:'≋',texto:'Una brisa recorre el valle. Riega los cultivos de esta jornada.'},
 lluvia:{nombre:'Lluvia',icono:'☂',texto:'La lluvia riega los cultivos al aire libre mientras juegas.'},
 tormenta:{nombre:'Tormenta',icono:'☁',texto:'La tormenta riega los cultivos al aire libre mientras juegas.'},
 nieve:{nombre:'Nieve',icono:'❄',texto:'La nieve no sustituye el riego. Atiende los cultivos de escarcha.'},
 ceniza:{nombre:'Ceniza',icono:'✦',texto:'La ceniza volcánica no aporta agua. Riega los cultivos de este hábitat.'},
};
const mezclar=(n:number)=>{n=Math.imul(n^(n>>>16),0x85ebca6b);n=Math.imul(n^(n>>>13),0xc2b2ae35);return (n^(n>>>16))>>>0;};
export function crearTiempo(inicio:number):EstadoTiempo{return {version:1,semilla:mezclar((Math.floor(inicio/1000)^0x6a09e667)>>>0)};}
export function tiempoValido(v:unknown):v is EstadoTiempo {const t=v as EstadoTiempo;return !!t&&t.version===1&&Number.isInteger(t.semilla)&&t.semilla>=0&&t.semilla<=0xffffffff;}
/** Programa estable por partida y jornada. Ningún timestamp real cambia el clima. */
export function tiempoDia(t:EstadoTiempo,dia:number):Tiempo{
 if(!tiempoValido(t)||!Number.isInteger(dia)||dia<0||dia>1_000_001)throw new RangeError('Pronóstico inválido.');
 if(dia<2)return 'sol';if(dia===2)return 'lluvia';
 const estacion=fechaValle(dia).estacion,r=mezclar(t.semilla^Math.imul(dia+1,0x9e3779b9))/4294967296;
 if(estacion==='invierno')return r<.48?'nieve':r<.64?'brisa':'sol';
 const tormenta=estacion==='verano'?.08:.055,lluvia=estacion==='primavera'?.32:estacion==='verano'?.18:.28;
 return r<tormenta?'tormenta':r<lluvia?'lluvia':r<lluvia+.18?'brisa':'sol';
}
export function tiempoRegion(t:Tiempo,bioma:Clima):Tiempo{
 if(bioma==='polar')return t==='lluvia'||t==='tormenta'||t==='nieve'?'nieve':t;
 if(bioma==='volcanico')return ['lluvia','tormenta','nieve','brisa'].includes(t)?'ceniza':'sol';
 return t;
}
export const lluviaRiega=(t:Tiempo)=>t==='lluvia'||t==='tormenta';
export function biomaCelda(s:Pick<EstadoGranja,'edificios'>,x:number,z:number):Clima{
 for(const e of s.edificios){if(!e.especie||e.clima==='templado')continue;const a=ARTICULOS.find(a=>a.id===e.articulo);if(!a)continue;const fondo=a.fondo+(a.corral??0),w=e.giro%2?fondo:a.ancho,d=e.giro%2?a.ancho:fondo;if(x>=e.x-3&&x<e.x+w+3&&z>=e.z-3&&z<e.z+d+3)return e.clima;}
 return SECTORES.find(s=>x>=s.x&&x<s.x+20&&z>=s.z&&z<s.z+16)?.clima??'templado';
}
export const biomaZona=(zona:Zona,s:Pick<EstadoGranja,'edificios'>,x=0,z=0):Clima=>zona==='granja'?biomaCelda(s,x,z):zona==='bosque'||zona==='bosque_ancestral'||zona==='lago'?'humedo':zona==='mina'?'mineral':'templado';
export function pronostico(s:Pick<EstadoGranja,'tiempo'|'jornada'>){const dia=s.jornada.diasCompletados;return {hoy:tiempoDia(s.tiempo,dia),manana:tiempoDia(s.tiempo,dia+1),fecha:fechaValle(dia+1)};}
export function faseLuz(minutos:number):{noche:number;atardecer:number}{
 const m=Math.max(360,Math.min(1560,minutos));return {noche:Math.max(0,Math.min(1,(m-1080)/150)),atardecer:Math.max(0,1-Math.abs(m-1080)/120)};
}
