// Capítulo 9 · Entre las estrellas (puertas 81–90): unir las estrellas en corazón, gravedad cero inclinando,
// ordenar los planetas, sintonizar la radio, el Morse que vibra, voltear el celular, asteroides a punta de toques,
// los tubos de energía, los tres segundos del cohete y el eclipse.
import * as THREE from 'three';
import * as sonido from '../../sonido';
import { espacioTextura } from '../cuarto';
import { caja, cilindro, en, esfera, grupo, letrero, mat, matNuevo, textoEn, toro } from '../kit';
import type { Ctx, Nivel } from '../nivel';
import { Canica, limites, llave, planoPared, type Tabla, reservar } from './piezas';

function llaveParaLaPuerta(c: Ctx, k: THREE.Object3D, puede: () => boolean = () => true) {
  c.tocar(k, () => {
    if (puede()) c.dar('llave', k);
  });
  c.conLlave();
}

function abrirYa(c: Ctx, ms = 800) {
  c.bien();
  c.puerta.bloqueada = false;
  c.despues(ms, () => c.resolver());
}

const toque = (r: number, nombre?: string) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  if (nombre) m.name = nombre;
  return m;
};

/** Pantalla de la nave en la pared (fondo de espacio con marco). */
function pantallaEspacio(c: Ctx, x: number, y: number, w: number, h: number, nombre = 'pantalla') {
  const t = espacioTextura(512, Math.round((512 * h) / w), true);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t }));
  p.name = nombre;
  en(p, x, y, 0.02);
  c.g.add(p);
  const m = mat('#5a6478', { metal: 0.6, rough: 0.35 });
  c.g.add(en(caja(w + 0.1, 0.05, 0.05, m, 0.01), x, y + h / 2 + 0.02, 0.03), en(caja(w + 0.1, 0.05, 0.05, m, 0.01), x, y - h / 2 - 0.02, 0.03));
  c.g.add(en(caja(0.05, h + 0.1, 0.05, m, 0.01), x - w / 2 - 0.02, y, 0.03), en(caja(0.05, h + 0.1, 0.05, m, 0.01), x + w / 2 + 0.02, y, 0.03));
  return p;
}

function estrellita(nombre: string, color = '#fff6d0') {
  const g = grupo(nombre);
  const nucleo = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), new THREE.MeshBasicMaterial({ color }));
  const halo = new THREE.Mesh(new THREE.CircleGeometry(0.06, 20), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, depthWrite: false }));
  g.add(nucleo, halo);
  g.userData.halo = halo;
  return g;
}

// ---------------------------------------------------------------------------
// 81 · La constelación
// ---------------------------------------------------------------------------
const constelacion: Nivel = {
  titulo: 'La constelación',
  pistas: [
    'Ese cielo tiene un dibujo escondido.',
    'Algunas estrellas brillan más que otras y forman una figura. Se unen pasando el dedo sin soltarlo.',
    'Traza la figura pasando por las estrellas más brillantes, una tras otra, sin tocar las de más; si te equivocas, suelta y empieza otra vez.',
  ],
  montar(c) {
    const C = new THREE.Vector3(1.85, 1.42, 0.05);
    pantallaEspacio(c, C.x, C.y, 1.9, 1.45);
    const N = 8;
    const corazon = Array.from({ length: N }, (_, i) => {
      const t = (i / N) * Math.PI * 2;
      const x = 16 * Math.sin(t) ** 3, y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      return new THREE.Vector3(C.x + x * 0.05, C.y + 0.12 + y * 0.042, C.z + 0.02);
    });
    const buenas = corazon.map((p, i) => {
      const e = estrellita(`estrella ${i}`, '#fff6d0');
      e.scale.setScalar(1.25);
      e.position.copy(p);
      c.g.add(e);
      return e;
    });
    const otras: THREE.Object3D[] = [];
    for (let i = 0; otras.length < 9 && i < 200; i++) {
      const p = new THREE.Vector3(C.x + (c.azar() - 0.5) * 1.75, C.y + (c.azar() - 0.5) * 1.3, C.z + 0.02);
      if (corazon.some((q) => q.distanceTo(p) < 0.28) || otras.some((o) => o.position.distanceTo(p) < 0.2)) continue;
      const e = estrellita(`estrella falsa ${otras.length}`, '#cfe0ff');
      e.scale.setScalar(0.8);
      e.position.copy(p);
      c.g.add(e);
      otras.push(e);
    }
    const lineaMat = new THREE.LineBasicMaterial({ color: '#ffd8e6' });
    let linea: THREE.Line | null = null;
    let cadena: THREE.Object3D[] = [];
    let hecho = false, malo = false;
    const dibujar = () => {
      linea?.removeFromParent();
      if (cadena.length < 2) return;
      linea = new THREE.Line(new THREE.BufferGeometry().setFromPoints(cadena.map((o) => o.position.clone().setZ(C.z + 0.015))), lineaMat);
      c.g.add(linea);
    };
    const reiniciar = () => {
      cadena = [];
      malo = false;
      lineaMat.color.set('#ffd8e6');
      dibujar();
      buenas.forEach((b) => ((b.userData.halo.material as THREE.MeshBasicMaterial).opacity = 0.25));
    };
    c.gesto.mover((x, y, abajo) => {
      if (!abajo || hecho) return;
      // La estrella más cercana al dedo (si está cerca)
      let e: THREE.Object3D | null = null, mejor = 22;
      for (const o of [...buenas, ...otras]) {
        const s = c.escena.aPantalla(o.position);
        const d = Math.hypot(s.x - x, s.y - y);
        if (d < mejor) [mejor, e] = [d, o];
      }
      if (e) {
        if (cadena[cadena.length - 1] === e) return;
        if (otras.includes(e)) {
          if (!malo) {
            malo = true;
            lineaMat.color.set('#ff6a7a');
            sonido.nota(200, 0.1, 0, 'square', 0.04);
          }
          return;
        }
        if (cadena.includes(e) && !(e === cadena[0] && cadena.length === N)) return;
        cadena.push(e);
        (e.userData.halo.material as THREE.MeshBasicMaterial).opacity = 0.7;
        sonido.nota(660 + cadena.length * 60, 0.08, 0, 'sine', 0.05);
        dibujar();
        return;
      }
    });
    c.gesto.dedos((n) => {
      if (n !== 0 || hecho) return;
      const unicas = new Set(cadena);
      if (!malo && unicas.size === N) {
        hecho = true;
        if (cadena[cadena.length - 1] !== cadena[0]) cadena.push(cadena[0]);
        dibujar();
        lineaMat.color.set('#fff6d0');
        buenas.forEach((b) => b.scale.setScalar(1.8));
        buenas[0].userData.lista = true;
        sonido.nota(1318, 0.5, 0, 'sine', 0.08);
        abrirYa(c, 1500);
      } else if (cadena.length) {
        if (cadena.length > 2) c.mal();
        reiniciar();
      }
    });
    c.cada((_, t) => [...buenas, ...otras].forEach((e, i) => (e.userData.halo.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.15))));
  },
  async prueba(p) {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 8; i++) {
      const s = p.pantalla(`estrella ${i % 8}`);
      pts.push([s.x / innerWidth, s.y / innerHeight]);
    }
    await p.trazar(pts, 2400);
  },
};

