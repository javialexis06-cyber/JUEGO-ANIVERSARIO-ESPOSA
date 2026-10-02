// Efectos de la cocina: vapor, humo, chispitas al acertar, salpicaduras, migas, granitos que caen, monedas y
// corazones. Un solo arreglo de partículas que se reusa (nada de crear objetos en cada cuadro) y unas «motas»
// suaves pre-dibujadas para el vapor y el humo.
import { G } from './dibujo';

export type TipoParticula =
  | 'vapor' | 'humo' | 'chispa' | 'estrella' | 'brillo' | 'gota' | 'miga' | 'grano' | 'moneda' | 'corazon' | 'confeti' | 'burbuja';

interface P {
  vivo: boolean;
  tipo: TipoParticula;
  x: number;
  y: number;
  vx: number;
  vy: number;
  vida: number;
  max: number;
  tam: number;
  color: string;
  rot: number;
  vr: number;
  /** En qué estación salió (-1: en todas). */
  en: number;
  /** Piso: donde se detiene al caer (granitos que caen sobre la comida). */
  piso: number;
}

const MAX = 420;

/** Mota suave (para vapor y humo) pre-dibujada una vez. */
function mota(color: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, color);
  gr.addColorStop(0.45, color.replace(/[\d.]+\)$/, (m) => `${parseFloat(m) * 0.55})`));
  gr.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return c;
}

