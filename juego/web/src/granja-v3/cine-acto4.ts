// Las películas de los Actos IV y V de la película de Astra (docs/en-obra/pelicula-de-astra.md, capítulo 3):
// C13 «El precio de una alianza», C14 «La cuenta que ya no se cierra sola», C07 «El tratado», C08 «El ceramista»,
// C09 «Una estrella sin dueño» (el Borde de Astra) y C10 «La parcela de mañana» (los dos surcos, sanos).
import * as THREE from 'three';
import { cargar } from '../recursos';
import { actorDiosa, actorNathGora, actorPareja, actorVaelThor, actorVecino, halo, type Actor } from './cine-actores';
import type { Escenario, Guion, Toma } from './cine-granja';
import { anillo, colocar, copia, escenario, granja, toma, type Reparto } from './cine-acto1';
import { actuarDialogo, azar, constelacionAmantes, instanciar, luzCalida, motasFlotantes, paso, piezaKit, plano, poner, tomasDialogo, type Puesto } from './cine-kit';
import { LINEAS_CAMPANA } from './cine-lineas-campana';

type Cast = [string, string, number, number][];

/** Crea el reparto: 'el' y 'ella' son la pareja, las diosas y los villanos sus actores, y el resto vecinos. */
async function reparto(cast: Cast): Promise<Reparto> {
  const crear = (q: string): Promise<Actor> =>
    q === 'el' || q === 'ella' ? actorPareja(q) : ['celia', 'aura', 'lara', 'fuatia'].includes(q) ? actorDiosa(q as 'fuatia') : q === 'vaelthor' ? actorVaelThor() : q === 'nathgora' ? actorNathGora() : actorVecino(q);
  const as = await Promise.all(cast.map(([, q]) => crear(q)));
  return Object.fromEntries(cast.map(([id], i) => [id, as[i]]));
}
const diosa = (q: string) => ['celia', 'aura', 'lara', 'fuatia'].includes(q);
/** Pone a cada uno en su sitio mirando al centro (las diosas flotan). */
function ubicar(rp: Reparto, cast: Cast, cx: number, cz: number) { for (const [id, q, x, z] of cast) colocar(rp[id], x, z, cx, cz, diosa(q) ? 0.4 : 0); }
const puestosDe = (cast: Cast): Record<string, Puesto> => Object.fromEntries(cast.map(([id, q, x, z]) => [id, { x, z, cabeza: diosa(q) ? 1.45 : q === 'nathgora' ? 2.2 : undefined }]));
/** Las diosas respiran flotando. */
function flotar(rp: Reparto, t: number) { for (const a of Object.values(rp)) if (a.halo) a.raiz.position.y = 0.4 + Math.sin(t * 1.2 + a.raiz.position.x) * 0.06; }

/** Un planeta grande en el cielo (Celia vista desde arriba): esfera con su atmósfera. */
function planetaCelia(radio: number) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.SphereGeometry(radio, 48, 24), new THREE.MeshStandardMaterial({ color: '#5f9a6a', emissive: '#1a3a4a', emissiveIntensity: 0.4, roughness: 1, fog: false }));
  const h = halo('#9fd6ff', radio * 2.9);
  h.material.opacity = 0.45;
  g.add(m, h);
  return g;
}

// ------------------------------------------------------------------ C13 · El precio de una alianza (la estación)

