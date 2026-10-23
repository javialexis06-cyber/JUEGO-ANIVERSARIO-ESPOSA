import type {MotorPvZ} from '../motor/motor';

export const TABLERO_PVZ={ancho:1100,alto:650,x:165,y:156,casilla:80};
export function escalaVerticalPvZ(m:Pick<MotorPvZ,'filas'|'altoFila'|'nivel'>){return m.nivel.tablero?460/(m.filas*m.altoFila):.92;}

/** Proyección compartida por dibujo y entrada. El tablero nuevo ocupa el mismo campo
 * visual con cualquier cantidad de carriles; los niveles originales conservan sus píxeles. */
export function geometriaPvZ(m:Pick<MotorPvZ,'filas'|'altoFila'|'nivel'>){
 const escalaY=escalaVerticalPvZ(m);
 const altoFila=m.altoFila*escalaY;
 return{escalaY,altoFila,alto:altoFila*m.filas,escalaFiguras:Math.min(1,altoFila/78.2)};
}
