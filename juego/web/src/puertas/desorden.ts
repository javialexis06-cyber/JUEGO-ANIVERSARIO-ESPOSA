// El desorden de cada cuarto: cosas del escenario regadas por el piso, colgadas en la pared o encima de un cajón,
// que se pueden levantar, arrastrar y lanzar (gravedad, rebote, roce y paredes). Las frágiles se rompen en pedazos
// si se estrellan duro contra el piso o una pared. Algunas esconden algo debajo: una notica de amor o una pista
// falsa. Se acomodan sin tapar nunca la puerta ni lo del acertijo, y se duermen cuando quedan quietas (así no
// gastan nada en el celular).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { texturaRelieve } from '../recursos';
import { CUARTO } from './cuarto';
import type { Escena } from './escena';
import { OJO } from './escena';
import { estrellaForma, lienzo, matNuevo, textoEn, FUENTE } from './kit';
import type { Ctx } from './nivel';
import { HUECO } from './puerta';
import { Mascara, pintar, rectDeCaja } from './revision';
import * as sfx from './sonidos';
import { esc } from './ui';

// ---------------------------------------------------------------------------
// Moldes: cada cosa se arma con piezas simples y se funde en una sola malla con colores por vértice
// ---------------------------------------------------------------------------
type V3 = [number, number, number];
interface Parte {
  g: THREE.BufferGeometry;
  c: string;
  p?: V3;
  r?: V3;
  s?: V3;
  /** Brilla (llama, foco): va en una malla aparte sin sombras. */
  luz?: boolean;
}

interface Molde {
  partes: () => Parte[];
  rompible?: boolean;
  /** Rebota como pelota. */
  rebote?: number;
  /** Se cuelga en la pared (no cae hasta que alguien lo toma). */
  colgado?: boolean;
  /** Otras cosas pueden quedar encima (cajones, bancos). */
  soporte?: boolean;
  /** Color de los pedazos si se rompe. */
  pedazos?: string;
}

const cil = (rt: number, rb: number, h: number, seg = 16) => new THREE.CylinderGeometry(rt, rb, h, seg);
const cubo = (w: number, h: number, d: number, r = 0.012) => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.2, h / 2.2, d / 2.2));
const bola = (r: number, seg = 14) => new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7));
const aro = (r: number, t: number, arco = Math.PI * 2) => new THREE.TorusGeometry(r, t, 8, 20, arco);
const cono = (r: number, h: number, seg = 14) => new THREE.ConeGeometry(r, h, seg);
const estrellaGeo = (r: number, grosor: number) => {
  const g = new THREE.ExtrudeGeometry(estrellaForma(r, 0.45), { depth: grosor, bevelEnabled: true, bevelSize: grosor * 0.4, bevelThickness: grosor * 0.4, bevelSegments: 2, curveSegments: 4 });
  g.translate(0, 0, -grosor / 2);
  return g;
};

