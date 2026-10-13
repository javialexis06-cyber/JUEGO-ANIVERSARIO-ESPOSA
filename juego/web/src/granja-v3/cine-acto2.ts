// Las películas del Acto II de la película de Astra (docs/en-obra/pelicula-de-astra.md, capítulo 3):
// SC2 «El fuego bajo la piedra» (Misterio 1), T03 «La cría que no quiere hablar», SC3 «El Santuario roto» (Misterio 2),
// C04 «La copa» (con el Misterio 3: el Lazo Primordial), C05 «Una mañana que no basta» y SC4 «El descenso».
import * as THREE from 'three';
import { cargar } from '../recursos';
import { actorDiosa, actorNathGora, actorPareja, actorVaelThor, actorVecino, actorVestido, actuar, halo, piezaRopa, type Actor } from './cine-actores';
import type { ContextoToma, Escenario, Guion, Toma } from './cine-granja';
import { colocar, copia, escenario, toma, type Reparto } from './cine-acto1';
import {
  FIN_FRAG, RUIDO, actuarDialogo, azar, constelacionAmantes, fogata, hablar, instanciar, luzCalida, mirarA, motasFlotantes, paso, piezaKit,
  plano, poner, puntosSuaves, tomasDialogo, type Puesto,
} from './cine-kit';
import { LINEAS_CAMPANA } from './cine-lineas-campana';
import { LINEAS_C04_LAZO, LINEAS_SC2, LINEAS_SC3, LINEAS_SC4, LINEAS_T03 } from './cine-lineas-historia';

// ------------------------------------------------------------------ piezas comunes del acto

/** La grieta: una raja de luz negra con borde violeta (como en Las Afueras). */
function grieta(ancho = 1.4, largo = 6) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uFuerza: { value: 1 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `uniform float uT;uniform float uFuerza;varying vec2 vUv;${RUIDO}
      void main(){vec2 q=vUv-.5;float linea=abs(q.x+sin(q.y*9.+1.)*.08+fbm(vec3(q.y*6.,uT*.3,0.))*.12-.06);float w=(.05+.04*(1.-abs(q.y)*2.))*uFuerza;
        float nucleo=smoothstep(w,0.,linea);float borde=smoothstep(w*3.5,w,linea)-nucleo;float puntas=smoothstep(.5,.3,abs(q.y));
        vec3 c=vec3(.6,.3,1.)*borde*(1.2+.4*sin(uT*3.))+vec3(.02,0.,.05)*nucleo;gl_FragColor=vec4(c*puntas*uFuerza,1.);${FIN_FRAG}}`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, largo), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.04;
  m.userData.actualizar = (t: number) => { mat.uniforms.uT.value = t; };
  return m;
}

/** Un mural pintado en la roca (dos señoras, una niña y una estrella negra), dibujado en un lienzo. */
function mural() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#5a4436'; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${40 + Math.random() * 40},${30 + Math.random() * 25},${20 + Math.random() * 20},.35)`; g.fillRect(Math.random() * 1024, Math.random() * 512, 3, 3); }
  g.strokeStyle = '#e9c98a'; g.lineWidth = 9; g.lineCap = 'round';
  const dama = (x: number, color: string) => {
    g.fillStyle = color;
    g.beginPath(); g.arc(x, 150, 42, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x - 30, 195); g.quadraticCurveTo(x - 95, 420, x - 110, 450); g.lineTo(x + 110, 450); g.quadraticCurveTo(x + 95, 420, x + 30, 195); g.closePath(); g.fill(); g.stroke();
  };
  dama(280, '#d8a84a'); dama(744, '#5a4a8a');
  g.fillStyle = '#9fd08a'; g.beginPath(); g.arc(512, 330, 34, 0, Math.PI * 2); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(512, 368); g.lineTo(512, 430); g.stroke();
  g.fillStyle = '#0c0b10'; g.beginPath(); g.arc(880, 90, 46, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#9a6ad8'; g.lineWidth = 5; for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; g.beginPath(); g.moveTo(880 + Math.cos(a) * 52, 90 + Math.sin(a) * 52); g.lineTo(880 + Math.cos(a) * 74, 90 + Math.sin(a) * 74); g.stroke(); }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, emissive: '#3a2a10', emissiveMap: tex, emissiveIntensity: 0 }));
  return m;
}

/** Un cuerpo celeste (planeta que se apaga o estrella muerta) con su halo. */
function astro(color: string, radio: number) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.SphereGeometry(radio, 32, 16), new THREE.MeshBasicMaterial({ color, fog: false }));
  const h = halo(color, radio * 7);
  h.material.opacity = 0.5;
  g.add(m, h);
  g.userData.malla = m;
  g.userData.halo = h;
  return g;
}

/** Las diosas como recuerdo: flotan, brillan más y respiran despacio. */
function recuerdo(a: Actor, visible: number, t: number, y = 0.6) {
  a.raiz.visible = visible > 0.01;
  a.raiz.scale.setScalar(0.6 + visible * 0.4);
  a.raiz.position.y = y + Math.sin(t * 1.2) * 0.08;
  if (a.halo) a.halo.material.opacity = 0.55 * visible;
}

// ------------------------------------------------------------------ SC2 · El fuego bajo la piedra

