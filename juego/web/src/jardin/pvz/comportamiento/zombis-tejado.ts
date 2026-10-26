import type {ComportamientoZombiPvZ} from './index';
import type {MotorPvZ} from '../motor/motor';
import type {ZombiPvZ} from '../tipos';

/** Tiempos de PC en segundos (contadores de centésimas). Las duraciones de animación del jefe son aproximadas. */
const evento=(m:MotorPvZ,z:ZombiPvZ,tipo:string,duracion?:number)=>m.eventos.push({t:'estado',id:z.id,tipo,fila:z.fila,x:z.x,...(duracion===undefined?{}:{duracion})});
const def=(m:MotorPvZ,z:ZombiPvZ)=>m.zombisDef[z.tipo].datos??{};
const PRODUCTORAS=['girasol','seta-solar'];
const vivo=(m:MotorPvZ,id:number|undefined)=>id===undefined?undefined:m.zombis.find(z=>z.id===id&&z.vida>0);

/** PC (PickBungeeZombieTarget): casillas con planta pesan 10000 y las vacías 1; nunca dos colgados a la misma casilla,
 * ni la Comepiedras, ni la última productora de sol que queda sin colgado. */
export function elegirCeldaColgadoPvZ(m:MotorPvZ,z:ZombiPvZ,columna?:number){
 const otros=m.zombis.filter(o=>o!==z&&o.vida>0&&o.tipo==='zombi-colgado'&&(o.datos.fase??1)<4);
 const ocupada=(fila:number,col:number)=>otros.some(o=>o.datos.objFila===fila&&o.datos.objCol===col);
 const productoras=m.plantas.filter(p=>p.vida>0&&PRODUCTORAS.includes(p.tipo)).length;
 const apuntando=otros.filter(o=>{const p=m.plantaSuperior(o.datos.objFila,o.datos.objCol);return!!p&&PRODUCTORAS.includes(p.tipo);}).length;
 const permitirSol=apuntando!==productoras-1;
 const opciones:{fila:number;col:number;peso:number}[]=[];
 for(let col=0;col<m.columnas;col++){
  if(columna!==undefined&&col!==columna)continue;
  for(const fila of m.nivel.filas){
   if(m.lapidaEn(fila,col)||ocupada(fila,col))continue;
   const p=m.plantaSuperior(fila,col);let peso=1;
   if(p){if(!permitirSol&&PRODUCTORAS.includes(p.tipo)||p.tipo==='comepiedras')continue;peso=10000;}
   opciones.push({fila,col,peso});
  }
 }
 if(!opciones.length)return null;
 let dado=m.azar.siguiente()*opciones.reduce((a,o)=>a+o.peso,0),i=0;while(i<opciones.length-1&&dado>=opciones[i].peso)dado-=opciones[i++].peso;
 return opciones[i];
}
function apuntarColgado(z:ZombiPvZ,celda:{fila:number;col:number}){z.fila=celda.fila;z.x=celda.col*80+40;z.datos.objFila=celda.fila;z.datos.objCol=celda.col;}

