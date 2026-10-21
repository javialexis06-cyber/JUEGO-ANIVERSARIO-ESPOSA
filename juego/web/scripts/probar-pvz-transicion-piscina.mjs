/** Compatibilidad de la frontera nocturna publicada; no simula victorias del motor. */
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const tmp=await mkdtemp(join(tmpdir(),'pvz-transicion-piscina-')),resultados=[];
// Copia literal del formato publicado al completar veinte niveles. No se deriva del catálogo nuevo.
const HISTORICO={
 version:1,nivelAlcanzado:'2-10',
 completados:['1-1','1-2','1-3','1-4','1-5','1-6','1-7','1-8','1-9','1-10','2-1','2-2','2-3','2-4','2-5','2-6','2-7','2-8','2-9','2-10'],
 plantasDesbloqueadas:['lanzaguisantes','girasol','petacereza','nuez','patatapum','hielaguisantes','planta-carnivora','repetidora','seta-desesporada','seta-solar','humoseta','comepiedras','hipnoseta','seta-miedica','seta-congelada','petaseta','nenufar','semilla-comprada'],
 objetos:['pala','almanaque','objeto-comprado'],notas:['nota-1','nota-2','nota-comprada'],monedas:54321,
 compras:{'semilla-comprada':true,'objeto-comprado':2,'nota-comprada':1,abono:3,agotado:0,desactivado:false},ranuras:8,
 ajustes:{sonido:false,musica:false,velocidad:2},
 minijuegos:{completados:['bolos','aplastazombis'],marcas:{bolos:15,aplastazombis:127}},rompecabezas:{completados:['jarrones'],marcas:{jarrones:4}},
 supervivencia:{completados:[],marcas:{noche:12}},fusion:{completados:['garaje-1'],marcas:{'garaje-1':150},descubiertas:['guisante-nuez']},
};
try{
 const fichero=join(tmp,'transicion.mjs');
 await build({stdin:{contents:"export * from './src/jardin/pvz/guardado';export * from './src/jardin/pvz/datos/niveles';export * from './src/jardin/pvz/datos/plantas';",resolveDir:resolve(import.meta.dirname,'..')},outfile:fichero,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const {GuardadoPvZ,normalizarProgresoPvZ,progresoInicialPvZ,NIVELES_PVZ,PLANTAS_PVZ}=await import(pathToFileURL(fichero));
 const prueba=(nombre,fn)=>{fn();resultados.push({nombre,ok:true});console.log('OK',nombre);};
 const memoria=(inicial={})=>({datos:new Map(Object.entries(inicial)),lecturas:[],escrituras:[],fallaEscribir:false,getItem(k){this.lecturas.push(k);return this.datos.get(k)??null;},setItem(k,v){if(this.fallaEscribir)throw new Error('QuotaExceededError');this.escrituras.push({k,v});this.datos.set(k,v);}});
 const datosConservados=(actual,historico=HISTORICO)=>{
  for(const k of ['completados','plantasDesbloqueadas','objetos','notas','monedas','compras','ranuras','ajustes','minijuegos','rompecabezas','supervivencia','fusion'])assert.deepEqual(actual[k],historico[k],k);
  assert.equal(actual.nivelAlcanzado,'3-1');
 };
 prueba('catálogo de treinta niveles abre Nenúfar y reserva Marseta como premio futuro',()=>{
  assert.deepEqual(NIVELES_PVZ.map(n=>n.id),[1,2,3].flatMap(m=>Array.from({length:10},(_,i)=>m+'-'+(i+1))));
  assert.equal(NIVELES_PVZ.find(n=>n.id==='2-10').premio.planta,'nenufar');assert.equal(Object.hasOwn(PLANTAS_PVZ,'nenufar'),true);
  assert.equal(NIVELES_PVZ.find(n=>n.id==='3-10').premio.planta,'marseta');assert.equal(Object.hasOwn(PLANTAS_PVZ,'marseta'),false);
  const inicial=progresoInicialPvZ();assert.deepEqual(inicial.plantasDesbloqueadas,['lanzaguisantes']);assert.equal(inicial.nivelAlcanzado,'1-1');assert.deepEqual(inicial.completados,[]);
 });
 prueba('frontera nocturna literal avanza a 3-1 sin victorias ni premios acuáticos nuevos',()=>{
  const p=normalizarProgresoPvZ(structuredClone(HISTORICO));assert.notEqual(p,null);datosConservados(p);
  assert.equal(p.completados.includes('3-1'),false);assert.equal(p.plantasDesbloqueadas.includes('aplastaflor'),false);assert.equal(p.plantasDesbloqueadas.includes('marseta'),false);
  assert.deepEqual(normalizarProgresoPvZ({...structuredClone(HISTORICO),nivelAlcanzado:'3-1'}),p);
 });
 for(const amigo of [false,true])prueba('frontera 2-10 en '+(amigo?'amigos':'pareja')+' conserva claves, compras y bytes',()=>{
  const clave=amigo?'amigo-pvz-v1':'pvz-v1',otra=amigo?'pvz-v1':'amigo-pvz-v1',texto=JSON.stringify(HISTORICO),ajena=JSON.stringify(progresoInicialPvZ());
  const s=memoria({[clave]:texto,[otra]:ajena,'jardin-v1':'clásico pareja','amigo-jardin-v1':'clásico amigos'}),g=new GuardadoPvZ(s,{amigo});
  assert.equal(g.bloqueo,null);assert.equal(g.guardado,true);assert.equal(g.pendiente,false);assert.equal(g.siguienteNivel,'3-1');datosConservados(g.progreso);assert.equal(s.escrituras.length,0);assert.equal(s.datos.get(clave),texto);
  assert.equal(g.disponibles().includes('nenufar'),true);assert.equal(g.disponibles().includes('semilla-comprada'),false);assert.deepEqual(g.abrirNivel('3-2'),{ok:false,motivo:'bloqueado'});
  const a=g.abrirNivel('3-1',['nenufar','girasol','lanzaguisantes'],23);assert.equal(a.ok,true,JSON.stringify(a));assert.equal(a.nivel.area,'piscina');assert.deepEqual(a.opciones.semillas,['nenufar','girasol','lanzaguisantes']);assert.equal(g.abandonar(a.partida),true);datosConservados(g.progreso);assert.equal(s.escrituras.length,0);
  assert.equal(g.actualizarAjustes({musica:true}),true);assert.equal(s.escrituras.length,1);assert.equal(JSON.parse(s.datos.get(clave)).nivelAlcanzado,'3-1');
  const esperado={...structuredClone(HISTORICO),ajustes:{...HISTORICO.ajustes,musica:true}},recargado=new GuardadoPvZ(s,{amigo});datosConservados(recargado.progreso,esperado);assert.equal(recargado.siguienteNivel,'3-1');
  assert.equal(s.datos.get(otra),ajena);assert.equal(s.datos.get('jardin-v1'),'clásico pareja');assert.equal(s.datos.get('amigo-jardin-v1'),'clásico amigos');assert.ok(s.lecturas.every(k=>k===clave));assert.ok(s.escrituras.every(e=>e.k===clave));
 });
 prueba('una compra acuática antigua se registra sin adelantar la aventura ni duplicar semillas',()=>{
  const anterior=structuredClone(HISTORICO);anterior.compras.tripitidora=1;anterior.plantasDesbloqueadas.push('tripitidora');
  const texto=JSON.stringify(anterior),s=memoria({'pvz-v1':texto}),g=new GuardadoPvZ(s);
  assert.equal(g.bloqueo,null);assert.equal(g.siguienteNivel,'3-1');assert.equal(g.disponibles().includes('tripitidora'),true);datosConservados(g.progreso,anterior);assert.equal(s.datos.get('pvz-v1'),texto);assert.equal(s.escrituras.length,0);
  const a=g.abrirNivel('3-1',['nenufar','tripitidora'],23);assert.equal(a.ok,true,JSON.stringify(a));assert.equal(g.abandonar(a.partida),true);
  assert.equal(g.actualizarAjustes({musica:true}),true);const recargado=new GuardadoPvZ(s);assert.equal(recargado.disponibles().includes('tripitidora'),true);assert.equal(recargado.progreso.compras.tripitidora,1);assert.deepEqual(recargado.progreso.completados,anterior.completados);
 });
 prueba('cuota fallida en la primera escritura conserva la frontera y reintenta una sola vez',()=>{
  const texto=JSON.stringify(HISTORICO),s=memoria({'pvz-v1':texto}),g=new GuardadoPvZ(s);s.fallaEscribir=true;
  assert.equal(g.actualizarAjustes({sonido:true}),false);assert.equal(g.pendiente,true);assert.equal(g.guardado,false);assert.equal(g.bloqueo?.motivo,'escritura');assert.equal(g.abrirNivel('3-1').motivo,'guardado');assert.equal(s.datos.get('pvz-v1'),texto);
  s.fallaEscribir=false;assert.equal(g.reintentar(),true);assert.equal(g.reintentar(),true);assert.equal(s.escrituras.length,1);assert.equal(g.siguienteNivel,'3-1');datosConservados(new GuardadoPvZ(s).progreso,{...structuredClone(HISTORICO),ajustes:{...HISTORICO.ajustes,sonido:true}});
 });
 prueba('otra pestaña conserva su compra durante la primera escritura de la transición acuática',()=>{
  const texto=JSON.stringify(HISTORICO),s=memoria({'pvz-v1':texto}),g=new GuardadoPvZ(s),otra=structuredClone(HISTORICO);otra.monedas=60000;otra.compras.abono=4;s.datos.set('pvz-v1',JSON.stringify(otra));
  assert.equal(g.actualizarAjustes({musica:true}),false);assert.equal(g.bloqueo?.motivo,'conflicto');assert.equal(g.pendiente,true);assert.equal(g.reintentar(),false);assert.equal(s.datos.get('pvz-v1'),JSON.stringify(otra));assert.equal(s.escrituras.length,0);assert.equal(new GuardadoPvZ(s).progreso.monedas,60000);assert.equal(new GuardadoPvZ(s).progreso.compras.abono,4);assert.equal(new GuardadoPvZ(s).siguienteNivel,'3-1');
 });
 prueba('la excepción publicada no acepta huecos, fronteras distintas ni premios anticipados',()=>{
  const casos=[
   {...structuredClone(HISTORICO),nivelAlcanzado:'1-10'},
   {...structuredClone(HISTORICO),nivelAlcanzado:'2-9'},
   {...structuredClone(HISTORICO),nivelAlcanzado:'3-2'},
   {...structuredClone(HISTORICO),nivelAlcanzado:'2-9',completados:HISTORICO.completados.slice(0,19),plantasDesbloqueadas:HISTORICO.plantasDesbloqueadas.filter(id=>id!=='nenufar')},
   {...structuredClone(HISTORICO),completados:[...HISTORICO.completados.slice(0,18),'2-10']},
   {...structuredClone(HISTORICO),completados:[...HISTORICO.completados,'3-2']},
   {...structuredClone(HISTORICO),completados:[...HISTORICO.completados,'3-1']},
   {...structuredClone(HISTORICO),plantasDesbloqueadas:[...HISTORICO.plantasDesbloqueadas,'aplastaflor']},
  ];
  for(const raw of casos){const texto=JSON.stringify(raw),s=memoria({'pvz-v1':texto}),g=new GuardadoPvZ(s);assert.equal(g.bloqueo?.motivo,'estructura',texto);assert.equal(g.guardado,false);assert.equal(g.actualizarAjustes({musica:true}),false);assert.equal(g.abrirNivel('3-1').ok,false);assert.equal(g.reintentar(),false);assert.equal(s.escrituras.length,0);assert.equal(s.datos.get('pvz-v1'),texto);}
 });
 const salida=resolve(import.meta.dirname,'../test-results/pvz/transicion-piscina');await mkdir(salida,{recursive:true});await writeFile(join(salida,'resultado.json'),JSON.stringify({ok:true,pruebas:resultados},null,2));console.log('OK',resultados.length,'verificaciones de compatibilidad entre noche y piscina');
}finally{await rm(tmp,{recursive:true,force:true});}
