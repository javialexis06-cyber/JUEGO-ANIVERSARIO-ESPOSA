import type { EstadoGranja, Edificio, Resultado } from './estado';
import { crearGenoma, validarGenoma, type Genome } from './genetica';
import { crearCuidado, estadoAnimal, reconciliarAnimal, alimentar, consentir, curar, type AnimalCare, type ComfortMethod } from './cuidados';
import { coordenadaRefugio } from './ganaderia';
import { dentroDeZona } from './caminos-mundo';
import { puntoTransitable, celdaTransitable } from './transito';
import type { Zona } from './catalogo';
import { efectosHabilidades } from './habilidades';

export type TipoCompania='gato'|'perro'|'tortuga'|'caballo';
export const TIPOS_COMPANIA:TipoCompania[]=['gato','perro','tortuga','caballo'];
export const COMPANEROS:Record<TipoCompania,{nombre:string;precio:number;hogar:string;alimento:string;capacidad:number;variantes:string[]}>={
 gato:{nombre:'Gato',precio:120,hogar:'hogar_mascota',alimento:'alimento_mascota',capacidad:8,variantes:['Canela','Negro','Gris','Blanco']},
 perro:{nombre:'Perro',precio:150,hogar:'hogar_mascota',alimento:'alimento_mascota',capacidad:8,variantes:['Dorado','Negro','Gris','Crema']},
 tortuga:{nombre:'Tortuga',precio:220,hogar:'hogar_mascota',alimento:'alimento_mascota',capacidad:8,variantes:['Oliva','Bosque','Pizarra','Arena']},
 caballo:{nombre:'Caballo',precio:320,hogar:'establo',alimento:'heno',capacidad:2,variantes:['Castaño','Negro','Gris','Palomino']},
};
export interface Companero {id:string;tipo:TipoCompania;nombre:string;genoma:Genome;edificioId:string;cuidado:AnimalCare;amistad:number;carinoDia:number|null;aguaDia:number|null;seguir:boolean;posicion:{zona:Zona;x:number;z:number};direccion:number;actividad:'reposo'|'caminar'|'dormir';}
export interface EstadoCompania {version:1;animales:Companero[];montada:string|null;}
export type AccionCompania=
 |{tipo:'adoptar';animal:TipoCompania;variante:number;nombre:string;edificioId:string}
 |{tipo:'cuidar';id:string;metodo:ComfortMethod|'alimentar'|'medico'}
 |{tipo:'agua'|'seguir'|'montar'|'desmontar';id:string}
 |{tipo:'trasladar';id:string;edificioId:string};