const CAST_C13: Cast = [['orbita_helena', 'orbita_helena', 1.4, -0.4], ['fuatia', 'fuatia', 1.6, -2.6], ['el', 'el', -1.6, 1.0], ['ella', 'ella', -0.2, 1.8]];
function estacion(): Escenario {
  let marcas: THREE.Sprite[] = [];
  return escenario({
    hora: 'noche', sol: new THREE.Vector3(0.6, 0.5, 0.4), colores: ['#8a8a96', '#9a9aa6', '#7a7a86'], niebla: ['#0a0c18', 40, 200], exposicion: 1.35,
    async montar(g) {
      const [paisaje, muebles, rp] = await Promise.all([cargar('granja_astra_paisaje.glb'), cargar('granja_muebles.glb'), reparto(CAST_C13)]);
      g.add(poner(paisaje, 'invernadero_cupula', -5, -7, 0.3, 1.2), poner(paisaje, 'antena', 5, -6, -0.4, 1.2), poner(paisaje, 'plataforma_nave', 7, 2, 0.6));
      const r = azar(3);
      for (const [clave, n] of [['roca_lunar', 18], ['crater', 8], ['panel_solar', 6]] as const) { const p = piezaKit(paisaje, clave); if (p) g.add(instanciar(p, anillo(r, n, 6, 26, 0, -2, [0.9, 1.4], (x, z) => Math.hypot(x, z) > 5))); }
      g.add(poner(muebles, 'mesa_mapas', 0, -1, 0, 1.2));
      // Las cuatro lecturas sobre el mapa
      marcas = ['#ff8a3a', '#5ab8e8', '#c9a050', '#e8f4ff'].map((col, i) => { const h = halo(col, 0.9); h.position.set(-0.6 + i * 0.4, 1.05, -1); h.material.opacity = 0.6; g.add(h); return h; });
      const p = planetaCelia(22);
      p.position.set(-30, 26, -90);
      g.add(p, motasFlotantes(100, [0, 0.5, -1], 6, 3, [0.7, 0.85, 1], 1.4, 5));
      ubicar(rp, CAST_C13, 0, -1);
      return rp;
    },
    animar(c, rp) {
      marcas.forEach((m, i) => { m.material.opacity = 0.45 + 0.25 * Math.sin(c.t * 2 + i); });
      flotar(rp, c.t);
      actuarDialogo(rp, c);
    },
  });
}

export const C13: Guion = (() => {
  const L = LINEAS_CAMPANA.C13;
  const tomas: Toma[] = [
    { ...toma('C13_abre', 'estacion', 7, plano([10, 6, 14], [-10, 12, -60], 46), plano([4, 2.4, 7], [0, 1, -1], 40), { musica: 'M23', entra: { color: '#000', dur: 2.5 }, bloom: 0.9 }) },
    ...tomasDialogo(L.slice(0, -1), { escena: 'estacion', puestos: puestosDe(CAST_C13), centro: [0.2, -0.2], semilla: 161, prefijo: 'C13', bloom: 0.8, obstaculos: [[-5, -7, 3.6], [5, -6, 1.4], [7, 2, 3]], bajos: [[0, -1, 1.4]], audiencia: [0.1, 1] }),
    { ...toma('C13_cierre', 'estacion', 7, plano([2, 1.8, 4], [0, 1, -1], 38), plano([6, 5, 12], [-10, 10, -60], 44)), linea: L[L.length - 1], bloom: 0.9 },
    toma('C13_titulo', 'estacion', 5, plano([6, 5, 12], [-10, 10, -60], 44), undefined, { titulo: { grande: 'El precio de una alianza', chico: 'Fuatia' }, sale: { color: '#000', dur: 2 }, bloom: 0.9 }),
  ];
  return { id: 'C13', nombre: 'El precio de una alianza', fov: 38, tomas, escenarios: { estacion } };
})();

// ------------------------------------------------------------------ C14 · La cuenta que ya no se cierra sola (Confluencia)

