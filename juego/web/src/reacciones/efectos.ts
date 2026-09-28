// Efectos 2D de las reacciones (venita, gotita, lágrimas, confeti, corazones, «zzz», globitos de texto...).
// Se dibujan en una capa HTML encima del escenario 3D y siguen al personaje cuadro a cuadro.
import './reacciones.css';
import type { Fx } from './tipos';

/** Punto de la capa en píxeles; `r` es el radio de la cabeza en pantalla (escala de los efectos). */
export interface Ancla {
  x: number;
  y: number;
  r: number;
}

/** Dónde está cada parte del personaje en la capa (se recalcula cada cuadro). */
export interface Anclas {
  cabeza(): Ancla;
  cara(): Ancla;
  pies(): Ancla;
  /** Hacia dónde mira en pantalla (1 = derecha, -1 = izquierda). */
  lado(): number;
}

interface Seguidor {
  el: HTMLElement;
  ancla: () => Ancla;
  dx: number;
  dy: number;
  hasta: number;
  /** Se va desvaneciendo al final. */
  salida?: number;
}

const SVG = {
  vena: `<svg viewBox="-20 -20 40 40"><g fill="none" stroke="#e4574b" stroke-width="5" stroke-linecap="round">
    <path d="M-4-15q0 8-9 11"/><path d="M4-15q0 8 9 11"/><path d="M-4 15q0-8-9-11"/><path d="M4 15q0-8 9-11"/></g></svg>`,
  gota: `<svg viewBox="0 0 24 34"><path d="M12 2C9 10 3 15 3 22a9 9 0 0 0 18 0c0-7-6-12-9-20z" fill="#9ccbef" stroke="#3d7fb8" stroke-width="2"/>
    <ellipse cx="8.5" cy="21" rx="2.2" ry="4" fill="#fff" opacity=".85"/></svg>`,
  corazon: `<svg viewBox="0 0 32 30"><path d="M16 28S2 19 2 10a7 7 0 0 1 14-2 7 7 0 0 1 14 2c0 9-14 18-14 18z" fill="#e86a8a" stroke="#b8405f" stroke-width="2"/>
    <ellipse cx="9" cy="9" rx="2.5" ry="3.5" fill="#fff" opacity=".7" transform="rotate(-30 9 9)"/></svg>`,
  estrella: `<svg viewBox="-10 -10 20 20"><path d="M0-10Q1.5-1.5 10 0Q1.5 1.5 0 10Q-1.5 1.5-10 0Q-1.5-1.5 0-10z" fill="#f6cf5a" stroke="#d99a1a" stroke-width="1"/></svg>`,
  brillo: `<svg viewBox="-10 -10 20 20"><path d="M0-10Q1.2-1.2 10 0Q1.2 1.2 0 10Q-1.2 1.2-10 0Q-1.2-1.2 0-10z" fill="#fff" stroke="#f6cf5a" stroke-width="1.2"/></svg>`,
  nube: `<svg viewBox="0 0 80 56"><g fill="#8b8794" stroke="#5c5866" stroke-width="2.5"><path d="M18 34a11 11 0 0 1 3-21 14 14 0 0 1 26-3 12 12 0 0 1 20 9 9 9 0 0 1-2 18H20z"/></g>
    <g stroke="#5b8fd6" stroke-width="3" stroke-linecap="round" class="lluvia"><path d="M24 42l-3 7"/><path d="M38 42l-3 7"/><path d="M52 42l-3 7"/></g></svg>`,
  nota: `<svg viewBox="0 0 24 30"><path d="M9 24V5l13-3v18" fill="none" stroke="#3d2b27" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="6" cy="24" rx="5" ry="4" fill="#3d2b27"/><ellipse cx="19" cy="20" rx="5" ry="4" fill="#3d2b27"/></svg>`,
  foco: `<svg viewBox="0 0 40 48"><g stroke="#f6cf5a" stroke-width="3" stroke-linecap="round"><path d="M20 2v5"/><path d="M5 9l4 3"/><path d="M35 9l-4 3"/><path d="M1 22h5"/><path d="M34 22h5"/></g>
    <path d="M20 10a11 11 0 0 0-7 19c2 2 2 4 2 6h10c0-2 0-4 2-6a11 11 0 0 0-7-19z" fill="#fff3a8" stroke="#d99a1a" stroke-width="2.5"/>
    <rect x="15" y="36" width="10" height="7" rx="2" fill="#9a8f86" stroke="#5c5866" stroke-width="2"/></svg>`,
  reloj: `<svg viewBox="0 0 40 40"><circle cx="20" cy="21" r="16" fill="#fff8ee" stroke="#3d2b27" stroke-width="3"/><rect x="16" y="1" width="8" height="5" rx="2" fill="#3d2b27"/>
    <path d="M20 21V11" stroke="#e4574b" stroke-width="3" stroke-linecap="round" class="manecilla"/><circle cx="20" cy="21" r="2.5" fill="#3d2b27"/></svg>`,
  humo: `<svg viewBox="0 0 30 24"><path d="M8 20a6 6 0 0 1 0-12 8 8 0 0 1 14 0 6 6 0 0 1 0 12z" fill="#fff" stroke="#b9b2aa" stroke-width="2"/></svg>`,
  chispa: `<svg viewBox="-30 -30 60 60"><path d="M0-28L6-8 26-12 10 2 22 20 2 10-8 28-8 8-28 4-10-6-18-24 0-12z" fill="#f6cf5a" stroke="#e4574b" stroke-width="2.5" stroke-linejoin="round"/></svg>`,
  beso: `<svg viewBox="0 0 32 30"><path d="M16 28S2 19 2 10a7 7 0 0 1 14-2 7 7 0 0 1 14 2c0 9-14 18-14 18z" fill="#e4574b" stroke="#b93d33" stroke-width="2"/></svg>`,
};

