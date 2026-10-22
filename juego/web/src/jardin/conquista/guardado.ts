import {estadoConquistaSeguro} from './motor';
import type {EstadoConquista} from './tipos';
export interface AlmacenConquista {getItem(k:string):string|null;setItem(k:string,v:string):void}
/** Clave independiente. Un archivo desconocido o una escritura concurrente nunca se reemplazan en silencio. */
export class GuardadoConquista {
 private original:string|null=null;private leido=false;error='';
 constructor(private almacen:AlmacenConquista,readonly clave='conquista-prototipo-v1'){}
 leer():EstadoConquista|null {try{this.original=this.almacen.getItem(this.clave);this.leido=true;if(this.original===null){this.error='';return null;}const s=JSON.parse(this.original);if(!estadoConquistaSeguro(s)||s.config.modo!=='historia')throw Error('Archivo incompatible');this.error='';return s;}catch{this.error='No se pudo abrir la partida. El archivo original se conserva.';return null;}}
 guardar(s:EstadoConquista){if(!this.leido||!estadoConquistaSeguro(s)||s.config.modo!=='historia'){this.error='El estado no se puede guardar.';return false;}try{if(this.almacen.getItem(this.clave)!==this.original){this.error='La partida cambió en otra pestaña. Se conserva ese archivo; exporta esta partida antes de salir.';return false;}const raw=JSON.stringify(s);this.almacen.setItem(this.clave,raw);this.original=raw;this.error='';return true;}catch{this.error='No hay espacio para guardar. La partida sigue en memoria; reintenta o expórtala.';return false;}}
 /** Solo desde la acción explícita Nueva partida o Importar del jugador. */
 reemplazar(s:EstadoConquista){try{this.original=this.almacen.getItem(this.clave);this.leido=true;return this.guardar(s);}catch{this.error='No se pudo escribir la partida.';return false;}}
}
