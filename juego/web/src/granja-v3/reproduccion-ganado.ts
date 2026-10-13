import { DIA, ESPECIES, FANTASIAS } from './catalogo';
import { capacidadRefugio } from './refugios';
import { estadoAnimal } from './cuidados';
import { fenotipo, probabilidades, validarGenoma, type Genome, type Species } from './genetica';
import type { Animal, Edificio, EstadoGranja } from './estado';

/** Duraciones del juego en jornadas cerradas, no días reales ni biología real. */
export const REPRODUCCION_GANADO = { vaca:4, cabra:3, oveja:3, cerdito:3, conejo:2 } as const;
type Mamifero = keyof typeof REPRODUCCION_GANADO;
type EstadoReproduccion = Pick<EstadoGranja,'animales'|'edificios'|'ganaderia'|'jornada'|'ultimoTiempo'>;
export interface CriaGestacion { genoma:Genome; sexo:'hembra'|'macho'; nombre:string; edificioId:string }
export interface GestacionGanado {
 version:1; inicioDia:number; inicioAt:number; ultimoDia:number; dias:number;
 padreId:string; genomaMadre:Genome; genomaPadre:Genome; cria:CriaGestacion;
}
export type PlanGestacion = {ok:true; madreId:string; padreId:string; genomaMadre:Genome; genomaPadre:Genome; destinos:Record<string,string>} | {ok:false; mensaje:string};
export const usaGestacion = (especie:Species):especie is Mamifero => Object.hasOwn(REPRODUCCION_GANADO,especie);
const entero = (v:unknown,min:number,max:number):v is number => Number.isSafeInteger(v)&&Number(v)>=min&&Number(v)<=max;
const id = (v:unknown):v is string => typeof v==='string'&&/^[a-z0-9_]{1,99}$/.test(v);
const clave = (g:Genome) => (['A','B','F','E'] as const).map(l=>[...g[l]].sort().join('')).join('');
const iguales = (a:Genome,b:Genome) => clave(a)===clave(b);
const copiar = (g:Genome) => validarGenoma(g);
const clima = (especie:Species,genoma:Genome) => {const f=fenotipo(especie,genoma).fantasia;return f?FANTASIAS[f]?.clima??'templado':'templado';};
const compatible = (b:Edificio,especie:Species,genoma:Genome) => b.especie===especie&&(clima(especie,genoma)==='templado'||b.clima===clima(especie,genoma));

/** Una gestación ocupa una plaza de la cría, adicional a la de su madre. */
export function plazasGestacion(s:Pick<EstadoGranja,'animales'>,edificioId?:string){
 return s.animales.filter(a=>a.gestacion&&(!edificioId||a.gestacion.cria.edificioId===edificioId)).length;
}
/** Usar en adopción, incubación, traslados, nuevos cruces y validación V5. */
export function plazasGanado(s:Pick<EstadoGranja,'animales'|'ganaderia'>,edificioId?:string){
 return s.animales.filter(a=>!edificioId||a.edificioId===edificioId).length+
  s.ganaderia.incubadoras.filter(i=>i.huevo&&(!edificioId||i.edificioId===edificioId)).length+plazasGestacion(s,edificioId);
}

/** No llama al azar ni cobra. Todas las posibilidades deben tener destino antes del cruce. */
export function planGestacion(s:EstadoReproduccion,madre:Animal,padre:Animal):PlanGestacion {
 const mal=(mensaje:string):PlanGestacion=>({ok:false,mensaje});
 if(!usaGestacion(madre.especie)||madre.sexo!=='hembra'||padre.sexo!=='macho'||madre.especie!==padre.especie||madre.id===padre.id||!s.animales.includes(madre)||!s.animales.includes(padre))return mal('Selecciona una hembra y un macho del mismo ganado.');
 if(madre.edificioId!==padre.edificioId)return mal('Reúne a los padres en el mismo refugio antes del cruce.');
 if(madre.gestacion!==undefined)return mal('Esta madre ya espera una cría.');
 if([madre,padre].some(a=>{const salud=estadoAnimal(a.cuidado,s.ultimoTiempo);return a.edadDias<Math.ceil(ESPECIES[a.especie].adultoMs/DIA)||!salud.puedeProducir||salud.triste;}))return mal('Ambos padres deben ser adultos, sanos, alimentados y atendidos.');
 if([madre,padre].some(a=>a.ultimoCruce!==null&&s.ultimoTiempo-a.ultimoCruce<DIA))return mal('Los padres necesitan descansar 24 horas reales entre crías.');
 if(plazasGanado(s)>=240)return mal('Tu granja ha alcanzado las 240 plazas, incluidas las crías reservadas.');
 const destinos:Record<string,string>={};
 for(const p of probabilidades(madre.genoma,padre.genoma)){
  const b=s.edificios.find(b=>compatible(b,madre.especie,p.genoma)&&plazasGanado(s,b.id)<capacidadRefugio(b));
  if(!b)return mal('Prepara plazas libres en todos los climas posibles del cuadro de Punnett.');
  destinos[clave(p.genoma)]=b.id;
 }
 return {ok:true,madreId:madre.id,padreId:padre.id,genomaMadre:copiar(madre.genoma),genomaPadre:copiar(padre.genoma),destinos};
}

