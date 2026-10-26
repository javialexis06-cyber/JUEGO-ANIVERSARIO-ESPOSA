import {NIVELES_PVZ} from './datos/niveles';
import {PLANTAS_PVZ} from './datos/plantas';
import type {DefNivel,EstadoPvZ,OpcionesMotorPvZ} from './tipos';

/** El llamador decide dónde persiste. Importar este módulo no accede al navegador. */
export interface AlmacenPvZ {getItem(clave:string):string|null;setItem(clave:string,valor:string):void}
export interface AjustesPvZ {sonido:boolean;musica:boolean;velocidad:1|2}
export interface ProgresoModoPvZ {completados:string[];marcas:Record<string,number>}
export interface ProgresoFusionPvZ extends ProgresoModoPvZ {descubiertas:string[]}
export interface ProgresoPvZ {
 version:1;nivelAlcanzado:string;completados:string[];plantasDesbloqueadas:string[];objetos:string[];notas:string[];
 monedas:number;compras:Record<string,number|boolean>;ranuras:number;ajustes:AjustesPvZ;
 minijuegos:ProgresoModoPvZ;rompecabezas:ProgresoModoPvZ;supervivencia:ProgresoModoPvZ;fusion:ProgresoFusionPvZ;
}
export type MotivoGuardadoPvZ='lectura'|'json'|'version'|'estructura'|'escritura'|'conflicto';
export interface BloqueoGuardadoPvZ {motivo:MotivoGuardadoPvZ}
export interface PartidaPvZ {readonly id:number;readonly nivel:string}
export type AperturaPvZ={ok:true;partida:PartidaPvZ;nivel:DefNivel;opciones:OpcionesMotorPvZ}|{ok:false;motivo:'guardado'|'partida-activa'|'nivel'|'bloqueado'|'semillas'|'semilla'};
export interface ConfirmacionPvZ {ok:boolean;aplicado:boolean;guardado:boolean;gano?:boolean;motivo?:'partida'|'estado'|'guardado'}

type Objeto=Record<string,unknown>;
const propia=(o:Objeto,k:string)=>Object.hasOwn(o,k)?o[k]:undefined;
const objeto=(v:unknown):v is Objeto=>!!v&&typeof v==='object'&&!Array.isArray(v);
const idValido=(v:unknown):v is string=>typeof v==='string'&&/^[a-z0-9][a-z0-9._:-]{0,95}$/i.test(v)&&!['constructor','prototype','__proto__'].includes(v);
const natural=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
const lista=(v:unknown):string[]=>Array.isArray(v)?[...new Set(Object.entries(v).filter(([k])=>/^(0|[1-9]\d*)$/.test(k)&&Number(k)<v.length).map(([,n])=>n).filter(idValido))]:[];
const copia=<T>(v:T):T=>structuredClone(v);
const niveles=NIVELES_PVZ.map(n=>n.id);
const iniciales=Object.values(PLANTAS_PVZ).filter(p=>p.desbloqueo==='inicio').map(p=>p.id);
const vacioModo=():ProgresoModoPvZ=>({completados:[],marcas:{}});

