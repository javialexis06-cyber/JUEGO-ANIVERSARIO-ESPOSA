/** Lectura de partidas externas: rechazar antes de usar datos, sin corregirlos ni perderlos. */
export function exigirPvZ(condicion:unknown,mensaje='Partida PvZ inválida'):asserts condicion{
 if(!condicion)throw new Error(mensaje);
}
export const numeroPvZ=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
export const enteroPvZ=(v:unknown,min=0,max=Number.MAX_SAFE_INTEGER):v is number=>Number.isSafeInteger(v)&&Number(v)>=min&&Number(v)<=max;
export const objetoPvZ=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
export function arbolPvZ(v:unknown){
 let nodos=0;
 const visitar=(x:unknown,profundidad:number)=>{
  exigirPvZ(++nodos<=250000&&profundidad<=24,'Partida PvZ demasiado grande');
  if(x===null||x===undefined||typeof x==='boolean'||typeof x==='string'){exigirPvZ(typeof x!=='string'||x.length<=20000);return;}
  if(typeof x==='number'){exigirPvZ(Number.isFinite(x));return;}
  if(Array.isArray(x)){exigirPvZ(x.length<=20000);for(const y of x)visitar(y,profundidad+1);return;}
  exigirPvZ(objetoPvZ(x));for(const [k,y]of Object.entries(x)){exigirPvZ(!['__proto__','constructor','prototype'].includes(k));visitar(y,profundidad+1);}
 };
 visitar(v,0);
}
/** Ordenar las claves evita depender del orden de construcción de las fichas. */
export function canonicoPvZ(v:unknown):string{
 if(Array.isArray(v))return '['+v.map(canonicoPvZ).join(',')+']';
 if(objetoPvZ(v))return '{'+Object.keys(v).filter(k=>v[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+canonicoPvZ(v[k])).join(',')+'}';
 return JSON.stringify(v);
}
