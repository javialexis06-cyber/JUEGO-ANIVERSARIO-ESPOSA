import type {MotorPvZ} from './motor';

/** Piloto de 3-5: únicamente sobres reales de la cinta y pala; no modifica la simulación. */
export function crearPilotoMinizombisPvZ(){
 let proxima=0;
 return(m:MotorPvZ)=>{
  if(m.terminado||m.t<proxima)return;proxima=m.t+.1;
  const agua=(f:number)=>m.esAgua(f);
  const enemigos=m.zombis.filter(z=>z.vida>0&&!z.sinCabeza&&!z.hipnotizado);
  const libres=(f:number,c:number)=>m.casilla(f,c)&&!m.plantaEn(f,c);
  const plantar=(id:number,fila:number,col:number)=>m.ordenar({tipo:'plantarCinta',id,fila,col});
  const enfrente=(f:number)=>Math.min(999,...enemigos.filter(z=>z.fila===f).map(z=>z.x));
  const tiros=(f:number)=>m.plantas.filter(p=>p.vida>0&&p.fila===f&&p.tipo==='lanzaguisantes').length;
  const acuaticas=[2,3].sort((a,b)=>tiros(a)-tiros(b)||enfrente(a)-enfrente(b)||a-b);
  const lily=m.cinta.find(s=>s.planta==='nenufar');
  if(lily){
   for(const col of [1,5,4,0,2,3,6,7,8])for(const f of acuaticas)
    if(!m.plantaEn(f,col,'base')&&plantar(lily.id,f,col))return;
  }
  const pea=m.cinta.find(s=>s.planta==='lanzaguisantes');
  if(pea){
   const filas=[...m.nivel.filas].sort((a,b)=>{
    const peso=(f:number)=>tiros(f)+(agua(f)?-.5:0);
    return peso(a)-peso(b)||enfrente(a)-enfrente(b)||a-b;
   });
   for(const f of filas)for(const c of[1,0,2,3,4])if(libres(f,c)&&c*80+40<enfrente(f)+10&&plantar(pea.id,f,c))return;
  }
  const nut=m.cinta.find(s=>s.planta==='nuez');
  if(nut){
   const filas=[...m.nivel.filas].sort((a,b)=>(agua(a)?-100:0)-(agua(b)?-100:0)||enfrente(a)-enfrente(b));
   for(const f of filas){
    if(!enemigos.some(z=>z.fila===f)||m.plantas.some(p=>p.vida>0&&p.fila===f&&p.tipo==='nuez'&&p.vida>400))continue;
    for(const c of[5,6,4,3,2,1,0])if(libres(f,c)&&c*80+40<=enfrente(f)+15&&plantar(nut.id,f,c))return;
   }
  }
  const bomb=m.cinta.find(s=>s.planta==='petacereza');if(!bomb||!enemigos.length)return;
  const previsto=(z:typeof enemigos[number])=>z.x-(z.comiendo?0:(z.datos.velocidad??m.zombisDef[z.tipo].velocidad)*1.2);
  const cubierto=(z:typeof enemigos[number])=>m.plantas.some(p=>p.vida>0&&p.tipo==='petacereza'&&Math.abs(p.fila-z.fila)<=1&&Math.abs(p.x-previsto(z))<=115);
  const blancos=enemigos.filter(z=>!cubierto(z));
  const opciones:{fila:number;col:number;peso:number;cuantos:number;urgente:boolean}[]=[];
  for(const fila of m.nivel.filas)for(let col=0;col<9;col++){
   if(agua(fila)&&!m.plantaEn(fila,col,'base'))continue;
   const p=m.plantaEn(fila,col);if(p&&p.tipo!=='lanzaguisantes')continue;
   const cerca=blancos.filter(z=>Math.abs(z.fila-fila)<=1&&Math.abs(previsto(z)-(col*80+40))<=115);
   const urgente=cerca.some(z=>agua(z.fila)?z.x<230:!m.cortacespedes.some(c=>c.fila===z.fila&&c.estado==='listo')&&z.x<180);
   const peso=cerca.reduce((s,z)=>s+(agua(z.fila)?2:1)+(z.x<350?1:0)+(z.armadura>200?1:0),0);
   opciones.push({fila,col,peso,cuantos:cerca.length,urgente});
  }
  opciones.sort((a,b)=>Number(b.urgente)-Number(a.urgente)||b.peso-a.peso||b.cuantos-a.cuantos||b.col-a.col);
  const o=opciones[0];if(!o||!o.urgente&&o.cuantos<6)return;
  if(m.plantaEn(o.fila,o.col))m.ordenar({tipo:'pala',fila:o.fila,col:o.col});
  plantar(bomb.id,o.fila,o.col);
 };
}
