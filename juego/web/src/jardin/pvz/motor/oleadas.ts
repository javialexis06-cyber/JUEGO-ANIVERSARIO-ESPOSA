import type {DefNivel,DefZombi} from '../tipos';
import {AzarPvZ} from './azar';
export interface AparicionPvZ {tipo:string;fila:number;x:number;oleada:number}
export interface SituacionOleada {vida:number;inicial:number;pendientes:number;plantas:number}
/** Director parametrizado. No decide por el nombre del nivel ni depende de la vista. */
export class DirectorOleadasPvZ {
 readonly total:number;readonly enormes:number[];
 actual=0;private siguiente=18;private lanzada=-Infinity;private aviso=false;
 constructor(readonly nivel:DefNivel,private azar:AzarPvZ,private defs:Readonly<Record<string,DefZombi>>){
  if(nivel.presupuesto?.some(p=>!Number.isSafeInteger(p)||p<0||p>300)||nivel.multiplicadorOleadas!==undefined&&(!Number.isSafeInteger(nivel.multiplicadorOleadas)||nivel.multiplicadorOleadas<1||nivel.multiplicadorOleadas>10))throw new Error('Presupuesto inválido');
  for(const [id,d]of Object.entries(defs))if(d.datos?.puntos!==undefined&&(!Number.isSafeInteger(d.datos.puntos)||d.datos.puntos<1)||d.datos?.peso!==undefined&&(!Number.isFinite(d.datos.peso)||d.datos.peso<=0))throw new Error('Peso inválido: '+id);
  for(const tipos of Object.values(nivel.fijos??{}))for(const [id,cantidad]of Object.entries(tipos))if(!Object.hasOwn(defs,id)||!Number.isSafeInteger(cantidad)||cantidad<0||cantidad>300)throw new Error('Aparición fija inválida');
  this.total=nivel.oleadas??nivel.banderas*10;
  this.enormes=nivel.enormes??Array.from({length:nivel.banderas},(_,i)=>Math.min(this.total,(i+1)*10));
  if(nivel.banderas===1&&this.total<10&&!nivel.enormes)this.enormes=[this.total];
  if(!Number.isSafeInteger(this.total)||this.total<1||this.total>1000||this.enormes.some(x=>!Number.isInteger(x)||x<1||x>this.total))throw new Error('Oleadas inválidas');
 }
 paso(t:number,s:SituacionOleada):{aviso:boolean;apariciones:AparicionPvZ[];enorme:boolean;ultima:boolean}|null {
  if(this.actual>=this.total)return null;
  const requisito=this.nivel.primeraOleadaTrasPlantas?.[this.actual];if(requisito!==undefined&&s.plantas<requisito)return null;
  // La vida de referencia pertenece solo a la oleada actual; nunca a todos los enemigos acumulados.
  const anticipar=this.actual>0&&t-this.lanzada>=4.01&&s.pendientes===0&&s.inicial>0&&s.vida<=s.inicial*.5;
  if(anticipar)this.siguiente=Math.min(this.siguiente,t+2);
  const enorme=this.enormes.includes(this.actual+1);
  if(enorme&&!this.aviso&&t>=this.siguiente-2){this.aviso=true;return{aviso:true,apariciones:[],enorme:true,ultima:this.actual+1===this.total};}
  if(t<this.siguiente)return null;
  this.actual++;this.lanzada=t;this.siguiente=t+this.azar.entre(25,31);this.aviso=false;
  const fijos=this.nivel.fijos?.[this.actual]??{};
  const apariciones:AparicionPvZ[]=[];
  for(const [tipo,cantidad] of Object.entries(fijos))for(let k=0;k<cantidad;k++)apariciones.push(this.aparicion(tipo));
  if(!this.nivel.composicionCompleta){
   // Presupuesto de PvZ 1; toda aparición fija se descuenta antes de rellenar con elecciones aleatorias.
   // No se afirma que reproduzca cada detalle del ejecutable original.
   let puntos=this.nivel.presupuesto?.[this.actual-1]??Math.max(1,Math.floor(Math.ceil(this.actual/3)*(enorme?2.5:1)));

   const grupo=(tipo:string)=>tipo==='zombi'||tipo==='zombi-bandera';
   for(const [tipo,cantidad] of Object.entries(fijos))if(grupo(tipo))puntos-=cantidad*(this.defs[tipo].datos?.puntos??1);
   puntos=Math.max(0,puntos)*(this.nivel.multiplicadorOleadas??1);
   for(const [tipo,cantidad] of Object.entries(fijos))if(!grupo(tipo))puntos-=cantidad*(this.defs[tipo].datos?.puntos??1);
   while(puntos>0){const posibles=this.nivel.zombis.filter(id=>(this.nivel.desdeOleada?.[id]??1)<=this.actual&&(this.defs[id].datos?.puntos??1)<=puntos);if(!posibles.length)break;
    const pesos=posibles.map(id=>this.defs[id].datos?.peso??1),suma=pesos.reduce((a,b)=>a+b,0);let dado=this.azar.siguiente()*suma,i=0;while(i<pesos.length-1&&dado>=pesos[i])dado-=pesos[i++];const tipo=posibles[i];apariciones.push(this.aparicion(tipo));puntos-=this.defs[tipo].datos?.puntos??1;
   }
  }
  return{aviso:false,apariciones,enorme,ultima:this.actual===this.total};
 }
 private aparicion(tipo:string):AparicionPvZ{return{tipo,fila:this.nivel.filas[this.azar.entero(this.nivel.filas.length)],x:this.azar.entre(760,800),oleada:this.actual};}
 get terminado(){return this.actual>=this.total;}
}
