// Reglas y decisiones de los minijuegos; movimiento, derrapes, saltos y armas siguen usando el motor de carrera.
import { angulo } from './pista';
import type { Cosa, Evento, Kart, Sim } from './sim';

export type TipoMinijuego = 'globos' | 'monedas' | 'anillos' | 'trucos';
export const MINIJUEGOS: Record<TipoMinijuego,{nombre:string;reglas:string}> = {
 globos:{nombre:'Batalla de globos',reglas:'Tres globos. Usa objetos y esquiva los golpes. Gana quien conserve más globos; desempatan los globos reventados.'},
 monedas:{nombre:'Caza de monedas',reglas:'Recoge monedas por la arena. Los golpes hacen soltar hasta tres. Gana quien conserve más al terminar.'},
 anillos:{nombre:'Carrera de anillos',reglas:'Pasa por los aros dorados: un punto por aro y vuelta. Compites con los mismos siete rivales.'},
 trucos:{nombre:'Festival de trucos',reglas:'Un truco aterrizado vale tres puntos. Soltar un miniturbo suma su nivel de chispas. Gana la mayor puntuación.'},
};
export interface OpcionesMinijuego { tipo: TipoMinijuego; duracion?: number }
export interface Recogible {
 id:number; tipo:'moneda'|'aro'; x:number;y:number;z:number;rumbo:number;s:number;lat:number;
 vuelve:number; pasadas:number[];
 caduca?:number;
}
export interface ResumenMinijuego { tipo:TipoMinijuego;puntos:number[];globos:number[];duracion:number }
export interface FotoMinijuego { puntos:number[];globos:number[];recogibles:Recogible[];orden:number[] }

const limitar=(x:number,a=-1,b=1)=>Math.max(a,Math.min(b,x));

export class Minijuego {
 readonly tipo:TipoMinijuego;
 readonly duracion:number;
 readonly globos:number[];
 readonly puntos:number[];
 readonly recogibles:Recogible[]=[];
 private ultimoPunto:number[];
 private siguienteId=1;
 private impactos:number[];
 private eliminadosEn:number[];

 constructor(readonly sim:Sim,op:OpcionesMinijuego,private rnd:()=>number) {
  this.tipo=op.tipo;this.duracion=Number.isFinite(op.duracion)?limitar(op.duracion!,30,300):120;
  const n=sim.karts.length;
  this.globos=Array(n).fill(3);this.puntos=Array(n).fill(0);this.ultimoPunto=Array(n).fill(Infinity);
  this.impactos=Array(n).fill(0);this.eliminadosEn=Array(n).fill(Infinity);
  if(this.esArena) {
   if(!sim.pista.d.arena)throw Error('El minijuego necesita una arena');
   sim.cajas=[];
   sim.karts.forEach((k,i)=>{
    const a=i/n*Math.PI*2, r=sim.pista.d.arena!.radio-11;
    k.x=Math.cos(a)*r;k.z=Math.sin(a)*r;k.y=.4;k.h=k.m=Math.atan2(-k.x,-k.z);k.prog=0;
    sim.pista.lugar(k.x,k.z,null,k.lugar);
    const x=Math.cos(a)*(r-7),z=Math.sin(a)*(r-7);
    const l=sim.pista.lugar(x,z,null);
    sim.cajas.push({x,y:1.55,z,s:l.s,lat:l.lat,vuelve:0});
   });
   if(this.tipo==='monedas')for(let j=0;j<36;j++){const q=this.puntoLibre();this.recogibles.push(this.recogible('moneda',q.x,1.25,q.z));}
  } else {
   sim.cajas=[];
   if(this.tipo==='anillos')for(let j=0;j<20;j++){
    const s=sim.pista.n*(j+.5)/20, lat=[-1,1,0,.6,-.6][j%5]*Math.min(3.7,sim.pista.hw[sim.pista.idx(s)]*.5),q=sim.pista.punto(s,lat);
    const c=this.recogible('aro',q.x,q.y+2.1,q.z);c.s=s;c.lat=lat;c.rumbo=sim.pista.rumbo(s);this.recogibles.push(c);
   }
  }
 }
 get esArena(){return this.tipo==='globos'||this.tipo==='monedas';}
 eliminado(k:Kart){return this.tipo==='globos'&&this.globos[k.i]<=0;}
 get restante(){return Math.max(0,this.duracion-Math.max(0,this.sim.t));}
 resumen():ResumenMinijuego{return {tipo:this.tipo,puntos:[...this.puntos],globos:[...this.globos],duracion:Math.max(0,this.sim.t)};}
 foto():FotoMinijuego{return {puntos:[...this.puntos],globos:[...this.globos],recogibles:structuredClone(this.recogibles),orden:[...this.sim.orden]};}
 recibir(f:FotoMinijuego){
  const s=this.sim,n=s.karts.length;if(s.autoridad||f.puntos.length!==n||f.globos.length!==n||f.orden.length!==n)return;
  this.puntos.splice(0,n,...f.puntos);this.globos.splice(0,n,...f.globos);
  this.recogibles.splice(0,this.recogibles.length,...structuredClone(f.recogibles));
  s.orden=[...f.orden];s.orden.forEach((i,p)=>{s.karts[i].puesto=p;if(this.eliminado(s.karts[i])){s.karts[i].invisible=99999;s.karts[i].v=0;}});
 }

