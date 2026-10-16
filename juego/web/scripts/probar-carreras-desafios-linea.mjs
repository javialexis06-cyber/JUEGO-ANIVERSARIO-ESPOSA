// Cuatro desafíos completos por sala: resultados, podio, marcas propias, retorno y recarga.
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {SupabaseFalso} from './supabase-falso.mjs';
const base=process.argv[2]??'http://127.0.0.1:4182/',out=process.argv[3]??'test-results/carreras-desafios-linea';await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const amigo=process.env.AMIGO==='1',red=new SupabaseFalso({perder:.06,demora:160}),contextos=await Promise.all([0,1].map(()=>b.newContext({viewport:{width:844,height:390},hasTouch:true})));
const a=await contextos[0].newPage(),c=await contextos[1].newPage(),pages=[a,c],errores=[],partidas=[];
for(const ctx of contextos)await ctx.addInitScript(()=>{
 for(const C of [WebGLRenderingContext,WebGL2RenderingContext])for(const n of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){const original=C.prototype[n];if(original)C.prototype[n]=function(...args){if(window.__dibujarCaptura)return original.apply(this,args);};}
});
for(const [i,p] of pages.entries()){p.setDefaultTimeout(120000);p.on('pageerror',e=>errores.push(e.message));await red.conectar(p,amigo?'amigo':i?'ella':'el');if(amigo)await p.addInitScript(i=>localStorage.setItem('nuestro-hogar-amigo',JSON.stringify({id:`amigo-piloto-${i}`,nombre:`Piloto ${i+1}`,activo:true,creado:1,aspecto:{cuerpo:i?'ella':'el'}})),i);}
const url=rol=>new URL(`carreras.html?rol=${rol}&bot=1&sinprecalentar&rapido=4${amigo?'&amigo=1':''}`,base).href;
const foto=async(p,n)=>{await p.evaluate(()=>window.__dibujarCaptura=true);await p.waitForTimeout(150);await p.screenshot({path:`${out}/${n}.png`});await p.evaluate(()=>window.__dibujarCaptura=false);};
try{
 await a.goto(url('el'),{waitUntil:'domcontentloaded'});await a.locator('[data-ir="linea"]').tap();await a.locator('[data-c="mini"]').tap();await a.locator('.se-codigo b').first().waitFor();
 const codigo=(await a.locator('.se-codigo b').allTextContents()).join('');await a.locator('[data-x="duracion"]').tap();await a.locator('[data-x="duracion"]').tap();assert.match(await a.locator('.se-sub').innerText(),/1 min/);
 await c.goto(url('ella'),{waitUntil:'domcontentloaded'});await c.locator('[data-ir="linea"]').tap();await c.locator('.car-unirse input').fill(codigo);await c.locator('[data-c="unirse"]').tap();
 await a.waitForFunction(()=>document.querySelectorAll('.se-puesto:not(.vacio)').length===2);
 console.log('OK sala con dos perfiles independientes');
 for(const [n,tipo] of ['globos','monedas','anillos','trucos'].slice(0,Number(process.env.HASTA??4)).entries()){
  if(n)await a.locator('[data-x="reto"]').tap();
  await c.waitForFunction(texto=>document.querySelector('.se-sub')?.textContent===texto,await a.locator('.se-sub').innerText());
  console.log('Preparando',tipo);
  await c.locator('[data-a="principal"]').tap({force:true});await a.waitForFunction(()=>!document.querySelector('[data-a="principal"]').disabled);await a.locator('[data-a="principal"]').tap({force:true});
  await Promise.all(pages.map(p=>p.waitForFunction(t=>window.__carreras?.sim.mini?.tipo===t&&document.querySelector('.car-pausa'),tipo)));
  await a.waitForFunction(()=>window.__carreras.sim.t>3);
  if(n===0)await foto(a,'batalla');
  if(n===1){red.cortar(c,true);await c.waitForTimeout(900);red.cortar(c,false);}
  await Promise.all(pages.map(p=>p.locator('.car-resultados li').first().waitFor({state:'visible'})));
  const tablas=await Promise.all(pages.map(p=>p.locator('.car-resultados li').evaluateAll(xs=>xs.map(x=>({nombre:x.querySelector('b').textContent,puntos:x.querySelector('.t').textContent})))));
  assert.equal(tablas[0].length,8);assert.deepEqual(tablas[0],tablas[1]);
  const estados=await Promise.all(pages.map(p=>p.evaluate(()=>({orden:window.__carreras.sim.orden,resumen:window.__carreras.sim.mini.resumen(),mio:window.__carreras.mio,pista:window.__carreras.sim.pista.d.id}))));
  assert.deepEqual(estados[0].orden,estados[1].orden);assert.deepEqual(estados[0].resumen,estados[1].resumen);
  assert.ok(estados[0].resumen.puntos.some(x=>x>0));await foto(c,`resultado-${tipo}`);partidas.push({tipo,tabla:tablas[0],estados});console.log('OK desafío completo',tipo,'con resultado idéntico');
  await Promise.all(pages.map(p=>p.locator('.car-fin [data-seguir]').tap()));await Promise.all(pages.map(p=>p.locator('.podio [data-seguir]').waitFor()));
  for(const p of pages)assert.ok((await p.locator('.podio p span').first().innerText()).includes(tablas[0][0].nombre));
  await Promise.all(pages.map(p=>p.locator('.podio [data-seguir]').tap()));await Promise.all(pages.map(p=>p.locator('.sala-espera .se-codigo').waitFor()));
 }
 const guardados=await Promise.all(pages.map(p=>p.evaluate(amigo=>JSON.parse(localStorage.getItem(amigo?'amigo-carreras-progreso':'carreras-progreso')),amigo)));
 for(const [i,g] of guardados.entries()){const claves=Object.keys(g.retos).filter(k=>k.startsWith('sala:'));assert.equal(claves.length,partidas.length);for(const partida of partidas){const e=partida.estados[i],clave=`sala:${partida.tipo}:${e.pista}:carrera:60`;assert.equal(g.retos[clave],e.resumen.puntos[e.mio]);}assert.ok(claves.every(k=>g.retos[k]>=0));assert.equal(Object.keys(g.retos).filter(k=>!k.startsWith('sala:')).length,0);}
 await a.locator('.sala-espera [data-a="salir"]').tap();await Promise.all(pages.map(p=>p.locator('[data-ir="gp"]').waitFor()));
 for(const [i,p] of pages.entries()){await p.reload({waitUntil:'domcontentloaded'});await p.locator('[data-ir="gp"]').waitFor();assert.deepEqual(await p.evaluate(amigo=>JSON.parse(localStorage.getItem(amigo?'amigo-carreras-progreso':'carreras-progreso')),amigo),guardados[i]);}
 assert.deepEqual(errores,[]);await writeFile(`${out}/resultado.json`,JSON.stringify({amigo,partidas,recarga:true,retorno:true,errores,limites:'Dos contextos aislados, Supabase simulado con pérdida del 6 % y demora de hasta 160 ms, corte recuperado, piloto normal, reloj x4 y dibujo por captura. No certifica teléfonos ni internet real.'},null,2));console.log('OK marcas de sala, podios, retorno y recarga');
}catch(e){for(const [i,p]of pages.entries()){console.error('Estado',i,await p.evaluate(()=>({texto:document.body.innerText,t:window.__carreras?.sim.t,tipo:window.__carreras?.sim.mini?.tipo,fin:window.__carreras?.sim.terminada})).catch(()=>null));await foto(p,`fallo-${i}`).catch(()=>{});}throw e;}finally{await b.close();}
