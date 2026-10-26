import {NIVELES_NIEBLA} from './niebla';
import {NIVELES_TEJADO} from './tejado';
import {NIVELES_PISCINA} from './piscina';
import {NIVELES_DIA} from './dia';
import {NIVELES_NOCHE} from './noche';
import {PLANTAS_PVZ} from './plantas';
export const NIVELES_PVZ=[...NIVELES_DIA,...NIVELES_NOCHE,...NIVELES_PISCINA,...NIVELES_NIEBLA,...NIVELES_TEJADO];
export const NIVEL_PVZ=Object.fromEntries(NIVELES_PVZ.map(n=>[n.id,n]));
/** Premios anteriores, nunca el del nivel que se va a jugar. No ofrece plantas aún sin registrar. */
export function semillasAntesDelNivel(id:string){
 const i=NIVELES_PVZ.findIndex(n=>n.id===id);if(i<0)return Object.values(PLANTAS_PVZ).filter(p=>p.desbloqueo==='inicio').map(p=>p.id);
 const disponibles=Object.values(PLANTAS_PVZ).filter(p=>p.desbloqueo==='inicio').map(p=>p.id);
 for(const n of NIVELES_PVZ.slice(0,i)){const p=n.premio?.planta;if(p&&Object.hasOwn(PLANTAS_PVZ,p))disponibles.push(p);}return [...new Set(disponibles)];
}
