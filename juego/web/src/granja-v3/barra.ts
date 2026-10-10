import type { Herramienta } from './catalogo';
import type { Pila } from './inventario';
import { obtenerObjeto, type TipoBuff } from './objetos';

export const LARGO_BARRA=12;
export type RanuraEquipo='arma'|'casco'|'pechera'|'botas';
export interface EstadoBarra {
 filaBarra:number;casillaActiva:number;
 equipo:Record<RanuraEquipo,string|null>;
 buffs:{tipo:TipoBuff;valor:number;hasta:number}[];
 ultimoConsumoAt:number;
}
export function crearBarra():EstadoBarra{return {filaBarra:0,casillaActiva:0,equipo:{arma:null,casco:null,pechera:null,botas:null},buffs:[],ultimoConsumoAt:0};}
export const HERRAMIENTAS_INICIALES=['azada','regadera','hacha','pico','guadana','cana','espada'] as const;
export const indiceActivo=(s:EstadoBarra)=>s.filaBarra*LARGO_BARRA+s.casillaActiva;
export const objetoActivo=(s:EstadoBarra&{casillasInventario:(Pila|null)[]})=>s.casillasInventario[indiceActivo(s)]??null;
export function herramientaDeObjeto(id:string|null|undefined):Herramienta {
 const obj=id?obtenerObjeto(id):undefined;
 return obj?.herramienta?.tipo as Herramienta??(obj?.equipo?.ranura==='arma'?'espada':'mano');
}
export function bonosEquipo(s:EstadoBarra&{casillasInventario:(Pila|null)[]},ahora:number){
 const bonos={ataque:0,defensa:0,critico:0,velocidad:0,pesca:0,mineria:0,suerte:0};
 const activo=obtenerObjeto(objetoActivo(s)?.articulo??'');
 const arma=activo?.equipo?.ranura==='arma'?activo:obtenerObjeto(s.equipo.arma??'');
 for(const d of [arma,...(['casco','pechera','botas'] as const).map(r=>obtenerObjeto(s.equipo[r]??''))])if(d?.equipo)for(const k of ['ataque','defensa','critico','velocidad'] as const)bonos[k]+=d.equipo[k]??0;
 for(const b of s.buffs)if(b.hasta>ahora)bonos[b.tipo]+=b.valor;
 return bonos;
}
export function validarBarra(s:EstadoBarra,capacidad:number,ahora:number):boolean {
 if(!Number.isInteger(s.filaBarra)||s.filaBarra<0||s.filaBarra>=capacidad/LARGO_BARRA||!Number.isInteger(s.casillaActiva)||s.casillaActiva<0||s.casillaActiva>=LARGO_BARRA)return false;
 if(!s.equipo||(['arma','casco','pechera','botas'] as const).some(r=>s.equipo[r]!==null&&obtenerObjeto(s.equipo[r]??'')?.equipo?.ranura!==r))return false;
 if(!Array.isArray(s.buffs)||s.buffs.length>6||new Set(s.buffs.map(b=>b.tipo)).size!==s.buffs.length||s.buffs.some(b=>!b||!['ataque','defensa','velocidad','pesca','mineria','suerte'].includes(b.tipo)||!Number.isFinite(b.valor)||b.valor<0||b.valor>100||!Number.isFinite(b.hasta)||b.hasta<0||b.hasta>ahora+24*3600000))return false;
 return Number.isFinite(s.ultimoConsumoAt)&&s.ultimoConsumoAt>=0&&s.ultimoConsumoAt<=ahora;
}
