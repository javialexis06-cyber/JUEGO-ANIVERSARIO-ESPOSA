// El dibujo de «Lavarse la cara» con three.js: cámara ortográfica cenital un poco inclinada que sigue al personaje,
// el piso del escenario, los mugrosos (sprites de los modelos de Blender, instanciados y ordenados de atrás hacia
// adelante), las gotitas, los cofres, las velitas, los proyectiles, las zonas (espuma, charcos, ducha), los
// efectos (partículas, toallazos, rayos, explosiones de espuma), los números de daño y Él y Ella en 3D.
// Calidad automática: si el celular va lento, baja la resolución y las partículas.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ARMAS, ESCONDIDAS } from '../armas';
import { ENEMIGOS, ID_ENEMIGOS } from '../enemigos';
import type { Enemigo, Jugador, Motor } from '../motor';
import type { Efecto, IdArma, IdEnemigo, IdObjeto } from '../tipos';
import { Jugador3D } from './jugadores';
import { CAPA_LUZ, CAPA_NORMAL, CAPA_PISO, Particulas } from './particulas';
import { ELEVACION, LoteSprites, cuadroDe, type Cuadro } from './sprites';
import { Suelo } from './suelo';
import { atlasFx, atlasNumeros, type AtlasFx, type AtlasNumeros } from './texturas';

/** Ancho del mapa que se ve en un celular horizontal. */
export const ANCHO_VISTA = 760;

interface DatoBicho {
  cuadros: [number, number, number, number][];
  ancla: [number, number];
  lado: number;
}

/** Color de la salpicadura de cada mugroso al reventar. */
const COLOR: Partial<Record<IdEnemigo, string>> = {
  germen: '#7ccf6b', puntoNegro: '#3a2b2e', gotaGrasa: '#f7c948', acaro: '#c9b9a6', granito: '#f08a7c', caspa: '#f4f1ea', bacteria: '#5aa6e0',
  pelusa: '#a9a4b2', virus: '#b56bd6', barrito: '#e2463e', lagana: '#e9c46a', mugre: '#6b5a48', moco: '#8fcb52', sarro: '#e6cb7a',
  pastaSeca: '#f4faff', hongo: '#c84b4b', cucaracha: '#6b3a22', pelo: '#2b2220', moho: '#3e5a3a', jabonSucio: '#b8e0d2', piojo: '#b98c6a',
  mosquito: '#4a4e5c', pulga: '#7a3b1f', burbujaSucia: '#c9e8f2', babosa: '#c8a35e', espinilla: '#f2a285', espinillon: '#f08a7c',
  reinaCaspa: '#f4f1ea', granMoco: '#8fcb52', senorLagana: '#e9c46a', barroNegro: '#6b5a48', senorSarro: '#e6cb7a', donaCucaracha: '#6b3a22',
  motaPelo: '#a9a4b2', tapon: '#3d3d46', esponjaPodrida: '#c9c25a', peloDesague: '#2b2220', duchaHelada: '#bfe6f5',
};

/** Qué dibujo del atlas de objetos usa cada proyectil (los demás son efectos). */
const SPRITE_PROY: Partial<Record<IdArma, string>> = {
  cepillo: 'cepillo', milCerdas: 'milCerdas', champu: 'champu', remolino: 'champu', peinilla: 'peinilla', peinillaOro: 'peinillaOro',
  botellas: 'botellas', inundacion: 'inundacion', jabon: 'jabon', jabonExplosivo: 'jabonExplosivo', ranitas: 'ranitas', ranaGlotona: 'ranaGlotona',
  copito: 'copito', dobleCopito: 'dobleCopito', tripleCopito: 'tripleCopito', cubitos: 'cubitos', granizada: 'granizada',
  piedraPomez: 'piedraPomez', piedrasCalientes: 'piedrasCalientes', chancletas: 'chancletas', pisoton: 'pisoton',
  hueso: 'hueso', bombaBano: 'bombaBano',
};
/** Colores de las bolitas de gel. */
const COLOR_GEL: [number, number, number][] = [[1, 0.55, 0.75], [0.55, 0.85, 1], [0.7, 1, 0.6], [1, 0.85, 0.45], [0.8, 0.65, 1]];
/** Colores de las rayitas del espejo LED: rojo (la primera), amarillo, azul, fucsia y naranja. */
const COLOR_LUCES: [number, number, number][] = [[1, 0.25, 0.3], [1, 0.88, 0.3], [0.35, 0.62, 1], [1, 0.35, 0.88], [1, 0.6, 0.2]];
/** Las letras de espuma que se turnan. */
const LETRAS = ['letraA', 'letraB', 'letraC'];
/** Pruebas automáticas: sin los muñecos 3D (el WebGL por software no da abasto con dos celulares). */
const SIN_3D = typeof location !== 'undefined' && new URLSearchParams(location.search).has('sin3d');
/** Pruebas con varios celulares en la misma máquina: empezar en la calidad más baja (`?calidad=0`). */
const CALIDAD = typeof location !== 'undefined' ? Number(new URLSearchParams(location.search).get('calidad') ?? 3) : 3;
const LUZ_ESCENARIO = { cara: 'velita', lavamanos: 'vasoCepillos', banera: 'velaFlotante' } as const;
const OBJETO_GEMA = ['gemaAzul', 'gemaVerde', 'gemaRoja', 'gemaGrande'];

const rgb = (hex: string): [number, number, number] => {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
};

export interface Opciones {
  lienzo: HTMLCanvasElement;
  yo: number;
  /** El color de cada jugador (anillo en el piso, cofres propios) cuando juegan varios. */
  colores?: string[];
}

export class Dibujo {
  readonly renderer: THREE.WebGLRenderer;
  readonly escena = new THREE.Scene();
  readonly camara: THREE.OrthographicCamera;
  private suelo!: Suelo;
  private sombras!: LoteSprites;
  private pisoFx!: LoteSprites;
  private objetos!: LoteSprites;
  private bichos!: LoteSprites;
  private proy!: LoteSprites;
  private fxNormal!: LoteSprites;
  private fxLuz!: LoteSprites;
  private numeros!: LoteSprites;
  private part!: Particulas;
  private fx!: AtlasFx;
  private num!: AtlasNumeros;
  private datosBichos: Record<string, DatoBicho> = {};
  private cuadrosBichos = new Map<number, Cuadro[]>();
  private cuadrosObj = new Map<string, Cuadro>();
  private colorBicho = new Map<number, [number, number, number]>();
  private texturas: THREE.Texture[] = [];
  readonly jugadores: (Jugador3D | null)[] = [];
  private leidos = 0;
  private t = 0;
  private cx = 0;
  private cy = 0;
  private sacudon = 0;
  private orden = new Uint16Array(600);
  private claves = new Float32Array(600);
  /** Números de daño: x, y, valor, edad, color (0 blanco, 1 crítico, 2 jugador, 3 cura). */
  private nums = new Float32Array(160 * 5);
  private nNums = 0;
  private sigNum = 0;
  /** Trazos del toallazo vivos: x, y, lado, largo, alto, edad, tipo. */
  private trazos = new Float32Array(24 * 7);
  /** Rayos vivos: x, y, r, edad, tipo. */
  private rayos = new Float32Array(32 * 5);
  /** Haces de hilo dental: x, y, ángulo, largo, ancho, edad, tipo. */
  private haces = new Float32Array(24 * 7);
  /** Planchazos: x, y, radio, ángulo, edad, tipo, ancho (el remate). */
  private tajos = new Float32Array(32 * 7);
  /** Cepillos de espalda cayendo: x, y, radio, demora, edad, tipo. */
  private lanzas = new Float32Array(24 * 6);
  /** Rayitas del espejo LED: x, y, largo, grosor, vertical, color, edad. */
  private rayitas = new Float32Array(64 * 7);
  /** Cohetes de confeti subiendo: x0, y0, x1, y1, duración, edad. */
  private cohetes = new Float32Array(24 * 6);
  /** Muertes recientes (el cuerpo que se aplasta y se borra): x, y, tipo, escala, edad, voltear. */
  private muertes = new Float32Array(80 * 6);
  private nMuertes = 0;
  /** Charcos que se quedan pintados un rato en el piso (salpicaduras): x, y, r, edad, color. */
  private manchas = new Float32Array(120 * 7);
  private nManchas = 0;
  private sigMancha = 0;
  vistaW = ANCHO_VISTA;
  vistaH = 400;
  /** 0 a 3 (3 = lo mejor). */
  calidad = 3;
  private tiemposCuadro: number[] = [];
  private tBajar = 0;
  private tSubir = 0;
  /** Lo que la interfaz quiere saber de lo que pasó (sonidos y avisos se manejan afuera). */
  alEfecto: (e: Efecto) => void = () => undefined;
  numerosVisibles = true;
  private coloresRgb: [number, number, number][] = [];

