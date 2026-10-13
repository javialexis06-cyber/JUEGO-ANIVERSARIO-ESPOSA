// Los actores del cine de la granja: Él y Ella (sus peluches de siempre) y las diosas, que son el mismo muñeco de
// peluche vestido con la ropa exclusiva de `personajes/blender/ropa_diosas.py` (vestido largo, coronas y velo) y el
// clóset de siempre (peinado, alas, capa). Las diosas flotan y brillan con un halo suave.
import * as THREE from 'three';
import { Personaje, type Cara } from '../personaje';
import { elegirModelos } from '../recursos';
import type { Pieza, RanuraAmigo } from '../salas/prendas';
import { Vestidor } from '../salas/vestir';
import type { AspectoJugador } from '../salas/tipos';
import { personajeVecino } from './vecinos3d';

export type IdDiosa = 'celia' | 'aura' | 'lara' | 'fuatia';
export interface Actor {
  /** Lo que mueve el guion (posición, giro, escala); adentro va el muñeco. */
  raiz: THREE.Group;
  p: Personaje;
  halo?: THREE.Sprite;
  luz?: THREE.PointLight;
}

const pieza = (modelo: string, ranura: RanuraAmigo, colores: Record<string, string> = {}, tambien: RanuraAmigo[] = [], oculta: string[] = []): Pieza =>
  ({ modelo, ranura, tambien, oculta, colores });

interface DisenoDiosa { piel: string; pelo: string; ojos: string; halo: string; piezas: Partial<Record<RanuraAmigo, Pieza>> }
const DIOSAS: Record<IdDiosa, DisenoDiosa> = {
  // Celia: la tierra recién nacida (pelo verde musgo, vestido de brote, corona de hojas y flores)
  celia: {
    piel: '#f0c39f', pelo: '#5f9a4c', ojos: '#3f7a3a', halo: '#e8f7c8',
    piezas: {
      pelo: pieza('pelo_ondas', 'pelo'),
      arriba: pieza('vestido_diosa', 'arriba', { principal: '#9fd08a', cinta: '#f6e7b0', bordado: '#5fa85a', joya: '#f2c94c' }, ['abajo', 'pies'], ['medias']),
      cabeza: pieza('corona_hojas', 'cabeza'),
      espalda: pieza('alas_mariposa', 'espalda', { principal: '#c8f0a8', detalle: '#7fbf63' }),
    },
  },
  // Aura: el fuego que despierta (pelo dorado, vestido de sol, corona de llamas, alas blancas)
  aura: {
    piel: '#f6d7c1', pelo: '#f0c75a', ojos: '#c9822a', halo: '#ffd98a',
    piezas: {
      pelo: pieza('pelo_ondas', 'pelo'),
      arriba: pieza('vestido_diosa', 'arriba', { principal: '#ffd36b', cinta: '#fff3c8', bordado: '#e8892b', joya: '#ff9d4a' }, ['abajo', 'pies'], ['medias']),
      cabeza: pieza('corona_llamas', 'cabeza'),
      espalda: pieza('alas_angel', 'espalda', { principal: '#fff6dc' }),
    },
  },
  // Lara: el descanso y la paz (pelo negro, vestido de noche, velo oscuro con rosas y luna, capa)
  lara: {
    piel: '#e9c2a2', pelo: '#1e1a26', ojos: '#6b55a8', halo: '#c9b2ff',
    piezas: {
      pelo: pieza('pelo_flequillo', 'pelo'),
      arriba: pieza('vestido_diosa', 'arriba', { principal: '#3a2f5c', cinta: '#c9b6ea', bordado: '#e9e4f5', joya: '#b9a4f0' }, ['abajo', 'pies'], ['medias']),
      cabeza: pieza('velo_lara', 'cabeza'),
      espalda: pieza('capa', 'espalda', { principal: '#2a2238', broche: '#c9b6ea' }),
    },
  },
  // Fuatia (la diosa que creó Laura): los cuatro elementos en un solo vestido (agua, aire, fuego y tierra), corona de
  // llamas tibias y alas de libélula; su halo cambia de color con los elementos (ver actualizarFuatia)
  fuatia: {
    piel: '#d9a982', pelo: '#2f6f73', ojos: '#e58a3a', halo: '#9fe3d6',
    piezas: {
      pelo: pieza('pelo_rizos', 'pelo'),
      arriba: pieza('vestido_diosa', 'arriba', { principal: '#3f9fa3', cinta: '#eef6f4', bordado: '#e8803a', joya: '#c79a4e' }, ['abajo', 'pies'], ['medias']),
      cabeza: pieza('corona_llamas', 'cabeza'),
      espalda: pieza('alas_mariposa', 'espalda', { principal: '#bfeee6', detalle: '#e8a05a' }),
    },
  },
};

