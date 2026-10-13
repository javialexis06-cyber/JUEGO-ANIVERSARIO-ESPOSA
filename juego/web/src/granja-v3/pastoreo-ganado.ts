import { sectorDeCelda } from './catalogo';
import { coordenadaRefugio } from './ganaderia';
import { celdaTransitable } from './transito';
import { dentroPastoreo } from './refugios';
import type { Animal, Edificio, EstadoGranja } from './estado';
export { dentroPastoreo } from './refugios';

type Punto={u:number;v:number};
type Nodo={u:number;v:number;g:number;f:number;padre?:Nodo};
type Busqueda={abiertos:Nodo[];costes:Map<string,number>;inicio:Nodo;mejor:Nodo;distancia:number;meta:Punto;desde:Punto;hasta:Punto;visitados:number};
type Ruta={puntos:Punto[];meta:string;reintento:number;trabajo?:Busqueda};
const RADIO=.21;
const dentroCorral=(p:Punto)=>p.u>=.3&&p.u<=3.7&&p.v>=4.3&&p.v<=7.7;
export function localRefugio(b:Edificio,x:number,z:number):Punto{
 const o=coordenadaRefugio(b,0,0),ang=-b.giro*Math.PI/2,c=Math.cos(ang),s=Math.sin(ang),dx=x-o.x,dz=z-o.z;
 return {u:dx*c-dz*s,v:dx*s+dz*c};
}
const ruido=(id:string,n:number)=>{let h=2166136261;for(const c of id)h=Math.imul(h^c.charCodeAt(0),16777619);h=Math.imul(h^(n+1),0x85ebca6b);return (h>>>0)/4294967296;};

