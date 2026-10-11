import type { Calidad, Pila } from './inventario';

export interface ObjetivoEncargo {tipo:'entrega'|'actividad';clave:string;cantidad:number;calidadMinima?:Calidad;texto:string}
export interface EtapaEncargo {nombre:string;texto:string;objetivos:number[]}
export interface DefEncargo {id:string;npcId:string;nombre:string;texto:string;dias:number;monedas:number;amistad:number;objetivos:ObjetivoEncargo[];etapas?:EtapaEncargo[];premios?:Pila[];cierre?:string}
const entrega=(clave:string,cantidad:number,texto:string,calidadMinima:Calidad=0):ObjetivoEncargo=>({tipo:'entrega',clave,cantidad,texto,calidadMinima});
const actividad=(clave:string,cantidad:number,texto:string):ObjetivoEncargo=>({tipo:'actividad',clave,cantidad,texto});
export const ENCARGOS:readonly DefEncargo[]=[
 {id:'pedido_roble',npcId:'carpintera',nombre:'Materiales para el taller',texto:'La carpintera necesita reponer sus materiales. Puedes traerlos por partes.',dias:7,monedas:120,amistad:35,objetivos:[entrega('madera',12,'Madera'),entrega('piedra',8,'Piedra')]},
 {id:'pedido_forja',npcId:'herrero',nombre:'Una fragua encendida',texto:'Reúne combustible y cobre para el herrero.',dias:7,monedas:100,amistad:35,objetivos:[entrega('cobre',4,'Cobre'),entrega('carbon',3,'Carbón')]},
 {id:'pedido_pan',npcId:'posadera',nombre:'Pan para la mesa común',texto:'La posadera prepara una bienvenida y busca pan para compartir.',dias:4,monedas:70,amistad:30,objetivos:[entrega('pan',3,'Pan')]},
 {id:'pedido_heno',npcId:'cuidadora',nombre:'Reserva para el corral',texto:'La cuidadora necesita heno para los animales que esperan hogar.',dias:5,monedas:65,amistad:30,objetivos:[entrega('heno',6,'Heno')]},
 {id:'pedido_fibra',npcId:'artesana',nombre:'Fibras para el telar',texto:'La artesana prepara nuevos tejidos con fibras recogidas en el valle.',dias:6,monedas:80,amistad:30,objetivos:[entrega('fibra',10,'Fibra')]},
 {id:'pedido_cuarzo',npcId:'astronoma',nombre:'Una lente para observar',texto:'La astrónoma necesita cuarzo para reparar sus instrumentos.',dias:8,monedas:90,amistad:35,objetivos:[entrega('cuarzo',3,'Cuarzo')]},
 {id:'pedido_piedra',npcId:'archivero',nombre:'Muestras del valle',texto:'El archivero reúne muestras sencillas para explicar los oficios.',dias:7,monedas:55,amistad:25,objetivos:[entrega('piedra',5,'Piedra'),entrega('madera',5,'Madera')]},
 {id:'pedido_pan_calidad',npcId:'cocinero',nombre:'Una receta bien cuidada',texto:'El cocinero busca pan de calidad plata o superior. Elige la pila que deseas entregar.',dias:7,monedas:120,amistad:40,objetivos:[entrega('pan',2,'Pan de calidad plata o superior',1)]},
 {id:'pedido_pesca',npcId:'pescadora',nombre:'Practicar junto al agua',texto:'Pesca tres ejemplares después de aceptar este encargo. Conservas tus capturas.',dias:7,monedas:85,amistad:30,objetivos:[actividad('pescar',3,'Peces capturados desde la aceptación')]},
 {id:'pedido_cuidado',npcId:'veterinaria',nombre:'Alimento y compañía',texto:'La veterinaria propone cuidar a tus animales. Solo cuentan acciones posteriores a aceptar.',dias:4,monedas:60,amistad:30,objetivos:[actividad('alimentar',2,'Alimentaciones'),actividad('consentir',2,'Gestos de cariño')]},
 {id:'pedido_huerta',npcId:'agricultor',nombre:'Una cosecha compartida',texto:'El agricultor te anima a recoger tu próxima cosecha. No entregas los productos.',dias:14,monedas:100,amistad:35,objetivos:[actividad('cosechar',3,'Cosechas desde la aceptación')]},
 {id:'pedido_pasto',npcId:'guardabosques',nombre:'Pasto para vivir',texto:'Siembra o contrata la siembra de pasto dos veces después de aceptar.',dias:7,monedas:80,amistad:30,objetivos:[actividad('pasto',2,'Abastecimientos de pasto')]},
];

