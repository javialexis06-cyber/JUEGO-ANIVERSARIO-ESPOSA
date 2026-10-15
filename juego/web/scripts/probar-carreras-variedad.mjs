// Recorridos del motor real: todos los circuitos, tres dificultades y los cuatro minijuegos contra la máquina.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,readFile,rm,writeFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const web=resolve(import.meta.dirname,'..'),tmp=await mkdtemp(join(tmpdir(),'carreras-variedad-')),out=process.argv[2]??'test-results/carreras-variedad';
await mkdir(out,{recursive:true});
try{
 const f=join(tmp,'motor.mjs');await build({stdin:{contents:`export * from './src/carreras/sim';export * from './src/carreras/pista';export * from './src/carreras/datos';`,resolveDir:web},bundle:true,platform:'node',format:'esm',outfile:f,logLevel:'silent'});
 const {Sim,Pista,VECINOS,DIFICULTADES,CIRCUITOS,ARENAS}=await import(pathToFileURL(f));
 const humano={...VECINOS[0],id:'piloto-prueba',nombre:'Piloto',criatura:'unicornio',carro:'carreta'};
 const corredores=[...VECINOS.slice(0,7).map(c=>({c,control:'ia',humano:false})),{c:humano,control:'local',humano:true}];
 const datos={};for(const id of [...CIRCUITOS,...ARENAS])datos[id]=JSON.parse(await readFile(join(web,`public/modelos/carreras/carreras_${id}.json`),'utf8'));
 const partidas=[],minijuegos=[];
 const correr=(s,segundos)=>{
  const mio=s.karts.at(-1),eventos={};
  for(let p=0;p<60*segundos&&!s.terminada;p++){
   s.pilotar(mio);if(s.t<0)mio.entrada.acel=0;s.paso();
   for(const ev of s.eventos.splice(0))eventos[ev.t]=(eventos[ev.t]??0)+1;
   if(p%120===0)assert.ok(s.karts.every(k=>[k.x,k.y,k.z,k.v,k.prog].every(Number.isFinite)));
  }
  assert.equal(s.terminada,true,'Debe terminar '+s.pista.d.id);
  assert.equal(new Set(s.orden).size,8);assert.equal(s.orden.length,8);
  assert.ok(s.karts.every(k=>k.terminado));return eventos;
 };
 for(const id of CIRCUITOS)for(const dif of Object.keys(DIFICULTADES))for(const semilla of [11,23]){
  const s=new Sim({pista:new Pista(datos[id]),corredores,ia:DIFICULTADES[dif].ia,semilla});
  const eventos=correr(s,600),k=s.karts.at(-1);
  assert.equal(k.vueltas.length,3);assert.ok(k.tiempo>0);
  if(semilla===23&&dif==='carrera'&&['valle','brasa','nieve','cielo'].includes(id)){
   const antes={valle:77.13333333333023,brasa:96.38333333332913,nieve:72.24999999999717,cielo:76.43333333333027};
   assert.ok(Math.abs(k.tiempo-antes[id])<.000001,'La física y el balance clásico deben conservarse');
  }
  partidas.push({id,dif,semilla,tiempo:k.tiempo,puesto:k.puesto+1,eventos});
  console.log('OK carrera',id,dif,semilla,Math.round(k.tiempo));
 }
 for(const tipo of ['globos','monedas','anillos','trucos'])for(const id of tipo==='globos'||tipo==='monedas'?ARENAS:CIRCUITOS){
  const s=new Sim({pista:new Pista(datos[id]),corredores,ia:DIFICULTADES.carrera.ia,semilla:23,minijuego:{tipo}});
  const eventos=correr(s,130),res=s.mini.resumen();
  assert.ok(res.puntos.every(Number.isFinite));assert.ok(res.puntos.every(n=>n>=0));
  assert.ok(res.globos.every(n=>n>=0&&n<=3));
  if(tipo==='globos')assert.ok(eventos.globo>0,'Los bots deben conseguir golpes en '+id);
  if(tipo==='monedas'||tipo==='anillos')assert.ok(res.puntos.some(n=>n>0),'Debe haber recogidas en '+id);
  if(tipo==='trucos')assert.ok(res.puntos.some(n=>n>0),'Debe haber trucos o miniturbos en '+id);
  const orden=[...s.orden],puntos=[...res.puntos];for(let j=0;j<120;j++)s.paso();
  assert.deepEqual(s.orden,orden);assert.deepEqual(s.mini.puntos,puntos);
  minijuegos.push({id,tipo,...res,eventos,orden});console.log('OK minijuego',tipo,id,JSON.stringify(res.puntos));
 }
 await writeFile(join(out,'motor.json'),JSON.stringify({partidas,minijuegos,limites:'Piloto automático normal; no mide precisión de controles ni red real.'},null,2));
 console.log(`OK ${partidas.length} carreras completas y ${minijuegos.length} minijuegos; resultados estables`);
}finally{await rm(tmp,{recursive:true,force:true});}
