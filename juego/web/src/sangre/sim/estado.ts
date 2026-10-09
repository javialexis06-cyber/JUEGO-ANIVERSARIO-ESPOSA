// Los contenedores de la simulación: piscinas que se reutilizan (nada se crea por cuadro en lo que más se repite).
// Los enemigos van en arreglos planos (cientos a la vez); proyectiles, zonas, recogibles y aliados en piscinas de
// objetos. Lo que pasa en cada paso queda en `Sucesos` (números planos) para el dibujo, los sonidos y la red.

// ------------------------------------------------------------------------------------------------- Sucesos
export const S = {
  GOLPE: 1, // x, y, daño, crítico, etiqueta
  MUERTE: 2, // x, y, tipo, uid, escala (élite si > 1), giro
  TAJO: 3, // x, y, ángulo, radio, arco, arma
  ESTOCADA: 4, // x, y, ángulo, largo, ancho, arma
  CONO: 5, // x, y, ángulo, largo, arco, arma
  ONDA: 6, // x, y, radio, arma
  RAYO: 7, // x, y, radio, arma
  CADENA: 8, // x1, y1, x2, y2, arma
  EXPLOSION: 9, // x, y, radio, clase (0 fuego, 1 sagrado, 2 veneno, 3 hielo, 4 sangre, 5 sombra, 6 polvo)
  EXCAVA: 10, // cx, cy, tipo de celda, jugador
  ROTO: 11, // cx, cy, tipo de celda
  RECOGE: 12, // jugador, tipo, cantidad
  NIVEL: 13, // jugador, nivel
  HERIDO: 14, // jugador, daño, x, y
  BLOQUEO: 15, // jugador
  CAIDO: 16, // jugador
  LEVANTA: 17, // jugador
  HABILIDAD: 18, // jugador, x, y, ángulo, clase
  DISPARO_E: 19, // x, y, tipo
  APARECE: 20, // x, y, tipo, desde pared
  AVISO: 21, // código, a, b
  CURA: 22, // jugador, cantidad
  ESQUIVA: 23, // jugador
  REACCION: 24, // x, y, tipo
  EVOLUCION: 25, // jugador, arma
  CONDENA: 26, // x, y
  EJECUTA: 27, // x, y
  JEFE: 28, // código (0 aparece, 1 fase, 2 muere, 3 ataque, 4 aparece el Guardián, 5 muere el Guardián, 6 oleada, 7 sale un custodio), x, y, a
  CAMPANA: 29, // código (0 cae, 1 aterriza, 2 se va), x, y
  ESPIGA: 30, // x, y
  SALTO: 31, // x0, y0, x1, y1 (embestida, garfio, vampiro)
  INVOCA: 32, // x, y, tipo
  SOBRECARGA: 33, // jugador, arma
  MARCA: 34, // x, y
  LIBERA: 35, // x, y
} as const;

/** Un búfer de sucesos de 7 números cada uno: [tipo, a, b, c, d, e, f]. */
export class Sucesos {
  readonly d: Float32Array;
  n = 0;
  constructor(private max = 4096) {
    this.d = new Float32Array(max * 7);
  }
  push(tipo: number, a = 0, b = 0, c = 0, d = 0, e = 0, f = 0) {
    if (this.n >= this.max) return;
    const k = this.n * 7;
    this.d[k] = tipo;
    this.d[k + 1] = a;
    this.d[k + 2] = b;
    this.d[k + 3] = c;
    this.d[k + 4] = d;
    this.d[k + 5] = e;
    this.d[k + 6] = f;
    this.n++;
  }
  limpiar() {
    this.n = 0;
  }
}

// ------------------------------------------------------------------------------------------------- Enemigos
/** Estados de comportamiento. */
export const EST = { NORMAL: 0, CARGANDO: 1, EMBISTIENDO: 2, SALTANDO: 3, MECHA: 4, SALIENDO: 5, HUYENDO: 6, ENCANTADO: 7, APUNTANDO: 8 } as const;

