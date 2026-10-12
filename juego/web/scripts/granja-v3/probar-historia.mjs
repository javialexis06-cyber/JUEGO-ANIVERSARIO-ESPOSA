import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compilarModulo} from './modulos-prueba.mjs';
const load=async n=>import(await compilarModulo(new URL('../../src/granja-v3/'+n+'.ts',import.meta.url)));
const H=await load('historia'),A=await load('astra'),R=await load('historia-retos'),I=await load('inventario'),C=await load('catalogo'),M=await load('motor'),UI=await load('astra-ui');await UI.cargarLoreAstra();
let now=1_800_000_000_000,perfil=null,checks=0;
const game=()=>new M.MotorGranja({ahora:()=>now,azar:()=>.3,noche:()=>perfil});
const act=(g,a)=>{const r=g.actuar(a);assert.equal(r.ok,true,JSON.stringify(a)+': '+r.mensaje);return r;};
const ha=(g,a,p={x:0,z:22})=>act(g,{tipo:'historia',accion:a,xJugador:p.x,zJugador:p.z});
const fail=(g,a,p={x:0,z:22})=>{g.actualizar();const before=structuredClone(g.estado),r=g.actuar({tipo:'historia',accion:a,xJugador:p.x,zJugador:p.z});assert.equal(r.ok,false,r.mensaje);assert.deepEqual(g.estado,before);};
const test=(t,fn)=>{fn();checks++;console.log('OK '+t);};
const give=(g,items)=>{g.estado.casillasInventario=I.distribuirInventario(items).casillas;g.estado.inventario=I.resumirCasillas(g.estado.casillasInventario);g.estado.filaBarra=0;g.estado.casillaActiva=0;};
/** Preparación aislada de ubicación, recursos y prueba externa; nunca escribe completadas ni recibos. */
function at(g,region){g.estado.astra.actual=['granja','pueblo_sol'].includes(region)?null:region;g.estado.zona=region==='granja'?'granja':'pueblo';g.estado.interior=null;g.estado.servicio=null;g.estado.astra.interior=null;g.estado.jornada.minutos=700;g.estado.astra.posicion={...(A.planoAstra(region)?.inicio??{x:0,z:8})};}
function listen(g){const ids=[];while(g.estado.astra.escena){const l=UI.lineaActualAstra(g.estado);assert.ok(l,g.estado.astra.escena.id);ids.push(l.id);act(g,{tipo:'astra',accion:{tipo:'continuar'},xJugador:0,zJugador:22});}return ids;}
function sleep(g){at(g,'granja');act(g,{tipo:'dormir',jornada:g.estado.jornada.diasCompletados,edificioId:'casa_inicial',xJugador:-5,zJugador:-.5});act(g,{tipo:'continuar_dia',jornada:g.estado.jornada.diasCompletados});}
function solveCircuit(g){const r=g.estado.historia.reto,solution=[1,1,2,0,0,0,0,0,0];for(let i=0;i<9;i++)if(i!==4)for(let n=(solution[i]-r.giros[i]+4)%4;n>0;n--)ha(g,{tipo:'girar',indice:i});ha(g,{tipo:'probar_circuito'});assert.equal(g.estado.historia.reto,null);}
function walkMaze(g,p){for(const target of ['A','B','R','E']){
 const r=g.estado.historia.reto,queue=[[r.x,r.z,[]]],seen=new Set([r.x+','+r.z]);let path;
 while(queue.length){const[x,z,steps]=queue.shift();if(p.mapa[z][x]===target){path=steps;break;}for(const[dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,zz=z+dz,c=p.mapa[zz]?.[xx],key=xx+','+zz;if(!c||c==='#'||seen.has(key)||c==='E'&&target!=='E')continue;seen.add(key);queue.push([xx,zz,[...steps,[dx,dz]]]);}}
 assert.ok(path,'El laberinto tiene ruta a '+target);for(const[dx,dz]of path)ha(g,{tipo:'mover',dx,dz});if(target==='R')ha(g,{tipo:'retirar_permiso'});
}}
function grow(g){at(g,'granja');const cultivo=C.CULTIVOS.find(c=>!c.region&&!c.enrejado&&c.cosecha!=='guadana'&&c.estaciones.includes(g.calendario().estacion)&&c.climas.includes('templado'));
 give(g,{...g.estado.inventario,[cultivo.semilla]:2,herramienta_azada:1,herramienta_regadera:1});act(g,{tipo:'herramienta',herramienta:'azada'});
 let celda;for(let z=3;z<9&&!celda;z++)for(let x=-2;x<5&&!celda;x++)if(g.celdaAgricola(x,z)&&!g.estado.parcelas.some(p=>p.x===x&&p.z===z))celda={x,z};assert.ok(celda);
 act(g,{tipo:'labrar',...celda});act(g,{tipo:'plantar',cultivo:cultivo.id,...celda});act(g,{tipo:'herramienta',herramienta:'regadera'});
 for(let n=0;n<30;n++){const p=g.estado.parcelas.find(p=>p.x===celda.x&&p.z===celda.z);if(p.cuidado.status==='maduro')break;act(g,{tipo:'regar',...celda});sleep(g);}
 act(g,{tipo:'cosechar',...celda});
}
function finish(g,q,opcion=0){at(g,q.region);ha(g,{tipo:'aceptar',id:q.id});listen(g);
 while(g.estado.historia.activas[q.id].paso<q.pasos.length){const a=g.estado.historia.activas[q.id],p=q.pasos[a.paso],pos=p.punto??{x:0,z:22};at(g,p.region);
  if(p.tipo==='observar')for(let i=0;i<p.datos.length;i++)ha(g,{tipo:'observar',id:q.id,indice:i},pos);
  else if(p.tipo==='preguntar')for(const n of p.participantes){at(g,n.comision?.region??A.npcAstra(n.id).region);const pos=A.posicionNpcAstra(g.estado,n.id);assert.ok(pos,n.id);g.estado.astra.interior=pos.interior;ha(g,{tipo:'solicitar',id:q.id,npc:n.id},pos);}
  else if(p.tipo==='entregar'){give(g,{...g.estado.inventario,...p.materiales});ha(g,{tipo:'preparar',id:q.id},pos);}
  else if(['secuencia','contraste','circuito','laberinto'].includes(p.tipo)){
   if(p.planes)ha(g,{tipo:'elegir_plan',id:q.id,opcion},pos);if(process.env.HISTORIA_CHECKPOINTS&&['P03','P15','F07'].includes(q.id)&&['secuencia','laberinto','circuito'].includes(p.tipo)){g.estado.astra.posicion=q.region==='pueblo_sol'?{...pos}:Array.from({length:25},(_,i)=>({x:pos.x+i%5-2,z:pos.z+Math.floor(i/5)-2})).find(p=>A.libreRegionAstra(p.region??q.region,p.x,p.z));fs.mkdirSync(process.env.HISTORIA_CHECKPOINTS,{recursive:true});fs.writeFileSync(process.env.HISTORIA_CHECKPOINTS+'/'+q.id+'.json',g.exportar(true));}ha(g,{tipo:'iniciar_reto',id:q.id},pos);
   if(p.tipo==='secuencia')for(const opcion of H.ordenHistoria(p,a))ha(g,{tipo:'responder',opcion});
   else if(p.tipo==='contraste')ha(g,{tipo:'responder',opcion:String(p.respuesta)});
   else if(p.tipo==='circuito')solveCircuit(g);else walkMaze(g,p);
  }else{
   if(p.tipo==='cultivar')grow(g);
   if(p.tipo==='cuidar'){at(g,'granja');give(g,{...g.estado.inventario,heno:20});for(const n of g.estado.animales.slice(0,p.cantidad)){act(g,{tipo:'cuidar',animalId:n.id,metodo:'alimentar'});act(g,{tipo:'cuidar',animalId:n.id,metodo:'acariciar'});}}
   if(p.tipo==='jornadas')for(let i=0;i<(a.plan===0?p.cantidadAlternativa??p.cantidad:p.cantidad);i++)sleep(g);
   if(p.tipo==='visitar')for(const r of p.regiones)if(!g.estado.astra.visitas.includes(r))g.estado.astra.visitas.push(r);
   if(p.tipo==='sangre')perfil={v:1,noche:{metas:['puerta_'+p.sector+':fin']},cifras:{prisioneros:p.cantidad??0}};
   if(p.condicion==='equipo')give(g,{...g.estado.inventario,pan:3,herramienta_pico:1,herramienta_espada:1});
   if(p.condicion==='nave'){at(g,'granja');give(g,{...g.estado.inventario,nave_exploradora:1});let colocado=false;for(let z=0;z<14&&!colocado;z++)for(let x=-8;x<8&&!colocado;x++)colocado=g.actuar({tipo:'produccion',accion:{tipo:'colocar_estructura',articulo:'nave_exploradora',zona:'granja',x,z},xJugador:x,zJugador:z}).ok;assert.ok(colocado,'Huella legal para nave');}
   at(g,p.region);ha(g,{tipo:'comprobar',id:q.id},pos);
  }
  assert.equal(M.validarEstado(g.estado),null,q.id+'.'+p.id+' guardable');
 }
 listen(g);const old=JSON.stringify(g.estado.inventario);ha(g,{tipo:'terminar',id:q.id,opcion},A.puntoArchivo(q.region));const lineas=listen(g);assert.equal(JSON.stringify(g.estado.inventario),old);assert.equal(lineas.some(l=>l.startsWith(q.id+'.rama'+(opcion===0?2:1)+'.')),false);
 assert.equal(M.validarEstado(g.estado),null,q.id+' cierre válido');assert.ok(game().cargarJSON(g.exportar(true)).ok,q.id+' recarga');
}
test('V5 aditivo conserva granja, animales y expedientes; los archivos anteriores no acreditan la campaña',()=>{const g=game(),s=structuredClone(g.estado);delete s.historia;assert.ok(g.cargarJSON(JSON.stringify(s)).ok);for(const k of ['animales','inventario','astra','jornada'])assert.deepEqual(g.estado[k],s[k]);g.estado.astra.expedientes.P01={dia:0,estadisticas:{},paso:A.CAMPANA_ASTRA.find(q=>q.id==='P01').pasos.length,decision:0,cerrado:true};assert.equal(H.historiaDisponible(g.estado,'F01'),false);});
test('Un bloque corrupto no borra la partida y no fabrica checkpoints',()=>{const g=game();for(const edit of [s=>s.historia=null,s=>s.historia.reto={mision:'P01'},s=>s.historia.completadas.P01={dia:0,opcion:0,recibos:[]},s=>s.historia.sellos=['F07']]){const bad=structuredClone(g.estado);edit(bad);const before=g.exportar(true);assert.equal(g.cargarJSON(JSON.stringify(bad)).ok,false);assert.equal(g.exportar(true),before);}});
test('La campaña tiene 36 contratos, 110 objetivos y puestos alcanzables en los planos de Claude',()=>{assert.equal(H.MISIONES_HISTORIA.length,36);assert.equal(H.MISIONES_HISTORIA.reduce((n,q)=>n+q.pasos.length,0),110);for(const q of H.MISIONES_HISTORIA)for(const p of q.pasos)if(p.punto&&p.region!=='pueblo_sol'){assert.ok(Array.from({length:25},(_,i)=>({x:p.punto.x+i%5-2,z:p.punto.z+Math.floor(i/5)-2})).some(pos=>A.libreRegionAstra(p.region,pos.x,pos.z)),p.id);}});
test('No basta una estadística: el cultivo requiere sembrar, regar y cosechar el mismo surco después de aceptar',()=>{const g=game();at(g,'pueblo_sol');ha(g,{tipo:'aceptar',id:'P01'});listen(g);for(let i=0;i<2;i++)ha(g,{tipo:'observar',id:'P01',indice:i},A.puntoArchivo('pueblo_sol'));at(g,'granja');g.estado.estadisticas.cosechar=999;fail(g,{tipo:'comprobar',id:'P01'});grow(g);ha(g,{tipo:'comprobar',id:'P01'});assert.equal(g.estado.historia.activas.P01.paso,2);});
test('Circuitos conservan reserva, aíslan el núcleo y se guardan sin gastar al reintentar',()=>{const g=game();const p=H.MISIONES_HISTORIA.find(q=>q.id==='F02').pasos[1],r=R.crearReto('F02',p);assert.equal(R.circuitoCorrecto(r),false);r.giros=[1,1,2,0,0,0,0,0,0];assert.equal(R.circuitoCorrecto(r),true);r.giros[2]=1;assert.equal(R.circuitoCorrecto(r),false);});
test('36 misiones se cierran por acciones sin asignar completadas; negativa de Ofelia, comisión de Íñigo y voces de una sola rama',()=>{const g=game();while(Object.keys(g.estado.historia.completadas).length<36){const q=H.MISIONES_HISTORIA.find(q=>!g.estado.historia.completadas[q.id]&&H.historiaDisponible(g.estado,q.id));assert.ok(q,'Dependencias sin bloqueo');finish(g,q);}assert.deepEqual(g.estado.historia.sellos,['F07','F08','F09','F10']);assert.equal(g.estado.historia.activas.P24,undefined);});
console.log(JSON.stringify({suite:'historia-principal',checks,misiones:36,objetivos:110,alcance:'Contrato completo con acciones; ubicaciones, inventario, visitas y prueba de Sangre preparados. No certifica economía ni campaña humana ordinaria.'}));