const M: Record<string, Molde> = {
  jarron: { rompible: true, pedazos: '#8EC5F0', partes: () => [
    { g: bola(0.1), c: '#8EC5F0', p: [0, 0.11, 0], s: [1, 1.15, 1] },
    { g: cil(0.05, 0.065, 0.1), c: '#8EC5F0', p: [0, 0.25, 0] },
    { g: aro(0.052, 0.012), c: '#fff8ee', p: [0, 0.3, 0], r: [Math.PI / 2, 0, 0] },
    { g: aro(0.1, 0.01), c: '#fff8ee', p: [0, 0.12, 0], r: [Math.PI / 2, 0, 0] },
  ] },
  florero: { rompible: true, pedazos: '#f4b6c2', partes: () => [
    { g: cil(0.06, 0.08, 0.2), c: '#f4b6c2', p: [0, 0.1, 0] },
    { g: cil(0.008, 0.008, 0.18), c: '#3c7a62', p: [0, 0.27, 0] },
    { g: cil(0.008, 0.008, 0.16), c: '#3c7a62', p: [0.03, 0.26, 0.01], r: [0, 0, -0.3] },
    { g: bola(0.035), c: '#e4574b', p: [0, 0.37, 0] },
    { g: bola(0.03), c: '#F7C948', p: [0.07, 0.33, 0.01] },
  ] },
  taza: { rompible: true, pedazos: '#fff8ee', partes: () => [
    { g: cil(0.055, 0.045, 0.1), c: '#fff8ee', p: [0, 0.05, 0] },
    { g: aro(0.03, 0.009, Math.PI), c: '#fff8ee', p: [0.058, 0.05, 0], r: [0, 0, -Math.PI / 2] },
    { g: cil(0.05, 0.05, 0.005), c: '#6b4226', p: [0, 0.095, 0] },
  ] },
  plato: { rompible: true, pedazos: '#fff8ee', partes: () => [
    { g: cil(0.12, 0.08, 0.025, 20), c: '#fff8ee', p: [0, 0.0125, 0] },
    { g: aro(0.1, 0.006), c: '#8EC5F0', p: [0, 0.026, 0], r: [Math.PI / 2, 0, 0] },
  ] },
  vaso: { rompible: true, pedazos: '#cfe8f5', partes: () => [
    { g: cil(0.045, 0.038, 0.13), c: '#cfe8f5', p: [0, 0.065, 0] },
    { g: cil(0.04, 0.036, 0.07), c: '#F59F6A', p: [0, 0.04, 0] },
  ] },
  botella: { rompible: true, pedazos: '#6fbf8f', partes: () => [
    { g: cil(0.045, 0.045, 0.18), c: '#6fbf8f', p: [0, 0.09, 0] },
    { g: cil(0.018, 0.04, 0.07), c: '#6fbf8f', p: [0, 0.215, 0] },
    { g: cil(0.02, 0.02, 0.03), c: '#e4574b', p: [0, 0.26, 0] },
    { g: cil(0.047, 0.047, 0.07), c: '#fff8ee', p: [0, 0.09, 0] },
  ] },
  maceta: { rompible: true, pedazos: '#c96a3c', partes: () => [
    { g: cil(0.1, 0.075, 0.14), c: '#c96a3c', p: [0, 0.07, 0] },
    { g: cil(0.105, 0.105, 0.03), c: '#b85c30', p: [0, 0.14, 0] },
    { g: bola(0.07), c: '#5f9e4f', p: [0, 0.2, 0] },
    { g: bola(0.055), c: '#6fb24f', p: [0.05, 0.24, 0.02] },
    { g: bola(0.05), c: '#4f8e42', p: [-0.05, 0.23, -0.02] },
  ] },
  frasco: { rompible: true, pedazos: '#dff1fb', partes: () => [
    { g: cil(0.06, 0.06, 0.13), c: '#dff1fb', p: [0, 0.065, 0] },
    { g: cil(0.062, 0.062, 0.03), c: '#e4574b', p: [0, 0.145, 0] },
    { g: bola(0.03), c: '#F7C948', p: [0, 0.05, 0], luz: true },
  ] },
  copa: { rompible: true, pedazos: '#f2c75c', partes: () => [
    { g: cil(0.06, 0.025, 0.09), c: '#f2c75c', p: [0, 0.16, 0] },
    { g: cil(0.01, 0.01, 0.1), c: '#f2c75c', p: [0, 0.07, 0] },
    { g: cil(0.045, 0.05, 0.02), c: '#f2c75c', p: [0, 0.01, 0] },
  ] },
  jarra: { rompible: true, pedazos: '#b8784a', partes: () => [
    { g: bola(0.09), c: '#b8784a', p: [0, 0.1, 0], s: [1, 1.1, 1] },
    { g: cil(0.045, 0.06, 0.08), c: '#b8784a', p: [0, 0.22, 0] },
    { g: aro(0.05, 0.012, Math.PI), c: '#b8784a', p: [0.08, 0.15, 0], r: [0, 0, -Math.PI / 2] },
  ] },
  bombillo: { rompible: true, pedazos: '#fff6c8', partes: () => [
    { g: bola(0.06), c: '#fff6c8', p: [0, 0.1, 0], luz: true },
    { g: cil(0.03, 0.03, 0.05), c: '#9aa4b0', p: [0, 0.025, 0] },
  ] },
  farolito: { rompible: true, pedazos: '#fff3c4', partes: () => [
    { g: cubo(0.12, 0.16, 0.12, 0.02), c: '#3d2b27', p: [0, 0.08, 0] },
    { g: cubo(0.09, 0.12, 0.13, 0.01), c: '#ffe7a0', p: [0, 0.08, 0], luz: true },
    { g: aro(0.035, 0.008, Math.PI), c: '#3d2b27', p: [0, 0.17, 0] },
  ] },
  gnomo: { rompible: true, pedazos: '#e4574b', partes: () => [
    { g: cil(0.07, 0.09, 0.14), c: '#3b5ea8', p: [0, 0.07, 0] },
    { g: bola(0.055), c: '#f7d2b6', p: [0, 0.18, 0] },
    { g: bola(0.05), c: '#fff8ee', p: [0, 0.15, 0.03] },
    { g: cono(0.065, 0.16), c: '#e4574b', p: [0, 0.28, 0] },
  ] },
  marco: { rompible: true, colgado: true, pedazos: '#c49468', partes: () => [
    { g: cubo(0.32, 0.26, 0.03, 0.01), c: '#c49468', p: [0, 0.13, 0] },
    { g: cubo(0.24, 0.18, 0.012, 0.004), c: '#9ccbef', p: [0, 0.13, 0.012] },
    { g: bola(0.04), c: '#f59fc0', p: [0, 0.12, 0.02], s: [1, 1, 0.2] },
  ] },
  espejito: { rompible: true, colgado: true, pedazos: '#dfe8f0', partes: () => [
    { g: cil(0.14, 0.14, 0.03, 24), c: '#d9b25a', p: [0, 0.14, 0], r: [Math.PI / 2, 0, 0] },
    { g: cil(0.115, 0.115, 0.012, 24), c: '#dfe8f0', p: [0, 0.14, 0.012], r: [Math.PI / 2, 0, 0] },
  ] },
  reloj: { rompible: true, colgado: true, pedazos: '#fff8ee', partes: () => [
    { g: cil(0.13, 0.13, 0.04, 24), c: '#e4574b', p: [0, 0.13, 0], r: [Math.PI / 2, 0, 0] },
    { g: cil(0.11, 0.11, 0.012, 24), c: '#fff8ee', p: [0, 0.13, 0.02], r: [Math.PI / 2, 0, 0] },
    { g: cubo(0.012, 0.08, 0.006, 0.002), c: '#3d2b27', p: [0, 0.16, 0.03] },
    { g: cubo(0.06, 0.012, 0.006, 0.002), c: '#3d2b27', p: [0.025, 0.13, 0.03] },
  ] },
  libros: { partes: () => [
    { g: cubo(0.24, 0.05, 0.17), c: '#3b5ea8', p: [0, 0.025, 0] },
    { g: cubo(0.22, 0.045, 0.16), c: '#e4574b', p: [0.01, 0.073, 0], r: [0, 0.15, 0] },
    { g: cubo(0.2, 0.04, 0.15), c: '#F7C948', p: [-0.01, 0.116, 0], r: [0, -0.1, 0] },
  ] },
  cojin: { partes: () => [
    { g: cubo(0.36, 0.12, 0.3, 0.05), c: '#c9b6ea', p: [0, 0.06, 0] },
    { g: bola(0.02), c: '#fff8ee', p: [0, 0.12, 0] },
  ] },
  pelota: { rebote: 0.72, partes: () => [
    { g: bola(0.09, 18), c: '#e4574b', p: [0, 0.09, 0] },
    { g: aro(0.091, 0.012), c: '#fff8ee', p: [0, 0.09, 0], r: [0.4, 0, 0] },
  ] },
  lana: { rebote: 0.3, partes: () => [
    { g: bola(0.075, 16), c: '#f59fc0', p: [0, 0.075, 0] },
    { g: aro(0.076, 0.008), c: '#e37fa4', p: [0, 0.075, 0], r: [1, 0.3, 0] },
    { g: aro(0.076, 0.008), c: '#e37fa4', p: [0, 0.075, 0], r: [0.2, 1.2, 0] },
  ] },
  caja: { soporte: true, partes: () => [
    { g: cubo(0.42, 0.3, 0.32, 0.015), c: '#c9a06a', p: [0, 0.15, 0] },
    { g: cubo(0.43, 0.012, 0.06, 0.004), c: '#e8d3a8', p: [0, 0.3, 0] },
  ] },
  cajon: { soporte: true, partes: () => [
    { g: cubo(0.5, 0.36, 0.36, 0.02), c: '#a8784a', p: [0, 0.18, 0] },
    { g: cubo(0.52, 0.05, 0.37, 0.01), c: '#8a5e40', p: [0, 0.09, 0] },
    { g: cubo(0.52, 0.05, 0.37, 0.01), c: '#8a5e40', p: [0, 0.27, 0] },
  ] },
  banquito: { soporte: true, partes: () => [
    { g: cil(0.2, 0.2, 0.05, 20), c: '#c49468', p: [0, 0.4, 0] },
    { g: cil(0.022, 0.03, 0.38), c: '#8a5e40', p: [0.12, 0.19, 0.06], r: [0, 0, 0.1] },
    { g: cil(0.022, 0.03, 0.38), c: '#8a5e40', p: [-0.12, 0.19, 0.06], r: [0, 0, -0.1] },
    { g: cil(0.022, 0.03, 0.38), c: '#8a5e40', p: [0, 0.19, -0.13], r: [0.1, 0, 0] },
  ] },
  pantufla: { partes: () => [
    { g: cubo(0.12, 0.05, 0.26, 0.025), c: '#f4b6c2', p: [0, 0.025, 0] },
    { g: bola(0.06), c: '#fff8ee', p: [0, 0.06, 0.07], s: [1, 0.6, 1] },
  ] },
  vela: { partes: () => [
    { g: cil(0.04, 0.04, 0.16), c: '#fff3e0', p: [0, 0.08, 0] },
    { g: cil(0.055, 0.06, 0.02), c: '#d9b25a', p: [0, 0.01, 0] },
    { g: cono(0.018, 0.05), c: '#ffcf5a', p: [0, 0.19, 0], luz: true },
  ] },
  peluche: { partes: () => [
    { g: bola(0.09), c: '#b98a5e', p: [0, 0.09, 0], s: [1, 1.05, 0.9] },
    { g: bola(0.07), c: '#b98a5e', p: [0, 0.22, 0] },
    { g: bola(0.028), c: '#b98a5e', p: [0.055, 0.28, 0] },
    { g: bola(0.028), c: '#b98a5e', p: [-0.055, 0.28, 0] },
    { g: bola(0.03), c: '#e8d0b0', p: [0, 0.21, 0.06] },
    { g: bola(0.012), c: '#3d2b27', p: [0.025, 0.24, 0.06] },
    { g: bola(0.012), c: '#3d2b27', p: [-0.025, 0.24, 0.06] },
  ] },
  regalo: { partes: () => [
    { g: cubo(0.22, 0.18, 0.22, 0.02), c: '#e4574b', p: [0, 0.09, 0] },
    { g: cubo(0.04, 0.185, 0.225, 0.005), c: '#F7C948', p: [0, 0.09, 0] },
    { g: cubo(0.225, 0.185, 0.04, 0.005), c: '#F7C948', p: [0, 0.09, 0] },
    { g: aro(0.035, 0.01), c: '#F7C948', p: [0.02, 0.2, 0], r: [0, 0.6, 0] },
    { g: aro(0.035, 0.01), c: '#F7C948', p: [-0.02, 0.2, 0], r: [0, -0.6, 0] },
  ] },
  piedra: { partes: () => [
    { g: bola(0.1, 9), c: '#a39a90', p: [0, 0.06, 0], s: [1.2, 0.6, 1] },
    { g: bola(0.05, 7), c: '#8f867c', p: [0.07, 0.05, 0.02], s: [1, 0.7, 1] },
  ] },
  balde: { partes: () => [
    { g: cil(0.1, 0.08, 0.16), c: '#8EC5F0', p: [0, 0.08, 0] },
    { g: aro(0.09, 0.008, Math.PI), c: '#5b6b7e', p: [0, 0.16, 0] },
  ] },
  regadera: { partes: () => [
    { g: cil(0.08, 0.08, 0.14), c: '#8FD6B9', p: [0, 0.07, 0] },
    { g: cil(0.012, 0.018, 0.16), c: '#8FD6B9', p: [0.11, 0.12, 0], r: [0, 0, -0.9] },
    { g: aro(0.05, 0.01, Math.PI), c: '#6aa98f', p: [-0.03, 0.15, 0], r: [0, 0, 0.3] },
  ] },
  pina: { partes: () => [
    { g: cono(0.05, 0.13, 8), c: '#8a5e40', p: [0, 0.075, 0], r: [Math.PI, 0, 0] },
    { g: bola(0.045, 8), c: '#9a6a44', p: [0, 0.1, 0], s: [1, 1.2, 1] },
  ] },
  manzana: { partes: () => [
    { g: bola(0.06), c: '#e4574b', p: [0, 0.06, 0] },
    { g: cil(0.005, 0.005, 0.03), c: '#5e3d28', p: [0, 0.125, 0] },
    { g: bola(0.018), c: '#6fb24f', p: [0.015, 0.125, 0], s: [1.4, 0.4, 0.8] },
  ] },
  coco: { rebote: 0.25, partes: () => [
    { g: bola(0.09, 12), c: '#7a5232', p: [0, 0.09, 0] },
    { g: bola(0.015), c: '#3d2b27', p: [0.03, 0.16, 0.05] },
  ] },
  concha: { partes: () => [
    { g: bola(0.08, 12), c: '#f59fc0', p: [0, 0.03, 0], s: [1, 0.45, 0.8] },
    { g: aro(0.055, 0.008, Math.PI), c: '#fff3e0', p: [0, 0.03, 0], r: [-Math.PI / 2, 0, 0] },
  ] },
  estrellita: { partes: () => [{ g: estrellaGeo(0.1, 0.03), c: '#f59f6a', p: [0, 0.025, 0], r: [-Math.PI / 2, 0, 0] }] },
  sandalia: { partes: () => [
    { g: cubo(0.1, 0.025, 0.24, 0.012), c: '#F7C948', p: [0, 0.0125, 0] },
    { g: aro(0.035, 0.008, Math.PI), c: '#3b5ea8', p: [0, 0.025, 0.04], r: [0, Math.PI / 2, 0] },
  ] },
  cono: { partes: () => [
    { g: cubo(0.22, 0.03, 0.22, 0.01), c: '#e4574b', p: [0, 0.015, 0] },
    { g: cono(0.08, 0.3), c: '#f5873c', p: [0, 0.17, 0] },
    { g: cil(0.06, 0.068, 0.04), c: '#fff8ee', p: [0, 0.16, 0] },
  ] },
  maletita: { partes: () => [
    { g: cubo(0.34, 0.26, 0.14, 0.03), c: '#3b5ea8', p: [0, 0.13, 0] },
    { g: aro(0.05, 0.012, Math.PI), c: '#3d2b27', p: [0, 0.26, 0] },
    { g: cubo(0.06, 0.08, 0.145, 0.01), c: '#f59fc0', p: [0.09, 0.14, 0] },
  ] },
  mochila: { partes: () => [
    { g: cubo(0.26, 0.32, 0.16, 0.06), c: '#8FD6B9', p: [0, 0.16, 0] },
    { g: cubo(0.18, 0.12, 0.05, 0.03), c: '#6aa98f', p: [0, 0.1, 0.09] },
  ] },
  vasoPapel: { partes: () => [
    { g: cil(0.045, 0.035, 0.12), c: '#fff8ee', p: [0, 0.06, 0] },
    { g: cil(0.048, 0.048, 0.015), c: '#8a5e40', p: [0, 0.125, 0] },
    { g: cil(0.047, 0.042, 0.04), c: '#c9a06a', p: [0, 0.06, 0] },
  ] },
  lata: { partes: () => [
    { g: cil(0.035, 0.035, 0.12), c: '#e4574b', p: [0, 0.06, 0] },
    { g: cil(0.036, 0.036, 0.03), c: '#fff8ee', p: [0, 0.06, 0] },
  ] },
  periodico: { partes: () => [
    { g: cubo(0.3, 0.03, 0.22, 0.008), c: '#e8e6e0', p: [0, 0.015, 0], r: [0, 0.2, 0] },
    { g: cubo(0.2, 0.004, 0.04, 0.001), c: '#6b6b6b', p: [0, 0.032, -0.05], r: [0, 0.2, 0] },
  ] },
  barril: { soporte: true, partes: () => [
    { g: cil(0.17, 0.17, 0.42, 16), c: '#8a5e40', p: [0, 0.21, 0] },
    { g: aro(0.172, 0.012), c: '#4a4f58', p: [0, 0.08, 0], r: [Math.PI / 2, 0, 0] },
    { g: aro(0.172, 0.012), c: '#4a4f58', p: [0, 0.34, 0], r: [Math.PI / 2, 0, 0] },
  ] },
  casco: { partes: () => [
    { g: bola(0.11, 14), c: '#9aa4b0', p: [0, 0.02, 0], s: [1, 0.9, 1] },
    { g: cubo(0.03, 0.12, 0.02, 0.005), c: '#6b7680', p: [0, 0.08, 0.1] },
  ] },
  pergamino: { partes: () => [
    { g: cil(0.03, 0.03, 0.26), c: '#efe0bf', p: [0, 0.03, 0], r: [0, 0, Math.PI / 2] },
    { g: aro(0.032, 0.006), c: '#b83a52', p: [0, 0.03, 0], r: [0, Math.PI / 2, 0] },
  ] },
  cofrecito: { partes: () => [
    { g: cubo(0.24, 0.14, 0.16, 0.02), c: '#8a5e40', p: [0, 0.07, 0] },
    { g: cil(0.08, 0.08, 0.24, 12), c: '#9a6a44', p: [0, 0.14, 0], r: [0, 0, Math.PI / 2], s: [1, 1, 0.9] },
    { g: cubo(0.04, 0.05, 0.02, 0.005), c: '#f2c75c', p: [0, 0.12, 0.085] },
  ] },
  tuerca: { partes: () => [{ g: new THREE.TorusGeometry(0.06, 0.025, 6, 6), c: '#9aa4b0', p: [0, 0.025, 0], r: [Math.PI / 2, 0, 0] }] },
  herramientas: { soporte: true, partes: () => [
    { g: cubo(0.4, 0.18, 0.2, 0.02), c: '#e4574b', p: [0, 0.09, 0] },
    { g: aro(0.06, 0.012, Math.PI), c: '#4a4f58', p: [0, 0.18, 0] },
  ] },
  tanque: { partes: () => [
    { g: cil(0.07, 0.07, 0.34), c: '#dfe6ee', p: [0, 0.17, 0] },
    { g: bola(0.07), c: '#dfe6ee', p: [0, 0.34, 0], s: [1, 0.5, 1] },
    { g: cil(0.02, 0.02, 0.05), c: '#e4574b', p: [0, 0.39, 0] },
  ] },
  robotito: { partes: () => [
    { g: cubo(0.16, 0.14, 0.12, 0.02), c: '#9ccbef', p: [0, 0.09, 0] },
    { g: cubo(0.12, 0.09, 0.1, 0.02), c: '#c9d3dd', p: [0, 0.21, 0] },
    { g: bola(0.018), c: '#6ac8ff', p: [0.03, 0.22, 0.05], luz: true },
    { g: bola(0.018), c: '#6ac8ff', p: [-0.03, 0.22, 0.05], luz: true },
    { g: cil(0.005, 0.005, 0.06), c: '#6b7680', p: [0, 0.28, 0] },
    { g: bola(0.014), c: '#e4574b', p: [0, 0.315, 0], luz: true },
  ] },
  pantallita: { rompible: true, pedazos: '#0d1a2e', partes: () => [
    { g: cubo(0.26, 0.18, 0.05, 0.015), c: '#8a94a8', p: [0, 0.09, 0] },
    { g: cubo(0.21, 0.13, 0.01, 0.004), c: '#5af0a0', p: [0, 0.09, 0.027], luz: true },
  ] },
  palomitas: { partes: () => [
    { g: cil(0.07, 0.05, 0.16), c: '#e4574b', p: [0, 0.08, 0] },
    { g: cil(0.071, 0.051, 0.16, 8), c: '#fff8ee', p: [0, 0.08, 0], s: [1.001, 1, 0.3] },
    { g: bola(0.035), c: '#fff3c4', p: [0.02, 0.17, 0] },
    { g: bola(0.03), c: '#fff3c4', p: [-0.025, 0.175, 0.02] },
    { g: bola(0.03), c: '#fff3c4', p: [0, 0.18, -0.03] },
  ] },
  bolo: { partes: () => [
    { g: bola(0.045), c: '#fff8ee', p: [0, 0.06, 0], s: [1, 1.3, 1] },
    { g: cil(0.022, 0.035, 0.08), c: '#fff8ee', p: [0, 0.14, 0] },
    { g: bola(0.03), c: '#fff8ee', p: [0, 0.19, 0] },
    { g: aro(0.024, 0.006), c: '#e4574b', p: [0, 0.155, 0], r: [Math.PI / 2, 0, 0] },
  ] },
  manzanaDulce: { partes: () => [
    { g: bola(0.055), c: '#c0283c', p: [0, 0.06, 0] },
    { g: cil(0.006, 0.006, 0.12), c: '#e8d3a8', p: [0, 0.15, 0] },
  ] },
  hongo: { partes: () => [
    { g: cil(0.03, 0.04, 0.1), c: '#f6f1e6', p: [0, 0.05, 0] },
    { g: bola(0.08), c: '#e4574b', p: [0, 0.11, 0], s: [1, 0.55, 1] },
    { g: bola(0.012), c: '#fff8ee', p: [0.03, 0.15, 0.03] },
  ] },
  tronquito: { soporte: true, partes: () => [
    { g: cil(0.14, 0.16, 0.3, 12), c: '#6b4a32', p: [0, 0.15, 0] },
    { g: cil(0.13, 0.13, 0.012, 12), c: '#c9a06a', p: [0, 0.305, 0] },
  ] },
  bellota: { partes: () => [
    { g: bola(0.035), c: '#a8784a', p: [0, 0.04, 0], s: [1, 1.2, 1] },
    { g: bola(0.037), c: '#6b4a32', p: [0, 0.07, 0], s: [1, 0.5, 1] },
  ] },
  calabaza: { partes: () => [
    { g: bola(0.1, 12), c: '#f5873c', p: [0, 0.08, 0], s: [1.2, 0.8, 1.2] },
    { g: cil(0.012, 0.015, 0.05), c: '#5e3d28', p: [0, 0.17, 0] },
  ] },
  canasta: { partes: () => [
    { g: cil(0.13, 0.1, 0.12), c: '#c9a06a', p: [0, 0.06, 0] },
    { g: aro(0.11, 0.01, Math.PI), c: '#a8784a', p: [0, 0.12, 0] },
    { g: bola(0.05), c: '#e4574b', p: [0.03, 0.12, 0.02] },
  ] },
  sombrero: { partes: () => [
    { g: cil(0.16, 0.16, 0.015, 20), c: '#3d2b27', p: [0, 0.008, 0] },
    { g: cil(0.08, 0.09, 0.14, 16), c: '#3d2b27', p: [0, 0.08, 0] },
    { g: cil(0.092, 0.092, 0.03, 16), c: '#e4574b', p: [0, 0.03, 0] },
  ] },
  estrellaJuguete: { rebote: 0.4, partes: () => [{ g: estrellaGeo(0.1, 0.05), c: '#F7C948', p: [0, 0.1, 0] }] },
  planetita: { rebote: 0.55, partes: () => [
    { g: bola(0.07, 16), c: '#c9b6ea', p: [0, 0.08, 0] },
    { g: aro(0.1, 0.01), c: '#F7C948', p: [0, 0.08, 0], r: [1.2, 0.3, 0] },
  ] },
};

