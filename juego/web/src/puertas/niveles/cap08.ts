// Capítulo 8 · El castillo de los cuentos (puertas 71–80): las dos cadenas a la vez, el dragón dormido, soplar las
// velas, los espejos que llevan la luz a la gema, vestir la armadura, el caballo de ajedrez, el escudo distinto,
// la poción del color pedido, el criptex y la trenza de la torre.
import * as THREE from 'three';
import * as sonido from '../../sonido';
import { piedraTextura } from '../cuarto';
import * as sfx from '../sonidos';
import { caja, cilindro, corazon, en, esfera, forma, grupo, letrero, mat, matNuevo, textoEn, toro } from '../kit';
import type { Ctx, Nivel } from '../nivel';
import { candadoPuerta, limites, llave, planoPiso } from './piezas';

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

const pergamino = (w: number, h: number, pintar: (c: CanvasRenderingContext2D, W: number, H: number) => void, nombre?: string) =>
  letrero(w, h, (cv, W, H) => {
    cv.fillStyle = '#f3e3c3';
    cv.fillRect(0, 0, W, H);
    cv.strokeStyle = '#b8925a';
    cv.lineWidth = 10;
    cv.strokeRect(8, 8, W - 16, H - 16);
    pintar(cv, W, H);
  }, nombre);

// ---------------------------------------------------------------------------
// 71 · Las dos cadenas
// ---------------------------------------------------------------------------
const cadenas: Nivel = {
  titulo: 'Las dos cadenas',
  pistas: [
    'Esa reja pesa demasiado para un solo lado.',
    'Cada torno sube un lado de la reja. Uno solo no puede con ella.',
    'Mantén presionados los dos tornos al mismo tiempo, con dos dedos, hasta que la reja suba.',
  ],
  montar(c) {
    const tornos = [-1, 1].map((s) => {
      const t = grupo(s < 0 ? 'torno izq' : 'torno der');
      const base = caja(0.3, 0.7, 0.3, mat('#6b5a4c'), 0.03);
      en(base, 0, 0.35, 0);
      const rueda = grupo();
      const aro = toro(0.2, 0.03, mat('#5e4636'));
      rueda.add(aro);
      for (let i = 0; i < 4; i++) {
        const r = caja(0.4, 0.035, 0.035, mat('#5e4636'), 0.01);
        r.rotation.z = (i * Math.PI) / 4;
        rueda.add(r);
      }
      rueda.add(en(cilindro(0.02, 0.02, 0.18, mat('#3d2b27')), 0.2, 0, 0.09));
      (rueda.children[rueda.children.length - 1] as THREE.Object3D).rotation.x = Math.PI / 2;
      en(rueda, 0, 0.95, 0.16);
      t.add(base, rueda, en(toque(0.34), 0, 0.9, 0.1));
      en(t, s * 1.35, 0, 0.45);
      t.userData.rueda = rueda;
      c.g.add(t);
      return t;
    });
    // Cadenas de cada torno a la reja
    const cadena = (s: number) => {
      const g = grupo('marco cadena');
      const a = new THREE.Vector3(s * 1.35, 1.15, 0.5), b = new THREE.Vector3(s * 0.74, 2.42, 0.12);
      const n = 12;
      for (let i = 0; i < n; i++) {
        const e = toro(0.035, 0.01, mat('#8a94a0', { metal: 0.7, rough: 0.35 }), undefined);
        e.position.lerpVectors(a, b, (i + 0.5) / n);
        e.rotation.set(0, i % 2 ? Math.PI / 2 : 0, Math.atan2(b.y - a.y, b.x - a.x));
        g.add(e);
      }
      c.g.add(g);
      return g;
    };
    const cs = [cadena(-1), cadena(1)];
    const abajo = [false, false];
    let fuerza = 0, hecho = false, solo = 0;
    tornos.forEach((t, i) =>
      c.mantener(t, () => (abajo[i] = true), () => {
        abajo[i] = false;
      }),
    );
    c.cada((dt) => {
      if (hecho) return;
      const n = abajo.filter(Boolean).length;
      tornos.forEach((t, i) => abajo[i] && (t.userData.rueda.rotation.z -= dt * (n === 2 ? 4 : 1.5)));
      if (n === 2) {
        fuerza += dt;
        cs.forEach((g) => (g.position.y = Math.min(0.25, fuerza * 0.12)));
        if (Math.floor(fuerza * 4) !== Math.floor((fuerza - dt) * 4)) sonido.nota(160 + fuerza * 60, 0.05, 0, 'square', 0.03);
        if (fuerza >= 1.6) {
          hecho = true;
          abrirYa(c, 300);
        }
      } else {
        if (n === 1) {
          solo += dt;
          if (solo > 0.9) {
            solo = -10;
            sonido.nota(120, 0.2, 0, 'square', 0.05);
            c.escena.temblar(0.012, 200);
            c.mal();
          }
        } else solo = 0;
        fuerza = Math.max(0, fuerza - dt * 2);
        cs.forEach((g) => (g.position.y = Math.min(0.25, fuerza * 0.12)));
      }
    });
    c.gesto.dedos((n) => n === 0 && (solo = 0));
  },
  async prueba(p) {
    await p.dedos(['torno izq', 'torno der'], 9000);
  },
};

