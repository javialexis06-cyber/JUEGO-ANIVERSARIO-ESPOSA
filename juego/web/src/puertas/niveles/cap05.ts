// Capítulo 5 · La playa (puertas 41–50): ordenar, sacudir, guiar inclinando, cosquillas (frotar rápido),
// memoria con la marea, soplar el velero, cocos, destellos y vibración, estrellas que se prenden y el atardecer.
import * as THREE from 'three';
import { cieloPlaya } from '../cuarto';
import * as sonido from '../sonido_eco';
import * as sfx from '../sonidos';
import { caja, cilindro, en, esfera, estrella, grupo, letrero, mat, matNuevo, textoEn } from '../kit';
import type { Ctx, Nivel } from '../nivel';
import { candadoPuerta, llave, reservar } from './piezas';

function llaveParaLaPuerta(c: Ctx, k: THREE.Object3D) {
  c.tocar(k, () => c.dar('llave', k));
  c.conLlave();
}

function abrirYa(c: Ctx, ms = 700) {
  c.bien();
  c.puerta.bloqueada = false;
  c.despues(ms, () => c.resolver());
}

/** Concha de mar (abanico con rayitas). */
function concha(color: string, nombre: string) {
  const g = grupo(nombre);
  const cuerpo = esfera(0.12, mat(color), undefined, 16);
  cuerpo.scale.set(1, 0.35, 0.85);
  g.add(cuerpo);
  for (let i = -2; i <= 2; i++) {
    const r = caja(0.012, 0.03, 0.18, mat('#ffffff'), 0.005);
    r.rotation.y = i * 0.28;
    en(r, Math.sin(i * 0.28) * 0.05, 0.03, 0);
    g.add(r);
  }
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ visible: false })));
  return g;
}

// ---------------------------------------------------------------------------
// 41 · Las conchas
// ---------------------------------------------------------------------------
const TAMANOS = [1.3, 0.6, 1.0, 1.5, 0.8];
const conchas: Nivel = {
  titulo: 'Las conchas',
  pistas: [
    'Las conchas no se recogen de cualquier manera.',
    'En la arena alguien dibujó cómo se recogen.',
    'Recógelas según su tamaño, como muestra el dibujo de la arena.',
  ],
  montar(c) {
    const orden = TAMANOS.map((t, i) => [t, i] as const).sort((a, b) => a[0] - b[0]).map(([, i]) => i);
    let paso = 0;
    const cs = TAMANOS.map((t, i) => {
      const o = concha(['#F59FC0', '#f7d6c0', '#fff3e0', '#f6b48a', '#e8c9f0'][i], `concha ${i}`);
      o.scale.setScalar(t * 1.9);
      en(o, -1.5 + i * 0.75, 0.03, 1.05 + (i % 2) * 0.35, i * 0.7);
      c.g.add(o);
      return o;
    });
    // En la arena: tres conchitas de menor a mayor con una flecha
    const dibujo = letrero(0.9, 0.3, (cx, w, h) => {
      cx.strokeStyle = '#a5713f';
      cx.lineWidth = 6;
      [0.14, 0.24, 0.36].forEach((r, i) => {
        cx.beginPath();
        cx.arc(w * (0.12 + i * 0.22), h * 0.55, h * r, Math.PI, 0);
        cx.closePath();
        cx.stroke();
      });
      cx.beginPath();
      cx.moveTo(w * 0.7, h * 0.5);
      cx.lineTo(w * 0.94, h * 0.5);
      cx.lineTo(w * 0.87, h * 0.3);
      cx.moveTo(w * 0.94, h * 0.5);
      cx.lineTo(w * 0.87, h * 0.7);
      cx.stroke();
    }, 'dibujo arena', { transparente: true });
    dibujo.rotation.x = -Math.PI / 2;
    en(dibujo, 2.4, 0.012, 1.05);
    c.g.add(dibujo);
    cs.forEach((o, i) => {
      c.tocar(o, () => {
        if (paso >= orden.length || o.userData.lista) return;
        if (orden[paso] === i) {
          o.userData.lista = true;
          paso++;
          sonido.nota(600 + paso * 90, 0.1, 0, 'sine', 0.07);
          const y0 = o.position.y;
          void c.escena.animar(300, (q) => (o.position.y = y0 + Math.sin(q * Math.PI) * 0.15));
          if (paso === orden.length) abrirYa(c, 800);
        } else {
          c.mal();
          paso = 0;
          cs.forEach((x) => (x.userData.lista = false));
        }
      });
    });
  },
  async prueba(p) {
    const orden = TAMANOS.map((t, i) => [t, i] as const).sort((a, b) => a[0] - b[0]).map(([, i]) => i);
    for (const i of orden) await p.tocar(`concha ${i}`);
  },
};

