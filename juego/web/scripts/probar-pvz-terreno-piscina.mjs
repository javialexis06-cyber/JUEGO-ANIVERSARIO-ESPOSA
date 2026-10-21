/** Reglas preparadas de piscina: terreno, apariciones, minizombis y defensa; sin UI ni partidas reales. */
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const temporal=await mkdtemp(join(tmpdir(),'pvz-terreno-piscina-'));
const resultados=[];
try{
 const fichero=join(temporal,'terreno.mjs');
 await build({stdin:{contents:`
  export * from './src/jardin/pvz/motor/motor';
  export * from './src/jardin/pvz/motor/oleadas';
  export * from './src/jardin/pvz/motor/azar';
  export * from './src/jardin/pvz/motor/piscina';
  export * from './src/jardin/pvz/datos/piscina';
  export * from './src/jardin/pvz/datos/plantas';
  export * from './src/jardin/pvz/datos/zombis';
 `,resolveDir:resolve(import.meta.dirname,'..')},outfile:fichero,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const {MotorPvZ,DirectorOleadasPvZ,AzarPvZ,emboscarPiscinaPvZ,NIVELES_PISCINA,PLANTAS_PVZ,ZOMBIS_PVZ}=await import(pathToFileURL(fichero));
 const preparado=(nivel={},opciones={})=>new MotorPvZ({
  ...NIVELES_PISCINA[0],id:'prueba-piscina',solInicial:10000,emboscadaAgua:false,...nivel,
 },{sinOleadas:true,semillas:['nenufar','nuez','lanzaguisantes','jalapeno','pinchohierba'],...opciones});
 const pasos=(m,cantidad)=>{for(let i=0;i<cantidad;i++)m.paso();};
 const pasar=(m,segundos)=>pasos(m,Math.ceil(segundos*60));
 const inmovilizar=(m,z)=>{assert.ok(z);assert.ok(m.aplicarEstado(z,'mantequilla',100));return z;};
 const prueba=(nombre,fn)=>{
  try{fn();resultados.push({nombre,ok:true});console.log('OK',nombre);}
  catch(e){resultados.push({nombre,ok:false,error:e.stack});console.error('FALLO',nombre,e.message);}
 };

 prueba('minizombis reducen cuerpo y casco con división entera y conservan escala independiente',()=>{
  const m=preparado({minijuego:'minizombis'});
  for(const tipo of['zombi','caracono','caracubo','zombi-futbolista']){
   const z=m.crearZombi(tipo,0,700),d=ZOMBIS_PVZ[tipo];assert.ok(z);
   assert.equal(z.vida,Math.trunc(d.vida/4));assert.equal(z.armadura,Math.trunc((d.armadura?.vida??0)/4));
   assert.equal(z.armaduraInicial,z.armadura);assert.equal(z.datos.vidaMaxima,z.vida);assert.equal(z.datos.escala,.5);
  }
  const normal=preparado().crearZombi('zombi',0,700);assert.equal(normal.vida,270);assert.equal(normal.datos.escala,undefined);
 });
 prueba('minizombi no pierde cabeza tras un impacto pequeño y sus umbrales usan la vida reducida',()=>{
  const m=preparado({minijuego:'minizombis'}),z=m.crearZombi('zombi',0,500);assert.ok(z);
  m.danarZombi(z,10);assert.equal(z.vida,57);assert.equal(z.sinCabeza,false);assert.equal(z.sinBrazo,false);
  m.danarZombi(z,15);assert.equal(z.vida,42);assert.equal(z.sinBrazo,true);assert.equal(z.sinCabeza,false);
  m.danarZombi(z,22);assert.equal(z.vida,20);assert.equal(z.sinCabeza,true);
 });
 prueba('minizombi conserva velocidad y mordida; el frío reduce ambas',()=>{
  for(const mini of[false,true])for(const frio of[false,true]){
   const nivel=mini?{minijuego:'minizombis'}:{};
   const mover=preparado(nivel),z=mover.crearZombi('zombi',0,500);assert.ok(z);
   if(frio)mover.aplicarEstado(z,'lento',10);pasar(mover,1);
   assert.ok(Math.abs(z.x-(500-ZOMBIS_PVZ.zombi.velocidad*(frio?.5:1)))<1e-7);
   const m=preparado(nivel);assert.ok(m.plantar('nuez',0,1));const p=m.plantaEn(0,1),atacante=m.crearZombi('zombi',0,p.x);assert.ok(atacante);
   if(frio)m.aplicarEstado(atacante,'lento',10);pasar(m,1);
   assert.ok(Math.abs(p.vida-(PLANTAS_PVZ.nuez.vida-100*(frio?.5:1)))<1e-7);
  }
 });
 prueba('director de minizombis usa intervalo de 7,5 segundos sin anticipar enemigos intactos',()=>{
  const n={...NIVELES_PISCINA[4],enormes:[],fijos:{},composicionCompleta:true};
  const d=new DirectorOleadasPvZ(n,new AzarPvZ(23),ZOMBIS_PVZ),situacion={vida:1000,inicial:1000,pendientes:0,plantas:0};
  assert.equal(d.paso(17.99,situacion),null);assert.ok(d.paso(18,situacion));assert.equal(d.actual,1);
  assert.equal(d.paso(25.49,situacion),null);assert.ok(d.paso(25.5,situacion));assert.equal(d.actual,2);
 });
 prueba('la presión de cinta mide los sobres previos y aumenta intervalos a 4,25, 5 y 10 segundos',()=>{
  for(const presionCinta of[false,true]){
   const m=preparado({tipo:'cinta',cinta:['nuez'],presionCinta}),emisiones=[];
   for(let i=0;i<60*90&&emisiones.length<11;i++){
    m.paso();if(!m.eventos.some(e=>e.t==='cinta'))continue;emisiones.push(m.t);
    assert.ok(m.cinta.length<=10);
    // Consumir una carta al llegar a diez permite medir el intervalo largo sin atascar el límite.
    if(emisiones.length===10)assert.ok(m.plantarCinta(m.cinta[0].id,0,0));
   }
   assert.equal(emisiones.length,11);
   for(let i=1;i<emisiones.length;i++){
    const previo=i-1,esperado=!presionCinta||previo<=4?4:previo<=6?4.25:previo<=8?5:10;
    const intervalo=emisiones[i]-emisiones[i-1];
    assert.ok(intervalo>=esperado-1e-8&&intervalo<=esperado+1/60+1e-8,`${presionCinta}: ${previo} sobres, intervalo ${intervalo}, esperado ${esperado}`);
   }
  }
 });
 prueba('la cinta puede reponer Nenúfares y no agota el tipo tras dieciocho sobres emitidos',()=>{
  const m=preparado({tipo:'cinta',cinta:['nenufar'],atenuarCinta:{nenufar:{cantidad:18,pesoFinal:1}}});let emitidos=0;
  for(let i=0;i<60*85;i++){
   m.paso();emitidos+=m.eventos.filter(e=>e.t==='cinta').length;
   for(const s of[...m.cinta]){if(m.plantaEn(2,0,'base'))assert.ok(m.quitar(2,0));assert.ok(m.plantarCinta(s.id,2,0));}
  }
  assert.ok(emitidos>18);assert.equal(m.cinta.length,0);assert.equal(m.plantas.length,1);assert.equal(m.sol,10000);
 });
 prueba('director conserva zombis terrestres en tierra y crea flotadores desde la sexta oleada',()=>{
  let acuaticos=0,buzosTempranos=0;
  const tipos=['zombi','caracono','caracubo','saltador','zombi-futbolista','zombi-buzo','zombi-delfin'];
  for(const semilla of[1,23,108]){
   const n={...NIVELES_PISCINA[0],oleadas:12,enormes:[],zombis:tipos,fijos:{},presupuesto:Array(12).fill(40),desdeOleada:{}};
   const d=new DirectorOleadasPvZ(n,new AzarPvZ(semilla),ZOMBIS_PVZ);
   for(let i=0;i<12;i++){
    const tanda=d.paso(18+100*i,{vida:1000,inicial:1000,pendientes:0,plantas:0});assert.ok(tanda&&!tanda.aviso);
    for(const a of tanda.apariciones){
     const agua=[2,3].includes(a.fila),def=ZOMBIS_PVZ[a.tipo];assert.ok(def);
     if(agua){assert.ok(def.agua);acuaticos++;if(a.oleada<=5){assert.ok(['zombi-buzo','zombi-delfin'].includes(a.tipo));buzosTempranos++;}}
     else assert.notEqual(def.agua,'solo');
     if(a.tipo.endsWith('-flotador'))assert.ok(a.oleada>=6);
    }
   }
  }
  assert.ok(acuaticos>0);assert.ok(buzosTempranos>0);
 });
 prueba('apariciones directas rechazan especies fuera de su terreno sin mutar el estado',()=>{
  const m=preparado();
  for(const [tipo,fila]of[['zombi',2],['zombi-buzo',0],['zombi-delfin',5],['zombi-flotador',1],['zomboni',3]]){
   const antes=m.estado();assert.equal(m.crearZombi(tipo,fila,700),null);assert.deepEqual(m.estado(),antes);
  }
 });
 prueba('banderas pueden recorrer agua y el director reserva esa posibilidad desde la sexta oleada',()=>{
  assert.equal(ZOMBIS_PVZ['zombi-bandera'].agua,'tambien');assert.ok(preparado().crearZombi('zombi-bandera',2,700));
  let banderasAgua=0;
  const fijos=Object.fromEntries(Array.from({length:6},(_,i)=>[i+1,{'zombi-bandera':20}]));
  const n={...NIVELES_PISCINA[0],oleadas:6,enormes:[],fijos,composicionCompleta:true};
  const d=new DirectorOleadasPvZ(n,new AzarPvZ(23),ZOMBIS_PVZ);
  for(let i=0;i<6;i++){
   const tanda=d.paso(18+i*100,{vida:1000,inicial:1000,pendientes:0,plantas:0});assert.equal(tanda.apariciones.length,20);
   for(const a of tanda.apariciones){assert.equal(a.tipo,'zombi-bandera');if([2,3].includes(a.fila)){assert.ok(a.oleada>=6);banderasAgua++;}}
  }
  assert.ok(banderasAgua>0);
 });
 prueba('buzo sumergido rechaza guisantes y recibe proyectiles lanzados',()=>{
  const m=preparado();assert.ok(m.plantar('nenufar',2,0));assert.ok(m.plantar('nuez',2,0));const p=m.plantaEn(2,0);
  const z=inmovilizar(m,m.crearZombi('zombi-buzo',2,200));assert.equal(z.datos.sumergido,1);
  assert.equal(m.puedeRecibirProyectil(z),false);assert.equal(m.puedeRecibirProyectil(z,'recto'),false);assert.equal(m.puedeRecibirProyectil(z,'lanzado'),true);
  assert.ok(m.disparar(p,20,'recto'));pasar(m,1);assert.equal(z.vida,270);
  assert.ok(m.disparar(p,20,'lanzado',0,'prueba-lanzada'));pasar(m,1);assert.equal(z.vida,250);
 });
 prueba('trineos sin pista se sustituyen por cuatro básicos y con pista respetan su fila',()=>{
  const n={...NIVELES_PISCINA[0],oleadas:1,enormes:[],zombis:['zombi-trineo'],fijos:{1:{'zombi-trineo':1}},composicionCompleta:true};
  const sin=new DirectorOleadasPvZ(n,new AzarPvZ(23),ZOMBIS_PVZ).paso(18,{vida:0,inicial:0,pendientes:0,plantas:0});
  assert.equal(sin.apariciones.length,4);assert.ok(sin.apariciones.every(a=>a.tipo==='zombi'&&![2,3].includes(a.fila)));
  const con=new DirectorOleadasPvZ(n,new AzarPvZ(23),ZOMBIS_PVZ).paso(18,{vida:0,inicial:0,pendientes:0,plantas:0,filasHielo:[4]});
  assert.equal(con.apariciones.length,1);assert.equal(con.apariciones[0].tipo,'zombi-trineo');assert.equal(con.apariciones[0].fila,4);
 });
 prueba('una pista demasiado corta no habilita un equipo de trineo en el motor',()=>{
  for(const desde of[780,680]){
   const m=preparado({oleadas:1,enormes:[],zombis:['zombi-trineo'],fijos:{1:{'zombi-trineo':1}},composicionCompleta:true},{sinOleadas:false});
   assert.ok(m.crearPistaHielo(0,desde));pasar(m,18);assert.equal(m.zombis.length,4);
   if(desde===780)assert.ok(m.zombis.every(z=>z.tipo==='zombi'));
   else assert.ok(m.zombis.every(z=>z.tipo==='zombi-trineo'&&z.fila===0));
  }
 });
 prueba('emboscada produce dos o tres casillas únicas de agua, con tipos permitidos y emergencia de medio segundo',()=>{
  for(const indice of[0,1,2,9])for(const semilla of[1,23,108]){
   const m=preparado({...NIVELES_PISCINA[indice],tipo:'normal',cinta:undefined,pesosCinta:undefined,atenuarCinta:undefined,minijuego:undefined},{semilla});
   emboscarPiscinaPvZ(m);assert.equal(m.zombis.length,indice<=1?2:3);
   assert.equal(new Set(m.zombis.map(z=>`${z.fila}:${z.x}`)).size,m.zombis.length);
   for(const z of m.zombis){
    assert.ok([2,3].includes(z.fila));assert.ok([440,520,600,680].includes(z.x));assert.equal(z.datos.emergeHasta,.5);
    assert.ok(['zombi-flotador','caracono-flotador','caracubo-flotador'].includes(z.tipo));
    if(z.tipo==='caracubo-flotador')assert.ok(m.nivel.zombis.includes('caracubo'));
   }
  }
 });
 prueba('emboscada mantiene plantas ocupadas y es determinista para una misma semilla',()=>{
  const a=preparado({id:'3-3'},{semilla:108}),b=preparado({id:'3-3'},{semilla:108});
  for(const m of[a,b]){
   for(const fila of[2,3])for(let col=5;col<9;col++){
    assert.ok(m.plantar('nenufar',fila,col));pasar(m,7.5);
    assert.ok(m.plantar('nuez',fila,col));pasar(m,30);
   }
   emboscarPiscinaPvZ(m);assert.equal(m.plantas.length,16);assert.ok(m.plantas.every(p=>p.vida===m.plantasDef[p.tipo].vida));
  }
  assert.deepEqual(a.estado(),b.estado());
 });
 prueba('la última oleada espera los 2,1 segundos y todos los enemigos de emboscada antes de ganar',()=>{
  const m=preparado({id:'3-1',emboscadaAgua:true,oleadas:1,enormes:[],composicionCompleta:true,fijos:{1:{}}},{sinOleadas:false});
  pasar(m,18);assert.equal(m.oleada,1);assert.equal(m.zombis.length,0);assert.equal(m.terminado,'');
  pasos(m,125);assert.equal(m.zombis.length,0);assert.equal(m.terminado,'');
  pasos(m,1);assert.equal(m.zombis.length,2);assert.equal(m.terminado,'');
  const xs=m.zombis.map(z=>z.x);pasos(m,29);assert.deepEqual(m.zombis.map(z=>z.x),xs);
  pasos(m,2);assert.ok(m.zombis.every((z,i)=>z.x<xs[i]));
  for(const z of m.zombis)m.danarZombi(z,9999,'aplastar');m.paso();assert.equal(m.terminado,'gano');
  assert.equal(m.eventos.filter(e=>e.t==='fin').length,1);m.paso();assert.equal(m.eventos.length,0);
 });
 prueba('sin emboscada configurada una oleada vacía puede finalizar inmediatamente',()=>{
  const m=preparado({oleadas:1,enormes:[],composicionCompleta:true,fijos:{1:{}}},{sinOleadas:false});
  pasar(m,18);assert.equal(m.terminado,'gano');assert.equal(m.zombis.length,0);
 });
 prueba('pista de hielo bloquea siembras de su tramo sin consumir sol ni recarga',()=>{
  const m=preparado();assert.ok(m.crearPistaHielo(0,360));
  const antes=m.estado();assert.equal(m.plantar('nuez',0,5),false);assert.deepEqual(m.estado(),antes);
  assert.ok(m.plantar('lanzaguisantes',0,3));assert.ok(m.plantar('nuez',1,5));
  for(const args of[[2,300],[-1,300],[6,300],[0,-1],[0,801],[0,NaN]]){
   const foto=m.estado();assert.equal(m.crearPistaHielo(...args),null);assert.deepEqual(m.estado(),foto);
  }
 });
 prueba('pistas se extienden hacia la izquierda, se renuevan y snapshots no mutan el motor',()=>{
  const m=preparado(),q=m.crearPistaHielo(0,400);assert.ok(q);pasar(m,10);
  const misma=m.crearPistaHielo(0,500);assert.equal(misma.id,q.id);assert.equal(misma.desde,400);assert.equal(misma.vida,30);
  assert.equal(m.crearPistaHielo(0,320).desde,320);assert.equal(m.pistasHielo.length,1);
  const foto=m.estado();foto.pistasHielo[0].desde=0;foto.pistasHielo[0].vida=999;foto.pistasHielo.length=0;
  assert.equal(m.pistaHielo(0).desde,320);assert.equal(m.pistaHielo(0).vida,30);
 });
 prueba('pista caduca a los treinta segundos activos, emite fin una vez y permite sembrar de nuevo',()=>{
  const m=preparado();m.crearPistaHielo(0,320);pasos(m,1799);assert.ok(m.pistaHielo(0));assert.equal(m.plantar('nuez',0,5),false);
  m.paso();assert.equal(m.pistaHielo(0),undefined);assert.equal(m.pistasHielo.length,0);
  assert.equal(m.eventos.filter(e=>e.t==='terreno'&&e.tipo==='pista-hielo-fin').length,1);assert.ok(m.plantar('nuez',0,5));
  m.paso();assert.equal(m.eventos.filter(e=>e.t==='terreno'&&e.tipo==='pista-hielo-fin').length,0);
 });
 prueba('Jalapeño derrite solo la pista de su fila y daña enemigos sumergidos de esa fila',()=>{
  const m=preparado();assert.ok(m.plantar('jalapeno',0,0));m.crearPistaHielo(0,320);m.crearPistaHielo(1,320);
  const z=inmovilizar(m,m.crearZombi('zombi',0,650)),vecino=inmovilizar(m,m.crearZombi('zombi',1,650));pasar(m,1.1);
  assert.equal(m.pistaHielo(0),undefined);assert.ok(m.pistaHielo(1));assert.equal(z.vida,0);assert.equal(vecino.vida,270);
  assert.ok(m.plantar('nuez',0,5));
  const agua=preparado();assert.ok(agua.plantar('nenufar',2,0));assert.ok(agua.plantar('jalapeno',2,0));
  const buzo=agua.crearZombi('zombi-buzo',2,650);assert.ok(buzo);pasar(agua,.1);assert.equal(buzo.datos.sumergido,1);
  pasar(agua,1);assert.equal(buzo.vida,0);
 });
 prueba('mower común de agua mata en el borde y se hunde antes de alcanzar el resto del carril',()=>{
  const m=preparado(),borde=m.crearZombi('zombi-flotador',2,-16),lejos=inmovilizar(m,m.crearZombi('zombi-flotador',2,200));assert.ok(borde);
  m.paso();assert.equal(borde.vida,0);const c=m.cortacespedes.find(c=>c.fila===2);assert.equal(c.estado,'activo');
  pasar(m,1);assert.equal(c.estado,'gastado');assert.ok(c.x>=50&&c.x<70);assert.equal(lejos.vida,270);
  assert.ok(m.crearZombi('zombi-flotador',2,-59.99));m.paso();assert.equal(m.terminado,'perdio');
 });
 prueba('limpiapiscinas explícito atraviesa agua y el cortacésped terrestre sigue atravesando tierra',()=>{
  for(const [nivel,fila,tipo]of[[{cortacespedAgua:true},2,'zombi-flotador'],[{},0,'zombi']]){
   const m=preparado(nivel);assert.ok(m.crearZombi(tipo,fila,-16));const lejos=inmovilizar(m,m.crearZombi(tipo,fila,200));
   m.paso();pasar(m,1);assert.equal(lejos.vida,0);const c=m.cortacespedes.find(c=>c.fila===fila);assert.equal(c.estado,'activo');assert.ok(c.x>200);
   pasar(m,3);assert.equal(c.estado,'gastado');assert.ok(c.x>850);
  }
 });
 prueba('ningún nivel de piscina concede limpiapiscinas por alcanzar un nivel y un motor final queda inmóvil',()=>{
  assert.ok(NIVELES_PISCINA.every(n=>n.cortacespedAgua!==true));
  const m=preparado();m.crearPistaHielo(0,320);const c=m.cortacespedes.find(c=>c.fila===2);c.estado='gastado';
  assert.ok(m.crearZombi('zombi-flotador',2,-59.99));m.paso();assert.equal(m.terminado,'perdio');const foto=m.estado();
  assert.equal(m.crearPistaHielo(1,400),null);assert.equal(m.quitarHielo(0),false);pasar(m,40);assert.deepEqual(m.estado(),foto);
 });

 const salida=resolve(import.meta.dirname,'../test-results/pvz/piscina');await mkdir(salida,{recursive:true});
 const ok=resultados.every(p=>p.ok);await writeFile(join(salida,'terreno-reglas.json'),JSON.stringify({ok,pruebas:resultados},null,2));
 console.log(ok?'OK':'FALLO',resultados.filter(p=>p.ok).length+'/'+resultados.length,'reglas de terreno de piscina; escenarios preparados sin interfaz');
 if(!ok)process.exitCode=1;
}finally{await rm(temporal,{recursive:true,force:true});}
