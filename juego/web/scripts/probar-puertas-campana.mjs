// Campaña narrativa desde cero: resuelve con las pruebas de toques/sensores de cada acertijo y sigue el flujo normal.
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:5176/',out=process.argv[3]??'test-results/puertas-campana';
await mkdir(out,{recursive:true});
const previo=process.env.REANUDAR?JSON.parse(await readFile(process.env.REANUDAR,'utf8')):null;const hastaInicial=previo?.puertas.at(-1)?.n??0;
const b=await chromium.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:844,height:390},hasTouch:true}),errores=[],puertas=previo?.puertas??[];p.setDefaultTimeout(90000);p.on('pageerror',e=>errores.push(e.message));
await p.routeWebSocket(u=>u.host===new URL(base).host&&u.searchParams.has('token'),s=>s.send(JSON.stringify({type:'connected'})));
if(previo)await p.addInitScript(datos=>{if(sessionStorage.getItem('puertas-prueba-restaurada'))return;for(const [k,v] of Object.entries(datos))if(v!==null)localStorage.setItem(k,v);sessionStorage.setItem('puertas-prueba-restaurada','1');},previo.disco);
await p.addInitScript(()=>{
 const escribir=Storage.prototype.setItem;window.__rechazarPuertas=false;window.__recuerdosVistos=new Set();window.__lineasVistas=new Set();
 Storage.prototype.setItem=function(k,v){if(k==='cien-puertas'&&window.__rechazarPuertas)throw new DOMException('Prueba sin espacio','QuotaExceededError');return escribir.call(this,k,v);};
 // Solo acepta los globos y las tarjetas visibles, como al tocar para seguir; no salta el narrador.
 setInterval(()=>{
  for(const id of ['globo','globo-yo','recuerdo']){const e=document.getElementById(id);if(e&&!e.hidden){if(id==='recuerdo'){window.__recuerdosVistos.add(e.textContent);e.click();}else{window.__lineasVistas.add(e.textContent);document.getElementById('dialogo')?.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch'}));}}}
 },100);
});
try{
 // Los acertijos de ritmo usan tiempo de juego: acelerar más exigiría toques físicamente distintos.
 await p.goto(new URL('puertas.html?rol=ella&rapido=3&revisar=1&semilla=11',base).href,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.__listo);
 assert.equal(await p.evaluate(()=>window.__puertas.estado().progreso.hasta),hastaInicial);await p.locator('#btn-continuar').tap();
 for(let n=hastaInicial+1;n<=100;n++){
  await p.waitForFunction(n=>window.__puertas.estado().jugando===n&&window.__puertas.estado().listo,n);
  console.log('Resolviendo puerta',n);
  if(n===1)await p.evaluate(()=>window.__rechazarPuertas=true);
  let intento=1;
  for(;;){
   try{await p.evaluate(()=>window.__puertas.probar());break;}
   catch(e){if(intento++>=3||!e.message.includes('No tengo'))throw e;console.log('Repetir gesto normal de recogida en puerta',n);}
  }
  await p.waitForFunction(n=>window.__puertas.estado().progreso.hasta===n,n);
  if(n===1){
   await p.locator('[data-reintentar-puertas]').waitFor();assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('cien-puertas')).hasta),0);
   await p.locator('#btn-mapa').tap();assert.equal(await p.locator('#mapa:not([hidden])').count(),0);assert.equal(await p.evaluate(()=>window.__puertas.estado().jugando),1);
   await p.evaluate(()=>window.__rechazarPuertas=false);await p.locator('[data-reintentar-puertas]').tap();await p.locator('[data-reintentar-puertas]').waitFor({state:'detached'});
  }
  const progreso=await p.evaluate(()=>window.__puertas.estado().progreso);assert.ok(progreso.estrellas[n]>0);puertas.push({n,intento,estrellas:progreso.estrellas[n]});console.log('OK puerta',n,'con narrativa y avance guardado');
  await writeFile(`${out}/resultado.json`,JSON.stringify({puertas,errores,disco:await p.evaluate(()=>Object.fromEntries(['cien-puertas','nuestro-hogar-sueldo'].map(k=>[k,localStorage.getItem(k)])))},null,2));
 }
 await p.locator('#mapa:not([hidden])').waitFor({timeout:120000});const antes=await p.evaluate(()=>({p:window.__puertas.estado().progreso,s:localStorage.getItem('nuestro-hogar-sueldo'),recuerdos:window.__recuerdosVistos.size,lineas:window.__lineasVistas.size}));assert.equal(antes.recuerdos,20-Math.floor(hastaInicial/5));assert.ok(antes.lineas>100-hastaInicial);
 await p.reload();await p.waitForFunction(()=>window.__listo);assert.deepEqual(await p.evaluate(()=>window.__puertas.estado().progreso),antes.p);assert.equal(await p.evaluate(()=>localStorage.getItem('nuestro-hogar-sueldo')),antes.s);
 await p.locator('#btn-recuerdos').tap();assert.equal(await p.locator('.album article.bloqueado').count(),0);await p.locator('#panel .panel-x').tap();
 await p.locator('a[aria-label="Volver a la casa"]').tap();await p.waitForURL(/index\.html/);assert.deepEqual(errores,[]);
 await writeFile(`${out}/resultado.json`,JSON.stringify({puertas,...antes,recarga:true,retorno:true,errores,limites:'Soluciones conocidas por las pruebas del juego, sensores simulados, reloj acelerado y dibujo desactivado. No certifica deducción humana ni sensores físicos.'},null,2));
}catch(e){await p.screenshot({path:`${out}/fallo.png`}).catch(()=>{});throw e;}finally{await b.close();}
