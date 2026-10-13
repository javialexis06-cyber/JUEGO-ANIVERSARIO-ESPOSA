// El epílogo de la película de Astra (docs/en-obra/pelicula-de-astra.md, capítulos 4 y 10): ALT «El Altar del Lazo»
// (las reliquias encienden el altar de la casa y las cuatro diosas invitan a la boda) y BOD «Siempre te elegiré», la
// boda en Eterna (Sopetrán): la llegada, los regalos de las diosas, Laura entrando, Lara oficiando sin velo, la
// constelación entera, la fiesta, el río con la frase de Javier, la mañana siguiente y los créditos. Sin votos: Laura no
// habla en la ceremonia y la frase de Javier va en off, al final, junto al río.
import * as THREE from 'three';
import { cargar } from '../recursos';
import { actorDiosa, actorNovio, actorPareja, actorVecino, actuar, halo, type Actor } from './cine-actores';
import type { Guion, Toma } from './cine-granja';
import { agua, anillo, colocar, copia, escenario, granja, toma, type Reparto } from './cine-acto1';
import {
  actuarDialogo, azar, bez, caminar, constelacionAmantes, fogata, instanciar, luzCalida, mirarA, motasFlotantes, paso, piezaKit, plano,
  poner, puntosSuaves, tomasDialogo, type Puesto,
} from './cine-kit';
import { LINEAS_ALTAR, LINEAS_BODA } from './cine-lineas-historia';

const DIOSAS = ['celia', 'aura', 'lara', 'fuatia'];
/** Las diosas respiran flotando. */
function flotar(rp: Reparto, t: number, alto = 0.4) { for (const [k, a] of Object.entries(rp)) if (DIOSAS.includes(k)) a.raiz.position.y = alto + Math.sin(t * 1.2 + a.raiz.position.x) * 0.06; }
/** Busca las mallas de una pieza por el comienzo del nombre (rosas del arco, llamas de las velas…). */
function partes(o: THREE.Object3D, prefijo: string) { const out: THREE.Object3D[] = []; o.traverse((x) => { if (x.name.startsWith(prefijo)) out.push(x); }); return out; }

// ------------------------------------------------------------------ ALT · El Altar del Lazo (el patio de la casa)

type Cast = [string, string, number, number][];
const CAST_ALT: Cast = [
  ['el', 'el', -3.39, -0.1], ['ella', 'ella', -2.94, -1.5],
  ['celia', 'celia', 1.6, -2.8], ['aura', 'aura', 2.68, -1.9], ['lara', 'lara', 3.3, -0.62], ['fuatia', 'fuatia', 3.37, 0.67],
];
const RELIQUIAS = ['#ff9a4a', '#5ab8e8', '#c9a050', '#e8f4ff', '#b07cff', '#ff5a6a', '#9fe39a'];
const ALTAR: [number, number] = [-0.6, -3.0];
/** Todos en un medio círculo alrededor de este punto (abierto hacia la cámara). */
const CENTRO_ALT: [number, number] = [0, 0.2];

