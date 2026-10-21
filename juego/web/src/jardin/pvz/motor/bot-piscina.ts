import type {DefNivel,ZombiPvZ} from '../tipos';
import type {MotorPvZ} from './motor';
import {crearPilotoMinizombisPvZ} from './bot-minizombis';

/** Seis ranuras, únicamente con premios obtenidos antes del nivel. */
export function seleccionPiscinaPvZ(disponibles:readonly string[],nivel:DefNivel):string[] {
 if(nivel.cinta)return [];
 if(nivel.semillas)return [...nivel.semillas];
 const unicos=[...new Set(disponibles)],elegidas:string[]=[];
 const elegir=(...ids:string[])=>{const id=ids.find(id=>unicos.includes(id)&&!elegidas.includes(id));if(id)elegidas.push(id);};
 elegir('nenufar');elegir('girasol');elegir('lanzaguisantes');
 elegir('nuez-alta','nuez');elegir('petacereza');
 if(!nivel.zombis.includes('zomboni')&&nivel.banderas>=3)elegir('aplastaflor','zampalga','patatapum');
 else if(nivel.zombis.includes('zomboni'))elegir('pinchohierba','aplastaflor','zampalga','patatapum');
 else elegir('zampalga','aplastaflor','patatapum');
 for(const id of unicos)if(elegidas.length<6&&!elegidas.includes(id))elegidas.push(id);
 return elegidas.slice(0,6);
}

