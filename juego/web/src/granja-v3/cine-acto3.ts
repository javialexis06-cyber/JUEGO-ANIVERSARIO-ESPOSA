// Las películas del Acto III de la película de Astra (docs/en-obra/pelicula-de-astra.md, capítulo 3):
// S08 «La ayuda que no llegó» (en papel animado), C12 «El día posterior al nacimiento», Eneas «Lo que no vuelve
// idéntico» (los ciclos), Ofelia «La casa que dejé esperando», C06 «La casa de Elián» y Serena «El nombre que no se
// pronuncia por otro».
import * as THREE from 'three';
import { cargar } from '../recursos';
import { actorDiosa, actorPareja, actorVaelThor, actorVecino, actorVestido, actuar, halo, piezaRopa, type Actor } from './cine-actores';
import type { Escenario, Guion, Toma } from './cine-granja';
import { anillo, archivo, colocar, copia, cuarto, escenario, toma, type Reparto } from './cine-acto1';
import { actuarDialogo, azar, hablar, instanciar, luzCalida, motasFlotantes, paso, piezaKit, plano, poner, puntosSuaves, tomasDialogo, type Puesto } from './cine-kit';
import { LINEAS_CAMPANA } from './cine-lineas-campana';
import { LINEAS_ENEAS, LINEAS_OFELIA, LINEAS_S08, LINEAS_SERENA } from './cine-lineas-historia';

/** Una diosa que llega flotando y brillando (0 = no está, 1 = del todo). */
function aparecer(a: Actor, k: number, t: number, y = 0.5) {
  a.raiz.visible = k > 0.01;
  a.raiz.scale.setScalar(0.5 + k * 0.5);
  a.raiz.position.y = y + Math.sin(t * 1.2) * 0.07;
  if (a.halo) a.halo.material.opacity = 0.4 * k;
}

// ------------------------------------------------------------------ S08 · La ayuda que no llegó (papel animado)

/** Una lámina de papel recortado: se dibuja en un lienzo y se pone en un plano (como un teatro de sombras). */
function lamina(dibujar: (g: CanvasRenderingContext2D) => void, ancho: number, alto: number, w = 1024, h = 512) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  dibujar(c.getContext('2d')!);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
}

