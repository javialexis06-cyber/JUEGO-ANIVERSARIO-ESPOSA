import type {MotorPvZ} from './motor';
/** Emboscada adicional a la última oleada: dos o tres celdas de agua distintas. */
export function emboscarPiscinaPvZ(m:MotorPvZ){
 const filas=m.nivel.filas.filter(f=>m.esAgua(f));
 const celdas=filas.flatMap(fila=>[5,6,7,8].map(col=>({fila,col})));
 const pares=[['zombi','zombi-flotador'],['caracono','caracono-flotador'],['caracubo','caracubo-flotador']]
  .filter(([tipo,id])=>m.nivel.zombis.includes(tipo)&&!!m.zombisDef[id]);
 if(!pares.length)return;
 const cantidad=m.nivel.id==='3-1'||m.nivel.id==='3-2'?2:3;
 for(let i=0;i<cantidad&&celdas.length;i++){
  const [celda]=celdas.splice(m.azar.entero(celdas.length),1),pesos=pares.map(([tipo])=>m.zombisDef[tipo].datos?.peso??1);
  let dado=m.azar.siguiente()*pesos.reduce((a,b)=>a+b,0),j=0;while(j<pesos.length-1&&dado>=pesos[j])dado-=pesos[j++];
  const z=m.crearZombi(pares[j][1],celda.fila,celda.col*80+40);
  if(z){z.datos.emergeHasta=m.t+.5;m.eventos.push({t:'estado',tipo:'emboscada-agua',id:z.id,fila:z.fila,x:z.x,duracion:.5});}
 }
}