function mina(): Escenario {
  let pintura: THREE.Mesh, planeta: THREE.Group;
  return escenario({
    hora: 'noche', sol: new THREE.Vector3(0.3, 0.8, 0.4), colores: null, fondo: '#0a0706', niebla: ['#120a08', 8, 30], exposicion: 1.4, radio: 12,
    async montar(g) {
      const [kit, jefes, dragon, el, ella, serena, aura, lara, vael] = await Promise.all([
        cargar('sangre/bioma_minas.glb'), cargar('sangre/jefes.glb'), cargar('granja-v3/dragon.glb'),
        actorPareja('el'), actorPareja('ella'), actorVecino('canalizadora_lara'), actorDiosa('aura'), actorDiosa('lara'), actorVaelThor(),
      ]);
      for (let x = -4; x <= 4; x++) for (let z = -3; z <= 4; z++) g.add(poner(kit, ['piso_a', 'piso_b', 'piso_c', 'piso_d'][(x * 5 + z * 3 + 40) % 4], x * 2, z * 2, 0, 1, 0, false));
      // La caverna: muros de roca alrededor, con vetas
      const r = azar(7);
      const muros = ['pared_dura_a', 'pared_dura_b', 'pared_blanda_a', 'veta_sangre', 'veta_oro', 'pared_borde'];
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2, d = 9.5 + r() * 1.2;
        if (Math.sin(a) > 0.82) continue; // la boca del túnel, detrás de la cámara
        g.add(poner(kit, muros[i % muros.length], Math.cos(a) * d, Math.sin(a) * d - 1, r() * 6, 1.6 + r() * 0.6));
        g.add(poner(kit, muros[(i + 2) % muros.length], Math.cos(a) * d, Math.sin(a) * d - 1, r() * 6, 1.4, 2.2, false));
      }
      g.add(poner(kit, 'deco_cristal_grande', -6, -4, 0.4, 1.2), poner(kit, 'deco_cristal_chico', 5.5, -5, 0, 1.3), poner(kit, 'deco_cristal_grande', 6.8, 1, 1.2, 1));
      g.add(poner(kit, 'deco_vagoneta_volcada', 4.5, 3.5, 0.6), poner(kit, 'deco_riel_recto', 3.2, 5.5, 0.6), poner(kit, 'deco_puntal', -4.4, -6.4), poner(kit, 'deco_puntal', 4.4, -6.4));
      g.add(poner(kit, 'deco_lava_grieta', -3.6, 2.6, 0.3), poner(kit, 'deco_lava_charco', 5.6, -1.6), poner(kit, 'deco_esqueleto_minero', -6.4, 1.4, 1));
      for (const [x, z] of [[-4.6, -1.2], [4.2, 0.4], [0, 4.6]] as const) { g.add(poner(kit, 'luz_brasero', x, z)); const l = luzCalida('#ff8a3a', 2.6, 9); l.position.set(x, 1.4, z); g.add(l); }
      // Los dragones dormidos de Celia y La Cría que los cuida
      const cria = piezaKit(jefes, 'jefe_madre_piedra');
      if (cria) g.add(copia(cria, 6.2, -3.4, -0.9, 1.1));
      g.add(copia(dragon, -6.4, -2, 0.9, 1.6), copia(dragon, -5, 4.4, 2.2, 1.3));
      // El mural en la pared del fondo
      pintura = mural();
      pintura.position.set(0, 2.2, -7.2);
      g.add(pintura);
      planeta = astro('#7ab8ff', 0.35);
      planeta.position.set(0.2, 3.6, -5.6);
      g.add(planeta, motasFlotantes(120, [0, 0.2, 0], 7, 3, [1, 0.55, 0.25], 1.8, 5));
      colocar(el, -1.7, 1.6, 0, -6);
      colocar(ella, -0.1, 2.2, 0, -6);
      colocar(serena, 1.6, 0.8, 0, -6);
      colocar(aura, -1.6, -4.4, 0, 2, 0.6);
      colocar(lara, 1.6, -4.4, 0, 2, 0.6);
      colocar(vael, 6.5, 2.2, 0, 1.5);
      return { el, ella, canalizadora_lara: serena, aura, lara, vaelthor: vael };
    },
    animar(c, rp) {
      const m = c.desde('SC2_mural'), f = c.desde('SC2_flash'), v = c.desde('SC2_vael');
      (pintura.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.15 + paso(0, 2, m) * 0.6 * (1 - paso(0, 1.5, f)) + paso(0, 1.5, f) * 0.25;
      const ve = paso(0, 2, f) * (1 - paso(0, 1.6, c.desde('SC2_s2') - 2));
      recuerdo(rp.aura, ve, c.t);
      recuerdo(rp.lara, ve, c.t + 1);
      // El planeta se apaga como una vela
      planeta.visible = ve > 0.01;
      const apaga = paso(1.5, 5, f);
      (planeta.userData.malla.material as THREE.MeshBasicMaterial).color.setRGB(0.48 * (1 - apaga) + 0.03, 0.72 * (1 - apaga) + 0.02, 1 * (1 - apaga) + 0.05);
      (planeta.userData.halo as THREE.Sprite).material.opacity = 0.5 * ve * (1 - apaga);
      rp.vaelthor.raiz.visible = v > 0 && v < 9;
      if (rp.vaelthor.halo) rp.vaelthor.halo.material.opacity = 0.35 + 0.15 * Math.sin(c.t * 3);
      actuarDialogo(rp, c, { aura: 'triste', lara: 'brazos_cruzados' }, { aura: 'triste', lara: 'reposo', vaelthor: 'presumir_a' });
    },
  });
}