const colgado:ComportamientoZombiPvZ={
 iniciar(m,z){
  const d=def(m,z);z.datos.colgadoAlto=1;z.datos.fase=1;z.datos.altura=(d.altura??3000)+m.azar.entero(151);z.datos.ignoraMordida=1;
  const caida=m.caidaColgado;
  if(caida){z.datos.carga=caida.carga;apuntarColgado(z,caida);evento(m,z,'colgado-baja');return;}
  const celda=elegirCeldaColgadoPvZ(m,z);if(!celda){m.retirarZombi(z);return;}
  apuntarColgado(z,celda);evento(m,z,'colgado-baja');
 },
 paso(m,z,dt){
  const d=def(m,z),velocidad=d.caida??800;z.comiendo=null;
  if(z.datos.fase===1){
   z.datos.altura-=velocidad*dt;
   const para=!z.datos.carga&&z.datos.altura<=40?m.paraplantaSobre(z.datos.objFila,z.datos.objCol):undefined;
   if(para){z.datos.fase=4;m.eventos.push({t:'estado',id:para.id,tipo:'paraplanta',fila:para.fila,x:para.x});evento(m,z,'colgado-rebota');return false;}
   if(z.datos.altura>0)return false;
   z.datos.altura=0;
   if(z.datos.carga){
    const c=vivo(m,z.datos.carga);if(c){delete c.datos.colgadoAlto;delete c.datos.colgadoPor;c.x=z.x;c.fila=z.fila;evento(m,c,'aterriza');}
    delete z.datos.carga;z.datos.fase=4;return false;
   }
   z.datos.fase=2;z.datos.colgadoAlto=0;z.datos.espera=d.espera??3;evento(m,z,'colgado-abajo');return false;
  }
  if(z.datos.fase===2){
   z.datos.espera-=dt;if(z.datos.espera>0)return false;
   const p=m.plantaSuperior(z.datos.objFila,z.datos.objCol);
   if(p&&p.tipo!=='comepiedras'){z.datos.presa=p.id;p.datos.agarrada=1;}
   z.datos.fase=3;z.datos.agarre=d.agarre??.5;evento(m,z,'colgado-agarra');return false;
  }
  if(z.datos.fase===3){
   z.datos.agarre-=dt;if(z.datos.agarre>0)return false;
   const p=m.plantas.find(p=>p.id===z.datos.presa&&p.vida>0);
   if(p){m.destruirPlanta(p);m.eventos.push({t:'estado',id:z.id,tipo:'colgado-roba',fila:z.fila,x:z.x,origen:p.id});}
   delete z.datos.presa;z.datos.fase=4;z.datos.colgadoAlto=1;return false;
  }
  z.datos.colgadoAlto=1;z.datos.altura+=velocidad*dt;
  if(z.datos.altura>=600)m.retirarZombi(z);
  return false;
 },
 alMorir(m,z){const p=m.plantas.find(p=>p.id===z.datos.presa);if(p)delete p.datos.agarrada;},
};

const PAREDES=['nuez','nuez-alta','calabaza'];
const escalera:ComportamientoZombiPvZ={
 iniciar(_m,z){z.datos.llevaEscalera=1;},
 paso(m,z){
  if(!z.datos.llevaEscalera||z.hipnotizado)return;
  // Perder la escalera (daño o imán) lo deja como un zombi común.
  if(z.armadura<=0){z.datos.llevaEscalera=0;z.datos.velocidad=def(m,z).velocidadSinEscalera??80/4.7;delete z.datos.colocaHasta;return;}
  if(z.datos.colocaHasta!==undefined){
   z.comiendo=null;if(m.t+1e-9<z.datos.colocaHasta)return false;
   delete z.datos.colocaHasta;
   const p=m.plantas.find(p=>p.id===z.datos.pared&&p.vida>0);
   if(!p||m.escaleraEn(p.fila,p.col))return false;
   p.datos.escalera=1;m.eventos.push({t:'terreno',tipo:'escalera',fila:p.fila,col:p.col,x:p.x,id:p.id});
   z.armadura=0;z.datos.llevaEscalera=0;z.datos.velocidad=def(m,z).velocidadSinEscalera??80/4.7;evento(m,z,'deja-escalera');
   return;
  }
  const p=m.plantas.filter(p=>p.vida>0&&p.fila===z.fila&&PAREDES.includes(p.tipo)&&z.x-p.x>=0&&z.x-p.x<35&&!m.escaleraEn(p.fila,p.col)).sort((a,b)=>b.x-a.x)[0];
  if(!p)return;
  z.datos.pared=p.id;z.datos.colocaHasta=m.t+(def(m,z).colocar??1);z.comiendo=null;evento(m,z,'coloca-escalera',def(m,z).colocar??1);return false;
 },
};

