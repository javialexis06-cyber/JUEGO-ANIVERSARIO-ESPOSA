// El cine de la granja: pequeñas películas de la historia principal (el prólogo, las diosas, los momentos grandes).
// Una capa a pantalla completa con franjas de cine, su propio renderizador (bloom celestial, sombras suaves), la
// cámara que viaja entre planos con curvas suaves, subtítulos con quien habla, fundidos y títulos. Cada guion trae sus
// escenarios (cosmos, valle…) y sus tomas; cada toma dura lo que dure su voz si ya está grabada (ElevenLabs) o lo que
// diga el guion. Para grabar un video se avanza cuadro a cuadro con `simular` (sin reloj real ni sonido).
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import './cine-granja.css';

export type V3 = [number, number, number];
/** Dónde está la cámara y a qué mira (fov en grados; 0 = el del guion). */
export interface Plano { pos: V3; mira: V3; fov?: number; giro?: number }
export type Curva = 'lineal' | 'entra' | 'sale' | 'ambas';
export interface LineaCine {
  /** Id estable de la línea (la voz se busca por él en medios.json). */
  id: string; quien: string; nombre: string; texto: string;
  /** Cómo se dice (con acotaciones para ElevenLabs); si falta, se dice el texto tal cual. */
  d?: string;
  /** Segundos desde que empieza la toma. */
  desde?: number;
}
export interface Toma {
  id: string;
  /** Duración mínima en segundos (si la voz dura más, la toma se alarga). */
  dur: number;
  escena: string;
  cam: { de: Plano; a?: Plano; curva?: Curva };
  linea?: LineaCine;
  titulo?: { grande: string; chico?: string };
  /** Fundido de entrada o de salida (negro o blanco) y cuánto dura. */
  entra?: { color: string; dur: number };
  sale?: { color: string; dur: number };
  bloom?: number;
  musica?: string;
}
export interface ContextoToma {
  t: number; dt: number; toma: Toma; u: number; local: number; dur: number;
  /** Segundos desde que empezó otra toma (negativo si todavía no llega). */
  desde(id: string): number;
  /** Duración (ya ajustada a la voz) de una toma. */
  duracion(id: string): number;
  /** Alto del lienzo en píxeles (para el tamaño de las partículas). */
  alto: number;
}
export interface Escenario {
  grupo: THREE.Group;
  fondo: THREE.Color | THREE.Texture | null;
  niebla?: THREE.Fog | THREE.FogExp2 | null;
  exposicion?: number;
  preparar(): Promise<void>;
  actualizar(c: ContextoToma): void;
  liberar?(): void;
}
export interface Guion {
  id: string;
  nombre: string;
  fov: number;
  tomas: Toma[];
  escenarios: Record<string, () => Escenario>;
}
/** Voces y música disponibles (las de medios.json de la granja). */
export interface MediosCine {
  voz?(id: string, texto: string): { url: string; seg: number } | null;
  musica?(id: string): string | null;
}

/** Voces de las películas (public/granja/cine/medios.json: archivo y segundos, las arma voces-cine.mjs) y música: las
 * pistas propias (public/musica/pareja/lista.json, Eleven Music) o, si todavía no existen, las de la granja. */
export async function cargarMediosCine(musicaGranja: Record<string, string>): Promise<MediosCine> {
  const leer = async <T>(url: string, vacio: T): Promise<T> => { try { const r = await fetch(url); return r.ok ? (await r.json()) as T : vacio; } catch { return vacio; } };
  const [cine, pistas] = await Promise.all([
    leer<{ voces?: Record<string, { archivo: string; seg: number; huella?: string }> }>('./granja/cine/medios.json', {}),
    leer<Record<string, [string, number]>>('./musica/pareja/lista.json', {}),
  ]);
  return {
    voz: (id) => { const v = cine.voces?.[id]; return v && Number.isFinite(v.seg) ? { url: v.archivo, seg: v.seg } : null; },
    // «cine-prologo-cosmos|M12»: la primera que exista
    musica: (ids) => { for (const id of ids.split('|')) { if (pistas[id]) return `./musica/pareja/${pistas[id][0]}`; if (musicaGranja[id]) return musicaGranja[id]; } return null; },
  };
}

