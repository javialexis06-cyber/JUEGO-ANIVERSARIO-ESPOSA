// Los efectos de sonido y los ambientes de la granja, hechos con ElevenLabs (public/sfx/granja/, los genera
// scripts/granja-v3/efectos-granja.mjs): herramientas, cuidados, la voz de cada especie, monedas, puertas, rutas y los
// ambientes (pájaros de día, grillos de noche, lluvia y mar). Solo sonido: no toca el motor. Si un efecto todavía no
// cargó (o no está), quien llama toca el sintetizado de siempre.
import { biomaZona, tiempoDia, tiempoRegion } from './clima';
import type { Accion, EstadoGranja } from './estado';

let ctx: AudioContext | null = null;
let salida: GainNode | null = null;
let lista: Record<string, [string, number]> = {};
let cargando: Promise<void> | null = null;
let silencio = false;
const buffers = new Map<string, AudioBuffer>();

function audio() {
  if (!ctx) {
    ctx = new AudioContext();
    salida = ctx.createGain();
    salida.gain.value = silencio ? 0 : 1;
    salida.connect(ctx.destination);
  }
  void ctx.resume().catch(() => {});
  return ctx;
}
async function decodificar(nombre: string) {
  const a = lista[nombre]?.[0];
  if (!a || buffers.has(nombre)) return;
  try {
    const b = await (await fetch(`./sfx/granja/${a}`)).arrayBuffer();
    buffers.set(nombre, await audio().decodeAudioData(b));
  } catch { /* sin ese efecto: suena el sintetizado */ }
}
/** Carga la lista y los efectos cortos (los ambientes, al pedirlos). */
function cargar() {
  cargando ??= fetch('./sfx/granja/lista.json')
    .then((r) => (r.ok ? r.json() : {}))
    .then(async (l: Record<string, [string, number]>) => {
      lista = l ?? {};
      await Promise.all(Object.keys(lista).filter((n) => !n.startsWith('ambiente')).map(decodificar));
    })
    .catch(() => {});
  return cargando;
}

/** El botón de audio de la granja también calla los efectos y los ambientes. */
export function silenciarGranja(si: boolean) {
  silencio = si;
  if (salida && ctx) salida.gain.setTargetAtTime(si ? 0 : 1, ctx.currentTime, 0.05);
}

/** Suena un efecto (con una pizca de variación de tono para que no canse). Devuelve false si no está todavía. */
export function efectoGranja(nombre: string | undefined, vol = 0.7, retraso = 0): boolean {
  void cargar();
  if (!nombre) return false;
  const b = buffers.get(nombre);
  if (!b) return false;
  if (silencio) return true;
  const c = audio();
  const f = c.createBufferSource();
  f.buffer = b;
  f.playbackRate.value = 0.95 + Math.random() * 0.1;
  const g = c.createGain();
  g.gain.value = vol;
  f.connect(g).connect(salida!);
  f.start(c.currentTime + retraso);
  return true;
}

/** Lo que suena al terminar bien cada acción (las herramientas suenan aparte, con su golpe). */
const POR_ACCION: Partial<Record<Accion['tipo'], string>> = {
  vender_pila: 'monedas', comprar: 'comprar', comprar_objeto: 'comprar', comprar_huevo_fertil: 'comprar', adoptar: 'comprar',
  produccion: 'fabricar', construir: 'construir', encargar_obra: 'construir', emplazar_obra: 'construir', construir_ascensor: 'construir',
  entrar: 'puerta', salir: 'puerta', entrar_vivienda: 'puerta', entrar_dormitorio: 'puerta', entrar_servicio: 'puerta', salir_servicio: 'puerta',
  viajar: 'ruta', entrar_aventura: 'ruta', salir_aventura: 'ruta', dormir: 'dormir', reclamar: 'cofre', recoger_drop: 'mochila',
  recoger_trufa: 'trufas', mejorar_herramienta: 'logro', ampliar_mochila: 'mochila', incubar: 'huevo', pescar: 'pez',
};
export function efectoAccion(a: Accion) {
  if (a.tipo === 'astra') {
    const t = (a as { accion?: { tipo?: string } }).accion?.tipo;
    efectoGranja(t === 'ruta' ? 'ruta' : t === 'vivienda' || t === 'salir_vivienda' ? 'puerta' : undefined, 0.6);
    return;
  }
  efectoGranja(POR_ACCION[a.tipo], 0.6);
}

/** Herramientas: el nombre del golpe según lo que se trabajó. */
const TRABAJO: Record<string, string> = {
  recoger: 'recoger', regar: 'regar', labrar: 'labrar', plantar: 'plantar', plantar_frutal: 'plantar', fertilizar: 'plantar',
  roca: 'roca', arbol: 'arbol', maleza: 'maleza', pasto: 'maleza', golpear: 'golpear', mina: 'mina', ruina: 'roca',
  recoger_frutal: 'recoger_frutal', limpiar: 'maleza', rellenar_hueco: 'labrar',
};
export const efectoTrabajo = (tipo: string) => efectoGranja(TRABAJO[tipo], 0.65);

/** La voz de cada especie (las fantasías suenan como su especie base). */
export const vozAnimal = (especie: string | undefined, retraso = 0.25) => efectoGranja(especie, 0.55, retraso);

// ------------------------------------------------------------------ ambientes

let ambiente: { nombre: string; src: AudioBufferSourceNode; g: GainNode } | null = null;
let pedido = '';
/** Ambiente en bucle con cruce suave (null: silencio, p. ej. adentro). */
export function ambienteGranja(nombre: string | null) {
  if ((nombre ?? '') === pedido) return;
  pedido = nombre ?? '';
  void cargar().then(async () => {
    if (pedido !== (nombre ?? '') || !ctx) return;
    const c = ctx;
    const viejo = ambiente;
    ambiente = null;
    if (viejo) {
      viejo.g.gain.setTargetAtTime(0, c.currentTime, 0.7);
      setTimeout(() => { try { viejo.src.stop(); } catch { /* ya paró */ } }, 4000);
    }
    if (!nombre || !lista[nombre]) return;
    await decodificar(nombre);
    const b = buffers.get(nombre);
    if (!b || pedido !== nombre) return;
    const src = c.createBufferSource();
    src.buffer = b;
    src.loop = true;
    const g = c.createGain();
    g.gain.value = 0;
    g.gain.setTargetAtTime(0.2, c.currentTime, 1.4);
    src.connect(g).connect(salida!);
    src.start();
    ambiente = { nombre, src, g };
  });
}
/** Qué ambiente toca: lluvia si llueve, el mar en el puerto y el lago, grillos de noche, pájaros de día; nada adentro
 * ni en el espacio. */
export function ambienteDe(s: EstadoGranja, espacio: boolean): string | null {
  if (s.interior || s.servicio || s.aventura?.destinoActual || s.astra?.interior || espacio) return null;
  let t = 'sol';
  try { t = tiempoRegion(tiempoDia(s.tiempo, s.jornada.diasCompletados), biomaZona(s.zona, s, 0, 0)); } catch { /* sin clima: día */ }
  if (t === 'lluvia' || t === 'tormenta') return 'ambiente_lluvia';
  if (s.astra?.actual === 'puerto_lirios' || s.zona === 'lago') return 'ambiente_mar';
  const m = s.jornada.minutos;
  return m >= 1140 || m < 360 ? 'ambiente_noche' : 'ambiente_dia';
}