// ---------------------------------------------------------------------------
// 42 · El castillo de arena
// ---------------------------------------------------------------------------
const castillo: Nivel = {
  titulo: 'El castillo de arena',
  pistas: [
    'Ese castillo esconde algo.',
    'Lo que hay adentro no sale sin deshacer el castillo.',
    'Mueve el celular con fuerza (o dale muchos toques al castillo) hasta desbaratarlo, y revisa lo que aparece.',
  ],
  montar(c) {
    const arena = mat('#e8c98e', { rough: 1 });
    const cas = grupo('castillo');
    cas.add(en(caja(0.8, 0.35, 0.6, arena, 0.05), 0, 0.175, 0));
    for (const [x, z] of [[-0.35, -0.25], [0.35, -0.25], [-0.35, 0.25], [0.35, 0.25]]) {
      cas.add(en(cilindro(0.1, 0.12, 0.55, arena), x, 0.275, z), en(cilindro(0.001, 0.12, 0.16, arena), x, 0.63, z));
    }
    cas.add(en(cilindro(0.14, 0.16, 0.7, arena), 0, 0.35, 0), en(cilindro(0.001, 0.16, 0.2, arena), 0, 0.8, 0));
    const bandera = caja(0.12, 0.08, 0.005, mat('#e4574b'), 0.003);
    en(bandera, 0.06, 0.98, 0);
    cas.add(bandera, en(cilindro(0.005, 0.005, 0.22, mat('#8a6a3c')), 0, 0.92, 0));
    en(cas, 1.3, 0, 0.9);
    c.g.add(cas);
    const cofre = grupo('cofre');
    cofre.add(caja(0.34, 0.2, 0.24, mat('#8a5e40'), 0.03), en(caja(0.36, 0.04, 0.26, mat('#d9b25a', { metal: 0.6, rough: 0.35 }), 0.01), 0, 0.1, 0));
    en(cofre, 1.3, -0.25, 0.9);
    c.g.add(cofre);
    reservar(c, 1.3, 0, 1.05, 0.5, 0.35, 0.6);
    let nivelArena = 0;
    const alisar = () => {
      if (nivelArena >= 3) return;
      nivelArena++;
      sonido.rumor(0.5, 400, 0.08, 0, 0.5);
      const s0 = cas.scale.y, s1 = 1 - nivelArena * 0.32;
      void c.escena.animar(500, (q) => {
        cas.scale.set(1 + nivelArena * 0.15 * q, s0 + (s1 - s0) * q, 1 + nivelArena * 0.15 * q);
        cofre.position.y = -0.25 + (nivelArena / 3) * 0.33 * q;
      });
      if (nivelArena === 3) {
        c.bien();
        cofre.userData.fuera = true;
      }
    };
    c.sensor.sacudida(alisar);
    let toques = 0;
    c.tocar(cas, () => {
      if (++toques % 4 === 0) alisar();
      else void c.escena.animar(150, (q) => (cas.rotation.z = Math.sin(q * Math.PI) * 0.02));
    });
    let abierto = false;
    c.tocar(cofre, () => {
      if (!cofre.userData.fuera || abierto) return;
      abierto = true;
      const k = llave('llave', '#f2c75c', true);
      en(k, 1.3, 0.22, 1.1);
      c.g.add(k);
      sonido.regalo();
      llaveParaLaPuerta(c, k);
    });
  },
  async prueba(p) {
    for (let i = 0; i < 3; i++) {
      p.sensor.sacudir();
      await p.esperar(500);
    }
    await p.esperarQue(() => !!p.obj('cofre').userData.fuera, 20000);
    await p.esperar(800);
    await p.tocar('cofre');
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 43 · La botella con mensaje
// ---------------------------------------------------------------------------
const ROCAS: [number, number][] = [[3.7, -3.9], [4.55, -2.9], [3.9, -2.0]];
const CODIGO_BOTELLA = ['7', '3', '9'];
const botella: Nivel = {
  titulo: 'La botella con mensaje',
  pareja: { pista: ['botella'] },
  pistas: [
    'Algo viene flotando desde el mar.',
    'La botella se mueve hacia donde se incline el mundo… y le tiene miedo a las rocas.',
    'Guíala inclinando el celular hasta la orilla; el mensaje hay que leerlo como si estuvieras frente a un espejo.',
  ],
  montar(c) {
    for (const [x, z] of ROCAS) {
      const r = esfera(0.32, mat('#7a7068', { rough: 1 }), undefined, 12);
      r.scale.set(1, 0.6, 0.9);
      en(r, x, 0.1, z);
      c.g.add(r);
    }
    const b = grupo('botella');
    const vidrio = cilindro(0.07, 0.08, 0.3, new THREE.MeshStandardMaterial({ color: '#8fd6b9', transparent: true, opacity: 0.7, roughness: 0.15 }));
    vidrio.rotation.z = Math.PI / 2;
    const corcho = cilindro(0.035, 0.035, 0.06, mat('#b8864f'));
    corcho.rotation.z = Math.PI / 2;
    en(corcho, 0.18, 0, 0);
    const papel = cilindro(0.04, 0.04, 0.2, mat('#fff3e0'));
    papel.rotation.z = Math.PI / 2;
    b.add(vidrio, corcho, papel, new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ visible: false })));
    const inicio = new THREE.Vector3(4.1, 0.06, -4.8);
    b.position.copy(inicio);
    b.scale.setScalar(1.4);
    c.g.add(b);
    let llego = false, arrastrando = false, destinoX = 4.1;
    c.cada((dt, t) => {
      if (llego) return;
      const pasos = 4;
      for (let i = 0; i < pasos; i++) {
        const h = dt / pasos;
        const vx = arrastrando ? (destinoX - b.position.x) * 3 : c.sensores.inclinacion.x * 1.6;
        b.position.x = THREE.MathUtils.clamp(b.position.x + vx * h, 3.2, 5.0);
        b.position.z += 0.45 * h;
        for (const [rx, rz] of ROCAS) {
          if (Math.hypot(b.position.x - rx, b.position.z - rz) < 0.36) {
            sonido.rumor(0.4, 1500, 0.08);
            c.mal();
            b.position.copy(inicio);
            break;
          }
        }
      }
      b.position.y = 0.06 + Math.sin(t * 3) * 0.02;
      b.rotation.z = Math.sin(t * 2) * 0.15;
      b.userData.x = b.position.x;
      b.userData.z = b.position.z;
      if (b.position.z > -1.2) {
        llego = true;
        b.userData.llego = true;
        c.bien();
        void c.escena.animar(500, (q) => {
          b.position.z = -1.2 + q * 0.5;
          b.position.y = 0.06 + q * 0.02;
        });
      }
    });
    c.despues(3000, () => {
      if (c.sensores.hayMovimiento || llego) return;
      c.aviso('Sin sensor de giro: arrastra el dedo a los lados para guiar la botella.', 3500);
      const mar = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.06);
      c.gesto.mover((x, y, abajo) => {
        arrastrando = abajo;
        const p = c.enPlano(x, y, mar);
        if (p) destinoX = p.x;
      });
    });
    c.tocar(b, () => {
      if (!llego) return;
      sonido.rumor(0.2, 2400, 0.04);
      void c.ui.nota(`<p>Te escribí un mensaje en la botella…</p><p style="font-size:44px;letter-spacing:12px;text-align:center;transform:scaleX(-1)">${CODIGO_BOTELLA.join(' ')}</p><p>(lo escribí al revés, para que solo tú lo leyeras)</p>`);
    });
    candadoPuerta(c, [0, 1, 2].map(() => '0123456789'.split('')), CODIGO_BOTELLA, 'Candado de la cabaña');
  },
  async prueba(p) {
    const b = p.obj('botella');
    for (let i = 0; i < 4000 && !b.userData.llego; i++) {
      const x = b.userData.x ?? 4.1, z = b.userData.z ?? -4.8;
      const roca = ROCAS.find(([, rz]) => rz > z - 0.2 && rz < z + 2.2);
      let meta = 4.1;
      if (roca) meta = roca[0] > 4.1 ? roca[0] - 0.8 : roca[0] + 0.8;
      const d = meta - x;
      if (Math.abs(d) < 0.08) p.sensor.inclinar(0, 1);
      else p.sensor.inclinar(Math.sign(d) * Math.min(0.9, Math.abs(d) * 2), 0.6);
      await p.esperar(40);
    }
    p.sensor.soltar();
    await p.tocar('candado');
    await p.panel(CODIGO_BOTELLA.join(''));
  },
};

