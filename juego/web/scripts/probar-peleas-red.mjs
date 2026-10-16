// El cierre cruza la ventana de 50 ms, exige transporte fiable y resiste fotos viejas/repetidas.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const tmp=await mkdtemp(join(tmpdir(),'peleas-red-'));
globalThis.location={search:''};
try{
 const archivo=join(tmp,'motor.mjs');await build({stdin:{contents:`export {crearLinea,fotoDe} from './src/peleas/red';export {Sim} from './src/peleas/sim';export {Bot} from './src/peleas/ia';export {elenco} from './src/peleas/luchadores';`,resolveDir:resolve(import.meta.dirname,'..')},bundle:true,platform:'node',format:'esm',outfile:archivo,logLevel:'silent',plugins:[{name:'sin-interfaz',setup(b){b.onResolve({filter:/(?:salas\/espera|vista\/escena)$/},a=>({path:a.path,namespace:'interfaz-prueba'}));b.onLoad({filter:/.*/,namespace:'interfaz-prueba'},()=>({contents:'export const ESCENARIOS={};export function esperarEnSala(){throw Error("No se usa interfaz en esta regresión");}'}));}}]});
 const {crearLinea,fotoDe,Sim,Bot,elenco}=await import(pathToFileURL(archivo));const defs=elenco(true).slice(2,4),s=new Sim({luchadores:defs,borde:8,semilla:9}),a=new Bot(0,7,11),b=new Bot(1,2,23);
 const handlers=new Map(),paquetes=[];let retiradas=0,reloj=100;globalThis.performance={now:()=>reloj};
 const sala={al:(k,f)=>{handlers.set(k,f);return()=>{handlers.delete(k);retiradas++;};},alCorte:()=>()=>retiradas++,alFin:()=>()=>retiradas++,alCambiar:()=>()=>retiradas++,mandar:(tipo,datos,o)=>paquetes.push({tipo,datos:structuredClone(datos),o})};
 const linea=crearLinea(sala,{id:'otro'}),espejo=linea.espejo(defs);linea.mandarFoto(s);assert.equal(paquetes.length,1);assert.equal(paquetes[0].o.rapido,true);const vieja=fotoDe(s,0);
 for(let n=0;n<60*600&&(s.fase!=='fin'||s.faseT<=100);n++)s.paso([a.decidir(s),b.decidir(s)]);assert.equal(s.fase,'fin');assert.ok(s.faseT>100);
 reloj=101;linea.mandarFoto(s);assert.equal(paquetes.length,2,'La ventana de 50 ms no debe ocultar el cierre');const cierre=paquetes[1];assert.equal(cierre.o.rapido,false,'El último estado necesita confirmación y reenvío');
 handlers.get('pe:f')(cierre.datos);assert.equal(espejo.fase,'fin');assert.ok(espejo.faseT>100);assert.equal(espejo.ganador,s.ganador);console.log('OK cierre fiable aun dentro de la ventana de 50 ms');
 handlers.get('pe:f')(vieja);assert.equal(espejo.fase,'fin');assert.equal(espejo.pasos,s.pasos);console.log('OK foto antigua no devuelve al invitado a una fase anterior');
 const evento=espejo.ultimoEvento;handlers.get('pe:f')(cierre.datos);handlers.get('pe:f')(cierre.datos);assert.equal(espejo.ultimoEvento,evento);assert.deepEqual(espejo.L.map(l=>l.rondas),s.L.map(l=>l.rondas));console.log('OK reenvíos conservan ganador, rondas y eventos únicos');
 linea.soltar();assert.equal(retiradas,5);assert.equal(handlers.size,0);console.log('OK la revancha retira los receptores de la pelea anterior');
  const tardia=crearLinea(sala,{id:'otro'});handlers.get('pe:f')(cierre.datos);handlers.get('pe:f')(vieja);const lento=tardia.espejo(defs);assert.equal(lento.fase,'fin');assert.ok(lento.faseT>100);assert.equal(lento.ganador,s.ganador);tardia.soltar();console.log('OK carga lenta conserva el final recibido antes de montar el espejo');
}finally{await rm(tmp,{recursive:true,force:true});}
