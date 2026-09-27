// Capítulo 2 · El jardín (puertas 11–20): verter inclinando, colores, reflejos, sacudir y contar, soplar,
// paciencia, secuencias, arrastrar el sol, barrer hojas y limpiar el vidrio.
import * as THREE from 'three';
import * as sonido from '../../sonido';
import { caja, cilindro, en, esfera, grupo, letrero, mat, matNuevo, textoEn, toro } from '../kit';
import type { Ctx, Nivel } from '../nivel';
import { borrable, candadoPuerta, Chorro, florecita, limites, llave, tecladoPared } from './piezas';

function llaveParaLaPuerta(c: Ctx, k: THREE.Object3D) {
  c.tocar(k, () => c.dar('llave', k));
  c.conLlave();
}

/** Letrero de madera en un palito clavado en el pasto. */
function letreroPalo(nombre: string, x: number, z: number, w: number, h: number, pintar: (cx: CanvasRenderingContext2D, W: number, H: number) => void) {
  const g = grupo(nombre);
  g.add(en(cilindro(0.03, 0.035, 1.1, mat('#8e5b3c')), 0, 0.55, 0));
  const tabla = caja(w + 0.06, h + 0.06, 0.04, mat('#c49468'), 0.02);
  en(tabla, 0, 1.1 + h / 2, 0);
  const cara = letrero(w, h, pintar);
  en(cara, 0, 1.1 + h / 2, 0.022);
  g.add(tabla, cara);
  en(g, x, 0, z);
  return g;
}

