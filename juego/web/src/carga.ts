// Pantallas de carga: mientras carga cada parte del juego, Él y Ella hacen tonterías (guerra de almohadas, se
// persiguen con la chancla, globos de agua, pastel en la cara, cosquillas, baile loco, sustos…). Son escenitas
// dibujadas en un canvas con los recortes de los dos (public/carga) y cosas volando; cada vez sale una distinta.
import recortes from './carga_recortes.json';

type Rol = 'el' | 'ella';
const R = recortes as unknown as Record<string, [number, number, number, number]>;

// ---------------------------------------------------------------------------------------------- Lienzo
const ANCHO = 600;
const ALTO = 230;
const PISO = 214;
/** Escala de los recortes (de pie miden 200 px). */
const ESC = 0.66;
type G = CanvasRenderingContext2D;

const imgs = new Map<string, HTMLImageElement>();
function img(clave: string) {
  let i = imgs.get(clave);
  if (!i) {
    i = new Image();
    i.src = `./carga/${clave}.webp`;
    imgs.set(clave, i);
  }
  return i;
}

const ent = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const suave = (k: number) => k * k * (3 - 2 * k);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** Cuadro de correr (alterna dos poses). */
const corre = (t: number, ritmo = 7) => (Math.floor(t * ritmo) % 2 ? 'corre_a' : 'corre_b');
const risa = (t: number) => (Math.floor(t * 5) % 2 ? 'risa_a' : 'risa_b');
const baile = (t: number, fase = 0) => (Math.floor(t * 3 + fase) % 2 ? 'baile_a' : 'baile_b');

interface Opc {
  /** Mira a la izquierda (los recortes miran a la derecha). */
  izq?: boolean;
  /** Altura del brinco. */
  alto?: number;
  /** Acostado o de lado (radianes, girando sobre los pies). */
  giro?: number;
  esc?: number;
  alfa?: number;
  /** Sacudón (temblor). */
  tiembla?: number;
}

/** Dibuja a Él o Ella con los pies en (x, PISO). */
function pj(g: G, rol: Rol, pose: string, x: number, o: Opc = {}) {
  const clave = `${rol}_${pose}`;
  const d = R[clave];
  const i = img(clave);
  if (!d || !i.complete || !i.naturalWidth) return;
  const [w, h, ox, oy] = d;
  const e = ESC * (o.esc ?? 1);
  const alto = o.alto ?? 0;
  // Sombra en el piso (más chiquita si va en el aire)
  g.fillStyle = `rgba(60,30,20,${0.18 * Math.max(0.3, 1 - alto / 120)})`;
  g.beginPath();
  g.ellipse(x, PISO + 2, 34 * e * (1 - Math.min(0.5, alto / 200)), 7 * e, 0, 0, Math.PI * 2);
  g.fill();
  g.save();
  g.globalAlpha = o.alfa ?? 1;
  const tx = o.tiembla ? Math.sin(performance.now() / 25) * o.tiembla : 0;
  g.translate(x + tx, PISO - alto);
  if (o.giro) g.rotate(o.giro);
  if (o.izq) g.scale(-1, 1);
  g.drawImage(i, -ox * e, -oy * e, w * e, h * e);
  g.restore();
}

