/** Integración en navegador sobre una partida de prueba aislada, sin tocar partidas del usuario. */
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const base=process.argv[2]??'http://127.0.0.1:4192/',out=resolve(process.argv[3]??'/tmp/granja-armas-navegador');await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/chromium',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:844,height:390}}),errores=[],checks=[];
page.on('pageerror',e=>errores.push(e.message));await page.addInitScript(()=>localStorage.setItem('granja-hud-calidad','ligera'));
try {
 await page.goto(new URL('granja-v3.html?local=1&rapido=4',base).href);await page.waitForFunction(()=>window.__granjaV3?.ready,null,{timeout:180000});await page.evaluate(()=>window.__granjaV3.settled());
 await page.evaluate(async()=>{
  const h=window.__granjaV3;h.motor.estado.desbloqueos.push('mina');const viaje=await h.actuar({tipo:'viajar',zona:'mina'});if(!viaje.ok)throw Error(viaje.mensaje);
  const r=await h.actuar({tipo:'entrar_aventura',destino:'mina_celia',xJugador:0,zJugador:4});if(!r.ok)throw Error(r.mensaje);
  const s=h.motor.estado,i=s.aventura.instancias[s.aventura.instanciaActual],m=i.monstruos[0];i.monstruos=[m];i.nodos=[];i.situaciones=[];
  for(let z=-4;z<=5;z++)for(let x=-4;x<=9;x++)i.suelos[`${x},${z}`]='suelo';
  Object.assign(m,{x:4.5,z:.5,hp:500,hpMax:500,invulnerable:0,fase:'reposo',tiempoFase:10,origen:{x:4.5,z:.5},objetivo:{x:4.5,z:.5},retroceso:{x:0,z:0},vivo:true});
  s.casillasInventario=Array(24).fill(null);for(const [at,articulo,cantidad] of [[0,'arco_ribera',1],[1,'flecha_ribera',10],[2,'baston_cuarzo',1],[3,'sello_aire',1]])s.casillasInventario[at]={articulo,cantidad};s.inventario={arco_ribera:1,flecha_ribera:10,baston_cuarzo:1,sello_aire:1};
  s.posicionAventura={x:.5,z:.5};h.vista.avatar.setPosition(.5,.5);h.vista.enfocarJugador();await h.actuar({tipo:'seleccionar_casilla',casilla:0});window.__objetivoArmas=m.id;
 });
 // Un clic a cuatro unidades prueba el alcance de la interfaz, además del reductor.
 const punto=await page.evaluate(()=>{const h=window.__granjaV3,p=h.vista.avatar.position.clone().set(4.5,.45,.5),r=document.getElementById('canvas').getBoundingClientRect();h.vista.camera.updateMatrixWorld(true);p.project(h.vista.camera);return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};});
 await page.mouse.click(punto.x,punto.y);await page.waitForFunction(()=>window.__granjaV3.estado().inventario.flecha_ribera===9,null,{timeout:30000});
 await page.waitForFunction(()=>window.__granjaV3.estado().aventura.dominioArmas?.arco>=1,null,{timeout:30000});checks.push('Un clic a distancia dispara arco, consume flecha y registra impacto efectivo');
 await page.evaluate(async()=>{const h=window.__granjaV3;h.panel('expediciones');});await page.locator('#panel-body').getByText('Armas de expedición',{exact:true}).waitFor();assert.match(await page.locator('#panel-body').innerText(),/1 \/ 90/);checks.push('Panel muestra familias, rangos y dominio real');await page.locator('#panel-close').click();
 await page.waitForFunction(()=>window.__granjaV3.estado().aventura.enfriamientoGolpe===0);
 await page.evaluate(async()=>{const h=window.__granjaV3,s=h.motor.estado,m=s.aventura.instancias[s.aventura.instanciaActual].monstruos[0];m.x=4.5;m.z=.5;m.retroceso={x:0,z:0};m.fase='reposo';m.tiempoFase=10;await h.actuar({tipo:'seleccionar_casilla',casilla:2});const r=await h.actuar({tipo:'accion_aventura',objetivo:'monstruo',id:m.id,xJugador:.5,zJugador:.5});if(!r.ok)throw Error(r.mensaje);});
 await page.waitForFunction(()=>window.__granjaV3.estado().aventura.dominioArmas?.baston>=1);checks.push('El bastón resuelve su trayectoria en la escena activa');
 await page.waitForFunction(()=>window.__granjaV3.estado().aventura.enfriamientoGolpe===0);
 await page.evaluate(async()=>{const h=window.__granjaV3,s=h.motor.estado,m=s.aventura.instancias[s.aventura.instanciaActual].monstruos[0];await h.actuar({tipo:'seleccionar_casilla',casilla:3});const r=await h.actuar({tipo:'accion_aventura',objetivo:'monstruo',id:m.id,xJugador:.5,zJugador:.5});if(!r.ok)throw Error(r.mensaje);h.panel('expediciones');});
 const restante=await page.evaluate(()=>window.__granjaV3.estado().aventura.invocacion.restante);await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>window.__granjaV3.estado().aventura.invocacion.restante),restante);checks.push('Abrir el panel pausa la invocación');await page.locator('#panel-close').click();
 await page.waitForFunction(()=>window.__granjaV3.estado().aventura.dominioArmas?.sello_aire>=1);await page.screenshot({path:resolve(out,'combate-simple.png')});
 await page.evaluate(async()=>{const h=window.__granjaV3;await h.actuar({tipo:'salir_aventura'});h.guardar();});await page.reload();await page.waitForFunction(()=>window.__granjaV3?.ready,null,{timeout:180000});const guardado=await page.evaluate(()=>window.__granjaV3.estado());assert.ok(guardado.aventura.dominioArmas.arco>=1);assert.equal(guardado.aventura.invocacion,null);assert.deepEqual(guardado.aventura.proyectiles,[]);checks.push('Regreso y recarga conservan dominio, cancelan efectos y mantienen V5');
 assert.deepEqual(errores,[]);
} catch(e){errores.push(String(e.stack));process.exitCode=1;await page.screenshot({path:resolve(out,'fallo.png')}).catch(()=>{});}
finally {const resumen={checks,errores,escenario:'Partida nueva aislada con armas y sala despejada para comprobar controles; no es una campaña completada.'};await writeFile(resolve(out,'VERIFICACION.json'),JSON.stringify(resumen,null,2));console.log(JSON.stringify(resumen));await browser.close();}