// ---------------------------------------------------------------------------
// 44 · El cangrejo con cosquillas
// ---------------------------------------------------------------------------
const cangrejo: Nivel = {
  titulo: 'El cangrejo con cosquillas',
  pistas: [
    'Ese cangrejo tiene algo que no es suyo.',
    'No le gusta que lo toquen… pero tiene un punto débil: es muy cosquilloso.',
    'Pasa el dedo de un lado a otro, rápido, sobre el cangrejo, hasta que suelte lo que tiene.',
  ],
  montar(c) {
    const cr = grupo('cangrejo');
    const rojo = mat('#e4574b');
    const cuerpo = esfera(0.22, rojo, undefined, 18);
    cuerpo.scale.set(1.3, 0.6, 1);
    en(cuerpo, 0, 0.14, 0);
    cr.add(cuerpo);
    for (const sx of [-1, 1]) {
      cr.add(en(cilindro(0.012, 0.012, 0.14, rojo), sx * 0.08, 0.3, 0.08), en(esfera(0.04, mat('#ffffff')), sx * 0.08, 0.38, 0.08), en(esfera(0.02, mat('#1e1a18')), sx * 0.08, 0.38, 0.11));
      const pinza = esfera(0.09, rojo, undefined, 12);
      pinza.scale.set(1, 0.7, 0.8);
      en(pinza, sx * 0.4, 0.2, 0.12);
      cr.add(pinza);
      for (let i = 0; i < 3; i++) {
        const pata = cilindro(0.015, 0.012, 0.2, rojo);
        pata.rotation.z = sx * 1.1;
        en(pata, sx * (0.3 + i * 0.02), 0.07, -0.1 + i * 0.1);
        cr.add(pata);
      }
    }
    const k = llave('llave', '#f2c75c', false);
    k.scale.setScalar(0.7);
    en(k, 0.45, 0.24, 0.18);
    cr.add(k);
    en(cr, 1.2, 0, 1.0);
    c.g.add(cr);
    const golpes: [number, number][] = [];
    let solto = false;
    c.frotar(cr, (_hit, px) => {
      if (solto) return;
      const t = c.escena.t;
      golpes.push([t, px]);
      while (golpes.length && t - golpes[0][0] > 1.2) golpes.shift();
      const total = golpes.reduce((a, [, x]) => a + x, 0);
      cr.rotation.z = Math.sin(t * 40) * 0.05;
      if (Math.random() < 0.2) sonido.nota(900 + Math.random() * 400, 0.05, 0, 'sine', 0.04);
      if (total > 450) {
        solto = true;
        cr.rotation.z = 0;
        [0, 1, 2, 3].forEach((i) => sonido.nota(700 + i * 120, 0.08, i * 0.08, 'sine', 0.06));
        const w = k.getWorldPosition(new THREE.Vector3());
        cr.remove(k);
        c.g.add(k);
        k.position.copy(w);
        k.rotation.set(-Math.PI / 2, 0, 0.3);
        void c.escena.animar(400, (q) => (k.position.y = w.y - (w.y - 0.02) * q));
        llaveParaLaPuerta(c, k);
        k.userData.suelta = true;
        void c.escena.animar(1200, (q) => (cr.position.x = 1.2 + q * 1.4));
      }
    });
  },
  async prueba(p) {
    for (let i = 0; i < 6 && !p.obj('llave').userData.suelta; i++) await p.frotar('cangrejo', 5);
    await p.esperar(600);
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 45 · Lo que deja la marea
// ---------------------------------------------------------------------------
const SIMBOLOS = ['☾', '★', '♥', '✿'];
const TODOS = ['☀', '☾', '★', '♥', '✿', '♣'];
const marea: Nivel = {
  titulo: 'Lo que deja la marea',
  pistas: [
    'El mar se lleva y trae cosas.',
    'Cuando el agua se retira, a la derecha de la cabaña quedan unos dibujos… por poco rato.',
    'Espera a que baje la marea, memoriza los dibujos de izquierda a derecha y ponlos en el candado.',
  ],
  montar(c) {
    const dib = letrero(1.8, 0.45, (cx, w, h) => SIMBOLOS.forEach((s, i) => textoEn(cx, s, w * (0.14 + i * 0.24), h / 2 + 4, h * 0.8, '#a5713f', 700)), 'dibujos', { transparente: true });
    dib.rotation.x = -Math.PI / 2;
    en(dib, 2.85, 0.012, -0.7);
    c.g.add(dib);
    const agua = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.1), new THREE.MeshStandardMaterial({ color: '#4aa6d8', transparent: true, opacity: 0.88, roughness: 0.2 }));
    agua.rotation.x = -Math.PI / 2;
    agua.name = 'marea';
    c.g.add(agua);
    let fase = 0;
    c.cada((dt) => {
      fase += dt / 7;
      const k = (Math.sin(fase * Math.PI * 2) + 1) / 2;
      const sube = k > 0.35;
      if (sube && !agua.userData.sube) sfx.ola();
      agua.userData.sube = sube;
      agua.position.set(2.85, 0.02, -1.62 + (sube ? Math.min(1, (k - 0.35) / 0.3) : 0) * 0.92);
      dib.userData.visible = !sube || k < 0.45;
      agua.scale.z = 1;
    });
    candadoPuerta(c, [0, 1, 2, 3].map(() => TODOS), SIMBOLOS, 'Candado de dibujos');
  },
  async prueba(p) {
    await p.tocar('candado');
    await p.panel(SIMBOLOS.join(''));
  },
};