// ---------------------------------------------------------------------------
// 82 · Gravedad cero
// ---------------------------------------------------------------------------
const ZERO: Tabla = { w: 1.4, h: 1.0, solidos: [[0.3, 0, 0.4, 0.65], [0.7, 0.35, 0.8, 1.0], [1.0, 0, 1.1, 0.6]] };
const gravedad: Nivel = {
  titulo: 'Gravedad cero',
  pistas: [
    'Aquí nada se queda quieto.',
    'La llave flota hacia donde se incline el celular. Tiene que llegar a la cerradura de la derecha.',
    'Esquiva la chatarra: sube, baja y avanza inclinando el celular con calma, sin chocar.',
  ],
  montar(c) {
    const x0 = 1.15, y0 = 0.85;
    const tablero = grupo('tablero');
    en(tablero, x0, y0, 0.06);
    c.g.add(tablero);
    const fondo = new THREE.Mesh(new THREE.PlaneGeometry(ZERO.w + 0.1, ZERO.h + 0.1), new THREE.MeshBasicMaterial({ map: espacioTextura(512, 380, false) }));
    en(fondo, ZERO.w / 2, ZERO.h / 2, -0.03);
    tablero.add(fondo);
    const borde = mat('#5a6478', { metal: 0.6, rough: 0.35 });
    tablero.add(en(caja(ZERO.w + 0.14, 0.05, 0.06, borde, 0.01), ZERO.w / 2, -0.04, 0), en(caja(ZERO.w + 0.14, 0.05, 0.06, borde, 0.01), ZERO.w / 2, ZERO.h + 0.04, 0));
    tablero.add(en(caja(0.05, ZERO.h + 0.1, 0.06, borde, 0.01), -0.04, ZERO.h / 2, 0), en(caja(0.05, ZERO.h + 0.1, 0.06, borde, 0.01), ZERO.w + 0.04, ZERO.h / 2, 0));
    for (const [a, b, cc, d] of ZERO.solidos) {
      const pieza = caja(cc - a, d - b, 0.05, mat('#9aa4b8', { metal: 0.5, rough: 0.4 }), 0.01);
      en(pieza, (a + cc) / 2, (b + d) / 2, 0.01);
      tablero.add(pieza);
      for (let yy = b + 0.08; yy < d - 0.04; yy += 0.16) tablero.add(en(caja(cc - a - 0.02, 0.02, 0.052, mat('#f2c75c'), 0.003), (a + cc) / 2, yy, 0.012));
    }
    const meta = { x: 1.3, y: 0.1 };
    const cerr = cilindro(0.07, 0.07, 0.03, mat('#f2c75c', { metal: 0.6 }));
    cerr.rotation.x = Math.PI / 2;
    en(cerr, meta.x, meta.y, 0.0);
    tablero.add(cerr, en(caja(0.03, 0.07, 0.01, mat('#3d2b27'), 0.003), meta.x, meta.y, 0.02));
    const k = llave('llave', '#f2c75c', false);
    k.scale.setScalar(0.6);
    tablero.add(k);
    const cuerpo = new Canica(ZERO, 0.12, 0.12, 0.05);
    k.userData.cuerpo = cuerpo;
    let hecho = false, arrastrando = false;
    // Sin gravedad: se mueve según cuánto se incline respecto a como se tenía el celular al empezar
    let base: { x: number; y: number } | null = null, tCal = 0;
    k.userData.calibrar = (b?: { x: number; y: number }) => ((base = b ?? null), (tCal = 0));
    c.cada((dt, t) => {
      if (hecho) return;
      const s = c.sensores;
      if (s.hayMovimiento && !base) {
        tCal += dt;
        if (tCal > 0.3) base = { ...s.inclinacion };
      }
      const ax = base ? (s.inclinacion.x - base.x) * 9.8 * 0.3 : 0, ay = base ? -(s.inclinacion.y - base.y) * 9.8 * 0.3 : 0;
      let resto = dt;
      while (resto > 0 && !arrastrando) {
        const h = Math.min(0.03, resto);
        const v = Math.hypot(cuerpo.vx, cuerpo.vy);
        if (v > 0.7) (cuerpo.vx *= 0.7 / v), (cuerpo.vy *= 0.7 / v);
        cuerpo.paso(h, ax, ay);
        resto -= h;
      }
      k.position.set(cuerpo.x, cuerpo.y, 0.03);
      k.rotation.z = Math.sin(t * 1.5) * 0.4;
      if (Math.hypot(cuerpo.x - meta.x, cuerpo.y - meta.y) < 0.1) {
        hecho = true;
        k.userData.llego = true;
        sonido.nota(988, 0.2, 0, 'triangle', 0.08);
        void c.escena.animar(300, (q) => k.position.set(meta.x, meta.y, 0.03 + q * 0.02));
        abrirYa(c, 900);
      }
    });
    c.despues(3000, () => {
      if (c.sensores.hayMovimiento || hecho) return;
      c.aviso('Este celular no avisa cuando se inclina: lleva la llave con el dedo.', 3500);
      c.mantener(k, () => (arrastrando = true), () => (arrastrando = false));
      c.gesto.mover((x, y, abajo) => {
        if (!abajo || !arrastrando) return;
        const pnt = c.enPlano(x, y, planoPared(0.09));
        if (!pnt) return;
        cuerpo.vx = (pnt.x - x0 - cuerpo.x) * 8;
        cuerpo.vy = (pnt.y - y0 - cuerpo.y) * 8;
        const v = Math.hypot(cuerpo.vx, cuerpo.vy);
        if (v > 0.7) (cuerpo.vx *= 0.7 / v), (cuerpo.vy *= 0.7 / v);
        cuerpo.paso(0.03, 0, 0);
      });
    });
  },
  async prueba(p) {
    const k = p.obj('llave');
    const cu = k.userData.cuerpo as Canica;
    p.sensor.inclinar(0, 0);
    (k.userData.calibrar as (b?: { x: number; y: number }) => void)({ x: 0, y: 0 });
    await p.esperar(1500);
    const ir = async (ix: number, iy: number, hasta: () => boolean) => {
      p.sensor.inclinar(ix, iy);
      await p.esperarQue(hasta, 90000);
    };
    await ir(0, -0.7, () => cu.y > 0.78);
    await ir(0.6, -0.35, () => cu.x > 0.52);
    await ir(0.05, 0.7, () => cu.y < 0.24);
    await ir(0.6, 0.35, () => cu.x > 0.88);
    await ir(0.05, -0.7, () => cu.y > 0.74);
    await ir(0.6, -0.35, () => cu.x > 1.17);
    await ir(0.1, 0.7, () => !!k.userData.llego);
    p.sensor.soltar();
  },
};

