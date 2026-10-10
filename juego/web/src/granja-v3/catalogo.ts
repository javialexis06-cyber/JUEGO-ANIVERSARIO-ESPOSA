import type { Species } from './genetica';
import type { Tiempo } from './clima';
import { CULTIVOS_ADICIONALES } from './cultivos-datos';

export const HORA = 3_600_000;
export const DIA = 24 * HORA;
export type Clima = 'templado'|'volcanico'|'celeste'|'humedo'|'mineral'|'sombrio'|'polar';
export type Zona = 'granja'|'pueblo'|'bosque'|'lago'|'mina'|'bosque_ancestral';
export type Estacion = 'primavera'|'verano'|'otono'|'invierno';
export type Herramienta = 'mano'|'azada'|'regadera'|'hacha'|'pico'|'guadana'|'cana'|'espada';
export const HERRAMIENTAS: {id:Herramienta;nombre:string}[] = [
  ['mano','Mano'],['azada','Azada'],['regadera','Regadera'],['hacha','Hacha'],['pico','Pico'],['guadana','Guadaña'],['cana','Caña'],['espada','Espada'],
].map(([id,nombre])=>({id:id as Herramienta,nombre}));
export const CLIMAS: Record<Clima,string> = {templado:'Pradera templada',volcanico:'Calor volcánico',celeste:'Altura celeste',humedo:'Bosque húmedo',mineral:'Jardín mineral',sombrio:'Umbría',polar:'Escarcha'};
export const ESPECIES: Record<Species,{nombre:string;producto:string;adultoMs:number;periodoMs:number;precio:number;modelo:string}> = {
  cabra:{nombre:'Cabra',producto:'leche_cabra',adultoMs:3*DIA,periodoMs:12*HORA,precio:240,modelo:'cabra'},
  pato:{nombre:'Pato',producto:'huevo_pato',adultoMs:2*DIA,periodoMs:12*HORA,precio:140,modelo:'pato'},
  avestruz:{nombre:'Avestruz',producto:'huevo_avestruz',adultoMs:4*DIA,periodoMs:24*HORA,precio:700,modelo:'avestruz'},
  dinosaurio:{nombre:'Dinosaurio',producto:'huevo_dinosaurio',adultoMs:5*DIA,periodoMs:24*HORA,precio:1000,modelo:'dinosaurio'},
  vaca:{nombre:'Vaca',producto:'leche',adultoMs:2*DIA,periodoMs:8*HORA,precio:180,modelo:'vaca'},
  cerdito:{nombre:'Cerdito',producto:'trufa',adultoMs:DIA,periodoMs:10*HORA,precio:150,modelo:'cerdito'},
  gallina:{nombre:'Gallina',producto:'huevo',adultoMs:DIA,periodoMs:6*HORA,precio:65,modelo:'gallina'},
  conejo:{nombre:'Conejo',producto:'fibra_suave',adultoMs:DIA,periodoMs:12*HORA,precio:100,modelo:'conejo'},
  oveja:{nombre:'Oveja',producto:'lana',adultoMs:2*DIA,periodoMs:12*HORA,precio:165,modelo:'oveja'},
  unicornio:{nombre:'Unicornio',producto:'polvo_estelar',adultoMs:3*DIA,periodoMs:18*HORA,precio:750,modelo:'unicornio'},
  dragon:{nombre:'Dragón',producto:'escama_ignea',adultoMs:3*DIA,periodoMs:18*HORA,precio:900,modelo:'dragon'},
  grifo:{nombre:'Grifo',producto:'pluma_real',adultoMs:3*DIA,periodoMs:18*HORA,precio:850,modelo:'grifo'},
};
export const FANTASIAS:Record<string,{nombre:string;especie:Species;clima:Clima;aleloE:string}>={
  vaca_volcan:{nombre:'Vaca de volcán',especie:'vaca',clima:'volcanico',aleloE:'EE'},
  vaca_nube:{nombre:'Vaca de nube',especie:'vaca',clima:'celeste',aleloE:'ee'},
  cerdito_musgo:{nombre:'Cerdito de musgo',especie:'cerdito',clima:'humedo',aleloE:'EE'},
  cerdito_ambar:{nombre:'Cerdito de ámbar',especie:'cerdito',clima:'mineral',aleloE:'ee'},
  gallina_oscura:{nombre:'Gallina oscura',especie:'gallina',clima:'sombrio',aleloE:'EE'},
  gallina_aurora:{nombre:'Gallina de aurora',especie:'gallina',clima:'polar',aleloE:'ee'},
  conejo_lunar:{nombre:'Conejo lunar',especie:'conejo',clima:'celeste',aleloE:'EE'},
  conejo_escarcha:{nombre:'Conejo de escarcha',especie:'conejo',clima:'polar',aleloE:'ee'},
  oveja_cristal:{nombre:'Oveja de cristal',especie:'oveja',clima:'mineral',aleloE:'EE'},
  oveja_tormenta:{nombre:'Oveja de tormenta',especie:'oveja',clima:'celeste',aleloE:'ee'},
  unicornio:{nombre:'Unicornio',especie:'unicornio',clima:'celeste',aleloE:'EE'},
  dragon:{nombre:'Dragón',especie:'dragon',clima:'volcanico',aleloE:'EE'},
  grifo:{nombre:'Grifo',especie:'grifo',clima:'celeste',aleloE:'EE'},
};

