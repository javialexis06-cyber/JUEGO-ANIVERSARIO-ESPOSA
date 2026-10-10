// Referencia histórica de la demo V2; no se ejecuta en el motor actual.
// Recorrido activo: scripts/granja-v3/verificar-demo.mjs.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const out=process.argv[3]??'qa-granja-v2';
const url=process.argv[2]??'http://127.0.0.1:4176/granja-v2.html';fs.mkdirSync(out+'/renders/objetos',{recursive:true});
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[],networkErrors=[],checks=[],samples=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)networkErrors.push({status:r.status(),url:r.url()});});
 await page.goto(url);await page.waitForFunction(()=>window.__granjaV2?.ready,{},{timeout:60000});await page.evaluate(()=>window.__granjaV2.settled());
 const assets=await page.evaluate(()=>window.__granjaV2.assets);assert.equal(assets.length,66);
 const dimensions=await page.evaluate(()=>window.__granjaV2.farm);assert.equal(dimensions.width*dimensions.depth/(dimensions.originalWidth*dimensions.originalDepth),30);checks.push('Superficie exacta 30×: 94×90 / 18,8×15 = 30');
 for(const quality of ['alta','ligera']){await page.evaluate(q=>window.__granjaV2.setQuality(q),quality);await page.evaluate(()=>window.__granjaV2.settled());await page.waitForTimeout(1300);samples.push(await page.evaluate(()=>window.__granjaV2.getState()));}
 checks.push('Ambos perfiles se cargan sin errores');
 await page.evaluate(()=>window.__granjaV2.setQuality('alta'));
 for(const zone of ['granja','pueblo','bosque','lago','mina']){await page.evaluate(id=>window.__granjaV2.travel(id),zone);await page.evaluate(()=>window.__granjaV2.settled());await page.waitForTimeout(500);const s=await page.evaluate(()=>window.__granjaV2.getState());assert.equal(s.zone,zone);assert.equal(s.chunks,25);assert.equal(s.pending,false);samples.push(s);await page.screenshot({path:out+'/renders/zona-'+zone+'.png'});}
 checks.push('Cinco zonas navegables: granja, pueblo, bosque, lago y colinas');
 await page.evaluate(()=>window.__granjaV2.setQuality('ligera'));
 for(let repeat=0;repeat<2;repeat++)for(const zone of ['granja','pueblo','bosque','lago','mina']){await page.evaluate(id=>window.__granjaV2.travel(id),zone);await page.evaluate(()=>window.__granjaV2.settled());const s=await page.evaluate(()=>window.__granjaV2.getState());assert.equal(s.chunks,25);assert(s.resident<70);}
 checks.push('Dos vueltas adicionales por cinco zonas: 25 chunks y caché acotada');
 await page.evaluate(()=>window.__granjaV2.travel('granja'));await page.evaluate(()=>window.__granjaV2.expand());assert.equal(await page.evaluate(()=>window.__granjaV2.getState().unlocked),2);
 await page.evaluate(()=>window.__granjaV2.expandAll());await page.evaluate(()=>window.__granjaV2.settled());assert.equal(await page.evaluate(()=>window.__granjaV2.getState().unlocked),30);await page.evaluate(()=>window.__granjaV2.setCamera(18.8,15));await page.evaluate(()=>window.__granjaV2.settled());await page.waitForTimeout(400);await page.screenshot({path:out+'/renders/granja-expandida.png'});checks.push('Expansión de 1 a 2 y a 30 sectores con geometría real');
 await page.reload();await page.waitForFunction(()=>window.__granjaV2?.ready,{},{timeout:60000});assert.equal(await page.evaluate(()=>window.__granjaV2.getState().unlocked),30);checks.push('Persistencia aislada de los sectores tras recargar');
 await page.evaluate(()=>localStorage.removeItem('granja-v2-sectores'));await page.reload();await page.waitForFunction(()=>window.__granjaV2?.ready,{},{timeout:60000});
 await page.setViewportSize({width:844,height:390});await page.evaluate(()=>window.__granjaV2.setQuality('ligera'));await page.waitForTimeout(500);await page.screenshot({path:out+'/renders/movil-horizontal.png'});
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:0,x:350,y:210},{id:1,x:470,y:210}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:0,x:320,y:210},{id:1,x:500,y:210}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});checks.push('Zoom de dos dedos emulado sin errores');
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.__granjaV2.travel('granja'));await page.waitForTimeout(600);await page.screenshot({path:out+'/renders/movil-vertical.png'});
 await page.locator('[data-tab="animales"]').click();await page.waitForFunction(()=>window.__granjaV2.getState().studio);await page.waitForTimeout(250);await page.screenshot({path:out+'/renders/estudio-movil.png'});checks.push('Interfaz vertical y horizontal; estudio abierto mediante botón');
 await page.setViewportSize({width:768,height:768});await page.evaluate(()=>{window.__granjaV2.setUI(false);window.__granjaV2.setPaused(true);window.__granjaV2.setTransparent(true);document.documentElement.style.background='transparent';document.body.style.background='transparent';});
 for(const a of assets){await page.evaluate(id=>window.__granjaV2.showAsset(id),a.id);await page.evaluate(()=>window.__granjaV2.step(.15));await page.waitForTimeout(90);await page.screenshot({path:out+'/renders/objetos/'+a.id+'.png',omitBackground:true});}
 checks.push('66 renders PNG individuales a 768×768');
 await page.setViewportSize({width:1280,height:900});await page.evaluate(()=>{window.__granjaV2.setTransparent(false);window.__granjaV2.setPaused(false);});
 await page.evaluate(()=>window.__granjaV2.showAsset('vaca'));await page.waitForTimeout(200);
 const movie=await page.evaluate(async()=>{const stream=document.querySelector('canvas').captureStream(24),chunks=[],r=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:2200000});r.ondataavailable=e=>chunks.push(e.data);const stopped=new Promise(done=>r.onstop=done);r.start();for(const id of ['vaca','oveja','cerdito','gallina','conejo','pato']){await window.__granjaV2.showAsset(id);window.__granjaV2.play('acariciar');await new Promise(done=>setTimeout(done,2200));}r.stop();await stopped;stream.getTracks().forEach(t=>t.stop());const bytes=new Uint8Array(await new Blob(chunks).arrayBuffer());let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);});fs.writeFileSync(out+'/renders/animales-animados.webm',Buffer.from(movie,'base64'));checks.push('Vídeo de los seis animales con la acción acariciar');
 assert.deepEqual(errors,[]);assert.deepEqual(networkErrors,[]);fs.writeFileSync(out+'/VERIFICACION.json',JSON.stringify({date:new Date().toISOString().slice(0,10),browser:'Chromium headless / Playwright',checks,samples,errors,networkErrors,physicalDevicesTested:[],targetDevices:['Samsung Galaxy S21 FE','Samsung Galaxy S24 Ultra']},null,2));console.log(JSON.stringify({checks,errors,samples:samples.slice(0,2)}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