/** Piloto del motor acuático: órdenes ordinarias, sol real, recargas y soportes normales. */
export function crearPilotoPiscinaPvZ(){
 let actuarEn=0;const mini=crearPilotoMinizombisPvZ();
 return(m:MotorPvZ)=>{
  if(m.nivel.minijuego==='minizombis'){mini(m);return;}
  if(m.terminado)return;
  for(const s of [...m.soles])m.ordenar({tipo:'recoger',id:s.id});
  if(m.t<actuarEn)return;actuarEn=m.t+.1;
  const enemigos=m.zombis.filter(z=>z.vida>0&&!z.hipnotizado&&!z.sinCabeza&&!z.datos.zampalga&&!z.datos.arrastrado);
  const frente=(fila:number)=>Math.min(999,...enemigos.filter(z=>z.fila===fila).map(z=>z.x));
  const tiempoPeligro=(fila:number)=>Math.min(999,...enemigos.filter(z=>z.fila===fila).map(z=>{
   const v=(z.datos.velocidad??m.zombisDef[z.tipo].velocidad)*(z.lento>0?.5:1),p=m.plantas.find(p=>p.id===z.comiendo);
   return(z.x+60)/Math.max(1,v)+(p?p.vida/m.zombisDef[z.tipo].mordida:0);
  }));
  const filas=[...m.nivel.filas].sort((a,b)=>tiempoPeligro(a)-tiempoPeligro(b)||a-b);
  const agua=(fila:number)=>m.nivel.filasAgua?.includes(fila)??false;
  const libre=(fila:number,col:number)=>m.casilla(fila,col)&&!m.plantaEn(fila,col)&&!m.lapidaEn(fila,col)&&!m.crateres.some(q=>q.fila===fila&&q.col===col);
  const puedePagar=(id:string)=>m.semillas.includes(id)&&m.sol>=(m.plantasDef[id]?.sol??Infinity)&&(m.recargas[id]??0)<=0;
  const sembrar=(id:string,fila:number,col:number)=>{
   if(!libre(fila,col)||!puedePagar(id))return false;
   const d=m.plantasDef[id];
   if(agua(fila)&&d.agua!=='solo'&&d.agua!=='tambien'&&(d.capa??'principal')!=='base'&&!m.plantaEn(fila,col,'base')){
    return puedePagar('nenufar')&&m.ordenar({tipo:'plantar',planta:'nenufar',fila,col});
   }
   return m.ordenar({tipo:'plantar',planta:id,fila,col});
  };
  const grupo=(z:ZombiPvZ)=>enemigos.filter(v=>Math.abs(v.fila-z.fila)<=1&&Math.abs(v.x-z.x)<=120).reduce((n,v)=>n+v.vida+v.armadura,0);
  const objetivos=[...enemigos].sort((a,b)=>grupo(b)-grupo(a)||a.x-b.x||a.id-b.id);
  const explosionPendiente=(z:ZombiPvZ)=>m.plantas.some(p=>{
   if(p.vida<=0||p.tipo!=='petacereza'||Math.abs(p.fila-z.fila)>1)return false;
   const resto=Math.max(0,1.2-p.edad),velocidad=(z.datos.velocidad??m.zombisDef[z.tipo].velocidad)*(z.lento>0?.5:1);
   const x=z.x-(!z.comiendo&&!z.congelado?velocidad*resto:0);
   return Math.abs(x-p.x)<=110;
  });
  const cerca=(id:string,z:ZombiPvZ,sobre?:number)=>{
   const velocidad=(z.datos.velocidad??m.zombisDef[z.tipo].velocidad)*(z.lento>0?.5:1);
   const adelanto=id==='petacereza'&&!z.comiendo&&!z.congelado?velocidad*.9:0;
   const centro=Math.max(0,Math.min(8,Math.floor((z.x-adelanto-(id==='aplastaflor'&&z.tipo==='zomboni'?100:0))/80)));
   const vecinas=m.nivel.filas.filter(f=>Math.abs(f-z.fila)===1);
   const fs=id==='petacereza'?(z.tipo==='zomboni'?[...vecinas,z.fila]:[z.fila,...vecinas]):[z.fila];
   for(const fila of fs)for(const col of [centro,centro-1,centro+1]){
    if(id==='aplastaflor'&&z.tipo==='zomboni'&&col*80+40>z.x-70)continue;
    if(id==='zampalga'&&!libre(fila,col)&&m.casilla(fila,col)&&Math.abs(col*80+40-z.x)<=40){
     const p=m.plantaEn(fila,col);
     if(p&&p.tipo!=='zampalga'&&(sobre!==undefined||puedePagar(id)))m.ordenar({tipo:'pala',fila,col});
    }
    if(id==='zampalga'&&m.casilla(fila,col)&&!m.plantaEn(fila,col)&&m.plantaEn(fila,col,'base')&&Math.abs(col*80+40-z.x)<=40&&(sobre!==undefined||puedePagar(id)))m.ordenar({tipo:'pala',fila,col});
    if(id==='petacereza'&&!libre(fila,col)&&m.casilla(fila,col)&&(sobre!==undefined||puedePagar(id))){
     const hielo=m.pistaHielo(fila),p=m.plantaEn(fila,col);
     if(p&&p.tipo!=='petacereza'&&(!hielo||col*80+40<hielo.desde))m.ordenar({tipo:'pala',fila,col});
    }
    if(!libre(fila,col))continue;
    if(sobre===undefined){if(sembrar(id,fila,col))return true;}
    else if(m.ordenar({tipo:'plantarCinta',id:sobre,fila,col}))return true;
   }return false;
  };
  const bombaCinta=(id:number,objetivo:ZombiPvZ)=>{
   const previsto=(z:ZombiPvZ)=>z.x-(!z.comiendo&&!z.congelado?(z.datos.velocidad??m.zombisDef[z.tipo].velocidad)*(z.lento>0?.5:1)*1.2:0);
   const centro=Math.max(0,Math.min(8,Math.floor(previsto(objetivo)/80)));
   const casillas=m.nivel.filas.filter(f=>Math.abs(f-objetivo.fila)<=1).flatMap(fila=>[centro,centro-1,centro+1].map(col=>({fila,col})));
   const candidatas=casillas.filter(({fila,col})=>{
    if(!m.casilla(fila,col)||agua(fila)&&!m.plantaEn(fila,col,'base')||Math.abs(previsto(objetivo)-(col*80+40))>120)return false;
    const p=m.plantaEn(fila,col);
    return !p||objetivo.x<400&&p.tipo==='lanzaguisantes';
   }).map(q=>({...q,peso:enemigos.filter(z=>Math.abs(z.fila-q.fila)<=1&&Math.abs(previsto(z)-(q.col*80+40))<=120&&!explosionPendiente(z))
    .reduce((n,z)=>n+(120+z.vida+z.armadura)*(z.x<250?3:1),0)})).sort((a,b)=>b.peso-a.peso||Math.abs(a.fila-2.5)-Math.abs(b.fila-2.5)||a.fila-b.fila);
   for(const {fila,col}of candidatas){
    if(m.plantaEn(fila,col))m.ordenar({tipo:'pala',fila,col});
    if(m.ordenar({tipo:'plantarCinta',id,fila,col}))return true;
   }return false;
  };
  const tierra=m.nivel.filas.filter(f=>!agua(f));
  if(m.nivel.cinta){
   // Un Nenúfar es una base, no una casilla ocupada de la capa principal.
   const sobres=[...m.cinta].sort((a,b)=>(a.planta==='nenufar'?-1:0)-(b.planta==='nenufar'?-1:0));
   for(const s of sobres){
    if(s.planta==='nenufar'){
     // Una brecha necesita apoyos por delante del enemigo, para poder reconstruir la barrera.
     for(let i=0;i<9;i++)for(const fila of filas.filter(agua)){
      const cols=frente(fila)<400?[0,1,2,3,5,6,4,7,8]:[5,6,2,3,1,4,0,7,8],col=cols[i];
      if(!m.plantaEn(fila,col,'base')&&m.ordenar({tipo:'plantarCinta',id:s.id,fila,col}))return;
     }
     continue;
    }
    if(s.planta==='petacereza'){
     const urgente=[...enemigos].sort((a,b)=>a.x-b.x||a.id-b.id).find(z=>z.x<350&&!explosionPendiente(z));
     const z=urgente??objetivos.find(z=>z.x<600&&grupo(z)>400&&!explosionPendiente(z));
     if(z&&bombaCinta(s.id,z))return;continue;
    }
    if(s.planta==='jalapeno'){
     const fila=filas.find(f=>enemigos.some(z=>z.fila===f&&(z.tipo==='zomboni'||z.x<350))||enemigos.filter(z=>z.fila===f).length>=4);
     if(fila!==undefined)for(const col of[0,1,2,3,4,5,6,7,8])if(libre(fila,col)&&m.ordenar({tipo:'plantarCinta',id:s.id,fila,col}))return;
     continue;
    }
    if(s.planta==='aplastaflor'){
     const z=[...enemigos].sort((a,b)=>a.x-b.x).find(z=>z.x<650);
     if(z&&cerca(s.planta,z,s.id))return;continue;
    }
    if(s.planta==='zampalga'){
     const peligro=(z:ZombiPvZ)=>(z.x+60)/Math.max(1,(z.datos.velocidad??m.zombisDef[z.tipo].velocidad)*(z.lento>0?.5:1));
     const z=[...enemigos].sort((a,b)=>peligro(a)-peligro(b)||a.id-b.id).find(z=>agua(z.fila)&&z.x<660);
     if(z&&cerca(s.planta,z,s.id))return;continue;
    }
    if(s.planta==='pinchohierba'){
     for(const col of[7,6,8,5,4])for(const fila of filas.filter(f=>!agua(f)))if(libre(fila,col)&&m.ordenar({tipo:'plantarCinta',id:s.id,fila,col}))return;
     continue;
    }
    if(s.planta==='plantorcha'){
     for(const col of[5,4,6])for(const fila of filas)if(libre(fila,col)&&m.ordenar({tipo:'plantarCinta',id:s.id,fila,col}))return;
     continue;
    }
    if(s.planta==='tripitidora'){
     // Dos carriles terrestres interiores cubren también el agua y los bordes.
     for(const col of[1,2,0,3,4])for(const fila of[1,4,2,3,0,5])if(m.nivel.filas.includes(fila)&&libre(fila,col)&&col*80+40<=frente(fila)+25&&m.ordenar({tipo:'plantarCinta',id:s.id,fila,col}))return;
     continue;
    }
    if(s.planta==='lanzaguisantes'){
     for(const fila of filas)for(const col of[2,3,1,0,4,5])if(libre(fila,col)&&col*80+40<=frente(fila)+10&&m.ordenar({tipo:'plantarCinta',id:s.id,fila,col}))return;
     continue;
    }
    if(s.planta==='nuez'||s.planta==='nuez-alta'){
     const barrera=(fila:number)=>m.plantas.some(p=>p.vida>2000&&p.fila===fila&&p.tipo===s.planta);
     // Dos defensas acuáticas se preparan antes de gastar las reservas en segundas barreras terrestres.
     for(const fila of filas.filter(agua))if(!barrera(fila))for(const col of[6,5,7,4,3,2,1,0]){
      if(m.plantaEn(fila,col,'base')&&libre(fila,col)&&m.ordenar({tipo:'plantarCinta',id:s.id,fila,col}))return;
     }
     for(const fila of filas.filter(f=>enemigos.some(z=>z.fila===f))){
      if(barrera(fila))continue;
      const colFrente=Math.max(0,Math.min(6,Math.floor((frente(fila)-40)/80)));
      for(const col of[colFrente,colFrente-1,colFrente-2])if(libre(fila,col)&&m.ordenar({tipo:'plantarCinta',id:s.id,fila,col}))return;
     }
     continue;
    }
    const cols=s.planta==='nuez'||s.planta==='nuez-alta'?[6,7,5,8]:[2,3,1,4,0,5];
    for(const col of cols)for(const fila of filas)if(libre(fila,col)&&col*80+40<=frente(fila)+25&&m.ordenar({tipo:'plantarCinta',id:s.id,fila,col}))return;
   }return;
  }
  const nuez=m.semillas.includes('nuez-alta')?'nuez-alta':'nuez';
  const disparos=(fila:number)=>m.plantas.filter(p=>p.vida>0&&p.fila===fila&&['lanzaguisantes','hielaguisantes','repetidora'].includes(p.tipo)).length;
  for(const z of [...enemigos].sort((a,b)=>a.x-b.x||a.id-b.id)){
   if(agua(z.fila)&&z.x<420&&cerca('zampalga',z))return;
  }
  for(const z of enemigos.filter(z=>z.tipo==='zombi-delfin'&&z.datos.montado&&z.x>600)){
   if(!m.plantaEn(z.fila,7,'base')&&!m.plantaEn(z.fila,7)&&puedePagar('nenufar')&&m.ordenar({tipo:'plantar',planta:'nenufar',fila:z.fila,col:7}))return;
  }
  for(const z of objetivos){
   if(z.x<(z.tipo==='zomboni'?560:420)&&(grupo(z)>900||z.x<220)&&!explosionPendiente(z)&&cerca('petacereza',z))return;
  }
  for(const z of enemigos.filter(z=>z.tipo==='zomboni').sort((a,b)=>a.x-b.x||a.id-b.id)){
   for(const col of[7,6,5,4,3,2,1,0])if(col*80+40<z.x-40&&sembrar('pinchohierba',z.fila,col))return;
  }
  for(const z of [...enemigos].sort((a,b)=>a.x-b.x||a.id-b.id)){
   if(z.x<580&&(z.tipo==='zomboni'||z.x<280||z.tipo==='zombi-delfin')&&cerca('aplastaflor',z))return;
  }
  // Con un vehículo presente se guarda el coste de la respuesta, en vez de reconstruir debajo de él.
  const reservaBomba=enemigos.some(z=>z.tipo==='zomboni'||z.x<380&&(z.vida+z.armadura>270||enemigos.filter(v=>v.fila===z.fila).length>1)&&!explosionPendiente(z));
  if(reservaBomba&&m.semillas.includes('petacereza')&&(m.recargas.petacereza??0)<=0&&m.sol<150)return;
  // Cubrir primero cada carril visitado, sin dejar de producir el sol de las siguientes defensas.
  for(const fila of filas){
   const visitas=enemigos.filter(z=>z.fila===fila),v=visitas.reduce((n,z)=>n+z.vida+z.armadura,0),f=frente(fila),tiros=disparos(fila);
   if(visitas.length&&tiros===0&&f<780){
    if(sembrar('lanzaguisantes',fila,2))return;
    // No gastar de nuevo 50 en una productora cuando ya se necesitan 100 para este carril.
    if(f<740)return;
   }
   if(visitas.length&&f<650&&f>470&&(v>270||visitas.some(z=>z.tipo==='zombi-buzo'||z.tipo==='zombi-delfin'))&&sembrar(nuez,fila,6))return;
   if(visitas.length&&f<620&&v>270&&tiros<2)for(const col of[3,4,1])if(sembrar('lanzaguisantes',fila,col))return;
   if(visitas.length&&f<560&&v>800&&tiros<3)for(const col of[4,3,1,0,5])if(sembrar('lanzaguisantes',fila,col))return;
  }
  for(const col of[0,1])for(const fila of tierra)if(sembrar('girasol',fila,col))return;
  for(const col of[2,3])for(const fila of filas)if(sembrar('lanzaguisantes',fila,col))return;
  if(m.sol>=300)for(const fila of filas)if(sembrar(nuez,fila,6))return;
  for(const col of[0,1])for(const fila of filas.filter(agua))if(sembrar('girasol',fila,col))return;
  for(const col of[4,5])for(const fila of filas)if(sembrar('lanzaguisantes',fila,col))return;
 };
}
