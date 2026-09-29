// Capítulo 6 · El bosque de las luciérnagas (puertas 51–60): linterna con el dedo, memoria de luces, contar
// sonidos, celular boca abajo, melodía, equilibrio, frotar el rocío, ordenar fases, ojos cerrados y adivinanza.
import * as THREE from 'three';
import * as sonido from '../../sonido';
import * as sfx from '../sonidos';
import { caja, cilindro, en, esfera, grupo, letrero, mat, matNuevo, textoEn, toro } from '../kit';
import type { Ctx, Nivel } from '../nivel';
import { borrable, candadoPuerta, limites, llave, planoPared } from './piezas';

function llaveParaLaPuerta(c: Ctx, k: THREE.Object3D) {
  c.tocar(k, () => c.dar('llave', k));
  c.conLlave();
}

function abrirYa(c: Ctx, ms = 700) {
  c.bien();
  c.puerta.bloqueada = false;
  c.despues(ms, () => c.resolver());
}

/** Lucecita de luciérnaga (con su halo). */
function luciernaga(nombre: string, color = '#e8ff7a') {
  const g = grupo(nombre);
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 });
  const nucleo = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ color }));
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), m);
  g.add(nucleo, halo);
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ visible: false })));
  g.userData.brillo = (k: number) => {
    halo.scale.setScalar(0.6 + k * 0.9);
    m.opacity = 0.15 + k * 0.5;
  };
  return g;
}

