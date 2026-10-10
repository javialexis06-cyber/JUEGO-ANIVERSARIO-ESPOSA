import type { Herramienta, Zona } from './catalogo';
import type { Obstaculo } from './estado';
export type Servicio='semillas'|'animales'|'carpinteria'|'herreria'|'clinica'|'posada'|'archivo'|'altar_aura'|'altar_lara';
export const SERVICIOS:Servicio[]=['semillas','animales','carpinteria','herreria','clinica','posada','archivo','altar_aura','altar_lara'];
export interface NivelHerramienta {nivel:number;nombre:string;dano:number;monedas:number;receta:Record<string,number>;duracionMs:number}
// Nombres y costes provisionales: la mitología definitiva se integra fuera del motor.
export const NIVELES_HERRAMIENTA:NivelHerramienta[]=[
 {nivel:0,nombre:'Básica',dano:1,monedas:0,receta:{},duracionMs:0},
 {nivel:1,nombre:'Cobre',dano:2,monedas:100,receta:{cobre:8,madera:5},duracionMs:30_000},
 {nivel:2,nombre:'Hierro',dano:3,monedas:250,receta:{hierro:12,cobre:5},duracionMs:45_000},
 {nivel:3,nombre:'Acero estelar',dano:5,monedas:600,receta:{hierro:20,cristal:10},duracionMs:60_000},
 {nivel:4,nombre:'Cristal de Celia',dano:8,monedas:1200,receta:{cristal:25,madera_ancestral:10,polvo_estelar:3},duracionMs:90_000},
];
export const HERRAMIENTAS_MEJORABLES:Herramienta[]=['azada','regadera','hacha','pico','guadana','cana','espada'];
export const REGENERACION_NODO_MS=30*60_000;
export const VIDA_RECURSO={arbol:6,roca:4,maleza:1,ruina:8};
export const ALCANCE_GOLPE=2.4,ALCANCE_RECOGIDA=2;
/** Las mejoras de campo amplían el gesto; el motor filtra casillas ocupadas o ajenas. */
export function celdasDeHerramienta(x:number,z:number,nivel:number,direccion={x:0,z:1}):{x:number;z:number}[]{
 const dx=Math.abs(direccion.x)>Math.abs(direccion.z)?Math.sign(direccion.x):0;
 const dz=dx?0:Math.sign(direccion.z)||1, derecha={x:dz,z:-dx};
 const local=nivel>=4?[-1,0,1].flatMap(i=>[-1,0,1].map(j=>[i,j])):nivel===3?[[0,0],[0,1],[1,0],[1,1]]:Array.from({length:Math.max(1,nivel+1)},(_,i)=>[0,i]);
 return local.map(([largo,frente])=>({x:x+derecha.x*largo+dx*frente,z:z+derecha.z*largo+dz*frente}));
}
export function herramientaDeNodo(o:Obstaculo):Herramienta{return o.tipo==='arbol'?'hacha':o.tipo==='maleza'?'guadana':'pico'}
export function nivelNecesario(o:Obstaculo){return o.gigante?2:o.zona==='bosque_ancestral'?2:o.zona==='mina'&&(o.nivelMina||1)>=5?3:o.zona==='mina'&&(o.nivelMina||1)>=4?2:0}
export function nodosExteriores():Obstaculo[]{
 const nodos:Obstaculo[]=[];
 const agregar=(zona:Zona,tipo:Obstaculo['tipo'],x:number,z:number,i:number,nivelMina?:number)=>{const hpMax=zona==='bosque_ancestral'?10:tipo==='roca'?4+(nivelMina||1):VIDA_RECURSO[tipo];nodos.push({id:`nodo_${zona}_${nivelMina||0}_${i}`,tipo,x,z,sectorId:-1,zona,nivelMina,hp:hpMax,hpMax,regeneraEn:null});};
 for(let i=0;i<12;i++)agregar('bosque','arbol',-89+(i%4)*7,-7+Math.floor(i/4)*7,i);
 for(let i=0;i<8;i++)agregar('bosque_ancestral','arbol',-89+(i%4)*7,70+Math.floor(i/4)*9,i);
 // Monte espeso (los primeros árboles conservan su id y lugar): rejilla desordenada que deja libres los senderos,
 // las salidas, el claro de llegada y el sitio del guardián del bosque ancestral.
 const espeso=(zona:'bosque'|'bosque_ancestral',x0:number,x1:number,z0:number,z1:number,paso:number,libres:[number,number,number][],desde:number)=>{
  const usadas=new Set(nodos.filter(n=>n.zona===zona).map(n=>n.x+','+n.z));let i=desde,k=0;
  for(let z=z0;z<=z1;z+=paso)for(let x=x0;x<=x1;x+=paso){k++;const h=(a:number)=>{const n=Math.sin(k*127.1+a*311.7)*43758.5453;return n-Math.floor(n);};
   const px=Math.round(x+(h(1)-.5)*paso*.7),pz=Math.round(z+(h(2)-.5)*paso*.7);
   if(h(3)<.12||libres.some(([cx,cz,r])=>Math.hypot(px+.5-cx,pz+.5-cz)<r))continue;
   if([...usadas].some(c=>{const [ux,uz]=c.split(',').map(Number);return Math.abs(ux-px)<2&&Math.abs(uz-pz)<2;}))continue;
   usadas.add(px+','+pz);agregar(zona,'arbol',px,pz,i++);}
 };
 const sendero=(x:number,z0:number,z1:number)=>Array.from({length:Math.ceil((z1-z0)/2)+1},(_,j)=>[x,z0+j*2,2.6] as [number,number,number]);
 espeso('bosque',-99,-59,-22,21,2.3,[[-78,1,4.5],[-59,3.5,4],[-61.5,3.5,3.5],[-77.5,19.5,4],[-78.5,16.5,3.5],...sendero(-74,-8,23)],12);
 espeso('bosque_ancestral',-100,-57,54,98,2.6,[[-78,76,4.5],[-77.5,60.5,4],[-78.5,63.5,4],[-76,74,3.5],...sendero(-74,54,98)],8);
 const piedras=[[-6,-5],[-2,-5],[3,-5],[6,-2],[-6,0],[-3,2],[2,2],[5,3]];
 for(let nivel=1;nivel<=5;nivel++)piedras.forEach(([x,z],i)=>agregar('mina','roca',x,z,i,nivel));
 return nodos;
}
export function botinDeNodo(o:Obstaculo):Record<string,number>{
 if(o.gigante)return {madera:20,madera_ancestral:3};
 if(o.zona==='mina'){const mineral=(o.nivelMina||1)>=3?'cristal':o.nivelMina===2?'hierro':'cobre';return {[mineral]:2,piedra:2};}
 if(o.tipo==='arbol')return {[o.zona==='bosque_ancestral'?'madera_ancestral':'madera']:o.zona==='bosque_ancestral'?3:6};
 if(o.tipo==='maleza')return {fibra:3,semilla_zanahoria:1,heno:2};
 return {piedra:6};
}
