// Motor y transporte reales, con demora, pérdida de fotos y duplicación de maniobras; no fuerza resultados.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const web=resolve(import.meta.dirname,'..'),tmp=await mkdtemp(join(tmpdir(),'carreras-red-'));
globalThis.location={search:''};let reloj=0;globalThis.performance={now:()=>reloj};
try{
 const f=join(tmp,'motor.mjs');await build({stdin:{contents:`export {RedCarrera} from './src/carreras/red';export {Sim} from './src/carreras/sim';export {Pista} from './src/carreras/pista';export {VECINOS} from './src/carreras/datos';`,resolveDir:web},bundle:true,platform:'node',format:'esm',outfile:f,logLevel:'silent',plugins:[{name:'sin-interfaz',setup(b){b.onResolve({filter:/(?:salas\/(?:sala|espera|carita)|sueltos\/comun|\.\/hud)$/},a=>({path:a.path,namespace:'prueba'}));b.onLoad({filter:/.*/,namespace:'prueba'},()=>({contents:'export const crearSala=()=>{};export const unirseSala=()=>{};export const normalizarCodigo=x=>x;export const esperarEnSala=()=>{};export const caritaSvg=()=>"";export const avisoSuelto=()=>{};export const escapar=x=>x;'}));}}]});
 const {RedCarrera,Sim,Pista,VECINOS}=await import(pathToFileURL(f));
 for(const cantidad of [2,4])for(const tipo of ['suelta','globos','monedas','anillos','trucos']){
  reloj=0;const id=tipo==='globos'||tipo==='monedas'?'arena_plaza':'valle',pista=JSON.parse(await readFile(join(web,`public/modelos/carreras/carreras_${id}.json`),'utf8'));
  const js=Array.from({length:cantidad},(_,i)=>({id:`j${i}`,puesto:i,tipo:'amigo',nombre:`Jugador ${i}`,aspecto:{cuerpo:'el'}}));
  const lista=VECINOS.slice(0,8).map((c,i)=>({j:i<cantidad?js[i].id:null,c})),cfg={modo:tipo==='suelta'?'suelta':'mini',pista:id,n:0,semilla:23,minijuego:tipo==='suelta'?undefined:{tipo,duracion:60},lista},cola=[],h=[],sims=[],redes=[],eventos=[],paquetes=[],finales=new Set();
  const enviar=(de,t,d,o={})=>{
   if(o.rapido&&Math.floor(reloj/17+de)%9===0)return;
   for(let a=0;a<cantidad;a++)if(a!==de&&(!o.a||o.a===js[a].id)){
    const p={de,a,t,d:JSON.parse(JSON.stringify(d)),cuando:reloj+35+(Math.floor(reloj/17+de+a)%5)*25};cola.push(p);
    if(t==='mini:maniobra')cola.push({...p,d:structuredClone(p.d),cuando:p.cuando+70});
    if(t==='f')paquetes.push(p);
   }
  };
  for(let yo=0;yo<cantidad;yo++){
   h.push(new Map());eventos.push([]);
   const sala={yo:js[yo],jugadores:js,soyAnfitrion:yo===0,hayAmigos:true,mandar:(...a)=>enviar(yo,...a),al:(t,fn)=>{h[yo].set(t,fn);return()=>h[yo].delete(t);},alCorte:()=>()=>{},alCambiar:()=>()=>{},alFin:()=>()=>{}};
   const s=new Sim({pista:new Pista(pista),corredores:lista.map((x,i)=>({c:x.c,humano:!!x.j,control:i===yo?'local':x.j?'remoto':yo===0?'ia':'remoto'})),ia:4,semilla:23,autoridad:yo===0,minijuego:cfg.minijuego});
   const red=new RedCarrera(sala,cfg);red.empezar(s,yo,e=>eventos[yo].push(e),()=>assert.fail('La sala no debe cerrarse sola'));sims.push(s);redes.push(red);
  }
  for(let tick=0;tick<(tipo==='suelta'?600:75)*60;tick++){
   reloj=tick/60*1000;
   for(let j=cola.length-1;j>=0;j--)if(cola[j].cuando<=reloj){const p=cola.splice(j,1)[0];h[p.a].get(p.t)?.(p.d,js[p.de]);if(p.t==='mini:maniobra'){const puntos=[...sims[0].mini.puntos];h[p.a].get(p.t)?.(p.d,js[p.de]);assert.deepEqual(sims[0].mini.puntos,puntos,'Repetir la misma maniobra no debe añadir puntos');}if(p.t==='fin')finales.add(p.a);}
   for(let yo=0;yo<cantidad;yo++){
    const s=sims[yo];s.pilotar(s.karts[yo]);if(s.t<0)s.karts[yo].entrada.acel=0;s.paso();redes[yo].paso();for(const ev of s.eventos)if(ev.t==='meta'&&ev.k===yo)redes[yo].meta(ev.tiempo);s.eventos=[];
   }
   for(let yo=1;yo<cantidad;yo++)if(!finales.has(yo))assert.equal(redes[yo].finalConfirmado(),false,'Llegar localmente no confirma el resultado de la sala');
   if(sims.every(s=>s.terminada)&&finales.size===cantidad-1)break;
  }
  const host=sims[0];assert.ok(host.terminada);if(host.mini)assert.ok(host.mini.puntos.some(x=>x>0),'Los jugadores o bots deben puntuar');
  for(let yo=1;yo<cantidad;yo++){
   const s=sims[yo];assert.ok(s.terminada,'El invitado debe recibir el final');assert.equal(redes[yo].finalConfirmado(),true);if(s.mini){assert.deepEqual(s.mini.resumen(),host.mini.resumen());assert.equal(eventos[yo].filter(e=>e.t==='meta').length,1);}assert.deepEqual(s.orden,host.orden);assert.deepEqual(s.karts.map(k=>k.tiempo),host.karts.map(k=>k.tiempo));
   const viejo=paquetes.find(p=>p.a===yo);h[yo].get('f')(viejo.d,js[0]);if(s.mini)assert.deepEqual(s.mini.resumen(),host.mini.resumen(),'Una foto antigua no sustituye el final');else assert.deepEqual(s.orden,host.orden);
  }
  for(const red of redes)red.detener();assert.ok(h.every(m=>m.size===0));
  console.log('OK sala',cantidad,tipo,'puntos y final idénticos, red demorada, fotos perdidas y maniobras repetidas',host.mini?.puntos.join(',')??host.orden.join(','));
 }
}finally{await rm(tmp,{recursive:true,force:true});}