function patio() {
  const reliquias: { s: THREE.Sprite; de: THREE.Vector3; mitad: THREE.Vector3 }[] = [];
  let constelacion: THREE.Group, brilloAltar: THREE.Sprite, luzAltar: THREE.PointLight, destello: THREE.Sprite;
  return escenario({
    hora: 'noche', sol: new THREE.Vector3(0.4, 0.55, 0.6), colores: ['#3d5a34', '#4a6a3c', '#35502e', '#56703f'], niebla: ['#0d1430', 30, 160], exposicion: 1.3,
    async montar(g) {
      const [monte, cabana, cerca, praderas, arbusto, muebles, ...as] = await Promise.all([
        cargar('granja_monte.glb'), cargar('granja-v2/casita_pueblo.glb'), cargar('granja-v2/cerca.glb'), cargar('granja-v2/flores_pradera.glb'),
        cargar('granja-v2/arbusto_flores.glb'), cargar('granja_muebles.glb'),
        ...CAST_ALT.map(([, q]) => (q === 'el' || q === 'ella' ? actorPareja(q) : actorDiosa(q as 'celia'))),
      ]);
      const rp: Reparto = Object.fromEntries(CAST_ALT.map(([id], i) => [id, as[i] as Actor]));
      const r = azar(17);
      const libre = (x: number, z: number) => Math.hypot(x, z) > 8 && !(Math.abs(x) < 7 && z < -3 && z > -13);
      const roble = piezaKit(monte, 'roble'), pino = piezaKit(monte, 'pino');
      if (roble) g.add(instanciar(roble, anillo(r, 40, 12, 60, 0, -6, [0.9, 1.5], libre)));
      if (pino) g.add(instanciar(pino, anillo(r, 30, 20, 70, 0, -10, [0.9, 1.6], libre)));
      g.add(instanciar(praderas, anillo(r, 60, 4, 14, 0, 0, [1, 1.6], (x, z) => libre(x, z) || (Math.hypot(x - 2, z) > 5.5 && z > -3))));
      g.add(instanciar(arbusto, anillo(r, 12, 6, 12, 0, 0, [1, 1.4], libre)));
      g.add(copia(cabana, 0, -8.5, 0, 1.8));
      const tramos: [number, number, number, number, number][] = [];
      for (let i = 0; i < 7; i++) if (i !== 3) tramos.push([-6.6 + i * 2.2, 0, -4.6, 0, 1]);
      g.add(instanciar(cerca, tramos));
      // El altar en el patio, con sus cristales y faroles
      g.add(poner(muebles, 'altar', ALTAR[0], ALTAR[1], 0, 1.05));
      g.add(poner(muebles, 'cristales_aura', ALTAR[0] - 1.7, ALTAR[1] - 0.2, 0.3, 1), poner(muebles, 'cristales_lara', ALTAR[0] + 1.7, ALTAR[1] - 0.2, -0.3, 1));
      for (const x of [-2.8, 2.8]) { g.add(poner(muebles, 'lampara', x, ALTAR[1] - 1.2, 0, 1.2)); const l = luzCalida('#ffcf8a', 1.4, 6); l.position.set(x, 1.4, ALTAR[1] - 1.2); g.add(l); }
      // La ventana de la casa, encendida
      const ventana = luzCalida('#ffc070', 2.4, 10); ventana.position.set(0, 2, -6.2); g.add(ventana);
      brilloAltar = halo('#ffe2a8', 2.6); brilloAltar.position.set(ALTAR[0], 1.2, ALTAR[1]); brilloAltar.material.opacity = 0; g.add(brilloAltar);
      luzAltar = new THREE.PointLight('#ffd9a0', 0, 9, 1.6); luzAltar.position.set(ALTAR[0], 1.8, ALTAR[1] + 1); g.add(luzAltar);
      // Las reliquias llegan volando de todas partes
      RELIQUIAS.forEach((col, i) => {
        const a = (i / RELIQUIAS.length) * Math.PI * 2 + 0.4;
        const de = new THREE.Vector3(Math.cos(a) * 18, 7 + (i % 3) * 2, Math.sin(a) * 18 - 4);
        const mitad = new THREE.Vector3(Math.cos(a + 0.8) * 6, 5, Math.sin(a + 0.8) * 6 + ALTAR[1]);
        const s = halo(col, 1.2); s.material.opacity = 0; g.add(s);
        reliquias.push({ s, de, mitad });
      });
      destello = halo('#ffffff', 9); destello.position.set(0, 1.4, 0.4); destello.material.opacity = 0; g.add(destello);
      constelacion = constelacionAmantes();
      constelacion.userData.manual = true;
      g.add(constelacion, motasFlotantes(160, [0, 0.4, -1], 9, 4, [1, 0.88, 0.6], 1.6, 21));
      for (const [id, q, x, z] of CAST_ALT) DIOSAS.includes(q) ? colocar(rp[id], x, z, ...CENTRO_ALT, 0.4) : colocar(rp[id], x, z, ALTAR[0], ALTAR[1]);
      // De noche y tan cerca, el halo de las diosas va más suave
      for (const d of DIOSAS) { const a = rp[d]; if (a.halo) a.halo.material.opacity = 0.13; if (a.luz) a.luz.intensity = 0.45; }
      return rp;
    },
    animar(c, rp) {
      // Las reliquias: llegan una tras otra durante la primera frase del narrador y se quedan girando sobre el altar
      const e = c.desde('ALT_n1'), dur = c.duracion('ALT_n1') || 8;
      const fin = new THREE.Vector3(ALTAR[0], 1.1, ALTAR[1]);
      reliquias.forEach(({ s, de, mitad }, i) => {
        const u = paso(i * 0.09, 0.45 + i * 0.07, e / dur);
        if (u >= 1) {
          const a = c.t * 1.4 + (i / reliquias.length) * Math.PI * 2;
          s.position.set(fin.x + Math.cos(a) * 0.7, fin.y + 0.25 + Math.sin(c.t * 2 + i) * 0.08, fin.z + Math.sin(a) * 0.4);
        } else s.position.copy(bez(de, mitad, fin, u));
        s.material.opacity = e > 0 ? 0.9 : 0;
        s.scale.setScalar(1.2 - u * 0.5);
      });
      const encendido = paso(0.6, 1, e / dur);
      brilloAltar.material.opacity = encendido * (0.4 + 0.1 * Math.sin(c.t * 3));
      luzAltar.intensity = encendido * 3.2;
      // La constelación se dibuja sobre el techo
      const k = paso(0, 4, c.desde('ALT_n2'));
      constelacion.userData.actualizar(c.t, c.alto, 0.12 + 0.88 * k);
      // Las diosas aparecen en el patio con un destello cuando Celia habla
      const ap = c.desde('ALTd_0');
      const aparece = paso(0, 1.4, ap);
      destello.material.opacity = ap > 0 ? Math.max(0, 1 - ap / 1.6) * 0.9 : 0;
      for (const id of DIOSAS) { rp[id].raiz.visible = ap > 0; rp[id].raiz.scale.setScalar(0.4 + 0.6 * aparece); }
      flotar(rp, c.t);
      // Mientras el narrador habla, los dos miran el altar; luego, el cielo
      if (c.toma.id === 'ALT_n2') for (const id of ['el', 'ella']) { mirarA(rp[id], 0, -12, c.dt * 3); actuar(rp[id], 'boca_abierta', 'sorprendido'); rp[id].p.update(c.dt); }
      else if (ap <= 0 && !c.toma.linea) for (const id of ['el', 'ella']) { mirarA(rp[id], ALTAR[0], ALTAR[1], c.dt * 3); actuar(rp[id], 'reposo', 'feliz'); rp[id].p.update(c.dt); }
      else actuarDialogo(rp, c, {}, { el: 'reposo', ella: 'reposo' });
    },
  });
}

export const ALT: Guion = (() => {
  const L = LINEAS_ALTAR;
  const pareja: Record<string, Puesto> = { el: { x: -3.39, z: -0.1 }, ella: { x: -2.94, z: -1.5 } };
  const todos: Record<string, Puesto> = Object.fromEntries(CAST_ALT.map(([id, q, x, z]) => [id, { x, z, cabeza: DIOSAS.includes(q) ? 1.45 : undefined }]));
  const obst: [number, number, number][] = [[0, -8.5, 4.6], [ALTAR[0] - 1.7, ALTAR[1] - 0.2, 0.5], [ALTAR[0] + 1.7, ALTAR[1] - 0.2, 0.5], [-2.8, ALTAR[1] - 1.2, 0.5], [2.8, ALTAR[1] - 1.2, 0.5], ...Array.from({ length: 13 }, (_, i) => [-6.6 + i * 1.1, -4.6, 0.45] as [number, number, number])];
  const tomas: Toma[] = [
    toma('ALT_abre', 'patio', 6, plano([12, 9, 18], [0, 1, -4], 44), plano([6, 3.6, 10], [0, 1.2, -2.5], 40), { musica: 'M20', entra: { color: '#000', dur: 2.4 }, bloom: 0.9 }),
    { ...toma('ALT_n1', 'patio', 9, plano([1.6, 2.2, 5.5], [-1.2, 1.0, -2.4], 40), plano([-1.8, 2.3, 5.6], [-1.6, 1.0, -2.2], 40)), linea: L[0], bloom: 0.9 },
    ...tomasDialogo([L[1], L[2]], { escena: 'patio', puestos: pareja, centro: [-2.4, -0.6], semilla: 301, prefijo: 'ALTa', bloom: 0.9, obstaculos: obst, bajos: [[ALTAR[0], ALTAR[1], 1.2]], audiencia: [0.4, 1] }),
    { ...toma('ALT_n2', 'patio', 9, plano([-1.6, 1.1, 2.6], [-1.2, 3, -12], 50), plano([-1.2, 0.9, 5.0], [0, 40, -80], 56)), linea: L[3], bloom: 1.2 },
    // Lara y Fuatia quedaban tapadas: a ellas, un plano medio de frente desde el centro del patio
    ...tomasDialogo(L.slice(4), { escena: 'patio', puestos: todos, centro: CENTRO_ALT, semilla: 303, prefijo: 'ALTd', bloom: 0.8, obstaculos: obst, bajos: [[ALTAR[0], ALTAR[1], 1.2]], audiencia: [0, 1] })
      .map((t) => t.linea?.quien === 'lara' ? { ...t, cam: { de: plano([0.5, 1.7, 0.2], [3.3, 1.6, -0.62], 36), a: plano([0.8, 1.7, 0.1], [3.3, 1.65, -0.62], 32), curva: 'ambas' as const } }
        : t.linea?.quien === 'fuatia' ? { ...t, cam: { de: plano([0.4, 1.6, 1.5], [3.37, 1.6, 0.67], 36), a: plano([0.7, 1.65, 1.4], [3.37, 1.65, 0.67], 32), curva: 'ambas' as const } } : t),
    toma('ALT_cierre', 'patio', 7, plano([1.5, 1.8, 6], [0, 1.4, -2], 40), plano([5, 9, 22], [0, 10, -40], 46), { titulo: { grande: 'El Altar del Lazo', chico: 'Epílogo' }, sale: { color: '#000', dur: 2.6 }, bloom: 1.2 }),
  ];
  return { id: 'ALT', nombre: 'El Altar del Lazo', fov: 40, tomas, escenarios: { patio } };
})();