export const SC2: Guion = (() => {
  const [n1, e1, s1, n2, a1, la1, s2, v1, l1, s3, e2] = LINEAS_SC2;
  const puestos: Record<string, Puesto> = { el: { x: -1.7, z: 1.6 }, ella: { x: -0.1, z: 2.2 }, canalizadora_lara: { x: 1.6, z: 0.8 } };
  const obstaculos: [number, number, number][] = [[6.2, -3.4, 2.4], [-6.4, -2, 2], [-5, 4.4, 1.8], [4.5, 3.5, 1.2]];
  const tomas: Toma[] = [
    { ...toma('SC2_abre', 'mina', 7, plano([0, 3, 9.5], [0, 1, -3], 44), plano([0, 2.2, 7], [0, 1.4, -5], 40), { musica: 'sangre-noche', entra: { color: '#000', dur: 2.5 }, bloom: 0.9 }), linea: n1 },
    { ...toma('SC2_mural', 'mina', 4, plano([-0.6, 1.9, 1.4], [0, 2.2, -7.2], 40), plano([-0.3, 2.0, 0.2], [0, 2.2, -7.2], 36)), linea: e1, bloom: 0.8 },
    { ...toma('SC2_s1', 'mina', 4, plano([3.6, 1.9, 4.2], [1.6, 1.0, 0.8], 34)), linea: s1, bloom: 0.8 },
    { ...toma('SC2_flash', 'mina', 9, plano([0, 2.0, 2.6], [0, 2.4, -5], 46), plano([0, 2.3, 0.8], [0, 2.6, -5], 42)), linea: n2, bloom: 1.3 },
    { ...toma('SC2_a1', 'mina', 3, plano([-0.6, 1.9, -1.6], [-1.6, 1.8, -4.4], 32)), linea: a1, bloom: 1.2 },
    { ...toma('SC2_la1', 'mina', 3, plano([0.6, 1.9, -1.6], [1.6, 1.8, -4.4], 32)), linea: la1, bloom: 1.2 },
    { ...toma('SC2_s2', 'mina', 4, plano([3.4, 1.8, 4.6], [0, 1.0, 1.4], 38)), linea: s2, bloom: 0.8 },
    { ...toma('SC2_vael', 'mina', 4, plano([2.6, 1.9, 5.2], [6.5, 1.3, 2.2], 34), plano([3.2, 1.8, 4.8], [6.5, 1.3, 2.2], 30)), linea: v1, bloom: 1 },
    ...tomasDialogo([l1, s3, e2], { escena: 'mina', puestos, centro: [0, 1.4], semilla: 71, prefijo: 'SC2', bloom: 0.8, obstaculos, audiencia: [0, 1] }),
    toma('SC2_titulo', 'mina', 5, plano([0, 2.6, 6.5], [0, 2.2, -7.2], 42), plano([0, 2.4, 5.2], [0, 2.2, -7.2], 40), { titulo: { grande: 'Por qué el escudo', chico: 'Sangre y Ceniza · II' }, sale: { color: '#000', dur: 2 }, bloom: 0.9 }),
  ];
  return { id: 'SC2', nombre: 'El fuego bajo la piedra', fov: 40, tomas, escenarios: { mina } };
})();

// ------------------------------------------------------------------ T03 · La cría que no quiere hablar

function corral(): Escenario {
  let cria: THREE.Object3D, curiosos: Actor[] = [];
  return escenario({
    hora: 'atardecer', sol: new THREE.Vector3(-0.85, 0.22, -0.4), colores: ['#7f9a4a', '#93ad58', '#6e8a40', '#a6b864'], niebla: ['#f0b890', 40, 200],
    async montar(g) {
      const [pueblo, monte, granero, cerca, heno, unicornio, el, ella, mara, fuatia, nino, nina] = await Promise.all([
        cargar('granja_pueblo.glb'), cargar('granja_monte.glb'), cargar('granja-v2/granero.glb'), cargar('granja-v2/cerca.glb'), cargar('granja-v2/paca_heno.glb'),
        cargar('granja-v3/unicornio.glb'), actorPareja('el'), actorPareja('ella'), actorVecino('cuidadora'), actorDiosa('fuatia'), actorVecino('nino'), actorVecino('nina'),
      ]);
      g.add(copia(granero, 0, -9, 0, 1.6));
      const tramos: [number, number, number, number, number][] = [];
      for (let i = 0; i < 6; i++) { tramos.push([-5.5 + i * 2.2, 0, -5.5, 0, 1]); if (i !== 2 && i !== 3) tramos.push([-5.5 + i * 2.2, 0, 5.5, 0, 1]); }
      for (let i = 0; i < 5; i++) { tramos.push([-6.6, 0, -4.4 + i * 2.2, Math.PI / 2, 1]); tramos.push([6.6, 0, -4.4 + i * 2.2, Math.PI / 2, 1]); }
      g.add(instanciar(cerca, tramos));
      g.add(poner(pueblo, 'bebedero', 2.6, -2.6, 0.2), poner(pueblo, 'rollo_heno', -3.6, -3.2), copia(heno, 4.6, 2.4, 0.5, 1.2), copia(heno, -4.8, 2.8, 1.2, 1.2));
      const r = azar(3);
      const roble = piezaKit(monte, 'roble');
      if (roble) g.add(instanciar(roble, Array.from({ length: 40 }, () => { const a = r() * Math.PI * 2, d = 14 + r() * 40; return [Math.cos(a) * d, 0, Math.sin(a) * d - 4, r() * 6, 1 + r() * 0.5] as [number, number, number, number, number]; })));
      cria = copia(unicornio, 3.2, -3.6, -0.5, 0.42);
      g.add(cria, motasFlotantes(160, [0, 0.4, 0], 9, 3, [1, 0.85, 0.55], 1.6, 9));
      colocar(el, -1.8, 2.4, 2, -2);
      colocar(ella, -0.4, 3.0, 2, -2);
      colocar(mara, 1.0, 0.6, 3, -3);
      colocar(fuatia, -3.2, 0.2, 2, -2, 0.3);
      colocar(nino, 2.2, 2.6, 3, -3);
      colocar(nina, 4.6, 0.4, 3, -3);
      curiosos = [nino, nina];
      for (const a of curiosos) g.add(a.raiz);
      return { el, ella, cuidadora: mara, fuatia };
    },
    animar(c, rp) {
      // Los curiosos se van cuando Javier lo pide
      const sale = c.desde('T03_2');
      curiosos.forEach((a, i) => {
        a.raiz.visible = sale < 6;
        if (sale > 0.8) {
          const k = Math.min(1, (sale - 0.8) / 5);
          a.raiz.position.x = (i ? 4.6 : 2.2) + k * 7;
          a.raiz.rotation.y = Math.PI / 2;
          a.p.vaiven('caminar_a', 'caminar_b', 0.5 + 0.5 * Math.sin(c.t * 7));
        } else { mirarA(a, 3.2, -3.6, c.dt * 3); actuar(a, 'senalar_a', 'feliz'); }
        a.p.update(c.dt);
      });
      // La cría se asoma y al final se acerca sola
      const vino = c.desde('T03_6');
      const k = paso(0.5, 5, vino);
      cria.position.set(3.2 + (-0.6 - 3.2) * k, Math.abs(Math.sin(c.t * 6)) * 0.04 * (k > 0 && k < 1 ? 1 : 0), -3.6 + (2.2 + 3.6) * k);
      cria.rotation.y = k > 0 && k < 1 ? Math.atan2(-3.8, 5.8) : -0.5 + Math.sin(c.t * 0.7) * 0.2;
      rp.fuatia.raiz.position.y = 0.3 + Math.sin(c.t * 1.3) * 0.06;
      actuarDialogo(rp, c, {}, { el: 'reposo', ella: c.desde('T03_6') > 0 ? 'feliz' : 'reposo', fuatia: 'reposo' });
    },
  });
}

