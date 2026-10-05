// La escena de Sangre y Ceniza: renderizador, cámara que sigue al jugador (con anticipación, sacudidas y zoom), luces
// (la luna fría con sombras, la linterna cálida del jugador, la rejilla de antorchas), niebla, posprocesado (bloom
// para que el fuego y las almas brillen, viñeta, grano) y la calidad que baja sola si el celular se calienta.
// Cada etapa arma su mapa y sus actores; los muñecos de los jugadores se quedan entre etapas.
import { BlendFunction, BloomEffect, EffectComposer, EffectPass, NoiseEffect, RenderPass, ToneMappingEffect, ToneMappingMode, VignetteEffect } from 'postprocessing';
import * as THREE from 'three';
import { vigilarContexto } from '../../contexto';
import { ARMAS_LISTA } from '../datos/armas';
import { BIOMAS, type DefBioma } from '../datos/mundo';
import { C } from '../tipos';
import { TIPOS, esJefe } from '../sim/catalogo';
import { ENT, MOV, S, type Aliado, type Entidad, type Enemigos, type Proyectil, type Recogible, type Sucesos, type Zona } from '../sim/estado';
import type { Jugador } from '../sim/jugador';
import type { Mapa } from '../sim/mapa';
import { Actores } from './actores';
import { Cosas3D } from './cosas3d';
import { Efectos } from './efectos';
import { Jugadores3D, type PerfilVista } from './jugadores3d';
import { LuzRejilla, UNI_LUZ, type FuenteLuz } from './luz';
import { Mapa3D } from './mapa3d';
import { Biblioteca } from './modelos';
import { Particulas } from './particulas';
import { colorContraluz } from './piezas';
import { ESCALA_PUNTOS } from './texturas';

export type Calidad = 'alta' | 'media' | 'baja';

/** Lo que la escena necesita leer cada cuadro (lo cumplen la simulación y el espejo de los invitados). */
export interface EstadoVista {
  mapa: Mapa;
  E: Enemigos;
  P: Proyectil[];
  Z: Zona[];
  R: Recogible[];
  A: Aliado[];
  ent: Entidad[];
  J: Jugador[];
  suc: Sucesos;
  t: number;
  eclipse: number;
  jefe: number;
  jefeFase: number;
  campana: Entidad | null;
}

const COLOR_ZONA: Record<number, THREE.Color> = {
  0: new THREE.Color('#7ad040'), 1: new THREE.Color('#ff6a1a'), 2: new THREE.Color('#9fe0ff'), 3: new THREE.Color('#ffe8a0'), 4: new THREE.Color('#7aa040'),
  5: new THREE.Color('#4a7a3a'), 6: new THREE.Color('#888888'), 7: new THREE.Color('#a01020'), 8: new THREE.Color('#6a3aa0'), 9: new THREE.Color('#9a5aff'),
  10: new THREE.Color('#fff0c0'), 11: new THREE.Color('#ff2010'),
};
const COLOR_EXPLOSION = ['#ff7a2a', '#fff0a0', '#8aff4a', '#a8f0ff', '#d01828', '#a060ff', '#a89880'];

export class Escena3D {
  renderer: THREE.WebGLRenderer;
  escena = new THREE.Scene();
  camara = new THREE.PerspectiveCamera(36, 1, 0.5, 120);
  bib = new Biblioteca();
  calidad: Calidad;
  private composer: EffectComposer | null = null;
  private bloom: BloomEffect | null = null;
  private hemi: THREE.HemisphereLight;
  private luna: THREE.DirectionalLight;
  private linterna: THREE.PointLight;
  private fogonazo: THREE.PointLight;
  private fogonazoT = 0;
  bioma: DefBioma = BIOMAS.cementerio;
  // Por etapa
  mapa3d: Mapa3D | null = null;
  luz: LuzRejilla | null = null;
  actores: Actores | null = null;
  cosas: Cosas3D | null = null;
  particulas: Particulas | null = null;
  efectos: Efectos | null = null;
  jugadores = new Jugadores3D(this.bib);
  private etapa = new THREE.Group();
  // Cámara
  private foco = new THREE.Vector3();
  private focoListo = false;
  zoom = 1;
  /** Cámara de vitrina para los menús: cerca del muñeco, baja y de frente, con el muñeco a un lado de la pantalla. */
  vitrina: { lado: number; dist: number; alto?: number } | null = null;
  private sacudida = 0;
  private tiempo = 0;
  private colorAntorcha = new THREE.Color('#ff9a4a');
  /** Luces que se mueven (fuego, explosiones) para la rejilla. */
  private movibles: FuenteLuz[] = [];
  private flashes: { x: number; y: number; r: number; c: THREE.Color; f: number; t: number }[] = [];
  /** Jugador que sigue la cámara. */
  local = 0;
  /** Tiempos de dibujo (para bajar la calidad sola). */
  private msMedio = 16;
  private lento = 0;
  alCambiarCalidad: (c: Calidad) => void = () => undefined;
  /** Sonidos: la pantalla de juego conecta aquí sus efectos. */
  alSuceso: (tipo: number, d: Float32Array, k: number, cerca: number) => void = () => undefined;
  private ambienteT = 0;

