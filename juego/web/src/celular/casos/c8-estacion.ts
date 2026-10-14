// Caso 8 · El último turno (Estación sobre Celia, AV 312).
// Joaquín, técnico de casco, salió a cambiar un panel del sector 7 en su último turno antes de bajar a Celia. La
// bitácora dice que volvió por la esclusa B a las 03:12; la cámara de la esclusa B no muestra a nadie. El giro: Joaquín
// llenaba la bitácora ANTES de salir (todas las noches dice 03:12, igualito). La esclusa del sector 7 se trabó y él
// caminó por el casco hasta la entrada más cercana: la cúpula del invernadero de Valentina, sellada dos días por
// fumigación y con las cámaras apagadas. Está adentro, con aire de sobra (las plantas) y la radio dañada.
import type { Caso } from '../tipos';

export const CASO_ESTACION: Caso = {
  id: 'estacion',
  n: 8,
  titulo: 'El último turno',
  lugar: 'Estación sobre Celia',
  mundo: 'Cielo de Astra',
  persona: { nombre: 'Joaquín', edad: '41 años', oficio: 'Técnico de casco', foto: 'c8_joaquin' },
  expediente: [
    'La comandante Helena me escribió desde la Estación sobre Celia. Joaquín, técnico de casco, salió anoche a cambiar un panel del sector 7. Era su último turno: hoy bajaba a Celia de vacaciones.',
    'La bitácora dice que volvió por la esclusa B a las 03:12. Pero la cámara de la esclusa B no muestra a nadie. Su cama está tendida y su traje no está en el gancho.',
    'Su teléfono lo encontró Boris en el casillero. Debajo, una etiqueta: «traje 16, sector 07». Boris dice que Joaquín pone de clave lo que tenga a mano.',
  ],
  hallazgo: 'Casillero de los técnicos de casco',
  dueno: 'Joaquín',
  telefono: {
    modelo: 'Casco T-9 (pantalla con guantes)',
    fondo: 'c8_fondo',
    acento: '#3ac0d9',
    oscuro: true,
    bateria: 88,
    operador: 'Red de la Estación',
    hora: '07:40',
    fecha: 'lunes 4 de Primavera',
    carcasa: 'traje',
    letra: '"Lucida Console", "Courier New", monospace',
    nombreCorreo: 'Bitácora de turnos',
    avisos: [
      { app: 'mensajes', titulo: 'Helena', texto: 'Joaquín, preséntese en el puente', t: '06:00' },
      { app: 'mensajes', titulo: 'Mamá', texto: '¿A qué hora llegas, mijo? Hice ajiaco', t: '07:30' },
      { app: 'correo', titulo: 'Bitácora', texto: 'Turno 4 de Primavera: regreso 03:12', t: '00:05' },
    ],
  },
  bloqueo: { id: 'bloqueo', tipo: 'pin', clave: '1607', titulo: 'Escribe el PIN', recordatorio: 'Lo que tengo a mano', pista: 'pin' },
  candados: [
    { id: 'camaras', tipo: 'pin', clave: '308', titulo: 'Cámaras de la estación', recordatorio: 'Código de acceso: el año en que se fundó la estación', pista: 'camaras' },
  ],
  apps: ['mensajes', 'fotos', 'notas', 'grabadora', 'llamadas', 'mapa', 'correo', 'calendario', 'linterna'],
  contactos: [
    { id: 'helena', nombre: 'Helena', rol: 'Comandante', foto: 'c8_av_helena', color: '#3a5a9a' },
    { id: 'boris', nombre: 'Boris', rol: 'Jefe de ingenieros', foto: 'c8_av_boris', color: '#7a6a4a' },
    { id: 'valentina', nombre: 'Valentina', rol: 'Agrónoma', color: '#4a9a5a' },
    { id: 'said', nombre: 'Said', rol: 'Médico', color: '#c45a5a' },
    { id: 'rita', nombre: 'Rita', rol: 'Logística', color: '#c48a3a' },
    { id: 'mama', nombre: 'Mamá', rol: 'Pueblo del Sol', color: '#a05a8a' },
  ],
  chats: [
    {
      con: 'boris',
      mensajes: [
        { de: 'boris', t: '22:00', dia: 'Domingo 3 de Primavera', texto: 'Último turno, Joaco. Panel 4 del sector 7 y te vas a tu ajiaco. La esclusa del 7 anda trabándose, si se pega sales por la B.' },
        { de: 'yo', t: '22:05', texto: 'Listo. Ya dejé la bitácora llena para no olvidarme 😅' },
        { de: 'boris', t: '22:06', texto: 'Hombre, eso no se hace. La bitácora se llena al volver.', pista: 'antes' },
        { de: 'boris', t: '06:15', dia: 'Lunes 4 de Primavera', voz: 'c8_boris_camara' },
      ],
    },
    {
      con: 'valentina',
      grupo: 'Toda la estación',
      mensajes: [
        { de: 'valentina', t: '18:00', dia: 'Domingo 3 de Primavera', texto: 'Aviso: la cúpula del invernadero queda SELLADA por fumigación hasta el martes. Las cámaras de adentro se apagan para que no se empañen. No entren 🌿', pista: 'cupula' },
        { de: 'rita', t: '18:05', texto: 'Recibido. Mañana subo los costales de sustrato.' },
        { de: 'rita', t: '18:20', texto: 'Por cierto: esta semana la estación cumple cuatro años. ¡Fundada en AV 308! 🎉 Torta en el comedor de Marisol.', pista: 'fundada' },
        { de: 'said', t: '19:00', texto: 'Ojo: el que salga al casco con más de 14 horas despierto, a mi consultorio primero.' },
      ],
    },
    {
      con: 'said',
      mensajes: [
        { de: 'said', t: '20:30', dia: 'Domingo 3 de Primavera', texto: 'Joaquín, llevas 16 horas despierto. Ese último turno lo hace otro.', pista: 'cansado' },
        { de: 'said', t: '20:31', voz: 'c8_said_aviso' },
        { de: 'yo', t: '20:35', texto: 'Tranquilo doc, es el último. Cuarenta minutos y me acuesto.' },
      ],
    },
    {
      con: 'helena',
      noLeidos: 2,
      mensajes: [
        { de: 'helena', t: '06:00', dia: 'Lunes 4 de Primavera', texto: 'Joaquín, preséntese en el puente.' },
        { de: 'helena', t: '06:40', texto: 'Su traje no está en el gancho. Si esto es una broma, no tiene gracia.' },
      ],
    },
    {
      con: 'mama',
      noLeidos: 1,
      mensajes: [
        { de: 'mama', t: '19:00', dia: 'Domingo 3 de Primavera', texto: 'Mijo, mañana lo espero en el Pueblo del Sol. ¿Quiere ajiaco o sancocho?' },
        { de: 'yo', t: '19:05', texto: 'AJIACO. Con alcaparras. Mañana a mediodía estoy allá 😋' },
        { de: 'mama', t: '07:30', dia: 'Lunes 4 de Primavera', texto: '¿A qué hora llegas, mijo? Hice ajiaco' },
      ],
    },
  ],
  fotos: [
    { id: 'estacion', archivo: 'c8_estacion', fecha: '1 de Primavera', lugar: 'Estación sobre Celia', pie: 'La estación con Celia al fondo. Cuatro años aquí arriba.' },
    { id: 'panel', archivo: 'c8_panel', fecha: '4 de Primavera · 02:20', lugar: 'Casco, sector 7', pie: 'Panel 4 cambiado. La esclusa del 7 se pegó otra vez.', pista: 'trabada' },
    { id: 'cupula', archivo: 'c8_cupula', fecha: '4 de Primavera · 02:44', lugar: 'Casco', pie: 'La entrada más cerca es la cúpula de Valentina…', pista: 'camino' },
    { id: 'cam_b', archivo: 'c8_cam_b', fecha: 'Cámara esclusa B · 03:12', lugar: 'Cámaras', pie: 'ESCLUSA B · 04/PRI · 03:12:00 · sin movimiento', candado: 'camaras', pista: 'nadie' },
    { id: 'cam_7', archivo: 'c8_cam_7', fecha: 'Cámara casco 7 · 02:48', lugar: 'Cámaras', pie: 'CASCO SECTOR 7 · 04/PRI · 02:48:31 · traje 16 caminando hacia la cúpula', candado: 'camaras', pista: 'visto' },
    { id: 'cam_cupula', archivo: 'c8_cam_cupula', fecha: 'Cámara cúpula · 02:55', lugar: 'Cámaras', pie: 'CÚPULA INVERNADERO · APAGADA (fumigación)', candado: 'camaras', pista: 'apagada' },
    { id: 'dentro', archivo: 'c8_dentro', fecha: '4 de Primavera · 03:05', lugar: '—', pie: '', oscura: true, pistaLinterna: 'dentro' },
  ],
  notas: [
    { id: 'pendientes', titulo: 'Antes de bajar', fecha: '3 de Primavera', texto: '- Panel 4, sector 7\n- Devolver la llave 13 a Boris\n- Comprarle a mamá semillas de albahaca orbital (Marisol)\n- Dormir 😴' },
  ],
  voces: [
    { id: 'c8_joaquin_esclusa', quien: 'joaquin', nombre: 'Joaquín', fecha: '4 de Primavera · 02:42', titulo: 'Casco', grabadora: true, pista: 'trabada', texto: 'Se pegó la esclusa del siete. La radio del traje no agarra. Me voy por el casco hasta la cúpula, que es lo más cerca.', d: '[man in a space helmet, breathing, slightly annoyed, tired] Se pegó la esclusa del siete. La radio del traje no agarra. Me voy por el casco hasta la cúpula, que es lo más cerca.' },
    { id: 'c8_joaquin_dentro', quien: 'joaquin', nombre: 'Joaquín', fecha: '4 de Primavera · 03:06', titulo: 'Adentro', grabadora: true, pista: 'dentro', texto: 'Entré a la cúpula. Está sellada por fuera y aquí no hay señal. Bueno, aire sobra con tanta mata. Me quedo quieto hasta que abran.', d: '[relieved, helmet off, chuckling tiredly] Entré a la cúpula. Está sellada por fuera y aquí no hay señal. Bueno... aire sobra con tanta mata. Me quedo quieto hasta que abran.' },
    { id: 'c8_said_aviso', quien: 'said', nombre: 'Said', fecha: '3 de Primavera · 20:31', texto: 'Joaquín, con dieciséis horas despierto uno se equivoca en cosas bobas. Déjale ese turno a otro.', d: '[calm doctor, caring but firm] Joaquín, con dieciséis horas despierto uno se equivoca en cosas bobas. Déjale ese turno a otro.' },
    { id: 'c8_helena_fin', quien: 'helena', nombre: 'Helena', fecha: '4 de Primavera', texto: 'Abran la cúpula. Con o sin fumigación. Ya.', d: '[commander, firm, urgent] Abran la cúpula. Con o sin fumigación. Ya.' },
    { id: 'c8_joaquin_fin', quien: 'joaquin', nombre: 'Joaquín', fecha: '4 de Primavera', texto: 'Me salvaron las matas de Valentina. Y por favor, alguien avísele a mi mamá que el ajiaco me lo como mañana.', d: '[laughing, exhausted, sitting among plants] Me salvaron las matas de Valentina. Y por favor, alguien avísele a mi mamá que el ajiaco me lo como mañana.' },
    { id: 'c8_boris_camara', quien: 'boris', nombre: 'Boris', fecha: '4 de Primavera', texto: 'La cámara de la B no te vio entrar. ¿Por dónde volviste?', d: '[puzzled, concerned] La cámara de la B no te vio entrar. ¿Por dónde volviste?' },
  ],
  llamadas: [
    { quien: 'helena', t: '06:01', dia: '4 de Primavera', tipo: 'perdida' },
    { quien: 'boris', t: '06:16', dia: '4 de Primavera', tipo: 'perdida' },
    { quien: 'mama', t: '07:31', dia: '4 de Primavera', tipo: 'perdida' },
    { quien: 'said', t: '20:31', dia: '3 de Primavera', tipo: 'entrante', dur: '0:25' },
  ],
  mapa: {
    titulo: 'Plano de la estación',
    fondo: '#16202e',
    trazos: [
      { tipo: 'zona', d: '20,30 80,30 80,70 20,70', color: '#22324a' },
      { tipo: 'zona', d: '70,8 92,8 92,30 70,30', color: '#1f4a3a' },
      { tipo: 'camino', d: '50,30 50,70' },
      { tipo: 'camino', d: '20,50 80,50' },
      { tipo: 'ruta', d: '90,62 94,46 88,30', color: '#3ac0d9' },
      { tipo: 'texto', d: '81,4', texto: 'CÚPULA' },
      { tipo: 'texto', d: '50,90', texto: 'Celia (abajo)' },
    ],
    lugares: [
      { id: 'b', nombre: 'Esclusa B', x: 20, y: 50, icono: 'nave' },
      { id: 's7', nombre: 'Esclusa del sector 7 (se traba)', x: 84, y: 66, icono: 'peligro', pista: 'trabada' },
      { id: 'cupula', nombre: 'Cúpula del invernadero', x: 82, y: 18, icono: 'flor', nota: 'Sellada por fumigación hasta el martes', pista: 'cupula' },
      { id: 'puente', nombre: 'Puente de mando', x: 50, y: 40, icono: 'estrella' },
      { id: 'comedor', nombre: 'Comedor de Marisol', x: 34, y: 62, icono: 'casa' },
    ],
  },
  correo: [
    { id: 't1', de: 'Bitácora', asunto: '1 de Primavera · casco', fecha: '1 Pri.', texto: 'Técnico: Joaquín · Traje 16\nSalida: 02:00 · Regreso: 03:12 (esclusa B)\nTrabajo: revisión de juntas.', pista: 'igual' },
    { id: 't2', de: 'Bitácora', asunto: '2 de Primavera · casco', fecha: '2 Pri.', texto: 'Técnico: Joaquín · Traje 16\nSalida: 02:00 · Regreso: 03:12 (esclusa B)\nTrabajo: limpieza de sensores.', pista: 'igual' },
    { id: 't3', de: 'Bitácora', asunto: '3 de Primavera · casco', fecha: '3 Pri.', texto: 'Técnico: Joaquín · Traje 16\nSalida: 02:00 · Regreso: 03:12 (esclusa B)\nTrabajo: antena.', pista: 'igual' },
    { id: 't4', de: 'Bitácora', asunto: '4 de Primavera · casco (último turno)', fecha: '4 Pri.', texto: 'Técnico: Joaquín · Traje 16\nSalida: 02:00 · Regreso: 03:12 (esclusa B)\nTrabajo: panel 4, sector 7.\n\n(Escrito el 3 de Primavera a las 22:04)', pista: 'antes' },
  ],
  calendario: [
    { dia: '3 de Primavera', t: '19:00', texto: 'Cuatro años de la estación: torta donde Marisol' },
    { dia: '4 de Primavera', t: '02:00', texto: 'Último turno · panel 4 sector 7' },
    { dia: '4 de Primavera', t: '09:00', texto: '🚀 Bajo a Celia (vacaciones)' },
    { dia: '6 de Primavera', texto: 'Cúpula: termina la fumigación', pista: 'cupula' },
  ],
  pistas: [
    { id: 'pin', texto: 'El teléfono se abrió con 1607: traje 16, sector 07.' },
    { id: 'igual', texto: 'En la bitácora, TODAS las noches dicen lo mismo: regreso 03:12 por la esclusa B.' },
    { id: 'antes', texto: 'Joaquín llenaba la bitácora ANTES de salir: la del último turno la escribió a las 22:04 del día anterior.', clave: true, giro: true },
    { id: 'cansado', texto: 'Llevaba 16 horas despierto. Said le pidió que no hiciera el turno.' },
    { id: 'trabada', texto: 'La esclusa del sector 7 se trabó y la radio del traje no funcionaba.', clave: true },
    { id: 'camino', texto: 'Desde el casco, la entrada más cerca era la cúpula del invernadero.' },
    { id: 'cupula', texto: 'La cúpula del invernadero estaba sellada por fumigación y con las cámaras apagadas.', clave: true },
    { id: 'fundada', texto: 'La estación se fundó en AV 308.' },
    { id: 'camaras', texto: 'Las cámaras se abrieron con el código 308.' },
    { id: 'nadie', texto: 'La cámara de la esclusa B no muestra a nadie a las 03:12: nunca volvió por ahí.' },
    { id: 'visto', texto: 'La cámara del casco 7 muestra el traje 16 caminando hacia la cúpula a las 02:48.', clave: true },
    { id: 'apagada', texto: 'La cámara de la cúpula estaba apagada por la fumigación.' },
    { id: 'dentro', texto: 'Joaquín entró a la cúpula: sellada por fuera, sin señal, pero con aire de sobra por las plantas.', clave: true },
  ],
  ayudas: [
    { etapa: 'bloqueo', textos: ['El expediente habla de una etiqueta debajo del teléfono.', '«Traje 16, sector 07».', 'El PIN es 1607.'] },
    { etapa: 'camaras', textos: ['¿Cuándo se fundó la estación? Alguien lo dijo en el grupo de toda la estación.', 'Rita habla de la torta de los cuatro años.', 'El código es 308.'] },
    { etapa: 'resolver', textos: ['Lee las cuatro entradas de la bitácora seguidas. ¿Qué tienen de raro?', 'La cámara del casco 7 y el aviso de Valentina dicen a dónde fue.', 'La bitácora estaba escrita de antemano; Joaquín está dentro de la cúpula sellada.'] },
  ],
  preguntas: [
    {
      texto: '¿Por qué no coinciden la bitácora y las cámaras?',
      opciones: ['Alguien borró las cámaras', 'Joaquín llenaba la bitácora antes de salir: el 03:12 lo escribió la noche anterior', 'Las cámaras tienen otra hora', 'Joaquín mintió para irse de vacaciones antes'],
      correcta: 1,
      porque: 'Todas las entradas dicen 03:12 por la B, y la última se escribió a las 22:04 del día anterior.',
    },
    {
      texto: '¿Dónde está Joaquín?',
      opciones: ['Ya bajó a Celia', 'Afuera, en el casco', 'Dentro de la cúpula del invernadero, sellada por fumigación', 'En el comedor de Marisol'],
      correcta: 2,
      porque: 'La esclusa del 7 se trabó; caminó por el casco hasta la cúpula. Adentro no hay señal ni cámaras.',
    },
  ],
  final: {
    titulo: 'Un turno de más',
    paneles: [
      { foto: 'c8_fin_puerta', texto: 'Helena no espera al martes. Boris rompe el sello de la cúpula.', voz: 'c8_helena_fin', mov: 'acerca' },
      { foto: 'c8_fin_matas', texto: 'Adentro, entre tomates y albahacas, Joaquín duerme sentado, con el casco en las piernas.', mov: 'der' },
      { foto: 'c8_fin_celia', texto: 'Al otro día baja a Celia. Lleva un costal de semillas de albahaca orbital para su mamá.', voz: 'c8_joaquin_fin', mov: 'aleja' },
    ],
    cierre: 'Caso cerrado. En la estación hay regla nueva: la bitácora se llena al volver. Y Said firma los turnos.',
  },
};
