// Capítulo 1 · Nuestra casa (puertas 1–10): aprender a tocar, arrastrar, deslizar, inclinar, sacudir…
import * as THREE from 'three';
import * as sonido from '../sonido_eco';
import { caja, cilindro, en, esfera, estrella, FUENTE, grupo, letrero, lienzo, mat, matNuevo, textoEn, toro } from '../kit';
import { LAMPARA } from '../cuarto';
import { modelo } from '../modelos';
import * as sfx from '../sonidos';
import type { Ctx, Nivel } from '../nivel';
import { Canica, lamparita, limites, llave, mesa, planoPared, planoPiso, sofa } from './piezas';

/** Pone una planta u otro adorno de la casa (si no carga, no pasa nada). */
async function adorno(c: Ctx, nombre: string, alto: number, x: number, y: number, z: number, ry = 0) {
  try {
    const o = await modelo(nombre, alto);
    en(o, x, y, z, ry);
    c.g.add(o);
    return o;
  } catch {
    return null;
  }
}

/** La llave aparece: se toca para guardarla y se usa en la puerta. */
function llaveParaLaPuerta(c: Ctx, k: THREE.Object3D) {
  c.tocar(k, () => c.dar('llave', k));
  c.conLlave();
}

// ---------------------------------------------------------------------------
// 1 · La llave bajo el tapete
// ---------------------------------------------------------------------------
const tapete: Nivel = {
  titulo: 'La llave bajo el tapete',
  pistas: [
    'La casa siempre guarda algo cerca de la entrada.',
    'Lo que se pisa al entrar se puede correr. Lo que aparece debajo te dice dónde seguir.',
    'Corre el tapete y lee lo que hay debajo; lo que buscas está en algo que se cuelga en la entrada.',
  ],
  async montar(c) {
    // Ya no está bajo el tapete: debajo hay una notica, y la llave quedó en el bolsillo del abrigo
    const k = llave();
    en(k, -1.12, 0.012, 0.62);
    k.visible = false;
    c.g.add(k);
    const nota = letrero(0.2, 0.15, (cx, w, h) => {
      cx.fillStyle = '#fff3a8';
      cx.fillRect(0, 0, w, h);
      textoEn(cx, 'ya no está', w / 2, h * 0.36, h * 0.2, '#3d2b27', 700);
      textoEn(cx, 'aquí ♥', w / 2, h * 0.66, h * 0.2, '#e4574b', 700);
    }, 'nota tapete');
    nota.rotation.x = -Math.PI / 2;
    nota.rotation.z = 0.3;
    en(nota, 0.16, 0.008, 0.8);
    c.g.add(nota);
    c.tocar(nota, () => {
      sfx.papel();
      void c.ui.nota('<p style="font-size:20px;text-align:center">Ya no la dejo bajo el tapete, que todo el mundo sabe.<br>Ahora la guardo en un bolsillo. ♥</p>');
    });
    const t = grupo('tapete');
    t.add(caja(1.1, 0.035, 0.62, mat('#b5543c', { rough: 1 }), 0.02));
    const texto = letrero(0.95, 0.5, (cx, w, h) => {
      cx.fillStyle = '#e9b27a';
      cx.fillRect(0, 0, w, h);
      cx.fillStyle = '#b5543c';
      cx.fillRect(10, 10, w - 20, h - 20);
      textoEn(cx, 'H O L A', w / 2, h / 2, h * 0.34, '#f6e0c0', 700);
    });
    texto.rotation.x = -Math.PI / 2;
    en(texto, 0, 0.019, 0);
    t.add(texto);
    en(t, 0.05, 0.018, 0.78);
    c.g.add(t);
    let vista = false;
    c.arrastrar(t, {
      plano: planoPiso(0.018),
      limites: limites(-2.2, 0.018, 0.45, 2.6, 0.018, 1.5),
      alSoltar: (pnt) => {
        sonido.rumor(0.2, 300, 0.05);
        if (!vista && (Math.abs(pnt.x - 0.18) > 0.62 || Math.abs(pnt.z - 0.78) > 0.42)) {
          vista = true;
          c.bien();
        }
      },
    });
    await adorno(c, 'deco_monstera', 1.3, 2.6, 0, 0.55);
    const perchero = grupo('perchero');
    perchero.add(en(cilindro(0.03, 0.03, 1.7, mat('#8e5b3c')), 0, 0.85, 0), en(cilindro(0.22, 0.25, 0.04, mat('#8e5b3c')), 0, 0.02, 0));
    const abrigo = caja(0.3, 0.55, 0.12, mat('#f4b6c2'), 0.06, 'abrigo');
    en(abrigo, 0.1, 1.35, 0.05);
    const bolsillo = caja(0.1, 0.08, 0.02, mat('#e89aaa'), 0.02);
    en(bolsillo, 0.16, 1.22, 0.115);
    perchero.add(abrigo, bolsillo);
    en(perchero, -1.35, 0, 0.35);
    c.g.add(perchero);
    let suelta = false;
    c.tocar(abrigo, () => {
      void c.escena.animar(360, (t) => (abrigo.rotation.z = Math.sin(t * Math.PI * 3) * 0.12 * (1 - t)));
      sfx.papel();
      // Solo se busca en el bolsillo cuando ya se sabe que no está bajo el tapete
      if (!vista || suelta) return;
      suelta = true;
      k.visible = true;
      const y0 = 1.25;
      void c.escena.animar(520, (t) => (k.position.y = y0 - (y0 - 0.012) * t * t), (t) => t).then(() => sonido.nota(1500, 0.08, 0, 'triangle', 0.06));
      llaveParaLaPuerta(c, k);
    });
  },
  async prueba(p) {
    await p.arrastrar('tapete', new THREE.Vector3(1.6, 0.02, 1.1));
    await p.tocar('abrigo');
    await p.esperar(700);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 2 · Tres golpecitos y uno largo
// ---------------------------------------------------------------------------
const golpecitos: Nivel = {
  titulo: 'Tres golpecitos y uno largo',
  pistas: [
    'Esta puerta no se abre con llave: se abre sabiendo tocar.',
    'Teníamos una manera de tocar para saber que éramos nosotros. En la sala quedó anotada.',
    'En el cuadrito, cada punto es un golpe cortico y la raya es uno largo: deja el dedo quieto un momento sobre la aldaba.',
  ],
  montar(c) {
    const aldaba = grupo('aldaba');
    const placa = cilindro(0.09, 0.09, 0.03, mat('#d9b25a', { metal: 0.7, rough: 0.3 }));
    placa.rotation.x = Math.PI / 2;
    const aro = toro(0.085, 0.018, mat('#d9b25a', { metal: 0.7, rough: 0.3 }), 'aro aldaba');
    const aroPiv = grupo('aro piv');
    en(aro, 0, -0.09, 0.03);
    aroPiv.add(aro);
    en(aroPiv, 0, 0.02, 0.02);
    aldaba.add(placa, aroPiv);
    const toque = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
    toque.name = 'aldaba toque';
    aldaba.add(toque);
    c.puerta.pegar(aldaba, 0, 1.6, 0.1);
    const golpes: string[] = [];
    let ultimo = 0;
    const golpe = (largo: boolean) => {
      // En tiempo de verdad (el que dura el dedo apoyado también lo es)
      const ahora = performance.now() / 1000;
      if (ahora - ultimo > 2.5) golpes.length = 0;
      ultimo = ahora;
      golpes.push(largo ? 'L' : 'c');
      sfx.golpePuerta(largo);
      void c.escena.animar(largo ? 320 : 160, (k) => (aroPiv.rotation.x = -Math.sin(k * Math.PI) * 0.5));
      const ult = golpes.slice(-4).join('');
      if (ult === 'cccL') {
        c.bien();
        c.puerta.bloqueada = false;
        c.despues(500, () => {
          sonido.campana();
          c.resolver();
        });
      } else if (golpes.length >= 4 && largo) c.mal();
    };
    c.mantener(aldaba, () => {}, (ms) => golpe(ms > 550));
    // Un cuadrito de ambiente
    const cuadro = letrero(0.7, 0.5, (cx, w, h) => {
      cx.fillStyle = '#fff8ee';
      cx.fillRect(0, 0, w, h);
      cx.strokeStyle = '#8e5b3c';
      cx.lineWidth = 18;
      cx.strokeRect(0, 0, w, h);
      cx.fillStyle = '#3d2b27';
      cx.font = `600 ${h * 0.12}px ${FUENTE}`;
      cx.textAlign = 'center';
      cx.fillText('así tocamos nosotros:', w / 2, h * 0.3);
      // La contraseña: tres puntos y una raya
      cx.fillStyle = '#e4574b';
      for (let i = 0; i < 3; i++) {
        cx.beginPath();
        cx.arc(w * (0.2 + i * 0.13), h * 0.6, h * 0.05, 0, Math.PI * 2);
        cx.fill();
      }
      cx.fillRect(w * 0.58, h * 0.56, w * 0.26, h * 0.08);
    }, 'cuadro toc');
    en(cuadro, 2.7, 1.35, 0.02);
    // Otro cuadrito que no dice nada útil (despista)
    const otro = letrero(0.5, 0.36, (cx, w, h) => {
      cx.fillStyle = '#fff8ee';
      cx.fillRect(0, 0, w, h);
      cx.strokeStyle = '#8e5b3c';
      cx.lineWidth = 14;
      cx.strokeRect(0, 0, w, h);
      cx.fillStyle = '#3d2b27';
      cx.font = `600 ${h * 0.15}px ${FUENTE}`;
      cx.textAlign = 'center';
      cx.fillText('toc toc…', w / 2, h * 0.45);
      cx.fillText('¿quién es?', w / 2, h * 0.7);
    }, 'cuadro quien');
    en(otro, -2.2, 1.9, 0.02);
    c.g.add(otro);
    c.g.add(cuadro);
  },
  async prueba(p) {
    await p.tocar('aldaba toque', 3, 150);
    await p.mantener('aldaba toque', 900);
  },
};

// ---------------------------------------------------------------------------
// 3 · Las lámparas del cuadro
// ---------------------------------------------------------------------------
const ORDEN_COLORES = ['#F7C948', '#F59FC0', '#8EC5F0', '#8FD6B9'];
const lamparas: Nivel = {
  titulo: 'Las lámparas del cuadro',
  pistas: [
    'Las lámparas no se prenden en cualquier orden.',
    'Algo colgado en la pared tiene los mismos colores que las lámparas.',
    'Las franjas del cuadro del corazón se leen de arriba hacia abajo. La lámpara que no sale en el cuadro, ni la mires.',
  ],
  montar(c) {
    // El cuadro: un corazón a franjas
    const cuadro = letrero(0.8, 0.8, (cx, w, h) => {
      cx.fillStyle = '#fff8ee';
      cx.fillRect(0, 0, w, h);
      cx.save();
      cx.beginPath();
      const s = w * 0.8, x0 = w / 2, y0 = h * 0.52;
      cx.moveTo(x0, y0 + s * 0.4);
      cx.bezierCurveTo(x0 - s * 0.06, y0 + s * 0.34, x0 - s * 0.5, y0 + s * 0.06, x0 - s * 0.5, y0 - s * 0.14);
      cx.bezierCurveTo(x0 - s * 0.5, y0 - s * 0.42, x0 - s * 0.2, y0 - s * 0.5, x0, y0 - s * 0.28);
      cx.bezierCurveTo(x0 + s * 0.2, y0 - s * 0.5, x0 + s * 0.5, y0 - s * 0.42, x0 + s * 0.5, y0 - s * 0.14);
      cx.bezierCurveTo(x0 + s * 0.5, y0 + s * 0.06, x0 + s * 0.06, y0 + s * 0.34, x0, y0 + s * 0.4);
      cx.clip();
      const franja = (s * 0.9) / 4;
      ORDEN_COLORES.forEach((col, i) => {
        cx.fillStyle = col;
        cx.fillRect(0, y0 - s * 0.5 + i * franja, w, franja + 1);
      });
      cx.restore();
      cx.strokeStyle = '#8e5b3c';
      cx.lineWidth = 22;
      cx.strokeRect(0, 0, w, h);
    }, 'cuadro franjas');
    en(cuadro, -2.1, 1.8, 0.02);
    c.g.add(cuadro);
    const m = mesa(2.3, 0.5, 0.75, '#c49468', 'consola');
    en(m, 2.35, 0, 0.45);
    c.g.add(m);
    // Colores en otro orden sobre la mesa (y una lámpara lila que no está en el cuadro)
    const puestos = ['#8EC5F0', '#F7C948', '#8FD6B9', '#F59FC0', '#c9b6ea'];
    const lamps = puestos.map((col, i) => {
      const l = lamparita(col, `lampara ${i}`);
      en(l, 1.4 + i * 0.47, 0.75, 0.45);
      c.g.add(l);
      return { l, col, prendida: false };
    });
    let paso = 0;
    for (const x of lamps) {
      c.tocar(x.l, () => {
        if (x.prendida) return;
        x.prendida = true;
        x.l.userData.prender(true);
        sfx.prender(600 + paso * 120);
        if (x.col === ORDEN_COLORES[paso]) {
          paso++;
          if (paso === 4) {
            c.bien();
            c.despues(500, () => c.resolver());
          }
        } else {
          c.mal();
          c.despues(450, () => {
            for (const y of lamps) {
              y.prendida = false;
              y.l.userData.prender(false);
            }
          });
          paso = 0;
        }
      });
    }
  },
  async prueba(p) {
    for (const i of [1, 3, 0, 2]) await p.tocar(`lampara ${i}`);
  },
};

// ---------------------------------------------------------------------------
// 4 · Entre los cojines
// ---------------------------------------------------------------------------
const cojines: Nivel = {
  titulo: 'Entre los cojines',
  pistas: [
    'En este sofá se pierde todo.',
    'Los cojines no se levantan tocándolos: hay que alzarlos con el dedo.',
    'Desliza el dedo hacia arriba sobre cada cojín, uno por uno.',
  ],
  montar(c) {
    const s = sofa('#9ccbef');
    en(s, 2.35, 0, 0.75);
    c.g.add(s);
    const debajo = [
      () => {
        const miga = esfera(0.03, mat('#e8c07a'), 'migas');
        return miga;
      },
      () => {
        const control = caja(0.06, 0.03, 0.2, mat('#3d2b27'), 0.02, 'control');
        return control;
      },
      () => llave('llave'),
    ];
    const orden = [1, 2, 0];
    [1.75, 2.35, 2.95].forEach((x, i) => {
      const cosa = debajo[orden[i]]();
      en(cosa, x, 0.56, 0.8);
      c.g.add(cosa);
      if (cosa.name === 'llave') llaveParaLaPuerta(c, cosa);
      const cj = caja(0.55, 0.2, 0.55, mat(['#f4b6c2', '#f6cf5a', '#c9b6ea'][i]), 0.09, `cojin ${i}`);
      en(cj, x, 0.62, 0.8);
      c.g.add(cj);
      let levantado = false;
      c.tocar(cj, () => {
        if (levantado) return;
        void c.escena.animar(260, (k) => (cj.rotation.z = Math.sin(k * Math.PI * 2) * 0.08));
      });
      cj.userData.levantar = () => {
        if (levantado) return;
        levantado = true;
        sonido.rumor(0.25, 500, 0.06);
        const y0 = cj.position.y, x0 = cj.position.x;
        void c.escena.animar(600, (k) => {
          cj.position.y = y0 + Math.sin(k * Math.PI) * 0.5 + k * 0.25;
          cj.position.x = x0 + k * 0.1;
          cj.position.z = 0.8 - k * 0.45;
          cj.rotation.x = -k * 1.2;
        });
        c.quitarToque(cj);
      };
    });
    c.gesto.deslizar((dir, _v, obj) => {
      if (dir === 'arriba' && obj?.name.startsWith('cojin')) obj.userData.levantar();
    });
    const lampara = lamparita('#fff3e0', 'lampara piso');
    lampara.scale.setScalar(2.2);
    en(lampara, -1.2, 0, 0.5);
    c.g.add(lampara);
    lampara.userData.prender(true);
  },
  async prueba(p) {
    for (const i of [0, 1, 2]) await p.deslizar('arriba', `cojin ${i}`, 160);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 5 · El timbre trabado
// ---------------------------------------------------------------------------
/** Toques seguidos que necesita (se van perdiendo de a 1,3 por segundo si se descansa). */
const META_TIMBRE = 12;
const timbre: Nivel = {
  titulo: 'El timbre trabado',
  pistas: [
    'El timbre está trabado, no dañado.',
    'Un toquecito no le alcanza. Fíjate en la lucecita alrededor del botón.',
    'Tócalo muy rápido y sin parar: si descansas, la lucecita se apaga y toca empezar otra vez.',
  ],
  async montar(c) {
    // Grande y con un área de toque generosa: hay que darle muy seguido (sirve tamborilear con dos dedos)
    const base = caja(0.44, 0.6, 0.04, mat('#fff8ee'), 0.05, 'timbre base');
    en(base, 1.05, 1.25, 0.02);
    const aro = toro(0.15, 0.024, matNuevo('#e4574b', { emisivo: '#e4574b', intensidad: 0 }), 'aro timbre');
    en(aro, 1.05, 1.29, 0.05);
    const boton = cilindro(0.115, 0.125, 0.05, mat('#f6cf5a'), 'timbre');
    boton.rotation.x = Math.PI / 2;
    en(boton, 1.05, 1.29, 0.06);
    const area = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
    area.name = 'timbre toque';
    en(area, 1.05, 1.27, 0.08);
    c.g.add(base, aro, boton, area);
    let carga = 0;
    let listo = false;
    // Cuenta al bajar el dedo (no al soltarlo): aunque el dedo se corra un poquito al darle rápido, vale
    const golpe = () => {
      if (listo) return;
      carga += 1;
      sfx.timbreTrabado(Math.min(1, carga / META_TIMBRE));
      void c.escena.animar(90, (k) => (boton.position.z = 0.06 - Math.sin(k * Math.PI) * 0.02));
      if (carga >= META_TIMBRE) {
        listo = true;
        c.bien();
        // ¡Ding… dong! (y otra vez, por si no oyeron)
        sfx.timbre();
        sfx.timbre(1.5);
        c.despues(1800, () => c.resolver());
      }
    };
    c.mantener(area, golpe, () => {});
    c.cada((dt) => {
      if (!listo) carga = Math.max(0, carga - dt * 1.3);
      (aro.material as THREE.MeshStandardMaterial).emissiveIntensity = listo ? 2 : (carga / META_TIMBRE) * 1.6;
    });
    await adorno(c, 'deco_girasoles', 1.0, -1.6, 0, 0.5);
    await adorno(c, 'deco_cuadro_flores', 0.7, 2.1, 1.4, 0.02);
  },
  async prueba(p) {
    await p.tocar('timbre toque', 18, 60);
  },
};

// ---------------------------------------------------------------------------
// 6 · El laberinto de canica
// ---------------------------------------------------------------------------
const TABLA = { w: 1.2, h: 1.0, solidos: [[0, 0.68, 0.92, 0.72], [0.28, 0.43, 1.2, 0.47], [0, 0.18, 0.86, 0.22]] as [number, number, number, number][] };
const laberinto: Nivel = {
  titulo: 'El laberinto de canica',
  pistas: [
    'La canica no se mueve con el dedo… al menos no al principio.',
    'La canica rueda hacia donde se incline el mundo. Y tu mundo cabe en tu mano.',
    'Gira el celular como un timón, a un lado y al otro, para bajarla piso por piso hasta el hoyito.',
  ],
  montar(c) {
    const x0 = 1.4, y0 = 1.1;
    const tablero = grupo('tablero');
    en(tablero, x0, y0, 0.06);
    c.g.add(tablero);
    tablero.add(en(caja(TABLA.w + 0.1, TABLA.h + 0.1, 0.06, mat('#8e5b3c'), 0.03), TABLA.w / 2, TABLA.h / 2, -0.04));
    tablero.add(en(caja(TABLA.w, TABLA.h, 0.02, mat('#fff3e0'), 0.01), TABLA.w / 2, TABLA.h / 2, -0.005));
    for (const [a, b, cc, d] of TABLA.solidos) tablero.add(en(caja(cc - a, d - b, 0.05, mat('#c49468'), 0.008), (a + cc) / 2, (b + d) / 2, 0.02));
    const hoyo = cilindro(0.05, 0.05, 0.02, mat('#2a211d'), 'hoyo');
    hoyo.rotation.x = Math.PI / 2;
    en(hoyo, 0.12, 0.05, 0.005);
    tablero.add(hoyo);
    const bola = esfera(0.035, mat('#e4574b', { rough: 0.2, metal: 0.2 }), 'canica');
    tablero.add(bola);
    const canica = new Canica(TABLA, 0.1, 0.8);
    bola.userData.canica = canica;
    // Bandeja debajo donde cae la llave
    const bandeja = caja(0.4, 0.08, 0.2, mat('#8e5b3c'), 0.03);
    en(bandeja, x0 + 0.12, y0 - 0.25, 0.12);
    c.g.add(bandeja);
    const k = llave('llave', '#f2c75c', false);
    k.visible = false;
    en(k, x0 + 0.12, y0 - 0.12, 0.14);
    c.g.add(k);
    let hecho = false;
    let arrastrando = false;
    c.cada((dt) => {
      if (hecho) return;
      const s = c.sensores;
      const ax = s.inclinacion.x * 9.8 * 0.35, ay = -s.inclinacion.y * 9.8 * 0.35;
      if (!arrastrando) canica.paso(dt, ax, ay);
      bola.position.set(canica.x, canica.y, 0.035);
      bola.rotation.z = -canica.x / 0.035;
      if (Math.hypot(canica.x - 0.12, canica.y - 0.05) < 0.05) {
        hecho = true;
        sonido.nota(300, 0.3, 0, 'sine', 0.1, 120);
        bola.visible = false;
        c.bien();
        k.visible = true;
        void c.escena.animar(500, (t) => (k.position.y = y0 - 0.12 - t * 0.1));
        llaveParaLaPuerta(c, k);
      }
    });
    // Sin acelerómetro: se lleva la canica con el dedo
    c.despues(3000, () => {
      if (c.sensores.hayMovimiento || hecho) return;
      c.aviso('Este celular no avisa cuando se gira: lleva la canica con el dedo.', 3500);
      c.mantener(bola, () => (arrastrando = true), () => (arrastrando = false));
      c.gesto.mover((x, y, abajo) => {
        if (!abajo || !arrastrando) return;
        const pnt = c.enPlano(x, y, planoPared(0.095));
        if (!pnt) return;
        const dx = pnt.x - x0 - canica.x, dy = pnt.y - y0 - canica.y;
        canica.vx = dx * 12;
        canica.vy = dy * 12;
        canica.paso(0.03, 0, 0);
      });
    });
  },
  async prueba(p) {
    const canica = p.obj('canica').userData.canica as Canica;
    // Derecha, izquierda, derecha, izquierda (girando el celular)
    p.sensor.inclinar(0.75, 0.66);
    await p.esperarQue(() => canica.y < 0.66, 60000);
    p.sensor.inclinar(-0.75, 0.66);
    await p.esperarQue(() => canica.y < 0.42, 60000);
    p.sensor.inclinar(0.75, 0.66);
    await p.esperarQue(() => canica.y < 0.17, 60000);
    p.sensor.inclinar(-0.8, 0.6);
    await p.esperarQue(() => !p.obj('canica').visible, 60000);
    p.sensor.soltar();
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 7 · La foto rota
// ---------------------------------------------------------------------------
const CODIGO_FOTO = '5283';
function dibujoFoto(cx: CanvasRenderingContext2D, w: number, h: number) {
  const g = cx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#9ccbef');
  g.addColorStop(1, '#fbe3d0');
  cx.fillStyle = g;
  cx.fillRect(0, 0, w, h);
  // Los dos (caritas redondas) y un corazón
  const cara = (x: number, pelo: string, largo: boolean) => {
    cx.fillStyle = pelo;
    if (largo) cx.fillRect(x - w * 0.13, h * 0.3, w * 0.26, h * 0.5);
    cx.beginPath();
    cx.arc(x, h * 0.46, w * 0.13, Math.PI, 0);
    cx.fill();
    cx.fillStyle = '#f7d2b6';
    cx.beginPath();
    cx.arc(x, h * 0.52, w * 0.11, 0, Math.PI * 2);
    cx.fill();
    cx.fillStyle = '#2a211d';
    cx.beginPath();
    cx.arc(x - w * 0.035, h * 0.52, w * 0.012, 0, Math.PI * 2);
    cx.arc(x + w * 0.035, h * 0.52, w * 0.012, 0, Math.PI * 2);
    cx.fill();
    cx.strokeStyle = '#2a211d';
    cx.lineWidth = 3;
    cx.beginPath();
    cx.arc(x, h * 0.56, w * 0.03, 0.2, Math.PI - 0.2);
    cx.stroke();
  };
  cara(w * 0.35, '#1c1917', false);
  cara(w * 0.65, '#1c1917', true);
  cx.fillStyle = '#e4574b';
  cx.font = `700 ${h * 0.18}px sans-serif`;
  cx.textAlign = 'center';
  cx.fillText('♥', w * 0.5, h * 0.3);
  // Un número en cada esquina (se leen en el sentido del reloj)
  const esquinas: [number, number][] = [[0.1, 0.14], [0.9, 0.14], [0.9, 0.92], [0.1, 0.92]];
  esquinas.forEach(([x, y], i) => textoEn(cx, CODIGO_FOTO[i], w * x, h * y, h * 0.13, '#3d2b27', 700));
}

const fotoRota: Nivel = {
  titulo: 'La foto rota',
  pistas: [
    'Los pedazos de la foto quieren volver a su marco.',
    'Arrastra cada pedazo al marco vacío. La foto armada tiene algo en las esquinas.',
    'Los números de las esquinas se leen como avanzan las agujas del reloj, empezando arriba a la izquierda. Hay un teclado junto a la puerta.',
  ],
  montar(c) {
    const W = 0.8, H = 0.6;
    const cx0 = -2.1, cy0 = 1.75;
    const marco = grupo('marco foto');
    marco.add(en(caja(W + 0.12, H + 0.12, 0.04, mat('#8e5b3c'), 0.02), 0, 0, -0.01), en(caja(W, H, 0.02, mat('#efe2d0'), 0.005), 0, 0, 0.01));
    en(marco, cx0, cy0, 0.02);
    c.g.add(marco);
    const tex = lienzo(512, 384, dibujoFoto);
    const desordenado: [number, number][] = [[1.55, 2.2], [2.5, 1.35], [-1.0, 2.35], [1.6, 0.9]];
    let puestas = 0;
    for (let i = 0; i < 4; i++) {
      const col = i % 2, fil = Math.floor(i / 2);
      const geo = new THREE.PlaneGeometry(W / 2, H / 2);
      const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
      for (let v = 0; v < uv.count; v++) uv.setXY(v, (uv.getX(v) + col) / 2, (uv.getY(v) + (1 - fil)) / 2);
      const pedazo = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, side: THREE.DoubleSide }));
      pedazo.name = `pedazo ${i}`;
      pedazo.castShadow = true;
      const destino = new THREE.Vector3(cx0 + (col - 0.5) * (W / 2), cy0 + (0.5 - fil) * (H / 2), 0.05);
      const [dx, dy] = desordenado[i];
      en(pedazo, dx, dy, 0.05);
      pedazo.rotation.z = (i - 1.5) * 0.25;
      c.g.add(pedazo);
      let fijo = false;
      c.arrastrar(pedazo, {
        plano: planoPared(0.05),
        limites: limites(-3.6, 0.4, 0.05, 3.6, 2.8, 0.05),
        alTomar: () => {
          if (!fijo) pedazo.rotation.z = 0;
        },
        alSoltar: (pnt) => {
          if (fijo) return;
          if (pnt.distanceTo(destino) < 0.16) {
            fijo = true;
            pedazo.position.copy(destino);
            c.quitarToque(pedazo);
            puestas++;
            c.bien();
            if (puestas === 4) sonido.regalo();
          } else if (Math.abs(pnt.x - cx0) < W && Math.abs(pnt.y - cy0) < H) c.mal();
        },
      });
    }
    // Teclado junto a la puerta
    const caja4 = grupo('teclado puerta');
    caja4.add(caja(0.2, 0.28, 0.05, mat('#3d2b27'), 0.03));
    for (let f = 0; f < 3; f++) for (let k = 0; k < 3; k++) caja4.add(en(caja(0.04, 0.04, 0.02, mat('#efe2d0'), 0.008), -0.055 + k * 0.055, 0.06 - f * 0.055, 0.03));
    caja4.add(en(caja(0.14, 0.04, 0.02, matNuevo('#7ff0b0', { emisivo: '#2f8f68', intensidad: 0.6 }), 0.008), 0, 0.105, 0.03));
    en(caja4, 0.98, 1.25, 0.03);
    c.g.add(caja4);
    c.tocar(caja4, async () => {
      await c.enfocar(caja4, 0.9);
      const ok = await c.ui.teclado({ titulo: 'Teclado de la puerta', largo: 4, correcto: CODIGO_FOTO });
      if (ok) c.resolver();
      else await c.volver();
    });
  },
  async prueba(p) {
    const W = 0.8, H = 0.6, cx0 = -2.1, cy0 = 1.75;
    for (let i = 0; i < 4; i++) {
      const col = i % 2, fil = Math.floor(i / 2);
      await p.arrastrar(`pedazo ${i}`, new THREE.Vector3(cx0 + (col - 0.5) * (W / 2), cy0 + (0.5 - fil) * (H / 2), 0.05), 18);
    }
    await p.tocar('teclado puerta');
    await p.panel(CODIGO_FOTO);
  },
};

// ---------------------------------------------------------------------------
// 8 · Lo que brilla en la oscuridad
// ---------------------------------------------------------------------------
const CODIGO_ESTRELLAS = ['4', '1', '7'];
function estrellasNumero(d: string): [number, number][] {
  // Dígitos de 3×5 puntos
  const F: Record<string, string[]> = {
    '4': ['101', '101', '111', '001', '001'],
    '1': ['010', '110', '010', '010', '111'],
    '7': ['111', '001', '010', '010', '010'],
  };
  const pts: [number, number][] = [];
  F[d].forEach((fila, y) => [...fila].forEach((v, x) => v === '1' && pts.push([x, 4 - y])));
  return pts;
}

/** Resplandor suave alrededor de cada estrellita (se ve solo a oscuras). */
let texHalo: THREE.Texture | null = null;
function haloTextura() {
  return (texHalo ??= lienzo(64, 64, (c) => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  }));
}

const oscuridad: Nivel = {
  titulo: 'Lo que brilla en la oscuridad',
  pareja: { pista: ['estrellas codigo'] },
  pistas: [
    'Hay cosas que con la luz prendida no se ven.',
    'Busca cómo dejar el cuarto a oscuras.',
    'Con el interruptor de junto a la puerta apagado, mira hacia arriba: las estrellas que forman números son las de la cajita fuerte.',
  ],
  montar(c) {
    // Interruptor
    const inter = grupo('interruptor');
    inter.add(caja(0.12, 0.2, 0.03, mat('#fff8ee'), 0.02));
    const palanca = caja(0.04, 0.07, 0.04, mat('#efe2d0'), 0.012, 'palanca');
    en(palanca, 0, 0.02, 0.025);
    inter.add(palanca);
    en(inter, -0.98, 1.25, 0.02);
    c.g.add(inter);
    // Estrellitas en la pared del fondo, a la derecha de la puerta y por encima de la cajita (solo se ven a
    // oscuras). Van donde nada las tapa: ni la lámpara, ni el corazón de la puerta, ni lo que se cuelgue o se tire.
    const brillos: THREE.Mesh[] = [];
    const mb = new THREE.MeshBasicMaterial({ color: '#d9ff9a', transparent: true, opacity: 0, toneMapped: false });
    const halo = new THREE.MeshBasicMaterial({ map: haloTextura(), color: '#c8ff8a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const codigo = grupo('estrellas codigo');
    CODIGO_ESTRELLAS.forEach((d, i) => {
      for (const [x, y] of estrellasNumero(d)) {
        const px = 1.25 + i * 0.62 + x * 0.105, py = 1.86 + y * 0.105;
        const e = estrella(0.082, 0.012, mb);
        en(e, px, py, 0.03);
        const h = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), halo);
        en(h, px, py, 0.025);
        codigo.add(h, e);
        brillos.push(e);
      }
    });
    c.g.add(codigo);
    // Que nada las tape (el desorden se riega lejos y la decoración que estorbe se quita)
    c.proteger(codigo);
    // Unas estrellas de adorno también (despistan un poquito), lejos del número
    for (const [x, y] of [[-3.4, 2.1], [-2.5, 2.35], [-1.9, 2.95], [-3.0, 2.85], [-2.2, 1.9], [-0.95, 2.6], [0.95, 2.75], [3.45, 2.95], [3.5, 1.65], [3.1, 2.55]]) {
      const e = estrella(0.05, 0.01, mb);
      en(e, x, y, 0.03);
      c.g.add(e);
    }
    let luz = 1, meta = 1;
    c.tocar(inter, () => {
      meta = meta > 0.5 ? 0.06 : 1;
      palanca.position.y = meta > 0.5 ? 0.02 : -0.02;
      sfx.interruptor();
      if (meta < 0.5) c.bien();
    });
    c.cada((dt) => {
      luz += (meta - luz) * Math.min(1, dt * 6);
      c.escena.atenuar(luz);
      mb.opacity = Math.max(0, 1 - luz * 1.4);
      halo.opacity = mb.opacity * 0.55;
    });
    // Cajita fuerte con candado de tres ruedas
    const m = mesa(0.8, 0.5, 0.7, '#c49468', 'mesita');
    en(m, 2.2, 0, 0.6);
    // Hueca: al abrirla se ve la llave adentro, sobre un cojincito (y el toque le llega por la boca)
    const caja3 = grupo('cajita fuerte');
    const acero = mat('#6b7680', { metal: 0.5, rough: 0.45 });
    const W = 0.5, H = 0.4, D = 0.4, E = 0.04;
    caja3.add(en(caja(W, H, E, acero, 0.015), 0, 0, -D / 2 + E / 2));
    for (const s of [-1, 1]) {
      caja3.add(en(caja(W, E, D, acero, 0.015), 0, s * (H / 2 - E / 2), 0));
      caja3.add(en(caja(E, H, D, acero, 0.015), s * (W / 2 - E / 2), 0, 0));
    }
    caja3.add(en(caja(W - 2 * E, H - 2 * E, 0.006, mat('#2b2f36', { rough: 0.9 }), 0), 0, 0, -D / 2 + E + 0.004));
    caja3.add(en(caja(0.32, 0.035, 0.24, mat('#b3263a', { rough: 0.85 }), 0.015), 0, -H / 2 + E + 0.018, 0.02));
    // Bisagras
    for (const y of [-0.11, 0.11]) caja3.add(en(cilindro(0.014, 0.014, 0.07, mat('#d9b25a', { metal: 0.7, rough: 0.3 })), -W / 2 + 0.02, y, D / 2 + 0.012));
    const puertita = grupo('puertita');
    puertita.add(en(caja(0.42, 0.32, 0.03, mat('#8a949e', { metal: 0.5, rough: 0.4 }), 0.02), 0.21, 0, 0));
    puertita.add(en(cilindro(0.05, 0.05, 0.03, mat('#d9b25a', { metal: 0.7, rough: 0.3 })), 0.3, 0, 0.03));
    (puertita.children[1] as THREE.Mesh).rotation.x = Math.PI / 2;
    en(puertita, -0.21, 0, 0.21);
    caja3.add(puertita);
    en(caja3, 2.2, 0.9, 0.6);
    c.g.add(m, caja3);
    const k = llave('llave', '#f2c75c', true);
    en(k, 2.2, 0.79, 0.62);
    k.visible = false;
    c.g.add(k);
    let abierta = false;
    c.tocar(caja3, async () => {
      if (abierta) return;
      const ok = await c.ui.ruedas({ titulo: 'Cajita fuerte', ruedas: [0, 1, 2].map(() => '0123456789'.split('')), correcto: CODIGO_ESTRELLAS });
      if (!ok) return;
      abierta = true;
      c.bien();
      k.visible = true;
      llaveParaLaPuerta(c, k);
      await c.escena.animar(600, (t) => (puertita.rotation.y = -t * 1.9));
    });
  },
  async prueba(p) {
    await p.tocar('interruptor');
    await p.esperar(400);
    await p.tocar('interruptor');
    await p.tocar('cajita fuerte');
    await p.panel(CODIGO_ESTRELLAS.join(''));
    await p.esperar(800);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 9 · El reloj sin hora
// ---------------------------------------------------------------------------
const reloj: Nivel = {
  titulo: 'El reloj sin hora',
  pistas: [
    'Ese reloj está perdido en el tiempo.',
    'El papelito del reloj dice qué hora quiere: la de verdad.',
    'Mueve las dos manecillas hasta la hora de este momento, la que marca tu celular: la corta es la hora y la larga los minutos.',
  ],
  async montar(c) {
    const cx0 = -2.0, cy0 = 1.8, R = 0.42;
    const centro = new THREE.Vector3(cx0, cy0, 0.06);
    const cara = letrero(R * 2.2, R * 2.2, (cx, w, h) => {
      cx.fillStyle = '#fff8ee';
      cx.beginPath();
      cx.arc(w / 2, h / 2, w * 0.48, 0, Math.PI * 2);
      cx.fill();
      cx.strokeStyle = '#8e5b3c';
      cx.lineWidth = w * 0.05;
      cx.stroke();
      for (let i = 1; i <= 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        textoEn(cx, String(i), w / 2 + Math.sin(a) * w * 0.36, h / 2 - Math.cos(a) * h * 0.36, w * 0.09, '#3d2b27', 700);
      }
    }, 'reloj cara', { transparente: true });
    en(cara, cx0, cy0, 0.03);
    c.g.add(cara);
    const manecilla = (largo: number, grosor: number, color: string, nombre: string) => {
      const piv = grupo(nombre);
      const m = caja(grosor, largo, 0.015, mat(color), grosor / 3);
      en(m, 0, largo / 2 - 0.03, 0);
      piv.add(m);
      const toque = new THREE.Mesh(new THREE.BoxGeometry(0.1, largo, 0.04), new THREE.MeshBasicMaterial({ visible: false }));
      toque.position.y = largo / 2;
      piv.add(toque);
      en(piv, cx0, cy0, nombre === 'minutero' ? 0.07 : 0.06);
      c.g.add(piv);
      return piv;
    };
    const horario = manecilla(0.24, 0.05, '#3d2b27', 'horario');
    const minutero = manecilla(0.36, 0.035, '#e4574b', 'minutero');
    horario.rotation.z = -1.3;
    minutero.rotation.z = -3.5;
    c.g.add(en(esfera(0.03, mat('#d9b25a', { metal: 0.7, rough: 0.3 })), cx0, cy0, 0.08));
    let moviendo: THREE.Object3D | null = null;
    const angulo = (o: THREE.Object3D) => ((-o.rotation.z % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const revisar = () => {
      const d = new Date();
      const h = d.getHours() % 12, m = d.getMinutes();
      const aMin = (m / 60) * Math.PI * 2, aHora = ((h + m / 60) / 12) * Math.PI * 2;
      const dif = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
      if (dif(angulo(minutero), aMin) < 0.45 && dif(angulo(horario), aHora) < 0.4) {
        hecho = true;
        c.bien();
        void pajarito();
      }
    };
    let hecho = false;
    // Se agarra la manecilla según dónde se toca: lejos del centro, el minutero; cerca, la más parecida
    // (cuando se enciman, cerca del centro gana el horario, que es el de abajo)
    const toqueReloj = new THREE.Mesh(new THREE.CircleGeometry(R * 1.05, 32), new THREE.MeshBasicMaterial({ visible: false }));
    toqueReloj.name = 'reloj toque';
    en(toqueReloj, cx0, cy0, 0.09);
    c.g.add(toqueReloj);
    c.mantener(toqueReloj, (hit) => {
      const d = Math.hypot(hit.point.x - cx0, hit.point.y - cy0);
      const a = Math.atan2(hit.point.x - cx0, hit.point.y - cy0);
      const dif = (o: THREE.Object3D) => Math.abs(Math.atan2(Math.sin(a - angulo(o)), Math.cos(a - angulo(o))));
      moviendo = d > 0.27 ? minutero : dif(horario) < 0.35 || dif(horario) < dif(minutero) ? horario : minutero;
    }, () => {
      moviendo = null;
      sfx.clic();
      if (!hecho) revisar();
    });
    // Tic tac de fondo (se calla cuando llega la hora)
    let tic = 0;
    c.cada((dt) => {
      tic += dt;
      if (tic > 2 && !hecho) {
        tic = 0;
        sfx.tictac(4, 0.5);
      }
    });
    // Un papelito pegado debajo del reloj
    const papel = letrero(0.46, 0.16, (cx, w, h) => {
      cx.fillStyle = '#fff3a8';
      cx.fillRect(0, 0, w, h);
      textoEn(cx, 'aquí siempre es ahora', w / 2, h / 2, h * 0.34, '#3d2b27', 700);
    }, 'papel reloj');
    papel.rotation.z = -0.05;
    en(papel, cx0 + 0.05, cy0 - R - 0.2, 0.03);
    c.g.add(papel);
    c.gesto.mover((x, y, abajo) => {
      if (!abajo || !moviendo || hecho) return;
      const pnt = c.enPlano(x, y, planoPared(0.06));
      if (!pnt) return;
      const a = Math.atan2(pnt.x - centro.x, pnt.y - centro.y);
      moviendo.rotation.z = -a;
    });
    // El pajarito del reloj trae la llave
    const casita = grupo('puertita reloj');
    en(casita, cx0, cy0 + R + 0.14, 0.05);
    casita.add(caja(0.2, 0.16, 0.08, mat('#8e5b3c'), 0.02));
    c.g.add(casita);
    const pajaro = grupo('pajarito');
    pajaro.add(esfera(0.06, mat('#f6cf5a')), en(esfera(0.02, mat('#e4574b')), 0, 0, 0.06));
    const k = llave('llave', '#f2c75c', false);
    k.scale.setScalar(0.8);
    en(k, 0.05, -0.07, 0.03);
    pajaro.add(k);
    en(pajaro, 0, 0, 0);
    pajaro.visible = false;
    casita.add(pajaro);
    const pajarito = async () => {
      pajaro.visible = true;
      // ¡Cucú, cucú!
      for (let i = 0; i < 2; i++) {
        sonido.nota(784, 0.18, i * 0.5, 'sine', 0.1);
        sonido.nota(622, 0.26, i * 0.5 + 0.2, 'sine', 0.1);
      }
      llaveParaLaPuerta(c, k);
      await c.escena.animar(500, (t) => (pajaro.position.z = t * 0.25));
    };
    await adorno(c, 'deco_estanteria', 1.9, 2.3, 0, 0.35);
  },
  async prueba(p) {
    const d = new Date();
    const h = d.getHours() % 12, m = d.getMinutes();
    const aMin = (m / 60) * Math.PI * 2, aHora = ((h + m / 60) / 12) * Math.PI * 2;
    const cx0 = -2.0, cy0 = 1.8;
    const punta = (o: string, r: number) => {
      const a = -p.obj(o).rotation.z;
      return new THREE.Vector3(cx0 + Math.sin(a) * r, cy0 + Math.cos(a) * r, 0.09);
    };
    // Minutero por la punta, horario desde cerca del centro
    await p.arrastrarDesde(punta('minutero', 0.33), new THREE.Vector3(cx0 + Math.sin(aMin) * 0.33, cy0 + Math.cos(aMin) * 0.33, 0.09));
    await p.arrastrarDesde(punta('horario', 0.16), new THREE.Vector3(cx0 + Math.sin(aHora) * 0.16, cy0 + Math.cos(aHora) * 0.16, 0.09));
    await p.esperarQue(() => p.obj('pajarito').visible, 20000);
    await p.esperar(900);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 10 · La llave en la lámpara
// ---------------------------------------------------------------------------
const lampara: Nivel = {
  titulo: 'La llave en la lámpara',
  pistas: [
    'Lo que buscas no está en el piso.',
    'Mira la lámpara del techo. ¿Cómo se baja algo que cuelga tan alto?',
    'Hay que mover la lámpara hasta que suelte lo que tiene: con el celular entero… o con muchos toquecitos.',
  ],
  async montar(c) {
    const piv = grupo('colgante');
    en(piv, LAMPARA.x, 3.2 - 0.86, LAMPARA.z);
    const hilo = cilindro(0.004, 0.004, 0.6, mat('#3d2b27'));
    en(hilo, 0, -0.3, 0);
    const k = llave('llave', '#f2c75c', false);
    k.rotation.z = Math.PI / 2;
    en(k, 0, -0.62, 0);
    piv.add(hilo, k);
    c.g.add(piv);
    const toque = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.5), new THREE.MeshBasicMaterial({ visible: false }));
    toque.name = 'lampara toque';
    en(toque, LAMPARA.x, 2.25, LAMPARA.z);
    c.g.add(toque);
    let vaiven = 0, fase = 0, caida = false;
    const empujar = (f: number) => {
      if (caida) return;
      vaiven = Math.min(0.9, vaiven + f);
      sonido.rumor(0.2, 900, 0.04);
      // La cadenita de la lámpara
      sfx.cadena();
      if (vaiven > 0.75) soltar();
    };
    const soltar = () => {
      caida = true;
      c.bien();
      const mundo = k.getWorldPosition(new THREE.Vector3());
      piv.remove(k);
      k.position.copy(mundo);
      k.rotation.set(-Math.PI / 2, 0, 0.4);
      c.g.add(k);
      const y0 = mundo.y;
      void c.escena.animar(700, (t) => {
        k.position.y = y0 - (y0 - 0.03) * t * t;
        if (t >= 1) sonido.nota(1500, 0.08, 0, 'triangle', 0.06);
      }, (t) => t);
      llaveParaLaPuerta(c, k);
    };
    c.sensor.sacudida(() => empujar(0.4));
    c.tocar(toque, () => empujar(0.11));
    c.cada((dt) => {
      fase += dt * 3;
      vaiven = Math.max(0, vaiven - dt * 0.08);
      piv.rotation.z = Math.sin(fase) * vaiven * 0.5;
    });
    const s = sofa('#f4b6c2');
    en(s, 1.9, 0, 0.7);
    c.g.add(s);
    await adorno(c, 'deco_osito', 0.45, 1.6, 0.54, 0.75);
  },
  async prueba(p) {
    p.sensor.sacudir();
    await p.esperar(200);
    p.sensor.sacudir();
    await p.esperarQue(() => p.obj('llave').position.y < 0.2, 20000);
    await p.esperar(300);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

export const CAP1: Nivel[] = [tapete, golpecitos, lamparas, cojines, timbre, laberinto, fotoRota, oscuridad, reloj, lampara];
