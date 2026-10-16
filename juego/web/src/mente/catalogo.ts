export const JUEGOS = [
 {id:'parejas',nombre:'Parejas del jardín',area:'Memoria visual',icono:'🌼',reglas:'Destapa dos cartas y encuentra las ocho parejas.',objetivo:120},
 {id:'simon',nombre:'El coro de luces',area:'Secuencias',icono:'🎵',reglas:'Observa las luces y repite su orden. Completa cinco secuencias.',objetivo:100},
 {id:'cuadricula',nombre:'Ventanas de colores',area:'Memoria espacial',icono:'🟪',reglas:'Recuerda las casillas iluminadas. Márcalas cuando se oculten y confirma. Son tres rondas.',objetivo:80},
 {id:'diferencias',nombre:'Dos patios',area:'Atención al detalle',icono:'🔎',reglas:'Compara los dos patios y toca las cinco diferencias en el de la derecha.',objetivo:90},
 {id:'buscar',nombre:'¿Dónde está?',area:'Atención selectiva',icono:'🍓',reglas:'Encuentra el objeto pedido entre los demás. Son diez búsquedas.',objetivo:70},
 {id:'stroop',nombre:'Tinta traviesa',area:'Control de respuestas',icono:'🎨',reglas:'Elige el COLOR DE LA TINTA, aunque la palabra diga otro color. Son doce turnos.',objetivo:60},
 {id:'calculo',nombre:'Cuentas del puesto',area:'Cálculo mental',icono:'🧮',reglas:'Resuelve doce operaciones. Elige una respuesta por turno.',objetivo:90},
 {id:'sudoku',nombre:'Sudoku de bolsillo',area:'Lógica',icono:'🔢',reglas:'Completa con 1, 2, 3 y 4. No repitas en filas, columnas ni cuadros de 2×2.',objetivo:160},
 {id:'sopa',nombre:'Letras entre hojas',area:'Búsqueda visual',icono:'🔤',reglas:'Toca la primera y la última letra de cada palabra. Pueden ir en línea horizontal, vertical o diagonal.',objetivo:160},
 {id:'anagramas',nombre:'Palabras revueltas',area:'Lenguaje',icono:'📝',reglas:'Ordena las letras para formar la palabra indicada por su tema. Completa seis.',objetivo:130},
 {id:'deslizante',nombre:'Las nueve baldosas',area:'Planificación espacial',icono:'🧩',reglas:'Desliza una baldosa vecina al espacio vacío. Ordena del 1 al 8 y deja el hueco al final.',objetivo:180},
 {id:'tangram',nombre:'Siluetas de fieltro',area:'Rotación mental',icono:'🔺',reglas:'Escoge una pieza, gírala y toca su posición en la silueta. Las siete deben encajar.',objetivo:180},
 {id:'hanoi',nombre:'Las torres del patio',area:'Planificación',icono:'🗼',reglas:'Lleva los cuatro discos a la torre de la derecha. Mueve uno por vez; nunca uno grande sobre uno pequeño.',objetivo:130},
 {id:'laberinto',nombre:'El camino del perrito',area:'Orientación',icono:'🐾',reglas:'Lleva la patita hasta la casita. Usa las flechas o toca una casilla vecina.',objetivo:100},
 {id:'compras',nombre:'La lista del mercado',area:'Memoria cotidiana',icono:'🧺',reglas:'Recuerda los ocho productos. Después elígelos entre los dieciséis y confirma.',objetivo:90},
 {id:'nback',nombre:'Dos pasos atrás',area:'Memoria de trabajo',icono:'🦋',reglas:'Observa las dos primeras figuras. Después indica si la figura coincide con la de hace DOS turnos, no con la anterior.',objetivo:100},
] as const;
export type IdMental = typeof JUEGOS[number]['id'];
export const juegoDe=(id:IdMental)=>JUEGOS.find(j=>j.id===id)!;
export function fechaBogota(ahora=new Date()):string {
 const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(ahora);
 return ['year','month','day'].map(k=>p.find(x=>x.type===k)!.value).join('-');
}
export function semillaDe(s:string):number {let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
export function retoDiario(fecha=fechaBogota()) {
 const dia=Math.floor(Date.parse(fecha+'T00:00:00Z')/86400000);
 const juego=JUEGOS[((dia%JUEGOS.length)+JUEGOS.length)%JUEGOS.length];
 return {fecha,juego,semilla:semillaDe('patio-v1:'+fecha+':'+juego.id)};
}
