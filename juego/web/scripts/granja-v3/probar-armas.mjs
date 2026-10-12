import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const dir=await mkdtemp(join(tmpdir(),'granja-armas-'));
let checks=0;
try {
 const bundle=async name=>{const outfile=join(dir,name+'.mjs');await build({entryPoints:[fileURLToPath(new URL('../../src/granja-v3/'+name+'.ts',import.meta.url))],outfile,bundle:true,platform:'node',format:'esm',logLevel:'silent'});return import(pathToFileURL(outfile).href);};
 const A=await bundle('aventura'),{MotorGranja,validarEstado,migrarEstado}=await bundle('motor');
 const {distribuirInventario,resumirCasillas}=await bundle('inventario'),{obtenerReceta}=await bundle('objetos');
 const P=await bundle('produccion');
 const test=(nombre,fn)=>{fn();checks++;console.log('OK '+nombre);};
 function campo(){
  const e=A.crearAventura();assert.equal(A.entrarAventura(e,'mina_celia',{x:0,z:0}).ok,true);
  const i=A.instanciaAventura(e),m=i.monstruos[0];i.monstruos=[m];
  for(let z=-5;z<=5;z++)for(let x=-5;x<=10;x++)i.suelos[`${x},${z}`]='suelo';
  Object.assign(m,{x:4.5,z:.5,hp:100,hpMax:100,invulnerable:0,fase:'reposo',tiempoFase:10,origen:{x:4.5,z:.5},objetivo:{x:4.5,z:.5},retroceso:{x:0,z:0},vivo:true});
  return {e,i,m,p:{x:.5,z:.5}};
 }
 const paso=(e,p,n=10)=>{for(let k=0;k<n;k++)A.stepAventura(e,.1,p);};
 function motor(arma='arco_ribera',flechas=5){
  const g=new MotorGranja({ahora:()=>1_800_000_000_000,azar:()=>.25}),c=campo();g.estado.aventura=c.e;g.estado.posicionAventura=c.p;
  g.estado.casillasInventario=distribuirInventario({[arma]:1,...(flechas?{flecha_ribera:flechas}:{})},24).casillas;g.estado.inventario=resumirCasillas(g.estado.casillasInventario);g.estado.filaBarra=0;g.estado.casillaActiva=0;g.estado.herramienta='espada';return {g,...c};
 }
 const atacar=({g,m,p})=>g.actuar({tipo:'accion_aventura',objetivo:'monstruo',id:m.id,xJugador:p.x,zJugador:p.z});
 test('El arco viaja, puede fallar y no concede dominio por lanzar',()=>{
  const {e,m,p}=campo();assert.equal(A.atacarConArma(e,m.id,p,'arco').ok,true);assert.equal(m.hp,100);assert.equal(e.dominioArmas?.arco,undefined);
  m.z=4.5;paso(e,p);assert.equal(m.hp,100);assert.equal(e.proyectiles.length,0);assert.equal(e.dominioArmas?.arco,undefined);
 });
 test('La trayectoria golpea al primer enemigo y un muro la detiene',()=>{
  const {e,i,m,p}=campo();const primero=structuredClone(m);primero.id='primero';primero.x=2.5;i.monstruos.unshift(primero);
  assert.equal(A.atacarConArma(e,m.id,p,'baston').ok,true);paso(e,p);assert.ok(primero.hp<100);assert.equal(m.hp,100);
  const c=campo();assert.equal(A.atacarConArma(c.e,c.m.id,c.p,'arco').ok,true);c.i.suelos['2,0']='muro';paso(c.e,c.p);assert.equal(c.m.hp,100);assert.equal(c.e.proyectiles.length,0);
 });
 test('Invocaciones finitas, una activa, diferentes funciones y sin avance fuera del juego',()=>{
  for(const modo of ['sello_fuego','sello_agua','sello_tierra','sello_aire']){
   const c=campo();assert.equal(A.atacarConArma(c.e,c.m.id,c.p,modo).ok,true);c.e.enfriamientoGolpe=0;
   assert.equal(A.atacarConArma(c.e,c.m.id,c.p,modo).ok,false);assert.equal(c.e.invocacion.restante,8);
   A.stepAventura(c.e,0,c.p);A.stepAventura(c.e,NaN,c.p);assert.equal(c.e.invocacion.restante,8);
   paso(c.e,c.p,85);assert.equal(c.e.invocacion,null);assert.ok(c.m.hp<100);
  }
 });
 test('Salir y cambiar de piso cancelan efectos sin borrar dominio',()=>{
  const c=campo();assert.equal(A.atacarConArma(c.e,c.m.id,c.p,'sello_aire').ok,true);c.e.dominioArmas={arco:30};A.salirAventura(c.e);assert.equal(c.e.invocacion,null);assert.deepEqual(c.e.proyectiles,[]);assert.equal(c.e.dominioArmas.arco,30);
  const d=campo();assert.equal(A.atacarConArma(d.e,d.m.id,d.p,'arco').ok,true);d.i.entradas.push({id:'descenso_prueba',tipo:'descenso',etiqueta:'Bajar',...d.p});assert.equal(A.descenderAventura(d.e,d.p).ok,true);assert.deepEqual(d.e.proyectiles,[]);
 });
 test('Dominio limitado a tres rangos e importación estricta de efectos',()=>{
  const c=campo();c.e.dominioArmas={arco:90};assert.equal(A.rangoArma(c.e,'arco'),3);assert.equal(A.atacarConArma(c.e,c.m.id,c.p,'arco').ok,true);paso(c.e,c.p);assert.equal(c.e.dominioArmas.arco,90);assert.equal(A.errorAventura(c.e),null);
  for(const modificar of [e=>e.dominioArmas.arco=91,e=>e.dominioArmas.inventado=1,e=>e.proyectiles=[{id:1,modo:'arco',x:0,z:0,direccion:{x:5,z:0},restante:1,dano:12}],e=>e.invocacion={modo:'espada',x:0,z:0,restante:8,espera:0,dano:10}]){const mal=structuredClone(c.e);modificar(mal);assert.ok(A.errorAventura(mal));}
 });
 test('Munición, energía y rechazo son transaccionales en el motor real',()=>{
  const c=motor();assert.equal(atacar(c).ok,true);assert.equal(c.g.estado.inventario.flecha_ribera,4);assert.equal(c.g.estado.energia,99);assert.equal(c.m.hp,100);
  const antes=structuredClone(c.g.estado);assert.equal(atacar(c).ok,false);assert.deepEqual(c.g.estado,antes);
  for(const configurar of [c=>c.g.estado.energia=0,c=>{c.m.x=10.5;},c=>{c.i.suelos['2,0']='muro';}]){const d=motor();configurar(d);const original=structuredClone(d.g.estado);assert.equal(atacar(d).ok,false);assert.deepEqual(d.g.estado,original);}
  const vacio=motor('arco_ribera',0);assert.equal(atacar(vacio).ok,false);assert.equal(vacio.g.estado.energia,100);
 });
 test('Una baja por proyectil se contabiliza una sola vez y conserva el botín',()=>{
  const c=motor();c.m.hp=1;assert.equal(atacar(c).ok,true);for(let k=0;k<10;k++)c.g.pasoAventura(.1,c.p.x,c.p.z);
  assert.equal(c.g.estado.aventura.derrotados,1);assert.equal(c.g.estado.estadisticas.monstruos,1);assert.equal(c.g.estado.aventura.dominioArmas.arco,1);const botin=c.i.botin.length;
  for(let k=0;k<20;k++)c.g.pasoAventura(.1,c.p.x,c.p.z);assert.equal(c.g.estado.estadisticas.monstruos,1);assert.equal(c.i.botin.length,botin);
 });
 test('Guardar y recargar una ráfaga conserva munición, duración y partida V5',()=>{
  const c=motor('baston_cuarzo');assert.equal(atacar(c).ok,true);const antes=structuredClone(c.g.estado);assert.equal(validarEstado(antes),null);
  const migrado=migrarEstado(antes);assert.deepEqual(migrado.aventura,antes.aventura);assert.equal(migrado.energia,97);
  const vieja=structuredClone(antes);delete vieja.aventura.proyectiles;delete vieja.aventura.invocacion;delete vieja.aventura.dominioArmas;assert.equal(validarEstado(vieja),null);assert.equal(migrarEstado(vieja).version,5);
 });
 test('Todas las familias tienen fabricación pagada con materiales iniciales',()=>{
  for(const id of ['arco_ribera','baston_cuarzo','sello_fuego','sello_agua','sello_tierra','sello_aire']){const r=obtenerReceta(id);assert.equal(r.estacion,'banco_trabajo');assert.equal(r.nivel,0);assert.equal(r.salida.cantidad,1);assert.equal(r.duracionMs,30000);assert.ok(Object.values(r.ingredientes).every(n=>n>0));
   const e=P.crearProduccion(0);e.maquinas.push({id:'banco',articulo:'banco_trabajo',zona:'granja',x:0,z:0,recetaId:null,cola:[],proceso:null,salida:Array(4).fill(null)});
   const c={casillas:distribuirInventario(r.ingredientes,24).casillas,nivel:0,ahora:0,zona:'granja'},res=P.aplicarProduccion(e,{tipo:'encolar_receta',id:'banco',recetaId:id},c);assert.ok(res.ok,res.mensaje);assert.deepEqual(resumirCasillas(res.casillas),{});
   const fin=P.avanzarProduccion(res.estado,30000,{...c,casillas:res.casillas});assert.equal(resumirCasillas(fin.estado.maquinas[0].salida)[id],1);assert.equal(P.errorProduccion(fin.estado),null);
   const otra=P.avanzarProduccion(fin.estado,60000,{...c,casillas:fin.casillas});assert.equal(resumirCasillas(otra.estado.maquinas[0].salida)[id],1);
  }
  assert.deepEqual(obtenerReceta('flechas_ribera').salida,{articulo:'flecha_ribera',cantidad:4});
 });
 console.log(JSON.stringify({checks,fallos:0}));
} finally {await rm(dir,{recursive:true,force:true});}