/** Devuelve el registro sin tocar padres, inventario, XP ni RNG. El motor lo asigna al cobrar. */
export function iniciarGestacion(s:EstadoReproduccion,madre:Animal,padre:Animal,genoma:Genome,sexo:'hembra'|'macho',plan:PlanGestacion):GestacionGanado|undefined {
 if(!plan.ok||plan.madreId!==madre.id||plan.padreId!==padre.id||!iguales(plan.genomaMadre,madre.genoma)||!iguales(plan.genomaPadre,padre.genoma)||!['hembra','macho'].includes(sexo))return;
 const actual=planGestacion(s,madre,padre);if(!actual.ok)return;
 let genes:Genome;try{genes=copiar(genoma);}catch{return;}
 if(!heredable(genes,madre.genoma,padre.genoma))return;
 const edificioId=plan.destinos[clave(genes)],b=s.edificios.find(b=>b.id===edificioId);
 if(!b||!compatible(b,madre.especie,genes)||plazasGanado(s,b.id)>=capacidadRefugio(b))return;
 return {version:1,inicioDia:s.jornada.diasCompletados,inicioAt:s.ultimoTiempo,ultimoDia:s.jornada.diasCompletados,dias:0,padreId:padre.id,genomaMadre:copiar(madre.genoma),genomaPadre:copiar(padre.genoma),cria:{genoma:genes,sexo,nombre:`Cría de ${madre.nombre}`.slice(0,32),edificioId}};
}

const heredable = (h:Genome,m:Genome,p:Genome) => (['A','B','F','E'] as const).every(l=>m[l].includes(h[l][0])&&p[l].includes(h[l][1])||m[l].includes(h[l][1])&&p[l].includes(h[l][0]));
function genomaEstricto(v:unknown):v is Genome {
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==4)return false;
 try{validarGenoma(v as Genome);return true;}catch{return false;}
}

/** Campos presentes corruptos se rechazan; su ausencia conserva partidas anteriores. */
export function gestacionValida(v:unknown,s:EstadoReproduccion,madre:Animal):v is GestacionGanado|undefined {
 if(v===undefined)return true;
 if(!v||typeof v!=='object'||Array.isArray(v)||!usaGestacion(madre.especie)||madre.sexo!=='hembra')return false;
 const g=v as GestacionGanado,c=g.cria,d=s.jornada.diasCompletados;
 if(g.version!==1||!entero(g.inicioDia,0,d)||!entero(g.ultimoDia,g.inicioDia,d)||!entero(g.dias,0,REPRODUCCION_GANADO[madre.especie]-1)||g.dias>g.ultimoDia-g.inicioDia||g.ultimoDia!==d||!Number.isFinite(g.inicioAt)||g.inicioAt<0||g.inicioAt>s.ultimoTiempo||madre.ultimoCruce!==g.inicioAt||!id(g.padreId)||g.padreId===madre.id||!genomaEstricto(g.genomaMadre)||!genomaEstricto(g.genomaPadre)||!genomaEstricto(madre.genoma)||!iguales(g.genomaMadre,madre.genoma))return false;
 const padre=s.animales.find(a=>a.id===g.padreId);
 if(!padre||padre.sexo!=='macho'||padre.especie!==madre.especie||padre.ultimoCruce===null||padre.ultimoCruce<g.inicioAt||!genomaEstricto(padre.genoma)||!iguales(g.genomaPadre,padre.genoma))return false;
 if(!c||typeof c!=='object'||Array.isArray(c)||!genomaEstricto(c.genoma)||!heredable(c.genoma,g.genomaMadre,g.genomaPadre)||!['hembra','macho'].includes(c.sexo)||typeof c.nombre!=='string'||c.nombre.length===0||c.nombre.length>32||!id(c.edificioId))return false;
 const b=s.edificios.find(b=>b.id===c.edificioId);
 return !!b&&compatible(b,madre.especie,c.genoma);
}

export function gestacionesValidas(s:EstadoReproduccion){
 if(!s.animales.every(a=>gestacionValida(a.gestacion,s,a)))return false;
 if(plazasGanado(s)>240)return false;
 return s.edificios.every(b=>!b.especie||plazasGanado(s,b.id)<=capacidadRefugio(b));
}

export function resumenGestacion(a:Animal){
 if(!a.gestacion||!usaGestacion(a.especie))return null;
 return {dias:a.gestacion.dias,total:REPRODUCCION_GANADO[a.especie],pendientes:REPRODUCCION_GANADO[a.especie]-a.gestacion.dias,destino:a.gestacion.cria.edificioId};
}

/** Solo para dormir. La bebida se consulta en diaCerrado-1 antes de limpiar bebederos. */
export function avanzarGestaciones(s:EstadoReproduccion,diaCerrado:number,now:number,nacer:(madre:Animal,cria:CriaGestacion)=>void,puedeAvanzar:(madre:Animal)=>boolean){
 const resultado={avanzadas:0,pausadas:0,nacidas:0};
 if(!entero(diaCerrado,1,1_000_000)||diaCerrado!==s.jornada.diasCompletados+1||!Number.isFinite(now)||now<0||now<s.ultimoTiempo)return resultado;
 for(const madre of [...s.animales]){
  const g=madre.gestacion;if(!g||!usaGestacion(madre.especie)||g.ultimoDia>=diaCerrado||g.ultimoDia!==diaCerrado-1)continue;
  g.ultimoDia=diaCerrado;
  const salud=estadoAnimal(madre.cuidado,now);
  if(!salud.puedeProducir||salud.triste||!puedeAvanzar(madre)){resultado.pausadas++;continue;}
  if(g.dias+1<REPRODUCCION_GANADO[madre.especie]){g.dias++;resultado.avanzadas++;continue;}
  // Consumir la reserva antes del nacimiento evita contar dos veces la misma plaza.
  delete madre.gestacion;
  nacer(madre,{...g.cria,genoma:copiar(g.cria.genoma)});
  resultado.nacidas++;
 }
 return resultado;
}
