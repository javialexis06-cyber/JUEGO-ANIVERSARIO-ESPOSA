/** Plantas de niebla: escenarios preparados con colisiones reales; sin arte ni partidas del usuario. */
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const temporal=await mkdtemp(join(tmpdir(),'pvz-plantas-niebla-')),resultados=[];
const salida=resolve(import.meta.dirname,'../test-results/pvz/plantas-niebla');let completo=false,errorFinal;
try{
 const modulo=join(temporal,'motor.mjs');
 await build({stdin:{contents:"export * from './src/jardin/pvz/motor/motor';export * from './src/jardin/pvz/datos/niebla';export * from './src/jardin/pvz/datos/plantas';export * from './src/jardin/pvz/datos/zombis';",resolveDir:resolve(import.meta.dirname,'..')},outfile:modulo,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const {MotorPvZ,PLANTAS_NIEBLA,PLANTAS_PVZ,ZOMBIS_PVZ}=await import(pathToFileURL(modulo));
 const quieto={...ZOMBIS_PVZ.zombi,id:'blanco-preparado',vida:10000,velocidad:0,mordida:0,agua:'tambien'};
 const metal={...quieto,id:'metal-preparado',armadura:{tipo:'casco',vida:1100,metal:true}};
 const preparado=(semillas,nivel={},registros={})=>new MotorPvZ({id:'prueba-plantas-niebla',parte:1,area:'niebla',filas:[0,1,2,3,4,5],filasAgua:[2,3],niebla:5,solInicial:10000,sinSolCielo:true,zombis:[],banderas:1,tipo:'normal',...nivel},{sinOleadas:true,semillas,semilla:23},{zombis:{...ZOMBIS_PVZ,[quieto.id]:quieto,[metal.id]:metal},...registros});
 const prueba=(nombre,fn)=>{fn();resultados.push({nombre,ok:true});console.log('OK',nombre);};
 const pasos=(m,n)=>{const eventos=[];for(let i=0;i<n;i++){m.paso();eventos.push(...m.consumirEventos());}return eventos;};
 const segundos=(m,s)=>pasos(m,Math.ceil(s*60));
 const plantar=(m,t,f=0,c=0)=>{assert.ok(m.plantar(t,f,c),`siembra preparada ${t} en ${f}:${c}`);return m.plantaEn(f,c,PLANTAS_PVZ[t].capa??'principal');};
 const blanco=(m,f,x,metalico=false)=>{const z=m.crearZombi(metalico?metal.id:quieto.id,f,x);assert.ok(z);return z;};

 prueba('ocho plantas de niebla con costes y capas de la primera aventura',()=>{
  assert.deepEqual(PLANTAS_NIEBLA.map(p=>p.id),['marseta','planterna','cactus','trebolador','bipetidora','frustrella','calabaza','magnetoseta']);
  assert.deepEqual(PLANTAS_NIEBLA.map(p=>p.sol),[0,25,125,100,125,125,125,100]);
  assert.equal(PLANTAS_PVZ.calabaza.capa,'cubierta');assert.equal(PLANTAS_PVZ.calabaza.vida,4000);
 });
 prueba('Marseta necesita agua libre y no admite apoyo de Nenúfar',()=>{
  const m=preparado(['marseta','nenufar']);assert.equal(m.plantar('marseta',0,0),false);plantar(m,'nenufar',2,0);
  const antes=m.estado();assert.equal(m.plantar('marseta',2,0),false);assert.deepEqual(m.estado(),antes);
  const p=plantar(m,'marseta',2,1);assert.equal(p.dormida,false);assert.equal(m.sol,9975);
 });
 prueba('Marseta limita las esporas a tres casillas y daña veinte',()=>{
  const m=preparado(['marseta']),p=plantar(m,'marseta',2,0),cerca=blanco(m,2,260),lejos=blanco(m,2,310);p.datos.reloj=0;
  segundos(m,1);assert.equal(cerca.vida,9980);assert.equal(lejos.vida,10000);assert.equal(m.proyectiles.length,0);
 });
 prueba('Marseta conserva recarga de treinta segundos pese a no costar sol',()=>{
  const m=preparado(['marseta']);plantar(m,'marseta',2,0);segundos(m,29.9);assert.equal(m.plantar('marseta',2,1),false);
  segundos(m,.2);assert.ok(m.plantar('marseta',2,1));
 });
 prueba('Marseta y Magnetoseta duermen de día sin ejecutar sus habilidades',()=>{
  for(const tipo of['marseta','magnetoseta']){
   const m=preparado([tipo],{area:'piscina'}),p=plantar(m,tipo,tipo==='marseta'?2:0,0),z=blanco(m,p.fila,200,true);
   assert.ok(p.dormida);segundos(m,2);assert.equal(z.armadura,1100);assert.equal(z.vida,10000);assert.equal(m.proyectiles.length,0);
  }
 });
 prueba('Planterna revela su casilla y su muerte devuelve la niebla',()=>{
  const m=preparado(['planterna']);assert.equal(m.estaIluminado(1,7),false);const p=plantar(m,'planterna',1,7);
  assert.equal(m.estaIluminado(1,7),true);m.danarPlanta(p,300);assert.equal(m.estaIluminado(1,7),false);
 });
 prueba('Cactus alto dispara al globo sin chocar con el enemigo terrestre anterior',()=>{
  const m=preparado(['cactus']),p=plantar(m,'cactus'),tierra=blanco(m,0,220),aire=m.crearZombi('zombi-globo',0,400);assert.ok(aire);aire.datos.velocidad=0;p.datos.reloj=0;
  pasos(m,1);assert.equal(p.datos.alto,1);assert.ok(m.proyectiles.some(q=>q.origen===p.id&&q.aereo===true));
  segundos(m,1.25);assert.equal(tierra.vida,10000);assert.ok(aire.datos.sinGlobo||!m.esVolador(aire));
 });
 prueba('Cactus bajo usa pinchos de veinte contra blancos terrestres',()=>{
  const m=preparado(['cactus']),p=plantar(m,'cactus'),z=blanco(m,0,400);p.datos.reloj=0;
  segundos(m,1.2);assert.equal(p.datos.alto,0);assert.equal(z.vida,9980);
 });
 prueba('Trebolador espera medio segundo, elimina globos y conserva a los terrestres',()=>{
  const m=preparado(['trebolador']),p=plantar(m,'trebolador'),tierra=blanco(m,0,500),aire=m.crearZombi('zombi-globo',5,500);assert.ok(aire);
  segundos(m,.48);assert.ok(aire.vida>0);segundos(m,.04);assert.equal(aire.vida,0);assert.equal(tierra.vida,10000);assert.ok(p.vida>0);
  segundos(m,2);assert.equal(p.vida,0);
 });
 prueba('Trebolador retira la niebla y conserva cuarenta segundos de cuenta regresiva',()=>{
  const m=preparado(['trebolador']);const p=plantar(m,'trebolador');segundos(m,.6);
  assert.ok(m.estado().niebla.retirada>39);assert.ok(m.estado().niebla.desplazamiento>500);
  segundos(m,30);assert.equal(p.vida,0);assert.ok(m.estado().niebla.retirada>9);assert.ok(m.estado().niebla.desplazamiento>0);
  segundos(m,10);assert.equal(m.estado().niebla.retirada,0);assert.equal(m.estado().niebla.desplazamiento,0);
 });
 prueba('Bipetidora dispara uno hacia delante y una pareja hacia atrás',()=>{
  const m=preparado(['bipetidora']),p=plantar(m,'bipetidora',0,4),frente=blanco(m,0,600),atras=blanco(m,0,100);p.datos.relojFrente=0;p.datos.relojAtras=0;
  const e=segundos(m,.15).filter(e=>e.t==='disparo'&&e.id===p.id);assert.equal(e.length,3);
  assert.equal(m.proyectiles.filter(q=>q.velocidad<0).length,2);assert.equal(m.proyectiles.filter(q=>q.velocidad>0).length,1);
  segundos(m,1);assert.equal(frente.vida,9980);assert.equal(atras.vida,9960);
 });
 prueba('Bipetidora no gasta disparos en el lado sin enemigos',()=>{
  for(const atras of[false,true]){
   const m=preparado(['bipetidora']),p=plantar(m,'bipetidora',0,4);blanco(m,0,atras?100:600);p.datos.relojFrente=0;p.datos.relojAtras=0;
   const e=segundos(m,.15).filter(e=>e.t==='disparo');assert.equal(e.length,atras?2:1);
   assert.ok(m.proyectiles.every(q=>atras?q.velocidad<0:q.velocidad>0));
  }
 });
 prueba('Frustrella emite cinco rayos y no tiene un disparo recto hacia delante',()=>{
  const m=preparado(['frustrella'],{filasAgua:[]}),p=plantar(m,'frustrella',3,4);blanco(m,3,100);p.datos.reloj=0;pasos(m,1);
  const q=m.proyectiles.filter(q=>q.origen===p.id);assert.equal(q.length,5);assert.ok(q.every(q=>q.tipo==='estrella'&&q.dano===20));
  assert.equal(q.filter(q=>q.velocidad<0&&q.velocidadY===0).length,1);assert.equal(q.filter(q=>q.velocidad===0).length,2);
  assert.equal(q.filter(q=>q.velocidad>0&&q.velocidadY===0).length,0);
 });
 prueba('Las estrellas verticales alcanzan otra fila pero dejan intacto un enemigo frontal de la misma',()=>{
  const m=preparado(['frustrella'],{filasAgua:[]}),p=plantar(m,'frustrella',3,3),arriba=blanco(m,1,p.x),frente=blanco(m,3,600);p.datos.reloj=0;
  segundos(m,.8);assert.equal(arriba.vida,9980);assert.equal(frente.vida,10000);
 });
 prueba('Las diagonales de estrella cruzan filas con el ángulo de treinta grados',()=>{
  const m=preparado(['frustrella'],{filasAgua:[]}),p=plantar(m,'frustrella',3,3),x=p.x+30+m.altoFila/Math.tan(Math.PI/6),z=blanco(m,4,x);p.datos.reloj=0;
  segundos(m,.7);assert.equal(z.vida,9980);
 });
 prueba('Calabaza recibe las mordidas antes que su planta principal y no transfiere daño sobrante',()=>{
  const m=preparado(['calabaza','lanzaguisantes']),interior=plantar(m,'lanzaguisantes',0,3),c=plantar(m,'calabaza',0,3),z=m.crearZombi('zombi',0,c.x);assert.ok(z);
  segundos(m,1);assert.ok(Math.abs(c.vida-3900)<1e-7);assert.equal(interior.vida,300);
  m.danarPlanta(c,10000);assert.equal(c.vida,0);assert.equal(interior.vida,300);
 });
 prueba('Calabaza puede preceder a la planta interior y la pala retira primero la cubierta',()=>{
  const m=preparado(['calabaza','lanzaguisantes']),c=plantar(m,'calabaza',0,3),interior=plantar(m,'lanzaguisantes',0,3);
  assert.ok(m.quitar(0,3));assert.equal(c.vida,0);assert.equal(interior.vida,300);assert.equal(m.plantaEn(0,3),interior);
  assert.ok(m.quitar(0,3));assert.equal(interior.vida,0);
 });
 prueba('Calabaza en agua exige Nenúfar y no puede envolver una Marseta sin él',()=>{
  const m=preparado(['calabaza','marseta','nenufar']);plantar(m,'marseta',2,0);const antes=m.estado();assert.equal(m.plantar('calabaza',2,0),false);assert.deepEqual(m.estado(),antes);
  plantar(m,'nenufar',2,1);assert.ok(m.plantar('calabaza',2,1));
 });
 prueba('Magnetoseta retira un casco sin herir el cuerpo y espera quince segundos entre objetos',()=>{
  const m=preparado(['magnetoseta']),p=plantar(m,'magnetoseta',0,3),a=blanco(m,0,400,true),b=blanco(m,0,450,true);pasos(m,1);
  assert.equal(a.armadura,0);assert.equal(a.vida,10000);assert.equal(b.armadura,1100);assert.equal(p.datos.objeto,a.id);
  segundos(m,14.9);assert.equal(b.armadura,1100);segundos(m,.2);assert.equal(b.armadura,0);assert.equal(b.vida,10000);
 });
 prueba('Magnetoseta no roba el cono ni el periódico ni gasta su recarga sin objeto metálico',()=>{
  const m=preparado(['magnetoseta']),p=plantar(m,'magnetoseta',0,3),cono=m.crearZombi('caracono',0,400),periodico=m.crearZombi('zombi-periodico',0,420);assert.ok(cono&&periodico);pasos(m,1);
  assert.equal(cono.armadura,370);assert.equal(periodico.armadura,150);assert.equal(p.datos.carga,0);
  const z=blanco(m,0,450,true);pasos(m,1);assert.equal(z.armadura,0);
 });
 prueba('Magnetoseta respeta alcance y amplía su radio sobre un enemigo que está comiendo',()=>{
  for(const comiendo of[false,true]){
   const m=preparado(['magnetoseta']);plantar(m,'magnetoseta',0,3);const z=blanco(m,0,550,true);if(comiendo)z.comiendo=123;pasos(m,1);
   assert.equal(z.armadura,comiendo?0:1100);
  }
  const m=preparado(['magnetoseta']);plantar(m,'magnetoseta',0,3);const otra=blanco(m,3,280,true);otra.comiendo=123;pasos(m,1);assert.equal(otra.armadura,1100);
 });
 prueba('Magnetoseta desarma caja, pico y pogo por sus contratos propios',()=>{
  for(const [tipo,bandera]of[['zombi-cajita','caja'],['zombi-minero','pico'],['zombi-pogo','pogo']]){
   const m=preparado(['magnetoseta']);plantar(m,'magnetoseta',0,3);const z=m.crearZombi(tipo,0,400);assert.ok(z);assert.equal(z.datos[bandera],1);pasos(m,1);assert.equal(z.datos[bandera],0,tipo);assert.ok(z.vida>0);
  }
 });
 prueba('Magnetoseta no detiene una caja que ya se está abriendo',()=>{
  const m=preparado(['magnetoseta']),p=plantar(m,'magnetoseta',0,3),z=m.crearZombi('zombi-cajita',0,400);assert.ok(z);z.datos.cajaAbriendo=1;pasos(m,1);
  assert.equal(z.datos.caja,1);assert.equal(p.datos.carga,0);
 });
 prueba('Las ocho plantas nuevas rechazan abono sin una regla registrada ni consumen cargas',()=>{
  const ids=PLANTAS_NIEBLA.map(p=>p.id),m=preparado(ids);m.abono=3;
  for(const [i,t]of ids.entries()){
   const p=plantar(m,t,t==='marseta'?2:0,t==='marseta'?0:i);assert.equal(m.usarAbono(p.id),false);
  }
  assert.equal(m.abono,3);
 });
 completo=true;console.log('OK',resultados.length,'reglas preparadas de plantas de niebla');
}catch(error){errorFinal=String(error?.stack??error);throw error;}
finally{
 await mkdir(salida,{recursive:true});await writeFile(join(salida,'resultado.json'),JSON.stringify({ok:completo,pruebas:resultados,...(errorFinal?{error:errorFinal}:{})},null,2));
 await rm(temporal,{recursive:true,force:true});
}
