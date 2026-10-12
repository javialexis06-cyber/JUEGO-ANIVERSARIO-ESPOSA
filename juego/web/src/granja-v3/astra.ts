import {comisionHistoria} from './historia-ubicaciones';
import { DATOS } from './astra-mundo-datos';
import { DATOS as CAMPANA } from './astra-campana-datos';
import { DATOS as RECURSOS } from './astra-recursos-datos';
import { libreVivienda } from './pueblo-datos';
import type { EstadoGranja, Resultado } from './estado';
import { ubicacionAldeano, puedeConversar } from './aldeanos';

export const REGIONES_ASTRA = DATOS.regiones;
export const RUTAS_ASTRA = DATOS.rutas;
export const NPC_ASTRA = DATOS.npc;
export const CAMPANA_ASTRA = CAMPANA.misiones;
export const CINEMATICAS_ASTRA:Record<string,string>={C01:'P01',C02:'P03',C03:'P05',C04:'P09',C05:'P10',C06:'P15',C07:'P21',C08:'P22',C09:'P23',C10:'P24',C11:'F01',C12:'F04',C13:'F06',C14:'F12'};
/** El plano de cada pueblo (calles, plaza, archivo, puestos, combate) lo arma el generador; sin plano, el tamaño de antes. */
export const planoAstra=(region:string)=>(regionAstra(region) as {plano?:{limites:{x:number;z:number};plaza:{x:number;z:number;r:number};inicio:{x:number;z:number};archivo:{x:number;z:number};combate:{x:number;z:number}|null;solidos:number[][]}}|undefined)?.plano;
export const puntoArchivo=(region:string)=>region==='pueblo_sol'?{x:75.5,z:23.4}:planoAstra(region)?.archivo??{x:0,z:22};
export const puntoCombate=(region:string)=>planoAstra(region)?.combate??{x:18,z:23};
const limitesAstra=(region:string)=>planoAstra(region)?.limites??{x:24,z:28};
export const puntoRecurso=(region:string,i:number)=>RECURSOS_ASTRA.find(r=>r.id===region)!.recursos[i].punto;
export const RECURSOS_ASTRA=RECURSOS;
export const regionAstra=(id:string)=>REGIONES_ASTRA.find(r=>r.id===id);
export const npcAstra=(id:string)=>NPC_ASTRA.find(n=>n.id===id);
export const regionActual=(s:EstadoGranja)=>s.astra?.actual??(s.zona==='pueblo'?'pueblo_sol':s.zona);
export interface EstadoAstra {
 version:1;actual:string|null;interior:string|null;posicion:{x:number;z:number};
 visitas:string[];conocidos:string[];charlas:Record<string,{dia:number;puntos:number}>;
 escena:{id:string;linea:number}|null;lecturas:string[];
 expedientes:Record<string,{dia:number;estadisticas:Record<string,number>;paso:number;decision:number|null;cerrado:boolean}>;
 cupos:Record<string,{ciclo:number;cantidad:number}>;observaciones:string[];pruebas:string[];
 mantenimiento:{region:string;visitasRestantes:number}|null;
 personales:string[];
}
export type AccionAstra=
 |{tipo:'ruta';id:string}|{tipo:'hablar';id:string}|{tipo:'vivienda';id:string}|{tipo:'salir_vivienda'}
 |{tipo:'cine';id:string}|{tipo:'escena';id:string}|{tipo:'continuar'}|{tipo:'cancelar_escena'}
 |{tipo:'retomar';id:string}|{tipo:'aceptar';id:string}|{tipo:'comprobar';id:string}|{tipo:'decidir';id:string;opcion:number}
 |{tipo:'mantenimiento'}|{tipo:'recurso';id:string}|{tipo:'observar';id:string}|{tipo:'balance';elemento:string};
