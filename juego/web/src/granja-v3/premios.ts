import {MISIONES_HISTORIA} from './historia-datos';
/** Premios sin moneda ni multiplicadores globales; sus acciones pasan por el motor. */
import type {EstadoGranja,Resultado} from './estado';
import type {EstadoHistoria} from './historia-tipos';
import type {AccionPremio,UtilidadesHistoria,ModuloPremio} from './premios-tipos';
import {PREMIOS_NARRATIVOS} from './premios-datos';
import {regionActual,regionAstra,npcAstra,libreRegionAstra} from './astra';
import {ARTICULOS,CULTIVOS,PECES} from './catalogo';
import {estadoAnimal} from './cuidados';
import {obtenerObjeto,obtenerReceta} from './objetos';
import {cambiarCantidad,calidadPila,articuloValido,limitePila,type Calidad} from './inventario';
import {tiempoDia} from './clima';
import {fechaValle} from './jornada';
export {PREMIOS_NARRATIVOS};
export const premioDef=(id:string)=>PREMIOS_NARRATIVOS.find(r=>r.id===id||r.mision===id);
export const crearUtilidades=():UtilidadesHistoria=>({version:1,agenda:[],exhibidos:[],tecnica:null,modulos:[],inscripciones:{},seleccion:null,estilos:{}});
export function entregarPremio(h:EstadoHistoria,id:string){const r=premioDef(id);if(r&&h.completadas[r.mision]&&!h.premios.includes(r.id))h.premios.push(r.id);}
export function migrarUtilidades(h:EstadoHistoria){if(h.utilidades===undefined)h.utilidades=crearUtilidades();if(Array.isArray(h.premios)&&h.completadas&&typeof h.completadas==='object')for(const id of Object.keys(h.completadas))entregarPremio(h,id);}
export const poseePremio=(s:EstadoGranja,id:string)=>{const r=premioDef(id);return !!r&&!!s.historia?.completadas[r.mision]&&s.historia.premios.includes(r.id);};
const bien=(mensaje:string,extra:Partial<Resultado>={}):Resultado=>({ok:true,mensaje,...extra}),mal=(mensaje:string):Resultado=>({ok:false,mensaje});
const casillasValidas=(v:unknown,cap:number)=>Array.isArray(v)&&v.length===cap&&v.every(p=>p===null||p&&typeof p==='object'&&articuloValido(p.articulo)&&Number.isInteger(p.cantidad)&&p.cantidad>0&&p.cantidad<=limitePila(p.articulo)&&(p.calidad===undefined||[0,1,2,3].includes(p.calidad)));
const cerca=(x:number,z:number,p:{x:number;z:number},radio=3)=>Number.isFinite(x)&&Number.isFinite(z)&&Math.hypot(x-p.x,z-p.z)<=radio;
export function factorTecnica(s:EstadoGranja){const r=premioDef(s.historia?.utilidades?.tecnica??'');return r?.tecnica&&poseePremio(s,r.id)?r.tecnica:null;}
export function entradaModulo(s:EstadoGranja,id:string){return s.historia?.utilidades?.modulos.find(m=>m.edificioId===id&&premioDef(m.premio)?.plano?.tipo==='acceso');}
function disponibleModulo(s:EstadoGranja,m:ModuloPremio,x:number,z:number){return regionActual(s)===m.region&&!s.servicio&&!s.interior&&!s.astra?.interior&&cerca(x,z,m);}
function privado(s:EstadoGranja,id:string){const r=premioDef(id)!;return (r.mision.startsWith('S')||r.mision==='T08')&&s.historia!.completadas[r.mision].opcion===1;}
/** Los datos actuales son los de la partida: no se muestran minerales, peces o destinos desconocidos. */
export function consultaPremio(s:EstadoGranja,id:string):{titulo:string;lineas:string[]}|null {
 const r=premioDef(id);if(!r||!poseePremio(s,r.id))return null;const h=s.historia!,c=h.completadas[r.mision],q=MISIONES_HISTORIA.find(q=>q.id===r.mision),nombreRecibo=(id:string)=>q?.pasos.find(p=>p.id===id)?.texto??'Trabajo confirmado',lineas=[r.efecto_diseno,'Cierre: jornada '+(c.dia+1)+'; elección '+(c.opcion+1)+'.'];
 if(privado(s,r.id))return {titulo:r.nombre,lineas:[...lineas,'El relato se reservó: se conservan recibos sin identificar a sus participantes.',...c.recibos.map(id=>'Trabajo confirmado: '+nombreRecibo(id))]};
 if(r.ambito==='animales')for(const a of s.animales){const e=estadoAnimal(a.cuidado,s.ultimoTiempo);lineas.push(a.nombre+': '+e.estado.replaceAll('_',' ')+' · alimento en '+Math.max(0,Math.ceil((a.cuidado.lastFedAt+48*3600000-s.ultimoTiempo)/3600000))+' h · hogar '+a.edificioId+'.');}
 else if(r.ambito==='cultivos'){for(const p of s.parcelas.filter(p=>p.cultivo))lineas.push((CULTIVOS.find(c=>c.id===p.cultivo)?.nombre??p.cultivo)+': '+p.x+', '+p.z+' · '+p.cuidado?.status+' · riego de jornada '+((p.campo?.riegoDia??-1)+1)+'.');for(const [id,p]of Object.entries(c.evidencia?.cultivos??{}))lineas.push('Ensayo '+id+': '+(CULTIVOS.find(c=>c.id===p.cultivo)?.nombre??p.cultivo)+' · riego '+p.regado+' · cosecha '+p.cosechado+'.');}
 else if(r.ambito==='pesca')for(const p of PECES.filter(p=>(s.estadisticas['pez_'+p.id]??0)>0))lineas.push(p.nombre+': '+p.desde+'–'+p.hasta+' h · '+p.estaciones.join(', ')+' · '+(s.estadisticas['pez_'+p.id]??0)+' capturas registradas.');
 else if(r.ambito==='fabricacion')for(const m of s.produccion.maquinas)lineas.push((obtenerObjeto(m.articulo)?.nombre??m.articulo)+': '+m.cola.reduce((n,q)=>n+q.cantidad,0)+' lotes reservados · '+(m.proceso?'proceso hasta '+Math.max(0,Math.ceil((m.proceso.terminaEn-s.ultimoTiempo)/1000))+' s':'sin proceso')+'.');
 else if(r.ambito==='rutas')for(const id of s.astra?.visitas??[])lineas.push((regionAstra(id)?.nombre??id)+': destino visitado; sus permisos y el regreso conservan su validación.');
 else {lineas.push(...c.recibos.map(id=>'Trabajo confirmado: '+nombreRecibo(id)));if(c.evidencia)for(const [id,permiso]of Object.entries(c.evidencia.permisos))lineas.push('Permiso de '+(npcAstra(id.split(':').pop()!)?.nombre??'participante')+': '+permiso+'.');}
 if(c.evidencia)for(const paso of q?.pasos??[])for(let i=0;i<(paso.datos?.length??0);i++)if(c.evidencia.observados.includes(paso.id+':'+i))lineas.push('Fuente consultada: '+paso.datos![i]);
 if(r.familia==='acceso')lineas.push('Consulta y visita del acuerdo disponibles. No sustituyen horario, proximidad, permiso ni equipo.');
 return {titulo:r.nombre,lineas};
}
export function actuarPremio(s:EstadoGranja,a:AccionPremio,x:number,z:number,ctx:{agregar:(id:string,n:number,calidad?:Calidad)=>void;libre:(x:number,z:number)=>boolean}):Resultado {
 const h=s.historia!,u=h.utilidades!,r=premioDef(a.id);
 if(!Number.isFinite(x)||!Number.isFinite(z))return mal('Posición inválida.');
 if(s.astra?.escena||h.reto)return mal('Termina o deja la escena o prueba antes de usar el premio.');
 if(a.tipo==='consultar'){if(!r||!poseePremio(s,r.id))return mal('Este premio todavía no está obtenido.');u.seleccion=r.id;return bien('Consulta abierta; no entrega recursos ni experiencia.');}
 if(['fijar','quitar_agenda','revisar_agenda','exhibir','guardar_trofeo','tecnica','retirar_inscripcion','autorizar_inscripcion','instalar','estilo'].includes(a.tipo)){
  if(!r||!poseePremio(s,r.id))return mal('Completa su historia para obtener este premio.');
  if(a.tipo==='fijar'){
   if(r.familia!=='agenda'||!Number.isInteger(a.dia)||a.dia<s.jornada.diasCompletados||a.dia>s.jornada.diasCompletados+112)return mal('Elige una jornada agrícola válida durante el próximo año.');
   const previo=u.agenda.find(p=>p.premio===r.id);if(!previo&&u.agenda.length>=3)return mal('Hay tres planes fijados. Quita uno antes de fijar otro.');
   if(previo){previo.dia=a.dia;previo.revisada=false;}else u.agenda.push({premio:r.id,dia:a.dia,revisada:false});return bien('Plan fijado sin ejecutar trabajo ni adelantar el reloj.');
  }
  if(a.tipo==='quitar_agenda'){u.agenda=u.agenda.filter(p=>p.premio!==r.id);return bien('Plan retirado de la agenda.');}
  if(a.tipo==='revisar_agenda'){const p=u.agenda.find(p=>p.premio===r.id);if(!p)return mal('Ese plan no está fijado.');p.revisada=!p.revisada;return bien('Revisión anotada; no completa otra misión.');}
  if(a.tipo==='exhibir'){if(r.familia!=='trofeo')return mal('Escoge un recuerdo exhibible.');if(u.exhibidos.includes(r.id))return mal('Este recuerdo ya está exhibido.');if(u.exhibidos.length>=6)return mal('Los seis espacios están ocupados. Guarda otro recuerdo.');u.exhibidos.push(r.id);return bien('Recuerdo exhibido sin venderlo ni repetir su premio.');}
  if(a.tipo==='guardar_trofeo'){u.exhibidos=u.exhibidos.filter(id=>id!==r.id);return bien('Recuerdo guardado en tu álbum.');}
  if(a.tipo==='tecnica'){if(!r.tecnica)return mal('Esta recompensa no cambia una técnica.');u.tecnica=u.tecnica===r.id?null:r.id;return bien('Una sola técnica activa; afecta únicamente recetas compatibles nuevas.');}
  if(a.tipo==='retirar_inscripcion'){u.inscripciones[r.id]=false;return bien('Inscripción retirada; el recuerdo y su utilidad se conservan.');}
  if(a.tipo==='autorizar_inscripcion'){if(privado(s,r.id))return mal('Este cierre conserva la privacidad; usa la versión sin nombres.');u.inscripciones[r.id]=true;return bien('Inscripción autorizada en tu exposición local.');}
  if(a.tipo==='estilo'){const receta=r.plano?.tipo==='receta'?obtenerReceta(r.plano.base):null,eq=(s.equipo as Record<string,string|null>)[a.ranura];if(!receta||!['arma','casco','pechera','botas'].includes(a.ranura)||receta.salida.articulo!==eq)return mal('Equipa la pieza base del patrón antes de escoger su variante.');u.estilos[a.ranura]=r.id;return bien('Patrón elegido; conserva el equipo, su calidad y sus estadísticas.');}
  if(a.tipo==='instalar'){
   const d=r.plano;if(!d||d.tipo==='receta')return mal('Esta variante se fabrica en la estación de su receta base.');if(u.modulos.some(m=>m.premio===r.id))return mal('Ya hay una instalación de este plano. Retírala para recolocarla.');
   if(s.interior||s.servicio||s.astra?.interior||!cerca(x,z,{x:a.x,z:a.z},5)||!Number.isInteger(a.x)||!Number.isInteger(a.z))return mal('Escoge un punto próximo en el exterior.');
   if(!ctx.libre(a.x,a.z)||u.modulos.some(m=>m.region===regionActual(s)&&m.x===a.x&&m.z===a.z))return mal('Ese punto está ocupado o fuera de la zona autorizada.');const region=regionActual(s);
   if(region!=='granja'&&region!==r.region&&!(d.tipo==='trampa'&&region==='lago'))return mal('Instala el plano en tu granja o en el territorio que lo autorizó.');
   let edificioId:string|null=null;if(d.tipo==='acceso'){
    const b=region==='granja'?s.edificios.find(b=>b.id===a.edificioId):regionAstra(region)?.viviendas.find(b=>b.id===a.edificioId);
    if(!b)return mal('Selecciona una entrada existente en esta región.');if('ocupantes'in b&&!b.ocupantes.some(id=>r.titulares.includes(id)))return mal('Este acuerdo no autoriza modificar la vivienda de otra familia.');
    if('articulo'in b&&!['casa','refugio'].includes(ARTICULOS.find(d=>d.id===b.articulo)?.categoria??'')&&b.articulo!=='invernadero')return mal('Este soporte no tiene un interior habitable.');
    const def='articulo'in b?ARTICULOS.find(d=>d.id===b.articulo)!:b,ancho=def.ancho,fondo=def.fondo;
    if(Math.hypot(a.x-(b.x+ancho/2),a.z-(b.z+fondo/2))>Math.hypot(ancho,fondo)/2+2)return mal('Coloca el módulo junto a la huella de su entrada.');
    if(u.modulos.some(m=>m.edificioId===b.id))return mal('Ese edificio ya tiene un módulo de acceso.');edificioId=b.id;
   }
   if(d.tipo==='trampa'&&(region!=='lago'||Math.hypot((a.x-28)/15,(a.z-89)/12)<1||Math.hypot((a.x-28)/15,(a.z-89)/12)>1.4))return mal('Coloca esta trampa en la orilla accesible del lago de Celia.');
   if(!Object.entries(d.materiales).every(([id,n])=>(s.inventario[id]??0)>=n))return mal('Faltan los materiales del plano.');for(const [id,n]of Object.entries(d.materiales))ctx.agregar(id,-n);
   u.modulos.push({id:'M_'+r.id,premio:r.id,region,x:a.x,z:a.z,edificioId,casillas:Array(d.tipo==='trampa'?1:d.capacidad??0).fill(null),usos:d.tipo==='trampa'?4:0,ultimoDia:s.jornada.diasCompletados,cebo:0,especie:null});return bien('Instalación construida con materiales reales; conserva huella y capacidad publicadas.');
  }
 }
 const m=u.modulos.find(m=>m.id===a.id),d=m&&premioDef(m.premio)?.plano;if(!m||!d)return mal('Instalación desconocida.');
 if(a.tipo==='usar_acceso'&&m.edificioId){
  const existe=m.region==='granja'?s.edificios.some(b=>b.id===m.edificioId):regionAstra(m.region)?.viviendas.some(b=>b.id===m.edificioId);if(!existe)return mal('El soporte fue retirado; recupera el módulo desde su lugar.');
  const dentro=s.interior===m.edificioId||s.astra?.interior===m.edificioId;
  if(dentro){if(!cerca(x,z,{x:0,z:3},3))return mal('Acércate al acceso común del interior.');s.interior=null;if(s.astra?.actual){s.astra.interior=null;s.astra.posicion={x:m.x,z:m.z};}return bien('Regreso por el acceso reparable.',{posicionZona:{x:m.x,z:m.z}});}
  if(!disponibleModulo(s,m,x,z))return mal('Acércate al módulo de la entrada.');if(s.astra?.actual){if(s.jornada.minutos<480||s.jornada.minutos>=1260)return mal('Conserva el horario de visitas de 08:00 a 21:00.');s.astra.interior=m.edificioId;s.astra.posicion={x:0,z:3};}else{s.posicionExterior={zona:s.zona,x:m.x,z:m.z};s.interior=m.edificioId;}
  return bien('Entrada por el módulo; no cambia el tamaño de la vivienda.',{posicionZona:{x:0,z:3}});
 }
 if(!disponibleModulo(s,m,x,z))return mal('Acércate a la instalación en su región.');
 if(a.tipo==='retirar_modulo'){
  for(const p of m.casillas)if(p)ctx.agregar(p.articulo,p.cantidad,calidadPila(p));if(d.tipo==='trampa'&&m.cebo)ctx.agregar('lombriz',m.cebo);
  for(const [id,n]of Object.entries(d.materiales))if(Math.floor(n/2)>0)ctx.agregar(id,Math.floor(n/2));u.modulos=u.modulos.filter(q=>q!==m);return bien('Contenido recuperado y mitad de materiales estructurales; no duplica inversión.');
 }
 if(a.tipo==='guardar_modulo'||a.tipo==='sacar_modulo'){
  if(d.tipo!=='cofre'||!Number.isInteger(a.casilla)||!Number.isInteger(a.cantidad)||a.cantidad<1)return mal('Escoge una casilla y cantidad válidas del depósito.');
  const p=a.tipo==='guardar_modulo'?s.casillasInventario[a.casilla]:m.casillas[a.casilla];if(!p||p.cantidad<a.cantidad)return mal('La pila no contiene esa cantidad.');
  if(a.tipo==='guardar_modulo'){const siguientes=cambiarCantidad(m.casillas,p.articulo,a.cantidad,calidadPila(p));if(!siguientes)return mal('El compartimiento está lleno.');ctx.agregar(p.articulo,-a.cantidad,calidadPila(p));m.casillas=siguientes;}else{ctx.agregar(p.articulo,a.cantidad,calidadPila(p));m.casillas=cambiarCantidad(m.casillas,p.articulo,-a.cantidad,calidadPila(p))!;}
  return bien('Transferencia guardada con calidad y cantidad conservadas.');
 }
 if(d.tipo!=='trampa')return mal('Acción incompatible con este módulo.');
 if(a.tipo==='cebar_trampa'){if(!Number.isInteger(a.cantidad)||a.cantidad<1||m.cebo+a.cantidad>4||(s.inventario.lombriz??0)<a.cantidad)return mal('Carga hasta cuatro cebos reales.');ctx.agregar('lombriz',-a.cantidad);m.cebo+=a.cantidad;return bien('Cebo reservado; el intento ocurre al dormir una jornada.');}
 if(a.tipo==='seleccion_trampa'){if(a.especie!==null&&!(s.estadisticas['pez_'+a.especie]>0&&PECES.some(p=>p.id===a.especie)))return mal('La selección solo admite una especie ya capturada.');m.especie=a.especie;return bien('Selección configurada: rechaza otras capturas sin aumentar rareza.');}
 if(a.tipo==='reparar_trampa'){if(m.usos>=4)return mal('La trampa está lista.');if((s.inventario.madera??0)<4||(s.inventario.fibra??0)<2)return mal('La reparación requiere cuatro maderas y dos fibras.');ctx.agregar('madera',-4);ctx.agregar('fibra',-2);m.usos=4;return bien('Trampa reparada; conserva la captura base y su límite.');}
 if(a.tipo==='recoger_trampa'){const p=m.casillas[0];if(!p)return mal('No hay una captura pendiente.');ctx.agregar(p.articulo,p.cantidad,calidadPila(p));m.casillas[0]=null;return bien('Captura recogida una sola vez.');}
 return mal('Acción de premio desconocida.');
}
/** Una revisión por jornada dormida, no por recargar, esperar horas o volver a entrar. */
export function dormirPremios(s:EstadoGranja,azar:()=>number){
 for(const m of s.historia?.utilidades?.modulos??[]){if(premioDef(m.premio)?.plano?.tipo!=='trampa'||m.ultimoDia>=s.jornada.diasCompletados)continue;m.ultimoDia=s.jornada.diasCompletados;if(m.casillas[0]||m.cebo<1||m.usos<1)continue;m.cebo--;m.usos--;
  const fecha=fechaValle(s.jornada.diasCompletados-1),peces=PECES.filter(p=>p.zonas.includes('lago')&&p.cebo==='lombriz'&&p.estaciones.includes(fecha.estacion)&&(!p.tiempos||p.tiempos.includes(tiempoDia(s.tiempo,s.jornada.diasCompletados-1))));
  if(!peces.length||azar()>=.5)continue;const pesos=peces.map(p=>1/(p.rareza*p.rareza));let n=azar()*pesos.reduce((n,x)=>n+x,0),i=0;while(i<pesos.length-1&&n>=pesos[i])n-=pesos[i++];const pez=peces[i];if(!m.especie||m.especie===pez.id)m.casillas[0]={articulo:pez.id,cantidad:1,calidad:0};
 }
}
export function utilidadesValidas(h:EstadoHistoria,dia:number){
 const u=h.utilidades,registro=(v:unknown)=>!!v&&typeof v==='object'&&!Array.isArray(v),entero=(n:unknown,min=0,max=1e9)=>Number.isInteger(n)&&Number(n)>=min&&Number(n)<=max,posee=(id:string,familia?:string)=>{const r=premioDef(id);return !!r&&h.premios.includes(r.id)&&!!h.completadas[r.mision]&&(!familia||r.familia===familia);};
 if(!u||u.version!==1||!Array.isArray(u.agenda)||u.agenda.length>3||new Set(u.agenda.map(a=>a?.premio)).size!==u.agenda.length||u.agenda.some(a=>!a||!posee(a.premio,'agenda')||!entero(a.dia,0,dia+112)||typeof a.revisada!=='boolean'))return false;
 if(!Array.isArray(u.exhibidos)||u.exhibidos.length>6||new Set(u.exhibidos).size!==u.exhibidos.length||u.exhibidos.some(id=>!posee(id,'trofeo'))||u.tecnica!==null&&!posee(u.tecnica,'tecnica')||u.seleccion!==null&&!posee(u.seleccion)||!registro(u.inscripciones)||Object.entries(u.inscripciones).some(([id,v])=>!posee(id)||typeof v!=='boolean')||!registro(u.estilos)||Object.entries(u.estilos).some(([id,v])=>{const p=premioDef(v)?.plano,r=p?.tipo==='receta'&&obtenerReceta(p.base);return !['arma','casco','pechera','botas'].includes(id)||!posee(v,'plano')||!r||obtenerObjeto(r.salida.articulo)?.equipo?.ranura!==id;}))return false;
 if(!Array.isArray(u.modulos)||u.modulos.length>36||new Set(u.modulos.map(m=>m?.id)).size!==u.modulos.length)return false;
 for(const m of u.modulos){const r=m&&premioDef(m.premio),p=r?.plano;if(!m||!p||p.tipo==='receta'||!posee(m.premio,'plano')||m.id!=='M_'+m.premio||![r.region,'granja','lago'].includes(m.region)||!Number.isFinite(m.x)||!Number.isFinite(m.z)||Math.abs(m.x)>1000||Math.abs(m.z)>1000||m.edificioId!==null&&typeof m.edificioId!=='string'||!entero(m.usos,0,4)||!entero(m.ultimoDia,0,dia)||!entero(m.cebo,0,4)||m.especie!==null&&!PECES.some(p=>p.id===m.especie)||!casillasValidas(m.casillas,p.tipo==='trampa'?1:p.capacidad??0))return false;}
 return true;
}