  constructor(public lienzo: HTMLCanvasElement, calidad: Calidad) {
    this.calidad = calidad;
    this.renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: false, powerPreference: 'high-performance', stencil: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Las sombras quedan siempre prendidas y todo pasa siempre por el compositor (con el tono AgX): así cambiar la
    // calidad no obliga a recompilar los sombreadores de todos los materiales (en el celular sería un congelón).
    // Lo que cambia es la resolución, si la sombra se vuelve a dibujar, su intensidad y los efectos.
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.escena.add(this.etapa, this.jugadores.grupo);
    this.hemi = new THREE.HemisphereLight('#3a4a6a', '#120c0a', 0.5);
    this.luna = new THREE.DirectionalLight('#9ab8e8', 0.6);
    this.luna.castShadow = true;
    this.luna.shadow.mapSize.set(calidad === 'alta' ? 2048 : 1024, calidad === 'alta' ? 2048 : 1024);
    this.luna.shadow.bias = -0.0006;
    this.luna.shadow.normalBias = 0.03;
    const sc = this.luna.shadow.camera as THREE.OrthographicCamera;
    sc.left = -16; sc.right = 16; sc.top = 14; sc.bottom = -14; sc.near = 1; sc.far = 50;
    this.escena.add(this.hemi, this.luna, this.luna.target);
    this.linterna = new THREE.PointLight('#ffc890', 0, 9, 1.6);
    this.fogonazo = new THREE.PointLight('#ff9a4a', 0, 10, 1.8);
    this.escena.add(this.linterna, this.fogonazo);
    this.aplicarCalidad();
    vigilarContexto(lienzo, () => this.ajustar());
    addEventListener('resize', this.ajustar);
    this.ajustar();
  }

  private aplicarCalidad() {
    const c = this.calidad;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(c === 'alta' ? Math.min(dpr, 1.6) : c === 'media' ? Math.min(dpr, 1.2) : Math.min(dpr, 0.85));
    // Sombras: en baja no se vuelven a dibujar y no oscurecen (el mismo sombreador, sin costo de la pasada)
    const sh = this.renderer.shadowMap;
    sh.autoUpdate = c !== 'baja';
    sh.needsUpdate = true;
    this.luna.shadow.intensity = c === 'baja' ? 0 : 1;
    const tam = c === 'alta' ? 2048 : 1024;
    if (this.luna.shadow.mapSize.x !== tam) {
      this.luna.shadow.mapSize.set(tam, tam);
      this.luna.shadow.map?.dispose();
      this.luna.shadow.map = null;
    }
    document.body.classList.remove('sangre-vineta-css');
    this.composer?.dispose();
    const comp = new EffectComposer(this.renderer, { frameBufferType: THREE.HalfFloatType, multisampling: c === 'alta' ? 4 : 0 });
    comp.addPass(new RenderPass(this.escena, this.camara));
    this.bloom = c === 'baja' ? null : new BloomEffect({ mipmapBlur: true, intensity: 1.1, luminanceThreshold: 0.88, luminanceSmoothing: 0.18, radius: 0.7 });
    const vineta = new VignetteEffect({ darkness: 0.62, offset: 0.28 });
    const tono = new ToneMappingEffect({ mode: ToneMappingMode.AGX });
    const efectos: (BloomEffect | VignetteEffect | ToneMappingEffect | NoiseEffect)[] = this.bloom ? [this.bloom, tono, vineta] : [tono, vineta];
    if (c === 'alta') {
      const ruido = new NoiseEffect({ blendFunction: BlendFunction.SOFT_LIGHT, premultiply: false });
      ruido.blendMode.opacity.value = 0.18;
      efectos.push(ruido);
    }
    comp.addPass(new EffectPass(this.camara, ...efectos));
    this.composer = comp;
    this.ajustar();
  }

  /** Sin sombras (calidad baja) la luna lo aclara todo: se baja para que siga siendo de noche. */
  private ajustarLuna() {
    const l = this.bioma.luz;
    const sinSombra = this.calidad === 'baja';
    this.luna.intensity = l.fuerzaLuna * 1.2 * (sinSombra ? 0.4 : 1);
    this.hemi.intensity = (0.32 + l.fuerzaLuna * 0.25) * (sinSombra ? 0.7 : 1);
  }

  /** Cambia la calidad (lo pide el jugador o la baja sola el medidor). */
  ponerCalidad(c: Calidad) {
    if (c === this.calidad) return;
    this.calidad = c;
    this.aplicarCalidad();
    this.ajustarLuna();
    if (this.particulas) this.particulas.cupo = c === 'baja' ? 0.45 : c === 'media' ? 0.75 : 1;
    if (this.actores) this.actores.sombraReal = c === 'alta';
    this.alCambiarCalidad(c);
  }

  ajustar = () => {
    const w = this.lienzo.clientWidth || innerWidth, h = this.lienzo.clientHeight || innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer?.setSize(w, h);
    this.camara.aspect = w / Math.max(1, h);
    this.camara.updateProjectionMatrix();
    ESCALA_PUNTOS.value = (h * this.renderer.getPixelRatio()) / (2 * Math.tan(THREE.MathUtils.degToRad(this.camara.fov / 2)));
  };

