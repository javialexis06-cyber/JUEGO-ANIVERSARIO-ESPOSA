import type {Bando,Dueno} from './tipos';
interface EstadoMapaConquista {config:{modo:'historia'|'pvp'};zonas:readonly {id:number;nombre:string;col:number;fila:number;dueno:Dueno;base:Bando|null}[]}
export type EscalaMapa='mundo'|'pais'|'ciudad';
export const PAISES_CONQUISTA=[{id:0,nombre:'Solaria',x:62,y:27},{id:1,nombre:'Marisma',x:72,y:66},{id:2,nombre:'Verdalia',x:25,y:64}];
const NOMBRES=[['Distrito Prisma','Ciudad Solar','El Anillo Verde'],['Puerto Bruma','Bahía Farol','Isla Junco'],['Los Naranjos','Villa Alba','La Última Casa']];
export function ciudadesConquista(s:EstadoMapaConquista,pais:number){const cantidad=s.config.modo==='historia'?2:3;return Array.from({length:cantidad},(_,i)=>({id:pais*3+i,nombre:NOMBRES[pais][i],x:[26,73,54][i],y:[45,38,76][i]}));}
export function ubicacionConquista(s:EstadoMapaConquista,zona:number){const z=s.zonas[zona],pais=s.config.modo==='historia'?z.fila:Math.floor(z.fila/2),local=Math.floor(z.col/2);return{pais,ciudad:pais*3+local};}
export function zonasCiudad(s:EstadoMapaConquista,ciudad:number){return s.zonas.filter(z=>ubicacionConquista(s,z.id).ciudad===ciudad);}
export function zonasPais(s:EstadoMapaConquista,pais:number){return s.zonas.filter(z=>ubicacionConquista(s,z.id).pais===pais);}
export const POSICIONES_ZONA=[{x:25,y:67},{x:26,y:30},{x:70,y:28},{x:73,y:67}];