// ---------------------------------------------------------------------------
// 72 · El dragón dormido
// ---------------------------------------------------------------------------
const dragon: Nivel = {
  titulo: 'El dragón dormido',
  pistas: [
    'Ese dragón tiene el sueño liviano.',
    'Lo que buscas está en la punta de su cola. Si lo jalas rápido, se despierta.',
    'Arrastra lo de la cola muy, muy despacito, alejándolo del dragón, y luego tómalo.',
  ],
  montar(c) {
    const D = new THREE.Vector3(1.9, 0, 0.75);
    const d = grupo('dragon');
    const verde = mat('#6fbf73'), claro = mat('#bfe8a8');
    const cuerpo = esfera(0.42, verde, undefined, 20);
    cuerpo.scale.set(1.3, 0.62, 0.9);
    en(cuerpo, 0, 0.27, 0);
    const panza = esfera(0.3, claro, undefined, 16);
    panza.scale.set(1.2, 0.55, 0.6);
    en(panza, -0.05, 0.22, 0.2);
    const cabeza = esfera(0.22, verde, undefined, 16);
    cabeza.scale.set(1.25, 0.85, 1);
    en(cabeza, -0.55, 0.2, 0.32);
    const hocico = esfera(0.12, claro, undefined, 12);
    en(hocico, -0.77, 0.16, 0.4);
    const ojos = [-1, 1].map((s) => {
      const o = caja(0.07, 0.012, 0.01, mat('#3d2b27'), 0.004);
      en(o, -0.62, 0.27, 0.32 + s * 0.12);
      o.rotation.y = s * 0.5 - 0.3;
      return o;
    });
    const abiertos = [-1, 1].map((s) => {
      const o = esfera(0.035, mat('#fff8ee'), undefined, 10);
      o.add(en(esfera(0.018, mat('#3d2b27'), undefined, 8), -0.015, 0, 0.012));
      en(o, -0.62, 0.28, 0.32 + s * 0.12);
      o.visible = false;
      return o;
    });
    for (const x of [-0.2, 0.05, 0.3]) {
      const pua = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 6), mat('#4f9a58'));
      en(pua, x, 0.54, -0.05);
      d.add(pua);
    }
    const ala = new THREE.Mesh(new THREE.CircleGeometry(0.3, 3), mat('#4f9a58', { lados: THREE.DoubleSide }));
    ala.rotation.set(-1.2, 0, 0.5);
    en(ala, 0.1, 0.48, -0.12);
    d.add(cuerpo, panza, cabeza, hocico, ala, ...ojos, ...abiertos);
    // Cola hacia adelante a la izquierda
    const cola: THREE.Vector3[] = [new THREE.Vector3(0.5, 0.15, 0.1), new THREE.Vector3(0.6, 0.1, 0.5), new THREE.Vector3(0.2, 0.07, 0.7), new THREE.Vector3(-0.4, 0.05, 0.62), new THREE.Vector3(-0.85, 0.04, 0.6)];
    const curva = new THREE.CatmullRomCurve3(cola);
    d.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 24, 0.05, 8), verde));
    const punta = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.14, 4), mat('#4f9a58'));
    punta.rotation.z = Math.PI / 2;
    en(punta, -0.9, 0.04, 0.6);
    d.add(punta);
    en(d, D.x, D.y, D.z);
    c.g.add(d);
    const zzz = ['z', 'z', 'Z'].map((z, i) => {
      const l = letrero(0.12, 0.12, (cv, w, h) => textoEn(cv, z, w / 2, h / 2 + 3, h * 0.8, '#fff8ee', 700), undefined, { transparente: true });
      c.g.add(l);
      l.userData.i = i;
      return l;
    });
    const inicio = new THREE.Vector3(D.x - 0.98, 0.06, D.z + 0.6);
    const k = llave('llave', '#f2c75c', true);
    en(k, inicio.x, inicio.y, inicio.z);
    c.g.add(k);
    let despierto = 0, lejos = false;
    const muestras: { t: number; p: THREE.Vector3 }[] = [];
    const despertar = () => {
      despierto = 1.6;
      sonido.rumor(0.4, 220, 0.12);
      sonido.nota(110, 0.3, 0.05, 'sawtooth', 0.05);
      c.escena.temblar(0.015, 300);
      c.mal();
    };
    c.arrastrar(k, {
      plano: planoPiso(0.06),
      limites: limites(-1.4, 0.06, 0.45, 2.8, 0.06, 1.6),
      alTomar: () => (muestras.length = 0),
      alMover: (p) => {
        if (lejos) return;
        if (despierto > 0) {
          k.position.copy(inicio);
          return;
        }
        const t = performance.now();
        muestras.push({ t, p: p.clone() });
        while (muestras.length > 2 && t - muestras[0].t > 250) muestras.shift();
        const a = muestras[0];
        if (t - a.t > 90 && a.p.distanceTo(p) / ((t - a.t) / 1000) > 0.95) {
          despertar();
          k.position.copy(inicio);
          return;
        }
        if (p.distanceTo(inicio) > 0.9) {
          lejos = true;
          k.userData.lejos = true;
          sonido.nota(988, 0.12, 0, 'triangle', 0.06);
        }
      },
      alSoltar: () => {
        if (!lejos) k.position.copy(inicio);
      },
    });
    let ronca = 1;
    c.cada((dt, t) => {
      despierto = Math.max(0, despierto - dt);
      ronca -= dt;
      if (ronca <= 0 && despierto <= 0 && !lejos) {
        ronca = 3.6;
        sfx.ronquido();
      }
      ojos.forEach((o) => (o.visible = despierto <= 0));
      abiertos.forEach((o) => (o.visible = despierto > 0));
      cuerpo.scale.y = 0.62 + Math.sin(t * 1.6) * 0.02;
      zzz.forEach((l) => {
        const f = (t * 0.35 + l.userData.i / 3) % 1;
        l.visible = despierto <= 0;
        l.position.set(D.x - 0.7 + f * 0.25, 0.45 + f * 0.6, D.z + 0.35);
        (l.material as THREE.MeshStandardMaterial).opacity = 1 - f;
      });
    });
    llaveParaLaPuerta(c, k, () => lejos);
  },
  async prueba(p) {
    await p.arrastrar('llave', new THREE.Vector3(-0.3, 0.06, 1.35), 110);
    await p.esperarQue(() => !!p.obj('llave').userData.lejos, 5000);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 73 · Las velas
// ---------------------------------------------------------------------------
const CLAVE_VELAS = ['1', '5', '0', '9'];
const velas: Nivel = {
  titulo: 'Las velas',
  pistas: [
    'Hay demasiada luz para leer la pared.',
    'Lo escrito en la pared solo se ve con las velas apagadas.',
    'Apaga las velas soplando cerca del micrófono (o manteniendo el dedo sobre cada llama); lo que aparece es la clave del candado.',
  ],
  montar(c) {
    const M = new THREE.Vector3(2.2, 0, 0.75);
    c.g.add(en(caja(0.9, 0.7, 0.45, mat('#5e4636'), 0.03), M.x, 0.35, M.z));
    const candelabro = grupo('candelabro');
    candelabro.add(en(cilindro(0.1, 0.13, 0.05, mat('#d9b25a', { metal: 0.7, rough: 0.3 })), 0, 0.72, 0), en(cilindro(0.02, 0.02, 0.2, mat('#d9b25a', { metal: 0.7 })), 0, 0.84, 0));
    const brazo = caja(0.5, 0.025, 0.025, mat('#d9b25a', { metal: 0.7 }), 0.01);
    en(brazo, 0, 0.94, 0);
    candelabro.add(brazo);
    en(candelabro, M.x, 0, M.z);
    c.g.add(candelabro);
    const lista = [-0.22, 0, 0.22].map((dx, i) => {
      const v = grupo(`vela ${i}`);
      v.add(en(cilindro(0.035, 0.035, 0.22, mat('#fff3e0')), 0, 0.11, 0));
      const llama = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 8), new THREE.MeshBasicMaterial({ color: '#ffc04a' }));
      en(llama, 0, 0.27, 0);
      const luz = new THREE.PointLight('#ffb46a', 1.2, 2.5, 1.5);
      en(luz, 0, 0.3, 0.1);
      v.add(llama, luz, en(toque(0.12), 0, 0.22, 0));
      en(v, M.x + dx, 0.95, M.z);
      v.userData.llama = llama;
      v.userData.luz = luz;
      c.g.add(v);
      return v;
    });
    const escrito = letrero(0.9, 0.5, (cv, w, h) => {
      cv.clearRect(0, 0, w, h);
      textoEn(cv, '15 · 09', w / 2, h * 0.45, h * 0.42, '#9fe8ff', 700);
      textoEn(cv, 'el día que nos conocimos', w / 2, h * 0.82, h * 0.11, '#9fe8ff', 600);
    }, 'escrito', { transparente: true, brillo: 1.2 });
    en(escrito, M.x, 1.55, 0.03);
    (escrito.material as THREE.MeshStandardMaterial).opacity = 0;
    c.g.add(escrito);
    candadoPuerta(c, CLAVE_VELAS.map(() => '0123456789'.split('')), CLAVE_VELAS, 'Candado de la reja', 0.3, 1.05);
    let apagadas = 0;
    const apagar = (v: THREE.Object3D) => {
      if (v.userData.apagada) return;
      v.userData.apagada = true;
      apagadas++;
      sonido.rumor(0.3, 900, 0.05, 0, 0.5, 300);
      const humo = esfera(0.03, new THREE.MeshBasicMaterial({ color: '#cfc7c0', transparent: true, opacity: 0.6 }), undefined, 6);
      const p0 = v.position.clone().add(new THREE.Vector3(0, 0.3, 0));
      c.g.add(humo);
      void c.escena.animar(1200, (q) => {
        humo.position.copy(p0).add(new THREE.Vector3(Math.sin(q * 8) * 0.03, q * 0.4, 0));
        humo.scale.setScalar(1 + q * 2);
        (humo.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - q);
      }).then(() => humo.removeFromParent());
      v.userData.llama.visible = false;
      v.userData.luz.visible = false;
      if (apagadas === 3) {
        c.bien();
        escrito.userData.visto = true;
        void c.escena.animar(1500, (q) => ((escrito.material as THREE.MeshStandardMaterial).opacity = q));
      }
    };
    c.sensor.soplido(() => {
      const v = lista.find((x) => !x.userData.apagada);
      if (v) apagar(v);
    });
    let pidio = false;
    lista.forEach((v) =>
      c.mantener(v, async () => {
        if (pidio) return;
        pidio = true;
        c.aviso('Sopla al celular…', 2200);
        if (!(await c.sensores.escuchar())) c.aviso('Sin micrófono: mantén el dedo sobre cada llama un segundo.', 3500);
      }, (ms) => {
        if (ms > 900) apagar(v);
      }),
    );
    c.alSalir(() => c.sensores.callar());
    c.cada((_, t) => lista.forEach((v, i) => (v.userData.llama.scale.y = 1 + Math.sin(t * 11 + i) * 0.12)));
  },
  async prueba(p) {
    for (let i = 0; i < 3; i++) {
      p.sensor.soplar();
      await p.esperar(500);
    }
    await p.esperarQue(() => !!p.obj('escrito').userData.visto, 5000);
    await p.tocar('candado');
    await p.panel(CLAVE_VELAS.join(''));
  },
};

