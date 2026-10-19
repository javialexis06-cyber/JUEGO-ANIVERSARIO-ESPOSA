// Vista de una partida de Plantas contra Zombis: dibuja en un <canvas> el escenario, las plantas, los zombis, los
// proyectiles, los soles y los efectos a partir del motor (que nunca toca la vista). Coordenadas: x del mundo = x del
// motor; y del mundo = ORIGEN_CESPED_Y + y del motor (arte/geometria.ts). La cámara solo se desliza en x.
import {
  aplicarPerdidas, arteDe, cargarPersonajes, COLOR_BORDE_DIA, DEF_ARTE, dibujarFondoDia, dibujarMarcador, dibujarPersonaje, liberarArte,
  liberarFondoDia, piezaSuelta, retrato, variantesPorDano, varianteDe, type DefPersonaje, type Suelta, type Tinte,
} from '../arte/index';
import {
  ALTO_MUNDO, ANCHO_COL, casillaEn, centroCol, centroFila, COLUMNAS, ORIGEN_CESPED_Y, PIE_PLANTA, PIE_ZOMBI, X_MAX, X_MIN,
} from '../arte/geometria';
import { fondoBlender, liberarFondosBlender } from '../arte/blender';
import { defZombi } from '../datos/zombis';
import type { MotorPvZ } from '../motor/motor';
import type { Evento, Planta, Zombi, ZombiCaido } from '../tipos';

/** Proyectiles del motor → arte. */
const ARTE_PROYECTIL: Record<string, string> = {
  guisante: 'guisante', guisanteHielo: 'guisante_hielo', espora: 'espora', guisanteGigante: 'guisante',
  nuezbolos: 'nuez_bolos', nuezexplosiva: 'nuez_explosiva',
};
const ARTE_MONEDA: Record<string, string> = { plata: 'moneda_plata', oro: 'moneda_oro', diamante: 'diamante', bolsa: 'bolsa_monedas' };
/** Escala de los proyectiles que en el arte comparten dibujo (el guisante gigante es el normal, grande). */
const ESCALA_PROYECTIL: Record<string, number> = { guisanteGigante: 2.6 };

interface Particula {
  s: Suelta;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  suelo: number;
  t: number;
  espejo: boolean;
}

interface Efecto {
  id: string;
  estado: string;
  x: number;
  y: number;
  t: number;
  dur: number;
  escala: number;
}

/** Sol o moneda que vuela al contador después de recogerlo. */
interface Volando {
  id: string;
  x: number;
  y: number;
  t: number;
  escala: number;
}

interface TextoFlotante {
  texto: string;
  x: number;
  y: number;
  t: number;
  color: string;
}

export interface Fantasma {
  tipo: string;
  fila: number;
  col: number;
  valido: boolean;
}

/** Zombi de adorno en la calle (vista previa del nivel). */
export interface ZombiPrevio {
  tipo: string;
  x: number;
  y: number;
  semilla: number;
}

export class VistaPvZ {
  readonly lienzo: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private dpr = 1;
  /** CSS px por unidad de mundo. */
  private s = 1;
  /** Ancho visible en unidades de mundo. */
  private vis = 800;
  /** Borde izquierdo de la cámara en el mundo y su destino (se desliza). */
  camaraX = -200;
  private camaraDestino = -200;
  private escalaCargada = 0;
  private filas = 5;
  /** Filas con pasto (las fija el motor al montar; antes, el nivel para el paseo hasta la calle). */
  filasActivas: number[] = [0, 1, 2, 3, 4];
  private relojes = new Map<number, number>();
  private particulas: Particula[] = [];
  private efectos: Efecto[] = [];
  private textos: TextoFlotante[] = [];
  private volando: Volando[] = [];
  /** Contador de sol en la pantalla (CSS px relativos al lienzo): ahí vuelan los soles recogidos. */
  destinoSol: { x: number; y: number } | null = null;
  private sacudida = 0;
  private resize: ResizeObserver;
  private sobres = new Map<string, HTMLCanvasElement>();
  /** Para el destello verde de los zombis con abono y las plantas abonadas. */
  private brillo = 0;
  previos: ZombiPrevio[] = [];
  fantasma: Fantasma | null = null;
  /** Planta resaltada para la pala o el abono. */
  resaltada: { fila: number; col: number; color: string } | null = null;
  /** Línea roja de la bolera (columna). */
  lineaRoja: number | null = null;

