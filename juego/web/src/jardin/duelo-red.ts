import type { JugadorSala,Sala } from '../salas/tipos';
import { MotorDuelo,ordenSegura,type Bando,type EstadoDuelo,type OrdenDuelo } from './duelo-motor';

export interface ConfigDuelo {sesion:string;semilla:number;plantas:string;zombis:string}
export interface FotoDuelo {sesion:string;n:number;estado:EstadoDuelo;pausas:string[];listos:string[];corte:boolean;revancha:string[]}
export function configSegura(v:unknown,sala:Sala):v is ConfigDuelo {
 if(!v||typeof v!=='object')return false;const c=v as ConfigDuelo;
 return typeof c.sesion==='string'&&c.sesion.length>=8&&c.sesion.length<=80&&Number.isSafeInteger(c.semilla)&&
  c.plantas!==c.zombis&&sala.jugadores.length===2&&[c.plantas,c.zombis].every(id=>sala.jugadores.some(j=>j.id===id));
}
/** Solo interpola la vista; nunca concede daño, recursos, impactos o una victoria. */
export class EspejoDuelo {
 private anterior:FotoDuelo|null=null;private actual:FotoDuelo|null=null;private llegada=0;
 constructor(readonly sesion:string){}
 recibir(f:FotoDuelo,ahora=performance.now()) {
  if(f?.sesion!==this.sesion||!Number.isSafeInteger(f.n)||f.n<0||this.actual&&f.n<=this.actual.n||!estadoSeguro(f.estado))return false;
  if(!Array.isArray(f.pausas)||!Array.isArray(f.listos)||!Array.isArray(f.revancha)||typeof f.corte!=='boolean')return false;
  this.anterior=this.actual;this.actual=structuredClone(f);this.llegada=ahora;return true;
 }
 get foto(){return this.actual;}
 ver(ahora=performance.now()):EstadoDuelo|null {
  const a=this.actual;if(!a)return null;
  const m=structuredClone(a.estado),b=this.anterior;
  if(!b||a.pausas.length||a.corte||m.terminado||a.listos.length<2)return m;
  const dt=a.estado.t-b.estado.t;
  if(dt<=0||dt>.6)return m;
  const alpha=Math.min(1,Math.max(0,(ahora-this.llegada)/100));
  for(const k of ['zombis','semillas'] as const){const prev=new Map(b.estado[k].map(o=>[o.id,o.x]));for(const o of m[k]){const x=prev.get(o.id);if(x!==undefined)o.x=x+(o.x-x)*alpha;}}
  m.t=b.estado.t+(m.t-b.estado.t)*alpha;return m;
 }
}
function estadoSeguro(e:EstadoDuelo):boolean {
 const finito=(v:unknown)=>typeof v==='number'&&Number.isFinite(v);
 if(!e||!finito(e.t)||e.t<0||e.t>181||!finito(e.luces)||e.luces<0||!finito(e.niebla)||e.niebla<0||e.niebla>600||!['','gano','perdio'].includes(e.terminado))return false;
 if(!Array.isArray(e.guardianes)||e.guardianes.length!==5||!e.guardianes.every(x=>typeof x==='boolean'))return false;
 for(const k of ['plantas','zombis','semillas','soles'] as const){if(!Array.isArray(e[k])||e[k].length>300)return false;for(const o of e[k])if(!Number.isSafeInteger(o.id)||!Number.isInteger(o.fila)||o.fila<0||o.fila>=5||Object.values(o).some(v=>typeof v==='number'&&!Number.isFinite(v)))return false;}
 return !!e.recargas&&typeof e.recargas==='object'&&!!e.reclutas&&typeof e.reclutas==='object';
}
export class RedDuelo {
 config:ConfigDuelo;
 motor:MotorDuelo|null;
 espejo:EspejoDuelo;
 aviso='';
 private pausas=new Set<string>();private listos=new Set<string>();private votos=new Set<string>();
 private secuencia=0;private recibidas=new Map<string,number>();private n=0;private envio=-Infinity;private finalEnviado=false;
 private quitar:(()=>void)[]=[];private cerrada=false;
 constructor(readonly sala:Sala,cfg:ConfigDuelo){
  this.config=cfg;this.motor=sala.soyAnfitrion?new MotorDuelo(cfg.semilla):null;this.espejo=new EspejoDuelo(cfg.sesion);
  this.quitar.push(
   sala.al('jd:orden',(d,de)=>this.recibirOrden(d,de)),
   sala.al('jd:listo',(d,de)=>{if(this.sala.soyAnfitrion&&this.valido(d,de)){this.listos.add(de.id);this.publicar(true);}}),
   sala.al('jd:foto',(d,de)=>{if(!this.sala.soyAnfitrion&&de.puesto===0)this.espejo.recibir(d as FotoDuelo);}),
   sala.al('jd:nueva',(d,de)=>{if(!this.sala.soyAnfitrion&&de.puesto===0&&configSegura(d,sala)&&d.sesion!==this.config.sesion){this.reiniciar(d);this.listo();}}),
   sala.alCorte(()=>{this.publicar(true);}),sala.alCambiar(()=>{this.publicar(true);}),
   sala.alFin((_motivo,texto)=>{this.aviso=texto;this.cerrada=true;}),
  );
 }
 get bando():Bando{return this.config.plantas===this.sala.yo.id?'plantas':'zombis';}
 get corte(){return this.cerrada||this.sala.jugadores.length!==2||this.sala.jugadores.some(j=>!this.sala.conectado(j.id));}
 get foto():FotoDuelo|null{return this.sala.soyAnfitrion?this.fotoPropia():this.espejo.foto;}
 get pausada(){if(this.corte)return true;if(this.sala.soyAnfitrion)return this.pausas.size>0||this.listos.size<2;const f=this.espejo.foto;return !f||f.corte||f.pausas.length>0||f.listos.length<2;}
 get miPausa(){return this.foto?.pausas.includes(this.sala.yo.id)??false;}
 listo(){if(this.cerrada)return;if(this.sala.soyAnfitrion){this.listos.add(this.sala.yo.id);this.publicar(true);}else this.sala.mandar('jd:listo',{sesion:this.config.sesion});}
 ordenar(a:OrdenDuelo){this.peticion({orden:a});}
 pausar(si:boolean){this.peticion({pausa:si});}
 revancha(){this.peticion({revancha:true});}
 private peticion(datos:Record<string,unknown>){
  if(this.cerrada)return;const p={...datos,sesion:this.config.sesion,n:++this.secuencia};
  if(this.sala.soyAnfitrion)this.recibirOrden(p,this.sala.yo);else this.sala.mandar('jd:orden',p);
 }
 private valido(d:any,de:JugadorSala){return !this.cerrada&&d?.sesion===this.config.sesion&&this.sala.jugadores.some(j=>j.id===de.id);}
 private recibirOrden(d:any,de:JugadorSala){
  if(!this.sala.soyAnfitrion||!this.valido(d,de)||!Number.isSafeInteger(d.n)||d.n<=0||d.n>1e9||d.n<=(this.recibidas.get(de.id)??0))return;
  if(!ordenSegura(d.orden)&&typeof d.pausa!=='boolean'&&d.revancha!==true)return;
  this.recibidas.set(de.id,d.n);
  if(typeof d.pausa==='boolean'){if(d.pausa)this.pausas.add(de.id);else this.pausas.delete(de.id);}
  else if(d.revancha===true&&this.motor?.jardin.terminado){
   this.votos.add(de.id);
   if(this.votos.size===2){const cfg={...this.config,sesion:crypto.randomUUID(),semilla:this.config.semilla+1,plantas:this.config.zombis,zombis:this.config.plantas};this.reiniciar(cfg);this.sala.mandar('jd:nueva',cfg);this.listo();return;}
  }else if(!this.pausada)this.motor?.ordenar(this.config.plantas===de.id?'plantas':'zombis',d.orden);
  this.publicar(true);
 }
 private reiniciar(cfg:ConfigDuelo){this.config=cfg;this.motor=this.sala.soyAnfitrion?new MotorDuelo(cfg.semilla):null;this.espejo=new EspejoDuelo(cfg.sesion);this.pausas.clear();this.listos.clear();this.votos.clear();this.secuencia=0;this.recibidas.clear();this.n=0;this.envio=-Infinity;this.finalEnviado=false;}
 private fotoPropia():FotoDuelo|null {return this.motor?{sesion:this.config.sesion,n:this.n,estado:this.motor.estado(),pausas:[...this.pausas],listos:[...this.listos],corte:this.corte,revancha:[...this.votos]}:null;}
 publicar(fiable=false,ahora=performance.now()){
  if(!this.sala.soyAnfitrion||this.cerrada)return;
  const fin=!!this.motor?.jardin.terminado;
  if(!fiable&&!(fin&&!this.finalEnviado)&&ahora-this.envio<100)return;
  this.envio=ahora;this.n++;const f=this.fotoPropia();if(f)this.sala.mandar('jd:foto',f,{rapido:!(fiable||fin&&!this.finalEnviado)});if(fin)this.finalEnviado=true;
 }
 paso(){if(!this.pausada)this.motor?.paso();}
 estado(ahora=performance.now()){return this.motor?.estado()??this.espejo.ver(ahora);}
 soltar(){this.cerrada=true;for(const q of this.quitar)q();this.quitar=[];}
}