/** Lo que se riega en cada capítulo (se repite con otros colores). */
const REGADO: Record<number, { piso: string[]; pared: string[]; encima: string[] }> = {
  1: { piso: ['cajon', 'jarron', 'libros', 'cojin', 'pantufla', 'lana', 'pelota', 'maceta', 'caja', 'florero'], pared: ['marco', 'reloj', 'espejito'], encima: ['taza', 'vela', 'plato', 'florero', 'libros'] },
  2: { piso: ['maceta', 'gnomo', 'balde', 'regadera', 'piedra', 'pina', 'manzana', 'pelota', 'cajon', 'maceta'], pared: ['marco'], encima: ['maceta', 'frasco', 'manzana', 'regadera'] },
  3: { piso: ['cajon', 'botella', 'jarra', 'cojin', 'caja', 'maceta', 'banquito'], pared: ['marco', 'reloj'], encima: ['taza', 'plato', 'vaso', 'taza', 'jarra', 'botella', 'florero'] },
  4: { piso: ['maletita', 'mochila', 'cono', 'vasoPapel', 'lata', 'periodico', 'caja', 'maletita', 'botella'], pared: ['reloj', 'marco'], encima: ['vasoPapel', 'lata', 'taza'] },
  5: { piso: ['balde', 'pelota', 'coco', 'concha', 'estrellita', 'sandalia', 'botella', 'coco', 'cajon', 'vaso'], pared: [], encima: ['concha', 'vaso', 'botella', 'coco'] },
  6: { piso: ['tronquito', 'hongo', 'piedra', 'pina', 'bellota', 'calabaza', 'canasta', 'farolito', 'frasco', 'hongo'], pared: [], encima: ['farolito', 'frasco', 'bellota', 'pina'] },
  7: { piso: ['barril', 'peluche', 'pelota', 'bolo', 'bolo', 'palomitas', 'sombrero', 'manzanaDulce', 'botella', 'caja'], pared: ['espejito'], encima: ['botella', 'palomitas', 'manzanaDulce', 'bolo', 'vaso'] },
  8: { piso: ['barril', 'cofrecito', 'casco', 'jarra', 'pergamino', 'manzana', 'cajon', 'copa', 'vela'], pared: ['espejito', 'marco'], encima: ['copa', 'jarra', 'vela', 'plato', 'copa'] },
  9: { piso: ['herramientas', 'tanque', 'robotito', 'tuerca', 'casco', 'pantallita', 'planetita', 'estrellaJuguete', 'caja'], pared: ['pantallita'], encima: ['bombillo', 'frasco', 'tuerca', 'pantallita'] },
  10: { piso: ['cajon', 'peluche', 'regalo', 'cojin', 'florero', 'libros', 'jarron', 'caja', 'lana'], pared: ['marco', 'marco', 'reloj'], encima: ['vela', 'taza', 'florero', 'regalo', 'plato'] },
};

