import {JEFES,esJefe,crearPatron,pasoJefe,patronValido,type PatronJefe} from './jefes';
/** Exploración serializable. El reloj usa segundos activos; no simula daño al cerrar el juego. */
export interface PuntoAventura { x:number; z:number }
export type SueloAventura = 'suelo'|'muro';
export type FaseMonstruo = 'reposo'|'patrulla'|'alerta'|'persecucion'|'anticipacion'|'ataque'|'recuperacion';
export type TipoMonstruo = 'gelatina'|'escarabajo'|'murcielago'|'guardian'|'ascua'|'sombra'|'centinela'|'constructo_fuego'|'constructo_agua'|'constructo_tierra'|'constructo_aire'|'regulador_fuego'|'regulador_agua'|'regulador_tierra'|'regulador_aire'|'forma_fija'|'proyeccion_nath';
export type MineralAventura = 'piedra'|'carbon'|'cobre'|'hierro'|'oro'|'cuarzo'|'rubi'|'jade'|'obsidiana'|'plata'|'titanio'|'meteorita'|'cristal_astral'|'polvo_estelar'|'estano'|'mitrilo'|'amatista'|'topacio'|'aguamarina'|'esmeralda'|'diamante'|'geoda'|'geoda_helada'|'geoda_magma'|'geoda_omni';
export interface AccesoAventura { desbloqueos?:string[]; construcciones?:string[]; nivelPico?:number }
export interface DestinoAventura {
 id:string; nombre:string; tipo:'mina'|'mazmorra'|'reino'|'orbita'|'asteroide'|'planeta'; descripcion:string;
 color:string; roca:string; luz:string; dificultad:number; espacial:boolean; construccion?:string; nivelPico?:number;
 minerales:MineralAventura[]; monstruos:TipoMonstruo[]; niveles:number;
}
/** Son destinos de exploración configurables; no afirman un desenlace ni el canon de los mundos muertos. */
export const AVENTURAS:DestinoAventura[] = [
 {id:'mina_celia',nombre:'Minas de Celia',tipo:'mina',descripcion:'Pisos que cambian cada vez que bajas: tierra, hielo, lava y, pasando el piso 100, la caverna sin fondo. Busca la escalera bajo las rocas.',color:'#8c8172',roca:'#665f60',luz:'#ffc27e',dificultad:1,espacial:false,minerales:['piedra','carbon','cobre','cuarzo','hierro','plata','oro','jade','rubi','obsidiana','titanio','meteorita','polvo_estelar','cristal_astral','estano','mitrilo','amatista','topacio','aguamarina','esmeralda','diamante','geoda','geoda_helada','geoda_magma','geoda_omni'],monstruos:['gelatina','escarabajo','murcielago'],niveles:100000},
 {id:'ruinas_celia',nombre:'Ruinas del bosque',tipo:'mazmorra',descripcion:'Patios olvidados, guardianes de piedra y cámaras de jade conectadas por pasillos.',color:'#739176',roca:'#50685d',luz:'#a5e2bb',dificultad:2,espacial:false,nivelPico:1,minerales:['piedra','hierro','jade','plata','oro'],monstruos:['gelatina','guardian','escarabajo'],niveles:6},
 {id:'reino_verdia',nombre:'Ecos de Verdia',tipo:'reino',descripcion:'Un destino provisional entre raíces antiguas y cristales verdes. Su historia espera ser descubierta.',color:'#748c70',roca:'#3e6354',luz:'#bcf3a0',dificultad:3,espacial:false,construccion:'portal_verdia',minerales:['jade','cuarzo','hierro','oro'],monstruos:['guardian','gelatina','escarabajo'],niveles:4},
 {id:'reino_senda',nombre:'Ecos de Senda',tipo:'reino',descripcion:'Islas de roca cálida y senderos de brasas. Un umbral de exploración, todavía sin desenlace.',color:'#b98268',roca:'#765368',luz:'#ffb580',dificultad:3,espacial:false,construccion:'portal_senda',minerales:['rubi','obsidiana','carbon','oro'],monstruos:['ascua','guardian','murcielago'],niveles:4},
 {id:'reino_nox',nombre:'Ecos de Nox',tipo:'reino',descripcion:'Perímetro de contención autorizado: el combate no abre celdas ni libera condenados. El portal conserva el regreso.',color:'#747d9c',roca:'#49465f',luz:'#c6b8ff',dificultad:4,espacial:false,construccion:'portal_nox',minerales:['plata','obsidiana','cuarzo','cristal_astral'],monstruos:['sombra','murcielago','guardian'],niveles:4},
 {id:'orbita_celia',nombre:'Estación sobre Celia',tipo:'orbita',descripcion:'Una pequeña base orbital con reserva de aire, depósitos de metal y una ruta segura de regreso.',color:'#a3afb9',roca:'#657080',luz:'#abedff',dificultad:1,espacial:true,construccion:'nave_exploradora',minerales:['hierro','cobre','titanio'],monstruos:['centinela'],niveles:1},
 {id:'asteroide_cobre',nombre:'Asteroide Cobrizo',tipo:'asteroide',descripcion:'Una veta que flota en el cielo. Explora despacio y vuelve antes de agotar la reserva de aire.',color:'#9a7971',roca:'#654f52',luz:'#ffd0ac',dificultad:3,espacial:true,construccion:'nave_exploradora',minerales:['cobre','hierro','meteorita','titanio'],monstruos:['escarabajo','centinela'],niveles:3},
 {id:'asteroide_cristal',nombre:'Asteroide Prisma',tipo:'asteroide',descripcion:'Cristales de luz azul y polvo estelar en un archipiélago mineral conectado.',color:'#8595bb',roca:'#5c587e',luz:'#c4dcff',dificultad:4,espacial:true,construccion:'nave_exploradora',minerales:['cuarzo','cristal_astral','polvo_estelar','meteorita'],monstruos:['sombra','centinela'],niveles:3},
 {id:'planeta_ambar',nombre:'Planeta Ámbar',tipo:'planeta',descripcion:'Terrazas de arena, basalto y ascuas errantes bajo un cielo anaranjado.',color:'#c4a579',roca:'#89635f',luz:'#ffe0ad',dificultad:4,espacial:true,construccion:'nave_exploradora',minerales:['oro','rubi','titanio','obsidiana'],monstruos:['ascua','escarabajo','guardian'],niveles:5},
 {id:'planeta_iris',nombre:'Planeta Iris',tipo:'planeta',descripcion:'Bosques de cristal violeta. Las balizas marcan cada sala y la ubicación de la nave.',color:'#a18aa9',roca:'#5e607e',luz:'#e4c3ff',dificultad:5,espacial:true,construccion:'nave_exploradora',minerales:['jade','cristal_astral','polvo_estelar','titanio'],monstruos:['gelatina','sombra','centinela'],niveles:5},
];

