import type { PasoHistoria, RetoHistoria } from './historia-tipos';

const giro=(bits:number,n:number)=>{for(let i=0;i<n;i++)bits=((bits<<1)&15)|((bits>>3)&1);return bits;};
const BASE=[5,5,3,5,0,5,3,5,3];
export const puertosCircuito=(r:RetoHistoria,i:number)=>giro(BASE[i],r.giros[i]);
/** Entrada oeste, salida este y núcleo protegido en el centro. Solo cuenta la conexión recíproca. */
export function circuitoCorrecto(r:RetoHistoria){
 if(!(puertosCircuito(r,0)&8))return false;
 const visitados=new Set<number>([0]),cola=[0];
 while(cola.length){const i=cola.shift()!,mask=puertosCircuito(r,i),x=i%3,z=Math.floor(i/3);
  for(const [dx,dz,sale,entra]of [[0,-1,1,4],[1,0,2,8],[0,1,4,1],[-1,0,8,2]]){
   if(!(mask&sale))continue;const xx=x+dx,zz=z+dz;if(xx<0||xx>2||zz<0||zz>2)continue;const j=zz*3+xx;
   if(j===4)return false;
   if(puertosCircuito(r,j)&entra&&!visitados.has(j)){visitados.add(j);cola.push(j);}
  }
 }
 return visitados.has(8)&&!!(puertosCircuito(r,8)&2);
}
export function crearReto(mision:string,paso:PasoHistoria):RetoHistoria {
 const tipo=paso.tipo as RetoHistoria['tipo'],mapa=paso.mapa??[];
 let x=0,z=0;for(let j=0;j<mapa.length;j++){const i=mapa[j].indexOf('S');if(i>=0){x=i;z=j;}}
 let seed=0;for(const c of paso.id)seed=(seed*31+c.charCodeAt(0))>>>0;
 const r:RetoHistoria={mision,paso:paso.id,tipo,progreso:0,errores:0,x,z,visitados:[],retiro:false,giros:BASE.map((_,i)=>(seed+i*3)%4)};
 if(circuitoCorrecto(r))r.giros[0]=(r.giros[0]+1)%4;
 return r;
}
export function moverLaberinto(r:RetoHistoria,p:PasoHistoria,dx:number,dz:number){
 if(!Number.isInteger(dx)||!Number.isInteger(dz)||Math.abs(dx)+Math.abs(dz)!==1)return {ok:false,mensaje:'Da un paso cardinal.'};
 const x=r.x+dx,z=r.z+dz,celda=p.mapa?.[z]?.[x];if(!celda||celda==='#')return {ok:false,mensaje:'Ese paso está cerrado.'};
 if(celda==='E'&&(!r.retiro||!['A','B'].every(c=>r.visitados.includes(c))))return {ok:false,mensaje:'Conserva A y B y retira autorización en R antes de salir.'};
 r.x=x;r.z=z;if(['A','B','R'].includes(celda)&&!r.visitados.includes(celda))r.visitados.push(celda);
 return {ok:true,mensaje:celda==='A'||celda==='B'?'Testimonio '+celda+' conservado.':celda==='R'?'Aquí puedes retirar tu autorización.':'Paso confirmado.',terminado:celda==='E'};
}
