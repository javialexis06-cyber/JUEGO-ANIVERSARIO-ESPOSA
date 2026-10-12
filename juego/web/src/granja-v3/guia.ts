import type { Accion, EstadoGranja } from './estado';

/** Los primeros minutos de la granja (tanda 6 de los arreglos): llega Celia, se trabaja el primer surco, una carta
 * lleva al Pueblo del Sol, se conocen sus lugares, se acepta la primera historia y se duerme. Cada paso se ve en el
 * recuadro de misión y avanza solo cuando se cumple en el mundo; nada se acepta desde un menú. */
export interface EstadoGuia {paso:number;hechos:string[]}
export const CARTA_CAMPANA='carta_campana';
export const LUGARES_GUIA=['semillas','carpinteria','animales','gremio','museo'] as const;
const NOMBRE_LUGAR:Record<string,string>={semillas:'mercado',carpinteria:'carpintería',animales:'Casa de los Animales',gremio:'gremio',museo:'museo'};

interface PasoGuia {id:string;titulo:string;texto:string;progreso:(s:EstadoGranja,g:EstadoGuia)=>[number,number]}
const stat=(s:EstadoGranja,k:string)=>s.estadisticas[k]??0;
export const PASOS_GUIA:readonly PasoGuia[]=[
 {id:'prologo',titulo:'Llega Celia',texto:'Escucha a Celia en tu granja.',progreso:(_,g)=>[+g.hechos.includes('prologo'),1]},
 {id:'surco',titulo:'El primer surco',texto:'Con la azada, las semillas y la regadera de tu barra: labra, siembra y riega 3 casillas.',progreso:s=>[Math.min(3,stat(s,'labrar'))+Math.min(3,stat(s,'plantar'))+Math.min(3,stat(s,'regar')),9]},
 {id:'buzon',titulo:'Una carta en el buzón',texto:'Acércate al buzón junto a la cabaña y lee la carta que llegó del Pueblo del Sol.',progreso:s=>[+(s.correo.cartas.find(c=>c.id===CARTA_CAMPANA)?.leidaDia!=null),1]},
 {id:'pueblo',titulo:'Camino al Pueblo del Sol',texto:'Toma el camino de tierra hacia el Pueblo del Sol; los postes guía y tu mapa (M) te llevan.',progreso:s=>[+(s.zona==='pueblo'),1]},
 {id:'lugares',titulo:'Los lugares del pueblo',texto:'Entra al mercado, la carpintería, la Casa de los Animales, el Gremio de Aventureros y el Museo del Valle.',progreso:(_,g)=>[LUGARES_GUIA.filter(l=>g.hechos.includes('lugar_'+l)).length,LUGARES_GUIA.length]},
 {id:'campana',titulo:'La semilla que no despierta',texto:'Abre el Diario (menú ☰) y acepta en Campaña la primera historia del valle, aquí en el pueblo.',progreso:s=>[+!!(s.historia?.activas.P01||s.historia?.completadas.P01),1]},
 {id:'dormir',titulo:'Cerrar el primer día',texto:'Vuelve a tu cabaña y duerme en la cama: la noche guarda la jornada y hace crecer lo sembrado.',progreso:(_,g)=>[+g.hechos.includes('durmio'),1]},
];

export const crearGuia=():EstadoGuia=>({paso:0,hechos:[]});
/** Partidas que ya venían jugándose no repiten el inicio. */
export function guiaDePartida(s:EstadoGranja):EstadoGuia{const jugada=(s.jornada?.diasCompletados??0)>0||(s.misionesCompletadas?.length??0)>0;return jugada?{paso:PASOS_GUIA.length,hechos:['prologo']}:crearGuia();}
export function guiaValida(g:unknown):g is EstadoGuia{const v=g as EstadoGuia;return !!v&&typeof v==='object'&&Number.isInteger(v.paso)&&v.paso>=0&&v.paso<=PASOS_GUIA.length&&Array.isArray(v.hechos)&&v.hechos.length<=40&&v.hechos.every(h=>typeof h==='string'&&h.length<40)&&new Set(v.hechos).size===v.hechos.length;}
export const pasoGuia=(s:EstadoGranja)=>s.guia&&s.guia.paso<PASOS_GUIA.length?PASOS_GUIA[s.guia.paso]:null;