// ---------------------------------------------------------------------------
// 83 · Los planetas
// ---------------------------------------------------------------------------
const PLANETAS = [
  { id: 'mercurio', r: 0.05, color: '#a8a09a', desde: -2.05 },
  { id: 'venus', r: 0.07, color: '#e8c47a', desde: -1.15 },
  { id: 'tierra', r: 0.075, color: '#4a8fd8', desde: -1.75 },
  { id: 'marte', r: 0.06, color: '#d8643a', desde: -0.85 },
  { id: 'jupiter', r: 0.12, color: '#d8a878', desde: -1.45 },
];
const HUECOS_PLANETA = [1.35, 1.65, 1.97, 2.3, 2.72];
/** Profundidad del estante de los planetas (y del plano por donde se arrastran). */
const ZP = 1.25;
const planetas: Nivel = {
  titulo: 'Los planetas',
  pistas: [
    'Los planetas están desordenados.',
    'Cada planeta tiene su hueco en el riel, empezando junto al sol.',
    'Ponlos en su orden de verdad: el más cercano al sol en el primer hueco, y así hacia afuera.',
  ],
  montar(c) {
    const Y = 1.25, Z = 0.35;
    const sol = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), new THREE.MeshBasicMaterial({ color: '#ffcf5a' }));
    en(sol, 1.0, Y, Z);
    c.g.add(sol, en(new THREE.Mesh(new THREE.CircleGeometry(0.32, 30), new THREE.MeshBasicMaterial({ color: '#ffb23f', transparent: true, opacity: 0.35 })), 1.0, Y, Z - 0.05));
    c.g.add(en(caja(1.9, 0.03, 0.03, mat('#8a94a8', { metal: 0.6 }), 0.01), 2.05, Y, Z - 0.03));
    HUECOS_PLANETA.forEach((x, i) => {
      c.g.add(en(toro(0.13, 0.012, mat('#6ac8ff')), x, Y, Z - 0.02));
      c.g.add(en(letrero(0.1, 0.08, (cv, w, h) => textoEn(cv, String(i + 1), w / 2, h / 2 + 2, h * 0.8, '#dff0ff', 700), undefined, { transparente: true }), x, Y - 0.22, Z));
    });
    c.g.add(en(caja(1.6, 0.05, 0.35, mat('#8a94a8', { metal: 0.5 }), 0.02), -1.45, 0.72, ZP));
    const colocados: (string | null)[] = HUECOS_PLANETA.map(() => null);
    PLANETAS.forEach((pl) => {
      const g = grupo(pl.id);
      const cuerpo = esfera(pl.r, mat(pl.color, { rough: 0.6 }), undefined, 20);
      g.add(cuerpo, toque(Math.max(0.12, pl.r + 0.04)));
      if (pl.id === 'jupiter') for (const dy of [-0.04, 0.02, 0.06]) g.add(en(toro(pl.r * Math.sqrt(1 - (dy / pl.r) ** 2), 0.008, mat('#b8784a')), 0, dy, 0));
      if (pl.id === 'tierra') g.add(en(esfera(pl.r * 0.45, mat('#5aa85a'), undefined, 10), 0.03, 0.02, 0.04));
      const inicio = new THREE.Vector3(pl.desde, 0.72 + 0.03 + pl.r, ZP);
      g.position.copy(inicio);
      c.g.add(g);
      c.arrastrar(g, {
        plano: new THREE.Plane(new THREE.Vector3(0, 0, 1), -ZP),
        limites: limites(-2.4, 0.5, ZP, 3.0, 2.2, ZP),
        alSoltar: (pos) => {
          if (g.userData.puesto) return;
          // Se compara en la pantalla (el planeta va por delante del riel)
          const sp = c.escena.aPantalla(pos);
          const dist = HUECOS_PLANETA.map((x) => {
            const sh = c.escena.aPantalla(new THREE.Vector3(x, Y, Z));
            return Math.hypot(sp.x - sh.x, sp.y - sh.y);
          });
          const cerca = Math.min(...dist);
          const i = cerca < 45 ? dist.indexOf(cerca) : -1;
          const correcto = i >= 0 && PLANETAS[i].id === pl.id && !colocados[i];
          const a = g.position.clone();
          if (correcto) {
            g.userData.puesto = true;
            colocados[i] = pl.id;
            c.quitarToque(g);
            void c.escena.animar(250, (q) => g.position.lerpVectors(a, new THREE.Vector3(HUECOS_PLANETA[i], Y, Z), q));
            sonido.nota(700 + i * 110, 0.12, 0, 'sine', 0.07);
            if (colocados.every(Boolean)) abrirYa(c, 1000);
          } else {
            if (i >= 0) {
              c.mal();
              sonido.nota(220, 0.1, 0, 'square', 0.04);
            }
            void c.escena.animar(300, (q) => g.position.lerpVectors(a, inicio, q));
          }
        },
      });
    });
    c.cada((_, t) => (sol.rotation.y = t * 0.3));
  },
  async prueba(p) {
    // Punto del plano de arrastre que se ve encima de cada hueco (cámara en OJO = (0, 1.5, 4.3))
    const k = (4.3 - ZP) / (4.3 - 0.35);
    for (let i = 0; i < PLANETAS.length; i++) {
      await p.arrastrar(PLANETAS[i].id, new THREE.Vector3(HUECOS_PLANETA[i] * k, 1.5 + (1.25 - 1.5) * k, ZP), 16);
      await p.esperarQue(() => !!p.obj(PLANETAS[i].id).userData.puesto, 5000);
      await p.esperar(200);
    }
  },
};

