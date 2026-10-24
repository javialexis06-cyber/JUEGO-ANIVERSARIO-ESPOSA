/** Coordinador real con transporte preparado que retiene un inicio. No simula una victoria nativa. */
import{chromium}from'@playwright/test';import assert from'node:assert/strict';import fs from'node:fs/promises';
const base=process.argv[3]??'http://127.0.0.1:4196/',archivo=process.argv[2]??'test-results/historia-nativa/resultado.json',punto=JSON.parse(await fs.readFile(archivo,'utf8')).casa;assert.ok(punto?.zonas[0].punto&&!punto.inicioCasa);
const b=await chromium.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/chromium'}),p=await b.newPage({viewport:{width:844,height:390}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
const motor=`window.__camposPreparados=new Map();export class FrenteGardendless{
 constructor(el,zona){this.zona=zona;this.sesion=crypto.randomUUID();this.frame=document.createElement('iframe');el.append(this.frame);this.t=0;this.activa=false;this.parada=true;__camposPreparados.set(zona,this);}
 estado(){return {version:1,zona:this.zona,nivel:'historia',fase:this.activa?'combatiendo':'preparando',segundos:this.t,oleada:0,soles:150,plantas:0,zombis:0,pausada:this.parada};}
 async prepararHistoria(){this.activa=false;return this.estado();}
 async iniciarHistoria(){if(this.zona==='8'&&window.__retenerInicio)await new Promise(r=>window.__liberarInicio=r);this.activa=true;this.parada=false;return this.estado();}
 async pasoHistoria(n){if(!this.parada)this.t+=n/60;return this.estado();}
 async pausa(){this.parada=true;return this.estado();}async reanudar(){this.parada=false;return this.estado();}
 destruir(){this.frame.remove();}async cerrar(){this.destruir();}
}export{FrenteGardendless as F};`;
await p.route('**/src/jardin/motores/frente-gardendless.ts*',r=>r.fulfill({contentType:'application/javascript',body:motor}));
await p.route('**/assets/frente-gardendless-*.js',r=>r.fulfill({contentType:'application/javascript',body:motor}));
await p.addInitScript(d=>{if(window===window.top&&!localStorage.getItem('conquista-historia-nativa-v3'))localStorage.setItem('conquista-historia-nativa-v3',JSON.stringify(d));},punto);
try{
 await p.goto(new URL('jardin.html?modo=historia&prueba=1',base).href);await p.waitForFunction(()=>window.__historiaNativa?.instancias().size===2&&[...__historiaNativa.instancias().values()].every(i=>i.lista));
 await p.locator('[data-hn-zona="9"]').click();await p.locator('[data-cq="equipo"]').click();await p.locator('[data-hn-semilla="repetidora"]').click();await p.locator('[data-hn-semilla="patatapum"]').click();await p.locator('[data-cq="guardar-equipo"]').click();await p.locator('[data-cq="expedicion"]').click();await p.waitForFunction(()=>__historiaNativa.instancias().get(9)?.ataque!==null);
 await p.evaluate(()=>{window.__retenerInicio=true;__historiaNativa.mundo().estado.proximoAtaque=__historiaNativa.mundo().t+.1;});await p.waitForFunction(()=>window.__liberarInicio);
 const antes=await p.evaluate(()=>__camposPreparados.get('9').t);await p.waitForFunction(t=>__camposPreparados.get('9').t>t+.15,antes,{timeout:3000});assert.equal(await p.evaluate(()=>__historiaNativa.control().cargando),1);console.log('OK La expedición sigue avanzando mientras el otro campo tiene un inicio retenido');
 await p.locator('[data-cq="pausa"]').click();const detenida=await p.evaluate(()=>__camposPreparados.get('9').t);await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>__camposPreparados.get('9').t),detenida);await p.evaluate(()=>window.__liberarInicio());await p.waitForFunction(()=>__historiaNativa.control().cargando===0);assert.ok(await p.evaluate(()=>__historiaNativa.mundo().pausada));assert.equal(await p.evaluate(()=>__camposPreparados.get('8').parada),true);console.log('OK La pausa global sigue deteniendo los campos y también se aplica al inicio que termina después');assert.deepEqual(errors,[]);
}finally{await b.close();}
