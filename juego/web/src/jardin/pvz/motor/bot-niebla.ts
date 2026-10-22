import type {DefNivel,ZombiPvZ} from '../tipos';
import type {MotorPvZ} from './motor';

/** Seis sobres ganados antes del nivel; el minijuego conserva su banco propio. */
export function seleccionNieblaPvZ(disponibles:readonly string[],nivel:DefNivel):string[]{
 if(nivel.cinta)return [];
 if(nivel.semillas)return [...nivel.semillas];
 const unicos=[...new Set(disponibles)],elegidas:string[]=[];
 const elegir=(...ids:string[])=>{const id=ids.find(id=>unicos.includes(id)&&!elegidas.includes(id));if(id)elegidas.push(id);};
 elegir('seta-desesporada');elegir('seta-solar','girasol');elegir('nenufar');
 elegir(['4-7','4-9'].includes(nivel.id)?'humoseta':nivel.zombis.includes('zombi-pogo')||nivel.zombis.includes('zombi-delfin')?'nuez-alta':'nuez');
 elegir(nivel.id==='4-9'?'magnetoseta':nivel.id==='4-4'?'marseta':'petacereza');
 if(nivel.zombis.includes('zombi-globo'))elegir('trebolador','cactus');
 else if(nivel.zombis.includes('zombi-minero'))elegir('bipetidora');
 else elegir('marseta','humoseta');
 for(const id of unicos)if(elegidas.length<6&&!elegidas.includes(id))elegidas.push(id);
 return elegidas.slice(0,6);
}

