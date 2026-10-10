import type { Clima, Estacion } from './catalogo';
export interface FrutalDef {id:string;nombre:string;planton:string;producto:string;dias:number;precio:number;valor:number;estaciones:Estacion[];climas:Clima[];color:string;hojas:string;forma:'redondo'|'palmera'|'banano'}
export const FRUTALES:FrutalDef[]=[
 ['manzano','Manzano','manzana',100,12,['otono'],'#c26b59','#819a58','redondo'],
 ['cerezo','Cerezo','cereza',180,30,['primavera'],'#ab5360','#91a164','redondo'],
 ['albaricoquero','Albaricoquero','albaricoque',150,24,['primavera'],'#e3a566','#9ba65e','redondo'],
 ['duraznero','Duraznero','durazno',200,35,['verano'],'#db9483','#86a266','redondo'],
 ['naranjo','Naranjo','naranja',180,30,['verano'],'#dd9f55','#789962','redondo'],
 ['granado','Granado','granada',220,40,['otono'],'#b96874','#83965d','redondo'],
 ['mango','Mango','mango',300,55,['verano'],'#d4a34e','#71986a','redondo'],
 ['banano','Banano','banano',260,45,['verano'],'#e3cc79','#78a270','banano'],
].map(([id,nombre,producto,precio,valor,estaciones,color,hojas,forma])=>({id,nombre,planton:'planton_'+id,producto,precio,valor,estaciones,color,hojas,forma,dias:28,climas:id==='mango'||id==='banano'?['humedo','templado']:['templado','humedo','celeste']} as FrutalDef));
export const frutalDef=(id:string)=>FRUTALES.find(f=>f.id===id);
