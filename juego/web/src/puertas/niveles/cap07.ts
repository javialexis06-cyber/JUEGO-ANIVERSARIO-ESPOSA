// Capítulo 7 · La feria (puertas 61–70): tiro al blanco a tiempo, la rueda de colores, algodón de azúcar dando
// vueltas con el dedo, la máquina de peluches (inclinar o palanca), el martillo de fuerza, las cartas de la adivina,
// los globos que forman una palabra, el carrusel, la casa de los espejos y la letra pequeña del tiquete.
import * as THREE from 'three';
import * as sonido from '../../sonido';
import { caja, cilindro, en, esfera, grupo, letrero, mat, matNuevo, textoEn, toro } from '../kit';
import type { Ctx, Nivel } from '../nivel';
import { candadoPuerta, limites, llave, mesaRedonda, tecladoPared } from './piezas';

function llaveParaLaPuerta(c: Ctx, k: THREE.Object3D, puede: () => boolean = () => true) {
  c.tocar(k, () => {
    if (puede()) c.dar('llave', k);
  });
  c.conLlave();
}

const toque = (r: number, nombre?: string) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  if (nombre) m.name = nombre;
  return m;
};

/** Diferencia de ángulos entre -π y π. */
const difAng = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

/** Rayas de feria para cajas y letreros. */
function rayas(c: CanvasRenderingContext2D, w: number, h: number, a = '#e4574b', b = '#fff3e0', n = 10) {
  for (let i = 0; i < n; i++) {
    c.fillStyle = i % 2 ? b : a;
    c.fillRect((i * w) / n, 0, w / n + 1, h);
  }
}

// ---------------------------------------------------------------------------
// 61 · Tiro al blanco
// ---------------------------------------------------------------------------
function patito(nombre: string, conCorazon: boolean) {
  const g = grupo(nombre);
  const cuerpo = grupo();
  const m = mat(conCorazon ? '#F7C948' : '#efe2c8');
  const panza = esfera(0.075, m, undefined, 14);
  panza.scale.set(1.3, 0.85, 0.8);
  en(panza, 0, 0.07, 0);
  const cabeza = esfera(0.045, m, undefined, 12);
  en(cabeza, 0.065, 0.15, 0);
  const pico = caja(0.045, 0.018, 0.03, mat('#f08a3c'), 0.007);
  en(pico, 0.115, 0.145, 0);
  const ojo = esfera(0.009, mat('#3d2b27'), undefined, 6);
  en(ojo, 0.08, 0.165, 0.032);
  cuerpo.add(panza, cabeza, pico, ojo, en(caja(0.12, 0.02, 0.05, mat('#8a6a55'), 0.006), 0, 0.01, 0));
  if (conCorazon) {
    const cor = new THREE.Mesh(new THREE.ShapeGeometry(corazonChico(0.05)), new THREE.MeshBasicMaterial({ color: '#e4574b' }));
    en(cor, -0.005, 0.075, 0.062);
    cuerpo.add(cor);
  }
  g.add(cuerpo);
  g.userData.cuerpo = cuerpo;
  return g;
}

function corazonChico(s: number) {
  const f = new THREE.Shape();
  f.moveTo(0, -0.5 * s);
  f.bezierCurveTo(-0.5 * s, -0.1 * s, -0.5 * s, 0.45 * s, 0, 0.25 * s);
  f.bezierCurveTo(0.5 * s, 0.45 * s, 0.5 * s, -0.1 * s, 0, -0.5 * s);
  return f;
}

