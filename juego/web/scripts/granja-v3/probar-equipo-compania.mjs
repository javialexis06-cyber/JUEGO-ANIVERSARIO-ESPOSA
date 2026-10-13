import assert from 'node:assert/strict';
import { compilarModulo } from './modulos-prueba.mjs';
const load=async f=>import(await compilarModulo(new URL('../../src/granja-v3/'+f+'.ts',import.meta.url)));
const {MotorGranja,validarEstado}=await load('motor'),C=await load('compania'),E=await load('equipo-compania'),D=await load('equipo-compania-datos'),I=await load('inventario'),O=await load('objetos');
let now=1_800_000_000_000,checks=0,failures=0;
function test(nombre,f){try{f();checks++;console.log('OK '+nombre);}catch(e){failures++;console.error('FAIL '+nombre+': '+String(e.stack).replace(/data:text\/javascript;base64,[A-Za-z0-9+/=]+/g,'[módulo]'));}}
const game=()=>new MotorGranja({ahora:()=>now,azar:()=>.1});
const act=(m,a)=>{const r=m.actuar(a);assert.ok(r.ok,r.mensaje);return r;};
const fail=(m,a)=>{m.actualizar();const previo=structuredClone(m.estado),r=m.actuar(a);assert.equal(r.ok,false,r.mensaje);assert.deepEqual(m.estado,previo);return r;};
const give=(m,id,n=1,q=0)=>{const slots=I.cambiarCantidad(m.estado.casillasInventario,id,n,q);assert.ok(slots);m.estado.casillasInventario=slots;m.estado.inventario=I.resumirCasillas(slots);};
const get=(m,id)=>m.estado.compania.animales.find(c=>c.id===id);
function fixture(tipo='gato'){
 const m=game();m.estado.monedas=10000;m.estado.sectorIds=Array.from({length:30},(_,i)=>i);m.estado.obstaculos=[];delete m.estado.paisaje;m.estado.misionesCompletadas=['hogar','huerta','confianza'];
 const hogar=C.COMPANEROS[tipo].hogar;m.estado.zona='pueblo';m.estado.servicio='carpinteria';m.estado.jornada.minutos=600;act(m,{tipo:'comprar',articulo:hogar});m.estado.zona='granja';m.estado.servicio=null;act(m,{tipo:'construir',articulo:hogar,x:tipo==='caballo'?14:-7,z:3,giro:0});
 const b=m.estado.edificios.at(-1);m.estado.zona='pueblo';m.estado.servicio='animales';act(m,{tipo:'compania',accion:{tipo:'adoptar',animal:tipo,variante:2,nombre:'Canela',edificioId:b.id},xJugador:79,zJugador:0});m.estado.zona='granja';m.estado.servicio=null;
 return {m,id:m.estado.compania.animales.at(-1).id};
}
const comp=(m,id,accion,p=get(m,id).posicion)=>{const pila=accion.tipo==='equipar'?m.estado.casillasInventario[accion.casilla]:null;return {tipo:'compania',accion:{id,...(accion.tipo==='equipar'?{articulo:pila?.articulo??'collar_paseo',calidad:I.calidadPila(pila)}:{}),...accion},xJugador:p.x,zJugador:p.z};};
const slot=(m,id,q)=>m.estado.casillasInventario.findIndex(p=>p?.articulo===id&&(q===undefined||I.calidadPila(p)===q));
const equip=(m,id,art,q)=>act(m,comp(m,id,{tipo:'equipar',casilla:slot(m,art,q)}));
const quitar=(m,id,ranura='paseo')=>act(m,comp(m,id,{tipo:'quitar_equipo',ranura}));
const fabricar=(m,recetaId)=>act(m,{tipo:'produccion',accion:{tipo:'fabricar',recetaId},xJugador:0,zJugador:5});
const llenar=m=>{m.estado.casillasInventario=m.estado.casillasInventario.map(p=>p??{articulo:'madera',cantidad:999});m.estado.inventario=I.resumirCasillas(m.estado.casillasInventario);};

