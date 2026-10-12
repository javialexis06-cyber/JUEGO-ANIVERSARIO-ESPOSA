import type { EstadoGranja, Resultado } from './estado';
import { MINA, instanciaAventura, puedeInvestigar, sondearEscalera } from './aventura';
import { cambiarCantidad, resumirCasillas } from './inventario';
import { LIBROS, libroDef, desbloqueoLibro, fuenteLibro } from './libros-datos';
export interface RegistroLibro {id:string;recuperadoDia:number;leidoDia:number|null;semillaInstancia:number}
export interface EstadoLibros {version:1;registros:RegistroLibro[]}
export type AccionLibro={tipo:'recuperar'|'leer';id:string}|{tipo:'prospectar'};
export const COSTE_PROSPECCION={antorcha:3,energia:8} as const;
export const crearLibros=():EstadoLibros=>({version:1,registros:[]});
export const libroAprendido=(s:EstadoGranja,id:string)=>s.libros.registros.some(r=>r.id===id&&r.leidoDia!==null);
export function libroEnSituacion(s:EstadoGranja,id:string){const i=instanciaAventura(s.aventura);return i?.destinoId===MINA?LIBROS.find(l=>l.piso===i.nivel&&fuenteLibro(l)===id&&i.situaciones.some(p=>p.id===id&&p.tipo==='campamento')):undefined;}
export function puedeRecuperarLibro(s:EstadoGranja,id:string,x:number,z:number){const l=libroDef(id);return !!l&&!!libroEnSituacion(s,fuenteLibro(l))&&!s.libros.registros.some(r=>r.id===id)&&puedeInvestigar(s.aventura,fuenteLibro(l),{x,z});}
const mal=(mensaje:string):Resultado=>({ok:false,mensaje});
const bien=(mensaje:string):Resultado=>({ok:true,mensaje});
export function actuarLibro(s:EstadoGranja,a:AccionLibro,x:number,z:number):Resultado {
 if(a.tipo==='prospectar'){
  if(!libroAprendido(s,'piedra'))return mal('Recupera y lee Señales bajo las rocas para aprender prospección.');
  if(s.energia<COSTE_PROSPECCION.energia)return mal('Necesitas 8 de energía para prospectar.');const casillas=cambiarCantidad(s.casillasInventario,'antorcha',-COSTE_PROSPECCION.antorcha);if(!casillas)return mal('Prepara 3 antorchas en tu mochila.');
  const r=sondearEscalera(s.aventura,{x,z});if(!r.ok)return r;s.casillasInventario=casillas;s.inventario=resumirCasillas(casillas);s.energia-=COSTE_PROSPECCION.energia;return r;
 }
 const l=libroDef(a.id);if(!l)return mal('Cuaderno desconocido.');const r=s.libros.registros.find(r=>r.id===l.id);
 if(a.tipo==='recuperar'){
  if(!puedeRecuperarLibro(s,l.id,x,z))return mal('Acércate por un camino despejado al campamento de ese cuaderno. Cada cuaderno se recupera una sola vez.');
  s.libros.registros.push({id:l.id,recuperadoDia:s.jornada.diasCompletados,leidoDia:null,semillaInstancia:instanciaAventura(s.aventura)!.semilla});return bien('Recuperaste «'+l.titulo+'». Regresa de la expedición para leerlo en tu biblioteca.');
 }
 if(a.tipo!=='leer')return mal('Acción de cuaderno desconocida.');if(!r)return mal('Primero encuentra y recupera este cuaderno.');if(s.aventura.destinoActual)return mal('Regresa de la expedición antes de leer.');
 if(r.leidoDia===null){const flag=desbloqueoLibro(l.id);if(s.desbloqueos.length>=100||s.desbloqueos.includes(flag))return mal('No se puede registrar este aprendizaje.');r.leidoDia=s.jornada.diasCompletados;s.desbloqueos.push(flag);}
 return bien(l.titulo+' · '+l.efecto);
}
/** Fechas, origen alcanzado y desbloqueos deben corresponder a libros efectivamente recuperados/leídos. */
export function librosValidos(s:EstadoGranja):boolean {
 const registro=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v),entero=(v:unknown,min=0,max=1e9):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max;
 const v:unknown=s.libros,dia=s.jornada?.diasCompletados;if(!entero(dia)||!registro(v)||v.version!==1||!Array.isArray(v.registros)||v.registros.length>LIBROS.length||!Array.isArray(s.desbloqueos))return false;
 const registros=v.registros,ids=new Set<string>();for(const r of registros){if(!registro(r)||typeof r.id!=='string'||ids.has(r.id))return false;const l=libroDef(r.id);if(!l||!entero(r.recuperadoDia,0,dia)||r.leidoDia!==null&&!entero(r.leidoDia,r.recuperadoDia,dia)||!entero(r.semillaInstancia,0,0xffffffff))return false;
  if(!s.aventura.descubrimientos.includes(MINA)||(s.aventura.profundidad[MINA]??0)<l.piso)return false;ids.add(l.id);
 }
 return s.desbloqueos.every(id=>!id.startsWith('libro_')||LIBROS.some(l=>desbloqueoLibro(l.id)===id))&&LIBROS.every(l=>s.desbloqueos.includes(desbloqueoLibro(l.id))===registros.some(r=>r.id===l.id&&r.leidoDia!==null));
}
