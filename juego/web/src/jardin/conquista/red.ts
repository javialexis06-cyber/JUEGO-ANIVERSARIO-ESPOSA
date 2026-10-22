import type {Sala,JugadorSala} from '../../salas/tipos';
import {MotorConquista,estadoConquistaSeguro,ordenConquistaSegura} from './motor';
import {FICHAS_CONQUISTA} from './catalogo';
import type {Bando,EstadoConquista,OrdenConquista} from './tipos';
export interface ConfigRedConquista {sesion:string;plantas:string;zombis:string;semilla:number;version:1}
export function configRedSegura(c:unknown,s:Sala):c is ConfigRedConquista {const v=c as ConfigRedConquista;return!!v&&v.version===1&&typeof v.sesion==='string'&&v.sesion.length>=8&&v.sesion.length<=80&&Number.isSafeInteger(v.semilla)&&v.plantas!==v.zombis&&s.jugadores.length===2&&[v.plantas,v.zombis].every(id=>typeof id==='string'&&s.jugadores.some(j=>j.id===id));}
const ids=Object.keys(FICHAS_CONQUISTA);
/** El cable compacto evita repetir nombres de campos por cada unidad; el motor conserva toda su precisión. */
export function empaquetarConquista(s:EstadoConquista){const r=(n:number)=>Math.round(n*100)/100;return{...s,frentes:s.frentes.filter(f=>!f.final||s.t-f.inicio-f.t<8).map(f=>({...f,unidades:f.unidades.map(u=>[u.id,ids.indexOf(u.tipo),u.fila,r(u.x),Math.max(.01,r(u.vida)),r(u.armadura),r(u.reloj),r(u.lento),r(u.edad),r(u.especial)]),balas:f.balas.map(p=>[p.id,p.fila,r(p.x),r(p.dano),p.hielo?1:0,p.aereo?1:0])}))};}
export function desempaquetarConquista(v:unknown):EstadoConquista|null {try{const s=structuredClone(v) as any;if(!Array.isArray(s?.frentes))return null;for(const f of s.frentes){if(!Array.isArray(f.unidades)||f.unidades.length>72||!Array.isArray(f.balas)||f.balas.length>150)return null;f.unidades=f.unidades.map((u:any[])=>({id:u[0],tipo:ids[u[1]],bando:FICHAS_CONQUISTA[ids[u[1]]]?.bando,fila:u[2],x:u[3],vida:u[4],armadura:u[5],reloj:u[6],lento:u[7],edad:u[8],especial:u[9]}));f.balas=f.balas.map((p:any[])=>({id:p[0],bando:'plantas',fila:p[1],x:p[2],dano:p[3],velocidad:340,hielo:p[4]===1,aereo:p[5]===1}));}return estadoConquistaSeguro(s)?s:null;}catch{return null;}}
export class RedConquista {
 readonly motor:MotorConquista|null;private actual:EstadoConquista|null=null;private anterior:EstadoConquista|null=null;private llegada=0;private ultimo=-1;private n=0;private envio=-Infinity;private secuencia=0;private recibidas=new Map<string,number>();private listos=new Set<string>();private pausas=new Set<string>();private quitar:(()=>void)[]=[];cerrada=false;aviso='';
 constructor(readonly sala:Sala,readonly config:ConfigRedConquista){
  if(!configRedSegura(config,sala))throw Error('Configuración de sala incompatible');this.motor=sala.soyAnfitrion?new MotorConquista({modo:'pvp',ia:[],semilla:config.semilla}):null;
  this.quitar.push(sala.al('cq:orden',(d,de)=>this.recibir(d,de)),sala.al('cq:listo',(d:any,de)=>{if(sala.soyAnfitrion&&d?.sesion===config.sesion&&this.miembro(de)){this.listos.add(de.id);this.publicar(true);}}),sala.al('cq:foto',(d:any,de)=>{
   if(sala.soyAnfitrion||de.puesto!==0||d?.sesion!==config.sesion||!Number.isSafeInteger(d.n)||d.n<=this.ultimo||!Array.isArray(d.listos)||!Array.isArray(d.pausas)||d.listos.some((id:unknown)=>![config.plantas,config.zombis].includes(id as string))||d.pausas.some((id:unknown)=>![config.plantas,config.zombis].includes(id as string)))return;
   const estado=desempaquetarConquista(d.estado);if(!estado||estado.config.modo!=='pvp'||estado.config.semilla!==config.semilla||estado.config.ia.length)return;this.anterior=this.actual;this.actual=estado;this.ultimo=d.n;this.listos=new Set(d.listos);this.pausas=new Set(d.pausas);this.llegada=performance.now();
  }),sala.alCorte(()=>this.publicar(true)),sala.alCambiar(()=>this.publicar(true)),sala.alFin((_m,t)=>{this.cerrada=true;this.aviso=t;}));
 }
 private miembro(de:JugadorSala){return this.sala.jugadores.some(j=>j.id===de.id)&&[this.config.plantas,this.config.zombis].includes(de.id);}
 get bando():Bando{return this.sala.yo.id===this.config.plantas?'plantas':'zombis';}
 get corte(){return this.cerrada||this.sala.jugadores.length!==2||this.sala.jugadores.some(j=>!this.sala.conectado(j.id));}
 get pausada(){return this.corte||this.listos.size<2||this.pausas.size>0;}
 get miPausa(){return this.pausas.has(this.sala.yo.id);}
 listo(){if(this.sala.soyAnfitrion){this.listos.add(this.sala.yo.id);this.publicar(true);}else this.sala.mandar('cq:listo',{sesion:this.config.sesion});}
 ordenar(orden:OrdenConquista){this.peticion({orden});}
 pausar(si:boolean){this.peticion({pausa:si});}
 private peticion(d:Record<string,unknown>){if(this.cerrada)return;const mensaje={...d,sesion:this.config.sesion,n:++this.secuencia};if(this.sala.soyAnfitrion)this.recibir(mensaje,this.sala.yo);else this.sala.mandar('cq:orden',mensaje);}
 private recibir(d:any,de:JugadorSala){if(!this.sala.soyAnfitrion||this.cerrada||d?.sesion!==this.config.sesion||!this.miembro(de)||!Number.isSafeInteger(d.n)||d.n<1||d.n>1e9||d.n<=(this.recibidas.get(de.id)??0)||typeof d.pausa!=='boolean'&&!ordenConquistaSegura(d.orden))return;this.recibidas.set(de.id,d.n);if(typeof d.pausa==='boolean'){if(d.pausa)this.pausas.add(de.id);else this.pausas.delete(de.id);}else if(!this.pausada)this.motor?.ordenar(de.id===this.config.plantas?'plantas':'zombis',d.orden);this.publicar(true);}
 paso(){if(!this.pausada)this.motor?.paso();}
 estado(){return this.motor?.estado??this.actual;}
 vista(){const s=this.estado();if(!s||this.motor||!this.anterior||this.pausada)return s;const copia=structuredClone(s),a=Math.min(1,(performance.now()-this.llegada)/100);for(const f of copia.frentes){const anterior=this.anterior.frentes.find(v=>v.id===f.id);if(!anterior)continue;for(const u of f.unidades){const v=anterior.unidades.find(v=>v.id===u.id);if(v)u.x=v.x+(u.x-v.x)*a;}}return copia;}
 publicar(fiable=false){if(!this.motor||this.cerrada||!fiable&&performance.now()-this.envio<100)return;this.envio=performance.now();this.sala.mandar('cq:foto',{sesion:this.config.sesion,n:++this.n,estado:empaquetarConquista(this.motor.estado),listos:[...this.listos],pausas:[...this.pausas]},{rapido:!fiable&&!this.motor.estado.ganador});}
 soltar(){this.cerrada=true;for(const q of this.quitar)q();this.quitar=[];}
}
