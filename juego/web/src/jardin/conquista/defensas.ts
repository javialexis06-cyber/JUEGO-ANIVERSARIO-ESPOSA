import {MotorPvZ,type RegistrosPvZ} from '../pvz/motor/motor';
import type {InstantaneaMotorPvZ} from '../pvz/motor/instantanea';
import {PLANTAS_PVZ} from '../pvz/datos/plantas';
import type {DefNivel,EventoPvZ,OpcionesMotorPvZ,OrdenPvZ} from '../pvz/tipos';
import {arbolPvZ,canonicoPvZ,enteroPvZ,exigirPvZ,objetoPvZ} from '../pvz/motor/validacion';

export interface ConfigDefensasPvZ {
 zonas:readonly string[];desbloqueadas:readonly string[];
 /** Alias registrados de la misma planta entre ediciones; nunca recetas inventadas. */
 identidades?:Readonly<Record<string,string>>;
}
export interface InstantaneaDefensasPvZ {
 version:1;pasos:number;pausada:boolean;revision:number;visible:string|null;
 desbloqueadas:string[];identidades:Record<string,string>;
 zonas:{id:string;semillas:string[];partida:InstantaneaMotorPvZ|null}[];
}
export type ResultadoAsignacionPvZ={ok:true;revision:number}|{ok:false;motivo:'revision'|'zona'|'activa'|'semillas'|'bloqueada'|'ocupada';tipo?:string;zona?:string};
export interface EventoDefensaPvZ {zona:string;eventos:EventoPvZ[]}
type ZonaDefensa={semillas:string[];motor:MotorPvZ|null};
const idZona=(id:unknown):id is string=>typeof id==='string'&&id.length>0&&id.length<=100&&!['__proto__','constructor','prototype'].includes(id);

/** Coordinador del combate normal de PvZ, separado de propiedad, economía y rutas.
 * La vista seleccionada no decide qué motor avanza. Una instancia pertenece al anfitrión.
 * No sustituye todavía el mundo/red V1 ni escribe sus guardados. */
