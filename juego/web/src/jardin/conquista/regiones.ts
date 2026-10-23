import {PAISES_CONQUISTA,POSICIONES_ZONA,ciudadesConquista,zonasCiudad,zonasPais,type EscalaMapa} from './mapa';
import type {EstadoHistoriaPvZ} from './historia-motor';
type Punto={x:number;y:number};
export interface RegionHistoria {id:number;zonas:number[];poligono:Punto[];estado:'plantas'|'zombis'|'mixta'}
const contornoPais:readonly Punto[]=[[8,8],[20,2],[37,5],[51,1],[70,3],[87,2],[96,12],[98,30],[94,49],[84,60],[89,71],[75,80],[57,88],[39,91],[29,82],[26,69],[12,65],[2,48],[1,29]].map(([x,y])=>({x,y}));
const continentes:readonly (readonly number[][])[]=[
 [[29,16],[35,7],[45,4],[55,6],[64,4],[75,6],[82,14],[86,25],[82,34],[72,38],[64,36],[57,41],[49,35],[40,33],[34,25]],
 [[47,64],[50,55],[61,48],[69,39],[78,39],[83,44],[89,43],[96,48],[99,57],[96,66],[98,73],[92,79],[95,90],[88,95],[79,87],[70,94],[61,85],[51,82],[46,76]],
 [[1,38],[5,25],[14,17],[22,21],[29,29],[37,35],[45,41],[45,48],[39,55],[42,64],[37,70],[42,82],[35,88],[27,91],[18,85],[10,79],[4,66],[6,57],[1,49]],
];
export function puntoZonaHistoria(id:number){return id===3?{x:87,y:25}:POSICIONES_ZONA[[0,1,2,3,1,0,2,3,0,3,2,1][id]];}
function recortar(puntos:readonly Punto[],a:Punto,b:Punto){
 const nx=b.x-a.x,ny=b.y-a.y,limite=(b.x*b.x+b.y*b.y-a.x*a.x-a.y*a.y)/2;
 const distancia=(p:Punto)=>p.x*nx+p.y*ny-limite,salida:Punto[]=[];
 for(let i=0;i<puntos.length;i++){const p=puntos[i],q=puntos[(i+1)%puntos.length],dp=distancia(p),dq=distancia(q);
  if(dp<=1e-9)salida.push(p);if((dp<0&&dq>0)||(dp>0&&dq<0)){const t=dp/(dp-dq);salida.push({x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t});}
 }return salida;
}
/** Fronteras visuales: agrupan las zonas existentes, sin inventar conexiones de combate. */
export function regionesHistoria(s:EstadoHistoriaPvZ,escala:EscalaMapa,pais:number,ciudad:number):RegionHistoria[]{
 const destinos=escala==='mundo'?PAISES_CONQUISTA.map(p=>({...p,zonas:zonasPais(s,p.id).map(z=>z.id)})):escala==='pais'?ciudadesConquista(s,pais).map(c=>({...c,zonas:zonasCiudad(s,c.id).map(z=>z.id)})):zonasCiudad(s,ciudad).map(z=>({id:z.id,...puntoZonaHistoria(z.id),zonas:[z.id]}));
 return destinos.map(d=>{
  let poligono=escala==='mundo'?continentes[d.id].map(([x,y])=>({x,y})):escala==='pais'?[...contornoPais]:[{x:1,y:1},{x:99,y:1},{x:99,y:99},{x:1,y:99}];
  if(escala!=='mundo')for(const otro of destinos)if(otro.id!==d.id)poligono=recortar(poligono,d,otro);
  const n=d.zonas.filter(id=>s.zonas[id].dueno==='plantas').length;
  return{id:d.id,zonas:d.zonas,poligono,estado:n===0?'zombis':n===d.zonas.length?'plantas':'mixta'};
 });
}
export const trazoRegionHistoria=(p:readonly Punto[])=>p.map((q,i)=>(i?'L':'M')+q.x.toFixed(3)+','+q.y.toFixed(3)).join('')+'Z';
