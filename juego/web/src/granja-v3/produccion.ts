import { recetaAprendida, type EstadoHabilidades } from './habilidades';
import { articuloValido, mismaPila, calidadPila, cambiarCantidad, limitePila, moverPila, resumirCasillas } from './inventario';
import type { Pila } from './inventario';
import { obtenerObjeto, obtenerReceta } from './objetos';
import type { RecetaProduccion } from './objetos';

export type CasillasProduccion=(Pila|null)[];
export interface PosicionProduccion {zona:string;x:number;z:number}
export interface CofreProduccion extends PosicionProduccion {id:string;articulo:string;casillas:CasillasProduccion;prioridadSalida?:number}
export interface EstructuraProduccion extends PosicionProduccion {id:string;articulo:string}
/** Los ingredientes de cola ya están pagados; el proceso activo también está pagado. */
export interface PedidoProduccion {recetaId:string;cantidad:number;reserva?:Pila[]}
export interface MaquinaProduccion extends PosicionProduccion {
 id:string;articulo:string;recetaId:string|null;cola:PedidoProduccion[];
 proceso:{recetaId:string;terminaEn:number}|null;salida:CasillasProduccion;
}
export interface EstadoProduccion {
 version:1;ultimoTiempo:number;secuencia:number;adyacencia:'cardinal'|'diagonal';
 cofres:CofreProduccion[];maquinas:MaquinaProduccion[];estructuras:EstructuraProduccion[];fabricados:Record<string,number>;
}
export interface ContextoProduccion {habilidades?:EstadoHabilidades;casillas:CasillasProduccion;nivel?:number;desbloqueos?:string[];ahora?:number;zona?:string}
export interface ReferenciaCasilla {tipo:'mochila'|'cofre'|'maquina';id?:string;casilla:number}
export type AccionProduccion=
 |({tipo:'colocar_cofre'|'colocar_maquina'|'colocar_estructura';articulo:string}&PosicionProduccion)
 |{tipo:'receta_maquina';id:string;recetaId:string|null}
 |{tipo:'encolar_receta';id:string;recetaId:string;cantidad?:number}
 |{tipo:'fabricar';recetaId:string;cantidad?:number}
 |{tipo:'cancelar_cola';id:string}
 |{tipo:'prioridad_cofre';id:string;prioridad:number}
 |{tipo:'transferir';desde:ReferenciaCasilla;hasta:ReferenciaCasilla;cantidad?:number}
 |({tipo:'mover_produccion';id:string}&PosicionProduccion)
 |{tipo:'retirar_produccion';id:string}
 |{tipo:'adyacencia';modo:'cardinal'|'diagonal'};
export interface ResultadoProduccion {ok:boolean;mensaje:string;estado:EstadoProduccion;casillas:CasillasProduccion;producidos:Record<string,number>;pendiente:boolean}
export const MAX_NODOS_PRODUCCION=128,MAX_COLA_PRODUCCION=100,MAX_AVANCE_PRODUCCION_MS=7*24*60*60_000,MAX_EVENTOS_PRODUCCION=20_000;
export const ESTRUCTURAS_PRODUCCION=new Set(['portal_verdia','portal_senda','portal_nox','nave_exploradora','aspersor_cobre','aspersor_hierro','aspersor_astral']);
export function huellaProduccion(n:{articulo:string;x:number;z:number}){return {x:n.x,z:n.z,ancho:n.articulo==='nave_exploradora'?3:typeof n.articulo==='string'&&n.articulo.startsWith('portal_')?2:1,fondo:n.articulo==='nave_exploradora'?3:1};}
export function solapanProduccion(a:PosicionProduccion&{articulo:string},b:PosicionProduccion&{articulo:string}){const p=huellaProduccion(a),q=huellaProduccion(b);return a.zona===b.zona&&p.x<q.x+q.ancho&&p.x+p.ancho>q.x&&p.z<q.z+q.fondo&&p.z+p.fondo>q.z;}
const copiaCasillas=(casillas:CasillasProduccion)=>casillas.map(p=>p?{...p}:null);
function clonar(e:EstadoProduccion):EstadoProduccion{return {...e,fabricados:{...e.fabricados},estructuras:e.estructuras.map(n=>({...n})),cofres:e.cofres.map(c=>({...c,casillas:copiaCasillas(c.casillas)})),maquinas:e.maquinas.map(m=>({...m,cola:m.cola.map(p=>({...p,...(p.reserva?{reserva:p.reserva.map(i=>({...i}))}:{})})),proceso:m.proceso?{...m.proceso}:null,salida:copiaCasillas(m.salida)}))};}
const finito=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n);
const entero=(n:unknown,min=0,max=Number.MAX_SAFE_INTEGER):n is number=>Number.isSafeInteger(n)&&Number(n)>=min&&Number(n)<=max;
const texto=(s:unknown):s is string=>typeof s==='string'&&s.length>0&&s.length<=100;
const registro=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const ordenar=<T extends {id:string}>(xs:T[])=>[...xs].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
export function crearProduccion(ahora=0):EstadoProduccion{return {version:1,ultimoTiempo:finito(ahora)?Math.max(0,ahora):0,secuencia:0,adyacencia:'cardinal',cofres:[],maquinas:[],estructuras:[],fabricados:{}};}

