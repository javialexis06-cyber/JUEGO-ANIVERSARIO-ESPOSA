// Capítulo 3 · La cafetería (puertas 21–30): secuencias, dibujar, balancear, memoria de sonidos, sumar,
// soplar el vidrio, anagrama, seguir la taza, girar con dos dedos y voltear el celular.
import * as THREE from 'three';
import * as sonido from '../../sonido';
import * as sfx from '../sonidos';
import { caja, cilindro, en, esfera, grupo, letrero, lienzo, mat, matNuevo, textoEn, toro } from '../kit';
import type { Ctx, Nivel } from '../nivel';
import { candadoPuerta, corazonPuntos, esCorazon, limites, llave, mesaRedonda, mostrador, planoPiso, taza } from './piezas';

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
// 21 · El pedido de siempre
// ---------------------------------------------------------------------------
const PEDIDO = ['taza', 'cafetera', 'leche', 'canela'];
const pedido: Nivel = {
  titulo: 'El pedido de siempre',
  pistas: [
    'El café no se prepara en cualquier orden.',
    'En el mostrador hay una pizarrita con el pedido de siempre.',
    'Toca las cosas en el orden de los dibujos de la pizarrita. Lo que no está dibujado, no va.',
  ],
  montar(c) {
    const m = mostrador(2.6);
    en(m, 2.15, 0, 0.5);
    c.g.add(m);
    const y = 1.0;
    const cosas: Record<string, THREE.Object3D> = {};
    const t = taza('#fff8ee', 'taza');
    en(t, 1.1, y, 0.55);
    cosas.taza = t;
    const cafetera = grupo('cafetera');
    cafetera.add(en(caja(0.36, 0.42, 0.3, mat('#b8bcc4', { metal: 0.6, rough: 0.35 }), 0.04), 0, 0.21, 0));
    cafetera.add(en(cilindro(0.03, 0.03, 0.1, mat('#3d2b27')), 0, 0.14, 0.17));
    cafetera.add(en(esfera(0.03, matNuevo('#e4574b', { emisivo: '#e4574b', intensidad: 0.8 })), 0.1, 0.34, 0.16));
    en(cafetera, 1.6, y, 0.45);
    cosas.cafetera = cafetera;
    const leche = grupo('leche');
    leche.add(en(cilindro(0.08, 0.1, 0.22, mat('#dfe3ea', { metal: 0.5, rough: 0.35 })), 0, 0.11, 0), en(cilindro(0.075, 0.075, 0.01, mat('#ffffff')), 0, 0.215, 0));
    en(leche, 2.1, y, 0.5);
    cosas.leche = leche;
    const azucar = grupo('azucar');
    azucar.add(en(cilindro(0.1, 0.08, 0.1, mat('#F59FC0')), 0, 0.05, 0));
    for (let i = 0; i < 4; i++) azucar.add(en(caja(0.04, 0.04, 0.04, mat('#ffffff'), 0.006), -0.04 + (i % 2) * 0.06, 0.12, -0.02 + Math.floor(i / 2) * 0.04));
    en(azucar, 2.5, y, 0.5);
    cosas.azucar = azucar;
    const canela = grupo('canela');
    canela.add(en(cilindro(0.045, 0.05, 0.18, mat('#b8653a')), 0, 0.09, 0), en(cilindro(0.05, 0.045, 0.04, mat('#d9b25a', { metal: 0.6, rough: 0.3 })), 0, 0.2, 0));
    en(canela, 2.9, y, 0.5);
    cosas.canela = canela;
    for (const o of Object.values(cosas)) c.g.add(o);
    // La pizarrita con el pedido dibujado
    const piz = letrero(1.0, 0.36, (cx, w, h) => {
      cx.fillStyle = '#2f3b33';
      cx.fillRect(0, 0, w, h);
      cx.strokeStyle = '#a5713f';
      cx.lineWidth = 14;
      cx.strokeRect(0, 0, w, h);
      const paso = w / 4;
      const dib: ((x: number, y: number) => void)[] = [
        (x, yy) => {
          cx.fillStyle = '#f6f1e6';
          cx.fillRect(x - 22, yy - 14, 44, 34);
          cx.strokeStyle = '#f6f1e6';
          cx.lineWidth = 6;
          cx.beginPath();
          cx.arc(x + 26, yy + 2, 10, -1.4, 1.4);
          cx.stroke();
        },
        (x, yy) => {
          cx.fillStyle = '#b8864f';
          cx.beginPath();
          cx.ellipse(x, yy, 20, 28, 0.5, 0, Math.PI * 2);
          cx.fill();
          cx.strokeStyle = '#2f3b33';
          cx.lineWidth = 4;
          cx.beginPath();
          cx.moveTo(x - 10, yy - 20);
          cx.quadraticCurveTo(x + 6, yy, x - 4, yy + 22);
          cx.stroke();
        },
        (x, yy) => {
          cx.fillStyle = '#ffffff';
          cx.beginPath();
          cx.moveTo(x, yy - 30);
          cx.quadraticCurveTo(x + 24, yy + 4, x, yy + 26);
          cx.quadraticCurveTo(x - 24, yy + 4, x, yy - 30);
          cx.fill();
        },
        (x, yy) => textoEn(cx, '♥', x, yy + 4, 64, '#d9824f', 700),
      ];
      dib.forEach((f, i) => {
        f(paso * (i + 0.5), h / 2);
        if (i < 3) textoEn(cx, '›', paso * (i + 1), h / 2, 50, '#f6f1e6', 700);
      });
    }, 'pizarrita');
    en(piz, 2.15, 1.75, 0.03);
    c.g.add(piz);
    // El pedido se va llenando
    const cafe = cilindro(0.115, 0.115, 0.01, mat('#6b4a33'), undefined, 24);
    en(cafe, 0, 0.16, 0);
    const espuma = cilindro(0.118, 0.118, 0.01, mat('#f3e3cc'), undefined, 24);
    en(espuma, 0, 0.175, 0);
    const cor = letrero(0.12, 0.12, (cx, w, h) => textoEn(cx, '♥', w / 2, h / 2 + 3, h, '#b8653a', 700), undefined, { transparente: true });
    cor.rotation.x = -Math.PI / 2;
    en(cor, 0, 0.182, 0);
    for (const o of [cafe, espuma, cor]) {
      o.visible = false;
      t.add(o);
    }
    let paso = 0;
    for (const [nombre, o] of Object.entries(cosas)) {
      c.tocar(o, () => {
        if (paso >= PEDIDO.length) return;
        void c.escena.animar(260, (k) => (o.position.y = y + Math.sin(k * Math.PI) * 0.08));
        if (nombre === PEDIDO[paso]) {
          paso++;
          sonido.nota(500 + paso * 110, 0.08, 0, 'triangle', 0.06);
          if (nombre === 'cafetera') cafe.visible = true;
          if (nombre === 'leche') espuma.visible = true;
          if (nombre === 'canela') cor.visible = true;
          if (paso === PEDIDO.length) {
            sonido.campana();
            abrirYa(c, 900);
          }
        } else {
          c.mal();
          paso = 0;
          cafe.visible = espuma.visible = cor.visible = false;
        }
      });
    }
  },
  async prueba(p) {
    for (const n of PEDIDO) await p.tocar(n);
  },
};

