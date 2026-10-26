import type {DefNivel,EstadoPvZ} from '../tipos';
import type {MotorPvZ} from './motor';
import type {InstantaneaDirectorPvZ} from './oleadas';
import type {InstantaneaVisibilidadPvZ} from './niebla';
import type {InstantaneaAplastazombisPvZ} from './aplastazombis';
import type {InstantaneaRompejarronesPvZ} from './rompejarrones';
import {arbolPvZ,canonicoPvZ,exigirPvZ,enteroPvZ,numeroPvZ,objetoPvZ} from './validacion';

type EstadoPersistente=Omit<EstadoPvZ,'jarrones'|'sobres'|'etapaJarrones'|'niebla'|'tormenta'>;
/** Guardado de confianza del anfitrión, distinto del estado visible enviado a un invitado. */
export interface InstantaneaMotorPvZ {
 version:1;reglas:1;nivel:DefNivel;semillas:string[];sinOleadas:boolean;
 catalogo:{plantas:Record<string,string>;zombis:Record<string,string>};
 estado:EstadoPersistente;azar:number;
 relojes:{proximo:number;cieloEn:number;cielosCaidos:number;cintaEn:number;cintaEmitida:Record<string,number>;cintaUltima?:string;vidaOleada:number;alzamientoEn:number|null;emboscadaEn:number|null};
 director:InstantaneaDirectorPvZ|null;visibilidad:InstantaneaVisibilidadPvZ;
 aplastazombis:InstantaneaAplastazombisPvZ|null;rompejarrones:InstantaneaRompejarronesPvZ|null;
}