// ---------------------------------------------------------------------------
// 84 · La radio
// ---------------------------------------------------------------------------
const RADIO = { desde: 90.0, meta: 101.1, margen: 0.3, codigo: '417' };
const radio: Nivel = {
  titulo: 'La radio',
  pistas: [
    'Esa radio solo hace ruido.',
    'Gira la perilla (con dos dedos, o arrastrando en círculo) hasta que se limpie el ruido.',
    'Cuando la barra se llene, la estación queda fija: cuenta los pitidos de cada grupo; cada grupo es un número.',
  ],
  montar(c) {
    const R = new THREE.Vector3(1.8, 1.0, 0.35);
    c.g.add(en(caja(1.2, 0.75, 0.5, mat('#8a94a8', { metal: 0.5, rough: 0.35 }), 0.06), R.x, R.y, R.z - 0.1));
    const dial = letrero(0.7, 0.2, () => {}, 'dial radio', { brillo: 0.9 });
    en(dial, R.x - 0.15, R.y + 0.2, R.z + 0.16);
    c.g.add(dial);
    const barra = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.05), new THREE.MeshBasicMaterial({ color: '#5af0a0' }));
    en(barra, R.x - 0.15, R.y + 0.03, R.z + 0.161);
    c.g.add(barra, en(new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.07), new THREE.MeshBasicMaterial({ color: '#1a2230' })), R.x - 0.15, R.y + 0.03, R.z + 0.158));
    const led = new THREE.Mesh(new THREE.CircleGeometry(0.04, 16), new THREE.MeshBasicMaterial({ color: '#3a2a2a' }));
    en(led, R.x - 0.42, R.y - 0.18, R.z + 0.161);
    c.g.add(led);
    for (let i = 0; i < 5; i++) c.g.add(en(caja(0.3, 0.015, 0.01, mat('#3d4658'), 0.003), R.x - 0.15, R.y - 0.12 - i * 0.035, R.z + 0.16));
    const perilla = grupo('perilla');
    const pc = cilindro(0.1, 0.11, 0.07, mat('#e4574b'));
    pc.rotation.x = Math.PI / 2;
    const marca = caja(0.02, 0.07, 0.01, mat('#fff8ee'), 0.004);
    en(marca, 0, 0.055, 0.04);
    perilla.add(pc, marca, toque(0.16));
    en(perilla, R.x + 0.38, R.y + 0.05, R.z + 0.2);
    c.g.add(perilla);
    const teclado = grupo('teclado');
    teclado.add(caja(0.26, 0.2, 0.04, mat('#3d4658'), 0.02));
    for (let f = 0; f < 2; f++) for (let k = 0; k < 3; k++) teclado.add(en(caja(0.05, 0.05, 0.02, mat('#dff0ff'), 0.01), -0.07 + k * 0.07, 0.03 - f * 0.07, 0.025));
    en(teclado, R.x + 0.38, R.y - 0.22, R.z + 0.17);
    c.g.add(teclado);
    let freq = RADIO.desde, fijada = false, hecho = false;
    perilla.userData.freq = () => freq;
    const pintarDial = () => {
      const t = (dial.material as THREE.MeshStandardMaterial).map as THREE.CanvasTexture;
      const cv = (t.image as HTMLCanvasElement).getContext('2d')!;
      const { width: w, height: h } = cv.canvas;
      cv.fillStyle = '#0d1a2e';
      cv.fillRect(0, 0, w, h);
      textoEn(cv, `FM ${freq.toFixed(1)}`, w / 2, h / 2 + 4, h * 0.6, fijada ? '#5af0a0' : '#ffd24a', 700);
      t.needsUpdate = true;
    };
    pintarDial();
    const senal = () => Math.max(0, 1 - Math.abs(freq - RADIO.meta) / 2.5);
    const girar = (d: number) => {
      if (fijada || hecho) return;
      freq = THREE.MathUtils.clamp(freq + (d * 10) / (Math.PI * 2), 88, 108);
      perilla.rotation.z = -((freq - 88) / 10) * Math.PI * 2;
      pintarDial();
      if (Math.abs(freq - RADIO.meta) < RADIO.margen) {
        fijada = true;
        freq = RADIO.meta;
        perilla.userData.fijada = true;
        pintarDial();
        sonido.nota(880, 0.1, 0, 'sine', 0.06);
        sonido.nota(1320, 0.15, 0.12, 'sine', 0.06);
      }
    };
    c.gesto.giro((d) => girar(d));
    let previo: number | null = null;
    const centro = perilla.position.clone();
    const plano = new THREE.Plane(new THREE.Vector3(0, 0, 1), -centro.z);
    c.mantener(perilla, (hit) => (previo = Math.atan2(hit.point.y - centro.y, hit.point.x - centro.x)), () => (previo = null));
    c.gesto.mover((x, y, abajo) => {
      if (!abajo || previo === null) return;
      const p = c.enPlano(x, y, plano);
      if (!p) return;
      const a = Math.atan2(p.y - centro.y, p.x - centro.x);
      const d = Math.atan2(Math.sin(previo - a), Math.cos(previo - a));
      previo = a;
      girar(d);
    });
    // Ruido de estática y, sintonizada, los pitidos del código
    let tRuido = 0, tPit = 0, paso = 0;
    const pasos: number[] = [];
    for (const ch of RADIO.codigo) {
      for (let i = 0; i < Number(ch); i++) pasos.push(1, 0);
      pasos.push(0, 0, 0);
    }
    pasos.push(0, 0, 0);
    c.cada((dt) => {
      const s = senal();
      barra.scale.x = Math.max(0.02, fijada ? 1 : s);
      barra.position.x = R.x - 0.15 - 0.3 * (1 - barra.scale.x);
      if (!fijada) {
        tRuido += dt;
        if (tRuido > 0.25) {
          tRuido = 0;
          sonido.rumor(0.22, 1800, 0.035 * (1 - s) + 0.004);
        }
        return;
      }
      tPit += dt;
      if (tPit < 0.28) return;
      tPit = 0;
      const on = pasos[paso % pasos.length] === 1;
      (led.material as THREE.MeshBasicMaterial).color.set(on ? '#ff6a7a' : '#3a2a2a');
      if (on) sonido.nota(1046, 0.16, 0, 'sine', 0.07);
      paso++;
      if (paso >= pasos.length) perilla.userData.escuchado = true;
    });
    c.tocar(teclado, async () => {
      if (hecho) return;
      await c.enfocar(teclado, 0.9);
      const ok = await c.ui.teclado({ titulo: 'Código de la radio', largo: RADIO.codigo.length, correcto: RADIO.codigo });
      if (ok) {
        hecho = true;
        c.resolver();
      } else await c.volver();
    });
  },
  async prueba(p) {
    const per = p.obj('perilla');
    for (let i = 0; i < 30 && !per.userData.fijada; i++) {
      const d = RADIO.meta - (per.userData.freq as () => number)();
      await p.girar(THREE.MathUtils.clamp((d / 10) * Math.PI * 2, -1.2, 1.2));
      await p.esperar(150);
    }
    await p.esperarQue(() => !!per.userData.fijada, 5000);
    await p.esperarQue(() => !!per.userData.escuchado, 90000);
    await p.tocar('teclado');
    await p.panel(RADIO.codigo);
  },
};