let texturaHalo: THREE.Texture | null = null;
/** Halo radial suave (se suma a lo que hay detrás). */
export function halo(color: string, tam: number) {
  if (!texturaHalo) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.25, 'rgba(255,255,255,.55)');
    r.addColorStop(0.6, 'rgba(255,255,255,.12)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    texturaHalo = new THREE.CanvasTexture(c);
    texturaHalo.colorSpace = THREE.SRGBColorSpace;
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaHalo, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.9 }));
  s.scale.setScalar(tam);
  return s;
}

function marcarCompartido(o: THREE.Object3D) {
  o.userData.noLiberar = true;
  o.traverse((x) => { const m = x as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
}

export async function actorPareja(rol: 'el' | 'ella'): Promise<Actor> {
  await elegirModelos();
  const p = new Personaje({ x: 0, y: 0 }, rol === 'ella' ? 0.7 : 0.69);
  await p.cargarPoses(rol);
  const raiz = new THREE.Group();
  raiz.add(p.grupo);
  marcarCompartido(raiz);
  return { raiz, p };
}

export async function actorDiosa(id: IdDiosa): Promise<Actor> {
  await elegirModelos();
  const d = DIOSAS[id];
  const p = new Personaje({ x: 0, y: 0 }, 0.7);
  await p.cargarPoses('ella');
  await new Vestidor(p, 'ella').aplicar({ cuerpo: 'ella', piel: d.piel, pelo: d.pelo, detalles: { ojos: d.ojos } }, d.piezas);
  const raiz = new THREE.Group();
  raiz.add(p.grupo);
  marcarCompartido(raiz);
  // El brillo va por fuera (halo y luz propia): los materiales del muñeco se comparten con la Laura del juego
  const h = halo(d.halo, 4.6);
  h.position.set(0, 1.3, -0.6);
  h.material.opacity = 0.32;
  raiz.add(h);
  const luz = new THREE.PointLight(d.halo, 0.9, 6, 1.8);
  luz.position.set(0, 2.2, 1.6);
  raiz.add(luz);
  return { raiz, p, halo: h, luz };
}

/** Pone la pose y la cara del actor (si existe la pose). */
export function actuar(a: Actor, pose: string, cara?: Cara) {
  if (a.p.tienePose(pose) && a.p.poseVisible !== pose) a.p.pose(pose);
  if (cara) a.p.cara(cara);
}

/** Un vecino de Astra con su ropa de siempre (Serena, Eliana, Flora, Mara, Nina, Eneas, Ofelia…). */
export async function actorVecino(id: string): Promise<Actor> {
  const { p } = await personajeVecino(id);
  const raiz = new THREE.Group();
  raiz.add(p.grupo);
  marcarCompartido(raiz);
  p.quieto();
  return { raiz, p };
}

/** Un muñeco vestido a mano (el Conde antes del pacto, los invitados, la ropa de boda…). */
export async function actorVestido(cuerpo: 'el' | 'ella', aspecto: Omit<AspectoJugador, 'cuerpo'>, piezas: Partial<Record<RanuraAmigo, Pieza>> = {}, escala = 1): Promise<Actor> {
  await elegirModelos();
  const p = new Personaje({ x: 0, y: 0 }, (cuerpo === 'ella' ? 0.7 : 0.69) * escala);
  await p.cargarPoses(cuerpo);
  await new Vestidor(p, cuerpo).aplicar({ cuerpo, ...aspecto }, piezas);
  const raiz = new THREE.Group();
  raiz.add(p.grupo);
  marcarCompartido(raiz);
  return { raiz, p };
}
export { pieza as piezaRopa };