function papel(): Escenario {
  const capas: Record<string, THREE.Mesh> = {};
  let estrella: THREE.Sprite, nucleo: THREE.Sprite;
  return escenario({
    hora: 'noche', colores: null, fondo: '#0a0812', exposicion: 1, radio: 6,
    async montar(g) {
      // Fondo de papel con estrellas pintadas
      capas.fondo = lamina((x) => {
        const gr = x.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#1a1638'); gr.addColorStop(1, '#3a2a4a'); x.fillStyle = gr; x.fillRect(0, 0, 1024, 512);
        for (let i = 0; i < 4000; i++) { x.fillStyle = `rgba(255,240,220,${Math.random() * 0.05})`; x.fillRect(Math.random() * 1024, Math.random() * 512, 2, 2); }
        x.fillStyle = '#fff4d8'; for (let i = 0; i < 90; i++) { x.beginPath(); x.arc(Math.random() * 1024, Math.random() * 380, Math.random() * 2.4 + 0.6, 0, 7); x.fill(); }
      }, 24, 12);
      capas.fondo.position.set(0, 2.5, -6);
      // El guardián: una silueta recortada de papel, con capa, que sostiene la estrella
      capas.guardian = lamina((x) => {
        x.fillStyle = '#16121e'; x.strokeStyle = '#c9b6ea'; x.lineWidth = 6;
        x.beginPath(); x.arc(512, 120, 64, 0, 7); x.fill(); x.stroke();
        x.beginPath(); x.moveTo(440, 180); x.quadraticCurveTo(300, 420, 330, 500); x.lineTo(700, 500); x.quadraticCurveTo(720, 420, 584, 180); x.closePath(); x.fill(); x.stroke();
        x.beginPath(); x.moveTo(450, 260); x.quadraticCurveTo(470, 330, 512, 340); x.quadraticCurveTo(554, 330, 574, 260); x.stroke();
      }, 4, 2, 1024, 512);
      capas.guardian.position.set(-1.2, 1.4, -1);
      // El panteón: un templo de papel dorado, arriba y lejos, con sus coronas
      capas.templo = lamina((x) => {
        x.fillStyle = '#d9b45a'; x.strokeStyle = '#7a5a20'; x.lineWidth = 6;
        x.beginPath(); x.moveTo(212, 220); x.lineTo(512, 60); x.lineTo(812, 220); x.closePath(); x.fill(); x.stroke();
        for (let i = 0; i < 6; i++) { x.fillRect(250 + i * 104, 230, 34, 230); x.strokeRect(250 + i * 104, 230, 34, 230); }
        x.fillRect(200, 460, 624, 34); x.strokeRect(200, 460, 624, 34);
      }, 5, 2.5);
      capas.templo.position.set(3.4, 3.6, -3);
      g.add(...Object.values(capas));
      // Coronas y homenajes que caen (puntos dorados) en vez de ayuda
      const r = azar(8);
      const coronas = puntosSuaves(80, (i, pos, col, tam, fase) => { pos.set([1 + r() * 4, 0, -2 + r()], i * 3); col.set([1, 0.82, 0.4], i * 3); tam[i] = 7 + r() * 6; fase[i] = r(); },
        'float h=mod(4.2-uT*.7-aFase*4.,4.2);p=vec3(position.x+sin(uT+aFase*9.)*.2,h,position.z);brillo=uCaen*smoothstep(0.,.5,h);', { uCaen: { value: 0 } });
      coronas.userData.actualizar = (t: number, alto: number) => { const u = (coronas.material as THREE.ShaderMaterial).uniforms; u.uT.value = t; u.uEscala.value = alto / 720; };
      coronas.userData.uniforms = (coronas.material as THREE.ShaderMaterial).uniforms;
      g.add(coronas);
      capas.coronas = coronas as unknown as THREE.Mesh;
      estrella = halo('#ffe2a0', 2.2);
      estrella.position.set(-1.2, 1.25, -0.8);
      nucleo = halo('#ffffff', 0.5);
      nucleo.position.copy(estrella.position);
      g.add(estrella, nucleo, new THREE.AmbientLight('#ffffff', 1));
      return {};
    },
    animar(c) {
      const ayuda = c.desde('S08_ayuda'), apaga = c.desde('S08_apaga'), nace = c.desde('S08_nace');
      const luz = 1 - paso(0, 4, apaga);
      estrella.material.opacity = 0.9 * luz * (0.85 + 0.15 * Math.sin(c.t * 3));
      nucleo.material.opacity = luz;
      estrella.material.color.setRGB(1, 0.88 * luz + 0.3, 0.6 * luz + 0.3);
      ((capas.coronas as unknown as THREE.Points).userData.uniforms as Record<string, THREE.IUniform>).uCaen.value = ayuda > 0 && apaga < 2 ? paso(0, 1.5, ayuda) : 0;
      // Las láminas respiran un poco (papel sobre papel)
      capas.guardian.position.y = 1.4 + Math.sin(c.t * 0.8) * 0.03;
      capas.templo.position.y = 3.6 + Math.sin(c.t * 0.6 + 1) * 0.05;
      (capas.guardian.material as THREE.MeshBasicMaterial).color.setScalar(nace > 0 ? 1 - paso(0, 3, nace) * 0.5 : 1);
      (capas.fondo.material as THREE.MeshBasicMaterial).color.setRGB(1 - paso(0, 3, apaga) * 0.4, 1 - paso(0, 3, apaga) * 0.4, 1 - paso(0, 3, apaga) * 0.2);
    },
  });
}

export const S08: Guion = (() => {
  const [n1, ng1, n2, ng2, n3, n4] = LINEAS_S08;
  const tomas: Toma[] = [
    { ...toma('S08_abre', 'papel', 7, plano([0, 2.6, 9], [0, 2.2, -4], 40), plano([-0.6, 2.0, 6], [-1.2, 1.6, -1], 36), { musica: 'M15', entra: { color: '#000', dur: 2.5 }, bloom: 1 }), linea: n1 },
    { ...toma('S08_pide', 'papel', 5, plano([-1.0, 1.7, 3.6], [-1.2, 1.5, -1], 32)), linea: ng1, bloom: 1 },
    { ...toma('S08_ayuda', 'papel', 6, plano([1.6, 2.6, 6], [3.2, 2.6, -3], 38), plano([1.0, 2.2, 6.6], [1.4, 1.6, -2], 40)), linea: n2, bloom: 1 },
    { ...toma('S08_ng2', 'papel', 4, plano([-1.2, 1.5, 2.6], [-1.2, 1.4, -1], 30)), linea: ng2, bloom: 1 },
    { ...toma('S08_apaga', 'papel', 7, plano([-1.0, 1.6, 3.4], [-1.2, 1.3, -1], 32), plano([0, 2.4, 8], [0, 2, -4], 40)), linea: n3, bloom: 0.9 },
    { ...toma('S08_nace', 'papel', 7, plano([0, 2.4, 8], [0, 2, -4], 40), plano([0, 2.6, 10], [0, 2.4, -4], 42)), linea: n4, bloom: 0.7 },
    toma('S08_titulo', 'papel', 5, plano([0, 2.6, 10], [0, 2.4, -4], 42), undefined, { titulo: { grande: 'La ayuda que no llegó', chico: 'Un secreto de Astra' }, sale: { color: '#000', dur: 2.2 }, bloom: 0.7 }),
  ];
  return { id: 'S08', nombre: 'La ayuda que no llegó', fov: 38, tomas, escenarios: { papel } };
})();