// ---------------------------------------------------------------------------
// 85 · El Morse
// ---------------------------------------------------------------------------
const MORSE: Record<string, string> = { A: '.-', E: '.', I: '..', L: '.-..', M: '--', N: '-.', O: '---', R: '.-.', S: '...', T: '-', U: '..-' };
const PALABRA_MORSE = 'AMOR';
const morse: Nivel = {
  titulo: 'El mensaje en Morse',
  pistas: [
    'La nave quiere decirte algo.',
    'El botón de la consola hace que la nave hable: vibra, parpadea y pita. La tabla de la pared traduce.',
    'Anota cada señal corta y larga, busca cada grupo en la tabla de la pared y escribe la palabra.',
  ],
  montar(c) {
    const tabla = letrero(0.9, 0.95, (cv, w, h) => {
      cv.fillStyle = '#0d1a2e';
      cv.fillRect(0, 0, w, h);
      textoEn(cv, 'CÓDIGO MORSE', w / 2, h * 0.07, h * 0.06, '#6ac8ff', 700);
      Object.entries(MORSE).forEach(([l, m], i) => {
        const y = h * (0.16 + i * 0.077);
        textoEn(cv, l, w * 0.2, y, h * 0.055, '#dff0ff', 700);
        let x = w * 0.38;
        for (const s of m) {
          cv.fillStyle = '#ffd24a';
          if (s === '.') {
            cv.beginPath();
            cv.arc(x + 8, y, 8, 0, Math.PI * 2);
            cv.fill();
            x += 30;
          } else {
            cv.fillRect(x, y - 7, 44, 14);
            x += 58;
          }
        }
      });
    }, 'tabla morse', { brillo: 0.6 });
    en(tabla, 2.55, 1.45, 0.03);
    c.g.add(tabla);
    const consola = grupo('consola');
    consola.add(en(caja(0.9, 0.8, 0.5, mat('#8a94a8', { metal: 0.5, rough: 0.35 }), 0.05), 0, 0.4, 0));
    const luz = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshBasicMaterial({ color: '#3a2a2a' }));
    en(luz, -0.2, 0.9, 0);
    const boton = grupo('boton morse');
    boton.add(cilindro(0.08, 0.09, 0.05, matNuevo('#e4574b')), toque(0.13));
    en(boton, 0.18, 0.83, 0.05);
    consola.add(luz, boton);
    en(consola, 1.4, 0, 0.75);
    c.g.add(consola);
    const teclas = [...new Set(Object.keys(MORSE))].sort().concat(['⌫']);
    const pad = grupo('teclado');
    pad.add(caja(0.3, 0.22, 0.04, mat('#3d4658'), 0.02));
    for (let f = 0; f < 2; f++) for (let k = 0; k < 4; k++) pad.add(en(caja(0.05, 0.05, 0.02, mat('#dff0ff'), 0.01), -0.1 + k * 0.066, 0.04 - f * 0.07, 0.025));
    en(pad, 0.98, 1.2, 0.05);
    c.g.add(pad);
    let sonando = false, hecho = false;
    const lucir = (on: boolean) => (luz.material as THREE.MeshBasicMaterial).color.set(on ? '#ffd24a' : '#3a2a2a');
    c.tocar(boton, () => {
      if (sonando || hecho) return;
      sonando = true;
      const patron: number[] = [];
      const pasos: [boolean, number][] = [];
      const U = 260;
      PALABRA_MORSE.split('').forEach((l, li) => {
        MORSE[l].split('').forEach((s, si) => {
          if (si) pasos.push([false, U]);
          pasos.push([true, s === '.' ? U : U * 3]);
        });
        if (li < PALABRA_MORSE.length - 1) pasos.push([false, U * 3]);
      });
      for (const [, ms] of pasos) patron.push(ms);
      c.sensores.vibrar(patron);
      let t = 0;
      for (const [on, ms] of pasos) {
        if (on) {
          c.despues(t, () => {
            lucir(true);
            sonido.nota(740, ms / 1000, 0, 'sine', 0.06);
          });
          c.despues(t + ms, () => lucir(false));
        }
        t += ms;
      }
      c.despues(t + 300, () => {
        sonando = false;
        boton.userData.oido = true;
      });
    });
    c.tocar(pad, async () => {
      if (hecho) return;
      await c.enfocar(pad, 0.9);
      const ok = await c.ui.teclado({ titulo: 'Mensaje de la nave', largo: PALABRA_MORSE.length, correcto: PALABRA_MORSE, teclas });
      if (ok) {
        hecho = true;
        c.resolver();
      } else await c.volver();
    });
  },
  async prueba(p) {
    await p.tocar('boton morse');
    await p.esperarQue(() => !!p.obj('boton morse').userData.oido, 60000);
    await p.tocar('teclado');
    await p.panel(PALABRA_MORSE);
  },
};

