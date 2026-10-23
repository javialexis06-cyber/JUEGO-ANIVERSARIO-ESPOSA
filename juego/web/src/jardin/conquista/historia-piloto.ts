import type {HistoriaConquistaPvZ} from './historia-motor';
import type {MotorPvZ} from '../pvz/motor/motor';
import {crearPilotoPvZ,seleccionPilotoPvZ} from '../pvz/motor/bot';
import {escenarioHistoriaPvZ} from './historia-datos';

/** Variante de prueba para equipos diurnos sin Lanzaguisantes: no da por supuesto que
 * ese tipo está disponible en todos los frentes. El piloto clásico conserva su contrato. */
function pilotoDiurnoReservas(){let actuarEn=0;return(m:MotorPvZ)=>{
 for(const sol of [...m.soles])m.ordenar({tipo:'recoger',id:sol.id});
 if(m.terminado||m.t<actuarEn)return;actuarEn=m.t+.1;
 const enemigos=m.zombis.filter(z=>z.vida>0&&!z.hipnotizado&&!z.sinCabeza),frente=(fila:number)=>Math.min(999,...enemigos.filter(z=>z.fila===fila).map(z=>z.x));
 const filas=[...m.nivel.filas].sort((a,b)=>frente(a)-frente(b)||a-b);
 const sembrar=(tipo:string,fila:number,col:number)=>m.semillas.includes(tipo)&&!m.plantaEn(fila,col)&&m.ordenar({tipo:'plantar',planta:tipo,fila,col});
 const tiros=['repetidora','hielaguisantes','cactus','tripitidora','bipetidora','frustrella'].filter(id=>m.semillas.includes(id));
 for(const fila of filas){
  const x=frente(fila),v=enemigos.filter(z=>z.fila===fila),fuego=m.plantas.some(p=>p.vida>0&&p.fila===fila&&tiros.includes(p.tipo));
  if(x<250)for(const col of[Math.floor(x/80),Math.floor(x/80)+1])if(sembrar('petacereza',fila,col)||sembrar('aplastaflor',fila,col)||sembrar('jalapeno',fila,col))return;
  if(v.length&&!fuego&&x>440&&x<720&&sembrar('patatapum',fila,4))return;
  if(v.length&&!fuego)for(const tipo of tiros)for(const col of[2,1,0])if(sembrar(tipo,fila,col))return;
  if(x<550)for(const col of[5,4,3])if(sembrar('planta-carnivora',fila,col))return;
 }
 for(const col of[0,1])for(const fila of filas)if(sembrar('girasol',fila,col))return;
 for(const col of[2,3,4,1,0,5])for(const fila of filas)for(const tipo of tiros)if(sembrar(tipo,fila,col))return;
 for(const fila of filas){if(sembrar('nuez',fila,6)||sembrar('nuez-alta',fila,6))return;}
};}

function seleccionReservas(disponibles:readonly string[],m:MotorPvZ['nivel']){
 if(m.area!=='dia')return seleccionPilotoPvZ(disponibles,m);
 const orden=['girasol','lanzaguisantes','repetidora','hielaguisantes','cactus','tripitidora','bipetidora','frustrella','nuez','nuez-alta','patatapum','planta-carnivora','aplastaflor','petacereza','jalapeno','pinchohierba','plantorcha','calabaza'];
 return orden.filter(id=>disponibles.includes(id)).slice(0,6);
}

/** Herramienta de pruebas: solo decisiones y controles ordinarios, sin conceder recursos. */
export function crearPilotoHistoriaPvZ(){
 const pilotos=new WeakMap<MotorPvZ,(m:MotorPvZ)=>void>();let actuarEn=0;
 return(mundo:HistoriaConquistaPvZ)=>{
  if(mundo.defensas.pausada||mundo.estado.ganador)return;
  for(const z of mundo.activos){const m=mundo.defensas.observar(String(z.id))!;let piloto=pilotos.get(m);if(!piloto){piloto=mundo.estado.config.incursiones&&m.nivel.area==='dia'&&!m.semillas.includes('lanzaguisantes')?pilotoDiurnoReservas():crearPilotoPvZ();pilotos.set(m,piloto);}piloto(m);}
  if(mundo.t<actuarEn||mundo.activos.some(z=>z.incursion?.tipo==='expedicion'))return;actuarEn=mundo.t+1;
  const orden=[4,9,0,1,5,6,10,2,7,11,3];
  const candidatos=mundo.estado.zonas.filter(z=>mundo.puedeExpedicion(z.id)).sort((a,b)=>mundo.estado.config.incursiones?orden.indexOf(a.id)-orden.indexOf(b.id):a.id-b.id);
  for(const z of candidatos){mundo.explorar(z.id);
   const disponibles=mundo.estado.desbloqueadas.filter(tipo=>{const id=mundo.defensas.propietaria(tipo);if(id===null||id===String(z.id))return true;const origen=mundo.estado.zonas[Number(id)];return!origen.incursion&&(!mundo.estado.config.incursiones||origen.dueno!=='plantas'||!mundo.vecinos(origen.id).some(v=>mundo.estado.zonas[v].dueno==='zombis'));});
   const nivel=escenarioHistoriaPvZ(z.id).nivel,semillas=mundo.estado.config.incursiones?seleccionReservas(disponibles,nivel):seleccionPilotoPvZ(disponibles,nivel);
   if(semillas.length&&!mundo.preparar(z.id,semillas)&&mundo.expedicion(z.id))return;
  }
 };
}
