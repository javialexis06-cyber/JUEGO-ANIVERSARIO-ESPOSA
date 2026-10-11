// Los vecinos del pueblo con el mismo estilo de peluche de Javier y Laura: el muñeco base (cuerpo de él o de ella),
// vestido con el clóset de los amigos (`salas/vestir.ts`) según el oficio de cada uno. Se arma de una (grupo vacío)
// y se viste cuando llegan los modelos, así el pueblo no espera.
import * as THREE from 'three';
import { Personaje } from '../personaje';
import { elegirModelos } from '../recursos';
import { Vestidor } from '../salas/vestir';
import { valorPieza } from '../salas/prendas';
import type { AspectoJugador } from '../salas/tipos';

interface Diseno {
  c: 'el' | 'ella';
  piel: string; pelo: string;
  /** «modelo#color#color2» de cada ranura (como `valorPieza`). */
  peinado: string; cabeza?: string; cara?: string; arriba: string; abajo?: string; pies: string; espalda?: string;
  ojos?: string;
}
const P = valorPieza;
const PIELES = ['#f3cfb3', '#e5b48f', '#c98e66', '#a8714d', '#f6d7c1', '#8d5a3b'];
/** Cada vecino con la ropa de su oficio (y un detallito propio). */
const DISENOS: Record<string, Diseno> = {
  mercader: { c: 'ella', piel: PIELES[1], pelo: '#5a3a28', peinado: P('pelo_ondas', '#5a3a28'), cabeza: P('sombrero_paja', '#e8c77a'), arriba: P('delantal', '#5fa05e', '#f7c948'), abajo: P('falda_larga', '#c4553f'), pies: P('sandalias', '#a8774f') },
  cuidadora: { c: 'ella', piel: PIELES[2], pelo: '#3a2a22', peinado: P('pelo_trenzas', '#3a2a22', '#e4566b'), cabeza: P('sombrero_vaquero', '#b48759'), arriba: P('camisa_cuadros', '#d9604e', '#f6efe2'), abajo: P('overol', '#4f79a8'), pies: P('botas', '#7a5134') },
  carpintera: { c: 'ella', piel: PIELES[0], pelo: '#b0532f', peinado: P('pelo_cola', '#b0532f', '#2f8f68'), cabeza: P('panoleta', '#2f8f68', '#f6cf5a'), arriba: P('camisa', '#f2e2c4'), abajo: P('overol', '#6b8a5a'), pies: P('botas', '#6b4a33') },
  herrero: { c: 'el', piel: PIELES[3], pelo: '#2b2422', peinado: P('pelo_rapado', '#2b2422'), cabeza: P('panoleta', '#3d3d3d', '#e4574b'), cara: P('barba', '#2b2422'), arriba: P('delantal', '#7a4e33', '#3a2a20'), abajo: P('pantalon', '#3e4248'), pies: P('botas', '#3b2a22') },
  veterinaria: { c: 'ella', piel: PIELES[4], pelo: '#2e2522', peinado: P('pelo_cola', '#2e2522', '#9ccbef'), cara: P('gafas_redondas', '#7a625a'), arriba: P('bata_medico', '#f7f5ef'), abajo: P('pantalon', '#8fb7c9'), pies: P('zapatos', '#f4f1ea') },
  posadera: { c: 'ella', piel: PIELES[1], pelo: '#7a4a2a', peinado: P('pelo_mono_bajo', '#7a4a2a'), arriba: P('delantal', '#f4b6c2', '#8d5f9a'), abajo: P('falda_larga', '#8d5f9a'), pies: P('zapatos', '#6b4a33') },
  archivero: { c: 'el', piel: PIELES[0], pelo: '#cfc8bf', peinado: P('pelo_calvo', '#cfc8bf'), cara: P('gafas_redondas', '#3d2b27'), arriba: P('saco_corbatin', '#6b5a7a', '#c4553f'), abajo: P('pantalon', '#4a4152'), pies: P('zapatos', '#3b2a22') },
  canalizadora_aura: { c: 'ella', piel: PIELES[4], pelo: '#f0d48a', peinado: P('pelo_ondas', '#f0d48a'), cabeza: P('aureola', '#ffe39a'), arriba: P('vestido_princesa', '#f6e2a8', '#ffffff'), pies: P('sandalias', '#e8c77a'), espalda: P('alas_angel', '#ffffff') },
  canalizadora_lara: { c: 'ella', piel: PIELES[2], pelo: '#2a2238', peinado: P('pelo_flequillo', '#2a2238'), cabeza: P('tiara', '#c9b6ea'), arriba: P('vestido', '#5d4f8a', '#c9b6ea'), pies: P('botas', '#3a2f4a'), espalda: P('capa', '#3a2f5c') },
  pescadora: { c: 'ella', piel: PIELES[3], pelo: '#3b2a22', peinado: P('pelo_colitas', '#3b2a22', '#f6cf5a'), cabeza: P('sombrero_pescador', '#e3d2a8'), arriba: P('chaqueta', '#f6cf5a'), abajo: P('bermuda', '#4f79a8'), pies: P('botas_lluvia', '#2f8f68') },
  minero: { c: 'el', piel: PIELES[2], pelo: '#3b2a22', peinado: P('pelo_copete', '#3b2a22'), cabeza: P('casco_minero', '#f0b323'), cara: P('bigote', '#3b2a22'), arriba: P('camiseta', '#8a6a4a'), abajo: P('overol', '#5a6670'), pies: P('botas', '#3b2a22') },
  exploradora: { c: 'ella', piel: PIELES[1], pelo: '#a45a2a', peinado: P('pelo_cola', '#a45a2a', '#7fae55'), cabeza: P('sombrero_vaquero', '#a8774f'), arriba: P('chaleco', '#8a7a4a'), abajo: P('short', '#6b5a3a'), pies: P('botas', '#6b4a33'), espalda: P('mochila', '#7fae55') },
  cocinero: { c: 'el', piel: PIELES[1], pelo: '#4a3226', peinado: P('pelo_lado', '#4a3226'), cabeza: P('gorro_chef', '#ffffff'), cara: P('bigote', '#4a3226'), arriba: P('delantal', '#f6f2ea', '#e4566b'), abajo: P('pantalon', '#3d3d3d'), pies: P('zapatos', '#2b2422') },
  botanica: { c: 'ella', piel: PIELES[0], pelo: '#6b4a2a', peinado: P('pelo_rizado', '#6b4a2a'), cabeza: P('flor_pelo', '#f4a7b9'), arriba: P('blusa', '#9fcb6a', '#ffffff'), abajo: P('falda', '#5f8a4a'), pies: P('sandalias', '#a8774f') },
  agricultor: { c: 'el', piel: PIELES[2], pelo: '#2b2422', peinado: P('pelo_lado', '#2b2422'), cabeza: P('sombrero_vueltiao', '#f3ead8', '#2b2422'), arriba: P('camisa_cuadros', '#c4553f', '#f6efe2'), abajo: P('overol', '#4f79a8'), pies: P('botas', '#6b4a33') },
  maestra: { c: 'ella', piel: PIELES[4], pelo: '#4a3226', peinado: P('pelo_mono', '#4a3226'), cara: P('gafas_redondas', '#c4553f'), arriba: P('sueter', '#e3a066'), abajo: P('falda_larga', '#6b5a7a'), pies: P('zapatos', '#6b4a33') },
  musica: { c: 'ella', piel: PIELES[5], pelo: '#2b2422', peinado: P('pelo_rizado', '#2b2422'), cabeza: P('boina', '#e4574b'), arriba: P('camisa_hawaiana', '#f6cf5a', '#e4574b'), abajo: P('pantalon', '#3e4248'), pies: P('tenis', '#ffffff') },
  guardabosques: { c: 'el', piel: PIELES[3], pelo: '#5a3a28', peinado: P('pelo_lado', '#5a3a28'), cabeza: P('gorro_lana', '#4e7a45'), cara: P('barba', '#5a3a28'), arriba: P('chaqueta', '#5f7a45'), abajo: P('pantalon', '#6b5a3a'), pies: P('botas', '#3b2a22'), espalda: P('mochila', '#a8774f') },
  artesana: { c: 'ella', piel: PIELES[2], pelo: '#8a3a2a', peinado: P('pelo_trenzas', '#8a3a2a', '#f6cf5a'), cabeza: P('diadema_mono', '#f4a7b9'), arriba: P('sueter_corazones', '#f4b6c2'), abajo: P('falda', '#7a625a'), pies: P('sandalias', '#a8774f') },
  astronoma: { c: 'ella', piel: PIELES[0], pelo: '#1f1d2e', peinado: P('pelo_corto', '#1f1d2e'), cara: P('gafas_estrella', '#f6cf5a'), arriba: P('vestido', '#2c3566', '#f6cf5a'), pies: P('botas', '#2c2a3e'), espalda: P('capa', '#1e2550') },
  // El vecino mayor, paisa de los de antes: ruana, sombrero arriero y carriel
  veterano: { c: 'el', piel: PIELES[1], pelo: '#e6e1da', peinado: P('pelo_calvo', '#e6e1da'), cabeza: P('sombrero_arriero', '#f3ebd9', '#1e1d1d'), cara: P('bigote', '#e6e1da'), arriba: P('ruana', '#8a5a3c', '#f6f2ea'), abajo: P('pantalon', '#6b6458'), pies: P('zapatos', '#3b2a22'), espalda: P('carriel', '#6b4632') },
  nina: { c: 'ella', piel: PIELES[1], pelo: '#3b2a22', peinado: P('pelo_colitas', '#3b2a22', '#e4566b'), arriba: P('camiseta_estrella', '#9ccbef'), abajo: P('falda', '#e4566b'), pies: P('tenis', '#f4b6c2') },
  // La camiseta de la Selección, como debe ser
  nino: { c: 'el', piel: PIELES[2], pelo: '#2b2422', peinado: P('pelo_rapado', '#2b2422'), cabeza: P('gorra', '#2f5fa8', '#e4574b'), arriba: P('camiseta_futbol', '#f6cf5a', '#2f5fa8'), abajo: P('short', '#2f5fa8'), pies: P('tenis', '#ffffff') },
  viajera: { c: 'ella', piel: PIELES[3], pelo: '#c98a4a', peinado: P('pelo_ondas', '#c98a4a'), cabeza: P('sombrero_arriero', '#c9a46a', '#3a2a20'), arriba: P('ruana', '#8e2e43', '#f1e4cc'), abajo: P('pantalon', '#6b5a3a'), pies: P('botas', '#6b4a33'), espalda: P('mochila', '#4f79a8') },
};