  constructor(readonly contenedor: HTMLElement) {
    this.lienzo = document.createElement('canvas');
    this.lienzo.className = 'pvz-lienzo';
    this.lienzo.setAttribute('aria-label', 'Jardín de Plantas contra Zombis');
    contenedor.append(this.lienzo);
    this.ctx = this.lienzo.getContext('2d', { alpha: false })!;
    this.resize = new ResizeObserver(() => this.redimensionar());
    this.resize.observe(contenedor);
    this.redimensionar();
  }

  /** Ancho visible (unidades de mundo) y escala (CSS px por unidad). */
  get visible(): { vis: number; s: number } {
    return { vis: this.vis, s: this.s };
  }

  private redimensionar(): void {
    const W = Math.max(1, this.contenedor.clientWidth);
    const H = Math.max(1, this.contenedor.clientHeight);
    this.dpr = Math.min(3, window.devicePixelRatio || 1);
    this.lienzo.width = Math.round(W * this.dpr);
    this.lienzo.height = Math.round(H * this.dpr);
    this.lienzo.style.width = W + 'px';
    this.lienzo.style.height = H + 'px';
    this.s = H / ALTO_MUNDO;
    this.vis = W / this.s;
    this.camaraX = this.camaraDestino = this.xJuego();
  }

  /** Ancho (CSS px) que tapa el banco de semillas en columna a la izquierda (celular); 0 si va arriba. */
  margenIzquierdo = 0;

  /** Cámara de juego: algo de la casa a la izquierda y el césped completo con la entrada de la calle. */
  xJuego(): number {
    // Con el banco en columna, los cortacéspedes (x ≈ -70…-10) quedan justo a la derecha del banco.
    if (this.margenIzquierdo > 0) return Math.max(X_MIN - this.margenIzquierdo / this.s, -72 - this.margenIzquierdo / this.s);
    return Math.max(X_MIN, Math.max(-this.vis * 0.17, 760 - this.vis));
  }

  /** Cambia el margen del banco y vuelve a encuadrar la cámara de juego. */
  fijarMargen(px: number): void {
    this.margenIzquierdo = px;
    this.camaraX = this.camaraDestino = this.xJuego();
  }

  /** Cámara de la calle: muestra a los zombis que esperan (selección de semillas). */
  xCalle(): number {
    return Math.max(this.xJuego(), Math.min(X_MAX - this.vis, 560));
  }

  moverCamara(x: number, inmediato = false): void {
    this.camaraDestino = x;
    if (inmediato) this.camaraX = x;
  }

  get camaraQuieta(): boolean {
    return Math.abs(this.camaraX - this.camaraDestino) < 1;
  }

  /** Rasteriza el arte necesario a la escala de la pantalla. */
  async cargar(ids: string[]): Promise<void> {
    const S = this.s * this.dpr;
    const defs = [...new Set(ids)].map((id) => DEF_ARTE[id]).filter(Boolean);
    this.escalaCargada = S;
    await cargarPersonajes(defs, S);
  }

  montar(m: MotorPvZ): void {
    this.filas = m.filas;
    this.filasActivas = m.filasActivas;
    this.relojes.clear();
    this.particulas = [];
    this.efectos = [];
    this.textos = [];
    this.volando = [];
    this.lineaRoja = m.nivel.lineaRoja ?? null;
  }

  /** Punto de la pantalla (CSS px relativos al lienzo) → mundo. */
  aMundo(px: number, py: number): { x: number; y: number } {
    return { x: this.camaraX + px / this.s, y: py / this.s };
  }

  /** Mundo → pantalla (CSS px relativos al lienzo). */
  aPantalla(x: number, y: number): { x: number; y: number } {
    return { x: (x - this.camaraX) * this.s, y: y * this.s };
  }