// ---------------------------------------------------------------------------
// 46 · El velero de papel
// ---------------------------------------------------------------------------
const velero: Nivel = {
  titulo: 'El velero de papel',
  pistas: [
    'Ese velerito no tiene viento.',
    'Un velero sin viento no llega a ninguna parte. ¿Quién le da viento?',
    'Sopla cerquita del micrófono varias veces (o desliza el dedo sobre el velero hacia el muelle) hasta que llegue.',
  ],
  montar(c) {
    const charco = cilindro(0.85, 0.85, 0.02, new THREE.MeshStandardMaterial({ color: '#6fbfe6', roughness: 0.15 }), 'charco', 40);
    charco.scale.z = 0.55;
    en(charco, 1.25, 0.012, 1.0);
    const muelle = caja(0.3, 0.06, 0.3, mat('#8a6a3c'), 0.02);
    en(muelle, 2.2, 0.05, 1.0);
    const bandera = caja(0.12, 0.08, 0.005, mat('#e4574b'), 0.003);
    en(bandera, 2.3, 0.35, 1.0);
    c.g.add(charco, muelle, bandera, en(cilindro(0.008, 0.008, 0.35, mat('#3d2b27')), 2.24, 0.24, 1.0));
    const bote = grupo('velero');
    const casco = caja(0.24, 0.06, 0.1, mat('#fff3e0'), 0.02);
    const vela = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 3), mat('#fff8ee'));
    en(vela, 0, 0.14, 0);
    const k = llave('llave', '#f2c75c', false);
    k.scale.setScalar(0.5);
    en(k, 0.02, 0.05, 0.06);
    bote.add(casco, vela, k, new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshBasicMaterial({ visible: false })));
    en(bote, 0.55, 0.05, 1.0);
    c.g.add(bote);
    let v = 0, llego = false;
    const empujar = (f: number) => {
      if (llego) return;
      v = Math.min(0.7, v + f);
      sonido.rumor(0.5, 700, 0.06, 0, 0.5, 300);
    };
    c.sensor.soplido(() => empujar(0.35));
    c.gesto.deslizar((dir, _vel, obj) => obj === bote && dir === 'der' && empujar(0.3));
    let pidio = false;
    c.tocar(bote, async () => {
      if (llego || pidio) return;
      pidio = true;
      c.aviso('Sopla al celular…', 2200);
      if (!(await c.sensores.escuchar())) c.aviso('Sin micrófono: desliza el dedo sobre el velero hacia la derecha.', 3500);
    });
    c.alSalir(() => c.sensores.callar());
    c.cada((dt, t) => {
      bote.position.y = 0.05 + Math.sin(t * 2.5) * 0.01;
      if (llego) return;
      bote.position.x = Math.min(2.0, bote.position.x + v * dt);
      v *= Math.pow(0.55, dt);
      vela.rotation.z = -v * 0.6;
      if (bote.position.x >= 1.98) {
        llego = true;
        bote.userData.llego = true;
        c.bien();
        // El velero ya no recibe toques: así la llave que lleva encima sí se puede tomar
        c.quitarToque(bote);
        llaveParaLaPuerta(c, k);
      }
    });
  },
  async prueba(p) {
    for (let i = 0; i < 40 && !p.obj('velero').userData.llego; i++) {
      p.sensor.soplar();
      await p.esperar(400);
    }
    await p.tocar('llave');
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 47 · Los cocos
// ---------------------------------------------------------------------------
const cocos: Nivel = {
  titulo: 'Los cocos',
  pistas: [
    'Esa palmera está muy cargada.',
    'Los cocos no se bajan solos: hay que mover la palmera. Luego, a abrirlos.',
    'Sacude el celular para tumbar los cocos y ábrelos tocándolos; solo uno trae lo que buscas.',
  ],
  montar(c) {
    const cs = [0, 1, 2].map((i) => {
      const o = esfera(0.12, mat('#6b4a33', { rough: 0.9 }), `coco ${i}`, 14);
      en(o, 2.75 + (i - 1) * 0.16, 2.72, 0.02 + (i % 2) * 0.1);
      o.userData.golpes = 0;
      c.g.add(o);
      return o;
    });
    const conLlave = cs[2];
    let cayeron = false;
    const tumbar = () => {
      if (cayeron) return;
      cayeron = true;
      c.bien();
      cs.forEach((o, i) => {
        const x0 = o.position.x, y0 = o.position.y, z0 = o.position.z;
        const xf = 1.6 + i * 0.5, zf = 0.8 + (i % 2) * 0.35;
        void c.escena.animar(700 + i * 150, (q) => {
          o.position.set(x0 + (xf - x0) * q, y0 - (y0 - 0.12) * q * q, z0 + (zf - z0) * q);
          if (q >= 1) sonido.nota(160, 0.1, 0, 'sine', 0.08);
        }, (q) => q);
      });
      c.despues(1300, () => (c.g.userData.cayeron = true));
    };
    c.sensor.sacudida(tumbar);
    const palmToque = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3, 0.8), new THREE.MeshBasicMaterial({ visible: false }));
    palmToque.name = 'palmera toque';
    en(palmToque, 3.0, 1.5, -0.2);
    c.g.add(palmToque);
    let toques = 0;
    c.tocar(palmToque, () => ++toques >= 6 && tumbar());
    cs.forEach((o) => {
      c.tocar(o, () => {
        if (!cayeron || o.userData.abierto) return;
        o.userData.golpes++;
        sonido.nota(200, 0.06, 0, 'square', 0.05);
        void c.escena.animar(150, (q) => o.scale.setScalar(1 + Math.sin(q * Math.PI) * 0.1));
        if (o.userData.golpes < 2) return;
        o.userData.abierto = true;
        o.scale.set(1, 0.5, 1);
        if (o === conLlave) {
          const k = llave('llave', '#f2c75c', true);
          en(k, o.position.x, 0.2, o.position.z + 0.15);
          c.g.add(k);
          sonido.regalo();
          llaveParaLaPuerta(c, k);
        } else {
          sonido.rumor(0.3, 2000, 0.05);
          c.aviso('Solo agua de coco…', 1500);
        }
      });
    });
  },
  async prueba(p) {
    p.sensor.sacudir();
    await p.esperarQue(() => !!p.obj('acertijo 47').userData.cayeron, 20000);
    for (let i = 0; i < 3; i++) {
      await p.tocar(`coco ${i}`, 2, 150);
      if (document.querySelector('#inventario [data-item="llave"]')) break;
      try {
        await p.tocar('llave');
        break;
      } catch {
        /* este coco no tenía */
      }
    }
    await p.usar('llave', 'puerta toque');
  },
};

