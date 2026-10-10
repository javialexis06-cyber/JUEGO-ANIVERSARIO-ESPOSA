import type { EstadoGranja, Resultado } from './estado';
import { aldeanoDef, puedeConversar, atencionServicio } from './aldeanos';
import { tiempoDia, lluviaRiega } from './clima';
import { calidadPila, cambiarCantidad, resumirCasillas, type Calidad } from './inventario';

export interface ObjetivoEncargo {tipo:'entrega'|'actividad';clave:string;cantidad:number;calidadMinima?:Calidad;texto:string}
export interface DefEncargo {id:string;npcId:string;nombre:string;texto:string;dias:number;monedas:number;amistad:number;objetivos:ObjetivoEncargo[]}
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
export type FaseEncargo='activo'|'completado'|'vencido'|'cancelado';
export interface EntregaEncargo {objetivo:number;articulo:string;cantidad:number;calidad:Calidad}
export interface RegistroEncargo {id:string;aceptadoDia:number;venceDia:number;fase:FaseEncargo;inicios:number[];entregas:EntregaEncargo[]}
export interface EstadoEncargos {version:1;registros:RegistroEncargo[]}
export type AccionEncargo={tipo:'aceptar'|'reclamar'|'cancelar';id:string}|{tipo:'entregar';id:string;objetivo:number;casilla:number;cantidad:number};
export const crearEncargos=():EstadoEncargos=>({version:1,registros:[]});
export const encargoDef=(id:string)=>ENCARGOS.find(d=>d.id===id);
export function progresoEncargo(s:EstadoGranja,r:RegistroEncargo){const d=encargoDef(r.id)!;return d.objetivos.map((o,i)=>o.tipo==='actividad'?Math.min(o.cantidad,Math.max(0,(s.estadisticas[o.clave]??0)-r.inicios[i])):r.entregas.filter(e=>e.objetivo===i).reduce((n,e)=>n+e.cantidad,0));}
export function vencerEncargos(s:EstadoGranja){for(const r of s.encargos.registros)if(r.fase==='activo'&&s.jornada.diasCompletados>=r.venceDia)r.fase='vencido';}
export function cercaCliente(s:EstadoGranja,npcId:string,x:number,z:number){return puedeConversar(s,npcId,x,z,lluviaRiega(tiempoDia(s.tiempo,s.jornada.diasCompletados)));}
export function puedeAceptarEncargo(s:EstadoGranja,d:DefEncargo,x:number,z:number){return cercaCliente(s,d.npcId,x,z)||s.zona==='pueblo'&&!s.interior&&s.servicio==='archivo'&&atencionServicio('archivo',s.jornada.diasCompletados,s.jornada.minutos).abierto;}
const ok=(mensaje:string):Resultado=>({ok:true,mensaje}),no=(mensaje:string):Resultado=>({ok:false,mensaje});
/** MotorGranja garantiza rollback de cualquier fallo; se valida antes de gastar. */
export function actuarEncargo(s:EstadoGranja,a:AccionEncargo,x:number,z:number):Resultado{
 if(!a||!['aceptar','entregar','reclamar','cancelar'].includes(a.tipo))return no('Acción de encargo desconocida.');
 const d=encargoDef(a.id);if(!d)return no('Encargo desconocido.');let r=s.encargos.registros.find(r=>r.id===a.id);const dia=s.jornada.diasCompletados;
 if(a.tipo==='aceptar'){
  if(r&&r.fase!=='cancelado')return no('Este encargo ya está registrado.');
  if(s.encargos.registros.filter(r=>r.fase==='activo').length>=5)return no('Termina un encargo: puedes llevar cinco a la vez.');
  if(!puedeAceptarEncargo(s,d,x,z))return no('Acepta el encargo junto a su vecino o en el tablón de la Casa de los Oficios.');
  const nuevo:RegistroEncargo={id:d.id,aceptadoDia:dia,venceDia:dia+d.dias,fase:'activo',inicios:d.objetivos.map(o=>o.tipo==='actividad'?s.estadisticas[o.clave]??0:0),entregas:[]};
  if(r)Object.assign(r,nuevo);else s.encargos.registros.push(nuevo);return ok(`Encargo aceptado: ${d.nombre}. Tienes ${d.dias} jornadas jugadas.`);
 }
 if(!r)return no('Primero acepta este encargo.');
 if(a.tipo==='cancelar'){
  if(!['activo','vencido'].includes(r.fase))return no('Este encargo ya está cerrado.');
  let casillas=s.casillasInventario;for(const e of r.entregas){const copia=cambiarCantidad(casillas,e.articulo,e.cantidad,e.calidad);if(!copia)return no('Libera espacio para recuperar todas las entregas con su calidad.');casillas=copia;}
  s.casillasInventario=casillas;s.inventario=resumirCasillas(casillas);r.entregas=[];r.fase='cancelado';return ok('Encargo cancelado. Recuperaste los materiales entregados; puedes volver a aceptarlo.');
 }
 if(r.fase!=='activo'||dia>=r.venceDia)return no('El encargo ya no está activo. Si venció, recupera tus entregas desde el diario.');
 if(!cercaCliente(s,d.npcId,x,z))return no('Acércate al vecino que solicitó el encargo.');
 const progreso=progresoEncargo(s,r);
 if(a.tipo==='entregar'){
  if(!Number.isInteger(a.objetivo)||a.objetivo<0||a.objetivo>=d.objetivos.length||!Number.isInteger(a.casilla)||a.casilla<0||a.casilla>=s.casillasInventario.length||!Number.isInteger(a.cantidad)||a.cantidad<1)return no('Elige una cantidad y una casilla válidas.');
  const o=d.objetivos[a.objetivo],p=s.casillasInventario[a.casilla];if(o.tipo!=='entrega'||!p||p.articulo!==o.clave||calidadPila(p)<(o.calidadMinima??0)||a.cantidad>p.cantidad||a.cantidad>o.cantidad-progreso[a.objetivo])return no('La pila, calidad o cantidad no corresponde al pedido pendiente.');
  const calidad=calidadPila(p),prev=r.entregas.find(e=>e.objetivo===a.objetivo&&e.calidad===calidad);if(prev)prev.cantidad+=a.cantidad;else r.entregas.push({objetivo:a.objetivo,articulo:p.articulo,cantidad:a.cantidad,calidad});p.cantidad-=a.cantidad;if(!p.cantidad)s.casillasInventario[a.casilla]=null;s.inventario=resumirCasillas(s.casillasInventario);return ok('Entrega registrada. Los demás objetos y calidades permanecen en tu mochila.');
 }
 if(progreso.some((n,i)=>n<d.objetivos[i].cantidad))return no('Quedan objetivos pendientes.');
 if(s.monedas+d.monedas>1e9)return no('La recompensa supera el límite de monedas.');
 const vecino=s.pueblo.relaciones.find(n=>n.id===d.npcId)!;vecino.conocido=true;vecino.amistad=Math.min(2500,vecino.amistad+d.amistad);s.estadisticas['amistad_'+d.npcId]=vecino.amistad;s.monedas+=d.monedas;r.fase='completado';r.entregas=[];s.estadisticas.encargos_completados=(s.estadisticas.encargos_completados??0)+1;return ok(`Encargo completado: ${d.nombre}. +${d.monedas} monedas y amistad.`);
}
export function encargosValidos(v:unknown,dia:number,stats:Record<string,number>):v is EstadoEncargos{
 const s=v as EstadoEncargos,int=(v:unknown,a:number,b:number)=>typeof v==='number'&&Number.isInteger(v)&&v>=a&&v<=b;
 if(!s||s.version!==1||!Array.isArray(s.registros)||s.registros.length>ENCARGOS.length)return false;
 const ids=new Set<string>();let activos=0;
 for(const r of s.registros){const d=r&&encargoDef(r.id);if(!d||ids.has(r.id)||!aldeanoDef(d.npcId)||!int(r.aceptadoDia,0,dia)||r.venceDia!==r.aceptadoDia+d.dias||!['activo','completado','vencido','cancelado'].includes(r.fase)||r.fase==='activo'&&dia>=r.venceDia||r.fase==='vencido'&&dia<r.venceDia||!Array.isArray(r.inicios)||r.inicios.length!==d.objetivos.length||!Array.isArray(r.entregas)||r.entregas.length>d.objetivos.length*4)return false;
  if(r.inicios.some((n,i)=>!int(n,0,d.objetivos[i].tipo==='actividad'?stats[d.objetivos[i].clave]??0:0)))return false;
  if(['cancelado','completado'].includes(r.fase)&&r.entregas.length)return false;
  const keys=new Set<string>();for(const e of r.entregas){if(!e||!int(e.objetivo,0,d.objetivos.length-1)||!int(e.calidad,0,3)||!int(e.cantidad,1,d.objetivos[e.objetivo].cantidad))return false;const o=d.objetivos[e.objetivo],k=e.objetivo+':'+e.calidad;if(o.tipo!=='entrega'||o.clave!==e.articulo||e.calidad<(o.calidadMinima??0)||keys.has(k))return false;keys.add(k);}
  if(d.objetivos.some((o,i)=>r.entregas.filter(e=>e.objetivo===i).reduce((n,e)=>n+e.cantidad,0)>o.cantidad))return false;
  ids.add(r.id);if(r.fase==='activo')activos++;
 }return activos<=5;
}
