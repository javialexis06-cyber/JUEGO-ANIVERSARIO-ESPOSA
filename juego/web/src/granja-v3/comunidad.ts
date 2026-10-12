import {tiempoDia,tiempoRegion} from './clima';
import {crearReuniones,actuarReunion,dormirReuniones,reunionesValidas} from './reuniones';
import type {AccionReunion} from './reuniones-tipos';
import type {Accion,EstadoGranja,Resultado} from './estado';
import type {AccionComunidad,EstadoComunidad,HechoCuaderno} from './comunidad-tipos';
import {ARTEFACTOS_COMUNIDAD,PESQUERIAS_REGIONALES,OBRAS_COMUNIDAD,CUADERNOS_COMUNIDAD} from './comunidad-datos';
import {regionActual,puntoArchivo} from './astra';
import {TERRITORIOS_REGIONALES} from './regiones-datos';
import {PECES,type PezDef} from './catalogo';
import {obtenerObjeto} from './objetos';
import {calidadPila,cambiarCantidad,resumirCasillas,limitePila,type Pila,type Calidad} from './inventario';
import {puedeUsarArchivo} from './colecciones';
import {admiteEnvio,transferirEnvio} from './envios';
import {gruposProduccion} from './produccion';
export {ARTEFACTOS_COMUNIDAD,PESQUERIAS_REGIONALES,OBRAS_COMUNIDAD,CUADERNOS_COMUNIDAD};
export const crearComunidad=():EstadoComunidad=>({version:1,secuencia:0,reuniones:crearReuniones(),cuaderno:{},donaciones:[],vitrinas:Array(6).fill(null),colecciones:[],libros:[],obras:[],tesoros:[],ultimoTesoro:-1,trampas:[],terminales:[],bultos:[],exportadores:[],pedidos:{},pausaDia:-1,cargasRecogidas:0,eventos:[]});
const bien=(mensaje:string):Resultado=>({ok:true,mensaje}),mal=(mensaje:string):Resultado=>({ok:false,mensaje});
const lugar=(s:EstadoGranja)=>s.astra?.actual??s.zona;
const cerca=(p:{x:number;z:number},x:number,z:number)=>Number.isFinite(x)&&Number.isFinite(z)&&Math.hypot(p.x-x,p.z-z)<=3;
export const puntoPescaRegional=(_id:string)=>({x:-24,z:22});
export const obraAbierta=(s:EstadoGranja,id:string)=>!!s.comunidad?.obras.some(o=>o.id===id&&o.abierta);
function archivo(s:EstadoGranja,x:number,z:number){return s.astra?.actual?!s.astra.interior&&cerca(puntoArchivo(regionActual(s)),x,z):puedeUsarArchivo(s,x,z);}
export function pecesRegion(s:EstadoGranja):PezDef[]{const id=s.astra?.actual;return id?PECES.filter(p=>p.regiones?.includes(id)):PECES.filter(p=>!p.regiones&&p.zonas.includes(s.zona));}
export function puedePescarComunidad(s:EstadoGranja,x?:number,z?:number){
 if(s.interior||s.servicio||s.aventura.destinoActual||s.astra?.interior)return false;
 if(s.astra?.actual)return PESQUERIAS_REGIONALES.some(p=>p.region===s.astra!.actual)&&x!==undefined&&z!==undefined&&cerca(puntoPescaRegional(s.astra.actual),x,z);
 // API previa sin coordenadas conserva las partidas y los contratos antiguos. La interfaz siempre las envía.
 if(x===undefined&&z===undefined)return ['lago','bosque','mina','bosque_ancestral'].includes(s.zona);
 if(x===undefined||z===undefined||!Number.isFinite(x)||!Number.isFinite(z))return false;
 if(s.zona==='lago'){const d=(x-28)**2/15**2+(z-89)**2/12**2;return d>=.78&&d<=1.65;}
 return ['bosque','mina','bosque_ancestral'].includes(s.zona);
}
export function anotarHecho(s:EstadoGranja,id:string,hecho:HechoCuaderno,n=1){if(!s.comunidad||!obtenerObjeto(id)||!Number.isInteger(n)||n<1)return;const e=s.comunidad.cuaderno[id]??={};const r=e[hecho];e[hecho]={cantidad:Math.min(1e9,(r?.cantidad??0)+n),dia:r?.dia??s.jornada.diasCompletados};}
export function registrarComunidad(s:EstadoGranja,a:Accion,antes:EstadoGranja){
 for(const [id,n]of Object.entries(s.inventario)){const delta=n-(antes.inventario[id]??0);if(delta>0)anotarHecho(s,id,'obtener',delta);}
 if(a.tipo==='pescar')for(const p of PECES){const n=(s.estadisticas['pez_'+p.id]??0)-(antes.estadisticas['pez_'+p.id]??0);if(n>0)anotarHecho(s,p.id,'capturar',n);}
 if(a.tipo==='vender_pila'){const p=antes.casillasInventario[a.casilla];if(p)anotarHecho(s,p.articulo,'vender',Math.max(0,(antes.inventario[p.articulo]??0)-(s.inventario[p.articulo]??0)));}
 if(a.tipo==='dormir')for(const p of s.jornada.ultimaNoche?.envios?.lineas??[])anotarHecho(s,p.articulo,'vender',p.cantidad);
}
export const itemsMuseo=()=>new Set([...ARTEFACTOS_COMUNIDAD.map(a=>a[0]),...PECES.map(p=>p.id),...TERRITORIOS_REGIONALES.flatMap(r=>[r.id+'_mineral',r.id+'_madera',r.id+'_cosecha'])]);
export function coleccionesMuseo(){return [
 {id:'artefactos',nombre:'Objetos con una vida anterior',items:ARTEFACTOS_COMUNIDAD.map(a=>a[0]) as string[]},
 {id:'cuencas',nombre:'Ocho cuencas cuidadas',items:PESQUERIAS_REGIONALES.map(p=>p.id) as string[]},
 ...TERRITORIOS_REGIONALES.map(r=>({id:r.id,nombre:r.nombre,items:[r.id+'_mineral',r.id+'_madera',r.id+'_cosecha']})),
 ];}
