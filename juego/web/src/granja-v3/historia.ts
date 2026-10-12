import type {Accion,EstadoGranja,Resultado} from './estado';
import type {AccionHistoria,EstadoHistoria,ProgresoHistoria,PasoHistoria} from './historia-tipos';
import {MISIONES_HISTORIA} from './historia-datos';
import {crearReto,circuitoCorrecto,moverLaberinto} from './historia-retos';
import {regionActual,posicionNpcAstra,npcAstra,regionAstra} from './astra';
import {puedeConversar} from './aldeanos';
import {PECES,CULTIVOS} from './catalogo';
import {obtenerObjeto} from './objetos';
import {instanciaAventura} from './aventura';
import {fenotipo} from './genetica';
import {estadoAnimal} from './cuidados';
export {MISIONES_HISTORIA};
export const misionHistoria=(id:string)=>MISIONES_HISTORIA.find(q=>q.id===id);
export const crearHistoria=():EstadoHistoria=>({version:1,activas:{},completadas:{},reto:null,cartas:[],sellos:[],consecuencias:{},premios:[],pistas:{},notas:{}});
export function historiaDisponible(s:EstadoGranja,id:string){const q=misionHistoria(id);return !!q&&q.requiere.every(r=>s.historia?.completadas[r])&&(!q.personal||s.astra?.conocidos.includes(q.personal)&&s.astra.lecturas.includes('VID_'+q.personal+'_1'))&&(!q.pistas||(s.historia?.pistas[q.id]?.length??0)>=2);}
export function migrarHistoria(h:EstadoHistoria|undefined){if(h?.version===1){if(h.pistas===undefined)h.pistas={};if(h.notas===undefined)h.notas={};for(const a of Object.values(h.activas??{}))if(a&&typeof a==='object'&&!Array.isArray(a)&&a.cuidadosDias===undefined)a.cuidadosDias={};}}
const bien=(mensaje:string):Resultado=>({ok:true,mensaje}),mal=(mensaje:string):Resultado=>({ok:false,mensaje});
const cerca=(x:number,z:number,p:{x:number;z:number})=>Math.hypot(x-p.x,z-p.z)<=3;
const enPuesto=(s:EstadoGranja,p:PasoHistoria,x:number,z:number)=>regionActual(s)===p.region&&!s.interior&&!s.servicio&&!s.astra?.interior&&(!p.punto||cerca(x,z,p.punto));
export function registrarProduccionHistoria(s:EstadoGranja,producidos:Record<string,number>){for(const [id,a]of Object.entries(s.historia?.activas??{})){const q=misionHistoria(id)!;for(const [item,n]of Object.entries(producidos))if(q.pasos.some(p=>p.registro==='fabricar_'+item)){const key='fabricar_'+item;a.estadisticas[key]=(a.estadisticas[key]??0)+n;}}}
function avanzar(s:EstadoGranja,id:string){const a=s.historia!.activas[id],q=misionHistoria(id)!;if(!a.recibos.includes(q.pasos[a.paso].id))a.recibos.push(q.pasos[a.paso].id);a.paso++;a.inicioPaso=s.jornada.diasCompletados;s.historia!.reto=null;if(a.paso===q.pasos.length)s.astra!.escena={id:'H:'+id+'#giro',linea:0};}
function completarReto(s:EstadoGranja){const id=s.historia!.reto!.mision;avanzar(s,id);return bien('Prueba confirmada; la pieza y las reservas conservan su recibo.');}
export const ordenHistoria=(p:PasoHistoria,a:ProgresoHistoria)=>a.plan===0&&p.ordenAlternativo?p.ordenAlternativo:p.orden;
export function registrarBajasHistoria(s:EstadoGranja,destino:string,ids:string[]){for(const p of Object.values(s.historia?.activas??{}))if(ids.length){const key='combate:'+destino;p.estadisticas[key]=(p.estadisticas[key]??0)+ids.length;}}
export function escenaHistoria(s:EstadoGranja,id:string,parte:string){s.astra!.escena={id:'H:'+id+'#'+parte,linea:0};}

