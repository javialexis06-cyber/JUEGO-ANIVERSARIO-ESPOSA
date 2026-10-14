// Entrada normal de P23: usa exclusivamente la luz y las torres propias de ese modo.
// Comprueba el recibo y la ruta de retorno; no habilita ni certifica la campaña previa de la granja.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:4182/';
const out=process.argv[3]??'test-results/escudo-mision';
await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:844,height:390},hasTouch:true}),errores=[];
p.on('pageerror',e=>errores.push(e.message));p.setDefaultTimeout(90000);
try{
  await p.goto(new URL('escudo.html?mision=P23&bot=1',base).href,{timeout:180000});
  await p.waitForFunction(()=>window.__escudo,null,{timeout:180000});
  await p.evaluate(()=>{const s=window.__escudo.escena();s.__renderOriginal=s.render.bind(s);s.render=()=>{};});
  await p.locator('.escudo-cine').waitFor({state:'visible'});
  await p.locator('.ec-saltar').click();
  await p.waitForFunction(()=>window.__escudo.motor()?.nivel.id==='grieta'&&document.querySelector('.escudo-hud'));
  assert.equal(await p.evaluate(()=>localStorage.getItem('escudo-mision-P23')),null);
  await p.evaluate(()=>{
    const original=Storage.prototype.setItem;
    window.__cortarRecibo=true;window.__intentosRecibo=0;
    Storage.prototype.setItem=function(k,v){if(k==='escudo-mision-P23'){window.__intentosRecibo++;if(window.__cortarRecibo)throw new DOMException('Prueba de almacenamiento lleno','QuotaExceededError');}return original.call(this,k,v);};
  });
  const fin=await p.evaluate(()=>{
    const h=window.__escudo,m=h.motor();
    for(let n=0;n<50&&!m.terminado;n++)h.avanzar(900);
    return {resultado:m.terminado,estrellas:m.estrellas(),vidas:m.vidas,oleada:m.oleada};
  });
  assert.equal(fin.resultado,'gano');
  await p.locator('.ec-saltar').click();
  await p.locator('.resultado.gano').waitFor({state:'visible'});
  assert.ok(await p.evaluate(()=>window.__intentosRecibo)>0);
  assert.equal(await p.evaluate(()=>localStorage.getItem('escudo-mision-P23')),null);
  const guardado=await p.evaluate(()=>JSON.parse(localStorage.getItem('escudo-progreso')));
  assert.equal(guardado.estrellas.grieta,fin.estrellas);assert.equal(guardado.finalVisto,true);
  await p.evaluate(()=>window.__escudo.escena().__renderOriginal());
  await p.screenshot({path:`${out}/recibo-pendiente.png`});
  await p.locator('[data-granja]').click();
  assert.ok(new URL(p.url()).pathname.endsWith('escudo.html'),'No debe salir antes de guardar el recibo');
  await p.keyboard.press('Escape');
  assert.equal(await p.locator('.resultado.gano').count(),1);
  await p.evaluate(()=>{window.__cortarRecibo=false;});
  await p.locator('[data-reintentar-guardado]').click();
  const recibo=await p.evaluate(()=>JSON.parse(localStorage.getItem('escudo-mision-P23')));
  assert.equal(recibo.v,1);assert.equal(recibo.mision,'P23');assert.equal(recibo.ganada,true);assert.equal(recibo.estrellas,fin.estrellas);
  const intentos=await p.evaluate(()=>window.__intentosRecibo);
  await p.locator('[data-granja]').click();
  await p.waitForURL(/granja-v3\.html\?escudo=P23/,{waitUntil:'domcontentloaded'});
  assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('escudo-mision-P23'))),recibo);
  assert.deepEqual(errores,[]);
  await writeFile(`${out}/resultado.json`,JSON.stringify({fin,recibo,intentos,retorno:p.url(),errores,limites:'Entrada directa al modo P23, escenas saltadas; no es la campaña completa de la granja.'},null,2));
  console.log('✓ P23: batalla ganada, recibo fallido recuperado y retorno a la granja después de confirmar');
}catch(e){await p.screenshot({path:`${out}/fallo.png`}).catch(()=>{});throw e;}finally{await b.close();}
