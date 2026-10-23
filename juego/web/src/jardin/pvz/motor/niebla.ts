import type {MotorPvZ} from './motor';
import type {DefNivel,NieblaPvZ,TormentaPvZ} from '../tipos';
import {exigirPvZ,numeroPvZ} from './validacion';
export interface InstantaneaVisibilidadPvZ {vientoHasta:number;contador:number;variante:1|2|3}
/** Estado funcional de visibilidad. La vista decide transparencias, destellos y dibujo. */
export class VisibilidadPvZ {
 private vientoHasta=0;private contador=1;private variante:1|2|3=2;
 constructor(private nivel:DefNivel){}
 exportar():InstantaneaVisibilidadPvZ{return{vientoHasta:this.vientoHasta,contador:this.contador,variante:this.variante};}
 restaurar(e:InstantaneaVisibilidadPvZ){exigirPvZ(e&&numeroPvZ(e.vientoHasta)&&e.vientoHasta>=0&&numeroPvZ(e.contador)&&e.contador>0&&[1,2,3].includes(e.variante),'Visibilidad inválida');this.vientoHasta=e.vientoHasta;this.contador=e.contador;this.variante=e.variante;}
 soplar(m:MotorPvZ){this.vientoHasta=m.t+40;}
 iluminada(m:MotorPvZ,fila:number,col:number,soloPlanterna=false){
  return m.plantas.some(p=>p.vida>0&&!p.dormida&&(p.tipo==='planterna'&&Math.abs(p.fila-fila)<=2&&Math.abs(p.col-col)<=3&&Math.abs(p.fila-fila)+Math.abs(p.col-col)<5||!soloPlanterna&&p.tipo==='plantorcha'&&Math.abs(p.fila-fila)+Math.abs(p.col-col)<=1));
 }
 paso(m:MotorPvZ,dt:number){
  if(!this.nivel.tormenta)return;this.contador-=dt;
  if(this.contador<=1e-9){const max=m.azar.entero(2)===0?4:7.5;this.contador=1.5+m.azar.entre(3,max);this.variante=(m.azar.entero(3)+1) as 1|2|3;m.eventos.push({t:'estado',tipo:'relampago-ciclo',cantidad:this.variante,duracion:this.contador});}
 }
 estadoNiebla(m:MotorPvZ):NieblaPvZ|undefined{
  if(this.nivel.niebla===undefined||this.nivel.tormenta)return undefined;
  const retirada=Math.max(0,this.vientoHasta-m.t),max=Math.max(0,1065-this.nivel.niebla*80);
  const desplazamiento=retirada>=20?max:max*(retirada/20)**2;
  const claras:[number,number][]=[];for(const fila of m.nivel.filas)for(let col=0;col<9;col++)if(this.iluminada(m,fila,col))claras.push([fila,col]);
  return{desde:this.nivel.niebla,desplazamiento,retirada,claras};
 }
 estadoTormenta():TormentaPvZ|undefined{
  if(!this.nivel.tormenta)return undefined;
  // Intensidad base de PC, sin el parpadeo ni la capa blanca que corresponden al dibujo.
  const contador=this.variante===2?this.contador/2:this.contador;
  let claridad=0;
  if(this.variante===1&&contador>1.5&&contador<=3)claridad=(contador-1.5)/1.5;
  else if(contador<=1.5)claridad=contador/1.5*(this.variante===1?92/255:1);
  return{variante:this.variante,restante:this.contador,claridad:Math.max(0,Math.min(1,claridad))};
 }
}
