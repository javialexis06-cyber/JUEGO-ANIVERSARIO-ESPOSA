import type {ComportamientoZombiPvZ} from './index';
import type {MotorPvZ} from '../motor/motor';
import type {ZombiPvZ} from '../tipos';
const evento=(m:MotorPvZ,z:ZombiPvZ,tipo:string,duracion?:number)=>m.eventos.push({t:'estado',id:z.id,tipo,fila:z.fila,x:z.x,duracion});
/** Equipo especial: no reduce vida corporal y no convierte al enemigo. */
export function quitarEquipoMetalico(m:MotorPvZ,z:ZombiPvZ){
 if(z.datos.caja&&!z.datos.cajaAbriendo){z.datos.caja=0;evento(m,z,'sin-caja');return true;}
 if(z.datos.pico){z.datos.pico=0;z.datos.sinPico=1;
  if(z.datos.bajoTierra){z.datos.pausaPicoHasta=m.t+2;z.datos.emergiendoHasta=m.t+3.3;z.datos.ignoraMordida=1;}
  evento(m,z,'sin-pico',z.datos.bajoTierra?3.3:0);return true;
 }
 if(z.datos.pogo){z.datos.pogo=0;z.datos.ignoraMordida=0;z.datos.velocidad=m.zombisDef[z.tipo].datos?.velocidadSinPogo??80/4.7;evento(m,z,'sin-pogo');return true;}
 return false;
}
export function pincharGloboPvZ(m:MotorPvZ,z:ZombiPvZ){
 if(!z.datos.volando)return false;z.datos.volando=0;z.datos.sinGlobo=1;z.datos.ignoraMordida=0;z.armadura=0;z.datos.velocidad=m.zombisDef[z.tipo].datos?.velocidadTierra??80/4.7;
 evento(m,z,'globo-pinchado');if(m.esAgua(z.fila))m.danarZombi(z,z.vida,'aplastar');return true;
}
const cajita:ComportamientoZombiPvZ={
 iniciar(m,z){z.datos.caja=1;const distancia=450+m.azar.entero(300),temprana=m.azar.entero(20)===0;z.datos.temporizadorCaja=m.nivel.minijuego==='rompejarrones'?.1:Math.floor((temprana?Math.floor(distancia/3):distancia)/.67)*2/100;},
 quitarMetal:quitarEquipoMetalico,
 paso(m,z,dt){
  if(!z.datos.caja)return;
  z.datos.temporizadorCaja-=dt;
  if(!z.datos.cajaAbriendo&&z.datos.temporizadorCaja<=1e-9){z.datos.cajaAbriendo=1;z.datos.temporizadorCaja=1.1;evento(m,z,'caja-abriendo',1.1);}
  if(!z.datos.cajaAbriendo)return;
  z.comiendo=null;if(z.datos.temporizadorCaja>1e-9)return false;
  z.datos.caja=0;
  if(!z.hipnotizado)for(const p of [...m.plantas])if(p.vida>0&&Math.hypot(p.x-z.x,m.centroFila(p.fila)-m.centroFila(z.fila))<=90)m.destruirPlanta(p);
  for(const otro of [...m.zombis])if(otro!==z&&otro.vida>0&&otro.hipnotizado!==z.hipnotizado&&Math.abs(otro.fila-z.fila)<=1&&Math.hypot(otro.x-z.x,m.centroFila(otro.fila)-m.centroFila(z.fila))<=115)m.danarZombi(otro,otro.vida+otro.armadura,'explosion');
  m.eventos.push({t:'explosion',tipo:'cajita',id:z.id,fila:z.fila,x:z.x});m.danarZombi(z,z.vida+z.armadura,'aplastar');m.romperJarronesCerca(z.fila,Math.floor(z.x/80));return false;
 },
};
const globo:ComportamientoZombiPvZ={
 iniciar(m,z){z.datos.volando=1;z.datos.ignoraMordida=1;z.datos.velocidad=m.azar.entre(m.zombisDef[z.tipo].datos?.velocidadVueloMin??23,m.zombisDef[z.tipo].datos?.velocidadVueloMax??32);},
 pincharGlobo:pincharGloboPvZ,
};
const minero:ComportamientoZombiPvZ={
 iniciar(_m,z){z.datos.bajoTierra=1;z.datos.pico=1;z.datos.ignoraMordida=1;},
 quitarMetal:quitarEquipoMetalico,
 paso(m,z){
  if(!z.datos.bajoTierra)return;
  if(z.datos.pausaPicoHasta){
   if(m.t<z.datos.pausaPicoHasta)return false;
   if(m.t<z.datos.emergiendoHasta)return false;
   z.datos.bajoTierra=0;z.datos.ignoraMordida=0;z.datos.emergiendoHasta=0;z.datos.velocidad=80/4.7;evento(m,z,'minero-sin-pico');return;
  }
  if(z.x>10&&!z.datos.emergiendoHasta)return;
  if(!z.datos.emergiendoHasta){z.datos.emergiendoHasta=m.t+1.3;evento(m,z,'minero-emerge',1.3);return false;}
  if(m.t+1e-9<z.datos.emergiendoHasta)return false;
  z.datos.bajoTierra=0;z.datos.ignoraMordida=0;z.datos.emergiendoHasta=0;z.datos.mareoHasta=m.t+3.5;z.datos.reversa=1;z.sentido=1;z.datos.velocidad=m.zombisDef[z.tipo].datos?.velocidadRegreso??12;evento(m,z,'minero-mareado',3.5);return false;
 },
};
const pogo:ComportamientoZombiPvZ={
 iniciar(m,z){z.datos.pogo=1;z.datos.ignoraMordida=1;z.datos.reboteHasta=m.t+m.azar.entre(0,.8);},
 quitarMetal:quitarEquipoMetalico,
 paso(m,z){
  if(!z.datos.pogo)return;
  const muro=m.plantas.find(p=>p.vida>0&&p.fila===z.fila&&m.plantasDef[p.tipo].datos?.bloqueaSalto&&z.x-p.x>=0&&z.x-p.x<70);
  if(muro){quitarEquipoMetalico(m,z);z.x=Math.max(z.x,muro.x+30);return;}
  if(m.t>=z.datos.reboteHasta){z.datos.reboteHasta=m.t+.8;evento(m,z,'pogo-rebota',.8);}
 },
};
export const COMPORTAMIENTO_NIEBLA_ZOMBIS:Record<string,ComportamientoZombiPvZ>={'zombi-cajita':cajita,'zombi-globo':globo,'zombi-minero':minero,'zombi-pogo':pogo};
