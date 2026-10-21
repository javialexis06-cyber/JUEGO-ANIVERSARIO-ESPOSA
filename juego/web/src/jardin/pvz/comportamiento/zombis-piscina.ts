import type {ComportamientoZombiPvZ} from './index';
import type {MotorPvZ} from '../motor/motor';
import type {ZombiPvZ} from '../tipos';

/** Segundos y distancias funcionales del PC; no contienen recursos ni relojes de animación. */
export const TIEMPOS_ZOMBIS_PISCINA={saltoDelfin:1.2,choqueTrineo:1.5,separacionTrineo:50,colaZomboni:60} as const;
function evento(m:MotorPvZ,z:ZombiPvZ,tipo:string){m.eventos.push({t:'estado',id:z.id,tipo,fila:z.fila,x:z.x});}
function comiendoCerca(m:MotorPvZ,z:ZombiPvZ){
 if(z.hipnotizado)return m.zombis.some(v=>v!==z&&v.vida>0&&!v.hipnotizado&&v.fila===z.fila&&Math.abs(v.x-z.x)<35);
 return m.plantas.some(p=>p.vida>0&&p.fila===z.fila&&Math.abs(p.x-z.x)<35)||m.zombis.some(v=>v!==z&&v.vida>0&&v.hipnotizado&&v.fila===z.fila&&Math.abs(v.x-z.x)<35);
}
const buzo:ComportamientoZombiPvZ={
 iniciar(m,z){z.datos.sumergido=m.esAgua(z.fila)&&z.x<=720&&z.x>25?1:0;},
 alDanar(m,z){if(z.vida>0&&z.datos.sumergido&&z.vida<(z.datos.vidaMaxima??m.zombisDef[z.tipo].vida)/3)m.danarZombi(z,z.vida,'aplastar');},
 paso(m,z){
  if(z.datos.zampalga){z.comiendo=null;return false;}
  const sumergido=m.esAgua(z.fila)&&z.x<=720&&z.x>25&&!comiendoCerca(m,z)?1:0;
  if(sumergido!==z.datos.sumergido){z.datos.sumergido=sumergido;evento(m,z,sumergido?'buzo-se-sumerge':'buzo-emerge');}
 },
};
const delfin:ComportamientoZombiPvZ={
 iniciar(_m,z){z.datos.montado=1;z.datos.delfinEnAgua=0;},
 paso(m,z){
  if(z.datos.zampalga){z.comiendo=null;return false;}
  if(z.datos.saltoPendiente){
   if(z.datos.saltando>m.t){z.comiendo=null;return false;}
   z.datos.saltoPendiente=0;z.datos.montado=0;z.datos.ignoraMordida=0;
   z.datos.velocidad=m.zombisDef[z.tipo].datos?.velocidadSinDelfin??30;
   evento(m,z,'delfin-abandonado');
  }
  if(!z.datos.montado||z.hipnotizado)return;
  if(!z.datos.delfinEnAgua){
   if(z.x>720)return;
   // La entrada deja atrás la última columna: no permite gastar el salto sobre su Nenúfar.
   z.datos.delfinEnAgua=1;z.x-=70;evento(m,z,'delfin-entra');
  }
  const p=m.plantas.filter(p=>p.vida>0&&p.fila===z.fila&&p.tipo!=='zampalga'&&z.x-p.x>=0&&z.x-p.x<70).sort((a,b)=>b.x-a.x||Number(b.tipo==='nuez-alta')-Number(a.tipo==='nuez-alta'))[0];
  if(!p)return;
  z.datos.saltoPendiente=1;z.datos.saltando=m.t+TIEMPOS_ZOMBIS_PISCINA.saltoDelfin;
  z.datos.ignoraMordida=1;z.datos.velocidad=0;z.comiendo=null;
  if(p.tipo==='nuez-alta'){
   z.x=p.x+30;evento(m,z,'delfin-bloqueado');
  }else{
   z.x=p.x-42;evento(m,z,'delfin-salta');
  }
  return false;
 },
};
const zomboni:ComportamientoZombiPvZ={
 iniciar(_m,z){z.datos.vehiculo=1;z.datos.ignoraMordida=1;},
 paso(m,z){
  const d=m.zombisDef[z.tipo],max=d.velocidad,min=d.datos?.velocidadMinima??10;
  z.datos.velocidad=min+(max-min)*Math.max(0,Math.min(1,(z.x-400)/300));
  m.aplastarPlantas(z.fila,z.x,40);
  const desde=z.x+TIEMPOS_ZOMBIS_PISCINA.colaZomboni;
  if(desde<800)m.crearPistaHielo(z.fila,Math.max(0,desde));
 },
};
function miembros(m:MotorPvZ,z:ZombiPvZ){const lider=z.datos.liderTrineo||z.id;return m.zombis.filter(v=>v.tipo==='zombi-trineo'&&(v.id===lider||v.datos.liderTrineo===lider)&&v.vida>0);}
function terminarTrineo(m:MotorPvZ,z:ZombiPvZ){
 for(const v of miembros(m,z)){
  v.datos.enTrineo=0;v.datos.vehiculo=0;v.datos.ignoraMordida=0;v.datos.intocableTrineo=0;v.datos.choqueTrineoHasta=0;v.datos.liderTrineo=0;
  v.armadura=0;v.datos.velocidad=m.zombisDef[v.tipo].datos?.velocidadSinTrineo??80/4.7;
 }
 evento(m,z,'trineo-abandonado');
}
function chocar(m:MotorPvZ,z:ZombiPvZ){
 if(!z.datos.enTrineo||z.datos.choqueTrineoHasta)return;
 for(const v of miembros(m,z)){
  v.datos.choqueTrineoHasta=m.t+TIEMPOS_ZOMBIS_PISCINA.choqueTrineo;
  v.datos.velocidad=0;v.datos.intocableTrineo=v.datos.liderTrineo?1:0;v.comiendo=null;
 }
 evento(m,z,'trineo-roto');
}
const trineo:ComportamientoZombiPvZ={
 iniciar(_m,z){z.datos.enTrineo=1;z.datos.vehiculo=1;z.datos.ignoraMordida=1;},
 paso(m,z,dt){
  if(!z.datos.enTrineo)return;
  if(z.datos.liderTrineo){
   const lider=m.zombis.find(v=>v.id===z.datos.liderTrineo&&v.vida>0);
   if(!lider){terminarTrineo(m,z);return;}
   if(lider.datos.enTrineo){z.x=lider.x+z.datos.huecoTrineo*TIEMPOS_ZOMBIS_PISCINA.separacionTrineo;z.comiendo=null;return false;}
   terminarTrineo(m,lider);return;
  }
  if(!z.datos.grupoTrineoCreado){
   z.datos.grupoTrineoCreado=1;
   for(let hueco=1;hueco<=3;hueco++){
    const x=z.x+hueco*TIEMPOS_ZOMBIS_PISCINA.separacionTrineo,nuevo=m.crearZombi(z.tipo,z.fila,Math.min(900,x),z.oleada);
    if(!nuevo)continue;
    nuevo.x=x;nuevo.armadura=0;nuevo.armaduraInicial=0;nuevo.datos.liderTrineo=z.id;nuevo.datos.huecoTrineo=hueco;nuevo.datos.intocableTrineo=1;
    if(z.hipnotizado)m.aplicarEstado(nuevo,'hipnotizado');
   }
   evento(m,z,'trineo-equipo');
  }
  if(z.datos.choqueTrineoHasta){
   if(m.t+1e-9>=z.datos.choqueTrineoHasta)terminarTrineo(m,z);
   else{z.comiendo=null;return false;}
   return;
  }
  const pista=m.pistaHielo(z.fila);
  if(pista)pista.vida=Math.max(pista.vida,5);
  // Fuera de su pista, el patín pierde 600 puntos por segundo: rompe 300 en medio segundo.
  if(!pista||z.x+10<pista.desde)m.danarZombi(z,600*dt,'recto');
  if(z.vida<=0||z.datos.choqueTrineoHasta)return false;
 },
 alDanar(m,z){if(z.vida>0&&z.datos.enTrineo&&!z.datos.liderTrineo&&z.armadura===0)chocar(m,z);},
 alMorir(m,z){
  if(!z.datos.enTrineo)return;
  // Un impacto que destruye el vehículo elimina a sus ocupantes; el grupo se suelta al terminar el choque.
  for(const v of miembros(m,z))if(v!==z){v.datos.intocableTrineo=0;v.datos.enTrineo=0;m.danarZombi(v,v.vida+v.armadura,'aplastar');}
 },
};
export const COMPORTAMIENTO_PISCINA_ZOMBIS:Record<string,ComportamientoZombiPvZ>={
 'zombi-flotador':{},'caracono-flotador':{},'caracubo-flotador':{},
 'zombi-buzo':buzo,zomboni,'zombi-trineo':trineo,'zombi-delfin':delfin,
};
