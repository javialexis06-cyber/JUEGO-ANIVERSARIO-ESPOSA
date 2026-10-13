import assert from 'node:assert/strict';
import { compilarModulo } from './modulos-prueba.mjs';
const load=async f=>import(await compilarModulo(new URL('../../src/granja-v3/'+f+'.ts',import.meta.url)));
const R=await load('reproduccion-ganado'),{crearGenoma}=await load('genetica'),{crearCuidado,alimentar,consentir,curar}=await load('cuidados'),{DIA}=await load('catalogo');
let checks=0,failures=0;
function test(nombre,f){try{f();checks++;console.log('OK '+nombre);}catch(e){failures++;console.error('FAIL '+nombre+' '+e.stack);}}
const now=1_800_000_000_000;
function refugio(s,especie,clima='templado',id='refugio_'+s.edificios.length){const b={id,articulo:'refugio_'+especie+'_'+clima,x:0,z:0,giro:0,especie,clima,pasto:0,ultimoPastoAt:now};s.edificios.push(b);return b;}
function animal(s,b,sexo='hembra',genoma=crearGenoma('AA','BB','FF','EE')){const a={id:'animal_'+s.animales.length,nombre:'Semilla',especie:b.especie,sexo,genoma,nacimiento:now,edadDias:10,ultimoCruce:null,edificioId:b.id,cuidado:crearCuidado(now),productos:0,ultimoProductoAt:now};s.animales.push(a);return a;}
function preparar(especie='vaca',genes){const s={animales:[],edificios:[],ganaderia:{version:1,incubadoras:[],trufas:[]},jornada:{diasCompletados:0},ultimoTiempo:now},b=refugio(s,especie),m=animal(s,b,'hembra',genes),p=animal(s,b,'macho',genes);return {s,b,m,p};}
function iniciar(s,m,p,genoma=m.genoma,sexo='hembra'){const plan=R.planGestacion(s,m,p);assert.equal(plan.ok,true,plan.mensaje);const g=R.iniciarGestacion(s,m,p,genoma,sexo,plan);assert.ok(g);m.gestacion=g;m.ultimoCruce=p.ultimoCruce=s.ultimoTiempo;return g;}
function cerrar(s,bebe=()=>true,nacer=(m,c)=>animal(s,s.edificios.find(b=>b.id===c.edificioId),c.sexo,c.genoma)){
 const paso=R.avanzarGestaciones(s,s.jornada.diasCompletados+1,s.ultimoTiempo,nacer,bebe);s.jornada.diasCompletados++;return paso;
}

