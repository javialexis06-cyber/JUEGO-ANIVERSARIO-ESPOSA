// El Escudo de las Hermanas, versión de la pareja: Javier y Laura defienden el escudo en P23 (el Lazo Primordial) con
// la Constelación de los Amantes encima. Ningún recuerdo del chat: solo el mito (docs/la-pareja.md, «Quién cuenta qué»).
// En la versión para amigos este archivo se cambia por src/amigos/sin_pareja/escudo.ts (SUSTITUTOS en vite.config.ts).
import * as THREE from 'three';
import { NOMBRE_PAREJA } from '../nombres';
import { actuar, animarMuneco, muneco, type Muneco } from './actores';
import type { Linea } from './guion';

export const CON_PAREJA = true;

/** Dónde están las voces de estas líneas. */
export const VOCES_PAREJA: string = 'audio/escudo-pareja/';

/** Las líneas que nombran a la pareja (los mismos ids que su versión para amigos). */
export const LINEAS_PAREJA: Record<string, Linea> = {
  IN5: { id: 'IN5', quien: 'narrador', texto: `${NOMBRE_PAREJA.el} y ${NOMBRE_PAREJA.ella} llegaron al Borde. Sobre ellos, la Constelación de los Amantes volvió a brillar.`,
    d: `[warm, wonder] ${NOMBRE_PAREJA.el} y ${NOMBRE_PAREJA.ella} llegaron al Borde. [pause] Sobre ellos, la Constelación de los Amantes volvió a brillar.` },
  FI5: { id: 'FI5', quien: 'narrador', texto: `${NOMBRE_PAREJA.el} tomó la mano de ${NOMBRE_PAREJA.ella}. Esa estrella no sería su casa: su casa eran ellos dos.`,
    d: `[tender, slow] ${NOMBRE_PAREJA.el} tomó la mano de ${NOMBRE_PAREJA.ella}. [pause] Esa estrella no sería su casa... su casa eran ellos dos.` },
  LZ1: { id: 'LZ1', quien: 'narrador', texto: 'La Constelación de los Amantes brilla: nada cruza el escudo.', d: '[awed, strong] La Constelación de los Amantes brilla: ¡nada cruza el escudo!' },
};

/** La tercera habilidad. */
export const LAZO = { nombre: 'El Lazo', titulo: 'El Lazo Primordial', desc: 'La Constelación de los Amantes brilla: por 9 s nada daña el escudo y todo pega 30 % más.' };

/** Texto de la escena del principio y del final, en orden (ids de guion.ts o de aquí). */
export const ESCENA_INICIO = ['IN1', 'IN5', 'IN2', 'IN3', 'IN4'];
export const ESCENA_FINAL = ['FI1', 'FI2', 'FI3', 'FI4', 'FI5'];

export interface Defensores {
  grupo: THREE.Group;
  /** 'reposo' | 'lazo' | 'gano' | 'perdio' | 'mano' (se toman de la mano al final). */
  estado(e: string): void;
  actualizar(dt: number, t: number): void;
  hablante(quien: string | null): void;
}

/** Javier y Laura, de pie junto al ancla del escudo (frente: hacia la ceniza, -x). */
export async function defensores(fin: [number, number]): Promise<Defensores | null> {
  const [el, ella] = await Promise.all([muneco('el', undefined, 'brazos_cruzados'), muneco('ella', undefined, 'jarras')]);
  const grupo = new THREE.Group();
  const poner = (m: Muneco, z: number) => {
    m.raiz.position.set(fin[0] - 0.2, 0, fin[1] + z);
    m.raiz.rotation.y = -Math.PI / 2 + (z > 0 ? -0.35 : 0.35);
    grupo.add(m.raiz);
  };
  poner(el, -3.7);
  poner(ella, 3.7);
  return {
    grupo,
    estado(e) {
      if (e === 'lazo') { actuar(el, 'senalar_arriba', 3); actuar(ella, 'senalar_arriba', 3); }
      else if (e === 'gano') { actuar(el, 'celebrar', 4); actuar(ella, 'aplauso_a', 4); el.p.cara('feliz'); ella.p.cara('feliz'); }
      else if (e === 'perdio') { actuar(el, 'triste', 4); actuar(ella, 'triste', 4); el.p.cara('triste'); ella.p.cara('triste'); }
      else if (e === 'mano') {
        // Se acercan al centro y se toman de la mano (el final de P23)
        el.raiz.position.set(fin[0] - 0.9, 0, fin[1] - 0.45);
        ella.raiz.position.set(fin[0] - 0.9, 0, fin[1] + 0.45);
        el.raiz.rotation.y = ella.raiz.rotation.y = -Math.PI / 2;
        el.quieto = 'abrazo_der';
        ella.quieto = 'abrazo_izq';
        el.p.cara('feliz');
        ella.p.cara('feliz');
      }
    },
    actualizar(dt, t) {
      animarMuneco(el, dt, t);
      animarMuneco(ella, dt, t);
    },
    hablante() { /* (en el Escudo no hablan: el narrador cuenta lo de ellos) */ },
  };
}

/** La Constelación de los Amantes: dos manos entrelazadas de estrellas, en el cielo sobre el escudo. */
export function constelacion(): { grupo: THREE.Group; actualizar(t: number, fuerza: number): void } | null {
  const grupo = new THREE.Group();
  // Dos manos que se buscan: muñeca, palma, pulgar y cuatro dedos que se cruzan en el centro
  const mano = (s: number): [number, number][] => [
    [s * -4.2, -3.2], [s * -3.0, -1.6], [s * -2.0, -0.6], [s * -2.6, 0.9], [s * -1.0, 0.9], [s * 0.4, 1.4], [s * -0.6, 0.1], [s * 0.7, 0.5], [s * -0.6, -0.7], [s * 0.6, -0.5],
  ];
  const lineas: [number, number][] = [[0, 1], [1, 2], [2, 3], [2, 4], [4, 5], [2, 6], [6, 7], [2, 8], [8, 9]];
  const tex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.2, 'rgba(255,240,220,.8)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const estrellas: THREE.Sprite[] = [];
  const mats: THREE.LineBasicMaterial[] = [];
  for (const [s, color] of [[1, '#ffd9a0'], [-1, '#d9ccff']] as const) {
    const pts = mano(s);
    for (const [x, y] of pts) {
      const e = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      e.position.set(x, y, 0);
      e.scale.setScalar(0.9);
      grupo.add(e);
      estrellas.push(e);
    }
    const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, fog: false });
    mats.push(m);
    for (const [a, b] of lineas) {
      grupo.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...pts[a], 0), new THREE.Vector3(...pts[b], 0)]), m));
    }
  }
  grupo.scale.setScalar(1.5);
  return {
    grupo,
    actualizar(t, fuerza) {
      estrellas.forEach((e, i) => {
        e.material.opacity = (0.55 + 0.45 * Math.sin(t * 1.7 + i * 1.3)) * (0.6 + 0.4 * fuerza);
        e.scale.setScalar(0.8 + fuerza * 0.9 + 0.15 * Math.sin(t * 2.3 + i));
      });
      for (const m of mats) m.opacity = 0.3 + 0.5 * fuerza;
    },
  };
}
