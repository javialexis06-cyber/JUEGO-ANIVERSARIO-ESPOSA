// Lo que viaja entre el anfitrión (que simula) y los invitados (espejos): la «foto» del mundo comprimida en enteros
// de 16 bits (posiciones al centímetro), los sucesos para los efectos y los sonidos, y el estado completo de cada
// jugador (armas, objetos, reliquias…) para el HUD, la Forja y los premios.
import { ArmaJ, type Jugador, type ResumenJugador } from '../sim/jugador';
import { S, type Sucesos } from '../sim/estado';
import type { Eleccion, Stats } from '../tipos';

// ------------------------------------------------------------------------------------------------- base64
export function aB64(a: ArrayBufferView): string {
  const b = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}
export function deB64(s: string): ArrayBuffer {
  const t = atob(s);
  const b = new Uint8Array(t.length);
  for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i);
  return b.buffer;
}

export const q = (v: number, k = 100) => Math.max(-32768, Math.min(32767, Math.round(v * k)));

// ------------------------------------------------------------------------------------------------- Jugador completo
export interface DatosJugador {
  nivel: number;
  xp: number;
  hp: number;
  estado: number;
  armas: { id: string; nivel: number; xp: number; sc: string[]; pedidas: number; dano: number }[];
  dones: Record<string, number>;
  extra: Stats;
  extraEtq: Record<string, number>;
  objetos: string[];
  equipo: Record<string, string>;
  reliquias: string[];
  bendiciones: Record<string, number>;
  milagros: string[];
  oro: number;
  hierro: number;
  sangre: number;
  oroS: number;
  hierroS: number;
  sangreS: number;
  tiradas: number;
  vetos: number;
  vetadas: string[];
  usados: Record<string, number>;
  resumen: ResumenJugador;
  m: Record<string, number>;
  cola: Eleccion[];
}

export function serializarJugador(j: Jugador): DatosJugador {
  return {
    nivel: j.nivel, xp: j.xp, hp: j.hp, estado: j.estado,
    armas: j.armas.map((a) => ({ id: a.id, nivel: a.nivel, xp: a.xp, sc: [...a.sobrecargas], pedidas: a.pedidas, dano: a.danoTotal })),
    dones: { ...j.dones }, extra: { ...j.extra }, extraEtq: { ...(j.extraEtq as Record<string, number>) }, objetos: [...j.objetos],
    equipo: { ...(j.equipo as Record<string, string>) }, reliquias: [...j.reliquias], bendiciones: { ...j.bendiciones }, milagros: [...j.milagros],
    oro: j.oro, hierro: j.hierro, sangre: j.sangre, oroS: j.oroSeguro, hierroS: j.hierroSeguro, sangreS: j.sangreSeguro,
    tiradas: j.tiradas, vetos: j.vetos, vetadas: [...j.vetadas], usados: { ...j.usados }, resumen: { ...j.resumen }, m: { ...j.m }, cola: j.cola.slice(0, 6),
  };
}

/** Pone en un jugador lo que mandó el otro aparato (y recalcula sus estadísticas). */
export function aplicarJugador(j: Jugador, d: DatosJugador, conCola = true) {
  j.nivel = d.nivel;
  j.xp = d.xp;
  j.hp = d.hp;
  j.estado = d.estado;
  const viejas = new Map(j.armas.map((a) => [a.id, a]));
  j.armas = d.armas.map((x) => {
    const a = viejas.get(x.id) ?? new ArmaJ(x.id);
    a.nivel = x.nivel;
    a.xp = x.xp;
    a.sobrecargas = [...x.sc];
    a.pedidas = x.pedidas;
    a.danoTotal = x.dano;
    a.sucio = true;
    return a;
  });
  j.dones = { ...d.dones };
  j.extra = { ...d.extra };
  j.extraEtq = { ...d.extraEtq } as typeof j.extraEtq;
  j.objetos = [...d.objetos];
  j.equipo = { ...d.equipo } as typeof j.equipo;
  j.reliquias = [...d.reliquias];
  j.bendiciones = { ...d.bendiciones };
  j.milagros = [...d.milagros];
  j.oro = d.oro;
  j.hierro = d.hierro;
  j.sangre = d.sangre;
  j.oroSeguro = d.oroS;
  j.hierroSeguro = d.hierroS;
  j.sangreSeguro = d.sangreS;
  j.tiradas = d.tiradas;
  j.vetos = d.vetos;
  j.vetadas = [...d.vetadas];
  j.usados = { ...d.usados };
  j.resumen = { ...d.resumen };
  j.m = { ...d.m };
  if (conCola) j.cola = d.cola.map((e) => ({ ...e, opciones: [...e.opciones] }));
  j.recalcular();
  j.hp = Math.min(d.hp, j.hpMax);
}