// ---------------------------------------------------------------------------
// 48 · El faro
// ---------------------------------------------------------------------------
const CODIGO_FARO = ['7', '2', '6'];
const faro: Nivel = {
  titulo: 'El faro',
  pistas: [
    'Ese faro no parpadea por parpadear.',
    'Los destellos largos y cortos valen distinto; en la cabaña hay una tabla que lo explica.',
    'Suma los destellos de cada grupo según la tabla: cada grupo es un número del candado. Tocar el faro repite la señal.',
  ],
  montar(c) {
    const f = grupo('faro');
    f.add(en(esfera(0.9, mat('#7a7068', { rough: 1 }), undefined, 12), 0, -0.3, 0));
    for (let i = 0; i < 4; i++) f.add(en(cilindro(0.34 - i * 0.03, 0.38 - i * 0.03, 0.55, mat(i % 2 ? '#e4574b' : '#fff8ee')), 0, 0.5 + i * 0.55, 0));
    const lampara = esfera(0.28, matNuevo('#fff6c8', { emisivo: '#ffe27a', intensidad: 0 }), 'luz faro', 16);
    en(lampara, 0, 2.85, 0);
    f.add(lampara, en(cilindro(0.001, 0.35, 0.3, mat('#3d2b27')), 0, 3.2, 0));
    en(f, -5.2, 0, -8);
    c.g.add(f);
    const tabla = letrero(0.7, 0.45, (cx, w, h) => {
      cx.fillStyle = '#c49468';
      cx.fillRect(0, 0, w, h);
      textoEn(cx, 'DESTELLOS', w / 2, h * 0.2, h * 0.14, '#3d2b27', 700);
      cx.fillStyle = '#fff6c8';
      cx.fillRect(w * 0.12, h * 0.42, w * 0.3, h * 0.1);
      textoEn(cx, '= 5', w * 0.68, h * 0.47, h * 0.18, '#3d2b27', 700);
      cx.beginPath();
      cx.arc(w * 0.27, h * 0.75, h * 0.06, 0, Math.PI * 2);
      cx.fill();
      textoEn(cx, '= 1', w * 0.68, h * 0.75, h * 0.18, '#3d2b27', 700);
    }, 'tabla destellos');
    en(tabla, 1.2, 1.7, 0.05);
    c.g.add(tabla);
    // Secuencia: [duración encendido, apagado] en segundos
    const sec: [number, number][] = [];
    for (const d of CODIGO_FARO) {
      const n = Number(d);
      for (let i = 0; i < Math.floor(n / 5); i++) sec.push([1.1, 0.4]);
      for (let i = 0; i < n % 5; i++) sec.push([0.3, 0.4]);
      sec[sec.length - 1][1] = 1.6;
    }
    sec[sec.length - 1][1] = 3.2;
    const ciclo = sec.reduce((a, [on, off]) => a + on + off, 0);
    c.cada((_, t) => {
      let x = t % ciclo, on = false;
      for (const [a, b] of sec) {
        if (x < a) {
          on = true;
          break;
        }
        x -= a;
        if (x < b) break;
        x -= b;
      }
      (lampara.material as THREE.MeshStandardMaterial).emissiveIntensity = on ? 3 : 0.1;
    });
    c.tocar(f, () => {
      const patron: number[] = [];
      for (const [on, off] of sec) patron.push(Math.round(on * 500), Math.round(off * 500));
      c.sensores.vibrar(patron);
      // La señal también se oye: bocina larga o corta
      let t = 0;
      for (const [on, off] of sec) {
        sonido.nota(196, on * 0.5, t, 'sawtooth', 0.03);
        sonido.nota(147, on * 0.5, t, 'triangle', 0.06);
        t += (on + off) * 0.5;
      }
    });
    candadoPuerta(c, [0, 1, 2].map(() => '0123456789'.split('')), CODIGO_FARO, 'Candado de la cabaña');
  },
  async prueba(p) {
    await p.tocar('candado');
    await p.panel(CODIGO_FARO.join(''));
  },
};

