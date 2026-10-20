/** Mundo 2 sin arte: reglas en escenarios preparados y 30 partidas con órdenes y recursos legales. */
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const temporal=await mkdtemp(join(tmpdir(),'pvz-noche-'));
const resultados=[];
const soloReglas=process.argv.includes('--solo-reglas');
try {
 const fichero=join(temporal,'noche.mjs');
 await build({stdin:{contents:`
  export * from './src/jardin/pvz/motor/motor';
  export * from './src/jardin/pvz/motor/bot';
  export * from './src/jardin/pvz/datos/noche';
  export * from './src/jardin/pvz/datos/niveles';
  export * from './src/jardin/pvz/datos/plantas';
  export * from './src/jardin/pvz/datos/zombis';
  export * from './src/jardin/pvz/comportamiento';
 `,resolveDir:resolve(import.meta.dirname,'..')},outfile:fichero,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const {MotorPvZ,crearPilotoPvZ,seleccionPilotoPvZ,NIVELES_NOCHE,PLANTAS_PVZ,ZOMBIS_PVZ,
  semillasAntesDelNivel,COMPORTAMIENTOS_PLANTAS}=await import(pathToFileURL(fichero));
 const hongos=['seta-desesporada','seta-solar','humoseta','comepiedras','hipnoseta','seta-miedica','seta-congelada','petaseta'];
 const preparado=(opciones={},nivel={},registros={})=>new MotorPvZ({
  ...NIVELES_NOCHE[0],id:'prueba-noche',solInicial:10000,lapidas:0,distribucionLapidas:undefined,...nivel,
 },{sinOleadas:true,semillas:[...hongos,'petacereza','nuez'],...opciones},registros);
 const pasar=(motor,segundos)=>{for(let i=0;i<Math.ceil(segundos*60);i++)motor.paso();};
 const inmovilizar=(motor,zombi)=>{assert.ok(zombi);motor.aplicarEstado(zombi,'mantequilla',100);return zombi;};
 const plantar=(motor,tipo,fila,col)=>{
  assert.ok(motor.plantar(tipo,fila,col),`No se pudo plantar ${tipo} en ${fila}:${col}`);
  return motor.plantaEn(fila,col);
 };
 const prueba=(nombre,fn)=>{fn();resultados.push({nombre,ok:true});console.log('OK',nombre);};

 prueba('catálogo nocturno, progresión y ningún premio anticipado',()=>{
  assert.deepEqual(NIVELES_NOCHE.map(n=>n.id),Array.from({length:10},(_,i)=>`2-${i+1}`));
  assert.deepEqual(NIVELES_NOCHE.map(n=>n.lapidas),[4,4,4,7,9,7,11,11,11,13]);
  assert.ok(NIVELES_NOCHE.every(n=>n.area==='noche'&&n.filas.length===5));
  for(const id of hongos)assert.ok(PLANTAS_PVZ[id]?.nocturna||id==='comepiedras');
  const desbloqueadas=semillasAntesDelNivel('2-1');
  assert.ok(desbloqueadas.includes('seta-desesporada'));
  assert.ok(!desbloqueadas.includes('seta-solar'));
  assert.ok(semillasAntesDelNivel('2-2').includes('seta-solar'));
  assert.ok(!semillasAntesDelNivel('2-9').includes('nenufar'));
 });
 prueba('todos los niveles nocturnos admiten una selección por defecto de hasta diez sobres',()=>{
  for(const nivel of NIVELES_NOCHE){const m=new MotorPvZ(nivel);assert.ok(m.semillas.length<=10);assert.ok(m.semillas.every(id=>Object.hasOwn(PLANTAS_PVZ,id)));}
 });
 prueba('terreno inicial reproducible, columnas permitidas y snapshot independiente',()=>{
  for(const [indice,colMinima]of [[0,6],[3,5],[6,4],[9,3]]){
   const nivel=NIVELES_NOCHE[indice];
   const a=new MotorPvZ(nivel,{semilla:108,semillas:seleccionPilotoPvZ(semillasAntesDelNivel(nivel.id),nivel)});
   const b=new MotorPvZ(nivel,{semilla:108,semillas:seleccionPilotoPvZ(semillasAntesDelNivel(nivel.id),nivel)});
   assert.equal(a.lapidas.length,nivel.lapidas);
   assert.equal(new Set(a.lapidas.map(p=>`${p.fila}:${p.col}`)).size,nivel.lapidas);
   assert.ok(a.lapidas.every(p=>nivel.filas.includes(p.fila)&&p.col>=colMinima&&p.col<=8));
   assert.deepEqual(a.estado(),b.estado());
   const foto=a.estado();foto.lapidas.length=0;
   assert.equal(a.lapidas.length,nivel.lapidas);
  }
 });
 prueba('lápidas rechazan órdenes y coordenadas inválidas sin cobrar ni mutar',()=>{
  const m=preparado();assert.ok(m.crearLapida(1,4));
  for(const [fila,col]of [[-1,4],[5,4],[1,9],[1,NaN],[.5,4],[1,4]]){
   const antes=m.estado();assert.equal(!!m.crearLapida(fila,col),false);assert.deepEqual(m.estado(),antes);
  }
  for(const id of ['seta-desesporada','nuez','petacereza']){
   const antes=m.estado();assert.equal(m.plantar(id,1,4),false);assert.deepEqual(m.estado(),antes);
  }
  assert.equal(m.quitar(1,4),false,'La pala no retira una lápida');
  assert.ok(m.quitarLapida(1,4));assert.equal(m.lapidaEn(1,4),undefined);
  assert.ok(m.plantar('nuez',1,4));
 });
 prueba('cinta conserva sobres rechazados por lápidas y cráteres',()=>{
  const m=preparado({}, {tipo:'cinta',cinta:['seta-desesporada']});m.paso();
  const sobre=m.cinta[0];assert.ok(sobre);
  assert.ok(m.crearLapida(1,4));assert.ok(m.crearCrater(2,4,180));
  for(const fila of[1,2]){const antes=m.estado();assert.equal(m.plantarCinta(sobre.id,fila,4),false);assert.deepEqual(m.estado(),antes);}
  assert.ok(m.plantarCinta(sobre.id,0,0));assert.equal(m.cinta.length,0);assert.equal(m.sol,10000);
 });
 prueba('Comepiedras exige tumba, tarda 4,5 segundos y bloquea la pala',()=>{
  const m=preparado(),antes=m.estado();assert.equal(m.plantar('comepiedras',0,3),false);assert.deepEqual(m.estado(),antes);
  assert.ok(m.crearLapida(0,3));const p=plantar(m,'comepiedras',0,3);
  assert.equal(m.quitar(0,3),false);pasar(m,4.4);
  assert.ok(m.lapidaEn(0,3));assert.ok(m.plantas.includes(p));pasar(m,.2);
  assert.equal(m.lapidaEn(0,3),undefined);assert.ok(!m.plantas.includes(p));
  assert.ok(m.plantar('seta-desesporada',0,3));
 });
 prueba('Comepiedras sigue siendo vulnerable y no borra la lápida al morir',()=>{
  const m=preparado();m.crearLapida(0,3);const p=plantar(m,'comepiedras',0,3);
  assert.ok(m.danarPlanta(p,1000));pasar(m,5);
  assert.ok(m.lapidaEn(0,3));assert.equal(m.plantas.length,0);
 });
 prueba('cráter bloquea toda siembra durante 180 segundos y no acepta coordenadas inválidas',()=>{
  const m=preparado();const p=plantar(m,'nuez',1,3);assert.ok(m.crearCrater(1,3,180));
  assert.ok(!m.plantaEn(1,3));assert.equal(p.vida,0);
  const foto=m.estado();foto.crateres.length=0;assert.equal(m.crateres.length,1);
  for(const args of [[-1,0,180],[0,9,180],[0,0,0],[0,0,Infinity],[0,0,-1]]){
   const antes=m.estado();assert.equal(!!m.crearCrater(...args),false);assert.deepEqual(m.estado(),antes);
  }
  for(const id of hongos){const antes=m.estado();assert.equal(m.plantar(id,1,3),false);assert.deepEqual(m.estado(),antes);}
  pasar(m,179.9);assert.equal(m.plantar('seta-desesporada',1,3),false);pasar(m,.2);
  assert.ok(m.plantar('seta-desesporada',1,3));assert.equal(m.crateres.length,0);
 });
 prueba('un cráter retira todas las capas de su casilla y conserva las vecinas',()=>{
  const plantas={...PLANTAS_PVZ,
   'base-prueba':{...PLANTAS_PVZ.nuez,id:'base-prueba',capa:'base',recarga:0},
   'cubierta-prueba':{...PLANTAS_PVZ.nuez,id:'cubierta-prueba',capa:'cubierta',recarga:0},
  };
  const m=preparado({semillas:['base-prueba','nuez','cubierta-prueba','seta-desesporada']},{},{plantas});
  for(const id of['base-prueba','nuez','cubierta-prueba'])plantar(m,id,2,3);
  const vecina=plantar(m,'seta-desesporada',2,2);assert.ok(m.crearCrater(2,3,180));
  assert.equal(m.plantas.filter(p=>p.vida>0&&p.fila===2&&p.col===3).length,0);assert.ok(m.plantas.includes(vecina));
 });
 prueba('cráter y lápida creciente retiran capas incluso con armadura o abono activo, una sola vez',()=>{
  for(const terreno of ['crater','lapida']){
   const plantas={...PLANTAS_PVZ,nuez:{...PLANTAS_PVZ.nuez,capa:'base'},lanzaguisantes:{...PLANTAS_PVZ.lanzaguisantes,capa:'temporal'}},muertes={};
   const alMorir=(_m,p)=>{muertes[p.id]=(muertes[p.id]??0)+1;};
   const comportamientos={...COMPORTAMIENTOS_PLANTAS,nuez:{...COMPORTAMIENTOS_PLANTAS.nuez,alMorir},lanzaguisantes:{...COMPORTAMIENTOS_PLANTAS.lanzaguisantes,alMorir}};
   const m=preparado({semillas:['nuez','lanzaguisantes'],abono:3},{},{plantas,comportamientoPlantas:comportamientos});
   assert.ok(m.plantar('nuez',2,3));assert.ok(m.plantar('lanzaguisantes',2,3));const capas=[...m.plantas];
   for(const p of capas)assert.ok(m.usarAbono(p.id));
   assert.equal(capas.find(p=>p.tipo==='nuez').datos.abonoEscudo,8000);assert.ok(m.protegidaPorAbono(capas.find(p=>p.tipo==='lanzaguisantes')));
   m.consumirEventos();
   const crear=()=>terreno==='crater'?m.crearCrater(2,3,180):m.crearLapida(2,3,true);
   assert.ok(crear());assert.ok(capas.every(p=>p.vida===0));assert.ok(!m.plantas.some(p=>p.vida>0&&p.fila===2&&p.col===3));
   assert.deepEqual(Object.values(muertes),[1,1]);assert.equal(m.eventos.filter(e=>e.t==='muere').length,2);
   crear();assert.deepEqual(Object.values(muertes),[1,1]);assert.equal(m.eventos.filter(e=>e.t==='muere').length,2);
   m.paso();assert.ok(!m.plantas.length);
  }
 });
 prueba('reproducir Patatapum con abono respeta tumbas y cráteres sin abrir una siembra gratis',()=>{
  const m=preparado({semillas:['patatapum','nuez'],abono:1});const p=plantar(m,'patatapum',0,0);
  for(const fila of m.nivel.filas)for(let col=3;col<9;col++)assert.ok(m.crearLapida(fila,col));
  for(const fila of m.nivel.filas.slice(1))for(let col=0;col<3;col++){plantar(m,'nuez',fila,col);pasar(m,30.01);}
  assert.ok(m.crearCrater(0,1,180));const sol=m.sol,recarga=m.recargas.patatapum;
  assert.deepEqual(m.casillasParaReproducir(p),[]);assert.equal(m.reproducirPlanta(p,0,2),null);
  assert.ok(m.usarAbono(p.id));assert.equal(m.abono,0);assert.equal(m.sol,sol);assert.equal(m.recargas.patatapum,recarga);
  assert.equal(m.plantas.filter(p=>p.tipo==='patatapum').length,2);assert.ok(m.plantaEn(0,2));assert.ok(m.plantas.every(p=>!m.lapidaEn(p.fila,p.col)&&!m.crateres.some(c=>c.fila===p.fila&&c.col===p.col)));
 });
 prueba('la última oleada espera el alzamiento nocturno y la aparición de las lápidas',()=>{
  const m=preparado({sinOleadas:false},{oleadas:1,enormes:[],composicionCompleta:true,fijos:{1:{}},lapidas:1,distribucionLapidas:{6:1}});
  const tumba=m.lapidas[0];pasar(m,18.1);assert.equal(m.oleada,1);assert.equal(m.zombis.length,0);assert.equal(m.terminado,'');
  pasar(m,1.9);assert.equal(m.zombis.length,0);assert.equal(m.terminado,'','No se gana antes de los 2,1 s pendientes');
  pasar(m,.2);assert.equal(m.zombis.length,1);const z=m.zombis[0];
  assert.ok(['zombi','caracono'].includes(z.tipo));assert.equal(z.fila,tumba.fila);assert.equal(z.x,tumba.x);
  const x=z.x;pasar(m,1);assert.equal(z.x,x,'La fase de salida de la tumba dura 1,5 s');pasar(m,.6);assert.ok(z.x<x);
  assert.equal(m.terminado,'');m.danarZombi(z,9999,'aplastar');m.paso();assert.equal(m.terminado,'gano');
 });
 prueba('Comepiedras activo impide la resurrección de su lápida en la oleada final',()=>{
  const m=preparado({sinOleadas:false},{oleadas:1,enormes:[],composicionCompleta:true,fijos:{1:{}},lapidas:1,distribucionLapidas:{6:1}});
  const tumba=m.lapidas[0];pasar(m,18.1);plantar(m,'comepiedras',tumba.fila,tumba.col);pasar(m,2.1);
  assert.equal(m.zombis.length,0);assert.equal(m.terminado,'gano');
 });
 prueba('el máximo de Comepiedras en cinta cuenta sobres emitidos y no se renueva al gastarlos',()=>{
  const m=preparado({}, {tipo:'cinta',cinta:['comepiedras'],pesosCinta:{comepiedras:1},maximosCinta:{comepiedras:13},lapidas:30});
  let usados=0;
  for(let i=0;i<60*80;i++){
   for(const sobre of [...m.cinta])for(const q of m.lapidas)if(m.ordenar({tipo:'plantarCinta',id:sobre.id,fila:q.fila,col:q.col})){usados++;break;}
   m.paso();
  }
  assert.equal(usados,13);assert.equal(m.cinta.length,0);assert.equal(m.lapidas.length,17);assert.equal(m.sol,10000);
 });
 prueba('hongos duermen de día y despiertan de noche; nunca cae sol del cielo nocturno',()=>{
  const noche=preparado(),dia=preparado({}, {area:'dia'});
  for(const m of[noche,dia]){plantar(m,'seta-desesporada',0,0);inmovilizar(m,m.crearZombi('zombi',0,220));}
  assert.equal(noche.plantas[0].dormida,false);assert.equal(dia.plantas[0].dormida,true);
  pasar(noche,2);pasar(dia,2);assert.ok(noche.zombis[0].vida<270);assert.equal(dia.zombis[0].vida,270);
  const n=preparado();pasar(n,40);assert.equal(n.soles.length,0);
 });
 prueba('Seta desesporada ataca dentro de 240 píxeles y no alcanza más lejos',()=>{
  const lejos=preparado(),cerca=preparado();plantar(lejos,'seta-desesporada',0,1);plantar(cerca,'seta-desesporada',0,1);
  const a=inmovilizar(lejos,lejos.crearZombi('zombi',0,380));
  const b=inmovilizar(cerca,cerca.crearZombi('zombi',0,340));
  pasar(lejos,2);pasar(cerca,2);assert.equal(a.vida,270);assert.ok(b.vida<270);
  assert.ok(lejos.proyectiles.length===0);
 });
 prueba('las esporas desaparecen al agotar alcance aunque otro enemigo entre tarde',()=>{
  const m=preparado(),p=plantar(m,'seta-desesporada',0,0);
  assert.ok(m.disparar(p,20,'recto',0,'espora',240));pasar(m,1);
  assert.equal(m.proyectiles.length,0);
  const z=inmovilizar(m,m.crearZombi('zombi',0,330));pasar(m,.2);assert.equal(z.vida,270);
 });
 prueba('Humoseta daña a todos los objetivos a 320 y atraviesa puerta sin ignorar casco',()=>{
  const m=preparado();plantar(m,'humoseta',0,0);
  const puerta=inmovilizar(m,m.crearZombi('zombi-portero',0,180));
  const cubo=inmovilizar(m,m.crearZombi('caracubo',0,250));
  const borde=inmovilizar(m,m.crearZombi('zombi',0,360));
  const fuera=inmovilizar(m,m.crearZombi('zombi',0,361));
  const otraFila=inmovilizar(m,m.crearZombi('zombi',1,180));pasar(m,.6);
  assert.equal(puerta.vida,250);assert.equal(puerta.armadura,1080);
  assert.equal(cubo.vida,270);assert.equal(cubo.armadura,1080);
  assert.equal(borde.vida,250);assert.equal(fuera.vida,270);assert.equal(otraFila.vida,270);
  assert.equal(m.proyectiles.length,0);
 });
 prueba('Seta solar crece a 120 segundos sin reiniciar su ciclo de producción',()=>{
  const m=preparado();plantar(m,'seta-solar',0,0);const producciones=[];
  for(let i=0;i<60*130;i++){m.paso();for(const e of m.eventos)if(e.t==='sol'&&e.tipo!=='cielo')producciones.push({t:m.t,valor:e.cantidad});for(const sol of[...m.soles])m.recoger(sol.id);}
  assert.ok(producciones.length>=6);assert.ok(Math.abs(producciones[0].t-7)<.05);
  assert.ok(producciones.filter(s=>s.t<120).every(s=>s.valor===15));
  const madura=producciones.find(s=>s.t>=120);assert.ok(madura);assert.equal(madura.valor,25);
  assert.ok(madura.t<129,'La madurez no puede reiniciar un ciclo de 24,25 segundos');
  for(let i=1;i<producciones.length;i++)assert.ok(Math.abs(producciones[i].t-producciones[i-1].t-24.25)<.05);
 });
 prueba('Hipnoseta consume el primer bocado hostil y convierte al atacante',()=>{
  const m=preparado(),p=plantar(m,'hipnoseta',0,2),z=m.crearZombi('caracubo',0,p.x);
  m.paso();assert.equal(z.hipnotizado,true);assert.equal(z.sentido,1);assert.equal(z.comiendo,null);assert.ok(!m.plantas.includes(p));
  const x=z.x;pasar(m,.5);assert.ok(z.x>x);assert.equal(z.armadura,1100);
 });
 prueba('Hipnoseta dormida o dañada sin atacante no hipnotiza',()=>{
  const m=preparado(),p=plantar(m,'hipnoseta',0,2);assert.ok(m.danarPlanta(p,1));assert.ok(p.vida>0);
  const aliado=m.crearZombi('zombi',0,600);m.aplicarEstado(aliado,'hipnotizado');assert.ok(m.danarPlanta(p,1,aliado));assert.ok(p.vida>0);
  const dia=preparado({}, {area:'dia'}),d=plantar(dia,'hipnoseta',0,2),z=dia.crearZombi('zombi',0,d.x);
  pasar(dia,3.1);assert.equal(z.hipnotizado,false);assert.ok(!dia.plantas.includes(d));
 });
 prueba('Seta miedica detecta enemigos cercanos y vuelve a disparar al retirarse la amenaza',()=>{
  const m=preparado(),p=plantar(m,'seta-miedica',2,3);
  const lejos=inmovilizar(m,m.crearZombi('caracubo',2,650));pasar(m,.6);assert.ok(m.proyectiles.length>0);
  const amenaza=inmovilizar(m,m.crearZombi('zombi',1,p.x-40));m.proyectiles=[];
  const antes=lejos.armadura;pasar(m,2);assert.equal(lejos.armadura,antes);assert.equal(m.proyectiles.length,0);
  m.danarZombi(amenaza,9999,'aplastar');pasar(m,2);assert.ok(lejos.armadura<antes||m.proyectiles.length>0);
 });
 prueba('Hieloseta congela con azar reproducible, inflige 20 y el frío acaba a los 20 segundos',()=>{
  const m=preparado({semilla:23});plantar(m,'seta-congelada',2,2);
  const normal=m.crearZombi('zombi',0,650),frio=m.crearZombi('zombi',4,650);m.aplicarEstado(frio,'lento',10);
  pasar(m,.9);assert.equal(normal.vida,270);pasar(m,.2);
  assert.equal(normal.vida,250);assert.equal(frio.vida,250);
  assert.ok(normal.congelado>=3.8&&normal.congelado<=6);assert.ok(frio.congelado>=2.8&&frio.congelado<=4);
  assert.ok(normal.lento>19.8&&normal.lento<=20);assert.ok(frio.lento>19.8&&frio.lento<=20);
  const x=normal.x;pasar(m,2);assert.equal(normal.x,x);pasar(m,4.1);assert.equal(normal.congelado,0);assert.ok(normal.lento>0);pasar(m,14);
  assert.equal(normal.lento,0);assert.equal(frio.lento,0);assert.equal(m.plantas.length,0);
 });
 prueba('Petaseta respeta un radio circular de 250, mata cubos y deja cráter de 180 segundos',()=>{
  const m=preparado(),p=plantar(m,'petaseta',2,4);
  const dentro=inmovilizar(m,m.crearZombi('caracubo',4,p.x+140));
  const fuera=inmovilizar(m,m.crearZombi('caracubo',4,p.x+160));
  const dosFilas=inmovilizar(m,m.crearZombi('caracubo',0,p.x));
  pasar(m,.9);assert.equal(dentro.vida,270);pasar(m,.2);
  assert.equal(dentro.vida,0);assert.equal(dosFilas.vida,0);assert.equal(fuera.vida,270);assert.equal(fuera.armadura,1100);
  assert.ok(m.crateres.some(c=>c.fila===2&&c.col===4));assert.equal(m.plantar('seta-desesporada',2,4),false);
  assert.ok(!m.plantas.includes(p));
 });
 prueba('los hongos sin abono rechazan la orden sin gastar carga ni cambiar estado',()=>{
  for(const id of hongos){const m=preparado({abono:1});if(id==='comepiedras')m.crearLapida(2,3);const p=plantar(m,id,2,3),antes=m.estado();assert.equal(m.usarAbono(p.id),false,id);assert.deepEqual(m.estado(),antes,id);}
 });

 prueba('el martillo solo sirve en Aplastazombis y requiere 1, 2 o 3 golpes',()=>{
  for(const [tipo,golpes]of[['zombi',1],['caracono',2],['caracubo',3]]){
   const m=preparado({semillas:['patatapum','comepiedras','petacereza']},{tipo:'minijuego',minijuego:'aplastazombis',solInicial:0});
   const z=m.crearZombi(tipo,2,500);
   for(let i=1;i<=golpes;i++){
    assert.ok(m.ordenar({tipo:'golpear',id:z.id}));
    if(i<golpes)assert.equal(z.vida,270,'El daño sobrante del casco no debe llegar al cuerpo');
    else assert.equal(z.vida,0);
   }
   const antes=m.estado();assert.equal(m.ordenar({tipo:'golpear',id:z.id}),false);assert.deepEqual(m.estado(),antes);
  }
  const normal=preparado(),z=normal.crearZombi('zombi',0,500),antes=normal.estado();
  assert.equal(normal.ordenar({tipo:'golpear',id:z.id}),false);assert.deepEqual(normal.estado(),antes);
 });

 prueba('Aplastazombis conserva ocho oleadas, crecimiento de tumbas y el grupo final pendiente',()=>{
  const nivel=NIVELES_NOCHE.find(n=>n.id==='2-5'),m=new MotorPvZ(nivel,{semilla:23});
  assert.equal(m.lapidas.length,9);const vistos=new Set();let finales=0,grupoFinal=null;
  for(let i=0;i<60*150&&!m.terminado;i++){
   for(const z of m.zombis)if(z.vida>0){
    if(!vistos.has(z.id)){
     vistos.add(z.id);if(m.oleada<5)assert.equal(z.tipo,'zombi');if(m.oleada<7)assert.notEqual(z.tipo,'caracubo');
     assert.ok(z.datos.velocidad>=50&&z.datos.velocidad<=200);
    }
    while(z.vida>0)assert.ok(m.ordenar({tipo:'golpear',id:z.id}));
   }
   m.consumirEventos();m.paso();finales+=m.eventos.filter(e=>e.t==='fin').length;
   if(m.t<1.99)assert.equal(m.zombis.length,0);
   if(m.oleada===8&&m.t<144.99)assert.equal(m.terminado,'','Vaciar el tablero no adelanta el grupo final');
   if(m.oleada===8&&m.zombis.length&&!grupoFinal)grupoFinal=m.zombis.map(z=>({tipo:z.tipo,fila:z.fila,x:z.x}));
  }
  assert.equal(m.terminado,'gano');assert.equal(m.oleada,8);assert.equal(finales,1);assert.ok(m.t>=145&&m.t<146);
  assert.equal(m.lapidas.length,16);assert.equal(grupoFinal.length,16);
  assert.equal(new Set(grupoFinal.map(z=>`${z.fila}:${z.x}`)).size,16);assert.ok(grupoFinal.every(z=>['caracono','caracubo'].includes(z.tipo)));
  assert.equal(m.sol,0,'Los soles caídos nunca se acreditan sin recogerlos');
 });
 prueba('el botín de Aplastazombis es una posibilidad de tres soles de 25 y se recoge una vez',()=>{
  const m=new MotorPvZ(NIVELES_NOCHE.find(n=>n.id==='2-5'),{semilla:23});let sinPremio=0,conPremio=0;
  for(let i=0;i<200;i++){
   const z=m.crearZombi('zombi',2,500),antes=m.soles.length;assert.ok(m.ordenar({tipo:'golpear',id:z.id}));
   const cantidad=m.soles.length-antes;assert.ok(cantidad===0||cantidad===3);if(cantidad)conPremio++;else sinPremio++;
   assert.equal(m.sol,0);
  }
  assert.ok(sinPremio>0&&conPremio>0);assert.ok(m.soles.every(s=>s.valor===25));
  const sol=m.soles[0];assert.ok(m.recoger(sol.id));assert.equal(m.sol,25);assert.equal(m.recoger(sol.id),false);assert.equal(m.sol,25);
 });
 // Los escenarios de zombies están preparados; las campañas inferiores conservan los datos y recursos originales.
 prueba('Puerta protege rectos, Humoseta perfora cuerpo y escudo, Fútbol conserva casco y velocidad',()=>{
  const m=preparado(),puerta=m.crearZombi('zombi-portero',0,500),futbol=m.crearZombi('zombi-futbolista',1,500);
  m.danarZombi(puerta,20,'recto');assert.equal(puerta.vida,270);assert.equal(puerta.armadura,1080);
  m.danarZombi(puerta,20,'perforante');assert.equal(puerta.vida,250);assert.equal(puerta.armadura,1060);
  assert.equal(futbol.armadura,1400);m.danarZombi(futbol,100,'perforante');assert.equal(futbol.vida,270);assert.equal(futbol.armadura,1300);
  pasar(m,1);assert.ok(Math.abs(futbol.x-(500-80/2.5))<1e-7);
 });
 prueba('Periódico conserva el cuerpo hasta romperse y luego entra en rabia tras una pausa',()=>{
  const m=preparado(),z=m.crearZombi('zombi-periodico',0,600);
  m.danarZombi(z,149);assert.equal(z.vida,270);assert.equal(z.armadura,1);m.danarZombi(z,1);assert.equal(z.armadura,0);assert.equal(z.vida,270);
  const x=z.x;pasar(m,1.6);assert.equal(z.x,x);pasar(m,.05);assert.ok(z.x<x,'La sorpresa de 13 fotogramas a 8 fps termina tras 1,625 s');const inicio=z.x;pasar(m,1);
  assert.ok(z.x<inicio);assert.ok(Math.abs(inicio-z.x-80/1.8)<1e-6);
 });
 prueba('el frío propio ralentiza la sorpresa del Periódico sin adelantar su rabia',()=>{
  const m=preparado(),z=m.crearZombi('zombi-periodico',0,600);m.danarZombi(z,150);m.aplicarEstado(z,'lento',10);
  const x=z.x;pasar(m,3.2);assert.equal(z.x,x);pasar(m,.1);assert.ok(z.x<x);
  const inicio=z.x;pasar(m,1);assert.ok(Math.abs(inicio-z.x-(80/1.8)/2)<1e-6);
 });
 prueba('Bailón convoca compañeros en cruz, respeta filas activas y repone sin duplicados',()=>{
  const m=preparado(),lider=m.crearZombi('zombi-bailon',2,720);pasar(m,24);
  const grupo=m.zombis.filter(z=>z.datos.lider===lider.id&&z.vida>0);assert.equal(grupo.length,4);
  assert.equal(new Set(grupo.map(z=>z.datos.hueco)).size,4);assert.ok(grupo.every(z=>m.nivel.filas.includes(z.fila)));
  const muerto=grupo[0];m.danarZombi(muerto,9999,'aplastar');pasar(m,.5);
  assert.equal(m.zombis.filter(z=>z.datos.lider===lider.id&&z.vida>0).length,3);pasar(m,6);
  const repuestos=m.zombis.filter(z=>z.datos.lider===lider.id&&z.vida>0);assert.equal(repuestos.length,4);assert.equal(new Set(repuestos.map(z=>z.datos.hueco)).size,4);
  const borde=preparado({}, {filas:[0]}),b=borde.crearZombi('zombi-bailon',0,720);pasar(borde,24);
  assert.ok(borde.zombis.every(z=>z.fila===0));assert.equal(borde.zombis.filter(z=>z.datos.lider===b.id).length,2);
 });
 prueba('hipnotizar al Bailón no convierte a sus antiguos compañeros',()=>{
  const m=preparado(),lider=m.crearZombi('zombi-bailon',2,720);pasar(m,24);
  const antiguos=m.zombis.filter(z=>z.datos.lider===lider.id);assert.equal(antiguos.length,4);
  m.aplicarEstado(lider,'hipnotizado');m.paso();
  assert.ok(antiguos.every(z=>!z.hipnotizado));assert.ok(antiguos.every(z=>z.datos.lider!==lider.id));
 });
 prueba('el terreno y sus creaciones quedan inmóviles después de terminar',()=>{
  const m=preparado();m.crearLapida(1,4);m.crearCrater(2,4,180);m.crearZombi('zombi',0,-59.99);m.paso();pasar(m,3);
  m.crearZombi('zombi',0,-59.99);m.paso();assert.equal(m.terminado,'perdio');const antes=m.estado();
  for(const accion of[()=>m.crearLapida(3,4),()=>m.quitarLapida(1,4),()=>m.crearCrater(4,4,180)]){assert.equal(!!accion(),false);assert.deepEqual(m.estado(),antes);}
  pasar(m,200);assert.deepEqual(m.estado(),antes);
 });
 prueba('determinismo nocturno con terreno, invocaciones, órdenes y snapshots',()=>{
  const nivel=NIVELES_NOCHE[8],semillas=seleccionPilotoPvZ(semillasAntesDelNivel(nivel.id),nivel);
  const a=new MotorPvZ(nivel,{semilla:108,semillas}),b=new MotorPvZ(nivel,{semilla:108,semillas});
  const pa=crearPilotoPvZ(),pb=crearPilotoPvZ();for(let i=0;i<60*180;i++){pa(a);pb(b);a.paso();b.paso();if(i%6===0){const foto=b.estado();foto.sol=999999;foto.plantas.length=0;foto.lapidas.length=0;foto.crateres.length=0;}}
  assert.deepEqual(a.estado(),b.estado());assert.equal(a.azar.estado,b.azar.estado);
 });
 if(!soloReglas)for(const nivel of NIVELES_NOCHE)for(const semilla of[1,23,108]){
  const semillas=seleccionPilotoPvZ(semillasAntesDelNivel(nivel.id),nivel);
  assert.ok(semillas.length<=6);assert.ok(semillas.every(id=>semillasAntesDelNivel(nivel.id).includes(id)));
  const m=new MotorPvZ(nivel,{semilla,semillas}),piloto=crearPilotoPvZ();let finales=0;
  for(let i=0;i<60*1800&&!m.terminado;i++){
   piloto(m);m.paso();finales+=m.eventos.filter(e=>e.t==='fin').length;
   assert.ok(m.sol>=0);assert.ok(m.zombis.every(z=>nivel.filas.includes(z.fila)));
   assert.equal(new Set(m.plantas.map(p=>`${p.fila}:${p.col}:${p.capa}`)).size,m.plantas.length);
  }
  assert.equal(m.terminado,'gano',`${nivel.id} semilla ${semilla}, oleada ${m.oleada}, tiempo ${m.t}`);assert.equal(finales,1);
  if(nivel.id==='2-5')assert.ok(m.t>=140,'Un hueco sin enemigos no debe cerrar Aplastazombis antes de su última aparición');
  const antes=m.estado();m.paso();assert.deepEqual(m.estado(),antes);
  resultados.push({nivel:nivel.id,semilla,semillas,gano:true,t:m.t,eliminados:m.eliminados,sembradas:m.sembradas});
  console.log('OK campaña nocturna',nivel.id,'semilla',semilla,Math.round(m.t)+'s');
 }
 const salida=resolve(import.meta.dirname,'../test-results/pvz/noche');await mkdir(salida,{recursive:true});
 await writeFile(join(salida,soloReglas?'reglas.json':'resultado.json'),JSON.stringify({ok:true,campanas:soloReglas?0:30,pruebas:resultados},null,2));
 console.log('OK',resultados.length,'verificaciones nocturnas; escenarios y piloto sin interfaz ni partidas del usuario');
}finally{await rm(temporal,{recursive:true,force:true});}
