/** Escenarios preparados del mundo 4: colisiones, fases, jarrones y visibilidad. */
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const temporal=await mkdtemp(join(tmpdir(),'pvz-reglas-niebla-')),resultados=[];
const salida=resolve(import.meta.dirname,'../test-results/pvz/reglas-niebla');let completo=false,errorFinal;
try{
 const fichero=join(temporal,'motor.mjs');
 await build({stdin:{contents:"export * from './src/jardin/pvz/motor/motor';export * from './src/jardin/pvz/datos/niebla';export * from './src/jardin/pvz/datos/niveles';",resolveDir:resolve(import.meta.dirname,'..')},outfile:fichero,bundle:true,format:'esm',platform:'node',logLevel:'silent'});
 const {MotorPvZ,NIVELES_NIEBLA,NIVELES_PVZ}=await import(pathToFileURL(fichero));
 const preparado=(nivel={},opciones={})=>new MotorPvZ({...NIVELES_NIEBLA[0],id:'prueba-reglas-niebla',solInicial:10000,emboscadaAgua:false,...nivel},{semillas:['nuez','calabaza','pinchohierba','planterna','plantorcha','lanzaguisantes','magnetoseta','nenufar','trebolador'],sinOleadas:true,...opciones});
 const pasos=(m,n)=>{const e=[];for(let i=0;i<n;i++){m.paso();e.push(...m.consumirEventos());}return e;};
 const pasar=(m,t)=>pasos(m,Math.ceil(t*60));
 const planta=(m,t,f,c)=>{assert.ok(m.plantar(t,f,c));return m.plantaEn(f,c,m.plantasDef[t].capa??'principal');};
 const prueba=(nombre,fn)=>{fn();resultados.push({nombre,ok:true});console.log('OK',nombre);};
 const puzzle=()=>new MotorPvZ(NIVELES_NIEBLA[4],{semilla:23,semillas:['petacereza']});
 prueba('cuarenta niveles hasta 4-10 (el tejado sigue después) y geometría propia de Rompejarrones y tormenta',()=>{
  assert.equal(NIVELES_PVZ.length,50);assert.equal(NIVELES_PVZ[39].id,'4-10');assert.equal(NIVELES_PVZ[40].id,'5-1');assert.equal(NIVELES_NIEBLA[4].area,'noche');assert.equal(NIVELES_NIEBLA[4].filas.length,5);
  assert.equal(NIVELES_NIEBLA[9].tormenta,true);assert.equal(NIVELES_NIEBLA[9].premio.planta,'coltapulta');
 });
 prueba('Planterna aclara 31 celdas, excluye esquinas y desaparece al morir',()=>{
  const m=preparado({filasAgua:[],niebla:4}),p=planta(m,'planterna',2,4);
  assert.equal(m.estado().niebla.claras.length,31);assert.equal(m.estaIluminado(0,1),false);assert.equal(m.estaIluminado(0,2),true);
  m.destruirPlanta(p);assert.equal(m.estado().niebla.claras.length,0);
 });
 prueba('Plantorcha aclara cinco celdas y los snapshots no cambian el terreno',()=>{
  const m=preparado({filasAgua:[]});planta(m,'plantorcha',2,4);const e=m.estado();assert.equal(e.niebla.claras.length,5);
  e.niebla.claras.length=0;assert.equal(m.estado().niebla.claras.length,5);assert.equal(m.estaIluminado(2,4),false,'La revelación de jarrones es propia de Planterna');
 });
 prueba('tormenta no crea niebla y su reloj es reproducible sin mutar al consultar',()=>{
  const n={...NIVELES_NIEBLA[9],zombis:[]},a=new MotorPvZ(n,{sinOleadas:true,semillas:[],semilla:108}),b=new MotorPvZ(n,{sinOleadas:true,semillas:[],semilla:108});
  assert.equal(a.estado().niebla,undefined);assert.equal(a.estado().tormenta.variante,2);
  for(let i=0;i<1200;i++){const antes=a.estado();assert.deepEqual(a.estado(),antes);a.paso();b.paso();}
  assert.deepEqual(a.estado(),b.estado());assert.ok(a.estado().tormenta.claridad>=0&&a.estado().tormenta.claridad<=1);
 });
 prueba('tormenta de variante uno conserva sus dos intensidades antes de volver a oscurecer',()=>{
  const m=new MotorPvZ({...NIVELES_NIEBLA[9],zombis:[]},{sinOleadas:true,semillas:[],semilla:23});
  for(let i=0;i<60*120&&!(m.estado().tormenta.variante===1&&m.estado().tormenta.restante<2.6&&m.estado().tormenta.restante>2.4);i++)m.paso();
  let t=m.estado().tormenta;assert.equal(t.variante,1);assert.ok(t.restante>2.4&&t.restante<2.6);assert.ok(Math.abs(t.claridad-(t.restante-1.5)/1.5)<1e-8);
  while(m.estado().tormenta.restante>1.1)m.paso();t=m.estado().tormenta;assert.equal(t.variante,1);assert.ok(Math.abs(t.claridad-t.restante/1.5*92/255)<1e-8);
 });
 prueba('globo tiene protección de veinte, evita disparos rectos y no activa el cortacésped',()=>{
  const m=preparado(),z=m.crearZombi('zombi-globo',0,-59);assert.ok(z);assert.equal(z.armadura,20);assert.equal(m.puedeRecibirProyectil(z),false);assert.equal(m.puedeRecibirProyectil(z,'recto',true),true);
  assert.equal(m.aplicarEstado(z,'congelado',3),false);pasar(m,.2);assert.equal(m.terminado,'perdio');assert.equal(m.cortacespedes[0].estado,'listo');
 });
 prueba('pinchar globo sobre agua hunde al enemigo y cuenta una muerte',()=>{
  const m=preparado(),z=m.crearZombi('zombi-globo',2,500);assert.ok(z);assert.ok(m.pincharGlobo(z));assert.equal(z.vida,0);assert.equal(m.eliminados,1);assert.equal(m.pincharGlobo(z),false);
 });
 prueba('cajita espera la apertura y destruye cubierta, planta y pinchos físicamente',()=>{
  const m=preparado({filasAgua:[]}),p=planta(m,'nuez',0,4),c=planta(m,'calabaza',0,4),s=planta(m,'pinchohierba',0,3),z=m.crearZombi('zombi-cajita',0,320);assert.ok(z);
  z.datos.temporizadorCaja=.01;pasos(m,1);assert.equal(z.datos.cajaAbriendo,1);assert.equal(p.vida,4000);pasar(m,1.1);
  assert.equal(p.vida,0);assert.equal(c.vida,0);assert.equal(s.vida,0);assert.equal(z.vida,0);
 });
 prueba('explosión hostil de caja no daña a otros hostiles y sí a hipnotizados',()=>{
  const m=preparado(),z=m.crearZombi('zombi-cajita',0,500),enemigo=m.crearZombi('zombi',0,505),aliado=m.crearZombi('zombi',0,510);assert.ok(z&&enemigo&&aliado);
  m.aplicarEstado(aliado,'hipnotizado');z.datos.temporizadorCaja=0;pasar(m,1.2);assert.equal(enemigo.vida,270);assert.equal(aliado.vida,0);
 });
 prueba('cajita hipnotizada conserva plantas y elimina a los enemigos cercanos',()=>{
  const m=preparado(),p=planta(m,'nuez',0,6),z=m.crearZombi('zombi-cajita',0,500),otro=m.crearZombi('zombi',0,505);assert.ok(z&&otro);m.aplicarEstado(z,'hipnotizado');z.datos.temporizadorCaja=0;pasar(m,1.2);assert.equal(otro.vida,0);assert.equal(p.vida,4000);
 });
 prueba('magnetismo retira la caja solo antes de abrirse',()=>{
  const m=preparado(),z=m.crearZombi('zombi-cajita',0,500),otro=m.crearZombi('zombi-cajita',1,500);assert.ok(z&&otro);assert.ok(m.quitarMetal(z));otro.datos.cajaAbriendo=1;assert.equal(m.quitarMetal(otro),false);assert.equal(z.vida,500);
 });
 prueba('minero excava bajo disparos y no recibe hielo antes de emerger',()=>{
  const m=preparado(),z=m.crearZombi('zombi-minero',0,500);assert.ok(z);assert.equal(m.puedeRecibirProyectil(z),false);assert.equal(m.aplicarEstado(z,'congelado',2),false);
  pasar(m,1);assert.ok(Math.abs(z.x-433)<1e-6);assert.equal(z.datos.pico,1);
 });
 prueba('minero emerge, espera su mareo y después camina hacia la derecha',()=>{
  const m=preparado(),z=m.crearZombi('zombi-minero',0,9);assert.ok(z);pasar(m,1.4);assert.equal(z.datos.bajoTierra,0);assert.equal(z.datos.reversa,1);const x=z.x;
  pasar(m,3);assert.equal(z.x,x);pasar(m,.7);assert.ok(z.x>x);assert.equal(m.terminado,'');
 });
 prueba('retirar el pico impone pausa y emergencia y conserva la marcha a la izquierda',()=>{
  const m=preparado(),z=m.crearZombi('zombi-minero',0,500);assert.ok(z);assert.ok(m.quitarMetal(z));pasar(m,3.2);assert.equal(z.x,500);pasar(m,.2);assert.equal(z.datos.bajoTierra,0);assert.ok(z.x<500);assert.equal(z.datos.reversa,undefined);
 });
 prueba('pogo recibe proyectiles y frío lento; muro alto y magnetismo quitan su herramienta',()=>{
  const m=preparado(),z=m.crearZombi('zombi-pogo',0,420);assert.ok(z);assert.equal(m.puedeRecibirProyectil(z),true);assert.equal(m.aplicarEstado(z,'congelado',3),false);assert.ok(m.aplicarEstado(z,'lento',3));assert.ok(m.quitarMetal(z));assert.equal(z.datos.pogo,0);assert.ok(m.aplicarEstado(z,'congelado',3));
  const b=preparado({}, {semillas:['nuez-alta']});planta(b,'nuez-alta',0,4);const p=b.crearZombi('zombi-pogo',0,410);pasar(b,.1);assert.equal(p.datos.pogo,0);pasar(b,2.5);assert.ok(b.plantaEn(0,4).vida<8000);
 });
 prueba('explosivos de área alcanzan al minero en el túnel sin cambiar daño ni casco',()=>{
  for(const tipo of['patatapum','petacereza','jalapeno','petaseta']){
   const m=preparado({filasAgua:[]},{semillas:[tipo]}),p=planta(m,tipo,0,3);if(tipo==='patatapum')pasar(m,14.1);
   const z=m.crearZombi('zombi-minero',0,p.x+20);assert.ok(z);pasar(m,tipo==='patatapum'?.1:1.3);assert.equal(z.vida,0,tipo);assert.equal(p.vida,0);
  }
 });
 prueba('Patatapum y Apisonaflor no alcanzan globos ni aplastan mineros ocultos por daño colateral',()=>{
  for(const tipo of['patatapum','aplastaflor']){
   const m=preparado({filasAgua:[]},{semillas:[tipo]}),p=planta(m,tipo,0,3);if(tipo==='patatapum')pasar(m,14.1);
   const aire=m.crearZombi('zombi-globo',0,p.x+20),tierra=m.crearZombi('zombi',0,p.x+20);assert.ok(aire&&tierra);aire.datos.velocidad=0;
   const minero=tipo==='aplastaflor'?m.crearZombi('zombi-minero',0,p.x+20):null;if(minero)minero.datos.velocidad=0;
   pasar(m,2);assert.equal(tierra.vida,0);assert.equal(aire.vida,270);assert.equal(aire.armadura,20);if(minero){assert.equal(minero.vida,270);assert.equal(minero.armadura,100);}
  }
 });
 prueba('hipnotizar al minero que regresa invierte su marcha sin atacar plantas',()=>{
  const m=preparado({filasAgua:[]}),z=m.crearZombi('zombi-minero',0,9);assert.ok(z);pasar(m,5);assert.equal(z.datos.reversa,1);
  assert.ok(m.aplicarEstado(z,'hipnotizado'));const x=z.x;pasar(m,1);assert.ok(z.x<x);assert.equal(z.sentido,-1);assert.equal(m.terminado,'');
 });
 prueba('la caja que ya se abre no se congela ni prolonga el instante de explosión',()=>{
  const m=preparado(),z=m.crearZombi('zombi-cajita',0,500);assert.ok(z);z.datos.temporizadorCaja=0;pasos(m,1);assert.equal(z.datos.cajaAbriendo,1);assert.equal(m.aplicarEstado(z,'congelado',10),false);pasar(m,1.1);assert.equal(z.vida,0);
 });
 prueba('jarrones iniciales ocultan su contenido y bloquean siembra sin cobrar',()=>{
  const m=puzzle();assert.equal(m.jarrones.length,15);assert.ok(m.jarrones.every(j=>j.contenido===undefined));const j=m.jarrones[0],antes=m.estado();assert.equal(m.plantar('petacereza',j.fila,j.col),false);assert.deepEqual(m.estado(),antes);
  assert.equal(m.romperJarron(-1),false);assert.equal(m.sembrarPremioJarron('nuez',0,0),null);const e=m.estado();e.jarrones.length=0;assert.equal(m.jarrones.length,15);
 });
 prueba('Planterna revela solo sus jarrones cercanos y las copias no permiten editar el premio',()=>{
  const m=new MotorPvZ({...NIVELES_NIEBLA[4],solInicial:100},{semilla:23,semillas:['planterna']});const p=planta(m,'planterna',0,5),visibles=m.jarrones.filter(j=>j.contenido);
  assert.ok(visibles.length>0&&visibles.length<m.jarrones.length);assert.ok(visibles.every(j=>m.estaIluminado(j.fila,j.col)));
  const j=visibles[0],original=structuredClone(j.contenido);j.contenido.planta='semilla-inventada';assert.deepEqual(m.jarrones.find(q=>q.id===j.id).contenido,original);
  m.destruirPlanta(p);assert.ok(m.jarrones.every(j=>!j.contenido));
 });
 prueba('la caja sorpresa abre exactamente los jarrones de su celda y ocho vecinas',()=>{
  const m=puzzle(),z=m.crearZombi('zombi-cajita',2,600);assert.ok(z);const vecinos=m.jarrones.filter(j=>Math.abs(j.fila-2)<=1&&Math.abs(j.col-7)<=1).map(j=>j.id),otros=m.jarrones.filter(j=>!vecinos.includes(j.id)).map(j=>j.id);
  z.datos.temporizadorCaja=0;pasar(m,1.2);assert.ok(vecinos.every(id=>!m.jarrones.some(j=>j.id===id)));assert.ok(otros.every(id=>m.jarrones.some(j=>j.id===id)));
 });
 prueba('sobre de jarrón se usa una vez y solo en una casilla válida sin coste ni recarga',()=>{
  const m=puzzle();for(const j of [...m.jarrones]){m.romperJarron(j.id);if(m.sobres.length)break;}
  const s=m.sobres[0];assert.ok(s);const j=m.jarrones[0],antes=m.estado();assert.equal(m.plantarSobre(s.id,j.fila,j.col),false);assert.deepEqual(m.estado(),antes);
  assert.ok(m.plantarSobre(s.id,0,0));assert.equal(m.plantarSobre(s.id,0,1),false);assert.equal(m.sol,0);assert.equal(m.recargas[s.planta],undefined);
 });
 prueba('sobres sin usar caducan después de quince segundos',()=>{
  const m=puzzle();for(const j of [...m.jarrones]){m.romperJarron(j.id);if(m.sobres.length)break;}const s=m.sobres[0];assert.ok(s);pasar(m,15.1);assert.ok(!m.sobres.some(q=>q.id===s.id));
 });
 prueba('Rompejarrones crea tres etapas, espera cinco segundos y emite una victoria',()=>{
  const m=puzzle();let finales=0;
  for(const [indice,cantidad]of[15,20,25].entries()){
   assert.equal(m.etapaJarrones,indice+1);assert.equal(m.jarrones.length,cantidad);assert.equal(m.jarrones.filter(j=>j.verde).length,[0,2,3][indice]);
   for(const j of [...m.jarrones])m.romperJarron(j.id);for(const z of [...m.zombis])m.danarZombi(z,z.vida+z.armadura,'aplastar');
   const e=pasos(m,1);finales+=e.filter(e=>e.t==='fin').length;
   if(indice<2){assert.equal(m.terminado,'');pasar(m,4.9);assert.equal(m.etapaJarrones,indice+1);pasar(m,.2);}
  }
  assert.equal(m.terminado,'gano');assert.equal(finales,1);const e=m.estado();m.paso();assert.deepEqual(m.estado(),e);
 });
 completo=true;console.log('OK',resultados.length,'reglas de terreno y enemigos de Niebla');
}catch(e){errorFinal=String(e?.stack??e);throw e;}finally{await mkdir(salida,{recursive:true});await writeFile(join(salida,'resultado.json'),JSON.stringify({ok:completo,pruebas:resultados,error:errorFinal},null,2));await rm(temporal,{recursive:true,force:true});}
