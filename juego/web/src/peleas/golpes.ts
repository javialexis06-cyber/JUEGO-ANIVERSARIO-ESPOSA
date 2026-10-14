// Los golpes de todos: una base común (rápido en cadena de tres, fuerte, barrida, gancho, los del aire y el agarre)
// que cada luchador ajusta a su estilo (más alcance, más fuerza, más rapidez), y los especiales y las súper, que son
// de cada uno. Cuadros a 60 por segundo; cajas en metros hacia donde mira quien pega.
import type { Efecto, Golpe, IdGolpe } from './tipos';

export interface AjusteKit {
  /** Multiplica el daño de todos los normales. */
  fuerza?: number;
  /** Multiplica el alcance (brazos y piernas más largos). */
  alcance?: number;
  /** Suma cuadros al arranque y a la recuperación (positivo = más lento). */
  lentitud?: number;
  efecto?: Efecto;
  /** Golpes que aguantan los normales fuertes (pesados). */
  armadura?: number;
}

const k = (g: Golpe, a: AjusteKit): Golpe => {
  const f = a.fuerza ?? 1, r = a.alcance ?? 1, l = a.lentitud ?? 0;
  const [x0, x1, y0, y1] = g.caja;
  return {
    ...g,
    dano: Math.round(g.dano * f),
    caja: [x0, +(x0 + (x1 - x0) * r).toFixed(2), y0, y1],
    arranque: Math.max(3, g.arranque + Math.round(l * (g.peso === 'leve' ? 0.5 : 1))),
    recup: Math.max(5, g.recup + l),
    efecto: g.efecto ?? a.efecto,
  };
};

/** Los normales de todos (sin especial ni súper), ajustados al estilo de cada luchador. */
export function normales(a: AjusteKit = {}): Omit<Record<IdGolpe, Golpe>, 'especial' | 'super'> {
  const g: Omit<Record<IdGolpe, Golpe>, 'especial' | 'super'> = {
    rapido1: {
      id: 'rapido1', pose: 'jab', poseCarga: 'jab_carga', arranque: 4, activo: 3, recup: 9, dano: 32, nivel: 'alto', caja: [0.35, 1.05, 0.95, 1.5],
      aturde: 15, bloqueo: 11, empuje: 1.4, cancela: ['rapido2', 'fuerte', 'fuerteAbajo', 'fuerteArriba', 'especial', 'super'], peso: 'leve',
    },
    rapido2: {
      id: 'rapido2', pose: 'cruzado', poseCarga: 'cruzado_carga', arranque: 5, activo: 3, recup: 11, dano: 36, nivel: 'alto', caja: [0.35, 1.15, 0.9, 1.5],
      aturde: 17, bloqueo: 12, empuje: 1.8, avance: 1.2, cancela: ['rapido3', 'fuerte', 'fuerteArriba', 'especial', 'super'], peso: 'leve',
    },
    rapido3: {
      id: 'rapido3', pose: 'patada', poseCarga: 'patada_carga', arranque: 7, activo: 4, recup: 17, dano: 58, nivel: 'medio', caja: [0.3, 1.35, 0.55, 1.35],
      aturde: 22, bloqueo: 14, empuje: 5.5, lanza: 4.5, avance: 1.8, cancela: ['especial', 'super'], peso: 'medio',
    },
    rapidoAbajo: {
      id: 'rapidoAbajo', pose: 'jab_bajo', poseCarga: 'agachado', arranque: 4, activo: 3, recup: 9, dano: 26, nivel: 'bajo', caja: [0.3, 1.05, 0.05, 0.7],
      aturde: 14, bloqueo: 10, empuje: 1.4, cancela: ['rapidoAbajo', 'fuerteAbajo', 'especial', 'super'], peso: 'leve',
    },
    fuerte: {
      id: 'fuerte', pose: 'fuerte', poseCarga: 'fuerte_carga', arranque: 10, activo: 4, recup: 19, dano: 82, nivel: 'medio', caja: [0.35, 1.4, 0.75, 1.55],
      aturde: 24, bloqueo: 16, empuje: 7, avance: 2.4, cancela: ['especial', 'super'], peso: 'fuerte', armadura: a.armadura,
    },
    fuerteAbajo: {
      id: 'fuerteAbajo', pose: 'barrida', poseCarga: 'barrida_carga', arranque: 8, activo: 5, recup: 21, dano: 62, nivel: 'bajo', caja: [0.3, 1.5, 0.0, 0.45],
      aturde: 22, bloqueo: 14, empuje: 3, derriba: true, avance: 1.5, cancela: ['super'], peso: 'medio',
    },
    fuerteArriba: {
      id: 'fuerteArriba', pose: 'gancho', poseCarga: 'gancho_carga', arranque: 7, activo: 5, recup: 22, dano: 70, nivel: 'medio', caja: [0.15, 1.05, 0.9, 2.4],
      aturde: 26, bloqueo: 15, empuje: 1.5, lanza: 11.5, invul: 5, cancela: ['super'], peso: 'fuerte',
    },
    aereo: {
      id: 'aereo', pose: 'aereo', poseCarga: 'aire', arranque: 4, activo: 7, recup: 8, dano: 42, nivel: 'aereo', caja: [0.15, 1.1, 0.0, 1.0],
      aturde: 17, bloqueo: 12, empuje: 2.5, cancela: ['aereoFuerte'], peso: 'leve',
    },
    aereoFuerte: {
      id: 'aereoFuerte', pose: 'aereo_fuerte', poseCarga: 'aereo_fuerte_carga', arranque: 7, activo: 6, recup: 12, dano: 72, nivel: 'aereo', caja: [0.0, 1.2, -0.3, 0.9],
      aturde: 22, bloqueo: 15, empuje: 4, lanza: -6, peso: 'fuerte',
    },
    agarre: {
      id: 'agarre', pose: 'agarrar', poseCarga: 'agarrar_carga', arranque: 5, activo: 3, recup: 26, dano: 115, nivel: 'medio', caja: [0.2, 0.95, 0.3, 1.5],
      aturde: 0, bloqueo: 0, empuje: 7, lanza: 6, derriba: true, agarre: true, peso: 'fuerte',
    },
  };
  for (const id of Object.keys(g) as (keyof typeof g)[]) g[id] = id === 'agarre' ? { ...g[id], dano: Math.round(g[id].dano * (a.fuerza ?? 1)) } : k(g[id], a);
  return g;
}

