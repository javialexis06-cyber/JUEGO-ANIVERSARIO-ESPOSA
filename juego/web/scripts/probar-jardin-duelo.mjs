// Reglas del modo nuevo, ambas victorias y autoridad de red. No concede estrellas ni modifica la campaña.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const tmp=await mkdtemp(join(tmpdir(),'jardin-duelo-'));
try{
 const f=join(tmp,'duelo.mjs');await build({stdin:{contents:"export * from './src/jardin/duelo-motor';export * from './src/jardin/duelo-red';export {crearBotJardin,MotorJardin} from './src/jardin/motor';export {NIVELES_JARDIN} from './src/jardin/datos';",resolveDir:resolve(import.meta.dirname,'..')},bundle:true,platform:'node',format:'esm',outfile:f,logLevel:'silent'});
 const {MotorDuelo,RedDuelo,EspejoDuelo,RECLUTAS,DURACION_DUELO,ordenSegura,crearBotJardin,MotorJardin,NIVELES_JARDIN}=await import(pathToFileURL(f));
 const avanzar=(m,s)=>{for(let i=0;i<30*s;i++)m.paso();};
 const m=new MotorDuelo();assert.equal(m.ordenar('zombis',{tipo:'enviar',zombi:'remiendo',fila:0}),false);
 assert.equal(m.ordenar('zombis',{tipo:'plantar',planta:'frijol',fila:0,col:0}),false);
 assert.equal(m.ordenar('plantas',{tipo:'enviar',zombi:'remiendo',fila:0}),false);
 for(const a of [{tipo:'enviar',zombi:'__proto__',fila:0},{tipo:'plantar',planta:'frijol',fila:NaN,col:0},{tipo:'quitar',fila:0,col:8}])assert.equal(ordenSegura(a),false);
 avanzar(m,21);const nube=m.niebla;assert.ok(m.ordenar('zombis',{tipo:'enviar',zombi:'remiendo',fila:0}));assert.equal(m.niebla,nube-RECLUTAS.remiendo.costo);
 assert.equal(m.ordenar('zombis',{tipo:'enviar',zombi:'remiendo',fila:1}),false);assert.equal(m.jardin.zombis.length,1);
 while(m.jardin.guardianes[0]&&!m.jardin.terminado)m.paso();assert.equal(m.jardin.terminado,'');assert.ok(m.ordenar('zombis',{tipo:'enviar',zombi:'remiendo',fila:0}));
 avanzar(m,70);assert.equal(m.jardin.terminado,'perdio','El atacante cruza después de consumir el farol');
 const fin=m.estado();assert.equal(m.ordenar('plantas',{tipo:'plantar',planta:'frijol',fila:0,col:0}),false);m.paso();assert.deepEqual(m.estado(),fin);
 const original=new MotorJardin(NIVELES_JARDIN[0]);assert.equal(original.enviarZombi('grandote',0),false,'La campaña no permite reclutar enemigos');
 console.log('OK preparación, bandos, costes, recargas, carriles, farol y victoria de zombis');
 for(const seed of [1,23,108]){
  const d=new MotorDuelo(seed),bot=crearBotJardin();let ataques=0;
  for(let i=0;i<30*200&&!d.jardin.terminado;i++){
   bot(d.jardin);
   if(d.jardin.t>=20){const tipos=['remiendo','olla','corredor','paraguas','grandote'];if(d.ordenar('zombis',{tipo:'enviar',zombi:tipos[ataques%5],fila:ataques%5}))ataques++;}
   d.paso();
  }
  assert.ok(ataques>=5);assert.equal(d.jardin.terminado,'gano');assert.ok(d.jardin.t>=DURACION_DUELO);console.log('OK plantas resisten tres minutos, semilla',seed,ataques,'reclutas legales');
 }
 let reloj=0;globalThis.performance={now:()=>reloj};
 const js=[{id:'defensor',puesto:0},{id:'atacante',puesto:1}],handlers=[new Map(),new Map()],paquetes=[];let conectado=true;
 const salas=js.map((yo,i)=>({yo,jugadores:js,soyAnfitrion:i===0,conectado:()=>conectado,
  al:(k,fn)=>{handlers[i].set(k,fn);return()=>handlers[i].delete(k);},alCorte:()=>()=>{},alCambiar:()=>()=>{},alFin:()=>()=>{},
  mandar:(t,d,o)=>{paquetes.push({i,t,d:structuredClone(d),o});handlers[1-i].get(t)?.(structuredClone(d),yo);},
 }));
 const cfg={sesion:'duelo-prueba-0001',semilla:23,plantas:js[0].id,zombis:js[1].id};
 const host=new RedDuelo(salas[0],cfg),guest=new RedDuelo(salas[1],cfg);host.listo();host.paso();assert.equal(host.motor.jardin.t,0,'Esperar las figuras en ambos aparatos');guest.listo();
 const tick=()=>{reloj+=1000/30;host.paso();host.publicar(false,reloj);};for(let i=0;i<630;i++)tick();
 guest.ordenar({tipo:'enviar',zombi:'remiendo',fila:0});const orden=paquetes.findLast(p=>p.t==='jd:orden');const niebla=host.motor.niebla;handlers[0].get('jd:orden')(orden.d,js[1]);assert.equal(host.motor.niebla,niebla);assert.equal(host.motor.jardin.zombis.length,1);
 guest.ordenar({tipo:'plantar',planta:'frijol',fila:0,col:0});assert.equal(host.motor.jardin.plantas.length,0,'El atacante no puede controlar las plantas');
 handlers[0].get('jd:orden')({...orden.d,n:100},{id:'ajeno'});assert.equal(host.motor.jardin.zombis.length,1);
 guest.pausar(true);const t=host.motor.jardin.t;host.paso();assert.equal(host.motor.jardin.t,t);host.pausar(false);assert.equal(host.pausada,true,'Solo quien puso pausa puede quitarla');guest.pausar(false);assert.equal(host.pausada,false);
 conectado=false;host.paso();assert.equal(host.motor.jardin.t,t);conectado=true;
 for(let i=0;i<30*200&&!host.motor.jardin.terminado;i++)tick();
 host.publicar(false,reloj+1);const cierre=paquetes.findLast(p=>p.t==='jd:foto'&&p.d.estado.terminado);
 assert.ok(cierre);assert.equal(cierre.o.rapido,false,'El primer final tiene confirmación y reenvío');assert.equal(guest.estado().terminado,host.estado().terminado);
 handlers[1].get('jd:foto')({...cierre.d,n:cierre.d.n-1,estado:fin},js[0]);assert.equal(guest.estado().terminado,'gano');
 const vieja=structuredClone(cierre.d);host.revancha();guest.revancha();assert.notEqual(host.config.sesion,cfg.sesion);assert.equal(host.bando,'zombis');assert.equal(guest.bando,'plantas');assert.equal(host.motor.jardin.t,0);handlers[1].get('jd:foto')(vieja,js[0]);assert.equal(guest.estado().terminado,'');
 host.soltar();guest.soltar();assert.equal(handlers[0].size,0);assert.equal(handlers[1].size,0);
 console.log('OK carga de ambos, autoridad, duplicados, pausa, cortes, final fiable y revancha con bandos invertidos');
 const espejo=new EspejoDuelo('interpolacion-01'),base=new MotorDuelo().estado();base.zombis=[{id:9,tipo:'remiendo',fila:0,x:5,vida:150,lento:0,mordiendo:false}];base.t=1;
 const foto={sesion:'interpolacion-01',n:1,estado:base,pausas:[],listos:['a','b'],corte:false,revancha:[]};espejo.recibir(foto,0);
 const siguiente=structuredClone(foto);siguiente.n=2;siguiente.estado.t=1.1;siguiente.estado.zombis[0].x=4.9;espejo.recibir(siguiente,100);
 assert.equal(espejo.ver(150).zombis[0].x,4.95);assert.equal(espejo.ver(1000).zombis[0].x,4.9);assert.equal(espejo.ver(150).zombis[0].vida,150);assert.equal(espejo.recibir(foto,200),false);
 console.log('OK vista interpolada sin inventar daño ni movimiento indefinido cuando faltan fotos');
}finally{await rm(tmp,{recursive:true,force:true});}