/** Colores para variar (la misma cosa no sale igual dos veces). */
const OTROS = ['#8EC5F0', '#f4b6c2', '#F7C948', '#8FD6B9', '#c9b6ea', '#F59F6A', '#fff8ee', '#9ccbef'];

let matBase: THREE.MeshStandardMaterial | null = null;
let matLuz: THREE.MeshBasicMaterial | null = null;
const geos = new Map<string, { cuerpo: THREE.BufferGeometry; luz: THREE.BufferGeometry | null; medio: THREE.Vector3; color: string }>();

function color(c: string) {
  return new THREE.Color(c).convertSRGBToLinear();
}

/** Funde las piezas de un molde (con un tono) en una geometría centrada en su caja. */
function fundir(id: string, tono: number) {
  const k = `${id}|${tono}`;
  const hecho = geos.get(k);
  if (hecho) return hecho;
  const molde = M[id];
  const partes = molde.partes();
  // El primer color del molde cambia de tono (el resto queda igual: blanco, dorado, detalles)
  const principal = partes[0].c;
  const cambiar = tono > 0 ? OTROS[(tono * 3 + id.length) % OTROS.length] : null;
  const cuerpo: THREE.BufferGeometry[] = [], luz: THREE.BufferGeometry[] = [];
  for (const p of partes) {
    let g = p.g.index ? p.g.toNonIndexed() : p.g.clone();
    for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    const mtx = new THREE.Matrix4().compose(
      new THREE.Vector3(...(p.p ?? [0, 0, 0])),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...(p.r ?? [0, 0, 0]))),
      new THREE.Vector3(...(p.s ?? [1, 1, 1])),
    );
    g.applyMatrix4(mtx);
    const col = color(cambiar && p.c === principal ? cambiar : p.c);
    const n = g.attributes.position.count;
    const cs = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) cs.set([col.r, col.g, col.b], i * 3);
    g.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3));
    (p.luz ? luz : cuerpo).push(g);
    p.g.dispose();
  }
  const cu = mergeGeometries(cuerpo)!;
  const lu = luz.length ? mergeGeometries(luz) : null;
  const caja = new THREE.Box3().setFromBufferAttribute(cu.attributes.position as THREE.BufferAttribute);
  if (lu) caja.union(new THREE.Box3().setFromBufferAttribute(lu.attributes.position as THREE.BufferAttribute));
  const centro = caja.getCenter(new THREE.Vector3());
  cu.translate(-centro.x, -centro.y, -centro.z);
  lu?.translate(-centro.x, -centro.y, -centro.z);
  const r = { cuerpo: cu, luz: lu, medio: caja.getSize(new THREE.Vector3()).multiplyScalar(0.5), color: cambiar && molde.pedazos === principal ? cambiar : molde.pedazos ?? principal };
  geos.set(k, r);
  return r;
}

function mallaDe(id: string, tono: number) {
  matBase ??= (() => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78 });
    m.normalMap = texturaRelieve();
    m.normalScale.set(0.35, 0.35);
    return m;
  })();
  matLuz ??= new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  const f = fundir(id, tono);
  const g = new THREE.Group();
  const cu = new THREE.Mesh(f.cuerpo, matBase);
  cu.castShadow = true;
  cu.receiveShadow = true;
  g.add(cu);
  if (f.luz) g.add(new THREE.Mesh(f.luz, matLuz));
  return { obj: g, medio: f.medio.clone(), color: f.color };
}

// ---------------------------------------------------------------------------
// Lo que se esconde debajo: noticas de amor y pistas falsas (que parecen claves pero no abren nada)
// ---------------------------------------------------------------------------
/** Pistas falsas de cada capítulo: se ven como claves, pero ninguna abre nada. */
export const FALSAS: Record<number, string[]> = {
  1: ['Cajita: 3 · 9 · 2', 'Mercado: 2 panes, 6 huevos, 1 leche y chocolatinas (¡muchas!)', 'Wifi: TeAmo1509'],
  2: ['Riego: lunes 7, miércoles 1, viernes 9', 'Semillas: ☀ ✿ ☾', 'Reja: 6 · 0 · 3 · 1'],
  3: ['Mesa 4: la cuenta es 31', 'Candado del baño: 7 4 8', 'Receta: leche, canela, taza, cafetera'],
  4: ['Andén 7 → Bogotá', 'Maleta azul: 1 · 3 · 5', 'Silla 22B, ventana'],
  5: ['Marea alta: 4:15', 'Cabaña 3: 8 · 4 · 2', 'Destellos: largo, largo, corto'],
  6: ['El búho dijo: 3 · 3 · 1', 'SOL', 'Luna llena primero'],
  7: ['Premio mayor: 5 · 2 · 7 · 1', 'Tiquete 0 1 5 2', '♣ ◆ ♠ ♥'],
  8: ['Bodega: 2 · 8 · 0 · 3', 'Aquí manda el DRAGÓN', 'Pócima: 3 gotas verdes'],
  9: ['Frecuencia 99.5 · código 7 1 3', '·− −−− ·−· ·', 'Batería: 60 %'],
  10: ['Comprar velas: 2 · 6', 'Clave vieja: 🐶 · 14 · B', 'Receta de la abuela: primero el azúcar'],
};

const NOTICAS = [
  'Te debo un beso por cada puerta. Ya voy perdiendo la cuenta.',
  'Nota mental: decirte hoy que estás muy linda.',
  'Si encuentras esto, ya sabes: te amo.',
  'Lista de cosas favoritas: 1. Tú. 2. Tú dormid{a|o}. 3. Tu risa.',
  'Vale por un abrazo de los largos.',
  'Aquí no hay nada… solo yo pensando en ti.',
];

const COSITAS = ['un arete', 'una moneda de chocolate', 'un botón', 'una media sin pareja', 'un caramelo de menta', 'una hebilla del pelo'];

type TipoEscondido = 'falsa' | 'notica' | 'cosita';
interface Escondido {
  obj: THREE.Object3D;
  visto: boolean;
  tipo: TipoEscondido;
  /** Cuál de los escondidos de la puerta es (para el texto). */
  i: number;
}

/** Dónde quedó cada cosa del desorden (lo que viaja al otro celular en pareja). */
export interface PlanoDesorden {
  cosas: { id: string; tono: number; p: number[]; yaw: number }[];
  esc: { k: number; tipo: TipoEscondido; i: number; p: number[]; giro: number }[];
}

// ---------------------------------------------------------------------------
// Cuerpos: física sencilla de cajas que no giran al chocar (solo por lucirse en el aire)
// ---------------------------------------------------------------------------
interface Cuerpo {
  id: string;
  /** Variante de color (para armar la misma cosa en el otro celular). */
  tono: number;
  obj: THREE.Group;
  h: THREE.Vector3;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  giro: THREE.Vector3;
  molde: Molde;
  color: string;
  dormido: boolean;
  tomado: boolean;
  colgado: boolean;
  quieto: number;
  plano: THREE.Plane;
  lim: THREE.Box3;
  muestras: { t: number; p: THREE.Vector3 }[];
  escondido?: Escondido;
  origen: THREE.Vector3;
  yaw: number;
  roto: boolean;
  /** Veces que se ha corrido solo porque quedó tapando algo. */
  empujes: number;
  /** A dónde va saltando (para no resbalar al caer). */
  salto: THREE.Vector3 | null;
}

interface Pedazo {
  m: THREE.Mesh;
  vel: THREE.Vector3;
  giro: THREE.Vector3;
  vida: number;
}

const G = 9.8;
/** Rapidez del choque (m/s) a la que se rompe lo frágil. */
const ROMPE = 5.2;
const PASO = 1 / 90;

export interface OpDesorden {
  /** Cuántas cosas regar (por defecto 8–12 según el capítulo). */
  cuantas?: number;
  /** Sin desorden (acertijos donde cualquier toque cuenta). */
  nada?: boolean;
}

export interface Zonas {
  /** Rectángulos de la pantalla (px) donde no va nada (la interfaz). */
  interfaz: { x0: number; y0: number; x1: number; y1: number }[];
  /** Cajas del mundo donde se para el narrador. */
  narrador: THREE.Box3[];
  /** Qué hacer cuando algo se rompe (el narrador pone cara). */
  alRomper?: (primera: boolean) => void;
  /** Quién habla ({a|o}) para las noticas. */
  voz: (t: string) => string;
  /** Semilla del desorden (en pareja los dos celulares riegan lo mismo). Por defecto sale del número de la puerta. */
  semilla?: number;
  /** Lo importante de la puerta en la pantalla (vista general): nada se queda quieto encima. */
  protegida?: () => Mascara | null;
  /** Quien escribe las noticas (para firmarlas). */
  firma?: string;
}

export class Desorden {
  grupo = new THREE.Group();
  cuerpos: Cuerpo[] = [];
  private pedazos: Pedazo[] = [];
  private muebles: THREE.Box3[] = [];
  private puertaRect = { x0: 0, y0: 0, x1: 0, y1: 0 };
  /** La cámara de la vista general (la de verdad puede estar acercada a algo). */
  private vista: THREE.Camera | null = null;
  private rotos = 0;
  private acum = 0;
  private azar: () => number;
  private X0 = -CUARTO.ancho / 2 + 0.02;
  private X1 = CUARTO.ancho / 2 - 0.02;
  private Z0 = 0.03;
  private Z1 = 3.3;

