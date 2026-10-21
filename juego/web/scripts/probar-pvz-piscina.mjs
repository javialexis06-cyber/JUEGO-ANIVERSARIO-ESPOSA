/** Mundo 3: 30 partidas completas con selección de seis sobres y órdenes legales. No prueba interfaz. */
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const temporal=await mkdtemp(join(tmpdir(),'pvz-piscina-'));
const resultados=[];
try {
 const fichero=join(temporal,'piscina.mjs');
 await build({stdin:{contents:`
  export * from './src/jardin/pvz/motor/motor';
  export * from './src/jardin/pvz/motor/bot-piscina';
  export * from './src/jardin/pvz/datos/piscina';
  export * from './src/jardin/pvz/datos/niveles';
 `,resolveDir:resolve(import.meta.dirname,'..')},outfile:fichero,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const {MotorPvZ,crearPilotoPiscinaPvZ,seleccionPiscinaPvZ,NIVELES_PISCINA,semillasAntesDelNivel}=await import(pathToFileURL(fichero));
 assert.deepEqual(NIVELES_PISCINA.map(n=>n.id),Array.from({length:10},(_,i)=>`3-${i+1}`));
 assert.ok(NIVELES_PISCINA.every(n=>n.area==='piscina'&&n.filas.length===6&&n.filasAgua?.join(',')==='2,3'));
 const nivelFiltro=process.env.PVZ_NIVEL;
 const semillasPrueba=process.env.PVZ_SEMILLA?[Number(process.env.PVZ_SEMILLA)]:[1,23,108];
 const nivelesPrueba=NIVELES_PISCINA.filter(n=>!nivelFiltro||n.id===nivelFiltro);
 assert.ok(nivelesPrueba.length>0,'El filtro debe identificar un nivel de piscina');
 assert.ok(semillasPrueba.every(Number.isSafeInteger));
 for(const nivel of nivelesPrueba)for(const semilla of semillasPrueba){
  const disponibles=semillasAntesDelNivel(nivel.id),semillas=seleccionPiscinaPvZ(disponibles,nivel);
  assert.ok(semillas.length<=6);assert.ok(semillas.every(id=>disponibles.includes(id)));
  const m=new MotorPvZ(nivel,{semilla,semillas}),piloto=crearPilotoPiscinaPvZ();let finales=0,recogido=0,gastado=0,ordenes=0;
  const ordenar=m.ordenar.bind(m);
  m.ordenar=orden=>{
   assert.ok(['plantar','plantarCinta','pala','recoger'].includes(orden.tipo),'El piloto solo dispone de los controles ordinarios');
   const sol=orden.tipo==='recoger'?m.soles.find(s=>s.id===orden.id)?.valor??0:0;
   const costo=orden.tipo==='plantar'?m.plantasDef[orden.planta]?.sol??0:0;
   const ok=ordenar(orden);if(ok){ordenes++;recogido+=sol;gastado+=costo;}return ok;
  };
  for(let i=0;i<60*2400&&!m.terminado;i++){
   piloto(m);m.paso();finales+=m.eventos.filter(e=>e.t==='fin').length;
   assert.ok(m.sol>=0);assert.equal(m.sol,nivel.solInicial+recogido-gastado,'La campaña no concede sol fuera de las órdenes de recogida');
   assert.ok(m.zombis.every(z=>nivel.filas.includes(z.fila)));
   assert.equal(new Set(m.plantas.map(p=>`${p.fila}:${p.col}:${p.capa}`)).size,m.plantas.length);
  }
  const resultado={nivel:nivel.id,semilla,semillas,terminado:m.terminado,t:m.t,oleada:m.oleada,eliminados:m.eliminados,sembradas:m.sembradas,recogido,gastado,ordenes};
  resultados.push(resultado);
  if(m.terminado!=='gano'){
   const salida=resolve(import.meta.dirname,'../test-results/pvz/piscina');await mkdir(salida,{recursive:true});
   await writeFile(join(salida,`fallo-${nivel.id}-${semilla}.json`),JSON.stringify({resultado,estado:m.estado()},null,2));
  }
  assert.equal(m.terminado,'gano',`${nivel.id} semilla ${semilla}, oleada ${m.oleada}, tiempo ${m.t}`);assert.equal(finales,1);
  const antes=m.estado();m.paso();assert.deepEqual(m.estado(),antes);
  console.log('OK campaña acuática',nivel.id,'semilla',semilla,Math.round(m.t)+'s');
 }
 const salida=resolve(import.meta.dirname,'../test-results/pvz/piscina');await mkdir(salida,{recursive:true});
 await writeFile(join(salida,'resultado.json'),JSON.stringify({ok:true,campanas:resultados.length,pruebas:resultados},null,2));
 console.log('OK',resultados.length,'campañas acuáticas; piloto sin interfaz ni partidas del usuario');
}catch(error){
 const salida=resolve(import.meta.dirname,'../test-results/pvz/piscina');await mkdir(salida,{recursive:true});
 await writeFile(join(salida,'resultado.json'),JSON.stringify({ok:false,campanas:resultados.length,pruebas:resultados,error:String(error?.stack??error)},null,2));
 throw error;
}finally{await rm(temporal,{recursive:true,force:true});}