// ------------------------------------------------------------------ C12 · El día posterior al nacimiento

export const C12: Guion = (() => {
  const L = LINEAS_CAMPANA.C12;
  const cast: [string, string, number, number, number, number][] = [['archivero', 'archivero', 0, -1.6, 0, 2], ['maestra', 'maestra', 2.4, 0.9, 0, 0], ['fuatia', 'fuatia', 3.0, -1.8, 0, 0], ['el', 'el', -1.0, 2.2, 0, -0.6], ['ella', 'ella', -2.8, 0.6, 0, -0.6]];
  const puestos: Record<string, Puesto> = { archivero: { x: 0, z: -1.6 }, maestra: { x: 2.4, z: 0.9 }, fuatia: { x: 3.0, z: -1.8, cabeza: 1.3 }, el: { x: -1.0, z: 2.2 }, ella: { x: -2.8, z: 0.6 } };
  // Las cuatro marcas del acta: fuego, agua, tierra y aire, que se encienden cuando Fuatia cuenta lo que pasó
  const marcas: THREE.Sprite[] = [];
  const montar = (g: THREE.Group) => {
    ['#ff8a3a', '#5ab8e8', '#c9a050', '#e8f4ff'].forEach((col, i) => { const h = halo(col, 0.9); h.position.set(2.4 + (i - 1.5) * 0.45, 0.95, 1.0); h.material.opacity = 0.3; marcas.push(h); g.add(h); });
  };
  const animar = (c: Parameters<NonNullable<Parameters<typeof archivo>[2]>>[0]) => {
    const f = Math.max(c.desde('C12_2') > 0 && c.desde('C12_4') < 0 ? 1 : 0, 0);
    marcas.forEach((m, i) => { m.material.opacity = 0.25 + f * (0.5 + 0.2 * Math.sin(c.t * 4 + i)); m.scale.setScalar(0.9 + f * 0.6); });
  };
  const op = { escena: 'archivo', puestos, centro: [0, 0] as [number, number], semilla: 121, prefijo: 'C12', bloom: 0.55, dentro: [-4.6, 4.6, -3.0, 3.75] as [number, number, number, number], bajos: [[0, -0.6, 0.9], [2.4, 1.0, 1.0], [-3.2, 0.8, 0.5]] as [number, number, number][] };
  const tomas: Toma[] = [
    { ...toma('C12_abre', 'archivo', 6, plano([3.0, 2.4, 2.6], [2.4, 0.8, 1.0], 36), plano([2.6, 1.8, 2.2], [2.2, 0.8, 1.0], 32), { musica: 'M23', entra: { color: '#000', dur: 2 }, bloom: 0.6 }), linea: L[0] },
    ...tomasDialogo(L.slice(1, -1), op),
    { ...toma('C12_cierre', 'archivo', 7, plano([2.8, 1.4, 2.4], [2.0, 0.9, 1.0], 30), plano([3.2, 2.6, 2.7], [0, 0.9, -1], 40)), linea: L[L.length - 1], bloom: 0.55 },
    toma('C12_titulo', 'archivo', 5, plano([3.2, 2.6, 2.7], [0, 0.9, -1], 40), undefined, { titulo: { grande: 'El día posterior al nacimiento', chico: 'Fuatia' }, sale: { color: '#000', dur: 2 } }),
  ];
  return { id: 'C12', nombre: 'El día posterior al nacimiento', fov: 38, tomas, escenarios: { archivo: () => archivo(cast, montar, animar) } };
})();

// ------------------------------------------------------------------ Eneas · Lo que no vuelve idéntico (Verdia)