function emoji(g: G, t: string, x: number, y: number, tam: number, rot = 0, alfa = 1) {
  g.save();
  g.globalAlpha = alfa;
  g.translate(x, y);
  g.rotate(rot);
  g.font = `${tam}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(t, 0, 0);
  g.restore();
}
function texto(g: G, t: string, x: number, y: number, tam = 22, color = '#fff', rot = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.font = `900 ${tam}px Fredoka, Nunito, system-ui, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = tam * 0.28;
  g.strokeStyle = '#3d2b27';
  g.strokeText(t, 0, 0);
  g.fillStyle = color;
  g.fillText(t, 0, 0);
  g.restore();
}
/** Posición en un arco de a a b (altura h) con k de 0 a 1. */
function arco(x0: number, y0: number, x1: number, y1: number, h: number, k: number) {
  return { x: lerp(x0, x1, k), y: lerp(y0, y1, k) - Math.sin(k * Math.PI) * h };
}
/** Estallido de pedacitos (plumas, gotas, confeti) a partir de t0. */
function estallido(g: G, t: number, t0: number, x: number, y: number, o: { n?: number; color?: string[]; dur?: number; forma?: 'pluma' | 'gota' | 'papel' | 'estrella'; grav?: number; vel?: number }) {
  const k = t - t0;
  const dur = o.dur ?? 1.6;
  if (k < 0 || k > dur) return;
  const n = o.n ?? 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + i * 0.7;
    const v = (o.vel ?? 120) * (0.6 + ((i * 37) % 10) / 20);
    const px = x + Math.cos(a) * v * k;
    const py = y + Math.sin(a) * v * k * 0.8 + (o.grav ?? 90) * k * k;
    g.save();
    g.globalAlpha = Math.max(0, 1 - k / dur);
    g.translate(px, py);
    g.rotate(a + k * 4);
    g.fillStyle = (o.color ?? ['#fff'])[i % (o.color ?? ['#fff']).length];
    g.beginPath();
    if (o.forma === 'pluma') g.ellipse(0, 0, 7, 2.5, Math.sin(k * 5 + i), 0, Math.PI * 2);
    else if (o.forma === 'gota') g.ellipse(0, 0, 3, 5, 0, 0, Math.PI * 2);
    else if (o.forma === 'estrella') {
      for (let j = 0; j < 10; j++) {
        const r = j % 2 ? 2.5 : 6;
        g.lineTo(Math.cos((j / 10) * Math.PI * 2) * r, Math.sin((j / 10) * Math.PI * 2) * r);
      }
    } else g.rect(-4, -2.5, 8, 5);
    g.fill();
    g.restore();
  }
}
function almohada(g: G, x: number, y: number, rot: number, color = '#fdf6ee') {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.fillStyle = color;
  g.strokeStyle = 'rgba(120,90,80,0.5)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-22, -12);
  g.quadraticCurveTo(0, -18, 22, -12);
  g.quadraticCurveTo(28, 0, 22, 12);
  g.quadraticCurveTo(0, 18, -22, 12);
  g.quadraticCurveTo(-28, 0, -22, -12);
  g.fill();
  g.stroke();
  g.restore();
}
function bola(g: G, x: number, y: number, r: number, color: string, brillo = true) {
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  if (brillo) {
    g.fillStyle = 'rgba(255,255,255,0.7)';
    g.beginPath();
    g.arc(x - r * 0.35, y - r * 0.35, r * 0.3, 0, Math.PI * 2);
    g.fill();
  }
}
/** Estrellitas dando vueltas sobre la cabeza (después de un golpe). */
function mareo(g: G, x: number, y: number, t: number) {
  for (let i = 0; i < 3; i++) {
    const a = t * 5 + (i / 3) * Math.PI * 2;
    emoji(g, '⭐', x + Math.cos(a) * 26, y + Math.sin(a) * 8, 14);
  }
}
function corazones(g: G, t: number, t0: number, x0: number, y0: number, x1: number, y1: number, n = 4) {
  for (let i = 0; i < n; i++) {
    const k = ent(t, t0 + i * 0.25, t0 + i * 0.25 + 1.2);
    if (k <= 0 || k >= 1) continue;
    const p = arco(x0, y0, x1, y1, 40, k);
    emoji(g, '💖', p.x, p.y + Math.sin(k * 12 + i) * 5, 18 + i * 2, 0, 1 - k * 0.3);
  }
}

// ---------------------------------------------------------------------------------------------- Escenas
interface Escena {
  nombre: string;
  dur: number;
  poses: string[];
  dibujar(g: G, t: number): void;
}
const ambos = (...p: string[]) => p.flatMap((x) => [`el_${x}`, `ella_${x}`]);