// ---------------------------------------------------------------------------
// 51 · La linterna
// ---------------------------------------------------------------------------
const linterna: Nivel = {
  titulo: 'La linterna',
  pistas: [
    'Aquí no se ve ni la punta de la nariz.',
    'Donde pones el dedo, se hace la luz.',
    'Pasea la luz despacio por las matas de los lados: algo brilla entre ellas.',
  ],
  montar(c) {
    c.escena.atenuar(0.08);
    const foco = new THREE.SpotLight('#fff3d0', 40, 14, 0.2, 0.55, 1.2);
    foco.position.set(0, 1.5, 4.3);
    const objetivo = new THREE.Object3D();
    objetivo.position.set(0, 0.6, 0.5);
    foco.target = objetivo;
    c.g.add(foco, objetivo);
    // Helechos
    const helecho = (x: number, z: number) => {
      const h = grupo('helecho');
      for (let i = 0; i < 7; i++) {
        const hoja = esfera(0.25, mat('#3f7a4a', { rough: 1 }), undefined, 8);
        hoja.scale.set(0.35, 0.12, 1);
        hoja.rotation.set(0.5, (i / 7) * Math.PI * 2, 0);
        en(hoja, Math.sin((i / 7) * Math.PI * 2) * 0.15, 0.18, Math.cos((i / 7) * Math.PI * 2) * 0.15);
        h.add(hoja);
      }
      en(h, x, 0, z);
      c.g.add(h);
    };
    for (const [x, z] of [[1.3, 0.7], [2.4, 0.95], [2.9, 0.5], [0.8, 1.2], [-1.2, 0.9]]) helecho(x, z);
    const k = llave('llave', '#f2c75c', true);
    en(k, 2.55, 0.02, 1.2);
    c.g.add(k);
    // Piedras brillantes que despistan
    for (const [x, z] of [[1.6, 1.3], [-0.9, 1.3], [3.1, 1.1]]) c.g.add(en(esfera(0.06, mat('#d8e6f0', { metal: 0.5, rough: 0.2 })), x, 0.04, z));
    llaveParaLaPuerta(c, k);
    const piso = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const fondo = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0.3);
    c.gesto.mover((x, y, abajo) => {
      if (!abajo) return;
      const p = c.enPlano(x, y, piso);
      objetivo.position.copy(p && p.z > -0.3 ? p : c.enPlano(x, y, fondo) ?? objetivo.position);
    });
  },
  async prueba(p) {
    await p.arrastrarDesde(new THREE.Vector3(0, 0.3, 0.8), new THREE.Vector3(2.55, 0.02, 1.2));
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 52 · Las luciérnagas en orden
// ---------------------------------------------------------------------------
const SECUENCIA = [2, 0, 4, 1, 3];
const luces: Nivel = {
  titulo: 'Las luciérnagas en orden',
  pistas: [
    'Esas luciérnagas tienen algo que decirte.',
    'Hay un farolito en el suelo que las despierta; fíjate en qué orden se prenden.',
    'Toca el farolito, mira el orden en que brillan y repítelo tocando las luciérnagas.',
  ],
  montar(c) {
    const pos: [number, number, number][] = [[-0.9, 1.5, 0.8], [0.2, 2.4, 0.6], [1.2, 1.3, 0.9], [1.9, 2.1, 0.7], [2.6, 1.6, 0.9]];
    const ls = pos.map(([x, y, z], i) => {
      const l = luciernaga(`luciernaga ${i}`);
      en(l, x, y, z);
      l.userData.brillo(0);
      c.g.add(l);
      return l;
    });
    const farol = grupo('farol');
    farol.add(en(caja(0.18, 0.26, 0.18, new THREE.MeshStandardMaterial({ color: '#fff3c0', emissive: '#ffcf6a', emissiveIntensity: 0.6, transparent: true, opacity: 0.8 }), 0.03), 0, 0.13, 0));
    farol.add(en(toro(0.06, 0.012, mat('#3d2b27'), undefined, Math.PI), 0, 0.3, 0), en(caja(0.22, 0.03, 0.22, mat('#3d2b27'), 0.01), 0, 0.27, 0));
    en(farol, 0.9, 0, 1.3);
    c.g.add(farol);
    const destello = (i: number, ms: number) => {
      ls[i].userData.brillo(1);
      sonido.nota(660 + i * 110, ms / 1000, 0, 'sine', 0.06);
      c.despues(ms, () => ls[i].userData.brillo(0));
    };
    let mostrando = false, visto = false, paso = 0, hecho = false;
    c.tocar(farol, () => {
      if (mostrando || hecho) return;
      mostrando = true;
      paso = 0;
      SECUENCIA.forEach((n, i) => c.despues(400 + i * 700, () => destello(n, 480)));
      c.despues(400 + SECUENCIA.length * 700, () => {
        mostrando = false;
        visto = true;
        farol.userData.visto = true;
      });
    });
    ls.forEach((l, i) =>
      c.tocar(l, () => {
        if (mostrando || hecho || !visto) return;
        destello(i, 250);
        if (SECUENCIA[paso] === i) {
          if (++paso === SECUENCIA.length) {
            hecho = true;
            abrirYa(c, 1000);
          }
        } else {
          paso = 0;
          c.mal();
        }
      }),
    );
    c.cada((_, t) => ls.forEach((l, i) => (l.position.y = pos[i][1] + Math.sin(t * 1.3 + i) * 0.05)));
  },
  async prueba(p) {
    await p.tocar('farol');
    await p.esperarQue(() => !!p.obj('farol').userData.visto, 60000);
    for (const i of SECUENCIA) await p.tocar(`luciernaga ${i}`, 1, 150);
  },
};

// ---------------------------------------------------------------------------
// 53 · El búho que cuenta
// ---------------------------------------------------------------------------
const CODIGO_BUHO = ['4', '2', '5'];
const buho: Nivel = {
  titulo: 'El búho que cuenta',
  pistas: [
    'Ese búho no para de hablar.',
    'Ulula en grupos, con pausas en medio. Si lo tocas, repite.',
    'Cuenta los ululatos de cada grupo: cada grupo es un número del candado, en orden.',
  ],
  montar(c) {
    const rama = cilindro(0.06, 0.08, 1.5, mat('#5e3d28'));
    rama.rotation.z = Math.PI / 2 - 0.15;
    en(rama, 1.55, 2.45, 0.1);
    c.g.add(rama);
    const b = grupo('buho');
    const cuerpo = esfera(0.22, mat('#8a6a55'), undefined, 16);
    cuerpo.scale.set(1, 1.2, 0.9);
    const pecho = esfera(0.15, mat('#e8d6bc'), undefined, 12);
    pecho.scale.set(1, 1.2, 0.5);
    en(pecho, 0, -0.03, 0.14);
    const ojos: THREE.Mesh[] = [];
    for (const sx of [-1, 1]) {
      b.add(en(esfera(0.075, mat('#fff8ee'), undefined, 12), sx * 0.08, 0.1, 0.17));
      const o = esfera(0.045, matNuevo('#f7c948', { emisivo: '#f7c948', intensidad: 0.2 }), undefined, 10);
      en(o, sx * 0.08, 0.1, 0.22);
      b.add(o, en(esfera(0.02, mat('#1e1a18')), sx * 0.08, 0.1, 0.26));
      ojos.push(o);
      const oreja = esfera(0.05, mat('#6b4a33'), undefined, 8);
      oreja.scale.set(0.6, 1.4, 0.6);
      en(oreja, sx * 0.13, 0.27, 0.02);
      b.add(oreja);
    }
    b.add(cuerpo, pecho, en(esfera(0.03, mat('#e8a64a')), 0, 0.03, 0.24));
    en(b, 1.95, 2.78, 0.15);
    c.g.add(b);
    const decir = () => {
      let t = 300;
      for (const d of CODIGO_BUHO) {
        for (let i = 0; i < Number(d); i++) {
          c.despues(t, () => {
            sonido.nota(420, 0.16, 0, 'sine', 0.09, 380);
            sonido.nota(360, 0.22, 0.18, 'sine', 0.08, 320);
            ojos.forEach((o) => ((o.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.4));
            void c.escena.animar(300, (q) => (b.scale.y = 1 + Math.sin(q * Math.PI) * 0.08));
          });
          c.despues(t + 380, () => ojos.forEach((o) => ((o.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2)));
          t += 560;
        }
        t += 1300;
      }
    };
    c.despues(1200, decir);
    c.tocar(b, decir);
    candadoPuerta(c, [0, 1, 2].map(() => '0123456789'.split('')), CODIGO_BUHO, 'Candado del árbol');
  },
  async prueba(p) {
    await p.tocar('candado');
    await p.panel(CODIGO_BUHO.join(''));
  },
};

// ---------------------------------------------------------------------------
// 54 · Boca abajo
// ---------------------------------------------------------------------------
const bocaAbajo: Nivel = {
  titulo: 'En la oscuridad total',
  pistas: [
    'Esas luciérnagas están muy dispersas.',
    'Son tímidas: solo se juntan en la oscuridad total, cuando nadie las mira.',
    'Pon el celular boca abajo unos segundos y vuelve a mirarlo. (Sin sensores: mantén presionada la piedra un buen rato.)',
  ],
  montar(c) {
    const piedra = cilindro(0.45, 0.55, 0.3, mat('#6f6a64', { rough: 1 }), 'piedra', 16);
    en(piedra, 0.9, 0.15, 0.95);
    c.g.add(piedra);
    const ls: THREE.Object3D[] = [];
    for (let i = 0; i < 26; i++) {
      const l = luciernaga(`bicho ${i}`);
      l.scale.setScalar(0.5);
      en(l, (i % 2 ? -1 : 1) * (1.05 + ((i * 0.37) % 1) * 2.3), 0.6 + ((i * 0.53) % 1) * 2.2, -0.4 + ((i * 0.71) % 1) * 1.8);
      l.userData.brillo(0.3);
      c.g.add(l);
      ls.push(l);
    }
    const k = llave('llave', '#f2c75c', true);
    en(k, 0.9, 0.31, 0.95);
    k.visible = false;
    c.g.add(k);
    let abajo = 0, juntas = false;
    const juntar = () => {
      if (juntas) return;
      juntas = true;
      c.bien();
      sonido.regalo();
      ls.forEach((l, i) => {
        const t = (i / ls.length) * Math.PI * 2;
        const x = 16 * Math.sin(t) ** 3, y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        const destino = new THREE.Vector3(1.55 + x * 0.03, 1.4 + y * 0.03, 0.95);
        const desde = l.position.clone();
        void c.escena.animar(1400, (q) => l.position.lerpVectors(desde, destino, q));
        l.userData.brillo(1);
      });
      k.visible = true;
      llaveParaLaPuerta(c, k);
      piedra.userData.juntas = true;
    };
    c.cada((dt) => {
      if (juntas) return;
      if (c.sensores.bocaAbajo) abajo += dt;
      else if (abajo > 2) juntar();
      else abajo = 0;
    });
    c.mantener(piedra, () => {}, (ms) => ms > 3000 && juntar());
  },
  async prueba(p) {
    p.sensor.inclinar(0, 0, 1);
    await p.esperar(9000);
    p.sensor.inclinar(0, 1, 0);
    await p.esperarQue(() => !!p.obj('piedra').userData.juntas, 60000);
    p.sensor.soltar();
    await p.esperar(600);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 55 · Los hongos que cantan
// ---------------------------------------------------------------------------
const COLORES_HONGOS = ['#7af0ff', '#f59fc0', '#b6f07a', '#f7c948', '#c9b6ea'];
const NOTAS_HONGOS = [523, 587, 659, 784, 880];
const CANCION = [3, 1, 4, 0, 2];
const hongos: Nivel = {
  titulo: 'Los hongos que cantan',
  pistas: [
    'Esos hongos tienen voz.',
    'Cada hongo suena distinto, y en algún lugar está pintada su canción.',
    'Toca los hongos en el orden de los colores pintados en la piedra, de izquierda a derecha.',
  ],
  montar(c) {
    const hs = COLORES_HONGOS.map((col, i) => {
      const h = grupo(`hongo ${i}`);
      h.add(en(cilindro(0.06, 0.08, 0.3, mat('#f6f1e6')), 0, 0.15, 0));
      const som = esfera(0.2, matNuevo(col, { emisivo: col, intensidad: 0.4 }), undefined, 16);
      som.scale.y = 0.55;
      en(som, 0, 0.32, 0);
      h.add(som);
      en(h, -0.5 + i * 0.7, 0, 1.15 + (i % 2) * 0.2);
      c.g.add(h);
      h.userData.som = som;
      return h;
    });
    const piedra = letrero(0.9, 0.5, (cx, w, h) => {
      cx.fillStyle = '#7a746c';
      cx.fillRect(0, 0, w, h);
      CANCION.forEach((i, k) => {
        cx.fillStyle = COLORES_HONGOS[i];
        cx.beginPath();
        cx.arc(w * (0.14 + k * 0.18), h * 0.55, h * 0.13, 0, Math.PI * 2);
        cx.fill();
      });
      textoEn(cx, '♪', w * 0.5, h * 0.2, h * 0.25, '#e8e0d4', 700);
    }, 'piedra cancion');
    en(piedra, 2.3, 1.0, 0.35);
    c.g.add(piedra, en(caja(1.0, 1.1, 0.2, mat('#6f6a64', { rough: 1 }), 0.08), 2.3, 0.55, 0.22));
    let paso = 0, hecho = false;
    hs.forEach((h, i) =>
      c.tocar(h, () => {
        if (hecho) return;
        sfx.hongo(NOTAS_HONGOS[i]);
        const m = h.userData.som.material as THREE.MeshStandardMaterial;
        m.emissiveIntensity = 1.6;
        c.despues(300, () => (m.emissiveIntensity = 0.4));
        void c.escena.animar(250, (q) => (h.scale.y = 1 - Math.sin(q * Math.PI) * 0.15));
        if (CANCION[paso] === i) {
          if (++paso === CANCION.length) {
            hecho = true;
            abrirYa(c, 1000);
          }
        } else {
          paso = CANCION[0] === i ? 1 : 0;
          c.mal();
        }
      }),
    );
  },
  async prueba(p) {
    for (const i of CANCION) await p.tocar(`hongo ${i}`, 1, 200);
  },
};

// ---------------------------------------------------------------------------
// 56 · El equilibrio
// ---------------------------------------------------------------------------
const equilibrio: Nivel = {
  titulo: 'El equilibrio',
  pistas: [
    'Esa tabla está muy inestable.',
    'La tabla se inclina como se incline el celular; la barra se llena mientras la pelota no se caiga.',
    'Mueve el celular suavecito de un lado al otro para dejar la pelota en el centro hasta que se llene la barra.',
  ],
  montar(c) {
    const cx0 = 1.2, y0 = 0.62, z0 = 1.0;
    c.g.add(en(cilindro(0.18, 0.24, y0 - 0.05, mat('#6b4a33')), cx0, (y0 - 0.05) / 2, z0));
    const tabla = grupo('tabla');
    tabla.add(caja(1.8, 0.05, 0.3, mat('#a5713f'), 0.02));
    const centro = caja(0.5, 0.055, 0.3, matNuevo('#7ff0b0', { emisivo: '#2f8f68', intensidad: 0.3 }), 0.02);
    tabla.add(centro);
    en(tabla, cx0, y0, z0);
    c.g.add(tabla);
    const bola = esfera(0.07, mat('#e4574b', { rough: 0.3 }), 'pelota', 16);
    c.g.add(bola);
    const barra = caja(0.02, 0.06, 0.02, matNuevo('#f7c948', { emisivo: '#f7c948', intensidad: 0.8 }), 0.01);
    en(barra, cx0 - 0.5, y0 + 0.45, z0);
    c.g.add(barra, en(caja(1.04, 0.08, 0.02, mat('#3d2b27'), 0.02), cx0, y0 + 0.45, z0 - 0.01));
    let x = 0, v = 0, lleno = 0, hecho = false, dedoX: number | null = null;
    c.cada((dt, t) => {
      if (hecho) return;
      const sin = c.sensores.hayMovimiento;
      const meta = dedoX !== null ? dedoX : sin ? THREE.MathUtils.clamp(c.sensores.inclinacion.x * 0.6, -0.35, 0.35) : 0;
      tabla.rotation.z += (-meta - tabla.rotation.z) * Math.min(1, dt * 6);
      const viento = Math.sin(t * 0.7) * 0.25 + Math.sin(t * 1.9) * 0.12;
      const pasos = 4;
      for (let i = 0; i < pasos; i++) {
        const h = dt / pasos;
        v += (-Math.sin(tabla.rotation.z) * 9.8 * 0.7 + viento) * h;
        v *= 0.995;
        x += v * h;
      }
      if (Math.abs(x) > 0.86) {
        c.mal();
        x = 0;
        v = 0;
        lleno = Math.max(0, lleno - 1);
      }
      bola.position.set(cx0 + Math.cos(tabla.rotation.z) * x, y0 + 0.095 + Math.sin(tabla.rotation.z) * x, z0);
      if (Math.abs(x) < 0.25) lleno += dt;
      barra.scale.x = 1 + (lleno / 4) * 50;
      barra.position.x = cx0 - 0.5 + ((lleno / 4) * 1.0) / 2;
      bola.userData.x = x;
      bola.userData.v = v;
      if (lleno >= 4) {
        hecho = true;
        bola.userData.hecho = true;
        abrirYa(c, 800);
      }
    });
    // Sin sensor: se inclina la tabla arrastrando el dedo a los lados
    let x0: number | null = null;
    c.gesto.mover((px, _py, abajo) => {
      if (c.sensores.hayMovimiento) return;
      if (!abajo) {
        x0 = null;
        dedoX = null;
        return;
      }
      if (x0 === null) x0 = px;
      dedoX = THREE.MathUtils.clamp((px - x0) / 400, -0.35, 0.35);
    });
  },
  async prueba(p) {
    const b = p.obj('pelota');
    for (let i = 0; i < 4000 && !b.userData.hecho; i++) {
      const x = (b.userData.x as number) ?? 0, v = (b.userData.v as number) ?? 0;
      p.sensor.inclinar(-THREE.MathUtils.clamp((x * 2.2 + v * 0.8) / 0.6, -0.58, 0.58), 0.8);
      await p.esperar(30);
    }
    p.sensor.soltar();
  },
};

// ---------------------------------------------------------------------------
// 57 · La telaraña con rocío
// ---------------------------------------------------------------------------
const telarana: Nivel = {
  titulo: 'La telaraña con rocío',
  pistas: [
    'Esa telaraña está muy mojada.',
    'El rocío tapa algo tejido en la telaraña.',
    'Frota la telaraña con el dedo para quitarle el rocío y lee la palabra: va en el candado.',
  ],
  montar(c) {
    const x0 = 2.2, y0 = 1.55, z0 = 0.45, T = 1.2;
    const red = letrero(T, T, (cx, w, h) => {
      cx.strokeStyle = 'rgba(230,236,245,0.85)';
      cx.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        cx.beginPath();
        cx.moveTo(w / 2, h / 2);
        cx.lineTo(w / 2 + Math.cos(a) * w * 0.48, h / 2 + Math.sin(a) * h * 0.48);
        cx.stroke();
      }
      for (let r = 20; r < w * 0.48; r += 22) {
        cx.beginPath();
        cx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
        cx.stroke();
      }
      cx.strokeStyle = '#ffffff';
      cx.lineWidth = 9;
      cx.font = `600 ${h * 0.2}px 'Fredoka', sans-serif`;
      cx.textAlign = 'center';
      cx.strokeText('LUNA', w / 2, h / 2 + h * 0.07);
    }, 'telarana', { transparente: true });
    en(red, x0, y0, z0);
    c.g.add(red);
    for (const sx of [-1, 1]) c.g.add(en(cilindro(0.12, 0.15, 2.4, mat('#5e3d28')), x0 + sx * (T / 2 + 0.12), 1.2, z0 - 0.05));
    const rocio = borrable(T * 0.92, T * 0.92, (cx, w, h) => {
      let s = 3;
      const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      cx.fillStyle = 'rgba(180,210,235,0.55)';
      cx.fillRect(0, 0, w, h);
      for (let i = 0; i < 420; i++) {
        cx.fillStyle = `rgba(235,245,255,${0.6 + r() * 0.4})`;
        cx.beginPath();
        cx.arc(r() * w, r() * h, 3 + r() * 5, 0, Math.PI * 2);
        cx.fill();
      }
    }, 'rocio');
    en(rocio.malla, x0, y0, z0 + 0.02);
    c.g.add(rocio.malla);
    c.frotar(rocio.malla, (hit) => {
      if (!hit.uv) return;
      rocio.borrar(hit.uv, 0.08);
      if (Math.random() < 0.15) sonido.rumor(0.15, 3200, 0.025);
    });
    const abc = ['A', 'E', 'L', 'M', 'N', 'O', 'S', 'U'];
    candadoPuerta(c, [0, 1, 2, 3].map(() => abc), ['L', 'U', 'N', 'A'], 'Candado de letras');
  },
  async prueba(p) {
    await p.frotar('rocio', 5);
    await p.tocar('candado');
    await p.panel('LUNA');
  },
};

// ---------------------------------------------------------------------------
// 58 · Las fases de la luna
// ---------------------------------------------------------------------------
const FASES = ['nueva', 'creciente', 'llena', 'menguante'];
function dibujarFase(cx: CanvasRenderingContext2D, w: number, h: number, fase: string) {
  cx.fillStyle = '#26375E';
  cx.beginPath();
  cx.arc(w / 2, h / 2, w * 0.46, 0, Math.PI * 2);
  cx.fill();
  cx.fillStyle = '#fff3c0';
  const r = w * 0.36;
  if (fase === 'llena') {
    cx.beginPath();
    cx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
    cx.fill();
  } else if (fase === 'creciente' || fase === 'menguante') {
    const lado = fase === 'creciente' ? 1 : -1;
    cx.beginPath();
    cx.arc(w / 2, h / 2, r, -Math.PI / 2, Math.PI / 2, lado < 0);
    cx.ellipse(w / 2, h / 2, r * 0.45, r, 0, Math.PI / 2, -Math.PI / 2, lado > 0);
    cx.fill();
  } else {
    cx.strokeStyle = '#8a94b8';
    cx.lineWidth = 4;
    cx.beginPath();
    cx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
    cx.stroke();
  }
}
const fases: Nivel = {
  titulo: 'Las fases de la luna',
  pistas: [
    'La luna no siempre se ve igual.',
    'La tabla de piedra ya tiene la primera luna puesta; faltan las otras.',
    'Arrastra las fichas a la tabla siguiendo el ciclo de la luna: después de la que ya está, la que sigue, y así.',
  ],
  montar(c) {
    const x0 = 2.05, y0 = 1.75, z = 0.35;
    const tabla = caja(1.9, 0.6, 0.12, mat('#7a746c', { rough: 1 }), 0.05);
    en(tabla, x0, y0, z - 0.08);
    c.g.add(tabla, en(caja(0.12, y0, 0.12, mat('#6f6a64'), 0.03), x0 - 0.7, y0 / 2, z - 0.1), en(caja(0.12, y0, 0.12, mat('#6f6a64'), 0.03), x0 + 0.7, y0 / 2, z - 0.1));
    const huecos = FASES.map((_, i) => new THREE.Vector3(x0 - 0.66 + i * 0.44, y0, z));
    for (const h of huecos) c.g.add(en(cilindro(0.18, 0.18, 0.02, mat('#4a4640'), undefined, 20), h.x, h.y, h.z - 0.01));
    for (const h of c.g.children.slice(-4)) h.rotation.x = Math.PI / 2;
    const puestas = new Set<number>([0]);
    const ficha = (i: number) => {
      const f = letrero(0.32, 0.32, (cx, w, h) => dibujarFase(cx, w, h, FASES[i]), `fase ${FASES[i]}`, { transparente: true });
      return f;
    };
    const primera = ficha(0);
    primera.position.copy(huecos[0]).setZ(z + 0.02);
    c.g.add(primera);
    const sueltas: [number, number][] = [[1.25, 0.8], [2.9, 0.75], [2.4, 1.15]];
    [2, 3, 1].forEach((i, k) => {
      const f = ficha(i);
      en(f, sueltas[k][0], sueltas[k][1], z + 0.05);
      c.g.add(f);
      const origen = f.position.clone();
      c.arrastrar(f, {
        plano: planoPared(z + 0.05),
        limites: limites(0.3, 0.4, z + 0.05, 3.6, 2.6, z + 0.05),
        alSoltar: (pnt) => {
          if (puestas.has(i)) return;
          const h = huecos[i];
          if (pnt.distanceTo(new THREE.Vector3(h.x, h.y, z + 0.05)) < 0.2 && puestas.size === i) {
            puestas.add(i);
            f.position.set(h.x, h.y, z + 0.02);
            c.quitarToque(f);
            sonido.nota(700 + i * 100, 0.1, 0, 'sine', 0.07);
            if (puestas.size === FASES.length) abrirYa(c, 900);
          } else {
            if (huecos.some((hh) => pnt.distanceTo(new THREE.Vector3(hh.x, hh.y, z + 0.05)) < 0.2)) c.mal();
            void c.escena.animar(300, (q) => f.position.lerp(origen, q));
          }
        },
      });
    });
  },
  async prueba(p) {
    const x0 = 2.05, y0 = 1.75, z = 0.35;
    for (const i of [1, 2, 3]) await p.arrastrar(`fase ${FASES[i]}`, new THREE.Vector3(x0 - 0.66 + i * 0.44, y0, z + 0.05), 16);
  },
};

// ---------------------------------------------------------------------------
// 59 · Los ojos cerrados
// ---------------------------------------------------------------------------
const ojosCerrados: Nivel = {
  titulo: 'Los ojos cerrados',
  pistas: [
    'Ese árbol está profundamente dormido.',
    'Para despertarlo hay que dormirse con él… de verdad.',
    'Apaga la pantalla del celular por lo menos cinco segundos y vuelve a prenderla. (Si no puedes, deja el dedo quieto sobre el árbol un buen rato.)',
  ],
  montar(c) {
    const cara = letrero(1.2, 0.5, (cx, w, h) => {
      cx.strokeStyle = '#3a2618';
      cx.lineWidth = 10;
      cx.lineCap = 'round';
      for (const x of [0.3, 0.7]) {
        cx.beginPath();
        cx.arc(w * x, h * 0.35, w * 0.09, 0.15, Math.PI - 0.15);
        cx.stroke();
      }
      textoEn(cx, 'z z z', w * 0.85, h * 0.2, h * 0.22, '#e8e0d4', 600);
    }, 'cara dormida', { transparente: true });
    en(cara, 0, 2.75, 0.06);
    c.g.add(cara);
    let hecho = false;
    const abrir = () => {
      if (hecho) return;
      hecho = true;
      sonido.bostezo();
      abrirYa(c, 1200);
    };
    c.sensor.pantalla((ms) => {
      if (ms >= 5000) abrir();
      else {
        c.mal();
        c.aviso('Un poquito más de tiempo…', 2000);
      }
    });
    const toque = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 3.2), new THREE.MeshBasicMaterial({ visible: false }));
    toque.name = 'arbol toque';
    en(toque, 0, 1.6, 0.3);
    c.g.add(toque);
    c.mantener(toque, () => {}, (ms) => (ms >= 7000 ? abrir() : ms > 1500 && c.aviso('Más tiempo, con los ojitos cerrados…', 1800)));
  },
  async prueba(p) {
    p.sensor.pantalla(5600);
  },
};

// ---------------------------------------------------------------------------
// 60 · La adivinanza del árbol
// ---------------------------------------------------------------------------
const adivinanza: Nivel = {
  titulo: 'La adivinanza del árbol',
  pistas: [
    'Ese árbol tiene cara… y ganas de hablar.',
    'Tócale la cara para oír su adivinanza; la respuesta está cerquita.',
    'La respuesta está entre las cosas del tronco cortado: piensa cuál tiene agujas y números.',
  ],
  montar(c) {
    const cara = letrero(1.2, 0.55, (cx, w, h) => {
      cx.fillStyle = '#3a2618';
      for (const x of [0.3, 0.7]) {
        cx.beginPath();
        cx.arc(w * x, h * 0.35, w * 0.07, 0, Math.PI * 2);
        cx.fill();
      }
      cx.strokeStyle = '#3a2618';
      cx.lineWidth = 10;
      cx.beginPath();
      cx.arc(w / 2, h * 0.55, w * 0.12, 0.2, Math.PI - 0.2);
      cx.stroke();
    }, 'cara arbol', { transparente: true });
    en(cara, 0, 2.75, 0.07);
    c.g.add(cara);
    const toqueCara = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.8), new THREE.MeshBasicMaterial({ visible: false }));
    toqueCara.name = 'cara toque';
    en(toqueCara, 0, 2.75, 0.12);
    c.g.add(toqueCara);
    c.tocar(toqueCara, () =>
      void c.ui.nota('<p>«Tengo agujas y no sé coser,</p><p>tengo números y no sé leer,</p><p>no camino, pero nunca me detengo.</p><p><b>¿Qué soy?</b>»</p>'),
    );
    const tronco = cilindro(0.45, 0.5, 0.55, mat('#8a5e40'), 'tocon', 20);
    en(tronco, 1.3, 0.275, 1.0);
    c.g.add(tronco, en(cilindro(0.44, 0.44, 0.01, mat('#c49468'), undefined, 20), 1.3, 0.556, 1.0));
    const reloj = grupo('reloj de bolsillo');
    const caja1 = cilindro(0.09, 0.09, 0.025, mat('#d9b25a', { metal: 0.7, rough: 0.3 }), undefined, 20);
    const esf = letrero(0.15, 0.15, (cx, w, h) => {
      cx.fillStyle = '#fff8ee';
      cx.beginPath();
      cx.arc(w / 2, h / 2, w * 0.48, 0, Math.PI * 2);
      cx.fill();
      cx.strokeStyle = '#3d2b27';
      cx.lineWidth = 6;
      cx.beginPath();
      cx.moveTo(w / 2, h / 2);
      cx.lineTo(w / 2, h * 0.2);
      cx.moveTo(w / 2, h / 2);
      cx.lineTo(w * 0.7, h / 2);
      cx.stroke();
    }, undefined, { transparente: true });
    esf.rotation.x = -Math.PI / 2;
    en(esf, 0, 0.014, 0);
    reloj.add(caja1, esf, en(toro(0.025, 0.006, mat('#d9b25a', { metal: 0.7, rough: 0.3 })), 0, 0, -0.1));
    const pina = grupo('pina');
    const p1 = esfera(0.08, mat('#8a5e40'), undefined, 10);
    p1.scale.set(0.8, 1.3, 0.8);
    pina.add(p1);
    const alfiletero = grupo('alfiletero');
    alfiletero.add(esfera(0.08, mat('#e4574b'), undefined, 12));
    for (let i = 0; i < 5; i++) alfiletero.add(en(cilindro(0.004, 0.004, 0.1, mat('#d8e6f0', { metal: 0.8, rough: 0.2 })), Math.cos(i) * 0.04, 0.07, Math.sin(i) * 0.04));
    const libro = caja(0.2, 0.05, 0.14, mat('#3c7a62'), 0.01, 'libro');
    const cosas: THREE.Object3D[] = [reloj, pina, alfiletero, libro];
    const puestos: [number, number][] = [[-0.22, 0.1], [0.12, -0.18], [0.22, 0.12], [-0.08, -0.2]];
    cosas.forEach((o, i) => {
      o.add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), new THREE.MeshBasicMaterial({ visible: false })));
      en(o, 1.3 + puestos[i][0], 0.61, 1.0 + puestos[i][1]);
      c.g.add(o);
      c.tocar(o, () => {
        if (o === reloj) {
          sonido.campana();
          abrirYa(c, 1000);
        } else {
          c.mal();
          void c.escena.animar(300, (q) => (o.rotation.y = Math.sin(q * Math.PI * 2) * 0.4));
        }
      });
    });
  },
  async prueba(p) {
    await p.tocar('reloj de bolsillo');
  },
};

export const CAP6: Nivel[] = [linterna, luces, buho, bocaAbajo, hongos, equilibrio, telarana, fases, ojosCerrados, adivinanza];
