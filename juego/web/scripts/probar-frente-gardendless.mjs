/** Puente real de Cocos, sin cambiar estadísticas, reloj ni recursos. Requiere Vite y red.
 * CHROME_PATH=/usr/bin/chromium node scripts/probar-frente-gardendless.mjs [URL] [salida]
 */
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const base=process.argv[2]??'http://127.0.0.1:4196/',out=path.resolve(process.argv[3]??'test-results/frente-gardendless');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined,headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1280,height:720}}),page=await context.newPage(),checks=[],errors=[],bad=[];
let partida=null;
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))bad.push(`${r.status()} ${r.url()}`);});
const ok=t=>{checks.push(t);console.log('OK '+t);};
try{
 await page.route('**/prueba-frentes.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;height:100vh"></body></html>'}));
 await page.goto(new URL('prueba-frentes.html',base).href);
 await page.evaluate(async()=>{
  const {FrenteGardendless}=await import('/src/jardin/motores/frente-gardendless.ts');
  localStorage.setItem('semilla-pvz2-pareja:centinela','minijuego');localStorage.setItem('semilla-historia-centinela','historia');
  window.resultados=[];window.frente=new FrenteGardendless(document.body,'casa','pareja',s=>window.resultados.push(s));
 });
 assert.deepEqual(await page.evaluate(()=>frente.listo),{nivel:'tutorial1',instantaneas:false,carrilesVariables:false,pasoExterno:false,perfilTemporal:true});
 const frame=page.frames().find(f=>f.url().includes('/motores/pvz2/'));
 assert.match(await frame.evaluate(()=>semillaMotor.prefijo),/^semilla-frente-pvz2-pareja:casa:/);
 assert.equal((await page.evaluate(()=>frente.observar())).fase,'preparando');ok('Carga Cocos aislado, comunica capacidades reales y no promete guardar combates');
 // Un mensaje de la misma página con sesión incorrecta no puede pausar este frente.
 await page.evaluate(()=>frente.frame.contentWindow.postMessage({canal:'semilla-frente-v1',zona:'casa',sesion:'sesion-equivocada',solicitud:999999,orden:'pausa'},location.origin));
 assert.equal((await page.evaluate(()=>frente.observar())).pausada,false);
 const noAdmitido=await page.evaluate(async()=>{try{await frente.ordenar('iniciar',{nivel:'egypt1'});return false;}catch(e){return e.message;}});
 assert.match(noAdmitido,/solo admite tutorial1/);ok('Rechaza sesiones ajenas y niveles no habilitados sin modificar la campaña');
 const inicio=await page.evaluate(()=>frente.iniciar());assert.equal(inicio.fase,'combatiendo');assert.equal(inicio.soles,100);
 assert.match(await page.evaluate(async()=>{try{await frente.iniciar();return '';}catch(e){return e.message;}}),/ya se inició/);ok('Abre tutorial1 con la API nativa y evita reiniciar el frente para borrar daño');
 await frame.evaluate(async()=>{
  const cc=await System.import('cc');window.texto=texto=>{let existe=false;const recorrer=n=>{const l=n.getComponent(cc.Label);if(l&&n.activeInHierarchy&&l.string.includes(texto))existe=true;n.children.forEach(recorrer);};recorrer(cc.director.getScene());return existe;};
 });
 const tocar=async(x,y)=>{await page.mouse.move(x,y);await frame.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.mouse.click(x,y);};
 await frame.waitForFunction(()=>texto('Click on the seed packet'),null,{timeout:90000});await tocar(510,42);
 await frame.waitForFunction(()=>texto('Place it on the grass'),null,{timeout:10000});await tocar(520,420);
 await frame.waitForFunction(()=>texto('Nicely done'),null,{timeout:15000});
 let estado=await page.evaluate(()=>frente.observar());assert.equal(estado.plantas,1);assert.equal(estado.soles,0);
 await page.screenshot({path:path.join(out,'siembra.png')});ok('Siembra mediante ratón con animación y coste originales; informa el tablero real');
 const parada=await page.evaluate(()=>frente.pausa());assert.equal(parada.pausada,true);
 await page.waitForTimeout(1400);const despues=await page.evaluate(()=>frente.observar());assert.equal(despues.segundos,parada.segundos);assert.equal(despues.oleada,parada.oleada);
 assert.equal((await page.evaluate(()=>frente.reanudar())).pausada,false);ok('Pausa confirmada por Cocos: reloj y oleada permanecen detenidos');
 // Solo entrada normal: recoger soles con el cursor y sembrar una segunda planta cuando sea asequible.
 const limite=Date.now()+300000;let segunda=false,proximoInforme=Date.now()+15000;
 while(Date.now()<limite){
  estado=await page.evaluate(()=>frente.observar());if(['victoria','derrota'].includes(estado.fase))break;
  if(Date.now()>proximoInforme){console.log('PARTIDA '+JSON.stringify(estado));proximoInforme=Date.now()+15000;}
  const soles=await frame.evaluate(async()=>{
   const cc=await System.import('cc'),lista=System.get('chunks:///_virtual/Droppings.ts').droppings.controller?.sunPool??[];
   const camaras=cc.director.getScene().getComponentsInChildren(cc.Camera).filter(c=>c.enabledInHierarchy);
   return lista.filter(s=>s.node?.isValid).map(s=>{const cam=camaras.find(c=>(c.visibility&s.node.layer)!==0);if(!cam)return null;const p=cam.worldToScreen(s.node.worldPosition);return{x:p.x,y:cc.game.canvas.height-p.y};}).filter(Boolean);
  });
  for(const s of soles)if(s.x>0&&s.x<1280&&s.y>0&&s.y<720){await page.mouse.move(s.x,s.y);await page.waitForTimeout(140);}
  if(!segunda&&estado.soles>=100){await tocar(510,42);await tocar(640,420);segunda=(await page.evaluate(()=>frente.observar())).plantas>=2;}
  await page.waitForTimeout(700);
 }
 assert.equal(segunda,true,'Se deben recoger suficientes soles para la segunda planta');
 assert.equal(estado.fase,'victoria',JSON.stringify(estado));
 await page.waitForFunction(()=>resultados.length===1);const resultado=await page.evaluate(()=>resultados[0]);assert.equal(resultado.fase,'victoria');
 partida=resultado;
 await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>resultados.length),1);
 await page.screenshot({path:path.join(out,'victoria.png')});ok('Gana el tutorial completo sin acelerar el reloj ni conceder recursos; comunica un resultado único');
 // Base preparada: comprueba limpieza sin abrir ni alterar un guardado nativo del usuario.
 const baseTemporal=await frame.evaluate(()=>new Promise((ok,mal)=>{const p=indexedDB.open('prueba-temporal',1);p.onupgradeneeded=()=>p.result.createObjectStore('prueba');p.onsuccess=()=>ok(p.result.name);p.onerror=()=>mal(p.error);}));
 await page.evaluate(()=>frente.cerrar());assert.equal(page.frames().length,1);
 await page.waitForFunction(async nombre=>!(await indexedDB.databases()).some(d=>d.name===nombre),baseTemporal);
 assert.equal(await page.evaluate(()=>localStorage.getItem('semilla-pvz2-pareja:centinela')),'minijuego');assert.equal(await page.evaluate(()=>localStorage.getItem('semilla-historia-centinela')),'historia');
 assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('semilla-frente-'))),[]);ok('Cierra y libera el iframe sin escribir perfiles temporales ni tocar historia o minijuego');
 // Cancelar antes del arranque rechaza la espera y libera la ventana sin promesas huérfanas.
 assert.match(await page.evaluate(async()=>{const{FrenteGardendless}=await import('/src/jardin/motores/frente-gardendless.ts');const f=new FrenteGardendless(document.body,'casa','amigos');const p=f.listo.catch(e=>e.message);f.destruir();return p;}),/cerrado/);
 assert.equal(page.frames().length,1);ok('Cancelar la carga rechaza sus esperas y elimina la instancia');
 await page.evaluate(async()=>{const{FrenteGardendless}=await import('/src/jardin/motores/frente-gardendless.ts');window.frente=new FrenteGardendless(document.body,'casa','amigos');});
 await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.semillaMotor?.frente);
 const amigo=page.frames().find(f=>f.url().includes('/motores/pvz2/'));
 await amigo.waitForFunction(()=>window.semillaMotor?.frente);
 assert.match(await amigo.evaluate(()=>semillaMotor.prefijo),/^semilla-frente-pvz2-amigos:casa:/);
 await amigo.evaluate(()=>{localStorage.setItem('prueba','temporal');localStorage.clear();});
 await page.evaluate(()=>frente.cerrar());assert.equal(page.frames().length,1);
 assert.equal(await page.evaluate(()=>localStorage.getItem('semilla-pvz2-pareja:centinela')),'minijuego');ok('El frente de amigos aísla su almacén y se puede cerrar antes de terminar la carga');
 await page.goto(new URL('jardin.html?modo=prueba-frente&local=1&rol=ella',base).href);
 await page.locator('[data-frente="jugar"]').waitFor();await page.screenshot({path:path.join(out,'entrada.png')});
 await page.locator('[data-frente="volver"]').click();await page.waitForURL(/modo=conquista/);ok('La entrada de revisión conserva los controles redondos y permite salir durante la carga');
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
}catch(e){errors.push(String(e.stack));process.exitCode=1;await page.screenshot({path:path.join(out,'fallo.png')}).catch(()=>{});}
finally{fs.writeFileSync(path.join(out,'resultado.json'),JSON.stringify({checks,partida,errors,bad,limites:'Prueba aislada del nivel nativo tutorial1. No restaura combates, no migra V2, no acredita varios frentes simultáneos ni carriles variables.'},null,2));console.log(JSON.stringify({checks:checks.length,partida,errors,bad}));await browser.close();}
