import type {HistoriaConquistaPvZ} from './historia-motor';
import type {MotorPvZ} from '../pvz/motor/motor';
import {crearPilotoPvZ,seleccionPilotoPvZ} from '../pvz/motor/bot';
import {escenarioHistoriaPvZ} from './historia-datos';

/** Herramienta de pruebas: solo decisiones y controles ordinarios, sin conceder recursos. */
export function crearPilotoHistoriaPvZ(){
 const pilotos=new WeakMap<MotorPvZ,(m:MotorPvZ)=>void>();let actuarEn=0;
 return(mundo:HistoriaConquistaPvZ)=>{
  if(mundo.defensas.pausada||mundo.estado.ganador)return;
  for(const z of mundo.activos){const m=mundo.defensas.observar(String(z.id))!;let piloto=pilotos.get(m);if(!piloto){piloto=crearPilotoPvZ();pilotos.set(m,piloto);}piloto(m);}
  if(mundo.t<actuarEn||mundo.activos.some(z=>z.incursion?.tipo==='expedicion'))return;actuarEn=mundo.t+1;
  const candidatos=mundo.estado.zonas.filter(z=>mundo.puedeExpedicion(z.id)).sort((a,b)=>a.id-b.id);
  for(const z of candidatos){mundo.explorar(z.id);
   const disponibles=mundo.estado.desbloqueadas.filter(tipo=>{const id=mundo.defensas.propietaria(tipo);return id===null||id===String(z.id)||!mundo.estado.zonas[Number(id)].incursion;});
   const semillas=seleccionPilotoPvZ(disponibles,escenarioHistoriaPvZ(z.id).nivel);
   if(semillas.length&&!mundo.preparar(z.id,semillas)&&mundo.expedicion(z.id))return;
  }
 };
}
