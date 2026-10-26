import type {ComportamientoPlantaPvZ} from './index';
import type {MotorPvZ} from '../motor/motor';
import type {PlantaPvZ,ZombiPvZ} from '../tipos';

const datos=(m:MotorPvZ,p:PlantaPvZ)=>m.plantasDef[p.tipo].datos!;
const iniciarDisparo=(m:MotorPvZ,p:PlantaPvZ)=>{p.datos.reloj=m.azar.entre(.15,.45);};
const enemigo=(z:ZombiPvZ)=>z.vida>0&&!z.hipnotizado&&!z.sinCabeza;
const blanco=(m:MotorPvZ,p:PlantaPvZ,atras=false,aereo=false)=>m.zombis.some(z=>enemigo(z)&&
 z.fila===p.fila&&z.x<800&&m.puedeRecibirProyectil(z,'recto',aereo)&&
 (atras?z.x<=p.x+10:z.x>=p.x-10));
const consumir=(m:MotorPvZ,p:PlantaPvZ)=>m.danarPlanta(p,p.vida);

/** Cinco rayos de PC: izquierda, verticales y dos diagonales de treinta grados hacia delante. */
function vectoresEstrella(velocidad:number){
 const x=Math.cos(Math.PI/6)*velocidad,y=Math.sin(Math.PI/6)*velocidad;
 return [[-velocidad,0],[0,velocidad],[0,-velocidad],[x,y],[x,-y]] as const;
}
/** Predicción con puntos de cuerpo: el dibujo no decide cuándo se dispara. */
function estrellaTieneBlanco(m:MotorPvZ,p:PlantaPvZ){
 if((p.datos.comidaHasta??0)>m.t)return true;
 const velocidad=datos(m,p).velocidad;
 return m.zombis.some(z=>{
  if(!enemigo(z)||z.x>=800||!m.puedeRecibirProyectil(z))return false;
  if(z.fila===p.fila)return z.x<p.x;
  const dy=m.centroFila(z.fila)-m.centroFila(p.fila);
  const vz=z.comiendo||z.congelado||z.mantequilla?0:z.sentido*(z.datos.velocidad??m.zombisDef[z.tipo].velocidad)*(z.lento>0?.5:1);
  return vectoresEstrella(velocidad).some(([vx,vy])=>{
   const dx=z.x-(p.x+(vx>0?30:vx<0?-30:0));
   const rx=vz-vx,ry=-vy,t=-(dx*rx+dy*ry)/(rx*rx+ry*ry||1);
   return t>=0&&t<=4&&Math.hypot(dx+rx*t,dy+ry*t)<=18;
  });
 });
}
function tieneMetal(m:MotorPvZ,z:ZombiPvZ){
 if(!enemigo(z)||(z.datos.emergeHasta??0)>m.t||m.esVolador(z))return false;
 if(z.tipo==='zombi-cajita')return !!z.datos.caja&&!z.datos.cajaAbriendo;
 if(z.tipo==='zombi-minero')return !!z.datos.pico;
 if(z.tipo==='zombi-pogo')return !!z.datos.pogo;
 return z.armadura>0&&z.metal;
}