function rosal(): Escenario {
  return escenario({
    hora: 'tarde', sol: new THREE.Vector3(-0.6, 0.3, -0.6), colores: ['#8fbf6a', '#a6cf7a', '#7fb05e', '#c9d98a'], niebla: ['#ffe9c4', 30, 180], exposicion: 1.1,
    async montar(g) {
      const [paisaje, astra, pueblo, monte, eneas, el, ella, lara] = await Promise.all([
        cargar('granja_astra_paisaje.glb'), cargar('granja_astra.glb'), cargar('granja_pueblo.glb'), cargar('granja_monte.glb'),
        actorVecino('verdia_eneas'), actorPareja('el'), actorPareja('ella'), actorDiosa('lara'),
      ]);
      g.add(poner(astra, 'casa_verdia', 0, -10, 0, 1), poner(pueblo, 'fuente', -5, -3, 0, 0.8), poner(pueblo, 'banco', 4, -2, -0.6));
      g.add(poner(paisaje, 'arco_rosas', 0, -4.6, 0, 1.2));
      const r = azar(4);
      const rosales = piezaKit(paisaje, 'rosal'), cerezo = piezaKit(paisaje, 'cerezo');
      if (rosales) g.add(instanciar(rosales, anillo(r, 40, 2.6, 12, 0, 0, [0.9, 1.4], (x, z) => !(Math.abs(x) < 2.4 && z > -6) && Math.hypot(x + 5, z + 3) > 2.6)));
      if (cerezo) g.add(instanciar(cerezo, anillo(r, 18, 12, 30, 0, -4, [1, 1.4], () => true)));
      const roble = piezaKit(monte, 'roble');
      if (roble) g.add(instanciar(roble, anillo(r, 30, 26, 70, 0, -4, [1, 1.5], () => true)));
      g.add(poner(paisaje, 'rosal', 1.4, -0.6, 0, 1.2));
      g.add(motasFlotantes(260, [0, 0.4, -2], 10, 4, [1, 0.88, 0.55], 2, 3));
      colocar(eneas, 1.0, 0.2, 1.4, -0.6);
      colocar(el, -1.6, 2.0, 1, 0);
      colocar(ella, -0.4, 2.8, 1, 0);
      colocar(lara, -1.4, -1.6, 0, 1, 0.5);
      return { verdia_eneas: eneas, el, ella, lara };
    },
    animar(c, rp) {
      aparecer(rp.lara, paso(0, 2.5, c.desde('ENE_3')), c.t);
      actuarDialogo(rp, c, { verdia_eneas: c.toma.id === 'ENE_abre' ? 'frotar_a' : 'reposo' }, { verdia_eneas: 'pensando' });
    },
  });
}

export const ENEAS: Guion = (() => {
  const L = LINEAS_ENEAS;
  const puestos: Record<string, Puesto> = { verdia_eneas: { x: 1.0, z: 0.2 }, el: { x: -1.6, z: 2.0 }, ella: { x: -0.4, z: 2.8 }, lara: { x: -1.4, z: -1.6, cabeza: 1.5 } };
  const op = (a: number, b: number, pref: string, sem: number) => tomasDialogo(L.slice(a, b), { escena: 'rosal', puestos, centro: [0, 0.6], semilla: sem, prefijo: pref, bloom: 0.8, obstaculos: [[0, -10, 4], [-5, -3, 2.4], [4, -2, 1.2], [0, -4.6, 1.6], [1.4, -0.6, 0.6]], audiencia: [0.2, 1] });
  const tomas: Toma[] = [
    { ...toma('ENE_abre', 'rosal', 7, plano([6, 4, 12], [0, 1.4, -4], 40), plano([3.2, 1.6, 4.4], [1.2, 0.8, -0.3], 34), { musica: 'M12', entra: { color: '#fff4e2', dur: 2.4 }, bloom: 0.9 }), linea: L[0] },
    ...op(1, 4, 'ENE_1', 131),
    { ...toma('ENE_3', 'rosal', 9, plano([1.6, 2.2, 3.4], [-1.4, 1.8, -1.6], 36), plano([0.8, 2.0, 2.6], [-1.4, 1.9, -1.6], 32)), linea: L[4], bloom: 1.1 },
    ...op(5, 9, 'ENE_4', 133),
    toma('ENE_titulo', 'rosal', 5, plano([3, 3, 9], [0, 1.6, -4], 40), plano([4, 5, 13], [0, 2, -6], 40), { titulo: { grande: 'Lo que no vuelve idéntico', chico: 'Eneas · Verdia' }, sale: { color: '#000', dur: 2 }, bloom: 0.9 }),
  ];
  return { id: 'ENE', nombre: 'Lo que no vuelve idéntico', fov: 38, tomas, escenarios: { rosal } };
})();

