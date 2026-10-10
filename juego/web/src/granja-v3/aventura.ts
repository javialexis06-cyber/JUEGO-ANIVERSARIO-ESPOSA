/** Exploración serializable. El reloj usa segundos activos; no simula daño al cerrar el juego. */
export interface PuntoAventura { x:number; z:number }
export type SueloAventura = 'suelo'|'muro';
export type FaseMonstruo = 'reposo'|'patrulla'|'alerta'|'persecucion'|'anticipacion'|'ataque'|'recuperacion';
export type TipoMonstruo = 'gelatina'|'escarabajo'|'murcielago'|'guardian'|'ascua'|'sombra'|'centinela';
export type MineralAventura = 'piedra'|'carbon'|'cobre'|'hierro'|'oro'|'cuarzo'|'rubi'|'jade'|'obsidiana'|'plata'|'titanio'|'meteorita'|'cristal_astral'|'polvo_estelar';
export interface AccesoAventura { desbloqueos?:string[]; construcciones?:string[]; nivelPico?:number }
export interface DestinoAventura {
 id:string; nombre:string; tipo:'mina'|'mazmorra'|'reino'|'orbita'|'asteroide'|'planeta'; descripcion:string;
 color:string; roca:string; luz:string; dificultad:number; espacial:boolean; construccion?:string; nivelPico?:number;
 minerales:MineralAventura[]; monstruos:TipoMonstruo[]; niveles:number;
}
/** Son destinos de exploración configurables; no afirman un desenlace ni el canon de los mundos muertos. */
export const AVENTURAS:DestinoAventura[] = [
 {id:'mina_celia',nombre:'Minas de Celia',tipo:'mina',descripcion:'Galerías de cobre, hongos luminosos y vetas profundas. Cada piso conserva lo que descubres.',color:'#8c8172',roca:'#665f60',luz:'#ffc27e',dificultad:1,espacial:false,minerales:['piedra','carbon','cobre','cuarzo','hierro','plata','oro','jade','rubi','obsidiana','titanio','polvo_estelar'],monstruos:['gelatina','escarabajo','murcielago'],niveles:12},
 {id:'ruinas_celia',nombre:'Ruinas del bosque',tipo:'mazmorra',descripcion:'Patios olvidados, guardianes de piedra y cámaras de jade conectadas por pasillos.',color:'#739176',roca:'#50685d',luz:'#a5e2bb',dificultad:2,espacial:false,nivelPico:1,minerales:['piedra','hierro','jade','plata','oro'],monstruos:['gelatina','guardian','escarabajo'],niveles:6},
 {id:'reino_verdia',nombre:'Ecos de Verdia',tipo:'reino',descripcion:'Un destino provisional entre raíces antiguas y cristales verdes. Su historia espera ser descubierta.',color:'#748c70',roca:'#3e6354',luz:'#bcf3a0',dificultad:3,espacial:false,construccion:'portal_verdia',minerales:['jade','cuarzo','hierro','oro'],monstruos:['guardian','gelatina','escarabajo'],niveles:4},
 {id:'reino_senda',nombre:'Ecos de Senda',tipo:'reino',descripcion:'Islas de roca cálida y senderos de brasas. Un umbral de exploración, todavía sin desenlace.',color:'#b98268',roca:'#765368',luz:'#ffb580',dificultad:3,espacial:false,construccion:'portal_senda',minerales:['rubi','obsidiana','carbon','oro'],monstruos:['ascua','guardian','murcielago'],niveles:4},
 {id:'reino_nox',nombre:'Ecos de Nox',tipo:'reino',descripcion:'Un jardín nocturno de silencios y plata. El portal siempre conserva el camino de vuelta.',color:'#747d9c',roca:'#49465f',luz:'#c6b8ff',dificultad:4,espacial:false,construccion:'portal_nox',minerales:['plata','obsidiana','cuarzo','cristal_astral'],monstruos:['sombra','murcielago','guardian'],niveles:4},
 {id:'orbita_celia',nombre:'Estación sobre Celia',tipo:'orbita',descripcion:'Una pequeña base orbital con reserva de aire, depósitos de metal y una ruta segura de regreso.',color:'#a3afb9',roca:'#657080',luz:'#abedff',dificultad:1,espacial:true,construccion:'nave_exploradora',minerales:['hierro','cobre','titanio'],monstruos:['centinela'],niveles:1},
 {id:'asteroide_cobre',nombre:'Asteroide Cobrizo',tipo:'asteroide',descripcion:'Una veta que flota en el cielo. Explora despacio y vuelve antes de agotar la reserva de aire.',color:'#9a7971',roca:'#654f52',luz:'#ffd0ac',dificultad:3,espacial:true,construccion:'nave_exploradora',minerales:['cobre','hierro','meteorita','titanio'],monstruos:['escarabajo','centinela'],niveles:3},
 {id:'asteroide_cristal',nombre:'Asteroide Prisma',tipo:'asteroide',descripcion:'Cristales de luz azul y polvo estelar en un archipiélago mineral conectado.',color:'#8595bb',roca:'#5c587e',luz:'#c4dcff',dificultad:4,espacial:true,construccion:'nave_exploradora',minerales:['cuarzo','cristal_astral','polvo_estelar','meteorita'],monstruos:['sombra','centinela'],niveles:3},
 {id:'planeta_ambar',nombre:'Planeta Ámbar',tipo:'planeta',descripcion:'Terrazas de arena, basalto y ascuas errantes bajo un cielo anaranjado.',color:'#c4a579',roca:'#89635f',luz:'#ffe0ad',dificultad:4,espacial:true,construccion:'nave_exploradora',minerales:['oro','rubi','titanio','obsidiana'],monstruos:['ascua','escarabajo','guardian'],niveles:5},
 {id:'planeta_iris',nombre:'Planeta Iris',tipo:'planeta',descripcion:'Bosques de cristal violeta. Las balizas marcan cada sala y la ubicación de la nave.',color:'#a18aa9',roca:'#5e607e',luz:'#e4c3ff',dificultad:5,espacial:true,construccion:'nave_exploradora',minerales:['jade','cristal_astral','polvo_estelar','titanio'],monstruos:['gelatina','sombra','centinela'],niveles:5},
];

