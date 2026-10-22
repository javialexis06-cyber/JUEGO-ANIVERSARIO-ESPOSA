import type {DefNivel,DefPlanta,DefZombi} from '../tipos';

/** Primera aventura de PvZ 1 para PC; fuentes y límites en el registro del mundo de niebla. */
export const PLANTAS_NIEBLA:DefPlanta[]=[
 {id:'marseta',nombre:'Marseta',sol:0,recarga:30,vida:300,familia:'acuatica',nocturna:true,agua:'solo',desbloqueo:'3-10',descripcion:'Lanza esporas a corta distancia desde el agua.',datos:{dano:20,cada:1.425,alcance:240}},
 {id:'planterna',nombre:'Planterna',sol:25,recarga:30,vida:300,familia:'apoyo',desbloqueo:'4-1',descripcion:'Ilumina las casillas cercanas que cubre la niebla.'},
 {id:'cactus',nombre:'Cactus',sol:125,recarga:7.5,vida:300,familia:'tiradora',desbloqueo:'4-2',descripcion:'Dispara pinchos y se eleva para alcanzar globos.',datos:{dano:20,cada:1.425}},
 {id:'trebolador',nombre:'Trebolador',sol:100,recarga:7.5,vida:300,familia:'apoyo',desbloqueo:'4-3',descripcion:'Sopla la niebla y expulsa a los enemigos que vuelan.',datos:{retardo:.5,desaparece:2.5}},
 {id:'bipetidora',nombre:'Bipetidora',sol:125,recarga:7.5,vida:300,familia:'tiradora',desbloqueo:'4-5',descripcion:'Dispara hacia delante y una ráfaga doble hacia atrás.',datos:{dano:20,cada:1.425,intervaloRafaga:.1}},
 {id:'frustrella',nombre:'Frustrella',sol:125,recarga:7.5,vida:300,familia:'tiradora',desbloqueo:'4-6',descripcion:'Lanza cinco estrellas en distintas direcciones.',datos:{dano:20,cada:1.425,velocidad:333}},
 {id:'calabaza',nombre:'Calabaza',sol:125,recarga:30,vida:4000,familia:'barrera',capa:'cubierta',desbloqueo:'4-7',descripcion:'Envuelve una casilla y protege a la planta que contiene.'},
 {id:'magnetoseta',nombre:'Magnetoseta',sol:100,recarga:7.5,vida:300,familia:'hongo',nocturna:true,desbloqueo:'4-8',descripcion:'Retira un objeto metálico cercano y se recarga antes de repetir.',datos:{cada:15,radio:270,radioComiendo:320}},
];

export const ZOMBIS_NIEBLA:DefZombi[]=[
 {id:'zombi-cajita',nombre:'Zombi con caja sorpresa',vida:500,velocidad:32,mordida:100,area:'niebla',desbloqueo:'4-1',descripcion:'Corre con una caja que puede estallar cerca de las plantas.',datos:{puntos:3,peso:1000}},
 {id:'zombi-globo',nombre:'Zombi con globo',vida:270,armadura:{tipo:'casco',vida:20},velocidad:27.5,mordida:100,agua:'tambien',area:'niebla',desbloqueo:'4-3',descripcion:'Vuela sobre las defensas hasta perder su globo.',datos:{puntos:2,peso:2000,velocidadVueloMin:23,velocidadVueloMax:32,velocidadTierra:80/4.7}},
 {id:'zombi-minero',nombre:'Zombi minero',vida:270,armadura:{tipo:'casco',vida:100,metal:false},velocidad:67,mordida:100,area:'niebla',desbloqueo:'4-6',descripcion:'Cava bajo las defensas y emerge detrás de ellas.',datos:{puntos:4,peso:1000,velocidadTunel:67,velocidadRegreso:12}},
 {id:'zombi-pogo',nombre:'Zombi saltarín',vida:500,velocidad:45,mordida:100,area:'niebla',desbloqueo:'4-8',descripcion:'Supera plantas con su saltador mientras conserve el palo.',datos:{puntos:4,peso:1000,velocidadSinPogo:80/4.7}},
];

const terreno=(niebla:number)=>({parte:1 as const,area:'niebla' as const,filas:[0,1,2,3,4,5],filasAgua:[2,3],emboscadaAgua:true,presionCinta:true,solInicial:50,niebla});
const comunes=(total:number,especiales:Record<string,number>={})=>{
 const fijos:Record<number,Record<string,number>>={};
 for(let n=10;n<=total;n+=10)fijos[n]={zombi:Math.min(Math.ceil(n/3),8),'zombi-bandera':1};
 Object.assign(fijos[total],especiales);return fijos;
};