// ------------------------------------------------------------------ BOD · Siempre te elegiré (Eterna, Sopetrán)

// Coordenadas de Eterna: el arco de la ceremonia en el centro mirando al camino (+z), la piscina a la derecha, el
// pabellón y su mesa a la izquierda, las cabañas entre los árboles y el río con sus muelles al frente (+z, detrás de
// los invitados). La fogata va en la orilla, junto al muelle.
const ARCO: [number, number] = [0, -3];
const PISCINA: [number, number] = [6.8, -1.2];
const PABELLON: [number, number] = [-10.5, -2.5];
const RIO_Z = 17;
const DECK: [number, number] = [3, RIO_Z - 2.6];
const FOGATA: [number, number] = [0.2, RIO_Z - 4.4];
/** Las sillas de los invitados: tres por lado en cinco filas, mirando al arco. */
const SILLAS: [number, number][] = [];
for (let f = 0; f < 5; f++) for (const x of [-1.5, -2.2, -2.9, 1.5, 2.2, 2.9]) SILLAS.push([x, -0.6 + f * 1.15]);
/** Los invitados (Eliana, Serena, los vecinos de la granja y los que bajaron de Verdia) y en qué silla van. */
const INVITADOS: [string, number][] = [
  ['canalizadora_aura', 0], ['canalizadora_lara', 3], ['botanica', 1], ['verdia_eneas', 4], ['senda_ofelia', 7], ['hilos_elian', 10],
  ['mercader', 6], ['cuidadora', 9], ['maestra', 12], ['veterano', 15], ['archivero', 13], ['musica', 16],
];
/** Dónde está cada invitado en la fiesta (alrededor de la mesa del pabellón). */
const FIESTA: Record<string, [number, number]> = {
  canalizadora_aura: [-12.2, -0.2], canalizadora_lara: [-11, -0.4], botanica: [-9.6, -0.2], verdia_eneas: [-8.4, -0.6], senda_ofelia: [-12.6, -4.6],
  hilos_elian: [-11.2, -4.8], mercader: [-9.8, -4.8], cuidadora: [-8.4, -4.4], maestra: [-13.6, -2.4], veterano: [-7.2, -1.6], archivero: [-7.2, -3.4], musica: [-6.4, 1.6],
};
const PAREJA_ARCO: Record<'el' | 'ella', [number, number]> = { el: [-0.55, -2.15], ella: [0.55, -2.15] };
const DIOSAS_BODA: Record<string, [number, number]> = { lara: [0, -3.55], celia: [-2.3, -3.4], aura: [2.3, -3.4], fuatia: [3.6, -2.0] };
/** El camino de Laura: desde el fondo del jardín hasta el arco. */
const CAMINO_ELLA = [new THREE.Vector3(0, 0, 8.5), new THREE.Vector3(0.05, 0, 2.5), new THREE.Vector3(PAREJA_ARCO.ella[0], 0, PAREJA_ARCO.ella[1])];

/** El lazo de cuatro hilos de Fuatia: fuego, agua, tierra y aire trenzados en una espiral de luz. */
function lazoCuatroHilos() {
  const cols = [[1, 0.55, 0.2], [0.35, 0.75, 1], [0.85, 0.7, 0.35], [0.92, 0.97, 1]];
  const r = azar(404);
  const m = puntosSuaves(320, (i, pos, col, tam, fase) => {
    const h = i % 4;
    pos.set([r(), h, 0], i * 3);
    col.set(cols[h], i * 3);
    tam[i] = 1.6 + r() * 1.6;
    fase[i] = r();
  }, 'float s=position.x;float a=s*12.566+position.y*1.5708+uT*2.;float rad=mix(1.4,.16,uJunta)*(1.-s*.15);' +
    'p=vec3((s-.5)*mix(3.2,.5,uJunta)+cos(a)*rad*.25,sin(a)*rad*.25+.05*sin(uT*3.+s*9.),cos(a+1.)*rad*.2);brillo=uLazo*(.7+.3*sin(uT*4.+aFase*6.));',
  { uJunta: { value: 0 }, uLazo: { value: 0 } });
  return m;
}

