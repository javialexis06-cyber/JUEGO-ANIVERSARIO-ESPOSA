/** Reglas observables de las plantas acuáticas; escenarios preparados sin interfaz ni guardados. */
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const temporal=await mkdtemp(join(tmpdir(),'pvz-plantas-piscina-')),resultados=[];
try{
 const modulo=join(temporal,'motor.mjs');
 await build({stdin:{contents:"export * from './src/jardin/pvz/motor/motor';export * from './src/jardin/pvz/datos/piscina';export * from './src/jardin/pvz/datos/plantas';export * from './src/jardin/pvz/datos/zombis';",resolveDir:resolve(import.meta.dirname,'..')},outfile:modulo,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const {MotorPvZ,NIVELES_PISCINA,PLANTAS_PVZ,ZOMBIS_PVZ}=await import(pathToFileURL(modulo));
 const quieto={...ZOMBIS_PVZ.zombi,id:'blanco-preparado',vida:10000,velocidad:0,mordida:0,agua:'tambien'};
 const preparado=(semillas,nivel={},registros={})=>new MotorPvZ({...NIVELES_PISCINA[0],id:'prueba-plantas-piscina',solInicial:10000,sinSolCielo:true,...nivel},{sinOleadas:true,semillas,semilla:23},{zombis:{...ZOMBIS_PVZ,[quieto.id]:quieto},...registros});
 const prueba=(nombre,fn)=>{fn();resultados.push({nombre,ok:true});console.log('OK',nombre);};
 const pasos=(m,n)=>{const e=[];for(let i=0;i<n;i++){m.paso();e.push(...m.consumirEventos());}return e;};
 const segundos=(m,s)=>pasos(m,Math.ceil(s*60));
 const plantar=(m,t,f,c)=>{assert.ok(m.plantar(t,f,c),`siembra preparada ${t}`);return m.plantaEn(f,c,PLANTAS_PVZ[t].capa??'principal');};
 const blanco=(m,f,x)=>m.crearZombi(quieto.id,f,x);

 prueba('Nenúfar habilita su casilla de agua y perderlo hunde la planta terrestre',()=>{
  const m=preparado(['nenufar','lanzaguisantes']);assert.equal(m.plantar('nenufar',0,1),false);assert.equal(m.plantar('lanzaguisantes',2,1),false);
  const n=plantar(m,'nenufar',2,1),p=plantar(m,'lanzaguisantes',2,1);m.danarPlanta(n,300);assert.equal(p.vida,0);
 });
 prueba('Ni Pinchohierba ni Patatapum pueden apoyarse sobre un Nenúfar',()=>{
  const m=preparado(['nenufar','pinchohierba','patatapum']);plantar(m,'nenufar',2,1);const antes=m.estado();
  assert.equal(m.plantar('pinchohierba',2,1),false);assert.equal(m.plantar('patatapum',2,1),false);assert.deepEqual(m.estado(),antes);
 });
 prueba('Zampalga y Nenúfar requieren agua libre y no se apilan en ninguna dirección',()=>{
  for(const [primera,segunda] of [['nenufar','zampalga'],['zampalga','nenufar']]){
   const m=preparado(['nenufar','zampalga']);plantar(m,primera,2,1);const antes=m.estado();
   assert.equal(m.plantar(segunda,2,1),false);assert.deepEqual(m.estado(),antes);
  }
 });
 prueba('Tripitidora detecta una fila vecina y dispara una tanda de tres guisantes de veinte',()=>{
  const m=preparado(['tripitidora']),p=plantar(m,'tripitidora',1,0);blanco(m,2,600);
  const eventos=segundos(m,.5).filter(e=>e.t==='disparo'&&e.id===p.id);assert.deepEqual(eventos.map(e=>e.fila),[0,1,2]);assert.ok(eventos.every(e=>e.cantidad===20));
 });
 prueba('Tripitidora en un borde usa dos filas y conserva la cadencia de 1,425 segundos',()=>{
  const m=preparado(['tripitidora']),p=plantar(m,'tripitidora',0,0);blanco(m,0,700);p.datos.reloj=0;
  assert.equal(pasos(m,1).filter(e=>e.t==='disparo').length,2);assert.equal(segundos(m,1.4).filter(e=>e.t==='disparo').length,0);
  assert.equal(segundos(m,.05).filter(e=>e.t==='disparo').length,2);
 });
 prueba('Apisonaflor espera el impacto y golpea una agrupación del mismo carril',()=>{
  const m=preparado(['aplastaflor']),p=plantar(m,'aplastaflor',0,3),z=blanco(m,0,p.x+40),otro=blanco(m,0,p.x+60),fuera=blanco(m,1,p.x+40);
  segundos(m,1.8);assert.equal(z.vida,10000);assert.ok(p.vida>0);segundos(m,.05);
  assert.equal(z.vida,8200);assert.equal(otro.vida,8200);assert.equal(fuera.vida,10000);assert.equal(p.vida,0);
 });
 prueba('Apisonaflor detecta por detrás y no se activa ante un delfín montado',()=>{
  const m=preparado(['aplastaflor']),p=plantar(m,'aplastaflor',0,3),montado=blanco(m,0,p.x+30);montado.datos.montado=1;
  segundos(m,.5);assert.equal(p.datos.activada,undefined);const detras=blanco(m,0,p.x-30);segundos(m,1.9);assert.equal(detras.vida,8200);
 });
 prueba('Zampalga atrapa al buzo sumergido, lo hunde y desaparece con él',()=>{
  const m=preparado(['zampalga']),p=plantar(m,'zampalga',2,3),z=blanco(m,2,p.x+10);z.datos.sumergido=1;
  pasos(m,1);assert.equal(z.datos.zampalga,p.id);segundos(m,.5);assert.equal(z.datos.arrastrado,1);assert.equal(m.puedeRecibirProyectil(z),false);
  segundos(m,.52);assert.equal(z.vida,0);assert.equal(p.vida,0);assert.equal(m.eliminados,1);
 });
 prueba('Dos Zampalgas no consumen sus usos sobre la misma víctima',()=>{
  const m=preparado(['zampalga']),a=plantar(m,'zampalga',2,3);segundos(m,30.1);const b=plantar(m,'zampalga',2,4),z=blanco(m,2,320);
  pasos(m,1);assert.equal(z.datos.zampalga,a.id);assert.equal(b.datos.activada,undefined);segundos(m,1.1);assert.equal(a.vida,0);assert.ok(b.vida>0);
 });
 prueba('La pala retira Zampalga durante el agarre y libera al zombi vivo',()=>{
  const m=preparado(['zampalga']),p=plantar(m,'zampalga',2,3),z=m.crearZombi('zombi-flotador',2,p.x+10);
  segundos(m,.6);assert.equal(z.datos.zampalga,p.id);assert.equal(z.datos.arrastrado,1);const x=z.x;
  assert.equal(m.quitar(2,3),true);assert.equal(z.datos.zampalga,undefined);assert.equal(z.datos.arrastrado,undefined);
  segundos(m,.6);assert.ok(z.vida>0);assert.ok(z.x<x);
 });
 prueba('Jalapeño quema toda su fila, deja las demás y derrite su pista de hielo',()=>{
  const m=preparado(['jalapeno']),p=plantar(m,'jalapeno',0,0),a=blanco(m,0,80),b=blanco(m,0,700),otra=blanco(m,1,80);
  m.crearPistaHielo(0,300);m.crearPistaHielo(1,300);m.aplicarEstado(a,'lento',10);m.aplicarEstado(a,'congelado',4);
  segundos(m,1);assert.equal(a.vida,8200);assert.equal(b.vida,8200);assert.equal(a.lento,0);assert.equal(a.congelado,0);assert.equal(otra.vida,10000);
  assert.equal(m.pistaHielo(0),undefined);assert.ok(m.pistaHielo(1));assert.equal(p.vida,0);
 });
 prueba('Pinchohierba daña a todos los que la pisan y no detiene sus mordidas ni movimiento',()=>{
  const m=preparado(['pinchohierba']),p=plantar(m,'pinchohierba',0,3),a=blanco(m,0,p.x),b=blanco(m,0,p.x+10),fuera=blanco(m,0,p.x+50);
  segundos(m,.25);assert.equal(a.vida,10000);segundos(m,.02);assert.equal(a.vida,9980);assert.equal(b.vida,9980);assert.equal(fuera.vida,10000);
  segundos(m,1.02);assert.equal(a.vida,9960);assert.equal(p.vida,300);
  const vivo=m.crearZombi('zombi',0,p.x+5),x=vivo.x;segundos(m,.1);assert.ok(vivo.x<x);assert.equal(vivo.comiendo,null);assert.equal(p.vida,300);
 });
 prueba('Pinchohierba pincha un Zomboni y ambos desaparecen',()=>{
  const m=preparado(['pinchohierba']),p=plantar(m,'pinchohierba',0,3),z=m.crearZombi('zomboni',0,p.x+20);segundos(m,.3);
  assert.equal(z.vida,0);assert.equal(p.vida,0);
 });
 prueba('Plantorcha duplica un guisante y produce daño de salpicadura en su fila',()=>{
  const m=preparado(['lanzaguisantes','plantorcha']),p=plantar(m,'lanzaguisantes',0,0);plantar(m,'plantorcha',0,2);
  const principal=blanco(m,0,400),secundario=blanco(m,0,450),otra=blanco(m,1,450);p.datos.reloj=0;
  segundos(m,1.2);assert.equal(principal.vida,9960);assert.equal(secundario.vida,9987);assert.equal(otra.vida,10000);
 });
 prueba('Un mismo tronco descongela sin volver a prender; un segundo sí lo convierte en fuego',()=>{
  for(const dos of [false,true]){
   const m=preparado(['hielaguisantes','plantorcha']),p=plantar(m,'hielaguisantes',0,0);plantar(m,'plantorcha',0,1);
   if(dos){segundos(m,7.6);plantar(m,'plantorcha',0,2);}const z=blanco(m,0,400);p.datos.reloj=0;
   segundos(m,1.2);assert.equal(z.vida,10000-(dos?40:20));assert.equal(z.lento,0);
  }
 });
 prueba('Nuez alta resiste ocho mil puntos y hace perder la pértiga sin ser saltada',()=>{
  const m=preparado(['nuez-alta']),p=plantar(m,'nuez-alta',0,3),z=m.crearZombi('saltador',0,p.x+50);pasos(m,1);
  assert.equal(PLANTAS_PVZ['nuez-alta'].vida,8000);assert.equal(z.datos.saltoUsado,1);assert.ok(z.x>p.x);
  segundos(m,1.9);assert.ok(z.x>p.x);assert.equal(z.comiendo,p.id);assert.ok(p.vida<8000);
 });
 prueba('Las nuevas plantas no consumen una carga de abono sin una regla registrada',()=>{
  const m=preparado(['aplastaflor','tripitidora','plantorcha','nuez-alta']);m.abono=3;
  for(const [i,t] of ['aplastaflor','tripitidora','plantorcha','nuez-alta'].entries()){const p=plantar(m,t,0,i);assert.equal(m.usarAbono(p.id),false);}
  assert.equal(m.abono,3);
 });

 const salida=resolve(import.meta.dirname,'../test-results/pvz/plantas-piscina');await mkdir(salida,{recursive:true});await writeFile(join(salida,'resultado.json'),JSON.stringify({ok:true,pruebas:resultados},null,2));
 console.log('OK',resultados.length,'reglas preparadas de plantas de piscina');
}finally{await rm(temporal,{recursive:true,force:true});}
