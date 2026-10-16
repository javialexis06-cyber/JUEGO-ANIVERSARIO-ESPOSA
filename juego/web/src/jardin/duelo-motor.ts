import { PLANTAS, ZOMBIS, type IdPlanta, type IdZombi, type NivelJardin } from './datos';
import { MotorJardin } from './motor';

export type Bando = 'plantas' | 'zombis';
export const opuesto = (b:Bando):Bando => b==='plantas'?'zombis':'plantas';
export const DURACION_DUELO=180;
export const PREPARACION_DUELO=20;
export const RECLUTAS = {
 remiendo:{costo:50,recarga:5}, olla:{costo:100,recarga:11}, corredor:{costo:75,recarga:9},
 paraguas:{costo:100,recarga:12}, grandote:{costo:225,recarga:35},
} as const;
export const PATIO_DUELO:NivelJardin={
 id:'duelo',nombre:'Plantas contra zombis',filas:5,oleadas:0,porOleada:0,
 tipos:Object.keys(ZOMBIS) as IdZombi[],plantas:Object.keys(PLANTAS) as IdPlanta[],
 cielo:'#b9d5d4',suelo:'#95b88b',sub:'Dos bandos, un jardín y tres minutos.',
};
export type OrdenDuelo =
 | {tipo:'plantar';planta:IdPlanta;fila:number;col:number}
 | {tipo:'quitar';fila:number;col:number}
 | {tipo:'recoger';id:number}
 | {tipo:'enviar';zombi:IdZombi;fila:number};
export function ordenSegura(v:unknown):v is OrdenDuelo {
 if(!v||typeof v!=='object')return false;const a=v as OrdenDuelo;
 if(a.tipo==='recoger')return Number.isSafeInteger(a.id)&&a.id>0;
 if(!('fila' in a)||!Number.isInteger(a.fila)||a.fila<0||a.fila>=PATIO_DUELO.filas)return false;
 if(a.tipo==='enviar')return typeof a.zombi==='string'&&Object.hasOwn(RECLUTAS,a.zombi);
 if(a.tipo==='quitar'||a.tipo==='plantar')return Number.isInteger(a.col)&&a.col>=0&&a.col<8&&(a.tipo==='quitar'||typeof a.planta==='string'&&Object.hasOwn(PLANTAS,a.planta));
 return false;
}
export interface EstadoDuelo {
 t:number;luces:number;niebla:number;terminado:MotorJardin['terminado'];
 plantas:MotorJardin['plantas'];zombis:MotorJardin['zombis'];semillas:MotorJardin['semillas'];
 soles:MotorJardin['soles'];guardianes:boolean[];recargas:Record<string,number>;reclutas:Record<string,number>;
}
export class MotorDuelo {
 readonly jardin:MotorJardin;
 niebla=150;
 reclutas:Record<string,number>={};
 private nube=4;
 constructor(semilla=23){this.jardin=new MotorJardin(PATIO_DUELO,semilla,{duracion:DURACION_DUELO});}
 ordenar(bando:Bando,a:unknown):boolean {
  if(this.jardin.terminado||!ordenSegura(a))return false;
  if(a.tipo==='enviar'){
   const r=RECLUTAS[a.zombi];
   if(bando!=='zombis'||this.jardin.t<PREPARACION_DUELO||this.niebla<r.costo||(this.reclutas[a.zombi]??0)>0)return false;
   if(!this.jardin.enviarZombi(a.zombi,a.fila))return false;
   this.niebla-=r.costo;this.reclutas[a.zombi]=r.recarga;return true;
  }
  if(bando!=='plantas')return false;
  if(a.tipo==='plantar')return this.jardin.plantar(a.planta,a.fila,a.col);
  if(a.tipo==='quitar')return this.jardin.quitar(a.fila,a.col);
  return this.jardin.recoger(a.id);
 }
 paso(){
  if(this.jardin.terminado)return;
  const dt=this.jardin.pasoFijo;
  for(const k of Object.keys(this.reclutas))this.reclutas[k]=Math.max(0,this.reclutas[k]-dt);
  this.nube-=dt;if(this.nube<=0){this.niebla=Math.min(600,this.niebla+20);this.nube+=4;}
  this.jardin.paso();
 }
 estado():EstadoDuelo {
  const m=this.jardin;
  return structuredClone({t:m.t,luces:m.luces,niebla:this.niebla,terminado:m.terminado,plantas:m.plantas,zombis:m.zombis,
   semillas:m.semillas,soles:m.soles,guardianes:m.guardianes,recargas:m.recargas,reclutas:this.reclutas});
 }
}
