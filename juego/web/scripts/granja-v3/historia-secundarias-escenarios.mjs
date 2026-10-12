import assert from 'node:assert/strict';
import {H,A,I,C,M,UI,PRINCIPALES,game,act,ha,fail,give,at,listen,sleep,solveCircuit,walkMaze,grow,finish,avanzarReal} from './historia-escenarios.mjs';
import {compilarModulo} from './modulos-prueba.mjs';
const O=await import(await compilarModulo(new URL('../../src/granja-v3/objetos.ts',import.meta.url)));
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


export {base,meet,craft,work,extra,extras};
