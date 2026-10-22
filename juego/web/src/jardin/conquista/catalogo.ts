import type {FichaConquista} from './tipos';
import {PLANTAS_PVZ} from '../pvz/datos/plantas';
import {ZOMBIS_PVZ} from '../pvz/datos/zombis';
/** Perfiles exclusivos de esta prueba de conquista. No cambian las fichas del motor PvZ. */
const base:Record<string,FichaConquista>=Object.fromEntries([
 ['lanzaguisantes','Lanzaguisantes','plantas',12,110,0,22,1.25,390,0,1.8,'Dispara al primer enemigo de su carril.'],
 ['girasol','Girasol','plantas',10,90,0,0,5,0,0,3,'Produce reservas aunque estés mirando otro frente.'],
 ['nuez','Nuez','plantas',14,420,0,0,1,0,0,2.5,'Barrera que sostiene la cabecera.'],
 ['hielaguisantes','Hielaguisantes','plantas',24,100,0,18,1.4,410,0,3,'Ralentiza a los zombis alcanzados.'],
 ['repetidora','Repetidora','plantas',28,120,0,42,1.3,430,0,3,'Mayor potencia para posiciones difíciles.'],
 ['petacereza','Petacereza','plantas',35,1,0,230,.2,145,0,12,'Explosión inmediata alrededor de la casilla.'],
 ['zombi','Zombi','zombis',10,130,0,24,1,24,23,1.8,'Avanza y muerde la primera defensa.'],
 ['caracono','Caracono','zombis',18,130,150,24,1,24,21,2.5,'Protección adicional para abrir una ruta.'],
 ['caracubo','Caracubo','zombis',30,130,330,24,1,24,18,4,'Resiste un asalto prolongado.'],
 ['zombi-portero','Portero','zombis',24,130,240,24,1,24,20,3.5,'Avanza protegido por su puerta.'],
 ['zombi-futbolista','Futbolista','zombis',35,220,200,36,.9,27,35,5,'Unidad rápida para concentrar un asalto.'],
 ['zombi-periodico','Lector','zombis',15,120,65,24,.9,24,23,2.5,'Se acelera cuando pierde el periódico.'],
].map(a=>{const[id,nombre,bando,coste,vida,armadura,dano,intervalo,alcance,velocidad,recarga,descripcion]=a;return[id,{id,nombre,bando,coste,vida,armadura,dano,intervalo,alcance,velocidad,recarga,descripcion} as FichaConquista];}));
const extras:Record<string,Partial<FichaConquista>>={
 girasol:{rol:'produccion'},nuez:{rol:'muro'},hielaguisantes:{rol:'hielo'},petacereza:{rol:'explosion'},
 'patatapum':{rol:'mina',dano:260,alcance:85,vida:70,descripcion:'Se arma en cinco segundos y explota al contacto.'},
 'planta-carnivora':{rol:'devorar',dano:240,alcance:75,intervalo:8,vida:180,descripcion:'Devora un enemigo próximo y tarda en volver a atacar.'},
 'seta-desesporada':{alcance:230,coste:5},'seta-solar':{rol:'produccion',coste:8},
 humoseta:{rol:'humo',dano:24,alcance:300,descripcion:'Daña y atraviesa armaduras en su área de humo.'},
 comepiedras:{rol:'humo',dano:32,alcance:190,intervalo:2,descripcion:'En conquista erosiona protecciones cercanas con daño penetrante.'},
 hipnoseta:{rol:'hipnosis',dano:0,vida:80,alcance:65,descripcion:'Convierte un enemigo cercano en daño contra sus compañeros y desaparece.'},
 'seta-miedica':{alcance:550,dano:20,descripcion:'Dispara a larga distancia.'},'seta-congelada':{rol:'congelar',coste:30,recarga:12,descripcion:'Ralentiza a todos los zombis de este frente y desaparece.'},
 petaseta:{rol:'explosion',dano:340,alcance:250,coste:42,recarga:14},
 nenufar:{rol:'escudo',vida:150,dano:0,coste:7,alcance:130,descripcion:'Apoyo de conquista: repara periódicamente a una defensa cercana.'},
 aplastaflor:{rol:'devorar',vida:120,dano:320,intervalo:9,alcance:85,descripcion:'Aplasta al primer enemigo que alcance y desaparece.'},
 tripitidora:{rol:'triple',dano:24,coste:38,alcance:430,descripcion:'Dispara por su carril y los dos vecinos.'},
 zampalga:{rol:'devorar',dano:400,alcance:60,intervalo:12,vida:65,descripcion:'Atrapa al primer enemigo próximo y desaparece; también sirve en calles.'},
 jalapeno:{rol:'linea',dano:350,coste:38,recarga:14,descripcion:'Quema a todos los enemigos del carril elegido.'},
 pinchohierba:{rol:'pinchos',dano:22,vida:200,alcance:65,intervalo:.8,descripcion:'Daña a los enemigos que pasan por su casilla.'},
 plantorcha:{rol:'fuego',dano:0,vida:160,alcance:500,descripcion:'Aumenta el daño de los disparos que la atraviesan.'},
 'nuez-alta':{rol:'muro',vida:720,coste:28,dano:0},
 marseta:{alcance:230,coste:5,descripcion:'Artillería de corto alcance adaptada a los carriles terrestres.'},planterna:{rol:'luz',vida:150,dano:0,alcance:180,descripcion:'Apoyo de conquista: refuerza el daño de plantas cercanas.'},
 cactus:{dano:28,alcance:540,descripcion:'Disparos que también alcanzan objetivos aéreos.'},
 trebolador:{rol:'viento',dano:80,coste:15,recarga:10,descripcion:'Empuja a los enemigos y derriba a los voladores.'},
 bipetidora:{rol:'triple',dano:18,alcance:410,descripcion:'En conquista cubre su carril y los vecinos con disparos repartidos.'},
 frustrella:{rol:'estrella',dano:20,alcance:380,intervalo:1.2},calabaza:{rol:'escudo',vida:420,dano:0,alcance:100,descripcion:'Apoyo de conquista: repara y protege posiciones próximas.'},
 magnetoseta:{rol:'iman',dano:10,alcance:300,intervalo:3,descripcion:'Retira armadura al enemigo cercano.'},
 saltador:{rol:'salto',velocidad:33,descripcion:'Salta una primera defensa baja; la Nuez alta detiene el salto.'},'zombi-bailon':{vida:190,descripcion:'Líder resistente de avance continuo.'},'zombi-acompanante':{descripcion:'Escolta ligero que avanza y muerde.'},'zombi-buzo':{descripcion:'Explorador ágil adaptado a los carriles terrestres de Conquista.'},'zombi-flotador':{descripcion:'Infantería adaptada a calles; en esta base todos los carriles son terrestres.'},'caracono-flotador':{descripcion:'Unidad con cono adaptada a los carriles terrestres.'},'caracubo-flotador':{descripcion:'Unidad con cubo adaptada a los carriles terrestres.'},'zombi-globo':{rol:'vuelo',velocidad:19},
 'zombi-cajita':{rol:'caja',dano:170,vida:110,velocidad:24},'zombi-minero':{rol:'minero',velocidad:30},'zombi-pogo':{rol:'salto',velocidad:29},
 'zomboni':{rol:'vehiculo',vida:360,armadura:150,dano:90,intervalo:1.7,velocidad:17},'zombi-trineo':{rol:'vehiculo',vida:260,dano:45,velocidad:31},
 'zombi-delfin':{rol:'salto',velocidad:34},
};
for(const p of Object.values(PLANTAS_PVZ)){if(p.id==='nuez-explosiva')continue;if(!base[p.id])base[p.id]={id:p.id,nombre:p.nombre,bando:'plantas',coste:Math.max(5,Math.round(p.sol/7)),vida:110,armadura:0,dano:22,intervalo:1.4,alcance:390,velocidad:0,recarga:3,descripcion:p.descripcion};}
for(const z of Object.values(ZOMBIS_PVZ))if(!base[z.id])base[z.id]={id:z.id,nombre:z.nombre,bando:'zombis',coste:Math.min(42,10+(z.datos?.puntos??1)*4),vida:Math.min(360,Math.max(120,z.vida*.45)),armadura:Math.min(380,(z.armadura?.vida??0)*.3),dano:26,intervalo:1,alcance:26,velocidad:Math.max(18,Math.min(34,z.velocidad*1.2)),recarga:3,descripcion:z.descripcion};
for(const [id,ajustes]of Object.entries(extras))if(base[id])Object.assign(base[id],ajustes);
const fusiones: FichaConquista[]=[
 {id:'fusion-guisante-hielo',nombre:'Guisante glacial',bando:'plantas',coste:36,vida:150,armadura:0,dano:32,intervalo:1.2,alcance:460,velocidad:0,recarga:4,rol:'hielo',fusion:['lanzaguisantes','hielaguisantes'],arte:'hielaguisantes',descripcion:'Combina potencia y ralentización.'},
 {id:'fusion-nuez-lanzadora',nombre:'Nuez lanzadora',bando:'plantas',coste:40,vida:560,armadura:0,dano:24,intervalo:1.3,alcance:410,velocidad:0,recarga:5,fusion:['nuez','lanzaguisantes'],arte:'nuez',descripcion:'Barrera que también dispara.'},
 {id:'fusion-repetidora-fuego',nombre:'Repetidora ígnea',bando:'plantas',coste:55,vida:150,armadura:0,dano:75,intervalo:1.35,alcance:470,velocidad:0,recarga:6,fusion:['repetidora','plantorcha'],arte:'repetidora',descripcion:'Gran potencia para la ofensiva final.'},
 {id:'fusion-zombi-blindado',nombre:'Deportista blindado',bando:'zombis',coste:55,vida:260,armadura:500,dano:42,intervalo:1,alcance:28,velocidad:30,recarga:6,fusion:['caracubo','zombi-futbolista'],arte:'zombi-futbolista',descripcion:'Armadura y velocidad en una misma unidad.'},
 {id:'fusion-portero-corredor',nombre:'Portero furioso',bando:'zombis',coste:44,vida:180,armadura:330,dano:32,intervalo:.9,alcance:27,velocidad:31,recarga:5,fusion:['zombi-portero','zombi-periodico'],arte:'zombi-portero',descripcion:'Avanza rápido con una puerta reforzada.'},
];
for(const f of fusiones)base[f.id]=f;
export const FICHAS_CONQUISTA:Readonly<Record<string,FichaConquista>>=base;
export const CARTAS_CONQUISTA={plantas:['lanzaguisantes','girasol','nuez','hielaguisantes','repetidora','petacereza'],zombis:['zombi','caracono','caracubo','zombi-portero','zombi-futbolista','zombi-periodico']} as const;
export const COSTES_CONQUISTA={reforzar:30,fortificar:35,reparar:25} as const;
