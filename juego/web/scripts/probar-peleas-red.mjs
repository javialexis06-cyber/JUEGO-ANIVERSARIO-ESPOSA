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
 const archivo=join(tmp,'motor.mjs');await build({stdin:{contents:`export {crearLinea,fotoDe,Espejo} from './src/peleas/red';export {Sim} from './src/peleas/sim';export {Bot} from './src/peleas/ia';export {elenco} from './src/peleas/luchadores';export {NADA} from './src/peleas/tipos';export {POSES,poseQ,HUESOS} from './src/peleas/poses';`,resolveDir:resolve(import.meta.dirname,'..')},bundle:true,platform:'node',format:'esm',outfile:archivo,logLevel:'silent',plugins:[{name:'sin-interfaz',setup(b){b.onResolve({filter:/(?:salas\/espera|vista\/escena)$/},a=>({path:a.path,namespace:'interfaz-prueba'}));b.onLoad({filter:/.*/,namespace:'interfaz-prueba'},()=>({contents:'export const ESCENARIOS={};export function esperarEnSala(){throw Error("No se usa interfaz en esta regresión");}'}));}}]});
 const {crearLinea,fotoDe,Espejo,Sim,Bot,elenco,NADA,POSES,poseQ,HUESOS}=await import(pathToFileURL(archivo));const defs=elenco(true).slice(2,4),s=new Sim({luchadores:defs,borde:8,semilla:9}),a=new Bot(0,7,11),b=new Bot(1,2,23);
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
 for(const nombre of Object.keys(POSES))for(const lado of [false,true]){
  const p=poseQ(nombre,lado);assert.equal(p.q.size,HUESOS.length);
  for(const q of p.q.values()){assert.ok(q.toArray().every(Number.isFinite));assert.ok(Math.abs(q.length()-1)<1e-6);}
 }
 const faltantes=new Set();for(const def of elenco(true))for(const g of Object.values(def.golpes))for(const n of [g.pose,g.poseCarga].filter(Boolean))if(!POSES[n])faltantes.add(n);assert.deepEqual([...faltantes],[],'Todas las poses de golpes deben existir en Blender');
 console.log('OK biblioteca de Blender completa, cuaterniones normalizados y ambos lados');
 for(const fps of [30,60,120]){
  const host=new Sim({luchadores:defs,borde:8,semilla:9,sinPresentacion:true});
  while(host.fase!=='pelea')host.paso([NADA,NADA]);
  const copia=JSON.stringify(host.fotoMovimiento()),m=new Espejo(defs),f=fotoDe(host,0);f.ack=0;m.recibir(f);
  const x=m.L[1].x,e={...NADA,h:-1};m.avanzar(1/fps,e);
  if(fps===120)m.avanzar(1/fps,e);
  assert.ok(m.L[1].x<x,'El invitado se mueve sin esperar otro paquete');
  const vidas=m.L.map(p=>p.vida),barras=m.L.map(p=>p.barra);
  for(let i=0;i<fps;i++)m.avanzar(1/fps,{...e,a:true});
  assert.deepEqual(m.L.map(p=>p.vida),vidas);assert.deepEqual(m.L.map(p=>p.barra),barras);
  const quieto=m.L[1].x;for(let i=0;i<fps;i++)m.avanzar(1/fps,e);assert.equal(m.L[1].x,quieto,'Sin fotos deja de extrapolar tras 250 ms');
  assert.equal(JSON.stringify(host.fotoMovimiento()),copia,'Predecir no modifica al anfitrión');
  f.pa+=20;f.ack=m.secuencia;f.mov[1].estado='golpeado';f.mov[1].t=0;f.mov[1].dur=40;f.mov[1].vx=0;f.L[1][5]=8;f.L[1][9]-=50;
  m.recibir(f);assert.equal(m.L[1].vida,vidas[1]-50);assert.equal(m.L[1].estado,'golpeado');m.avanzar(1/fps,e);assert.equal(m.L[1].estado,'golpeado','La predicción respeta el impacto confirmado');
  m.suspender();const secuencia=m.secuencia;m.avanzar(0,e);assert.equal(m.secuencia,secuencia);
  const fin=structuredClone(f);fin.pa++;fin.f=6;fin.ft=101;fin.g=0;fin.ack=m.secuencia;m.recibir(fin);m.avanzar(1/fps,e);assert.equal(m.fase,'fin');assert.equal(m.ganador,0);
  console.log('OK predicción inmediata, corte, impacto y fin a',fps,'FPS');
 }

 for(const demora of [6,12]){
  const host=new Sim({luchadores:defs,borde:8,sinPresentacion:true});while(host.fase!=='pelea')host.paso([NADA,NADA]);
  const m=new Espejo(defs),primera=fotoDe(host,0);primera.ack=0;m.recibir(primera);const cola=[];let entrada=NADA,ack=0;
  for(let tick=1;tick<=300;tick++){
   const e={...NADA,h:tick>=30&&tick<100?1:0};m.avanzar(1/60,e);
   cola.push({tick:tick+demora,tipo:'entrada',e,n:m.secuencia});
   for(let j=cola.length-1;j>=0;j--)if(cola[j].tick<=tick){const p=cola.splice(j,1)[0];if(p.tipo==='entrada'){if(p.n>=ack){entrada=p.e;ack=p.n;}}else m.recibir(p.f);}
   host.paso([NADA,entrada]);
   if(tick%3===0&&tick%21!==0){const f=fotoDe(host,0);f.ack=ack;cola.push({tick:tick+demora+(tick%4),tipo:'foto',f});}
   assert.ok(Number.isFinite(m.L[1].x));assert.ok(Math.abs(m.L[1].x)<=8);
  }
  assert.ok(Math.abs(m.L[1].x-host.L[1].x)<.03,'Al soltar no queda deriva después de reconciliar');
  assert.deepEqual(m.L.map(p=>p.vida),host.L.map(p=>p.vida));console.log('OK reconciliación con',demora/60*1000,'ms por trayecto, jitter y fotos perdidas');
 }
 const ordenada=crearLinea(sala,{id:'otro'});handlers.get('pe:e')({e:1,n:20},{id:'otro'});const nueva=ordenada.entrada();handlers.get('pe:e')({e:0,n:19},{id:'otro'});assert.deepEqual(ordenada.entrada(),nueva);handlers.get('pe:e')({e:0,n:21},{id:'ajeno'});assert.deepEqual(ordenada.entrada(),nueva);ordenada.soltar();console.log('OK controles antiguos o de otro jugador no sustituyen los actuales');

 const revancha=crearLinea(sala,{id:'otro'},77);handlers.get('pe:f')({...cierre.datos,sesion:76},{id:'otro'});const nuevaPelea=revancha.espejo(defs);assert.equal(nuevaPelea.fase,'presentacion');handlers.get('pe:f')({...cierre.datos,sesion:77},{id:'otro'});assert.equal(nuevaPelea.fase,'fin');revancha.soltar();console.log('OK una foto tardía de la pelea anterior no contamina la revancha');

}finally{await rm(tmp,{recursive:true,force:true});}
