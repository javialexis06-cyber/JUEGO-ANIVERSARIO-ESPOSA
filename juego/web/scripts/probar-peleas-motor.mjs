import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const dir=await mkdtemp(join(tmpdir(),'peleas-motor-'));
try{
 const archivo=join(dir,'motor.mjs');await build({stdin:{contents:`export * from './src/peleas/sim';export * from './src/peleas/ia';export * from './src/peleas/luchadores';export {empacar,desempacar} from './src/peleas/tipos';`,resolveDir:resolve(import.meta.dirname,'..')},bundle:true,platform:'node',format:'esm',outfile:archivo,logLevel:'silent'});
 const {Sim,Bot,elenco,escalera,empacar,desempacar}=await import(pathToFileURL(archivo)),lista=elenco(true,'Piloto');
 for(const id of ['eliana','tarek','retador']){
  const yo=lista.find(d=>d.id===id),rivales=escalera(id,lista);let victorias=0;
  for(let k=0;k<rivales.length;k++){
   const op={luchadores:[yo,rivales[k]],borde:8,semilla:23};
   const s=new Sim(op),replica=new Sim(op),a=new Bot(0,7,7),b=new Bot(1,1+k*1.1,38);
   for(let n=0;n<60*600&&(s.fase!=='fin'||s.faseT<=100);n++){
    const e=[a.decidir(s),b.decidir(s)],recibidas=e.map(x=>desempacar(empacar(x)));assert.deepEqual(recibidas,e);
    s.paso(e);replica.paso(JSON.parse(JSON.stringify(recibidas)));
    assert.ok(s.L.every(l=>[l.x,l.y,l.vida,l.barra].every(Number.isFinite)&&l.vida>=0));
    if(n%180===0){const huella=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');assert.equal(huella(replica),huella(s),'Entradas serializadas deben producir el mismo combate');}
   }
   assert.equal(s.fase,'fin');assert.ok([-1,0,1].includes(s.ganador));assert.ok(s.L.every(l=>l.rondas>=0&&l.rondas<=2));
   victorias+=s.ganador===0?1:0;console.log(JSON.stringify({yo:id,rival:rivales[k].id,nivel:1+k*1.1,ganador:s.ganador,rondas:s.L.map(l=>l.rondas),pasos:s.pasos}));
  }
  console.log(JSON.stringify({yo:id,victorias,rivales:rivales.length}));
 }
 console.log('✓ Dieciocho combates completos y sus réplicas conservan estado, entradas y resultados');
}finally{await rm(dir,{recursive:true,force:true});}
