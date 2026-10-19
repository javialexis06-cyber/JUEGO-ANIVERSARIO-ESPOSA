import type {ComportamientoPlantaPvZ,ComportamientoZombiPvZ} from './index';
import type {MotorPvZ} from '../motor/motor';
import type {PlantaPvZ} from '../tipos';
const disparadora:ComportamientoPlantaPvZ={
 iniciar(m,p){p.datos.reloj=m.azar.entre(.15,.45);},
 paso(m,p,dt){const d=m.plantasDef[p.tipo].datos!;p.datos.reloj-=dt;
  if(p.datos.rafagaPendiente>0){p.datos.rafagaEn-=dt;if(p.datos.rafagaEn<=0){m.disparar(p,d.dano,d.lento?'hielo':'recto',d.lento);p.datos.rafagaPendiente--;p.datos.rafagaEn=.1;}}
  if(p.datos.abonoRestantes>0){p.datos.abonoEn-=dt;if(p.datos.abonoEn<=0){m.disparar(p,20);p.datos.abonoEn=.05;p.datos.abonoRestantes--;}return;}
  if(p.datos.reloj<=0&&m.hayBlanco(p)){m.disparar(p,d.dano,d.lento?'hielo':'recto',d.lento);p.datos.reloj=d.cada;if(d.rafaga){p.datos.rafagaPendiente=d.rafaga-1;p.datos.rafagaEn=.1;}}
 },
 // Regla de abono de la adaptación 1+2; nunca concede cargas por iniciar una partida.
 abono(m,p){p.datos.abonoRestantes=60;p.datos.abonoEn=0;},
};
function consumir(m:MotorPvZ,p:PlantaPvZ){m.danarPlanta(p,p.vida);}
export const COMPORTAMIENTO_DIA_PLANTAS:Record<string,ComportamientoPlantaPvZ>={
 lanzaguisantes:disparadora,hielaguisantes:{...disparadora,abono:undefined},repetidora:{...disparadora,abono:undefined},
 girasol:{iniciar(m,p){p.datos.reloj=m.plantasDef[p.tipo].datos!.primero;},paso(m,p,dt){p.datos.reloj-=dt;if(p.datos.reloj<=0){m.crearSol(p.fila,p.x);p.datos.reloj=m.plantasDef[p.tipo].datos!.cada;}},abono(m,p){m.crearSol(p.fila,p.x,150);}},
 petacereza:{paso(m,p){if(p.edad>=m.plantasDef[p.tipo].datos!.retardo){m.explosion(p.fila,p.x,1800);consumir(m,p);}}},
 nuez:{paso(){},abono(m,p){p.vida=m.plantasDef[p.tipo].vida;p.datos.abonoEscudo=8000;}},
 patatapum:{paso(m,p){if(p.edad<14)return;const z=m.zombis.find(z=>z.vida>0&&!z.hipnotizado&&z.fila===p.fila&&Math.abs(z.x-p.x)<35);if(z){m.explosion(p.fila,p.x,1800,0,40);consumir(m,p);}}},
 'planta-carnivora':{paso(m,p,dt){p.datos.digiere=Math.max(0,(p.datos.digiere??0)-dt);if(p.datos.digiere>0)return;const z=m.zombis.filter(z=>z.vida>0&&!z.hipnotizado&&!z.sinCabeza&&z.fila===p.fila&&z.x>=p.x-15&&z.x-p.x<90).sort((a,b)=>a.x-b.x)[0];if(z){m.danarZombi(z,999999,'aplastar');p.datos.digiere=42;p.datos.atacaHasta=m.t+.5;}}},
};
export const COMPORTAMIENTO_DIA_ZOMBIS:Record<string,ComportamientoZombiPvZ>={
 saltador:{paso(m,z){if(z.datos.saltoUsado||z.hipnotizado)return;const p=m.plantas.filter(p=>p.vida>0&&p.fila===z.fila&&z.x-p.x>=0&&z.x-p.x<70).sort((a,b)=>b.x-a.x)[0];if(!p)return;z.datos.saltoUsado=1;z.datos.velocidad=m.zombisDef[z.tipo].datos!.velocidadSinPertiga;z.datos.saltando=m.t+.8;z.x=p.x-42;z.comiendo=null;m.eventos.push({t:'estado',id:z.id,tipo:'salta',fila:z.fila,x:z.x});}},
};