  // ----------------------------------------------------------------------------------------------- Etapa
  /** Arma la escena de una etapa (o del campamento de los menús). */
  async prepararEtapa(mapa: Mapa, bioma: DefBioma, perfiles: PerfilVista[], precargar: string[] = []) {
    this.limpiarEtapa();
    this.bioma = bioma;
    await this.bib.cargar(bioma.id);
    const l = bioma.luz;
    this.colorAntorcha.set(l.antorcha);
    this.escena.background = new THREE.Color(l.niebla).multiplyScalar(0.6);
    this.escena.fog = new THREE.FogExp2(new THREE.Color(l.niebla).getHex(), l.densidadNiebla * 0.9);
    this.hemi.color.set(l.luna).multiplyScalar(0.6);
    this.hemi.groundColor.set(l.niebla);
    this.luna.color.set(l.luna);
    this.ajustarLuna();
    UNI_LUZ.uAmbiente.value.set(l.ambiente).multiplyScalar(0.55);
    colorContraluz(new THREE.Color(l.luna).multiplyScalar(0.35));
    this.luz = new LuzRejilla(mapa);
    this.mapa3d = new Mapa3D(mapa, bioma, this.bib, this.colorAntorcha, this.calidad !== 'baja', this.calidad === 'alta');
    this.actores = new Actores(this.bib);
    this.actores.sombraReal = this.calidad === 'alta';
    this.particulas = new Particulas(this.etapa);
    this.particulas.cupo = this.calidad === 'baja' ? 0.45 : this.calidad === 'media' ? 0.75 : 1;
    this.cosas = new Cosas3D(this.bib, this.particulas);
    this.efectos = new Efectos();
    this.etapa.add(this.mapa3d.grupo, this.actores.grupo, this.cosas.grupo, this.efectos.grupo);
    this.actores.precargar(precargar);
    await this.prepararMunecos(perfiles);
    this.focoListo = false;
    // Todos los sombreadores de la etapa se compilan ahora (detrás de la pantalla de carga), no en pleno juego
    try {
      await this.renderer.compileAsync(this.escena, this.camara);
    } catch {
      /* si el navegador no puede compilar en paralelo, se compilan al dibujar */
    }
    this.flashes.length = 0;
  }

  /** Muñecos (se cargan una vez; si cambió la clase o el cuerpo se vuelven a vestir; los que sobran se van). */
  async prepararMunecos(perfiles: PerfilVista[]) {
    for (const [i, m] of [...this.jugadores.munecos]) {
      if (perfiles.some((p) => p.i === i)) continue;
      m.liberar();
      this.jugadores.munecos.delete(i);
    }
    const faltan = perfiles.filter((p) => {
      const m = this.jugadores.de(p.i);
      return !m || m.perfil.clase !== p.clase || m.perfil.cuerpo !== p.cuerpo || m.perfil.piel !== p.piel || m.perfil.pelo !== p.pelo;
    });
    if (!faltan.length) return;
    for (const p of faltan) {
      this.jugadores.de(p.i)?.liberar();
      this.jugadores.munecos.delete(p.i);
    }
    await this.jugadores.preparar(faltan);
  }

  limpiarEtapa() {
    this.mapa3d?.liberar();
    this.actores?.liberar();
    this.luz?.liberar();
    this.etapa.clear();
    this.mapa3d = null;
    this.actores = null;
    this.cosas = null;
    this.particulas = null;
    this.efectos = null;
    this.luz = null;
  }

  sacudir(f: number) {
    this.sacudida = Math.min(1.2, this.sacudida + f);
  }

  /** Destello de luz en el mundo (explosiones, rayos): ilumina la rejilla y la luz de fogonazo. */
  flash(x: number, y: number, r: number, color: THREE.ColorRepresentation, fuerza: number) {
    if (this.flashes.length > 10) this.flashes.shift();
    this.flashes.push({ x, y, r, c: new THREE.Color(color), f: fuerza, t: 0 });
    this.fogonazo.position.set(x, 1.4, y);
    this.fogonazo.color.set(color);
    this.fogonazoT = 0.25;
    this.fogonazo.intensity = Math.max(this.fogonazo.intensity, fuerza * 6);
  }

