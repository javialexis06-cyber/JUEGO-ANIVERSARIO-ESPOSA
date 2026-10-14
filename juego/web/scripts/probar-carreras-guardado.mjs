import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const dir=await mkdtemp(join(tmpdir(),'carreras-guardado-')),disco=new Map();let cortar=false,escritas=0;
globalThis.localStorage={getItem:k=>disco.get(k)??null,setItem(k,v){if(cortar)throw new DOMException('Sin espacio','QuotaExceededError');disco.set(k,v);escritas++;}};
try{
 const archivo=join(dir,'progreso.mjs');await build({stdin:{contents:`export * from './src/carreras/progreso';`,resolveDir:resolve(import.meta.dirname,'..')},bundle:true,platform:'node',format:'esm',outfile:archivo,logLevel:'silent'});
 const {GuardadoCarreras,leerProgreso,normalizarProgreso}=await import(pathToFileURL(archivo));
 // Es la copia real que produce una carrera normal antes de haber completado un contrarreloj.
 disco.set('amigo-carreras-progreso',JSON.stringify({records:{valle:{mejor:null,vuelta:24}},copas:{carrera:2}}));
 const g=new GuardadoCarreras(true),p=g.progreso;
 assert.equal(p.records.valle.mejor,Infinity);assert.equal(p.records.valle.vuelta,24);assert.equal(p.copas.carrera,2);
 console.log('✓ El null de una vuelta previa se recupera como tiempo aún no logrado');
 p.records.valle.mejor=77;p.records.valle.fantasma=[1,2,3,0];
 assert.equal(g.guardar(),true);assert.deepEqual(leerProgreso(true),p);
 console.log('✓ El primer contrarreloj y su fantasma sobreviven después de una carrera normal');
 const previo=leerProgreso(true);cortar=true;p.records.valle.mejor=75;p.copas.carrera++;
 assert.equal(g.guardar(),false);assert.equal(g.pendiente,true);assert.equal(g.confirmar(),false);
 assert.deepEqual(leerProgreso(true),previo);assert.equal(p.copas.carrera,3);
 console.log('✓ Una copa y un récord fallidos permanecen pendientes sin alterar lo guardado');
 p.records.nieve={mejor:70,vuelta:22,fantasma:[4,5,6,0]};cortar=false;
 assert.equal(g.confirmar(),true);assert.equal(g.pendiente,false);assert.deepEqual(leerProgreso(true),p);
 const antes=escritas;assert.equal(g.confirmar(),true);assert.equal(escritas,antes);assert.equal(p.copas.carrera,3);
 console.log('✓ Reintentar conserva las marcas más recientes y no vuelve a sumar la copa');
 const casa=new GuardadoCarreras(false);assert.deepEqual(casa.progreso.records,{});casa.progreso.copas.paseo=1;
 assert.equal(casa.guardar(),true);assert.deepEqual(leerProgreso(true),p);
 console.log('✓ Progreso de amigos y de la casa permanece separado');
 const viejo=normalizarProgreso({records:{valle:{mejor:77,vuelta:24,fantasma:[1,2,3,0]},brasa:{mejor:null,vuelta:null}},copas:{carrera:2}});
 assert.deepEqual(viejo.records.valle,{mejor:77,vuelta:24,fantasma:[1,2,3,0]});assert.equal(viejo.records.brasa.mejor,Infinity);assert.equal(viejo.records.brasa.vuelta,Infinity);assert.equal(viejo.copas.carrera,2);
 console.log('✓ Las marcas válidas, los fantasmas y las copas antiguas se conservan');
}finally{await rm(dir,{recursive:true,force:true});}
