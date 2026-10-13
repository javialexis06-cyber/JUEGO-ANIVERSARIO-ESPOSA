// Caso 3 · La cota tres (Piedralumbre, AV 312).
// Rosalba, minera de la brigada de Eloy, entró sola a la galería cerrada de la cota tres siguiendo unos golpes. Su papá
// murió en el accidente de AV 281 (docs/narrativa/01-mundo.md) y ella creyó que alguien seguía atrapado. El giro: los
// golpes eran de una madre dragón de Celia avisando de un derrumbe (y de su cría rompiendo el huevo). Rosalba se torció
// el tobillo; los dragones la tienen guardada en su nido, tibia, hasta que alguien pueda sacarla.
import type { Caso } from '../tipos';

export const CASO_COTA: Caso = {
  id: 'cota',
  n: 3,
  titulo: 'La cota tres',
  lugar: 'Piedralumbre',
  mundo: 'Valle de Celia',
  persona: { nombre: 'Rosalba', edad: '34 años', oficio: 'Minera de la brigada de Eloy', foto: 'c3_rosalba' },
  expediente: [
    'Eloy, el capataz de Piedralumbre, me mandó esto preocupado. Rosalba no volvió del turno de la tarde. Hugo, el farolero, dice que su lámpara no regresó al gancho.',
    'El teléfono estaba en la reja de la cota tres, la galería que está cerrada desde el accidente de AV 281. La reja tenía el candado abierto.',
    'En su casillero había un casco viejo con un nombre pintado: «Brigada Candela». Era el casco de su papá.',
  ],
  hallazgo: 'Colgado de la reja de la cota tres',
  dueno: 'Rosalba',
  telefono: {
    modelo: 'Roca X2 (antigolpes)',
    fondo: 'c3_fondo',
    acento: '#e0a12a',
    oscuro: true,
    bateria: 17,
    operador: 'Piedralumbre · 1 raya',
    hora: '02:47',
    fecha: 'jueves 19 de Otoño',
    carcasa: 'robusto',
    letra: '"Arial Black", "Arial", sans-serif',
    avisos: [
      { app: 'mensajes', titulo: 'Eloy', texto: 'Rosalba, contésteme YA', t: '22:10' },
      { app: 'mensajes', titulo: 'Úrsula', texto: 'Las vetas de la cota tres están a 40 grados', t: '14:02' },
      { app: 'grabadora', titulo: 'Grabadora', texto: 'Golpes (4)', t: '18:20' },
    ],
  },
  bloqueo: { id: 'bloqueo', tipo: 'palabra', clave: 'candela', titulo: 'Contraseña', recordatorio: 'La brigada de mi papá', pista: 'candela' },
  candados: [
    { id: 'album', tipo: 'pin', clave: '3141', titulo: 'Álbum «Cota 3»', recordatorio: 'Los golpes, noche por noche', pista: 'album' },
  ],
  apps: ['mensajes', 'fotos', 'notas', 'grabadora', 'llamadas', 'mapa', 'calendario', 'linterna'],
  contactos: [
    { id: 'eloy', nombre: 'Eloy', rol: 'Capataz', foto: 'c3_av_eloy', color: '#7a5a3a' },
    { id: 'ursula', nombre: 'Úrsula', rol: 'Geóloga', foto: 'c3_av_ursula', color: '#5a7a9a' },
    { id: 'amparo', nombre: 'Amparo', rol: 'Enfermera de mina', color: '#c45a6a' },
    { id: 'hugo', nombre: 'Hugo', rol: 'Farolero', color: '#d9a02a' },
    { id: 'petra', nombre: 'Petra', rol: 'Mi parcera', foto: 'c3_av_petra', color: '#8a5aa0' },
  ],
  chats: [
    {
      con: 'petra',
      mensajes: [
        { de: 'yo', t: '21:30', dia: 'Lunes 16 de Otoño', texto: 'Petra, ¿tú oyes golpes cuando pasas por la reja de la cota tres?' },
        { de: 'petra', t: '21:35', texto: 'Yo no oigo sino mi estómago 😂 ¿Golpes de qué?' },
        { de: 'yo', t: '21:36', texto: 'Tres golpes. Como cuando la brigada de mi papá avisaba que estaba bien. Golpe, golpe, golpe.', pista: 'golpes' },
        { de: 'petra', t: '21:40', texto: 'Rosa… esa galería lleva treinta y un años cerrada. Allá no hay nadie.' },
        { de: 'yo', t: '21:41', texto: 'Ya sé. Pero los oigo.' },
        { de: 'petra', t: '19:00', dia: 'Miércoles 18 de Otoño', texto: 'No vayas a hacer una locura, ¿oíste?' },
      ],
    },
    {
      con: 'ursula',
      noLeidos: 1,
      mensajes: [
        { de: 'yo', t: '11:00', dia: 'Martes 17 de Otoño', texto: 'Úrsula, ¿las vetas de la cota tres se pueden calentar solas?' },
        { de: 'ursula', t: '11:20', voz: 'c3_ursula_calor', pista: 'calor' },
        { de: 'ursula', t: '14:02', dia: 'Miércoles 18 de Otoño', texto: 'Las vetas de la cota tres están a 40 grados. Eso no lo hace la piedra sola. Algo vive ahí, Rosalba. Algo grande.' },
      ],
    },
    {
      con: 'eloy',
      noLeidos: 3,
      mensajes: [
        { de: 'yo', t: '08:00', dia: 'Miércoles 18 de Otoño', texto: 'Eloy, pido permiso para revisar la cota tres. Oigo golpes.' },
        { de: 'eloy', t: '08:15', texto: 'La cota tres está cerrada, Rosalba. No es negociable. El techo de la segunda curva está suelto.', pista: 'derrumbe' },
        { de: 'eloy', t: '08:16', texto: 'Y lo de su papá… ya lo hablamos. Allá no quedó nadie. Lo siento mucho.' },
        { de: 'eloy', t: '22:10', dia: 'Jueves 19 de Otoño', texto: 'Rosalba, contésteme YA' },
        { de: 'eloy', t: '22:40', texto: 'Hugo dice que su lámpara no volvió.' },
        { de: 'eloy', t: '23:55', texto: 'Mañana entramos con Amparo. Aguante.' },
      ],
    },
    {
      con: 'amparo',
      mensajes: [
        { de: 'amparo', t: '17:00', dia: 'Martes 17 de Otoño', texto: '¿Te sigue doliendo el tobillo de la semana pasada? Nada de saltar vagonetas.' },
        { de: 'yo', t: '17:05', texto: 'Ya casi no. Lo vendo y listo.' },
      ],
    },
    {
      con: 'hugo',
      mensajes: [
        { de: 'hugo', t: '20:30', dia: 'Jueves 19 de Otoño', texto: 'Rosalba, la lámpara 46 no ha vuelto al gancho. ¿La tienes tú?' },
      ],
    },
  ],
  fotos: [
    { id: 'reja', archivo: 'c3_reja', fecha: '16 de Otoño', lugar: 'Cota tres', pie: 'La reja. Desde aquí se oyen los golpes, siempre después de las seis.' },
    { id: 'casco', archivo: 'c3_casco', fecha: '15 de Otoño', lugar: 'Casillero', pie: 'El casco de mi papá. Brigada Candela, AV 281.', pista: 'candela' },
    { id: 'brigada', archivo: 'c3_brigada', fecha: '19 de Otoño', lugar: 'Bocamina', pie: 'La brigada de Eloy antes del turno. Yo soy la del pañuelo.' },
    { id: 'cristales', archivo: 'c3_cristales', fecha: '19 de Otoño · 19:12', lugar: 'Cota tres, primera curva', pie: 'Los cristales brillan solos y el aire está tibio.', candado: 'album', pista: 'calor' },
    { id: 'huevo', archivo: 'c3_huevo', fecha: '19 de Otoño · 19:40', lugar: 'Cota tres, el fondo', pie: '¿Esto es un huevo? Golpea desde adentro.', candado: 'album', pista: 'huevo' },
    { id: 'ojo', archivo: 'c3_ojo', fecha: '19 de Otoño · 20:05', lugar: '—', pie: '', candado: 'album', oscura: true, pistaLinterna: 'dragon' },
  ],
  notas: [
    { id: 'golpes', titulo: 'Golpes (anoto todo)', fecha: '15-18 de Otoño', pista: 'cuenta', texto: 'Lunes 15: 3 golpes\nMartes 16: 1 golpe (largo)\nMiércoles 17: 4 golpes (más rápido)\nJueves 18: 1 golpe y algo que se rompió\n\nNo es la brigada. La brigada siempre daba tres.' },
    { id: 'papa', titulo: 'Para papá', fecha: '18 de Otoño', texto: 'Treinta y un años y yo sigo pensando que alguien se quedó adentro.\nSi no hay nadie, me quedo tranquila.\nSi hay alguien, no lo dejo solo como lo dejaron a usted.' },
  ],
  voces: [
    { id: 'c3_ursula_calor', quien: 'ursula', nombre: 'Úrsula', fecha: '17 de Otoño', texto: 'Solas no, Rosalba. La piedra no se calienta sola. Si una veta está tibia es porque algo grande respira cerca.', d: '[curious, scientific, slightly worried] Solas no, Rosalba. La piedra no se calienta sola. Si una veta está tibia... es porque algo grande respira cerca.' },
    { id: 'c3_golpes', quien: 'rosalba', nombre: 'Rosalba', fecha: '16 de Otoño · 18:20', titulo: 'Golpes', grabadora: true, pista: 'golpes', texto: 'Escuchen. Ahí está otra vez. No es piedra cayendo. Es como si alguien tocara la pared desde el otro lado.', d: '[whispering, holding breath, echo of a mine] Escuchen... Ahí está otra vez. No es piedra cayendo. Es como si alguien tocara la pared desde el otro lado.' },
    { id: 'c3_entro', quien: 'rosalba', nombre: 'Rosalba', fecha: '19 de Otoño · 19:05', titulo: 'Entro', grabadora: true, texto: 'Voy a entrar. Diez minutos y salgo. Si no es nadie, me quedo en paz.', d: '[nervous, determined] Voy a entrar. Diez minutos y salgo. Si no es nadie, me quedo en paz.' },
    { id: 'c3_adentro', quien: 'rosalba', nombre: 'Rosalba', fecha: '19 de Otoño · 20:30', titulo: 'Adentro', grabadora: true, pista: 'cuidada', texto: 'Me caí, el tobillo otra vez. Atrás se vino el techo. Hay algo enorme aquí y está tibio. No me hace daño. Creo que me está cuidando.', d: '[in pain, then amazed, quiet] Me caí... el tobillo otra vez. Atrás se vino el techo. Hay algo enorme aquí y está tibio. No me hace daño. Creo que... me está cuidando.' },
    { id: 'c3_eloy_fin', quien: 'eloy', nombre: 'Eloy', fecha: '20 de Otoño', texto: 'Quietos todos. Nos está dejando pasar. Amparo, adelante, despacio.', d: '[whispering, awed, careful] Quietos todos. Nos está dejando pasar. Amparo, adelante... despacio.' },
    { id: 'c3_rosalba_fin', quien: 'rosalba', nombre: 'Rosalba', fecha: '20 de Otoño', texto: 'Mi papá no estaba allá adentro. Pero yo tampoco estuve sola.', d: '[tired, smiling through tears] Mi papá no estaba allá adentro. Pero yo tampoco estuve sola.' },
  ],
  llamadas: [
    { quien: 'eloy', t: '22:11', dia: '19 de Otoño', tipo: 'perdida' },
    { quien: 'eloy', t: '22:41', dia: '19 de Otoño', tipo: 'perdida' },
    { quien: 'petra', t: '23:02', dia: '19 de Otoño', tipo: 'perdida' },
    { quien: 'hugo', t: '20:31', dia: '19 de Otoño', tipo: 'perdida' },
    { quien: 'ursula', t: '14:05', dia: '18 de Otoño', tipo: 'entrante', dur: '3:20' },
  ],
  mapa: {
    titulo: 'Galerías de Piedralumbre',
    fondo: '#3b332c',
    trazos: [
      { tipo: 'camino', d: '10,15 30,15 30,40 55,40 55,65' },
      { tipo: 'camino', d: '30,40 18,60 18,85' },
      { tipo: 'ruta', d: '55,65 70,72 82,64 90,80', color: '#e0a12a' },
      { tipo: 'zona', d: '62,62 74,60 76,76 64,78', color: '#6a3a2a' },
      { tipo: 'zona', d: '82,72 98,70 98,95 80,95', color: '#7a4a2a' },
      { tipo: 'texto', d: '18,10', texto: 'BOCAMINA' },
      { tipo: 'texto', d: '70,58', texto: 'derrumbe' },
    ],
    lugares: [
      { id: 'boca', nombre: 'Bocamina', x: 10, y: 15, icono: 'mina' },
      { id: 'cota1', nombre: 'Cota uno (activa)', x: 18, y: 80, icono: 'pin' },
      { id: 'reja', nombre: 'Reja de la cota tres', x: 55, y: 62, icono: 'peligro', nota: 'Cerrada desde AV 281' },
      { id: 'curva', nombre: 'Segunda curva (techo suelto)', x: 70, y: 70, icono: 'peligro', pista: 'derrumbe' },
      { id: 'fondo', nombre: 'El fondo: cámara tibia', x: 90, y: 84, icono: 'estrella', nota: 'Guardado el 19 de Otoño 19:41', pista: 'nido' },
    ],
  },
  calendario: [
    { dia: '15 de Otoño', texto: 'Treinta y un años de lo de papá' },
    { dia: '19 de Otoño', t: '14:00', texto: 'Turno de la tarde (brigada de Eloy)' },
    { dia: '21 de Otoño', texto: 'Tarde de geodas con Petra y Úrsula' },
  ],
  pistas: [
    { id: 'candela', texto: 'El teléfono se abrió con «candela»: la brigada de su papá, que murió en el accidente de AV 281.' },
    { id: 'golpes', texto: 'Rosalba oía golpes detrás de la reja de la cota tres y creyó que alguien seguía atrapado.', clave: true },
    { id: 'cuenta', texto: 'Anotaba los golpes cada noche: 3, 1, 4, 1. No era la señal de la brigada (siempre eran tres).' },
    { id: 'album', texto: 'El álbum «Cota 3» se abrió con 3141: los golpes, noche por noche.' },
    { id: 'calor', texto: 'Las vetas de la cota tres estaban a 40 grados: «algo grande respira cerca».', clave: true },
    { id: 'derrumbe', texto: 'El techo de la segunda curva estaba suelto. Por eso la galería sigue cerrada.' },
    { id: 'huevo', texto: 'En el fondo de la cota tres hay un huevo de piedra que golpea desde adentro.', clave: true },
    { id: 'dragon', texto: 'Con la linterna se ve la última foto: un ojo enorme y dorado. Es una dragona de Celia.', clave: true, giro: true },
    { id: 'cuidada', texto: 'Rosalba se cayó, se le vino el techo detrás y algo tibio la está cuidando.', clave: true },
    { id: 'nido', texto: 'El último lugar que guardó en el mapa: la cámara tibia del fondo.' },
  ],
  ayudas: [
    { etapa: 'bloqueo', textos: ['El expediente habla de un casco que había en su casillero.', 'El recordatorio dice «la brigada de mi papá».', 'Escribe candela.'] },
    { etapa: 'album', textos: ['Los golpes los anotaba en una nota.', 'Cuatro noches, un número por noche.', 'El PIN es 3141.'] },
    { etapa: 'resolver', textos: ['El calor, el huevo y la foto oscura (¡prende la linterna!) dicen qué hay allá abajo.', 'Rosalba dice dónde quedó y cómo está.', 'Está en el fondo de la cota tres, con los dragones de Celia, que la cuidan.'] },
  ],
  preguntas: [
    {
      texto: '¿De quién eran los golpes?',
      opciones: ['De un minero atrapado desde AV 281', 'De una dragona de Celia y la cría que rompía su huevo', 'Del viento en los túneles', 'De Petra, haciéndole una broma'],
      correcta: 1,
      porque: 'El calor de las vetas, el huevo que golpea y el ojo dorado: la cota tres es un nido de dragones de Celia.',
    },
    {
      texto: '¿Dónde está Rosalba?',
      opciones: ['Se fue a Brasaviva', 'Debajo del derrumbe de la segunda curva', 'En la cámara tibia del fondo, con el tobillo torcido, cuidada por los dragones', 'En la cota uno'],
      correcta: 2,
      porque: 'El derrumbe le cerró el camino detrás; los dragones la mantienen tibia en su nido.',
    },
  ],
  final: {
    titulo: 'Tres golpes',
    paneles: [
      { foto: 'c3_fin_entrada', texto: 'Eloy, Amparo y Úrsula abren paso por la segunda curva. Adelante, algo enorme los mira.', voz: 'c3_eloy_fin', mov: 'acerca' },
      { foto: 'c3_fin_nido', texto: 'La dragona se aparta despacio. Rosalba está sentada junto al huevo, tibia, con la lámpara 46 en la mano.', mov: 'der' },
      { foto: 'c3_fin_salida', texto: 'La sacan en camilla por la bocamina. Detrás, desde el fondo, suenan tres golpes.', voz: 'c3_rosalba_fin', mov: 'aleja' },
    ],
    cierre: 'Caso cerrado. La cota tres sigue cerrada, ahora con un letrero nuevo: «Nido. No molestar».',
  },
};
