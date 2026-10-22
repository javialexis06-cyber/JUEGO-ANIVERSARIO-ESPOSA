export type Bando='plantas'|'zombis';
export type Dueno=Bando|'neutral';
export interface ConfigConquista {modo:'historia'|'pvp';ia:Bando[];semilla:number}
export interface PuestoConquista {ficha:string;fila:number;col:number}
export interface ZonaConquista {id:number;nombre:string;col:number;fila:number;dueno:Dueno;base:Bando|null;perfil:number;fortificacion:number;integridad:number;descanso:number;equipos:Record<Bando,string[]>;puestos:Record<Bando,PuestoConquista[]>}
export type RolConquista='tiro'|'produccion'|'muro'|'explosion'|'hielo'|'humo'|'devorar'|'mina'|'hipnosis'|'congelar'|'linea'|'triple'|'pinchos'|'fuego'|'escudo'|'luz'|'viento'|'estrella'|'iman'|'salto'|'vuelo'|'bailon'|'caja'|'vehiculo'|'minero';
export interface FichaConquista {id:string;nombre:string;bando:Bando;coste:number;vida:number;armadura:number;dano:number;intervalo:number;alcance:number;velocidad:number;recarga:number;descripcion:string;rol?:RolConquista;fusion?:[string,string];arte?:string}
export interface UnidadConquista {id:number;tipo:string;bando:Bando;fila:number;x:number;vida:number;armadura:number;reloj:number;lento:number;edad:number;especial:number}
export interface BalaConquista {id:number;bando:Bando;fila:number;x:number;dano:number;velocidad:number;hielo:boolean;aereo:boolean}
export interface FrenteConquista {id:number;zona:number;atacante:Bando;defensor:Bando;inicio:number;t:number;limite:number;nucleos:Record<Bando,number>;maximos:Record<Bando,number>;reservas:Record<Bando,number>;oleada:Record<Bando,number>;proxima:Record<Bando,number>;cabecera:number[];unidades:UnidadConquista[];balas:BalaConquista[];recargas:Record<string,number>;equipos:Record<Bando,string[]>;final:''|Bando;resultadoAplicado:boolean}
export interface AvisoConquista {id:number;t:number;texto:string;zona:number|null}
export interface EstadoConquista {v:1;config:ConfigConquista;ancho:number;alto:number;t:number;pasos:number;azar:number;proximo:number;zonas:ZonaConquista[];frentes:FrenteConquista[];reservas:Record<Bando,number>;siguienteAtaque:number;proximaIA:number;ganador:''|Bando|'empate';avisos:AvisoConquista[];capturas:Record<Bando,number>;relojManual:Record<Bando,number>;fusiones:boolean}
export type OrdenConquista=
 |{tipo:'atacar';zona:number;fuerza:30|60|90;equipo?:string[]}
 |{tipo:'formacion';zona:number;equipo:string[];puestos:PuestoConquista[]}
 |{tipo:'desplegar';frente:number;ficha:string;fila:number;col:number}
 |{tipo:'reforzar';frente:number}
 |{tipo:'fortificar';zona:number}|{tipo:'reparar';zona:number}
 |{tipo:'retirarse';frente:number};
export const otroBando=(b:Bando):Bando=>b==='plantas'?'zombis':'plantas';
