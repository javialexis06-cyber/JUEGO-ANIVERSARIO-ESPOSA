// Los muñecos de peluche del Escudo: las Santas (Eliana, de Aura, y Serena, de Lara) con la misma ropa que tienen en
// el pueblo de la granja (src/granja-v3/vecinos3d.ts), y la ayuda para poner a cualquiera de pie junto al escudo.
import * as THREE from 'three';
import { Personaje } from '../personaje';
import { valorPieza as P } from '../salas/prendas';
import { Vestidor } from '../salas/vestir';
import type { AspectoJugador } from '../salas/tipos';

export interface Muneco {
  raiz: THREE.Group;
  p: Personaje;
  /** Pose de descanso (vuelve sola a esta). */
  quieto: string;
  /** Segundos que le quedan a una pose de acción. */
  accion: number;
  hablando: boolean;
}

/** Un muñeco de pie (sin moverse por el mapa: su posición la pone quien lo usa). */
export async function muneco(cuerpo: 'el' | 'ella', aspecto?: AspectoJugador, quieto = 'reposo'): Promise<Muneco> {
  const p = new Personaje({ x: 0, y: 0 }, cuerpo === 'ella' ? 0.7 : 0.69);
  await p.cargarPoses(cuerpo);
  if (aspecto) await new Vestidor(p, cuerpo).aplicar(aspecto);
  const raiz = new THREE.Group();
  raiz.add(p.grupo);
  raiz.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  if (p.tienePose(quieto)) p.pose(quieto, true);
  return { raiz, p, quieto, accion: 0, hablando: false };
}

const ELIANA: AspectoJugador = {
  cuerpo: 'ella', piel: '#f6d7c1', pelo: '#f0d48a',
  detalles: { peinado: P('pelo_ondas', '#f0d48a'), cabeza: P('aureola', '#ffe39a'), arriba: P('vestido_princesa', '#f6e2a8', '#ffffff'), pies: P('sandalias', '#e8c77a'),
    espalda: P('alas_angel', '#ffffff') },
};
const SERENA: AspectoJugador = {
  cuerpo: 'ella', piel: '#c98e66', pelo: '#2a2238',
  detalles: { peinado: P('pelo_flequillo', '#2a2238'), cabeza: P('tiara', '#c9b6ea'), arriba: P('vestido', '#5d4f8a', '#c9b6ea'), pies: P('botas', '#3a2f4a'),
    espalda: P('capa', '#3a2f5c') },
};

export async function santas() {
  const [eliana, serena] = await Promise.all([muneco('ella', ELIANA, 'jarras'), muneco('ella', SERENA, 'brazos_cruzados')]);
  return { eliana, serena };
}

/** Pone una pose un rato y después vuelve a la de descanso. */
export function actuar(m: Muneco, pose: string, seg = 1.6) {
  if (!m.p.tienePose(pose)) return;
  m.p.pose(pose);
  m.accion = seg;
}

/** Anima al muñeco: respira, parpadea, habla (boca y manos) y vuelve a su pose. */
export function animarMuneco(m: Muneco, dt: number, t: number) {
  if (m.accion > 0) {
    m.accion -= dt;
    if (m.accion <= 0) m.p.pose(m.quieto);
  } else if (m.hablando) {
    m.p.vaiven('hablar_a', 'hablar_b', 0.5 + 0.5 * Math.sin(t * 7));
  } else if (m.p.poseVisible !== m.quieto) m.p.pose(m.quieto);
  if (m.hablando && m.p.caraVisible !== 'hablar') m.p.cara('hablar');
  if (!m.hablando && m.p.caraVisible === 'hablar') m.p.cara('normal');
  m.p.update(dt);
}
