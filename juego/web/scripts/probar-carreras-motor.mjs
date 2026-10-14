import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp,readFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const dir=await mkdtemp(join(tmpdir(),'carreras-motor-')),web=resolve(import.meta.dirname,'..');
try{
 const archivo=join(dir,'motor.mjs');
 await build({stdin:{contents:`export * from './src/carreras/sim';export * from './src/carreras/pista';export * from './src/carreras/datos';`,resolveDir:web},bundle:true,platform:'node',format:'esm',outfile:archivo,logLevel:'silent'});
 const {Sim,Pista,VECINOS,DIFICULTADES,ORDEN_PISTAS,PUNTOS}=await import(pathToFileURL(archivo));
 const humano={...VECINOS[0],id:'piloto-prueba',nombre:'Piloto',criatura:'unicornio',carro:'carreta'};
 const corredores=[...VECINOS.slice(0,7).map(c=>({c,control:'ia',humano:false})),{c:humano,control:'local',humano:true}], puntos=new Map(corredores.map(x=>[x.c.id,0]));
 for(const id of ORDEN_PISTAS){
  const pista=new Pista(JSON.parse(await readFile(join(web,`public/modelos/carreras/carreras_${id}.json`),'utf8')));
  const s=new Sim({pista,corredores,ia:DIFICULTADES.carrera.ia,semilla:23}),mio=s.karts.at(-1);
  const eventos={};
  for(let p=0;p<60*900&&!mio.terminado;p++){
   s.pilotar(mio);if(s.t<0)mio.entrada.acel=0;s.paso();
   for(const ev of s.eventos.splice(0))eventos[ev.t]=(eventos[ev.t]??0)+1;
   assert.ok(s.karts.every(k=>[k.x,k.y,k.z,k.v,k.prog].every(Number.isFinite)));
  }
  assert.equal(mio.terminado,true);assert.equal(mio.vueltas.length,3);assert.equal(s.terminada,true);
  assert.equal(new Set(s.orden).size,8);assert.equal(s.orden.length,8);
  assert.ok(s.karts.every(k=>k.tiempo>0&&Number.isFinite(k.tiempo)));
  for(let n=0;n<8;n++){const k=s.karts[s.orden[n]];puntos.set(k.c.id,puntos.get(k.c.id)+PUNTOS[n]);}
  console.log(JSON.stringify({pista:id,tiempo:mio.tiempo,vueltas:mio.vueltas,puesto:mio.puesto+1,eventos}));
 }
 assert.equal([...puntos.values()].reduce((a,b)=>a+b,0),4*PUNTOS.reduce((a,b)=>a+b,0));
 console.log('✓ Cuatro carreras de tres vueltas, puestos únicos y puntos del Gran Premio conservados');
}finally{await rm(dir,{recursive:true,force:true});}