export interface Sector {id:number;x:number;z:number;ancho:number;fondo:number;precio:number;clima:Clima}
// A breadth-first ordering makes each new group accessible from an owned neighbour.
const coordenadas:{col:number;fila:number}[]=[];
for(let fila=-2;fila<=3;fila++)for(let col=-2;col<=2;col++)coordenadas.push({col,fila});
coordenadas.sort((a,b)=>Math.abs(a.col)+Math.abs(a.fila)-Math.abs(b.col)-Math.abs(b.fila)||a.fila-b.fila||a.col-b.col);
export const SECTORES:Sector[]=coordenadas.map(({col,fila},id)=>({id,x:col*20-10,z:fila*16-8,ancho:20,fondo:16,precio:id===0?0:180+Math.floor(id/3)*90,clima: fila===-2?'polar':col===-2?'humedo':col===2?'mineral':'templado'}));
export function sectorDeCelda(x:number,z:number):Sector|undefined{return SECTORES.find(s=>x>=s.x&&x<s.x+s.ancho&&z>=s.z&&z<s.z+s.fondo)}
export function sonAdyacentes(a:Sector,b:Sector):boolean{return (Math.abs(a.x-b.x)===20&&a.z===b.z)||(Math.abs(a.z-b.z)===16&&a.x===b.x)}