export interface ArquetipoMonstruo { nombre:string; vida:number; defensa:number; dano:number; velocidad:number; vision:number; alcance:number; anticipacion:number; recuperacion:number; color:string; botin:MineralAventura|'fibra' }
export const MONSTRUOS:Record<TipoMonstruo,ArquetipoMonstruo> = {
 gelatina:{nombre:'Gelatina musgosa',vida:28,defensa:0,dano:5,velocidad:1.15,vision:6,alcance:1.1,anticipacion:.72,recuperacion:1.3,color:'#88b993',botin:'fibra'},
 escarabajo:{nombre:'Escarabajo de cobre',vida:38,defensa:2,dano:7,velocidad:1.8,vision:6.5,alcance:1.2,anticipacion:.64,recuperacion:1.1,color:'#c48e6b',botin:'cobre'},
 murcielago:{nombre:'Murciélago de cristal',vida:24,defensa:0,dano:5,velocidad:2.5,vision:7,alcance:1.25,anticipacion:.6,recuperacion:1.45,color:'#a4a5d4',botin:'cuarzo'},
 guardian:{nombre:'Guardián de piedra',vida:65,defensa:4,dano:12,velocidad:.9,vision:6,alcance:1.65,anticipacion:1,recuperacion:1.8,color:'#92977c',botin:'piedra'},
 ascua:{nombre:'Ascua errante',vida:34,defensa:1,dano:9,velocidad:1.6,vision:7,alcance:1.5,anticipacion:.9,recuperacion:1.45,color:'#e89a68',botin:'carbon'},
 sombra:{nombre:'Velo nocturno',vida:38,defensa:2,dano:8,velocidad:2.1,vision:7.5,alcance:1.35,anticipacion:.78,recuperacion:1.25,color:'#9b8eaf',botin:'plata'},
 centinela:{nombre:'Centinela orbital',vida:54,defensa:3,dano:10,velocidad:1.35,vision:8,alcance:1.65,anticipacion:.95,recuperacion:1.6,color:'#89b4c0',botin:'titanio'},
};

