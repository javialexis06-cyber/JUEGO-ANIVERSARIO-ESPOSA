// Dos pestañas y transporte local de salas: copa completa o SUELTA=1 para una carrera clásica; sin forzar resultados.
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:4182/',out=process.argv[3]??'test-results/carreras-linea';
await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true});const a=await ctx.newPage(),c=await ctx.newPage(),pages=[a,c],errores=[],carreras=[];
// El garaje también anima mientras se invita. En la GPU virtual se dibuja únicamente al capturar.
await ctx.addInitScript(()=>{
 for(const clase of [WebGLRenderingContext,WebGL2RenderingContext])for(const nombre of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){
  const original=clase.prototype[nombre];if(original)clase.prototype[nombre]=function(...args){if(window.__dibujarCaptura)return original.apply(this,args);};
 }
});
for(const p of pages){p.setDefaultTimeout(180000);p.on('pageerror',e=>errores.push(e.message));await p.routeWebSocket(u=>u.host===new URL(base).host&&u.searchParams.has('token'),s=>s.send(JSON.stringify({type:'connected'})));}
const suelta=process.env.SUELTA==='1',pistas=suelta?['valle']:['bosque','puerto','jardines','mercado'];
const extra=process.env.RED_MALA==='1'?'&red=mala':'';
const url=rol=>new URL(`carreras.html?rol=${rol}&salas=local&bot=1&sinprecalentar&rapido=4${extra}`,base).href;
const foto=async(p,n)=>{await p.evaluate(()=>{window.__dibujarCaptura=true;const v=window.__carreras?.vista;if(v?.renderer.__original)v.renderer.__original(v.escena,v.camara);});await p.screenshot({path:`${out}/${n}.png`});await p.evaluate(()=>window.__dibujarCaptura=false);};
try{
 await a.goto(url('el'),{waitUntil:'domcontentloaded'});await a.locator('[data-ir="linea"]').tap();await a.locator(`[data-c="${suelta?'suelta':'gp'}"]`).tap();await a.locator('.se-codigo b').first().waitFor();
 const codigo=(await a.locator('.se-codigo b').allTextContents()).join('');if(!suelta){await a.locator('[data-x="copa"]').tap();assert.match(await a.locator('.se-sub').innerText(),/Senderos/);}
 console.log(suelta?'OK sala creada, carrera clásica seleccionada':'OK sala creada, copa Senderos seleccionada');
 await c.goto(url('ella'),{waitUntil:'domcontentloaded'});await c.locator('[data-ir="linea"]').tap();await c.locator('.car-unirse input').fill(codigo);await c.locator('[data-c="unirse"]').tap();
 await a.waitForFunction(()=>document.querySelectorAll('.se-puesto:not(.vacio)').length===2);await c.locator('[data-a="principal"]').tap({force:true});await a.waitForFunction(()=>!document.querySelector('[data-a="principal"]').disabled);await a.locator('[data-a="principal"]').tap({force:true});
 console.log('OK dos jugadores listos, comienza la partida');
 let inscritos;
 for(const [n,id] of pistas.entries()){
  await Promise.all(pages.map(async p=>{
   await p.waitForFunction(id=>window.__carreras?.sim.pista.d.id===id&&!!document.querySelector('.car-pausa'),id);
   await p.evaluate(()=>{const r=window.__carreras.vista.renderer;r.__original??=r.render.bind(r);r.render=()=>{};});
   assert.equal(await p.evaluate(()=>window.__carreras.sim.karts.filter(k=>k.humano).length),2);
   assert.equal(await p.evaluate(()=>window.__carreras.sim.karts.length),8);
  }));
  const listas=await Promise.all(pages.map(p=>p.evaluate(()=>window.__carreras.sim.karts.map(k=>k.c.id).sort())));
  inscritos??=listas[0];for(const lista of listas)assert.deepEqual(lista,inscritos,'La copa conserva los mismos ocho corredores');
  await Promise.all(pages.map(p=>p.waitForFunction(()=>window.__carreras.sim.t>5)));
  if(n===0)await Promise.all(pages.map((p,i)=>foto(p,`jugando-${i}`)));
  await Promise.all(pages.map(p=>p.locator('.car-resultados li').first().waitFor({state:'visible'})));
  const tablas=await Promise.all(pages.map(p=>p.locator('.car-resultados li').evaluateAll(ls=>ls.map(l=>({nombre:l.querySelector('b').textContent,puntos:l.querySelector('strong')?Number(l.querySelector('strong').textContent):null,tiempo:l.querySelector('.t').textContent})))));
  assert.deepEqual(tablas[0],tablas[1]);if(!suelta)assert.equal(tablas[0].reduce((s,x)=>s+x.puntos,0),(n+1)*58);
  carreras.push({id,tabla:tablas[0]});await Promise.all(pages.map((p,i)=>foto(p,`resultado-${n}-${i}`)));
  await Promise.all(pages.map(p=>p.locator('.car-fin [data-seguir]').tap()));
  if(n<pistas.length-1){await a.locator('[data-sig]').tap();}else{
   await Promise.all(pages.map(p=>p.locator('.podio [data-seguir]').waitFor({state:'visible'})));
   for(const p of pages)assert.ok((await p.locator('.podio p span').first().innerText()).includes(tablas[0][0].nombre),'El podio coincide con la clasificación final');
   await Promise.all(pages.map((p,i)=>foto(p,`podio-${i}`)));await Promise.all(pages.map(p=>p.locator('.podio [data-seguir]').tap()));
  }
  console.log('OK partida en línea',n+1,id,'tabla idéntica para ambos');
 }
 await Promise.all(pages.map(p=>p.locator('.sala-espera .se-codigo').waitFor({state:'visible'})));
 await a.locator('.sala-espera [data-a="salir"]').tap();await Promise.all(pages.map(p=>p.locator('[data-ir="gp"]').waitFor({state:'visible'})));
 assert.deepEqual(errores,[]);await writeFile(`${out}/resultado.json`,JSON.stringify({carreras,errores,redMala:process.env.RED_MALA==='1',limites:'Dos pestañas en un navegador, BroadcastChannel local; piloto normal, reloj x4 y render solo en capturas. No certifica internet real ni teléfonos físicos.'},null,2));console.log('OK podio, retorno a sala y salida para ambos');
}catch(e){for(const [i,p]of pages.entries()){await foto(p,`fallo-${i}`).catch(()=>{});console.log('estado',i,await p.evaluate(()=>({texto:document.body.innerText,oculto:document.hidden,t:window.__carreras?.sim.t,k:window.__carreras?.sim.karts.map(k=>({c:k.control,t:k.tiempo,v:k.vuelta,fin:k.terminado}))})).catch(()=>null));}throw e;}finally{await b.close();}