export function crearAstra():EstadoAstra{return {version:1,actual:null,interior:null,posicion:{x:0,z:8},visitas:[],conocidos:[],charlas:{},escena:null,lecturas:[],expedientes:{},cupos:{},observaciones:[],pruebas:[],mantenimiento:null,personales:[]};}
const bien=(mensaje:string,extra:Partial<Resultado>={}):Resultado=>({ok:true,mensaje,...extra});
const mal=(mensaje:string):Resultado=>({ok:false,mensaje});
const cerca=(x:number,z:number,p:{x:number;z:number},radio=3)=>Math.hypot(x-p.x,z-p.z)<=radio;
export function puntoRuta(s:EstadoGranja,r:typeof RUTAS_ASTRA[number]){
 const here=regionActual(s);
 if(here!==r.desde&&here!==r.hacia)return null;
 if(here==='granja'&&r.construccion){const n=s.produccion.estructuras.find(n=>n.articulo===r.construccion&&n.zona==='granja');return n?{x:n.x+.5,z:n.z+.5}:null;}
 return here===r.desde?r.desde_punto:r.hacia_punto;
}
export function rutasDesde(s:EstadoGranja){const here=regionActual(s);return RUTAS_ASTRA.filter(r=>r.desde===here||r.hacia===here).map(r=>({...r,destino:r.desde===here?r.hacia:r.desde,punto:puntoRuta(s,r)}));}
export function posicionNpcAstra(s:EstadoGranja,id:string):{x:number;z:number;interior:string|null}|null {
 const n=npcAstra(id);if(!n)return null;const comision=comisionHistoria(s,id);if(comision)return comision.region===regionActual(s)&&s.jornada.minutos>=480&&s.jornada.minutos<1020?{x:comision.x,z:comision.z,interior:null}:null;if(n.region!==regionActual(s))return null;
 if(n.region==='pueblo_sol'){const p=ubicacionAldeano(id,s.jornada.diasCompletados,s.jornada.minutos,false);return p?.visible?{x:p.x,z:p.z,interior:null}:null;}
 const r=regionAstra(n.region)!,h=r.viviendas.find(h=>h.id===n.hogar),min=s.jornada.minutos,descanso=s.jornada.diasCompletados%7===r.npc.indexOf(id)%7;
 if(descanso){if(h&&(min<600||min>=1080))return {x:-2+r.npc.filter(i=>npcAstra(i)?.hogar===n.hogar).indexOf(id)*3,z:1,interior:h.id};return {...n.plaza,interior:null};}
 if(min>=1260||min<480)return h?{x:-2+r.npc.filter(i=>npcAstra(i)?.hogar===n.hogar).indexOf(id)*3,z:1,interior:h.id}:null;
 return {...(min<1020?n.oficio:n.plaza),interior:null};
}
export function libreAstra(s:EstadoGranja,x:number,z:number){
 if(s.astra?.interior)return libreVivienda(x,z);
 return libreRegionAstra(s.astra?.actual??'',x,z);
}
/** Dentro del pueblo y sin chocar con casas, puestos, monumento ni archivo. */
export function libreRegionAstra(region:string,x:number,z:number){
 const r=regionAstra(region),l=limitesAstra(region);return !!r&&Math.abs(x)<l.x&&Math.abs(z)<l.z&&!r.viviendas.some(h=>x>h.x-.4&&x<h.x+h.ancho+.4&&z>h.z-.4&&z<h.z+h.fondo+.4)&&!(planoAstra(region)?.solidos??[]).some(([bx,bz,w,d])=>Math.abs(x-bx)<w+.3&&Math.abs(z-bz)<d+.3);
}
/** Una partida guardada con el plano viejo puede quedar dentro de algo nuevo: vuelve a la entrada del pueblo. */
export function reubicarAstra(t:EstadoAstra|undefined){
 if(!t?.actual||t.interior||!Number.isFinite(t.posicion?.x)||!Number.isFinite(t.posicion?.z))return;const l=limitesAstra(t.actual);/* Fuera de los límites es una partida corrupta: eso lo rechaza la validación */if(Math.abs(t.posicion.x)<l.x&&Math.abs(t.posicion.z)<l.z&&!libreRegionAstra(t.actual,t.posicion.x,t.posicion.z))t.posicion={...(planoAstra(t.actual)?.inicio??{x:0,z:8})};
}
export function campanaDisponible(s:EstadoGranja,q:typeof CAMPANA_ASTRA[number]){return q.requiere.every(id=>s.astra?.expedientes[id]?.cerrado||s.historia?.completadas[id]);}
export function actuarAstra(s:EstadoGranja,a:AccionAstra,x:number,z:number,recursos:{agregar:(id:string,n:number)=>void;noche?:()=>unknown}) :Resultado {
 const t=s.astra??(s.astra=crearAstra()),here=regionActual(s);
 if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>1000||Math.abs(z)>1000)return mal('Posición inválida.');
 if(t.escena&&!['continuar','cancelar_escena'].includes(a.tipo))return mal('Termina o deja la conversación antes de continuar.');
 if(a.tipo==='cancelar_escena'){t.escena=null;return bien('Puedes retomar la conversación desde el principio.');}
 if(a.tipo==='continuar'){
  if(!t.escena)return mal('No hay una escena activa.');const n=(CAMPANA.escenas as Record<string,number>)[t.escena.id];
  if(++t.escena.linea>=n){const id=t.escena.id;if(!t.lecturas.includes(id))t.lecturas.push(id);t.escena=null;
   if(id.endsWith('#cierre')){const q=id.split('#')[0],decision=q.startsWith('H:')?s.historia?.completadas[q.slice(2)]?.opcion:t.expedientes[q]?.decision,ram=q+'#rama'+(decision===0?'1':'2');if(Object.hasOwn(CAMPANA.escenas,ram))t.escena={id:ram,linea:0};}
   return bien('Lectura guardada.');}return bien('');
 }
 if(a.tipo==='ruta'){
  if(s.interior||s.servicio||t.interior)return mal('Sal de la vivienda para viajar.');
  const r=RUTAS_ASTRA.find(r=>r.id===a.id),p=r&&puntoRuta(s,r);if(!r||!p||!cerca(x,z,p))return mal('Camina hasta el acceso físico de esta ruta.');
  const destino=here===r.desde?r.hacia:r.desde,reg=regionAstra(destino),retorno=here===r.hacia;
  if(!retorno&&reg?.permiso&&!t.expedientes[reg.permiso]?.cerrado&&!s.historia?.completadas[reg.permiso])return mal('El acceso requiere el expediente '+reg.permiso+'. El regreso permanece abierto.');
  if(r.construccion&&!s.produccion.estructuras.some(n=>n.articulo===r.construccion&&n.zona==='granja'))return mal('Fabrica y coloca '+r.construccion+' para abrir esta ruta.');
  let llegada=here===r.desde?r.hacia_punto:r.desde_punto;
  if(destino==='granja'){const n=s.produccion.estructuras.find(n=>n.articulo===r.construccion&&n.zona==='granja')!;llegada={x:n.x+.5,z:n.z+2.5};}
  else if(destino!=='pueblo_sol')llegada={x:llegada.x>0?llegada.x-1.5:llegada.x+1.5,z:llegada.z};
  t.actual=['granja','pueblo_sol'].includes(destino)?null:destino;t.interior=null;t.posicion={...llegada};
  if(destino==='pueblo_sol')s.zona='pueblo';else if(destino==='granja')s.zona='granja';
  s.interior=null;s.servicio=null;if(!t.visitas.includes(destino))t.visitas.push(destino);
  if(!t.actual)s.posicionExterior={zona:s.zona,...llegada};
  if(t.mantenimiento?.region===destino){if(t.mantenimiento.visitasRestantes>1)t.mantenimiento.visitasRestantes--;else t.mantenimiento=null;}
  return bien('Llegaste a '+(reg?.nombre??'tu granja')+'.',{posicionZona:llegada});
 }
 if(a.tipo==='vivienda'){
  const h=regionAstra(here)?.viviendas.find(h=>h.id===a.id);if(!t.actual||t.interior||!h||!cerca(x,z,h.entrada))return mal('Acércate a la puerta de esa vivienda.');
  if(s.jornada.minutos<480||s.jornada.minutos>=1260)return mal('Las visitas son de 08:00 a 21:00. La intimidad de sus habitaciones se respeta.');
  t.interior=h.id;t.posicion={x:0,z:3};return bien(h.nombre,{posicionZona:t.posicion});
 }
 if(a.tipo==='salir_vivienda'){
  const h=regionAstra(here)?.viviendas.find(h=>h.id===t.interior);if(!h)return mal('No estás en una vivienda.');
  t.interior=null;t.posicion={x:h.entrada.x,z:h.entrada.z+1};return bien('Saliste a la calle.',{posicionZona:t.posicion});
 }
 if(a.tipo==='cine'){const q=CINEMATICAS_ASTRA[a.id];if(!q||!t.expedientes[q]?.cerrado&&!s.historia?.completadas[q])return mal('Cierra primero el expediente de esta escena.');t.escena={id:a.id,linea:0};return bien('Escena narrativa: los subtítulos conservan toda la narración.');}
 if(a.tipo==='hablar'){
  const n=npcAstra(a.id),p=posicionNpcAstra(s,a.id);if(!n||!(n.region==='pueblo_sol'?puedeConversar(s,n.id,x,z):p&&p.interior===t.interior&&cerca(x,z,p)))return mal('Busca al personaje según su horario y acércate para conversar.');
  if(!t.conocidos.includes(n.id))t.conocidos.push(n.id);
  const f=t.charlas[n.id]??{dia:-1,puntos:0};if(f.dia!==s.jornada.diasCompletados){f.dia=s.jornada.diasCompletados;f.puntos=Math.min(500,f.puntos+5);}t.charlas[n.id]=f;
  const scene='VID_'+n.id+'_1';if((CAMPANA.escenas as Record<string,number>)[scene])t.escena={id:scene,linea:0};return bien('Conversando con '+n.nombre+'.');
 }
 if(a.tipo==='escena'){
  const npc=NPC_ASTRA.find(n=>a.id==='VID_'+n.id+'_2');
  if(npc&&!npc.mision)return mal('Su próximo recuerdo llegará con su historia.');if(npc&&npc.mision&&!t.personales.includes(npc.mision))return mal('Este recuerdo ocurre después de su misión personal. Completa primero '+npc.mision+' en Campaña.');
  if(!npc||!t.conocidos.includes(npc.id)||!t.lecturas.includes('VID_'+npc.id+'_1'))return mal('Escucha primero su recuerdo inicial.');
  const p=posicionNpcAstra(s,npc.id);if(!p||p.interior!==t.interior||!cerca(x,z,p))return mal('Acércate para escuchar este recuerdo.');
  t.escena={id:a.id,linea:0};return bien('Un recuerdo compartido.');
 }
 if(a.tipo==='recurso'||a.tipo==='observar'){
  const r=RECURSOS.find(r=>r.id===here),d=r?.recursos.find(d=>d.id===a.id);if(!r||!d||t.interior)return mal('Ese recurso pertenece a otro lugar.');
  const indice=r.recursos.indexOf(d),p=puntoRecurso(here,indice);if(!cerca(x,z,p))return mal('Acércate al depósito autorizado o al punto de observación.');
  if(d.clase==='fauna'){
   if(a.tipo!=='observar')return mal('Observa a distancia; la fauna silvestre no se extrae.');if(!t.observaciones.includes(d.id))t.observaciones.push(d.id);return bien('Observación guardada: '+d.nombre+'.');
  }
  if(a.tipo!=='recurso')return mal('Este depósito se recoge con la herramienta correspondiente.');
  if(d.clase==='mineral'&&s.herramienta!=='pico'||d.clase==='madera'&&s.herramienta!=='hacha')return mal('Selecciona '+(d.clase==='mineral'?'el pico':'el hacha')+'.');
  const ciclo=Math.floor(s.jornada.diasCompletados/r.renovacion.dias_dormidos),c=t.cupos[d.id]?.ciclo===ciclo?t.cupos[d.id]:{ciclo,cantidad:0},max=d.clase==='mineral'?6:d.clase==='madera'?8:1;
  if(c.cantidad>=max)return mal('Cupo agotado. Se renueva cada '+r.renovacion.dias_dormidos+' jornadas dormidas.');
  const coste=t.mantenimiento?.region===here?1:2;
  if(s.energia<coste)return mal('Necesitas descansar antes de trabajar.');recursos.agregar(d.id,1);s.energia-=coste;c.cantidad++;t.cupos[d.id]=c;if(!t.visitas.includes(here))t.visitas.push(here);return bien(d.nombre+' guardado en la mochila.');
 }
 if(a.tipo==='mantenimiento'){
  if(!RECURSOS.some(r=>r.id===here)||t.interior||!cerca(x,z,puntoArchivo(here)))return mal('Instala el mantenimiento en el archivo público de su región.');
  const id='kit_'+here;if(!(s.inventario[id]>0))return mal('Fabrica su kit en el banco: dos minerales, dos maderas y una cosecha regional.');
  if(t.mantenimiento?.region===here)return mal('Este mantenimiento todavía tiene visitas disponibles.');
  recursos.agregar(id,-1);t.mantenimiento={region:here,visitasRestantes:8};return bien('Mantenimiento local instalado: recoger cuesta una energía durante ocho estancias. Sustituye cualquier kit anterior; no aumenta cupos ni daño.');
 }
 if(a.tipo==='balance'){
  const id='confluencia_'+a.elemento;if(!['fuego','agua','tierra','aire'].includes(a.elemento)||here!==id||t.interior||!cerca(x,z,puntoArchivo(here)))return mal('Ve al puesto de balance del territorio.');
  if(t.pruebas.includes(a.elemento))return mal('Ese balance ya está confirmado.');
  const coste={[id+'_mineral']:2,[id+'_madera']:2};if(!Object.entries(coste).every(([id,n])=>(s.inventario[id]??0)>=n))return mal('Requiere dos minerales y dos maderas autorizados de este territorio.');
  for(const [id,n]of Object.entries(coste))recursos.agregar(id,-n);t.pruebas.push(a.elemento);return bien('Balance confirmado: devolución de materiales al circuito local.');
 }
 if(['aceptar','comprobar','decidir','retomar'].includes(a.tipo)){
  const id=(a as {id:string}).id,q=CAMPANA_ASTRA.find(q=>q.id===id);if(!q||!campanaDisponible(s,q))return mal('Este expediente todavía no está disponible.');
  const exp=t.expedientes[id];
  if(a.tipo==='aceptar'){
   if(exp)return mal('El expediente ya está registrado.');if(here!==q.region||t.interior)return mal('Visita '+(regionAstra(q.region)?.nombre??q.region)+' para abrir el expediente.');
   t.expedientes[id]={dia:s.jornada.diasCompletados,estadisticas:{...s.estadisticas},paso:0,decision:null,cerrado:false};t.escena={id:q.id+'#inicio',linea:0};return bien((q as {clase?:string}).clase?.startsWith('encargo')?'Encargo aceptado.':'Expediente abierto. El guion completo sigue disponible en la wiki.');
  }
  if(a.tipo==='retomar'){if(!exp||here!==q.region)return mal('Vuelve al lugar donde abriste el expediente.');const parte=exp.cerrado?'cierre':exp.paso===q.pasos.length?'giro':'inicio';t.escena={id:id+'#'+parte,linea:0};return bien('La escena se retoma sin repetir entregas.');}
  if(!exp||exp.cerrado)return mal('Abre primero el expediente o consulta su acta cerrada.');
  if(a.tipo==='decidir'){
   if(exp.paso!==q.pasos.length||![0,1].includes(a.opcion)||!t.lecturas.includes(id+'#giro'))return mal('Confirma los objetivos y escucha el giro antes de decidir.');exp.decision=a.opcion;exp.cerrado=true;t.escena={id:id+'#cierre',linea:0};
   // Los encargos de los pueblos pagan al cerrar (una sola vez: el expediente queda cerrado)
   const pago=(q as {recompensa?:{monedas?:number;objetos?:Record<string,number>}}).recompensa;if(pago){if(pago.monedas)s.monedas+=pago.monedas;for(const [o,n] of Object.entries(pago.objetos??{}))recursos.agregar(o,n);return bien('Encargo cumplido'+(pago.monedas?' · +'+pago.monedas+' monedas':'')+'.');}
   return bien('Acta guardada. Acceso narrativo abierto; el premio especializado sigue en producción.');
  }
  if(!t.lecturas.includes(id+'#inicio'))return mal('Escucha o lee el inicio antes de contrastar sus objetivos.');
  const st=q.pasos[exp.paso] as {tipo:string;texto:string;npc?:string[];punto?:{x:number;z:number};clave?:string;cantidad?:number;materiales?:Record<string,number>;regiones?:string[];sector?:string;elemento?:string}|undefined;
  if(!st)return mal('Elige conservar el acta o posponer la declaración.');
  if(st.tipo==='testimonios'){
   if(here!==q.region||t.interior||!cerca(x,z,puntoArchivo(here)))return mal('Consulta el archivo público del lugar.');
   const locales=(st.npc??[]).filter(id=>npcAstra(id)?.region===here);if(!locales.every(id=>t.conocidos.includes(id)))return mal('Habla con los participantes locales; los ausentes tienen copia autorizada en el archivo.');
  }else if(st.tipo==='archivo'){
   if(here!==q.region||t.interior||!cerca(x,z,here==='pueblo_sol'?puntoArchivo(here):st.punto??puntoArchivo(here)))return mal('Camina hasta el archivo público para contrastar la lectura.');
  }else if(st.tipo==='estadistica'){
   if((s.estadisticas[st.clave!]??0)-(exp.estadisticas[st.clave!]??0)<st.cantidad!)return mal(st.texto);
  }else if(st.tipo==='jornadas'){
   if(s.jornada.diasCompletados-exp.dia<st.cantidad!)return mal(st.texto);
  }else if(st.tipo==='entrega'){
   if(here!==q.region)return mal('Lleva los materiales al lugar del expediente.');if(!Object.entries(st.materiales!).every(([id,n])=>(s.inventario[id]??0)>=n))return mal(st.texto);
   for(const [id,n]of Object.entries(st.materiales!))recursos.agregar(id,-n);
  }else if(st.tipo==='visitas'){
   if(!st.regiones!.every(id=>t.visitas.includes(id)))return mal(st.texto);
  }else if(st.tipo==='prueba_elemental'){
   if(!t.pruebas.includes(st.elemento!))return mal(st.texto);
  }else if(st.tipo==='sangre'){
   const n=recursos.noche?.() as {v?:number;noche?:{metas?:unknown};cifras?:{prisioneros?:number}}|undefined;
   if(n?.v!==1||!Array.isArray(n.noche?.metas)||!n.noche.metas.includes('puerta_'+st.sector+':fin')||st.sector==='afueras'&&!(Number.isSafeInteger(n.cifras?.prisioneros)&&n.cifras!.prisioneros!>=1))return mal('Completa la puerta '+st.sector+' en Sangre y Ceniza con el perfil actual'+(st.sector==='afueras'?' y rescata al menos a una persona':'')+'. No se transfieren inventarios.');
  }
  else return mal('Este objetivo requiere una mecánica todavía en producción.');
  exp.paso++;if(exp.paso===q.pasos.length)t.escena={id:id+'#giro',linea:0};return bien('Objetivo comprobado: '+st.texto);
 }
 return mal('Acción de Astra desconocida.');
}

