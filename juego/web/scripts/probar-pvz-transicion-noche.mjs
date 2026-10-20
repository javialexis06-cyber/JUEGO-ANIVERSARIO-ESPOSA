/** Compatibilidad de bytes publicados con el catálogo nuevo. No representa victorias jugadas. */
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const tmp=await mkdtemp(join(tmpdir(),'pvz-transicion-noche-')),resultados=[];
// Forma que escribía la edición de diez niveles: el último nivel alcanzado era 1-10.
// Es intencionalmente literal: no se construye a partir del catálogo que se está comprobando.
const HISTORICO={
 version:1,nivelAlcanzado:'1-10',completados:['1-1','1-2','1-3','1-4','1-5','1-6','1-7','1-8','1-9','1-10'],
 plantasDesbloqueadas:['lanzaguisantes','girasol','petacereza','nuez','patatapum','hielaguisantes','planta-carnivora','repetidora','seta-desesporada','semilla-comprada'],
 objetos:['pala','objeto-comprado'],notas:['nota-1','nota-comprada'],monedas:54321,
 compras:{'semilla-comprada':true,'objeto-comprado':2,'nota-comprada':1,abono:3,agotado:0,desactivado:false},ranuras:8,
 ajustes:{sonido:false,musica:false,velocidad:2},
 minijuegos:{completados:['bolos'],marcas:{bolos:15}},rompecabezas:{completados:['jarrones'],marcas:{jarrones:4}},
 supervivencia:{completados:[],marcas:{dia:12}},fusion:{completados:['garaje-1'],marcas:{'garaje-1':150},descubiertas:['guisante-nuez']},
};
try{
 const fichero=join(tmp,'transicion.mjs');
 await build({stdin:{contents:"export * from './src/jardin/pvz/guardado';export * from './src/jardin/pvz/datos/niveles';export * from './src/jardin/pvz/datos/plantas';",resolveDir:resolve(import.meta.dirname,'..')},outfile:fichero,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const {GuardadoPvZ,normalizarProgresoPvZ,progresoInicialPvZ,NIVELES_PVZ,PLANTAS_PVZ}=await import(pathToFileURL(fichero));
 const prueba=(nombre,fn)=>{fn();resultados.push({nombre,ok:true});console.log('OK',nombre);};
 const memoria=(inicial={})=>({datos:new Map(Object.entries(inicial)),lecturas:[],escrituras:[],fallaEscribir:false,getItem(k){this.lecturas.push(k);return this.datos.get(k)??null;},setItem(k,v){if(this.fallaEscribir)throw new Error('QuotaExceededError');this.escrituras.push({k,v});this.datos.set(k,v);}});
 const datosConservados=(actual,historico=HISTORICO)=>{
  for(const k of ['completados','plantasDesbloqueadas','objetos','notas','monedas','compras','ranuras','ajustes','minijuegos','rompecabezas','supervivencia','fusion'])assert.deepEqual(actual[k],historico[k],k);
  assert.equal(actual.nivelAlcanzado,'2-1');
 };
 prueba('catálogo consecutivo y premios de frontera sin desbloqueos prematuros',()=>{
  assert.deepEqual(NIVELES_PVZ.map(n=>n.id),[...Array.from({length:10},(_,i)=>'1-'+(i+1)),...Array.from({length:10},(_,i)=>'2-'+(i+1))]);
  assert.equal(NIVELES_PVZ.find(n=>n.id==='1-10').premio.planta,'seta-desesporada');
  assert.equal(Object.hasOwn(PLANTAS_PVZ,'seta-desesporada'),true);
  assert.equal(NIVELES_PVZ.find(n=>n.id==='2-10').premio.planta,'nenufar');
  assert.equal(Object.hasOwn(PLANTAS_PVZ,'nenufar'),false);
  const inicial=progresoInicialPvZ();assert.deepEqual(inicial.plantasDesbloqueadas,['lanzaguisantes']);assert.equal(inicial.nivelAlcanzado,'1-1');assert.deepEqual(inicial.completados,[]);
 });
 prueba('normalizar bytes de la entrega anterior avanza la frontera sin conceder una victoria',()=>{
  const p=normalizarProgresoPvZ(structuredClone(HISTORICO));assert.notEqual(p,null);datosConservados(p);
  assert.equal(p.completados.includes('2-1'),false);assert.equal(p.plantasDesbloqueadas.includes('seta-solar'),false);assert.equal(p.plantasDesbloqueadas.includes('nenufar'),false);
  const actual=normalizarProgresoPvZ({...structuredClone(HISTORICO),nivelAlcanzado:'2-1'});assert.deepEqual(actual,p);
 });
 for(const amigo of [false,true])prueba('carga histórica '+(amigo?'amigos':'pareja')+' conserva compras, perfiles y bytes hasta guardar',()=>{
  const clave=amigo?'amigo-pvz-v1':'pvz-v1',otra=amigo?'pvz-v1':'amigo-pvz-v1',texto=JSON.stringify(HISTORICO),ajena=JSON.stringify(progresoInicialPvZ());
  const s=memoria({[clave]:texto,[otra]:ajena,'jardin-v1':'clásico pareja','amigo-jardin-v1':'clásico amigos'}),g=new GuardadoPvZ(s,{amigo});
  assert.equal(g.bloqueo,null);assert.equal(g.guardado,true);assert.equal(g.pendiente,false);assert.equal(g.siguienteNivel,'2-1');datosConservados(g.progreso);assert.equal(s.escrituras.length,0);assert.equal(s.datos.get(clave),texto);
  assert.equal(g.disponibles().includes('seta-desesporada'),true);assert.equal(g.disponibles().includes('semilla-comprada'),false);assert.deepEqual(g.abrirNivel('2-2'),{ok:false,motivo:'bloqueado'});
  const a=g.abrirNivel('2-1',['seta-desesporada','girasol','nuez'],23);assert.equal(a.ok,true,JSON.stringify(a));assert.equal(a.nivel.area,'noche');assert.deepEqual(a.opciones.semillas,['seta-desesporada','girasol','nuez']);assert.equal(g.abandonar(a.partida),true);datosConservados(g.progreso);assert.equal(s.escrituras.length,0);
  assert.equal(g.actualizarAjustes({musica:true}),true);assert.equal(s.escrituras.length,1);assert.equal(JSON.parse(s.datos.get(clave)).nivelAlcanzado,'2-1');
  const esperado={...structuredClone(HISTORICO),ajustes:{...HISTORICO.ajustes,musica:true}},recargado=new GuardadoPvZ(s,{amigo});datosConservados(recargado.progreso,esperado);assert.equal(recargado.siguienteNivel,'2-1');
  assert.equal(s.datos.get(otra),ajena);assert.equal(s.datos.get('jardin-v1'),'clásico pareja');assert.equal(s.datos.get('amigo-jardin-v1'),'clásico amigos');assert.ok(s.lecturas.every(k=>k===clave));assert.ok(s.escrituras.every(e=>e.k===clave));
 });
 prueba('una semilla comprada antes de existir en el catálogo pasa a estar disponible sin adelantar la aventura',()=>{
  const anterior=structuredClone(HISTORICO);anterior.compras.humoseta=1;anterior.plantasDesbloqueadas.push('humoseta');
  const texto=JSON.stringify(anterior),s=memoria({'pvz-v1':texto}),g=new GuardadoPvZ(s);
  assert.equal(g.bloqueo,null);assert.equal(g.siguienteNivel,'2-1');assert.equal(g.disponibles().includes('humoseta'),true);datosConservados(g.progreso,anterior);
  assert.equal(s.datos.get('pvz-v1'),texto);assert.equal(s.escrituras.length,0);assert.equal(g.progreso.completados.includes('2-1'),false);
  const a=g.abrirNivel('2-1',['seta-desesporada','humoseta'],23);assert.equal(a.ok,true,JSON.stringify(a));assert.equal(g.abandonar(a.partida),true);
  assert.equal(g.actualizarAjustes({musica:true}),true);const recargado=new GuardadoPvZ(s);assert.equal(recargado.disponibles().includes('humoseta'),true);assert.equal(recargado.progreso.compras.humoseta,1);assert.deepEqual(recargado.progreso.completados,anterior.completados);
 });
 prueba('fallo al guardar la transición conserva progreso y reintenta sin repetir premios',()=>{
  const texto=JSON.stringify(HISTORICO),s=memoria({'pvz-v1':texto}),g=new GuardadoPvZ(s);s.fallaEscribir=true;
  assert.equal(g.actualizarAjustes({sonido:true}),false);assert.equal(g.pendiente,true);assert.equal(g.guardado,false);assert.equal(g.bloqueo?.motivo,'escritura');assert.equal(g.abrirNivel('2-1').motivo,'guardado');assert.equal(s.datos.get('pvz-v1'),texto);
  s.fallaEscribir=false;assert.equal(g.reintentar(),true);assert.equal(g.reintentar(),true);assert.equal(s.escrituras.length,1);assert.equal(g.siguienteNivel,'2-1');datosConservados(new GuardadoPvZ(s).progreso,{...structuredClone(HISTORICO),ajustes:{...HISTORICO.ajustes,sonido:true}});
 });
 prueba('otra pestaña conserva sus cambios durante la primera escritura de la frontera migrada',()=>{
  const texto=JSON.stringify(HISTORICO),s=memoria({'pvz-v1':texto}),g=new GuardadoPvZ(s),otra={...structuredClone(HISTORICO),monedas:60000};s.datos.set('pvz-v1',JSON.stringify(otra));
  assert.equal(g.actualizarAjustes({musica:true}),false);assert.equal(g.bloqueo?.motivo,'conflicto');assert.equal(g.pendiente,true);assert.equal(g.reintentar(),false);assert.equal(s.datos.get('pvz-v1'),JSON.stringify(otra));assert.equal(s.escrituras.length,0);assert.equal(new GuardadoPvZ(s).progreso.monedas,60000);assert.equal(new GuardadoPvZ(s).siguienteNivel,'2-1');
 });
 prueba('el caso histórico no acepta huecos, fronteras inventadas ni nuevas victorias',()=>{
  const casos=[
   {...structuredClone(HISTORICO),nivelAlcanzado:'1-9'},
   {...structuredClone(HISTORICO),nivelAlcanzado:'2-2'},
   {...structuredClone(HISTORICO),nivelAlcanzado:'1-9',completados:HISTORICO.completados.slice(0,9),plantasDesbloqueadas:HISTORICO.plantasDesbloqueadas.filter(id=>id!=='seta-desesporada')},
   {...structuredClone(HISTORICO),completados:[...HISTORICO.completados.slice(0,8),'1-10']},
   {...structuredClone(HISTORICO),completados:[...HISTORICO.completados,'2-2']},
   {...structuredClone(HISTORICO),completados:[...HISTORICO.completados,'2-1']},
   {...structuredClone(HISTORICO),plantasDesbloqueadas:[...HISTORICO.plantasDesbloqueadas,'seta-solar']},
  ];
  for(const raw of casos){const texto=JSON.stringify(raw),s=memoria({'pvz-v1':texto}),g=new GuardadoPvZ(s);assert.equal(g.bloqueo?.motivo,'estructura',texto);assert.equal(g.guardado,false);assert.equal(g.actualizarAjustes({musica:true}),false);assert.equal(g.abrirNivel('2-1').ok,false);assert.equal(g.reintentar(),false);assert.equal(s.escrituras.length,0);assert.equal(s.datos.get('pvz-v1'),texto);}
 });
 const salida=resolve(import.meta.dirname,'../test-results/pvz/transicion-noche');await mkdir(salida,{recursive:true});await writeFile(join(salida,'resultado.json'),JSON.stringify({ok:true,pruebas:resultados},null,2));console.log('OK',resultados.length,'verificaciones de compatibilidad entre día y noche');
}finally{await rm(tmp,{recursive:true,force:true});}