// ---------------------------------------------------------------------------
// 49 · Las estrellas de mar
// ---------------------------------------------------------------------------
const INICIO_APAGADAS = [0, 4, 8];
const estrellasMar: Nivel = {
  titulo: 'Las estrellas de mar',
  pistas: [
    'Esas estrellas están desordenadas.',
    'Cada estrella que tocas también cambia a sus vecinas.',
    'Busca que todas queden iguales: empieza por las apagadas y fíjate qué les pasa a las de al lado.',
  ],
  montar(c) {
    const on = Array(9).fill(true);
    const alternar = (i: number) => {
      const f = Math.floor(i / 3), k = i % 3;
      for (const [df, dk] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ff = f + df, kk = k + dk;
        if (ff >= 0 && ff < 3 && kk >= 0 && kk < 3) on[ff * 3 + kk] = !on[ff * 3 + kk];
      }
    };
    for (const i of INICIO_APAGADAS) alternar(i);
    const es = on.map((_, i) => {
      const m = matNuevo('#f6b48a', { emisivo: '#ff9a3c', intensidad: 0 });
      const e = estrella(0.34, 0.06, m, `estrella ${i}`);
      e.rotation.x = -Math.PI / 2;
      en(e, 0.65 + (i % 3) * 0.7, 0.04, 0.55 + Math.floor(i / 3) * 0.42);
      c.g.add(e);
      return e;
    });
    const pintar = () => es.forEach((e, i) => ((e.material as THREE.MeshStandardMaterial).emissiveIntensity = on[i] ? 1.1 : 0));
    pintar();
    let hecho = false;
    es.forEach((e, i) =>
      c.tocar(e, () => {
        if (hecho) return;
        alternar(i);
        pintar();
        sonido.nota(on[i] ? 880 : 440, 0.08, 0, 'sine', 0.06);
        if (on.every(Boolean)) {
          hecho = true;
          abrirYa(c, 900);
        }
      }),
    );
  },
  async prueba(p) {
    for (const i of INICIO_APAGADAS) await p.tocar(`estrella ${i}`);
  },
};