// ------------------------------------------------------------------------------------------------- Sucesos que viajan
/** Los sucesos que importan para el dibujo y el sonido de los demás (los demás se quedan en el anfitrión). */
const VIAJAN = new Set<number>([
  S.GOLPE, S.MUERTE, S.TAJO, S.ESTOCADA, S.CONO, S.ONDA, S.RAYO, S.CADENA, S.EXPLOSION, S.EXCAVA, S.ROTO, S.RECOGE, S.NIVEL, S.HERIDO,
  S.BLOQUEO, S.CAIDO, S.LEVANTA, S.HABILIDAD, S.DISPARO_E, S.APARECE, S.AVISO, S.CURA, S.ESQUIVA, S.REACCION, S.EVOLUCION, S.CONDENA,
  S.EJECUTA, S.JEFE, S.CAMPANA, S.ESPIGA, S.SALTO, S.INVOCA, S.SOBRECARGA, S.MARCA, S.LIBERA,
]);
const POCO_IMPORTA = new Set<number>([S.GOLPE, S.EXCAVA, S.APARECE, S.CURA, S.RECOGE]);

/** Junta los sucesos de varios pasos (hasta `max`, soltando primero los que menos importan). */
export class Buzon {
  d: Float32Array;
  n = 0;
  constructor(private max = 220) {
    this.d = new Float32Array(max * 7);
  }
  meter(s: Sucesos) {
    for (let k = 0; k < s.n; k++) {
      const t = s.d[k * 7];
      if (!VIAJAN.has(t)) continue;
      if (this.n >= this.max) return;
      // Si se está llenando, solo lo importante
      if (this.n > this.max * 0.6 && POCO_IMPORTA.has(t) && !(t === S.GOLPE && s.d[k * 7 + 4] > 0)) continue;
      this.d.set(s.d.subarray(k * 7, k * 7 + 7), this.n * 7);
      this.n++;
    }
  }
  sacar(): string {
    const r = aB64(this.d.subarray(0, this.n * 7));
    this.n = 0;
    return r;
  }
}

// ------------------------------------------------------------------------------------------------- La foto
/** Estado ligero de cada jugador (en cada foto). */
export type LuzJugador = [
  x: number, y: number, vx: number, vy: number, fx: number, fy: number, hp: number, hpMax: number, estado: number, nivel: number, xp: number,
  oro: number, hierro: number, sangre: number, habT: number, habActiva: number, invisible: number, levantar: number, caidoT: number,
  excavando: number, hpCelda: number, forzado: number, invul: number,
];

export interface Foto {
  /** Número de foto (para descartar las viejas). */
  n: number;
  etapa: number;
  t: number;
  lim: number;
  fase: 'juego' | 'extraccion' | 'jefe';
  obj: { tipo: string; meta: number; prog: number; hecho: boolean; fallo: boolean; texto: string };
  sec: { tipo: string; meta: number; prog: number };
  jefe: number;
  jefeFase: number;
  ecl: number;
  J: LuzJugador[];
  /** Enemigos: 12 enteros cada uno. */
  e: string;
  /** Proyectiles: 9 enteros cada uno. */
  p: string;
  /** Recogibles: 5 enteros cada uno. */
  r: string;
  /** Aliados: 8 enteros cada uno. */
  a: string;
  z: number[][];
  ent: (number | string)[][];
  s: string;
}

export const TAM_E = 12;
export const TAM_P = 9;
export const TAM_R = 5;
export const TAM_A = 8;

/** Mensajes. */
export const MSJ = {
  FOTO: 'sg:foto',
  DETALLE: 'sg:detalle',
  CELDAS: 'sg:celdas',
  MANDO: 'sg:mando',
  ELECCION: 'sg:eleccion',
  ESCOGER: 'sg:escoger',
  ETAPA: 'sg:etapa',
  ETAPA_LISTA: 'sg:etapa-lista',
  FIN_ETAPA: 'sg:fin-etapa',
  FORJA_LISTA: 'sg:forja-lista',
  PAUSA: 'sg:pausa',
  SALIR: 'sg:salir',
} as const;