const COLORES_CONFETI = ['#e4574b', '#f6cf5a', '#8fd3b6', '#9ccbef', '#f4b6c2', '#5b8fd6', '#e86a8a', '#fff8ee'];
const azar = (a: number, b: number) => a + Math.random() * (b - a);

export class Efectos {
  private seguidores: Seguidor[] = [];
  private t = 0;
  private tGota: Record<string, number> = {};

  constructor(private capa: HTMLElement, private rapido = 1) {}

  private nuevo(clase: string, html = ''): HTMLElement {
    const el = document.createElement('div');
    el.className = `fx ${clase}`;
    el.innerHTML = html;
    this.capa.append(el);
    return el;
  }

  private ubicar(el: HTMLElement, x: number, y: number, tam?: number) {
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    if (tam !== undefined) {
      el.style.width = `${tam}px`;
      el.style.height = `${tam}px`;
    }
  }

  /** Anima un elemento suelto y lo borra al terminar. */
  private volar(el: HTMLElement, cuadros: Keyframe[], ms: number, demora = 0, curva = 'ease-out') {
    const a = el.animate(cuadros, { duration: ms / this.rapido, delay: demora / this.rapido, easing: curva, fill: 'both' });
    a.onfinish = () => el.remove();
    return a;
  }

  private seguir(el: HTMLElement, ancla: () => Ancla, dx: number, dy: number, dur: number, salida = 0.3) {
    this.seguidores.push({ el, ancla, dx, dy, hasta: this.t + dur / this.rapido, salida });
  }

  /** Cada cuadro: los efectos que siguen al personaje se mueven con él. */
  cuadro(dt: number) {
    this.t += dt;
    this.seguidores = this.seguidores.filter((s) => {
      if (this.t >= s.hasta) {
        s.el.remove();
        return false;
      }
      const a = s.ancla();
      this.ubicar(s.el, a.x + s.dx * a.r, a.y + s.dy * a.r);
      s.el.style.setProperty('--r', `${a.r}px`);
      const quedan = s.hasta - this.t;
      if (s.salida && quedan < s.salida) s.el.style.opacity = String(Math.max(0, quedan / s.salida));
      return true;
    });
  }

  limpiar() {
    for (const s of this.seguidores) s.el.remove();
    this.seguidores = [];
    this.capa.querySelectorAll('.fx').forEach((e) => e.remove());
  }

