// Recuerdos flotantes: mientras se bañan (o se quedan abrazados en la cama) sale una burbuja con un dibujito
// animado de los dos y lo que se dijeron. Los recuerdos son los de verdad (los mismos de Cien Puertas); en la
// cama se mezclan con discusiones bobas y deseos a futuro. Cada uno dura de 10 a 15 s y salen al azar.
import './recuerdos.css';
import { type Dicho, RECUERDOS } from '../puertas/historia';
import { esc } from './ui_casa';

export type ModoRecuerdos = 'bano' | 'cama';

interface Vineta {
  titulo: string;
  sub?: string;
  dibujo: string;
  lineas: Dicho[];
}

/** Discusiones bobas (las de siempre: nunca se ponen de acuerdo en cómo pasó). */
const DISCUSIONES: Vineta[] = [
  { titulo: '¿Treinta días o cuarenta?', dibujo: 'calendario', lineas: [['ella', 'Fueron como treinta días.'], ['el', 'Cuarenta. Del 15 de septiembre al 25 de octubre.'], ['ella', 'Bueno… pero se sintieron como treinta.'], ['el', 'Los conté todos.']] },
  { titulo: '¿Insistente o persistente?', dibujo: 'birrete', lineas: [['ella', 'Eras insistente.'], ['el', 'Persistente.'], ['ella', 'Insistente.'], ['el', 'Y funcionó, ¿o no?']] },
  { titulo: '¿Ocho horas o nueve?', dibujo: 'bus', lineas: [['el', 'De Sopetrán a Bucaramanga son ocho horas.'], ['ella', 'Nueve, si el bus para.'], ['el', 'Siempre para.'], ['ella', 'Entonces son nueve.']] },
  { titulo: '¿Quién miraba a quién?', dibujo: 'estrellas', lineas: [['ella', 'En el planetario me mirabas a mí.'], ['el', 'Yo miraba las estrellas.'], ['ella', '¿Y cuál constelación era?'], ['el', '…la más bonita. Tú.']] },
  { titulo: '¿Katherine o Lexy Katherine?', dibujo: 'familia', lineas: [['el', 'Se va a llamar Katherine.'], ['ella', 'Lexy Katherine.'], ['el', 'Katherine.'], ['ella', 'LEXY Katherine.'], ['el', '…Lexy Katherine.']] },
  { titulo: '¿Las completamos o no?', dibujo: 'videollamada', lineas: [['ella', 'Completamos las 24 horas de videollamada.'], ['el', 'Casi.'], ['ella', '¡Las completamos!'], ['el', 'Tú te dormiste en la hora veinte.']] },
  { titulo: '¿Estafa o no estafa?', dibujo: 'raton', lineas: [['el', 'Me querías estafar.'], ['ella', '¡Solo un poquito!'], ['el', 'Y te salió al revés.'], ['ella', 'Me estafaste el corazón.']] },
  { titulo: '¿Era o eres?', dibujo: 'ojos', lineas: [['el', 'La primera vez que te vi, eras perfecta.'], ['ella', '¿Era?'], ['el', 'Eres. Eres perfecta.'], ['ella', 'Así me gusta.']] },
  { titulo: '¿Estudiábamos o explicabas?', dibujo: 'lapiz', lineas: [['ella', 'Para el ICFES estudiábamos juntos.'], ['el', 'Yo explicaba.'], ['ella', 'Y yo te miraba explicar. Eso también es estudiar.']] },
  { titulo: '¿Quién pagó?', dibujo: 'copa', lineas: [['ella', 'Ese restaurante de súper lujo… ¿quién lo pagó?'], ['el', 'Mejor hablemos de otra cosa.'], ['ella', 'Jajaja, ¡cobarde!']] },
  { titulo: '¿Las luces o tus ojos?', dibujo: 'luces', lineas: [['el', 'Las luces de diciembre estaban lindas.'], ['ella', '¿Más que yo?'], ['el', 'Yo solo te miraba a ti.']] },
];