const suavizar = (u: number, c: Curva = 'ambas') => {
  u = THREE.MathUtils.clamp(u, 0, 1);
  if (c === 'lineal') return u;
  if (c === 'entra') return u * u * u;
  if (c === 'sale') return 1 - (1 - u) ** 3;
  return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
};
const v3 = (a: V3) => new THREE.Vector3(...a);

export class CineGranja {
  readonly capa: HTMLElement;
  readonly renderer: THREE.WebGLRenderer;
  readonly escena = new THREE.Scene();
  readonly camara: THREE.PerspectiveCamera;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private escenarios = new Map<string, Escenario>();
  private actual: Escenario | null = null;
  /** Inicio y duración de cada toma (ya ajustadas a sus voces). */
  readonly linea: { inicio: number; dur: number; voz: { url: string; seg: number } | null }[] = [];
  readonly total: number;
  private inicioDe = new Map<string, { inicio: number; dur: number }>();
  private t = 0;
  private iToma = -1;
  private ultimo = 0;
  private fin = false;
  private terminar: () => void = () => undefined;
  private sub: HTMLElement;
  private titulo: HTMLElement;
  private fundido: HTMLElement;
  private voz?: HTMLAudioElement;
  private musica?: HTMLAudioElement;
  private musicaId = '';

