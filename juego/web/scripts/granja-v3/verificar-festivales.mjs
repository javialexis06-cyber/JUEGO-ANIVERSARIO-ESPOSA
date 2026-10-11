/** Build completo servido: node scripts/granja-v3/verificar-festivales.mjs [URL] [salida].
 * Contexto aislado, fechas/muestra preparadas por el hook existente; no certifica campaña ni teléfonos físicos.
 */
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
const base=new URL(process.argv[2]??'http://127.0.0.1:4182/');
const out=process.argv[3]?path.resolve(process.argv[3]):fs.mkdtempSync(path.join(tmpdir(),'festivales-'));
const web=fileURLToPath(new URL('../../',import.meta.url)),rel=path.relative(web,out);
if(!rel||!rel.startsWith('..')&&!path.isAbsolute(rel)&&!rel.startsWith('test-results'+path.sep))throw Error('Usa una carpeta externa o test-results.');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:844,height:390}}),checks=[],errors=[],bad=[];
page.setDefaultTimeout(60000);
await page.addInitScript(()=>localStorage.setItem('granja-hud-calidad','ligera'));
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url());});
const done=texto=>{checks.push(texto);console.log('OK '+texto);};
const ready=async()=>{await page.waitForFunction(()=>window.__granjaV3?.ready,null,{timeout:180000});await page.evaluate(()=>window.__granjaV3.settled());};
const state=()=>page.evaluate(()=>window.__granjaV3.estado());
const click=async(tipo,extra='')=>{await page.locator(`[data-do="festival-${tipo}"]${extra}`).click();await page.waitForTimeout(300);await page.evaluate(()=>window.__granjaV3.settled());};
async function prepare(dia,muestra=false){
 const r=await page.evaluate(async({dia,muestra})=>{const h=window.__granjaV3,s=h.estado();s.jornada.diasCompletados=dia;s.jornada.minutos=660;s.jornada.resumenPendiente=false;s.jornada.ultimaNoche=null;s.zona='pueblo';s.interior=null;s.servicio=null;s.posicionExterior={zona:'pueblo',x:84,z:10};
 if(muestra){const slot=s.casillasInventario.findIndex(p=>!p);s.casillasInventario[slot]={articulo:'zanahoria',cantidad:2,calidad:2};s.inventario={};for(const p of s.casillasInventario)if(p)s.inventario[p.articulo]=(s.inventario[p.articulo]??0)+p.cantidad;}
 const r=await h.cargar(s);h.vista.avatar.setPosition(84,10);h.vista.enfocarJugador();h.guardar();return r;},{dia,muestra});assert.equal(r.ok,true,r.mensaje);
 if(await page.locator('#panel.open').count())await page.locator('#panel-close').click();await page.locator('#hud-reloj').click();await page.locator('[data-do="abrir-festivales"]').click();
}
try{
 await page.goto(new URL('granja-v3.html',base).href);await ready();
 await prepare(12);await click('entrar');await click('comenzar');await click('responder','[data-eleccion="0"]');
 assert.deepEqual((await state()).festivales.actual.respuestas,[0]);done('Calendario abre festival y guarda la primera respuesta desde los botones reales');
 await page.reload();await ready();assert.deepEqual((await state()).festivales.actual.respuestas,[0]);await page.locator('[data-do="festival-responder"][data-paso="1"]').first().waitFor();done('Recargar reabre el panel y conserva la ronda');
 await page.evaluate(()=>{const original=Storage.prototype.setItem;window.__restaurarStorage=()=>Storage.prototype.setItem=original;Storage.prototype.setItem=function(k,v){if(k==='nuestra-granjita-v3')throw new DOMException('Escenario de cuota','QuotaExceededError');return original.call(this,k,v);};});
 await click('responder','[data-eleccion="1"]');assert.deepEqual((await state()).festivales.actual.respuestas,[0]);await page.evaluate(()=>window.__restaurarStorage());done('Fallo de almacenamiento revierte la respuesta y permite reintentar');
 await click('responder','[data-eleccion="1"]');await click('responder','[data-eleccion="2"]');
 const before=await state();await click('cobrar');const after=await state();assert.equal(after.monedas,before.monedas+50);assert.equal(after.festivales.actual,null);assert.equal(after.festivales.ediciones[0].puntos,3);assert.equal(after.jornada.minutos,before.festivales.actual.minutosInicio+90);assert.ok(!await page.locator('[data-do="festival-entrar"][data-id="semillas_compartidas"]').count());done('Premio único devuelve a la plaza con monedas, recuerdo y hora coherentes');
 await page.reload();await ready();assert.equal((await state()).festivales.ediciones[0].puntos,3);done('Recuerdo y recompensa persisten después de recargar');
 await prepare(71,true);await click('entrar','[data-id="mesa_cosecha"]');await click('comenzar');await click('muestra');
 const muestra=(await state()).festivales.actual.muestra;assert.equal((await state()).casillasInventario[muestra.casilla].cantidad,2);
 await page.reload();await ready();assert.equal((await state()).festivales.actual.muestra.calidad,2);await click('retirarse');assert.equal((await state()).casillasInventario[muestra.casilla].cantidad,2);done('Muestra de otoño conserva calidad al recargar y no se consume al retirarse');
 await click('entrar','[data-id="mesa_cosecha"]');await click('comenzar');await click('muestra');await click('responder','[data-eleccion="1"]');await click('responder','[data-eleccion="2"]');await click('cobrar');assert.equal((await state()).casillasInventario[muestra.casilla].cantidad,1);assert.equal((await state()).festivales.ediciones.find(e=>e.id==='mesa_cosecha').puntos,5);done('Entrega una sola unidad real de calidad oro al finalizar la feria');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);done('Panel horizontal sin desbordamiento, errores de JavaScript ni recursos fallidos');
 await page.screenshot({path:path.join(out,'festival-completado.png')});
}catch(e){errors.push(String(e.stack));process.exitCode=1;await page.screenshot({path:path.join(out,'fallo.png')}).catch(()=>{});}
finally{fs.writeFileSync(path.join(out,'VERIFICACION-FESTIVALES.json'),JSON.stringify({checks,errors,bad,viewport:[844,390],escenariosPreparados:'Fechas de primavera/otoño y cosecha oro, contexto aislado.',dispositivosFisicos:[]},null,2));console.log(JSON.stringify({checks:checks.length,errors,bad}));await browser.close();}