  casilla(px: number, py: number): { fila: number; col: number } | null {
    const w = this.aMundo(px, py);
    const c = casillaEn(w.x, w.y, this.filas);
    return c ? { fila: c.f, col: c.c } : null;
  }

  /** Sol, moneda, abono o premio bajo el dedo (el más cercano dentro de su radio). */
  recogibleEn(m: MotorPvZ, px: number, py: number): { id: number; tipo: 'sol' | 'moneda' | 'abono' } | 'premio' | null {
    const w = this.aMundo(px, py);
    const r2 = (x: number, y: number, r: number) => (x - w.x) ** 2 + (y - w.y) ** 2 <= r * r;
    if (m.premio && r2(m.premio.x, ORIGEN_CESPED_Y + m.premio.y, 60)) return 'premio';
    // De arriba abajo: lo último dibujado primero.
    for (let i = m.abonosSueltos.length - 1; i >= 0; i--) {
      const a = m.abonosSueltos[i];
      if (r2(a.x, ORIGEN_CESPED_Y + a.y - 20, 42)) return { id: a.id, tipo: 'abono' };
    }
    for (let i = m.monedas.length - 1; i >= 0; i--) {
      const c = m.monedas[i];
      if (r2(c.x, ORIGEN_CESPED_Y + c.y, 38)) return { id: c.id, tipo: 'moneda' };
    }
    for (let i = m.soles.length - 1; i >= 0; i--) {
      const s = m.soles[i];
      if (r2(s.x, ORIGEN_CESPED_Y + s.y, 48)) return { id: s.id, tipo: 'sol' };
    }
    return null;
  }

  /** Efectos que dependen de los eventos del paso: piezas que caen, explosiones, textos, sacudidas. */
  procesar(m: MotorPvZ, eventos: readonly Evento[]): void {
    for (const e of eventos) {
      switch (e.t) {
        case 'pierdeBrazo':
        case 'pierdeCabeza':
        case 'pierdeArmadura': {
          const z = m.zombis.find((q) => q.id === e.zombi) ?? m.caidos.find((q) => q.id === e.zombi);
          if (!z) break;
          const cual = e.t === 'pierdeBrazo' ? 'brazo' : e.t === 'pierdeCabeza' ? 'cabeza' : e.cual === 'casco' ? 'casco' : e.nombre;
          this.soltar(z, cual);
          break;
        }
        case 'explosion': {
          const y = centroFila(e.fila, this.filas);
          if (e.tipo === 'patatapum') this.efectos.push({ id: 'patatapum', estado: 'explota', x: e.x, y: y + PIE_PLANTA, t: 0, dur: 0.9, escala: 1 });
          else this.efectos.push({ id: 'explosion', estado: 'explota', x: e.x, y: y + 40, t: 0, dur: 0.9, escala: e.radio >= 2 ? 1.9 : 1.25 });
          this.sacudida = Math.max(this.sacudida, e.radio >= 2 ? 0.5 : 0.3);
          break;
        }
        case 'cortacesped':
          this.sacudida = Math.max(this.sacudida, 0.12);
          break;
        case 'recogeSol':
          if (this.destinoSol) this.volando.push({ id: 'sol', x: e.x, y: ORIGEN_CESPED_Y + e.y, t: 0, escala: e.valor >= 50 ? 1.35 : e.valor <= 15 ? 0.7 : 1 });
          else this.textos.push({ texto: `+${e.valor}`, x: e.x, y: ORIGEN_CESPED_Y + e.y - 20, t: 0, color: '#fff3a6' });
          break;
        case 'recogeMoneda':
          this.textos.push({ texto: `+$${e.valor}`, x: e.x, y: ORIGEN_CESPED_Y + e.y - 20, t: 0, color: '#d6f5a1' });
          break;
        case 'muere':
          this.relojes.delete(e.zombi);
          break;
      }
    }
  }

