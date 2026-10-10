import { dormitorioDef, horaDormitorio } from './dormitorios';
import { viviendaDe, viviendaInterior, posicionResidente, NPCS_PUEBLO, EDIFICIOS_PUEBLO, librePueblo, type ServicioPueblo } from './pueblo-datos';
import { obtenerObjeto } from './objetos';
import { calidadPila, resumirCasillas } from './inventario';
import type { EstadoGranja } from './estado';

export type IdAldeano=typeof NPCS_PUEBLO[number]['id'];
export type Gusto='encanta'|'gusta'|'neutral'|'desagrada';
export interface RelacionAldeano {id:IdAldeano;conocido:boolean;amistad:number;ultimaCharla:number|null;semanaRegalos:number;diasRegalos:number[];gustosDescubiertos:Record<string,Gusto>}
export interface EstadoPueblo {version:1;relaciones:RelacionAldeano[]}
export interface Conversacion {id:IdAldeano;texto:string;puntos:number;gusto?:Gusto;primeraCharla:boolean}
export interface PuntoPueblo {x:number;z:number}
export interface UbicacionAldeano extends PuntoPueblo {visible:boolean;andando:boolean;direccion:number;paso:number;actividad:'hogar'|'oficio'|'paseo'|'plaza';lugar:string}
export const DIAS_SEMANA=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'] as const;
/** Reparto funcional provisional. No fija nombres propios ni acontecimientos del lore. */
export const VIDA_PUEBLO:Record<IdAldeano,{abre:number;cierra:number;descanso:number|null;plaza:PuntoPueblo;encanta:string[];gusta:string[];desagrada:string[];dialogos:string[];labor?:string}>={
 mercader:{abre:540,cierra:1020,descanso:1,plaza:{x:79,z:-3},encanta:['mermelada_fresa','fresa'],gusta:['zanahoria','pan','manzana'],desagrada:['carbon','piedra'],dialogos:['Siempre guardo algunas semillas para la próxima estación. Una cosecha termina y otra empieza.','Si haces espacio en tu mochila antes de salir, podrás traer algo inesperado del camino.']},
 cuidadora:{abre:480,cierra:960,descanso:4,plaza:{x:73,z:10},encanta:['huevo','lana'],gusta:['heno','manzana','pan'],desagrada:['carbon','cobre'],dialogos:['No basta con un refugio bonito: deja pasto y alimento para quienes viven en él.','Me gusta ver crecer a cada cría. Un poco de cariño también forma parte de la rutina.']},
 carpintera:{abre:540,cierra:1020,descanso:2,plaza:{x:89,z:-5},encanta:['madera_ancestral','tela'],gusta:['madera','resina','cafe'],desagrada:['carbon','fibra'],dialogos:['Una entrada despejada vale tanto como unas buenas paredes. Piensa en el camino antes de colocar el edificio.','La cuadrilla tiene su ritmo. Prepara los materiales y el terreno; cada noche acerca la obra a su final.']},
 herrero:{abre:540,cierra:960,descanso:5,plaza:{x:94,z:6},encanta:['guiso_minero','oro'],gusta:['hierro','cobre','cafe'],desagrada:['heno','fibra'],dialogos:['Una herramienta bien cuidada puede acompañarte durante años.','Trae minerales cuando quieras mejorar el equipo. Yo me encargo de la forja.']},
 veterinaria:{abre:480,cierra:1080,descanso:null,plaza:{x:79,z:-10},encanta:['ensalada','manzana'],gusta:['pan','zanahoria','tela'],desagrada:['carbon','piedra'],dialogos:['Si un animal deja de comer o de producir, revisa primero cómo se siente.','La alimentación y el cariño son cuidados distintos. Intenta hacer tiempo para ambos.']},
 posadera:{abre:600,cierra:1320,descanso:null,plaza:{x:86,z:11},encanta:['pastel_calabaza','trucha_asada'],gusta:['pan','cafe','harina'],desagrada:['carbon','piedra'],dialogos:['Una pausa junto a la mesa ayuda a recuperar fuerzas.','Cada persona trae una historia al pueblo. A veces solo hace falta sentarse y escuchar.']},
 archivero:{abre:600,cierra:1080,descanso:6,plaza:{x:82,z:13},encanta:['cristal','cafe'],gusta:['resina','pan','tela'],desagrada:['carbon','heno'],dialogos:['Anota lo que descubras. El diario sirve para recordar qué queda por hacer.','La memoria del valle se escribe poco a poco. Todavía quedan muchas páginas vacías.']},
 canalizadora_aura:{abre:420,cierra:1140,descanso:null,plaza:{x:72,z:-14},encanta:['fresa','manzana'],gusta:['pan','resina'],desagrada:['carbon','piedra'],dialogos:['Este jardín está dedicado a Aura. Cuida sus brotes mientras el valle encuentra su historia.','Las ofrendas tendrán su lugar aquí. Sus ritos aún están por definirse.']},
 canalizadora_lara:{abre:420,cierra:1140,descanso:null,plaza:{x:87,z:-16},encanta:['cristal','tela'],gusta:['pan','resina'],desagrada:['carbon','cobre'],dialogos:['Este jardín está dedicado a Lara. Puedes detenerte un momento junto a las flores.','El altar conserva un espacio para los ritos que todavía están por contarse.']},
 pescadora:{abre:420,cierra:960,descanso:2,plaza:{x:93,z:25},labor:'Preparando aparejos junto al arroyo',encanta:['trucha_asada'],gusta:['pan','cuerda'],desagrada:['carbon'],dialogos:['No todos los peces salen a la misma hora. Mira el cielo y la estación antes de preparar la caña.','Hay días en que solo quiero escuchar el agua.']},
 minero:{abre:540,cierra:1020,descanso:6,plaza:{x:97,z:11},labor:'Revisando provisiones para la mina',encanta:['guiso_minero'],gusta:['cafe','hierro'],desagrada:['heno'],dialogos:['Para bajar a la mina llevo comida, un buen pico y algo con qué defenderme.','Un mineral raro no compensa volver sin fuerzas. Saber retirarse también cuenta.']},
 exploradora:{abre:480,cierra:1020,descanso:3,plaza:{x:75,z:-4},labor:'Estudiando los caminos del valle',encanta:['cafe'],gusta:['pan','manzana'],desagrada:['piedra'],dialogos:['Me gusta encontrar caminos nuevos. Cada zona tiene algo que la hace distinta.','Antes de partir reviso herramientas y provisiones.']},
 cocinero:{abre:660,cierra:1260,descanso:1,plaza:{x:86,z:23},labor:'Preparando la cocina del molino',encanta:['pastel_calabaza'],gusta:['harina','azucar','pan'],desagrada:['carbon'],dialogos:['Los ingredientes de temporada dan ganas de probar una receta nueva.','Nada alegra tanto una mesa como compartir lo que has preparado.']},
 botanica:{abre:540,cierra:1020,descanso:4,plaza:{x:80,z:-14},labor:'Observando las plantas del jardín',encanta:['resina'],gusta:['manzana','fibra'],desagrada:['cobre'],dialogos:['Deja espacio alrededor de un frutal joven. Sus raíces también necesitan crecer.','Una planta madura puede quedarse en el jardín si prefieres disfrutar de su aspecto.']},
 agricultor:{abre:420,cierra:960,descanso:5,plaza:{x:73,z:-1},labor:'Revisando semillas y terreno',encanta:['zanahoria'],gusta:['pan','manzana'],desagrada:['carbon'],dialogos:['La azada prepara el terreno, pero el agua es la que mantiene el cultivo en marcha.','Siempre miro cuántos días quedan de temporada antes de elegir semillas.']},
 maestra:{abre:540,cierra:900,descanso:6,plaza:{x:82,z:24},labor:'Preparando lecciones del valle',encanta:['cafe'],gusta:['pan','manzana'],desagrada:['carbon'],dialogos:['Me gusta que las preguntas nos hagan mirar el valle con otros ojos.','Aprender un oficio lleva práctica. Cada pequeño trabajo deja una enseñanza.']},
 musica:{abre:720,cierra:1200,descanso:0,plaza:{x:90,z:6},labor:'Ensayando junto a la fuente',encanta:['tela'],gusta:['pan','resina'],desagrada:['piedra'],dialogos:['La fuente tiene su propio ritmo. A veces empiezo una melodía escuchándola.','La música puede hacer más amable una tarde de trabajo.']},
 guardabosques:{abre:480,cierra:1020,descanso:1,plaza:{x:72,z:-8},labor:'Preparando su ronda del bosque',encanta:['madera_ancestral'],gusta:['resina','manzana'],desagrada:['carbon'],dialogos:['El bosque tiene caminos tranquilos y otros que conviene recorrer con cuidado.','Recolectar también significa dejar sitio para que el paisaje se renueve.']},
 artesana:{abre:600,cierra:1080,descanso:3,plaza:{x:88,z:-4},labor:'Preparando tejidos y adornos',encanta:['tela','lana'],gusta:['resina','madera'],desagrada:['carbon'],dialogos:['Una granja empieza a parecer un hogar cuando la decoras a tu manera.','Me gusta combinar madera, piedra y telas. Los materiales cuentan parte de la historia.']},
 astronoma:{abre:900,cierra:1320,descanso:4,plaza:{x:89,z:-19},labor:'Observando el cielo del valle',encanta:['cristal'],gusta:['cafe','vidrio'],desagrada:['heno'],dialogos:['Todavía nos queda mucho por aprender sobre las luces del cielo.','Me gustaría que algún día pudiéramos mirar el valle desde muy lejos.']},
 veterano:{abre:480,cierra:960,descanso:null,plaza:{x:78,z:5},labor:'Cuidando los rincones de la plaza',encanta:['pan'],gusta:['manzana','tela'],desagrada:['carbon'],dialogos:['Un pueblo se reconoce por la gente que se saluda al cruzar la plaza.','Las cosas pequeñas también merecen atención: un banco, una sombra, una conversación.']},
 nina:{abre:540,cierra:900,descanso:5,plaza:{x:74,z:9},labor:'Aprendiendo los oficios del valle',encanta:['mermelada_fresa'],gusta:['fresa','pan'],desagrada:['piedra'],dialogos:['Estoy aprendiendo a reconocer las semillas. Algunas parecen casi iguales.','Quiero ver cómo cambia el valle con cada estación.']},
 nino:{abre:540,cierra:900,descanso:6,plaza:{x:90,z:10},labor:'Dibujando mapas y criaturas',encanta:['manzana'],gusta:['pan','cristal'],desagrada:['carbon'],dialogos:['Dibujé un mapa, pero seguro que todavía faltan muchos lugares.','¿Cómo será un dragón cuando apenas acaba de nacer?']},
 viajera:{abre:600,cierra:1140,descanso:0,plaza:{x:82,z:-6},labor:'Recorriendo los puestos del pueblo',encanta:['cafe'],gusta:['pan','tela'],desagrada:['piedra'],dialogos:['Siempre encuentro algo distinto cuando me detengo a hablar con alguien.','Los mejores recuerdos de un viaje suelen ser sus habitantes.']},
};
export const aldeanoDef=(id:string)=>NPCS_PUEBLO.find(n=>n.id===id);
export const horaPueblo=(minutos:number)=>`${String(Math.floor(minutos/60)%24).padStart(2,'0')}:${String(Math.floor(minutos%60)).padStart(2,'0')}`;
export function crearPuebloEstado():EstadoPueblo{return {version:1,relaciones:NPCS_PUEBLO.map(n=>({id:n.id,conocido:false,amistad:0,ultimaCharla:null,semanaRegalos:0,diasRegalos:[],gustosDescubiertos:{}}))};}
export function atencionServicio(servicio:ServicioPueblo,dia:number,minutos:number){
 const n=NPCS_PUEBLO.find(n=>n.oficio===servicio)!;const h=VIDA_PUEBLO[n.id],descanso=dia%7===h.descanso,abierto=!descanso&&minutos>=h.abre&&minutos<h.cierra;
 const horario=`${horaPueblo(h.abre)}–${horaPueblo(h.cierra)}`;
 return {npc:n.id,abierto,descanso,horario,mensaje:abierto?'Abierto':descanso?`Hoy es día de descanso. Horario habitual: ${horario}.`:`Cerrado. Horario: ${horario}.`};
}

