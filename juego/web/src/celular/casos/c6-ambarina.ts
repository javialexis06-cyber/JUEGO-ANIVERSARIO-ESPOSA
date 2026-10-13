// Caso 6 · La ruta del carro de agua (Ambarina, AV 312).
// Simón, ayudante de Ezequiel el aguatero, hace la ruta lejana de las terrazas. Su carro apareció en mitad del desierto
// con los doce barriles llenos. El giro: el agua intacta quiere decir que no le hizo falta, porque encontró agua: un
// aljibe antiguo bajo las ruinas de la terraza 9. Ambarina sobrevivió administrando agua y su pacto prohíbe prometer
// suministros que no existan (docs/narrativa/01-mundo.md): por eso no avisó hasta medirlo. La tormenta de arena le
// tapó el camino de vuelta y el teléfono se le quedó en el carro.
import type { Caso } from '../tipos';

export const CASO_AMBARINA: Caso = {
  id: 'ambarina',
  n: 6,
  titulo: 'La ruta del carro de agua',
  lugar: 'Ambarina',
  mundo: 'Cielo de Astra',
  persona: { nombre: 'Simón', edad: '26 años', oficio: 'Repartidor de agua (ruta de las terrazas)', foto: 'c6_simon' },
  expediente: [
    'En Ambarina el agua se cuenta gota por gota. Por eso asustó tanto: el carro de Simón apareció en la duna del pozo seco con los doce barriles llenos, sin tocar. Ni el burro estaba.',
    'Simón hace la ruta lejana, la de las terrazas. Lleva tres días sin aparecer, y anteayer hubo tormenta de arena.',
    'El teléfono estaba en el pescante. En el carro hay una placa: «CUPO 04-12». Rocío, la maestra, dice que Simón usa ese número para todo.',
  ],
  hallazgo: 'Pescante del carro, en la duna del pozo seco',
  dueno: 'Simón',
  telefono: {
    modelo: 'Duna 5 (sellado contra arena)',
    fondo: 'c6_fondo',
    acento: '#e07a2a',
    oscuro: false,
    bateria: 41,
    operador: 'Ambarina · Ruta 4',
    hora: '13:22',
    fecha: 'viernes 15 de Verano',
    carcasa: 'robusto',
    letra: '"Trebuchet MS", sans-serif',
    avisos: [
      { app: 'mensajes', titulo: 'Ezequiel', texto: 'El carro está en el pozo seco. ¿Y usted?', t: '09:40' },
      { app: 'mensajes', titulo: 'Samira', texto: '⚠ Tormenta de arena a las 14:00', t: '12:10' },
      { app: 'notas', titulo: 'Cuaderno de medidas', texto: 'Protegido', t: '17:30' },
    ],
  },
  bloqueo: { id: 'bloqueo', tipo: 'pin', clave: '0412', titulo: 'Escribe el PIN', recordatorio: 'Mi cupo', pista: 'cupo' },
  candados: [
    { id: 'medidas', tipo: 'palabra', clave: 'aljibe', titulo: 'Cuaderno de medidas', recordatorio: 'Como lo llamaban los viejos', pista: 'medidas' },
  ],
  apps: ['mensajes', 'fotos', 'notas', 'grabadora', 'llamadas', 'mapa', 'calendario', 'linterna'],
  contactos: [
    { id: 'ezequiel', nombre: 'Ezequiel', rol: 'Mi jefe, el aguatero', foto: 'c6_av_ezequiel', color: '#3a7a9a' },
    { id: 'samira', nombre: 'Samira', rol: 'Tormentas', color: '#9a6a3a' },
    { id: 'kenzo', nombre: 'Kenzo', rol: 'Explorador de ruinas', foto: 'c6_av_kenzo', color: '#6a8a4a' },
    { id: 'zora', nombre: 'Zora', rol: 'Coordinadora del agua', color: '#c45a3a' },
    { id: 'rocio', nombre: 'Rocío', rol: 'Escuela', color: '#d98aa0' },
  ],
  chats: [
    {
      con: 'ezequiel',
      noLeidos: 3,
      mensajes: [
        { de: 'ezequiel', t: '05:30', dia: 'Martes 12 de Verano', texto: 'Simón, hoy le toca la ruta 4: las cuatro terrazas. Doce barriles, ni uno más.' },
        { de: 'yo', t: '05:35', texto: 'Listo jefe. Sale con burro y todo 🫏' },
        { de: 'ezequiel', t: '09:40', dia: 'Jueves 14 de Verano', texto: 'El carro está en el pozo seco. ¿Y usted?' },
        { de: 'ezequiel', t: '09:41', texto: 'Los doce barriles llenos, Simón. LLENOS. Usted no se tomó ni una gota en dos días.', pista: 'intacta' },
        { de: 'ezequiel', t: '18:00', voz: 'c6_ezequiel_carro', pista: 'intacta' },
      ],
    },
    {
      con: 'samira',
      mensajes: [
        { de: 'samira', t: '12:10', dia: 'Martes 12 de Verano', texto: '⚠ Tormenta de arena a las 14:00 sobre la ruta 4. Si estás afuera, busca resguardo y no camines.', pista: 'tormenta' },
        { de: 'yo', t: '12:20', texto: 'Recibido. Estoy cerca de las ruinas de la terraza 9, me meto ahí.' },
        { de: 'samira', t: '12:21', texto: 'Las ruinas aguantan. Ojo con los pasadizos.' },
      ],
    },
    {
      con: 'kenzo',
      mensajes: [
        { de: 'kenzo', t: '20:00', dia: 'Domingo 10 de Verano', texto: 'Simón, en la terraza 9 hay una boca tapada con losas. Los viejos decían que debajo hay un aljibe de antes de la sequía. Nunca he podido bajar.', pista: 'aljibe' },
        { de: 'yo', t: '20:05', texto: '¿Un aljibe con agua?' },
        { de: 'kenzo', t: '20:10', texto: 'O con arena. Nadie sabe. No entres solo.' },
      ],
    },
    {
      con: 'zora',
      mensajes: [
        { de: 'zora', t: '08:00', dia: 'Lunes 11 de Verano', texto: 'Recordatorio a todos los repartidores: el pacto prohíbe prometer agua que no esté medida. Nada de «ya viene más». Si no está contada, no existe.', pista: 'pacto' },
      ],
    },
    {
      con: 'rocio',
      mensajes: [
        { de: 'rocio', t: '15:00', dia: 'Lunes 11 de Verano', texto: 'Simón, los niños hicieron las cuentas de tu ruta: 12 barriles × 20 medidas = 240 medidas por viaje. ¡Y les dio igualito que a ti!' },
        { de: 'yo', t: '15:10', texto: 'Diles que si algún día sobra agua, la primera es para la huerta de la escuela 🌱' },
      ],
    },
  ],
  fotos: [
    { id: 'carro', archivo: 'c6_carro', fecha: '12 de Verano · 06:00', lugar: 'Pozo de Ambarina', pie: 'El carro listo: doce barriles, todos sellados. Ruta 4.' },
    { id: 'terraza', archivo: 'c6_terraza', fecha: '12 de Verano · 11:50', lugar: 'Terraza 9', pie: 'Las ruinas de la terraza 9. Kenzo dice que debajo hay algo.' },
    { id: 'tormenta', archivo: 'c6_tormenta', fecha: '12 de Verano · 13:55', lugar: 'Ruta 4', pie: 'Ahí viene. Dejo el carro en la duna y me meto a las ruinas con el burro.', pista: 'tormenta' },
    { id: 'losa', archivo: 'c6_losa', fecha: '12 de Verano · 16:40', lugar: 'Terraza 9, adentro', pie: 'La tormenta movió la arena y destapó la losa. Se oye agua abajo.', pista: 'losa' },
    { id: 'agua', archivo: 'c6_aljibe', fecha: '13 de Verano · 09:10', lugar: '—', pie: '', oscura: true, pistaLinterna: 'agua' },
  ],
  notas: [
    { id: 'ruta', titulo: 'Ruta 4', fecha: '12 de Verano', texto: 'Terraza 2: 3 barriles\nTerraza 5: 3 barriles\nTerraza 7: 4 barriles\nTerraza 9: 2 barriles (la familia Ortega)\n\nTotal: 12. Ni una gota prometida de más.' },
    {
      id: 'medidas', titulo: 'Cuaderno de medidas', fecha: '13-14 de Verano', candado: 'medidas', pista: 'midiendo',
      texto: 'Día 1: bajé con la cuerda del burro. Hay agua. Fría, limpia.\nDía 2: marqué la piedra. En un día no bajó ni un dedo: se llena sola desde abajo.\nDía 3: necesito un día más para estar seguro. Si le digo a Zora sin medir, rompo el pacto.\nTomé de aquí. Los barriles del carro son de las terrazas: no los toco.',
    },
  ],
  voces: [
    { id: 'c6_simon_losa', quien: 'simon', nombre: 'Simón', fecha: '12 de Verano · 16:45', titulo: 'La losa', grabadora: true, pista: 'losa', texto: 'La tormenta destapó una losa en las ruinas. Abajo suena agua. Agua de verdad, no arena.', d: '[young man, coughing from dust, then amazed] La tormenta destapó una losa en las ruinas. Abajo suena agua... Agua de verdad, no arena.' },
    { id: 'c6_simon_medir', quien: 'simon', nombre: 'Simón', fecha: '13 de Verano · 09:20', titulo: 'Medir', grabadora: true, pista: 'midiendo', texto: 'No le puedo decir a nadie hasta medirla. Si prometo agua que no hay, rompo el pacto. Tres días contando y le aviso a Zora.', d: '[serious, honest, echo in a cistern] No le puedo decir a nadie hasta medirla. Si prometo agua que no hay, rompo el pacto. Tres días contando... y le aviso a Zora.' },
    { id: 'c6_ezequiel_carro', quien: 'ezequiel', nombre: 'Ezequiel', fecha: '14 de Verano', texto: 'Mijo, los doce barriles están llenos. Uno no aguanta dos días en ese desierto sin agua. Usted encontró de dónde tomar.', d: '[older man, gruff but worried, thinking aloud] Mijo, los doce barriles están llenos. Uno no aguanta dos días en ese desierto sin agua... Usted encontró de dónde tomar.' },
    { id: 'c6_zora_fin', quien: 'zora', nombre: 'Zora', fecha: '15 de Verano', texto: 'Cuatro días de medidas, piedra marcada y ni una gota de los barriles. Así se anuncia el agua en Ambarina.', d: '[proud, firm community leader] Cuatro días de medidas, piedra marcada y ni una gota de los barriles. Así se anuncia el agua en Ambarina.' },
    { id: 'c6_simon_fin', quien: 'simon', nombre: 'Simón', fecha: '15 de Verano', texto: 'No quería prometer nada que no fuera cierto. Ahora sí: la primera es para la huerta de la escuela.', d: '[sunburnt, tired, big smile] No quería prometer nada que no fuera cierto. Ahora sí: la primera es para la huerta de la escuela.' },
  ],
  llamadas: [
    { quien: 'ezequiel', t: '09:42', dia: '14 de Verano', tipo: 'perdida' },
    { quien: 'ezequiel', t: '18:01', dia: '14 de Verano', tipo: 'perdida' },
    { quien: 'zora', t: '10:00', dia: '15 de Verano', tipo: 'perdida' },
    { quien: 'samira', t: '12:11', dia: '12 de Verano', tipo: 'entrante', dur: '0:30' },
  ],
  mapa: {
    titulo: 'Ruta 4 · Ambarina',
    fondo: '#f0d9a8',
    trazos: [
      { tipo: 'zona', d: '0,0 100,0 100,100 0,100', color: '#ecd09a' },
      { tipo: 'camino', d: '8,88 24,70 40,60 58,44 72,30 86,14' },
      { tipo: 'zona', d: '60,50 74,46 78,58 64,62', color: '#d9b67a' },
      { tipo: 'texto', d: '66,68', texto: 'duna del pozo seco' },
      { tipo: 'ruta', d: '68,54 80,40 86,26', color: '#e07a2a' },
    ],
    lugares: [
      { id: 'pozo', nombre: 'Pozo de Ambarina', x: 8, y: 88, icono: 'agua' },
      { id: 't2', nombre: 'Terraza 2', x: 24, y: 70, icono: 'casa' },
      { id: 't5', nombre: 'Terraza 5', x: 40, y: 60, icono: 'casa' },
      { id: 'carro', nombre: 'Aquí quedó el carro', x: 68, y: 54, icono: 'peligro', nota: 'Duna del pozo seco' },
      { id: 't7', nombre: 'Terraza 7', x: 58, y: 40, icono: 'casa' },
      { id: 't9', nombre: 'Ruinas de la terraza 9', x: 86, y: 14, icono: 'estrella', nota: 'Guardado el 12 de Verano 16:50: «¡agua!»', pista: 'ruinas' },
    ],
  },
  calendario: [
    { dia: '12 de Verano', t: '05:30', texto: 'Ruta 4 (las cuatro terrazas)' },
    { dia: '16 de Verano', t: '10:00', texto: 'Reunión del agua con Zora' },
  ],
  pistas: [
    { id: 'cupo', texto: 'El teléfono se abrió con 0412: el cupo de agua de Simón.' },
    { id: 'intacta', texto: 'El carro tenía los doce barriles llenos: Simón no tomó ni una gota en dos días.', clave: true },
    { id: 'tormenta', texto: 'El 12 de Verano hubo tormenta de arena: dejó el carro en la duna y se metió a las ruinas de la terraza 9.', clave: true },
    { id: 'aljibe', texto: 'Kenzo le contó que debajo de la terraza 9 hay un aljibe antiguo tapado con losas.' },
    { id: 'losa', texto: 'La tormenta destapó la losa del aljibe: abajo sonaba agua.', clave: true },
    { id: 'agua', texto: 'Con la linterna se ve la última foto: agua limpia en el fondo del aljibe, con una piedra marcada.', clave: true, giro: true },
    { id: 'medidas', texto: 'El cuaderno de medidas se abrió con «aljibe».' },
    { id: 'pacto', texto: 'El pacto de Ambarina prohíbe prometer agua que no esté medida.', clave: true },
    { id: 'midiendo', texto: 'Simón lleva días midiendo el aljibe antes de avisar, para no romper el pacto.', clave: true },
    { id: 'ruinas', texto: 'El último lugar que guardó en el mapa: las ruinas de la terraza 9, con un «¡agua!».' },
  ],
  ayudas: [
    { etapa: 'bloqueo', textos: ['El expediente habla de una placa en el carro.', '«CUPO 04-12».', 'El PIN es 0412.'] },
    { etapa: 'medidas', textos: ['El recordatorio dice «como lo llamaban los viejos». ¿Quién habla de los viejos?', 'Kenzo le cuenta qué hay debajo de la terraza 9.', 'Escribe aljibe.'] },
    { etapa: 'resolver', textos: ['¿Qué quiere decir que el agua del carro siguiera intacta?', 'Mira lo que dice Zora del pacto y lo que escribió Simón en su cuaderno.', 'Está en el aljibe de la terraza 9, midiéndolo antes de anunciarlo.'] },
  ],
  preguntas: [
    {
      texto: '¿Por qué el agua del carro seguía intacta?',
      opciones: ['Simón se murió de sed', 'Encontró otra agua y no tocó la de las terrazas', 'El burro se tomó la suya', 'Los barriles estaban vacíos'],
      correcta: 1,
      porque: 'Nadie aguanta dos días en ese desierto sin tomar: si los barriles seguían llenos, Simón tenía de dónde beber.',
    },
    {
      texto: '¿Dónde está Simón?',
      opciones: ['En la duna del pozo seco', 'En la terraza 2', 'En las ruinas de la terraza 9, junto a un aljibe antiguo', 'Volvió al pozo de Ambarina'],
      correcta: 2,
      porque: 'La tormenta destapó la losa del aljibe; él se quedó ahí con el burro.',
    },
    {
      texto: '¿Por qué no avisó?',
      opciones: ['Quería quedarse con el agua', 'El pacto prohíbe prometer agua que no esté medida: la estaba midiendo', 'Le daba miedo Ezequiel', 'Se le acabó la batería'],
      correcta: 1,
      porque: 'En Ambarina, si el agua no está contada, no existe. Simón marcó la piedra y contó tres días.',
    },
  ],
  final: {
    titulo: 'Agua contada',
    paneles: [
      { foto: 'c6_fin_llegan', texto: 'Zora, Kenzo y Ezequiel llegan a la terraza 9 al mediodía. El burro los saluda primero.', mov: 'der' },
      { foto: 'c6_fin_aljibe', texto: 'Simón les muestra la piedra marcada y el cuaderno. Zora lee las medidas dos veces.', voz: 'c6_zora_fin', mov: 'acerca' },
      { foto: 'c6_fin_huerta', texto: 'Una semana después, la primera agua del aljibe llega a la huerta de la escuela de Rocío.', voz: 'c6_simon_fin', mov: 'aleja' },
    ],
    cierre: 'Caso cerrado. Ambarina tiene un aljibe nuevo en sus cuentas, medido y anunciado como manda el pacto.',
  },
};
