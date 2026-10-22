import type {DefNivel,DefPlanta,DefZombi,OpcionesMotorPvZ,PlantaPvZ,ZombiPvZ,ProyectilPvZ,SolPvZ,CortacespedPvZ,EventoPvZ,TipoDano,OrdenPvZ,EstadoPvZ,CapaPlanta,ZonaPvZ,LapidaPvZ,CraterPvZ,PistaHieloPvZ} from '../tipos';
import {semillasAntesDelNivel} from '../datos/niveles';
import {prepararTerrenoPvZ,alzarLapidasPvZ} from './terreno';
import {emboscarPiscinaPvZ} from './piscina';
import {VisibilidadPvZ} from './niebla';
import {RompejarronesPvZ} from './rompejarrones';
import {AplastazombisPvZ} from './aplastazombis';
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
 pistasHielo:PistaHieloPvZ[]=[];lapidas:LapidaPvZ[]=[];crateres:CraterPvZ[]=[];zonas:ZonaPvZ[]=[];cinta:{id:number;planta:string}[]=[];objetivoVida?:number;
 private proximo=1;private cieloEn=6;private cielosCaidos=0;private cintaEn=0;private sinOleadas:boolean;
 private aplastazombis:AplastazombisPvZ|null=null;private alzamientoEn:number|null=null;private cintaEmitida:Record<string,number>={};
 private emboscadaEn:number|null=null;private visibilidad:VisibilidadPvZ;private rompejarrones:RompejarronesPvZ|null=null;private dentroPaso=false;private origenAbono:number|null=null;
 constructor(nivel:DefNivel,opciones:OpcionesMotorPvZ={},registros:RegistrosPvZ={}){
  this.nivel=structuredClone(nivel);this.plantasDef=structuredClone(registros.plantas??PLANTAS_PVZ);this.zombisDef=structuredClone(registros.zombis??ZOMBIS_PVZ);
  this.comportamientosP=registros.comportamientoPlantas??COMPORTAMIENTOS_PLANTAS;this.comportamientosZ=registros.comportamientoZombis??COMPORTAMIENTOS_ZOMBIS;
  this.visibilidad=new VisibilidadPvZ(this.nivel);
  if(nivel.niebla!==undefined&&(!finito(nivel.niebla)||nivel.niebla<0||nivel.niebla>9))throw new Error('Niebla inválida');
  this.filas=nivel.area==='piscina'||nivel.area==='niebla'?6:5;
  if(!nivel.filas.length||new Set(nivel.filas).size!==nivel.filas.length||nivel.filas.some(f=>!entero(f)||f<0||f>=this.filas)||!finito(nivel.solInicial)||nivel.solInicial<0)throw new Error('Nivel inválido');
  if(nivel.filasAgua&&(new Set(nivel.filasAgua).size!==nivel.filasAgua.length||nivel.filasAgua.some(f=>!nivel.filas.includes(f))))throw new Error('Filas de agua inválidas');
  if(nivel.zombis.some(id=>!Object.hasOwn(this.zombisDef,id)))throw new Error('Zombi de nivel desconocido');
  const semillas=opciones.semillas??nivel.semillas??semillasAntesDelNivel(nivel.id).slice(0,10);if(semillas.length>10||new Set(semillas).size!==semillas.length||semillas.some(id=>!Object.hasOwn(this.plantasDef,id)))throw new Error('Selección de semillas inválida');this.semillas=[...semillas];
  if(nivel.cinta&&nivel.cinta.length===0||nivel.tipo==='cinta'&&!nivel.cinta)throw new Error('Cinta vacía');
  if(nivel.cinta?.some(id=>!Object.hasOwn(this.plantasDef,id)))throw new Error('Semilla de cinta desconocida');
  for(const d of Object.values(this.plantasDef))if(![d.sol,d.vida,d.recarga].every(finito)||d.sol<0||d.vida<=0||d.recarga<0)throw new Error('Definición de planta inválida');
  for(const d of Object.values(this.zombisDef))if(![d.vida,d.velocidad,d.mordida].every(finito)||d.vida<=0||d.velocidad<0||d.mordida<0||d.armadura&&(!finito(d.armadura.vida)||d.armadura.vida<0))throw new Error('Definición de zombi inválida');
  for(const [tipo,cantidad] of Object.entries(nivel.fijos??{}).flatMap(([,v])=>Object.entries(v)))if(!Object.hasOwn(this.zombisDef,tipo)||!entero(cantidad)||cantidad<0||cantidad>300)throw new Error('Apariciones fijas inválidas');
  if(nivel.presupuesto?.some(p=>!entero(p)||p<0||p>300))throw new Error('Presupuesto inválido');
  if(nivel.atenuarCinta&&Object.entries(nivel.atenuarCinta).some(([id,d])=>!nivel.cinta?.includes(id)||!entero(d.cantidad)||d.cantidad<1||!finito(d.pesoFinal)||d.pesoFinal<=0))throw new Error('Atenuación de cinta inválida');
  if(nivel.pesosCinta&&Object.values(nivel.pesosCinta).some(p=>!finito(p)||p<=0))throw new Error('Peso de cinta inválido');
  for(const d of Object.values(this.zombisDef))if(d.datos?.puntos!==undefined&&(!entero(d.datos.puntos)||d.datos.puntos<1)||d.datos?.peso!==undefined&&(!finito(d.datos.peso)||d.datos.peso<=0))throw new Error('Peso de zombi inválido');
  this.azar=new AzarPvZ(opciones.semilla??23);this.sol=nivel.solInicial;this.abono=opciones.abono??0;if(!entero(this.abono)||this.abono<0||this.abono>3)throw new Error('Abono inválido');
  this.cortacespedes=nivel.filas.map(fila=>({fila,x:-40,estado:'listo'}));this.sinOleadas=opciones.sinOleadas??false;
  this.director=this.sinOleadas||(nivel.minijuego==='aplastazombis'||nivel.minijuego==='rompejarrones')?null:new DirectorOleadasPvZ(this.nivel,this.azar,this.zombisDef);
  if(!this.sinOleadas&&nivel.minijuego==='aplastazombis')this.aplastazombis=new AplastazombisPvZ();
  if(nivel.lapidas!==undefined&&(!entero(nivel.lapidas)||nivel.lapidas<0||nivel.lapidas>nivel.filas.length*6))throw new Error('Lápidas inválidas');
  if(nivel.distribucionLapidas){const entradas=Object.entries(nivel.distribucionLapidas);if(entradas.some(([c,n])=>!entero(Number(c))||Number(c)<3||Number(c)>8||!entero(n)||n<0||n>nivel.filas.length)||entradas.reduce((s,[,n])=>s+n,0)!==nivel.lapidas)throw new Error('Distribución de lápidas inválida');}
  if(nivel.maximosCinta&&Object.entries(nivel.maximosCinta).some(([id,n])=>!nivel.cinta?.includes(id)||!entero(n)||n<0))throw new Error('Máximo de cinta inválido');
  prepararTerrenoPvZ(this);
  if(!this.sinOleadas&&nivel.minijuego==='rompejarrones'){this.rompejarrones=new RompejarronesPvZ();this.rompejarrones.iniciar(this);}
  if(nivel.objetivo){if(!this.casilla(nivel.objetivo.fila,nivel.objetivo.col)||!finito(nivel.objetivo.vida)||nivel.objetivo.vida<=0)throw new Error('Objetivo inválido');this.objetivoVida=nivel.objetivo.vida;}
 }
 nuevoId(){return this.proximo++;}
 get altoFila(){return this.filas===6?85:100;}
 centroFila(fila:number){return fila*this.altoFila+this.altoFila/2;}
 casilla(fila:unknown,col:unknown):boolean{return entero(fila)&&this.nivel.filas.includes(fila)&&entero(col)&&col>=0&&col<this.columnas;}
 plantaEn(fila:number,col:number,capa:CapaPlanta='principal'){return this.plantas.find(p=>p.vida>0&&p.fila===fila&&p.col===col&&p.capa===capa);}
 private validaSiembra(tipo:string,fila:number,col:number,gratis=false){
  if(this.terminado||!Object.hasOwn(this.plantasDef,tipo)||!this.casilla(fila,col)||!gratis&&(!this.semillas.includes(tipo)||this.nivel.tipo==='cinta'||!!this.nivel.cinta))return false;
  if(this.jarrones.some(j=>j.fila===fila&&j.col===col))return false;
  const tumba=this.lapidaEn(fila,col);if(this.crateres.some(q=>q.fila===fila&&q.col===col)||tipo==='comepiedras'&&!tumba||tipo!=='comepiedras'&&tumba)return false;
  const d=this.plantasDef[tipo],capa=d.capa??'principal',existente=this.plantaEn(fila,col,capa),agua=this.nivel.filasAgua?.includes(fila);
  if(existente&&d.mejoraDe!==existente.tipo)return false;if(d.mejoraDe&&!existente)return false;
  if(d.agua==='solo'&&(!agua||this.plantaEn(fila,col)||this.plantaEn(fila,col,'base'))||d.soloTierra&&agua)return false;
  const hielo=this.pistaHielo(fila);if(hielo&&(col*80+40)>=hielo.desde&&(col*80+40)<=hielo.hasta)return false;
  if(agua&&d.agua!=='solo'&&d.agua!=='tambien'&&capa!=='base'&&!this.plantaEn(fila,col,'base'))return false;
  if(this.nivel.area==='tejado'&&capa!=='base'&&!this.plantaEn(fila,col,'base')&&!this.nivel.materas?.some(([f,c])=>f===fila&&c===col))return false;
  if(this.nivel.objetivo?.fila===fila&&this.nivel.objetivo.col===col)return false;
  return gratis||this.sol>=d.sol&&(this.recargas[tipo]??0)<=0;
 }
 plantar(tipo:string,fila:number,col:number){if(!this.validaSiembra(tipo,fila,col))return false;const d=this.plantasDef[tipo];this.sol-=d.sol;this.recargas[tipo]=d.recarga;this.sembrar(tipo,fila,col);return true;}
 private sembrar(tipo:string,fila:number,col:number){const d=this.plantasDef[tipo],capa=d.capa??'principal',vieja=this.plantaEn(fila,col,capa);if(vieja){vieja.vida=0;this.plantas=this.plantas.filter(p=>p!==vieja);}const p:PlantaPvZ={id:this.nuevoId(),tipo,fila,col,x:col*80+40,vida:d.vida,edad:0,capa,dormida:!!d.nocturna&&!this.esNoche,congelada:0,datos:{}};this.plantas.push(p);this.sembradas++;this.comportamientosP[tipo]?.iniciar?.(this,p);this.eventos.push({t:'siembra',id:p.id,tipo,fila,col,x:p.x});return p;}
 quitar(fila:number,col:number){if(this.terminado||!this.casilla(fila,col))return false;const orden:CapaPlanta[]=['temporal','cubierta','principal','base'];const p=orden.map(c=>this.plantaEn(fila,col,c)).find(Boolean);if(!p||p.tipo==='comepiedras'||this.protegidaPorAbono(p))return false;p.vida=0;this.comportamientosP[p.tipo]?.alMorir?.(this,p);this.plantas=this.plantas.filter(v=>v!==p);this.eventos.push({t:'pala',id:p.id,fila,col});return true;}
 /** Una casilla destruida retira sus capas incluso si una habilidad las protege del daño. */
 private retirarPorTerreno(p:PlantaPvZ){if(p.vida<=0)return;p.vida=0;this.comportamientosP[p.tipo]?.alMorir?.(this,p);this.eventos.push({t:'muere',id:p.id,tipo:p.tipo,fila:p.fila,x:p.x});this.hundirSobreBase(p);}
 esAgua(fila:number){return this.nivel.filasAgua?.includes(fila)??false;}
 pistaHielo(fila:number){return this.pistasHielo.find(q=>q.fila===fila&&q.vida>0);}
 crearPistaHielo(fila:number,desde:number){
  if(this.terminado||!this.nivel.filas.includes(fila)||this.esAgua(fila)||!finito(desde)||desde<0||desde>800)return null;
  let q=this.pistaHielo(fila);if(q){q.desde=Math.min(q.desde,desde);q.vida=30;return q;}
  q={id:this.nuevoId(),fila,desde,hasta:800,vida:30};this.pistasHielo.push(q);this.eventos.push({t:'terreno',tipo:'pista-hielo',id:q.id,fila,x:desde,hasta:800,duracion:30});return q;
 }
 quitarHielo(fila:number){if(this.terminado)return false;const q=this.pistaHielo(fila);if(!q)return false;this.pistasHielo=this.pistasHielo.filter(v=>v!==q);this.eventos.push({t:'terreno',tipo:'pista-hielo-fin',id:q.id,fila,x:q.desde});return true;}
 aplastarPlantas(fila:number,x:number,radio:number){if(this.terminado||!finito(x)||!finito(radio)||radio<0)return;for(const p of [...this.plantas])if(p.vida>0&&!this.plantasDef[p.tipo].datos?.ignoraMordida&&p.fila===fila&&Math.abs(p.x-x)<=radio)this.retirarPorTerreno(p);}
 private hundirSobreBase(p:PlantaPvZ){if(p.capa==='base'&&this.esAgua(p.fila))for(const otra of [...this.plantas])if(otra!==p&&otra.vida>0&&otra.fila===p.fila&&otra.col===p.col&&this.plantasDef[otra.tipo].agua!=='solo'&&this.plantasDef[otra.tipo].agua!=='tambien')this.retirarPorTerreno(otra);}
 puedeRecibirProyectil(z:ZombiPvZ,tipo:TipoDano='recto',aereo=false){return !z.datos.bajoTierra&&this.esVolador(z)===aereo&&!(z.datos.aterrizaHasta>this.t)&&!(z.datos.emergiendoHasta>this.t)&& z.vida>0&&!(z.datos.saltando>this.t)&&!(z.datos.choqueTrineoHasta>this.t)&&(!z.datos.sumergido||tipo==='lanzado')&&!z.datos.arrastrado&&!z.datos.intocableTrineo;}
 esVehiculo(z:ZombiPvZ){return (z.datos.vehiculo??this.zombisDef[z.tipo]?.datos?.vehiculo??0)>0;}
 get jarrones(){return this.rompejarrones?.jarrones??[];}
 get sobres(){return this.rompejarrones?.sobres??[];}
 get etapaJarrones(){return this.rompejarrones?.etapaJarrones??0;}
 romperJarron(id:number){return !this.terminado&&entero(id)&&!!this.rompejarrones?.romper(this,id);}
 plantarSobre(id:number,fila:number,col:number){return !this.terminado&&entero(id)&&this.casilla(fila,col)&&!!this.rompejarrones?.plantarSobre(this,id,fila,col);}
 sembrarPremioJarron(tipo:string,fila:number,col:number){if(!this.rompejarrones?.siembraAutorizada(tipo)||!this.validaSiembra(tipo,fila,col,true))return null;return this.sembrar(tipo,fila,col);}
 limpiarEtapaRompejarrones(){if(this.terminado||!this.rompejarrones)return;for(const p of [...this.plantas])this.retirarPorTerreno(p);this.plantas=[];this.zombis=[];this.proyectiles=[];this.soles=[];this.cinta=[];this.recargas={};}
 romperJarronesCerca(fila:number,col:number){this.rompejarrones?.romperCerca(this,fila,col);}
 destruirPlanta(p:PlantaPvZ){if(this.terminado||!this.plantas.includes(p)||p.vida<=0)return false;this.retirarPorTerreno(p);return true;}
 esVolador(z:ZombiPvZ){return !!z.datos.volando;}
 estaIluminado(fila:number,col:number){return this.visibilidad.iluminada(this,fila,col,true);}
 quitarMetal(z:ZombiPvZ){if(this.terminado||z.vida<=0)return false;if(z.armadura>0&&z.metal){z.armadura=0;this.eventos.push({t:'pierdeArmadura',id:z.id,tipo:z.tipo,fila:z.fila,x:z.x});return true;}return this.comportamientosZ[z.tipo]?.quitarMetal?.(this,z)??false;}
 pincharGlobo(z:ZombiPvZ){if(this.terminado||z.vida<=0||!this.esVolador(z))return false;return this.comportamientosZ[z.tipo]?.pincharGlobo?.(this,z)??false;}
 soplar(p:PlantaPvZ){if(this.terminado||p.vida<=0||!this.plantas.includes(p))return;this.visibilidad.soplar(this);for(const z of this.zombis)if(z.vida>0&&this.esVolador(z)){z.datos.soplado=1;this.danarZombi(z,z.vida+z.armadura,'aplastar');}this.eventos.push({t:'estado',tipo:'viento',id:p.id,fila:p.fila,x:p.x,duracion:40});}
 dispararVector(p:PlantaPvZ,dano:number,vx:number,vy:number,proyectil='estrella',aereo=false){
  if(this.terminado||p.vida<=0||!finito(dano)||dano<=0||!finito(vx)||!finito(vy)||Math.hypot(vx,vy)<=0||Math.hypot(vx,vy)>2000||this.proyectiles.length>=500)return false;
  this.proyectiles.push({id:this.nuevoId(),tipo:proyectil,origen:p.id,fila:p.fila,x:p.x+(vx>0?30:vx<0?-30:0),y:this.centroFila(p.fila),velocidad:vx,velocidadY:vy,dano,danoTipo:'recto',aereo,impactados:[]});p.datos.atacaHasta=this.t+.2;
  this.eventos.push({t:'disparo',id:p.id,tipo:p.tipo,fila:p.fila,x:p.x,cantidad:dano,proyectil});return true;
 }
 lapidaEn(fila:number,col:number){return this.lapidas.find(q=>q.fila===fila&&q.col===col);}
 crearLapida(fila:number,col:number,aplastar=false){
  if(this.terminado||!this.casilla(fila,col)||col<3||this.lapidaEn(fila,col)||this.crateres.some(q=>q.fila===fila&&q.col===col))return null;
  const plantas=this.plantas.filter(p=>p.vida>0&&p.fila===fila&&p.col===col);if(plantas.length&&!aplastar)return null;
  for(const p of plantas)this.retirarPorTerreno(p);
  const q:LapidaPvZ={id:this.nuevoId(),fila,col,x:col*80+40};this.lapidas.push(q);this.eventos.push({t:'terreno',tipo:'lapida',id:q.id,fila,col,x:q.x});return q;
 }
 quitarLapida(fila:number,col:number){if(this.terminado)return false;const q=this.lapidaEn(fila,col);if(!q)return false;this.lapidas=this.lapidas.filter(v=>v!==q);this.eventos.push({t:'terreno',tipo:'lapida-quitada',id:q.id,fila,col,x:q.x});return true;}
 crearCrater(fila:number,col:number,vida=180){
  if(this.terminado||!this.casilla(fila,col)||!finito(vida)||vida<=0||vida>180||this.lapidaEn(fila,col))return null;
  for(const p of [...this.plantas])if(p.vida>0&&p.fila===fila&&p.col===col)this.retirarPorTerreno(p);
  let q=this.crateres.find(q=>q.fila===fila&&q.col===col);if(q){q.vida=Math.max(q.vida,vida);return q;}
  q={id:this.nuevoId(),fila,col,x:col*80+40,vida};this.crateres.push(q);this.eventos.push({t:'terreno',tipo:'crater',id:q.id,fila,col,x:q.x,duracion:vida});return q;
 }
 golpear(id:number){
  if(this.terminado||this.nivel.minijuego!=='aplastazombis'||!entero(id))return false;
  const z=this.zombis.find(z=>z.id===id&&z.vida>0&&!z.hipnotizado&&z.x>=-60&&z.x<=800);if(!z)return false;
  this.eventos.push({t:'martillo',id:z.id,fila:z.fila,x:z.x});
  if(z.armadura>0){z.armadura=Math.max(0,z.armadura-900);if(!z.armadura)this.eventos.push({t:'pierdeArmadura',id:z.id,tipo:z.tipo,fila:z.fila,x:z.x});}
  else this.danarZombi(z,z.vida,'aplastar');return true;
 }
 recoger(id:number){if(this.terminado||!entero(id))return false;const i=this.soles.findIndex(s=>s.id===id);if(i<0)return false;const s=this.soles[i];this.sol+=s.valor;this.soles.splice(i,1);this.eventos.push({t:'recogeSol',id,cantidad:s.valor});return true;}
 protegidaPorAbono(p:PlantaPvZ){return(p.datos.abonoRestantes??0)>0||(p.datos.abonoFinalPendiente??0)>0;}
 puedeUsarAbono(id:number){const p=this.plantas.find(p=>p.id===id&&p.vida>0);if(this.terminado||!entero(id)||this.abono<=0||!p||p.dormida||p.congelada||this.protegidaPorAbono(p))return false;const c=this.comportamientosP[p.tipo];return !!c?.abono&&(c.puedeAbono?.(this,p)??true);}
 usarAbono(id:number){
  if(!this.puedeUsarAbono(id))return false;const p=this.plantas.find(p=>p.id===id)!;
  this.abono--;this.origenAbono=p.id;
  try{this.comportamientosP[p.tipo].abono!(this,p);}finally{this.origenAbono=null;}
  if(!this.protegidaPorAbono(p))p.vida=this.plantasDef[p.tipo].vida;
  this.eventos.push({t:'abono',id:p.id,fila:p.fila,col:p.col});return true;
 }
 /** Reproducción interna de una habilidad: no abre una siembra gratuita para las órdenes del jugador. */
 casillasParaReproducir(p:PlantaPvZ){const libres:{fila:number;col:number}[]=[];if(this.origenAbono!==p.id)return libres;for(const fila of this.nivel.filas)for(let col=0;col<this.columnas;col++)if(this.validaSiembra(p.tipo,fila,col,true))libres.push({fila,col});return libres;}
 reproducirPlanta(p:PlantaPvZ,fila:number,col:number){if(this.origenAbono!==p.id||p.vida<=0||!this.plantas.includes(p)||!this.validaSiembra(p.tipo,fila,col,true))return null;const copia=this.sembrar(p.tipo,fila,col);copia.datos.origenAbono=p.id;const evento=this.eventos.at(-1);if(evento?.t==='siembra')evento.origen=p.id;return copia;}
 crearZonaHielo(p:PlantaPvZ,duracion:number){if(this.origenAbono!==p.id||!finito(duracion)||duracion<=0||duracion>60)return null;const zona:ZonaPvZ={id:this.nuevoId(),tipo:'hielo',origen:p.id,fila:p.fila,desde:p.x,hasta:800,vida:duracion};this.zonas.push(zona);this.eventos.push({t:'zona',tipo:'hielo',id:zona.id,origen:p.id,fila:p.fila,x:p.x,hasta:800,duracion});return zona;}
 esComestible(z:ZombiPvZ){return !z.datos.intocableTrineo&&this.zombisDef[z.tipo]?.comestible!==false;}

 plantarCinta(id:number,fila:number,col:number){if(this.terminado||!entero(id))return false;const i=this.cinta.findIndex(s=>s.id===id),s=this.cinta[i];if(!s||!this.validaSiembra(s.planta,fila,col,true)||this.nivel.minijuego==='bolos'&&col>2)return false;this.cinta.splice(i,1);if(this.nivel.minijuego==='bolos')this.proyectiles.push({id:this.nuevoId(),tipo:'bolo-'+s.planta,origen:0,fila,x:col*80+40,velocidad:240,dano:1800,danoTipo:s.planta==='nuez-explosiva'?'explosion':'aplastar',perforante:s.planta!=='nuez-explosiva',impactados:[]});else this.sembrar(s.planta,fila,col);return true;}
 ordenar(orden:unknown){if(!orden||typeof orden!=='object'||this.terminado)return false;const a=orden as OrdenPvZ;if(a.tipo==='romperJarron')return entero(a.id)&&this.romperJarron(a.id!);if(a.tipo==='plantarSobre')return entero(a.id)&&this.plantarSobre(a.id!,a.fila!,a.col!);if(a.tipo==='golpear')return entero(a.id)&&this.golpear(a.id!);if(a.tipo==='recoger')return entero(a.id)&&this.recoger(a.id!);if(a.tipo==='abono')return entero(a.id)&&this.usarAbono(a.id!);if(!this.casilla(a.fila,a.col))return false;if(a.tipo==='pala')return this.quitar(a.fila!,a.col!);if(a.tipo==='plantar'&&typeof a.planta==='string')return this.plantar(a.planta,a.fila!,a.col!);if(a.tipo==='plantarCinta'&&entero(a.id))return this.plantarCinta(a.id!,a.fila!,a.col!);return false;}
 crearSol(fila:number,x:number,valor=25,origen:'cielo'|'planta'='planta'){
  if(this.terminado||!this.nivel.filas.includes(fila)||!finito(x)||x<0||x>800||!finito(valor)||valor<=0||this.soles.length>=100)return null;
  const s:SolPvZ={id:this.nuevoId(),fila,x,valor,edad:0,vida:8,origen};this.soles.push(s);this.eventos.push({t:'sol',id:s.id,fila,x,cantidad:valor});return s;
 }
 crearZombi(tipo:string,fila:number,x=780,oleada=this.oleada){
  if(this.terminado||!Object.hasOwn(this.zombisDef,tipo)||!this.nivel.filas.includes(fila)||!finito(x)||x< -60||x>900||this.zombis.length>=300)return null;
  const d=this.zombisDef[tipo];if(d.agua==='solo'&&!this.esAgua(fila)||!d.agua&&this.esAgua(fila))return null;const z:ZombiPvZ={id:this.nuevoId(),tipo,fila,x,vida:d.vida,edad:0,sentido:-1,armadura:d.armadura?.vida??0,armaduraInicial:d.armadura?.vida??0,escudo:d.armadura?.tipo==='escudo',metal:d.armadura?.metal??false,lento:0,congelado:0,mantequilla:0,hipnotizado:false,comiendo:null,ceniza:false,sinBrazo:false,sinCabeza:false,datos:{},oleada};if(this.nivel.minijuego==='minizombis'){z.vida=Math.trunc(z.vida/4);z.armadura=Math.trunc(z.armadura/4);z.armaduraInicial=z.armadura;z.datos.escala=.5;z.datos.vidaMaxima=z.vida;}this.zombis.push(z);this.comportamientosZ[tipo]?.iniciar?.(this,z);return z;
 }
 disparar(p:PlantaPvZ,dano:number,tipo:TipoDano='recto',lento=0,proyectil?:string,alcance?:number){if(this.terminado||p.vida<=0||!finito(dano)||dano<=0||this.proyectiles.length>=500||alcance!==undefined&&(!finito(alcance)||alcance<=0))return false;this.proyectiles.push({id:this.nuevoId(),tipo:proyectil??(tipo==='hielo'?'guisante-hielo':'guisante'),origen:p.id,fila:p.fila,x:p.x+30,velocidad:330,dano,danoTipo:tipo,lento,...(alcance===undefined?{}:{hasta:p.x+alcance}),impactados:[]});p.datos.atacaHasta=this.t+.2;this.eventos.push({t:'disparo',id:p.id,tipo:p.tipo,fila:p.fila,x:p.x,cantidad:dano,proyectil:proyectil??(tipo==='hielo'?'guisante-hielo':'guisante')});return true;}
 hayBlanco(p:PlantaPvZ,alcance=800){return this.zombis.some(z=>this.puedeRecibirProyectil(z)&&!z.hipnotizado&&!z.sinCabeza&&z.fila===p.fila&&z.x>=p.x-10&&z.x<800&&z.x-p.x<=alcance);}
 danarPlanta(p:PlantaPvZ,cantidad:number,origen?:ZombiPvZ){if(this.terminado||p.vida<=0||this.protegidaPorAbono(p)||!finito(cantidad)||cantidad<=0)return false;const absorbido=Math.min(cantidad,p.datos.abonoEscudo??0);if(absorbido)p.datos.abonoEscudo-=absorbido;p.vida=Math.max(0,p.vida-(cantidad-absorbido));this.comportamientosP[p.tipo]?.alDanar?.(this,p,cantidad,origen);if(p.vida===0){this.comportamientosP[p.tipo]?.alMorir?.(this,p);this.eventos.push({t:'muere',id:p.id,tipo:p.tipo,fila:p.fila,x:p.x});this.hundirSobreBase(p);}return true;}
 danarZombi(z:ZombiPvZ,cantidad:number,tipo:TipoDano='recto'){
  if(this.terminado||z.vida<=0||z.datos.intocableTrineo||!finito(cantidad)||cantidad<=0)return false;let cuerpo=cantidad;
  const armaduraAntes=z.armadura;
  if(z.armadura>0&&(!z.escudo||tipo==='recto'||tipo==='hielo'||tipo==='perforante'||tipo==='explosion'||tipo==='fuego'||tipo==='aplastar')){
   z.armadura=Math.max(0,z.armadura-cantidad);cuerpo=(tipo==='perforante'||tipo==='fuego')&&z.escudo?cantidad:Math.max(0,cantidad-armaduraAntes);
  }
  z.vida=Math.max(0,z.vida-cuerpo);if(armaduraAntes>0&&z.armadura===0)this.eventos.push({t:'pierdeArmadura',id:z.id,tipo:z.tipo,fila:z.fila,x:z.x});
  if(tipo==='fuego'){z.lento=0;z.congelado=0;}if(z.vida<=0&&(tipo==='explosion'||tipo==='fuego'))z.ceniza=true;
  this.comportamientosZ[z.tipo]?.alDanar?.(this,z,cantidad,tipo);
  if(!this.esVehiculo(z)&&z.vida>0&&!z.sinBrazo&&z.vida<=(z.datos.vidaMaxima??this.zombisDef[z.tipo].vida)*2/3){z.sinBrazo=true;this.eventos.push({t:'pierdeBrazo',id:z.id,tipo:z.tipo,fila:z.fila,x:z.x});}
  // PvZ 1: el zombi deja de morder al perder la cabeza; el cuerpo cae después por desangrado.
  if(!this.esVehiculo(z)&&z.vida>0&&!z.sinCabeza&&z.vida<(z.datos.vidaMaxima??this.zombisDef[z.tipo].vida)/3){z.sinCabeza=true;z.comiendo=null;this.eventos.push({t:'pierdeCabeza',id:z.id,tipo:z.tipo,fila:z.fila,x:z.x});}
  this.eventos.push({t:'impacto',id:z.id,tipo,fila:z.fila,x:z.x,cantidad});if(z.vida===0)this.morirZombi(z);return true;
 }
 private morirZombi(z:ZombiPvZ){if(z.datos.contado)return;z.datos.contado=1;this.eliminados++;this.aplastazombis?.premiar(this,z);this.comportamientosZ[z.tipo]?.alMorir?.(this,z);this.eventos.push({t:'muere',id:z.id,tipo:z.tipo,fila:z.fila,x:z.x});}
 aplicarEstado(z:ZombiPvZ,estado:'lento'|'congelado'|'mantequilla'|'hipnotizado',segundos=0){if(this.terminado||z.vida<=0||z.datos.intocableTrineo||estado!=='hipnotizado'&&(this.esVehiculo(z)||!!z.datos.bajoTierra)||estado==='congelado'&&(!!z.datos.pogo||!!z.datos.cajaAbriendo||this.esVolador(z))||!finito(segundos)||segundos<0)return false;if(estado==='hipnotizado'){z.hipnotizado=true;z.sentido=z.datos.reversa?-1:1;z.comiendo=null;}else z[estado]=Math.max(z[estado],segundos);this.eventos.push({t:'estado',id:z.id,tipo:estado,fila:z.fila,x:z.x});return true;}
 explosion(fila:number,x:number,dano:number,radioFilas=1,radioX=120,aereo=true){if(this.terminado||!finito(x)||!finito(dano)||dano<=0)return;for(const z of this.zombis)if(z.vida>0&&(aereo||!this.esVolador(z))&&!z.hipnotizado&&Math.abs(z.fila-fila)<=radioFilas&&Math.abs(z.x-x)<=radioX)this.danarZombi(z,dano,'explosion');this.eventos.push({t:'explosion',fila,x});}
 get esNoche(){return this.nivel.area==='noche'||this.nivel.area==='niebla';}
 paso(){
  if(this.terminado){this.eventos=[];return;}if(this.dentroPaso)return;this.dentroPaso=true;
  try{
   const dt=this.pasoFijo;this.pasos++;this.t=this.pasos/60;this.eventos=[];
   for(const q of this.pistasHielo){q.vida-=dt;if(q.vida<=1e-9)this.eventos.push({t:'terreno',tipo:'pista-hielo-fin',id:q.id,fila:q.fila,x:q.desde});}this.pistasHielo=this.pistasHielo.filter(q=>q.vida>1e-9);
   for(const c of this.crateres)c.vida-=dt;for(const c of this.crateres)if(c.vida<=1e-9)this.eventos.push({t:'terreno',tipo:'crater-fin',id:c.id,fila:c.fila,col:c.col,x:c.x});this.crateres=this.crateres.filter(c=>c.vida>1e-9);
   for(const id of Object.keys(this.recargas))this.recargas[id]=Math.max(0,this.recargas[id]-dt);
   if(this.nivel.cinta){this.cintaEn-=dt;if(this.cintaEn<=0&&this.cinta.length<10){const espera=this.nivel.presionCinta?(this.cinta.length<=4?4:this.cinta.length<=6?4.25:this.cinta.length<=8?5:10):4;const planta=this.siguienteCinta();if(planta){this.cinta.push({id:this.nuevoId(),planta});this.cintaEmitida[planta]=(this.cintaEmitida[planta]??0)+1;this.eventos.push({t:'cinta',tipo:planta});}this.cintaEn=espera;}}
   else if(!this.esNoche&&!this.nivel.sinSolCielo){this.cieloEn-=dt;if(this.cieloEn<=0){this.crearSol(this.nivel.filas[this.azar.entero(this.nivel.filas.length)],this.azar.entre(25,695),25,'cielo');this.cielosCaidos++;this.cieloEn=Math.min(this.cielosCaidos*.1+4.25,9.5)+this.azar.entre(0,2.75);}}
   for(const s of this.soles){s.edad+=dt;s.vida-=dt;}this.soles=this.soles.filter(s=>s.vida>0);
   this.visibilidad.paso(this,dt);this.aplastazombis?.paso(this);this.rompejarrones?.paso(this);
   if(this.director){const actuales=this.zombis.filter(z=>z.oleada===this.oleada&&z.vida>0);const vida=actuales.reduce((a,z)=>a+z.vida+z.armadura,0),inicial=actuales.reduce((a,z)=>a+(z.datos.vidaMaxima??this.zombisDef[z.tipo].vida)+z.armaduraInicial,0);const nueva=this.director.paso(this.t,{vida,inicial:Math.max(inicial,this.vidaOleada),pendientes:0,plantas:this.sembradas,filasHielo:this.pistasHielo.filter(q=>q.desde<700).map(q=>q.fila)});
    if(nueva?.aviso)this.eventos.push({t:'oleadaEnorme',oleada:this.oleada+1});
    if(nueva&&!nueva.aviso){this.oleada=this.director.actual;this.vidaOleada=0;for(const a of nueva.apariciones){const z=this.crearZombi(a.tipo,a.fila,a.x,a.oleada);if(z)this.vidaOleada+=z.vida+z.armadura;}this.eventos.push({t:nueva.ultima?'ultimaOleada':'oleada',oleada:this.oleada});if(nueva.ultima&&this.esNoche&&this.lapidas.length)this.alzamientoEn=this.t+2.1;if(nueva.ultima&&this.nivel.emboscadaAgua)this.emboscadaEn=this.t+2.1;}
   }
   if(this.alzamientoEn!==null&&this.t+1e-9>=this.alzamientoEn){alzarLapidasPvZ(this);this.alzamientoEn=null;}
   if(this.emboscadaEn!==null&&this.t+1e-9>=this.emboscadaEn){emboscarPiscinaPvZ(this);this.emboscadaEn=null;}
   for(const zona of this.zonas){zona.vida-=dt;if(zona.vida<=0)continue;for(const z of this.zombis)if(z.vida>0&&!this.esVehiculo(z)&&!z.datos.bajoTierra&&!z.hipnotizado&&z.fila===zona.fila&&z.x>=zona.desde&&z.x<=zona.hasta)z.lento=Math.max(z.lento,dt*2);}this.zonas=this.zonas.filter(z=>z.vida>1e-9);
   for(const p of [...this.plantas]){if(p.vida<=0)continue;p.edad+=dt;p.congelada=Math.max(0,p.congelada-dt);if(!p.dormida&&!p.congelada)this.comportamientosP[p.tipo]?.paso(this,p,dt);}
   this.avanzarProyectiles(dt);this.avanzarCortacespedes(dt);
   for(const z of [...this.zombis]){if(z.vida<=0)continue;this.avanzarZombi(z,dt);if(this.terminado)break;}
   this.plantas=this.plantas.filter(p=>p.vida>0);this.zombis=this.zombis.filter(z=>z.vida>0);
   if(!this.terminado&&(this.director?.terminado||this.aplastazombis?.terminado||this.rompejarrones?.terminado)&&this.alzamientoEn===null&&this.emboscadaEn===null&&!this.zombis.some(z=>!z.hipnotizado))this.finalizar(true);
  }finally{this.dentroPaso=false;}
 }
 private vidaOleada=0;
 private siguienteCinta(){const ids=(this.nivel.cinta??[]).filter(id=>(this.cintaEmitida[id]??0)<(this.nivel.maximosCinta?.[id]??Infinity));if(!ids.length)return undefined;const pesos=ids.map(id=>{const peso=this.nivel.pesosCinta?.[id]??1,a=this.nivel.atenuarCinta?.[id];if(!a)return peso;const n=this.plantas.filter(p=>p.vida>0&&p.tipo===id).length+this.cinta.filter(s=>s.planta===id).length;return Math.trunc(peso+(a.pesoFinal-peso)*Math.min(a.cantidad,n)/a.cantidad);});let dado=this.azar.siguiente()*pesos.reduce((a,b)=>a+b,0),i=0;while(i<pesos.length-1&&dado>=pesos[i])dado-=pesos[i++];return ids[i];}
 private avanzarProyectiles(dt:number){
  for(const p of this.proyectiles){
   const antes=p.x,yAntes=p.y??this.centroFila(p.fila);p.x=p.velocidad>=0?Math.min(p.x+p.velocidad*dt,p.hasta??Infinity):Math.max(p.x+p.velocidad*dt,p.hasta??-Infinity);
   if(p.velocidadY!==undefined&&!p.tipo.startsWith('bolo-'))p.y=yAntes+p.velocidadY*dt;
   for(const antorcha of this.plantas.filter(q=>q.vida>0&&q.tipo==='plantorcha'&&q.fila===p.fila&&q.x>=Math.min(antes,p.x)-30&&q.x<=Math.max(antes,p.x)+30).sort((a,b)=>a.x-b.x)){
    if(p.antorchas?.includes(antorcha.id))continue;(p.antorchas??=[]).push(antorcha.id);
    if(p.tipo==='guisante-hielo'){p.tipo='guisante';p.danoTipo='recto';p.lento=0;}
    else if(p.tipo==='guisante'){p.tipo='guisante-fuego';p.danoTipo='fuego';p.dano=40;}
   }
   if(p.tipo.startsWith('bolo-')){p.y=yAntes+(p.velocidadY??0)*dt;const min=this.centroFila(Math.min(...this.nivel.filas)),max=this.centroFila(Math.max(...this.nivel.filas));if(p.y<min){p.y=min+(min-p.y);p.velocidadY=Math.abs(p.velocidadY??0);}if(p.y>max){p.y=max-(p.y-max);p.velocidadY=-Math.abs(p.velocidadY??0);}p.fila=Math.max(0,Math.min(this.filas-1,Math.floor(p.y/this.altoFila)));}
   const y=p.y??yAntes,dx=p.x-antes,dy=y-yAntes,distancia=(z:ZombiPvZ)=>{const u=Math.max(0,Math.min(1,((z.x-antes)*dx+(this.centroFila(z.fila)-yAntes)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(z.x-antes-u*dx,this.centroFila(z.fila)-yAntes-u*dy);};
   const blancos=this.zombis.filter(z=>this.puedeRecibirProyectil(z,p.danoTipo,p.aereo??false)&&!z.hipnotizado&&!p.impactados.includes(z.id)&&distancia(z)<=18*(z.datos.escala??1)).sort((a,b)=>p.velocidad<0?b.x-a.x:a.x-b.x);
   for(const z of blancos){
    if(p.danoTipo==='explosion'&&p.tipo.startsWith('bolo-'))this.explosion(z.fila,z.x,p.dano);
    else if(p.tipo==='bolo-nuez'){
     if(z.armadura>0){const cantidad=Math.min(z.armadura,z.escudo?400:900);z.armadura-=cantidad;if(z.armadura===0)this.eventos.push({t:'pierdeArmadura',id:z.id,tipo:z.tipo,fila:z.fila,x:z.x,cantidad});}
     else this.danarZombi(z,1800,'aplastar');
     const prob=z.fila===0?1:z.fila===1?.75:z.fila===2?.5:z.fila===3?.25:0;p.impactados.push(z.id);p.velocidadY=this.azar.siguiente()<prob?240:-240;p.y??=yAntes;break;
    }else {
     this.danarZombi(z,p.dano,p.danoTipo);if(p.aereo&&p.tipo==='pincho'&&z.vida>0)this.pincharGlobo(z);
     if(p.tipo==='guisante-fuego'){const secundarios=this.zombis.filter(q=>q!==z&&this.puedeRecibirProyectil(q)&&!q.hipnotizado&&q.fila===z.fila&&q.x>=z.x&&q.x<=z.x+100);const dano=Math.max(1,Math.min(13,Math.floor(40/Math.max(1,secundarios.length))));for(const q of secundarios)this.danarZombi(q,dano,'fuego');}
    }
    if(p.lento&&!(z.escudo&&z.armadura>0))this.aplicarEstado(z,'lento',p.lento);p.impactados.push(z.id);if(!p.perforante){p.x=9999;break;}
   }
  }this.proyectiles=this.proyectiles.filter(p=>p.x>=-100&&p.x<=850&&(p.y===undefined||p.y>=-100&&p.y<=this.filas*this.altoFila+100)&&(p.hasta===undefined||p.x<p.hasta));
 }
 private avanzarCortacespedes(dt:number){for(const c of this.cortacespedes){if(c.estado!=='activo')continue;const antes=c.x;c.x+=(this.esAgua(c.fila)&&this.nivel.cortacespedAgua?250:400)*dt;for(const z of this.zombis)if(z.vida>0&&!z.datos.bajoTierra&&!this.esVolador(z)&&!z.hipnotizado&&z.fila===c.fila&&z.x>=antes-35&&z.x<=c.x+35)this.danarZombi(z,999999,'aplastar');if(c.x>850||this.esAgua(c.fila)&&!this.nivel.cortacespedAgua&&c.x>50)c.estado='gastado';}}
 private avanzarZombi(z:ZombiPvZ,dt:number){
  z.edad+=dt;z.lento=Math.max(0,z.lento-dt);z.congelado=Math.max(0,z.congelado-dt);z.mantequilla=Math.max(0,z.mantequilla-dt);
  if(z.sinCabeza){z.comiendo=null;z.datos.sangrado=(z.datos.sangrado??0)+dt;const prob=this.zombisDef[z.tipo].vida>=500?.6:.2;while(z.datos.sangrado>=.01&&z.vida>0){z.datos.sangrado-=.01;if(this.azar.siguiente()<prob)z.vida=Math.max(0,z.vida-1);}if(!z.vida)this.morirZombi(z);return;}
  if(z.datos.mareoHasta>this.t||z.datos.zampalga||z.datos.arrastrado||z.congelado>0||z.mantequilla>0){z.comiendo=null;return;}
  if((z.datos.emergeHasta??0)>this.t){z.comiendo=null;return;}
  const seguir=this.comportamientosZ[z.tipo]?.paso?.(this,z,dt);if(z.vida<=0||seguir===false)return;
  const d=this.zombisDef[z.tipo],vel=(z.datos.velocidad??d.velocidad)*(z.lento>0?.5:1);
  if(z.hipnotizado){const enemigo=this.zombis.filter(v=>v!==z&&v.vida>0&&!v.hipnotizado&&!v.sinCabeza&&v.fila===z.fila&&Math.abs(v.x-z.x)<35).sort((a,b)=>a.x-b.x)[0];if(enemigo){z.comiendo=enemigo.id;this.danarZombi(enemigo,d.mordida*(z.lento>0?.5:1)*dt,'recto');}else{z.comiendo=null;z.x+=z.sentido*vel*dt;if(z.x>850||z.x<-100)z.vida=0;}return;}
  const aliado=this.zombis.find(v=>v!==z&&v.vida>0&&v.hipnotizado&&v.fila===z.fila&&Math.abs(v.x-z.x)<35);if(aliado){z.comiendo=aliado.id;this.danarZombi(aliado,d.mordida*(z.lento>0?.5:1)*dt,'recto');return;}
  const plantas=this.plantas.filter(p=>!z.datos.ignoraMordida&&p.vida>0&&!p.datos.enAire&&!this.plantasDef[p.tipo].datos?.ignoraMordida&&p.fila===z.fila&&Math.abs(p.x-z.x)<35*(z.datos.escala??1)).sort((a,b)=>b.x-a.x||(['temporal','cubierta','principal','base'].indexOf(a.capa)-['temporal','cubierta','principal','base'].indexOf(b.capa))),p=plantas[0];
  if(z.datos.saltando>this.t){z.comiendo=null;return;}
  if(p){if(z.comiendo!==p.id)this.eventos.push({t:'muerde',id:z.id,fila:z.fila,x:z.x});z.comiendo=p.id;this.danarPlanta(p,d.mordida*(z.lento>0?.5:1)*dt,z);}else{z.comiendo=null;if(!(this.nivel.objetivo&&this.objetivoVida&&z.fila===this.nivel.objetivo.fila&&Math.abs(z.x-(this.nivel.objetivo.col*80+40))<35))z.x+=(z.datos.reversa?1:-1)*vel*dt;}
  if(z.datos.reversa&&z.x>850){this.danarZombi(z,z.vida+z.armadura,'aplastar');return;}
  if(this.nivel.objetivo&&this.objetivoVida!==undefined&&z.fila===this.nivel.objetivo.fila&&Math.abs(z.x-(this.nivel.objetivo.col*80+40))<35){this.objetivoVida=Math.max(0,this.objetivoVida-d.mordida*dt);if(this.objetivoVida===0){this.eventos.push({t:'objetivo',fila:z.fila});this.finalizar(false);return;}}
  if(!z.datos.reversa&&z.x< -15){const c=this.cortacespedes.find(c=>c.fila===z.fila);if(!this.esVolador(z)&&!z.datos.bajoTierra&&c?.estado==='listo'){c.estado='activo';this.eventos.push({t:'cortacesped',fila:z.fila,x:c.x});this.danarZombi(z,999999,'aplastar');}else if(z.x< -60)this.finalizar(false);}
 }
 private finalizar(gano:boolean){if(this.terminado)return;this.terminado=gano?'gano':'perdio';this.eventos.push({t:'fin',gano});}
 /** Consume cada evento una sola vez; drenar también tras órdenes que emitan eventos. */
 consumirEventos(){const eventos=this.eventos;this.eventos=[];return eventos;}
 /** Varios pasos para ×2: conserva todos los eventos entre pasos y nunca depende del dibujo. */
 avanzar(cantidad=1){if(!entero(cantidad)||cantidad<0||cantidad>600)throw new Error('Cantidad de pasos inválida');const eventos=this.consumirEventos();for(let i=0;i<cantidad;i++){this.paso();eventos.push(...this.consumirEventos());if(this.terminado)break;}return eventos;}
 /** Datos nuevos de visibilidad, sin copiar el combate completo en cada cuadro de dibujo. */
 estadoVisibilidad(){return{niebla:this.visibilidad.estadoNiebla(this),tormenta:this.visibilidad.estadoTormenta()};}
 estado():EstadoPvZ {return structuredClone({...this.rompejarrones?.estado(),...this.estadoVisibilidad(),version:1,nivel:this.nivel.id,t:this.t,pasos:this.pasos,sol:this.sol,abono:this.abono,oleada:this.oleada,terminado:this.terminado,plantas:this.plantas,zombis:this.zombis,proyectiles:this.proyectiles,soles:this.soles,cortacespedes:this.cortacespedes,recargas:this.recargas,cinta:this.cinta,zonas:this.zonas,lapidas:this.lapidas,crateres:this.crateres,pistasHielo:this.pistasHielo,objetivoVida:this.objetivoVida,eliminados:this.eliminados,sembradas:this.sembradas});}
}
