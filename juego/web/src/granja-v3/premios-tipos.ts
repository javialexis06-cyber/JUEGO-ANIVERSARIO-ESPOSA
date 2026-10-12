import type {Pila} from './inventario';
export type FamiliaPremio='conocimiento'|'agenda'|'plano'|'trofeo'|'acceso'|'tecnica';
export type AmbitoPremio='animales'|'cultivos'|'fabricacion'|'pesca'|'rutas'|'documentos'|'comunidad';
export interface PremioNarrativo{
 id:string;mision:string;nombre:string;familia:FamiliaPremio;tema:string;utilidad:string;efecto_diseno:string;limite:string;insignia:string;region:string;titulares:string[];ambito:AmbitoPremio;
 unica:boolean;vendible:boolean;monedas:number;multiplicadores_globales:number;estado:string;
 plano?:{tipo:'receta'|'acceso'|'cofre'|'trampa'|'exhibicion';base:string;materiales:Record<string,number>;capacidad?:number};
 tecnica?:{factor:number;estaciones:string[];recetas:string[]};
}
export interface ModuloPremio{
 id:string;premio:string;region:string;x:number;z:number;edificioId:string|null;
 casillas:(Pila|null)[];usos:number;ultimoDia:number;cebo:number;especie:string|null;
}
export interface UtilidadesHistoria{
 version:1;agenda:{premio:string;dia:number;revisada:boolean}[];exhibidos:string[];
 tecnica:string|null;modulos:ModuloPremio[];inscripciones:Record<string,boolean>;seleccion:string|null;
 estilos:Record<string,string>;
}
export type AccionPremio=
 |{tipo:'consultar';id:string}
 |{tipo:'fijar';id:string;dia:number}|{tipo:'quitar_agenda'|'revisar_agenda'|'exhibir'|'guardar_trofeo'|'tecnica'|'retirar_inscripcion'|'autorizar_inscripcion';id:string}
 |{tipo:'instalar';id:string;x:number;z:number;edificioId?:string}
 |{tipo:'retirar_modulo'|'reparar_trampa'|'recoger_trampa'|'usar_acceso';id:string}
 |{tipo:'cebar_trampa';id:string;cantidad:number}
 |{tipo:'seleccion_trampa';id:string;especie:string|null}
 |{tipo:'guardar_modulo'|'sacar_modulo';id:string;casilla:number;cantidad:number}
 |{tipo:'estilo';id:string;ranura:string};
