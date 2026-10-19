/** Contrato no gráfico: unidades en píxeles y segundos; ids numéricos estables por partida. */
export type Area='dia'|'noche'|'piscina'|'niebla'|'tejado'|'rio'|'vias'|'desierto'|'paramo'|'invernadero';
export type CapaPlanta='base'|'principal'|'cubierta'|'temporal';
export type TipoDano='recto'|'lanzado'|'perforante'|'explosion'|'fuego'|'hielo'|'aplastar';
export interface DefPlanta {
 id:string;nombre:string;sol:number;recarga:number;vida:number;
 familia:'productora'|'tiradora'|'barrera'|'explosiva'|'lanzadora'|'hongo'|'apoyo'|'acuatica';
 nocturna?:boolean;agua?:'solo'|'tambien';capa?:CapaPlanta;mejoraDe?:string;
 desbloqueo:string;descripcion:string;datos?:Record<string,number>;
}
export interface DefZombi {
 id:string;nombre:string;vida:number;armadura?:{tipo:'casco'|'escudo';vida:number;metal?:boolean};
 velocidad:number;mordida:number;area:Area;desbloqueo:string;descripcion:string;datos?:Record<string,number>;
}
export interface DefNivel {
 id:string;parte:1|2;area:Area;filas:number[];zombis:string[];banderas:number;
 tipo:'normal'|'cinta'|'minijuego'|'jefe';minijuego?:string;solInicial:number;
 premio?:{planta?:string;objeto?:string;nota?:string};lapidas?:number;materas?:[number,number][];
 niebla?:number;plantasFijas?:string[];dialogoAntes?:string;dialogoDespues?:string;
 /** Excepciones del tutorial; el resto usa banderas × 10. */
 oleadas?:number;enormes?:number[];
 fijos?:Record<number,Record<string,number>>;composicionCompleta?:boolean;
 pesosCinta?:Record<string,number>;primeraOleadaTrasPlantas?:number[];
 multiplicadorOleadas?:number;presupuesto?:number[];desdeOleada?:Record<string,number>;
 /** Datos funcionales del terreno; nunca coordenadas de dibujo de la interfaz. */
 filasAgua?:number[];sinSolCielo?:boolean;semillas?:string[];cinta?:string[];
 objetivo?:{fila:number;col:number;vida:number};
}
export interface PlantaPvZ {
 id:number;tipo:string;fila:number;col:number;x:number;vida:number;edad:number;capa:CapaPlanta;
 dormida:boolean;congelada:number;datos:Record<string,number>;
}
export interface ZombiPvZ {
 id:number;tipo:string;fila:number;x:number;vida:number;edad:number;sentido:-1|1;
 armadura:number;armaduraInicial:number;escudo:boolean;metal:boolean;
 lento:number;congelado:number;mantequilla:number;hipnotizado:boolean;
 comiendo:number|null;ceniza:boolean;sinBrazo:boolean;sinCabeza:boolean;datos:Record<string,number>;
 oleada:number;
}
export interface ProyectilPvZ {
 id:number;tipo:string;origen:number;fila:number;x:number;velocidad:number;dano:number;
 danoTipo:TipoDano;y?:number;velocidadY?:number;lento?:number;perforante?:boolean;impactados:number[];
}
export interface SolPvZ {id:number;fila:number;x:number;valor:number;edad:number;vida:number;origen:'cielo'|'planta'}
export interface CortacespedPvZ {fila:number;x:number;estado:'listo'|'activo'|'gastado'}
export interface EventoPvZ {
 t:'siembra'|'pala'|'sol'|'recogeSol'|'disparo'|'impacto'|'muerde'|'pierdeBrazo'|'pierdeCabeza'|
 'pierdeArmadura'|'explosion'|'muere'|'oleada'|'oleadaEnorme'|'ultimaOleada'|'cortacesped'|'fin'|
 'estado'|'abono'|'cinta'|'objetivo';
 id?:number;tipo?:string;fila?:number;col?:number;x?:number;cantidad?:number;oleada?:number;gano?:boolean;
}
export interface EstadoPvZ {
 version:1;nivel:string;t:number;pasos:number;sol:number;abono:number;oleada:number;
 terminado:''|'gano'|'perdio';plantas:PlantaPvZ[];zombis:ZombiPvZ[];proyectiles:ProyectilPvZ[];
 soles:SolPvZ[];cortacespedes:CortacespedPvZ[];recargas:Record<string,number>;cinta:{id:number;planta:string}[];
 objetivoVida?:number;eliminados:number;sembradas:number;
}
export interface OrdenPvZ {
 tipo:'plantar'|'pala'|'recoger'|'abono'|'plantarCinta';planta?:string;fila?:number;col?:number;id?:number;
}
export interface OpcionesMotorPvZ {
 semilla?:number;semillas?:string[];abono?:number;
 /** Una prueba unitaria puede desactivar el director; no concede recursos. */
 sinOleadas?:boolean;
}
