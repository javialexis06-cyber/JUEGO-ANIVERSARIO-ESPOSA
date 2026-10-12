import type {Zona} from './catalogo';
export type MovimientoSedal='sereno'|'zigzag'|'fondo'|'rafaga'|'ondulante'|'erratico';
export interface PerfilSedal {pez:string;movimiento:MovimientoSedal;amplitud:number;periodo:number;centro:number;ganancia:number;ventana:number}
export interface SesionPesca {
 id:number;pez:string;cebo:string;semilla:number;zona:Zona;region:string|null;dia:number;minutos:number;x:number;z:number;
 fase:'espera'|'picada'|'tiron'|'lista'|'escapo';espera:number;segundos:number;combate:number;
 jugador:number;progreso:number;tension:number;acierto:number;
}
export interface EstadoPesca {version:1;secuencia:number;actual:SesionPesca|null}
export type AccionPesca={tipo:'lanzar';cebo:string}|{tipo:'enganchar'|'cobrar'|'cancelar'};