// ------------------------------------------------------------------ Ofelia · La casa que dejé esperando (Senda)

function senda(): Escenario {
  let obra: THREE.Group, escalones: THREE.Group;
  return escenario({
    hora: 'atardecer', sol: new THREE.Vector3(0.6, 0.2, -0.7), colores: ['#7d7a96', '#8a86a2', '#6f6c88', '#9a96ae'], niebla: ['#c9b8e0', 25, 150], exposicion: 1.1,
    async montar(g) {
      const [astra, paisaje, obras, ofelia, el, ella, lara] = await Promise.all([
        cargar('granja_astra.glb'), cargar('granja_astra_paisaje.glb'), cargar('granja_obras.glb'), actorVecino('senda_ofelia'), actorPareja('el'), actorPareja('ella'), actorDiosa('lara'),
      ]);
      g.add(poner(astra, 'casa_senda', 0, -6, 0, 1));
      // El andamio y las tablas de la casa a medio terminar (se van cuando pone la última teja)
      obra = new THREE.Group();
      for (const [x, z] of [[-3, -3.2], [3, -3.2], [-3, -8.6], [3, -8.6]] as const) obra.add(poner(obras, 'obra_poste', x, z, 0, 1.4));
      obra.add(poner(obras, 'obra_viga', 0, -3.2, 0, 1.4, 2.6, false), poner(obras, 'obra_escalera', 3.6, -4, -0.4, 1.3), poner(obras, 'obra_tablas', -3.8, -1.6, 0.4), poner(obras, 'obra_cajon', 2.4, -1.6));
      g.add(obra);
      const r = azar(6);
      const pilar = piezaKit(paisaje, 'pilar_hilos');
      if (pilar) g.add(instanciar(pilar, anillo(r, 10, 10, 24, 0, -4, [1, 1.3], () => true)));
      // Los escalones de luz hacia Verdia
      escalones = new THREE.Group();
      for (let i = 0; i < 14; i++) { const h = halo('#ffe9b0', 1.6); h.position.set(-3 - i * 0.7, 0.3 + i * 0.55, -1 - i * 0.6); h.scale.set(1.8, 0.5, 1); h.material.opacity = 0; escalones.add(h); }
      g.add(escalones, motasFlotantes(160, [0, 0.4, -3], 9, 4, [0.85, 0.78, 1], 1.8, 9));
      colocar(ofelia, 0.6, -1.4, 0, -6);
      colocar(el, -1.4, 1.6, 0.6, -1.4);
      colocar(ella, 0.2, 2.2, 0.6, -1.4);
      colocar(lara, -3.4, -0.6, 0.6, -1.4, 0.5);
      return { senda_ofelia: ofelia, el, ella, lara };
    },
    animar(c, rp) {
      const teja = c.desde('OFE_teja');
      obra.visible = teja < 1.5;
      escalones.children.forEach((h, i) => { (h as THREE.Sprite).material.opacity = teja > 0 ? 0.75 * paso(i * 0.18, i * 0.18 + 0.6, teja) : 0; });
      aparecer(rp.lara, paso(0, 2.2, c.desde('OFE_lara')), c.t);
      const id = c.toma.id;
      actuarDialogo(rp, c, { senda_ofelia: id === 'OFE_abre' ? 'frotar_a' : id === 'OFE_teja' ? 'celebrar' : 'reposo' }, { senda_ofelia: teja > 0 ? 'boca_abierta' : 'triste' });
    },
  });
}

