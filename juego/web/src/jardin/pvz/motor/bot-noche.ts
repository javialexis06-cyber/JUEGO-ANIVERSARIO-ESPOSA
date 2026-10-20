import type {DefNivel, ZombiPvZ} from '../tipos';
import type {MotorPvZ} from './motor';

/** Selección de hasta seis sobres ya desbloqueados; no concede semillas ni compra ranuras. */
export function seleccionPilotoPvZ(disponibles:readonly string[],nivel:DefNivel):string[] {
 if(nivel.cinta)return [];
 if(nivel.semillas)return [...nivel.semillas];
 const unicos=[...new Set(disponibles)];
 if(nivel.area!=='noche'&&nivel.area!=='niebla')return unicos.slice(0,6);
 const elegidas:string[]=[];
 const elegir=(...ids:string[])=>{const id=ids.find(id=>unicos.includes(id)&&!elegidas.includes(id));if(id)elegidas.push(id);};
 elegir('seta-desesporada');elegir('seta-solar','girasol');elegir('humoseta','lanzaguisantes');
 elegir('comepiedras');elegir('petaseta','petacereza');elegir('hipnoseta','nuez');
 for(const id of unicos)if(elegidas.length<6&&!elegidas.includes(id))elegidas.push(id);
 return elegidas.slice(0,6);
}

