import {crearPilotoNieblaPvZ,seleccionNieblaPvZ} from './bot-niebla';
import type {MotorPvZ} from './motor';
import {crearPilotoNochePvZ} from './bot-noche';
import {seleccionPilotoPvZ as seleccionBasePvZ} from './bot-noche';
import {crearPilotoPiscinaPvZ,seleccionPiscinaPvZ} from './bot-piscina';
import type {DefNivel} from '../tipos';
export function seleccionPilotoPvZ(disponibles:readonly string[],nivel:DefNivel){return nivel.area==='niebla'||nivel.minijuego==='rompejarrones'?seleccionNieblaPvZ(disponibles,nivel):nivel.area==='piscina'?seleccionPiscinaPvZ(disponibles,nivel):seleccionBasePvZ([...disponibles],nivel);}
/** Piloto: usa órdenes legales y los recursos recibidos; no concede ventajas al motor. */
export function crearPilotoPvZ(){let actuarEn=0;const noche=crearPilotoNochePvZ(),piscina=crearPilotoPiscinaPvZ(),niebla=crearPilotoNieblaPvZ();return(m:MotorPvZ)=>{
 if(m.nivel.area==='niebla'||m.nivel.minijuego==='rompejarrones'){niebla(m);return;}
 if(m.nivel.area==='piscina'){piscina(m);return;}
 if(m.esNoche||m.nivel.minijuego==='aplastazombis'){noche(m);return;}
 for(const s of [...m.soles])m.recoger(s.id);if(m.terminado||m.t<actuarEn)return;actuarEn=m.t+.1;
 const amenaza=[...m.nivel.filas].sort((a,b)=>Math.min(999,...m.zombis.filter(z=>z.vida>0&&!z.hipnotizado&&z.fila===a).map(z=>z.x))-Math.min(999,...m.zombis.filter(z=>z.vida>0&&!z.hipnotizado&&z.fila===b).map(z=>z.x)));
 if(m.nivel.cinta){for(const s of [...m.cinta]){
   if(m.nivel.minijuego==='bolos'){const f=amenaza.find(f=>m.zombis.some(z=>z.fila===f&&z.vida>0&&!z.hipnotizado));if(f!==undefined&&m.plantarCinta(s.id,f,0))return;continue;}
   if(s.planta==='petacereza'){const z=m.zombis.filter(z=>z.vida>0&&!z.hipnotizado).sort((a,b)=>a.x-b.x)[0];if(z&&z.x<650){const col=Math.max(0,Math.min(8,Math.floor(z.x/80)));if(m.plantarCinta(s.id,z.fila,col))return;}continue;}
   const cols=s.planta==='nuez'?[6,7,8]:s.planta==='patatapum'?[5,6]:s.planta==='planta-carnivora'?[5,4]:[1,2,3,0,4];for(const col of cols)for(const fila of amenaza)if(!m.plantaEn(fila,col)&&m.plantarCinta(s.id,fila,col))return;
  }return;}
 const sembrar=(id:string,f:number,c:number)=>m.semillas.includes(id)&&!m.plantaEn(f,c)&&m.plantar(id,f,c);
 for(const f of amenaza){
  const visitas=m.zombis.filter(z=>z.vida>0&&!z.hipnotizado&&!z.sinCabeza&&z.fila===f),frente=Math.min(999,...visitas.map(z=>z.x)),vida=visitas.reduce((a,z)=>a+z.vida+z.armadura,0);
  if(frente<700&&frente>530&&vida>270&&sembrar('nuez',f,6))return;
  if(frente<260&&m.semillas.includes('petacereza')){
   const centro=Math.floor(frente/80);for(const c of [centro,centro+1,centro-1])if(sembrar('petacereza',f,c))return;
   if((m.recargas.petacereza??0)<=0&&(vida>270||m.cortacespedes.find(c=>c.fila===f)?.estado==='gastado'))return;
  }
  if(visitas.length&&frente>260&&!m.plantaEn(f,2)){sembrar('lanzaguisantes',f,2);return;}
 }
 for(const f of amenaza){
  const visitas=m.zombis.filter(z=>z.vida>0&&!z.hipnotizado&&!z.sinCabeza&&z.fila===f),frente=Math.min(999,...visitas.map(z=>z.x)),vida=visitas.reduce((a,z)=>a+z.vida+z.armadura,0);
  if(visitas.length&&frente<700&&frente>530&&vida>270&&sembrar('nuez',f,6))return;
  const tiros=m.plantas.filter(p=>p.vida>0&&p.fila===f&&['lanzaguisantes','hielaguisantes','repetidora'].includes(p.tipo)).length;
  if(visitas.length&&frente<620&&vida>270&&tiros<2){for(const c of [3,4,5])if(sembrar('lanzaguisantes',f,c))return;return;}
  if(frente<300&&vida>270)for(const c of [Math.floor(frente/80),Math.floor(frente/80)+1,Math.floor(frente/80)-1])if(sembrar('petacereza',f,c))return;
 }
 if(m.nivel.id==='1-1'){for(const c of [1,0,3])if(sembrar('lanzaguisantes',2,c))return;return;}
 for(let c=0;c<2;c++)for(const f of m.nivel.filas)if(sembrar('girasol',f,c))return;
 for(const c of [2,3,4])for(const f of amenaza)if(sembrar(c===4&&m.semillas.includes('repetidora')?'repetidora':'lanzaguisantes',f,c))return;
 if(m.semillas.includes('hielaguisantes'))for(const f of amenaza)if(sembrar('hielaguisantes',f,5))return;
 for(const f of amenaza)if(sembrar('nuez',f,6))return;
};}