for(const [elemento,color,monstruo,mineral]of [['fuego','#bf735b','ascua','rubi'],['agua','#749cb5','gelatina','aguamarina'],['tierra','#8f9c6a','guardian','jade'],['aire','#babdcd','centinela','cuarzo']] as const)AVENTURAS.push({id:'confluencia_'+elemento,nombre:'Práctica elemental · '+elemento,tipo:'reino',descripcion:'Arena autorizada fuera del refugio. Los habitantes y los animales del territorio permanecen a salvo.',color,roca:'#78777d',luz:color,dificultad:3,espacial:false,minerales:[mineral,'piedra'],monstruos:['constructo_'+elemento as TipoMonstruo],niveles:3});

export interface ArquetipoMonstruo { nombre:string; vida:number; defensa:number; dano:number; velocidad:number; vision:number; alcance:number; anticipacion:number; recuperacion:number; color:string; botin:MineralAventura|'fibra' }
export const MONSTRUOS = {
 gelatina:{nombre:'Gelatina musgosa',vida:28,defensa:0,dano:5,velocidad:1.15,vision:6,alcance:1.1,anticipacion:.72,recuperacion:1.3,color:'#88b993',botin:'fibra'},
 escarabajo:{nombre:'Escarabajo de cobre',vida:38,defensa:2,dano:7,velocidad:1.8,vision:6.5,alcance:1.2,anticipacion:.64,recuperacion:1.1,color:'#c48e6b',botin:'cobre'},
 murcielago:{nombre:'Murciélago de cristal',vida:24,defensa:0,dano:5,velocidad:2.5,vision:7,alcance:1.25,anticipacion:.6,recuperacion:1.45,color:'#a4a5d4',botin:'cuarzo'},
 guardian:{nombre:'Guardián de piedra',vida:65,defensa:4,dano:12,velocidad:.9,vision:6,alcance:1.65,anticipacion:1,recuperacion:1.8,color:'#92977c',botin:'piedra'},
 ascua:{nombre:'Ascua errante',vida:34,defensa:1,dano:9,velocidad:1.6,vision:7,alcance:1.5,anticipacion:.9,recuperacion:1.45,color:'#e89a68',botin:'carbon'},
 sombra:{nombre:'Velo nocturno',vida:38,defensa:2,dano:8,velocidad:2.1,vision:7.5,alcance:1.35,anticipacion:.78,recuperacion:1.25,color:'#9b8eaf',botin:'plata'},
 centinela:{nombre:'Centinela orbital',vida:54,defensa:3,dano:10,velocidad:1.35,vision:8,alcance:1.65,anticipacion:.95,recuperacion:1.6,color:'#89b4c0',botin:'titanio'},
 constructo_fuego:{nombre:'Regulador térmico de práctica',vida:34,defensa:1,dano:9,velocidad:1.6,vision:7,alcance:1.5,anticipacion:.9,recuperacion:1.45,color:'#e89a68',botin:'carbon'},
 constructo_agua:{nombre:'Bomba de retorno de práctica',vida:28,defensa:0,dano:5,velocidad:1.15,vision:6,alcance:1.1,anticipacion:.72,recuperacion:1.3,color:'#749cb5',botin:'fibra'},
 constructo_tierra:{nombre:'Soporte móvil de práctica',vida:65,defensa:4,dano:12,velocidad:.9,vision:6,alcance:1.65,anticipacion:1,recuperacion:1.8,color:'#92977c',botin:'piedra'},
 constructo_aire:{nombre:'Turbina de práctica',vida:54,defensa:3,dano:10,velocidad:1.35,vision:8,alcance:1.65,anticipacion:.95,recuperacion:1.6,color:'#babdcd',botin:'titanio'},
} as Record<TipoMonstruo,ArquetipoMonstruo>;
for(const [tipo,j]of Object.entries(JEFES)){const base=MONSTRUOS[j.modeloBase as TipoMonstruo];MONSTRUOS[tipo as TipoMonstruo]={...base,nombre:j.nombre,vida:j.vida,dano:j.dano,defensa:2,vision:22};}
for(const [id,nombre]of [['forma_fija','Cámara de los Núcleos'],['proyeccion_nath','Conducto del Borde de Astra']] as const)AVENTURAS.push({id,nombre,tipo:'reino',descripcion:'Mecanismo alterado fuera de los asentamientos. Regreso seguro y solución técnica disponibles.',color:'#a4a0b5',roca:'#77747e',luz:'#b8a4ca',dificultad:4,espacial:false,minerales:['cuarzo'],monstruos:[id],niveles:1});