export const T03: Guion = (() => {
  const L = LINEAS_T03;
  const puestos: Record<string, Puesto> = { el: { x: -1.8, z: 2.4 }, ella: { x: -0.4, z: 3.0 }, cuidadora: { x: 1.0, z: 0.6 }, fuatia: { x: -3.2, z: 0.2, cabeza: 1.4 } };
  const obstaculos: [number, number, number][] = [[0, -9, 5], [2.6, -2.6, 1.4], [-3.6, -3.2, 1], [2.2, 2.6, 0.9], [4.6, 0.4, 0.9], [4.6, 2.4, 0.9], [-4.8, 2.8, 0.9]];
  const d = (a: number, b: number, pref: string, sem: number) => tomasDialogo(L.slice(a, b), { escena: 'corral', puestos, centro: [0, 1.4], semilla: sem, prefijo: pref, bloom: 0.6, obstaculos, audiencia: [0, 1] });
  const tomas: Toma[] = [
    { ...toma('T03_abre', 'corral', 6, plano([-6, 3.5, 9], [1, 0.6, -2], 40), plano([-1.5, 1.6, 2.0], [3.0, 0.4, -3.4], 34), { musica: 'M01', entra: { color: '#000', dur: 2 }, bloom: 0.6 }), linea: L[0] },
    ...d(1, 3, 'T03_1', 81),
    { ...toma('T03_2', 'corral', 6, plano([-0.5, 2.0, 7.6], [1.6, 0.9, 1.4], 40), plano([0.2, 1.8, 6.8], [2.4, 0.9, 1.4], 38)), linea: L[3], bloom: 0.6 },
    ...d(4, 5, 'T03_3', 83),
    { ...toma('T03_5', 'corral', 7, plano([9, 4, 9], [0, 0.6, 0], 40), plano([8, 3, 8], [0, 0.6, 0], 40), { bloom: 0.75 }), linea: L[5] },
    { ...toma('T03_6', 'corral', 7, plano([-2.4, 1.0, 5.6], [0.6, 0.5, 0.6], 36), plano([-1.6, 0.9, 5.2], [-0.4, 0.6, 2.4], 32)), linea: L[6], bloom: 0.7 },
    { ...toma('T03_7', 'corral', 6, plano([-0.4, 1.9, -1.6], [-3.2, 1.3, 0.2], 32), plano([-0.8, 1.85, -1.4], [-3.2, 1.35, 0.2], 30)), linea: L[7], bloom: 0.8 },
    toma('T03_titulo', 'corral', 5, plano([-1.6, 0.9, 5.2], [-0.4, 0.6, 2.4], 32), plano([-3, 3, 9], [0, 0.8, 0], 40), { titulo: { grande: 'La cría que no quiere hablar', chico: 'Fuatia' }, sale: { color: '#000', dur: 2 } }),
  ];
  return { id: 'T03', nombre: 'La cría que no quiere hablar', fov: 38, tomas, escenarios: { corral } };
})();

// ------------------------------------------------------------------ SC3 · El Santuario roto

