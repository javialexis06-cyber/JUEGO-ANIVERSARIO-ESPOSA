/** Xorshift32: generador local y reproducible; no usa el reloj ni Math.random. */
export class AzarPvZ {
 private s:number;
 constructor(semilla=23){if(!Number.isSafeInteger(semilla))throw new Error('Semilla inválida');this.s=semilla>>>0||1;}
 siguiente(){let s=this.s;s^=s<<13;s^=s>>>17;s^=s<<5;this.s=s>>>0;return this.s/4294967296;}
 entero(max:number){if(!Number.isSafeInteger(max)||max<1)throw new Error('Límite de azar inválido');return Math.floor(this.siguiente()*max);}
 entre(min:number,max:number){return min+(max-min)*this.siguiente();}
 get estado(){return this.s;}
}