function casillasValidas(v:unknown,capacidad:number){return Array.isArray(v)&&v.length===capacidad&&v.every(p=>p===null||(registro(p)&&articuloValido(p.articulo)&&entero(p.cantidad,1,limitePila(p.articulo))&&(p.calidad===undefined||typeof p.calidad==='number'&&[0,1,2,3].includes(p.calidad))));}
function posicionValida(p:unknown):p is PosicionProduccion{return registro(p)&&texto(p.zona)&&entero(p.x,-100000,100000)&&entero(p.z,-100000,100000);}
function recetaCompatible(m:MaquinaProduccion,r:RecetaProduccion){return obtenerObjeto(m.articulo)?.maquina?.estacion===r.estacion&&r.duracionMs>0;}
/** Verificador estricto para importación: devuelve la primera causa, nunca repara ni inventa objetos. */
export function errorProduccion(v:unknown):string|null{
 if(!registro(v)||v.version!==1||!finito(v.ultimoTiempo)||v.ultimoTiempo<0||!entero(v.secuencia)||!['cardinal','diagonal'].includes(String(v.adyacencia)))return 'Cabecera de producción inválida.';
 if(!Array.isArray(v.cofres)||!Array.isArray(v.maquinas)||!Array.isArray(v.estructuras)||v.cofres.length+v.maquinas.length+v.estructuras.length>MAX_NODOS_PRODUCCION)return 'Demasiados dispositivos de producción.';
 const ids=new Set<string>(),posiciones=new Set<string>();
 for(const p of [...v.cofres,...v.maquinas,...v.estructuras]){
  if(!posicionValida(p)||!registro(p)||!texto(p.id)||ids.has(p.id)||!texto(p.articulo))return 'Posición o identificador de producción inválido.';
  const h=huellaProduccion({articulo:p.articulo as string,x:p.x,z:p.z});for(let x=h.x;x<h.x+h.ancho;x++)for(let z=h.z;z<h.z+h.fondo;z++){const posicion=`${p.zona}|${x}|${z}`;if(posiciones.has(posicion))return 'Dos dispositivos ocupan la misma casilla.';posiciones.add(posicion);}
  ids.add(p.id);
 }
 for(const c of v.cofres){const cap=obtenerObjeto(c.articulo)?.contenedor?.casillas;if(!cap||!casillasValidas(c.casillas,cap)||c.prioridadSalida!==undefined&&!entero(c.prioridadSalida,0,9))return 'Contenido de cofre inválido.';}
 for(const n of v.estructuras)if(!ESTRUCTURAS_PRODUCCION.has(n.articulo))return 'Estructura inválida.';
 for(const m of v.maquinas){
  if(!obtenerObjeto(m.articulo)?.maquina||!casillasValidas(m.salida,4)||!Array.isArray(m.cola))return 'Máquina inválida.';
  if(m.recetaId!==null){const r=typeof m.recetaId==='string'&&obtenerReceta(m.recetaId);if(!r||!recetaCompatible(m,r))return 'Receta automática incompatible.';}
  let cantidad=0;for(const p of m.cola){const r=registro(p)&&typeof p.recetaId==='string'&&obtenerReceta(p.recetaId);if(!r||!entero(p.cantidad,1,MAX_COLA_PRODUCCION)||!recetaCompatible(m,r))return 'Cola de fabricación inválida.';
   if(p.reserva!==undefined){
    const cantidadPedido=p.cantidad as number;
    if(!Array.isArray(p.reserva)||p.reserva.length>Object.keys(r.ingredientes).length*4||p.reserva.some(i=>!registro(i)||!texto(i.articulo)||!Object.hasOwn(r.ingredientes,i.articulo)||!entero(i.cantidad,1,r.ingredientes[i.articulo]*cantidadPedido)||i.calidad!==undefined&&(typeof i.calidad!=='number'||![0,1,2,3].includes(i.calidad))))return 'Ingredientes reservados inválidos.';
    const total=resumirCasillas(p.reserva);if(Object.entries(r.ingredientes).some(([id,n])=>total[id]!==n*cantidadPedido)||new Set(p.reserva.map(i=>`${i.articulo}:${calidadPila(i)}`)).size!==p.reserva.length)return 'La reserva no corresponde a los lotes pendientes.';
   }cantidad+=p.cantidad;}
  if(cantidad>MAX_COLA_PRODUCCION)return 'Cola demasiado larga.';
  if(m.proceso!==null){const r=registro(m.proceso)&&typeof m.proceso.recetaId==='string'&&obtenerReceta(m.proceso.recetaId);if(!r||!recetaCompatible(m,r)||!finito(m.proceso.terminaEn)||m.proceso.terminaEn<0)return 'Proceso inválido.';}
 }
 if(!registro(v.fabricados)||Object.entries(v.fabricados).some(([id,n])=>!obtenerObjeto(id)||!entero(n)))return 'Contadores de producción inválidos.';
 return null;
}
/** Para migrar un save antiguo sin campo producción. Saves presentes y dañados se rechazan con errorProduccion antes de llamar. */
export function validarProduccion(v:unknown,ahora=0):EstadoProduccion{return errorProduccion(v)===null?clonar(v as EstadoProduccion):crearProduccion(ahora);}

