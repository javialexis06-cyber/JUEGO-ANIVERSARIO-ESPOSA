/** Carriles variables y reanudación exacta del motor real, sin DOM ni partidas personales. */
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const temporal=await mkdtemp(join(tmpdir(),'pvz-instancias-')),resultados=[];
const salida=resolve(import.meta.dirname,'../test-results/pvz/instancias');
try{
 const fichero=join(temporal,'motor.mjs');
 await build({stdin:{contents:`
  export * from './src/jardin/pvz/motor/motor';
  export * from './src/jardin/pvz/motor/bot';
  export * from './src/jardin/pvz/datos/niveles';
  export * from './src/jardin/pvz/datos/plantas';
  export * from './src/jardin/pvz/datos/zombis';
  export * from './src/jardin/pvz/vista/geometria';
  export * from './src/jardin/conquista/defensas';
 `,resolveDir:resolve(import.meta.dirname,'..')},outfile:fichero,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const{MotorPvZ,crearPilotoPvZ,seleccionPilotoPvZ,semillasAntesDelNivel,NIVELES_PVZ,PLANTAS_PVZ,ZOMBIS_PVZ,geometriaPvZ,DefensasConquistaPvZ}=await import(pathToFileURL(fichero));
 const json=v=>JSON.parse(JSON.stringify(v));
 const pasar=(m,s)=>{for(let i=0;i<Math.round(s*60);i++)m.paso();};
 const prueba=(nombre,fn)=>{fn();resultados.push({nombre,ok:true});console.log('OK',nombre);};
 const nivel=(filas=5,extra={})=>({id:'escenario',parte:1,area:'dia',tablero:{filas},filas:Array.from({length:filas},(_,i)=>i),zombis:['zombi','caracono'],banderas:1,oleadas:4,tipo:'normal',solInicial:10000,...extra});
 const preparado=(n=nivel(),op={})=>new MotorPvZ(n,{sinOleadas:true,semillas:['lanzaguisantes','tripitidora','petacereza','nenufar','nuez','calabaza','seta-congelada'],...op});

 prueba('3, 4, 5, 6, 7 y 9 carriles conservan siembra, costes, proyectiles y cortacéspedes',()=>{
  for(const cantidad of[3,4,5,6,7,9]){
   const m=preparado(nivel(cantidad)),g=geometriaPvZ(m);
   assert.equal(m.filas,cantidad);assert.ok(Math.abs(g.alto-460)<1e-9);assert.equal(m.cortacespedes.length,cantidad);
   for(const fila of m.nivel.filas){
    assert.ok(m.plantar('lanzaguisantes',fila,0));const z=m.crearZombi('caracono',fila,180);pasar(m,8);assert.ok(z.armadura<370||z.vida===0);assert.equal(m.terminado,'');
   }
   assert.equal(m.sol,10000-100*cantidad);assert.equal(m.plantar('nuez',cantidad,0),false);
   const z=m.crearZombi('zombi',cantidad-1,-14.9);pasar(m,.2);assert.equal(z.vida,0);assert.equal(m.cortacespedes.at(-1).estado,'activo');
   const p=preparado(nivel(cantidad));p.plantar('petacereza',cantidad-1,3);const a=p.crearZombi('caracubo',cantidad-1,300),b=p.crearZombi('caracubo',cantidad-2,300),c=p.crearZombi('caracubo',cantidad-3,300);pasar(p,1.3);assert.equal(a.vida,0);assert.equal(b.vida,0);assert.equal(c.vida,270);
   const t=preparado(nivel(cantidad));t.plantar('tripitidora',cantidad-1,0);t.crearZombi('zombi',cantidad-1,700);t.crearZombi('zombi',cantidad-2,700);pasar(t,1.5);assert.ok(t.proyectiles.length>=2);assert.ok(t.proyectiles.every(q=>q.fila>=0&&q.fila<cantidad));
   const bolos=preparado(nivel(cantidad)),fila=cantidad-2;bolos.crearZombi('zombi',fila,300);bolos.proyectiles.push({id:bolos.nuevoId(),tipo:'bolo-nuez',origen:0,fila,x:294,velocidad:240,dano:1800,danoTipo:'aplastar',perforante:true,impactados:[]});bolos.paso();assert.equal(bolos.proyectiles[0].velocidadY,240,'El penúltimo carril puede rebotar hacia el último, también después del quinto');
  }
 });
 prueba('agua discontinua, capas y carriles cerrados usan el terreno del escenario',()=>{
  const n=nivel(7,{area:'piscina',filas:[0,1,3,4,6],filasAgua:[1,6]});const m=preparado(n);
  assert.equal(m.cortacespedes.length,5);assert.equal(m.plantar('nuez',2,0),false);assert.equal(m.crearZombi('zombi',2),null);
  for(const fila of[1,6]){assert.equal(m.plantar('lanzaguisantes',fila,0),false);assert.ok(m.plantar('nenufar',fila,0));assert.ok(m.plantar('lanzaguisantes',fila,0));assert.ok(m.plantar('calabaza',fila,0));assert.ok(m.quitar(fila,0));assert.ok(m.plantaEn(fila,0));assert.ok(m.plantaEn(fila,0,'base'));pasar(m,31);}
  assert.ok(m.crearZombi('zombi-buzo',6));assert.equal(m.crearZombi('zombi-buzo',4),null);
  const conOleadas=new MotorPvZ(n,{semillas:[]});for(let i=0;i<1800;i++){conOleadas.paso();assert.ok(conOleadas.zombis.every(z=>n.filas.includes(z.fila)&&(!conOleadas.esAgua(z.fila)||!!conOleadas.zombisDef[z.tipo].agua)));}
 });
 prueba('rechaza carriles inválidos y mantiene las geometrías originales',()=>{
  for(const cantidad of[0,-1,3.5,33,NaN,Infinity])assert.throws(()=>preparado(nivel(1,{tablero:{filas:cantidad}})));
  assert.throws(()=>preparado(nivel(3,{filas:[0,1,3]})));assert.throws(()=>preparado(nivel(3,{filas:[0,0]})));for(const tablero of[null,{},[],{filas:null}])assert.throws(()=>preparado(nivel(3,{tablero})));
  for(const n of NIVELES_PVZ){const m=new MotorPvZ(n);assert.equal(m.filas,['piscina','niebla'].includes(n.area)?6:5);assert.equal(geometriaPvZ(m).escalaY,.92);}
 });
 prueba('guardado inicial es JSON, incluye director sin primera oleada y no comparte referencias',()=>{
  const m=new MotorPvZ(NIVELES_PVZ[0]),foto=m.exportar();assert.equal(foto.director.lanzada,null);const r=MotorPvZ.restaurar(json(foto));assert.deepEqual(json(r.exportar()),json(foto));foto.nivel.filas.length=0;foto.estado.sol=0;assert.equal(m.sol,150);assert.equal(r.sol,150);
 });
 prueba('conserva abono activo, hielo, cráter, armaduras y eventos futuros sin repetir los viejos',()=>{
  const m=preparado(nivel(7),{abono:3});m.plantar('nuez',6,0);m.usarAbono(m.plantas[0].id);m.crearZombi('caracubo',6,200);m.aplicarEstado(m.zombis[0],'congelado',8);m.crearCrater(5,7);m.crearPistaHielo(4,300);pasar(m,.3);
  const r=MotorPvZ.restaurar(json(m.exportar()));assert.deepEqual(r.consumirEventos(),[]);assert.deepEqual(r.estado(),m.estado());
  for(let i=0;i<1200;i++){m.paso();r.paso();assert.deepEqual(r.eventos,m.eventos);}assert.deepEqual(r.exportar(),m.exportar());
 });
 prueba('versiones futuras, datos corruptos, IDs duplicados y cambios de reglas no pisan el original',()=>{
  const m=preparado();m.plantar('nuez',0,0);const original=json(m.exportar());
  const cambios=[s=>s.version=2,s=>s.reglas=2,s=>s.azar=0,s=>s.estado.sol=-1,s=>s.estado.t=.01,s=>s.estado.plantas[0].fila=8,s=>s.estado.plantas.push({...s.estado.plantas[0]}),s=>s.relojes.proximo=1,s=>s.director={},s=>s.visibilidad.contador=NaN,s=>s.estado.recargas.constructor=1,s=>s.catalogo.plantas.nuez='otra ficha'];
  for(const cambiar of cambios){const s=structuredClone(original);cambiar(s);assert.throws(()=>MotorPvZ.restaurar(s));assert.deepEqual(json(m.exportar()),original);}
  assert.throws(()=>MotorPvZ.restaurar(original,{plantas:{...PLANTAS_PVZ,nuez:{...PLANTAS_PVZ.nuez,sol:51}}}));
  const conNuevas=MotorPvZ.restaurar(original,{plantas:{...PLANTAS_PVZ,nueva:{...PLANTAS_PVZ.nuez,id:'nueva'}}});assert.deepEqual(conNuevas.estado(),m.estado(),'Añadir unidades al catálogo no invalida guardados anteriores');
 });
 prueba('reservas completas, cambios atómicos, revisiones y traslado sin copiar plantas',()=>{
  const g=new DefensasConquistaPvZ({zonas:['casa','calle','almacen'],desbloqueadas:['lanzaguisantes','girasol','nuez']});
  assert.ok(g.asignar('casa',['lanzaguisantes','girasol'],0).ok);const antes=json(g.exportar());
  assert.equal(g.asignar('calle',['nuez','girasol'],1).motivo,'ocupada');assert.deepEqual(json(g.exportar()),antes,'No reserva Nuez parcialmente');
  assert.equal(g.asignar('calle',['nuez'],0).motivo,'revision');assert.equal(g.asignar('calle',['repetidora']).motivo,'bloqueada');assert.equal(g.asignar('calle',['__proto__']).motivo,'semillas');assert.deepEqual(json(g.exportar()),antes);
  assert.ok(g.trasladar('girasol','casa','calle',1).ok);assert.equal(g.propietaria('girasol'),'calle');assert.deepEqual(g.semillas('casa'),['lanzaguisantes']);
  assert.ok(g.iniciar('casa',nivel(3)));assert.equal(g.trasladar('lanzaguisantes','casa','almacen').motivo,'activa');assert.equal(g.asignar('casa',[]).motivo,'activa');
  assert.ok(g.ordenar('casa',{tipo:'plantar',planta:'lanzaguisantes',fila:0,col:0}));assert.ok(g.observar('casa').destruirPlanta(g.observar('casa').plantas[0]));g.paso();assert.equal(g.propietaria('lanzaguisantes'),'casa','La muerte no libera el tipo');
  assert.equal(g.ordenar('casa',{tipo:'plantar',planta:'girasol',fila:0,col:0}),false);assert.equal(g.iniciar('casa',nivel(3)),false,'No reiniciar para borrar daño');
  const restaurado=DefensasConquistaPvZ.restaurar(json(g.exportar()));assert.deepEqual(restaurado.exportar(),g.exportar());
 });
 prueba('alias de otra edición no permite reservar el mismo tipo en dos zonas',()=>{
  // Ficha de prueba del contrato de alias; no anuncia una nueva planta terminada.
  const registros={plantas:{...PLANTAS_PVZ,'girasol-edicion':{...PLANTAS_PVZ.girasol,id:'girasol-edicion'}}};
  const g=new DefensasConquistaPvZ({zonas:['a','b'],desbloqueadas:['girasol'],identidades:{'girasol-edicion':'girasol'}},registros);
  assert.ok(g.asignar('a',['girasol']).ok);assert.equal(g.asignar('b',['girasol-edicion']).motivo,'ocupada');assert.equal(g.propietaria('girasol-edicion'),'a');
  assert.equal(g.asignar('a',['girasol','girasol-edicion']).motivo,'semillas');const identidades={'girasol-edicion':'girasol'},r=DefensasConquistaPvZ.restaurar(json(g.exportar()),registros,identidades);assert.equal(r.propietaria('girasol-edicion'),'a');
  const falso=json(g.exportar());falso.identidades['girasol-edicion']='girasol-edicion';assert.throws(()=>DefensasConquistaPvZ.restaurar(falso,registros,identidades),'Importar no puede inventar una identidad para duplicar el tipo');
 });
 prueba('seis defensas reales avanzan ocultas, pausa común y carga conservan todo el combate',()=>{
  const equipos=[['girasol','lanzaguisantes','nuez'],['repetidora','petacereza','patatapum'],['seta-desesporada','seta-solar','humoseta'],['nenufar','tripitidora','nuez-alta'],['planterna','cactus','frustrella'],['hipnoseta','seta-congelada','petaseta']];
  const zonas=equipos.map((_,i)=>'zona-'+i),a=new DefensasConquistaPvZ({zonas,desbloqueadas:equipos.flat()});
  for(let i=0;i<zonas.length;i++){assert.ok(a.asignar(zonas[i],equipos[i]).ok);assert.ok(a.iniciar(zonas[i],nivel([3,4,5,6,7,9][i]),{semilla:23+i}));}
  let b=DefensasConquistaPvZ.restaurar(json(a.exportar()));
  for(let i=0;i<3600;i++){
   a.seleccionar(i%5===0?null:zonas[i%6]);b.seleccionar(a.visible);
   if(i%90===0)for(const id of zonas){for(const g of[a,b]){const m=g.observar(id);for(const s of[...m.soles])g.ordenar(id,{tipo:'recoger',id:s.id});g.ordenar(id,{tipo:'plantar',planta:g.semillas(id)[0],fila:0,col:Math.floor(i/90)%9});}}
   assert.deepEqual(b.paso(),a.paso());
   if(i%600===0){assert.deepEqual(b.exportar(),a.exportar());b=DefensasConquistaPvZ.restaurar(json(b.exportar()));}
  }
  for(const id of zonas)assert.equal(a.observar(id).pasos,3600);
  a.pausar(true);b.pausar(true);const foto=json(a.exportar());a.avanzar(600);assert.deepEqual(json(a.exportar()),foto);assert.equal(a.ordenar(zonas[0],{tipo:'pala',fila:0,col:0}),false);
  b=DefensasConquistaPvZ.restaurar(json(b.exportar()));assert.equal(b.pausada,true);a.pausar(false);b.pausar(false);assert.deepEqual(b.avanzar(600),a.avanzar(600));assert.deepEqual(b.exportar(),a.exportar());
  for(let i=0;i<60*600&&zonas.some(id=>!a.observar(id).terminado);i++){assert.deepEqual(b.paso(),a.paso());if(i%1800===0)b=DefensasConquistaPvZ.restaurar(json(b.exportar()));}
  assert.ok(zonas.every(id=>a.observar(id).terminado));assert.deepEqual(b.exportar(),a.exportar(),'Las seis partidas terminan con el mismo resultado tras cambiar de vista y reanudar');
  const alterada=json(a.exportar());alterada.zonas[1].semillas=['girasol'];assert.throws(()=>DefensasConquistaPvZ.restaurar(alterada));assert.equal(a.propietaria('girasol'),zonas[0]);
 });

 // Dos pilotos reciben exactamente las mismas reglas y órdenes. Solo la segunda partida se
 // serializa y reconstruye durante el combate, en avisos de oleada y transiciones de minijuegos.
 for(const n of NIVELES_PVZ){
  const semillas=seleccionPilotoPvZ(semillasAntesDelNivel(n.id),n),a=new MotorPvZ(n,{semilla:23,semillas});let b=MotorPvZ.restaurar(json(a.exportar())),copias=1;
  const pa=crearPilotoPvZ(),pb=crearPilotoPvZ();
  for(let i=0;i<60*2400&&!a.terminado;i++){
   pa(a);pb(b);a.paso();b.paso();
   if(i%600===0||a.eventos.some(e=>e.t==='oleadaEnorme'||e.t==='jarron'&&['etapa','transicion'].includes(e.tipo))){
    assert.deepEqual(b.estado(),a.estado(),n.id+' antes de guardar');assert.deepEqual(b.eventos,a.eventos,n.id+' eventos');
    b=MotorPvZ.restaurar(json(b.exportar()));copias++;assert.deepEqual(json(b.exportar()),json(a.exportar()),n.id+' estado interno completo');
   }
  }
  assert.equal(a.terminado,'gano',n.id+' piloto legal');assert.equal(b.terminado,a.terminado);assert.deepEqual(b.estado(),a.estado());assert.deepEqual(json(MotorPvZ.restaurar(json(b.exportar())).exportar()),json(a.exportar()));
  resultados.push({nivel:n.id,semilla:23,copias,t:a.t,gano:true});console.log('OK reanudar',n.id,copias,'guardados',Math.round(a.t)+'s');
 }
 await mkdir(salida,{recursive:true});await writeFile(join(salida,'resultado.json'),JSON.stringify({ok:true,pruebas:resultados},null,2));
}catch(error){await mkdir(salida,{recursive:true});await writeFile(join(salida,'resultado.json'),JSON.stringify({ok:false,pruebas:resultados,error:String(error.stack??error)},null,2));throw error;}
finally{await rm(temporal,{recursive:true,force:true});}
