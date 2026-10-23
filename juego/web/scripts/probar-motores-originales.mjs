/** Motores reales en contexto aislado. Usa red para los recursos públicos fijados de Gardendless.
 * CHROME_PATH=/usr/bin/chromium node scripts/probar-motores-originales.mjs [URL] [salida]
 * PvZ1: arranque WASM y persistencia preparada; combate exige datos GOTY del usuario.
 */
import {chromium} from '@playwright/test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const base=process.argv[2]??'http://127.0.0.1:4196/',out=path.resolve(process.argv[3]??'test-results/motores-originales');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined,headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1280,height:720}}),page=await context.newPage(),checks=[],errors=[],bad=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))bad.push(`${r.status()} ${r.url()}`);});
const ok=t=>{checks.push(t);console.log('OK '+t);};
const abrir=async motor=>{await page.goto(new URL(`jardin.html?modo=${motor}&rol=ella&local=1`,base).href);await page.locator('iframe').waitFor();await page.waitForFunction(()=>!!document.querySelector('iframe')?.contentWindow?.semillaMotor);const frame=page.frames().find(f=>f.url().includes(`/motores/${motor}/`));await frame.waitForFunction(()=>!!window.semillaMotor);return frame;};
try{
 await page.goto(new URL('jardin.html',base).href);await page.evaluate(()=>localStorage.setItem('prueba-clave-ajena','conservar'));
 let f=await abrir('pvz1');await f.evaluate(()=>window.moduleReadyPromise);
 assert.equal(await f.evaluate(()=>typeof Module.callMain),'function');assert.equal(await f.evaluate(()=>typeof Module.FS.filesystems.IDBFS),'object');
 await f.locator('#browse-zip-btn').waitFor({state:'visible'});assert.equal(await f.evaluate(()=>semillaMotor.prefijo),'semilla-pvz1-pareja:');
 await page.screenshot({path:path.join(out,'pvz1-importador.png')});ok('PvZ1 inicializa WebAssembly, sistema de archivos e importador local sin datos originales ni CDN');
 await f.evaluate(async()=>{await ensureSaveFsReady();Module.FS.mkdirTree('/saves/userdata');Module.FS.writeFile('/saves/userdata/prueba-integracion',[17,29,41]);await new Promise((ok,mal)=>Module.FS.syncfs(false,e=>e?mal(e):ok()));});
 await f.evaluate(()=>window.onGameExit());await page.waitForURL(/modo=conquista/);f=await abrir('pvz1');await f.evaluate(()=>window.moduleReadyPromise);await f.evaluate(()=>ensureSaveFsReady());
 assert.deepEqual(await f.evaluate(()=>Array.from(Module.FS.readFile('/saves/userdata/prueba-integracion'))),[17,29,41]);ok('PvZ1 conserva bytes de una partida preparada al cerrar y abrir mediante el adaptador');
 await page.locator('[data-motor="volver"]').click();await page.waitForURL(/modo=conquista/);
 f=await abrir('pvz2');await f.waitForFunction(()=>window.System?.get('chunks:///_virtual/PlayerProperties.ts')?.AllPlayerProperties,null,{timeout:150000});
 await f.evaluate(async()=>{const cc=await System.import('cc');window.__textoMotor=texto=>{let existe=false;function recorrer(n){const l=n.getComponent(cc.Label);if(l&&n.activeInHierarchy&&l.string.includes(texto))existe=true;n.children.forEach(recorrer);}const escena=cc.director.getScene();if(escena)recorrer(escena);return existe;};});
 await f.waitForFunction(()=>window.__textoMotor('Play'),null,{timeout:150000});
 const tocar=async(x,y)=>{await page.mouse.move(x,y);await f.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.mouse.click(x,y);};
 const cc=()=>f.evaluate(async()=>{const cc=await System.import('cc');return cc.game.isPaused();});
 await page.locator('[data-motor="pausa"]').click();await f.waitForFunction(async()=>{const cc=await System.import('cc');return cc.game.isPaused();});assert.equal(await cc(),true);
 await page.locator('[data-motor="pausa"]').click();await f.waitForFunction(async()=>{const cc=await System.import('cc');return !cc.game.isPaused();});ok('PvZ2 carga Cocos, Spine y recursos reales; la pausa exterior detiene y reanuda su motor');
 await tocar(640,650);await f.waitForFunction(()=>System.get('chunks:///_virtual/levelController.ts')?.LevelPlay?.component?.gameStarted,null,{timeout:150000});
 await f.waitForFunction(()=>window.__textoMotor('Click on the seed packet'),null,{timeout:90000});await tocar(510,42);await f.waitForFunction(()=>window.__textoMotor('Place it on the grass'),null,{timeout:10000});await tocar(520,420);
 await f.waitForFunction(()=>window.__textoMotor('Nicely done'),null,{timeout:15000});
 await page.screenshot({path:path.join(out,'pvz2-siembra-real.png')});ok('PvZ2 entra al tutorial real y planta con selección y toque, cobrando el coste del motor original');
 // No se concede progreso: el perfil escrito por el motor se compara byte a byte al volver a abrir.
 const progreso=await f.evaluate(()=>{const p=System.get('chunks:///_virtual/PlayerProperties.ts').AllPlayerProperties;p.savePP();return Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]));});
 await f.evaluate(()=>window.electronAPI.quit());await page.waitForURL(/modo=conquista/);assert.equal(await page.evaluate(()=>localStorage.getItem('prueba-clave-ajena')),'conservar');
 const lectura=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('semilla-pvz2-pareja:')).map(k=>[k.slice('semilla-pvz2-pareja:'.length),localStorage.getItem(k)])));
 assert.deepEqual(lectura,progreso);ok('PvZ2 sale guardando su perfil y conserva las claves del resto del proyecto');
 await page.evaluate(()=>localStorage.setItem('nuestro-hogar-amigo',JSON.stringify({id:'amigo-prueba01',nombre:'Prueba',cuerpo:'el',activo:true})));
 f=await abrir('pvz1');await f.evaluate(()=>window.moduleReadyPromise);await f.evaluate(()=>ensureSaveFsReady());assert.equal(await f.evaluate(()=>semillaMotor.prefijo),'semilla-pvz1-amigos:');assert.equal(await f.evaluate(()=>Module.FS.analyzePath('/saves/userdata/prueba-integracion').exists),false);ok('El perfil de amigos tiene un IndexedDB independiente de las partidas PvZ1 de pareja');
 await f.evaluate(()=>{localStorage.setItem('marcador','amigos');localStorage.clear();});assert.equal(await page.evaluate(()=>localStorage.getItem('prueba-clave-ajena')),'conservar');assert.deepEqual(await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('semilla-pvz2-pareja:')).map(k=>[k.slice('semilla-pvz2-pareja:'.length),localStorage.getItem(k)]))),progreso);ok('Limpiar el almacén de un motor conserva los perfiles y progreso de los demás');
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
}catch(e){errors.push(String(e.stack));process.exitCode=1;await page.screenshot({path:path.join(out,'fallo.png')}).catch(()=>{});}finally{fs.writeFileSync(path.join(out,'resultado.json'),JSON.stringify({checks,errors,bad,limites:'PvZ1 usa archivos de prueba para persistencia, no se jugó sin main.pak/properties. PvZ2 exige red al cargar recursos no almacenados. No prueba toda la campaña ni dispositivos físicos.'},null,2));console.log(JSON.stringify({checks:checks.length,errors,bad}));await browser.close();}