function abadia(): Escenario {
  let reliquia: THREE.Group, prisiones: THREE.Group, monjes: Actor[] = [];
  return escenario({
    hora: 'noche', sol: new THREE.Vector3(0.2, 0.7, 0.6), colores: null, fondo: '#0c0708', niebla: ['#1c1012', 14, 46], exposicion: 1.75, radio: 12,
    async montar(g) {
      const [kit, monte, muebles, el, ella, serena, ...frailes] = await Promise.all([
        cargar('sangre/bioma_abadia.glb'), cargar('granja_monte.glb'), cargar('granja_muebles.glb'), actorPareja('el'), actorPareja('ella'), actorVecino('canalizadora_lara'),
        ...[0, 1, 2].map(() => actorVestido('el', { piel: '#c9a88a', pelo: '#3a2a22' }, { pelo: piezaRopa('pelo_calvo', 'pelo'), arriba: piezaRopa('sangre_inquisidor', 'arriba', {}, ['abajo']), pies: piezaRopa('sandalias', 'pies') })),
      ]);
      for (let x = -3; x <= 3; x++) for (let z = -5; z <= 3; z++) g.add(poner(kit, ['piso_a', 'piso_b', 'piso_c', 'piso_e'][(x * 7 + z * 3 + 40) % 4], x * 2, z * 2, 0, 1, 0, false));
      for (const z of [-8, -4, 0, 4]) { g.add(poner(kit, z === 0 ? 'deco_columna_rota' : 'deco_columna_rota', -5.4, z, 0, 1.4), poner(kit, 'deco_columna_rota', 5.4, z, 1, 1.4)); }
      g.add(poner(kit, 'deco_altar', 0, -8.4, 0, 1.4), poner(kit, 'deco_vitral_roto', 0, -10.2, 0, 1.8), poner(kit, 'deco_organo', -4, -9.6, 0.3, 1.2), poner(kit, 'deco_estatua_santo', 4, -9.4, -0.3, 1.3));
      g.add(poner(kit, 'deco_pulpito', 3.6, -5.2, -0.6), poner(kit, 'deco_vigas_ardiendo', -2.8, 3.2, 0.7), poner(kit, 'deco_campana_caida', 3.8, 3.4, 1), poner(kit, 'deco_escombros', -4, 0.8));
      for (const [x, z, giro] of [[-2.4, -1.6, 0], [2.4, -1.6, 0], [-2.4, 1.2, 0.2], [2.6, 1.4, -0.3]] as const) g.add(poner(kit, z > 0 ? 'deco_banca_rota' : 'deco_banca_quemada', x, z, giro));
      for (const [x, z] of [[-4.4, -6.6], [4.4, -6.6], [-4.6, 2.4]] as const) { const f = fogata(1.1, Math.round(x * 10 + z)); f.position.set(x, 0, z); g.add(f); }
      for (const [x, z] of [[-1.2, -7.4], [1.2, -7.4]] as const) { g.add(poner(kit, 'luz_candelabro', x, z)); const l = luzCalida('#ff9a5a', 1.6, 7); l.position.set(x, 1.6, z); g.add(l); }
      g.add(motasFlotantes(200, [0, 0.2, -2], 6, 5, [0.6, 0.5, 0.5], 2.2, 13));
      // El cofre con el manuscrito y la reliquia que se levanta
      g.add(poner(muebles, 'cofre_tesoro', 0, -5.4, 0, 1));
      reliquia = new THREE.Group();
      const hr = halo('#ff3a4a', 1.6); hr.material.opacity = 0.8;
      reliquia.add(hr, motasFlotantes(60, [0, 0, 0], 0.25, 0.4, [1, 0.35, 0.4], 2.4, 17));
      reliquia.position.set(0, 1.2, -5.4);
      g.add(reliquia);
      // Las prisiones de Vael'Thor: cristales oscuros con un dios dormido adentro (motas doradas que se apagan)
      prisiones = new THREE.Group();
      const cristal = piezaKit(monte, 'cristales');
      if (cristal) for (let i = 0; i < 5; i++) {
        const c = copia(cristal, -4 + i * 2, -9.2 + (i % 2) * 0.6, i * 1.3, 1.4, 0.2);
        c.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.material = (m.material as THREE.MeshStandardMaterial).clone(); (m.material as THREE.MeshStandardMaterial).color.set('#2a1640'); (m.material as THREE.MeshStandardMaterial).emissive?.set('#3a1a5a'); } });
        c.userData.noLiberar = false;
        prisiones.add(c);
        const dios = halo('#ffd98a', 1.4); dios.position.set(-4 + i * 2, 1.4, -9.2 + (i % 2) * 0.6); dios.material.opacity = 0.6; prisiones.add(dios);
      }
      prisiones.visible = false;
      g.add(prisiones);
      frailes.forEach((f, i) => { colocar(f, -2.2 + i * 2.2, -7.2 + (i === 1 ? -0.3 : 0), 0, -9); g.add(f.raiz); });
      // Luz del vitral y un relleno tibio para que se vean las caras
      const vitral = new THREE.SpotLight('#ffd2a0', 9, 26, 0.7, 0.6, 1.2); vitral.position.set(0, 7, -10); vitral.target.position.set(0, 0, 0); g.add(vitral, vitral.target, new THREE.HemisphereLight('#a07a6a', '#2a1a1a', 0.9));
      monjes = frailes;
      colocar(el, -1.8, 2.6, 0, -6);
      colocar(ella, -0.2, 3.4, 0, -6);
      colocar(serena, 1.6, 2.0, 0, -6);
      return { el, ella, canalizadora_lara: serena };
    },
    animar(c, rp) {
      for (const m of monjes) { actuar(m, 'rodillas_a', 'normal'); m.p.update(c.dt); }
      const sube = c.desde('SC3_n3');
      reliquia.visible = c.desde('SC3_n2') > 0;
      reliquia.position.y = 1.0 + paso(0, 3, sube) * 0.8 + Math.sin(c.t * 2) * 0.05;
      const pr = c.desde('SC3_s3');
      prisiones.visible = pr > 0 && pr < 9;
      prisiones.children.forEach((o, i) => { if ((o as THREE.Sprite).isSprite) (o as THREE.Sprite).material.opacity = 0.6 * (1 - paso(1 + i * 0.4, 3 + i * 0.4, pr)) + 0.08; });
      actuarDialogo(rp, c);
    },
  });
}

export const SC3: Guion = (() => {
  const [n1, s1, n2, s2, l1, s3, e1, s4, n3, e2, l2, e3] = LINEAS_SC3;
  const puestos: Record<string, Puesto> = { el: { x: -1.8, z: 2.6 }, ella: { x: -0.2, z: 3.4 }, canalizadora_lara: { x: 1.6, z: 2.0 } };
  const obstaculos: [number, number, number][] = [[-2.8, 3.2, 1.2], [3.8, 3.4, 1], [-4, 0.8, 1], [-4.6, 2.4, 0.8], [-2.4, 1.2, 1], [2.6, 1.4, 1], [-2.4, -1.6, 1], [2.4, -1.6, 1], [0, -5.4, 0.7]];
  const tomas: Toma[] = [
    { ...toma('SC3_abre', 'abadia', 8, plano([0, 4, 8], [0, 1.2, -8], 44), plano([0, 1.8, 0.5], [0, 1.0, -6], 40), { musica: 'sangre-noche', entra: { color: '#000', dur: 2.5 }, bloom: 1 }), linea: n1 },
    { ...toma('SC3_s1', 'abadia', 3, plano([3.4, 1.9, 4.6], [1.6, 1.1, 2.0], 32)), linea: s1, bloom: 0.9 },
    { ...toma('SC3_n2', 'abadia', 5, plano([2.4, 1.5, -2.6], [0, 0.6, -5.4], 36), plano([2.0, 1.3, -3.2], [0, 0.6, -5.4], 32)), linea: n2, bloom: 1 },
    ...tomasDialogo([s2, l1], { escena: 'abadia', puestos, centro: [0, 2.6], semilla: 91, prefijo: 'SC3_a', bloom: 0.9, obstaculos, audiencia: [0, 1] }),
    { ...toma('SC3_s3', 'abadia', 7, plano([0, 2.4, -3.2], [0, 1.4, -9.2], 44), plano([0, 2.2, -4.4], [0, 1.5, -9.2], 40)), linea: s3, bloom: 1.2 },
    ...tomasDialogo([e1, s4], { escena: 'abadia', puestos, centro: [0, 2.6], semilla: 93, prefijo: 'SC3_b', bloom: 0.9, obstaculos, audiencia: [0, 1] }),
    { ...toma('SC3_n3', 'abadia', 6, plano([-2.0, 1.5, -2.4], [0, 1.6, -5.4], 34), plano([-1.6, 1.6, -3.0], [0, 1.9, -5.4], 30)), linea: n3, bloom: 1.3 },
    ...tomasDialogo([e2, l2, e3], { escena: 'abadia', puestos, centro: [0, 2.6], semilla: 97, prefijo: 'SC3_c', bloom: 0.9, obstaculos, audiencia: [0, 1] }),
    toma('SC3_titulo', 'abadia', 5, plano([0, 2.6, 7], [0, 1.4, -6], 42), plano([0, 3.4, 9], [0, 1.6, -8], 42), { titulo: { grande: 'Los otros panteones', chico: 'Sangre y Ceniza · III' }, sale: { color: '#000', dur: 2 }, bloom: 1 }),
  ];
  return { id: 'SC3', nombre: 'El Santuario roto', fov: 40, tomas, escenarios: { abadia } };
})();

