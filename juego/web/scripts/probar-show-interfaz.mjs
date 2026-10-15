// Escenarios preparados de la interfaz real, con toques y pausas; no sustituyen un episodio completo.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const base = process.argv[2] ?? 'http://127.0.0.1:5176';
const out = process.argv[3] ?? 'test-results/show-interfaz';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium' });
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
await ctx.routeWebSocket(u => u.host === new URL(base).host && u.searchParams.has('token'), s => s.send(JSON.stringify({ type: 'connected' })));
const p = await ctx.newPage(), errores = [];
p.setDefaultTimeout(15000);
p.on('console', m => { if (m.type()==='error') console.log('Navegador:',m.text()); });
p.on('pageerror', e => errores.push(e.message));
await p.route('https://fonts.googleapis.com/**', r => r.abort());
await p.route('**/prueba-show.html', r => r.fulfill({ contentType: 'text/html', body: `<html><head><style>[hidden]{display:none!important}</style></head><body><script type="module">
import { UI } from '/src/mesa/show/ui.ts';
window.nueva = () => { window.ui?.destruir(); window.pausa = false; window.res = null; window.ui = new UI('el','local',1,{salir(){},pausa(){window.pausa=!window.pausa}}); window.ui.listo(); };
window.panel = (tipo, abierta=false, seg=20) => { nueva(); const q = {tipo,cat:'cotidiano',t:'Pregunta de prueba',o:['Uno','Dos'],bajo:'Poco',alto:'Mucho',ok:0}; if(abierta)delete q.o;
ui.panel({p:q,item:{id:'prueba',s:'el'},quien:'el',tarea:{a:true,g:tipo==='prefiere'},seg,texto:()=>q.t,pausado:()=>pausa,cancelado:()=>false}).then(r=>window.res=r); };
window.lista=true;
</script></body></html>` }));
try {
 console.log('Abriendo arnés de interfaz');
 await p.goto(base + '/prueba-show.html', { waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => window.lista);
 console.log('OK Interfaz real cargada');
 await p.evaluate(() => panel('prefiere'));
 await p.locator('.show-op').first().tap();
 await p.evaluate(() => document.querySelectorAll('.show-op')[1].click());
 await p.waitForFunction(() => document.querySelector('.show-panel-instruccion')?.textContent.includes('2.'));
 await p.locator('.show-op').nth(1).tap(); await p.waitForFunction(() => window.res);
 assert.deepEqual(await p.evaluate(() => res), { a: '0', g: '1' });
 console.log('OK Doble toque no cambia la respuesta; segunda fase conserva su propia elección');
 await p.evaluate(() => { panel('conoce',true); pausa=true; });
 await p.locator('.show-abierta input').fill('Mi respuesta');
 await p.locator('.show-abierta button').tap();
 assert.equal(await p.evaluate(() => res), null);
 await p.evaluate(() => { pausa=false; }); await p.locator('.show-abierta button').tap();
 await p.waitForFunction(() => window.res); assert.equal(await p.evaluate(() => res.a),'Mi respuesta');
 console.log('OK Respuesta escrita durante pausa espera hasta reanudar');
 for (const tipo of ['quien','historia','termo']) {
  await p.evaluate(tipo => panel(tipo,false,2), tipo);
  await p.evaluate(() => { pausa=true; }); await p.waitForTimeout(2300);
  assert.equal(await p.evaluate(() => res), null);
  await p.evaluate(() => { pausa=false; }); await p.waitForFunction(() => window.res);
  assert.equal(await p.evaluate(() => res.a), '-');
 }
 console.log('OK Relojes de opciones, historia y termómetro se detienen durante pausa');
 await p.evaluate(() => { nueva(); pausa=true; ui.calificar('el',true,()=>pausa).then(r=>res=r); });
 await p.locator('.show-op').first().tap(); assert.equal(await p.evaluate(() => res), null);
 await p.evaluate(() => { pausa=false; }); await p.locator('.show-op').first().tap();
 await p.waitForFunction(() => res!==null); assert.equal(await p.evaluate(() => res),'2');
 await p.evaluate(() => { nueva(); ui.pasarCelular('ella','primero').then(()=>res='cancelado'); ui.destruir(); });
 await p.waitForFunction(() => res==='cancelado');
 console.log('OK Calificación se puede reanudar y cerrar no deja pendiente el traspaso de celular');
 await p.evaluate(async () => { nueva(); window.intentos=0; window.salidas=0; await ui.final({puntos:{el:100,ella:100},ganador:null,con:80,nivel:{nombre:'Conectados'},monedas:4,modo:'local',pendientes:0,
 guardar:async()=>++intentos>1,alSalir:()=>salidas++,alLibro:()=>salidas++,alOtro:()=>salidas++}); });
 await p.waitForFunction(() => document.querySelector('[data-reintentar]')?.hidden===false);
 assert.equal(await p.evaluate(() => salidas),0);
 await p.screenshot({path:out+'/fallo-guardado.png'});
 await p.locator('[data-reintentar]').tap();
 await p.waitForFunction(() => document.querySelector('[data-guardado]')?.textContent==='Show guardado');
 await p.evaluate(() => { document.querySelector('[data-f="otro"]').click(); document.querySelector('[data-f="otro"]').click(); });
 await p.waitForFunction(() => salidas>0); assert.equal(await p.evaluate(() => salidas),1);
 assert.equal(await p.evaluate(() => intentos),2);
 assert.ok(await p.evaluate(() => { const r=document.querySelector('.show-final-carta').getBoundingClientRect(); return r.top>=0&&r.bottom<=innerHeight; }));
 await p.screenshot({path:out+'/final-guardado.png'});
 console.log('OK Resultado permite reintentar, no duplica navegación y cabe en horizontal');
 const cobro = await p.evaluate(async () => {
   const { crearCierreShow, guardarCierreShow, casaShow } = await import('/src/mesa/show/casa_show.ts');
   localStorage.clear();
   const c=crearCierreShow({id:'premio-suelto',rol:'el',monedas:4,victorias:1,
    episodio:{id:'premio-suelto',t:1,m:'local',p:{el:100,ella:0},c:80,q:['prueba']}});
   if(!await guardarCierreShow(c))throw Error('No se guardó el libro suelto');
   localStorage.setItem('nuestro-hogar-local',JSON.stringify({casa:{monedas:40},personajes:{},recuerdos:[],eventos:[],v:0}));
   localStorage.setItem('nuestro-hogar-modo',JSON.stringify({modo:'local',rol:'el'}));
   await casaShow();
   localStorage.setItem('show-cierre-pendiente:'+c.id+':el',JSON.stringify(c));
   await casaShow();
   const d=JSON.parse(localStorage.getItem('nuestro-hogar-local'));
   return {monedas:d.casa.monedas,victorias:d.casa.show.victorias.el,episodios:d.casa.show.ep.length,
    pendientes:Object.keys(localStorage).filter(k=>k.startsWith('show-cierre-pendiente:')).length};
 });
 assert.deepEqual(cobro,{monedas:44,victorias:1,episodios:0,pendientes:0});
 console.log('OK Casa local real recupera el premio suelto una sola vez, sin trasladar el episodio');
 assert.deepEqual(errores,[]);
} finally { await browser.close(); }
