import type {EstadoGranja} from './estado';
import {MISIONES_HISTORIA} from './historia-datos';

/** Una comisión temporal conserva identidad y domicilio; no libera habitantes de celdas de Nox. */
export function comisionHistoria(s:EstadoGranja,id:string){
 for(const [qid,a]of Object.entries(s.historia?.activas??{})){
  const q=MISIONES_HISTORIA.find(q=>q.id===qid),p=q?.pasos[a.paso];
  const actor=p?.participantes?.find(p=>p.id===id);
  if(actor?.comision)return actor.comision;
 }
 return null;
}
export function habitantesHistoria(s:EstadoGranja,region:string,originales:string[]){
 const resultado=originales.filter(id=>{const c=comisionHistoria(s,id);return !c||c.region===region;});
 for(const [id,a] of Object.entries(s.historia?.activas??{})){
  const q=MISIONES_HISTORIA.find(q=>q.id===id);
  for(const n of q?.pasos[a.paso]?.participantes??[])if(n.comision?.region===region&&!resultado.includes(n.id))resultado.push(n.id);
 }
 return resultado;
}