const CAST_C14: Cast = [['fuatia', 'fuatia', 0, -2.2], ['orbita_helena', 'orbita_helena', 2.2, 0.4], ['el', 'el', -1.4, 1.6], ['ella', 'ella', 0.4, 2.0], ['vaelthor', 'vaelthor', -3.2, -2.8]];
function confluencia(): Escenario {
  const valvulas: THREE.Sprite[] = [];
  return escenario({
    hora: 'atardecer', sol: new THREE.Vector3(-0.5, 0.3, -0.8), colores: ['#c9a87a', '#b8946a', '#7fae8a', '#8ab6c8'], niebla: ['#e6c4a8', 30, 170], exposicion: 1.15,
    async montar(g) {
      const [paisaje, rp] = await Promise.all([cargar('granja_astra_paisaje.glb'), reparto(CAST_C14)]);
      // Las cuatro válvulas (pilares de los elementos) y la baliza en el centro
      const cols = ['#ff8a3a', '#5ab8e8', '#c9a050', '#e8f4ff'];
      [[-4.5, -4.5], [4.5, -4.5], [4.5, 3.5], [-4.5, 3.5]].forEach(([x, z], i) => {
        g.add(poner(paisaje, 'pilar_elemental', x, z, i, 1.2));
        const h = halo(cols[i], 2.2); h.position.set(x, 2.6, z); h.material.opacity = 0.2; valvulas.push(h); g.add(h);
      });
      g.add(poner(paisaje, 'faro', 0, -6.5, 0, 0.8));
      const r = azar(9);
      for (const [clave, n] of [['basalto', 10], ['arbol_niebla', 14], ['cristal_oscuro', 6]] as const) { const p = piezaKit(paisaje, clave); if (p) g.add(instanciar(p, anillo(r, n, 9, 30, 0, -1, [0.9, 1.4], () => true))); }
      g.add(motasFlotantes(220, [0, 0.4, -1], 9, 4, [1, 0.85, 0.6], 1.8, 7));
      ubicar(rp, CAST_C14, 0, 0);
      return rp;
    },
    animar(c, rp) {
      // Las válvulas se cierran una a una (vuelven a su color) mientras avanza la escena
      const u = c.t / 140;
      valvulas.forEach((v, i) => { v.material.opacity = 0.18 + 0.55 * paso(0.15 + i * 0.18, 0.25 + i * 0.18, u) + 0.06 * Math.sin(c.t * 3 + i); });
      rp.vaelthor.raiz.visible = c.toma.id.startsWith('C14') && !c.toma.id.includes('titulo');
      if (rp.vaelthor.halo) rp.vaelthor.halo.material.opacity = 0.3 + 0.15 * Math.sin(c.t * 5);
      flotar(rp, c.t);
      actuarDialogo(rp, c, {}, { vaelthor: 'brazos_cruzados' });
    },
  });
}

export const C14: Guion = (() => {
  const L = LINEAS_CAMPANA.C14;
  const tomas: Toma[] = [
    { ...toma('C14_0abre', 'confluencia', 7, plano([0, 9, 18], [0, 1, -2], 44), plano([3, 3, 9], [0, 1.2, -1], 40), { musica: 'M23', entra: { color: '#000', dur: 2.4 }, bloom: 0.8 }) },
    ...tomasDialogo(L.slice(0, -1), { escena: 'confluencia', puestos: puestosDe(CAST_C14), centro: [-0.4, 0], semilla: 171, prefijo: 'C14', bloom: 0.7, obstaculos: [[-4.5, -4.5, 1.2], [4.5, -4.5, 1.2], [4.5, 3.5, 1.2], [-4.5, 3.5, 1.2], [0, -6.5, 1.6]], audiencia: [0.1, 1] }),
    { ...toma('C14_cierre', 'confluencia', 8, plano([2, 2, 6], [0, 1.4, -2.2], 38), plano([0, 10, 20], [0, 0, -2], 46)), linea: L[L.length - 1], bloom: 0.9 },
    toma('C14_titulo', 'confluencia', 5, plano([0, 10, 20], [0, 0, -2], 46), undefined, { titulo: { grande: 'La cuenta que ya no se cierra sola', chico: 'Confluencia' }, sale: { color: '#000', dur: 2 }, bloom: 0.9 }),
  ];
  return { id: 'C14', nombre: 'La cuenta que ya no se cierra sola', fov: 38, tomas, escenarios: { confluencia } };
})();

// ------------------------------------------------------------------ C07 · El tratado (el Pueblo del Sol)