export function sonAdyacentesProduccion(a:PosicionProduccion,b:PosicionProduccion,modo:'cardinal'|'diagonal'='cardinal'){
 if(a.zona!==b.zona)return false;const dx=Math.abs(a.x-b.x),dz=Math.abs(a.z-b.z);
 return modo==='diagonal'?Math.max(dx,dz)===1:dx+dz===1;
}
/** Toda conexión atraviesa dispositivos contiguos, pero nunca una zona diferente. Orden estable por ID. */
export function gruposProduccion(e:EstadoProduccion):{ids:string[];cofres:string[];maquinas:string[]}[]{
 const nodos=ordenar([...e.cofres,...e.maquinas]),visitados=new Set<string>(),idsCofres=new Set(e.cofres.map(c=>c.id)),grupos:{ids:string[];cofres:string[];maquinas:string[]}[]=[];
 for(const nodo of nodos){if(visitados.has(nodo.id))continue;const pila=[nodo],ids:string[]=[];visitados.add(nodo.id);
  while(pila.length){const actual=pila.shift()!;ids.push(actual.id);for(const vecino of nodos)if(!visitados.has(vecino.id)&&sonAdyacentesProduccion(actual,vecino,e.adyacencia)){visitados.add(vecino.id);pila.push(vecino);}}
  ids.sort();grupos.push({ids,cofres:ids.filter(id=>idsCofres.has(id)),maquinas:ids.filter(id=>!idsCofres.has(id))});
 }return grupos;
}
export const recetaPermitida=(r:RecetaProduccion,c:ContextoProduccion)=>recetaAprendida(c.habilidades,r)&&(c.nivel??0)>=r.nivel&&(!r.requisito||!!c.desbloqueos?.includes(r.requisito));
function gastar(casillas:CasillasProduccion,ingredientes:Record<string,number>,cantidad=1):CasillasProduccion|null{
 let copia=copiaCasillas(casillas);for(const [id,n] of Object.entries(ingredientes)){const siguiente=cambiarCantidad(copia,id,-n*cantidad);if(!siguiente)return null;copia=siguiente;}return copia;
}
function unirReservas(pilas:Pila[]):Pila[]{
 const resultado:Pila[]=[];for(const p of pilas){const igual=resultado.find(i=>mismaPila(i,p));if(igual)igual.cantidad+=p.cantidad;else resultado.push({...p});}return resultado;
}
/** Las partidas anteriores a las calidades reservaban únicamente ingredientes normales. */
function reservaPedido(p:PedidoProduccion):Pila[]{return p.reserva??Object.entries(obtenerReceta(p.recetaId)!.ingredientes).map(([articulo,n])=>({articulo,cantidad:n*p.cantidad}));}
function ingredientesGastados(antes:CasillasProduccion,despues:CasillasProduccion):Pila[]{
 return unirReservas(antes.flatMap((p,i)=>p&&p.cantidad>(despues[i]?.cantidad??0)?[{...p,cantidad:p.cantidad-(despues[i]?.cantidad??0)}]:[]));
}
function extraerDeCofres(cofres:CofreProduccion[],r:RecetaProduccion):boolean{
 const copias=cofres.map(c=>({...c,casillas:copiaCasillas(c.casillas)}));
 for(const [articulo,necesarios] of Object.entries(r.ingredientes)){let resto=necesarios;
  for(const c of copias){const n=Math.min(resto,resumirCasillas(c.casillas)[articulo]||0);if(n)c.casillas=cambiarCantidad(c.casillas,articulo,-n)!;resto-=n;if(!resto)break;}
  if(resto)return false;
 }cofres.forEach((c,i)=>{c.casillas=copias[i].casillas;});return true;
}
/** Puede distribuir una pila entre varios cofres. Cada unidad sale del buffer exactamente una vez. */
function depositar(m:MaquinaProduccion,cofres:CofreProduccion[]):boolean{
 let cambio=false;
 for(let i=0;i<m.salida.length;i++){const pila=m.salida[i];if(!pila)continue;
  const preferidos=[...cofres].sort((a,b)=>(b.prioridadSalida??0)-(a.prioridadSalida??0)||Number(b.casillas.some(p=>p?.articulo===pila.articulo))-Number(a.casillas.some(p=>p?.articulo===pila.articulo))||(a.id<b.id?-1:a.id>b.id?1:0));
  for(const c of preferidos){const espacio=c.casillas.reduce((n,p)=>n+(!p?limitePila(pila.articulo):mismaPila(p,pila)?Math.max(0,limitePila(pila.articulo)-p.cantidad):0),0),n=Math.min(espacio,pila.cantidad);
   if(!n)continue;c.casillas=cambiarCantidad(c.casillas,pila.articulo,n,calidadPila(pila))!;pila.cantidad-=n;cambio=true;if(!pila.cantidad){m.salida[i]=null;break;}
  }
 }return cambio;
}
function resultado(estado:EstadoProduccion,casillas:CasillasProduccion,ok:boolean,mensaje:string,producidos:Record<string,number>={},pendiente=false):ResultadoProduccion{return {estado,casillas,ok,mensaje,producidos,pendiente};}

