// Caso 5 · El astrónomo de Nocturna (Vigía de Nocturna, AV 312).
// Teófilo, ayudante de Naim en el registro de Nocturna, anotaba una «estrella que se mueve sola». No es una estrella:
// es una astilla de estrella muerta que va soltando ceniza y mancha la cara oculta de Nocturna (la luna sangrienta de
// Sangre y Ceniza, docs/mitologia.md). Teófilo salió en el carro lunar a fotografiarla y se quedó: la ceniza apagó las
// balizas del tránsito (Nocturna orienta el paso de las almas de Senda a Verdia) y él las está prendiendo a mano.
import type { Caso } from '../tipos';

export const CASO_NOCTURNA: Caso = {
  id: 'nocturna',
  n: 5,
  titulo: 'El astrónomo de Nocturna',
  lugar: 'Vigía de Nocturna',
  mundo: 'Cielo de Astra',
  persona: { nombre: 'Teófilo', edad: '55 años', oficio: 'Ayudante del registro de Nocturna', foto: 'c5_teofilo' },
  expediente: [
    'Naim, el registrador de la Vigía de Nocturna, me manda esto. Teófilo, su ayudante, salió hace dos noches en el carro lunar hacia la cara oscura de la luna. El carro volvió solo, en piloto automático, con el teléfono en el asiento.',
    'Teófilo llevaba meses diciendo que había una estrella que «camina». Nadie más la veía y le daba pena hablar de eso.',
    'En su escritorio había una tarjeta escrita a mano: «Mi estrella: N-1207». Naim dice que Teófilo usa ese número para todo.',
  ],
  hallazgo: 'Asiento del carro lunar, que volvió solo',
  dueno: 'Teófilo',
  telefono: {
    modelo: 'Órbita S (modo nocturno)',
    fondo: 'c5_fondo',
    acento: '#7a8cff',
    oscuro: true,
    bateria: 22,
    operador: 'Red de la Vigía',
    hora: '03:15',
    fecha: 'martes 21 de Invierno',
    carcasa: 'estrellas',
    letra: '"Courier New", monospace',
    nombreCorreo: 'Bitácora de observación',
    avisos: [
      { app: 'mensajes', titulo: 'Bernardo', texto: 'Se apagaron otra vez las balizas del borde', t: '01:02' },
      { app: 'mensajes', titulo: 'Matea', texto: 'Tu ruta no está aprobada, Teo', t: '22:30' },
      { app: 'correo', titulo: 'Bitácora', texto: 'Entrada protegida', t: '00:40' },
    ],
  },
  bloqueo: { id: 'bloqueo', tipo: 'pin', clave: '1207', titulo: 'Escribe el PIN', recordatorio: 'Mi estrella', pista: 'pin' },
  candados: [
    { id: 'bitacora', tipo: 'palabra', clave: 'andariega', titulo: 'Bitácora de observación', recordatorio: 'El nombre que le pusieron los niños', pista: 'andariega' },
  ],
  apps: ['mensajes', 'fotos', 'notas', 'grabadora', 'llamadas', 'mapa', 'correo', 'calendario', 'linterna'],
  contactos: [
    { id: 'naim', nombre: 'Naim', rol: 'Registrador', foto: 'c5_av_naim', color: '#4a5a9a' },
    { id: 'matea', nombre: 'Matea', rol: 'Navegante', foto: 'c5_av_matea', color: '#2f7a8a' },
    { id: 'bernardo', nombre: 'Bernardo', rol: 'Farolero de balizas', color: '#d9a02a' },
    { id: 'celestina', nombre: 'Celestina', rol: 'Maestra del cielo', color: '#c45a8a' },
    { id: 'gaspar', nombre: 'Gaspar', rol: 'Orfebre (lentes)', color: '#8a8a9a' },
  ],
  chats: [
    {
      con: 'naim',
      mensajes: [
        { de: 'yo', t: '02:10', dia: 'Jueves 9 de Invierno', texto: 'Naim, se movió otra vez. Anoche estaba al lado del Arquero; hoy está tres dedos más abajo.' },
        { de: 'naim', t: '07:30', texto: 'Teófilo, las estrellas no caminan. Revisé el telescopio grande y no veo nada.' },
        { de: 'yo', t: '07:35', texto: 'Porque es oscura. No brilla: tapa. Se ve por lo que esconde detrás.', pista: 'oscura' },
        { de: 'naim', t: '07:40', texto: 'Anótala en la bitácora y lo vemos con calma. Sin hacer locuras.' },
      ],
    },
    {
      con: 'celestina',
      mensajes: [
        { de: 'celestina', t: '16:00', dia: 'Lunes 13 de Invierno', texto: 'Teo, los niños de la clase por radio quieren saber de tu estrella que camina 🌟' },
        { de: 'yo', t: '16:10', texto: 'Diles que se esconde detrás de las demás. Que la busquen por donde falta una estrella.' },
        { de: 'celestina', t: '16:30', texto: '¡Ya le pusieron nombre! Votaron y ganó «la Andariega».', pista: 'andariega_nombre' },
        { de: 'yo', t: '16:31', texto: 'Me encanta. La Andariega se queda 💫' },
      ],
    },
    {
      con: 'matea',
      noLeidos: 2,
      mensajes: [
        { de: 'yo', t: '21:00', dia: 'Domingo 19 de Invierno', texto: 'Matea, necesito el carro lunar para ir hasta la cara oscura. Dos horas y vuelvo.' },
        { de: 'matea', t: '21:20', texto: 'La cara oscura está fuera de las rutas, Teo. Y desde hace un mes se le está haciendo una mancha.', pista: 'mancha' },
        { de: 'matea', t: '22:30', dia: 'Lunes 20 de Invierno', texto: 'Tu ruta no está aprobada, Teo' },
        { de: 'matea', t: '06:10', dia: 'Martes 21 de Invierno', texto: 'El carro volvió solo. ¿¿Dónde estás??' },
      ],
    },
    {
      con: 'bernardo',
      noLeidos: 1,
      mensajes: [
        { de: 'bernardo', t: '19:00', dia: 'Sábado 18 de Invierno', texto: 'Teófilo, ¿tú sabes por qué se me apagan las balizas del borde? Las prendo y a los dos días amanecen cubiertas de un polvo gris.', pista: 'balizas' },
        { de: 'yo', t: '19:10', texto: 'Guárdame un poquito de ese polvo, Bernardo.' },
        { de: 'bernardo', t: '19:12', foto: 'c5_polvo' },
        { de: 'bernardo', t: '01:02', dia: 'Martes 21 de Invierno', texto: 'Se apagaron otra vez las balizas del borde. Esta noche pasan almas por el tránsito, ¿cierto?' },
      ],
    },
    {
      con: 'gaspar',
      mensajes: [
        { de: 'gaspar', t: '12:00', dia: 'Viernes 17 de Invierno', texto: 'Ya le pulí el lente nuevo. Con ese ve hasta la ceniza, si quiere.' },
      ],
    },
  ],
  fotos: [
    { id: 'vigia', archivo: 'c5_vigia', fecha: '2 de Invierno', lugar: 'Vigía de Nocturna', pie: 'Mi casa: la Vigía, la antena y el cielo más limpio de Astra.' },
    { id: 'hueco', archivo: 'c5_hueco', fecha: '9 de Invierno · 02:05', lugar: 'Telescopio', pie: 'Aquí faltaba una estrella. Ayer estaba. La Andariega pasó por delante.', pista: 'oscura' },
    { id: 'polvo', archivo: 'c5_polvo', fecha: '18 de Invierno', lugar: 'Baliza 7', pie: '(Foto de Bernardo) Polvo gris sobre la baliza. No es polvo de luna: es ceniza.', pista: 'ceniza' },
    { id: 'mancha', archivo: 'c5_mancha', fecha: '20 de Invierno · 23:10', lugar: 'Cara oscura', pie: 'La mancha. Llueve ceniza despacito, desde arriba.', pista: 'mancha' },
    { id: 'balizas', archivo: 'c5_balizas', fecha: '21 de Invierno · 00:52', lugar: 'Borde de la mancha', pie: 'Las balizas del tránsito, apagadas. Prendí la 7 con la mano.', pista: 'mano' },
  ],
  notas: [
    { id: 'pena', titulo: 'Para no olvidar', fecha: '10 de Invierno', texto: 'Me da pena que se rían. Por eso escribo la bitácora con clave.\nSi tengo razón, la Andariega no es una estrella.\nUna estrella da luz. Esta la quita.' },
    { id: 'lista', titulo: 'Llevar al carro', fecha: '20 de Invierno', texto: '- Lente nuevo de Gaspar\n- Dos tanques de aire (6 h cada uno)\n- Mechero de balizas\n- Termo de agua de panela\n- Cobija' , pista: 'aire' },
  ],
  voces: [
    { id: 'c5_teofilo_hueco', quien: 'teofilo', nombre: 'Teófilo', fecha: '9 de Invierno', titulo: 'Observación', grabadora: true, texto: 'Dos y cinco de la mañana. Otra vez falta una estrella. No es que se apague: algo oscuro le pasa por delante.', d: '[middle-aged man, whispering excitedly at night] Dos y cinco de la mañana. Otra vez falta una estrella. No es que se apague... algo oscuro le pasa por delante.' },
    { id: 'c5_teofilo_mancha', quien: 'teofilo', nombre: 'Teófilo', fecha: '20 de Invierno · 23:12', titulo: 'La mancha', grabadora: true, pista: 'astilla', texto: 'Ya la vi de cerca. Es una astilla de estrella muerta y se está deshaciendo en ceniza. Por eso Nocturna se mancha.', d: '[awed, breathing in a helmet] Ya la vi de cerca. Es una astilla de estrella muerta... y se está deshaciendo en ceniza. Por eso Nocturna se mancha.' },
    { id: 'c5_teofilo_quedo', quien: 'teofilo', nombre: 'Teófilo', fecha: '21 de Invierno · 00:55', titulo: 'Me quedo', grabadora: true, pista: 'quedo', texto: 'Las balizas están todas tapadas. Si se apagan, las almas que pasan esta noche no ven el camino. Mando el carro de vuelta. Yo me quedo prendiéndolas.', d: '[calm, decided, helmet breathing] Las balizas están todas tapadas. Si se apagan, las almas que pasan esta noche no ven el camino. Mando el carro de vuelta. Yo me quedo prendiéndolas.' },
    { id: 'c5_matea_fin', quien: 'matea', nombre: 'Matea', fecha: '21 de Invierno', texto: 'Teo, te vemos. Toda la fila de balizas está prendida. Vamos por ti.', d: '[radio, relieved, warm] Teo, te vemos. Toda la fila de balizas está prendida. Vamos por ti.' },
    { id: 'c5_teofilo_fin', quien: 'teofilo', nombre: 'Teófilo', fecha: '21 de Invierno', texto: 'Díganle a los niños que la Andariega existe. Y que no se rían mucho de este viejo.', d: '[tired, happy, chuckling] Díganle a los niños que la Andariega existe. Y que no se rían mucho de este viejo.' },
  ],
  llamadas: [
    { quien: 'matea', t: '06:11', dia: '21 de Invierno', tipo: 'perdida' },
    { quien: 'naim', t: '06:30', dia: '21 de Invierno', tipo: 'perdida' },
    { quien: 'bernardo', t: '01:03', dia: '21 de Invierno', tipo: 'perdida' },
    { quien: 'celestina', t: '16:05', dia: '13 de Invierno', tipo: 'entrante', dur: '8:12' },
  ],
  mapa: {
    titulo: 'Nocturna',
    fondo: '#2a2d44',
    trazos: [
      { tipo: 'zona', d: '58,10 92,16 96,52 70,60 54,36', color: '#3b3046' },
      { tipo: 'camino', d: '10,85 30,70 50,58 64,46 72,36 80,26' },
      { tipo: 'texto', d: '80,8', texto: 'CARA OSCURA' },
      { tipo: 'texto', d: '76,46', texto: 'mancha' },
      { tipo: 'ruta', d: '12,84 34,66 52,56', color: '#7a8cff' },
    ],
    lugares: [
      { id: 'vigia', nombre: 'Vigía de Nocturna', x: 12, y: 84, icono: 'casa' },
      { id: 'b3', nombre: 'Baliza 3', x: 30, y: 70, icono: 'estrella' },
      { id: 'b5', nombre: 'Baliza 5', x: 50, y: 58, icono: 'estrella' },
      { id: 'b7', nombre: 'Baliza 7 (borde de la mancha)', x: 64, y: 46, icono: 'estrella', nota: 'Guardado 21 de Invierno 00:50: «refugio de Bernardo, con aire de reserva»', pista: 'refugio' },
      { id: 'b9', nombre: 'Baliza 9', x: 80, y: 26, icono: 'estrella' },
    ],
  },
  correo: [
    { id: 'o1', de: 'Bitácora', asunto: '9 de Invierno · La Andariega', fecha: '9 Inv.', texto: 'Objeto oscuro, sin brillo propio. Tapa estrellas al pasar. Se mueve hacia Nocturna, no alrededor de ella. Velocidad: tres dedos por noche.', candado: 'bitacora', pista: 'oscura' },
    { id: 'o2', de: 'Bitácora', asunto: '16 de Invierno · La mancha', fecha: '16 Inv.', texto: 'La mancha de la cara oscura crece donde cae la sombra de la Andariega. Bernardo dice que se le apagan las balizas del borde. Sospecho ceniza.', candado: 'bitacora', pista: 'ceniza' },
    { id: 'o3', de: 'Bitácora', asunto: '21 de Invierno · 00:40', fecha: '21 Inv.', texto: 'Llegué. Es una astilla de estrella muerta, como las que cuentan de la frontera. Suelta ceniza. Las balizas del tránsito están tapadas: esta noche las almas de Senda pasan por aquí. Me quedo en la 7: el refugio de Bernardo tiene aire para tres días.', candado: 'bitacora', pista: 'quedo' },
  ],
  calendario: [
    { dia: '13 de Invierno', t: '16:00', texto: 'Clase por radio con Celestina' },
    { dia: '21 de Invierno', t: '00:00', texto: 'Noche de tránsito (Nocturna llena)', pista: 'transito' },
    { dia: '24 de Invierno', texto: 'Devolverle el carro a Matea (¡con tanque lleno!)' },
  ],
  pistas: [
    { id: 'pin', texto: 'El teléfono se abrió con 1207: el número de su estrella.' },
    { id: 'oscura', texto: 'La «estrella que camina» no brilla: tapa las estrellas de atrás. Se mueve hacia Nocturna.', clave: true },
    { id: 'andariega_nombre', texto: 'Los niños de la clase de Celestina la bautizaron «la Andariega».' },
    { id: 'andariega', texto: 'La bitácora de observación se abrió con «andariega».' },
    { id: 'mancha', texto: 'Desde hace un mes, la cara oscura de Nocturna tiene una mancha que crece.' },
    { id: 'balizas', texto: 'Las balizas del borde se apagan cubiertas de un polvo gris.' },
    { id: 'ceniza', texto: 'El polvo gris de las balizas es ceniza.' },
    { id: 'astilla', texto: 'La Andariega es una astilla de estrella muerta que suelta ceniza: por eso se mancha Nocturna.', clave: true, giro: true },
    { id: 'transito', texto: 'La noche del 21 había tránsito: las almas pasan de Senda a Verdia guiadas por las balizas de Nocturna.', clave: true },
    { id: 'mano', texto: 'Teófilo prendió con la mano la baliza 7.' },
    { id: 'quedo', texto: 'Teófilo mandó el carro de vuelta y se quedó prendiendo las balizas para que las almas no se perdieran.', clave: true },
    { id: 'refugio', texto: 'En la baliza 7 hay un refugio de Bernardo con aire para tres días.', clave: true },
    { id: 'aire', texto: 'Llevó dos tanques de aire de seis horas cada uno.' },
  ],
  ayudas: [
    { etapa: 'bloqueo', textos: ['El expediente habla de una tarjeta en su escritorio.', '«Mi estrella: N-1207».', 'El PIN es 1207.'] },
    { etapa: 'bitacora', textos: ['¿Quién le puso nombre a la estrella?', 'Celestina se lo cuenta en el chat.', 'Escribe andariega.'] },
    { etapa: 'resolver', textos: ['La bitácora y la nota de voz «La mancha» dicen qué es la Andariega.', 'El calendario dice qué pasaba esa noche; la última grabación dice qué decidió.', 'Está en la baliza 7, en el refugio de Bernardo, prendiendo las balizas a mano.'] },
  ],
  preguntas: [
    {
      texto: '¿Qué es «la Andariega»?',
      opciones: ['Una estrella nueva que nace', 'Un grifo que vuela de noche', 'Una astilla de estrella muerta que suelta ceniza y mancha a Nocturna', 'Un reflejo en el lente de Gaspar'],
      correcta: 2,
      porque: 'No brilla, tapa; deja ceniza en las balizas; y la mancha crece donde cae su sombra.',
    },
    {
      texto: '¿Por qué no volvió Teófilo?',
      opciones: ['Se perdió en la cara oscura', 'Se quedó prendiendo a mano las balizas del tránsito, para que las almas no se perdieran', 'Se escondió por pena', 'El carro lo dejó botado'],
      correcta: 1,
      porque: 'Era noche de tránsito: sin balizas, las almas que iban de Senda a Verdia no habrían visto el camino.',
    },
    {
      texto: '¿Dónde está?',
      opciones: ['En la baliza 3', 'En la Vigía', 'En la baliza 7, en el refugio de Bernardo', 'En la Estación sobre Celia'],
      correcta: 2,
      porque: 'El refugio de la 7 tiene aire para tres días. Desde ahí se alcanza toda la fila.',
    },
  ],
  final: {
    titulo: 'La fila de luces',
    paneles: [
      { foto: 'c5_fin_fila', texto: 'Desde la Vigía, Matea ve algo que no había visto nunca: la fila entera de balizas prendida hasta el borde.', voz: 'c5_matea_fin', mov: 'der' },
      { foto: 'c5_fin_refugio', texto: 'En la baliza 7, Teófilo espera sentado, con el mechero en la mano y la cara gris de ceniza.', mov: 'acerca' },
      { foto: 'c5_fin_cielo', texto: 'Esa noche ninguna alma se perdió. Y la Andariega quedó anotada en el registro con su nombre.', voz: 'c5_teofilo_fin', mov: 'aleja' },
    ],
    cierre: 'Caso cerrado. Naim mandó la bitácora de Teófilo a Vigilia: la ceniza que mancha a Nocturna ya tiene quién la vigile.',
  },
};