  /** Globito con lo que dice el personaje, del lado del centro del escenario. */
  globo(texto: string, a: Anclas, dur = 2.2) {
    this.capa.querySelectorAll(`.fx-globo[data-lado="${a.lado() > 0 ? 'd' : 'i'}"]`).forEach((e) => e.remove());
    const el = this.nuevo('fx-globo');
    el.dataset.lado = a.lado() > 0 ? 'd' : 'i';
    el.textContent = texto;
    const ancla = () => {
      const c = a.cabeza();
      const ancho = this.capa.clientWidth;
      // El globo sale hacia el centro y nunca se sale del escenario
      const hacia = c.x < ancho / 2 ? 1 : -1;
      return { x: c.x + hacia * c.r * 1.3, y: c.y - c.r * 0.6, r: c.r, hacia };
    };
    const pos = ancla();
    el.classList.add(pos.hacia > 0 ? 'hacia-der' : 'hacia-izq');
    this.seguir(el, () => ancla(), 0, 0, dur, 0.35);
    el.animate([{ transform: `${pos.hacia > 0 ? '' : 'translateX(-100%) '}scale(.3)`, opacity: 0 }, { transform: `${pos.hacia > 0 ? '' : 'translateX(-100%) '}scale(1)`, opacity: 1 }], {
      duration: 260 / this.rapido,
      easing: 'cubic-bezier(.2,1.5,.4,1)',
      fill: 'forwards',
    });
  }