// ------------------------------------------------------------------ C04 · La copa (y el Lazo Primordial)

function corte(): Escenario {
  let rajadura: THREE.Mesh, constelacion: THREE.Group, conde: THREE.Object3D, velo: THREE.Points;
  return escenario({
    hora: 'noche', sol: new THREE.Vector3(0.2, 0.6, 0.8), colores: null, fondo: '#05040a', niebla: ['#120a14', 16, 70], exposicion: 1.6, radio: 14,
    async montar(g) {
      const { cielo } = await import('./cine-kit');
      g.add(cielo('noche_roja', new THREE.Vector3(0.1, 0.3, -0.95)));
      const [kit, jefes, el, ella, serena, nath, lara] = await Promise.all([
        cargar('sangre/bioma_castillo.glb'), cargar('sangre/jefes.glb'), actorPareja('el'), actorPareja('ella'), actorVecino('canalizadora_lara'), actorNathGora(), actorDiosa('lara'),
      ]);
      for (let x = -4; x <= 4; x++) for (let z = -4; z <= 3; z++) g.add(poner(kit, ['piso_a', 'piso_b', 'piso_c', 'piso_e'][(x * 7 + z * 3 + 40) % 4], x * 2, z * 2, 0, 1, 0, false));
      for (let x = -4; x <= 4; x += 2) g.add(poner(kit, 'deco_columna_marmol', x * 2, -8.6));
      for (const z of [-6, -2, 2]) { g.add(poner(kit, 'deco_columna_marmol', -8.6, z)); g.add(poner(kit, 'deco_columna_marmol', 8.6, z)); }
      g.add(poner(kit, 'deco_trono', 0, -6.4, 0, 1.4), poner(kit, 'deco_alfombra', 0, -3, 0, 1.6), poner(kit, 'deco_fuente_sangre', -5, -4.5), poner(kit, 'deco_espejo_roto', 5.6, -4.6, -0.6));
      g.add(poner(kit, 'deco_estandarte', -3, -7.4), poner(kit, 'deco_estandarte', 3, -7.4), poner(kit, 'deco_sillas_rotas', 4.4, 1.6, 0.6), poner(kit, 'deco_gargola', -6, -8.7, 0, 1.1));
      for (const [x, z] of [[-2, -4.4], [2, -4.4], [-4, 1.6], [4, 2.2]] as const) { g.add(poner(kit, 'luz_candelabro', x, z)); const l = luzCalida('#ff9a6a', 1.6, 7); l.position.set(x, 1.6, z); g.add(l); }
      const jc = piezaKit(jefes, 'jefe_conde');
      conde = jc ? copia(jc, 0, -3.6, 0, 0.62) : new THREE.Group();
      g.add(conde);
      // Luz de frente (velas del salón) para que las caras no queden a contraluz contra el cielo rojo
      const frente = new THREE.SpotLight('#ffc9a0', 10, 30, 0.8, 0.6, 1.1); frente.position.set(2, 6, 9); frente.target.position.set(0, 0.8, -1); g.add(frente, frente.target, new THREE.HemisphereLight('#c9a0b0', '#2a1a20', 1.0));
      rajadura = grieta(1.6, 9);
      rajadura.position.set(0, 0.05, -5);
      rajadura.rotation.z = Math.PI / 2;
      g.add(rajadura);
      constelacion = constelacionAmantes();
      constelacion.userData.manual = true;
      g.add(constelacion);
      velo = motasFlotantes(260, [0, 0, -3.6], 1.4, 3.2, [0.78, 0.68, 1], 2.6, 23);
      velo.userData.manual = true;
      g.add(velo);
      colocar(el, -1.0, 2.2, 0, -2.4);
      colocar(ella, 0.6, 2.4, 0, -2.4);
      colocar(serena, 2.4, 0.4, 0, -2.4);
      colocar(nath, 0, -11.5, 0, 0, 0.6);
      colocar(lara, -2.4, -1.6, 0, -3.6, 0.6);
      return { el, ella, canalizadora_lara: serena, nathgora: nath, lara };
    },
    animar(c, rp) {
      const lazo = c.desde('C04_lazo'), sella = c.desde('C04_sella');
      constelacion.userData.actualizar(c.t, c.alto, lazo > 0 ? paso(0, 3, lazo) * (1 - paso(0, 2, c.desde('C04_fin'))) + 0.15 : 0.15 + 0.1 * Math.sin(c.t * 4));
      (rajadura.material as THREE.ShaderMaterial).uniforms.uFuerza.value = 1 - paso(1, 6, sella);
      // Nath'Gora mira desde el otro lado de la grieta
      rp.nathgora.raiz.visible = sella < 4;
      rp.nathgora.raiz.position.y = 0.6 + Math.sin(c.t * 0.8) * 0.15;
      // Lara llega con su velo y se lleva al Conde a Nox
      const llega = paso(0, 2.5, sella);
      recuerdo(rp.lara, llega, c.t, 0.6);
      const uV = (velo.material as THREE.ShaderMaterial).uniforms;
      uV.uT.value = c.t; uV.uEscala.value = c.alto / 720; uV.uAlfa.value = sella > 0 ? paso(1, 3, sella) * (1 - paso(6, 8, sella)) : 0;
      const va = paso(3, 7, sella);
      conde.visible = va < 0.98;
      conde.scale.setScalar(0.62 * (1 - va * 0.8));
      conde.position.y = -va * 0.8;
      conde.rotation.y = Math.sin(c.t * 0.5) * 0.1;
      actuarDialogo(rp, c, { lara: 'senalar_b' }, { lara: 'reposo', nathgora: 'brazos_cruzados', el: lazo > 0 && sella < 0 ? 'feliz' : 'reposo', ella: lazo > 0 && sella < 0 ? 'feliz' : 'reposo' });
    },
  });
}