// ---------------------------------------------------------------------------
// 22 · Arte latte
// ---------------------------------------------------------------------------
const latte: Nivel = {
  titulo: 'Arte latte',
  pistas: [
    'Ese café está muy simple.',
    'Acércate a la taza grande: la espuma se deja dibujar con el dedo.',
    'Dibuja sobre la espuma, de un solo trazo, la figura que más nos representa.',
  ],
  montar(c) {
    const mesa = mesaRedonda(0.5);
    en(mesa, 1.2, 0, 0.95);
    c.g.add(mesa);
    const t = taza('#fff8ee', 'taza grande', '#f3e3cc');
    t.scale.setScalar(1.6);
    en(t, 1.2, 0.75, 0.95);
    c.g.add(t);
    // La espuma donde se dibuja
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const cx = cv.getContext('2d')!;
    const limpiar = () => {
      cx.fillStyle = '#f3e3cc';
      cx.fillRect(0, 0, 256, 256);
      cx.strokeStyle = '#8a5e40';
      cx.lineWidth = 10;
      cx.beginPath();
      cx.arc(128, 128, 122, 0, Math.PI * 2);
      cx.stroke();
      tex.needsUpdate = true;
    };
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const espumaY = 0.75 + 0.19 * 1.6;
    const R = 0.12 * 1.6;
    const lienzoEsp = new THREE.Mesh(new THREE.CircleGeometry(R, 40), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
    lienzoEsp.rotation.x = -Math.PI / 2;
    en(lienzoEsp, 1.2, espumaY + 0.002, 0.95);
    c.g.add(lienzoEsp);
    limpiar();
    let cerca = false, hecho = false;
    c.tocar(t, async () => {
      if (cerca || hecho) return;
      await c.enfocar(new THREE.Vector3(1.2, espumaY, 0.95), 0.75);
      cerca = true;
      t.userData.cerca = true;
      c.aviso('Dibuja sobre la espuma', 2200);
    });
    const plano = planoPiso(espumaY);
    let ultimo: THREE.Vector3 | null = null;
    c.gesto.mover((x, y, abajo) => {
      if (!cerca || hecho || !abajo) return (ultimo = null);
      const p = c.enPlano(x, y, plano);
      if (!p) return;
      if (ultimo) {
        const a = (q: THREE.Vector3) => [((q.x - 1.2) / (2 * R) + 0.5) * 256, ((q.z - 0.95) / (2 * R) + 0.5) * 256];
        const [x0, y0] = a(ultimo), [x1, y1] = a(p);
        cx.strokeStyle = '#8a5e40';
        cx.lineWidth = 12;
        cx.lineCap = 'round';
        cx.beginPath();
        cx.moveTo(x0, y0);
        cx.lineTo(x1, y1);
        cx.stroke();
        tex.needsUpdate = true;
      }
      ultimo = p;
    });
    c.gesto.trazo((pts) => {
      ultimo = null;
      if (!cerca || hecho || pts.length < 10) return;
      if (esCorazon(pts)) {
        hecho = true;
        sonido.corazon();
        c.aviso('¡Qué corazón tan lindo!', 2000);
        abrirYa(c, 1300);
      } else {
        c.mal();
        c.aviso('Mmm… no parece un corazón. Otra vez.', 2000);
        c.despues(700, limpiar);
      }
    });
  },
  async prueba(p) {
    await p.tocar('taza grande');
    await p.esperarQue(() => !!p.obj('taza grande').userData.cerca, 30000);
    await p.esperar(300);
    const asp = innerWidth / innerHeight;
    const pts = corazonPuntos(40).map(({ x, y }) => [0.5 + (x / 34) * (0.45 / asp), 0.5 + (y / 34) * 0.45] as [number, number]);
    pts.push(pts[0]);
    await p.trazar(pts, 900);
  },
};

// ---------------------------------------------------------------------------
// 23 · La balanza de la torta
// ---------------------------------------------------------------------------
const PESOS = [1, 2, 3, 5];
const balanza: Nivel = {
  titulo: 'La balanza de la torta',
  pistas: [
    'Esa balanza está muy triste de un lado.',
    'La torta tiene su peso escrito; cada cajita pesa lo que tiene de terrones.',
    'Pon en el otro platillo cajitas que sumen exactamente lo mismo que la torta.',
  ],
  montar(c) {
    const mesa = grupo('mesa balanza');
    mesa.add(en(caja(2.2, 0.06, 0.8, mat('#c49468'), 0.02), 0, 0.72, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesa.add(en(caja(0.06, 0.7, 0.06, mat('#c49468'), 0.015), sx * 1.02, 0.35, sz * 0.32));
    en(mesa, 2.1, 0, 0.8);
    c.g.add(mesa);
    const bx = 1.6, by = 0.75, bz = 0.8;
    const base = grupo('balanza');
    base.add(en(cilindro(0.14, 0.18, 0.05, mat('#d9b25a', { metal: 0.6, rough: 0.35 })), 0, 0.025, 0), en(cilindro(0.025, 0.025, 0.6, mat('#d9b25a', { metal: 0.6, rough: 0.35 })), 0, 0.33, 0));
    const cajon = caja(0.26, 0.08, 0.2, mat('#a5713f'), 0.02, 'cajon');
    en(cajon, 0, 0.1, 0.0);
    base.add(cajon);
    const viga = grupo('viga');
    en(viga, 0, 0.62, 0);
    viga.add(caja(0.9, 0.03, 0.03, mat('#d9b25a', { metal: 0.6, rough: 0.35 }), 0.01));
    base.add(viga);
    en(base, bx, by, bz);
    c.g.add(base);
    const platillos = [-1, 1].map((lado) => {
      const pl = grupo(lado < 0 ? 'platillo izq' : 'platillo der');
      pl.add(en(cilindro(0.2, 0.16, 0.03, mat('#d9b25a', { metal: 0.6, rough: 0.35 }), undefined, 24), 0, 0, 0));
      for (const a of [0, 2.1, 4.2]) pl.add(en(cilindro(0.004, 0.004, 0.35, mat('#8a6a33')), Math.cos(a) * 0.14, 0.17, Math.sin(a) * 0.14));
      c.g.add(pl);
      return pl;
    });
    // Torta con su etiqueta de peso
    const torta = grupo('torta');
    torta.add(en(cilindro(0.13, 0.13, 0.12, mat('#f7d6c0'), undefined, 24), 0, 0.075, 0), en(cilindro(0.135, 0.135, 0.03, mat('#F59FC0'), undefined, 24), 0, 0.14, 0));
    torta.add(en(esfera(0.03, mat('#e4574b')), 0, 0.17, 0));
    const etiqueta = letrero(0.12, 0.08, (cx, w, h) => {
      cx.fillStyle = '#fff8ee';
      cx.fillRect(0, 0, w, h);
      textoEn(cx, '7', w / 2, h / 2 + 2, h * 0.8, '#3d2b27', 700);
    });
    en(etiqueta, 0, 0.08, 0.135);
    torta.add(etiqueta);
    en(torta, 0, 0.015, 0);
    platillos[0].add(torta);
    const enPlatillo: THREE.Object3D[] = [];
    const cajas = PESOS.map((w, i) => {
      const cj = grupo(`cajita ${w}`);
      cj.add(caja(0.16, 0.08, 0.12, mat(['#8EC5F0', '#F7C948', '#8FD6B9', '#c9b6ea'][i]), 0.02));
      for (let k = 0; k < w; k++) cj.add(en(caja(0.022, 0.022, 0.022, mat('#ffffff'), 0.004), -0.055 + (k % 3) * 0.055, 0.052, -0.025 + Math.floor(k / 3) * 0.05));
      cj.userData.peso = w;
      en(cj, 2.35 + i * 0.26, 0.79, 0.95);
      c.g.add(cj);
      return cj;
    });
    let hecho = false;
    const actualizar = () => {
      const der = enPlatillo.reduce((a, o) => a + (o.userData.peso as number), 0);
      const dif = 7 - der;
      const ang = THREE.MathUtils.clamp(dif * 0.05, -0.3, 0.3);
      viga.userData.meta = ang;
      if (dif === 0 && !hecho) {
        hecho = true;
        c.bien();
        const k = llave('llave', '#f2c75c', true);
        k.scale.setScalar(0.7);
        en(k, bx, by + 0.16, bz + 0.2);
        c.g.add(k);
        void c.escena.animar(500, (q) => (cajon.position.z = q * 0.18));
        llaveParaLaPuerta(c, k);
      }
    };
    viga.userData.meta = 0.3;
    c.cada((dt) => {
      viga.rotation.z += ((viga.userData.meta as number) - viga.rotation.z) * Math.min(1, dt * 4);
      const a = viga.rotation.z;
      platillos.forEach((pl, i) => {
        const lado = i ? 1 : -1;
        pl.position.set(bx + Math.cos(a) * 0.45 * lado, by + 0.62 + Math.sin(a) * 0.45 * lado - 0.38, bz);
      });
    });
    const planoMesa = planoPiso(0.79);
    for (const cj of cajas) {
      c.arrastrar(cj, {
        plano: planoMesa,
        limites: limites(1.05, 0.79, 0.45, 3.15, 0.79, 1.15),
        alTomar: () => {
          const i = enPlatillo.indexOf(cj);
          if (i >= 0) {
            enPlatillo.splice(i, 1);
            const w = cj.getWorldPosition(new THREE.Vector3());
            c.g.add(cj);
            cj.position.copy(w);
            actualizar();
          }
        },
        alSoltar: (pnt) => {
          const der = platillos[1].getWorldPosition(new THREE.Vector3());
          if (Math.hypot(pnt.x - der.x, pnt.z - der.z) < 0.28 && !hecho) {
            enPlatillo.push(cj);
            platillos[1].add(cj);
            const n = enPlatillo.length - 1;
            cj.position.set(-0.06 + (n % 2) * 0.12, 0.055 + Math.floor(n / 2) * 0.09, 0);
            sonido.nota(400, 0.08, 0, 'triangle', 0.05);
            actualizar();
          } else cj.position.y = 0.79;
        },
      });
    }
    actualizar();
  },
  async prueba(p) {
    for (const w of [2, 5]) {
      const der = p.obj('platillo der').getWorldPosition(new THREE.Vector3());
      await p.arrastrar(`cajita ${w}`, new THREE.Vector3(der.x, 0.79, der.z), 16);
      await p.esperar(400);
    }
    await p.esperar(800);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 24 · La rocola
// ---------------------------------------------------------------------------
const NOTAS = [523, 659, 784, 1046];
const COLORES_ROCOLA = ['#e4574b', '#F7C948', '#8FD6B9', '#8EC5F0'];
const MELODIA = [0, 2, 1, 3, 2, 0, 3];
const rocola: Nivel = {
  titulo: 'La rocola',
  pistas: [
    'Esa rocola quiere que la acompañes.',
    'El botón de abajo la pone a sonar: mira qué botones de colores se iluminan.',
    'Repite la canción tocando los botones de colores en el mismo orden en que se prendieron.',
  ],
  montar(c) {
    const r = grupo('rocola');
    r.add(en(caja(1.0, 1.2, 0.5, mat('#b8653a'), 0.08), 0, 0.6, 0));
    const arco = cilindro(0.5, 0.5, 0.5, mat('#e4574b'), undefined, 32);
    arco.rotation.x = Math.PI / 2;
    en(arco, 0, 1.2, 0);
    r.add(arco);
    const vidrio = cilindro(0.38, 0.38, 0.52, matNuevo('#ffe9b0', { emisivo: '#ffcf6a', intensidad: 0.4 }), undefined, 32);
    vidrio.rotation.x = Math.PI / 2;
    en(vidrio, 0, 1.2, 0.01);
    r.add(vidrio);
    const botones = COLORES_ROCOLA.map((col, i) => {
      const b = cilindro(0.07, 0.07, 0.05, matNuevo(col, { emisivo: col, intensidad: 0 }), `boton ${i}`, 20);
      b.rotation.x = Math.PI / 2;
      en(b, -0.3 + i * 0.2, 0.75, 0.26);
      r.add(b);
      return b;
    });
    const play = grupo('play');
    const tri = new THREE.Shape();
    tri.moveTo(-0.05, -0.06);
    tri.lineTo(0.07, 0);
    tri.lineTo(-0.05, 0.06);
    tri.closePath();
    play.add(new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.03, bevelEnabled: false }), mat('#fff8ee')));
    play.add(en(cilindro(0.1, 0.1, 0.03, mat('#3d2b27'), undefined, 20), 0, 0, -0.02));
    (play.children[1] as THREE.Mesh).rotation.x = Math.PI / 2;
    en(play, 0, 0.45, 0.26);
    r.add(play);
    en(r, 2.2, 0, 0.5);
    c.g.add(r);
    const brillar = (i: number, ms: number) => {
      const m = botones[i].material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 1.4;
      sfx.rocola(NOTAS[i], 0, ms / 1000);
      c.despues(ms, () => (m.emissiveIntensity = 0));
    };
    let sonando = false, escuchada = false, paso = 0, hecho = false;
    c.tocar(play, () => {
      if (sonando || hecho) return;
      sonando = true;
      paso = 0;
      MELODIA.forEach((n, i) => c.despues(300 + i * 520, () => brillar(n, 380)));
      c.despues(300 + MELODIA.length * 520, () => {
        sonando = false;
        escuchada = true;
        r.userData.escuchada = true;
      });
    });
    botones.forEach((b, i) => {
      c.tocar(b, () => {
        if (sonando || hecho) return;
        brillar(i, 260);
        if (!escuchada) return;
        if (MELODIA[paso] === i) {
          paso++;
          if (paso === MELODIA.length) {
            hecho = true;
            c.despues(400, () => [523, 659, 784, 1046, 1318].forEach((f, k) => sfx.rocola(f, k * 0.1, 0.22)));
            (vidrio.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5;
            abrirYa(c, 1300);
          }
        } else {
          paso = 0;
          c.mal();
        }
      });
    });
  },
  async prueba(p) {
    await p.tocar('play');
    await p.esperarQue(() => !!p.obj('rocola').userData.escuchada, 60000);
    for (const n of MELODIA) await p.tocar(`boton ${n}`, 1, 200);
  },
};

// ---------------------------------------------------------------------------
// 25 · La cuenta
// ---------------------------------------------------------------------------
/** 2 × 4 + 9 + 3 × 3 + 0 + 4 de propina. */
const TOTAL_CUENTA = '30';
const cuenta: Nivel = {
  titulo: 'La cuenta',
  pistas: [
    'Hay que pagar antes de irse.',
    'El recibo de la mesa dice qué pedimos; la caja registradora quiere el total.',
    'Multiplica cada línea del recibo (cantidad por precio), súmalo todo, propina incluida, y escribe el total en la caja.',
  ],
  montar(c) {
    const mesa = mesaRedonda(0.45);
    en(mesa, 1.2, 0, 1.05);
    c.g.add(mesa);
    const recibo = letrero(0.26, 0.38, (cx, w, h) => {
      cx.fillStyle = '#fffdf6';
      cx.fillRect(0, 0, w, h);
      cx.fillStyle = '#3d2b27';
      cx.font = `700 ${h * 0.07}px 'Courier Prime', monospace`;
      ['CAFÉ DE LOS DOS', '2 café    x 4', '1 torta   x 9', '3 galleta x 3', '1 beso    x 0', 'propina   + 4', 'TOTAL     ??'].forEach((l, i) => cx.fillText(l, w * 0.08, h * (0.12 + i * 0.12)));
    }, 'recibo');
    recibo.rotation.x = -Math.PI / 2 + 0.35;
    en(recibo, 1.2, 0.78, 1.05);
    c.g.add(recibo);
    c.tocar(recibo, () =>
      void c.ui.nota(`<pre style="font:700 17px/1.5 'Courier Prime',monospace;margin:0">CAFÉ DE LOS DOS\n\n2 café     x 4\n1 torta    x 9\n3 galleta  x 3\n1 beso     x 0\npropina    + 4\n\nTOTAL      ??</pre>`),
    );
    const m = mostrador(1.6);
    en(m, 2.5, 0, 0.5);
    c.g.add(m);
    const caja3 = grupo('caja registradora');
    caja3.add(en(caja(0.5, 0.3, 0.4, mat('#8EC5F0'), 0.04), 0, 0.15, 0), en(caja(0.36, 0.16, 0.05, mat('#26313a'), 0.02), 0, 0.38, -0.08));
    caja3.add(en(caja(0.3, 0.06, 0.03, matNuevo('#7ff0b0', { emisivo: '#2f8f68', intensidad: 0.6 }), 0.01), 0, 0.4, -0.05));
    en(caja3, 2.4, 1.0, 0.5);
    c.g.add(caja3);
    c.tocar(caja3, async () => {
      await c.enfocar(caja3, 1.0);
      const ok = await c.ui.teclado({ titulo: 'Caja registradora', largo: 2, correcto: TOTAL_CUENTA });
      if (ok) {
        sonido.caja();
        c.resolver();
      } else await c.volver();
    });
  },
  async prueba(p) {
    await p.tocar('caja registradora');
    await p.panel(TOTAL_CUENTA);
  },
};

// ---------------------------------------------------------------------------
// 26 · El vidrio que guarda un secreto
// ---------------------------------------------------------------------------
const CODIGO_VIDRIO = ['3', '1', '5'];
const vidrio: Nivel = {
  titulo: 'El secreto del vidrio',
  pistas: [
    'Esa ventana guarda un secreto.',
    'Lo que se escribe en un vidrio empañado vuelve a aparecer cuando se empaña otra vez.',
    'Empaña el vidrio con tu aliento (sopla cerca del micrófono o mantén el dedo sobre la ventana) y lee lo que aparece.',
  ],
  montar(c) {
    const x0 = -2.05, y0 = 1.65;
    const calle = lienzo(256, 210, (cx, w, h) => {
      const g = cx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#9fd3f0');
      g.addColorStop(1, '#fbe3d0');
      cx.fillStyle = g;
      cx.fillRect(0, 0, w, h);
      const casas = ['#F59FC0', '#F7C948', '#8FD6B9', '#c9b6ea', '#8EC5F0'];
      for (let i = 0; i < 5; i++) {
        cx.fillStyle = casas[i];
        cx.fillRect(i * 52, h * 0.45 + (i % 2) * 14, 48, h);
        cx.fillStyle = '#fff8ee';
        cx.fillRect(i * 52 + 14, h * 0.58 + (i % 2) * 14, 18, 18);
      }
      cx.fillStyle = '#8a8076';
      cx.fillRect(0, h * 0.86, w, h);
    });
    const vista = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.0), new THREE.MeshBasicMaterial({ map: calle }));
    en(vista, x0, y0, 0.01);
    const m = mat('#fff8ee');
    const marco = grupo('ventana');
    marco.add(en(caja(1.34, 0.08, 0.08, m, 0.02), 0, 0.54, 0), en(caja(1.34, 0.08, 0.08, m, 0.02), 0, -0.54, 0));
    marco.add(en(caja(0.08, 1.1, 0.08, m, 0.02), -0.63, 0, 0), en(caja(0.08, 1.1, 0.08, m, 0.02), 0.63, 0, 0), en(caja(0.05, 1.0, 0.05, m, 0.01), 0, 0, 0));
    en(marco, x0, y0, 0.04);
    const vaho = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.0), new THREE.MeshBasicMaterial({ color: '#eef4f6', transparent: true, opacity: 0, depthWrite: false }));
    vaho.name = 'vaho';
    en(vaho, x0, y0, 0.03);
    const escrito = letrero(1.1, 0.9, (cx, w, h) => {
      cx.strokeStyle = 'rgba(160, 190, 200, 1)';
      cx.lineWidth = 16;
      cx.lineCap = 'round';
      cx.font = `600 ${h * 0.34}px 'Fredoka', sans-serif`;
      cx.fillStyle = 'rgba(150, 180, 190, 1)';
      cx.textAlign = 'center';
      cx.fillText(CODIGO_VIDRIO.join(' '), w / 2, h * 0.52);
      cx.fillText('♥', w / 2, h * 0.9);
    }, 'escrito', { transparente: true });
    (escrito.material as THREE.MeshStandardMaterial).opacity = 0;
    en(escrito, x0, y0, 0.035);
    c.g.add(vista, marco, vaho, escrito);
    const toque = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.1), new THREE.MeshBasicMaterial({ visible: false }));
    en(toque, x0, y0, 0.09);
    toque.name = 'ventana toque';
    c.g.add(toque);
    let empanado = 0;
    const empanar = () => {
      if (empanado <= 0) c.bien();
      empanado = 6;
      sonido.rumor(0.9, 500, 0.05, 0, 0.5, 250);
    };
    c.sensor.soplido(empanar);
    let pidio = false;
    c.mantener(toque, () => {
      if (!pidio) {
        pidio = true;
        void c.sensores.escuchar();
        c.aviso('Échale el aliento al vidrio…', 2500);
      }
    }, (ms) => ms > 1100 && empanar());
    c.alSalir(() => c.sensores.callar());
    c.cada((dt) => {
      empanado = Math.max(0, empanado - dt);
      const meta = empanado > 0 ? 1 : 0;
      const mv = vaho.material as THREE.MeshBasicMaterial, me = escrito.material as THREE.MeshStandardMaterial;
      mv.opacity += (meta * 0.78 - mv.opacity) * Math.min(1, dt * 3);
      me.opacity = Math.min(1, mv.opacity * 1.3);
      escrito.userData.visto = me.opacity > 0.5;
    });
    candadoPuerta(c, [0, 1, 2].map(() => '0123456789'.split('')), CODIGO_VIDRIO, 'Candado de la puerta');
  },
  async prueba(p) {
    p.sensor.soplar();
    await p.esperarQue(() => !!p.obj('escrito').userData.visto, 30000);
    await p.tocar('candado');
    await p.panel(CODIGO_VIDRIO.join(''));
  },
};