/** Deseos a futuro (lo que sueñan los dos). */
const DESEOS: Vineta[] = [
  { titulo: 'Algún día…', sub: 'Nuestra niña', dibujo: 'familia', lineas: [['ella', 'Una niña con tus ojos…'], ['el', '…y tu risa.'], ['ella', 'Y que duerma en la camita entre los dos.']] },
  { titulo: 'Algún día…', sub: 'Nuestra casita', dibujo: 'casa', lineas: [['el', 'Una casita propia, con jardín.'], ['ella', 'Y con un sofá grande para ver pelis.'], ['el', 'Y que siempre huela a desayuno.']] },
  { titulo: 'Algún día…', sub: 'Volver a Cartagena', dibujo: 'ola', lineas: [['ella', 'Volver a Cartagena.'], ['el', 'Esta vez sin dormir en la banca del aeropuerto.'], ['ella', '¡Y otra vez la moto acuática!']] },
  { titulo: 'Algún día…', sub: 'La graduación', dibujo: 'birrete', lineas: [['el', 'Verte graduada de psicóloga.'], ['ella', 'Y tú en primera fila gritando mi nombre.'], ['el', 'Con pancarta y todo.']] },
  { titulo: 'Algún día…', sub: 'Sin distancia', dibujo: 'bus', lineas: [['ella', 'Que ya no haya que contar horas de bus.'], ['el', 'Que el único viaje sea de la cama a la cocina.'], ['ella', 'Juntos, todos los días.']] },
  { titulo: 'Algún día…', sub: 'Todos los diciembres', dibujo: 'luces', lineas: [['el', 'Ver las luces de diciembre cada año.'], ['ella', 'Y tomarnos la misma foto, año tras año.']] },
  { titulo: 'Algún día…', sub: 'Viejitos', dibujo: 'casa', lineas: [['ella', 'Viejitos, jugando parchís en el patio.'], ['el', 'Y yo dejándote ganar.'], ['ella', '¡Tú nunca me dejas ganar!']] },
];

const MEMORIAS: Vineta[] = RECUERDOS.map((r) => ({ titulo: r.titulo, sub: r.fecha, dibujo: r.icono, lineas: r.dialogo }));

export class PanelRecuerdos {
  private raiz: HTMLElement;
  private lienzo: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;
  private modo: ModoRecuerdos | null = null;
  private actual: Vineta | null = null;
  private lineas: Dicho[] = [];
  private t0 = 0;
  private dur = 12;
  private linea = -1;
  private recientes: string[] = [];
  private cuadro = 0;
  private cerrado = false;

  constructor() {
    this.raiz = document.createElement('aside');
    this.raiz.className = 'recuerdo';
    this.raiz.hidden = true;
    this.raiz.innerHTML = `
      <button class="recuerdo-cerrar" aria-label="Cerrar">✕</button>
      <header><b class="recuerdo-titulo"></b><small class="recuerdo-sub"></small></header>
      <canvas width="640" height="340"></canvas>
      <p class="recuerdo-linea"></p>`;
    document.body.append(this.raiz);
    this.lienzo = this.raiz.querySelector('canvas')!;
    this.g = this.lienzo.getContext('2d')!;
    this.raiz.querySelector('.recuerdo-cerrar')!.addEventListener('click', () => {
      this.cerrado = true;
      this.ocultar();
    });
  }

  /** Empieza (o sigue) a pasar recuerdos. Si lo cerraron con la ✕, no vuelve hasta la próxima vez. */
  mostrar(modo: ModoRecuerdos) {
    if (this.modo === modo || this.cerrado) return;
    this.modo = modo;
    this.raiz.hidden = false;
    this.raiz.dataset.modo = modo;
    this.siguiente();
    cancelAnimationFrame(this.cuadro);
    const bucle = (ms: number) => {
      if (!this.modo) return;
      this.cuadro = requestAnimationFrame(bucle);
      this.pintar(ms / 1000);
    };
    this.cuadro = requestAnimationFrame(bucle);
  }

  ocultar() {
    this.modo = null;
    this.raiz.hidden = true;
    cancelAnimationFrame(this.cuadro);
  }

  /** Terminó el baño o se despertaron: la ✕ vale solo para esa vez. */
  reiniciar() {
    this.cerrado = false;
    this.ocultar();
  }

  get visible() {
    return !!this.modo;
  }

