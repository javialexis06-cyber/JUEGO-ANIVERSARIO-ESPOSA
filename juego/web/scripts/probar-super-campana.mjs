// Campaña ordinaria: cada día se desbloquea ganando el anterior y toda mejora se paga por la interfaz.
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:5176/',out=process.argv[3]??'test-results/super-campana',hasta=Number(process.env.HASTA??100);
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true}),errores=[],dias=[],compras=[];
p.setDefaultTimeout(90000);p.on('pageerror',e=>errores.push(e.message));
await p.routeWebSocket(u=>u.host===new URL(base).host&&u.searchParams.has('token'),s=>s.send(JSON.stringify({type:'connected'})));
if(process.env.REANUDAR){
 await p.addInitScript(datos=>{if(sessionStorage.getItem('super-prueba-restaurada'))return;for(const [k,v] of Object.entries(datos))localStorage.setItem(k,v);sessionStorage.setItem('super-prueba-restaurada','1');},JSON.parse(await readFile(process.env.REANUDAR,'utf8')));
 try{const previo=JSON.parse(await readFile(`${out}/resultado.json`,'utf8'));dias.push(...previo.dias);compras.push(...previo.compras);}catch(e){if(e.code!=='ENOENT')throw e;}
 console.log('Reanudando la copia producida por el recorrido anterior, sin añadir recursos');
}
await p.addInitScript(()=>{const orig=Storage.prototype.setItem;window.__rechazarSuper=false;Storage.prototype.setItem=function(k,v){if(window.__rechazarSuper&&k==='supermania-jugable1')throw new DOMException('Prueba sin espacio','QuotaExceededError');return orig.call(this,k,v);};});
const guardado=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('supermania-jugable1')));
const foto=async nombre=>{await p.evaluate(()=>{const m=window.__mundo();if(m?.__dibujarOriginal)m.__dibujarOriginal(1/30,!!window.__juego());});await p.screenshot({path:`${out}/${nombre}.png`});};
const menu=async()=>{
 for(let i=0;i<5;i++){
  if(await p.locator('#menu:not([hidden])').count())return;
  if(await p.locator('#carta:not([hidden])').count())await p.locator('#btn-carta').tap();
  else await p.waitForTimeout(150);
 }
 await p.locator('#menu:not([hidden])').waitFor();
};
const comprar=async dia=>{
 await p.locator('#btn-mejoras').tap();await p.locator('#mejoras:not([hidden])').waitFor();
 const prioridades=['Cajera','Tenis nuevos','Bodega ordenada','Estantes fáciles','Carrito grande','Reponedor','Aseo','Guardia','Más canastas','Matera','Música en','Globos de','Segunda caja','Capacitación','Segundo reponedor','Trapero grande','Cámara','Segunda caneca','Comprar','Mejorar'];
 for(let n=0;n<70;n++){
  const opciones=await p.locator('#mej-lista li').evaluateAll(ls=>ls.map((l,i)=>({i,nombre:l.querySelector('strong')?.textContent??'',precio:Number(l.querySelector('button')?.textContent),disponible:!!l.querySelector('button:not([disabled])')})).filter(x=>x.disponible));
  const opcion=opciones.map(x=>({...x,prioridad:prioridades.findIndex(t=>x.nombre.startsWith(t))})).filter(x=>x.prioridad>=0).sort((a,b)=>a.prioridad-b.prioridad)[0];if(!opcion)break;
  const antes=await guardado();await p.locator('#mej-lista li').nth(opcion.i).locator('button').tap();
  const despues=await guardado();assert.ok(JSON.stringify(antes)!==JSON.stringify(despues),'Una compra debe cambiar el progreso');assert.ok(despues.dinero>=0);assert.ok(despues.gastadas>=antes.gastadas);
  compras.push({dia,...opcion,dineroAntes:antes.dinero,dineroDespues:despues.dinero,gastadasAntes:antes.gastadas,gastadasDespues:despues.gastadas});
 }
 await p.locator('#btn-mej-cerrar').tap();await menu();
};
try{
 await p.goto(new URL('super.html?rol=el&local=1&bot&rapido=40',base).href,{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.__mundo?.());await p.evaluate(()=>{const m=window.__mundo();m.__dibujarOriginal=m.dibujar.bind(m);m.dibujar=()=>{};});await menu();
 const inicial=await guardado(),primerDia=inicial?Math.min(100,1+Object.keys(inicial.estrellas).filter(k=>inicial.estrellas[k][0]).length):1;
 for(let dia=primerDia;dia<=hasta;dia++){
  let pasado=false;
  for(let intento=1;intento<=4&&!pasado;intento++){
   await menu();if(dia>1)await comprar(dia);
   const antes=await guardado();const ficha=p.getByRole('button',{name:`Nivel ${dia}`,exact:true});await ficha.scrollIntoViewIfNeeded();assert.equal(await ficha.isDisabled(),false,'El día se desbloquea jugando');await ficha.tap();
   if(dia===1&&intento===1)await p.evaluate(()=>window.__rechazarSuper=true);
   await p.locator('#btn-abrir').tap();await p.locator('#resultado:not([hidden])').waitFor({timeout:180000});
   const resultado=await p.evaluate(()=>window.__estado().resultado);assert.ok(resultado);assert.ok(resultado.stats.atendidos>0);assert.ok(resultado.ganancia>=0);
   if(dia===1&&intento===1){
    assert.equal(await p.locator('[data-reintentar-super]').count(),1);await p.locator('#btn-siguiente').tap();assert.equal(await p.locator('#resultado:not([hidden])').count(),1,'El día pendiente no se abandona');
    assert.deepEqual(await guardado(),antes);await p.evaluate(()=>window.__rechazarSuper=false);await p.locator('[data-reintentar-super]').tap();assert.equal(await p.locator('[data-reintentar-super]').count(),0);
   }
   const despues=await guardado();assert.ok(despues);assert.equal(despues.dinero,(antes?.dinero??0)+resultado.ganancia);assert.deepEqual(despues.estrellas[dia],resultado.estrellas.map((e,i)=>e||!!antes?.estrellas?.[dia]?.[i]));
   pasado=resultado.estrellas[0];dias.push({dia,intento,pasado,resultado,dinero:despues.dinero,tamano:despues.tamano,mejoras:despues.mejoras});
   await writeFile(`${out}/resultado.json`,JSON.stringify({dias,compras,errores,limites:'Piloto normal por tareas, reloj acelerado y dibujo solo en capturas; no prueba habilidad humana ni Android físico.'},null,2));
   await writeFile(`${out}/reanudar.json`,JSON.stringify(await p.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('supermania')||k==='nuestro-hogar-sueldo').map(k=>[k,localStorage.getItem(k)]))),null,2));
   if([1,25,26,50,51,75,76,100].includes(dia))await foto(`dia-${dia}-intento-${intento}`);
   console.log('DIA',dia,'intento',intento,pasado?'GANADO':'PERDIDO','estrellas',resultado.estrellas.filter(Boolean).length,'ganancia',resultado.ganancia,'compras',compras.length);
   await p.locator('#btn-rmenu').tap();await menu();
  }
  assert.equal(pasado,true,`El piloto no pasó el día ${dia}; registrar estrategia y mejoras antes de atribuirlo al balance`);
  if([1,25,50,75,100].includes(dia)){const antes=await guardado();await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.__mundo?.());await p.evaluate(()=>{const m=window.__mundo();m.__dibujarOriginal=m.dibujar.bind(m);m.dibujar=()=>{};});await menu();assert.deepEqual(await guardado(),antes);}
 }
 assert.deepEqual(errores,[]);console.log('OK campaña hasta',hasta,'sin recursos ni desbloqueos preparados');
}catch(e){await foto('fallo').catch(()=>{});throw e;}finally{await browser.close();}
