import type { TipoCompania } from './compania';
import type { Pila } from './inventario';

export type RanuraEquipoCompania='paseo'|'montura';
export type EquipoCompania=Partial<Record<RanuraEquipoCompania,Pila>>;
export interface AccesorioCompania {
 id:string;nombre:string;ranura:RanuraEquipoCompania;tipos:readonly TipoCompania[];
 descripcion:string;velocidadPaseo:number;velocidadMontada:number;distanciaEspera:number;
}
/** Factores únicos por ranura; calidad se conserva, pero no multiplica los beneficios. */
export const ACCESORIOS_COMPANIA:readonly AccesorioCompania[]=[
 {id:'collar_paseo',nombre:'Collar de paseo',ranura:'paseo',tipos:['gato','perro','tortuga'],descripcion:'La mascota camina un 10 % más rápido por los caminos libres.',velocidadPaseo:1.1,velocidadMontada:1,distanciaEspera:1.6},
 {id:'brida_senda',nombre:'Brida de senda',ranura:'paseo',tipos:['caballo'],descripcion:'El caballo camina un 10 % más rápido al llamarlo y espera a 1,2 metros de ti.',velocidadPaseo:1.1,velocidadMontada:1,distanciaEspera:1.2},
 {id:'herraduras_senda',nombre:'Herraduras de senda',ranura:'montura',tipos:['caballo'],descripcion:'El caballo montado avanza un 8 % más rápido. Sus caminos y cuidados se mantienen.',velocidadPaseo:1,velocidadMontada:1.08,distanciaEspera:1.6},
];
export const accesorioCompania=(id:string)=>ACCESORIOS_COMPANIA.find(a=>a.id===id);
export const RANURAS_COMPANIA:readonly RanuraEquipoCompania[]=['paseo','montura'];