// ---------------------------------------------------------------------------
// 11 · La semilla tiene sed
// ---------------------------------------------------------------------------
const regadera: Nivel = {
  titulo: 'La semilla tiene sed',
  pistas: ['La regadera está llena… pero no se inclina sola.', 'Gira el celular hacia la izquierda (como un timón) para que la regadera eche agua en la matera.'],
  montar(c) {
    const matera = grupo('matera');
    matera.add(en(cilindro(0.24, 0.18, 0.32, mat('#d9824f')), 0, 0.16, 0), en(cilindro(0.22, 0.22, 0.02, mat('#6b4a33')), 0, 0.31, 0));
    en(matera, 1.05, 0, 1.15);
    c.g.add(matera);
    // Poste con brazo y la regadera colgando
    c.g.add(en(caja(0.08, 1.75, 0.08, mat('#8e5b3c'), 0.02), 1.95, 0.875, 1.15), en(caja(0.7, 0.07, 0.07, mat('#8e5b3c'), 0.02), 1.62, 1.72, 1.15));
    const piv = grupo('regadera');
    en(piv, 1.4, 1.62, 1.15);
    const cuerpo = cilindro(0.16, 0.18, 0.26, mat('#8EC5F0', { metal: 0.3, rough: 0.35 }));
    en(cuerpo, 0, -0.22, 0);
    const pico = cilindro(0.02, 0.035, 0.34, mat('#8EC5F0', { metal: 0.3, rough: 0.35 }));
    pico.rotation.z = Math.PI / 2 - 0.5;
    en(pico, -0.26, -0.16, 0);
    const flor = cilindro(0.05, 0.02, 0.04, mat('#6fa9d6'));
    flor.rotation.z = Math.PI / 2 - 0.5;
    en(flor, -0.41, -0.07, 0);
    const asa = toro(0.1, 0.018, mat('#6fa9d6'), undefined, Math.PI);
    en(asa, 0, -0.08, 0);
    piv.add(cuerpo, pico, flor, asa);
    c.g.add(piv);
    const chorro = new Chorro(c.g);
    // La matica que crece con la llave en la flor
    const mata = grupo('mata');
    const f = florecita('#F59FC0', 'flor', 0.55);
    mata.add(f);
    const k = llave('llave', '#f2c75c', false);
    k.scale.setScalar(0.7);
    en(k, 0, 0.62, 0.08);
    mata.add(k);
    en(mata, 1.05, 0.3, 1.15);
    mata.scale.setScalar(0.05);
    c.g.add(mata);
    let agua = 0, crecida = false, apretado = false, cada = 0;
    const pico0 = new THREE.Vector3();
    c.cada((dt) => {
      const s = c.sensores;
      const ang = Math.atan2(s.inclinacion.x, Math.max(0.2, s.inclinacion.y));
      const meta = apretado ? 0.85 : THREE.MathUtils.clamp(-ang * 1.3, -0.3, 1.0);
      piv.rotation.z += (meta - piv.rotation.z) * Math.min(1, dt * 6);
      cada -= dt;
      if (piv.rotation.z > 0.45 && cada <= 0 && !crecida) {
        cada = 0.05;
        flor.getWorldPosition(pico0);
        chorro.soltar(pico0, new THREE.Vector3(-0.4, -0.2, (Math.random() - 0.5) * 0.1));
        if (Math.random() < 0.2) sonido.rumor(0.1, 2400, 0.02);
      }
      chorro.paso(dt, 0.3);
      // Cuenta el agua que cae sobre la matera
      if (piv.rotation.z > 0.45 && !crecida) {
        flor.getWorldPosition(pico0);
        if (Math.abs(pico0.x - 1.05) < 0.45) agua += dt;
      }
      if (!crecida && agua > 2.2) {
        crecida = true;
        c.bien();
        sonido.regalo();
        void c.escena.animar(1400, (t) => mata.scale.setScalar(0.05 + t * 0.95));
        llaveParaLaPuerta(c, k);
        mata.userData.crecida = true;
      }
    });
    c.despues(3000, () => {
      if (c.sensores.hayMovimiento || crecida) return;
      c.aviso('Este celular no avisa cuando se gira: mantén presionada la regadera.', 3500);
      c.mantener(piv, () => (apretado = true), () => (apretado = false));
    });
  },
  async prueba(p) {
    p.sensor.inclinar(-0.75, 0.66);
    await p.esperarQue(() => !!p.obj('mata').userData.crecida, 120000);
    p.sensor.soltar();
    await p.esperar(1500);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 12 · Las flores de la mariposa
// ---------------------------------------------------------------------------
const PALETA = ['#F59FC0', '#F7C948', '#ffffff', '#c9b6ea', '#e4574b'];
const META_FLORES = [3, 0, 4, 1, 2];
const mariposa: Nivel = {
  titulo: 'Las flores de la mariposa',
  pistas: ['La mariposa tiene cinco manchas en las alas… y hay cinco flores.', 'Toca cada flor para cambiarle el color hasta que queden como las manchas de la mariposa, de izquierda a derecha.'],
  montar(c) {
    const m = grupo('mariposa');
    const ala = (lado: number) => {
      const a = letrero(0.62, 0.7, (cx, w, h) => {
        cx.fillStyle = '#F6A93B';
        cx.beginPath();
        cx.ellipse(w / 2, h * 0.38, w * 0.46, h * 0.36, 0, 0, Math.PI * 2);
        cx.ellipse(w / 2, h * 0.78, w * 0.32, h * 0.2, 0, 0, Math.PI * 2);
        cx.fill();
        cx.strokeStyle = '#3d2b27';
        cx.lineWidth = 10;
        cx.stroke();
      }, undefined, { transparente: true });
      en(a, lado * 0.33, 0, 0);
      a.scale.x = lado;
      return a;
    };
    m.add(ala(-1), ala(1));
    m.add(en(caja(0.08, 0.6, 0.08, mat('#3d2b27'), 0.04), 0, -0.02, 0.02));
    // Las cinco manchas de izquierda a derecha
    META_FLORES.forEach((ci, i) => m.add(en(cilindro(0.055, 0.055, 0.02, mat(PALETA[ci]), undefined, 20), -0.52 + i * 0.26, 0.08, 0.03)));
    for (const g of m.children.slice(-5)) g.rotation.x = Math.PI / 2;
    en(m, -1.35, 2.05, 0.5);
    m.scale.setScalar(1.5);
    c.g.add(m);
    c.cada((_, t) => {
      m.children[0].scale.x = -1 * (0.85 + Math.sin(t * 5) * 0.15);
      m.children[1].scale.x = 0.85 + Math.sin(t * 5) * 0.15;
    });
    const actual = [0, 1, 2, 3, 4];
    let hecho = false;
    actual.forEach((ci, i) => {
      const f = florecita(PALETA[ci], `flor ${i}`, 0.55);
      f.scale.setScalar(1.4);
      en(f, 0.55 + i * 0.5, 0, 1.25);
      f.userData.idx = ci;
      c.g.add(f);
      c.tocar(f, () => {
        if (hecho) return;
        f.userData.idx = (f.userData.idx + 1) % PALETA.length;
        (f.userData.petalos as THREE.MeshStandardMaterial).color.set(PALETA[f.userData.idx]);
        sonido.nota(700 + i * 90, 0.06, 0, 'triangle', 0.05);
        void c.escena.animar(200, (k) => f.scale.setScalar(1.4 + Math.sin(k * Math.PI) * 0.12));
        actual[i] = f.userData.idx;
        if (actual.every((v, j) => v === META_FLORES[j])) {
          hecho = true;
          c.bien();
          const x0 = m.position.clone();
          void c.escena.animar(1500, (k) => m.position.set(x0.x + (0 - x0.x) * k, x0.y + Math.sin(k * Math.PI) * 0.4, x0.z + k * 0.2)).then(() => {
            c.puerta.bloqueada = false;
            c.resolver();
          });
        }
      });
    });
  },
  async prueba(p) {
    for (let i = 0; i < 5; i++) {
      const f = p.obj(`flor ${i}`);
      for (let k = 0; k < 6 && f.userData.idx !== META_FLORES[i]; k++) await p.tocar(f);
    }
  },
};

// ---------------------------------------------------------------------------
// 13 · Los topos
// ---------------------------------------------------------------------------
const topos: Nivel = {
  titulo: 'Los topos',
  pistas: ['Los topos salen un momento y se esconden. Hay que ser rápido.', 'Toca seis topos cuando se asomen; después sale el que tiene la llave en la boca.'],
  montar(c) {
    const huecos: { x: number; z: number; topo: THREE.Object3D; arriba: number; estado: 'abajo' | 'subiendo' | 'arriba' | 'bajando'; llave?: boolean }[] = [];
    const cartel = letrero(0.5, 0.3, () => {}, 'cartel topos');
    const pintarCartel = (n: number) => {
      const t = (cartel.material as THREE.MeshStandardMaterial).map as THREE.CanvasTexture;
      const cx = (t.image as HTMLCanvasElement).getContext('2d')!;
      cx.fillStyle = '#c49468';
      cx.fillRect(0, 0, cx.canvas.width, cx.canvas.height);
      textoEn(cx, `${Math.min(n, 6)} / 6`, cx.canvas.width / 2, cx.canvas.height / 2, cx.canvas.height * 0.5, '#3d2b27', 700);
      t.needsUpdate = true;
    };
    pintarCartel(0);
    const poste = cilindro(0.03, 0.03, 1.0, mat('#8e5b3c'));
    en(poste, -1.2, 0.5, 0.5);
    en(cartel, -1.2, 1.1, 0.52);
    c.g.add(poste, cartel);
    let golpes = 0;
    for (const [i, [x, z]] of ([[0.55, 0.8], [1.45, 0.8], [2.35, 0.8], [0.75, 1.4], [1.65, 1.4], [2.55, 1.4]] as [number, number][]).entries()) {
      const hoyo = cilindro(0.2, 0.2, 0.01, mat('#3a2a20'), undefined, 20);
      hoyo.scale.z = 0.7;
      en(hoyo, x, 0.012, z);
      const tierra = toro(0.2, 0.05, mat('#8a5e40', { rough: 1 }));
      tierra.rotation.x = Math.PI / 2;
      tierra.scale.y = 0.7;
      en(tierra, x, 0.02, z);
      const topo = grupo(`topo ${i}`);
      topo.add(en(esfera(0.16, mat('#8a6a55')), 0, 0, 0));
      (topo.children[0] as THREE.Mesh).scale.set(1, 1.2, 0.9);
      topo.add(en(esfera(0.035, mat('#f4b6c2')), 0, 0.02, 0.15), en(esfera(0.02, mat('#1e1a18')), -0.05, 0.08, 0.13), en(esfera(0.02, mat('#1e1a18')), 0.05, 0.08, 0.13));
      const k = llave(`llave topo ${i}`, '#f2c75c', false);
      k.scale.setScalar(0.7);
      k.rotation.z = 0.2;
      en(k, 0.05, -0.04, 0.17);
      k.visible = false;
      topo.add(k);
      const toque = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
      topo.add(toque);
      en(topo, x, -0.3, z);
      c.g.add(hoyo, tierra, topo);
      const h = { x, z, topo, arriba: 0, estado: 'abajo' as const, llave: false } as (typeof huecos)[number];
      huecos.push(h);
      c.tocar(topo, () => {
        if (h.estado !== 'arriba' && h.estado !== 'subiendo') return;
        if (h.llave) {
          c.dar('llave', k);
          h.estado = 'bajando';
          c.conLlave();
          return;
        }
        golpes++;
        pintarCartel(golpes);
        sonido.nota(220, 0.12, 0, 'square', 0.06, 110);
        topo.scale.set(1.2, 0.6, 1.2);
        h.estado = 'bajando';
        c.bien();
      });
    }
    let espera = 1;
    let conLlaveFuera = false;
    c.cada((dt) => {
      espera -= dt;
      if (espera <= 0 && !conLlaveFuera) {
        espera = golpes >= 6 ? 99 : 0.7 + Math.random() * 0.6;
        const libres = huecos.filter((h) => h.estado === 'abajo');
        if (libres.length) {
          const h = libres[Math.floor(Math.random() * libres.length)];
          h.estado = 'subiendo';
          h.arriba = golpes >= 6 ? 9999 : 1.25;
          if (golpes >= 6) {
            h.llave = true;
            conLlaveFuera = true;
            (h.topo.children.find((o) => o.name.startsWith('llave')) as THREE.Object3D).visible = true;
          }
        }
      }
      for (const h of huecos) {
        const t = h.topo;
        if (h.estado === 'subiendo') {
          t.position.y = Math.min(0.1, t.position.y + dt * 2.2);
          if (t.position.y >= 0.1) h.estado = 'arriba';
        } else if (h.estado === 'arriba') {
          h.arriba -= dt;
          if (h.arriba <= 0) h.estado = 'bajando';
        } else if (h.estado === 'bajando') {
          t.position.y -= dt * 1.6;
          if (t.position.y <= -0.3) {
            t.position.y = -0.3;
            t.scale.set(1, 1, 1);
            h.estado = 'abajo';
          }
        }
      }
    });
  },
  async prueba(p) {
    const tengo = () => !!document.querySelector('#inventario [data-item="llave"]');
    for (let i = 0; i < 800 && !tengo(); i++) {
      for (let k = 0; k < 6; k++) {
        const t = p.obj(`topo ${k}`);
        if (t.position.y > -0.05) {
          await p.tocar(t);
          break;
        }
      }
      await p.esperar(60);
    }
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 14 · El árbol de manzanas
// ---------------------------------------------------------------------------
const MANZANAS: [string, number][] = [['#e4574b', 3], ['#8fcf5a', 5], ['#f7d24a', 2]];
const arbol: Nivel = {
  titulo: 'El árbol de manzanas',
  pistas: ['Las manzanas están escondidas entre las hojas. Hay que moverlo todo.', 'Sacude el celular (o toca el tronco muchas veces) hasta que caigan todas, y cuenta rojas, verdes y amarillas para el candado.'],
  montar(c) {
    const arbolG = grupo('arbol');
    arbolG.add(en(cilindro(0.16, 0.24, 1.8, mat('#8a5e40')), 0, 0.9, 0));
    const copa = grupo('copa');
    for (const [x, y, z, r] of [[0, 2.35, 0, 0.8], [-0.55, 2.1, 0.1, 0.55], [0.55, 2.15, 0.05, 0.58], [0.1, 2.75, 0.05, 0.55], [0, 1.95, 0.35, 0.5]] as [number, number, number, number][]) {
      copa.add(en(esfera(r, mat('#5f9e4f', { rough: 1 }), undefined, 18), x, y, z));
    }
    arbolG.add(copa);
    en(arbolG, 2.2, 0, 0.7);
    c.g.add(arbolG);
    // Manzanas escondidas dentro de la copa
    const todas: THREE.Mesh[] = [];
    let s = 5;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (const [col, n] of MANZANAS)
      for (let i = 0; i < n; i++) {
        const m = esfera(0.075, mat(col, { rough: 0.45 }), 'manzana', 14);
        en(m, 2.2 + (r() - 0.5) * 0.9, 2.2 + (r() - 0.5) * 0.5, 0.7 + (r() - 0.5) * 0.3);
        c.g.add(m);
        todas.push(m);
      }
    todas.sort(() => r() - 0.5);
    let caidas = 0;
    const sacudon = () => {
      sonido.rumor(0.4, 700, 0.07, 0, 0.6);
      void c.escena.animar(500, (k) => (copa.rotation.z = Math.sin(k * Math.PI * 5) * 0.06 * (1 - k)));
      const n = Math.min(4, todas.length - caidas);
      for (let i = 0; i < n; i++) {
        const m = todas[caidas++];
        const y0 = m.position.y, x0 = m.position.x, z0 = m.position.z;
        const xf = 1.2 + r() * 1.9, zf = 0.95 + r() * 0.5;
        void c.escena.animar(700 + i * 120, (k) => {
          m.position.set(x0 + (xf - x0) * k, y0 - (y0 - 0.075) * k * k + (k > 0.85 ? Math.sin((k - 0.85) * 20) * 0.03 : 0), z0 + (zf - z0) * k);
          if (k >= 1) sonido.nota(300 + i * 40, 0.06, 0, 'sine', 0.05);
        }, (k) => k);
      }
      if (caidas >= todas.length) {
        arbolG.userData.listo = true;
        c.bien();
      }
    };
    c.sensor.sacudida(sacudon);
    let toques = 0;
    c.tocar(arbolG, () => {
      toques++;
      void c.escena.animar(200, (k) => (arbolG.rotation.z = Math.sin(k * Math.PI) * 0.02));
      if (toques % 4 === 0) sacudon();
    });
    const cartel = letreroPalo('cartel manzanas', -1.3, 0.35, 0.6, 0.3, (cx, w, h) => {
      cx.fillStyle = '#fff3e0';
      cx.fillRect(0, 0, w, h);
      MANZANAS.forEach(([col], i) => {
        cx.fillStyle = col;
        cx.beginPath();
        cx.arc(w * (0.2 + i * 0.3), h * 0.42, h * 0.22, 0, Math.PI * 2);
        cx.fill();
        textoEn(cx, '?', w * (0.2 + i * 0.3), h * 0.82, h * 0.26, '#3d2b27', 700);
      });
    });
    c.g.add(cartel);
    candadoPuerta(c, [0, 1, 2].map(() => '0123456789'.split('')), MANZANAS.map(([, n]) => String(n)), 'Rojas · verdes · amarillas');
  },
  async prueba(p) {
    for (let i = 0; i < 6 && !p.obj('arbol').userData.listo; i++) {
      p.sensor.sacudir();
      await p.esperar(700);
    }
    await p.tocar('candado');
    await p.panel(MANZANAS.map(([, n]) => n).join(''));
  },
};

// ---------------------------------------------------------------------------
// 15 · El diente de león
// ---------------------------------------------------------------------------
const CODIGO_DIENTE = '7246';
const DIGITOS: Record<string, string[]> = {
  '7': ['111', '001', '010', '010', '010'],
  '2': ['111', '001', '111', '100', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '6': ['111', '100', '111', '101', '111'],
};
const diente: Nivel = {
  titulo: 'El diente de león',
  pistas: ['Los dientes de león se soplan… y al volar dibujan algo.', 'Sopla al celular (o desliza el dedo rápido sobre el diente de león): las semillas forman cuatro números en el cielo. Escríbelos en el teclado.'],
  montar(c) {
    const planta = grupo('diente de leon');
    planta.add(en(cilindro(0.012, 0.015, 0.8, mat('#6fa54f')), 0, 0.4, 0));
    planta.add(en(esfera(0.03, mat('#e8e0c8')), 0, 0.85, 0));
    en(planta, 1.3, 0, 1.1);
    planta.scale.setScalar(1.3);
    c.g.add(planta);
    // Las semillas (se ven en la pompa y luego vuelan a formar los números)
    const destinos: THREE.Vector3[] = [];
    [...CODIGO_DIENTE].forEach((d, i) =>
      DIGITOS[d].forEach((fila, y) => [...fila].forEach((v, x) => v === '1' && destinos.push(new THREE.Vector3(-1.25 + i * 0.66 + x * 0.13, 2.82 - y * 0.13, 0.45)))),
    );
    const semillas: THREE.Mesh[] = [];
    const mS = mat('#fbf7ee', { rough: 0.9 });
    destinos.forEach((_, i) => {
      const a = (i / destinos.length) * Math.PI * 2 * 7.3, b = Math.acos(1 - (2 * (i + 0.5)) / destinos.length);
      const sm = esfera(0.022, mS, undefined, 6);
      en(sm, Math.cos(a) * Math.sin(b) * 0.13, 0.85 + Math.cos(b) * 0.13, Math.sin(a) * Math.sin(b) * 0.13);
      planta.add(sm);
      semillas.push(sm);
    });
    let volaron = false;
    const soplar = () => {
      if (volaron) return;
      volaron = true;
      c.bien();
      sonido.rumor(1.2, 900, 0.08, 0, 0.5, 300);
      semillas.forEach((sm, i) => {
        const desde = sm.getWorldPosition(new THREE.Vector3());
        planta.remove(sm);
        c.g.add(sm);
        sm.position.copy(desde);
        const hasta = destinos[i];
        const medio = new THREE.Vector3((desde.x + hasta.x) / 2 - 0.8, Math.max(desde.y, hasta.y) + 0.6, 0.6);
        void c.escena.animar(2200 + (i % 9) * 90, (k) => {
          const a = desde.clone().lerp(medio, k), b = medio.clone().lerp(hasta, k);
          sm.position.copy(a.lerp(b, k));
        });
      });
      c.despues(2600, () => (planta.userData.formado = true));
    };
    c.sensor.soplido(soplar);
    c.gesto.deslizar((_d, vel, obj) => {
      if (obj === planta && vel > 0.4) soplar();
    });
    let pidio = false;
    c.tocar(planta, async () => {
      if (volaron || pidio) return;
      pidio = true;
      c.aviso('Sopla al celular…', 2500);
      const ok = await c.sensores.escuchar();
      if (!ok) c.aviso('No se pudo usar el micrófono: desliza el dedo rápido sobre el diente de león.', 4000);
    });
    c.alSalir(() => c.sensores.callar());
    c.cada((_, t) => {
      if (!planta.userData.formado) return;
      semillas.forEach((sm, i) => (sm.position.y = destinos[i].y + Math.sin(t * 2 + i) * 0.01));
    });
    tecladoPared(c, 0.98, 1.25, 0.12, CODIGO_DIENTE, 'Teclado de la reja');
  },
  async prueba(p) {
    p.sensor.soplar();
    await p.esperarQue(() => !!p.obj('diente de leon').userData.formado, 60000);
    await p.tocar('teclado');
    await p.panel(CODIGO_DIENTE);
  },
};

// ---------------------------------------------------------------------------
// 16 · El caracol tímido
// ---------------------------------------------------------------------------
const caracol: Nivel = {
  titulo: 'El caracol tímido',
  pistas: ['El caracol se asusta cuando lo tocas… o cuando tocas cualquier cosa.', 'No toques la pantalla: espera a que el caracol llegue a la piedra y deje la llave. Después sí, tómala.'],
  montar(c) {
    const tronco = cilindro(0.18, 0.2, 2.6, mat('#8a5e40'));
    tronco.rotation.z = Math.PI / 2;
    en(tronco, 1.6, 0.18, 1.3);
    const piedra = cilindro(0.2, 0.24, 0.08, mat('#cfc6ba', { rough: 1 }), 'piedra plana', 14);
    en(piedra, 0.1, 0.04, 1.35);
    c.g.add(tronco, piedra);
    const car = grupo('caracol');
    const cuerpo = grupo('cuerpo caracol');
    const baba = esfera(0.1, mat('#e8c9a0'));
    baba.scale.set(1.8, 0.5, 0.8);
    cuerpo.add(baba, en(esfera(0.06, mat('#e8c9a0')), -0.17, 0.08, 0));
    for (const z of [-0.03, 0.03]) {
      cuerpo.add(en(cilindro(0.008, 0.008, 0.1, mat('#e8c9a0')), -0.2, 0.16, z), en(esfera(0.015, mat('#3d2b27')), -0.2, 0.21, z));
    }
    const concha = grupo('concha');
    concha.add(en(esfera(0.12, mat('#d9824f')), 0, 0, 0), en(toro(0.07, 0.02, mat('#b8653a')), 0, 0, 0.1));
    en(concha, 0.02, 0.12, 0);
    const k = llave('llave', '#f2c75c', false);
    k.scale.setScalar(0.6);
    en(k, 0.02, 0.26, 0);
    car.add(cuerpo, concha, k);
    en(car, 2.75, 0.36, 1.3);
    c.g.add(car);
    let escondido = 0, llego = false;
    const asustar = () => {
      if (llego) return;
      if (escondido <= 0) {
        sonido.nota(500, 0.15, 0, 'sine', 0.06, 250);
        c.mal();
      }
      escondido = 2.5;
      car.position.x = Math.min(2.75, car.position.x + 0.35);
    };
    c.gesto.dedos((n) => n > 0 && asustar());
    c.cada((dt, t) => {
      if (llego) return;
      if (escondido > 0) {
        escondido -= dt;
        cuerpo.scale.setScalar(Math.max(0.05, cuerpo.scale.x - dt * 6));
        return;
      }
      cuerpo.scale.setScalar(Math.min(1, cuerpo.scale.x + dt * 3));
      car.position.x -= dt * 0.16;
      baba.scale.x = 1.8 + Math.sin(t * 6) * 0.1;
      if (car.position.x <= 0.55) {
        llego = true;
        // Baja la llave a la piedra
        const w = k.getWorldPosition(new THREE.Vector3());
        car.remove(k);
        c.g.add(k);
        k.position.copy(w);
        const y0 = w.y, x0 = w.x;
        void c.escena.animar(600, (q) => k.position.set(x0 + (0.1 - x0) * q, y0 - (y0 - 0.14) * q, 1.35));
        k.userData.suelta = true;
        c.bien();
        llaveParaLaPuerta(c, k);
      }
    });
  },
  async prueba(p) {
    await p.esperarQue(() => !!p.obj('llave').userData.suelta, 180000);
    await p.esperar(800);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 17 · El camino de piedras
// ---------------------------------------------------------------------------
const CAMINO: [number, number][] = [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2], [2, 1]];
const piedras: Nivel = {
  titulo: 'El camino de piedras',
  pistas: ['El mapa del letrero muestra por dónde pisar.', 'Toca las piedras en el orden del mapa, empezando por la de adelante (donde dice «tú»).'],
  montar(c) {
    const pos = (fila: number, col: number) => new THREE.Vector3(1.0 + col * 0.7, 0.03, 1.55 - fila * 0.42);
    const lista: THREE.Mesh[][] = [];
    for (let f = 0; f < 3; f++) {
      lista.push([]);
      for (let k = 0; k < 3; k++) {
        const m = matNuevo('#cfc6ba', { rough: 1, emisivo: '#f7d24a', intensidad: 0 });
        const p = cilindro(0.25, 0.28, 0.06, m, `piedra ${f} ${k}`, 16);
        p.scale.z = 0.6;
        p.position.copy(pos(f, k));
        c.g.add(p);
        lista[f].push(p);
      }
    }
    const mapa = letreroPalo('mapa piedras', -1.3, 0.4, 0.5, 0.55, (cx, w, h) => {
      cx.fillStyle = '#fff3e0';
      cx.fillRect(0, 0, w, h);
      const P = (f: number, k: number) => [w * (0.22 + k * 0.28), h * (0.78 - f * 0.28)];
      cx.strokeStyle = '#e4574b';
      cx.lineWidth = 8;
      cx.setLineDash([14, 10]);
      cx.beginPath();
      CAMINO.forEach(([f, k], i) => {
        const [x, y] = P(f, k);
        if (i) cx.lineTo(x, y);
        else cx.moveTo(x, y);
      });
      cx.stroke();
      cx.setLineDash([]);
      for (let f = 0; f < 3; f++)
        for (let k = 0; k < 3; k++) {
          const [x, y] = P(f, k);
          cx.fillStyle = '#8a8076';
          cx.beginPath();
          cx.arc(x, y, 14, 0, Math.PI * 2);
          cx.fill();
        }
      const [x0, y0] = P(0, 0);
      textoEn(cx, 'tú', x0, y0 + 34, 26, '#3d2b27', 700);
    });
    c.g.add(mapa);
    let paso = 0;
    lista.flat().forEach((pd) => {
      const [, f, k] = pd.name.split(' ').map(Number);
      c.tocar(pd, () => {
        if (paso >= CAMINO.length) return;
        const [ef, ek] = CAMINO[paso];
        if (f === ef && k === ek) {
          (pd.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6;
          sonido.nota(520 + paso * 80, 0.1, 0, 'triangle', 0.06);
          paso++;
          if (paso === CAMINO.length) {
            c.bien();
            c.puerta.bloqueada = false;
            c.despues(600, () => c.resolver());
          }
        } else {
          c.mal();
          sonido.rumor(0.3, 1800, 0.06);
          paso = 0;
          for (const q of lista.flat()) (q.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
        }
      });
    });
  },
  async prueba(p) {
    for (const [f, k] of CAMINO) await p.tocar(`piedra ${f} ${k}`);
  },
};

// ---------------------------------------------------------------------------
// 18 · El reloj de sol
// ---------------------------------------------------------------------------
const relojSol: Nivel = {
  titulo: 'El reloj de sol',
  pistas: ['El sol se puede mover. La sombra se mueve con él.', 'Arrastra el sol por el cielo hasta que la sombra del reloj apunte al corazón.'],
  montar(c) {
    const cx0 = 1.3, cz0 = 1.25;
    const ped = grupo('reloj de sol');
    ped.add(en(cilindro(0.12, 0.16, 0.85, mat('#e8e0d4')), 0, 0.42, 0), en(cilindro(0.38, 0.38, 0.05, mat('#f2ece2'), undefined, 36), 0, 0.88, 0));
    const marcas = letrero(0.7, 0.7, (cx, w, h) => {
      cx.strokeStyle = '#8a8076';
      cx.lineWidth = 4;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        cx.beginPath();
        cx.moveTo(w / 2 + Math.cos(a) * w * 0.36, h / 2 + Math.sin(a) * h * 0.36);
        cx.lineTo(w / 2 + Math.cos(a) * w * 0.44, h / 2 + Math.sin(a) * h * 0.44);
        cx.stroke();
      }
    }, undefined, { transparente: true });
    marcas.rotation.x = -Math.PI / 2;
    en(marcas, 0, 0.91, 0);
    ped.add(marcas);
    // El corazón marcado hacia adelante a la izquierda
    const dirCorazon = new THREE.Vector3(-0.6, 0, 0.8).normalize();
    const cor = letrero(0.12, 0.12, (cx, w, h) => textoEn(cx, '♥', w / 2, h / 2 + 4, h, '#e4574b', 700), undefined, { transparente: true });
    cor.rotation.x = -Math.PI / 2;
    en(cor, dirCorazon.x * 0.3, 0.915, dirCorazon.z * 0.3);
    ped.add(cor);
    const gnomon = caja(0.02, 0.16, 0.18, mat('#b8bcc4', { metal: 0.6, rough: 0.4 }), 0.005);
    en(gnomon, 0, 0.98, 0);
    ped.add(gnomon);
    const sombra = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.3), new THREE.MeshBasicMaterial({ color: '#3d2b27', transparent: true, opacity: 0.45, depthWrite: false }));
    sombra.geometry.translate(0, 0.15, 0);
    sombra.rotation.x = -Math.PI / 2;
    const pivS = grupo('sombra');
    pivS.add(sombra);
    en(pivS, 0, 0.914, 0);
    ped.add(pivS);
    en(ped, cx0, 0, cz0);
    c.g.add(ped);
    // El sol que se arrastra por el cielo
    const sol = grupo('sol');
    sol.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 16), new THREE.MeshBasicMaterial({ color: '#ffd84a' })));
    for (let i = 0; i < 8; i++) {
      const rayo = caja(0.05, 0.14, 0.02, new THREE.MeshBasicMaterial({ color: '#ffc21a' }), 0.01);
      const a = (i / 8) * Math.PI * 2;
      en(rayo, Math.cos(a) * 0.33, Math.sin(a) * 0.33, 0);
      rayo.rotation.z = a - Math.PI / 2;
      sol.add(rayo);
    }
    const arco = (x: number) => 2.78 - 0.06 * x * x;
    en(sol, -2.2, arco(-2.2), 0.4);
    c.g.add(sol);
    const apuntar = () => {
      const d = new THREE.Vector3(cx0 - sol.position.x, 0, cz0 - 0.4).normalize();
      pivS.rotation.y = Math.atan2(d.x, d.z);
      return d.dot(dirCorazon);
    };
    apuntar();
    let hecho = false;
    c.arrastrar(sol, {
      plano: new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.4),
      limites: limites(-3.2, 2.1, 0.4, 3.2, 2.85, 0.4),
      alMover: () => {
        sol.position.y = arco(sol.position.x);
        apuntar();
      },
      alSoltar: () => {
        if (hecho) return;
        if (apuntar() > 0.985) {
          hecho = true;
          c.bien();
          c.puerta.bloqueada = false;
          c.despues(700, () => c.resolver());
        }
      },
    });
  },
  async prueba(p) {
    // La sombra apunta al corazón cuando el sol está a la derecha del reloj
    const cx0 = 1.3, cz0 = 1.25;
    const d = new THREE.Vector3(-0.6, 0, 0.8).normalize();
    const sx = cx0 - (d.x / d.z) * (cz0 - 0.4);
    await p.arrastrar('sol', new THREE.Vector3(sx, 2.78 - 0.06 * sx * sx, 0.4), 18);
  },
};

// ---------------------------------------------------------------------------
// 19 · Las hojas secas
// ---------------------------------------------------------------------------
const SIMBOLOS = ['☾', '♥', '★', '☀', '✿'];
const hojas: Nivel = {
  titulo: 'Las hojas secas',
  pistas: ['Debajo de tanta hoja seca puede haber algo.', 'Frota (barre) las hojas con el dedo: aparece una trampilla con tres símbolos. Ponlos en el candado de la reja.'],
  montar(c) {
    const W = 1.8, D = 1.0, x = 1.2, z = 1.05;
    const trampilla = grupo('trampilla');
    trampilla.add(caja(1.0, 0.04, 0.6, mat('#a5713f'), 0.02));
    const sim = letrero(0.8, 0.3, (cx, w, h) => ['♥', '★', '☀'].forEach((s, i) => textoEn(cx, s, w * (0.2 + i * 0.3), h / 2 + 6, h * 0.7, '#5e3d28', 700)), undefined, { transparente: true });
    sim.rotation.x = -Math.PI / 2;
    en(sim, 0, 0.022, 0);
    trampilla.add(sim);
    en(trampilla, x, 0.02, z);
    c.g.add(trampilla);
    const b = borrable(W, D, (cx, w, h) => {
      let s = 9;
      const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      cx.fillStyle = '#b8864f';
      cx.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) {
        cx.fillStyle = ['#d9824f', '#c96a2c', '#e8a64a', '#a5713f', '#8a5e40'][i % 5];
        cx.save();
        cx.translate(r() * w, r() * h);
        cx.rotate(r() * Math.PI);
        cx.beginPath();
        cx.ellipse(0, 0, 16, 7, 0, 0, Math.PI * 2);
        cx.fill();
        cx.restore();
      }
    }, 'hojas');
    b.malla.rotation.x = -Math.PI / 2;
    en(b.malla, x, 0.05, z);
    c.g.add(b.malla);
    let avisado = false;
    c.frotar(b.malla, (hit) => {
      if (!hit.uv) return;
      b.borrar(hit.uv, 0.06);
      if (Math.random() < 0.15) sonido.rumor(0.12, 3000, 0.03);
      if (!avisado && Math.random() < 0.1 && b.limpio() > 0.45) {
        avisado = true;
        c.bien();
      }
    });
    candadoPuerta(c, [0, 1, 2].map(() => SIMBOLOS), ['♥', '★', '☀'], 'Candado de símbolos');
  },
  async prueba(p) {
    await p.frotar('hojas', 6);
    await p.tocar('candado');
    await p.panel('♥★☀');
  },
};

