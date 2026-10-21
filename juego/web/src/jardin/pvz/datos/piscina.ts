import type {DefNivel,DefPlanta,DefZombi} from '../tipos';

/** Primera aventura de PvZ 1 de PC; procedencia y aproximaciones en el registro de fuentes. */
export const PLANTAS_PISCINA:DefPlanta[]=[
 {id:'nenufar',nombre:'Nenúfar',sol:25,recarga:7.5,vida:300,familia:'acuatica',agua:'solo',capa:'base',desbloqueo:'2-10',descripcion:'Sirve de apoyo a una planta terrestre sobre el agua.'},
 {id:'aplastaflor',nombre:'Apisonaflor',sol:50,recarga:30,vida:300,familia:'explosiva',desbloqueo:'3-1',descripcion:'Salta sobre los zombis cercanos de su carril y los aplasta.',datos:{dano:1800,alcance:70,despegue:1.26,impacto:1.82,radio:40}},
 {id:'tripitidora',nombre:'Tripitidora',sol:325,recarga:7.5,vida:300,familia:'tiradora',desbloqueo:'3-2',descripcion:'Dispara guisantes por su carril y los dos vecinos.',datos:{dano:20,cada:1.425}},
 {id:'zampalga',nombre:'Zampalga',sol:25,recarga:30,vida:300,familia:'acuatica',agua:'solo',desbloqueo:'3-3',descripcion:'Arrastra bajo el agua a un zombi cercano y desaparece con él.',datos:{alcance:40,arrastra:.5,retardo:1}},
 {id:'jalapeno',nombre:'Jalapeño',sol:125,recarga:50,vida:300,familia:'explosiva',desbloqueo:'3-5',descripcion:'Quema todos los zombis de su carril y derrite el rastro de hielo.',datos:{dano:1800,retardo:1}},
 {id:'pinchohierba',nombre:'Pinchohierba',sol:100,recarga:7.5,vida:300,familia:'apoyo',soloTierra:true,desbloqueo:'3-6',descripcion:'Daña a quienes la pisan y pincha las ruedas de los vehículos.',datos:{dano:20,cada:1.01,primero:.26,radio:35,ignoraMordida:1}},
 {id:'plantorcha',nombre:'Plantorcha',sol:175,recarga:7.5,vida:300,familia:'apoyo',desbloqueo:'3-7',descripcion:'Convierte los guisantes que la atraviesan en bolas de fuego.',datos:{danoFuego:40}},
 {id:'nuez-alta',nombre:'Nuez cáscara-rabias',sol:125,recarga:30,vida:8000,familia:'barrera',desbloqueo:'3-8',descripcion:'Resiste muchas mordidas e impide que salten por encima.',datos:{bloqueaSalto:1}},
];

/** Los flotadores conservan cuerpo y casco: son variantes por terreno, no elecciones extra de oleada. */
export const ZOMBIS_PISCINA:DefZombi[]=[
 {id:'zombi-flotador',nombre:'Zombi con flotador',vida:270,velocidad:80/4.7,mordida:100,agua:'solo',area:'piscina',desbloqueo:'3-1',descripcion:'Avanza por el agua sobre su flotador.',datos:{puntos:1,peso:4000}},
 {id:'caracono-flotador',nombre:'Caracono con flotador',vida:270,armadura:{tipo:'casco',vida:370},velocidad:80/4.7,mordida:100,agua:'solo',area:'piscina',desbloqueo:'3-1',descripcion:'Su cono conserva la misma protección dentro del agua.',datos:{puntos:2,peso:4000}},
 {id:'caracubo-flotador',nombre:'Caracubo con flotador',vida:270,armadura:{tipo:'casco',vida:1100,metal:true},velocidad:80/4.7,mordida:100,agua:'solo',area:'piscina',desbloqueo:'3-2',descripcion:'Su cubo metálico conserva la misma protección dentro del agua.',datos:{puntos:4,peso:3000}},
 {id:'zombi-buzo',nombre:'Zombi buzo',vida:270,velocidad:67,mordida:100,agua:'solo',area:'piscina',desbloqueo:'3-3',descripcion:'Se sumerge para evitar los disparos y sale a la superficie para morder.',datos:{puntos:3,peso:2000,velocidadTierra:80/2.5}},
 {id:'zomboni',nombre:'Zomboni',vida:1350,velocidad:25,mordida:100,area:'piscina',desbloqueo:'3-6',descripcion:'Aplasta plantas y deja hielo que impide sembrar.',datos:{puntos:7,peso:2000,vehiculo:1,velocidadMinima:10}},
 {id:'zombi-trineo',nombre:'Equipo de zombis de trineo',vida:270,armadura:{tipo:'casco',vida:300},velocidad:60,mordida:100,area:'piscina',desbloqueo:'3-6',descripcion:'Cuatro zombis llegan en trineo por un rastro de hielo.',datos:{puntos:3,peso:2000,velocidadSinTrineo:80/4.7}},
 {id:'zombi-delfin',nombre:'Zombi jinete de delfín',vida:500,velocidad:90,mordida:100,agua:'solo',area:'piscina',desbloqueo:'3-8',descripcion:'Nada deprisa y salta una defensa antes de perder el delfín.',datos:{puntos:3,peso:1500,velocidadSinDelfin:30}},
];

