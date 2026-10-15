// Resuelve los casos mediante sus botones, teclados y patrones; los ganchos solo leen datos y progreso.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir,writeFile } from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:4184/';
const out=process.argv[3]??'test-results/celular-recorrido', fallos=process.env.FALLOS==='1';
const amigo=process.env.AMIGO!=='0',hasta=Number(process.env.HASTA??8);
assert.ok(Number.isInteger(hasta)&&hasta>=1&&hasta<=8,'HASTA debe ser un entero de 1 a 8');
await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:process.env.CHROME_PATH});
const p=await b.newPage({viewport:{width:844,height:390},hasTouch:true}),errores=[],bad=[],resultados=[];
p.setDefaultTimeout(30000);p.on('pageerror',e=>errores.push(e.message));p.on('response',r=>{if(r.status()>=400)bad.push(`${r.status()} ${r.url()}`);});
if(amigo)await p.addInitScript(()=>{if(!localStorage.getItem('nuestro-hogar-amigo'))localStorage.setItem('nuestro-hogar-amigo',JSON.stringify({id:'prueba-detective',nombre:'Detective',cuerpo:'el',piel:'#f6c8a4',pelo:'#c99a5b',ropa:'#3fb5a3',ropa2:'#4a4a52',zapatos:'#f4efe6',activo:true,creado:1}));});
const coach=async()=>{const x=p.locator('.cel-coach:not(.fuera) .cel-coach-x');if(await x.count())await x.click();};
const tocar=async(s)=>{const l=p.locator(s);await l.waitFor({state:'visible'});const r=await l.boundingBox();assert.ok(r);await p.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);};
const abrir=async()=>{await p.goto(new URL('celular.html',base).href);await p.waitForFunction(()=>window.__celular);};
const progreso=()=>p.evaluate(()=>structuredClone(window.__celular.progreso));
const casa=async()=>{await coach();if(!(await p.locator('.cel-apps').count()))await p.locator('.cel-cab .cel-atras').click();};
const app=async(id)=>{await casa();await p.locator(`[data-app="${id}"]`).click();await coach();};
const candado=async(c)=>{
  await coach();const caja=p.locator(`.cel-candado[data-candado="${c.id}"]`);await caja.waitFor({state:'visible'});
  if(c.tipo==='patron'){
    const puntos=[];for(const n of c.clave){const r=await caja.locator(`[data-punto="${n}"]`).boundingBox();assert.ok(r);puntos.push([r.x+r.width/2,r.y+r.height/2]);}
    await p.mouse.move(...puntos[0]);await p.mouse.down();for(const q of puntos.slice(1))await p.mouse.move(...q,{steps:3});await p.mouse.up();
  }else{for(const ch of c.clave)await caja.locator(`[data-tecla="${ch}"]`).click();if(c.tipo==='palabra')await caja.locator('[data-tecla="ok"]').click();}
  await p.waitForFunction(id=>Object.values(window.__celular.progreso.casos).some(x=>x.abiertos.includes(id)),c.id);
  await caja.waitFor({state:'detached'});await coach();
};
const voces=async()=>{const n=await p.locator('.cel-voz-ver').count();for(let i=0;i<n;i++){await coach();await p.locator('.cel-voz-ver').nth(i).click();}};
try{
  await abrir();const casos=(await p.evaluate(()=>window.__celular.casos)).slice(0,hasta);
  assert.equal(await p.evaluate(()=>localStorage.getItem('celular-astra-v1')),null);
  assert.equal(await p.locator('.cel-carpeta:not(.bloqueada)').count(),1);
  for(let i=0;i<casos.length;i++){
    const c=casos[i];await p.locator(`[data-caso="${c.id}"]`).click();await p.locator('[data-accion="recibir"]').click();await coach();
    await p.locator('.cel-alternar-libreta').click();
    const apuntes=`Caso ${i+1}: mis observaciones\nComparar las fechas y comprobar los planes antiguos. <sin anotaciones automáticas>`;
    assert.equal(await p.locator('.cel-apuntes').inputValue(),'');
    await p.locator('.cel-apuntes').fill(apuntes);
    await p.locator('.cel-alternar-libreta').click();
    await p.locator('.cel-bloqueo-abrir').click();
    assert.equal(await p.locator('.cel-candado-rec').count(),0);
    if(c.bloqueo.tipo==='palabra') {
      await p.locator('.cel-alternar-libreta').click();
      await p.locator('.cel-apuntes').pressSequentially(' otra nota');
      assert.equal(await p.locator('.cel-palabra').innerText(),'');
      await p.locator('.cel-apuntes').fill(apuntes);
      await p.locator('.cel-alternar-libreta').click();
    }
    await candado(c.bloqueo);
    if(c.apps.includes('linterna')){await app('linterna');await p.locator('.cel-linterna').click();}
    if(c.apps.includes('mensajes')){await app('mensajes');for(const ch of c.chats){
      await p.locator('.cel-chat-buscar').fill(ch.grupo??c.contactos.find(x=>x.id===ch.con).nombre);
      await p.locator(`[data-chat="${ch.con}"]`).click();await coach();await voces();
    }}
    if(c.apps.includes('fotos')){
      await app('fotos');
      for(const id of [...new Set(c.fotos.map(f=>f.candado).filter(Boolean))]){await p.locator(`button[data-candado="${id}"]`).click();await candado(c.candados.find(x=>x.id===id));}
      for(const f of c.fotos){await coach();await p.locator(`button[data-foto="${f.id}"]`).click();await coach();await p.locator('.cel-visor-cerrar').click();}
    }
    if(c.apps.includes('notas')){await app('notas');for(const n of c.notas){await p.locator(`[data-nota="${n.id}"]`).click();if(n.candado&&!(await progreso()).casos[c.id].abiertos.includes(n.candado))await candado(c.candados.find(x=>x.id===n.candado));await coach();}}
    for(const id of ['grabadora','llamadas'])if(c.apps.includes(id)){await app(id);await voces();}
    if(c.apps.includes('mapa')){await app('mapa');for(const l of c.mapa.lugares)await p.locator(`button[data-lugar="${l.id}"]`).click();}
    if(c.apps.includes('correo')){await app('correo');for(const n of c.correo){await p.locator(`[data-correo="${n.id}"]`).click();if(n.candado&&!(await progreso()).casos[c.id].abiertos.includes(n.candado)){await candado(c.candados.find(x=>x.id===n.candado));await p.locator(`[data-correo="${n.id}"]`).click();}}}
    if(c.apps.includes('calendario'))await app('calendario');
    if(c.apps.includes('senas')){await app('senas');await p.locator('button[data-candado="senas"]').click();await candado(c.candados.find(x=>x.id==='senas'));}
    await coach();const antes=(await progreso()).casos[c.id];
    assert.deepEqual(antes.pistas,[],'Revisar el teléfono no debe seleccionar pistas automáticamente');
    assert.equal(antes.apuntes,apuntes);
    assert.equal(await p.locator('.cel-coach,.cel-papelito,[data-accion="ayuda"],.cel-libreta-cuenta').count(),0);
    await p.locator('.cel-alternar-libreta').click();
    await tocar('[data-accion="resolver"]');
    for(let q=0;q<c.preguntas.length;q++){
      await p.locator(`[data-opcion="${c.preguntas[q].correcta}"]`).click();
      if(i===0&&q===c.preguntas.length-1&&fallos)await p.evaluate(()=>{const original=Storage.prototype.setItem;window.__cortarCelular=true;Storage.prototype.setItem=function(k,v){if(k==='celular-astra-v1'&&window.__cortarCelular)throw new DOMException('Prueba de almacenamiento lleno','QuotaExceededError');return original.call(this,k,v);};});
      await p.locator('.cel-resolver [data-accion="siguiente"]').click();
    }
    for(let n=0;n<80&&!(await p.locator('.cel-final-cierre').count());n++){await p.locator('.cel-final-saltar').click();await p.waitForTimeout(250);}
    await p.locator('.cel-final-cierre').waitFor({state:'visible'});
    const avance=await progreso();assert.equal(avance.casos[c.id].resuelto,true);assert.equal(avance.casos[c.id].estrellas,3);
    await p.screenshot({path:`${out}/caso-${i+1}-final.png`});
    if(i===0&&fallos){
      assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('celular-astra-v1')).casos.pacto.resuelto),false);
      await p.locator('[data-accion="volver-mesa"]').click();
      assert.equal(await p.locator('.cel-final-cierre').count(),1,'Conservar el final mientras falla el guardado');
      for(let atras=0;atras<3;atras++)await p.keyboard.press('Escape');
      assert.equal(await p.locator('.cel-final-cierre').count(),1,'Atrás no debe abandonar el caso pendiente');
      await p.evaluate(()=>{window.__cortarCelular=false;});
      await p.locator('[data-reintentar-guardado]').click();
      assert.deepEqual(await progreso(),avance,'Reintentar no cambia pistas ni estrellas');
    }
    assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('celular-astra-v1'))),avance,'El caso cerrado debe quedar guardado antes de pasar al siguiente');
    await p.locator('[data-accion="volver-mesa"]').click();
    assert.equal(await p.locator('.cel-carpeta.resuelta').count(),i+1);
    await abrir();assert.deepEqual(await progreso(),avance);
    resultados.push({id:c.id,estrellas:3,pistasAutomaticas:avance.casos[c.id].pistas.length,apuntesManuales:true,candados:avance.casos[c.id].abiertos});console.log(`✓ Caso ${i+1}/${casos.length}: ${c.titulo}, 3 estrellas, cero pistas automáticas, apuntes y candados conservados tras recarga`);
  }
  assert.deepEqual(errores,[]);assert.deepEqual(bad,[]);
  await p.screenshot({path:`${out}/mesa-final.png`});
  await p.locator('.cel-mesa-cab button[title="Volver"]').click();
  await p.waitForURL(amigo?/amigos\.html/:/index\.html/);
  assert.deepEqual(errores,[]);assert.deepEqual(bad,[]);
  await writeFile(`${out}/resultado.json`,JSON.stringify({amigo,resultados,retorno:true,errores,bad,limites:'Claves y conclusiones leídas de los datos; controles normales, apuntes escritos y cero pistas automáticas; audios por transcripción y finales adelantados con su botón. No demuestra deducción de una persona.'},null,2));
}catch(e){await p.screenshot({path:`${out}/fallo.png`}).catch(()=>{});throw e;}finally{await b.close();}