const tiro: Nivel = {
  titulo: 'Tiro al blanco',
  pistas: [
    'No todos los patitos valen lo mismo.',
    'El botón rojo dispara justo por el aro. Fíjate cuáles patitos tienen algo especial.',
    'Dispara solo cuando un patito con corazón pase dentro del aro rojo; hay que tumbarlos a todos.',
  ],
  montar(c) {
    const cx = 1.75, yP = 1.24, zP = 0.25, x0 = 0.9, L = 1.7, N = 7;
    c.g.add(en(caja(1.9, 1.0, 0.06, mat('#3b2f6c'), 0.02), cx, 1.45, 0.12));
    c.g.add(en(caja(1.9, 0.9, 0.45, mat('#e4574b'), 0.03), cx, 0.45, 0.62));
    c.g.add(en(caja(2.0, 0.06, 0.5, mat('#fff3e0'), 0.02), cx, 0.93, 0.62));
    for (const x of [0.78, 2.72]) c.g.add(en(cilindro(0.045, 0.05, 2.3, mat('#fff3e0')), x, 1.15, 0.82));
    const cartel = letrero(2.0, 0.3, (cv, w, h) => {
      rayas(cv, w, h, '#e4574b', '#c94538', 16);
      textoEn(cv, 'TIRO AL BLANCO', w / 2, h / 2 + 3, h * 0.56, '#fff8ee', 700);
    });
    c.g.add(en(cartel, cx, 2.2, 0.85));
    c.g.add(en(caja(1.8, 0.035, 0.06, mat('#8a6a55'), 0.01), cx, yP - 0.02, zP));
    const CON = [1, 3, 6];
    const patos = Array.from({ length: N }, (_, i) => {
      const p = patito(`patito ${i}`, CON.includes(i));
      p.userData.corazon = CON.includes(i);
      c.g.add(p);
      return p;
    });
    let t = 0, vel = 0.25;
    const xDe = (i: number) => x0 + ((t * vel + (i * L) / N) % L);
    const colocar = () =>
      patos.forEach((p, i) => {
        const x = xDe(i);
        p.position.set(x, yP, zP);
        p.visible = x > x0 + 0.05 && x < x0 + L - 0.05;
      });
    colocar();
    c.cada((dt) => {
      t += dt;
      colocar();
    });
    // La mira (fija) y el botón
    const mira = grupo('mira');
    mira.add(toro(0.1, 0.012, new THREE.MeshBasicMaterial({ color: '#e4574b' })));
    for (const r of [0, Math.PI / 2]) {
      const l = caja(0.26, 0.008, 0.008, new THREE.MeshBasicMaterial({ color: '#e4574b' }), 0);
      l.rotation.z = r;
      mira.add(l);
    }
    en(mira, cx, yP + 0.09, 0.44);
    c.g.add(mira);
    const enMira = (margen: number) => patos.find((p, i) => p.visible && Math.abs(xDe(i) - cx) < margen) ?? null;
    mira.userData.enMira = () => {
      const p = enMira(0.07);
      return !!p && p.userData.corazon && !p.userData.caido;
    };
    const pistola = grupo('pistola');
    const canon = cilindro(0.025, 0.03, 0.45, mat('#8a6a55'));
    canon.rotation.x = Math.PI / 2;
    pistola.add(canon, en(caja(0.08, 0.14, 0.12, mat('#5e3d28'), 0.02), 0, -0.06, 0.2));
    en(pistola, 1.15, 1.03, 0.62);
    pistola.rotation.y = -0.35;
    c.g.add(pistola);
    const boton = grupo('boton pum');
    boton.add(cilindro(0.08, 0.09, 0.05, mat('#fff3e0')), en(cilindro(0.06, 0.06, 0.05, matNuevo('#e4574b')), 0, 0.04, 0), toque(0.13));
    en(boton, 2.3, 0.97, 0.72);
    c.g.add(boton);
    c.g.add(en(letrero(0.22, 0.08, (cv, w, h) => textoEn(cv, '¡PUM!', w / 2, h / 2 + 2, h * 0.7, '#e4574b', 700), undefined, { transparente: true }), 2.3, 0.965, 0.84));
    (c.g.children[c.g.children.length - 1] as THREE.Object3D).rotation.x = -Math.PI / 2;
    const k = llave('llave', '#f2c75c', true);
    en(k, cx, 0.98, 0.74);
    k.visible = false;
    c.g.add(k);
    const corcho = esfera(0.02, mat('#d9b48a'), undefined, 8);
    corcho.visible = false;
    c.g.add(corcho);
    let caidos = 0, hecho = false;
    c.mantener(boton, () => {
      if (hecho) return;
      const p = enMira(0.08);
      void c.escena.animar(120, (q) => (boton.children[1].position.y = 0.04 - Math.sin(q * Math.PI) * 0.02));
      sonido.rumor(0.06, 900, 0.06);
      corcho.visible = true;
      const a = new THREE.Vector3(1.15, 1.05, 0.4), b = new THREE.Vector3(cx, yP + 0.08, zP + 0.05);
      void c.escena.animar(140, (q) => corcho.position.lerpVectors(a, b, q)).then(() => (corcho.visible = false));
      if (p && p.userData.corazon && !p.userData.caido) {
        p.userData.caido = true;
        caidos++;
        vel *= 1.12;
        sonido.nota(1320, 0.12, 0.1, 'triangle', 0.08);
        void c.escena.animar(260, (q) => (p.userData.cuerpo.rotation.z = q * 1.35));
        if (caidos === 3) {
          hecho = true;
          c.bien();
          k.visible = true;
          void c.escena.animar(400, (q) => k.scale.setScalar(0.3 + 0.7 * q));
        }
      } else if (p && !p.userData.caido) {
        sonido.nota(300, 0.12, 0.1, 'square', 0.04);
        void c.escena.animar(400, (q) => (p.userData.cuerpo.rotation.y = q * Math.PI * 2));
        c.mal();
      } else sonido.nota(180, 0.1, 0.12, 'sine', 0.03);
    }, () => {});
    llaveParaLaPuerta(c, k);
  },
  async prueba(p) {
    const m = p.obj('mira');
    for (let i = 0; i < 3; i++) {
      await p.esperarQue(() => (m.userData.enMira as () => boolean)(), 120000);
      await p.tocar('boton pum');
      await p.esperar(400);
    }
    await p.esperarQue(() => p.obj('llave').visible, 8000);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 62 · La rueda de colores
// ---------------------------------------------------------------------------
const COLORES_RUEDA = ['#e4574b', '#F7C948', '#8FD6B9', '#8EC5F0', '#b48ef0', '#F59FC0'];
const ROSADO = 5;
const rueda: Nivel = {
  titulo: 'La rueda de colores',
  pistas: [
    'Esa rueda está toda revuelta.',
    'Los tres anillos giran por separado, arrastrando en círculo sobre cada uno. La banderita de arriba tiene algo que decir.',
    'Deja los colores de los tres anillos alineados en cada rayo, con el color de la banderita arriba.',
  ],
  montar(c) {
    const C = new THREE.Vector3(1.75, 1.5, 0.1);
    const radios: [number, number][] = [[0.1, 0.25], [0.27, 0.42], [0.44, 0.6]];
    const inicial = [3, 5, 0];
    const pasos = [...inicial];
    const angs = inicial.map((s) => (s * Math.PI) / 3);
    const anillos = radios.map(([r0, r1], k) => {
      const a = grupo(`anillo ${k}`);
      COLORES_RUEDA.forEach((col, j) => {
        const centro = Math.PI / 2 + (j * Math.PI) / 3;
        const seg = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 10, 1, centro - Math.PI / 6 + 0.02, Math.PI / 3 - 0.04), mat(col, { lados: THREE.DoubleSide }));
        a.add(seg);
      });
      a.position.copy(C).add(new THREE.Vector3(0, 0, 0.005 * k));
      a.rotation.z = angs[k];
      c.g.add(a);
      return a;
    });
    const fondo = new THREE.Mesh(new THREE.CircleGeometry(0.64, 40), mat('#3d2b27'));
    en(fondo, C.x, C.y, C.z - 0.02);
    c.g.add(fondo);
    const cubo = cilindro(0.08, 0.08, 0.05, mat('#d9b25a', { metal: 0.6, rough: 0.3 }));
    cubo.rotation.x = Math.PI / 2;
    en(cubo, C.x, C.y, C.z + 0.03);
    c.g.add(cubo);
    // Bombillos alrededor
    const bombillos = Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2;
      const b = esfera(0.022, new THREE.MeshBasicMaterial({ color: '#8a7a6a' }), undefined, 8);
      en(b, C.x + Math.cos(a) * 0.63, C.y + Math.sin(a) * 0.63, C.z + 0.01);
      c.g.add(b);
      return b;
    });
    // Flechita y banderita arriba
    const flecha = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 3), mat('#fff3e0'));
    flecha.rotation.z = Math.PI;
    en(flecha, C.x, C.y + 0.68, C.z + 0.02);
    c.g.add(flecha);
    c.g.add(en(cilindro(0.012, 0.012, 0.4, mat('#8a6a55')), C.x, C.y + 0.92, C.z));
    const bandera = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.24, -0.07), new THREE.Vector2(0, -0.14)])), mat(COLORES_RUEDA[ROSADO], { lados: THREE.DoubleSide }));
    en(bandera, C.x + 0.01, C.y + 1.1, C.z);
    bandera.name = 'bandera';
    c.g.add(bandera);
    const area = new THREE.Mesh(new THREE.CircleGeometry(0.64, 32), new THREE.MeshBasicMaterial({ visible: false }));
    area.name = 'rueda toque';
    en(area, C.x, C.y, C.z + 0.06);
    c.g.add(area);
    const k = llave('llave', '#f2c75c', false);
    k.scale.setScalar(1.3);
    en(k, C.x, C.y, C.z + 0.12);
    k.visible = false;
    c.g.add(k);
    const info = grupo('rueda colores');
    c.g.add(info);
    info.userData.pasos = () => pasos;
    info.userData.girando = false;
    let sel: number | null = null, previo: number | null = null, hecho = false;
    const plano = new THREE.Plane(new THREE.Vector3(0, 0, 1), -(C.z + 0.06));
    const listo = () => pasos.every((s) => ((s - 1) % 6 + 6) % 6 === 0);
    const soltar = () => {
      if (sel === null || hecho) return;
      const kk = sel;
      sel = null;
      previo = null;
      const paso = Math.PI / 3;
      const meta = Math.round(angs[kk] / paso) * paso;
      const a0 = angs[kk];
      info.userData.girando = true;
      void c.escena.animar(160, (q) => {
        angs[kk] = a0 + (meta - a0) * q;
        anillos[kk].rotation.z = angs[kk];
      }).then(() => {
        pasos[kk] = Math.round(meta / paso);
        info.userData.girando = false;
        sonido.nota(900 + kk * 120, 0.04, 0, 'square', 0.04);
        if (listo() && !hecho) {
          hecho = true;
          c.bien();
          const base = [...angs];
          void c.escena.animar(1500, (q) => anillos.forEach((a, i) => (a.rotation.z = base[i] + q * Math.PI * 2)));
          c.cada((_, tt) => bombillos.forEach((b, i) => (b.material as THREE.MeshBasicMaterial).color.set(COLORES_RUEDA[(i + Math.floor(tt * 8)) % 6])));
          c.despues(900, () => {
            k.visible = true;
            void c.escena.animar(400, (q) => k.scale.setScalar(1.3 * (0.3 + 0.7 * q)));
          });
        }
      });
    };
    c.mantener(area, (hit) => {
      if (hecho || info.userData.girando) return;
      const d = Math.hypot(hit.point.x - C.x, hit.point.y - C.y);
      sel = d < 0.26 ? 0 : d < 0.43 ? 1 : 2;
      previo = Math.atan2(hit.point.y - C.y, hit.point.x - C.x);
    }, soltar);
    c.gesto.mover((x, y, abajo) => {
      if (!abajo || sel === null || previo === null) return;
      const pt = c.enPlano(x, y, plano);
      if (!pt) return;
      const a = Math.atan2(pt.y - C.y, pt.x - C.x);
      angs[sel] += difAng(a, previo);
      previo = a;
      anillos[sel].rotation.z = angs[sel];
    });
    c.gesto.giro((d) => {
      if (hecho) return;
      sel ??= 2;
      angs[sel] -= d;
      anillos[sel].rotation.z = angs[sel];
    });
    c.gesto.dedos((n) => n === 0 && soltar());
    llaveParaLaPuerta(c, k);
  },
  async prueba(p) {
    const info = p.obj('rueda colores');
    const pasos = info.userData.pasos as () => number[];
    const C = new THREE.Vector3(1.75, 1.5, 0.16);
    const radios = [0.18, 0.35, 0.52];
    for (let r = 0; r < 3; r++) {
      for (let i = 0; i < 6 && ((pasos()[r] - 1) % 6 + 6) % 6 !== 0; i++) {
        const a0 = -Math.PI / 6, a1 = Math.PI / 6;
        const punto = (a: number) => C.clone().add(new THREE.Vector3(Math.cos(a) * radios[r], Math.sin(a) * radios[r], 0));
        await p.arrastrarDesde(punto(a0), punto(a1), 10);
        await p.esperarQue(() => !info.userData.girando, 8000);
        await p.esperar(150);
      }
    }
    await p.esperarQue(() => p.obj('llave').visible, 20000);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 63 · Algodón de azúcar
// ---------------------------------------------------------------------------
const VUELTAS_ALGODON = 6;
const algodon: Nivel = {
  titulo: 'Algodón de azúcar',
  pistas: [
    'La máquina de algodón está esperando.',
    'El algodón crece dando vueltas con el dedo sobre la olla. El letrero dice hacia dónde.',
    'Dibuja círculos seguidos sobre la olla en el sentido de la flecha del letrero; al revés se deshace.',
  ],
  montar(c) {
    const O = new THREE.Vector3(1.55, 0.8, 0.95);
    const carrito = grupo('carrito algodon');
    const cuerpo = letrero(0.9, 0.72, (cv, w, h) => rayas(cv, w, h, '#F59FC0', '#fff3e0', 8));
    en(cuerpo, 0, 0.4, 0.281);
    carrito.add(en(caja(0.9, 0.72, 0.56, mat('#fff3e0'), 0.03), 0, 0.4, 0), cuerpo, en(caja(0.96, 0.05, 0.62, mat('#F59FC0'), 0.02), 0, 0.78, 0));
    for (const s of [-1, 1]) {
      const rueda = cilindro(0.1, 0.1, 0.05, mat('#3d2b27'));
      rueda.rotation.z = Math.PI / 2;
      carrito.add(en(rueda, s * 0.47, 0.1, 0.12), en(cilindro(0.04, 0.04, 0.06, mat('#F59FC0')), s * 0.47, 0.1, 0.12));
      (carrito.children[carrito.children.length - 1] as THREE.Object3D).rotation.z = Math.PI / 2;
    }
    en(carrito, O.x, 0, O.z);
    c.g.add(carrito);
    const letra = letrero(0.62, 0.22, (cv, w, h) => {
      cv.fillStyle = '#fff8ee';
      cv.fillRect(0, 0, w, h);
      textoEn(cv, 'ALGODÓN', w * 0.42, h * 0.52, h * 0.44, '#e4574b', 700);
      // Flecha en círculo como el reloj
      const x = w * 0.86, y = h * 0.5, r = h * 0.28;
      cv.strokeStyle = '#3d2b27';
      cv.lineWidth = 7;
      cv.beginPath();
      cv.arc(x, y, r, -Math.PI * 0.6, Math.PI * 1.1);
      cv.stroke();
      const a = Math.PI * 1.1;
      cv.fillStyle = '#3d2b27';
      cv.beginPath();
      cv.moveTo(x + Math.cos(a) * r - 12, y + Math.sin(a) * r);
      cv.lineTo(x + Math.cos(a) * r + 12, y + Math.sin(a) * r);
      cv.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r - 14);
      cv.fill();
    });
    en(letra, O.x, 0.55, O.z + 0.3);
    c.g.add(letra);
    // La olla
    const perfil = [new THREE.Vector2(0.1, 0), new THREE.Vector2(0.28, 0.04), new THREE.Vector2(0.34, 0.18), new THREE.Vector2(0.35, 0.2)];
    const olla = new THREE.Mesh(new THREE.LatheGeometry(perfil, 32), mat('#d7dee6', { metal: 0.6, rough: 0.25, lados: THREE.DoubleSide }));
    en(olla, O.x, O.y, O.z);
    c.g.add(olla);
    const giro = grupo();
    giro.add(cilindro(0.09, 0.1, 0.06, mat('#b8bcc4', { metal: 0.6 })), en(caja(0.18, 0.02, 0.03, mat('#8a94a0'), 0.005), 0, 0.04, 0));
    en(giro, O.x, O.y + 0.03, O.z);
    c.g.add(giro);
    const palo = grupo('algodon');
    palo.add(en(cilindro(0.01, 0.01, 0.45, mat('#fff3e0')), 0, 0.22, 0));
    const nube = grupo();
    const rosa = mat('#F7B6CF', { rough: 1 });
    for (const [x, y, z, r] of [[0, 0, 0, 0.16], [0.09, 0.03, 0.04, 0.11], [-0.09, 0.04, -0.03, 0.11], [0.02, 0.11, 0.02, 0.1], [-0.02, -0.06, 0.08, 0.1]]) nube.add(en(esfera(r, rosa, undefined, 12), x, y, z));
    en(nube, 0, 0.42, 0);
    nube.scale.setScalar(0.05);
    palo.add(nube);
    const k = llave('llave', '#f2c75c', false);
    k.scale.setScalar(0.9);
    en(k, 0.05, 0.4, 0.17);
    k.visible = false;
    palo.add(k, en(toque(0.25), 0, 0.42, 0));
    en(palo, O.x, O.y - 0.05, O.z);
    c.g.add(palo);
    const area = toque(0.42, 'olla toque');
    en(area, O.x, O.y + 0.12, O.z);
    c.g.add(area);
    let progreso = 0, activo = false, previo: number | null = null, hecho = false, avisado = false;
    let centro = { x: 0, y: 0 };
    palo.userData.progreso = () => progreso;
    c.mantener(area, () => {
      if (hecho) return;
      activo = true;
      previo = null;
      centro = c.escena.aPantalla(O.clone().add(new THREE.Vector3(0, 0.12, 0)));
    }, () => (activo = false));
    let ultimoSonido = 0;
    c.gesto.mover((x, y, abajo) => {
      if (!abajo || !activo || hecho) return;
      const a = Math.atan2(y - centro.y, x - centro.x);
      if (previo === null) {
        previo = a;
        return;
      }
      const d = difAng(a, previo);
      previo = a;
      progreso = Math.max(0, progreso + d / (Math.PI * 2));
      if (d < -0.3 && !avisado && progreso < 1) {
        avisado = true;
        c.aviso('¡Uy! Al revés el algodón se deshace.', 2600);
      }
      giro.rotation.y -= d * 2;
      const k2 = Math.min(1, progreso / VUELTAS_ALGODON);
      nube.scale.setScalar(0.05 + 0.95 * k2);
      if (Math.floor(progreso * 4) !== ultimoSonido) {
        ultimoSonido = Math.floor(progreso * 4);
        sonido.rumor(0.12, 2400, 0.025);
      }
      if (progreso >= VUELTAS_ALGODON) {
        hecho = true;
        activo = false;
        c.bien();
        k.visible = true;
        const y0 = palo.position.y;
        void c.escena.animar(900, (q) => (palo.position.y = y0 + q * 0.4));
      }
    });
    c.tocar(palo, () => {
      if (!hecho || c.tiene('llave')) return;
      c.dar('llave', k);
    });
    c.conLlave();
  },
  async prueba(p) {
    const s = p.pantalla('olla toque');
    const pts: [number, number][] = [[s.x / innerWidth, s.y / innerHeight]];
    const r = 30;
    for (let i = 0; i <= 7.5 * 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      pts.push([(s.x + Math.cos(a) * r) / innerWidth, (s.y + Math.sin(a) * r) / innerHeight]);
    }
    await p.trazar(pts, 4500);
    await p.esperarQue(() => p.obj('llave').visible, 8000);
    await p.esperar(1500);
    await p.tocar('algodon');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 64 · La máquina de peluches
// ---------------------------------------------------------------------------
function osito(nombre: string, color: string) {
  const g = grupo(nombre);
  const m = mat(color, { rough: 1 });
  const cuerpo = esfera(0.085, m, undefined, 12);
  cuerpo.scale.set(1, 1.1, 0.9);
  en(cuerpo, 0, 0.085, 0);
  const cabeza = esfera(0.065, m, undefined, 12);
  en(cabeza, 0, 0.21, 0);
  g.add(cuerpo, cabeza, en(esfera(0.025, m, undefined, 8), -0.05, 0.26, 0), en(esfera(0.025, m, undefined, 8), 0.05, 0.26, 0));
  g.add(en(esfera(0.022, mat('#fff3e0'), undefined, 8), 0, 0.195, 0.055), en(esfera(0.008, mat('#3d2b27'), undefined, 6), -0.022, 0.225, 0.058), en(esfera(0.008, mat('#3d2b27'), undefined, 6), 0.022, 0.225, 0.058));
  return g;
}

const PELUCHES = { minX: 1.35, maxX: 2.25, oso: 2.05, pal0: 1.98, pal1: 2.22 };
const peluches: Nivel = {
  titulo: 'La máquina de peluches',
  pistas: [
    'Uno de esos peluches tiene algo que no es de peluche.',
    'La garra se mueve inclinando el celular (o con la palanca) y el botón rojo la baja.',
    'Centra la garra justo encima del peluche que tiene algo brillante y toca el botón.',
  ],
  montar(c) {
    const X = 1.8, Z = 0.75, P = PELUCHES;
    c.g.add(en(caja(1.1, 0.8, 0.6, mat('#e4574b'), 0.03), X, 0.4, Z));
    c.g.add(en(caja(1.14, 0.06, 0.3, mat('#fff3e0'), 0.02), X, 0.83, Z + 0.44));
    for (const x of [X - 0.55, X + 0.55]) for (const z of [Z - 0.3, Z + 0.3]) c.g.add(en(caja(0.05, 1.2, 0.05, mat('#fff3e0'), 0.01), x, 1.4, z));
    c.g.add(en(caja(1.1, 1.2, 0.02, mat('#f7d6e0'), 0.005), X, 1.4, Z - 0.3));
    const vidrio = new THREE.MeshStandardMaterial({ color: '#dff1fb', transparent: true, opacity: 0.12, roughness: 0.05, depthWrite: false });
    const frente = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.2), vidrio);
    en(frente, X, 1.4, Z + 0.3);
    c.g.add(frente);
    c.g.add(en(caja(1.1, 0.26, 0.6, mat('#e4574b'), 0.03), X, 2.13, Z));
    c.g.add(en(letrero(1.0, 0.2, (cv, w, h) => {
      cv.fillStyle = '#fff8ee';
      cv.fillRect(0, 0, w, h);
      textoEn(cv, 'ATRAPA UN PELUCHE', w / 2, h / 2 + 2, h * 0.5, '#e4574b', 700);
    }), X, 2.13, Z + 0.31));
    // Salida del premio: tabique y hueco a la izquierda
    c.g.add(en(caja(0.02, 0.3, 0.58, vidrio, 0), 1.52, 0.95, Z));
    const hueco = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.5), mat('#3d2b27'));
    hueco.rotation.x = -Math.PI / 2;
    en(hueco, 1.4, 0.805, Z);
    c.g.add(hueco);
    c.g.add(en(caja(0.3, 0.22, 0.02, mat('#3d2b27'), 0.01), 1.4, 0.2, Z + 0.305));
    c.g.add(en(letrero(0.3, 0.07, (cv, w, h) => textoEn(cv, 'PREMIO', w / 2, h / 2 + 2, h * 0.7, '#fff8ee', 700), undefined, { transparente: true }), 1.4, 0.36, Z + 0.31));
    // Peluches
    const pos = [[1.62, '#F59FC0'], [1.84, '#8EC5F0'], [P.oso, '#b07a4f'], [2.24, '#F7C948']] as [number, string][];
    const osos = pos.map(([x, col], i) => {
      const o = osito(i === 2 ? 'oso llave' : `peluche ${i}`, col);
      en(o, x, 0.8, Z - 0.02 + (i % 2) * 0.06);
      c.g.add(o);
      return o;
    });
    const oso = osos[2];
    const k = llave('llave', '#f2c75c', false);
    k.scale.setScalar(0.8);
    en(k, 0.06, 0.1, 0.09);
    oso.add(k);
    // Garra
    c.g.add(en(caja(1.0, 0.03, 0.04, mat('#8a94a0', { metal: 0.6 }), 0.01), X, 1.94, Z));
    const garra = grupo('garra');
    const carro = caja(0.1, 0.06, 0.08, mat('#b8bcc4', { metal: 0.6 }), 0.02);
    const cable = cilindro(0.006, 0.006, 1, mat('#3d2b27'));
    const mano = grupo();
    mano.add(esfera(0.04, mat('#b8bcc4', { metal: 0.7, rough: 0.3 }), undefined, 12));
    const dedos = [0, 1, 2].map((i) => {
      const piv = grupo();
      piv.rotation.y = (i / 3) * Math.PI * 2;
      const dedo = grupo();
      dedo.add(en(caja(0.015, 0.12, 0.015, mat('#b8bcc4', { metal: 0.7 }), 0.005), 0, -0.06, 0));
      en(dedo, 0, 0, 0.035);
      dedo.rotation.x = 0.45;
      piv.add(dedo);
      mano.add(piv);
      return dedo;
    });
    garra.add(carro, cable, mano);
    c.g.add(garra);
    let gx = P.minX, gy = 1.7, cerrada = 0;
    const ponerGarra = () => {
      carro.position.set(gx, 1.92, Z);
      mano.position.set(gx, gy, Z);
      cable.position.set(gx, (1.92 + gy) / 2, Z);
      cable.scale.y = Math.max(0.01, 1.92 - gy);
      dedos.forEach((d) => (d.rotation.x = 0.45 - cerrada * 0.55));
    };
    ponerGarra();
    garra.userData.x = () => gx;
    garra.userData.premio = false;
    // Controles: palanca y botón
    c.g.add(en(cilindro(0.05, 0.06, 0.04, mat('#3d2b27')), 2.1, 0.88, Z + 0.46));
    const palanca = grupo('palanca');
    palanca.add(esfera(0.045, matNuevo('#e4574b'), undefined, 14), toque(0.1));
    const pal0 = P.pal0 + ((gx - P.minX) / (P.maxX - P.minX)) * (P.pal1 - P.pal0);
    en(palanca, pal0, 1.0, Z + 0.46);
    c.g.add(palanca);
    const vara = cilindro(0.01, 0.01, 0.13, mat('#3d2b27'));
    c.g.add(vara);
    const boton = grupo('boton garra');
    boton.add(cilindro(0.065, 0.075, 0.05, mat('#fff3e0')), en(cilindro(0.05, 0.05, 0.05, matNuevo('#43b36b')), 0, 0.035, 0), toque(0.11));
    en(boton, 1.62, 0.89, Z + 0.46);
    c.g.add(boton);
    const aPal = (x: number) => P.pal0 + ((x - P.minX) / (P.maxX - P.minX)) * (P.pal1 - P.pal0);
    const deP = (px: number) => P.minX + ((px - P.pal0) / (P.pal1 - P.pal0)) * (P.maxX - P.minX);
    let arrastrando = false, ocupada = false, hecho = false, fuera = false;
    c.arrastrar(palanca, {
      plano: new THREE.Plane(new THREE.Vector3(0, 0, 1), -(Z + 0.46)),
      limites: limites(P.pal0, 1.0, Z + 0.46, P.pal1, 1.0, Z + 0.46),
      alTomar: () => (arrastrando = true),
      alSoltar: () => (arrastrando = false),
    });
    c.cada((dt) => {
      const inc = c.sensores.inclinacion.x;
      if (!ocupada) {
        if (c.sensores.hayMovimiento && !arrastrando && Math.abs(inc) > 0.08) {
          gx = THREE.MathUtils.clamp(gx + inc * 0.8 * dt, P.minX, P.maxX);
          palanca.position.x = aPal(gx);
        } else {
          const meta = deP(palanca.position.x);
          const paso = 0.7 * dt;
          gx += THREE.MathUtils.clamp(meta - gx, -paso, paso);
        }
      }
      vara.position.set((palanca.position.x + 2.1) / 2, 0.94, Z + 0.46);
      vara.rotation.z = Math.atan2(2.1 - palanca.position.x, 0.12);
      ponerGarra();
    });
    const bajarGarra = async () => {
      ocupada = true;
      sonido.nota(520, 0.3, 0, 'triangle', 0.04);
      await c.escena.animar(700, (q) => (gy = 1.7 - q * 0.62));
      await c.escena.animar(250, (q) => (cerrada = q));
      const agarra = !hecho && Math.abs(gx - P.oso) < 0.08;
      const otro = osos.find((o) => o !== oso && Math.abs(o.position.x - gx) < 0.08);
      if (agarra) {
        const dx = oso.position.x - gx;
        await c.escena.animar(700, (q) => {
          gy = 1.08 + q * 0.62;
          oso.position.set(gx + dx * (1 - q), 0.8 + q * 0.62 - 0.02, oso.position.z);
        });
        const x0 = gx;
        await c.escena.animar(Math.max(300, (x0 - P.minX) * 1400), (q) => {
          gx = x0 + (P.minX - x0) * q;
          oso.position.x = gx;
        });
        palanca.position.x = aPal(gx);
        await c.escena.animar(200, (q) => (cerrada = 1 - q));
        sonido.nota(784, 0.12, 0, 'sine', 0.08);
        await c.escena.animar(450, (q) => (oso.position.y = 1.4 - q * 1.35));
        // Sale por la puertita del premio
        hecho = true;
        oso.position.set(1.4, 0.06, Z + 0.42);
        oso.rotation.y = 0.2;
        void c.escena.animar(300, (q) => oso.scale.setScalar(0.6 + 0.4 * q));
        fuera = true;
        garra.userData.premio = true;
        c.bien();
      } else {
        if (otro) {
          const y0 = otro.position.y;
          await c.escena.animar(500, (q) => {
            gy = 1.08 + q * 0.3;
            otro.position.y = y0 + q * 0.28;
          });
          sonido.nota(260, 0.2, 0, 'square', 0.04);
          await c.escena.animar(300, (q) => (otro.position.y = y0 + 0.28 * (1 - q)));
        }
        await c.escena.animar(600, (q) => (gy = Math.min(1.7, gy + q * (1.7 - gy))));
        await c.escena.animar(200, (q) => (cerrada = 1 - q));
        c.mal();
      }
      gy = 1.7;
      cerrada = 0;
      ocupada = false;
    };
    c.tocar(boton, () => {
      if (ocupada || hecho) return;
      void c.escena.animar(120, (q) => (boton.children[1].position.y = 0.035 - Math.sin(q * Math.PI) * 0.02));
      void bajarGarra();
    });
    llaveParaLaPuerta(c, k, () => fuera);
  },
  async prueba(p) {
    p.sensor.soltar();
    const g = p.obj('garra');
    const P = PELUCHES;
    const meta = P.pal0 + ((P.oso - P.minX) / (P.maxX - P.minX)) * (P.pal1 - P.pal0);
    await p.arrastrar('palanca', new THREE.Vector3(meta, 1.0, 1.21));
    await p.esperarQue(() => Math.abs((g.userData.x as () => number)() - P.oso) < 0.04, 30000);
    await p.tocar('boton garra');
    await p.esperarQue(() => !!g.userData.premio, 60000);
    await p.esperar(600);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 65 · El martillo de fuerza
// ---------------------------------------------------------------------------
const FUERZA = { meta: 16, max: 24, baja: 1.2 };
const martillo: Nivel = {
  titulo: 'El martillo de fuerza',
  pistas: [
    'La campana de arriba nunca ha sonado.',
    'El mazo necesita impulso antes del golpe: fíjate en las luces de la torre.',
    'Toca el mazo muy rápido hasta que casi todas las luces estén prendidas, y ahí mismo desliza hacia abajo.',
  ],
  montar(c) {
    const X = 2.1;
    c.g.add(en(caja(0.7, 0.06, 0.6, mat('#e4574b'), 0.02), X, 0.03, 0.85));
    c.g.add(en(caja(0.3, 0.1, 0.3, mat('#3d2b27'), 0.03), X, 0.1, 0.95));
    c.g.add(en(caja(0.22, 2.55, 0.08, mat('#fff3e0'), 0.03), X, 1.35, 0.55));
    const escala = letrero(0.18, 2.3, (cv, w, h) => {
      const gr = cv.createLinearGradient(0, h, 0, 0);
      gr.addColorStop(0, '#8FD6B9');
      gr.addColorStop(0.5, '#F7C948');
      gr.addColorStop(1, '#e4574b');
      cv.fillStyle = gr;
      cv.fillRect(w * 0.35, 0, w * 0.3, h);
      const marcas = ['CAMPEÓN', 'FUERTE', 'BIEN', 'FLOJITO', 'UY'];
      marcas.forEach((m, i) => {
        cv.save();
        cv.translate(w * 0.5, (h * (i + 0.5)) / marcas.length);
        cv.rotate(-Math.PI / 2);
        textoEn(cv, m, 0, 0, w * 0.2, '#3d2b27', 700);
        cv.restore();
      });
    }, undefined, { px: 512 });
    en(escala, X, 1.4, 0.6);
    c.g.add(escala);
    const disco = caja(0.2, 0.06, 0.05, mat('#3b2f6c'), 0.015);
    en(disco, X, 0.25, 0.63);
    c.g.add(disco);
    const campana = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#d9b25a', { metal: 0.8, rough: 0.25, lados: THREE.DoubleSide }));
    en(campana, X, 2.66, 0.58);
    c.g.add(campana);
    const luces = Array.from({ length: 10 }, (_, i) => {
      const l = esfera(0.03, new THREE.MeshBasicMaterial({ color: '#6a5a50' }), undefined, 8);
      en(l, X - 0.17, 0.35 + i * 0.22, 0.58);
      c.g.add(l);
      return l;
    });
    // El mazo (gira desde el mango)
    const mazo = grupo('mazo');
    const brazo = grupo();
    const largo = 1.0;
    const mango = cilindro(0.025, 0.03, largo, mat('#c49468'));
    en(mango, 0, -largo / 2, 0);
    const cabeza = cilindro(0.1, 0.1, 0.28, mat('#8a6a55'));
    cabeza.rotation.z = Math.PI / 2;
    en(cabeza, 0, -largo, 0);
    brazo.add(mango, cabeza, en(toque(0.3), 0, -largo, 0), en(toque(0.22), 0, -largo / 2, 0));
    mazo.add(brazo);
    const G = new THREE.Vector3(X - 0.6, 0.95, 1.0);
    en(mazo, G.x, G.y, G.z);
    const reposo = Math.atan2(0.6, 0.8);
    brazo.rotation.z = reposo;
    c.g.add(mazo);
    const k = llave('llave', '#f2c75c', true);
    en(k, X, 2.6, 1.0);
    k.visible = false;
    c.g.add(k);
    let carga = 0, golpeando = false, hecho = false;
    // Cuenta al bajar el dedo: dándole rápido el dedo se corre y el toque no se perdía por eso
    c.mantener(
      mazo,
      () => {
        if (golpeando || hecho) return;
        carga = Math.min(FUERZA.max, carga + 1);
        sonido.nota(200 + carga * 25, 0.05, 0, 'square', 0.03);
      },
      () => {},
    );
    c.cada((dt) => {
      if (!golpeando) {
        carga = Math.max(0, carga - FUERZA.baja * dt);
        brazo.rotation.z = reposo + (carga / FUERZA.max) * 1.7;
      }
      const n = Math.round((carga / FUERZA.max) * 10);
      luces.forEach((l, i) => (l.material as THREE.MeshBasicMaterial).color.set(i < n ? (i >= 7 ? '#ff6a5a' : i >= 4 ? '#ffd86a' : '#9ff0c8') : '#6a5a50'));
    });
    mazo.userData.carga = () => carga;
    const golpear = async () => {
      golpeando = true;
      const f = carga / FUERZA.meta;
      const r0 = brazo.rotation.z;
      await c.escena.animar(140, (q) => (brazo.rotation.z = r0 + (reposo - r0) * q), (q) => q * q);
      sonido.rumor(0.12, 300, 0.12);
      c.escena.temblar(0.02, 200);
      const tope = 0.25 + Math.min(1, f) * 2.33;
      await c.escena.animar(500, (q) => (disco.position.y = 0.25 + (tope - 0.25) * q), (q) => 1 - (1 - q) * (1 - q));
      if (f >= 1) {
        hecho = true;
        sonido.nota(1568, 0.6, 0, 'sine', 0.12);
        sonido.nota(2093, 0.8, 0.12, 'sine', 0.08);
        c.bien();
        k.visible = true;
        await c.escena.animar(700, (q) => k.position.set(X, 2.6 - q * 2.45, 1.0 + q * 0.2), (q) => q * q);
      } else {
        sonido.nota(220, 0.2, 0, 'triangle', 0.05);
        c.mal();
      }
      await c.escena.animar(500, (q) => (disco.position.y = tope + (0.25 - tope) * q));
      carga = 0;
      golpeando = false;
    };
    c.gesto.deslizar((dir) => {
      if (dir === 'abajo' && !golpeando && !hecho) void golpear();
    });
    llaveParaLaPuerta(c, k);
  },
  async prueba(p) {
    await p.tocar('mazo', 26, 50);
    await p.deslizar('abajo', 'mazo', 220);
    await p.esperarQue(() => p.obj('llave').visible, 15000);
    await p.esperar(2000);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 66 · Las cartas de la adivina
// ---------------------------------------------------------------------------
const SIMBOLOS = ['☾', '★', '♥', '☀'];
const NUMERO: Record<string, string> = { '☾': '3', '★': '1', '♥': '7', '☀': '5' };
const ORDEN_BOLA = ['♥', '☾', '☀', '★'];
const cartas: Nivel = {
  titulo: 'Las cartas de la adivina',
  pistas: [
    'La adivina dejó el juego a medias.',
    'Destapa las cartas de a dos y encuentra las parejas. La bola de cristal ayuda al final.',
    'Con todas las parejas halladas, la bola muestra un orden de símbolos; cada símbolo trae su número en la esquina de la carta.',
  ],
  montar(c) {
    const fondo = letrero(1.6, 1.12, (cv, w, h) => {
      cv.fillStyle = '#3b2f6c';
      cv.fillRect(0, 0, w, h);
      cv.fillStyle = 'rgba(255,240,200,0.5)';
      for (let i = 0; i < 40; i++) cv.fillRect((i * 97) % w, (i * 53) % h, 3, 3);
      textoEn(cv, 'LA ADIVINA', w / 2, h * 0.06, h * 0.07, '#F7C948', 700);
    });
    en(fondo, 1.8, 1.47, 0.02);
    c.g.add(fondo);
    const orden = [0, 0, 1, 1, 2, 2, 3, 3];
    for (let i = orden.length - 1; i > 0; i--) {
      const j = Math.floor(c.azar() * (i + 1));
      [orden[i], orden[j]] = [orden[j], orden[i]];
    }
    const dorso = (cv: CanvasRenderingContext2D, w: number, h: number) => {
      cv.fillStyle = '#6b3f7a';
      cv.fillRect(0, 0, w, h);
      cv.strokeStyle = '#F7C948';
      cv.lineWidth = 8;
      cv.strokeRect(10, 10, w - 20, h - 20);
      textoEn(cv, '☾', w / 2, h / 2, h * 0.35, '#F7C948', 700);
    };
    const frente = (s: string) => (cv: CanvasRenderingContext2D, w: number, h: number) => {
      cv.fillStyle = '#fff8ee';
      cv.fillRect(0, 0, w, h);
      cv.strokeStyle = '#6b3f7a';
      cv.lineWidth = 8;
      cv.strokeRect(10, 10, w - 20, h - 20);
      textoEn(cv, s, w / 2, h / 2 + 6, h * 0.42, s === '♥' ? '#e4574b' : '#3b2f6c', 700);
      textoEn(cv, NUMERO[s], w * 0.2, h * 0.14, h * 0.13, '#3d2b27', 700);
    };
    const lista = orden.map((o, i) => {
      const s = SIMBOLOS[o];
      const g = grupo(`carta ${i}`);
      const atras = letrero(0.28, 0.4, dorso);
      const adelante = letrero(0.28, 0.4, frente(s));
      adelante.rotation.y = Math.PI;
      en(adelante, 0, 0, -0.002);
      g.add(atras, adelante);
      en(g, 1.26 + (i % 4) * 0.36, i < 4 ? 1.68 : 1.2, 0.06);
      g.userData.simbolo = s;
      c.g.add(g);
      return g;
    });
    // La mesa con la bola de cristal
    const mesa = mesaRedonda(0.34, 0.72, '#6b3f7a', 'mesa adivina');
    en(mesa, -0.95, 0, 1.3);
    c.g.add(mesa);
    c.g.add(en(toro(0.1, 0.03, mat('#d9b25a', { metal: 0.7, rough: 0.3 })), -0.95, 0.76, 1.3));
    (c.g.children[c.g.children.length - 1] as THREE.Object3D).rotation.x = Math.PI / 2;
    const bolaMat = new THREE.MeshStandardMaterial({ color: '#bfe3ff', transparent: true, opacity: 0.6, roughness: 0.05, emissive: '#6aa0ff', emissiveIntensity: 0.25 });
    const bola = new THREE.Mesh(new THREE.SphereGeometry(0.17, 28, 20), bolaMat);
    bola.name = 'bola';
    en(bola, -0.95, 0.94, 1.3);
    c.g.add(bola);
    const visor = letrero(0.26, 0.09, (cv, w, h) => {
      cv.clearRect(0, 0, w, h);
    }, undefined, { transparente: true, brillo: 0.8 });
    en(visor, -0.95, 0.95, 1.48);
    visor.lookAt(new THREE.Vector3(0, 1.5, 4.3));
    visor.visible = false;
    c.g.add(visor);
    const pintarVisor = () => {
      const t = (visor.material as THREE.MeshStandardMaterial).map as THREE.CanvasTexture;
      const cv = (t.image as HTMLCanvasElement).getContext('2d')!;
      const { width: w, height: h } = cv.canvas;
      cv.clearRect(0, 0, w, h);
      textoEn(cv, ORDEN_BOLA.join(' '), w / 2, h / 2 + 4, h * 0.75, '#3b2f6c', 700);
      t.needsUpdate = true;
    };
    tecladoPared(c, -1.05, 1.3, 0.04, ORDEN_BOLA.map((s) => NUMERO[s]).join(''), 'Candado de la adivina');
    let arriba: THREE.Object3D[] = [];
    let bloqueo = false, parejas = 0;
    const voltear = (g: THREE.Object3D, a: boolean) => {
      const r0 = g.rotation.y, r1 = a ? Math.PI : 0;
      return c.escena.animar(260, (q) => (g.rotation.y = r0 + (r1 - r0) * q));
    };
    for (const g of lista) {
      c.tocar(g, () => {
        if (bloqueo || g.userData.arriba || g.userData.hecha) return;
        g.userData.arriba = true;
        sonido.nota(700, 0.05, 0, 'sine', 0.05);
        void voltear(g, true);
        arriba.push(g);
        if (arriba.length < 2) return;
        const [a, b] = arriba;
        arriba = [];
        if (a.userData.simbolo === b.userData.simbolo) {
          a.userData.hecha = b.userData.hecha = true;
          sonido.nota(988, 0.15, 0.2, 'triangle', 0.07);
          if (++parejas === 4) {
            c.bien();
            pintarVisor();
            visor.visible = true;
            bola.userData.lista = true;
            void c.escena.animar(900, (q) => (bolaMat.emissiveIntensity = 0.25 + q * 0.9));
          }
        } else {
          bloqueo = true;
          c.despues(850, () => {
            a.userData.arriba = b.userData.arriba = false;
            void voltear(a, false);
            void voltear(b, false);
            bloqueo = false;
          });
        }
      });
    }
    c.tocar(bola, () => void c.enfocar(bola, 0.9));
  },
  async prueba(p) {
    const lista = Array.from({ length: 8 }, (_, i) => p.obj(`carta ${i}`));
    for (const s of SIMBOLOS) {
      const [a, b] = lista.filter((x) => x.userData.simbolo === s);
      await p.tocar(a);
      await p.esperarQue(() => !!a.userData.arriba, 5000);
      await p.tocar(b);
      await p.esperarQue(() => !!b.userData.hecha, 5000);
      await p.esperar(300);
    }
    await p.esperarQue(() => !!p.obj('bola').userData.lista, 10000);
    await p.tocar('teclado');
    await p.panel(ORDEN_BOLA.map((s) => NUMERO[s]).join(''));
  },
};

// ---------------------------------------------------------------------------
// 67 · Los globos
// ---------------------------------------------------------------------------
const PALABRA = 'BESOS';
const globos: Nivel = {
  titulo: 'Los globos',
  pistas: [
    'Esos globos tienen letras.',
    'El letrero hace una pregunta; los globos tienen la respuesta, pero en desorden.',
    'Revienta los globos en el orden de las letras que responden la pregunta del letrero.',
  ],
  montar(c) {
    c.g.add(en(caja(1.6, 1.3, 0.05, mat('#c49468'), 0.02), 1.8, 1.45, 0.03));
    c.g.add(en(caja(1.7, 0.8, 0.35, mat('#e4574b'), 0.03), 1.8, 0.4, 0.45));
    c.g.add(en(caja(1.8, 0.05, 0.4, mat('#fff3e0'), 0.02), 1.8, 0.82, 0.45));
    const cartel = letrero(1.6, 0.36, () => {}, 'letrero globos', { px: 512 });
    en(cartel, 1.8, 2.34, 0.06);
    c.g.add(cartel);
    let escrito = '';
    const pintarCartel = (ok = false) => {
      const t = (cartel.material as THREE.MeshStandardMaterial).map as THREE.CanvasTexture;
      const cv = (t.image as HTMLCanvasElement).getContext('2d')!;
      const { width: w, height: h } = cv.canvas;
      cv.fillStyle = ok ? '#8FD6B9' : '#fff8ee';
      cv.fillRect(0, 0, w, h);
      textoEn(cv, '¿QUÉ TE DARÍA MIL VECES?', w / 2, h * 0.25, h * 0.3, '#e4574b', 700);
      for (let i = 0; i < PALABRA.length; i++) {
        const x = w / 2 + (i - (PALABRA.length - 1) / 2) * h * 0.42;
        cv.fillStyle = '#3d2b27';
        cv.fillRect(x - h * 0.15, h * 0.86, h * 0.3, 6);
        if (escrito[i]) textoEn(cv, escrito[i], x, h * 0.66, h * 0.34, '#3b2f6c', 700);
      }
      t.needsUpdate = true;
    };
    pintarCartel();
    const letras = ['B', 'E', 'S', 'O', 'S', 'I', 'U', 'P', 'Z'];
    for (let i = letras.length - 1; i > 0; i--) {
      const j = Math.floor(c.azar() * (i + 1));
      [letras[i], letras[j]] = [letras[j], letras[i]];
    }
    const colores = ['#e4574b', '#F7C948', '#8EC5F0', '#F59FC0', '#8FD6B9', '#b48ef0'];
    const lista = letras.map((l, i) => {
      const g = grupo(`globo ${i}`);
      const b = esfera(0.16, matNuevo(colores[i % colores.length], { rough: 0.35 }), undefined, 18);
      b.scale.set(1, 1.18, 1);
      const nudo = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.05, 8), mat(colores[i % colores.length]));
      en(nudo, 0, -0.2, 0);
      const hilo = cilindro(0.003, 0.003, 0.25, mat('#fff3e0'));
      en(hilo, 0, -0.34, 0);
      const letra = letrero(0.18, 0.18, (cv, w, h) => {
        cv.font = `700 ${h * 0.85}px 'Fredoka', system-ui, sans-serif`;
        cv.textAlign = 'center';
        cv.textBaseline = 'middle';
        cv.lineWidth = h * 0.1;
        cv.strokeStyle = '#fff8ee';
        cv.strokeText(l, w / 2, h / 2 + 4);
        cv.fillStyle = '#3d2b27';
        cv.fillText(l, w / 2, h / 2 + 4);
      }, undefined, { transparente: true });
      en(letra, 0, 0.01, 0.17);
      g.add(b, nudo, hilo, letra);
      en(g, 1.35 + (i % 3) * 0.45, 1.02 + Math.floor(i / 3) * 0.44, 0.2);
      g.userData.letra = l;
      c.g.add(g);
      return g;
    });
    const k = llave('llave', '#f2c75c', true);
    en(k, 1.8, 0.87, 0.5);
    k.visible = false;
    c.g.add(k);
    const dardo = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.09, 6), mat('#3d2b27'));
    dardo.rotation.x = -Math.PI / 2;
    dardo.visible = false;
    c.g.add(dardo);
    let bloqueo = false, hecho = false;
    const inflar = () =>
      lista.forEach((g) => {
        g.visible = true;
        g.scale.setScalar(0.2);
        void c.escena.animar(350, (q) => g.scale.setScalar(0.2 + 0.8 * q));
      });
    c.cada((_, t) => lista.forEach((g, i) => (g.rotation.z = Math.sin(t * 1.4 + i) * 0.06)));
    for (const g of lista) {
      c.tocar(g, () => {
        if (bloqueo || hecho || !g.visible) return;
        bloqueo = true;
        dardo.visible = true;
        const a = new THREE.Vector3(1.4, 0.9, 1.6), b = g.position.clone();
        void c.escena.animar(160, (q) => dardo.position.lerpVectors(a, b, q)).then(() => {
          dardo.visible = false;
          sonido.rumor(0.08, 1600, 0.12);
          void c.escena.animar(90, (q) => g.scale.setScalar(1 + q * 0.3)).then(() => {
            g.visible = false;
            g.scale.setScalar(1);
            bloqueo = false;
          });
          if (g.userData.letra === PALABRA[escrito.length]) {
            escrito += g.userData.letra;
            pintarCartel(escrito === PALABRA);
            sonido.nota(660 + escrito.length * 90, 0.1, 0.05, 'triangle', 0.06);
            if (escrito === PALABRA) {
              hecho = true;
              c.bien();
              k.visible = true;
              void c.escena.animar(400, (q) => k.scale.setScalar(0.3 + 0.7 * q));
            }
          } else {
            c.mal();
            bloqueo = true;
            c.despues(700, () => {
              escrito = '';
              pintarCartel();
              inflar();
              bloqueo = false;
            });
          }
        });
      });
    }
    llaveParaLaPuerta(c, k);
  },
  async prueba(p) {
    const lista = Array.from({ length: 9 }, (_, i) => p.obj(`globo ${i}`));
    for (const l of PALABRA) {
      const g = lista.find((x) => x.visible && x.userData.letra === l)!;
      await p.tocar(g);
      await p.esperarQue(() => !g.visible, 8000);
      await p.esperar(250);
    }
    await p.esperarQue(() => p.obj('llave').visible, 8000);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 68 · El carrusel
// ---------------------------------------------------------------------------
function caballito(nombre: string, color: string) {
  const g = grupo(nombre);
  const m = mat(color);
  const cuerpo = caja(0.3, 0.13, 0.11, m, 0.05);
  const cuello = caja(0.07, 0.16, 0.08, m, 0.03);
  cuello.rotation.z = -0.4;
  en(cuello, 0.14, 0.09, 0);
  const cabeza = caja(0.14, 0.07, 0.08, m, 0.03);
  en(cabeza, 0.2, 0.16, 0);
  const crin = caja(0.04, 0.14, 0.03, mat('#fff3e0'), 0.015);
  crin.rotation.z = -0.4;
  en(crin, 0.11, 0.12, 0);
  g.add(cuerpo, cuello, cabeza, crin);
  for (const [x, z] of [[-0.1, -0.035], [-0.1, 0.035], [0.1, -0.035], [0.1, 0.035]]) g.add(en(caja(0.03, 0.14, 0.03, m, 0.01), x, -0.12, z));
  g.add(en(caja(0.1, 0.02, 0.12, mat('#e4574b'), 0.01), -0.02, 0.07, 0));
  return g;
}

const CARRUSEL = { x: 1.95, z: 0.9, r: 0.55, vuelta: 8, sube: 2.4 };
const carrusel: Nivel = {
  titulo: 'El carrusel',
  pistas: [
    'Uno de esos caballitos brilla más que los otros.',
    'El caballito dorado lleva algo, pero solo se alcanza en cierto momento de la vuelta.',
    'Tócalo cuando pase por delante y esté en lo más bajo de su subida.',
  ],
  montar(c) {
    const K = CARRUSEL;
    const base = grupo('carrusel');
    const piso = cilindro(0.75, 0.78, 0.14, mat('#fff3e0'));
    en(piso, 0, 0.07, 0);
    const columna = cilindro(0.09, 0.09, 2.2, mat('#F7C948', { metal: 0.3 }));
    en(columna, 0, 1.2, 0);
    const techo = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.45, 12), new THREE.MeshStandardMaterial({ map: rayasTextura(), roughness: 0.8 }));
    en(techo, 0, 2.45, 0);
    base.add(piso, columna, techo, en(cilindro(0.9, 0.9, 0.12, mat('#e4574b')), 0, 2.18, 0));
    en(base, K.x, 0, K.z);
    c.g.add(base);
    const giro = grupo();
    giro.position.copy(base.position);
    c.g.add(giro);
    const colores = ['#F7C948', '#F59FC0', '#8EC5F0', '#fff3e0', '#b48ef0', '#8FD6B9'];
    const caballos = colores.map((col, i) => {
      const cab = caballito(i === 0 ? 'caballo llave' : `caballo ${i}`, col);
      const poste = cilindro(0.012, 0.012, 2.05, mat('#d9b25a', { metal: 0.6 }));
      const a = (i / 6) * Math.PI * 2;
      en(poste, Math.sin(a) * K.r, 1.1, Math.cos(a) * K.r);
      giro.add(poste);
      giro.add(cab);
      cab.userData.fase = i * 1.3;
      return cab;
    });
    const dorado = caballos[0];
    const k = llave('llave', '#f2c75c', false);
    k.scale.setScalar(0.8);
    en(k, -0.02, 0.13, 0.07);
    dorado.add(k, toque(0.24));
    const brillo = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff6c8', transparent: true, opacity: 0.7 }));
    en(brillo, -0.02, 0.2, 0.07);
    dorado.add(brillo);
    const frente = Math.atan2(0 - K.x, 4.3 - K.z);
    let t = 0, hecho = false;
    const estado = () => {
      const rot = (t / K.vuelta) * Math.PI * 2;
      const h = 0.5 - 0.5 * Math.cos((t / K.sube) * Math.PI * 2 + dorado.userData.fase);
      return { ang: difAng(rot, frente), h };
    };
    dorado.userData.alcanzable = (m = 1) => {
      const e = estado();
      return Math.abs(e.ang) < 0.8 * m && e.h < 0.36 * m;
    };
    c.cada((dt) => {
      t += dt;
      const rot = (t / K.vuelta) * Math.PI * 2;
      caballos.forEach((cab, i) => {
        const a = rot + (i / 6) * Math.PI * 2;
        const h = 0.5 - 0.5 * Math.cos((t / K.sube) * Math.PI * 2 + cab.userData.fase);
        cab.position.set(Math.sin(a) * K.r, 0.45 + h * 0.45, Math.cos(a) * K.r);
        cab.rotation.y = a + Math.PI;
      });
      giro.children.filter((o) => o.type === 'Mesh').forEach((poste, i) => {
        const a = rot + (i / 6) * Math.PI * 2;
        poste.position.set(Math.sin(a) * K.r, 1.1, Math.cos(a) * K.r);
      });
      brillo.scale.setScalar(0.8 + Math.sin(t * 6) * 0.3);
    });
    c.mantener(dorado, () => {
      if (hecho) return;
      if ((dorado.userData.alcanzable as (m?: number) => boolean)()) {
        hecho = true;
        brillo.visible = false;
        c.dar('llave', k);
      } else {
        sonido.nota(330, 0.08, 0, 'square', 0.04);
        sonido.nota(262, 0.12, 0.09, 'square', 0.04);
        c.mal();
      }
    }, () => {});
    c.conLlave();
    // Música de carrusel suavecita
    let nota = 0;
    const melodia = [523, 659, 784, 659, 587, 698, 880, 698];
    c.cada((dt) => {
      nota += dt;
      if (nota > 0.45) {
        nota = 0;
        sonido.nota(melodia[Math.floor(t / 0.45) % melodia.length], 0.2, 0, 'sine', 0.02);
      }
    });
  },
  async prueba(p) {
    const cab = p.obj('caballo llave');
    await p.esperarQue(() => (cab.userData.alcanzable as (m?: number) => boolean)(0.7), 300000);
    await p.tocar(cab);
    await p.usar('llave', 'puerta toque');
  },
};