export const OFELIA: Guion = (() => {
  const L = LINEAS_OFELIA;
  const puestos: Record<string, Puesto> = { senda_ofelia: { x: 0.6, z: -1.4 }, el: { x: -1.4, z: 1.6 }, ella: { x: 0.2, z: 2.2 }, lara: { x: -3.4, z: -0.6, cabeza: 1.5 } };
  const op = (a: number, b: number, pref: string, sem: number) => tomasDialogo(L.slice(a, b), { escena: 'senda', puestos, centro: [0, 0.4], semilla: sem, prefijo: pref, bloom: 0.8, obstaculos: [[0, -6, 3.6], [3.6, -4, 1], [-3.8, -1.6, 1], [2.4, -1.6, 0.8]], audiencia: [0.2, 1] });
  const tomas: Toma[] = [
    { ...toma('OFE_abre', 'senda', 7, plano([7, 4, 10], [0, 1.6, -5], 40), plano([3.4, 1.8, 3.6], [0.6, 1.0, -1.6], 34), { musica: 'M13', entra: { color: '#000', dur: 2.2 }, bloom: 0.8 }), linea: L[0] },
    ...op(1, 5, 'OFE_1', 141),
    { ...toma('OFE_teja', 'senda', 9, plano([4, 3, 7], [0, 2, -5], 40), plano([-1, 2.2, 7], [-6, 4, -6], 44)), linea: L[5], bloom: 1.2 },
    { ...toma('OFE_lara', 'senda', 5, plano([-4.8, 1.9, 2.6], [-3.4, 1.6, -0.6], 34)), linea: L[6], bloom: 1.1 },
    ...op(7, 9, 'OFE_2', 143),
    toma('OFE_titulo', 'senda', 6, plano([-1, 2.2, 7], [-6, 4, -6], 44), plano([-2, 3, 9], [-9, 7, -9], 46), { titulo: { grande: 'La casa que dejé esperando', chico: 'Ofelia · Senda' }, sale: { color: '#fff4e2', dur: 2.4 }, bloom: 1.1 }),
  ];
  return { id: 'OFE', nombre: 'La casa que dejé esperando', fov: 38, tomas, escenarios: { senda } };
})();

// ------------------------------------------------------------------ C06 · La casa de Elián

/** El refugio de la Forma Fija: un cuarto perfecto que se repite; cambia un detalle tres veces (vaso, ventana, humo). */
function refugio(): Escenario {
  let vaso: THREE.Object3D, ventanaLuz: THREE.SpotLight, humo: THREE.Sprite, ancla: THREE.Group;
  return escenario({
    hora: 'tarde', sol: new THREE.Vector3(-0.9, 0.5, 0.2), colores: null, fondo: '#1a1410', exposicion: 1.1, radio: 8,
    async montar(g) {
      const [m, te, elian, tecla, asha, el, ella, vael] = await Promise.all([
        cargar('granja_muebles.glb'), cargar('comida_te.glb'), actorVecino('hilos_elian'), actorVecino('hilos_tecla'), actorVecino('hilos_asha'), actorPareja('el'), actorPareja('ella'), actorVaelThor(),
      ]);
      g.add(cuarto(m, 5, 4));
      g.add(poner(m, 'mesa_comedor', -0.6, -1.6), poner(m, 'silla', -1.4, -1.6, Math.PI / 2), poner(m, 'silla', 0.2, -1.6, -Math.PI / 2), poner(m, 'cama', 3.6, -2.8, 0), poner(m, 'armario', -4.3, -3.4), poner(m, 'chimenea', 0, -3.9, 0, 0.9));
      g.add(poner(m, 'ventana', -5.0, 0.4, Math.PI / 2, 1, 1.1, false), poner(m, 'cuadro', 5.0, 0.2, -Math.PI / 2, 1, 1.4, false), poner(m, 'tapete', 0, 0.8, 0, 1.6, 0.01, false), poner(m, 'puerta', 2.8, 4.0, Math.PI, 1));
      vaso = copia(te, -0.6, -1.6, 0, 0.9, 0.78);
      g.add(vaso);
      ventanaLuz = new THREE.SpotLight('#ffe6b8', 7, 14, 0.6, 0.5, 1.2);
      ventanaLuz.position.set(-7, 2.8, 0.4); ventanaLuz.target.position.set(0, 0, 0); ventanaLuz.castShadow = true;
      g.add(ventanaLuz, ventanaLuz.target);
      const fuego = luzCalida('#ffb070', 1.8, 7); fuego.position.set(0, 0.8, -3.3); g.add(fuego);
      // La marca de humo en la pared (lo que la casa perfecta no deja ver)
      humo = halo('#2a1e18', 1.6);
      humo.material.blending = THREE.NormalBlending;
      humo.position.set(-1.8, 1.8, -3.95);
      humo.material.opacity = 0;
      g.add(humo);
      // El ancla de Asha en la puerta
      ancla = new THREE.Group();
      const ha = halo('#bfe8ff', 1.2); ha.material.opacity = 0.8; ancla.add(ha, motasFlotantes(60, [0, 0, 0], 0.3, 1.6, [0.75, 0.9, 1], 2, 3));
      ancla.position.set(2.8, 1.2, 3.4);
      g.add(ancla);
      colocar(elian, -1.6, -0.2, 0, 2);
      colocar(tecla, 1.6, 0.0, -1.6, -0.2);
      colocar(ella, -2.6, 2.0, -1.6, -0.2);
      colocar(el, -0.4, 2.4, -1.6, -0.2);
      colocar(vael, 3.0, -1.4, -1.6, -0.2);
      colocar(asha, 2.8, 3.0, -1.6, -0.2);
      return { hilos_elian: elian, hilos_tecla: tecla, ella, el, vaelthor: vael, hilos_asha: asha };
    },
    animar(c, rp) {
      // Los tres cambios: el vaso, la luz de la ventana y la marca de humo
      const id = c.toma.id;
      const n = Number(/_(\d+)$/.exec(id)?.[1] ?? 0);
      vaso.visible = !(n >= 3 && n <= 6);
      ventanaLuz.color.set(n >= 7 && n <= 10 ? '#8fa8ff' : '#ffe6b8');
      humo.material.opacity = n >= 8 ? 0.7 : 0;
      rp.vaelthor.raiz.visible = n >= 4 && n <= 12;
      const anc = c.desde('C06_15');
      ancla.visible = anc > -1;
      rp.hilos_asha.raiz.visible = anc > -1;
      actuarDialogo(rp, c, {}, { hilos_elian: 'triste_b', vaelthor: 'presumir_a' });
    },
  });
}

