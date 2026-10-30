/** Coordinador e interfaz reales con transporte preparado. Las victorias son simuladas expresamente. */
import{chromium}from'@playwright/test';import assert from'node:assert/strict';import fs from'node:fs/promises';import path from'node:path';
const base=process.argv[2]??'http://127.0.0.1:4196/',file=process.argv[3]??'test-results/gardendless-precarga/recuperacion/resultado.json',out=path.resolve(process.argv[4]??'test-results/mapa-nativo-interfaz');await fs.mkdir(out,{recursive:true});const casa=JSON.parse(await fs.readFile(file,'utf8')).casa;assert.ok(casa?.zonas[0].punto);
const mock=`export class FrenteGardendless{
 constructor(el,zona){this.zona=zona;this.sesion=crypto.randomUUID();this.frame=document.createElement('iframe');el.append(this.frame);this.activa=false;this.parada=true;this.t=0;}
 estado(){return{version:1,zona:this.zona,nivel:'historia',fase:this.activa&&this.t>1?'victoria':this.activa?'combatiendo':'preparando',segundos:this.t,oleada:0,soles:this.c?.punto?.soles??150,plantas:0,zombis:0,pausada:this.parada};}
 async prepararHistoria(c){this.c=c;this.activa=false;this.t=0;return this.estado();}
 async iniciarHistoria(c){this.c=c;this.activa=!c.reposo;this.parada=false;this.t=0;return this.estado();}
 async pasoHistoria(n){if(!this.parada)this.t+=n/60;return this.estado();}
 async puntoHistoria(){return this.c.punto??{version:1,soles:150,plantas:this.c.semillas.length?[{tipo:this.c.semillas[0],fila:this.c.agua[0]??0,col:0,vida:13}]:[],cortacespedes:Array.from({length:Math.max(5,this.c.filas)},(_,i)=>i<this.c.filas),recargas:{}};}
 async pausa(){this.parada=true;return this.estado();}async reanudar(){this.parada=false;return this.estado();}
 destruir(){this.frame.remove();}async cerrar(){this.destruir();}
}export{FrenteGardendless as F};`;
const b=await chromium.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/chromium'}),c=await b.newContext({viewport:{width:844,height:390}}),p=await c.newPage(),checks=[],errors=[];p.on('pageerror',e=>errors.push(String(e.stack)));p.setDefaultTimeout(30000);
await p.route('**/src/jardin/motores/frente-gardendless.ts*',r=>r.fulfill({contentType:'application/javascript',body:mock}));await p.route('**/assets/frente-gardendless-*.js',r=>r.fulfill({contentType:'application/javascript',body:mock}));
await p.addInitScript(casa=>{if(window===window.top&&!localStorage.getItem('conquista-historia-nativa-v3'))localStorage.setItem('conquista-historia-nativa-v3',JSON.stringify(casa));},casa);
const ok=t=>{checks.push(t);console.log('OK '+t);};
const ir=async id=>{await p.locator('[data-cq="mapa"]').click();await p.locator('[data-cq="subir"]').click();await p.locator('[data-cq="subir"]').click();await p.locator(`[data-hn-pais="${Math.floor(id/4)}"]`).click();await p.locator(`[data-hn-ciudad="${Math.floor(id/4)*3+Math.floor((id%4)/2)}"]`).click();};
try{
 await p.goto(new URL('jardin.html?modo=historia&prueba=1',base).href);await p.waitForFunction(()=>window.__historiaNativa?.mundo()?.estado.version===4);await p.waitForFunction(()=>[...__historiaNativa.instancias().values()].every(i=>i.lista));
 assert.deepEqual(await p.evaluate(()=>__historiaNativa.observar().zonas.slice(0,2)),casa.zonas);ok('El guardado V3 abre doce zonas y conserva las dos defensas anteriores');
 await ir(3);await p.locator('[data-hn-zona="3"]').click();assert.equal(await p.locator('.hn-capa [data-cq="expedicion"]').count(),0);ok('La interfaz impide iniciar la fortaleza antes de recuperar las otras once zonas');
 for(const id of [9,4,0,1,5,6,10,11,7,2,3]){
  await ir(id);await p.locator(`[data-hn-zona="${id}"]`).click();await p.locator('.hn-capa [data-cq="equipo"]').click();
  const nuevas=await p.locator('.cq-catalogo [data-hn-semilla]:not([disabled])').evaluateAll(bs=>bs.filter(b=>b.querySelector('small').textContent==='Disponible').map(b=>b.dataset.hnSemilla));
  const semillas=id===3?['girasol']:nuevas;
  assert.ok(semillas.length&&semillas.length<=8);for(const t of semillas)await p.locator(`[data-hn-semilla="${t}"]`).click();
  await p.locator('.hn-capa [data-cq="guardar-equipo"]').click();await p.locator('.hn-capa [data-cq="expedicion"]').click();
  await p.waitForFunction(id=>__historiaNativa.observar().zonas.find(z=>z.id===id).capturada,id);
  assert.ok(await p.evaluate(()=>__historiaNativa.instancias().size<=8));ok('Formación, expedición y conservación territorial de la zona '+id+' mediante el transporte preparado');
 }
 await p.waitForFunction(()=>__historiaNativa.mundo().fin);await p.locator('.cq-cine-final canvas').waitFor();await p.screenshot({path:path.join(out,'final-preparado.png')});ok('El 100% abre la salida de la nave con el mapa purificado');
 const final=await p.evaluate(()=>__historiaNativa.observar());assert.equal(final.zonas.filter(z=>z.capturada).length,12);assert.equal(new Set(final.zonas.flatMap(z=>z.equipo)).size,final.zonas.flatMap(z=>z.equipo).length);
 await p.locator('[data-cq="cerrar-modal"]').click();await ir(6);assert.ok(await p.locator('.cq-region.plantas').count());await p.screenshot({path:path.join(out,'ciudad-purificada.png')});
 await p.reload();await p.locator('.cq-cine-final canvas').waitFor();assert.deepEqual(await p.evaluate(()=>__historiaNativa.observar()),final);ok('Recargar conserva el final, la exclusividad y las plantas de las doce zonas');
 await p.locator('[data-cq="cerrar-modal"]').click();await ir(0);
 await p.locator('[data-cq="ayuda"]').click();await p.locator('.hn-capa [data-cq="nueva"]').click();await p.locator('.hn-capa [data-cq="confirmar-nueva"]').click();
 await p.waitForFunction(()=>!__historiaNativa.observar().inicioCasa&&__historiaNativa.observar().zonas.filter(z=>z.capturada).length===1);
 await p.locator('[data-hn-zona="8"]').waitFor();assert.deepEqual(await p.evaluate(()=>__historiaNativa.observar().conocidas),[8]);ok('Una historia nueva regresa a la ciudad de la casa y conserva solo sus cuatro tipos iniciales');
 // Importar/Exportar se quitaron de la interfaz por pedido de Javier (30 de octubre): el guardado es automático.
 assert.deepEqual(errors,[]);
}catch(e){errors.push(String(e.stack));process.exitCode=1;await p.screenshot({path:path.join(out,'fallo.png')}).catch(()=>{});}finally{await fs.writeFile(path.join(out,'resultado.json'),JSON.stringify({checks,errors,alcance:'Interfaz y guardado reales con transporte preparado. Las victorias de este recorrido NO son combates nativos ganados.'},null,2));console.log(JSON.stringify({checks:checks.length,errors}));await b.close();}