test('Tres accesorios únicos usan materiales y estaciones existentes sin nuevas armas',()=>{
 assert.equal(D.ACCESORIOS_COMPANIA.length,3);assert.equal(new Set(D.ACCESORIOS_COMPANIA.map(d=>d.id)).size,3);
 for(const d of D.ACCESORIOS_COMPANIA){const o=O.obtenerObjeto(d.id),r=O.obtenerReceta(d.id);assert.equal(o.pilaMax,1);assert.equal(o.equipo,undefined);assert.equal(o.precioVenta,0);assert.equal(r.nivel,0);assert.ok(['mano','banco_trabajo'].includes(r.estacion));for(const k of Object.keys(r.ingredientes))assert.ok(O.obtenerObjeto(k),k);}
});
test('Collar fabricado a mano consume ocho fibras y un cobre una sola vez',()=>{
 const {m}=fixture();give(m,'fibra',8);give(m,'cobre');const previo={fibra:m.estado.inventario.fibra,cobre:m.estado.inventario.cobre,monedas:m.estado.monedas};fabricar(m,'collar_paseo');assert.equal(m.estado.inventario.fibra??0,previo.fibra-8);assert.equal(m.estado.inventario.cobre??0,previo.cobre-1);assert.equal(m.estado.inventario.collar_paseo,1);assert.equal(m.estado.monedas,previo.monedas);assert.equal(validarEstado(m.estado),null);
});
test('Falta de ingredientes o mochila llena no consume materiales al fabricar',()=>{
 const {m}=fixture();fail(m,{tipo:'produccion',accion:{tipo:'fabricar',recetaId:'collar_paseo'},xJugador:0,zJugador:5});give(m,'fibra',16);give(m,'cobre',2);llenar(m);fail(m,{tipo:'produccion',accion:{tipo:'fabricar',recetaId:'collar_paseo'},xJugador:0,zJugador:5});
});
for(const art of ['brida_senda','herraduras_senda'])test(art+' se produce en banco con reserva finita y recogida física',()=>{
 const {m}=fixture('caballo');give(m,'madera',20);give(m,'piedra',8);fabricar(m,'banco_trabajo');act(m,{tipo:'produccion',accion:{tipo:'colocar_maquina',articulo:'banco_trabajo',x:0,z:5,zona:'granja'},xJugador:0,zJugador:5});const banco=m.estado.produccion.maquinas.at(-1),r=O.obtenerReceta(art);
 for(const [k,n] of Object.entries(r.ingredientes))give(m,k,n);const materiales=structuredClone(m.estado.inventario);act(m,{tipo:'produccion',accion:{tipo:'encolar_receta',id:banco.id,recetaId:art},xJugador:banco.x,zJugador:banco.z});assert.equal(m.estado.inventario[art]??0,0);for(const [k,n] of Object.entries(r.ingredientes))assert.equal(m.estado.inventario[k]??0,(materiales[k]??0)-n);
 now+=r.duracionMs+1;m.actualizar();const salida=m.estado.produccion.maquinas.find(b=>b.id===banco.id).salida.findIndex(p=>p?.articulo===art);assert.ok(salida>=0);const libre=m.estado.casillasInventario.findIndex(p=>!p);act(m,{tipo:'produccion',accion:{tipo:'transferir',desde:{tipo:'maquina',id:banco.id,casilla:salida},hasta:{tipo:'mochila',casilla:libre},cantidad:1},xJugador:banco.x,zJugador:banco.z});assert.equal(m.estado.inventario[art],1);assert.equal(validarEstado(m.estado),null);
});
test('Accesorios no se compran gratis ni ocupan ranuras del personaje',()=>{
 const {m}=fixture();give(m,'collar_paseo');const i=slot(m,'collar_paseo');fail(m,{tipo:'equipar_objeto',casilla:i});m.estado.zona='pueblo';m.estado.servicio='semillas';fail(m,{tipo:'comprar_objeto',articulo:'collar_paseo'});
});
test('Equipar consume la casilla elegida con calidad exacta y conserva genes y cuidado',()=>{
 const {m,id}=fixture();give(m,'collar_paseo',1,1);give(m,'collar_paseo',1,3);const antes=structuredClone(get(m,id)),saldo={monedas:m.estado.monedas,energia:m.estado.energia,dia:m.estado.jornada.diasCompletados};equip(m,id,'collar_paseo',3);
 assert.deepEqual(get(m,id).equipo,{paseo:{articulo:'collar_paseo',cantidad:1,calidad:3}});assert.equal(slot(m,'collar_paseo',3),-1);assert.ok(slot(m,'collar_paseo',1)>=0);for(const k of ['genoma','amistad','cuidado','aguaDia','carinoDia'])assert.deepEqual(get(m,id)[k],antes[k]);assert.deepEqual({monedas:m.estado.monedas,energia:m.estado.energia,dia:m.estado.jornada.diasCompletados},saldo);
});
test('Equipar desde lejos, otro mundo, interior o servicio falla sin gasto',()=>{
 const {m,id}=fixture();give(m,'collar_paseo');const a=comp(m,id,{tipo:'equipar',casilla:slot(m,'collar_paseo')});fail(m,{...a,xJugador:80,zJugador:0});for(const modo of ['pueblo','interior','servicio']){m.estado.zona=modo==='pueblo'?'pueblo':'granja';m.estado.interior=modo==='interior'?'casa_inicial':null;m.estado.servicio=modo==='servicio'?'animales':null;fail(m,a);}m.estado.zona='granja';m.estado.interior=null;m.estado.servicio=null;
});
test('Casillas y coordenadas inválidas se rechazan sin cambiar el equipo',()=>{
 const {m,id}=fixture();give(m,'collar_paseo');for(const casilla of [-1,24,NaN,Infinity,.5,'0'])fail(m,comp(m,id,{tipo:'equipar',casilla}));for(const n of [NaN,Infinity,-Infinity])fail(m,comp(m,id,{tipo:'equipar',casilla:slot(m,'collar_paseo')},{x:n,z:0}));
});
test('Accesorio incompatible, objeto corriente y ranura desconocida no se equipan',()=>{
 const {m,id}=fixture();for(const art of ['herraduras_senda','brida_senda','madera']){give(m,art);fail(m,comp(m,id,{tipo:'equipar',casilla:slot(m,art)}));}fail(m,comp(m,id,{tipo:'quitar_equipo',ranura:'arma'}));const caballo=fixture('caballo');give(caballo.m,'collar_paseo');fail(caballo.m,comp(caballo.m,caballo.id,{tipo:'equipar',casilla:slot(caballo.m,'collar_paseo')}));
});
test('Repetir equipar una casilla consumida o mismo accesorio no duplica ni pierde copias',()=>{
 const {m,id}=fixture();give(m,'collar_paseo',2);const i=slot(m,'collar_paseo');equip(m,id,'collar_paseo');fail(m,comp(m,id,{tipo:'equipar',casilla:i}));const restante=slot(m,'collar_paseo');assert.ok(restante>=0);fail(m,comp(m,id,{tipo:'equipar',casilla:restante}));assert.equal(m.estado.inventario.collar_paseo,1);
});
test('Cambio de calidad devuelve la pieza anterior aun con mochila completa',()=>{
 const {m,id}=fixture();give(m,'collar_paseo',1,2);equip(m,id,'collar_paseo',2);give(m,'collar_paseo',1,3);llenar(m);const accion=comp(m,id,{tipo:'equipar',casilla:slot(m,'collar_paseo',3)});act(m,accion);fail(m,accion);assert.equal(get(m,id).equipo.paseo.calidad,3);assert.ok(slot(m,'collar_paseo',2)>=0);assert.equal(m.estado.almacenMigracion.collar_paseo,undefined);assert.equal(validarEstado(m.estado),null);
});
test('Quitar con mochila llena falla completo; espacio libre devuelve calidad y repetición falla',()=>{
 const {m,id}=fixture();give(m,'collar_paseo',1,3);equip(m,id,'collar_paseo',3);llenar(m);fail(m,comp(m,id,{tipo:'quitar_equipo',ranura:'paseo'}));m.estado.casillasInventario[0]=null;m.estado.inventario=I.resumirCasillas(m.estado.casillasInventario);quitar(m,id);assert.equal(get(m,id).equipo,undefined);assert.ok(slot(m,'collar_paseo',3)>=0);fail(m,comp(m,id,{tipo:'quitar_equipo',ranura:'paseo'}));assert.equal(m.estado.inventario.collar_paseo,1);
});
test('Caballo monta con dos ranuras; ajustar montado falla y no pierde accesorios',()=>{
 const {m,id}=fixture('caballo');give(m,'brida_senda',1,2);give(m,'herraduras_senda',1,3);equip(m,id,'brida_senda',2);equip(m,id,'herraduras_senda',3);act(m,comp(m,id,{tipo:'montar'}));fail(m,comp(m,id,{tipo:'quitar_equipo',ranura:'montura'}));give(m,'herraduras_senda');fail(m,comp(m,id,{tipo:'equipar',casilla:slot(m,'herraduras_senda',0)}));assert.equal(validarEstado(m.estado),null);
});
test('V5 anterior no necesita migración y recarga equipo con calidades independientes',()=>{
 const {m,id}=fixture('caballo');assert.equal(get(m,id).equipo,undefined);const vieja=m.exportar(),v=game();assert.ok(v.cargarJSON(vieja).ok);assert.equal(get(v,id).equipo,undefined);give(m,'brida_senda',1,2);give(m,'herraduras_senda',1,3);equip(m,id,'brida_senda',2);equip(m,id,'herraduras_senda',3);const n=game();assert.ok(n.cargarJSON(m.exportar()).ok);assert.deepEqual(get(n,id),get(m,id));assert.deepEqual(n.estado.inventario,m.estado.inventario);assert.equal(validarEstado(n.estado),null);
});
test('Guardados corruptos se rechazan sin perder la partida viva ni cambiar calidad',()=>{
 const {m,id}=fixture();give(m,'collar_paseo',1,2);equip(m,id,'collar_paseo',2);const bueno=structuredClone(m.estado);
 for(const e of [null,[],{arma:{articulo:'collar_paseo',cantidad:1}},{paseo:null},{paseo:{articulo:'collar_paseo',cantidad:2}},{paseo:{articulo:'collar_paseo',cantidad:1,calidad:4}},{paseo:{articulo:'collar_paseo',cantidad:1,calidad:'2'}},{paseo:{articulo:'brida_senda',cantidad:1}},{montura:{articulo:'collar_paseo',cantidad:1}},{paseo:{articulo:'collar_paseo',cantidad:1,gratis:1}}]){const s=structuredClone(bueno);s.compania.animales[0].equipo=e;assert.notEqual(validarEstado(s),null);assert.equal(m.cargarJSON(JSON.stringify(s)).ok,false);assert.deepEqual(m.estado,bueno);}
});
test('Calidad no acumula velocidad ni bonos de combate, recursos o cuidado',()=>{
 const {m,id}=fixture('caballo');give(m,'brida_senda',1,3);give(m,'herraduras_senda',1,3);equip(m,id,'brida_senda',3);equip(m,id,'herraduras_senda',3);assert.deepEqual(E.efectosEquipoCompania(get(m,id)),{velocidadPaseo:1.1,velocidadMontada:1.08,distanciaEspera:1.2});assert.equal(m.bonos().velocidad,0);get(m,id).equipo.montura.calidad=0;assert.equal(E.efectosEquipoCompania(get(m,id)).velocidadMontada,1.08);assert.deepEqual(E.efectosEquipoCompania({tipo:'caballo',equipo:{montura:{articulo:'desconocido',cantidad:1}}}),{velocidadPaseo:1,velocidadMontada:1,distanciaEspera:1.6});
});
for(const tipo of ['gato','perro','tortuga'])test(tipo+' camina un 10 % más rápido por el mismo trayecto sin cambiar cuidados',()=>{
 const {m,id}=fixture(tipo),n=game();assert.ok(n.cargarJSON(m.exportar()).ok);give(n,'collar_paseo');equip(n,id,'collar_paseo');const a=get(m,id),b=get(n,id);a.posicion={zona:'granja',x:.5,z:7.5};b.posicion={...a.posicion};a.seguir=true;b.seguir=true;const p={x:.5,z:12.5},care=structuredClone(b.cuidado),origen={...a.posicion};m.pasoCompania(.1,p.x,p.z);n.pasoCompania(.1,p.x,p.z);const dm=Math.hypot(a.posicion.x-origen.x,a.posicion.z-origen.z),dn=Math.hypot(b.posicion.x-origen.x,b.posicion.z-origen.z);assert.ok(dm>0);assert.ok(Math.abs(dn/dm-1.1)<1e-8);assert.deepEqual(b.cuidado,care);assert.equal(b.amistad,0);assert.equal(n.estado.jornada.diasCompletados,0);
});
test('Brida deja al caballo acercarse por el camino hasta 1,2 m sin teletransporte',()=>{
 const {m,id}=fixture('caballo');give(m,'brida_senda');equip(m,id,'brida_senda');const c=get(m,id);c.posicion={zona:'granja',x:18.5,z:12.5};act(m,comp(m,id,{tipo:'llamar'},{x:19.9,z:12.5}));const antes={...c.posicion};m.pasoCompania(.1,19.9,12.5);assert.equal(c.seguir,true);assert.ok(Math.hypot(c.posicion.x-antes.x,c.posicion.z-antes.z)<=.242+.001);for(let i=0;i<30;i++)m.pasoCompania(.1,19.9,12.5);assert.equal(c.seguir,false);assert.ok(Math.hypot(c.posicion.x-19.9,c.posicion.z-12.5)<1.2);
});
test('Dormir y ausencia conservan equipo sin criar vínculo ni avanzar jornada offline',()=>{
 const {m,id}=fixture();give(m,'collar_paseo',1,2);equip(m,id,'collar_paseo',2);const equipo=structuredClone(get(m,id).equipo),pos=structuredClone(get(m,id).posicion);now+=49*3_600_000;m.actualizar();assert.deepEqual(get(m,id).equipo,equipo);assert.deepEqual(get(m,id).posicion,pos);assert.equal(get(m,id).amistad,0);assert.equal(m.estado.jornada.diasCompletados,0);act(m,{tipo:'dormir',jornada:0,edificioId:'casa_inicial',xJugador:-5,zJugador:-.5});assert.deepEqual(get(m,id).equipo,equipo);assert.equal(get(m,id).amistad,0);
});
console.log(JSON.stringify({checks,failures}));if(failures)process.exitCode=1;