export const MINERALES:Record<MineralAventura,{nombre:string; color:string; hp:number; pico:number}> = {
 piedra:{nombre:'Piedra',color:'#b2aaa1',hp:8,pico:0},carbon:{nombre:'Carbón',color:'#454052',hp:12,pico:0},
 cobre:{nombre:'Cobre',color:'#df9b72',hp:16,pico:0},hierro:{nombre:'Hierro',color:'#bdc8cc',hp:24,pico:1},
 oro:{nombre:'Oro',color:'#e8cb7a',hp:34,pico:2},cuarzo:{nombre:'Cuarzo',color:'#ecdce8',hp:18,pico:0},
 rubi:{nombre:'Rubí',color:'#d86c87',hp:36,pico:2},jade:{nombre:'Jade',color:'#81c69c',hp:30,pico:1},
 obsidiana:{nombre:'Obsidiana',color:'#61536d',hp:42,pico:3},plata:{nombre:'Plata',color:'#d3daeb',hp:30,pico:1},
 titanio:{nombre:'Titanio',color:'#9daeca',hp:48,pico:3},meteorita:{nombre:'Meteorita',color:'#a87d9b',hp:44,pico:2},
 cristal_astral:{nombre:'Cristal astral',color:'#b8a4ee',hp:52,pico:4},polvo_estelar:{nombre:'Polvo estelar',color:'#e8cce9',hp:36,pico:2},
};
export interface NodoAventura extends PuntoAventura { id:string; mineral:MineralAventura; hp:number; hpMax:number; cantidad:number; agotado:boolean }
export interface MonstruoAventura extends PuntoAventura {
 id:string; tipo:TipoMonstruo; hp:number; hpMax:number; fase:FaseMonstruo; tiempoFase:number; invulnerable:number;
 origen:PuntoAventura; objetivo:PuntoAventura; direccion:PuntoAventura; retroceso:PuntoAventura; patrulla:number; vivo:boolean;
}
export interface BotinAventura extends PuntoAventura { id:string; articulo:string; cantidad:number }
export interface EntradaAventura extends PuntoAventura { id:string; tipo:'retorno'|'descenso'; etiqueta:string }
export interface SituacionAventura extends PuntoAventura { id:string; tipo:'campamento'|'geoda'|'baliza'; resuelta:boolean; nombre:string }
export interface ChunkAventura { x:number; z:number; ancho:number; fondo:number }
export interface InstanciaAventura {
 id:string; destinoId:string; nivel:number; semilla:number; revision:number;
 suelos:Record<string,SueloAventura>; chunks:Record<string,ChunkAventura>; nodos:NodoAventura[]; monstruos:MonstruoAventura[];
 botin:BotinAventura[]; entradas:EntradaAventura[]; situaciones:SituacionAventura[]; inicio:PuntoAventura;
}
export interface EstadoAventura {
 version:1; semilla:number; destinoActual:string|null; instanciaActual:string|null; instancias:Record<string,InstanciaAventura>;
 retorno:PuntoAventura|null; descubrimientos:string[]; profundidad:Record<string,number>; oxigeno:number;
 avisoOxigeno:number; invulnerable:number; enfriamientoGolpe:number; secuencia:number; derrotados:number; mineralesExtraidos:number;
}
export interface ResultadoAventura { ok:boolean; mensaje:string; posicion?:PuntoAventura; botin?:{articulo:string;cantidad:number}; dano?:number; destruido?:boolean; vida?:number; energia?:number; oxigeno?:number }
export interface JugadorAventura extends PuntoAventura { vida?:number; defensa?:number }
export interface ResultadoPaso { dano:number; empuje?:PuntoAventura; avisos:string[]; salidaSegura?:PuntoAventura }
export type ColisionAventura = (x:number,z:number)=>boolean;
const clave = (x:number,z:number)=>`${Math.floor(x)},${Math.floor(z)}`;
const distancia = (a:PuntoAventura,b:PuntoAventura)=>Math.hypot(a.x-b.x,a.z-b.z);
const clamp = (v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
const bien = (mensaje:string,extra:Partial<ResultadoAventura>={}):ResultadoAventura=>({ok:true,mensaje,...extra});
const mal = (mensaje:string):ResultadoAventura=>({ok:false,mensaje});
function semillaTexto(texto:string,base:number){let n=base>>>0;for(let i=0;i<texto.length;i++)n=Math.imul(n^texto.charCodeAt(i),16777619);return n>>>0;}
function azarSemilla(seed:number){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=Math.imul(s^(s>>>15),1|s);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};}
export function crearAventura(semilla=71839):EstadoAventura {
 return {version:1,semilla:semilla>>>0,destinoActual:null,instanciaActual:null,instancias:{},retorno:null,descubrimientos:[],profundidad:{},oxigeno:100,avisoOxigeno:0,invulnerable:0,enfriamientoGolpe:0,secuencia:0,derrotados:0,mineralesExtraidos:0};
}
export function destinoAventura(id:string|null){return AVENTURAS.find(d=>d.id===id);}
export function instanciaAventura(e:EstadoAventura):InstanciaAventura|null {return e.instanciaActual?e.instancias[e.instanciaActual]??null:null;}
export function accesoAventura(id:string,acceso:AccesoAventura={}):ResultadoAventura {
 const d=destinoAventura(id);if(!d)return mal('Este destino todavía no está cartografiado.');
 if(d.construccion&&!acceso.construcciones?.includes(d.construccion))return mal(`Construye ${d.construccion==='nave_exploradora'?'la nave exploradora':`el portal de ${d.nombre.replace('Ecos de ','')}`} en la granja.`);
 if((acceso.nivelPico??0)<(d.nivelPico??0))return mal(`Necesitas un pico de nivel ${d.nivelPico} para abrir este camino.`);
 return bien('Ruta disponible.');
}
export function opcionesAventura(acceso:AccesoAventura={}){return AVENTURAS.map(d=>({...d,...accesoAventura(d.id,acceso)}));}

/** Los metales de progresión existen en Celia antes de fabricar portales o naves.
 * Cada región genera al menos una veta de cada material permitido en ese piso. */
export function mineralesPorProfundidad(destinoId:string,nivel:number):MineralAventura[] {
 const d=destinoAventura(destinoId);if(!d)return [];
 if(destinoId!=='mina_celia')return [...d.minerales];
 const profundidad:Partial<Record<MineralAventura,number>>={hierro:3,plata:5,oro:5,jade:7,rubi:7,obsidiana:9,titanio:11,polvo_estelar:11};
 return d.minerales.filter(m=>nivel>=(profundidad[m]??1));
}

