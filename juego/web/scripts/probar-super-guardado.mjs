// Guardado y sueldo reales del súper con escrituras rechazadas; no cambia precios ni premios.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const tmp=await mkdtemp(join(tmpdir(),'super-guardado-')),disco=new Map();let cortar=new Set();
globalThis.localStorage={getItem:k=>disco.get(k)??null,setItem(k,v){if(cortar.has(k))throw new DOMException('Sin espacio','QuotaExceededError');disco.set(k,v);},removeItem:k=>disco.delete(k)};
try{
 const f=join(tmp,'guardado.mjs');await build({stdin:{contents:`export * from './src/guardado';`,resolveDir:resolve(import.meta.dirname,'..')},bundle:true,platform:'node',format:'esm',outfile:f,logLevel:'silent',plugins:[{name:'perfil-aislado',setup(b){b.onResolve({filter:/^\.\/neutro$/},()=>({path:'perfil',namespace:'prueba'}));b.onLoad({filter:/.*/,namespace:'prueba'},()=>({contents:'export const modoAmigo=()=>globalThis.__superAmigo===true;'}));}}]});
 const {nueva,cargar,guardar,GuardadoSuper}=await import(pathToFileURL(f));const t={sitios:[{id:1,inicio:true,tamano:1,seccion:'frutas'}]},p=nueva(t),g=new GuardadoSuper();
 p.estrellas[1]=[true,true,true];p.dinero=98;cortar.add('supermania-jugable1');
 assert.equal(g.guardar(p,8),false);assert.equal(g.pendiente,true);assert.equal(cargar(t).dinero,0);assert.equal(localStorage.getItem('nuestro-hogar-sueldo'),null);
 console.log('OK día pendiente conserva estrellas/dinero y no paga antes de guardar');
 p.dinero=999; // La copia pendiente representa exactamente el resultado registrado.
 cortar.clear();assert.equal(g.confirmar(),true);assert.equal(cargar(t).dinero,98);assert.equal(localStorage.getItem('nuestro-hogar-sueldo'),'8');
 assert.equal(g.confirmar(),true);assert.equal(localStorage.getItem('nuestro-hogar-sueldo'),'8');assert.equal(g.pendiente,false);
 console.log('OK reintento confirma la copia y paga una sola vez');
 const p2=cargar(t);p2.dinero=150;cortar.add('nuestro-hogar-sueldo');assert.equal(g.guardar(p2,4),false);assert.equal(cargar(t).dinero,150);assert.equal(g.pendiente,true);
 cortar.clear();assert.equal(g.confirmar(),true);assert.equal(localStorage.getItem('nuestro-hogar-sueldo'),'12');assert.equal(g.confirmar(),true);assert.equal(localStorage.getItem('nuestro-hogar-sueldo'),'12');
 console.log('OK el sueldo fallido se recupera después del día guardado sin volver a sumarlo');
 const p3=cargar(t);p3.mejoras.zapatos=1;p3.gastadas=2;cortar.add('supermania-jugable1');assert.equal(g.guardar(p3),false);assert.equal(cargar(t).mejoras.zapatos,undefined);cortar.clear();assert.equal(g.confirmar(),true);assert.equal(cargar(t).mejoras.zapatos,1);assert.equal(cargar(t).gastadas,2);
 console.log('OK compra pendiente conserva el nivel y su coste único');
 globalThis.__superAmigo=true;const amigo=nueva(t);amigo.dinero=55;assert.equal(guardar(amigo),true);assert.equal(cargar(t).dinero,55);globalThis.__superAmigo=false;assert.equal(cargar(t).dinero,150);assert.equal(localStorage.getItem('nuestro-hogar-sueldo'),'12');
 console.log('OK casa y amigos conservan partidas independientes');
 let rechazar=true,pagado=0;const ajeno=new GuardadoSuper(()=>{if(rechazar)throw Error('Escritura fallida');return true;},n=>{pagado+=n;return true;});assert.equal(ajeno.guardar(p3,3),false);assert.equal(ajeno.pendiente,true);rechazar=false;assert.equal(ajeno.confirmar(),true);assert.equal(pagado,3);
 console.log('OK una excepción conserva la misma operación para reintentar');
}finally{await rm(tmp,{recursive:true,force:true});}