  lanzar(fx: Fx, a: Anclas, otro?: Anclas) {
    const cab = a.cabeza();
    const r = cab.r;
    switch (fx.tipo) {
      case 'vena': {
        const el = this.nuevo('fx-vena', SVG.vena);
        this.ubicar(el, 0, 0, r * 0.75);
        this.seguir(el, a.cabeza, -a.lado() * 0.62, -0.55, fx.dur ?? 1.6, 0.25);
        break;
      }
      case 'gotita': {
        const el = this.nuevo('fx-gotita', SVG.gota);
        this.ubicar(el, 0, 0, r * 0.55);
        this.seguir(el, a.cabeza, -a.lado() * 0.78, -0.2, 1.5, 0.4);
        break;
      }
      case 'humo': {
        const dur = fx.dur ?? 1.2;
        for (let i = 0; i < Math.round(dur * 5); i++) {
          for (const s of [-1, 1]) {
            const el = this.nuevo('fx-humo', SVG.humo);
            this.ubicar(el, cab.x + s * r * 0.95, cab.y - r * 0.1, r * 0.55);
            this.volar(el, [
              { transform: 'translate(-50%,-50%) scale(.3)', opacity: 0.95 },
              { transform: `translate(calc(-50% + ${s * r * 1.1}px), calc(-50% - ${r * 1.3}px)) scale(1.2)`, opacity: 0 },
            ], 700, i * 200 + (s > 0 ? 100 : 0));
          }
        }
        break;
      }
      case 'lagrimas': {
        const cara = a.cara();
        const cada = fx.risa ? 110 : 55;
        const n = Math.round((fx.dur * 1000) / cada);
        for (let i = 0; i < n; i++) {
          for (const s of [-1, 1]) {
            const el = this.nuevo('fx-lagrima');
            const tam = r * (fx.risa ? 0.16 : 0.22) * azar(0.8, 1.2);
            this.ubicar(el, cara.x + s * r * 0.36, cara.y - r * 0.1, tam);
            const lejos = r * (fx.risa ? 0.9 : 1.7) * azar(0.8, 1.2);
            this.volar(el, [
              { transform: 'translate(-50%,-50%) scale(.6)', opacity: 1 },
              { transform: `translate(calc(-50% + ${s * lejos * 0.55}px), calc(-50% - ${r * 0.35}px)) scale(1)`, opacity: 1, offset: 0.35 },
              { transform: `translate(calc(-50% + ${s * lejos}px), calc(-50% + ${r * 1.2}px)) scale(.8)`, opacity: 0 },
            ], 520, i * cada, 'linear');
          }
        }
        break;
      }
      case 'nube': {
        const el = this.nuevo('fx-nube', SVG.nube);
        this.ubicar(el, 0, 0, r * 1.7);
        this.seguir(el, a.cabeza, 0, -1.55, fx.dur, 0.4);
        break;
      }
      case 'zzz': {
        const dur = fx.dur ?? 1.4;
        for (let i = 0; i < Math.round(dur * 2.2); i++) {
          const el = this.nuevo('fx-z');
          el.textContent = 'z';
          this.ubicar(el, cab.x + a.lado() * r * 0.7, cab.y - r * 0.6);
          el.style.fontSize = `${r * azar(0.55, 0.8)}px`;
          this.volar(el, [
            { transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 },
            { transform: `translate(calc(-50% + ${a.lado() * r * 0.6}px), calc(-50% - ${r * 0.6}px)) scale(1)`, opacity: 1, offset: 0.4 },
            { transform: `translate(calc(-50% + ${a.lado() * r * 1.2}px), calc(-50% - ${r * 1.6}px)) scale(1.1)`, opacity: 0 },
          ], 1100, i * 450);
        }
        break;
      }
      case 'signo': {
        const el = this.nuevo('fx-signo');
        el.textContent = fx.c;
        el.style.fontSize = `${r * 1.25}px`;
        this.ubicar(el, 0, 0);
        this.seguir(el, a.cabeza, a.lado() * 0.55, -1.45, 1.3, 0.3);
        el.animate([{ transform: 'translate(-50%,-50%) scale(0) rotate(-20deg)' }, { transform: 'translate(-50%,-50%) scale(1.25) rotate(8deg)', offset: 0.55 }, { transform: 'translate(-50%,-50%) scale(1) rotate(0)' }], {
          duration: 380 / this.rapido,
          easing: 'ease-out',
          fill: 'forwards',
        });
        break;
      }
      case 'rayos': {
        const el = this.nuevo('fx-rayos');
        el.innerHTML = Array.from({ length: 10 }, (_, i) => `<i style="transform:rotate(${i * 36 + 18}deg) translateY(-${r * 1.45}px)"></i>`).join('');
        this.ubicar(el, cab.x, cab.y);
        el.style.setProperty('--r', `${r}px`);
        this.volar(el, [{ transform: 'scale(.6)', opacity: 1 }, { transform: 'scale(1.15)', opacity: 1, offset: 0.5 }, { transform: 'scale(1.3)', opacity: 0 }], 600);
        break;
      }
      case 'polvo': {
        const p = a.pies();
        for (let i = 0; i < 6; i++) {
          const s = i % 2 ? 1 : -1;
          const el = this.nuevo('fx-polvo');
          const tam = r * azar(0.35, 0.6);
          this.ubicar(el, p.x + s * r * 0.3, p.y, tam);
          this.volar(el, [
            { transform: 'translate(-50%,-50%) scale(.4)', opacity: 0.9 },
            { transform: `translate(calc(-50% + ${s * r * azar(0.8, 1.5)}px), calc(-50% - ${r * azar(0.1, 0.5)}px)) scale(1.2)`, opacity: 0 },
          ], 520, i * 30);
        }
        break;
      }
      case 'notas': {
        const n = Math.round(fx.dur * 2.5);
        for (let i = 0; i < n; i++) {
          const el = this.nuevo('fx-nota', SVG.nota);
          const s = i % 2 ? 1 : -1;
          this.ubicar(el, cab.x + s * r * 0.9, cab.y - r * 0.3, r * 0.6);
          this.volar(el, [
            { transform: 'translate(-50%,-50%) scale(.3) rotate(0)', opacity: 0 },
            { transform: `translate(calc(-50% + ${s * r * 0.5}px), calc(-50% - ${r * 0.8}px)) scale(1) rotate(${s * 12}deg)`, opacity: 1, offset: 0.35 },
            { transform: `translate(calc(-50% + ${s * r * 0.2}px), calc(-50% - ${r * 2}px)) scale(.9) rotate(${-s * 10}deg)`, opacity: 0 },
          ], 1200, i * 400);
        }
        break;
      }
      case 'corazones': {
        const n = fx.n ?? 5;
        for (let i = 0; i < n; i++) {
          const el = this.nuevo('fx-corazon', SVG.corazon);
          const dx = azar(-0.9, 0.9) * r;
          this.ubicar(el, cab.x + dx, cab.y - r * 0.4, r * azar(0.4, 0.62));
          this.volar(el, [
            { transform: 'translate(-50%,-50%) scale(0)', opacity: 1 },
            { transform: `translate(calc(-50% + ${dx * 0.3}px), calc(-50% - ${r * 0.7}px)) scale(1.15)`, opacity: 1, offset: 0.3 },
            { transform: `translate(calc(-50% + ${dx * 0.8 + azar(-8, 8)}px), calc(-50% - ${r * 2.2}px)) scale(.9)`, opacity: 0 },
          ], 1300, i * 140);
        }
        break;
      }
      case 'estrellas': {
        const n = fx.n ?? 4;
        for (let i = 0; i < n; i++) {
          const el = this.nuevo('fx-estrella', SVG.estrella);
          const ang = azar(0, Math.PI * 2);
          const d = r * azar(1.1, 2);
          this.ubicar(el, cab.x + Math.cos(ang) * d, cab.y + r * 0.8 + Math.sin(ang) * d * 1.3, r * azar(0.35, 0.6));
          this.volar(el, [
            { transform: 'translate(-50%,-50%) scale(0) rotate(0)' },
            { transform: 'translate(-50%,-50%) scale(1.2) rotate(45deg)', offset: 0.4 },
            { transform: 'translate(-50%,-50%) scale(0) rotate(90deg)' },
          ], 650, i * 110);
        }
        break;
      }
      case 'brillo': {
        const cara = a.cara();
        const el = this.nuevo('fx-brillo', SVG.brillo);
        this.ubicar(el, cara.x + a.lado() * r * 0.7, cara.y - r * 0.2, r * 0.8);
        this.volar(el, [
          { transform: 'translate(-50%,-50%) scale(0) rotate(0)' },
          { transform: 'translate(-50%,-50%) scale(1.3) rotate(60deg)', offset: 0.35 },
          { transform: 'translate(-50%,-50%) scale(0) rotate(120deg)' },
        ], 520);
        break;
      }
      case 'confeti': {
        const n = fx.n ?? 40;
        const capa = fx.pantalla ? document.body : this.capa;
        const ancho = fx.pantalla ? window.innerWidth : this.capa.clientWidth;
        const alto = fx.pantalla ? window.innerHeight : this.capa.clientHeight;
        const origen = fx.pantalla ? null : cab;
        for (let i = 0; i < n; i++) {
          const el = document.createElement('div');
          el.className = `fx fx-confeti${fx.pantalla ? ' fx-pantalla' : ''}`;
          el.style.background = COLORES_CONFETI[i % COLORES_CONFETI.length];
          const w = azar(5, 9), h = azar(8, 14);
          el.style.width = `${w}px`;
          el.style.height = `${h}px`;
          if (i % 3 === 0) el.style.borderRadius = '50%';
          capa.append(el);
          const x0 = origen ? origen.x + azar(-r, r) : azar(0, ancho);
          const y0 = origen ? origen.y : -20;
          this.ubicar(el, x0, y0);
          const vx = origen ? azar(-1, 1) * ancho * 0.45 : azar(-60, 60);
          const subir = origen ? azar(r * 1.5, r * 4) : 0;
          const bajar = alto + 40 - y0;
          const giro = azar(360, 1080) * (Math.random() < 0.5 ? -1 : 1);
          this.volar(el, [
            { transform: 'translate(-50%,-50%) rotate(0) rotateX(0)', opacity: 1 },
            { transform: `translate(calc(-50% + ${vx * 0.5}px), calc(-50% - ${subir}px)) rotate(${giro * 0.3}deg) rotateX(180deg)`, opacity: 1, offset: 0.25 },
            { transform: `translate(calc(-50% + ${vx}px), calc(-50% + ${bajar}px)) rotate(${giro}deg) rotateX(720deg)`, opacity: 0.9 },
          ], azar(1600, 2600), azar(0, 250), 'cubic-bezier(.25,.6,.5,1)');
        }
        break;
      }
      case 'beso': {
        if (!otro) break;
        const de = a.cara();
        const a2 = otro.cara();
        const el = this.nuevo('fx-beso', SVG.beso);
        this.ubicar(el, de.x, de.y, r * 0.7);
        const dx = a2.x - de.x, dy = a2.y - de.y;
        this.volar(el, [
          { transform: 'translate(-50%,-50%) scale(.2)' },
          { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 - r * 1.4}px)) scale(1.2) rotate(-10deg)`, offset: 0.5 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.8) rotate(8deg)` },
        ], 900, 0, 'ease-in-out').onfinish = () => {
          el.remove();
          this.lanzar({ tipo: 'corazones', n: 4 }, otro);
          this.lanzar({ tipo: 'sonrojo', dur: 1.4 }, otro);
        };
        break;
      }
      case 'chispa': {
        if (!otro) break;
        const c2 = otro.cabeza();
        const el = this.nuevo('fx-chispa', SVG.chispa);
        this.ubicar(el, (cab.x + c2.x) / 2, Math.min(cab.y, c2.y) - r * 0.9, r * 1.6);
        this.volar(el, [
          { transform: 'translate(-50%,-50%) scale(0) rotate(-30deg)', opacity: 1 },
          { transform: 'translate(-50%,-50%) scale(1.3) rotate(0)', opacity: 1, offset: 0.3 },
          { transform: 'translate(-50%,-50%) scale(1.6) rotate(15deg)', opacity: 0 },
        ], 600);
        break;
      }
      case 'foco': {
        const el = this.nuevo('fx-foco', SVG.foco);
        this.ubicar(el, 0, 0, r * 1.1);
        this.seguir(el, a.cabeza, 0, -1.7, 1.1, 0.3);
        el.animate([{ transform: 'translate(-50%,-50%) scale(0)' }, { transform: 'translate(-50%,-50%) scale(1.25)', offset: 0.6 }, { transform: 'translate(-50%,-50%) scale(1)' }], {
          duration: 380 / this.rapido,
          fill: 'forwards',
        });
        break;
      }
      case 'aura': {
        const el = this.nuevo('fx-aura');
        this.ubicar(el, 0, 0);
        this.seguir(el, a.pies, 0, 0, fx.dur, 0.6);
        break;
      }
      case 'risa': {
        const cara = a.cara();
        const letras = (fx.texto ?? 'ja ja').split(' ');
        letras.forEach((t, i) => {
          const el = this.nuevo('fx-risa');
          el.textContent = t;
          el.style.fontSize = `${r * 0.62}px`;
          const s = a.lado();
          this.ubicar(el, cara.x + s * r * 0.9, cara.y);
          this.volar(el, [
            { transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 },
            { transform: `translate(calc(-50% + ${s * r * 0.7}px), calc(-50% - ${r * (0.5 + i * 0.5)}px)) scale(1.1) rotate(${s * 8}deg)`, opacity: 1, offset: 0.3 },
            { transform: `translate(calc(-50% + ${s * r * 1.2}px), calc(-50% - ${r * (0.9 + i * 0.6)}px)) scale(1)`, opacity: 0 },
          ], 1000, i * 280);
        });
        break;
      }
      case 'reloj': {
        const el = this.nuevo('fx-reloj', SVG.reloj);
        this.ubicar(el, 0, 0, r * 0.95);
        this.seguir(el, a.cabeza, a.lado() * 0.9, -1.3, 1.4, 0.3);
        break;
      }
      case 'soplido': {
        const cara = a.cara();
        for (let i = 0; i < 3; i++) {
          const el = this.nuevo('fx-soplido');
          const s = a.lado();
          this.ubicar(el, cara.x + s * r * 0.5, cara.y + r * 0.35 + (i - 1) * r * 0.18);
          el.style.width = `${r * 0.7}px`;
          this.volar(el, [
            { transform: 'translate(-50%,-50%) scaleX(.2)', opacity: 0.9 },
            { transform: `translate(calc(-50% + ${s * r * 1.2}px), -50%) scaleX(1)`, opacity: 0 },
          ], 420, i * 60);
        }
        break;
      }
      case 'resoplido': {
        const cara = a.cara();
        for (const s of [-1, 1]) {
          const el = this.nuevo('fx-humo', SVG.humo);
          this.ubicar(el, cara.x + s * r * 0.15, cara.y + r * 0.2, r * 0.4);
          this.volar(el, [
            { transform: 'translate(-50%,-50%) scale(.3)', opacity: 0.9 },
            { transform: `translate(calc(-50% + ${s * r * 0.8}px), calc(-50% + ${r * 0.5}px)) scale(1)`, opacity: 0 },
          ], 520);
        }
        break;
      }
      case 'mareo': {
        const el = this.nuevo('fx-mareo');
        el.innerHTML = [0, 1, 2].map((i) => `<i style="animation-delay:-${i * 0.33}s">${SVG.estrella}</i>`).join('');
        this.ubicar(el, 0, 0);
        this.seguir(el, a.cabeza, 0, -0.9, fx.dur, 0.3);
        break;
      }
      case 'sonrojo': {
        const el = this.nuevo('fx-sonrojo', '<i></i><i></i>');
        this.ubicar(el, 0, 0);
        this.seguir(el, a.cara, 0, 0.2, fx.dur, 0.4);
        break;
      }
    }
  }
}
