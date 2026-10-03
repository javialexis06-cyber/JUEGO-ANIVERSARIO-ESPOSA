// Lo que ve cada acertijo (Ctx) y cómo se describe una puerta (Nivel), con su prueba automática (Probador).
import type * as THREE from 'three';
import type { OpDesorden } from './desorden';
import type { Dir, OpArrastre, PuntoTrazo } from './entrada';
import type { Escena } from './escena';
import type { Puerta } from './puerta';
import type { Sensores } from './sensores';
import type { Paneles } from './ui';

export interface Ctx {
  /** Número de la puerta (1–100). */
  n: number;
  escena: Escena;
  /** Todo lo del acertijo va aquí (se borra al salir). */
  g: THREE.Group;
  puerta: Puerta;
  sensores: Sensores;
  ui: Paneles;
  /** Azar repetible de esta puerta. */
  azar: () => number;

  /** `prioridad`: el toque le llega aunque otra cosa le quede delante (papelitos, cositas chiquitas). */
  tocar(obj: THREE.Object3D, fn: (hit: THREE.Intersection) => void, prioridad?: boolean): void;
  mantener(obj: THREE.Object3D, bajar: (hit: THREE.Intersection) => void, soltar: (ms: number) => void): void;
  arrastrar(obj: THREE.Object3D, op: OpArrastre): void;
  frotar(obj: THREE.Object3D, fn: (hit: THREE.Intersection, px: number) => void): void;
  /** Deja de responder a toques (ya no tapa lo de atrás). */
  quitarToque(obj: THREE.Object3D): void;
  /** Cuando se usa `item` del inventario sobre `obj`. */
  usar(obj: THREE.Object3D, item: string, fn: () => void): void;
  /** La cerradura de la puerta se abre con este objeto del inventario. */
  conLlave(item?: string): void;
  gesto: {
    toque(fn: (x: number, y: number, obj: THREE.Object3D | null) => void): void;
    deslizar(fn: (dir: Dir, vel: number, obj: THREE.Object3D | null, dx: number, dy: number) => void): void;
    trazo(fn: (puntos: PuntoTrazo[]) => void): void;
    mover(fn: (x: number, y: number, abajo: boolean) => void): void;
    dedos(fn: (n: number, objs: (THREE.Object3D | null)[]) => void): void;
    pellizco(fn: (escala: number) => void): void;
    giro(fn: (delta: number) => void): void;
  };
  sensor: {
    sacudida(fn: () => void): void;
    volteo(fn: () => void): void;
    pantalla(fn: (ms: number) => void): void;
    soplido(fn: () => void): void;
  };
  /** Punto del mundo bajo (x, y) de la pantalla sobre un plano. */
  enPlano(x: number, y: number, plano: THREE.Plane): THREE.Vector3 | null;
  /** Guarda un objeto en el inventario (vuela desde `desde` si se da). */
  dar(item: string, desde?: THREE.Object3D): void;
  tiene(item: string): boolean;
  cada(fn: (dt: number, t: number) => void): void;
  despues(ms: number, fn: () => void): void;
  /** Acerca la cámara a un objeto; aparece el botón de volver. */
  enfocar(obj: THREE.Object3D | THREE.Vector3, distancia?: number): Promise<void>;
  volver(): Promise<void>;
  /** Algo salió bien (sonido y el narrador sonríe). */
  bien(): void;
  /** Intento fallido (cuenta para los ánimos). */
  mal(): void;
  /** El acertijo está resuelto: se abre la puerta. */
  resolver(): void;
  /** Se llama al salir de la puerta (quitar micrófono, temporizadores propios...). */
  alSalir(fn: () => void): void;
  /** Aviso corto y amable (no es del narrador): «Sostén el celular quieto». */
  aviso(texto: string, ms?: number): void;
  /** Marca algo como importante (una pista pintada, unas estrellas): ni el desorden ni la decoración lo tapan.
   *  Lo que se toca o se arrastra y los letreros pintados ya cuentan solos. */
  proteger(obj: THREE.Object3D): void;
}

export interface Probador {
  obj(nombre: string): THREE.Object3D;
  tocar(o: string | THREE.Object3D, veces?: number, cada?: number): Promise<void>;
  mantener(o: string | THREE.Object3D, ms: number): Promise<void>;
  arrastrar(o: string | THREE.Object3D, hacia: string | THREE.Object3D | THREE.Vector3, pasos?: number): Promise<void>;
  /** Arrastra de un punto del mundo a otro (sin importar qué objeto haya ahí). */
  arrastrarDesde(desde: THREE.Vector3, hacia: THREE.Vector3, pasos?: number): Promise<void>;
  deslizar(dir: Dir, desde?: string | THREE.Object3D, px?: number): Promise<void>;
  frotar(o: string | THREE.Object3D, pasadas?: number): Promise<void>;
  /** Trazo por puntos de pantalla en fracciones (0..1). */
  trazar(puntos: [number, number][], ms?: number): Promise<void>;
  /** Como trazar, pero un movimiento por cuadro (como un dedo de verdad en el celular). */
  trazarPorCuadro(puntos: [number, number][]): Promise<void>;
  dedos(objs: (string | THREE.Object3D)[], ms: number): Promise<void>;
  pellizcar(escala: number): Promise<void>;
  girar(angulo: number): Promise<void>;
  usar(item: string, o: string | THREE.Object3D): Promise<void>;
  /** Escribe en el panel abierto (candado de ruedas o teclado). */
  panel(valor: string): Promise<void>;
  cerrarPanel(): Promise<void>;
  sensor: Sensores['simular'];
  esperar(ms: number): Promise<void>;
  esperarQue(fn: () => boolean, ms?: number): Promise<void>;
  pantalla(o: string | THREE.Object3D): { x: number; y: number };
}

export interface Nivel {
  titulo: string;
  /** Las pistas que da el narrador a cambio de un dulce: 1 un empujoncito, 2 más clara, 3 la grande (nunca la
   *  respuesta: ni la clave ni el orden exacto). */
  pistas: [string, string, string];
  /** Las cosas regadas por el cuarto (por defecto 9–12 del capítulo; `nada` si cualquier toque cuenta). */
  desorden?: OpDesorden;
  /** En pareja, puerta repartida (como en los juegos de escape cooperativos): uno ve la pista (estos objetos, por
   *  nombre) y el otro tiene el candado; se turnan de una puerta a otra y se cuentan lo que ven con una notica. */
  pareja?: { pista?: string[]; aviso?: string };
  montar(c: Ctx): void | Promise<void>;
  prueba(p: Probador): Promise<void>;
}
