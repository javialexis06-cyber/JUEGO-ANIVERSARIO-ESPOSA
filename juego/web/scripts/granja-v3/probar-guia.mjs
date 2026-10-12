/** Inicio guiado: Celia, el primer surco, la carta del pueblo, sus lugares, la primera historia y la primera noche. */
import { compilarModulo } from './modulos-prueba.mjs';
import assert from 'node:assert/strict';
const load=f=>compilarModulo(new URL('../../src/granja-v3/'+f+'.ts',import.meta.url)).then(s=>import(s));
const {MotorGranja,validarEstado}=await load('motor'),G=await load('guia'),C=await load('correo');
let now=1800000000000,checks=0,failures=0;const game=()=>new MotorGranja({ahora:()=>now,azar:()=>.1});
const act=(m,a)=>{const r=m.actuar(a);assert.ok(r.ok,r.mensaje);return r;};
const toque=m=>act(m,{tipo:'seleccionar_casilla',casilla:0});
const paso=m=>G.PASOS_GUIA[m.estado.guia.paso]?.id??'fin';
function test(n,f){try{f();checks++;console.log('OK '+n);}catch(e){failures++;console.error('FAIL '+n+': '+String(e.stack).replace(/data:text\/javascript;base64,[A-Za-z0-9+/=]+/g,'[modulo]'));}}
const buzon=(m,tipo)=>({tipo:'correo',accion:{id:G.CARTA_CAMPANA,tipo},xJugador:C.posicionBuzon(m.estado).x,zJugador:C.posicionBuzon(m.estado).z});

test('Partida nueva empieza con Celia y el prólogo se escucha una sola vez',()=>{const m=game();assert.equal(paso(m),'prologo');act(m,{tipo:'guia',hecho:'prologo'});assert.equal(paso(m),'surco');assert.equal(m.actuar({tipo:'guia',hecho:'prologo'}).ok,false);assert.equal(validarEstado(m.estado),null);});
test('El primer surco trae la carta del pueblo sin dormir y leerla abre el camino',()=>{const m=game();act(m,{tipo:'guia',hecho:'prologo'});Object.assign(m.estado.estadisticas,{labrar:3,plantar:3,regar:2});toque(m);assert.equal(paso(m),'surco');assert.ok(!m.estado.correo.cartas.some(c=>c.id===G.CARTA_CAMPANA));
 m.estado.estadisticas.regar=3;toque(m);assert.equal(paso(m),'buzon');const c=m.estado.correo.cartas.find(c=>c.id===G.CARTA_CAMPANA);assert.equal(c.recibidaDia,0);assert.equal(validarEstado(m.estado),null);
 act(m,buzon(m,'leer'));assert.equal(paso(m),'pueblo');act(m,buzon(m,'reclamar'));assert.ok((m.estado.inventario.semilla_zanahoria??0)>=4);});
test('El pueblo, sus cinco lugares, la primera historia y la primera noche cierran la guía',()=>{const m=game();act(m,{tipo:'guia',hecho:'prologo'});Object.assign(m.estado.estadisticas,{labrar:3,plantar:3,regar:3});toque(m);act(m,buzon(m,'leer'));
 m.estado.zona='pueblo';toque(m);assert.equal(paso(m),'lugares');
 for(const l of G.LUGARES_GUIA){m.estado.servicio=l;toque(m);}m.estado.servicio=null;assert.equal(paso(m),'campana');assert.ok(m.estado.guia.hechos.includes('lugar_museo'));
 m.estado.historia.activas.P01={paso:0};G.actualizarGuia(m.estado);assert.equal(paso(m),'dormir');delete m.estado.historia.activas.P01;
 m.estado.zona='granja';const d=m.estado.jornada.diasCompletados;act(m,{tipo:'dormir',jornada:d,edificioId:'casa_inicial',xJugador:-5,zJugador:-.5});assert.equal(paso(m),'fin');assert.equal(G.pasoGuia(m.estado),null);});
test('La carta de la guía nunca llega de noche por su cuenta',()=>{const m=game();for(let i=0;i<3;i++){const d=m.estado.jornada.diasCompletados;act(m,{tipo:'dormir',jornada:d,edificioId:'casa_inicial',xJugador:-5,zJugador:-.5});act(m,{tipo:'continuar_dia',jornada:d+1});}assert.ok(!m.estado.correo.cartas.some(c=>c.id===G.CARTA_CAMPANA));});
test('Partidas anteriores: con progreso no repiten el inicio, sin progreso lo reciben, y la guía corrupta se rechaza',()=>{const m=game(),s=structuredClone(m.estado);delete s.guia;s.jornada.diasCompletados=0;s.misionesCompletadas=['hogar'];assert.ok(m.cargarJSON(JSON.stringify(s)).ok);assert.equal(G.pasoGuia(m.estado),null);
 const n=game(),t=structuredClone(n.estado);delete t.guia;assert.ok(n.cargarJSON(JSON.stringify(t)).ok);assert.equal(paso(n),'prologo');
 const u=structuredClone(n.estado);u.guia={paso:99,hechos:[]};assert.equal(n.cargarJSON(JSON.stringify(u)).ok,false);});
test('Las primeras visitas se anotan aun con la guía terminada',()=>{const m=game();m.estado.guia={paso:G.PASOS_GUIA.length,hechos:['prologo']};m.estado.zona='pueblo';m.estado.servicio='herreria';toque(m);assert.ok(m.estado.guia.hechos.includes('lugar_herreria'));assert.ok(G.PRESENTACIONES.herreria);});
console.log(JSON.stringify({checks,failures}));if(failures)process.exitCode=1;