/** Solo recursos iniciales y actividades sin requisitos regionales; no se pide un cultivo fuera de temporada. */
export const PLANTILLAS_ENCARGOS:Record<'diario'|'semanal'|'especial',readonly DefEncargo[]>={
 diario:[
  {id:'madera',npcId:'carpintera',nombre:'Un arreglo pequeño',texto:'Unas tablas para reparar el taller.',dias:3,monedas:35,amistad:10,objetivos:[entrega('madera',4,'Madera')]},
  {id:'piedra',npcId:'archivero',nombre:'Muestras para una lección',texto:'El archivo prepara una explicación de materiales.',dias:3,monedas:30,amistad:10,objetivos:[entrega('piedra',4,'Piedra')]},
  {id:'fibra',npcId:'artesana',nombre:'Unas fibras sueltas',texto:'Fibras del valle para un tejido pequeño.',dias:3,monedas:35,amistad:10,objetivos:[entrega('fibra',4,'Fibra')]},
  {id:'heno',npcId:'cuidadora',nombre:'Raciones para hoy',texto:'La cuidadora repone las raciones del corral.',dias:3,monedas:25,amistad:10,objetivos:[entrega('heno',3,'Heno')]},
  {id:'carino',npcId:'veterinaria',nombre:'Un rato de compañía',texto:'Dale cariño a un animal después de aceptar; conservas tus materiales.',dias:3,monedas:25,amistad:10,objetivos:[actividad('consentir',1,'Gestos de cariño desde la aceptación')]},
  {id:'maleza',npcId:'guardabosques',nombre:'Despejar el terreno',texto:'Retira dos obstáculos de tu granja después de aceptar.',dias:3,monedas:30,amistad:10,objetivos:[actividad('limpiar',2,'Obstáculos retirados desde la aceptación')]},
 ],
 semanal:[
  {id:'taller',npcId:'carpintera',nombre:'Reserva del taller',texto:'Materiales básicos para la semana.',dias:10,monedas:150,amistad:35,objetivos:[entrega('madera',16,'Madera'),entrega('piedra',12,'Piedra')]},
  {id:'corral',npcId:'cuidadora',nombre:'Una semana de cuidados',texto:'Alimenta y acompaña a los animales después de aceptar.',dias:10,monedas:140,amistad:35,objetivos:[actividad('alimentar',4,'Alimentaciones'),actividad('consentir',4,'Gestos de cariño')]},
  {id:'tejido',npcId:'artesana',nombre:'Material para nuevos tejidos',texto:'Reúne fibras y madera; puedes entregarlas por partes.',dias:10,monedas:150,amistad:35,objetivos:[entrega('fibra',16,'Fibra'),entrega('madera',8,'Madera')]},
  {id:'terreno',npcId:'guardabosques',nombre:'Espacio para crecer',texto:'Retira ocho obstáculos de la granja después de aceptar.',dias:10,monedas:145,amistad:35,objetivos:[actividad('limpiar',8,'Obstáculos retirados desde la aceptación')]},
 ],
 especial:[
  {id:'taller_comunal',npcId:'carpintera',nombre:'Preparar el taller común',texto:'Recolecta madera, conversa con la carpintera y luego entrega los materiales. El aspersor del premio se puede colocar en tu granja.',dias:21,monedas:360,amistad:80,
   objetivos:[actividad('madera',12,'Madera recolectada desde la aceptación'),entrega('madera',24,'Madera para el taller'),entrega('piedra',16,'Piedra para el taller')],
   etapas:[{nombre:'Reconocer los materiales',texto:'Recolecta madera nueva y vuelve a la carpintera para revisar el trabajo.',objetivos:[0]},{nombre:'Abastecer el taller',texto:'Ya revisamos la madera. Ahora trae los materiales para cerrar el pedido.',objetivos:[1,2]}],
   premios:[{articulo:'aspersor_basico',cantidad:1}],cierre:'La carpintera guarda los materiales y te entrega un aspersor listo para regar cuatro casillas cada mañana.'},
  {id:'corral_acogida',npcId:'cuidadora',nombre:'Preparar un corral de acogida',texto:'Demuestra cuidados constantes y luego reúne las provisiones. El alimento del premio sirve para tus mascotas.',dias:21,monedas:220,amistad:60,
   objetivos:[actividad('alimentar',4,'Alimentaciones desde la aceptación'),actividad('consentir',4,'Gestos de cariño desde la aceptación'),entrega('heno',12,'Heno'),entrega('fibra',8,'Fibra')],
   etapas:[{nombre:'Rutina de cuidados',texto:'Alimenta y acompaña a tus animales; después visita a la cuidadora.',objetivos:[0,1]},{nombre:'Reunir provisiones',texto:'La rutina está lista. Trae heno y fibra para el corral.',objetivos:[2,3]}],
   premios:[{articulo:'alimento_mascota',cantidad:6}],cierre:'La cuidadora organiza las raciones y te entrega alimento para que también puedas cuidar a tus compañeros.'},
  {id:'mesa_compartida',npcId:'posadera',nombre:'Una mesa para compartir',texto:'Practica la fabricación y luego prepara pan para la posada. Conservas lo que fabriques hasta elegir qué entregar.',dias:21,monedas:300,amistad:70,
   objetivos:[actividad('fabricar',3,'Objetos fabricados desde la aceptación'),entrega('pan',6,'Pan')],
   etapas:[{nombre:'Practicar el oficio',texto:'Fabrica tres objetos y cuéntale a la posadera cómo te fue.',objetivos:[0]},{nombre:'Preparar la mesa',texto:'Ya puedes aportar seis panes, en las pilas que prefieras.',objetivos:[1]}],
   premios:[{articulo:'guiso_minero',cantidad:2}],cierre:'La posadera sirve el pan y reserva para ti dos guisos que recuperan energía durante las expediciones.'},
 ],
};
