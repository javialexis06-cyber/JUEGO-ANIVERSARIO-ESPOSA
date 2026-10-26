/** Mundo 5 (tejado): partidas completas con el piloto y órdenes legales. Mide victorias; no certifica el balance. */
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const temporal=await mkdtemp(join(tmpdir(),'pvz-tejado-campana-'));
const resultados=[];
try{
 const fichero=join(temporal,'tejado.mjs');
 await build({stdin:{contents:"export * from './src/jardin/pvz/motor/motor';export * from './src/jardin/pvz/motor/bot';export * from './src/jardin/pvz/datos/tejado';export * from './src/jardin/pvz/datos/niveles';",resolveDir:resolve(import.meta.dirname,'..')},outfile:fichero,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const {MotorPvZ,crearPilotoPvZ,seleccionPilotoPvZ,NIVELES_TEJADO,semillasAntesDelNivel}=await import(pathToFileURL(fichero));
 const semillasPrueba=process.env.PVZ_SEMILLA?[Number(process.env.PVZ_SEMILLA)]:[1,23,108,7,42];
 const niveles=NIVELES_TEJADO.filter(n=>!process.env.PVZ_NIVEL||n.id===process.env.PVZ_NIVEL);
 for(const nivel of niveles)for(const semilla of semillasPrueba){
  const disponibles=semillasAntesDelNivel(nivel.id),semillas=seleccionPilotoPvZ(disponibles,nivel);
  assert.ok(semillas.length<=6);assert.ok(semillas.every(id=>disponibles.includes(id)),'solo premios ya ganados');
  const m=new MotorPvZ(nivel,{semilla,semillas}),piloto=crearPilotoPvZ();let recogido=0,gastado=0,monedas=0,finales=0;
  const ordenar=m.ordenar.bind(m);
  m.ordenar=orden=>{
   assert.ok(['plantar','plantarCinta','pala','recoger'].includes(orden.tipo),'solo controles ordinarios');
   const s=orden.tipo==='recoger'?m.soles.find(s=>s.id===orden.id):undefined;
   const costo=orden.tipo==='plantar'?m.plantasDef[orden.planta]?.sol??0:0;
   const ok=ordenar(orden);if(ok){if(s?.origen==='moneda')monedas+=s.valor;else if(s)recogido+=s.valor;gastado+=costo;}return ok;
  };
  for(let i=0;i<60*2400&&!m.terminado;i++){
   piloto(m);m.paso();finales+=m.eventos.filter(e=>e.t==='fin').length;
   assert.equal(m.sol,nivel.solInicial+recogido-gastado,'el sol solo sale de lo recogido');assert.equal(m.monedas,monedas,'las monedas no son sol');
  }
  assert.ok(['gano','perdio'].includes(m.terminado),nivel.id+' termina');assert.equal(finales,1);
  const antes=JSON.stringify(m.estado());for(let i=0;i<120;i++)m.paso();assert.equal(JSON.stringify(m.estado()),antes,'inmutable tras el fin');
  resultados.push({nivel:nivel.id,semilla,resultado:m.terminado,t:Math.round(m.t),oleada:m.oleada,semillas});
  console.log(nivel.id,semilla,m.terminado,Math.round(m.t)+'s');
 }
 const resumen=Object.fromEntries(niveles.map(n=>[n.id,resultados.filter(r=>r.nivel===n.id&&r.resultado==='gano').length+'/'+resultados.filter(r=>r.nivel===n.id).length]));
 console.log('victorias del piloto',resumen);
 // Los ocho niveles normales tienen al menos una victoria con órdenes legales; 5-5 y 5-10 se registran sin exigirla.
 if(!process.env.PVZ_SEMILLA&&!process.env.PVZ_NIVEL)for(const n of niveles)if(!n.cinta)assert.ok(resultados.some(r=>r.nivel===n.id&&r.resultado==='gano'),n.id+' ganable con órdenes legales');
 const salida=resolve(import.meta.dirname,'../test-results/pvz/tejado');await mkdir(salida,{recursive:true});
 await writeFile(join(salida,'resultado.json'),JSON.stringify({resumen,resultados},null,1));
}finally{await rm(temporal,{recursive:true,force:true});}
