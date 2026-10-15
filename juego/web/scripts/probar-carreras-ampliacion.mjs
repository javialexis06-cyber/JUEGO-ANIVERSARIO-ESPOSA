// Menús y partidas completas del juego compilado. El piloto es el normal: no se fuerzan puntos ni victorias.
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:4184/',out=process.argv[3]??'test-results/carreras-ampliacion';
const amigo=process.env.AMIGO!=='0',completo=process.env.COMPLETO!=='0';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true}),errores=[],resultados=[];
page.setDefaultTimeout(120000);page.on('pageerror',e=>errores.push(e.message));
await page.routeWebSocket(u=>u.host===new URL(base).host&&u.searchParams.has('token'),s=>s.send(JSON.stringify({type:'connected'})));
if(amigo)await page.addInitScript(()=>localStorage.setItem('nuestro-hogar-amigo',JSON.stringify({id:'prueba-variedad',nombre:'Piloto',cuerpo:'el',piel:'#f6c8a4',pelo:'#c99a5b',ropa:'#3fb5a3',ropa2:'#4a4a52',zapatos:'#f4efe6',activo:true,creado:1})));
const clave=amigo?'amigo-carreras-progreso':'carreras-progreso';
const menu=()=>page.locator('[data-ir="gp"]').waitFor({state:'visible'});
const listo=async id=>{
 await page.waitForFunction(id=>window.__carreras?.sim.pista.d.id===id&&typeof window.__carreras.avanzar==='function'&&document.querySelector('.car-pausa'),id);
 await page.evaluate(()=>{const r=window.__carreras.vista.renderer;r.__original??=r.render.bind(r);r.render=()=>{};});
};
const foto=async nombre=>{await page.evaluate(()=>{const v=window.__carreras?.vista;if(v?.renderer.__original)v.renderer.__original(v.escena,v.camara);});await page.screenshot({path:`${out}/${nombre}.png`});};
const avanzar=async n=>page.evaluate(n=>window.__carreras.avanzar(n),n);
const meta=async()=>{
 const r=await page.evaluate(()=>{const h=window.__carreras,s=h.sim,k=s.karts[h.mio];for(let j=0;j<120&&!k.terminado;j++)h.avanzar(600);return {id:s.pista.d.id,terminado:k.terminado,vueltas:k.vueltas,tiempo:k.tiempo,mini:s.mini?.resumen(),orden:s.orden,mio:h.mio};});
 assert.equal(r.terminado,true);assert.equal(new Set(r.orden).size,8);assert.ok(r.tiempo>0);if(!r.mini)assert.equal(r.vueltas.length,3);
 await page.locator('.car-fin .car-resultados li').first().waitFor({state:'visible'});assert.equal(await page.locator('.car-resultados li').count(),8);resultados.push(r);return r;
};
const volverMini=async()=>{await page.locator('.car-fin [data-seguir]').tap();await page.locator('.podio [data-seguir]').tap();await page.locator('[data-b="menu"]').tap();await menu();};
try{
 await page.goto(new URL('carreras.html?bot=1&sinprecalentar',base).href,{waitUntil:'domcontentloaded'});await menu();
 await page.locator('[data-ir="gp"]').tap();assert.equal(await page.locator('[data-copa]').count(),4);await foto('copas');await page.locator('[data-atras]').tap();
 await page.locator('[data-ir="suelta"]').tap();assert.equal(await page.locator('.car-carta.pista').count(),16);
 await page.locator('[data-v="estacion"]').scrollIntoViewIfNeeded();await foto('circuitos-16');await page.locator('[data-atras]').tap();
 const pruebas=completo?[['globos','arena_plaza'],['globos','arena_hornos'],['globos','arena_cristal'],['monedas','arena_plaza'],['monedas','arena_hornos'],['monedas','arena_cristal'],['anillos','cristal'],['trucos','desierto']]:[['globos','arena_plaza'],['monedas','arena_cristal'],['anillos','cristal'],['trucos','desierto']];
 for(const [tipo,id] of pruebas){
  await page.locator('[data-ir="minijuegos"]').tap();assert.equal(await page.locator('[data-mini]').count(),4);if(resultados.length===0)await foto('desafios');
  await page.locator(`[data-mini="${tipo}"]`).tap();assert.equal(await page.locator('[data-mini-pista]').count(),tipo==='globos'||tipo==='monedas'?3:16);
  await page.locator('[data-duracion]').selectOption('60');await page.locator(`[data-mini-pista="${id}"]`).tap();await listo(id);await avanzar(900);await foto(`${tipo}-${id}-jugando`);
  if(tipo==='globos'&&id==='arena_plaza'){
   await page.locator('.car-pausa').tap();const t=await page.evaluate(()=>window.__carreras.sim.t);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.__carreras.sim.t),t);await page.locator('[data-p="seguir"]').tap();
   assert.equal(await page.evaluate(()=>window.__carreras.vista.globos.flat().length),24,'Se ven los tres globos de cada kart');
  }
  if(tipo==='monedas'&&id==='arena_plaza')await page.evaluate(clave=>{window.__cortar=true;const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(window.__cortar&&k===clave)throw new DOMException('Prueba de almacenamiento lleno','QuotaExceededError');return original.call(this,k,v);};},clave);
  const r=await meta();assert.equal(r.mini.tipo,tipo);assert.ok(r.mini.duracion>=30&&r.mini.duracion<61);await foto(`${tipo}-${id}-resultado`);
  if(tipo==='monedas'&&id==='arena_plaza'){
   await page.locator('.car-fin [data-seguir]').tap();assert.equal(await page.locator('.car-resultados li').count(),8,'El resultado permanece hasta confirmar su guardado');
   await page.evaluate(()=>window.__cortar=false);await page.locator('[data-reintentar-guardado]').tap();
  }
  await volverMini();const guardado=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),clave);assert.equal(guardado.retos[`${tipo}:${id}:carrera:60`],r.mini.puntos[r.mio]);
  await page.locator('[data-ir="minijuegos"]').tap();await page.locator(`[data-mini="${tipo}"]`).tap();await page.locator('[data-duracion]').selectOption('60');assert.equal(await page.locator(`[data-marca="${id}"]`).innerText(),`Mejor marca: ${r.mini.puntos[r.mio]} puntos`);
  await page.locator('[data-duracion]').selectOption('120');assert.equal(await page.locator(`[data-marca="${id}"]`).innerText(),'Sin marca en esta duración');
  await page.locator('[data-atras]').tap();await page.locator('[data-atras]').tap();console.log('OK interfaz minijuego',tipo,id);
 }
 const copas=completo?{senderos:['bosque','puerto','jardines','mercado'],horizontes:['desierto','mina','pantano','fortaleza'],firmamento:['cristal','acantilado','observatorio','estacion']}:{};
 for(const [copa,pistas] of Object.entries(copas)){
  await page.locator('[data-ir="gp"]').tap();await page.locator(`[data-copa="${copa}"]`).tap();let gana=false,ganador='';
  for(const [i,id] of pistas.entries()){
   await listo(id);await avanzar(1500);await foto(`${copa}-${id}-carrera`);await meta();
   assert.equal((await page.locator('.car-resultados li strong').allTextContents()).map(Number).reduce((a,b)=>a+b,0),(i+1)*58);
   if(i===3){gana=await page.locator('.car-resultados li').first().evaluate(el=>el.classList.contains('yo'));ganador=await page.locator('.car-resultados li b').first().innerText();}
   await page.locator('.car-fin [data-seguir]').tap();console.log('OK interfaz copa',copa,i+1,id);
  }
  await page.locator('.podio [data-seguir]').waitFor();assert.ok((await page.locator('.podio p span').first().innerText()).includes(ganador),'Podio y tabla final eligen al mismo ganador');await foto(`${copa}-podio`);await page.locator('.podio [data-seguir]').tap();await menu();
  const p=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),clave);assert.equal(p.campeonatos[`${copa}:carrera`]??0,gana?1:0);
 }
 const guardado=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),clave);await page.reload({waitUntil:'domcontentloaded'});await menu();assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),clave),guardado);
 await page.goto(new URL('carreras.html?mini=monedas&pista=arena_plaza&duracion=60&sinprecalentar',base).href,{waitUntil:'domcontentloaded'});await listo('arena_plaza');
 await page.waitForFunction(()=>window.__carreras.sim.t>1);const inicio=await page.evaluate(()=>{const h=window.__carreras,k=h.sim.karts[h.mio];return{x:k.x,z:k.z,h:k.h};});
 await page.keyboard.down('ArrowRight');await page.waitForFunction(h=>{const w=window.__carreras,k=w.sim.karts[w.mio];return Math.abs(k.h-h)>.3;},inicio.h);await page.keyboard.up('ArrowRight');
 assert.ok(await page.evaluate(p=>{const h=window.__carreras,k=h.sim.karts[h.mio];return Math.hypot(k.x-p.x,k.z-p.z)>1;},inicio),'El kart responde al movimiento normal');
 await page.mouse.move(100,300);await page.mouse.down();await page.mouse.move(50,300,{steps:5});await page.waitForFunction(()=>{const h=window.__carreras;return h.sim.karts[h.mio].entrada.giro>.8;});await page.mouse.up();
 await foto('control-manual-arena');await page.locator('.car-pausa').tap();await page.locator('[data-p="salir"]').tap();await menu();console.log('OK mando manual de teclado y joystick por puntero en arena');
 await page.locator('[data-ir="volver"]').tap();await page.waitForURL(amigo?/amigos\.html/:/index\.html/);
 assert.deepEqual(errores,[]);await writeFile(`${out}/resultado.json`,JSON.stringify({resultados,guardado,errores,limites:'Piloto normal, física y puntuación reales; dibujo desactivado entre capturas. No certifica rendimiento ni controles físicos de Android.'},null,2));console.log('OK cierre, guardado, recarga y retorno');
}catch(e){await page.screenshot({path:`${out}/fallo.png`}).catch(()=>{});throw e;}finally{await browser.close();}
