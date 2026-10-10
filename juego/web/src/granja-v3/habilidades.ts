import type { Herramienta } from './catalogo';
import type { RecetaProduccion } from './objetos';

export const HABILIDADES=['agricultura','mineria','recoleccion','pesca','combate'] as const;
export type Habilidad=typeof HABILIDADES[number];
export const NOMBRES_HABILIDAD:Record<Habilidad,string>={agricultura:'Agricultura y ganadería',mineria:'Minería',recoleccion:'Recolección',pesca:'Pesca',combate:'Combate'};
export const UMBRALES=[0,100,380,770,1300,2150,3300,4800,6900,10000,15000] as const;
export interface EstadoHabilidades {version:1;experiencia:Record<Habilidad,number>;reconocidos:Record<Habilidad,number>;profesiones:Record<Habilidad,{nivel5:string|null;nivel10:string|null}>;recetasLegadas:string[]}
export interface Aprendizaje {habilidad:Habilidad;desde:number;hasta:number;recetas:string[]}
export interface GananciaExperiencia {habilidad:Habilidad;cantidad:number;antes:number;despues:number}
interface Efectos {calidadCultivo?:number;calidadAnimal?:number;productoExtra?:number;veterinario?:number;madera?:number;piedraExtra?:number;mineralExtra?:number;henoExtra?:number;semillaExtra?:number;precision?:number;calidadPez?:number;pecesExtra?:number;ataque?:number;defensa?:number;comida?:number;energia?:number}
export interface Profesion {id:string;habilidad:Habilidad;nivel:5|10;padre?:string;nombre:string;descripcion:string;efectos:Efectos}
const p=(habilidad:Habilidad,nivel:5|10,id:string,nombre:string,descripcion:string,efectos:Efectos,padre?:string):Profesion=>({habilidad,nivel,id,nombre,descripcion,efectos,...(padre?{padre}:{})});
export const PROFESIONES:Profesion[]=[
 p('agricultura',5,'sembrador','Sembradora','+8 puntos de probabilidad de cosecha de oro.',{calidadCultivo:.08}),
 p('agricultura',5,'ganadero','Ganadera','Los productos animales sanos se recogen con calidad plata.',{calidadAnimal:1}),
 p('agricultura',10,'horticultor','Horticultora','+12 puntos adicionales de probabilidad de cosecha de oro.',{calidadCultivo:.12},'sembrador'),
 p('agricultura',10,'manos_tierra','Manos de la tierra','La azada consume un 35% menos de energía.',{energia:.65},'sembrador'),
 p('agricultura',10,'criador','Criadora experta','Un producto adicional por recogida animal.',{productoExtra:1},'ganadero'),
 p('agricultura',10,'cuidador','Cuidadora del valle','Los productos sanos alcanzan calidad oro; veterinario a mitad de precio.',{calidadAnimal:1,veterinario:.5},'ganadero'),
 p('mineria',5,'minero','Mineradora','Una unidad adicional al romper un nodo con mineral.',{mineralExtra:1}),
 p('mineria',5,'cantero','Cantera','Dos piedras adicionales por roca destruida.',{piedraExtra:2}),
 p('mineria',10,'vetas','Exploradora de vetas','Otra unidad de mineral por nodo destruido.',{mineralExtra:1},'minero'),
 p('mineria',10,'pico_ligero','Pico ligero','El pico consume un 35% menos de energía.',{energia:.65},'minero'),
 p('mineria',10,'constructora','Constructora','Cuatro piedras adicionales por roca destruida.',{piedraExtra:4},'cantero'),
 p('mineria',10,'geologa','Geóloga resistente','+3 de defensa en combate.',{defensa:3},'cantero'),
 p('recoleccion',5,'lenador','Leñadora','25% más madera al derribar árboles.',{madera:.25}),
 p('recoleccion',5,'senderista','Senderista','La comida recupera 20% más energía y salud.',{comida:.2}),
 p('recoleccion',10,'silvicultora','Silvicultora','Otro 25% de madera al derribar árboles.',{madera:.25},'lenador'),
 p('recoleccion',10,'hacha_ligera','Hacha ligera','El hacha consume un 35% menos de energía.',{energia:.65},'lenador'),
 p('recoleccion',10,'pastora','Pastora de senderos','Dos henos adicionales al cortar maleza que produce heno.',{henoExtra:2},'senderista'),
 p('recoleccion',10,'semillero','Guardiana de semillas','Una semilla adicional al cortar maleza que contiene semillas.',{semillaExtra:1},'senderista'),
 p('pesca',5,'pescadora','Pescadora precisa','+6 puntos de precisión al recoger la línea.',{precision:.06}),
 p('pesca',5,'selectiva','Pescadora selectiva','Las capturas tienen al menos calidad plata.',{calidadPez:1}),
 p('pesca',10,'maestra_linea','Maestra de la línea','+12 puntos adicionales de precisión.',{precision:.12},'pescadora'),
 p('pesca',10,'cana_ligera','Caña ligera','Lanzar la caña consume un 35% menos de energía.',{energia:.65},'pescadora'),
 p('pesca',10,'perlas','Buscadora de perlas','Las capturas tienen al menos calidad oro.',{calidadPez:1},'selectiva'),
 p('pesca',10,'redes','Maestra de redes','Dos peces por captura exitosa; necesita espacio para ambos.',{pecesExtra:1},'selectiva'),
 p('combate',5,'luchadora','Luchadora','+3 de ataque.',{ataque:3}),
 p('combate',5,'guardiana','Guardiana','+2 de defensa.',{defensa:2}),
 p('combate',10,'vanguardia','Vanguardia','+7 de ataque adicional.',{ataque:7},'luchadora'),
 p('combate',10,'espadachina','Espadachina eficiente','La espada consume un 35% menos de energía.',{energia:.65},'luchadora'),
 p('combate',10,'bastion','Bastión','+4 de defensa adicional.',{defensa:4},'guardiana'),
 p('combate',10,'centinela','Centinela','+4 de ataque y +2 de defensa.',{ataque:4,defensa:2},'guardiana'),
];
export function crearHabilidades():EstadoHabilidades {return {version:1,experiencia:Object.fromEntries(HABILIDADES.map(h=>[h,0])) as Record<Habilidad,number>,reconocidos:Object.fromEntries(HABILIDADES.map(h=>[h,0])) as Record<Habilidad,number>,profesiones:Object.fromEntries(HABILIDADES.map(h=>[h,{nivel5:null,nivel10:null}])) as EstadoHabilidades['profesiones'],recetasLegadas:[]};}
export function nivelHabilidad(e:EstadoHabilidades,h:Habilidad){let n=0;while(n<10&&e.experiencia[h]>=UMBRALES[n+1])n++;return n;}
export function progresoHabilidad(e:EstadoHabilidades,h:Habilidad){const nivel=nivelHabilidad(e,h),xp=e.experiencia[h],inicio=UMBRALES[nivel],fin=UMBRALES[Math.min(10,nivel+1)];return {nivel,xp,inicio,fin,faltan:fin-xp,porcentaje:nivel===10?100:100*(xp-inicio)/(fin-inicio)};}
export function ganarExperiencia(e:EstadoHabilidades,h:Habilidad,cantidad:number){if(!Number.isSafeInteger(cantidad)||cantidad<=0)return;const antes=nivelHabilidad(e,h),xp=e.experiencia[h];e.experiencia[h]=Math.min(15000,xp+cantidad);return {habilidad:h,cantidad:e.experiencia[h]-xp,antes,despues:nivelHabilidad(e,h)};}
export function profesionesDisponibles(e:EstadoHabilidades,h:Habilidad){const v=e.profesiones[h];return PROFESIONES.filter(p=>p.habilidad===h&&e.reconocidos[h]>=p.nivel&&(p.nivel===5?v.nivel5===null:v.nivel5===p.padre&&v.nivel10===null));}
export function elegirProfesion(e:EstadoHabilidades,id:string):string|null {const p=PROFESIONES.find(p=>p.id===id);if(!p||!profesionesDisponibles(e,p.habilidad).some(o=>o.id===id))return 'Esta profesión aún no está disponible o ya elegiste otra rama.';e.profesiones[p.habilidad][p.nivel===5?'nivel5':'nivel10']=id;return null;}
export function efectosHabilidades(e:EstadoHabilidades):Efectos {const r:Efectos={};for(const h of HABILIDADES)for(const id of Object.values(e.profesiones[h])){const p=PROFESIONES.find(p=>p.id===id);if(p)for(const [k,v] of Object.entries(p.efectos)){const key=k as keyof Efectos;if(key==='energia')continue;r[key]=key==='veterinario'?(r[key]??1)*v:(r[key]??0)+v;}}return r;}
const habilidadHerramienta=(h:Herramienta):Habilidad|undefined=>({azada:'agricultura',regadera:'agricultura',pico:'mineria',hacha:'recoleccion',guadana:'recoleccion',cana:'pesca',espada:'combate'} as Partial<Record<Herramienta,Habilidad>>)[h];
export function costeHerramienta(e:EstadoHabilidades,h:Herramienta,base=1){const habilidad=habilidadHerramienta(h);if(!habilidad)return base;const v=e.profesiones[habilidad],ligeras:Record<string,Herramienta>={manos_tierra:'azada',pico_ligero:'pico',hacha_ligera:'hacha',cana_ligera:'cana',espadachina:'espada'},energia=v.nivel10&&ligeras[v.nivel10]===h?PROFESIONES.find(p=>p.id===v.nivel10)?.efectos.energia??1:1;return Math.round(Math.max(.2,base*(1-.04*nivelHabilidad(e,habilidad))*energia)*100)/100;}
export function mejorarBotin(e:EstadoHabilidades,botin:Record<string,number>,tipo:'arbol'|'maleza'|'roca'){const r={...botin},v=efectosHabilidades(e);if(tipo==='arbol')for(const id of Object.keys(r))if(id==='madera'||id.startsWith('madera_'))r[id]+=Math.floor(r[id]*(v.madera??0));if(tipo==='maleza'){if(r.heno)r.heno+=v.henoExtra??0;for(const id of Object.keys(r))if(id.startsWith('semilla_'))r[id]+=v.semillaExtra??0;}if(tipo==='roca'){if(r.piedra)r.piedra+=v.piedraExtra??0;const mineral=Object.keys(r).find(id=>id!=='piedra'&&id!=='arena');if(mineral)r[mineral]+=v.mineralExtra??0;}return r;}