export interface CultivoDef{dias?:number;rebroteDias?:number;forma?:'raiz'|'cabeza'|'hoja'|'vaina'|'cereal'|'flor'|'baya'|'fruto'|'cactus'|'hongo';color?:string;rebroteHoras?:number;enrejado?:boolean;cosecha?:'mano'|'guadana';cantidad?:number;fases?:number[];requiere?:string;id:string;nombre:string;modelo:string;semilla:string;producto:string;horas:number;estaciones:Estacion[];climas:Clima[];precio:number;valor:number}
export const CULTIVOS:CultivoDef[]=[
  {dias:6,id:'zanahoria',nombre:'Zanahoria',modelo:'zanahoria',semilla:'semilla_zanahoria',producto:'zanahoria',horas:6,estaciones:['primavera','otono'],climas:['templado','humedo'],precio:4,valor:12},
  {rebroteHoras:4,dias:11,id:'tomate',nombre:'Tomate',modelo:'tomate',semilla:'semilla_tomate',producto:'tomate',horas:12,estaciones:['primavera','verano'],climas:['templado'],precio:8,valor:24},
  {dias:4,id:'trigo',nombre:'Trigo',modelo:'trigo',semilla:'semilla_trigo',producto:'trigo',horas:8,estaciones:['primavera','verano','otono'],climas:['templado','mineral'],precio:5,valor:15},
  {dias:13,id:'calabaza',nombre:'Calabaza',modelo:'calabaza',semilla:'semilla_calabaza',producto:'calabaza',horas:72,estaciones:['otono'],climas:['templado','humedo'],precio:12,valor:40},
  {rebroteHoras:4,dias:8,id:'fresa',nombre:'Fresa',modelo:'fresa',semilla:'semilla_fresa',producto:'fresa',horas:10,estaciones:['primavera'],climas:['templado','humedo'],precio:9,valor:28},
  {rebroteHoras:8,dias:14,id:'maiz',nombre:'Maíz',modelo:'maiz',semilla:'semilla_maiz',producto:'maiz',horas:60,estaciones:['verano','otono'],climas:['templado','mineral'],precio:10,valor:32},
  {dias:9,id:'fresa_escarcha',nombre:'Fresa de escarcha',modelo:'fresa',semilla:'semilla_fresa_escarcha',producto:'fresa_escarcha',horas:72,estaciones:['invierno'],climas:['polar'],precio:18,valor:65},
  {dias:12,id:'tomate_fuego',nombre:'Tomate de fuego',modelo:'tomate',semilla:'semilla_tomate_fuego',producto:'tomate_fuego',horas:72,estaciones:['verano'],climas:['volcanico'],precio:20,valor:75},
  {dias:18,id:'calabaza_lunar',nombre:'Calabaza lunar',modelo:'calabaza',semilla:'semilla_calabaza_lunar',producto:'calabaza_lunar',horas:96,estaciones:['otono'],climas:['celeste','sombrio'],precio:25,valor:95},
];
CULTIVOS.push(...CULTIVOS_ADICIONALES);
export interface PezDef{tiempos?:Tiempo[];id:string;nombre:string;zonas:Zona[];estaciones:Estacion[];desde:number;hasta:number;cebo:string;rareza:number;valor:number}
const todas:Estacion[]=['primavera','verano','otono','invierno'];
export const PECES:PezDef[]=[
  ['carpa','Carpa','lago',todas,0,24,'lombriz',1,18],['perca','Perca','lago',todas,6,18,'lombriz',1,20],
  ['trucha','Trucha','bosque',['primavera','otono'],5,12,'lombriz',2,30],['bagre','Bagre','lago',['verano','otono'],18,5,'lombriz',3,45],
  ['lucio','Lucio','lago',['otono','invierno'],6,18,'pez_cebo',3,50],['sardina_lago','Sardina de lago','lago',['primavera','verano'],6,20,'lombriz',1,15],
  ['salmon','Salmón','bosque',['otono'],5,19,'pez_cebo',3,55],['anguila','Anguila','lago',['primavera','otono'],20,5,'lombriz',3,48],
  ['pez_sol','Pez sol','lago',['verano'],10,16,'lombriz',2,30],['esturion','Esturión','lago',['verano','invierno'],6,19,'pez_cebo',4,80],
  ['trucha_arcoiris','Trucha arcoíris','bosque',['verano'],6,19,'lombriz',2,38],['tenca','Tenca','lago',['primavera','verano'],4,10,'lombriz',2,28],
  ['pez_hielo','Pez de hielo','lago',['invierno'],0,24,'cebo_magico',4,95],['koi_lunar','Koi lunar','lago',todas,21,4,'cebo_magico',5,125],
  ['anguila_cristal','Anguila de cristal','mina',todas,0,24,'cebo_magico',4,110],['pez_lava','Pez de lava','mina',['verano'],12,18,'cebo_magico',5,140],
  ['carpa_ancestral','Carpa ancestral','bosque_ancestral',['primavera','otono'],5,9,'cebo_magico',5,150],['pez_aurora','Pez aurora','bosque_ancestral',['invierno'],20,3,'cebo_magico',5,160],
].map(row=>({id:row[0],nombre:row[1],zonas:[row[2]],estaciones:row[3],desde:row[4],hasta:row[5],cebo:row[6],rareza:row[7],valor:row[8]} as PezDef));

const TIEMPOS_PECES:Record<string,Tiempo[]>={bagre:['lluvia','tormenta'],anguila:['lluvia','tormenta'],pez_sol:['sol','brisa'],trucha_arcoiris:['sol','brisa'],pez_hielo:['nieve']};
for(const pez of PECES)if(TIEMPOS_PECES[pez.id])pez.tiempos=TIEMPOS_PECES[pez.id];