export function libroDisponible(s:EstadoGranja,id:string){const v=s.comunidad!;if(id==='cuencas')return PESQUERIAS_REGIONALES.filter(p=>v.cuaderno[p.id]?.capturar).length>=3;if(id==='vitrinas')return ARTEFACTOS_COMUNIDAD.filter(a=>v.donaciones.some(d=>d.articulo===a[0])).length>=3;if(id==='carga')return v.cargasRecogidas>0;return false;}
/** Una oportunidad de recuperar contexto por jornada; se guarda la pieza antes de retirarla. */
export function hallarTesoro(s:EstadoGranja,azar:()=>number){const v=s.comunidad!;if(v.ultimoTesoro===s.jornada.diasCompletados||v.tesoros.length>=8)return false;if(azar()>=.12)return false;
 const encontrados=new Set([...v.tesoros.map(t=>t.articulo),...v.donaciones.map(d=>d.articulo),...Object.keys(v.cuaderno).filter(id=>v.cuaderno[id].identificar)]),faltantes=ARTEFACTOS_COMUNIDAD.filter(a=>!encontrados.has(a[0])),pool=faltantes.length?faltantes:ARTEFACTOS_COMUNIDAD;
 v.tesoros.push({articulo:pool[Math.min(pool.length-1,Math.floor(azar()*pool.length))][0],dia:s.jornada.diasCompletados});v.ultimoTesoro=s.jornada.diasCompletados;return true;
}
function pagar(s:EstadoGranja,coste:Record<string,number>){let next=s.casillasInventario;for(const [id,n]of Object.entries(coste)){const r=cambiarCantidad(next,id,-n);if(!r)return false;next=r;}s.casillasInventario=next;s.inventario=resumirCasillas(next);return true;}
function sacar(s:EstadoGranja,casilla:number,n=1):Pila|null{if(!Number.isInteger(casilla)||casilla<0||casilla>=s.casillasInventario.length)return null;const p=s.casillasInventario[casilla];if(!p||!Number.isInteger(n)||n<1||n>p.cantidad)return null;const tomado={articulo:p.articulo,cantidad:n,calidad:calidadPila(p)};p.cantidad-=n;if(!p.cantidad)s.casillasInventario[casilla]=null;s.inventario=resumirCasillas(s.casillasInventario);return tomado;}
export function actuarComunidad(s:EstadoGranja,a:AccionComunidad,x:number,z:number,c:{agregar:(id:string,n:number,calidad?:Calidad)=>void;azar:()=>number}):Resultado{
 const v=s.comunidad!,dia=s.jornada.diasCompletados,region=lugar(s);
 if(['reunion','aplazar_reunion','continuar_reunion','dejar_reunion','elegir_reunion'].includes(a.tipo))return actuarReunion(s,a as AccionReunion,x,z,c.agregar);
 if(v.reuniones.actual||s.astra?.escena||s.historia?.reto)return mal('Termina o deja la conversación antes de usar otro servicio comunitario.');
 if(a.tipo==='obra'||a.tipo==='abrir_obra'){
  const d=OBRAS_COMUNIDAD.find(o=>o.id===a.id);if(!d||d.region!==region||s.astra?.interior||s.interior||!cerca(d,x,z)||d.region==='pueblo'&&!archivo(s,x,z))return mal('Acércate al puesto de esa obra comunitaria.');
  if('permiso'in d&&!s.historia?.completadas[d.permiso])return mal('Acuerda primero el acceso a la estación en la campaña.');const r=v.obras.find(o=>o.id===a.id);
  if(a.tipo==='obra'){if(r)return mal('Esta obra ya tiene materiales reservados.');if(!pagar(s,d.materiales))return mal('Reúne los materiales de la obra.');v.obras.push({id:d.id,inicio:dia,lista:dia+d.noches,abierta:false});return bien('Materiales entregados. La comunidad trabaja durante '+d.noches+' noches dormidas.');}
  if(!r||r.abierta||dia<r.lista)return mal('La obra todavía no está lista o ya se abrió.');r.abierta=true;return bien(d.nombre+' abierto: '+d.efecto);
 }
 if(a.tipo==='pausa'){const d=OBRAS_COMUNIDAD.find(o=>o.id==='descanso')!;if(!obraAbierta(s,'descanso')||region!==d.region||!cerca(d,x,z)||s.enemigo||v.pausaDia===dia||s.energia>=100)return mal('El banco debe estar abierto y el sendero despejado. Una pausa útil por jornada.');if(!pagar(s,{pan:1}))return mal('Lleva un pan para compartir esta pausa.');s.energia=Math.min(100,s.energia+10);v.pausaDia=dia;return bien('Compartiste una pausa en el sendero. +10 de energía.');}
 if(a.tipo==='tesoro'){const t=v.tesoros[0];if(!t)return mal('Todavía no recuperaste un hallazgo con la caña.');c.agregar(t.articulo,1);anotarHecho(s,t.articulo,'identificar');v.tesoros.shift();return bien('Hallazgo recuperado: '+obtenerObjeto(t.articulo)!.nombre+'.');}
 if(a.tipo==='trampa'||a.tipo==='recoger_trampa'||a.tipo==='reparar_trampa'||a.tipo==='retirar_trampa'){
  const t='id'in a?v.trampas.find(t=>t.id===a.id):null;
  if(a.tipo==='trampa'){
   if(!['lombriz','pez_cebo','cebo_magico'].includes(a.cebo)||!puedePescarComunidad(s,x,z)||region==='lago'&&!obraAbierta(s,'muelle')||!PESQUERIAS_REGIONALES.some(p=>p.region===region)&&region!=='lago')return mal('Prepara la trampa en un puesto acuícola o junto al puesto restaurado del lago.');
   if(v.trampas.filter(t=>t.region===region).length>=2||v.trampas.length>=18||v.trampas.some(t=>t.region===region&&Math.hypot(t.x-x,t.z-z)<1))return mal('Hasta dos trampas separadas por puesto.');if(!pagar(s,{trampa_cebo:1,[a.cebo]:4}))return mal('Necesitas una trampa y cuatro cebos.');v.trampas.push({id:'trampa_'+(++v.secuencia),region,x,z,cebo:a.cebo,usos:4,ultimoDia:dia,salida:null});return bien('Trampa preparada para cuatro noches; la captura pendiente debe recogerse.');
  }
  if(!t||t.region!==region||s.astra?.interior||!cerca(t,x,z))return mal('Acércate a esa trampa.');
  if(a.tipo==='recoger_trampa'){if(!t.salida)return mal('No hay una captura pendiente.');c.agregar(t.salida.articulo,t.salida.cantidad,calidadPila(t.salida));anotarHecho(s,t.salida.articulo,'capturar',t.salida.cantidad);t.salida=null;return bien('Captura recogida. La trampa volverá a trabajar al dormir.');}
  if(a.tipo==='reparar_trampa'){if(t.usos||t.salida)return mal('Recoge la salida y agota los cuatro usos antes de reparar.');if(!pagar(s,{madera:4,fibra:2,[t.cebo]:4}))return mal('Prepara cuatro maderas, dos fibras y cuatro cebos.');t.usos=4;t.ultimoDia=dia;return bien('Trampa reparada con cuatro cebos.');}
  if(t.salida||t.usos)return mal('Recoge la captura y termina los cebos antes de retirar.');c.agregar('trampa_cebo',1);v.trampas=v.trampas.filter(i=>i.id!==t.id);return bien('Trampa retirada.');
 }
 if(a.tipo==='terminal'||a.tipo==='despachar'||a.tipo==='recoger_bulto'){
  if(!obraAbierta(s,'terminal')||!archivo(s,x,z)||!['pueblo',...TERRITORIOS_REGIONALES.map(r=>r.id)].includes(region))return mal('Abre la terminal de Celia y acércate al archivo de esta región.');
  if(a.tipo==='terminal'){if(v.terminales.includes(region)||v.terminales.length>=(v.libros.includes('carga')?5:4))return mal('Máximo cuatro terminales acordadas.');if(!pagar(s,{terminal_carga:1}))return mal('Fabrica una terminal de carga.');v.terminales.push(region);return bien('Terminal local instalada. Recibe bultos que debes retirar en persona.');}
  if(!v.terminales.includes(region))return mal('Instala primero una terminal local.');
  if(a.tipo==='despachar'){if(!v.terminales.includes(a.hasta)||a.hasta===region||v.bultos.length>=6||!Number.isInteger(a.cantidad)||a.cantidad<1||a.cantidad>24)return mal('Elige otra terminal instalada. Seis bultos pendientes como máximo; 24 unidades por bulto.');const p=s.casillasInventario[a.casilla];if(!p||!admiteEnvio(p)||p.articulo==='bateria'||p.cantidad<a.cantidad)return mal('Selecciona productos o materiales transportables de una casilla.');if(!pagar(s,{bateria:1}))return mal('Cada despacho consume una batería.');const pila=sacar(s,a.casilla,a.cantidad);if(!pila)return mal('La casilla de origen cambió.');v.bultos.push({id:'bulto_'+(++v.secuencia),desde:region,hasta:a.hasta,pila,envioDia:dia,disponibleDia:dia+1});return bien('Carga reservada: llegará después de dormir.');}
  const b=v.bultos.find(b=>b.id===a.id);if(!b||b.hasta!==region||b.disponibleDia>dia)return mal('Esta carga todavía no llegó a la terminal actual.');c.agregar(b.pila.articulo,b.pila.cantidad,calidadPila(b.pila));v.bultos=v.bultos.filter(i=>i.id!==b.id);v.cargasRecogidas++;return bien('Bulto recogido, con su cantidad y calidad originales.');
 }
 if(a.tipo==='exportador'){
  const co=s.produccion.cofres.find(c=>c.id===a.cofre),ed=s.edificios.find(e=>e.id===a.caja&&e.articulo==='caja_envio');if(region!=='granja'||s.interior||!co||!ed||!cerca(co,x,z)||co.zona!=='granja')return mal('Coloca el cofre cerca de una caja de envío y acércate al cofre.');
  const actual=v.exportadores.find(e=>e.cofre===co.id);if(a.articulo===null){v.exportadores=v.exportadores.filter(e=>e!==actual);return bien('Venta automática detenida.');}
  if(Math.hypot(co.x-ed.x,co.z-ed.z)>3)return mal('Acerca la caja al cofre para autorizar nuevos envíos.');const d=obtenerObjeto(a.articulo);if(!d||!admiteEnvio({articulo:d.id,cantidad:1})||!Number.isInteger(a.cantidad)||a.cantidad<1||a.cantidad>24)return mal('Selecciona un producto vendible y un límite de una a 24 unidades por noche.');
  if(!actual){if(v.exportadores.length>=8||!pagar(s,{exportador_envios:1}))return mal('Fabrica un exportador; hasta ocho activos.');v.exportadores.push({cofre:co.id,caja:ed.id,articulo:d.id,cantidad:a.cantidad});}else {actual.articulo=d.id;actual.cantidad=a.cantidad;}
  return bien('Exportación nocturna autorizada solo para '+d.nombre+'. Cambiar el filtro no vende ahora.');
 }
 if(a.tipo==='pedido'){
  const r=TERRITORIOS_REGIONALES.find(r=>r.id===region);if(!r||!archivo(s,x,z))return mal('Consulta el pedido en el archivo de un territorio.');const semana=Math.floor(dia/7);if(v.pedidos[region]===semana)return mal('Ya cumpliste el pedido de esta semana.');if(!pagar(s,{[region+'_mineral']:1,[region+'_cosecha']:1}))return mal('El pedido reserva un mineral y una cosecha locales.');c.agregar(r.producto,1);v.pedidos[region]=semana;return bien('Pedido local entregado. Una pieza útil de mantenimiento; vuelve la próxima semana.');
 }
 if(a.tipo==='evento'){
  const e=v.eventos.find(e=>e.id===a.id);if(!e||e.region!==region||e.estado==='visto'||!archivo(s,x,z))return mal('Acércate al archivo de ese encuentro público.');
  if(a.opcion==='aplazar'){e.estado='aplazado';return bien('El encuentro queda pendiente; puedes recuperarlo en el archivo.');}
  if(a.opcion!=='participar')return mal('Respuesta inválida.');if(!pagar(s,{[region+'_madera']:1,fibra:1}))return mal('La mesa de reparaciones necesita una madera local y una fibra.');c.agregar('cuerda',1);e.estado='visto';return bien('La mesa pública reparó una cuerda contigo. El encuentro queda en el cuaderno.');
 }
 if(!archivo(s,x,z))return mal('Acércate al archivo; el museo comparte su espacio público.');
 if(a.tipo==='identificar'){
  const p=s.casillasInventario[a.casilla];if(!p||!['geoda','geoda_helada','geoda_magma','geoda_omni'].includes(p.articulo)||s.monedas<20)return mal('Selecciona una geoda y reserva 20 monedas para identificar su contexto.');
  const faltantes=ARTEFACTOS_COMUNIDAD.filter(d=>!v.cuaderno[d[0]]?.identificar),pool=faltantes.length?faltantes:ARTEFACTOS_COMUNIDAD,despues=cambiarCantidad(s.casillasInventario,p.articulo,-1);if(!despues||pool.some(d=>!cambiarCantidad(despues,d[0],1)))return mal('Reserva espacio para el artefacto antes de identificar.');const id=pool[Math.min(pool.length-1,Math.floor(c.azar()*pool.length))][0];if(!sacar(s,a.casilla))return mal('Casilla inválida.');s.monedas-=20;c.agregar(id,1);anotarHecho(s,id,'identificar');return bien('Identificado: '+obtenerObjeto(id)!.nombre+'. Se conserva el contexto en el cuaderno.');
 }
 if(a.tipo==='leer'){const d=CUADERNOS_COMUNIDAD.find(d=>d.id===a.id);if(!d||!libroDisponible(s,d.id))return mal('Primero reúne la experiencia de este cuaderno.');if(!v.libros.includes(d.id))v.libros.push(d.id);return bien(d.titulo+' · '+d.texto);}
 if(!obraAbierta(s,'galeria'))return mal('Abre primero la galería comunitaria.');
 if(a.tipo==='donar'){const p=s.casillasInventario[a.casilla];if(!p||!itemsMuseo().has(p.articulo)||v.donaciones.some(d=>d.articulo===p.articulo))return mal('Selecciona una pieza de la colección que todavía no hayas donado.');const t=sacar(s,a.casilla)!;v.donaciones.push({articulo:t.articulo,calidad:calidadPila(t),dia});anotarHecho(s,t.articulo,'donar');return bien('Una unidad donada con su calidad. El resto de la pila permanece en tu mochila.');}
 if(a.tipo==='vitrina'){if(!Number.isInteger(a.indice)||a.indice<0||a.indice>=6||a.articulo!==null&&!v.donaciones.some(d=>d.articulo===a.articulo))return mal('Elige una de las seis vitrinas y una pieza donada.');v.vitrinas[a.indice]=a.articulo;return bien('Exposición actualizada. No entrega objetos ni vuelve a pagar.');}
 if(a.tipo==='coleccion'){const d=coleccionesMuseo().find(d=>d.id===a.id);if(!d||v.colecciones.includes(d.id)||!d.items.every(id=>v.donaciones.some(r=>r.articulo===id)))return mal('Dona todas las piezas de esta colección antes de registrar su cierre único.');v.colecciones.push(d.id);return bien('Colección documentada: '+d.nombre+'. Su reconocimiento permanece; las piezas siguen donadas.');}
 return mal('Actividad comunitaria desconocida.');
}
/** Solo dentro de una noche real del motor: ni cargar ni avanzar el reloj ejecutan estas operaciones. */
export function dormirComunidad(s:EstadoGranja,azar:()=>number){const v=s.comunidad!,dia=s.jornada.diasCompletados;
 dormirReuniones(s);
 for(const t of v.trampas){if(t.usos<=0||t.salida||t.ultimoDia>=dia)continue;t.ultimoDia=dia;t.usos--;
  const regional=PECES.filter(p=>p.regiones?.includes(t.region)),pool=regional.length?regional:PECES.filter(p=>!p.regiones&&p.zonas.includes('lago'));
  const tiempo=tiempoRegion(tiempoDia(s.tiempo,dia),'templado');const estacion=(['primavera','verano','otono','invierno'] as const)[Math.floor(dia/28)%4],disponibles=pool.filter(p=>p.cebo===t.cebo&&p.estaciones.includes(estacion)&&(!p.tiempos||p.tiempos.includes(tiempo))&&(p.desde<p.hasta?6>=p.desde&&6<p.hasta:6>=p.desde||6<p.hasta));
  if(!disponibles.length||azar()>=.5)continue;const pesos=disponibles.map(p=>1/p.rareza**2);let n=azar()*pesos.reduce((a,b)=>a+b,0),i=0;while(i<pesos.length-1&&n>=pesos[i])n-=pesos[i++];t.salida={articulo:disponibles[i].id,cantidad:1,calidad:0};
 }
 if(dia%7===0){if(v.eventos.length>=32){const viejo=v.eventos.findIndex(e=>e.estado==='visto');if(viejo>=0)v.eventos.splice(viejo,1);}const visitadas=TERRITORIOS_REGIONALES.filter(r=>s.astra?.visitas.includes(r.id));if(visitadas.length&&v.eventos.length<32){const r=visitadas[Math.floor(dia/7)%visitadas.length],id='mesa_'+dia+'_'+r.id;if(!v.eventos.some(e=>e.id===id))v.eventos.push({id,region:r.id,desde:dia,hasta:dia+6,estado:'pendiente',prioridad:1});}}
 for(const e of v.eventos)if(e.estado==='pendiente'&&dia>e.hasta)e.estado='aplazado';
}
/** La noche transfiere SOLO el filtro autorizado. El resumen de envío es quien vende una vez. */
export function prepararExportaciones(s:EstadoGranja){const v=s.comunidad!;for(const e of v.exportadores){const co=s.produccion.cofres.find(c=>c.id===e.cofre),ed=s.edificios.find(d=>d.id===e.caja),ca=s.envios.cajas.find(c=>c.edificioId===e.caja);if(!co||!ed||!ca||co.zona!=='granja'||Math.hypot(co.x-ed.x,co.z-ed.z)>3)continue;
  // La cadena de máquinas continúa siendo local; nunca se fusionan cofres remotos.
  if(!gruposProduccion(s.produccion).some(g=>g.cofres.includes(co.id)))continue;
  let restante=e.cantidad;for(let i=0;i<co.casillas.length&&restante>0;i++){const p=co.casillas[i];if(!p||p.articulo!==e.articulo)continue;const n=Math.min(p.cantidad,restante),r=transferirEnvio(ca,co.casillas,'depositar',i,n);if(!r.ok)continue;co.casillas=r.mochila;ca.casillas=r.casillas;restante-=n;}
 }}
