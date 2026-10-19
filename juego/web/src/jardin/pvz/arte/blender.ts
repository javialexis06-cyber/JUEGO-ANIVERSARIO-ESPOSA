// Personajes modelados y renderizados en Blender (personajes/blender/pvz_sprites.py → pvz_atlas.py →
// public/jardin/pvz). Cada uno trae su hoja webp con las piezas y un json con el marco, el ancla, los pivotes y los
// puntos. La animación es la misma del dibujo SVG con el mismo id (las piezas se llaman igual), así que al cargarlos
// reemplazan a los SVG sin tocar la vista. Si algo falla, quedan los SVG.
import { DEF_ARTE, registrarArte } from './index';
import type { DefPersonaje, DefPieza, ImagenPieza } from './piezas';

interface RecorteJson {
  rect: [number, number, number, number];
  pos: [number, number];
}

interface PiezaJson extends RecorteJson {
  id: string;
  z: number;
  padre?: string;
  pivote: [number, number];
  sinTinte?: boolean;
  estados?: Record<string, RecorteJson>;
}

/** Pieza del dibujo SVG que se conserva encima del render (brillos, efectos): se lleva del marco del SVG al de Blender
 * alineando las anclas (o el punto `alinear` de los dos), con un corrimiento y una escala opcionales. */
interface ConservarJson {
  id: string;
  alinear?: string;
  dx?: number;
  dy?: number;
  escala?: number;
  padre?: string;
  z?: number;
}

interface PersonajeJson {
  id: string;
  conservar?: (string | ConservarJson)[];
  hoja: string;
  escala: number;
  ancho: number;
  alto: number;
  ancla: [number, number];
  puntos: Record<string, [number, number]>;
  piezas: PiezaJson[];
}

let cargando: Promise<string[]> | null = null;

/** Lee el índice y registra todos los personajes de Blender. Devuelve los ids cargados (nunca rechaza). */
export function cargarArteBlender(base = './jardin/pvz/'): Promise<string[]> {
  cargando ??= (async () => {
    try {
      const r = await fetch(base + 'indice.json');
      if (!r.ok) return [];
      const indice = (await r.json()) as { personajes?: string[] };
      const ids = (indice.personajes ?? []).filter((x) => typeof x === 'string');
      const defs = await Promise.all(
        ids.map(async (id) => {
          try {
            const q = await fetch(base + id + '.json');
            return q.ok ? ((await q.json()) as PersonajeJson) : null;
          } catch {
            return null;
          }
        }),
      );
      const listos: string[] = [];
      for (const d of defs) {
        if (!d) continue;
        registrarArte(desdeBlender(d, base));
        listos.push(d.id);
      }
      return listos;
    } catch {
      return [];
    }
  })();
  return cargando;
}

function desdeBlender(d: PersonajeJson, base: string): DefPersonaje {
  const svg = DEF_ARTE[d.id];
  const hoja = base + d.hoja;
  const imagen = (r: RecorteJson): ImagenPieza => ({ hoja, rect: r.rect, pos: r.pos, escala: d.escala });
  const piezas: DefPieza[] = d.piezas.map((p) => ({
    id: p.id,
    svg: '',
    pivote: p.pivote,
    padre: p.padre,
    z: p.z,
    sinTinte: p.sinTinte,
    img: imagen(p),
    // `estados` solo marca qué variantes existen (el dibujo sale de imgEstados).
    estados: p.estados ? Object.fromEntries(Object.keys(p.estados).map((k) => [k, ''])) : undefined,
    imgEstados: p.estados ? Object.fromEntries(Object.entries(p.estados).map(([k, r]) => [k, imagen(r)])) : undefined,
  }));
  for (const c of d.conservar ?? []) {
    const o: ConservarJson = typeof c === 'string' ? { id: c } : c;
    const ps = svg?.piezas.find((q) => q.id === o.id);
    if (!svg || !ps) continue;
    const k = o.escala ?? 1;
    const destino = (o.alinear && d.puntos[o.alinear]) || d.ancla;
    const [ax, ay] = (o.alinear && svg.puntos?.[o.alinear]) || svg.ancla;
    const tx = destino[0] + (o.dx ?? 0);
    const ty = destino[1] + (o.dy ?? 0);
    const llevar = (f: string): string => `<g transform="translate(${tx} ${ty}) scale(${k}) translate(${-ax} ${-ay})">${f}</g>`;
    piezas.push({
      ...ps,
      svg: llevar(ps.svg),
      pivote: [tx + (ps.pivote[0] - ax) * k, ty + (ps.pivote[1] - ay) * k],
      padre: o.padre ?? ps.padre,
      z: o.z ?? ps.z,
      estados: ps.estados ? Object.fromEntries(Object.entries(ps.estados).map(([v, f]) => [v, llevar(f)])) : undefined,
    });
  }
  return {
    ...(svg ?? { anim: () => ({}) }),
    id: d.id,
    ancho: d.ancho,
    alto: d.alto,
    ancla: d.ancla,
    puntos: { ...(svg?.puntos ?? {}), ...d.puntos },
    piezas,
  };
}

// Escenarios renderizados en Blender (personajes/blender/pvz_fondos.py): una imagen por variante de filas con pasto,
// del mismo tamaño que el mundo (x de X_MIN a X_MAX, y de 0 a ALTO_MUNDO). Si falta, la vista usa el dibujo SVG.
const FONDOS: Record<string, string> = { '0,1,2,3,4': 'fondo-dia-todas', '1,2,3': 'fondo-dia-tres', '2': 'fondo-dia-una' };
const pedidos = new Map<string, Promise<HTMLImageElement | null>>();
const fondosListos = new Map<string, HTMLImageElement>();

function nombreFondo(filas: readonly number[]): string | undefined {
  return FONDOS[[...filas].sort((a, b) => a - b).join(',')];
}

/** Carga el escenario de día para esas filas con pasto (nunca rechaza; null si no hay o falla). */
export function cargarFondoBlender(filas: readonly number[], base = './jardin/pvz/'): Promise<HTMLImageElement | null> {
  const nombre = nombreFondo(filas);
  if (!nombre) return Promise.resolve(null);
  let p = pedidos.get(nombre);
  if (!p) {
    p = new Promise((listo) => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => {
        fondosListos.set(nombre, im);
        listo(im);
      };
      im.onerror = () => listo(null);
      im.src = base + nombre + '.webp';
    });
    pedidos.set(nombre, p);
  }
  return p;
}

/** El escenario ya cargado para esas filas, o null (y lo pide para el siguiente cuadro). */
export function fondoBlender(filas: readonly number[]): HTMLImageElement | null {
  const nombre = nombreFondo(filas);
  if (!nombre) return null;
  const im = fondosListos.get(nombre);
  if (!im) void cargarFondoBlender(filas);
  return im ?? null;
}

export function liberarFondosBlender(): void {
  pedidos.clear();
  fondosListos.clear();
}
