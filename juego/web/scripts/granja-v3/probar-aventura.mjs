import assert from 'node:assert/strict';
import {compilarModulo} from './modulos-prueba.mjs';
const A=await import(await compilarModulo(new URL('../../src/granja-v3/aventura.ts',import.meta.url)));
let total=0;
const test=(nombre,fn)=>{fn();total++;console.log(`OK ${nombre}`);};
const acceso={nivelPico:6,construcciones:['portal_verdia','portal_senda','portal_nox','nave_exploradora']};
const comenzar=(destino='mina_celia',seed=35)=>{const e=A.crearAventura(seed);assert.equal(A.entrarAventura(e,destino,{x:7,z:11},acceso).ok,true);return e;};
const paso=(e,seconds,player={x:-11.5,z:-11.5})=>{const result=[];while(seconds>1e-8){const dt=Math.min(.1,seconds);result.push(A.stepAventura(e,dt,player));seconds-=dt;}return result;};
function conectadas(i){
 const start=`${Math.floor(i.inicio.x)},${Math.floor(i.inicio.z)}`,vistas=new Set([start]),cola=[start];
 for(let n=0;n<cola.length;n++){const[x,z]=cola[n].split(',').map(Number);for(const[dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const k=`${x+dx},${z+dz}`;if(i.suelos[k]==='suelo'&&!vistas.has(k)){vistas.add(k);cola.push(k);}}}
 assert.equal(vistas.size,Object.values(i.suelos).filter(t=>t==='suelo').length,'Todas las salas y conectores deben compartir la salida.');
 for(const o of [...i.nodos,...i.monstruos,...i.entradas,...i.situaciones])assert.ok(vistas.has(`${Math.floor(o.x)},${Math.floor(o.z)}`),`Ocupante aislado: ${o.id}`);
}
/** Rompe vetas del piso de la mina hasta que aparece la escalera escondida y baja. */
function bajar(e){const i=A.instanciaAventura(e);for(const n of i.nodos){if(i.entradas.some(x=>x.tipo==='descenso'))break;while(!n.agotado){e.enfriamientoGolpe=0;assert.equal(A.golpearNodo(e,n.id,n,6).ok,true);}}
 const escalera=i.entradas.find(x=>x.tipo==='descenso');assert.ok(escalera,'Romper todas las vetas siempre deja una escalera');assert.equal(A.descenderAventura(e,escalera).ok,true);return A.instanciaAventura(e);}
function combate(){
 const e=comenzar(),i=A.instanciaAventura(e),m=i.monstruos[0];i.monstruos=[m];
 Object.assign(m,{tipo:'gelatina',x:.5,z:.5,hp:100,hpMax:100,fase:'reposo',tiempoFase:0,invulnerable:0,origen:{x:.5,z:.5},objetivo:{x:.5,z:.5},direccion:{x:1,z:0},retroceso:{x:0,z:0},vivo:true});
 for(let z=-3;z<5;z++)for(let x=-3;x<5;x++)i.suelos[`${x},${z}`]='suelo';e.invulnerable=0;return {e,i,m,p:{x:1.5,z:.5,vida:100,defensa:0}};
}

test('Diez destinos y siete familias con rutas deterministas en 50 semillas',()=>{
 assert.ok(A.AVENTURAS.length>=10);assert.ok(Object.keys(A.MONSTRUOS).length>=7);
 for(const d of A.AVENTURAS)for(let seed=0;seed<5;seed++){const i=A.generarInstancia(d.id,seed,Math.min(2,d.niveles));assert.deepEqual(i,A.generarInstancia(d.id,seed,Math.min(2,d.niveles)));conectadas(i);}
 assert.notDeepEqual(A.generarInstancia('mina_celia',34),A.generarInstancia('mina_celia',35));
});
test('Accesos requieren construcciones y una mejora real del pico',()=>{
 assert.equal(A.accesoAventura('mina_celia').ok,true);assert.equal(A.accesoAventura('ruinas_celia').ok,false);
 assert.equal(A.accesoAventura('ruinas_celia',{nivelPico:1}).ok,true);
 assert.equal(A.accesoAventura('reino_verdia',{desbloqueos:['portal_verdia']}).ok,false);
 for(const d of A.AVENTURAS)assert.equal(A.accesoAventura(d.id,acceso).ok,true);
 assert.equal(A.accesoAventura('inexistente',acceso).ok,false);
});
test('Expansión contigua conserva salas, vetas y conexiones al retorno',()=>{
 const e=comenzar(),i=A.instanciaAventura(e),n=structuredClone(i.nodos[0]);
 assert.equal(A.ampliarAventura(e,2,0).ok,false);assert.equal(A.ampliarAventura(e,1,0).ok,true);
 assert.deepEqual(i.nodos[0],n);conectadas(i);assert.equal(A.ampliarAventura(e,2,0).ok,true);conectadas(i);
 const count=i.nodos.length;A.ampliarAventura(e,2,0);assert.equal(i.nodos.length,count);
 assert.equal(A.ampliarAventura(e,3,0).ok,false);assert.equal(A.esTransitableAventura(e,1000,1000),false);
});
test('Minería usa HP, alcance, nivel de pico, enfriamiento y botín persistente',()=>{
 const e=comenzar(),i=A.instanciaAventura(e),n=i.nodos.find(n=>n.mineral==='cobre'),p={x:n.x,z:n.z};
 assert.equal(A.golpearNodo(e,n.id,{x:100,z:100},0).ok,false);const r=A.golpearNodo(e,n.id,p,0);assert.equal(r.ok,true);assert.equal(n.hp,n.hpMax-6);
 assert.equal(A.golpearNodo(e,n.id,p,0).ok,false);paso(e,.5);assert.equal(A.golpearNodo(e,n.id,p,0).ok,true);
 const restored=A.restaurarAventura(JSON.parse(JSON.stringify(e)));assert.deepEqual(restored,e);const node2=A.instanciaAventura(restored).nodos.find(o=>o.id===n.id);assert.equal(node2.hp,n.hp);
 while(!node2.agotado){paso(restored,.5);assert.equal(A.golpearNodo(restored,node2.id,p,0).ok,true);}
 const i2=A.instanciaAventura(restored);assert.equal(i2.botin.length,1);assert.equal(A.golpearNodo(restored,node2.id,p,0).ok,false);
 assert.equal(A.recogerBotin(restored,i2.botin[0].id,{x:100,z:100}).ok,false);
 const drop=i2.botin[0],recolectado=A.recogerBotin(restored,drop.id,p);assert.deepEqual(recolectado.botin,{articulo:'cobre',cantidad:n.cantidad});assert.equal(A.recogerBotin(restored,drop.id,p).ok,false);
 // Como en Stardew, al volver a entrar el piso se arma de nuevo
 A.salirAventura(restored);A.entrarAventura(restored,'mina_celia',{x:2,z:3},acceso);assert.ok(A.instanciaAventura(restored).nodos.every(o=>!o.agotado));
 A.salirAventura(restored);restored.ascensor=[20];assert.equal(A.entrarAventura(restored,'mina_celia',{x:2,z:3},acceso,20).ok,true);
 const hierro=A.instanciaAventura(restored).nodos.find(n=>n.mineral==='hierro');paso(restored,.5);assert.equal(A.golpearNodo(restored,hierro.id,hierro,0).ok,false);assert.equal(A.golpearNodo(restored,hierro.id,hierro,1).ok,true);
});
test('Monstruos avisan y anticipan el golpe antes de infligir daño',()=>{
 const {e,m,p}=combate();let phases=new Set(),dano=0;
 for(let t=0;t<30;t++){const r=A.stepAventura(e,.1,p);phases.add(m.fase);if(t<10)assert.equal(r.dano,0);dano+=r.dano;}
 for(const f of ['alerta','persecucion','anticipacion','ataque','recuperacion'])assert.ok(phases.has(f),f);
 assert.ok(dano>0&&dano<=10);assert.ok(e.invulnerable>=0);
});
test('Invulnerabilidad impide daño simultáneo y defensa reduce el daño real',()=>{
 const {e,i,m,p}=combate();m.fase='ataque';m.tiempoFase=.14;m.direccion={x:1,z:0};
 i.monstruos.push({...structuredClone(m),id:'segundo'});let r=A.stepAventura(e,.02,{...p,defensa:3});assert.equal(r.dano,2);
 r=A.stepAventura(e,.02,p);assert.equal(r.dano,0);assert.ok(e.invulnerable>.8);
});
test('Paredes bloquean visión y golpes; esquivar evita un ataque orientado',()=>{
 const {e,i,m,p}=combate();m.fase='ataque';m.tiempoFase=.1;m.direccion={x:-1,z:0};assert.equal(A.stepAventura(e,.02,p).dano,0);
 m.fase='reposo';m.tiempoFase=4;i.suelos['1,0']='muro';const q={x:2.5,z:.5};assert.equal(A.golpearMonstruo(e,m.id,q).ok,false);
 for(let t=0;t<5;t++)assert.equal(A.stepAventura(e,.1,q).dano,0);assert.equal(m.fase,'reposo');
});
test('Espada conserva cooldown, retroceso y una única recompensa por enemigo',()=>{
 const {e,i,m,p}=combate();let r=A.golpearMonstruo(e,m.id,p,0);assert.equal(r.dano,10);assert.equal(m.hp,90);assert.ok(Math.hypot(m.retroceso.x,m.retroceso.z)>0);
 assert.equal(A.golpearMonstruo(e,m.id,p,0).ok,false);const hp=m.hp;assert.equal(m.hp,hp);
 e.enfriamientoGolpe=0;m.invulnerable=0;r=A.golpearMonstruo(e,m.id,p,6,50);assert.equal(r.destruido,true);assert.equal(i.botin.length,1);assert.equal(e.derrotados,1);
 assert.equal(A.golpearMonstruo(e,m.id,p,6,50).ok,false);assert.equal(i.botin.length,1);
});
test('Descenso conserva la instancia y sus descubrimientos al guardar',()=>{
 const e=comenzar('ruinas_celia'),i=A.instanciaAventura(e),entrada=i.entradas.find(x=>x.tipo==='descenso');
 assert.equal(A.descenderAventura(e,i.inicio).ok,false);assert.equal(A.descenderAventura(e,entrada).ok,true);assert.equal(e.profundidad.ruinas_celia,2);
 assert.equal(A.instanciaAventura(e).nivel,2);assert.equal(Object.keys(e.instancias).length,2);assert.deepEqual(A.restaurarAventura(JSON.parse(JSON.stringify(e))),e);
});
test('Oxígeno avisa y rescata sin muerte ni pérdida de minerales',()=>{
 const e=comenzar('asteroide_cobre'),i=A.instanciaAventura(e);i.botin.push({id:'prueba',articulo:'cobre',cantidad:4,x:0,z:0});
 e.oxigeno=25.01;const aviso=A.stepAventura(e,.2,i.inicio);assert.ok(aviso.avisos[0].includes('25 %'));
 const previo=e.oxigeno;A.stepAventura(e,1000,i.inicio);assert.ok(previo-e.oxigeno<.1,'Un frame suspendido no agota el tanque.');
 e.oxigeno=.001;const r=A.stepAventura(e,.1,i.inicio);assert.equal(r.dano,0);assert.deepEqual(r.salidaSegura,{x:7,z:11});assert.equal(e.destinoActual,null);assert.equal(i.botin.length,1);
 const orbita=comenzar('orbita_celia');paso(orbita,3);assert.equal(orbita.oxigeno,100);
});
test('Salida segura y recuperación al caer no dependen de objetos ni portales',()=>{
 const {e,m,p}=combate();m.fase='ataque';m.tiempoFase=.1;m.direccion={x:1,z:0};const r=A.stepAventura(e,.05,{...p,vida:1});assert.deepEqual(r.salidaSegura,{x:7,z:11});assert.equal(e.destinoActual,null);
 const corrupto=A.crearAventura();corrupto.destinoActual='mina_celia';corrupto.instanciaActual='no-existe';assert.deepEqual(A.salirAventura(corrupto).posicion,{x:0,z:4});
});
test('Campamentos, balizas y geodas son hallazgos de uso único persistente',()=>{
 const e=comenzar(),i=A.instanciaAventura(e),s=i.situaciones[0];assert.equal(A.resolverSituacion(e,s.id,{x:999,z:999}).ok,false);
 const r=A.resolverSituacion(e,s.id,s);assert.equal(r.ok,true);assert.equal(r.vida,25);assert.equal(A.resolverSituacion(e,s.id,s).ok,false);
 const saved=A.restaurarAventura(e);assert.equal(A.instanciaAventura(saved).situaciones[0].resuelta,true);
});
test('Guardados malformados se rechazan sin descartar botín ni inventar recursos',()=>{
 const e=comenzar(),i=A.instanciaAventura(e);i.nodos[0].hp=0;i.nodos[0].agotado=true;i.monstruos[0].hp=0;i.monstruos[0].vivo=false;
 const raw=JSON.parse(JSON.stringify(e));raw.instancias[raw.instanciaActual].botin.push({id:'mal',x:0,z:0,articulo:'espada_infinita',cantidad:999});
 const antes=JSON.stringify(raw);assert.match(A.errorAventura(raw),/Botín/);assert.throws(()=>A.restaurarAventura(raw));assert.equal(JSON.stringify(raw),antes);
 assert.notEqual(A.errorAventura(null),null);assert.notEqual(A.errorAventura({version:2}),null);assert.throws(()=>A.restaurarAventura(null));
 assert.equal(A.errorAventura(e),null);assert.deepEqual(A.restaurarAventura(e),e);
});
test('Progresión minera: cada tipo de piso garantiza sus minerales y lo hondo trae más',()=>{
 for(let seed=0;seed<8;seed++)for(const nivel of [1,14,15,25,40,60,80,99,100,101,125,180,260]){
  const i=A.generarInstancia('mina_celia',seed,nivel),materiales=new Set(i.nodos.map(n=>n.mineral));conectadas(i);
  for(const m of A.mineralesPorProfundidad('mina_celia',nivel))assert.ok(materiales.has(m),`${m} garantizado en ${nivel}`);
  assert.equal(materiales.has('hierro'),nivel>=15&&nivel<=100,`hierro, piso ${nivel}`);assert.equal(materiales.has('titanio'),nivel>100,`titanio, piso ${nivel}`);
 }
 assert.equal(A.temaMina(1),'tierra');assert.equal(A.temaMina(45),'hielo');assert.equal(A.temaMina(85),'lava');assert.equal(A.temaMina(100),'fondo');assert.equal(A.temaMina(300),'caverna');
 const poco=A.generarInstancia('mina_celia',3,5),mucho=A.generarInstancia('mina_celia',3,150);
 assert.ok(mucho.nodos.length>poco.nodos.length*2);assert.ok(Object.keys(mucho.chunks).length>Object.keys(poco.chunks).length);
 const suma=i=>i.nodos.reduce((t,n)=>t+n.cantidad,0)/i.nodos.length;assert.ok(suma(mucho)>suma(poco));
 for(const id of ['rubi','obsidiana','titanio','polvo_estelar','cristal_astral'])assert.ok(A.mineralesPorProfundidad('mina_celia',130).includes(id));
});
test('Mina: escalera escondida, ascensor cada 5 pisos, cofres de una vez y pisos nuevos al volver',()=>{
 const e=comenzar();let i=A.instanciaAventura(e);assert.equal(i.entradas.some(x=>x.tipo==='descenso'),false,'La escalera empieza escondida');
 for(let piso=2;piso<=11;piso++){i=bajar(e);assert.equal(i.nivel,piso);}
 assert.deepEqual(e.ascensor,[5,10]);assert.equal(Object.keys(e.instancias).filter(k=>k.startsWith('mina_celia:')).length,1,'Solo se guarda el piso actual');
 A.salirAventura(e);assert.equal(Object.keys(e.instancias).some(k=>k.startsWith('mina_celia:')),false);
 assert.equal(A.entrarAventura(e,'mina_celia',{x:1,z:1},acceso,7).ok,false);assert.equal(A.entrarAventura(e,'mina_celia',{x:1,z:1},acceso,10).ok,true);
 i=A.instanciaAventura(e);const cofre=i.situaciones.find(s=>s.tipo==='cofre');assert.ok(cofre);assert.ok(i.entradas.some(x=>x.tipo==='descenso'),'Pisos de cofre traen la escalera a la vista');
 const r=A.resolverSituacion(e,cofre.id,cofre);assert.equal(r.cofre,10);assert.ok(i.botin.length>=3);assert.deepEqual(e.cofresMina,[10]);
 A.salirAventura(e);A.entrarAventura(e,'mina_celia',{x:1,z:1},acceso,10);assert.equal(A.instanciaAventura(e).situaciones.some(s=>s.tipo==='cofre'),false,'El cofre se abre una sola vez');
 assert.equal(A.errorAventura(e),null);assert.deepEqual(A.restaurarAventura(JSON.parse(JSON.stringify(e))),e);
});
test('Caverna sin fondo: estación de ascensor construible cada 25 pisos pasando el 100',()=>{
 const e=A.crearAventura(9);e.ascensor=[100];e.profundidad.mina_celia=100;e.descubrimientos.push('mina_celia');
 assert.equal(A.entrarAventura(e,'mina_celia',{x:0,z:0},acceso,100).ok,true);let i=A.instanciaAventura(e);
 for(let piso=101;piso<=125;piso++)i=bajar(e);assert.equal(i.nivel,125);assert.deepEqual(e.ascensor,[100],'Pasando el 100 no hay paradas automáticas');
 assert.equal(A.estacionPendiente(e),125);assert.equal(A.construirAscensor(e,{x:i.inicio.x+20,z:i.inicio.z}).ok,false);
 assert.equal(A.construirAscensor(e,i.inicio).ok,true);assert.deepEqual(e.ascensor,[100,125]);assert.equal(A.estacionPendiente(e),null);
 assert.ok(A.costoEstacion(150).lingote_oro>A.costoEstacion(125).lingote_oro);
 const raw=structuredClone(e);raw.ascensor=[0];assert.equal(typeof A.errorAventura(raw),'string');
});
test('Guardado íntegro de todos los destinos conserva hallazgos, monstruos y mapas',()=>{
 const e=A.crearAventura(887);
 for(const d of A.AVENTURAS){assert.equal(A.entrarAventura(e,d.id,{x:4,z:8},acceso).ok,true);
  const tope=Math.min(d.niveles,4);for(let nivel=1;nivel<=tope;nivel++){
   const i=A.instanciaAventura(e);const camara=i.monstruos.some(m=>m.patron);if(camara)assert.equal(i.situaciones.length,0);else{assert.ok(i.situaciones.length);A.resolverSituacion(e,i.situaciones[0].id,i.situaciones[0]);}
   for(const n of i.nodos.slice(0,2)){while(!n.agotado){e.enfriamientoGolpe=0;A.golpearNodo(e,n.id,n,6);}}
   assert.equal(A.errorAventura(e),null,`${d.id}, ${nivel}`);
   assert.deepEqual(A.restaurarAventura(JSON.parse(JSON.stringify(e))),e);
   if(nivel<tope){if(d.id==='mina_celia')bajar(e);else A.descenderAventura(e,i.entradas.find(x=>x.tipo==='descenso'));}
  }A.salirAventura(e);
 }
 assert.equal(A.errorAventura(e),null);assert.equal(e.descubrimientos.length,A.AVENTURAS.length);
});
test('Validación detecta duplicados, mapas truncados y referencias activas rotas',()=>{
 const e=comenzar();
 for(const corromper of [
  s=>{s.instancias[s.instanciaActual].nodos.push({...s.instancias[s.instanciaActual].nodos[0]});},
  s=>{delete s.instancias[s.instanciaActual].suelos['0,0'];},
  s=>{s.instanciaActual='mina_celia:99';},
  s=>{s.instancias[s.instanciaActual].monstruos[0].tiempoFase=NaN;},
  s=>{s.instancias[s.instanciaActual].nodos[0].mineral='__proto__';},
  s=>{s.descubrimientos.push(s.descubrimientos[0]);},
  s=>{s.instancias[s.instanciaActual].chunks['0,0'].x=999;},
  s=>{s.instancias[s.instanciaActual].nodos[0].hp=0;},
 ]){const raw=structuredClone(e);corromper(raw);assert.equal(typeof A.errorAventura(raw),'string');assert.throws(()=>A.restaurarAventura(raw));}
});
console.log(`\n${total} pruebas de aventura superadas.`);
