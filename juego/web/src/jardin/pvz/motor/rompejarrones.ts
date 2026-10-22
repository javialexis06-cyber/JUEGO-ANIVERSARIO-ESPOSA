import type {MotorPvZ} from './motor';
import type {JarronPvZ,SobrePvZ} from '../tipos';

type Contenido={planta?:string;zombi?:string;sol?:number};
type JarronInterno=Omit<JarronPvZ,'contenido'>&{contenido:Contenido};
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