/** Salas unidas por corredores de tres celdas; los cuatro conectores permiten ampliar sin rehacer el mapa. */
function generarChunk(inst:InstanciaAventura,cx:number,cz:number,d:DestinoAventura){
 const chunkKey=`${cx},${cz}`;if(inst.chunks[chunkKey])return;
 const x0=cx*32-16,z0=cz*32-16,rand=azarSemilla(semillaTexto(chunkKey,inst.semilla));
 inst.chunks[chunkKey]={x:x0,z:z0,ancho:32,fondo:32};
 for(let z=z0;z<z0+32;z++)for(let x=x0;x<x0+32;x++)inst.suelos[clave(x,z)]='muro';
 const piso=(x:number,z:number)=>{if(x>=x0&&x<x0+32&&z>=z0&&z<z0+32)inst.suelos[clave(x,z)]='suelo';};
 const sala=(x:number,z:number,w:number,h:number)=>{for(let zz=z;zz<z+h;zz++)for(let xx=x;xx<x+w;xx++)piso(xx,zz);};
 const corredor=(a:PuntoAventura,b:PuntoAventura)=>{const minX=Math.min(a.x,b.x),maxX=Math.max(a.x,b.x),minZ=Math.min(a.z,b.z),maxZ=Math.max(a.z,b.z);for(let x=minX;x<=maxX;x++)for(let w=-1;w<=1;w++)piso(x,a.z+w);for(let z=minZ;z<=maxZ;z++)for(let w=-1;w<=1;w++)piso(b.x+w,z);};
 const centros:PuntoAventura[]=[{x:x0+4,z:z0+4},{x:x0+16,z:z0+16},{x:x0+26,z:z0+26}];
 for(let n=0;n<5;n++)centros.push({x:x0+4+Math.floor(rand()*23),z:z0+4+Math.floor(rand()*23)});
 for(const c of centros){const ancho=5+Math.floor(rand()*4),alto=5+Math.floor(rand()*4);sala(c.x-2,c.z-2,Math.min(ancho,x0+30-(c.x-2)),Math.min(alto,z0+30-(c.z-2)));}
 for(let n=1;n<centros.length;n++)corredor(centros[n-1],centros[n]);
 for(const p of [{x:x0,z:z0+16},{x:x0+31,z:z0+16},{x:x0+16,z:z0},{x:x0+16,z:z0+31}])corredor(centros[1],p);
 // Occupants stay clear of the landing and use only open room interiors.
 const libres:PuntoAventura[]=[];
 for(let z=z0+2;z<z0+30;z++)for(let x=x0+2;x<x0+30;x++)if(inst.suelos[clave(x,z)]==='suelo'&&inst.suelos[clave(x+1,z)]==='suelo'&&inst.suelos[clave(x-1,z)]==='suelo'&&inst.suelos[clave(x,z+1)]==='suelo'&&inst.suelos[clave(x,z-1)]==='suelo'&&distancia({x,z},centros[0])>4)libres.push({x:x+.5,z:z+.5});
 for(let i=libres.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[libres[i],libres[j]]=[libres[j],libres[i]];}
 const tomar=()=>libres.pop()??{x:x0+16.5,z:z0+16.5};
 const minerales=mineralesPorProfundidad(d.id,inst.nivel);
 for(let n=0;n<18;n++){
  const mineral=n<minerales.length?minerales[n]:minerales[Math.floor(rand()*minerales.length)],def=MINERALES[mineral],hp=def.hp+Math.min(inst.nivel-1,10)*2;
  inst.nodos.push({id:`${inst.id}:${chunkKey}:n${n}`,...tomar(),mineral,hp,hpMax:hp,cantidad:2+Math.floor(rand()*3),agotado:false});
 }
 const numero=d.tipo==='orbita'?2:5+Math.min(5,d.dificultad+Math.floor(inst.nivel/3));
 for(let n=0;n<numero;n++){
  const tipo=d.monstruos[Math.floor(rand()*d.monstruos.length)],def=MONSTRUOS[tipo],p=tomar(),hp=def.vida+Math.min(25,(inst.nivel-1)*3);
  inst.monstruos.push({id:`${inst.id}:${chunkKey}:m${n}`,tipo,...p,hp,hpMax:hp,fase:'reposo',tiempoFase:rand()*1.8,invulnerable:0,origen:{...p},objetivo:{...p},direccion:{x:0,z:1},retroceso:{x:0,z:0},patrulla:Math.floor(rand()*4),vivo:true});
 }
 const situacionTipo=d.espacial?'baliza':(inst.nivel%2?'campamento':'geoda');
 inst.situaciones.push({id:`${inst.id}:${chunkKey}:s`,...centros[1],x:centros[1].x+.5,z:centros[1].z+.5,tipo:situacionTipo,nombre:situacionTipo==='campamento'?'Campamento tranquilo':situacionTipo==='baliza'?'Baliza de oxígeno':'Geoda sellada',resuelta:false});
 inst.revision++;
}
export function generarInstancia(destinoId:string,semilla:number,nivel=1):InstanciaAventura {
 const d=destinoAventura(destinoId);if(!d)throw new Error('Destino de aventura desconocido.');
 nivel=clamp(Math.floor(nivel),1,d.niveles);
 const id=`${destinoId}:${nivel}`,s=semillaTexto(id,semilla),inst:InstanciaAventura={id,destinoId,nivel,semilla:s,revision:0,suelos:{},chunks:{},nodos:[],monstruos:[],botin:[],entradas:[],situaciones:[],inicio:{x:-11.5,z:-11.5}};
 generarChunk(inst,0,0,d);
 inst.entradas.push({id:`${id}:salida`,tipo:'retorno',etiqueta:'Regreso seguro',...inst.inicio});
 if(nivel<d.niveles)inst.entradas.push({id:`${id}:descenso`,tipo:'descenso',etiqueta:d.tipo==='mina'?'Bajar al siguiente piso':'Explorar la siguiente región',x:10.5,z:10.5});
 return inst;
}
export function ampliarAventura(e:EstadoAventura,cx:number,cz:number):ResultadoAventura {
 const i=instanciaAventura(e);if(!i)return mal('No estás en una expedición.');
 if(!Number.isInteger(cx)||!Number.isInteger(cz)||Math.abs(cx)>2||Math.abs(cz)>2)return mal('Esa región queda fuera de las balizas actuales.');
 if(i.chunks[`${cx},${cz}`])return bien('Región ya cartografiada.');
 if(![[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dz])=>i.chunks[`${cx+dx},${cz+dz}`]))return mal('Primero descubre una región contigua.');
 generarChunk(i,cx,cz,destinoAventura(i.destinoId)!);return bien('Nueva región conectada a tus senderos.');
}
export function entrarAventura(e:EstadoAventura,destinoId:string,jugador:PuntoAventura,acceso:AccesoAventura={}):ResultadoAventura {
 if(e.destinoActual)return mal('Regresa a la granja antes de iniciar otra expedición.');
 const permitido=accesoAventura(destinoId,acceso);if(!permitido.ok)return permitido;
 const id=`${destinoId}:1`;e.instancias[id]??=generarInstancia(destinoId,e.semilla);
 e.destinoActual=destinoId;e.instanciaActual=id;e.retorno={x:jugador.x,z:jugador.z};e.oxigeno=100;e.avisoOxigeno=0;e.invulnerable=2;e.enfriamientoGolpe=0;
 e.profundidad[destinoId]=Math.max(1,e.profundidad[destinoId]??0);if(!e.descubrimientos.includes(destinoId))e.descubrimientos.push(destinoId);
 return bien(`Llegaste a ${destinoAventura(destinoId)!.nombre}. La baliza te permite volver en cualquier momento.`,{posicion:{...e.instancias[id].inicio}});
}
/** Retorno de emergencia sin coste, pérdida de mochila ni requisitos: también funciona con un mapa corrupto. */
export function salirAventura(e:EstadoAventura):ResultadoAventura {
 const posicion={...(e.retorno??{x:0,z:4})};e.destinoActual=null;e.instanciaActual=null;e.retorno=null;e.invulnerable=0;e.enfriamientoGolpe=0;
 return bien('Regresaste con tus hallazgos a salvo.',{posicion});
}
export function descenderAventura(e:EstadoAventura,jugador:PuntoAventura):ResultadoAventura {
 const i=instanciaAventura(e);if(!i)return mal('No estás en una expedición.');
 const entrada=i.entradas.find(p=>p.tipo==='descenso');if(!entrada)return mal('Has llegado a la última región de este destino.');
 if(distancia(jugador,entrada)>2)return mal('Acércate a la baliza del siguiente piso.');
 const nivel=i.nivel+1,id=`${i.destinoId}:${nivel}`;e.instancias[id]??=generarInstancia(i.destinoId,e.semilla,nivel);e.instanciaActual=id;e.invulnerable=2;
 e.profundidad[i.destinoId]=Math.max(nivel,e.profundidad[i.destinoId]??0);
 return bien(`Región ${nivel} descubierta.`,{posicion:{...e.instancias[id].inicio}});
}
export function esTransitableAventura(e:EstadoAventura,x:number,z:number,radio=.28){
 const i=instanciaAventura(e);if(!i||!Number.isFinite(x)||!Number.isFinite(z))return false;
 return [x-radio,x+radio].every(xx=>[z-radio,z+radio].every(zz=>i.suelos[clave(xx,zz)]==='suelo'));
}
function lineaVision(i:InstanciaAventura,a:PuntoAventura,b:PuntoAventura){const n=Math.ceil(distancia(a,b)*4);for(let s=1;s<=n;s++){const t=s/n;if(i.suelos[clave(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t)]!=='suelo')return false;}return true;}
function mover(e:EstadoAventura,m:PuntoAventura,dx:number,dz:number,colision?:ColisionAventura){
 const libre=(x:number,z:number)=>esTransitableAventura(e,x,z,.22)&&!colision?.(x,z);
 if(libre(m.x+dx,m.z+dz)){m.x+=dx;m.z+=dz;}else if(libre(m.x+dx,m.z))m.x+=dx;else if(libre(m.x,m.z+dz))m.z+=dz;
}
function fase(m:MonstruoAventura,f:FaseMonstruo,t:number){m.fase=f;m.tiempoFase=t;}
function orientacion(a:PuntoAventura,b:PuntoAventura){const d=Math.max(.001,distancia(a,b));return{x:(b.x-a.x)/d,z:(b.z-a.z)/d};}