// ---------------------------------------------------------------------------
// 86 · No hay arriba
// ---------------------------------------------------------------------------
const alReves: Nivel = {
  titulo: 'No hay arriba',
  pistas: [
    'Aquí todo está patas arriba.',
    '¿Y si el arriba fuera abajo? El mundo se puede voltear.',
    'Dale la vuelta al celular (de cabeza) y vuelve a ponerlo derecho. (Sin sensores: mantén presionado el letrero de la gravedad.)',
  ],
  montar(c) {
    const cosas: { o: THREE.Object3D; x: number; z: number; piso: number }[] = [];
    const taza = grupo('taza al reves');
    taza.add(cilindro(0.08, 0.07, 0.14, mat('#F59FC0')), en(toro(0.04, 0.012, mat('#F59FC0')), 0.09, 0, 0));
    const maceta = grupo('maceta');
    maceta.add(cilindro(0.1, 0.08, 0.16, mat('#c96a4a')), en(esfera(0.12, mat('#5aa85a'), undefined, 12), 0, -0.14, 0));
    const osito = grupo('osito');
    osito.add(esfera(0.1, mat('#b07a4f', { rough: 1 }), undefined, 12), en(esfera(0.07, mat('#b07a4f', { rough: 1 }), undefined, 12), 0, -0.13, 0));
    const k = llave('llave', '#f2c75c', true);
    k.rotation.x = Math.PI / 2;
    for (const [o, x, z, piso] of [[taza, 1.1, 0.8, 0.07], [maceta, 1.9, 0.6, 0.12], [osito, 2.5, 0.9, 0.12], [k, 1.55, 1.1, 0.03]] as [THREE.Object3D, number, number, number][]) {
      o.rotation.z = Math.PI;
      en(o, x, 2.35, z);
      c.g.add(o);
      cosas.push({ o, x, z, piso });
      reservar(c, x, 0, z, 0.35, 0.3, 0.35);
    }
    const cartel = letrero(1.0, 0.36, (cv, w, h) => {
      cv.save();
      cv.translate(w, h);
      cv.rotate(Math.PI);
      cv.fillStyle = '#0d1a2e';
      cv.fillRect(0, 0, w, h);
      textoEn(cv, 'GRAVEDAD ↓', w / 2, h / 2 + 3, h * 0.45, '#ffd24a', 700);
      cv.restore();
    }, 'letrero gravedad', { brillo: 0.6 });
    en(cartel, 1.8, 1.45, 0.03);
    c.g.add(cartel);
    let volteado = false, cabeza = 0;
    const caer = () => {
      if (volteado) return;
      volteado = true;
      sonido.nota(300, 0.4, 0, 'sine', 0.08, 900);
      c.escena.temblar(0.02, 300);
      void c.escena.animar(600, (q) => (cartel.rotation.z = q * Math.PI));
      cosas.forEach(({ o, x, z, piso }, i) =>
        c.despues(i * 120, () => {
          const y0 = o.position.y, r0 = o.rotation.z;
          void c.escena.animar(700, (q) => {
            o.position.set(x, y0 + (piso - y0) * q, z);
            o.rotation.z = r0 + (0 - r0) * q;
          }, (q) => q * q).then(() => sonido.nota(180 + i * 40, 0.08, 0, 'square', 0.04));
        }),
      );
      c.despues(1300, () => {
        k.userData.abajo = true;
        c.bien();
      });
    };
    c.sensor.volteo(caer);
    c.cada((dt, t) => {
      if (!volteado) cosas.forEach(({ o }, i) => (o.position.y = 2.35 + Math.sin(t * 1.2 + i) * 0.03));
      if (c.sensores.inclinacion.y < -0.55) cabeza += dt;
      else cabeza = 0;
      if (cabeza > 0.4) caer();
    });
    c.mantener(cartel, () => {}, (ms) => {
      if (ms > 1200) caer();
    });
    llaveParaLaPuerta(c, k, () => volteado);
  },
  async prueba(p) {
    p.sensor.voltear();
    await p.esperarQue(() => !!p.obj('llave').userData.abajo, 15000);
    await p.esperar(500);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 87 · Asteroides
// ---------------------------------------------------------------------------
const asteroides: Nivel = {
  titulo: 'Asteroides',
  pistas: [
    'El camino está bloqueado.',
    'Los asteroides se rompen, pero son duros.',
    'Tócalos varias veces cada uno hasta romperlos todos.',
  ],
  montar(c) {
    const C = new THREE.Vector3(1.85, 1.4, 0.05);
    pantallaEspacio(c, C.x, C.y, 1.8, 1.25);
    const roca = mat('#8a7a6a', { rough: 1 });
    const lista = Array.from({ length: 5 }, (_, i) => {
      const g = grupo(`asteroide ${i}`);
      const geo = new THREE.IcosahedronGeometry(0.1 + (i % 3) * 0.025, 1);
      const pos = geo.attributes.position;
      for (let j = 0; j < pos.count; j++) {
        const f = 0.8 + ((j * 37) % 11) / 25;
        pos.setXYZ(j, pos.getX(j) * f, pos.getY(j) * f, pos.getZ(j) * f);
      }
      geo.computeVertexNormals();
      g.add(new THREE.Mesh(geo, roca), toque(0.17));
      g.userData.base = new THREE.Vector3(C.x - 0.65 + i * 0.32, C.y + (i % 2 ? 0.25 : -0.2), C.z + 0.15);
      g.userData.vida = 3;
      g.position.copy(g.userData.base);
      c.g.add(g);
      return g;
    });
    let rotos = 0;
    const nave = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 8), mat('#dff0ff', { metal: 0.3 }));
    nave.rotation.z = -Math.PI / 2;
    en(nave, C.x - 0.82, C.y, C.z + 0.08);
    c.g.add(nave);
    for (const g of lista) {
      c.tocar(g, () => {
        if (g.userData.vida <= 0) return;
        g.userData.vida--;
        sonido.nota(900 - g.userData.vida * 150, 0.05, 0, 'square', 0.04);
        g.scale.setScalar(0.6 + g.userData.vida * 0.15);
        void c.escena.animar(120, (q) => (g.children[0].rotation.x += q * 0.3));
        if (g.userData.vida === 0) {
          sonido.rumor(0.25, 700, 0.1);
          const trozos = Array.from({ length: 6 }, () => {
            const t = esfera(0.03, roca, undefined, 6);
            t.position.copy(g.position);
            c.g.add(t);
            return { t, v: new THREE.Vector3((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, 0.2) };
          });
          g.visible = false;
          c.quitarToque(g);
          void c.escena.animar(600, (q) => trozos.forEach(({ t, v }) => {
            t.position.addScaledVector(v, 0.03);
            t.scale.setScalar(1 - q);
          })).then(() => trozos.forEach(({ t }) => t.removeFromParent()));
          if (++rotos === lista.length) {
            void c.escena.animar(1200, (q) => (nave.position.x = C.x - 0.82 + q * 1.6));
            abrirYa(c, 1300);
          }
        }
      });
    }
    c.cada((_, t) => lista.forEach((g, i) => {
      const b = g.userData.base as THREE.Vector3;
      g.position.set(b.x + Math.sin(t * 0.7 + i) * 0.06, b.y + Math.cos(t * 0.9 + i * 2) * 0.05, b.z);
      g.children[0].rotation.y = t * (0.4 + i * 0.1);
    }));
  },
  async prueba(p) {
    for (let i = 0; i < 5; i++) {
      const g = p.obj(`asteroide ${i}`);
      for (let k = 0; k < 6 && g.userData.vida > 0; k++) await p.tocar(g, 1, 80);
    }
  },
};

// ---------------------------------------------------------------------------
// 88 · Los tubos de energía
// ---------------------------------------------------------------------------
type Pieza = { tipo: 'I' | 'L'; rot: number; meta?: number };
const CONEXIONES = {
  I: [['O', 'E'], ['N', 'S']],
  L: [['N', 'E'], ['E', 'S'], ['S', 'O'], ['O', 'N']],
} as const;
const OPUESTO: Record<string, string> = { N: 'S', S: 'N', E: 'O', O: 'E' };
const PASO: Record<string, [number, number]> = { N: [-1, 0], S: [1, 0], E: [0, 1], O: [0, -1] };
const TUBOS: Pieza[][] = [
  [{ tipo: 'L', rot: 1 }, { tipo: 'L', rot: 3, meta: 1 }, { tipo: 'L', rot: 0, meta: 2 }, { tipo: 'I', rot: 0 }],
  [{ tipo: 'I', rot: 1, meta: 0 }, { tipo: 'L', rot: 1, meta: 3 }, { tipo: 'L', rot: 2, meta: 0 }, { tipo: 'I', rot: 1, meta: 0 }],
  [{ tipo: 'L', rot: 2 }, { tipo: 'I', rot: 1 }, { tipo: 'L', rot: 0 }, { tipo: 'L', rot: 3 }],
];
const tubos: Nivel = {
  titulo: 'Los tubos de energía',
  pistas: [
    'La compuerta no tiene energía.',
    'Los tubos giran si los tocas; la energía sale de la batería de la izquierda.',
    'Arma un camino continuo de tubos desde la batería hasta la compuerta; no hace falta usarlos todos.',
  ],
  montar(c) {
    const x0 = 1.2, y0 = 1.65, L = 0.3;
    const grid = TUBOS.map((fila) => fila.map((p) => ({ ...p })));
    c.g.add(en(caja(L * 4 + 0.12, L * 3 + 0.12, 0.04, mat('#3d4658', { metal: 0.4 }), 0.02), x0 + L * 2 - L / 2, y0 - L, 0.02));
    const bat = grupo('bateria');
    bat.add(caja(0.14, 0.24, 0.1, mat('#5af0a0'), 0.03), en(caja(0.06, 0.04, 0.06, mat('#dff0ff'), 0.01), 0, 0.14, 0));
    en(bat, x0 - L / 2 - 0.14, y0 - L, 0.08);
    c.g.add(bat);
    const receptor = new THREE.Mesh(new THREE.CircleGeometry(0.08, 20), new THREE.MeshBasicMaterial({ color: '#3a4458' }));
    en(receptor, x0 + L * 3.5 + 0.12, y0 - L, 0.06);
    c.g.add(receptor);
    const matTubo = () => new THREE.MeshStandardMaterial({ color: '#9aa4b8', metalness: 0.5, roughness: 0.4, emissive: '#5af0a0', emissiveIntensity: 0 });
    const celdas = grid.map((fila, i) =>
      fila.map((p, j) => {
        const g = grupo(`tubo ${i} ${j}`);
        const m = matTubo();
        const piv = grupo();
        if (p.tipo === 'I') {
          const t = cilindro(0.045, 0.045, L, m);
          t.rotation.z = Math.PI / 2;
          piv.add(t);
        } else {
          const a = cilindro(0.045, 0.045, L / 2, m);
          en(a, 0, L / 4, 0);
          const b = cilindro(0.045, 0.045, L / 2, m);
          b.rotation.z = Math.PI / 2;
          en(b, L / 4, 0, 0);
          piv.add(a, b, esfera(0.045, m, undefined, 10));
        }
        piv.rotation.z = -p.rot * (Math.PI / 2);
        g.add(en(caja(L - 0.02, L - 0.02, 0.02, mat('#2a3040'), 0.01), 0, 0, -0.02), piv, new THREE.Mesh(new THREE.PlaneGeometry(L, L), new THREE.MeshBasicMaterial({ visible: false })));
        en(g, x0 + j * L, y0 - i * L, 0.07);
        g.userData.piv = piv;
        g.userData.mat = m;
        c.g.add(g);
        return g;
      }),
    );
    let hecho = false;
    const lados = (p: Pieza) => CONEXIONES[p.tipo][p.rot % CONEXIONES[p.tipo].length] as readonly string[];
    const revisar = () => {
      celdas.flat().forEach((g) => (g.userData.mat.emissiveIntensity = 0));
      let i = 1, j = 0, entra = 'O';
      for (let pasos = 0; pasos < 12; pasos++) {
        if (i < 0 || i > 2 || j < 0 || j > 3) break;
        const l = lados(grid[i][j]);
        if (!l.includes(entra)) break;
        celdas[i][j].userData.mat.emissiveIntensity = 0.8;
        const sale = l.find((x) => x !== entra)!;
        if (i === 1 && j === 3 && sale === 'E') {
          (receptor.material as THREE.MeshBasicMaterial).color.set('#5af0a0');
          return true;
        }
        const [di, dj] = PASO[sale];
        i += di;
        j += dj;
        entra = OPUESTO[sale];
      }
      return false;
    };
    revisar();
    celdas.forEach((fila, i) =>
      fila.forEach((g, j) =>
        c.tocar(g, () => {
          if (hecho) return;
          const p = grid[i][j];
          p.rot = (p.rot + 1) % 4;
          g.userData.rot = p.rot;
          sonido.nota(600, 0.04, 0, 'square', 0.03);
          const r0 = g.userData.piv.rotation.z;
          void c.escena.animar(150, (q) => (g.userData.piv.rotation.z = r0 - q * (Math.PI / 2)));
          if (revisar()) {
            hecho = true;
            sonido.nota(1318, 0.4, 0.1, 'sine', 0.08);
            abrirYa(c, 1100);
          }
        }),
      ),
    );
    celdas.forEach((fila, i) => fila.forEach((g, j) => (g.userData.rot = grid[i][j].rot)));
  },
  async prueba(p) {
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 4; j++) {
        const pz = TUBOS[i][j];
        if (pz.meta === undefined) continue;
        const periodo = pz.tipo === 'I' ? 2 : 4;
        const g = p.obj(`tubo ${i} ${j}`);
        for (let k = 0; k < 4 && (g.userData.rot as number) % periodo !== pz.meta; k++) {
          await p.tocar(g);
          await p.esperar(250);
        }
      }
  },
};