function eterna(hora: 'atardecer' | 'noche') {
  const noche = hora === 'noche';
  let rosas: THREE.Object3D[] = [], llamas: THREE.Object3D[] = [], chispa: THREE.Sprite, lazo: THREE.Points, grifo: THREE.Object3D, velo: THREE.Mesh;
  let constelacion: THREE.Group, pulso: THREE.Mesh, fuego: THREE.Group, dragon: THREE.Object3D, unicornio: THREE.Object3D;
  const faroles: THREE.Sprite[] = [];
  const reparto: Cast = [
    ['el', 'el', ...PAREJA_ARCO.el], ['ella', 'ella', ...PAREJA_ARCO.ella],
    ...Object.entries(DIOSAS_BODA).map(([id, [x, z]]) => [id, id, x, z] as [string, string, number, number]),
    ...INVITADOS.map(([id, s]) => [id, id, SILLAS[s][0], SILLAS[s][1]] as [string, string, number, number]),
  ];
  return escenario({
    hora, sol: noche ? new THREE.Vector3(0.3, 0.6, 0.7) : new THREE.Vector3(-0.75, 0.22, -0.6),
    colores: noche ? ['#2f4a2c', '#3a5634', '#2b4428', '#46603a'] : ['#5f8a3c', '#77a04a', '#4f7a34', '#8aa85a'],
    niebla: noche ? ['#0d1430', 35, 170] : ['#f2b98c', 40, 190], exposicion: noche ? 1.55 : 1.1, radio: 26,
    async montar(g) {
      const [kit, monte, praderas, arbusto, grifoM, dragonM, unicornioM, ...as] = await Promise.all([
        cargar('granja_eterna.glb'), cargar('granja_monte.glb'), cargar('granja-v2/flores_pradera.glb'), cargar('granja-v2/arbusto_flores.glb'),
        cargar('granja-v3/grifo.glb'), cargar('granja-v3/dragon.glb'), cargar('granja-v3/unicornio.glb'),
        ...reparto.map(([, q]) => (q === 'el' || q === 'ella' ? actorNovio(q) : DIOSAS.includes(q) ? actorDiosa(q as 'lara', q === 'lara') : actorVecino(q))),
      ]);
      const rp: Reparto = Object.fromEntries(reparto.map(([id], i) => [id, as[i] as Actor]));
      // El jardín: árboles grandes, cabañas en A entre el monte y platanillos por todas partes
      const libre = (x: number, z: number) =>
        !(Math.abs(x) < 4.4 && z > -5 && z < 10) && Math.hypot(x - PISCINA[0], z - PISCINA[1]) > 5 && Math.hypot(x - PABELLON[0], z - PABELLON[1]) > 6.5 && Math.abs(z - RIO_Z) > 4;
      const r = azar(1025);
      g.add(poner(kit, 'arco_boda', ARCO[0], ARCO[1], 0, 1));
      rosas = [...partes(g.children[g.children.length - 1], 'rosa boda'), ...partes(g.children[g.children.length - 1], 'hojas boda')];
      g.add(poner(kit, 'piscina', PISCINA[0], PISCINA[1], Math.PI, 1));
      g.add(poner(kit, 'pabellon', PABELLON[0], PABELLON[1], 0, 1.15));
      g.add(poner(kit, 'mesa_larga', PABELLON[0], PABELLON[1], 0, 1.25));
      for (const [x, z, giro, e] of [[-6.5, -10, 0.3, 2.1], [10.5, -9, -0.5, 1.8], [-17, 5, 1.2, 1.9]] as const) g.add(poner(kit, 'arbol_grande', x, z, giro, e));
      for (const [x, z, giro] of [[13, -14, -0.5], [18, -7, -1.1], [-17, -13, 0.6], [-21, -5, 1.2], [3, -17, 0]] as const) g.add(poner(kit, 'cabana_a', x, z, giro, 1.15));
      for (const [x, z, giro] of [[PABELLON[0], PABELLON[1] + 4.6, 0], [-5.5, -1.5, Math.PI / 2]] as const) g.add(poner(kit, 'guirnalda', x, z, giro, 1));
      const platanillo = piezaKit(kit, 'platanillo');
      if (platanillo) g.add(instanciar(platanillo, [...anillo(r, 70, 5, 26, 0, 0, [1.1, 1.8], libre), ...[-4, -2.6, 2.6, 4].map((x) => [x, 0, -4.4, r() * 6, 1.4] as [number, number, number, number, number])]));
      const roble = piezaKit(monte, 'roble'), pino = piezaKit(monte, 'pino');
      if (roble) g.add(instanciar(roble, anillo(r, 40, 22, 70, 0, -6, [1, 1.6], libre)));
      if (pino) g.add(instanciar(pino, anillo(r, 26, 30, 80, 0, -14, [1, 1.6], libre)));
      for (const [clave, n] of [['helecho', 40], ['mata', 30]] as const) { const p = piezaKit(monte, clave); if (p) g.add(instanciar(p, anillo(r, n, 5, 22, 0, 0, [0.9, 1.4], libre))); }
      g.add(instanciar(praderas, anillo(r, 80, 4, 20, 0, 0, [1, 1.6], libre)));
      g.add(instanciar(arbusto, anillo(r, 18, 6, 18, 0, 0, [1, 1.5], libre)));
      // Las sillas y las velas del camino
      const silla = piezaKit(kit, 'silla_boda');
      if (silla) g.add(instanciar(silla, SILLAS.map(([x, z]) => [x, 0, z + 0.05, Math.PI, 1.15] as [number, number, number, number, number])));
      for (let k = 0; k < 10; k++) for (const x of [-0.75, 0.75]) {
        const v = poner(kit, 'vela_camino', x, -1.6 + k * 1.0, 0, 1.1);
        g.add(v);
        llamas.push(...partes(v, 'llama camino'));
      }
      // El río con sus muelles y la fogata en la orilla
      const rio = agua(80, 6, '#3f7f8a');
      rio.rotation.z = Math.PI / 2;
      rio.position.set(0, 0.02, RIO_Z + 1.2);
      g.add(rio);
      g.add(poner(kit, 'deck_rio', DECK[0], DECK[1], 0, 1, 0.02), poner(kit, 'deck_rio', -7, RIO_Z - 2.4, 0.1, 1, 0.02));
      for (let k = -10; k <= 10; k++) { const p = piezaKit(monte, 'piedra_orilla'); if (p && Math.abs(k * 3.6 - DECK[0]) > 3) g.add(copia(p, k * 3.6 + r(), RIO_Z - 1.7 + r() * 0.4, r() * 6, 0.8)); }
      const juncos = piezaKit(monte, 'juncos');
      if (juncos) g.add(instanciar(juncos, Array.from({ length: 16 }, (_, i) => [-26 + i * 3.4 + r(), 0, RIO_Z - 1.4 + r() * 0.5, r() * 6, 1 + r() * 0.4] as [number, number, number, number, number]).filter(([x]) => Math.abs(x - DECK[0]) > 3)));
      g.add(poner(kit, 'fogata_piedras', FOGATA[0], FOGATA[1], 0, 1.1));
      fuego = fogata(0.8, 77);
      fuego.position.set(FOGATA[0], 0.15, FOGATA[1]);
      fuego.userData.manual = true;
      g.add(fuego);
      // Las criaturas: el grifo que trae el velo, el dragón que calienta la fogata y el unicornio de la mesa
      grifo = copia(grifoM, 0, 0, 0, 1.6);
      velo = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9, 6, 4), new THREE.MeshStandardMaterial({ color: '#fbf7f0', transparent: true, opacity: 0.8, side: THREE.DoubleSide, roughness: 0.9 }));
      grifo.add(velo); velo.position.set(0, -0.5, 0.3);
      dragon = copia(dragonM, FOGATA[0] - 2.4, FOGATA[1] + 0.4, 1.2, 1.1);
      unicornio = copia(unicornioM, PABELLON[0] - 3.1, PABELLON[1] + 0.9, 1.6, 0.55);
      g.add(grifo, dragon, unicornio);
      // La chispa de Aura, el lazo de Fuatia, los faroles de los vecinos y la luz cálida de la noche
      chispa = halo('#ffd27a', 0.9); chispa.material.opacity = 0; g.add(chispa);
      lazo = lazoCuatroHilos(); lazo.userData.manual = true; g.add(lazo);
      for (let i = 0; i < 6; i++) { const f = halo('#ffc77a', 0.7); f.material.opacity = 0; faroles.push(f); g.add(f); }
      for (const [x, z, f] of [[0, -1, 2.2], [0, 4, 1.8], [PABELLON[0], PABELLON[1], 3.2], [PABELLON[0] + 3, PABELLON[1] - 2, 2], [DECK[0], DECK[1], 1.4]] as const) {
        const l = luzCalida('#ffc27a', noche ? f * 1.3 : f * 0.6, 9); l.position.set(x, 2.4, z); g.add(l);
      }
      // La constelación y el pulso que recorre el escudo del mundo
      constelacion = constelacionAmantes();
      constelacion.userData.manual = true;
      pulso = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), new THREE.MeshBasicMaterial({ color: '#ffe2a8', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide, fog: false }));
      g.add(constelacion, pulso, motasFlotantes(noche ? 260 : 140, [0, 0.6, 2], 14, 4, noche ? [1, 0.9, 0.6] : [1, 0.95, 0.8], 1.6, 31));
      for (const [id, q, x, z] of reparto) {
        if (DIOSAS.includes(q)) colocar(rp[id], x, z, 0, 0, 0.4);
        else if (q === 'el' || q === 'ella') colocar(rp[id], x, z, q === 'el' ? 1 : -1, z);
        else { colocar(rp[id], x, z, x * 0.3, ARCO[1]); rp[id].p.quieto('sentado'); rp[id].raiz.position.y = 0.12; }
      }
      return rp;
    },
    animar(c, rp) {
      const id = c.toma.id;
      const fiesta = id.startsWith('BOD_fiesta'), rio = id.startsWith('BOD_rio');
      // Celia hace florecer el arco desde abajo; Aura enciende las velas con una chispa que salta; Fuatia junta el lazo
      const florece = noche ? 1 : paso(0, 7, c.desde('BOD_celia'));
      rosas.forEach((o, i) => { const k = paso(i / rosas.length * 0.8, i / rosas.length * 0.8 + 0.2, florece); o.scale.setScalar(Math.max(0.001, k)); });
      const enciende = noche ? 20 : c.desde('BOD_aura');
      const salto = 0.45;
      llamas.forEach((l, i) => { l.visible = enciende > (Math.floor(i / 2) * salto) + 0.6; });
      if (!noche && enciende > 0 && enciende < 10 * salto + 0.8) {
        const k = Math.min(9, Math.floor((enciende - 0.6) / salto)), u = ((enciende - 0.6) / salto) % 1;
        const a = new THREE.Vector3(-0.75, 0.6, -1.6 + Math.max(0, k) * 1.0), b = new THREE.Vector3(0.75, 0.6, -1.6 + Math.max(0, k) * 1.0);
        chispa.position.copy(enciende < 0.6 ? new THREE.Vector3(DIOSAS_BODA.aura[0], 1.5, DIOSAS_BODA.aura[1]).lerp(a, enciende / 0.6) : a.lerp(b, u));
        chispa.position.y += Math.sin(u * Math.PI) * 0.4;
        chispa.material.opacity = 0.95;
      } else chispa.material.opacity = 0;
      const lz = c.desde('BOD_fuatia'), ata = c.desde('BOD_ata');
      const uL = (lazo.material as THREE.ShaderMaterial).uniforms;
      uL.uT.value = c.t; uL.uEscala.value = c.alto / 720;
      uL.uLazo.value = noche ? (rio || fiesta ? 0 : 1) : lz > 0 ? 1 : 0;
      uL.uJunta.value = noche ? 1 : paso(0, 3, ata);
      if (ata > 0 || noche) lazo.position.set(0, 0.72, PAREJA_ARCO.el[1] + 0.05);
      else lazo.position.set(DIOSAS_BODA.fuatia[0] - 0.6, 1.5, DIOSAS_BODA.fuatia[1]);
      // El grifo trae el velo volando (antes de que Laura entre)
      const gv = c.desde('BOD_llegada');
      const ug = Math.min(1, gv / Math.max(1, c.duracion('BOD_llegada')));
      grifo.visible = !noche && gv > 0 && ug < 1;
      if (grifo.visible) {
        const p = bez(new THREE.Vector3(-26, 12, -8), new THREE.Vector3(-4, 9, 4), new THREE.Vector3(10, 6, 12), ug);
        const q = bez(new THREE.Vector3(-26, 12, -8), new THREE.Vector3(-4, 9, 4), new THREE.Vector3(10, 6, 12), Math.min(1, ug + 0.01));
        grifo.position.copy(p); grifo.lookAt(q);
        velo.rotation.x = Math.sin(c.t * 5) * 0.2;
      }
      // Faroles: los vecinos llegan a la ceremonia con faroles al atardecer
      faroles.forEach((f, i) => {
        const vis = !noche && id === 'BOD_llegada';
        f.material.opacity = vis ? 0.85 : 0;
        if (vis) { const u = paso(0, 1, c.local / c.dur); f.position.set(-1.6 + (i % 3) * 1.6, 1.1, 14 - u * 8 - (i > 2 ? 1.5 : 0)); }
      });
      // Laura entra caminando por el camino de velas; Javier, en el arco, no sabe qué hacer con las manos
      const en = c.desde('BOD_entra'), dEn = c.duracion('BOD_entra') || 20;
      const el = rp.el, ella = rp.ella;
      const nervioso = !noche && en > 0 && (id === 'BOD_entra' || id === 'BOD_manos');
      if (!noche) {
        if (en < 0) { ella.raiz.position.copy(CAMINO_ELLA[0]); ella.raiz.visible = false; }
        else {
          ella.raiz.visible = true;
          const s = Math.min(1, en / (dEn * 0.85));
          if (!caminar(ella, CAMINO_ELLA, s, c.t)) actuar(ella, 'caminar_a', 'feliz');
          else { mirarA(ella, PAREJA_ARCO.el[0], PAREJA_ARCO.el[1], c.dt * 3); ella.p.cuerpo.position.y = 0; }
        }
        if (nervioso) { mirarA(el, ella.raiz.position.x, ella.raiz.position.z, c.dt * 3); el.p.vaiven('frotar_manos_a', 'rascarse', 0.5 + 0.5 * Math.sin(en * 1.3)); el.p.cara(en % 6 < 3 ? 'sorprendido' : 'feliz'); }
      }
      // La noche: constelación entera, pulso del escudo, fiesta y río
      const cons = c.desde('BOD_constelacion');
      constelacion.userData.actualizar(c.t, c.alto, noche ? 0.35 + 0.65 * paso(0, 3, cons) : 0.15);
      const pu = c.desde('BOD_pulso');
      pulso.scale.setScalar(2 + Math.max(0, pu) * 60);
      (pulso.material as THREE.MeshBasicMaterial).opacity = pu > 0 && pu < 4 ? 0.35 * (1 - pu / 4) : 0;
      constelacion.rotation.y = rio ? Math.PI : 0;
      fuego.visible = noche;
      if (noche) fuego.userData.actualizar(c.t, c.alto);
      dragon.visible = noche;
      if (noche) dragon.rotation.y = 1.2 + Math.sin(c.t * 0.6) * 0.15;
      unicornio.position.y = 0;
      unicornio.rotation.z = fiesta ? Math.sin(c.t * 2) * 0.03 : 0;
      for (const id2 of DIOSAS) rp[id2].raiz.visible = !rio;
      if (noche) {
        for (const [inv] of INVITADOS) {
          const a = rp[inv];
          a.raiz.visible = !rio;
          if (fiesta) { const [x, z] = FIESTA[inv]; a.raiz.position.set(x, 0, z); mirarA(a, PABELLON[0], PABELLON[1] + 2.6, 1); a.p.vaiven('aplauso_a', 'aplauso_b', 0.5 + 0.5 * Math.sin(c.t * 6 + x)); a.p.cara('feliz'); a.p.update(c.dt); }
        }
        if (fiesta) {
          // El baile lento frente al pabellón
          const bx = PABELLON[0] + 0.3, bz = PABELLON[1] + 3.6, a = c.t * 0.35;
          el.raiz.position.set(bx + Math.cos(a) * 0.32, 0, bz + Math.sin(a) * 0.32);
          ella.raiz.position.set(bx - Math.cos(a) * 0.32, 0, bz - Math.sin(a) * 0.32);
          mirarA(el, ella.raiz.position.x, ella.raiz.position.z, 1); mirarA(ella, el.raiz.position.x, el.raiz.position.z, 1);
          el.p.vaiven('abrazo_der', 'baile_a', 0.25 + 0.15 * Math.sin(c.t * 1.4)); ella.p.vaiven('abrazo_izq', 'baile_b', 0.25 + 0.15 * Math.sin(c.t * 1.4));
          el.p.cara('feliz'); ella.p.cara('feliz');
          for (const d of DIOSAS) { const [x, z] = [PABELLON[0] + 2.5 + DIOSAS.indexOf(d) * 1.1, PABELLON[1] + 5.6]; rp[d].raiz.position.x = x; rp[d].raiz.position.z = z; mirarA(rp[d], bx, bz, 1); }
        } else if (rio) {
          // Los dos solos en el muelle, sentados mirando el agua y la constelación
          el.raiz.position.set(DECK[0] - 0.35, 0.36, DECK[1] + 0.9); ella.raiz.position.set(DECK[0] + 0.35, 0.36, DECK[1] + 0.9);
          el.raiz.rotation.y = 0; ella.raiz.rotation.y = 0;
          actuar(el, 'sentado', 'feliz'); actuar(ella, 'sentado_feliz', 'feliz');
          if (id === 'BOD_rio_frase') { el.p.cara(c.local % 5 < 4 ? 'feliz' : 'normal'); }
        } else {
          el.raiz.position.set(...[PAREJA_ARCO.el[0], 0, PAREJA_ARCO.el[1]] as [number, number, number]);
          ella.raiz.position.set(...[PAREJA_ARCO.ella[0], 0, PAREJA_ARCO.ella[1]] as [number, number, number]);
          mirarA(el, ella.raiz.position.x, ella.raiz.position.z, 1); mirarA(ella, el.raiz.position.x, el.raiz.position.z, 1);
          actuar(el, cons > 1.5 ? 'abrazo_der' : 'reposo', 'feliz'); actuar(ella, cons > 1.5 ? 'abrazo_izq' : 'reposo', 'feliz');
          for (const [inv] of INVITADOS) { actuar(rp[inv], 'celebrar', 'feliz'); rp[inv].raiz.position.y = 0; rp[inv].p.update(c.dt); }
        }
        el.p.update(c.dt); ella.p.update(c.dt);
        for (const d of DIOSAS) { mirarA(rp[d], 0, PAREJA_ARCO.el[1], c.dt * 2); actuar(rp[d], 'reposo', 'feliz'); rp[d].p.update(c.dt); }
        flotar(rp, c.t);
        return;
      }
      flotar(rp, c.t);
      // Los invitados, sentados, miran a Laura cuando entra y luego al arco
      for (const [inv] of INVITADOS) {
        const a = rp[inv];
        if (nervioso) mirarA(a, ella.raiz.position.x, ella.raiz.position.z, c.dt * 2);
        else mirarA(a, a.raiz.position.x * 0.3, ARCO[1], c.dt * 2);
        actuar(a, 'sentado', nervioso ? 'feliz' : 'normal');
        a.p.update(c.dt);
      }
      if (c.toma.linea) actuarDialogo({ lara: rp.lara, aura: rp.aura, celia: rp.celia, fuatia: rp.fuatia, el, ella }, c, {}, { el: 'reposo', ella: 'reposo' });
      else {
        for (const d of DIOSAS) { const a = rp[d]; const regalo = (d === 'celia' && id === 'BOD_celia') || (d === 'aura' && id === 'BOD_aura') || (d === 'fuatia' && id === 'BOD_fuatia');
          actuar(a, regalo ? 'senalar_arriba' : 'reposo', 'feliz'); a.p.update(c.dt); }
        if (!nervioso) actuar(el, 'reposo', 'feliz');
        el.p.update(c.dt); ella.p.update(c.dt);
      }
    },
  });
}

