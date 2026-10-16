// Revisión visual de la biblioteca de Blender en ambos cuerpos y sentidos; nunca altera el motor.
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:4182/',out=process.argv[3]??'test-results/peleas-poses';await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}),errores=[],capturas=[];
try{
 const ctx=await b.newContext({viewport:{width:844,height:390}}),p=await ctx.newPage();p.setDefaultTimeout(120000);p.on('pageerror',e=>errores.push(e.message));
 for(const cuerpo of ['el','ella']){
  await p.goto(new URL(`peleas.html?prueba=poses&p1=${cuerpo}`,base).href,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.__listo&&window.__pose);
  for(const pose of ['guardia','jab_bajo','fuerte','patada'])for(const lado of [1,-1]){
   await p.evaluate(({pose,lado})=>window.__pose(pose,lado),{pose,lado});await p.waitForTimeout(600);
   const nombre=`${cuerpo}-${pose}-${lado}.png`;await p.screenshot({path:`${out}/${nombre}`});capturas.push(nombre);
  }
  console.log('OK poses de Blender dibujadas en ambos sentidos',cuerpo);
 }
 await p.setViewportSize({width:320,height:320});await p.goto(new URL('carreras/emblema.svg',base).href);await p.screenshot({path:`${out}/emblema-carreras.png`});
 assert.deepEqual(errores,[]);await writeFile(`${out}/resultado.json`,JSON.stringify({capturas,errores,limites:'Capturas de Chromium con render por software; inspección visual, sin certificar dispositivos físicos.'},null,2));
}finally{await b.close();}