/**
 * Simulación discreta por finalizaciones, no por frames. Se consumen ingredientes sólo al
 * iniciar; una salida bloqueada impide iniciar otro lote. El límite conserva ultimoTiempo:
 * repetir la llamada reanuda el atraso, nunca descarta horas ni multiplica recompensas.
 */
export function avanzarProduccion(origen:EstadoProduccion,ahora:number,contexto:ContextoProduccion):ResultadoProduccion{
 if(!finito(ahora))return resultado(origen,contexto.casillas,false,'Tiempo de producción inválido.');
 const e=clonar(origen),meta=Math.max(e.ultimoTiempo,ahora),limite=Math.min(meta,e.ultimoTiempo+MAX_AVANCE_PRODUCCION_MS),producidos:Record<string,number>={};
 const maquinas=ordenar(e.maquinas),porId=new Map(e.cofres.map(c=>[c.id,c])),conexion=new Map<string,CofreProduccion[]>();
 for(const g of gruposProduccion(e)){const cofres=g.cofres.map(id=>porId.get(id)!);for(const id of g.maquinas)conexion.set(id,cofres);}
 let cursor=e.ultimoTiempo,eventos=0;
 const asentar=()=>{let cambio=true,pasadas=0;while(cambio&&pasadas++<=maquinas.length*3+1){cambio=false;
  for(const m of maquinas){const cofres=conexion.get(m.id)||[];if(depositar(m,cofres))cambio=true;
   if(m.proceso&&m.proceso.terminaEn<=cursor){const r=obtenerReceta(m.proceso.recetaId)!;const salida=cambiarCantidad(m.salida,r.salida.articulo,r.salida.cantidad);
    if(salida){m.salida=salida;m.proceso=null;producidos[r.salida.articulo]=(producidos[r.salida.articulo]||0)+r.salida.cantidad;e.fabricados[r.salida.articulo]=(e.fabricados[r.salida.articulo]||0)+r.salida.cantidad;cambio=true;depositar(m,cofres);}
   }
   if(m.proceso||m.salida.some(Boolean))continue;
   if(m.cola.length){const pedido=m.cola[0],r=obtenerReceta(pedido.recetaId)!;
    if(pedido.reserva)pedido.reserva=gastar(pedido.reserva,r.ingredientes)!.filter((p):p is Pila=>p!==null);
    m.proceso={recetaId:r.id,terminaEn:cursor+r.duracionMs};if(--pedido.cantidad===0)m.cola.shift();cambio=true;}
   else if(m.recetaId){const r=obtenerReceta(m.recetaId)!;if(recetaPermitida(r,contexto)&&extraerDeCofres(cofres,r)){m.proceso={recetaId:r.id,terminaEn:cursor+r.duracionMs};cambio=true;}}
  }
 }};
 asentar();
 while(cursor<limite&&eventos<MAX_EVENTOS_PRODUCCION){
  let siguiente=Infinity;for(const m of maquinas)if(m.proceso&&m.proceso.terminaEn>cursor)siguiente=Math.min(siguiente,m.proceso.terminaEn);
  if(siguiente>limite){cursor=limite;break;}cursor=siguiente;eventos++;asentar();
 }
 e.ultimoTiempo=cursor;return resultado(e,copiaCasillas(contexto.casillas),true,'Producción actualizada.',producidos,cursor<meta);
}

