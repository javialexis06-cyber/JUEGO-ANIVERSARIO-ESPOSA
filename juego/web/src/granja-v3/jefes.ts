/** Patrones de mecanismos alterados. Ninguna deidad ni fauna protegida es un monstruo. */
import type {MonstruoAventura,PuntoAventura,JugadorAventura} from './aventura';
export type ElementoJefe='fuego'|'agua'|'tierra'|'aire';
export interface PatronJefe {version:1;fase:'espera'|'aviso'|'activo'|'reposo';tiempo:number;ciclo:number;elemento:ElementoJefe;centro:PuntoAventura;direccion:PuntoAventura;objetivos:PuntoAventura[]}
export const JEFES:Record<string,{nombre:string;elemento:ElementoJefe|'cuatro';vida:number;dano:number;modeloBase:string}>={
 regulador_fuego:{nombre:'Horno del Resentimiento',elemento:'fuego',vida:140,dano:12,modeloBase:'constructo_fuego'},
 regulador_agua:{nombre:'Bomba de los Retornos Rotos',elemento:'agua',vida:140,dano:10,modeloBase:'constructo_agua'},
 regulador_tierra:{nombre:'Ancla de la Raíz Cerrada',elemento:'tierra',vida:170,dano:13,modeloBase:'constructo_tierra'},
 regulador_aire:{nombre:'Turbina del Viento Cautivo',elemento:'aire',vida:145,dano:10,modeloBase:'constructo_aire'},
 forma_fija:{nombre:'Circuito de Forma Fija',elemento:'cuatro',vida:200,dano:12,modeloBase:'guardian'},
 proyeccion_nath:{nombre:'Proyección del conducto de Nath',elemento:'cuatro',vida:240,dano:14,modeloBase:'centinela'},
};
export const esJefe=(tipo:string)=>Object.hasOwn(JEFES,tipo);
export function crearPatron(m:MonstruoAventura):PatronJefe{return {version:1,fase:'espera',tiempo:1.5,ciclo:0,elemento:JEFES[m.tipo]?.elemento==='cuatro'?'fuego':JEFES[m.tipo]?.elemento as ElementoJefe,centro:{x:m.x,z:m.z},direccion:{x:0,z:1},objetivos:[]};}
const distancia=(a:PuntoAventura,b:PuntoAventura)=>Math.hypot(a.x-b.x,a.z-b.z);
const elementos:ElementoJefe[]=['fuego','agua','tierra','aire'];
export function descripcionPatron(p:PatronJefe){return p.elemento==='fuego'?'Calor: sal de las dos líneas que cruzan el centro.':p.elemento==='agua'?'Retorno: evita el anillo a seis pasos del centro.':p.elemento==='tierra'?'Soporte: aléjate de los tres puntos marcados.':'Presión: cruza de lado el corredor de la corriente.';}
/** La dirección y objetivos se fijan antes del ataque. Moverse después permite esquivarlo. */
export function pasoJefe(m:MonstruoAventura,dt:number,jugador:JugadorAventura,inicio:PuntoAventura,libre:(p:PuntoAventura)=>boolean){
 const def=JEFES[m.tipo],p=m.patron??(m.patron=crearPatron(m));m.invulnerable=Math.max(0,m.invulnerable-dt);
 if(!m.vivo||distancia(m,jugador)>22)return {dano:0,empuje:null};
 if(distancia(jugador,inicio)<2.2){p.fase='espera';p.tiempo=1.5;m.fase='reposo';return {dano:0,empuje:null};}
 p.tiempo=Math.max(0,p.tiempo-dt);let dano=0,empuje:PuntoAventura|null=null;
 if(p.fase==='espera'&&p.tiempo===0){
  p.elemento=def.elemento==='cuatro'?elementos[Math.min(3,Math.floor((1-m.hp/m.hpMax)*4))]:def.elemento;
  p.centro={x:m.x,z:m.z};const d=Math.max(.01,distancia(m,jugador));p.direccion={x:(jugador.x-m.x)/d,z:(jugador.z-m.z)/d};if(Math.hypot(p.direccion.x,p.direccion.z)<.5)p.direccion={x:0,z:1};
  const candidatos=[{x:jugador.x,z:jugador.z},{x:jugador.x+p.direccion.z*3,z:jugador.z-p.direccion.x*3},{x:jugador.x-p.direccion.z*3,z:jugador.z+p.direccion.x*3}];p.objetivos=candidatos.filter(libre);p.fase='aviso';p.tiempo=1.6;m.fase='anticipacion';m.direccion={...p.direccion};
 }else if(p.fase==='aviso'&&p.tiempo===0){p.fase='activo';p.tiempo=1.1;m.fase='ataque';}
 else if(p.fase==='activo'){
  const x=jugador.x-p.centro.x,z=jugador.z-p.centro.z,adelante=x*p.direccion.x+z*p.direccion.z,lado=x*p.direccion.z-z*p.direccion.x,r=Math.hypot(x,z);
  const golpe=p.elemento==='fuego'?(Math.abs(lado)<.85&&Math.abs(adelante)<9||Math.abs(adelante)<.85&&Math.abs(lado)<9):p.elemento==='agua'?r>4.8&&r<6.6:p.elemento==='tierra'?p.objetivos.some(q=>distancia(q,jugador)<1.7):Math.abs(lado)<1.1&&adelante>-1&&adelante<11;
  if(golpe&&libre(jugador)){dano=Math.max(1,def.dano-Math.max(0,jugador.defensa??0));if(p.elemento==='aire')empuje={x:p.direccion.x*.8,z:p.direccion.z*.8};}
  if(p.tiempo===0){p.fase='reposo';p.tiempo=2.4;m.fase='recuperacion';}
 }else if(p.fase==='reposo'&&p.tiempo===0){p.fase='espera';p.tiempo=1.2;p.ciclo++;m.fase='reposo';}
 return {dano,empuje};
}
export function patronValido(m:MonstruoAventura){const p=m.patron;if(!esJefe(m.tipo))return p===undefined;return !!p&&p.version===1&&['espera','aviso','activo','reposo'].includes(p.fase)&&Number.isFinite(p.tiempo)&&p.tiempo>=0&&p.tiempo<=3&&Number.isSafeInteger(p.ciclo)&&p.ciclo>=0&&p.ciclo<=1000000&&elementos.includes(p.elemento)&&[p.centro,p.direccion,...(Array.isArray(p.objetivos)?p.objetivos:[])].every(q=>q&&Number.isFinite(q.x)&&Number.isFinite(q.z)&&Math.abs(q.x)<500&&Math.abs(q.z)<500)&&Math.abs(Math.hypot(p.direccion.x,p.direccion.z)-1)<.01&&Array.isArray(p.objetivos)&&p.objetivos.length<=3;}