  constructor(private c: Ctx, private escena: Escena, private cap: number, private zonas: Zonas) {
    this.grupo.name = 'desorden';
    let s = Math.abs(Math.floor(zonas.semilla ?? c.n * 7919 + 17)) % 2147483646 || 1;
    this.azar = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    escena.escena.add(this.grupo);
    c.alSalir(() => this.quitar());
    c.cada((dt) => this.paso(dt));
  }

  /** Riega las cosas del capítulo donde no tapen nada. */
  sembrar(op: OpDesorden = {}) {
    if (op.nada) return;
    const cam = this.escena.camara;
    const W = window.innerWidth, H = window.innerHeight;
    this.vista = cam.clone();
    this.escena.escena.updateMatrixWorld(true);
    cam.updateMatrixWorld();
    // Lo prohibido: la puerta con su marco, todo lo del acertijo (hasta lo que aparece después), la interfaz
    // y donde se para el narrador
    const prohibido = new Mascara(W, H);
    const marco = new THREE.Box3(new THREE.Vector3(-HUECO.w / 2 - 0.3, -0.02, 0), new THREE.Vector3(HUECO.w / 2 + 0.3, HUECO.h + 0.4, 0.2));
    const pr = rectDeCaja(marco, cam, W, H);
    this.puertaRect = rectDeCaja(new THREE.Box3(new THREE.Vector3(-HUECO.w / 2 - 0.15, 0, 0), new THREE.Vector3(HUECO.w / 2 + 0.15, HUECO.h + 0.15, 0.05)), cam, W, H);
    prohibido.rect(pr.x0, pr.y0, pr.x1, pr.y1);
    // Todo lo del acertijo, también lo que está escondido y aparece después (menos las áreas de toque invisibles
    // y los efectos de pantalla completa)
    pintar(prohibido, this.c.g, cam, { saltar: (o) => o.name.startsWith('oscuridad') || ((o as THREE.Mesh).isMesh && (o as THREE.Mesh).material && ((o as THREE.Mesh).material as THREE.Material).visible === false), ocultas: true });
    for (const r of this.zonas.interfaz) prohibido.rect(r.x0, r.y0, r.x1, r.y1);
    // Obstáculos del mundo: lo del acertijo, lo fijo del escenario (menos paredes, piso, cielos, tapetes y lo pegado
    // a la pared, que ya cuenta en la pantalla) y donde se para el narrador
    const obst: THREE.Box3[] = [...this.zonas.narrador];
    const sumar = (raiz: THREE.Object3D, muebles: boolean) => {
      for (const o of raiz.children) {
        if (o.name === 'puerta' || o.name.startsWith('oscuridad')) continue;
        const b = new THREE.Box3().setFromObject(o);
        if (b.isEmpty()) continue;
        const t = b.getSize(new THREE.Vector3());
        if (Math.max(t.x, t.z) > 3.2 || b.max.z < 0.12 || t.y < 0.06) continue;
        obst.push(b.clone().expandByScalar(0.05));
        // Lo que está parado en el piso y es de buen tamaño sirve para que las cosas caigan encima
        if (muebles && o.name !== 'reservado' && b.min.y < 0.15 && t.y > 0.2 && t.y < 1.4 && Math.max(t.x, t.z) > 0.25 && Math.max(t.x, t.z) < 2.6) this.muebles.push(b);
      }
    };
    sumar(this.c.g, true);
    const cuarto = this.escena.escena.getObjectByName('cuarto');
    if (cuarto) sumar(cuarto, false);

    const reg = REGADO[this.cap] ?? REGADO[1];
    const meta = op.cuantas ?? 9 + Math.floor(this.azar() * 4);
    const puestos: THREE.Box3[] = [];
    const rects: { x0: number; y0: number; x1: number; y1: number }[] = [];
    const libre = (caja: THREE.Box3, ignorar?: THREE.Box3) => {
      if (obst.some((b) => b.intersectsBox(caja))) return false;
      if (puestos.some((b) => b !== ignorar && b.intersectsBox(caja))) return false;
      const r = rectDeCaja(caja, cam, W, H);
      if (!isFinite(r.x0) || r.x0 < 4 || r.x1 > W - 4 || r.y0 < 4 || r.y1 > H - 4) return false;
      if (prohibido.tocaRect(r.x0 - 2, r.y0 - 2, r.x1 + 2, r.y1 + 2)) return false;
      // Que no se tapen mucho entre ellas
      const area = (r.x1 - r.x0) * (r.y1 - r.y0);
      for (const o of rects) {
        const ix = Math.min(r.x1, o.x1) - Math.max(r.x0, o.x0), iy = Math.min(r.y1, o.y1) - Math.max(r.y0, o.y0);
        if (ix > 0 && iy > 0 && ix * iy > area * 0.35) return false;
      }
      rects.push(r);
      return true;
    };
    const poner = (id: string, tono: number, donde: (h: THREE.Vector3) => THREE.Vector3 | null, intentos = 40) => {
      const { obj, medio, color } = mallaDe(id, tono);
      for (let i = 0; i < intentos; i++) {
        const centro = donde(medio);
        if (!centro) continue;
        const caja = new THREE.Box3(centro.clone().sub(medio), centro.clone().add(medio));
        if (!libre(caja)) continue;
        puestos.push(caja);
        return this.agregar(id, obj, medio, color, centro, tono);
      }
      return null;
    };
    const alPiso = (h: THREE.Vector3) => new THREE.Vector3(-3.4 + this.azar() * 6.8, h.y, 0.12 + h.z + this.azar() * 1.25);
    const enPared = (h: THREE.Vector3) => {
      const lado = this.azar() < 0.5 ? -1 : 1;
      return new THREE.Vector3(lado * (1.25 + this.azar() * 2.2), 1.25 + this.azar() * 1.2, this.Z0 + h.z + 0.005);
    };
    let n = 0;
    let tono = 0;
    // Primero un par de cosas donde poner otras encima (cajones, bancos) y lo de la pared
    const bases = reg.piso.filter((id) => M[id].soporte);
    const sueltas = reg.piso.filter((id) => !M[id].soporte);
    for (const id of bases.slice(0, 2)) {
      const b = poner(id, tono++ % 3, alPiso);
      if (!b) continue;
      n++;
      // Encima: una o dos cositas
      const arriba = new THREE.Box3().setFromCenterAndSize(b.pos, b.h.clone().multiplyScalar(2));
      for (let k = 0; k < 2 && n < meta; k++) {
        const id2 = reg.encima[Math.floor(this.azar() * reg.encima.length)];
        const puesto = poner(id2, tono++ % 4, (h: THREE.Vector3) => {
          const x = arriba.min.x + h.x + this.azar() * Math.max(0, arriba.max.x - arriba.min.x - 2 * h.x);
          const z = arriba.min.z + h.z + this.azar() * Math.max(0, arriba.max.z - arriba.min.z - 2 * h.z);
          return new THREE.Vector3(x, arriba.max.y + 0.004 + h.y, z);
        }, 6);
        if (puesto) n++;
      }
    }
    for (const id of reg.pared) {
      if (n >= meta) break;
      if (poner(id, tono++ % 4, enPared, 30)) n++;
    }
    for (let i = 0; n < meta && i < sueltas.length * 3; i++) {
      const id = sueltas[(i + Math.floor(this.azar() * 3)) % sueltas.length];
      if (poner(id, tono++ % 5, alPiso, 60)) n++;
    }
    this.esconder();
  }

  /** Algunas cosas guardan algo debajo: una pista falsa, una notica o una cosita perdida. */
  private esconder() {
    const piso = this.cuerpos.filter((b) => !b.colgado && b.pos.y - b.h.y < 0.05 && b.h.x > 0.05 && b.h.z > 0.05);
    const barajar = piso.sort(() => this.azar() - 0.5);
    const falsas = FALSAS[this.cap] ?? [];
    const cosas: TipoEscondido[] = [];
    if (falsas.length) cosas.push('falsa');
    if (this.azar() < 0.6) cosas.push(this.azar() < 0.55 ? 'notica' : 'cosita');
    cosas.forEach((tipo, i) => {
      const b = barajar[i];
      if (!b) return;
      // Encima de lo que haya en el piso en ese punto (un tapete, una alfombra del acertijo): nunca por debajo
      this.ponerEscondido(b, tipo, i, new THREE.Vector3(b.pos.x, this.alturaPiso(b.pos.x, b.pos.z) + 0.004, b.pos.z), (this.azar() - 0.5) * 0.5);
    });
  }

  private ponerEscondido(b: Cuerpo, tipo: TipoEscondido, i: number, donde: THREE.Vector3, giro: number) {
    const falsas = FALSAS[this.cap] ?? [];
    const obj = tipo === 'cosita' ? cosita() : papelito(tipo === 'falsa');
    obj.position.copy(donde);
    obj.rotation.y = giro;
    obj.visible = false;
    this.grupo.add(obj);
    b.escondido = { obj, visto: false, tipo, i };
    this.conEscondido.push(b);
    {
      const texto =
        tipo === 'falsa'
          ? falsas[(this.c.n + i) % falsas.length]
          : tipo === 'notica'
            ? this.zonas.voz(NOTICAS[(this.c.n * 3) % NOTICAS.length])
            : COSITAS[this.c.n % COSITAS.length];
      // Con prioridad: aunque algo le quede delante, el toque le llega (son chiquitos y viven debajo de las cosas)
      this.c.tocar(obj, () => {
        if (!obj.visible) return;
        sfx.papel();
        if (tipo === 'cosita') {
          this.c.aviso(`Encontraste ${texto}. Nada que ver con la puerta… creo.`);
          this.c.bien();
          void this.escena.animar(380, (k) => {
            obj.position.y += 0.012;
            obj.scale.setScalar(Math.max(0.01, 1 - k));
          }).then(() => (obj.visible = false));
          this.c.quitarToque(obj);
          this.papeles = this.papeles.filter((p) => p !== obj);
          return;
        }
        // Se levanta un poquito al leerlo
        const y0 = obj.position.y;
        void this.escena.animar(260, (k) => (obj.position.y = y0 + Math.sin(k * Math.PI) * 0.06));
        const firma = tipo === 'notica' && this.zonas.firma ? `<span class="papelito-firma">— ${esc(this.zonas.firma)} ♥</span>` : '';
        const que = tipo === 'falsa' ? 'Un papelito arrugado' : 'Una notica para ti';
        void this.c.ui.nota(`<div class="papelito ${tipo}"><i class="papelito-cinta"></i><small class="papelito-que">${que}</small><p>${esc(texto)}</p>${firma}</div>`, 'papelito-nota');
      }, true);
    }
  }

