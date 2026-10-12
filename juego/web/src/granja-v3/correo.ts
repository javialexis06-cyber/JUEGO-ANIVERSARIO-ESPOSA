import type { EstadoGranja, Resultado } from './estado';
import { cambiarCantidad, resumirCasillas, type Pila } from './inventario';
import { fechaValle } from './jornada';
import { cercaBuzon } from './buzon';
import { actuarEncargo } from './encargos';
import { CARTAS_CORRESPONDENCIA, PROYECTOS_CORRESPONDENCIA, proyectoPorCarta } from './correspondencia-datos';
export { posicionBuzon, cercaBuzon } from './buzon';
export interface CartaDef {soloGuia?:boolean;id:string;remitente:string;titulo:string;texto:string;diaMin:number;actividad?:string;encargo?:string;estacion?:'verano'|'otono'|'invierno';monedas:number;objetos:readonly Pila[];proyecto?:string;eleccion?:number;momento?:'confirmacion'|'cierre'}
export const CARTAS:readonly CartaDef[]=[
 {id:'bienvenida',remitente:'Casa de los Oficios',titulo:'Una nueva página',texto:'Bienvenidos al valle. Al dormir guardarás la jornada y avanzarás las estaciones. En el pueblo encontrarás herramientas, vecinos y encargos. Este buzón acompaña a tu cabaña cuando la reorganices.',diaMin:0,monedas:0,objetos:[]},
 // La trae la guía del inicio apenas se trabaja el primer surco (guia.ts), no la noche
 {id:'carta_campana',remitente:'Santa de Aura',titulo:'Un surco que no despierta',texto:'Querida familia de la granja: en el Pueblo del Sol hay un surco que no quiere despertar, aunque la tierra de al lado da fruto. La mercader y la botánica están preocupadas, y yo también. Vengan al pueblo por el camino de tierra; los postes guía los traen hasta la plaza. Conozcan a los vecinos, sus tiendas, el Gremio de Aventureros y el Museo del Valle. Cuando estén listos, acepten en su Diario la historia «La semilla que no despierta». Que el fuego de Aura los acompañe.',diaMin:0,soloGuia:true,monedas:0,objetos:[{articulo:'semilla_zanahoria',cantidad:4}]},
 {id:'primera_manana',remitente:'La cuidadora',titulo:'Para tu primera mañana',texto:'Una reserva de heno ayuda a empezar el día. Alimenta a tus animales y acompáñalos con cariño. Las crías crecen cuando avanzas las jornadas al dormir.',diaMin:1,monedas:0,objetos:[{articulo:'heno',cantidad:3}]},
 {id:'primeras_semillas',remitente:'La mercader',titulo:'Una cosecha que cuidar',texto:'Ya recogiste tu primera cosecha. Mira la temporada y los días que necesita cada semilla antes de volver a plantar. Un cultivo maduro puede conservarse como decoración.',diaMin:1,actividad:'cosechar',monedas:25,objetos:[]},
 {id:'herramientas',remitente:'El herrero',titulo:'Un oficio con práctica',texto:'Despejar recursos te dará materiales para reparar la granja. Lleva tus minerales a la forja cuando quieras mejorar una herramienta; prepara otra actividad mientras está en el taller.',diaMin:2,actividad:'limpiar',monedas:0,objetos:[{articulo:'carbon',cantidad:2}]},
 {id:'primer_pez',remitente:'La pescadora',titulo:'Noticias de la orilla',texto:'Tu primera captura abre un mundo de aguas y estaciones. La hora, el tiempo y el cebo cambian lo que puedes encontrar. Guarda una comida para tus próximas salidas.',diaMin:1,actividad:'pescar',monedas:0,objetos:[{articulo:'pan',cantidad:1}]},
 {id:'corral_cuidado',remitente:'La veterinaria',titulo:'Alimento y compañía',texto:'La rutina de tu corral empieza a tomar forma. El cariño y el alimento ayudan a mantener la salud; consulta los cuidados cuando regreses. La edad de los animales solo avanza al dormir.',diaMin:1,actividad:'consentir',monedas:0,objetos:[{articulo:'heno',cantidad:2}]},
 {id:'taller_agradecido',remitente:'La carpintera',titulo:'Gracias por el taller',texto:'Tus materiales dejaron el taller listo. Acércate cuando quieras encargar una obra. Una cuadrilla trabaja por orden y avanza al dormir; conserva espacio para el acceso de la construcción.',diaMin:1,encargo:'pedido_roble',monedas:0,objetos:[{articulo:'madera',cantidad:5}]},
 {id:'un_recuerdo',remitente:'El archivero',titulo:'Un momento compartido',texto:'Los recuerdos que compartimos también forman parte de la vida del pueblo. Puedes consultar tus encuentros en la conversación con cada habitante y continuar conociendo sus gustos.',diaMin:1,actividad:'escenas_sociales',monedas:0,objetos:[]},
 {id:'primera_obra',remitente:'La carpintera',titulo:'Un nuevo rincón',texto:'La primera obra terminada ya forma parte de tu granja. Puedes reorganizarla después de completar los trabajos. Sus instalaciones y habitantes mantienen su identidad al moverla.',diaMin:1,actividad:'obras_terminadas',monedas:20,objetos:[]},
 {id:'envio_cobrado',remitente:'El almacén del pueblo',titulo:'Tu primera venta nocturna',texto:'Los productos de la caja se pagan al dormir. Puedes retirar una entrega antes de cerrar la jornada. Las siguientes ventas aparecerán en el resumen de la noche.',diaMin:1,actividad:'ingresos_envio',monedas:0,objetos:[]},
 {id:'verano',remitente:'El agricultor',titulo:'Llega el verano',texto:'Empieza una temporada nueva. Revisa el calendario y las semillas de verano antes de sembrar. Los frutales adultos y el invernadero tienen reglas propias.',diaMin:28,estacion:'verano',monedas:0,objetos:[]},
 {id:'otono',remitente:'La botánica',titulo:'Los colores del otoño',texto:'La cosecha y el jardín cambian con la estación. Deja espacio para los caminos, cuida tus plantones y guarda productos para las recetas del valle.',diaMin:56,estacion:'otono',monedas:0,objetos:[]},
 {id:'invierno',remitente:'La posadera',titulo:'Un invierno para preparar',texto:'El invierno invita a preparar la próxima primavera. Revisa tus reservas, visita a los vecinos y reúne materiales. Los días de la estación se conservan cuando cierras el juego.',diaMin:84,estacion:'invierno',monedas:0,objetos:[]},
];
export interface CartaRecibida {id:string;recibidaDia:number;leidaDia:number|null;reclamadaDia:number|null}
export interface DecisionCorreo {proyectoId:string;eleccion:number;elegidaDia:number;completadaDia:number|null}
export interface EstadoCorreo {version:2;cartas:CartaRecibida[];decisiones:DecisionCorreo[]}
export type AccionCorreo={tipo:'leer'|'reclamar'|'retomar';id:string}|{tipo:'elegir';id:string;eleccion:number};
export const crearCorreo=():EstadoCorreo=>({version:2,cartas:[{id:'bienvenida',recibidaDia:0,leidaDia:null,reclamadaDia:null}],decisiones:[]});
export const cartaDef=(id:string)=>CARTAS.find(c=>c.id===id)??CARTAS_CORRESPONDENCIA.find(c=>c.id===id);
export function entregarCorreo(s:EstadoGranja){for(const c of [...CARTAS,...CARTAS_CORRESPONDENCIA]){
 const dia=s.jornada.diasCompletados;if((c as CartaDef).soloGuia||s.correo.cartas.some(r=>r.id===c.id)||dia<c.diaMin||c.actividad&&!(s.estadisticas[c.actividad]>0)||c.encargo&&!s.encargos.registros.some(r=>r.id===c.encargo&&r.fase==='completado')||c.estacion&&fechaValle(dia).estacion!==c.estacion)continue;
 if(c.proyecto){const d=s.correo.decisiones.find(d=>d.proyectoId===c.proyecto&&d.eleccion===c.eleccion);if(!d||dia<=d.elegidaDia||c.momento==='cierre'&&(d.completadaDia===null||dia<=d.completadaDia||!s.correo.cartas.some(r=>r.id===PROYECTOS_CORRESPONDENCIA.find(p=>p.id===c.proyecto)!.ramas[d.eleccion].confirmacion.id)))continue;}
 s.correo.cartas.push({id:c.id,recibidaDia:dia,leidaDia:null,reclamadaDia:null});
}}
export function actuarCorreo(s:EstadoGranja,a:AccionCorreo,x:number,z:number):Resultado{
 const c=cartaDef(a.id),r=s.correo.cartas.find(r=>r.id===a.id),mal=(mensaje:string)=>({ok:false,mensaje});if(!c||!r||!cercaBuzon(s,x,z))return mal('Acércate al buzón para consultar esta carta.');
 if(a.tipo==='leer'){if(r.leidaDia===null){r.leidaDia=s.jornada.diasCompletados;s.estadisticas.cartas_leidas=(s.estadisticas.cartas_leidas??0)+1;}return {ok:true,mensaje:'Carta abierta.'};}
 if(a.tipo==='elegir'||a.tipo==='retomar'){
  const p=proyectoPorCarta(c.id);if(!p||r.leidaDia===null)return mal('Lee la propuesta antes de elegir o retomar su proyecto.');
  let d=s.correo.decisiones.find(d=>d.proyectoId===p.id);
  if(a.tipo==='elegir'){
   if(d||!Number.isInteger(a.eleccion)||!p.ramas[a.eleccion])return mal('Elige una rama válida. Una decisión guardada no puede cambiarse.');
   d={proyectoId:p.id,eleccion:a.eleccion,elegidaDia:s.jornada.diasCompletados,completadaDia:null};s.correo.decisiones.push(d);
  }else{
   if(!d||d.completadaDia!==null)return mal('Solo puedes retomar tu rama cancelada o vencida.');
   const encargoId=p.ramas[d.eleccion].encargo.id,registro=s.encargos.registros.find(r=>r.id===encargoId);
   if(!registro||!['cancelado','vencido'].includes(registro.fase))return mal('Solo puedes retomar tu rama cancelada o vencida.');
   if(registro.fase==='vencido'){const devolucion=actuarEncargo(s,{tipo:'cancelar',id:registro.id},x,z);if(!devolucion.ok)return devolucion;}
  }
  if(!d)return mal('Elige una rama antes de retomar su proyecto.');
  const resultado=actuarEncargo(s,{tipo:'aceptar',id:p.ramas[d.eleccion].encargo.id},x,z);
  return resultado.ok?{ok:true,mensaje:`${a.tipo==='elegir'?'Rama elegida':'Proyecto retomado'}: ${p.ramas[d.eleccion].nombre}. Consulta sus etapas en el diario.`}:resultado;
 }
 if(a.tipo!=='reclamar'||r.leidaDia===null||r.reclamadaDia!==null||!c.monedas&&!c.objetos.length)return mal('Lee primero la carta y recoge su adjunto una sola vez.');
 if(s.monedas+c.monedas>1e9)return mal('No cabe el adjunto en tu saldo.');let mochila=s.casillasInventario;for(const p of c.objetos){const copia=cambiarCantidad(mochila,p.articulo,p.cantidad,p.calidad);if(!copia)return mal('Libera espacio para recoger todos los adjuntos. La carta conserva su contenido.');mochila=copia;}
 s.casillasInventario=mochila;s.inventario=resumirCasillas(mochila);s.monedas+=c.monedas;r.reclamadaDia=s.jornada.diasCompletados;s.estadisticas.adjuntos_correo=(s.estadisticas.adjuntos_correo??0)+1;return {ok:true,mensaje:'Adjunto recogido y guardado.'};
}
function cartasValidas(v:EstadoCorreo,dia:number,anterior=false){if(!v||!Number.isInteger(dia)||dia<0||dia>1e6||!Array.isArray(v.cartas)||v.cartas.length>CARTAS.length+(anterior?0:CARTAS_CORRESPONDENCIA.length))return false;const ids=new Set<string>();for(const r of v.cartas){const c=anterior?CARTAS.find(c=>c.id===r?.id):cartaDef(r?.id);if(!c||ids.has(r.id)||!Number.isInteger(r.recibidaDia)||r.recibidaDia<c.diaMin||r.recibidaDia>dia||r.leidaDia!==null&&(!Number.isInteger(r.leidaDia)||r.leidaDia<r.recibidaDia||r.leidaDia>dia)||r.reclamadaDia!==null&&(!Number.isInteger(r.reclamadaDia)||r.leidaDia===null||r.reclamadaDia<r.leidaDia||r.reclamadaDia>dia||!c.monedas&&!c.objetos.length))return false;ids.add(r.id);}return ids.has('bienvenida');}
/** La subversión anterior conserva fechas y adjuntos exactamente; un formato corrupto se rechaza. */
export function migrarCorreo(v:unknown,dia:number):unknown {const s=v as EstadoCorreo;if(s&&(s as {version:number}).version===1&&(s as EstadoCorreo).decisiones===undefined&&cartasValidas(s,dia,true))return {version:2,cartas:s.cartas,decisiones:[]};return v;}
export function correoValido(v:EstadoCorreo,dia:number){
 if(!v||v.version!==2||!cartasValidas(v,dia)||!Array.isArray(v.decisiones)||v.decisiones.length>PROYECTOS_CORRESPONDENCIA.length)return false;
 const ids=new Set<string>();for(const d of v.decisiones){const p=PROYECTOS_CORRESPONDENCIA.find(p=>p.id===d?.proyectoId),r=p&&v.cartas.find(r=>r.id===p.carta.id);if(!p||ids.has(d.proyectoId)||!Number.isInteger(d.eleccion)||!p.ramas[d.eleccion]||!r||r.leidaDia===null||!Number.isInteger(d.elegidaDia)||d.elegidaDia<r.leidaDia||d.elegidaDia>dia||d.completadaDia!==null&&(!Number.isInteger(d.completadaDia)||d.completadaDia<d.elegidaDia||d.completadaDia>dia))return false;ids.add(d.proyectoId);}
 for(const r of v.cartas){const c=cartaDef(r.id)!;if(!c.proyecto)continue;const d=v.decisiones.find(d=>d.proyectoId===c.proyecto&&d.eleccion===c.eleccion);if(!d||r.recibidaDia<=d.elegidaDia)return false;if(c.momento==='cierre'){const confirmacion=v.cartas.find(r=>r.id===PROYECTOS_CORRESPONDENCIA.find(p=>p.id===c.proyecto)!.ramas[d.eleccion].confirmacion.id);if(d.completadaDia===null||r.recibidaDia<=d.completadaDia||!confirmacion||confirmacion.recibidaDia>r.recibidaDia)return false;}}
 return true;
}
/** Contrato cruzado: ni un encargo huérfano ni una receta de la otra rama pueden entrar en el guardado. */
export function correspondenciaValida(s:EstadoGranja){
 for(const p of PROYECTOS_CORRESPONDENCIA){const d=s.correo.decisiones.find(d=>d.proyectoId===p.id);if(s.correo.cartas.some(r=>r.id===p.carta.id)&&!(s.estadisticas?.[p.carta.actividad!]>0))return false;
  for(let i=0;i<p.ramas.length;i++){const rama=p.ramas[i],r=s.encargos.registros.find(r=>r.id===rama.encargo.id),elegida=d?.eleccion===i,terminada=elegida&&d.completadaDia!==null;
   if(s.desbloqueos.includes(rama.receta.requisito!)!==terminada||r&&!elegida||elegida&&(!r||r.aceptadoDia<d.elegidaDia))return false;
   if(elegida&&r&&(r.fase==='completado')!==terminada)return false;
   if(terminada&&r&&(d.completadaDia!<r.aceptadoDia||d.completadaDia!>=r.venceDia))return false;
  }
 }
 return true;
}