/** Las pruebas agrícolas conservan la asociación siembra-riego-cosecha; una estadística suelta no la sustituye. */
export function registrarHistoria(s:EstadoGranja,a:Accion,antes:EstadoGranja){
 const h=s.historia;if(!h)return;
 for(const [id,p]of Object.entries(h.activas)){
  const q=misionHistoria(id);if(!q)continue;
  const contexto=antes.interior??'campo',parcelas=antes.invernaderos.find(i=>i.edificioId===antes.interior)?.parcelas??antes.parcelas;
  const admite=(id:string)=>q.pasos.some(p=>p.tipo==='cultivar'&&(p.especiesPermitidas?p.especiesPermitidas.includes(id):CULTIVOS.some(c=>c.id===id&&!c.region)));
  if(a.tipo==='plantar'&&antes.zona==='granja'&&!antes.astra?.actual&&admite(a.cultivo))p.cultivos[contexto+':'+a.x+','+a.z]={cultivo:a.cultivo,regado:false,cosechado:false,contexto};
  if(a.tipo==='regar'&&!antes.astra?.actual&&antes.zona==='granja')for(const key of Object.keys(p.cultivos)){
   const recibo=p.cultivos[key];if((recibo.contexto??'campo')!==contexto)continue;const [x,z]=key.split(':').pop()!.split(',').map(Number),parcela=(s.invernaderos.find(i=>i.edificioId===s.interior)?.parcelas??s.parcelas).find(c=>c.x===x&&c.z===z);
   if(parcela?.campo?.riegoDia===s.jornada.diasCompletados&&parcela.cultivo===recibo.cultivo)recibo.regado=true;
  }
  if(a.tipo==='cosechar'&&antes.zona==='granja'&&!antes.astra?.actual){const key=contexto+':'+a.x+','+a.z,c=parcelas.find(c=>c.x===a.x&&c.z===a.z),r=p.cultivos[key]??p.cultivos[a.x+','+a.z];if(r&&r.regado&&(r.contexto??'campo')===contexto&&c?.cultivo===r.cultivo&&c.cuidado?.status==='maduro')r.cosechado=true;}
  for(const key of new Set(q.pasos.flatMap(p=>p.registro?[p.registro]:[]))){const delta=(s.estadisticas[key]??0)-(antes.estadisticas[key]??0);if(delta>0)p.estadisticas[key]=(p.estadisticas[key]??0)+delta;}
  if(a.tipo==='astra'&&a.accion.tipo==='recurso'){const key='recoleccion:'+a.accion.id;if(q.pasos.some(p=>p.registro===key))p.estadisticas[key]=(p.estadisticas[key]??0)+1;}
  if(a.tipo==='astra'&&a.accion.tipo==='observar'){const key='observacion:'+a.accion.id;if(q.pasos.some(p=>p.registro===key))p.estadisticas[key]=(p.estadisticas[key]??0)+1;}
  if(a.tipo==='pescar'&&q.pasos.some(p=>p.tipo==='devolver_pesca'))for(const pez of PECES){const delta=(s.estadisticas['pez_'+pez.id]??0)-(antes.estadisticas['pez_'+pez.id]??0);if(delta>0){const key='captura:'+pez.id;p.estadisticas[key]=(p.estadisticas[key]??0)+delta;}}
  if(a.tipo==='cuidar'&&['alimentar','acariciar','cepillar','musica','cuento'].includes(a.metodo)){
   const animal=s.animales.find(n=>n.id===a.animalId);if(animal&&!fenotipo(animal.especie,animal.genoma).fantasia){const key=animal.id+':'+(a.metodo==='alimentar'?'alimentar':'acompanar');if(!p.cuidados.includes(key))p.cuidados.push(key);p.cuidadosDias[key]=s.jornada.diasCompletados;}
  }
  if(a.tipo==='accion_aventura'&&a.objetivo==='monstruo'){
   const viejo=instanciaAventura(antes.aventura)?.monstruos.find(m=>m.id===a.id),nuevo=instanciaAventura(s.aventura)?.monstruos.find(m=>m.id===a.id);
   if(viejo?.vivo&&nuevo&&!nuevo.vivo){const key='combate:'+antes.aventura.destinoActual;p.estadisticas[key]=(p.estadisticas[key]??0)+1;}
  }
 }
 if(a.tipo==='dormir')for(const q of MISIONES_HISTORIA){const p=h.activas[q.id];if(p&&q.pasos.some(p=>p.tipo==='jornadas')&&s.jornada.diasCompletados>p.dia&&!h.cartas.includes(q.id))h.cartas.push(q.id);}
}

