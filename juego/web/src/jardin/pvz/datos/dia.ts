import type {DefPlanta,DefZombi,DefNivel} from '../tipos';
/** Datos de PvZ 1, separados de los patios clásicos. Fuentes en el registro del motor. */
export const PLANTAS_DIA:DefPlanta[]=[
 {id:'nuez-explosiva',nombre:'Nuez explosiva',sol:0,recarga:0,vida:4000,familia:'explosiva',desbloqueo:'bolos',descripcion:'Bola de nuez que explota al golpear.',datos:{dano:1800}},
 {id:'lanzaguisantes',nombre:'Lanzaguisantes',sol:100,recarga:7.5,vida:300,familia:'tiradora',desbloqueo:'inicio',descripcion:'Dispara guisantes por su carril.',datos:{dano:20,cada:1.425}},
 {id:'girasol',nombre:'Girasol',sol:50,recarga:7.5,vida:300,familia:'productora',desbloqueo:'1-1',descripcion:'Produce soles de 25.',datos:{cada:24.25,primero:7}},
 {id:'petacereza',nombre:'Petacereza',sol:150,recarga:50,vida:300,familia:'explosiva',desbloqueo:'1-2',descripcion:'Explota en las nueve casillas cercanas.',datos:{dano:1800,retardo:1.2}},
 {id:'nuez',nombre:'Nuez',sol:50,recarga:30,vida:4000,familia:'barrera',desbloqueo:'1-3',descripcion:'Resiste mientras las demás plantas disparan.'},
 {id:'patatapum',nombre:'Patatapum',sol:25,recarga:30,vida:300,familia:'explosiva',desbloqueo:'1-5',descripcion:'Necesita armarse antes de detonar por contacto.',datos:{dano:1800,armado:14}},
 {id:'hielaguisantes',nombre:'Hielaguisantes',sol:175,recarga:7.5,vida:300,familia:'tiradora',desbloqueo:'1-6',descripcion:'Sus guisantes ralentizan a los zombis.',datos:{dano:20,cada:1.425,lento:10}},
 {id:'planta-carnivora',nombre:'Planta carnívora',sol:150,recarga:7.5,vida:300,familia:'tiradora',desbloqueo:'1-7',descripcion:'Devora un zombi cercano y después digiere.',datos:{digiere:42}},
 {id:'repetidora',nombre:'Repetidora',sol:200,recarga:7.5,vida:300,familia:'tiradora',desbloqueo:'1-8',descripcion:'Dispara dos guisantes por ataque.',datos:{dano:20,cada:1.425,rafaga:2}},
];
export const ZOMBIS_DIA:DefZombi[]=[
 {id:'zombi',nombre:'Zombi',vida:270,velocidad:80/4.7,mordida:100,area:'dia',desbloqueo:'1-1',descripcion:'Camina hacia la casa y muerde plantas.',datos:{puntos:1,peso:4000}},
 {id:'zombi-bandera',nombre:'Zombi bandera',vida:270,velocidad:80/3.7,mordida:100,area:'dia',desbloqueo:'1-2',descripcion:'Encabeza una oleada enorme.',datos:{puntos:1,peso:4000}},
 {id:'caracono',nombre:'Zombi caracono',vida:270,armadura:{tipo:'casco',vida:370},velocidad:80/4.7,mordida:100,area:'dia',desbloqueo:'1-3',descripcion:'El cono recibe daño antes que su cuerpo.',datos:{puntos:2,peso:4000}},
 {id:'saltador',nombre:'Zombi saltador',vida:500,velocidad:80/2.5,mordida:100,area:'dia',desbloqueo:'1-6',descripcion:'Salta una planta y pierde su pértiga.',datos:{puntos:2,peso:2000,velocidadSinPertiga:80/4.7}},
 {id:'caracubo',nombre:'Zombi caracubo',vida:270,armadura:{tipo:'casco',vida:1100,metal:true},velocidad:80/4.7,mordida:100,area:'dia',desbloqueo:'1-8',descripcion:'El cubo metálico protege su cuerpo.',datos:{puntos:4,peso:3000}},
];
// El tutorial tiene 4/6/8 oleadas; los niveles posteriores usan diez por bandera.
export const NIVELES_DIA:DefNivel[]=[
 {id:'1-1',fijos:{"1":{"zombi":1},"2":{"zombi":1},"3":{"zombi":1},"4":{"zombi":2}},composicionCompleta:true,primeraOleadaTrasPlantas:[1,2],parte:1,area:'dia',filas:[2],zombis:['zombi'],banderas:0,oleadas:4,enormes:[],tipo:'normal',solInicial:150,semillas:['lanzaguisantes'],premio:{planta:'girasol'}},
 {id:'1-2',fijos:{"1":{"zombi":1},"2":{"zombi":1},"3":{"zombi":1},"4":{"zombi":2},"5":{"zombi":2},"6":{"zombi":4,"zombi-bandera":1}},composicionCompleta:true,parte:1,area:'dia',filas:[1,2,3],zombis:['zombi'],banderas:1,oleadas:6,tipo:'normal',solInicial:50,premio:{planta:'petacereza'}},
 {id:'1-3',desdeOleada:{caracono:5},fijos:{"5":{"caracono":1},"8":{"zombi":3,"zombi-bandera":1,"caracono":1}},composicionCompleta:false,parte:1,area:'dia',filas:[1,2,3],zombis:['zombi','caracono'],banderas:1,oleadas:8,tipo:'normal',solInicial:50,premio:{planta:'nuez'}},
 {id:'1-4',fijos:{"10":{"zombi":4,"zombi-bandera":1,"caracono":1}},composicionCompleta:false,parte:1,area:'dia',filas:[0,1,2,3,4],zombis:['zombi','caracono'],banderas:1,tipo:'normal',solInicial:50,premio:{objeto:'pala'}},
 {id:'1-5',multiplicadorOleadas:4,fijos:{"8":{"zombi":3,"zombi-bandera":1,"caracono":1}},composicionCompleta:false,oleadas:8,enormes:[8],parte:1,area:'dia',filas:[0,1,2,3,4],zombis:['zombi','caracono'],banderas:1,tipo:'minijuego',minijuego:'bolos',solInicial:0,cinta:['nuez','nuez-explosiva'],pesosCinta:{nuez:85,'nuez-explosiva':15},premio:{planta:'patatapum'}},
 {id:'1-6',desdeOleada:{saltador:6},fijos:{"6":{"saltador":1},"10":{"zombi":4,"zombi-bandera":1,"caracono":1,"saltador":1}},composicionCompleta:false,parte:1,area:'dia',filas:[0,1,2,3,4],zombis:['zombi','caracono','saltador'],banderas:1,tipo:'normal',solInicial:50,premio:{planta:'hielaguisantes'}},
 {id:'1-7',fijos:{"10":{"zombi":4,"zombi-bandera":1},"20":{"zombi":7,"zombi-bandera":1,"caracono":1,"saltador":1}},composicionCompleta:false,parte:1,area:'dia',filas:[0,1,2,3,4],zombis:['zombi','caracono','saltador'],banderas:2,tipo:'normal',solInicial:50,premio:{planta:'planta-carnivora'}},
 {id:'1-8',desdeOleada:{caracubo:6},fijos:{"6":{"caracubo":1},"10":{"zombi":4,"zombi-bandera":1,"caracono":1,"caracubo":1}},composicionCompleta:false,parte:1,area:'dia',filas:[0,1,2,3,4],zombis:['zombi','caracono','caracubo'],banderas:1,tipo:'normal',solInicial:50,premio:{planta:'repetidora'}},
 {id:'1-9',fijos:{"10":{"zombi":4,"zombi-bandera":1},"20":{"zombi":7,"zombi-bandera":1,"caracono":1,"saltador":1,"caracubo":1}},composicionCompleta:false,parte:1,area:'dia',filas:[0,1,2,3,4],zombis:['zombi','caracono','saltador','caracubo'],banderas:2,tipo:'normal',solInicial:50,premio:{nota:'nota-1'}},
 {id:'1-10',multiplicadorOleadas:3,fijos:{"10":{"zombi":4,"zombi-bandera":1},"20":{"zombi":7,"zombi-bandera":1,"caracono":1,"saltador":1,"caracubo":1}},composicionCompleta:false,parte:1,area:'dia',filas:[0,1,2,3,4],zombis:['zombi','caracono','saltador','caracubo'],banderas:2,tipo:'cinta',solInicial:0,cinta:['lanzaguisantes','petacereza','nuez','patatapum','hielaguisantes','planta-carnivora','repetidora'],pesosCinta:{lanzaguisantes:20,petacereza:20,nuez:15,patatapum:10,hielaguisantes:10,'planta-carnivora':5,repetidora:20},premio:{planta:'seta-desesporada'}},
];

/** Semillas obtenidas antes del nivel; los premios se conceden al ganar, nunca al abrirlo. */
export function semillasAntesDelNivel(id:string){
 const i=NIVELES_DIA.findIndex(n=>n.id===id);if(i<0)return PLANTAS_DIA.filter(p=>p.desbloqueo!=='bolos').map(p=>p.id);
 const ids=['lanzaguisantes'];for(const n of NIVELES_DIA.slice(0,i)){const p=n.premio?.planta;if(p&&PLANTAS_DIA.some(p2=>p2.id===p))ids.push(p);}return ids;
}
