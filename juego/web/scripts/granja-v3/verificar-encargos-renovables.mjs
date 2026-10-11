/** Build completo y contexto aislado. Prepara semilla, lugares, recursos y actividad; no certifica campaña completa. */
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
const base=new URL(process.argv[2]??'http://127.0.0.1:4182/');
const out=process.argv[3]?path.resolve(process.argv[3]):fs.mkdtempSync(path.join(tmpdir(),'encargos-renovables-'));
const web=fileURLToPath(new URL('../../',import.meta.url)),rel=path.relative(web,out);
if(!rel||!rel.startsWith('..')&&!path.isAbsolute(rel)&&!rel.startsWith('test-results'+path.sep))throw Error('Usa una carpeta externa o test-results.');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:844,height:390}}),checks=[],errors=[],bad=[];
page.setDefaultTimeout(60000);await page.addInitScript(()=>localStorage.setItem('granja-hud-calidad','ligera'));
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url());});
const done=texto=>{checks.push(texto);console.log('OK '+texto);};
const ready=async()=>{await page.waitForFunction(()=>window.__granjaV3?.ready,null,{timeout:180000});await page.evaluate(()=>window.__granjaV3.settled());};
const state=()=>page.evaluate(()=>window.__granjaV3.estado());
const record=(s,id)=>s.encargos.registros.find(r=>r.id===id);
const open=async()=>{await page.evaluate(()=>window.__granjaV3.panel('servicio'));const boton=page.locator('[data-do="abrir-diario"]');if(await boton.count())await boton.click();else{await page.evaluate(()=>window.__granjaV3.panel('inventario'));await page.locator('.menu-pestana[data-panel="diario"]').click();}};
async function fixture({servicio='archivo',legacy=false,dia,actividad=false,materiales=false}={}){
 const r=await page.evaluate(async args=>{const h=window.__granjaV3,s=h.estado();s.zona='pueblo';s.interior=null;s.servicio=args.servicio;s.jornada.minutos=660;s.jornada.resumenPendiente=false;s.jornada.ultimaNoche=null;s.posicionExterior={zona:'pueblo',x:82,z:13};
  if(args.legacy)s.encargos={version:1,registros:[]};if(args.dia!==undefined)s.jornada.diasCompletados=args.dia;
  const add=(articulo,cantidad,calidad)=>{const k=s.casillasInventario.findIndex(p=>p?.articulo===articulo&&(p.calidad??0)===calidad);if(k>=0)s.casillasInventario[k].cantidad+=cantidad;else s.casillasInventario[s.casillasInventario.findIndex(p=>!p)]={articulo,cantidad,calidad};};
  if(args.legacy)add('madera',6,3);if(args.materiales){add('madera',24,2);add('piedra',16,1);}if(args.actividad){const r=s.encargos.registros.find(r=>r.id==='especial_0_0');s.estadisticas.madera=r.inicios[0]+12;}
  s.inventario={};for(const p of s.casillasInventario)if(p)s.inventario[p.articulo]=(s.inventario[p.articulo]??0)+p.cantidad;
  const r=await h.cargar(s);if(r.ok){h.vista.avatar.setPosition(0,0);h.guardar();}return r;
 },{servicio,legacy,dia,actividad,materiales});assert.equal(r.ok,true,r.mensaje);await open();
}
async function click(tipo,id,extra=''){
 const s=await state(),revision=s.revision;await page.evaluate(()=>document.getElementById('toast').textContent='');
 await page.locator(`[data-do="encargo-${tipo}"][data-id="${id}"]${extra}`).click();
 // Un éxito aumenta revisión; un fallo muestra aviso y deja intacto el pedido.
 await page.waitForFunction(revision=>window.__granjaV3.estado().revision>revision||document.querySelector('#toast')?.textContent?.includes('No se pudo guardar'),revision,{timeout:60000});
 await page.evaluate(()=>window.__granjaV3.settled());
}
async function quota(fail){await page.evaluate(fail=>{if(!fail){window.__restaurarStorage();return;}const original=Storage.prototype.setItem;window.__restaurarStorage=()=>Storage.prototype.setItem=original;Storage.prototype.setItem=function(k,v){if(k==='nuestra-granjita-v3')throw new DOMException('Cuota preparada','QuotaExceededError');return original.call(this,k,v);};},fail);}
async function deliver(id,i,n,q){const s=await state(),k=s.casillasInventario.findIndex(p=>p?.articulo===(i===1?'madera':'piedra')&&(p.calidad??0)===q);assert.ok(k>=0);await page.locator(`#encargo-pila-${id}-${i}`).selectOption(String(k));await page.locator(`#encargo-cantidad-${id}-${i}`).fill(String(n));await click('entregar',id,`[data-objetivo="${i}"]`);}
async function sleep(){
 const r=await page.evaluate(async()=>{const h=window.__granjaV3,s=h.estado();s.zona='granja';s.servicio=null;s.interior=null;const r=await h.cargar(s);if(!r.ok)return r;h.vista.avatar.setPosition(-5,-.5);return h.actuar({tipo:'dormir',jornada:s.jornada.diasCompletados,edificioId:'casa_inicial',xJugador:-5,zJugador:-.5});});assert.equal(r.ok,true,r.mensaje);
 await page.locator('[data-jornada="continuar"]').click();await page.waitForFunction(()=>!window.__granjaV3.estado().jornada.resumenPendiente);
}
try{
 await page.goto(new URL('granja-v3.html',base).href);await ready();await fixture({legacy:true});
 assert.equal((await state()).encargos.version,2);assert.equal((await state()).encargos.semilla,1);assert.equal(await page.locator('[data-do="encargo-aceptar"][data-id^="diario_"]').count(),2);assert.ok(await page.locator('[data-do="encargo-aceptar"][data-id="semanal_0_0"]').count());done('Guardado anterior migra y el tablón abre dos diarias, semanal y especial');
 await quota(true);await click('aceptar','diario_0_0');assert.equal(record(await state(),'diario_0_0'),undefined);await quota(false);await click('aceptar','diario_0_0');await page.reload();await ready();await open();assert.equal(record(await state(),'diario_0_0').fase,'activo');done('Aceptar falla sin cambios ante cuota y persiste al reintentar y recargar');
 await sleep();await fixture({servicio:'carpinteria'});assert.equal(record(await state(),'diario_0_0').fase,'activo');assert.ok(await page.locator('[data-do="encargo-aceptar"][data-id="diario_1_0"]').count());done('Dormir renueva ofertas diarias y conserva el pedido aceptado con su fecha original');
 const slot=(await state()).casillasInventario.findIndex(p=>p?.articulo==='madera'&&p.calidad===3);await page.locator('#encargo-pila-diario_0_0-0').selectOption(String(slot));await page.locator('#encargo-cantidad-diario_0_0-0').fill('2');await click('entregar','diario_0_0','[data-objetivo="0"]');assert.equal((await state()).casillasInventario[slot].cantidad,4);assert.equal(record(await state(),'diario_0_0').entregas[0].calidad,3);await click('cancelar','diario_0_0');assert.equal((await state()).casillasInventario[slot].cantidad,6);done('Entrega parcial usa la casilla iridio elegida y cancelar devuelve esa calidad');
 await click('aceptar','especial_0_0');assert.ok((await page.locator('[data-encargo="especial_0_0"]').innerText()).includes('Etapa 1 / 2'));assert.equal(await page.locator('[data-do="encargo-entregar"][data-id="especial_0_0"]').count(),0);done('Especial presenta la primera etapa y bloquea entregas futuras');
 await fixture({servicio:'carpinteria',actividad:true});await quota(true);await click('avanzar','especial_0_0');assert.equal(record(await state(),'especial_0_0').etapa,0);await quota(false);await click('avanzar','especial_0_0');await page.reload();await ready();await open();assert.equal(record(await state(),'especial_0_0').etapa,1);done('Avanzar etapa revierte si no puede guardar y conserva el paso al recargar');
 await fixture({servicio:'carpinteria',materiales:true});await deliver('especial_0_0',1,24,2);await deliver('especial_0_0',2,16,1);assert.deepEqual(record(await state(),'especial_0_0').entregas.map(e=>[e.cantidad,e.calidad]),[[24,2],[16,1]]);done('La segunda etapa registra materiales y calidades concretos desde controles reales');
 const before=await state();await quota(true);await click('reclamar','especial_0_0');let after=await state();assert.deepEqual(after.encargos,before.encargos);assert.deepEqual(after.inventario,before.inventario);assert.deepEqual(after.pueblo,before.pueblo);assert.equal(after.monedas,before.monedas);await quota(false);await click('reclamar','especial_0_0');after=await state();assert.equal(after.monedas,before.monedas+360);assert.equal(after.inventario.aspersor_basico,1);assert.equal(record(after,'especial_0_0').fase,'completado');done('Cobrar revierte premio, monedas y amistad ante cuota; reintento entrega un solo aspersor');
 await page.reload();await ready();await open();after=await state();assert.equal(after.inventario.aspersor_basico,1);assert.equal(record(after,'especial_0_0').fase,'completado');assert.equal(await page.locator('[data-do="encargo-reclamar"][data-id="especial_0_0"]').count(),0);done('Cierre y premio sobreviven recarga y desaparece el botón de cobro');
 await fixture({dia:6});await sleep();await fixture();assert.ok(await page.locator('[data-do="encargo-aceptar"][data-id="semanal_1_0"]').count());assert.ok(await page.locator('[data-do="encargo-aceptar"][data-id="especial_1_0"]').count());assert.equal(record(await state(),'especial_0_0').fase,'completado');done('Dormir en la frontera semanal renueva ambas ofertas y conserva el historial');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);done('Panel horizontal sin desbordamiento, errores de JavaScript ni recursos fallidos');
 await page.screenshot({path:path.join(out,'encargos-renovables.png')});
}catch(e){errors.push(String(e.stack));process.exitCode=1;await page.screenshot({path:path.join(out,'fallo.png')}).catch(()=>{});}
finally{fs.writeFileSync(path.join(out,'VERIFICACION-ENCARGOS-RENOVABLES.json'),JSON.stringify({checks,errors,bad,viewport:[844,390],escenariosPreparados:'Semilla, servicios, actividad, materiales y frontera semanal; contexto aislado.',dispositivosFisicos:[]},null,2));console.log(JSON.stringify({checks:checks.length,errors,bad}));await browser.close();}