export function claveGuardadoPvZ(amigo=false){return amigo?'amigo-pvz-v1':'pvz-v1';}
export function progresoInicialPvZ():ProgresoPvZ {
 return {version:1,nivelAlcanzado:niveles[0],completados:[],plantasDesbloqueadas:[...iniciales],objetos:[],notas:[],monedas:0,compras:{},ranuras:6,
  ajustes:{sonido:true,musica:true,velocidad:1},minijuegos:vacioModo(),rompecabezas:vacioModo(),supervivencia:vacioModo(),fusion:{...vacioModo(),descubiertas:[]}};
}
function modo(v:unknown,extras:readonly string[]=[]):ProgresoModoPvZ|null {
 if(v===undefined)return vacioModo();if(!objeto(v)||Object.keys(v).some(k=>!['completados','marcas',...extras].includes(k)))return null;
 const completados=propia(v,'completados'),marcas=propia(v,'marcas');
 if(completados!==undefined&&!Array.isArray(completados)||marcas!==undefined&&!objeto(marcas))return null;
 const valores:Record<string,number>={};
 if(objeto(marcas))for(const [k,n] of Object.entries(marcas))if(idValido(k)&&natural(n))Object.defineProperty(valores,k,{value:n,enumerable:true,writable:true,configurable:true});
 return {completados:lista(completados),marcas:valores};
}
function premios(completados:string[]){
 const plantas=[...iniciales],objetos:string[]=[],notas:string[]=[];
 for(const n of NIVELES_PVZ)if(completados.includes(n.id)){
  const p=n.premio;if(p?.planta&&idValido(p.planta))plantas.push(p.planta);if(p?.objeto&&idValido(p.objeto))objetos.push(p.objeto);if(p?.nota&&idValido(p.nota))notas.push(p.nota);
 }
 return {plantasDesbloqueadas:[...new Set(plantas)],objetos:[...new Set(objetos)],notas:[...new Set(notas)]};
}
function agregarPremios(p:ProgresoPvZ){
 const ganados=premios(p.completados);
 for(const k of ['plantasDesbloqueadas','objetos','notas'] as const)p[k]=[...new Set([...p[k],...ganados[k]])];
}
/**
 * Se toleran elementos sueltos inválidos, pero no se reconstruye una economía de formato desconocido.
 * Solo un prefijo consecutivo acredita premios de aventura; un hueco o un nivel alcanzado incoherente
 * bloquea la lectura sin truncar victorias ni reconstruirlas. Un extra ya desbloqueado requiere una compra
 * positiva del mismo ID: las compras sin desbloqueo explícito no crean semillas, objetos ni notas. Si no hay
 * una procedencia reconocida, o hay campos de un formato futuro, se bloquea sin borrar el archivo original.
 * Un null exige conservar el archivo original y bloquear escrituras, nunca reemplazarlo por una partida nueva.
 */
export function normalizarProgresoPvZ(v:unknown):ProgresoPvZ|null {
 if(!objeto(v)||propia(v,'version')!==1)return null;
 const p=progresoInicialPvZ();if(Object.keys(v).some(k=>!Object.hasOwn(p,k)))return null;
 for(const k of ['completados','plantasDesbloqueadas','objetos','notas'])if(propia(v,k)!==undefined&&!Array.isArray(propia(v,k)))return null;
 const completados=lista(propia(v,'completados'));
 // Una edición anterior no debe borrar niveles de otra entrega que aún no conoce.
 if(completados.some(id=>!niveles.includes(id)))return null;
 for(const id of niveles){if(!completados.includes(id))break;p.completados.push(id);}
 // No convertir un archivo con victorias registradas fuera de orden en otro que las borre.
 if(completados.length!==p.completados.length)return null;
 Object.assign(p,premios(p.completados));
 p.nivelAlcanzado=niveles[Math.min(p.completados.length,niveles.length-1)];
 // Solo las fronteras efectivamente publicadas (10, 20, 30 y 40 niveles) admiten su antiguo nivel final.
 // Añadir un mundo abre el siguiente nivel; nunca acredita una victoria por migrar.
 const fronteraAnterior=([['1-10',10],['2-10',20],['3-10',30],['4-10',40]] as const).some(([id,cantidad])=>
  p.completados.length===cantidad&&niveles[cantidad-1]===id&&propia(v,'nivelAlcanzado')===id);
 if(Object.hasOwn(v,'nivelAlcanzado')&&propia(v,'nivelAlcanzado')!==p.nivelAlcanzado&&!fronteraAnterior)return null;
 const monedas=propia(v,'monedas'),ranuras=propia(v,'ranuras'),compras=propia(v,'compras');
 if(monedas!==undefined&&!natural(monedas)||ranuras!==undefined&&(!natural(ranuras)||ranuras<1||ranuras>10)||compras!==undefined&&!objeto(compras))return null;
 if(natural(monedas))p.monedas=monedas;if(natural(ranuras))p.ranuras=ranuras;
 if(objeto(compras))for(const [k,n]of Object.entries(compras)){
  if(!idValido(k))continue;if(typeof n!=='boolean'&&!natural(n))return null;
  Object.defineProperty(p.compras,k,{value:n,enumerable:true,writable:true,configurable:true});
 }
 for(const k of ['plantasDesbloqueadas','objetos','notas'] as const){
  const guardados=lista(propia(v,k));
  if(guardados.some(id=>!p[k].includes(id)&&!(Object.hasOwn(p.compras,id)&&(p.compras[id]===true||typeof p.compras[id]==='number'&&p.compras[id]>0))))return null;
  p[k]=[...new Set([...p[k],...guardados])];
 }
 const ajustes=propia(v,'ajustes');if(ajustes!==undefined&&(!objeto(ajustes)||Object.keys(ajustes).some(k=>!['sonido','musica','velocidad'].includes(k))))return null;
 if(objeto(ajustes)){
  const sonido=propia(ajustes,'sonido'),musica=propia(ajustes,'musica'),velocidad=propia(ajustes,'velocidad');
  if(typeof sonido==='boolean')p.ajustes.sonido=sonido;if(typeof musica==='boolean')p.ajustes.musica=musica;if(velocidad===1||velocidad===2)p.ajustes.velocidad=velocidad;
 }
 for(const k of ['minijuegos','rompecabezas','supervivencia','fusion'] as const){const m=modo(propia(v,k),k==='fusion'?['descubiertas']:[]);if(!m)return null;Object.assign(p[k],m);}
 const fusion=propia(v,'fusion');if(objeto(fusion)){const d=propia(fusion,'descubiertas');if(d!==undefined&&!Array.isArray(d))return null;p.fusion.descubiertas=lista(d);}
 return p;
}
function estadoFinal(v:unknown,nivel:string):v is EstadoPvZ {
 if(!objeto(v)||propia(v,'version')!==1||propia(v,'nivel')!==nivel||!['gano','perdio'].includes(propia(v,'terminado') as string))return false;
 const t=propia(v,'t');
 return typeof t==='number'&&Number.isFinite(t)&&t>=0&&['pasos','sol','abono','oleada','eliminados','sembradas'].every(k=>natural(propia(v,k)))&&
  ['plantas','zombis','proyectiles','soles','cortacespedes','cinta'].every(k=>Array.isArray(propia(v,k)));
}

