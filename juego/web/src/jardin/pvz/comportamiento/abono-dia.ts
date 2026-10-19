import type {MotorPvZ} from '../motor/motor';
import type {PlantaPvZ} from '../tipos';

/** Abono internacional de PvZ 2, nivel 1, sin alterar los valores normales de PvZ 1. */
export const ABONO_DIA={
 lanzaguisantes:{cantidad:60,dano:20,duracion:2},
 hielaguisantes:{cantidad:60,dano:20,duracion:3.5},
 repetidora:{cantidad:90,dano:20,duracion:2.5,final:600},
} as const;
export function iniciarRafagaAbono(m:MotorPvZ,p:PlantaPvZ){
 const d=ABONO_DIA[p.tipo as keyof typeof ABONO_DIA];
 p.datos.abonoRestantes=d.cantidad;p.datos.abonoEn=0;p.datos.abonoIntervalo=d.duracion/d.cantidad;
 p.datos.abonoFinalPendiente='final'in d?d.final:0;p.datos.rafagaPendiente=0;
 if(p.tipo==='hielaguisantes')m.crearZonaHielo(p,d.duracion);
}
/** Mantiene el sobrante del reloj: 60 Hz no redondea cada tiro a un número entero de pasos. */
export function pasoRafagaAbono(m:MotorPvZ,p:PlantaPvZ,dt:number){
 if(!m.protegidaPorAbono(p))return false;
 p.datos.abonoEn-=dt;
 const frio=p.tipo==='hielaguisantes';
 while(p.datos.abonoEn<=1e-9&&p.datos.abonoRestantes>0){
  if(!m.disparar(p,20,frio?'hielo':'recto',frio?m.plantasDef[p.tipo].datos!.lento:0))return true;
  p.datos.abonoRestantes--;p.datos.abonoEn+=p.datos.abonoIntervalo;
 }
 if(p.datos.abonoRestantes===0&&p.datos.abonoFinalPendiente>0){
  // La tabla internacional fija 90 × 20 + 600 en 2,5 s; no añadimos una espera de otra edición.
  if(p.datos.abonoEn>1e-9)return true;
  if(!m.disparar(p,p.datos.abonoFinalPendiente,'recto',0,'guisante-grande'))return true;
  p.datos.abonoFinalPendiente=0;
 }
 if(!m.protegidaPorAbono(p)){
  p.vida=m.plantasDef[p.tipo].vida;p.datos.reloj=m.plantasDef[p.tipo].datos?.cada??0;
  m.eventos.push({t:'estado',tipo:'abono-fin',id:p.id,fila:p.fila,x:p.x});
 }
 return true;
}
export function abonarPatatapum(m:MotorPvZ,p:PlantaPvZ){
 const armado=m.plantasDef[p.tipo].datos!.armado;p.edad=Math.max(p.edad,armado);
 const libres=m.casillasParaReproducir(p);
 for(let i=0;i<2&&libres.length;i++){
  const j=m.azar.entero(libres.length),[q]=libres.splice(j,1),copia=m.reproducirPlanta(p,q.fila,q.col);
  if(copia)copia.edad=armado;
 }
}
export function abonarCarnivora(m:MotorPvZ,p:PlantaPvZ){
 const delante=m.zombis.filter(z=>z.vida>0&&!z.hipnotizado&&z.fila===p.fila&&z.x>=p.x-15).sort((a,b)=>a.x-b.x||a.id-b.id);
 for(const z of delante.slice(0,3)){
  if(m.esComestible(z))m.danarZombi(z,z.vida+z.armadura,'aplastar');
  else m.danarZombi(z,1000,'aplastar');
 }
 for(const z of delante)if(z.vida>0){z.x=Math.max(z.x,m.columnas*80-40);z.comiendo=null;}
 p.datos.digiere=0;p.datos.atacaHasta=m.t+.5;
}
