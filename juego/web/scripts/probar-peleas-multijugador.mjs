// Dos mandos y sala local real. Solo entradas normales y avance del reloj; no altera vida ni resultados.
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:5176/',out=process.argv[3]??'test-results/peleas-multijugador';
await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true}),a=await ctx.newPage(),c=await ctx.newPage(),errores=[],resultados=[];
for(const p of [a,c]){p.setDefaultTimeout(90000);p.on('pageerror',e=>errores.push(e.message));await p.routeWebSocket(u=>u.host===new URL(base).host&&u.searchParams.has('token'),s=>s.send(JSON.stringify({type:'connected'})));}
const abrir=async(p,rol)=>{
 await p.goto(new URL(`peleas.html?rol=${rol}&salas=local&bot1=7&sin-presentacion${process.env.RED_MALA==='1'?'&red=mala':''}`,base).href,{waitUntil:'domcontentloaded'});
 await p.locator('[data-m="versus"]').waitFor();await p.evaluate(()=>{const e=window.__peleasEscena();e.__dibujarOriginal=e.dibujar.bind(e);e.dibujar=()=>{};});
};
const elegir=async(p,id)=>{const tarjeta=p.locator(`.seleccion [data-id="${id}"]`);const activa=await tarjeta.evaluate(e=>e.classList.contains('activa'));await tarjeta.tap();if(!activa)await p.locator('.seleccion [data-listo]').tap();};
const foto=async(p,n)=>{await p.evaluate(()=>window.__peleasEscena().__dibujarOriginal(0));await p.screenshot({path:`${out}/${n}.png`});};
const terminar=async(p)=>{
 let fin;
 for(let i=0;i<90;i++){
  const actual=await p.evaluate(()=>{const s=window.__peleas();if(!s)return null;window.__peleasAvanzar(600);return {fase:s.fase,ganador:s.ganador,rondas:s.L.map(l=>l.rondas),pasos:s.pasos};});
  if(actual)fin=actual;
  if(!actual||await p.locator('.pantalla-resultado').count())break;
  await p.waitForTimeout(120);
 }
 assert.ok(fin);assert.equal(fin.fase,'fin');return fin;
};
try{
 await abrir(a,'el');
 for(const escenario of (process.env.SOLO_SALA==='1'?[]:['plaza','brasaviva','nieveclara'])){
  await a.locator('[data-m="versus"]').tap();await elegir(a,'otto');await elegir(a,'serena');await a.locator(`.escoger-escenario [data-id="${escenario}"]`).tap();
  await a.waitForFunction(()=>window.__peleas()?.L[0].def.id==='otto'&&document.querySelector('.hud-pausa'));
  await a.evaluate(()=>{for(let n=0;n<360&&window.__peleas().fase!=='pelea';n++)window.__peleasAvanzar(1);});
  const x=await a.evaluate(()=>window.__peleas().L[1].x);await a.keyboard.down('ArrowLeft');await a.evaluate(()=>window.__peleasAvanzar(30));await a.keyboard.up('ArrowLeft');
  assert.notEqual(await a.evaluate(()=>window.__peleas().L[1].x),x,'El segundo mando mueve su luchador');
  await a.locator('.hud-pausa').tap();const pasos=await a.evaluate(()=>window.__peleas().pasos);await a.waitForTimeout(500);assert.equal(await a.evaluate(()=>window.__peleas().pasos),pasos);await a.locator('[data-p="seguir"]').tap();
  const fin=await terminar(a);await a.locator('.pantalla-resultado').waitFor();await foto(a,`versus-${escenario}`);resultados.push({modo:'versus',escenario,...fin});
  await a.locator('.pantalla-resultado [data-r="menu"]').tap();console.log('OK dos mandos, pausa y resultado',escenario);
 }
 await a.locator('[data-m="linea"]').tap();await a.locator('[data-crear]').tap();await a.locator('.se-codigo b').first().waitFor();const codigo=(await a.locator('.se-codigo b').allTextContents()).join('');
 await abrir(c,'ella');await c.locator('[data-m="linea"]').tap();await c.locator('.linea-unirse input').fill(codigo);await c.locator('.linea-unirse button').tap();
 await a.waitForFunction(()=>document.querySelectorAll('.se-puesto:not(.vacio)').length===2);await c.locator('[data-a="principal"]').tap({force:true});await a.waitForFunction(()=>!document.querySelector('[data-a="principal"]').disabled);await a.locator('[data-a="principal"]').tap({force:true});
 await a.waitForFunction(()=>window.__peleas()&&document.querySelector('.hud-pausa'));await c.locator('.hud-pausa').waitFor();await c.keyboard.down('KeyL');
 const fin=await terminar(a);await c.keyboard.up('KeyL');await a.locator('.pantalla-resultado').waitFor();await c.locator('.pantalla-resultado').waitFor({timeout:15000});
 const titulos=await Promise.all([a,c].map(p=>p.locator('.pantalla-resultado h2').innerText()));assert.equal(titulos.filter(t=>t.includes('¡Ganaste!')).length,fin.ganador<0?0:1);
 resultados.push({modo:'sala-local',...fin,titulos});await foto(a,'sala-resultado-host');await foto(c,'sala-resultado-invitado');
 await Promise.all([a,c].map(p=>p.locator('[data-r="sala"]').tap()));await Promise.all([a,c].map(p=>p.locator('.se-codigo').waitFor()));
 console.log('OK sala: mismo final, ganador único y revancha disponible en ambos');assert.deepEqual(errores,[]);
 await writeFile(`${out}/resultado.json`,JSON.stringify({resultados,errores,limites:'Salas por BroadcastChannel, segundo mando con teclado automatizado y reloj acelerado. No certifica internet ni mandos físicos.'},null,2));
}catch(e){await foto(a,'fallo-host').catch(()=>{});await foto(c,'fallo-invitado').catch(()=>{});throw e;}finally{await b.close();}