export const MINERALES:Record<MineralAventura,{nombre:string; color:string; hp:number; pico:number}> = {
 piedra:{nombre:'Piedra',color:'#b2aaa1',hp:8,pico:0},carbon:{nombre:'Carbón',color:'#454052',hp:12,pico:0},
 cobre:{nombre:'Cobre',color:'#df9b72',hp:16,pico:0},hierro:{nombre:'Hierro',color:'#bdc8cc',hp:24,pico:1},
 oro:{nombre:'Oro',color:'#e8cb7a',hp:34,pico:2},cuarzo:{nombre:'Cuarzo',color:'#ecdce8',hp:18,pico:0},
 rubi:{nombre:'Rubí',color:'#d86c87',hp:36,pico:2},jade:{nombre:'Jade',color:'#81c69c',hp:30,pico:1},
 obsidiana:{nombre:'Obsidiana',color:'#61536d',hp:42,pico:3},plata:{nombre:'Plata',color:'#d3daeb',hp:30,pico:1},
 titanio:{nombre:'Titanio',color:'#9daeca',hp:48,pico:3},meteorita:{nombre:'Meteorita',color:'#a87d9b',hp:44,pico:2},
 cristal_astral:{nombre:'Cristal astral',color:'#b8a4ee',hp:52,pico:4},polvo_estelar:{nombre:'Polvo estelar',color:'#e8cce9',hp:36,pico:2},
 estano:{nombre:'Estaño',color:'#c9cfc4',hp:18,pico:0},mitrilo:{nombre:'Mitrilo',color:'#8fe0ea',hp:56,pico:4},amatista:{nombre:'Amatista',color:'#b07ee0',hp:22,pico:0},
 topacio:{nombre:'Topacio',color:'#f2b84a',hp:26,pico:1},aguamarina:{nombre:'Aguamarina',color:'#6fd3e6',hp:28,pico:1},esmeralda:{nombre:'Esmeralda',color:'#3fc27a',hp:34,pico:2},
 diamante:{nombre:'Diamante',color:'#eaf8ff',hp:50,pico:3},geoda:{nombre:'Geoda',color:'#a99c8e',hp:16,pico:0},geoda_helada:{nombre:'Geoda helada',color:'#a8c8dc',hp:22,pico:1},
 geoda_magma:{nombre:'Geoda de magma',color:'#b0624a',hp:30,pico:2},geoda_omni:{nombre:'Geoda omni',color:'#b49ad8',hp:40,pico:3},
};
export interface NodoAventura extends PuntoAventura { id:string; mineral:MineralAventura; hp:number; hpMax:number; cantidad:number; agotado:boolean }
export interface MonstruoAventura extends PuntoAventura {
 patron?:PatronJefe;
 id:string; tipo:TipoMonstruo; hp:number; hpMax:number; fase:FaseMonstruo; tiempoFase:number; invulnerable:number;
 origen:PuntoAventura; objetivo:PuntoAventura; direccion:PuntoAventura; retroceso:PuntoAventura; patrulla:number; vivo:boolean;
}
export interface BotinAventura extends PuntoAventura { id:string; articulo:string; cantidad:number }
export interface EntradaAventura extends PuntoAventura { id:string; tipo:'retorno'|'descenso'; etiqueta:string }
export interface SituacionAventura extends PuntoAventura { id:string; tipo:'campamento'|'geoda'|'baliza'|'cofre'; resuelta:boolean; nombre:string }
export interface ChunkAventura { x:number; z:number; ancho:number; fondo:number }
export interface InstanciaAventura {
 id:string; destinoId:string; nivel:number; semilla:number; revision:number;
 suelos:Record<string,SueloAventura>; chunks:Record<string,ChunkAventura>; nodos:NodoAventura[]; monstruos:MonstruoAventura[];
 botin:BotinAventura[]; entradas:EntradaAventura[]; situaciones:SituacionAventura[]; inicio:PuntoAventura;
 /** Solo mientras se genera un piso de la mina. */
 cofreReclamado?:boolean;
}
export interface EstadoAventura {
 jefes?:string[];
 /** Campos opcionales para guardar V5 anteriores; los efectos solo avanzan en expedición activa. */
 proyectiles?:ProyectilArma[]; invocacion?:InvocacionArma|null; dominioArmas?:Partial<Record<ModoArma,number>>;
 /** Solo Minas de Celia: pisos con parada de ascensor, cofres abiertos y visitas (cambian el plano de cada piso). */
 ascensor?:number[]; cofresMina?:number[]; visitasMina?:number;
 version:1; semilla:number; destinoActual:string|null; instanciaActual:string|null; instancias:Record<string,InstanciaAventura>;
 retorno:PuntoAventura|null; descubrimientos:string[]; profundidad:Record<string,number>; oxigeno:number;
 avisoOxigeno:number; invulnerable:number; enfriamientoGolpe:number; secuencia:number; derrotados:number; mineralesExtraidos:number;
}
export interface ResultadoAventura { cofre?:number; ok:boolean; mensaje:string; posicion?:PuntoAventura; botin?:{articulo:string;cantidad:number}; dano?:number; destruido?:boolean; vida?:number; energia?:number; oxigeno?:number }
export interface JugadorAventura extends PuntoAventura { vida?:number; defensa?:number }
export interface ResultadoPaso { dano:number; empuje?:PuntoAventura; avisos:string[]; salidaSegura?:PuntoAventura; bajasArma?:number; experienciaArma?:number }
export type ModoArma='espada'|'arco'|'baston'|'sello_fuego'|'sello_agua'|'sello_tierra'|'sello_aire';
export const ARMAS_AVENTURA:Record<ModoArma,{nombre:string;alcance:number;energia:number;espera:number;dano:number;velocidad:number}>={
 espada:{nombre:'Espada',alcance:2.1,energia:1,espera:.42,dano:10,velocidad:0},
 arco:{nombre:'Arco',alcance:8,energia:1,espera:.6,dano:12,velocidad:11},
 baston:{nombre:'Bastón',alcance:6,energia:3,espera:.8,dano:17,velocidad:8},
 sello_fuego:{nombre:'Invocación de fuego',alcance:5,energia:10,espera:1,dano:10,velocidad:8},
 sello_agua:{nombre:'Invocación de agua',alcance:5,energia:10,espera:1,dano:8,velocidad:7},
 sello_tierra:{nombre:'Invocación de tierra',alcance:4,energia:10,espera:1,dano:12,velocidad:6},
 sello_aire:{nombre:'Invocación de aire',alcance:6,energia:10,espera:1,dano:7,velocidad:12},
};
export interface ProyectilArma extends PuntoAventura { id:number;modo:ModoArma;direccion:PuntoAventura;restante:number;dano:number }
export interface InvocacionArma extends PuntoAventura { modo:ModoArma;restante:number;espera:number;dano:number }
export function modoDeArma(id:string|undefined):ModoArma {
 if(id==='arco_ribera')return 'arco';if(id==='baston_cuarzo')return 'baston';
 return id&&Object.hasOwn(ARMAS_AVENTURA,id)?id as ModoArma:'espada';
}
export function rangoArma(e:EstadoAventura,modo:ModoArma){return Math.min(3,Math.floor((e.dominioArmas?.[modo]??0)/30));}
export type ColisionAventura = (x:number,z:number)=>boolean;
const clave = (x:number,z:number)=>`${Math.floor(x)},${Math.floor(z)}`;
const distancia = (a:PuntoAventura,b:PuntoAventura)=>Math.hypot(a.x-b.x,a.z-b.z);
const clamp = (v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
const bien = (mensaje:string,extra:Partial<ResultadoAventura>={}):ResultadoAventura=>({ok:true,mensaje,...extra});
const mal = (mensaje:string):ResultadoAventura=>({ok:false,mensaje});
function semillaTexto(texto:string,base:number){let n=base>>>0;for(let i=0;i<texto.length;i++)n=Math.imul(n^texto.charCodeAt(i),16777619);return n>>>0;}
function azarSemilla(seed:number){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=Math.imul(s^(s>>>15),1|s);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};}
/* ── Minas de Celia al estilo Stardew ─────────────────────────────────────────────────────────────────────
 * Cada piso se arma al azar cada vez que se entra. La escalera al siguiente piso está escondida bajo una roca (o la
 * deja un monstruo); los pisos múltiplos de 10 hasta el 100 traen un cofre y la escalera a la vista. El ascensor se
 * abre solo cada 5 pisos hasta el 100; desde ahí, en la caverna sin fondo, se construye una estación cada 25 pisos. */