export class Enemigos {
  readonly max: number;
  vivos = 0;
  /** Índices libres (pila). */
  private libres: Int32Array;
  private nLibres: number;
  private sigUid = 1;
  readonly vivo: Uint8Array;
  readonly tipo: Uint8Array;
  readonly uid: Uint16Array;
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  /** Empuje de los golpes (se gasta solo). */
  readonly kx: Float32Array;
  readonly ky: Float32Array;
  readonly rot: Float32Array;
  readonly hp: Float32Array;
  readonly hpMax: Float32Array;
  readonly escudo: Float32Array;
  readonly r: Float32Array;
  readonly vel: Float32Array;
  readonly dano: Float32Array;
  readonly esc: Float32Array;
  /** Modificadores de élite (bits de MOD_ELITE); 0 = normal. */
  readonly elite: Uint8Array;
  /** Marcado por un objetivo (cacería) o un evento. */
  readonly marcadoObj: Uint8Array;
  readonly estado: Uint8Array;
  readonly et: Float32Array;
  readonly atqT: Float32Array;
  /** Animaciones: fase de caminar, ataque (1 → 0), golpe (1 → 0). */
  readonly fase: Float32Array;
  readonly ataque: Float32Array;
  readonly golpe: Float32Array;
  // Estados alterados
  readonly quema: Float32Array; // daño por segundo
  readonly quemaT: Float32Array;
  readonly veneno: Float32Array;
  readonly venenoT: Float32Array;
  readonly sangrado: Float32Array;
  readonly sangradoT: Float32Array;
  readonly lento: Float32Array;
  readonly lentoT: Float32Array;
  readonly aturdido: Float32Array;
  readonly marca: Float32Array; // cazador
  readonly maldicion: Uint8Array; // bruja
  readonly condenaT: Float32Array;
  readonly miedo: Float32Array;
  readonly juzgado: Float32Array;
  /** Mezclas del alquimista: bits de sustancias recientes y hasta cuándo valen. */
  readonly mezcla: Uint8Array;
  readonly mezclaT: Float32Array;
  readonly cristal: Uint8Array;
  /** Quién le pegó por última vez (para dar las muertes y las mecánicas). */
  readonly ultimo: Int8Array;
  /** Hasta cuándo no lo vuelve a tocar cada fuente que se queda pegada (auras, órbitas, zonas): 8 casillas. */
  readonly hz: Float32Array;
  /** Altura extra (saliendo de la tierra, saltando, volando). */
  readonly alt: Float32Array;
  readonly dotT: Float32Array;

  constructor(max: number) {
    this.max = max;
    const f = () => new Float32Array(max);
    this.vivo = new Uint8Array(max);
    this.tipo = new Uint8Array(max);
    this.uid = new Uint16Array(max);
    this.x = f(); this.y = f(); this.vx = f(); this.vy = f(); this.kx = f(); this.ky = f(); this.rot = f();
    this.hp = f(); this.hpMax = f(); this.escudo = f(); this.r = f(); this.vel = f(); this.dano = f(); this.esc = f();
    this.elite = new Uint8Array(max);
    this.marcadoObj = new Uint8Array(max);
    this.estado = new Uint8Array(max);
    this.et = f(); this.atqT = f(); this.fase = f(); this.ataque = f(); this.golpe = f();
    this.quema = f(); this.quemaT = f(); this.veneno = f(); this.venenoT = f(); this.sangrado = f(); this.sangradoT = f();
    this.lento = f(); this.lentoT = f(); this.aturdido = f(); this.marca = f();
    this.maldicion = new Uint8Array(max);
    this.condenaT = f(); this.miedo = f(); this.juzgado = f();
    this.mezcla = new Uint8Array(max);
    this.mezclaT = f();
    this.cristal = new Uint8Array(max);
    this.ultimo = new Int8Array(max);
    this.hz = new Float32Array(max * 8);
    this.alt = f();
    this.dotT = f();
    this.libres = new Int32Array(max);
    for (let i = 0; i < max; i++) this.libres[i] = max - 1 - i;
    this.nLibres = max;
  }

  /** Reserva un enemigo (o -1 si no hay cupo). Deja todo en cero. */
  nuevo(): number {
    if (!this.nLibres) return -1;
    const i = this.libres[--this.nLibres];
    this.vivo[i] = 1;
    this.vivos++;
    this.uid[i] = this.sigUid;
    this.sigUid = (this.sigUid % 65000) + 1;
    this.vx[i] = this.vy[i] = this.kx[i] = this.ky[i] = this.rot[i] = 0;
    this.escudo[i] = 0;
    this.elite[i] = 0;
    this.marcadoObj[i] = 0;
    this.estado[i] = 0;
    this.et[i] = this.atqT[i] = this.ataque[i] = this.golpe[i] = 0;
    this.fase[i] = Math.random() * 6;
    this.quema[i] = this.quemaT[i] = this.veneno[i] = this.venenoT[i] = this.sangrado[i] = this.sangradoT[i] = 0;
    this.lento[i] = this.lentoT[i] = this.aturdido[i] = this.marca[i] = this.miedo[i] = this.juzgado[i] = 0;
    this.maldicion[i] = 0;
    this.condenaT[i] = 0;
    this.mezcla[i] = 0;
    this.mezclaT[i] = 0;
    this.cristal[i] = 0;
    this.ultimo[i] = -1;
    this.hz.fill(0, i * 8, i * 8 + 8);
    this.alt[i] = 0;
    this.dotT[i] = Math.random() * 0.25;
    this.esc[i] = 1;
    return i;
  }

