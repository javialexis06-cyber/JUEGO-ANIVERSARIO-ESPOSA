// Capítulo 4 · La terminal (puertas 31–40): deducir con mapa y tablero, contar calcomanías, parar letras a
// tiempo, deslizar con la velocidad justa, recorrer carreteras, seguir una regla, quedarse quieto, sacudir la
// máquina de dulces, observar la banda de maletas y cerrar los ojos en el túnel.
import * as THREE from 'three';
import * as sonido from '../../sonido';
import * as sfx from '../sonidos';
import { caja, cilindro, en, esfera, grupo, letrero, mat, matNuevo, textoEn, toro } from '../kit';
import type { Ctx, Nivel } from '../nivel';
import { banca, llave, relojPared, tecladoPared } from './piezas';

function llaveParaLaPuerta(c: Ctx, k: THREE.Object3D) {
  c.tocar(k, () => c.dar('llave', k));
  c.conLlave();
}

function abrirYa(c: Ctx, ms = 700) {
  c.bien();
  c.puerta.bloqueada = false;
  c.despues(ms, () => c.resolver());
}

// ---------------------------------------------------------------------------
// 31 · El bus a donde vamos
// ---------------------------------------------------------------------------
const SALIDAS: [string, string, string][] = [['Cali', '18:40', '3'], ['Bogotá', '19:15', '8'], ['Cartagena', '20:30', '12'], ['Medellín', '21:05', '5'], ['Bucaramanga', '22:00', '7']];
const tablero: Nivel = {
  titulo: 'El bus a donde vamos',
  pistas: [
    'Antes de viajar hay que saber para dónde.',
    'El mapa tiene marcada una ciudad especial; el tablero de salidas dice de qué andén sale su bus.',
    'Busca en el tablero la ciudad marcada en el mapa y escribe su andén en el teclado de la puerta.',
  ],
  montar(c) {
    const mapa = letrero(1.0, 0.8, (cx, w, h) => {
      cx.fillStyle = '#fff3e0';
      cx.fillRect(0, 0, w, h);
      cx.strokeStyle = '#8a5e40';
      cx.lineWidth = 16;
      cx.strokeRect(0, 0, w, h);
      const ciudades: [string, number, number][] = [['Cartagena', 0.4, 0.14], ['Medellín', 0.36, 0.52], ['Bucaramanga', 0.66, 0.42], ['Bogotá', 0.58, 0.68], ['Cali', 0.3, 0.84]];
      cx.strokeStyle = '#c9b6ea';
      cx.lineWidth = 6;
      cx.beginPath();
      [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [1, 4], [3, 4]].forEach(([a, b]) => {
        cx.moveTo(ciudades[a][1] * w, ciudades[a][2] * h);
        cx.lineTo(ciudades[b][1] * w, ciudades[b][2] * h);
      });
      cx.stroke();
      for (const [n, x, y] of ciudades) {
        cx.fillStyle = '#26375E';
        cx.beginPath();
        cx.arc(x * w, y * h, 10, 0, Math.PI * 2);
        cx.fill();
        textoEn(cx, n, x * w, y * h + 26, 22, '#3d2b27', 600);
      }
      textoEn(cx, '♥', 0.4 * w + 28, 0.14 * h - 6, 44, '#e4574b', 700);
    }, 'mapa');
    en(mapa, -1.7, 1.3, 0.03);
    c.g.add(mapa);
    const tab = letrero(1.6, 1.05, (cx, w, h) => {
      cx.fillStyle = '#1e2430';
      cx.fillRect(0, 0, w, h);
      cx.font = `700 ${h * 0.085}px 'Courier Prime', monospace`;
      cx.fillStyle = '#F7C948';
      cx.fillText('DESTINO       HORA  ANDÉN', w * 0.05, h * 0.13);
      SALIDAS.forEach(([d, hr, a], i) => {
        cx.fillStyle = '#f6f1e6';
        cx.fillText(`${d.padEnd(13, ' ')} ${hr}  ${a.padStart(3, ' ')}`, w * 0.05, h * (0.3 + i * 0.15));
      });
    }, 'tablero salidas');
    en(tab, 2.25, 1.8, 0.03);
    c.g.add(tab);
    const b = banca();
    en(b, 2.1, 0, 0.7);
    c.g.add(b);
    tecladoPared(c, 0.98, 1.25, 0.05, '12', 'Andén');
  },
  async prueba(p) {
    await p.tocar('teclado');
    await p.panel('12');
  },
};

