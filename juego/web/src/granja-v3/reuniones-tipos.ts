export interface ReunionDef {
 id:string;region:string;tipo:'mesa'|'clima'|'cuidado'|'terminal';titulo:string;actores:string[];
 prioridad:number;desdeMinuto:number;hastaMinuto:number;ventanaNoches:number;
 materiales:Record<string,number>;salida:{articulo:string;cantidad:number};amistad:number;
 lineas:{id:string;hablante:string;texto:string;huella:string;huella_texto:string}[];
 opciones:{titulo:string;cierre:string}[];
}
export interface EntradaReunion {
 id:string;desde:number;hasta:number;estado:'pendiente'|'aplazado'|'visto';
 opcion:0|1|null;cierre:number|null;
}
export interface EstadoReuniones {
 version:1;cola:EntradaReunion[];actual:{id:string;linea:number}|null;
}
export type AccionReunion={tipo:'reunion'|'aplazar_reunion';id:string}
 |{tipo:'continuar_reunion'|'dejar_reunion'}|{tipo:'elegir_reunion';opcion:0|1};