  quitar(i: number) {
    if (!this.vivo[i]) return;
    this.vivo[i] = 0;
    this.vivos--;
    this.libres[this.nLibres++] = i;
  }

  /** Para la red: pone un enemigo con un uid dado (el espejo los crea con el uid del anfitrión). */
  nuevoConUid(uid: number): number {
    const i = this.nuevo();
    if (i >= 0) this.uid[i] = uid;
    return i;
  }
}

// ------------------------------------------------------------------------------------------------- Proyectiles
/** Cómo se mueve un proyectil. */
export const MOV = { RECTO: 0, LANZADO: 1, BUMERAN: 2, ORBITA: 3, ENEMIGO: 4, CAE: 5, TORRETA: 6, TRAMPA: 7 } as const;

export class Proyectil {
  vivo = false;
  /** Índice del jugador dueño (-1 = enemigo, -2 = aliado/torreta sin dueño). */
  dueno = -1;
  /** Ranura del arma del dueño (para sumarle daño y xp). */
  ranura = -1;
  /** Índice del arma en ARMAS_LISTA (para el dibujo) o del tipo de proyectil enemigo. */
  arma = 0;
  mov = 0;
  x = 0;
  y = 0;
  z = 0;
  vx = 0;
  vy = 0;
  r = 0.25;
  dano = 0;
  perfora = 1;
  rebotes = 0;
  vida = 1;
  t = 0;
  ang = 0;
  flags = 0;
  // Lanzado: de dónde a dónde y cuánto dura el vuelo
  x0 = 0;
  y0 = 0;
  x1 = 0;
  y1 = 0;
  // Órbita: ángulo, radio y velocidad
  orb = 0;
  orbR = 0;
  orbV = 0;
  /** Para el bumerán: ya va de vuelta. */
  vuelta = false;
  /** Golpeados recientes (anillo de 8 uid) para no pegarle dos veces al mismo. */
  gid = new Uint16Array(8);
  gt = new Float32Array(8);
  gi = 0;
  /** Parámetros de efecto (los del arma en el momento de disparar). */
  area = 0;
  quema = 0;
  veneno = 0;
  sangrado = 0;
  lento = 0;
  aturde = 0;
  maldicion = 0;
  critico = 0;
  empuje = 0;
  duracion = 0;
  etq = 0;
  /** Proyectil de un aliado (torreta, esqueleto arquero de los nuestros). */
  aliado = false;
  /** Enemigo al que persigue (teledirigidos) o -1. */
  blanco = -1;
  /** Libre (bumerán: distancia máxima; caída: ya pegó). */
  ref = 0;
  /** Proyectil chiquito (de una división): no se vuelve a dividir. */
  mini = false;

  yaGolpeo(uid: number, t: number) {
    for (let k = 0; k < 8; k++) if (this.gid[k] === uid && this.gt[k] > t) return true;
    return false;
  }
  anotar(uid: number, hasta: number) {
    this.gid[this.gi] = uid;
    this.gt[this.gi] = hasta;
    this.gi = (this.gi + 1) & 7;
  }
}

// ------------------------------------------------------------------------------------------------- Zonas
/** Tipos de zona en el piso. */
export const ZONA = { ACIDO: 0, FUEGO: 1, HIELO: 2, SAGRADA: 3, VENENO: 4, PANTANO: 5, HUMO: 6, SANGRE: 7, SOMBRA: 8, TOTEM: 9, LUZ_JEFE: 10, PELIGRO: 11 } as const;