  // ----------------------------------------------------------------------------------------------- Cada cuadro
  actualizar(dt: number, est: EstadoVista) {
    if (!this.mapa3d || !this.actores || !this.cosas || !this.particulas || !this.efectos || !this.luz) return;
    this.tiempo += dt;
    UNI_LUZ.uTiempo.value = this.tiempo;
    UNI_LUZ.uOscuro.value += ((est.eclipse > 0 ? 1 : 0) - UNI_LUZ.uOscuro.value) * Math.min(1, dt * 2);
    this.procesarSucesos(est);
    // Paredes que se excavan
    const excavando: number[] = [];
    for (const j of est.J) if (j.excavando >= 0 && j.estado === 0) excavando.push(j.excavando);
    this.mapa3d.actualizar(this.tiempo, excavando);
    this.actores.actualizar(dt, { E: est.E, A: est.A, ent: est.ent, jefeFase: est.jefeFase, t: this.tiempo, rieles: est.mapa.rieles });
    this.cosas.actualizar(this.tiempo, est.P, est.R);
    this.efectos.zonasDe(est.Z, COLOR_ZONA);
    this.efectos.actualizar(dt, this.tiempo);
    // Jugadores
    for (const j of est.J) {
      const m = this.jugadores.de(j.i);
      if (!m) continue;
      const principal = j.armas[0]?.id;
      if (principal) m.ponerArma(principal);
      const levantando = est.J.some((o) => o !== j && o.estado === 1 && j.estado === 0 && (o.x - j.x) ** 2 + (o.y - j.y) ** 2 < 3.2);
      m.actualizar(dt, j.x, j.y, j.vx, j.vy, j.fx, j.fy, j.estado, j.invisible > 0, levantando, this.tiempo);
      if (j.estado === 0 || j.estado === 1) this.actores.sombraExtra(j.x, j.y, 0.36);
    }
    this.ambiente(dt, est);
    this.particulas.actualizar(dt);
    // Luz: las fijas cuando cambia el mapa; las que se mueven cada cuadro
    if (this.mapa3d.luzSucia) {
      this.mapa3d.luzSucia = false;
      const fijas = [...this.mapa3d.fijas];
      for (let i = 0; i < est.mapa.c.length; i++) {
        const t = est.mapa.c[i];
        if (t === C.SANGRE) fijas.push({ x: (i % est.mapa.w) + 0.5, y: ((i / est.mapa.w) | 0) + 0.5, r: 2.6, color: new THREE.Color('#ff2030'), fuerza: 0.32 });
        else if (t === C.HUEVO) fijas.push({ x: (i % est.mapa.w) + 0.5, y: ((i / est.mapa.w) | 0) + 0.5, r: 2.2, color: new THREE.Color('#ffb040'), fuerza: 0.4 });
      }
      this.luz.rehacerEstatica(fijas);
    }
    this.lucesMovibles(dt, est);
    this.luz.actualizar(this.movibles);
    this.camaraSeguir(dt, est);
  }

  private lucesMovibles(dt: number, est: EstadoVista) {
    const mv = this.movibles;
    mv.length = 0;
    const local = est.J[this.local];
    for (const j of est.J) {
      if (j.estado !== 0 && j.estado !== 1) continue;
      // El jugador propio lleva una luz de verdad; los demás, en la rejilla (más una pizca para el propio)
      mv.push({ x: j.x, y: j.y, r: j.radioLuz * (j === local ? 0.75 : 1), color: LUZ_JUGADOR, fuerza: j === local ? 0.35 : 0.85 });
    }
    for (const z of est.Z) if (z.vivo && (z.tipo === 1 || z.tipo === 3) && !z.enemiga) mv.push({ x: z.x, y: z.y, r: z.r + 2.2, color: z.tipo === 1 ? LUZ_FUEGO : LUZ_SANTA, fuerza: 0.45 });
    for (const e of est.ent) {
      if (!e.vivo) continue;
      if (e.tipo === ENT.EXTRACCION) mv.push({ x: e.x, y: e.y, r: 7, color: LUZ_CAMPANA, fuerza: 1.3 });
      else if (e.tipo === ENT.SANTUARIO && e.est === 0) mv.push({ x: e.x, y: e.y, r: 4, color: LUZ_SANTA, fuerza: 0.6 });
      else if (e.tipo === ENT.CARRETA && e.est === 1) mv.push({ x: e.x, y: e.y, r: 4, color: LUZ_SANGRE, fuerza: 0.5 });
      else if (e.tipo === ENT.COFRE_RELIQUIA && e.est === 0) mv.push({ x: e.x, y: e.y, r: 3, color: LUZ_RELIQUIA, fuerza: 0.5 });
      else if (e.tipo === ENT.CAMPANA_DEF && e.est === 1) mv.push({ x: e.x, y: e.y, r: 5, color: LUZ_CAMPANA, fuerza: 0.7 });
    }
    for (let i = 0; i < est.E.max; i++) if (est.E.vivo[i] && (est.E.tipo[i] === TIPO_ALTAR_V || esJefe(est.E.tipo[i]))) mv.push({ x: est.E.x[i], y: est.E.y[i], r: 4, color: LUZ_SANGRE, fuerza: 0.55 });
    for (let k = this.flashes.length - 1; k >= 0; k--) {
      const f = this.flashes[k];
      f.t += dt;
      const u = f.t / 0.35;
      if (u >= 1) {
        this.flashes.splice(k, 1);
        continue;
      }
      mv.push({ x: f.x, y: f.y, r: f.r, color: f.c, fuerza: f.f * (1 - u) });
    }
    // Linterna del jugador propio (luz de verdad: modela los relieves y los muñecos)
    if (local && this.vitrina) {
      // En los menús: luz cálida de lado, suave (que no queme la cara)
      this.linterna.position.set(local.x + 1.8, 2.8, local.y + 2.4);
      this.linterna.intensity = 1.1 * (0.94 + Math.sin(this.tiempo * 7.1) * 0.04 + Math.sin(this.tiempo * 17.3) * 0.02);
      this.linterna.distance = 8;
    } else if (local && (local.estado === 0 || local.estado === 1)) {
      this.linterna.position.set(local.x + local.fx * 0.6, 3.1, local.y + local.fy * 0.6 + 0.9);
      const parp = 0.92 + Math.sin(this.tiempo * 9.3) * 0.04 + Math.sin(this.tiempo * 23.1) * 0.03;
      this.linterna.intensity = 3.4 * parp * (est.eclipse > 0 ? 0.6 : 1);
      this.linterna.distance = local.radioLuz * 1.4;
    } else this.linterna.intensity = 0;
    if (this.fogonazoT > 0) {
      this.fogonazoT -= dt;
      this.fogonazo.intensity *= Math.exp(-dt * 12);
      if (this.fogonazoT <= 0) this.fogonazo.intensity = 0;
    }
  }

