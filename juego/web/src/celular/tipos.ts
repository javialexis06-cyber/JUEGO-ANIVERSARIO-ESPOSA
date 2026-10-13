// «Desaparecidos de Astra»: los datos de cada caso (un celular encontrado en algún lugar de Astra). Cada caso trae el
// teléfono entero (su cara, su candado, sus apps y lo que hay adentro), las pistas que se anotan solas en la libreta,
// las ayudas por etapa, las preguntas para cerrarlo y la escena corta del final. Nada de la pareja: también lo juegan
// los amigos (docs/sistemas/celular.md).

/** Un candado: el de la pantalla de bloqueo o el de algo de adentro (una nota, un álbum, la bitácora…). */
export interface Candado {
  id: string;
  tipo: 'pin' | 'patron' | 'palabra';
  /** PIN: los números; patrón: los puntos del 1 al 9 en orden («14789»); palabra: sin tildes ni mayúsculas. */
  clave: string;
  /** Lo que dice el candado (p. ej. «Notas privadas»). */
  titulo: string;
  /** El recordatorio que dejó el dueño (lo que se ve debajo del candado). */
  recordatorio: string;
  /** La pista que se anota al abrirlo. */
  pista?: string;
}

export interface Contacto {
  id: string;
  nombre: string;
  /** Foto (renders en public/celular/fotos) o, si no tiene, su inicial sobre este color. */
  foto?: string;
  color: string;
  /** Lo que se ve debajo del nombre (oficio, «Mamá»…). */
  rol?: string;
}

export interface Mensaje {
  /** 'yo' (el dueño del teléfono) o el id del contacto (en los grupos, quién habla). */
  de: string;
  t: string;
  /** Si empieza un día nuevo, su rótulo («Martes 12 de Otoño»). */
  dia?: string;
  texto?: string;
  foto?: string;
  /** Una nota de voz (id de `voces`). */
  voz?: string;
  pista?: string;
}

export interface Chat {
  con: string;
  /** Nombre del grupo (si lo es). */
  grupo?: string;
  noLeidos?: number;
  mensajes: Mensaje[];
}

export interface Foto {
  id: string;
  /** Archivo en public/celular/fotos (sin la carpeta). */
  archivo: string;
  fecha: string;
  lugar?: string;
  /** Lo que se lee al abrirla (como el pie de foto de la galería o el comentario del dueño). */
  pie?: string;
  pista?: string;
  /** Solo se ve bien con la linterna prendida (y entonces anota `pistaLinterna`). */
  oscura?: boolean;
  pistaLinterna?: string;
  /** Va en un álbum con candado (id del candado). */
  candado?: string;
  /** Una seña de luz (Iridalia): el color que brilla en la foto. */
  sena?: string;
}

export interface Nota {
  id: string;
  titulo: string;
  fecha: string;
  texto: string;
  pista?: string;
  candado?: string;
}

/** Una nota de voz: su transcripción y cómo se dice (para ElevenLabs, con acotaciones en inglés entre corchetes). */
export interface Voz {
  id: string;
  /** Quién habla (la voz de ElevenLabs se escoge por esto: voces-guion/celular-reparto.json). */
  quien: string;
  nombre: string;
  fecha: string;
  texto: string;
  d?: string;
  /** Sale también en la grabadora (las que grabó el dueño). */
  grabadora?: boolean;
  titulo?: string;
  pista?: string;
  /** Lo que dice la transcripción automática del teléfono, si se equivoca (Iridalia). */
  transcrita?: string;
}

export interface Llamada {
  quien: string;
  t: string;
  dia: string;
  tipo: 'perdida' | 'entrante' | 'saliente';
  dur?: string;
  pista?: string;
}

export interface LugarMapa {
  id: string;
  nombre: string;
  /** Posición en el mapa (0-100). */
  x: number;
  y: number;
  nota?: string;
  icono?: 'pin' | 'casa' | 'estrella' | 'peligro' | 'agua' | 'faro' | 'mina' | 'nave' | 'flor' | 'cristal';
  pista?: string;
}

