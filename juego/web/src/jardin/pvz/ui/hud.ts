// Interfaz de la partida (HTML encima del lienzo), como en PvZ: banco de semillas con el sol, sobres con su recarga,
// pala, abono de PvZ 2, menú, barra de progreso con banderas y los avisos grandes. En celular horizontal el banco va en
// una columna a la izquierda (como el PvZ de celular); en pantallas más cuadradas, arriba (como el de computador).
import { arteDe, retrato } from '../arte/index';
import type { MotorPvZ } from '../motor/motor';

export type Herramienta = { tipo: 'sobre'; planta: string } | { tipo: 'cinta'; item: number; planta: string } | { tipo: 'pala' } | { tipo: 'abono' };

export interface OpcionesHud {
  alElegir(h: Herramienta | null): void;
  alMenu(): void;
}

const PALA_SVG = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M36 6 l6 6 -14 14 6 6 -14 14 c-6 6 -14 6 -18 2 s-4 -12 2 -18 l14 -14 6 6z" fill="#b9c2c9" stroke="#1d1408" stroke-width="4" stroke-linejoin="round"/><path d="M40 4 l20 20 -6 6 -20 -20z" fill="#a0652e" stroke="#1d1408" stroke-width="4" stroke-linejoin="round"/></svg>`;

export class HudPvZ {
  readonly raiz: HTMLElement;
  private sol!: HTMLElement;
  private sobres = new Map<string, HTMLButtonElement>();
  private cintaEl: HTMLElement | null = null;
  private cintaItems = new Map<number, HTMLButtonElement>();
  private palaBtn!: HTMLButtonElement;
  private abonoBtn!: HTMLButtonElement;
  private barra!: HTMLElement;
  private cabeza!: HTMLElement;
  private aviso!: HTMLElement;
  private avisoT = 0;
  private seleccion: Herramienta | null = null;
  private ultimoSol = -1;

  constructor(contenedor: HTMLElement, private readonly op: OpcionesHud) {
    this.raiz = document.createElement('div');
    this.raiz.className = 'pvz-hud';
    contenedor.append(this.raiz);
    this.ajustarOrientacion();
    window.addEventListener('resize', this.ajustarOrientacion);
  }

  private ajustarOrientacion = (): void => {
    const W = this.raiz.parentElement?.clientWidth ?? window.innerWidth;
    const H = this.raiz.parentElement?.clientHeight ?? window.innerHeight;
    const vertical = W / Math.max(1, H) >= 1.6;
    this.raiz.classList.toggle('vertical', vertical);
    this.raiz.classList.toggle('horizontal', !vertical);
    this.raiz.style.setProperty('--alto', H + 'px');
    this.raiz.style.setProperty('--ancho', W + 'px');
  };