/** Piloto de pruebas nocturno: solo envía órdenes que un jugador puede emitir. */
export function crearPilotoNochePvZ(){
 let actuarEn=0;
 return(m:MotorPvZ)=>{
  if(m.terminado)return;
  for(const sol of [...m.soles])m.ordenar({tipo:'recoger',id:sol.id});
  if(m.t<actuarEn)return;actuarEn=m.t+.1;
  const enemigos=m.zombis.filter(z=>z.vida>0&&!z.hipnotizado&&!z.sinCabeza);
  const frente=(fila:number)=>Math.min(999,...enemigos.filter(z=>z.fila===fila).map(z=>z.x));
  const filas=[...m.nivel.filas].sort((a,b)=>frente(a)-frente(b)||a-b);
  const libres=(fila:number,col:number)=>m.casilla(fila,col)&&!m.plantaEn(fila,col)&&!m.lapidaEn(fila,col)&&!m.crateres.some(q=>q.fila===fila&&q.col===col);
  const sembrar=(planta:string,fila:number,col:number)=>m.semillas.includes(planta)&&libres(fila,col)&&m.ordenar({tipo:'plantar',planta,fila,col});
  const sustituirSeta=(planta:string,fila:number,col:number)=>{
   if(sembrar(planta,fila,col))return true;const p=m.plantaEn(fila,col),d=m.plantasDef[planta];
   if(!m.semillas.includes(planta)||!d||m.sol<d.sol||(m.recargas[planta]??0)>0||p?.tipo!=='seta-desesporada'||m.lapidaEn(fila,col)||m.crateres.some(q=>q.fila===fila&&q.col===col))return false;
   return m.ordenar({tipo:'pala',fila,col})&&m.ordenar({tipo:'plantar',planta,fila,col});
  };
  const columnasFrente=(fila:number)=>[5,6,4,3,2,1,0,7,8].filter(col=>col*80+40<=frente(fila)+25);
  const grupo=(z:ZombiPvZ,radio=120)=>enemigos.filter(v=>Math.abs(v.fila-z.fila)<=1&&Math.abs(v.x-z.x)<=radio).reduce((n,v)=>n+v.vida+v.armadura,0);
  const objetivos=[...enemigos].sort((a,b)=>grupo(b)-grupo(a)||a.x-b.x||a.id-b.id);
  const plantarCerca=(planta:string,z:ZombiPvZ,cintaId?:number)=>{
   const centro=Math.max(0,Math.min(8,Math.floor(z.x/80)));
   for(const col of [centro,centro-1,centro+1])if((libres(z.fila,col)||m.plantaEn(z.fila,col)?.tipo==='seta-desesporada')&&(planta!=='hipnoseta'||col*80+40<=z.x+30)){
    if(cintaId===undefined){if(sustituirSeta(planta,z.fila,col))return true;}
    else{if(!libres(z.fila,col))m.ordenar({tipo:'pala',fila:z.fila,col});if(m.ordenar({tipo:'plantarCinta',id:cintaId,fila:z.fila,col}))return true;}
   }return false;
  };
  if(m.nivel.minijuego==='aplastazombis'){
   for(const z of [...enemigos].sort((a,b)=>a.x-b.x||a.id-b.id))m.ordenar({tipo:'golpear',id:z.id});
   return;
  }
  if(m.nivel.cinta){
   // Retirar primero las tumbas evita que una urgencia deje este sobre bloqueando la cinta.
   const sobres=[...m.cinta].sort((a,b)=>(a.planta==='comepiedras'?-1:0)-(b.planta==='comepiedras'?-1:0));
   for(const s of sobres){
    if(s.planta==='comepiedras'){
     for(const q of [...m.lapidas].sort((a,b)=>a.col-b.col||a.fila-b.fila))if(m.ordenar({tipo:'plantarCinta',id:s.id,fila:q.fila,col:q.col}))return;
     continue;
    }
    if(s.planta==='petaseta'){
     const z=objetivos.find(z=>grupo(z,220)>500||z.x<260);if(z&&plantarCerca(s.planta,z,s.id))return;continue;
    }
    if(s.planta==='seta-congelada'){
     if(enemigos.some(z=>!z.congelado&&(z.x<500||enemigos.length>=5)))for(const fila of filas)for(const col of [0,1,2,3,4,5,6,7,8])if(libres(fila,col)&&m.ordenar({tipo:'plantarCinta',id:s.id,fila,col}))return;
     continue;
    }
    if(s.planta==='hipnoseta'){
     const z=[...enemigos].sort((a,b)=>(b.tipo==='zombi-bailon'?1000:0)+(b.tipo==='zombi-futbolista'?800:0)-(a.tipo==='zombi-bailon'?1000:0)-(a.tipo==='zombi-futbolista'?800:0)||a.x-b.x).find(z=>z.x<680);
     if(z&&plantarCerca(s.planta,z,s.id))return;continue;
    }
    const cols=s.planta==='seta-miedica'?[1,2,0,3,4]:s.planta==='humoseta'?[4,5,3,2,1,0,6]:[5,6,4,3,2,1,0,7,8];
    for(const col of cols)for(const fila of filas)if(libres(fila,col)&&col*80+40<=frente(fila)+25&&m.ordenar({tipo:'plantarCinta',id:s.id,fila,col}))return;
   }return;
  }
  // Los recursos se reservan para una explosión solo si la amenaza ya ha entrado en la defensa.
  for(const z of objetivos){
   if(z.x<520&&(grupo(z,220)>1100||z.x<220)&&plantarCerca('petaseta',z))return;
   if(z.x<480&&(grupo(z)>900||z.x<220)&&plantarCerca('petacereza',z))return;
  }
  for(const z of [...enemigos].sort((a,b)=>a.x-b.x||a.id-b.id)){
   if((z.tipo==='zombi-futbolista'||z.tipo==='zombi-bailon'||z.x<350&&m.cortacespedes.find(c=>c.fila===z.fila)?.estado==='gastado')&&z.x<640&&plantarCerca('hipnoseta',z))return;
  }
  // La defensa gratuita nunca compite por el sol de las productoras.
  for(const fila of filas)for(const col of columnasFrente(fila))if(sembrar('seta-desesporada',fila,col))return;
  const apuro=enemigos.some(z=>z.x<350&&m.cortacespedes.find(c=>c.fila===z.fila)?.estado==='gastado');
  if(apuro&&m.semillas.includes('hipnoseta')&&(m.recargas.hipnoseta??0)<=0&&m.sol<75)return;
  // Dos columnas de producción sostienen las sustituciones y las explosiones de los niveles largos.
  const productora=m.semillas.includes('seta-solar')?'seta-solar':'girasol';
  for(const col of [0,1])for(const fila of filas)if(sembrar(productora,fila,col))return;
  for(const fila of filas){
   const visitas=enemigos.filter(z=>z.fila===fila),peligro=visitas.reduce((n,z)=>n+z.vida+z.armadura,0);
   if(visitas.length&&frente(fila)<620&&peligro>270)for(const col of [4,5,3])if(sustituirSeta('humoseta',fila,col))return;
  }
  for(const q of [...m.lapidas].sort((a,b)=>a.col-b.col||a.fila-b.fila))if(m.semillas.includes('comepiedras')&&m.ordenar({tipo:'plantar',planta:'comepiedras',fila:q.fila,col:q.col}))return;
  for(const col of [4,5,3])for(const fila of filas)if(sustituirSeta('humoseta',fila,col))return;
  for(const col of [2,3,4])for(const fila of filas)if(sembrar('lanzaguisantes',fila,col))return;
  for(const fila of filas)if(sembrar('nuez',fila,6))return;
 };
}
