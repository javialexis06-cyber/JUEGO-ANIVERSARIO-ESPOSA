import type {DefNivel,DefPlanta,DefZombi} from '../tipos';

/** Primera aventura de PvZ 1 para PC, mundo del tejado; fuentes y aproximaciones en el registro del tejado. */
export const PLANTAS_TEJADO:DefPlanta[]=[
 {id:'coltapulta',nombre:'Coltapulta',sol:100,recarga:7.5,vida:300,familia:'lanzadora',desbloqueo:'4-10',descripcion:'Lanza coles por encima de escudos y obstáculos.',datos:{dano:40,cada:2.925,vuelo:1.2}},
 {id:'maceta',nombre:'Maceta',sol:25,recarga:7.5,vida:300,familia:'apoyo',capa:'base',soloTierra:true,desbloqueo:'5-1',descripcion:'Sostiene una planta sobre el tejado.'},
 {id:'lanzamaiz',nombre:'Lanzamaíz',sol:100,recarga:7.5,vida:300,familia:'lanzadora',desbloqueo:'5-2',descripcion:'Lanza granos y, a veces, mantequilla que inmoviliza.',datos:{dano:20,danoMantequilla:40,mantequilla:4,probMantequilla:.25,cada:2.925,vuelo:1.2}},
 {id:'grano-cafe',nombre:'Grano de café',sol:75,recarga:7.5,vida:300,familia:'apoyo',capa:'temporal',desbloqueo:'5-3',descripcion:'Despierta a un hongo dormido.',datos:{retardo:1,despertar:1}},
 {id:'ajo',nombre:'Ajo',sol:50,recarga:7.5,vida:400,familia:'barrera',desbloqueo:'5-5',descripcion:'Quien lo muerde cambia de carril.',datos:{asco:.2,cambio:1.7}},
 {id:'paraplanta',nombre:'Paraplanta',sol:100,recarga:7.5,vida:300,familia:'apoyo',desbloqueo:'5-6',descripcion:'Protege las casillas vecinas de colgados y balones.'},
 {id:'margarita',nombre:'Margarita',sol:50,recarga:30,vida:300,familia:'productora',desbloqueo:'5-7',descripcion:'Produce monedas de plata y, a veces, de oro.',datos:{primeroMin:3,primeroMax:12.5,cadaMin:23.5,cadaMax:25,plata:10,oro:50,probOro:.1,final:60}},
 {id:'melonpulta',nombre:'Melonpulta',sol:300,recarga:7.5,vida:300,familia:'lanzadora',desbloqueo:'5-8',descripcion:'Lanza melones que salpican a los zombis cercanos.',datos:{dano:80,cada:2.925,vuelo:1.2}},
];

/** El diablillo solo llega lanzado por un gargantúa; el jefe vive en 5-10. Ninguno se sortea en oleadas. */
export const ZOMBIS_TEJADO:DefZombi[]=[
 {id:'zombi-colgado',nombre:'Zombi colgado',vida:450,velocidad:0,mordida:0,comestible:false,area:'tejado',desbloqueo:'5-1',descripcion:'Baja del cielo y se lleva una planta.',datos:{puntos:3,peso:1000,altura:3000,caida:800,espera:3,agarre:.5}},
 {id:'zombi-escalera',nombre:'Zombi escalera',vida:500,armadura:{tipo:'escudo',vida:500,metal:true},velocidad:80/2.1,mordida:100,area:'tejado',desbloqueo:'5-3',descripcion:'Apoya su escalera en las barreras para que todos las crucen.',datos:{puntos:4,peso:1000,velocidadSinEscalera:80/4.7,colocar:1}},
 {id:'zombi-catapulta',nombre:'Zombi catapulta',vida:850,velocidad:80/4.7,mordida:100,comestible:false,area:'tejado',desbloqueo:'5-6',descripcion:'Lanza balones a la planta más lejana de su carril.',datos:{puntos:5,peso:1500,vehiculo:1,balones:20,inicio:650,cada:3,disparo:.5,dano:75,vuelo:1.2}},
 {id:'gargantua',nombre:'Gargantúa',vida:3000,velocidad:80/4.7,mordida:100,comestible:false,area:'tejado',desbloqueo:'5-8',descripcion:'Aplasta plantas de un golpe y lanza a su diablillo.',datos:{puntos:10,peso:1500,golpe:1.3,golpeTotal:2,lanzamiento:.6,lanzamientoTotal:1}},
 {id:'diablillo',nombre:'Diablillo',vida:270,velocidad:80/4.7,mordida:100,area:'tejado',desbloqueo:'5-8',descripcion:'Sale volando de la espalda del gargantúa.',datos:{puntos:10}},
 {id:'dr-zomboid',nombre:'Dr. Zomboid',vida:40000,velocidad:0,mordida:0,comestible:false,area:'tejado',desbloqueo:'5-10',descripcion:'Su robot gigante convoca zombis, pisa, lanza colgados, deja caer una caravana y escupe bolas de fuego y de hielo.'},
];