export class Efectos {
  private p: P[] = Array.from({ length: MAX }, () => ({
    vivo: false, tipo: 'chispa', x: 0, y: 0, vx: 0, vy: 0, vida: 0, max: 1, tam: 1, color: '#fff', rot: 0, vr: 0, en: -1, piso: 1e9,
  }));
  private cursor = 0;
  private motaVapor = mota('rgba(255,255,255,0.75)');
  private motaHumo = mota('rgba(70,62,58,0.7)');
  private motaHumoClaro = mota('rgba(150,145,140,0.6)');
  private moneda = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 48;
    const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(17, 17, 2, 24, 24, 24);
    gr.addColorStop(0, '#fff6c2');
    gr.addColorStop(0.6, '#f2b52a');
    gr.addColorStop(1, '#b97a10');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(24, 24, 23, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(150,90,10,0.6)';
    g.lineWidth = 3;
    g.beginPath();
    g.arc(24, 24, 16, 0, Math.PI * 2);
    g.stroke();
    return c;
  })();
  /** Estación que se está mirando (las partículas de otra no se dibujan). */
  vista = 0;
  /** Menos partículas si el celular va lento. */
  calidad = 1;

  private nueva(tipo: TipoParticula, x: number, y: number, en: number): P | null {
    if (this.calidad < 1 && Math.random() > this.calidad) return null;
    for (let k = 0; k < MAX; k++) {
      const i = (this.cursor + k) % MAX;
      if (!this.p[i].vivo) {
        this.cursor = (i + 1) % MAX;
        const q = this.p[i];
        q.vivo = true;
        q.tipo = tipo;
        q.x = x;
        q.y = y;
        q.en = en;
        q.rot = Math.random() * 6.28;
        q.vr = 0;
        q.piso = 1e9;
        return q;
      }
    }
    return null;
  }

  limpiar() {
    for (const q of this.p) q.vivo = false;
  }

  /** Vaporcito que sube y se abre (de la wafflera, del café). */
  vapor(x: number, y: number, en = this.vista, fuerza = 1) {
    const q = this.nueva('vapor', x + (Math.random() - 0.5) * 30, y, en);
    if (!q) return;
    q.vx = (Math.random() - 0.5) * 18;
    q.vy = -40 - Math.random() * 30 * fuerza;
    q.vida = q.max = 1.6 + Math.random() * 0.8;
    q.tam = 14 + Math.random() * 10;
    q.vr = (Math.random() - 0.5) * 0.6;
  }
  /** Humo gris (o negro si se quemó). */
  humo(x: number, y: number, negro = false, en = this.vista) {
    const q = this.nueva('humo', x + (Math.random() - 0.5) * 30, y, en);
    if (!q) return;
    q.vx = (Math.random() - 0.5) * 24;
    q.vy = -50 - Math.random() * 40;
    q.vida = q.max = 1.8 + Math.random() * 0.6;
    q.tam = 16 + Math.random() * 12;
    q.color = negro ? 'n' : 'c';
    q.vr = (Math.random() - 0.5) * 0.8;
  }
  /** Explosión de chispitas/estrellas al acertar. */
  chispas(x: number, y: number, color = '#ffd23f', n = 14, tipo: TipoParticula = 'estrella', en = this.vista) {
    for (let i = 0; i < n; i++) {
      const q = this.nueva(tipo, x, y, en);
      if (!q) return;
      const a = Math.random() * Math.PI * 2, v = 140 + Math.random() * 260;
      q.vx = Math.cos(a) * v;
      q.vy = Math.sin(a) * v - 180;
      q.vida = q.max = 0.7 + Math.random() * 0.6;
      q.tam = tipo === 'confeti' ? 5 + Math.random() * 4 : 6 + Math.random() * 7;
      q.color = tipo === 'confeti' ? CONFETI[i % CONFETI.length] : color;
      q.vr = (Math.random() - 0.5) * 12;
    }
  }
  /** Destellos quietos que titilan (sobre un plato perfecto). */
  brillos(x: number, y: number, rx: number, ry: number, n = 6, en = this.vista) {
    for (let i = 0; i < n; i++) {
      const q = this.nueva('brillo', x + (Math.random() - 0.5) * 2 * rx, y + (Math.random() - 0.5) * 2 * ry, en);
      if (!q) return;
      q.vx = q.vy = 0;
      q.vida = q.max = 0.5 + Math.random() * 0.7;
      q.tam = 8 + Math.random() * 10;
      q.color = '#fffbe6';
    }
  }
  /** Salpicadura de gotas (jugo, crema, salsa) hacia arriba y a los lados. */
  salpicar(x: number, y: number, color: string, n = 8, fuerza = 1, en = this.vista) {
    for (let i = 0; i < n; i++) {
      const q = this.nueva('gota', x, y, en);
      if (!q) return;
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const v = (120 + Math.random() * 200) * fuerza;
      q.vx = Math.cos(a) * v;
      q.vy = Math.sin(a) * v;
      q.vida = q.max = 0.5 + Math.random() * 0.4;
      q.tam = 3 + Math.random() * 4;
      q.color = color;
    }
  }
  /** Migas (al morder) o pedacitos de hielo. */
  migas(x: number, y: number, color: string, n = 8, en = this.vista) {
    for (let i = 0; i < n; i++) {
      const q = this.nueva('miga', x, y, en);
      if (!q) return;
      const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 160;
      q.vx = Math.cos(a) * v;
      q.vy = Math.sin(a) * v - 120;
      q.vida = q.max = 0.6 + Math.random() * 0.5;
      q.tam = 2.5 + Math.random() * 3;
      q.color = color;
      q.vr = (Math.random() - 0.5) * 10;
    }
  }
  /** Un granito (chispita, azúcar, queso…) que cae desde (x, y) hasta yPiso. */
  grano(x: number, y: number, yPiso: number, color: string, tam: number, en = this.vista) {
    const q = this.nueva('grano', x, y, en);
    if (!q) return;
    q.vx = (Math.random() - 0.5) * 40;
    q.vy = 60 + Math.random() * 80;
    q.vida = q.max = 0.9;
    q.tam = tam;
    q.color = color;
    q.piso = yPiso;
    q.vr = (Math.random() - 0.5) * 14;
  }
  /** Monedas que saltan (propinas). */
  monedas(x: number, y: number, n = 6, en = this.vista) {
    for (let i = 0; i < n; i++) {
      const q = this.nueva('moneda', x, y, en);
      if (!q) return;
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6, v = 260 + Math.random() * 200;
      q.vx = Math.cos(a) * v;
      q.vy = Math.sin(a) * v;
      q.vida = q.max = 1.1 + Math.random() * 0.4;
      q.tam = 9 + Math.random() * 4;
    }
  }
  corazones(x: number, y: number, n = 6, en = this.vista) {
    for (let i = 0; i < n; i++) {
      const q = this.nueva('corazon', x + (Math.random() - 0.5) * 40, y, en);
      if (!q) return;
      q.vx = (Math.random() - 0.5) * 60;
      q.vy = -80 - Math.random() * 90;
      q.vida = q.max = 1.4 + Math.random() * 0.6;
      q.tam = 9 + Math.random() * 8;
      q.color = Math.random() < 0.5 ? '#ff6b8f' : '#ff9fb4';
    }
  }
  /** Burbujitas que suben adentro de un líquido (se dibujan como aros). */
  burbuja(x: number, y: number, techo: number, en = this.vista) {
    const q = this.nueva('burbuja', x, y, en);
    if (!q) return;
    q.vx = (Math.random() - 0.5) * 6;
    q.vy = -30 - Math.random() * 30;
    q.vida = q.max = Math.max(0.2, (y - techo) / 45);
    q.tam = 1.5 + Math.random() * 2.2;
  }

  paso(dt: number) {
    for (const q of this.p) {
      if (!q.vivo) continue;
      q.vida -= dt;
      if (q.vida <= 0) {
        q.vivo = false;
        continue;
      }
      q.rot += q.vr * dt;
      switch (q.tipo) {
        case 'vapor':
        case 'humo':
          q.x += q.vx * dt;
          q.y += q.vy * dt;
          q.vx *= 1 - dt * 0.6;
          q.vy *= 1 - dt * 0.35;
          q.tam += dt * (q.tipo === 'humo' ? 26 : 20);
          break;
        case 'brillo':
          break;
        case 'grano':
          if (q.y < q.piso) {
            q.vy += 900 * dt;
            q.x += q.vx * dt;
            q.y = Math.min(q.piso, q.y + q.vy * dt);
          } else q.vida = Math.min(q.vida, 0.08);
          break;
        case 'corazon':
        case 'burbuja':
          q.x += q.vx * dt + (q.tipo === 'corazon' ? Math.sin(q.vida * 6) * 0.6 : 0);
          q.y += q.vy * dt;
          break;
        default:
          q.vy += (q.tipo === 'confeti' ? 380 : 900) * dt;
          if (q.tipo === 'confeti') q.vx *= 1 - dt * 1.5;
          q.x += q.vx * dt;
          q.y += q.vy * dt;
      }
    }
  }

  dibujar(g: G) {
    for (const q of this.p) {
      if (!q.vivo || (q.en >= 0 && q.en !== this.vista)) continue;
      const k = q.vida / q.max;
      switch (q.tipo) {
        case 'vapor': {
          g.globalAlpha = Math.min(1, (1 - k) * 4) * k * 0.55;
          const s = q.tam * 2;
          g.drawImage(this.motaVapor, q.x - s / 2, q.y - s / 2, s, s);
          break;
        }
        case 'humo': {
          g.globalAlpha = Math.min(1, (1 - k) * 4) * k * 0.7;
          const s = q.tam * 2;
          g.drawImage(q.color === 'n' ? this.motaHumo : this.motaHumoClaro, q.x - s / 2, q.y - s / 2, s, s);
          break;
        }
        case 'estrella':
        case 'chispa': {
          g.globalAlpha = Math.min(1, k * 2.2);
          g.fillStyle = q.color;
          g.save();
          g.translate(q.x, q.y);
          g.rotate(q.rot);
          estrella(g, q.tam * (0.6 + k * 0.4));
          g.fill();
          g.restore();
          break;
        }
        case 'brillo': {
          const t = Math.sin((1 - k) * Math.PI);
          g.globalAlpha = t;
          g.fillStyle = q.color;
          g.save();
          g.translate(q.x, q.y);
          g.scale(t, t);
          destello(g, q.tam);
          g.restore();
          break;
        }
        case 'gota':
          g.globalAlpha = Math.min(1, k * 3);
          g.fillStyle = q.color;
          g.beginPath();
          g.ellipse(q.x, q.y, q.tam * 0.75, q.tam, Math.atan2(q.vy, q.vx) + Math.PI / 2, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = 'rgba(255,255,255,0.55)';
          g.beginPath();
          g.arc(q.x - q.tam * 0.25, q.y - q.tam * 0.3, q.tam * 0.28, 0, Math.PI * 2);
          g.fill();
          break;
        case 'miga':
        case 'grano':
        case 'confeti':
          g.globalAlpha = Math.min(1, k * 3);
          g.fillStyle = q.color;
          g.save();
          g.translate(q.x, q.y);
          g.rotate(q.rot);
          if (q.tipo === 'confeti') g.fillRect(-q.tam, -q.tam * 0.45, q.tam * 2, q.tam * 0.9);
          else if (q.tipo === 'grano') g.fillRect(-q.tam * 0.9, -q.tam * 0.32, q.tam * 1.8, q.tam * 0.64);
          else g.fillRect(-q.tam / 2, -q.tam / 2, q.tam, q.tam);
          g.restore();
          break;
        case 'moneda': {
          g.globalAlpha = Math.min(1, k * 3);
          const w = Math.abs(Math.cos(q.vida * 9)) * q.tam + 1.5;
          g.drawImage(this.moneda, q.x - w, q.y - q.tam, w * 2, q.tam * 2);
          break;
        }
        case 'corazon':
          g.globalAlpha = Math.min(1, k * 2);
          g.fillStyle = q.color;
          g.save();
          g.translate(q.x, q.y);
          g.scale(q.tam / 10, q.tam / 10);
          corazon(g);
          g.fill();
          g.restore();
          break;
        case 'burbuja':
          g.globalAlpha = Math.min(1, k * 4) * 0.7;
          g.strokeStyle = 'rgba(255,255,255,0.85)';
          g.lineWidth = 1;
          g.beginPath();
          g.arc(q.x, q.y, q.tam, 0, Math.PI * 2);
          g.stroke();
          break;
      }
    }
    g.globalAlpha = 1;
  }
}

