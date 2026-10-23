/** Canvas real, toque real y arte existente. Escenarios preparados, no nuevos niveles balanceados. */
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';

const base=process.argv[2]??'http://127.0.0.1:4196/',salida=resolve(process.argv[3]??'test-results/pvz/carriles-interfaz');
await mkdir(salida,{recursive:true});const checks=[],errores=[],recursos=[];let browser,ok=false;
try{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/chromium',args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1280,height:720},hasTouch:true});
 const p=await context.newPage();p.on('pageerror',e=>errores.push(e.message));p.on('response',r=>{if(r.status()>=400)recursos.push(r.status()+' '+r.url());});
 await p.goto(new URL('jardin.html?modo=aventura&prueba=1',base).href);await p.waitForFunction(()=>window.__pvz);
 await p.evaluate(async()=>{
  const[{MotorPvZ},{EscenaPvZ}]=await Promise.all([import('/src/jardin/pvz/motor/motor.ts'),import('/src/jardin/pvz/vista/escena.ts')]);
  document.querySelector('#pvz-app').style.display='none';
  const campo=document.createElement('div');campo.style.cssText='position:fixed;inset:0;background:#163929';document.body.append(campo);
  const vista=new EscenaPvZ(window.__pvz.atlas(),campo);
  window.__escenarios={MotorPvZ,vista,motor:null,ultimo:null};
  vista.canvas.addEventListener('pointerdown',e=>{const a=window.__escenarios,q=a.vista.tocar(e.clientX,e.clientY,a.motor);a.ultimo=q;if(q)a.motor.ordenar({tipo:'plantar',planta:'lanzaguisantes',fila:q.fila,col:q.col});a.vista.eventos(a.motor.consumirEventos(),a.motor.t,a.motor);a.vista.dibujar(a.motor);});
 });
 const crear=async(cantidad,agua=[])=>p.evaluate(({cantidad,agua})=>{
  const a=window.__escenarios;a.motor=new a.MotorPvZ({id:'muestra-'+cantidad,parte:1,area:agua.length?'piscina':'dia',tablero:{filas:cantidad},filas:Array.from({length:cantidad},(_,i)=>i),filasAgua:agua,zombis:['zombi'],banderas:1,tipo:'normal',solInicial:10000,sinSolCielo:true},{sinOleadas:true,semillas:['lanzaguisantes','nenufar','nuez','tripitidora','girasol']});a.vista.dibujar(a.motor);
 },{cantidad,agua});
 const punto=async(fila,col)=>p.evaluate(({fila,col})=>{const a=window.__escenarios;return a.vista.punto(col*80+40,fila,a.motor);},{fila,col});
 const tap=async(fila,col)=>{const q=await punto(fila,col);await p.touchscreen.tap(q.x,q.y);};
 for(const viewport of[{width:1280,height:720},{width:844,height:390}]){
  await p.setViewportSize(viewport);await p.waitForTimeout(60);
  for(const cantidad of[3,4,5,6,7,9]){
   await crear(cantidad);await tap(0,0);assert.deepEqual(await p.evaluate(()=>window.__escenarios.motor.plantas.map(p=>[p.fila,p.col])),[[0,0]]);
   await tap(cantidad-1,8);assert.equal(await p.evaluate(()=>window.__escenarios.motor.plantas.length),1,'La recarga no cambia por tocar otro carril');
   await p.evaluate(()=>{const a=window.__escenarios;a.motor.avanzar(451);a.vista.dibujar(a.motor);});await tap(cantidad-1,8);
   assert.deepEqual(await p.evaluate(()=>window.__escenarios.motor.plantas.map(p=>[p.fila,p.col])),[[0,0],[cantidad-1,8]]);assert.equal(await p.evaluate(()=>window.__escenarios.motor.sol),9800);
   const q=await p.evaluate(()=>{const a=window.__escenarios,r=a.vista.canvas.getBoundingClientRect();return{x:r.left+r.width*.1,y:r.top+r.height*.7};});await p.touchscreen.tap(q.x,q.y);assert.equal(await p.evaluate(()=>window.__escenarios.ultimo),null);
   await p.evaluate(()=>{const a=window.__escenarios,antes=JSON.stringify(a.motor.exportar());for(let i=0;i<10;i++)a.vista.dibujar(a.motor);if(JSON.stringify(a.motor.exportar())!==antes)throw Error('La vista modificó el motor');const r=a.MotorPvZ.restaurar(JSON.parse(antes));a.motor=r;a.vista.dibujar(r);});
   if([3,7].includes(cantidad)){
    await p.evaluate(()=>{const a=window.__escenarios,m=a.motor;for(const f of m.nivel.filas){m.crearZombi(f%3===0?'caracubo':f%2?'caracono':'zombi',f,650+f%3*35);}a.vista.dibujar(m);});
    await p.screenshot({path:join(salida,`carriles-${cantidad}-${viewport.width}.png`)});
   }
   checks.push(`${cantidad} carriles, toque inicial/final, coste, recarga, límites y reanudación a ${viewport.width}×${viewport.height}`);
  }
 }
 await crear(7,[1,5]);await p.evaluate(()=>{const a=window.__escenarios,m=a.motor;for(const fila of m.nivel.filas){m.recargas.nenufar=0;m.recargas.girasol=0;m.recargas.tripitidora=0;if(m.esAgua(fila))m.plantar('nenufar',fila,2);m.plantar('tripitidora',fila,2);m.plantar('girasol',fila,0);m.crearZombi(m.esAgua(fila)?'caracubo-flotador':'caracubo',fila,680);}a.vista.dibujar(m);});
 await p.screenshot({path:join(salida,'agua-discontinua-7-844.png')});checks.push('Agua discontinua dibujada bajo los carriles configurados');
 assert.equal(await p.evaluate(()=>localStorage.getItem('pvz-v1')),null);assert.equal(await p.evaluate(()=>localStorage.getItem('conquista-prototipo-v1')),null);checks.push('Sin escrituras en los guardados reales de aventura o Conquista');
 assert.deepEqual(errores,[]);assert.deepEqual(recursos,[]);ok=true;
}catch(e){errores.push(String(e.stack??e));throw e;}
finally{await browser?.close();await writeFile(join(salida,'resultado.json'),JSON.stringify({ok,checks,errores,recursos,alcance:'Escenarios preparados de Canvas con recursos existentes. No acredita nivel final, balance, dispositivos físicos ni integración del mapa.'},null,2));}
