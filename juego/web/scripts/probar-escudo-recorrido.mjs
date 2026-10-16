// Campaña nueva, desbloqueos normales y piloto que solo usa acciones legales; no concede luz ni torres.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:4182/';
const out=process.argv[3]??'test-results/escudo-recorrido';
const amigo=process.env.AMIGO!=='0', fallos=process.env.FALLOS==='1';
await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const c=await b.newContext({viewport:{width:844,height:390},hasTouch:true});
const p=await c.newPage(), errores=[], resultados=[], derrotasCampana=[], intentos=new Map();
p.on('pageerror',e=>errores.push(e.message)); p.setDefaultTimeout(90000);
await p.addInitScript(({amigo})=>{
  if(amigo&&!localStorage.getItem('nuestro-hogar-amigo'))localStorage.setItem('nuestro-hogar-amigo',JSON.stringify({id:'prueba-escudo',nombre:'Defensor',cuerpo:'el',piel:'#f6c8a4',pelo:'#c99a5b',ropa:'#3fb5a3',ropa2:'#4a4a52',zapatos:'#f4efe6',activo:true,creado:1}));
},{amigo});
const clave=amigo?'amigo-escudo-progreso':'escudo-progreso';
const abrir=async()=>{
  await p.goto(new URL('escudo.html?bot=1',base).href,{timeout:180000});
  await p.waitForFunction(()=>window.__escudo,null,{timeout:180000});
  await p.evaluate(()=>{const s=window.__escudo.escena();s.__renderOriginal=s.render.bind(s);s.render=()=>{};});
  await p.locator('.escudo-menu').waitFor({state:'visible',timeout:180000});
};
const foto=async(nombre)=>{
  await p.evaluate(()=>window.__escudo.escena().__renderOriginal());
  await p.screenshot({path:`${out}/${nombre}.png`});
};
try{
  await abrir();
  assert.equal(await p.evaluate(k=>localStorage.getItem(k),clave),null);
  assert.equal(await p.locator('[data-nivel]:not([disabled])').count(),1);
  const ids=await p.locator('[data-nivel]:not([data-nivel="infinito"])').evaluateAll(bs=>bs.map(b=>b.dataset.nivel));
  await p.locator('[data-nivel="mirador"]').click();
  await p.locator('.ec-saltar').click();
  for(let i=0;i<ids.length;i++){
    intentos.set(ids[i],(intentos.get(ids[i])??0)+1);
    assert.ok(intentos.get(ids[i])<=5,`No se pudo superar ${ids[i]} en cinco intentos normales`);
    await p.waitForFunction(id=>window.__escudo.motor()?.nivel.id===id&&document.querySelector('.escudo-hud'),ids[i]);
    if(i===0){
      await p.locator('[data-pausa]').click();
      const antes=await p.evaluate(()=>window.__escudo.motor().t);
      await p.waitForTimeout(1100);
      assert.equal(await p.evaluate(()=>window.__escudo.motor().t),antes);
      await p.locator('[data-seguir]').click();
      if(fallos)await p.evaluate(k=>{
        if(window.__falloEscudoInstalado){window.__cortarEscudo=true;return;}
        window.__falloEscudoInstalado=true;
        const original=Storage.prototype.setItem;
        window.__cortarEscudo=true;
        Storage.prototype.setItem=function(clave,valor){if(clave===k&&window.__cortarEscudo)throw new DOMException('Prueba de almacenamiento lleno','QuotaExceededError');return original.call(this,clave,valor);};
      },clave);
    }
    if(i>=6)await foto(`nivel-${i+1}-mapa`);
    const fin=await p.evaluate(()=>{
      const h=window.__escudo,m=h.motor();
      for(let n=0;n<50&&!m.terminado;n++)h.avanzar(900);
      return {id:m.nivel.id,resultado:m.terminado,vidas:m.vidas,estrellas:m.estrellas(),oleada:m.oleada,segundos:Math.round(m.t),luz:m.luz,torres:m.torres.length,luzInicial:m.nivel.luz};
    });
    if(fin.resultado==='perdio'){
      await p.locator('.resultado.perdio').waitFor({state:'visible'});
      await p.evaluate(()=>{window.__cortarEscudo=false;});
      if(await p.locator('[data-reintentar-guardado]').count())await p.locator('[data-reintentar-guardado]').click();
      assert.equal(await p.evaluate(id=>window.__escudo.progreso().estrellas[id]??0,ids[i]),0);
      await foto(`nivel-${i+1}-derrota-${intentos.get(ids[i])}`);
      derrotasCampana.push(fin);console.log(`✓ ${ids[i]}: derrota normal, sin desbloqueo; reintentar con el mismo presupuesto`);
      await p.locator('[data-otra]').click();i--;continue;
    }
    assert.equal(fin.resultado,'gano',`El nivel ${ids[i]} debe llegar a un resultado`);
    if(i===5){await p.locator('.ec-saltar').click();}
    await p.locator('.resultado.gano').waitFor({state:'visible'});
    if(i===0&&fallos){
      assert.equal(await p.evaluate(k=>JSON.parse(localStorage.getItem(k)).estrellas.mirador??0,clave),0);
      await p.locator('[data-siguiente]').click();
      assert.equal(await p.evaluate(()=>window.__escudo.motor().nivel.id),'mirador','No debe abandonar un resultado que no pudo guardar');
      await p.keyboard.press('Escape');
      assert.equal(await p.locator('.resultado.gano').count(),1,'Atrás conserva el resultado pendiente');
      await p.evaluate(()=>{window.__cortarEscudo=false;});
      await p.locator('[data-reintentar-guardado]').click();
    }
    const avance=await p.evaluate(()=>structuredClone(window.__escudo.progreso()));
    assert.equal(avance.estrellas[ids[i]],fin.estrellas);
    assert.equal(Object.values(avance.estrellas).filter(x=>x>0).length,i+1);
    assert.deepEqual(await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),clave),avance);
    await foto(`nivel-${i+1}-resultado`); resultados.push(fin);console.log(`✓ ${ids[i]}: ${fin.estrellas} estrellas, ${fin.vidas} vidas, guardado confirmado`);
    await abrir();
    assert.deepEqual(await p.evaluate(()=>window.__escudo.progreso()),avance);
    assert.equal(await p.locator('[data-nivel="infinito"]').isEnabled(),i>=2);
    if(i<ids.length-1){await p.locator(`[data-nivel="${ids[i+1]}"]`).click();}
  }
  await foto('campana-completa');
  await p.locator('[data-nivel="infinito"]').click();
  await p.waitForFunction(()=>window.__escudo.motor()?.infinito&&document.querySelector('.escudo-hud'));
  const infinito=await p.evaluate(()=>{
    const h=window.__escudo,m=h.motor();
    for(let n=0;n<400&&!m.terminado;n++)h.avanzar(900);
    return {resultado:m.terminado,oleada:m.oleada,vidas:m.vidas,segundos:Math.round(m.t)};
  });
  assert.equal(infinito.resultado,'perdio');assert.ok(infinito.oleada>1);
  await p.locator('.resultado.perdio').waitFor({state:'visible'});
  assert.equal(await p.evaluate(()=>window.__escudo.progreso().infinito),infinito.oleada-1);
  await foto('infinito-resultado');
  const completo=await p.evaluate(()=>structuredClone(window.__escudo.progreso()));
  await abrir();assert.deepEqual(await p.evaluate(()=>window.__escudo.progreso()),completo);
  console.log(`✓ Infinito: derrota natural, ${infinito.oleada-1} oleadas conservadas tras recarga`);
  await p.goto(new URL('escudo.html?nivel=mirador',base).href,{timeout:180000});
  await p.waitForFunction(()=>window.__escudo,null,{timeout:180000});
  await p.evaluate(()=>{const s=window.__escudo.escena();s.__renderOriginal=s.render.bind(s);s.render=()=>{};});
  await p.waitForFunction(()=>window.__escudo.motor()?.nivel.id==='mirador'&&document.querySelector('.escudo-hud'));
  if(await p.locator('.escudo-consejo button').count())await p.locator('.escudo-consejo button').click();
  const antesDerrota=await p.evaluate(()=>structuredClone(window.__escudo.progreso()));
  const llamar=await p.locator('[data-llamar]').boundingBox();
  assert.ok(llamar);
  // El botón tiene una animación continua; el toque real no espera que su caja deje de moverse.
  await p.touchscreen.tap(llamar.x+llamar.width/2,llamar.y+llamar.height/2);
  const derrota=await p.evaluate(()=>{
    const h=window.__escudo,m=h.motor();
    for(let n=0;n<40&&!m.terminado;n++)h.avanzar(900);
    return {resultado:m.terminado,estrellas:m.estrellas(),vidas:m.vidas};
  });
  assert.equal(derrota.resultado,'perdio');assert.equal(derrota.estrellas,0);
  // Atrás durante la celebración no debe desmontar la partida antes de mostrar su resultado.
  await p.keyboard.press('Escape');
  await p.locator('.resultado.perdio').waitFor({state:'visible'});
  assert.deepEqual(await p.evaluate(()=>window.__escudo.progreso()),antesDerrota);
  assert.deepEqual(await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),clave),antesDerrota);
  await foto('derrota-sin-construir');
  await p.locator('[data-otra]').click();
  await p.waitForFunction(()=>window.__escudo.motor()?.terminado===null&&document.querySelector('.escudo-hud'));
  assert.equal(await p.evaluate(()=>window.__escudo.motor().luz),260);
  await p.locator('[data-pausa]').click();await p.locator('[data-niveles]').click();
  await p.locator('.escudo-menu').waitFor({state:'visible'});
  await p.locator('[data-salir]').click();
  await p.waitForURL(amigo?/amigos\.html/:/index\.html/);
  console.log('✓ Derrota, reintento, cancelación y salida conservan las mejores estrellas');
  assert.deepEqual(errores,[]);
  await writeFile(`${out}/resultado.json`,JSON.stringify({amigo,fallos,resultados,derrotasCampana,infinito,derrota,pausa:true,recargas:7,retorno:true,errores,limites:'Piloto normal y paso fijo; escenas saltadas; controles y sensores físicos pendientes.'},null,2));
}catch(e){await p.screenshot({path:`${out}/fallo.png`}).catch(()=>{});throw e;}finally{await b.close();}