/** Lo que se dibuja en el mapa (cada caso tiene su terreno). */
export interface Trazo {
  tipo: 'agua' | 'camino' | 'zona' | 'texto' | 'ruta';
  /** Puntos «x,y x,y…» (0-100). */
  d: string;
  color?: string;
  texto?: string;
}

export interface Mapa {
  titulo: string;
  fondo: string;
  trazos: Trazo[];
  lugares: LugarMapa[];
}

export interface Correo {
  id: string;
  de: string;
  asunto: string;
  fecha: string;
  texto: string;
  pista?: string;
  candado?: string;
  /** Foto adjunta (cámaras de la estación…). */
  foto?: string;
}

export interface Evento {
  dia: string;
  t?: string;
  texto: string;
  pista?: string;
}

export interface Pista {
  id: string;
  texto: string;
  /** Hace falta para cerrar el caso. */
  clave?: boolean;
  /** Es el giro del caso (sale destacado en la libreta). */
  giro?: boolean;
}

export interface Pregunta {
  texto: string;
  opciones: string[];
  correcta: number;
  /** Lo que se explica al acertar. */
  porque: string;
}

export interface Panel {
  foto: string;
  texto: string;
  voz?: string;
  /** Hacia dónde se mueve la cámara sobre la foto. */
  mov?: 'acerca' | 'aleja' | 'izq' | 'der';
}

export type IdApp = 'mensajes' | 'fotos' | 'notas' | 'grabadora' | 'llamadas' | 'mapa' | 'correo' | 'calendario' | 'linterna' | 'senas';

export interface Telefono {
  /** Nombre del aparato (se ve en «acerca del teléfono»). */
  modelo: string;
  /** Foto de fondo de la pantalla de bloqueo y del inicio. */
  fondo: string;
  /** Color de acento (botones, burbujas propias). */
  acento: string;
  /** Tema claro u oscuro de las apps. */
  oscuro: boolean;
  bateria: number;
  operador: string;
  hora: string;
  fecha: string;
  /** Pantalla rota, funda… (detalles de la carcasa). */
  carcasa: 'roto' | 'robusto' | 'viejo' | 'elegante' | 'flores' | 'cristal' | 'estrellas' | 'traje';
  /** Fuente de letra de la carcasa y la hora grande. */
  letra?: string;
  /** Nombre de la bitácora o el correo (cada oficio la llama distinto). */
  nombreCorreo?: string;
  avisos: { app: IdApp; titulo: string; texto: string; t: string }[];
}

export interface Caso {
  id: string;
  n: number;
  titulo: string;
  lugar: string;
  /** El mundo (para el color de la carpeta y el sello). */
  mundo: string;
  /** Quién se perdió. */
  persona: { nombre: string; edad: string; oficio: string; foto: string };
  /** Lo que cuenta Ulises al entregar el teléfono (uno o varios párrafos cortos). */
  expediente: string[];
  /** Dónde y cómo apareció el teléfono. */
  hallazgo: string;
  /** El dueño del teléfono (en los chats es «yo»). */
  dueno: string;
  telefono: Telefono;
  bloqueo: Candado;
  candados: Candado[];
  apps: IdApp[];
  contactos: Contacto[];
  chats: Chat[];
  fotos: Foto[];
  notas: Nota[];
  voces: Voz[];
  llamadas: Llamada[];
  mapa?: Mapa;
  correo?: Correo[];
  calendario: Evento[];
  /** El código de señas de luz (caso de Iridalia): color → letra. */
  senas?: { color: string; nombre: string; letra: string }[];
  pistas: Pista[];
  /** Ayudas por etapa: 'bloqueo', el id de un candado, o 'resolver'. Cada una se destapa de a una. */
  ayudas: { etapa: string; textos: string[] }[];
  preguntas: Pregunta[];
  final: { titulo: string; paneles: Panel[]; cierre: string };
  /** El primero enseña a jugar (Ulises va guiando). */
  tutorial?: boolean;
}