/** Plantas de la primera aventura de PC. Sus efectos de abono requieren una verificación aparte. */
export const COMPORTAMIENTO_NIEBLA_PLANTAS:Record<string,ComportamientoPlantaPvZ>={
 marseta:{
  iniciar:iniciarDisparo,
  paso(m,p,dt){const d=datos(m,p);p.datos.reloj-=dt;if(p.datos.reloj<=0&&m.hayBlanco(p,d.alcance)&&m.disparar(p,d.dano,'recto',0,'espora',d.alcance))p.datos.reloj=d.cada;},
 },
 // Iluminación y capa protectora se resuelven con el terreno y las colisiones comunes.
 planterna:{paso(){}},
 calabaza:{paso(){}},
 cactus:{
  iniciar(m,p){iniciarDisparo(m,p);p.datos.alto=0;},
  paso(m,p,dt){
   const d=datos(m,p),alto=blanco(m,p,false,true)?1:0;
   if(alto!==p.datos.alto){p.datos.alto=alto;m.eventos.push({t:'estado',id:p.id,tipo:alto?'cactus-alto':'cactus-bajo',fila:p.fila,x:p.x});}
   p.datos.reloj-=dt;
   if(p.datos.reloj<=0&&blanco(m,p,false,!!alto)&&m.dispararVector(p,d.dano,330,0,'pincho',!!alto))p.datos.reloj=d.cada;
  },
 },
 trebolador:{
  paso(m,p){
   const d=datos(m,p);
   if(!p.datos.soplo&&p.edad+1e-9>=d.retardo){m.soplar(p);p.datos.soplo=1;}
   if(p.edad+1e-9>=d.desaparece)consumir(m,p);
  },
 },
 bipetidora:{
  iniciar(m,p){p.datos.relojFrente=m.azar.entre(.15,.45);p.datos.relojAtras=p.datos.relojFrente;p.datos.rafagaPendiente=0;},
  paso(m,p,dt){
   const d=datos(m,p);p.datos.relojFrente-=dt;p.datos.relojAtras-=dt;
   if(p.datos.rafagaPendiente){p.datos.rafagaEn-=dt;if(p.datos.rafagaEn<=0&&m.dispararVector(p,d.dano,-330,0,'guisante'))p.datos.rafagaPendiente=0;}
   if(p.datos.relojFrente<=0&&blanco(m,p)&&m.disparar(p,d.dano))p.datos.relojFrente=d.cada;
   if(p.datos.relojAtras<=0&&blanco(m,p,true)&&m.dispararVector(p,d.dano,-330,0,'guisante')){
    p.datos.relojAtras=d.cada;p.datos.rafagaPendiente=1;p.datos.rafagaEn=d.intervaloRafaga;
   }
  },
 },
 frustrella:{
  iniciar:iniciarDisparo,
  paso(m,p,dt){
   const d=datos(m,p);p.datos.reloj-=dt;if(p.datos.reloj>0||!estrellaTieneBlanco(m,p)||m.proyectiles.length+5>500)return;
   for(const [vx,vy]of vectoresEstrella(d.velocidad))m.dispararVector(p,d.dano,vx,vy,'estrella');
   p.datos.reloj=d.cada;
  },
  alDanar(m,p,_cantidad,origen){if(origen&&!origen.hipnotizado)p.datos.comidaHasta=m.t+.5;},
 },
 magnetoseta:{
  iniciar(_m,p){p.datos.carga=0;},
  paso(m,p,dt){
   p.datos.carga=Math.max(0,p.datos.carga-dt);if(p.datos.carga>0)return;
   const d=datos(m,p),centroY=m.centroFila(p.fila)-30;
   const candidatos=m.zombis.filter(z=>tieneMetal(m,z)&&Math.abs(z.fila-p.fila)<=2&&z.x<800&&
    Math.hypot(z.x-(p.x-40),m.centroFila(z.fila)-centroY)<=(z.comiendo!==null?d.radioComiendo:d.radio));
   const distancia=(z:ZombiPvZ)=>Math.hypot(z.x-p.x,(z.fila-p.fila)*m.altoFila)+Math.abs(z.fila-p.fila)*80;
   candidatos.sort((a,b)=>distancia(a)-distancia(b)||a.id-b.id);
   for(const z of candidatos)if(m.quitarMetal(z)){p.datos.carga=d.cada;p.datos.objeto=z.id;m.eventos.push({t:'estado',id:p.id,tipo:'iman-cargando',origen:z.id,fila:p.fila,x:p.x,duracion:d.cada});return;}
   // PC: sin metal en zombis, retira la escalera más cercana a dos casillas o menos.
   const escalera=m.plantas.filter(q=>q.vida>0&&q.datos.escalera&&Math.max(Math.abs(q.col-p.col),Math.abs(q.fila-p.fila))<=2)
    .sort((a,b)=>Math.max(Math.abs(a.col-p.col),Math.abs(a.fila-p.fila))+Math.abs(a.fila-p.fila)*.05-(Math.max(Math.abs(b.col-p.col),Math.abs(b.fila-p.fila))+Math.abs(b.fila-p.fila)*.05)||a.id-b.id)[0];
   if(escalera&&m.quitarEscalera(escalera.fila,escalera.col)){p.datos.carga=d.cada;m.eventos.push({t:'estado',id:p.id,tipo:'iman-cargando',fila:p.fila,x:p.x,duracion:d.cada});}
  },
 },
};