export class Zona {
  vivo = false;
  tipo = 0;
  dueno = -1;
  ranura = -1;
  x = 0;
  y = 0;
  r = 1;
  dps = 0;
  vida = 1;
  total = 1;
  t = 0;
  lento = 0;
  veneno = 0;
  quema = 0;
  maldicion = 0;
  cura = 0;
  /** Daña a los jugadores en vez de a los enemigos. */
  enemiga = false;
  /** Se pega a un jugador (nube de gas). */
  sigue = -1;
  etq = 0;
  id = 0;
  /** Aviso antes de pegar (s): mientras tanto solo se ve la sombra en el piso. */
  retraso = 0;
  /** Pega una sola vez al cumplirse el retraso (huesos que caen, golpes del jefe). */
  unico = false;
  hecho = false;
  /** Para el dibujo: de qué arma viene (índice) o −1. */
  arma = -1;
  tickT = 0;
}

// ------------------------------------------------------------------------------------------------- Recogibles
export const REC = { ALMA_AZUL: 0, ALMA_VERDE: 1, ALMA_ROJA: 2, ORO: 3, HIERRO: 4, SANGRE: 5, COMIDA: 6, COFRE: 7, LLAVE: 8, FRASCO: 9, EQUIPO: 10, HUEVO: 11, GOTA: 12, IMAN: 13, ROSA: 14, PLUMA: 15, HONGO: 16, MINERAL: 17,
  // (después de los seis minerales: las gotas de mercurio y las campanitas de plata)
  MERCURIO: 23, CAMPANITA: 24 } as const;
/** Los minerales son seis recogibles seguidos: REC.MINERAL + índice del mineral (MINERALES_ORDEN). */
export const esMineral = (t: number) => t >= REC.MINERAL && t < REC.MINERAL + 6;

export class Recogible {
  vivo = false;
  tipo = 0;
  x = 0;
  y = 0;
  z = 0;
  vz = 0;
  vx = 0;
  vy = 0;
  valor = 1;
  /** Jugador que lo está atrayendo (-1 = en el piso). */
  hacia = -1;
  t = 0;
  /** Para el equipo: su id. */
  dato = '';
  id = 0;
  /** No se puede recoger todavía (recién soltado, sale volando). */
  espera = 0;
}

// ------------------------------------------------------------------------------------------------- Aliados
export const ALI = { CABALLERO: 0, BALLESTERO: 1, ESQUELETO: 2, ESPIRITU: 3, TORRETA: 4, TRAMPA: 5, CUERVO: 6, ANIMA: 7, PRISIONERO: 8, TOTEM: 9, ESPIGA: 10, ENCANTADO: 11, FAMILIAR: 12 } as const;

export class Aliado {
  vivo = false;
  tipo = 0;
  dueno = 0;
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  rot = 0;
  hp = 1;
  hpMax = 1;
  dano = 1;
  vida = 0; // segundos que le quedan (0 = para siempre)
  atqT = 0;
  fase = 0;
  ataque = 0;
  golpe = 0;
  /** Enemigo que persigue (índice) o -1. */
  blanco = -1;
  r = 0.35;
  /** Libre para cada tipo (carga de la espiga, ángulo del cuervo, enemigo encantado…). */
  a = 0;
  b = 0;
  id = 0;
  /** Para los encantados: tipo de enemigo que imita. */
  imita = -1;
}

// ------------------------------------------------------------------------------------------------- Entidades de objetivo
export const ENT = {
  ALTAR: 0, PRISIONERO: 1, CARRETA: 2, CAMPANA_DEF: 3, COFRE_RELIQUIA: 4, SANTUARIO: 5, EXTRACCION: 6, COFRE_MALDITO: 7, SEPULCRO: 8, SUMINISTRO: 9, VAGONETA: 10,
  PINCHOS: 11, ARMADURA: 12, CAMPANARIO: 13,
  // Sangre y Ceniza 2 (B): el cáliz y sus cristales (Cosecha), los huevos de gárgola y el osario (La Cría), las campanas
  // embrujadas (Exorcismo) y el Relicario (final de La Procesión)
  CALIZ: 14, CRISTAL: 15, HUEVO_GARGOLA: 16, OSARIO: 17, CAMPANA_EXO: 18, RELICARIO: 19,
} as const;

export class Entidad {
  vivo = true;
  tipo = 0;
  id = 0;
  x = 0;
  y = 0;
  hp = 0;
  hpMax = 0;
  /** Progreso 0-1 (liberar, cargar, abrir). */
  prog = 0;
  /** Estado propio: 0 quieto, 1 activo, 2 hecho. */
  est = 0;
  /** Jugador que lo sigue/abre (-1 nadie). */
  quien = -1;
  t = 0;
  /** Para la carreta: índice del riel por donde va. */
  k = 0;
  /** Para la campana: cuenta regresiva. */
  cuenta = 0;
  dato = '';
}