export const MINA='mina_celia',FONDO_MINA=100;
export type TemaMina='tierra'|'hielo'|'lava'|'fondo'|'caverna';
export type VarianteMina='normal'|'hongos'|'cristal'|'cofre';
export const temaMina=(nivel:number):TemaMina=>nivel<40?'tierra':nivel<80?'hielo':nivel<FONDO_MINA?'lava':nivel===FONDO_MINA?'fondo':'caverna';
export function varianteMina(nivel:number,semilla:number):VarianteMina{
 if(nivel%10===0&&nivel<=FONDO_MINA)return 'cofre';const r=azarSemilla(semillaTexto('variante:'+nivel,semilla))();
 if(nivel>=30&&nivel<FONDO_MINA&&r<.12)return 'hongos';if(nivel>FONDO_MINA&&r<.2)return 'cristal';return 'normal';
}
const MONSTRUOS_MINA:Record<TemaMina,TipoMonstruo[]>={tierra:['gelatina','escarabajo','murcielago'],hielo:['murcielago','gelatina','sombra'],lava:['ascua','guardian','escarabajo'],fondo:['guardian','ascua'],caverna:['sombra','centinela','guardian','ascua','murcielago']};
/** Peso de cada mineral en los pisos (los raros salen menos, pero abundan más mientras más hondo). */
const PESO_MINERAL:Record<MineralAventura,number>={piedra:3,carbon:2.4,cobre:3,cuarzo:1.4,hierro:2.6,plata:1.6,jade:.8,oro:1.8,rubi:.7,obsidiana:1,titanio:1.6,meteorita:1,polvo_estelar:.8,cristal_astral:.55,estano:2.2,mitrilo:1.2,amatista:.5,topacio:.5,aguamarina:.5,esmeralda:.45,diamante:.35,geoda:.8,geoda_helada:.8,geoda_magma:.8,geoda_omni:.7};
/** Costo de una estación de ascensor en la caverna (piso 125, 150, 175…). */
export function costoEstacion(nivel:number):Record<string,number>{const k=Math.max(1,Math.round((nivel-FONDO_MINA)/25));return {piedra:60+k*20,madera:30+k*10,lingote_hierro:6+k*2,lingote_oro:2+k,engranaje:2+k};}
export function estacionPendiente(e:EstadoAventura):number|null{const i=instanciaAventura(e);if(!i||i.destinoId!==MINA||i.nivel<=FONDO_MINA||i.nivel%25!==0||(e.ascensor??[]).includes(i.nivel))return null;return i.nivel;}
export function pisosAscensor(e:EstadoAventura){return [1,...(e.ascensor??[])];}
function semillaMina(e:EstadoAventura){e.visitasMina=(e.visitasMina??0)+1;return (e.semilla^Math.imul(e.visitasMina,2654435761))>>>0;}
function borrarPisosMina(e:EstadoAventura){for(const k of Object.keys(e.instancias))if(k.startsWith(MINA+':'))delete e.instancias[k];}
function revelarEscalera(e:EstadoAventura,i:InstanciaAventura,p:PuntoAventura,probabilidad:number){
 if(i.destinoId!==MINA||i.entradas.some(x=>x.tipo==='descenso'))return false;
 const x=Math.floor(p.x),z=Math.floor(p.z);if(i.suelos[clave(x,z)]!=='suelo')return false;
 if(azarSemilla(semillaTexto(`${i.id}:escalera:${e.secuencia}:${x},${z}`,i.semilla))()>=probabilidad)return false;
 i.entradas.push({id:`${i.id}:descenso`,tipo:'descenso',etiqueta:`Escalera al piso ${i.nivel+1}`,x:x+.5,z:z+.5});i.revision++;return true;
}
export function construirAscensor(e:EstadoAventura,jugador:PuntoAventura):ResultadoAventura{
 const n=estacionPendiente(e),i=instanciaAventura(e);if(!n||!i)return mal('Aquí no se puede construir una estación de ascensor.');
 if(distancia(jugador,i.inicio)>3.5)return mal('Construye la estación junto a la escalera de llegada.');
 e.ascensor=[...(e.ascensor??[]),n].sort((a,b)=>a-b);i.revision++;return bien(`Estación del piso ${n} lista: ya puedes bajar directo desde la entrada.`);
}

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
 if(destinoId!==MINA)return [...d.minerales];
 const tema=temaMina(nivel);
 const desde=(n:number,...m:MineralAventura[])=>nivel>=n?m:[];
 if(tema==='tierra')return ['piedra','carbon','cobre','cuarzo',...desde(5,'estano'),...desde(8,'geoda'),...desde(10,'amatista'),...desde(15,'hierro'),...desde(25,'jade')];
 if(tema==='hielo')return ['piedra','carbon','hierro','plata','cuarzo','jade','estano','topacio','aguamarina','geoda_helada',...desde(60,'oro')];
 if(tema==='lava'||tema==='fondo')return ['piedra','carbon','hierro','oro','plata','rubi','obsidiana','esmeralda','geoda_magma'];
 return ['oro','rubi','obsidiana','titanio','meteorita','polvo_estelar','esmeralda','geoda_omni',...desde(120,'diamante'),...desde(125,'cristal_astral'),...desde(150,'mitrilo')];
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
 const mina=d.id===MINA,nivel=inst.nivel;
 for(const c of centros){const ancho=5+Math.floor(rand()*4)+(mina?Math.floor(rand()*4):0),alto=5+Math.floor(rand()*4)+(mina?Math.floor(rand()*4):0);
  // En la mina hay cavernas redondas además de salas cuadradas
  if(mina&&rand()<.5){const rx=ancho/2,rz=alto/2;for(let zz=Math.floor(c.z-rz);zz<=c.z+rz;zz++)for(let xx=Math.floor(c.x-rx);xx<=c.x+rx;xx++)if(((xx-c.x)/rx)**2+((zz-c.z)/rz)**2<=1&&xx>=x0+1&&xx<=x0+30&&zz>=z0+1&&zz<=z0+30)piso(xx,zz);}
  else sala(c.x-2,c.z-2,Math.min(ancho,x0+30-(c.x-2)),Math.min(alto,z0+30-(c.z-2)));}
 for(let n=1;n<centros.length;n++)corredor(centros[n-1],centros[n]);
 for(const p of [{x:x0,z:z0+16},{x:x0+31,z:z0+16},{x:x0+16,z:z0},{x:x0+16,z:z0+31}])corredor(centros[1],p);
 // Pilares de roca sueltos dentro de las salas: cada uno rodeado de piso, así nunca cierran un camino
 if(mina)for(let n=0;n<14;n++){const x=x0+3+Math.floor(rand()*26),z=z0+3+Math.floor(rand()*26);if(distancia({x,z},centros[0])<4||distancia({x,z},centros[1])<2||distancia({x,z},centros[2])<2)continue;
  let rodeado=true;for(let dz=-1;dz<=1&&rodeado;dz++)for(let dx=-1;dx<=1;dx++)if(inst.suelos[clave(x+dx,z+dz)]!=='suelo'){rodeado=false;break;}if(rodeado)inst.suelos[clave(x,z)]='muro';}
 // Occupants stay clear of the landing and use only open room interiors.
 const libres:PuntoAventura[]=[];
 for(let z=z0+2;z<z0+30;z++)for(let x=x0+2;x<x0+30;x++)if(inst.suelos[clave(x,z)]==='suelo'&&inst.suelos[clave(x+1,z)]==='suelo'&&inst.suelos[clave(x-1,z)]==='suelo'&&inst.suelos[clave(x,z+1)]==='suelo'&&inst.suelos[clave(x,z-1)]==='suelo'&&distancia({x,z},centros[0])>4)libres.push({x:x+.5,z:z+.5});
 for(let i=libres.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[libres[i],libres[j]]=[libres[j],libres[i]];}
 const tomar=()=>libres.pop()??{x:x0+16.5,z:z0+16.5};
 const minerales=mineralesPorProfundidad(d.id,inst.nivel);
 const pesoTotal=minerales.reduce((t,m)=>t+PESO_MINERAL[m]*(mina&&MINERALES[m].pico>=2?1+Math.max(0,nivel-FONDO_MINA)/150:1),0);
 const sortear=()=>{let r=rand()*pesoTotal;for(const m of minerales){r-=PESO_MINERAL[m]*(mina&&MINERALES[m].pico>=2?1+Math.max(0,nivel-FONDO_MINA)/150:1);if(r<=0)return m;}return minerales[minerales.length-1];};
 // Más hondo: más vetas, más mineral por veta y rocas más duras
 const vetas=mina?18+Math.min(22,Math.floor(nivel/6)):18;
 for(let n=0;n<vetas;n++){
  const mineral=n<minerales.length?minerales[n]:mina?sortear():minerales[Math.floor(rand()*minerales.length)],def=MINERALES[mineral],hp=def.hp+Math.min(inst.nivel-1,10)*2+(mina?Math.min(120,Math.floor(Math.max(0,nivel-12)*.5)):0);
  inst.nodos.push({id:`${inst.id}:${chunkKey}:n${n}`,...tomar(),mineral,hp,hpMax:hp,cantidad:Math.min(20,2+Math.floor(rand()*3)+(mina?Math.min(10,Math.floor(nivel/30)):0)),agotado:false});
 }
 const numero=d.tipo==='orbita'?2:5+Math.min(5,d.dificultad+Math.floor(inst.nivel/3));
 for(let n=0;n<numero;n++){
  const lista=mina?MONSTRUOS_MINA[temaMina(nivel)]:d.monstruos,tipo=lista[Math.floor(rand()*lista.length)],def=MONSTRUOS[tipo],p=tomar(),hp=def.vida+Math.min(25,(inst.nivel-1)*3)+(mina?Math.min(400,Math.floor(Math.max(0,nivel-10)*1.5)):0);
  inst.monstruos.push({id:`${inst.id}:${chunkKey}:m${n}`,tipo,...p,hp,hpMax:hp,fase:'reposo',tiempoFase:rand()*1.8,invulnerable:0,origen:{...p},objetivo:{...p},direccion:{x:0,z:1},retroceso:{x:0,z:0},patrulla:Math.floor(rand()*4),vivo:true});
 }
 const situacionTipo=d.espacial?'baliza':mina&&chunkKey==='0,0'&&varianteMina(nivel,inst.semilla)==='cofre'&&!inst.cofreReclamado?'cofre':(inst.nivel%2?'campamento':'geoda');
 inst.situaciones.push({id:`${inst.id}:${chunkKey}:s`,...centros[1],x:centros[1].x+.5,z:centros[1].z+.5,tipo:situacionTipo,nombre:situacionTipo==='campamento'?'Campamento tranquilo':situacionTipo==='baliza'?'Baliza de oxígeno':situacionTipo==='cofre'?'Cofre del piso '+nivel:'Geoda sellada',resuelta:false});
 inst.revision++;
}
export function generarInstancia(destinoId:string,semilla:number,nivel=1,opciones:{cofreReclamado?:boolean}={}):InstanciaAventura {
 const d=destinoAventura(destinoId);if(!d)throw new Error('Destino de aventura desconocido.');
 nivel=clamp(Math.floor(nivel),1,d.niveles);
 const id=`${destinoId}:${nivel}`,s=semillaTexto(id,semilla),inst:InstanciaAventura={id,destinoId,nivel,semilla:s,revision:0,suelos:{},chunks:{},nodos:[],monstruos:[],botin:[],entradas:[],situaciones:[],inicio:{x:-11.5,z:-11.5}};
 if(opciones.cofreReclamado)inst.cofreReclamado=true;
 generarChunk(inst,0,0,d);
 // Minas más grandes mientras más hondo: se suman regiones conectadas
 if(destinoId===MINA){const extra=nivel>100?3:nivel>50?2:nivel>15?1:0,orden:[number,number][]=[[1,0],[0,1],[1,1]];for(let k=0;k<extra;k++)generarChunk(inst,orden[k][0],orden[k][1],d);}
 if((destinoId.startsWith('confluencia_')&&nivel===3)||destinoId==='forma_fija'||destinoId==='proyeccion_nath'){
  for(let z=-14;z<=14;z++)for(let x=-14;x<=14;x++)inst.suelos[clave(x,z)]='suelo';
  inst.nodos=[];inst.situaciones=[];const tipo=(destinoId.startsWith('confluencia_')?'regulador_'+destinoId.slice(12):destinoId) as TipoMonstruo,p={x:.5,z:.5},hp=MONSTRUOS[tipo].vida;
  const m:MonstruoAventura={id:inst.id+':jefe',tipo,...p,hp,hpMax:hp,fase:'reposo',tiempoFase:0,invulnerable:0,origen:{...p},objetivo:{...p},direccion:{x:0,z:1},retroceso:{x:0,z:0},patrulla:0,vivo:true};m.patron=crearPatron(m);inst.monstruos=[m];
 }
 delete inst.cofreReclamado;
 inst.entradas.push({id:`${id}:salida`,tipo:'retorno',etiqueta:destinoId===MINA?'Subir a la entrada':'Regreso seguro',...inst.inicio});
 if(nivel<d.niveles&&(destinoId!==MINA||varianteMina(nivel,s)==='cofre'))inst.entradas.push({id:`${id}:descenso`,tipo:'descenso',etiqueta:d.tipo==='mina'?`Escalera al piso ${nivel+1}`:'Explorar la siguiente región',x:10.5,z:10.5});
 return inst;
}
export function ampliarAventura(e:EstadoAventura,cx:number,cz:number):ResultadoAventura {
 const i=instanciaAventura(e);if(!i)return mal('No estás en una expedición.');
 if(!Number.isInteger(cx)||!Number.isInteger(cz)||Math.abs(cx)>2||Math.abs(cz)>2)return mal('Esa región queda fuera de las balizas actuales.');
 if(i.monstruos.some(m=>esJefe(m.tipo)))return mal('Esta cámara tiene límites fijos y una baliza de regreso.');
 if(i.chunks[`${cx},${cz}`])return bien('Región ya cartografiada.');
 if(![[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dz])=>i.chunks[`${cx+dx},${cz+dz}`]))return mal('Primero descubre una región contigua.');
 generarChunk(i,cx,cz,destinoAventura(i.destinoId)!);return bien('Nueva región conectada a tus senderos.');
}
export function entrarAventura(e:EstadoAventura,destinoId:string,jugador:PuntoAventura,acceso:AccesoAventura={},piso=1):ResultadoAventura {
 if(e.destinoActual)return mal('Regresa a la granja antes de iniciar otra expedición.');
 const permitido=accesoAventura(destinoId,acceso);if(!permitido.ok)return permitido;
 if(destinoId!==MINA)piso=1;else if(!pisosAscensor(e).includes(piso))return mal('Ese piso todavía no tiene parada de ascensor.');
 const id=`${destinoId}:${piso}`;
 if(destinoId===MINA){borrarPisosMina(e);e.instancias[id]=generarInstancia(MINA,semillaMina(e),piso,{cofreReclamado:e.cofresMina?.includes(piso)});}
 else e.instancias[id]??=generarInstancia(destinoId,e.semilla);
 e.destinoActual=destinoId;e.instanciaActual=id;e.retorno={x:jugador.x,z:jugador.z};e.oxigeno=100;e.avisoOxigeno=0;e.invulnerable=2;e.enfriamientoGolpe=0;
 e.profundidad[destinoId]=Math.max(piso,e.profundidad[destinoId]??0);if(!e.descubrimientos.includes(destinoId))e.descubrimientos.push(destinoId);
 return bien(destinoId===MINA?`Minas de Celia · piso ${piso}. Busca la escalera bajo las rocas.`:`Llegaste a ${destinoAventura(destinoId)!.nombre}. La baliza te permite volver en cualquier momento.`,{posicion:{...e.instancias[id].inicio}});
}
/** Retorno de emergencia sin coste, pérdida de mochila ni requisitos: también funciona con un mapa corrupto. */
export function salirAventura(e:EstadoAventura):ResultadoAventura {
 e.proyectiles=[];e.invocacion=null;
 const posicion={...(e.retorno??{x:0,z:4})};if(e.destinoActual===MINA)borrarPisosMina(e);e.destinoActual=null;e.instanciaActual=null;e.retorno=null;e.invulnerable=0;e.enfriamientoGolpe=0;
 return bien('Regresaste con tus hallazgos a salvo.',{posicion});
}
export function descenderAventura(e:EstadoAventura,jugador:PuntoAventura):ResultadoAventura {
 const i=instanciaAventura(e);if(!i)return mal('No estás en una expedición.');
 const entrada=i.entradas.find(p=>p.tipo==='descenso');if(!entrada)return mal('Has llegado a la última región de este destino.');
 if(distancia(jugador,entrada)>2)return mal('Acércate a la baliza del siguiente piso.');
 const nivel=i.nivel+1,id=`${i.destinoId}:${nivel}`;
 if(i.destinoId===MINA){delete e.instancias[i.id];e.instancias[id]=generarInstancia(MINA,semillaMina(e),nivel,{cofreReclamado:e.cofresMina?.includes(nivel)});if(nivel%5===0&&nivel<=FONDO_MINA&&!(e.ascensor??[]).includes(nivel))e.ascensor=[...(e.ascensor??[]),nivel].sort((a,b)=>a-b);}
 else e.instancias[id]??=generarInstancia(i.destinoId,e.semilla,nivel);
 e.instanciaActual=id;e.invulnerable=2;e.proyectiles=[];e.invocacion=null;
 e.profundidad[i.destinoId]=Math.max(nivel,e.profundidad[i.destinoId]??0);
 const parada=i.destinoId===MINA&&nivel%5===0&&nivel<=FONDO_MINA?' Nueva parada de ascensor.':i.destinoId===MINA&&nivel>FONDO_MINA&&nivel%25===0&&!(e.ascensor??[]).includes(nivel)?' Aquí puedes construir una estación de ascensor.':'';
 return bien(i.destinoId===MINA?`Piso ${nivel}.${parada}`:`Región ${nivel} descubierta.`,{posicion:{...e.instancias[id].inicio}});
}
export function esTransitableAventura(e:EstadoAventura,x:number,z:number,radio=.28){
 const i=instanciaAventura(e);if(!i||!Number.isFinite(x)||!Number.isFinite(z))return false;
 return [x-radio,x+radio].every(xx=>[z-radio,z+radio].every(zz=>i.suelos[clave(xx,zz)]==='suelo'));
}
function lineaVision(i:InstanciaAventura,a:PuntoAventura,b:PuntoAventura){const n=Math.ceil(distancia(a,b)*4);for(let s=1;s<=n;s++){const t=s/n;if(i.suelos[clave(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t)]!=='suelo')return false;}return true;}
/** Acceso físico compartido para recuperar un cuaderno en situaciones ya existentes. */
export function puedeInvestigar(e:EstadoAventura,id:string,jugador:PuntoAventura){const i=instanciaAventura(e),s=i?.situaciones.find(s=>s.id===id);return !!i&&!!s&&esTransitableAventura(e,jugador.x,jugador.z)&&distancia(jugador,s)<=2.3&&lineaVision(i,jugador,s);}
/** El anfitrión comprueba el aprendizaje y prepara el pago antes de llamar. No altera vetas ni botín. */
export function sondearEscalera(e:EstadoAventura,jugador:PuntoAventura):ResultadoAventura {
 const i=instanciaAventura(e);if(!i||i.destinoId!==MINA||i.nivel>=100000)return mal('La prospección requiere un piso de la mina con otra bajada.');
 if(i.entradas.some(p=>p.tipo==='descenso'))return mal('Ya hay una escalera en este piso.');if(!esTransitableAventura(e,jugador.x,jugador.z))return mal('Busca un lugar transitable para prospectar.');
 const ocupadas=new Set([...i.nodos.filter(n=>!n.agotado),...i.monstruos.filter(m=>m.vivo),...i.entradas,...i.situaciones].map(p=>clave(p.x,p.z))),candidatas:PuntoAventura[]=[];
 for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const p={x:Math.floor(jugador.x)+dx+.5,z:Math.floor(jugador.z)+dz+.5};if(esTransitableAventura(e,p.x,p.z)&&!ocupadas.has(clave(p.x,p.z))&&lineaVision(i,jugador,p))candidatas.push(p);}
 candidatas.sort((a,b)=>distancia(a,jugador)-distancia(b,jugador));const p=candidatas[0];if(!p||!revelarEscalera(e,i,p,1))return mal('No hay espacio despejado cercano para marcar la escalera.');
 return bien('Descubriste la escalera al piso '+(i.nivel+1)+'. Acércate a ella para bajar.');
}
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
 const armas=pasoArmas(e,dt,jugador);r.bajasArma=armas.bajas;r.experienciaArma=armas.experiencia;
 for(const m of i.monstruos){
  if(!m.vivo)continue;
  if(esJefe(m.tipo)){const golpe=pasoJefe(m,dt,jugador,i.inicio,p=>esTransitableAventura(e,p.x,p.z));if(golpe.dano&&e.invulnerable<=0){r.dano+=golpe.dano;e.invulnerable=.95;if(golpe.empuje)r.empuje=golpe.empuje;}continue;}
  m.invulnerable=Math.max(0,m.invulnerable-dt);
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
    const fuerza=i.destinoId===MINA?1+Math.min(3,(i.nivel-1)/60):1,dano=Math.max(1,Math.round(def.dano*fuerza)-Math.max(0,jugador.defensa??0));r.dano+=dano;e.invulnerable=.95;r.empuje={x:v.x*.5,z:v.z*.5};
   }
   if(m.tiempoFase<=0)fase(m,'recuperacion',def.recuperacion);
  }else if(m.fase==='recuperacion'&&m.tiempoFase<=0)fase(m,ve&&!cercaSalida?'persecucion':'reposo',ve?3:1.5);
 }
 if((jugador.vida??100)-r.dano<=0){r.salidaSegura=salirAventura(e).posicion;r.avisos.push('La baliza te llevó a casa para descansar. Tu mochila sigue contigo.');}
 return r;
}
function soltar(e:EstadoAventura,i:InstanciaAventura,p:PuntoAventura,articulo:string,cantidad:number){i.botin.push({id:`botin_aventura_${++e.secuencia}`,x:p.x,z:p.z,articulo,cantidad});i.revision++;}
function botinMonstruo(e:EstadoAventura,i:InstanciaAventura,m:MonstruoAventura){e.derrotados++;if(esJefe(m.tipo)){e.jefes??=[];if(e.jefes.includes(m.tipo))return;e.jefes.push(m.tipo);}soltar(e,i,m,MONSTRUOS[m.tipo].botin,Math.min(20,2+Math.min(3,Math.floor(i.nivel/3))+(i.destinoId===MINA?Math.floor(i.nivel/40):0)));revelarEscalera(e,i,m,.12);}
function aprenderArma(e:EstadoAventura,modo:ModoArma){e.dominioArmas??={};e.dominioArmas[modo]=Math.min(90,(e.dominioArmas[modo]??0)+1);}
function proyectil(e:EstadoAventura,modo:ModoArma,origen:PuntoAventura,objetivo:PuntoAventura,dano:number){
 const def=ARMAS_AVENTURA[modo];e.proyectiles??=[];
 e.proyectiles.push({id:++e.secuencia,modo,x:origen.x,z:origen.z,direccion:orientacion(origen,objetivo),restante:def.alcance/def.velocidad,dano});
}
/** Apuntar fija la dirección; el impacto se resuelve en pasos activos, no al pulsar ni fuera del juego. */
export function atacarConArma(e:EstadoAventura,id:string,jugador:PuntoAventura,modo:ModoArma,nivel=0,extra=0):ResultadoAventura {
 if(!Object.hasOwn(ARMAS_AVENTURA,modo)||!esTransitableAventura(e,jugador.x,jugador.z))return mal('Arma o posición de combate inválida.');
 if(modo==='espada'){const r=golpearMonstruo(e,id,jugador,nivel,extra+rangoArma(e,modo)*2);if(r.ok)aprenderArma(e,modo);return r;}
 const i=instanciaAventura(e),m=i?.monstruos.find(m=>m.id===id&&m.vivo),def=ARMAS_AVENTURA[modo];if(!i||!m)return mal('La criatura ya no está aquí.');
 if(e.enfriamientoGolpe>0)return mal('Espera a preparar tu arma.');
 if(distancia(jugador,m)>def.alcance||!lineaVision(i,jugador,m))return mal('Apunta dentro del alcance y por una trayectoria despejada.');
 if((e.proyectiles?.length??0)>=24)return mal('Espera a que termine la ráfaga.');
 const dano=def.dano+rangoArma(e,modo)*2+clamp(extra,0,50);
 if(modo.startsWith('sello_')){if(e.invocacion)return mal('La invocación actual debe terminar antes de convocar otra.');e.invocacion={modo,x:jugador.x,z:jugador.z,restante:8,espera:0,dano};}
 else proyectil(e,modo,jugador,m,dano);
 e.enfriamientoGolpe=def.espera;i.revision++;
 return bien(modo.startsWith('sello_')?'Patrón elemental convocado durante ocho segundos.':'Proyectil en camino; puede fallar si el objetivo se mueve.');
}
function pasoArmas(e:EstadoAventura,dt:number,jugador:PuntoAventura){
 const i=instanciaAventura(e);if(!i)return {bajas:0,experiencia:0};let bajas=0,experiencia=0;const inv=e.invocacion;
 if(inv){
  inv.restante=Math.max(0,inv.restante-dt);inv.espera=Math.max(0,inv.espera-dt);
  if(inv.restante<=0||distancia(inv,jugador)>10)e.invocacion=null;
  else if(inv.espera===0&&(e.proyectiles?.length??0)<24){
   const def=ARMAS_AVENTURA[inv.modo],objetivo=i.monstruos.filter(m=>m.vivo&&distancia(inv,m)<=def.alcance&&lineaVision(i,inv,m)).sort((a,b)=>distancia(inv,a)-distancia(inv,b))[0];
   if(objetivo){proyectil(e,inv.modo,inv,objetivo,inv.dano);inv.espera=1;}
  }
 }
 const pendientes:ProyectilArma[]=[];
 for(const p of e.proyectiles??[]){
  const tiempo=Math.min(dt,p.restante),def=ARMAS_AVENTURA[p.modo],pasos=Math.max(1,Math.ceil(tiempo*def.velocidad/.15));let terminado=false;
  for(let n=0;n<pasos&&!terminado;n++){
   const x=p.x+p.direccion.x*def.velocidad*tiempo/pasos,z=p.z+p.direccion.z*def.velocidad*tiempo/pasos;
   if(i.suelos[clave(x,z)]!=='suelo'){terminado=true;break;}p.x=x;p.z=z;
   const m=i.monstruos.find(m=>m.vivo&&distancia(m,p)<.55);if(!m)continue;terminado=true;
   if(m.invulnerable>0)continue;
   m.hp=Math.max(0,m.hp-Math.max(1,p.dano-MONSTRUOS[m.tipo].defensa));m.invulnerable=.28;aprenderArma(e,p.modo);
   const empuje=p.modo==='sello_tierra'?7:p.modo==='sello_agua'?3:2;m.retroceso={x:p.direccion.x*empuje,z:p.direccion.z*empuje};
   if(m.hp===0){m.vivo=false;bajas++;experiencia+=Math.ceil(MONSTRUOS[m.tipo].vida/2);botinMonstruo(e,i,m);}
   else fase(m,'recuperacion',p.modo==='sello_agua'?.8:.55);i.revision++;
  }
  p.restante=Math.max(0,p.restante-tiempo);if(!terminado&&p.restante>0)pendientes.push(p);
 }
 e.proyectiles=pendientes;return {bajas,experiencia};
}
export function golpearMonstruo(e:EstadoAventura,id:string,jugador:PuntoAventura,nivelEspada=0,danoExtra=0):ResultadoAventura {
 const i=instanciaAventura(e),m=i?.monstruos.find(m=>m.id===id&&m.vivo);if(!i||!m)return mal('La criatura ya no está aquí.');
 if(e.enfriamientoGolpe>0)return mal('Espera a terminar el golpe.');if(m.invulnerable>0)return mal('La criatura está recuperándose del impacto.');
 if(distancia(jugador,m)>2.1||!lineaVision(i,jugador,m))return mal('Acércate a la criatura por un camino despejado.');
 const nivel=clamp(Math.floor(nivelEspada),0,6),dano=Math.max(1,10+nivel*7+clamp(danoExtra,0,50)-MONSTRUOS[m.tipo].defensa);
 m.hp=Math.max(0,m.hp-dano);m.invulnerable=.28;e.enfriamientoGolpe=.42;m.retroceso=orientacion(jugador,m);m.retroceso.x*=5;m.retroceso.z*=5;
 if(m.hp===0){m.vivo=false;botinMonstruo(e,i,m);}
 else fase(m,'recuperacion',Math.max(.55,MONSTRUOS[m.tipo].recuperacion*.55));
 return bien(m.vivo?`${MONSTRUOS[m.tipo].nombre}: ${m.hp} / ${m.hpMax}`:'La criatura dejó recursos para recoger.',{dano,destruido:!m.vivo});
}
export function golpearNodo(e:EstadoAventura,id:string,jugador:PuntoAventura,nivelPico=0):ResultadoAventura {
 const i=instanciaAventura(e),n=i?.nodos.find(n=>n.id===id&&!n.agotado);if(!i||!n)return mal('Esta veta ya está agotada.');
 if(e.enfriamientoGolpe>0)return mal('Espera a terminar el golpe.');if(distancia(jugador,n)>2.3||!lineaVision(i,jugador,n))return mal('Acércate a la veta por un camino despejado.');
 const def=MINERALES[n.mineral],nivel=clamp(Math.floor(nivelPico),0,6);if(nivel<def.pico)return mal(`${def.nombre} necesita un pico de nivel ${def.pico}.`);
 const dano=6+nivel*5;n.hp=Math.max(0,n.hp-dano);e.enfriamientoGolpe=.36;
 if(n.hp===0){n.agotado=true;e.mineralesExtraidos++;soltar(e,i,n,n.mineral,n.cantidad);const quedan=i.nodos.filter(o=>!o.agotado).length;revelarEscalera(e,i,n,quedan===0?1:.05+1.2/(quedan+1));}
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
 if(s.tipo==='cofre'){const lista=mineralesPorProfundidad(i.destinoId,i.nivel);for(const m of lista.slice(-3))soltar(e,i,s,m,Math.min(20,4+Math.floor(i.nivel/10)));e.cofresMina=[...(e.cofresMina??[]),i.nivel].sort((a,b)=>a-b);return bien(`¡Cofre del piso ${i.nivel}! Recoge lo que trae.`,{cofre:i.nivel});}
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
 if(r.dominioArmas!==undefined&&(!registro(r.dominioArmas)||Object.keys(r.dominioArmas).length>7||Object.entries(r.dominioArmas).some(([k,v])=>!Object.hasOwn(ARMAS_AVENTURA,k)||!entero(v,0,90))))return 'Dominio de armas inválido.';
 const modo=(v:unknown):v is ModoArma=>typeof v==='string'&&Object.hasOwn(ARMAS_AVENTURA,v);
 const puntoArma=(v:unknown):boolean=>punto(v);
 if(r.proyectiles!==undefined){
  if(!Array.isArray(r.proyectiles)||r.proyectiles.length>24)return 'Ráfaga de armas inválida.';
  const vistos=new Set<number>();
  for(const p of r.proyectiles){if(!registro(p)||!puntoArma(p)||!modo(p.modo)||p.modo==='espada'||!entero(p.id,1,r.secuencia)||vistos.has(p.id)||!puntoArma(p.direccion)||Math.abs(Math.hypot(p.direccion.x,p.direccion.z)-1)>.001||!numero(p.restante,.000001,2)||!numero(p.dano,1,100))return 'Proyectil de arma inválido.';vistos.add(p.id);}
 }
 if(r.invocacion!==undefined&&r.invocacion!==null){const p=r.invocacion;if(!registro(p)||!puntoArma(p)||!modo(p.modo)||!p.modo.startsWith('sello_')||!numero(p.restante,.000001,8)||!numero(p.espera,0,1)||!numero(p.dano,1,100))return 'Invocación elemental inválida.';}
 if(r.destinoActual===null&&((r.proyectiles?.length??0)>0||r.invocacion))return 'Efecto de arma fuera de expedición.';
 if(r.jefes!==undefined&&(!Array.isArray(r.jefes)||r.jefes.length>Object.keys(JEFES).length||new Set(r.jefes).size!==r.jefes.length||r.jefes.some((id:unknown)=>typeof id!=='string'||!esJefe(id))))return 'Registro de jefes inválido.';
 if(!entero(r.semilla,0,0xffffffff))return 'Semilla de expediciones inválida.';
 for(const campo of ['ascensor','cofresMina'])if(r[campo]!==undefined&&(!Array.isArray(r[campo])||r[campo].length>5000||new Set(r[campo]).size!==r[campo].length||r[campo].some((n:unknown)=>!entero(n,1,100000))))return 'Paradas o cofres de la mina inválidos.';
 if(r.visitasMina!==undefined&&!entero(r.visitasMina))return 'Visitas a la mina inválidas.';
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
  for(const m of i.monstruos)if(!patronValido(m)||!Object.hasOwn(MONSTRUOS,m.tipo)||!numero(m.hpMax,.001,1000)||!numero(m.hp,0,m.hpMax)||typeof m.vivo!=='boolean'||m.vivo!==(m.hp>0)||!['reposo','patrulla','alerta','persecucion','anticipacion','ataque','recuperacion'].includes(m.fase)||!numero(m.tiempoFase,-.3,10)||!numero(m.invulnerable,0,1)||!punto(m.origen)||!punto(m.objetivo)||!punto(m.direccion)||!punto(m.retroceso)||!entero(m.patrulla,0,3))return `Criatura inválida: ${id}.`;
  for(const b of i.botin){if((!Object.hasOwn(MINERALES,b.articulo)&&b.articulo!=='fibra')||!entero(b.cantidad,1,99)||idsBotin.has(b.id))return `Botín inválido o duplicado: ${id}.`;idsBotin.add(b.id);const sec=/^botin_aventura_(\d+)$/.exec(b.id);if(sec&&Number(sec[1])>r.secuencia)return 'Secuencia de hallazgos inválida.';}
  if(i.entradas.filter((p:any)=>p.tipo==='retorno').length!==1||(d.id===MINA?i.entradas.filter((p:any)=>p.tipo==='descenso').length>1:i.entradas.filter((p:any)=>p.tipo==='descenso').length!==(i.nivel<d.niveles?1:0))||i.entradas.some((p:any)=>!['retorno','descenso'].includes(p.tipo)||!texto(p.etiqueta)))return `Balizas inválidas: ${id}.`;
  for(const s of i.situaciones)if(!['campamento','geoda','baliza','cofre'].includes(s.tipo)||typeof s.resuelta!=='boolean'||!texto(s.nombre))return `Hallazgo inválido: ${id}.`;
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

export function migrarPracticasElementales(e:EstadoAventura){if(!e?.instancias)return;const equivalencias:Record<string,string>={fuego:'ascua',agua:'gelatina',tierra:'guardian',aire:'centinela'};for(const i of Object.values(e.instancias))if(i.destinoId.startsWith('confluencia_')){const elemento=i.destinoId.slice(12);for(const m of i.monstruos??[])if(m.tipo===equivalencias[elemento])m.tipo=('constructo_'+elemento) as TipoMonstruo;}}
export function reintentarJefe(e:EstadoAventura,jugador:PuntoAventura):ResultadoAventura{const i=instanciaAventura(e);if(!i||distancia(jugador,i.inicio)>2.2||!i.monstruos.some(m=>esJefe(m.tipo)))return mal('Reinicia desde la baliza de una cámara de jefe.');for(const m of i.monstruos)if(esJefe(m.tipo)){m.hp=m.hpMax;m.vivo=true;m.fase='reposo';m.tiempoFase=0;m.invulnerable=0;m.x=m.origen.x;m.z=m.origen.z;m.patron=crearPatron(m);}e.proyectiles=[];e.invocacion=null;e.invulnerable=0;e.enfriamientoGolpe=0;i.revision++;return bien('Mecanismo reiniciado. Conservas mochila y actas; su botín único no vuelve a entregarse.');}
