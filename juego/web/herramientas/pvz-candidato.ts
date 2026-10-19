// Banco de pruebas de diseños de zombi (no entra al build: Vite lo sirve en desarrollo).
//   herramientas/pvz-candidato.html?c=<nombre>&vista=grande|tiras|juego
// Carga herramientas/candidatos/<nombre>.ts (export default: DefPersonaje o función que lo devuelve) y dibuja:
//   grande  quieto muy ampliado sobre gris claro, sobre pasto y en silueta negra (lectura de la forma)
//   tiras   camina, come, muere, sin cabeza, sin brazo, golpe y congelado
//   juego   el patio de Blender a escala de teléfono (0.65 y 1.3 px por px de mundo) junto a las plantas
// Cuando termina de dibujar pone window.__listo = true.
import { aplicarPerdidas, cargarPersonajes, dibujarPersonaje, type DefPersonaje, type OpcionesDibujo } from '../src/jardin/pvz/arte/piezas';
import { cargarArteBlender, cargarFondoBlender } from '../src/jardin/pvz/arte/blender';
import { DEF_ARTE } from '../src/jardin/pvz/arte/index';
import { centroCol, centroFila, PIE_PLANTA, PIE_ZOMBI, X_MIN } from '../src/jardin/pvz/arte/geometria';

declare global {
  interface Window {
    __listo?: boolean;
    __error?: string;
  }
}

const params = new URLSearchParams(location.search);
const nombre = params.get('c') ?? 'actual';
const vista = params.get('vista') ?? 'grande';
const lienzo = document.getElementById('lienzo') as HTMLCanvasElement;
const g = lienzo.getContext('2d')!;

function tamano(w: number, h: number): void {
  lienzo.width = w;
  lienzo.height = h;
  lienzo.style.width = w + 'px';
  lienzo.style.height = h + 'px';
}

function rotulo(texto: string, x: number, y: number, color = '#f6ecd2'): void {
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.font = "600 15px system-ui, 'Liberation Sans', sans-serif";
  g.fillStyle = color;
  g.fillText(texto, x, y);
  g.restore();
}

function dibujar(def: DefPersonaje, escala: number, ox: number, oy: number, op: Partial<OpcionesDibujo>): void {
  g.save();
  g.setTransform(escala, 0, 0, escala, ox, oy);
  dibujarPersonaje(g, def, { x: def.ancla[0], y: def.ancla[1], t: 0, estado: 'quieto', semilla: 0, ...op });
  g.restore();
}

/** Margen alrededor del marco (en unidades de mundo) para que quepa lo que sale del marco (brazos, pelos). */
const M = 30;

async function grande(def: DefPersonaje): Promise<void> {
  const Z = Number(params.get('zoom') ?? 4.5);
  const pw = Math.round((def.ancho + 2 * M) * Z);
  const ph = Math.round((def.alto + 2 * M) * Z);
  tamano(pw * 3 + 40, ph + 40);
  await cargarPersonajes([def], Z);
  const fondos = ['#e9eef2', '#79c143', '#ffffff'];
  for (let i = 0; i < 3; i++) {
    const x0 = 10 + i * (pw + 10);
    g.fillStyle = fondos[i];
    g.fillRect(x0, 30, pw, ph);
    if (i === 2) {
      // Silueta: se dibuja en un lienzo aparte y se rellena de negro.
      const L = document.createElement('canvas');
      L.width = pw;
      L.height = ph;
      const h = L.getContext('2d')!;
      h.setTransform(Z, 0, 0, Z, M * Z, M * Z);
      dibujarPersonaje(h, def, { x: def.ancla[0], y: def.ancla[1], t: 0, estado: 'quieto', semilla: 0 });
      h.setTransform(1, 0, 0, 1, 0, 0);
      h.globalCompositeOperation = 'source-in';
      h.fillStyle = '#111';
      h.fillRect(0, 0, pw, ph);
      g.drawImage(L, x0, 30);
    } else dibujar(def, Z, x0 + M * Z, 30 + M * Z, {});
  }
  rotulo(`${nombre} · quieto (×${Z})`, 12, 20);
  rotulo('sobre pasto', 10 + pw + 12, 20);
  rotulo('silueta', 10 + 2 * (pw + 10) + 2, 20);
}

