import type { EstadoGranja, Resultado } from './estado';
import { NPCS_PUEBLO } from './pueblo-datos';
import { puedeConversar } from './aldeanos';
import { fechaValle } from './jornada';
import { lluviaRiega, tiempoDia } from './clima';

export interface EstadoVidaSocial {version:1;cumpleanos:Record<string,number>;escenas:{id:string;dia:number;eleccion:number}[];actual:{id:string;paso:number}|null}
export type AccionSocial={tipo:'iniciar';id:string}|{tipo:'avanzar';id:string;paso:number}|{tipo:'elegir';id:string;paso:number;eleccion:number}|{tipo:'cancelar';id:string};
export const crearVidaSocial=():EstadoVidaSocial=>({version:1,cumpleanos:{},escenas:[],actual:null});
const estaciones=['primavera','verano','otono','invierno'] as const;
export const CUMPLEANOS=NPCS_PUEBLO.map((n,i)=>({id:n.id,estacion:estaciones[Math.floor(i/6)],dia:4+(i%6)*4}));
export function cumpleHoy(id:string,dia:number){const f=fechaValle(dia),c=CUMPLEANOS.find(c=>c.id===id);return !!c&&c.estacion===f.estacion&&c.dia===f.dia;}
export function celebrarRegalo(s:EstadoGranja,id:string,r:Resultado){const c=r.conversacion,f=fechaValle(s.jornada.diasCompletados);if(!r.ok||!c||c.gusto==='desagrada'||!cumpleHoy(id,s.jornada.diasCompletados)||s.vidaSocial.cumpleanos[id]===f.ano)return;const relacion=s.pueblo.relaciones.find(n=>n.id===id)!;const bonus=Math.min(60,2500-relacion.amistad);relacion.amistad+=bonus;c.puntos+=bonus;c.texto+=' ¡Gracias por recordar mi cumpleaños!';s.vidaSocial.cumpleanos[id]=f.ano;}
export const ESCENAS=[
 {id:'memoria_valle',npc:'archivero',titulo:'La primera página',amistad:20,pedido:null,actividad:null,lineas:['Cada granja empieza con una página en blanco. Aquí conservamos los recuerdos de quienes cuidan el valle.','No hace falta escribir una hazaña. Una semilla, un animal o una tarde compartida también merecen recordarse.'],opciones:['Recordaré mi primera cosecha.','Recordaré a quienes me ayudaron.']},
 {id:'madera_hogar',npc:'carpintera',titulo:'Madera con historia',amistad:250,pedido:'pedido_roble',actividad:null,lineas:['Tu ayuda dejó el taller listo para seguir trabajando. Esta tabla tiene anillos de muchos inviernos.','Construir una casa también es decidir qué momentos quieres vivir dentro. ¿Qué pondrías junto a la ventana?'],opciones:['Una mesa para compartir.','Un rincón para crear.']},
 {id:'escuchar_animales',npc:'veterinaria',titulo:'Aprender a escuchar',amistad:250,pedido:'pedido_cuidado',actividad:null,lineas:['He visto el cuidado que das a tus animales. No todo se explica con una bolsa de alimento.','Las rutinas tranquilas les ayudan a sentirse seguros. ¿Qué momento reservarías para acompañarlos?'],opciones:['Una canción al caer la tarde.','Un cuento antes de descansar.']},
 {id:'cancion_valle',npc:'musica',titulo:'Una canción para el valle',amistad:500,pedido:null,actividad:null,lineas:['Estoy buscando un ritmo que se parezca a este lugar. El viento y tus pasos ya llevan el compás.','Puedo empezar por algo alegre o dejar espacio al silencio. ¿Qué sonido te gustaría guardar?'],opciones:['El agua junto al sendero.','Las hojas bajo la lluvia.']},
 {id:'orilla_paciente',npc:'pescadora',titulo:'La orilla paciente',amistad:250,pedido:'pedido_pesca',actividad:null,lineas:['Tus capturas muestran paciencia. A veces vengo a la orilla incluso sin caña.','El agua cambia con la estación; el mejor recuerdo no siempre es el pez más grande.'],opciones:['Observaré los cambios del lago.','Compartiré mis próximas capturas.']},
 {id:'semilla_recuerdo',npc:'botanica',titulo:'Una semilla y un recuerdo',amistad:250,pedido:null,actividad:'cosechar',lineas:['Ya conoces la alegría de recoger algo que plantaste. Cada semilla guarda una posibilidad.','Me gustaría que el jardín contara historias de quienes lo cuidan. ¿Por dónde empezarías?'],opciones:['Por flores para recibir visitas.','Por alimentos para compartir.']},
 {id:'reparar_valle',npc:'veterano',titulo:'Lo que vuelve a levantarse',amistad:250,pedido:null,actividad:'reparar',lineas:['Me contaron que has empezado a reparar la granja. Todavía recuerdo cuando esos caminos estaban llenos de gente.','No se reconstruye todo de una vez. Una reparación pequeña puede dar ánimo para la siguiente.'],opciones:['Conservaré sus viejos recuerdos.','Haré nuevos lugares de encuentro.']},
 {id:'cielo_compartido',npc:'astronoma',titulo:'El cielo compartido',amistad:250,pedido:'pedido_cuarzo',actividad:null,lineas:['El cuarzo que trajiste permitió reparar la lente. Hoy las lunas se ven más claras.','Aurelia, Nocturna y Esmeralda nos acompañan desde arriba. Todavía quedan muchas preguntas por explorar.'],opciones:['Dibujaré lo que podamos observar.','Volveré para seguir aprendiendo.']},
] as const;
export function disponibleEscena(s:EstadoGranja,id:string){const d=ESCENAS.find(d=>d.id===id),r=s.pueblo.relaciones.find(r=>r.id===d?.npc);return !!d&&!!r?.conocido&&r.amistad>=d.amistad&&!s.vidaSocial.escenas.some(e=>e.id===id)&&(!d.pedido||s.encargos.registros.some(e=>e.id===d.pedido&&e.fase==='completado'))&&(!d.actividad||(s.estadisticas[d.actividad]??0)>0);}
export function actuarSocial(s:EstadoGranja,a:AccionSocial,x:number,z:number):Resultado{
 const d=ESCENAS.find(d=>d.id===a.id),actual=s.vidaSocial.actual,mal=(mensaje:string)=>({ok:false,mensaje});if(!d)return mal('Encuentro desconocido.');
 if(a.tipo==='iniciar'){if(actual||!disponibleEscena(s,d.id)||!puedeConversar(s,d.npc,x,z,lluviaRiega(tiempoDia(s.tiempo,s.jornada.diasCompletados))))return mal('Acércate al habitante y cumple los requisitos del encuentro.');s.vidaSocial.actual={id:d.id,paso:0};return {ok:true,mensaje:'Comienza el encuentro.'};}
 if(!actual||actual.id!==d.id)return mal('Este encuentro no está abierto.');
 if(a.tipo==='cancelar'){s.vidaSocial.actual=null;return {ok:true,mensaje:'Puedes volver a iniciar el encuentro cuando quieras.'};}
 if(a.paso!==actual.paso)return mal('Esta respuesta ya no corresponde al diálogo.');
 if(a.tipo==='avanzar'&&actual.paso<d.lineas.length-1){actual.paso++;return {ok:true,mensaje:'Continúa el encuentro.'};}
 if(a.tipo!=='elegir'||actual.paso!==d.lineas.length-1||!Number.isInteger(a.eleccion)||a.eleccion<0||a.eleccion>=d.opciones.length)return mal('Elige una respuesta válida.');
 const r=s.pueblo.relaciones.find(r=>r.id===d.npc)!,ganancia=Math.min(40,2500-r.amistad);r.amistad+=ganancia;s.estadisticas['amistad_'+d.npc]=r.amistad;s.estadisticas.escenas_sociales=(s.estadisticas.escenas_sociales??0)+1;s.vidaSocial.escenas.push({id:d.id,dia:s.jornada.diasCompletados,eleccion:a.eleccion});s.vidaSocial.actual=null;return {ok:true,mensaje:'Recuerdo guardado · amistad +'+ganancia+'.'};
}
export function vidaSocialValida(v:EstadoVidaSocial,dia:number){
 if(!v||v.version!==1||!v.cumpleanos||typeof v.cumpleanos!=='object'||Array.isArray(v.cumpleanos)||!Array.isArray(v.escenas)||v.escenas.length>ESCENAS.length)return false;
 if(Object.entries(v.cumpleanos).some(([id,ano])=>!CUMPLEANOS.some(c=>c.id===id)||!Number.isInteger(ano)||ano<1||ano>fechaValle(dia).ano))return false;
 const ids=new Set<string>();for(const e of v.escenas){const d=ESCENAS.find(d=>d.id===e?.id);if(!d||ids.has(e.id)||!Number.isInteger(e.dia)||e.dia<0||e.dia>dia||!Number.isInteger(e.eleccion)||e.eleccion<0||e.eleccion>=d.opciones.length)return false;ids.add(e.id);}
 if(v.actual!==null){const d=ESCENAS.find(d=>d.id===v.actual?.id);if(!d||ids.has(d.id)||!Number.isInteger(v.actual.paso)||v.actual.paso<0||v.actual.paso>=d.lineas.length)return false;}return true;
}