export function actuarHistoria(s:EstadoGranja,accion:AccionHistoria,x:number,z:number,ctx:{agregar:(id:string,n:number)=>void;noche:()=>unknown}):Resultado {
 const h=s.historia??(s.historia=crearHistoria());
 if(!Number.isFinite(x)||!Number.isFinite(z))return mal('Posición inválida.');
 if(s.astra?.escena)return mal('Escucha o deja la escena antes de continuar.');
 if(h.reto){
  const r=h.reto,q=misionHistoria(r.mision)!,p=q.pasos[h.activas[q.id].paso];
  if(accion.tipo==='dejar_reto'){h.reto=null;return bien('La instalación conserva sus materiales. Puedes reiniciar la prueba.');}
  if(accion.tipo==='reiniciar_reto'){h.reto=crearReto(q.id,p);return bien('Prueba reiniciada; no se descuentan materiales otra vez.');}
  if(r.tipo==='laberinto'){
   if(accion.tipo==='retirar_permiso'){if(p.mapa?.[r.z]?.[r.x]!=='R')return mal('Busca R para retirar autorización.');r.retiro=true;return bien('Autorización retirada. La salida queda bajo tu decisión.');}
   if(accion.tipo!=='mover')return mal('Usa los pasos del laberinto.');const resultado=moverLaberinto(r,p,accion.dx,accion.dz);return resultado.ok&&resultado.terminado?completarReto(s):resultado;
  }
  if(r.tipo==='circuito'){
   if(accion.tipo==='girar'){if(!Number.isInteger(accion.indice)||accion.indice<0||accion.indice>8||accion.indice===4)return mal('El núcleo no se modifica.');r.giros[accion.indice]=(r.giros[accion.indice]+1)%4;return bien('Unión girada.');}
   if(accion.tipo!=='probar_circuito')return mal('Gira las uniones y comprueba su conexión.');
   if(circuitoCorrecto(r))return completarReto(s);r.errores=Math.min(100,r.errores+1);return bien('Circuito incompleto o conexión al núcleo. La reserva sigue aislada; revisa los puertos.');
  }
  if(accion.tipo!=='responder')return mal('Elige una operación de la prueba.');
  if(r.tipo==='contraste'){
   const indice=Number(accion.opcion);if(!Number.isInteger(indice)||indice<0||indice>=(p.opciones?.length??0))return mal('Respuesta inválida.');
   if(indice===p.respuesta)return completarReto(s);r.errores=Math.min(100,r.errores+1);return bien('Esa conclusión no coincide con las fuentes. Puedes volver a compararlas.');
  }
  const orden=ordenHistoria(p,h.activas[q.id]);if(!orden?.includes(accion.opcion))return mal('Operación desconocida.');
  if(accion.opcion!==orden[r.progreso]){r.progreso=0;r.errores=Math.min(100,r.errores+1);return bien('La secuencia se detuvo en el puesto seguro. Reintenta conservando la reserva.');}
  if(++r.progreso===orden.length)return completarReto(s);return bien('Operación confirmada; continúa el procedimiento.');
 }
 if(!('id'in accion))return mal('No hay una prueba activa.');
 const q=misionHistoria(accion.id),a=q&&h.activas[q.id];if(!q)return mal('Misión desconocida.');
 if(accion.tipo==='descubrir'){const p=q.pistas?.[accion.indice];if(!p||!Number.isInteger(accion.indice)||!q.requiere.every(r=>h.completadas[r])||regionActual(s)!==p.region||s.interior||s.servicio||s.astra?.interior||!cerca(x,z,p))return mal('Examina el indicio desde su lugar público autorizado.');const lista=h.pistas[q.id]??(h.pistas[q.id]=[]);if(!lista.includes(accion.indice))lista.push(accion.indice);return bien(p.texto+(lista.length>=2?' · Ahora puedes consultar esta historia en Campaña.':''));}
 if(accion.tipo==='aceptar'){
  if(!historiaDisponible(s,q.id))return mal('Revisa las historias previas, escucha el primer recuerdo del participante y reúne las pistas públicas cuando corresponda.');
  if(a||h.completadas[q.id])return mal('La misión ya está registrada.');
  if(regionActual(s)!==q.region||s.interior||s.servicio||s.astra?.interior)return mal('Visita '+regionAstra(q.region)?.nombre+' para iniciar.');
  h.activas[q.id]={dia:s.jornada.diasCompletados,inicioPaso:s.jornada.diasCompletados,plan:null,paso:0,recibos:[],observados:[],permisos:{},cultivos:{},cuidados:[],cuidadosDias:{},entregas:{},estadisticas:{},enfoques:{}};escenaHistoria(s,q.id,'inicio');return bien('Misión iniciada: '+q.titulo+'.');
 }
 if(accion.tipo==='retomar'){
  if(!a&&!h.completadas[q.id])return mal('Inicia primero la misión.');
  escenaHistoria(s,q.id,h.completadas[q.id]?'cierre':a!.paso===q.pasos.length?'giro':'inicio');return bien('Guion retomado; los recibos y costos se conservan.');
 }
 if(!a)return mal('Inicia primero la misión.');
 if(!s.astra!.lecturas.includes('H:'+q.id+'#inicio'))return mal('Escucha primero el inicio de la historia.');
 if(accion.tipo==='terminar'){
  if(a.paso!==q.pasos.length||!s.astra!.lecturas.includes('H:'+q.id+'#giro'))return mal('Completa los objetivos y escucha el giro.');
  if(!Number.isInteger(accion.opcion)||accion.opcion<0||accion.opcion>(q.decision?1:0))return mal('Elección inválida.');
  if(q.pasos.some(p=>p.planes)&&a.plan!==accion.opcion)return mal('El cierre debe conservar la vía de estudio que elegiste y completaste.');
  h.completadas[q.id]={dia:s.jornada.diasCompletados,opcion:accion.opcion,recibos:[...a.recibos]};h.consecuencias[q.id]=accion.opcion;
  if(/^F(07|08|09|10)$/.test(q.id)&&!h.sellos.includes(q.id))h.sellos.push(q.id);
  if(q.id.startsWith('V_')&&!s.astra!.personales.includes(q.id))s.astra!.personales.push(q.id);
  delete h.activas[q.id];escenaHistoria(s,q.id,'cierre');return bien('Historia completada con acciones y decisión guardadas.');
 }
 const p=q.pasos[a.paso];if(!p)return mal('Ya puedes cerrar la historia.');
 if(accion.tipo==='solicitar'){
  const actor=p.participantes?.find(n=>n.id===accion.npc),n=actor&&npcAstra(actor.id),pos=n&&posicionNpcAstra(s,n.id);
  if(p.tipo!=='preguntar'||!actor||!n)return mal('Esta persona no participa en la consulta.');
  const accesible=n.region==='pueblo_sol'&&!actor.comision?puedeConversar(s,n.id,x,z):pos&&pos.interior===s.astra!.interior&&cerca(x,z,pos);
  if(!accesible)return mal('Busca a '+n.nombre+' en su turno o domicilio y acércate.');
  if(a.permisos[p.id+':'+actor.id])return mal('Su respuesta ya está registrada.');a.permisos[p.id+':'+actor.id]=actor.respuesta;if(!s.astra!.conocidos.includes(n.id))s.astra!.conocidos.push(n.id);
  if(p.participantes!.every(n=>a.permisos[p.id+':'+n.id]))avanzar(s,q.id);return bien(n.nombre+': '+actor.texto);
 }
 if(!enPuesto(s,p,x,z)&&!['visitar','sangre','cultivar','cuidar'].includes(p.tipo))return mal('Acércate al puesto de '+(regionAstra(p.region)?.nombre??p.region)+' en '+p.punto?.x+', '+p.punto?.z+'.');
 if(accion.tipo==='observar'){
  if(p.tipo!=='observar'||!Number.isInteger(accion.indice)||accion.indice<0||accion.indice>=(p.datos?.length??0))return mal('Observación desconocida.');
  const id=p.id+':'+accion.indice;if(!a.observados.includes(id))a.observados.push(id);
  const dato=p.datos![accion.indice];if(p.datos!.every((_,i)=>a.observados.includes(p.id+':'+i)))avanzar(s,q.id);return bien(dato);
 }
 if(accion.tipo==='devolver_pez'){const key='captura:'+accion.pez;if(p.tipo!=='devolver_pesca'||!PECES.some(p=>p.id===accion.pez)||(a.estadisticas[key]??0)<1||(s.inventario[accion.pez]??0)<1)return mal('Devuelve un ejemplar realmente capturado después de aceptar y que aún conservas.');ctx.agregar(accion.pez,-1);a.estadisticas[key]--;avanzar(s,q.id);return bien('Ejemplar devuelto al tramo autorizado; no se vende ni vuelve a la mochila al reintentar.');}
 if(accion.tipo==='guardar_nota'){if(p.tipo!=='nota'||typeof accion.texto!=='string'||accion.texto.length>500||!accion.texto.trim())return mal('Escribe hasta 500 caracteres o escoge una frase del cuaderno.');h.notas[q.id]=accion.texto.trim();avanzar(s,q.id);return bien('Nota guardada solo en tu partida. No se envía ni se incorpora a voces.');}
 if(accion.tipo==='preparar'){
  if(p.tipo!=='entregar'||!p.materiales)return mal('Este paso no fabrica ni reserva materiales.');
  if(!Object.entries(p.materiales).every(([id,n])=>(s.inventario[id]??0)>=n))return mal('Necesitas '+Object.entries(p.materiales).map(([id,n])=>n+' '+(obtenerObjeto(id)?.nombre??id)).join(', ')+'.');
  for(const [id,n]of Object.entries(p.materiales))ctx.agregar(id,-n);a.entregas[p.id]={...p.materiales};avanzar(s,q.id);return bien('Materiales reales preparados en la instalación; entrega confirmada una vez.');
 }
 if(accion.tipo==='elegir_plan'){if(!p.planes||a.plan!==null||!Number.isInteger(accion.opcion)||accion.opcion<0||accion.opcion>=p.planes.length)return mal('Elige una vía disponible antes de comenzar.');a.plan=accion.opcion;return bien('Vía elegida: '+p.planes[accion.opcion]+'.');}
 if(accion.tipo==='enfoque'){
  if(!p.alternativa||!['tecnica','combate'].includes(accion.modo))return mal('Esta prueba no cambia de enfoque.');a.enfoques[p.id]=accion.modo;return bien('Ruta '+accion.modo+' elegida. Conserva el mismo componente.');
 }
 if(accion.tipo==='iniciar_reto'){
  if(!['secuencia','contraste','laberinto','circuito'].includes(p.tipo)||a.enfoques[p.id]==='combate')return mal('Este paso requiere su acción propia.');if(p.planes&&a.plan===null)return mal('Elige primero préstamo o copia in situ.');h.reto=crearReto(q.id,p);return bien('Prueba iniciada. Puedes dejarla y reiniciar sin repetir costos.');
 }
 if(accion.tipo!=='comprobar')return mal('Acción desconocida para este objetivo.');
 if(a.enfoques[p.id]==='combate'){
  if((a.estadisticas['combate:'+p.destino!]??0)<2)return mal('Desactiva dos constructos de este territorio con tus armas.');
 }else if(p.tipo==='oficio'){if((a.estadisticas[p.registro!]??0)<(p.cantidad??1))return mal('Realiza la actividad del oficio después de aceptar: '+p.texto);
 }else if(p.tipo==='cultivar'){
  if(regionActual(s)!=='granja'||new Set(Object.values(a.cultivos).filter(r=>r.regado&&r.cosechado&&(!p.especiesPermitidas||p.especiesPermitidas.includes(r.cultivo))).map(p=>p.cultivo)).size<(p.cantidad??1))return mal('Faltan recibos de cultivos ordinarios propios sembrados, regados y cosechados después de aceptar.');
 }else if(p.tipo==='cuidar'){
  const ids=a.cuidados.filter(k=>k.endsWith(':alimentar')).map(k=>k.slice(0,-10));if(regionActual(s)!=='granja'||ids.filter(id=>a.cuidados.includes(id+':acompanar')&&(!p.posterior||(a.cuidadosDias[id+':alimentar']??-1)>=a.inicioPaso&&(a.cuidadosDias[id+':acompanar']??-1)>=a.inicioPaso)).length<(p.cantidad??1))return mal('Alimenta y acompaña a '+p.cantidad+' animales ordinarios distintos.');
 }else if(p.tipo==='visitar'){
  if(!p.regiones?.every(r=>s.astra!.visitas.includes(r)))return mal('Visita '+p.regiones?.filter(r=>!s.astra!.visitas.includes(r)).join(', ')+'.');
 }else if(p.tipo==='jornadas'){
  if(s.jornada.diasCompletados-a.inicioPaso<(a.plan===0?(p.cantidadAlternativa??p.cantidad??1):(p.cantidad??1))||!h.cartas.includes(q.id))return mal('La carta y sus lecturas llegan al dormir jornadas agrícolas.');
 }else if(p.tipo==='sangre'){
  const n=ctx.noche() as {v?:number;noche?:{metas?:unknown};cifras?:{prisioneros?:number}}|null;
  if(n?.v!==1||!Array.isArray(n.noche?.metas)||!n.noche.metas.includes('puerta_'+p.sector+':fin')||(p.cantidad??0)>0&&(n.cifras?.prisioneros??0)<p.cantidad!)return mal('Completa la puerta y los rescates reales en Sangre y Ceniza con este personaje.');
 }else if(p.tipo==='inspeccionar'){
  if(p.condicion==='equipo'&&(!s.inventario.pan||!s.inventario.herramienta_pico||!s.inventario.herramienta_espada&&!s.equipo.arma))return mal('Necesitas ración, pico y un arma del catálogo.');
  if(p.condicion==='nave'&&!s.produccion.estructuras.some(n=>n.articulo==='nave_exploradora'))return mal('Fabrica y coloca tu nave; la escena no la construye.');
  if(p.condicion==='refugio'&&((s.inventario.heno??0)<2||s.animales.filter(n=>a.cuidados.includes(n.id+':alimentar')&&a.cuidados.includes(n.id+':acompanar')&&s.edificios.some(b=>b.id===n.edificioId)&&!estadoAnimal(n.cuidado,s.ultimoTiempo).enfermo).length<2))return mal('Revisa el hogar y el alimento de los animales cuidados.');
  if(p.condicion==='matriz'&&!['F07','F08','F09','F10'].every(id=>h.completadas[id]&&h.sellos.includes(id)))return mal('Se requieren los cuatro sellos confirmados, uno por territorio.');
 }else return mal('Este objetivo se completa mediante su prueba, observación o consulta.');
 avanzar(s,q.id);return bien('Objetivo confirmado con su recibo.');
}