async function tiras(def: DefPersonaje): Promise<void> {
  const Z = Number(params.get('zoom') ?? 2);
  const n = 6;
  const cw = Math.round((def.ancho + 2 * M + 30) * Z);
  const ch = Math.round((def.alto + 2 * M) * Z);
  const filas: { titulo: string; op: (k: number) => Partial<OpcionesDibujo> }[] = [
    { titulo: 'camina', op: (k) => ({ estado: 'camina', t: (k / n) * 2.4 }) },
    { titulo: 'come', op: (k) => ({ estado: 'come', t: (k / n) * 1.2 }) },
    { titulo: 'muere', op: (k) => ({ estado: 'muere', fase: k / (n - 1), ...aplicar(def, ['cabeza']) }) },
    { titulo: 'sin cabeza', op: (k) => ({ estado: 'sincabeza', t: (k / n) * 2, ...aplicar(def, ['cabeza']) }) },
    { titulo: 'sin brazo · camina', op: (k) => ({ estado: 'camina', t: (k / n) * 2.4, ...aplicar(def, ['brazo']) }) },
    { titulo: 'golpe · congelado · ceniza', op: (k) => (k < 2 ? { estado: 'camina', t: k, tinte: 'golpe' } : k < 4 ? { estado: 'camina', t: k, tinte: 'congelado' } : { estado: 'ceniza', fase: (k - 4) / 2, tinte: 'ceniza' }) },
  ];
  tamano(cw * n + 20, (ch + 26) * filas.length + 10);
  await cargarPersonajes([def], Z);
  filas.forEach((f, i) => {
    const y0 = 10 + i * (ch + 26);
    rotulo(f.titulo, 12, y0 + 14);
    for (let k = 0; k < n; k++) {
      const x0 = 10 + k * cw;
      g.fillStyle = '#79c143';
      g.fillRect(x0, y0 + 20, cw - 6, ch);
      dibujar(def, Z, x0 + (M + 15) * Z, y0 + 20 + M * Z, f.op(k));
    }
  });
}

function aplicar(def: DefPersonaje, perdidas: string[]): Partial<OpcionesDibujo> {
  const r = aplicarPerdidas(def, perdidas.filter((p) => def.perdidas?.[p]));
  return { ocultar: r.ocultar, variantes: r.variantes };
}

async function juego(def: DefPersonaje): Promise<void> {
  await cargarArteBlender('../jardin/pvz/');
  const fondo = await cargarFondoBlender([0, 1, 2, 3, 4], '../jardin/pvz/');
  const escalas = [0.65, 1.3];
  const ancho = 820; // mundo de x = -60 a 760
  const alto = 600;
  const W = Math.ceil(ancho * (escalas[0] + escalas[1])) + 30;
  const H = Math.ceil(alto * escalas[1]) + 40;
  tamano(W, H);
  let x0 = 10;
  for (const s of escalas) {
    await cargarPersonajes([def, ...['lanzaguisantes', 'girasol', 'nuez', 'repetidora'].map((id) => DEF_ARTE[id]).filter(Boolean)], s);
    g.save();
    g.beginPath();
    g.rect(x0, 30, ancho * s, alto * s);
    g.clip();
    g.setTransform(s, 0, 0, s, x0 + 60 * s, 30);
    if (fondo) g.drawImage(fondo, X_MIN, 0, 1460, 600);
    const plantas: [string, number, number][] = [['girasol', 0, 0], ['lanzaguisantes', 1, 0], ['repetidora', 2, 1], ['lanzaguisantes', 2, 3], ['nuez', 4, 2], ['girasol', 0, 4]];
    const zombis: [number, number, string, number][] = [[0, 640, 'camina', 0.2], [1, 520, 'camina', 0.9], [2, 410, 'come', 0.4], [3, 600, 'camina', 1.5], [4, 700, 'camina', 0.6]];
    for (let f = 0; f < 5; f++) {
      const yf = centroFila(f);
      for (const [id, c, ff] of plantas) if (ff === f && DEF_ARTE[id]) dibujarPersonaje(g, DEF_ARTE[id], { x: centroCol(c), y: yf + PIE_PLANTA, t: f * 0.3, estado: 'quieto', semilla: c });
      for (const [ff, x, estado, t] of zombis) if (ff === f) dibujarPersonaje(g, def, { x, y: yf + PIE_ZOMBI, t, estado, semilla: ff });
    }
    g.restore();
    rotulo(`${nombre} en el patio · ${s} px por px de mundo`, x0 + 2, 20);
    x0 += Math.ceil(ancho * s) + 10;
  }
}

async function main(): Promise<void> {
  const mod = await import(/* @vite-ignore */ `./candidatos/${nombre}.ts`);
  const def: DefPersonaje = typeof mod.default === 'function' ? mod.default() : mod.default;
  if (vista === 'tiras') await tiras(def);
  else if (vista === 'juego') await juego(def);
  else await grande(def);
}

main()
  .catch((e) => {
    window.__error = String(e?.stack ?? e);
    console.error(e);
  })
  .finally(() => {
    window.__listo = true;
  });