/** Reductor puro. En un rechazo devuelve exactamente el estado y mochila de entrada. */
export function aplicarProduccion(origen:EstadoProduccion,accion:AccionProduccion,contexto:ContextoProduccion):ResultadoProduccion{
 const falla=(mensaje:string)=>resultado(origen,contexto.casillas,false,mensaje);
 const inicial=contexto.ahora===undefined?resultado(clonar(origen),copiaCasillas(contexto.casillas),true,''):avanzarProduccion(origen,contexto.ahora,contexto);
 if(!inicial.ok)return falla(inicial.mensaje);if(inicial.pendiente)return falla('La producción está recuperando tiempo pendiente; actualízala antes de mover objetos.');
 const e=inicial.estado;let casillas=inicial.casillas,mensaje='Producción actualizada.';
 const ocupado=(p:PosicionProduccion&{articulo:string},excepto?:string)=>[...e.cofres,...e.maquinas,...e.estructuras].some(n=>n.id!==excepto&&solapanProduccion(n,p));
 const encolar=(m:MaquinaProduccion,r:RecetaProduccion,cantidad:number):string|null=>{
  if(!recetaCompatible(m,r))return 'La receta necesita otra estación.';if(!recetaPermitida(r,contexto))return 'Falta aprendizaje, nivel de herramienta o un descubrimiento. Consulta Habilidades y duerme para reconocer lo aprendido.';
  if(m.cola.reduce((n,p)=>n+p.cantidad,0)+cantidad>MAX_COLA_PRODUCCION)return 'La cola admite hasta cien lotes.';
  const despues=gastar(casillas,r.ingredientes,cantidad);if(!despues)return 'Faltan ingredientes en la mochila.';
  const reserva=ingredientesGastados(casillas,despues);casillas=despues;const ultimo=m.cola.at(-1);if(ultimo?.recetaId===r.id){ultimo.reserva=unirReservas([...reservaPedido(ultimo),...reserva]);ultimo.cantidad+=cantidad;}else m.cola.push({recetaId:r.id,cantidad,reserva});return null;
 };
 switch(accion.tipo){
  case 'colocar_cofre':case 'colocar_maquina':case 'colocar_estructura':{
   if(!posicionValida(accion)||ocupado(accion))return falla('Esa casilla está ocupada o no es válida.');
   if(e.cofres.length+e.maquinas.length+e.estructuras.length>=MAX_NODOS_PRODUCCION)return falla('Se alcanzó el límite de dispositivos.');
   const objeto=obtenerObjeto(accion.articulo);if(accion.tipo==='colocar_cofre'?!objeto?.contenedor:accion.tipo==='colocar_maquina'?!objeto?.maquina:!ESTRUCTURAS_PRODUCCION.has(accion.articulo))return falla('Objeto de producción desconocido.');
   const despues=cambiarCantidad(casillas,accion.articulo,-1);if(!despues)return falla('Necesitas ese dispositivo en la mochila.');casillas=despues;
   let id:string;do{id=`produccion_${++e.secuencia}`;}while([...e.cofres,...e.maquinas,...e.estructuras].some(n=>n.id===id));
   const base={id,articulo:accion.articulo,zona:accion.zona,x:accion.x,z:accion.z};
   if(accion.tipo==='colocar_cofre')e.cofres.push({...base,casillas:Array(objeto!.contenedor!.casillas).fill(null)});
   else if(accion.tipo==='colocar_maquina')e.maquinas.push({...base,recetaId:null,cola:[],proceso:null,salida:Array(4).fill(null)});else e.estructuras.push(base);mensaje=`${objeto!.nombre} colocado.`;break;
  }
  case 'adyacencia':if(accion.modo!=='cardinal'&&accion.modo!=='diagonal')return falla('Modo de conexión desconocido.');e.adyacencia=accion.modo;mensaje=`Conexión ${accion.modo} activada.`;break;
  case 'prioridad_cofre':{const c=e.cofres.find(c=>c.id===accion.id);if(!c||!entero(accion.prioridad,0,9))return falla('Cofre o prioridad inválida.');c.prioridadSalida=accion.prioridad;mensaje='Prioridad de salida del cofre actualizada.';break;}
  case 'receta_maquina':{
   const m=e.maquinas.find(m=>m.id===accion.id);if(!m)return falla('No existe esa máquina.');
   if(accion.recetaId!==null){const r=obtenerReceta(accion.recetaId);if(!r||!recetaCompatible(m,r))return falla('La receta no corresponde a esta máquina.');if(!recetaPermitida(r,contexto))return falla('Falta aprendizaje, nivel de herramienta o un descubrimiento. Consulta Habilidades y duerme para reconocer lo aprendido.');}
   m.recetaId=accion.recetaId;mensaje=accion.recetaId?'Receta automática seleccionada.':'Producción automática desactivada; el lote actual se conserva.';break;
  }
  case 'fabricar':case 'encolar_receta':{
   const r=obtenerReceta(accion.recetaId),cantidad=accion.cantidad??1;if(!r||!entero(cantidad,1,MAX_COLA_PRODUCCION))return falla('Receta o cantidad inválida.');
   if(!recetaPermitida(r,contexto))return falla('Falta aprendizaje, nivel de herramienta o un descubrimiento. Consulta Habilidades y duerme para reconocer lo aprendido.');
   if(accion.tipo==='fabricar'&&r.estacion==='mano'){
    const gastado=gastar(casillas,r.ingredientes,cantidad),despues=gastado&&cambiarCantidad(gastado,r.salida.articulo,r.salida.cantidad*cantidad);
    if(!gastado)return falla('Faltan ingredientes en la mochila.');if(!despues)return falla('La mochila no tiene espacio para el resultado.');casillas=despues;
    e.fabricados[r.salida.articulo]=(e.fabricados[r.salida.articulo]||0)+r.salida.cantidad*cantidad;inicial.producidos[r.salida.articulo]=(inicial.producidos[r.salida.articulo]||0)+r.salida.cantidad*cantidad;mensaje=`Fabricaste ${cantidad*r.salida.cantidad} × ${r.nombre}.`;
   }else{
    const m=accion.tipo==='encolar_receta'?e.maquinas.find(m=>m.id===accion.id):ordenar(e.maquinas).find(m=>recetaCompatible(m,r)&&(!contexto.zona||m.zona===contexto.zona));
    if(!m)return falla(`Coloca una estación ${r.estacion.replaceAll('_',' ')} para esta receta.`);
    const error=encolar(m,r,cantidad);if(error)return falla(error);mensaje=`${cantidad} lote(s) de ${r.nombre} en cola; ingredientes reservados.`;
   }break;
  }
  case 'cancelar_cola':{
   const m=e.maquinas.find(m=>m.id===accion.id);if(!m)return falla('No existe esa máquina.');
   let despues=copiaCasillas(casillas);for(const p of m.cola)for(const i of reservaPedido(p)){const nuevo=cambiarCantidad(despues,i.articulo,i.cantidad,calidadPila(i));if(!nuevo)return falla('No hay espacio para devolver los ingredientes de la cola.');despues=nuevo;}
   m.cola=[];casillas=despues;mensaje='Ingredientes de los lotes pendientes devueltos. El lote en proceso continúa.';break;
  }
  case 'transferir':{
   const buscar=(r:ReferenciaCasilla)=>r.tipo==='mochila'?casillas:r.tipo==='cofre'?e.cofres.find(c=>c.id===r.id)?.casillas:r.tipo==='maquina'?e.maquinas.find(m=>m.id===r.id)?.salida:undefined;
   const origenSlots=buscar(accion.desde),destinoSlots=buscar(accion.hasta),desde=accion.desde.casilla,hasta=accion.hasta.casilla;
   if(!origenSlots||!destinoSlots||!entero(desde,0,origenSlots.length-1)||!entero(hasta,0,destinoSlots.length-1))return falla('Casilla inexistente.');
   if(accion.hasta.tipo==='maquina'&&origenSlots!==destinoSlots)return falla('La salida de máquina sólo permite retirar productos.');
   if(origenSlots===destinoSlots){const movido=moverPila(origenSlots,desde,hasta,accion.cantidad);if(!movido)return falla('No se puede mover esa pila.');origenSlots.splice(0,origenSlots.length,...movido);}
   else{
    const p=origenSlots[desde],destino=destinoSlots[hasta],n=accion.cantidad??p?.cantidad;
    if(!p||!entero(n,1,p.cantidad))return falla('Cantidad inválida.');
    if(destino&&!mismaPila(destino,p))return falla('El destino contiene otro objeto.');
    if((destino?.cantidad||0)+n>limitePila(p.articulo))return falla('La pila de destino está llena.');
    destinoSlots[hasta]={...p,cantidad:(destino?.cantidad||0)+n};p.cantidad-=n;if(!p.cantidad)origenSlots[desde]=null;
   }mensaje='Objetos transferidos.';break;
  }
  case 'mover_produccion':{
   const n=[...e.cofres,...e.maquinas,...e.estructuras].find(n=>n.id===accion.id);if(!n)return falla('No existe ese dispositivo.');
   if(!posicionValida(accion)||ocupado({...accion,articulo:n.articulo},n.id))return falla('El destino está ocupado o es inválido.');
   n.zona=accion.zona;n.x=accion.x;n.z=accion.z;mensaje='Dispositivo movido con su contenido y proceso.';break;
  }
  case 'retirar_produccion':{
   const cofre=e.cofres.find(c=>c.id===accion.id),m=e.maquinas.find(m=>m.id===accion.id),n=cofre||m||e.estructuras.find(n=>n.id===accion.id);if(!n)return falla('No existe ese dispositivo.');
   if(m&&(m.proceso||m.cola.length))return falla('Finaliza el lote y cancela la cola antes de retirar la máquina.');
   let despues=copiaCasillas(casillas);for(const p of cofre?cofre.casillas:m?m.salida:[]){if(!p)continue;const nuevo=cambiarCantidad(despues,p.articulo,p.cantidad,calidadPila(p));if(!nuevo)return falla('No cabe todo el contenido en la mochila.');despues=nuevo;}
   const nuevo=cambiarCantidad(despues,n.articulo,1);if(!nuevo)return falla('No cabe el dispositivo en la mochila.');casillas=nuevo;e.cofres=e.cofres.filter(c=>c.id!==accion.id);e.maquinas=e.maquinas.filter(m=>m.id!==accion.id);e.estructuras=e.estructuras.filter(n=>n.id!==accion.id);mensaje='Dispositivo y contenido recuperados.';break;
  }
  default:return falla('Acción de producción desconocida.');
 }
 const asentado=avanzarProduccion(e,e.ultimoTiempo,{...contexto,casillas});
 for(const [id,n] of Object.entries(asentado.producidos))inicial.producidos[id]=(inicial.producidos[id]||0)+n;
 return resultado(asentado.estado,asentado.casillas,true,mensaje,inicial.producidos);
}
