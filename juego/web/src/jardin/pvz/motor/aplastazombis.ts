import type {MotorPvZ} from './motor';
import type {ZombiPvZ} from '../tipos';
/** Aplasta-zombis de aventura (2-5), separado del minijuego posterior de doce oleadas. */
export class AplastazombisPvZ {
 readonly total=8;actual=0;terminado=false;
 private siguiente=2;private grupoEn=2;private crecida=false;private finalEn:number|null=null;
 paso(m:MotorPvZ){
  if(this.terminado)return;
  if(this.actual>0&&this.actual<8&&!this.crecida&&m.t+1e-9>=this.siguiente-1){this.crecer(m);this.crecida=true;}
  if(this.actual<8&&m.t+1e-9>=this.siguiente){
   this.actual++;m.oleada=this.actual;this.siguiente+=20;this.grupoEn=m.t;this.crecida=false;
   m.eventos.push({t:this.actual===8?'ultimaOleada':'oleada',oleada:this.actual});
   if(this.actual===8)this.finalEn=m.t+3;
  }
  if(this.finalEn!==null){if(m.t+1e-9>=this.finalEn){this.generar(m,true);this.finalEn=null;this.terminado=true;}return;}
  if(this.actual>0&&m.t+1e-9>=this.grupoEn&&m.t<this.siguiente-3){
   this.generar(m,false);
   const progreso=(this.actual-1)/11,min=Math.round(100-70*progreso),max=Math.round(200-140*progreso);
   this.grupoEn=m.t+(min+m.azar.entero(max-min+1))/100;
  }
 }
 private crecer(m:MotorPvZ){
  const cantidad=Math.max(1,5-m.lapidas.length);
  for(let i=0;i<cantidad;i++){
   const posibles=m.nivel.filas.flatMap(fila=>Array.from({length:6},(_,i)=>({fila,col:i+3}))).filter(q=>!m.lapidaEn(q.fila,q.col)&&!m.crateres.some(c=>c.fila===q.fila&&c.col===q.col));
   if(!posibles.length)return;
   const pesos=posibles.map(q=>m.plantas.some(p=>p.vida>0&&p.fila===q.fila&&p.col===q.col)?100000:1);
   let dado=m.azar.siguiente()*pesos.reduce((s,n)=>s+n,0),j=0;while(j<pesos.length-1&&dado>=pesos[j])dado-=pesos[j++];
   m.crearLapida(posibles[j].fila,posibles[j].col,true);
  }
 }
 private generar(m:MotorPvZ,final:boolean){
  const fase=Math.min(5,Math.floor((this.actual-1)/2));
  const tumbas=m.lapidas.filter(q=>m.plantaEn(q.fila,q.col)?.tipo!=='comepiedras');
  const dobles=fase===1?.3:fase>=2?.1:0,cantidad=final?Math.min(20,tumbas.length):Math.min(tumbas.length,m.azar.siguiente()<dobles?2:1);
  let tipo='zombi';
  if(!final){const dado=m.azar.siguiente();if(fase>=3&&dado<.1)tipo='caracubo';else if(fase>=2&&dado<(fase>=3?.4:.3))tipo='caracono';}
  for(let i=0;i<cantidad;i++){
   const j=m.azar.entero(tumbas.length),[q]=tumbas.splice(j,1);
   if(final)tipo=m.azar.entero(2)===0?'caracono':'caracubo';
   const z=m.crearZombi(tipo,q.fila,q.x);if(!z)continue;
   const maxima=final?2:Math.round(1+2*((this.actual-1)/11)**2);
   z.datos.velocidad=m.azar.entre(.5,maxima)*100;z.datos.emergeHasta=m.t+.5;
  }
 }
 premiar(m:MotorPvZ,z:ZombiPvZ){
  const valor=z.tipo==='caracubo'?4:z.tipo==='caracono'?2:1;
  const max=m.sol>500?2800:m.sol>350?3100:m.sol>200?3700:5000,dado=m.azar.entero(30000);
  if(dado<2500*valor||dado>max*valor)return;
  for(let i=0;i<3;i++)m.crearSol(z.fila,Math.max(0,Math.min(800,z.x)),25);
 }
}