export const crearCompania=():EstadoCompania=>({version:1,animales:[],montada:null});
export const companiaDisponible=(s:EstadoGranja,tipo:TipoCompania)=>tipo==='caballo'?s.misionesCompletadas.includes('huerta')||s.desbloqueos.includes('montura'):s.misionesCompletadas.includes('hogar')||s.desbloqueos.includes('companeros');
export const varianteCompania=(a:Pick<Companero,'genoma'>)=>((a.genoma.A.includes('A')?0:2)+(a.genoma.B.includes('B')?0:1)) as 0|1|2|3;
export function todosCompaneros(s:EstadoGranja){return s.compania.animales;}
export function hogarCompania(b:Edificio,tipo:TipoCompania){if(tipo==='caballo')return coordenadaRefugio(b,2,6);const x=b.x+(b.giro%2?1:1),z=b.z+1;return b.giro===0?{x,z:z+1.65}:b.giro===1?{x:x-1.65,z}:b.giro===2?{x,z:z-1.65}:{x:x+1.65,z};}
export function cuencoCompania(b:Edificio){return b.giro===0?{x:b.x+1.5,z:b.z+2.5}:b.giro===1?{x:b.x-.5,z:b.z+1.5}:b.giro===2?{x:b.x+.5,z:b.z-.5}:{x:b.x+2.5,z:b.z+.5};}
export function clipCompania(s:EstadoGranja,a:Companero){if(a.tipo==='caballo'&&a.actividad==='reposo'&&a.posicion.zona==='granja'&&s.jornada.minutos<19*60){const b=s.edificios.find(b=>b.id===a.edificioId);if(b&&b.pasto>0){const p=hogarCompania(b,a.tipo),salud=estadoAnimal(a.cuidado,s.ultimoTiempo);if(!salud.enfermo&&!salud.deprimido&&Math.hypot(a.posicion.x-p.x,a.posicion.z-p.z)<=2)return 'comer';}}return a.actividad;}
export function companeroVisible(s:EstadoGranja,a:Companero){return !s.interior&&!s.servicio&&!s.aventura.destinoActual&&s.zona===a.posicion.zona;}
export function actualizarCompania(s:EstadoGranja,now:number){for(const a of todosCompaneros(s))a.cuidado=reconciliarAnimal(a.cuidado,now);}
export function monturaSana(s:EstadoGranja){const a=s.compania.animales.find(a=>a.id===s.compania.montada);if(!a)return true;const salud=estadoAnimal(a.cuidado,s.ultimoTiempo);return !salud.enfermo&&!salud.deprimido&&!salud.hambriento;}
export function posicionMontada(s:EstadoGranja,x:number,z:number,direccion?:number){const a=todosCompaneros(s).find(a=>a.id===s.compania.montada);if(a&&!s.interior&&!s.servicio&&!s.aventura.destinoActual&&dentroDeZona(s.zona,x,z)){a.posicion={zona:s.zona,x,z};if(direccion!==undefined&&Number.isFinite(direccion))a.direccion=Math.atan2(Math.sin(direccion),Math.cos(direccion));s.posicionExterior={zona:s.zona,x,z};}}
export function cerrarDiaCompania(s:EstadoGranja){for(const a of todosCompaneros(s)){if(a.aguaDia===s.jornada.diasCompletados)a.amistad=Math.min(1000,a.amistad+6);const b=s.edificios.find(b=>b.id===a.edificioId)!;const p=hogarCompania(b,a.tipo),libre=puntoTransitable(s,p.x,p.z,a.tipo==='caballo'?.45:.2,'granja')?p:buscarPatioLibre(s,p,a.tipo==='caballo'?.45:.2);if(libre)a.posicion={zona:'granja',...libre};a.actividad='reposo';}s.compania.montada=null;}
function buscarPatioLibre(s:EstadoGranja,p:{x:number;z:number},radio:number){for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]])if(puntoTransitable(s,p.x+dx,p.z+dz,radio,'granja'))return {x:p.x+dx,z:p.z+dz};return null;}
export function trasladarHogarCompania(s:EstadoGranja,b:Edificio){for(const a of todosCompaneros(s).filter(a=>a.edificioId===b.id)){a.posicion={zona:'granja',...hogarCompania(b,a.tipo)};a.actividad='reposo';}}
export function puntoDesmontar(s:EstadoGranja,x:number,z:number){for(const [dx,dz]of [[1.1,0],[-1.1,0],[0,1.1],[0,-1.1],[.85,.85],[-.85,.85],[.85,-.85],[-.85,-.85]])if(puntoTransitable(s,x+dx,z+dz))return {x:x+dx,z:z+dz};return null;}
const bien=(mensaje:string):Resultado=>({ok:true,mensaje}),mal=(mensaje:string):Resultado=>({ok:false,mensaje});
interface PuertoCompania {id:()=>string;pagar:(articulo:string)=>void;contar:(clave:string)=>void;}
export function actuarCompania(s:EstadoGranja,a:AccionCompania,x:number,z:number,puerto:PuertoCompania):Resultado{
 const now=s.ultimoTiempo,dia=s.jornada.diasCompletados;
 if(a.tipo==='adoptar'){
  const d=COMPANEROS[a.animal];if(!d||!companiaDisponible(s,a.animal))return mal('Completa las primeras misiones para conocer a este compañero.');
  if(s.zona!=='pueblo'||s.servicio!=='animales')return mal('Adopta en la tienda de animales del pueblo.');
  if(!Number.isInteger(a.variante)||a.variante<0||a.variante>3||typeof a.nombre!=='string'||!a.nombre.trim()||a.nombre.trim().length>32)return mal('Elige un nombre de hasta 32 letras y una variedad válida.');
  if(a.variante>1&&!s.misionesCompletadas.includes('confianza'))return mal('La misión Manos que cuidan permite adoptar las variedades gris y clara.');
  const b=s.edificios.find(b=>b.id===a.edificioId&&b.articulo===d.hogar);if(!b||todosCompaneros(s).some(a=>a.edificioId===b.id))return mal('Construye un hogar libre para este compañero. Cada uno necesita el suyo.');
  const n=todosCompaneros(s).filter(c=>(c.tipo==='caballo')===(a.animal==='caballo')).length;if(n>=d.capacidad)return mal('La granja admite 8 mascotas y 2 caballos.');
  if(s.monedas<d.precio)return mal('No tienes suficientes monedas para adoptar.');
  const p=hogarCompania(b,a.animal);if(!puntoTransitable(s,p.x,p.z,a.animal==='caballo'?.45:.2,'granja'))return mal('Despeja el patio del hogar antes de adoptar.');
  const genoma=crearGenoma(a.variante<2?'Aa':'aa',a.variante%2?'bb':'Bb');
  s.monedas-=d.precio;todosCompaneros(s).push({id:puerto.id(),tipo:a.animal,nombre:a.nombre.trim(),genoma,edificioId:b.id,cuidado:crearCuidado(now),amistad:0,carinoDia:null,aguaDia:null,seguir:false,posicion:{zona:'granja',...p},direccion:0,actividad:'reposo'});puerto.contar('companeros_adoptados');return bien(a.nombre.trim()+' te espera en su hogar.');
 }
 const c=todosCompaneros(s).find(c=>c.id===a.id);if(!c)return mal('No se encontró ese compañero.');
 if(a.tipo==='trasladar'){
  if(s.compania.montada===c.id)return mal('Desmonta antes de cambiar el establo.');const b=s.edificios.find(b=>b.id===a.edificioId&&b.articulo===COMPANEROS[c.tipo].hogar);if(!b||todosCompaneros(s).some(a=>a.edificioId===b.id))return mal('Selecciona un hogar libre y adecuado.');const p=hogarCompania(b,c.tipo);if(!puntoTransitable(s,p.x,p.z,c.tipo==='caballo'?.45:.2,'granja'))return mal('Despeja el patio del nuevo hogar.');c.edificioId=b.id;c.posicion={zona:'granja',...p};c.actividad='reposo';return bien('Hogar cambiado; se conservan su vínculo, cuidados y genes.');
 }
 if(a.tipo==='desmontar'){
  if(s.compania.montada!==c.id||!companeroVisible(s,c)||!Number.isFinite(x)||!Number.isFinite(z)||Math.hypot(x-c.posicion.x,z-c.posicion.z)>.8)return mal('Esta montura no está junto al personaje.');
  const p=puntoDesmontar(s,x,z);if(!p)return mal('No hay espacio libre para desmontar. Busca un camino más ancho.');s.compania.montada=null;c.actividad='reposo';s.posicionExterior={zona:s.zona,...p};return {...bien('Desmontas; '+c.nombre+' esperará aquí.'),posicionZona:p};
 }
 const b=s.edificios.find(b=>b.id===c.edificioId)!;const p=a.tipo==='agua'?cuencoCompania(b):c.posicion;
 if(!companeroVisible(s,c)||a.tipo==='agua'&&s.zona!=='granja'||!Number.isFinite(x)||!Number.isFinite(z)||Math.hypot(x-p.x,z-p.z)>2.8)return mal('Acércate al compañero o a su cuenco.');
 if(s.compania.montada)return mal('Desmonta antes de cuidar o montar otro animal.');
 if(a.tipo==='montar'){
  if(c.tipo!=='caballo'||s.zona==='mina')return mal('Solo puedes montar caballos al aire libre.');const salud=estadoAnimal(c.cuidado,now);if(salud.enfermo||salud.deprimido||salud.hambriento)return mal('Alimenta y cura al caballo antes de montar.');if(!puntoTransitable(s,c.posicion.x,c.posicion.z,.45))return mal('Despeja el espacio alrededor del caballo.');s.compania.montada=c.id;s.posicionExterior={...c.posicion};return {...bien('Montas a '+c.nombre+'. Usa WASD o las flechas; pulsa Desmontar para bajarte.'),posicionZona:{x:c.posicion.x,z:c.posicion.z}};
 }
 if(a.tipo==='agua'){
  if(c.tipo==='caballo')return mal('Este cuenco pertenece a una mascota.');if(s.herramienta!=='regadera'||s.mejoraHerramienta?.herramienta==='regadera')return mal('Equipa tu regadera para llenar el cuenco.');if(c.aguaDia===dia)return mal('El cuenco ya tiene agua para esta jornada.');c.aguaDia=dia;puerto.contar('cuencos_regados');return bien('Cuenco lleno. Su vínculo mejorará al dormir, una vez por jornada.');
 }
 if(a.tipo==='seguir'){if(c.tipo==='caballo')return mal('El caballo espera donde lo desmontaste.');c.seguir=!c.seguir;return bien(c.seguir?c.nombre+' te acompañará por la granja.':c.nombre+' volverá a descansar junto a su hogar.');}
 if(a.tipo==='cuidar'){
  if(a.metodo==='alimentar'){const alimento=COMPANEROS[c.tipo].alimento;if(!(s.inventario[alimento]>0))return mal('Necesitas '+(alimento==='heno'?'heno':'alimento para mascotas')+' en la mochila.');puerto.pagar(alimento);c.cuidado=alimentar(c.cuidado,now);puerto.contar('alimentar');return bien(c.nombre+' ha comido.');}
  if(a.metodo==='medico'){const salud=estadoAnimal(c.cuidado,now);if(!salud.enfermo&&!salud.deprimido)return mal('Este compañero no necesita tratamiento.');const precio=Math.round(60*(efectosHabilidades(s.habilidades).veterinario??1));if(s.monedas<precio)return mal('La visita veterinaria cuesta '+precio+' monedas.');s.monedas-=precio;c.cuidado=curar(c.cuidado,now);return bien('El veterinario ha tratado a '+c.nombre+'.');}
  if(!['acariciar','musica','cuento','cepillar'].includes(a.metodo))return mal('Método de cuidado desconocido.');c.cuidado=consentir(c.cuidado,a.metodo,now);if(c.carinoDia!==dia){c.amistad=Math.min(1000,c.amistad+12);c.carinoDia=dia;}puerto.contar('consentir');return bien(c.nombre+' disfruta del cariño. El vínculo aumenta una vez por jornada.');
 }return mal('Actividad de compañía desconocida.');
}