/** Validación de recibos y checkpoints: un bloque presente dañado nunca se sustituye por uno vacío. */
export function historiaValida(v:unknown,dia:number):v is EstadoHistoria {
 const h=v as EstadoHistoria,registro=(v:unknown)=>!!v&&typeof v==='object'&&!Array.isArray(v),entero=(n:unknown,min=0,max=1e9)=>Number.isSafeInteger(n)&&Number(n)>=min&&Number(n)<=max;
 const lista=(v:unknown,permitidos:string[])=>Array.isArray(v)&&new Set(v).size===v.length&&v.every(i=>typeof i==='string'&&permitidos.includes(i));
 if(!registro(h)||h.version!==1||!registro(h.activas)||!registro(h.completadas)||!registro(h.consecuencias)||!registro(h.pistas)||!registro(h.notas)||Object.entries(h.pistas).some(([id,x])=>{const q=misionHistoria(id);return !q?.pistas||!Array.isArray(x)||new Set(x).size!==x.length||x.some(i=>!entero(i,0,q.pistas!.length-1));})||Object.entries(h.notas).some(([id,x])=>!misionHistoria(id)?.pasos.some(p=>p.tipo==='nota')||typeof x!=='string'||!x.trim()||x.length>500)||!lista(h.cartas,MISIONES_HISTORIA.map(q=>q.id))||!lista(h.sellos,['F07','F08','F09','F10'])||!Array.isArray(h.premios)||h.premios.length>217||new Set(h.premios).size!==h.premios.length)return false;
 if(Object.keys(h.activas).length+Object.keys(h.completadas).length>MISIONES_HISTORIA.length)return false;
 for(const [id,c]of Object.entries(h.completadas)){const q=misionHistoria(id);if(!q||!registro(c)||!entero(c.dia,0,dia)||!entero(c.opcion,0,q.decision?1:0)||!lista(c.recibos,q.pasos.map(p=>p.id))||c.recibos.length!==q.pasos.length||!q.requiere.every(r=>h.completadas[r])||h.activas[id])return false;}
 for(const [id,a]of Object.entries(h.activas)){
  const q=misionHistoria(id);if(!q||!registro(a)||!entero(a.dia,0,dia)||!entero(a.inicioPaso,a.dia,dia)||(a.plan!==null&&(!q.pasos.some(p=>p.planes)||!entero(a.plan,0,1)))||!entero(a.paso,0,q.pasos.length)||!lista(a.recibos,q.pasos.slice(0,a.paso).map(p=>p.id))||a.recibos.length!==a.paso||!q.requiere.every(r=>h.completadas[r])||!registro(a.cultivos)||!registro(a.entregas)||!registro(a.permisos)||!registro(a.enfoques)||!registro(a.estadisticas)||!registro(a.cuidadosDias)||!Array.isArray(a.cuidados)||a.cuidados.some(k=>typeof k!=='string'||!/^[A-Za-z0-9_-]{1,100}:(?:alimentar|acompanar)$/.test(k))||Object.entries(a.cuidadosDias).some(([id,d])=>!a.cuidados.includes(id)||!entero(d,a.dia,dia))||a.cuidados.length>600||new Set(a.cuidados).size!==a.cuidados.length)return false;
  if(!lista(a.observados,q.pasos.flatMap(p=>(p.datos??[]).map((_,i)=>p.id+':'+i))))return false;
  if(Object.entries(a.cultivos).some(([id,v])=>!/^(?:[a-zA-Z0-9_-]+:)?[-\d]+,[-\d]+$/.test(id)||!registro(v)||!CULTIVOS.some(c=>c.id===v.cultivo)||(v.contexto!==undefined&&(typeof v.contexto!=='string'||v.contexto.length>100))||typeof v.regado!=='boolean'||typeof v.cosechado!=='boolean'||v.cosechado&&!v.regado)||Object.keys(a.cultivos).length>512)return false;
  if(Object.entries(a.permisos).some(([id,v])=>!['acepta','aplaza','rechaza'].includes(v)||!q.pasos.some(p=>p.participantes?.some(n=>id===p.id+':'+n.id&&v===n.respuesta))))return false;
  if(Object.entries(a.entregas).some(([id,v])=>{const p=q.pasos.find(p=>p.id===id);return !p?.materiales||!registro(v)||JSON.stringify(Object.entries(v).sort())!==JSON.stringify(Object.entries(p.materiales).sort());}))return false;
  if(Object.entries(a.enfoques).some(([id,v])=>!['tecnica','combate'].includes(v)||!q.pasos.some(p=>p.id===id&&p.alternativa))||Object.entries(a.estadisticas).some(([id,v])=>!entero(v)||!id.startsWith('combate:')&&!q.pasos.some(p=>p.registro===id)&&!(q.pasos.some(p=>p.tipo==='devolver_pesca')&&PECES.some(p=>id==='captura:'+p.id))))return false;
 }
 if(Object.entries(h.consecuencias).some(([id,v])=>!h.completadas[id]||v!==h.completadas[id].opcion)||h.sellos.some(id=>!h.completadas[id]))return false;
 if(h.reto!==null){const r=h.reto,a=h.activas[r?.mision],p=misionHistoria(r?.mision)?.pasos[a?.paso];if(!registro(r)||!['secuencia','contraste','laberinto','circuito'].includes(r.tipo)||!a||!p||p.id!==r.paso||p.tipo!==r.tipo||!entero(r.progreso,0,p.orden?.length??0)||!entero(r.errores,0,100)||!entero(r.x,0,20)||!entero(r.z,0,20)||!lista(r.visitados,['A','B','R'])||typeof r.retiro!=='boolean'||r.retiro&&!r.visitados.includes('R')||!Array.isArray(r.giros)||r.giros.length!==9||r.giros.some(g=>!entero(g,0,3)))return false;if(r.tipo==='laberinto'&&(!p.mapa?.[r.z]?.[r.x]||p.mapa[r.z][r.x]==='#'))return false;}
 return true;
}
