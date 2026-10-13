// Caso 2 · El faro que no encendió (Puerto de los Lirios, AV 312).
// Don Abundio, el farero viejo (tío de Julián, el farero de hoy), cuidaba el faro la noche de la Fiesta de las Barcas
// para que Julián pudiera remar. El faro no se prendió y él desapareció con su barquita. El giro: la crecida corrió el
// banco de arena y la luz habría llevado la carrera derecho contra él; lo dejó apagado a propósito y salió solo, con un
// farol, a buscar la barca perdida de dos pescadores de Brumaverde. Están en la choza de las eras de sal de Genaro.
import type { Caso } from '../tipos';

export const CASO_FARO: Caso = {
  id: 'faro',
  n: 2,
  titulo: 'El faro que no encendió',
  lugar: 'Puerto de los Lirios',
  mundo: 'Valle de Celia',
  persona: { nombre: 'Don Abundio', edad: '68 años', oficio: 'Farero retirado (hace el turno de la fiesta)', foto: 'c2_abundio' },
  expediente: [
    'Anoche fue la Fiesta de las Barcas en el Puerto de los Lirios. Julián, el farero, remaba en la carrera, así que su tío, don Abundio, le cuidaba el faro como todos los años.',
    'El faro no se prendió. Las barcas llegaron a tientas, todas enteras, gracias a los faroles del muelle. Pero don Abundio no aparece, y tampoco su barquita, La Garza.',
    'Julián encontró este teléfono en la escalera del faro. Dice que su tío «firma todo con una L, de Lirios». Hasta el teléfono.',
  ],
  hallazgo: 'Escalera de caracol del faro, tercer descanso',
  dueno: 'Don Abundio',
  telefono: {
    modelo: 'Ancla Grande (teclas grandes)',
    fondo: 'c2_fondo',
    acento: '#2f8f9a',
    oscuro: false,
    bateria: 31,
    operador: 'Lirios Mar',
    hora: '06:12',
    fecha: 'domingo 8 de Verano',
    carcasa: 'robusto',
    letra: '"Trebuchet MS", sans-serif',
    nombreCorreo: 'Bitácora del faro',
    avisos: [
      { app: 'llamadas', titulo: 'Radio de barca 7', texto: '3 llamadas perdidas', t: '19:42' },
      { app: 'mensajes', titulo: 'Julián', texto: '¡Tío! ¿Qué pasó con la luz?', t: '21:31' },
      { app: 'mensajes', titulo: 'Carmela', texto: 'Le guardé caldo, viejo terco', t: '23:10' },
    ],
  },
  bloqueo: { id: 'bloqueo', tipo: 'patron', clave: '14789', titulo: 'Dibuja el patrón', recordatorio: 'Mi firma', pista: 'patron' },
  candados: [
    { id: 'bitacora', tipo: 'palabra', clave: 'garza', titulo: 'Bitácora del faro', recordatorio: 'El nombre de la que nunca me deja botado', pista: 'garza' },
  ],
  apps: ['mensajes', 'fotos', 'notas', 'grabadora', 'llamadas', 'mapa', 'correo', 'calendario', 'linterna'],
  contactos: [
    { id: 'julian', nombre: 'Julián', rol: 'Mi sobrino, el farero', foto: 'c2_av_julian', color: '#2f6f9a' },
    { id: 'carmela', nombre: 'Carmela', rol: 'Fonda del muelle', foto: 'c2_av_carmela', color: '#c4553f' },
    { id: 'genaro', nombre: 'Genaro', rol: 'Eras de sal', color: '#9a8a5a' },
    { id: 'olga', nombre: 'Olga', rol: 'Lonja', color: '#4f8a5a' },
    { id: 'barca7', nombre: 'Radio de barca 7', rol: 'Desconocido', color: '#6a6a7a' },
  ],
  chats: [
    {
      con: 'julian',
      noLeidos: 4,
      mensajes: [
        { de: 'julian', t: '09:15', dia: 'Sábado 7 de Verano', texto: 'Tío, hoy es la carrera. ¿Me cubre el faro como siempre?' },
        { de: 'yo', t: '09:40', texto: 'Como siempre mijo. Reme derecho y no se me caiga al agua.' },
        { de: 'julian', t: '09:41', texto: 'Jajaja. La luz a las 19:30 en punto, que salimos a las 19:45 😅' },
        { de: 'yo', t: '17:05', voz: 'c2_abundio_agua', pista: 'crecida' },
        { de: 'julian', t: '17:30', texto: 'Tío, la tabla de la crecida dice normal. No se preocupe tanto.' },
        { de: 'julian', t: '21:31', texto: '¡Tío! ¿Qué pasó con la luz?' },
        { de: 'julian', t: '21:33', texto: 'Llegamos con los faroles del muelle. Todos bien. Pero ¿usted dónde está?' },
        { de: 'julian', t: '23:58', texto: 'Su barquita no está en el amarre.', pista: 'barquita' },
        { de: 'julian', t: '05:40', dia: 'Domingo 8 de Verano', texto: 'Tío, por favor.' },
      ],
    },
    {
      con: 'genaro',
      mensajes: [
        { de: 'genaro', t: '15:20', dia: 'Sábado 7 de Verano', texto: 'Abundio, las eras de sal quedaron bajo agua. En dos horas subió un palmo.' },
        { de: 'yo', t: '15:22', texto: '¿La choza se mojó?' },
        { de: 'genaro', t: '15:30', texto: 'No, la choza está en lo alto. Ahí guardo cobijas y leña por si acaso. La llave está debajo de la piedra con la concha.', pista: 'choza' },
        { de: 'genaro', t: '15:31', foto: 'c2_eras' },
      ],
    },
    {
      con: 'carmela',
      noLeidos: 1,
      mensajes: [
        { de: 'carmela', t: '18:00', dia: 'Sábado 7 de Verano', texto: '¿Va a bajar a comer antes de prender? Hay caldo de bagre.' },
        { de: 'yo', t: '18:05', texto: 'Hoy no mija. Hoy el agua está rara.' },
        { de: 'carmela', t: '23:10', voz: 'c2_carmela_caldo' },
      ],
    },
    {
      con: 'olga',
      mensajes: [
        { de: 'olga', t: '12:00', dia: 'Sábado 7 de Verano', texto: 'Don Abundio, ¿sabe si bajan los de Brumaverde para la carrera? Los Quintero me encargaron hielo.', pista: 'quintero' },
        { de: 'yo', t: '12:30', texto: 'Bajan en la barca 7, los dos hermanos. Salieron de arriba a mediodía.' },
      ],
    },
  ],
  fotos: [
    { id: 'faro', archivo: 'c2_faro', fecha: '7 de Verano · 16:10', lugar: 'Faro de los Lirios', pie: 'Mi faro. Cuarenta años prendiéndolo.' },
    { id: 'marca', archivo: 'c2_marca', fecha: '7 de Verano · 17:02', lugar: 'Muelle', pie: 'La marca del agua. La tabla dice «normal», pero la arena dice otra cosa.', pista: 'crecida' },
    { id: 'banco', archivo: 'c2_banco', fecha: '7 de Verano · 18:40', lugar: 'Desde el faro', pie: 'El banco de arena se corrió. Ahora está justo donde cae la luz.', pista: 'banco' },
    { id: 'garza', archivo: 'c2_garza', fecha: '2 de Verano', lugar: 'Amarre', pie: 'La Garza, recién pintada. La que nunca me deja botado.', pista: 'garza' },
    { id: 'eras', archivo: 'c2_eras', fecha: '7 de Verano', lugar: 'Eras de sal', pie: '(Foto de Genaro) Las eras bajo agua. La choza, arriba en la loma.' },
    { id: 'noche', archivo: 'c2_noche', fecha: '7 de Verano · 19:58', lugar: '—', pie: '', oscura: true, pistaLinterna: 'farol' },
  ],
  notas: [
    { id: 'turno', titulo: 'Turno de la fiesta', fecha: '7 de Verano', texto: '19:30 prender la luz grande\n19:45 salen las barcas\n20:30 llegan a la boya\n21:15 regreso al muelle\n\nRevisar aceite y mecha. Llevar ruana.' },
    { id: 'reglas', titulo: 'Lo que me enseñó mi papá', fecha: 'hace años', texto: 'Un faro no es para que lo vean a uno. Es para que nadie se estrelle.\nSi la luz va a hacer daño, se apaga.\nY si alguien se pierde, se le lleva la luz chiquita.' },
  ],
  voces: [
    { id: 'c2_abundio_agua', quien: 'abundio', nombre: 'Don Abundio', fecha: '7 de Verano · 17:05', titulo: 'El agua', grabadora: true, pista: 'crecida', texto: 'Mijo, la tabla dirá lo que quiera, pero el agua subió un palmo y la arena se está corriendo. Esta noche no me gusta.', d: '[old man, gravelly, worried] Mijo, la tabla dirá lo que quiera, pero el agua subió un palmo y la arena se está corriendo. Esta noche no me gusta.' },
    { id: 'c2_barca_auxilio', quien: 'quintero', nombre: 'Radio de barca 7', fecha: '7 de Verano · 19:50', titulo: 'Mensaje de radio', pista: 'auxilio', texto: '¡Faro de los Lirios! Barca siete, los Quintero. Se nos partió el remo y la corriente nos lleva hacia los juncos del delta.', d: '[shouting over wind and water, panicked] ¡Faro de los Lirios! Barca siete, los Quintero. Se nos partió el remo... y la corriente nos lleva hacia los juncos del delta.' },
    { id: 'c2_abundio_decision', quien: 'abundio', nombre: 'Don Abundio', fecha: '7 de Verano · 19:55', titulo: 'No lo prendo', grabadora: true, pista: 'apagado', texto: 'No lo prendo. Si lo prendo, las barcas de la carrera vienen derecho al banco nuevo. Que se guíen por los faroles del muelle.', d: '[determined, low] No lo prendo. Si lo prendo, las barcas de la carrera vienen derecho al banco nuevo. Que se guíen por los faroles del muelle.' },
    { id: 'c2_abundio_salgo', quien: 'abundio', nombre: 'Don Abundio', fecha: '7 de Verano · 20:02', titulo: 'Salgo', grabadora: true, pista: 'salio', texto: 'Me voy en la Garza con el farol chiquito. Los Quintero no pueden pasar la noche en los juncos. Si nos agarra el agua, subimos a la choza de Genaro.', d: '[out of breath, rowing, wind] Me voy en la Garza con el farol chiquito. Los Quintero no pueden pasar la noche en los juncos. Si nos agarra el agua, subimos a la choza de Genaro.' },
    { id: 'c2_julian_fin', quien: 'julian', nombre: 'Julián', fecha: '8 de Verano', texto: '¡Tío! ¡Tío, aquí estamos! Viejo terco, nos tenía con el alma en un hilo.', d: '[shouting from a boat, relieved, laughing and crying] ¡Tío! ¡Tío, aquí estamos! Viejo terco... nos tenía con el alma en un hilo.' },
    { id: 'c2_abundio_fin', quien: 'abundio', nombre: 'Don Abundio', fecha: '8 de Verano', texto: 'Un faro también sirve apagado, mijo. Lo que importa es saber por qué.', d: '[tired, smiling, warm] Un faro también sirve apagado, mijo. Lo que importa es saber por qué.' },
    { id: 'c2_carmela_caldo', quien: 'carmela', nombre: 'Carmela', fecha: '7 de Verano', texto: 'Le guardé caldo, viejo terco', d: '[fond, scolding, worried] Le guardé caldo, viejo terco' },
  ],
  llamadas: [
    { quien: 'barca7', t: '19:42', dia: '7 de Verano', tipo: 'perdida' },
    { quien: 'barca7', t: '19:46', dia: '7 de Verano', tipo: 'perdida' },
    { quien: 'barca7', t: '19:50', dia: '7 de Verano', tipo: 'entrante', dur: '0:14', pista: 'auxilio', voz: 'c2_barca_auxilio' },
    { quien: 'julian', t: '21:30', dia: '7 de Verano', tipo: 'perdida' },
    { quien: 'julian', t: '21:35', dia: '7 de Verano', tipo: 'perdida' },
    { quien: 'genaro', t: '15:28', dia: '7 de Verano', tipo: 'entrante', dur: '1:10' },
  ],
  mapa: {
    titulo: 'Delta de los Lirios',
    fondo: '#cfe3d8',
    trazos: [
      { tipo: 'agua', d: '0,30 30,34 55,46 70,60 100,64 100,100 0,100' },
      { tipo: 'agua', d: '55,46 62,30 70,10 78,0 88,0 80,30 72,56' },
      { tipo: 'zona', d: '78,62 92,58 96,72 82,76', color: '#e8dcb0' },
      { tipo: 'zona', d: '20,70 40,66 46,82 22,86', color: '#9fc59a' },
      { tipo: 'camino', d: '10,20 30,26 50,30 62,22' },
      { tipo: 'ruta', d: '30,34 40,50 52,64 66,74', color: '#e8a03a' },
      { tipo: 'texto', d: '88,70', texto: 'banco nuevo' },
      { tipo: 'texto', d: '32,78', texto: 'juncos' },
    ],
    lugares: [
      { id: 'faro', nombre: 'Faro', x: 30, y: 30, icono: 'faro' },
      { id: 'muelle', nombre: 'Muelle y fonda', x: 14, y: 22, icono: 'casa' },
      { id: 'banco', nombre: 'Banco de arena (se corrió)', x: 86, y: 66, icono: 'peligro', nota: 'Marcado el 7 de Verano 18:41', pista: 'banco' },
      { id: 'juncos', nombre: 'Juncos del delta', x: 32, y: 74, icono: 'flor' },
      { id: 'choza', nombre: 'Choza de las eras de sal', x: 46, y: 88, icono: 'casa', nota: 'De Genaro. En la loma, no se inunda', pista: 'choza' },
    ],
  },
  correo: [
    { id: 'b1', de: 'Bitácora', asunto: '7 de Verano · 18:45', fecha: '18:45', texto: 'Agua: un palmo sobre la marca. Viento del oriente. El banco de arena del delta se corrió hacia la boca del puerto: ahora queda justo en el haz de la luz grande.', candado: 'bitacora', pista: 'banco' },
    { id: 'b2', de: 'Bitácora', asunto: '7 de Verano · 19:52', fecha: '19:52', texto: 'Radio de la barca 7 (Quintero): remo partido, deriva hacia los juncos. NO PRENDO LA LUZ GRANDE: la carrera la seguiría hasta el banco. Aviso a Carmela para que prenda los faroles del muelle.', candado: 'bitacora', pista: 'apagado' },
    { id: 'b3', de: 'Bitácora', asunto: '7 de Verano · 20:01', fecha: '20:01', texto: 'Salgo en La Garza con el farol de mano hacia los juncos. Si sube el agua: choza de Genaro. Llave bajo la piedra de la concha.', candado: 'bitacora', pista: 'salio' },
  ],
  calendario: [
    { dia: '7 de Verano', t: '19:30', texto: 'Fiesta de las Barcas · luz grande' },
    { dia: '8 de Verano', t: '12:00', texto: 'Almuerzo donde Carmela (paga Julián 😄)' },
  ],
  pistas: [
    { id: 'patron', texto: 'El patrón era una L: la firma de don Abundio.' },
    { id: 'crecida', texto: 'El agua subió un palmo esa tarde aunque la tabla dijera «normal».' },
    { id: 'banco', texto: 'La crecida corrió el banco de arena: quedó justo donde cae la luz grande del faro.', clave: true },
    { id: 'quintero', texto: 'Los hermanos Quintero bajaban de Brumaverde en la barca 7.' },
    { id: 'auxilio', texto: 'A las 19:50 la barca 7 pidió ayuda: remo partido, la corriente los llevaba a los juncos del delta.', clave: true },
    { id: 'apagado', texto: 'Don Abundio no prendió el faro A PROPÓSITO: la carrera habría seguido la luz hasta el banco.', clave: true, giro: true },
    { id: 'garza', texto: 'La Garza es su barquita: «la que nunca me deja botado».' },
    { id: 'barquita', texto: 'La Garza no estaba en el amarre esa noche.' },
    { id: 'salio', texto: 'Salió solo en La Garza con un farol de mano a buscar a los Quintero.', clave: true },
    { id: 'farol', texto: 'La última foto, con la linterna: el farolito de mano encima de la proa de La Garza, ya en el agua.' },
    { id: 'choza', texto: 'Si el agua subía, se iban a refugiar en la choza de Genaro, en la loma de las eras de sal.', clave: true },
  ],
  ayudas: [
    { etapa: 'bloqueo', textos: ['El expediente dice cómo firma don Abundio.', 'Una L: baja por la izquierda y luego va a la derecha.', 'Dibuja 1 → 4 → 7 → 8 → 9.'] },
    { etapa: 'bitacora', textos: ['¿Quién es «la que nunca me deja botado»? Búscala en las fotos.', 'Es su barquita.', 'Escribe garza.'] },
    { etapa: 'resolver', textos: ['Mira la foto del banco de arena y la bitácora de las 19:52.', 'La radio de la barca 7 dice dónde estaban; Genaro dice dónde se refugia uno.', 'Están en la choza de las eras de sal, en la loma.'] },
  ],
  preguntas: [
    {
      texto: '¿Por qué no se prendió el faro?',
      opciones: ['Don Abundio se quedó dormido', 'Se acabó el aceite de la luz grande', 'Lo dejó apagado a propósito: la luz habría llevado la carrera contra el banco de arena', 'Julián se llevó la llave'],
      correcta: 2,
      porque: 'Un faro no es para que lo vean a uno: es para que nadie se estrelle. Con el banco corrido, la luz grande era una trampa.',
    },
    {
      texto: '¿A qué salió don Abundio?',
      opciones: ['A remar en la carrera', 'A buscar la barca 7 de los Quintero, que iba a la deriva', 'A pescar bagre para Carmela', 'A buscar a Julián'],
      correcta: 1,
      porque: 'La radio de la barca 7 lo llamó tres veces: remo partido, rumbo a los juncos.',
    },
    {
      texto: '¿Dónde están?',
      opciones: ['En el banco de arena', 'En la choza de las eras de sal de Genaro, en la loma', 'En Brumaverde', 'En el fondo del delta'],
      correcta: 1,
      porque: 'La choza está en lo alto, con cobijas y leña. La llave, bajo la piedra de la concha.',
    },
  ],
  final: {
    titulo: 'La luz chiquita',
    paneles: [
      { foto: 'c2_fin_amanecer', texto: 'Al amanecer, Julián y Olga reman hacia las eras de sal. En la loma sale humo de la choza.', mov: 'der' },
      { foto: 'c2_fin_choza', texto: 'Don Abundio y los dos Quintero, envueltos en cobijas de Genaro, tomándose un tinto.', voz: 'c2_julian_fin', mov: 'acerca' },
      { foto: 'c2_fin_faro', texto: 'Esa noche Julián prende el faro. Su tío lo mira desde el muelle, con caldo de Carmela.', voz: 'c2_abundio_fin', mov: 'aleja' },
    ],
    cierre: 'Caso cerrado. La Fiesta de las Barcas tiene una regla nueva: el farero revisa la arena antes de prender.',
  },
};