/** Los accesos siguen al soporte cuando se mueve o gira; una colisión revierte la operación completa. */
export function sincronizarSoportesPremio(s:EstadoGranja,antes:EstadoGranja,libre:(x:number,z:number)=>boolean):Resultado|null {
 for(const m of s.historia?.utilidades?.modulos??[]){if(m.region!=='granja'||!m.edificioId)continue;const viejo=antes.edificios.find(b=>b.id===m.edificioId),nuevo=s.edificios.find(b=>b.id===m.edificioId);if(!viejo)continue;if(!nuevo)return mal('Retira primero el módulo de acceso del edificio.');if(viejo.x===nuevo.x&&viejo.z===nuevo.z&&viejo.giro===nuevo.giro&&viejo.articulo===nuevo.articulo)continue;
  const d0=ARTICULOS.find(d=>d.id===viejo.articulo)!,d1=ARTICULOS.find(d=>d.id===nuevo.articulo)!,w0=viejo.giro%2?d0.fondo:d0.ancho,h0=viejo.giro%2?d0.ancho:d0.fondo,w1=nuevo.giro%2?d1.fondo:d1.ancho,h1=nuevo.giro%2?d1.ancho:d1.fondo,dx=m.x-(viejo.x+w0/2),dz=m.z-(viejo.z+h0/2),giro=(nuevo.giro-viejo.giro)*Math.PI/2;
  const x=Math.round(nuevo.x+w1/2+dx*Math.cos(giro)+dz*Math.sin(giro)),z=Math.round(nuevo.z+h1/2-dx*Math.sin(giro)+dz*Math.cos(giro));
  if(!libre(x,z)||s.historia!.utilidades.modulos.some(q=>q!==m&&q.region===m.region&&q.x===x&&q.z===z))return mal('El módulo de acceso quedaría bloqueado. Escoge otro lugar o retíralo primero.');m.x=x;m.z=z;
 }return null;
}