  /** Dónde quedó cada cosa (para armar el mismo reguero en el otro celular, en pareja). */
  plano(): PlanoDesorden {
    const r = (v: number) => Math.round(v * 10000) / 10000;
    return {
      cosas: this.cuerpos.map((b) => ({ id: b.id, tono: b.tono, p: [r(b.pos.x), r(b.pos.y), r(b.pos.z)], yaw: r(b.yaw) })),
      // (en el orden en que se crearon: así quedan igual en el otro celular)
      esc: this.conEscondido.map((b) => ({ k: this.cuerpos.indexOf(b), tipo: b.escondido!.tipo, i: b.escondido!.i, p: b.escondido!.obj.position.toArray().map(r), giro: r(b.escondido!.obj.rotation.y) })),
    };
  }

  /** Arma el reguero que mandó el otro celular (en pareja: el invitado ve lo mismo que el anfitrión). */
  sembrarDesde(pl: PlanoDesorden) {
    this.vista = this.escena.camara.clone();
    const W = window.innerWidth, H = window.innerHeight;
    this.puertaRect = rectDeCaja(new THREE.Box3(new THREE.Vector3(-HUECO.w / 2 - 0.15, 0, 0), new THREE.Vector3(HUECO.w / 2 + 0.15, HUECO.h + 0.15, 0.05)), this.vista, W, H);
    for (const c of pl.cosas ?? []) {
      if (!M[c.id]) continue;
      const { obj, medio, color } = mallaDe(c.id, c.tono);
      this.agregar(c.id, obj, medio, color, new THREE.Vector3(c.p[0], c.p[1], c.p[2]), c.tono, c.yaw);
    }
    // (lo escondido va después de todas las cosas, igual que en el otro celular)
    for (const e of pl.esc ?? []) {
      const b = this.cuerpos[e.k];
      if (b) this.ponerEscondido(b, e.tipo, e.i, new THREE.Vector3(e.p[0], e.p[1], e.p[2]), e.giro);
    }
  }

  /** Lo que se encontró y sigue a la vista (papelitos, cositas): es importante, nada se queda encima. */
  papeles: THREE.Object3D[] = [];
  /** Las cosas que esconden algo, en el orden en que se escondió. */
  private conEscondido: Cuerpo[] = [];

  /** Altura de lo que hay en el piso en (x, z): un tapete, una alfombra… (lo que esté bajito). */
  private alturaPiso(x: number, z: number) {
    const rc = new THREE.Raycaster(new THREE.Vector3(x, 0.6, z), new THREE.Vector3(0, -1, 0), 0, 0.8);
    const raices: THREE.Object3D[] = [this.c.g];
    const cuarto = this.escena.escena.getObjectByName('cuarto');
    if (cuarto) raices.push(cuarto);
    let y = 0;
    for (const h of rc.intersectObjects(raices, true)) {
      const m = h.object as THREE.Mesh;
      const mt = m.material as THREE.Material;
      if (!m.isMesh || !mt || mt.visible === false || h.point.y > 0.2) continue;
      let vis = true;
      for (let o: THREE.Object3D | null = m; o; o = o.parent) if (!o.visible) vis = false;
      if (vis) y = Math.max(y, h.point.y);
    }
    return y;
  }

  private agregar(id: string, obj: THREE.Group, h: THREE.Vector3, color: string, centro: THREE.Vector3, tono: number, giro?: number) {
    const molde = M[id];
    obj.name = `cosa ${id} ${this.cuerpos.length}`;
    obj.position.copy(centro);
    const yaw = giro ?? (molde.colgado ? 0 : (this.azar() - 0.5) * 1.2);
    obj.rotation.y = yaw;
    this.grupo.add(obj);
    const b: Cuerpo = {
      id, obj, h, molde, color, yaw, tono,
      pos: centro.clone(),
      vel: new THREE.Vector3(),
      giro: new THREE.Vector3(),
      dormido: true,
      tomado: false,
      colgado: !!molde.colgado,
      quieto: 0,
      plano: new THREE.Plane(new THREE.Vector3(0, 0, 1), -centro.z),
      lim: new THREE.Box3(),
      muestras: [],
      origen: centro.clone(),
      roto: false,
      empujes: 0,
      salto: null,
    };
    this.cuerpos.push(b);
    this.c.arrastrar(obj, {
      plano: b.plano,
      limites: b.lim,
      alTomar: () => this.tomar(b),
      alMover: (p) => this.mover(b, p),
      alSoltar: () => this.soltar(b),
    });
    this.c.tocar(obj, () => this.tocado(b));
    this.ajustarLimites(b);
    return b;
  }

  private ajustarLimites(b: Cuerpo) {
    b.plano.constant = -b.pos.z;
    b.lim.min.set(this.X0 + b.h.x, b.h.y, b.pos.z);
    b.lim.max.set(this.X1 - b.h.x, 2.9, b.pos.z);
  }

  private tomar(b: Cuerpo) {
    b.empujes = 0;
    b.salto = null;
    b.tomado = true;
    b.colgado = false;
    b.dormido = false;
    b.vel.set(0, 0, 0);
    b.muestras = [{ t: performance.now(), p: b.pos.clone() }];
    b.obj.scale.setScalar(1.08);
    for (const o of this.cuerpos) o.dormido = false;
    sfx.levantar();
  }

  private mover(b: Cuerpo, p: THREE.Vector3) {
    if (!b.tomado) return;
    b.pos.copy(p);
    const t = performance.now();
    b.muestras.push({ t, p: p.clone() });
    while (b.muestras.length > 2 && t - b.muestras[0].t > 110) b.muestras.shift();
    this.revisarEscondido(b);
  }

  private soltar(b: Cuerpo) {
    if (!b.tomado) return;
    b.tomado = false;
    b.obj.scale.setScalar(1);
    const m = b.muestras;
    if (m.length >= 2) {
      const a = m[0], z = m[m.length - 1];
      const dt = Math.max(0.016, (z.t - a.t) / 1000);
      b.vel.subVectors(z.p, a.p).divideScalar(dt * Math.max(1, this.escena.rapidez));
      if (b.vel.length() > 14) b.vel.setLength(14);
      // Lanzar hacia arriba también lo manda hacia el fondo (contra la pared)
      b.vel.z = -Math.max(0, b.vel.y) * 0.55;
      b.giro.set((this.azar() - 0.5) * 10, (this.azar() - 0.5) * 6, (this.azar() - 0.5) * 10).multiplyScalar(Math.min(1, b.vel.length() / 4));
    }
    b.dormido = false;
    b.quieto = 0;
  }

  /** Un toque: da un saltico y suena. */
  private tocado(b: Cuerpo) {
    if (b.colgado) {
      // Lo colgado se tambalea
      const r0 = b.obj.rotation.z;
      void this.escena.animar(420, (k) => (b.obj.rotation.z = r0 + Math.sin(k * Math.PI * 4) * 0.12 * (1 - k)));
      sfx.toc(0.6);
      return;
    }
    b.dormido = false;
    b.vel.y = Math.max(b.vel.y, 1.6);
    b.giro.y += (this.azar() - 0.5) * 6;
    sfx.toc(0.8);
  }

  private revisarEscondido(b: Cuerpo) {
    const e = b.escondido;
    if (!e || e.visto) return;
    const dx = b.pos.x - b.origen.x, dz = b.pos.z - b.origen.z, dy = b.pos.y - b.origen.y;
    if (Math.hypot(dx, dz) > Math.max(b.h.x, b.h.z) + 0.04 || dy > b.h.y * 2 + 0.1) this.descubrir(e);
  }

  /** Aparece lo escondido: brinca, brilla y queda protegido (nada se queda quieto encima). */
  private descubrir(e: Escondido) {
    e.visto = true;
    e.obj.visible = true;
    this.papeles.push(e.obj);
    this.protegidaCache = null;
    const y0 = e.obj.position.y;
    void this.escena.animar(520, (k) => {
      e.obj.scale.setScalar(0.4 + 0.6 * k + Math.sin(k * Math.PI) * 0.35);
      e.obj.position.y = y0 + Math.sin(k * Math.PI) * 0.12;
    });
    sfx.descubrir();
  }

  // --- Física ---------------------------------------------------------------
  private paso(dt: number) {
    this.pedacitos(dt);
    for (const p of this.papeles) {
      const aro = p.userData.aro as THREE.Mesh | undefined;
      if (aro) (aro.material as THREE.MeshBasicMaterial).opacity = 0.28 + Math.sin(this.escena.t * 3.2) * 0.16;
    }
    const despiertos = this.cuerpos.filter((b) => !b.dormido && !b.roto);
    if (!despiertos.length) return;
    this.acum = Math.min(this.acum + dt, 0.5);
    while (this.acum >= PASO) {
      this.acum -= PASO;
      for (const b of despiertos) if (!b.tomado && !b.dormido && !b.roto) this.integrar(b, PASO);
    }
    for (const b of despiertos) {
      if (b.roto) continue;
      b.obj.position.copy(b.pos);
      if (!b.tomado) this.revisarEscondido(b);
      this.ajustarLimites(b);
    }
  }