test('Cinco mamíferos productivos; vías ovíparas y unicornio quedan fuera',()=>{
 assert.deepEqual(R.REPRODUCCION_GANADO,{vaca:4,cabra:3,oveja:3,cerdito:3,conejo:2});
 for(const e of ['gallina','pato','avestruz','dinosaurio','dragon','grifo','unicornio'])assert.equal(R.usaGestacion(e),false);
 for(const e of Object.keys(R.REPRODUCCION_GANADO))assert.equal(R.usaGestacion(e),true);
});
test('Plan e inicio son puros; no consumen comida, monedas, fechas ni experiencia',()=>{
 const {s,m,p}=preparar(),antes=structuredClone(s),plan=R.planGestacion(s,m,p);assert.equal(plan.ok,true);
 const g=R.iniciarGestacion(s,m,p,m.genoma,'hembra',plan);assert.ok(g);assert.deepEqual(s,antes);assert.equal(g.dias,0);assert.equal(g.ultimoDia,0);
});
test('Inicio exige padres adultos, cuidados, sexo, especie y refugio compartido',()=>{
 const {s,m,p}=preparar();for(const cambiar of [()=>m.edadDias=0,()=>p.sexo='hembra',()=>p.especie='conejo',()=>p.edificioId='otro',()=>m.cuidado.illnessSince=now,()=>m.cuidado.lastFedAt=now-24*3600000,()=>p.cuidado.lastLovedAt=now-24*3600000]){
  const a=structuredClone(s);cambiar();assert.equal(R.planGestacion(s,m,p).ok,false);Object.assign(m,a.animales[0]);Object.assign(p,a.animales[1]);
 }
});
test('Descanso24h real y madre ocupada impiden repetir el cruce',()=>{
 const {s,m,p}=preparar();iniciar(s,m,p);assert.equal(R.planGestacion(s,m,p).ok,false);delete m.gestacion;assert.equal(R.planGestacion(s,m,p).ok,false);
 s.ultimoTiempo+=DIA;m.cuidado=crearCuidado(s.ultimoTiempo);p.cuidado=crearCuidado(s.ultimoTiempo);assert.equal(R.planGestacion(s,m,p).ok,true);
});
test('Todos los posibles climas se prevén antes del azar',()=>{
 const {s,m,p}=preparar('vaca',crearGenoma('Aa','Bb','Ff','Ee'));
 assert.equal(R.planGestacion(s,m,p).ok,false);refugio(s,'vaca','volcanico');assert.equal(R.planGestacion(s,m,p).ok,false);refugio(s,'vaca','celeste');
 assert.equal(R.planGestacion(s,m,p).ok,true);const g=iniciar(s,m,p,crearGenoma('aa','bb','ff','EE'),'macho');assert.equal(s.edificios.find(b=>b.id===g.cria.edificioId).clima,'volcanico');
});
test('Genoma, sexo, nombre y destino se fijan con copias sin alias parentales',()=>{
 const {s,m,p}=preparar('conejo',crearGenoma('Aa','Bb','FF','Ee'));m.nombre='Nombre que ocupa las treinta y dos letras';const genoma=crearGenoma('aa','bb','FF','ee'),g=iniciar(s,m,p,genoma,'macho'),antes=structuredClone(g);
 genoma.A[0]='A';assert.deepEqual(g,antes);assert.equal(g.cria.nombre.length,32);assert.equal(g.cria.sexo,'macho');assert.notEqual(g.genomaMadre,m.genoma);assert.notEqual(g.genomaPadre,p.genoma);
});
test('Plan obsoleto o genoma que los padres no pueden transmitir no inicia',()=>{
 const {s,m,p}=preparar(),plan=R.planGestacion(s,m,p);assert.equal(R.iniciarGestacion(s,m,p,crearGenoma('aa','BB','FF','EE'),'hembra',plan),undefined);
 p.genoma=crearGenoma('Aa','BB','FF','EE');assert.equal(R.iniciarGestacion(s,m,p,m.genoma,'hembra',plan),undefined);
});
test('La reserva incluye vivos, huevos incubados y cada cría por refugio',()=>{
 const {s,b,m,p}=preparar();iniciar(s,m,p);const aviar=refugio(s,'gallina');s.ganaderia.incubadoras.push({edificioId:aviar.id,grande:false,huevo:{articulo:'huevo_fertil_gallina_00000'}});
 assert.equal(R.plazasGanado(s),4);assert.equal(R.plazasGanado(s,b.id),3);assert.equal(R.plazasGestacion(s),1);assert.equal(R.plazasGestacion(s,aviar.id),0);
});
test('Dos gestaciones simultáneas reservan últimas plazas e impiden una tercera',()=>{
 const {s,b,m,p}=preparar('conejo'),m2=animal(s,b),p2=animal(s,b,'macho');iniciar(s,m,p);iniciar(s,m2,p2);
 assert.equal(R.plazasGanado(s,b.id),6);assert.equal(R.gestacionesValidas(s),true);const adicional=animal(s,b);assert.equal(R.gestacionesValidas(s),false);s.animales.pop();
 delete m2.gestacion;m2.ultimoCruce=p2.ultimoCruce=null;animal(s,b);assert.equal(R.planGestacion(s,m2,p2).ok,false);assert.ok(adicional);
});
test('Límite global240 contempla todas las reservas antes del cruce',()=>{
 const {s,m,p}=preparar();for(let i=2;i<240;i++){const b=refugio(s,'vaca');animal(s,b);}
 assert.equal(R.plazasGanado(s),240);assert.equal(R.planGestacion(s,m,p).ok,false);
});
test('Cada especie nace tras sus noches exactas, manteniendo recién nacido edad0',()=>{
 for(const [especie,noches] of Object.entries(R.REPRODUCCION_GANADO)){
  const {s,m,p}=preparar(especie),g=iniciar(s,m,p,m.genoma,'macho'),destino=structuredClone(g.cria);let nacimientos=0;
  for(let d=1;d<=noches;d++){
   const paso=cerrar(s,()=>true,(madre,c)=>{assert.equal(madre.gestacion,undefined);assert.deepEqual(c,destino);nacimientos++;const a=animal(s,s.edificios.find(b=>b.id===c.edificioId),c.sexo,c.genoma);a.edadDias=0;});
   assert.equal(paso.nacidas,d===noches?1:0);assert.equal(R.gestacionesValidas(s),true);
  }
  assert.equal(nacimientos,1);assert.equal(s.animales.at(-1).edadDias,0);assert.equal(R.plazasGanado(s),3);cerrar(s);assert.equal(nacimientos,1);
 }
});
test('Agua, alimento, atención o enfermedad pausados conservan cría y reserva',()=>{
 const {s,m,p}=preparar('conejo'),g=iniciar(s,m,p),cria=structuredClone(g.cria);
 assert.equal(cerrar(s,()=>false).pausadas,1);assert.equal(g.dias,0);assert.deepEqual(g.cria,cria);
 s.ultimoTiempo+=2*DIA;assert.equal(cerrar(s).pausadas,1);m.cuidado=curar(m.cuidado,s.ultimoTiempo);assert.equal(cerrar(s).avanzadas,1);assert.equal(R.plazasGestacion(s),1);assert.equal(cerrar(s).nacidas,1);
});
test('Una revisión de noche repetida nunca bebe ni avanza dos veces',()=>{
 const {s,m,p}=preparar(),g=iniciar(s,m,p);let consultas=0;const bebe=()=>{consultas++;return false;};
 assert.equal(R.avanzarGestaciones(s,1,now,()=>{},bebe).pausadas,1);assert.equal(R.avanzarGestaciones(s,1,now,()=>{},bebe).pausadas,0);assert.equal(consultas,1);assert.equal(g.dias,0);assert.equal(g.ultimoDia,1);
});
test('Horas reales y un salto calendario no fabrican crecimiento offline',()=>{
 const {s,m,p}=preparar(),g=iniciar(s,m,p),antes=structuredClone(g);s.ultimoTiempo+=100*DIA;
 assert.deepEqual(g,antes);assert.deepEqual(R.avanzarGestaciones(s,1000,s.ultimoTiempo,()=>assert.fail('nació offline'),()=>true),{avanzadas:0,pausadas:0,nacidas:0});assert.deepEqual(g,antes);
});
test('Recarga conserva el resultado y progreso exacto, sin nuevas tiradas',()=>{
 const {s,m,p}=preparar('cerdito',crearGenoma('Aa','Bb','FF','Ee'));iniciar(s,m,p,crearGenoma('aa','bb','FF','ee'),'macho');cerrar(s);const recargado=JSON.parse(JSON.stringify(s));
 assert.equal(R.gestacionesValidas(recargado),true);assert.deepEqual(recargado.animales[0].gestacion,s.animales[0].gestacion);cerrar(recargado);let cria;
 cerrar(recargado,()=>true,(madre,c)=>{cria=c;animal(recargado,recargado.edificios.find(b=>b.id===c.edificioId),c.sexo,c.genoma);});assert.equal(cria.sexo,'macho');assert.deepEqual(cria.genoma,crearGenoma('aa','bb','FF','ee'));
});
test('Trasladar madre conserva el destino reservado y sus genes',()=>{
 const {s,m,p}=preparar(),g=iniciar(s,m,p),destino=g.cria.edificioId,otro=refugio(s,'vaca');m.edificioId=otro.id;
 assert.equal(R.gestacionesValidas(s),true);assert.equal(R.plazasGanado(s,destino),2);assert.equal(R.plazasGanado(s,otro.id),1);assert.equal(g.cria.edificioId,destino);
});
test('Refugio reservado retirado, cambiado de especie o clima incompatible se rechaza',()=>{
 const {s,m,p}=preparar('vaca',crearGenoma('Aa','Bb','Ff','Ee'));refugio(s,'vaca','volcanico');refugio(s,'vaca','celeste');const g=iniciar(s,m,p,crearGenoma('Aa','Bb','ff','EE')),b=s.edificios.find(b=>b.id===g.cria.edificioId),antes=structuredClone(b);
 b.clima='templado';assert.equal(R.gestacionesValidas(s),false);Object.assign(b,antes);b.especie='conejo';assert.equal(R.gestacionesValidas(s),false);Object.assign(b,antes);s.edificios=s.edificios.filter(x=>x!==b);assert.equal(R.gestacionesValidas(s),false);
});
test('Ausencia de campo conserva V5; null, listas y campos presentes corruptos fallan',()=>{
 const {s,m,p}=preparar();assert.equal(R.gestacionesValidas(s),true);iniciar(s,m,p);const base=structuredClone(m.gestacion);
 const corruptos=[null,[],{}, {...base,version:2},{...base,dias:-1},{...base,dias:4},{...base,dias:.5},{...base,inicioDia:1},{...base,ultimoDia:1},{...base,inicioAt:now+1},{...base,padreId:m.id},{...base,genomaMadre:crearGenoma('aa','BB','FF','EE')},{...base,cria:{...base.cria,sexo:'otro'}},{...base,cria:{...base.cria,nombre:''}},{...base,cria:{...base.cria,genoma:crearGenoma('aa','BB','FF','EE')}},{...base,cria:{...base.cria,genoma:{A:['A','A'],B:['B','B'],F:['F','F'],E:['E','E'],X:['X','X']}}}];
 for(const mal of corruptos){m.gestacion=mal;assert.equal(R.gestacionesValidas(s),false,JSON.stringify(mal));}m.gestacion=base;assert.equal(R.gestacionesValidas(s),true);
});
test('Padre ausente o genoma de progenitor alterado no crea parentesco imposible',()=>{
 const {s,m,p}=preparar();iniciar(s,m,p);p.genoma=crearGenoma('aa','BB','FF','EE');assert.equal(R.gestacionesValidas(s),false);p.genoma=crearGenoma('AA','BB','FF','EE');s.animales=s.animales.filter(a=>a!==p);assert.equal(R.gestacionesValidas(s),false);
});
test('Padre puede volver a criar tras su descanso sin invalidar embarazo anterior',()=>{
 const {s,m,p}=preparar();iniciar(s,m,p);s.ultimoTiempo+=DIA;p.ultimoCruce=s.ultimoTiempo;assert.equal(R.gestacionesValidas(s),true);
});
test('La reserva se consume antes del nacimiento y nunca sobreocupa dos partos',()=>{
 const {s,b,m,p}=preparar('conejo'),m2=animal(s,b),p2=animal(s,b,'macho');iniciar(s,m,p);iniciar(s,m2,p2);cerrar(s);
 const paso=cerrar(s,()=>true,(madre,c)=>{assert.equal(R.plazasGanado(s,b.id),5);animal(s,b,c.sexo,c.genoma);assert.equal(R.plazasGanado(s,b.id),6);});assert.equal(paso.nacidas,2);assert.equal(s.animales.length,6);assert.equal(R.gestacionesValidas(s),true);
});
test('Resumen ofrece progreso y destino sin mutar el embarazo',()=>{
 const {s,m,p}=preparar('cabra');assert.equal(R.resumenGestacion(m),null);iniciar(s,m,p);cerrar(s);const antes=structuredClone(s);
 assert.deepEqual(R.resumenGestacion(m),{dias:1,total:3,pendientes:2,destino:m.gestacion.cria.edificioId});assert.deepEqual(s,antes);
});
console.log(JSON.stringify({suite:'gestacion-ganado',checks,failures}));if(failures)process.exitCode=1;