 /** Las maniobras de cada conductor se registran una vez en el anfitrión, con las mismas reglas locales. */
 maniobra(ev:Evento){
  if(!this.sim.autoridad||this.tipo!=='trucos'||this.sim.t<0||this.sim.terminada)return;
  if(ev.t==='aterriza'&&ev.truco)this.sumar(ev.k,3);
  if(ev.t==='turbo'&&ev.por==='derrape')this.sumar(ev.k,ev.nivel);
 }

 private recogible(tipo:Recogible['tipo'],x:number,y:number,z:number):Recogible{
  return {id:this.siguienteId++,tipo,x,y,z,rumbo:0,s:0,lat:0,vuelve:0,pasadas:Array(this.sim.karts.length).fill(-999)};
 }
 private puntoLibre(){
  const arena=this.sim.pista.d.arena!;
  for(let j=0;j<100;j++){
   const a=this.rnd()*Math.PI*2,r=Math.sqrt(this.rnd())*(arena.radio-6),x=Math.cos(a)*r,z=Math.sin(a)*r;
   if(arena.obstaculos.every(o=>Math.hypot(x-o.x,z-o.z)>o.r+3))return {x,z};
  }
  return {x:32,z:0};
 }
 /** El piso y las colisiones conservan las dimensiones exportadas por Blender. */
 contener(k:Kart){
  const a=this.sim.pista.d.arena;if(!a)return;
  const r=Math.hypot(k.x,k.z),limite=a.radio-1.4;
  if(r>limite){k.x*=limite/r;k.z*=limite/r;k.v*=.75;}
  for(const o of a.obstaculos){
   const dx=k.x-o.x,dz=k.z-o.z,d=Math.hypot(dx,dz),lim=o.r+1.35;
   if(k.y<.4+o.h&&d<lim){const n=d||1;k.x=o.x+(d?dx/n:1)*lim;k.z=o.z+(d?dz/n:0)*lim;k.v*=.75;}
  }
 }
 proyectil(c:Cosa){
  const a=this.sim.pista.d.arena;if(!a)return;
  for(const o of a.obstaculos){
   const dx=c.x-o.x,dz=c.z-o.z,d=Math.hypot(dx,dz);
   if(c.y>.4+o.h||d>o.r+.5)continue;
   if(c.tipo==='brasa'){
    const nx=dx/(d||1),nz=dz/(d||1),vx=Math.sin(c.h),vz=Math.cos(c.h),dot=vx*nx+vz*nz;
    c.h=Math.atan2(vx-2*dot*nx,vz-2*dot*nz);c.x=o.x+nx*(o.r+.7);c.z=o.z+nz*(o.r+.7);c.vida-=.3;
   }else c.vida=0;
  }
 }
 /** Máquina para zonas libres: busca cajas, rivales o monedas y evita las columnas. */
 pilotar(k:Kart){
  const s=this.sim,e=k.entrada;
  if(this.eliminado(k)){e.acel=0;e.giro=0;e.objeto=false;return;}
  let objetivo:{x:number;z:number}|undefined;
  const cerca=<T extends {x:number;z:number}>(xs:T[])=>xs.reduce<T|undefined>((a,b)=>!a||(b.x-k.x)**2+(b.z-k.z)**2<(a.x-k.x)**2+(a.z-k.z)**2?b:a,undefined);
  const enemigo=cerca(s.karts.filter(x=>x!==k&&!this.eliminado(x)));
  const caja=cerca(s.cajas.filter(c=>c.vuelve<=0));
  if(this.tipo==='monedas')objetivo=cerca(this.recogibles.filter(c=>c.vuelve<=0));
  if(!k.objeto&&caja&&(!objetivo||Math.hypot(caja.x-k.x,caja.z-k.z)<10))objetivo=caja;
  if(!objetivo)objetivo=enemigo;
  if(!objetivo)objetivo={x:0,z:0};
  let tx=objetivo.x,tz=objetivo.z;
  for(const o of s.pista.d.arena!.obstaculos){
   const dx=tx-k.x,dz=tz-k.z,len=dx*dx+dz*dz;
   const f=len?limitar(((o.x-k.x)*dx+(o.z-k.z)*dz)/len,0,1):0;
   if(f<=0||Math.hypot(k.x+dx*f-o.x,k.z+dz*f-o.z)>o.r+3)continue;
   const a=Math.atan2(k.z-o.z,k.x-o.x),cruz=(k.x-o.x)*(tz-o.z)-(k.z-o.z)*(tx-o.x);
   const giro=cruz===0?(k.i%2?1:-1):cruz<0?-1:1;
   tx=o.x+Math.cos(a+giro*.85)*(o.r+5);tz=o.z+Math.sin(a+giro*.85)*(o.r+5);break;
  }
  const dx=tx-k.x,dz=tz-k.z,d=Math.hypot(dx,dz),meta=Math.atan2(dx,dz),dif=angulo(meta-k.h);
  const reversa=d<14&&Math.abs(dif)>1.7;
  e.giro=reversa?-limitar(angulo(meta+Math.PI-k.h)*2.7):limitar(dif*2.7);
  const deseada=Math.abs(dif)>1?9:Math.min(25,8+d*.65);
  e.acel=reversa?-1:k.v>deseada?0:1;e.derrape=false;e.atras=false;e.adelante=false;e.objeto=false;
  if(!k.suelo&&k.trucoListo)e.derrape=true;
  if(k.objeto&&k.ruleta<=0&&s.t>1){
   const ofensivo=k.objeto==='brasa'||k.objeto==='semilla'||k.objeto==='ceniza';
   const alineado=enemigo&&Math.abs(angulo(Math.atan2(enemigo.x-k.x,enemigo.z-k.z)-k.h))<.3;
   e.objeto=!ofensivo||!!alineado||Math.sin(s.t*.7+k.i)>.95;
   e.adelante=!!alineado&&(k.objeto==='semilla'||k.objeto==='ceniza');
  }
 }
 carril(k:Kart):number|null{
  if(this.tipo!=='anillos')return null;
  const p=this.sim.pista;
  const siguiente=this.recogibles.filter(c=>c.pasadas[k.i]!==k.vuelta&&p.delta(k.lugar.s,c.s)>0&&p.delta(k.lugar.s,c.s)<55)
   .sort((a,b)=>p.delta(k.lugar.s,a.s)-p.delta(k.lugar.s,b.s))[0];
  return siguiente?.lat??null;
 }
 private sumar(k:number,n:number){this.puntos[k]+=n;this.ultimoPunto[k]=this.sim.t;}
 actualizar(eventos:Evento[],dt:number){
  const s=this.sim;if(!s.autoridad||s.t<0||s.terminada)return;
  for(const ev of eventos){
   if(ev.t==='golpe'){
    this.impactos[ev.k]++;
    if(this.tipo==='globos'&&this.globos[ev.k]>0){
     this.globos[ev.k]--;if(ev.por>=0&&ev.por!==ev.k)this.sumar(ev.por,1);
     if(this.globos[ev.k]===0){this.eliminadosEn[ev.k]=s.t;s.karts[ev.k].invisible=99999;s.karts[ev.k].v=0;}
     s.eventos.push({t:'globo',k:ev.k,por:ev.por,quedan:this.globos[ev.k]});
    }
    if(this.tipo==='monedas'){
     const perdidas=Math.min(3,this.puntos[ev.k]);this.puntos[ev.k]-=perdidas;
     for(let j=0;j<perdidas;j++){
      const k=s.karts[ev.k],a=this.rnd()*Math.PI*2,r=4+this.rnd()*2,lim=s.pista.d.arena!.radio-4;
      let x=k.x+Math.cos(a)*r,z=k.z+Math.sin(a)*r;
      const d=Math.hypot(x,z);if(d>lim){x*=lim/d;z*=lim/d;}
      if(s.pista.d.arena!.obstaculos.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+2)){const q=this.puntoLibre();x=q.x;z=q.z;}
      const c=this.recogible('moneda',x,1.25,z);c.vuelve=.8;c.caduca=s.t+20;this.recogibles.push(c);
     }
    }
   }
   this.maniobra(ev);
  }
  for(const c of this.recogibles){
   if(c.vuelve>0){c.vuelve=Math.max(0,c.vuelve-dt);continue;}
   for(const k of s.karts){
    if(k.cayendo>0||this.eliminado(k)||c.tipo==='aro'&&c.pasadas[k.i]===k.vuelta)continue;
    if(Math.hypot(c.x-k.x,c.z-k.z)>2.8||Math.abs(k.y+1.1-c.y)>2.8)continue;
    this.sumar(k.i,1);s.eventos.push({t:'recoge',k:k.i,tipo:c.tipo});
    if(c.tipo==='aro')c.pasadas[k.i]=k.vuelta;
    else {if(c.caduca!==undefined)c.caduca=s.t;else c.vuelve=10;break;}
   }
  }
  for(let j=this.recogibles.length-1;j>=0;j--)if(this.recogibles[j].caduca!==undefined&&this.recogibles[j].caduca!<=s.t)this.recogibles.splice(j,1);
  this.ordenar();
  if(s.t>=this.duracion||this.tipo==='globos'&&this.globos.filter(n=>n>0).length<=1)this.finalizar();
 }
 ordenar(){
  const s=this.sim;
  if(!s.autoridad){if(s.orden.length!==s.karts.length)s.orden=s.karts.map(k=>k.i);return;}
  s.orden=s.karts.map(k=>k.i).sort((a,b)=>(this.tipo==='globos'?this.globos[b]-this.globos[a]:0)||this.puntos[b]-this.puntos[a]
   ||this.eliminadosEn[b]-this.eliminadosEn[a]||this.impactos[a]-this.impactos[b]||this.ultimoPunto[a]-this.ultimoPunto[b]||a-b);
  s.orden.forEach((i,n)=>{s.karts[i].puesto=n;});
 }
 private finalizar(){
  const s=this.sim;this.ordenar();s.terminada=true;
  for(const i of s.orden){const k=s.karts[i];k.terminado=true;k.tiempo=s.t;s.eventos.push({t:'meta',k:i,puesto:k.puesto+1,tiempo:s.t});}
 }
}