/** Requisitos de aprendizaje adicionales a herramientas y descubrimientos. */
export function requisitoReceta(r:RecetaProduccion):{habilidad:Habilidad;nivel:number} {const id=r.salida.articulo;
 if(id.startsWith('aspersor_'))return {habilidad:'agricultura',nivel:id==='aspersor_cobre'?2:id==='aspersor_hierro'?5:9};
 if(id==='fertilizante_mejorado')return {habilidad:'agricultura',nivel:3};
 if(id==='cebo_refinado')return {habilidad:'pesca',nivel:2};
 if(id==='prensa'||id==='fermentador'||id==='telar')return {habilidad:'agricultura',nivel:id==='prensa'?2:4};
 if(id==='molino_artesanal')return {habilidad:'agricultura',nivel:1};
 if(id==='cofre_hierro'||id==='recicladora'||id==='bateria')return {habilidad:'recoleccion',nivel:3};
 return {habilidad:/^(espada|casco|pechera|botas)_/.test(id)?'combate':r.estacion==='cocina'?'recoleccion':id.startsWith('fertilizante')?'agricultura':'mineria',nivel:Math.min(10,r.nivel*2)};
}
export function recetaAprendida(e:EstadoHabilidades|undefined,r:RecetaProduccion){const req=requisitoReceta(r);return !e||e.recetasLegadas.includes(r.id)||e.reconocidos[req.habilidad]>=req.nivel;}
export function reconocerAprendizajes(e:EstadoHabilidades,recetas:RecetaProduccion[]):Aprendizaje[]{const r:Aprendizaje[]=[];for(const h of HABILIDADES){const desde=e.reconocidos[h],hasta=nivelHabilidad(e,h);if(hasta>desde){r.push({habilidad:h,desde,hasta,recetas:recetas.filter(x=>{const req=requisitoReceta(x);return req.habilidad===h&&req.nivel>desde&&req.nivel<=hasta&&!e.recetasLegadas.includes(x.id);}).map(x=>x.id)});e.reconocidos[h]=hasta;}}return r;}
export function habilidadesValidas(v:unknown,recetas:RecetaProduccion[]):v is EstadoHabilidades {if(!v||typeof v!=='object')return false;const e=v as EstadoHabilidades,registro=(x:unknown)=>!!x&&typeof x==='object'&&!Array.isArray(x),entero=(x:unknown,a:number,b:number)=>Number.isSafeInteger(x)&&Number(x)>=a&&Number(x)<=b;if(e.version!==1||!registro(e.experiencia)||!registro(e.reconocidos)||!registro(e.profesiones)||[e.experiencia,e.reconocidos,e.profesiones].some(r=>Object.keys(r).length!==5)||!Array.isArray(e.recetasLegadas)||e.recetasLegadas.length>recetas.length||new Set(e.recetasLegadas).size!==e.recetasLegadas.length||e.recetasLegadas.some(id=>!recetas.some(r=>r.id===id)))return false;
 return HABILIDADES.every(h=>{if(!entero(e.experiencia[h],0,15000)||!entero(e.reconocidos[h],0,nivelHabilidad(e,h)))return false;const v=e.profesiones[h];if(!registro(v)||Object.keys(v).length!==2)return false;const a=PROFESIONES.find(p=>p.id===v.nivel5&&p.habilidad===h&&p.nivel===5),b=PROFESIONES.find(p=>p.id===v.nivel10&&p.habilidad===h&&p.nivel===10);return (v.nivel5===null||!!a&&e.reconocidos[h]>=5)&&(v.nivel10===null||!!b&&e.reconocidos[h]>=10&&b.padre===a?.id);});
}
export function aprendizajesValidos(v:unknown,recetas:RecetaProduccion[]):v is Aprendizaje[]{return Array.isArray(v)&&v.length<=5&&new Set(v.map(a=>a?.habilidad)).size===v.length&&v.every(a=>a&&HABILIDADES.includes(a.habilidad)&&Number.isInteger(a.desde)&&a.desde>=0&&Number.isInteger(a.hasta)&&a.hasta>a.desde&&a.hasta<=10&&Array.isArray(a.recetas)&&a.recetas.length<=recetas.length&&new Set(a.recetas).size===a.recetas.length&&a.recetas.every((id:unknown)=>recetas.some(r=>r.id===id&&requisitoReceta(r).habilidad===a.habilidad&&requisitoReceta(r).nivel>a.desde&&requisitoReceta(r).nivel<=a.hasta)));}
