// Reemplazos de las cosas (mientras llegan cosas.glb, armas.glb y proyectiles.glb): recogibles, cofres, la campana de
// extracción, la carreta, el santuario, las armas que se llevan en la mano y los proyectiles.
// Las armas tienen el origen en el mango y se extienden hacia +Y; los proyectiles apuntan hacia −Z.
import * as THREE from 'three';
import { bola, caja, capsula, cil, cono, hueso, mat, toro } from './formas';
import { fijo, type ModeloFijo } from './reemplazos_mapa';

type P = [THREE.BufferGeometry, THREE.Material][];

const madera = () => mat('#4e3624');
const maderaOsc = () => mat('#33241a');
const hierro = () => mat('#5c6068', { met: 0.75, rug: 0.38 });
const acero = () => mat('#b8bcc4', { met: 0.85, rug: 0.25 });
const cuero = () => mat('#4a2e1e', { rug: 0.9 });
const oro = () => mat('#d0a838', { met: 0.85, rug: 0.3 });
const brillo = (c: string, i = 3) => mat('#181818', { e: c, ei: i, relieve: 0 });

// ------------------------------------------------------------------------------------------------- Recogibles y entidades
const COSAS: Record<string, () => P> = {
  oro: () => [[cil(0.11, 0.11, 0.025, { rx: Math.PI / 2 }, 12), oro()], [cil(0.07, 0.07, 0.03, { rx: Math.PI / 2 }, 6), mat('#a8801c', { met: 0.8, rug: 0.4 })]],
  hierro_negro: () => [[caja(0.22, 0.12, 0.14, 0.03, { ry: 0.3 }), mat('#24262a', { met: 0.8, rug: 0.3 })], [caja(0.1, 0.08, 0.1, 0.02, { x: 0.08, y: 0.07, ry: 1 }), mat('#5a6474', { met: 0.9, rug: 0.2 })]],
  sangre_cristal: () => [[cono(0.07, 0.26, { y: 0.06 }, 5), brillo('#ff1a30', 2.4)], [cono(0.05, 0.18, { x: 0.06, y: 0.02, rz: -0.5 }, 5), brillo('#ff3048', 2)]],
  pierna_pollo: () => [[bola(0.12, { y: 0.05, sz: 1.3 }), mat('#a8642a', { rug: 0.6 })], [capsula(0.025, 0.12, { y: 0.05, z: 0.18, rx: Math.PI / 2 }), mat('#e8dcc0')]],
  cofre: () => [
    [caja(0.6, 0.36, 0.4, 0.04, { y: 0.18 }), madera()], [caja(0.62, 0.16, 0.42, 0.06, { y: 0.42 }), maderaOsc()],
    [caja(0.64, 0.05, 0.06, 0.01, { y: 0.2, z: -0.18 }), hierro()], [caja(0.1, 0.12, 0.04, 0.01, { y: 0.34, z: -0.22 }), oro()],
  ],
  cofre_reliquia: () => [
    [caja(0.7, 0.4, 0.45, 0.04, { y: 0.2 }), mat('#2a1c2a')], [caja(0.72, 0.2, 0.47, 0.08, { y: 0.48 }), mat('#3a243a')],
    [caja(0.74, 0.04, 0.05, 0.01, { y: 0.32, z: -0.22 }), oro()], [caja(0.05, 0.4, 0.05, 0.01, { x: -0.3, y: 0.3, z: -0.22 }), oro()], [caja(0.05, 0.4, 0.05, 0.01, { x: 0.3, y: 0.3, z: -0.22 }), oro()],
    [caja(0.14, 0.16, 0.05, 0.02, { y: 0.38, z: -0.25 }), oro()], [bola(0.04, { y: 0.4, z: -0.28 }), brillo('#c080ff', 3)],
  ],
  cofre_maldito: () => [
    [caja(0.62, 0.38, 0.42, 0.04, { y: 0.19 }), mat('#1a1214')], [caja(0.64, 0.17, 0.44, 0.06, { y: 0.44 }), mat('#24181a')],
    [caja(0.5, 0.04, 0.02, 0.01, { y: 0.28, z: -0.21 }), brillo('#ff1020', 2.5)], [caja(0.04, 0.2, 0.02, 0.01, { y: 0.3, z: -0.21 }), brillo('#ff1020', 2.5)],
    [caja(0.1, 0.1, 0.1, 0.03, { y: 0.6 }), mat('#d0c6aa')],
  ],
  llave: () => [[toro(0.06, 0.018, { y: 0.1 }), oro()], [cil(0.018, 0.018, 0.22, { y: -0.06 }), oro()], [caja(0.06, 0.03, 0.02, 0.005, { x: 0.035, y: -0.15 }), oro()]],
  frasco: () => [[bola(0.11, { y: 0.1 }), mat('#3a7a2a', { rug: 0.1, e: '#3aff6a', ei: 1.2, relieve: 0, transp: 0.85 })], [cil(0.035, 0.04, 0.1, { y: 0.24 }), mat('#3a7a2a', { rug: 0.1, transp: 0.85 })], [cil(0.04, 0.04, 0.04, { y: 0.3 }), mat('#7a5a3a')]],
  equipo: () => [[bola(0.18, { y: 0.14, sy: 0.85 }), cuero()], [toro(0.06, 0.015, { y: 0.28, rx: Math.PI / 2 }), mat('#2a1a10')], [bola(0.05, { y: 0.14, z: -0.17 }), oro()]],
  huevo: () => [[bola(0.16, { y: 0.18, sy: 1.3 }), mat('#7a7262', { rug: 0.6 })], [toro(0.15, 0.015, { y: 0.2, rx: 0.4 }), brillo('#ffb040', 2)]],
  gota: () => [[bola(0.09, { y: 0.09, sy: 1.2 }), brillo('#ff2030', 1.8)]],
  campana: () => [
    [cil(0.55, 1.05, 1.5, { y: 1.15 }, 16), mat('#6a4a26', { met: 0.7, rug: 0.35 })], [toro(1.05, 0.07, { y: 0.42, rx: Math.PI / 2 }, ), mat('#7a5a2e', { met: 0.7, rug: 0.35 })],
    [bola(0.5, { y: 1.9, sy: 0.6 }), mat('#6a4a26', { met: 0.7, rug: 0.35 })], [toro(0.2, 0.06, { y: 2.3 }), hierro()],
    [toro(0.6, 0.04, { y: 1.3, rx: Math.PI / 2 }), mat('#c8a040', { met: 0.8, rug: 0.3 })], [bola(0.16, { y: 0.55 }), hierro()],
  ],
  carreta: () => [
    [caja(1.1, 0.55, 1.5, 0.05, { y: 0.55 }), madera()], [caja(1.14, 0.06, 1.54, 0.01, { y: 0.84 }), hierro()],
    ...[-0.5, 0.5].flatMap((z): P => [[cil(0.24, 0.24, 0.08, { x: -0.58, y: 0.25, z, rz: Math.PI / 2 }, 12), maderaOsc()], [cil(0.24, 0.24, 0.08, { x: 0.58, y: 0.25, z, rz: Math.PI / 2 }, 12), maderaOsc()]]),
    [caja(0.6, 0.45, 0.6, 0.06, { y: 1.05 }), mat('#2a1c2a')], [caja(0.64, 0.06, 0.64, 0.01, { y: 1.3 }), oro()], [bola(0.12, { y: 1.42 }), brillo('#ff3040', 3)],
  ],
  santuario: () => [
    [caja(1.0, 0.25, 1.0, 0.04, { y: 0.12 }), mat('#3e3c38', { relieve: 0.7 })], [caja(0.6, 0.3, 0.6, 0.04, { y: 0.4 }), mat('#4e4a44', { relieve: 0.7 })],
    [cono(0.28, 1.1, { y: 1.1 }, 8), mat('#5a5852', { relieve: 0.7 })], [caja(0.3, 0.3, 0.3, 0.1, { y: 1.75 }), mat('#5a5852', { relieve: 0.7 })], [caja(0.36, 0.36, 0.34, 0.14, { y: 1.8, z: 0.03 }), mat('#3a3834')],
    [toro(0.3, 0.02, { y: 1.85, z: 0.1 }), brillo('#a8c8ff', 2.5)],
    ...[0, 1, 2].flatMap((k): P => [[cil(0.035, 0.04, 0.2, { x: Math.cos(k * 2.1) * 0.42, y: 0.35, z: Math.sin(k * 2.1) * 0.42 }), mat('#d8ccb0')], [cono(0.02, 0.06, { x: Math.cos(k * 2.1) * 0.42, y: 0.49, z: Math.sin(k * 2.1) * 0.42 }, 5), brillo('#ffb050', 5)]]),
  ],
  pozo_almas: () => [
    [cil(1.1, 1.2, 0.6, { y: 0.3 }, 16), mat('#3a3834', { relieve: 0.8 })], [cil(0.9, 0.9, 0.05, { y: 0.58 }, 16), brillo('#6ad8ff', 1.5)],
    [toro(1.1, 0.08, { y: 0.6, rx: Math.PI / 2 }), mat('#4a4844', { relieve: 0.8 })],
  ],
  forja: () => [
    [caja(1.3, 0.8, 0.9, 0.06, { y: 0.4 }), mat('#3a3430', { relieve: 0.8 })], [caja(0.9, 0.12, 0.5, 0.02, { y: 0.82 }), brillo('#ff6a1a', 2.5)],
    [caja(0.5, 0.3, 0.25, 0.04, { x: 1.2, y: 0.55 }), hierro()], [caja(0.2, 0.3, 0.18, 0.02, { x: 1.2, y: 0.25 }), maderaOsc()],
  ],
};