// ---------------------------------------------------------------------------
// 50 · El atardecer
// ---------------------------------------------------------------------------
const CODIGO_VELAS = ['5', '1', '9'];
const atardecer: Nivel = {
  titulo: 'El atardecer',
  pistas: [
    'Todavía es muy temprano.',
    'El sol se puede arrastrar. Al atardecer, algo en el mar cambia.',
    'Baja el sol hasta el horizonte y mira las velas de los barquitos: ahí están los números del candado.',
  ],
  montar(c) {
    const telon = c.escena.escena.getObjectByName('telon') as THREE.Mesh | undefined;
    const antes = telon ? (telon.material as THREE.MeshBasicMaterial).map : null;
    const tarde = cieloPlaya(1);
    c.alSalir(() => {
      if (telon && antes) (telon.material as THREE.MeshBasicMaterial).map = antes;
    });
    const sol = grupo('sol');
    const mSol = new THREE.MeshBasicMaterial({ color: '#ffd84a' });
    sol.add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), mSol));
    en(sol, -3.6, 2.7, -2.5);
    c.g.add(sol);
    const barcos = CODIGO_VELAS.map((d, i) => {
      const b = grupo(`barco ${i}`);
      b.add(en(caja(0.5, 0.12, 0.16, mat('#8a5e40'), 0.04), 0, 0.06, 0));
      const vela = letrero(0.32, 0.42, (cx, w, h) => {
        cx.fillStyle = '#fff8ee';
        cx.fillRect(0, 0, w, h);
      }, undefined);
      en(vela, 0, 0.36, 0);
      const num = letrero(0.28, 0.34, (cx, w, h) => textoEn(cx, d, w / 2, h / 2 + 4, h * 0.8, '#ff7a3c', 700), `numero vela ${i}`, { transparente: true, brillo: 1.4 });
      num.visible = false;
      en(num, 0, 0.36, 0.01);
      b.add(vela, num);
      en(b, 3.3 + i * 0.7, 0.02, -3.6 - i * 0.8);
      c.g.add(b);
      return num;
    });
    let puesto = false;
    const horizonte = 1.1;
    c.arrastrar(sol, {
      plano: new THREE.Plane(new THREE.Vector3(0, 0, 1), 2.5),
      limites: new THREE.Box3(new THREE.Vector3(-5.0, horizonte, -2.5), new THREE.Vector3(-2.4, 3.0, -2.5)),
      alMover: (p) => {
        const k = THREE.MathUtils.clamp((2.7 - p.y) / (2.7 - horizonte), 0, 1);
        c.escena.atenuar(1 - k * 0.35);
        mSol.color.set('#ffd84a').lerp(new THREE.Color('#ff7a3c'), k);
      },
      alSoltar: (p) => {
        if (puesto || p.y > horizonte + 0.15) return;
        puesto = true;
        c.bien();
        if (telon) (telon.material as THREE.MeshBasicMaterial).map = tarde;
        barcos.forEach((b) => (b.visible = true));
        sonido.regalo();
        sol.userData.puesto = true;
      },
    });
    candadoPuerta(c, [0, 1, 2].map(() => '0123456789'.split('')), CODIGO_VELAS, 'Candado de la cabaña');
  },
  async prueba(p) {
    await p.arrastrar('sol', new THREE.Vector3(-3.4, 1.12, -2.5), 16);
    await p.esperarQue(() => !!p.obj('sol').userData.puesto, 10000);
    await p.tocar('candado');
    await p.panel(CODIGO_VELAS.join(''));
  },
};

export const CAP5: Nivel[] = [conchas, castillo, botella, cangrejo, marea, velero, cocos, faro, estrellasMar, atardecer];
