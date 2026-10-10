import { capacidadRefugio, camaAnimal, esperaCorral } from './refugios';
import { crearGenoma, validarGenoma, type Genome, type Species } from './genetica';
import type { EstadoGranja, Animal, Edificio } from './estado';
export type MetodoProducto='recoger'|'ordenar'|'esquilar'|'buscar_trufas';
export const GANADO:Record<Species,{metodo:MetodoProducto;incubacion:number;grande?:boolean;precioHuevo?:number}>={
 vaca:{metodo:'ordenar',incubacion:0},cabra:{metodo:'ordenar',incubacion:0},cerdito:{metodo:'buscar_trufas',incubacion:0},oveja:{metodo:'esquilar',incubacion:0},conejo:{metodo:'recoger',incubacion:0},
 gallina:{metodo:'recoger',incubacion:2,precioHuevo:45},pato:{metodo:'recoger',incubacion:3,precioHuevo:85},avestruz:{metodo:'recoger',incubacion:5,grande:true,precioHuevo:420},dinosaurio:{metodo:'recoger',incubacion:4,precioHuevo:700},
 unicornio:{metodo:'recoger',incubacion:0},dragon:{metodo:'recoger',incubacion:5,grande:true},grifo:{metodo:'recoger',incubacion:4,grande:true},
};
export const NUEVAS_ESPECIES=['cabra','pato','avestruz','dinosaurio'] as const;
export interface HuevoFertil {especie:Species;genoma:Genome;sexo:'hembra'|'macho'}
/** Genotipo y sexo forman la identidad apilable. Cofres, envíos y recargas no los pierden. */
export function articuloHuevo(especie:Species,genoma:Genome,sexo:'hembra'|'macho'){if(!GANADO[especie]?.incubacion)throw new Error('Esta especie no pone huevos fértiles.');const g=validarGenoma(genoma),codigo=(['A','B','F','E'] as const).map(l=>g[l].every(a=>a===l)?'0':g[l].every(a=>a===l.toLowerCase())?'2':'1').join('');return `huevo_fertil_${especie}_${codigo}${sexo==='hembra'?'0':'1'}`;}
export function leerHuevo(id:string):HuevoFertil|undefined{const m=/^huevo_fertil_([a-z]+)_([012]{4})([01])$/.exec(id);if(!m||!Object.hasOwn(GANADO,m[1])||!GANADO[m[1] as Species].incubacion)return;const pares=['A','B','F','E'].map((l,i)=>m[2][i]==='0'?l+l:m[2][i]==='1'?l+l.toLowerCase():l.toLowerCase().repeat(2));return {especie:m[1] as Species,genoma:crearGenoma(...pares as [string,string,string,string]),sexo:m[3]==='0'?'hembra':'macho'};}
export interface Incubadora {edificioId:string;grande:boolean;huevo:{articulo:string;calidad:0|1|2|3;nombre:string;dias:number;inicioDia:number}|null}
/** Coordenadas del corral, no del mundo: trasladarlo conserva sus hallazgos. */
export interface TrufaGanado {id:string;animalId:string;edificioId:string;u:number;v:number;cantidad:number;base:number;calidad:0|1|2|3}
export interface EstadoGanaderia {version:1;incubadoras:Incubadora[];trufas:TrufaGanado[]}
export const crearGanaderia=(refugioInicial?:string):EstadoGanaderia=>({version:1,incubadoras:refugioInicial?[{edificioId:refugioInicial,grande:false,huevo:null}]:[],trufas:[]});
export const COSTE_INCUBADORA={monedas:120,materiales:{madera:15,cobre:4,vidrio:2}};
export const COSTE_INCUBADORA_GRANDE={monedas:260,materiales:{madera:20,lingote_hierro:4,vidrio:4}};
export function especieDisponible(s:Pick<EstadoGranja,'desbloqueos'|'misionesCompletadas'|'habilidades'>,especie:Species){if(s.desbloqueos.includes('especie_'+especie))return true;return especie==='cabra'?s.misionesCompletadas.includes('huerta'):especie==='pato'?s.misionesCompletadas.includes('confianza'):especie==='avestruz'?s.desbloqueos.includes('mina')&&s.habilidades.reconocidos.agricultura>=3:especie==='dinosaurio'?s.desbloqueos.includes('mina')&&s.habilidades.reconocidos.mineria>=4:false;}
export function coordenadaRefugio(b:Pick<Edificio,'x'|'z'|'giro'>,u:number,v:number){const ang=-b.giro*Math.PI/2,c=Math.cos(ang),s=Math.sin(ang);return {x:b.x+(b.giro===1?8:b.giro===2?4:0)+u*c+v*s,z:b.z+(b.giro===2?8:b.giro===3?4:0)-u*s+v*c};}
export function posicionAnimal(s:Pick<EstadoGranja,'animales'|'edificios'|'interior'>,a:Animal,refugio?:Edificio){const b=refugio??s.edificios.find(b=>b.id===a.edificioId);if(!b)return {x:0,z:0};if(a.rutina)return s.interior===b.id?{x:(a.rutina.u-2)*2,z:(a.rutina.v-2)*2}:coordenadaRefugio(b,a.rutina.u,a.rutina.v);const i=s.animales.filter(x=>x.edificioId===a.edificioId).findIndex(x=>x.id===a.id);const p=s.interior===b.id?camaAnimal(i,capacidadRefugio(b)):esperaCorral(i,capacidadRefugio(b));return s.interior===b.id?{x:(p.u-2)*2,z:(p.v-2)*2}:coordenadaRefugio(b,p.u,p.v);}