// ------------------------------------------------------------------------------------------------- Armas en la mano
const hoja = (largo: number, ancho: number, y0 = 0.12) => caja(ancho, largo, 0.02, 0.006, { y: y0 + largo / 2 });
const ARMAS: Record<string, () => P> = {
  espada_larga: () => [[cil(0.02, 0.02, 0.16, { y: 0 }), cuero()], [caja(0.2, 0.035, 0.05, 0.01, { y: 0.09 }), oro()], [hoja(0.62, 0.06), acero()], [bola(0.03, { y: -0.09 }), oro()]],
  cetro: () => [[cil(0.022, 0.022, 0.6, { y: 0.2 }), hierro()], [bola(0.07, { y: 0.52 }), oro()], [cono(0.05, 0.1, { y: 0.62 }, 5), oro()]],
  estandarte: () => [[cil(0.02, 0.02, 1.2, { y: 0.45 }), madera()], [caja(0.4, 0.5, 0.01, 0.005, { x: 0.2, y: 0.8 }), mat('#7a1418')], [caja(0.12, 0.12, 0.015, 0.005, { x: 0.2, y: 0.82 }), oro()], [cono(0.03, 0.08, { y: 1.08 }, 5), oro()]],
  lanza: () => [[cil(0.02, 0.02, 1.2, { y: 0.45 }), madera()], [cono(0.045, 0.22, { y: 1.15 }, 4), acero()]],
  lanza_justa: () => [[cil(0.025, 0.025, 1.1, { y: 0.5 }), mat('#e0d8c8')], [cono(0.07, 0.5, { y: 1.3 }, 8), acero()], [cono(0.1, 0.12, { y: 0.1, rx: Math.PI }, 8), hierro()]],
  horca: () => [[cil(0.018, 0.018, 1.0, { y: 0.4 }), madera()], [caja(0.2, 0.025, 0.02, 0.005, { y: 0.9 }), hierro()], ...[-0.09, 0, 0.09].map((x): [THREE.BufferGeometry, THREE.Material] => [cil(0.008, 0.012, 0.24, { x, y: 1.02 }), hierro()])],
  hoz: () => [[cil(0.02, 0.02, 0.22, { y: 0.05 }), madera()], [toro(0.13, 0.012, { x: 0.1, y: 0.22, rz: 0.6 }, Math.PI * 1.1), acero()]],
  antorcha: () => [[cil(0.022, 0.03, 0.5, { y: 0.15 }), madera()], [cil(0.05, 0.035, 0.1, { y: 0.42 }), hierro()]],
  honda: () => [[toro(0.05, 0.01, { y: 0.05 }), cuero()], [hueso({ x: 0, y: 0, z: 0 }, { x: 0.05, y: -0.25, z: 0 }, 0.006), cuero()]],
  grillete: () => [[toro(0.05, 0.016, { rx: Math.PI / 2 }), hierro()], ...Array.from({ length: 5 }, (_, k): [THREE.BufferGeometry, THREE.Material] => [toro(0.035, 0.01, { y: 0.06 + k * 0.06, ry: k % 2 ? Math.PI / 2 : 0 }), hierro()])],
  bola_hierro: () => [[toro(0.05, 0.016, { rx: Math.PI / 2 }), hierro()]],
  punos: () => [[toro(0.05, 0.02, { rx: Math.PI / 2 }), hierro()]],
  pico: () => [[cil(0.02, 0.02, 0.55, { y: 0.2 }), madera()], [caja(0.42, 0.045, 0.045, 0.01, { y: 0.47, rz: 0.1 }), hierro()]],
  maza: () => [[cil(0.022, 0.022, 0.42, { y: 0.15 }), cuero()], [bola(0.09, { y: 0.42 }), hierro()], ...[0, 1, 2, 3].map((k): [THREE.BufferGeometry, THREE.Material] => [caja(0.03, 0.14, 0.03, 0.005, { y: 0.42, ry: (k * Math.PI) / 4 }), hierro()])],
  mangual: () => [[cil(0.022, 0.022, 0.32, { y: 0.1 }), madera()], ...Array.from({ length: 3 }, (_, k): [THREE.BufferGeometry, THREE.Material] => [toro(0.025, 0.008, { y: 0.28 + k * 0.045, ry: k % 2 ? Math.PI / 2 : 0 }), hierro()])],
  escudo: () => [[caja(0.4, 0.5, 0.05, 0.08, { y: 0.1 }), mat('#2a3a6a')], [caja(0.08, 0.5, 0.06, 0.02, { y: 0.1 }), oro()], [caja(0.4, 0.08, 0.06, 0.02, { y: 0.18 }), oro()]],
  ballesta: () => [[caja(0.06, 0.06, 0.45, 0.01, { y: 0.03, z: -0.12 }), madera()], [toro(0.24, 0.015, { y: 0.03, z: -0.3, rx: Math.PI / 2, rz: Math.PI }, Math.PI), hierro()], [cil(0.004, 0.004, 0.48, { y: 0.03, z: -0.3, rz: Math.PI / 2 }), mat('#d8ccb0')]],
  estaca: () => [[cono(0.035, 0.4, { y: 0.15 }, 6), madera()]],
  frasco: () => [[bola(0.07, { y: 0.07 }), mat('#4a8a3a', { rug: 0.1, e: '#3aff6a', ei: 0.8, relieve: 0 })], [cil(0.02, 0.025, 0.08, { y: 0.16 }), mat('#4a8a3a', { rug: 0.1 })]],
  trabuco: () => [[cil(0.035, 0.05, 0.42, { y: 0.03, z: -0.18, rx: Math.PI / 2 }), hierro()], [caja(0.05, 0.08, 0.25, 0.01, { y: 0, z: 0.08 }), madera()]],
  martillo: () => [[cil(0.022, 0.022, 0.5, { y: 0.18 }), madera()], [caja(0.22, 0.14, 0.14, 0.02, { y: 0.48 }), hierro()]],
  pala: () => [[cil(0.02, 0.02, 0.75, { y: 0.28 }), madera()], [caja(0.18, 0.24, 0.02, 0.02, { y: 0.74 }), hierro()]],
  linterna: () => [[toro(0.04, 0.008, { y: 0.03 }), hierro()], [caja(0.1, 0.14, 0.1, 0.01, { y: -0.08 }), hierro()], [bola(0.04, { y: -0.08 }), brillo('#8fe3ff', 3)]],
  campana_mano: () => [[cil(0.02, 0.02, 0.15, { y: 0.04 }), madera()], [cil(0.03, 0.08, 0.12, { y: 0.17 }), mat('#7a5a2e', { met: 0.7, rug: 0.35 })]],
  incensario: () => [[hueso({ x: 0, y: 0, z: 0 }, { x: 0, y: -0.25, z: 0 }, 0.005), hierro()], [bola(0.07, { y: -0.3, sy: 0.8 }), oro()], [bola(0.03, { y: -0.3 }), brillo('#ffb050', 2)]],
  libro: () => [[caja(0.18, 0.24, 0.05, 0.01, { y: 0.06 }), mat('#4a1414')], [caja(0.16, 0.22, 0.04, 0.005, { y: 0.06, z: 0.005 }), mat('#e0d4b4')], [caja(0.04, 0.16, 0.055, 0.005, { y: 0.06 }), oro()]],
  cruz: () => [[caja(0.04, 0.4, 0.03, 0.01, { y: 0.15 }), acero()], [caja(0.2, 0.04, 0.03, 0.01, { y: 0.24 }), acero()]],
  hacha_verdugo: () => [[cil(0.025, 0.025, 1.0, { y: 0.35 }), maderaOsc()], [caja(0.32, 0.36, 0.03, 0.04, { x: 0.15, y: 0.75 }), acero()], [caja(0.06, 0.4, 0.04, 0.01, { y: 0.75 }), hierro()]],
  hacha: () => [[cil(0.02, 0.02, 0.45, { y: 0.15 }), madera()], [caja(0.18, 0.2, 0.025, 0.03, { x: 0.08, y: 0.38 }), acero()]],
  gancho: () => [[cil(0.02, 0.02, 0.2, { y: 0.05 }), madera()], [toro(0.08, 0.012, { x: 0.05, y: 0.25 }, Math.PI * 1.4), hierro()]],
  soga: () => [[toro(0.08, 0.015, { y: 0.0 }), mat('#a88a5a')], [toro(0.06, 0.015, { y: 0.03, ry: 0.5 }), mat('#a88a5a')]],
  baston: () => [[cil(0.022, 0.028, 1.1, { y: 0.4 }), maderaOsc()], [bola(0.06, { y: 0.98 }), brillo('#b07aff', 3)], [cono(0.03, 0.15, { x: 0.05, y: 0.9, rz: -0.6 }, 4), maderaOsc()]],
  vudu: () => [[caja(0.12, 0.16, 0.06, 0.03, { y: 0.06 }), mat('#7a6a4a')], [caja(0.1, 0.1, 0.06, 0.03, { y: 0.19 }), mat('#7a6a4a')], [cil(0.003, 0.003, 0.12, { x: 0.03, y: 0.12, z: -0.04, rx: 1 }), acero()]],
  laud: () => [[bola(0.15, { y: 0.0, sz: 0.4 }), madera()], [caja(0.05, 0.38, 0.02, 0.01, { y: 0.28 }), maderaOsc()], [caja(0.07, 0.1, 0.03, 0.01, { y: 0.48, rx: 0.4 }), maderaOsc()]],
  flauta: () => [[cil(0.015, 0.015, 0.36, { y: 0.12 }), madera()]],
  tambor: () => [[cil(0.14, 0.14, 0.18, { y: 0, rz: Math.PI / 2 }), mat('#7a3a2a')], [cil(0.145, 0.145, 0.01, { x: 0.09, rz: Math.PI / 2 }), mat('#e0d4b4')]],
  arco: () => [[toro(0.4, 0.015, { y: 0.1, rz: Math.PI / 2 }, Math.PI), madera()], [cil(0.003, 0.003, 0.8, { y: 0.1 }), mat('#d8ccb0')]],
  bomba: () => [[bola(0.1, { y: 0.1 }), mat('#1e1e20')], [cil(0.01, 0.01, 0.08, { y: 0.22 }), mat('#7a5a3a')]],
  sierra: () => [[cil(0.14, 0.14, 0.015, { y: 0.15 }, 14), acero()]],
  daga: () => [[cil(0.015, 0.015, 0.1, { y: 0 }), cuero()], [caja(0.08, 0.02, 0.03, 0.005, { y: 0.06 }), hierro()], [hoja(0.22, 0.035, 0.06), acero()]],
};