  /** Arma el banco del nivel (sobres del mazo o la cinta). */
  montar(m: MotorPvZ, nombreNivel: string): void {
    this.raiz.innerHTML = '';
    this.sobres.clear();
    this.cintaItems.clear();
    this.seleccion = null;
    const banco = document.createElement('div');
    banco.className = 'pvz-banco';
    const sol = document.createElement('div');
    sol.className = 'pvz-contador-sol';
    sol.innerHTML = '<span class="icono"></span><b>0</b>';
    const iconoSol = this.retratoDe('sol', 64);
    if (iconoSol) sol.querySelector('.icono')!.append(iconoSol);
    this.sol = sol.querySelector('b')!;
    banco.append(sol);
    if (m.cinta) {
      // La cinta transportadora: sin sol y sin recarga (1-10, bolera).
      sol.classList.add('oculto');
      this.cintaEl = document.createElement('div');
      this.cintaEl.className = 'pvz-cinta';
      banco.append(this.cintaEl);
    } else {
      this.cintaEl = null;
      const lista = document.createElement('div');
      lista.className = 'pvz-sobres';
      for (const tj of m.mazo) {
        const b = this.crearSobre(tj.tipo, String(tj.sol));
        b.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          this.elegir(this.seleccion?.tipo === 'sobre' && this.seleccion.planta === tj.tipo ? null : { tipo: 'sobre', planta: tj.tipo });
        });
        this.sobres.set(tj.tipo, b);
        lista.append(b);
      }
      banco.append(lista);
    }
    this.raiz.append(banco);

    const herramientas = document.createElement('div');
    herramientas.className = 'pvz-herramientas';
    this.palaBtn = document.createElement('button');
    this.palaBtn.className = 'pvz-pala';
    this.palaBtn.type = 'button';
    this.palaBtn.setAttribute('aria-label', 'Pala');
    this.palaBtn.innerHTML = PALA_SVG;
    this.palaBtn.hidden = !m.palaActiva;
    this.palaBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.elegir(this.seleccion?.tipo === 'pala' ? null : { tipo: 'pala' });
    });
    this.abonoBtn = document.createElement('button');
    this.abonoBtn.className = 'pvz-abono';
    this.abonoBtn.type = 'button';
    this.abonoBtn.setAttribute('aria-label', 'Abono');
    this.abonoBtn.innerHTML = '<span class="icono"></span><span class="cargas"></span>';
    const iconoAbono = this.retratoDe('abono', 72);
    if (iconoAbono) this.abonoBtn.querySelector('.icono')!.append(iconoAbono);
    this.abonoBtn.hidden = !m.abonoActivo;
    this.abonoBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (m.abonoCargas <= 0) return;
      this.elegir(this.seleccion?.tipo === 'abono' ? null : { tipo: 'abono' });
    });
    const menu = document.createElement('button');
    menu.className = 'pvz-boton-menu';
    menu.type = 'button';
    menu.textContent = 'Menú';
    menu.addEventListener('click', () => this.op.alMenu());
    herramientas.append(this.palaBtn, this.abonoBtn, menu);
    this.raiz.append(herramientas);

    const progreso = document.createElement('div');
    progreso.className = 'pvz-progreso';
    progreso.innerHTML = `<span class="nombre">${nombreNivel}</span><span class="barra"><i class="relleno"></i><i class="cabeza"></i></span>`;
    this.barra = progreso.querySelector('.barra')!;
    this.cabeza = progreso.querySelector('.cabeza')!;
    for (const b of m.posBanderas) {
      const f = document.createElement('i');
      f.className = 'bandera';
      f.style.setProperty('--p', String(b));
      this.barra.append(f);
    }
    const cara = this.retratoDe('zombi', 48, true);
    if (cara) this.cabeza.append(cara);
    progreso.hidden = m.oleadasTotal <= 0;
    this.raiz.append(progreso);

    this.aviso = document.createElement('div');
    this.aviso.className = 'pvz-aviso';
    this.raiz.append(this.aviso);
    this.ultimoSol = -1;
    this.actualizar(m);
  }

  private retratoDe(id: string, tam: number, arriba = false): HTMLCanvasElement | null {
    const d = arteDe(id);
    if (!d) return null;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const L = retrato(d, Math.round(tam * dpr), 'quieto', arriba ? { encuadre: 'arriba', margen: 2 } : {});
    L.style.width = '100%';
    L.style.height = '100%';
    return L;
  }

  private crearSobre(planta: string, costo: string): HTMLButtonElement {
    const b = document.createElement('button');
    b.className = 'pvz-sobre';
    b.type = 'button';
    b.dataset.planta = planta;
    b.innerHTML = `<span class="ventana"></span><b class="costo">${costo}</b><i class="recarga"></i>`;
    // Cada sobre tiene su propio retrato: retrato() se repinta solo cuando termina de cargar el arte.
    const d = arteDe(planta);
    if (d) {
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const r = retrato(d, Math.round(64 * dpr), 'quieto', { alto: Math.round(52 * dpr), encuadre: 'arriba', margen: Math.round(3 * dpr) });
      b.querySelector('.ventana')!.append(r);
    } else {
      b.querySelector('.ventana')!.textContent = planta.slice(0, 3);
    }
    return b;
  }

  get herramienta(): Herramienta | null {
    return this.seleccion;
  }

  elegir(h: Herramienta | null): void {
    this.seleccion = h;
    for (const [tipo, b] of this.sobres) b.classList.toggle('elegido', h?.tipo === 'sobre' && h.planta === tipo);
    for (const [id, b] of this.cintaItems) b.classList.toggle('elegido', h?.tipo === 'cinta' && h.item === id);
    this.palaBtn?.classList.toggle('elegido', h?.tipo === 'pala');
    this.abonoBtn?.classList.toggle('elegido', h?.tipo === 'abono');
    this.op.alElegir(h);
  }

  /** Cada cuadro: sol, recargas, disponibilidad, cinta, abono y progreso. */
  actualizar(m: MotorPvZ): void {
    if (m.sol !== this.ultimoSol) {
      this.sol.textContent = String(m.sol);
      this.ultimoSol = m.sol;
    }
    for (const tj of m.mazo) {
      const b = this.sobres.get(tj.tipo);
      if (!b) continue;
      const r = tj.recarga > 0 ? tj.restante / tj.recarga : 0;
      b.style.setProperty('--r', r.toFixed(3));
      b.classList.toggle('recargando', r > 0);
      b.classList.toggle('sin-sol', m.sol < tj.sol);
    }
    if (this.seleccion?.tipo === 'sobre') {
      const tj = m.tarjeta(this.seleccion.planta);
      if (tj && !tj.disponible) this.elegir(null);
    }
    if (this.cintaEl && m.cinta) this.actualizarCinta(m);
    if (this.abonoBtn) {
      this.abonoBtn.querySelector('.cargas')!.textContent = '●'.repeat(m.abonoCargas) + '○'.repeat(Math.max(0, m.abonoMax - m.abonoCargas));
      this.abonoBtn.classList.toggle('vacio', m.abonoCargas <= 0);
      if (this.seleccion?.tipo === 'abono' && m.abonoCargas <= 0) this.elegir(null);
    }
    if (this.barra) {
      const p = m.progreso;
      this.barra.style.setProperty('--p', p.toFixed(4));
      const alcanzadas = m.banderasAlcanzadas;
      this.barra.querySelectorAll('.bandera').forEach((f, i) => f.classList.toggle('alzada', i < alcanzadas));
    }
    if (this.avisoT > 0 && performance.now() > this.avisoT) {
      this.aviso.className = 'pvz-aviso';
      this.aviso.textContent = '';
      this.avisoT = 0;
    }
  }

  private actualizarCinta(m: MotorPvZ): void {
    const vivos = new Set<number>();
    for (const it of m.cinta!) {
      vivos.add(it.id);
      let b = this.cintaItems.get(it.id);
      if (!b) {
        b = this.crearSobre(it.tipo, '');
        b.classList.add('en-cinta');
        const id = it.id;
        const planta = it.tipo;
        b.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          this.elegir(this.seleccion?.tipo === 'cinta' && this.seleccion.item === id ? null : { tipo: 'cinta', item: id, planta });
        });
        this.cintaItems.set(id, b);
        this.cintaEl!.append(b);
      }
      b.style.setProperty('--x', it.x.toFixed(3));
    }
    for (const [id, b] of this.cintaItems) {
      if (vivos.has(id)) continue;
      b.remove();
      this.cintaItems.delete(id);
      if (this.seleccion?.tipo === 'cinta' && this.seleccion.item === id) this.elegir(null);
    }
  }

  /** Aviso grande en el centro (`clase`: 'rojo' para las oleadas, 'plantar' para «¡A plantar!»). */
  mostrarAviso(texto: string, clase = '', segundos = 2.5): void {
    this.aviso.className = 'pvz-aviso visible ' + clase;
    this.aviso.textContent = texto;
    this.avisoT = performance.now() + segundos * 1000;
  }

  /** Ancho que tapa el banco en columna (0 si el banco va arriba). */
  anchoBanco(): number {
    if (!this.raiz.classList.contains('vertical')) return 0;
    return this.raiz.querySelector('.pvz-banco')?.getBoundingClientRect().width ?? 0;
  }

  /** Posición en pantalla del contador de sol (para que los soles vuelen hasta él). */
  posicionSol(): { x: number; y: number } {
    const r = this.sol.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  destruir(): void {
    window.removeEventListener('resize', this.ajustarOrientacion);
    this.raiz.remove();
  }
}
