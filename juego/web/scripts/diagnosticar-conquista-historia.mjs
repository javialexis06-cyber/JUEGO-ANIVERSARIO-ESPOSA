/** Diagnóstico reproducible; una derrota del piloto no demuestra imposibilidad humana. */
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const temporal=await mkdtemp(join(tmpdir(),'presion-conquista-'));
const salida=resolve('test-results/conquista/presion-normal'),resultados=[];
try{
 const modulo=join(temporal,'motor.mjs');
 await build({stdin:{contents:`export * from './src/jardin/conquista/historia-motor';export * from './src/jardin/conquista/historia-piloto';`,resolveDir:process.cwd()},outfile:modulo,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const {HistoriaConquistaPvZ,crearPilotoHistoriaPvZ}=await import(pathToFileURL(modulo));
 for(const semilla of[23,41]){
  const m=new HistoriaConquistaPvZ(semilla),piloto=crearPilotoHistoriaPvZ(),observados=new WeakSet();
  const combates=[],acciones={plantar:0,recoger:0,quitar:0},picos=new Map(),vistos=new Set([8]);
  let maxFrentes=0,copias=0,ultimoAviso=0;const avisos=[];
  for(let i=0;i<60*12000&&!m.estado.ganador;i++){
   for(const z of m.activos){
    const local=m.defensas.observar(String(z.id));if(observados.has(local))continue;observados.add(local);
    for(const metodo of Object.keys(acciones)){
     const original=local[metodo].bind(local);
     local[metodo]=(...args)=>{const ok=original(...args);if(ok){acciones[metodo]++;const segundo=Math.floor(m.t);picos.set(segundo,(picos.get(segundo)??0)+1);}return ok;};
    }
   }
   const anteriores=new Map(m.activos.map(z=>[z.incursion.id,{zona:z.id,tipo:z.incursion.tipo}]));
   piloto(m);m.paso();maxFrentes=Math.max(maxFrentes,m.activos.length);
   for(const z of m.estado.zonas)if(z.dueno==='plantas')vistos.add(z.id);
   for(const [id,anterior]of anteriores)if(!m.activos.some(z=>z.incursion.id===id))combates.push({...anterior,t:m.t,gano:m.estado.zonas[anterior.zona].dueno==='plantas'});
   for(const aviso of m.estado.avisos)if(aviso.id>ultimoAviso){avisos.push({...aviso,t:m.t});ultimoAviso=aviso.id;}
   if(i%1800===0){const foto=m.exportar();assert.deepEqual(HistoriaConquistaPvZ.restaurar(JSON.parse(JSON.stringify(foto))).exportar(),foto);copias++;}
  }
  const resultado={semilla,incursiones:true,limiteSegundos:12000,t:m.t,ganador:m.estado.ganador||'límite de diagnóstico',maxFrentes,copias,
   recuperadasAlgunaVez:[...vistos],recuperadasAlFinal:m.estado.zonas.filter(z=>z.dueno==='plantas').map(z=>z.id),
   acciones,picoAccionesPorSegundo:Math.max(0,...picos.values()),combates,avisos};
  resultados.push(resultado);console.log(JSON.stringify({semilla,t:resultado.t,ganador:resultado.ganador,maxFrentes,copias,recuperadas:resultado.recuperadasAlFinal,acciones}));
 }
 await mkdir(salida,{recursive:true});
 await writeFile(join(salida,'resultado.json'),JSON.stringify({politica:'Conserva tipos en fronteras y usa equipos exclusivos. No concede soles, salud, desbloqueos ni pausas.',
  alcance:'Diagnóstico de dos semillas con decisiones automáticas legales; no certifica balance humano, todas las rutas ni el catálogo completo. Una derrota se registra, no se convierte en éxito ni en prueba de imposibilidad.',resultados},null,2));
}finally{await rm(temporal,{recursive:true,force:true});}