// ------------------------------------------------------------------------------------------------ Especiales

/** Un proyectil (corazón, chispa, estrella…) que sale de las manos. */
export function proyectil(nombre: string, efecto: Efecto, o: { dano?: number; vel?: number; arranque?: number; recup?: number; vy?: number; alto?: number } = {}): Golpe {
  return {
    id: 'especial', nombre, especial: 'proyectil', pose: 'lanzar', poseCarga: 'lanzar_carga', arranque: o.arranque ?? 12, activo: 2, recup: o.recup ?? 30,
    dano: o.dano ?? 55, nivel: 'medio', caja: [0, 0, 0, 0], aturde: 20, bloqueo: 14, empuje: 3.5, chip: 0.12, efecto, peso: 'medio',
    proy: { vel: o.vel ?? 7.5, vy: o.vy ?? 0, vida: 130, radio: 0.32, alto: o.alto ?? 1.2 }, cancela: ['super'],
  };
}

/** Embestida: sale disparado hacia adelante pegando (con armadura si es pesado). */
export function embestida(nombre: string, efecto: Efecto, o: { dano?: number; vel?: number; activo?: number; armadura?: number; lanza?: number } = {}): Golpe {
  return {
    id: 'especial', nombre, especial: 'embestida', pose: 'embestida', poseCarga: 'embestida_carga', arranque: 11, activo: o.activo ?? 18, recup: 20,
    dano: o.dano ?? 88, nivel: 'medio', caja: [0.1, 1.0, 0.4, 1.6], aturde: 24, bloqueo: 16, empuje: 8, lanza: o.lanza ?? 6, avance: o.vel ?? 9,
    armadura: o.armadura, chip: 0.12, efecto, peso: 'fuerte', cancela: ['super'],
  };
}

export function voladora(nombre: string, efecto: Efecto): Golpe {
  return {
    id: 'especial', nombre, especial: 'voladora', pose: 'voladora', poseCarga: 'preparar', arranque: 8, activo: 22, recup: 12, dano: 78, nivel: 'aereo',
    caja: [0.1, 1.15, 0.2, 1.3], aturde: 22, bloqueo: 15, empuje: 6.5, lanza: 5, chip: 0.12, efecto, peso: 'fuerte', proy: { vel: 7.5, vy: 8.5 }, cancela: ['super'],
  };
}

export function contra(nombre: string, efecto: Efecto): Golpe {
  return {
    id: 'especial', nombre, especial: 'contra', pose: 'contra', poseCarga: 'contra', arranque: 3, activo: 30, recup: 18, dano: 95, nivel: 'medio',
    caja: [0, 1.2, 0.3, 1.7], aturde: 30, bloqueo: 0, empuje: 6, lanza: 7, efecto, peso: 'fuerte', marea: 0, cancela: ['super'],
  };
}