// ---------------------------------------------------------------------------
// 27 · Galletas de la fortuna
// ---------------------------------------------------------------------------
const LETRAS_GALLETAS = ['O', 'S', 'E', 'B'];
const galletas: Nivel = {
  titulo: 'Galletas de la fortuna',
  pistas: [
    'Las galletas traen algo adentro.',
    'Cada galleta esconde una letra; juntas forman una palabra.',
    'Abre todas las galletas y ordena sus letras para formar algo que te doy todos los días. Va en el candado.',
  ],
  montar(c) {
    const mesa = mesaRedonda(0.55);
    en(mesa, 1.2, 0, 0.95);
    c.g.add(mesa);
    const plato = cilindro(0.34, 0.28, 0.03, mat('#fff8ee'), undefined, 32);
    en(plato, 1.2, 0.765, 0.95);
    c.g.add(plato);
    LETRAS_GALLETAS.forEach((l, i) => {
      const g = grupo(`galleta ${i}`);
      const mitades = [-1, 1].map((s) => {
        const h = toro(0.07, 0.035, mat('#e8b06a'), undefined, Math.PI);
        h.rotation.set(0, s * 0.4, s * 0.35);
        en(h, s * 0.035, 0, 0);
        g.add(h);
        return h;
      });
      const papel = letrero(0.1, 0.12, (cx, w, h) => {
        cx.fillStyle = '#fffdf6';
        cx.fillRect(0, 0, w, h);
        textoEn(cx, l, w / 2, h / 2 + 3, h * 0.75, '#e4574b', 700);
      });
      papel.visible = false;
      en(papel, 0, 0.1, 0.02);
      g.add(papel);
      const a = (i / 4) * Math.PI * 2 + 0.4;
      en(g, 1.2 + Math.cos(a) * 0.17, 0.82, 0.95 + Math.sin(a) * 0.12);
      c.g.add(g);
      let abierta = false;
      c.tocar(g, () => {
        if (abierta) return;
        abierta = true;
        sonido.mordisco();
        mitades.forEach((h, k) => {
          const x0 = h.position.x;
          void c.escena.animar(300, (q) => (h.position.x = x0 + (k ? 1 : -1) * q * 0.06));
        });
        papel.visible = true;
        void c.escena.animar(400, (q) => (papel.position.y = 0.05 + q * 0.08));
        c.bien();
      });
    });
    const abc = ['A', 'B', 'E', 'L', 'M', 'O', 'R', 'S'];
    candadoPuerta(c, [0, 1, 2, 3].map(() => abc), ['B', 'E', 'S', 'O'], 'Candado de letras');
  },
  async prueba(p) {
    for (let i = 0; i < 4; i++) await p.tocar(`galleta ${i}`);
    await p.tocar('candado');
    await p.panel('BESO');
  },
};

