import type {DefNivel, DefPlanta, DefZombi} from '../tipos';

/** PvZ 1 de PC. Las discrepancias entre fuentes se registran en pvz-noche-fuentes-2026-10-19.md. */
export const PLANTAS_NOCHE: DefPlanta[] = [
 {id:'seta-desesporada',nombre:'Seta desesporada',sol:0,recarga:7.5,vida:300,familia:'hongo',nocturna:true,desbloqueo:'1-10',descripcion:'Dispara esporas a corta distancia.',datos:{dano:20,cada:1.425,alcance:240}},
 {id:'seta-solar',nombre:'Seta solar',sol:25,recarga:7.5,vida:300,familia:'productora',nocturna:true,desbloqueo:'2-1',descripcion:'Produce soles pequeños y crece hasta producir soles de 25.',datos:{primero:7,cada:24.25,crece:120,solPequeno:15,solGrande:25}},
 {id:'humoseta',nombre:'Humoseta',sol:75,recarga:7.5,vida:300,familia:'hongo',nocturna:true,desbloqueo:'2-2',descripcion:'El humo alcanza a todos los zombis cercanos del carril y atraviesa escudos.',datos:{dano:20,cada:1.425,alcance:320}},
 {id:'comepiedras',nombre:'Comepiedras',sol:75,recarga:7.5,vida:300,familia:'apoyo',desbloqueo:'2-3',descripcion:'Se planta sobre una lápida para retirarla.',datos:{retardo:4.5}},
 {id:'hipnoseta',nombre:'Hipnoseta',sol:75,recarga:30,vida:300,familia:'hongo',nocturna:true,desbloqueo:'2-5',descripcion:'El zombi que la muerde se vuelve contra sus compañeros.'},
 {id:'seta-miedica',nombre:'Seta miedica',sol:25,recarga:7.5,vida:300,familia:'hongo',nocturna:true,desbloqueo:'2-6',descripcion:'Dispara por todo el carril y se esconde cuando hay zombis cerca.',datos:{dano:20,cada:1.425,alcance:800,radioMiedo:120}},
 {id:'seta-congelada',nombre:'Seta congelada',sol:75,recarga:50,vida:300,familia:'hongo',nocturna:true,desbloqueo:'2-7',descripcion:'Congela a los zombis del campo y después los ralentiza.',datos:{retardo:1,dano:20,lento:20,congeladoMin:4,congeladoMax:6,congeladoFrioMin:3,congeladoFrioMax:4}},
 {id:'petaseta',nombre:'Petaseta',sol:125,recarga:50,vida:300,familia:'explosiva',nocturna:true,desbloqueo:'2-8',descripcion:'Explota en un área amplia y deja un cráter temporal.',datos:{retardo:1,dano:1800,radio:250,crater:180}},
];

export const ZOMBIS_NOCHE: DefZombi[] = [
 {id:'zombi-periodico',nombre:'Zombi lector',vida:270,armadura:{tipo:'escudo',vida:150},velocidad:80/4.7,mordida:100,area:'noche',desbloqueo:'2-1',descripcion:'Al perder el periódico se detiene un momento y después corre enfadado.',datos:{puntos:2,peso:1000,velocidadEnfadado:80/1.8}},
 {id:'zombi-portero',nombre:'Zombi portero',vida:270,armadura:{tipo:'escudo',vida:1100,metal:true},velocidad:80/4.7,mordida:100,area:'noche',desbloqueo:'2-3',descripcion:'Su puerta protege de los disparos de frente, pero no del humo.',datos:{puntos:4,peso:3500}},
 {id:'zombi-futbolista',nombre:'Zombi deportista',vida:270,armadura:{tipo:'casco',vida:1400,metal:true},velocidad:80/2.5,mordida:100,area:'noche',desbloqueo:'2-6',descripcion:'Corre con un casco muy resistente.',datos:{puntos:7,peso:2000}},
 {id:'zombi-bailon',nombre:'Zombi bailón',vida:500,velocidad:80/5.5,mordida:100,area:'noche',desbloqueo:'2-8',descripcion:'Llama a bailarines que avanzan con él en formación.',datos:{puntos:5,peso:1000,velocidadEntrada:80/1.5}},
 {id:'zombi-acompanante',nombre:'Zombi extra',vida:270,velocidad:80/5.5,mordida:100,area:'noche',desbloqueo:'2-8',descripcion:'Acompaña al zombi bailón y puede ser convocado de nuevo.'},
];

const filas = () => [0,1,2,3,4];
const cuatroLapidas = () => ({6:1,7:1,8:2});
const sieteLapidas = () => ({5:1,6:1,7:2,8:3});
const onceLapidas = () => ({4:1,5:2,6:2,7:3,8:3});

