import {NIVEL_PVZ} from '../pvz/datos/niveles';
import type {DefNivel} from '../pvz/tipos';

export interface EscenarioHistoriaPvZ {id:number;nombre:string;col:number;fila:number;base:'plantas'|'zombis'|null;nivel:DefNivel;desbloquea:readonly string[]}
// Doce escenarios de integración. Las unidades, costes y composiciones proceden de los niveles
// construidos; la campaña definitiva de 240 áreas y el catálogo completo siguen pendientes.
const datos:readonly [string,string,number,readonly string[],(readonly number[])?][]=[
 ['Casas del roble','1-4',5,['hielaguisantes','planta-carnivora']],
 ['Calle del molino','1-6',3,['hipnoseta','seta-congelada']],
 ['Parque del estanque','1-7',5,['cactus','trebolador','planterna']],
 ['Fortaleza zombi','2-9',7,[]],
 ['Paseo del farol','2-2',3,['seta-desesporada','seta-solar','humoseta','comepiedras']],
 ['Puente del río','3-2',4,['nenufar','marseta','zampalga'],[1,2]],
 ['Almacén de semillas','1-8',7,['tripitidora','aplastaflor','nuez-alta']],
 ['Avenida del mercado','1-9',4,['bipetidora','frustrella','calabaza']],
 ['La casa','1-2',5,['lanzaguisantes','girasol','nuez','petacereza']],
 ['Estación vieja','1-3',4,['repetidora','patatapum']],
 ['Plaza de las fuentes','1-8',6,['plantorcha','pinchohierba','jalapeno']],
 ['Colina del norte','2-4',6,['magnetoseta','seta-miedica','petaseta']],
];
export const ESCENARIOS_HISTORIA_PVZ:readonly EscenarioHistoriaPvZ[]=datos.map(([nombre,plantilla,filas,desbloquea,agua],id)=>{
 const original=structuredClone(NIVEL_PVZ[plantilla]);
 const{premio,semillas,filasAgua,...nivel}=original;
 return{id,nombre,col:id%4,fila:Math.floor(id/4),base:id===8?'plantas':id===3?'zombis':null,desbloquea,
  nivel:{...nivel,id:'territorio-'+id,tablero:{filas},filas:Array.from({length:filas},(_,i)=>i),...(agua?{filasAgua:[...agua]}:{})}};
});
export const escenarioHistoriaPvZ=(id:number)=>ESCENARIOS_HISTORIA_PVZ[id];