// ---------------------------------------------------------------------------
// 28 · Las tres tazas
// ---------------------------------------------------------------------------
const tazas: Nivel = {
  titulo: 'Las tres tazas',
  pistas: [
    'El mesero es rápido, pero tú más.',
    'Fíjate bien debajo de cuál taza queda lo brillante antes de que empiecen a moverse.',
    'No le quites el ojo a esa taza mientras se revuelven y tócala cuando se queden quietas.',
  ],
  montar(c) {
    const mesa = grupo('mesa tazas');
    mesa.add(en(caja(1.8, 0.06, 0.7, mat('#c49468'), 0.02), 0, 0.72, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesa.add(en(caja(0.06, 0.7, 0.06, mat('#c49468'), 0.015), sx * 0.82, 0.35, sz * 0.28));
    en(mesa, 1.9, 0, 0.95);
    c.g.add(mesa);
    const X = [1.35, 1.9, 2.45];
    const Y = 0.75;
    const k = llave('llave', '#f2c75c', true);
    k.scale.setScalar(0.8);
    c.g.add(k);
    const cs = [0, 1, 2].map((i) => {
      const t = grupo(`taza volteada ${i}`);
      t.add(en(cilindro(0.13, 0.17, 0.26, mat('#fff8ee'), undefined, 24), 0, 0.13, 0), en(toro(0.06, 0.018, mat('#fff8ee')), 0.19, 0.12, 0));
      (t.children[1] as THREE.Mesh).rotation.y = 0;
      en(t, X[i], Y, 0.95);
      c.g.add(t);
      return t;
    });
    const conLlave = cs[1];
    conLlave.userData.llave = true;
    const lugar = cs.map((_, i) => i);
    const ponerLlave = () => {
      const w = conLlave.position;
      en(k, w.x, Y + 0.01, 0.95);
    };
    ponerLlave();
    let estado: 'mostrando' | 'revolviendo' | 'eligiendo' | 'listo' = 'mostrando';
    const alzar = async (t: THREE.Object3D, sube: boolean) => {
      const y0 = t.position.y, y1 = sube ? Y + 0.3 : Y;
      await c.escena.animar(350, (q) => (t.position.y = y0 + (y1 - y0) * q));
    };
    const revolver = async () => {
      estado = 'revolviendo';
      k.visible = false;
      for (let n = 0; n < 9; n++) {
        const a = Math.floor(Math.random() * 3);
        const b = (a + 1 + Math.floor(Math.random() * 2)) % 3;
        const ta = cs[lugar.indexOf(a)], tb = cs[lugar.indexOf(b)];
        const xa = X[a], xb = X[b];
        sonido.rumor(0.2, 900, 0.03);
        sfx.toc(0.5);
        await c.escena.animar(420, (q) => {
          ta.position.x = xa + (xb - xa) * q;
          ta.position.z = 0.95 + Math.sin(q * Math.PI) * 0.18;
          tb.position.x = xb + (xa - xb) * q;
          tb.position.z = 0.95 - Math.sin(q * Math.PI) * 0.18;
        });
        const ia = lugar.indexOf(a), ib = lugar.indexOf(b);
        lugar[ia] = b;
        lugar[ib] = a;
      }
      ponerLlave();
      estado = 'eligiendo';
      c.g.userData.eligiendo = true;
    };
    const empezar = async () => {
      estado = 'mostrando';
      c.g.userData.eligiendo = false;
      k.visible = true;
      await c.escena.esperar(600);
      await alzar(conLlave, true);
      await c.escena.esperar(900);
      await alzar(conLlave, false);
      await c.escena.esperar(300);
      await revolver();
    };
    for (const t of cs) {
      c.tocar(t, async () => {
        if (estado !== 'eligiendo') return;
        estado = 'listo';
        k.visible = true;
        await alzar(t, true);
        if (t === conLlave) {
          c.bien();
          llaveParaLaPuerta(c, k);
        } else {
          c.mal();
          await alzar(conLlave, true);
          await c.escena.esperar(900);
          await Promise.all([alzar(t, false), alzar(conLlave, false)]);
          void empezar();
        }
      });
    }
    void empezar();
  },
  async prueba(p) {
    await p.esperarQue(() => !!p.obj('acertijo 28').userData.eligiendo, 120000);
    const t = [0, 1, 2].map((i) => p.obj(`taza volteada ${i}`)).find((o) => o.userData.llave)!;
    await p.tocar(t);
    await p.esperar(1200);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 29 · El letrero giratorio
// ---------------------------------------------------------------------------
const SIMBOLOS_RUEDA = ['★', '☕', '☀', '♣', '☾', '✿', '♦', '♥'];
const letreroGira: Nivel = {
  titulo: 'El letrero giratorio',
  pistas: [
    'Ese letrero redondo no está derecho.',
    'Gira, pero no como una perilla cualquiera: como se gira una tapa.',
    'Gíralo con dos dedos (o arrastrando en círculo con uno) hasta que lo que sentimos quede arriba, en la ventanita.',
  ],
  montar(c) {
    const x0 = 2.0, y0 = 1.6;
    const rueda = grupo('rueda');
    const disco = letrero(0.9, 0.9, (cx, w, h) => {
      cx.fillStyle = '#c49468';
      cx.beginPath();
      cx.arc(w / 2, h / 2, w * 0.49, 0, Math.PI * 2);
      cx.fill();
      SIMBOLOS_RUEDA.forEach((s, i) => {
        const a = (i / 8) * Math.PI * 2;
        textoEn(cx, s, w / 2 - Math.sin(a) * w * 0.34, h / 2 - Math.cos(a) * h * 0.34 + 4, w * 0.12, s === '♥' ? '#e4574b' : '#3d2b27', 700);
      });
    }, undefined, { transparente: true });
    rueda.add(disco);
    rueda.scale.setScalar(1.3);
    en(rueda, x0, y0, 0.05);
    c.g.add(rueda);
    // Tapa con ventanita arriba
    const tapa = letrero(1.0, 1.0, (cx, w, h) => {
      cx.fillStyle = '#3c7a62';
      cx.beginPath();
      cx.arc(w / 2, h / 2, w * 0.5, 0, Math.PI * 2);
      cx.arc(w / 2, h * 0.16, w * 0.085, 0, Math.PI * 2, true);
      cx.fill('evenodd');
      textoEn(cx, 'ABIERTO SOLO CON', w / 2, h * 0.55, w * 0.055, '#fff8ee', 700);
      textoEn(cx, 'EL SÍMBOLO CORRECTO', w / 2, h * 0.63, w * 0.055, '#fff8ee', 700);
    }, 'tapa rueda', { transparente: true });
    tapa.scale.setScalar(1.3);
    en(tapa, x0, y0, 0.07);
    c.g.add(tapa);
    const toque = new THREE.Mesh(new THREE.CircleGeometry(0.65, 32), new THREE.MeshBasicMaterial({ visible: false }));
    toque.name = 'rueda toque';
    en(toque, x0, y0, 0.1);
    c.g.add(toque);
    let ang = (3 / 8) * Math.PI * 2;
    rueda.rotation.z = ang;
    let hecho = false;
    const arriba = () => SIMBOLOS_RUEDA[((Math.round(-ang / (Math.PI / 4)) % 8) + 8) % 8];
    rueda.userData.arriba = arriba;
    const soltar = () => {
      if (hecho) return;
      const paso = Math.PI / 4;
      const meta = Math.round(ang / paso) * paso;
      const a0 = ang;
      void c.escena.animar(200, (q) => {
        ang = a0 + (meta - a0) * q;
        rueda.rotation.z = ang;
      }).then(() => {
        sonido.nota(1200, 0.03, 0, 'square', 0.04);
        if (arriba() === '♥') {
          hecho = true;
          abrirYa(c, 800);
        }
      });
    };
    c.gesto.giro((d) => {
      if (hecho) return;
      ang -= d;
      rueda.rotation.z = ang;
    });
    c.gesto.dedos((n) => n === 0 && soltar());
    // Con un dedo: arrastrar en círculo sobre el letrero
    let previo: number | null = null;
    const centro = new THREE.Vector3(x0, y0, 0.1);
    const plano = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.1);
    c.mantener(toque, (hit) => (previo = Math.atan2(hit.point.y - centro.y, hit.point.x - centro.x)), () => (previo = null));
    c.gesto.mover((x, y, abajo) => {
      if (!abajo || previo === null || hecho) return;
      const p = c.enPlano(x, y, plano);
      if (!p) return;
      const a = Math.atan2(p.y - centro.y, p.x - centro.x);
      let d = a - previo;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      previo = a;
      ang += d;
      rueda.rotation.z = ang;
    });
  },
  async prueba(p) {
    const r = p.obj('rueda');
    for (let i = 0; i < 8 && (r.userData.arriba as () => string)() !== '♥'; i++) {
      await p.girar(Math.PI / 4);
      await p.esperar(500);
    }
  },
};

// ---------------------------------------------------------------------------
// 30 · Cerrado… o abierto
// ---------------------------------------------------------------------------
const cerrado: Nivel = {
  titulo: 'Cerrado… o abierto',
  pistas: [
    'Nada es lo que parece desde donde estás.',
    'Ese letrero se lee distinto si el mundo se pone de cabeza.',
    'Voltea el celular de cabeza y vuelve a ponerlo derecho. (Si no se entera, toca el letrero varias veces.)',
  ],
  montar(c) {
    const pintar = (texto: string, color: string, alReves: boolean) => (cx: CanvasRenderingContext2D, w: number, h: number) => {
      cx.save();
      if (alReves) {
        cx.translate(w, h);
        cx.rotate(Math.PI);
      }
      cx.fillStyle = '#fff8ee';
      cx.fillRect(0, 0, w, h);
      cx.strokeStyle = color;
      cx.lineWidth = 12;
      cx.strokeRect(6, 6, w - 12, h - 12);
      textoEn(cx, texto, w / 2, h / 2 + 4, h * 0.42, color, 700);
      cx.restore();
    };
    const cartel = letrero(0.62, 0.22, pintar('CERRADO', '#e4574b', false), 'cartel cerrado');
    const cordel = cilindro(0.004, 0.004, 0.28, mat('#8a6a33'));
    cordel.rotation.z = Math.PI / 2;
    const g = grupo('cartel');
    en(cartel, 0, -0.13, 0);
    g.add(cartel, en(cordel, 0, 0.02, 0));
    c.puerta.pegar(g, 0.02, 1.62, 0.1);
    const mCartel = cartel.material as THREE.MeshStandardMaterial;
    const mapaAbierto = (letrero(0.62, 0.22, pintar('ABIERTO', '#2f8f68', true)).material as THREE.MeshStandardMaterial).map;
    let volteado = false, cabeza = 0;
    const voltear = () => {
      if (volteado) return;
      volteado = true;
      sonido.nota(900, 0.08, 0, 'triangle', 0.06);
      void c.escena.animar(700, (q) => {
        g.rotation.z = q * Math.PI;
        if (q > 0.5 && mCartel.map !== mapaAbierto) {
          mCartel.map = mapaAbierto;
          mCartel.needsUpdate = true;
        }
      });
      abrirYa(c, 1300);
    };
    c.sensor.volteo(voltear);
    c.cada((dt) => {
      if (c.sensores.inclinacion.y < -0.55) cabeza += dt;
      else cabeza = 0;
      if (cabeza > 0.4) voltear();
    });
    // Sin sensores: mantener presionado el letrero
    c.despues(4000, () => {
      if (c.sensores.hayMovimiento || volteado) return;
      c.aviso('Si tu celular no gira la pantalla: mantén presionado el letrero.', 3500);
    });
    c.mantener(g, () => {}, (ms) => {
      if (ms > 1200 && !c.sensores.hayMovimiento) voltear();
      else void c.escena.animar(300, (q) => (g.rotation.z = Math.sin(q * Math.PI * 2) * 0.12));
    });
  },
  async prueba(p) {
    p.sensor.voltear();
  },
};

export const CAP3: Nivel[] = [pedido, latte, balanza, rocola, cuenta, vidrio, galletas, tazas, letreroGira, cerrado];
