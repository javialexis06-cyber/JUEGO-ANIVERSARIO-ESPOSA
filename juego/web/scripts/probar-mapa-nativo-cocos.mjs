/** Tableros nativos reales. Puntos preparados para revisar geometría/catálogo; no son victorias. */
import{chromium}from'@playwright/test';import assert from'node:assert/strict';import fs from'node:fs/promises';import os from'node:os';import path from'node:path';import{pathToFileURL}from'node:url';import{build}from'esbuild';
const base=process.argv[2]??'http://127.0.0.1:4196/',out=path.resolve(process.argv[3]??'test-results/mapa-nativo-cocos');await fs.mkdir(out,{recursive:true});
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'cocos-mapa-')),file=path.join(dir,'niveles.mjs');
await build({stdin:{contents:"export * from './src/jardin/motores/nivel-historia';export * from './src/jardin/conquista/historia-datos';",resolveDir:path.resolve(import.meta.dirname,'..')},outfile:file,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const{nivelHistoriaNativa,ESCENARIOS_HISTORIA_PVZ}=await import(pathToFileURL(file));
const b=await chromium.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/chromium',args:['--enable-webgl','--ignore-gpu-blocklist']}),p=await b.newPage({viewport:{width:844,height:475}}),checks=[],errors=[],bad=[];p.setDefaultTimeout(240000);p.on('pageerror',e=>{errors.push(String(e.stack));console.log('PAGEERROR '+e.message);});p.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))bad.push([r.status(),r.url()]);});
try{
 await p.route('**/prueba-mapa.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><style>body{margin:0}#campo{width:100vw;height:100vh}</style><div id="campo"></div>'}));
 await p.goto(new URL('prueba-mapa.html',base).href);
 await p.evaluate(async()=>{const{FrenteGardendless}=await import('/src/jardin/motores/frente-gardendless.ts');window.__motor=new FrenteGardendless(document.getElementById('campo'),'mapa-prueba','pareja',undefined,{historia:true});await __motor.listo;});
 const f=p.frames().find(f=>f.url().includes('/motores/pvz2/'));
 const ids=process.env.ZONAS?process.env.ZONAS.split(',').map(Number):[6,10,11,3,1,4,5,0,2,7,8,9];
 for(const id of ids){
  const e=ESCENARIOS_HISTORIA_PVZ[id],equipo=e.desbloquea.length?e.desbloquea:['lanzaguisantes'],c=nivelHistoriaNativa(id,equipo,23);
  console.log('PREPARAR '+id+' '+e.nombre);
  await p.evaluate(c=>__motor.prepararHistoria(c),c);await p.evaluate(c=>__motor.iniciarHistoria({...c,reposo:true}),c);await p.evaluate(()=>__motor.pasoHistoria(0,true));
  const datos=await f.evaluate(async()=>{const cc=await System.import('cc'),m=n=>System.get(`chunks:///_virtual/${n}.ts`),s=m('Square').Square;
   return{filas:s.LaneCount,celdas:s.getAllLnC().length,ultima:s.getLnC(s.LaneCount-1,8).lIndex,ultimaLane:s.getLane(s.LaneCount-1).LaneIndex,fuera:s.getLane(s.LaneCount).LaneIndex,
    referencias:s.getAllLnC().map(q=>({fila:q.lIndex,col:q.cIndex,lane:q.inLane.LaneIndex,lower:q.squareLower?.SquareUpper===q.node})),
    deshabilitadas:m('FrontYard').FrontYard.CurrentLawn.DisabledLanes,agua:s.getAllLnC().filter(q=>q.getSquareType()===m('LnC').SquareType.water).map(q=>q.lIndex),noche:m('FrontYard').FrontYard.CurrentLawn.atNight_,lapidas:s.getAllLnC().filter(q=>q.tombstone?.node?.isValid&&q.tombstone.health>0).length,
    semillas:m('Cards').Cards.component.CFs.filter(c=>c.node.activeInHierarchy).map(c=>c.Type),oleadas:m('levelController').LevelPlay.component.waveManagerProps.WaveCount,
    ids:s.getAllLnC().map(q=>q.node.uuid),reloj:m('levelController').LevelPlay.component.gamedTime};});
  assert.equal(datos.filas,Math.max(5,c.filas));assert.equal(datos.celdas,Math.max(5,c.filas)*9);assert.equal(new Set(datos.ids).size,datos.celdas);assert.equal(datos.ultima,c.filas>5?c.filas-1:4);assert.equal(datos.ultimaLane,datos.ultima);assert.equal(datos.fuera,datos.filas);
  assert.ok(datos.referencias.every(q=>q.lane===q.fila&&q.lower));assert.deepEqual([...new Set(datos.agua)].sort(),[...c.agua].sort());assert.equal(datos.noche,c.noche);assert.equal(datos.lapidas,c.lapidas.length);assert.deepEqual(datos.semillas,c.semillas);assert.equal(datos.reloj,0);
  await p.screenshot({path:path.join(out,`zona-${id}.png`)});checks.push({id,nombre:e.nombre,filas:c.filas,semillas:c.semillas,agua:c.agua,noche:c.noche});console.log('OK '+e.nombre+' · '+c.filas+' carriles · '+c.semillas.length+' semillas');
 }
 // Caso preparado por capas: la misma casilla admite soporte, planta y coraza nativos.
 const capa=nivelHistoriaNativa(5,['nenufar','marseta','calabaza'],23);
 capa.punto={version:1,soles:150,plantas:[{tipo:'lilypad',fila:1,col:0,vida:100},{tipo:'seashroom',fila:1,col:0,vida:13,temporales:{lifeCD:31}},{tipo:'pumpkin',fila:1,col:0,vida:71}],cortacespedes:[true,true,true,true,false],recargas:{}};
 await p.evaluate(c=>__motor.prepararHistoria(c),capa);await p.evaluate(c=>__motor.iniciarHistoria({...c,reposo:true}),capa);
 const foto=await p.evaluate(()=>__motor.puntoHistoria());
 assert.deepEqual(foto.plantas.map(x=>[x.tipo,x.fila,x.col,x.vida]).sort(),capa.punto.plantas.map(x=>[x.tipo,x.fila,x.col,x.vida]).sort());
 const otra={...capa,punto:foto};await p.evaluate(c=>__motor.prepararHistoria(c),otra);await p.evaluate(c=>__motor.iniciarHistoria({...c,reposo:true}),otra);
 const segunda=await p.evaluate(()=>__motor.puntoHistoria());assert.deepEqual(segunda.plantas.map(x=>[x.tipo,x.fila,x.col,x.vida]).sort(),foto.plantas.map(x=>[x.tipo,x.fila,x.col,x.vida]).sort());
 checks.push({caso:'Nenúfar, Marseta y Calabaza conservan casilla y vida tras dos reconstrucciones'});console.log('OK Capas acuáticas y daño conservado');
 // Lápidas y cráteres: retirar una lápida no debe hacerla reaparecer en la siguiente defensa.
 const noche=nivelHistoriaNativa(4,['seta-desesporada','seta-solar','humoseta','comepiedras'],23);
 await p.evaluate(c=>__motor.prepararHistoria(c),noche);await p.evaluate(c=>__motor.iniciarHistoria({...c,reposo:true}),noche);
 await f.evaluate(()=>{const S=System.get('chunks:///_virtual/Square.ts').Square,ts=S.getAllLnC().filter(q=>q.tombstone?.health>0);ts[0].tombstone.health=17;ts[1].tombstone.health=0;ts[1].tombstone.die();S.getLnC(0,3).crackleCountdown=37;});
 const terreno=await p.evaluate(()=>__motor.puntoHistoria());assert.equal(terreno.lapidas.length,noche.lapidas.length-1);assert.ok(terreno.lapidas.some(q=>q.vida===17));assert.ok(terreno.crateres.some(q=>q.segundos===37));
 const repuesta=nivelHistoriaNativa(4,['seta-desesporada','seta-solar','humoseta','comepiedras'],23,terreno);
 await p.evaluate(c=>__motor.prepararHistoria(c),repuesta);await p.evaluate(c=>__motor.iniciarHistoria({...c,reposo:true}),repuesta);
 const t2=await p.evaluate(()=>__motor.puntoHistoria());assert.deepEqual(t2.lapidas,terreno.lapidas);assert.deepEqual(t2.crateres,terreno.crateres);checks.push({caso:'Las lápidas retiradas, su daño y los cráteres se conservan entre defensas'});console.log('OK Lápidas y cráteres conservados');
 // Combate preparado en la séptima fila: no altera partidas ni se declara victoria de campaña.
 const combate=nivelHistoriaNativa(6,['tripitidora','nuez-alta'],23);
 combate.punto={version:1,soles:150,plantas:[{tipo:'threepeater',fila:6,col:0,vida:13},{tipo:'tallnut',fila:6,col:4,vida:73}],cortacespedes:Array(7).fill(true),recargas:{}};
 await p.evaluate(c=>__motor.prepararHistoria(c),combate);await p.evaluate(c=>__motor.iniciarHistoria(c),combate);
 let pasosCombate=0;
 for(let i=0;i<310;i++){
  if(await f.evaluate(()=>{const c=System.get('chunks:///_virtual/Cards.ts').Cards.component,i=c.CFs.findIndex(f=>f.Type==='tallnut');return c.CUs[i].selectable&&c.CFs[i].ca.getSelectable();}))break;
  await p.evaluate(()=>__motor.pasoHistoria(6,false));pasosCombate+=6;
 }
 await p.evaluate(()=>__motor.pasoHistoria(0,true));
 await f.evaluate(()=>{const ui=System.get('chunks:///_virtual/UI.ts').UIInGame.component,original=ui.spawnPlantCost.bind(ui);window.__costes=[];ui.spawnPlantCost=function(...args){const antes=System.get('chunks:///_virtual/SunCount.ts').SunCount.Value,r=original(...args);__costes.push(antes-System.get('chunks:///_virtual/SunCount.ts').SunCount.Value);return r;};});
 const puntos=await f.evaluate(async()=>{const cc=await System.import('cc'),S=System.get('chunks:///_virtual/Square.ts').Square,cards=System.get('chunks:///_virtual/Cards.ts').Cards.component,cam=cc.director.getScene().getComponentsInChildren(cc.Camera).filter(c=>c.enabledInHierarchy),can=cc.game.canvas,r=can.getBoundingClientRect();const proy=n=>{const c=cam.find(c=>(c.visibility&n.layer)!==0),v=c.worldToScreen(n.worldPosition);return{x:r.left+v.x/can.width*r.width,y:r.top+(can.height-v.y)/can.height*r.height};};return{carta:proy(cards.CFs.find(c=>c.Type==='tallnut').node),celda:proy(S.getLnC(6,1).plantPoint)};});
 await p.mouse.move(puntos.carta.x,puntos.carta.y);await p.mouse.down();await p.mouse.move(puntos.celda.x,puntos.celda.y,{steps:8});await p.mouse.up();
 for(let i=0;i<15;i++){await p.evaluate(()=>__motor.pasoHistoria(6,false));pasosCombate+=6;}
 const siembra=await f.evaluate(()=>{const m=n=>System.get(`chunks:///_virtual/${n}.ts`),S=m('Square').Square,ui=m('UI').UIInGame.component;return{plantas:m('CharacterManager').PlantPool.pool().filter(x=>x.node?.isValid).map(x=>({tipo:x.Plant_Type,fila:x.plantInLnC?.lIndex,col:x.plantInLnC?.cIndex})),cargos:__costes,index:ui.index,pausada:ui.paused,apiPausa:semillaHistoriaMotor.pausada,estado:[m('levelController').LevelPlay.component.gameLost,m('levelController').LevelPlay.component.gameWon],mouse:[m('Mouse').Mouse.position.x,m('Mouse').Mouse.position.y],casilla:[S.judgeLIndex(m('Mouse').Mouse.position.y),S.judgeCIndex(m('Mouse').Mouse.position.x)],carta:m('Cards').Cards.component.CUs.map(c=>({cd:c.CD,selectable:c.selectable}))};});
 assert.ok(siembra.plantas.some(x=>x.tipo==='tallnut'&&x.fila===6&&x.col===1),'Siembra: '+JSON.stringify({puntos,siembra}));
 const antes=await f.evaluate(async()=>{const m=n=>System.get(`chunks:///_virtual/${n}.ts`),S=m('Square').Square;window.__zombiPrueba=await m('Zombies').zombies.spawnZombieFromLaneByType(6,'tutorial');__zombiPrueba.worldPositionX=S.getSquareWorldPosition(6,7).x;return{vida:__zombiPrueba.health,soles:m('SunCount').SunCount.Value};});assert.deepEqual(await f.evaluate(()=>__costes),[125]);
 for(let i=0;i<200;i++){await p.evaluate(()=>__motor.pasoHistoria(6,false));pasosCombate+=6;}
 const despues=await f.evaluate(()=>({vida:__zombiPrueba.health,fila:__zombiPrueba.lIndex}));assert.equal(despues.fila,6);assert.ok(despues.vida<antes.vida);
 await p.evaluate(()=>__motor.pasoHistoria(0,true));await p.screenshot({path:path.join(out,'combate-septimo-carril.png')});checks.push({caso:'Arrastre con coste nativo y proyectiles que dañan un zombi real en el séptimo carril',antes,despues,pasosPreparados:pasosCombate});console.log('OK Siembra real y daño de proyectiles en el séptimo carril');
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
}catch(e){errors.push(String(e.stack));process.exitCode=1;await p.screenshot({path:path.join(out,'fallo.png')}).catch(()=>{});}finally{await fs.writeFile(path.join(out,'resultado.json'),JSON.stringify({checks,errors,bad,alcance:'Preparación y reutilización de tableros nativos reales. No es una campaña ganada ni certificación de teléfono.'},null,2));console.log(JSON.stringify({checks:checks.length,errors,bad}));await b.close();await fs.rm(dir,{recursive:true,force:true});}