  /** Ambiente: niebla baja, motas de luz, brasas de las antorchas cercanas. */
  private ambiente(dt: number, est: EstadoVista) {
    const p = this.particulas!;
    this.ambienteT -= dt;
    if (this.ambienteT > 0) return;
    this.ambienteT = 0.12;
    const f = this.foco;
    if (Math.random() < 0.5) p.niebla(f.x + (Math.random() - 0.5) * 24, f.z + (Math.random() - 0.5) * 16, this.bioma.luz.niebla === '#1a2024' ? '#4a5a6a' : '#3a3434');
    p.motas(f.x + (Math.random() - 0.5) * 16, f.z + (Math.random() - 0.5) * 10, this.bioma.luz.antorcha);
    for (const a of est.mapa.antorchas) {
      if (a.vela || Math.abs(a.cx - f.x) > 12 || Math.abs(a.cy - f.z) > 8 || Math.random() > 0.25) continue;
      p.brasas(a.cx + 0.5 + a.dx * 0.75, 1.45, a.cy + 0.5 + a.dy * 0.75, 1, 0.1, this.bioma.luz.antorcha);
    }
    if (this.bioma.id === 'minas') for (let k = 0; k < 2; k++) p.brasas(f.x + (Math.random() - 0.5) * 20, 0.1, f.z + (Math.random() - 0.5) * 14, 1, 1, '#ff5a1a');
  }

  // ----------------------------------------------------------------------------------------------- Cámara
  private camaraSeguir(dt: number, est: EstadoVista) {
    const j = est.J[this.local] ?? est.J[0];
    if (!j) return;
    // Si el propio está fuera, sigue a un compañero en pie
    const seguido = j.estado === 0 || j.estado === 1 ? j : est.J.find((o) => o.estado === 0) ?? j;
    const meta = new THREE.Vector3(seguido.x + seguido.vx * 0.32, 0, seguido.y + seguido.vy * 0.32);
    if (!this.focoListo) {
      this.foco.copy(meta);
      this.focoListo = true;
    }
    this.foco.lerp(meta, Math.min(1, dt * 5));
    if (this.vitrina) {
      const v = this.vitrina;
      const az = Math.sin(this.tiempo * 0.13) * 0.32 + 0.18;
      const el = THREE.MathUtils.degToRad(16);
      const D = v.dist;
      const cx = seguido.x, cz = seguido.y;
      // A la derecha de la cámara (en el piso): (cos az, -sin az)
      const rx = Math.cos(az), rz = -Math.sin(az);
      const tx = cx - rx * v.lado, tz = cz - rz * v.lado;
      const h = v.alto ?? 0.85;
      this.camara.position.set(tx + Math.sin(az) * Math.cos(el) * D, h + Math.sin(el) * D, tz + Math.cos(az) * Math.cos(el) * D);
      this.camara.lookAt(tx, h, tz);
      this.luna.position.set(cx - 7, 16, cz - 5);
      this.luna.target.position.set(cx, 0, cz);
      return;
    }
    // Distancia según la pantalla: que se vean unos 20 m a lo ancho en el celular acostado
    const asp = this.camara.aspect;
    const ancho = asp >= 1.6 ? 17 : asp >= 1 ? 15 : 12;
    const tan = Math.tan(THREE.MathUtils.degToRad(this.camara.fov / 2));
    const D = Math.max(9, Math.min(26, ancho / (2 * tan * asp))) * this.zoom;
    const el = THREE.MathUtils.degToRad(52);
    const s = this.sacudida;
    this.sacudida = Math.max(0, s - dt * 2.4);
    const sx = (Math.random() - 0.5) * s * 0.35, sy = (Math.random() - 0.5) * s * 0.35;
    this.camara.position.set(this.foco.x + sx, Math.sin(el) * D, this.foco.z + Math.cos(el) * D + sy);
    this.camara.lookAt(this.foco.x + sx * 0.5, 0, this.foco.z + sy * 0.5);
    // La luna sigue a la cámara (sombras nítidas donde se juega)
    this.luna.position.set(this.foco.x - 7, 16, this.foco.z - 5);
    this.luna.target.position.copy(this.foco);
  }

  /** Posición en pantalla (px) de un punto del mundo. */
  aPantalla(x: number, y: number, z: number, out: { x: number; y: number; visible: boolean }) {
    const v = TMP.set(x, y, z).project(this.camara);
    out.x = (v.x * 0.5 + 0.5) * this.lienzo.clientWidth;
    out.y = (-v.y * 0.5 + 0.5) * this.lienzo.clientHeight;
    out.visible = v.z < 1 && Math.abs(v.x) <= 1.05 && Math.abs(v.y) <= 1.05;
    return out;
  }

  /** Del punto de la pantalla al piso (para apuntar con el ratón). */
  alPiso(px: number, py: number): { x: number; y: number } | null {
    const v = new THREE.Vector3((px / this.lienzo.clientWidth) * 2 - 1, -(py / this.lienzo.clientHeight) * 2 + 1, 0.5).unproject(this.camara);
    const d = v.sub(this.camara.position).normalize();
    if (Math.abs(d.y) < 1e-4) return null;
    const t = -this.camara.position.y / d.y;
    return { x: this.camara.position.x + d.x * t, y: this.camara.position.z + d.z * t };
  }

