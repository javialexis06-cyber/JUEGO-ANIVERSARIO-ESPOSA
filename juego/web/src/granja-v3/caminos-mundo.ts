import { SECTORES, type Zona } from './catalogo';
export interface SalidaZona {id:string;desde:Zona;hacia:Zona;x:number;z:number;llegada:{x:number;z:number};nombre:string}
export const SALIDAS:SalidaZona[]=[
 {id:'granja_pueblo',desde:'granja',hacia:'pueblo',x:9,z:4,llegada:{x:58.5,z:12.5},nombre:'Sendero este hacia el pueblo'},
 {id:'pueblo_granja',desde:'pueblo',hacia:'granja',x:55,z:12,llegada:{x:7.5,z:4.5},nombre:'Sendero oeste hacia tu granja'},
 {id:'granja_bosque',desde:'granja',hacia:'bosque',x:-9,z:4,llegada:{x:-61.5,z:3.5},nombre:'Sendero oeste hacia el bosque'},
 {id:'bosque_granja',desde:'bosque',hacia:'granja',x:-59,z:3,llegada:{x:-7.5,z:4.5},nombre:'Sendero este hacia tu granja'},
 {id:'granja_mina',desde:'granja',hacia:'mina',x:0,z:-7,llegada:{x:.5,z:5.5},nombre:'Camino norte hacia la mina'},
 {id:'mina_granja',desde:'mina',hacia:'granja',x:0,z:7,llegada:{x:.5,z:-4.5},nombre:'Camino de regreso a la granja'},
 {id:'granja_lago',desde:'granja',hacia:'lago',x:0,z:7,llegada:{x:14.5,z:80.5},nombre:'Camino sur hacia el lago'},
 {id:'lago_granja',desde:'lago',hacia:'granja',x:13,z:78,llegada:{x:.5,z:5.5},nombre:'Camino norte hacia tu granja'},
 {id:'bosque_ancestral',desde:'bosque',hacia:'bosque_ancestral',x:-78,z:19,llegada:{x:-78.5,z:63.5},nombre:'Paso sur hacia el bosque antiguo'},
 {id:'ancestral_bosque',desde:'bosque_ancestral',hacia:'bosque',x:-78,z:60,llegada:{x:-78.5,z:16.5},nombre:'Sendero hacia el bosque de los Susurros'},
];
export function dentroDeZona(zona:Zona,x:number,z:number){
 if(!Number.isFinite(x)||!Number.isFinite(z))return false;
 if(zona==='granja')return SECTORES.some(s=>x>=s.x&&x<s.x+s.ancho&&z>=s.z&&z<s.z+s.fondo);
 const b=zona==='pueblo'?[50,112,-43,44]:zona==='bosque'?[-101,-57,-24,23]:zona==='bosque_ancestral'?[-102,-55,52,100]:zona==='lago'?[5,49,74,111]:[-10,10,-9,9];
 return x>=b[0]&&x<b[1]&&z>=b[2]&&z<b[3];
}
export function salidaCercana(zona:Zona,x:number,z:number,radio=1.1){return SALIDAS.find(s=>s.desde===zona&&Math.hypot(s.x+.5-x,s.z+.5-z)<=radio);}
/** Deja un acceso de tres casillas para que edificios y recursos no cierren el sendero. */
export const esSenderoGranja=(x:number,z:number)=>SALIDAS.some(s=>s.desde==='granja'&&Math.abs(s.x-x)<=1&&Math.abs(s.z-z)<=1);
/** El mapa señala la primera salida de una ruta; nunca mueve al personaje. */
export function rutaCaminando(desde:Zona,hacia:Zona):SalidaZona[]{
 if(desde===hacia)return [];const cola:{zona:Zona;ruta:SalidaZona[]}[]=[{zona:desde,ruta:[]}],vistos=new Set<Zona>([desde]);
 while(cola.length){const actual=cola.shift()!;for(const salida of SALIDAS.filter(s=>s.desde===actual.zona)){if(vistos.has(salida.hacia))continue;const ruta=[...actual.ruta,salida];if(salida.hacia===hacia)return ruta;vistos.add(salida.hacia);cola.push({zona:salida.hacia,ruta});}}return [];
}
