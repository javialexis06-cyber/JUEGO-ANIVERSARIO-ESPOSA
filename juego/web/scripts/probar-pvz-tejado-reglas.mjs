/** Tejado (mundo 5): escenarios preparados con el motor real; sin arte, interfaz ni partidas del usuario. */
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const temporal=await mkdtemp(join(tmpdir(),'pvz-tejado-')),resultados=[];
const salida=resolve(import.meta.dirname,'../test-results/pvz/tejado-reglas');let completo=false,errorFinal;
try{
 const modulo=join(temporal,'motor.mjs');
 await build({stdin:{contents:"export * from './src/jardin/pvz/motor/motor';export * from './src/jardin/pvz/datos/tejado';export * from './src/jardin/pvz/datos/plantas';export * from './src/jardin/pvz/datos/zombis';export * from './src/jardin/pvz/datos/niveles';export * from './src/jardin/pvz/guardado';",resolveDir:resolve(import.meta.dirname,'..')},outfile:modulo,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const {MotorPvZ,PLANTAS_TEJADO,ZOMBIS_TEJADO,NIVELES_TEJADO,PLANTAS_PVZ,ZOMBIS_PVZ,NIVEL_PVZ,NIVELES_PVZ,GuardadoPvZ,progresoInicialPvZ}=await import(pathToFileURL(modulo));
 const quieto={...ZOMBIS_PVZ.zombi,id:'blanco-preparado',vida:10000,velocidad:0,mordida:0};
 const caminante={...ZOMBIS_PVZ.zombi,id:'caminante-preparado',vida:10000};
 const escudado={...ZOMBIS_PVZ.zombi,id:'escudo-preparado',vida:10000,velocidad:0,mordida:0,armadura:{tipo:'escudo',vida:1100,metal:true}};
 const extra={[quieto.id]:quieto,[caminante.id]:caminante,[escudado.id]:escudado};
 const nivelBase={id:'prueba-tejado',parte:1,area:'tejado',filas:[0,1,2,3,4],solInicial:10000,sinSolCielo:true,zombis:[],banderas:1,tipo:'normal',sinCortacespedes:true};
 const preparado=(semillas,nivel={},opciones={})=>new MotorPvZ({...nivelBase,...nivel},{sinOleadas:true,semillas,semilla:23,...opciones},{zombis:{...ZOMBIS_PVZ,...extra}});
 const prueba=(nombre,fn)=>{fn();resultados.push({nombre,ok:true});console.log('OK',nombre);};
 const pasos=(m,n)=>{const eventos=[];for(let i=0;i<n&&!m.terminado;i++){m.paso();eventos.push(...m.consumirEventos());}return eventos;};
 const segundos=(m,s)=>pasos(m,Math.ceil(s*60));
 const conMaceta=(m,t,f,c)=>{assert.ok(m.plantar('maceta',f,c),`maceta en ${f}:${c}`);m.recargas.maceta=0;const ok=m.plantar(t,f,c);assert.ok(ok,`siembra ${t} en ${f}:${c}`);m.recargas[t]=0;return m.plantaEn(f,c,PLANTAS_PVZ[t].capa??'principal');};
 const blanco=(m,f,x,id=quieto.id)=>{const z=m.crearZombi(id,f,x);assert.ok(z);return z;};

 prueba('ocho plantas del tejado con costes, recargas y capas de la primera aventura',()=>{
  assert.deepEqual(PLANTAS_TEJADO.map(p=>p.id),['coltapulta','maceta','lanzamaiz','grano-cafe','ajo','paraplanta','margarita','melonpulta']);
  assert.deepEqual(PLANTAS_TEJADO.map(p=>p.sol),[100,25,100,75,50,100,50,300]);
  assert.deepEqual(PLANTAS_TEJADO.map(p=>p.recarga),[7.5,7.5,7.5,7.5,7.5,7.5,30,7.5]);
  assert.equal(PLANTAS_PVZ.maceta.capa,'base');assert.equal(PLANTAS_PVZ['grano-cafe'].capa,'temporal');assert.equal(PLANTAS_PVZ.ajo.vida,400);
  assert.deepEqual(ZOMBIS_TEJADO.map(z=>[z.id,z.vida]),[['zombi-colgado',450],['zombi-escalera',500],['zombi-catapulta',850],['gargantua',3000],['diablillo',270],['dr-zomboid',40000]]);
 });
 prueba('diez niveles del tejado: oleadas, macetas iniciales y sin cortacéspedes',()=>{
  assert.deepEqual(NIVELES_TEJADO.map(n=>n.id),Array.from({length:10},(_,i)=>`5-${i+1}`));
  assert.deepEqual(NIVELES_TEJADO.map(n=>n.banderas),[1,2,2,3,2,2,3,2,3,0]);
  for(const [id,columnas] of [['5-1',5],['5-2',4],['5-3',3]]){const m=new MotorPvZ(NIVEL_PVZ[id],{semilla:1,semillas:['lanzaguisantes']});
   assert.equal(m.plantas.filter(p=>p.tipo==='maceta').length,columnas*5);assert.equal(m.cortacespedes.length,0);assert.equal(m.sembradas,0);}
  assert.equal(NIVEL_PVZ['4-10'].premio.planta,'coltapulta');
 });
 prueba('en el tejado toda planta necesita maceta; la Pinchohierba no cabe',()=>{
  const m=preparado(['lanzaguisantes','maceta','pinchohierba']);
  assert.equal(m.plantar('lanzaguisantes',2,3),false);assert.ok(m.plantar('maceta',2,3));m.recargas.maceta=0;
  assert.equal(m.plantar('maceta',2,3),false,'una sola maceta por casilla');
  assert.equal(m.plantar('pinchohierba',2,3),false);assert.ok(m.plantar('lanzaguisantes',2,3));
 });
 prueba('la pendiente detiene los guisantes de las dos primeras columnas',()=>{
  const m=preparado(['lanzaguisantes','maceta']),cerca=blanco(m,1,250),lejos=blanco(m,0,500);
  conMaceta(m,'lanzaguisantes',0,0);conMaceta(m,'lanzaguisantes',1,2);
  assert.equal(m.proyectiles.length,0);segundos(m,6);
  assert.ok(lejos.vida===10000,'el tiro de la columna 0 choca con el tejado antes de x=500');
  const m2=preparado(['lanzaguisantes','maceta']),z2=blanco(m2,1,250);conMaceta(m2,'lanzaguisantes',1,0);segundos(m2,3);assert.ok(z2.vida<10000,'antes del choque sí impacta');
  void cerca;
 });
 prueba('Coltapulta lanza por encima del escudo y daña al cuerpo',()=>{
  const m=preparado(['coltapulta','maceta']),z=blanco(m,2,600,escudado.id),p=conMaceta(m,'coltapulta',2,1);p.datos.reloj=0;
  segundos(m,1.3);assert.equal(z.vida,10000-40);assert.equal(z.armadura,1100);
 });
 prueba('Lanzamaíz alterna granos y mantequilla que inmoviliza cuatro segundos',()=>{
  const m=preparado(['lanzamaiz','maceta']),z=blanco(m,2,600),p=conMaceta(m,'lanzamaiz',2,1);let manteca=0,grano=0;
  for(let i=0;i<40;i++){p.datos.reloj=0;const ev=segundos(m,1.25);manteca+=ev.filter(e=>e.t==='disparo'&&e.proyectil==='mantequilla').length;grano+=ev.filter(e=>e.t==='disparo'&&e.proyectil==='maiz').length;}
  assert.ok(manteca>0&&grano>manteca,`granos ${grano}, mantequilla ${manteca}`);
  const m2=preparado(['lanzamaiz','maceta']),c=blanco(m2,2,500,caminante.id);m2.lanzar(conMaceta(m2,'lanzamaiz',2,1),c,40,'mantequilla',1.2,'lanzado',4);m2.quitar(2,1);
  segundos(m2,1.25);const x=c.x;assert.ok(c.mantequilla>3.5);segundos(m2,3);assert.equal(c.x,x);segundos(m2,1.5);assert.ok(c.x<x);
 });
 prueba('Melonpulta: 80 al blanco y un tercio a los vecinos de carriles contiguos',()=>{
  const m=preparado(['melonpulta','maceta']),z=blanco(m,2,600),arriba=blanco(m,1,620),lejos=blanco(m,0,600),p=conMaceta(m,'melonpulta',2,1);p.datos.reloj=0;
  segundos(m,1.3);assert.equal(z.vida,10000-80);assert.equal(arriba.vida,10000-26);assert.equal(lejos.vida,10000);
 });
 prueba('Grano de café solo va sobre un hongo dormido y lo despierta en dos segundos',()=>{
  const m=preparado(['grano-cafe','maceta','seta-desesporada']);assert.ok(m.plantar('maceta',2,2));
  assert.equal(m.plantar('grano-cafe',2,2),false);assert.ok(m.plantar('seta-desesporada',2,2));const h=m.plantaEn(2,2);assert.ok(h.dormida);
  assert.ok(m.plantar('grano-cafe',2,2));segundos(m,1.9);assert.ok(h.dormida);segundos(m,.3);assert.equal(h.dormida,false);assert.equal(m.plantaEn(2,2,'temporal'),undefined);
 });
 prueba('Ajo: quien lo muerde cambia de carril a los 1,7 s y nunca sale del tablero',()=>{
  const m=preparado(['ajo','maceta']),a=conMaceta(m,'ajo',0,3),z=blanco(m,0,a.x+30,caminante.id);
  segundos(m,1);assert.equal(z.fila,0);segundos(m,1.2);assert.equal(z.fila,1,'solo puede bajar desde el carril 0');assert.ok(a.vida>300&&a.vida<400);
 });
 prueba('Colgado: baja, espera tres segundos y se lleva la planta; la Paraplanta lo rechaza',()=>{
  const m=preparado(['lanzaguisantes','maceta','paraplanta']),p=conMaceta(m,'lanzaguisantes',2,4);
  const b=m.crearZombi('zombi-colgado',0,780);assert.equal(b.datos.objFila,2);assert.equal(b.datos.objCol,4);
  segundos(m,3.7);assert.equal(b.datos.fase,1);segundos(m,.3);assert.equal(b.datos.fase,2);segundos(m,3.6);assert.equal(p.vida,0,'planta robada');
  const m2=preparado(['lanzaguisantes','maceta','paraplanta']),q=conMaceta(m2,'lanzaguisantes',2,4);conMaceta(m2,'paraplanta',3,5);
  const b2=m2.crearZombi('zombi-colgado',0,780);segundos(m2,10);assert.ok(q.vida>0,'protegida por la Paraplanta');assert.equal(b2.vida,0);assert.equal(m2.eliminados,0);
 });
 prueba('Colgado abajo recibe guisantes; si muere no roba',()=>{
  const m=preparado(['lanzaguisantes','maceta','nuez']),n=conMaceta(m,'nuez',2,6);
  const b=m.crearZombi('zombi-colgado',0,780);assert.equal(b.datos.objCol,6);for(const c of [2,3])conMaceta(m,'lanzaguisantes',2,c);b.vida=40;segundos(m,8);assert.ok(n.vida>0);assert.equal(m.eliminados,1);
 });
 prueba('Zombi escalera apoya su escalera en la Nuez; los demás trepan y el imán la retira',()=>{
  const m=preparado(['nuez','maceta','magnetoseta']),n=conMaceta(m,'nuez',2,3),e=blanco(m,2,n.x+30,'zombi-escalera');
  segundos(m,1.2);assert.ok(n.datos.escalera);assert.equal(e.armadura,0);const x0=e.x;segundos(m,1.5);assert.ok(e.x<n.x-30&&e.x<x0,'trepa por encima');
  const z=blanco(m,2,n.x+25,caminante.id);segundos(m,.2);assert.equal(z.datos.saltando>m.t,true);
  const m2=preparado(['nuez','maceta','magnetoseta'],{nocturno:true}),n2=conMaceta(m2,'nuez',2,3);n2.datos.escalera=1;conMaceta(m2,'magnetoseta',1,1);segundos(m2,.2);assert.equal(n2.datos.escalera,undefined);
 });
 prueba('Catapulta lanza a la planta más lejana; la Paraplanta para el balón; sin balones aplasta',()=>{
  const m=preparado(['lanzaguisantes','maceta','paraplanta']),lejos=conMaceta(m,'girasol'in m.plantasDef?'lanzaguisantes':'lanzaguisantes',2,1),c=blanco(m,2,640,'zombi-catapulta');
  c.datos.velocidad=0;segundos(m,2);assert.equal(lejos.vida,300-75);
  const m2=preparado(['lanzaguisantes','maceta','paraplanta']),q=conMaceta(m2,'lanzaguisantes',2,1);conMaceta(m2,'paraplanta',1,1);const c2=blanco(m2,2,640,'zombi-catapulta');c2.datos.velocidad=0;segundos(m2,7);assert.equal(q.vida,300);
  const m3=preparado(['lanzaguisantes','maceta']),r=conMaceta(m3,'lanzaguisantes',2,7),c3=blanco(m3,2,640,'zombi-catapulta');c3.datos.balones=0;segundos(m3,3);assert.equal(r.vida,0);
 });
 prueba('Gargantúa aplasta la casilla entera y lanza al diablillo bajo la mitad de vida',()=>{
  const m=preparado(['lanzaguisantes','maceta']),p=conMaceta(m,'lanzaguisantes',2,4),g=blanco(m,2,p.x+30,'gargantua');
  segundos(m,1.4);assert.equal(p.vida,0);assert.equal(m.plantaEn(2,4,'base'),undefined,'la maceta también');
  const m2=preparado([]),g2=blanco(m2,1,700,'gargantua');g2.vida=1400;segundos(m2,.7);const imp=m2.zombis.find(z=>z.tipo==='diablillo');assert.ok(imp);assert.ok(imp.x<g2.x);
  assert.equal(m2.puedeRecibirProyectil(imp),false,'en el aire no recibe tiros');segundos(m2,2);assert.equal(m2.puedeRecibirProyectil(imp),true);void g;
 });
 prueba('Margarita produce monedas que no cuentan como sol',()=>{
  const m=preparado(['margarita','maceta']);conMaceta(m,'margarita',2,2);const sol=m.sol;segundos(m,13);
  const monedas=m.soles.filter(s=>s.origen==='moneda');assert.equal(monedas.length,1);assert.ok([10,50].includes(monedas[0].valor));
  assert.ok(m.recoger(monedas[0].id));assert.equal(m.sol,sol);assert.equal(m.monedas,monedas[0].valor);assert.equal(m.estado().monedas,monedas[0].valor);
 });
 prueba('5-5: las oleadas enormes intermedias traen solo cinco colgados; el resto cae del cielo',()=>{
  const m=new MotorPvZ(NIVEL_PVZ['5-5'],{semilla:5});let vistos=0;
  for(let i=0;i<60*600&&m.oleada<10&&!m.terminado;i++){m.paso();m.consumirEventos();if(m.oleada<10)for(const z of m.zombis)m.retirarZombi(z);}
  assert.equal(m.oleada,10);vistos=m.zombis.filter(z=>z.oleada===10);
  assert.equal(vistos.filter(z=>z.tipo==='zombi-colgado').length,5);assert.equal(vistos.filter(z=>z.tipo!=='zombi-colgado').length,0);
  const n=new MotorPvZ(NIVEL_PVZ['5-5'],{semilla:5});for(let i=0;i<60*40&&n.oleada<1;i++){n.paso();n.consumirEventos();}
  const traidos=n.zombis.filter(z=>z.oleada===1&&z.tipo!=='zombi-colgado');assert.ok(traidos.length>0&&traidos.every(z=>z.datos.colgadoPor&&z.datos.colgadoAlto));
 });
 prueba('Dr. Zomboid: invulnerable salvo con la cabeza baja; hielo y fuego rompen sus bolas; al vencerlo se gana',()=>{
  const m=new MotorPvZ(NIVEL_PVZ['5-10'],{semilla:7});const j=m.zombis.find(z=>z.tipo==='dr-zomboid');assert.ok(j);
  assert.equal(m.danarZombi(j,100),false);
  j.datos.cabeza=0;j.datos.invocar=999;for(let i=0;i<60*12&&j.datos.fase!==9;i++){m.paso();m.consumirEventos();}
  assert.equal(j.datos.fase,9);assert.ok(m.danarZombi(j,100));assert.equal(j.vida,39900);
  for(let i=0;i<60*10&&j.datos.bolaX===undefined;i++){m.paso();m.consumirEventos();}
  assert.ok(j.datos.bolaX!==undefined);
  if(j.datos.bolaFuego){m.helarTablero();}else{m.quemarFila(j.datos.bolaFila);}assert.equal(j.datos.bolaX,undefined);
  for(let i=0;i<60*20&&![9,10,11].includes(j.datos.fase);i++){j.datos.cabeza=0;j.datos.invocar=999;m.paso();m.consumirEventos();}
  const otro=m.crearZombi('zombi',1,700);m.danarZombi(j,j.vida+10);assert.equal(j.vida,1,'la vida mínima espera a la animación de derrota');
  for(let i=0;i<60*20&&!m.terminado;i++){m.paso();m.consumirEventos();}
  assert.equal(m.terminado,'gano');assert.equal(otro.vida,0);
 });
 prueba('guardado a mitad de combate en el tejado con tiros parabólicos y escalera',()=>{
  const m=preparado(['coltapulta','maceta','nuez']);const p=conMaceta(m,'coltapulta',2,1);const n=conMaceta(m,'nuez',3,5);n.datos.escalera=1;blanco(m,2,600);p.datos.reloj=0;segundos(m,.5);
  assert.ok(m.proyectiles.some(q=>q.llegada!==undefined));
  const copia=MotorPvZ.restaurar(JSON.parse(JSON.stringify(m.exportar())),{zombis:{...ZOMBIS_PVZ,...extra}});
  segundos(m,2);segundos(copia,2);assert.deepEqual(copia.estado(),m.estado());
 });
 prueba('guardado: la frontera publicada en 4-10 abre 5-1 sin acreditar victorias; las monedas se conservan al perder',()=>{
  const almacen=new Map(),alm={getItem:k=>almacen.has(k)?almacen.get(k):null,setItem:(k,v)=>almacen.set(k,v)};
  const p=progresoInicialPvZ();p.completados=NIVELES_PVZ.slice(0,40).map(n=>n.id);p.nivelAlcanzado='4-10';almacen.set('pvz-v1',JSON.stringify(p));
  const g=new GuardadoPvZ(alm);assert.equal(g.bloqueo,null);assert.equal(g.siguienteNivel,'5-1');assert.equal(g.progreso.completados.length,40);
  assert.ok(g.disponibles().includes('coltapulta'));assert.equal(almacen.get('pvz-v1'),JSON.stringify(p),'leer no escribe');
  const a=g.abrirNivel('5-1',['girasol','coltapulta']);assert.ok(a.ok);const m=new MotorPvZ(a.nivel,a.opciones);m.monedas=60;m.terminado='perdio';
  const r=g.confirmarResultado(a.partida,m.estado());assert.ok(r.ok&&!r.aplicado&&r.guardado);assert.equal(g.progreso.monedas,60);assert.equal(g.progreso.completados.length,40);
 });
 completo=true;
}catch(e){errorFinal=e;}
finally{
 await mkdir(salida,{recursive:true});await writeFile(join(salida,'resultado.json'),JSON.stringify({completo,resultados,error:errorFinal?String(errorFinal.stack??errorFinal):null},null,1));
 await rm(temporal,{recursive:true,force:true});
}
if(errorFinal){console.error(errorFinal);process.exit(1);}
console.log(`${resultados.length} reglas del tejado comprobadas`);
