import type {Pila} from './inventario';
export type HechoCuaderno='obtener'|'capturar'|'fabricar'|'vender'|'donar'|'identificar';
export interface EstadoComunidad {
 version:1;secuencia:number;
 cuaderno:Record<string,Partial<Record<HechoCuaderno,{cantidad:number;dia:number}>>>;
 donaciones:{articulo:string;calidad:number;dia:number}[];vitrinas:(string|null)[];colecciones:string[];libros:string[];
 obras:{id:string;inicio:number;lista:number;abierta:boolean}[];
 tesoros:{articulo:string;dia:number}[];ultimoTesoro:number;
 trampas:{id:string;region:string;x:number;z:number;cebo:string;usos:number;ultimoDia:number;salida:Pila|null}[];
 terminales:string[];bultos:{id:string;desde:string;hasta:string;pila:Pila;envioDia:number;disponibleDia:number}[];
 exportadores:{cofre:string;caja:string;articulo:string;cantidad:number}[];
 pedidos:Record<string,number>;pausaDia:number;cargasRecogidas:number;
 eventos:{id:string;region:string;desde:number;hasta:number;estado:'pendiente'|'aplazado'|'visto';prioridad:number}[];
}
export type AccionComunidad=
 |{tipo:'obra'|'abrir_obra';id:string}|{tipo:'pausa'}
 |{tipo:'identificar';casilla:number}
 |{tipo:'donar';casilla:number}|{tipo:'vitrina';indice:number;articulo:string|null}|{tipo:'coleccion';id:string}|{tipo:'leer';id:string}
 |{tipo:'tesoro'}
 |{tipo:'trampa';cebo:string}|{tipo:'recoger_trampa'|'reparar_trampa'|'retirar_trampa';id:string}
 |{tipo:'terminal'}|{tipo:'despachar';hasta:string;casilla:number;cantidad:number}|{tipo:'recoger_bulto';id:string}
 |{tipo:'exportador';cofre:string;caja:string;articulo:string|null;cantidad:number}
 |{tipo:'pedido'}|{tipo:'evento';id:string;opcion:'aplazar'|'participar'};