/**
 * Una sola partida activa. Su identificador es de memoria y no sirve como partida restaurable.
 * El resultado se aplica una vez; si falla setItem queda en memoria y bloquea nuevas partidas hasta reintentar.
 * Las escrituras comprueban el texto leído para detectar cambios de otra pestaña o una versión desconocida.
 * Es una comprobación conservadora, no una transacción: AlmacenPvZ/localStorage no ofrece comparar y escribir
 * de forma atómica. Un conflicto mantiene el resultado en memoria y exige resolver la otra escritura.
 */
export class GuardadoPvZ {
 readonly clave:string;
 private actual=progresoInicialPvZ();private origen:string|null=null;private fallo:BloqueoGuardadoPvZ|null=null;
 private porGuardar:ProgresoPvZ|null=null;private proximaPartida=1;private activa:PartidaPvZ|null=null;
 private recibos=new WeakMap<PartidaPvZ,{gano:boolean;aplicado:boolean}>();
 constructor(private readonly almacen:AlmacenPvZ,opciones:{amigo?:boolean}={}){this.clave=claveGuardadoPvZ(opciones.amigo);this.leer();}
 get progreso(){return copia(this.actual);}
 get bloqueo(){return this.fallo?{...this.fallo}:null;}
 get pendiente(){return this.porGuardar!==null;}
 /** Estado de persistencia de todo el progreso actual, también al repetir una confirmación. */
 get guardado(){return !this.pendiente&&!this.fallo;}
 get siguienteNivel(){return niveles[this.actual.completados.length]??null;}
 get partidaActiva(){return this.activa;}
 private leer(){
  let texto:string|null;try{texto=this.almacen.getItem(this.clave);if(texto!==null&&typeof texto!=='string')throw new Error('Lectura inválida');}catch{this.fallo={motivo:'lectura'};return false;}
  if(texto===null){this.actual=progresoInicialPvZ();this.origen=null;this.fallo=null;return true;}
  let v:unknown;try{v=JSON.parse(texto);}catch{this.fallo={motivo:'json'};return false;}
  if(objeto(v)&&propia(v,'version')!==1){this.fallo={motivo:'version'};return false;}
  const p=normalizarProgresoPvZ(v);if(!p){this.fallo={motivo:'estructura'};return false;}
  this.actual=p;this.origen=texto;this.fallo=null;return true;
 }
 private escribir(){
  if(!this.porGuardar)return !this.fallo;
  try{
   if(this.almacen.getItem(this.clave)!==this.origen){this.fallo={motivo:'conflicto'};return false;}
   const texto=JSON.stringify(this.porGuardar);this.almacen.setItem(this.clave,texto);this.origen=texto;this.porGuardar=null;this.fallo=null;return true;
  }catch{this.fallo={motivo:'escritura'};return false;}
 }
 reintentar(){return this.porGuardar?this.escribir():this.fallo?this.leer():true;}
 disponibles(){return this.actual.plantasDesbloqueadas.filter(id=>Object.hasOwn(PLANTAS_PVZ,id));}
 abrirNivel(id:string,seleccion?:readonly string[],semilla?:number):AperturaPvZ {
  if(this.fallo||this.porGuardar)return {ok:false,motivo:'guardado'};
  if(this.activa)return {ok:false,motivo:'partida-activa'};
  const i=niveles.indexOf(id);if(i<0)return {ok:false,motivo:'nivel'};
  if(i>this.actual.completados.length)return {ok:false,motivo:'bloqueado'};
  if(semilla!==undefined&&(!Number.isSafeInteger(semilla)||!Number.isFinite(semilla)))return {ok:false,motivo:'semilla'};
  if(seleccion!==undefined&&!Array.isArray(seleccion))return {ok:false,motivo:'semillas'};
  const nivel=copia(NIVELES_PVZ[i]);let elegidas:string[]=[];
  if(nivel.cinta){if(seleccion!==undefined&&(!Array.isArray(seleccion)||seleccion.length>0))return {ok:false,motivo:'semillas'};}
  else{
   const disponibles=this.disponibles(),fijas=nivel.semillas;
   const candidatas=seleccion??fijas??disponibles.slice(0,this.actual.ranuras);
   if(!Array.isArray(candidatas)||!candidatas.length||candidatas.length>this.actual.ranuras||new Set(candidatas).size!==candidatas.length||Array.from({length:candidatas.length},(_,i)=>i).some(i=>!Object.hasOwn(candidatas,i)||typeof candidatas[i]!=='string'||!disponibles.includes(candidatas[i])||fijas&&!fijas.includes(candidatas[i])))return {ok:false,motivo:'semillas'};
   elegidas=[...candidatas];
  }
  const partida=Object.freeze({id:this.proximaPartida++,nivel:id});this.activa=partida;
  return {ok:true,partida,nivel,opciones:{semillas:elegidas,...(semilla===undefined?{}:{semilla})}};
 }
 abandonar(partida:PartidaPvZ){if(partida!==this.activa)return false;this.activa=null;return true;}
 confirmarResultado(partida:PartidaPvZ,estado:EstadoPvZ):ConfirmacionPvZ {
  if(!partida||typeof partida!=='object')return {ok:false,aplicado:false,guardado:this.guardado,motivo:'partida'};
  const recibo=this.recibos.get(partida);
  if(recibo)return {ok:true,gano:recibo.gano,aplicado:false,guardado:this.guardado};
  if(partida!==this.activa)return {ok:false,aplicado:false,guardado:this.guardado,motivo:'partida'};
  if(!estadoFinal(estado,partida.nivel))return {ok:false,aplicado:false,guardado:this.guardado,motivo:'estado'};
  if(this.fallo||this.porGuardar)return {ok:false,aplicado:false,guardado:false,motivo:'guardado'};
  const gano=estado.terminado==='gano',aplicado=gano&&!this.actual.completados.includes(partida.nivel);
  // Monedas de la Margarita: como en PC se conservan las recogidas aunque se pierda la partida.
  const monedas=natural(estado.monedas)&&estado.monedas<=1e6?estado.monedas:0;
  this.activa=null;this.recibos.set(partida,{gano,aplicado});
  if(aplicado||monedas>0){
   const p=copia(this.actual);p.monedas+=monedas;
   if(aplicado){p.completados.push(partida.nivel);agregarPremios(p);p.nivelAlcanzado=niveles[Math.min(p.completados.length,niveles.length-1)];}
   this.actual=p;this.porGuardar=copia(p);this.escribir();
  }
  return {ok:true,gano,aplicado,guardado:this.guardado};
 }
 actualizarAjustes(ajustes:Partial<AjustesPvZ>){
  if(this.fallo||this.porGuardar)return false;
  if(!objeto(ajustes))return false;
  const sonido=propia(ajustes,'sonido'),musica=propia(ajustes,'musica'),velocidad=propia(ajustes,'velocidad');
  if(sonido!==undefined&&typeof sonido!=='boolean'||musica!==undefined&&typeof musica!=='boolean'||velocidad!==undefined&&velocidad!==1&&velocidad!==2)return false;
  const p=copia(this.actual);if(typeof sonido==='boolean')p.ajustes.sonido=sonido;if(typeof musica==='boolean')p.ajustes.musica=musica;if(velocidad===1||velocidad===2)p.ajustes.velocidad=velocidad;
  if(JSON.stringify(p.ajustes)===JSON.stringify(this.actual.ajustes))return true;
  this.actual=p;this.porGuardar=copia(p);return this.escribir();
 }
}
