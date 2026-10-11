import type { Estacion } from './catalogo';
import { fechaValle } from './jornada';

export interface PreguntaFestival {texto:string;opciones:readonly string[];correcta:number}
export interface FestivalDef {
 id:string;nombre:string;estacion:Estacion;dia:number;actividad:'semillas'|'ritmo'|'cosecha'|'memoria';
 descripcion:string;recuerdo:string;participantes:readonly string[];preguntas:readonly PreguntaFestival[];
}
/** Celebraciones originales del primer pueblo; no añaden acontecimientos al canon de Astra. */
export const FESTIVALES:readonly FestivalDef[]=[
 {id:'semillas_compartidas',nombre:'Encuentro de las Semillas',estacion:'primavera',dia:13,actividad:'semillas',
  descripcion:'Ordena tres decisiones del huerto junto a quienes cuidan las plantas.',recuerdo:'Semilla del encuentro',
  participantes:['mercader','botanica','agricultor','maestra','nina','nino'],preguntas:[
   {texto:'Antes de poner una semilla en el suelo, ¿qué preparas?',opciones:['La tierra con la azada','Una veta con el pico','Un regalo en la posada'],correcta:0},
   {texto:'Un cultivo inmaduro necesita atención. ¿Qué evita que se seque?',opciones:['Cambiar de personaje','Regarlo y revisar su humedad','Vender la semilla'],correcta:1},
   {texto:'Ya regaste hoy. ¿Qué hace avanzar su crecimiento?',opciones:['Cerrar y abrir la mochila','Cambiar el reloj del teléfono','Dormir para cerrar la jornada'],correcta:2},
  ]},
 {id:'ritmo_fuente',nombre:'Ronda de la Fuente',estacion:'verano',dia:11,actividad:'ritmo',
  descripcion:'Memoriza la secuencia Palma · Campana · Tambor. Recuerda sus tres golpes en orden.',recuerdo:'Compás de la fuente',
  participantes:['musica','artesana','posadera','cocinero','exploradora','viajera'],preguntas:[
   {texto:'Primer golpe',opciones:['Palma','Tambor','Campana'],correcta:0},
   {texto:'Segundo golpe',opciones:['Palma','Tambor','Campana'],correcta:2},
   {texto:'Tercer golpe',opciones:['Palma','Tambor','Campana'],correcta:1},
  ]},
 {id:'mesa_cosecha',nombre:'Mesa de la Cosecha',estacion:'otono',dia:16,actividad:'cosecha',
  descripcion:'Presenta una unidad de un cultivo de tu mochila y responde dos preguntas del cuidado del huerto. La muestra se entrega solo al cobrar; al retirarte la conservas.',recuerdo:'Recuerdo de la cosecha',
  participantes:['cocinero','botanica','mercader','agricultor','cuidadora','veterinaria'],preguntas:[
   {texto:'¿Dónde guardas productos para venderlos al dormir?',opciones:['En el buzón','En la caja de envíos','En la escalera de la mina'],correcta:1},
   {texto:'Una planta ya madura puede quedarse en el jardín. ¿Qué pasa si no la cosechas?',opciones:['Siempre desaparece al dormir','Se convierte en una semilla','Se conserva como decoración'],correcta:2},
  ]},
 {id:'memorias_invierno',nombre:'Velada de los Recuerdos',estacion:'invierno',dia:25,actividad:'memoria',
  descripcion:'Comparte tres conocimientos del valle con los vecinos al preparar el próximo año.',recuerdo:'Luz del recuerdo',
  participantes:['archivero','veterano','maestra','astronoma','minero','guardabosques'],preguntas:[
   {texto:'¿Qué hace avanzar los días y las estaciones del valle?',opciones:['Dormir en la cabaña','Cambiar el reloj del teléfono','Cerrar el juego varios días'],correcta:0},
   {texto:'Al ausentarte, ¿qué reloj sigue contando el cuidado de animales y plantas inmaduras?',opciones:['Solo el de los festivales','El tiempo real','Ninguno'],correcta:1},
   {texto:'¿Cómo cambian de edad las crías?',opciones:['Al reorganizar la mochila','Al entrar en otro edificio','Al dormir una jornada'],correcta:2},
  ]},
];
export const PLAZA_FESTIVAL={x:84,z:10};
export const INICIO_FESTIVAL=540,FIN_FESTIVAL=1080,INICIO_INSCRIPCION=600,FIN_INSCRIPCION=960;
export const festivalDef=(id:string)=>FESTIVALES.find(d=>d.id===id);
export const diaFestival=(d:FestivalDef,ano:number)=>(ano-1)*112+(['primavera','verano','otono','invierno'] as Estacion[]).indexOf(d.estacion)*28+d.dia-1;
export function festivalHoy(dia:number){const f=fechaValle(dia);return FESTIVALES.find(d=>d.estacion===f.estacion&&d.dia===f.dia);}
/** Lugares libres alrededor de la fuente existente, compartidos por motor y rutas de NPC. */
export function puntoParticipante(d:FestivalDef,id:string){const i=d.participantes.indexOf(id);return i<0?null:[{x:79,z:7},{x:81.5,z:8},{x:87,z:9},{x:89,z:7},{x:79,z:-3},{x:89,z:-3}][i];}