export function posicionNido(s:Pick<EstadoGranja,'animales'|'edificios'>,a:Animal){const i=s.animales.filter(x=>x.edificioId===a.edificioId).findIndex(x=>x.id===a.id);const b=s.edificios.find(b=>b.id===a.edificioId)!,p=camaAnimal(i,capacidadRefugio(b));return {x:(p.u-2)*2+.4,z:(p.v-2)*2+.65};}
export function reservaRefugio(g:EstadoGanaderia,edificioId:string){return g.incubadoras.filter(i=>i.edificioId===edificioId&&i.huevo!==null).length;}
export function ganaderiaValida(v:unknown,s:Pick<EstadoGranja,'edificios'|'animales'|'jornada'>):v is EstadoGanaderia{
 if(!v||typeof v!=='object')return false;const g=v as EstadoGanaderia,entero=(v:unknown,a:number,b:number)=>Number.isSafeInteger(v)&&Number(v)>=a&&Number(v)<=b;
 if(g.version!==1||!Array.isArray(g.incubadoras)||g.incubadoras.length>240||!Array.isArray(g.trufas)||g.trufas.length>1200||s.animales.length+g.incubadoras.filter(i=>i?.huevo).length>240)return false;
 const edificios=new Set<string>();for(const i of g.incubadoras){const b=s.edificios.find(b=>b.id===i?.edificioId);if(!i||!b?.especie||!GANADO[b.especie]?.incubacion||edificios.has(i.edificioId)||typeof i.grande!=='boolean')return false;edificios.add(i.edificioId);if(i.huevo!==null){const h=i.huevo,e=leerHuevo(h?.articulo??'');if(!h||!e||e.especie!==b.especie||GANADO[e.especie].grande&&!i.grande||typeof h.nombre!=='string'||h.nombre.length>32||!entero(h.calidad,0,3)||!entero(h.dias,0,GANADO[e.especie].incubacion-1)||!entero(h.inicioDia,0,s.jornada.diasCompletados)||h.dias>s.jornada.diasCompletados-h.inicioDia)return false;}}
 const ids=new Set<string>();for(const t of g.trufas){if(!t||typeof t.id!=='string'||!/^[a-z0-9_]{1,99}$/.test(t.id)||ids.has(t.id)||!s.animales.some(a=>a.id===t.animalId&&a.especie==='cerdito'&&a.edificioId===t.edificioId)||!s.edificios.some(b=>b.id===t.edificioId)||!Number.isFinite(t.u)||t.u<.3||t.u>3.7||!Number.isFinite(t.v)||t.v<4.3||t.v>7.7||!entero(t.cantidad,1,6)||!entero(t.base,1,5)||t.base>t.cantidad||!entero(t.calidad,0,3))return false;ids.add(t.id);}return true;
}
