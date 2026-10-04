// Salas de juego: hasta 4 jugadores (Él, Ella o amigos) conectados con un código corto, cada uno en su celular o
// computador. Este archivo es el contrato que comparten los juegos en línea (Sangre y Ceniza, Lavarse la cara…):
// la implementación (`src/salas/sala.ts`, con Supabase Realtime y un modo local para pruebas) va aparte.

/** Quién juega: Él y Ella vienen de la casa; los amigos, de su perfil de amigo (sin nada de la pareja). */
export type TipoJugador = 'el' | 'ella' | 'amigo';

/** Cómo se ve el muñeco de un jugador (los amigos escogen cuerpo y colores; Él y Ella usan los suyos). */
export interface AspectoJugador {
  cuerpo: 'el' | 'ella';
  piel?: string;
  pelo?: string;
  /** Colores o prendas extra del perfil de amigo (el creador de personajes completo llega después). */
  detalles?: Record<string, string>;
}

export interface JugadorSala {
  /** Identificador estable del aparato/perfil (no cambia entre partidas). */
  id: string;
  nombre: string;
  tipo: TipoJugador;
  aspecto: AspectoJugador;
  /** Orden de llegada: 0 es el anfitrión. */
  puesto: number;
  /** Datos propios del juego (por ejemplo la clase escogida); los manda cada jugador. */
  datos?: Record<string, unknown>;
}

export interface Sala {
  readonly codigo: string;
  readonly juego: string;
  readonly yo: JugadorSala;
  /** Todos los que están (incluido yo), por puesto. */
  readonly jugadores: JugadorSala[];
  readonly soyAnfitrion: boolean;
  /** Hay alguien que no es Él ni Ella: los juegos deben esconder todo lo personal de la pareja. */
  readonly hayAmigos: boolean;
  /** Manda un mensaje a todos (o solo a un jugador). Para las fotos frecuentes del anfitrión usar `rapido`. */
  mandar(tipo: string, datos: unknown, opciones?: { a?: string; rapido?: boolean }): void;
  /** Escucha un tipo de mensaje; devuelve cómo dejar de escuchar. */
  al(tipo: string, fn: (datos: unknown, de: JugadorSala) => void): () => void;
  /** Alguien entró, salió o cambió sus datos. */
  alCambiar(fn: (jugadores: JugadorSala[]) => void): () => void;
  /** Se cortó (true) o volvió (false) la conexión con alguien; los juegos pausan con aviso. */
  alCorte(fn: (cortado: boolean, quien: JugadorSala) => void): () => void;
  /** Cambia mis datos del juego (clase, listo…), los demás los reciben en `alCambiar`. */
  ponerDatos(datos: Record<string, unknown>): void;
  /** El anfitrión cierra la entrada (la partida empezó) o la vuelve a abrir. */
  cerrarEntrada(cerrada: boolean): void;
  salir(): void;
}

export interface OpcionesSala {
  juego: string;
  /** Máximo de jugadores (hasta 4). */
  max?: number;
}

/** Lo que exporta `src/salas/sala.ts`. */
export interface ApiSalas {
  crearSala(o: OpcionesSala): Promise<Sala>;
  unirseSala(codigo: string, juego: string): Promise<Sala>;
  /** Quién soy en este aparato (Él, Ella o el perfil de amigo). */
  yoMismo(): JugadorSala;
}