const CAST_C07: Cast = [
  ['maestra', 'maestra', -1.6, -2.6], ['veterano', 'veterano', 1.6, -2.6], ['ambar_zora', 'ambar_zora', 2.9, -0.6], ['iris_calista', 'iris_calista', 2.6, 1.6],
  ['orbita_helena', 'orbita_helena', -2.9, -0.6], ['canalizadora_aura', 'canalizadora_aura', -2.8, 1.6], ['canalizadora_lara', 'canalizadora_lara', -1.2, 2.8],
  ['el', 'el', 0.4, 3.0], ['ella', 'ella', 1.4, 2.6], ['celia', 'celia', 0, -4.6],
];
let CELIA_C07 = '';
function tratado(): Escenario {
  return escenario({
    hora: 'tarde', sol: new THREE.Vector3(-0.7, 0.45, -0.5), colores: ['#b8ab8c', '#c4b799', '#a99c80', '#7fa25a'], niebla: ['#f3dcc0', 40, 200], radio: 22,
    async montar(g) {
      const [pueblo, edif, muebles, rp] = await Promise.all([cargar('granja_pueblo.glb'), cargar('granja_edificios.glb'), cargar('granja_muebles.glb'), reparto(CAST_C07)]);
      g.add(poner(edif, 'edificio_archivo_9x7', 0, -13, 0, 1), poner(pueblo, 'fuente', 9, 6, 0, 0.8), poner(pueblo, 'arbol_a', -10, -5), poner(pueblo, 'arbol_b', 11, -6));
      g.add(poner(muebles, 'mesa_mapas', 0, -0.2, 0, 1.6));
      for (const [x, z] of [[-6, 4], [6, -3], [-6, -6]] as const) g.add(poner(pueblo, 'farol', x, z));
      g.add(poner(pueblo, 'puesto_mercado_verde', -9, 5, 0.6), poner(pueblo, 'banco', 6, 6, -0.3));
      // Los representantes de los otros mundos hablan por comunicación: los rodea un halo azul
      for (const id of ['ambar_zora', 'iris_calista', 'orbita_helena']) { const h = halo('#9fd6ff', 2.6); h.position.set(0, 1.2, -0.4); h.material.opacity = 0.25; rp[id].raiz.add(h); }
      ubicar(rp, CAST_C07, 0, -0.2);
      return rp;
    },
    animar(c, rp) {
      // Celia aparece en la mesa cuando le toca hablar y se queda hasta el final
      const k = paso(0, 2, c.desde(CELIA_C07));
      rp.celia.raiz.visible = k > 0.01;
      rp.celia.raiz.scale.setScalar(0.5 + k * 0.5);
      flotar(rp, c.t);
      actuarDialogo(rp, c);
    },
  });
}

export const C07: Guion = (() => {
  const L = LINEAS_CAMPANA.C07;
  CELIA_C07 = `C07_${L.slice(0, -1).findIndex((l) => l.quien === 'celia')}`;
  const tomas: Toma[] = [
    { ...toma('C07_abre', 'tratado', 7, plano([-8, 7, 14], [0, 1, -1], 42), plano([-3, 3.4, 8], [0, 1, 0], 40), { musica: 'M21', entra: { color: '#000', dur: 2.2 }, bloom: 0.55 }) },
    ...tomasDialogo(L.slice(0, -1), { escena: 'tratado', puestos: puestosDe(CAST_C07), centro: [0, 0], semilla: 181, prefijo: 'C07', bloom: 0.55, obstaculos: [[0, -13, 5.5], [9, 6, 2.4], [-9, 5, 1.6], [6, 6, 1.1]], bajos: [[0, -0.2, 1.8]], audiencia: [0, 1] }),
    { ...toma('C07_cierre', 'tratado', 8, plano([0, 2.4, 4], [0, 0.9, -0.2], 40), plano([0, 9, 16], [0, 0, -2], 44)), linea: L[L.length - 1], bloom: 0.6 },
    toma('C07_titulo', 'tratado', 5, plano([0, 9, 16], [0, 0, -2], 44), undefined, { titulo: { grande: 'El tratado', chico: 'Capítulo XXI' }, sale: { color: '#000', dur: 2 } }),
  ];
  return { id: 'C07', nombre: 'El tratado', fov: 38, tomas, escenarios: { tratado } };
})();

// ------------------------------------------------------------------ C08 · El ceramista (el Refugio de los Hilos)