// ---------------------------------------------------------------------------
// 20 · El invernadero empañado
// ---------------------------------------------------------------------------
const CODIGO_INVERNADERO = '8164';
const invernadero: Nivel = {
  titulo: 'El invernadero empañado',
  pistas: ['No se ve nada por el vidrio empañado. Límpialo.', 'Frota el vidrio del invernadero: cada matera tiene un número. De izquierda a derecha es la clave del teclado.'],
  montar(c) {
    const x0 = 2.05, z0 = 0.75, W = 1.5, H = 1.4, D = 0.9;
    const inv = grupo('invernadero');
    const blanco = mat('#fbf7ee');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) inv.add(en(caja(0.05, H, 0.05, blanco, 0.01), sx * W / 2, H / 2, sz * D / 2));
    for (const sz of [-1, 1]) inv.add(en(caja(W, 0.05, 0.05, blanco, 0.01), 0, H, sz * D / 2));
    for (const sx of [-1, 1]) inv.add(en(caja(0.05, 0.05, D, blanco, 0.01), sx * W / 2, H, 0));
    const techo = caja(W + 0.1, 0.04, D + 0.1, new THREE.MeshStandardMaterial({ color: '#dff2fb', transparent: true, opacity: 0.4 }), 0.01);
    en(techo, 0, H + 0.04, 0);
    inv.add(techo);
    [...CODIGO_INVERNADERO].forEach((d, i) => {
      const m = grupo();
      m.add(en(cilindro(0.13, 0.1, 0.22, mat('#d9824f')), 0, 0.11, 0));
      const n = letrero(0.16, 0.16, (cx, w, h) => textoEn(cx, d, w / 2, h / 2 + 3, h * 0.9, '#fff3e0', 700), undefined, { transparente: true });
      en(n, 0, 0.12, 0.125);
      m.add(n, en(esfera(0.12, mat('#5f9e4f')), 0, 0.3, 0));
      if (i % 2) m.add(en(esfera(0.05, mat('#F59FC0')), 0.05, 0.42, 0.05));
      en(m, -W / 2 + 0.22 + i * ((W - 0.44) / 3), 0.35, 0);
      inv.add(m);
    });
    inv.add(en(caja(W - 0.1, 0.05, D - 0.1, mat('#c49468'), 0.02), 0, 0.33, 0));
    en(inv, x0, 0, z0);
    c.g.add(inv);
    const vidrio = borrable(W - 0.05, H - 0.05, (cx, w, h) => {
      cx.fillStyle = 'rgba(236, 244, 246, 0.93)';
      cx.fillRect(0, 0, w, h);
      cx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 40; i++) {
        cx.beginPath();
        cx.arc((i * 71) % w, (i * 37) % h, 4 + (i % 5), 0, Math.PI * 2);
        cx.fill();
      }
    }, 'vidrio');
    en(vidrio.malla, x0, H / 2, z0 + D / 2 + 0.03);
    c.g.add(vidrio.malla);
    c.frotar(vidrio.malla, (hit) => {
      if (!hit.uv) return;
      vidrio.borrar(hit.uv, 0.07);
      if (Math.random() < 0.12) sonido.rumor(0.1, 3400, 0.025);
    });
    tecladoPared(c, 0.98, 1.25, 0.12, CODIGO_INVERNADERO, 'Teclado de la reja');
  },
  async prueba(p) {
    await p.frotar('vidrio', 6);
    await p.tocar('teclado');
    await p.panel(CODIGO_INVERNADERO);
  },
};

export const CAP2: Nivel[] = [regadera, mariposa, topos, arbol, diente, caracol, piedras, relojSol, hojas, invernadero];
