import type {MotorPvZ} from './motor';
/** Lápidas iniciales: columna fija por datos, fila elegida sin repetición con el azar de la partida. */
export function prepararTerrenoPvZ(m:MotorPvZ){
 const distribucion=m.nivel.distribucionLapidas;
 if(distribucion){
  for(const [columna,cantidad]of Object.entries(distribucion)){
   const col=Number(columna),filas=[...m.nivel.filas];
   for(let i=0;i<cantidad;i++){const j=m.azar.entero(filas.length),[fila]=filas.splice(j,1);m.crearLapida(fila,col);}
  }
 }else{
  const huecos=m.nivel.filas.flatMap(fila=>Array.from({length:6},(_,i)=>({fila,col:i+3})));
  for(let i=0;i<(m.nivel.lapidas??0);i++){const j=m.azar.entero(huecos.length),[q]=huecos.splice(j,1);m.crearLapida(q.fila,q.col);}
 }
}
/** El alzamiento nocturno es adicional al presupuesto de la última oleada. */
export function alzarLapidasPvZ(m:MotorPvZ){
 for(const tumba of m.lapidas){
  if(m.plantaEn(tumba.fila,tumba.col)?.tipo==='comepiedras')continue;
  const tipo=m.azar.entero(2)===0?'zombi':'caracono',z=m.crearZombi(tipo,tumba.fila,tumba.x);
  if(z)z.datos.emergeHasta=m.t+1.5;
 }
}