export class DefensasConquistaPvZ {
 private zonas=new Map<string,ZonaDefensa>();private disponibles=new Set<string>();
 private identidades:Record<string,string>;private registros:RegistrosPvZ;
 private _pasos=0;private _pausada=false;private _revision=0;private _visible:string|null=null;
 constructor(config:ConfigDefensasPvZ,registros:RegistrosPvZ={}){
  this.registros=registros;const plantas=registros.plantas??PLANTAS_PVZ;
  exigirPvZ(Array.isArray(config.zonas)&&config.zonas.length>0&&config.zonas.length<=1024&&config.zonas.every(idZona)&&new Set(config.zonas).size===config.zonas.length,'Zonas de defensa inválidas');
  this.identidades=Object.fromEntries(Object.keys(plantas).map(id=>[id,config.identidades?.[id]??id]));
  for(const[id,canonico]of Object.entries(this.identidades))exigirPvZ(Object.hasOwn(plantas,canonico)&&this.identidades[canonico]===canonico,'Identidad canónica inválida: '+id);
  for(const id of Object.keys(config.identidades??{}))exigirPvZ(Object.hasOwn(plantas,id),'Alias sin planta funcional');
  for(const id of config.zonas)this.zonas.set(id,{semillas:[],motor:null});
  this.desbloquear(config.desbloqueadas);
 }
 get pasos(){return this._pasos;}
 get t(){return this._pasos/60;}
 get revision(){return this._revision;}
 get pausada(){return this._pausada;}
 get visible(){return this._visible;}
 seleccionar(zona:string|null){if(zona!==null&&!this.zonas.has(zona))return false;this._visible=zona;return true;}
 pausar(valor:boolean){exigirPvZ(typeof valor==='boolean');this._pausada=valor;}
 /** Solo lectura para el render; las órdenes de interfaz pasan por ordenar(). */
 observar(zona:string){return this.zonas.get(zona)?.motor??null;}
 semillas(zona:string):readonly string[]{return [...(this.zonas.get(zona)?.semillas??[])];}
 propietaria(tipo:string):string|null{
  const canonico=this.identidades[tipo];if(!canonico)return null;
  for(const[id,zona]of this.zonas)if(zona.semillas.some(id=>this.identidades[id]===canonico))return id;
  return null;
 }
 desbloquear(tipos:readonly string[]){
  exigirPvZ(Array.isArray(tipos)&&tipos.every(id=>typeof id==='string'&&Object.hasOwn(this.identidades,id)),'Desbloqueo de planta desconocida');
  for(const id of tipos)this.disponibles.add(this.identidades[id]);
 }
 private validarSemillas(semillas:readonly string[]):ResultadoAsignacionPvZ|null{
  if(!Array.isArray(semillas)||semillas.length>10||semillas.some(id=>typeof id!=='string'||!Object.hasOwn(this.identidades,id))||new Set(semillas.map(id=>this.identidades[id])).size!==semillas.length)return{ok:false,motivo:'semillas'};
  const bloqueada=semillas.find(id=>!this.disponibles.has(this.identidades[id]));return bloqueada?{ok:false,motivo:'bloqueada',tipo:bloqueada}:null;
 }
 /** La revisión hace indivisible cada cambio respecto a los demás comandos del anfitrión. */
 asignar(zona:string,semillas:readonly string[],revision=this._revision):ResultadoAsignacionPvZ{
  if(revision!==this._revision)return{ok:false,motivo:'revision'};
  const z=this.zonas.get(zona);if(!z)return{ok:false,motivo:'zona'};
  if(z.motor)return{ok:false,motivo:'activa',zona};
  const error=this.validarSemillas(semillas);if(error)return error;
  for(const tipo of semillas){const propietaria=this.propietaria(tipo);if(propietaria&&propietaria!==zona)return{ok:false,motivo:'ocupada',tipo,zona:propietaria};}
  z.semillas=[...semillas];return{ok:true,revision:++this._revision};
 }
 trasladar(tipo:string,origen:string,destino:string,revision=this._revision):ResultadoAsignacionPvZ{
  if(revision!==this._revision)return{ok:false,motivo:'revision'};
  const a=this.zonas.get(origen),b=this.zonas.get(destino);
  if(!a||!b||origen===destino)return{ok:false,motivo:'zona'};
  if(a.motor||b.motor)return{ok:false,motivo:'activa',zona:a.motor?origen:destino};
  if(!Object.hasOwn(this.identidades,tipo))return{ok:false,motivo:'semillas'};
  const real=a.semillas.find(id=>this.identidades[id]===this.identidades[tipo]);if(!real)return{ok:false,motivo:'semillas'};
  const semillas=[...b.semillas,real],error=this.validarSemillas(semillas);if(error)return error;
  a.semillas=a.semillas.filter(id=>id!==real);b.semillas=semillas;return{ok:true,revision:++this._revision};
 }
 iniciar(zona:string,nivel:DefNivel,opciones:Omit<OpcionesMotorPvZ,'semillas'|'sinOleadas'>={}){
  const z=this.zonas.get(zona);if(!z||z.motor||!z.semillas.length||nivel.tipo!=='normal'||nivel.minijuego||nivel.cinta)return false;
  // Crear antes de modificar la zona: una configuración rechazada deja sus reservas intactas.
  const motor=new MotorPvZ(nivel,{...opciones,semillas:z.semillas,sinOleadas:false},this.registros);
  z.motor=motor;return true;
 }
 ordenar(zona:string,orden:OrdenPvZ){if(this._pausada)return false;return this.zonas.get(zona)?.motor?.ordenar(orden)??false;}
 /** Un paso común; ni mirar un mapa ni cambiar de frente detiene los otros tableros. */
 paso():EventoDefensaPvZ[]{
  if(this._pausada)return[];this._pasos++;const resultado:EventoDefensaPvZ[]=[];
  for(const[id,z]of [...this.zonas].sort(([a],[b])=>a<b?-1:a>b?1:0)){
   const m=z.motor;if(!m)continue;
   const eventos=m.consumirEventos();m.paso();eventos.push(...m.consumirEventos());if(eventos.length)resultado.push({zona:id,eventos});
  }
  return resultado;
 }
 avanzar(pasos:number){exigirPvZ(enteroPvZ(pasos,0,600),'Pasos de defensas inválidos');const eventos:EventoDefensaPvZ[]=[];for(let i=0;i<pasos;i++)eventos.push(...this.paso());return eventos;}
 exportar():InstantaneaDefensasPvZ{return structuredClone({version:1,pasos:this._pasos,pausada:this._pausada,revision:this._revision,visible:this._visible,desbloqueadas:[...this.disponibles].sort(),identidades:this.identidades,zonas:[...this.zonas].map(([id,z])=>({id,semillas:z.semillas,partida:z.motor?.exportar()??null}))});}
 static restaurar(dato:unknown,registros:RegistrosPvZ={},identidades:Readonly<Record<string,string>>={}):DefensasConquistaPvZ{
  arbolPvZ(dato);exigirPvZ(objetoPvZ(dato)&&dato.version===1,'Versión de defensas incompatible');const s=structuredClone(dato)as unknown as InstantaneaDefensasPvZ;
  exigirPvZ(enteroPvZ(s.pasos)&&enteroPvZ(s.revision)&&typeof s.pausada==='boolean'&&(s.visible===null||idZona(s.visible))&&Array.isArray(s.zonas)&&s.zonas.every(z=>objetoPvZ(z))&&objetoPvZ(s.identidades));
  const gestor=new DefensasConquistaPvZ({zonas:s.zonas.map(z=>z.id),desbloqueadas:s.desbloqueadas,identidades},registros);
  for(const[id,canonico]of Object.entries(s.identidades))exigirPvZ(Object.hasOwn(gestor.identidades,id)&&gestor.identidades[id]===canonico,'Las identidades del catálogo han cambiado; conservar el archivo para migrarlo');
  for(const z of s.zonas){
   exigirPvZ(gestor.asignar(z.id,z.semillas).ok,'Reservas de plantas contradictorias');
   if(z.partida!==null){
    const m=MotorPvZ.restaurar(z.partida,registros);
    exigirPvZ(!z.partida.sinOleadas&&m.nivel.tipo==='normal'&&!m.nivel.cinta&&!m.nivel.minijuego&&canonicoPvZ(m.semillas)===canonicoPvZ(z.semillas)&&m.pasos<=s.pasos,'Partida ajena a la defensa');
    exigirPvZ(m.plantas.every(p=>z.semillas.includes(p.tipo)),'Planta sin reserva en el tablero');gestor.zonas.get(z.id)!.motor=m;
   }
  }
  exigirPvZ(gestor.seleccionar(s.visible));gestor._pasos=s.pasos;gestor._pausada=s.pausada;gestor._revision=s.revision;return gestor;
 }
}
