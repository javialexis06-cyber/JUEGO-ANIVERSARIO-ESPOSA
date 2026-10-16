// Descubrimiento ordinario: comprar/comer, ir al baño, vuelo con el piloto de entradas y volver a casa.
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:4182/',out=process.argv[3]??'test-results/retrete-descubrimiento';await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}),resultados=[];
try{
 for(const [rol,comida] of [['el','empanada'],['ella','leche']]){
  const c=await b.newContext({viewport:{width:844,height:390},hasTouch:true}),p=await c.newPage(),errores=[];p.setDefaultTimeout(90000);p.on('pageerror',e=>errores.push(e.message));
  await p.addInitScript(()=>{
   // Comprueba flujo y datos; la presentación 3D ya se cubre en los recorridos visuales.
   for(const C of [WebGLRenderingContext,WebGL2RenderingContext])for(const n of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced'])if(C.prototype[n])C.prototype[n]=()=>{};
  });
  const casa=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('nuestro-hogar-local')).casa);
  await p.goto(new URL(`index.html?rol=${rol}&local=1&rapido=3`,base).href,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.__listo);
  const inicial=await casa();assert.equal(inicial.coheteVisto?.[rol],undefined);assert.equal(inicial.cohete?.[rol]?.vuelos??0,0);
  await p.locator('[data-accion="tienda"]').tap();await p.locator(`[data-comprar="${comida}"]`).tap();await p.waitForFunction(id=>window.__casa().inventario[id]===1,comida);
  const compra=await casa();assert.ok(compra.monedas<inicial.monedas);await p.locator('#hoja-cerrar').tap();
  await p.locator('[data-cuarto="cocina"]').tap();await p.locator('[data-accion="comer"]').tap();await p.locator(`[data-comer="${comida}"]`).tap();await p.waitForFunction(r=>!!window.__casa().personajes[r].apuro,rol);
  assert.equal((await casa()).inventario[comida],0);await p.locator('[data-cuarto="bano"]').tap();await p.locator('[data-accion="inodoro"]').tap();
  await p.waitForFunction(()=>window.__cohete?.estado()?.fase==='juego',null,{timeout:180000});assert.ok((await casa()).coheteVisto[rol]);
  await p.evaluate(()=>{window.__cohete.manual();window.__cohete.bot();});
  const vuelo=await p.evaluate(()=>{
   const h=window.__cohete;for(let t=0;t<600&&h.estado().fase!=='resultado';t+=2)h.simular(2);
   if(h.estado().fase==='juego'){document.querySelector('.ch-pausa').click();document.querySelector('[data-rendirse]').click();h.simular(4);}
   h.simular(5);return h.estado();
  });
  assert.equal(vuelo.fase,'resultado');assert.ok(vuelo.metros>0);assert.equal(vuelo.progreso.vuelos,1);await p.locator('.cohete-resultado.contado').waitFor();
  await p.locator('[data-casa]').tap();await p.waitForFunction(()=>!window.__cohete.juego());
  // El aterrizaje sigue animándose después de cerrar el minijuego y después entrega los trofeos ganados.
  await p.waitForFunction(({rol,metros})=>{const h=window.__casa();return !h.personajes[rol].apuro&&[500,2000,5000].every((m,i)=>metros<m||h.diario[`trofeo-retrete-${i+1}`]);},{rol,metros:vuelo.metros});
  const regreso=await casa();assert.equal(regreso.cohete[rol].vuelos,1);
  await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.__listo);const recarga=await casa();assert.deepEqual(recarga.cohete[rol],regreso.cohete[rol]);assert.equal(recarga.monedas,regreso.monedas);assert.ok(recarga.coheteVisto[rol]);assert.deepEqual(errores,[]);
  resultados.push({rol,comida,precio:inicial.monedas-compra.monedas,metros:vuelo.metros,causa:vuelo.causa,descubierto:true,retorno:true,recarga:true,errores});console.log('OK descubrimiento, vuelo y retorno',rol,comida,vuelo.metros);await c.close();
 }
 await writeFile(`${out}/resultado.json`,JSON.stringify({resultados,limites:'Casa local nueva sin acceso ni dinero preparados; piloto normal y reloj simulado en el vuelo; sin dibujo WebGL. No certifica controles ni gráficos en teléfonos.'},null,2));
}finally{await b.close();}