// ---------------------------------------------------------------------------
// 74 · Los espejos y la gema
// ---------------------------------------------------------------------------
type Dir2 = [number, number];
const ESPEJOS: { x: number; z: number; inicial: 'a' | 'b'; meta: 'a' | 'b' }[] = [
  { x: -1.05, z: 0.6, inicial: 'b', meta: 'a' },
  { x: -1.05, z: 1.45, inicial: 'b', meta: 'a' },
  { x: 1.1, z: 1.45, inicial: 'a', meta: 'b' },
];
const luzGema: Nivel = {
  titulo: 'La luz de la gema',
  pistas: [
    'Esa gema está apagada.',
    'Toca los espejos para girarlos: la luz de la lámpara tiene que llegar hasta la gema.',
    'Sigue el rayo desde la lámpara, espejo por espejo, y gira solo los que lo mandan para donde no es.',
  ],
  montar(c) {
    const Y = 0.5;
    const S = { x: -2.0, z: 0.6 };
    const G = { x: 1.1, z: 0.45 };
    const lampara = grupo('lampara');
    lampara.add(en(cilindro(0.12, 0.15, 0.4, mat('#9a918a')), 0, 0.2, 0), en(caja(0.18, 0.16, 0.16, new THREE.MeshStandardMaterial({ color: '#fff3c0', emissive: '#ffd070', emissiveIntensity: 1 }), 0.03), 0, 0.5, 0));
    en(lampara, S.x, 0, S.z);
    c.g.add(lampara);
    const gemaMat = new THREE.MeshStandardMaterial({ color: '#e4577a', emissive: '#e4577a', emissiveIntensity: 0.1, roughness: 0.2, metalness: 0.2, flatShading: true });
    const gema = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), gemaMat);
    gema.name = 'gema';
    en(gema, G.x, Y, G.z);
    c.g.add(gema, en(cilindro(0.1, 0.13, Y - 0.1, mat('#9a918a')), G.x, (Y - 0.1) / 2, G.z));
    const estados = ESPEJOS.map((e) => e.inicial);
    const espejos = ESPEJOS.map((e, i) => {
      const g = grupo(`espejo ${i}`);
      g.add(en(cilindro(0.05, 0.08, 0.33, mat('#5e4636')), 0, 0.165, 0));
      const plato = grupo();
      plato.add(caja(0.3, 0.28, 0.03, mat('#d9b25a', { metal: 0.6, rough: 0.3 }), 0.01), en(caja(0.26, 0.24, 0.005, new THREE.MeshStandardMaterial({ color: '#eef4fa', metalness: 1, roughness: 0.05 }), 0), 0, 0, 0.017));
      en(plato, 0, Y, 0);
      plato.rotation.y = estados[i] === 'a' ? -Math.PI / 4 : Math.PI / 4;
      g.add(plato, en(toque(0.16), 0, Y, 0));
      g.userData.plato = plato;
      en(g, e.x, 0, e.z);
      c.g.add(g);
      return g;
    });
    const rayoMat = new THREE.MeshBasicMaterial({ color: '#ffe38a', transparent: true, opacity: 0.8 });
    const rayos = grupo();
    c.g.add(rayos);
    let hecho = false;
    const trazar = () => {
      rayos.clear();
      let x = S.x, z = S.z;
      let d: Dir2 = [1, 0];
      let llega = false;
      for (let paso = 0; paso < 8; paso++) {
        // Lo primero que hay en esa dirección: un espejo, la gema o la pared
        let mejor = Infinity, que: number | 'gema' | null = null;
        ESPEJOS.forEach((e, i) => {
          const t = d[0] ? (e.x - x) / d[0] : (e.z - z) / d[1];
          const enLinea = d[0] ? Math.abs(e.z - z) < 0.01 : Math.abs(e.x - x) < 0.01;
          if (enLinea && t > 0.01 && t < mejor) [mejor, que] = [t, i];
        });
        const tg = d[0] ? (G.x - x) / d[0] : (G.z - z) / d[1];
        if ((d[0] ? Math.abs(G.z - z) < 0.01 : Math.abs(G.x - x) < 0.01) && tg > 0.01 && tg < mejor) [mejor, que] = [tg, 'gema'];
        if (que === null) mejor = d[0] > 0 ? 3.6 - x : d[0] < 0 ? x + 3.6 : d[1] > 0 ? 2.6 - z : z - 0.1;
        const x1 = x + d[0] * mejor, z1 = z + d[1] * mejor;
        const seg = cilindro(0.018, 0.018, Math.max(0.01, mejor), rayoMat);
        seg.rotation.set(d[1] ? Math.PI / 2 : 0, 0, d[0] ? Math.PI / 2 : 0);
        en(seg, (x + x1) / 2, Y, (z + z1) / 2);
        rayos.add(seg);
        if (que === 'gema') {
          llega = true;
          break;
        }
        if (que === null) break;
        x = x1;
        z = z1;
        d = estados[que] === 'a' ? [d[1], d[0]] : [-d[1], -d[0]];
      }
      gemaMat.emissiveIntensity = llega ? 1.6 : 0.1;
      gema.userData.llega = llega;
      if (llega && !hecho) {
        hecho = true;
        sonido.nota(1568, 0.5, 0, 'sine', 0.08);
        abrirYa(c, 1200);
      }
    };
    trazar();
    espejos.forEach((g, i) =>
      c.tocar(g, () => {
        if (hecho) return;
        estados[i] = estados[i] === 'a' ? 'b' : 'a';
        const r0 = g.userData.plato.rotation.y, r1 = r0 + Math.PI / 2;
        sonido.nota(700, 0.05, 0, 'triangle', 0.05);
        void c.escena.animar(220, (q) => (g.userData.plato.rotation.y = r0 + (r1 - r0) * q)).then(() => {
          g.userData.plato.rotation.y = estados[i] === 'a' ? -Math.PI / 4 : Math.PI / 4;
          trazar();
        });
        g.userData.estado = estados[i];
      }),
    );
    espejos.forEach((g, i) => (g.userData.estado = estados[i]));
    c.cada((_, t) => (gema.rotation.y = t * 0.8));
  },
  async prueba(p) {
    for (let i = 0; i < ESPEJOS.length; i++) {
      const g = p.obj(`espejo ${i}`);
      if (g.userData.estado !== ESPEJOS[i].meta) {
        await p.tocar(g);
        await p.esperar(700);
      }
    }
  },
};

