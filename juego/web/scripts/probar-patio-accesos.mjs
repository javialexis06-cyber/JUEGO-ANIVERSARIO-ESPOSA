// Acceso y regreso desde el patio real y la sala de amigos, con contextos aislados.
// CHROME_PATH=/usr/bin/chromium node scripts/probar-patio-accesos.mjs URL_COMPLETA URL_AMIGOS SALIDA
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:4182/',baseAmigos=process.argv[3]??'http://127.0.0.1:4184/',out=process.argv[4]??'test-results/patio-2026-10-16/accesos';await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const c=await b.newContext({viewport:{width:844,height:390},hasTouch:true}),p=await c.newPage(),errores=[],bad=[],checks=[];
p.setDefaultTimeout(90000);p.on('pageerror',e=>errores.push(e.message));p.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url());});
async function casa(){await p.waitForFunction(()=>window.__listo===true,null,{timeout:180000});await p.evaluate(()=>{const m=window.__mundo();m.__dibujarPrueba=m.dibujar.bind(m);m.dibujar=()=>{};});}
async function captura(n){await p.evaluate(()=>{const m=window.__mundo?.();if(m?.__dibujarPrueba){m.sucio=true;m.__dibujarPrueba(1/30,false);}});await p.screenshot({path:`${out}/${n}.png`});}
try{
 await p.goto(new URL('index.html?rol=ella&local=1&rapido=4',base).href);await casa();await p.evaluate(()=>window.__ampliar('patio'));await p.locator('#carga:not([hidden])').waitFor({state:'hidden'});
 const antes=await p.evaluate(()=>{const s=window.__casa();return{monedas:s.monedas,inventario:s.inventario};});
 for(const id of ['mente','jardin']){
  const boton=p.locator(`[data-accion="jugar-${id}"]`);await boton.scrollIntoViewIfNeeded();await captura(`patio-${id}`);await boton.click();await p.waitForURL(new RegExp(`${id}\\.html`));const u=new URL(p.url());assert.equal(u.searchParams.get('rol'),'ella');assert.equal(u.searchParams.get('local'),'1');
  if(id==='mente'){await p.waitForFunction(()=>window.__mente);await p.locator('[data-a="salir"]').click();}
  else{await p.waitForFunction(()=>window.__jardin);await p.locator('[data-salir]').click();}
  await p.waitForURL(/index\.html.*desdePatio/);await casa();assert.equal(await p.evaluate(()=>window.__casa().cuarto),'patio');const s=await p.evaluate(()=>window.__casa());assert.equal(s.yo,'ella');assert.equal(new URL(p.url()).searchParams.get('local'),'1');assert.deepEqual({monedas:s.monedas,inventario:s.inventario},antes);checks.push(`Casa → ${id} → patio conserva rol, modo local, monedas e inventario`);
 }
 await captura('patio-retorno');await c.close();
 const amigos=await b.newContext({viewport:{width:844,height:390}});await amigos.addInitScript(()=>localStorage.setItem('nuestro-hogar-amigo',JSON.stringify({id:'amigo-accesos0001',nombre:'Prueba del patio',cuerpo:'el',piel:'#f6c8a4',pelo:'#c99a5b',ropa:'#3fb5a3',ropa2:'#4a4a52',zapatos:'#f4efe6',activo:true,creado:1})));
 const a=await amigos.newPage();a.setDefaultTimeout(90000);a.on('pageerror',e=>errores.push(e.message));a.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url());});await a.goto(new URL('amigos.html',baseAmigos).href);
 for(const id of ['mente','jardin']){const tarjeta=a.locator(`[data-j="${id}"]`);await tarjeta.scrollIntoViewIfNeeded();await tarjeta.click();await a.waitForURL(new RegExp(`${id}\\.html`));await a.locator(id==='mente'?'[data-a="salir"]':'[data-salir]').click();await a.waitForURL(/amigos\.html/);checks.push(`Tarjeta ${id} de amigos y regreso a su sala`);}
 await amigos.close();assert.deepEqual(errores,[]);assert.deepEqual(bad,[]);await writeFile(`${out}/resultado.json`,JSON.stringify({checks,errores,bad,escenario:'Contextos nuevos aislados; patio habilitado mediante hook existente, sin tocar cuentas reales.'},null,2));console.log(checks.join('\n'));
}catch(e){if(!p.isClosed())await p.screenshot({path:`${out}/fallo.png`}).catch(()=>{});throw e;}finally{await b.close();}
