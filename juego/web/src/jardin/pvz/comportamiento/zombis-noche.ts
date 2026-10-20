import type {ComportamientoZombiPvZ} from './index';
import type {MotorPvZ} from '../motor/motor';
import type {ZombiPvZ} from '../tipos';

/** Tiempos funcionales PC GOTY. No dependen del reloj de dibujo ni de sus recursos. */
export const TIEMPOS_ZOMBIS_NOCHE={
 sorpresaPeriodico:13/8,
 entradaBailon:3*80,
 senalar:9/24,
 esperaInvocacion:2,
 emerger:1.5,
 reponer:1,
 cicloBaile:4.6,
 marchaBaile:2.4,
} as const;
const BAILON='zombi-bailon',ACOMPANANTE='zombi-acompanante';
const HUECOS:ReadonlyArray<readonly [number,number]>=[[-1,0],[1,0],[0,-80],[0,80]];
function evento(m:MotorPvZ,z:ZombiPvZ,tipo:string){m.eventos.push({t:'estado',id:z.id,tipo,fila:z.fila,x:z.x});}
function vivo(z:ZombiPvZ){return z.vida>0&&!z.sinCabeza;}
function liderDe(m:MotorPvZ,z:ZombiPvZ){
 if(z.tipo===BAILON)return z;
 return m.zombis.find(v=>v.id===z.datos.lider&&v.tipo===BAILON&&vivo(v)&&v.hipnotizado===z.hipnotizado);
}
function seguidores(m:MotorPvZ,lider:ZombiPvZ){return m.zombis.filter(z=>z.tipo===ACOMPANANTE&&vivo(z)&&z.datos.lider===lider.id&&z.hipnotizado===lider.hipnotizado);}
function separar(m:MotorPvZ,lider:ZombiPvZ){
 for(const z of m.zombis)if(z.tipo===ACOMPANANTE&&z.datos.lider===lider.id){z.datos.lider=0;z.datos.hueco=-1;}
}
function tieneBlancoCerca(m:MotorPvZ,z:ZombiPvZ){
 if(z.hipnotizado)return m.zombis.some(v=>v!==z&&vivo(v)&&!v.hipnotizado&&v.fila===z.fila&&Math.abs(v.x-z.x)<35);
 return m.plantas.some(p=>p.vida>0&&p.fila===z.fila&&Math.abs(p.x-z.x)<35)||m.zombis.some(v=>v!==z&&vivo(v)&&v.hipnotizado&&v.fila===z.fila&&Math.abs(v.x-z.x)<35);
}
function casillasInvocacion(m:MotorPvZ,z:ZombiPvZ){
 return HUECOS.map(([df,dx],hueco)=>({fila:z.fila+df,x:z.x+dx,hueco})).filter(v=>m.nivel.filas.includes(v.fila)&&!m.nivel.filasAgua?.includes(v.fila)&&v.x>=-60&&v.x<=900);
}
function faltan(m:MotorPvZ,z:ZombiPvZ){const presentes=seguidores(m,z);return casillasInvocacion(m,z).some(v=>!presentes.some(a=>a.datos.hueco===v.hueco));}
function invocar(m:MotorPvZ,z:ZombiPvZ){
 const presentes=seguidores(m,z);
 for(const c of casillasInvocacion(m,z)){
  if(presentes.some(v=>v.datos.hueco===c.hueco))continue;
  const nuevo=m.crearZombi(ACOMPANANTE,c.fila,c.x,z.oleada);if(!nuevo)continue;
  nuevo.datos.lider=z.id;nuevo.datos.hueco=c.hueco;nuevo.datos.emergeHasta=m.t+TIEMPOS_ZOMBIS_NOCHE.emerger;
  if(z.hipnotizado)m.aplicarEstado(nuevo,'hipnotizado');
  evento(m,nuevo,'acompanante-emerge');
 }
 z.datos.esperaHasta=m.t+TIEMPOS_ZOMBIS_NOCHE.esperaInvocacion;z.datos.reponerEn=0;
 evento(m,z,'bailon-invoca');
}
function senalar(m:MotorPvZ,z:ZombiPvZ){z.datos.senalando=TIEMPOS_ZOMBIS_NOCHE.senalar;z.datos.faseBaile=1;evento(m,z,'bailon-senala');}
/** El frío del grupo afecta al avance, no a las mordidas de compañeros sin frío propio. */
function prepararMarcha(m:MotorPvZ,z:ZombiPvZ){
 const lider=liderDe(m,z),grupo=lider?[lider,...seguidores(m,lider)]:[z];
 const fase=(m.t+1e-9)%TIEMPOS_ZOMBIS_NOCHE.cicloBaile;
 const parado=fase>=TIEMPOS_ZOMBIS_NOCHE.marchaBaile||grupo.some(v=>v.congelado>0||v.mantequilla>0||v.datos.emergeHasta>m.t||v.datos.senalando>0||v.datos.esperaHasta>m.t||tieneBlancoCerca(m,v));
 const lento=grupo.some(v=>v.lento>0);
 // Las definiciones expresan la velocidad media, incluida la pausa del baile.
 const marcha=m.zombisDef[z.tipo].velocidad*TIEMPOS_ZOMBIS_NOCHE.cicloBaile/TIEMPOS_ZOMBIS_NOCHE.marchaBaile;
 z.datos.velocidad=parado?0:marcha*(lento?.5:1)/(z.lento>0?.5:1);
}
const periodico:ComportamientoZombiPvZ={
 iniciar(_m,z){z.datos.periodicoEntero=z.armadura>0?1:0;},
 alDanar(m,z){
  if(z.vida<=0||!z.datos.periodicoEntero||z.armadura>0)return;
  z.datos.periodicoEntero=0;z.datos.enfadoPendiente=TIEMPOS_ZOMBIS_NOCHE.sorpresaPeriodico;z.comiendo=null;
  evento(m,z,'periodico-roto');
 },
 paso(m,z,dt){
  if(z.datos.enfadoPendiente>0){
   z.datos.enfadoPendiente=Math.max(0,z.datos.enfadoPendiente-dt*(z.lento>0?.5:1));z.comiendo=null;
   if(z.datos.enfadoPendiente>1e-9)return false;
   z.datos.enfadado=1;z.datos.velocidad=m.zombisDef[z.tipo].datos!.velocidadEnfadado;evento(m,z,'periodico-enfadado');
  }
 },
};
const bailon:ComportamientoZombiPvZ={
 iniciar(m,z){z.datos.entradaX=z.x;z.datos.bando=z.hipnotizado?1:0;z.datos.faseBaile=0;z.datos.velocidad=m.zombisDef[z.tipo].datos!.velocidadEntrada;},
 paso(m,z,dt){
  const bando=z.hipnotizado?1:0;
  if(z.datos.bando!==bando){separar(m,z);z.datos.bando=bando;z.datos.reponerEn=0;}
  if(z.datos.faseBaile===0){
   if(Math.abs(z.x-z.datos.entradaX)<TIEMPOS_ZOMBIS_NOCHE.entradaBailon&&!tieneBlancoCerca(m,z))return;
   senalar(m,z);
  }
  if(z.datos.senalando>0){
   z.datos.senalando=Math.max(0,z.datos.senalando-dt*(z.lento>0?.5:1));z.datos.velocidad=0;
   if(z.datos.senalando<=1e-9){invocar(m,z);z.datos.faseBaile=2;}
   return;
  }
  if(!(z.datos.esperaHasta>m.t)&&faltan(m,z)&&!tieneBlancoCerca(m,z)){
   if(!z.datos.reponerEn)z.datos.reponerEn=m.t+TIEMPOS_ZOMBIS_NOCHE.reponer;
   const fase=(m.t+1e-9)%TIEMPOS_ZOMBIS_NOCHE.cicloBaile;
   if(m.t+1e-9>=z.datos.reponerEn&&fase>=TIEMPOS_ZOMBIS_NOCHE.marchaBaile&&fase<TIEMPOS_ZOMBIS_NOCHE.marchaBaile+dt+1e-8)senalar(m,z);
  }
  prepararMarcha(m,z);
 },
 alMorir:separar,
};
const acompanante:ComportamientoZombiPvZ={
 paso(m,z){
  if(z.datos.lider&&!liderDe(m,z)){z.datos.lider=0;z.datos.hueco=-1;}
  if(z.datos.emergeHasta>m.t){z.comiendo=null;return false;}
  prepararMarcha(m,z);
 },
};
/** Puerta y fútbol se resuelven por escudo/casco y movimiento comunes, sin bonos ocultos. */
export const COMPORTAMIENTO_NOCHE_ZOMBIS:Record<string,ComportamientoZombiPvZ>={
 'zombi-periodico':periodico,'zombi-portero':{},'zombi-futbolista':{},'zombi-bailon':bailon,'zombi-acompanante':acompanante,
};
