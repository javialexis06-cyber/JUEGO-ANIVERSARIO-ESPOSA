/** Regresiones de historias anteriores (sin fase inicial nueva), con el motor PvZ real; escenarios de contrato separados de una campaña con piloto legal. */
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
const temporal=await mkdtemp(join(tmpdir(),'historia-pvz-')),salida=resolve('test-results/conquista/historia-motor'),checks=[],campanas=[];
try{
 const fichero=join(temporal,'historia.mjs');await build({stdin:{contents:`
  export * from './src/jardin/conquista/historia-motor';
  export * from './src/jardin/conquista/historia-datos';
  export * from './src/jardin/conquista/historia-guardado';
  export * from './src/jardin/conquista/historia-piloto';
  export * from './src/jardin/pvz/motor/motor';
  export * from './src/jardin/pvz/motor/bot';
  export * from './src/jardin/pvz/datos/plantas';
 `,resolveDir:process.cwd()},outfile:fichero,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const{HistoriaConquistaPvZ,GuardadoHistoriaPvZ,ESCENARIOS_HISTORIA_PVZ,crearPilotoHistoriaPvZ,crearPilotoPvZ,MotorPvZ,PLANTAS_PVZ}=await import(pathToFileURL(fichero));
 const json=x=>JSON.parse(JSON.stringify(x)),prueba=(nombre,fn)=>{fn();checks.push(nombre);console.log('OK',nombre);};
 const pasar=(m,s)=>{for(let i=0;i<Math.ceil(s*60);i++)m.paso();};
 prueba('casa única, escenarios de 3–7 carriles, catálogo real y versiones independientes',()=>{
  const m=new HistoriaConquistaPvZ(23,true,'anterior');assert.deepEqual(m.estado.zonas.filter(z=>z.dueno==='plantas').map(z=>z.id),[8]);assert.equal(m.estado.ganador,'');assert.deepEqual(m.defensas.semillas('8'),ESCENARIOS_HISTORIA_PVZ[8].desbloquea);
  assert.deepEqual([...new Set(ESCENARIOS_HISTORIA_PVZ.map(e=>e.nivel.tablero.filas))].sort(),[3,4,5,6,7]);
  const tipos=ESCENARIOS_HISTORIA_PVZ.flatMap(e=>e.desbloquea);assert.equal(tipos.length,32);assert.equal(new Set(tipos).size,32);assert.ok(tipos.every(id=>PLANTAS_PVZ[id]));assert.ok(ESCENARIOS_HISTORIA_PVZ.every(e=>e.nivel.tipo==='normal'&&!e.nivel.cinta&&!e.nivel.premio));
  assert.deepEqual(HistoriaConquistaPvZ.restaurar(json(m.exportar())).exportar(),m.exportar());
 });
 prueba('llegar desbloquea una vez, no permite saltarse rutas o la fortaleza final',()=>{
  const m=new HistoriaConquistaPvZ(23,true,'anterior');assert.equal(m.explorar(0),false);assert.equal(m.explorar(3),false);assert.equal(m.explorar(9),true);assert.ok(m.estado.desbloqueadas.includes('repetidora'));const foto=m.exportar();assert.equal(m.explorar(9),true);assert.deepEqual(m.exportar(),foto);assert.equal(m.defensas.propietaria('lanzaguisantes'),'8');
  assert.equal(m.preparar(9,['repetidora']), '');assert.equal(m.expedicion(9),true);assert.ok(m.defensas.observar('9') instanceof MotorPvZ);assert.equal(m.preparar(9,['nuez']).includes('combatiendo'),true);assert.equal(m.defensas.propietaria('nuez'),'8');
  const otra=new HistoriaConquistaPvZ(23,true,'anterior');otra.explorar(9);assert.equal(otra.preparar(9,['girasol']),'');assert.equal(otra.preparar(8,['girasol']),'','Un equipo preparado puede cancelarse antes de salir, sin tipos atrapados en una zona enemiga');assert.equal(otra.defensas.propietaria('girasol'),'8');
 });
 prueba('incursión a los 35 s en frontera, tableros ocultos, pausa y carga exacta',()=>{
  const a=new HistoriaConquistaPvZ(23,true,'anterior');a.explorar(9);a.preparar(9,['repetidora','patatapum']);a.expedicion(9);pasar(a,35);assert.ok(a.estado.zonas[8].incursion);assert.equal(a.activos.length,2);assert.equal(a.defensas.observar('9').pasos,2100);
  let b=HistoriaConquistaPvZ.restaurar(json(a.exportar()));
  for(let i=0;i<1200;i++){a.seleccionar(i%3?9:null);b.seleccionar(a.defensas.visible===null?null:Number(a.defensas.visible));assert.deepEqual(b.paso(),a.paso());}
  assert.deepEqual(b.exportar(),a.exportar());a.pausar(true);const foto=a.exportar();pasar(a,10);assert.deepEqual(a.exportar(),foto);assert.equal(a.ordenar(9,{tipo:'pala',fila:0,col:0}),false);assert.deepEqual(HistoriaConquistaPvZ.restaurar(json(foto)).exportar(),foto);
 });
 prueba('traslado atómico en descanso retira las plantas sin curar ni reponer recursos',()=>{
  const m=new MotorPvZ(ESCENARIOS_HISTORIA_PVZ[8].nivel,{semillas:['lanzaguisantes','girasol','nuez','petacereza']}),p=crearPilotoPvZ();for(let i=0;i<60*1200&&!m.terminado;i++){p(m);m.paso();}assert.equal(m.terminado,'gano');
  const antes=m.exportar();assert.ok(m.cambiarSemillasEnDescanso(m.semillas));assert.deepEqual(m.exportar(),antes,'Confirmar el mismo equipo no cambia el combate conservado');assert.ok(m.plantas.some(p=>p.tipo==='lanzaguisantes'));assert.ok(m.cambiarSemillasEnDescanso(['girasol','nuez']));assert.ok(m.plantas.every(p=>p.tipo!=='lanzaguisantes'));assert.equal(m.sol,antes.estado.sol);assert.deepEqual(m.cortacespedes,antes.estado.cortacespedes);assert.deepEqual(m.recargas,antes.estado.recargas);
  const salud=m.plantas.map(p=>[p.id,p.vida]);assert.ok(m.reanudarIncursion());assert.equal(m.oleada,0);assert.equal(m.sol,antes.estado.sol);assert.deepEqual(m.plantas.map(p=>[p.id,p.vida]),salud);assert.deepEqual(m.cortacespedes,antes.estado.cortacespedes);assert.deepEqual(MotorPvZ.restaurar(json(m.exportar())).exportar(),m.exportar());
 });
 prueba('archivo nuevo, cuota, conflicto, corrupción y futuro conservan el original',()=>{
  const datos=new Map([['conquista-prototipo-v1','prototipo-intacto'],['pvz-v1','aventura-intacta'],['jardin-v1','patios-intactos']]);let cuota=false;const almacen={getItem:k=>datos.get(k)??null,setItem:(k,v)=>{if(cuota)throw Error('cuota');datos.set(k,v);}},a=new GuardadoHistoriaPvZ(almacen),b=new GuardadoHistoriaPvZ(almacen),m=new HistoriaConquistaPvZ(23,true,'anterior');
  assert.equal(a.leer(),null);assert.equal(b.leer(),null);assert.ok(a.guardar(m.exportar()));assert.equal(b.guardar(m.exportar()),false);assert.equal(b.motivo,'conflicto');const original=datos.get(a.clave);cuota=true;pasar(m,1);assert.equal(a.guardar(m.exportar()),false);assert.equal(datos.get(a.clave),original);cuota=false;assert.ok(a.guardar(m.exportar()));
  for(const archivo of['{malformado',JSON.stringify({version:20})]){datos.set(a.clave,archivo);assert.equal(a.leer(),null);assert.equal(a.guardar(m.exportar()),false);assert.equal(datos.get(a.clave),archivo);}
  assert.equal(datos.get('conquista-prototipo-v1'),'prototipo-intacto');assert.equal(datos.get('pvz-v1'),'aventura-intacta');assert.equal(datos.get('jardin-v1'),'patios-intactos');
  const mal=m.exportar();mal.defensas.zonas[9].semillas=['girasol'];assert.throws(()=>HistoriaConquistaPvZ.restaurar(mal));
 });
 prueba('sin intervención la casa cae y su equipo no queda duplicado en una zona perdida',()=>{const m=new HistoriaConquistaPvZ(23,true,'anterior');for(let i=0;i<60*600&&!m.estado.ganador;i++)m.paso();assert.equal(m.estado.ganador,'zombis');assert.equal(m.estado.zonas[8].dueno,'zombis');assert.deepEqual(m.defensas.semillas('8'),[]);assert.equal(m.defensas.propietaria('girasol'),null);assert.deepEqual(HistoriaConquistaPvZ.restaurar(json(m.exportar())).exportar(),m.exportar());});
 prueba('incursiones normales repetidas conservan la defensa, los relojes y los recursos sin reposiciones',()=>{
  const m=new HistoriaConquistaPvZ(23,true,'anterior'),piloto=crearPilotoPvZ();let victorias=0,comienzos=0,conservada=null;
  const recursos=local=>json({sol:local.sol,abono:local.abono,plantas:local.plantas,cortacespedes:local.cortacespedes,recargas:local.recargas,pasos:local.pasos});
  for(let i=0;i<60*1600&&!m.estado.ganador;i++){
   const z=m.estado.zonas[8],id=z.incursion?.id,local=m.defensas.observar('8');if(id)piloto(local);m.seleccionar(i%2?8:null);m.paso();
   if(!id&&z.incursion){comienzos++;if(conservada)assert.deepEqual(recursos(m.defensas.observar('8')),conservada,'Rearmar no debe regalar salud, recargas, soles ni cortacéspedes');}
   if(id&&!z.incursion){assert.equal(z.dueno,'plantas');victorias++;conservada=recursos(local);assert.deepEqual(HistoriaConquistaPvZ.restaurar(json(m.exportar())).exportar(),m.exportar());}
  }
  assert.equal(m.estado.ganador,'');assert.ok(victorias>=10,JSON.stringify({victorias,comienzos}));assert.equal(m.defensas.propietaria('girasol'),'8');campanas.push({tipo:'asedio-a-la-casa',incursiones:true,t:m.t,victorias,comienzos});
 });
 prueba('el piloto conserva tipos fronterizos y usa equipos distintos en expediciones simultáneas a las defensas',()=>{
  for(const semilla of[23,41]){const m=new HistoriaConquistaPvZ(semilla,true,'anterior'),piloto=crearPilotoHistoriaPvZ(),vistas=new Set();let maxFrentes=0;
   for(let i=0;i<60*600&&!m.estado.ganador;i++){const reservas=m.estado.zonas.filter(z=>z.dueno==='plantas'&&m.vecinos(z.id).some(v=>m.estado.zonas[v].dueno==='zombis')).flatMap(z=>m.defensas.semillas(String(z.id)).map(tipo=>[tipo,String(z.id)]));piloto(m);for(const[tipo,zona]of reservas)assert.equal(m.defensas.propietaria(tipo),zona,'El piloto no debe vaciar una frontera para expandirse');m.paso();maxFrentes=Math.max(maxFrentes,m.activos.length);for(const z of m.estado.zonas)if(z.dueno==='plantas')vistas.add(z.id);}
   assert.equal(m.estado.ganador,'');assert.ok(vistas.has(9)&&m.estado.conocidas.includes(4),JSON.stringify({semilla,vistas:[...vistas],avisos:m.estado.avisos}));assert.ok(maxFrentes>=2);assert.deepEqual(HistoriaConquistaPvZ.restaurar(json(m.exportar())).exportar(),m.exportar());campanas.push({tipo:'salidas-iniciales',semilla,incursiones:true,t:m.t,recuperadasAlgunaVez:[...vistas],maxFrentes});
  }
 });
 // Configuración de prueba explícita: sin incursiones estratégicas. Recorre todos los combates
 // y traslada equipos por controles legales; no certifica la presión de la campaña normal.
 const m=new HistoriaConquistaPvZ(23,false,'anterior'),piloto=crearPilotoHistoriaPvZ();let copias=0;
 for(let i=0;i<60*12000&&!m.estado.ganador;i++){
  piloto(m);m.paso();if(i%1800===0){const copia=HistoriaConquistaPvZ.restaurar(json(m.exportar()));assert.deepEqual(copia.exportar(),m.exportar());copias++;}
 }
 campanas.push({semilla:23,incursiones:false,ganador:m.estado.ganador,recuperadas:m.estado.zonas.filter(z=>z.dueno==='plantas').length,t:m.t,copias});
 assert.equal(m.estado.ganador,'plantas',JSON.stringify({t:m.t,zonas:m.estado.zonas.map(z=>[z.id,z.dueno,z.incursion]),equipos:m.exportar().defensas.zonas.map(z=>[z.id,z.semillas])}));assert.ok(m.estado.zonas.every(z=>z.dueno==='plantas'));assert.equal(m.estado.desbloqueadas.length,32);console.log('OK recorrido de los doce escenarios, sin incursiones',Math.round(m.t)+'s');
 await mkdir(salida,{recursive:true});await writeFile(join(salida,'resultado.json'),JSON.stringify({ok:true,checks,campanas},null,2));
}catch(error){await mkdir(salida,{recursive:true});await writeFile(join(salida,'resultado.json'),JSON.stringify({ok:false,checks,campanas,error:String(error.stack??error)},null,2));throw error;}
finally{await rm(temporal,{recursive:true,force:true});}