  constructor(private o: Opciones) {
    this.renderer = new THREE.WebGLRenderer({ canvas: o.lienzo, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.AgXToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 3000);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.escena.environmentIntensity = 0.5;
    this.escena.add(new THREE.HemisphereLight('#fff4e8', '#e7c4ad', 1.2));
    const sol = new THREE.DirectionalLight('#fff1e2', 2.3);
    sol.position.set(-300, 900, 500);
    this.escena.add(sol);
    const borde = new THREE.DirectionalLight('#ffd6e4', 1.0);
    borde.position.set(400, 300, -600);
    this.escena.add(borde);
    this.ajustarCalidad(Number.isFinite(CALIDAD) ? CALIDAD : 3);
  }

  /** `piel`: el tono del anfitrión si es un amigo (la cara del escenario es la suya). */
  async cargar(m: Motor, rolPiel: 'el' | 'ella', piel?: string) {
    const cargador = new THREE.TextureLoader();
    const tex = (ruta: string) =>
      new Promise<THREE.Texture>((ok, mal) =>
        cargador.load(ruta, (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 4;
          t.generateMipmaps = true;
          t.minFilter = THREE.LinearMipmapLinearFilter;
          ok(t);
        }, undefined, mal),
      );
    const json = async <T,>(ruta: string) => (await (await fetch(ruta)).json()) as T;
    const [tb, jb, to, jo] = await Promise.all([
      tex('./lavado/bichos.webp'), json<{ ancho: number; alto: number; bichos: Record<string, DatoBicho> }>('./lavado/bichos.json'),
      tex('./lavado/objetos.webp'), json<{ ancho: number; alto: number; objetos: Record<string, [number, number, number, number]> }>('./lavado/objetos.json'),
    ]);
    this.texturas.push(tb, to);
    this.datosBichos = jb.bichos;
    ID_ENEMIGOS.forEach((id, i) => {
      const d = jb.bichos[id];
      if (d) this.cuadrosBichos.set(i, d.cuadros.map(([x, y, w, h]) => cuadroDe(x + 1, y + 1, w - 2, h - 2, jb.ancho, jb.alto)));
      this.colorBicho.set(i, rgb(COLOR[id] ?? '#ffffff'));
    });
    for (const [n, [x, y, w, h]] of Object.entries(jo.objetos)) this.cuadrosObj.set(n, cuadroDe(x + 1, y + 1, w - 2, h - 2, jo.ancho, jo.alto));
    this.fx = atlasFx();
    this.num = atlasNumeros();
    this.texturas.push(this.fx.textura, this.num.textura);
    this.suelo = new Suelo(m.esc.id, rolPiel, m.esc.limites, piel);
    this.coloresRgb = (this.o.colores ?? []).map(rgb);
    this.escena.add(this.suelo.plano, this.suelo.decor.malla);
    this.sombras = new LoteSprites({ max: 700, mapa: this.fx.textura, piso: true, orden: 2 });
    this.pisoFx = new LoteSprites({ max: 500, mapa: this.fx.textura, piso: true, orden: 3 });
    this.objetos = new LoteSprites({ max: 520, mapa: to, orden: 20 });
    this.bichos = new LoteSprites({ max: 600, mapa: tb, orden: 21 });
    this.proy = new LoteSprites({ max: 500, mapa: to, orden: 22 });
    this.fxNormal = new LoteSprites({ max: 1400, mapa: this.fx.textura, orden: 23 });
    this.fxLuz = new LoteSprites({ max: 1400, mapa: this.fx.textura, aditivo: true, orden: 24 });
    this.numeros = new LoteSprites({ max: 700, mapa: this.num.textura, orden: 30, encima: true });
    for (const l of [this.sombras, this.pisoFx, this.objetos, this.bichos, this.proy, this.fxNormal, this.fxLuz, this.numeros]) this.escena.add(l.malla);
    this.part = new Particulas(1400, this.fx, this.fxNormal, this.fxLuz, this.pisoFx);
    this.part.cupo = this.calidad >= 3 ? 1 : this.calidad === 2 ? 0.75 : this.calidad === 1 ? 0.5 : 0.3;
    // Él y Ella (las pruebas con ?sin3d los cambian por una burbujita: el navegador de prueba no da abasto)
    if (!SIN_3D) await Promise.all(
      m.jug.map(async (j, i) => {
        const p = new Jugador3D(j.rol, j.disfraz, j.aspecto);
        this.jugadores[i] = p;
        await p.cargar();
        this.escena.add(p.raiz);
      }),
    );
    this.ajustar();
  }

  // ------------------------------------------------------------------------------------------------- Pantalla
  ajustar() {
    const w = this.o.lienzo.clientWidth || window.innerWidth, h = this.o.lienzo.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    const a = w / Math.max(1, h);
    // En vertical se ve igual de alto que en horizontal (el mismo pedazo de cara)
    const ancho = a >= 1 ? ANCHO_VISTA : ANCHO_VISTA * 0.62;
    const alto = ancho / a;
    this.camara.left = -ancho / 2;
    this.camara.right = ancho / 2;
    this.camara.top = alto / 2;
    this.camara.bottom = -alto / 2;
    this.camara.updateProjectionMatrix();
    this.vistaW = ancho;
    this.vistaH = alto / Math.sin(ELEVACION);
  }

  ajustarCalidad(n: number) {
    this.calidad = Math.max(0, Math.min(3, n));
    const dpr = window.devicePixelRatio || 1;
    const r = [0.8, 1.1, 1.5, Math.min(2, dpr)][this.calidad];
    this.renderer.setPixelRatio(Math.min(dpr, r));
    if (this.part) this.part.cupo = [0.3, 0.5, 0.75, 1][this.calidad];
    this.ajustar();
  }

  /** Mide cuánto se demora cada cuadro y sube o baja la calidad sola. */
  medir(ms: number) {
    this.tiemposCuadro.push(ms);
    if (this.tiemposCuadro.length < 30) return;
    const prom = this.tiemposCuadro.reduce((a, b) => a + b, 0) / this.tiemposCuadro.length;
    this.tiemposCuadro.length = 0;
    if (prom > 40) {
      this.tBajar++;
      this.tSubir = 0;
      if (this.tBajar >= 2 && this.calidad > 0) {
        this.ajustarCalidad(this.calidad - 1);
        this.tBajar = 0;
      }
    } else if (prom < 22) {
      this.tSubir++;
      this.tBajar = 0;
      if (this.tSubir >= 8 && this.calidad < 3) {
        this.ajustarCalidad(this.calidad + 1);
        this.tSubir = 0;
      }
    } else {
      this.tBajar = this.tSubir = 0;
    }
  }

  private v3 = new THREE.Vector3();
  /** Dónde queda un punto del mapa en la pantalla (píxeles CSS). */
  aPantalla(x: number, y: number): [number, number] {
    this.v3.set(x, 0, y).project(this.camara);
    const w = this.o.lienzo.clientWidth || window.innerWidth, h = this.o.lienzo.clientHeight || window.innerHeight;
    return [((this.v3.x + 1) / 2) * w, ((1 - this.v3.y) / 2) * h];
  }

  sacudir(f: number) {
    this.sacudon = Math.max(this.sacudon, f);
  }

  // ------------------------------------------------------------------------------------------------- Efectos que llegan del motor
  private procesar(m: Motor, e: Efecto) {
    const P = this.part;
    const az = Math.random;
    switch (e.tipo) {
      case 'golpe': {
        if (this.numerosVisibles) this.numero(e.x, e.y, e.c, e.d ? 1 : 0);
        P.crear('chispa', CAPA_LUZ, e.x, e.y + 2, 18 + az() * 10, 0, 0, 0, 0.18, 14, 26, 1, 1, 0.9, 0.9);
        break;
      }
      case 'muere': {
        const ti = e.c;
        const col = this.colorBicho.get(ti) ?? [1, 1, 1];
        const k = e.d;
        // El cuerpo se aplasta y desaparece
        if (this.nMuertes < 80) {
          const b = this.nMuertes++ * 6;
          const D = this.muertes;
          D[b] = e.x;
          D[b + 1] = e.y;
          D[b + 2] = ti;
          D[b + 3] = k;
          D[b + 4] = 0;
          D[b + 5] = az() < 0.5 ? 1 : -1;
        }
        // Salpicadura que queda en el piso un ratico
        this.mancha(e.x, e.y, 16 * k + 8, col);
        const n = Math.min(14, 6 + Math.round(k * 3));
        for (let q = 0; q < n; q++) {
          const a = az() * Math.PI * 2, v = 60 + az() * 120 * Math.sqrt(k);
          P.crear('gota', CAPA_NORMAL, e.x, e.y, 14 * k, Math.cos(a) * v, Math.sin(a) * v * 0.7, 90 + az() * 120, 0.55 + az() * 0.3, 7 * Math.sqrt(k), 4, col[0], col[1], col[2], 1, 420,
            0, 0, 1.5);
        }
        P.crear('polvo', CAPA_LUZ, e.x, e.y, 16 * k, 0, 0, 20, 0.35, 20 * k, 46 * k, 1, 1, 1, 0.6);
        P.crear('anillo', CAPA_PISO, e.x, e.y, 0, 0, 0, 0, 0.3, 10 * k, 50 * k, 1, 1, 1, 0.7);
        if (e.e || k > 1.5) {
          for (let q = 0; q < 16; q++) {
            const a = (q / 16) * Math.PI * 2;
            P.crear(q % 2 ? 'estrella' : 'chispa', CAPA_LUZ, e.x, e.y, 30, Math.cos(a) * 200, Math.sin(a) * 140, 120, 0.8, 18, 6, 1, 0.95, 0.6, 1, 260, 0, 6, 2);
          }
          this.sacudir(0.6);
        }
        break;
      }
      case 'latigo': {
        for (let q = 0; q < 24; q++) {
          const b = q * 7;
          if (this.trazos[b + 5] < 1 && this.trazos[b + 3] > 0) continue;
          const T = this.trazos;
          T[b] = e.x;
          T[b + 1] = e.y;
          T[b + 2] = e.c;
          T[b + 3] = e.d;
          T[b + 4] = e.e;
          T[b + 5] = 0;
          T[b + 6] = e.f;
          break;
        }
        // La máquina de afeitar: chispitas plateadas (no gotas)
        if (e.f >= 2) {
          for (let q = 0; q < 3; q++) P.crear('chispa', CAPA_LUZ, e.x + e.c * az() * e.d, e.y + (az() - 0.5) * e.e, 18, e.c * 90, 0, 40, 0.25, 9, 3, 0.8, 0.92, 1, 1);
          break;
        }
        // Gotas que salpica la toalla mojada
        for (let q = 0; q < 10; q++) {
          const x = e.x + e.c * (20 + az() * e.d);
          P.crear('gota', CAPA_NORMAL, x, e.y + (az() - 0.5) * e.e, 22, e.c * (60 + az() * 80), (az() - 0.5) * 60, 60 + az() * 80, 0.45, 7, 4,
            e.f ? 1 : 0.75, e.f ? 0.55 : 0.9, e.f ? 0.4 : 1, 0.9, 380);
        }
        if (e.f) for (let q = 0; q < 5; q++) P.crear('humo', CAPA_NORMAL, e.x + e.c * az() * e.d, e.y, 30, 0, 0, 30, 0.8, 18, 40, 1, 1, 1, 0.5);
        break;
      }
      case 'rayo': {
        for (let q = 0; q < 32; q++) {
          const b = q * 5;
          if (this.rayos[b + 3] < 0.4 && this.rayos[b + 2] > 0) continue;
          const R = this.rayos;
          R[b] = e.x;
          R[b + 1] = e.y;
          R[b + 2] = e.c;
          R[b + 3] = 0;
          R[b + 4] = e.f;
          break;
        }
        if (e.f === 2) {
          // Brillantina: destellitos de colores
          for (let q = 0; q < 6; q++) {
            const a = az() * Math.PI * 2;
            P.crear(q % 2 ? 'estrella' : 'confeti', CAPA_LUZ, e.x, e.y, 14, Math.cos(a) * 90, Math.sin(a) * 70, 80, 0.45, 8, 3, 1, 0.55 + az() * 0.4, 0.85, 1, 200, a, 6);
          }
          break;
        }
        P.crear('brillo', CAPA_LUZ, e.x, e.y, 10, 0, 0, 0, 0.3, e.c * 2.4, e.c * 3.2, 1, 0.95, 0.6, 0.9);
        P.crear('anillo', CAPA_PISO, e.x, e.y, 0, 0, 0, 0, 0.35, e.c * 0.5, e.c * 2.4, 1, 0.95, 0.6, 1);
        for (let q = 0; q < 8; q++) {
          const a = az() * Math.PI * 2;
          P.crear('chispa', CAPA_LUZ, e.x, e.y, 10, Math.cos(a) * 160, Math.sin(a) * 120, 100 + az() * 100, 0.4, 14, 4, 1, 1, 0.6, 1, 300);
        }
        this.sacudir(0.25);
        break;
      }
      case 'charco': {
        // (la mascarilla salpica verde pepino)
        const col = e.f === 2 ? [0.62, 0.9, 0.5] : [0.6, 0.85, 1];
        for (let q = 0; q < (e.f === 2 ? 6 : 12); q++) {
          const a = (q / 12) * Math.PI * 2;
          P.crear('gota', CAPA_NORMAL, e.x, e.y, 8, Math.cos(a) * 110, Math.sin(a) * 80, 100 + az() * 60, 0.5, 8, 4, col[0], col[1], col[2], 1, 420);
        }
        P.crear('salpicadura', CAPA_PISO, e.x, e.y, 0, 0, 0, 0, 0.5, e.c * 1.2, e.c * 2.2, e.f === 2 ? 0.7 : 0.75, e.f === 2 ? 0.95 : 0.92, e.f === 2 ? 0.6 : 1, 0.8);
        break;
      }
      case 'explosion': {
        const tipo = e.f, r = e.c;
        if (tipo === 1) {
          for (let q = 0; q < 14; q++) {
            const a = az() * Math.PI * 2, v = az() * r * 2;
            P.crear('llama', CAPA_LUZ, e.x, e.y, 12, Math.cos(a) * v, Math.sin(a) * v * 0.7, 60, 0.5, r * 0.5, r * 0.15, 1, 0.8, 0.5, 1, 0, a, 0, 2);
          }
          P.crear('humo', CAPA_NORMAL, e.x, e.y, 20, 0, 0, 40, 1.0, r * 0.8, r * 1.8, 0.5, 0.45, 0.45, 0.6);
          this.sacudir(0.35);
        } else if (tipo === 2) {
          for (let q = 0; q < 10; q++) {
            const a = (q / 10) * Math.PI * 2;
            P.crear('corazon', CAPA_NORMAL, e.x, e.y, 20, Math.cos(a) * r * 1.6, Math.sin(a) * r * 1.2, 60, 0.7, 16, 8, 1, 1, 1, 1, 0, 0, 0, 2);
          }
        } else if (tipo === 8) {
          // Cohete de confeti que revienta: confeti de colores, estrellitas y un anillo
          const cols = [[1, 0.5, 0.8], [1, 0.85, 0.35], [0.55, 0.85, 1], [0.6, 1, 0.6], [0.85, 0.6, 1]];
          for (let q = 0; q < 18; q++) {
            const a = (q / 18) * Math.PI * 2, v = r * (1.6 + az() * 1.4), c = cols[q % 5];
            P.crear(q % 4 ? 'confeti' : 'estrella', CAPA_LUZ, e.x, e.y, 30, Math.cos(a) * v, Math.sin(a) * v * 0.8, 40, 0.9, 9, 5, c[0], c[1], c[2], 1, 160, a, 7, 2);
          }
          P.crear('anillo', CAPA_PISO, e.x, e.y, 0, 0, 0, 0, 0.45, r * 0.3, r * 2.2, 1, 0.9, 0.6, 0.9);
          P.crear('brillo', CAPA_LUZ, e.x, e.y, 30, 0, 0, 0, 0.2, r * 0.6, r * 1.4, 1, 0.85, 0.6, 0.5);
        } else if (tipo === 9) {
          // Pétalos de talco en equis
          for (let q = 0; q < 8; q++) {
            const a = Math.PI / 4 + (q % 4) * (Math.PI / 2), v = r * (q < 4 ? 2.2 : 1.2);
            P.crear('petalo', CAPA_NORMAL, e.x, e.y, 14, Math.cos(a) * v, Math.sin(a) * v * 0.8, 20, 0.6, 10, 6, 1, 0.82, 0.9, 1, 0, a, 4, 2);
          }
          P.crear('polvo', CAPA_NORMAL, e.x, e.y, 10, 0, 0, 10, 0.6, r * 0.6, r * 1.6, 1, 1, 1, 0.6);
        } else if (tipo === 10) {
          // La bomba de baño revienta en espuma de colores
          const cols = [[1, 0.55, 0.75], [0.6, 0.85, 1], [0.75, 0.6, 1], [1, 0.9, 0.5]];
          for (let q = 0; q < 14; q++) {
            const a = az() * Math.PI * 2, v = az() * r * 2.2, c = cols[q % 4];
            P.crear(q % 3 ? 'espuma' : 'burbuja', CAPA_NORMAL, e.x, e.y, 10, Math.cos(a) * v, Math.sin(a) * v * 0.7, 50 + az() * 60, 0.7, r * 0.5, r * 0.2, c[0], c[1], c[2], 1, 60, 0, 0, 3);
          }
          P.crear('anillo', CAPA_PISO, e.x, e.y, 0, 0, 0, 0, 0.35, r * 0.4, r * 2.2, 1, 0.7, 0.9, 0.9);
          this.sacudir(0.2);
        } else if (tipo === 11) {
          // La cortina de terciopelo devuelve el golpe: onda roja
          P.crear('onda', CAPA_PISO, e.x, e.y, 0, 0, 0, 0, 0.5, 20, r * 2.4, 0.95, 0.25, 0.35, 1);
          P.crear('anillo', CAPA_PISO, e.x, e.y, 0, 0, 0, 0, 0.4, 10, r * 2, 1, 0.5, 0.6, 1);
          for (let q = 0; q < 10; q++) {
            const a = (q / 10) * Math.PI * 2;
            P.crear('chispa', CAPA_LUZ, e.x, e.y, 20, Math.cos(a) * r * 2, Math.sin(a) * r * 1.5, 40, 0.4, 12, 3, 1, 0.4, 0.5, 1);
          }
          this.sacudir(0.35);
        } else if (tipo === 6) {
          // Brillantina que revienta: confeti de colores y estrellitas
          const cols = [[1, 0.5, 0.85], [1, 0.85, 0.35], [0.6, 0.85, 1], [0.8, 0.6, 1]];
          for (let q = 0; q < 14; q++) {
            const a = az() * Math.PI * 2, v = 60 + az() * r * 3, c = cols[q % 4];
            P.crear(q % 3 ? 'confeti' : 'estrella', CAPA_LUZ, e.x, e.y, 12, Math.cos(a) * v, Math.sin(a) * v * 0.7, 90 + az() * 80, 0.7, 9, 4, c[0], c[1], c[2], 1, 260, a, 8, 1.5);
          }
          P.crear('anillo', CAPA_PISO, e.x, e.y, 0, 0, 0, 0, 0.35, r * 0.4, r * 2.3, 1, 0.6, 0.9, 1);
          P.crear('brillo', CAPA_LUZ, e.x, e.y, 10, 0, 0, 0, 0.22, r * 0.8, r * 1.5, 1, 0.45, 0.8, 0.3);
        } else if (tipo === 7) {
          // El cepillo de espalda llega al piso: un anillo de espuma y burbujas
          for (let q = 0; q < 12; q++) {
            const a = (q / 12) * Math.PI * 2;
            P.crear(q % 3 ? 'espuma' : 'burbuja', CAPA_NORMAL, e.x + Math.cos(a) * r * 0.5, e.y + Math.sin(a) * r * 0.4, 6, Math.cos(a) * r * 1.6, Math.sin(a) * r * 1.2, 40, 0.55, r * 0.4, r * 0.15, 0.9, 0.96, 1, 1, 0, 0, 0, 3);
          }
          P.crear('anillo', CAPA_PISO, e.x, e.y, 0, 0, 0, 0, 0.4, r * 0.3, r * 2.4, 0.7, 0.88, 1, 1);
          P.crear('onda', CAPA_PISO, e.x, e.y, 0, 0, 0, 0, 0.5, r * 0.5, r * 2.8, 1, 1, 1, 0.8);
          this.sacudir(0.15);
        } else if (tipo === 5) {
          const cols = [[1, 0.85, 0.4], [1, 0.5, 0.7], [0.5, 0.8, 1], [0.6, 1, 0.6]];
          for (let q = 0; q < 8; q++) {
            const a = az() * Math.PI * 2, c = cols[q % 4];
            P.crear('brillo', CAPA_LUZ, e.x + Math.cos(a) * r * 0.5, e.y + Math.sin(a) * r * 0.4, 12, 0, 0, 30, 0.5, 18, 6, c[0], c[1], c[2], 1);
          }
        } else {
          // Espuma y burbujas (jabón y paticos)
          const n = tipo >= 3 ? 9 : 12;
          for (let q = 0; q < n; q++) {
            const a = az() * Math.PI * 2, v = az() * r * 2.2;
            P.crear(q % 3 ? 'espuma' : 'burbuja', CAPA_NORMAL, e.x, e.y, 10, Math.cos(a) * v, Math.sin(a) * v * 0.7, 50 + az() * 60, 0.65, r * 0.55, r * 0.2, 1, 1, 1, 1, 60, 0, 0, 3);
          }
          P.crear('anillo', CAPA_PISO, e.x, e.y, 0, 0, 0, 0, 0.35, r * 0.4, r * 2.2, 0.85, 0.95, 1, 0.9);
          if (tipo === 4) P.crear('corazon', CAPA_NORMAL, e.x, e.y, 30, 0, 0, 60, 0.6, 18, 26, 1, 1, 1, 1);
        }
        break;
      }
      case 'haz': {
        for (let q = 0; q < 24; q++) {
          const b = q * 7;
          if (this.haces[b + 5] < 0.3 && this.haces[b + 3] > 0) continue;
          const H = this.haces;
          H[b] = e.x;
          H[b + 1] = e.y;
          H[b + 2] = e.c;
          H[b + 3] = e.d;
          H[b + 4] = e.e;
          H[b + 5] = 0;
          H[b + 6] = e.f;
          break;
        }
        break;
      }
      case 'columna': {
        for (let q = 0; q < 4; q++) P.crear('gota', CAPA_NORMAL, e.x + (az() - 0.5) * e.c, e.y + (az() - 0.5) * e.d * 0.8, 6, (az() - 0.5) * 80, 0, 80 + az() * 80, 0.45, 5, 3, 0.65, 0.88, 1, 0.45, 400);
        break;
      }
      case 'gema': {
        const col = [[0.5, 0.8, 1], [0.5, 1, 0.65], [1, 0.45, 0.55], [1, 0.4, 0.6]][e.c] ?? [1, 1, 1];
        P.crear('chispa', CAPA_LUZ, e.x, e.y, 20, 0, 0, 60, 0.3, 18, 4, col[0], col[1], col[2], 1);
        break;
      }
      case 'moneda': {
        for (let q = 0; q < 6; q++) P.crear('chispa', CAPA_LUZ, e.x, e.y, 20, (az() - 0.5) * 120, (az() - 0.5) * 60, 90 + az() * 80, 0.6, 12, 4, 1, 0.85, 0.35, 1, 260);
        if (this.numerosVisibles) this.numero(e.x, e.y - 10, e.c, 4);
        break;
      }
      case 'curar': {
        for (let q = 0; q < 6; q++) P.crear(q % 2 ? 'corazon' : 'cruz', CAPA_NORMAL, e.x + (az() - 0.5) * 30, e.y + 2, 20 + az() * 30, 0, 0, 50, 0.9, 12, 16, q % 2 ? 1 : 0.5, 1, q % 2 ? 1 : 0.6, 1);
        if (this.numerosVisibles) this.numero(e.x, e.y - 30, e.c, 3);
        break;
      }
      case 'nivel': {
        for (const j of m.jug) {
          for (let q = 0; q < 3; q++) P.crear('anillo', CAPA_PISO, j.x, j.y, 0, 0, 0, 0, 0.6 + q * 0.15, 20, 140 + q * 40, 0.6, 0.9, 1, 0.9);
          for (let q = 0; q < 14; q++) {
            const a = (q / 14) * Math.PI * 2;
            P.crear(q % 2 ? 'estrella' : 'chispa', CAPA_LUZ, j.x, j.y, 30, Math.cos(a) * 160, Math.sin(a) * 110, 160, 0.9, 16, 6, 0.8, 0.95, 1, 1, 260, 0, 5, 1.5);
          }
        }
        break;
      }
      case 'herido': {
        const p = this.jugadores[e.c];
        p?.golpe();
        if (e.c === this.o.yo) this.sacudir(0.35);
        const j = m.jug[e.c];
        if (j && this.numerosVisibles) this.numero(j.x, j.y - 40, e.d, 2);
        break;
      }
      case 'revive':
      case 'levanta': {
        for (let q = 0; q < 20; q++) {
          const a = (q / 20) * Math.PI * 2;
          P.crear('corazon', CAPA_NORMAL, e.x, e.y, 30, Math.cos(a) * 180, Math.sin(a) * 130, 140, 1.1, 20, 10, 1, 1, 1, 1, 200, 0, 0, 1.5);
        }
        P.crear('anillo', CAPA_PISO, e.x, e.y, 0, 0, 0, 0, 0.7, 30, 320, 1, 0.7, 0.85, 1);
        this.jugadores[e.c]?.celebrar(1.0);
        break;
      }
      case 'cae': {
        for (let q = 0; q < 10; q++) P.crear('burbuja', CAPA_NORMAL, e.x + (az() - 0.5) * 40, e.y, 10 + az() * 30, 0, 0, 40 + az() * 30, 1.2, 10, 18, 1, 1, 1, 1);
        break;
      }
      case 'romper': {
        for (let q = 0; q < 10; q++) {
          const a = az() * Math.PI * 2;
          P.crear(q % 2 ? 'chispa' : 'gota', q % 2 ? CAPA_LUZ : CAPA_NORMAL, e.x, e.y, 16, Math.cos(a) * 120, Math.sin(a) * 90, 100 + az() * 100, 0.6, 9, 4, 1, 0.9, 0.85, 1, 420);
        }
        P.crear('humo', CAPA_NORMAL, e.x, e.y, 26, 0, 0, 40, 0.9, 16, 40, 0.9, 0.88, 0.86, 0.7);
        break;
      }
      case 'evolucion': {
        for (let q = 0; q < 30; q++) {
          const a = (q / 30) * Math.PI * 2;
          P.crear(q % 3 ? 'estrella' : 'brillo', CAPA_LUZ, e.x, e.y, 20, Math.cos(a) * 220, Math.sin(a) * 160, 240, 1.4, 24, 8, 1, 0.9, 0.5, 1, 220, 0, 4, 1);
        }
        for (let q = 0; q < 4; q++) P.crear('anillo', CAPA_PISO, e.x, e.y, 0, 0, 0, 0, 0.8 + q * 0.2, 20, 260 + q * 40, 1, 0.85, 0.4, 1);
        this.jugadores[e.c]?.celebrar(1.4);
        this.sacudir(0.5);
        break;
      }
      case 'fuego': {
        for (let q = 0; q < 6; q++) {
          const a = e.c + (az() - 0.5) * 0.7, v = 220 + az() * 160;
          P.crear('llama', CAPA_LUZ, e.x + Math.cos(e.c) * 16, e.y + Math.sin(e.c) * 12, 26, Math.cos(a) * v, Math.sin(a) * v * 0.75, 0, 0.5, 14, 40, 1, 0.75, 0.4, 1, 0, a + Math.PI / 2);
        }
        break;
      }
      case 'limpiar': {
        P.crear('onda', CAPA_PISO, e.x, e.y, 0, 0, 0, 0, 0.9, 40, 1100, e.c ? 1 : 0.85, e.c ? 0.85 : 0.95, e.c ? 0.6 : 1, 1);
        P.crear('onda', CAPA_PISO, e.x, e.y, 0, 0, 0, 0, 1.1, 20, 800, 1, 1, 1, 0.8);
        for (let q = 0; q < 20; q++) {
          const a = (q / 20) * Math.PI * 2;
          P.crear(e.c ? 'corazon' : 'espuma', CAPA_NORMAL, e.x, e.y, 20, Math.cos(a) * 420, Math.sin(a) * 300, 60, 0.9, 26, 14, 1, 1, 1, 1);
        }
        this.sacudir(0.5);
        break;
      }
      case 'congela': {
        for (let q = 0; q < 30; q++) P.crear('copo', CAPA_LUZ, this.cx + (az() - 0.5) * this.vistaW, this.cy + (az() - 0.5) * this.vistaH, 160 + az() * 120, (az() - 0.5) * 30, 0, -60, 2.2, 10 + az() * 10, 6, 0.85, 0.95, 1, 0.9, 0, 0, 1);
        break;
      }
      case 'jefe':
        this.sacudir(0.6);
        break;
      case 'escudo': {
        // La cortina atajó el golpe: un anillo que se abre y chispitas del color de las cargas que quedan
        const col = e.f ? [1, 0.35, 0.45] : e.d >= 2 ? [1, 0.95, 0.55] : e.d >= 1 ? [0.6, 1, 0.7] : [0.6, 0.82, 1];
        P.crear('anillo', CAPA_PISO, e.x, e.y, 0, 0, 0, 0, 0.45, 30, 140, col[0], col[1], col[2], 1);
        for (let q = 0; q < 12; q++) {
          const a = (q / 12) * Math.PI * 2;
          P.crear('estrella', CAPA_LUZ, e.x + Math.cos(a) * 30, e.y + Math.sin(a) * 24, 24, Math.cos(a) * 140, Math.sin(a) * 100, 60, 0.5, 10, 4, col[0], col[1], col[2], 1, 0, 0, 5);
        }
        break;
      }
      case 'cohete': {
        const C = this.cohetes;
        for (let q = 0; q < 24; q++) {
          const b = q * 6;
          if (C[b + 4] > 0 && C[b + 5] < C[b + 4]) continue;
          C[b] = e.x;
          C[b + 1] = e.y;
          C[b + 2] = e.c;
          C[b + 3] = e.d;
          C[b + 4] = e.e;
          C[b + 5] = 0;
          break;
        }
        break;
      }
      case 'tajo': {
        const T = this.tajos;
        for (let q = 0; q < 32; q++) {
          const b = q * 7;
          if (T[b + 2] > 0 && T[b + 4] < 0.3) continue;
          T[b] = e.x;
          T[b + 1] = e.y;
          T[b + 2] = e.c;
          T[b + 3] = e.d;
          T[b + 4] = 0;
          T[b + 5] = e.f;
          T[b + 6] = e.d;
          break;
        }
        // Vapor de la plancha caliente
        if (e.f !== 2) P.crear('humo', CAPA_NORMAL, e.x, e.y, 16, 0, 0, 30, 0.5, e.c * 0.4, e.c * 0.9, 1, 1, 1, 0.35);
        else this.sacudir(0.25);
        break;
      }
      case 'lanza': {
        const L = this.lanzas;
        for (let q = 0; q < 24; q++) {
          const b = q * 6;
          if (L[b + 2] > 0 && L[b + 4] < L[b + 3]) continue;
          L[b] = e.x;
          L[b + 1] = e.y;
          L[b + 2] = e.c;
          L[b + 3] = e.d;
          L[b + 4] = 0;
          L[b + 5] = e.f;
          break;
        }
        break;
      }
      case 'luces': {
        const R = this.rayitas;
        for (let q = 0; q < 64; q++) {
          const b = q * 7;
          if (R[b + 2] > 0 && R[b + 6] < 0.24) continue;
          R[b] = e.x;
          R[b + 1] = e.y;
          R[b + 2] = e.c;
          R[b + 3] = e.d;
          R[b + 4] = e.e;
          R[b + 5] = e.f;
          R[b + 6] = 0;
          break;
        }
        const c = COLOR_LUCES[e.f] ?? COLOR_LUCES[0];
        for (let q = 0; q < 3; q++) P.crear('chispa', CAPA_LUZ, e.x + (az() - 0.5) * (e.e ? e.d : e.c), e.y + (az() - 0.5) * (e.e ? e.c : e.d), 8, 0, 0, 30, 0.3, 8, 2, c[0], c[1], c[2], 1);
        break;
      }
    }
    this.alEfecto(e);
  }

  private numero(x: number, y: number, v: number, tipo: number) {
    if (v < 0.5 && tipo !== 3) return;
    const b = this.sigNum * 5;
    this.nums[b] = x + (Math.random() - 0.5) * 18;
    this.nums[b + 1] = y + (Math.random() - 0.5) * 8;
    this.nums[b + 2] = Math.round(v);
    this.nums[b + 3] = 0;
    this.nums[b + 4] = tipo;
    this.sigNum = (this.sigNum + 1) % 160;
    this.nNums = Math.min(160, this.nNums + 1);
  }

  private mancha(x: number, y: number, r: number, col: [number, number, number]) {
    const b = this.sigMancha * 7;
    const M = this.manchas;
    M[b] = x;
    M[b + 1] = y;
    M[b + 2] = r;
    M[b + 3] = 0;
    M[b + 4] = col[0];
    M[b + 5] = col[1];
    M[b + 6] = col[2];
    this.sigMancha = (this.sigMancha + 1) % 120;
    this.nManchas = Math.min(120, this.nManchas + 1);
  }

  // ------------------------------------------------------------------------------------------------- Cada cuadro
  dibujar(m: Motor, dt: number, pausa: boolean) {
    const t0 = performance.now();
    if (!pausa) this.t += dt;
    const yo = m.jug[this.o.yo] ?? m.jug[0];
    // La cámara sigue a quien juega en este celular
    const k = 1 - Math.exp(-dt * 8);
    this.cx += (yo.x - this.cx) * k;
    this.cy += (yo.y - this.cy) * k;
    if (Math.abs(yo.x - this.cx) > 400 || Math.abs(yo.y - this.cy) > 400) {
      this.cx = yo.x;
      this.cy = yo.y;
    }
    this.sacudon = Math.max(0, this.sacudon - dt * 2.5);
    const sx = this.sacudon > 0 ? (Math.random() - 0.5) * 10 * this.sacudon : 0;
    const sy = this.sacudon > 0 ? (Math.random() - 0.5) * 10 * this.sacudon : 0;
    const D = 1200;
    this.camara.position.set(this.cx + sx, Math.sin(ELEVACION) * D, this.cy + sy + Math.cos(ELEVACION) * D);
    this.camara.lookAt(this.cx + sx, 0, this.cy + sy);
    // Lo que pasó desde el último cuadro
    if (m.nEf - this.leidos > m.ef.length) this.leidos = m.nEf - m.ef.length;
    for (; this.leidos < m.nEf; this.leidos++) this.procesar(m, m.ef[this.leidos % m.ef.length]);
    this.suelo.actualizar(this.cx, this.cy, this.vistaW, this.vistaH, this.t, m.esc.limites);
    for (const l of [this.sombras, this.pisoFx, this.objetos, this.bichos, this.proy, this.fxNormal, this.fxLuz, this.numeros]) l.empezar();
    const dtv = pausa ? 0 : dt;
    this.dibujarManchas(dtv);
    this.dibujarZonas(m);
    this.dibujarObjetos(m);
    this.dibujarBichos(m, dtv);
    this.dibujarProyectiles(m);
    this.dibujarArmas(m);
    this.dibujarTrazos(dtv);
    this.part.actualizar(dtv);
    this.part.dibujar();
    this.dibujarNumeros(dtv);
    // Personajes (con varios, cada uno con el anillo de su color en el piso; los que se fueron no se ven)
    const varios = m.jug.length > 1;
    for (let i = 0; i < m.jug.length; i++) {
      const j = m.jug[i];
      const p = this.jugadores[i];
      if (p) p.raiz.visible = !j.fuera;
      if (j.fuera) continue;
      if (!p) {
        if (!SIN_3D) continue;
        const b = this.fx.c.burbuja;
        const c = this.coloresRgb[i] ?? (j.rol === 'ella' ? [1, 0.6, 0.8] : [0.5, 0.6, 1]);
        this.fxNormal.poner(j.x, j.y, 0, 34, 40, 0.5, 1, b.u0, b.v0, b.u1, b.v1, c[0], c[1], c[2], 1);
      } else p.actualizar(j, dt, pausa);
      this.sombra(j.x, j.y, 26, 0.45);
      if (varios) this.anilloJugador(j, i);
      if (j.manual && !j.caido) this.mira(j, i === this.o.yo);
      this.barraVida(j);
      if (j.caido) this.burbujaCaido(j);
    }
    for (const l of [this.sombras, this.pisoFx, this.objetos, this.bichos, this.proy, this.fxNormal, this.fxLuz, this.numeros]) l.terminar();
    this.renderer.render(this.escena, this.camara);
    if (!pausa) this.medir(performance.now() - t0 + (dt * 1000 > 34 ? dt * 1000 - 33 : 0));
  }

  /** El anillo de color de cada jugador (para saber quién es quién de un vistazo). */
  private anilloJugador(j: Jugador, i: number) {
    const c = this.coloresRgb[i];
    if (!c) return;
    const o = this.fx.c.anillo;
    const pulso = i === this.o.yo ? 1 : 0.8;
    this.pisoFx.poner(j.x, j.y, 0.04, 58, 40, 0.5, 0.5, o.u0, o.v0, o.u1, o.v1, c[0], c[1], c[2], 0.75 * pulso);
  }

  /** Apuntar a mano: tres puntitos y una mira hacia donde apunta (la propia más clara). */
  private mira(j: Jugador, propia: boolean) {
    const b = this.fx.c.brillo, o = this.fx.c.anillo;
    const l = Math.hypot(j.ax, j.ay) || 1;
    const ux = j.ax / l, uy = j.ay / l;
    const a = propia ? 0.9 : 0.45;
    for (let k = 0; k < 3; k++) {
      const d = 34 + k * 18;
      this.pisoFx.poner(j.x + ux * d, j.y + uy * d * 0.9, 0.13, 12 - k * 2, 9 - k * 1.5, 0.5, 0.5, b.u0, b.v0, b.u1, b.v1, 1, 0.95, 0.75, a * (1 - k * 0.2));
    }
    const pul = 1 + Math.sin(this.t * 6) * 0.08;
    this.pisoFx.poner(j.x + ux * 104, j.y + uy * 104 * 0.9, 0.14, 30 * pul, 22 * pul, 0.5, 0.5, o.u0, o.v0, o.u1, o.v1, 1, 0.85, 0.55, a);
  }

  /** Un anillo o un arete escondido: flota y brilla para que se vea desde lejos. */
  private tesoro(x: number, y: number, nombre: string) {
    const t = this.t;
    const c = this.cuadrosObj.get(nombre);
    if (!c) return;
    const b = this.fx.c.brillo;
    this.pisoFx.poner(x, y, 0.1, 120, 84, 0.5, 0.5, b.u0, b.v0, b.u1, b.v1, 1, 0.9, 0.6, 0.55 + Math.sin(t * 4) * 0.2);
    this.fxLuz.poner(x, y, 30, 70, 70, 0.5, 0.5, b.u0, b.v0, b.u1, b.v1, 1, 0.95, 0.75, 0.35 + Math.sin(t * 6) * 0.1);
    this.objetos.poner(x, y, 14 + Math.sin(t * 3) * 6, 44, 44, 0.5, 0.92, c.u0, c.v0, c.u1, c.v1, 1, 1, 1, 1, 0, 0, 1, Math.sin(t * 2) * 0.2, 0.15 + Math.max(0, Math.sin(t * 5)) * 0.2);
    this.sombra(x, y, 16, 0.3);
    if (Math.random() < 0.2) this.part.crear('estrella', CAPA_LUZ, x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 30, 20 + Math.random() * 30, 0, 0, 30, 0.8, 10, 3, 1, 0.92, 0.6, 1, 0, 0, 4);
  }

  private sombra(x: number, y: number, r: number, a: number) {
    if (this.calidad === 0 && r < 20) return;
    const c = this.fx.c.sombra;
    this.sombras.poner(x, y, 0.05, r * 2, r * 1.1, 0.5, 0.5, c.u0, c.v0, c.u1, c.v1, 0.2, 0.1, 0.08, a);
  }

  private dibujarManchas(dt: number) {
    const c = this.fx.c.salpicadura;
    for (let q = 0; q < this.nManchas; q++) {
      const b = q * 7;
      this.manchas[b + 3] += dt;
      const edad = this.manchas[b + 3];
      if (edad > 2.2) continue;
      const a = Math.min(1, edad * 10) * Math.max(0, 1 - edad / 2.2) * 0.75;
      const r = this.manchas[b + 2] * (0.7 + Math.min(1, edad * 6) * 0.5);
      this.pisoFx.poner(this.manchas[b], this.manchas[b + 1], 0.06, r * 2, r * 1.6, 0.5, 0.5, c.u0, c.v0, c.u1, c.v1,
        this.manchas[b + 4], this.manchas[b + 5], this.manchas[b + 6], a, 0, 0, 1, b);
    }
  }

  private dibujarZonas(m: Motor) {
    const t = this.t;
    for (const z of m.zonas) {
      if (!z.vivo) continue;
      const vida = Math.min(1, z.vida * 2.5) * Math.min(1, z.t * 6);
      if (z.tipo === 2) {
        // Mascarilla de pepino: una gota verde en el piso con rodajitas y brillo (la del spa, rosadita alrededor)
        const spa = z.arma === 'spa';
        const c = this.fx.c.salpicadura, b = this.fx.c.brillo, o = this.fx.c.onda;
        this.pisoFx.poner(z.x, z.y, 0.07, z.r * 2.4, z.r * 2.0, 0.5, 0.5, c.u0, c.v0, c.u1, c.v1, 0.55, 0.85, 0.45, 0.8 * vida, 0, 0, 1, z.x * 0.01);
        this.pisoFx.poner(z.x, z.y, 0.075, z.r * 1.5, z.r * 1.2, 0.5, 0.5, b.u0, b.v0, b.u1, b.v1, 0.85, 1, 0.75, 0.45 * vida);
        const f = (t * 1.4 + z.x * 0.01) % 1;
        this.pisoFx.poner(z.x, z.y, 0.08, z.r * 2 * (0.4 + f * 0.8), z.r * 1.7 * (0.4 + f * 0.8), 0.5, 0.5, o.u0, o.v0, o.u1, o.v1, spa ? 1 : 0.8, spa ? 0.75 : 1, spa ? 0.85 : 0.7, (1 - f) * 0.7 * vida);
        const r = this.cuadrosObj.get('rodaja');
        if (r) for (let q = 0; q < 2; q++) {
          const a = t * 0.8 + q * Math.PI + z.y * 0.02;
          this.objetos.poner(z.x + Math.cos(a) * z.r * 0.45, z.y + Math.sin(a) * z.r * 0.35, 3, 20, 20, 0.5, 0.5, r.u0, r.v0, r.u1, r.v1, 1, 1, 1, vida);
        }
        if (Math.random() < 0.15 * this.part.cupo) this.part.crear('gota', CAPA_NORMAL, z.x + (Math.random() - 0.5) * z.r, z.y + (Math.random() - 0.5) * z.r * 0.8, 4, 0, 0, 60, 0.4, 6, 3, 0.62, 0.9, 0.5, 1, 300);
        continue;
      }
      if (z.tipo === 0) {
        // Charco: agua azul con ondas que se abren
        const dorada = z.arma === 'inundacion';
        const c = this.fx.c.brillo;
        this.pisoFx.poner(z.x, z.y, 0.07, z.r * 2.3, z.r * 2.3 * 0.8, 0.5, 0.5, c.u0, c.v0, c.u1, c.v1, 0.35, 0.7, 0.95, 0.55 * vida);
        const o = this.fx.c.onda;
        for (let q = 0; q < 2; q++) {
          const f = (t * 0.8 + q * 0.5 + z.x * 0.01) % 1;
          this.pisoFx.poner(z.x, z.y, 0.08, z.r * 2 * (0.3 + f * 0.8), z.r * 1.6 * (0.3 + f * 0.8), 0.5, 0.5, o.u0, o.v0, o.u1, o.v1, 0.9, 0.97, 1, (1 - f) * 0.8 * vida);
        }
        if (Math.random() < 0.2 * this.part.cupo) this.part.crear('burbuja', CAPA_NORMAL, z.x + (Math.random() - 0.5) * z.r * 1.4, z.y + (Math.random() - 0.5) * z.r, 2, 0, 0, 25, 0.8, 4, 10, 1, 1, 1, 0.9);
        if (dorada && Math.random() < 0.3) this.part.crear('gota', CAPA_NORMAL, z.x + (Math.random() - 0.5) * z.r * 1.6, z.y + (Math.random() - 0.5) * z.r, 4, 0, 0, 80, 0.5, 7, 4, 0.5, 0.8, 1, 1, 300);
      } else {
        // La ducha: casi invisible (Javier: que no estorbe al jugar): una franja de agua apenas insinuada en el piso,
        // hilos que caen muy tenues y unas poquitas gotas; se nota que está, pero no tapa a los mugrosos ni al personaje
        const diluvio = z.arma === 'diluvio';
        const c = this.fx.c.chorro;
        const br = this.fx.c.brillo;
        this.pisoFx.poner(z.x, z.y, 0.09, z.w, z.h, 0.5, 0.5, c.u0, c.v0, c.u1, c.v1, 0.82, 0.95, 1, 0.07 * vida);
        const paso = 92;
        const y0 = Math.floor((this.cy - this.vistaH / 2) / paso) * paso;
        for (let y = y0; y < this.cy + this.vistaH / 2 + paso; y += paso) {
          const ox = Math.sin(y * 0.13 + t * 3) * z.w * 0.15;
          this.fxLuz.poner(z.x + ox, y, 0, z.w * 0.4, 130, 0.5, 1, c.u0, c.v0, c.u1, c.v1, 0.55, 0.75, 0.9, 0.045 * vida);
          this.fxLuz.poner(z.x + ox * 0.6, y - ((t * 340 + y) % paso), 40, 4, 22, 0.5, 0.5, br.u0, br.v0, br.u1, br.v1, 0.85, 0.95, 1, 0.12 * vida);
          if (Math.random() < 0.035 * this.part.cupo) {
            this.part.crear('gota', CAPA_NORMAL, z.x + (Math.random() - 0.5) * z.w, y, 4, (Math.random() - 0.5) * 70, 0, 70, 0.4, 5, 2, 0.7, 0.9, 1, 0.45, 380);
          }
        }
        if (diluvio && Math.random() < 0.3) this.part.crear('onda', CAPA_PISO, z.x + (Math.random() - 0.5) * z.w, z.y + (Math.random() - 0.5) * z.h * 0.6, 0, 0, 0, 0, 0.6, 6, 40, 1, 1, 1, 0.8);
      }
    }
  }

  private dibujarObjetos(m: Motor) {
    const t = this.t;
    const O = this.objetos;
    // Gotitas de experiencia
    for (let i = 0; i < m.gemas.length; i++) {
      const g = m.gemas[i];
      if (!g.vivo) continue;
      if (!this.enVista(g.x, g.y, 30)) continue;
      const c = this.cuadrosObj.get(OBJETO_GEMA[g.tipo]);
      if (!c) continue;
      const tam = g.tipo === 3 ? 34 : g.tipo === 2 ? 24 : g.tipo === 1 ? 20 : 17;
      const flota = 3 + Math.sin(t * 4 + i) * 2.5;
      O.poner(g.x, g.y, flota, tam, tam, 0.5, 0.92, c.u0, c.v0, c.u1, c.v1, 1, 1, 1, 1, 0, 0, 1, 0, Math.max(0, Math.sin(t * 3 + i * 1.7)) * 0.12);
      this.sombra(g.x, g.y, tam * 0.35, 0.3);
      if (g.tipo >= 2 && Math.random() < 0.04 * this.part.cupo) this.part.crear('chispa', CAPA_LUZ, g.x + (Math.random() - 0.5) * 12, g.y, 10 + Math.random() * 14, 0, 0, 20, 0.4, 10, 2, 1, 0.6, 0.7, 1);
    }
    // Cosas del piso
    for (const o of m.objs) {
      if (!o.vivo || !this.enVista(o.x, o.y, 40)) continue;
      const cofre = o.tipo === 'cofre';
      if (o.tipo === 'tesoro') {
        this.tesoro(o.x, o.y, ESCONDIDAS[o.calidad]?.id ?? 'anilloPlata');
        continue;
      }
      const nombre: string = cofre ? 'cofre' : o.tipo;
      const c = this.cuadrosObj.get(nombre);
      if (!c) continue;
      const tam = cofre ? 52 : o.tipo === 'frasco' || o.tipo === 'aspiradora' ? 34 : 30;
      const flota = cofre ? 0 : 4 + Math.sin(t * 3 + o.x) * 3;
      O.poner(o.x, o.y, flota, tam, tam, 0.5, 0.92, c.u0, c.v0, c.u1, c.v1, 1, 1, 1, 1, 0, cofre ? Math.sin(t * 6) * 0.04 : 0, 1, 0, 0);
      this.sombra(o.x, o.y, tam * 0.4, 0.35);
      if (cofre) {
        const b = this.fx.c.brillo;
        // (el cofre de jefe que es de uno solo brilla con el color de su dueño)
        const col = o.dueno >= 0 && this.coloresRgb[o.dueno] ? this.coloresRgb[o.dueno] : o.calidad >= 3 ? [1, 0.5, 0.75] : o.calidad >= 2 ? [1, 0.85, 0.4] : [0.6, 0.85, 1];
        this.pisoFx.poner(o.x, o.y, 0.1, 110, 76, 0.5, 0.5, b.u0, b.v0, b.u1, b.v1, col[0], col[1], col[2], 0.6 + Math.sin(t * 4) * 0.15);
        if (Math.random() < 0.15) this.part.crear('chispa', CAPA_LUZ, o.x + (Math.random() - 0.5) * 40, o.y, 10, 0, 0, 60, 0.7, 12, 3, col[0], col[1], col[2], 1);
      }
    }
  }

  private enVista(x: number, y: number, m: number) {
    return Math.abs(x - this.cx) < this.vistaW / 2 + m && Math.abs(y - this.cy) < this.vistaH / 2 + m + 60;
  }

  private dibujarBichos(m: Motor, dt: number) {
    // Orden de atrás (arriba en la pantalla) hacia adelante
    let n = 0;
    for (let k = 0; k < m.nVivos; k++) {
      const i = m.vivos[k];
      const e = m.en[i];
      if (!e.vivo || !this.enVista(e.x, e.y, 90)) continue;
      this.orden[n] = i;
      this.claves[i] = e.y;
      n++;
      if (n >= this.orden.length) break;
    }
    const ord = this.orden.subarray(0, n);
    ord.sort((a, b) => this.claves[a] - this.claves[b]);
    const t = this.t;
    const luz = LUZ_ESCENARIO[m.esc.id];
    for (let q = 0; q < n; q++) {
      const e = m.en[ord[q]];
      if (e.luz) {
        this.velita(e, luz);
        continue;
      }
      this.bicho(e, t, m);
    }
    // Los que acaban de reventar: se aplastan y se van
    let w = 0;
    for (let q = 0; q < this.nMuertes; q++) {
      const b = q * 6;
      this.muertes[b + 4] += dt;
      const edad = this.muertes[b + 4];
      if (edad > 0.22) continue;
      const ti = this.muertes[b + 2];
      const cs = this.cuadrosBichos.get(ti);
      const id = ID_ENEMIGOS[ti];
      const d = this.datosBichos[id];
      if (cs && d) {
        const k = edad / 0.22;
        const tam = ENEMIGOS[id].tam * d.lado * this.muertes[b + 3] * (ENEMIGOS[id].jefe ? 1 : 1);
        const c = cs[3];
        this.bichos.poner(this.muertes[b], this.muertes[b + 1], 0, tam, tam, d.ancla[0], d.ancla[1], c.u0, c.v0, c.u1, c.v1, 1, 1, 1, 1 - k, 1 - k * 0.5,
          k * 0.9, this.muertes[b + 5]);
      }
      if (w !== q) this.muertes.copyWithin(w * 6, b, b + 6);
      w++;
    }
    this.nMuertes = w;
  }

  private bicho(e: Enemigo, t: number, m: Motor) {
    const cs = this.cuadrosBichos.get(e.ti);
    const d = this.datosBichos[e.tipo];
    if (!cs || !d) return;
    const def = e.def;
    const quieto = e.congelado > 0 || (m.hielo > 0 && def.congelable);
    const golpe = e.flash > 0;
    const fase = e.fase + e.uid * 0.37;
    // Cuadro: golpe > parpadeo (cada tanto) > paso (alternando al caminar)
    let cuadro = 0;
    if (golpe) cuadro = 3;
    else if (!quieto && (fase * 0.7) % 3.3 < 0.13) cuadro = 2;
    else if (!quieto && Math.sin(fase * 9) > 0) cuadro = 1;
    const c = cs[cuadro];
    let tam = def.tam * d.lado * e.esc;
    // Estirar y aplastar al caminar (los brincones brincan)
    let aplastar = quieto ? 0 : Math.sin(fase * 9) * 0.07;
    let alto = 0;
    if (def.comp === 'saltar' && !quieto) {
      const s = (e.fase * 1.6 + e.uid * 0.37) % 1;
      alto = s < 0.45 ? Math.sin((s / 0.45) * Math.PI) * 26 : 0;
      aplastar = s < 0.45 ? -0.12 : 0.1;
    }
    if (e.def.comp === 'enjambre' || e.def.comp === 'revolotear' || e.tipo === 'mosquito') alto = 8 + Math.sin(fase * 5) * 6;
    if (golpe) aplastar = 0.18 * (e.flash / 0.13);
    const voltear = e.vx < -2 ? -1 : 1;
    let r = 1, g = 1, b = 1, brillo = 0;
    if (quieto) {
      r = 0.7;
      g = 0.88;
      b = 1.15;
    }
    if (e.lento > 0) {
      r *= 0.85;
      g *= 0.95;
    }
    if (e.sinDientes) {
      // (la mascarilla lo dejó sin dientes: verdecito)
      r *= 0.82;
      b *= 0.82;
    }
    if (e.elite) {
      // Las élites brillan (borde dorado que palpita)
      brillo = 0.1 + Math.sin(t * 5 + e.uid) * 0.06;
      const bl = this.fx.c.brillo;
      // Aura dorada en el piso, debajo (encima lo lavaría de blanco)
      this.pisoFx.poner(e.x, e.y, 0.11, tam * 1.25, tam * 0.85, 0.5, 0.5, bl.u0, bl.v0, bl.u1, bl.v1, 1, 0.78, 0.25, 0.55 + Math.sin(t * 5 + e.uid) * 0.15);
    }
    if (e.jefe) tam *= 1;
    this.bichos.poner(e.x, e.y, alto, tam, tam, d.ancla[0], d.ancla[1], c.u0, c.v0, c.u1, c.v1, r, g, b, 1, golpe ? e.flash / 0.13 : 0, aplastar, voltear, 0, brillo);
    this.sombra(e.x, e.y, e.r * 1.15, alto > 0 ? 0.25 : 0.38);
    // Barra de vida de los jefes
    if (e.jefe && e.tipo !== 'duchaHelada') this.barra(e.x, e.y + 14, tam * 0.7, e.hp / e.hpMax, [0.9, 0.3, 0.3]);
  }

  private velita(e: Enemigo, nombre: string) {
    const c = this.cuadrosObj.get(nombre);
    if (!c) return;
    const t = this.t;
    this.objetos.poner(e.x, e.y, 0, 40, 40, 0.5, 0.92, c.u0, c.v0, c.u1, c.v1);
    this.sombra(e.x, e.y, 16, 0.35);
    const b = this.fx.c.brillo;
    const parp = 0.5 + Math.sin(t * 13 + e.fase * 20) * 0.08 + Math.sin(t * 7.3 + e.fase) * 0.06;
    this.fxLuz.poner(e.x, e.y - 1, 34, 26, 30, 0.5, 0.5, b.u0, b.v0, b.u1, b.v1, 1, 0.7, 0.35, parp * 0.6);
    this.pisoFx.poner(e.x, e.y, 0.1, 90, 62, 0.5, 0.5, b.u0, b.v0, b.u1, b.v1, 1, 0.82, 0.45, parp * 0.55);
  }

  private dibujarProyectiles(m: Motor) {
    const P = this.proy;
    const F = this.fxNormal, L = this.fxLuz;
    for (let i = 0; i < m.pr.length; i++) {
      const p = m.pr[i];
      if (!p.vivo || !this.enVista(p.x, p.y, 60)) continue;
      if (this.proyectilV2(p, i)) continue;
      const sprite = SPRITE_PROY[p.arma];
      const mini = p.mini ? 0.6 : 1;
      if (sprite) {
        const c = this.cuadrosObj.get(sprite);
        if (!c) continue;
        // (la botellita que vuela trae en `r` el tamaño del charco que va a dejar: ella misma es chiquita)
        const tam = (p.comp === 6 ? 24 : Math.max(22, p.r * 2.8)) * mini;
        let giro = 0, alto = 10;
        if (p.comp === 0) giro = -Math.atan2(p.vy, p.vx);
        else if (p.comp === 5) {
          // Ranita brincando
          const s = (p.t + p.ex) % 0.5;
          alto = s < 0.31 ? Math.sin((s / 0.31) * Math.PI) * 22 : 0;
        } else giro = p.ang;
        if (p.comp === 6) alto = 0;
        P.poner(p.x, p.y, alto, tam, tam, 0.5, 0.5, c.u0, c.v0, c.u1, c.v1, p.mini ? 0.8 : 1, p.mini ? 0.6 : 1, 1, 1, 0, 0, 1, giro);
        this.sombra(p.x, p.y, tam * 0.3, 0.25);
        if (p.arma === 'jabon' || p.arma === 'jabonExplosivo') {
          if (Math.random() < 0.3 * this.part.cupo) this.part.crear('burbuja', CAPA_NORMAL, p.x, p.y, alto, 0, 0, 20, 0.6, 6, 12, 1, 1, 1, 0.9);
        }
        continue;
      }
      switch (p.arma) {
        case 'burbujas':
        case 'burbujero': {
          const c = this.fx.c.burbuja;
          const tam = p.r * 2.6 * mini * (1 + Math.sin(p.t * 18) * 0.06);
          F.poner(p.x, p.y, 12, tam, tam, 0.5, 0.5, c.u0, c.v0, c.u1, c.v1);
          break;
        }
        case 'secador':
        case 'secadorInfernal': {
          const inf = p.arma === 'secadorInfernal';
          const c = inf ? this.fx.c.llama : this.fx.c.aire;
          const ang = Math.atan2(p.vy, p.vx);
          const tam = p.r * (inf ? 3.6 : 3.2) * mini;
          L.poner(p.x, p.y, 14, tam, tam * (inf ? 1 : 0.8), 0.5, 0.5, c.u0, c.v0, c.u1, c.v1, 1, inf ? 0.75 : 0.85, inf ? 0.45 : 0.7, 1, 0, 0, 1,
            inf ? -ang + Math.PI / 2 : -ang);
          if (Math.random() < 0.4 * this.part.cupo) this.part.crear(inf ? 'llama' : 'humo', inf ? CAPA_LUZ : CAPA_NORMAL, p.x, p.y, 14, -p.vx * 0.1, -p.vy * 0.1, 10, 0.35, tam * 0.4, tam * 0.1, 1, 0.8, 0.6, 0.6);
          break;
        }
        case 'perfume':
        case 'colonia':
        case 'perfumeAmor': {
          const c = this.fx.c.perfume;
          const col = p.arma === 'colonia' ? [0.55, 0.8, 1] : [1, 0.65, 0.9];
          L.poner(p.x, p.y, 14, p.r * 4 * mini, p.r * 4 * mini, 0.5, 0.5, c.u0, c.v0, c.u1, c.v1, col[0], col[1], col[2], 1);
          if (Math.random() < 0.35 * this.part.cupo) this.part.crear('chispa', CAPA_LUZ, p.x, p.y, 14, 0, 0, 0, 0.3, 8, 2, col[0], col[1], col[2], 0.9);
          break;
        }
        default: {
          const c = this.fx.c.brillo;
          L.poner(p.x, p.y, 12, p.r * 3, p.r * 3, 0.5, 0.5, c.u0, c.v0, c.u1, c.v1, 1, 1, 1, 0.8);
        }
      }
    }
  }

  /** Los proyectiles de la versión 2 que no son un dibujo quieto: huellitas, mariposas, letras, chorritos y vapor.
   *  Devuelve true si ya lo dibujó. */
  private proyectilV2(p: Motor['pr'][number], i: number): boolean {
    const t = this.t;
    if (p.comp === 9) {
      // Huellita mojada en el piso (se va secando)
      const c = this.fx.c.salpicadura;
      const ang = p.ang;
      const tam = p.r * 1.9;
      this.pisoFx.poner(p.x, p.y, 0.08, tam * 1.5, tam * 0.85, 0.5, 0.5, c.u0, c.v0, c.u1, c.v1, 0.62, 0.84, 1, 0.75, 0, 0, 1, -ang);
      const o = this.fx.c.brillo;
      this.pisoFx.poner(p.x, p.y, 0.09, tam * 2.2, tam * 1.4, 0.5, 0.5, o.u0, o.v0, o.u1, o.v1, 0.5, 0.75, 1, 0.3 + Math.sin(t * 6 + i) * 0.08, 0, 0, 1, -ang);
      return true;
    }
    switch (p.arma) {
      case 'mariposas':
      case 'mariposario': {
        // Mariposa aleteando (se voltea según para dónde va)
        const c = this.cuadrosObj.get(p.arma === 'mariposario' && i % 3 === 0 ? 'mariposario' : 'mariposas');
        if (!c) return true;
        const ala = 0.45 + 0.55 * Math.abs(Math.sin(t * 16 + i * 1.7));
        const tam = Math.max(26, p.r * 2.8);
        this.proy.poner(p.x, p.y, 24 + Math.sin(t * 5 + i) * 6, tam * ala, tam, 0.5, 0.5, c.u0, c.v0, c.u1, c.v1, 1, 1, 1, 1, 0, 0, p.vx < 0 ? -1 : 1);
        this.sombra(p.x, p.y, tam * 0.25, 0.18);
        return true;
      }
      case 'letrasEspuma':
      case 'abecedario': {
        // Letras de espuma: más transparentes subiendo (todavía no pegan)
        const c = this.cuadrosObj.get(LETRAS[i % 3]);
        if (!c) return true;
        const tam = Math.max(28, p.r * 2.9);
        const a = p.vy < 0 ? 0.55 : 1;
        const tinte = p.arma === 'abecedario' ? COLOR_LUCES[1 + (i % 4)] : [1, 1, 1];
        this.proy.poner(p.x, p.y, 16, tam, tam, 0.5, 0.5, c.u0, c.v0, c.u1, c.v1, tinte[0], tinte[1], tinte[2], a, 0, 0, 1, p.ang);
        if (p.vy > 0 && Math.random() < 0.2 * this.part.cupo) this.part.crear('burbuja', CAPA_NORMAL, p.x, p.y, 16, 0, 0, 10, 0.5, 5, 10, 1, 1, 1, 0.8);
        return true;
      }
      case 'pistolaAgua':
      case 'hidrolavadora': {
        const c = this.fx.c.gota;
        const ang = Math.atan2(p.vy, p.vx);
        const tam = Math.min(18, p.r * 2.2);
        this.fxNormal.poner(p.x, p.y, 12, tam, tam * 1.5, 0.5, 0.5, c.u0, c.v0, c.u1, c.v1, 0.5, 0.78, 1, 0.95, 0, 0, 1, -ang + Math.PI / 2);
        if (Math.random() < 0.25 * this.part.cupo) this.part.crear('gota', CAPA_NORMAL, p.x, p.y, 12, -p.vx * 0.05, -p.vy * 0.05, 20, 0.25, 4, 2, 0.6, 0.85, 1, 0.8, 300);
        return true;
      }
      case 'pececitos':
      case 'peceraInfinita': {
        // El pececito mira para donde nada y mueve la cola
        const c = this.cuadrosObj.get(p.arma);
        if (!c) return true;
        const tam = Math.max(26, p.r * 2.6);
        const der = p.vx >= 0;
        const ang = Math.atan2(p.vy, Math.abs(p.vx)) * (der ? -1 : 1);
        this.proy.poner(p.x, p.y, 14, tam, tam * (0.92 + Math.sin(t * 14 + i) * 0.08), 0.5, 0.5, c.u0, c.v0, c.u1, c.v1, 1, 1, 1, 1, 0, 0, der ? 1 : -1, ang);
        if (Math.random() < 0.15 * this.part.cupo) this.part.crear('burbuja', CAPA_NORMAL, p.x, p.y, 14, 0, 0, 30, 0.5, 4, 8, 1, 1, 1, 0.8);
        return true;
      }
      case 'barquito': {
        const c = this.cuadrosObj.get('barquito');
        if (!c) return true;
        const tam = Math.max(40, p.r * 3.2);
        this.proy.poner(p.x, p.y, 6 + Math.sin(t * 6 + i) * 3, tam, tam, 0.5, 0.7, c.u0, c.v0, c.u1, c.v1, 1, 1, 1, 1, 0, 0, p.vx < 0 ? -1 : 1, Math.sin(t * 5 + i) * 0.12);
        const o = this.fx.c.onda;
        this.pisoFx.poner(p.x, p.y, 0.08, tam * 1.3, tam * 0.6, 0.5, 0.5, o.u0, o.v0, o.u1, o.v1, 0.7, 0.9, 1, 0.5);
        if (Math.random() < 0.4 * this.part.cupo) this.part.crear('gota', CAPA_NORMAL, p.x - Math.sign(p.vx) * tam * 0.4, p.y, 4, -p.vx * 0.2, (Math.random() - 0.5) * 40, 60, 0.35, 5, 3, 0.65, 0.88, 1, 0.9, 300);
        return true;
      }
      case 'talco': {
        // Florecita de talco: cinco pétalos que giran
        const c = this.fx.c.petalo;
        const r = Math.max(8, p.r) * 0.9;
        for (let q = 0; q < 5; q++) {
          const a = p.ang + (q / 5) * Math.PI * 2;
          this.fxNormal.poner(p.x + Math.cos(a) * r * 0.55, p.y + Math.sin(a) * r * 0.45, 12, r * 1.3, r * 0.9, 0.5, 0.5, c.u0, c.v0, c.u1, c.v1, 1, 0.82, 0.9, 1, 0, 0, 1, -a);
        }
        const b = this.fx.c.brillo;
        this.fxNormal.poner(p.x, p.y, 13, r * 0.7, r * 0.7, 0.5, 0.5, b.u0, b.v0, b.u1, b.v1, 1, 0.92, 0.5, 1);
        if (Math.random() < 0.3 * this.part.cupo) this.part.crear('polvo', CAPA_NORMAL, p.x, p.y, 12, 0, 0, 10, 0.6, 6, 18, 1, 1, 1, 0.5);
        return true;
      }
      case 'bolitasGel': {
        const c = this.fx.c.burbuja;
        const col = COLOR_GEL[i % COLOR_GEL.length];
        const tam = Math.max(16, p.r * 2.6);
        this.fxNormal.poner(p.x, p.y, 14, tam, tam, 0.5, 0.5, c.u0, c.v0, c.u1, c.v1, col[0], col[1], col[2], 1);
        this.sombra(p.x, p.y, tam * 0.3, 0.2);
        return true;
      }
      case 'vaporizador':
      case 'sauna': {
        if (p.comp !== 11) return false;
        // Nubecita de vapor hirviendo (la sauna, un poquito anaranjada)
        const c = this.fx.c.humo;
        const tam = p.r * 2.6;
        const sauna = p.arma === 'sauna';
        this.fxNormal.poner(p.x, p.y, 14, tam, tam * 0.85, 0.5, 0.5, c.u0, c.v0, c.u1, c.v1, sauna ? 1 : 0.92, sauna ? 0.86 : 0.96, sauna ? 0.78 : 1, 0.32, 0, 0, 1, i);
        if (sauna) {
          const b = this.fx.c.brillo;
          this.fxLuz.poner(p.x, p.y, 14, tam * 0.5, tam * 0.45, 0.5, 0.5, b.u0, b.v0, b.u1, b.v1, 1, 0.5, 0.3, 0.08);
        }
        return true;
      }
    }
    return false;
  }

  /** Lo que el jugador tiene alrededor: espuma, esponjas, paticos, el perfume del amor. */
  private dibujarArmas(m: Motor) {
    const t = this.t;
    for (const j of m.jug) {
      if (j.caido) continue;
      for (const a of j.armas) {
        const def = ARMAS[a.id];
        if (def.comp === 'ajo') {
          const devora = a.id === 'espumaDevoradora';
          const r = (def.base.radio * a.b.area * (1 + j.st.area)) + (devora ? a.k : 0);
          const b = this.fx.c.brillo;
          this.pisoFx.poner(j.x, j.y, 0.1, r * 2.3, r * 2.3 * 0.8, 0.5, 0.5, b.u0, b.v0, b.u1, b.v1, devora ? 0.95 : 0.85, devora ? 0.8 : 0.95, 1, 0.35);
          const e = this.fx.c.espuma;
          const n = Math.max(8, Math.round(r / 7));
          for (let q = 0; q < n; q++) {
            const ang = (q / n) * Math.PI * 2 + t * 0.6;
            const tam = 16 + Math.sin(t * 3 + q * 1.7) * 4;
            this.fxNormal.poner(j.x + Math.cos(ang) * r * 0.95, j.y + Math.sin(ang) * r * 0.8, 2, tam, tam, 0.5, 0.7, e.u0, e.v0, e.u1, e.v1, devora ? 1 : 1, devora ? 0.88 : 1, devora ? 0.95 : 1, 0.92);
          }
          if (Math.random() < 0.25 * this.part.cupo) {
            const ang = Math.random() * Math.PI * 2, rr = Math.random() * r;
            this.part.crear('burbuja', CAPA_NORMAL, j.x + Math.cos(ang) * rr, j.y + Math.sin(ang) * rr * 0.8, 6, 0, 0, 40, 0.7, 5, 11, 1, 1, 1, 0.9);
          }
        } else if (def.comp === 'biblia') {
          if (a.activo <= 0 && a.b.dur < 9000) continue;
          const area = a.b.area * (1 + j.st.area);
          const R = 70 * Math.sqrt(area) + 8;
          const c = this.cuadrosObj.get('esponjas');
          if (!c) continue;
          const tam = Math.max(30, def.base.radio * area * 2.4);
          const sale = a.b.dur < 9000 ? Math.min(1, a.activo * 4) : 1;
          for (let q = 0; q < a.total; q++) {
            const ang = a.ang + (q / a.total) * Math.PI * 2;
            const x = j.x + Math.cos(ang) * R, y = j.y + Math.sin(ang) * R * 0.85;
            this.proy.poner(x, y, 14, tam * sale, tam * sale, 0.5, 0.5, c.u0, c.v0, c.u1, c.v1, 1, 1, 1, 1, 0, Math.sin(t * 10 + q) * 0.08, 1, Math.sin(ang * 2) * 0.3);
            this.sombra(x, y, tam * 0.3, 0.25);
            if (a.id === 'esponjasEternas') {
              const b = this.fx.c.brillo;
              this.fxLuz.poner(x, y, 14, tam * 1.6, tam * 1.6, 0.5, 0.5, b.u0, b.v0, b.u1, b.v1, 1, 0.9, 0.5, 0.25);
            }
            if (Math.random() < 0.2 * this.part.cupo) this.part.crear('espuma', CAPA_NORMAL, x, y, 12, 0, 0, 10, 0.5, 8, 2, 1, 1, 1, 0.8);
          }
        } else if (def.comp === 'pajaro') {
          const dos = a.id === 'patosEnamorados';
          const radio = Math.min(j.vistaW, j.vistaH) * 0.36;
          const angs = dos ? [a.ang, Math.PI - a.ang] : [a.id === 'patoMorado' ? -a.ang : a.ang];
          angs.forEach((ang, q) => {
            const x = j.x + Math.cos(ang) * radio * 1.25, y = j.y + Math.sin(ang) * radio * 0.8;
            const nombre = dos ? (q ? 'patoMorado' : 'patoAmarillo') : a.id;
            const c = this.cuadrosObj.get(nombre);
            if (!c) return;
            const tam = dos ? 46 : 38;
            const vx = -Math.sin(ang) * (a.id === 'patoMorado' || q ? -1 : 1);
            this.proy.poner(x, y, 60 + Math.sin(t * 4 + q) * 8, tam, tam, 0.5, 0.5, c.u0, c.v0, c.u1, c.v1, 1, 1, 1, 1, 0, Math.sin(t * 12) * 0.06, vx < 0 ? -1 : 1);
            this.sombra(x, y, 14, 0.2);
            if (dos && Math.random() < 0.1) this.part.crear('corazon', CAPA_NORMAL, x, y, 70, 0, 0, 30, 0.8, 10, 14, 1, 1, 1, 1);
          });
        } else if (def.comp === 'cortina') {
          if (a.k < 1) continue;
          // Una burbuja de cortina alrededor: azul con una carga, verde con dos, dorada con tres (roja la de terciopelo)
          const terciopelo = a.id === 'cortinaTerciopelo';
          const col = terciopelo ? [1, 0.45, 0.55] : a.k >= 3 ? [1, 0.95, 0.6] : a.k >= 2 ? [0.65, 1, 0.75] : [0.65, 0.85, 1];
          const c = this.fx.c.burbuja;
          const tam = 84 + Math.sin(t * 3) * 3;
          this.fxNormal.poner(j.x, j.y, 26, tam, tam * 1.05, 0.5, 0.5, c.u0, c.v0, c.u1, c.v1, col[0], col[1], col[2], 0.55);
          const o = this.fx.c.anillo;
          this.pisoFx.poner(j.x, j.y, 0.1, 76, 54, 0.5, 0.5, o.u0, o.v0, o.u1, o.v1, col[0], col[1], col[2], 0.6);
        } else if (def.comp === 'laser') {
          const area = a.b.area * (1 + j.st.area);
          const largo = 230 * area;
          const c = this.fx.c.brillo;
          for (let q = 0; q < a.total; q++) {
            const ang = a.ang + (q / a.total) * Math.PI * 2;
            const mx = j.x + Math.cos(ang) * largo * 0.5, my = j.y - 8 + Math.sin(ang) * largo * 0.5;
            this.pisoFx.poner(mx, my, 0.12, largo, def.base.radio * area * 3, 0.5, 0.5, c.u0, c.v0, c.u1, c.v1, 1, 0.6, 0.85, 0.8, 0, 0, 1, -ang);
            if (Math.random() < 0.2 * this.part.cupo) {
              const d = Math.random() * largo;
              this.part.crear('chispa', CAPA_LUZ, j.x + Math.cos(ang) * d, j.y + Math.sin(ang) * d, 6, 0, 0, 20, 0.4, 10, 2, 1, 0.7, 0.9, 1);
            }
          }
        }
      }
    }
  }

  /** Toallazos, rayos y hilos dentales que duran un instante. */
  private dibujarTrazos(dt: number) {
    const tr = this.fx.c.trazo;
    for (let q = 0; q < 24; q++) {
      const b = q * 7;
      if (this.trazos[b + 3] <= 0) continue;
      this.trazos[b + 5] += dt;
      const edad = this.trazos[b + 5];
      if (edad > 0.28) {
        this.trazos[b + 3] = 0;
        continue;
      }
      const k = edad / 0.28;
      const lado = this.trazos[b + 2], largo = this.trazos[b + 3], alto = this.trazos[b + 4];
      const tipo = this.trazos[b + 6];
      const x = this.trazos[b] + lado * (largo * 0.5 + 6);
      const crece = Math.min(1, k * 4);
      // (toalla rosada, toallazo hirviendo, máquina plateada, afeitada plateada con filo dorado)
      const col = tipo === 1 ? [1, 0.5, 0.38] : tipo === 2 ? [0.72, 0.86, 1] : tipo === 3 ? [1, 0.86, 0.55] : [0.98, 0.62, 0.74];
      this.fxNormal.poner(x, this.trazos[b + 1], 14, largo * crece, alto * 1.7, 0.5, 0.5, tr.u0, tr.v0, tr.u1, tr.v1, col[0], col[1], col[2], (1 - k) * 0.85, 0, 0, lado);
      this.fxNormal.poner(x, this.trazos[b + 1], 16, largo * crece * 0.8, alto * 0.7, 0.5, 0.5, tr.u0, tr.v0, tr.u1, tr.v1, 1, 0.95, 0.97, (1 - k) * 0.55, 0, 0, lado);
    }
    const ry = this.fx.c.rayo;
    for (let q = 0; q < 32; q++) {
      const b = q * 5;
      if (this.rayos[b + 2] <= 0) continue;
      this.rayos[b + 3] += dt;
      const edad = this.rayos[b + 3];
      if (edad > 0.25) {
        this.rayos[b + 2] = 0;
        continue;
      }
      const a = 1 - edad / 0.25;
      const tipo = this.rayos[b + 4];
      if (tipo === 2) {
        // Rayito de brillantina: delgado, rosado y dorado
        this.fxLuz.poner(this.rayos[b], this.rayos[b + 1], 0, 26, 300, 0.5, 1, ry.u0, ry.v0, ry.u1, ry.v1, 1, 0.55, 0.9, a);
        this.fxLuz.poner(this.rayos[b], this.rayos[b + 1], 0, 12, 300, 0.5, 1, ry.u0, ry.v0, ry.u1, ry.v1, 1, 0.92, 0.6, a);
        continue;
      }
      const tormenta = tipo > 0;
      this.fxLuz.poner(this.rayos[b], this.rayos[b + 1], 0, 50 + this.rayos[b + 2] * 0.5, 360, 0.5, 1, ry.u0, ry.v0, ry.u1, ry.v1, tormenta ? 0.8 : 1, tormenta ? 0.85 : 0.95, 1, a);
    }
    const br = this.fx.c.brillo;
    for (let q = 0; q < 24; q++) {
      const b = q * 7;
      if (this.haces[b + 3] <= 0) continue;
      this.haces[b + 5] += dt;
      const edad = this.haces[b + 5];
      if (edad > 0.3) {
        this.haces[b + 3] = 0;
        continue;
      }
      const a = 1 - edad / 0.3;
      const ang = this.haces[b + 2], largo = this.haces[b + 3], ancho = this.haces[b + 4];
      const mx = this.haces[b] + Math.cos(ang) * largo * 0.5, my = this.haces[b + 1] + Math.sin(ang) * largo * 0.5;
      const seda = this.haces[b + 6] > 0;
      this.pisoFx.poner(mx, my, 0.15, largo, ancho * 2.2, 0.5, 0.5, br.u0, br.v0, br.u1, br.v1, seda ? 1 : 0.85, seda ? 0.9 : 0.97, seda ? 0.6 : 1, a, 0, 0, 1, -ang);
      this.fxLuz.poner(mx, my, 10, largo, 3 + ancho * 0.3, 0.5, 0.5, br.u0, br.v0, br.u1, br.v1, 1, 1, 1, a * 0.9, 0, 0, 1, 0);
    }
    this.dibujarTajos(dt);
  }

  /** Planchazos, cepillos de espalda cayendo y rayitas del espejo LED. */
  private dibujarTajos(dt: number) {
    const tr = this.fx.c.trazo, br = this.fx.c.brillo;
    const T = this.tajos;
    for (let q = 0; q < 32; q++) {
      const b = q * 7;
      if (T[b + 2] <= 0) continue;
      T[b + 4] += dt;
      const edad = T[b + 4], tipo = T[b + 5];
      const dur = tipo === 2 ? 0.38 : 0.26;
      if (edad > dur) {
        T[b + 2] = 0;
        continue;
      }
      const k = edad / dur, a = (1 - k) * 0.95, crece = Math.min(1, k * 5);
      if (tipo === 2) {
        // El remate: un planchazo enorme de arriba a abajo
        const alto = T[b + 2], ancho = T[b + 6];
        this.pisoFx.poner(T[b], T[b + 1], 0.16, alto * crece, ancho * 1.6, 0.5, 0.5, tr.u0, tr.v0, tr.u1, tr.v1, 1, 0.85, 0.55, a, 0, 0, 1, Math.PI / 2);
        this.fxLuz.poner(T[b], T[b + 1], 20, ancho * 0.5, alto * 0.75 * crece, 0.5, 0.5, br.u0, br.v0, br.u1, br.v1, 1, 0.95, 0.85, a * 0.8);
        continue;
      }
      // Un tajo en medialuna (la plancha rosada; la de diva, dorada; el contraataque, rojo)
      const r = T[b + 2], ang = T[b + 3];
      const col = tipo === 1 ? [1, 0.82, 0.45] : tipo === 3 ? [1, 0.4, 0.45] : [1, 0.55, 0.85];
      this.fxNormal.poner(T[b], T[b + 1], 14, r * 2.3 * crece, r * 0.75, 0.5, 0.5, tr.u0, tr.v0, tr.u1, tr.v1, col[0], col[1], col[2], a, 0, 0, 1, ang);
      this.fxNormal.poner(T[b], T[b + 1], 15, r * 1.9 * crece, r * 0.3, 0.5, 0.5, tr.u0, tr.v0, tr.u1, tr.v1, 1, 1, 1, a * 0.8, 0, 0, 1, ang);
    }
    const L = this.lanzas;
    for (let q = 0; q < 24; q++) {
      const b = q * 6;
      if (L[b + 2] <= 0) continue;
      L[b + 4] += dt;
      const edad = L[b + 4], demora = L[b + 3];
      if (edad > demora) {
        L[b + 2] = 0;
        continue;
      }
      // Cae del cielo dando vueltas, con su sombra que crece en el piso
      const k = edad / Math.max(0.05, demora);
      const c = this.cuadrosObj.get(L[b + 5] ? 'cepilloCeleste' : 'cepilloEspalda');
      const z = (1 - k) * (1 - k) * 320;
      if (c) this.proy.poner(L[b], L[b + 1], z, 46, 46, 0.5, 0.2, c.u0, c.v0, c.u1, c.v1, 1, 1, 1, Math.min(1, k * 4), 0, 0, 1, Math.PI * 0.85 + k * 0.3);
      this.sombra(L[b], L[b + 1], L[b + 2] * (0.3 + k * 0.7), 0.15 + k * 0.3);
    }
    const C = this.cohetes;
    for (let q = 0; q < 24; q++) {
      const b = q * 6;
      if (C[b + 4] <= 0) continue;
      C[b + 5] += dt;
      const k = C[b + 5] / C[b + 4];
      if (k >= 1) {
        C[b + 4] = 0;
        continue;
      }
      // Sube en curva (más alto en el medio) dejando una estela de chispitas
      const x = C[b] + (C[b + 2] - C[b]) * k, y = C[b + 1] + (C[b + 3] - C[b + 1]) * k;
      const z = Math.sin(k * Math.PI) * 120 + 20;
      this.fxLuz.poner(x, y, z, 16, 16, 0.5, 0.5, br.u0, br.v0, br.u1, br.v1, 1, 0.85, 0.6, 1);
      if (Math.random() < 0.8 * this.part.cupo) this.part.crear('chispa', CAPA_LUZ, x, y, z, 0, 0, -20, 0.35, 8, 2, 1, 0.75, 0.5, 1);
    }
    const R = this.rayitas;
    for (let q = 0; q < 64; q++) {
      const b = q * 7;
      if (R[b + 2] <= 0) continue;
      R[b + 6] += dt;
      const edad = R[b + 6];
      if (edad > 0.24) {
        R[b + 2] = 0;
        continue;
      }
      const a = 1 - edad / 0.24, abre = Math.min(1, edad * 18);
      const c = COLOR_LUCES[R[b + 5]] ?? COLOR_LUCES[0];
      const giro = R[b + 4] ? Math.PI / 2 : 0;
      const tr = this.fx.c.trazo;
      this.pisoFx.poner(R[b], R[b + 1], 0.17, R[b + 2] * abre, R[b + 3] * 4.5, 0.5, 0.5, br.u0, br.v0, br.u1, br.v1, c[0], c[1], c[2], a, 0, 0, 1, giro);
      this.pisoFx.poner(R[b], R[b + 1], 0.18, R[b + 2] * abre, R[b + 3] * 1.6, 0.5, 0.5, tr.u0, tr.v0, tr.u1, tr.v1, c[0], c[1], c[2], a, 0, 0, 1, giro);
      this.pisoFx.poner(R[b], R[b + 1], 0.19, R[b + 2] * abre * 0.9, R[b + 3] * 0.6, 0.5, 0.5, tr.u0, tr.v0, tr.u1, tr.v1, 1, 1, 1, a * 0.9, 0, 0, 1, giro);
    }
  }

  private dibujarNumeros(dt: number) {
    const N = this.numeros;
    for (let q = 0; q < this.nNums; q++) {
      const b = q * 5;
      this.nums[b + 3] += dt;
      const edad = this.nums[b + 3];
      if (edad > 0.7) continue;
      const v = this.nums[b + 2];
      const tipo = this.nums[b + 4];
      const texto = String(v);
      const pop = edad < 0.1 ? 1 + (1 - edad / 0.1) * 0.6 : 1;
      // Chiquitos como en el original (si no, cientos de golpes tapan todo)
      const tam = (tipo === 1 ? 15 : tipo === 2 ? 17 : tipo === 0 ? 10.5 : 12) * pop;
      const a = Math.min(1, (0.7 - edad) * 5);
      const col = tipo === 1 ? [1, 0.85, 0.25] : tipo === 2 ? [1, 0.35, 0.3] : tipo === 3 ? [0.5, 1, 0.55] : tipo === 4 ? [1, 0.82, 0.3] : [1, 1, 1];
      let w = 0;
      for (const ch of texto) w += this.num.ancho[ch.charCodeAt(0) - 48] ?? 0.6;
      let x = this.nums[b] - (w * tam) / 2;
      const y = this.nums[b + 1];
      const alto = 40 + edad * 50;
      const lista = tipo === 3 || tipo === 4 ? '+' + texto : texto;
      for (const ch of lista) {
        const d = ch === '+' ? 10 : ch.charCodeAt(0) - 48;
        const c = this.num.d[d];
        const an = this.num.ancho[d] ?? 0.6;
        if (!c) continue;
        N.poner(x + (an * tam) / 2, y, alto, tam, tam * 1.25, 0.5, 0.5, c.u0, c.v0, c.u1, c.v1, col[0], col[1], col[2], a);
        x += an * tam * 0.9;
      }
    }
  }

  private barra(x: number, y: number, ancho: number, k: number, col: [number, number, number]) {
    const c = this.fx.c.cruz;
    // El centro de la cruz es blanco: se usa como pixel sólido
    const u = (c.u0 + c.u1) / 2, v = (c.v0 + c.v1) / 2;
    this.pisoFx.poner(x, y, 0.2, ancho + 4, 9, 0.5, 0.5, u, v, u, v, 0.15, 0.1, 0.1, 0.7);
    this.pisoFx.poner(x - ancho / 2 + (ancho * Math.max(0, k)) / 2, y, 0.21, ancho * Math.max(0, k), 5, 0.5, 0.5, u, v, u, v, col[0], col[1], col[2], 1);
  }

  private barraVida(j: Jugador) {
    if (j.caido) return;
    const k = j.vida / j.vidaMax;
    this.barra(j.x, j.y + 16, 46, k, k < 0.3 ? [0.95, 0.3, 0.3] : [0.35, 0.85, 0.5]);
  }

  private burbujaCaido(j: Jugador) {
    const c = this.fx.c.burbuja;
    const t = this.t;
    const tam = 90 + Math.sin(t * 3) * 4;
    this.fxNormal.poner(j.x, j.y, 10 + Math.sin(t * 2) * 6, tam, tam, 0.5, 0.75, c.u0, c.v0, c.u1, c.v1, 1, 1, 1, 0.95);
    if (j.rescate > 0) {
      const o = this.fx.c.anillo;
      this.pisoFx.poner(j.x, j.y, 0.3, 100 * j.rescate + 20, 80 * j.rescate + 16, 0.5, 0.5, o.u0, o.v0, o.u1, o.v1, 1, 0.6, 0.8, 1);
    }
  }

  liberar() {
    for (const p of this.jugadores) p?.liberar();
    for (const l of [this.sombras, this.pisoFx, this.objetos, this.bichos, this.proy, this.fxNormal, this.fxLuz, this.numeros]) l?.liberar();
    this.suelo?.liberar();
    for (const t of this.texturas) t.dispose();
    (this.escena.environment as THREE.Texture | null)?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}

export type { IdObjeto };
