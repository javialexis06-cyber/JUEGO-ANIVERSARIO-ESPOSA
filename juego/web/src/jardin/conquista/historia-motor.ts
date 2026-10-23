import {DefensasConquistaPvZ,type InstantaneaDefensasPvZ,type EventoDefensaPvZ} from './defensas';
import {ESCENARIOS_HISTORIA_PVZ,escenarioHistoriaPvZ} from './historia-datos';
import {AzarPvZ} from '../pvz/motor/azar';
import {PLANTAS_PVZ} from '../pvz/datos/plantas';
import {arbolPvZ,canonicoPvZ,enteroPvZ,exigirPvZ,numeroPvZ,objetoPvZ} from '../pvz/motor/validacion';
import type {OrdenPvZ} from '../pvz/tipos';

export interface ZonaHistoriaPvZ {id:number;nombre:string;col:number;fila:number;base:'plantas'|'zombis'|null;dueno:'plantas'|'zombis';descanso:number;incursion:{id:number;tipo:'defensa'|'expedicion';inicio:number}|null}
export interface EstadoHistoriaPvZ {v:2;reglas:1;config:{modo:'historia';semilla:number;incursiones:boolean};ancho:4;alto:3;pasos:number;azar:number;proximo:number;siguienteAtaque:number;zonas:ZonaHistoriaPvZ[];conocidas:number[];desbloqueadas:string[];ganador:''|'plantas'|'zombis';avisos:{id:number;zona:number;texto:string}[]}
export interface PartidaHistoriaPvZ {version:2;mundo:EstadoHistoriaPvZ;defensas:InstantaneaDefensasPvZ}
/** Mundo de historia: cada combate es una instancia completa del motor PvZ de 60 Hz. */
export class HistoriaConquistaPvZ {
 readonly defensas:DefensasConquistaPvZ;readonly estado:EstadoHistoriaPvZ;private azar:AzarPvZ;
 constructor(semilla=23,incursiones=true){
  this.azar=new AzarPvZ(semilla);const iniciales=[...escenarioHistoriaPvZ(8).desbloquea];
  this.estado={v:2,reglas:1,config:{modo:'historia',semilla,incursiones},ancho:4,alto:3,pasos:0,azar:this.azar.estado,proximo:1,siguienteAtaque:35,zonas:ESCENARIOS_HISTORIA_PVZ.map(e=>({id:e.id,nombre:e.nombre,col:e.col,fila:e.fila,base:e.base,dueno:e.id===8?'plantas':'zombis',descanso:0,incursion:null})),conocidas:[8],desbloqueadas:iniciales,ganador:'',avisos:[]};
  this.defensas=new DefensasConquistaPvZ({zonas:this.estado.zonas.map(z=>String(z.id)),desbloqueadas:iniciales});this.defensas.asignar('8',iniciales);
 }
 get t(){return this.estado.pasos/60;}
 get presion(){const n=this.estado.zonas.filter(z=>z.dueno==='plantas').length;return n>=8?4:n>=5?3:n>=3?2:1;}
 get activos(){return this.estado.zonas.filter(z=>z.incursion!==null);}
 vecinos(id:number){const z=this.estado.zonas[id];return z?this.estado.zonas.filter(q=>Math.abs(q.col-z.col)+Math.abs(q.fila-z.fila)===1).map(q=>q.id):[];}
 abastecidas(){const s=this.estado;if(s.zonas[8].dueno!=='plantas')return new Set<number>();const vistos=new Set([8]),cola=[8];for(let i=0;i<cola.length;i++)for(const id of this.vecinos(cola[i]))if(!vistos.has(id)&&s.zonas[id].dueno==='plantas'){vistos.add(id);cola.push(id);}return vistos;}
 puedeLlegar(id:number){return!!this.estado.zonas[id]&&(this.abastecidas().has(id)||this.vecinos(id).some(v=>this.abastecidas().has(v)))&&(id!==3||this.estado.zonas.filter(z=>z.dueno==='plantas').length>=11);}
 explorar(id:number){
  const s=this.estado;if(s.ganador||this.defensas.pausada||!this.puedeLlegar(id))return false;if(s.conocidas.includes(id))return true;
  s.conocidas.push(id);const nuevas=escenarioHistoriaPvZ(id).desbloquea.filter(tipo=>!s.desbloqueadas.includes(tipo));s.desbloqueadas.push(...nuevas);this.defensas.desbloquear(nuevas);this.aviso(id,nuevas.length?'Nuevas semillas en '+s.zonas[id].nombre:s.zonas[id].nombre+' está a tu alcance');return true;
 }
 private aviso(zona:number,texto:string){const s=this.estado;s.avisos.push({id:s.proximo++,zona,texto});if(s.avisos.length>30)s.avisos.shift();}
 preparar(id:number,semillas:readonly string[],revision=this.defensas.revision):string{
  const s=this.estado;if(this.defensas.pausada||s.ganador)return'La partida está detenida.';
  if(!Array.isArray(semillas))return'Revisa las semillas elegidas.';
  if(!s.conocidas.includes(id)||!this.puedeLlegar(id))return'Necesitas una ruta conectada con la casa.';
  const cambios=new Map<string,readonly string[]>([[String(id),semillas]]);
  for(const tipo of semillas){const origen=this.defensas.propietaria(tipo);if(origen!==null&&origen!==String(id)){
   if(s.zonas[Number(origen)].dueno==='plantas'&&!this.abastecidas().has(Number(origen)))return'La zona de origen está aislada.';
   cambios.set(origen,(cambios.get(origen)??this.defensas.semillas(origen)).filter(t=>t!==tipo));
  }}
  const r=this.defensas.asignarVarios([...cambios].map(([zona,semillas])=>({zona,semillas})),revision);
  if(r.ok)return'';return r.motivo==='activa'?'Una de esas zonas está combatiendo. Espera a que termine.':r.motivo==='revision'?'Las reservas cambiaron. Revisa la selección.':r.motivo==='bloqueada'?'Esa semilla aún no está disponible.':'Revisa los tipos elegidos y sus reservas.';
 }
 puedeExpedicion(id:number){const z=this.estado.zonas[id];return!!z&&!this.estado.ganador&&!this.defensas.pausada&&z.dueno==='zombis'&&!z.incursion&&z.descanso<=this.t&&this.puedeLlegar(id)&&this.activos.length<6&&this.activos.filter(z=>z.incursion?.tipo==='expedicion').length<3;}
 expedicion(id:number){if(!this.puedeExpedicion(id)||!this.estado.conocidas.includes(id)||!this.defensas.semillas(String(id)).length)return false;return this.abrir(id,'expedicion');}
 private abrir(id:number,tipo:'expedicion'|'defensa'){
  const z=this.estado.zonas[id],semilla=this.defensas.observar(String(id))?23:this.azar.entero(4294967296);this.estado.azar=this.azar.estado;
  if(!this.defensas.iniciar(String(id),escenarioHistoriaPvZ(id).nivel,{semilla}))return false;
  z.incursion={id:this.estado.proximo++,tipo,inicio:this.t};this.aviso(id,tipo==='defensa'?'Los zombis atacan '+z.nombre:'Expedición en '+z.nombre);return true;
 }
 ordenar(id:number,orden:OrdenPvZ){return!this.estado.ganador&&!!this.estado.zonas[id]?.incursion&&this.defensas.ordenar(String(id),orden);}
 pausar(valor:boolean){this.defensas.pausar(valor);}
 seleccionar(id:number|null){return this.defensas.seleccionar(id===null?null:String(id));}
 paso():EventoDefensaPvZ[]{
  const s=this.estado;if(s.ganador||this.defensas.pausada)return[];
  const eventos=this.defensas.paso();s.pasos=this.defensas.pasos;
  for(const z of this.activos){const motor=this.defensas.observar(String(z.id))!;if(!motor.terminado)continue;
   if(motor.terminado==='gano'){z.dueno='plantas';this.aviso(z.id,z.nombre+' está a salvo');}
   else{z.dueno='zombis';this.defensas.perder(String(z.id));this.aviso(z.id,'Los zombis tomaron '+z.nombre);}
   z.incursion=null;z.descanso=this.t+18;
  }
  if(s.zonas[8].dueno!=='plantas')s.ganador='zombis';else if(s.zonas.every(z=>z.dueno==='plantas'))s.ganador='plantas';
  if(!s.ganador&&s.config.incursiones&&this.t>=s.siguienteAtaque){
   s.siguienteAtaque=this.t+Math.max(22,42-this.presion*4);
   if(this.activos.length<6&&this.activos.filter(z=>z.incursion?.tipo==='defensa').length<this.presion){
    const candidatos=s.zonas.filter(z=>z.dueno==='plantas'&&!z.incursion&&z.descanso<=this.t&&this.vecinos(z.id).some(id=>s.zonas[id].dueno==='zombis')).sort((a,b)=>Number(!!a.base)-Number(!!b.base)||a.id-b.id);
    if(candidatos.length)this.abrir(candidatos[this.azar.entero(Math.min(3,candidatos.length))].id,'defensa');
   }
  }
  s.azar=this.azar.estado;return eventos;
 }
 exportar():PartidaHistoriaPvZ{return{version:2,mundo:structuredClone(this.estado),defensas:this.defensas.exportar()};}
 static restaurar(dato:unknown):HistoriaConquistaPvZ {
  arbolPvZ(dato);exigirPvZ(objetoPvZ(dato)&&dato.version===2&&objetoPvZ(dato.mundo)&&objetoPvZ(dato.defensas),'Versión de historia incompatible');
  const foto=structuredClone(dato)as unknown as PartidaHistoriaPvZ,s=foto.mundo;
  exigirPvZ(s.v===2&&s.reglas===1&&s.config?.modo==='historia'&&enteroPvZ(s.config.semilla,-Number.MAX_SAFE_INTEGER)&&typeof s.config.incursiones==='boolean'&&s.ancho===4&&s.alto===3&&enteroPvZ(s.pasos)&&enteroPvZ(s.proximo,1)&&enteroPvZ(s.azar,1,4294967295)&&numeroPvZ(s.siguienteAtaque)&&s.siguienteAtaque>=0&&['','plantas','zombis'].includes(s.ganador));
  exigirPvZ(Array.isArray(s.conocidas)&&s.conocidas.includes(8)&&new Set(s.conocidas).size===s.conocidas.length&&s.conocidas.every(id=>enteroPvZ(id,0,11))&&Array.isArray(s.desbloqueadas)&&new Set(s.desbloqueadas).size===s.desbloqueadas.length);
  const permitidas=[...new Set(s.conocidas.flatMap(id=>escenarioHistoriaPvZ(id).desbloquea))];exigirPvZ(canonicoPvZ([...s.desbloqueadas].sort())===canonicoPvZ(permitidas.sort())&&s.desbloqueadas.every(id=>Object.hasOwn(PLANTAS_PVZ,id)),'Desbloqueos incoherentes');
  const defensas=DefensasConquistaPvZ.restaurar(foto.defensas);exigirPvZ(defensas.pasos===s.pasos&&canonicoPvZ([...foto.defensas.desbloqueadas].sort())===canonicoPvZ([...s.desbloqueadas].sort())&&foto.defensas.zonas.length===12&&foto.defensas.zonas.every((z,i)=>z.id===String(i)));
  exigirPvZ(Array.isArray(s.zonas)&&s.zonas.length===12);const ids=new Set<number>();
  for(const[zona,z]of s.zonas.entries()){
   const d=escenarioHistoriaPvZ(zona),m=defensas.observar(String(zona));
   exigirPvZ(z&&z.id===zona&&z.nombre===d.nombre&&z.col===d.col&&z.fila===d.fila&&z.base===d.base&&['plantas','zombis'].includes(z.dueno)&&numeroPvZ(z.descanso)&&z.descanso>=0&&(z.dueno!=='plantas'||s.conocidas.includes(zona)));
   if(z.incursion){exigirPvZ(s.conocidas.includes(zona)&&enteroPvZ(z.incursion.id,1,s.proximo-1)&&!ids.has(z.incursion.id)&&['defensa','expedicion'].includes(z.incursion.tipo)&&numeroPvZ(z.incursion.inicio)&&z.incursion.inicio>=0&&z.incursion.inicio<=s.pasos/60&&!!m&&!m.terminado&&z.dueno===(z.incursion.tipo==='defensa'?'plantas':'zombis'));ids.add(z.incursion.id);}
   else exigirPvZ(!m||m.terminado==='gano');
   if(m)exigirPvZ(canonicoPvZ(m.nivel)===canonicoPvZ(d.nivel),'Tablero ajeno al territorio');
  }
  exigirPvZ(s.zonas.filter(z=>z.incursion).length<=6&&Array.isArray(s.avisos)&&s.avisos.length<=30&&s.avisos.every(a=>a&&enteroPvZ(a.id,1,s.proximo-1)&&enteroPvZ(a.zona,0,11)&&typeof a.texto==='string'&&a.texto.length<=200));
  exigirPvZ(s.ganador===(s.zonas[8].dueno!=='plantas'?'zombis':s.zonas.every(z=>z.dueno==='plantas')?'plantas':''),'Final de historia incoherente');
  const m=new HistoriaConquistaPvZ(s.config.semilla,s.config.incursiones);Object.assign(m,{estado:s,defensas});m.azar.restaurar(s.azar);return m;
 }
}