function aspecto(d: Diseno): AspectoJugador {
  const det: Record<string, string> = { peinado: d.peinado, arriba: d.arriba, pies: d.pies };
  for (const k of ['cabeza', 'cara', 'abajo', 'espalda'] as const) if (d[k]) det[k] = d[k]!;
  if (d.ojos) det.ojos = d.ojos;
  return { cuerpo: d.c, piel: d.piel, pelo: d.pelo, detalles: det };
}

let modelosListos: Promise<void> | null = null;
/** Los vecinos que nadie anima (adentro de una casa o de un local) respiran y parpadean solos, a 30 cuadros. */
const vivos = new Set<THREE.Object3D>();
let ultimo = 0;
function latir(t: number) {
  requestAnimationFrame(latir);
  if (document.hidden || t - ultimo < 33) return;
  const dt = Math.min(0.1, (t - ultimo) / 1000);
  ultimo = t;
  for (const g of vivos) {
    if (!g.parent) { if (g.userData.sacado) vivos.delete(g); continue; }
    if (t - (g.userData.animadoEn ?? 0) > 120) animarVecino(g, dt, false, t);
  }
}
if (typeof window !== 'undefined') requestAnimationFrame(latir);

/** Grupo del vecino (se viste solo cuando llegan los modelos). `userData.legs` queda vacío por compatibilidad. */
export function vecinoPeluche(id: string, index: number): THREE.Group {
  const g = new THREE.Group();
  g.userData.legs = [];
  g.userData.seed = index;
  g.userData.peluche = true;
  const d = DISENOS[id] ?? DISENOS[Object.keys(DISENOS)[index % Object.keys(DISENOS).length]];
  const p = new Personaje({ x: 0, y: 0 }, d.c === 'ella' ? 0.7 : 0.69);
  g.add(p.grupo);
  g.userData.personaje = p;
  vivos.add(g);
  void (async () => {
    modelosListos ??= elegirModelos();
    await modelosListos;
    await p.cargarPoses(d.c);
    await new Vestidor(p, d.c).aplicar(aspecto(d));
    p.quieto();
  })().catch((e) => console.warn('vecino', id, e));
  return g;
}

/** Anima al vecino: caminando (vaivén de piernas) o quieto respirando. */
export function animarVecino(g: THREE.Object3D, dt: number, andando: boolean, ahora = performance.now()) {
  const p = g.userData.personaje as Personaje | undefined;
  if (!p) return;
  g.userData.animadoEn = ahora;
  if (andando) {
    g.userData.fase = (g.userData.fase ?? 0) + dt * 5;
    p.vaiven(p.poseCaminar[0], p.poseCaminar[1], 0.5 + 0.5 * Math.sin(g.userData.fase));
  } else if (p.poseVisible !== p.poseQuieto) p.quieto();
  p.update(Math.min(0.1, dt));
}

/** Antes de soltar el pueblo: los vecinos comparten modelos con Javier y Laura, así que se sacan sin destruirlos. */
export function sacarVecinos(raiz: THREE.Object3D) {
  const vecinos: THREE.Object3D[] = [];
  raiz.traverse((o) => { if (o.userData.peluche) vecinos.push(o); });
  for (const v of vecinos) { v.userData.sacado = true; v.removeFromParent(); vivos.delete(v); }
}