  private siguiente() {
    const lista = this.modo === 'cama' ? [...MEMORIAS, ...DISCUSIONES, ...DISCUSIONES, ...DESEOS, ...DESEOS] : MEMORIAS;
    const libres = lista.filter((v) => !this.recientes.includes(v.titulo + (v.sub ?? '')));
    const v = (libres.length ? libres : lista)[Math.floor(Math.random() * (libres.length || lista.length))];
    this.recientes = [...this.recientes, v.titulo + (v.sub ?? '')].slice(-8);
    this.actual = v;
    // De 10 a 15 segundos: unas 4 o 5 frases (las de más se dejan para otra vez)
    const n = Math.min(v.lineas.length, 5);
    const desde = v.lineas.length > n ? Math.floor(Math.random() * (v.lineas.length - n + 1)) : 0;
    this.lineas = v.lineas.slice(desde, desde + n);
    this.dur = Math.min(15, Math.max(10, 1.6 + this.lineas.length * 2.6));
    this.t0 = performance.now() / 1000;
    this.linea = -1;
    const tipo = DISCUSIONES.includes(v) ? 'Discusión boba' : DESEOS.includes(v) ? v.sub ?? '' : v.sub ?? '';
    this.raiz.querySelector('.recuerdo-titulo')!.textContent = v.titulo;
    this.raiz.querySelector('.recuerdo-sub')!.textContent = tipo;
    this.raiz.classList.remove('entra');
    void this.raiz.offsetWidth;
    this.raiz.classList.add('entra');
  }

  private pintar(t: number) {
    const v = this.actual;
    if (!v) return;
    const k = t - this.t0;
    if (k > this.dur) return this.siguiente();
    // Las frases van saliendo una tras otra después del título
    const i = Math.min(this.lineas.length - 1, Math.floor(Math.max(0, k - 1.2) / ((this.dur - 1.2) / this.lineas.length)));
    if (i !== this.linea && k > 1.2) {
      this.linea = i;
      const [quien, texto] = this.lineas[i];
      const p = this.raiz.querySelector<HTMLElement>('.recuerdo-linea')!;
      p.innerHTML = `<span class="quien-${quien}">${quien === 'el' ? 'Él' : 'Ella'}</span>${esc(forma(texto, quien))}`;
      p.classList.remove('sale');
      void p.offsetWidth;
      p.classList.add('sale');
    }
    const g = this.g;
    g.save();
    g.scale(2, 2);
    const habla = this.linea >= 0 ? this.lineas[this.linea][0] : null;
    (DIBUJOS[v.dibujo] ?? DIBUJOS.casa)(g, k, habla);
    g.restore();
  }
}

/** «orgullos{a|o}»: la primera forma cuando habla Ella, la segunda cuando habla Él. */
const forma = (texto: string, quien: 'el' | 'ella') => texto.replace(/\{([^|}]*)\|([^}]*)\}/g, (_, a, o) => (quien === 'ella' ? a : o));

// ------------------------------------------------------------------ Dibujitos (320 × 170)
type Dibujo = (g: CanvasRenderingContext2D, t: number, habla: 'el' | 'ella' | null) => void;
const W = 320, H = 170;

function fondo(g: CanvasRenderingContext2D, a: string, b: string) {
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, a);
  gr.addColorStop(1, b);
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
}

function corazon(g: CanvasRenderingContext2D, x: number, y: number, r: number, color = '#e4574b') {
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(x, y + r * 0.9);
  g.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.8, y - r * 1.4, x, y - r * 0.5);
  g.bezierCurveTo(x + r * 0.8, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
  g.fill();
}

function estrella(g: CanvasRenderingContext2D, x: number, y: number, r: number, color = '#f6cf5a') {
  g.fillStyle = color;
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.fill();
}

function texto(g: CanvasRenderingContext2D, s: string, x: number, y: number, tam = 14, color = '#3d2b27') {
  g.fillStyle = color;
  g.font = `700 ${tam}px Fredoka, Nunito, sans-serif`;
  g.textAlign = 'center';
  g.fillText(s, x, y);
}

