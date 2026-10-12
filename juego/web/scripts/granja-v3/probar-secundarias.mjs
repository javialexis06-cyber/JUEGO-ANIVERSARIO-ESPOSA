import assert from 'node:assert/strict';
import {H,A,I,C,M,UI,PRINCIPALES,game,act,ha,fail,give,at,listen,sleep,solveCircuit,walkMaze,grow,finish,avanzarReal} from './historia-escenarios.mjs';
import {compilarModulo} from './modulos-prueba.mjs';
const O=await import(await compilarModulo(new URL('../../src/granja-v3/objetos.ts',import.meta.url)));
let checks=0;const test=(t,fn)=>{fn();checks++;console.log('OK '+t);};
const extras=H.MISIONES_HISTORIA.filter(q=>q.clase!=='principal');
function base(){const g=game();while(Object.keys(g.estado.historia.completadas).length<36){const q=PRINCIPALES.find(q=>!g.estado.historia.completadas[q.id]&&H.historiaDisponible(g.estado,q.id));assert.ok(q);finish(g,q);}return g;}
function meet(g,id){const n=A.npcAstra(id);for(let intento=0;intento<7;intento++){
 at(g,n.region);for(const min of [700,900,1100,1200]){g.estado.jornada.minutos=min;const p=A.posicionNpcAstra(g.estado,id);if(!p||p.interior)continue;const r=g.actuar({tipo:'astra',accion:{tipo:'hablar',id},xJugador:p.x,zJugador:p.z});if(r.ok){listen(g);return;}}
 sleep(g);
}assert.fail('No se pudo escuchar el primer recuerdo de '+id);}
function craft(g,item,n){at(g,'granja');const receta=O.RECETAS.find(r=>r.salida.articulo===item&&!r.desbloqueo&&r.nivel===0);assert.ok(receta,item);const materiales=Object.fromEntries(Object.entries(receta.ingredientes).map(([k,v])=>[k,v*n]));give(g,{...g.estado.inventario,...materiales});
 if(receta.estacion==='mano'){act(g,{tipo:'produccion',accion:{tipo:'fabricar',recetaId:receta.id,cantidad:n},xJugador:0,zJugador:0});return;}
 const articulo=receta.estacion==='banco'?'banco_trabajo':receta.estacion;let maquina=g.estado.produccion.maquinas.find(m=>m.articulo===articulo);
 if(!maquina){give(g,{...g.estado.inventario,[articulo]:1});let puesto=false;for(let z=0;z<14&&!puesto;z++)for(let x=-8;x<8&&!puesto;x++)puesto=g.actuar({tipo:'produccion',accion:{tipo:'colocar_maquina',articulo,zona:'granja',x,z},xJugador:x,zJugador:z}).ok;assert.ok(puesto,articulo);maquina=g.estado.produccion.maquinas.find(m=>m.articulo===articulo);}
 act(g,{tipo:'produccion',accion:{tipo:'encolar_receta',id:maquina.id,recetaId:receta.id,cantidad:n},xJugador:maquina.x,zJugador:maquina.z});
 for(let i=0;i<n+1;i++){avanzarReal(receta.duracionMs+1000);g.actualizar();maquina=g.estado.produccion.maquinas.find(m=>m.id===maquina.id);for(let j=0;j<maquina.salida.length;j++){const pila=maquina.salida[j];if(!pila)continue;const slot=g.estado.casillasInventario.findIndex(p=>p?.articulo===pila.articulo&&p.cantidad+pila.cantidad<=999)??-1,libre=slot>=0?slot:g.estado.casillasInventario.findIndex(p=>!p);assert.ok(libre>=0);act(g,{tipo:'produccion',accion:{tipo:'transferir',desde:{tipo:'maquina',id:maquina.id,casilla:j},hasta:{tipo:'mochila',casilla:libre},cantidad:pila.cantidad},xJugador:maquina.x,zJugador:maquina.z});}}
}
function work(g,p){const key=p.registro,n=p.cantidad??1;
 if(key.startsWith('fabricar_'))craft(g,key.slice(9),n);
 else if(key==='pescar'){at(g,'granja');g.estado.zona='lago';give(g,{...g.estado.inventario,herramienta_cana:1,lombriz:10});act(g,{tipo:'herramienta',herramienta:'cana'});act(g,{tipo:'pescar',precision:.9});}
 else if(key.startsWith('observacion:')){const id=key.slice(12),region=A.RECURSOS_ASTRA.find(r=>r.recursos.some(d=>d.id===id)).id;at(g,region);const index=A.RECURSOS_ASTRA.find(r=>r.id===region).recursos.findIndex(d=>d.id===id),p=A.puntoRecurso(region,index);act(g,{tipo:'astra',accion:{tipo:'observar',id},xJugador:p.x,zJugador:p.z});}
 else assert.fail('Oficio sin escenario: '+key);
}
function extra(g,q){if(q.personal)meet(g,q.personal);for(let i=0;i<Math.min(2,q.pistas?.length??0);i++){const p=q.pistas[i];at(g,p.region);ha(g,{tipo:'descubrir',id:q.id,indice:i},p);}
 at(g,q.region);ha(g,{tipo:'aceptar',id:q.id});listen(g);
 while(g.estado.historia.activas[q.id].paso<q.pasos.length){const a=g.estado.historia.activas[q.id],p=q.pasos[a.paso],pos=p.punto??{x:0,z:22};at(g,p.region);
  if(p.tipo==='observar')for(let i=0;i<p.datos.length;i++)ha(g,{tipo:'observar',id:q.id,indice:i},pos);
  else if(p.tipo==='preguntar')for(const n of p.participantes){const npc=A.npcAstra(n.id);at(g,npc.region);let pos=A.posicionNpcAstra(g.estado,n.id);if(!pos){meet(g,n.id);at(g,npc.region);pos=A.posicionNpcAstra(g.estado,n.id);}assert.ok(pos,n.id);g.estado.astra.interior=pos.interior;ha(g,{tipo:'solicitar',id:q.id,npc:n.id},pos);}
  else if(p.tipo==='entregar'){give(g,{...g.estado.inventario,...p.materiales});ha(g,{tipo:'preparar',id:q.id},pos);}
  else if(p.tipo==='devolver_pesca'){const pez=Object.keys(a.estadisticas).find(k=>k.startsWith('captura:')&&a.estadisticas[k]>0).slice(8);ha(g,{tipo:'devolver_pez',id:q.id,pez},pos);}
  else if(p.tipo==='nota')ha(g,{tipo:'guardar_nota',id:q.id,texto:'¿Cómo se mantiene la reserva del río?'},pos);
  else if(['secuencia','contraste','circuito','laberinto'].includes(p.tipo)){ha(g,{tipo:'iniciar_reto',id:q.id},pos);if(p.tipo==='secuencia')for(const opcion of H.ordenHistoria(p,a))ha(g,{tipo:'responder',opcion});else if(p.tipo==='contraste')ha(g,{tipo:'responder',opcion:String(p.respuesta)});else if(p.tipo==='circuito')solveCircuit(g);else walkMaze(g,p);}
  else{if(p.tipo==='cultivar'){
    grow(g);if(p.cantidad>1){const primero=new Set(Object.values(a.cultivos).map(c=>c.cultivo));const datos=C.CULTIVOS.filter(c=>!c.region&&!c.enrejado&&c.cosecha!=='guadana'&&c.estaciones.includes(g.calendario().estacion)&&c.climas.includes('templado')&&!primero.has(c.id));assert.ok(datos.length);const objetivo=datos[0];const primerId=C.CULTIVOS.find(c=>!c.region&&!c.enrejado&&c.cosecha!=='guadana'&&c.estaciones.includes(g.calendario().estacion)&&c.climas.includes('templado')).id;
    // grow acepta una especie elegida, conserva siembra/riego/noches y cosecha por acciones.
    grow(g,objetivo.id);assert.ok(!primero.has(objetivo.id));}
   }
   if(p.tipo==='cuidar'){at(g,'granja');give(g,{...g.estado.inventario,heno:20});for(const n of g.estado.animales.slice(0,p.cantidad)){act(g,{tipo:'cuidar',animalId:n.id,metodo:'alimentar'});act(g,{tipo:'cuidar',animalId:n.id,metodo:'acariciar'});}}
   if(p.tipo==='jornadas')for(let i=0;i<p.cantidad;i++)sleep(g);
   if(p.tipo==='oficio')work(g,p);
   at(g,p.region);ha(g,{tipo:'comprobar',id:q.id},pos);
  }
  assert.equal(M.validarEstado(g.estado),null,p.id);
 }
 listen(g);ha(g,{tipo:'terminar',id:q.id,opcion:0});listen(g);assert.equal(M.validarEstado(g.estado),null,q.id);assert.ok(game().cargarJSON(g.exportar(true)).ok,q.id+' recarga');
}

