import type {MotorPvZ} from './motor';
import type {JarronPvZ,SobrePvZ} from '../tipos';
import {exigirPvZ,enteroPvZ,numeroPvZ,objetoPvZ} from './validacion';

type Contenido={planta?:string;zombi?:string;sol?:number};
type JarronInterno=Omit<JarronPvZ,'contenido'>&{contenido:Contenido};
export interface InstantaneaRompejarronesPvZ {recipientes:JarronInterno[];tarjetas:SobrePvZ[];indice:number;iniciada:boolean;finalizada:boolean;siguienteEn:number|null}
interface EtapaJarrones {columna:number;verdes:number;plantas:Record<string,number>;zombis:Record<string,number>}
/** Las tres tandas de la primera aventura de PC, distintas del puzle independiente. */
export const ETAPAS_ROMPEJARRONES:readonly EtapaJarrones[]=[
 {columna:6,verdes:0,plantas:{lanzaguisantes:5,aplastaflor:5},zombis:{zombi:4,caracubo:1}},
 {columna:5,verdes:2,plantas:{lanzaguisantes:4,hielaguisantes:5,aplastaflor:4},zombis:{zombi:5,caracubo:1,'zombi-futbolista':1}},
 {columna:4,verdes:3,plantas:{lanzaguisantes:5,hielaguisantes:5,hipnoseta:5},zombis:{zombi:6,caracubo:2,'zombi-bailon':1,'zombi-cajita':1}},
];