/** El callback de colisión devuelve true cuando una posición está bloqueada. No recorre las celdas del mapa. */
export function stepAventura(e:EstadoAventura,dt:number,jugador:JugadorAventura,colision?:ColisionAventura):ResultadoPaso {
 const r:ResultadoPaso={dano:0,avisos:[]},i=instanciaAventura(e);if(!i||!Number.isFinite(dt)||dt<=0)return r;
 dt=Math.min(.25,dt);e.invulnerable=Math.max(0,e.invulnerable-dt);e.enfriamientoGolpe=Math.max(0,e.enfriamientoGolpe-dt);
 const d=destinoAventura(i.destinoId)!;
 if(d.espacial&&d.tipo!=='orbita'){
  e.oxigeno=Math.max(0,e.oxigeno-dt*.11); // ~15 minutes per full tank; never an instant unseen death.
  if(e.oxigeno<=25&&e.avisoOxigeno<1){e.avisoOxigeno=1;r.avisos.push('Oxígeno al 25 %. Usa el regreso seguro o una baliza de aire.');}
  if(e.oxigeno<=10&&e.avisoOxigeno<2){e.avisoOxigeno=2;r.avisos.push('Reserva de oxígeno al 10 %. La nave te recogerá si se agota.');}
  if(e.oxigeno<=0){r.salidaSegura=salirAventura(e).posicion;r.avisos.push('La nave te recogió a tiempo. Conservas todos tus hallazgos.');return r;}
 }
 for(const m of i.monstruos){
  if(!m.vivo)continue;m.invulnerable=Math.max(0,m.invulnerable-dt);
  const def=MONSTRUOS[m.tipo],dist=distancia(m,jugador);if(dist>18)continue;
  m.tiempoFase-=dt;
  if(Math.hypot(m.retroceso.x,m.retroceso.z)>.04){mover(e,m,m.retroceso.x*dt,m.retroceso.z*dt,colision);const decay=Math.exp(-dt*10);m.retroceso.x*=decay;m.retroceso.z*=decay;}
  const ve=dist<def.vision&&lineaVision(i,m,jugador),cercaSalida=distancia(jugador,i.inicio)<2.2;
  if(cercaSalida&&m.fase!=='reposo'&&m.fase!=='patrulla')fase(m,'reposo',1.2);
  if((m.fase==='reposo'||m.fase==='patrulla')&&ve&&!cercaSalida){m.objetivo={x:jugador.x,z:jugador.z};fase(m,'alerta',.42);}
  if(m.fase==='reposo'&&m.tiempoFase<=0){
   m.patrulla=(m.patrulla+1)%4;const direcciones=[[1,0],[0,1],[-1,0],[0,-1]],v=direcciones[m.patrulla];m.objetivo={x:m.origen.x+v[0]*1.8,z:m.origen.z+v[1]*1.8};fase(m,'patrulla',2.5);
  }else if(m.fase==='patrulla'){
   const v=orientacion(m,m.objetivo);mover(e,m,v.x*dt*def.velocidad*.42,v.z*dt*def.velocidad*.42,colision);m.direccion=v;
   if(m.tiempoFase<=0||distancia(m,m.objetivo)<.3)fase(m,'reposo',1.8);
  }else if(m.fase==='alerta'&&m.tiempoFase<=0)fase(m,'persecucion',3);
  else if(m.fase==='persecucion'){
   if(ve){m.objetivo={x:jugador.x,z:jugador.z};m.tiempoFase=3;}
   if(dist<=def.alcance+.2&&ve){m.direccion=orientacion(m,jugador);fase(m,'anticipacion',def.anticipacion);}
   else if(m.tiempoFase<=0){fase(m,'reposo',1);}
   else {const v=orientacion(m,m.objetivo);m.direccion=v;mover(e,m,v.x*dt*def.velocidad,v.z*dt*def.velocidad,colision);}
  }else if(m.fase==='anticipacion'&&m.tiempoFase<=0)fase(m,'ataque',.14);
  else if(m.fase==='ataque'){
   // Attack direction is locked during the visible wind-up, so stepping sideways really dodges it.
   const v=orientacion(m,jugador),frente=v.x*m.direccion.x+v.z*m.direccion.z;
   if(e.invulnerable<=0&&dist<=def.alcance+.35&&frente>.1&&lineaVision(i,m,jugador)&&!cercaSalida){
    const dano=Math.max(1,def.dano-Math.max(0,jugador.defensa??0));r.dano+=dano;e.invulnerable=.95;r.empuje={x:v.x*.5,z:v.z*.5};
   }
   if(m.tiempoFase<=0)fase(m,'recuperacion',def.recuperacion);
  }else if(m.fase==='recuperacion'&&m.tiempoFase<=0)fase(m,ve&&!cercaSalida?'persecucion':'reposo',ve?3:1.5);
 }
 if((jugador.vida??100)-r.dano<=0){r.salidaSegura=salirAventura(e).posicion;r.avisos.push('La baliza te llevó a casa para descansar. Tu mochila sigue contigo.');}
 return r;
}
function soltar(e:EstadoAventura,i:InstanciaAventura,p:PuntoAventura,articulo:string,cantidad:number){i.botin.push({id:`botin_aventura_${++e.secuencia}`,x:p.x,z:p.z,articulo,cantidad});i.revision++;}
export function golpearMonstruo(e:EstadoAventura,id:string,jugador:PuntoAventura,nivelEspada=0,danoExtra=0):ResultadoAventura {
 const i=instanciaAventura(e),m=i?.monstruos.find(m=>m.id===id&&m.vivo);if(!i||!m)return mal('La criatura ya no está aquí.');
 if(e.enfriamientoGolpe>0)return mal('Espera a terminar el golpe.');if(m.invulnerable>0)return mal('La criatura está recuperándose del impacto.');
 if(distancia(jugador,m)>2.1||!lineaVision(i,jugador,m))return mal('Acércate a la criatura por un camino despejado.');
 const nivel=clamp(Math.floor(nivelEspada),0,6),dano=Math.max(1,10+nivel*7+clamp(danoExtra,0,50)-MONSTRUOS[m.tipo].defensa);
 m.hp=Math.max(0,m.hp-dano);m.invulnerable=.28;e.enfriamientoGolpe=.42;m.retroceso=orientacion(jugador,m);m.retroceso.x*=5;m.retroceso.z*=5;
 if(m.hp===0){m.vivo=false;e.derrotados++;soltar(e,i,m,MONSTRUOS[m.tipo].botin,2+Math.min(3,Math.floor(i.nivel/3)));}
 else fase(m,'recuperacion',Math.max(.55,MONSTRUOS[m.tipo].recuperacion*.55));
 return bien(m.vivo?`${MONSTRUOS[m.tipo].nombre}: ${m.hp} / ${m.hpMax}`:'La criatura dejó recursos para recoger.',{dano,destruido:!m.vivo});
}
export function golpearNodo(e:EstadoAventura,id:string,jugador:PuntoAventura,nivelPico=0):ResultadoAventura {
 const i=instanciaAventura(e),n=i?.nodos.find(n=>n.id===id&&!n.agotado);if(!i||!n)return mal('Esta veta ya está agotada.');
 if(e.enfriamientoGolpe>0)return mal('Espera a terminar el golpe.');if(distancia(jugador,n)>2.3||!lineaVision(i,jugador,n))return mal('Acércate a la veta por un camino despejado.');
 const def=MINERALES[n.mineral],nivel=clamp(Math.floor(nivelPico),0,6);if(nivel<def.pico)return mal(`${def.nombre} necesita un pico de nivel ${def.pico}.`);
 const dano=6+nivel*5;n.hp=Math.max(0,n.hp-dano);e.enfriamientoGolpe=.36;
 if(n.hp===0){n.agotado=true;e.mineralesExtraidos++;soltar(e,i,n,n.mineral,n.cantidad);}
 return bien(n.agotado?`${def.nombre} listo para recoger.`:`${def.nombre}: ${n.hp} / ${n.hpMax}`,{dano,destruido:n.agotado});
}
/** El motor añade este resultado al inventario de manera transaccional; si la mochila está llena, revierte su copia. */
export function recogerBotin(e:EstadoAventura,id:string,jugador:PuntoAventura):ResultadoAventura {
 const i=instanciaAventura(e),idx=i?.botin.findIndex(d=>d.id===id)??-1;if(!i||idx<0)return mal('Este hallazgo ya fue recogido.');
 const item=i.botin[idx];if(distancia(jugador,item)>1.8)return mal('Camina hasta el hallazgo para recogerlo.');
 i.botin.splice(idx,1);i.revision++;return bien(`Recogiste ${item.cantidad} ${MINERALES[item.articulo as MineralAventura]?.nombre??item.articulo}.`,{botin:{articulo:item.articulo,cantidad:item.cantidad}});
}
export function resolverSituacion(e:EstadoAventura,id:string,jugador:PuntoAventura):ResultadoAventura {
 const i=instanciaAventura(e),s=i?.situaciones.find(s=>s.id===id);if(!i||!s)return mal('No hay una situación en este lugar.');
 if(s.resuelta)return mal('Ya aprovechaste este hallazgo.');if(distancia(jugador,s)>2.3)return mal('Acércate para investigar.');
 s.resuelta=true;i.revision++;
 if(s.tipo==='campamento')return bien('Descansas junto a la luz del campamento.',{vida:25,energia:25});
 if(s.tipo==='baliza'){e.oxigeno=Math.min(100,e.oxigeno+45);e.avisoOxigeno=e.oxigeno>25?0:e.avisoOxigeno;return bien('La baliza recuperó 45 puntos de oxígeno.',{oxigeno:45});}
 const mineral=mineralesPorProfundidad(i.destinoId,i.nivel).at(-1)!;soltar(e,i,s,mineral,3);return bien('La geoda guardaba tres minerales. Recógelos del suelo.');
}