const ESCENAS: Escena[] = [
  {
    nombre: 'Guerra de almohadas',
    dur: 6.4,
    poses: ambos('frota', 'lanza', 'esquiva', 'enojo', 'desmayo', 'risa_a', 'risa_b', 'reposo'),
    dibujar(g, t) {
      const golpeElla = 1.6, golpeEl = 3.6;
      pj(g, 'el', t < 0.7 ? 'frota' : t < 1.1 ? 'lanza' : t < golpeEl ? 'reposo' : 'desmayo', 160, { giro: t > golpeEl ? -0.25 : 0 });
      pj(g, 'ella', t < golpeElla ? 'reposo' : t < 2.4 ? 'esquiva' : t < 2.7 ? 'enojo' : t < 3.0 ? 'lanza' : t < golpeEl ? 'reposo' : risa(t), 440, { izq: true, tiembla: t > golpeElla && t < 2 ? 3 : 0 });
      const k1 = ent(t, 0.9, golpeElla);
      if (k1 > 0 && k1 < 1) {
        const p = arco(190, 120, 420, 110, 70, k1);
        almohada(g, p.x, p.y, k1 * 8);
      }
      const k2 = ent(t, 2.9, golpeEl);
      if (k2 > 0 && k2 < 1) {
        const p = arco(410, 120, 180, 105, 70, k2);
        almohada(g, p.x, p.y, -k2 * 8, '#ffd6e2');
      }
      estallido(g, t, golpeElla, 430, 110, { forma: 'pluma', color: ['#ffffff', '#f3ece4'], grav: 40, dur: 2 });
      estallido(g, t, golpeEl, 170, 100, { forma: 'pluma', color: ['#ffffff', '#ffe0ea'], grav: 40, dur: 2.4 });
      if (t > golpeEl) mareo(g, 150, 110, t);
      if (t > golpeElla && t < golpeElla + 0.5) texto(g, '¡PAF!', 430, 70, 26, '#ffd23f', -0.2);
      if (t > golpeEl && t < golpeEl + 0.5) texto(g, '¡PUM!', 170, 60, 28, '#ff8fb1', 0.2);
    },
  },
  {
    nombre: '¡Atrápame!… y la chancla',
    dur: 6,
    poses: ambos('corre_a', 'corre_b', 'susto', 'enojo', 'risa_a'),
    dibujar(g, t) {
      if (t < 3) {
        // Él persigue a Ella (ella muerta de la risa)
        const k = t / 3;
        const xe = lerp(-60, 700, k), xl = xe - 130;
        pj(g, 'ella', corre(t), xe, { alto: Math.abs(Math.sin(t * 14)) * 6 });
        pj(g, 'el', corre(t + 0.07), xl, { alto: Math.abs(Math.sin(t * 14 + 1)) * 6 });
        if (t > 0.8 && t < 1.8) texto(g, 'jijiji', xe + 10, 70, 16, '#ffe0ea');
      } else {
        // Ahora Ella lo persigue con la chancla
        const k = (t - 3) / 3;
        const xl = lerp(680, -80, k), xe = xl + 150;
        pj(g, 'el', corre(t, 9), xl, { izq: true, alto: Math.abs(Math.sin(t * 18)) * 8 });
        pj(g, 'ella', corre(t + 0.05, 8), xe, { izq: true, alto: Math.abs(Math.sin(t * 16)) * 6 });
        emoji(g, '🩴', xe - 22, 78 + Math.sin(t * 20) * 8, 30, Math.sin(t * 20) * 0.8);
        emoji(g, '💦', xl + 24, 70, 16);
        if (t > 3.6 && t < 4.6) texto(g, '¡Vuelve acá!', xe, 44, 18, '#ffd23f');
      }
    },
  },
  {
    nombre: 'Globo de agua',
    dur: 6,
    poses: ambos('reposo', 'lanza', 'piensa', 'susto', 'puchero', 'risa_a', 'risa_b', 'tirado'),
    dibujar(g, t) {
      const golpe = 1.7;
      pj(g, 'ella', t < 0.8 ? 'frota' : t < 1.2 ? 'lanza' : t < golpe ? 'reposo' : risa(t), 150);
      pj(g, 'el', t < golpe ? 'piensa' : t < 2.4 ? 'susto' : 'puchero', 450, { izq: true, tiembla: t > golpe && t < 2.2 ? 3 : 0 });
      const k = ent(t, 1.0, golpe);
      if (k > 0 && k < 1) {
        const p = arco(175, 110, 440, 70, 90, k);
        g.fillStyle = '#6ec6ff';
        g.beginPath();
        g.ellipse(p.x, p.y, 13, 11 + Math.sin(t * 30) * 2, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,0.7)';
        g.beginPath();
        g.arc(p.x - 4, p.y - 4, 3, 0, Math.PI * 2);
        g.fill();
      }
      estallido(g, t, golpe, 445, 70, { forma: 'gota', color: ['#6ec6ff', '#9fdcff'], grav: 220, vel: 150, n: 18 });
      if (t > golpe) {
        // Chorreando y con su charquito
        for (let i = 0; i < 4; i++) {
          const y = 80 + (((t - golpe) * 90 + i * 40) % 130);
          g.fillStyle = 'rgba(110,198,255,0.8)';
          g.beginPath();
          g.ellipse(425 + i * 14, y, 2.5, 4, 0, 0, Math.PI * 2);
          g.fill();
        }
        g.fillStyle = 'rgba(110,198,255,0.35)';
        g.beginPath();
        g.ellipse(450, PISO + 3, Math.min(60, (t - golpe) * 40), 7, 0, 0, Math.PI * 2);
        g.fill();
      }
      if (t > golpe && t < golpe + 0.5) texto(g, '¡SPLASH!', 450, 40, 24, '#9fdcff');
    },
  },
  {
    nombre: 'Pastel en la cara',
    dur: 6.4,
    poses: ambos('regalo', 'reposo', 'lanza', 'susto', 'puchero', 'risa_a', 'risa_b'),
    dibujar(g, t) {
      const golpe = 1.9;
      const xe = lerp(430, 330, suave(ent(t, 1.2, 1.7)));
      pj(g, 'el', t < golpe ? 'regalo' : t < 2.6 ? 'susto' : t < 4 ? 'puchero' : risa(t), 240);
      pj(g, 'ella', t < 1.4 ? 'reposo' : t < golpe + 0.4 ? 'lanza' : risa(t), xe, { izq: true });
      if (t < golpe) emoji(g, '🎂', 268, 150, 34);
      if (t >= golpe) {
        // La cara llena de crema
        g.fillStyle = '#fffaf2';
        for (let i = 0; i < 7; i++) {
          g.beginPath();
          g.arc(232 + Math.cos(i * 1.3) * 16, 92 + Math.sin(i * 1.9) * 12, 10 + (i % 3) * 3, 0, Math.PI * 2);
          g.fill();
        }
        g.fillStyle = '#ff6b8a';
        g.beginPath();
        g.arc(236, 80, 5, 0, Math.PI * 2);
        g.fill();
        estallido(g, t, golpe, 240, 95, { forma: 'gota', color: ['#fffaf2', '#ffd6e2'], grav: 160, n: 12 });
      }
      if (t > golpe && t < golpe + 0.6) texto(g, '¡SPLAT!', 250, 40, 26, '#ffd6e2');
      if (t > 4.2) texto(g, 'mmm… rico', 230, 44, 16, '#fff');
    },
  },
  {
    nombre: 'Guerra de cosquillas',
    dur: 5.6,
    poses: ambos('corre_a', 'corre_b', 'agita_a', 'agita_b', 'risa_a', 'risa_b', 'piensa', 'tirado'),
    dibujar(g, t) {
      const llega = 1.4;
      const xl = lerp(60, 330, suave(ent(t, 0, llega)));
      pj(g, 'ella', t < llega ? 'piensa' : risa(t), 400, { izq: true, tiembla: t > llega ? 4 : 0, giro: t > 3.5 ? Math.min(0.5, (t - 3.5) * 0.6) : 0 });
      pj(g, 'el', t < llega ? corre(t) : Math.floor(t * 8) % 2 ? 'agita_a' : 'agita_b', xl);
      if (t > llega) {
        for (let i = 0; i < 3; i++) {
          const k = ((t - llega) * 0.8 + i / 3) % 1;
          texto(g, ['ja', 'jaja', 'JAJA'][i], 420 + i * 30, 90 - k * 60, 14 + i * 3, '#ffe0ea', (i - 1) * 0.3);
        }
      }
    },
  },
  {
    nombre: 'Baile loco',
    dur: 5,
    poses: ambos('baile_a', 'baile_b', 'salta'),
    dibujar(g, t) {
      // Luces de disco
      for (let i = 0; i < 4; i++) {
        const a = t * 1.5 + i * 1.6;
        g.fillStyle = ['rgba(255,120,180,0.18)', 'rgba(120,200,255,0.18)', 'rgba(255,220,90,0.18)', 'rgba(150,255,170,0.18)'][i];
        g.beginPath();
        g.moveTo(300, -10);
        g.lineTo(300 + Math.cos(a) * 400 - 40, 240);
        g.lineTo(300 + Math.cos(a) * 400 + 40, 240);
        g.fill();
      }
      const saltaEl = t % 2.5 > 2.1;
      pj(g, 'el', saltaEl ? 'salta' : baile(t), 210, { alto: saltaEl ? Math.sin(((t % 2.5) - 2.1) / 0.4 * Math.PI) * 30 : 0 });
      pj(g, 'ella', baile(t, 1), 390, { izq: Math.floor(t / 1.25) % 2 === 1 });
      for (let i = 0; i < 5; i++) {
        const k = (t * 0.5 + i / 5) % 1;
        emoji(g, i % 2 ? '♪' : '♫', 80 + i * 110, 200 - k * 190, 20, Math.sin(t * 3 + i) * 0.3, 1 - k);
      }
    },
  },
  {
    nombre: '¡BU!',
    dur: 6,
    poses: ambos('corre_a', 'corre_b', 'salta', 'susto', 'enojo', 'tirado', 'risa_a', 'risa_b', 'agacha'),
    dibujar(g, t) {
      const susto = 2.2;
      // Ella camina tranquila hacia la mata
      const xe = lerp(40, 300, ent(t, 0, susto));
      const brinco = t > susto && t < susto + 0.7 ? Math.sin(((t - susto) / 0.7) * Math.PI) * 55 : 0;
      pj(g, 'ella', t < susto ? corre(t, 4) : t < susto + 1.2 ? 'susto' : 'enojo', xe, { alto: brinco });
      // Él escondido detrás de la mata sale de un brinco
      const sale = t > susto - 0.2;
      pj(g, 'el', !sale ? 'agacha' : t < susto + 1.2 ? 'salta' : risa(t), 420, { izq: true, alto: sale && t < susto + 0.5 ? 18 : 0 });
      emoji(g, '🪴', 400, 176, 70);
      if (t > susto && t < susto + 0.9) texto(g, '¡BU!', 440, 50, 34, '#ffd23f', 0.15);
      if (t > susto && t < susto + 0.6) estallido(g, t, susto, xe, 70, { forma: 'estrella', color: ['#ffd23f'], grav: 0, n: 8, dur: 0.6 });
      if (t > susto + 1.4) texto(g, '¡Me las vas a pagar!', xe, 40, 16, '#ffd6e2');
    },
  },
  {
    nombre: 'Choque de manos… fallido',
    dur: 6,
    poses: ambos('corre_a', 'corre_b', 'salta', 'desmayo', 'risa_a', 'risa_b'),
    dibujar(g, t) {
      const salto = 1.2, caen = 2.0;
      const kel = ent(t, 0, caen), kella = ent(t, 0, caen);
      const xel = lerp(40, 380, kel), xella = lerp(560, 220, kella);
      const enAire = t > salto && t < caen;
      const alto = enAire ? Math.sin(((t - salto) / (caen - salto)) * Math.PI) * 50 : 0;
      if (t < caen) {
        pj(g, 'el', t < salto ? corre(t) : 'salta', xel, { alto });
        pj(g, 'ella', t < salto ? corre(t + 0.1) : 'salta', xella, { izq: true, alto });
        if (enAire) texto(g, '¡Choca esos cinco!', 300, 30, 16, '#fff');
      } else {
        const r = t > 3.8;
        pj(g, 'el', r ? risa(t) : 'desmayo', 380, { giro: r ? 0 : 1.2 });
        pj(g, 'ella', r ? risa(t + 0.1) : 'desmayo', 220, { izq: true, giro: r ? 0 : -1.2 });
        if (!r) {
          mareo(g, 420, 180, t);
          mareo(g, 180, 180, t + 1);
          if (t < caen + 0.5) texto(g, '¡PLOF!', 300, 120, 26, '#ffd23f');
        }
      }
    },
  },
  {
    nombre: 'Confeti sorpresa',
    dur: 6,
    poses: ambos('duerme', 'corre_a', 'corre_b', 'lanza', 'salta', 'baile_a', 'baile_b'),
    dibujar(g, t) {
      const boom = 2.3;
      pj(g, 'el', t < boom ? 'duerme' : t < boom + 0.8 ? 'salta' : baile(t), 380, { izq: true, alto: t > boom && t < boom + 0.8 ? Math.sin(((t - boom) / 0.8) * Math.PI) * 40 : 0 });
      if (t < boom) for (let i = 0; i < 3; i++) texto(g, 'z', 400 + i * 12, 90 - i * 14 - ((t * 20) % 10), 12 + i * 4, '#cfe3ff');
      const xe = lerp(60, 260, ent(t, 0, 1.8));
      pj(g, 'ella', t < 1.8 ? corre(t, 3) : t < boom + 0.3 ? 'lanza' : baile(t, 1), xe);
      if (t > 1.8 && t < boom) emoji(g, '🎉', xe + 26, 120, 26);
      estallido(g, t, boom, 360, 80, { forma: 'papel', color: ['#ff5d8f', '#ffd23f', '#3ec1d3', '#7ed957', '#b57cff'], grav: 60, vel: 160, n: 30, dur: 3.5 });
      if (t > boom && t < boom + 0.7) texto(g, '¡SORPRESA!', 300, 36, 26, '#ffd23f');
    },
  },
  {
    nombre: 'Avioncito de papel',
    dur: 6.6,
    poses: ambos('lanza', 'reposo', 'susto', 'piensa', 'beso_volado', 'timido', 'frota'),
    dibujar(g, t) {
      const llega = 2.8;
      pj(g, 'el', t < 0.5 ? 'frota' : t < 1 ? 'lanza' : t < 4.2 ? 'reposo' : 'timido', 130);
      pj(g, 'ella', t < llega ? 'reposo' : t < 3.3 ? 'susto' : t < 4.2 ? 'piensa' : 'beso_volado', 460, { izq: true });
      const k = ent(t, 0.8, llega);
      if (k > 0 && k < 1) {
        const x = lerp(160, 450, k), y = 100 + Math.sin(k * Math.PI * 3) * 40 - Math.sin(k * Math.PI) * 30;
        g.save();
        g.translate(x, y);
        g.rotate(Math.cos(k * Math.PI * 3) * 0.5);
        g.fillStyle = '#fff';
        g.strokeStyle = '#9aa6b0';
        g.beginPath();
        g.moveTo(16, 0);
        g.lineTo(-14, -9);
        g.lineTo(-8, 0);
        g.lineTo(-14, 9);
        g.closePath();
        g.fill();
        g.stroke();
        g.restore();
      }
      if (t > llega && t < 4.2) emoji(g, '💌', 450, 60, 26);
      if (t > 3.3 && t < 4.2) texto(g, '«Te amo, boba»', 460, 30, 14, '#ffd6e2');
      corazones(g, t, 4.3, 430, 80, 150, 80, 5);
    },
  },
  {
    nombre: 'El cojín pedorro',
    dur: 6.4,
    poses: ambos('agacha', 'reposo', 'corre_a', 'corre_b', 'sentado', 'timido', 'enojo', 'tirado', 'risa_a', 'risa_b'),
    dibujar(g, t) {
      const sienta = 2.4;
      // El banquito con el cojín escondido
      g.fillStyle = '#b07a52';
      g.fillRect(270, 186, 70, 10);
      g.fillRect(276, 196, 8, 18);
      g.fillRect(326, 196, 8, 18);
      if (t < sienta) {
        g.fillStyle = '#ff8fb1';
        g.beginPath();
        g.ellipse(305, 182, 26, 7, 0, 0, Math.PI * 2);
        g.fill();
      }
      pj(g, 'el', t < 0.9 ? 'agacha' : t < sienta ? 'reposo' : risa(t), t < 0.9 ? 300 : 470, { izq: true, giro: t > sienta + 1 ? -0.4 : 0 });
      const xe = lerp(20, 305, ent(t, 0.9, sienta - 0.2));
      pj(g, 'ella', t < sienta - 0.2 ? corre(t, 4) : t < sienta + 1.8 ? 'sentado' : t < 5 ? 'timido' : 'enojo', xe, { tiembla: t > sienta && t < sienta + 0.8 ? 3 : 0 });
      if (t > sienta && t < sienta + 1.2) {
        texto(g, 'PRRRRT', 300, 110, 24, '#c9f7c1', Math.sin(t * 30) * 0.08);
        emoji(g, '💨', 250 - (t - sienta) * 40, 190, 24);
      }
    },
  },
  {
    nombre: 'Concurso de músculos',
    dur: 6.4,
    poses: ambos('musculo', 'reposo', 'susto', 'desmayo', 'pulgares', 'aplauso'),
    dibujar(g, t) {
      pj(g, 'el', t < 1.6 ? 'musculo' : t < 3.2 ? 'reposo' : t < 3.8 ? 'susto' : 'desmayo', 180, { giro: t > 3.8 ? -1.2 : 0 });
      const grande = t > 1.8 && t < 3.8 ? 1 + Math.min(0.2, (t - 1.8) * 0.3) + Math.sin(t * 20) * 0.01 : 1;
      pj(g, 'ella', t < 1.8 ? 'aplauso' : t < 3.8 ? 'musculo' : 'pulgares', 420, { izq: true, esc: grande });
      if (t < 1.6) texto(g, '¡Mira este brazo!', 180, 36, 16, '#fff');
      if (t > 1.8 && t < 3.8) {
        texto(g, '¿Y este?', 420, 30, 20, '#ffd23f');
        estallido(g, t, 2, 420, 110, { forma: 'estrella', color: ['#ffd23f', '#fff'], grav: 0, n: 10, dur: 1.8 });
      }
      if (t > 3.8) mareo(g, 140, 185, t);
    },
  },
  {
    nombre: 'Palomitas al aire',
    dur: 6.4,
    poses: ambos('sentado', 'lanza', 'susto', 'aplauso', 'risa_a', 'risa_b'),
    dibujar(g, t) {
      const lanza = (t > 0.7 && t < 1.2) || (t > 3.2 && t < 3.7);
      pj(g, 'el', lanza ? 'lanza' : t > 4.3 ? risa(t) : 'sentado', 200);
      emoji(g, '🍿', 300, 196, 34);
      const tiros = [{ t0: 0.9, dx: -30, dy: 28 }, { t0: 3.4, dx: 0, dy: 0 }];
      for (const [i, s] of tiros.entries()) {
        const k = ent(t, s.t0, s.t0 + 0.9);
        if (k > 0 && k < 1) {
          const p = arco(230, 120, 400 + s.dx, 104 + s.dy, 90, k);
          bola(g, p.x, p.y, 6, '#fff6d8', false);
        }
        if (i === 0 && t > 1.8 && t < 2.4) texto(g, '¡Ay, mi ojo!', 400, 40, 16, '#fff');
      }
      pj(g, 'ella', t < 1.8 ? 'sentado' : t < 2.4 ? 'susto' : t < 4.3 ? 'sentado' : 'aplauso', 400, { izq: true });
      if (t > 4.3 && t < 5.4) texto(g, '¡Gol!', 400, 36, 24, '#ffd23f');
    },
  },
  {
    nombre: 'Bolas de nieve',
    dur: 6.4,
    poses: ambos('lanza', 'agacha', 'esquiva', 'reposo', 'risa_a', 'risa_b', 'puchero'),
    dibujar(g, t) {
      // Nieve cayendo y un muñequito de nieve en la mitad
      for (let i = 0; i < 26; i++) bola(g, (i * 97 + Math.sin(t + i) * 20) % 600, (t * 40 + i * 53) % 230, 2.2, 'rgba(255,255,255,0.9)', false);
      emoji(g, '⛄', 300, 184, 54);
      const tiros = [{ t0: 0.6, de: 'el' }, { t0: 2.2, de: 'ella' }, { t0: 3.8, de: 'el' }];
      let poseEl = 'reposo', poseElla = 'reposo';
      for (const s of tiros) {
        const k = ent(t, s.t0, s.t0 + 0.8);
        const deEl = s.de === 'el';
        if (t > s.t0 - 0.3 && t < s.t0 + 0.2) (deEl ? (poseEl = 'lanza') : (poseElla = 'lanza'));
        if (k > 0 && k < 1) {
          const p = deEl ? arco(150, 110, 450, 100, 70, k) : arco(450, 110, 150, 100, 70, k);
          bola(g, p.x, p.y, 8, '#ffffff');
        }
        if (k >= 1 && t < s.t0 + 1.4) {
          estallido(g, t, s.t0 + 0.8, deEl ? 450 : 150, 100, { forma: 'gota', color: ['#ffffff'], grav: 120, n: 10, dur: 0.6 });
          if (deEl) poseElla = s.t0 > 3 ? 'puchero' : 'esquiva';
          else poseEl = 'esquiva';
        }
      }
      if (t > 5.2) {
        poseEl = risa(t);
        poseElla = risa(t + 0.1);
      }
      pj(g, 'el', poseEl, 140);
      pj(g, 'ella', poseElla, 460, { izq: true });
    },
  },
  {
    nombre: 'Beso robado',
    dur: 6,
    poses: ambos('piensa', 'corre_a', 'corre_b', 'beso', 'timido', 'beso_volado', 'reposo', 'susto'),
    dibujar(g, t) {
      const beso = 2.4;
      pj(g, 'ella', t < beso ? 'piensa' : t < beso + 0.6 ? 'susto' : t < 4.2 ? 'timido' : 'beso_volado', 400, { izq: true });
      if (t < beso) emoji(g, '📱', 380, 128, 22);
      const xl = lerp(60, 350, suave(ent(t, 0.3, beso - 0.1)));
      pj(g, 'el', t < beso - 0.1 ? corre(t, 3) : t < 3.2 ? 'beso' : 'reposo', xl, { alto: t < beso - 0.1 ? Math.abs(Math.sin(t * 10)) * 3 : 0 });
      if (t > beso && t < beso + 0.7) texto(g, '¡MUA!', 380, 40, 26, '#ff8fb1');
      if (t > beso) estallido(g, t, beso, 385, 80, { forma: 'estrella', color: ['#ff8fb1', '#ffd6e2'], grav: 0, n: 8, dur: 1 });
      corazones(g, t, 4.3, 390, 80, 350, 60, 4);
    },
  },
  {
    nombre: 'Burbujas',
    dur: 6,
    poses: ambos('sopla', 'salta', 'agita_a', 'agita_b', 'risa_a', 'risa_b', 'reposo'),
    dibujar(g, t) {
      pj(g, 'ella', t < 4.6 ? 'sopla' : risa(t), 160);
      const brinca = Math.floor(t * 1.4) % 2 === 1;
      pj(g, 'el', brinca ? 'salta' : Math.floor(t * 6) % 2 ? 'agita_a' : 'agita_b', 430, { izq: true, alto: brinca ? Math.abs(Math.sin(t * Math.PI * 1.4)) * 45 : 0 });
      for (let i = 0; i < 7; i++) {
        const k = (t * 0.45 + i / 7) % 1;
        const x = 190 + k * 260, y = 110 - Math.sin(k * Math.PI) * 50 + Math.sin(t * 3 + i) * 10;
        if (k > 0.85) {
          estallido(g, k * 10, 8.5, x, y, { forma: 'gota', color: ['#bfe8ff'], grav: 0, n: 6, dur: 1.5, vel: 60 });
          continue;
        }
        g.strokeStyle = 'rgba(160,210,255,0.9)';
        g.lineWidth = 2;
        g.beginPath();
        g.arc(x, y, 8 + (i % 3) * 3, 0, Math.PI * 2);
        g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.55)';
        g.beginPath();
        g.arc(x - 3, y - 3, 2.5, 0, Math.PI * 2);
        g.fill();
      }
    },
  },
  {
    nombre: 'La última arepa',
    dur: 6.4,
    poses: ambos('corre_a', 'corre_b', 'desmayo', 'susto', 'llora', 'enojo'),
    dibujar(g, t) {
      const choque = 1.5;
      // La mesita con la arepa (hasta que se la roba el perrito)
      g.fillStyle = '#b07a52';
      g.fillRect(270, 176, 60, 8);
      g.fillRect(296, 184, 8, 30);
      const robada = t > 3.2;
      if (!robada) {
        g.fillStyle = '#f2d38a';
        g.beginPath();
        g.ellipse(300, 170, 18, 7, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#e0b35e';
        g.beginPath();
        g.ellipse(300, 168, 12, 4, 0, 0, Math.PI * 2);
        g.fill();
      }
      if (t < choque) {
        pj(g, 'el', corre(t, 9), lerp(-20, 260, t / choque));
        pj(g, 'ella', corre(t + 0.1, 9), lerp(620, 340, t / choque), { izq: true });
        texto(g, '¡Es mía!', 300, 40, 18, '#ffd23f');
      } else {
        const final = t > 4.2;
        pj(g, 'el', final ? 'llora' : t < 3.2 ? 'desmayo' : 'susto', 230, { giro: final || t > 3.2 ? 0 : -1.1 });
        pj(g, 'ella', final ? 'enojo' : t < 3.2 ? 'desmayo' : 'susto', 370, { izq: true, giro: final || t > 3.2 ? 0 : 1.1 });
        if (t < 3.2) {
          mareo(g, 190, 190, t);
          mareo(g, 410, 190, t + 1);
          if (t < choque + 0.5) texto(g, '¡TOING!', 300, 110, 26, '#ffd23f');
        }
        // El perrito pasa corriendo y se la lleva
        const kp = ent(t, 2.5, 4.4);
        if (kp > 0 && kp < 1) {
          const xp = lerp(-40, 660, kp);
          emoji(g, '🐶', xp, 196 - Math.abs(Math.sin(t * 16)) * 6, 38, 0);
          if (xp > 300) {
            g.fillStyle = '#f2d38a';
            g.beginPath();
            g.ellipse(xp + 18, 196, 12, 5, 0, 0, Math.PI * 2);
            g.fill();
          }
        }
        if (final) texto(g, '¡Nooo, mi arepa!', 300, 40, 18, '#fff');
      }
    },
  },
  {
    nombre: 'Selfie',
    dur: 5.4,
    poses: ambos('pulgares', 'beso', 'risa_a', 'enojo', 'susto', 'musculo'),
    dibujar(g, t) {
      const fotos = [1.2, 2.8, 4.4];
      const n = fotos.filter((f) => t > f).length;
      const poses: [string, string][] = [['pulgares', 'pulgares'], ['beso', 'beso'], ['enojo', 'susto'], ['musculo', 'risa_a']];
      pj(g, 'el', poses[n][0], 250);
      pj(g, 'ella', poses[n][1], 350, { izq: true });
      emoji(g, '🤳', 300, 60, 28);
      for (const f of fotos) {
        const k = ent(t, f, f + 0.35);
        if (k > 0 && k < 1) {
          g.fillStyle = `rgba(255,255,255,${0.85 * (1 - k)})`;
          g.fillRect(0, 0, ANCHO, ALTO);
        }
      }
      if (t > 2.8 && t < 4.4) texto(g, '¡Cara de bravos!', 300, 26, 16, '#fff');
    },
  },
];

