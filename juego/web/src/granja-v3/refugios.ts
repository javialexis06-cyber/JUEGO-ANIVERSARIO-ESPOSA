import type { Edificio } from './estado';
export const nivelEdificio=(b:Edificio)=>b.nivel??1;
export const capacidadRefugio=(b:Edificio)=>b.especie?[6,8,12][nivelEdificio(b)-1]:b.articulo==='establo'?1:0;
/** Los refugios ampliados distribuyen camas y nidos sin exceder su interior. */
export function camaAnimal(indice:number,capacidad=6){return capacidad<=6?{u:indice%2?3.25:.75,v:1+Math.floor(indice/2)}:{u:.65+(indice%3)*1.35,v:.55+Math.floor(indice/3)*.85};}
export function esperaCorral(indice:number,capacidad=6){return capacidad<=6?{u:.7+(indice%3)*1.18,v:5+Math.floor(indice/3)*1.4}:{u:.65+(indice%4)*.9,v:4.85+Math.floor(indice/4)*1.12};}