export function cuerda(nombre: string, efecto: Efecto): Golpe {
  return {
    id: 'especial', nombre, especial: 'cuerda', pose: 'lanzar', poseCarga: 'cuerda_carga', arranque: 10, activo: 14, recup: 26, dano: 100, nivel: 'medio',
    caja: [0.4, 3.8, 0.5, 1.6], aturde: 0, bloqueo: 0, empuje: 6, lanza: 7, derriba: true, agarre: true, efecto, peso: 'fuerte', proy: { alcance: 3.8 },
  };
}

export function niebla(nombre: string, efecto: Efecto): Golpe {
  return {
    id: 'especial', nombre, especial: 'niebla', pose: 'niebla', poseCarga: 'niebla', arranque: 12, activo: 2, recup: 10, dano: 0, nivel: 'medio',
    caja: [0, 0, 0, 0], aturde: 0, bloqueo: 0, empuje: 0, invul: 24, efecto, peso: 'leve', cancela: ['rapido1', 'fuerte', 'super'],
  };
}

export function trampa(nombre: string, efecto: Efecto): Golpe {
  return {
    id: 'especial', nombre, especial: 'trampa', pose: 'poner', poseCarga: 'poner_carga', arranque: 14, activo: 2, recup: 18, dano: 55, nivel: 'bajo',
    caja: [0, 0, 0, 0], aturde: 0, bloqueo: 0, empuje: 1.5, lanza: 4, marea: 55, efecto, peso: 'medio', proy: { vida: 480, radio: 0.45, alcance: 2.4 },
  };
}

export function aliento(nombre: string, efecto: Efecto): Golpe {
  return {
    id: 'especial', nombre, especial: 'fuego', pose: 'aliento', poseCarga: 'aliento_carga', arranque: 10, activo: 24, recup: 18, dano: 22, nivel: 'medio',
    caja: [0.3, 2.1, 0.6, 1.6], aturde: 14, bloqueo: 10, empuje: 1.2, cada: 6, chip: 0.2, efecto, peso: 'leve', cancela: ['super'],
  };
}

// ------------------------------------------------------------------------------------------------ Súper

/** Ráfaga: se lanza encima y, si lo alcanza, una lluvia de golpes que termina mandándolo a volar. */
export function rafaga(nombre: string, efecto: Efecto, dano = 300): Golpe {
  return {
    id: 'super', nombre, superTipo: 'rafaga', pose: 'embestida', poseCarga: 'super_carga', arranque: 6, activo: 20, recup: 26, dano, nivel: 'medio',
    caja: [0.1, 1.1, 0.2, 1.7], aturde: 40, bloqueo: 18, empuje: 9, lanza: 9, avance: 11, invul: 10, chip: 0.2, efecto, peso: 'fuerte', proy: { golpes: 8 },
  };
}

/** Rayo: un chorro de luz (o de fuego) que cruza el escenario. */
export function rayo(nombre: string, efecto: Efecto, dano = 280): Golpe {
  return {
    id: 'super', nombre, superTipo: 'rayo', pose: 'rayo', poseCarga: 'super_carga', arranque: 8, activo: 50, recup: 24, dano, nivel: 'medio',
    caja: [0.6, 13, 0.45, 1.65], aturde: 26, bloqueo: 12, empuje: 1.6, lanza: 7, invul: 8, chip: 0.25, efecto, peso: 'fuerte', cada: 5, proy: { golpes: 10 },
  };
}

/** Lluvia: cosas que caen del cielo encima del otro (lirios, murciélagos, estrellas, porcelana). */
export function lluvia(nombre: string, efecto: Efecto, dano = 270, marea = 0): Golpe {
  return {
    id: 'super', nombre, superTipo: 'lluvia', pose: 'invocar', poseCarga: 'super_carga', arranque: 10, activo: 70, recup: 20, dano, nivel: 'aereo',
    caja: [0, 0, 0, 0], aturde: 22, bloqueo: 12, empuje: 1.5, lanza: 3, invul: 10, chip: 0.2, efecto, peso: 'medio', marea, proy: { golpes: 10, radio: 0.42 },
  };
}

/** Ola: una avalancha que corre por el piso (hay que saltarla). */
export function ola(nombre: string, efecto: Efecto, dano = 270): Golpe {
  return {
    id: 'super', nombre, superTipo: 'ola', pose: 'pisoton', poseCarga: 'super_carga', arranque: 12, activo: 3, recup: 30, dano, nivel: 'bajo',
    caja: [0, 0, 0, 0], aturde: 30, bloqueo: 16, empuje: 6, lanza: 8, derriba: true, invul: 12, chip: 0.25, efecto, peso: 'fuerte',
    proy: { vel: 8.5, vida: 140, golpes: 3, alto: 1.1, radio: 0.9 },
  };
}