  private integrar(b: Cuerpo, dt: number) {
    if (b.colgado) return;
    const h = b.h, p = b.pos, v = b.vel;
    v.y -= G * dt;
    p.addScaledVector(v, dt);
    let apoyo = false;
    let golpe = 0;
    const rebote = b.molde.rebote ?? 0.28;
    // Piso
    if (p.y - h.y < 0) {
      golpe = Math.max(golpe, -v.y);
      p.y = h.y;
      v.y = -v.y * rebote;
      if (Math.abs(v.y) < 0.5) v.y = 0;
      apoyo = true;
    }
    // Paredes (y los bordes de lo que se ve)
    const paredes: [number, number, 'x' | 'z', 1 | -1][] = [
      [this.X0 + h.x, 0, 'x', 1],
      [this.X1 - h.x, 0, 'x', -1],
      [this.Z0 + h.z, 0, 'z', 1],
      [this.Z1 - h.z, 0, 'z', -1],
    ];
    for (const [lim, , eje, s] of paredes) {
      if ((p[eje] - lim) * s < 0) {
        golpe = Math.max(golpe, Math.abs(v[eje]) * (eje === 'z' && s === -1 ? 0.5 : 1));
        p[eje] = lim;
        if (v[eje] * s < 0) v[eje] = -v[eje] * rebote;
      }
    }
    // Muebles del acertijo y las otras cosas
    const caja = new THREE.Box3(p.clone().sub(h), p.clone().add(h));
    const choques: THREE.Box3[] = [...this.muebles];
    for (const o of this.cuerpos) if (o !== b && !o.roto && (o.dormido || o.tomado || o.colgado)) choques.push(new THREE.Box3(o.pos.clone().sub(o.h), o.pos.clone().add(o.h)));
    for (const m of choques) {
      if (!m.intersectsBox(caja)) continue;
      const pen = [
        ['x', m.max.x - caja.min.x, 1], ['x', caja.max.x - m.min.x, -1],
        ['y', m.max.y - caja.min.y, 1], ['y', caja.max.y - m.min.y, -1],
        ['z', m.max.z - caja.min.z, 1], ['z', caja.max.z - m.min.z, -1],
      ] as ['x' | 'y' | 'z', number, 1 | -1][];
      // Si venía cayendo desde arriba, se apoya encima
      pen.sort((a, c) => a[1] - c[1]);
      let [eje, d, s] = pen[0];
      const encima = m.max.y - caja.min.y;
      if (v.y <= 0 && encima < 0.08 + Math.abs(v.y) * dt * 2) [eje, d, s] = ['y', encima, 1];
      p[eje] += d * s;
      caja.min[eje] += d * s;
      caja.max[eje] += d * s;
      if (v[eje] * s < 0) {
        golpe = Math.max(golpe, Math.abs(v[eje]));
        v[eje] = -v[eje] * rebote;
        if (eje === 'y' && Math.abs(v.y) < 0.5) v.y = 0;
      }
      if (eje === 'y' && s === 1) apoyo = true;
    }
    if (golpe > 1.1) this.choque(b, golpe);
    if (b.roto) return;
    // Al caer de un saltico se queda ahí (sin resbalar)
    if (apoyo && b.salto && v.y <= 0) {
      v.x = 0;
      v.z = 0;
      b.salto = null;
    }
    // Roce y giro
    if (apoyo) {
      const k = Math.max(0, 1 - 5.5 * dt);
      v.x *= k;
      v.z *= k;
      b.giro.multiplyScalar(Math.max(0, 1 - 9 * dt));
      // Se endereza (queda de pie, como juguete de plastilina)
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, b.yaw, 0));
      b.obj.quaternion.slerp(q, Math.min(1, 10 * dt));
    } else if (b.giro.lengthSq() > 0.001) {
      const dq = new THREE.Quaternion().setFromEuler(new THREE.Euler(b.giro.x * dt, b.giro.y * dt, b.giro.z * dt));
      b.obj.quaternion.multiply(dq);
      b.yaw += b.giro.y * dt;
    }
    // Se duerme cuando queda quieto
    if (apoyo && v.lengthSq() < 0.01) {
      b.quieto += dt;
      if (b.quieto > 0.35) {
        v.set(0, 0, 0);
        // Que no quede tapando la puerta ni nada importante: se corre hacia un lado (y si no hay caso, vuelve a
        // donde estaba al principio, que era un sitio libre)
        if (b.empujes < 4 && this.estorba(b, b.pos)) {
          b.empujes++;
          b.quieto = 0;
          // Un saltico hasta el sitio libre más cercano; si no hay, a donde estaba al principio (era libre… salvo que
          // ahí haya quedado a la vista lo que escondía)
          const destino = this.sitioLibre(b, b.empujes >= 3);
          if (destino) this.saltar(b, destino);
          else if (b.escondido?.visto) b.empujes = 4;
          else {
            p.copy(b.origen);
            p.y += 0.25;
            v.set(0, 0.4, 0);
            b.salto = null;
            if (b.molde.colgado) b.colgado = true;
          }
          return;
        }
        b.empujes = 0;
        b.dormido = true;
        b.obj.quaternion.setFromEuler(new THREE.Euler(0, b.yaw, 0));
      }
    } else b.quieto = 0;
  }

  private protegidaCache: { t: number; m: Mascara | null } | null = null;

  /** Lo que no se puede tapar (lo importante y la puerta) en la pantalla de la vista general. */
  private prohibida() {
    if (!this.vista) return null;
    if (!this.protegidaCache || this.escena.t - this.protegidaCache.t > 0.4) {
      const W = window.innerWidth, H = window.innerHeight;
      const m = this.zonas.protegida?.() ?? new Mascara(W, H);
      const d = this.puertaRect;
      m.rect(d.x0, d.y0, d.x1, d.y1);
      for (const r of this.zonas.interfaz) m.rect(r.x0, r.y0, r.x1, r.y1);
      this.protegidaCache = { t: this.escena.t, m };
    }
    return this.protegidaCache.m;
  }

  /** ¿Puesto en `pos`, tapa la puerta, algo importante o la interfaz? */
  private estorba(b: Cuerpo, pos: THREE.Vector3) {
    const prot = this.prohibida();
    if (!prot || !this.vista) return false;
    const antes = b.obj.position.clone();
    b.obj.position.copy(pos);
    b.obj.updateWorldMatrix(true, true);
    const m = new Mascara(prot.ancho, prot.alto);
    pintar(m, b.obj, this.vista);
    b.obj.position.copy(antes);
    b.obj.updateWorldMatrix(true, true);
    return m.cruce(prot) >= 3;
  }

  /** El sitio libre más cercano en el piso (a los lados primero, luego más adelante o más atrás). `lejos`: busca en
   *  todo el cuarto. */
  private sitioLibre(b: Cuerpo, lejos = false): THREE.Vector3 | null {
    const p = b.pos;
    const otros = this.cuerpos.filter((o) => o !== b && !o.roto).map((o) => new THREE.Box3(o.pos.clone().sub(o.h), o.pos.clone().add(o.h)));
    const W = window.innerWidth, H = window.innerHeight;
    const prueba = new THREE.Vector3();
    for (const dz of lejos ? [0, -0.3, 0.3, -0.6, 0.6, 0.9, -0.9] : [0, -0.3, 0.3, -0.6]) {
      for (let k = 1; k <= (lejos ? 44 : 16); k++) {
        for (const lado of [1, -1]) {
          prueba.set(p.x + lado * k * 0.16, b.h.y, THREE.MathUtils.clamp(p.z + dz, this.Z0 + b.h.z, 2.1));
          if (prueba.x - b.h.x < this.X0 || prueba.x + b.h.x > this.X1) continue;
          const caja = new THREE.Box3(prueba.clone().sub(b.h), prueba.clone().add(b.h)).expandByScalar(0.02);
          if (this.muebles.some((m) => m.intersectsBox(caja)) || otros.some((o) => o.intersectsBox(caja))) continue;
          if (this.zonas.narrador.some((z) => z.intersectsBox(caja))) continue;
          const r = rectDeCaja(caja, this.vista!, W, H);
          if (!isFinite(r.x0) || r.x0 < 4 || r.x1 > W - 4 || r.y0 < 4 || r.y1 > H - 4) continue;
          if (!this.estorba(b, prueba)) return prueba.clone();
        }
      }
    }
    return null;
  }

  /** Saltico hasta `destino` (llega ahí y se queda: sin resbalar). */
  private saltar(b: Cuerpo, destino: THREE.Vector3) {
    const d = Math.hypot(destino.x - b.pos.x, destino.z - b.pos.z);
    const T = 0.38 + Math.min(0.3, d * 0.12);
    b.vel.set((destino.x - b.pos.x) / T, (destino.y - b.pos.y + 0.5 * G * T * T) / T, (destino.z - b.pos.z) / T);
    b.giro.set(0, (this.azar() - 0.5) * 4, 0);
    b.salto = destino.clone();
    b.dormido = false;
    sfx.toc(0.5);
  }

  private choque(b: Cuerpo, v: number) {
    if (b.molde.rompible && v > ROMPE) {
      this.romper(b);
      return;
    }
    const ahora = this.escena.t;
    if (ahora - ((b as unknown as { _ultimo?: number })._ultimo ?? -1) > 0.12) {
      (b as unknown as { _ultimo?: number })._ultimo = ahora;
      sfx.golpe(Math.min(1, v / 6), b.molde.rompible);
    }
  }

  /** Se rompe en pedazos que saltan y se desvanecen. */
  romper(b: Cuerpo) {
    b.roto = true;
    b.obj.visible = false;
    this.c.quitarToque(b.obj);
    // Lo que escondía queda a la vista
    if (b.escondido && !b.escondido.visto) this.descubrir(b.escondido);
    sfx.romper();
    this.rotos++;
    this.zonas.alRomper?.(this.rotos === 1);
    const m = matNuevo(b.color, { plano: true });
    m.transparent = true;
    const geo = pedazoGeo();
    const n = 9;
    for (let i = 0; i < n; i++) {
      const pz = new THREE.Mesh(geo, m);
      pz.name = 'pedazo';
      const s = 0.3 + this.azar() * 0.6;
      pz.scale.set(b.h.x * s, b.h.y * s * 0.8, b.h.z * s);
      pz.position.copy(b.pos).add(new THREE.Vector3((this.azar() - 0.5) * b.h.x, (this.azar() - 0.3) * b.h.y, (this.azar() - 0.5) * b.h.z));
      pz.castShadow = true;
      this.grupo.add(pz);
      const dir = new THREE.Vector3(this.azar() - 0.5, this.azar() * 0.9 + 0.3, this.azar() - 0.5).normalize();
      this.pedazos.push({ m: pz, vel: dir.multiplyScalar(1.5 + this.azar() * 2.5).add(b.vel.clone().multiplyScalar(-0.15)), giro: new THREE.Vector3(this.azar() * 12, this.azar() * 12, this.azar() * 12), vida: 0 });
    }
  }

  private pedacitos(dt: number) {
    if (!this.pedazos.length) return;
    for (const p of [...this.pedazos]) {
      p.vida += dt;
      const pos = p.m.position;
      if (pos.y > 0.01 || p.vel.lengthSq() > 0.01) {
        p.vel.y -= G * dt;
        pos.addScaledVector(p.vel, dt);
        if (pos.y < 0.01) {
          pos.y = 0.01;
          p.vel.y = -p.vel.y * 0.25;
          p.vel.x *= 0.6;
          p.vel.z *= 0.6;
          p.giro.multiplyScalar(0.5);
          if (Math.abs(p.vel.y) < 0.3) p.vel.y = 0;
        }
        pos.x = THREE.MathUtils.clamp(pos.x, this.X0, this.X1);
        pos.z = THREE.MathUtils.clamp(pos.z, this.Z0, this.Z1);
        p.m.rotation.x += p.giro.x * dt;
        p.m.rotation.z += p.giro.z * dt;
      }
      // Se desvanecen después de un rato
      if (p.vida > 2.6) {
        const mt = p.m.material as THREE.MeshStandardMaterial;
        mt.opacity = Math.max(0, 1 - (p.vida - 2.6) / 0.8);
        if (p.vida > 3.4) {
          this.grupo.remove(p.m);
          this.pedazos.splice(this.pedazos.indexOf(p), 1);
          if (!this.pedazos.some((o) => o.m.material === mt)) mt.dispose();
        }
      }
    }
  }

  /** Lanza una cosa con esa velocidad (pruebas de la física). */
  lanzar(i: number, v: THREE.Vector3) {
    const b = this.cuerpos[i];
    if (!b || b.roto) return false;
    b.colgado = false;
    b.dormido = false;
    b.vel.copy(v);
    b.giro.set(6, 3, 6);
    for (const o of this.cuerpos) o.dormido = false;
    return true;
  }

  /** El narrador (u otra cosa que camina) empuja lo que tenga en los pies. */
  empujar(x: number, z: number, r = 0.28) {
    for (const b of this.cuerpos) {
      if (b.roto || b.tomado || b.colgado || b.pos.y - b.h.y > 0.3) continue;
      const dx = b.pos.x - x, dz = b.pos.z - z;
      const d = Math.hypot(dx, dz);
      const min = r + Math.max(b.h.x, b.h.z);
      if (d < min && d > 1e-4) {
        b.dormido = false;
        b.vel.x += (dx / d) * 2.2;
        b.vel.z += (dz / d) * 2.2;
        b.vel.y = Math.max(b.vel.y, 0.6);
      }
    }
  }

  quitar() {
    this.escena.escena.remove(this.grupo);
    for (const p of this.pedazos) (p.m.material as THREE.Material).dispose();
    this.pedazos = [];
    this.grupo.traverse((o) => {
      const m = o as THREE.Mesh;
      // Las mallas de las cosas se comparten (quedan en caché); lo propio de esta puerta sí se libera
      if (m.isMesh && m.userData.propio) {
        m.geometry.dispose();
        const mt = m.material as THREE.MeshStandardMaterial;
        if (!m.userData.mapaFijo) mt.map?.dispose();
        mt.dispose();
      }
    });
    this.cuerpos = [];
    this.papeles = [];
  }
}

