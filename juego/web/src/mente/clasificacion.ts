import { SUPABASE_URL, SUPABASE_CLAVE_PUBLICA } from '../casa/servidor';
import { clavePerfil } from './perfil';
import { retoDiario, type IdMental } from './catalogo';
export interface Marca {nombre:string;puntos:number;milisegundos:number;juego:IdMental}
export interface Envio {fecha:string;juego:IdMental;puntos:number;milisegundos:number;nombre:string}
interface Identidad {id:string;token:string}
const CLAVE=clavePerfil('patio-clasificacion-identidad-v1');
function identidad():Identidad {
 let guardada:Identidad|null=null;try{guardada=JSON.parse(localStorage.getItem(CLAVE)??'null');}catch{/* inválida */}
 if(guardada&&/^[a-f0-9-]{36}$/.test(guardada.id)&&/^[a-f0-9]{64}$/.test(guardada.token))return guardada;
 const nueva={id:crypto.randomUUID(),token:Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('')};
 // Sin almacenamiento no inventar una identidad distinta en cada reintento.
 localStorage.setItem(CLAVE,JSON.stringify(nueva));return nueva;
}
async function rpc(nombre:string,datos:unknown){
 const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nombre}`,{method:'POST',headers:{apikey:SUPABASE_CLAVE_PUBLICA,'Content-Type':'application/json'},body:JSON.stringify(datos),signal:AbortSignal.timeout(8000)});
 if(!r.ok){let codigo='';try{codigo=(await r.json()).code??'';}catch{/* respuesta no JSON */}
  if(codigo==='PGRST202'||codigo==='42P01')throw Error('La clasificación aún no está habilitada. Tu marca queda guardada en este dispositivo.');
  throw Error('No se pudo conectar con la clasificación. Tu marca sigue guardada; puedes reintentar.');}
 return r.json();
}
export async function tabla(fecha:string):Promise<Marca[]>{
 const filas=await rpc('patio_tabla',{p_fecha:fecha});
 if(!Array.isArray(filas))throw Error('La clasificación no respondió correctamente.');
 return filas.filter(f=>typeof f.nombre==='string'&&Number.isInteger(f.puntos)&&f.puntos>=0&&f.puntos<=10000&&Number.isInteger(f.milisegundos)&&f.milisegundos>=1000&&f.juego===retoDiario(fecha).juego.id).map(f=>({...f,nombre:f.nombre.slice(0,16)}));
}
export async function publicar(m:Envio){
 if(m.juego!==retoDiario(m.fecha).juego.id)throw Error('Solo el reto diario entra en la clasificación.');
 const i=identidad();
 await rpc('patio_publicar',{p_perfil:i.id,p_token:i.token,p_nombre:m.nombre,p_fecha:m.fecha,p_juego:m.juego,p_puntos:m.puntos,p_milisegundos:m.milisegundos});
}