const CONFETI = ['#ff5d8f', '#ffd23f', '#3ec1d3', '#7ed957', '#b57cff', '#ff8c42'];

export function estrella(g: G, r: number) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  g.closePath();
}
/** Destello de cuatro puntas (brillito). */
export function destello(g: G, r: number) {
  g.beginPath();
  g.moveTo(0, -r);
  g.quadraticCurveTo(r * 0.12, -r * 0.12, r, 0);
  g.quadraticCurveTo(r * 0.12, r * 0.12, 0, r);
  g.quadraticCurveTo(-r * 0.12, r * 0.12, -r, 0);
  g.quadraticCurveTo(-r * 0.12, -r * 0.12, 0, -r);
  g.fill();
}
export function corazon(g: G) {
  g.beginPath();
  g.moveTo(0, 4);
  g.bezierCurveTo(-10, -4, -5, -11, 0, -5);
  g.bezierCurveTo(5, -11, 10, -4, 0, 4);
}

/** Un barrido de brillo que cruza un plato perfecto (k de 0 a 1), recortado a una elipse. */
export function barridoBrillo(g: G, x: number, y: number, rx: number, ry: number, k: number) {
  if (k <= 0 || k >= 1) return;
  g.save();
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.clip();
  const bx = x - rx * 1.6 + k * rx * 3.2;
  const gr = g.createLinearGradient(bx - 60, y - ry, bx + 60, y + ry);
  gr.addColorStop(0, 'rgba(255,255,255,0)');
  gr.addColorStop(0.5, 'rgba(255,255,255,0.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.globalCompositeOperation = 'lighter';
  g.fillRect(x - rx, y - ry * 1.5, rx * 2, ry * 3);
  g.restore();
}
