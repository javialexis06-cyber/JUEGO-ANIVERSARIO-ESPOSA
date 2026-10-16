import { PLANTAS, ZOMBIS, type IdPlanta, type IdZombi, type NivelJardin } from './datos';
export interface Planta {id:number;tipo:IdPlanta;fila:number;col:number;vida:number;reloj:number}
export interface Zombi {id:number;tipo:IdZombi;fila:number;x:number;vida:number;lento:number;mordiendo:boolean}
export interface Semilla {id:number;tipo:IdPlanta;fila:number;x:number;dano:number}
export interface Luz {id:number;fila:number;x:number;valor:number;vida:number}
interface Aparicion {t:number;tipo:IdZombi;fila:number;oleada:number}
export class MotorJardin {
 readonly pasoFijo=1/30;readonly columnas=8;readonly nivel:NivelJardin;
 t=0;luces=225;oleada=0;terminado:''|'gano'|'perdio'='';eliminados=0;sembradas=0;
 plantas:Planta[]=[];zombis:Zombi[]=[];semillas:Semilla[]=[];soles:Luz[]=[];guardianes:boolean[];
 recargas:Record<string,number>={};eventos:{t:string;fila?:number;x?:number;tipo?:string}[]=[];
 private cola:Aparicion[]=[];private proximo=1;private rndEstado:number;private cieloT=6;
 constructor(nivel:NivelJardin,semilla=23){this.nivel=nivel;this.rndEstado=semilla>>>0||1;this.guardianes=Array(nivel.filas).fill(true);
  const i=['bienvenida','macetas','rocío','naranjos','llovizna','costuras','faroles','lavanda','luciernagas','tapiz','medianoche','amanecer'].indexOf(nivel.id);
  for(let o=0;o<nivel.oleadas;o++)for(let k=0;k<nivel.porOleada+Math.floor(o/2);k++){
   const tipo=nivel.tipos[this.n(nivel.tipos.length)],fila=this.n(nivel.filas);
   this.cola.push({t:22+o*30+k*2.8,tipo,fila,oleada:o+1});
  }
  if(i>=7)this.cola.push({t:22+(nivel.oleadas-1)*30+15,tipo:'grandote',fila:this.n(nivel.filas),oleada:nivel.oleadas});
  this.cola.sort((a,b)=>a.t-b.t);
 }
 private rnd(){let s=this.rndEstado;s^=s<<13;s^=s>>>17;s^=s<<5;this.rndEstado=s>>>0;return this.rndEstado/4294967296;}
 private n(n:number){return Math.floor(this.rnd()*n);}
 plantar(tipo:IdPlanta,fila:number,col:number){const p=PLANTAS[tipo];if(this.terminado||!p||!this.nivel.plantas.includes(tipo)||!Number.isInteger(fila)||fila<0||fila>=this.nivel.filas||!Number.isInteger(col)||col<0||col>=this.columnas||this.plantas.some(p=>p.fila===fila&&p.col===col)||this.luces<p.costo||(this.recargas[tipo]??0)>0)return false;
  this.luces-=p.costo;this.recargas[tipo]=p.recarga;this.plantas.push({id:this.proximo++,tipo,fila,col,vida:p.vida,reloj:tipo==='chile'?1.2:tipo==='margarita'?10:.3});this.sembradas++;this.eventos.push({t:'siembra',fila,x:col,tipo});return true;}
 quitar(fila:number,col:number){if(this.terminado)return false;const i=this.plantas.findIndex(p=>p.fila===fila&&p.col===col);if(i<0)return false;this.plantas.splice(i,1);return true;}
 recoger(id:number){if(this.terminado)return false;const i=this.soles.findIndex(l=>l.id===id);if(i<0)return false;this.luces+=this.soles[i].valor;this.soles.splice(i,1);return true;}
 private luz(fila:number,x:number){this.soles.push({id:this.proximo++,fila,x,valor:25,vida:15});}
 private danar(z:Zombi,dano:number){if(z.vida<=0)return;z.vida-=dano;if(z.vida<=0){this.eliminados++;this.eventos.push({t:'cae',fila:z.fila,x:z.x,tipo:z.tipo});}}
 paso(){if(this.terminado)return;const dt=this.pasoFijo;this.t+=dt;this.eventos=[];
  for(const t of Object.keys(this.recargas))this.recargas[t]=Math.max(0,this.recargas[t]-dt);
  this.cieloT-=dt;if(this.cieloT<=0){this.cieloT=7;this.luz(this.n(this.nivel.filas),this.n(8));}
  while(this.cola[0]?.t<=this.t){const a=this.cola.shift()!;this.oleada=a.oleada;this.zombis.push({id:this.proximo++,tipo:a.tipo,fila:a.fila,x:8.8,vida:ZOMBIS[a.tipo].vida,lento:0,mordiendo:false});if(!this.cola.length)this.eventos.push({t:'ultima'});}
  for(const l of this.soles)l.vida-=dt;this.soles=this.soles.filter(l=>l.vida>0);
  for(const p of this.plantas){if(p.vida<=0)continue;const d=PLANTAS[p.tipo];p.reloj-=dt;if(p.reloj>0)continue;
   if(p.tipo==='margarita'){this.luz(p.fila,p.col);p.reloj=d.cada;continue;}
   if(p.tipo==='campanilla'){for(const v of this.plantas)if(v.vida>0&&Math.abs(v.fila-p.fila)<=1&&Math.abs(v.col-p.col)<=1)v.vida=Math.min(PLANTAS[v.tipo].vida,v.vida+20);p.reloj=d.cada;continue;}
   if(p.tipo==='chile'){for(const z of this.zombis)if(Math.abs(z.fila-p.fila)<=1&&Math.abs(z.x-p.col)<2.4)this.danar(z,d.dano);p.vida=0;this.eventos.push({t:'cometa',fila:p.fila,x:p.col});continue;}
   const blanco=this.zombis.some(z=>z.vida>0&&z.fila===p.fila&&z.x>=p.col-.3);if(!blanco||d.dano===0)continue;
   const cantidad=p.tipo==='gemela'?2:1;for(let i=0;i<cantidad;i++)this.semillas.push({id:this.proximo++,tipo:p.tipo,fila:p.fila,x:p.col+.3-i*.25,dano:d.dano/cantidad});p.reloj=d.cada;
  }
  for(const s of this.semillas){s.x+=4.7*dt;const z=this.zombis.filter(z=>z.vida>0&&z.fila===s.fila&&Math.abs(z.x-s.x)<.3).sort((a,b)=>a.x-b.x)[0];if(!z)continue;
   if(s.tipo==='hongo'){for(const v of this.zombis)if(Math.abs(v.fila-z.fila)<=1&&Math.abs(v.x-z.x)<.85)this.danar(v,s.dano);}
   else this.danar(z,s.dano*(z.tipo==='paraguas'?.65:1));if(s.tipo==='menta')z.lento=3.5;s.x=100;
  }
  this.semillas=this.semillas.filter(s=>s.x<10);
  for(const z of this.zombis){if(z.vida<=0)continue;z.lento=Math.max(0,z.lento-dt);const p=this.plantas.filter(p=>p.vida>0&&p.fila===z.fila&&Math.abs(p.col-z.x)<.52).sort((a,b)=>b.col-a.col)[0];z.mordiendo=!!p;
   if(p)p.vida-=ZOMBIS[z.tipo].dano*dt;else z.x-=ZOMBIS[z.tipo].vel*(z.lento>0?.5:1)*dt;
   if(z.x<-.55){if(this.guardianes[z.fila]){this.guardianes[z.fila]=false;for(const v of this.zombis)if(v.fila===z.fila)this.danar(v,99999);this.eventos.push({t:'guardian',fila:z.fila});}
    else{this.terminado='perdio';this.eventos.push({t:'fin'});break;}}
  }
  this.plantas=this.plantas.filter(p=>p.vida>0);this.zombis=this.zombis.filter(z=>z.vida>0);
  if(!this.terminado&&!this.cola.length&&!this.zombis.length){this.terminado='gano';this.eventos.push({t:'fin'});}
 }
 estrellas(){return this.terminado==='gano'?this.guardianes.every(Boolean)?3:this.guardianes.filter(Boolean).length>=Math.ceil(this.nivel.filas/2)?2:1:0;}
 get restante(){return this.cola.length;}
}
/** Piloto de pruebas: recoge luces y siembra con los mismos costes, recargas y casillas del jugador. */
export function crearBotJardin(){let reloj=0;return (m:MotorJardin)=>{
 for(const s of [...m.soles])m.recoger(s.id);if(m.t<reloj||m.terminado)return;reloj=m.t+.18;
 const hay=(f:number,c:number)=>m.plantas.find(p=>p.fila===f&&p.col===c);
 const amenaza=[...Array(m.nivel.filas).keys()].sort((a,b)=>Math.min(99,...m.zombis.filter(z=>z.fila===a).map(z=>z.x))-Math.min(99,...m.zombis.filter(z=>z.fila===b).map(z=>z.x)));
 for(const f of amenaza){if(m.zombis.some(z=>z.fila===f&&z.x<4)&&m.nivel.plantas.includes('chile')&&!hay(f,6)&&m.plantar('chile',f,6))return;
  if(m.zombis.some(z=>z.fila===f)&&!hay(f,2)&&m.plantar('frijol',f,2))return;}
 for(let f=0;f<m.nivel.filas;f++)for(const c of [0,1])if(!hay(f,c)&&m.plantar('margarita',f,c))return;
 for(const c of [2,3,4])for(const f of amenaza)if(!hay(f,c)&&m.plantar(c===4&&m.nivel.plantas.includes('gemela')?'gemela':'frijol',f,c))return;
 if(m.nivel.plantas.includes('menta'))for(const f of amenaza)if(!hay(f,5)&&m.plantar('menta',f,5))return;
 for(const f of amenaza)if(!hay(f,6)&&m.plantar('calabaza',f,6))return;
};}