/** Las rutas son una caché de sesión, no crecimiento ni datos necesarios del guardado. */
export class PaseosCompania {
 private estado?:EstadoGranja;private revision=-1;private celdas=new Map<string,boolean>();
 private libre(s:EstadoGranja,x:number,z:number){if(this.estado!==s||this.revision!==s.revision){this.celdas.clear();this.estado=s;this.revision=s.revision;}return [[-.18,-.18],[.18,-.18],[-.18,.18],[.18,.18]].every(([dx,dz])=>{const xx=Math.floor(x+dx),zz=Math.floor(z+dz),key=xx+','+zz;if(!this.celdas.has(key))this.celdas.set(key,celdaTransitable(s,xx,zz,'granja'));return this.celdas.get(key)!;});}
 private rutas=new Map<string,{puntos:{x:number;z:number}[];restante:number;meta:string}>();
 limpiar(){this.rutas.clear();this.celdas.clear();this.estado=undefined;this.revision=-1;}
 paso(s:EstadoGranja,dt:number,jugador:{x:number;z:number;direccion?:number}){
  if(!Number.isFinite(dt)||dt<=0||s.interior||s.servicio||s.aventura.destinoActual||s.jornada.resumenPendiente)return;dt=Math.min(dt,.1);posicionMontada(s,jugador.x,jugador.z,jugador.direccion);
  if(s.zona!=='granja')return;
  for(const a of todosCompaneros(s)){
   if(a.tipo==='caballo'||a.posicion.zona!=='granja')continue;
   const salud=estadoAnimal(a.cuidado,s.ultimoTiempo);if(salud.enfermo||salud.deprimido){a.actividad='reposo';continue;}
   const b=s.edificios.find(b=>b.id===a.edificioId);if(!b)continue;const noche=s.jornada.minutos>=19*60;
   const meta=a.seguir&&!noche?jugador:hogarCompania(b,a.tipo);const distancia=Math.hypot(meta.x-a.posicion.x,meta.z-a.posicion.z);if(distancia<(a.seguir&&!noche?1.6:.3)){a.actividad=noche?'dormir':'reposo';this.rutas.delete(a.id);continue;}
   const clave=Math.floor(meta.x)+','+Math.floor(meta.z);let ruta=this.rutas.get(a.id);if(ruta)ruta.restante-=dt;
   if(!ruta||ruta.restante<=0||ruta.meta!==clave){ruta={puntos:buscarRuta(s,a.posicion,meta,(x,z)=>this.libre(s,x,z)),restante:1,meta:clave};this.rutas.set(a.id,ruta);}
   const p=ruta.puntos[0];if(!p){a.actividad='reposo';continue;}
   const dx=p.x-a.posicion.x,dz=p.z-a.posicion.z,d=Math.hypot(dx,dz),paso=Math.min(d,dt*(a.tipo==='tortuga'?.65:2.2));
   if(d<.05){ruta.puntos.shift();continue;}const x=a.posicion.x+dx/d*paso,z=a.posicion.z+dz/d*paso;if(!this.libre(s,x,z)){this.rutas.delete(a.id);a.actividad='reposo';continue;}
   a.posicion.x=x;a.posicion.z=z;a.direccion=Math.atan2(dx,dz);a.actividad='caminar';
  }
 }
}
function buscarRuta(s:EstadoGranja,inicio:{x:number;z:number},fin:{x:number;z:number},libre:(x:number,z:number)=>boolean){
 const start={x:Math.floor(inicio.x),z:Math.floor(inicio.z)},goal={x:Math.floor(fin.x),z:Math.floor(fin.z)},key=(p:{x:number;z:number})=>p.x+','+p.z,cola=[start],vistos=new Set([key(start)]),padres=new Map<string,{x:number;z:number}>();let meta=start,dist=Infinity;
 for(let i=0;i<cola.length&&i<512;i++){const p=cola[i],d=Math.hypot(p.x-goal.x,p.z-goal.z);if(d<dist){dist=d;meta=p;}if(d===0)break;for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const n={x:p.x+dx,z:p.z+dz},k=key(n);if(vistos.has(k)||!libre(n.x+.5,n.z+.5))continue;vistos.add(k);padres.set(k,p);cola.push(n);}}
 const puntos:{x:number;z:number}[]=[];while(key(meta)!==key(start)){puntos.push({x:meta.x+.5,z:meta.z+.5});meta=padres.get(key(meta))!;}puntos.reverse();if(key(cola.find(p=>p.x===goal.x&&p.z===goal.z)??start)===key(goal)&&libre(fin.x,fin.z))puntos.push({x:fin.x,z:fin.z});return puntos;
}
export function companiaValida(s:EstadoGranja){
 const c=s.compania;if(!c||c.version!==1||!Array.isArray(c.animales)||c.animales.length>10||c.animales.filter(a=>a?.tipo==='caballo').length>2||c.animales.filter(a=>a?.tipo!=='caballo').length>8)return false;
 const ids=new Set([...s.animales,...s.edificios,...s.obstaculos,...s.frutales,...s.drops,...s.produccion.cofres,...s.produccion.maquinas,...s.produccion.estructuras,...s.ganaderia.trufas].map(a=>a.id)),hogares=new Set<string>(),dia=s.jornada.diasCompletados,numero=(n:unknown,min:number,max:number)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max,fecha=(n:unknown)=>n===null||numero(n,0,s.ultimoTiempo),jornada=(n:unknown)=>n===null||Number.isInteger(n)&&numero(n,0,dia);
 for(const a of c.animales){
  if(!a||typeof a.id!=='string'||!/^[a-z0-9_]{1,99}$/.test(a.id)||ids.has(a.id)||!TIPOS_COMPANIA.includes(a.tipo)||typeof a.nombre!=='string'||!a.nombre.trim()||a.nombre.length>32||typeof a.seguir!=='boolean'||!Number.isInteger(a.amistad)||!numero(a.amistad,0,1000)||!jornada(a.carinoDia)||!jornada(a.aguaDia)||!numero(a.direccion,-Math.PI,Math.PI)||!['reposo','caminar','dormir'].includes(a.actividad))return false;ids.add(a.id);
  const b=s.edificios.find(b=>b.id===a.edificioId&&b.articulo===COMPANEROS[a.tipo].hogar);if(!b||hogares.has(b.id))return false;hogares.add(b.id);
  if(!a.posicion||!['granja','pueblo','bosque','lago','bosque_ancestral'].includes(a.posicion.zona)||!dentroDeZona(a.posicion.zona,a.posicion.x,a.posicion.z)||a.tipo!=='caballo'&&a.posicion.zona!=='granja')return false;
  try{validarGenoma(a.genoma);estadoAnimal(a.cuidado,s.ultimoTiempo);}catch{return false;}
  const salud=a.cuidado;if(!numero(salud.lastEvaluatedAt,0,s.ultimoTiempo)||!fecha(salud.illnessSince)||!fecha(salud.depressionSince)||salud.illnessSince!==null&&salud.illnessSince>salud.lastEvaluatedAt||salud.depressionSince!==null&&salud.depressionSince>salud.lastEvaluatedAt||salud.lastComfortMethod!==null&&!['acariciar','musica','cuento','cepillar'].includes(salud.lastComfortMethod))return false;
 }
 if(c.montada!==null){const a=c.animales.find(a=>a.id===c.montada);if(!a||a.tipo!=='caballo'||s.interior||s.servicio||s.aventura.destinoActual||s.zona==='mina'||a.posicion.zona!==s.zona||!s.posicionExterior||s.posicionExterior.zona!==s.zona||Math.hypot(a.posicion.x-s.posicionExterior.x,a.posicion.z-s.posicionExterior.z)>.01)return false;}
 return true;
}
