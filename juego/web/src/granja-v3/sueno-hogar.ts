import { leerRetornoHogar } from './hogar';
import { CLAVE_PARTIDA, guardarPartida } from './guardado';
export function puedeCerrarJornadaHogar(){const r=leerRetornoHogar();return !!r&&r.jornada!==undefined&&!!r.edificioId;}
let cierreEnCurso:Promise<boolean>|null=null;
/** Solo se llama tras confirmar el sueño en la casa; la ficha de ida evita cerrar dos días. */
export function cerrarJornadaHogar():Promise<boolean>{
 if(cierreEnCurso)return cierreEnCurso;
 cierreEnCurso=cerrar().finally(()=>{cierreEnCurso=null;});return cierreEnCurso;
}
async function cerrar():Promise<boolean>{
 const r=leerRetornoHogar();if(!r||r.jornada===undefined||!r.edificioId)return false;
 const { MotorGranja }=await import('./motor');
 const json=localStorage.getItem(CLAVE_PARTIDA);if(!json)throw new Error('No se encontró el guardado de la granja.');
 const m=new MotorGranja();const carga=m.cargarJSON(json);if(!carga.ok)throw new Error(carga.mensaje);
 if(m.estado.jornada.diasCompletados!==r.jornada||m.estado.jornada.resumenPendiente)return false;
 const cierre=m.actuar({tipo:'dormir',jornada:r.jornada,edificioId:r.edificioId,xJugador:r.x,zJugador:r.z});if(!cierre.ok)throw new Error(cierre.mensaje);
 guardarPartida(localStorage,m.exportar(true),true);return true;
}
