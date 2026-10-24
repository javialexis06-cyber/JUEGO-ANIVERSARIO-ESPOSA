import {PAISES_CONQUISTA,ciudadesConquista,zonasCiudad,zonasPais,type EscalaMapa} from './mapa';
import type {EstadoMapaConquista} from './mapa';
type Punto={x:number;y:number};
export interface RegionHistoria {id:number;zonas:number[];poligono:Punto[];estado:'plantas'|'zombis'|'mixta'}
// Parcelas trazadas sobre mapa-ciudad.png: siguen calles, muros y cercas del dibujo.
// No se calcula una partición rectangular de la pantalla ni distancias entre marcadores.
const parcelas:readonly (readonly number[][])[]=[
 [[1,52],[4,49],[9,47],[14,50],[16,54],[18,57],[20,61],[20,65],[17,69],[12,72],[7,72],[3,70],[1,66]],
 [[1,1],[12,1],[24,1],[34,1],[40,5],[44,12],[42,20],[37,27],[33,32],[30,36],[27,40],[22,43],[16,40],[10,37],[4,36],[1,33]],
 [[43,13],[48,8],[57,5],[67,7],[75,13],[78,20],[79,29],[76,37],[70,43],[63,46],[55,48],[48,45],[43,41],[40,35],[38,28],[40,20]],
 [[56,52],[66,48],[73,47],[81,51],[89,57],[97,66],[99,74],[97,82],[91,88],[84,92],[77,94],[70,90],[63,83],[59,77],[55,73],[52,67],[52,60]],
 [[83,12],[89,10],[94,13],[98,19],[99,29],[96,37],[91,41],[85,40],[81,34],[80,26],[81,18]],
];
const parcelasZona=[0,1,2,4,1,0,3,1,0,3,2,1];
const pines=[{x:11,y:63},{x:23,y:22},{x:60,y:28},{x:75,y:71},{x:90,y:25}];
const ciudades:readonly (readonly number[][])[]=[
 [[9,30],[15,26],[20,26],[27,29],[31,34],[32,40],[29,47],[26,51],[21,55],[15,55],[10,51],[8,45],[7,39]],
 [[64,22],[70,20],[76,23],[82,28],[87,34],[88,41],[86,47],[80,50],[75,47],[70,45],[66,40],[63,34]],
];
const continentes:readonly (readonly number[][])[]=[
 [[31,18],[32,12],[35,10],[37,7],[42,8],[44,5],[49,8],[51,5],[56,8],[60,7],[65,5],[70,8],[72,5],[77,7],[79,11],[81,14],[81,18],[84,20],[83,24],[85,28],[82,31],[79,33],[76,34],[73,37],[69,37],[65,39],[60,38],[55,41],[51,38],[48,37],[45,34],[41,34],[39,30],[36,30],[34,25],[31,23]],
 [[49,66],[48,61],[52,55],[57,53],[60,49],[64,45],[69,40],[73,39],[78,41],[81,44],[86,43],[89,46],[92,45],[95,49],[97,52],[96,57],[98,60],[95,65],[96,69],[98,74],[94,77],[91,79],[93,83],[91,89],[87,92],[84,90],[81,86],[78,86],[74,91],[70,92],[67,88],[63,88],[60,85],[55,84],[52,80],[48,78],[47,72]],
 [[2,41],[4,34],[4,28],[8,25],[11,20],[15,20],[18,22],[22,24],[24,29],[29,31],[33,34],[38,37],[41,40],[43,45],[41,49],[39,51],[37,54],[39,60],[39,65],[36,69],[37,73],[41,80],[39,84],[35,85],[32,88],[28,89],[25,91],[22,87],[17,87],[13,84],[10,79],[6,78],[4,73],[4,68],[2,63],[3,58],[2,54],[4,48]],
];
export function puntoZonaHistoria(id:number){return pines[parcelasZona[id]];}
/** Croquis de lugares dibujados, sin modificar la conectividad ni las reservas del motor. */
export function regionesHistoria(s:EstadoMapaConquista,escala:EscalaMapa,pais:number,ciudad:number):RegionHistoria[]{
 const destinos=escala==='mundo'?PAISES_CONQUISTA.map(p=>({...p,zonas:zonasPais(s,p.id).map(z=>z.id)})):escala==='pais'?ciudadesConquista(s,pais).map(c=>({...c,zonas:zonasCiudad(s,c.id).map(z=>z.id)})):zonasCiudad(s,ciudad).map(z=>({id:z.id,zonas:[z.id]}));
 return destinos.map((d,i)=>{const n=d.zonas.filter(id=>s.zonas[id].dueno==='plantas').length,contorno=escala==='mundo'?continentes[d.id]:escala==='pais'?ciudades[i]:parcelas[parcelasZona[d.id]];return{id:d.id,zonas:d.zonas,poligono:contorno.map(([x,y])=>({x,y})),estado:n===0?'zombis':n===d.zonas.length?'plantas':'mixta'};});
}
/** Contorno cerrado: conserva esquinas de cercas, calles y costa, sin redondear toda la parcela. */
export function trazoRegionHistoria(p:readonly Punto[]){return p.length?'M'+p.map(q=>`${q.x.toFixed(3)},${q.y.toFixed(3)}`).join('L')+'Z':'';}
