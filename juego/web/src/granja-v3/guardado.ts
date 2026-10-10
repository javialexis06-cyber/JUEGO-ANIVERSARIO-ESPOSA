export const CLAVE_PARTIDA='nuestra-granjita-v3',CLAVE_ULTIMA_NOCHE=CLAVE_PARTIDA+'-ultima-noche';
/** El guardado nocturno conserva un punto de recuperación y revierte si falta espacio. */
export function guardarPartida(almacen:Pick<Storage,'getItem'|'setItem'|'removeItem'>,json:string,noche=false):void{
 if(!noche){almacen.setItem(CLAVE_PARTIDA,json);return;}
 const anterior=almacen.getItem(CLAVE_PARTIDA);let escrito=false;
 try{almacen.setItem(CLAVE_PARTIDA,json);escrito=true;almacen.setItem(CLAVE_ULTIMA_NOCHE,json);}
 catch(e){if(escrito){if(anterior===null)almacen.removeItem(CLAVE_PARTIDA);else almacen.setItem(CLAVE_PARTIDA,anterior);}throw e;}
}
