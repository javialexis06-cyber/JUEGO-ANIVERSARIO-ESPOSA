/** Reglas preparadas de los zombis acuáticos; no acredita partidas completas ni interfaz. */
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const temporal=await mkdtemp(join(tmpdir(),'pvz-zombis-piscina-'));
let pruebas=0;
try{
 const fichero=join(temporal,'motor.mjs');
 await build({stdin:{contents:`export {MotorPvZ} from './src/jardin/pvz/motor/motor';export {NIVELES_PISCINA} from './src/jardin/pvz/datos/piscina';`,resolveDir:resolve(import.meta.dirname,'..')},outfile:fichero,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const {MotorPvZ,NIVELES_PISCINA}=await import(pathToFileURL(fichero));
 const crear=(semillas=[])=>new MotorPvZ({...NIVELES_PISCINA[0],solInicial:10000,emboscadaAgua:false},{sinOleadas:true,semilla:23,semillas});
 const avanzar=(m,s)=>{for(let i=0;i<Math.ceil(s*60);i++)m.paso();};
 const comprobar=(nombre,fn)=>{fn();pruebas++;console.log('OK',nombre);};
 comprobar('Buzo sumergido evita proyectiles y emerge para morder',()=>{
  const m=crear(['nenufar']);assert.ok(m.plantar('nenufar',2,4));const p=m.plantaEn(2,4,'base'),z=m.crearZombi('zombi-buzo',2,400);
  assert.equal(z.datos.sumergido,1);assert.equal(m.puedeRecibirProyectil(z),false);avanzar(m,.25);
  assert.equal(z.datos.sumergido,0);assert.equal(m.puedeRecibirProyectil(z),true);assert.ok(p.vida<300);
  m.quitar(2,4);m.paso();assert.equal(z.datos.sumergido,1);
 });
 comprobar('Explosión alcanza al buzo bajo el agua',()=>{
  const m=crear(),z=m.crearZombi('zombi-buzo',2,400);assert.equal(z.datos.sumergido,1);
  m.explosion(2,400,1800,0,40);assert.equal(z.vida,0);
 });
 comprobar('Buzo que pierde la cabeza sumergido se hunde sin dejar un cuerpo bloqueado',()=>{
  const m=crear(),z=m.crearZombi('zombi-buzo',2,400);m.danarZombi(z,200,'lanzado');assert.equal(z.vida,0);assert.equal(m.eliminados,1);
 });
 comprobar('Zomboni atraviesa barreras, crea hielo y resiste el frío',()=>{
  const m=crear(['nuez-alta']);assert.ok(m.plantar('nuez-alta',0,5));const p=m.plantaEn(0,5),z=m.crearZombi('zomboni',0,460);
  assert.equal(m.aplicarEstado(z,'lento',10),false);assert.equal(m.aplicarEstado(z,'congelado',10),false);assert.equal(m.aplicarEstado(z,'mantequilla',10),false);
  m.paso();assert.equal(p.vida,0);assert.ok(m.pistaHielo(0));assert.equal(z.comiendo,null);assert.ok(z.x<460);
 });
 comprobar('El hielo dura treinta segundos tras perder el Zomboni y bloquea sembrar',()=>{
  const m=crear(['nuez']),z=m.crearZombi('zomboni',0,400);m.paso();const pista=m.pistaHielo(0);assert.ok(pista);
  assert.equal(m.plantar('nuez',0,8),false);m.danarZombi(z,1800,'explosion');avanzar(m,29.9);assert.ok(m.pistaHielo(0));avanzar(m,.2);assert.equal(m.pistaHielo(0),undefined);assert.ok(m.plantar('nuez',0,8));
 });
 comprobar('Zomboni reduce velocidad al acercarse a la casa',()=>{
  const m=crear(),lejano=m.crearZombi('zomboni',0,700),cercano=m.crearZombi('zomboni',1,400);m.paso();assert.equal(lejano.datos.velocidad,25);assert.equal(cercano.datos.velocidad,10);
 });
 comprobar('Delfín gasta el salto sobre un Nenúfar suelto y después puede morder',()=>{
  const m=crear(['nenufar']);assert.ok(m.plantar('nenufar',2,6));const z=m.crearZombi('zombi-delfin',2,650);m.paso();assert.equal(z.datos.saltoPendiente,1);assert.equal(z.x,478);
  avanzar(m,1.21);assert.equal(z.datos.montado,0);assert.equal(z.datos.ignoraMordida,0);assert.equal(z.datos.velocidad,30);
 });
 comprobar('Guisantes cruzan bajo el delfín durante su salto, pero una explosión lo alcanza',()=>{
  const m=crear(['nenufar','lanzaguisantes']);assert.ok(m.plantar('nenufar',2,6));avanzar(m,7.6);
  assert.ok(m.plantar('nenufar',2,4));assert.ok(m.plantar('lanzaguisantes',2,4));const p=m.plantaEn(2,4),z=m.crearZombi('zombi-delfin',2,650);
  m.paso();assert.ok(z.datos.saltando>m.t);assert.equal(m.puedeRecibirProyectil(z),false);
  assert.ok(m.disparar(p,20,'recto'));avanzar(m,.5);assert.ok(z.datos.saltando>m.t);
  assert.ok(m.proyectiles.some(q=>q.fila===z.fila&&q.x>z.x+18));assert.equal(z.vida,500);
  m.explosion(2,z.x,1800,0,40);assert.equal(z.vida,0);assert.equal(m.eliminados,1);
 });
 comprobar('Nuez alta bloquea al delfín, que la muerde tras desmontar',()=>{
  const m=crear(['nenufar','nuez-alta']);assert.ok(m.plantar('nenufar',2,6));assert.ok(m.plantar('nuez-alta',2,6));const p=m.plantaEn(2,6),z=m.crearZombi('zombi-delfin',2,650);
  m.paso();assert.equal(z.x,550);avanzar(m,1.4);assert.equal(z.datos.montado,0);assert.ok(p.vida<8000);assert.equal(z.comiendo,p.id);
 });
 comprobar('Nenúfar de la última columna no gasta el salto del delfín',()=>{
  const m=crear(['nenufar']);assert.ok(m.plantar('nenufar',2,8));const z=m.crearZombi('zombi-delfin',2,780);avanzar(m,2);assert.equal(z.datos.montado,1);assert.ok(!z.datos.saltoPendiente);
 });
 comprobar('Trineo trae cuatro ocupantes y al romperse permite ralentizarlos',()=>{
  const m=crear();m.crearPistaHielo(0,100);const z=m.crearZombi('zombi-trineo',0,650);m.paso();assert.equal(m.zombis.length,4);assert.equal(m.zombis.filter(v=>v.datos.intocableTrineo).length,3);
  assert.equal(m.aplicarEstado(z,'lento',10),false);m.danarZombi(z,300,'recto');assert.equal(z.armadura,0);assert.ok(z.datos.choqueTrineoHasta>m.t);
  avanzar(m,1.6);assert.equal(m.zombis.length,4);assert.ok(m.zombis.every(v=>!v.datos.enTrineo&&!v.datos.intocableTrineo));assert.equal(m.aplicarEstado(z,'lento',10),true);
 });
 comprobar('Guisantes pasan bajo el trineo durante el choque y la explosión elimina sus cuatro ocupantes una sola vez',()=>{
  const m=crear(['lanzaguisantes']);m.crearPistaHielo(0,600);assert.ok(m.plantar('lanzaguisantes',0,6));
  const p=m.plantaEn(0,6),z=m.crearZombi('zombi-trineo',0,650);m.paso();const grupo=[...m.zombis];assert.equal(grupo.length,4);
  m.danarZombi(z,300,'recto');assert.ok(z.datos.choqueTrineoHasta>m.t);assert.equal(m.puedeRecibirProyectil(z),false);
  assert.ok(m.disparar(p,20,'recto'));avanzar(m,.5);assert.ok(z.datos.choqueTrineoHasta>m.t);
  assert.ok(m.proyectiles.some(q=>q.fila===z.fila&&q.x>z.x+18));assert.equal(z.vida,270);assert.equal(m.eliminados,0);
  m.explosion(0,z.x,1800,0,40);assert.ok(grupo.every(v=>v.vida===0));assert.equal(m.eliminados,4);
  m.explosion(0,z.x,1800,0,40);m.paso();assert.equal(m.eliminados,4);assert.equal(m.zombis.length,0);
 });
 comprobar('Destruir el trineo con una explosión elimina todo el grupo',()=>{
  const m=crear();m.crearPistaHielo(0,100);const z=m.crearZombi('zombi-trineo',0,650);m.paso();const grupo=[...m.zombis];m.explosion(0,z.x,1800,0,40);assert.ok(grupo.every(v=>v.vida===0));assert.equal(m.eliminados,4);
 });
 comprobar('Destruir al líder durante el choque no deja pasajeros inmunes',()=>{
  const m=crear();m.crearPistaHielo(0,100);const z=m.crearZombi('zombi-trineo',0,650);m.paso();m.danarZombi(z,300,'recto');m.danarZombi(z,1800,'fuego');assert.ok(m.zombis.every(v=>v.vida===0));assert.equal(m.eliminados,4);
 });
 comprobar('Sin pista el trineo se rompe y los cuatro continúan caminando',()=>{
  const m=crear(),z=m.crearZombi('zombi-trineo',0,650);avanzar(m,2.1);assert.equal(m.zombis.length,4);assert.ok(m.zombis.every(v=>!v.datos.enTrineo));assert.ok(z.x<650);
 });
 console.log('OK',pruebas,'reglas preparadas de zombis de piscina');
}finally{await rm(temporal,{recursive:true,force:true});}