// ---------------------------------------------------------------------------
// 89 · El cohete
// ---------------------------------------------------------------------------
const cohete: Nivel = {
  titulo: 'El cohete',
  pistas: [
    'El cohete necesita combustible.',
    'El botón de despegue carga la barra mientras lo mantienes presionado. Fíjate en la rayita dorada.',
    'Mantén el botón y suelta justo cuando la barra llegue a la raya dorada: ni antes ni después.',
  ],
  montar(c) {
    const C = new THREE.Vector3(1.85, 1.4, 0.05);
    pantallaEspacio(c, C.x, C.y, 1.5, 1.2);
    const nave = grupo('cohete');
    const cuerpo = cilindro(0.06, 0.07, 0.3, mat('#fff3e0'));
    const punta = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 16), mat('#e4574b'));
    en(punta, 0, 0.22, 0);
    const ventana = new THREE.Mesh(new THREE.CircleGeometry(0.025, 16), mat('#6ac8ff'));
    en(ventana, 0, 0.05, 0.061);
    const fuego = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 10), new THREE.MeshBasicMaterial({ color: '#ffb23f' }));
    fuego.rotation.z = Math.PI;
    en(fuego, 0, -0.23, 0);
    fuego.visible = false;
    nave.add(cuerpo, punta, ventana, fuego);
    for (const s of [-1, 1]) {
      const aleta = caja(0.05, 0.1, 0.02, mat('#e4574b'), 0.01);
      en(aleta, s * 0.07, -0.12, 0);
      nave.add(aleta);
    }
    en(nave, C.x, C.y - 0.35, C.z + 0.12);
    c.g.add(nave);
    // Barra de combustible con la raya de los 3 s
    const X = 1.02, Y0 = 0.65, H = 1.2;
    c.g.add(en(caja(0.12, H + 0.06, 0.04, mat('#3d4658'), 0.02), X, Y0 + H / 2, 0.05));
    const barra = new THREE.Mesh(new THREE.PlaneGeometry(0.08, H), new THREE.MeshBasicMaterial({ color: '#5af0a0' }));
    en(barra, X, Y0 + H / 2, 0.075);
    barra.scale.y = 0.001;
    c.g.add(barra);
    const MAX = 4;
    c.g.add(en(caja(0.16, 0.02, 0.01, mat('#f2c75c'), 0.003), X, Y0 + (3 / MAX) * H, 0.08));
    const boton = grupo('boton cohete');
    boton.add(cilindro(0.1, 0.11, 0.06, mat('#fff3e0')), en(cilindro(0.08, 0.08, 0.06, matNuevo('#e4574b')), 0, 0.04, 0), toque(0.15));
    c.g.add(en(caja(0.5, 0.8, 0.4, mat('#8a94a8', { metal: 0.5 }), 0.04), -1.3, 0.4, 0.9));
    en(boton, -1.3, 0.83, 0.95);
    c.g.add(boton);
    let desde = 0, cargando = false, hecho = false;
    c.mantener(boton, () => {
      if (hecho) return;
      desde = performance.now();
      cargando = true;
      sonido.nota(220, 0.1, 0, 'sawtooth', 0.03);
    }, (ms) => {
      if (hecho || !cargando) return;
      cargando = false;
      const s = ms / 1000;
      boton.userData.ultimo = s;
      if (Math.abs(s - 3) <= 0.3) {
        hecho = true;
        fuego.visible = true;
        sonido.rumor(1.2, 300, 0.12);
        const y0 = nave.position.y;
        void c.escena.animar(1400, (q) => (nave.position.y = y0 + q * q * 1.2), (q) => q);
        abrirYa(c, 1500);
      } else {
        sonido.nota(s < 3 ? 180 : 120, 0.25, 0, 'square', 0.05);
        c.escena.temblar(0.012, 200);
        c.aviso(s < 3 ? `${s.toFixed(1)} s: le faltó combustible.` : `${s.toFixed(1)} s: ¡se pasó!`, 2200);
        c.mal();
        c.despues(600, () => (barra.scale.y = 0.001));
      }
    });
    c.cada(() => {
      if (!cargando) return;
      const s = (performance.now() - desde) / 1000;
      barra.scale.y = Math.max(0.001, Math.min(1, s / MAX));
      barra.position.y = Y0 + (H * barra.scale.y) / 2;
      (barra.material as THREE.MeshBasicMaterial).color.set(s > 3.3 ? '#ff6a7a' : s > 2.7 ? '#f2c75c' : '#5af0a0');
    });
  },
  async prueba(p) {
    await p.mantener('boton cohete', 3000);
  },
};