/** Él o Ella de cuerpo entero chiquito (cabezón), con la boca abierta si está hablando. */
function nino(g: CanvasRenderingContext2D, x: number, y: number, ella: boolean, o: { s?: number; habla?: boolean; guino?: boolean; dormido?: boolean; mira?: number; brazos?: number } = {}) {
  const s = o.s ?? 1;
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  // Cuerpo
  g.fillStyle = ella ? '#2b2a2a' : '#2b2a2a';
  g.beginPath();
  g.ellipse(0, 30, 14, 16, 0, 0, Math.PI * 2);
  g.fill();
  if (!ella) {
    g.fillStyle = '#4aa3d9';
    g.fillRect(-12, 38, 24, 12);
  } else {
    g.fillStyle = '#f3efe7';
    g.fillRect(-7, 18, 14, 18);
  }
  // Brazos
  const b = o.brazos ?? 0;
  g.strokeStyle = '#f2c9a8';
  g.lineWidth = 6;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-12, 24);
  g.lineTo(-20, 34 - b * 22);
  g.moveTo(12, 24);
  g.lineTo(20, 34 - b * 22);
  g.stroke();
  // Pelo de atrás (Ella lo tiene largo)
  g.fillStyle = '#231815';
  if (ella) {
    g.beginPath();
    g.ellipse(0, 4, 27, 33, 0, 0, Math.PI * 2);
    g.fill();
  }
  // Cara
  g.fillStyle = '#f2c9a8';
  g.beginPath();
  g.arc(0, 0, 21, 0, Math.PI * 2);
  g.fill();
  // Flequillo / pelo de arriba
  g.fillStyle = '#231815';
  g.beginPath();
  g.ellipse(0, -11, 23, 13, 0, Math.PI, Math.PI * 2);
  g.fill();
  if (!ella) {
    for (let i = -2; i <= 2; i++) {
      g.beginPath();
      g.arc(i * 8, -16, 8, 0, Math.PI * 2);
      g.fill();
    }
  }
  // Ojos
  const m = o.mira ?? 0;
  g.fillStyle = '#231815';
  if (o.dormido) {
    g.fillRect(-11 + m, 1, 7, 2);
    g.fillRect(4 + m, 1, 7, 2);
  } else {
    g.beginPath();
    g.arc(-7 + m, 2, 3.2, 0, Math.PI * 2);
    if (o.guino) g.fillRect(4 + m, 1, 7, 2);
    else g.arc(7 + m, 2, 3.2, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(-6 + m, 1, 1.1, 0, Math.PI * 2);
    if (!o.guino) g.arc(8 + m, 1, 1.1, 0, Math.PI * 2);
    g.fill();
  }
  // Boca y rubor
  g.beginPath();
  if (o.habla) {
    g.fillStyle = '#b8403a';
    g.ellipse(m, 11, 3.5, 3, 0, 0, Math.PI * 2);
    g.fill();
  } else {
    g.strokeStyle = '#b8403a';
    g.lineWidth = 1.6;
    g.arc(m, 9, 3.5, 0.15 * Math.PI, 0.85 * Math.PI);
    g.stroke();
  }
  g.fillStyle = 'rgba(232,106,138,0.5)';
  g.beginPath();
  g.arc(-13, 9, 3.5, 0, Math.PI * 2);
  g.arc(13, 9, 3.5, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/** Los dos juntos, meciéndose, el que habla con la boca abierta. */
function pareja(g: CanvasRenderingContext2D, t: number, habla: 'el' | 'ella' | null, x1 = 120, x2 = 200, y = 100, s = 1) {
  nino(g, x1, y + Math.sin(t * 2.2) * 2, false, { s, habla: habla === 'el' && Math.sin(t * 14) > 0, mira: 2 });
  nino(g, x2, y + Math.sin(t * 2.2 + 1) * 2, true, { s, habla: habla === 'ella' && Math.sin(t * 14) > 0, mira: -2 });
}

function corazonesQueSuben(g: CanvasRenderingContext2D, t: number, n = 4, color = 'rgba(228,87,75,0.7)') {
  for (let i = 0; i < n; i++) {
    const k = (t * 0.3 + i / n) % 1;
    g.globalAlpha = 1 - k;
    corazon(g, 40 + ((i * 83) % 240), H - k * H, 5 + (i % 3), color);
  }
  g.globalAlpha = 1;
}

const DIBUJOS: Record<string, Dibujo> = {
  raton(g, t, h) {
    fondo(g, '#f7e3c6', '#e7c79c');
    texto(g, 'Villa', 160, 26, 16, '#8a5634');
    // Dos ratoncitos alrededor de un queso
    for (const [x, gris, dir] of [[110, '#9b9b9b', 1], [210, '#c8b8a8', -1]] as const) {
      const y = 112 + Math.abs(Math.sin(t * 5 + x)) * -6;
      g.fillStyle = gris;
      g.beginPath();
      g.ellipse(x, y, 24, 17, 0, 0, Math.PI * 2);
      g.arc(x + 16 * dir, y - 15, 9, 0, Math.PI * 2);
      g.arc(x - 4 * dir, y - 18, 9, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#231815';
      g.beginPath();
      g.arc(x + 20 * dir, y - 2, 2.5, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#f6cf5a';
    g.beginPath();
    g.moveTo(140, 132);
    g.lineTo(180, 132);
    g.lineTo(180, 112);
    g.closePath();
    g.fill();
    corazon(g, 160, 72 + Math.sin(t * 5) * 3, 10 + Math.sin(t * 6) * 2);
    if (h) texto(g, h === 'el' ? '¿estafa?' : '¡un poquito!', h === 'el' ? 95 : 225, 70, 12, '#7a625a');
  },
  charla(g, t, h) {
    fondo(g, '#2d2150', '#5b3f78');
    pareja(g, t, h, 110, 210, 105);
    const simbolos = ['π', '∑', '√', '∞', '?', '♥'];
    for (let i = 0; i < 6; i++) {
      const k = (t * 0.25 + i / 6) % 1;
      g.globalAlpha = 1 - k;
      texto(g, simbolos[i], 110 + ((i * 47) % 100), 70 - k * 60, 16, '#fff6c9');
    }
    g.globalAlpha = 1;
  },
  lupa(g, t, h) {
    fondo(g, '#cfe9ff', '#9ccbef');
    nino(g, 230, 100, true, { habla: h === 'ella' && Math.sin(t * 14) > 0, mira: -3 });
    const x = 90 + Math.sin(t * 1.2) * 60, y = 80 + Math.cos(t * 1.7) * 20;
    g.strokeStyle = '#8a5634';
    g.lineWidth = 6;
    g.beginPath();
    g.arc(x, y, 20, 0, Math.PI * 2);
    g.moveTo(x + 14, y + 14);
    g.lineTo(x + 32, y + 32);
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.beginPath();
    g.arc(x, y, 17, 0, Math.PI * 2);
    g.fill();
    texto(g, '?', x, y + 6, 18, '#3d2b27');
  },
  calendario(g, t) {
    fondo(g, '#fff8ee', '#f4b6c2');
    const dia = 15 + Math.min(40, Math.floor((t % 8) * 7));
    const fecha = dia <= 30 ? `${dia} sep` : `${dia - 30} oct`;
    g.fillStyle = '#fff';
    g.fillRect(110, 30, 100, 110);
    g.fillStyle = '#e4574b';
    g.fillRect(110, 30, 100, 26);
    texto(g, fecha, 160, 100, 26);
    if (dia >= 55) corazon(g, 160, 125, 10 + Math.sin(t * 8) * 2);
  },
  videollamada(g, t, h) {
    fondo(g, '#1d1629', '#3b2a55');
    for (const [x, ella] of [[95, false], [225, true]] as const) {
      g.fillStyle = '#f3efe7';
      g.fillRect(x - 45, 25, 90, 125);
      g.fillStyle = '#8fc7e8';
      g.fillRect(x - 40, 32, 80, 110);
      nino(g, x, 82, ella, { s: 0.9, habla: h === (ella ? 'ella' : 'el') && Math.sin(t * 14) > 0, dormido: t % 10 > 8 });
    }
    // El reloj da vueltas: 24 horas
    g.strokeStyle = '#fff6c9';
    g.lineWidth = 3;
    g.beginPath();
    g.arc(160, 40, 14, 0, Math.PI * 2);
    g.moveTo(160, 40);
    g.lineTo(160 + Math.cos(t * 3) * 10, 40 + Math.sin(t * 3) * 10);
    g.stroke();
    texto(g, '24 h', 160, 72, 12, '#fff6c9');
  },
  lapiz(g, t, h) {
    fondo(g, '#fff8ee', '#eadfce');
    g.fillStyle = '#fff';
    g.fillRect(95, 110, 130, 50);
    g.strokeStyle = '#9ccbef';
    g.lineWidth = 1;
    for (let y = 120; y < 160; y += 8) {
      g.beginPath();
      g.moveTo(95, y);
      g.lineTo(225, y);
      g.stroke();
    }
    g.strokeStyle = '#3d2b27';
    g.lineWidth = 2;
    g.beginPath();
    for (let x = 100; x < 100 + ((t * 40) % 120); x += 4) g.lineTo(x, 125 + Math.sin(x) * 3);
    g.stroke();
    pareja(g, t, h, 70, 250, 75, 0.9);
  },
  birrete(g, t, h) {
    fondo(g, '#e8f6ef', '#8fd3b6');
    pareja(g, t, h, 110, 210, 110);
    const y = 50 - Math.abs(Math.sin(t * 1.5)) * 30;
    g.fillStyle = '#231815';
    g.save();
    g.translate(210, y);
    g.rotate(Math.sin(t * 3) * 0.4);
    g.fillRect(-20, -4, 40, 8);
    g.fillRect(-10, 2, 20, 10);
    g.restore();
    for (let i = 0; i < 12; i++) {
      g.fillStyle = ['#e4574b', '#f6cf5a', '#9ccbef', '#f4b6c2'][i % 4];
      g.fillRect((i * 29 + t * 30) % W, (i * 17 + t * 50) % 80, 4, 6);
    }
  },
  ojos(g, t, h) {
    fondo(g, '#ffe8ef', '#f4b6c2');
    const k = Math.min(1, (t % 12) / 4);
    nino(g, 60 + k * 70, 105, false, { habla: h === 'el' && Math.sin(t * 14) > 0, mira: 3 });
    nino(g, 260 - k * 70, 105, true, { habla: h === 'ella' && Math.sin(t * 14) > 0, mira: -3 });
    if (k >= 1) {
      for (let i = 0; i < 6; i++) estrella(g, 160 + Math.cos(t * 2 + i) * 40, 60 + Math.sin(t * 2 + i) * 20, 5);
      corazon(g, 160, 50, 12 + Math.sin(t * 6) * 2);
    }
  },
  trofeo(g, t) {
    fondo(g, '#fff4d6', '#f6cf5a');
    const k = Math.min(1, (t % 10) / 6);
    g.fillStyle = '#fff';
    g.fillRect(60, 130, 200, 16);
    g.fillStyle = '#e86a8a';
    g.fillRect(60, 130, 200 * k, 16);
    texto(g, `${Math.round(k * 100)} %`, 160, 122, 14);
    g.fillStyle = '#e0a82e';
    g.beginPath();
    g.moveTo(135, 40);
    g.lineTo(185, 40);
    g.lineTo(175, 80);
    g.lineTo(145, 80);
    g.closePath();
    g.fill();
    g.fillRect(155, 80, 10, 16);
    g.fillRect(142, 96, 36, 8);
    if (k >= 1) texto(g, '¡Meta cumplida!', 160, 30, 14, '#b93d33');
  },
  ola(g, t, h) {
    fondo(g, '#9ccbef', '#fff1d6');
    g.fillStyle = '#f6cf5a';
    g.beginPath();
    g.arc(260, 40, 18, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#4aa3d9';
    g.beginPath();
    g.moveTo(0, H);
    for (let x = 0; x <= W; x += 10) g.lineTo(x, 118 + Math.sin(x / 20 + t * 2) * 6);
    g.lineTo(W, H);
    g.fill();
    // La moto acuática saltando las olas
    const x = (t * 50) % (W + 60) - 30;
    g.fillStyle = '#e4574b';
    g.beginPath();
    g.ellipse(x, 112 + Math.sin(t * 4) * 5, 22, 7, 0, 0, Math.PI * 2);
    g.fill();
    pareja(g, t, h, 80, 140, 70, 0.6);
  },
  flor(g, t) {
    const k = Math.min(1, (t % 12) / 6);
    fondo(g, k < 0.5 ? '#a9a9b3' : '#cfe9ff', k < 0.5 ? '#c7c1ba' : '#fff1d6');
    g.fillStyle = '#6ab04c';
    g.fillRect(158, 150 - k * 70, 4, k * 70);
    if (k > 0.6) {
      for (let i = 0; i < 6; i++) {
        g.fillStyle = '#f4b6c2';
        g.beginPath();
        g.arc(160 + Math.cos((i * Math.PI) / 3 + t) * 12, 80 + Math.sin((i * Math.PI) / 3 + t) * 12, 9, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = '#f6cf5a';
      g.beginPath();
      g.arc(160, 80, 8, 0, Math.PI * 2);
      g.fill();
    }
    if (k > 0.8) estrella(g, 250, 40, 14 + Math.sin(t * 4) * 2);
  },
  luces(g, t, h) {
    fondo(g, '#141a33', '#2d2150');
    for (let i = 0; i < 18; i++) {
      const x = 10 + i * 18, y = 30 + Math.sin(i * 0.7) * 10;
      g.fillStyle = `hsl(${(i * 40 + t * 80) % 360} 90% ${Math.sin(t * 5 + i) > 0 ? 65 : 45}%)`;
      g.beginPath();
      g.arc(x, y, 4, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#1d1629';
    for (let i = 0; i < 8; i++) g.fillRect(i * 42, 120 - ((i * 37) % 40), 36, 60);
    pareja(g, t, h, 125, 195, 105, 0.8);
  },
  bus(g, t) {
    fondo(g, '#cfe9ff', '#bfe9d8');
    g.fillStyle = '#8fd3b6';
    g.beginPath();
    g.moveTo(0, 130);
    for (let x = 0; x <= W; x += 40) g.lineTo(x, 90 + ((x * 13) % 30));
    g.lineTo(W, 130);
    g.fill();
    g.fillStyle = '#7a625a';
    g.fillRect(0, 128, W, 12);
    const x = (t * 40) % (W + 80) - 60;
    g.fillStyle = '#e4574b';
    g.fillRect(x, 100, 70, 28);
    g.fillStyle = '#cfe9ff';
    for (let i = 0; i < 4; i++) g.fillRect(x + 6 + i * 16, 105, 11, 9);
    g.fillStyle = '#231815';
    g.beginPath();
    g.arc(x + 15, 130, 6, 0, Math.PI * 2);
    g.arc(x + 55, 130, 6, 0, Math.PI * 2);
    g.fill();
    for (let i = 1; i < 4; i++) corazon(g, x - i * 18, 110 + Math.sin(t * 5 + i) * 4, 4, 'rgba(228,87,75,0.6)');
    texto(g, 'Sopetrán', 45, 160, 11);
    texto(g, 'Bucaramanga', 265, 160, 11);
  },
  antifaz(g, t, h) {
    fondo(g, '#2b1d3a', '#5b3f78');
    pareja(g, t, h, 120, 200, 105);
    for (const x of [120, 200]) {
      g.fillStyle = x < 160 ? '#231815' : '#b93d33';
      g.beginPath();
      g.ellipse(x - 8, 102, 9, 6, 0, 0, Math.PI * 2);
      g.ellipse(x + 8, 102, 9, 6, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#fff1b8';
    g.beginPath();
    g.arc(60, 40, 16, 0, Math.PI * 2);
    g.fill();
    estrella(g, 270, 40, 8 + Math.sin(t * 4) * 2, '#fff6c9');
  },
  copa(g, t, h) {
    fondo(g, '#fff4d6', '#f4b6c2');
    pareja(g, t, h, 100, 220, 105);
    const k = Math.sin(t * 2) * 6;
    for (const [x, d] of [[140 + k, 1], [180 - k, -1]] as const) {
      g.strokeStyle = '#9ccbef';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(x - 8 * d, 60);
      g.lineTo(x, 80);
      g.lineTo(x + 8 * d, 60);
      g.moveTo(x, 80);
      g.lineTo(x, 95);
      g.stroke();
    }
    if (Math.abs(k) > 5.5) estrella(g, 160, 55, 7);
    // La corona de la reina
    g.fillStyle = '#e0a82e';
    g.beginPath();
    g.moveTo(205, 72);
    g.lineTo(210, 60);
    g.lineTo(216, 70);
    g.lineTo(220, 58);
    g.lineTo(224, 70);
    g.lineTo(230, 60);
    g.lineTo(235, 72);
    g.closePath();
    g.fill();
  },
  castillo(g, t, h) {
    fondo(g, '#e8dcff', '#f4b6c2');
    g.fillStyle = '#fff8ee';
    g.fillRect(40, 60, 80, 90);
    for (const x of [40, 100]) {
      g.fillRect(x, 40, 20, 110);
      g.fillStyle = '#e86a8a';
      g.beginPath();
      g.moveTo(x - 4, 40);
      g.lineTo(x + 10, 18);
      g.lineTo(x + 24, 40);
      g.fill();
      g.fillStyle = '#fff8ee';
    }
    pareja(g, t, h, 190, 260, 105, 0.9);
    for (let i = 0; i < 5; i++) estrella(g, 60 + i * 55, 20 + Math.sin(t * 3 + i) * 6, 4, '#fff6c9');
  },
  estrellas(g, t, h) {
    fondo(g, '#0f1433', '#2d2150');
    for (let i = 0; i < 40; i++) {
      g.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i));
      estrella(g, (i * 71 + t * 6) % W, (i * 37) % 100, 2.4, '#fff6c9');
    }
    g.globalAlpha = 1;
    // Uno mira las estrellas, el otro la mira a ella
    nino(g, 125, 120, false, { habla: h === 'el' && Math.sin(t * 14) > 0, mira: 4 });
    nino(g, 195, 120, true, { habla: h === 'ella' && Math.sin(t * 14) > 0, mira: 0 });
  },
  casa(g, t, h) {
    fondo(g, '#fff1d6', '#bfe9d8');
    g.fillStyle = '#f4b6c2';
    g.fillRect(40, 80, 90, 70);
    g.fillStyle = '#e4574b';
    g.beginPath();
    g.moveTo(30, 82);
    g.lineTo(85, 40);
    g.lineTo(140, 82);
    g.fill();
    g.fillStyle = '#8a5634';
    g.fillRect(75, 115, 20, 35);
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.4 + i / 3) % 1;
      g.globalAlpha = 1 - k;
      corazon(g, 110 + k * 10, 50 - k * 40, 5 + k * 4, '#e86a8a');
    }
    g.globalAlpha = 1;
    pareja(g, t, h, 200, 265, 105, 0.9);
  },
  anillo(g, t, h) {
    fondo(g, '#2d2150', '#5b3f78');
    pareja(g, t, h, 100, 220, 110);
    const abre = Math.min(1, (t % 12) / 3);
    g.fillStyle = '#b93d33';
    g.fillRect(142, 110, 36, 22);
    g.save();
    g.translate(142, 110);
    g.rotate(-abre * 1.9);
    g.fillRect(0, -10, 36, 10);
    g.restore();
    if (abre > 0.6) {
      g.strokeStyle = '#e0a82e';
      g.lineWidth = 3;
      g.beginPath();
      g.arc(160, 104, 8, 0, Math.PI * 2);
      g.stroke();
      estrella(g, 160, 92, 5 + Math.sin(t * 8) * 1.5, '#cfe9ff');
      for (let i = 0; i < 5; i++) estrella(g, 160 + Math.cos(t + i * 1.3) * 34, 80 + Math.sin(t + i * 1.3) * 16, 3, '#fff6c9');
    }
  },
  familia(g, t, h) {
    fondo(g, '#fff1d6', '#f4b6c2');
    pareja(g, t, h, 100, 220, 105);
    // La bebé en su camita, en el medio
    g.fillStyle = '#fff8ee';
    g.fillRect(135, 118, 50, 22);
    g.fillStyle = '#f2c9a8';
    g.beginPath();
    g.arc(160, 112, 12, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#231815';
    g.beginPath();
    g.ellipse(160, 104, 12, 6, 0, Math.PI, Math.PI * 2);
    g.fill();
    g.fillRect(154, 113, 4, 1.6);
    g.fillRect(162, 113, 4, 1.6);
    corazon(g, 160, 80 + Math.sin(t * 3) * 3, 8, '#e86a8a');
    texto(g, '?', 185, 90 + Math.sin(t * 5) * 2, 14, '#7a625a');
  },
};

// Todos los dibujitos llevan corazoncitos que suben
for (const k of Object.keys(DIBUJOS)) {
  const f = DIBUJOS[k];
  DIBUJOS[k] = (g, t, h) => {
    f(g, t, h);
    corazonesQueSuben(g, t, 3, 'rgba(255,255,255,0.7)');
  };
}
