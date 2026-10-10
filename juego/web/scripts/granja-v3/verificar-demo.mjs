/** Recorrido del build integrado en contexto aislado.
 * node scripts/granja-v3/verificar-demo.mjs [URL] [carpeta-resultados]
 * CHROME_PATH: Chrome/Edge instalado. El servidor debe servir el build completo.
 */
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
const base=new URL(process.argv[2]??'http://127.0.0.1:4182/');
const out=process.argv[3]?path.resolve(process.argv[3]):fs.mkdtempSync(path.join(tmpdir(),'granja-integracion-'));
const web=fileURLToPath(new URL('../../',import.meta.url)),rel=path.relative(web,out);
if(!rel||!rel.startsWith('..')&&!path.isAbsolute(rel)&&!rel.startsWith('test-results'+path.sep))throw Error('Usa una carpeta externa o test-results para las capturas.');
fs.mkdirSync(path.join(out,'renders'),{recursive:true});
const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:844,height:390}}),checks=[],errors=[],bad=[];
page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url());});
const done=s=>{checks.push(s);console.log('OK '+s);};
const state=()=>page.evaluate(()=>window.__granjaV3.estado());
const idle=()=>page.evaluate(()=>window.__granjaV3.settled());
const ready=async()=>{await page.waitForFunction(()=>window.__granjaV3?.ready,null,{timeout:120000});await idle();};
const place=async(x,z)=>{await page.evaluate(({x,z})=>{const v=window.__granjaV3.vista;v.avatar.setPosition(x,z);v.enfocarJugador();},{x,z});await page.waitForTimeout(300);};
const click=async(x,z,y=.05,button='left')=>{const q=await page.evaluate(({x,z,y})=>{const v=window.__granjaV3.vista,p=v.avatar.position.clone().set(x,y,z).project(v.camera),r=document.getElementById('canvas').getBoundingClientRect();return{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};},{x,z,y});await page.mouse.click(q.x,q.y,{button});};
try{
 await page.goto(new URL('index.html?rol=ella&local=1&rapido=4',base).href);await page.waitForFunction(()=>window.__listo===true,null,{timeout:180000});
 // Escenario preparado: habilitar el cuarto con el hook existente, sin pagar una campaña.
 await page.evaluate(()=>window.__ampliar('juegos'));await page.locator('#carga:not([hidden])').waitFor({state:'hidden'});await page.locator('[data-accion="jugar-granja"]').waitFor({state:'visible'});await page.screenshot({path:path.join(out,'renders/casa-acceso-granja.png')});
 await page.locator('[data-accion="jugar-granja"]').click();await page.waitForURL(/granja-v3.html/,{timeout:60000});await ready();assert.equal((await state()).version,5);done('Botón de la casa abre la granja V5 sobre el build actual');
 await place(-5.5,4.5);const old=await page.evaluate(()=>window.__granjaV3.vista.avatar.position.x);await page.locator('#canvas').focus();await page.keyboard.down('d');await page.waitForTimeout(500);await page.keyboard.up('d');assert.ok((await page.evaluate(()=>window.__granjaV3.vista.avatar.position.x))-old>.5);done('Teclado mueve al personaje compartido actual');
 await place(-6.6,-.2);await click(-6.6,-.2,1.1);assert.equal(await page.locator('#panel-title').innerText(),'Correo de la granja');await page.locator('[data-do="correo-leer"][data-id="bienvenida"]').click();await idle();assert.equal((await state()).correo.cartas[0].leidaDia,0);await page.locator('#panel-close').click();done('Mouse abre el buzón y conserva lectura');
 await page.keyboard.press('e');await page.locator('.mochila-cuadricula').waitFor({state:'visible'});assert.equal(await page.locator('.mochila-casilla').count(),(await state()).casillasInventario.length);await page.keyboard.press('Escape');done('Inventario actual accesible en horizontal');
 await place(-5,-.5);const before=await state(),pos=await page.evaluate(()=>{const p=window.__granjaV3.vista.avatar.position;return{x:p.x,z:p.z};});await click(-7,-5,.05,'right');await page.locator('[data-do="entrar"]').click();await page.waitForURL(/index.html.*desdeGranja/);const returnButton=page.locator('#btn-volver-granja:visible, #btn-volver-granja-bienvenida:visible').first();await returnButton.waitFor({state:'visible'});await page.screenshot({path:path.join(out,'renders/casa-retorno-granja.png')});await returnButton.click();await page.waitForURL(/granja-v3.html.*desdeHogar/);await ready();const after=await state();assert.deepEqual(after.casillasInventario,before.casillasInventario);assert.equal(after.jornada.diasCompletados,before.jornada.diasCompletados);const returned=await page.evaluate(()=>{const p=window.__granjaV3.vista.avatar.position;return{x:p.x,z:p.z};});assert.ok(Math.hypot(returned.x-pos.x,returned.z-pos.z)<.02);done('Granja → casa real → granja conserva posición, inventario y jornada');
 await page.reload();await ready();assert.equal((await state()).correo.cartas[0].leidaDia,0);assert.deepEqual((await state()).casillasInventario,before.casillasInventario);await page.screenshot({path:path.join(out,'renders/granja-integrada-horizontal.png')});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));done('Recarga conserva progreso y viewport horizontal sin desbordamiento');
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
}catch(e){errors.push(String(e.stack));await page.screenshot({path:path.join(out,'renders/fallo.png')}).catch(()=>{});process.exitCode=1;}finally{fs.writeFileSync(path.join(out,'VERIFICACION-NAVEGADOR.json'),JSON.stringify({checks,errors,bad,viewport:[844,390],escenariosPreparados:'Cuarto habilitado y avatar posicionado en contexto nuevo aislado.',dispositivosFisicos:[]},null,2));console.log(JSON.stringify({checks:checks.length,errors,bad}));await browser.close();}
