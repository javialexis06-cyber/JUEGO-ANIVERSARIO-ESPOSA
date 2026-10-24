/** Caso preparado sobre un punto real ganado; comprueba ciclo nativo, no concede victorias. */
import{chromium}from'@playwright/test';import assert from'node:assert/strict';import fs from'node:fs/promises';import path from'node:path';
const base=process.argv[2]??'http://127.0.0.1:4196/',archivo=process.argv[3]??'test-results/historia-nativa/resultado.json',out=path.resolve(process.argv[4]??'test-results/gardendless-reutilizacion');await fs.mkdir(out,{recursive:true});const punto=JSON.parse(await fs.readFile(archivo,'utf8')).casa;assert.ok(punto?.zonas[0].punto&&!punto.inicioCasa);
const b=await chromium.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/chromium',args:['--enable-webgl','--ignore-gpu-blocklist']}),ctx=await b.newContext({viewport:{width:640,height:360}}),p=await ctx.newPage();p.setDefaultTimeout(240000);const checks=[],errors=[];const ok=t=>{checks.push(t);console.log('OK '+t);};
p.on('pageerror',e=>{errors.push(String(e.stack));console.log('PAGEERROR '+e.stack);});
await ctx.addInitScript(d=>{if(window===window.top&&!localStorage.getItem('conquista-historia-nativa-v3'))localStorage.setItem('conquista-historia-nativa-v3',JSON.stringify(d));},punto);
try{
 await p.goto(new URL('jardin.html?modo=historia&prueba=1&rol=ella&local=1',base).href);await p.waitForFunction(()=>window.__historiaNativa&&[...__historiaNativa.instancias().values()].length===2&&[...__historiaNativa.instancias().values()].every(i=>i.lista)&&!__historiaNativa.control().cargando);
 await p.locator('[data-hn-zona="8"]').click();await p.locator('[data-cq="ver"]').click();await p.waitForFunction(()=>__historiaNativa.control().visible===8);
 await p.locator('[data-cq="pausa"]').click();await p.locator('.hn-capa h2').filter({hasText:'Un respiro'}).waitFor();
 const sesion=await p.evaluate(()=>__historiaNativa.instancias().get(8).motor.sesion),f=p.frames().find(f=>new URL(f.url()).searchParams.get('sesion')===sesion);
 const leer=()=>f.evaluate(()=>System.get('chunks:///_virtual/CharacterManager.ts').PlantPool.pool().filter(p=>p.node?.isValid&&p.health>0).map(p=>[p.Plant_Type,p.plantInLnC.lIndex,p.plantInLnC.cIndex,p.health]).sort());
 const esperadas=punto.zonas[0].punto.plantas.map(p=>[p.tipo,p.fila,p.col,p.vida]).sort();assert.deepEqual(await leer(),esperadas);ok('El punto real conserva sus plantas y vida antes de reutilizar el campo');
 for(let vez=0;vez<2;vez++){
  await p.evaluate(async()=>{const{nivelHistoriaNativa}=await import('/src/jardin/motores/nivel-historia.ts'),m=__historiaNativa.mundo(),z=m.zona(8),i=__historiaNativa.instancias().get(8),c=nivelHistoriaNativa(8,z.equipo,m.estado.semilla,z.punto,true);await i.motor.prepararHistoria(c);i.estado=await i.motor.iniciarHistoria(c);await i.motor.pasoHistoria(0,true);});
  assert.equal(await p.evaluate(()=>__historiaNativa.instancias().get(8).motor.sesion),sesion);assert.deepEqual(await leer(),esperadas);assert.equal(await f.evaluate(()=>System.get('chunks:///_virtual/levelController.ts').LevelPlay.component.gamedTime),0);ok('Reutilización '+(vez+1)+': mismo motor, plantas y vida intactas, sin referencias a sombras antiguas');
 }
 assert.deepEqual(errors,[]);await p.screenshot({path:path.join(out,'campo-reutilizado.png')});
}catch(e){errors.push(String(e.stack));process.exitCode=1;await p.screenshot({path:path.join(out,'fallo.png')}).catch(()=>{});}finally{await fs.writeFile(path.join(out,'resultado.json'),JSON.stringify({checks,errors,limites:'Dos ciclos nativos preparados sobre un punto ganado, con el mundo pausado. No es otra partida ni una instantánea a mitad de combate.'},null,2));console.log(JSON.stringify({checks:checks.length,errors}));await b.close();}
