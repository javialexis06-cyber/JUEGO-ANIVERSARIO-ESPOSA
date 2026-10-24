/** Controles y protección de archivos con un punto real ganado por el recorrido nativo.
 * No simula victorias: importar el resultado previo solo prepara los casos de interfaz. */
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const base=process.argv[2]??'http://127.0.0.1:4196/';
const archivo=process.argv[3]??'test-results/historia-nativa/resultado.json';
const out=path.resolve(process.argv[4]??'test-results/historia-nativa/controles');
const ganado=JSON.parse(await fs.readFile(archivo,'utf8')).casa;
assert.ok(ganado?.zonas[0].punto&&!ganado.inicioCasa);
// Fixture de daño: reduce una planta del punto real; no concede vida, soles ni victorias.
const control=structuredClone(ganado);control.zonas[0].punto.plantas[0].vida=13;
await fs.mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/chromium',args:['--enable-webgl','--ignore-gpu-blocklist']});
const amigo=process.env.MODO_AMIGO==='1';
async function perfil(contexto){if(amigo)await contexto.addInitScript(()=>{if(window===window.top&&!localStorage.getItem('nuestro-hogar-amigo'))localStorage.setItem('nuestro-hogar-amigo',JSON.stringify({id:'amigo-nativocontrol',nombre:'Defensor',cuerpo:'el',piel:'#f6c8a4',pelo:'#c99a5b',ropa:'#3fb5a3',ropa2:'#4a4a52',zapatos:'#f4efe6',activo:true,creado:1}));});}
const c=await b.newContext({viewport:{width:844,height:390},hasTouch:true});
await perfil(c);
const p=await c.newPage(),checks=[],errors=[],bad=[];
p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(String(e.stack)));p.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))bad.push([r.status(),r.url()]);});
const ok=t=>{checks.push(t);console.log('OK '+t);};
const click=k=>p.locator(`.hn-capa [data-cq="${k}"]`).click();
const url=new URL('jardin.html?prueba=1&rol=ella&local=1',base).href;
let clave;
try{
 await p.goto(url);await p.locator('[data-cq="historia"]').click();await p.locator('.cq-nativa .hn-dave').waitFor();
 const revision=new URL(p.url());revision.searchParams.set('prueba','1');await p.goto(revision.href);await p.waitForFunction(()=>window.__historiaNativa);
 assert.match(p.url(),/modo=historia(?:&|$)/);await p.locator('.hn-dave').waitFor({state:'visible'});assert.ok(await p.locator('.hn-dave').isVisible());
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:path.join(out,'inicio-844.png')});ok('La portada abre Historia nativa y el inicio cabe en 844 × 390');
 const importable={name:'historia-nativa.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(control))};
 const abrir=async datos=>{const chooser=p.waitForEvent('filechooser');await click('importar');await(await chooser).setFiles(datos);};
 await abrir(importable);await click('cancelar-importacion');assert.equal(await p.evaluate(()=>__historiaNativa.mundo()),null);
 await abrir({...importable,buffer:Buffer.from('{"version":999}')});await p.locator('.hn-noticia').filter({hasText:'no es una historia nativa'}).waitFor();assert.equal(await p.evaluate(()=>__historiaNativa.mundo()),null);
 await abrir(importable);await click('confirmar-importacion');await p.waitForFunction(()=>__historiaNativa.mundo());
 clave=await p.evaluate(()=>localStorage.getItem('amigo-conquista-historia-nativa-v3')?'amigo-conquista-historia-nativa-v3':'conquista-historia-nativa-v3');
 assert.deepEqual(await p.evaluate(()=>__historiaNativa.observar().zonas),control.zonas);ok('Importar valida, permite cancelar y recupera el punto real solo tras confirmar');
 await p.locator('[data-hn-zona="8"]').click();await click('ver');await p.waitForFunction(()=>__historiaNativa.instancias().get(8)?.lista,null,{timeout:180000});
 const f=p.frames().find(f=>new URL(f.url()).searchParams.get('frente')==='8');
 const vida=await f.evaluate(foto=>System.get('chunks:///_virtual/CharacterManager.ts').PlantPool.pool().find(p=>p.Plant_Type===foto.tipo&&p.plantInLnC.lIndex===foto.fila&&p.plantInLnC.cIndex===foto.col)?.health,control.zonas[0].punto.plantas[0]);assert.equal(vida,13);ok('La restauración nativa conserva 13 de vida en la planta del caso preparado, sin curarla');
 const antesVista=await f.evaluate(()=>({t:System.get('chunks:///_virtual/levelController.ts').LevelPlay.component.gamedTime,ids:System.get('chunks:///_virtual/CharacterManager.ts').PlantPool.pool().filter(p=>p.node?.isValid&&p.health>0).map(p=>[p.node.uuid,p.health])}));
 await p.locator('[data-cq=\"mapa\"]').click();await p.locator('[data-hn-zona=\"8\"]').click();await click('ver');
 const despuesVista=await f.evaluate(()=>({t:System.get('chunks:///_virtual/levelController.ts').LevelPlay.component.gamedTime,ids:System.get('chunks:///_virtual/CharacterManager.ts').PlantPool.pool().filter(p=>p.node?.isValid&&p.health>0).map(p=>[p.node.uuid,p.health])}));assert.deepEqual(despuesVista,antesVista);ok('Volver a una defensa en descanso dibuja la misma instancia sin avanzar su reloj ni regenerarla');
 await p.mouse.click(90,190);await p.keyboard.press('Escape');await p.locator('.hn-capa h2').filter({hasText:'Un respiro'}).waitFor();
 assert.equal(await p.evaluate(()=>__historiaNativa.mundo().pausada),true);assert.equal(await f.evaluate(()=>System.get('chunks:///_virtual/UI.ts').UIInGame.component.paused),false);
 await click('pausa');await p.mouse.click(90,190);await p.keyboard.press('Space');await p.locator('.hn-capa h2').filter({hasText:'Un respiro'}).waitFor();assert.equal(await p.evaluate(()=>__historiaNativa.mundo().pausada),true);await click('pausa');ok('Escape y espacio nativos controlan la pausa global y no dejan una pausa local independiente');
 assert.equal(await f.evaluate(()=>System.get('chunks:///_virtual/UI.ts').UIInGame.component.s2xButton.node.active),false);
 await p.screenshot({path:path.join(out,'defensa-recuperada-844.png')});await p.locator('[data-cq="mapa"]').click();
 const otra=await c.newPage();await otra.goto(new URL('jardin.html?modo=historia&prueba=1',base).href);await otra.locator('.hn-capa h2').filter({hasText:'otra pestaña'}).waitFor();await otra.close();await p.bringToFront();
 if(await p.locator('.hn-capa [data-cq="pausa"]').count())await click('pausa');ok('Una segunda pestaña no toma el control ni sobrescribe el archivo');
 await p.evaluate(clave=>{window.__falloCuota=true;const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(window.__falloCuota&&k===clave)throw new DOMException('cuota','QuotaExceededError');return set.call(this,k,v);};},clave);
 await p.locator('[data-hn-zona="9"]').click();await p.locator('[data-cq="reintentar-guardado"]').waitFor();assert.equal(await p.evaluate(()=>__historiaNativa.mundo().pausada),true);
 await p.evaluate(()=>window.__falloCuota=false);await click('reintentar-guardado');await p.locator('.hn-capa [data-cq="reintentar-guardado"]').waitFor({state:'hidden'});assert.ok(await p.evaluate(()=>__historiaNativa.observar().conocidas.includes(9)));ok('Un fallo de escritura detiene los frentes y el reintento conserva la exploración');
 const raw=await p.evaluate(k=>localStorage.getItem(k),clave);const descarga=p.waitForEvent('download');void descarga.catch(()=>{});await p.locator('.hn-herramientas [data-cq="exportar"]').click();const fichero=await(await descarga).path();assert.deepEqual(JSON.parse(await fs.readFile(fichero,'utf8')).zonas,JSON.parse(raw).zonas);ok('Exportar descarga un respaldo recuperable del perfil actual');
 await p.locator('[data-cq="salir"]').click();await p.waitForURL(/modo=conquista/);assert.equal(JSON.parse(await p.evaluate(k=>localStorage.getItem(k),clave)).ataques.length,0);ok('Salir entre combates conserva el punto y no abre un ataque durante el cierre');
 const corrupto=await b.newContext();await perfil(corrupto);await corrupto.addInitScript(clave=>{if(window===window.top)localStorage.setItem(clave,'{"version":999}');},clave);const q=await corrupto.newPage();await q.goto(new URL('jardin.html?modo=historia&prueba=1',base).href);await q.locator('.hn-capa h2').filter({hasText:'No se pudo'}).waitFor();assert.equal(await q.evaluate(k=>localStorage.getItem(k),clave),'{"version":999}');await corrupto.close();ok('Un archivo futuro queda intacto y bloquea el reemplazo automático');
 const inicio=await b.newContext();await perfil(inicio);const r=await inicio.newPage();r.on('dialog',d=>d.accept());await r.goto(new URL('jardin.html?modo=historia&prueba=1',base).href);await r.locator('[data-cq="iniciar"]').click();await r.waitForFunction(()=>__historiaNativa.observar()?.ataques.length===1);const antes=await r.evaluate(()=>__historiaNativa.observar());await r.reload();await r.locator('[data-cq="retomar"]').waitFor();assert.equal(await r.locator('iframe').count(),0);assert.deepEqual(await r.evaluate(()=>__historiaNativa.observar()),antes);await inicio.close();ok('Recargar un ataque pendiente exige repetirlo explícitamente y conserva el último punto');
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
}catch(e){errors.push(String(e.stack));process.exitCode=1;await p.screenshot({path:path.join(out,'fallo.png')}).catch(()=>{});}finally{await fs.writeFile(path.join(out,'resultado.json'),JSON.stringify({checks,errors,bad,clave,alcance:'Casos de interfaz sobre un punto real previo. No certifica nuevas victorias ni guardado a mitad de combate.'},null,2));console.log(JSON.stringify({checks:checks.length,errors,bad}));await b.close();}
