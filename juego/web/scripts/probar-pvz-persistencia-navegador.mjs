/**
 * Contrato de motor y guardado en Chromium con localStorage real de un contexto aislado.
 * No carga la aventura visual: no acredita interfaz, gráficos ni rendimiento de dispositivos.
 * Uso: CHROME_PATH=/usr/bin/chromium node scripts/probar-pvz-persistencia-navegador.mjs
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {build} from 'esbuild';
import {chromium} from '@playwright/test';

const salida=resolve(import.meta.dirname,'../test-results/pvz/persistencia-navegador');
const resultados=[],errores=[],peticionesExternas=[];
const registrar=(nombre,detalle={})=>{resultados.push({nombre,ok:true,...detalle});console.log('OK',nombre);};
let servidor,browser,context,origen,completado=false;
await mkdir(salida,{recursive:true});
try{
 const compilado=await build({
  stdin:{contents:"import {MotorPvZ} from './src/jardin/pvz/motor/motor';import {crearPilotoPvZ,seleccionPilotoPvZ} from './src/jardin/pvz/motor/bot';import {NIVEL_PVZ} from './src/jardin/pvz/datos/niveles';import {GuardadoPvZ,progresoInicialPvZ} from './src/jardin/pvz/guardado';globalThis.__pvz={MotorPvZ,crearPilotoPvZ,seleccionPilotoPvZ,NIVEL_PVZ,GuardadoPvZ,progresoInicialPvZ};",resolveDir:resolve(import.meta.dirname,'..')},
  write:false,bundle:true,platform:'browser',format:'iife',target:'es2022',logLevel:'silent'
 });
 const codigo=compilado.outputFiles[0].text;
 servidor=createServer((peticion,respuesta)=>{
  respuesta.setHeader('Cache-Control','no-store');
  if(peticion.url==='/motor.js'){respuesta.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8'});respuesta.end(codigo);}
  else if(peticion.url==='/'){respuesta.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});respuesta.end('<!doctype html><html lang="es"><meta charset="utf-8"><title>Contrato aislado de persistencia PvZ</title><script src="/motor.js"></script></html>');}
  else{respuesta.writeHead(404);respuesta.end();}
 });
 await new Promise((ok,fallo)=>{servidor.once('error',fallo);servidor.listen(0,'127.0.0.1',ok);});
 origen=`http://127.0.0.1:${servidor.address().port}`;
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 context=await browser.newContext();
 await context.route('**/*',ruta=>{
  if(new URL(ruta.request().url()).origin===origen)return ruta.continue();
  peticionesExternas.push(ruta.request().url());return ruta.abort();
 });
 const pagina=await context.newPage();
 pagina.on('pageerror',e=>errores.push(e.message));
 const cargar=async()=>{await pagina.goto(origen+'/');await pagina.waitForFunction(()=>!!globalThis.__pvz);};
 const recargar=async()=>{await pagina.reload();await pagina.waitForFunction(()=>!!globalThis.__pvz);};
 await cargar();
 const inicial=await pagina.evaluate(()=>{
  localStorage.clear();localStorage.setItem('jardin-v1','clásica pareja intacta');localStorage.setItem('amigo-jardin-v1','clásica amigos intacta');
  const g=new globalThis.__pvz.GuardadoPvZ(localStorage);
  return {siguiente:g.siguienteNivel,disponibles:g.disponibles(),bloqueado:g.abrirNivel('1-2'),texto:localStorage.getItem('pvz-v1'),claves:Object.keys(localStorage).sort()};
 });
 assert.equal(inicial.siguiente,'1-1');assert.deepEqual(inicial.disponibles,['lanzaguisantes']);assert.deepEqual(inicial.bloqueado,{ok:false,motivo:'bloqueado'});assert.equal(inicial.texto,null);assert.deepEqual(inicial.claves,['amigo-jardin-v1','jardin-v1']);
 registrar('contexto aislado sin guardados previos ni escritura automática');

 // Cada victoria se obtiene con órdenes legales del piloto, los recursos del nivel y su selección desbloqueada.
 // Solo el adaptador de escritura inyecta el fallo esperado; no se mutan oleadas, vida, sol ni resultado.
 const jugar=async(nivel,fallarCuota=false)=>pagina.evaluate(({nivel,fallarCuota})=>{
  const {GuardadoPvZ,MotorPvZ,crearPilotoPvZ}=globalThis.__pvz;
  const control={fallar:false,intentos:0,escrituras:0};
  const almacen={getItem:k=>localStorage.getItem(k),setItem(k,v){control.intentos++;if(control.fallar)throw new DOMException('Cuota simulada por la prueba','QuotaExceededError');localStorage.setItem(k,v);control.escrituras++;}};
  const g=new GuardadoPvZ(almacen),a=g.abrirNivel(nivel,undefined,23);
  if(!a.ok)throw new Error('No se pudo abrir '+nivel+': '+JSON.stringify(a));
  const m=new MotorPvZ(a.nivel,a.opciones),piloto=crearPilotoPvZ();let finales=0;
  for(let pasos=0;pasos<60*1500&&!m.terminado;pasos++){piloto(m);m.paso();finales+=m.eventos.filter(e=>e.t==='fin').length;}
  if(m.terminado!=='gano')throw new Error('El piloto no ganó '+nivel+': '+m.terminado);
  const antes=localStorage.getItem(g.clave);control.fallar=fallarCuota;
  const confirmacion=g.confirmarResultado(a.partida,m.estado()),repetida=g.confirmarResultado(a.partida,m.estado());
  globalThis.__ensayo={g,a,m,control};
  return {nivel,tiempo:m.t,semillas:[...m.semillas],finales,confirmacion,repetida,progreso:g.progreso,siguiente:g.siguienteNivel,pendiente:g.pendiente,bloqueo:g.bloqueo,antes,texto:localStorage.getItem(g.clave),escrituras:control.escrituras,intentos:control.intentos,nueva:g.abrirNivel(g.siguienteNivel)};
 },{nivel,fallarCuota});
 const primera=await jugar('1-1');
 assert.equal(primera.finales,1);assert.deepEqual(primera.confirmacion,{ok:true,gano:true,aplicado:true,guardado:true});assert.equal(primera.repetida.aplicado,false);assert.equal(primera.escrituras,1);assert.equal(primera.intentos,1);assert.equal(primera.siguiente,'1-2');assert.deepEqual(primera.progreso.completados,['1-1']);assert.deepEqual(primera.progreso.plantasDesbloqueadas,['lanzaguisantes','girasol']);
 registrar('victoria legal 1-1 persiste una sola vez en localStorage',{tiempo:primera.tiempo,semillas:primera.semillas});
 await recargar();
 const primeraRecarga=await pagina.evaluate(()=>{const g=new globalThis.__pvz.GuardadoPvZ(localStorage);return {siguiente:g.siguienteNivel,progreso:g.progreso,texto:localStorage.getItem(g.clave),abierta:g.abrirNivel('1-2').ok};});
 assert.equal(primeraRecarga.siguiente,'1-2');assert.deepEqual(primeraRecarga.progreso,primera.progreso);assert.equal(primeraRecarga.texto,primera.texto);assert.equal(primeraRecarga.abierta,true);
 registrar('recargar la página conserva premio de 1-1 y habilita 1-2');
 const segunda=await jugar('1-2',true);
 assert.equal(segunda.finales,1);assert.deepEqual(segunda.confirmacion,{ok:true,gano:true,aplicado:true,guardado:false});assert.deepEqual(segunda.repetida,{ok:true,gano:true,aplicado:false,guardado:false});assert.equal(segunda.pendiente,true);assert.deepEqual(segunda.bloqueo,{motivo:'escritura'});assert.equal(segunda.texto,segunda.antes);assert.equal(segunda.escrituras,0);assert.equal(segunda.intentos,1);assert.deepEqual(segunda.nueva,{ok:false,motivo:'guardado'});assert.deepEqual(segunda.progreso.completados,['1-1','1-2']);
 registrar('victoria legal 1-2 con cuota fallida queda pendiente y bloquea una nueva partida',{tiempo:segunda.tiempo,semillas:segunda.semillas});
 const reintento=await pagina.evaluate(()=>{
  const {g,a,m,control}=globalThis.__ensayo;const fallaTodavia=g.reintentar();control.fallar=false;const recuperado=g.reintentar(),otraVez=g.reintentar(),repetida=g.confirmarResultado(a.partida,m.estado());
  return {fallaTodavia,recuperado,otraVez,repetida,pendiente:g.pendiente,bloqueo:g.bloqueo,progreso:g.progreso,siguiente:g.siguienteNivel,texto:localStorage.getItem(g.clave),escrituras:control.escrituras,intentos:control.intentos};
 });
 assert.equal(reintento.fallaTodavia,false);assert.equal(reintento.recuperado,true);assert.equal(reintento.otraVez,true);assert.equal(reintento.pendiente,false);assert.equal(reintento.bloqueo,null);assert.equal(reintento.escrituras,1);assert.equal(reintento.intentos,3);assert.deepEqual(reintento.repetida,{ok:true,gano:true,aplicado:false,guardado:true});assert.deepEqual(reintento.progreso,segunda.progreso);assert.equal(reintento.siguiente,'1-3');
 registrar('reintentar restaura la escritura sin repetir el premio de 1-2');
 await recargar();
 const segundaRecarga=await pagina.evaluate(()=>{const g=new globalThis.__pvz.GuardadoPvZ(localStorage);return {siguiente:g.siguienteNivel,progreso:g.progreso,abierta:g.abrirNivel('1-3').ok};});
 assert.equal(segundaRecarga.siguiente,'1-3');assert.deepEqual(segundaRecarga.progreso,reintento.progreso);assert.equal(segundaRecarga.abierta,true);assert.equal(new Set(segundaRecarga.progreso.plantasDesbloqueadas).size,segundaRecarga.progreso.plantasDesbloqueadas.length);
 registrar('segunda recarga conserva 1-3 desbloqueado y premios únicos');

 const perfiles=await pagina.evaluate(()=>{
  const {GuardadoPvZ}=globalThis.__pvz,parejaAntes=localStorage.getItem('pvz-v1'),amigo=new GuardadoPvZ(localStorage,{amigo:true});
  const siguienteAmigo=amigo.siguienteNivel,cambio=amigo.actualizarAjustes({musica:false}),amigoRecargado=new GuardadoPvZ(localStorage,{amigo:true});
  return {siguienteAmigo,cambio,amigo:amigoRecargado.progreso,parejaIntacta:localStorage.getItem('pvz-v1')===parejaAntes,parejaSiguiente:new GuardadoPvZ(localStorage).siguienteNivel,clasica:localStorage.getItem('jardin-v1'),clasicaAmigo:localStorage.getItem('amigo-jardin-v1'),claves:Object.keys(localStorage).sort()};
 });
 assert.equal(perfiles.siguienteAmigo,'1-1');assert.equal(perfiles.cambio,true);assert.equal(perfiles.amigo.ajustes.musica,false);assert.deepEqual(perfiles.amigo.completados,[]);assert.equal(perfiles.parejaIntacta,true);assert.equal(perfiles.parejaSiguiente,'1-3');assert.equal(perfiles.clasica,'clásica pareja intacta');assert.equal(perfiles.clasicaAmigo,'clásica amigos intacta');assert.deepEqual(perfiles.claves,['amigo-jardin-v1','amigo-pvz-v1','jardin-v1','pvz-v1']);
 registrar('perfil de amigos independiente y claves clásicas intactas');

 for(const [nombre,texto,motivo] of [
  ['JSON corrupto','{','json'],
  ['versión futura',JSON.stringify({version:99,monedas:91827,compras:{tesoro:true}}),'version']
 ]){
  const bloqueado=await pagina.evaluate(({texto})=>{
   const original=localStorage.getItem('pvz-v1');localStorage.setItem('pvz-v1',texto);
   const g=new globalThis.__pvz.GuardadoPvZ(localStorage),bloqueo=g.bloqueo,abrir=g.abrirNivel('1-1'),ajustes=g.actualizarAjustes({musica:false}),reintento=g.reintentar(),conservado=localStorage.getItem('pvz-v1');
   localStorage.setItem('pvz-v1',original);const recuperado=g.reintentar();return {bloqueo,abrir,ajustes,reintento,conservado,recuperado,siguiente:g.siguienteNivel};
  },{texto});
  assert.deepEqual(bloqueado.bloqueo,{motivo});assert.deepEqual(bloqueado.abrir,{ok:false,motivo:'guardado'});assert.equal(bloqueado.ajustes,false);assert.equal(bloqueado.reintento,false);assert.equal(bloqueado.conservado,texto);assert.equal(bloqueado.recuperado,true);assert.equal(bloqueado.siguiente,'1-3');
  registrar(nombre+' bloquea escrituras y conserva los bytes originales');
 }
 // Fixture literal de la edición publicada de diez niveles; no se fabrica con el catálogo actual.
 // Su lectura debe reconocer la antigua frontera sin escribir ni otorgar una victoria nocturna.
 const legado=await pagina.evaluate(()=>{
  const historico={
   version:1,nivelAlcanzado:'1-10',completados:['1-1','1-2','1-3','1-4','1-5','1-6','1-7','1-8','1-9','1-10'],
   plantasDesbloqueadas:['lanzaguisantes','girasol','petacereza','nuez','patatapum','hielaguisantes','planta-carnivora','repetidora','seta-desesporada','semilla-comprada'],
   objetos:['pala'],notas:['nota-1'],monedas:3210,compras:{'semilla-comprada':true,abono:2},ranuras:6,
   ajustes:{sonido:false,musica:false,velocidad:2},minijuegos:{completados:['bolos'],marcas:{bolos:15}},
   rompecabezas:{completados:[],marcas:{}},supervivencia:{completados:[],marcas:{}},fusion:{completados:[],marcas:{},descubiertas:[]},
  };
  const texto=JSON.stringify(historico),amigo=localStorage.getItem('amigo-pvz-v1'),control={escrituras:0};
  localStorage.setItem('pvz-v1',texto);
  const almacen={getItem:k=>localStorage.getItem(k),setItem(k,v){control.escrituras++;localStorage.setItem(k,v);}};
  const g=new globalThis.__pvz.GuardadoPvZ(almacen);
  globalThis.__ensayoNoche={g,control,historico,amigo};
  return {historico,progreso:g.progreso,siguiente:g.siguienteNivel,bloqueo:g.bloqueo,escrituras:control.escrituras,texto,conservado:localStorage.getItem('pvz-v1'),disponibles:g.disponibles()};
 });
 assert.equal(legado.bloqueo,null);assert.equal(legado.siguiente,'2-1');assert.equal(legado.progreso.nivelAlcanzado,'2-1');assert.deepEqual(legado.progreso.completados,legado.historico.completados);assert.equal(legado.progreso.completados.includes('2-1'),false);assert.equal(legado.progreso.plantasDesbloqueadas.includes('seta-solar'),false);assert.equal(legado.escrituras,0);assert.equal(legado.conservado,legado.texto);assert.equal(legado.disponibles.includes('seta-desesporada'),true);assert.equal(legado.disponibles.includes('semilla-comprada'),false);
 for(const k of ['plantasDesbloqueadas','objetos','notas','monedas','compras','ranuras','ajustes','minijuegos','rompecabezas','supervivencia','fusion'])assert.deepEqual(legado.progreso[k],legado.historico[k],k);
 registrar('guardado histórico 1-10 habilita noche sin escribir ni alterar compras o ajustes');

 const noche=await pagina.evaluate(()=>{
  const {MotorPvZ,crearPilotoPvZ,seleccionPilotoPvZ,NIVEL_PVZ}=globalThis.__pvz,{g,control,historico,amigo}=globalThis.__ensayoNoche;
  const disponibles=g.disponibles(),seleccion=seleccionPilotoPvZ(disponibles,NIVEL_PVZ['2-1']),a=g.abrirNivel('2-1',seleccion,23);
  if(!a.ok)throw new Error('No se pudo abrir 2-1: '+JSON.stringify(a));
  const m=new MotorPvZ(a.nivel,a.opciones),piloto=crearPilotoPvZ();let finales=0;
  for(let pasos=0;pasos<60*1500&&!m.terminado;pasos++){piloto(m);m.paso();finales+=m.eventos.filter(e=>e.t==='fin').length;}
  if(m.terminado!=='gano')throw new Error('El piloto no ganó 2-1: '+m.terminado);
  const confirmacion=g.confirmarResultado(a.partida,m.estado()),repetida=g.confirmarResultado(a.partida,m.estado());
  return {tiempo:m.t,seleccion,disponibles,finales,confirmacion,repetida,progreso:g.progreso,siguiente:g.siguienteNivel,escrituras:control.escrituras,texto:localStorage.getItem('pvz-v1'),amigoIntacto:localStorage.getItem('amigo-pvz-v1')===amigo,historico};
 });
 assert.equal(noche.finales,1);assert.ok(noche.seleccion.length<=6);assert.ok(noche.seleccion.every(id=>noche.disponibles.includes(id)));assert.deepEqual(noche.confirmacion,{ok:true,gano:true,aplicado:true,guardado:true});assert.deepEqual(noche.repetida,{ok:true,gano:true,aplicado:false,guardado:true});assert.equal(noche.escrituras,1);assert.equal(noche.siguiente,'2-2');assert.deepEqual(noche.progreso.completados,[...legado.historico.completados,'2-1']);assert.deepEqual(noche.progreso.plantasDesbloqueadas,[...legado.historico.plantasDesbloqueadas,'seta-solar']);assert.equal(noche.amigoIntacto,true);
 for(const k of ['objetos','notas','monedas','compras','ranuras','ajustes','minijuegos','rompecabezas','supervivencia','fusion'])assert.deepEqual(noche.progreso[k],legado.historico[k],k);
 registrar('victoria nocturna legal 2-1 guarda una vez conservando economía y ajustes',{tiempo:noche.tiempo,semillas:noche.seleccion});
 await recargar();
 const nocheRecarga=await pagina.evaluate(()=>{const g=new globalThis.__pvz.GuardadoPvZ(localStorage);return {siguiente:g.siguienteNivel,progreso:g.progreso,texto:localStorage.getItem('pvz-v1'),clasica:localStorage.getItem('jardin-v1'),clasicaAmigos:localStorage.getItem('amigo-jardin-v1')};});
 assert.equal(nocheRecarga.siguiente,'2-2');
 // La normalización coloca premios conocidos antes de extras comprados; los desbloqueos son un conjunto.
 assert.deepEqual({...nocheRecarga.progreso,plantasDesbloqueadas:[...nocheRecarga.progreso.plantasDesbloqueadas].sort()},{...noche.progreso,plantasDesbloqueadas:[...noche.progreso.plantasDesbloqueadas].sort()});assert.equal(nocheRecarga.texto,noche.texto);assert.equal(nocheRecarga.clasica,'clásica pareja intacta');assert.equal(nocheRecarga.clasicaAmigos,'clásica amigos intacta');
 registrar('recargar tras noche conserva 2-2 desbloqueado y partidas clásicas');

 // Forma que la edición de veinte niveles publicaba al terminar 2-10. Se conserva literal
 // para comprobar que añadir piscina no reinterpreta compras ni concede una victoria en 3-1.
 const legadoPiscina=await pagina.evaluate(()=>{
  const historico={
   version:1,nivelAlcanzado:'2-10',
   completados:['1-1','1-2','1-3','1-4','1-5','1-6','1-7','1-8','1-9','1-10','2-1','2-2','2-3','2-4','2-5','2-6','2-7','2-8','2-9','2-10'],
   plantasDesbloqueadas:['lanzaguisantes','girasol','petacereza','nuez','patatapum','hielaguisantes','planta-carnivora','repetidora','seta-desesporada','seta-solar','humoseta','comepiedras','hipnoseta','seta-miedica','seta-congelada','petaseta','nenufar','semilla-comprada'],
   objetos:['pala','almanaque'],notas:['nota-1','nota-2'],monedas:3210,compras:{'semilla-comprada':true,abono:2},ranuras:6,
   ajustes:{sonido:false,musica:false,velocidad:2},minijuegos:{completados:['bolos','aplastazombis'],marcas:{bolos:15,aplastazombis:127}},
   rompecabezas:{completados:[],marcas:{}},supervivencia:{completados:[],marcas:{}},fusion:{completados:[],marcas:{},descubiertas:[]},
  };
  const texto=JSON.stringify(historico),amigo=localStorage.getItem('amigo-pvz-v1'),control={escrituras:0};localStorage.setItem('pvz-v1',texto);
  const almacen={getItem:k=>localStorage.getItem(k),setItem(k,v){control.escrituras++;localStorage.setItem(k,v);}};
  const g=new globalThis.__pvz.GuardadoPvZ(almacen);globalThis.__ensayoPiscina={g,control,historico,amigo};
  return {historico,progreso:g.progreso,siguiente:g.siguienteNivel,bloqueo:g.bloqueo,escrituras:control.escrituras,texto,conservado:localStorage.getItem('pvz-v1'),disponibles:g.disponibles()};
 });
 assert.equal(legadoPiscina.bloqueo,null);assert.equal(legadoPiscina.siguiente,'3-1');assert.equal(legadoPiscina.progreso.nivelAlcanzado,'3-1');assert.deepEqual(legadoPiscina.progreso.completados,legadoPiscina.historico.completados);assert.equal(legadoPiscina.progreso.completados.includes('3-1'),false);assert.equal(legadoPiscina.progreso.plantasDesbloqueadas.includes('aplastaflor'),false);assert.equal(legadoPiscina.escrituras,0);assert.equal(legadoPiscina.conservado,legadoPiscina.texto);assert.equal(legadoPiscina.disponibles.includes('nenufar'),true);assert.equal(legadoPiscina.disponibles.includes('semilla-comprada'),false);
 for(const k of ['plantasDesbloqueadas','objetos','notas','monedas','compras','ranuras','ajustes','minijuegos','rompecabezas','supervivencia','fusion'])assert.deepEqual(legadoPiscina.progreso[k],legadoPiscina.historico[k],k);
 registrar('guardado histórico 2-10 habilita piscina sin escribir ni alterar economía o ajustes');

 const piscina=await pagina.evaluate(()=>{
  const {MotorPvZ,crearPilotoPvZ,seleccionPilotoPvZ,NIVEL_PVZ}=globalThis.__pvz,{g,control,historico,amigo}=globalThis.__ensayoPiscina;
  const disponibles=g.disponibles(),seleccion=seleccionPilotoPvZ(disponibles,NIVEL_PVZ['3-1']),a=g.abrirNivel('3-1',seleccion,23);
  if(!a.ok)throw new Error('No se pudo abrir 3-1: '+JSON.stringify(a));
  const m=new MotorPvZ(a.nivel,a.opciones),piloto=crearPilotoPvZ();let finales=0;
  for(let pasos=0;pasos<60*1500&&!m.terminado;pasos++){piloto(m);m.paso();finales+=m.eventos.filter(e=>e.t==='fin').length;}
  if(m.terminado!=='gano')throw new Error('El piloto no ganó 3-1: '+m.terminado);
  const confirmacion=g.confirmarResultado(a.partida,m.estado()),repetida=g.confirmarResultado(a.partida,m.estado());
  return {tiempo:m.t,seleccion,disponibles,finales,confirmacion,repetida,progreso:g.progreso,siguiente:g.siguienteNivel,escrituras:control.escrituras,texto:localStorage.getItem('pvz-v1'),amigoIntacto:localStorage.getItem('amigo-pvz-v1')===amigo,historico};
 });
 assert.equal(piscina.finales,1);assert.ok(piscina.seleccion.length<=6);assert.ok(piscina.seleccion.every(id=>piscina.disponibles.includes(id)));assert.ok(piscina.seleccion.includes('nenufar'));assert.deepEqual(piscina.confirmacion,{ok:true,gano:true,aplicado:true,guardado:true});assert.deepEqual(piscina.repetida,{ok:true,gano:true,aplicado:false,guardado:true});assert.equal(piscina.escrituras,1);assert.equal(piscina.siguiente,'3-2');assert.deepEqual(piscina.progreso.completados,[...legadoPiscina.historico.completados,'3-1']);assert.deepEqual(piscina.progreso.plantasDesbloqueadas,[...legadoPiscina.historico.plantasDesbloqueadas,'aplastaflor']);assert.equal(piscina.amigoIntacto,true);
 for(const k of ['objetos','notas','monedas','compras','ranuras','ajustes','minijuegos','rompecabezas','supervivencia','fusion'])assert.deepEqual(piscina.progreso[k],legadoPiscina.historico[k],k);
 registrar('victoria acuática legal 3-1 guarda una vez con Nenúfar y seis ranuras',{tiempo:piscina.tiempo,semillas:piscina.seleccion});
 await recargar();
 const piscinaRecarga=await pagina.evaluate(()=>{const g=new globalThis.__pvz.GuardadoPvZ(localStorage);return {siguiente:g.siguienteNivel,progreso:g.progreso,texto:localStorage.getItem('pvz-v1'),clasica:localStorage.getItem('jardin-v1'),clasicaAmigos:localStorage.getItem('amigo-jardin-v1')};});
 assert.equal(piscinaRecarga.siguiente,'3-2');
 assert.deepEqual({...piscinaRecarga.progreso,plantasDesbloqueadas:[...piscinaRecarga.progreso.plantasDesbloqueadas].sort()},{...piscina.progreso,plantasDesbloqueadas:[...piscina.progreso.plantasDesbloqueadas].sort()});assert.equal(piscinaRecarga.texto,piscina.texto);assert.equal(piscinaRecarga.clasica,'clásica pareja intacta');assert.equal(piscinaRecarga.clasicaAmigos,'clásica amigos intacta');
 registrar('recargar tras piscina conserva 3-2 desbloqueado y partidas clásicas');
 // Forma que la edición de treinta niveles publicaba al terminar 4-10. Se conserva literal
 // para comprobar que añadir niebla no reinterpreta compras ni concede una victoria en 4-1.
 const legadoNiebla=await pagina.evaluate(()=>{
  const historico={
   version:1,nivelAlcanzado:'3-10',
   completados:['1-1','1-2','1-3','1-4','1-5','1-6','1-7','1-8','1-9','1-10','2-1','2-2','2-3','2-4','2-5','2-6','2-7','2-8','2-9','2-10','3-1','3-2','3-3','3-4','3-5','3-6','3-7','3-8','3-9','3-10'],
   plantasDesbloqueadas:['lanzaguisantes','girasol','petacereza','nuez','patatapum','hielaguisantes','planta-carnivora','repetidora','seta-desesporada','seta-solar','humoseta','comepiedras','hipnoseta','seta-miedica','seta-congelada','petaseta','nenufar','aplastaflor','tripitidora','zampalga','jalapeno','pinchohierba','plantorcha','nuez-alta','marseta','semilla-comprada'],
   objetos:['pala','almanaque','llave-tienda'],notas:['nota-1','nota-2','nota-3'],monedas:3210,compras:{'semilla-comprada':true,abono:2},ranuras:6,
   ajustes:{sonido:false,musica:false,velocidad:2},minijuegos:{completados:['bolos','aplastazombis','minizombis'],marcas:{bolos:15,aplastazombis:127,minizombis:269}},
   rompecabezas:{completados:[],marcas:{}},supervivencia:{completados:[],marcas:{}},fusion:{completados:[],marcas:{},descubiertas:[]},
  };
  const texto=JSON.stringify(historico),amigo=localStorage.getItem('amigo-pvz-v1'),control={escrituras:0};localStorage.setItem('pvz-v1',texto);
  const almacen={getItem:k=>localStorage.getItem(k),setItem(k,v){control.escrituras++;localStorage.setItem(k,v);}};
  const g=new globalThis.__pvz.GuardadoPvZ(almacen);globalThis.__ensayoNiebla={g,control,historico,amigo};
  return {historico,progreso:g.progreso,siguiente:g.siguienteNivel,bloqueo:g.bloqueo,escrituras:control.escrituras,texto,conservado:localStorage.getItem('pvz-v1'),disponibles:g.disponibles()};
 });
 assert.equal(legadoNiebla.bloqueo,null);assert.equal(legadoNiebla.siguiente,'4-1');assert.equal(legadoNiebla.progreso.nivelAlcanzado,'4-1');assert.deepEqual(legadoNiebla.progreso.completados,legadoNiebla.historico.completados);assert.equal(legadoNiebla.progreso.completados.includes('4-1'),false);assert.equal(legadoNiebla.progreso.plantasDesbloqueadas.includes('planterna'),false);assert.equal(legadoNiebla.escrituras,0);assert.equal(legadoNiebla.conservado,legadoNiebla.texto);assert.equal(legadoNiebla.disponibles.includes('marseta'),true);assert.equal(legadoNiebla.disponibles.includes('semilla-comprada'),false);
 for(const k of ['plantasDesbloqueadas','objetos','notas','monedas','compras','ranuras','ajustes','minijuegos','rompecabezas','supervivencia','fusion'])assert.deepEqual(legadoNiebla.progreso[k],legadoNiebla.historico[k],k);
 registrar('guardado histórico 3-10 habilita niebla sin escribir ni alterar economía o ajustes');

 const niebla=await pagina.evaluate(()=>{
  const {MotorPvZ,crearPilotoPvZ,seleccionPilotoPvZ,NIVEL_PVZ}=globalThis.__pvz,{g,control,historico,amigo}=globalThis.__ensayoNiebla;
  const disponibles=g.disponibles(),seleccion=seleccionPilotoPvZ(disponibles,NIVEL_PVZ['4-1']),a=g.abrirNivel('4-1',seleccion,23);
  if(!a.ok)throw new Error('No se pudo abrir 4-1: '+JSON.stringify(a));
  const m=new MotorPvZ(a.nivel,a.opciones),piloto=crearPilotoPvZ();let finales=0;
  for(let pasos=0;pasos<60*1500&&!m.terminado;pasos++){piloto(m);m.paso();finales+=m.eventos.filter(e=>e.t==='fin').length;}
  if(m.terminado!=='gano')throw new Error('El piloto no ganó 4-1: '+m.terminado);
  const confirmacion=g.confirmarResultado(a.partida,m.estado()),repetida=g.confirmarResultado(a.partida,m.estado());
  return {tiempo:m.t,seleccion,disponibles,finales,confirmacion,repetida,progreso:g.progreso,siguiente:g.siguienteNivel,escrituras:control.escrituras,texto:localStorage.getItem('pvz-v1'),amigoIntacto:localStorage.getItem('amigo-pvz-v1')===amigo,historico};
 });
 assert.equal(niebla.finales,1);assert.ok(niebla.seleccion.length<=6);assert.ok(niebla.seleccion.every(id=>niebla.disponibles.includes(id)));assert.ok(niebla.seleccion.includes('marseta')||niebla.seleccion.includes('nenufar'));assert.deepEqual(niebla.confirmacion,{ok:true,gano:true,aplicado:true,guardado:true});assert.deepEqual(niebla.repetida,{ok:true,gano:true,aplicado:false,guardado:true});assert.equal(niebla.escrituras,1);assert.equal(niebla.siguiente,'4-2');assert.deepEqual(niebla.progreso.completados,[...legadoNiebla.historico.completados,'4-1']);assert.deepEqual(niebla.progreso.plantasDesbloqueadas,[...legadoNiebla.historico.plantasDesbloqueadas,'planterna']);assert.equal(niebla.amigoIntacto,true);
 for(const k of ['objetos','notas','monedas','compras','ranuras','ajustes','minijuegos','rompecabezas','supervivencia','fusion'])assert.deepEqual(niebla.progreso[k],legadoNiebla.historico[k],k);
 registrar('victoria legal de niebla 4-1 guarda una vez con seis ranuras y recursos del nivel',{tiempo:niebla.tiempo,semillas:niebla.seleccion});
 await recargar();
 const nieblaRecarga=await pagina.evaluate(()=>{const g=new globalThis.__pvz.GuardadoPvZ(localStorage);return {siguiente:g.siguienteNivel,progreso:g.progreso,texto:localStorage.getItem('pvz-v1'),clasica:localStorage.getItem('jardin-v1'),clasicaAmigos:localStorage.getItem('amigo-jardin-v1')};});
 assert.equal(nieblaRecarga.siguiente,'4-2');
 assert.deepEqual({...nieblaRecarga.progreso,plantasDesbloqueadas:[...nieblaRecarga.progreso.plantasDesbloqueadas].sort()},{...niebla.progreso,plantasDesbloqueadas:[...niebla.progreso.plantasDesbloqueadas].sort()});assert.equal(nieblaRecarga.texto,niebla.texto);assert.equal(nieblaRecarga.clasica,'clásica pareja intacta');assert.equal(nieblaRecarga.clasicaAmigos,'clásica amigos intacta');
 registrar('recargar tras niebla conserva 4-2 desbloqueado y partidas clásicas');
 assert.deepEqual(errores,[]);assert.deepEqual(peticionesExternas,[]);
 registrar('sin errores de página ni peticiones externas');
 completado=true;
 console.log('OK',resultados.length,'verificaciones de motor y persistencia en Chromium; sin aventura visual');
}catch(e){errores.push(String(e.stack??e));process.exitCode=1;console.error(e);}
finally{
 await context?.close().catch(()=>{});await browser?.close().catch(()=>{});
 if(servidor)await new Promise(ok=>servidor.close(ok));
 await writeFile(join(salida,'resultado.json'),JSON.stringify({ok:completado&&errores.length===0,alcance:'Contrato de MotorPvZ y GuardadoPvZ con localStorage real. Piloto legal en 1-1, 1-2, 2-1, 3-1 y 4-1; fronteras históricas de diez, veinte y treinta niveles, recargas y fallo de cuota inyectado en el adaptador. No carga ni acredita la aventura visual ni dispositivos físicos.',origen:origen??null,pruebas:resultados,errores,peticionesExternas},null,2));
}