  private soltar(z: Zombi, cual: string): void {
    const def = arteDe(z.tipo);
    if (!def || !def.perdidas?.[cual]) return;
    const s = piezaSuelta(def, cual, { t: this.relojes.get(z.id) ?? z.edad, estado: z.estado, semilla: z.id, variantes: this.variantesZombi(def, z) });
    if (!s) return;
    const espejo = z.dir === 1;
    const y = centroFila(z.fila, this.filas) + PIE_ZOMBI;
    const lado = espejo ? -1 : 1;
    this.particulas.push({
      s, x: z.x + (espejo ? -(s.x + s.ancho / 2) : s.x + s.ancho / 2), y: y + s.y + s.alto / 2,
      vx: lado * (40 + Math.random() * 50), vy: -120 - Math.random() * 60, rot: 0, vr: lado * (2 + Math.random() * 3),
      suelo: y - s.alto * 0.25, t: 0, espejo,
    });
  }

  /** Avanza las animaciones propias de la vista (cámara, partículas, efectos, relojes de animación). */
  avanzar(dt: number, m: MotorPvZ | null, pausa: boolean): void {
    const k = 1 - Math.exp(-dt * 3.2);
    this.camaraX += (this.camaraDestino - this.camaraX) * k;
    if (Math.abs(this.camaraDestino - this.camaraX) < 0.5) this.camaraX = this.camaraDestino;
    this.brillo += dt;
    this.sacudida = Math.max(0, this.sacudida - dt);
    if (pausa) return;
    for (const p of this.particulas) {
      p.t += dt;
      if (p.y < p.suelo) {
        p.vy += 900 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.y >= p.suelo) {
          p.y = p.suelo;
          p.vy = -p.vy * 0.25;
          p.vx *= 0.4;
          p.vr *= 0.3;
          if (Math.abs(p.vy) < 40) p.vy = 0;
        }
      }
    }
    this.particulas = this.particulas.filter((p) => p.t < 2.2);
    for (const e of this.efectos) e.t += dt;
    this.efectos = this.efectos.filter((e) => e.t < e.dur);
    for (const t of this.textos) t.t += dt;
    this.textos = this.textos.filter((t) => t.t < 1);
    for (const v of this.volando) v.t += dt;
    this.volando = this.volando.filter((v) => v.t < 0.55);
    if (!m) return;
    for (const z of m.zombis) {
      const quieto = z.congelado > 0 || z.mantequilla > 0;
      const vel = quieto ? 0 : z.lento > 0 ? 0.5 : 1;
      this.relojes.set(z.id, (this.relojes.get(z.id) ?? z.edad) + dt * vel);
    }
  }

  private variantesZombi(def: DefPersonaje, z: Zombi): Record<string, string> {
    const v: Record<string, string> = {};
    if (z.casco && def.variantes?.casco) Object.assign(v, variantesPorDano(def, 'casco', z.casco.vida / z.casco.max));
    if (def.variantes?.bandera) Object.assign(v, varianteDe(def, 'bandera', z.vida < (z.vidaMax * 2) / 3 ? 'agujereada' : 'entera'));
    return v;
  }

  private perdidasZombi(def: DefPersonaje, z: Zombi): { ocultar: string[]; variantes: Record<string, string> } {
    const lista: string[] = [];
    if (z.sinBrazo && def.perdidas?.brazo) lista.push('brazo');
    if (z.sinCabeza && def.perdidas?.cabeza) lista.push('cabeza');
    const d = defZombi(z.tipo);
    if (d?.casco && !z.casco && def.perdidas?.casco) lista.push('casco');
    if (z.tipo === 'pertiga' && !z.datos.pertiga && z.estado !== 'salta' && def.perdidas?.pertiga) lista.push('pertiga');
    return lista.length ? aplicarPerdidas(def, lista) : { ocultar: [], variantes: {} };
  }

  // ------------------------------------------------------------------------------------------------------------
  // Dibujo

  dibujar(m: MotorPvZ | null, t: number): void {
    const ctx = this.ctx;
    const S = this.s * this.dpr;
    if (Math.abs(S - this.escalaCargada) > 0.05 && this.escalaCargada > 0) {
      this.escalaCargada = S;
      void cargarPersonajes(Object.values(DEF_ARTE), S);
    }
    const sx = this.sacudida > 0 ? Math.sin(t * 90) * 6 * this.sacudida : 0;
    const sy = this.sacudida > 0 ? Math.cos(t * 70) * 4 * this.sacudida : 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = COLOR_BORDE_DIA;
    ctx.fillRect(0, 0, this.lienzo.width, this.lienzo.height);
    ctx.setTransform(S, 0, 0, S, (-this.camaraX + sx) * S, sy * S);
    this.fondo(ctx, S, t);
    if (this.lineaRoja !== null) this.lineaBolera(ctx);

    if (m) {
      for (let f = 0; f < this.filas; f++) this.dibujarFila(ctx, m, f, t);
      this.dibujarRecogibles(ctx, m, t);
    }
    for (const z of this.previos) {
      const d = arteDe(z.tipo);
      if (d) dibujarPersonaje(ctx, d, { x: z.x, y: z.y, t: t + z.semilla, estado: d.estados?.includes('quieto') ? 'quieto' : 'camina', semilla: z.semilla });
    }
    for (const e of this.efectos) {
      const d = arteDe(e.id);
      if (d) dibujarPersonaje(ctx, d, { x: e.x, y: e.y, t, estado: e.estado, fase: e.t / e.dur, escala: e.escala });
    }
    for (const p of this.particulas) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.espejo) ctx.scale(-1, 1);
      ctx.globalAlpha = p.t > 1.6 ? Math.max(0, 1 - (p.t - 1.6) / 0.6) : 1;
      ctx.drawImage(p.s.lienzo, -p.s.ancho / 2, -p.s.alto / 2, p.s.ancho, p.s.alto);
      ctx.restore();
    }
    const dSol = arteDe('sol');
    if (dSol && this.destinoSol) {
      const destino = this.aMundo(this.destinoSol.x, this.destinoSol.y);
      for (const v of this.volando) {
        const k = Math.min(1, v.t / 0.55);
        const e = 1 - (1 - k) * (1 - k);
        dibujarPersonaje(ctx, dSol, { x: v.x + (destino.x - v.x) * e, y: v.y + (destino.y - v.y) * e, t, escala: v.escala * (1 - 0.45 * e) });
      }
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "900 26px 'Arial Black','Liberation Sans',sans-serif";
    for (const tx of this.textos) {
      ctx.globalAlpha = 1 - tx.t;
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#1d1408';
      ctx.strokeText(tx.texto, tx.x, tx.y - tx.t * 40);
      ctx.fillStyle = tx.color;
      ctx.fillText(tx.texto, tx.x, tx.y - tx.t * 40);
    }
    ctx.globalAlpha = 1;
  }

  private fondo(ctx: CanvasRenderingContext2D, S: number, t: number): void {
    // El fondo del día sirve para el mundo 1; los demás escenarios llegan con su mundo. Primero el render de Blender;
    // si no está (o aún carga), el dibujo SVG.
    const im = fondoBlender(this.filasActivas);
    if (im) ctx.drawImage(im, X_MIN, 0, X_MAX - X_MIN, ALTO_MUNDO);
    else dibujarFondoDia(ctx, { escala: S, filasActivas: this.filasActivas, t });
  }

  private lineaBolera(ctx: CanvasRenderingContext2D): void {
    const x = (this.lineaRoja ?? 3) * ANCHO_COL;
    ctx.save();
    ctx.strokeStyle = '#d8231b';
    ctx.lineWidth = 5;
    ctx.setLineDash([16, 10]);
    ctx.beginPath();
    ctx.moveTo(x, ORIGEN_CESPED_Y + 4);
    ctx.lineTo(x, ORIGEN_CESPED_Y + this.filas * (this.filas === 6 ? 85 : 100) - 4);
    ctx.stroke();
    ctx.restore();
  }

  private dibujarFila(ctx: CanvasRenderingContext2D, m: MotorPvZ, f: number, t: number): void {
    const yf = centroFila(f, this.filas);
    for (const cm of m.cortacespedes) {
      if (cm.fila !== f || cm.estado === 'usado') continue;
      const d = arteDe('cortacesped');
      if (d) dibujarPersonaje(ctx, d, { x: cm.x, y: yf + 30, t, estado: cm.estado === 'corre' ? 'corre' : 'quieto', semilla: f });
    }
    // Plantas de la fila: base, principal y cubierta, por columna.
    const plantas = m.plantas.filter((p) => p.fila === f && p.vida > 0).sort((a, b) => a.col - b.col || ordenCapa(a) - ordenCapa(b));
    for (const p of plantas) this.dibujarPlanta(ctx, m, p, yf, t);
    if (this.fantasma && this.fantasma.fila === f) this.dibujarFantasma(ctx, yf, t);
    // Zombis caídos y vivos: los de más a la derecha primero (los de adelante quedan encima).
    const caidos = m.caidos.filter((c) => c.fila === f);
    for (const c of caidos) this.dibujarCaido(ctx, c, yf, t);
    const zombis = m.zombis.filter((z) => z.fila === f && z.vida > 0).sort((a, b) => b.x - a.x);
    for (const z of zombis) this.dibujarZombi(ctx, z, yf, t);
    for (const pr of m.proyectiles) {
      if (pr.fila !== f || pr.dano <= 0) continue;
      const id = ARTE_PROYECTIL[pr.tipo] ?? 'guisante';
      const d = arteDe(id);
      if (!d) continue;
      if (pr.forma === 'rodante') {
        dibujarPersonaje(ctx, d, { x: pr.x, y: ORIGEN_CESPED_Y + pr.y + PIE_PLANTA, t, estado: 'rueda', semilla: pr.id });
      } else {
        dibujarPersonaje(ctx, d, { x: pr.x, y: yf + PIE_PLANTA - pr.h, t, semilla: pr.id, escala: ESCALA_PROYECTIL[pr.tipo] ?? 1 });
      }
    }
  }

  private dibujarPlanta(ctx: CanvasRenderingContext2D, m: MotorPvZ, p: Planta, yf: number, t: number): void {
    const d = arteDe(p.tipo);
    const y = yf + PIE_PLANTA;
    if (!d) {
      dibujarMarcador(ctx, { id: p.tipo, alto: 70, nombre: m.defPlanta(p.tipo)?.nombre }, p.x, y);
      return;
    }
    let estado = p.estado;
    const frac = p.vida / p.vidaMax;
    if (p.tipo === 'nuez') estado = frac < 0.34 ? 'herida' : 'quieto';
    if (!d.estados?.includes(estado)) estado = estado === 'carga' ? 'ataca' : d.estados?.[0] ?? 'quieto';
    const dur = d.duraciones?.[estado];
    const fase = dur ? Math.min(1, p.tEstado / dur) : 0;
    const variantes = d.variantes?.dano ? variantesPorDano(d, 'dano', frac) : undefined;
    if (p.abono > 0) {
      ctx.save();
      ctx.shadowColor = 'rgba(140,255,90,0.95)';
      ctx.shadowBlur = 16 + Math.sin(this.brillo * 10) * 6;
    }
    dibujarPersonaje(ctx, d, { x: p.x, y, t: t + (p.id % 7) * 0.37, estado, fase, semilla: p.id, variantes });
    if (p.abono > 0) ctx.restore();
    if (this.resaltada && this.resaltada.fila === p.fila && this.resaltada.col === p.col) {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(this.brillo * 8) * 0.12;
      ctx.fillStyle = this.resaltada.color;
      ctx.beginPath();
      ctx.ellipse(p.x, y - 30, 38, 44, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private dibujarFantasma(ctx: CanvasRenderingContext2D, yf: number, t: number): void {
    const g = this.fantasma!;
    const d = arteDe(g.tipo);
    const x = centroCol(g.col);
    ctx.save();
    ctx.fillStyle = g.valido ? 'rgba(255,255,255,0.22)' : 'rgba(220,40,30,0.25)';
    ctx.fillRect(g.col * ANCHO_COL + 2, yf - (this.filas === 6 ? 42 : 50) + 2, ANCHO_COL - 4, (this.filas === 6 ? 85 : 100) - 4);
    ctx.restore();
    if (d && g.valido) dibujarPersonaje(ctx, d, { x, y: yf + PIE_PLANTA, t, alfa: 0.5, semilla: 1 });
  }

  private dibujarZombi(ctx: CanvasRenderingContext2D, z: Zombi, yf: number, t: number): void {
    const d = arteDe(z.tipo);
    const y = yf + PIE_ZOMBI;
    if (!d) {
      dibujarMarcador(ctx, { id: z.tipo, alto: 120, nombre: defZombi(z.tipo)?.nombre }, z.x, y);
      return;
    }
    let estado = z.estado;
    if (!d.estados?.includes(estado)) estado = estado === 'corre' ? 'camina' : 'camina';
    const dur = d.duraciones?.[estado];
    const fase = dur ? Math.min(1, z.tEstado / dur) : 0;
    // El salto ya lo mueve el motor: se descuenta el avance que el arte agrega.
    const x = estado === 'salta' && d.avances?.salta ? z.x - d.avances.salta * fase : z.x;
    const perd = this.perdidasZombi(d, z);
    const tinte: Tinte = z.golpe > 0.06 ? 'golpe' : z.hipnotizado ? 'hipnotizado' : z.congelado > 0 || z.lento > 0 ? 'congelado' : null;
    if (z.brillante) {
      ctx.save();
      ctx.shadowColor = 'rgba(110,255,80,0.95)';
      ctx.shadowBlur = 14 + Math.sin(this.brillo * 6 + z.id) * 5;
    }
    dibujarPersonaje(ctx, d, {
      x, y, t: this.relojes.get(z.id) ?? z.edad, estado, fase, semilla: z.id, vel: 1, espejo: z.dir === 1, tinte,
      ocultar: perd.ocultar, variantes: { ...this.variantesZombi(d, z), ...perd.variantes },
    });
    if (z.brillante) ctx.restore();
  }

  private dibujarCaido(ctx: CanvasRenderingContext2D, c: ZombiCaido, yf: number, t: number): void {
    const d = arteDe(c.tipo);
    if (!d) return;
    const fase = Math.min(1, c.tCaida / c.duracion);
    const perd = this.perdidasZombi(d, c);
    const ceniza = c.causa === 'ceniza';
    const estado = ceniza && d.estados?.includes('ceniza') ? 'ceniza' : 'muere';
    const alfa = c.causa === 'cortacesped' ? 1 - fase : 1;
    dibujarPersonaje(ctx, d, {
      x: c.x, y: yf + PIE_ZOMBI, t: this.relojes.get(c.id) ?? c.edad, estado, fase, semilla: c.id, espejo: c.dir === 1, alfa,
      tinte: ceniza && estado !== 'ceniza' ? 'ceniza' : null, ocultar: perd.ocultar, variantes: { ...this.variantesZombi(d, c), ...perd.variantes },
    });
  }

  private dibujarRecogibles(ctx: CanvasRenderingContext2D, m: MotorPvZ, t: number): void {
    const dSol = arteDe('sol');
    const dAbono = arteDe('abono');
    for (const a of m.abonosSueltos) {
      if (!dAbono) break;
      const y = ORIGEN_CESPED_Y + a.y - 20 + Math.sin(t * 3 + a.id) * 4;
      ctx.globalAlpha = a.vida < 2 ? 0.4 + 0.6 * Math.abs(Math.sin(t * 8)) : 1;
      dibujarPersonaje(ctx, dAbono, { x: a.x, y, t, semilla: a.id });
      ctx.globalAlpha = 1;
    }
    for (const c of m.monedas) {
      const d = arteDe(ARTE_MONEDA[c.tipo]);
      if (!d) continue;
      ctx.globalAlpha = c.vida < 2 ? 0.4 + 0.6 * Math.abs(Math.sin(t * 8)) : 1;
      dibujarPersonaje(ctx, d, { x: c.x, y: ORIGEN_CESPED_Y + c.y + 20, t, estado: d.estados?.includes('gira') ? 'gira' : 'quieto', semilla: c.id });
      ctx.globalAlpha = 1;
    }
    for (const s of m.soles) {
      if (!dSol) break;
      const meneo = s.estado === 'cae' ? Math.sin(t * 2 + s.id) * 10 : 0;
      ctx.globalAlpha = s.estado === 'quieto' && s.vida < 2 ? 0.35 + 0.65 * Math.abs(Math.sin(t * 7)) : 1;
      dibujarPersonaje(ctx, dSol, { x: s.x + meneo, y: ORIGEN_CESPED_Y + s.y, t: t + s.id, semilla: s.id, escala: s.valor >= 50 ? 1.35 : s.valor <= 15 ? 0.7 : 1 });
      ctx.globalAlpha = 1;
    }
    if (m.premio) this.dibujarPremio(ctx, m, t);
  }

  private dibujarPremio(ctx: CanvasRenderingContext2D, m: MotorPvZ, t: number): void {
    const p = m.premio!;
    const x = p.x;
    const y = ORIGEN_CESPED_Y + p.y + Math.sin(t * 2.5) * 5;
    ctx.save();
    const r = 64 + Math.sin(t * 4) * 6;
    const g = ctx.createRadialGradient(x, y, 4, x, y, r);
    g.addColorStop(0, 'rgba(255,250,200,0.95)');
    g.addColorStop(1, 'rgba(255,250,200,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (p.tipo === 'bolsa') {
      const d = arteDe('bolsa_monedas');
      if (d) dibujarPersonaje(ctx, d, { x, y: y + 24, t });
      return;
    }
    const L = this.sobre(p.tipo === 'planta' ? p.id ?? '' : p.tipo === 'nota' ? '__nota' : '__objeto');
    ctx.drawImage(L, x - 30, y - 40, 60, 80);
  }

  /** Sobre de semilla dibujado en un lienzo (premio en el césped). */
  private sobre(id: string): HTMLCanvasElement {
    const ya = this.sobres.get(id);
    if (ya) return ya;
    const L = document.createElement('canvas');
    L.width = 120;
    L.height = 160;
    const g = L.getContext('2d')!;
    g.beginPath();
    g.roundRect(3, 3, 114, 154, 12);
    const gr = g.createLinearGradient(0, 0, 0, 160);
    gr.addColorStop(0, id === '__nota' ? '#ffffff' : '#fbf6d8');
    gr.addColorStop(1, id === '__nota' ? '#e8e2d0' : '#d9cc93');
    g.fillStyle = gr;
    g.fill();
    g.lineWidth = 5;
    g.strokeStyle = '#1d1408';
    g.stroke();
    const d = arteDe(id);
    if (d) {
      g.beginPath();
      g.roundRect(10, 10, 100, 104, 8);
      g.fillStyle = '#9fd36a';
      g.fill();
      const r = retrato(d, 100, 'quieto', { alto: 104, encuadre: 'arriba', margen: 6 });
      g.drawImage(r, 10, 10, 100, 104);
    } else {
      g.fillStyle = '#1d1408';
      g.font = "900 64px 'Arial Black','Liberation Sans',sans-serif";
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(id === '__nota' ? '✉' : '?', 60, 66);
    }
    this.sobres.set(id, L);
    return L;
  }

  destruir(): void {
    this.resize.disconnect();
    this.lienzo.remove();
    this.sobres.clear();
    liberarFondoDia();
    liberarFondosBlender();
    liberarArte();
  }
}

function ordenCapa(p: Planta): number {
  return p.capa === 'base' ? 0 : p.capa === 'principal' ? 1 : p.capa === 'cubierta' ? 2 : 3;
}

/** Ids de arte que necesita un nivel (plantas del mazo o cinta, zombis del nivel y objetos). */
export function arteDelNivel(plantas: readonly string[], zombis: readonly string[]): string[] {
  return [
    ...plantas, ...zombis, 'sol', 'guisante', 'guisante_hielo', 'espora', 'cortacesped', 'moneda_plata', 'moneda_oro', 'diamante',
    'bolsa_monedas', 'abono', 'explosion', 'nuez_bolos', 'nuez_explosiva', 'patatapum', 'dave',
  ];
}

export { COLUMNAS };