const CAST_C08: Cast = [['vaelthor', 'vaelthor', 0, -3], ['brasa_sol', 'brasa_sol', 2.4, -0.4], ['hilos_tecla', 'hilos_tecla', -2.4, -0.6], ['el', 'el', -1.2, 1.8], ['ella', 'ella', 0.6, 2.2], ['canalizadora_aura', 'canalizadora_aura', 2.4, 1.8]];
function ceramista(): Escenario {
  const recuerdos: THREE.Mesh[] = [];
  return escenario({
    hora: 'atardecer', sol: new THREE.Vector3(0.6, 0.25, -0.7), colores: ['#7d7a96', '#8a86a2', '#6f6c88'], niebla: ['#c9b8e0', 25, 150],
    async montar(g) {
      const [paisaje, astra, muebles, rp] = await Promise.all([cargar('granja_astra_paisaje.glb'), cargar('granja_astra.glb'), cargar('granja_muebles.glb'), reparto(CAST_C08)]);
      g.add(poner(astra, 'casa_senda', -6, -8, 0.4), poner(astra, 'casa_senda', 6, -8, -0.4));
      const r = azar(4);
      const pilar = piezaKit(paisaje, 'pilar_hilos');
      if (pilar) g.add(instanciar(pilar, anillo(r, 12, 8, 22, 0, -2, [1, 1.3], () => true)));
      // La vasija de Vael en el centro, abierta
      g.add(poner(muebles, 'pieza_vasija_riego', 0, -0.6, 0, 2.4));
      const brillo = halo('#b07cff', 2.4); brillo.position.set(0, 0.8, -0.6); brillo.material.opacity = 0.4; g.add(brillo);
      // Dos recuerdos proyectados como papeles
      for (const [x, txt] of [[-1.6, 'La casa de Elián'], [1.6, 'El molde de Tecla']] as const) {
        const cv = document.createElement('canvas'); cv.width = 512; cv.height = 320;
        const x2 = cv.getContext('2d')!; x2.fillStyle = '#f3e6c8'; x2.fillRect(0, 0, 512, 320); x2.strokeStyle = '#8a6a3a'; x2.lineWidth = 8; x2.strokeRect(10, 10, 492, 300);
        x2.fillStyle = '#5a3a2a'; x2.font = '600 34px Georgia'; x2.textAlign = 'center'; x2.fillText(txt, 256, 290);
        x2.fillStyle = '#c9a070'; x2.fillRect(150, 70, 212, 150); x2.fillStyle = '#7a4a3a'; x2.beginPath(); x2.moveTo(130, 80); x2.lineTo(256, 20); x2.lineTo(382, 80); x2.fill();
        const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, side: THREE.DoubleSide, fog: false }));
        m.position.set(x, 2.4, -1.4);
        recuerdos.push(m); g.add(m);
      }
      g.add(motasFlotantes(180, [0, 0.4, -1], 8, 4, [0.85, 0.78, 1], 1.8, 9));
      ubicar(rp, CAST_C08, 0, -0.6);
      return rp;
    },
    animar(c, rp) {
      const u = paso(0, 2, c.desde('C08_3')) * (1 - paso(0, 2, c.desde('C08_9')));
      recuerdos.forEach((m, i) => { (m.material as THREE.MeshBasicMaterial).opacity = u; m.position.y = 2.4 + Math.sin(c.t + i) * 0.06; m.rotation.y = Math.sin(c.t * 0.4 + i) * 0.15; });
      if (rp.vaelthor.halo) rp.vaelthor.halo.material.opacity = 0.35 + 0.15 * Math.sin(c.t * 4);
      actuarDialogo(rp, c, {}, { vaelthor: 'presumir_a' });
    },
  });
}

export const C08: Guion = (() => {
  const L = LINEAS_CAMPANA.C08;
  const tomas: Toma[] = [
    { ...toma('C08_abre', 'ceramista', 7, plano([7, 4, 10], [0, 1, -1], 42), plano([3, 2.2, 5.5], [0, 0.9, -0.6], 38), { musica: 'M22', entra: { color: '#000', dur: 2.2 }, bloom: 0.8 }) },
    ...tomasDialogo(L.slice(0, -1), { escena: 'ceramista', puestos: puestosDe(CAST_C08), centro: [0, 0], semilla: 191, prefijo: 'C08', bloom: 0.75, obstaculos: [[-6, -8, 3.6], [6, -8, 3.6]], bajos: [[0, -0.6, 1.2]], audiencia: [0, 1] }),
    { ...toma('C08_cierre', 'ceramista', 7, plano([0.8, 1.4, 1.4], [0, 0.6, -0.6], 34), plano([4, 4, 9], [0, 1, -2], 42)), linea: L[L.length - 1], bloom: 0.8 },
    toma('C08_titulo', 'ceramista', 5, plano([4, 4, 9], [0, 1, -2], 42), undefined, { titulo: { grande: 'El ceramista', chico: 'Capítulo XXII' }, sale: { color: '#000', dur: 2 }, bloom: 0.8 }),
  ];
  return { id: 'C08', nombre: 'El ceramista', fov: 38, tomas, escenarios: { ceramista } };
})();