// ------------------------------------------------------------------------------------------------- Proyectiles (apuntan a −Z)
const PROYECTILES: Record<string, () => P> = {
  virote: () => [[cil(0.012, 0.012, 0.42, { rx: Math.PI / 2 }), madera()], [cono(0.025, 0.08, { z: -0.24, rx: -Math.PI / 2 }, 4), acero()], [caja(0.06, 0.01, 0.08, 0.002, { z: 0.17 }), mat('#d8ccb0')]],
  flecha: () => [[cil(0.01, 0.01, 0.55, { rx: Math.PI / 2 }), madera()], [cono(0.022, 0.07, { z: -0.3, rx: -Math.PI / 2 }, 4), acero()], [caja(0.05, 0.01, 0.1, 0.002, { z: 0.22 }), mat('#e8e0d0')]],
  estaca: () => [[cono(0.035, 0.42, { rx: -Math.PI / 2 }, 6), madera()]],
  daga: () => [[caja(0.04, 0.015, 0.24, 0.005, { z: -0.04 }), acero()], [caja(0.08, 0.02, 0.025, 0.005, { z: 0.08 }), hierro()]],
  hueso: () => [[capsula(0.03, 0.24, { rx: Math.PI / 2 }), mat('#e0d6bc')]],
  piedra: () => [[bola(0.08, {}, 7), mat('#7a746a')]],
  pluma_cuervo: () => [[caja(0.06, 0.012, 0.3, 0.004), mat('#1e1a24', { e: '#5a2a8a', ei: 0.8 })], [bola(0.03, { z: -0.12 }), brillo('#b07aff', 2)]],
  nota_musical: () => [[bola(0.07, { sy: 0.7 }), brillo('#ffd860', 3)], [cil(0.012, 0.012, 0.18, { x: 0.06, y: 0.1 }), brillo('#ffd860', 3)]],
  frasco_roto: () => [[bola(0.09, {}), mat('#4a9a3a', { rug: 0.1, e: '#3aff6a', ei: 1.2, relieve: 0 })], [cil(0.03, 0.035, 0.08, { y: 0.1 }), mat('#4a9a3a', { rug: 0.1 })]],
  frasco_agua: () => [[bola(0.09, {}), mat('#7ac8ff', { rug: 0.1, e: '#7ac8ff', ei: 1.2, relieve: 0 })], [cil(0.03, 0.035, 0.08, { y: 0.1 }), mat('#7ac8ff', { rug: 0.1 })]],
  frasco_fuego: () => [[bola(0.09, {}), mat('#ff7a2a', { rug: 0.1, e: '#ff7a2a', ei: 1.6, relieve: 0 })], [cil(0.03, 0.035, 0.08, { y: 0.1 }), mat('#a85a2a', { rug: 0.1 })]],
  frasco_hielo: () => [[bola(0.09, {}), mat('#a8f0ff', { rug: 0.1, e: '#a8f0ff', ei: 1.4, relieve: 0 })], [cil(0.03, 0.035, 0.08, { y: 0.1 }), mat('#a8f0ff', { rug: 0.1 })]],
  bomba: () => [[bola(0.13, {}), mat('#1e1e20')], [bola(0.04, { y: 0.15 }), brillo('#ffa030', 5)]],
  hacha: () => [[cil(0.02, 0.02, 0.4, { rx: Math.PI / 2 }), madera()], [caja(0.2, 0.025, 0.18, 0.03, { x: 0.08, z: -0.15 }), acero()]],
  cruz: () => [[caja(0.06, 0.03, 0.42, 0.01), acero()], [caja(0.26, 0.03, 0.06, 0.01, { z: -0.08 }), acero()], [bola(0.03, { y: 0.02 }), brillo('#fff4c0', 2)]],
  escudo: () => [[cil(0.24, 0.24, 0.05, {}, 12), mat('#2a3a6a')], [cil(0.08, 0.08, 0.06, {}, 8), oro()]],
  pico: () => [[cil(0.02, 0.02, 0.45, { rx: Math.PI / 2 }), madera()], [caja(0.4, 0.04, 0.04, 0.01, { z: -0.2 }), hierro()]],
  gancho: () => [[toro(0.08, 0.014, { rx: Math.PI / 2 }, Math.PI * 1.4), hierro()], [cil(0.008, 0.008, 0.3, { z: 0.15, rx: Math.PI / 2 }), hierro()]],
  sierra: () => [[cil(0.18, 0.18, 0.02, {}, 14), acero()], ...Array.from({ length: 10 }, (_, k): [THREE.BufferGeometry, THREE.Material] => [cono(0.025, 0.05, { x: Math.cos((k / 10) * Math.PI * 2) * 0.19, z: Math.sin((k / 10) * Math.PI * 2) * 0.19, rz: -Math.PI / 2, ry: -(k / 10) * Math.PI * 2 }, 3), acero()])],
  bola_hierro: () => [[bola(0.16, {}), hierro()]],
  bola_puas: () => [[bola(0.14, {}), hierro()], ...Array.from({ length: 8 }, (_, k): [THREE.BufferGeometry, THREE.Material] => [cono(0.03, 0.1, { x: Math.cos(k) * 0.14, y: Math.sin(k * 1.7) * 0.1, z: Math.sin(k) * 0.14, rx: k, rz: k * 0.7 }, 4), hierro()])],
  alma: () => [[bola(0.11, {}), mat('#8fe3ff', { e: '#8fe3ff', ei: 2.5, relieve: 0, transp: 0.85 })], [bola(0.05, { y: 0.03, z: -0.05 }), brillo('#ffffff', 3)]],
  pagina: () => [[caja(0.18, 0.01, 0.24, 0.003), mat('#ede0c0', { e: '#a88a3a', ei: 0.6 })], [caja(0.12, 0.012, 0.02, 0.002, { z: -0.05 }), mat('#4a3a2a')]],
  yunque: () => [[caja(0.5, 0.18, 0.28, 0.02, { y: 0.3 }), hierro()], [caja(0.25, 0.2, 0.18, 0.02, { y: 0.13 }), hierro()], [caja(0.4, 0.06, 0.3, 0.02), hierro()], [cono(0.09, 0.24, { x: -0.36, y: 0.32, rz: Math.PI / 2 }, 6), hierro()]],
  guillotina: () => [[caja(0.7, 0.4, 0.04, 0.01, { y: 0.25 }), acero()], [caja(0.72, 0.1, 0.08, 0.02, { y: 0.5 }), maderaOsc()]],
  rayo: () => [[cil(0.06, 0.06, 0.5, {}), brillo('#cfe8ff', 4)]],
  p_sangre: () => [[cono(0.07, 0.5, { rx: -Math.PI / 2 }, 6), brillo('#ff1030', 3)]],
  // De los enemigos
  flecha_e: () => [[cil(0.012, 0.012, 0.5, { rx: Math.PI / 2 }), maderaOsc()], [cono(0.03, 0.08, { z: -0.28, rx: -Math.PI / 2 }, 4), brillo('#ff4020', 2)], [bola(0.05, { z: 0.2 }), brillo('#ff2010', 1.5)]],
  fuego_e: () => [[bola(0.16, {}), brillo('#ff6a10', 3.5)], [bola(0.09, {}), brillo('#fff0a0', 3)]],
  orbe_e: () => [[bola(0.17, {}), mat('#a8d8ff', { e: '#6aa8ff', ei: 2.5, relieve: 0, transp: 0.8 })]],
  hueso_e: () => [[capsula(0.07, 0.4, { rx: Math.PI / 2 }), mat('#e0d6bc')], [bola(0.1, { z: 0.25 }), mat('#e0d6bc')], [bola(0.1, { z: -0.25 }), mat('#e0d6bc')]],
  sangre_e: () => [[bola(0.15, { sz: 1.3 }), brillo('#d01020', 2.5)]],
};

const cache = new Map<string, ModeloFijo>();
function de(tabla: Record<string, () => P>, prefijo: string, id: string, otro: string): ModeloFijo {
  const k = prefijo + id;
  let m = cache.get(k);
  if (!m) {
    m = fijo((tabla[id] ?? tabla[otro])());
    cache.set(k, m);
  }
  return m;
}
export const cosaReemplazo = (id: string) => de(COSAS, 'c_', id, 'cofre');
export const armaReemplazo = (id: string) => de(ARMAS, 'a_', id, 'espada_larga');
export const proyectilReemplazo = (id: string) => de(PROYECTILES, 'p_', id, 'virote');
export const hayProyectil = (id: string) => id in PROYECTILES;