const anotar=(g:EstadoGuia,h:string)=>{if(!g.hechos.includes(h))g.hechos.push(h);};
/** Después de cada acción que salió bien: anota lo visto y avanza los pasos cumplidos (nunca retrocede). */
export function actualizarGuia(s:EstadoGranja,a?:Accion){
 const g=s.guia;if(!g)return;
 // Las primeras visitas se anotan siempre: quien atiende se presenta una sola vez
 if(s.zona==='pueblo'&&s.servicio)anotar(g,'lugar_'+s.servicio);
 if(g.paso>=PASOS_GUIA.length)return;
 if(a?.tipo==='guia')anotar(g,a.hecho);
 if(a?.tipo==='dormir'&&PASOS_GUIA[g.paso].id==='dormir')anotar(g,'durmio');
 for(;g.paso<PASOS_GUIA.length;g.paso++){
  const p=PASOS_GUIA[g.paso];
  // Al llegar al paso del buzón, la carta del pueblo ya está esperando (no hay que dormir para recibirla)
  if(p.id==='buzon'&&!s.correo.cartas.some(c=>c.id===CARTA_CAMPANA))s.correo.cartas.push({id:CARTA_CAMPANA,recibidaDia:s.jornada.diasCompletados,leidaDia:null,reclamadaDia:null});
  const [n,total]=p.progreso(s,g);if(n<total)break;
 }
}

/** Lo que dice Celia al llegar (un solo jugador lo escucha, pero les habla a los dos). */
export const PROLOGO_CELIA:readonly string[]=[
 'Por fin llegan. Soy Celia. Esta tierra nació de mis manos, y hoy se la confío a ustedes dos.',
 'Mientras yo dormía, la maleza cubrió la granja. Cada herramienta vive en tu barra de abajo: tócala o usa los números del 1 al 0.',
 'Lo que recojas va a tu mochila; ábrela con la E. El menú de las tres rayitas, o Escape, guarda tu diario, tus vecinos y tus habilidades.',
 'Empieza por un surco: labra, siembra y riega tres casillas. Luego revisa el buzón junto a la cabaña; el Pueblo del Sol tiene algo que contarte.',
 'Aura enciende cada mañana y Lara cuida cada noche. Yo estaré en cada brote. Bienvenidos a casa.',
];

/** Lo que cuenta quien atiende la primera vez que se entra a cada lugar del pueblo. */
export const PRESENTACIONES:Record<string,string>={
 semillas:'Aquí compras semillas según la estación y vendes lo que coseches. Mira cuántos días tarda cada cultivo antes de sembrarlo.',
 carpinteria:'Encárgame casas, refugios y muebles con madera y piedra; la cuadrilla avanza mientras duermes. También te ayudo a mover lo que ya está construido y a comprar terreno nuevo.',
 animales:'Aquí se adoptan gallinas, vacas, mascotas y caballos. Primero necesitas un refugio para ellos; después, cariño y alimento todos los días.',
 herreria:'Trae minerales de la mina y mejoro tus herramientas: trabajan más rápido y alcanzan materiales más duros.',
 clinica:'Si un animal enferma o se pone triste, tráelo a mi cuidado.',
 posada:'Una mesa caliente y un buen descanso devuelven las fuerzas.',
 archivo:'En este tablón aparecen los encargos de los vecinos, y en la biblioteca, los cuadernos del valle.',
 gremio:'Bienvenida, bienvenido al gremio. Este tablón muestra las expediciones: la mina, el bosque ancestral y las ruinas. Se inician en su lugar; aquí se planean. Lleva pico, espada y comida.',
 museo:'Este museo guarda la memoria del valle. Trae cosechas, peces y minerales para cerrar los lotes de cada estación; lo que dones queda expuesto en estas vitrinas.',
 altar_aura:'Este jardín es de Aura, la del fuego que despierta.',
 altar_lara:'Este jardín es de Lara, la que acompaña el descanso.',
};
export const nombreLugarGuia=(id:string)=>NOMBRE_LUGAR[id]??id;