/** Validación estricta y aditiva: una partida antigua recibe este bloque; un bloque corrupto se rechaza. */
export function astraValida(t:EstadoAstra|undefined,dia:number,completadas?:Record<string,unknown>):boolean {
 if(!t||t.version!==1||t.actual!==null&&(!regionAstra(t.actual)||t.actual==='pueblo_sol')||!Number.isFinite(t.posicion?.x)||!Number.isFinite(t.posicion?.z)||Math.abs(t.posicion.x)>1000||Math.abs(t.posicion.z)>1000)return false;
 if(t.interior!==null&&!regionAstra(t.actual??'')?.viviendas.some(h=>h.id===t.interior))return false;
 if(t.actual&&(t.interior?!libreVivienda(t.posicion.x,t.posicion.z):Math.abs(t.posicion.x)>=limitesAstra(t.actual).x||Math.abs(t.posicion.z)>=limitesAstra(t.actual).z))return false;
 const lista=(xs:unknown,ids:string[])=>Array.isArray(xs)&&xs.length<=ids.length&&new Set(xs).size===xs.length&&xs.every(id=>typeof id==='string'&&ids.includes(id));
 if(!lista(t.visitas,[...REGIONES_ASTRA.map(r=>r.id),'granja'])||!lista(t.conocidos,NPC_ASTRA.map(n=>n.id))||!lista(t.lecturas,Object.keys(CAMPANA.escenas))||!lista(t.pruebas,['fuego','agua','tierra','aire']))return false;
 if(!lista(t.personales,NPC_ASTRA.flatMap(n=>n.mision?[n.mision]:[])))return false;
 if(t.escena!==null&&(!t.escena||!Object.hasOwn(CAMPANA.escenas,t.escena.id)||!Number.isInteger(t.escena.linea)||t.escena.linea<0||t.escena.linea>=(CAMPANA.escenas as Record<string,number>)[t.escena.id]))return false;
 if(!t.charlas||typeof t.charlas!=='object'||Object.keys(t.charlas).length>NPC_ASTRA.length||Object.entries(t.charlas).some(([id,v])=>!npcAstra(id)||!t.conocidos.includes(id)||!Number.isInteger(v.dia)||v.dia<0||v.dia>dia||!Number.isInteger(v.puntos)||v.puntos<0||v.puntos>500))return false;
 if(!t.expedientes||typeof t.expedientes!=='object'||Object.keys(t.expedientes).length>CAMPANA_ASTRA.length)return false;
 for(const [id,v]of Object.entries(t.expedientes)){
  const q=CAMPANA_ASTRA.find(q=>q.id===id);if(!q||!Number.isInteger(v.dia)||v.dia<0||v.dia>dia||!Number.isInteger(v.paso)||v.paso<0||v.paso>q.pasos.length||typeof v.cerrado!=='boolean'||v.decision!==null&&v.decision!==0&&v.decision!==1||v.cerrado&&(v.paso!==q.pasos.length||v.decision===null)||!q.requiere.every(i=>t.expedientes[i]?.cerrado||completadas?.[i])||!v.estadisticas||typeof v.estadisticas!=='object'||Object.keys(v.estadisticas).length>500||Object.values(v.estadisticas).some(n=>!Number.isSafeInteger(n)||n<0))return false;
 }
 if(!t.cupos||typeof t.cupos!=='object'||Array.isArray(t.cupos)||Object.keys(t.cupos).length>72||!lista(t.observaciones,RECURSOS.flatMap(r=>r.recursos.filter(d=>d.clase==='fauna').map(d=>d.id))))return false;
 if(t.mantenimiento!==null&&(!t.mantenimiento||!RECURSOS.some(r=>r.id===t.mantenimiento!.region)||!Number.isInteger(t.mantenimiento.visitasRestantes)||t.mantenimiento.visitasRestantes<1||t.mantenimiento.visitasRestantes>8))return false;
 for(const [id,c]of Object.entries(t.cupos)){
  const r=RECURSOS.find(r=>r.recursos.some(d=>d.id===id)),d=r?.recursos.find(d=>d.id===id);if(!r||!d||d.clase==='fauna'||!Number.isInteger(c.ciclo)||c.ciclo<0||c.ciclo>Math.floor(dia/r.renovacion.dias_dormidos)||!Number.isInteger(c.cantidad)||c.cantidad<1||c.cantidad>(d.clase==='mineral'?6:d.clase==='madera'?8:1))return false;
 }
 return true;
}
