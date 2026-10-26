/** Recursos propios creados con la dirección artística aprobada. No intervienen en el azar del motor. */
export const RECURSOS_ARTE_PVZ={
 dia:'plantas-dia.webp',noche:'plantas-noche.webp',piscina:'plantas-piscina.webp',niebla:'plantas-niebla.webp',tejado:'plantas-tejado.webp',accesoriosTejado:'zombis-tejado.webp',fondoTejado:'fondo-tejado.webp',
 ropa:'zombis-ropa.webp',protegidos:'zombis-protegidos.webp',especiales:'zombis-especiales.webp',agua:'zombis-agua-accesorios.webp',fondos:'fondos-mundos.webp',objetos:'objetos.webp',tripitidora:'tripitidora.webp',
 interfaz:'interfaz-conquista.webp',lugares:'lugares-conquista.webp',nave:'nave-zomboid.webp',
 portada:'portada-conquista.webp',mundo:'mapa-mundo.webp',pais:'mapa-pais.webp',ciudad:'mapa-ciudad.webp',
} as const;
export type HojaPvZ=keyof typeof RECURSOS_ARTE_PVZ;
export interface FiguraPvZ {hoja:HojaPvZ;celda:number;alto:number;ancho?:number}
const grupo=(hoja:HojaPvZ,ids:string[],altos:number[]):Record<string,FiguraPvZ>=>Object.fromEntries(ids.map((id,i)=>[id,{hoja,celda:i,alto:altos[i]}]));
export const ARTE_PLANTAS_PVZ:Readonly<Record<string,FiguraPvZ>>={
 ...grupo('dia',['lanzaguisantes','girasol','petacereza','nuez','patatapum','hielaguisantes','planta-carnivora','repetidora'],[78,86,60,86,45,83,95,80]),
 ...grupo('noche',['seta-desesporada','seta-solar','humoseta','comepiedras','hipnoseta','seta-miedica','seta-congelada','petaseta'],[48,52,82,77,74,94,78,85]),
 ...grupo('piscina',['nenufar','aplastaflor','tripitidora','zampalga','jalapeno','pinchohierba','plantorcha','nuez-alta'],[28,79,100,67,85,36,110,113]),
 tripitidora:{hoja:'tripitidora',celda:0,alto:110},
 ...grupo('niebla',['marseta','planterna','cactus','trebolador','bipetidora','frustrella','calabaza','magnetoseta'],[52,94,106,83,83,74,58,92]),
 'nuez-explosiva':{hoja:'dia',celda:3,alto:86},
 ...grupo('tejado',['coltapulta','maceta','lanzamaiz','grano-cafe','ajo','paraplanta','margarita','melonpulta'],[92,50,92,46,76,96,90,96]),
};
/** Accesorios del tejado (hoja propia vectorial): escalera, catapulta, poste, balón, robot, caravana y bolas del jefe. */
export const ACCESORIOS_TEJADO_PVZ={escalera:0,catapulta:1,poste:2,balon:3,robot:4,caravana:5,fuego:6,hielo:7} as const;
export const ROPAS_ZOMBI_PVZ=['Saco y corbata','Chaqueta vaquera','Sudadera','Camisa de cuadros','Overol','Impermeable','Pijama','Chaqueta deportiva'] as const;
export const ARTE_ZOMBIS_PVZ:Readonly<Record<string,FiguraPvZ>>={
 ...grupo('especiales',['saltador','zombi-futbolista','zombi-bailon','zombi-acompanante','zombi-cajita','zombi-globo','zombi-minero','zombi-pogo'],[132,137,135,128,131,185,134,150]),
 ...grupo('agua',['zombi-buzo','zombi-delfin','zomboni','zombi-trineo'],[126,120,138,115]),
 'zombi-catapulta':{hoja:'accesoriosTejado',celda:1,alto:120},'dr-zomboid':{hoja:'accesoriosTejado',celda:4,alto:330},
};
/** Colgado, escalera, gargantúa y diablillo usan el cuerpo con ropa variable más sus accesorios dibujados encima. */
export const ESCALA_ZOMBI_TEJADO_PVZ:Readonly<Record<string,number>>={gargantua:1.6,diablillo:.62};
/** Cuerpo y protección ya están dibujados juntos: ningún casco o puerta flota sobre el cuerpo.
 * La ropa de debajo se conserva cuando el motor retira la armadura. */
export function proteccionZombiPvZ(tipo:string,ropa:number):{figura:FiguraPvZ;ropa:number}|undefined {
 const variante=ropa%2;
 if(tipo==='caracono'||tipo==='caracono-flotador')return{figura:{hoja:'protegidos',celda:variante,alto:155},ropa:[0,1][variante]};
 if(tipo==='caracubo'||tipo==='caracubo-flotador')return{figura:{hoja:'protegidos',celda:2+variante,alto:146},ropa:[0,5][variante]};
 if(tipo==='zombi-portero')return{figura:{hoja:'protegidos',celda:4+variante,alto:126},ropa:[0,4][variante]};
 if(tipo==='zombi-periodico')return{figura:{hoja:'protegidos',celda:6+variante,alto:126},ropa:[3,6][variante]};
}
/** Hash visual estable: consultar o redibujar no consume la secuencia determinista de combate. */
export function ropaZombiPvZ(id:number,nivel:string){let h=2166136261;for(const c of nivel)h=Math.imul(h^c.charCodeAt(0),16777619);h^=id;h=Math.imul(h^(h>>>16),0x7feb352d);h=Math.imul(h^(h>>>15),0x846ca68b);return((h^(h>>>16))>>>0)%ROPAS_ZOMBI_PVZ.length;}
export const urlArtePvZ=(archivo:string)=>new URL(`jardin/pvz/${archivo}`,new URL(import.meta.env.BASE_URL,location.href)).href;