// Rutas de medio metro sobre las mismas colisiones que usa el jugador. Se calculan una vez;
// después las posiciones dependen solo de los minutos de la jornada guardada.
const X0=54,Z0=-42,NX=113,NZ=171,RADIO=.27,rutas=new Map<string,PuntoPueblo[]>();
let libres:Uint8Array|undefined;
function malla(){if(!libres){libres=new Uint8Array(NX*NZ);for(let z=0;z<NZ;z++)for(let x=0;x<NX;x++)libres[z*NX+x]=+librePueblo(X0+x*.5,Z0+z*.5,RADIO);}return libres;}
export function segmentoPuebloLibre(a:PuntoPueblo,b:PuntoPueblo){const d=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(d/.1));for(let i=0;i<=n;i++)if(!librePueblo(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n,RADIO))return false;return true;}
const punto=(i:number):PuntoPueblo=>({x:X0+i%NX*.5,z:Z0+Math.floor(i/NX)*.5});
function nodo(p:PuntoPueblo){const cx=Math.round((p.x-X0)*2),cz=Math.round((p.z-Z0)*2),opciones:{i:number;d:number}[]=[];for(let z=cz-2;z<=cz+2;z++)for(let x=cx-2;x<=cx+2;x++){const i=z*NX+x;if(x<0||x>=NX||z<0||z>=NZ||!malla()[i])continue;const q=punto(i);if(segmentoPuebloLibre(p,q))opciones.push({i,d:Math.hypot(q.x-p.x,q.z-p.z)});}return opciones.sort((a,b)=>a.d-b.d)[0]?.i;}
export function rutaPueblo(a:PuntoPueblo,b:PuntoPueblo):readonly PuntoPueblo[]{
 const key=`${a.x},${a.z}:${b.x},${b.z}`;const guardada=rutas.get(key);if(guardada)return guardada;
 const inicio=nodo(a),fin=nodo(b);if(inicio===undefined||fin===undefined)return [];
 const padres=new Int32Array(NX*NZ).fill(-2),cola=[inicio];padres[inicio]=-1;let cabeza=0;
 while(cabeza<cola.length&&padres[fin]===-2){const i=cola[cabeza++],x=i%NX,z=Math.floor(i/NX);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,zz=z+dz,j=zz*NX+xx;if(xx<0||xx>=NX||zz<0||zz>=NZ||padres[j]!==-2||!malla()[j]||!segmentoPuebloLibre(punto(i),punto(j)))continue;padres[j]=i;cola.push(j);}}
 if(padres[fin]===-2)return [];
 const camino:PuntoPueblo[]=[];for(let i=fin;i!==-1;i=padres[i])camino.push(punto(i));camino.reverse();camino.unshift({...a});camino.push({...b});
 const corto=[camino[0]];let i=0;while(i<camino.length-1){let j=camino.length-1;while(j>i+1&&!segmentoPuebloLibre(camino[i],camino[j]))j--;corto.push(camino[j]);i=j;}
 if(rutas.size>=128)rutas.clear();rutas.set(key,corto);return corto;
}
function trayecto(a:PuntoPueblo,b:PuntoPueblo,t:number,lugar:string):UbicacionAldeano{
 const ruta=rutaPueblo(a,b);if(!ruta.length)return {...a,visible:true,andando:false,direccion:0,paso:0,actividad:'paseo',lugar:'Esperando un paso libre'};
 const tramos=ruta.slice(1).map((p,i)=>Math.hypot(p.x-ruta[i].x,p.z-ruta[i].z)),total=tramos.reduce((n,d)=>n+d,0);let resto=Math.max(0,Math.min(1,t))*total;
 for(let i=0;i<tramos.length;i++){const d=tramos[i];if(resto<=d||i===tramos.length-1){const f=d?resto/d:0,p=ruta[i],q=ruta[i+1];return {x:p.x+(q.x-p.x)*f,z:p.z+(q.z-p.z)*f,visible:true,andando:total>.05,direccion:Math.atan2(q.x-p.x,q.z-p.z),paso:t*total,actividad:'paseo',lugar};}resto-=d;}
 return {...b,visible:true,andando:false,direccion:0,paso:0,actividad:'plaza',lugar};
}
export function ubicacionAldeano(id:string,dia:number,minutos:number,resguardado=false):UbicacionAldeano|null{
 const n=aldeanoDef(id);if(!n)return null;const h=VIDA_PUEBLO[n.id],ed=EDIFICIOS_PUEBLO.find(e=>e.id===n.edificio)!,puerta=viviendaDe(id)?.entrada??ed.entrada,trabajo={x:n.x,z:n.z},plaza=h.plaza;
 const quieto=(p:PuntoPueblo,actividad:UbicacionAldeano['actividad'],lugar:string,visible=true):UbicacionAldeano=>({...p,actividad,lugar,visible,andando:false,direccion:0,paso:0});
 const hogar=()=>quieto(puerta,'hogar','Dentro de '+(viviendaDe(id)?.nombre??ed.nombre),false);
 if(dia%7===h.descanso){if(resguardado||minutos<480||minutos>=1110)return hogar();if(minutos<510)return trayecto(puerta,plaza,(minutos-480)/30,'Camino a la plaza');if(minutos<1080)return quieto(plaza,'plaza','Descansando en el pueblo');return trayecto(plaza,puerta,(minutos-1080)/30,'Regresando a '+ed.nombre);}
 if(minutos<h.abre-90)return hogar();
 if(resguardado){if(minutos<h.abre-30)return hogar();if(minutos<h.abre)return trayecto(puerta,trabajo,(minutos-h.abre+30)/30,'Camino a '+ed.nombre);if(minutos<h.cierra)return quieto(trabajo,'oficio',h.labor??ed.nombre);if(minutos<h.cierra+30)return trayecto(trabajo,puerta,(minutos-h.cierra)/30,'Buscando refugio');return hogar();}
 if(minutos<h.abre-60)return trayecto(puerta,plaza,(minutos-h.abre+90)/30,'Paseo de la mañana');
 if(minutos<h.abre-30)return quieto(plaza,'plaza','Paseando por el pueblo');
 if(minutos<h.abre)return trayecto(plaza,trabajo,(minutos-h.abre+30)/30,'Camino a '+ed.nombre);
 if(minutos<h.cierra)return quieto(trabajo,'oficio',h.labor??ed.nombre);
 if(h.cierra>=1260){if(minutos<h.cierra+30)return trayecto(trabajo,puerta,(minutos-h.cierra)/30,'Regresando a '+ed.nombre);return hogar();}
 if(minutos<h.cierra+30)return trayecto(trabajo,plaza,(minutos-h.cierra)/30,'Camino a la plaza');
 if(minutos<h.cierra+90)return quieto(plaza,'plaza','Descansando en el pueblo');
 if(minutos<h.cierra+120)return trayecto(plaza,puerta,(minutos-h.cierra-90)/30,'Regresando a '+ed.nombre);
 return hogar();
}
export function gustoRegalo(id:IdAldeano,articulo:string):Gusto{const h=VIDA_PUEBLO[id];return h.encanta.includes(articulo)?'encanta':h.gusta.includes(articulo)?'gusta':h.desagrada.includes(articulo)?'desagrada':'neutral';}
export function esRegalo(articulo:string){const o=obtenerObjeto(articulo);return !!o&&!articulo.startsWith('huevo_fertil_')&&['recurso','mineral','lingote','comida','pez','producto'].includes(o.categoria);}
export function puedeConversar(s:EstadoGranja,id:string,x:number,z:number,resguardado=false){
 const n=aldeanoDef(id);if(!n||s.zona!=='pueblo'||s.aventura.destinoActual||s.jornada.resumenPendiente)return false;
 if(s.interior){const v=viviendaInterior(s.interior),u=ubicacionAldeano(id,s.jornada.diasCompletados,s.jornada.minutos,resguardado),d=dormitorioDef(s.interior),p=d?{x:0,z:0}:posicionResidente(id);return (!d||d.id===id)&&(!d?!horaDormitorio(s.jornada.minutos):horaDormitorio(s.jornada.minutos))&&!!v&&v.ocupantes.includes(id)&&u?.actividad==='hogar'&&s.jornada.minutos>=480&&s.jornada.minutos<1260&&Number.isFinite(x)&&Number.isFinite(z)&&Math.hypot(x-p.x,z-p.z)<=2.4;}
 if(s.servicio)return n.oficio!==null&&s.servicio===n.oficio&&atencionServicio(n.oficio,s.jornada.diasCompletados,s.jornada.minutos).abierto;
 const u=ubicacionAldeano(id,s.jornada.diasCompletados,s.jornada.minutos,resguardado);
 return Number.isFinite(x)&&Number.isFinite(z)&&!!u?.visible&&Math.hypot(x-u.x,z-u.z)<=2.4&&segmentoPuebloLibre({x,z},u);
}
export function conversar(s:EstadoGranja,id:string,x:number,z:number,resguardado=false,casilla?:number):{ok:boolean;mensaje:string;conversacion?:Conversacion}{
 const n=aldeanoDef(id);if(!n||!puedeConversar(s,id,x,z,resguardado))return {ok:false,mensaje:'Acércate a ese habitante cuando esté en el pueblo o atendiendo su local.'};
 const r=s.pueblo.relaciones.find(r=>r.id===id)!,dia=s.jornada.diasCompletados,primeraCharla=!r.conocido;let puntos=0,texto:string,gusto:Gusto|undefined;
 if(casilla!==undefined){
  if(!Number.isInteger(casilla)||casilla<0||casilla>=s.casillasInventario.length)return {ok:false,mensaje:'Elige una casilla válida de tu mochila.'};
  const pila=s.casillasInventario[casilla];if(!pila||!esRegalo(pila.articulo))return {ok:false,mensaje:'Ese objeto no se puede regalar. Conserva tus herramientas, planos y huevos fértiles.'};
  const semana=Math.floor(dia/7),dias=r.semanaRegalos===semana?r.diasRegalos:[];
  if(dias.includes(dia))return {ok:false,mensaje:'Ya recibió un regalo en esta jornada.'};if(dias.length>=2)return {ok:false,mensaje:'Ya recibió dos regalos esta semana. La siguiente semana comienza después de siete jornadas.'};
  gusto=gustoRegalo(n.id,pila.articulo);puntos={encanta:80,gusta:45,neutral:15,desagrada:-35}[gusto];if(puntos>0)puntos=Math.round(puntos*[1,1.1,1.25,1.5][calidadPila(pila)]);
  const articulo=pila.articulo;pila.cantidad--;if(!pila.cantidad)s.casillasInventario[casilla]=null;s.inventario=resumirCasillas(s.casillasInventario);
  r.semanaRegalos=semana;r.diasRegalos=[...dias,dia];r.gustosDescubiertos[articulo]=gusto;
  texto={encanta:'¡Es uno de mis favoritos! Gracias por acordarte de mí.',gusta:'Me gusta mucho. Gracias por este detalle.',neutral:'Gracias por el regalo.',desagrada:'Agradezco el gesto, pero prefiero otras cosas.'}[gusto];
 }else{
  const h=VIDA_PUEBLO[n.id];texto=h.dialogos[(dia+Math.floor(r.amistad/250))%h.dialogos.length];
  if(resguardado)texto='Con este tiempo prefiero quedarme cerca del local. '+texto;
  if(r.ultimaCharla!==dia){puntos=20;r.ultimaCharla=dia;}
 }
 const antes=r.amistad;r.amistad=Math.max(0,Math.min(2500,r.amistad+puntos));puntos=r.amistad-antes;r.conocido=true;
 return {ok:true,mensaje:n.nombre+': '+texto,conversacion:{id:n.id,texto,puntos,gusto,primeraCharla}};
}
export function puebloValido(v:unknown,dia:number):v is EstadoPueblo{
 const p=v as EstadoPueblo,entero=(n:unknown,min:number,max:number)=>typeof n==='number'&&Number.isInteger(n)&&n>=min&&n<=max;
 if(!p||p.version!==1||!Array.isArray(p.relaciones)||p.relaciones.length!==NPCS_PUEBLO.length)return false;
 const ids=new Set<string>();for(const r of p.relaciones){
  if(!r||!aldeanoDef(r.id)||ids.has(r.id)||typeof r.conocido!=='boolean'||!entero(r.amistad,0,2500)||!(r.ultimaCharla===null||entero(r.ultimaCharla,0,dia))||!entero(r.semanaRegalos,0,Math.floor(dia/7))||!Array.isArray(r.diasRegalos)||r.diasRegalos.length>2||new Set(r.diasRegalos).size!==r.diasRegalos.length||r.diasRegalos.some(d=>!entero(d,0,dia)||Math.floor(d/7)!==r.semanaRegalos))return false;
  if(!r.gustosDescubiertos||typeof r.gustosDescubiertos!=='object'||Array.isArray(r.gustosDescubiertos)||Object.keys(r.gustosDescubiertos).length>512||Object.entries(r.gustosDescubiertos).some(([id,g])=>!esRegalo(id)||g!==gustoRegalo(r.id,id)))return false;
  if(!r.conocido&&(r.amistad!==0||r.ultimaCharla!==null||r.diasRegalos.length||Object.keys(r.gustosDescubiertos).length))return false;ids.add(r.id);
 }return true;
}