const terreno=(macetas=3)=>({parte:1 as const,area:'tejado' as const,filas:[0,1,2,3,4],solInicial:50,sinCortacespedes:true,macetas,emboscadaCielo:3});
const comunes=(total:number,especiales:Record<string,number>={})=>{
 const fijos:Record<number,Record<string,number>>={};
 for(let n=10;n<=total;n+=10)fijos[n]={zombi:Math.min(Math.ceil(n/3),8),'zombi-bandera':1};
 Object.assign(fijos[total],especiales);return fijos;
};

/** El zombi nuevo de cada nivel aparece a mitad del nivel y en la última oleada, como en la aventura original. */
export const NIVELES_TEJADO:DefNivel[]=[
 {...terreno(5),emboscadaCielo:2,id:'5-1',tipo:'normal',banderas:1,zombis:['zombi','caracono','zombi-colgado'],desdeOleada:{'zombi-colgado':10},fijos:{...comunes(10,{caracono:1,'zombi-colgado':1}),6:{'zombi-colgado':1}},premio:{planta:'maceta'}},
 {...terreno(4),emboscadaCielo:2,id:'5-2',tipo:'normal',banderas:2,zombis:['zombi','caracono','saltador','caracubo','zombi-colgado'],desdeOleada:{saltador:5,'zombi-colgado':10},fijos:comunes(20,{caracono:1,saltador:1,caracubo:1,'zombi-colgado':1}),premio:{planta:'lanzamaiz'}},
 {...terreno(),id:'5-3',tipo:'normal',banderas:2,zombis:['zombi','caracono','zombi-escalera'],desdeOleada:{'zombi-escalera':10},fijos:{...comunes(20,{caracono:1,'zombi-escalera':1}),11:{'zombi-escalera':1}},premio:{planta:'grano-cafe'}},
 {...terreno(),id:'5-4',tipo:'normal',banderas:3,zombis:['zombi','caracono','zombi-futbolista','zombi-pogo','zombi-escalera'],desdeOleada:{'zombi-futbolista':5,'zombi-pogo':10,'zombi-escalera':10},fijos:comunes(30,{caracono:1,'zombi-futbolista':1,'zombi-pogo':1,'zombi-escalera':1}),premio:{objeto:'regadera'}},
 {...terreno(),id:'5-5',tipo:'cinta',bombardeo:true,banderas:2,solInicial:0,zombis:['zombi','caracono','caracubo','zombi-escalera','zombi-colgado'],desdeOleada:{'zombi-escalera':10,'zombi-colgado':999},multiplicadorOleadas:2,presionCinta:true,cinta:['maceta','planta-carnivora','calabaza','petacereza'],pesosCinta:{maceta:50,'planta-carnivora':25,calabaza:15,petacereza:10},atenuarCinta:{maceta:{cantidad:35,pesoFinal:1}},cintaPC:true,fijos:comunes(20,{caracono:1,caracubo:1,'zombi-escalera':1}),premio:{planta:'ajo'}},
 {...terreno(),id:'5-6',tipo:'normal',banderas:2,zombis:['zombi','caracono','zombi-catapulta'],desdeOleada:{'zombi-catapulta':10},fijos:{...comunes(20,{caracono:1,'zombi-catapulta':1}),11:{'zombi-catapulta':1}},premio:{planta:'paraplanta'}},
 {...terreno(),id:'5-7',tipo:'normal',banderas:3,zombis:['zombi','caracono','zombi-colgado','zombi-escalera','zombi-catapulta'],desdeOleada:{'zombi-colgado':10,'zombi-escalera':10,'zombi-catapulta':10},fijos:comunes(30,{caracono:1,'zombi-colgado':1,'zombi-escalera':1,'zombi-catapulta':1}),premio:{planta:'margarita'}},
 {...terreno(),id:'5-8',tipo:'normal',banderas:2,zombis:['zombi','caracono','gargantua'],desdeOleada:{gargantua:15},fijos:{...comunes(20,{caracono:1,gargantua:1}),11:{gargantua:1}},premio:{planta:'melonpulta'}},
 {...terreno(),id:'5-9',tipo:'normal',banderas:3,zombis:['zombi','caracono','caracubo','zombi-cajita','zombi-colgado','zombi-escalera','zombi-catapulta','gargantua'],desdeOleada:{'zombi-cajita':10,'zombi-colgado':10,'zombi-escalera':10,'zombi-catapulta':10,gargantua:15},fijos:comunes(30,{caracono:1,caracubo:1,'zombi-cajita':1,'zombi-colgado':1,'zombi-escalera':1,'zombi-catapulta':1,gargantua:1}),premio:{nota:'nota-5'}},
 {...terreno(),emboscadaCielo:undefined,id:'5-10',tipo:'jefe',jefe:'dr-zomboid',nocturno:true,sinSolCielo:true,banderas:0,solInicial:0,zombis:['dr-zomboid'],presionCinta:true,cinta:['maceta','melonpulta','jalapeno','coltapulta','lanzamaiz','seta-congelada'],pesosCinta:{maceta:55,melonpulta:10,jalapeno:12,coltapulta:10,lanzamaiz:5,'seta-congelada':8},atenuarCinta:{maceta:{cantidad:35,pesoFinal:1}},cintaPC:true,cintaInicial:['coltapulta','jalapeno','coltapulta','seta-congelada'],premio:{nota:'nota-final'}},
];
