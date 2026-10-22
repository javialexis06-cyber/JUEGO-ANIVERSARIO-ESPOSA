/** Progreso nuevo: almacenamiento simulado, perfiles aislados y campaña real con piloto legal. */
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const tmp=await mkdtemp(join(tmpdir(),'pvz-guardado-')),resultados=[],salida=resolve(import.meta.dirname,'../test-results/pvz/guardado');let fallo=null;
try{
 const fichero=join(tmp,'guardado.mjs');
 await build({stdin:{contents:"export * from './src/jardin/pvz/guardado';export * from './src/jardin/pvz/motor/motor';export * from './src/jardin/pvz/motor/bot';export * from './src/jardin/pvz/datos/niveles';export * from './src/jardin/pvz/datos/plantas';",resolveDir:resolve(import.meta.dirname,'..')},outfile:fichero,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 for(const k of ['window','document','localStorage'])Object.defineProperty(globalThis,k,{get(){throw new Error('Importación dependiente del navegador: '+k);},configurable:true});
 const {GuardadoPvZ,normalizarProgresoPvZ,progresoInicialPvZ,claveGuardadoPvZ,MotorPvZ,crearPilotoPvZ,seleccionPilotoPvZ,NIVELES_PVZ,PLANTAS_PVZ}=await import(pathToFileURL(fichero));
 for(const k of ['window','document','localStorage'])delete globalThis[k];
 const prueba=(nombre,fn)=>{fn();resultados.push({nombre,ok:true});console.log('OK',nombre);};
 const memoria=(inicial={})=>({datos:new Map(Object.entries(inicial)),lecturas:[],escrituras:[],fallaLeer:false,fallaEscribir:false,getItem(k){this.lecturas.push(k);if(this.fallaLeer)throw new Error('Lectura no disponible');return this.datos.get(k)??null;},setItem(k,v){if(this.fallaEscribir)throw new Error('QuotaExceededError');this.escrituras.push({k,v});this.datos.set(k,v);}});
 const abrir=(g,id='1-1',seleccion)=>{const r=g.abrirNivel(id,seleccion,23);assert.equal(r.ok,true,JSON.stringify(r));return r;};
 // Estos finales preparados solo prueban el contrato de persistencia, no acreditan una victoria del motor.
 const final=(a,terminado='gano')=>({...new MotorPvZ(a.nivel,a.opciones).estado(),terminado});
 prueba('importación sin navegador, claves nuevas y perfil inicial sin recursos gratuitos',()=>{
  const s=memoria({'jardin-v1':'original','amigo-jardin-v1':'amigos'}),g=new GuardadoPvZ(s);
  assert.equal(claveGuardadoPvZ(),'pvz-v1');assert.equal(claveGuardadoPvZ(true),'amigo-pvz-v1');assert.deepEqual(s.lecturas,['pvz-v1']);assert.equal(s.escrituras.length,0);assert.equal(g.progreso.monedas,0);assert.equal(g.progreso.ranuras,6);assert.deepEqual(g.disponibles(),['lanzaguisantes']);assert.equal(g.siguienteNivel,'1-1');assert.equal(g.bloqueo,null);
 });
 prueba('niveles consecutivos y semillas válidas, sin desbloqueos al abrir',()=>{
  const g=new GuardadoPvZ(memoria());assert.deepEqual(g.abrirNivel('1-2'),{ok:false,motivo:'bloqueado'});assert.equal(g.abrirNivel('desconocido').ok,false);
  for(const sel of [['girasol'],['__proto__'],['constructor'],['lanzaguisantes','lanzaguisantes'],[],new Array(1),null,'lanzaguisantes'])assert.equal(g.abrirNivel('1-1',sel).ok,false);
  for(const semilla of [NaN,Infinity,0.5,Number.MAX_SAFE_INTEGER+1])assert.equal(g.abrirNivel('1-1',undefined,semilla).ok,false);
  const a=abrir(g);assert.equal(g.abrirNivel('1-1').motivo,'partida-activa');assert.deepEqual(g.disponibles(),['lanzaguisantes']);assert.equal(a.opciones.abono,undefined);assert.equal(a.opciones.sinOleadas,undefined);assert.equal(g.abandonar({...a.partida}),false);assert.equal(g.abandonar(a.partida),true);assert.equal(g.siguienteNivel,'1-1');
 });
 prueba('derrota no concede premios ni escribe y los resultados inválidos no cierran partida',()=>{
  const s=memoria(),g=new GuardadoPvZ(s),a=abrir(g),antes=g.progreso;
  for(const e of [final(a,''),{...final(a),nivel:'1-2'},{...final(a),version:2},{...final(a),t:Infinity},{...final(a),sol:-1},Object.create(final(a))])assert.equal(g.confirmarResultado(a.partida,e).ok,false);
  assert.equal(g.confirmarResultado({...a.partida},final(a)).ok,false);assert.deepEqual(g.progreso,antes);
  const r=g.confirmarResultado(a.partida,final(a,'perdio'));assert.deepEqual(r,{ok:true,gano:false,aplicado:false,guardado:true});assert.deepEqual(g.progreso,antes);assert.equal(s.escrituras.length,0);assert.equal(g.confirmarResultado(a.partida,final(a)).aplicado,false);assert.equal(g.siguienteNivel,'1-1');
 });
 prueba('cada premio se concede una vez, repetir nivel y resultado es idempotente',()=>{
  const s=memoria(),g=new GuardadoPvZ(s),a=abrir(g),e=final(a);
  assert.equal(g.confirmarResultado(a.partida,e).aplicado,true);assert.deepEqual(g.disponibles(),['lanzaguisantes','girasol']);const guardado=s.datos.get('pvz-v1');
  assert.equal(g.confirmarResultado(a.partida,e).aplicado,false);assert.equal(s.escrituras.length,1);assert.equal(s.datos.get('pvz-v1'),guardado);
  const otra=abrir(g);assert.equal(g.confirmarResultado(otra.partida,final(otra)).aplicado,false);assert.equal(s.escrituras.length,1);assert.deepEqual(g.progreso.completados,['1-1']);
 });
 prueba('fallo de cuota conserva victoria, bloquea nuevas partidas y reintenta sin duplicar premios',()=>{
  const s=memoria(),g=new GuardadoPvZ(s),a=abrir(g);s.fallaEscribir=true;
  assert.deepEqual(g.confirmarResultado(a.partida,final(a)),{ok:true,gano:true,aplicado:true,guardado:false});assert.equal(g.pendiente,true);assert.equal(g.bloqueo.motivo,'escritura');assert.equal(g.progreso.nivelAlcanzado,'1-2');assert.equal(g.abrirNivel('1-2').motivo,'guardado');assert.equal(g.actualizarAjustes({musica:false}),false);assert.equal(g.reintentar(),false);
  assert.deepEqual(g.confirmarResultado(a.partida,final(a)),{ok:true,gano:true,aplicado:false,guardado:false});s.fallaEscribir=false;assert.equal(g.reintentar(),true);assert.equal(g.reintentar(),true);assert.equal(g.pendiente,false);assert.equal(g.bloqueo,null);assert.equal(s.escrituras.length,1);assert.deepEqual(new GuardadoPvZ(s).progreso,g.progreso);assert.equal(new GuardadoPvZ(s).siguienteNivel,'1-2');
 });
 prueba('lectura bloqueada se recupera sin escribir ni reiniciar',()=>{
  const p=progresoInicialPvZ();p.monedas=700;const s=memoria({'pvz-v1':JSON.stringify(p)});s.fallaLeer=true;const g=new GuardadoPvZ(s);assert.equal(g.bloqueo.motivo,'lectura');assert.equal(g.abrirNivel('1-1').ok,false);assert.equal(g.reintentar(),false);s.fallaLeer=false;assert.equal(g.reintentar(),true);assert.equal(g.progreso.monedas,700);assert.equal(s.escrituras.length,0);
 });
 prueba('JSON roto, versiones desconocidas y estructuras corruptas nunca se sobrescriben',()=>{
  for(const texto of ['{',JSON.stringify({version:2,monedas:99999}),JSON.stringify({version:0}),JSON.stringify([]),JSON.stringify(null),JSON.stringify({version:1,monedas:-10}),'{"version":1,"monedas":1e400}',JSON.stringify({version:1,compras:[]}),JSON.stringify({version:1,completados:'1-1'}),JSON.stringify({version:1,completados:['2-1']})]){
   const s=memoria({'pvz-v1':texto}),g=new GuardadoPvZ(s);assert.notEqual(g.bloqueo,null);assert.equal(g.abrirNivel('1-1').ok,false);assert.equal(g.actualizarAjustes({sonido:false}),false);assert.equal(g.reintentar(),false);assert.equal(s.datos.get('pvz-v1'),texto);assert.equal(s.escrituras.length,0);
   s.datos.set('pvz-v1',JSON.stringify({...progresoInicialPvZ(),monedas:777}));assert.equal(g.reintentar(),true);assert.equal(g.progreso.monedas,777);assert.equal(s.escrituras.length,0);
  }
 });
 prueba('normalización ignora herencia y claves peligrosas, exige prefijo de victorias y números finitos',()=>{
  const raw=JSON.parse('{"version":1,"completados":["1-1","1-1",3,"constructor"],"plantasDesbloqueadas":["girasol"],"nivelAlcanzado":"1-2","compras":{"mejora":true,"abono":2,"__proto__":99,"constructor":3},"ajustes":{"sonido":false,"musica":true,"velocidad":99},"minijuegos":{"completados":["bolos","__proto__"],"marcas":{"bolos":12,"constructor":99,"otro":1e400}}}');
  const p=normalizarProgresoPvZ(raw);assert.deepEqual(p.completados,['1-1']);assert.equal(p.nivelAlcanzado,'1-2');assert.deepEqual(p.plantasDesbloqueadas,['lanzaguisantes','girasol']);assert.deepEqual(p.compras,{mejora:true,abono:2});assert.equal(p.ajustes.velocidad,1);assert.deepEqual(p.minijuegos,{completados:['bolos'],marcas:{bolos:12}});assert.equal({}.contaminado,undefined);
  const huecos=new Array(1);Object.setPrototypeOf(huecos,{0:'1-1'});assert.deepEqual(normalizarProgresoPvZ({version:1,completados:huecos}).completados,[]);
  const heredado=Object.create({version:1,monedas:999});assert.equal(normalizarProgresoPvZ(heredado),null);
  const propio=Object.assign(Object.create({monedas:999,compras:{otra:true}}),{version:1});assert.equal(normalizarProgresoPvZ(propio).monedas,0);
  for(const valor of [NaN,Infinity,-1,0.5,Number.MAX_SAFE_INTEGER+1])assert.equal(normalizarProgresoPvZ({...progresoInicialPvZ(),monedas:valor}),null);
 });
 prueba('victorias conocidas fuera del prefijo no se borran al cambiar ajustes o reintentar',()=>{
  for(const completados of [['1-3'],['1-1','1-3'],['1-2','1-1','1-4'],['1-10']]){
   const p=progresoInicialPvZ();p.completados=completados;const texto=JSON.stringify(p),s=memoria({'pvz-v1':texto}),g=new GuardadoPvZ(s);
   assert.equal(g.bloqueo?.motivo,'estructura',completados.join(','));assert.equal(g.guardado,false);assert.equal(g.pendiente,false);assert.equal(g.abrirNivel('1-1').motivo,'guardado');assert.equal(g.actualizarAjustes({musica:false}),false);assert.equal(g.reintentar(),false);assert.equal(s.datos.get('pvz-v1'),texto);assert.equal(s.escrituras.length,0);
  }
  const p=normalizarProgresoPvZ({version:1,completados:['1-2','1-1','1-2'],nivelAlcanzado:'1-3'});assert.deepEqual(p.completados,['1-1','1-2']);assert.equal(p.nivelAlcanzado,'1-3');
 });
 prueba('nivel alcanzado incoherente, desconocido o de otro tipo se conserva sin inventar victorias',()=>{
  for(const nivelAlcanzado of ['1-5','2-1','desconocido','',null,7,false,{},[]]){
   const p=progresoInicialPvZ();p.nivelAlcanzado=nivelAlcanzado;const texto=JSON.stringify(p),s=memoria({'pvz-v1':texto}),g=new GuardadoPvZ(s);
   assert.equal(g.bloqueo?.motivo,'estructura',JSON.stringify(nivelAlcanzado));assert.equal(g.guardado,false);assert.equal(g.actualizarAjustes({sonido:false}),false);assert.equal(g.reintentar(),false);assert.equal(s.datos.get('pvz-v1'),texto);assert.equal(s.escrituras.length,0);assert.deepEqual(g.progreso.completados,[]);
  }
  const p=progresoInicialPvZ();p.completados=['1-1'];p.nivelAlcanzado='1-1';const texto=JSON.stringify(p),s=memoria({'pvz-v1':texto}),g=new GuardadoPvZ(s);assert.equal(g.bloqueo?.motivo,'estructura');assert.equal(g.actualizarAjustes({musica:false}),false);assert.equal(g.reintentar(),false);assert.equal(s.datos.get('pvz-v1'),texto);assert.equal(s.escrituras.length,0);
  assert.equal(normalizarProgresoPvZ({version:1,completados:['1-1']}).nivelAlcanzado,'1-2');assert.equal(normalizarProgresoPvZ({version:1,nivelAlcanzado:undefined}),null);
 });
 prueba('monedas, compras, ranuras, modos y ajustes válidos sobreviven victorias y recargas',()=>{
  const p=progresoInicialPvZ();p.monedas=123456;p.compras={ranura:true,abono:2,paquete:0};p.ranuras=10;p.ajustes={sonido:false,musica:false,velocidad:2};p.minijuegos={completados:['bolos'],marcas:{bolos:20}};p.rompecabezas={completados:['jarrones'],marcas:{jarrones:3}};p.supervivencia={completados:[],marcas:{dia:8}};p.fusion={completados:['garaje-1'],marcas:{'garaje-1':200},descubiertas:['guisante-nuez']};
  const s=memoria({'pvz-v1':JSON.stringify(p)}),g=new GuardadoPvZ(s),a=abrir(g);assert.equal(g.confirmarResultado(a.partida,final(a)).guardado,true);const r=new GuardadoPvZ(s).progreso;
  for(const k of ['monedas','compras','ranuras','ajustes','minijuegos','rompecabezas','supervivencia','fusion'])assert.deepEqual(r[k],p[k],k);
  assert.equal(g.actualizarAjustes({velocidad:1}),true);assert.equal(new GuardadoPvZ(s).progreso.ajustes.velocidad,1);assert.equal(g.actualizarAjustes({velocidad:3}),false);assert.equal(g.actualizarAjustes({sonido:'si'}),false);
 });
 prueba('desbloqueos extra acreditados por compras se conservan sin inventar premios',()=>{
  const p=progresoInicialPvZ();p.monedas=987;p.compras={repetidora:true,'semilla-futura':2,'objeto-tienda':1,'nota-tienda':true,'sin-desbloqueo':1,agotado:0,negado:false};p.plantasDesbloqueadas.push('repetidora','semilla-futura');p.objetos.push('objeto-tienda');p.notas.push('nota-tienda');
  const s=memoria({'pvz-v1':JSON.stringify(p)}),g=new GuardadoPvZ(s);assert.deepEqual(g.disponibles(),['lanzaguisantes','repetidora']);assert.equal(g.progreso.plantasDesbloqueadas.includes('sin-desbloqueo'),false);
  const a=abrir(g);assert.equal(g.confirmarResultado(a.partida,final(a)).guardado,true);assert.equal(g.actualizarAjustes({musica:false}),true);const r=new GuardadoPvZ(s).progreso;
  assert.deepEqual(r.plantasDesbloqueadas,['lanzaguisantes','girasol','repetidora','semilla-futura']);assert.deepEqual(r.objetos,p.objetos);assert.deepEqual(r.notas,p.notas);assert.deepEqual(r.compras,p.compras);assert.equal(r.monedas,p.monedas);assert.equal(r.plantasDesbloqueadas.includes('sin-desbloqueo'),false);assert.equal(r.plantasDesbloqueadas.includes('agotado'),false);
 });
 prueba('un extra sin premio o compra positiva bloquea en lugar de borrarlo',()=>{
  for(const k of ['plantasDesbloqueadas','objetos','notas'])for(const compra of [undefined,0,false]){
   const p=progresoInicialPvZ();p[k].push('extra-conservado');if(compra!==undefined)p.compras['extra-conservado']=compra;
   const texto=JSON.stringify(p),s=memoria({'pvz-v1':texto}),g=new GuardadoPvZ(s);assert.equal(g.bloqueo?.motivo,'estructura',k+' '+compra);assert.equal(g.guardado,false);assert.equal(g.reintentar(),false);assert.equal(g.actualizarAjustes({sonido:false}),false);assert.equal(s.datos.get('pvz-v1'),texto);assert.equal(s.escrituras.length,0);
  }
 });
 prueba('campos futuros en raíz, ajustes y modos quedan intactos y bloquean escrituras',()=>{
  for(const cambiar of [p=>{p.otraEntrega={monedas:200};},p=>{p.ajustes.subtitulos=true;},p=>{p.minijuegos.premios=['trofeo'];},p=>{p.rompecabezas.semilla=99;},p=>{p.supervivencia.rondas=30;},p=>{p.fusion.nuevasReglas={nivel:3};}]){
   const p=progresoInicialPvZ();cambiar(p);const texto=JSON.stringify(p),s=memoria({'pvz-v1':texto}),g=new GuardadoPvZ(s);assert.equal(g.bloqueo?.motivo,'estructura');assert.equal(g.guardado,false);assert.equal(g.pendiente,false);assert.equal(g.reintentar(),false);assert.equal(g.abrirNivel('1-1').motivo,'guardado');assert.equal(s.datos.get('pvz-v1'),texto);assert.equal(s.escrituras.length,0);
  }
 });
 prueba('formatos desconocidos de compras no se convierten en economía vacía',()=>{
  for(const valor of ['dos',null,-1,0.5,[],{cantidad:2}]){
   const p=progresoInicialPvZ();p.compras.repetidora=valor;const texto=JSON.stringify(p),s=memoria({'pvz-v1':texto}),g=new GuardadoPvZ(s);assert.equal(g.bloqueo?.motivo,'estructura');assert.equal(g.reintentar(),false);assert.equal(s.datos.get('pvz-v1'),texto);assert.equal(s.escrituras.length,0);
  }
 });
 prueba('dos pestañas no pisan las victorias de la primera y un duplicado sigue pendiente',()=>{
  const s=memoria(),primera=new GuardadoPvZ(s),segunda=new GuardadoPvZ(s),a=abrir(primera),b=abrir(segunda);assert.equal(primera.confirmarResultado(a.partida,final(a)).guardado,true);const guardado=s.datos.get('pvz-v1');
  assert.deepEqual(segunda.confirmarResultado(b.partida,final(b)),{ok:true,gano:true,aplicado:true,guardado:false});assert.equal(segunda.bloqueo?.motivo,'conflicto');assert.equal(segunda.pendiente,true);assert.deepEqual(segunda.confirmarResultado(b.partida,final(b)),{ok:true,gano:true,aplicado:false,guardado:false});assert.equal(segunda.reintentar(),false);assert.equal(s.datos.get('pvz-v1'),guardado);assert.equal(s.escrituras.length,1);assert.equal(segunda.progreso.completados.length,1);assert.equal(segunda.abrirNivel('1-2').motivo,'guardado');
 });
 prueba('una compra de otra pestaña se conserva ante ajustes obsoletos',()=>{
  const s=memoria(),g=new GuardadoPvZ(s),p=progresoInicialPvZ();p.monedas=1000;p.compras.repetidora=true;p.plantasDesbloqueadas.push('repetidora');const ajeno=JSON.stringify(p);s.datos.set('pvz-v1',ajeno);
  assert.equal(g.actualizarAjustes({musica:false}),false);assert.equal(g.bloqueo?.motivo,'conflicto');assert.equal(g.pendiente,true);assert.equal(g.progreso.ajustes.musica,false);assert.equal(g.reintentar(),false);assert.equal(s.datos.get('pvz-v1'),ajeno);assert.equal(s.escrituras.length,0);assert.equal(new GuardadoPvZ(s).progreso.monedas,1000);
 });
 prueba('duplicados de resultados ya aplicados reflejan fallos posteriores al comprobar la escritura',()=>{
  const s=memoria(),g=new GuardadoPvZ(s),a=abrir(g);g.confirmarResultado(a.partida,final(a));s.fallaLeer=true;assert.equal(g.actualizarAjustes({musica:false}),false);assert.equal(g.pendiente,true);assert.equal(g.guardado,false);assert.deepEqual(g.confirmarResultado(a.partida,final(a)),{ok:true,gano:true,aplicado:false,guardado:false});assert.equal(g.reintentar(),false);
  s.fallaLeer=false;assert.equal(g.reintentar(),true);assert.equal(g.guardado,true);assert.deepEqual(g.confirmarResultado(a.partida,final(a)),{ok:true,gano:true,aplicado:false,guardado:true});assert.equal(s.escrituras.length,2);assert.equal(new GuardadoPvZ(s).progreso.ajustes.musica,false);assert.deepEqual(g.progreso.completados,['1-1']);
 });
 prueba('perfiles separados y claves clásicas intactas',()=>{
  const s=memoria({'jardin-v1':'campaña clásica','amigo-jardin-v1':'clásica amigos'}),pareja=new GuardadoPvZ(s),amigos=new GuardadoPvZ(s,{amigo:true});const a=abrir(pareja);pareja.confirmarResultado(a.partida,final(a));assert.equal(amigos.siguienteNivel,'1-1');assert.equal(amigos.actualizarAjustes({musica:false}),true);assert.equal(new GuardadoPvZ(s).siguienteNivel,'1-2');assert.equal(new GuardadoPvZ(s,{amigo:true}).progreso.ajustes.musica,false);assert.equal(s.datos.get('jardin-v1'),'campaña clásica');assert.equal(s.datos.get('amigo-jardin-v1'),'clásica amigos');assert.ok(s.lecturas.concat(s.escrituras.map(e=>e.k)).every(k=>['pvz-v1','amigo-pvz-v1'].includes(k)));
 });
 prueba('no serializa ni reanuda partida en curso y las copias no alteran progreso interno',()=>{
  const s=memoria(),g=new GuardadoPvZ(s),a=abrir(g);const p=g.progreso;p.monedas=999;p.plantasDesbloqueadas.push('repetidora');a.nivel.premio.planta='repetidora';a.opciones.semillas.push('girasol');assert.equal(g.progreso.monedas,0);assert.deepEqual(g.disponibles(),['lanzaguisantes']);assert.equal(s.escrituras.length,0);assert.equal(new GuardadoPvZ(s).partidaActiva,null);assert.equal(g.confirmarResultado(a.partida,final({...a,nivel:NIVELES_PVZ[0],opciones:{semillas:['lanzaguisantes']}})).ok,true);assert.ok(!Object.hasOwn(JSON.parse(s.datos.get('pvz-v1')),'partida'));assert.deepEqual(g.progreso.plantasDesbloqueadas,['lanzaguisantes','girasol']);
 });
 prueba('otra pestaña o versión nueva no queda sobrescrita por una victoria pendiente',()=>{
  const s=memoria(),g=new GuardadoPvZ(s),a=abrir(g),futuro=JSON.stringify({version:2,monedas:5000});s.datos.set('pvz-v1',futuro);assert.equal(g.confirmarResultado(a.partida,final(a)).guardado,false);assert.equal(g.bloqueo.motivo,'conflicto');assert.equal(g.reintentar(),false);assert.equal(s.datos.get('pvz-v1'),futuro);assert.equal(s.escrituras.length,0);assert.equal(g.progreso.completados.length,1);
 });
 prueba('secuencia completa con recargas, premios únicos, cinta sin selección y siguiente nivel pendiente',()=>{
  const s=memoria();let g=new GuardadoPvZ(s);
  for(const n of NIVELES_PVZ){
   assert.equal(g.siguienteNivel,n.id);assert.equal(g.progreso.plantasDesbloqueadas.includes(n.premio?.planta),false);
   if(n.cinta)assert.equal(g.abrirNivel(n.id,['lanzaguisantes']).ok,false);
   const a=abrir(g,n.id),r=g.confirmarResultado(a.partida,final(a));assert.equal(r.aplicado,true);assert.equal(r.guardado,true);assert.equal(g.confirmarResultado(a.partida,final(a)).aplicado,false);g=new GuardadoPvZ(s);
   if(n.premio?.planta)assert.equal(g.progreso.plantasDesbloqueadas.includes(n.premio.planta),true);
   if(n.id==='1-10'){assert.equal(g.siguienteNivel,'2-1');assert.equal(g.disponibles().includes('seta-desesporada'),true);assert.equal(g.progreso.completados.includes('2-1'),false);}
   if(n.id==='2-10'){assert.equal(g.siguienteNivel,'3-1');assert.equal(g.disponibles().includes('nenufar'),true);assert.equal(g.progreso.completados.includes('3-1'),false);}
  }
  assert.deepEqual(g.progreso.completados,NIVELES_PVZ.map(n=>n.id));assert.deepEqual(g.progreso.objetos,[...new Set(NIVELES_PVZ.map(n=>n.premio?.objeto).filter(Boolean))]);assert.deepEqual(g.progreso.notas,[...new Set(NIVELES_PVZ.map(n=>n.premio?.nota).filter(Boolean))]);assert.equal(g.siguienteNivel,null);assert.equal(g.progreso.plantasDesbloqueadas.includes('seta-desesporada'),true);assert.equal(g.disponibles().includes('seta-desesporada'),Object.hasOwn(PLANTAS_PVZ,'seta-desesporada'));assert.equal(g.progreso.monedas,0);assert.equal(s.escrituras.length,NIVELES_PVZ.length);assert.equal(g.progreso.plantasDesbloqueadas.includes('nenufar'),true);assert.equal(g.disponibles().includes('nenufar'),true);assert.equal(g.progreso.plantasDesbloqueadas.includes('marseta'),true);assert.equal(g.disponibles().includes('marseta'),true);assert.equal(g.progreso.plantasDesbloqueadas.includes('coltapulta'),true);assert.equal(g.disponibles().includes('coltapulta'),false);
 });
 // Acredita también el recorrido real del contrato abrir -> MotorPvZ -> ganar -> guardar -> recargar.
 const s=memoria();let g=new GuardadoPvZ(s);
 for(const n of NIVELES_PVZ){
  const seleccion=['noche','piscina','niebla'].includes(n.area)&&!n.cinta&&!n.semillas?seleccionPilotoPvZ(g.disponibles(),n):undefined;
  const a=abrir(g,n.id,seleccion),m=new MotorPvZ(a.nivel,a.opciones),piloto=crearPilotoPvZ();
  for(let pasos=0;pasos<60*1500&&!m.terminado;pasos++){piloto(m);m.paso();}
  assert.equal(m.terminado,'gano',n.id+' partida real con selección desbloqueada');assert.equal(g.confirmarResultado(a.partida,m.estado()).guardado,true);g=new GuardadoPvZ(s);
  resultados.push({nombre:'campaña real y guardado '+n.id,ok:true,t:m.t,semillas:[...m.semillas]});console.log('OK campaña real y guardado',n.id,Math.round(m.t)+'s');
 }
 console.log('OK',resultados.length,'verificaciones del progreso y guardado de PvZ');
}catch(error){fallo=String(error.stack??error);throw error;}
finally{
 try{await mkdir(salida,{recursive:true});await writeFile(join(salida,'resultado.json'),JSON.stringify({ok:fallo===null,pruebas:resultados,...(fallo===null?{}:{error:fallo})},null,2));}
 finally{await rm(tmp,{recursive:true,force:true});}
}
