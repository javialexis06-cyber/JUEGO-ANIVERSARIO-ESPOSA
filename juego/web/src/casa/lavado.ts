// Lavarse la cara, al estilo de Vampire Survivors: el personaje (chiquito) camina por su propia cara mientras
// gérmenes, puntos negros, grasa, granitos y ácaros llegan en oleadas cada vez más grandes. Las armas disparan
// solas (burbujas de jabón, esponjas que giran, chorro de agua, aura de espuma, toalla bumerán y charcos); cada
// enemigo suelta gotitas brillantes y al juntar suficientes se sube de nivel y se escoge 1 de 3 mejoras. Hay que
// aguantar 3 minutos (a los 2:30 sale el Espinillón, el jefe). Se mueve arrastrando el dedo (o con el teclado).
import './lavado.css';
import { nota, rumor } from '../sonido';
import type { Rol } from './modelo';

export interface ResultadoLavado {
  segundos: number;
  gano: boolean;
  eliminados: number;
  nivel: number;
  jefe: boolean;
}

const DURACION = 180;
const JEFE_EN = 150;
const MAX_ENEMIGOS = 230;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const elegir = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)];

// ---------------------------------------------------------------------------------------------- Enemigos
type TipoEnemigo = 'germen' | 'punto' | 'grasa' | 'granito' | 'acaro' | 'jefe';
const ENEMIGOS: Record<TipoEnemigo, { vida: number; vel: number; dano: number; r: number; xp: number; desde: number }> = {
  germen: { vida: 7, vel: 52, dano: 6, r: 15, xp: 1, desde: 0 },
  punto: { vida: 5, vel: 78, dano: 5, r: 11, xp: 1, desde: 25 },
  grasa: { vida: 12, vel: 92, dano: 8, r: 14, xp: 2, desde: 55 },
  granito: { vida: 34, vel: 40, dano: 12, r: 23, xp: 4, desde: 75 },
  acaro: { vida: 4, vel: 125, dano: 4, r: 9, xp: 1, desde: 100 },
  jefe: { vida: 1100, vel: 46, dano: 22, r: 62, xp: 40, desde: JEFE_EN },
};
interface Enemigo {
  tipo: TipoEnemigo;
  x: number;
  y: number;
  vida: number;
  max: number;
  r: number;
  vel: number;
  dano: number;
  xp: number;
  golpe: number;
  fase: number;
  /** Cuándo puede volver a pegarle cada arma que golpea seguido (esponja, espuma, charco). */
  toques: Map<string, number>;
  empuje: { x: number; y: number };
  embestida?: number;
}

// ---------------------------------------------------------------------------------------------- Armas y mejoras
type IdArma = 'burbujas' | 'esponja' | 'chorro' | 'espuma' | 'toalla' | 'charco';
type IdPasiva = 'jabon' | 'tibia' | 'grande' | 'pies' | 'iman' | 'crema';
const ARMAS: Record<IdArma, { nombre: string; icono: string; desc: string[] }> = {
  burbujas: { nombre: 'Burbujas de jabón', icono: '🫧', desc: ['Dispara al germen más cercano', '+1 burbuja', 'Más daño', '+1 burbuja', 'Atraviesan a dos'] },
  esponja: { nombre: 'Esponja giratoria', icono: '🧽', desc: ['Una esponja te da vueltas', '+1 esponja', 'Gira más lejos y más duro', '+1 esponja', 'Más daño y más rápido'] },
  chorro: { nombre: 'Chorro de agua', icono: '💦', desc: ['Un chorro hacia donde miras', 'También hacia atrás', 'Más largo', 'Más daño', 'Más ancho y seguido'] },
  espuma: { nombre: 'Aura de espuma', icono: '☁️', desc: ['Espuma a tu alrededor', 'Más grande', 'Más daño', 'Más grande', 'Aún más daño'] },
  toalla: { nombre: 'Toalla bumerán', icono: '🧺', desc: ['Va y vuelve atravesándolos', '+1 toalla', 'Más daño', '+1 toalla', 'Más lejos y más daño'] },
  charco: { nombre: 'Charcos de agua', icono: '💧', desc: ['Charcos que mojan a los que pasan', '+1 charco', 'Más grandes', '+1 charco', 'Más daño y duran más'] },
};
const PASIVAS: Record<IdPasiva, { nombre: string; icono: string; desc: string }> = {
  jabon: { nombre: 'Jabón extra fuerte', icono: '🧼', desc: '+12 % de daño' },
  tibia: { nombre: 'Agua tibia', icono: '♨️', desc: 'Las armas se recargan 8 % más rápido' },
  grande: { nombre: 'Toalla grande', icono: '🛁', desc: '+12 % de área' },
  pies: { nombre: 'Pies ligeros', icono: '👟', desc: '+10 % de velocidad' },
  iman: { nombre: 'Imán de gotitas', icono: '🧲', desc: 'Atrae las gotitas de más lejos' },
  crema: { nombre: 'Crema hidratante', icono: '🧴', desc: '+20 de vida y se recupera sola' },
};
const MAX_ARMA = 5;
const MAX_PASIVA = 5;

interface Proyectil {
  arma: IdArma;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  dano: number;
  vida: number;
  atraviesa: number;
  golpeados: Set<Enemigo>;
  /** Toalla: vuelve hacia quien la tiró. */
  vuelve?: boolean;
  t: number;
}
interface Charco {
  x: number;
  y: number;
  r: number;
  vida: number;
  dano: number;
}
interface Gota {
  x: number;
  y: number;
  xp: number;
  jalando: boolean;
}
interface Cosa {
  x: number;
  y: number;
  tipo: 'toallita' | 'iman' | 'ola';
}
interface Numero {
  x: number;
  y: number;
  texto: string;
  vida: number;
  color: string;
}
interface Opcion {
  tipo: 'arma' | 'pasiva' | 'extra';
  id: string;
  nombre: string;
  icono: string;
  desc: string;
  nivel: number;
}

/** Sonidos cortitos (sintetizados). */
const pop = () => nota(900 + Math.random() * 500, 0.05, 0, 'sine', 0.025, 1500);
const tiro = () => nota(1300, 0.04, 0, 'triangle', 0.012, 1900);
const gotita = () => nota(1500 + Math.random() * 400, 0.05, 0, 'sine', 0.02, 2200);
const auch = () => nota(220, 0.15, 0, 'square', 0.03, 140);
const subir = () => [660, 880, 1100, 1320].forEach((f, i) => nota(f, 0.12, i * 0.07, 'triangle', 0.05));

export function jugarLavado(o: { rol: Rol }): Promise<ResultadoLavado> {
  return new Promise((listo) => {
    const j = new LavadoDeCara(o.rol, listo);
    lavado.actual = j;
    j.empezar();
  });
}