// ---------------------------------------------------------------------------
// 75 · La armadura
// ---------------------------------------------------------------------------
function escudoForma(s = 1) {
  const f = new THREE.Shape();
  f.moveTo(-0.5 * s, 0.5 * s);
  f.lineTo(0.5 * s, 0.5 * s);
  f.lineTo(0.5 * s, 0);
  f.quadraticCurveTo(0.45 * s, -0.4 * s, 0, -0.6 * s);
  f.quadraticCurveTo(-0.45 * s, -0.4 * s, -0.5 * s, 0);
  f.closePath();
  return f;
}

const PIEZAS = [
  { id: 'casco', meta: new THREE.Vector3(2.3, 1.66, 0.9), desde: new THREE.Vector3(1.0, 0.64, 0.9) },
  { id: 'peto', meta: new THREE.Vector3(2.3, 1.2, 0.9), desde: new THREE.Vector3(1.38, 0.66, 0.9) },
  { id: 'escudo', meta: new THREE.Vector3(1.92, 1.1, 0.95), desde: new THREE.Vector3(1.76, 0.68, 0.9) },
  { id: 'espada', meta: new THREE.Vector3(2.68, 1.05, 0.95), desde: new THREE.Vector3(1.4, 0.06, 0.9) },
];
const armadura: Nivel = {
  titulo: 'La armadura',
  pistas: [
    'Ese caballero está en pijama.',
    'Cada pieza tiene su lugar marcado en el soporte.',
    'Arrastra cada pieza a la silueta que le toca: piensa en dónde se pone cada cosa un caballero.',
  ],
  montar(c) {
    const X = 2.3;
    const soporte = grupo('soporte');
    soporte.add(en(cilindro(0.25, 0.28, 0.06, mat('#5e4636')), 0, 0.03, 0), en(cilindro(0.03, 0.03, 1.5, mat('#5e4636')), 0, 0.78, 0));
    const hombros = caja(0.62, 0.05, 0.06, mat('#5e4636'), 0.02);
    en(hombros, 0, 1.45, 0);
    soporte.add(hombros);
    en(soporte, X, 0, 0.8);
    c.g.add(soporte);
    // Siluetas donde van las piezas
    for (const p of PIEZAS) {
      const s = new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), new THREE.MeshBasicMaterial({ color: '#fff3c0', transparent: true, opacity: 0.25, depthWrite: false }));
      en(s, p.meta.x, p.meta.y, p.meta.z - 0.12);
      c.g.add(s);
    }
    // Banca con las piezas
    c.g.add(en(caja(1.2, 0.08, 0.4, mat('#8a6a55'), 0.02), 1.38, 0.48, 0.9));
    for (const x of [0.88, 1.88]) c.g.add(en(caja(0.08, 0.46, 0.34, mat('#6b5a4c'), 0.02), x, 0.23, 0.9));
    const plata = mat('#c9d0d8', { metal: 0.75, rough: 0.3 });
    const modelos: Record<string, () => THREE.Object3D> = {
      casco: () => {
        const g = grupo();
        const cup = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 12, 0, Math.PI * 2, 0, Math.PI / 1.7), plata);
        const visera = caja(0.2, 0.03, 0.02, mat('#3d2b27'), 0.005);
        en(visera, 0, -0.01, 0.13);
        const pluma = esfera(0.06, mat('#b83a52'), undefined, 10);
        pluma.scale.set(0.5, 1.4, 1);
        en(pluma, 0, 0.16, -0.02);
        g.add(cup, visera, pluma);
        return g;
      },
      peto: () => {
        const g = grupo();
        g.add(caja(0.36, 0.42, 0.12, plata, 0.06));
        const cor = corazon(0.12, 0.02, mat('#b83a52'));
        en(cor, 0, 0.04, 0.065);
        g.add(cor);
        return g;
      },
      escudo: () => {
        const g = grupo();
        g.add(forma(escudoForma(0.34), 0.04, mat('#3b5ea8'), undefined, 0.012));
        const cor = corazon(0.1, 0.02, mat('#f2c75c'));
        en(cor, 0, 0.03, 0.035);
        g.add(cor);
        return g;
      },
      espada: () => {
        const g = grupo();
        g.add(en(caja(0.045, 0.5, 0.015, plata, 0.01), 0, 0.12, 0), en(caja(0.2, 0.035, 0.04, mat('#d9b25a', { metal: 0.6 }), 0.01), 0, -0.14, 0), en(cilindro(0.02, 0.02, 0.14, mat('#5e3d28')), 0, -0.23, 0));
        return g;
      },
    };
    let puestas = 0;
    for (const p of PIEZAS) {
      const g = grupo(p.id);
      g.add(modelos[p.id](), toque(0.2));
      if (p.id === 'espada') g.children[0].rotation.z = Math.PI / 2;
      g.position.copy(p.desde);
      c.g.add(g);
      c.arrastrar(g, {
        plano: new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.9),
        limites: limites(0.6, 0.05, 0.9, 3.0, 2.1, 0.9),
        alSoltar: (pos) => {
          if (g.userData.puesta) return;
          const meta = p.meta;
          if (Math.hypot(pos.x - meta.x, pos.y - meta.y) < 0.28) {
            g.userData.puesta = true;
            c.quitarToque(g);
            const a = g.position.clone();
            if (p.id === 'espada') void c.escena.animar(250, (q) => (g.children[0].rotation.z = Math.PI / 2 * (1 - q)));
            void c.escena.animar(250, (q) => g.position.lerpVectors(a, meta, q));
            sonido.nota(880 + puestas * 110, 0.12, 0, 'triangle', 0.07);
            sfx.metal();
            if (++puestas === PIEZAS.length) {
              c.despues(500, () => {
                sonido.nota(523, 0.2, 0, 'square', 0.04);
                sonido.nota(784, 0.4, 0.2, 'square', 0.04);
              });
              abrirYa(c, 1300);
            }
          } else {
            const a = g.position.clone();
            void c.escena.animar(300, (q) => g.position.lerpVectors(a, p.desde, q));
          }
        },
      });
    }
  },
  async prueba(p) {
    for (const pz of PIEZAS) {
      await p.arrastrar(pz.id, pz.meta.clone().setZ(0.9), 16);
      await p.esperarQue(() => !!p.obj(pz.id).userData.puesta, 5000);
      await p.esperar(300);
    }
  },
};

