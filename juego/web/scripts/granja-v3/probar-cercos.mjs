import {compilarModulo} from './modulos-prueba.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const load=async n=>import(await compilarModulo(new URL('../../src/granja-v3/'+n+'.ts',import.meta.url)));
const {MotorGranja,validarEstado}=await load('motor'),T=await load('transito'),C=await load('cercos'),P=await load('compania'),I=await load('inventario'),{HORA}=await load('catalogo');
let now=1_800_000_000_000,checks=0,failures=0;
const game=()=>{const m=new MotorGranja({ahora:()=>now,azar:()=>.1});m.estado.obstaculos=[];m.estado.sectorIds=Array.from({length:30},(_,i)=>i);m.estado.desbloqueos.push('companeros','montura');return m;};
const act=(m,a)=>{const r=m.actuar(a);assert.ok(r.ok,r.mensaje);return r;};
const fail=(m,a)=>{const antes=structuredClone(m.estado),r=m.actuar(a);assert.equal(r.ok,false,r.mensaje);assert.deepEqual(m.estado,antes);};
const give=(m,id,n=1)=>{const casillas=I.cambiarCantidad(m.estado.casillasInventario,id,n,0);assert.ok(casillas);m.estado.casillasInventario=casillas;m.estado.inventario=I.resumirCasillas(m.estado.casillasInventario);};
function test(t,f){try{f();checks++;console.log('OK '+t);}catch(e){failures++;console.error('FAIL '+t+' '+e.stack);}}
function sitio(m,w=2,d=2){for(let z=10;z<38;z++)for(let x=8;x<30;x++)if(Array.from({length:d},(_,dz)=>Array.from({length:w},(_,dx)=>m.celdaLibre(x+dx,z+dz))).flat().every(Boolean))return{x,z};throw Error('Sin terreno de prueba');}
function build(m,id,x,z,giro=0){give(m,'creacion_'+id);act(m,{tipo:'construir',articulo:id,x,z,giro});return m.estado.edificios.at(-1);}
const gate=(m,b,abierto,p={x:b.x-1,z:b.z+.5})=>({tipo:'porton',edificioId:b.id,abierto,xJugador:p.x,zJugador:p.z});
const get=(m,id)=>m.estado.edificios.find(b=>b.id===id),pet=(m,id)=>m.estado.compania.animales.find(a=>a.id===id);
function adoptar(m,tipo='caballo'){
 const sitioH=sitio(m,7,10),id=tipo==='caballo'?'establo':'hogar_mascota';
 const b=build(m,id,sitioH.x,sitioH.z);
 m.estado.monedas=1000;m.estado.zona='pueblo';m.estado.servicio='animales';m.estado.jornada.minutos=720;
 act(m,{tipo:'compania',accion:{tipo:'adoptar',animal:tipo,variante:0,nombre:'Brisa',edificioId:b.id},xJugador:79,zJugador:0});
 m.estado.zona='granja';m.estado.servicio=null;return m.estado.compania.animales.at(-1);
}
function recinto(m){
 for(let z=10;z<36;z++)for(let x=8;x<29;x++){
  const ancho=7,fondo=8,puntos=[];
  for(let dz=0;dz<fondo;dz++)if(dz!==3&&dz!==4)puntos.push([x,z+dz]);
  for(let dz=0;dz<fondo;dz++)puntos.push([x+ancho-1,z+dz]);
  for(let dx=1;dx<ancho-1;dx++)puntos.push([x+dx,z],[x+dx,z+fondo-1]);
  if(!Array.from({length:fondo},(_,dz)=>Array.from({length:ancho},(_,dx)=>m.celdaLibre(x+dx,z+dz))).flat().every(Boolean))continue;
  const porton=build(m,'porton',x,z+3,1),vallas=puntos.map(([xx,zz])=>build(m,'valla_madera',xx,zz));
  return{porton,vallas,x,z,jugador:{x:x-5,z:z+3.5},dentro:{x:x+3.5,z:z+3.5}};
 }throw Error('Sin recinto despejado');
}
const llamada=(a,p)=>({tipo:'compania',accion:{tipo:'llamar',id:a.id},xJugador:p.x,zJugador:p.z});
test('V5 y portones anteriores conservan apertura, coordenadas, genes y economía',()=>{
 const m=game(),p=sitio(m),b=build(m,'porton',p.x,p.z),s=JSON.parse(m.exportar());delete s.edificios.at(-1).portonAbierto;
 const n=game();assert.ok(n.cargarJSON(JSON.stringify(s)).ok);assert.ok(C.portonAbierto(get(n,b.id)));assert.deepEqual(n.estado.edificios,s.edificios);for(const k of ['animales','inventario','jornada','monedas'])assert.deepEqual(n.estado[k],s[k]);
});
test('Tres vallas bloquean su casilla en las cuatro orientaciones; los caminos conservan el paso',()=>{
 for(const tipo of ['valla_madera','valla_piedra','valla_floral','suelo_madera'])for(let giro=0;giro<4;giro++){const m=game(),p=sitio(m),b=build(m,tipo,p.x,p.z,giro);assert.equal(T.celdaTransitable(m.estado,b.x,b.z),tipo==='suelo_madera');assert.equal(T.celdaTransitable(m.estado,-61,3,'bosque'),true);}
});
test('El portón usa sus dos casillas originales y libera ambas al abrir, en cuatro giros',()=>{
 for(let giro=0;giro<4;giro++){const m=game(),p=sitio(m),b=build(m,'porton',p.x,p.z,giro),h=C.huellaCerco(b);act(m,gate(m,b,false));for(let dx=0;dx<h.ancho;dx++)for(let dz=0;dz<h.fondo;dz++)assert.equal(T.celdaTransitable(m.estado,b.x+dx,b.z+dz),false);act(m,gate(m,b,true));for(let dx=0;dx<h.ancho;dx++)for(let dz=0;dz<h.fondo;dz++)assert.ok(T.celdaTransitable(m.estado,b.x+dx,b.z+dz));}
});
test('Abrir y cerrar exige exterior, identidad, distancia y booleano válidos',()=>{
 const m=game(),p=sitio(m),b=build(m,'porton',p.x,p.z);for(const a of [{...gate(m,b,false),edificioId:'casa_inicial'},{...gate(m,b,false),abierto:'no'},{...gate(m,b,false),xJugador:NaN},{...gate(m,b,false),xJugador:100}])fail(m,a);
 for(const campo of ['interior','servicio']){m.estado[campo]=campo==='interior'?'casa_inicial':'animales';fail(m,gate(m,b,false));m.estado[campo]=null;}m.estado.zona='pueblo';fail(m,gate(m,b,false));
});
test('Se puede operar desde ambos lados sin cobrar recursos, energía o premios; repetir no muta',()=>{
 const m=game(),p=sitio(m),b=build(m,'porton',p.x,p.z),antes=structuredClone(m.estado);act(m,gate(m,b,false));fail(m,gate(m,b,false));act(m,gate(m,b,true,{x:b.x+3,z:b.z+.5}));for(const k of ['inventario','monedas','energia','estadisticas','habilidades','jornada'])assert.deepEqual(m.estado[k],antes[k]);
});
test('Cerrar sobre el personaje se rechaza y permite cerrar al terminar de cruzar',()=>{
 const m=game(),p=sitio(m),b=build(m,'porton',p.x,p.z);fail(m,gate(m,b,false,{x:b.x+.5,z:b.z+.5}));act(m,gate(m,b,false));assert.equal(C.portonAbierto(get(m,b.id)),false);
});
test('La valla no se coloca ni se mueve sobre el personaje o un compañero',()=>{
 const m=game(),p=sitio(m);m.registrarPosicion(p.x+.5,p.z+.5);give(m,'creacion_valla_madera');fail(m,{tipo:'construir',articulo:'valla_madera',x:p.x,z:p.z});m.registrarPosicion(p.x-3,p.z);act(m,{tipo:'construir',articulo:'valla_madera',x:p.x,z:p.z});const b=m.estado.edificios.at(-1),q=sitio(m);m.registrarPosicion(q.x+.5,q.z+.5);fail(m,{tipo:'mover',edificioId:b.id,x:q.x,z:q.z});
 const c=adoptar(m,'gato'),r=sitio(m);c.posicion={zona:'granja',x:r.x+.5,z:r.z+.5};give(m,'creacion_valla_madera');fail(m,{tipo:'construir',articulo:'valla_madera',x:r.x,z:r.z});
});
test('Cerrar sobre la mascota o el caballo conserva cuidados y genes',()=>{
 for(const tipo of ['gato','caballo']){const m=game(),a=adoptar(m,tipo),p=sitio(m),b=build(m,'porton',p.x,p.z);a.posicion={zona:'granja',x:b.x+.5,z:b.z+.5};fail(m,gate(m,b,false));}
});
test('Mover o girar un portón cerrado conserva estado y rechaza ocupantes del destino',()=>{
 const m=game(),p=sitio(m),b=build(m,'porton',p.x,p.z);act(m,gate(m,b,false));const q=sitio(m);m.registrarPosicion(q.x+.5,q.z+.5);fail(m,{tipo:'mover',edificioId:b.id,x:q.x,z:q.z});m.registrarPosicion(q.x-2,q.z);act(m,{tipo:'mover',edificioId:b.id,x:q.x,z:q.z});assert.equal(get(m,b.id).portonAbierto,false);act(m,{tipo:'girar',edificioId:b.id});assert.equal(get(m,b.id).portonAbierto,false);
});
test('Importación y recarga conservan el cierre y rechazan aperturas corruptas o en otra pieza',()=>{
 const m=game(),p=sitio(m),b=build(m,'porton',p.x,p.z);act(m,gate(m,b,false));const n=game();assert.ok(n.cargarJSON(m.exportar()).ok);assert.equal(get(n,b.id).portonAbierto,false);for(const valor of [null,0,'false',{}]){const s=structuredClone(m.estado);s.edificios.find(e=>e.id===b.id).portonAbierto=valor;failImport(m,s);}const s=structuredClone(m.estado);s.edificios[0].portonAbierto=true;failImport(m,s);
});
function failImport(m,s){const antes=structuredClone(m.estado);assert.equal(m.cargarJSON(JSON.stringify(s)).ok,false);assert.deepEqual(m.estado,antes);}
test('Guardar el cerco devuelve una pieza; mochila llena mantiene la barrera sin duplicación',()=>{
 const m=game(),p=sitio(m),b=build(m,'valla_madera',p.x,p.z);m.estado.casillasInventario=Array.from({length:24},()=>({articulo:'piedra',cantidad:999}));m.estado.inventario=I.resumirCasillas(m.estado.casillasInventario);fail(m,{tipo:'retirar_edificio',edificioId:b.id});assert.equal(T.celdaTransitable(m.estado,b.x,b.z),false);m.estado.casillasInventario[23]=null;m.estado.inventario=I.resumirCasillas(m.estado.casillasInventario);act(m,{tipo:'retirar_edificio',edificioId:b.id});assert.equal(m.estado.inventario.creacion_valla_madera,1);assert.ok(T.celdaTransitable(m.estado,b.x,b.z));fail(m,{tipo:'retirar_edificio',edificioId:b.id});
});
test('Montura, desembarco y el personaje usan la misma barrera; el jinete puede abrirla',()=>{
 const m=game(),a=adoptar(m),p=sitio(m),b=build(m,'porton',p.x,p.z);a.posicion={zona:'granja',x:b.x-1,z:b.z+.5};act(m,{tipo:'compania',accion:{tipo:'montar',id:a.id},xJugador:a.posicion.x,zJugador:a.posicion.z});act(m,gate(m,b,false,a.posicion));assert.equal(T.puntoTransitable(m.estado,b.x+.5,b.z+.5,.45),false);act(m,gate(m,b,true,a.posicion));assert.ok(T.puntoTransitable(m.estado,b.x+.5,b.z+.5,.45));
});
for(const tipo of ['gato','perro','tortuga','caballo'])test('La llamada de '+tipo+' respeta el recinto y renueva la ruta al abrir',()=>{
 const m=game(),a=adoptar(m,tipo),r=recinto(m);a.posicion={zona:'granja',...r.dentro};act(m,gate(m,r.porton,false));const identidad=structuredClone({genoma:a.genoma,cuidado:a.cuidado,amistad:a.amistad}),recursos=structuredClone(m.estado.inventario);act(m,llamada(a,r.jugador));for(let k=0;k<350;k++)m.pasoCompania(.1,r.jugador.x,r.jugador.z);assert.ok(pet(m,a.id).posicion.x>r.x);act(m,gate(m,r.porton,true));for(let k=0;k<650;k++)m.pasoCompania(.1,r.jugador.x,r.jugador.z);const c=pet(m,a.id);assert.ok(c.posicion.x<r.x,JSON.stringify(c.posicion));assert.ok(Math.hypot(c.posicion.x-r.jugador.x,c.posicion.z-r.jugador.z)<2);assert.deepEqual({genoma:c.genoma,cuidado:c.cuidado,amistad:c.amistad},identidad);assert.deepEqual(m.estado.inventario,recursos);if(tipo==='caballo')assert.equal(c.seguir,false);assert.equal(validarEstado(m.estado),null);
});
test('La llamada rechaza descanso, enfermedad, montura y zonas distintas sin teleportar',()=>{
 const m=game(),a=adoptar(m),p={x:a.posicion.x-5,z:a.posicion.z};for(const minutos of [300,1140]){m.estado.jornada.minutos=minutos;fail(m,llamada(a,p));}m.estado.jornada.minutos=720;m.estado.interior='casa_inicial';fail(m,llamada(a,p));m.estado.interior=null;m.estado.zona='pueblo';fail(m,llamada(a,p));m.estado.zona='granja';fail(m,llamada(a,{x:NaN,z:p.z}));const c=pet(m,a.id);act(m,{tipo:'compania',accion:{tipo:'montar',id:c.id},xJugador:c.posicion.x,zJugador:c.posicion.z});fail(m,llamada(c,p));act(m,{tipo:'compania',accion:{tipo:'desmontar',id:c.id},xJugador:c.posicion.x,zJugador:c.posicion.z});now+=48*HORA;m.actualizar();fail(m,llamada(pet(m,a.id),p));
});
test('Recarga y horas ausentes conservan la llamada y posición; solo pasos visibles avanzan',()=>{
 const m=game(),a=adoptar(m),p={x:a.posicion.x-5,z:a.posicion.z};act(m,llamada(a,p));fail(m,llamada(a,p));const posicion=structuredClone(pet(m,a.id).posicion);const n=game();assert.ok(n.cargarJSON(m.exportar()).ok);assert.deepEqual(pet(n,a.id).posicion,posicion);now+=HORA;n.actualizar();assert.deepEqual(pet(n,a.id).posicion,posicion);assert.equal(pet(n,a.id).seguir,true);for(let k=0;k<100;k++)n.pasoCompania(.1,p.x,p.z);assert.notDeepEqual(pet(n,a.id).posicion,posicion);
});
test('Dormir cancela la llamada del caballo y conserva el seguimiento elegido para mascotas',()=>{
 const m=game(),a=adoptar(m),c=adoptar(m,'gato');act(m,llamada(a,{x:0,z:0}));act(m,llamada(c,{x:0,z:0}));P.cerrarDiaCompania(m.estado);assert.equal(pet(m,a.id).seguir,false);assert.equal(pet(m,c.id).seguir,true);
});
if(process.env.CERCOS_PARTIDA){const m=game(),a=adoptar(m),r=recinto(m);a.posicion={zona:'granja',...r.dentro};act(m,gate(m,r.porton,false));const jugador={x:r.porton.x-1.25,z:r.porton.z+.5};m.registrarPosicion(jugador.x,jugador.z);assert.equal(validarEstado(m.estado),null);fs.writeFileSync(process.env.CERCOS_PARTIDA,JSON.stringify({estado:m.estado,porton:r.porton.id,valla:r.vallas[0].id,caballo:a.id,jugador,recinto:{x:r.x,z:r.z}},null,2)+'\n');}
console.log(JSON.stringify({suite:'cercos-y-llamada',checks,failures,alcance:'Recursos, terreno y posiciones preparados; construcción, portones, rutas, llamadas, importación y devolución ejecutados por el motor. No certifica campaña ni teléfonos físicos.'}));if(failures)process.exitCode=1;