// ---------------------------------------------------------------------------------------------- Arranque
function elegir(sin: string | null) {
  const opciones = ESCENAS.filter((e) => e.nombre !== sin);
  return opciones[Math.floor(Math.random() * opciones.length)];
}

/** Pone las escenitas en la pantalla de carga de esta página (y se apagan solas cuando se esconde). */
export function escenasDeCarga(seccion: HTMLElement | null = document.getElementById('carga')) {
  if (!seccion || seccion.querySelector('.carga-escena')) return;
  const caja = document.createElement('div');
  caja.className = 'carga-escena';
  caja.innerHTML = '<canvas></canvas><p></p>';
  seccion.insertBefore(caja, seccion.querySelector('.carga-riel'));
  seccion.classList.add('con-escena');
  const lienzo = caja.querySelector('canvas')!;
  const titulo = caja.querySelector('p')!;
  const g = lienzo.getContext('2d')!;
  let ultima: string | null = null;
  try {
    ultima = localStorage.getItem('carga-ultima');
  } catch {
    /* sin almacenamiento */
  }
  // ?escena=N pone una escena fija (pruebas)
  const forzada = Number(new URLSearchParams(location.search).get('escena'));
  let escena = forzada >= 1 && forzada <= ESCENAS.length ? ESCENAS[forzada - 1] : elegir(ultima);
  const cargar = (e: Escena) => e.poses.forEach(img);
  cargar(escena);
  const poner = (e: Escena) => {
    escena = e;
    titulo.textContent = e.nombre;
    try {
      localStorage.setItem('carga-ultima', e.nombre);
    } catch {
      /* sin almacenamiento */
    }
  };
  poner(escena);
  let t0 = performance.now();
  let cuadro = 0;
  let siguiente = elegir(escena.nombre);
  cargar(siguiente);
  const paso = (ms: number) => {
    // Cuando la pantalla de carga se va, se para
    if (!seccion.isConnected || seccion.hidden) return;
    requestAnimationFrame(paso);
    if (cuadro++ % 2) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(lienzo.clientWidth * dpr), h = Math.round(lienzo.clientHeight * dpr);
    if (!w || !h) return;
    if (lienzo.width !== w || lienzo.height !== h) {
      lienzo.width = w;
      lienzo.height = h;
    }
    let t = (ms - t0) / 1000;
    // Dos vueltas de cada escena y cambia a otra
    if (t > escena.dur * 2 && !forzada) {
      poner(siguiente);
      siguiente = elegir(escena.nombre);
      cargar(siguiente);
      t0 = ms;
      t = 0;
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, w, h);
    const k = Math.min(w / ANCHO, h / ALTO);
    g.setTransform(k, 0, 0, k, (w - ANCHO * k) / 2, (h - ALTO * k) / 2);
    // Piso
    g.fillStyle = 'rgba(255,255,255,0.22)';
    g.beginPath();
    g.ellipse(ANCHO / 2, PISO + 4, ANCHO * 0.48, 12, 0, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = Math.min(1, t * 4);
    escena.dibujar(g, t % escena.dur);
    g.globalAlpha = 1;
  };
  requestAnimationFrame(paso);
}

/** Para las pruebas: la lista de escenas y poner una a mano. */
export const ESCENAS_CARGA = ESCENAS.map((e) => e.nombre);

escenasDeCarga();
