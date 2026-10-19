// Progreso de «Plantas contra Zombis: La Semilla Madre». Clave propia (pvz-v1, o amigo-pvz-v1 en la versión de
// amigos); los patios clásicos conservan su jardin-v1 aparte y nunca se tocan. Todo se normaliza al leer: un dato
// raro no rompe la partida ni borra lo demás.
import { NIVELES, PLANTA_INICIAL } from './datos/niveles';
import { RANURAS_INICIALES } from './motor/reglas';

export interface Ajustes {
  efectos: boolean;
  musica: boolean;
  /** Recoger soles y monedas con solo pasar el dedo (por defecto, tocarlos como en PvZ). */
  recogerAlPasar: boolean;
}

export interface ProgresoPvZ {
  v: 1;
  /** Niveles de la aventura ganados al menos una vez. */
  completados: string[];
  /** Plantas desbloqueadas (incluye la inicial). */
  plantas: string[];
  /** Objetos ganados: pala, abono, almanaque, llaves-tienda, mapa-1… */
  objetos: string[];
  /** Monedas del jardín (solo de este juego; no son las de la casa). */
  dinero: number;
  ranuras: number;
  /** Compras de la tienda de Dave (ids). */
  compras: string[];
  /** Escenas ya vistas (prólogo, diálogos de cada nivel, intermedios) para no repetirlas. */
  vistos: string[];
  ajustes: Ajustes;
}

const IDS_NIVELES = new Set(NIVELES.map((n) => n.id));

export function progresoNuevo(): ProgresoPvZ {
  return {
    v: 1, completados: [], plantas: [PLANTA_INICIAL], objetos: [], dinero: 0, ranuras: RANURAS_INICIALES, compras: [], vistos: [],
    ajustes: { efectos: true, musica: true, recogerAlPasar: false },
  };
}

const textos = (x: unknown, max = 400): string[] =>
  Array.isArray(x) ? [...new Set(x.filter((v): v is string => typeof v === 'string' && v.length > 0 && v.length < 60))].slice(0, max) : [];

/** Normaliza un progreso leído (de una versión vieja o editado a mano). */
export function normalizar(x: unknown): ProgresoPvZ {
  const p = progresoNuevo();
  if (!x || typeof x !== 'object') return p;
  const o = x as Record<string, unknown>;
  p.completados = textos(o.completados).filter((id) => IDS_NIVELES.has(id) || /^\d+-\d+$/.test(id));
  p.plantas = textos(o.plantas);
  if (!p.plantas.includes(PLANTA_INICIAL)) p.plantas.unshift(PLANTA_INICIAL);
  p.objetos = textos(o.objetos);
  p.compras = textos(o.compras);
  p.vistos = textos(o.vistos, 1000);
  p.dinero = Number.isFinite(o.dinero) ? Math.max(0, Math.min(999990, Math.floor(o.dinero as number))) : 0;
  p.ranuras = Number.isInteger(o.ranuras) ? Math.max(RANURAS_INICIALES, Math.min(10, o.ranuras as number)) : RANURAS_INICIALES;
  const a = (o.ajustes ?? {}) as Record<string, unknown>;
  p.ajustes = { efectos: a.efectos !== false, musica: a.musica !== false, recogerAlPasar: a.recogerAlPasar === true };
  return p;
}

export class Guardado {
  progreso: ProgresoPvZ;
  /** Hay un cambio sin guardar porque falló la escritura (la interfaz ofrece reintentar). */
  pendiente = false;

  constructor(readonly clave: string) {
    let leido: unknown = null;
    try {
      leido = JSON.parse(localStorage.getItem(clave) ?? 'null');
    } catch {
      leido = null;
    }
    this.progreso = normalizar(leido);
  }

  guardar(): boolean {
    try {
      localStorage.setItem(this.clave, JSON.stringify(this.progreso));
      this.pendiente = false;
      return true;
    } catch {
      this.pendiente = true;
      return false;
    }
  }

  /** Nivel que toca jugar: el primero sin completar en el orden de la aventura (o el último construido). */
  nivelActual(): string {
    const hecho = new Set(this.progreso.completados);
    return NIVELES.find((n) => !hecho.has(n.id))?.id ?? NIVELES[NIVELES.length - 1].id;
  }

  /** Un nivel se puede jugar si ya se ganó o es el siguiente. */
  disponible(id: string): boolean {
    return this.progreso.completados.includes(id) || this.nivelActual() === id;
  }

  tiene(objeto: string): boolean {
    return this.progreso.objetos.includes(objeto);
  }

  visto(clave: string): boolean {
    return this.progreso.vistos.includes(clave);
  }

  marcarVisto(clave: string): void {
    if (!this.visto(clave)) this.progreso.vistos.push(clave);
  }
}