export const C06: Guion = (() => {
  const L = LINEAS_CAMPANA.C06;
  const puestos: Record<string, Puesto> = { hilos_elian: { x: -1.6, z: -0.2 }, hilos_tecla: { x: 1.6, z: 0.0 }, ella: { x: -2.6, z: 2.0 }, el: { x: -0.4, z: 2.4 }, vaelthor: { x: 3.0, z: -1.4 }, hilos_asha: { x: 2.8, z: 3.0 } };
  const tomas: Toma[] = [
    toma('C06_abre', 'refugio', 6, plano([4.2, 2.8, 3.4], [-0.6, 0.9, -1.4], 40), plano([3.6, 2.4, 2.8], [-0.8, 0.9, -1.6], 36), { musica: 'M14', entra: { color: '#000', dur: 2 }, bloom: 0.5 }),
    ...tomasDialogo(L, { escena: 'refugio', puestos, centro: [0, 0.4], semilla: 151, prefijo: 'C06', bloom: 0.5, dentro: [-4.6, 4.6, -3.2, 3.7], bajos: [[-0.6, -1.6, 1.1], [3.6, -2.8, 1.2], [0, -3.9, 1]] }),
    toma('C06_titulo', 'refugio', 5, plano([4.0, 2.8, 3.4], [0, 1, -1], 40), undefined, { titulo: { grande: 'La casa de Elián', chico: 'Capítulo XV' }, sale: { color: '#000', dur: 2 } }),
  ];
  return { id: 'C06', nombre: 'La casa de Elián', fov: 38, tomas, escenarios: { refugio } };
})();

// ------------------------------------------------------------------ Serena · El nombre que no se pronuncia por otro