export interface Articulo {id:string;nombre:string;categoria:'refugio'|'casa'|'decoracion'|'suelo'|'valla'|'insumo';modelo:string;ancho:number;fondo:number;corral?:number;especie?:Species;clima:Clima;capacidad?:number;precio:number;receta:Record<string,number>;requiere?:string}
export const ARTICULOS:Articulo[]=[
 {id:'hogar_mascota',nombre:'Hogar y cuenco para mascota',categoria:'decoracion',modelo:'hogar_mascota',ancho:2,fondo:2,clima:'templado',precio:80,receta:{madera:10,fibra:4,piedra:2},requiere:'companeros'},
 {id:'establo',nombre:'Establo de caballos',categoria:'refugio',modelo:'establo',ancho:4,fondo:4,corral:4,clima:'templado',capacidad:1,precio:420,receta:{madera:40,piedra:16,hierro:4},requiere:'montura'},
 {id:'casa',nombre:'Cabaña principal',categoria:'casa',modelo:'casita_pueblo',ancho:6,fondo:5,clima:'templado',precio:650,receta:{madera:90,piedra:45}},
 ...Object.entries(ESPECIES).flatMap(([especie,data])=> (['templado','volcanico','celeste','humedo','mineral','sombrio','polar'] as Clima[]).map(clima=>({id:`refugio_${especie}_${clima}`,nombre:`${data.nombre}: ${CLIMAS[clima]}`,categoria:'refugio' as const,modelo:['gallina','pato','dinosaurio'].includes(especie)?'gallinero':especie==='conejo'?'casita_pueblo':'granero',ancho:4,fondo:4,corral:4,especie:especie as Species,clima,capacidad:6,precio:clima==='templado'?170:350,receta:(clima==='templado'?{madera:30,piedra:12}:{madera:35,piedra:20,cristal:5}) as Record<string,number>,requiere:`especie_${especie}`}))),
 ...[
 ['banco','Banco de jardín','banco',2,1,45,{madera:10}],['farol','Farol cálido','farol',1,1,60,{madera:6,cobre:2}],['pozo','Pozo de piedra','pozo',2,2,100,{piedra:20,madera:8}],
 ['fuente','Fuente del patio','fuente',3,3,160,{piedra:25,cobre:4}],['maceta','Flores en maceta','arbusto_flores',1,1,25,{fibra:5,piedra:2}],['paca','Paca de heno','paca_heno',1,1,25,{heno:6}],
 ['caja_envio','Caja de envíos','cajon',1,1,80,{madera:15,piedra:3}],['cajon','Cajón de cosecha','cajon',1,1,20,{madera:5}],['barril','Barril de roble','barril',1,1,40,{madera:8,cobre:1}],['letrero','Letrero de madera','letrero',1,1,25,{madera:5}],
 ['molino','Molino artesanal','molino',4,4,300,{madera:45,piedra:25,hierro:5}],['invernadero','Invernadero de cultivo','invernadero',5,4,450,{madera:30,cristal:15,hierro:5}],
 ['arbol_manzano','Manzano ornamental','manzano',2,2,85,{madera:10,fibra:5}],['arbol_limonero','Limonero ornamental','limonero',2,2,85,{madera:10,fibra:5}],
 ].map(([id,nombre,modelo,ancho,fondo,precio,receta])=>({id,nombre,modelo,ancho,fondo,precio,receta,categoria:'decoracion',clima:'templado'} as Articulo)),
 {id:'puente_ancestral',nombre:'Puente de madera ancestral',categoria:'decoracion',modelo:'puente_madera',ancho:2,fondo:4,clima:'templado',precio:350,receta:{madera_ancestral:16,hierro:4},requiere:'bosque_ancestral'},
 {id:'farol_cristal',nombre:'Farol de cristal',categoria:'decoracion',modelo:'farol',ancho:1,fondo:1,clima:'templado',precio:180,receta:{madera_ancestral:4,cristal:5}},
 {id:'jardin_lirios',nombre:'Jardín de lirios',categoria:'decoracion',modelo:'nenufar',ancho:2,fondo:2,clima:'templado',precio:120,receta:{piedra:15,cristal:3}},
 {id:'pergola_ancestral',nombre:'Pérgola ancestral florida',categoria:'decoracion',modelo:'pergola_ancestral',ancho:4,fondo:3,clima:'templado',precio:350,receta:{madera_ancestral:24,madera:12,fibra:10},requiere:'bosque_ancestral'},
 ...['piedra','madera','tierra','musgo'].map(tipo=>({id:`suelo_${tipo}`,nombre:`Camino de ${tipo}`,categoria:'suelo' as const,modelo:tipo==='madera'?'puente_madera':'sendero_piedra',ancho:1,fondo:1,clima:'templado' as const,precio:5,receta:{[tipo==='madera'?'madera':'piedra']:1}})),
 ...['madera','piedra','floral'].map(tipo=>({id:`valla_${tipo}`,nombre:`Valla de ${tipo}`,categoria:'valla' as const,modelo:'cerca',ancho:1,fondo:1,clima:'templado' as const,precio:8,receta:{[tipo==='piedra'?'piedra':'madera']:2}})),
 {id:'porton',nombre:'Portón de jardín',categoria:'valla',modelo:'porton',ancho:2,fondo:1,clima:'templado',precio:25,receta:{madera:6,cobre:1}},
 ...[['heno','Heno',3],['semilla_pasto','Semilla de pasto',4],['lombriz','Lombriz',2],['pez_cebo','Pez cebo',5],['cebo_magico','Cebo mágico',12]].map(([id,nombre,precio])=>({id,nombre,precio,modelo:'',categoria:'insumo',ancho:0,fondo:0,clima:'templado',receta:{}} as Articulo)),
 ...CULTIVOS.map(c=>({id:c.semilla,nombre:`Semillas: ${c.nombre}`,precio:c.precio,modelo:'',categoria:'insumo' as const,ancho:0,fondo:0,clima:'templado' as const,receta:{},requiere:c.requiere})),
];
export interface Mision{id:string;nombre:string;texto:string;requisitos:Record<string,number>;monedas:number;recursos?:Record<string,number>;desbloqueos:string[];fundador?:string;tokenCasa?:string}
export const MISIONES:Mision[]=[
 {id:'hogar',nombre:'Un hogar entre la maleza',texto:'Limpia 3 obstáculos con hacha, pico o guadaña.',requisitos:{limpiar:3},monedas:100,recursos:{semilla_zanahoria:6,heno:8},desbloqueos:['tienda','especie_conejo','companeros']},
 {id:'huerta',nombre:'El primer surco',texto:'Labra 4 casillas, planta 4 cultivos y riega 4 veces.',requisitos:{labrar:4,plantar:4,regar:4},monedas:160,recursos:{madera:15},desbloqueos:['especie_oveja','especie_cabra','mina','montura']},
 {id:'confianza',nombre:'Manos que cuidan',texto:'Alimenta y consiente a tus animales; crea una decoración.',requisitos:{alimentar:2,consentir:2,craftear:1},monedas:200,desbloqueos:['especie_cerdito','especie_vaca','especie_pato','crianza']},
 {id:'familia',nombre:'Una nueva familia',texto:'Cría tu primer animal y compra otro sector.',requisitos:{nacimientos:1,sectores_comprados:1},monedas:300,recursos:{cristal:15},desbloqueos:['fantasia','fundador_gallina_oscura'],fundador:'gallina_oscura'},
 ...['gallina_oscura','gallina_aurora','conejo_lunar','conejo_escarcha','cerdito_musgo','cerdito_ambar','oveja_cristal','oveja_tormenta','vaca_volcan','vaca_nube'].map((id,i,ids)=>({id:`crianza_${id}`,nombre:`Linaje: ${FANTASIAS[id].nombre}`,texto:`Consigue una cría ${FANTASIAS[id].nombre.toLowerCase()} en su hábitat ideal. Puedes adoptar dos fundadores de este linaje.`,requisitos:{[`nacimiento_${id}`]:1},monedas:300+i*50,recursos:{cristal:8},desbloqueos:i<ids.length-1?[`fundador_${ids[i+1]}`]:['especie_unicornio','fundador_unicornio','bosque_ancestral'],fundador:i<ids.length-1?ids[i+1]:'unicornio',tokenCasa:`casa_${id}`})),
 {id:'crianza_unicornio',nombre:'El jardín de las estrellas',texto:'Cría un unicornio y consigue 5 maderas ancestrales.',requisitos:{nacimiento_unicornio:1,madera_ancestral:5},monedas:850,desbloqueos:['especie_dragon','fundador_dragon'],fundador:'dragon',tokenCasa:'casa_unicornio'},
 {id:'crianza_dragon',nombre:'Un corazón de brasa',texto:'Cría un dragón y extrae 5 minerales de la mina.',requisitos:{nacimiento_dragon:1,mineral:5},monedas:1000,desbloqueos:['especie_grifo','fundador_grifo'],fundador:'grifo',tokenCasa:'casa_dragon'},
 {id:'crianza_grifo',nombre:'Guardianes del valle',texto:'Cría un grifo. Tu ayudante de cuidado queda disponible.',requisitos:{nacimiento_grifo:1},monedas:1200,desbloqueos:['ayudante'],tokenCasa:'casa_grifo'},
];
export const PRECIOS_VENTA:Record<string,number>={madera:2,piedra:2,fibra:2,heno:1,cobre:7,hierro:12,cristal:20,madera_ancestral:30,leche:18,huevo:8,trufa:25,lana:22,fibra_suave:18,polvo_estelar:65,escama_ignea:70,pluma_real:65,...Object.fromEntries(CULTIVOS.filter(c=>c.producto!=='fibra').map(c=>[c.producto,c.valor])),...Object.fromEntries(PECES.map(p=>[p.id,p.valor]))};
