import type {ComportamientoPlantaPvZ} from './index';
import type {MotorPvZ} from '../motor/motor';
import type {PlantaPvZ,ZombiPvZ} from '../tipos';

/** Reglas de PvZ 1 para PC. No registra efectos de abono de versiones distintas. */
const datos=(m:MotorPvZ,p:PlantaPvZ)=>m.plantasDef[p.tipo].datos!;
const consumir=(m:MotorPvZ,p:PlantaPvZ)=>m.danarPlanta(p,p.vida);
const delante=(m:MotorPvZ,p:PlantaPvZ,z:ZombiPvZ,alcance:number)=>
 z.vida>0&&!m.esVolador(z)&&!z.datos.bajoTierra&&!z.hipnotizado&&z.fila===p.fila&&z.x>=p.x-10&&z.x<800&&z.x-p.x<=alcance;
const iniciarDisparo=(m:MotorPvZ,p:PlantaPvZ)=>{p.datos.reloj=m.azar.entre(.15,.45);};

function disparoEspora(m:MotorPvZ,p:PlantaPvZ,dt:number){
 const d=datos(m,p);p.datos.reloj-=dt;
 if(p.datos.reloj<=0&&m.hayBlanco(p,d.alcance)&&m.disparar(p,d.dano,'recto',0,'espora',d.alcance))p.datos.reloj=d.cada;
}

/** Centro original del miedo: borde izquierdo de la casilla y 20 px desde arriba.
 * Los zombis del motor usan puntos de cuerpo, sin las cajas de colisión del ejecutable. */
function hayMiedo(m:MotorPvZ,p:PlantaPvZ){
 const centroX=p.x-40,centroY=m.centroFila(p.fila)-30,radio=datos(m,p).radioMiedo;
 return m.zombis.some(z=>z.vida>0&&!z.hipnotizado&&!z.sinCabeza&&Math.abs(z.fila-p.fila)<=1&&
  Math.hypot(z.x-centroX,m.centroFila(z.fila)-centroY)<=radio);
}

export const COMPORTAMIENTO_NOCHE_PLANTAS:Record<string,ComportamientoPlantaPvZ>={
 'seta-desesporada':{iniciar:iniciarDisparo,paso:disparoEspora},
 'seta-solar':{
  iniciar(m,p){p.datos.reloj=datos(m,p).primero;p.datos.crecida=0;},
  paso(m,p,dt){
   const d=datos(m,p);
   if(!p.datos.crecida&&p.edad+1e-9>=d.crece){p.datos.crecida=1;m.eventos.push({t:'estado',id:p.id,tipo:'crecida',fila:p.fila,x:p.x});}
   p.datos.reloj-=dt;
   if(p.datos.reloj<=0){m.crearSol(p.fila,p.x,p.datos.crecida?d.solGrande:d.solPequeno);p.datos.reloj=d.cada;}
  },
 },
 humoseta:{
  iniciar:iniciarDisparo,
  paso(m,p,dt){
   const d=datos(m,p);p.datos.reloj-=dt;
   if(p.datos.reloj>0||!m.hayBlanco(p,d.alcance))return;
   for(const z of m.zombis)if(delante(m,p,z,d.alcance))m.danarZombi(z,d.dano,'perforante');
   p.datos.reloj=d.cada;p.datos.atacaHasta=m.t+.2;
   m.eventos.push({t:'disparo',id:p.id,tipo:p.tipo,fila:p.fila,x:p.x,cantidad:d.dano,proyectil:'humo'});
  },
 },
 comepiedras:{
  paso(m,p){if(p.edad+1e-9<datos(m,p).retardo)return;m.quitarLapida(p.fila,p.col);consumir(m,p);},
 },
 hipnoseta:{
  paso(){},
  // El primer mordisco consume el hongo despierto. Un daño sin atacante no convierte a nadie.
  alDanar(m,p,_cantidad,origen){
   if(p.dormida||!origen||origen.vida<=0||origen.hipnotizado||p.datos.hipnosisAplicada)return;
   p.datos.hipnosisAplicada=1;p.vida=0;m.aplicarEstado(origen,'hipnotizado');
  },
 },
 'seta-miedica':{
  iniciar(m,p){iniciarDisparo(m,p);p.datos.asustada=0;},
  paso(m,p,dt){
   const asustada=hayMiedo(m,p)?1:0;
   if(p.datos.asustada!==asustada){p.datos.asustada=asustada;m.eventos.push({t:'estado',id:p.id,tipo:asustada?'asustada':'calmada',fila:p.fila,x:p.x});}
   if(asustada){p.datos.reloj=Math.max(0,p.datos.reloj-dt);return;}
   disparoEspora(m,p,dt);
  },
 },
 'seta-congelada':{
  paso(m,p){
   const d=datos(m,p);if(p.edad+1e-9<d.retardo)return;
   for(const z of m.zombis){
    if(z.vida<=0||z.hipnotizado||z.x>=800||m.esVolador(z)||z.datos.bajoTierra||z.datos.pogo)continue;
    // En PC el hielo dura menos sobre un objetivo que ya estaba ralentizado.
    const congelado=z.lento>0?m.azar.entre(d.congeladoFrioMin,d.congeladoFrioMax):m.azar.entre(d.congeladoMin,d.congeladoMax);
    m.danarZombi(z,d.dano,'hielo');
    if((z.datos.saltando??0)<=m.t)m.aplicarEstado(z,'congelado',congelado);
    m.aplicarEstado(z,'lento',d.lento);
   }
   m.helarTablero();consumir(m,p);
  },
 },
 petaseta:{
  paso(m,p){
   const d=datos(m,p);if(p.edad+1e-9<d.retardo)return;
   for(const z of m.zombis)if(z.vida>0&&!z.hipnotizado&&Math.hypot(z.x-p.x,(z.fila-p.fila)*m.altoFila)<=d.radio)m.danarZombi(z,d.dano,'explosion');
   m.eventos.push({t:'explosion',id:p.id,tipo:p.tipo,fila:p.fila,x:p.x});
   consumir(m,p);m.crearCrater(p.fila,p.col,d.crater);
  },
 },
};
