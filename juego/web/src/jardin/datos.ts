export const PLANTAS={
 margarita:{nombre:'Margarita farol',desc:'Produce 25 luces cada 14 segundos.',costo:50,vida:140,recarga:5,cada:14,dano:0},
 frijol:{nombre:'Frijol campana',desc:'Dispara semillas por su carril.',costo:100,vida:180,recarga:4,cada:1.3,dano:22},
 calabaza:{nombre:'Calabaza cojín',desc:'Una barrera de fieltro muy resistente.',costo:50,vida:1100,recarga:12,cada:99,dano:0},
 menta:{nombre:'Menta escarcha',desc:'Sus semillas enfrían y ralentizan.',costo:150,vida:170,recarga:7,cada:1.7,dano:18},
 hongo:{nombre:'Hongo linterna',desc:'Dispara esporas que estallan en un área pequeña.',costo:175,vida:180,recarga:8,cada:2.2,dano:42},
 chile:{nombre:'Chile cometa',desc:'Explota una vez y alcanza carriles vecinos.',costo:125,vida:180,recarga:25,cada:1.2,dano:340},
 gemela:{nombre:'Enredadera gemela',desc:'Dos semillas por disparo.',costo:200,vida:200,recarga:8,cada:1.25,dano:44},
 campanilla:{nombre:'Flor campanilla',desc:'Repara las plantas vecinas cada tres segundos.',costo:125,vida:210,recarga:10,cada:3,dano:0},
} as const;
export type IdPlanta=keyof typeof PLANTAS;
export const ZOMBIS={
 remiendo:{nombre:'Zombi remendado',vida:150,vel:.15,dano:24},
 olla:{nombre:'Zombi de olla',vida:350,vel:.12,dano:25},
 corredor:{nombre:'Zombi corredor',vida:130,vel:.25,dano:22},
 paraguas:{nombre:'Zombi paraguas',vida:240,vel:.14,dano:24},
 grandote:{nombre:'Zombi grandote',vida:850,vel:.09,dano:40},
} as const;
export type IdZombi=keyof typeof ZOMBIS;
export interface NivelJardin {id:string;nombre:string;filas:number;oleadas:number;porOleada:number;tipos:IdZombi[];plantas:IdPlanta[];cielo:string;suelo:string;sub:string}
const todas=Object.keys(PLANTAS) as IdPlanta[];
export const NIVELES_JARDIN:NivelJardin[]=[
 {id:'bienvenida',nombre:'La primera siembra',filas:3,oleadas:3,porOleada:3,tipos:['remiendo'],plantas:['margarita','frijol','calabaza'],cielo:'#c6e0e1',suelo:'#94ba88',sub:'Un patio pequeño para aprender a sembrar.'},
 {id:'macetas',nombre:'El paseo de las macetas',filas:3,oleadas:4,porOleada:4,tipos:['remiendo','olla'],plantas:['margarita','frijol','calabaza','menta'],cielo:'#bdd9de',suelo:'#9abb84',sub:'Las ollas protegen a los desvelados.'},
 {id:'rocío',nombre:'Las hojas con rocío',filas:4,oleadas:4,porOleada:5,tipos:['remiendo','corredor'],plantas:['margarita','frijol','calabaza','menta','hongo'],cielo:'#b7d6d1',suelo:'#86b397',sub:'Hay cuatro pasos entre las flores.'},
 {id:'naranjos',nombre:'La sombra de los naranjos',filas:4,oleadas:5,porOleada:5,tipos:['remiendo','olla','corredor'],plantas:[...todas],cielo:'#e5d3b3',suelo:'#9fb77f',sub:'El chile cometa abre espacio cuando se juntan.'},
 {id:'llovizna',nombre:'La tarde de llovizna',filas:5,oleadas:5,porOleada:6,tipos:['remiendo','paraguas'],plantas:[...todas],cielo:'#b9c6d2',suelo:'#7fac98',sub:'Los paraguas amortiguan las semillas pequeñas.'},
 {id:'costuras',nombre:'El sendero de costuras',filas:5,oleadas:5,porOleada:6,tipos:['remiendo','olla','corredor'],plantas:[...todas],cielo:'#dbc7d6',suelo:'#9ab38d',sub:'La campanilla cuida a sus vecinas.'},
 {id:'faroles',nombre:'Cuando prenden los faroles',filas:5,oleadas:6,porOleada:6,tipos:['remiendo','paraguas','corredor'],plantas:[...todas],cielo:'#7985a3',suelo:'#779c86',sub:'Las luces siguen cayendo entre los faroles.'},
 {id:'lavanda',nombre:'Las hileras de lavanda',filas:5,oleadas:6,porOleada:7,tipos:['remiendo','olla','paraguas'],plantas:[...todas],cielo:'#ad9abd',suelo:'#91a586',sub:'Llega el primer grandote en la última oleada.'},
 {id:'luciernagas',nombre:'La ronda de las luciérnagas',filas:5,oleadas:6,porOleada:7,tipos:['remiendo','corredor','paraguas'],plantas:[...todas],cielo:'#647f91',suelo:'#6c9884',sub:'Cubre los carriles antes de que corran.'},
 {id:'tapiz',nombre:'El tapiz de la abuela',filas:5,oleadas:7,porOleada:7,tipos:['remiendo','olla','corredor','paraguas'],plantas:[...todas],cielo:'#d3acb9',suelo:'#97a877',sub:'Todas las visitas se reúnen en el tapiz.'},
 {id:'medianoche',nombre:'Las doce de la noche',filas:5,oleadas:7,porOleada:8,tipos:['remiendo','olla','corredor','paraguas'],plantas:[...todas],cielo:'#4b587c',suelo:'#66877d',sub:'Las macetas están despiertas y los faroles encendidos.'},
 {id:'amanecer',nombre:'Un amanecer sin bostezos',filas:5,oleadas:8,porOleada:8,tipos:['remiendo','olla','corredor','paraguas'],plantas:[...todas],cielo:'#edc3a5',suelo:'#9bb586',sub:'La última ronda del jardín: cada carril cuenta.'},
];