export function catalogoInstantaneaPvZ(m:Pick<MotorPvZ,'plantasDef'|'zombisDef'>){
 return{plantas:Object.fromEntries(Object.entries(m.plantasDef).map(([id,d])=>[id,canonicoPvZ(d)])),zombis:Object.fromEntries(Object.entries(m.zombisDef).map(([id,d])=>[id,canonicoPvZ(d)]))};
}
export function cabeceraInstantaneaPvZ(v:unknown):asserts v is InstantaneaMotorPvZ{
 arbolPvZ(v);
 exigirPvZ(objetoPvZ(v)&&v.version===1&&v.reglas===1,'Versión de partida PvZ incompatible');
 exigirPvZ(objetoPvZ(v.nivel)&&typeof v.nivel.id==='string'&&Array.isArray(v.semillas)&&v.semillas.every(id=>typeof id==='string')&&typeof v.sinOleadas==='boolean');
}
/** Valida el contrato completo antes de sustituir el motor que se está jugando. */
export function validarInstantaneaPvZ(s:InstantaneaMotorPvZ,m:MotorPvZ){
 const e=s.estado,r=s.relojes;
 exigirPvZ(objetoPvZ(e)&&e.version===1&&e.nivel===m.nivel.id&&enteroPvZ(e.pasos)&&e.t===e.pasos/60&&numeroPvZ(e.sol)&&e.sol>=0&&enteroPvZ(e.abono,0,3)&&enteroPvZ(e.oleada)&&['','gano','perdio'].includes(e.terminado)&&enteroPvZ(e.eliminados)&&enteroPvZ(e.sembradas)&&(e.monedas===undefined||enteroPvZ(e.monedas)));
 exigirPvZ(objetoPvZ(r)&&enteroPvZ(r.proximo,1)&&numeroPvZ(r.cieloEn)&&enteroPvZ(r.cielosCaidos)&&numeroPvZ(r.cintaEn)&&numeroPvZ(r.vidaOleada)&&r.vidaOleada>=0);
 for(const v of[r.alzamientoEn,r.emboscadaEn])exigirPvZ(v===null||numeroPvZ(v)&&v>=0);
 exigirPvZ(enteroPvZ(s.azar,1,4294967295)&&objetoPvZ(s.catalogo));
 const actual=catalogoInstantaneaPvZ(m);
 for(const tipo of['plantas','zombis']as const){
  const guardado=s.catalogo[tipo];exigirPvZ(objetoPvZ(guardado)&&Object.keys(guardado).length>0);
  for(const[id,def]of Object.entries(guardado))exigirPvZ(Object.hasOwn(actual[tipo],id)&&actual[tipo][id]===def,'Las reglas de '+id+' han cambiado; se conserva el guardado para migrarlo');
 }
 const planta=(id:unknown):id is string=>typeof id==='string'&&Object.hasOwn(s.catalogo.plantas,id);
 const zombi=(id:unknown):id is string=>typeof id==='string'&&Object.hasOwn(s.catalogo.zombis,id);
 exigirPvZ(s.semillas.every(planta)&&m.nivel.zombis.every(zombi)&&(m.nivel.cinta??[]).every(planta));
 const registro=(v:unknown,clave:(id:string)=>boolean,entero=false)=>{exigirPvZ(objetoPvZ(v));for(const[id,n]of Object.entries(v))exigirPvZ(clave(id)&&numeroPvZ(n)&&n>=0&&(!entero||enteroPvZ(n)));};
 registro(e.recargas,planta);registro(r.cintaEmitida,id=>(m.nivel.cinta??[]).includes(id),true);exigirPvZ(r.cintaUltima===undefined||typeof r.cintaUltima==='string'&&(m.nivel.cinta??[]).includes(r.cintaUltima));
 const lista=(v:unknown,max:number)=>exigirPvZ(Array.isArray(v)&&v.length<=max);
 const ids=new Set<number>();
 const identidad=(q:{id:number})=>{exigirPvZ(q&&enteroPvZ(q.id,1,r.proximo-1)&&!ids.has(q.id),'Identidades de entidades inválidas');ids.add(q.id);};
 const fila=(f:unknown)=>exigirPvZ(enteroPvZ(f)&&m.nivel.filas.includes(f));
 const celda=(q:{fila:number;col:number;x:number})=>exigirPvZ(m.casilla(q.fila,q.col)&&q.x===q.col*80+40);
 const datos=(d:unknown)=>{exigirPvZ(objetoPvZ(d)&&Object.values(d).every(numeroPvZ));};
 const numeros=(q:object,campos:string[],min?:number)=>{for(const campo of campos){const v=(q as Record<string,unknown>)[campo];exigirPvZ(numeroPvZ(v)&&(min===undefined||v>=min));}};
 const booleanos=(q:object,campos:string[])=>{for(const campo of campos)exigirPvZ(typeof(q as Record<string,unknown>)[campo]==='boolean');};
 lista(e.plantas,m.filas*9*4);const casillas=new Set<string>();
 for(const p of e.plantas){identidad(p);celda(p);exigirPvZ(planta(p.tipo)&&['base','principal','cubierta','temporal'].includes(p.capa)&&p.capa===(m.plantasDef[p.tipo].capa??'principal'));numeros(p,['vida','edad','congelada'],0);booleanos(p,['dormida']);datos(p.datos);if(p.vida>0){const k=p.fila+':'+p.col+':'+p.capa;exigirPvZ(!casillas.has(k));casillas.add(k);}}
 lista(e.zombis,300);
 for(const z of e.zombis){identidad(z);fila(z.fila);exigirPvZ(zombi(z.tipo)&&[-1,1].includes(z.sentido)&&enteroPvZ(z.oleada)&&(z.comiendo===null||enteroPvZ(z.comiendo,1,r.proximo-1)));numeros(z,['x']);numeros(z,['vida','edad','armadura','armaduraInicial','lento','congelado','mantequilla'],0);booleanos(z,['escudo','metal','hipnotizado','ceniza','sinBrazo','sinCabeza']);datos(z.datos);}
 lista(e.proyectiles,500);
 for(const p of e.proyectiles){identidad(p);fila(p.fila);exigirPvZ(typeof p.tipo==='string'&&enteroPvZ(p.origen)&&['recto','lanzado','perforante','explosion','fuego','hielo','aplastar','salpicadura'].includes(p.danoTipo));numeros(p,['x','velocidad']);numeros(p,['dano'],0);lista(p.impactados,300);exigirPvZ(p.impactados.every(id=>enteroPvZ(id,1,r.proximo-1)));for(const k of['y','velocidadY','lento','hasta','salida','llegada','desdeX','destinoX','mantequilla']as const)if(p[k]!==undefined)exigirPvZ(numeroPvZ(p[k]));for(const k of['objetivo','destinoCol']as const)if(p[k]!==undefined)exigirPvZ(enteroPvZ(p[k]));for(const k of['aereo','perforante','enemigo']as const)if(p[k]!==undefined)exigirPvZ(typeof p[k]==='boolean');if(p.antorchas!==undefined){lista(p.antorchas,m.filas*9);exigirPvZ(p.antorchas.every(id=>enteroPvZ(id,1,r.proximo-1)));}}
 lista(e.soles,100);
 for(const q of e.soles){identidad(q);fila(q.fila);numeros(q,['x','valor','edad','vida'],0);exigirPvZ(['cielo','planta','moneda'].includes(q.origen));}
 lista(e.cortacespedes,m.nivel.filas.length);exigirPvZ(e.cortacespedes.length===(m.nivel.sinCortacespedes?0:m.nivel.filas.length)&&new Set(e.cortacespedes.map(c=>c.fila)).size===e.cortacespedes.length);
 for(const q of e.cortacespedes){fila(q.fila);numeros(q,['x']);exigirPvZ(['listo','activo','gastado'].includes(q.estado));}
 lista(e.cinta,10);for(const q of e.cinta){identidad(q);exigirPvZ(planta(q.planta)&&m.nivel.cinta?.includes(q.planta));}
 lista(e.lapidas,m.filas*9);lista(e.crateres,m.filas*9);lista(e.pistasHielo,m.filas);lista(e.zonas,100);
 const terreno=new Set<string>();for(const q of [...e.lapidas!,...e.crateres!]){identidad(q);celda(q);const k=q.fila+':'+q.col;exigirPvZ(!terreno.has(k));terreno.add(k);}
 for(const q of e.crateres!)numeros(q,['vida'],0);
 for(const q of [...e.pistasHielo!,...e.zonas!]){identidad(q);fila(q.fila);numeros(q,['desde','hasta','vida'],0);exigirPvZ(q.desde<=q.hasta);}
 for(const q of e.zonas!)exigirPvZ(q.tipo==='hielo'&&enteroPvZ(q.origen,1,r.proximo-1));
 exigirPvZ(m.nivel.objetivo?numeroPvZ(e.objetivoVida)&&e.objetivoVida>=0&&e.objetivoVida<=m.nivel.objetivo.vida:e.objetivoVida===undefined);
 exigirPvZ((s.director===null)===(m.director===null)&&(s.aplastazombis===null)===(m.nivel.minijuego!=='aplastazombis'||s.sinOleadas)&&(s.rompejarrones===null)===(m.nivel.minijuego!=='rompejarrones'||s.sinOleadas),'Directores incompatibles');
 if(s.director)exigirPvZ(s.director.actual===e.oleada);
 if(s.aplastazombis)exigirPvZ(s.aplastazombis.actual===e.oleada);
 if(s.rompejarrones){for(const j of s.rompejarrones.recipientes??[])identidad(j);for(const q of s.rompejarrones.tarjetas??[])identidad(q);exigirPvZ(s.rompejarrones.indice+1===e.oleada);}
}