function rayasTextura() {
  const t = new THREE.CanvasTexture((() => {
    const cv = document.createElement('canvas');
    cv.width = 256;
    cv.height = 64;
    rayas(cv.getContext('2d')!, 256, 64, '#e4574b', '#fff3e0', 12);
    return cv;
  })());
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------------------------------------------------------------------------
// 69 · La casa de los espejos
// ---------------------------------------------------------------------------
const CLAVE_ESPEJO = '2517';
const espejos: Nivel = {
  titulo: 'La casa de los espejos',
  pistas: [
    'Aquí nada se ve derecho.',
    'El letrero de la izquierda está escrito al revés, como en un espejo.',
    'Pon el espejito de mano junto al letrero para leerlo derecho; la clave va en el teclado junto a la puerta.',
  ],
  montar(c) {
    const cartel = letrero(0.8, 0.5, (cv, w, h) => {
      cv.fillStyle = '#fff8ee';
      cv.fillRect(0, 0, w, h);
      cv.strokeStyle = '#b48ef0';
      cv.lineWidth = 12;
      cv.strokeRect(8, 8, w - 16, h - 16);
      cv.save();
      cv.translate(w, 0);
      cv.scale(-1, 1);
      textoEn(cv, 'LA CLAVE', w / 2, h * 0.3, h * 0.16, '#6b3f7a', 700);
      textoEn(cv, CLAVE_ESPEJO.split('').join(' '), w / 2, h * 0.64, h * 0.3, '#3d2b27', 700);
      cv.restore();
    }, 'letrero al reves');
    en(cartel, -1.35, 1.5, 0.05);
    c.g.add(cartel);
    // Espejos de feria que deforman (adorno)
    for (const [x, onda] of [[1.45, 1], [2.3, -1]] as [number, number][]) {
      const geo = new THREE.PlaneGeometry(0.55, 1.6, 10, 24);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getY(i) * 6 * onda) * 0.04 + Math.cos(pos.getX(i) * 8) * 0.02);
      geo.computeVertexNormals();
      const esp = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#e6eef6', metalness: 1, roughness: 0.08 }));
      en(esp, x, 1.2, 0.08);
      c.g.add(esp, en(caja(0.65, 1.72, 0.05, mat('#d9b25a', { metal: 0.5, rough: 0.35 }), 0.03), x, 1.2, 0.03));
    }
    // Banquito con el espejo de mano
    c.g.add(en(cilindro(0.2, 0.2, 0.05, mat('#e4574b')), 0.95, 0.5, 1.0));
    for (const [dx, dz] of [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]]) c.g.add(en(cilindro(0.02, 0.02, 0.5, mat('#8a6a55')), 0.95 + dx, 0.25, 1.0 + dz));
    const espejo = grupo('espejo');
    const marco = toro(0.13, 0.025, mat('#F59FC0'));
    marco.scale.set(1, 1.3, 1);
    const caraMat = new THREE.MeshStandardMaterial({ color: '#e6eef6', metalness: 0.9, roughness: 0.1 });
    const cara = new THREE.Mesh(new THREE.CircleGeometry(0.13, 28), caraMat);
    cara.scale.set(1, 1.3, 1);
    en(cara, 0, 0, 0.005);
    const mango = cilindro(0.022, 0.028, 0.2, mat('#F59FC0'));
    en(mango, 0, -0.26, 0);
    espejo.add(marco, cara, mango, toque(0.22));
    en(espejo, 0.95, 0.83, 1.0);
    c.g.add(espejo);
    const reflejo = new THREE.CanvasTexture((() => {
      const cv = document.createElement('canvas');
      cv.width = 256;
      cv.height = 256;
      const x = cv.getContext('2d')!;
      x.fillStyle = '#eef4fa';
      x.fillRect(0, 0, 256, 256);
      textoEn(x, 'LA CLAVE', 128, 96, 30, '#6b3f7a', 700);
      textoEn(x, CLAVE_ESPEJO.split('').join(' '), 128, 152, 52, '#3d2b27', 700);
      return cv;
    })());
    reflejo.colorSpace = THREE.SRGBColorSpace;
    let puesto = false;
    const poner = () => {
      puesto = true;
      espejo.userData.puesto = true;
      c.quitarToque(espejo);
      const p0 = espejo.position.clone(), p1 = new THREE.Vector3(-0.62, 1.5, 0.45);
      void c.escena.animar(400, (q) => {
        espejo.position.lerpVectors(p0, p1, q);
        espejo.rotation.y = -0.7 * q;
      });
      caraMat.map = reflejo;
      caraMat.metalness = 0.2;
      caraMat.emissive.set('#ffffff');
      caraMat.emissiveMap = reflejo;
      caraMat.emissiveIntensity = 0.35;
      caraMat.needsUpdate = true;
      sonido.nota(1175, 0.2, 0.2, 'sine', 0.06);
      c.bien();
      c.despues(500, () => c.tocar(espejo, () => void c.enfocar(espejo, 0.8)));
    };
    c.arrastrar(espejo, {
      plano: new THREE.Plane(new THREE.Vector3(0, 0, 1), -1.0),
      limites: limites(-2.4, 0.5, 1.0, 2.6, 2.3, 1.0),
      alSoltar: (p) => {
        if (puesto) return;
        if (p.x < -0.4 && Math.abs(p.y - 1.5) < 0.6) poner();
      },
    });
    tecladoPared(c, 0.98, 1.25, 0.04, CLAVE_ESPEJO, 'Teclado de los espejos');
  },
  async prueba(p) {
    await p.arrastrar('espejo', new THREE.Vector3(-1.0, 1.5, 1.0));
    await p.esperarQue(() => !!p.obj('espejo').userData.puesto, 8000);
    await p.esperar(800);
    await p.tocar('teclado');
    await p.panel(CLAVE_ESPEJO);
  },
};