let geoPedazo: THREE.BufferGeometry | null = null;
function pedazoGeo() {
  return (geoPedazo ??= new THREE.TetrahedronGeometry(1, 0));
}

let texSombraPapel: THREE.Texture | null = null;
/** Sombrita de contacto (compartida: no se libera con la puerta). */
function sombrita(w: number, d: number, fuerza = 0.32) {
  texSombraPapel ??= lienzo(64, 64, (c) => {
    const g = c.createRadialGradient(32, 32, 2, 32, 32, 31);
    g.addColorStop(0, 'rgba(40,25,20,1)');
    g.addColorStop(1, 'rgba(40,25,20,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: texSombraPapel, transparent: true, opacity: fuerza, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.002;
  m.renderOrder = -1;
  m.userData.propio = true;
  m.userData.mapaFijo = true;
  return m;
}

/** Aro de luz en el piso que late (para que se note lo que se encontró). */
function aroDeLuz(r: number, color: string) {
  const aro = new THREE.Mesh(
    new THREE.RingGeometry(r * 0.72, r, 36),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
  );
  aro.rotation.x = -Math.PI / 2;
  aro.position.y = 0.003;
  aro.userData.propio = true;
  return aro;
}

/** Papelito doblado como carpita (la cara de adelante mira a la cámara: se ve aunque el piso quede de lado). */
function papelito(falsa: boolean) {
  const color = falsa ? '#fff3a8' : '#ffe3ec';
  const t = lienzo(256, 128, (cx, w, h) => {
    const g = cx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, color);
    g.addColorStop(1, falsa ? '#f3e08a' : '#f7c9d6');
    cx.fillStyle = g;
    cx.fillRect(0, 0, w, h);
    // Renglones escritos a mano
    cx.strokeStyle = falsa ? 'rgba(80,60,30,0.55)' : 'rgba(120,50,70,0.5)';
    cx.lineWidth = 5;
    cx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      cx.beginPath();
      const y = 30 + i * 30;
      cx.moveTo(26, y);
      for (let x = 26; x < w - 70 - i * 20; x += 14) cx.lineTo(x, y + Math.sin(x * 0.35 + i) * 3);
      cx.stroke();
    }
    if (falsa) textoEn(cx, '?', w - 36, h / 2, 72, '#e4574b', 700);
    else {
      cx.fillStyle = '#e4574b';
      cx.beginPath();
      const x = w - 40, y = h / 2 - 6, r = 16;
      cx.moveTo(x, y + r * 1.4);
      cx.bezierCurveTo(x - r * 2, y, x - r, y - r * 1.3, x, y - r * 0.3);
      cx.bezierCurveTo(x + r, y - r * 1.3, x + r * 2, y, x, y + r * 1.4);
      cx.fill();
    }
    // Borde un poquito más oscuro (el doblez)
    cx.strokeStyle = 'rgba(61,43,39,0.25)';
    cx.lineWidth = 4;
    cx.strokeRect(2, 2, w - 4, h - 4);
  });
  const mt = new THREE.MeshStandardMaterial({ map: t, roughness: 0.92, side: THREE.DoubleSide });
  const atras = new THREE.MeshStandardMaterial({ color: falsa ? '#eedd8e' : '#f2cbd6', roughness: 0.95, side: THREE.DoubleSide });
  const W = 0.24, D = 0.06, Hh = 0.07;
  const largo = Math.hypot(D, Hh);
  const ang = Math.atan2(D, Hh);
  const g = new THREE.Group();
  g.name = 'papelito';
  // Cara de adelante: de la arista de arriba (z = 0, y = Hh) hasta el piso (z = D)
  const frente = new THREE.Mesh(new THREE.PlaneGeometry(W, largo), mt);
  frente.position.set(0, Hh / 2, D / 2);
  frente.rotation.x = -ang;
  frente.castShadow = true;
  const espalda = new THREE.Mesh(new THREE.PlaneGeometry(W, largo), atras);
  espalda.position.set(0, Hh / 2, -D / 2);
  espalda.rotation.x = ang;
  for (const m of [frente, espalda]) m.userData.propio = true;
  const aro = aroDeLuz(0.2, falsa ? '#fff2a0' : '#ffc4d8');
  g.userData.aro = aro;
  // Área de toque generosa (el dedo es más grande que el papel)
  const toque = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
  toque.position.y = 0.06;
  toque.userData.propio = true;
  g.add(sombrita(0.34, 0.2), aro, frente, espalda, toque);
  return g;
}

/** Cosita perdida (un arete, un botón…): una joyita dorada que brilla. */
function cosita() {
  const g = new THREE.Group();
  g.name = 'cosita';
  const oro = new THREE.MeshStandardMaterial({ color: '#f2c75c', metalness: 0.75, roughness: 0.25, emissive: '#5a3a08', emissiveIntensity: 0.4 });
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.009, 8, 20), oro);
  aro.position.y = 0.03;
  const gema = new THREE.Mesh(new THREE.OctahedronGeometry(0.018), new THREE.MeshStandardMaterial({ color: '#f59fc0', metalness: 0.2, roughness: 0.15, emissive: '#7a2848', emissiveIntensity: 0.5 }));
  gema.position.set(0, 0.012, 0);
  for (const m of [aro, gema]) m.userData.propio = true;
  const luz = aroDeLuz(0.13, '#fff2a0');
  g.userData.aro = luz;
  const toque = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  toque.position.y = 0.04;
  toque.userData.propio = true;
  g.add(sombrita(0.14, 0.1, 0.25), luz, aro, gema, toque);
  return g;
}

/** Cajas del mundo donde se para el narrador (para no regar cosas en sus pies). */
export function zonasNarrador(esquinaX: number) {
  const caja = (x: number, z: number) => new THREE.Box3(new THREE.Vector3(x - 0.4, 0, z - 0.35), new THREE.Vector3(x + 0.4, 1.75, z + 0.35));
  return [caja(esquinaX, 0.75), caja(-1.75, 1.5), caja(-1.3, 1.05)];
}

/** Para que el narrador sepa dónde queda la esquina según el ancho de la pantalla. */
export function esquinaNarrador(cam: THREE.PerspectiveCamera) {
  const z = 0.75;
  const dist = OJO.z - z;
  const medioAncho = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * dist * cam.aspect;
  return -Math.min(3.3, medioAncho - 0.9);
}