class LavadoDeCara {
  private raiz: HTMLElement;
  private lienzo: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;
  private cuadro = 0;
  private ultimo = 0;
  t = 0;
  private pausado = false;
  private terminado = false;
  // El personaje
  x = 0;
  y = 0;
  private mira = 1;
  private vida = 100;
  private vidaMax = 100;
  private invul = 0;
  nivel = 1;
  private xp = 0;
  private xpSig = 6;
  eliminados = 0;
  private jefeMuerto = false;
  private jefeSalio = false;
  armas = new Map<IdArma, number>([['burbujas', 1]]);
  private pasivas = new Map<IdPasiva, number>();
  private recarga = new Map<IdArma, number>();
  enemigos: Enemigo[] = [];
  private proyectiles: Proyectil[] = [];
  private charcos: Charco[] = [];
  private gotas: Gota[] = [];
  private cosas: Cosa[] = [];
  private numeros: Numero[] = [];
  private chorros: { x: number; y: number; ang: number; largo: number; ancho: number; vida: number }[] = [];
  private aparecer = 0;
  private angEsponja = 0;
  private sprites = new Map<string, HTMLImageElement>();
  private poros: CanvasPattern | null = null;
  // Control: arrastrar el dedo (o teclado)
  private dedo: { x0: number; y0: number; x: number; y: number } | null = null;
  private teclas = new Set<string>();
  private escala = 1;
  private sacudida = 0;

