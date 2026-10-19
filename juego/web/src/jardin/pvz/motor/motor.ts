import type {DefNivel,DefPlanta,DefZombi,OpcionesMotorPvZ,PlantaPvZ,ZombiPvZ,ProyectilPvZ,SolPvZ,CortacespedPvZ,EventoPvZ,TipoDano,OrdenPvZ,EstadoPvZ,CapaPlanta} from '../tipos';
import {semillasAntesDelNivel} from '../datos/dia';
import {PLANTAS_PVZ} from '../datos/plantas';
import {ZOMBIS_PVZ} from '../datos/zombis';
import {COMPORTAMIENTOS_PLANTAS,COMPORTAMIENTOS_ZOMBIS,type ComportamientoPlantaPvZ,type ComportamientoZombiPvZ} from '../comportamiento';
import {AzarPvZ} from './azar';
import {DirectorOleadasPvZ} from './oleadas';
export interface RegistrosPvZ {plantas?:Readonly<Record<string,DefPlanta>>;zombis?:Readonly<Record<string,DefZombi>>;comportamientoPlantas?:Readonly<Record<string,ComportamientoPlantaPvZ>>;comportamientoZombis?:Readonly<Record<string,ComportamientoZombiPvZ>>}
const finito=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);
const entero=(x:unknown):x is number=>Number.isSafeInteger(x);
/** Simulación de 60 Hz. No importa DOM, Canvas, WebAudio, three.js ni almacenamiento. */
export class MotorPvZ {
 readonly pasoFijo=1/60;readonly columnas=9;readonly anchoCasilla=80;readonly nivel:DefNivel;readonly filas:number;
 readonly plantasDef:Readonly<Record<string,DefPlanta>>;readonly zombisDef:Readonly<Record<string,DefZombi>>;
 readonly semillas:readonly string[];readonly azar:AzarPvZ;readonly director:DirectorOleadasPvZ|null;
 private comportamientosP:Readonly<Record<string,ComportamientoPlantaPvZ>>;private comportamientosZ:Readonly<Record<string,ComportamientoZombiPvZ>>;
 t=0;pasos=0;sol:number;abono:number;oleada=0;terminado:''|'gano'|'perdio'='';eliminados=0;sembradas=0;
 plantas:PlantaPvZ[]=[];zombis:ZombiPvZ[]=[];proyectiles:ProyectilPvZ[]=[];soles:SolPvZ[]=[];
 cortacespedes:CortacespedPvZ[]=[];recargas:Record<string,number>={};eventos:EventoPvZ[]=[];
 cinta:{id:number;planta:string}[]=[];objetivoVida?:number;
 private proximo=1;private cieloEn=6;private cielosCaidos=0;private cintaEn=0;private sinOleadas:boolean;
 private dentroPaso=false;
 constructor(nivel:DefNivel,opciones:OpcionesMotorPvZ={},registros:RegistrosPvZ={}){
  this.nivel=structuredClone(nivel);this.plantasDef=structuredClone(registros.plantas??PLANTAS_PVZ);this.zombisDef=structuredClone(registros.zombis??ZOMBIS_PVZ);
  this.comportamientosP=registros.comportamientoPlantas??COMPORTAMIENTOS_PLANTAS;this.comportamientosZ=registros.comportamientoZombis??COMPORTAMIENTOS_ZOMBIS;
  this.filas=nivel.area==='piscina'||nivel.area==='niebla'?6:5;
  if(!nivel.filas.length||new Set(nivel.filas).size!==nivel.filas.length||nivel.filas.some(f=>!entero(f)||f<0||f>=this.filas)||!finito(nivel.solInicial)||nivel.solInicial<0)throw new Error('Nivel inválido');
  if(nivel.zombis.some(id=>!Object.hasOwn(this.zombisDef,id)))throw new Error('Zombi de nivel desconocido');
  const semillas=opciones.semillas??nivel.semillas??semillasAntesDelNivel(nivel.id);if(semillas.length>10||new Set(semillas).size!==semillas.length||semillas.some(id=>!Object.hasOwn(this.plantasDef,id)))throw new Error('Selección de semillas inválida');this.semillas=[...semillas];
  if(nivel.cinta&&nivel.cinta.length===0||nivel.tipo==='cinta'&&!nivel.cinta)throw new Error('Cinta vacía');
  if(nivel.cinta?.some(id=>!Object.hasOwn(this.plantasDef,id)))throw new Error('Semilla de cinta desconocida');
  for(const d of Object.values(this.plantasDef))if(![d.sol,d.vida,d.recarga].every(finito)||d.sol<0||d.vida<=0||d.recarga<0)throw new Error('Definición de planta inválida');
  for(const d of Object.values(this.zombisDef))if(![d.vida,d.velocidad,d.mordida].every(finito)||d.vida<=0||d.velocidad<0||d.mordida<0||d.armadura&&(!finito(d.armadura.vida)||d.armadura.vida<0))throw new Error('Definición de zombi inválida');
  for(const [tipo,cantidad] of Object.entries(nivel.fijos??{}).flatMap(([,v])=>Object.entries(v)))if(!Object.hasOwn(this.zombisDef,tipo)||!entero(cantidad)||cantidad<0||cantidad>300)throw new Error('Apariciones fijas inválidas');
  if(nivel.presupuesto?.some(p=>!entero(p)||p<0||p>300))throw new Error('Presupuesto inválido');
  if(nivel.pesosCinta&&Object.values(nivel.pesosCinta).some(p=>!finito(p)||p<=0))throw new Error('Peso de cinta inválido');
  for(const d of Object.values(this.zombisDef))if(d.datos?.puntos!==undefined&&(!entero(d.datos.puntos)||d.datos.puntos<1)||d.datos?.peso!==undefined&&(!finito(d.datos.peso)||d.datos.peso<=0))throw new Error('Peso de zombi inválido');
  this.azar=new AzarPvZ(opciones.semilla??23);this.sol=nivel.solInicial;this.abono=opciones.abono??0;if(!entero(this.abono)||this.abono<0||this.abono>3)throw new Error('Abono inválido');
  this.cortacespedes=nivel.filas.map(fila=>({fila,x:-40,estado:'listo'}));this.sinOleadas=opciones.sinOleadas??false;
  this.director=this.sinOleadas?null:new DirectorOleadasPvZ(this.nivel,this.azar,this.zombisDef);
  if(nivel.objetivo){if(!this.casilla(nivel.objetivo.fila,nivel.objetivo.col)||!finito(nivel.objetivo.vida)||nivel.objetivo.vida<=0)throw new Error('Objetivo inválido');this.objetivoVida=nivel.objetivo.vida;}
 }
 nuevoId(){return this.proximo++;}
 get altoFila(){return this.filas===6?85:100;}
 centroFila(fila:number){return fila*this.altoFila+this.altoFila/2;}
 casilla(fila:unknown,col:unknown):boolean{return entero(fila)&&this.nivel.filas.includes(fila)&&entero(col)&&col>=0&&col<this.columnas;}
 plantaEn(fila:number,col:number,capa:CapaPlanta='principal'){return this.plantas.find(p=>p.vida>0&&p.fila===fila&&p.col===col&&p.capa===capa);}
 private validaSiembra(tipo:string,fila:number,col:number,gratis=false){
  if(this.terminado||!Object.hasOwn(this.plantasDef,tipo)||!this.casilla(fila,col)||!gratis&&(!this.semillas.includes(tipo)||this.nivel.tipo==='cinta'||!!this.nivel.cinta))return false;
  const d=this.plantasDef[tipo],capa=d.capa??'principal',existente=this.plantaEn(fila,col,capa),agua=this.nivel.filasAgua?.includes(fila);
  if(existente&&d.mejoraDe!==existente.tipo)return false;if(d.mejoraDe&&!existente)return false;
  if(d.agua==='solo'&&!agua)return false;
  if(agua&&d.agua!=='solo'&&d.agua!=='tambien'&&capa!=='base'&&!this.plantaEn(fila,col,'base'))return false;
  if(this.nivel.area==='tejado'&&capa!=='base'&&!this.plantaEn(fila,col,'base')&&!this.nivel.materas?.some(([f,c])=>f===fila&&c===col))return false;
  if(this.nivel.objetivo?.fila===fila&&this.nivel.objetivo.col===col)return false;
  return gratis||this.sol>=d.sol&&(this.recargas[tipo]??0)<=0;
 }
 plantar(tipo:string,fila:number,col:number){if(!this.validaSiembra(tipo,fila,col))return false;const d=this.plantasDef[tipo];this.sol-=d.sol;this.recargas[tipo]=d.recarga;this.sembrar(tipo,fila,col);return true;}
 private sembrar(tipo:string,fila:number,col:number){const d=this.plantasDef[tipo],capa=d.capa??'principal',vieja=this.plantaEn(fila,col,capa);if(vieja){vieja.vida=0;this.plantas=this.plantas.filter(p=>p!==vieja);}const p:PlantaPvZ={id:this.nuevoId(),tipo,fila,col,x:col*80+40,vida:d.vida,edad:0,capa,dormida:!!d.nocturna&&!this.esNoche,congelada:0,datos:{}};this.plantas.push(p);this.sembradas++;this.comportamientosP[tipo]?.iniciar?.(this,p);this.eventos.push({t:'siembra',id:p.id,tipo,fila,col,x:p.x});return p;}
 quitar(fila:number,col:number){if(this.terminado||!this.casilla(fila,col))return false;const orden:CapaPlanta[]=['temporal','cubierta','principal','base'];const p=orden.map(c=>this.plantaEn(fila,col,c)).find(Boolean);if(!p)return false;p.vida=0;this.plantas=this.plantas.filter(v=>v!==p);this.eventos.push({t:'pala',id:p.id,fila,col});return true;}
 recoger(id:number){if(this.terminado||!entero(id))return false;const i=this.soles.findIndex(s=>s.id===id);if(i<0)return false;const s=this.soles[i];this.sol+=s.valor;this.soles.splice(i,1);this.eventos.push({t:'recogeSol',id,cantidad:s.valor});return true;}
 usarAbono(id:number){if(this.terminado||!entero(id)||this.abono<=0)return false;const p=this.plantas.find(p=>p.id===id&&p.vida>0&&!p.dormida&&!p.congelada),fn=p&&this.comportamientosP[p.tipo]?.abono;if(!p||!fn)return false;this.abono--;fn(this,p);this.eventos.push({t:'abono',id:p.id,fila:p.fila,col:p.col});return true;}
 plantarCinta(id:number,fila:number,col:number){if(this.terminado||!entero(id))return false;const i=this.cinta.findIndex(s=>s.id===id),s=this.cinta[i];if(!s||!this.validaSiembra(s.planta,fila,col,true)||this.nivel.minijuego==='bolos'&&col>2)return false;this.cinta.splice(i,1);if(this.nivel.minijuego==='bolos')this.proyectiles.push({id:this.nuevoId(),tipo:'bolo-'+s.planta,origen:0,fila,x:col*80+40,velocidad:240,dano:1800,danoTipo:s.planta==='nuez-explosiva'?'explosion':'aplastar',perforante:s.planta!=='nuez-explosiva',impactados:[]});else this.sembrar(s.planta,fila,col);return true;}
 ordenar(orden:unknown){if(!orden||typeof orden!=='object'||this.terminado)return false;const a=orden as OrdenPvZ;if(a.tipo==='recoger')return entero(a.id)&&this.recoger(a.id!);if(a.tipo==='abono')return entero(a.id)&&this.usarAbono(a.id!);if(!this.casilla(a.fila,a.col))return false;if(a.tipo==='pala')return this.quitar(a.fila!,a.col!);if(a.tipo==='plantar'&&typeof a.planta==='string')return this.plantar(a.planta,a.fila!,a.col!);if(a.tipo==='plantarCinta'&&entero(a.id))return this.plantarCinta(a.id!,a.fila!,a.col!);return false;}
 crearSol(fila:number,x:number,valor=25,origen:'cielo'|'planta'='planta'){
  if(this.terminado||!this.nivel.filas.includes(fila)||!finito(x)||x<0||x>800||!finito(valor)||valor<=0||this.soles.length>=100)return null;
  const s:SolPvZ={id:this.nuevoId(),fila,x,valor,edad:0,vida:8,origen};this.soles.push(s);this.eventos.push({t:'sol',id:s.id,fila,x,cantidad:valor});return s;
 }
 crearZombi(tipo:string,fila:number,x=780,oleada=this.oleada){
  if(this.terminado||!Object.hasOwn(this.zombisDef,tipo)||!this.nivel.filas.includes(fila)||!finito(x)||x< -60||x>900||this.zombis.length>=300)return null;
  const d=this.zombisDef[tipo],z:ZombiPvZ={id:this.nuevoId(),tipo,fila,x,vida:d.vida,edad:0,sentido:-1,armadura:d.armadura?.vida??0,armaduraInicial:d.armadura?.vida??0,escudo:d.armadura?.tipo==='escudo',metal:d.armadura?.metal??false,lento:0,congelado:0,mantequilla:0,hipnotizado:false,comiendo:null,ceniza:false,sinBrazo:false,sinCabeza:false,datos:{},oleada};this.zombis.push(z);this.comportamientosZ[tipo]?.iniciar?.(this,z);return z;
 }
 disparar(p:PlantaPvZ,dano:number,tipo:TipoDano='recto',lento=0){if(this.terminado||p.vida<=0||!finito(dano)||dano<=0||this.proyectiles.length>=500)return false;this.proyectiles.push({id:this.nuevoId(),tipo:tipo==='hielo'?'guisante-hielo':'guisante',origen:p.id,fila:p.fila,x:p.x+30,velocidad:330,dano,danoTipo:tipo,lento,impactados:[]});p.datos.atacaHasta=this.t+.2;this.eventos.push({t:'disparo',id:p.id,tipo:p.tipo,fila:p.fila,x:p.x});return true;}
 hayBlanco(p:PlantaPvZ,alcance=800){return this.zombis.some(z=>z.vida>0&&!z.hipnotizado&&!z.sinCabeza&&z.fila===p.fila&&z.x>=p.x-10&&z.x<800&&z.x-p.x<=alcance);}
 danarPlanta(p:PlantaPvZ,cantidad:number,origen?:ZombiPvZ){if(this.terminado||p.vida<=0||!finito(cantidad)||cantidad<=0)return false;const absorbido=Math.min(cantidad,p.datos.abonoEscudo??0);if(absorbido)p.datos.abonoEscudo-=absorbido;p.vida=Math.max(0,p.vida-(cantidad-absorbido));this.comportamientosP[p.tipo]?.alDanar?.(this,p,cantidad,origen);if(p.vida===0){this.comportamientosP[p.tipo]?.alMorir?.(this,p);this.eventos.push({t:'muere',id:p.id,tipo:p.tipo,fila:p.fila,x:p.x});}return true;}
 danarZombi(z:ZombiPvZ,cantidad:number,tipo:TipoDano='recto'){
  if(this.terminado||z.vida<=0||!finito(cantidad)||cantidad<=0)return false;let cuerpo=cantidad;
  const armaduraAntes=z.armadura;
  if(z.armadura>0&&(!z.escudo||tipo==='recto'||tipo==='hielo'||tipo==='perforante'||tipo==='explosion'||tipo==='fuego'||tipo==='aplastar')){
   z.armadura=Math.max(0,z.armadura-cantidad);cuerpo=tipo==='perforante'&&z.escudo?cantidad:Math.max(0,cantidad-armaduraAntes);
  }
  z.vida=Math.max(0,z.vida-cuerpo);if(armaduraAntes>0&&z.armadura===0)this.eventos.push({t:'pierdeArmadura',id:z.id,tipo:z.tipo,fila:z.fila,x:z.x});
  if(tipo==='fuego'){z.lento=0;z.congelado=0;}if(z.vida<=0&&(tipo==='explosion'||tipo==='fuego'))z.ceniza=true;
  this.comportamientosZ[z.tipo]?.alDanar?.(this,z,cantidad,tipo);
  if(z.vida>0&&!z.sinBrazo&&z.vida<=this.zombisDef[z.tipo].vida*2/3){z.sinBrazo=true;this.eventos.push({t:'pierdeBrazo',id:z.id,tipo:z.tipo,fila:z.fila,x:z.x});}
  // PvZ 1: el zombi deja de morder al perder la cabeza; el cuerpo cae después por desangrado.
  if(z.vida>0&&!z.sinCabeza&&z.vida<this.zombisDef[z.tipo].vida/3){z.sinCabeza=true;z.comiendo=null;this.eventos.push({t:'pierdeCabeza',id:z.id,tipo:z.tipo,fila:z.fila,x:z.x});}
  this.eventos.push({t:'impacto',id:z.id,tipo,fila:z.fila,x:z.x,cantidad});if(z.vida===0)this.morirZombi(z);return true;
 }
 private morirZombi(z:ZombiPvZ){if(z.datos.contado)return;z.datos.contado=1;this.eliminados++;this.comportamientosZ[z.tipo]?.alMorir?.(this,z);this.eventos.push({t:'muere',id:z.id,tipo:z.tipo,fila:z.fila,x:z.x});}
 aplicarEstado(z:ZombiPvZ,estado:'lento'|'congelado'|'mantequilla'|'hipnotizado',segundos=0){if(this.terminado||z.vida<=0||!finito(segundos)||segundos<0)return false;if(estado==='hipnotizado'){z.hipnotizado=true;z.sentido=1;z.comiendo=null;}else z[estado]=Math.max(z[estado],segundos);this.eventos.push({t:'estado',id:z.id,tipo:estado,fila:z.fila,x:z.x});return true;}
 explosion(fila:number,x:number,dano:number,radioFilas=1,radioX=120){if(this.terminado||!finito(x)||!finito(dano)||dano<=0)return;for(const z of this.zombis)if(z.vida>0&&!z.hipnotizado&&Math.abs(z.fila-fila)<=radioFilas&&Math.abs(z.x-x)<=radioX)this.danarZombi(z,dano,'explosion');this.eventos.push({t:'explosion',fila,x});}
 get esNoche(){return this.nivel.area==='noche'||this.nivel.area==='niebla';}
 paso(){
  if(this.terminado){this.eventos=[];return;}if(this.dentroPaso)return;this.dentroPaso=true;
  try{
   const dt=this.pasoFijo;this.pasos++;this.t=this.pasos/60;this.eventos=[];
   for(const id of Object.keys(this.recargas))this.recargas[id]=Math.max(0,this.recargas[id]-dt);
   if(this.nivel.cinta){this.cintaEn-=dt;if(this.cintaEn<=0&&this.cinta.length<10){const planta=this.siguienteCinta();if(planta){this.cinta.push({id:this.nuevoId(),planta});this.eventos.push({t:'cinta',tipo:planta});}this.cintaEn=4;}}
   else if(!this.esNoche&&!this.nivel.sinSolCielo){this.cieloEn-=dt;if(this.cieloEn<=0){this.crearSol(this.nivel.filas[this.azar.entero(this.nivel.filas.length)],this.azar.entre(25,695),25,'cielo');this.cielosCaidos++;this.cieloEn=Math.min(this.cielosCaidos*.1+4.25,9.5)+this.azar.entre(0,2.75);}}
   for(const s of this.soles){s.edad+=dt;s.vida-=dt;}this.soles=this.soles.filter(s=>s.vida>0);
   if(this.director){const actuales=this.zombis.filter(z=>z.oleada===this.oleada&&z.vida>0);const vida=actuales.reduce((a,z)=>a+z.vida+z.armadura,0),inicial=actuales.reduce((a,z)=>a+this.zombisDef[z.tipo].vida+z.armaduraInicial,0);const nueva=this.director.paso(this.t,{vida,inicial:Math.max(inicial,this.vidaOleada),pendientes:0,plantas:this.sembradas});
    if(nueva?.aviso)this.eventos.push({t:'oleadaEnorme',oleada:this.oleada+1});
    if(nueva&&!nueva.aviso){this.oleada=this.director.actual;this.vidaOleada=0;for(const a of nueva.apariciones){const z=this.crearZombi(a.tipo,a.fila,a.x,a.oleada);if(z)this.vidaOleada+=z.vida+z.armadura;}this.eventos.push({t:nueva.ultima?'ultimaOleada':'oleada',oleada:this.oleada});}
   }
   for(const p of [...this.plantas]){if(p.vida<=0)continue;p.edad+=dt;p.congelada=Math.max(0,p.congelada-dt);if(!p.dormida&&!p.congelada)this.comportamientosP[p.tipo]?.paso(this,p,dt);}
   this.avanzarProyectiles(dt);this.avanzarCortacespedes(dt);
   for(const z of [...this.zombis]){if(z.vida<=0)continue;this.avanzarZombi(z,dt);if(this.terminado)break;}
   this.plantas=this.plantas.filter(p=>p.vida>0);this.zombis=this.zombis.filter(z=>z.vida>0);
   if(!this.terminado&&this.director?.terminado&&!this.zombis.some(z=>!z.hipnotizado))this.finalizar(true);
  }finally{this.dentroPaso=false;}
 }
 private vidaOleada=0;
 private siguienteCinta(){const ids=this.nivel.cinta??[],pesos=ids.map(id=>this.nivel.pesosCinta?.[id]??1);let dado=this.azar.siguiente()*pesos.reduce((a,b)=>a+b,0),i=0;while(i<pesos.length-1&&dado>=pesos[i])dado-=pesos[i++];return ids[i];}
 private avanzarProyectiles(dt:number){
  for(const p of this.proyectiles){
   const antes=p.x,yAntes=p.y??this.centroFila(p.fila);p.x+=p.velocidad*dt;
   if(p.tipo.startsWith('bolo-')){p.y=yAntes+(p.velocidadY??0)*dt;const min=this.centroFila(Math.min(...this.nivel.filas)),max=this.centroFila(Math.max(...this.nivel.filas));if(p.y<min){p.y=min+(min-p.y);p.velocidadY=Math.abs(p.velocidadY??0);}if(p.y>max){p.y=max-(p.y-max);p.velocidadY=-Math.abs(p.velocidadY??0);}p.fila=Math.max(0,Math.min(this.filas-1,Math.floor(p.y/this.altoFila)));}
   const y=p.y??yAntes,dx=p.x-antes,dy=y-yAntes,distancia=(z:ZombiPvZ)=>{const u=Math.max(0,Math.min(1,((z.x-antes)*dx+(this.centroFila(z.fila)-yAntes)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(z.x-antes-u*dx,this.centroFila(z.fila)-yAntes-u*dy);};
   const blancos=this.zombis.filter(z=>z.vida>0&&!z.hipnotizado&&!p.impactados.includes(z.id)&&distancia(z)<=18).sort((a,b)=>a.x-b.x);
   for(const z of blancos){
    if(p.danoTipo==='explosion'&&p.tipo.startsWith('bolo-'))this.explosion(z.fila,z.x,p.dano);
    else if(p.tipo==='bolo-nuez'){
     if(z.armadura>0){const cantidad=Math.min(z.armadura,z.escudo?400:900);z.armadura-=cantidad;if(z.armadura===0)this.eventos.push({t:'pierdeArmadura',id:z.id,tipo:z.tipo,fila:z.fila,x:z.x,cantidad});}
     else this.danarZombi(z,1800,'aplastar');
     const prob=z.fila===0?1:z.fila===1?.75:z.fila===2?.5:z.fila===3?.25:0;p.impactados.push(z.id);p.velocidadY=this.azar.siguiente()<prob?240:-240;p.y??=yAntes;break;
    }else this.danarZombi(z,p.dano,p.danoTipo);
    if(p.lento&&!(z.escudo&&z.armadura>0))this.aplicarEstado(z,'lento',p.lento);p.impactados.push(z.id);if(!p.perforante){p.x=9999;break;}
   }
  }this.proyectiles=this.proyectiles.filter(p=>p.x>=-100&&p.x<=850);
 }
 private avanzarCortacespedes(dt:number){for(const c of this.cortacespedes){if(c.estado!=='activo')continue;const antes=c.x;c.x+=400*dt;for(const z of this.zombis)if(z.vida>0&&!z.hipnotizado&&z.fila===c.fila&&z.x>=antes-35&&z.x<=c.x+35)this.danarZombi(z,999999,'aplastar');if(c.x>850)c.estado='gastado';}}
 private avanzarZombi(z:ZombiPvZ,dt:number){
  z.edad+=dt;z.lento=Math.max(0,z.lento-dt);z.congelado=Math.max(0,z.congelado-dt);z.mantequilla=Math.max(0,z.mantequilla-dt);
  if(z.sinCabeza){z.comiendo=null;z.datos.sangrado=(z.datos.sangrado??0)+dt;const prob=this.zombisDef[z.tipo].vida>=500?.6:.2;while(z.datos.sangrado>=.01&&z.vida>0){z.datos.sangrado-=.01;if(this.azar.siguiente()<prob)z.vida=Math.max(0,z.vida-1);}if(!z.vida)this.morirZombi(z);return;}
  if(z.congelado>0||z.mantequilla>0){z.comiendo=null;return;}
  this.comportamientosZ[z.tipo]?.paso?.(this,z,dt);if(z.vida<=0)return;
  const d=this.zombisDef[z.tipo],vel=(z.datos.velocidad??d.velocidad)*(z.lento>0?.5:1);
  if(z.hipnotizado){const enemigo=this.zombis.filter(v=>v!==z&&v.vida>0&&!v.hipnotizado&&!v.sinCabeza&&v.fila===z.fila&&Math.abs(v.x-z.x)<35).sort((a,b)=>a.x-b.x)[0];if(enemigo){z.comiendo=enemigo.id;this.danarZombi(enemigo,d.mordida*(z.lento>0?.5:1)*dt,'recto');}else{z.comiendo=null;z.x+=vel*dt;if(z.x>850)z.vida=0;}return;}
  const aliado=this.zombis.find(v=>v!==z&&v.vida>0&&v.hipnotizado&&v.fila===z.fila&&Math.abs(v.x-z.x)<35);if(aliado){z.comiendo=aliado.id;this.danarZombi(aliado,d.mordida*(z.lento>0?.5:1)*dt,'recto');return;}
  const plantas=this.plantas.filter(p=>p.vida>0&&p.fila===z.fila&&Math.abs(p.x-z.x)<35).sort((a,b)=>b.x-a.x||(['temporal','cubierta','principal','base'].indexOf(a.capa)-['temporal','cubierta','principal','base'].indexOf(b.capa))),p=plantas[0];
  if(z.datos.saltando>this.t){z.comiendo=null;return;}
  if(p){if(z.comiendo!==p.id)this.eventos.push({t:'muerde',id:z.id,fila:z.fila,x:z.x});z.comiendo=p.id;this.danarPlanta(p,d.mordida*(z.lento>0?.5:1)*dt,z);}else{z.comiendo=null;if(!(this.nivel.objetivo&&this.objetivoVida&&z.fila===this.nivel.objetivo.fila&&Math.abs(z.x-(this.nivel.objetivo.col*80+40))<35))z.x-=vel*dt;}
  if(this.nivel.objetivo&&this.objetivoVida!==undefined&&z.fila===this.nivel.objetivo.fila&&Math.abs(z.x-(this.nivel.objetivo.col*80+40))<35){this.objetivoVida=Math.max(0,this.objetivoVida-d.mordida*dt);if(this.objetivoVida===0){this.eventos.push({t:'objetivo',fila:z.fila});this.finalizar(false);return;}}
  if(z.x< -15){const c=this.cortacespedes.find(c=>c.fila===z.fila);if(c?.estado==='listo'){c.estado='activo';this.eventos.push({t:'cortacesped',fila:z.fila,x:c.x});this.danarZombi(z,999999,'aplastar');}else if(z.x< -60)this.finalizar(false);}
 }
 private finalizar(gano:boolean){if(this.terminado)return;this.terminado=gano?'gano':'perdio';this.eventos.push({t:'fin',gano});}
 /** Consume cada evento una sola vez; drenar también tras órdenes que emitan eventos. */
 consumirEventos(){const eventos=this.eventos;this.eventos=[];return eventos;}
 /** Varios pasos para ×2: conserva todos los eventos entre pasos y nunca depende del dibujo. */
 avanzar(cantidad=1){if(!entero(cantidad)||cantidad<0||cantidad>600)throw new Error('Cantidad de pasos inválida');const eventos=this.consumirEventos();for(let i=0;i<cantidad;i++){this.paso();eventos.push(...this.consumirEventos());if(this.terminado)break;}return eventos;}
 estado():EstadoPvZ {return structuredClone({version:1,nivel:this.nivel.id,t:this.t,pasos:this.pasos,sol:this.sol,abono:this.abono,oleada:this.oleada,terminado:this.terminado,plantas:this.plantas,zombis:this.zombis,proyectiles:this.proyectiles,soles:this.soles,cortacespedes:this.cortacespedes,recargas:this.recargas,cinta:this.cinta,objetivoVida:this.objetivoVida,eliminados:this.eliminados,sembradas:this.sembradas});}
}
