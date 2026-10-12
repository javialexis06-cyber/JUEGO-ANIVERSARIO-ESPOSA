import { SECTORES, type Zona } from './catalogo';
export interface SalidaZona {id:string;desde:Zona;hacia:Zona;x:number;z:number;llegada:{x:number;z:number};nombre:string}
export const SALIDAS:SalidaZona[]=[
 // Como en Stardew: las salidas de la granja están en sus bordes, al final de los caminos de tierra
 {id:'granja_pueblo',desde:'granja',hacia:'pueblo',x:49,z:12,llegada:{x:54.5,z:.5},nombre:'Camino este hacia el pueblo'},
 {id:'pueblo_granja',desde:'pueblo',hacia:'granja',x:50,z:-1,llegada:{x:46.5,z:12.5},nombre:'Sendero oeste hacia tu granja'},
 {id:'granja_bosque',desde:'granja',hacia:'bosque',x:-50,z:12,llegada:{x:-61.5,z:3.5},nombre:'Camino oeste hacia el bosque'},
 {id:'bosque_granja',desde:'bosque',hacia:'granja',x:-59,z:3,llegada:{x:-46.5,z:12.5},nombre:'Sendero este hacia tu granja'},
 {id:'granja_mina',desde:'granja',hacia:'mina',x:-13,z:-40,llegada:{x:.5,z:3.5},nombre:'Camino norte hacia la mina'},
 {id:'mina_granja',desde:'mina',hacia:'granja',x:0,z:7,llegada:{x:-12.5,z:-36.5},nombre:'Camino de regreso a la granja'},
 {id:'granja_lago',desde:'granja',hacia:'lago',x:6,z:55,llegada:{x:14.5,z:82.5},nombre:'Camino sur hacia el lago'},
 {id:'lago_granja',desde:'lago',hacia:'granja',x:13,z:78,llegada:{x:6.5,z:51.5},nombre:'Camino norte hacia tu granja'},
 {id:'bosque_ancestral',desde:'bosque',hacia:'bosque_ancestral',x:-78,z:19,llegada:{x:-78.5,z:63.5},nombre:'Paso sur hacia el bosque antiguo'},
 {id:'ancestral_bosque',desde:'bosque_ancestral',hacia:'bosque',x:-78,z:60,llegada:{x:-78.5,z:16.5},nombre:'Sendero hacia el bosque de los Susurros'},
];
export function dentroDeZona(zona:Zona,x:number,z:number){
 if(!Number.isFinite(x)||!Number.isFinite(z))return false;
 if(zona==='granja')return SECTORES.some(s=>x>=s.x&&x<s.x+s.ancho&&z>=s.z&&z<s.z+s.fondo);
 const b=zona==='pueblo'?[50,112,-43,44]:zona==='bosque'?[-101,-57,-24,23]:zona==='bosque_ancestral'?[-102,-55,52,100]:zona==='lago'?[5,49,74,111]:[-10,10,-9,9];
 return x>=b[0]&&x<b[1]&&z>=b[2]&&z<b[3];
}
/** Las salidas se toman en un radio de 2,5 m desde el centro de su casilla (antes 0,85 a 1,3: había que atinarle a
 * una casilla). El motor acepta un poquito más por si el personaje se movió mientras se pedía el viaje. */
export const RADIO_SALIDA=2.5;
/** Senderos de tierra fuera de la granja [x, z, ancho, fondo] (esquina menor): cada salida unida al centro de su zona,
 * por donde el monte no tiene árboles. */
export const SENDEROS_ZONA:Partial<Record<Zona,readonly [number,number,number,number][]>>={
 bosque:[[-74.4,-6,2,29.6],[-78.6,1.6,6.2,1.8],[-77.6,18.4,5.2,2.2],[-74.4,8.6,14.3,1.8],[-62.1,2.4,2.2,8],[-62.1,2.4,4.1,2.2]],
 bosque_ancestral:[[-74.4,59.4,2,17.8],[-77.6,59.4,5.2,2.2],[-78.6,75,6.2,2.2]],
 lago:[[12.4,78,2.2,10],[12.4,86.8,3.2,2.2]],
};
/** ¿Cae el punto sobre un sendero de su zona? (con un margen: los árboles de la orilla también estorban) */
export const enSenderoZona=(zona:Zona|undefined,x:number,z:number)=>!!zona&&(SENDEROS_ZONA[zona]??[]).some(([sx,sz,w,d])=>x>=sx-.2&&x<sx+w+.2&&z>=sz-.2&&z<sz+d+.2);
export function salidaCercana(zona:Zona,x:number,z:number,radio=1.1){return SALIDAS.find(s=>s.desde===zona&&Math.hypot(s.x+.5-x,s.z+.5-z)<=radio);}
/** Caminos de tierra de la granja [x, z, ancho, fondo]: de la cabaña al camino real (este-oeste) y de ahí al norte
 * (mina) y al sur (lago). Nada se construye ni crece encima; se cruzan caminando aunque el terreno no sea tuyo. */
export const CAMINOS_GRANJA:readonly [number,number,number,number][]=[
 [-50,12,100,2],   // camino real: bosque ⇄ pueblo
 [-13,-40,2,54],   // ramal norte: hacia la mina
 [6,14,2,42],      // ramal sur: hacia el lago
 [-10,-1,2,13],    // de la cabaña al camino real
 [-9,-1,5,1],      // umbral de la cabaña
];
/** Camino de la granja o acceso de tres casillas alrededor de una salida. */
export const esSenderoGranja=(x:number,z:number)=>CAMINOS_GRANJA.some(([cx,cz,w,d])=>x>=cx&&x<cx+w&&z>=cz&&z<cz+d)||SALIDAS.some(s=>s.desde==='granja'&&Math.abs(s.x-x)<=1&&Math.abs(s.z-z)<=1);
/** El mapa señala la primera salida de una ruta; nunca mueve al personaje. */
export function rutaCaminando(desde:Zona,hacia:Zona):SalidaZona[]{
 if(desde===hacia)return [];const cola:{zona:Zona;ruta:SalidaZona[]}[]=[{zona:desde,ruta:[]}],vistos=new Set<Zona>([desde]);
 while(cola.length){const actual=cola.shift()!;for(const salida of SALIDAS.filter(s=>s.desde===actual.zona)){if(vistos.has(salida.hacia))continue;const ruta=[...actual.ruta,salida];if(salida.hacia===hacia)return ruta;vistos.add(salida.hacia);cola.push({zona:salida.hacia,ruta});}}return [];
}
