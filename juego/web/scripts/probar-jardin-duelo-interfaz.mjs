// Dos bandos con toques reales; salas en contextos aislados con pérdida, demora y corte controlados.
// REAL=1 usa Supabase Realtime real (solo una sala efímera); sin ese indicador no toca el servicio real.
// CHROME_PATH=/usr/bin/chromium node scripts/probar-jardin-duelo-interfaz.mjs URL SALIDA
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {SupabaseFalso} from './supabase-falso.mjs';
const base=process.argv[2]??'http://127.0.0.1:5177/',out=process.argv[3]??'test-results/jardin-duelo',real=process.env.REAL==='1';await mkdir(out,{recursive:true});
const transporte=new SupabaseFalso({perder:.08,demora:160});
const proxy=real&&process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY,bypass:'127.0.0.1,localhost'}:undefined;
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/chromium',...(proxy?{proxy}:{}),args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const contextos=[],paginas=[],errores=[],bad=[],checks=[];
async function pagina(n){
 const c=await browser.newContext({viewport:{width:844,height:390},hasTouch:true});contextos.push(c);const p=await c.newPage();paginas.push(p);p.setDefaultTimeout(45000);
 p.on('pageerror',e=>errores.push(e.message));p.on('response',r=>{if(r.status()>=400)bad.push(`${r.status()} ${r.url()}`);});
 if(!real)await transporte.conectar(p,n%2?'ella':'el');
 await p.addInitScript(n=>localStorage.setItem('nuestro-hogar-amigo',JSON.stringify({id:`amigo-duelo000${n}`,nombre:['Defensor','Atacante','Visita'][n]??'Prueba',cuerpo:n%2?'ella':'el',piel:'#f6c8a4',pelo:'#c99a5b',ropa:'#3fb5a3',ropa2:'#4a4a52',zapatos:'#f4efe6',activo:true,creado:1})),n);
 return p;
}
async function listo(p){await p.waitForFunction(()=>window.__duelo?.listo());await p.evaluate(()=>{const v=window.__duelo.vista();if(!v.__dibujar){v.__dibujar=v.dibujar.bind(v);v.dibujar=()=>{};}});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Interfaz horizontal sin desbordamiento');}
async function foto(p,n){await p.evaluate(()=>{const d=window.__duelo,v=d?.vista(),m=d?.estado();if(v?.__dibujar&&m)v.__dibujar({...m,nivel:d.motor()?.jardin.nivel??{id:'duelo',filas:5}});});await p.screenshot({path:`${out}/${n}.png`});}
async function sembrar(p,tipo,fila,col){await p.waitForFunction(()=>!window.__duelo.red()?.pausada&&document.getElementById('capa-jardin').childElementCount===0);await p.locator(`[data-pd="${tipo}"]`).tap();const q=await p.evaluate(({fila,col})=>window.__duelo.vista().punto(col,fila),{fila,col});const luz=await p.evaluate(q=>document.elementFromPoint(q.x,q.y)?.closest('[data-ld]')?.getAttribute('data-ld'),q);if(luz)await p.locator(`[data-ld="${luz}"]`).tap();await p.waitForFunction(q=>document.elementFromPoint(q.x,q.y)?.tagName==='CANVAS',q);await p.touchscreen.tap(q.x,q.y);}
const avanzar=(p,s)=>p.evaluate(s=>window.__duelo.avanzar(Math.ceil(s*30)),s);
const ok=t=>{checks.push(t);console.log('OK',t);};
try{
 if(!process.env.SOLO_SALA){
  const p=await pagina(2);await p.goto(new URL('jardin.html?rol=ella&local=1',base).href);await p.locator('[data-duelo]').tap();await p.waitForURL(/jardin-duelo/);assert.equal(new URL(p.url()).searchParams.get('rol'),'ella');
  await p.locator('[data-d="local"]').tap();await listo(p);await avanzar(p,21);await sembrar(p,'margarita',0,0);assert.equal(await p.evaluate(()=>window.__duelo.motor().jardin.plantas[0]?.tipo),'margarita');await p.locator('[data-ld]').first().tap();
  await p.locator('[data-zd="remiendo"]').tap();await p.locator('[data-fila="4"]').tap();assert.equal(await p.evaluate(()=>window.__duelo.motor().jardin.zombis.length),1);
  await p.locator('header [data-d="pausa"]').tap();const t=await p.evaluate(()=>window.__duelo.estado().t);await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>window.__duelo.estado().t),t);await p.locator('.resultado [data-d="pausa"]').tap();await foto(p,'dos-en-pantalla');
  await avanzar(p,180);await p.locator('.resultado h2').filter({hasText:'Ganaron las plantas'}).waitFor();assert.equal(await p.evaluate(()=>localStorage.getItem('amigo-jardin-v1')),null);await p.locator('[data-d="revancha"]').tap();assert.ok(await p.evaluate(()=>window.__duelo.estado().t<2));await p.locator('header [data-d="abandonar"]').tap();await p.locator('[data-d="volver"]').tap();await p.waitForURL(/jardin\.html/);await p.close();ok('Dos en pantalla: plantas, luz, envío por carril, pausa, final y revancha sin tocar estrellas');
 }
 const a=await pagina(0),b=await pagina(1);await a.goto(new URL('jardin-duelo.html?sala',base).href);await a.locator('.se-codigo b').first().waitFor();const codigo=(await a.locator('.se-codigo b').allTextContents()).join('');
 await b.goto(new URL(`jardin-duelo.html?unirse=${codigo}`,base).href);await a.waitForFunction(()=>document.querySelectorAll('.se-puesto:not(.vacio)').length===2);
 await a.locator('[data-x="bandos"]').tap();await a.locator('.se-puesto.yo .se-detalle').filter({hasText:'Ataca'}).waitFor();await a.locator('[data-x="bandos"]').tap();await a.locator('.se-puesto.yo .se-detalle').filter({hasText:'Defiende'}).waitFor();
 const tercero=await pagina(3);await tercero.goto(new URL(`jardin-duelo.html?unirse=${codigo}`,base).href);await tercero.locator('#error-duelo').filter({hasText:'llena'}).waitFor();await tercero.close();
 await b.locator('[data-a="principal"]').tap({force:true});await a.waitForFunction(()=>!document.querySelector('[data-a="principal"]').disabled);await a.locator('[data-a="principal"]').tap({force:true});await listo(a);await listo(b);await a.waitForFunction(()=>!window.__duelo.red().pausada);await b.waitForFunction(()=>!window.__duelo.red().pausada);
 await sembrar(a,'frijol',0,2);await a.waitForFunction(()=>window.__duelo.estado().plantas.length===1);await avanzar(a,21);await b.waitForFunction(()=>window.__duelo.estado()?.t>=20);
 await b.locator('[data-zd="remiendo"]').tap();await b.locator('[data-fila="4"]').tap();await a.waitForFunction(()=>window.__duelo.estado().zombis.length===1);await b.waitForFunction(()=>window.__duelo.estado().zombis.length===1);
 await foto(a,'sala-plantas');await foto(b,'sala-zombis');ok('Sala de dos: bandos elegibles, tercero rechazado y acciones reales de ambos sincronizadas');
 await b.locator('header [data-d="pausa"]').tap();await a.waitForFunction(()=>window.__duelo.red().pausada);const detenido=await a.evaluate(()=>window.__duelo.estado().t);await a.waitForTimeout(400);assert.equal(await a.evaluate(()=>window.__duelo.estado().t),detenido);
 await a.locator('header [data-d="pausa"]').tap();await a.waitForFunction(()=>window.__duelo.red().miPausa);await a.locator('.resultado [data-d="pausa"]').tap();await a.waitForFunction(()=>!window.__duelo.red().miPausa);assert.equal(await a.evaluate(()=>window.__duelo.red().pausada),true);await b.locator('.resultado [data-d="pausa"]').tap();await a.waitForFunction(()=>!window.__duelo.red().pausada);ok('Pausa compartida: cada persona reanuda únicamente su propia pausa');
 if(!real){transporte.cortar(b,true);await a.waitForFunction(()=>window.__duelo.red().corte);const t=await a.evaluate(()=>window.__duelo.estado().t);await a.waitForTimeout(300);assert.equal(await a.evaluate(()=>window.__duelo.estado().t),t);transporte.cortar(b,false);await a.waitForFunction(()=>!window.__duelo.red().corte);await a.waitForFunction(()=>!window.__duelo.red().pausada);ok('Corte de conexión detiene el motor y recuperar la señal permite continuar');}
 await avanzar(a,180);for(const p of [a,b])await p.locator('.resultado h2').filter({hasText:'Ganaron las plantas'}).waitFor();await foto(b,'fin-plantas-invitado');
 await a.locator('[data-d="revancha"]').tap();await a.locator('.resultado p').filter({hasText:'Esperando que'}).waitFor();await b.locator('[data-d="revancha"]').tap();await a.waitForFunction(()=>window.__duelo.red().bando==='zombis'&&!window.__duelo.red().pausada);await b.waitForFunction(()=>window.__duelo.red().bando==='plantas'&&!window.__duelo.red().pausada&&window.__duelo.estado()?.t<10);
 await sembrar(b,'margarita',0,0);await a.waitForFunction(()=>window.__duelo.estado().plantas[0]?.tipo==='margarita');await avanzar(a,21);await a.locator('[data-fila="4"]').tap();await a.waitForFunction(()=>window.__duelo.estado().zombis.length===1);await avanzar(a,65);assert.equal(await a.evaluate(()=>window.__duelo.estado().guardianes[4]),false);
 await a.locator('[data-fila="4"]').tap();await avanzar(a,65);for(const p of [a,b])await p.locator('.resultado h2').filter({hasText:'Ganaron los zombis'}).waitFor();await foto(a,'fin-zombis-anfitrion');ok('Revancha con bandos invertidos: invitado siembra y ambos reciben la victoria natural de zombis');
 for(const p of [a,b])assert.equal(await p.evaluate(()=>localStorage.getItem('amigo-jardin-v1')),null);
 await a.locator('header [data-d="abandonar"]').tap();await b.locator('.resultado h2').filter({hasText:'sala se cerró'}).waitFor();ok('Salida del anfitrión cierra la sala sin inventar una victoria');
 assert.deepEqual(errores,[]);assert.deepEqual(bad,[]);await writeFile(`${out}/resultado.json`,JSON.stringify({checks,errores,bad,real,sala:codigo,red:real?'Supabase Realtime real, dos contextos aislados':{perdida:.08,demoraMaximaMs:175,mensajes:transporte.mensajes},limites:'Toques reales y avance acelerado del mismo motor. Render por captura; no certifica teléfonos físicos ni ajuste competitivo entre humanos.'},null,2));
}catch(e){for(let i=0;i<paginas.length;i++)if(!paginas[i].isClosed())await foto(paginas[i],`fallo-${i}`).catch(()=>{});throw e;}finally{await browser.close();}
