import type {DefNivel,ZombiPvZ} from '../tipos';
import type {MotorPvZ} from './motor';

const LANZADORAS=['melonpulta','lanzamaiz','coltapulta'];
/** Seis ranuras con premios obtenidos antes del nivel; prioriza macetas, sol, lanzadoras y protección contra colgados. */
export function seleccionTejadoPvZ(disponibles:readonly string[],nivel:DefNivel):string[]{
 if(nivel.cinta)return [];
 const unicos=[...new Set(disponibles)],elegidas:string[]=[];
 const elegir=(...ids:string[])=>{const id=ids.find(id=>unicos.includes(id)&&!elegidas.includes(id));if(id)elegidas.push(id);};
 const tiene=(id:string)=>nivel.zombis.includes(id);
 elegir('maceta');elegir('girasol');elegir('repetidora','lanzaguisantes');
 const escudos=tiene('zombi-escalera')||tiene('zombi-catapulta')||tiene('zombi-periodico')||tiene('zombi-portero');
 if(tiene('gargantua')){elegir('nuez-alta','nuez');elegir('petacereza');elegir('jalapeno','aplastaflor');elegir('melonpulta','lanzamaiz','coltapulta');}
 else if(escudos)elegir('lanzamaiz','coltapulta');
 elegir('nuez-alta','nuez');elegir('petacereza');
 if(tiene('zombi-colgado')||tiene('zombi-catapulta'))elegir('paraplanta');
 if(tiene('gargantua'))elegir('jalapeno','aplastaflor');
 elegir('coltapulta','lanzamaiz');
 for(const id of unicos)if(elegidas.length<6&&!elegidas.includes(id))elegidas.push(id);
 return elegidas.slice(0,6);
}