/** Rutas de sesión: dos inicios y 64 pasos de búsqueda por cuadro, suelo compartido y cuerpos próximos por celdas. */
export class PastoreoGanado {
 private estado?:EstadoGranja;private revision=-1;private celdas=new Map<string,boolean>();
 private rutas=new Map<string,Ruta>();private presupuesto=0;private presupuestoNodos=0;
 private cuerpos=new Map<string,Map<string,{x:number;z:number;radio:number}>>();
 private hogares:Edificio[]=[];private edificios=new Map<string,Edificio>();private sectores=new Set<number>();
 private patios:{b:Edificio;x:number;z:number;maxX:number;maxZ:number}[]=[];
 private medidas={busquedas:0,nodos:0,celdas:0,cuerpos:0};
 estadisticas(){return {...this.medidas,rutas:this.rutas.size,pendientes:[...this.rutas.values()].filter(r=>r.trabajo).length,celdasCache:this.celdas.size};}
 limpiar(){this.estado=undefined;this.revision=-1;this.celdas.clear();this.rutas.clear();this.cuerpos.clear();}
 preparar(s:EstadoGranja,segundos:number,jugador?:{x:number;z:number}){
  if(this.estado!==s||this.revision!==s.revision){
   this.celdas.clear();if(this.estado!==s)this.rutas.clear();else for(const ruta of this.rutas.values()){if(ruta.trabajo){ruta.trabajo=undefined;ruta.puntos=[];}ruta.reintento=0;}
   this.estado=s;this.revision=s.revision;this.hogares=s.edificios.filter(b=>!!b.especie);this.edificios=new Map(this.hogares.map(b=>[b.id,b]));this.sectores=new Set(s.sectorIds);
   this.patios=this.hogares.map(b=>{const puntos=[[-RADIO,4-RADIO],[4+RADIO,4-RADIO],[-RADIO,8+RADIO],[4+RADIO,8+RADIO]].map(([u,v])=>coordenadaRefugio(b,u,v));return {b,x:Math.min(...puntos.map(p=>p.x)),z:Math.min(...puntos.map(p=>p.z)),maxX:Math.max(...puntos.map(p=>p.x)),maxZ:Math.max(...puntos.map(p=>p.z))};});
  }
  this.presupuesto=2;this.presupuestoNodos=64;this.medidas={busquedas:0,nodos:0,celdas:0,cuerpos:0};this.cuerpos.clear();
  const vivos=new Set(s.animales.map(a=>a.id));for(const id of this.rutas.keys())if(!vivos.has(id))this.rutas.delete(id);
  for(const ruta of this.rutas.values())ruta.reintento=Math.max(0,ruta.reintento-Math.min(segundos,.25));
  for(const a of s.animales)if(a.rutina&&a.rutina.lugar!=='refugio'){const b=this.edificios.get(a.edificioId);if(b){const p=coordenadaRefugio(b,a.rutina.u,a.rutina.v);this.ponerCuerpo(a.id,p.x,p.z,RADIO);}}
  for(const a of s.compania.animales)if(a.posicion.zona==='granja')this.ponerCuerpo(a.id,a.posicion.x,a.posicion.z,a.tipo==='caballo'?.45:.2);
  if(jugador&&!s.interior)this.ponerCuerpo('jugador',jugador.x,jugador.z,s.compania.montada?.45:.24);
 }
 private ponerCuerpo(id:string,x:number,z:number,radio:number){const k=Math.floor(x)+','+Math.floor(z);let c=this.cuerpos.get(k);if(!c){c=new Map();this.cuerpos.set(k,c);}c.set(id,{x,z,radio});}
 private cuerpoLibre(id:string,x:number,z:number){const xx=Math.floor(x),zz=Math.floor(z);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const [otro,p] of this.cuerpos.get((xx+dx)+','+(zz+dz))??[]){this.medidas.cuerpos++;if(otro!==id&&Math.hypot(x-p.x,z-p.z)<RADIO+p.radio)return false;}return true;}
 private libre(s:EstadoGranja,b:Edificio,p:Punto){
  if(!dentroPastoreo(p))return false;const q=coordenadaRefugio(b,p.u,p.v);
  for(const [dx,dz] of [[-RADIO,-RADIO],[RADIO,-RADIO],[-RADIO,RADIO],[RADIO,RADIO]]){
   const x=Math.floor(q.x+dx),z=Math.floor(q.z+dz),k=x+','+z;if(!this.sectores.has(sectorDeCelda(x,z)?.id??-1))return false;
   if(!this.celdas.has(k)){if(this.celdas.size>=8192)this.celdas.delete(this.celdas.keys().next().value!);this.celdas.set(k,celdaTransitable(s,x,z,'granja'));this.medidas.celdas++;}if(!this.celdas.get(k))return false;
  }
  // El corral existente tiene pasos laterales entre v=6 y v=7. El resto de su cerca sigue siendo sólido.
  for(const patio of this.patios){if(q.x<patio.x||q.x>patio.maxX||q.z<patio.z||q.z>patio.maxZ)continue;const l=localRefugio(patio.b,q.x,q.z),u=l.u,v=l.v;
   if(u>=-RADIO&&u<=4+RADIO&&(Math.abs(v-4)<RADIO||Math.abs(v-8)<RADIO))return false;
   if(v>=4-RADIO&&v<=8+RADIO&&(Math.abs(u)<RADIO||Math.abs(u-4)<RADIO)&&!(v>=6+RADIO&&v<=7-RADIO))return false;
  }return true;
 }
 private segmento(s:EstadoGranja,b:Edificio,de:Punto,a:Punto){const n=Math.max(1,Math.ceil(Math.hypot(a.u-de.u,a.v-de.v)/.12));for(let i=1;i<=n;i++)if(!this.libre(s,b,{u:de.u+(a.u-de.u)*i/n,v:de.v+(a.v-de.v)*i/n}))return false;return true;}
 private iniciar(de:Punto,a:Punto):Busqueda{
  this.presupuesto--;this.medidas.busquedas++;
  const meta={u:Math.round(a.u*2),v:Math.round(a.v*2)},inicio:Nodo={u:Math.round(de.u*2),v:Math.round(de.v*2),g:0,f:0};
  return {meta,inicio,abiertos:[inicio],costes:new Map([[inicio.u+','+inicio.v,0]]),mejor:inicio,distancia:Infinity,desde:{u:de.u,v:de.v},hasta:a,visitados:0};
 }
 private buscar(s:EstadoGranja,b:Edificio,t:Busqueda):Punto[]|undefined{
  const clave=(p:Punto)=>p.u+','+p.v,{abiertos,costes,inicio,meta}=t;let encontrado=false;
  while(abiertos.length&&t.visitados<384&&this.presupuestoNodos>0){
   this.presupuestoNodos--;t.visitados++;
   let indice=0;for(let k=1;k<abiertos.length;k++)if(abiertos[k].f<abiertos[indice].f)indice=k;
   const actual=abiertos.splice(indice,1)[0];if(actual.g!==costes.get(clave(actual)))continue;this.medidas.nodos++;
   const d=Math.hypot(actual.u-meta.u,actual.v-meta.v);if(d<t.distancia){t.distancia=d;t.mejor=actual;}if(d===0){encontrado=true;t.mejor=actual;break;}
   for(const [du,dv] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const u=actual.u+du,v=actual.v+dv,g=actual.g+1,k=u+','+v;if(g>=(costes.get(k)??Infinity))continue;
    const desde=actual===inicio?t.desde:{u:actual.u/2,v:actual.v/2},hasta={u:u/2,v:v/2};if(!this.segmento(s,b,desde,hasta))continue;
    const n:Nodo={u,v,g,f:g+Math.abs(u-meta.u)+Math.abs(v-meta.v),padre:actual};costes.set(k,g);abiertos.push(n);
   }
  }
  if(!encontrado&&abiertos.length&&t.visitados<384)return;
  const puntos:Punto[]=[];for(let n=t.mejor;n.padre;n=n.padre)puntos.push({u:n.u/2,v:n.v/2});puntos.reverse();
  if(encontrado&&this.segmento(s,b,puntos.at(-1)??t.desde,t.hasta))puntos.push(t.hasta);return puntos;
 }
 /** true significa que esta rutina fue atendida; la rutina clásica no debe volver a moverla. */
 paso(s:EstadoGranja,b:Edificio,a:Animal,dt:number,exterior:boolean,destinoCorral?:Punto):boolean{
  const r=a.rutina!;if(r.lugar==='refugio')return false;if(s.interior)return r.lugar==='campo';
  const salir=!destinoCorral&&b.pastoreoLibre===true&&exterior&&a.cuidado.illnessSince===null;
  if(r.lugar==='corral'&&!salir&&!destinoCorral)return false;
  const volver=!salir;let objetivo:Punto;
  // La sed vuelve primero por el paso del corral y luego va al cuenco. Usa el mismo presupuesto.
  if(volver)objetivo=destinoCorral&&r.lugar==='corral'?destinoCorral:{u:3.3,v:6.5};
  else if(r.lugar==='corral')objetivo={u:4.6,v:6.5};
  else{
   if(r.espera>0){r.espera=Math.max(0,r.espera-dt);r.actividad=b.pasto>0?'pastorear':'descansar';return true;}
   if(Math.hypot(r.u-r.objetivoU,r.v-r.objetivoV)<.08){
    let elegido:Punto|undefined;for(let i=0;i<8;i++){r.paso=(r.paso+1)%1_000_000_001;const ang=ruido(a.id,r.paso*2)*Math.PI*2,dist=3+ruido(a.id,r.paso*2+1)*5,p={u:2+Math.cos(ang)*dist,v:6.5+Math.sin(ang)*dist};if(!dentroCorral(p)&&this.libre(s,b,p)){elegido=p;break;}}
    if(!elegido){r.espera=2;r.actividad='descansar';return true;}r.objetivoU=elegido.u;r.objetivoV=elegido.v;
   }objetivo={u:r.objetivoU,v:r.objetivoV};
  }
  const meta=b.id+':'+b.x+','+b.z+','+b.giro+':'+objetivo.u+','+objetivo.v;let ruta=this.rutas.get(a.id);
  if(!ruta||ruta.meta!==meta){if(this.presupuesto<=0){r.actividad='esperar';return true;}ruta={puntos:[],meta,reintento:2,trabajo:this.iniciar(r,objetivo)};this.rutas.set(a.id,ruta);}
  if(ruta.trabajo){const puntos=this.buscar(s,b,ruta.trabajo);if(puntos===undefined){r.actividad='esperar';return true;}ruta.puntos=puntos;ruta.trabajo=undefined;ruta.reintento=2;}
  if(!ruta.puntos.length){
   r.actividad='esperar';if(ruta.reintento<=0){this.rutas.delete(a.id);if(!volver&&r.lugar==='campo'){r.objetivoU=r.u;r.objetivoV=r.v;}}return true;
  }
  const p=ruta.puntos[0],du=p.u-r.u,dv=p.v-r.v,d=Math.hypot(du,dv),vel=['gallina','pato','conejo'].includes(a.especie)?.55:.38,dist=Math.min(d,vel*dt);
  const siguiente=d>.001?{u:r.u+du/d*dist,v:r.v+dv/d*dist}:p,q=coordenadaRefugio(b,siguiente.u,siguiente.v);
  if(!this.segmento(s,b,r,siguiente)||!this.cuerpoLibre(a.id,q.x,q.z)){r.actividad='esperar';if(ruta.reintento<=0)this.rutas.delete(a.id);return true;}
  const anterior=coordenadaRefugio(b,r.u,r.v);this.cuerpos.get(Math.floor(anterior.x)+','+Math.floor(anterior.z))?.delete(a.id);this.ponerCuerpo(a.id,q.x,q.z,RADIO);
  r.u=siguiente.u;r.v=siguiente.v;r.direccion=Math.atan2(du,dv);r.actividad='caminar';if(d<=dist+.001)ruta.puntos.shift();
  if(r.lugar==='corral'&&!dentroCorral(r)){r.lugar='campo';r.objetivoU=objetivo.u;r.objetivoV=objetivo.v;}
  if(volver&&dentroCorral(r)&&Math.hypot(r.u-objetivo.u,r.v-objetivo.v)<.1){r.lugar='corral';r.objetivoU=r.u;r.objetivoV=r.v;r.espera=0;this.rutas.delete(a.id);}
  else if(!volver&&r.lugar==='campo'&&Math.hypot(r.u-objetivo.u,r.v-objetivo.v)<.08){r.objetivoU=r.u;r.objetivoV=r.v;r.espera=2+ruido(a.id,r.paso+19)*4;this.rutas.delete(a.id);}
  return true;
 }
}
