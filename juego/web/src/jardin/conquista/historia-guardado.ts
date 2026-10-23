import {HistoriaConquistaPvZ,type PartidaHistoriaPvZ} from './historia-motor';
import type {AlmacenConquista} from './guardado';

/** Archivo nuevo: nunca lee ni reemplaza las claves del prototipo o de los minijuegos. */
export class GuardadoHistoriaPvZ {
 private original:string|null=null;private leido=false;private incompatible=false;
 error='';motivo:''|'incompatible'|'lectura'|'conflicto'|'cuota'='';
 constructor(private almacen:AlmacenConquista,readonly clave='conquista-historia-v2'){}
 leer():PartidaHistoriaPvZ|null{
  try{this.original=this.almacen.getItem(this.clave);this.leido=true;this.incompatible=false;
   if(this.original===null){this.error='';this.motivo='';return null;}
   const m=HistoriaConquistaPvZ.restaurar(JSON.parse(this.original));this.error='';this.motivo='';return m.exportar();
  }catch{this.incompatible=true;this.motivo=this.leido?'incompatible':'lectura';this.error='No se pudo abrir esta historia. El archivo original se conserva.';return null;}
 }
 guardar(partida:PartidaHistoriaPvZ){
  if(!this.leido||this.incompatible){this.error='El archivo original no se puede reemplazar.';return false;}
  try{HistoriaConquistaPvZ.restaurar(partida);}catch{this.error='La historia no es compatible y no se ha guardado.';return false;}
  try{if(this.almacen.getItem(this.clave)!==this.original){this.motivo='conflicto';this.error='La historia cambió en otra pestaña. Exporta esta partida antes de salir.';return false;}
   const raw=JSON.stringify(partida);this.almacen.setItem(this.clave,raw);this.original=raw;this.error='';this.motivo='';return true;
  }catch{this.motivo='cuota';this.error='No se pudo escribir. La historia sigue en memoria: reintenta o expórtala.';return false;}
 }
}
