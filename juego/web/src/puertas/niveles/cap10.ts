// Capítulo 10 · Nuestro hogar para siempre (puertas 91–100): ordenar las fotos de la historia, el cofre de los
// recuerdos, la carta cifrada, la matica (agua y sol), el piano de colores, la torta del aniversario, la caja
// musical, pedir un deseo con los ojos cerrados, todo junto y la puerta del corazón que se abre con los dos.
import * as THREE from 'three';
import * as sonido from '../../sonido';
import { caja, cilindro, corazon, en, esfera, grupo, letrero, mat, matNuevo, textoEn, toro } from '../kit';
import type { Ctx, Nivel } from '../nivel';
import { DIBUJOS } from '../ui';
import { limites, llave, mesa } from './piezas';

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

const difAng = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

/** Dibuja uno de los dibujitos de los recuerdos (SVG) dentro de un lienzo, cuando termine de cargar. */
function pintarDibujo(t: THREE.CanvasTexture, icono: string, x: number, y: number, w: number, h: number) {
  const img = new Image();
  img.onload = () => {
    const cv = (t.image as HTMLCanvasElement).getContext('2d')!;
    cv.drawImage(img, x, y, w, h);
    t.needsUpdate = true;
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(DIBUJOS[icono] ?? DIBUJOS.corazon)}`;
}

/** Foto tipo polaroid de un recuerdo. */
function polaroid(icono: string, titulo: string, nombre?: string, w = 0.3) {
  const h = w * 1.2;
  const foto = letrero(w, h, (cv, W, H) => {
    cv.fillStyle = '#fffaf1';
    cv.fillRect(0, 0, W, H);
    cv.fillStyle = '#f3e3d3';
    cv.fillRect(W * 0.07, W * 0.07, W * 0.86, W * 0.86 * 0.9);
    textoEn(cv, titulo, W / 2, H * 0.88, H * 0.075, '#3d2b27', 700);
  }, nombre, { px: 256 });
  const t = (foto.material as THREE.MeshStandardMaterial).map as THREE.CanvasTexture;
  const cv = t.image as HTMLCanvasElement;
  pintarDibujo(t, icono, cv.width * 0.12, cv.width * 0.1, cv.width * 0.76, cv.width * 0.66);
  return foto;
}

// ---------------------------------------------------------------------------
// 91 · Las fotos de nuestra historia
// ---------------------------------------------------------------------------
const FOTOS = [
  { icono: 'raton', titulo: 'La villa' },
  { icono: 'calendario', titulo: '25 de octubre' },
  { icono: 'videollamada', titulo: 'Videollamadas' },
  { icono: 'ola', titulo: 'Cartagena' },
  { icono: 'anillo', titulo: 'La propuesta' },
];
const MARCOS = [1.05, 1.45, 1.85, 2.25, 2.65];
const fotos: Nivel = {
  titulo: 'Las fotos de nuestra historia',
  pistas: ['Las fotos se cayeron de sus marcos. Van en orden, de la primera vez hasta hoy.', 'Primero la villa de Transformice, luego el 25 de octubre, las videollamadas, Cartagena y al final la propuesta.'],
  montar(c) {
    const Y = 1.45;
    MARCOS.forEach((x, i) => {
      c.g.add(en(caja(0.36, 0.42, 0.03, mat('#c49468'), 0.01), x, Y, 0.03));
      c.g.add(en(caja(0.3, 0.36, 0.01, mat('#f3e3d3'), 0.003), x, Y, 0.05));
      c.g.add(en(letrero(0.1, 0.08, (cv, w, h) => textoEn(cv, String(i + 1), w / 2, h / 2 + 2, h * 0.8, '#3d2b27', 700), undefined, { transparente: true }), x, Y - 0.28, 0.04));
    });
    const m = mesa(1.9, 0.5, 0.72, '#c49468', 'mesa fotos');
    en(m, -0.55, 0, 0.95);
    c.g.add(m);
    const orden = [3, 0, 4, 1, 2];
    const puestas: boolean[] = FOTOS.map(() => false);
    orden.forEach((fi, pos) => {
      const f = FOTOS[fi];
      const g = grupo(`foto ${fi}`);
      const p = polaroid(f.icono, f.titulo);
      g.add(p);
      const inicio = new THREE.Vector3(-1.3 + pos * 0.38, 0.95, 0.9);
      g.position.copy(inicio);
      g.rotation.z = (pos % 2 ? 1 : -1) * 0.12;
      c.g.add(g);
      c.arrastrar(g, {
        plano: new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.9),
        limites: limites(-1.6, 0.6, 0.9, 3.0, 2.2, 0.9),
        alSoltar: (q) => {
          if (g.userData.puesta) return;
          const sp = c.escena.aPantalla(q);
          const dist = MARCOS.map((x) => {
            const s = c.escena.aPantalla(new THREE.Vector3(x, Y, 0.06));
            return Math.hypot(sp.x - s.x, sp.y - s.y);
          });
          const cerca = Math.min(...dist);
          const i = cerca < 45 ? dist.indexOf(cerca) : -1;
          const a = g.position.clone(), r0 = g.rotation.z;
          if (i === fi && !puestas[i]) {
            puestas[i] = true;
            g.userData.puesta = true;
            c.quitarToque(g);
            void c.escena.animar(300, (k) => {
              g.position.lerpVectors(a, new THREE.Vector3(MARCOS[i], Y, 0.07), k);
              g.rotation.z = r0 * (1 - k);
            });
            sonido.nota(660 + i * 90, 0.15, 0, 'triangle', 0.07);
            if (puestas.every(Boolean)) abrirYa(c, 1200);
          } else {
            if (i >= 0) c.mal();
            void c.escena.animar(300, (k) => g.position.lerpVectors(a, inicio, k));
          }
        },
      });
    });
  },
  async prueba(p) {
    const k = (4.3 - 0.9) / (4.3 - 0.06);
    for (let i = 0; i < FOTOS.length; i++) {
      await p.arrastrar(`foto ${i}`, new THREE.Vector3(MARCOS[i] * k, 1.5 + (1.45 - 1.5) * k, 0.9), 16);
      await p.esperarQue(() => !!p.obj(`foto ${i}`).userData.puesta, 5000);
      await p.esperar(200);
    }
  },
};

// ---------------------------------------------------------------------------
// 92 · El cofre de los recuerdos
// ---------------------------------------------------------------------------
const RESPUESTAS = ['🐭', '25', 'C'];
const cofre: Nivel = {
  titulo: 'El cofre de los recuerdos',
  pistas: ['El cofre se abre con tres respuestas sobre nosotros. Las preguntas están en el cuadro.', 'Nos conocimos en la villa de Transformice (el ratoncito), fuimos novios el 25 de octubre y el viaje de playa fue a Cartagena (C).'],
  montar(c) {
    const cuadro = letrero(1.1, 0.8, (cv, w, h) => {
      cv.fillStyle = '#fff8ee';
      cv.fillRect(0, 0, w, h);
      cv.strokeStyle = '#c49468';
      cv.lineWidth = 14;
      cv.strokeRect(7, 7, w - 14, h - 14);
      textoEn(cv, 'EL COFRE DE LOS RECUERDOS', w / 2, h * 0.13, h * 0.06, '#e4574b', 700);
      const preguntas = ['1. ¿Dónde nos conocimos?', '2. ¿Qué día de octubre', '    nos volvimos novios?', '3. La inicial de la ciudad', '    de nuestro viaje de playa.'];
      preguntas.forEach((q, i) => {
        cv.font = `600 ${h * 0.065}px 'Nunito', sans-serif`;
        cv.fillStyle = '#3d2b27';
        cv.textAlign = 'left';
        cv.textBaseline = 'middle';
        cv.fillText(q, w * 0.08, h * (0.3 + i * 0.13));
      });
    }, 'preguntas');
    en(cuadro, 2.2, 1.55, 0.03);
    c.g.add(cuadro);
    const cf = grupo('cofre');
    const cuerpo = caja(0.6, 0.32, 0.4, mat('#8a5e40'), 0.03);
    en(cuerpo, 0, 0.16, 0);
    const tapa = grupo();
    const tapaM = caja(0.62, 0.12, 0.42, mat('#a0704c'), 0.04);
    en(tapaM, 0, 0.06, 0.21);
    tapa.add(tapaM);
    en(tapa, 0, 0.32, -0.21);
    const herraje = caja(0.64, 0.04, 0.03, mat('#d9b25a', { metal: 0.6 }), 0.01);
    en(herraje, 0, 0.3, 0.21);
    const candado = caja(0.1, 0.1, 0.04, mat('#d9b25a', { metal: 0.7, rough: 0.3 }), 0.02);
    en(candado, 0, 0.24, 0.22);
    cf.add(cuerpo, tapa, herraje, candado, toque(0.4));
    en(cf, 1.6, 0, 1.0);
    c.g.add(cf);
    const k = llave('llave', '#f2c75c', false);
    k.scale.setScalar(0.9);
    en(k, 1.6, 0.3, 1.0);
    k.visible = false;
    c.g.add(k);
    const ruedas = [['🏫', '🚌', '🐭', '☕'], ['15', '31', '25', '24'], ['S', 'B', 'C', 'M']];
    let hecho = false;
    c.tocar(cf, async () => {
      if (hecho) return;
      await c.enfocar(cf, 1.3);
      const ok = await c.ui.ruedas({ titulo: 'Cofre de los recuerdos', ruedas, correcto: RESPUESTAS, estilo: 'maleta' });
      if (!ok) return c.volver();
      hecho = true;
      candado.visible = false;
      sonido.regalo();
      await c.escena.animar(600, (q) => (tapa.rotation.x = -q * 1.7));
      k.visible = true;
      await c.escena.animar(500, (q) => k.position.set(1.6, 0.3 + q * 0.35, 1.0 + q * 0.1));
      c.dar('llave', k);
      await c.volver();
    });
    c.conLlave();
  },
  async prueba(p) {
    await p.tocar('cofre');
    await p.panel(RESPUESTAS.join('|'));
    await p.esperarQue(() => !!document.querySelector('#inventario [data-item="llave"]'), 20000);
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 93 · La carta cifrada
// ---------------------------------------------------------------------------
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const MENSAJE = 'ERES MI LUGAR FAVORITO';
const SALTO = 7;
const cifrar = (t: string, k: number) => t.replace(/[A-Z]/g, (l) => ABC[(ABC.indexOf(l) + k + 26) % 26]);
const carta: Nivel = {
  titulo: 'La carta cifrada',
  pistas: ['La carta está escrita en clave. Gira el anillo de adentro de la rueda: la línea de abajo muestra cómo se lee.', 'Gira el anillo siete letras (la A de afuera con la H de adentro) hasta que la carta diga algo bonito.'],
  montar(c) {
    const cifrado = cifrar(MENSAJE, SALTO);
    const hoja = letrero(1.0, 0.62, () => {}, 'carta', { px: 512 });
    en(hoja, 2.25, 1.65, 0.03);
    c.g.add(hoja);
    const W = new THREE.Vector3(1.35, 1.0, 0.05);
    const exterior = letrero(0.8, 0.8, (cv, w, h) => {
      cv.fillStyle = '#f3e3c3';
      cv.beginPath();
      cv.arc(w / 2, h / 2, w * 0.49, 0, Math.PI * 2);
      cv.fill();
      cv.strokeStyle = '#8a5e40';
      cv.lineWidth = 6;
      cv.stroke();
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        textoEn(cv, ABC[i], w / 2 + Math.sin(a) * w * 0.42, h / 2 - Math.cos(a) * h * 0.42 + 2, w * 0.055, '#3d2b27', 700);
      }
    }, undefined, { transparente: true, px: 512 });
    en(exterior, W.x, W.y, W.z);
    c.g.add(exterior);
    const interior = letrero(0.62, 0.62, (cv, w, h) => {
      cv.fillStyle = '#e4a0b0';
      cv.beginPath();
      cv.arc(w / 2, h / 2, w * 0.49, 0, Math.PI * 2);
      cv.fill();
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        textoEn(cv, ABC[i], w / 2 + Math.sin(a) * w * 0.4, h / 2 - Math.cos(a) * h * 0.4 + 2, w * 0.06, '#fff8ee', 700);
      }
      textoEn(cv, '♥', w / 2, h / 2 + 4, w * 0.25, '#b83a52', 700);
    }, 'anillo', { transparente: true, px: 512 });
    en(interior, W.x, W.y, W.z + 0.01);
    c.g.add(interior);
    const flecha = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.06, 3), mat('#3d2b27'));
    flecha.rotation.z = Math.PI;
    en(flecha, W.x, W.y + 0.43, W.z + 0.02);
    c.g.add(flecha);
    const area = new THREE.Mesh(new THREE.CircleGeometry(0.42, 32), new THREE.MeshBasicMaterial({ visible: false }));
    area.name = 'rueda carta';
    en(area, W.x, W.y, W.z + 0.04);
    c.g.add(area);
    const paso = (Math.PI * 2) / 26;
    let ang = 0, pasos = 0, hecho = false;
    const pintar = () => {
      const t = (hoja.material as THREE.MeshStandardMaterial).map as THREE.CanvasTexture;
      const cv = (t.image as HTMLCanvasElement).getContext('2d')!;
      const { width: w, height: h } = cv.canvas;
      cv.fillStyle = '#fffaf1';
      cv.fillRect(0, 0, w, h);
      cv.strokeStyle = '#e4a0b0';
      cv.lineWidth = 10;
      cv.strokeRect(10, 10, w - 20, h - 20);
      textoEn(cv, 'Mi amor:', w * 0.2, h * 0.14, h * 0.08, '#b83a52', 700);
      textoEn(cv, cifrado, w / 2, h * 0.38, h * 0.085, '#3d2b27', 700);
      cv.fillStyle = '#e4a0b0';
      cv.fillRect(w * 0.1, h * 0.52, w * 0.8, 3);
      textoEn(cv, 'se lee:', w * 0.16, h * 0.64, h * 0.06, '#7a625a', 600);
      textoEn(cv, cifrar(cifrado, -pasos), w / 2, h * 0.78, h * 0.085, pasos === SALTO ? '#2f8f68' : '#9a8a80', 700);
      t.needsUpdate = true;
    };
    pintar();
    area.userData.pasos = () => pasos;
    const fijar = () => {
      const meta = Math.round(ang / paso) * paso;
      const a0 = ang;
      void c.escena.animar(150, (q) => {
        ang = a0 + (meta - a0) * q;
        interior.rotation.z = -ang;
      }).then(() => {
        pasos = ((Math.round(ang / paso) % 26) + 26) % 26;
        pintar();
        sonido.nota(900, 0.03, 0, 'square', 0.03);
        if (pasos === SALTO && !hecho) {
          hecho = true;
          sonido.nota(1046, 0.3, 0.1, 'sine', 0.07);
          abrirYa(c, 1800);
        }
      });
    };
    const girar = (d: number) => {
      if (hecho) return;
      ang += d;
      interior.rotation.z = -ang;
    };
    c.gesto.giro(girar);
    c.gesto.dedos((n) => n === 0 && !hecho && fijar());
    let previo: number | null = null;
    const plano = new THREE.Plane(new THREE.Vector3(0, 0, 1), -(W.z + 0.04));
    c.mantener(area, (hit) => (previo = Math.atan2(hit.point.y - W.y, hit.point.x - W.x)), () => (previo = null));
    c.gesto.mover((x, y, abajo) => {
      if (!abajo || previo === null) return;
      const q = c.enPlano(x, y, plano);
      if (!q) return;
      const a = Math.atan2(q.y - W.y, q.x - W.x);
      girar(difAng(previo, a));
      previo = a;
    });
  },
  async prueba(p) {
    const area = p.obj('rueda carta');
    const paso = (Math.PI * 2) / 26;
    for (let i = 0; i < 5 && (area.userData.pasos as () => number)() !== SALTO; i++) {
      const falta = SALTO - (area.userData.pasos as () => number)();
      await p.girar(falta * paso);
      await p.esperar(800);
    }
  },
};

// ---------------------------------------------------------------------------
// 94 · La matica
// ---------------------------------------------------------------------------
const matica: Nivel = {
  titulo: 'La matica',
  pistas: ['La matica necesita agua y sol. La regadera se inclina con el celular; la cortina se corre con el dedo.', 'Inclina el celular hacia la derecha hasta que la regadera eche agua un rato, y arrastra la cortina hacia un lado para que entre el sol.'],
  montar(c) {
    // Ventana con sol detrás de la cortina
    const V = new THREE.Vector3(2.3, 1.65, 0.03);
    const cielo = letrero(0.8, 0.7, (cv, w, h) => {
      const gr = cv.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#8fcff2');
      gr.addColorStop(1, '#dff2fb');
      cv.fillStyle = gr;
      cv.fillRect(0, 0, w, h);
      cv.fillStyle = '#ffd24a';
      cv.beginPath();
      cv.arc(w * 0.35, h * 0.35, w * 0.14, 0, Math.PI * 2);
      cv.fill();
    });
    en(cielo, V.x, V.y, V.z);
    c.g.add(cielo);
    const blanco = mat('#fff8ee');
    c.g.add(en(caja(0.9, 0.06, 0.08, blanco, 0.02), V.x, V.y + 0.38, 0.05), en(caja(0.9, 0.06, 0.12, blanco, 0.02), V.x, V.y - 0.38, 0.07));
    c.g.add(en(caja(0.06, 0.8, 0.08, blanco, 0.02), V.x - 0.43, V.y, 0.05), en(caja(0.06, 0.8, 0.08, blanco, 0.02), V.x + 0.43, V.y, 0.05));
    const cortina = grupo('cortina');
    cortina.add(caja(0.82, 0.74, 0.03, mat('#F59FC0'), 0.02));
    for (let i = -3; i <= 3; i++) cortina.add(en(caja(0.02, 0.72, 0.035, mat('#e888a8'), 0.008), i * 0.11, 0, 0.005));
    en(cortina, V.x, V.y, 0.1);
    c.g.add(cortina);
    const rayo = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.3, 1.3, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#fff3a0', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    rayo.rotation.z = -0.6;
    en(rayo, 1.95, 1.2, 0.5);
    c.g.add(rayo);
    // La matica en su mesita
    c.g.add(en(caja(0.5, 0.6, 0.4, mat('#c49468'), 0.03), 1.6, 0.3, 0.75));
    c.g.add(en(cilindro(0.13, 0.1, 0.18, mat('#c96a4a')), 1.6, 0.69, 0.75));
    const tallo = grupo();
    const t0 = cilindro(0.012, 0.015, 0.45, mat('#5aa85a'));
    en(t0, 0, 0.22, 0);
    tallo.add(t0);
    const flor = grupo('flor');
    const petalos: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const pt = esfera(0.05, matNuevo('#F59FC0'), undefined, 10);
      pt.scale.set(1, 0.4, 0.6);
      en(pt, Math.cos(a) * 0.06, 0, Math.sin(a) * 0.06);
      pt.rotation.y = -a;
      flor.add(pt);
      petalos.push(pt);
    }
    flor.add(esfera(0.035, mat('#F7C948'), undefined, 10));
    en(flor, 0, 0.46, 0);
    flor.scale.setScalar(0.3);
    tallo.add(flor);
    en(tallo, 1.6, 0.76, 0.75);
    tallo.rotation.z = 0.9;
    c.g.add(tallo);
    const k = llave('llave', '#f2c75c', false);
    k.scale.setScalar(0.6);
    k.visible = false;
    c.g.add(k);
    // La regadera en la repisa
    c.g.add(en(caja(0.5, 0.04, 0.25, mat('#c49468'), 0.01), 1.2, 1.3, 0.35));
    const regadera = grupo('regadera');
    const cuerpo = cilindro(0.09, 0.1, 0.16, mat('#8EC5F0'));
    const pico = cilindro(0.012, 0.02, 0.22, mat('#8EC5F0'));
    pico.rotation.z = -1.0;
    en(pico, 0.14, 0.04, 0);
    regadera.add(cuerpo, pico, en(toro(0.06, 0.012, mat('#8EC5F0'), undefined, Math.PI), -0.02, 0.1, 0), toque(0.16));
    en(regadera, 1.2, 1.4, 0.35);
    c.g.add(regadera);
    const gotas = Array.from({ length: 8 }, () => {
      const g = esfera(0.012, new THREE.MeshBasicMaterial({ color: '#6fb6ea' }), undefined, 6);
      g.visible = false;
      c.g.add(g);
      return g;
    });
    let agua = 0, sol = false, hecho = false, sosteniendo = 0;
    tallo.userData.estado = () => ({ agua, sol });
    c.arrastrar(cortina, {
      plano: new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.1),
      limites: limites(V.x - 0.8, V.y, 0.1, V.x + 0.05, V.y, 0.1),
      alSoltar: (p) => {
        if (p.x < V.x - 0.45 && !sol) {
          sol = true;
          sonido.nota(784, 0.2, 0, 'sine', 0.06);
          void c.escena.animar(800, (q) => ((rayo.material as THREE.MeshBasicMaterial).opacity = q * 0.35));
          revisar();
        }
      },
    });
    c.mantener(regadera, () => (sosteniendo = 1), () => (sosteniendo = 0));
    const revisar = () => {
      if (hecho || agua < 1 || !sol) return;
      hecho = true;
      c.bien();
      const r0 = tallo.rotation.z;
      void c.escena.animar(1200, (q) => {
        tallo.rotation.z = r0 * (1 - q);
        flor.scale.setScalar(0.3 + q * 0.9);
      }).then(() => {
        const p = new THREE.Vector3();
        flor.getWorldPosition(p);
        k.position.copy(p).add(new THREE.Vector3(0, 0.02, 0.08));
        k.visible = true;
        tallo.userData.lista = true;
      });
    };
    c.cada((dt, t) => {
      const inc = c.sensores.hayMovimiento ? c.sensores.inclinacion.x : 0;
      const inclina = Math.max(sosteniendo ? 0.8 : 0, inc);
      regadera.rotation.z = -Math.max(0, Math.min(1, (inclina - 0.1) * 1.6)) * 0.8;
      const echa = inclina > 0.35 && !hecho;
      gotas.forEach((g, i) => {
        g.visible = echa;
        if (!echa) return;
        const f = (t * 1.5 + i / gotas.length) % 1;
        g.position.set(1.36 + f * 0.2, 1.3 - f * 0.45, 0.35 + f * 0.35);
      });
      if (echa && agua < 1) {
        agua = Math.min(1, agua + dt / 2.5);
        tallo.rotation.z = 0.9 * (1 - agua * 0.3);
        if (agua >= 1) {
          sonido.nota(988, 0.15, 0, 'triangle', 0.06);
          revisar();
        }
      }
      petalos.forEach((pt, i) => (pt.position.y = Math.sin(t * 2 + i) * 0.004));
    });
    llaveParaLaPuerta(c, k, () => hecho);
  },
  async prueba(p) {
    const tallo = p.obj('flor').parent!;
    p.sensor.inclinar(0.8, 0.6);
    await p.esperarQue(() => (tallo.userData.estado as () => { agua: number }).call(null).agua >= 1, 30000);
    p.sensor.soltar();
    await p.arrastrar('cortina', new THREE.Vector3(1.55, 1.65, 0.1), 14);
    await p.esperarQue(() => !!tallo.userData.lista, 10000);
    await p.esperar(400);
    await p.tocar('llave');
    await p.esperarQue(() => !!document.querySelector('#inventario [data-item="llave"]'), 20000);
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 95 · El piano de colores
// ---------------------------------------------------------------------------
const TECLAS = [
  { color: '#e4574b', f: 523 },
  { color: '#f08a3c', f: 587 },
  { color: '#F7C948', f: 659 },
  { color: '#8FD6B9', f: 698 },
  { color: '#6ac8ff', f: 784 },
  { color: '#3f6fd8', f: 880 },
  { color: '#b48ef0', f: 988 },
];
const MELODIA = [0, 0, 4, 4, 5, 5, 4];
const piano: Nivel = {
  titulo: 'El piano de colores',
  pistas: ['La partitura de la pared tiene la canción pintada en colores. Tócala en el piano.', 'Rojo, rojo, celeste, celeste, azul, azul, celeste: «Estrellita, ¿dónde estás?».'],
  montar(c) {
    const hoja = letrero(1.1, 0.4, (cv, w, h) => {
      cv.fillStyle = '#fffaf1';
      cv.fillRect(0, 0, w, h);
      cv.strokeStyle = '#d9cbb8';
      cv.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        cv.beginPath();
        cv.moveTo(w * 0.05, h * (0.3 + i * 0.1));
        cv.lineTo(w * 0.95, h * (0.3 + i * 0.1));
        cv.stroke();
      }
      textoEn(cv, '♪ Estrellita ♪', w / 2, h * 0.14, h * 0.12, '#3d2b27', 700);
      MELODIA.forEach((n, i) => {
        cv.fillStyle = TECLAS[n].color;
        cv.beginPath();
        cv.arc(w * (0.12 + i * 0.125), h * (0.78 - n * 0.06), h * 0.08, 0, Math.PI * 2);
        cv.fill();
      });
    }, 'partitura');
    en(hoja, 1.85, 1.6, 0.03);
    c.g.add(hoja);
    const P = new THREE.Vector3(1.75, 0, 0.9);
    c.g.add(en(caja(1.2, 0.7, 0.45, mat('#e4574b'), 0.05), P.x, 0.35, P.z));
    const teclas = TECLAS.map((t, i) => {
      const k = caja(0.14, 0.05, 0.3, matNuevo(t.color), 0.02, `tecla ${i}`);
      en(k, P.x - 0.45 + i * 0.15, 0.73, P.z + 0.05);
      c.g.add(k);
      return k;
    });
    let pos = 0, hecho = false;
    teclas.forEach((k, i) =>
      c.tocar(k, () => {
        if (hecho) return;
        sonido.nota(TECLAS[i].f, 0.35, 0, 'triangle', 0.09);
        void c.escena.animar(160, (q) => (k.position.y = 0.73 - Math.sin(q * Math.PI) * 0.02));
        if (MELODIA[pos] === i) {
          pos++;
          hoja.userData.pos = pos;
          if (pos === MELODIA.length) {
            hecho = true;
            MELODIA.concat([3, 3, 2, 2, 1, 1, 0]).forEach((n, j) => sonido.nota(TECLAS[n].f, 0.3, 0.6 + j * 0.32, 'sine', 0.06));
            abrirYa(c, 2400);
          }
        } else {
          if (pos > 1) c.mal();
          pos = MELODIA[0] === i ? 1 : 0;
          hoja.userData.pos = pos;
        }
      }),
    );
  },
  async prueba(p) {
    for (const n of MELODIA) await p.tocar(`tecla ${n}`, 1, 200);
  },
};

// ---------------------------------------------------------------------------
// 96 · La torta del aniversario
// ---------------------------------------------------------------------------
const INGREDIENTES = [
  { id: 'harina', color: '#fff3e0', txt: 'Harina' },
  { id: 'huevos', color: '#F7C948', txt: 'Huevos' },
  { id: 'leche', color: '#dff1fb', txt: 'Leche' },
  { id: 'azucar', color: '#F59FC0', txt: 'Azúcar' },
];
const torta: Nivel = {
  titulo: 'La torta del aniversario',
  pistas: ['Primero la receta en orden (está en la pared) y después hay que apagar las velas soplando.', 'Harina, huevos, leche y azúcar. Luego sopla al celular (o mantén el dedo sobre cada vela).'],
  montar(c) {
    const receta = letrero(0.7, 0.62, (cv, w, h) => {
      cv.fillStyle = '#fffaf1';
      cv.fillRect(0, 0, w, h);
      cv.strokeStyle = '#e4a0b0';
      cv.lineWidth = 10;
      cv.strokeRect(8, 8, w - 16, h - 16);
      textoEn(cv, 'Nuestra torta', w / 2, h * 0.14, h * 0.09, '#b83a52', 700);
      INGREDIENTES.forEach((ing, i) => textoEn(cv, `${i + 1}. ${ing.txt}`, w / 2, h * (0.33 + i * 0.15), h * 0.08, '#3d2b27', 700));
    }, 'receta');
    en(receta, 2.55, 1.55, 0.03);
    c.g.add(receta);
    const M = new THREE.Vector3(1.6, 0.75, 0.85);
    c.g.add(en(caja(1.5, 0.75, 0.5, mat('#fff8ee'), 0.04), M.x, 0.375, M.z));
    const bol = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat('#8EC5F0', { lados: THREE.DoubleSide }));
    en(bol, M.x, M.y + 0.16, M.z);
    const masa = new THREE.Mesh(new THREE.CircleGeometry(0.14, 20), matNuevo('#f3e3c3'));
    masa.rotation.x = -Math.PI / 2;
    en(masa, M.x, M.y + 0.06, M.z);
    masa.visible = false;
    c.g.add(bol, masa);
    const lista = INGREDIENTES.map((ing, i) => {
      const g = grupo(ing.id);
      const cuerpo = caja(0.13, 0.2, 0.1, mat(ing.color), 0.03);
      en(cuerpo, 0, 0.1, 0);
      g.add(cuerpo, en(letrero(0.13, 0.05, (cv, w, h) => textoEn(cv, ing.txt, w / 2, h / 2 + 2, h * 0.6, '#3d2b27', 700), undefined, { transparente: true }), 0, 0.1, 0.052), toque(0.13));
      en(g, [M.x - 0.62, M.x + 0.45, M.x - 0.38, M.x + 0.62][i], M.y, M.z + 0.05);
      c.g.add(g);
      return g;
    });
    const pastel = grupo('torta');
    pastel.add(en(cilindro(0.22, 0.22, 0.16, mat('#F59FC0')), 0, 0.08, 0), en(cilindro(0.225, 0.225, 0.03, mat('#fff8ee')), 0, 0.165, 0));
    const velas = [-0.07, 0.07].map((dx, i) => {
      const v = grupo(`vela ${i}`);
      v.add(en(cilindro(0.015, 0.015, 0.12, mat('#fff8ee')), 0, 0.06, 0));
      const llama = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 8), new THREE.MeshBasicMaterial({ color: '#ffc04a' }));
      en(llama, 0, 0.15, 0);
      v.add(llama, toque(0.08));
      en(v, dx, 0.18, 0);
      v.userData.llama = llama;
      pastel.add(v);
      return v;
    });
    en(pastel, M.x, M.y, M.z);
    pastel.visible = false;
    c.g.add(pastel);
    let paso = 0, horneada = false, apagadas = 0, hecho = false;
    lista.forEach((g, i) =>
      c.tocar(g, () => {
        if (horneada || g.userData.usado) return;
        const a = g.position.clone();
        const b = new THREE.Vector3(M.x, M.y + 0.35, M.z);
        if (i === paso) {
          g.userData.usado = true;
          paso++;
          pastel.userData.paso = paso;
          void c.escena.animar(350, (q) => {
            g.position.lerpVectors(a, b, q);
            g.rotation.z = q * 2;
          }).then(async () => {
            sonido.nota(600 + paso * 80, 0.1, 0, 'sine', 0.06);
            g.visible = false;
            masa.visible = true;
            (masa.material as THREE.MeshStandardMaterial).color.set(INGREDIENTES[Math.min(3, paso - 1)].color);
            if (paso === INGREDIENTES.length) {
              horneada = true;
              await c.escena.esperar(500);
              sonido.nota(1318, 0.15, 0, 'sine', 0.08);
              sonido.nota(1568, 0.3, 0.15, 'sine', 0.08);
              bol.visible = false;
              masa.visible = false;
              pastel.visible = true;
              void c.escena.animar(500, (q) => pastel.scale.setScalar(0.3 + 0.7 * q));
              pastel.userData.lista = true;
            }
          });
        } else {
          sonido.rumor(0.3, 400, 0.08);
          c.escena.temblar(0.01, 200);
          c.mal();
        }
      }),
    );
    const apagar = (v: THREE.Object3D) => {
      if (!horneada || v.userData.apagada) return;
      v.userData.apagada = true;
      v.userData.llama.visible = false;
      sonido.rumor(0.25, 900, 0.05);
      if (++apagadas === velas.length && !hecho) {
        hecho = true;
        sonido.regalo();
        abrirYa(c, 1500);
      }
    };
    c.sensor.soplido(() => {
      const v = velas.find((x) => !x.userData.apagada);
      if (v) apagar(v);
    });
    let pidio = false;
    velas.forEach((v) =>
      c.mantener(v, async () => {
        if (pidio || !horneada) return;
        pidio = true;
        c.aviso('Sopla al celular…', 2200);
        if (!(await c.sensores.escuchar())) c.aviso('Sin micrófono: mantén el dedo sobre cada llama un segundo.', 3500);
      }, (ms) => ms > 900 && apagar(v)),
    );
    c.alSalir(() => c.sensores.callar());
    c.cada((_, t) => velas.forEach((v, i) => (v.userData.llama.scale.y = 1 + Math.sin(t * 12 + i) * 0.15)));
  },
  async prueba(p) {
    for (const ing of INGREDIENTES) {
      await p.tocar(ing.id);
      await p.esperar(700);
    }
    await p.esperarQue(() => !!p.obj('torta').userData.lista, 10000);
    for (let i = 0; i < 2; i++) {
      p.sensor.soplar();
      await p.esperar(400);
    }
  },
};

// ---------------------------------------------------------------------------
// 97 · La caja musical
// ---------------------------------------------------------------------------
const VUELTAS_CAJA = 5;
const cajaMusical: Nivel = {
  titulo: 'La caja musical',
  pistas: ['Dale cuerda a la caja musical dibujando círculos con el dedo sobre ella: parejito, ni muy rápido ni muy lento.', 'Haz círculos tranquilos (más o menos una vuelta por segundo). Si vas muy rápido se traba. Cinco vueltas buenas y se abre.'],
  montar(c) {
    const B = new THREE.Vector3(1.7, 0.75, 0.9);
    c.g.add(en(caja(1.0, 0.75, 0.5, mat('#c49468'), 0.04), B.x, 0.375, B.z));
    const cajita = grupo('caja musical');
    const cuerpo = caja(0.42, 0.2, 0.3, mat('#F59FC0'), 0.03);
    en(cuerpo, 0, 0.1, 0);
    const tapa = grupo();
    const tapaM = caja(0.44, 0.05, 0.32, mat('#e888a8'), 0.02);
    en(tapaM, 0, 0.025, 0.16);
    tapa.add(tapaM);
    en(tapa, 0, 0.2, -0.16);
    const cor = corazon(0.1, 0.02, mat('#F7C948'));
    en(cor, 0, 0.11, 0.155);
    const manivela = grupo();
    manivela.add(en(cilindro(0.01, 0.01, 0.08, mat('#d9b25a', { metal: 0.6 })), 0, 0, 0.04), en(caja(0.08, 0.015, 0.015, mat('#d9b25a', { metal: 0.6 }), 0.005), 0.04, 0, 0.08));
    manivela.children[0].rotation.x = Math.PI / 2;
    en(manivela, 0.22, 0.1, 0);
    manivela.rotation.y = Math.PI / 2;
    cajita.add(cuerpo, tapa, cor, manivela);
    // Los dos bailando (aparecen al abrir)
    const pareja = grupo();
    pareja.add(en(cilindro(0.025, 0.035, 0.1, mat('#3b5ea8')), -0.035, 0.05, 0), en(esfera(0.025, mat('#f7d2b6'), undefined, 10), -0.035, 0.12, 0));
    pareja.add(en(new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 12), mat('#e4574b')), 0.035, 0.05, 0), en(esfera(0.025, mat('#f7d2b6'), undefined, 10), 0.035, 0.12, 0));
    en(pareja, 0, 0.2, 0);
    pareja.scale.setScalar(0.01);
    cajita.add(pareja);
    en(cajita, B.x, B.y, B.z);
    c.g.add(cajita);
    const area = toque(0.36, 'caja toque');
    en(area, B.x, B.y + 0.12, B.z);
    c.g.add(area);
    const k = llave('llave', '#f2c75c', false);
    k.scale.setScalar(0.7);
    k.visible = false;
    c.g.add(k);
    let progreso = 0, activo = false, previo: number | null = null, tPrevio = 0, hecho = false, avisado = 0;
    let centro = { x: 0, y: 0 };
    let vel = 0;
    area.userData.progreso = () => progreso;
    c.mantener(area, () => {
      if (hecho) return;
      activo = true;
      previo = null;
      centro = c.escena.aPantalla(B.clone().add(new THREE.Vector3(0, 0.12, 0)));
    }, () => (activo = false));
    const notas = [659, 784, 880, 784, 659, 587, 523, 587];
    let nota = 0, cuarto = 0;
    c.gesto.mover((x, y, abajo) => {
      if (!abajo || !activo || hecho) return;
      const a = Math.atan2(y - centro.y, x - centro.x);
      const ahora = performance.now();
      if (previo === null) {
        previo = a;
        tPrevio = ahora;
        return;
      }
      const d = Math.abs(difAng(a, previo));
      const dt = Math.max(1, ahora - tPrevio) / 1000;
      previo = a;
      tPrevio = ahora;
      vel = vel * 0.6 + (d / dt) * 0.4;
      manivela.rotation.x += d;
      if (vel > 11) {
        progreso = Math.max(0, progreso - d / (Math.PI * 2) / 2);
        if (ahora - avisado > 2500) {
          avisado = ahora;
          sonido.nota(160, 0.15, 0, 'square', 0.04);
          c.aviso('¡Despacio! Parejito…', 1500);
        }
        return;
      }
      if (vel < 1.2) return;
      progreso += d / (Math.PI * 2);
      if (Math.floor(progreso * 3) !== cuarto) {
        cuarto = Math.floor(progreso * 3);
        sonido.nota(notas[nota++ % notas.length], 0.25, 0, 'sine', 0.05);
      }
      if (progreso >= VUELTAS_CAJA) {
        hecho = true;
        activo = false;
        c.bien();
        void c.escena.animar(700, (q) => (tapa.rotation.x = -q * 1.9)).then(() => {
          void c.escena.animar(600, (q) => pareja.scale.setScalar(0.01 + q * 0.99));
          notas.concat(notas).forEach((f, i) => sonido.nota(f, 0.3, i * 0.3, 'sine', 0.05));
          k.position.set(B.x + 0.12, B.y + 0.3, B.z + 0.05);
          k.visible = true;
          area.userData.lista = true;
        });
      }
    });
    c.cada((_, t) => (pareja.rotation.y = t * 1.5));
    llaveParaLaPuerta(c, k, () => hecho);
  },
  async prueba(p) {
    const s = p.pantalla('caja toque');
    const pts: [number, number][] = [[s.x / innerWidth, s.y / innerHeight]];
    const r = 32;
    const N = 24;
    for (let i = 0; i <= 6.2 * N; i++) {
      const a = (i / N) * Math.PI * 2;
      pts.push([(s.x + Math.cos(a) * r) / innerWidth, (s.y + Math.sin(a) * r) / innerHeight]);
    }
    await p.trazar(pts, 6200);
    await p.esperarQue(() => !!p.obj('caja toque').userData.lista, 10000);
    await p.tocar('llave');
    await p.esperarQue(() => !!document.querySelector('#inventario [data-item="llave"]'), 20000);
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 98 · Pide un deseo
// ---------------------------------------------------------------------------
const deseo: Nivel = {
  titulo: 'Pide un deseo',
  pistas: ['Cierra los ojos y pide un deseo… de verdad: apaga la pantalla del celular un momento.', 'Apaga la pantalla por lo menos tres segundos y vuelve a prenderla. Si no puedes, deja el dedo sobre la estrella cinco segundos.'],
  montar(c) {
    const E = new THREE.Vector3(1.8, 1.6, 0.1);
    const estrellaMat = new THREE.MeshBasicMaterial({ color: '#fff3a0' });
    const est = new THREE.Mesh(new THREE.ShapeGeometry((() => {
      const f = new THREE.Shape();
      for (let i = 0; i <= 10; i++) {
        const a = Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 ? 0.08 : 0.2;
        if (i === 0) f.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else f.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      return f;
    })()), estrellaMat);
    est.name = 'estrella deseo';
    en(est, E.x, E.y, E.z);
    c.g.add(est);
    const halo = new THREE.Mesh(new THREE.CircleGeometry(0.35, 30), new THREE.MeshBasicMaterial({ color: '#fff3a0', transparent: true, opacity: 0.2, depthWrite: false }));
    en(halo, E.x, E.y, E.z - 0.01);
    c.g.add(halo);
    const area = toque(0.35, 'deseo toque');
    en(area, E.x, E.y, E.z);
    c.g.add(area);
    const chispas = Array.from({ length: 24 }, (_, i) => {
      const m = esfera(0.02, new THREE.MeshBasicMaterial({ color: ['#fff3a0', '#F59FC0', '#8EC5F0', '#8FD6B9'][i % 4] }), undefined, 6);
      m.visible = false;
      c.g.add(m);
      return m;
    });
    let hecho = false;
    const cumplir = () => {
      if (hecho) return;
      hecho = true;
      area.userData.hecho = true;
      sonido.regalo();
      chispas.forEach((m, i) => {
        m.visible = true;
        const a = (i / chispas.length) * Math.PI * 2;
        void c.escena.animar(1200, (q) => {
          m.position.set(E.x + Math.cos(a) * q * 0.8, E.y + Math.sin(a) * q * 0.8 - q * q * 0.3, E.z + 0.1);
          m.scale.setScalar(1 - q * 0.7);
        });
      });
      abrirYa(c, 1800);
    };
    c.sensor.pantalla((ms) => {
      if (ms >= 3000) cumplir();
      else c.aviso('Un poquito más, con los ojos cerrados…', 2000);
    });
    let apretado = false;
    c.mantener(area, () => {
      apretado = true;
      c.escena.atenuar(0.2);
    }, (ms) => {
      apretado = false;
      c.escena.atenuar(1);
      if (ms >= 5000) cumplir();
      else if (ms > 1200) c.aviso('Más tiempo, pidiendo el deseo…', 1800);
    });
    c.alSalir(() => c.escena.atenuar(1));
    c.cada((_, t) => {
      halo.scale.setScalar(1 + Math.sin(t * 2) * 0.1 + (apretado ? 0.3 : 0));
      est.rotation.z = Math.sin(t * 0.8) * 0.1;
    });
  },
  async prueba(p) {
    p.sensor.pantalla(3500);
    await p.esperarQue(() => !!p.obj('deseo toque').userData.hecho, 5000);
  },
};

// ---------------------------------------------------------------------------
// 99 · Todo junto
// ---------------------------------------------------------------------------
const todoJunto: Nivel = {
  titulo: 'Todo junto',
  pistas: ['Tres pasos en orden: inclinar para meter la bolita, sacudir el globo de nieve y tocar el corazón.', 'Inclina el celular a la izquierda hasta que la bolita caiga en el hoyo, sacude el celular y toca el corazón cinco veces.'],
  montar(c) {
    const tarjeta = letrero(0.75, 0.5, (cv, w, h) => {
      cv.fillStyle = '#fffaf1';
      cv.fillRect(0, 0, w, h);
      cv.strokeStyle = '#e4a0b0';
      cv.lineWidth = 10;
      cv.strokeRect(8, 8, w - 16, h - 16);
      ['1. Inclinar ↙', '2. Sacudir ≋', '3. Tocar ♥ ×5'].forEach((t, i) => textoEn(cv, t, w / 2, h * (0.27 + i * 0.24), h * 0.13, '#3d2b27', 700));
    }, 'tarjeta pasos');
    en(tarjeta, 2.6, 1.7, 0.03);
    c.g.add(tarjeta);
    // 1 · La canaleta con la bolita
    const T = new THREE.Vector3(1.0, 1.15, 0.25);
    c.g.add(en(caja(0.8, 0.04, 0.12, mat('#c49468'), 0.01), T.x + 0.4, T.y, T.z));
    const hoyo = cilindro(0.045, 0.045, 0.045, mat('#3d2b27'));
    en(hoyo, T.x + 0.05, T.y + 0.005, T.z);
    c.g.add(hoyo);
    const bolita = esfera(0.035, mat('#e4574b', { rough: 0.3 }), 'bolita', 14);
    c.g.add(bolita);
    let bx = 0.7, bv = 0, paso = 0, arrastrando = false;
    const luces = [0, 1, 2].map((i) => {
      const l = esfera(0.03, new THREE.MeshBasicMaterial({ color: '#8a7a6a' }), undefined, 8);
      en(l, 2.3 + i * 0.3, 1.35, 0.05);
      c.g.add(l);
      return l;
    });
    const avanzar = () => {
      (luces[paso].material as THREE.MeshBasicMaterial).color.set('#5af0a0');
      paso++;
      tarjeta.userData.paso = paso;
      sonido.nota(784 + paso * 110, 0.15, 0, 'triangle', 0.07);
    };
    c.cada((dt) => {
      if (paso !== 0) return;
      if (!arrastrando) {
        const inc = c.sensores.hayMovimiento ? c.sensores.inclinacion.x : 0;
        bv += inc * 2.5 * dt;
        bv *= Math.pow(0.4, dt);
        bx = THREE.MathUtils.clamp(bx + bv * dt, 0.05, 0.76);
      }
      bolita.position.set(T.x + bx, T.y + 0.055, T.z);
      if (bx <= 0.07) {
        bolita.position.y -= 0.03;
        avanzar();
      }
    });
    c.arrastrar(bolita, {
      plano: new THREE.Plane(new THREE.Vector3(0, 0, 1), -T.z),
      limites: limites(T.x + 0.05, T.y + 0.055, T.z, T.x + 0.76, T.y + 0.055, T.z),
      alTomar: () => (arrastrando = true),
      alMover: (q) => (bx = q.x - T.x),
      alSoltar: () => (arrastrando = false),
    });
    // 2 · El globo de nieve
    const G = new THREE.Vector3(1.55, 0.78, 0.9);
    c.g.add(en(caja(0.9, 0.78, 0.45, mat('#fff8ee'), 0.04), G.x + 0.2, 0.39, G.z));
    const globo = grupo('globo nieve');
    globo.add(en(cilindro(0.12, 0.14, 0.08, mat('#8a5e40')), 0, 0.04, 0));
    const vidrio = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), new THREE.MeshStandardMaterial({ color: '#dff1fb', transparent: true, opacity: 0.35, roughness: 0.05 }));
    en(vidrio, 0, 0.2, 0);
    const casita = caja(0.08, 0.07, 0.06, mat('#F59FC0'), 0.01);
    en(casita, 0, 0.13, 0);
    const copos = Array.from({ length: 14 }, () => en(esfera(0.008, mat('#ffffff'), undefined, 4), 0, 0.1, 0));
    globo.add(vidrio, casita, ...copos, toque(0.2));
    en(globo, G.x, G.y, G.z);
    c.g.add(globo);
    let nieve = 0;
    const sacudir = () => {
      if (paso !== 1) return;
      nieve = 3;
      sonido.rumor(0.4, 3000, 0.04);
      avanzar();
    };
    c.sensor.sacudida(sacudir);
    let toquesGlobo = 0;
    c.tocar(globo, () => {
      if (paso !== 1 || c.sensores.hayMovimiento) return;
      if (++toquesGlobo >= 6) sacudir();
    });
    // 3 · El corazón
    const cor = corazon(0.28, 0.06, matNuevo('#e4574b'), 'corazon');
    en(cor, 2.2, 1.0, 0.25);
    c.g.add(cor);
    let toques = 0;
    c.tocar(cor, () => {
      void c.escena.animar(150, (q) => cor.scale.setScalar(1 + Math.sin(q * Math.PI) * 0.15));
      if (paso !== 2) return sonido.nota(300, 0.05, 0, 'sine', 0.03);
      sonido.nota(600 + toques * 100, 0.08, 0, 'sine', 0.06);
      if (++toques >= 5) {
        paso = 3;
        (luces[2].material as THREE.MeshBasicMaterial).color.set('#5af0a0');
        tarjeta.userData.paso = 3;
        abrirYa(c, 1200);
      }
    });
    c.cada((dt, t) => {
      nieve = Math.max(0, nieve - dt);
      copos.forEach((cp, i) => {
        const a = i * 2.4 + t * (nieve > 0 ? 3 : 0.2);
        cp.position.set(Math.cos(a) * 0.09 * ((i % 3) / 3 + 0.3), 0.14 + ((i * 0.37 + t * (nieve > 0 ? 0.5 : 0.05)) % 0.15), Math.sin(a) * 0.08);
      });
    });
  },
  async prueba(p) {
    const t = p.obj('tarjeta pasos');
    p.sensor.inclinar(-0.8, 0.6);
    await p.esperarQue(() => (t.userData.paso ?? 0) >= 1, 60000);
    p.sensor.soltar();
    p.sensor.sacudir();
    await p.esperarQue(() => (t.userData.paso ?? 0) >= 2, 5000);
    await p.tocar('corazon', 5, 150);
    await p.esperarQue(() => (t.userData.paso ?? 0) >= 3, 5000);
  },
};

// ---------------------------------------------------------------------------
// 100 · La puerta del corazón
// ---------------------------------------------------------------------------
const SEGUNDOS_CORAZON = 5;
const puertaCorazon: Nivel = {
  titulo: 'La puerta del corazón',
  pistas: ['Esta puerta no tiene llave: se abre con los dos. Pon los dos pulgares en las huellas al mismo tiempo.', 'Mantén los dos pulgares sobre las huellas del corazón cinco segundos, sin soltar.'],
  montar(c) {
    const huella = (nombre: string) => {
      const g = grupo(nombre);
      const h = letrero(0.16, 0.2, (cv, w, hh) => {
        cv.strokeStyle = '#fff3e0';
        cv.lineWidth = 5;
        for (let i = 0; i < 6; i++) {
          cv.beginPath();
          cv.ellipse(w / 2, hh / 2, w * (0.12 + i * 0.065), hh * (0.12 + i * 0.065), 0, 0, Math.PI * 2);
          cv.stroke();
        }
      }, undefined, { transparente: true });
      g.add(h, toque(0.14));
      return g;
    };
    const hi = huella('huella izq');
    const hd = huella('huella der');
    c.puerta.pegar(hi, -0.25, 1.1, 0.16);
    c.puerta.pegar(hd, 0.25, 1.1, 0.16);
    const brillo = new THREE.Mesh(new THREE.CircleGeometry(0.5, 40), new THREE.MeshBasicMaterial({ color: '#ffe0ea', transparent: true, opacity: 0, depthWrite: false }));
    en(brillo, 0, 1.2, 0.3);
    brillo.scale.set(1, 1.3, 1);
    c.g.add(brillo);
    const abajo = [false, false];
    let lleno = 0, hecho = false, ultimo = performance.now(), latido = 0, desde = 0;
    c.mantener(hi, () => (abajo[0] = true), () => (abajo[0] = false));
    c.mantener(hd, () => (abajo[1] = true), () => (abajo[1] = false));
    c.gesto.dedos((n) => {
      if (n === 0) abajo[0] = abajo[1] = false;
    });
    c.cada(() => {
      const ahora = performance.now();
      const dt = (ahora - ultimo) / 1000;
      ultimo = ahora;
      if (hecho) return;
      // Con tiempo real (no depende de qué tan rápido dibuje el celular)
      if (abajo[0] && abajo[1]) {
        if (!desde) desde = ahora - lleno * 1000;
        lleno = (ahora - desde) / 1000;
        latido += dt;
        if (latido > 0.8) {
          latido = 0;
          sonido.nota(90, 0.12, 0, 'sine', 0.12);
          sonido.nota(80, 0.12, 0.15, 'sine', 0.1);
          c.sensores.vibrar([60, 90, 60]);
        }
      } else {
        desde = 0;
        lleno = Math.max(0, lleno - dt * 2);
      }
      (brillo.material as THREE.MeshBasicMaterial).opacity = (lleno / SEGUNDOS_CORAZON) * 0.8;
      brillo.userData.lleno = lleno;
      if (lleno >= SEGUNDOS_CORAZON) {
        hecho = true;
        sonido.regalo();
        abrirYa(c, 600);
      }
    });
  },
  async prueba(p) {
    await p.dedos(['huella izq', 'huella der'], 6500);
  },
};

export const CAP10: Nivel[] = [fotos, cofre, carta, matica, piano, torta, cajaMusical, deseo, todoJunto, puertaCorazon];
