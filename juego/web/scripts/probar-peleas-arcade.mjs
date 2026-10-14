import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir,writeFile } from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:4184/',out=process.argv[3]??'test-results/peleas-arcade';
await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:844,height:390},hasTouch:true}),errores=[],partidas=[];
p.setDefaultTimeout(90000);p.on('pageerror',e=>errores.push(e.message));
await p.addInitScript(()=>{if(!localStorage.getItem('nuestro-hogar-amigo'))localStorage.setItem('nuestro-hogar-amigo',JSON.stringify({id:'prueba-torneo',nombre:'Retador',cuerpo:'el',piel:'#f6c8a4',pelo:'#c99a5b',ropa:'#3fb5a3',ropa2:'#4a4a52',zapatos:'#f4efe6',activo:true,creado:1}));});
const foto=async(n)=>{await p.evaluate(()=>window.__peleasEscena().__dibujarOriginal(0));await p.screenshot({path:`${out}/${n}.png`});};
try{
 await p.goto(new URL('peleas.html?bot1=7',base).href,{timeout:180000});
 await p.waitForFunction(()=>window.__peleasEscena&&window.__peleasEscena());
 await p.evaluate(()=>{const e=window.__peleasEscena();e.__dibujarOriginal=e.dibujar.bind(e);e.dibujar=()=>{};});
 await p.locator('[data-m="arcade"]').click();await p.locator('[data-id="tarek"]').click();await p.locator('[data-listo]').click();
 const intentos=new Map();
 for(let k=0;k<6;k++){
  await p.locator('.pantalla-escalera').waitFor({state:'visible'});
  assert.ok((await p.locator('.escalera h2').innerText()).includes(k===5?'final':String(k+1)));
  await p.locator('.pantalla-escalera [data-r="1"]').click();
  await p.waitForFunction(()=>window.__peleas()?.L[0].def.id==='tarek'&&document.querySelector('.hud-pausa'));
  if(k===0&&!intentos.size){
   await p.locator('.hud-pausa').click();const n=await p.evaluate(()=>window.__peleas().pasos);await p.waitForTimeout(1000);
   assert.equal(await p.evaluate(()=>window.__peleas().pasos),n);await p.locator('[data-p="seguir"]').click();
  }
  const fin=await p.evaluate(()=>{
   const s=window.__peleas();for(let n=0;n<40&&window.__peleas()===s;n++)window.__peleasAvanzar(6000);
   return {yo:s.L[0].def.id,rival:s.L[1].def.id,fase:s.fase,ganador:s.ganador,rondas:s.L.map(l=>l.rondas),pasos:s.pasos};
  });
  assert.equal(fin.fase,'fin');assert.ok([-1,0,1].includes(fin.ganador));partidas.push(fin);
  if(fin.ganador!==0){
   const n=(intentos.get(fin.rival)??0)+1;intentos.set(fin.rival,n);assert.ok(n<=5,'Superar al rival con reintentos normales');
   await p.locator('.pantalla-resultado [data-r="otra"]').click();k--;console.log(`✓ Derrota contra ${fin.rival}, revancha normal`);continue;
  }
  console.log(`✓ Arcade ${k+1}/6: ${fin.rival}, rondas ${fin.rondas.join('–')}`);
 }
 await p.locator('.pantalla-campeon').waitFor({state:'visible'});assert.ok((await p.locator('.campeon h2').innerText()).includes('Tarek'));
 await foto('campeon');await p.locator('.pantalla-campeon [data-r]').click();await p.locator('[data-m="arcade"]').waitFor({state:'visible'});
 await foto('menu');assert.deepEqual(errores,[]);
 await writeFile(`${out}/resultado.json`,JSON.stringify({partidas,campeon:true,pausa:true,retornoMenu:true,errores,limites:'Piloto de entradas legales, dibujo por captura; no cambia vida, daño ni niveles de los rivales. Controles físicos y red pendientes.'},null,2));
}catch(e){await p.screenshot({path:`${out}/fallo.png`}).catch(()=>{});throw e;}finally{await b.close();}
