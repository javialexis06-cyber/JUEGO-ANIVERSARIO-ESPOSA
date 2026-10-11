import type { CartaDef } from './correo';
import type { DefEncargo, ObjetivoEncargo } from './encargos-datos';
import type { RecetaProduccion } from './objetos';

export interface RamaCorrespondencia {nombre:string;encargo:DefEncargo;receta:RecetaProduccion;confirmacion:CartaDef;cierre:CartaDef}
export interface ProyectoCorrespondencia {id:string;carta:CartaDef;ramas:readonly RamaCorrespondencia[]}
const actividad=(clave:string,cantidad:number,texto:string):ObjetivoEncargo=>({tipo:'actividad',clave,cantidad,texto});
const entrega=(clave:string,cantidad:number,texto:string):ObjetivoEncargo=>({tipo:'entrega',clave,cantidad,texto});
function rama(proyecto:string,eleccion:number,id:string,nombre:string,npcId:string,remitente:string,practica:ObjetivoEncargo[],materiales:ObjetivoEncargo[],receta:RecetaProduccion):RamaCorrespondencia {
 const cierre=`Aprendiste ${receta.nombre}. Consulta Producción para prepararla con sus materiales, herramienta y habilidad habituales.`;
 return {nombre,receta,encargo:{id:'proyecto_'+id,npcId,nombre,texto:'Un proyecto elegido por correspondencia. Solo cuenta la práctica realizada después de aceptarlo.',dias:21,monedas:120,amistad:45,objetivos:[...practica,...materiales],etapas:[{nombre:'Practicar el oficio',texto:'Practica y revisa esta etapa junto al solicitante antes de entregar materiales.',objetivos:practica.map((_,i)=>i)},{nombre:'Preparar el proyecto',texto:'Entrega los materiales por partes y cierra el proyecto junto al solicitante para aprender su receta.',objetivos:materiales.map((_,i)=>practica.length+i)}],cierre},
  confirmacion:{id:'confirmacion_'+id,remitente,titulo:'Tu proyecto: '+nombre,texto:'Recibimos tu elección. El diario conserva las etapas y el plazo. Si necesitas cancelar o el encargo vence, recupera tus entregas y retoma esta misma rama desde el buzón.',diaMin:0,monedas:0,objetos:[],proyecto,eleccion,momento:'confirmacion'},
  cierre:{id:'cierre_'+id,remitente,titulo:'Un oficio que permanece: '+nombre,texto:cierre+' La receta y tu decisión permanecen al guardar y volver al valle.',diaMin:0,monedas:0,objetos:[],proyecto,eleccion,momento:'cierre'}};
}
export const PROYECTOS_CORRESPONDENCIA:readonly ProyectoCorrespondencia[]=[
 {id:'oficios',carta:{id:'proyecto_oficios',remitente:'Casa de los Oficios',titulo:'Un proyecto para tu granja',texto:'Ya empezaste a despejar el terreno. Podemos acompañarte con un proyecto de riego o de cuidado del corral. Elige uno: la otra propuesta se cierra. Aprenderás su receta cuando termines las dos etapas.',diaMin:3,actividad:'limpiar',monedas:0,objetos:[]},ramas:[
  rama('oficios',0,'riego','Riego para la huerta','carpintera','La carpintera',[actividad('labrar',6,'Parcelas labradas desde la aceptación')],[entrega('madera',12,'Madera'),entrega('piedra',8,'Piedra')],{id:'riego_del_valle',nombre:'Aspersor con soporte de madera',estacion:'banco_trabajo',ingredientes:{madera:8,lingote_cobre:1},salida:{articulo:'aspersor_basico',cantidad:1},duracionMs:10000,nivel:0,requisito:'correo_riego'}),
  rama('oficios',1,'cuidados','Raciones para el corral','cuidadora','La cuidadora',[actividad('alimentar',4,'Alimentaciones desde la aceptación'),actividad('consentir',4,'Gestos de cariño desde la aceptación')],[entrega('heno',12,'Heno'),entrega('fibra',8,'Fibra')],{id:'raciones_del_corral',nombre:'Raciones del corral',estacion:'mano',ingredientes:{fibra:3,heno:2},salida:{articulo:'alimento_mascota',cantidad:2},duracionMs:0,nivel:0,requisito:'correo_cuidados'}),
 ]},
 {id:'senderos',carta:{id:'proyecto_senderos',remitente:'Casa de los Oficios',titulo:'Preparar las próximas salidas',texto:'Tu primera expedición abrió nuevos senderos. Podemos preparar las salidas de pesca o las visitas a la mina. Elige una rama; al completarla aprenderás una receta para esas salidas.',diaMin:5,actividad:'expediciones',monedas:0,objetos:[]},ramas:[
  rama('senderos',0,'pesca','Cebo para los senderos','pescadora','La pescadora',[actividad('pescar',3,'Capturas desde la aceptación')],[entrega('lombriz',6,'Lombrices'),entrega('fibra',8,'Fibra')],{id:'cebo_del_sendero',nombre:'Cebo del sendero',estacion:'mano',ingredientes:{lombriz:2,fibra:1},salida:{articulo:'pez_cebo',cantidad:2},duracionMs:0,nivel:0,requisito:'correo_pesca'}),
  rama('senderos',1,'mineria','Una comida para la mina','minero','El minero',[actividad('mineria',3,'Nodos mineros rotos desde la aceptación')],[entrega('carbon',4,'Carbón'),entrega('piedra',12,'Piedra')],{id:'guiso_del_sendero',nombre:'Guiso del sendero',estacion:'cocina',ingredientes:{pan:1,zanahoria:2},salida:{articulo:'guiso_minero',cantidad:1},duracionMs:45000,nivel:1,requisito:'correo_mineria'}),
 ]},
];
export const CARTAS_CORRESPONDENCIA:readonly CartaDef[]=PROYECTOS_CORRESPONDENCIA.flatMap(p=>[p.carta,...p.ramas.flatMap(r=>[r.confirmacion,r.cierre])]);
export const ENCARGOS_CORRESPONDENCIA=PROYECTOS_CORRESPONDENCIA.flatMap(p=>p.ramas.map(r=>r.encargo));
export const RECETAS_CORRESPONDENCIA=PROYECTOS_CORRESPONDENCIA.flatMap(p=>p.ramas.map(r=>r.receta));
export const proyectoPorCarta=(id:string)=>PROYECTOS_CORRESPONDENCIA.find(p=>p.carta.id===id);
export function ramaPorEncargo(id:string){for(const proyecto of PROYECTOS_CORRESPONDENCIA){const eleccion=proyecto.ramas.findIndex(r=>r.encargo.id===id);if(eleccion>=0)return {proyecto,eleccion,rama:proyecto.ramas[eleccion]};}}
