import type { Companero } from './compania';
import type { EstadoGranja,Resultado } from './estado';
import { calidadPila,cambiarCantidad,resumirCasillas,type Calidad } from './inventario';
import { accesorioCompania,RANURAS_COMPANIA,type RanuraEquipoCompania } from './equipo-compania-datos';
import { dentroDeZona } from './caminos-mundo';

export type AccionEquipoCompania=
 |{tipo:'equipar';id:string;casilla:number;articulo:string;calidad:Calidad}
 |{tipo:'quitar_equipo';id:string;ranura:RanuraEquipoCompania};
const mal=(mensaje:string):Resultado=>({ok:false,mensaje});

/** La ausencia es V5 anterior; un campo presente inválido se rechaza sin borrar equipo. */
export function equipoCompaniaValido(a:Pick<Companero,'tipo'|'equipo'>){
 const e=a.equipo;if(e===undefined)return true;
 if(!e||typeof e!=='object'||Array.isArray(e)||Object.keys(e).some(k=>!RANURAS_COMPANIA.includes(k as RanuraEquipoCompania)))return false;
 return Object.entries(e).every(([ranura,p])=>{
  if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).some(k=>!['articulo','cantidad','calidad'].includes(k))||p.cantidad!==1||typeof p.articulo!=='string'||p.calidad!==undefined&&![0,1,2,3].includes(p.calidad))return false;
  const d=accesorioCompania(p.articulo);return !!d&&d.ranura===ranura&&d.tipos.includes(a.tipo);
 });
}

export function efectosEquipoCompania(a:Pick<Companero,'tipo'|'equipo'>){
 const efectos={velocidadPaseo:1,velocidadMontada:1,distanciaEspera:1.6};
 if(!equipoCompaniaValido(a))return efectos;
 for(const ranura of RANURAS_COMPANIA){const p=a.equipo?.[ranura],d=p&&accesorioCompania(p.articulo);if(d){efectos.velocidadPaseo=Math.max(efectos.velocidadPaseo,d.velocidadPaseo);efectos.velocidadMontada=Math.max(efectos.velocidadMontada,d.velocidadMontada);efectos.distanciaEspera=Math.min(efectos.distanciaEspera,d.distanciaEspera);}}
 return efectos;
}

/** Invocada por la acción del motor; se preparan mochila y equipo antes de confirmar ambos. */
export function actuarEquipoCompania(s:EstadoGranja,c:Companero,a:AccionEquipoCompania,x:number,z:number):Resultado{
 if(s.compania.montada)return mal('Desmonta para ajustar los accesorios.');
 if(s.interior||s.servicio||s.aventura.destinoActual||s.astra?.actual||s.zona!==c.posicion.zona||!Number.isFinite(x)||!Number.isFinite(z)||!dentroDeZona(s.zona,x,z)||Math.hypot(x-c.posicion.x,z-c.posicion.z)>2.8)return mal('Acércate al compañero en el exterior para ajustar su equipo.');
 if(!equipoCompaniaValido(c))return mal('El equipo del compañero no es válido.');
 let mochila=s.casillasInventario.map(p=>p?{...p}:null),equipo={...c.equipo};
 if(a.tipo==='equipar'){
  if(!Number.isInteger(a.casilla)||a.casilla<0||a.casilla>=mochila.length)return mal('Selecciona una casilla válida de tu mochila.');
  const p=mochila[a.casilla],d=p&&accesorioCompania(p.articulo);
  if(typeof a.articulo!=='string'||![0,1,2,3].includes(a.calidad)||!p||p.articulo!==a.articulo||calidadPila(p)!==a.calidad)return mal('La casilla cambió. Selecciona de nuevo el accesorio que quieres equipar.');
  if(!p||p.cantidad!==1||!d||!d.tipos.includes(c.tipo))return mal('Ese accesorio no corresponde a este compañero.');
  const anterior=equipo[d.ranura];
  if(anterior?.articulo===p.articulo&&calidadPila(anterior)===calidadPila(p))return mal('Ya lleva ese accesorio con la misma calidad.');
  mochila[a.casilla]=null;
  if(anterior){const devuelta=cambiarCantidad(mochila,anterior.articulo,1,calidadPila(anterior));if(!devuelta)return mal('Deja espacio en la mochila para el accesorio anterior.');mochila=devuelta;}
  equipo[d.ranura]={...p,cantidad:1};
 }else{
  if(!RANURAS_COMPANIA.includes(a.ranura))return mal('Selecciona una ranura de compañero válida.');
  const anterior=equipo[a.ranura];if(!anterior)return mal('Esa ranura ya está vacía.');
  const devuelta=cambiarCantidad(mochila,anterior.articulo,1,calidadPila(anterior));if(!devuelta)return mal('Deja una casilla libre en la mochila para quitarlo.');mochila=devuelta;delete equipo[a.ranura];
 }
 s.casillasInventario=mochila;s.inventario=resumirCasillas(mochila);
 if(Object.keys(equipo).length)c.equipo=equipo;else delete c.equipo;
 return {ok:true,mensaje:a.tipo==='equipar'?'Accesorio equipado. Se conservan su calidad, vínculo, genes y cuidados.':'Accesorio devuelto a tu mochila con su calidad original.'};
}