// ---------------------------------------------------------------------------
// 70 · El tiquete
// ---------------------------------------------------------------------------
const CLAVE_TIQUETE = ['2', '5', '1', '0'];
const tiquete: Nivel = {
  titulo: 'El tiquete',
  pistas: [
    'Sin tiquete no se entra a la carpa.',
    'El tiquete tiene más letras de las que se alcanzan a ver.',
    'Acércate al tiquete y amplía con dos dedos, como una foto, hasta leer la letra más pequeña; va en el candado de la carpa.',
  ],
  montar(c) {
    c.g.add(en(caja(1.2, 1.0, 0.5, mat('#8EC5F0'), 0.03), 1.8, 0.5, 0.6));
    c.g.add(en(caja(1.3, 0.05, 0.6, mat('#fff3e0'), 0.02), 1.8, 1.02, 0.62));
    for (const x of [1.2, 2.4]) c.g.add(en(caja(0.06, 1.0, 0.06, mat('#fff3e0'), 0.02), x, 1.5, 0.4));
    c.g.add(en(caja(1.4, 0.12, 0.5, mat('#e4574b'), 0.03), 1.8, 2.04, 0.5));
    c.g.add(en(letrero(1.0, 0.24, (cv, w, h) => {
      rayas(cv, w, h, '#fff8ee', '#ffe6e0', 12);
      textoEn(cv, 'TAQUILLA', w / 2, h / 2 + 3, h * 0.6, '#e4574b', 700);
    }), 1.8, 2.26, 0.5));
    const vidrio = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 0.9), new THREE.MeshStandardMaterial({ color: '#dff1fb', transparent: true, opacity: 0.15, depthWrite: false }));
    en(vidrio, 1.8, 1.5, 0.4);
    c.g.add(vidrio);
    const papel = letrero(0.36, 0.18, (cv, w, h) => {
      cv.fillStyle = '#F7B6CF';
      cv.fillRect(0, 0, w, h);
      cv.fillStyle = '#fff8ee';
      for (let y = 10; y < h; y += 26) {
        cv.beginPath();
        cv.arc(w * 0.78, y, 7, 0, Math.PI * 2);
        cv.fill();
      }
      cv.strokeStyle = '#e4574b';
      cv.lineWidth = 8;
      cv.strokeRect(8, 8, w - 16, h - 16);
      textoEn(cv, 'ADMITE 2', w * 0.39, h * 0.3, h * 0.2, '#e4574b', 700);
      textoEn(cv, 'LA FERIA', w * 0.39, h * 0.52, h * 0.15, '#3b2f6c', 700);
      textoEn(cv, '★', w * 0.89, h * 0.5, h * 0.3, '#e4574b', 700);
      // La letra pequeña (se lee solo de muy cerca)
      textoEn(cv, 'letra pequeña: la clave de la carpa es 2 5 1 0 (válido para dos, desde el 25 de octubre)', w * 0.39, h * 0.82, h * 0.028, '#3d2b27', 600);
    }, 'tiquete', { px: 512 });
    papel.rotation.x = -0.55;
    en(papel, 1.55, 1.1, 0.78);
    c.g.add(papel);
    candadoPuerta(c, CLAVE_TIQUETE.map(() => '0123456789'.split('')), CLAVE_TIQUETE, 'Candado de la carpa');
    const cam = c.escena.camara;
    let zoom0 = 1, antes = true;
    const ponerZoom = (z: number) => {
      cam.zoom = THREE.MathUtils.clamp(z, 1, 6);
      cam.updateProjectionMatrix();
    };
    papel.userData.general = () => c.escena.enVistaGeneral;
    papel.userData.zoom = () => cam.zoom;
    c.tocar(papel, () => {
      if (c.escena.enVistaGeneral) void c.enfocar(papel, 0.7);
      else {
        const z0 = cam.zoom, z1 = cam.zoom > 2 ? 1 : 3.5;
        void c.escena.animar(300, (q) => ponerZoom(z0 + (z1 - z0) * q));
      }
    });
    c.gesto.dedos((n) => {
      if (n === 2) zoom0 = cam.zoom;
    });
    c.gesto.pellizco((e) => ponerZoom(zoom0 * e));
    c.cada(() => {
      const general = c.escena.enVistaGeneral;
      if (general && !antes && cam.zoom !== 1) ponerZoom(1);
      antes = general;
    });
    c.alSalir(() => ponerZoom(1));
  },
  async prueba(p) {
    const t = p.obj('tiquete');
    await p.tocar('tiquete');
    await p.esperarQue(() => !(t.userData.general as () => boolean)(), 8000);
    await p.esperar(2500);
    await p.pellizcar(3.5);
    await p.esperarQue(() => (t.userData.zoom as () => number)() > 2.5, 5000);
    await p.esperar(500);
    (document.getElementById('btn-volver') as HTMLButtonElement).click();
    await p.esperarQue(() => (t.userData.general as () => boolean)(), 15000);
    await p.esperar(500);
    await p.tocar('candado');
    await p.panel(CLAVE_TIQUETE.join(''));
  },
};

export const CAP7: Nivel[] = [tiro, rueda, algodon, peluches, martillo, cartas, globos, carrusel, espejos, tiquete];