test('181 contratos adicionales conservan todos los IDs y dependencias; 13 secretos tienen pistas públicas',()=>{assert.equal(extras.length,181);assert.equal(extras.filter(q=>q.personal).length,142);assert.equal(extras.filter(q=>q.pistas).length,13);const ids=new Set(H.MISIONES_HISTORIA.map(q=>q.id));for(const q of extras){for(const r of q.requiere)assert.ok(ids.has(r),r);for(const p of q.pasos)for(const [id,n]of Object.entries(p.materiales??{})){assert.ok(O.obtenerObjeto(id),p.id+': '+id);assert.ok(n>0);}}});
let g,snapshot;test('La campaña previa se completa por acciones para preparar los escenarios secundarios',()=>{g=base();snapshot=g.exportar(true);});
test('La misión personal requiere conocer y escuchar; ver un nombre en el diario no acredita esa relación',()=>{at(g,'pueblo_sol');assert.equal(H.historiaDisponible(g.estado,'V_pescadora'),false);fail(g,{tipo:'aceptar',id:'V_pescadora'});meet(g,'pescadora');assert.equal(H.historiaDisponible(g.estado,'V_pescadora'),true);});
test('Los secretos requieren dos indicios reales y proximidad; una pista ni una casa privada los abre',()=>{const q=H.misionHistoria('S03'),p=q.pistas[0];at(g,p.region);fail(g,{tipo:'descubrir',id:q.id,indice:0},{x:p.x+10,z:p.z+10});ha(g,{tipo:'descubrir',id:q.id,indice:0},p);assert.equal(H.historiaDisponible(g.estado,q.id),false);const otro=q.pistas[1];at(g,otro.region);ha(g,{tipo:'descubrir',id:q.id,indice:1},otro);assert.equal(H.historiaDisponible(g.estado,q.id),true);});
test('Inventario y contadores anteriores no fabrican raciones para una misión de oficio',()=>{const m=game();assert.ok(m.cargarJSON(snapshot).ok);meet(m,'cocinero');const q=H.misionHistoria('V_cocinero');at(m,q.region);ha(m,{tipo:'aceptar',id:q.id});listen(m);let a=m.estado.historia.activas[q.id],p=q.pasos[a.paso];assert.equal(p.tipo,'observar');for(let i=0;i<p.datos.length;i++)ha(m,{tipo:'observar',id:q.id,indice:i},p.punto);p=q.pasos[a.paso];assert.equal(p.registro,'fabricar_pan');m.estado.estadisticas.fabricar_pan=999;give(m,{...m.estado.inventario,pan:5});fail(m,{tipo:'comprobar',id:q.id},p.punto??{x:0,z:22});work(m,p);at(m,q.region);ha(m,{tipo:'comprobar',id:q.id},p.punto??{x:0,z:22});assert.ok(m.estado.historia.activas[q.id].estadisticas.fabricar_pan>=2);});
test('Migración conserva recibos previos y rechaza listas y checkpoints dañados sin borrar la partida',()=>{const m=game();assert.ok(m.cargarJSON(snapshot).ok);at(m,'pueblo_sol');meet(m,'mercader');ha(m,{tipo:'aceptar',id:'V_mercader'});listen(m);const old=structuredClone(m.estado);delete old.historia.pistas;delete old.historia.notas;delete old.historia.activas.V_mercader.cuidadosDias;assert.ok(m.cargarJSON(JSON.stringify(old)).ok);assert.deepEqual(m.estado.historia.completadas,old.historia.completadas);for(const edit of [s=>s.historia.pistas.S03=[9],s=>s.historia.notas.S12='x'.repeat(501),s=>s.historia.activas.V_mercader.cuidados={},s=>s.historia.activas.V_mercader.cuidados=[4],s=>s.historia.activas.V_mercader.estadisticas.inventado=10]){const bad=structuredClone(m.estado);edit(bad);const before=m.exportar(true);assert.equal(m.cargarJSON(JSON.stringify(bad)).ok,false);assert.equal(m.exportar(true),before);}});

test('Las 181 historias cierran sus objetivos por acciones, abren 142 recuerdos posteriores y guardan notas locales',()=>{for(const q of extras){console.log('Contrato '+q.id);extra(g,q);}assert.equal(Object.keys(g.estado.historia.completadas).length,217);assert.equal(g.estado.astra.personales.length,142);assert.equal(g.estado.historia.notas.S12,'¿Cómo se mantiene la reserva del río?');for(const q of extras.filter(q=>q.personal)){const n=A.npcAstra(q.personal);meet(g,n.id);const pos=A.posicionNpcAstra(g.estado,n.id);assert.ok(pos);g.estado.astra.interior=pos.interior;act(g,{tipo:'astra',accion:{tipo:'escena',id:'VID_'+n.id+'_2'},xJugador:pos.x,zJugador:pos.z});listen(g);}});
console.log(JSON.stringify({suite:'historias-secundarias',checks,historias:181,objetivos:617,recuerdos_posteriores:142,alcance:'Acciones reales con recursos, ubicaciones y capacidad preparados; no certifica economía ordinaria ni teléfonos.'}));