  constructor(readonly guion: Guion, private medios: MediosCine = {}, readonly grabando = false) {
    this.capa = document.createElement('div');
    this.capa.className = 'cine-granja' + (grabando ? ' grabando' : '');
    this.capa.innerHTML = `<canvas></canvas><div class="cg-vineta"></div><div class="cg-titulo"></div><div class="cg-franja arriba"></div>
      <div class="cg-franja abajo"></div><p class="cg-sub"></p><div class="cg-fundido"></div><button class="cg-saltar" type="button">Saltar ›</button>`;
    document.body.append(this.capa);
    this.sub = this.capa.querySelector('.cg-sub')!;
    this.titulo = this.capa.querySelector('.cg-titulo')!;
    this.fundido = this.capa.querySelector('.cg-fundido')!;
    const lienzo = this.capa.querySelector('canvas')!;
    this.renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, preserveDrawingBuffer: grabando, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(grabando ? 1 : Math.min(window.devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1.25 : 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.camara = new THREE.PerspectiveCamera(guion.fov, 16 / 9, 0.1, 2000);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.escena, this.camara));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1280, 720), 0.6, 0.5, 0.98);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    let inicio = 0;
    for (const toma of guion.tomas) {
      const voz = toma.linea ? this.medios.voz?.(toma.linea.id, toma.linea.texto) ?? null : null;
      const dur = Math.max(toma.dur, voz ? (toma.linea!.desde ?? 0.4) + voz.seg + 0.9 : 0);
      this.linea.push({ inicio, dur, voz });
      this.inicioDe.set(toma.id, { inicio, dur });
      inicio += dur;
    }
    this.total = inicio;
    this.capa.querySelector('.cg-saltar')!.addEventListener('click', () => this.acabar());
    window.addEventListener('keydown', this.tecla);
    window.addEventListener('resize', this.ajustar);
    this.ajustar();
  }

  private tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.acabar(); } };

  private ajustar = () => {
    const w = this.grabando ? 1280 : window.innerWidth, h = this.grabando ? 720 : window.innerHeight;
    this.renderer.setSize(w, h, !this.grabando);
    this.composer.setSize(w, h);
    this.camara.aspect = w / h;
    this.camara.updateProjectionMatrix();
  };

  /** Arma los escenarios (modelos, sombreadores) antes de mostrar nada. */
  async preparar() {
    for (const [id, crear] of Object.entries(this.guion.escenarios)) {
      const e = crear();
      e.grupo.visible = false;
      this.escena.add(e.grupo);
      this.escenarios.set(id, e);
    }
    await Promise.all([...this.escenarios.values()].map((e) => e.preparar()));
    // Compila todos los sombreadores de una vez para que la película no se trabe en el primer cuadro de cada escena
    for (const e of this.escenarios.values()) e.grupo.visible = true;
    this.renderer.compile(this.escena, this.camara);
    for (const e of this.escenarios.values()) e.grupo.visible = false;
    this.irA(0, 0);
  }

  /** Reproduce en tiempo real; termina al acabar o al saltarla. */
  reproducir(): Promise<void> {
    return new Promise((listo) => {
      this.terminar = listo;
      requestAnimationFrame(() => this.capa.classList.add('visible'));
      this.ultimo = performance.now();
      const cuadro = (ahora: number) => {
        if (this.fin) return;
        requestAnimationFrame(cuadro);
        const dt = Math.min(0.1, (ahora - this.ultimo) / 1000);
        if (dt < 1 / 32) return; // 30 cuadros por segundo
        this.ultimo = ahora;
        this.irA(this.t + dt, dt);
        if (this.t >= this.total) this.acabar();
      };
      requestAnimationFrame(cuadro);
    });
  }

  /** Grabación y pruebas: avanza `seg` segundos en pasos fijos y deja dibujado el cuadro. */
  simular(seg: number, paso = 1 / 24) {
    this.capa.classList.add('visible');
    let falta = seg;
    while (falta > 1e-6) {
      const dt = Math.min(paso, falta);
      falta -= dt;
      // Solo se dibuja el último cuadro (saltar en el tiempo es rápido)
      this.irA(this.t + dt, dt, falta <= 1e-6);
    }
  }

  get tiempo() { return this.t; }

  private irA(t: number, dt: number, dibujar = true) {
    this.t = t;
    let i = this.linea.findIndex((l) => t < l.inicio + l.dur);
    if (i < 0) i = this.linea.length - 1;
    const toma = this.guion.tomas[i], { inicio, dur, voz } = this.linea[i];
    if (i !== this.iToma) this.empezarToma(i, voz);
    const local = t - inicio, u = THREE.MathUtils.clamp(local / dur, 0, 1);
    const e = this.escenarios.get(toma.escena)!;
    if (e !== this.actual) {
      if (this.actual) this.actual.grupo.visible = false;
      e.grupo.visible = true;
      this.actual = e;
      this.escena.background = e.fondo;
      this.escena.fog = e.niebla ?? null;
      this.renderer.toneMappingExposure = e.exposicion ?? 1.05;
    }
    this.moverCamara(toma, u);
    e.actualizar({ t, dt, toma, u, local, dur, desde: (id) => t - (this.inicioDe.get(id)?.inicio ?? Infinity), duracion: (id) => this.inicioDe.get(id)?.dur ?? 0, alto: this.renderer.domElement.height });
    // Bloom: el de la toma, mezclado con el de la anterior al empezar
    const antes = this.guion.tomas[i - 1]?.bloom ?? toma.bloom ?? 0.6, ahora = toma.bloom ?? antes;
    this.bloom.strength = THREE.MathUtils.lerp(antes, ahora, suavizar(Math.min(1, local / 1.2)));
    this.textos(toma, local, dur, voz);
    if (dibujar) this.composer.render(dt);
  }

  private moverCamara(toma: Toma, u: number) {
    const { de, a, curva } = toma.cam;
    const k = suavizar(u, curva);
    const fin = a ?? de;
    this.camara.position.lerpVectors(v3(de.pos), v3(fin.pos), k);
    const mira = v3(de.mira).lerp(v3(fin.mira), k);
    this.camara.up.set(0, 1, 0);
    this.camara.lookAt(mira);
    const giro = THREE.MathUtils.lerp(de.giro ?? 0, fin.giro ?? de.giro ?? 0, k);
    if (giro) this.camara.rotateZ(THREE.MathUtils.degToRad(giro));
    const fov = THREE.MathUtils.lerp(de.fov || this.guion.fov, fin.fov || de.fov || this.guion.fov, k);
    if (Math.abs(fov - this.camara.fov) > 1e-3) { this.camara.fov = fov; this.camara.updateProjectionMatrix(); }
  }

  private textos(toma: Toma, local: number, dur: number, voz: { url: string; seg: number } | null) {
    const l = toma.linea;
    const desde = l?.desde ?? 0.4, hasta = voz ? desde + voz.seg + 0.5 : dur - 0.35;
    this.sub.classList.toggle('visible', !!l && local >= desde && local < hasta);
    // Títulos: aparecen y se van solos dentro de la toma
    const tt = toma.titulo ? THREE.MathUtils.clamp(Math.min((local - 0.6) / 1.4, (dur - 0.8 - local) / 1.2), 0, 1) : 0;
    this.titulo.style.opacity = String(tt);
    // Fundidos de entrada y salida
    let f = 0, color = '#000';
    if (toma.entra && local < toma.entra.dur) { f = 1 - local / toma.entra.dur; color = toma.entra.color; }
    if (toma.sale && local > dur - toma.sale.dur) { f = Math.max(f, (local - (dur - toma.sale.dur)) / toma.sale.dur); color = toma.sale.color; }
    this.fundido.style.background = color;
    this.fundido.style.opacity = String(THREE.MathUtils.clamp(f, 0, 1));
  }

  private empezarToma(i: number, voz: { url: string; seg: number } | null) {
    this.iToma = i;
    const toma = this.guion.tomas[i];
    const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
    this.sub.innerHTML = toma.linea ? `<b>${esc(toma.linea.nombre)}</b>${esc(toma.linea.texto)}` : '';
    this.titulo.innerHTML = toma.titulo ? `<strong>${esc(toma.titulo.grande)}</strong>${toma.titulo.chico ? `<small>${esc(toma.titulo.chico)}</small>` : ''}` : '';
    if (this.grabando) return;
    if (toma.musica && toma.musica !== this.musicaId) this.cambiarMusica(toma.musica);
    this.voz?.pause();
    this.voz = undefined;
    if (voz) {
      const a = new Audio(voz.url);
      a.volume = 0.95;
      this.voz = a;
      const retraso = (toma.linea?.desde ?? 0.4) * 1000;
      window.setTimeout(() => { if (this.voz === a && !this.fin) void a.play().catch(() => undefined); }, retraso);
      // Debajo de la voz la música baja poquito: Javier quiere seguir oyéndola (12 de octubre de 2026)
      if (this.musica) this.musica.volume = 0.3;
      a.onended = () => { if (this.musica && this.voz === a) this.musica.volume = 0.42; };
    } else if (this.musica) this.musica.volume = 0.42;
  }

  private cambiarMusica(id: string) {
    const url = this.medios.musica?.(id);
    this.musicaId = id;
    const vieja = this.musica;
    if (vieja) { const bajar = window.setInterval(() => { vieja.volume = Math.max(0, vieja.volume - 0.04); if (vieja.volume <= 0) { vieja.pause(); window.clearInterval(bajar); } }, 80); }
    if (!url) { this.musica = undefined; return; }
    const a = new Audio(url);
    a.loop = true;
    a.volume = 0;
    this.musica = a;
    void a.play().catch(() => undefined);
    const subir = window.setInterval(() => { if (this.musica !== a) { window.clearInterval(subir); return; } a.volume = Math.min(0.42, a.volume + 0.03); if (a.volume >= 0.42) window.clearInterval(subir); }, 90);
  }

  acabar() {
    if (this.fin) return;
    this.fin = true;
    this.voz?.pause();
    const m = this.musica;
    if (m) { const bajar = window.setInterval(() => { m.volume = Math.max(0, m.volume - 0.05); if (m.volume <= 0) { m.pause(); window.clearInterval(bajar); } }, 60); }
    this.capa.classList.remove('visible');
    window.removeEventListener('keydown', this.tecla);
    window.removeEventListener('resize', this.ajustar);
    window.setTimeout(() => this.liberar(), 650);
    this.terminar();
  }

  private liberar() {
    for (const e of this.escenarios.values()) e.liberar?.();
    // Lo propio de la película se suelta; los peluches y los kits (marcados «noLiberar») los comparte el juego
    const soltar = (o: THREE.Object3D) => {
      if (o.userData.noLiberar) return;
      const m = o as THREE.Mesh;
      if (m.isMesh || (o as THREE.Points).isPoints) {
        if (!m.geometry?.userData.compartido) m.geometry?.dispose();
        for (const x of ([] as THREE.Material[]).concat(m.material ?? [])) if (!x.userData.compartido) x.dispose();
      }
      for (const c of o.children) soltar(c);
    };
    soltar(this.escena);
    this.composer.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.capa.remove();
  }
}
