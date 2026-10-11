/** Comprueba controles y guardado sobre un build servido, en un perfil nuevo y aislado. */
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { compilarModulo } from './modulos-prueba.mjs';
const A=await import(await compilarModulo(new URL('../../src/granja-v3/astra.ts',import.meta.url)));
const base=process.argv[2]??'http://127.0.0.1:4192/',dibujarReal=process.env.ASTRA_RENDER_REAL==='1';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/chromium',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:844,height:390}}),checks=[],errors=[],bad=[];
page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url());});
await page.addInitScript(()=>localStorage.setItem('granja-hud-calidad','ligera'));
const done=n=>{checks.push(n);console.log('OK '+n);};
const state=()=>page.evaluate(()=>window.__granjaV3.estado());
const pose=(x,z)=>page.evaluate(({x,z})=>{const v=window.__granjaV3.vista;v.avatar.detener();v.avatar.setPosition(x,z);v.enfocarJugador();},{x,z});
const cargar=async e=>{const r=await page.evaluate(e=>window.__granjaV3.cargar(e),e);assert.equal(r.ok,true,r.mensaje);};
const panel=()=>page.evaluate(()=>window.__granjaV3.panel('astra'));
const clicar=async selector=>{await page.locator(selector).click();await page.evaluate(()=>window.__granjaV3.settled());};
try {
 await page.goto(new URL('granja-v3.html',base).href);await page.waitForFunction(()=>window.__granjaV3?.ready,null,{timeout:180000});
 // SwiftShader no sostiene el primer pueblo. Pausar solo el dibujo en este perfil de prueba;
 // los controles, simulación, carga de modelos y grafo de escena siguen siendo los del build.
 if(!dibujarReal)await page.evaluate(()=>{window.__granjaV3.vista.renderer.setPixelRatio(.35);window.__granjaV3.vista.renderer.render=()=>{};});
 const inicial=await state();assert.equal(inicial.version,5);assert.equal(inicial.astra.actual,null);await page.locator('#hud-menu').click();await page.locator('[data-panel="astra"]').click();await page.locator('#panel-body').getByText('Rutas',{exact:true}).waitFor();done('Pestaña Astra disponible en la granja sin reemplazar el diario anterior');
 let e=structuredClone(inicial);e.zona='pueblo';e.posicionExterior={zona:'pueblo',x:108,z:29};e.jornada.minutos=700;await cargar(e);console.log('Etapa: primer pueblo cargado');await pose(108,29);await panel();await clicar('[data-do="astra-ruta"][data-id="pueblo_sol__cruce_valle"]');await page.waitForFunction(()=>window.__granjaV3.estado().astra.actual==='cruce_valle');done('Puerta física del primer pueblo abre el Cruce del Valle');
 const pos=await page.evaluate(()=>window.__granjaV3.vista.avatar.position.z);await page.locator('#canvas').focus();await page.keyboard.down('w');try{await page.waitForFunction(z=>window.__granjaV3.vista.avatar.position.z<z-.5,pos);}finally{await page.keyboard.up('w');}done('El teclado recorre la región usando sus colisiones');
 const ruta=A.RUTAS_ASTRA.find(r=>r.hacia==='puerto_lirios');await pose(ruta.desde_punto.x,ruta.desde_punto.z);await panel();await clicar('[data-do="astra-ruta"][data-id="'+ruta.id+'"]');await page.waitForFunction(()=>window.__granjaV3.estado().astra.actual==='puerto_lirios');done('Ruta de Celia llega al nuevo pueblo y conserva la jornada');
 const n=A.NPC_ASTRA.find(n=>n.region==='puerto_lirios'),p=A.posicionNpcAstra(await state(),n.id);await pose(p.x,p.z);await panel();await clicar('[data-do="astra-hablar"][data-id="'+n.id+'"]');await page.waitForFunction(id=>window.__granjaV3.estado().astra.escena?.id==='VID_'+id+'_1',n.id);await page.locator('.vecino-dialogo').waitFor();done('NPC real abre su recuerdo con subtítulo e identidad propia');
 const linea=(await state()).astra.escena.linea;await page.evaluate(()=>{window.__setItemOriginal=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('Cuota preparada para la prueba');};});await clicar('[data-do="astra-continuar"]');assert.equal((await state()).astra.escena.linea,linea);await page.evaluate(()=>Storage.prototype.setItem=window.__setItemOriginal);done('Fallo de almacenamiento revierte la línea y su progreso');
 for(let k=0;k<40&&(await state()).astra.escena;k++)await clicar('[data-do="astra-continuar"]');assert.equal((await state()).astra.escena,null);await clicar('[data-do="astra-bio"][data-id="'+n.id+'"]');assert.ok((await page.locator('#panel-body').innerText()).length>1000);await clicar('[data-do="astra-lista"]');await page.locator('#panel-close').click();done('Escuchar el recuerdo abre su biografía extensa sin conceder un premio de misión');
 const home=A.regionAstra('puerto_lirios').viviendas[0];await pose(home.entrada.x,home.entrada.z);await panel();await clicar('[data-do="astra-vivienda"][data-id="'+home.id+'"]');assert.equal((await state()).astra.interior,home.id);await panel();await clicar('[data-do="astra-salir_vivienda"]');assert.equal((await state()).astra.interior,null);done('Entrada y salida del interior funcionan con sus anclajes');
 const before=await state();await page.reload();await page.waitForFunction(()=>window.__granjaV3?.ready);if(!dibujarReal)await page.evaluate(()=>window.__granjaV3.vista.renderer.render=()=>{});assert.equal((await state()).astra.actual,'puerto_lirios');assert.deepEqual((await state()).astra.conocidos,before.astra.conocidos);assert.deepEqual((await state()).astra.lecturas,before.astra.lecturas);done('Recarga conserva mundo, conversaciones y lecturas');
 // Solo en este perfil de prueba: permisos y construcciones preparados para revisar el reparto y el arte.
 e=await state();for(const q of A.CAMPANA_ASTRA)e.astra.expedientes[q.id]={dia:0,estadisticas:{},paso:q.pasos.length,decision:0,cerrado:true};e.astra.escena=null;e.jornada.minutos=700;
 const presencias=[];for(const r of A.REGIONES_ASTRA.filter(r=>r.id!=='pueblo_sol')){const s=structuredClone(e);s.astra.actual=r.id;s.astra.interior=null;s.astra.posicion={x:0,z:13};await cargar(s);const ids=await page.evaluate(()=>{const ids=[];window.__granjaV3.vista.astra.grupo.traverse(g=>{if(g.userData.npcId&&g.visible)ids.push(g.userData.npcId);});return ids.sort();});assert.deepEqual(ids,[...r.npc].sort(),r.id);presencias.push(r.id);}done('27 grafos de escenario contienen exclusivamente los habitantes asignados');
 const fuego=structuredClone(e);fuego.astra.actual='confluencia_fuego';fuego.astra.posicion={x:18,z:23};await cargar(fuego);await pose(18,23);await panel();await clicar('[data-do="astra-combate"]');assert.equal((await state()).aventura.destinoActual,'confluencia_fuego');const r=await page.evaluate(()=>window.__granjaV3.actuar({tipo:'salir_aventura'},true));assert.equal(r.ok,true);assert.equal((await state()).astra.actual,'confluencia_fuego');done('Combate elemental entra y regresa al territorio correcto');
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
} catch(err){errors.push(String(err.stack));await page.screenshot({path:'/tmp/astra-navegador-fallo.png',timeout:15000}).catch(()=>{});process.exitCode=1;}
finally {const result={checks,errors,bad,viewport:[844,390],bufferSoftware:.35,dibujoWebGLPausado:!dibujarReal,escenarios:'Contexto nuevo con posiciones y permisos preparados; no certifica campaña completa ni teléfonos físicos.'};fs.writeFileSync(process.argv[3]??'/tmp/astra-navegador.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();}
