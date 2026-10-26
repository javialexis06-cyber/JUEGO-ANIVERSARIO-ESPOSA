/** Contrato no gráfico: unidades en píxeles y segundos; ids numéricos estables por partida. */
export type Area='dia'|'noche'|'piscina'|'niebla'|'tejado'|'rio'|'vias'|'desierto'|'paramo'|'invernadero';
export type CapaPlanta='base'|'principal'|'cubierta'|'temporal';
export type TipoDano='recto'|'lanzado'|'perforante'|'explosion'|'fuego'|'hielo'|'aplastar'|'salpicadura';
export interface DefPlanta {
 id:string;nombre:string;sol:number;recarga:number;vida:number;
 familia:'productora'|'tiradora'|'barrera'|'explosiva'|'lanzadora'|'hongo'|'apoyo'|'acuatica';
 nocturna?:boolean;agua?:'solo'|'tambien';soloTierra?:boolean;capa?:CapaPlanta;mejoraDe?:string;
 desbloqueo:string;descripcion:string;datos?:Record<string,number>;
}
export interface DefZombi {
 id:string;nombre:string;vida:number;armadura?:{tipo:'casco'|'escudo';vida:number;metal?:boolean};
 velocidad:number;mordida:number;comestible?:boolean;agua?:'solo'|'tambien';area:Area;desbloqueo:string;descripcion:string;datos?:Record<string,number>;
}
export interface DefNivel {
 id:string;parte:1|2;area:Area;filas:number[];zombis:string[];banderas:number;
 /** Carriles físicos del escenario. `filas` indica cuáles están abiertos al combate.
  * Ausente en los niveles originales para conservar su geometría de cinco/seis carriles. */
 tablero?:{filas:number};
 tipo:'normal'|'cinta'|'minijuego'|'jefe';minijuego?:string;solInicial:number;
 premio?:{planta?:string;objeto?:string;nota?:string};lapidas?:number;materas?:[number,number][];
 niebla?:number;tormenta?:boolean;plantasFijas?:string[];dialogoAntes?:string;dialogoDespues?:string;
 /** Excepciones del tutorial; el resto usa banderas × 10. */
 oleadas?:number;enormes?:number[];
 fijos?:Record<number,Record<string,number>>;composicionCompleta?:boolean;
 pesosCinta?:Record<string,number>;atenuarCinta?:Record<string,{cantidad:number;pesoFinal:number}>;maximosCinta?:Record<string,number>;distribucionLapidas?:Record<number,number>;primeraOleadaTrasPlantas?:number[];
 multiplicadorOleadas?:number;presupuesto?:number[];desdeOleada?:Record<string,number>;
 /** Datos funcionales del terreno; nunca coordenadas de dibujo de la interfaz. */
 filasAgua?:number[];sinSolCielo?:boolean;semillas?:string[];cinta?:string[];
 presionCinta?:boolean;emboscadaAgua?:boolean;cortacespedAgua?:boolean;
 objetivo?:{fila:number;col:number;vida:number};
 /** Tejado: sin cortacéspedes (no hay limpiatejados), macetas iniciales por columnas, caída final desde el cielo,
  * oleadas traídas por zombis colgados, noche sobre el tejado, sobres iniciales de la cinta y jefe del nivel. */
 /** Reglas completas de la cinta de PC (sobres repetidos, último sobre y reglas del jefe). */
 cintaPC?:boolean;
 sinCortacespedes?:boolean;macetas?:number;emboscadaCielo?:number;bombardeo?:boolean;nocturno?:boolean;cintaInicial?:string[];jefe?:string;
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
 danoTipo:TipoDano;aereo?:boolean;y?:number;velocidadY?:number;lento?:number;perforante?:boolean;hasta?:number;antorchas?:number[];impactados:number[];
 /** Tiro parabólico: sale en `salida`, cae en `llegada` sobre el zombi `objetivo` (o la casilla `destinoCol` si lo lanza un zombi). */
 objetivo?:number;salida?:number;llegada?:number;desdeX?:number;destinoX?:number;destinoCol?:number;enemigo?:boolean;mantequilla?:number;
}
export interface LapidaPvZ {id:number;fila:number;col:number;x:number}
export interface CraterPvZ {id:number;fila:number;col:number;x:number;vida:number}
export interface ZonaPvZ {id:number;tipo:'hielo';origen:number;fila:number;desde:number;hasta:number;vida:number}
export interface PistaHieloPvZ {id:number;fila:number;desde:number;hasta:number;vida:number}
export interface JarronPvZ {id:number;fila:number;col:number;x:number;verde:boolean;contenido?:{planta?:string;zombi?:string;sol?:number}}
export interface SobrePvZ {id:number;planta:string;fila:number;x:number;vida:number}
export interface NieblaPvZ {desde:number;desplazamiento:number;retirada:number;claras:[number,number][]}
export interface TormentaPvZ {variante:1|2|3;restante:number;claridad:number}
export interface SolPvZ {id:number;fila:number;x:number;valor:number;edad:number;vida:number;origen:'cielo'|'planta'|'moneda'}
export interface CortacespedPvZ {fila:number;x:number;estado:'listo'|'activo'|'gastado'}
export interface EventoPvZ {
 t:'siembra'|'pala'|'sol'|'recogeSol'|'disparo'|'impacto'|'muerde'|'pierdeBrazo'|'pierdeCabeza'|
 'pierdeArmadura'|'explosion'|'muere'|'oleada'|'oleadaEnorme'|'ultimaOleada'|'cortacesped'|'fin'|
 'estado'|'abono'|'cinta'|'objetivo'|'zona'|'terreno'|'martillo'|'jarron'|'sobre';
 id?:number;tipo?:string;fila?:number;col?:number;x?:number;cantidad?:number;oleada?:number;gano?:boolean;origen?:number;duracion?:number;hasta?:number;proyectil?:string;
}
export interface EstadoPvZ {
 version:1;nivel:string;t:number;pasos:number;sol:number;abono:number;oleada:number;
 terminado:''|'gano'|'perdio';plantas:PlantaPvZ[];zombis:ZombiPvZ[];proyectiles:ProyectilPvZ[];
 soles:SolPvZ[];cortacespedes:CortacespedPvZ[];recargas:Record<string,number>;cinta:{id:number;planta:string}[];
 jarrones?:JarronPvZ[];sobres?:SobrePvZ[];etapaJarrones?:number;niebla?:NieblaPvZ;tormenta?:TormentaPvZ;zonas?:ZonaPvZ[];lapidas?:LapidaPvZ[];crateres?:CraterPvZ[];pistasHielo?:PistaHieloPvZ[];objetivoVida?:number;eliminados:number;sembradas:number;
 /** Monedas recogidas en esta partida (Margarita). */
 monedas?:number;
}
export interface OrdenPvZ {
 tipo:'plantar'|'pala'|'recoger'|'abono'|'plantarCinta'|'golpear'|'romperJarron'|'plantarSobre';planta?:string;fila?:number;col?:number;id?:number;
}
export interface OpcionesMotorPvZ {
 semilla?:number;semillas?:string[];abono?:number;
 /** Una prueba unitaria puede desactivar el director; no concede recursos. */
 sinOleadas?:boolean;
}