// ---------------------------------------------------------------------------
// 76 · El caballo de ajedrez
// ---------------------------------------------------------------------------
const TAB = { x0: 1.475, y0: 0.575, lado: 0.19, n: 5, z: 0.47 };
const ROTAS = ['1,2', '3,2', '2,2'];
const CAMINO: [number, number][] = [[2, 1], [0, 2], [2, 3], [4, 4]];
const ajedrez: Nivel = {
  titulo: 'El caballo de ajedrez',
  pistas: [
    'Ese caballito quiere llegar a la llave.',
    'Se mueve como el caballo del ajedrez, en L. Las casillas rotas no lo aguantan.',
    'Planea los saltos desde el final hacia atrás: ¿desde qué casillas sanas se llega en L a la de la llave?',
  ],
  montar(c) {
    const { x0, y0, lado, n, z } = TAB;
    const pos = (i: number, j: number) => new THREE.Vector3(x0 + lado / 2 + i * lado, y0 + lado / 2 + j * lado, z);
    const tablero = letrero(lado * n + 0.08, lado * n + 0.08, (cv, w, h) => {
      const m = (w * 0.04) / (lado * n + 0.08);
      cv.fillStyle = '#5e4636';
      cv.fillRect(0, 0, w, h);
      const s = (w - 2 * m * 1.02) / n;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          const x = m + i * s, y = h - m - (j + 1) * s;
          cv.fillStyle = (i + j) % 2 ? '#f3e3c3' : '#8a6a55';
          cv.fillRect(x, y, s, s);
          if (ROTAS.includes(`${i},${j}`)) {
            cv.strokeStyle = '#2b1d16';
            cv.lineWidth = 5;
            cv.beginPath();
            cv.moveTo(x + s * 0.2, y + s * 0.15);
            cv.lineTo(x + s * 0.45, y + s * 0.5);
            cv.lineTo(x + s * 0.3, y + s * 0.85);
            cv.moveTo(x + s * 0.45, y + s * 0.5);
            cv.lineTo(x + s * 0.8, y + s * 0.55);
            cv.stroke();
          }
        }
    }, 'tablero');
    en(tablero, x0 + (lado * n) / 2, y0 + (lado * n) / 2, z - 0.01);
    c.g.add(tablero);
    c.g.add(en(caja(0.06, 1.3, 0.06, mat('#5e4636'), 0.02), x0 + (lado * n) / 2, 0.65, z - 0.12));
    const caballo = grupo('caballo');
    caballo.add(en(cilindro(0.07, 0.08, 0.03, mat('#fff3e0')), 0, -0.06, 0.03));
    const cara = letrero(0.16, 0.16, (cv, w, h) => textoEn(cv, '♞', w / 2, h / 2 + 4, h * 0.9, '#3d2b27', 700), undefined, { transparente: true });
    en(cara, 0, 0.01, 0.05);
    caballo.add(cara);
    let ci = 0, cj = 0;
    caballo.position.copy(pos(0, 0));
    caballo.position.z += 0.02;
    c.g.add(caballo);
    const k = llave('llave', '#f2c75c', false);
    k.scale.setScalar(0.8);
    en(k, pos(4, 4).x, pos(4, 4).y, z + 0.04);
    c.g.add(k);
    let saltando = false, hecho = false;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const cas = new THREE.Mesh(new THREE.PlaneGeometry(lado * 0.96, lado * 0.96), new THREE.MeshBasicMaterial({ visible: false }));
        cas.name = `casilla ${i} ${j}`;
        cas.position.copy(pos(i, j)).setZ(z + 0.06);
        c.g.add(cas);
        c.tocar(cas, () => {
          if (saltando || hecho) return;
          const dx = Math.abs(i - ci), dy = Math.abs(j - cj);
          if (!((dx === 1 && dy === 2) || (dx === 2 && dy === 1))) return sonido.nota(200, 0.05, 0, 'sine', 0.03);
          if (ROTAS.includes(`${i},${j}`)) {
            sonido.nota(140, 0.2, 0, 'square', 0.04);
            c.escena.temblar(0.01, 200);
            c.mal();
            return;
          }
          saltando = true;
          const a = caballo.position.clone(), b = pos(i, j).setZ(z + 0.02);
          sonido.nota(660, 0.06, 0, 'triangle', 0.05);
          void c.escena.animar(320, (q) => {
            caballo.position.lerpVectors(a, b, q);
            caballo.position.z += Math.sin(q * Math.PI) * 0.12;
          }).then(() => {
            ci = i;
            cj = j;
            saltando = false;
            caballo.userData.en = `${i},${j}`;
            if (i === 4 && j === 4) {
              hecho = true;
              c.dar('llave', k);
              c.bien();
            }
          });
        });
      }
    c.conLlave();
  },
  async prueba(p) {
    for (const [i, j] of CAMINO) {
      await p.tocar(`casilla ${i} ${j}`);
      await p.esperarQue(() => p.obj('caballo').userData.en === `${i},${j}`, 5000);
    }
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 77 · El escudo distinto
// ---------------------------------------------------------------------------
const escudos: Nivel = {
  titulo: 'El escudo distinto',
  pistas: [
    'Algo no cuadra en esa pared.',
    'Los ocho escudos parecen iguales. Mira bien dónde está cada cosa.',
    'Compara dónde está el corazón y dónde la estrella en cada escudo: uno los tiene en otro lugar.',
  ],
  montar(c) {
    c.g.add(en(caja(2.4, 0.06, 0.1, mat('#5e4636'), 0.02), 1.88, 1.56, 0.25), en(caja(2.4, 0.06, 0.1, mat('#5e4636'), 0.02), 1.88, 1.02, 0.25));
    const distinto = Math.floor(c.azar() * 8);
    const pintar = (espejo: boolean) => (cv: CanvasRenderingContext2D, w: number, h: number) => {
      cv.save();
      cv.beginPath();
      cv.moveTo(w * 0.06, h * 0.05);
      cv.lineTo(w * 0.94, h * 0.05);
      cv.lineTo(w * 0.94, h * 0.5);
      cv.quadraticCurveTo(w * 0.88, h * 0.85, w * 0.5, h * 0.97);
      cv.quadraticCurveTo(w * 0.12, h * 0.85, w * 0.06, h * 0.5);
      cv.closePath();
      cv.fillStyle = '#3b5ea8';
      cv.fill();
      cv.lineWidth = w * 0.05;
      cv.strokeStyle = '#f2c75c';
      cv.stroke();
      cv.clip();
      cv.fillStyle = '#b83a52';
      cv.beginPath();
      cv.moveTo(0, h * 0.62);
      cv.lineTo(w * 0.5, h * 0.4);
      cv.lineTo(w, h * 0.62);
      cv.lineTo(w, h * 0.74);
      cv.lineTo(w * 0.5, h * 0.52);
      cv.lineTo(0, h * 0.74);
      cv.fill();
      cv.restore();
      const [xc, xe] = espejo ? [0.7, 0.3] : [0.3, 0.7];
      textoEn(cv, '♥', w * xc, h * 0.24, h * 0.2, '#f2c75c', 700);
      textoEn(cv, '★', w * xe, h * 0.8, h * 0.13, '#f2c75c', 700);
    };
    const lista = Array.from({ length: 8 }, (_, i) => {
      const g = grupo(`escudo ${i}`);
      const e = letrero(0.4, 0.48, pintar(i === distinto), undefined, { transparente: true });
      g.add(e, en(toque(0.22), 0, 0, 0.02));
      en(g, 1.05 + (i % 4) * 0.55, i < 4 ? 1.3 : 0.76, 0.32);
      g.userData.distinto = i === distinto;
      c.g.add(g);
      return g;
    });
    const k = llave('llave', '#f2c75c', false);
    k.scale.setScalar(0.9);
    const e0 = lista[distinto];
    en(k, e0.position.x, e0.position.y, 0.28);
    c.g.add(k);
    let hecho = false;
    for (const g of lista) {
      c.tocar(g, () => {
        if (hecho) return;
        if (g.userData.distinto) {
          hecho = true;
          sonido.nota(988, 0.15, 0, 'triangle', 0.07);
          c.quitarToque(g);
          const y0 = g.position.y;
          void c.escena.animar(600, (q) => {
            g.rotation.x = -q * 1.2;
            g.position.y = y0 - q * 0.25;
            g.position.z = 0.32 + q * 0.2;
          });
          c.bien();
        } else {
          sonido.nota(220, 0.1, 0, 'square', 0.04);
          void c.escena.animar(400, (q) => (g.rotation.z = Math.sin(q * Math.PI * 4) * 0.15 * (1 - q)));
          c.mal();
        }
      });
    }
    llaveParaLaPuerta(c, k, () => hecho);
  },
  async prueba(p) {
    const lista = Array.from({ length: 8 }, (_, i) => p.obj(`escudo ${i}`));
    await p.tocar(lista.find((g) => g.userData.distinto)!);
    await p.esperar(1500);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 78 · La poción
// ---------------------------------------------------------------------------
const RYB: Record<string, [number, number, number]> = {
  '000': [1, 1, 1], '100': [1, 0, 0], '010': [1, 1, 0], '001': [0.163, 0.373, 0.6],
  '110': [1, 0.5, 0], '101': [0.5, 0, 0.5], '011': [0, 0.66, 0.2], '111': [0.2, 0.094, 0],
};
/** Color de mezclar pintura roja, amarilla y azul (interpolación RYB). */
function mezcla(r: number, y: number, b: number) {
  const m = Math.max(r, y, b, 1);
  const [R, Y, B] = [r / m, y / m, b / m];
  const out = [0, 0, 0];
  for (const k of Object.keys(RYB)) {
    const w = (k[0] === '1' ? R : 1 - R) * (k[1] === '1' ? Y : 1 - Y) * (k[2] === '1' ? B : 1 - B);
    RYB[k].forEach((v, i) => (out[i] += v * w));
  }
  return new THREE.Color(out[0], out[1], out[2]);
}
const RECETA = { rojo: 1, amarillo: 0, azul: 2 };
const pocion: Nivel = {
  titulo: 'La poción',
  pistas: [
    'Esa olla está esperando una receta.',
    'El pergamino muestra el color de la poción y cuántas gotas lleva. Tocar la olla la vacía.',
    'Mezcla los colores de los frascos como mezclarías pinturas hasta llegar al color del pergamino, con el número justo de gotas.',
  ],
  montar(c) {
    const T = new THREE.Vector3(1.5, 0, 0.9);
    c.g.add(en(caja(1.5, 0.08, 0.6, mat('#6b5a4c'), 0.02), T.x, 0.74, T.z));
    for (const s of [-1, 1]) c.g.add(en(caja(0.08, 0.72, 0.5, mat('#5e4636'), 0.02), T.x + s * 0.65, 0.36, T.z));
    const perfil = [new THREE.Vector2(0.001, 0), new THREE.Vector2(0.16, 0.02), new THREE.Vector2(0.21, 0.12), new THREE.Vector2(0.19, 0.24), new THREE.Vector2(0.2, 0.26)];
    const olla = grupo('olla');
    olla.add(new THREE.Mesh(new THREE.LatheGeometry(perfil, 28), mat('#2b2a2a', { metal: 0.4, rough: 0.5, lados: THREE.DoubleSide })));
    const liquidoMat = new THREE.MeshStandardMaterial({ color: '#8a8078', roughness: 0.3, emissive: '#000000' });
    const liquido = new THREE.Mesh(new THREE.CircleGeometry(0.18, 28), liquidoMat);
    liquido.rotation.x = -Math.PI / 2;
    en(liquido, 0, 0.2, 0);
    liquido.visible = false;
    olla.add(liquido, en(toque(0.22), 0, 0.15, 0));
    en(olla, T.x, 0.78, T.z);
    c.g.add(olla);
    const colores: Record<string, string> = { rojo: '#e4574b', amarillo: '#F7C948', azul: '#3f6fd8' };
    const frascos = (['rojo', 'amarillo', 'azul'] as const).map((col, i) => {
      const f = grupo(`frasco ${col}`);
      const vidrio = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), new THREE.MeshStandardMaterial({ color: colores[col], roughness: 0.15, transparent: true, opacity: 0.85 }));
      en(vidrio, 0, 0.08, 0);
      f.add(vidrio, en(cilindro(0.025, 0.03, 0.08, new THREE.MeshStandardMaterial({ color: colores[col], transparent: true, opacity: 0.85 })), 0, 0.19, 0), en(cilindro(0.028, 0.028, 0.03, mat('#8a6a55')), 0, 0.24, 0), en(toque(0.14), 0, 0.12, 0));
      en(f, [T.x - 0.55, T.x - 0.33, T.x + 0.45][i], 0.78, T.z + 0.08);
      f.userData.color = col;
      c.g.add(f);
      return f;
    });
    const objetivo = mezcla(RECETA.rojo, RECETA.amarillo, RECETA.azul);
    const receta = pergamino(0.62, 0.62, (cv, w, h) => {
      textoEn(cv, 'POCIÓN DE LA REJA', w / 2, h * 0.14, h * 0.08, '#5e3d28', 700);
      cv.fillStyle = `#${objetivo.getHexString()}`;
      cv.beginPath();
      cv.arc(w / 2, h * 0.47, w * 0.2, 0, Math.PI * 2);
      cv.fill();
      cv.strokeStyle = '#5e3d28';
      cv.lineWidth = 6;
      cv.stroke();
      textoEn(cv, 'tres gotas', w / 2, h * 0.82, h * 0.09, '#5e3d28', 700);
    }, 'receta');
    en(receta, 2.65, 1.3, 0.03);
    c.g.add(receta);
    const cuenta = { rojo: 0, amarillo: 0, azul: 0 };
    let hecho = false, ocupado = false;
    const k = llave('llave', '#f2c75c', false);
    en(k, T.x, 0.95, T.z);
    k.visible = false;
    c.g.add(k);
    const pintar = () => {
      const total = cuenta.rojo + cuenta.amarillo + cuenta.azul;
      liquido.visible = total > 0;
      liquidoMat.color.copy(mezcla(cuenta.rojo, cuenta.amarillo, cuenta.azul));
      olla.userData.cuenta = { ...cuenta };
    };
    const vaciar = () => {
      cuenta.rojo = cuenta.amarillo = cuenta.azul = 0;
      pintar();
    };
    for (const f of frascos) {
      c.tocar(f, () => {
        if (hecho || ocupado) return;
        ocupado = olla.userData.ocupado = true;
        const a = f.position.clone(), b = new THREE.Vector3(T.x + (a.x < T.x ? -0.12 : 0.12), 1.12, T.z);
        void c.escena.animar(260, (q) => {
          f.position.lerpVectors(a, b, q);
          f.rotation.z = (a.x < T.x ? -1 : 1) * q * 1.6;
        }).then(async () => {
          sonido.nota(1200, 0.05, 0, 'sine', 0.05);
          sonido.nota(900, 0.05, 0.08, 'sine', 0.04);
          cuenta[f.userData.color as keyof typeof cuenta]++;
          pintar();
          await c.escena.animar(260, (q) => {
            f.position.lerpVectors(b, a, q);
            f.rotation.z = (a.x < T.x ? -1 : 1) * (1 - q) * 1.6;
          });
          ocupado = olla.userData.ocupado = false;
          const total = cuenta.rojo + cuenta.amarillo + cuenta.azul;
          if (total < 3) return;
          if (cuenta.rojo === RECETA.rojo && cuenta.amarillo === RECETA.amarillo && cuenta.azul === RECETA.azul) {
            hecho = true;
            liquidoMat.emissive.copy(objetivo);
            liquidoMat.emissiveIntensity = 0.6;
            sonido.nota(1318, 0.3, 0, 'sine', 0.08);
            k.visible = true;
            void c.escena.animar(900, (q) => k.position.set(T.x, 0.95 + q * 0.3, T.z + q * 0.15));
            c.bien();
          } else {
            sonido.rumor(0.4, 400, 0.1);
            c.escena.temblar(0.01, 200);
            c.mal();
            c.despues(500, vaciar);
          }
        });
      });
    }
    c.tocar(olla, () => {
      if (hecho || ocupado) return;
      sonido.rumor(0.3, 500, 0.06);
      vaciar();
    });
    llaveParaLaPuerta(c, k, () => hecho);
  },
  async prueba(p) {
    const olla = p.obj('olla');
    const echar = async (col: string, n: number) => {
      for (let i = 0; i < n; i++) {
        const antes = (olla.userData.cuenta?.[col] as number) ?? 0;
        await p.tocar(`frasco ${col}`);
        await p.esperarQue(() => ((olla.userData.cuenta?.[col] as number) ?? 0) > antes, 8000);
        await p.esperarQue(() => !olla.userData.ocupado, 8000);
        await p.esperar(300);
      }
    };
    await echar('rojo', RECETA.rojo);
    await echar('azul', RECETA.azul);
    await p.esperarQue(() => p.obj('llave').visible, 8000);
    await p.esperar(1200);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 79 · El criptex
// ---------------------------------------------------------------------------
const PALABRA_CRIPTEX = 'REINA';
const criptex: Nivel = {
  titulo: 'El criptex',
  pistas: [
    'Ese cilindro de letras guarda algo.',
    'El pergamino hace una pregunta; la respuesta tiene tantas letras como anillos tiene el criptex.',
    'Piensa quién manda en este castillo (y en un corazón) y gira los anillos hasta escribirlo.',
  ],
  montar(c) {
    const P = new THREE.Vector3(1.6, 0, 0.95);
    c.g.add(en(cilindro(0.2, 0.26, 0.9, mat('#9a918a')), P.x, 0.45, P.z), en(cilindro(0.26, 0.26, 0.06, mat('#8a8078')), P.x, 0.92, P.z));
    const cx = grupo('criptex');
    const cuerpo = cilindro(0.07, 0.07, 0.5, mat('#b98a5e'));
    cuerpo.rotation.z = Math.PI / 2;
    cx.add(cuerpo);
    for (let i = 0; i < 5; i++) {
      const anillo = cilindro(0.08, 0.08, 0.07, mat(i % 2 ? '#d9b25a' : '#c9a24a', { metal: 0.5, rough: 0.35 }));
      anillo.rotation.z = Math.PI / 2;
      en(anillo, -0.16 + i * 0.08, 0, 0);
      cx.add(anillo);
    }
    const tapas = [-1, 1].map((s) => {
      const t = cilindro(0.085, 0.085, 0.05, mat('#6b4a33'));
      t.rotation.z = Math.PI / 2;
      en(t, s * 0.26, 0, 0);
      cx.add(t);
      return t;
    });
    cx.add(toque(0.3));
    en(cx, P.x, 1.03, P.z);
    c.g.add(cx);
    const nota = pergamino(0.7, 0.5, (cv, w, h) => {
      textoEn(cv, '¿Quién manda', w / 2, h * 0.3, h * 0.13, '#5e3d28', 700);
      textoEn(cv, 'en este castillo…', w / 2, h * 0.5, h * 0.13, '#5e3d28', 700);
      textoEn(cv, '…y en mi corazón?', w / 2, h * 0.72, h * 0.13, '#b83a52', 700);
    }, 'pregunta');
    en(nota, 2.6, 1.3, 0.03);
    c.g.add(nota);
    const k = llave('llave', '#f2c75c', false);
    k.scale.setScalar(0.8);
    en(k, P.x, 1.03, P.z);
    k.visible = false;
    c.g.add(k);
    const letras = 'ABCDEFGHIJKLMNOPRSTUVZ';
    const ruedas = PALABRA_CRIPTEX.split('').map((l, i) => {
      const otras = letras.split('').filter((x) => x !== l);
      const r = [l];
      while (r.length < 8) r.push(otras[Math.floor(c.azar() * otras.length)]);
      const uniq = [...new Set(r)];
      // La correcta no queda de primera
      const rot = 1 + (i % (uniq.length - 1));
      return [...uniq.slice(rot), ...uniq.slice(0, rot)];
    });
    let hecho = false;
    c.tocar(cx, async () => {
      if (hecho) return;
      await c.enfocar(cx, 1.0);
      const ok = await c.ui.ruedas({ titulo: 'Criptex', ruedas, correcto: PALABRA_CRIPTEX.split(''), estilo: 'criptex' });
      if (!ok) return c.volver();
      hecho = true;
      sonido.nota(784, 0.2, 0, 'triangle', 0.07);
      await c.escena.animar(500, (q) => tapas.forEach((t, i) => (t.position.x = (i ? 1 : -1) * (0.26 + q * 0.12))));
      k.visible = true;
      await c.escena.animar(400, (q) => k.position.set(P.x, 1.03 + q * 0.18, P.z + q * 0.1));
      c.dar('llave', k);
      await c.volver();
    });
    c.conLlave();
  },
  async prueba(p) {
    await p.tocar('criptex');
    await p.panel(PALABRA_CRIPTEX);
    await p.esperar(2500);
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 80 · La trenza de la torre
// ---------------------------------------------------------------------------
const LARGO_TRENZA = 1.65;
const trenza: Nivel = {
  titulo: 'La trenza de la torre',
  pistas: [
    'La ventana de la torre está muy alta.',
    'Algo largo está enrollado en la ventana. Se puede soltar con el dedo.',
    'Desliza el dedo hacia abajo sobre la torre, varias veces, hasta que lo que cuelga toque el piso.',
  ],
  montar(c) {
    const Tx = 2.25, Tz = 0.55, R = 0.5;
    const tex = piedraTextura('#c1b8ae', 512, 512, 10);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    const torre = new THREE.Mesh(new THREE.CylinderGeometry(R, R + 0.03, 3.2, 28), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
    en(torre, Tx, 1.6, Tz);
    c.g.add(torre);
    const V = new THREE.Vector3(Tx - 0.12, 2.15, Tz + R - 0.02);
    const hueco = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.46), mat('#2b2346'));
    en(hueco, V.x, V.y, V.z + 0.01);
    hueco.lookAt(new THREE.Vector3(0, 1.5, 4.3));
    c.g.add(hueco);
    for (const s of [-1, 1]) {
      const cortina = caja(0.08, 0.46, 0.03, mat('#F59FC0'), 0.02);
      en(cortina, V.x + s * 0.15, V.y, V.z + 0.04);
      c.g.add(cortina);
    }
    const rollo = toro(0.1, 0.04, mat('#1e1a18'));
    en(rollo, V.x, V.y - 0.2, V.z + 0.08);
    c.g.add(rollo);
    const pelo = mat('#1e1a18', { rough: 0.7 });
    const nudos = Array.from({ length: 26 }, (_, i) => {
      const n = esfera(0.045, pelo, undefined, 8);
      n.scale.set(1, 1.35, 0.9);
      n.rotation.z = i % 2 ? 0.35 : -0.35;
      c.g.add(n);
      return n;
    });
    const lazo = grupo();
    lazo.add(en(esfera(0.04, mat('#e4574b'), undefined, 8), -0.04, 0, 0), en(esfera(0.04, mat('#e4574b'), undefined, 8), 0.04, 0, 0));
    c.g.add(lazo);
    const k = llave('llave', '#f2c75c', false);
    k.scale.setScalar(0.85);
    c.g.add(k);
    const area = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.0, 0.3), new THREE.MeshBasicMaterial({ visible: false }));
    area.name = 'trenza';
    en(area, V.x, 1.15, V.z + 0.2);
    c.g.add(area);
    let largo = 0.15, meta = 0.15, hecho = false;
    const trenzaInfo = grupo('trenza info');
    c.g.add(trenzaInfo);
    c.cada((dt, t) => {
      largo += (meta - largo) * Math.min(1, dt * 5);
      const n = nudos.length;
      nudos.forEach((nd, i) => {
        const f = i / (n - 1);
        const y = V.y - 0.25 - f * largo;
        nd.visible = f * largo <= largo + 0.001;
        nd.position.set(V.x + Math.sin(t * 1.2 + f * 2) * 0.03 * f, y, V.z + 0.1);
        nd.scale.y = 1.35 * Math.max(0.3, largo / LARGO_TRENZA) + 0.3;
      });
      const punta = new THREE.Vector3(V.x + Math.sin(t * 1.2 + 2) * 0.03, V.y - 0.3 - largo, V.z + 0.1);
      lazo.position.copy(punta).add(new THREE.Vector3(0, 0.03, 0.02));
      k.position.copy(punta).add(new THREE.Vector3(0, -0.12, 0.02));
      k.visible = largo > 0.6;
      rollo.scale.setScalar(Math.max(0.2, 1 - largo / LARGO_TRENZA));
      trenzaInfo.userData.largo = largo;
    });
    c.tocar(area, () => sonido.nota(500, 0.04, 0, 'sine', 0.03));
    c.gesto.deslizar((dir, _v, obj) => {
      if (hecho || dir !== 'abajo' || obj !== area) return;
      meta = Math.min(LARGO_TRENZA, meta + 0.3);
      sonido.rumor(0.25, 1200, 0.04);
      if (meta >= LARGO_TRENZA) {
        hecho = true;
        trenzaInfo.userData.lista = true;
        c.quitarToque(area);
        c.bien();
      }
    });
    llaveParaLaPuerta(c, k, () => hecho);
  },
  async prueba(p) {
    const info = p.obj('trenza info');
    for (let i = 0; i < 10 && !info.userData.lista; i++) {
      await p.deslizar('abajo', 'trenza', 180);
      await p.esperar(300);
    }
    await p.esperarQue(() => (info.userData.largo as number) > LARGO_TRENZA - 0.1, 15000);
    await p.esperar(600);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

export const CAP8: Nivel[] = [cadenas, dragon, velas, luzGema, armadura, ajedrez, escudos, pocion, criptex, trenza];

// (para que el empaquetador no se queje de piezas sin usar en algunos acertijos)
void matNuevo;