function despedida(): Escenario {
  let vela: THREE.PointLight, llama: THREE.Sprite;
  return escenario({
    hora: 'noche', sol: new THREE.Vector3(-0.8, 0.5, 0.3), colores: null, fondo: '#0c0a10', exposicion: 1.35, radio: 8,
    async montar(g) {
      const [m, serena, lara, anciana] = await Promise.all([
        cargar('granja_muebles.glb'), actorVecino('canalizadora_lara'), actorDiosa('lara'),
        actorVestido('ella', { piel: '#e8c4a8', pelo: '#e6e1da' }, { pelo: piezaRopa('pelo_mono_bajo', 'pelo'), arriba: piezaRopa('pijama_corazones', 'arriba', {}, ['abajo']) }),
      ]);
      const piso = piezaKit(m, 'piso_modulo'), pared = piezaKit(m, 'pared_modulo');
      if (piso) { const ls: [number, number, number, number, number][] = []; for (let x = -3; x < 3; x++) for (let z = 0; z < 26; z++) ls.push([x + 0.5, 0, -2.5 + z * 0.19 + 0.1, 0, 1]); g.add(instanciar(piso, ls)); }
      if (pared) { const ls: [number, number, number, number, number][] = []; for (let x = -3; x < 3; x++) ls.push([x + 0.5, 0, -2.6, 0, 1]); for (let z = -2; z < 3; z++) { ls.push([-3.1, 0, z + 0.5, Math.PI / 2, 1]); ls.push([3.1, 0, z + 0.5, -Math.PI / 2, 1]); } g.add(instanciar(pared, ls)); }
      g.add(poner(m, 'cama', 0, -1.4, 0, 1.1), poner(m, 'mesa_noche', 1.3, -2.0), poner(m, 'silla', -1.6, 0.6, 0.6), poner(m, 'ventana', -3.0, 0, Math.PI / 2, 1, 1.1, false), poner(m, 'cuadro', 0, -2.5, 0, 0.9, 1.5, false));
      vela = luzCalida('#ffc070', 1.6, 6); vela.position.set(1.3, 0.95, -2.0);
      llama = halo('#ffd58a', 0.5); llama.position.set(1.3, 0.85, -2.0);
      g.add(vela, llama, motasFlotantes(70, [0, 0.6, -1], 2, 2, [0.8, 0.72, 1], 1.6, 7));
      // La anciana acostada
      anciana.raiz.rotation.x = -Math.PI / 2;
      anciana.raiz.position.set(0, 0.62, -1.9);
      colocar(serena, -1.6, 0.6, 0, -1.4);
      colocar(lara, 1.8, 0.8, 0, -1.9, 0.4);
      g.add(anciana.raiz);
      actuar(anciana, 'dormido', 'dormido');
      return { canalizadora_lara: serena, lara };
    },
    animar(c, rp) {
      const apaga = c.desde('SER_apaga');
      const k = 1 - paso(1.5, 3.5, apaga);
      vela.intensity = 1.6 * k * (0.9 + 0.1 * Math.sin(c.t * 9));
      llama.material.opacity = k;
      aparecer(rp.lara, paso(0, 2.5, c.desde('SER_lara')) * (1 - paso(0, 2.5, apaga)), c.t, 0.4);
      const id = c.toma.id;
      if (c.toma.linea?.quien === 'canalizadora_lara') hablar(rp.canalizadora_lara, c, 'sentado', id === 'SER_s2' ? 'llorando' : 'triste'); else actuar(rp.canalizadora_lara, 'sentado', 'triste');
      if (c.toma.linea?.quien === 'lara') hablar(rp.lara, c, 'reposo', 'feliz'); else actuar(rp.lara, 'reposo', 'feliz');
      rp.canalizadora_lara.p.update(c.dt); rp.lara.p.update(c.dt);
    },
  });
}

export const SERENA: Guion = (() => {
  const [n1, s1, n2, la1, s2, la2, n3] = LINEAS_SERENA;
  const tomas: Toma[] = [
    { ...toma('SER_abre', 'despedida', 7, plano([2.4, 2.2, 2.4], [0, 0.7, -1.6], 40), plano([2.0, 1.9, 2.0], [-0.4, 0.7, -1.3], 38), { musica: 'M16', entra: { color: '#000', dur: 2.6 }, bloom: 0.8 }), linea: n1 },
    { ...toma('SER_s1', 'despedida', 5, plano([1.2, 1.5, 0.7], [-1.6, 0.9, 0.6], 34)), linea: s1, bloom: 0.8 },
    { ...toma('SER_mano', 'despedida', 6, plano([2.6, 1.8, 1.8], [-0.4, 0.7, -1.4], 38), plano([2.2, 1.6, 1.4], [-0.2, 0.7, -1.6], 34)), linea: n2, bloom: 0.8 },
    { ...toma('SER_lara', 'despedida', 5, plano([-0.4, 1.9, -0.6], [1.8, 1.4, 0.8], 34)), linea: la1, bloom: 1.1 },
    { ...toma('SER_s2', 'despedida', 5, plano([1.1, 1.45, 0.9], [-1.6, 0.9, 0.6], 32)), linea: s2, bloom: 0.9 },
    { ...toma('SER_la2', 'despedida', 4, plano([-0.3, 1.85, -0.4], [1.8, 1.45, 0.8], 32)), linea: la2, bloom: 1.1 },
    { ...toma('SER_apaga', 'despedida', 8, plano([2.2, 1.2, -0.6], [1.3, 0.9, -2.0], 30), plano([0.4, 2.2, 2.8], [0, 0.8, -1.4], 40)), linea: n3, bloom: 0.8 },
    toma('SER_titulo', 'despedida', 5, plano([0.4, 2.2, 2.8], [0, 0.8, -1.4], 40), undefined, { titulo: { grande: 'El nombre que no se pronuncia por otro', chico: 'Serena, Santa de Lara' }, sale: { color: '#000', dur: 2.4 }, bloom: 0.7 }),
  ];
  return { id: 'SER', nombre: 'El nombre que no se pronuncia por otro', fov: 38, tomas, escenarios: { despedida } };
})();

export type { Reparto };