/** Piloto del tejado: solo órdenes ordinarias (recoger, plantar, pala, cinta). No concede recursos. */
export function crearPilotoTejadoPvZ(){
 let actuarEn=0;
 return(m:MotorPvZ)=>{
  if(m.terminado)return;
  for(const s of [...m.soles])m.ordenar({tipo:'recoger',id:s.id});
  if(m.t<actuarEn)return;actuarEn=m.t+.1;
  const enemigos=m.zombis.filter(z=>z.vida>0&&!z.hipnotizado&&!z.sinCabeza&&!z.datos.colgadoAlto&&z.tipo!=='zombi-colgado'&&!z.datos.todasFilas);
  const jefe=m.zombis.find(z=>z.vida>0&&z.datos.todasFilas);
  const frente=(fila:number)=>Math.min(999,...enemigos.filter(z=>z.fila===fila).map(z=>z.x));
  const carga=(fila:number)=>enemigos.filter(z=>z.fila===fila).reduce((n,z)=>n+z.vida+z.armadura,0);
  const filas=[...m.nivel.filas].sort((a,b)=>frente(a)-frente(b)||carga(b)-carga(a)||a-b);
  const maceta=(fila:number,col:number)=>!!m.plantaEn(fila,col,'base');
  const libre=(fila:number,col:number)=>m.casilla(fila,col)&&!m.plantaEn(fila,col)&&!m.plantaEn(fila,col,'cubierta');
  const puede=(id:string)=>m.semillas.includes(id)&&m.sol>=(m.plantasDef[id]?.sol??Infinity)&&(m.recargas[id]??0)<=0;
  const sembrar=(id:string,fila:number,col:number)=>{
   if(!libre(fila,col))return false;
   if(!maceta(fila,col)){
    if(!puede('maceta')||m.sol<m.plantasDef.maceta.sol+m.plantasDef[id].sol||(m.recargas[id]??0)>0)return false;
    if(!m.ordenar({tipo:'plantar',planta:'maceta',fila,col}))return false;
   }
   return puede(id)&&m.ordenar({tipo:'plantar',planta:id,fila,col});
  };
  const cuenta=(tipo:string|string[],fila?:number)=>m.plantas.filter(p=>p.vida>0&&(Array.isArray(tipo)?tipo.includes(p.tipo):p.tipo===tipo)&&(fila===undefined||p.fila===fila)).length;
  const previsto=(z:ZombiPvZ,s:number)=>z.x-(!z.comiendo&&!z.congelado&&!z.mantequilla?(z.datos.velocidad??m.zombisDef[z.tipo].velocidad)*(z.lento>0?.5:1)*s:0);
  const bomba=(id:string,z:ZombiPvZ,sobre?:number)=>{
   const centro=Math.max(0,Math.min(8,Math.floor(previsto(z,1.2)/80)));
   for(const fila of [z.fila,...m.nivel.filas.filter(f=>Math.abs(f-z.fila)===1)])for(const col of [centro,centro+1,centro-1]){
    if(!m.casilla(fila,col)||!maceta(fila,col))continue;
    const p=m.plantaEn(fila,col);if(p&&sobre===undefined)continue;if(p&&p.tipo!==id)m.ordenar({tipo:'pala',fila,col});
    if(sobre!==undefined){if(m.ordenar({tipo:'plantarCinta',id:sobre,fila,col}))return true;}
    else if(sembrar(id,fila,col))return true;
   }
   if(sobre===undefined)for(const col of [centro,centro+1,centro-1])if(sembrar(id,z.fila,col))return true;
   return false;
  };
  const urgente=[...enemigos].sort((a,b)=>a.x-b.x)[0];

  if(m.nivel.cinta){
   for(const s of [...m.cinta]){
    const id=s.planta;
    if(id==='maceta'){
     // Las macetas sobrantes no deben atascar la cinta: delante sirven de cebo.
     const cols=jefe?[1,2,3,0,4,5,6,7]:[3,4,5,6,7,8];
     for(const col of cols)for(const fila of filas)if(!maceta(fila,col)&&m.ordenar({tipo:'plantarCinta',id:s.id,fila,col}))return;
     continue;
    }
    if(id==='petacereza'||id==='seta-congelada'&&!jefe){
     const z=enemigos.filter(z=>z.x<620).sort((a,b)=>carga(b.fila)-carga(a.fila)||a.x-b.x)[0];if(z&&bomba(id,z,s.id))return;continue;
    }
    if(id==='seta-congelada'&&jefe){
     if(jefe.datos.bolaX!==undefined&&jefe.datos.bolaFuego||urgente&&urgente.x<250)for(const fila of filas)for(const col of [0,1,2,3,4])if(maceta(fila,col)&&libre(fila,col)&&m.ordenar({tipo:'plantarCinta',id:s.id,fila,col}))return;
     continue;
    }
    if(id==='jalapeno'){
     const fila=jefe?.datos.bolaX!==undefined&&!jefe.datos.bolaFuego?jefe.datos.bolaFila:filas.find(f=>frente(f)<450&&carga(f)>500)??(jefe&&!jefe.datos.invulnerable?filas[0]:undefined);
     if(fila!==undefined)for(const col of [0,1,2,3,4,5])if(maceta(fila,col)&&libre(fila,col)&&m.ordenar({tipo:'plantarCinta',id:s.id,fila,col}))return;
     continue;
    }
    if(id==='planta-carnivora'||id==='calabaza'){
     const cols=id==='calabaza'?[2,3,1]:[2,3,1,0];for(const col of cols)for(const fila of filas){
      if(!maceta(fila,col))continue;const p=m.plantaEn(fila,col);
      if(id==='calabaza'?(p&&!m.plantaEn(fila,col,'cubierta')):!p)if(m.ordenar({tipo:'plantarCinta',id:s.id,fila,col}))return;
     }
     continue;
    }
    // Lanzadoras de la cinta: primero los carriles con menos.
    const destino=[...m.nivel.filas].sort((a,b)=>cuenta(LANZADORAS,a)-cuenta(LANZADORAS,b)||frente(a)-frente(b));
    for(const fila of destino)for(const col of [0,1,2,3,4])if(maceta(fila,col)&&libre(fila,col)&&m.ordenar({tipo:'plantarCinta',id:s.id,fila,col}))return;
   }
   return;
  }

  const tiradores=['repetidora','lanzaguisantes',...LANZADORAS];
  // Barato al principio del carril; repetidora o lanzadora pesada cuando ya hay uno.
  const tirador=(fila:number)=>{
   const escudo=enemigos.some(z=>z.fila===fila&&z.escudo&&z.armadura>0),hay=cuenta(tiradores,fila);
   const orden=escudo?['lanzamaiz','coltapulta','melonpulta','repetidora','lanzaguisantes']
    :hay===0&&carga(fila)<=300?['lanzaguisantes','coltapulta','lanzamaiz','repetidora','melonpulta']:['repetidora','melonpulta','lanzamaiz','coltapulta','lanzaguisantes'];
   const disponibles=orden.filter(id=>m.semillas.includes(id));const id=disponibles[0];
   if(id&&puede(id))return id;
   // Con un tirador ya puesto se ahorra para el fuerte; el barato solo cubre un carril vacío.
   return hay===0?disponibles.find(id=>puede(id)&&m.plantasDef[id].sol<=100):undefined;
  };
  const muro=m.semillas.includes('nuez-alta')?'nuez-alta':'nuez';
  const gigante=enemigos.filter(z=>z.tipo==='gargantua'&&z.x<600).sort((a,b)=>a.x-b.x)[0];
  if(gigante){if(puede('jalapeno')){for(const col of [0,1,2,3,4])if(sembrar('jalapeno',gigante.fila,col))return;}if(puede('petacereza')&&bomba('petacereza',gigante))return;if(puede('aplastaflor')&&bomba('aplastaflor',gigante))return;}
  const grupo=(z:ZombiPvZ)=>enemigos.filter(v=>Math.abs(v.fila-z.fila)<=1&&Math.abs(v.x-z.x)<=110).reduce((n,v)=>n+v.vida+v.armadura,0);
  if(urgente&&urgente.x<260&&puede('petacereza')&&bomba('petacereza',urgente))return;
  const denso=[...enemigos].filter(z=>z.x<560).sort((a,b)=>grupo(b)-grupo(a))[0];
  if(denso&&grupo(denso)>(denso.x<420?700:1100)&&puede('petacereza')&&bomba('petacereza',denso))return;
  const jal=[...m.nivel.filas].sort((a,b)=>carga(b)-carga(a))[0];
  if(jal!==undefined&&puede('jalapeno')&&carga(jal)>1400&&frente(jal)<500)for(const col of [0,1,2,3,4])if(sembrar('jalapeno',jal,col))return;
  const girasoles=cuenta('girasol');
  const sinTirador=(umbral:number)=>filas.filter(f=>frente(f)<umbral&&cuenta(tiradores,f)===0);
  // 1) Carril sin defensa con un zombi ya cerca: tirador inmediato (se espera el sol si falta).
  for(const fila of sinTirador(680)){const id=tirador(fila);if(id){for(const col of [2,3,4])if(sembrar(id,fila,col))return;}else return;}
  // 2) Economía: primera columna de girasoles y después la segunda.
  if(girasoles<m.nivel.filas.length)for(const fila of filas.slice().reverse())if(sembrar('girasol',fila,0))return;
  // 3) Tiradores según la vida que avanza por cada carril (uno por cada 450 de vida, hasta cuatro).
  const necesidad=(fila:number)=>{const c=carga(fila);return c>0?Math.min(4,1+Math.floor(c/450)):0;};
  for(const fila of filas)if(cuenta(tiradores,fila)<necesidad(fila)){const id=tirador(fila);if(id){for(const col of [2,3,4,1])if(sembrar(id,fila,col))return;}else if(frente(fila)<600)return;}
  // Saltadores: la Nuez cáscara-rabias los detiene.
  if(muro==='nuez-alta')for(const fila of filas)if(enemigos.some(z=>z.fila===fila&&(z.tipo==='saltador'&&!z.datos.saltoUsado||z.tipo==='zombi-pogo'&&z.datos.pogo))&&!m.plantas.some(p=>p.vida>0&&p.fila===fila&&p.tipo==='nuez-alta')){for(const col of [5,6,4])if(sembrar(muro,fila,col))return;return;}
  if(girasoles<m.nivel.filas.length*2)for(const fila of filas.slice().reverse())if(sembrar('girasol',fila,1))return;
  // Muros en carriles con zombis cerca; uno nuevo si el actual está gastado.
  for(const fila of filas){
   if(frente(fila)>=650)continue;const muros=m.plantas.filter(p=>p.vida>0&&p.fila===fila&&(p.tipo==='nuez'||p.tipo==='nuez-alta'));
   if(!muros.length||muros.every(p=>p.vida<m.plantasDef[p.tipo].vida/3)){for(const col of [5,6,4])if(sembrar(muro,fila,col))return;}
  }
  if(girasoles<m.nivel.filas.length*2&&m.sol<150)return;
  for(const fila of filas)if(m.t>90&&cuenta(tiradores,fila)<2){const id=tirador(fila);if(id){for(const col of [3,2,4])if(sembrar(id,fila,col))return;}}
  // 4) Paraplantas que cubren las lanzadoras de los carriles 0–4.
  if(m.semillas.includes('paraplanta')&&cuenta('paraplanta')<2)for(const fila of [1,3])if(sembrar('paraplanta',fila,2)||sembrar('paraplanta',fila,3))return;
  // 5) Refuerzos: hasta cuatro tiradores por carril, primero donde hay más presión.
  for(const objetivo of [1,2,3,4])for(const fila of filas){
   if(cuenta(tiradores,fila)>=objetivo)continue;const id=tirador(fila);if(!id)return;
   for(const col of [2,3,4,1])if(sembrar(id,fila,col))return;
  }
  if(m.sol>500)for(const fila of filas)for(const col of [5,6])if(sembrar(muro,fila,col))return;
 };
}
