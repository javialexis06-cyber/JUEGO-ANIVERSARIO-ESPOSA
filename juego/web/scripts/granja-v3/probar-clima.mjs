import assert from 'node:assert/strict';import {transform} from 'esbuild';import {readFile} from 'node:fs/promises';
const modules=new Map();async function compile(url){if(modules.has(url.href))return modules.get(url.href);let {code}=await transform(await readFile(url,'utf8'),{loader:'ts',format:'esm',target:'es2022'});for(const m of [...code.matchAll(/from (["'])([^"']+)\1/g)]){const dep=m[2].startsWith('./')?await compile(new URL(m[2]+'.ts',url)):import.meta.resolve(m[2]);code=code.replace(m[0],'from '+JSON.stringify(dep));}const result='data:text/javascript;base64,'+Buffer.from(code).toString('base64');modules.set(url.href,result);return result;}
const load=f=>compile(new URL('../../src/granja-v3/'+f+'.ts',import.meta.url)).then(s=>import(s));
const {MotorGranja,validarEstado,migrarEstado}=await load('motor');
const {crearTiempo,tiempoDia,tiempoRegion,lluviaRiega,pronostico,faseLuz,tiempoValido}=await load('clima');
const {crearCampo,duracionCampo}=await load('agricultura'),{crearCultivo}=await load('cuidados'),{crearJornada}=await load('jornada'),{CULTIVOS,PECES}=await load('catalogo');
let now=1_800_000_000_000,checks=0,failures=0;const H=3_600_000;
const test=(n,f)=>{try{f();checks++;console.log('OK '+n);}catch(e){failures++;console.error('FAIL '+n+': '+e.stack.replace(/data:[^ )]+/g,'[módulo]'));}};
const game=()=>new MotorGranja({ahora:()=>now});
function act(m,a){const r=m.actuar(a);assert.equal(r.ok,true,r.mensaje);return r;}
const sleep=m=>act(m,{tipo:'dormir',jornada:m.estado.jornada.diasCompletados,edificioId:'casa_inicial',xJugador:-5,zJugador:-.5});
const morning=m=>act(m,{tipo:'continuar_dia',jornada:m.estado.jornada.diasCompletados});
function plot(m,x=0,z=3){act(m,{tipo:'herramienta',herramienta:'azada'});act(m,{tipo:'labrar',x,z});act(m,{tipo:'plantar',x,z,cultivo:'zanahoria'});return m.estado.parcelas.find(p=>p.x===x&&p.z===z);}
function day(m,d){m.estado.jornada=crearJornada(m.estado.monedas,m.estado.estadisticas,d);}
test('Dos primeras jornadas despejadas y tercera lluviosa; el pronóstico coincide al despertar',()=>{
 const m=game();assert.equal(m.pronostico().hoy,'sol');assert.equal(m.pronostico().manana,'sol');sleep(m);morning(m);assert.equal(m.pronostico().manana,'lluvia');sleep(m);assert.equal(m.pronostico().hoy,'lluvia');morning(m);assert.equal(m.meteorologia(),'lluvia');
});
test('Clima determinista por partida y jornada con variación entre semillas',()=>{
 const t=crearTiempo(now),serie=Array.from({length:224},(_,d)=>tiempoDia(t,d));assert.deepEqual(serie,Array.from({length:224},(_,d)=>tiempoDia(JSON.parse(JSON.stringify(t)),d)));assert.notDeepEqual(serie,Array.from({length:224},(_,d)=>tiempoDia({version:1,semilla:(t.semilla^123)>>>0},d)));assert.ok(serie.includes('tormenta')&&serie.includes('brisa')&&serie.includes('nieve'));
});
test('El invierno no tiene lluvia líquida y el programa cambia por estación',()=>{
 const t=crearTiempo(now);for(let ano=0;ano<8;ano++)for(let d=84;d<112;d++)assert.ok(['sol','brisa','nieve'].includes(tiempoDia(t,ano*112+d)));assert.equal(lluviaRiega('nieve'),false);
});
test('Horas reales, hora del juego y recarga no cambian el pronóstico',()=>{
 const m=game();day(m,8);const antes=m.pronostico();for(let i=0;i<100;i++)m.avanzarJornada(5);now+=90*24*H;m.actualizar();assert.deepEqual(m.pronostico(),antes);const n=game();assert.equal(n.cargarJSON(m.exportar()).ok,true);assert.deepEqual(n.pronostico(),antes);
});
test('La lluvia riega una siembra nueva, sin gasto de regadera ni crecimiento inmediato',()=>{
 const m=game();day(m,2);const energia=m.estado.energia,p=plot(m);assert.equal(p.campo.riegoDia,2);assert.equal(p.cuidado.lastWateredAt,now);assert.equal(p.cuidado.grownMs,0);assert.equal(m.estado.energia,energia-1);assert.equal(m.estado.estadisticas.regar??0,0);assert.equal(m.estado.estadisticas.riego_lluvia,1);assert.equal(validarEstado(m.estado),null);
});
test('Riego de lluvia no se repite cada frame, con otra acción ni después de recargar',()=>{
 const m=game();day(m,2);const p=plot(m),regado=p.cuidado.lastWateredAt;for(let i=0;i<120;i++)m.avanzarJornada(.016);act(m,{tipo:'herramienta',herramienta:'pico'});assert.equal(m.estado.estadisticas.riego_lluvia,1);const n=game();now+=2*H;assert.equal(n.cargarJSON(m.exportar()).ok,true);n.avanzarJornada(.016);assert.equal(n.estado.parcelas[0].cuidado.lastWateredAt,regado);assert.equal(n.estado.estadisticas.riego_lluvia,1);
});
test('Una noche lluviosa avanza exactamente un día aunque nadie use la regadera',()=>{
 const m=game();day(m,2);const p=plot(m);const r=sleep(m);assert.equal(p.cuidado.grownMs,1_800_000);assert.equal(r.resumenJornada.cultivosAvanzados,1);assert.equal(m.estado.jornada.diasCompletados,3);
});
test('Continuar una mañana lluviosa moja las plantas existentes sin hacerlas crecer',()=>{
 const m=game(),p=plot(m);sleep(m);morning(m);sleep(m);assert.equal(p.campo.riegoDia,null);assert.equal(p.cuidado.grownMs,0);morning(m);assert.equal(p.campo.riegoDia,2);assert.equal(p.cuidado.grownMs,0);
});
test('El reloj real no simula lluvia offline y la lluvia al volver no revive sequía',()=>{
 const m=game();day(m,2);const d=CULTIVOS.find(c=>c.id==='zanahoria');m.estado.parcelas=[{x:0,z:3,cultivo:d.id,campo:crearCampo(),cuidado:crearCultivo(duracionCampo(d,crearCampo()),now,false)}];now+=47*H;m.actualizar();assert.equal(m.estado.parcelas[0].cuidado.lastWateredAt,null);assert.equal(m.estado.parcelas[0].cuidado.grownMs,0);now+=H;m.actualizar();m.avanzarJornada(.016);assert.equal(m.estado.parcelas[0].cuidado.status,'arruinado');assert.equal(m.estado.parcelas[0].cuidado.lastWateredAt,null);
});
test('Un cultivo maduro mantiene decoración y fechas bajo lluvia y largas ausencias',()=>{
 const m=game();day(m,2);const p=plot(m);p.cuidado={...p.cuidado,status:'maduro',grownMs:p.cuidado.growthMs,maturedAt:now};const antes=structuredClone(p.cuidado);now+=200*24*H;m.actualizar();m.avanzarJornada(.016);assert.equal(p.cuidado.status,'maduro');assert.equal(p.cuidado.maturedAt,antes.maturedAt);assert.equal(p.cuidado.lastWateredAt,antes.lastWateredAt);
});
test('Hábitats volcánicos reciben ceniza y polares nieve: ninguno aporta riego',()=>{
 assert.equal(tiempoRegion('tormenta','volcanico'),'ceniza');assert.equal(tiempoRegion('lluvia','polar'),'nieve');assert.equal(lluviaRiega(tiempoRegion('lluvia','volcanico')),false);assert.equal(lluviaRiega(tiempoRegion('lluvia','polar')),false);
 const m=game();day(m,2);m.climaDeCelda=()=> 'volcanico';const d=CULTIVOS.find(c=>c.id==='tomate_fuego');m.estado.parcelas=[{x:0,z:3,cultivo:d.id,campo:crearCampo(),cuidado:crearCultivo(duracionCampo(d,crearCampo()),now,false)}];sleep(m);assert.equal(m.estado.parcelas[0].cuidado.lastWateredAt,null);assert.equal(m.estado.parcelas[0].cuidado.grownMs,0);
});
test('Regar manualmente en lluvia permite objetivos y solo cuenta una vez por parcela y jornada',()=>{
 const m=game();day(m,2);const p=plot(m);act(m,{tipo:'herramienta',herramienta:'regadera'});for(let i=0;i<3;i++)act(m,{tipo:'regar',x:p.x,z:p.z});assert.equal(m.estado.estadisticas.regar,1);sleep(m);morning(m);act(m,{tipo:'regar',x:p.x,z:p.z});assert.equal(m.estado.estadisticas.regar,2);
});
test('El cuaderno de pesca y la selección cumplen clima, hora, cebo y estación',()=>{
 const m=game();m.estado.zona='lago';day(m,28);m.estado.jornada.minutos=18*60;let lluvia=-1,sol=-1;for(let d=28;d<56;d++){const t=tiempoDia(m.estado.tiempo,d);if(lluviaRiega(t))lluvia=d;else if(['sol','brisa'].includes(t))sol=d;}assert.ok(lluvia>=0&&sol>=0);
 day(m,sol);m.estado.jornada.minutos=18*60;assert.equal(m.pecesDisponibles('lombriz').some(p=>p.id==='bagre'),false);
 day(m,lluvia);m.estado.jornada.minutos=18*60;assert.equal(m.pecesDisponibles('lombriz').some(p=>p.id==='bagre'),true);m.estado.jornada.minutos=12*60;assert.equal(m.pecesDisponibles('lombriz').some(p=>p.id==='bagre'),false);assert.equal(m.pecesDisponibles('cebo_magico').some(p=>p.id==='bagre'),false);
 assert.ok(PECES.find(p=>p.id==='pez_hielo').tiempos.includes('nieve'));
});
test('Migración instala clima una sola vez y conserva terreno, inventario, jornada y progreso',()=>{
 const m=game(),p=plot(m),s=structuredClone(m.estado);delete s.tiempo;const v=migrarEstado(s);assert.equal(tiempoValido(v.tiempo),true);assert.deepEqual(v.parcelas,s.parcelas);assert.deepEqual(v.casillasInventario,s.casillasInventario);assert.deepEqual(v.jornada,s.jornada);assert.deepEqual(migrarEstado(v),v);assert.equal(validarEstado(v),null);
});
test('Importación rechaza programa y marcas de riego falsos sin tocar partida',()=>{
 const m=game();plot(m);for(const edit of [s=>s.tiempo=null,s=>s.tiempo.semilla=-1,s=>s.tiempo.semilla=2**32,s=>s.tiempo.version=7,s=>s.parcelas[0].campo.riegoManualDia=9]){const s=structuredClone(m.estado),antes=structuredClone(m.estado);edit(s);assert.equal(m.cargarJSON(JSON.stringify(s)).ok,false);assert.deepEqual(m.estado,antes);}
});
test('La luz cambia con la hora guardada, sin depender del reloj real',()=>{
 assert.deepEqual(faseLuz(6*60),{noche:0,atardecer:0});assert.equal(faseLuz(18*60).atardecer,1);assert.equal(faseLuz(21*60).noche,1);assert.equal(faseLuz(26*60).noche,1);assert.equal(faseLuz(17*60).noche,0);
});
console.log(JSON.stringify({suite:'clima-jornada-riego-pesca',checks,failures}));if(failures)process.exitCode=1;