  constructor(private rol: Rol, private listo: (r: ResultadoLavado) => void) {
    this.raiz = document.createElement('section');
    this.raiz.className = 'lavado';
    this.raiz.innerHTML = `
      <canvas class="lavado-lienzo"></canvas>
      <div class="lavado-hud">
        <div class="lavado-xp"><i></i></div>
        <div class="lavado-fila"><b class="lavado-nivel">Nv 1</b><b class="lavado-tiempo">3:00</b><b class="lavado-bajas">🦠 0</b></div>
      </div>
      <div class="lavado-armas"></div>
      <button class="lavado-salir" aria-label="Salir">✕</button>
      <div class="lavado-mejora" hidden></div>
      <div class="lavado-fin" hidden></div>
      <div class="lavado-aviso"></div>`;
    document.body.append(this.raiz);
    this.lienzo = this.raiz.querySelector('canvas')!;
    this.g = this.lienzo.getContext('2d')!;
    for (const pose of ['feliz', 'sorpresa', 'celebra', 'llora']) {
      const img = new Image();
      img.src = `./recuerdos/${rol}_${pose}.webp`;
      this.sprites.set(pose, img);
    }
    this.raiz.querySelector('.lavado-salir')!.addEventListener('click', () => this.terminar(false));
    this.lienzo.addEventListener('pointerdown', (e) => {
      this.lienzo.setPointerCapture(e.pointerId);
      this.dedo = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY };
    });
    this.lienzo.addEventListener('pointermove', (e) => {
      if (this.dedo) {
        this.dedo.x = e.clientX;
        this.dedo.y = e.clientY;
      }
    });
    const soltar = () => (this.dedo = null);
    this.lienzo.addEventListener('pointerup', soltar);
    this.lienzo.addEventListener('pointercancel', soltar);
    this.teclado = this.teclado.bind(this);
    window.addEventListener('keydown', this.teclado);
    window.addEventListener('keyup', this.teclado);
    this.raiz.querySelector('.lavado-mejora')!.addEventListener('click', (ev) => {
      const b = (ev.target as HTMLElement).closest('[data-opcion]') as HTMLElement | null;
      if (b) this.escoger(Number(b.dataset.opcion));
    });
  }

  private teclado(e: KeyboardEvent) {
    const k = e.key.toLowerCase();
    if (e.type === 'keydown') this.teclas.add(k);
    else this.teclas.delete(k);
  }

  empezar() {
    this.ajustar();
    window.addEventListener('resize', this.ajustar);
    requestAnimationFrame(() => this.raiz.classList.add('visible'));
    this.aviso('¡A limpiar esa carita! Arrastra el dedo para moverte', 3.2);
    this.pintarArmas();
    this.ultimo = performance.now();
    const bucle = (ms: number) => {
      if (this.terminado) return;
      this.cuadro = requestAnimationFrame(bucle);
      const dt = Math.min(0.05, (ms - this.ultimo) / 1000);
      this.ultimo = ms;
      if (!this.pausado) this.paso(dt);
      this.dibujar();
    };
    this.cuadro = requestAnimationFrame(bucle);
  }

  private ajustar = () => {
    const d = Math.min(2, window.devicePixelRatio || 1);
    this.lienzo.width = Math.round(window.innerWidth * d);
    this.lienzo.height = Math.round(window.innerHeight * d);
    // Se ve más o menos la misma porción de cara en cualquier celular
    this.escala = (Math.min(window.innerWidth, window.innerHeight) / 430) * d;
  };

  private aviso(texto: string, seg = 2.2) {
    const a = this.raiz.querySelector('.lavado-aviso') as HTMLElement;
    a.textContent = texto;
    a.classList.remove('sale');
    void a.offsetWidth;
    a.classList.add('sale');
    a.style.animationDuration = `${seg}s`;
  }

  // ------------------------------------------------------------------------------------------- Mejoras
  private nivelDe(id: IdPasiva) {
    return this.pasivas.get(id) ?? 0;
  }
  private get mDano() {
    return 1 + 0.12 * this.nivelDe('jabon');
  }
  private get mRecarga() {
    return 1 - 0.08 * this.nivelDe('tibia');
  }
  private get mArea() {
    return 1 + 0.12 * this.nivelDe('grande');
  }
  private get velocidad() {
    return 150 * (1 + 0.1 * this.nivelDe('pies'));
  }
  private get iman() {
    return 70 * (1 + 0.35 * this.nivelDe('iman'));
  }

  private opciones(): Opcion[] {
    const l: Opcion[] = [];
    for (const [id, a] of Object.entries(ARMAS) as [IdArma, (typeof ARMAS)[IdArma]][]) {
      const n = this.armas.get(id) ?? 0;
      if (n >= MAX_ARMA || (!n && this.armas.size >= 4)) continue;
      l.push({ tipo: 'arma', id, nombre: a.nombre, icono: a.icono, desc: a.desc[n], nivel: n + 1 });
    }
    for (const [id, p] of Object.entries(PASIVAS) as [IdPasiva, (typeof PASIVAS)[IdPasiva]][]) {
      const n = this.pasivas.get(id) ?? 0;
      if (n >= MAX_PASIVA || (!n && this.pasivas.size >= 4)) continue;
      l.push({ tipo: 'pasiva', id, nombre: p.nombre, icono: p.icono, desc: p.desc, nivel: n + 1 });
    }
    // Como en Vampire Survivors: tres al azar (las armas nuevas salen un poquito más)
    const barajadas = l.sort(() => Math.random() - 0.5).sort((a, b) => (a.tipo === 'arma' && a.nivel === 1 ? -0.3 : 0) - (b.tipo === 'arma' && b.nivel === 1 ? -0.3 : 0) + (Math.random() - 0.5) * 0.4);
    const r = barajadas.slice(0, 3);
    if (!r.length) r.push({ tipo: 'extra', id: 'vida', nombre: 'Toallita fresca', icono: '🧻', desc: 'Recupera 40 de vida', nivel: 1 });
    return r;
  }

  private mejoraPendiente: Opcion[] = [];
  private subirNivel() {
    this.nivel++;
    this.xp -= this.xpSig;
    this.xpSig = Math.round(6 + this.nivel * 7 + Math.pow(this.nivel, 1.6));
    subir();
    this.mejoraPendiente = this.opciones();
    this.pausado = true;
    const caja = this.raiz.querySelector('.lavado-mejora') as HTMLElement;
    caja.innerHTML = `<h2>¡Subiste a nivel ${this.nivel}!</h2><p>Escoge una mejora</p><div class="lavado-cartas">${this.mejoraPendiente
      .map(
        (o, i) => `<button class="lavado-carta" data-opcion="${i}"><span>${o.icono}</span><b>${o.nombre}</b><small>${o.tipo === 'extra' ? '' : o.nivel === 1 ? '¡Nueva!' : `Nivel ${o.nivel}`}</small><em>${o.desc}</em></button>`,
      )
      .join('')}</div>`;
    caja.hidden = false;
  }

  private escoger(i: number) {
    const o = this.mejoraPendiente[i];
    if (!o) return;
    if (o.tipo === 'arma') this.armas.set(o.id as IdArma, (this.armas.get(o.id as IdArma) ?? 0) + 1);
    else if (o.tipo === 'pasiva') {
      const id = o.id as IdPasiva;
      this.pasivas.set(id, this.nivelDe(id) + 1);
      if (id === 'crema') {
        this.vidaMax += 20;
        this.vida += 20;
      }
    } else this.vida = Math.min(this.vidaMax, this.vida + 40);
    (this.raiz.querySelector('.lavado-mejora') as HTMLElement).hidden = true;
    this.pintarArmas();
    nota(1200, 0.1, 0, 'triangle', 0.05);
    // ¿Alcanza para otro nivel de una?
    if (this.xp >= this.xpSig) this.subirNivel();
    else this.pausado = false;
  }

  private pintarArmas() {
    const iconos = [
      ...[...this.armas].map(([id, n]) => `<span title="${ARMAS[id].nombre}">${ARMAS[id].icono}<i>${n}</i></span>`),
      ...[...this.pasivas].map(([id, n]) => `<span class="pasiva" title="${PASIVAS[id].nombre}">${PASIVAS[id].icono}<i>${n}</i></span>`),
    ];
    this.raiz.querySelector('.lavado-armas')!.innerHTML = iconos.join('');
  }

  // ------------------------------------------------------------------------------------------- Simulación
  private paso(dt: number) {
    this.t += dt;
    if (this.t >= DURACION) return this.terminar(true);
    // Moverse
    let mx = 0, my = 0;
    if (this.dedo) {
      const dx = this.dedo.x - this.dedo.x0, dy = this.dedo.y - this.dedo.y0;
      const d = Math.hypot(dx, dy);
      if (d > 6) {
        const k = Math.min(1, d / 50);
        mx = (dx / d) * k;
        my = (dy / d) * k;
      }
      // El centro del joystick sigue al dedo si se aleja mucho
      if (d > 70) {
        this.dedo.x0 = this.dedo.x - (dx / d) * 70;
        this.dedo.y0 = this.dedo.y - (dy / d) * 70;
      }
    }
    if (this.teclas.has('arrowleft') || this.teclas.has('a')) mx -= 1;
    if (this.teclas.has('arrowright') || this.teclas.has('d')) mx += 1;
    if (this.teclas.has('arrowup') || this.teclas.has('w')) my -= 1;
    if (this.teclas.has('arrowdown') || this.teclas.has('s')) my += 1;
    const m = Math.hypot(mx, my);
    if (m > 1) {
      mx /= m;
      my /= m;
    }
    this.x += mx * this.velocidad * dt;
    this.y += my * this.velocidad * dt;
    if (Math.abs(mx) > 0.1) this.mira = Math.sign(mx);
    this.invul = Math.max(0, this.invul - dt);
    this.sacudida = Math.max(0, this.sacudida - dt * 3);
    this.vida = Math.min(this.vidaMax, this.vida + 0.3 * this.nivelDe('crema') * dt);
    this.aparecerEnemigos(dt);
    this.disparar(dt);
    this.moverProyectiles(dt);
    this.moverEnemigos(dt);
    this.recogerGotas(dt);
    for (const n of this.numeros) {
      n.vida -= dt;
      n.y -= 26 * dt;
    }
    this.numeros = this.numeros.filter((n) => n.vida > 0);
    for (const c of this.chorros) c.vida -= dt;
    this.chorros = this.chorros.filter((c) => c.vida > 0);
    this.pintarHud();
  }

  private aparecerEnemigos(dt: number) {
    if (this.t >= JEFE_EN && !this.jefeSalio) {
      this.jefeSalio = true;
      this.crear('jefe');
      this.aviso('¡Llegó el Espinillón! 😱', 2.6);
      rumor(0.8, 180, 0.12, 0, 0.6, 90);
    }
    // Cada vez llegan más (como en Vampire Survivors), con oleadas de ácaros de vez en cuando
    const porSegundo = 1.1 + this.t / 22 + (this.t > 60 ? 1.5 : 0);
    this.aparecer += porSegundo * dt;
    const disponibles = (Object.keys(ENEMIGOS) as TipoEnemigo[]).filter((k) => k !== 'jefe' && ENEMIGOS[k].desde <= this.t);
    while (this.aparecer >= 1 && this.enemigos.length < MAX_ENEMIGOS) {
      this.aparecer -= 1;
      // Los recientes salen más seguido que los viejos
      const pesos = disponibles.map((k) => 1 + (this.t - ENEMIGOS[k].desde) / 60);
      let r = Math.random() * pesos.reduce((a, b) => a + b, 0);
      let tipo = disponibles[0];
      for (let i = 0; i < disponibles.length; i++) if ((r -= pesos[i]) <= 0) {
        tipo = disponibles[i];
        break;
      }
      this.crear(tipo);
    }
    if (this.aparecer >= 1) this.aparecer = 1;
    // Enjambre de ácaros cada 30 s a partir del minuto y medio
    if (this.t > 95 && Math.floor(this.t / 30) !== Math.floor((this.t - dt) / 30)) {
      for (let i = 0; i < 18; i++) this.crear('acaro', true);
      this.aviso('¡Enjambre de ácaros!');
    }
  }

  private crear(tipo: TipoEnemigo, enjambre = false) {
    const e = ENEMIGOS[tipo];
    // Aparecen justo afuera de lo que se ve
    const ang = enjambre ? (this.t * 0.37) % (Math.PI * 2) + rnd(-0.3, 0.3) : rnd(0, Math.PI * 2);
    const radio = Math.hypot(this.lienzo.width, this.lienzo.height) / this.escala / 2 + rnd(20, 60);
    // Se ponen más duros con el tiempo
    const duro = 1 + this.t / 140;
    this.enemigos.push({
      tipo,
      x: this.x + Math.cos(ang) * radio,
      y: this.y + Math.sin(ang) * radio,
      vida: e.vida * (tipo === 'jefe' ? 1 : duro),
      max: e.vida * (tipo === 'jefe' ? 1 : duro),
      r: e.r,
      vel: e.vel * rnd(0.9, 1.1),
      dano: e.dano,
      xp: e.xp,
      golpe: 0,
      fase: Math.random() * 6,
      toques: new Map(),
      empuje: { x: 0, y: 0 },
    });
  }

  private masCercano(max = 9e9): Enemigo | null {
    let mejor: Enemigo | null = null;
    let d = max;
    for (const e of this.enemigos) {
      const dd = Math.hypot(e.x - this.x, e.y - this.y);
      if (dd < d) {
        d = dd;
        mejor = e;
      }
    }
    return mejor;
  }

  private disparar(dt: number) {
    for (const [id, n] of this.armas) {
      const falta = (this.recarga.get(id) ?? 0) - dt;
      this.recarga.set(id, falta);
      if (id === 'esponja' || id === 'espuma') continue;
      if (falta > 0) continue;
      const base = { burbujas: 1.05, chorro: 1.35, toalla: 2.2, charco: 3.2 }[id];
      this.recarga.set(id, base * this.mRecarga * (id === 'chorro' && n >= 5 ? 0.75 : 1));
      if (id === 'burbujas') {
        const cant = 1 + (n >= 2 ? 1 : 0) + (n >= 4 ? 1 : 0);
        const obj = this.masCercano(600);
        const ang0 = obj ? Math.atan2(obj.y - this.y, obj.x - this.x) : this.mira > 0 ? 0 : Math.PI;
        for (let i = 0; i < cant; i++) {
          const ang = ang0 + (i - (cant - 1) / 2) * 0.18;
          this.proyectiles.push({ arma: id, x: this.x, y: this.y, vx: Math.cos(ang) * 330, vy: Math.sin(ang) * 330, r: 9 * this.mArea, dano: (n >= 3 ? 12 : 8) * this.mDano, vida: 1.6, atraviesa: n >= 5 ? 2 : 1, golpeados: new Set(), t: 0 });
        }
        tiro();
      } else if (id === 'chorro') {
        const largo = (n >= 3 ? 190 : 140) * this.mArea;
        const ancho = (n >= 5 ? 50 : 36) * this.mArea;
        const lados = n >= 2 ? [this.mira, -this.mira] : [this.mira];
        for (const lado of lados) {
          const ang = lado > 0 ? 0 : Math.PI;
          this.chorros.push({ x: this.x, y: this.y, ang, largo, ancho, vida: 0.22 });
          for (const e of this.enemigos) {
            const lx = (e.x - this.x) * Math.cos(ang) + (e.y - this.y) * Math.sin(ang);
            const ly = -(e.x - this.x) * Math.sin(ang) + (e.y - this.y) * Math.cos(ang);
            if (lx > -10 && lx < largo + e.r && Math.abs(ly) < ancho / 2 + e.r) this.herir(e, (n >= 4 ? 18 : 12) * this.mDano, Math.cos(ang) * 120, Math.sin(ang) * 120);
          }
        }
        rumor(0.18, 1800, 0.035, 0, 0.7, 700);
      } else if (id === 'toalla') {
        const cant = 1 + (n >= 2 ? 1 : 0) + (n >= 4 ? 1 : 0);
        for (let i = 0; i < cant; i++) {
          const obj = elegir(this.enemigos.length ? this.enemigos : [null as unknown as Enemigo]);
          const ang = obj ? Math.atan2(obj.y - this.y, obj.x - this.x) + rnd(-0.2, 0.2) : rnd(0, Math.PI * 2);
          const v = n >= 5 ? 360 : 300;
          this.proyectiles.push({ arma: id, x: this.x, y: this.y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, r: 16 * this.mArea, dano: (n >= 3 ? 20 : 14) * (n >= 5 ? 1.3 : 1) * this.mDano, vida: 3, atraviesa: 999, golpeados: new Set(), t: 0 });
        }
      } else if (id === 'charco') {
        const cant = 1 + (n >= 2 ? 1 : 0) + (n >= 4 ? 1 : 0);
        for (let i = 0; i < cant; i++) {
          const obj = elegir(this.enemigos.length ? this.enemigos : [{ x: this.x + rnd(-120, 120), y: this.y + rnd(-120, 120) } as Enemigo]);
          this.charcos.push({ x: obj.x + rnd(-20, 20), y: obj.y + rnd(-20, 20), r: (n >= 3 ? 56 : 42) * this.mArea, vida: n >= 5 ? 3.6 : 2.6, dano: (n >= 5 ? 6 : 4) * this.mDano });
        }
        nota(500, 0.15, 0, 'sine', 0.03, 300);
      }
    }
    // Esponjas que dan vueltas
    const esp = this.armas.get('esponja') ?? 0;
    if (esp) {
      this.angEsponja += dt * (esp >= 5 ? 4.2 : 3.2);
      const cant = 1 + (esp >= 2 ? 1 : 0) + (esp >= 4 ? 1 : 0);
      const radio = (esp >= 3 ? 88 : 70) * this.mArea;
      for (let i = 0; i < cant; i++) {
        const a = this.angEsponja + (i * Math.PI * 2) / cant;
        const sx = this.x + Math.cos(a) * radio, sy = this.y + Math.sin(a) * radio;
        for (const e of this.enemigos) {
          if (Math.hypot(e.x - sx, e.y - sy) < e.r + 16 * this.mArea && this.puede(e, 'esponja', 0.45)) {
            this.herir(e, (esp >= 5 ? 14 : esp >= 3 ? 10 : 7) * this.mDano, Math.cos(a + Math.PI / 2) * 80, Math.sin(a + Math.PI / 2) * 80);
          }
        }
      }
    }
    // Aura de espuma
    const esu = this.armas.get('espuma') ?? 0;
    if (esu) {
      const radio = (50 + (esu >= 2 ? 16 : 0) + (esu >= 4 ? 16 : 0)) * this.mArea;
      for (const e of this.enemigos) {
        if (Math.hypot(e.x - this.x, e.y - this.y) < radio + e.r && this.puede(e, 'espuma', 0.4)) this.herir(e, (esu >= 5 ? 6 : esu >= 3 ? 4.5 : 3) * this.mDano, 0, 0);
      }
    }
    // Charcos
    for (const c of this.charcos) {
      c.vida -= dt;
      for (const e of this.enemigos) if (Math.hypot(e.x - c.x, e.y - c.y) < c.r + e.r * 0.5 && this.puede(e, 'charco', 0.35)) this.herir(e, c.dano, 0, 0);
    }
    this.charcos = this.charcos.filter((c) => c.vida > 0);
  }

  private puede(e: Enemigo, arma: string, cada: number) {
    const hasta = e.toques.get(arma) ?? 0;
    if (this.t < hasta) return false;
    e.toques.set(arma, this.t + cada);
    return true;
  }

  private herir(e: Enemigo, dano: number, ex: number, ey: number) {
    if (e.vida <= 0) return;
    e.vida -= dano;
    e.golpe = 0.12;
    if (e.tipo !== 'jefe') {
      e.empuje.x += ex;
      e.empuje.y += ey;
    }
    if (this.numeros.length < 60) this.numeros.push({ x: e.x + rnd(-6, 6), y: e.y - e.r, texto: String(Math.round(dano)), vida: 0.55, color: dano >= 15 ? '#ffe066' : '#ffffff' });
    if (e.vida <= 0) this.morir(e);
  }

  private morir(e: Enemigo) {
    this.eliminados++;
    pop();
    this.gotas.push({ x: e.x, y: e.y, xp: e.xp, jalando: false });
    if (e.tipo === 'jefe') {
      this.jefeMuerto = true;
      this.aviso('¡Adiós, Espinillón! ✨', 2.6);
      for (let i = 0; i < 14; i++) this.gotas.push({ x: e.x + rnd(-60, 60), y: e.y + rnd(-60, 60), xp: 4, jalando: false });
      this.cosas.push({ x: e.x, y: e.y, tipo: 'ola' });
    } else if (Math.random() < 0.012) this.cosas.push({ x: e.x, y: e.y, tipo: elegir(['toallita', 'toallita', 'iman', 'ola'] as const) });
  }

  private moverProyectiles(dt: number) {
    for (const p of this.proyectiles) {
      p.t += dt;
      p.vida -= dt;
      if (p.arma === 'toalla') {
        // Va, frena y vuelve hacia el personaje
        if (!p.vuelve && p.t > 0.55) p.vuelve = true;
        if (p.vuelve) {
          const dx = this.x - p.x, dy = this.y - p.y, d = Math.hypot(dx, dy) || 1;
          p.vx += (dx / d) * 900 * dt;
          p.vy += (dy / d) * 900 * dt;
          if (d < 20 && p.t > 0.8) p.vida = 0;
        }
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      for (const e of this.enemigos) {
        if (p.vida <= 0 || e.vida <= 0 || p.golpeados.has(e)) continue;
        if (Math.hypot(e.x - p.x, e.y - p.y) < e.r + p.r) {
          p.golpeados.add(e);
          if (p.arma === 'toalla') setTimeout(() => p.golpeados.delete(e), 450);
          this.herir(e, p.dano, p.vx * 0.25, p.vy * 0.25);
          if (--p.atraviesa <= 0) p.vida = 0;
        }
      }
    }
    this.proyectiles = this.proyectiles.filter((p) => p.vida > 0);
  }

  private moverEnemigos(dt: number) {
    // Rejilla para que no se amontonen unos encima de otros
    const celda = 40;
    const rejilla = new Map<string, Enemigo[]>();
    for (const e of this.enemigos) {
      const k = `${Math.floor(e.x / celda)},${Math.floor(e.y / celda)}`;
      const l = rejilla.get(k);
      if (l) l.push(e);
      else rejilla.set(k, [e]);
    }
    for (const e of this.enemigos) {
      e.fase += dt;
      e.golpe = Math.max(0, e.golpe - dt);
      const dx = this.x - e.x, dy = this.y - e.y, d = Math.hypot(dx, dy) || 1;
      let vel = e.vel;
      // El jefe embiste de vez en cuando
      if (e.tipo === 'jefe') {
        e.embestida = (e.embestida ?? 4) - dt;
        if (e.embestida < 0.8) vel = e.embestida > 0 ? e.vel * 4.2 : e.vel;
        if (e.embestida <= 0) e.embestida = 4.5;
      }
      let vx = (dx / d) * vel, vy = (dy / d) * vel;
      const cx = Math.floor(e.x / celda), cy = Math.floor(e.y / celda);
      for (let i = -1; i <= 1; i++)
        for (let j = -1; j <= 1; j++)
          for (const o of rejilla.get(`${cx + i},${cy + j}`) ?? []) {
            if (o === e) continue;
            const ox = e.x - o.x, oy = e.y - o.y, od = Math.hypot(ox, oy) || 0.01;
            const min = e.r + o.r;
            if (od < min) {
              vx += (ox / od) * (min - od) * 6;
              vy += (oy / od) * (min - od) * 6;
            }
          }
      e.x += (vx + e.empuje.x) * dt;
      e.y += (vy + e.empuje.y) * dt;
      e.empuje.x *= 0.85;
      e.empuje.y *= 0.85;
      // Toca al personaje
      if (d < e.r + 16 && this.invul <= 0) {
        this.vida -= e.dano;
        this.invul = 0.55;
        this.sacudida = 1;
        auch();
        if (navigator.vibrate) navigator.vibrate(40);
        if (this.vida <= 0) return this.terminar(false);
      }
    }
    this.enemigos = this.enemigos.filter((e) => e.vida > 0);
    // Los que quedaron muy lejos vuelven a aparecer cerca (como en Vampire Survivors)
    const lejos = Math.hypot(this.lienzo.width, this.lienzo.height) / this.escala;
    for (const e of this.enemigos) {
      if (e.tipo !== 'jefe' && Math.hypot(e.x - this.x, e.y - this.y) > lejos) {
        const ang = rnd(0, Math.PI * 2);
        e.x = this.x + Math.cos(ang) * lejos * 0.55;
        e.y = this.y + Math.sin(ang) * lejos * 0.55;
      }
    }
  }

  private recogerGotas(dt: number) {
    for (const gt of this.gotas) {
      const dx = this.x - gt.x, dy = this.y - gt.y, d = Math.hypot(dx, dy) || 1;
      if (d < this.iman) gt.jalando = true;
      if (gt.jalando) {
        const v = 380 + (this.iman - Math.min(d, this.iman)) * 2;
        gt.x += (dx / d) * v * dt;
        gt.y += (dy / d) * v * dt;
        if (d < 14) {
          this.xp += gt.xp;
          gt.xp = 0;
          gotita();
        }
      }
    }
    this.gotas = this.gotas.filter((g) => g.xp > 0);
    // Demasiadas gotitas: se juntan en una grande (rendimiento)
    if (this.gotas.length > 260) {
      const sobran = this.gotas.splice(0, this.gotas.length - 200);
      const suma = sobran.reduce((a, b) => a + b.xp, 0);
      this.gotas.push({ x: sobran[0].x, y: sobran[0].y, xp: suma, jalando: false });
    }
    for (const c of this.cosas) {
      if (Math.hypot(c.x - this.x, c.y - this.y) < 26) {
        c.x = NaN;
        if (c.tipo === 'toallita') {
          this.vida = Math.min(this.vidaMax, this.vida + 30);
          this.aviso('🧻 +30 de vida');
        } else if (c.tipo === 'iman') {
          for (const g of this.gotas) g.jalando = true;
          this.aviso('🧲 ¡Todas las gotitas!');
        } else {
          // ¡Ola de agua fría! Limpia todo lo que se ve
          for (const e of [...this.enemigos]) if (e.tipo !== 'jefe') this.herir(e, 9999, 0, 0);
          this.aviso('🌊 ¡Agua fría! Todo limpio');
          rumor(0.8, 900, 0.1, 0, 0.5, 300);
        }
      }
    }
    this.cosas = this.cosas.filter((c) => !Number.isNaN(c.x));
    if (this.xp >= this.xpSig && !this.pausado) this.subirNivel();
  }

  private pintarHud() {
    const falta = Math.max(0, DURACION - this.t);
    const txt = `${Math.floor(falta / 60)}:${String(Math.floor(falta % 60)).padStart(2, '0')}`;
    const q = (s: string) => this.raiz.querySelector(s) as HTMLElement;
    if (q('.lavado-tiempo').textContent !== txt) q('.lavado-tiempo').textContent = txt;
    q('.lavado-nivel').textContent = `Nv ${this.nivel}`;
    q('.lavado-bajas').textContent = `🦠 ${this.eliminados}`;
    (q('.lavado-xp i') as HTMLElement).style.width = `${Math.min(100, (this.xp / this.xpSig) * 100)}%`;
  }

  // ------------------------------------------------------------------------------------------- Dibujo
  private dibujar() {
    const g = this.g;
    const W = this.lienzo.width, H = this.lienzo.height, e = this.escala;
    g.setTransform(1, 0, 0, 1, 0, 0);
    const sx = this.sacudida ? rnd(-4, 4) * this.sacudida : 0, sy = this.sacudida ? rnd(-4, 4) * this.sacudida : 0;
    // La cámara sigue al personaje
    g.setTransform(e, 0, 0, e, W / 2 - this.x * e + sx, H / 2 - this.y * e + sy);
    this.dibujarCara(W, H);
    for (const c of this.charcos) {
      const a = Math.min(1, c.vida * 2);
      g.fillStyle = `rgba(143,211,242,${0.45 * a})`;
      g.beginPath();
      g.ellipse(c.x, c.y, c.r, c.r * 0.7, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = `rgba(255,255,255,${0.6 * a})`;
      g.lineWidth = 2;
      g.stroke();
    }
    // Gotitas de experiencia
    for (const gt of this.gotas) {
      const r = gt.xp >= 5 ? 7 : gt.xp >= 2 ? 5.5 : 4.2;
      g.fillStyle = gt.xp >= 5 ? '#ff7aa8' : gt.xp >= 2 ? '#7be0a8' : '#6cc6f5';
      g.beginPath();
      g.moveTo(gt.x, gt.y - r * 1.5);
      g.quadraticCurveTo(gt.x + r, gt.y, gt.x, gt.y + r);
      g.quadraticCurveTo(gt.x - r, gt.y, gt.x, gt.y - r * 1.5);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.8)';
      g.fillRect(gt.x - r * 0.35, gt.y - r * 0.4, r * 0.3, r * 0.3);
    }
    for (const c of this.cosas) {
      g.font = '22px sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(c.tipo === 'toallita' ? '🧻' : c.tipo === 'iman' ? '🧲' : '🌊', c.x, c.y + Math.sin(this.t * 4) * 3);
    }
    // Aura de espuma
    const esu = this.armas.get('espuma') ?? 0;
    if (esu) {
      const radio = (50 + (esu >= 2 ? 16 : 0) + (esu >= 4 ? 16 : 0)) * this.mArea;
      g.fillStyle = 'rgba(255,255,255,0.22)';
      g.beginPath();
      g.arc(this.x, this.y, radio, 0, Math.PI * 2);
      g.fill();
      for (let i = 0; i < 12; i++) {
        const a = i * 0.52 + this.t * 0.8;
        g.fillStyle = 'rgba(255,255,255,0.7)';
        g.beginPath();
        g.arc(this.x + Math.cos(a) * radio * 0.92, this.y + Math.sin(a) * radio * 0.92, 5 + Math.sin(this.t * 3 + i) * 2, 0, Math.PI * 2);
        g.fill();
      }
    }
    for (const en of this.enemigos) this.dibujarEnemigo(en);
    this.dibujarPersonaje();
    // Esponjas
    const esp = this.armas.get('esponja') ?? 0;
    if (esp) {
      const cant = 1 + (esp >= 2 ? 1 : 0) + (esp >= 4 ? 1 : 0);
      const radio = (esp >= 3 ? 88 : 70) * this.mArea;
      for (let i = 0; i < cant; i++) {
        const a = this.angEsponja + (i * Math.PI * 2) / cant;
        const x = this.x + Math.cos(a) * radio, y = this.y + Math.sin(a) * radio;
        g.save();
        g.translate(x, y);
        g.rotate(a * 2);
        g.fillStyle = '#f7d774';
        this.redondo(-15, -10, 30, 20, 6);
        g.fillStyle = '#6cc68a';
        this.redondo(-15, -10, 30, 7, 4);
        g.fillStyle = 'rgba(160,110,30,0.35)';
        for (let k = 0; k < 4; k++) g.fillRect(-10 + k * 6, 0, 2.5, 2.5);
        g.restore();
      }
    }
    // Proyectiles
    for (const p of this.proyectiles) {
      if (p.arma === 'burbujas') {
        const gr = g.createRadialGradient(p.x - p.r * 0.3, p.y - p.r * 0.3, 1, p.x, p.y, p.r);
        gr.addColorStop(0, 'rgba(255,255,255,0.95)');
        gr.addColorStop(0.6, 'rgba(190,228,244,0.6)');
        gr.addColorStop(1, 'rgba(143,211,242,0.9)');
        g.fillStyle = gr;
        g.beginPath();
        g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        g.fill();
      } else {
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.t * 14);
        g.fillStyle = '#f2a5b8';
        this.redondo(-p.r, -p.r * 0.55, p.r * 2, p.r * 1.1, 5);
        g.fillStyle = '#ffffff';
        g.fillRect(-p.r, -2, p.r * 2, 4);
        g.restore();
      }
    }
    for (const c of this.chorros) {
      g.save();
      g.translate(c.x, c.y);
      g.rotate(c.ang);
      const gr = g.createLinearGradient(0, 0, c.largo, 0);
      gr.addColorStop(0, 'rgba(143,211,242,0.9)');
      gr.addColorStop(1, 'rgba(143,211,242,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(0, -c.ancho * 0.25);
      g.quadraticCurveTo(c.largo * 0.5, -c.ancho * 0.7, c.largo, 0);
      g.quadraticCurveTo(c.largo * 0.5, c.ancho * 0.7, 0, c.ancho * 0.25);
      g.fill();
      g.restore();
    }
    // Números de daño
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const n of this.numeros) {
      g.globalAlpha = Math.min(1, n.vida * 3);
      g.font = '700 13px Fredoka, sans-serif';
      g.lineWidth = 3;
      g.strokeStyle = 'rgba(61,43,39,0.7)';
      g.strokeText(n.texto, n.x, n.y);
      g.fillStyle = n.color;
      g.fillText(n.texto, n.x, n.y);
    }
    g.globalAlpha = 1;
    // El joystick bajo el dedo
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (this.dedo) {
      const d = Math.min(2, window.devicePixelRatio || 1);
      g.strokeStyle = 'rgba(255,255,255,0.6)';
      g.lineWidth = 3 * d;
      g.beginPath();
      g.arc(this.dedo.x0 * d, this.dedo.y0 * d, 46 * d, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.beginPath();
      g.arc(this.dedo.x * d, this.dedo.y * d, 18 * d, 0, Math.PI * 2);
      g.fill();
    }
  }

  private redondo(x: number, y: number, w: number, h: number, r: number) {
    const g = this.g;
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.fill();
  }

  /** La cara por dentro: piel con poros, pequitas y cachetes rosados, que se repite hacia todos lados. */
  private dibujarCara(W: number, H: number) {
    const g = this.g;
    if (!this.poros) {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const p = c.getContext('2d')!;
      p.fillStyle = this.rol === 'el' ? '#f1c3a0' : '#f6cfb3';
      p.fillRect(0, 0, 256, 256);
      let s = 7;
      const aleatorio = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 90; i++) {
        p.fillStyle = `rgba(190,120,90,${0.08 + aleatorio() * 0.1})`;
        p.beginPath();
        p.arc(aleatorio() * 256, aleatorio() * 256, 1 + aleatorio() * 1.8, 0, Math.PI * 2);
        p.fill();
      }
      for (let i = 0; i < 6; i++) {
        p.fillStyle = 'rgba(160,90,60,0.22)';
        p.beginPath();
        p.arc(aleatorio() * 256, aleatorio() * 256, 2.5 + aleatorio() * 2, 0, Math.PI * 2);
        p.fill();
      }
      this.poros = g.createPattern(c, 'repeat');
    }
    const e = this.escala;
    const x0 = this.x - W / 2 / e - 10, y0 = this.y - H / 2 / e - 10;
    g.fillStyle = this.poros!;
    g.fillRect(x0, y0, W / e + 20, H / e + 20);
    // Cachetes rosados y pestañas gigantes de adorno, repartidos por la cara
    const paso = 700;
    for (let i = Math.floor(x0 / paso) - 1; i <= Math.floor((x0 + W / e) / paso) + 1; i++)
      for (let j = Math.floor(y0 / paso) - 1; j <= Math.floor((y0 + H / e) / paso) + 1; j++) {
        const cx = i * paso + ((i * 37 + j * 91) % 5) * 60, cy = j * paso + ((i * 53 + j * 17) % 5) * 60;
        const gr = g.createRadialGradient(cx, cy, 10, cx, cy, 150);
        gr.addColorStop(0, 'rgba(242,156,176,0.35)');
        gr.addColorStop(1, 'rgba(242,156,176,0)');
        g.fillStyle = gr;
        g.beginPath();
        g.arc(cx, cy, 150, 0, Math.PI * 2);
        g.fill();
        if ((i + j) % 2 === 0) {
          g.strokeStyle = 'rgba(74,50,40,0.35)';
          g.lineWidth = 3;
          for (let k = 0; k < 7; k++) {
            g.beginPath();
            g.moveTo(cx + 220 + k * 16, cy + 180);
            g.quadraticCurveTo(cx + 222 + k * 16, cy + 150, cx + 230 + k * 18, cy + 135);
            g.stroke();
          }
        }
      }
  }

  private dibujarEnemigo(e: Enemigo) {
    const g = this.g;
    const b = Math.sin(e.fase * 6) * 0.08;
    const blanco = e.golpe > 0;
    g.save();
    g.translate(e.x, e.y);
    const ojos = (sep: number, r: number, bravo: boolean, y = -e.r * 0.15) => {
      for (const s of [-1, 1]) {
        g.fillStyle = '#fff';
        g.beginPath();
        g.arc(s * sep, y, r, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#2b1d18';
        g.beginPath();
        g.arc(s * sep + Math.sign(this.x - e.x) * r * 0.3, y + r * 0.1, r * 0.5, 0, Math.PI * 2);
        g.fill();
        if (bravo) {
          g.strokeStyle = '#2b1d18';
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(s * (sep + r), y - r * 1.4);
          g.lineTo(s * (sep - r * 0.6), y - r * 0.8);
          g.stroke();
        }
      }
    };
    switch (e.tipo) {
      case 'germen': {
        g.fillStyle = blanco ? '#fff' : '#7ccf6b';
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2 + e.fase;
          g.beginPath();
          g.arc(Math.cos(a) * e.r * 0.95, Math.sin(a) * e.r * 0.95, e.r * 0.28, 0, Math.PI * 2);
          g.fill();
        }
        g.beginPath();
        g.ellipse(0, 0, e.r * (1 + b), e.r * (1 - b), 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = 'rgba(40,110,40,0.35)';
        g.beginPath();
        g.arc(e.r * 0.35, e.r * 0.4, e.r * 0.2, 0, Math.PI * 2);
        g.fill();
        ojos(e.r * 0.36, e.r * 0.26, false);
        break;
      }
      case 'punto':
        g.fillStyle = blanco ? '#fff' : '#3a2b2b';
        g.beginPath();
        g.arc(0, 0, e.r, 0, Math.PI * 2);
        g.fill();
        ojos(e.r * 0.4, e.r * 0.28, true);
        break;
      case 'grasa':
        g.fillStyle = blanco ? '#fff' : '#f7c948';
        g.beginPath();
        g.moveTo(0, -e.r * 1.4);
        g.quadraticCurveTo(e.r * 1.1, 0, 0, e.r);
        g.quadraticCurveTo(-e.r * 1.1, 0, 0, -e.r * 1.4);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,0.7)';
        g.beginPath();
        g.ellipse(-e.r * 0.35, -e.r * 0.2, e.r * 0.15, e.r * 0.3, -0.4, 0, Math.PI * 2);
        g.fill();
        ojos(e.r * 0.32, e.r * 0.22, false, e.r * 0.1);
        break;
      case 'granito':
      case 'jefe': {
        const jefe = e.tipo === 'jefe';
        g.fillStyle = blanco ? '#fff' : jefe ? '#e4574b' : '#f08a7c';
        g.beginPath();
        g.ellipse(0, 0, e.r * (1 + b * 0.5), e.r * 0.85, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#fff6d8';
        g.beginPath();
        g.arc(0, -e.r * 0.45, e.r * 0.3, 0, Math.PI * 2);
        g.fill();
        ojos(e.r * 0.34, e.r * 0.18, true, e.r * 0.05);
        g.strokeStyle = '#7a2e33';
        g.lineWidth = jefe ? 4 : 2;
        g.beginPath();
        g.arc(0, e.r * 0.45, e.r * 0.22, Math.PI * 1.15, Math.PI * 1.85);
        g.stroke();
        if (jefe) {
          // Corona y barra de vida
          g.fillStyle = '#f5c246';
          g.beginPath();
          g.moveTo(-e.r * 0.5, -e.r * 0.78);
          for (let k = 0; k <= 4; k++) g.lineTo(-e.r * 0.5 + k * e.r * 0.25, -e.r * (k % 2 ? 1.25 : 0.95));
          g.lineTo(e.r * 0.5, -e.r * 0.78);
          g.fill();
          g.fillStyle = 'rgba(61,43,39,0.6)';
          g.fillRect(-e.r, e.r + 8, e.r * 2, 8);
          g.fillStyle = '#e4574b';
          g.fillRect(-e.r, e.r + 8, e.r * 2 * Math.max(0, e.vida / e.max), 8);
        }
        break;
      }
      case 'acaro':
        g.strokeStyle = blanco ? '#fff' : '#6d6a7a';
        g.lineWidth = 2;
        for (let k = 0; k < 3; k++)
          for (const s of [-1, 1]) {
            g.beginPath();
            g.moveTo(0, (k - 1) * e.r * 0.5);
            g.lineTo(s * e.r * 1.4, (k - 1) * e.r * 0.7 + Math.sin(e.fase * 20 + k) * 2);
            g.stroke();
          }
        g.fillStyle = blanco ? '#fff' : '#9a97a8';
        g.beginPath();
        g.ellipse(0, 0, e.r, e.r * 0.8, 0, 0, Math.PI * 2);
        g.fill();
        ojos(e.r * 0.35, e.r * 0.25, true);
        break;
    }
    g.restore();
  }

  private dibujarPersonaje() {
    const g = this.g;
    const pose = this.invul > 0.3 ? 'sorpresa' : 'feliz';
    const img = this.sprites.get(pose);
    const alto = 62;
    g.fillStyle = 'rgba(61,43,39,0.25)';
    g.beginPath();
    g.ellipse(this.x, this.y + 6, 18, 6, 0, 0, Math.PI * 2);
    g.fill();
    if (img?.complete && img.naturalWidth) {
      const w = (img.naturalWidth / img.naturalHeight) * alto;
      g.save();
      g.translate(this.x, this.y + 8 - Math.abs(Math.sin(this.t * 9)) * (this.dedo ? 3 : 0));
      if ((this.rol === 'ella') !== this.mira < 0) g.scale(-1, 1);
      if (this.invul > 0 && Math.floor(this.invul * 20) % 2) g.globalAlpha = 0.5;
      g.drawImage(img, -w / 2, -alto, w, alto);
      g.restore();
    }
    // Barra de vida debajo
    g.fillStyle = 'rgba(61,43,39,0.55)';
    g.fillRect(this.x - 22, this.y + 14, 44, 6);
    g.fillStyle = this.vida / this.vidaMax < 0.3 ? '#e4574b' : '#4fb477';
    g.fillRect(this.x - 22, this.y + 14, 44 * Math.max(0, this.vida / this.vidaMax), 6);
  }

  // ------------------------------------------------------------------------------------------- Fin
  private terminar(gano: boolean) {
    if (this.terminado) return;
    this.terminado = true;
    cancelAnimationFrame(this.cuadro);
    if (gano) {
      // Una ola de agua limpia lo que quedó
      for (const e of this.enemigos) this.gotas.push({ x: e.x, y: e.y, xp: 0, jalando: false });
      this.enemigos = [];
      subir();
    }
    this.dibujar();
    const fin = this.raiz.querySelector('.lavado-fin') as HTMLElement;
    const seg = Math.min(DURACION, this.t);
    fin.innerHTML = `<h2>${gano ? '¡Cara limpiecita! ✨' : this.t < 20 ? 'Otro día te lavas bien…' : '¡Quedó a medias!'}</h2>
      <p>${Math.floor(seg / 60)}:${String(Math.floor(seg % 60)).padStart(2, '0')} · Nivel ${this.nivel} · ${this.eliminados} eliminados${this.jefeMuerto ? ' · ¡venciste al Espinillón!' : ''}</p>
      <button class="boton boton-menta" data-listo>Listo</button>`;
    fin.hidden = false;
    fin.querySelector('[data-listo]')!.addEventListener('click', () => this.cerrar(gano, seg), { once: true });
  }

  private cerrar(gano: boolean, seg: number) {
    window.removeEventListener('resize', this.ajustar);
    window.removeEventListener('keydown', this.teclado);
    window.removeEventListener('keyup', this.teclado);
    this.raiz.classList.remove('visible');
    setTimeout(() => this.raiz.remove(), 450);
    lavado.actual = null;
    this.listo({ segundos: seg, gano, eliminados: this.eliminados, nivel: this.nivel, jefe: this.jefeMuerto });
  }

  /** Para las pruebas: adelantar el tiempo, tomar una mejora, ganar. */
  probar(que: 'mejora' | 'ganar' | 'tiempo' | 'aguante', v = 0) {
    if (que === 'tiempo') this.t = v;
    if (que === 'aguante') this.vida = this.vidaMax = 99999;
    if (que === 'mejora') this.escoger(v);
    if (que === 'ganar') this.terminar(true);
  }
}

export const lavado: { actual: LavadoDeCara | null } = { actual: null };
(window as unknown as { __lavado: typeof lavado }).__lavado = lavado;