const terreno=()=>({parte:1 as const,area:'piscina' as const,filas:[0,1,2,3,4,5],filasAgua:[2,3],emboscadaAgua:true,presionCinta:true,solInicial:50});
const comunes=(total:number,especiales:Record<string,number>={})=>{
 const fijos:Record<number,Record<string,number>>={};
 for(let n=10;n<=total;n+=10)fijos[n]={zombi:Math.min(Math.ceil(n/3),8),'zombi-bandera':1};
 Object.assign(fijos[total],especiales);return fijos;
};

/** El director elige la variante de flotador al asignar un normal, cono o cubo a una fila de agua. */
export const NIVELES_PISCINA:DefNivel[]=[
 {...terreno(),id:'3-1',tipo:'normal',banderas:1,zombis:['zombi','caracono'],fijos:comunes(10,{caracono:1}),premio:{planta:'aplastaflor'}},
 {...terreno(),id:'3-2',tipo:'normal',banderas:2,zombis:['zombi','caracono','caracubo','zombi-periodico','zombi-futbolista'],desdeOleada:{'zombi-futbolista':5},fijos:comunes(20,{caracono:1,caracubo:1,'zombi-periodico':1,'zombi-futbolista':1}),premio:{planta:'tripitidora'}},
 {...terreno(),id:'3-3',tipo:'normal',banderas:2,zombis:['zombi','caracono','zombi-buzo'],desdeOleada:{'zombi-buzo':10},fijos:{...comunes(20,{caracono:1,'zombi-buzo':1}),11:{'zombi-buzo':1}},premio:{planta:'zampalga'}},
 {...terreno(),id:'3-4',tipo:'normal',banderas:3,zombis:['zombi','caracono','saltador','caracubo','zombi-periodico','zombi-buzo'],desdeOleada:{saltador:5,'zombi-buzo':10},fijos:comunes(30,{caracono:1,saltador:1,caracubo:1,'zombi-periodico':1,'zombi-buzo':1}),premio:{objeto:'llave-tienda'}},
 {...terreno(),id:'3-5',tipo:'minijuego',minijuego:'minizombis',banderas:2,solInicial:0,zombis:['zombi','caracono','zombi-futbolista','zombi-buzo'],desdeOleada:{'zombi-futbolista':5,'zombi-buzo':10},multiplicadorOleadas:4,cinta:['nenufar','nuez','lanzaguisantes','petacereza'],pesosCinta:{nenufar:25,nuez:15,lanzaguisantes:25,petacereza:35},atenuarCinta:{nenufar:{cantidad:18,pesoFinal:1}},fijos:comunes(20,{caracono:1,'zombi-futbolista':1,'zombi-buzo':1}),premio:{planta:'jalapeno'}},
 {...terreno(),id:'3-6',tipo:'normal',banderas:2,zombis:['zombi','caracono','zomboni','zombi-trineo'],desdeOleada:{zomboni:10,'zombi-trineo':10},fijos:{...comunes(20,{caracono:1,zomboni:1}),11:{zomboni:1}},premio:{planta:'pinchohierba'}},
 {...terreno(),id:'3-7',tipo:'normal',banderas:3,zombis:['zombi','caracono','caracubo','zombi-buzo','zomboni','zombi-trineo'],desdeOleada:{'zombi-buzo':10,zomboni:10,'zombi-trineo':10},fijos:comunes(30,{caracono:1,caracubo:1,'zombi-buzo':1,zomboni:1}),premio:{planta:'plantorcha'}},
 {...terreno(),id:'3-8',tipo:'normal',banderas:2,zombis:['zombi','caracono','zombi-delfin'],desdeOleada:{'zombi-delfin':10},fijos:{...comunes(20,{caracono:1,'zombi-delfin':1}),11:{'zombi-delfin':1}},premio:{planta:'nuez-alta'}},
 {...terreno(),id:'3-9',tipo:'normal',banderas:3,zombis:['zombi','caracono','saltador','caracubo','zomboni','zombi-trineo','zombi-delfin'],desdeOleada:{saltador:5,zomboni:10,'zombi-trineo':10,'zombi-delfin':10},fijos:comunes(30,{caracono:1,saltador:1,caracubo:1,zomboni:1,'zombi-delfin':1}),premio:{nota:'nota-3'}},
 {...terreno(),id:'3-10',tipo:'cinta',banderas:3,solInicial:0,zombis:['zombi','caracono','caracubo','zombi-buzo','zomboni','zombi-trineo','zombi-delfin'],desdeOleada:{'zombi-buzo':10,zomboni:10,'zombi-trineo':10,'zombi-delfin':10},multiplicadorOleadas:3,cinta:['nenufar','aplastaflor','tripitidora','zampalga','jalapeno','pinchohierba','plantorcha','nuez-alta'],pesosCinta:{nenufar:25,aplastaflor:5,tripitidora:25,zampalga:5,jalapeno:10,pinchohierba:10,plantorcha:10,'nuez-alta':10},atenuarCinta:{nenufar:{cantidad:18,pesoFinal:1}},fijos:comunes(30,{caracono:1,caracubo:1,'zombi-buzo':1,zomboni:1,'zombi-delfin':1}),premio:{planta:'marseta'}},
];
