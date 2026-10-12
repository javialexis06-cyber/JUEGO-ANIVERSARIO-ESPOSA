/** Misiones de Astra: los recibos describen acciones, no lecturas del expediente anterior. */
export type ClasePasoHistoria='observar'|'preguntar'|'cultivar'|'cuidar'|'jornadas'|'entregar'|'visitar'|'sangre'|'secuencia'|'contraste'|'laberinto'|'circuito'|'inspeccionar'|'combate'|'oficio'|'nota'|'devolver_pesca';
export interface PasoHistoria {
 id:string;tipo:ClasePasoHistoria;texto:string;region:string;punto:{x:number;z:number}|null;
 datos?:string[];opciones?:string[];respuesta?:number;orden?:string[];ordenAlternativo?:string[];planes?:string[];cantidadAlternativa?:number;
 materiales?:Record<string,number>;cantidad?:number;regiones?:string[];sector?:string;
 participantes?:{id:string;respuesta:'acepta'|'aplaza'|'rechaza';texto:string;comision?:{region:string;x:number;z:number}}[];
 condicion?:'equipo'|'nave'|'refugio'|'matriz';mapa?:string[];destino?:string;alternativa?:string;registro?:string;especiesPermitidas?:string[];posterior?:boolean;
}
export interface MisionHistoria {
 id:string;titulo:string;region:string;clase:string;requiere:string[];reparto:string[];
 pasos:PasoHistoria[];decision:string;ramas:string[];consecuencias:string;personal?:string;pistas?:{texto:string;region:string;x:number;z:number}[];
}
export interface ProgresoHistoria {
 dia:number;inicioPaso:number;plan:number|null;paso:number;recibos:string[];observados:string[];permisos:Record<string,'acepta'|'aplaza'|'rechaza'>;
 cultivos:Record<string,{cultivo:string;regado:boolean;cosechado:boolean;contexto?:string}>;cuidados:string[];cuidadosDias:Record<string,number>;
 entregas:Record<string,Record<string,number>>;estadisticas:Record<string,number>;enfoques:Record<string,'tecnica'|'combate'>;
}
export interface RetoHistoria {
 mision:string;paso:string;tipo:'secuencia'|'contraste'|'laberinto'|'circuito';progreso:number;errores:number;
 x:number;z:number;visitados:string[];retiro:boolean;giros:number[];
}
export interface EstadoHistoria {
 version:1;activas:Record<string,ProgresoHistoria>;
 completadas:Record<string,{dia:number;opcion:number;recibos:string[]}>;
 reto:RetoHistoria|null;cartas:string[];sellos:string[];consecuencias:Record<string,number>;
 premios:string[];pistas:Record<string,number[]>;notas:Record<string,string>;
}
export type AccionHistoria=
 |{tipo:'aceptar'|'comprobar'|'preparar'|'retomar'|'iniciar_reto'|'reiniciar_reto';id:string}
 |{tipo:'observar';id:string;indice:number}|{tipo:'solicitar';id:string;npc:string}
 |{tipo:'enfoque';id:string;modo:'tecnica'|'combate'}
 |{tipo:'elegir_plan';id:string;opcion:number}
 |{tipo:'devolver_pez';id:string;pez:string}
 |{tipo:'descubrir';id:string;indice:number}|{tipo:'guardar_nota';id:string;texto:string}
 |{tipo:'responder';opcion:string}|{tipo:'mover';dx:number;dz:number}
 |{tipo:'retirar_permiso'}|{tipo:'girar';indice:number}|{tipo:'probar_circuito'}|{tipo:'dejar_reto'}
 |{tipo:'terminar';id:string;opcion:number};
