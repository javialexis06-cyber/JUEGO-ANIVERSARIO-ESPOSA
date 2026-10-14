import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir,writeFile } from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:4184/',out=process.argv[3]??'test-results/carreras-recorrido';
const fallos=process.env.FALLOS==='1',amigo=process.env.AMIGO!=='0',hacerGP=process.env.GRAN_PREMIO!=='0';
const clave=amigo?'amigo-carreras-progreso':'carreras-progreso';
await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:844,height:390},hasTouch:true}),errores=[],resultados=[];
p.on('pageerror',e=>errores.push(e.message));p.setDefaultTimeout(90000);
if(amigo)await p.addInitScript(()=>{if(!localStorage.getItem('nuestro-hogar-amigo'))localStorage.setItem('nuestro-hogar-amigo',JSON.stringify({id:'prueba-carreras',nombre:'Piloto',cuerpo:'el',piel:'#f6c8a4',pelo:'#c99a5b',ropa:'#3fb5a3',ropa2:'#4a4a52',zapatos:'#f4efe6',activo:true,creado:1}));});
const listo=async(id)=>{
 await p.waitForFunction(id=>typeof window.__carreras?.avanzar==='function'&&window.__carreras.sim.pista.d.id===id&&document.querySelector('.car-pausa'),id);
 await p.evaluate(()=>{const r=window.__carreras.vista.renderer;r.__renderOriginal??=r.render.bind(r);r.render=()=>{};});
 assert.equal(await p.evaluate(()=>window.__carreras.sim.vueltasTotal),3);
};
const foto=async(nombre)=>{await p.evaluate(()=>{const v=window.__carreras.vista;v.renderer.__renderOriginal(v.escena,v.camara);});await p.screenshot({path:`${out}/${nombre}.png`});};
const meta=async()=>{
 const fin=await p.evaluate(()=>{
  const h=window.__carreras,s=h.sim,k=s.karts[h.mio];
  for(let n=0;n<120&&!k.terminado;n++)h.avanzar(600);
  return {pista:s.pista.d.id,puesto:k.puesto+1,tiempo:k.tiempo,vueltas:k.vueltas,terminado:k.terminado,orden:s.orden};
 });
 assert.equal(fin.terminado,true);assert.equal(fin.vueltas.length,3);assert.ok(fin.tiempo>0);
 await p.locator('.car-fin').waitFor({state:'visible'});resultados.push(fin);return fin;
};
try{
 await p.addInitScript(k=>{window.__claveCarreras=k;},clave);
 await p.goto(new URL('carreras.html?bot=1&sinprecalentar',base).href);await p.locator('[data-ir="suelta"]').waitFor({state:'visible'});
 assert.equal(await p.evaluate(()=>localStorage.getItem(window.__claveCarreras)),null);
 await p.locator('[data-ir="suelta"]').click();await p.locator('[data-v="valle"]').click();await listo('valle');
 await p.locator('.car-pausa').click();const antes=await p.evaluate(()=>window.__carreras.sim.t);await p.waitForTimeout(1000);assert.equal(await p.evaluate(()=>window.__carreras.sim.t),antes);await p.locator('[data-p="seguir"]').click();
 await meta();await foto('suelta-fin');console.log('✓ Carrera suelta: tres vueltas y pausa real');
 await p.locator('.car-fin [data-seguir]').click();await p.locator('.podio [data-seguir]').click();await p.locator('[data-b="menu"]').click();
 const parcial=await p.evaluate(()=>JSON.parse(localStorage.getItem(window.__claveCarreras)));console.log(JSON.stringify({despuesDeSuelta:parcial}));
 await p.reload();await p.locator('[data-ir="crono"]').click();await p.locator('[data-v="valle"]').click();await listo('valle');
 if(fallos)await p.evaluate(()=>{const original=Storage.prototype.setItem;window.__cortarCarreras=true;Storage.prototype.setItem=function(k,v){if(k===window.__claveCarreras&&window.__cortarCarreras)throw new DOMException('Prueba de almacenamiento lleno','QuotaExceededError');return original.call(this,k,v);};});
 await meta();await foto('crono-fin');
 if(fallos){
  await p.locator('.car-fin [data-menu]').click();assert.equal(await p.locator('.car-fin').count(),1,'Conservar el resultado no guardado');
  await p.keyboard.press('Escape');assert.equal(await p.locator('.car-fin').count(),1,'Atrás no debe abandonar el récord pendiente');
  await p.evaluate(()=>{window.__cortarCarreras=false;});await p.locator('[data-reintentar-guardado]').click();await p.locator('[data-ir="gp"]').waitFor({state:'visible'});
 }else await p.locator('.car-fin [data-menu]').click();
 const guardado=await p.evaluate(()=>JSON.parse(localStorage.getItem(window.__claveCarreras)));
 assert.ok(Number.isFinite(guardado.records.valle.mejor)&&guardado.records.valle.mejor>0,'Una carrera previa no debe impedir guardar el primer contrarreloj');
 assert.ok(guardado.records.valle.fantasma.length>0);
 assert.ok(Math.abs(guardado.records.valle.fantasma.length/4-guardado.records.valle.mejor*10)<10,'El fantasma conserva muestras para la duración real de la carrera');
 console.log('✓ Contrarreloj después de recargar una carrera normal: récord y fantasma guardados');
 await p.reload();await p.locator('[data-ir="gp"]').waitFor({state:'visible'});
 assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem(window.__claveCarreras))),guardado);
 if(!hacerGP){
  await p.locator('[data-ir="volver"]').click();await p.waitForURL(amigo?/amigos\.html/:/index\.html/);
  assert.deepEqual(errores,[]);await writeFile(`${out}/resultado.json`,JSON.stringify({amigo,resultados,guardado,errores,retorno:true},null,2));
  process.exitCode=0;
 }else{
 await p.locator('[data-ir="gp"]').click();
 const puntosTotales=[];let gana=false;
 for(let n=0;n<4;n++){
  const id=['valle','brasa','nieve','cielo'][n];await listo(id);const fin=await meta();
  const puntos=await p.locator('.car-resultados li strong').allTextContents();
  assert.equal(puntos.length,8);assert.equal(puntos.map(Number).reduce((a,b)=>a+b,0),(n+1)*58);puntosTotales.push(puntos.map(Number));
  await foto(`gp-${n+1}-resultado`);console.log(`✓ Gran Premio ${n+1}/4: ${id}, tres vueltas, puesto ${fin.puesto}`);
  if(n===3){gana=await p.locator('.car-resultados li').first().evaluate(el=>el.classList.contains('yo'));if(gana&&fallos)await p.evaluate(()=>{const original=Storage.prototype.setItem;window.__cortarCarreras=true;Storage.prototype.setItem=function(k,v){if(k===window.__claveCarreras&&window.__cortarCarreras)throw new DOMException('Prueba de almacenamiento lleno','QuotaExceededError');return original.call(this,k,v);};});}
  await p.locator('.car-fin [data-seguir]').click();
 }
 await p.locator('.podio [data-seguir]').waitFor({state:'visible'});await foto('gp-podio');
 if(gana&&fallos){
  await p.locator('.podio [data-seguir]').click();assert.equal(await p.locator('.podio').count(),1,'El podio espera la copa pendiente');
  await p.waitForTimeout(14500);assert.equal(await p.locator('.podio').count(),1,'El avance automático también espera confirmar la copa');
  await p.evaluate(()=>{window.__cortarCarreras=false;});await p.locator('[data-reintentar-guardado]').click();
 }
 await p.locator('.podio [data-seguir]').click();await p.locator('[data-ir="gp"]').waitFor({state:'visible'});
 const final=await p.evaluate(()=>JSON.parse(localStorage.getItem(window.__claveCarreras)));
 assert.equal(final.copas.carrera??0,gana?1:0);
 await p.reload();await p.locator('[data-ir="gp"]').waitFor({state:'visible'});assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem(window.__claveCarreras))),final);
 assert.deepEqual(errores,[]);await writeFile(`${out}/resultado.json`,JSON.stringify({resultados,guardado,final,puntosTotales,gana,fallos,errores,limites:'Piloto normal, tres vueltas y cuadro completo; se desactiva el dibujo entre capturas. Precisión física y red pendientes.'},null,2));
 }
}catch(e){await p.screenshot({path:`${out}/fallo.png`}).catch(()=>{});throw e;}finally{await b.close();}