// ---------------------------------------------------------------------------
// 32 · La maleta de los viajes
// ---------------------------------------------------------------------------
const maleta: Nivel = {
  titulo: 'La maleta de los viajes',
  pistas: [
    'Esa maleta ha viajado mucho… y se nota.',
    'El candado tiene tres símbolos; la maleta está llena de esos mismos símbolos.',
    'Cuenta cuántas calcomanías hay de cada forma y ponlas en el candado en el orden de sus símbolos.',
  ],
  montar(c) {
    const b = banca(1.8);
    en(b, 2.1, 0, 0.85);
    c.g.add(b);
    const mal = grupo('maleta');
    const cuerpo = caja(0.9, 0.6, 0.3, mat('#e4574b'), 0.06);
    en(cuerpo, 0, 0.3, 0);
    const tapa = grupo('tapa maleta');
    const tapaC = caja(0.9, 0.08, 0.3, mat('#c94a3e'), 0.04);
    en(tapaC, 0, 0.04, 0.15);
    tapa.add(tapaC);
    en(tapa, 0, 0.6, -0.15);
    const asa = toro(0.1, 0.02, mat('#3d2b27'), undefined, Math.PI);
    en(asa, 0, 0.68, 0);
    mal.add(cuerpo, tapa, asa);
    const pegatinas = letrero(0.84, 0.54, (cx, w, h) => {
      let s = 7;
      const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      const puestos: [string, string][] = [];
      for (let i = 0; i < 4; i++) puestos.push(['★', '#F7C948']);
      for (let i = 0; i < 2; i++) puestos.push(['♥', '#F59FC0']);
      for (let i = 0; i < 6; i++) puestos.push(['☀', '#fff3a0']);
      puestos.sort(() => r() - 0.5);
      puestos.forEach(([ch, col], i) => {
        const x = (0.12 + (i % 4) * 0.25) * w, y = (0.2 + Math.floor(i / 4) * 0.3) * h + (r() - 0.5) * 20;
        textoEn(cx, ch, x + (r() - 0.5) * 30, y, h * 0.2, col, 700);
      });
    }, undefined, { transparente: true });
    en(pegatinas, 0, 0.3, 0.155);
    mal.add(pegatinas);
    const candado = caja(0.12, 0.08, 0.04, mat('#d9b25a', { metal: 0.7, rough: 0.3 }), 0.015, 'candado maleta');
    en(candado, 0, 0.56, 0.17);
    mal.add(candado);
    en(mal, 2.1, 0.49, 0.85);
    c.g.add(mal);
    const k = llave('llave', '#f2c75c', true);
    k.visible = false;
    en(k, 2.1, 1.16, 0.85);
    c.g.add(k);
    let abierta = false;
    c.tocar(mal, async () => {
      if (abierta) return;
      const ok = await c.ui.ruedas({ titulo: 'Candado ★ · ♥ · ☀', ruedas: [0, 1, 2].map(() => '0123456789'.split('')), correcto: ['4', '2', '6'], estilo: 'maleta' });
      if (!ok) return;
      abierta = true;
      c.bien();
      k.visible = true;
      llaveParaLaPuerta(c, k);
      await c.escena.animar(600, (q) => (tapa.rotation.x = -q * 1.6));
    });
  },
  async prueba(p) {
    await p.tocar('maleta');
    await p.panel('426');
    await p.esperar(900);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 33 · Las letras que giran
// ---------------------------------------------------------------------------
const LETRAS = ['A', 'E', 'M', 'O', 'T', 'R', 'S', 'L'];
const META = 'TEAMO';
const paletas: Nivel = {
  titulo: 'Las letras que giran',
  pistas: [
    'Ese tablero no se queda quieto.',
    'Cada paleta se detiene si la tocas justo cuando pasa la letra que quieres. El letrerito de abajo dice qué mensaje buscar.',
    'Deja cada paleta quieta en su letra para formar, de izquierda a derecha, lo que siempre nos decimos.',
  ],
  montar(c) {
    const marco = caja(1.9, 0.62, 0.08, mat('#1e2430'), 0.03);
    en(marco, 2.05, 1.85, 0.03);
    c.g.add(marco);
    const mensaje = letrero(1.3, 0.16, (cx, w, h) => {
      cx.fillStyle = '#F7C948';
      cx.fillRect(0, 0, w, h);
      textoEn(cx, 'PRÓXIMA SALIDA: lo que siempre nos decimos ♥', w / 2, h / 2 + 2, h * 0.5, '#1e2430', 700);
    }, 'letrero mensaje');
    en(mensaje, 2.05, 1.44, 0.04);
    c.g.add(mensaje);
    const pal = [...META].map((meta, i) => {
      const cv = document.createElement('canvas');
      cv.width = 96;
      cv.height = 128;
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.42), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
      m.name = `paleta ${i}`;
      en(m, 1.35 + i * 0.35, 1.85, 0.08);
      c.g.add(m);
      const o = { m, cv, tex, meta, idx: (i * 3) % LETRAS.length, t: 0, quieta: false, error: 0, vel: 1.6 + i * 0.25 };
      return o;
    });
    const pintar = (o: (typeof pal)[number]) => {
      const cx = o.cv.getContext('2d')!;
      cx.fillStyle = o.quieta ? '#2f8f68' : o.error > 0 ? '#b93d33' : '#2a3140';
      cx.fillRect(0, 0, 96, 128);
      cx.fillStyle = '#10141c';
      cx.fillRect(0, 62, 96, 4);
      textoEn(cx, LETRAS[o.idx], 48, 68, 88, '#f6f1e6', 700);
      o.tex.needsUpdate = true;
      o.m.userData.letra = LETRAS[o.idx];
      o.m.userData.quieta = o.quieta;
    };
    pal.forEach(pintar);
    let hecho = false;
    for (const o of pal) {
      c.tocar(o.m, () => {
        if (o.quieta || hecho) return;
        if (LETRAS[o.idx] === o.meta) {
          o.quieta = true;
          sonido.nota(900, 0.06, 0, 'square', 0.05);
          pintar(o);
          if (pal.every((q) => q.quieta)) {
            hecho = true;
            abrirYa(c, 900);
          }
        } else {
          o.error = 0.35;
          c.mal();
          pintar(o);
        }
      });
    }
    c.cada((dt) => {
      for (const o of pal) {
        if (o.quieta) continue;
        o.error = Math.max(0, o.error - dt);
        o.t += dt * o.vel;
        if (o.t >= 1) {
          o.t = 0;
          o.idx = (o.idx + 1) % LETRAS.length;
          sonido.nota(1400, 0.015, 0, 'square', 0.015);
          pintar(o);
        }
      }
    });
  },
  async prueba(p) {
    for (let i = 0; i < META.length; i++) {
      const m = p.obj(`paleta ${i}`);
      for (let k = 0; k < 20 && !m.userData.quieta; k++) {
        await p.esperarQue(() => m.userData.letra === META[i] || !!m.userData.quieta, 90000);
        if (!m.userData.quieta) await p.tocar(m, 1, 30);
      }
    }
  },
};

// ---------------------------------------------------------------------------
// 34 · El torniquete
// ---------------------------------------------------------------------------
const torniquete: Nivel = {
  titulo: 'El torniquete',
  pistas: [
    'Ese torniquete es muy delicado.',
    'Al lector hay que pasarle el tiquete, pero no de cualquier manera.',
    'Desliza el dedo sobre el lector de lado a lado con un movimiento parejo: ni muy lento ni muy rápido.',
  ],
  montar(c) {
    const t = grupo('torniquete');
    t.add(en(caja(0.3, 1.0, 0.5, mat('#b8bcc4', { metal: 0.5, rough: 0.35 }), 0.05), 0, 0.5, 0));
    const brazos = grupo('brazos');
    for (let i = 0; i < 3; i++) {
      const b = caja(0.6, 0.05, 0.05, mat('#9aa4b0', { metal: 0.6, rough: 0.3 }), 0.02);
      b.geometry.translate(0.3, 0, 0);
      b.rotation.x = (i / 3) * Math.PI * 2;
      brazos.add(b);
    }
    en(brazos, -0.15, 0.85, 0);
    brazos.rotation.z = Math.PI;
    t.add(brazos);
    const lector = grupo('lector');
    lector.add(caja(0.5, 0.12, 0.2, mat('#26313a'), 0.03));
    const ranura = caja(0.46, 0.02, 0.04, mat('#10141c'), 0.005);
    en(ranura, 0, 0.065, 0);
    lector.add(ranura);
    const pantalla = letrero(0.22, 0.08, () => {}, 'pantallita lector');
    const escribir = (txt: string, col: string) => {
      const tex = (pantalla.material as THREE.MeshStandardMaterial).map as THREE.CanvasTexture;
      const cx = (tex.image as HTMLCanvasElement).getContext('2d')!;
      cx.fillStyle = '#10141c';
      cx.fillRect(0, 0, cx.canvas.width, cx.canvas.height);
      textoEn(cx, txt, cx.canvas.width / 2, cx.canvas.height / 2, cx.canvas.height * 0.45, col, 700);
      tex.needsUpdate = true;
    };
    pantalla.rotation.x = -0.5;
    en(pantalla, 0, 0.1, 0.12);
    lector.add(pantalla);
    en(lector, 0, 1.06, 0.05);
    t.add(lector);
    en(t, 1.35, 0, 0.9);
    c.g.add(t);
    escribir('PASE SU TIQUETE', '#F7C948');
    let hecho = false;
    c.tocar(lector, () => escribir('DESLICE →', '#F7C948'));
    c.gesto.deslizar((dir, vel, obj) => {
      if (hecho || obj !== lector) return;
      if (dir !== 'der') return escribir('→ A LA DERECHA', '#e4574b');
      if (vel < 0.6) {
        c.mal();
        return escribir('MUY LENTO', '#e4574b');
      }
      if (vel > 2.8) {
        c.mal();
        return escribir('MUY RÁPIDO', '#e4574b');
      }
      hecho = true;
      escribir('¡BUEN VIAJE!', '#7ff0b0');
      sonido.nota(1318, 0.12, 0, 'sine', 0.08);
      void c.escena.animar(800, (q) => (brazos.rotation.x = q * (Math.PI * 2) / 3));
      abrirYa(c, 900);
    });
  },
  async prueba(p) {
    await p.deslizar('der', 'lector', 220);
  },
};

// ---------------------------------------------------------------------------
// 35 · La ruta sin repetir
// ---------------------------------------------------------------------------
const PUEBLOS: [number, number][] = [[0.15, 0.8], [0.5, 0.9], [0.85, 0.75], [0.3, 0.3], [0.75, 0.25]];
const CARRETERAS: [number, number][] = [[0, 1], [1, 2], [0, 3], [1, 3], [1, 4], [2, 4], [3, 4]];
const ruta: Nivel = {
  titulo: 'La ruta sin repetir',
  pistas: [
    'Ese mapa es un rompecabezas.',
    'Hay que pasar por todas las carreteras, cada una una sola vez, sin saltar.',
    'Empieza en un pueblo del que salgan tres carreteras (hay dos así) y termina en el otro.',
  ],
  montar(c) {
    const W = 1.5, H = 1.1, x0 = 2.05, y0 = 1.55;
    const cv = document.createElement('canvas');
    cv.width = 600;
    cv.height = 440;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const tabla = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
    en(tabla, x0, y0, 0.03);
    c.g.add(tabla);
    const P = (i: number) => [PUEBLOS[i][0] * 600, (1 - PUEBLOS[i][1]) * 440];
    const usadas = new Set<number>();
    const pintar = () => {
      const cx = cv.getContext('2d')!;
      cx.fillStyle = '#e8f0d8';
      cx.fillRect(0, 0, 600, 440);
      cx.strokeStyle = '#8a5e40';
      cx.lineWidth = 20;
      cx.strokeRect(0, 0, 600, 440);
      CARRETERAS.forEach(([a, b], i) => {
        cx.strokeStyle = usadas.has(i) ? '#e4574b' : '#b8a48a';
        cx.lineWidth = usadas.has(i) ? 12 : 8;
        cx.setLineDash(usadas.has(i) ? [] : [16, 12]);
        cx.beginPath();
        cx.moveTo(P(a)[0], P(a)[1]);
        cx.lineTo(P(b)[0], P(b)[1]);
        cx.stroke();
      });
      cx.setLineDash([]);
      textoEn(cx, 'todas las carreteras · ninguna dos veces', 300, 412, 22, '#8a5e40', 700);
      tex.needsUpdate = true;
    };
    pintar();
    let actual = -1;
    const botones = PUEBLOS.map(([u, v], i) => {
      const b = cilindro(0.075, 0.075, 0.04, matNuevo('#26375E', { emisivo: '#F7C948', intensidad: 0 }), `pueblo ${i}`, 20);
      b.rotation.x = Math.PI / 2;
      en(b, x0 - W / 2 + u * W, y0 - H / 2 + v * H, 0.05);
      c.g.add(b);
      return b;
    });
    const reiniciar = () => {
      usadas.clear();
      actual = -1;
      botones.forEach((b) => ((b.material as THREE.MeshStandardMaterial).emissiveIntensity = 0));
      pintar();
    };
    botones.forEach((b, i) => {
      c.tocar(b, () => {
        if (usadas.size === CARRETERAS.length) return;
        if (actual < 0) {
          actual = i;
          (b.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8;
          sonido.toque();
          return;
        }
        const e = CARRETERAS.findIndex(([a, q], k) => !usadas.has(k) && ((a === actual && q === i) || (q === actual && a === i)));
        if (e < 0) {
          c.mal();
          reiniciar();
          return;
        }
        usadas.add(e);
        (botones[actual].material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
        actual = i;
        (b.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8;
        sonido.nota(500 + usadas.size * 70, 0.08, 0, 'triangle', 0.06);
        pintar();
        if (usadas.size === CARRETERAS.length) abrirYa(c, 900);
      });
    });
  },
  async prueba(p) {
    for (const i of [3, 0, 1, 2, 4, 1, 3, 4]) await p.tocar(`pueblo ${i}`);
  },
};

// ---------------------------------------------------------------------------
// 36 · Los relojes de las ciudades
// ---------------------------------------------------------------------------
const relojes: Nivel = {
  titulo: 'Los relojes de las ciudades',
  pistas: [
    'Uno de esos relojes anda perdido.',
    'Los tres primeros siguen una regla. ¿Cuánto avanza cada uno respecto al anterior?',
    'Averigua cuánto se adelanta cada reloj respecto al anterior y súmaselo una vez más al último.',
  ],
  montar(c) {
    const horas: [number, number][] = [[1, 10], [2, 20], [3, 30]];
    const nombres = ['Cali', 'Bogotá', 'Medellín', 'Bucaramanga'];
    horas.forEach((h, i) => relojPared(c, 1.15 + i * 0.72, 1.95, 0.27, `reloj ${i}`, { hora: h }));
    const ultimo = relojPared(c, 1.15 + 3 * 0.72, 1.95, 0.27, 'reloj 3', {
      hora: [12, 0],
      mover: true,
      alSoltar: () => {
        if (!hecho && ultimo.marca(4, 40)) {
          hecho = true;
          abrirYa(c, 800);
        }
      },
    });
    let hecho = false;
    nombres.forEach((n, i) => {
      const l = letrero(0.6, 0.12, (cx, w, h) => textoEn(cx, n, w / 2, h / 2, h * 0.7, '#26375E', 700), undefined, { transparente: true });
      en(l, 1.15 + i * 0.72, 1.58, 0.03);
      c.g.add(l);
    });
    const b = banca(1.8);
    en(b, 2.0, 0, 0.75);
    c.g.add(b);
  },
  async prueba(p) {
    const cx0 = 1.15 + 3 * 0.72, cy0 = 1.95, R = 0.27;
    const punta = (o: string, r: number) => {
      const a = -p.obj(o).rotation.z;
      return new THREE.Vector3(cx0 + Math.sin(a) * r, cy0 + Math.cos(a) * r, 0.09);
    };
    const aMin = (40 / 60) * Math.PI * 2, aHora = ((4 + 40 / 60) / 12) * Math.PI * 2;
    await p.arrastrarDesde(punta('reloj 3 minutero', R * 0.75), new THREE.Vector3(cx0 + Math.sin(aMin) * R * 0.75, cy0 + Math.cos(aMin) * R * 0.75, 0.09));
    await p.arrastrarDesde(punta('reloj 3 horario', R * 0.35), new THREE.Vector3(cx0 + Math.sin(aHora) * R * 0.35, cy0 + Math.cos(aHora) * R * 0.35, 0.09));
  },
};

// ---------------------------------------------------------------------------
// 37 · Quietos, que tiembla
// ---------------------------------------------------------------------------
const quieto: Nivel = {
  titulo: 'Quietos, que tiembla',
  pistas: [
    'Todo aquí tiembla demasiado.',
    'Las bolitas buscan sus huecos, pero con tanto movimiento no pueden.',
    'Sostén el celular muy quieto, sin tocar la pantalla, unos segundos.',
  ],
  montar(c) {
    const b = banca(1.8);
    en(b, 1.5, 0, 0.8);
    c.g.add(b);
    const juego = grupo('juego bolitas');
    juego.add(en(caja(0.7, 0.08, 0.5, mat('#F7C948'), 0.03), 0, 0.04, 0));
    const bordes = mat('#c9952c');
    juego.add(en(caja(0.7, 0.1, 0.03, bordes, 0.01), 0, 0.09, 0.24), en(caja(0.7, 0.1, 0.03, bordes, 0.01), 0, 0.09, -0.24));
    juego.add(en(caja(0.03, 0.1, 0.5, bordes, 0.01), 0.34, 0.09, 0), en(caja(0.03, 0.1, 0.5, bordes, 0.01), -0.34, 0.09, 0));
    const huecos: THREE.Vector3[] = [new THREE.Vector3(-0.2, 0.085, -0.1), new THREE.Vector3(0.0, 0.085, 0.12), new THREE.Vector3(0.2, 0.085, -0.08)];
    for (const h of huecos) juego.add(en(cilindro(0.045, 0.045, 0.01, mat('#3d2b27'), undefined, 16), h.x, h.y, h.z));
    const bolas = ['#e4574b', '#3c7a62', '#8EC5F0'].map((col, i) => {
      const s = esfera(0.035, mat(col, { rough: 0.3 }), undefined, 14);
      en(s, -0.25 + i * 0.25, 0.12, 0.15 - i * 0.1);
      juego.add(s);
      return s;
    });
    en(juego, 1.5, 0.49, 0.85);
    c.g.add(juego);
    const k = llave('llave', '#f2c75c', true);
    k.visible = false;
    k.scale.setScalar(0.8);
    en(k, 1.5, 0.62, 0.85);
    c.g.add(k);
    let listo = 0, hecho = false, tocando = false;
    c.gesto.dedos((n) => (tocando = n > 0));
    let bus = 1.5;
    c.cada((dt, t) => {
      if (hecho) return;
      // Cada tanto pasa un bus por detrás y retumba
      bus -= dt;
      if (bus <= 0) {
        bus = 6 + Math.random() * 3;
        sfx.motor(0.4, 1.6);
        sfx.pito(0.5);
      }
      const moviendo = c.sensores.quieto < 900 || tocando;
      if (moviendo) listo = Math.max(0, listo - dt * 2);
      else listo += dt;
      const temblor = moviendo ? 0.02 : 0.004 * (1 - Math.min(1, listo / 2.5));
      bolas.forEach((s, i) => {
        const meta = huecos[i];
        const k2 = Math.min(1, listo / 2.5);
        s.position.x += (meta.x + Math.sin(t * 13 + i) * temblor * 3 - s.position.x) * 0.1 * (k2 + 0.1);
        s.position.z += (meta.z + Math.cos(t * 11 + i * 2) * temblor * 3 - s.position.z) * 0.1 * (k2 + 0.1);
        s.position.y = 0.12 - k2 * 0.03;
      });
      if (listo > 3) {
        hecho = true;
        c.bien();
        k.visible = true;
        void c.escena.animar(500, (q) => (k.position.y = 0.62 + q * 0.12));
        llaveParaLaPuerta(c, k);
        juego.userData.listo = true;
      }
    });
  },
  async prueba(p) {
    await p.esperarQue(() => !!p.obj('juego bolitas').userData.listo, 120000);
    await p.esperar(800);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 38 · La máquina de dulces
// ---------------------------------------------------------------------------
const maquina: Nivel = {
  titulo: 'La máquina de dulces',
  pistas: [
    'Un dulcecito para el viaje no cae mal.',
    'La máquina no fía: primero hace falta una moneda. Y en algún lado quedó anotado cuál es mi favorito.',
    'Con la moneda en la ranura, marca el código del papelito; si el dulce se traba, hay que mover la máquina.',
  ],
  montar(c) {
    const b = banca(1.4);
    en(b, -1.35, 0, 0.75);
    // La envoltura del dulce favorito, tirada por ahí
    const papel = letrero(0.2, 0.13, (cx, w, h) => {
      cx.fillStyle = '#f59fc0';
      cx.fillRect(0, 0, w, h);
      textoEn(cx, 'mi favorito', w / 2, h * 0.32, h * 0.2, '#3d2b27', 700);
      textoEn(cx, 'B4 ♥', w / 2, h * 0.68, h * 0.3, '#3d2b27', 700);
    }, 'envoltura');
    papel.rotation.x = -Math.PI / 2;
    papel.rotation.z = -0.5;
    en(papel, 1.45, 0.006, 1.2);
    c.g.add(papel);
    c.tocar(papel, () => void c.ui.nota('<p style="font-size:22px;text-align:center">La envoltura de mi dulce favorito:<br><b>B4</b> ♥</p>'));
    c.g.add(b);
    const moneda = grupo('moneda');
    const disco = cilindro(0.05, 0.05, 0.012, mat('#f2c75c', { metal: 0.8, rough: 0.3 }), undefined, 20);
    moneda.add(disco);
    moneda.add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ visible: false })));
    en(moneda, -1.15, 0.008, 0.95);
    c.g.add(moneda);
    c.tocar(moneda, () => c.dar('moneda', moneda));
    const maq = grupo('maquina');
    maq.add(en(caja(1.0, 1.9, 0.7, mat('#e4574b'), 0.06), 0, 0.95, 0));
    const vitrina = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.2), new THREE.MeshStandardMaterial({ color: '#dff2fb', transparent: true, opacity: 0.35, roughness: 0.1 }));
    en(vitrina, -0.12, 1.2, 0.356);
    maq.add(vitrina);
    const cols = ['#F7C948', '#8FD6B9', '#F59FC0', '#8EC5F0'];
    let objetivo: THREE.Object3D | null = null;
    'ABCD'.split('').forEach((fila, f) => {
      for (let k = 0; k < 4; k++) {
        const d = caja(0.11, 0.16, 0.1, mat(cols[(f + k) % 4]), 0.02);
        en(d, -0.38 + k * 0.17, 1.66 - f * 0.29, 0.2);
        maq.add(d);
        if (fila === 'B' && k === 3) objetivo = d;
      }
      const et = letrero(0.06, 0.06, (cx, w, h) => textoEn(cx, fila, w / 2, h / 2, h * 0.8, '#fff8ee', 700), undefined, { transparente: true });
      en(et, -0.47, 1.66 - f * 0.29, 0.357);
      maq.add(et);
    });
    for (let k = 0; k < 4; k++) {
      const et = letrero(0.06, 0.06, (cx, w, h) => textoEn(cx, String(k + 1), w / 2, h / 2, h * 0.8, '#fff8ee', 700), undefined, { transparente: true });
      en(et, -0.38 + k * 0.17, 1.86, 0.357);
      maq.add(et);
    }
    const panel = grupo('panel maquina');
    panel.add(caja(0.2, 0.5, 0.04, mat('#26313a'), 0.02));
    const ranura = caja(0.08, 0.015, 0.02, mat('#10141c'), 0.004, 'ranura');
    en(ranura, 0, 0.18, 0.025);
    panel.add(ranura);
    for (let i = 0; i < 6; i++) panel.add(en(caja(0.04, 0.04, 0.02, mat('#efe2d0'), 0.008), -0.05 + (i % 2) * 0.1, 0.05 - Math.floor(i / 2) * 0.07, 0.025));
    en(panel, 0.34, 1.2, 0.36);
    maq.add(panel);
    const bandeja = caja(0.6, 0.18, 0.08, mat('#10141c'), 0.02, 'bandeja');
    en(bandeja, -0.12, 0.3, 0.33);
    maq.add(bandeja);
    en(maq, 2.3, 0, 0.45);
    c.g.add(maq);
    let pagada = false, elegido = false, cayo = false;
    c.usar(panel, 'moneda', () => {
      pagada = true;
      sonido.caja();
      c.aviso('Moneda adentro. ¿Qué dulce?', 2000);
    });
    const trabar = () => {
      const o = objetivo!;
      const z0 = o.position.z;
      void c.escena.animar(900, (q) => {
        o.position.z = z0 + q * 0.12;
        o.rotation.x = q * 0.5;
      });
      c.aviso('¡Se trabó!', 1800);
    };
    const caer = () => {
      if (cayo || !elegido) return;
      cayo = true;
      c.bien();
      const o = objetivo!;
      const y0 = o.position.y;
      void c.escena.animar(600, (q) => {
        o.position.y = y0 - (y0 - 0.3) * q * q;
        o.rotation.x = 0.5 + q * 2;
      }, (q) => q).then(() => {
        sonido.nota(260, 0.1, 0, 'square', 0.05);
        const k = llave('llave', '#f2c75c', false);
        k.scale.setScalar(0.8);
        en(k, 2.2, 0.42, 0.9);
        c.g.add(k);
        llaveParaLaPuerta(c, k);
        maq.userData.cayo = true;
      });
    };
    c.tocar(panel, async () => {
      if (elegido) return;
      if (!pagada) {
        c.aviso('Primero, una moneda', 1800);
        return;
      }
      await c.enfocar(panel, 0.9);
      const ok = await c.ui.teclado({ titulo: 'Elige tu dulce', largo: 2, correcto: 'B4', teclas: ['A', 'B', 'C', 'D', '1', '2', '3', '4', '⌫'] });
      await c.volver();
      if (ok) {
        elegido = true;
        maq.userData.elegido = true;
        trabar();
      }
    });
    c.sensor.sacudida(caer);
    let golpes = 0;
    c.tocar(maq, () => {
      void c.escena.animar(200, (q) => (maq.rotation.z = Math.sin(q * Math.PI) * 0.015));
      if (elegido && ++golpes >= 5) caer();
    });
  },
  async prueba(p) {
    await p.tocar('moneda');
    await p.usar('moneda', 'panel maquina');
    await p.tocar('panel maquina');
    await p.panel('B4');
    await p.esperarQue(() => !!p.obj('maquina').userData.elegido, 30000);
    await p.esperar(300);
    p.sensor.sacudir();
    await p.esperarQue(() => !!p.obj('maquina').userData.cayo, 30000);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 39 · La banda de las maletas
// ---------------------------------------------------------------------------
const MALETAS: [string, string][] = [['#e4574b', '★'], ['#8EC5F0', '♥'], ['#e4574b', '♥'], ['#8FD6B9', '♥'], ['#F7C948', '☀'], ['#e4574b', '']];
const banda: Nivel = {
  titulo: 'La banda de las maletas',
  pistas: [
    'Todas las maletas se parecen, pero solo una es nuestra.',
    'En la pared hay una nota que dice cómo es la nuestra.',
    'Toca nuestra maleta cuando pase por delante en la banda; las otras no sirven.',
  ],
  montar(c) {
    const cx0 = 2.1, cz0 = 1.0, rx = 1.2, rz = 0.35;
    const cinta = new THREE.Mesh(new THREE.TorusGeometry(1, 0.1, 8, 48), mat('#3d4450', { rough: 0.6 }));
    cinta.rotation.x = Math.PI / 2;
    cinta.scale.set(rx, rz, 1);
    en(cinta, cx0, 0.35, cz0);
    const base = cilindro(1, 1, 0.3, mat('#b8bcc4', { metal: 0.4, rough: 0.4 }), undefined, 40);
    base.scale.set(rx - 0.15, 1, rz - 0.1);
    en(base, cx0, 0.2, cz0);
    c.g.add(cinta, base);
    const bolsas = MALETAS.map(([col, sim], i) => {
      const g = grupo(`maleta ${i}`);
      g.add(caja(0.32, 0.22, 0.14, mat(col), 0.04));
      if (sim) {
        const s = letrero(0.14, 0.14, (cx, w, h) => textoEn(cx, sim, w / 2, h / 2 + 3, h * 0.9, '#fff8ee', 700), undefined, { transparente: true });
        en(s, 0, 0, 0.072);
        g.add(s);
      }
      g.add(en(toro(0.05, 0.012, mat('#3d2b27'), undefined, Math.PI), 0, 0.11, 0));
      g.userData.buena = col === '#e4574b' && sim === '♥';
      c.g.add(g);
      return g;
    });
    let fase = 0, hecho = false;
    c.cada((dt) => {
      if (!hecho) fase += dt * 0.22;
      bolsas.forEach((b, i) => {
        const a = fase * Math.PI * 2 + (i / bolsas.length) * Math.PI * 2;
        b.position.set(cx0 + Math.cos(a) * rx, 0.52, cz0 + Math.sin(a) * rz);
        b.rotation.y = 0;
        b.userData.delante = Math.sin(a) > 0.2;
      });
    });
    for (const b of bolsas) {
      c.tocar(b, () => {
        if (hecho) return;
        if (!b.userData.buena) {
          c.mal();
          c.aviso('Esa no es la nuestra', 1500);
          return;
        }
        hecho = true;
        c.bien();
        const k = llave('llave', '#f2c75c', false);
        k.scale.setScalar(0.8);
        en(k, 0, 0.2, 0.05);
        b.add(k);
        llaveParaLaPuerta(c, k);
      });
    }
    const nota = letrero(0.5, 0.3, (cx, w, h) => {
      cx.fillStyle = '#fff8ee';
      cx.fillRect(0, 0, w, h);
      textoEn(cx, 'Nuestra maleta:', w / 2, h * 0.3, h * 0.18, '#3d2b27', 600);
      cx.fillStyle = '#e4574b';
      cx.fillRect(w * 0.35, h * 0.48, w * 0.3, h * 0.36);
      textoEn(cx, '♥', w / 2, h * 0.68, h * 0.26, '#fff8ee', 700);
    }, 'nota maleta');
    en(nota, -1.6, 1.4, 0.03);
    c.g.add(nota);
  },
  async prueba(p) {
    const b = [0, 1, 2, 3, 4, 5].map((i) => p.obj(`maleta ${i}`)).find((o) => o.userData.buena)!;
    await p.esperarQue(() => !!b.userData.delante, 60000);
    await p.tocar(b);
    await p.esperar(500);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 40 · El túnel
// ---------------------------------------------------------------------------
const tunel: Nivel = {
  titulo: 'El túnel',
  pistas: [
    'Este túnel no se acaba nunca.',
    'El letrero del túnel pide algo raro… hazle caso de verdad.',
    'Apaga la pantalla del celular un momento y vuelve a prenderla. (Si no puedes, deja el dedo quieto sobre la pantalla unos segundos.)',
  ],
  montar(c) {
    const letreroT = letrero(1.3, 0.35, (cx, w, h) => {
      cx.fillStyle = '#F7C948';
      cx.fillRect(0, 0, w, h);
      textoEn(cx, 'TÚNEL · CIERRE LOS OJOS', w / 2, h / 2 + 2, h * 0.42, '#1e2430', 700);
    }, 'letrero tunel');
    en(letreroT, 2.2, 2.35, 0.03);
    c.g.add(letreroT);
    const luces: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const l = esfera(0.05, new THREE.MeshBasicMaterial({ color: '#ffb000' }));
      en(l, -3.2 + i * 1.28, 2.95, 0.05);
      c.g.add(l);
      luces.push(l);
    }
    let luz = 1, meta = 0.08, hecho = false;
    c.cada((dt, t) => {
      luz += (meta - luz) * Math.min(1, dt * 2.5);
      c.escena.atenuar(luz);
      luces.forEach((l, i) => l.scale.setScalar(0.6 + 0.4 * Math.max(0, Math.sin(t * 3 - i))));
    });
    const llegar = () => {
      if (hecho) return;
      hecho = true;
      meta = 1;
      sonido.regalo();
      c.aviso('¡Ya llegamos!', 2000);
      abrirYa(c, 1400);
    };
    c.sensor.pantalla((ms) => ms > 300 && llegar());
    // Alternativa: el dedo quieto sobre la pantalla cinco segundos
    const cortina = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshBasicMaterial({ visible: false }));
    cortina.name = 'oscuridad';
    en(cortina, 0, 1.5, 1.2);
    c.g.add(cortina);
    c.mantener(cortina, () => {}, (ms) => ms > 5000 && llegar());
  },
  async prueba(p) {
    await p.esperar(500);
    p.sensor.pantalla(1500);
  },
};

export const CAP4: Nivel[] = [tablero, maleta, paletas, torniquete, ruta, relojes, quieto, maquina, banda, tunel];