  dibujar() {
    const a = performance.now();
    this.renderer.info.autoReset = false;
    this.renderer.info.reset();
    if (this.composer) this.composer.render();
    else this.renderer.render(this.escena, this.camara);
    const ms = performance.now() - a;
    this.msMedio = this.msMedio * 0.95 + ms * 0.05;
  }

  /** Medidor: si el cuadro completo tarda mucho seguido, baja la calidad. */
  medir(msCuadro: number, dt: number) {
    if (msCuadro > 36) this.lento += dt;
    else this.lento = Math.max(0, this.lento - dt * 0.5);
    if (this.lento > 4) {
      this.lento = 0;
      if (this.calidad === 'alta') this.ponerCalidad('media');
      else if (this.calidad === 'media') this.ponerCalidad('baja');
    }
  }

  get infoDibujo() {
    return { llamadas: this.renderer.info.render.calls, triangulos: this.renderer.info.render.triangles, ms: this.msMedio, particulas: this.particulas?.cuantas ?? 0 };
  }

  // ----------------------------------------------------------------------------------------------- Sucesos
  private procesarSucesos(est: EstadoVista) {
    const s = est.suc;
    const d = s.d;
    const P = this.particulas!, F = this.efectos!, A = this.actores!;
    const local = est.J[this.local];
    for (let n = 0; n < s.n; n++) {
      const k = n * 7;
      const tipo = d[k];
      const x = d[k + 1], y = d[k + 2];
      const cerca = local ? Math.hypot(local.x - x, local.y - y) : 0;
      this.alSuceso(tipo, d, k, cerca);
      switch (tipo) {
        case S.GOLPE: {
          const crit = d[k + 4] > 0;
          P.chispas(x, 0.7, y, crit ? '#ffe070' : '#ffd0a0', crit ? 7 : 3, crit ? 5 : 3);
          if (Math.random() < 0.4) P.sangre(x, 0.6, y, crit ? 3 : 1);
          break;
        }
        case S.MUERTE: {
          const t = d[k + 3];
          A.muerte(x, y, t, d[k + 5], d[k + 6], est.jefeFase);
          const def = TIPOS[t];
          if (t < 200 && def) {
            P.muerte(x, y, def.alto * (d[k + 5] || 1), def.color[0]);
            if (!def.vivo || Math.random() < 0.5) P.sangre(x, 0.5, y, 3, def.vivo ? '#5a0a10' : '#2a2018');
          }
          break;
        }
        case S.TAJO: {
          const a = ARMAS_LISTA[Math.floor(d[k + 6] / 8)];
          const col = a?.color ?? '#ffffff';
          F.tajo(x, y, d[k + 3], d[k + 4], d[k + 5], col);
          this.animarAtaque(d[k + 6], 0, d[k + 3]);
          break;
        }
        case S.ESTOCADA: {
          const a = ARMAS_LISTA[Math.floor(d[k + 6] / 8)];
          F.raya(x, y, d[k + 3], d[k + 4], d[k + 5], a?.color ?? '#ffffff');
          this.animarAtaque(d[k + 6], 1, d[k + 3]);
          break;
        }
        case S.CONO: {
          const a = ARMAS_LISTA[Math.floor(d[k + 6] / 8)];
          const fuego = !!a && (a.etiquetas.includes('fuego') || a.id === 'trabuco');
          F.cono(x, y, d[k + 3], d[k + 4], d[k + 5], a?.color ?? '#ffffff', fuego ? 1 : 2);
          if (fuego) for (let e = 0; e < 3; e++) P.brasas(x + Math.cos(d[k + 3]) * d[k + 4] * Math.random(), 0.6, y + Math.sin(d[k + 3]) * d[k + 4] * Math.random(), 1, 0.4);
          if (a?.id === 'trabuco') this.flash(x, y, 4, '#ffd080', 0.8);
          this.animarAtaque(d[k + 6], 3, d[k + 3]);
          break;
        }
        case S.ONDA: {
          const cod = d[k + 4];
          const a = cod >= 0 ? ARMAS_LISTA[Math.floor(cod / 8)] : null;
          F.onda(x, y, d[k + 3], a?.color ?? (cod <= -7 ? '#ffd860' : '#c8e0ff'), 0.45);
          if (cod >= 0) this.animarAtaque(cod, 2, 0);
          if (cod >= 0 && a && (a.id === 'martillo' || a.id === 'cetro_hierro' || a.id === 'martillo_titan')) {
            P.polvo(x, 0, y, this.bioma.roca[0], 6, 4);
            if (cerca < 8) this.sacudir(0.25);
          }
          break;
        }
        case S.RAYO: {
          const cod = d[k + 4];
          const a = cod >= 0 ? ARMAS_LISTA[cod] : null;
          const col = cod === -10 ? '#fff0b0' : cod === -2 ? '#ff8a3a' : a?.color ?? '#cfe8ff';
          F.columna(x, y, Math.max(0.5, d[k + 3] * 0.7), 9, col, cod === -10 ? 0.7 : 0.35);
          F.onda(x, y, d[k + 3], col, 0.4);
          this.flash(x, y, 6, col, cod === -10 ? 2 : 1.2);
          P.chispas(x, 0.3, y, col, 10, 5);
          if (a?.proyectil === 'yunque' || a?.proyectil === 'guillotina') {
            P.polvo(x, 0, y, this.bioma.roca[0], 8, 5);
            if (cerca < 9) this.sacudir(0.3);
          }
          break;
        }
        case S.CADENA: {
          const cod = d[k + 5];
          const a = cod >= 0 ? ARMAS_LISTA[Math.floor(cod / 8)] : null;
          F.rayo(x, y, d[k + 3], d[k + 4], a?.color ?? '#cfe8ff');
          P.chispas(d[k + 3], 0.8, d[k + 4], a?.color ?? '#cfe8ff', 3, 3);
          if (cod >= 0) this.animarAtaque(cod, 4, Math.atan2(d[k + 4] - y, d[k + 3] - x));
          break;
        }
        case S.EXPLOSION: {
          const r = d[k + 3], cls = d[k + 4];
          const col = COLOR_EXPLOSION[cls] ?? '#ff7a2a';
          F.onda(x, y, r, col, 0.4);
          P.destello(x, 0.6, y, r * 1.6, col, 0.2);
          if (cls === 0) {
            P.brasas(x, 0.3, y, 8, r);
            P.humo(x, 0.2, y, 4, r * 0.6);
          } else if (cls === 6) P.polvo(x, 0, y, this.bioma.roca[0], 5, 3);
          else P.chispas(x, 0.5, y, col, 8, 4);
          if (cls !== 6) this.flash(x, y, r + 3, col, 0.9);
          if (cerca < 7 && r > 1.5) this.sacudir(0.15 + r * 0.04);
          break;
        }
        case S.EXCAVA: {
          const t = d[k + 3];
          const col = t === C.HIERRO ? '#5a6070' : t === C.SANGRE ? '#a01828' : t === C.ORO ? '#c8a040' : this.bioma.roca[0];
          const jx = d[k + 4] >= 0 ? est.J[d[k + 4]] : null;
          const px = jx ? (x + 0.5 + jx.x) / 2 : x + 0.5, pz = jx ? (y + 0.5 + jx.y) / 2 : y + 0.5;
          P.polvo(px, 0.1, pz, col, 3, 2);
          if (t === C.SANGRE || t === C.ORO) P.chispas(px, 0.8, pz, t === C.ORO ? '#ffe080' : '#ff3040', 2, 2);
          if (jx && jx.i === this.local) this.sacudir(0.04);
          break;
        }
        case S.ROTO: {
          const t = d[k + 3];
          const col = t === C.HIERRO ? '#5a6070' : t === C.SANGRE ? '#a01828' : t === C.ORO ? '#c8a040' : this.bioma.roca[0];
          P.polvo(x + 0.5, 0.2, y + 0.5, col, 10, 9);
          if (t === C.SANGRE) P.chispas(x + 0.5, 0.8, y + 0.5, '#ff2040', 10, 4);
          if (t === C.ORO) P.chispas(x + 0.5, 0.8, y + 0.5, '#ffd060', 10, 4);
          if (t === C.HIERRO) P.chispas(x + 0.5, 0.8, y + 0.5, '#a8b8d8', 8, 4);
          if (cerca < 6) this.sacudir(0.12);
          break;
        }
        case S.RECOGE: {
          const j = est.J[x];
          if (!j) break;
          const t = y;
          if (t <= 2) P.alma(j.x, 0.6, j.y, t === 0 ? '#5ac0ff' : t === 1 ? '#5aff8a' : '#ff4a4a');
          else if (t === 3) P.chispas(j.x, 0.8, j.y, '#ffd060', 3, 2);
          break;
        }
        case S.NIVEL: {
          const j = est.J[x];
          if (!j) break;
          F.onda(j.x, j.y, 3.5, '#8fe3ff', 0.7);
          F.columna(j.x, j.y, 0.7, 4, '#8fe3ff', 0.8);
          for (let e = 0; e < 3; e++) P.alma(j.x, 0.3, j.y, '#8fe3ff');
          break;
        }
        case S.HERIDO: {
          const j = est.J[x];
          if (!j) break;
          this.jugadores.de(j.i)?.herido();
          P.sangre(j.x, 0.6, j.y, 3);
          if (j.i === this.local) this.sacudir(0.18 + Math.min(0.3, y / 60));
          break;
        }
        case S.BLOQUEO: {
          const j = est.J[x];
          if (!j) break;
          P.chispas(j.x, 0.7, j.y, '#c8e0ff', 12, 5);
          F.onda(j.x, j.y, 1.6, '#c8e0ff', 0.3);
          break;
        }
        case S.CAIDO:
        case S.LEVANTA: {
          const j = est.J[x];
          if (!j) break;
          F.onda(j.x, j.y, 2.5, tipo === S.CAIDO ? '#ff3030' : '#ffe8a0', 0.6);
          if (tipo === S.LEVANTA) F.columna(j.x, j.y, 0.8, 5, '#ffe8a0', 0.8);
          break;
        }
        case S.HABILIDAD: {
          const j = est.J[x];
          if (!j) break;
          this.jugadores.de(j.i)?.habilidad();
          F.onda(j.x, j.y, 3, '#ffe0a0', 0.5);
          break;
        }
        case S.SALTO: {
          const clase = d[k + 5];
          if (clase === 2) {
            P.humo(x, 0.5, y, 5, 0.8, '#1a0a12');
            P.humo(d[k + 3], 0.5, d[k + 4], 5, 0.8, '#1a0a12');
          } else if (clase === 4) F.rayo(x, y, d[k + 3], d[k + 4], '#a0a0a0', 0.04, 0.3, 1);
          break;
        }
        case S.APARECE: {
          const desde = d[k + 4];
          if (desde > 0 && cerca < 20) P.polvo(x, 0, y, desde === 2 ? this.bioma.roca[0] : this.bioma.piso[1], 4, 3);
          break;
        }
        case S.INVOCA: {
          const t = d[k + 3];
          F.onda(x, y, 1.5, t === 100 ? '#a060ff' : '#8fe3ff', 0.5);
          P.polvo(x, 0, y, this.bioma.piso[1], 4, 2);
          break;
        }
        case S.CONDENA:
          F.onda(x, y, 2.2, '#b040ff', 2);
          break;
        case S.EJECUTA:
          P.sangre(x, 0.7, y, 6, '#7a0a14');
          F.onda(x, y, 1.6, '#ff2020', 0.35);
          break;
        case S.REACCION: {
          const t = d[k + 3];
          const col = t === 0 ? '#ff8a2a' : t === 1 ? '#e0f0ff' : t === 2 ? '#a0f0ff' : t === 3 ? '#ffe0a0' : t === 5 ? '#ffd040' : '#80ff60';
          P.chispas(x, 0.8, y, col, 10, 4);
          if (t === 1) P.humo(x, 0.4, y, 6, 1.2, '#c0c8d0');
          break;
        }
        case S.CAMPANA: {
          const cod = d[k + 1];
          if (cod === 0) F.columna(d[k + 2], d[k + 3], 1.6, 30, '#ffd890', 5.2);
          if (cod === 1) {
            F.onda(d[k + 2], d[k + 3], 4, '#ffd890', 0.8);
            P.polvo(d[k + 2], 0, d[k + 3], this.bioma.piso[1], 18, 12);
            this.sacudir(0.5);
          }
          break;
        }
        case S.JEFE: {
          const cod = d[k + 1];
          if (cod === 0 || cod === 1) {
            this.sacudir(0.9);
            F.onda(d[k + 2], d[k + 3], 6, '#ff2030', 1.2);
          }
          if (cod === 2) {
            this.sacudir(1);
            F.columna(d[k + 2], d[k + 3], 2, 20, '#ffd890', 1.5);
            for (let e = 0; e < 4; e++) P.brasas(d[k + 2], 0.5, d[k + 3], 10, 2);
          }
          break;
        }
        case S.LIBERA:
          F.onda(x, y, 2, '#ffe8a0', 0.6);
          P.chispas(x, 0.6, y, '#c8c8d0', 8, 3);
          break;
        case S.ESPIGA:
          if (d[k + 3] === 1) F.onda(x, y, 1.6, '#ffd060', 0.5);
          break;
        case S.MARCA:
          if (d[k + 3] === 1) F.rayo(x, y, est.E.x[d[k + 4]] ?? x, est.E.y[d[k + 4]] ?? y, '#ff4080', 0.06, 0.5, 0.9);
          break;
        case S.DISPARO_E:
          P.chispas(x, 0.8, y, '#ff6030', 2, 2);
          break;
        case S.EVOLUCION:
        case S.SOBRECARGA: {
          const j = est.J[x];
          if (!j) break;
          F.columna(j.x, j.y, 0.9, 5, tipo === S.EVOLUCION ? '#ffd040' : '#ff5a3a', 1);
          F.onda(j.x, j.y, 2.5, tipo === S.EVOLUCION ? '#ffd040' : '#ff5a3a', 0.6);
          break;
        }
      }
    }
    // Proyectiles que van cayendo: sombra/aviso en el piso
    for (const p of est.P) {
      if (!p.vivo || p.mov !== MOV.CAE) continue;
      if (Math.random() < 0.3) P.estela(p.x, 0.05, p.y, '#ff4030', 0.4, 0.15);
    }
  }

  /** Anima el ataque de un jugador según el código (arma × 8 + jugador). */
  private animarAtaque(codigo: number, tipo: number, ang: number) {
    if (codigo < 0) return;
    const j = Math.round(codigo) % 8;
    const arma = ARMAS_LISTA[Math.floor(codigo / 8)];
    const m = this.jugadores.de(j);
    if (!m || !arma || m.armaId !== arma.id) return;
    m.atacar(tipo, ang, Math.max(0.18, Math.min(0.4, arma.base.cadencia * 0.4)));
  }

  liberar() {
    removeEventListener('resize', this.ajustar);
    this.limpiarEtapa();
    this.jugadores.liberar();
    this.composer?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}

const TMP = new THREE.Vector3();
const TIPO_ALTAR_V = TIPOS.findIndex((t) => t.id === 'altar');
const LUZ_JUGADOR = new THREE.Color('#ffc890');
const LUZ_FUEGO = new THREE.Color('#ff7a2a');
const LUZ_SANTA = new THREE.Color('#ffe8b0');
const LUZ_CAMPANA = new THREE.Color('#ffd890');
const LUZ_SANGRE = new THREE.Color('#ff2030');
const LUZ_RELIQUIA = new THREE.Color('#c080ff');
