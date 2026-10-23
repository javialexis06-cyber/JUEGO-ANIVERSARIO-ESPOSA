/** Sirve exclusivamente el HTML autónomo: comprueba audio, partida y recarga sin dependencias externas. */
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {stat,mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {once} from 'node:events';
import {resolve} from 'node:path';
const archivo=resolve(process.argv[2]??'test-results/conquista/la-semilla-madre-jugable.html'),out=process.argv[3]??'test-results/conquista/portatil';
await mkdir(out,{recursive:true});const bytes=(await stat(archivo)).size,errores=[],requests=[];
const server=createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});createReadStream(archivo).pipe(res);});server.listen(0,'127.0.0.1');await once(server,'listening');const url=`http://127.0.0.1:${server.address().port}/jugable.html?prueba=1`;
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/chromium',args:['--no-sandbox']});let ok=false;
try{
 const c=await browser.newContext({viewport:{width:1280,height:720}});
 await c.route('**/*',async route=>{if(route.request().url()===url)return route.continue();if(new URL(route.request().url()).pathname==='/favicon.ico')return route.fulfill({status:204,body:''});requests.push(route.request().url());return route.abort();});
 const p=await c.newPage();p.setDefaultTimeout(60000);p.on('pageerror',e=>errores.push(e.stack??e.message));
 await p.goto(url,{timeout:120000});await p.waitForFunction(()=>window.__historiaPvZ);
 await p.screenshot({path:out+'/portada.png'});await p.locator('[data-cq="ayuda"]').click();await p.waitForFunction(()=>document.querySelector('.cq-dave').naturalWidth>0);
 await p.locator('.cq-tutorial [data-cq="sonido"]').click();await p.waitForFunction(()=>[...window.__historiaPvZ.audio().banco.voces.values()].includes('dave-saludo'));
 assert.equal(await p.evaluate(()=>Object.keys(window.__historiaPvZ.audio().banco.indice.recursos).length),253);await p.locator('[data-cq="cerrar-tutorial"]').click();
 await p.locator('[data-cq="historia"]').click();await p.waitForFunction(()=>window.__historiaPvZ.mundo());
 await p.evaluate(()=>{window.__historiaPvZ.mundo().estado.config.incursiones=false;return window.__historiaPvZ.activarPiloto();});
 for(let i=0;i<30;i++){const r=await p.evaluate(()=>window.__historiaPvZ.avanzar(18000).mundo.ganador);if(r)break;}
 assert.equal(await p.evaluate(()=>window.__historiaPvZ.mundo().estado.ganador),'plantas');assert.ok(await p.evaluate(()=>window.__historiaPvZ.mundo().estado.zonas.every(z=>z.dueno==='plantas')));
 await p.waitForTimeout(500);await p.screenshot({path:out+'/final.png'});await p.reload({timeout:120000});await p.waitForFunction(()=>window.__historiaPvZ);await p.locator('[data-cq="continuar"]').click();await p.locator('.cq-final-rotulo').waitFor();
 assert.deepEqual(requests,[]);assert.deepEqual(errores,[]);ok=true;console.log('OK copia autónoma: doce escenarios sin incursiones, final, guardado, recarga, 253 audios incluidos y cero recursos externos');
}catch(e){errores.push(String(e.stack??e));throw e;}finally{await browser.close();server.close();await writeFile(out+'/resultado.json',JSON.stringify({ok,archivo,bytes,requests,errores,partida:'Doce escenarios sin incursiones estratégicas y piloto de órdenes legales. El servidor permite únicamente la navegación al HTML íntegro; se bloquean todas las dependencias externas. Carga, partida y recarga en Chromium. file:// bloqueado por la política del navegador de este entorno; no certifica políticas de archivos locales.'},null,2));}