export const NIVELES_NIEBLA:DefNivel[]=[
 {...terreno(6),id:'4-1',tipo:'normal',banderas:1,zombis:['zombi','caracono','zombi-cajita'],desdeOleada:{'zombi-cajita':10},fijos:{...comunes(10,{caracono:1,'zombi-cajita':1}),6:{'zombi-cajita':1}},premio:{planta:'planterna'}},
 {...terreno(5),id:'4-2',tipo:'normal',banderas:2,zombis:['zombi','caracono','zombi-futbolista','zombi-cajita'],desdeOleada:{'zombi-futbolista':5,'zombi-cajita':10},fijos:comunes(20,{caracono:1,'zombi-futbolista':1,'zombi-cajita':1}),premio:{planta:'cactus'}},
 {...terreno(5),id:'4-3',tipo:'normal',banderas:1,zombis:['zombi','caracono','zombi-globo'],desdeOleada:{'zombi-globo':10},fijos:{...comunes(10,{caracono:1,'zombi-globo':1}),7:{'zombi-globo':1}},premio:{planta:'trebolador'}},
 {...terreno(5),id:'4-4',tipo:'normal',banderas:2,zombis:['zombi','caracono','zombi-delfin','zombi-globo'],desdeOleada:{'zombi-delfin':10,'zombi-globo':10},fijos:comunes(20,{caracono:1,'zombi-delfin':1,'zombi-globo':1}),premio:{objeto:'taco'}},
 {id:'4-5',parte:1,area:'noche',filas:[0,1,2,3,4],zombis:['zombi','caracubo','zombi-futbolista','zombi-bailon','zombi-cajita'],tipo:'minijuego',minijuego:'rompejarrones',banderas:0,solInicial:0,sinSolCielo:true,semillas:['petacereza'],premio:{planta:'bipetidora'}},
 {...terreno(5),id:'4-6',tipo:'normal',banderas:1,zombis:['zombi','caracono','zombi-minero'],desdeOleada:{'zombi-minero':10},fijos:{...comunes(10,{caracono:1,'zombi-minero':1}),7:{'zombi-minero':1}},premio:{planta:'frustrella'}},
 {...terreno(4),id:'4-7',tipo:'normal',banderas:2,zombis:['zombi','caracono','caracubo','zombi-cajita','zombi-minero'],desdeOleada:{'zombi-cajita':10,'zombi-minero':10},fijos:comunes(20,{caracono:1,caracubo:1,'zombi-cajita':1,'zombi-minero':1}),premio:{planta:'calabaza'}},
 {...terreno(4),id:'4-8',tipo:'normal',banderas:1,zombis:['zombi','caracono','zombi-pogo'],desdeOleada:{'zombi-pogo':10},fijos:{...comunes(10,{caracono:1,'zombi-pogo':1}),6:{'zombi-pogo':1}},premio:{planta:'magnetoseta'}},
 {...terreno(4),id:'4-9',tipo:'normal',banderas:2,zombis:['zombi','caracono','caracubo','zombi-globo','zombi-pogo'],desdeOleada:{'zombi-globo':10,'zombi-pogo':10},fijos:comunes(20,{caracono:1,caracubo:1,'zombi-globo':1,'zombi-pogo':1}),premio:{nota:'nota-4'}},
 {...terreno(0),id:'4-10',tipo:'cinta',tormenta:true,banderas:2,solInicial:0,zombis:['zombi','caracono','caracubo','zombi-cajita','zombi-globo','zombi-minero','zombi-pogo'],desdeOleada:{'zombi-cajita':10,'zombi-globo':10,'zombi-minero':10,'zombi-pogo':10},multiplicadorOleadas:3,cinta:['nenufar','marseta','magnetoseta','trebolador','cactus','frustrella','bipetidora','calabaza'],pesosCinta:{nenufar:25,marseta:10,magnetoseta:5,trebolador:5,cactus:15,frustrella:25,bipetidora:5,calabaza:10},atenuarCinta:{nenufar:{cantidad:18,pesoFinal:1}},fijos:comunes(20,{caracono:1,caracubo:1,'zombi-cajita':1,'zombi-globo':1,'zombi-minero':1,'zombi-pogo':1}),premio:{planta:'coltapulta'}},
];