/** PC: la planta más lejana del carril que esté al menos 100 px detrás; la Pinchohierba no es blanco. */
function blancoCatapulta(m:MotorPvZ,z:ZombiPvZ){
 const p=m.plantas.filter(p=>p.vida>0&&p.fila===z.fila&&!p.datos.enAire&&p.tipo!=='pinchohierba'&&z.x>=p.x+100).sort((a,b)=>a.col-b.col)[0];
 return p?.col;
}
const catapulta:ComportamientoZombiPvZ={
 iniciar(m,z){z.datos.vehiculo=1;z.datos.ignoraMordida=1;z.datos.balones=def(m,z).balones??20;},
 paso(m,z){
  if(z.hipnotizado)return;
  const d=def(m,z);
  if(z.datos.lanzaDesde!==undefined){
   const e=m.t-z.datos.lanzaDesde;z.comiendo=null;
   if(!z.datos.lanzado&&e+1e-9>=d.disparo){z.datos.lanzado=1;z.datos.balones--;const col=blancoCatapulta(m,z);if(col!==undefined)m.lanzarBalon(z,col,d.dano,d.vuelo);evento(m,z,'catapulta-lanza');}
   if(e+1e-9<d.cada)return false;
   delete z.datos.lanzaDesde;delete z.datos.lanzado;
   if(z.datos.balones>0&&blancoCatapulta(m,z)!==undefined){z.datos.lanzaDesde=m.t;return false;}
  }else if(z.x<=d.inicio&&z.datos.balones>0&&blancoCatapulta(m,z)!==undefined){z.datos.lanzaDesde=m.t;z.comiendo=null;return false;}
  // Sin balones o sin blanco avanza y aplasta lo que encuentra.
  m.aplastarPlantas(z.fila,z.x,40);
 },
};

/** Lanzamiento del diablillo (PC): distancia x−360 (−180 en el tejado, mínimo −140), 3 px/cs y gravedad 0,05. */
function lanzarDiablillo(m:MotorPvZ,z:ZombiPvZ){
 let distancia=z.x-360,minimo=40;if(m.nivel.area==='tejado'){distancia-=180;minimo=-140;}
 if(distancia<minimo)distancia=minimo;else if(distancia>140)distancia-=m.azar.entre(0,100);
 const subida=distancia/120,cs=(subida+Math.sqrt(subida*subida+4*.025*88))/.05,desde=z.x-133;
 const x=Math.max(-40,Math.min(780,desde-3*cs));
 const imp=m.crearZombi('diablillo',z.fila,x,z.oleada);
 if(imp){imp.datos.aterrizaHasta=m.t+cs/100;imp.datos.desdeX=desde;evento(m,imp,'diablillo-vuela',cs/100);}
}
const gargantua:ComportamientoZombiPvZ={
 iniciar(_m,z){z.datos.diablillo=1;},
 paso(m,z){
  if(z.hipnotizado)return;
  const d=def(m,z);
  if(z.datos.golpeDesde!==undefined){
   const e=m.t-z.datos.golpeDesde;z.comiendo=null;
   if(!z.datos.golpeado&&e+1e-9>=d.golpe){
    z.datos.golpeado=1;for(const p of [...m.plantas])if(p.vida>0&&p.fila===z.datos.golpeFila&&p.col===z.datos.golpeCol)m.destruirPlanta(p);
    m.eventos.push({t:'estado',id:z.id,tipo:'gargantua-golpe',fila:z.fila,x:z.datos.golpeCol*80+40});
   }
   if(e+1e-9<d.golpeTotal)return false;delete z.datos.golpeDesde;delete z.datos.golpeado;return false;
  }
  if(z.datos.lanzaDesde!==undefined){
   const e=m.t-z.datos.lanzaDesde;z.comiendo=null;
   if(!z.datos.lanzado&&e+1e-9>=d.lanzamiento){z.datos.lanzado=1;z.datos.diablillo=0;lanzarDiablillo(m,z);}
   if(e+1e-9<d.lanzamientoTotal)return false;delete z.datos.lanzaDesde;delete z.datos.lanzado;return false;
  }
  if(z.datos.diablillo&&z.vida<(z.datos.vidaMaxima??m.zombisDef[z.tipo].vida)/2&&z.x-360>40){z.datos.lanzaDesde=m.t;evento(m,z,'gargantua-lanza');return false;}
  const p=m.plantas.filter(p=>p.vida>0&&p.fila===z.fila&&!p.datos.enAire&&z.x-p.x>=-10&&z.x-p.x<45).sort((a,b)=>b.x-a.x)[0];
  if(p){z.datos.golpeDesde=m.t;z.datos.golpeFila=p.fila;z.datos.golpeCol=p.col;z.comiendo=null;evento(m,z,'gargantua-alza',d.golpeTotal);return false;}
 },
};
const diablillo:ComportamientoZombiPvZ={paso(m,z){if((z.datos.aterrizaHasta??0)>m.t){z.comiendo=null;return false;}}};

