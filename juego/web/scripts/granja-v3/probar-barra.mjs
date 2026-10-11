import assert from 'node:assert/strict';
import { transform } from 'esbuild';
import { readFile } from 'node:fs/promises';
const modules=new Map();
async function compile(url){if(modules.has(url.href))return modules.get(url.href);let {code}=await transform(await readFile(url,'utf8'),{loader:'ts',format:'esm',target:'es2022'});for(const match of [...code.matchAll(/from (["'])(\.\/[^"']+)\1/g)])code=code.replace(match[0],`from ${JSON.stringify(await compile(new URL(`${match[2]}.ts`,url)))}`);const result=`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;modules.set(url.href,result);return result;}
const {MotorGranja,validarEstado,migrarEstado}=await import(await compile(new URL('../../src/granja-v3/motor.ts',import.meta.url)));
const {distribuirInventario,resumirCasillas}=await import(await compile(new URL('../../src/granja-v3/inventario.ts',import.meta.url)));
const {crearCultivo,reconciliarCultivo,regarCultivo}=await import(await compile(new URL('../../src/granja-v3/cuidados.ts',import.meta.url)));
const {NIVELES_HERRAMIENTA}=await import(await compile(new URL('../../src/granja-v3/progresion.ts',import.meta.url)));
let now=1_800_000_000_000,checks=0,failures=0;
const clone=structuredClone;
function test(name,fn){try{fn();checks++;console.log(`OK ${name}`)}catch(e){failures++;console.error(`FAIL ${name}: ${e.stack}`)}}
const game=()=>new MotorGranja({ahora:()=>now,azar:()=>.25});
const act=(m,a)=>{const r=m.actuar(a);assert.equal(r.ok,true,`${JSON.stringify(a)}: ${r.mensaje}`);return r;};
const fail=(m,a)=>{const before=clone(m.estado);const r=m.actuar(a);assert.equal(r.ok,false,r.mensaje);assert.deepEqual(m.estado,before,'No debe gastar ni mutar al rechazar');return r;};
function inventory(m,record,cap=24){m.estado.casillasInventario=distribuirInventario(record,cap).casillas;m.estado.inventario=resumirCasillas(m.estado.casillasInventario);}
function service(m,id){act(m,{tipo:'viajar',zona:'pueblo'});m.estado.jornada.minutos=600;act(m,{tipo:'entrar_servicio',servicio:id});}
function target(m,type='arbol'){return m.nodosActuales().find(o=>o.tipo===type&&(o.zona||'granja')!=='granja'||o.tipo===type&&o.sectorId===0);}
function hit(m,o){now+=400;return act(m,{tipo:'golpear',obstaculoId:o.id,xJugador:o.x+.5,zJugador:o.z+1.5});}
function harvest(m,o){const id=o.id;let hits=0;while(m.nodosActuales().some(x=>x.id===id)){hit(m,o);hits++;}return hits;}
function pickup(m){for(const d of [...m.estado.drops].filter(d=>d.zona===m.estado.zona))act(m,{tipo:'recoger_drop',dropId:d.id,xJugador:d.x,zJugador:d.z});}


test('Herramientas, comida y recursos comparten barra; cambiar y mover nunca crea objetos',()=>{
 const m=game(),total=clone(m.estado.inventario);act(m,{tipo:'seleccionar_casilla',casilla:7});assert.equal(m.seleccionado().articulo,'pan');assert.equal(m.estado.herramienta,'mano');
 act(m,{tipo:'mover_item',desde:3,hasta:8});act(m,{tipo:'seleccionar_casilla',casilla:8});assert.equal(m.estado.herramienta,'pico');act(m,{tipo:'fila_barra',fila:1});assert.equal(m.estado.herramienta,'mano');assert.deepEqual(m.estado.inventario,total);
 fail(m,{tipo:'seleccionar_casilla',casilla:12});fail(m,{tipo:'fila_barra',fila:2});const saved=game();assert.equal(saved.cargarJSON(m.exportar()).ok,true);assert.equal(saved.estado.filaBarra,1);assert.deepEqual(saved.estado.casillasInventario,m.estado.casillasInventario);
});
test('Herramientas ausentes no pueden seleccionarse ni enviarse a mejorar',()=>{
 const m=game();inventory(m,{pan:3,herramienta_pico:1});act(m,{tipo:'seleccionar_casilla',casilla:1});fail(m,{tipo:'herramienta',herramienta:'hacha'});service(m,'herreria');fail(m,{tipo:'mejorar_herramienta',herramienta:'hacha'});assert.equal(m.estado.herramienta,'pico');
});
test('Pilas respetan límite de comida99 y equipo1 al distribuir, combinar y recargar',()=>{
 const m=game();inventory(m,{pan:200,espada_cobre:2});assert.deepEqual(m.estado.casillasInventario.slice(0,5).map(p=>p.cantidad),[99,99,2,1,1]);fail(m,{tipo:'mover_item',desde:3,hasta:4});act(m,{tipo:'mover_item',desde:1,hasta:5,cantidad:20});act(m,{tipo:'mover_item',desde:5,hasta:2});assert.equal(m.estado.casillasInventario[2].cantidad,22);assert.equal(m.estado.inventario.pan,200);const broken=clone(m.estado);broken.casillasInventario[3].cantidad=2;assert.equal(m.cargarJSON(JSON.stringify(broken)).ok,false);
});
test('Comer consume la casilla elegida, restaura y protege comida cuando no hace falta',()=>{
 const m=game();act(m,{tipo:'seleccionar_casilla',casilla:7});fail(m,{tipo:'consumir'});m.estado.vida=40;m.estado.energia=10;act(m,{tipo:'consumir'});assert.equal(m.estado.vida,50);assert.equal(m.estado.energia,42);assert.equal(m.estado.inventario.pan,2);fail(m,{tipo:'consumir'});now+=700;act(m,{tipo:'consumir'});now+=700;act(m,{tipo:'consumir'});assert.equal(m.estado.casillasInventario[7],null);assert.equal(m.estado.herramienta,'mano');assert.equal(validarEstado(m.estado),null);
});
test('Efectos de comida se reemplazan sin acumularse y vencen también sin conexión',()=>{
 const m=game();inventory(m,{cafe:2,ensalada:1});act(m,{tipo:'consumir',casilla:0});assert.equal(m.bonos().velocidad,.25);now+=700;act(m,{tipo:'consumir',casilla:0});assert.equal(m.bonos().velocidad,.25);now+=700;act(m,{tipo:'consumir',casilla:1});assert.equal(m.bonos().velocidad,.12);const copy=game();assert.equal(copy.cargarJSON(m.exportar()).ok,true);now+=181000;copy.actualizar();assert.equal(copy.bonos().velocidad,0);assert.equal(copy.estado.buffs.length,0);
});
test('Cambiar armadura con mochila llena usa hueco liberado; quitarla sin espacio se rechaza',()=>{
 const m=game();inventory(m,{casco_cobre:1});act(m,{tipo:'equipar_objeto',casilla:0});assert.equal(m.estado.equipo.casco,'casco_cobre');assert.ok(m.bonos().defensa>0);inventory(m,{casco_hierro:1,...Object.fromEntries(Array.from({length:23},(_,i)=>['obj_'+i,999]))});act(m,{tipo:'equipar_objeto',casilla:0});assert.equal(m.estado.equipo.casco,'casco_hierro');assert.equal(m.estado.casillasInventario[0].articulo,'casco_cobre');fail(m,{tipo:'desequipar_objeto',ranura:'casco'});act(m,{tipo:'equipar_objeto',casilla:0});assert.equal(m.estado.casillasInventario[0].articulo,'casco_hierro');assert.equal(validarEstado(m.estado),null);
});
test('Arma activa prevalece sobre arma equipada sin sumar ambas; equipo persiste',()=>{
 const m=game();inventory(m,{espada_cobre:1,espada_hierro:1,herramienta_pico:1});act(m,{tipo:'equipar_objeto',casilla:0});act(m,{tipo:'seleccionar_casilla',casilla:1});assert.equal(m.estado.herramienta,'espada');assert.equal(m.bonos().ataque,12);act(m,{tipo:'seleccionar_casilla',casilla:2});assert.equal(m.bonos().ataque,7);const other=game();assert.equal(other.cargarJSON(m.exportar()).ok,true);assert.equal(other.estado.equipo.arma,'espada_cobre');assert.equal(other.bonos().ataque,7);
});
test('Migración V4 añade herramientas implícitas, divide pilas nuevas y preserva excedentes',()=>{
 const m=game(),old=clone(m.estado);old.version=4;old.inventario={pan:500,...Object.fromEntries(Array.from({length:23},(_,i)=>['objeto_'+i,999]))};old.casillasInventario=Object.entries(old.inventario).map(([articulo,cantidad])=>({articulo,cantidad}));old.almacenMigracion={madera:75};old.herramienta='hacha';for(const k of ['filaBarra','casillaActiva','equipo','buffs','ultimoConsumoAt'])delete old[k];const source=clone(old),next=migrarEstado(old);assert.deepEqual(old,source);assert.equal(next.version,5);assert.equal(validarEstado(next),null);for(const [id,n]of Object.entries(old.inventario))assert.equal((next.inventario[id]||0)+(next.almacenMigracion[id]||0),n);assert.equal(next.almacenMigracion.madera,75);assert.equal(next.inventario.herramienta_hacha,1);assert.equal(next.casillasInventario[next.filaBarra*12+next.casillaActiva].articulo,'herramienta_hacha');
});
test('Partidas corruptas no duplican equipo, no aceptan pilas inválidas ni claves especiales',()=>{
 const m=game();for(const edit of [s=>s.equipo.casco='espada_cobre',s=>s.buffs=[{tipo:'velocidad',valor:Infinity,hasta:now+1000}],s=>s.casillasInventario[0]={articulo:'constructor',cantidad:1}]){const broken=clone(m.estado);edit(broken);const before=clone(m.estado);assert.equal(m.cargarJSON(JSON.stringify(broken)).ok,false);assert.deepEqual(m.estado,before);}
});
console.log(JSON.stringify({suite:'barra-equipo-comida',ok:failures===0,checks,failures}));if(failures)process.exitCode=1;
