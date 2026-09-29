// Recuerdos flotantes: mientras se bañan (o se quedan abrazados en la cama) sale una burbuja con un dibujito
// animado de los dos y lo que se dijeron. Los recuerdos son los de verdad (los mismos de Cien Puertas); en la
// cama se mezclan con discusiones bobas y deseos a futuro. Cada uno dura de 10 a 15 s y salen al azar.
import './recuerdos.css';
import { type Dicho, RECUERDOS } from '../puertas/historia';
import { ESCENAS, H, precargar, W } from './recuerdos_arte';
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
  /** El fondo de la escena actual, pintado una sola vez. */
  private fondo: HTMLCanvasElement | null = null;
  private ultimoCuadro = 0;

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
    precargar();
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
    this.fondo = null;
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
    // Unos 30 cuadros por segundo bastan (la casa se sigue dibujando detrás)
    if (t - this.ultimoCuadro < 1 / 30) return;
    this.ultimoCuadro = t;
    const escena = ESCENAS[v.dibujo] ?? ESCENAS.casa;
    const g = this.g;
    if (!this.fondo) {
      this.fondo = document.createElement('canvas');
      this.fondo.width = W * 2;
      this.fondo.height = H * 2;
      const gf = this.fondo.getContext('2d')!;
      gf.scale(2, 2);
      escena.fondo(gf);
    }
    g.drawImage(this.fondo, 0, 0);
    g.save();
    g.scale(2, 2);
    const habla = this.linea >= 0 ? this.lineas[this.linea][0] : null;
    escena.frente(g, k, habla);
    g.restore();
  }
}

/** «orgullos{a|o}»: la primera forma cuando habla Ella, la segunda cuando habla Él. */
const forma = (texto: string, quien: 'el' | 'ella') => texto.replace(/\{([^|}]*)\|([^}]*)\}/g, (_, a, o) => (quien === 'ella' ? a : o));