// ---------------------------------------------------------------------------
// 90 · El eclipse
// ---------------------------------------------------------------------------
const SOL = new THREE.Vector3(1.9, 1.55, 0.1);
const eclipse: Nivel = {
  titulo: 'El eclipse',
  pistas: [
    'La luna está muy lejos del sol.',
    'La luna se deja arrastrar.',
    'Pon la luna exactamente sobre el sol, bien centrada, y suéltala.',
  ],
  montar(c) {
    pantallaEspacio(c, 1.85, 1.4, 1.8, 1.25);
    const sol = new THREE.Mesh(new THREE.CircleGeometry(0.16, 40), new THREE.MeshBasicMaterial({ color: '#ffcf5a' }));
    en(sol, SOL.x, SOL.y, 0.04);
    const corona = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.34, 48), new THREE.MeshBasicMaterial({ color: '#fff3c0', transparent: true, opacity: 0.0, depthWrite: false }));
    en(corona, SOL.x, SOL.y, 0.045);
    const brillo = new THREE.Mesh(new THREE.CircleGeometry(0.28, 40), new THREE.MeshBasicMaterial({ color: '#ffb23f', transparent: true, opacity: 0.35, depthWrite: false }));
    en(brillo, SOL.x, SOL.y, 0.035);
    c.g.add(brillo, sol, corona);
    const luna = grupo('luna');
    const disco = new THREE.Mesh(new THREE.CircleGeometry(0.165, 40), mat('#2a2438', { plano: true }));
    luna.add(disco, en(new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), new THREE.MeshBasicMaterial({ visible: false })), 0, 0, 0.001));
    const inicio = new THREE.Vector3(1.25, 1.05, 0.08);
    luna.position.copy(inicio);
    c.g.add(luna);
    let hecho = false;
    c.arrastrar(luna, {
      plano: planoPared(0.08),
      limites: limites(1.05, 0.9, 0.08, 2.65, 1.9, 0.08),
      alMover: (p) => {
        const d = Math.hypot(p.x - SOL.x, p.y - SOL.y);
        (brillo.material as THREE.MeshBasicMaterial).opacity = 0.35 * Math.min(1, d / 0.3);
      },
      alSoltar: (p) => {
        if (hecho) return;
        const d = Math.hypot(p.x - SOL.x, p.y - SOL.y);
        if (d < 0.08) {
          hecho = true;
          luna.userData.puesta = true;
          c.quitarToque(luna);
          const a = luna.position.clone();
          void c.escena.animar(300, (q) => luna.position.lerpVectors(a, SOL.clone().setZ(0.08), q));
          c.escena.atenuar(0.35);
          void c.escena.animar(1500, (q) => ((corona.material as THREE.MeshBasicMaterial).opacity = q * 0.85));
          sonido.nota(523, 0.8, 0, 'sine', 0.06);
          sonido.nota(784, 0.8, 0.3, 'sine', 0.06);
          abrirYa(c, 2000);
        } else if (d < 0.25) {
          sonido.nota(300, 0.1, 0, 'sine', 0.04);
          c.aviso('Casi… un poquito más al centro.', 1600);
        }
      },
    });
    c.alSalir(() => c.escena.atenuar(1));
  },
  async prueba(p) {
    await p.arrastrar('luna', SOL.clone().setZ(0.08), 20);
    await p.esperarQue(() => !!p.obj('luna').userData.puesta, 5000);
  },
};

export const CAP9: Nivel[] = [constelacion, gravedad, planetas, radio, morse, alReves, asteroides, tubos, cohete, eclipse];
