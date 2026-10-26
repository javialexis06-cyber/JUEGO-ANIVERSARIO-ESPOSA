import type {MotorPvZ} from './motor';
import type {ZombiPvZ} from '../tipos';

/** Escenario del tejado: macetas iniciales por columnas (PC: 5 en 5-1, 4 en 5-2, 3 después) y el jefe de 5-10. */
export function prepararTejadoPvZ(m:MotorPvZ){
 if(m.nivel.macetas&&Object.hasOwn(m.plantasDef,'maceta'))for(let col=0;col<m.nivel.macetas;col++)for(const fila of m.nivel.filas)m.sembrarTerreno('maceta',fila,col);
 if(m.nivel.jefe&&!m.sinOleadas){const filas=m.nivel.filas;m.crearZombi(m.nivel.jefe,filas[Math.floor(filas.length/2)],745,0);}
}

/** PC (SetupBungeeDrop): columnas 4–8 de todos los carriles; una casilla ya usada pasa a peso 1 en la misma tanda. */
export function caerDesdeCieloPvZ(m:MotorPvZ,tipos:readonly string[],oleada:number){
 const celdas=m.nivel.filas.flatMap(fila=>[4,5,6,7,8].map(col=>({fila,col,peso:10000})));
 const traidos:ZombiPvZ[]=[];
 for(const tipo of tipos){
  if(!celdas.length)break;
  let dado=m.azar.siguiente()*celdas.reduce((a,c)=>a+c.peso,0),i=0;while(i<celdas.length-1&&dado>=celdas[i].peso)dado-=celdas[i++].peso;
  const celda=celdas[i];celda.peso=1;
  const z=m.crearZombi(tipo,celda.fila,celda.col*80+40,oleada);if(!z)continue;
  z.datos.colgadoAlto=1;z.comiendo=null;
  m.caidaColgado={fila:celda.fila,col:celda.col,carga:z.id};
  const b=m.crearZombi('zombi-colgado',celda.fila,celda.col*80+40,oleada);m.caidaColgado=null;
  if(!b){m.retirarZombi(z);continue;}
  z.datos.colgadoPor=b.id;traidos.push(z);
 }
 return traidos;
}

/** Equivalente del alzamiento nocturno en el tejado: colgados traen 2 o 3 zombis al empezar la última oleada. */
export function emboscarTejadoPvZ(m:MotorPvZ){
 const pares=([['zombi',4000],['caracono',4000],['caracubo',3000]] as const).filter(([id])=>id==='zombi'||m.nivel.zombis.includes(id));
 const tipos:string[]=[];
 for(let i=0;i<(m.nivel.emboscadaCielo??0);i++){
  let dado=m.azar.siguiente()*pares.reduce((a,[,p])=>a+p,0),j=0;while(j<pares.length-1&&dado>=pares[j][1])dado-=pares[j++][1];tipos.push(pares[j][0]);
 }
 caerDesdeCieloPvZ(m,tipos,m.oleada);
}