/** Director sin acceso a la vista. El contenido oculto nunca forma parte del estado público. */
export class RompejarronesPvZ {
 private recipientes:JarronInterno[]=[];private tarjetas:SobrePvZ[]=[];
 private indice=0;private iniciada=false;private finalizada=false;private siguienteEn:number|null=null;
 private siembraActiva:string|null=null;private motor:MotorPvZ|null=null;
 get terminado(){return this.finalizada;}
 get etapaJarrones(){return this.indice+1;}
 get jarrones():JarronPvZ[]{return this.recipientes.map(({contenido,...j})=>({...j,...((j.verde||this.motor?.estaIluminado(j.fila,j.col))?{contenido:{...contenido}}:{})}));}
 get sobres():SobrePvZ[]{return this.tarjetas.map(s=>({...s}));}
 estado(){return {jarrones:this.jarrones,sobres:this.sobres,etapaJarrones:this.etapaJarrones};}
 /** Privado de la simulación: contiene los premios ocultos; nunca enviarlo como vista al rival. */
 exportar():InstantaneaRompejarronesPvZ{return structuredClone({recipientes:this.recipientes,tarjetas:this.tarjetas,indice:this.indice,iniciada:this.iniciada,finalizada:this.finalizada,siguienteEn:this.siguienteEn});}
 restaurar(e:InstantaneaRompejarronesPvZ,m:MotorPvZ){
  exigirPvZ(e&&enteroPvZ(e.indice,0,ETAPAS_ROMPEJARRONES.length-1)&&e.iniciada===true&&typeof e.finalizada==='boolean'&&(e.siguienteEn===null||numeroPvZ(e.siguienteEn)&&e.siguienteEn>=0)&&Array.isArray(e.recipientes)&&e.recipientes.length<=35&&Array.isArray(e.tarjetas)&&e.tarjetas.length<=35,'Rompejarrones inválido');
  const ids=new Set<number>(),casillas=new Set<string>();
  for(const j of e.recipientes){
   exigirPvZ(j&&enteroPvZ(j.id,1)&&!ids.has(j.id)&&m.casilla(j.fila,j.col)&&j.x===j.col*80+40&&typeof j.verde==='boolean'&&objetoPvZ(j.contenido));ids.add(j.id);
   const clave=j.fila+':'+j.col;exigirPvZ(!casillas.has(clave));casillas.add(clave);
   const c=j.contenido;exigirPvZ(Object.keys(c).length===1&&(typeof c.planta==='string'&&Object.hasOwn(m.plantasDef,c.planta)||typeof c.zombi==='string'&&Object.hasOwn(m.zombisDef,c.zombi)||enteroPvZ(c.sol,1,20)));
  }
  for(const s of e.tarjetas){exigirPvZ(s&&enteroPvZ(s.id,1)&&!ids.has(s.id)&&m.nivel.filas.includes(s.fila)&&Object.hasOwn(m.plantasDef,s.planta)&&numeroPvZ(s.x)&&s.x>=0&&s.x<=720&&numeroPvZ(s.vida)&&s.vida>0&&s.vida<=15);ids.add(s.id);}
  this.recipientes=structuredClone(e.recipientes);this.tarjetas=structuredClone(e.tarjetas);this.indice=e.indice;this.iniciada=e.iniciada;this.finalizada=e.finalizada;this.siguienteEn=e.siguienteEn;this.siembraActiva=null;this.motor=m;
 }
 iniciar(m:MotorPvZ){if(this.iniciada||m.terminado)return;this.iniciada=true;this.motor=m;this.preparar(m);}
 siembraAutorizada(tipo:string){return this.siembraActiva===tipo;}
 plantarSobre(m:MotorPvZ,id:number,fila:number,col:number){
  if(!this.iniciada||this.finalizada||m.terminado||!Number.isSafeInteger(id))return false;
  const sobre=this.tarjetas.find(s=>s.id===id&&s.vida>0);if(!sobre)return false;
  this.siembraActiva=sobre.planta;
  try{
   const p=m.sembrarPremioJarron(sobre.planta,fila,col);if(!p)return false;
   this.tarjetas=this.tarjetas.filter(s=>s!==sobre);
   m.eventos.push({t:'sobre',tipo:'sembrado',id:sobre.id,origen:p.id,fila,col});return true;
  }finally{this.siembraActiva=null;}
 }
 romper(m:MotorPvZ,id:number){
  if(!this.iniciada||this.finalizada||m.terminado||!Number.isSafeInteger(id))return false;
  const j=this.recipientes.find(j=>j.id===id);if(!j)return false;
  this.recipientes=this.recipientes.filter(q=>q!==j);
  m.eventos.push({t:'jarron',tipo:'roto',id:j.id,fila:j.fila,col:j.col,x:j.x});
  if(j.contenido.planta){
   const s:SobrePvZ={id:m.nuevoId(),planta:j.contenido.planta,fila:j.fila,x:j.x,vida:15};this.tarjetas.push(s);
   m.eventos.push({t:'sobre',tipo:s.planta,id:s.id,fila:s.fila,x:s.x,duracion:s.vida});
  }else if(j.contenido.zombi)m.crearZombi(j.contenido.zombi,j.fila,j.x);
  else if(j.contenido.sol)for(let n=0;n<j.contenido.sol;n++)m.crearSol(j.fila,Math.min(800,j.x+15*n),25);
  return true;
 }
 /** La caja sorpresa abre los recipientes de su casilla y las ocho vecinas. */
 romperCerca(m:MotorPvZ,fila:number,col:number){
  if(m.terminado||!Number.isSafeInteger(fila)||!Number.isSafeInteger(col))return;
  for(const j of [...this.recipientes])if(Math.abs(j.fila-fila)<=1&&Math.abs(j.col-col)<=1)this.romper(m,j.id);
 }
 paso(m:MotorPvZ){
  if(!this.iniciada||this.finalizada||m.terminado)return;
  for(const s of this.tarjetas){s.vida-=m.pasoFijo;if(s.vida<=1e-9)m.eventos.push({t:'sobre',tipo:'expirado',id:s.id,fila:s.fila,x:s.x});}
  this.tarjetas=this.tarjetas.filter(s=>s.vida>1e-9);
  if(this.siguienteEn!==null){
   if(m.t+1e-9<this.siguienteEn)return;
   m.limpiarEtapaRompejarrones();this.siguienteEn=null;this.indice++;this.preparar(m);return;
  }
  if(this.recipientes.length||m.zombis.some(z=>z.vida>0&&!z.hipnotizado&&!z.sinCabeza))return;
  if(this.indice===ETAPAS_ROMPEJARRONES.length-1){this.finalizada=true;return;}
  this.siguienteEn=m.t+5;
  m.eventos.push({t:'jarron',tipo:'transicion',cantidad:this.etapaJarrones,duracion:5});
 }
 private preparar(m:MotorPvZ){
  this.recipientes=[];this.tarjetas=[];const etapa=ETAPAS_ROMPEJARRONES[this.indice];
  const celdas=m.nivel.filas.flatMap(fila=>Array.from({length:9-etapa.columna},(_,i)=>({fila,col:i+etapa.columna})));
  const colocar=(contenido:Contenido)=>{
   if(!celdas.length)throw new Error('Rompejarrones necesita cinco filas de tierra');
   const [celda]=celdas.splice(m.azar.entero(celdas.length),1);
   this.recipientes.push({id:m.nuevoId(),fila:celda.fila,col:celda.col,x:celda.col*80+40,verde:false,contenido});
  };
  for(const [planta,cantidad]of Object.entries(etapa.plantas))for(let i=0;i<cantidad;i++)colocar({planta});
  for(const [zombi,cantidad]of Object.entries(etapa.zombis))for(let i=0;i<cantidad;i++)colocar({zombi});
  const plantas=this.recipientes.filter(j=>j.contenido.planta);
  for(let i=0;i<etapa.verdes;i++){const [j]=plantas.splice(m.azar.entero(plantas.length),1);j.verde=true;}
  m.oleada=this.etapaJarrones;
  m.eventos.push({t:'jarron',tipo:'etapa',cantidad:this.etapaJarrones});
 }
}
