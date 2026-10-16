// Progreso nuevo compartido entre partidas: aplica resultados, maestría, desbloqueos y precios reales.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm,mkdir,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const out=process.argv[2]??'test-results/lavado-progresion',tmp=await mkdtemp(join(tmpdir(),'lavado-progresion-'));await mkdir(out,{recursive:true});
try{
 const archivo=join(tmp,'motor.mjs');await build({stdin:{contents:`export * from './src/casa/lavado/motor';export {botPaso} from './src/casa/lavado/bot';export * from './src/casa/lavado/progreso';export * from './src/casa/lavado/tienda';`,resolveDir:resolve(import.meta.dirname,'..')},bundle:true,platform:'node',format:'esm',outfile:archivo,logLevel:'silent'});
 const d=await import(pathToFileURL(archivo));const previo=process.env.REANUDAR?JSON.parse(await readFile(process.env.REANUDAR,'utf8')):null;let p=previo?.progreso??d.progresoNuevo('el');const mapas=['cara','lavamanos','banera','ducha'],partidas=previo?.partidas??[],compras=previo?.compras??[];
 const orden=['poder','vida','recuperacion','armadura','area','enfriamiento','iman','crecimiento','movimiento','duracion','velocidad','codicia','suerte','cantidad','revivir','tirar'];
 for(let k=partidas.length+1;k<=60&&!mapas.every(e=>p.ganados.includes(e));k++){
  let escenario=mapas.find(e=>d.escenarioAbierto(p,e)&&!p.ganados.includes(e))??'cara';
  if(k%4===0&&escenario!=='cara')escenario='cara';
  assert.ok(d.escenarioAbierto(p,escenario));p.escenario=escenario;
  const m=new d.Motor({escenario,apurado:false,semilla:19*7919+k*104729,jugadores:[{rol:'el',disfraz:p.disfraz,poderes:{...p.poderes},carta:p.carta||null,secretos:Object.keys(d.SECRETO_LOGRO).filter(id=>d.secretoAbierto(p,id)),cartas:d.cartasDe(p),maestria:d.maestriaDe(p,p.disfraz),patitos:{...(p.patitos[p.disfraz]??{})},llaves:[...p.llaves],cajitas:[...p.cajitas],reliquias:d.reliquiasDe(p),mapa:p.tesoros.includes('mapa'),monedero:p.tesoros.includes('monedero')}]});
  while(!m.fin&&m.t<31*60){d.botPaso(m);m.paso(1/30);}assert.ok(m.fin,'La partida llega a su final normal');
  const r=m.resumen(0);assert.ok(Number.isFinite(r.oro)&&r.oro>=0);const oroAntes=p.oro,nuevos=d.sumarPartida(p,r);d.sumarMaestria(p,r);assert.ok(p.oro>=oroAntes+r.oro);
  for(let n=0;n<200;n++){
   const id=orden.find(id=>(p.poderes[id]??0)<d.PODER[id].max&&d.tieneLogro(p,d.PODER[id].logro));if(!id)break;
   const precio=d.precioPoder(id,p.poderes);if(p.oro<precio)break;p.oro-=precio;p.gastado+=precio;p.poderes[id]=(p.poderes[id]??0)+1;compras.push({partida:k,id,precio});
  }
  assert.ok(p.oro>=0);assert.equal(p.gastado,compras.reduce((a,c)=>a+c.precio,0));p=d.normalizarProgresoLavado(JSON.parse(JSON.stringify(p)),'el');
  const registro={partida:k,escenario,gano:r.gano,segundos:r.segundos,oro:r.oro,poderes:{...p.poderes},abiertos:mapas.filter(e=>d.escenarioAbierto(p,e)),nuevos};partidas.push(registro);console.log(JSON.stringify(registro));
  await writeFile(`${out}/resultado.json`,JSON.stringify({partidas,compras,progreso:p,limites:'Simulación con bot de acciones legales; no comprueba controles ni guardado del navegador.'},null,2));
 }
 assert.ok(mapas.every(e=>p.ganados.includes(e)),'El piloto debe completar la ruta de cuatro mapas con los recursos que ganó; un fallo exige revisar la estrategia, no demuestra imposibilidad humana');
 console.log('OK cuatro mapas desbloqueados y ganados desde progreso nuevo; compras',compras.length,'partidas',partidas.length);
}finally{await rm(tmp,{recursive:true,force:true});}
