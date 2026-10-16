import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const tmp=await mkdtemp(join(tmpdir(),'puertas-guardado-'));
try{
 const archivo=join(tmp,'guardado.mjs');await build({entryPoints:[resolve(import.meta.dirname,'../src/puertas/guardado.ts')],bundle:true,platform:'node',format:'esm',outfile:archivo,logLevel:'silent'});
 const {GuardadoPuertas}=await import(pathToFileURL(archivo)),mapa=new Map(),fallos=new Set();let escrituras=0;
 const disco={getItem:k=>mapa.get(k)??null,setItem(k,v){if(fallos.has(k))throw new DOMException('Sin espacio','QuotaExceededError');escrituras++;mapa.set(k,v);}};
 const g=new GuardadoPuertas(disco),p={hasta:1,estrellas:{1:3},vioInicio:true};fallos.add('cien-puertas');
 assert.equal(g.guardar(p,2),false);assert.equal(g.pendiente,true);assert.equal(mapa.size,0);p.hasta=999;
 fallos.clear();assert.equal(g.confirmar(),true);assert.equal(JSON.parse(mapa.get('cien-puertas')).hasta,1);assert.equal(mapa.get('nuestro-hogar-sueldo'),'2');
 const n=escrituras;assert.equal(g.confirmar(),true);assert.equal(escrituras,n);console.log('OK puerta rechazada conserva copia, estrellas y premio único');
 fallos.add('nuestro-hogar-sueldo');assert.equal(g.guardar({hasta:2,estrellas:{1:3,2:2}},3),false);assert.equal(JSON.parse(mapa.get('cien-puertas')).hasta,2);assert.equal(mapa.get('nuestro-hogar-sueldo'),'2');
 fallos.clear();assert.equal(g.confirmar(),true);assert.equal(mapa.get('nuestro-hogar-sueldo'),'5');assert.equal(g.pendiente,false);assert.equal(g.confirmar(),true);assert.equal(mapa.get('nuestro-hogar-sueldo'),'5');
 console.log('OK premio rechazado se recupera sin volver a registrar ni pagar la puerta');
 assert.equal(g.guardar({hasta:2,estrellas:{1:3,2:3}}),true);assert.equal(mapa.get('nuestro-hogar-sueldo'),'5');console.log('OK repetir una puerta actualiza estrellas sin añadir un premio');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new DOMException('Almacenamiento bloqueado','SecurityError');}});
 const bloqueado=new GuardadoPuertas();assert.equal(bloqueado.guardar({hasta:1},1),false);assert.equal(bloqueado.pendiente,true);
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:disco});assert.equal(bloqueado.confirmar(),true);assert.equal(bloqueado.pendiente,false);
 console.log('OK bloquear el acceso al almacenamiento permite iniciar y reintentar al recuperarlo');
}finally{await rm(tmp,{recursive:true,force:true});}
