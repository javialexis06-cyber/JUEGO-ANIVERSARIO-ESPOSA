export const JUEGOS = [
 {id:'parejas',categoria:'memoria',nombre:'Parejas del jardín',area:'Memoria visual',icono:'🌼',reglas:'Destapa dos cartas y encuentra las ocho parejas.',objetivo:120},
 {id:'simon',categoria:'memoria',nombre:'El coro de luces',area:'Secuencias',icono:'🎵',reglas:'Observa las luces y repite su orden. Completa cinco secuencias.',objetivo:100},
 {id:'cuadricula',categoria:'memoria',nombre:'Ventanas de colores',area:'Memoria espacial',icono:'🟪',reglas:'Recuerda las casillas iluminadas. Márcalas cuando se oculten y confirma. Son tres rondas.',objetivo:80},
 {id:'diferencias',categoria:'atencion',nombre:'Dos patios',area:'Atención al detalle',icono:'🔎',reglas:'Compara los dos patios y toca las cinco diferencias en el de la derecha.',objetivo:90},
 {id:'buscar',categoria:'atencion',nombre:'¿Dónde está?',area:'Atención selectiva',icono:'🍓',reglas:'Encuentra el objeto pedido entre los demás. Son diez búsquedas.',objetivo:70},
 {id:'stroop',categoria:'atencion',nombre:'Tinta traviesa',area:'Control de respuestas',icono:'🎨',reglas:'Elige el COLOR DE LA TINTA, aunque la palabra diga otro color. Son doce turnos.',objetivo:60},
 {id:'calculo',categoria:'numeros',nombre:'Cuentas del puesto',area:'Cálculo mental',icono:'🧮',reglas:'Resuelve doce operaciones. Elige una respuesta por turno.',objetivo:90},
 {id:'sudoku',categoria:'logica',nombre:'Sudoku de bolsillo',area:'Lógica',icono:'🔢',reglas:'Completa con 1, 2, 3 y 4. No repitas en filas, columnas ni cuadros de 2×2.',objetivo:160},
 {id:'sopa',categoria:'lenguaje',nombre:'Letras entre hojas',area:'Búsqueda visual',icono:'🔤',reglas:'Toca la primera y la última letra de cada palabra. Pueden ir en línea horizontal, vertical o diagonal.',objetivo:160},
 {id:'anagramas',categoria:'lenguaje',nombre:'Palabras revueltas',area:'Lenguaje',icono:'📝',reglas:'Ordena las letras para formar la palabra indicada por su tema. Completa seis.',objetivo:130},
 {id:'deslizante',categoria:'espacio',nombre:'Las nueve baldosas',area:'Planificación espacial',icono:'🧩',reglas:'Desliza una baldosa vecina al espacio vacío. Ordena del 1 al 8 y deja el hueco al final.',objetivo:180},
 {id:'tangram',categoria:'espacio',nombre:'Siluetas de fieltro',area:'Rotación mental',icono:'🔺',reglas:'Escoge una pieza, gírala y toca su posición en la silueta. Las siete deben encajar.',objetivo:180},
 {id:'hanoi',categoria:'espacio',nombre:'Las torres del patio',area:'Planificación',icono:'🗼',reglas:'Lleva los cuatro discos a la torre de la derecha. Mueve uno por vez; nunca uno grande sobre uno pequeño.',objetivo:130},
 {id:'laberinto',categoria:'espacio',nombre:'El camino del perrito',area:'Orientación',icono:'🐾',reglas:'Lleva la patita hasta la casita. Usa las flechas o toca una casilla vecina.',objetivo:100},
 {id:'compras',categoria:'memoria',nombre:'La lista del mercado',area:'Memoria cotidiana',icono:'🧺',reglas:'Recuerda los ocho productos. Después elígelos entre los dieciséis y confirma.',objetivo:90},
 {id:'nback',categoria:'memoria',nombre:'Dos pasos atrás',area:'Memoria de trabajo',icono:'🦋',reglas:'Observa las dos primeras figuras. Después indica si la figura coincide con la de hace DOS turnos, no con la anterior.',objetivo:100},
 // Juegos nuevos (pedido de Javier, 1 de noviembre de 2026): más tipos de juego.
 {id:'schulte',categoria:'atencion',nuevo:true,nombre:'Tabla de luciérnagas',area:'Atención y rapidez',icono:'✨',reglas:'Toca los números del 1 al 25 en orden, lo más rápido que puedas.',objetivo:60},
 {id:'luces',categoria:'logica',nuevo:true,nombre:'Apaga los faroles',area:'Lógica',icono:'🏮',reglas:'Al tocar un farol cambian él y sus vecinos de arriba, abajo y los lados. Apágalos todos. Son dos tableros.',objetivo:150},
 {id:'codigo',categoria:'logica',nuevo:true,nombre:'El candado de colores',area:'Deducción',icono:'🔐',reglas:'Adivina los cuatro colores del candado. Tras cada intento ves cuántos están en su sitio y cuántos son del color correcto en otro sitio. Tienes ocho intentos.',objetivo:150},
 {id:'series',categoria:'numeros',nuevo:true,nombre:'¿Qué número sigue?',area:'Razonamiento numérico',icono:'📈',reglas:'Descubre la regla de cada serie y elige el número que sigue. Son ocho series.',objetivo:100},
 {id:'matriz',categoria:'logica',nuevo:true,nombre:'La pieza que falta',area:'Razonamiento visual',icono:'🔷',reglas:'Cada fila y cada columna siguen una regla de forma, color y cantidad. Elige la pieza que completa el cuadro. Son seis cuadros.',objetivo:110},
 {id:'nonograma',categoria:'logica',nuevo:true,nombre:'El dibujo escondido',area:'Lógica',icono:'🖼️',reglas:'Los números dicen cuántas casillas seguidas se pintan en cada fila y columna. Pinta las correctas y descubre el dibujo.',objetivo:150},
] as const;
export type IdMental = typeof JUEGOS[number]['id'];
export const juegoDe=(id:IdMental)=>JUEGOS.find(j=>j.id===id)!;
export type CategoriaMental='memoria'|'atencion'|'logica'|'numeros'|'lenguaje'|'espacio';
export const CATEGORIAS:readonly {id:CategoriaMental;nombre:string;color:string}[]=[
 {id:'memoria',nombre:'Memoria',color:'#8e6bd8'},
 {id:'atencion',nombre:'Atención',color:'#ef7d57'},
 {id:'logica',nombre:'Lógica',color:'#2f9ec4'},
 {id:'numeros',nombre:'Números',color:'#e5a823'},
 {id:'lenguaje',nombre:'Palabras',color:'#e2589b'},
 {id:'espacio',nombre:'Espacio y planificación',color:'#4caf6a'},
];
export const categoriaDe=(id:IdMental)=>CATEGORIAS.find(c=>c.id===juegoDe(id).categoria)!;
export function fechaBogota(ahora=new Date()):string {
 const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(ahora);
 return ['year','month','day'].map(k=>p.find(x=>x.type===k)!.value).join('-');
}
export function semillaDe(s:string):number {let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
/** Juegos del reto diario, en el mismo orden que valida `patio_publicar` en `supabase/patio-clasificacion.sql`
 *  (módulo 16). Los seis juegos del 1 de noviembre de 2026 quedan para práctica libre: sumarlos al reto exige cambiar
 *  y volver a aplicar ese SQL, o el servidor rechazaría las marcas de los días que no coincidan. */
export const JUEGOS_RETO:IdMental[]=['parejas','simon','cuadricula','diferencias','buscar','stroop','calculo','sudoku','sopa','anagramas','deslizante','tangram','hanoi','laberinto','compras','nback'];
export function retoDiario(fecha=fechaBogota()) {
 const dia=Math.floor(Date.parse(fecha+'T00:00:00Z')/86400000), n=JUEGOS_RETO.length;
 const juego=juegoDe(JUEGOS_RETO[((dia%n)+n)%n]);
 return {fecha,juego,semilla:semillaDe('patio-v1:'+fecha+':'+juego.id)};
}
