import type { Parcela } from './estado';
export interface Invernadero {edificioId:string;parcelas:Parcela[];riegoAutomatico:boolean}
export const MAX_INVERNADEROS=30;
export const crearInvernadero=(edificioId:string):Invernadero=>({edificioId,parcelas:[],riegoAutomatico:false});
export const dentroInvernadero=(x:number,z:number)=>Number.isFinite(x)&&Number.isFinite(z)&&x>=-8&&x<8&&z>=-6&&z<6;
export const camaInvernadero=(x:number,z:number)=>Number.isInteger(x)&&Number.isInteger(z)&&((x>=-4&&x<=-2)||(x>=1&&x<=3))&&z>=-3&&z<=2;
export const CLIMA_INVERNADERO='templado' as const;
export const COSTE_RIEGO_INVERNADERO={monedas:300,materiales:{lingote_hierro:3,vidrio:6}};