const entero=(n:unknown,min=0,max=1e9)=>typeof n==='number'&&Number.isInteger(n)&&n>=min&&n<=max;
const registro=(r:unknown):r is Record<string,any>=>!!r&&typeof r==='object'&&!Array.isArray(r);
export function comunidadValida(s:EstadoGranja):boolean{const v=s.comunidad,dia=s.jornada?.diasCompletados;if(!v||v.version!==1||!reunionesValidas(s)||!entero(v.secuencia)||!registro(v.cuaderno)||Object.keys(v.cuaderno).length>2500||!entero(v.ultimoTesoro,-1,dia)||!entero(v.pausaDia,-1,dia)||!entero(v.cargasRecogidas))return false;
 const unicos=(a:unknown[],key:(r:any)=>string)=>new Set(a.map(key)).size===a.length;
 const regiones=['pueblo',...TERRITORIOS_REGIONALES.map(r=>r.id)],items=itemsMuseo(),pila=(p:any)=>registro(p)&&!!obtenerObjeto(p.articulo)&&entero(p.cantidad,1,limitePila(p.articulo))&&(p.calidad===undefined||entero(p.calidad,0,3));
 if(!Object.entries(v.cuaderno).every(([id,e])=>!!obtenerObjeto(id)&&registro(e)&&Object.entries(e).every(([k,r])=>['obtener','capturar','fabricar','vender','donar','identificar'].includes(k)&&registro(r)&&entero(r.cantidad,1)&&entero(r.dia,0,dia))))return false;
 if(!Array.isArray(v.donaciones)||v.donaciones.length>items.size||!unicos(v.donaciones,r=>r?.articulo)||!v.donaciones.every(d=>!!d&&items.has(d.articulo)&&entero(d.calidad,0,3)&&entero(d.dia,0,dia)&&!!v.cuaderno[d.articulo]?.donar)||!Array.isArray(v.vitrinas)||v.vitrinas.length!==6||!v.vitrinas.every(id=>id===null||v.donaciones.some(d=>d.articulo===id)))return false;
 if(!Array.isArray(v.colecciones)||!unicos(v.colecciones,r=>r)||!v.colecciones.every(id=>coleccionesMuseo().some(c=>c.id===id&&c.items.every(i=>v.donaciones.some(d=>d.articulo===i))))||!Array.isArray(v.libros)||v.libros.length>3||!unicos(v.libros,r=>r)||!v.libros.every(id=>libroDisponible(s,id)))return false;
 if(!Array.isArray(v.obras)||v.obras.length>4||!unicos(v.obras,r=>r?.id)||!v.obras.every(o=>!!o&&OBRAS_COMUNIDAD.some(d=>d.id===o.id&&o.lista===o.inicio+d.noches&&(!('permiso'in d)||!!s.historia?.completadas[d.permiso]))&&entero(o.inicio,0,dia)&&typeof o.abierta==='boolean'&&(!o.abierta||o.lista<=dia)))return false;
 if(v.donaciones.length&&!obraAbierta(s,'galeria'))return false;
 if(!Array.isArray(v.tesoros)||v.tesoros.length>8||!v.tesoros.every(t=>!!t&&ARTEFACTOS_COMUNIDAD.some(a=>a[0]===t.articulo)&&entero(t.dia,0,dia)))return false;
 if(!Array.isArray(v.trampas)||v.trampas.length>18||!unicos(v.trampas,t=>t?.id)||!v.trampas.every(t=>!!t&&/^trampa_\d+$/.test(t.id)&&Number(t.id.slice(7))<=v.secuencia&&(t.region==='lago'||PESQUERIAS_REGIONALES.some(p=>p.region===t.region))&&Number.isFinite(t.x)&&Number.isFinite(t.z)&&Math.abs(t.x)<1000&&Math.abs(t.z)<1000&&['lombriz','pez_cebo','cebo_magico'].includes(t.cebo)&&entero(t.usos,0,4)&&entero(t.ultimoDia,0,dia)&&(t.salida===null||pila(t.salida)&&t.salida.cantidad===1&&PECES.some(p=>p.id===t.salida!.articulo&&p.cebo===t.cebo&&(t.region==='lago'?!p.regiones&&p.zonas.includes('lago'):p.regiones?.includes(t.region)))))||v.trampas.some(t=>v.trampas.filter(r=>r.region===t.region).length>2)||v.trampas.some(t=>t.region==='lago')&&!obraAbierta(s,'muelle'))return false;
 if(!Array.isArray(v.terminales)||v.terminales.length>(v.libros.includes('carga')?5:4)||!unicos(v.terminales,r=>r)||!v.terminales.every(id=>regiones.includes(id))||v.terminales.length&&!obraAbierta(s,'terminal')||!Array.isArray(v.bultos)||v.bultos.length>6||!unicos(v.bultos,b=>b?.id)||!v.bultos.every(b=>!!b&&/^bulto_\d+$/.test(b.id)&&Number(b.id.slice(6))<=v.secuencia&&v.terminales.includes(b.desde)&&v.terminales.includes(b.hasta)&&b.desde!==b.hasta&&pila(b.pila)&&b.pila.cantidad<=24&&b.pila.articulo!=='bateria'&&admiteEnvio(b.pila)&&entero(b.envioDia,0,dia)&&b.disponibleDia===b.envioDia+1))return false;
 if(!Array.isArray(v.exportadores)||v.exportadores.length>8||!unicos(v.exportadores,e=>e?.cofre)||!v.exportadores.every(e=>!!e&&typeof e.cofre==='string'&&typeof e.caja==='string'&&s.produccion.cofres.some(c=>c.id===e.cofre)&&s.envios.cajas.some(c=>c.edificioId===e.caja)&&!!obtenerObjeto(e.articulo)&&admiteEnvio({articulo:e.articulo,cantidad:1})&&entero(e.cantidad,1,24)))return false;
 if(!registro(v.pedidos)||Object.keys(v.pedidos).length>24||!Object.entries(v.pedidos).every(([id,n])=>TERRITORIOS_REGIONALES.some(r=>r.id===id)&&entero(n,0,Math.floor(dia/7))))return false;
 return Array.isArray(v.eventos)&&v.eventos.length<=32&&unicos(v.eventos,e=>e?.id)&&v.eventos.every(e=>!!e&&e.id==='mesa_'+e.desde+'_'+e.region&&TERRITORIOS_REGIONALES.some(r=>r.id===e.region)&&entero(e.desde,0,dia)&&e.desde%7===0&&e.hasta===e.desde+6&&['pendiente','aplazado','visto'].includes(e.estado)&&e.prioridad===1);
}
