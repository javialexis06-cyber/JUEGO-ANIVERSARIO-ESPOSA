import { ARTICULOS } from './catalogo';
import { posicionAnimal } from './ganaderia';
import type { Edificio, EstadoGranja } from './estado';

const catalogo = new Map(ARTICULOS.filter(a=>a.categoria==='valla').map(a=>[a.id,a]));
export const esCerco = (b:Pick<Edificio,'articulo'>)=>catalogo.has(b.articulo);
/** Las puertas decorativas anteriores conservan su paso hasta que se cierran expresamente. */
export const portonAbierto = (b:Pick<Edificio,'articulo'|'portonAbierto'>)=>b.articulo==='porton'&&b.portonAbierto!==false;
export function huellaCerco(b:Pick<Edificio,'articulo'|'x'|'z'|'giro'>){
 const a=catalogo.get(b.articulo)!;
 return {x:b.x,z:b.z,ancho:b.giro%2?a.fondo:a.ancho,fondo:b.giro%2?a.ancho:a.fondo};
}
export function intersectaCerco(b:Pick<Edificio,'articulo'|'x'|'z'|'giro'>,x:number,z:number,radio=0){
 const h=huellaCerco(b);
 return x+radio>=h.x&&x-radio<h.x+h.ancho&&z+radio>=h.z&&z-radio<h.z+h.fondo;
}
export function cercoBloquea(s:EstadoGranja,x:number,z:number,radio=0){
 return s.edificios.some(b=>esCerco(b)&&!portonAbierto(b)&&intersectaCerco(b,x,z,radio));
}
/** No se coloca ni se cierra una barrera sobre el cuerpo de un habitante. */
export function cercoOcupado(s:EstadoGranja,b:Pick<Edificio,'articulo'|'x'|'z'|'giro'>,jugador?:{x:number;z:number}){
 const exterior=s.zona==='granja'&&!s.interior&&!s.servicio&&!s.astra?.actual&&!s.aventura.destinoActual;
 const p=jugador??(s.posicionExterior?.zona==='granja'?s.posicionExterior:undefined);
 if(exterior&&p&&intersectaCerco(b,p.x,p.z,s.compania.montada ? .45 : .24))return true;
 if(s.compania.animales.some(a=>a.posicion.zona==='granja'&&intersectaCerco(b,a.posicion.x,a.posicion.z,a.tipo==='caballo'?.45:.2)))return true;
 return s.animales.some(a=>a.rutina?.lugar==='corral'&&(()=>{const p=posicionAnimal({...s,interior:null},a);return intersectaCerco(b,p.x,p.z,.25);})());
}
