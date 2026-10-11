import type { Calidad } from './inventario';
import type { Pila } from './inventario';

export interface RequisitoLote {nombre:string;articulos:string[];cantidad:number;calidad:Calidad}
export interface DefLote {id:string;nombre:string;requisitos:RequisitoLote[];premio:Pila[];monedas:number;cultivos:string[]}
const requisito=(nombre:string,articulos:string[],cantidad:number,calidad:Calidad=0):RequisitoLote=>({nombre,articulos,cantidad,calidad});
/** Alternativas explícitas y alcanzables; ningún lote caduca ni exige su propia recompensa. */
export const LOTES_COLECCION:DefLote[]=[
 {id:'primavera',nombre:'Huerto de primavera',requisitos:[requisito('Fresas',['fresa'],3),requisito('Cosecha de primavera de plata o mejor',['zanahoria','trigo','chirivia'],2,1)],premio:[{articulo:'fertilizante',cantidad:12}],monedas:80,cultivos:['fresa','zanahoria','chirivia']},
 {id:'verano',nombre:'Huerto de verano',requisitos:[requisito('Maíz',['maiz'],3),requisito('Cosecha de verano de plata o mejor',['tomate','melon','rabano'],2,1)],premio:[{articulo:'aspersor_basico',cantidad:1}],monedas:100,cultivos:['maiz','melon','rabano']},
 {id:'otono',nombre:'Huerto de otoño',requisitos:[requisito('Calabazas',['calabaza'],3),requisito('Cosecha de otoño de plata o mejor',['zanahoria','remolacha','berenjena'],2,1)],premio:[{articulo:'cofre_madera',cantidad:1}],monedas:120,cultivos:['calabaza','remolacha','berenjena']},
 {id:'invierno',nombre:'Huerto de invierno',requisitos:[requisito('Melones de polvo',['melon_polvo'],3),requisito('Cosecha de invierno de plata o mejor',['melon_polvo','fresa_escarcha'],1,1)],premio:[{articulo:'aspersor_cobre',cantidad:1}],monedas:140,cultivos:['melon_polvo','fresa_escarcha']},
 {id:'pesca',nombre:'Aguas del valle',requisitos:[requisito('Carpas',['carpa'],2),requisito('Otra captura de plata o mejor',['perca','trucha','sardina_lago'],1,1)],premio:[{articulo:'pez_cebo',cantidad:8}],monedas:90,cultivos:[]},
 {id:'mineria',nombre:'Piedra y oficio',requisitos:[requisito('Mineral de cobre',['cobre'],5),requisito('Cuarzos',['cuarzo'],2),requisito('Primer lingote',['lingote_cobre'],1)],premio:[{articulo:'horno',cantidad:1}],monedas:100,cultivos:[]},
];
export const loteDef=(id:string)=>LOTES_COLECCION.find(l=>l.id===id);
export const desbloqueoLote=(id:string)=>'coleccion_'+id;
