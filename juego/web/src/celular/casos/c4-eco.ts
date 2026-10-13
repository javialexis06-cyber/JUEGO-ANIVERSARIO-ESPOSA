// Caso 4 · La niña del Eco (Jardines del Eco, Verdia, AV 312).
// Abril, la más joven del coro de Sora (por eso le dicen «la niña del Eco»: siempre repite el último verso), terminó su
// camino en Senda y subió a Verdia. Una tarde entró a un seto nuevo que nadie sembró: es uno de los laberintos de
// Vael'Thor de AV 268 que nadie desarmó (docs/narrativa/01-mundo.md). Adentro, la misma tarde se repite. El giro: sus
// mensajes y sus notas de voz son idénticos día tras día. La salida: los moldes de Vael'Thor solo saben respuestas
// idénticas; si el coro le canta un final distinto, ella responde otra cosa y el laberinto se desarma.
import type { Caso } from '../tipos';

const REPITE = 'Ya voy saliendo por el seto, guárdenme puesto 🌹';

export const CASO_ECO: Caso = {
  id: 'eco',
  n: 4,
  titulo: 'La niña del Eco',
  lugar: 'Jardines del Eco',
  mundo: 'Verdia',
  persona: { nombre: 'Abril', edad: '17 años cuando llegó a Senda', oficio: 'Voz del coro de los Jardines', foto: 'c4_abril' },
  expediente: [
    'Este me llegó desde Verdia, de la mano de Sora, la que dirige el coro de los Jardines del Eco. Abril, la más jovencita del coro, lleva seis tardes sin llegar al ensayo.',
    'Le dicen «la niña del Eco» porque siempre repite el último verso de cada canción. Subió de Senda hace poco: terminó su camino allá y escogió quedarse en Verdia.',
    'El teléfono estaba en una banca, a la entrada de un seto de rosas que nadie recuerda haber sembrado. Sora dice que Abril marcaba el compás en el aire con una Z, «como el zigzag del seto».',
  ],
  hallazgo: 'Banca de piedra a la entrada del seto nuevo',
  dueno: 'Abril',
  telefono: {
    modelo: 'Pétalo mini',
    fondo: 'c4_fondo',
    acento: '#d96a9a',
    oscuro: false,
    bateria: 64,
    operador: 'Verdia',
    hora: '18:40',
    fecha: 'sábado 12 de Primavera',
    carcasa: 'flores',
    letra: '"Comic Sans MS", "Chalkboard SE", cursive',
    avisos: [
      { app: 'mensajes', titulo: 'Coro de los Jardines', texto: 'Sora: Abril, ¿dónde estás, corazón?', t: '18:39' },
      { app: 'mensajes', titulo: 'Esteban', texto: 'Ese seto no está en ningún plano', t: '11:02' },
      { app: 'grabadora', titulo: 'Grabadora', texto: 'Seto (3)', t: '18:40' },
    ],
  },
  bloqueo: { id: 'bloqueo', tipo: 'patron', clave: '1235789', titulo: 'Dibuja el patrón', recordatorio: 'El compás', pista: 'patron' },
  candados: [
    { id: 'partitura', tipo: 'palabra', clave: 'sol', titulo: 'Partitura (privada)', recordatorio: 'En qué nota quedó afinada mi campana', pista: 'partitura' },
  ],
  apps: ['mensajes', 'fotos', 'notas', 'grabadora', 'llamadas', 'mapa', 'calendario', 'linterna'],
  contactos: [
    { id: 'sora', nombre: 'Sora', rol: 'Coro de los Jardines', foto: 'c4_av_sora', color: '#a05a8a' },
    { id: 'esteban', nombre: 'Esteban', rol: 'Archivero de ecos', foto: 'c4_av_esteban', color: '#5a6a8a' },
    { id: 'casiano', nombre: 'Casiano', rol: 'Afinador', color: '#7a8a5a' },
    { id: 'gregoria', nombre: 'Gregoria', rol: 'Colmenas', color: '#d9a02a' },
    { id: 'iria', nombre: 'Iria', rol: 'Me acompañó en Senda', color: '#6a5aa0' },
  ],
  chats: [
    {
      con: 'sora',
      grupo: 'Coro de los Jardines',
      noLeidos: 6,
      mensajes: [
        { de: 'sora', t: '17:30', dia: 'Domingo 6 de Primavera', texto: 'Ensayo a las siete en el rosal. Canción del regreso, de principio a fin 🌹' },
        { de: 'yo', t: '18:40', texto: REPITE, pista: 'repite' },
        { de: 'sora', t: '19:20', texto: '¿Abril? Ya empezamos' },
        { de: 'yo', t: '18:40', dia: 'Lunes 7 de Primavera', texto: REPITE },
        { de: 'sora', t: '19:30', texto: 'Corazón, otra vez no llegaste. ¿Estás bien?' },
        { de: 'yo', t: '18:40', dia: 'Martes 8 de Primavera', texto: REPITE },
        { de: 'sora', t: '18:45', texto: 'Abril, ese es el mismo mensaje de ayer. Y de antier. Exactico.', pista: 'repite' },
        { de: 'yo', t: '18:40', dia: 'Miércoles 9 de Primavera', texto: REPITE },
        { de: 'yo', t: '18:40', dia: 'Jueves 10 de Primavera', texto: REPITE },
        { de: 'sora', t: '18:39', dia: 'Sábado 12 de Primavera', texto: 'Abril, ¿dónde estás, corazón?' },
      ],
    },
    {
      con: 'esteban',
      noLeidos: 1,
      mensajes: [
        { de: 'yo', t: '10:30', dia: 'Domingo 6 de Primavera', texto: 'Don Esteban, ¿quién sembró el seto de rosas de la entrada? Es muy bonito, tiene forma de zigzag.' },
        { de: 'esteban', t: '11:02', dia: 'Martes 8 de Primavera', texto: 'Ese seto no está en ningún plano de los Jardines. Lo busqué en todos los archivos.', pista: 'plano' },
        { de: 'esteban', t: '11:05', voz: 'c4_esteban_molde', pista: 'vael' },
      ],
    },
    {
      con: 'casiano',
      mensajes: [
        { de: 'casiano', t: '09:00', dia: 'Sábado 5 de Primavera', texto: 'Mija, ya le afiné la campana de viento del cuarto. Quedó en Sol, como la quería.', pista: 'sol' },
        { de: 'yo', t: '09:10', texto: '¡Gracias don Casiano! Suena como mi casa 💛' },
      ],
    },
    {
      con: 'gregoria',
      mensajes: [
        { de: 'gregoria', t: '16:00', dia: 'Lunes 7 de Primavera', texto: '¿Has visto a mis abejas? No quieren entrar al seto nuevo. Dan la vuelta en la puerta, como si chocaran con algo.', pista: 'abejas' },
      ],
    },
    {
      con: 'iria',
      mensajes: [
        { de: 'iria', t: '08:00', dia: 'Jueves 3 de Primavera', texto: '¿Llegaste bien a Verdia? Estoy muy orgullosa de ti. Lo de Senda no era fácil.' },
        { de: 'yo', t: '08:30', texto: 'Llegué 😭 Ya canto en un coro y todo. Gracias por no soltarme en la Travesía.' },
        { de: 'iria', t: '08:32', texto: 'Una cosa: si ves algo que se repite igualito, no lo sigas. En la Travesía las rutas torcidas se repetían así.', pista: 'travesia' },
      ],
    },
  ],
  fotos: [
    { id: 'rosal', archivo: 'c4_coro', fecha: '4 de Primavera', lugar: 'Rosal de los Jardines', pie: '¡Mi primer ensayo! Sora dice que tengo voz de campanita.' },
    { id: 'seto', archivo: 'c4_seto', fecha: '6 de Primavera · 18:31', lugar: 'Entrada del seto', pie: 'El seto en zigzag. Por aquí se llega más rápido al rosal.', pista: 'seto' },
    { id: 'banca1', archivo: 'c4_banca', fecha: '6 de Primavera · 18:39', lugar: 'Dentro del seto', pie: 'Una banca con un farol. Qué bonito.' },
    { id: 'banca2', archivo: 'c4_banca', fecha: '7 de Primavera · 18:39', lugar: 'Dentro del seto', pie: 'Una banca con un farol. Qué bonito.', pista: 'misma' },
    { id: 'banca3', archivo: 'c4_banca', fecha: '8 de Primavera · 18:39', lugar: 'Dentro del seto', pie: 'Una banca con un farol. Qué bonito.', pista: 'misma' },
    { id: 'pilares', archivo: 'c4_pilares', fecha: '10 de Primavera · 18:40', lugar: 'Dentro del seto', pie: '', oscura: true, pistaLinterna: 'pilares' },
  ],
  notas: [
    { id: 'cancion', titulo: 'Canción del regreso', fecha: '4 de Primavera', texto: 'Por la senda de las rosas\nvuelve el que se fue a buscar,\ny si el camino da vueltas\nla voz lo vuelve a llamar.\n\n…y la voz lo vuelve a llamar (esa la repito yo 🙈)' },
    { id: 'privada', titulo: 'Lo que no le cuento al coro', fecha: '5 de Primavera', candado: 'partitura', pista: 'eco', texto: 'Yo siempre repito el último verso porque es lo único que me sale de memoria desde Senda.\nSi alguien cantara otro final, no sabría qué responder.\nMe tocaría inventar algo mío. Me da miedo y ganas a la vez.' },
  ],
  voces: [
    { id: 'c4_abril_seto', quien: 'abril', nombre: 'Abril', fecha: '6, 7, 8, 9 y 10 de Primavera · 18:40', titulo: 'Seto', grabadora: true, pista: 'misma_voz', texto: 'Juraría que ya pasé por esta banca. Otra vez son las seis y cuarenta. Ya voy saliendo, ya voy saliendo.', d: '[young woman, confused, light laugh, then uneasy] Juraría que ya pasé por esta banca... Otra vez son las seis y cuarenta. Ya voy saliendo, ya voy saliendo.' },
    { id: 'c4_esteban_molde', quien: 'esteban', nombre: 'Esteban', fecha: '8 de Primavera', texto: 'Tiene la geometría de las rutas que Vael\'Thor torció. Esos moldes solo saben repetir. Si quien está adentro responde algo distinto, el molde se rompe.', d: '[old scholar, calm, grave] Tiene la geometría de las rutas que Vael\'Thor torció. Esos moldes solo saben repetir. Si quien está adentro responde algo distinto... el molde se rompe.' },
    { id: 'c4_sora_coro', quien: 'sora', nombre: 'Sora', fecha: 'Ensayo', texto: 'Esta vez no vamos a cantar el final de siempre. Abril, campanita, contéstanos con lo tuyo.', d: '[warm choir leader, gentle, hopeful] Esta vez no vamos a cantar el final de siempre. Abril, campanita... contéstanos con lo tuyo.' },
    { id: 'c4_abril_fin', quien: 'abril', nombre: 'Abril', fecha: '12 de Primavera', texto: 'Era la misma tarde, una y otra vez. Y de repente alguien cantó otra cosa, y yo también.', d: '[relieved, a little teary, smiling] Era la misma tarde, una y otra vez. Y de repente alguien cantó otra cosa... y yo también.' },
  ],
  llamadas: [
    { quien: 'sora', t: '19:21', dia: '6 de Primavera', tipo: 'perdida' },
    { quien: 'sora', t: '19:31', dia: '7 de Primavera', tipo: 'perdida' },
    { quien: 'esteban', t: '11:10', dia: '8 de Primavera', tipo: 'perdida' },
    { quien: 'iria', t: '08:10', dia: '3 de Primavera', tipo: 'entrante', dur: '12:40' },
  ],
  mapa: {
    titulo: 'Jardines del Eco',
    fondo: '#dbeccf',
    trazos: [
      { tipo: 'camino', d: '6,80 30,70 50,50 70,30 92,20' },
      { tipo: 'zona', d: '40,56 64,56 64,86 40,86', color: '#9cc48a' },
      { tipo: 'ruta', d: '42,60 62,62 44,68 62,72 44,78 62,82', color: '#c04a7a' },
      { tipo: 'agua', d: '74,60 90,58 94,74 78,78' },
      { tipo: 'texto', d: '52,92', texto: '¿seto nuevo?' },
    ],
    lugares: [
      { id: 'cuarto', nombre: 'Mi cuarto', x: 10, y: 78, icono: 'casa' },
      { id: 'rosal', nombre: 'Rosal (ensayo)', x: 88, y: 22, icono: 'flor' },
      { id: 'seto', nombre: 'Seto en zigzag', x: 44, y: 58, icono: 'peligro', nota: 'Atajo al rosal (6 de Primavera)', pista: 'seto' },
      { id: 'colmenas', nombre: 'Colmenas de Gregoria', x: 84, y: 66, icono: 'pin' },
    ],
  },
  calendario: [
    { dia: '6 de Primavera', t: '19:00', texto: 'Ensayo: Canción del regreso' },
    { dia: '7 de Primavera', t: '19:00', texto: 'Ensayo' },
    { dia: '8 de Primavera', t: '19:00', texto: 'Ensayo' },
    { dia: '13 de Primavera', t: '18:00', texto: 'Concierto de la tarde en el rosal 🌹' },
  ],
  pistas: [
    { id: 'patron', texto: 'El patrón era una Z: el compás que Abril marcaba en el aire.' },
    { id: 'seto', texto: 'Abril tomó un atajo por un seto en zigzag la tarde del 6 de Primavera.', clave: true },
    { id: 'plano', texto: 'El seto no está en ningún plano de los Jardines: nadie lo sembró.', clave: true },
    { id: 'abejas', texto: 'Las abejas de Gregoria no entran al seto: dan la vuelta en la puerta.' },
    { id: 'repite', texto: 'Desde el 6 de Primavera, Abril manda el mismo mensaje todas las tardes a las 18:40, letra por letra.', clave: true, giro: true },
    { id: 'misma', texto: 'Las fotos de la banca de tres días distintos son idénticas: la misma luz, el mismo farol.' },
    { id: 'misma_voz', texto: 'La grabadora tiene la misma nota de voz cinco días seguidos: es la misma tarde repitiéndose.' },
    { id: 'pilares', texto: 'Con la linterna se ve la última foto: pilares con hilos de luz dentro del seto. Son de las rutas torcidas de Senda.' },
    { id: 'vael', texto: 'Esteban: el seto tiene la geometría de las rutas de Vael\'Thor. Esos moldes solo saben repetir: si quien está adentro responde distinto, se rompen.', clave: true },
    { id: 'travesia', texto: 'Iria le advirtió que las rutas torcidas de la Travesía se repetían igualitas.' },
    { id: 'sol', texto: 'Casiano afinó la campana de su cuarto en Sol.' },
    { id: 'partitura', texto: 'La partitura privada se abrió con «sol».' },
    { id: 'eco', texto: 'Abril siempre repite el último verso: «si alguien cantara otro final, me tocaría inventar algo mío».', clave: true },
  ],
  ayudas: [
    { etapa: 'bloqueo', textos: ['El expediente dice cómo marcaba Abril el compás.', 'Una Z: arriba de izquierda a derecha, en diagonal hacia abajo y otra vez de izquierda a derecha.', 'Dibuja 1 → 2 → 3 → 5 → 7 → 8 → 9.'] },
    { etapa: 'partitura', textos: ['El recordatorio habla de una campana. ¿Quién afina las campanas en los Jardines?', 'Casiano le escribió en qué nota quedó.', 'Escribe sol.'] },
    { etapa: 'resolver', textos: ['Compara los mensajes del coro y las fotos de la banca: ¿qué tienen de raro?', 'Esteban dice qué es el seto y cómo se rompe; la partitura privada dice qué haría Abril.', 'Está atrapada en un laberinto de Vael\'Thor; se rompe cantándole un final distinto.'] },
  ],
  preguntas: [
    {
      texto: '¿Qué es el seto en zigzag?',
      opciones: ['Un jardín que Abril sembró', 'Un laberinto viejo de Vael\'Thor que nadie desarmó: repite la misma tarde', 'Una colmena gigante de Gregoria', 'La puerta de Nox'],
      correcta: 1,
      porque: 'No está en ningún plano, las abejas no entran y adentro todo se repite: es un molde de Vael\'Thor de los tiempos en que torció las rutas de Senda.',
    },
    {
      texto: '¿Cómo se saca a Abril?',
      opciones: ['Quemando el seto', 'Esperando a que se canse', 'Cantándole un final distinto de la canción, para que ella responda algo suyo', 'Llamándola por teléfono'],
      correcta: 2,
      porque: 'Los moldes de Vael\'Thor solo saben respuestas idénticas. Una respuesta nueva y libre los desajusta.',
    },
  ],
  final: {
    titulo: 'Otro final',
    paneles: [
      { foto: 'c4_fin_coro', texto: 'A las seis y cuarenta, el coro entero se para frente al seto. Sora levanta la mano.', voz: 'c4_sora_coro', mov: 'acerca' },
      { foto: 'c4_fin_seto', texto: 'Cantan la canción, pero cambian el último verso. Del seto sale una voz que no repite: inventa.', mov: 'der' },
      { foto: 'c4_fin_abril', texto: 'Las rosas se desenredan como un hilo. Abril sale caminando, con el farol de la banca en la mano.', voz: 'c4_abril_fin', mov: 'aleja' },
    ],
    cierre: 'Caso cerrado. Esteban y Gregoria desarmaron el seto rosa por rosa. Las abejas ya entran.',
  },
};