/** Comprueba el guardado completo sin podar elementos: un error nunca se convierte
 * silenciosamente en una expedición vacía ni regenera vetas ya extraídas. */
export function errorAventura(raw:unknown):string|null {
 const registro=(v:unknown):v is Record<string,any>=>!!v&&typeof v==='object'&&!Array.isArray(v);
 const numero=(v:unknown,min=0,max=1e9):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
 const entero=(v:unknown,min=0,max=1e9):v is number=>numero(v,min,max)&&Number.isInteger(v);
 const punto=(v:unknown):v is PuntoAventura=>registro(v)&&numero(v.x,-1000,1000)&&numero(v.z,-1000,1000);
 const idValido=(id:unknown):id is string=>typeof id==='string'&&/^[a-zA-Z0-9_,:-]{1,140}$/.test(id)&&!['__proto__','constructor','prototype'].includes(id);
 const texto=(v:unknown)=>typeof v==='string'&&v.length>0&&v.length<=200;
 if(!registro(raw)||raw.version!==1)return 'Formato de expediciones no compatible.';
 const r=raw;
 if(!entero(r.semilla,0,0xffffffff))return 'Semilla de expediciones inválida.';
 for(const k of ['secuencia','derrotados','mineralesExtraidos'])if(!entero(r[k]))return `Contador de expediciones inválido: ${k}.`;
 if(!numero(r.oxigeno,0,100)||!numero(r.invulnerable,0,2)||!numero(r.enfriamientoGolpe,0,1)||![0,1,2].includes(r.avisoOxigeno))return 'Reloj de combate u oxígeno inválido.';
 if(!Array.isArray(r.descubrimientos)||r.descubrimientos.length>AVENTURAS.length||new Set(r.descubrimientos).size!==r.descubrimientos.length||r.descubrimientos.some((id:unknown)=>typeof id!=='string'||!destinoAventura(id)))return 'Destinos descubiertos inválidos.';
 if(!registro(r.profundidad)||Object.keys(r.profundidad).length>AVENTURAS.length)return 'Profundidades inválidas.';
 for(const [id,nivel] of Object.entries(r.profundidad)){const d=destinoAventura(id);if(!d||!entero(nivel,1,d.niveles)||!r.descubrimientos.includes(id))return 'Profundidad sin descubrimiento válido.';}
 if(!registro(r.instancias)||Object.keys(r.instancias).length>AVENTURAS.reduce((n,d)=>n+d.niveles,0))return 'Colección de expediciones inválida.';
 const idsBotin=new Set<string>();
 for(const [id,i] of Object.entries(r.instancias)){
  if(!registro(i))return `Expedición inválida: ${id}.`;
  const d=typeof i.destinoId==='string'?destinoAventura(i.destinoId):undefined;
  if(!d||!entero(i.nivel,1,d.niveles)||id!==`${d.id}:${i.nivel}`||i.id!==id||!entero(i.semilla,0,0xffffffff)||!entero(i.revision)||!punto(i.inicio))return `Identidad de expedición inválida: ${id}.`;
  if(!registro(i.chunks)||!Object.hasOwn(i.chunks,'0,0')||Object.keys(i.chunks).length>25||!registro(i.suelos)||Object.keys(i.suelos).length!==Object.keys(i.chunks).length*1024)return `Terreno incompleto: ${id}.`;
  for(const [k,c] of Object.entries(i.chunks)){
   if(!/^(?:-2|-1|0|1|2),(?:-2|-1|0|1|2)$/.test(k)||!registro(c))return `Región inválida: ${id}.`;
   const [cx,cz]=k.split(',').map(Number);
   if(c.x!==cx*32-16||c.z!==cz*32-16||c.ancho!==32||c.fondo!==32)return `Dimensiones de región inválidas: ${id}.`;
   for(let z=c.z;z<c.z+32;z++)for(let x=c.x;x<c.x+32;x++)if(!['suelo','muro'].includes(i.suelos[`${x},${z}`]))return `Celda inválida: ${id}.`;
  }
  const pisable=(p:unknown)=>punto(p)&&i.suelos[clave(p.x,p.z)]==='suelo';
  if(!pisable(i.inicio))return `Entrada bloqueada: ${id}.`;
  for(const [campo,max] of [['nodos',450],['monstruos',250],['botin',1500],['entradas',2],['situaciones',25]] as const)if(!Array.isArray(i[campo])||i[campo].length>max)return `Objetos de expedición inválidos: ${campo}.`;
  const ids=new Set<string>();
  for(const obj of [...i.nodos,...i.monstruos,...i.botin,...i.entradas,...i.situaciones]){if(!registro(obj)||!idValido(obj.id)||ids.has(obj.id)||!pisable(obj))return `Objeto repetido o fuera del terreno: ${id}.`;ids.add(obj.id);}
  for(const n of i.nodos)if(!Object.hasOwn(MINERALES,n.mineral)||!numero(n.hpMax,.001,1000)||!numero(n.hp,0,n.hpMax)||!entero(n.cantidad,1,20)||typeof n.agotado!=='boolean'||n.agotado!==(n.hp===0))return `Veta inválida: ${id}.`;
  for(const m of i.monstruos)if(!Object.hasOwn(MONSTRUOS,m.tipo)||!numero(m.hpMax,.001,1000)||!numero(m.hp,0,m.hpMax)||typeof m.vivo!=='boolean'||m.vivo!==(m.hp>0)||!['reposo','patrulla','alerta','persecucion','anticipacion','ataque','recuperacion'].includes(m.fase)||!numero(m.tiempoFase,-.3,10)||!numero(m.invulnerable,0,1)||!punto(m.origen)||!punto(m.objetivo)||!punto(m.direccion)||!punto(m.retroceso)||!entero(m.patrulla,0,3))return `Criatura inválida: ${id}.`;
  for(const b of i.botin){if((!Object.hasOwn(MINERALES,b.articulo)&&b.articulo!=='fibra')||!entero(b.cantidad,1,99)||idsBotin.has(b.id))return `Botín inválido o duplicado: ${id}.`;idsBotin.add(b.id);const sec=/^botin_aventura_(\d+)$/.exec(b.id);if(sec&&Number(sec[1])>r.secuencia)return 'Secuencia de hallazgos inválida.';}
  if(i.entradas.filter((p:any)=>p.tipo==='retorno').length!==1||i.entradas.filter((p:any)=>p.tipo==='descenso').length!==(i.nivel<d.niveles?1:0)||i.entradas.some((p:any)=>!['retorno','descenso'].includes(p.tipo)||!texto(p.etiqueta)))return `Balizas inválidas: ${id}.`;
  for(const s of i.situaciones)if(!['campamento','geoda','baliza'].includes(s.tipo)||typeof s.resuelta!=='boolean'||!texto(s.nombre))return `Hallazgo inválido: ${id}.`;
  if(!r.descubrimientos.includes(d.id)||!entero(r.profundidad[d.id],i.nivel,d.niveles))return `Región sin progreso registrado: ${id}.`;
 }
 if(r.destinoActual===null){if(r.instanciaActual!==null||r.retorno!==null)return 'Retorno de expedición inconsistente.';}
 else if(typeof r.destinoActual!=='string'||!destinoAventura(r.destinoActual)||typeof r.instanciaActual!=='string'||!Object.hasOwn(r.instancias,r.instanciaActual)||r.instancias[r.instanciaActual].destinoId!==r.destinoActual||!punto(r.retorno))return 'Destino activo sin una ruta de regreso válida.';
 return null;
}

/** Valida y clona exactamente; el anfitrión conserva el archivo original si hay errores. */
export function restaurarAventura(raw:unknown,_semilla=71839):EstadoAventura {
 const error=errorAventura(raw);if(error)throw new Error(error);
 return structuredClone(raw) as EstadoAventura;
}
