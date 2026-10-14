// Caso 7 · Un concierto que se vea (Iridalia, AV 312).
// Ximena es sorda y toca los cristales resonantes por vibración. Su concierto era «uno que se vea»: cada cristal del
// valle prende cuando ella toca el cristal madre. Antes del concierto bajó a la Gran Geoda, bajo el escenario, a
// afinarlo. Orin le había mandado una nota de voz advirtiendo que la entrada no estaba estable, pero la transcripción
// automática del teléfono le quitó el «no». La entrada se cerró detrás de ella. El caso se resuelve con lo que se ve:
// desde abajo, Ximena hace brillar los cristales del valle con el código de señas de luz de Maia (G-E-O-D-A).
import type { Caso } from '../tipos';

export const CASO_IRIDALIA: Caso = {
  id: 'iridalia',
  n: 7,
  titulo: 'Un concierto que se vea',
  lugar: 'Iridalia',
  mundo: 'Cielo de Astra',
  persona: { nombre: 'Ximena', edad: '29 años', oficio: 'Música de cristales resonantes (sorda)', foto: 'c7_ximena' },
  expediente: [
    'En Iridalia no se habla de una sola manera. Ximena es sorda: toca los cristales sintiendo cómo vibran, y para su concierto de esta noche preparó algo nunca visto: un concierto que se vea.',
    'Desapareció ayer por la tarde. Su teléfono estaba en el escenario de la loma, al lado del cristal madre. Nahuel, el intérprete, dice que su nombre en señas es una N dibujada en el aire.',
    'Mauro, el rastreador, me mandó fotos raras: anoche los cristales del valle prendieron solos, uno por uno, de colores. «Como si alguien estuviera hablando», dijo.',
  ],
  hallazgo: 'Escenario de la loma, junto al cristal madre',
  dueno: 'Ximena',
  telefono: {
    modelo: 'Prisma Vibra (con avisos de luz)',
    fondo: 'c7_fondo',
    acento: '#9a5aff',
    oscuro: true,
    bateria: 55,
    operador: 'Iridalia',
    hora: '19:05',
    fecha: 'sábado 3 de Otoño',
    carcasa: 'cristal',
    letra: '"Palatino Linotype", "Book Antiqua", serif',
    avisos: [
      { app: 'mensajes', titulo: 'Maia', texto: '¿Viste las luces de anoche? 😱', t: '06:30' },
      { app: 'grabadora', titulo: 'Orin (nota de voz)', texto: 'Transcrito: «…la geoda está estable…»', t: '15:12' },
      { app: 'senas', titulo: 'Señas de luz', texto: 'Mensaje nuevo sin leer', t: '22:00' },
    ],
  },
  bloqueo: { id: 'bloqueo', tipo: 'patron', clave: '7415963', titulo: 'Dibuja el patrón', recordatorio: 'Mi nombre en señas', pista: 'patron' },
  candados: [
    { id: 'senas', tipo: 'palabra', clave: 'geoda', titulo: 'Señas de luz · mensaje recibido', recordatorio: 'Lee los colores en orden, con la tabla de Maia', pista: 'mensaje' },
  ],
  apps: ['mensajes', 'fotos', 'notas', 'grabadora', 'llamadas', 'mapa', 'senas', 'calendario', 'linterna'],
  contactos: [
    { id: 'maia', nombre: 'Maia', rol: 'Aprendiz de luthier', foto: 'c7_av_maia', color: '#d96aa0' },
    { id: 'nahuel', nombre: 'Nahuel', rol: 'Intérprete', foto: 'c7_av_nahuel', color: '#4a8a9a' },
    { id: 'orin', nombre: 'Orin', rol: 'Artesano de cristales', color: '#7a6a5a' },
    { id: 'mauro', nombre: 'Mauro', rol: 'Rastreador', color: '#4a7a3a' },
    { id: 'calista', nombre: 'Calista', rol: 'Portavoz', color: '#a08a3a' },
  ],
  senas: [
    { color: '#b04aff', nombre: 'violeta', letra: 'A' },
    { color: '#ffb02a', nombre: 'ámbar', letra: 'E' },
    { color: '#ff4a4a', nombre: 'rojo', letra: 'D' },
    { color: '#3ad46a', nombre: 'verde', letra: 'G' },
    { color: '#3a7aff', nombre: 'azul', letra: 'O' },
    { color: '#f4f4ff', nombre: 'blanco', letra: 'S' },
    { color: '#ff8ad0', nombre: 'rosa', letra: 'I' },
    { color: '#3ae0e0', nombre: 'turquesa', letra: 'L' },
  ],
  chats: [
    {
      con: 'maia',
      noLeidos: 2,
      mensajes: [
        { de: 'maia', t: '10:00', dia: 'Miércoles 30 de Verano', texto: '¡Terminé la tabla de señas de luz! Cada color, una letra. Te la dejé en la app 💜', pista: 'tabla' },
        { de: 'yo', t: '10:05', texto: '¡Maia! Con esto el concierto se puede LEER. Los de la loma van a ver lo que yo siento.' },
        { de: 'maia', t: '10:06', texto: 'Y si un día necesitas decir algo lejos, prendes los cristales del valle desde el cristal madre. Todo el valle es tu pantalla.', pista: 'valle' },
        { de: 'maia', t: '06:30', dia: 'Sábado 3 de Otoño', texto: '¿Viste las luces de anoche? 😱' },
        { de: 'maia', t: '06:31', texto: 'Ximena, contéstame. Mauro les tomó fotos.' },
        { de: 'maia', t: '06:32', voz: 'c7_maia_luces' },
      ],
    },
    {
      con: 'orin',
      mensajes: [
        { de: 'yo', t: '15:00', dia: 'Viernes 2 de Otoño', texto: 'Orin, voy a bajar a la Gran Geoda a afinar el cristal madre por debajo. ¿Se puede entrar?' },
        { de: 'orin', t: '15:12', voz: 'c7_orin_aviso', pista: 'transcripcion' },
        { de: 'yo', t: '15:14', texto: '¡Perfecto, gracias! Bajo ya 💜' },
        { de: 'orin', t: '15:40', texto: '??? NO, Ximena, dije que NO está estable. ¡¡No bajes!!', pista: 'aviso' },
      ],
    },
    {
      con: 'nahuel',
      mensajes: [
        { de: 'nahuel', t: '12:00', dia: 'Jueves 1 de Otoño', texto: 'Te tengo listo el discurso de bienvenida en señas y en palabras. ¿Lo hacemos juntos?' },
        { de: 'yo', t: '12:10', texto: 'Juntos. Tú hablas, yo hablo con las manos, y los cristales hablan por los dos.' },
        { de: 'nahuel', t: '19:00', dia: 'Sábado 3 de Otoño', voz: 'c7_nahuel_loma' },
      ],
    },
    {
      con: 'mauro',
      grupo: 'Rastreo del valle',
      mensajes: [
        { de: 'mauro', t: '21:02', dia: 'Viernes 2 de Otoño', texto: 'Los cristales del valle están prendiendo solos, de a uno. Mando fotos en orden.', pista: 'luces' },
        { de: 'mauro', t: '21:02', foto: 'c7_luz1' },
        { de: 'mauro', t: '21:04', foto: 'c7_luz2' },
        { de: 'mauro', t: '21:06', foto: 'c7_luz3' },
        { de: 'mauro', t: '21:08', foto: 'c7_luz4' },
        { de: 'mauro', t: '21:10', foto: 'c7_luz5' },
        { de: 'mauro', t: '21:12', voz: 'c7_mauro_luces' },
      ],
    },
    {
      con: 'calista',
      mensajes: [
        { de: 'calista', t: '18:30', dia: 'Sábado 3 de Otoño', texto: 'La asamblea votó: si Ximena no aparece, el concierto se suspende y todos salimos a buscarla.' },
      ],
    },
  ],
  fotos: [
    { id: 'escenario', archivo: 'c7_escenario', fecha: '1 de Otoño', lugar: 'Loma de Iridalia', pie: 'El escenario y el cristal madre. Debajo está la Gran Geoda.', pista: 'geoda_lugar' },
    { id: 'manos', archivo: 'c7_manos', fecha: '30 de Verano', lugar: 'Taller de Orin', pie: 'Siento la nota en las manos antes de que prenda la luz.' },
    { id: 'luz1', archivo: 'c7_luz1', fecha: '2 de Otoño · 21:02', lugar: 'Valle (foto de Mauro)', pie: 'Primera luz.', sena: '#3ad46a' },
    { id: 'luz2', archivo: 'c7_luz2', fecha: '2 de Otoño · 21:04', lugar: 'Valle (foto de Mauro)', pie: 'Segunda luz.', sena: '#ffb02a' },
    { id: 'luz3', archivo: 'c7_luz3', fecha: '2 de Otoño · 21:06', lugar: 'Valle (foto de Mauro)', pie: 'Tercera luz.', sena: '#3a7aff' },
    { id: 'luz4', archivo: 'c7_luz4', fecha: '2 de Otoño · 21:08', lugar: 'Valle (foto de Mauro)', pie: 'Cuarta luz.', sena: '#ff4a4a' },
    { id: 'luz5', archivo: 'c7_luz5', fecha: '2 de Otoño · 21:10', lugar: 'Valle (foto de Mauro)', pie: 'Quinta luz.', sena: '#b04aff' },
    { id: 'entrada', archivo: 'c7_entrada', fecha: '2 de Otoño · 15:20', lugar: 'Boca de la Gran Geoda', pie: 'Bajando. Huele a lluvia y a vidrio.' },
  ],
  notas: [
    { id: 'concierto', titulo: 'Un concierto que se vea', fecha: '28 de Verano', texto: 'No quiero que me aplaudan por tocar «a pesar de».\nQuiero que vean lo que yo siento: cada nota, una luz.\nEl cristal madre está conectado con todos los del valle.\nSi lo toco desde abajo, desde la geoda, prende el valle entero.', pista: 'conectado' },
    { id: 'lista', titulo: 'Para la geoda', fecha: '2 de Otoño', texto: 'Linterna\nGuantes de afinar\nAgua\nBarra de miel\n(avisar a Maia cuando salga)' },
  ],
  voces: [
    { id: 'c7_orin_aviso', quien: 'orin', nombre: 'Orin', fecha: '2 de Otoño · 15:12', transcrita: 'Ximena, la geoda está estable desde la lluvia. Si bajas, deja cuerda en la entrada.', texto: 'Ximena, la geoda no está estable desde la lluvia. Si bajas, se te puede cerrar la entrada. No bajes sola.', d: '[man, hurried, worried, a bit muffled] Ximena, la geoda NO está estable desde la lluvia. Si bajas, se te puede cerrar la entrada. No bajes sola.', pista: 'transcripcion' },
    { id: 'c7_maia_luces', quien: 'maia', nombre: 'Maia', fecha: '3 de Otoño · 06:32', transcrita: 'Ximena, ¿tú estás prendiendo los cristales? Si eres tú, dime algo.', texto: 'Ximena, ¿tú estás prendiendo los cristales? Si eres tú, dime algo.', d: '[young woman, anxious, hopeful] Ximena, ¿tú estás prendiendo los cristales? Si eres tú... dime algo.' },
    { id: 'c7_nahuel_fin', quien: 'nahuel', nombre: 'Nahuel', fecha: '3 de Otoño', texto: 'Dice: este concierto no se oye, se ve. Y hoy lo vieron todos.', d: '[man interpreting, moved, warm, speaking to a crowd] Dice: «Este concierto no se oye. Se ve. Y hoy lo vieron todos».' },
    { id: 'c7_orin_fin', quien: 'orin', nombre: 'Orin', fecha: '3 de Otoño', texto: 'Desde hoy, los avisos de la geoda se escriben. Nada de notas de voz.', d: '[relieved, ashamed, sincere] Desde hoy, los avisos de la geoda se escriben. Nada de notas de voz.' },
    { id: 'c7_mauro_luces', quien: 'mauro', nombre: 'Mauro', fecha: '2 de Otoño', texto: 'Y después se repite igual. Toda la noche. Como si alguien estuviera hablando.', d: '[amazed, whispering at night] Y después se repite igual. Toda la noche. Como si alguien estuviera hablando.' },
    { id: 'c7_nahuel_loma', quien: 'nahuel', nombre: 'Nahuel', fecha: '3 de Otoño', texto: 'Ximena, falta una hora para el concierto. La loma está llena.', d: '[worried, crowd noise behind] Ximena, falta una hora para el concierto. La loma está llena.' },
  ],
  llamadas: [
    { quien: 'maia', t: '06:35', dia: '3 de Otoño', tipo: 'perdida' },
    { quien: 'orin', t: '15:41', dia: '2 de Otoño', tipo: 'perdida', pista: 'aviso' },
    { quien: 'nahuel', t: '19:01', dia: '3 de Otoño', tipo: 'perdida' },
  ],
  mapa: {
    titulo: 'Valle de Iridalia',
    fondo: '#2e2440',
    trazos: [
      { tipo: 'zona', d: '30,30 70,26 76,60 34,66', color: '#3e2f58' },
      { tipo: 'camino', d: '6,90 26,72 44,50 50,40' },
      { tipo: 'zona', d: '44,44 58,42 60,54 46,56', color: '#5a3a7a' },
      { tipo: 'texto', d: '52,62', texto: 'Gran Geoda (debajo)' },
      { tipo: 'texto', d: '80,20', texto: 'bosque violeta' },
    ],
    lugares: [
      { id: 'escenario', nombre: 'Escenario y cristal madre', x: 50, y: 40, icono: 'cristal', nota: 'Encima de la Gran Geoda', pista: 'geoda_lugar' },
      { id: 'boca', nombre: 'Boca de la geoda', x: 60, y: 50, icono: 'peligro', nota: 'Guardado el 2 de Otoño 15:18' },
      { id: 'taller', nombre: 'Taller de Orin', x: 18, y: 78, icono: 'casa' },
      { id: 'c1', nombre: 'Cristales del valle', x: 80, y: 30, icono: 'cristal' },
    ],
  },
  calendario: [
    { dia: '2 de Otoño', t: '15:00', texto: 'Afinar el cristal madre (desde la geoda)' },
    { dia: '3 de Otoño', t: '20:00', texto: '🎵 Concierto que se vea · loma' },
  ],
  pistas: [
    { id: 'patron', texto: 'El patrón era una N: el nombre de Ximena en señas.' },
    { id: 'geoda_lugar', texto: 'Debajo del escenario de la loma está la Gran Geoda.' },
    { id: 'transcripcion', texto: 'Orin le advirtió por nota de voz que la geoda NO estaba estable, pero la transcripción le quitó el «no». Ximena no podía oírla.', clave: true, giro: true },
    { id: 'aviso', texto: 'Orin trató de corregir por escrito a las 15:40, pero Ximena ya había bajado.' },
    { id: 'conectado', texto: 'El cristal madre está conectado con todos los del valle: tocado desde abajo, los prende.', clave: true },
    { id: 'tabla', texto: 'Maia inventó una tabla de señas de luz: cada color, una letra.' },
    { id: 'valle', texto: 'Con el cristal madre se puede «escribir» en todo el valle.' },
    { id: 'luces', texto: 'Desde las 21:02, los cristales del valle prenden de a uno, de colores, y se repiten.', clave: true },
    { id: 'mensaje', texto: 'Las luces, leídas con la tabla de Maia, dicen G-E-O-D-A.', clave: true },
  ],
  ayudas: [
    { etapa: 'bloqueo', textos: ['El expediente dice cuál es su nombre en señas.', 'Una N: sube por la izquierda, baja en diagonal y sube por la derecha.', 'Dibuja 7 → 4 → 1 → 5 → 9 → 6 → 3.'] },
    { etapa: 'senas', textos: ['Abre las fotos de Mauro en orden: cada una tiene un cristal de un color.', 'Busca cada color en la tabla de la app Señas de luz.', 'Verde, ámbar, azul, rojo, violeta: escribe geoda.'] },
    { etapa: 'resolver', textos: ['Compara la nota de voz de Orin con su transcripción (dale play).', 'Las luces dicen dónde está.', 'Está en la Gran Geoda, debajo del escenario; la entrada se cerró detrás de ella.'] },
  ],
  preguntas: [
    {
      texto: '¿Por qué bajó Ximena a la geoda si Orin le había advertido?',
      opciones: ['No le hizo caso por terca', 'La advertencia llegó en nota de voz y la transcripción le cambió el «no está estable» por «está estable»', 'Maia la mandó', 'No sabía que era peligroso porque nadie le dijo'],
      correcta: 1,
      porque: 'Ximena lee lo que el teléfono transcribe. Un «no» perdido cambió todo.',
    },
    {
      texto: '¿Cómo pidió ayuda?',
      opciones: ['Gritando', 'Con señas de luz: hizo prender los cristales del valle desde el cristal madre', 'Por teléfono', 'No pidió ayuda'],
      correcta: 1,
      porque: 'Con la tabla de Maia, cada color es una letra. Todo el valle fue su pantalla.',
    },
    {
      texto: '¿Dónde está Ximena?',
      opciones: ['En el bosque violeta', 'En el taller de Orin', 'En la Gran Geoda, debajo del escenario, con la entrada cerrada', 'En la Estación sobre Celia'],
      correcta: 2,
      porque: 'G-E-O-D-A, repetido toda la noche.',
    },
  ],
  final: {
    titulo: 'Lo vieron todos',
    paneles: [
      { foto: 'c7_fin_rescate', texto: 'Orin y Mauro abren la boca de la geoda con palancas de cristal. Abajo, Ximena los saluda con la linterna.', voz: 'c7_orin_fin', mov: 'acerca' },
      { foto: 'c7_fin_concierto', texto: 'El concierto empieza una hora tarde. Ximena toca el cristal madre y la loma entera se llena de colores.', mov: 'aleja' },
      { foto: 'c7_fin_senas', texto: 'Al final, Ximena habla con las manos. Nahuel lo dice en voz alta.', voz: 'c7_nahuel_fin', mov: 'der' },
    ],
    cierre: 'Caso cerrado. En Iridalia ningún aviso importante va solo en nota de voz. Y la tabla de Maia ya la saben hasta los niños.',
  },
};