/** Primera vuelta de aventura: especies y apariciones fijas; el director completa el presupuesto. */
export const NIVELES_NOCHE: DefNivel[] = [
 {id:'2-1',parte:1,area:'noche',filas:filas(),zombis:['zombi','zombi-periodico'],banderas:1,tipo:'normal',solInicial:50,sinSolCielo:true,lapidas:4,distribucionLapidas:cuatroLapidas(),desdeOleada:{'zombi-periodico':6},fijos:{6:{'zombi-periodico':1},10:{zombi:4,'zombi-bandera':1,'zombi-periodico':1}},premio:{planta:'seta-solar'}},
 {id:'2-2',parte:1,area:'noche',filas:filas(),zombis:['zombi','caracono','caracubo','zombi-periodico'],banderas:2,tipo:'normal',solInicial:50,sinSolCielo:true,lapidas:4,distribucionLapidas:cuatroLapidas(),fijos:{10:{zombi:4,'zombi-bandera':1},20:{zombi:7,'zombi-bandera':1,caracono:1,caracubo:1,'zombi-periodico':1}},premio:{planta:'humoseta'}},
 {id:'2-3',parte:1,area:'noche',filas:filas(),zombis:['zombi','caracono','zombi-portero'],banderas:1,tipo:'normal',solInicial:50,sinSolCielo:true,lapidas:4,distribucionLapidas:cuatroLapidas(),desdeOleada:{'zombi-portero':6},fijos:{6:{'zombi-portero':1},10:{zombi:4,'zombi-bandera':1,caracono:1,'zombi-portero':1}},premio:{planta:'comepiedras'}},
 {id:'2-4',parte:1,area:'noche',filas:filas(),zombis:['zombi','caracono','saltador','zombi-portero'],banderas:2,tipo:'normal',solInicial:50,sinSolCielo:true,lapidas:7,distribucionLapidas:sieteLapidas(),fijos:{10:{zombi:4,'zombi-bandera':1},20:{zombi:7,'zombi-bandera':1,caracono:1,saltador:1,'zombi-portero':1}},premio:{objeto:'almanaque'}},
 {id:'2-5',parte:1,area:'noche',filas:filas(),zombis:['zombi','caracono','caracubo'],banderas:0,oleadas:8,enormes:[],tipo:'minijuego',minijuego:'aplastazombis',solInicial:0,sinSolCielo:true,lapidas:9,semillas:['patatapum','comepiedras','petacereza'],plantasFijas:['patatapum','comepiedras','petacereza'],premio:{planta:'hipnoseta'}},
 {id:'2-6',parte:1,area:'noche',filas:filas(),zombis:['zombi','caracono','zombi-futbolista'],banderas:1,tipo:'normal',solInicial:50,sinSolCielo:true,lapidas:7,distribucionLapidas:sieteLapidas(),desdeOleada:{'zombi-futbolista':6},fijos:{6:{'zombi-futbolista':1},10:{zombi:4,'zombi-bandera':1,caracono:1,'zombi-futbolista':1}},premio:{planta:'seta-miedica'}},
 {id:'2-7',parte:1,area:'noche',filas:filas(),zombis:['zombi','caracono','zombi-portero','zombi-futbolista'],banderas:2,tipo:'normal',solInicial:50,sinSolCielo:true,lapidas:11,distribucionLapidas:onceLapidas(),fijos:{10:{zombi:4,'zombi-bandera':1},20:{zombi:7,'zombi-bandera':1,caracono:1,'zombi-portero':1,'zombi-futbolista':1}},premio:{planta:'seta-congelada'}},
 {id:'2-8',parte:1,area:'noche',filas:filas(),zombis:['zombi','caracono','zombi-bailon'],banderas:1,tipo:'normal',solInicial:50,sinSolCielo:true,lapidas:11,distribucionLapidas:onceLapidas(),desdeOleada:{'zombi-bailon':6},fijos:{6:{'zombi-bailon':1},10:{zombi:4,'zombi-bandera':1,caracono:1,'zombi-bailon':1}},premio:{planta:'petaseta'}},
 {id:'2-9',parte:1,area:'noche',filas:filas(),zombis:['zombi','caracono','zombi-portero','zombi-bailon'],banderas:2,tipo:'normal',solInicial:50,sinSolCielo:true,lapidas:11,distribucionLapidas:onceLapidas(),fijos:{10:{zombi:4,'zombi-bandera':1},20:{zombi:7,'zombi-bandera':1,caracono:1,'zombi-portero':1,'zombi-bailon':1}},premio:{nota:'nota-2'}},
 {id:'2-10',parte:1,area:'noche',filas:filas(),zombis:['zombi','caracono','zombi-portero','zombi-futbolista','zombi-bailon'],banderas:2,tipo:'cinta',solInicial:0,sinSolCielo:true,lapidas:13,distribucionLapidas:{3:1,4:2,5:2,6:2,7:3,8:3},multiplicadorOleadas:3,cinta:['seta-desesporada','humoseta','comepiedras','hipnoseta','seta-miedica','seta-congelada','petaseta'],pesosCinta:{'seta-desesporada':10,humoseta:15,comepiedras:20,hipnoseta:10,'seta-miedica':15,'seta-congelada':15,petaseta:15},maximosCinta:{comepiedras:13},fijos:{10:{zombi:4,'zombi-bandera':1},20:{zombi:7,'zombi-bandera':1,caracono:1,'zombi-portero':1,'zombi-futbolista':1,'zombi-bailon':1}},premio:{planta:'nenufar'}},
];