export const C04: Guion = (() => {
  const L = LINEAS_CAMPANA.C04;
  const puestos: Record<string, Puesto> = { conde: { x: 0, z: -3.6, cabeza: 1.5 }, el: { x: -1.0, z: 2.2 }, ella: { x: 0.6, z: 2.4 }, canalizadora_lara: { x: 2.4, z: 0.4 }, nathgora: { x: 0, z: -11.5, cabeza: 2.6 } };
  const op = (pref: string, sem: number) => ({ escena: 'corte', puestos, centro: [0.4, 0.4] as [number, number], semilla: sem, prefijo: pref, bloom: 0.9, obstaculos: [[-5, -4.5, 1.4], [5.6, -4.6, 1], [4.4, 1.6, 0.8], [0, -3.6, 1.3], [-2, -4.4, 0.4], [2, -4.4, 0.4], [-4, 1.6, 0.4], [4, 2.2, 0.4]] as [number, number, number][], audiencia: [0, 1] as [number, number] });
  const tomas: Toma[] = [
    toma('C04_abre', 'corte', 6, plano([0, 6, 16], [0, 2, -6], 42), plano([0, 2.4, 7.5], [0, 1.4, -2.4], 38), { musica: 'M11', entra: { color: '#000', dur: 2.5 }, bloom: 1 }),
    ...tomasDialogo(L.slice(0, 8), op('C04_a', 101)),
    { ...toma('C04_nath', 'corte', 5, plano([0, 1.6, 3.6], [0, 2.6, -11.5], 36), plano([0, 1.5, 2.8], [0, 2.8, -11.5], 32)), linea: L[8], bloom: 1.2 },
    ...tomasDialogo(L.slice(9, 11), op('C04_b', 103)),
    { ...toma('C04_lazo', 'corte', 6, plano([0, 1.0, 5.6], [-0.2, 6, -30], 50), plano([0, 0.9, 5.0], [-0.2, 9, -30], 50)), linea: LINEAS_C04_LAZO[0], bloom: 1.3 },
    ...tomasDialogo(LINEAS_C04_LAZO.slice(1), op('C04_c', 107)),
    { ...toma('C04_estrellas', 'corte', 8, plano([-0.2, 1.3, 4.8], [-0.2, 1.0, 2.3], 34), plano([-0.2, 0.8, 5.6], [-0.2, 12, -30], 52)), linea: L[11], bloom: 1.4 },
    { ...toma('C04_sella', 'corte', 9, plano([-4.6, 2.2, 2.6], [-0.8, 1.1, -3.0], 40), plano([-3.8, 1.8, 1.8], [0, 0.9, -3.6], 36)), linea: L[12], bloom: 1.3 },
    ...tomasDialogo(L.slice(13, 15), op('C04_d', 109)),
    { ...toma('C04_fin', 'corte', 8, plano([1.6, 0.6, -1.0], [0, 0.1, -3.6], 34), plano([0, 4.5, 9], [0, 1, -4], 42)), linea: L[15], bloom: 1 },
    toma('C04_titulo', 'corte', 5, plano([0, 4.5, 9], [0, 1, -4], 42), plano([0, 6, 12], [0, 2, -6], 42), { titulo: { grande: 'La copa', chico: 'Capítulo IX' }, sale: { color: '#000', dur: 2.2 }, bloom: 1 }),
  ];
  return { id: 'C04', nombre: 'La copa', fov: 38, tomas, escenarios: { corte } };
})();

// ------------------------------------------------------------------ C05 · Una mañana que no basta

function vigilia(): Escenario {
  return escenario({
    hora: 'tarde', sol: new THREE.Vector3(0.9, 0.18, -0.3), colores: ['#8a8a6a', '#9a9878', '#7a7a5c', '#8fa060'], niebla: ['#f4d9b8', 30, 160],
    async montar(g) {
      const [edif, muebles, pueblo, ajiaco, noemi, aldan, rosa, el, ella] = await Promise.all([
        cargar('granja_edificios.glb'), cargar('granja_muebles.glb'), cargar('granja_pueblo.glb'), cargar('comida_ajiaco.glb'),
        actorVecino('vigilia_noemi'), actorVecino('vigilia_aldan'), actorVecino('posadera'), actorPareja('el'), actorPareja('ella'),
      ]);
      g.add(poner(edif, 'edificio_clinica_7x7', -6, -9, 0.2), poner(edif, 'edificio_posada_7x7', 6, -9, -0.2));
      for (let i = 0; i < 4; i++) g.add(poner(muebles, 'camilla', -5 + i * 1.6, -3.6, 0, 1.1));
      g.add(poner(muebles, 'biombo', -6.8, -2, 0.6), poner(muebles, 'botiquin', -2.4, -4.6, 0, 1, 0.9, false), poner(pueblo, 'mesa_posada', 3.4, -2.2));
      g.add(copia(ajiaco, 3.4, -2.2, 0, 1.4, 0.92));
      for (const [x, z] of [[2.2, -3], [4.6, -3.2], [3.2, -0.8]] as const) g.add(poner(muebles, 'taburete', x, z));
      g.add(poner(pueblo, 'farol', 0, -5.2), poner(pueblo, 'caja', 6.4, 0.4), poner(pueblo, 'caja', 7, 1.2, 0.5), poner(pueblo, 'tablon', -1.2, -6.8));
      g.add(motasFlotantes(120, [0, 0.4, -2], 8, 3, [1, 0.9, 0.7], 1.4, 5));
      colocar(noemi, -1.4, -1.8, 0, 0.6);
      colocar(aldan, -0.2, -2.6, -1, 0);
      colocar(rosa, 2.4, -1.2, 0, 0.6);
      colocar(el, 0.6, 0.8, 0, -1);
      colocar(ella, -0.8, 0.6, 0, -1);
      return { vigilia_noemi: noemi, vigilia_aldan: aldan, posadera: rosa, el, ella };
    },
    animar(c, rp) { actuarDialogo(rp, c, {}, { vigilia_aldan: 'brazos_cruzados' }); },
  });
}