// ------------------------------------------------------------------ C09 · Una estrella sin dueño (el Borde de Astra)

const CAST_C09: Cast = [['aura', 'aura', -2.4, -0.8], ['lara', 'lara', 2.4, -0.8], ['celia', 'celia', 0, -1.6], ['el', 'el', -0.9, 1.6], ['ella', 'ella', 0.7, 1.8], ['nathgora', 'nathgora', 0, -16]];
function borde(): Escenario {
  let constelacion: THREE.Group, escudo: THREE.Mesh;
  return escenario({
    hora: 'noche', sol: new THREE.Vector3(0.3, 0.6, 0.7), colores: null, fondo: '#03030a', exposicion: 1.4, radio: 14,
    async montar(g) {
      const { cielo } = await import('./cine-kit');
      g.add(cielo('noche', new THREE.Vector3(0.2, 0.3, -0.9)));
      const [paisaje, kit, rp] = await Promise.all([cargar('granja_astra_paisaje.glb'), cargar('sangre/bioma_minas.glb'), reparto(CAST_C09)]);
      // Una plataforma de roca en el borde, y el mar de estrellas debajo
      for (let x = -3; x <= 3; x++) for (let z = -2; z <= 2; z++) g.add(poner(kit, 'piso_d', x * 2, z * 2, 0, 1, 0, false));
      const r = azar(5);
      const roca = piezaKit(paisaje, 'roca_lunar');
      if (roca) g.add(instanciar(roca, anillo(r, 16, 6, 9, 0, 0, [1, 1.6], () => true)));
      g.add(poner(paisaje, 'atalaya', -5, -4, 0.3, 0.9));
      // El escudo del mundo, como un velo de luz frente al abismo
      escudo = new THREE.Mesh(new THREE.PlaneGeometry(40, 16), new THREE.MeshBasicMaterial({ color: '#9fd6ff', transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      escudo.position.set(0, 4, -7);
      constelacion = constelacionAmantes();
      constelacion.userData.manual = true;
      g.add(escudo, constelacion, motasFlotantes(200, [0, 0, -8], 14, 8, [0.6, 0.7, 1], 2, 9));
      ubicar(rp, CAST_C09, 0, -1);
      const n = rp.nathgora; n.raiz.scale.setScalar(2.6); n.raiz.position.y = 1;
      const l = luzCalida('#ffd9a0', 1.6, 10); l.position.set(0, 2.4, 1); g.add(l);
      return rp;
    },
    animar(c, rp) {
      const fin = c.desde('C09_retiro');
      constelacion.userData.actualizar(c.t, c.alto, 0.6 + 0.4 * paso(0, 3, fin));
      (escudo.material as THREE.MeshBasicMaterial).opacity = 0.06 + 0.1 * paso(0, 3, fin) + 0.03 * Math.sin(c.t * 2);
      // Nath'Gora se va haciendo sombra lejana cuando le retiran la última autorización
      const n = rp.nathgora;
      n.raiz.position.z = -16 - paso(0, 8, fin) * 20;
      n.raiz.visible = fin < 8;
      for (const a of Object.values(rp)) if (a.halo && a !== n) a.raiz.position.y = 0.4 + Math.sin(c.t * 1.2 + a.raiz.position.x) * 0.06;
      actuarDialogo(rp, c, {}, { nathgora: 'brazos_cruzados' });
    },
  });
}

export const C09: Guion = (() => {
  const L = LINEAS_CAMPANA.C09;
  const i = L.findIndex((l) => l.id.endsWith('L010'));
  const tomas: Toma[] = [
    { ...toma('C09_abre', 'borde', 8, plano([0, 6, 14], [0, 3, -20], 46), plano([0, 2.2, 6.5], [0, 2, -16], 44), { musica: 'M19', entra: { color: '#000', dur: 3 }, bloom: 1 }) },
    ...tomasDialogo(L.slice(0, i), { escena: 'borde', puestos: puestosDe(CAST_C09), centro: [0, 0], semilla: 201, prefijo: 'C09a', bloom: 1, audiencia: [0, 1], obstaculos: [[-5, -4, 1.4]] }),
    { ...toma('C09_retiro', 'borde', 8, plano([0, 1.4, 5], [0, 2.6, -16], 44), plano([0, 2.4, 8], [0, 4, -30], 48)), linea: L[i], bloom: 1.2 },
    ...tomasDialogo(L.slice(i + 1, -1), { escena: 'borde', puestos: puestosDe(CAST_C09), centro: [0, 0], semilla: 203, prefijo: 'C09b', bloom: 1, audiencia: [0, 1], obstaculos: [[-5, -4, 1.4]] }),
    { ...toma('C09_cierre', 'borde', 9, plano([0, 1.6, 4.6], [0, 1, 1.6], 36), plano([0, 1.2, 6], [0, 8, -30], 50)), linea: L[L.length - 1], bloom: 1.2 },
    toma('C09_titulo', 'borde', 5, plano([0, 1.2, 6], [0, 8, -30], 50), undefined, { titulo: { grande: 'Una estrella sin dueño', chico: 'Capítulo XXIII' }, sale: { color: '#000', dur: 2.4 }, bloom: 1.2 }),
  ];
  return { id: 'C09', nombre: 'Una estrella sin dueño', fov: 40, tomas, escenarios: { borde } };
})();

// ------------------------------------------------------------------ C10 · La parcela de mañana (los dos surcos, sanos)

const FINAL_C10: [string, string, number, number, number, number][] = [
  ['mercader', 'mercader', 2.2, 1.0, 0, 0], ['cuidadora', 'cuidadora', 1.8, -1.6, 0, 0], ['archivero', 'archivero', -2.4, -1.4, 0, 0],
  ['canalizadora_lara', 'canalizadora_lara', 3.0, 2.6, 0, 0], ['el', 'el', -2.1, 0.8, 0, 0], ['ella', 'ella', -1.4, 2.3, 0, 0],
];
export const C10: Guion = (() => {
  const L = LINEAS_CAMPANA.C10;
  const puestos: Record<string, Puesto> = Object.fromEntries(FINAL_C10.map(([id, , x, z]) => [id, { x, z }]));
  const obst: [number, number, number][] = [[0, -9.5, 4.6], [4.6, -4.2, 1.3], [-1.95, -1.5, 0.45], ...Array.from({ length: 13 }, (_, k) => [-6.6 + k * 1.1, -4.2, 0.45] as [number, number, number])];
  const tomas: Toma[] = [
    toma('c10_abre', 'granja', 7, plano([14, 9, 22], [0, 0.5, 0], 38), plano([6, 3.2, 9], [0, 0.4, 0], 36), { musica: 'M20', entra: { color: '#fff4e2', dur: 2.6 }, bloom: 0.6 }),
    ...tomasDialogo(L.slice(0, -1), { escena: 'granja', puestos, centro: [0, 0.6], semilla: 211, prefijo: 'C10', bloom: 0.55, obstaculos: obst, audiencia: [0, 1] }),
    { ...toma('c10_cierre', 'granja', 9, plano([1.25, 0.42, 2.6], [0.85, 0.05, 0.1], 34), plano([9, 6, 16], [0, 0.8, -2], 40)), linea: L[L.length - 1], bloom: 0.6 },
    toma('c10_titulo', 'granja', 6, plano([9, 6, 16], [0, 0.8, -2], 40), plano([12, 8, 20], [0, 1, -3], 40), { titulo: { grande: 'La parcela de mañana', chico: 'Capítulo XXIV' }, sale: { color: '#000', dur: 2.4 } }),
  ];
  return { id: 'C10', nombre: 'La parcela de mañana', fov: 38, tomas, escenarios: { granja: () => granja(false, { reparto: FINAL_C10 }) } };
})();

export type { Actor, Reparto };
export { copia };