/** Los créditos: la noche de Eterna con la constelación y los nombres de todas las escenas subiendo despacio. */
const CAPITULOS = [
  'Prólogo · El nacimiento de Celia', 'Dos surcos', 'El agua que escucha', 'La Noche Eterna', 'La campana y la mesa', 'El brote que puede esperar',
  'Las Afueras', 'La firma', 'El fuego bajo la piedra', 'La cría que no quiere hablar', 'El Santuario roto', 'La copa', 'Una mañana que no basta',
  'El descenso', 'La ayuda que no llegó', 'El día posterior al nacimiento', 'Lo que no vuelve idéntico', 'La casa que dejé esperando', 'La casa de Elián',
  'El nombre que no se pronuncia por otro', 'El precio de una alianza', 'La cuenta que ya no se cierra sola', 'El tratado', 'El ceramista',
  'Una estrella sin dueño', 'La parcela de mañana', 'El Altar del Lazo', 'Siempre te elegiré',
];
function creditos() {
  let rollo: THREE.Mesh, constelacion: THREE.Group;
  return escenario({
    hora: 'noche', sol: new THREE.Vector3(0.2, 0.5, -0.9), colores: null, fondo: '#03040c', exposicion: 1.3, radio: 10,
    async montar(g) {
      const { cielo } = await import('./cine-kit');
      g.add(cielo('noche', new THREE.Vector3(0.2, 0.4, -0.9)));
      const cv = document.createElement('canvas');
      cv.width = 1024; cv.height = 4096;
      const x = cv.getContext('2d')!;
      x.textAlign = 'center';
      let y = 120;
      const linea = (txt: string, tam: number, color: string, alto: number, fuente = 'Georgia') => { x.fillStyle = color; x.font = `${tam}px ${fuente}`; x.fillText(txt, 512, y); y += alto; };
      linea('Nuestro Hogar', 84, '#ffe2a8', 110);
      linea('La película de Astra', 48, '#f3ead8', 170);
      CAPITULOS.forEach((t, i) => linea(`${i === 0 ? '' : `${i}. `}${t}`, 40, i % 2 ? '#e9e4f5' : '#f6efe2', 92));
      y += 80;
      linea('Con Él y con Ella', 46, '#ffe2a8', 80);
      linea('Celia · Aura · Lara · Fuatia', 40, '#f3ead8', 70);
      linea('Eliana · Serena · Eneas · Ofelia · Elián', 36, '#e9e4f5', 70);
      linea('y todos los vecinos de Astra', 36, '#e9e4f5', 160);
      linea('Hecho a mano, ciclo tras ciclo,', 40, '#f6efe2', 64);
      linea('para la que siempre voy a elegir.', 40, '#f6efe2', 64);
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      rollo = new THREE.Mesh(new THREE.PlaneGeometry(4, 16), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
      rollo.position.set(0, -8, -6);
      constelacion = constelacionAmantes();
      constelacion.userData.manual = true;
      g.add(rollo, constelacion, motasFlotantes(180, [0, 0, -8], 10, 8, [1, 0.88, 0.6], 1.8, 19));
      return {};
    },
    animar(c) {
      const e = c.desde('BOD_creditos'), d = c.duracion('BOD_creditos') || 60;
      rollo.position.y = -9 + paso(0, 1, e / d) * 22.5;
      constelacion.userData.actualizar(c.t, c.alto, 1);
    },
  });
}

export const BODA: Guion = (() => {
  const L = Object.fromEntries(LINEAS_BODA.map((l) => [l.id, l]));
  const puestos: Record<string, Puesto> = {
    lara: { x: DIOSAS_BODA.lara[0], z: DIOSAS_BODA.lara[1], cabeza: 1.5 }, celia: { x: DIOSAS_BODA.celia[0], z: DIOSAS_BODA.celia[1], cabeza: 1.45 },
    aura: { x: DIOSAS_BODA.aura[0], z: DIOSAS_BODA.aura[1], cabeza: 1.45 }, fuatia: { x: DIOSAS_BODA.fuatia[0], z: DIOSAS_BODA.fuatia[1], cabeza: 1.45 },
    el: { x: PAREJA_ARCO.el[0], z: PAREJA_ARCO.el[1] }, ella: { x: PAREJA_ARCO.ella[0], z: PAREJA_ARCO.ella[1] },
  };
  const obst: [number, number, number][] = [[-1.15, ARCO[1], 0.35], [1.15, ARCO[1], 0.35], ...SILLAS.map(([x, z]) => [x, z, 0.4] as [number, number, number])];
  const dialogo = (ids: string[], semilla: number, prefijo: string) =>
    tomasDialogo(ids.map((k) => L[k]), { escena: 'tarde', puestos, centro: [0, -2.6], semilla, prefijo, bloom: 0.75, obstaculos: obst, audiencia: [0, 1] });
  const tomas: Toma[] = [
    // 1. La llegada: desde la constelación, bajando sobre Eterna al atardecer
    toma('BOD_cielo', 'tarde', 6, plano([0, 30, 30], [0, 60, -120], 50), plano([0, 16, 34], [0, 2, -4], 48), { musica: 'cine-boda-ceremonia', entra: { color: '#fff4e2', dur: 3 }, bloom: 0.8 }),
    toma('BOD_llegada', 'tarde', 9, plano([-14, 8, 24], [-2, 1, -2], 44), plano([-5, 3.4, 16], [0, 1, -2], 40), { bloom: 0.7 }),
    toma('BOD_pabellon', 'tarde', 5, plano([PABELLON[0] + 7, 2.4, PABELLON[1] + 8], [PABELLON[0], 1.2, PABELLON[1]], 40), plano([PABELLON[0] + 4, 2.2, PABELLON[1] + 7], [PABELLON[0], 1, PABELLON[1]], 40), { bloom: 0.7 }),
    // 2. Los regalos de las diosas
    toma('BOD_celia', 'tarde', 7, plano([2.6, 1.6, 2.6], [0, 1.4, -3], 40), plano([1.2, 1.3, 3.2], [0, 1.8, -3], 40), { bloom: 0.8 }),
    toma('BOD_aura', 'tarde', 7, plano([3, 1.2, 9], [0, 0.4, 2], 40), plano([-2.6, 1.4, 7], [0, 0.4, 1], 40), { bloom: 0.9 }),
    toma('BOD_fuatia', 'tarde', 6, plano([5.8, 1.8, 1.2], [DIOSAS_BODA.fuatia[0] - 0.4, 1.4, DIOSAS_BODA.fuatia[1]], 38), plano([5.2, 1.6, 0.4], [DIOSAS_BODA.fuatia[0] - 0.6, 1.5, DIOSAS_BODA.fuatia[1]], 36), { bloom: 0.9 }),
    // 3. Laura entra (sin diálogo)
    toma('BOD_entra', 'tarde', 22, plano([0, 1.7, 3.4], [0, 1, 9], 38), plano([0.4, 1.6, -1.2], [0, 0.9, 5], 38), { bloom: 0.75 }),
    toma('BOD_manos', 'tarde', 4, plano([-1.6, 1.3, -0.8], [PAREJA_ARCO.el[0], 0.9, PAREJA_ARCO.el[1]], 34), undefined, { bloom: 0.7 }),
    toma('BOD_llega', 'tarde', 5, plano([0, 2, 6], [0, 1.1, -2.6], 38), plano([0, 1.6, 3.6], [0, 1.1, -2.6], 36), { bloom: 0.75 }),
    // 4. Lara oficia
    ...dialogo(['BOD.LA1', 'BOD.A1', 'BOD.C1'], 501, 'BODa'),
    { ...toma('BOD_ata', 'tarde', 6, plano([1.2, 1.2, -0.6], [0, 0.75, -2.1], 34), plano([0.8, 1.0, -1.1], [0, 0.75, -2.1], 30)), linea: L['BOD.F1'], bloom: 1 },
    ...dialogo(['BOD.LA2'], 503, 'BODb'),
    // 5. La constelación: las manos, el lazo y el cielo entero
    { ...toma('BOD_constelacion', 'noche', 8, plano([0, 1.2, 1.4], [0, 1.2, -2.4], 40), plano([0, 0.9, 6], [0, 30, -90], 54)), linea: L['BOD.N1'], bloom: 1.3 },
    toma('BOD_pulso', 'noche', 5, plano([0, 22, 40], [0, 30, -90], 56), plano([0, 40, 60], [0, 40, -100], 58), { bloom: 1.5 }),
    // 6. La fiesta
    toma('BOD_fiesta_mesa', 'noche', 7, plano([PABELLON[0] + 5, 2.2, PABELLON[1] + 7], [PABELLON[0], 1, PABELLON[1] + 1], 40), plano([PABELLON[0] + 2, 2.6, PABELLON[1] + 8.5], [PABELLON[0], 1, PABELLON[1] + 2], 40), { musica: 'cine-boda-fiesta', bloom: 1 }),
    toma('BOD_fiesta_baile', 'noche', 8, plano([PABELLON[0] + 2.6, 1.3, PABELLON[1] + 6.2], [PABELLON[0] + 0.3, 1, PABELLON[1] + 3.6], 36), plano([PABELLON[0] - 1.8, 1.4, PABELLON[1] + 6.4], [PABELLON[0] + 0.3, 1, PABELLON[1] + 3.6], 36), { bloom: 1 }),
    toma('BOD_fiesta_unicornio', 'noche', 5, plano([PABELLON[0] - 1, 1.3, PABELLON[1] + 3.6], [PABELLON[0] - 3, 0.7, PABELLON[1] + 0.9], 34), undefined, { bloom: 1 }),
    toma('BOD_fiesta_dragon', 'noche', 6, plano([FOGATA[0] + 2.4, 1.4, FOGATA[1] - 3.2], [FOGATA[0] - 1, 0.7, FOGATA[1]], 38), plano([FOGATA[0] + 1.2, 1.2, FOGATA[1] - 3.6], [FOGATA[0] - 1, 0.7, FOGATA[1]], 36), { bloom: 1.1 }),
    // 7. El río: los dos solos, y la frase de Javier en off
    toma('BOD_rio', 'noche', 7, plano([DECK[0] - 6, 3, DECK[1] - 7], [DECK[0], 0.8, DECK[1] + 1], 42), plano([DECK[0] - 2, 1.6, DECK[1] - 4], [DECK[0], 1, DECK[1] + 1], 40), { musica: 'cine-boda-creditos', bloom: 1.1 }),
    { ...toma('BOD_rio_frase', 'noche', 12, plano([DECK[0], 1.3, DECK[1] - 2.2], [DECK[0], 3, DECK[1] + 30], 44), plano([DECK[0], 1.1, DECK[1] - 3.6], [DECK[0], 20, DECK[1] + 80], 50)), linea: L['BOD.L1'], bloom: 1.3, sale: { color: '#fff', dur: 3 } },
    // 8. La mañana siguiente en la parcela
    { ...toma('BOD_manana', 'manana', 5, plano([1.4, 1.2, 4.2], [-1.6, 0.6, 1.2], 38), undefined, { entra: { color: '#fff', dur: 2 } }), linea: L['BOD.E1'], bloom: 0.6 },
    { ...toma('BOD_manana2', 'manana', 4, plano([-4.4, 1.3, 3.4], [-1.6, 0.7, 1.4], 38)), linea: L['BOD.L2'], bloom: 0.6 },
    toma('BOD_manana3', 'manana', 6, plano([-2, 1.2, 4.6], [-1.6, 0.5, 0.6], 36), plano([9, 6, 16], [0, 0.8, -2], 40), { bloom: 0.6, titulo: { grande: 'Siempre te elegiré', chico: 'Epílogo' }, sale: { color: '#000', dur: 2.4 } }),
    // Créditos
    toma('BOD_creditos', 'creditos', 70, plano([0, 1.4, 6], [0, 2, -6], 44), plano([0, 1.4, 5.6], [0, 2.4, -6], 44), { entra: { color: '#000', dur: 2 }, bloom: 1.1 }),
    toma('BOD_fin', 'creditos', 7, plano([0, 1.4, 5.6], [0, 30, -100], 52), undefined, { titulo: { grande: 'Feliz aniversario', chico: 'Nuestro Hogar' }, sale: { color: '#000', dur: 3 }, bloom: 1.3 }),
  ];
  const manana = () => granja(false, { reparto: [['el', 'el', -2.1, 0.9, 0.85, 0], ['ella', 'ella', -1.2, 1.9, -0.85, 0]] });
  return { id: 'BOD', nombre: 'Siempre te elegiré', fov: 40, tomas, escenarios: { tarde: () => eterna('atardecer'), noche: () => eterna('noche'), manana, creditos } };
})();