/* ---------------- Dr. Zomboid (5-10) ---------------- */
const F={entrada:0,reposo:1,invoca:2,pisa:3,colgadosEntran:4,colgadosCaen:5,colgadosSalen:6,caravana:7,cabezaEntra:8,cabezaEspera:9,escupe:10,cabezaDespues:11,cabezaSale:12} as const;
const INVOCADOS=['caracono','caracubo','zombi-futbolista','saltador','zombi-cajita','zombi-escalera','zomboni','zombi-catapulta','zombi-pogo','zombi-periodico','zombi-portero','gargantua'];
const VELOCIDAD_BOLA=100;
function fase(m:MotorPvZ,z:ZombiPvZ,f:number,dura:number){z.datos.fase=f;z.datos.desde=m.t;z.datos.dura=dura;delete z.datos.hecho;}
function reposo(m:MotorPvZ,z:ZombiPvZ){fase(m,z,F.reposo,m.azar.entre(1,2));}
const contador=(z:ZombiPvZ,k:string)=>z.datos[k]??-1;
function romperBola(m:MotorPvZ,z:ZombiPvZ){if(z.datos.bolaX===undefined)return;m.eventos.push({t:'estado',id:z.id,tipo:z.datos.bolaFuego?'bola-fuego-rota':'bola-hielo-rota',fila:z.datos.bolaFila,x:z.datos.bolaX});delete z.datos.bolaX;delete z.datos.bolaFila;delete z.datos.bolaFuego;}
function aplastarEn(m:MotorPvZ,filas:number[],cols:(c:number)=>boolean){for(const p of [...m.plantas])if(p.vida>0&&filas.includes(p.fila)&&cols(p.col))m.destruirPlanta(p);}
function vulnerable(z:ZombiPvZ,m:MotorPvZ){
 const e=m.t-(z.datos.desde??0),f=z.datos.fase;
 return f===F.cabezaEspera||f===F.escupe||f===F.cabezaDespues||f===F.cabezaEntra&&e>=z.datos.dura/2||f===F.cabezaSale&&e<z.datos.dura/2;
}
function vencer(m:MotorPvZ,z:ZombiPvZ){
 romperBola(m,z);
 for(const o of [...m.zombis])if(o!==z&&o.vida>0){if(o.datos.colgadoAlto)m.retirarZombi(o);else m.danarZombi(o,o.vida+o.armadura,'aplastar');}
 z.datos.vidaMinima=0;z.datos.invulnerable=0;evento(m,z,'jefe-vencido');m.danarZombi(z,z.vida,'aplastar');
}
const jefe:ComportamientoZombiPvZ={
 iniciar(m,z){
  Object.assign(z.datos,{todasFilas:1,ignoraMordida:1,invulnerable:1,inmuneEstados:1,escala:3,vidaMinima:1,invocar:5,cabeza:50,pisar:-1,colgados:-1,modo:0});
  fase(m,z,F.entrada,3);evento(m,z,'jefe-entra',3);
 },
 siempre(m,z,dt){
  if(z.datos.bolaX===undefined)return;
  z.datos.bolaX-=VELOCIDAD_BOLA*dt;
  const col=Math.floor(z.datos.bolaX/80);if(col>=0&&col<m.columnas)aplastarEn(m,[z.datos.bolaFila],c=>c===col);
  if(z.datos.bolaX<-100){delete z.datos.bolaX;delete z.datos.bolaFila;delete z.datos.bolaFuego;}
 },
 alQuemarFila(m,z,fila){if(z.datos.bolaX!==undefined&&!z.datos.bolaFuego&&z.datos.bolaFila===fila)romperBola(m,z);},
 alHelar(m,z){if(z.datos.bolaX!==undefined&&z.datos.bolaFuego)romperBola(m,z);z.congelado=Math.min(z.congelado,3);},
 paso(m,z,dt){
  z.comiendo=null;
  for(const k of ['invocar','cabeza','pisar','colgados'])if(contador(z,k)>0)z.datos[k]=Math.max(0,z.datos[k]-dt);
  z.datos.invulnerable=vulnerable(z,m)?0:1;
  const f=z.datos.fase,e=m.t-z.datos.desde,max=z.datos.vidaMaxima??m.zombisDef[z.tipo].vida;
  if(z.vida<=1&&(f===F.reposo||f===F.cabezaEspera||f===F.cabezaDespues)){vencer(m,z);return false;}
  const termino=e+1e-9>=z.datos.dura;
  switch(f){
   case F.entrada:if(termino)reposo(m,z);break;
   case F.reposo:{
    if(!termino)break;
    const indice=z.vida<max/2?2:z.vida<max*4/5?1:0;
    if(indice!==z.datos.modo){z.datos.modo=indice;if(indice===1)atacarColgados(m,z);else atacarCaravana(m,z);}
    else if(contador(z,'pisar')===0)atacarPisada(m,z);
    else if(contador(z,'colgados')===0){z.datos.colgados=m.azar.entre(40,50);if(m.azar.entero(4)===0)atacarCaravana(m,z);else atacarColgados(m,z);}
    else if(contador(z,'cabeza')===0){z.datos.cabeza=m.azar.entre(40,50);fase(m,z,F.cabezaEntra,2);evento(m,z,'jefe-cabeza-baja',2);}
    else if(contador(z,'invocar')===0)atacarInvocando(m,z);
    else reposo(m,z);
    break;
   }
   case F.invoca:
    if(!z.datos.hecho&&e>=1.2){z.datos.hecho=1;const tipo=z.edad<35?'zombi':z.edad<80?'caracono':z.edad<125?'caracubo':(z.datos.invocaFila===m.nivel.filas[0]?INVOCADOS.slice(0,-1):INVOCADOS)[m.azar.entero(z.datos.invocaFila===m.nivel.filas[0]?INVOCADOS.length-1:INVOCADOS.length)];
     if(Object.hasOwn(m.zombisDef,tipo))m.crearZombi(tipo,z.datos.invocaFila,600,0);}
    if(termino)reposo(m,z);break;
   case F.pisa:
    if(!z.datos.hecho&&e>=(z.datos.pisaFila>=2?1.1:1)){z.datos.hecho=1;aplastarEn(m,[z.datos.pisaFila,z.datos.pisaFila+1],c=>c>=5);m.eventos.push({t:'estado',id:z.id,tipo:'jefe-pisa',fila:z.datos.pisaFila,x:600});}
    if(termino)reposo(m,z);break;
   case F.colgadosEntran:
    if(e>=.8){
     for(let i=0;i<3;i++){
      const b=m.crearZombi('zombi-colgado',m.nivel.filas[0],(z.datos.colgadoCol+i)*80+40,0);if(!b||b.vida<=0)continue;
      const celda=elegirCeldaColgadoPvZ(m,b,z.datos.colgadoCol+i);if(!celda){m.retirarZombi(b);continue;}
      apuntarColgado(b,celda);b.datos.altura=200;z.datos['colgado'+i]=b.id;
     }
     fase(m,z,F.colgadosCaen,0);
    }
    break;
   case F.colgadosCaen:{
    const propios=[0,1,2].map(i=>vivo(m,z.datos['colgado'+i])).filter((b):b is ZombiPvZ=>!!b);
    if(!propios.length||propios.some(b=>b.datos.fase===4)){
     for(const b of propios)if(b.mantequilla>0)m.danarZombi(b,b.vida,'aplastar');
     for(let i=0;i<3;i++)delete z.datos['colgado'+i];
     fase(m,z,F.colgadosSalen,1);
    }
    break;
   }
   case F.colgadosSalen:if(termino)reposo(m,z);break;
   case F.caravana:
    if(!z.datos.hecho&&e>=1.3){
     z.datos.hecho=1;const fila=z.datos.caravanaFila,col=z.datos.caravanaCol;
     aplastarEn(m,[fila,fila+1],c=>c>=col&&c<=col+2);m.eventos.push({t:'estado',id:z.id,tipo:'jefe-caravana',fila,x:col*80+120});
     z.datos.invocar=5;z.datos.cabeza=50;if(z.datos.modo>=1)z.datos.pisar=40;if(z.datos.modo>=2)z.datos.colgados=65;
    }
    if(termino)reposo(m,z);break;
   case F.cabezaEntra:if(termino){fase(m,z,F.cabezaEspera,5);}break;
   case F.cabezaEspera:if(termino){fase(m,z,F.escupe,1.5);z.datos.bolaFilaElegida=m.nivel.filas[m.azar.entero(m.nivel.filas.length)];z.datos.bolaFuegoElegida=m.azar.entero(2)===0?1:0;}break;
   case F.escupe:
    if(!z.datos.hecho&&e>=.63){z.datos.hecho=1;romperBola(m,z);z.datos.bolaX=530;z.datos.bolaFila=z.datos.bolaFilaElegida;z.datos.bolaFuego=z.datos.bolaFuegoElegida;m.eventos.push({t:'estado',id:z.id,tipo:z.datos.bolaFuego?'bola-fuego':'bola-hielo',fila:z.datos.bolaFila,x:530});}
    if(termino)fase(m,z,F.cabezaDespues,3);break;
   case F.cabezaDespues:if(termino){fase(m,z,F.cabezaSale,2);evento(m,z,'jefe-cabeza-sube',2);}break;
   case F.cabezaSale:if(termino)reposo(m,z);break;
  }
  z.datos.invulnerable=vulnerable(z,m)?0:1;
  void dt;return false;
 },
};
function atacarInvocando(m:MotorPvZ,z:ZombiPvZ){
 z.datos.invocar=[[4.5,5.5],[3.5,4.5],[1.5,2.5]][z.datos.modo].reduce((a,b)=>m.azar.entre(a,b));
 z.datos.invocaFila=m.nivel.filas[m.azar.entero(m.nivel.filas.length)];fase(m,z,F.invoca,2);evento(m,z,'jefe-invoca',2);
}
function atacarPisada(m:MotorPvZ,z:ZombiPvZ){
 z.datos.pisar=m.azar.entre(55,65);
 const filas=[0,1,2,3].filter(f=>m.plantas.some(p=>p.vida>0&&!p.datos.enAire&&p.fila>=f&&p.fila<=f+1&&p.col>=5));
 if(!filas.length){reposo(m,z);return;}
 z.datos.pisaFila=filas[m.azar.entero(filas.length)];fase(m,z,F.pisa,2);evento(m,z,'jefe-alza-pie',2);
}
function atacarColgados(m:MotorPvZ,z:ZombiPvZ){z.datos.colgados=m.azar.entre(40,50);z.datos.colgadoCol=m.azar.entero(3);fase(m,z,F.colgadosEntran,1.6);evento(m,z,'jefe-colgados');}
function atacarCaravana(m:MotorPvZ,z:ZombiPvZ){z.datos.caravanaFila=m.azar.entero(4);z.datos.caravanaCol=m.azar.entero(3);fase(m,z,F.caravana,2);evento(m,z,'jefe-caravana-alza',2);}

export const COMPORTAMIENTO_TEJADO_ZOMBIS:Record<string,ComportamientoZombiPvZ>={
 'zombi-colgado':colgado,'zombi-escalera':escalera,'zombi-catapulta':catapulta,gargantua,diablillo,'dr-zomboid':jefe,
};