export const C05: Guion = (() => {
  const L = LINEAS_CAMPANA.C05;
  const puestos: Record<string, Puesto> = { vigilia_noemi: { x: -1.4, z: -1.8 }, vigilia_aldan: { x: -0.2, z: -2.6 }, posadera: { x: 2.4, z: -1.2 }, el: { x: 0.6, z: 0.8 }, ella: { x: -0.8, z: 0.6 } };
  const tomas: Toma[] = [
    toma('C05_abre', 'vigilia', 6, plano([2, 6, 14], [0, 1, -4], 40), plano([1, 2.4, 7.5], [0, 1, -2], 38), { musica: 'M08', entra: { color: '#fff4e2', dur: 2.4 }, bloom: 0.6 }),
    ...tomasDialogo(L.slice(0, -1), { escena: 'vigilia', puestos, centro: [0.2, -0.8], semilla: 111, prefijo: 'C05', bloom: 0.55, obstaculos: [[-6, -9, 4.5], [6, -9, 4.5], [-6.8, -2, 0.9], [0, -5.2, 0.4]], bajos: [[3.4, -2.2, 1.3], [-2.6, -3.6, 2.8]], audiencia: [0, 1] }),
    { ...toma('C05_cierre', 'vigilia', 8, plano([3.6, 1.6, -0.4], [3.4, 1.0, -2.2], 30), plano([6, 4, 9], [0, 1, -3], 42)), linea: L[L.length - 1], bloom: 0.6 },
    toma('C05_titulo', 'vigilia', 5, plano([6, 4, 9], [0, 1, -3], 42), plano([8, 6, 12], [0, 1.4, -4], 42), { titulo: { grande: 'Una mañana que no basta', chico: 'Capítulo X' }, sale: { color: '#000', dur: 2 } }),
  ];
  return { id: 'C05', nombre: 'Una mañana que no basta', fov: 38, tomas, escenarios: { vigilia } };
})();

// ------------------------------------------------------------------ SC4 · El descenso

function abismo(): Escenario {
  let muerta: THREE.Group, lejos: THREE.Group;
  return escenario({
    hora: 'noche', sol: new THREE.Vector3(0.4, 0.3, 0.8), colores: null, fondo: '#020206', exposicion: 1.3, radio: 10,
    async montar(g) {
      const { cielo } = await import('./cine-kit');
      g.add(cielo('noche', new THREE.Vector3(0.5, 0.2, -0.8)));
      const [kit, nath] = await Promise.all([cargar('sangre/bioma_minas.glb'), actorNathGora()]);
      // Una roca flotando en el vacío
      g.add(poner(kit, 'pared_dura_a', 0, 0, 0, 3.2, -4.6, false), poner(kit, 'pared_dura_b', 1.6, 0.8, 1, 2.2, -3.4, false), poner(kit, 'pared_borde', -1.4, -0.6, 2, 2.4, -3.6, false));
      muerta = astro('#1a1a24', 2.6);
      muerta.position.set(-9, 4, -14);
      (muerta.userData.halo as THREE.Sprite).material.color.set('#4a5a8a');
      g.add(muerta);
      lejos = constelacionAmantes(260);
      lejos.userData.manual = true;
      g.add(lejos, motasFlotantes(160, [0, 0, 0], 10, 6, [0.55, 0.65, 1], 2, 7));
      colocar(nath, 0, 0.6, 3, -10);
      return { nathgora: nath };
    },
    animar(c, rp) {
      lejos.userData.actualizar(c.t, c.alto, 0.9);
      muerta.rotation.y = c.t * 0.05;
      const n = rp.nathgora;
      mirarA(n, 3, -12, c.dt);
      if (c.toma.linea?.quien === 'nathgora') hablar(n, c, 'brazos_cruzados', 'normal'); else actuar(n, 'reposo', 'normal');
      n.p.update(c.dt);
    },
  });
}

export const SC4: Guion = (() => {
  const [n1, ng1] = LINEAS_SC4;
  const tomas: Toma[] = [
    { ...toma('SC4_abre', 'abismo', 7, plano([-6, 3, 10], [0, 1, 0], 46), plano([-2.4, 1.8, 5.4], [0, 1.4, 0], 40), { musica: 'sangre-noche', entra: { color: '#000', dur: 3 }, bloom: 1.1 }), linea: n1 },
    { ...toma('SC4_ng', 'abismo', 9, plano([2.6, 2.2, -4.8], [0, 1.4, 0.6], 34), plano([2.0, 2.1, -4.2], [0, 1.5, 0.6], 32)), linea: ng1, bloom: 1.2 },
    toma('SC4_titulo', 'abismo', 5, plano([-1.2, 1.4, 3.0], [3, 6, -40], 46), plano([-2, 2, 5], [3, 8, -40], 46), { titulo: { grande: 'Todavía no', chico: 'Sangre y Ceniza' }, sale: { color: '#000', dur: 2.4 }, bloom: 1.2 }),
  ];
  return { id: 'SC4', nombre: 'El descenso', fov: 40, tomas, escenarios: { abismo } };
})();

export type { ContextoToma, Reparto };