/** El piloto inspecciona el estado del motor, no una imagen: no acredita destreza en la niebla. */
export function crearPilotoNieblaPvZ(){
 let actuarEn=0,romperEn=0;
 return(m:MotorPvZ)=>{
  if(m.terminado)return;
  for(const s of [...m.soles])m.ordenar({tipo:'recoger',id:s.id});
  if(m.t<actuarEn)return;actuarEn=m.t+.1;
  const enemigos=m.zombis.filter(z=>z.vida>0&&!z.hipnotizado&&!z.sinCabeza&&!z.datos.arrastrado&&!z.datos.zampalga);
  const frente=(fila:number)=>Math.min(999,...enemigos.filter(z=>z.fila===fila).map(z=>z.x));
  const velocidad=(z:ZombiPvZ)=>(z.datos.velocidad??m.zombisDef[z.tipo].velocidad)*(z.lento>0?.5:1);
  const peligro=(z:ZombiPvZ)=>(z.x+60)/Math.max(1,velocidad(z));
  const filas=[...m.nivel.filas].sort((a,b)=>Math.min(999,...enemigos.filter(z=>z.fila===a).map(peligro))-Math.min(999,...enemigos.filter(z=>z.fila===b).map(peligro))||a-b);
  const agua=(fila:number)=>m.esAgua(fila);
  const jarrones=()=>m.jarrones??[];
  const libre=(fila:number,col:number)=>m.casilla(fila,col)&&!m.plantaEn(fila,col)&&!m.lapidaEn(fila,col)&&!m.crateres.some(q=>q.fila===fila&&q.col===col)&&!jarrones().some(q=>q.fila===fila&&q.col===col);
  const pagar=(id:string)=>m.semillas.includes(id)&&m.sol>=(m.plantasDef[id]?.sol??Infinity)&&(m.recargas[id]??0)<=0;
  const sembrar=(id:string,fila:number,col:number,reemplazar=false)=>{
   if(!m.casilla(fila,col)||!pagar(id))return false;
   let p=m.plantaEn(fila,col);
   if(p&&reemplazar&&(p.tipo==='seta-desesporada'||id==='petacereza'||id==='petaseta')&&id!==p.tipo){if(!m.ordenar({tipo:'pala',fila,col}))return false;p=undefined;}
   if(p||!libre(fila,col))return false;
   const d=m.plantasDef[id];
   if(agua(fila)&&d.agua!=='solo'&&d.agua!=='tambien'&&(d.capa??'principal')!=='base'&&!m.plantaEn(fila,col,'base')){
    if(!pagar('nenufar')||m.sol<d.sol+m.plantasDef.nenufar.sol)return false;
    return m.ordenar({tipo:'plantar',planta:'nenufar',fila,col});
   }
   return m.ordenar({tipo:'plantar',planta:id,fila,col});
  };
  const grupo=(z:ZombiPvZ,radio=220)=>enemigos.filter(v=>Math.hypot(v.x-z.x,m.centroFila(v.fila)-m.centroFila(z.fila))<=radio).reduce((n,v)=>n+v.vida+v.armadura,0);
  const cerca=(id:string,z:ZombiPvZ,sobre?:number)=>{
   const centro=Math.max(0,Math.min(8,Math.floor(z.x/80))),vecinas=m.nivel.filas.filter(f=>Math.abs(f-z.fila)<=1);
   const fs=id==='petaseta'||id==='petacereza'?[z.fila,...vecinas]:[z.fila];
   for(const fila of fs)for(const col of[centro,centro-1,centro+1]){
    if(!m.casilla(fila,col)||col*80+40>z.x+30&&id==='hipnoseta')continue;
    if(sobre===undefined){if(sembrar(id,fila,col,true))return true;}
    else{
     const p=m.plantaEn(fila,col);if(p&&['seta-desesporada','planterna'].includes(p.tipo))m.ordenar({tipo:'pala',fila,col});
     if(libre(fila,col)&&m.ordenar({tipo:'plantarSobre',id:sobre,fila,col}))return true;
    }
   }return false;
  };

  if(m.nivel.minijuego==='rompejarrones'){
   const tiros=(fila:number)=>m.plantas.filter(p=>p.vida>0&&p.fila===fila&&['lanzaguisantes','hielaguisantes'].includes(p.tipo)).length;
   for(const s of [...m.sobres].sort((a,b)=>a.vida-b.vida||a.id-b.id)){
    if(s.planta==='aplastaflor'||s.planta==='hipnoseta'){
     const objetivos=[...enemigos].sort((a,b)=>(b.tipo==='zombi-cajita'?2000:0)+(b.tipo==='zombi-bailon'?1800:0)+b.vida+b.armadura-((a.tipo==='zombi-cajita'?2000:0)+(a.tipo==='zombi-bailon'?1800:0)+a.vida+a.armadura)||peligro(a)-peligro(b));
     for(const z of objetivos)if(cerca(s.planta,z,s.id))return;
     for(const fila of filas){
      if(m.plantas.some(p=>p.vida>0&&p.fila===fila&&p.tipo===s.planta))continue;
      const borde=Math.min(9,...jarrones().filter(q=>q.fila===fila).map(q=>q.col));
      for(const col of[borde-1,borde-2,borde-3])if(libre(fila,col)&&m.ordenar({tipo:'plantarSobre',id:s.id,fila,col}))return;
     }continue;
    }
    const fs=[...filas].sort((a,b)=>{
     const frio=(f:number)=>s.planta==='hielaguisantes'&&m.plantas.some(p=>p.fila===f&&p.tipo==='hielaguisantes')?2:0;
     return tiros(a)+frio(a)-tiros(b)-frio(b)||frente(a)-frente(b)||a-b;
    });
    for(const fila of fs)for(const col of[1,2,0,3])if(libre(fila,col)&&col*80+40<frente(fila)+20&&m.ordenar({tipo:'plantarSobre',id:s.id,fila,col}))return;
   }
   if(m.t<romperEn)return;
   const vivos=enemigos.filter(z=>!z.sinCabeza),sinDefensa=vivos.some(z=>tiros(z.fila)===0&&!m.plantas.some(p=>p.fila===z.fila&&['aplastaflor','hipnoseta'].includes(p.tipo)));
   if(vivos.length>=3&&!sinDefensa)return;
   const siguiente=[...jarrones()].sort((a,b)=>Number(b.verde)-Number(a.verde)||b.col-a.col||frente(b.fila)-frente(a.fila)||a.fila-b.fila)[0];
   if(siguiente&&m.ordenar({tipo:'romperJarron',id:siguiente.id}))romperEn=m.t+.35;
   return;
  }

  if(m.nivel.cinta){
   const acuaticas=filas.filter(agua);
   for(const s of [...m.cinta].sort((a,b)=>Number(b.planta==='trebolador'&&enemigos.some(z=>m.esVolador(z)))-Number(a.planta==='trebolador'&&enemigos.some(z=>m.esVolador(z))))){
    const plantar=(fila:number,col:number)=>m.ordenar({tipo:'plantarCinta',id:s.id,fila,col});
    if(s.planta==='trebolador'){
     if(!enemigos.some(z=>m.esVolador(z))&&m.cinta.length<8)continue;
     for(const fila of filas.filter(f=>!agua(f)))for(const col of[0,1,7,8,6,5,4,3,2])if(libre(fila,col)&&plantar(fila,col))return;
     continue;
    }
    if(s.planta==='nenufar'){
     for(const col of[1,2,3,0,4,7,8])for(const fila of acuaticas)if(!m.plantaEn(fila,col,'base')&&!m.plantaEn(fila,col)&&plantar(fila,col))return;
     continue;
    }
    if(s.planta==='marseta'){
     const fs=[...acuaticas].sort((a,b)=>m.plantas.filter(p=>p.tipo==='marseta'&&p.fila===a).length-m.plantas.filter(p=>p.tipo==='marseta'&&p.fila===b).length||frente(a)-frente(b));
     for(const col of[5,6,4,7,3,2,1,0,8])for(const fila of fs)if(libre(fila,col)&&col*80+40<=frente(fila)+25&&plantar(fila,col))return;
     continue;
    }
    if(s.planta==='calabaza'){
     const ps=m.plantas.filter(p=>p.vida>0&&p.capa==='principal'&&!m.plantaEn(p.fila,p.col,'cubierta')).sort((a,b)=>Number(b.tipo==='magnetoseta')-Number(a.tipo==='magnetoseta')||frente(a.fila)-frente(b.fila)||b.col-a.col);
     for(const p of ps)if(plantar(p.fila,p.col))return;
     for(const fila of acuaticas)for(const col of[4,3,2,1,0,7,8])if(m.plantaEn(fila,col,'base')&&!m.plantaEn(fila,col,'cubierta')&&plantar(fila,col))return;
     continue;
    }
    const cols=s.planta==='magnetoseta'?[5,4,3,2,6,1,0]:s.planta==='frustrella'?[3,4,2,5,1,0,6]:[1,2,0,3,4,5];
    const fs=s.planta==='frustrella'||s.planta==='magnetoseta'?[1,4,0,5,2,3]:filas;
    for(const col of cols)for(const fila of fs)if(m.nivel.filas.includes(fila)&&libre(fila,col)&&plantar(fila,col))return;
    if(m.cinta.length>=7){const viejo=m.plantas.filter(p=>p.tipo===s.planta&&p.vida>0).sort((a,b)=>a.vida-b.vida||a.col-b.col)[0];if(viejo&&m.ordenar({tipo:'pala',fila:viejo.fila,col:viejo.col})&&plantar(viejo.fila,viejo.col))return;}
   }return;
  }
  for(const z of enemigos.filter(z=>z.tipo==='zombi-delfin'&&z.datos.montado&&z.x>600))if(!m.plantaEn(z.fila,7,'base')&&!m.plantaEn(z.fila,7)&&pagar('nenufar')&&m.ordenar({tipo:'plantar',planta:'nenufar',fila:z.fila,col:7}))return;
  const voladores=enemigos.filter(z=>m.esVolador(z));
  const muro=m.semillas.includes('nuez-alta')?'nuez-alta':'nuez';
  if(voladores.length&&pagar('trebolador'))for(const fila of filas.filter(f=>!agua(f)))for(const col of[0,1,7,8,6,5])if(sembrar('trebolador',fila,col,true))return;
  if(voladores.length&&m.semillas.includes('cactus')){
   for(const z of voladores.sort((a,b)=>peligro(a)-peligro(b)))if(!m.plantas.some(p=>p.vida>0&&p.fila===z.fila&&p.tipo==='cactus'))for(const col of[2,1,0,3,4])if(col*80+40<=z.x-15&&sembrar('cactus',z.fila,col,true))return;
  }
  for(const z of [...enemigos].sort((a,b)=>grupo(b,120)-grupo(a,120)||peligro(a)-peligro(b))){
   if(z.x<500&&(grupo(z,120)>1200||peligro(z)<12)&&cerca('petacereza',z))return;
  }
  if(m.semillas.includes('marseta')){
   const acuaticas=filas.filter(agua).sort((a,b)=>m.plantas.filter(p=>p.vida>0&&p.tipo==='marseta'&&p.fila===a).length-m.plantas.filter(p=>p.vida>0&&p.tipo==='marseta'&&p.fila===b).length||frente(a)-frente(b));
   for(const fila of acuaticas)for(const col of[5,4,3,2,1,0,6,7,8])if(col*80+40<=frente(fila)+25&&sembrar('marseta',fila,col))return;
  }
  // La tierra se defiende con sobres gratuitos; la primera columna produce la reserva acuática.
  for(const col of[5,6,4,3,2,1,0,7,8])for(const fila of filas.filter(f=>!agua(f)))if(col*80+40<=frente(fila)+25&&sembrar('seta-desesporada',fila,col))return;
  const productora=m.semillas.includes('seta-solar')?'seta-solar':'girasol';
  for(const fila of filas.filter(f=>!agua(f)))if(sembrar(productora,fila,0))return;
  // La Humoseta atraviesa grupos de flotadores; los hongos gratuitos hacen de primera barrera.
  if(m.semillas.includes('humoseta'))for(const col of[3,4,2,1,0,5])for(const fila of filas.filter(agua))if(m.plantas.filter(p=>p.vida>0&&p.fila===fila&&p.tipo==='humoseta').length<2&&col*80+40<=frente(fila)+25&&sembrar('humoseta',fila,col,true))return;
  if(m.semillas.includes('magnetoseta'))for(const col of[2,4])for(const fila of[1,4])if(sembrar('magnetoseta',fila,col,true))return;
  // Preparar el muro antes de gastar cada Nenúfar en una tiradora aislada.
  for(const fila of filas.filter(agua))if(!m.plantas.some(p=>p.vida>0&&p.fila===fila&&p.tipo===muro)){
   for(const col of[6,5,4,3,2,1,0])if(col*80+40<=frente(fila)+30&&sembrar(muro,fila,col,true))return;
  }
  const urgente=enemigos.some(z=>z.x<400&&(z.vida+z.armadura>800||peligro(z)<8));
  if(urgente&&m.semillas.includes('petacereza')&&(m.recargas.petacereza??0)<=0&&m.sol<150)return;
  for(const fila of filas.filter(f=>!agua(f)))if(sembrar(productora,fila,1))return;
  for(const col of[5,4,3,2,1,0,6,7,8])for(const fila of filas.filter(agua)){
   if(!m.semillas.includes('humoseta')&&!m.plantas.some(p=>p.vida>0&&p.fila===fila&&p.tipo===muro))continue;
   if(col*80+40<=frente(fila)+25&&sembrar('seta-desesporada',fila,col))return;
  }
  if(m.semillas.includes('bipetidora'))for(const fila of filas.filter(f=>!agua(f)))if(!m.plantas.some(p=>p.vida>0&&p.fila===fila&&p.tipo==='bipetidora'))for(const col of[2,3,1,4])if(sembrar('bipetidora',fila,col,true))return;
  if(m.sol>200)for(const fila of filas.filter(f=>!agua(f)))if(!m.plantas.some(p=>p.vida>0&&p.fila===fila&&p.tipo===muro))for(const col of[6,5])if(sembrar(muro,fila,col,true))return;
 };
}
