// Las películas del Acto I de la película de Astra (docs/en-obra/pelicula-de-astra.md, capítulo 3):
// C01 «Dos surcos», C11 «El agua que escucha» (con la entrada de Fuatia), SC0 «La Noche Eterna», C02 «La campana y la
// mesa», Eliana «El brote que puede esperar», SC1 «Las Afueras» y C03 «La firma». Los escenarios se arman con los kits
// de Blender (granja, pueblo, muebles y los biomas de Sangre y Ceniza) y los diálogos con la dirección automática de
// cine-kit.ts (planos medios, sobre el hombro, de dos y generales).
import * as THREE from 'three';
import { cargar } from '../recursos';
import { actorDiosa, actorPareja, actorVecino, actorVestido, actuar, halo, piezaRopa, type Actor } from './cine-actores';
import type { ContextoToma, Escenario, Guion, Toma } from './cine-granja';
import {
  FIN_FRAG, RUIDO, actuarDialogo, animarTodo, azar, cielo, clamp, constelacionAmantes, fogata, hablar, instanciar, luces, luzCalida,
  mirarA, motasFlotantes, paso, piezaKit, plano, poner, puntosSuaves, suelo, tomasDialogo, type Hora, type Puesto,
} from './cine-kit';
import { LINEAS_CAMPANA } from './cine-lineas-campana';
import { LINEAS_C11_FUATIA, LINEAS_ELIANA, LINEAS_SC0, LINEAS_SC1 } from './cine-lineas-historia';

// ------------------------------------------------------------------ utilidades de este acto

export type Reparto = Record<string, Actor>;
export const colocar = (a: Actor, x: number, z: number, mx = 0, mz = 0, y = 0) => { a.raiz.position.set(x, y, z); a.raiz.rotation.y = Math.atan2(mx - x, mz - z); };
export const sombras = (o: THREE.Object3D) => { o.traverse((x) => { const m = x as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); o.userData.noLiberar = true; return o; };
export const copia = (o: THREE.Object3D, x: number, z: number, giro = 0, esc = 1, y = 0) => { const c = o.clone(true); c.position.set(x, y, z); c.rotation.y = giro; c.scale.setScalar(esc); return sombras(c); };

/** Lugares al azar en un anillo, lejos de una lista de zonas prohibidas. */
export function anillo(r: () => number, n: number, rmin: number, rmax: number, cx: number, cz: number, esc: [number, number], libre: (x: number, z: number) => boolean) {
  const out: [number, number, number, number, number][] = [];
  for (let k = 0; out.length < n && k < n * 40; k++) {
    const a = r() * Math.PI * 2, d = rmin + (rmax - rmin) * Math.sqrt(r()), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    if (libre(x, z)) out.push([x, 0, z, r() * 6.28, esc[0] + r() * (esc[1] - esc[0])]);
  }
  return out;
}

/** Un escenario armado con las piezas comunes: cielo (o fondo), suelo, luces, niebla y lo propio de cada película. */
export function escenario(o: {
  hora: Hora; sol?: THREE.Vector3; colores?: string[] | null; fondo?: string; niebla?: [string, number, number]; exposicion?: number; radio?: number;
  montar: (g: THREE.Group) => Promise<Reparto>;
  animar: (c: ContextoToma, reparto: Reparto, g: THREE.Group) => void;
}): Escenario {
  const g = new THREE.Group();
  let reparto: Reparto = {};
  const sol = o.sol ?? new THREE.Vector3(-0.5, 0.55, -0.65);
  if (o.colores !== null) g.add(cielo(o.hora, sol));
  if (o.colores) g.add(suelo(o.colores));
  g.add(luces(o.hora, sol, o.radio ?? 24));
  return {
    grupo: g,
    fondo: o.fondo ? new THREE.Color(o.fondo) : null,
    niebla: o.niebla ? new THREE.Fog(o.niebla[0], o.niebla[1], o.niebla[2]) : null,
    exposicion: o.exposicion ?? 1,
    async preparar() { reparto = await o.montar(g); for (const a of Object.values(reparto)) g.add(a.raiz); },
    actualizar(c) { animarTodo(g, c.t, c.alto); o.animar(c, reparto, g); },
  };
}

/** Toma sin diálogo. */
export const toma = (id: string, escena: string, dur: number, de: ReturnType<typeof plano>, a?: ReturnType<typeof plano>, extra: Partial<Toma> = {}): Toma =>
  ({ id, escena, dur, cam: { de, a: a ?? de, curva: 'ambas' }, ...extra });

/** Agua de canal o charco: ondas suaves, reflejo del cielo y brillo en las crestas. */
export function agua(ancho: number, largo: number, color = '#3f8fb0') {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uColor: { value: new THREE.Color(color) }, uSube: { value: 0 } },
    vertexShader: `uniform float uT;varying vec2 vUv;varying vec3 vMundo;void main(){vUv=uv;vec3 p=position;p.z+=sin(p.x*3.+uT*2.)*.015+sin(p.y*5.-uT*1.6)*.012;vec4 w=modelMatrix*vec4(p,1.);vMundo=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader: `uniform float uT;uniform vec3 uColor;uniform float uSube;varying vec2 vUv;varying vec3 vMundo;${RUIDO}
      void main(){vec3 v=normalize(cameraPosition-vMundo);float fres=pow(1.-max(v.y,0.),3.);float n=fbm(vec3(vMundo.xz*2.2,uT*.35));
        vec3 c=mix(uColor*.75,vec3(.75,.88,.95),fres*.7)+vec3(1.)*smoothstep(.62,.8,n)*.25+vec3(.6,.95,1.)*uSube*.35;
        float borde=smoothstep(0.,.08,vUv.x)*smoothstep(1.,.92,vUv.x);gl_FragColor=vec4(c,.82*borde+.1);${FIN_FRAG}}`,
    transparent: true, depthWrite: false,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, largo, 24, 48), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.03;
  m.receiveShadow = true;
  m.userData.actualizar = (t: number) => { mat.uniforms.uT.value = t; };
  return m;
}

// ------------------------------------------------------------------ la granja de la tarde (C01 y C11)

/** La parcela de la granja: dos surcos frente a la cabaña, el pozo, la cerca y el monte. Con `canal`, un canal de agua
 * al lado y la entrada de Fuatia (brasa, agua que sube, polvo de tierra y viento que lo junta todo). */
/** Para C10: los dos surcos sanos y otro reparto ([id, quién lo actúa, x, z, mira x, mira z]). */
export interface FinalGranja { reparto: [string, string, number, number, number, number][] }
export function granja(conCanal: boolean, final?: FinalGranja): Escenario {
  const SURCOS: [number, number][] = [[-0.85, 0], [0.85, 0]];
  const CANAL_X = 2.9;
  let escarcha: THREE.Points, entrada: THREE.Group | null = null;
  const efectos: { brasa?: THREE.Group; hilos?: THREE.Points; polvo?: THREE.Points; viento?: THREE.Points; canal?: THREE.Mesh } = {};
  return escenario({
    hora: 'tarde', sol: new THREE.Vector3(-0.7, 0.35, -0.55), colores: ['#6f9a45', '#8bb158', '#5d8a3c', '#a3b862'], niebla: ['#f3dcc0', 45, 260],
    async montar(g) {
      const [monte, cabana, cerca, hierba, praderas, arbusto, parcela, zanahoria, pozo, regadera, reparto] = await Promise.all([
        cargar('granja_monte.glb'), cargar('granja-v2/casita_pueblo.glb'), cargar('granja-v2/cerca.glb'), cargar('granja-v2/maleza_hierba.glb'),
        cargar('granja-v2/flores_pradera.glb'), cargar('granja-v2/arbusto_flores.glb'), cargar('granja-v2/parcela_seca.glb'),
        cargar('granja-v2/zanahoria_1.glb'), cargar('granja-v2/pozo.glb'), cargar('granja-v2/regadera.glb'),
        final
          ? Promise.all(final.reparto.map(([, q]) => q === 'el' || q === 'ella' ? actorPareja(q) : actorVecino(q))).then((as) => Object.fromEntries(final.reparto.map(([id], i) => [id, as[i]])))
          : conCanal
          ? Promise.all([actorPareja('el'), actorPareja('ella'), actorVecino('botanica'), actorDiosa('fuatia')]).then(([el, ella, botanica, fuatia]) => ({ el, ella, botanica, fuatia }))
          : Promise.all([actorPareja('el'), actorPareja('ella'), actorVecino('botanica'), actorVecino('canalizadora_aura')]).then(([el, ella, botanica, eliana]) => ({ el, ella, botanica, canalizadora_aura: eliana })),
      ]);
      const r = azar(conCanal ? 77 : 61);
      const libre = (x: number, z: number) => Math.hypot(x, z) > 7 && !(Math.abs(x) < 6 && z < -5 && z > -14) && !(conCanal && Math.abs(x - CANAL_X) < 1.6);
      const roble = piezaKit(monte, 'roble'), pino = piezaKit(monte, 'pino');
      if (roble) g.add(instanciar(roble, anillo(r, 60, 16, 70, 0, -6, [0.9, 1.5], libre)));
      if (pino) g.add(instanciar(pino, anillo(r, 40, 24, 80, 0, -10, [0.9, 1.6], libre)));
      for (const [clave, n] of [['helecho', 30], ['mata', 40], ['hongo', 14]] as const) { const p = piezaKit(monte, clave); if (p) g.add(instanciar(p, anillo(r, n, 6, 20, 0, 0, [0.8, 1.3], libre))); }
      g.add(instanciar(hierba, anillo(r, 60, 7, 16, 0, 0, [1, 1.6], libre)));
      g.add(instanciar(praderas, anillo(r, 70, 5, 18, 0, 2, [1, 1.6], libre)));
      g.add(instanciar(arbusto, anillo(r, 16, 6, 14, 0, 0, [1, 1.4], libre)));
      g.add(copia(cabana, 0, -9.5, 0, 1.8));
      g.add(copia(pozo, 4.6, -4.2, -0.5, 1.2));
      g.add(copia(regadera, -1.95, -1.5, 0.6, 1.1));
      // La cerca nueva del patio
      const tramos: [number, number, number, number, number][] = [];
      for (let i = 0; i < 7; i++) if (i !== 3) tramos.push([-6.6 + i * 2.2, 0, -4.2, 0, 1]);
      g.add(instanciar(cerca, tramos));
      // Los dos surcos: tierra arada y, en el de la izquierda, los brotes; el de la derecha, la semilla que no despierta
      for (const [x] of SURCOS) for (let k = 0; k < 3; k++) g.add(copia(parcela, x, -1.1 + k * 1.1, 0, 1));
      for (const [sx] of final ? SURCOS : [SURCOS[0]]) for (let k = 0; k < 5; k++) g.add(copia(zanahoria, sx + (k % 2 ? 0.18 : -0.18), -1.4 + k * 0.7, r() * 6, 1.1));
      escarcha = final ? motasFlotantes(120, [0, 0.4, 0], 6, 2.5, [1, 0.9, 0.6], 1.6, 3) : motasFlotantes(70, [SURCOS[1][0], 0.05, 0], 0.55, 0.5, [0.75, 0.88, 1], 1.8, 3);
      g.add(escarcha);
      if (conCanal) {
        efectos.canal = agua(1.5, 26);
        efectos.canal.position.set(CANAL_X, 0.03, 0);
        g.add(efectos.canal);
        for (let k = -6; k <= 6; k++) { const pz = piezaKit(monte, 'piedra_orilla'); if (pz) { g.add(copia(pz, CANAL_X - 0.95, k * 2 + r(), r() * 6, 0.7)); g.add(copia(pz, CANAL_X + 0.95, k * 2 + r(), r() * 6, 0.7)); } }
        const juncos = piezaKit(monte, 'juncos');
        if (juncos) g.add(instanciar(juncos, Array.from({ length: 14 }, (_, i) => [CANAL_X + (i % 2 ? 1.2 : -1.2), 0, -10 + i * 1.6 + r(), r() * 6, 0.9 + r() * 0.4] as [number, number, number, number, number])));
        // La entrada de Fuatia: brasa, hilos de agua, polvo dorado y viento que lo junta todo
        entrada = new THREE.Group();
        entrada.position.set(CANAL_X - 0.2, 0, 0.4);
        efectos.brasa = fogata(0.45, 9);
        const rr = azar(88);
        efectos.hilos = puntosSuaves(240, (i, pos, col, tam, fase) => { pos.set([rr() * 6.28, rr(), rr()], i * 3); col.set([0.55, 0.9, 1], i * 3); tam[i] = 2 + rr() * 2.5; fase[i] = rr(); },
          'float a=position.x+uT*1.6;float h=position.y*2.2*uSube;float rad=(.9-uJunta*.6)*(1.-position.y*.3);p=vec3(cos(a)*rad,h,sin(a)*rad);brillo=uSube*(1.-position.y*.4);', { uSube: { value: 0 }, uJunta: { value: 0 } });
        efectos.polvo = puntosSuaves(200, (i, pos, col, tam, fase) => { pos.set([(rr() - 0.5) * 3, rr() * 0.3, (rr() - 0.5) * 3], i * 3); col.set([1, 0.82, 0.45], i * 3); tam[i] = 1.6 + rr() * 2; fase[i] = rr() * 6.28; },
          'p=mix(position,vec3(sin(uT*2.+aFase)*.4,1.+sin(aFase*3.)*.5,cos(uT*2.+aFase)*.4),uJunta);p.y+=sin(uT+aFase)*.1*uPolvo;brillo=uPolvo;', { uPolvo: { value: 0 }, uJunta: { value: 0 } });
        efectos.viento = puntosSuaves(160, (i, pos, col, tam, fase) => { pos.set([rr() * 6.28, rr() * 2.2, 1.6 + rr() * 1.4], i * 3); col.set([0.92, 0.98, 1], i * 3); tam[i] = 1.2 + rr() * 1.5; fase[i] = rr(); },
          'float a=position.x+uT*(2.5+aFase*2.);float rad=position.z*(1.-uJunta*.75);p=vec3(cos(a)*rad,position.y*(1.-uJunta*.4)+.2,sin(a)*rad);brillo=uViento;', { uViento: { value: 0 }, uJunta: { value: 0 } });
        entrada.add(efectos.brasa, efectos.hilos, efectos.polvo, efectos.viento);
        g.add(entrada);
      }
      const reparto2 = reparto as Reparto;
      if (final) for (const [id, , x, z, mx, mz] of final.reparto) colocar(reparto2[id], x, z, mx, mz);
      else if (conCanal) {
        colocar(reparto2.el, -0.5, -0.6, 2.7, 0.4);
        colocar(reparto2.ella, -0.9, 0.9, 2.7, 0.4);
        colocar(reparto2.botanica, -0.1, 2.3, 2.7, 0.4);
        colocar(reparto2.fuatia, CANAL_X - 0.2, 0.4, -1, 1, 0.35);
        reparto2.fuatia.raiz.visible = false;
      } else {
        colocar(reparto2.el, -2.1, 0.7, 0, 0);
        colocar(reparto2.ella, -1.6, 2.1, 0, 0);
        colocar(reparto2.botanica, 2.0, 0.9, 0.85, 0);
        colocar(reparto2.canalizadora_aura, 1.5, -1.6, 0, 0);
      }
      return reparto2;
    },
    animar(c, reparto) {
      const id = c.toma.id;
      // La escarcha de la semilla que no despierta se nota más cuando hablan del frío
      const frio = id.startsWith('C01_6') || id.startsWith('C01_8') ? 1 : 0.45;
      escarcha.userData.manual = false;
      (escarcha.material as THREE.ShaderMaterial).uniforms.uAlfa.value = frio;
      if (conCanal && entrada) {
        const e = c.desde('c11_entrada');
        const dur = c.duracion('c11_entrada') || 10;
        const u = e / dur;
        const sube = paso(0.15, 0.35, u), junta = paso(0.55, 0.85, u), polvo = paso(0.3, 0.5, u), viento = paso(0.45, 0.65, u);
        const apagar = 1 - paso(0.85, 1, u);
        efectos.brasa!.visible = u > 0 && u < 1;
        if (efectos.brasa!.visible) efectos.brasa!.userData.actualizar(c.t, c.alto);
        const uH = (efectos.hilos!.material as THREE.ShaderMaterial).uniforms; uH.uSube.value = e > 0 ? sube * apagar : 0; uH.uJunta.value = junta;
        const uP = (efectos.polvo!.material as THREE.ShaderMaterial).uniforms; uP.uPolvo.value = e > 0 ? polvo * apagar : 0; uP.uJunta.value = junta;
        const uV = (efectos.viento!.material as THREE.ShaderMaterial).uniforms; uV.uViento.value = e > 0 ? viento * apagar : 0; uV.uJunta.value = junta;
        for (const m of [efectos.hilos!, efectos.polvo!, efectos.viento!]) { const uu = (m.material as THREE.ShaderMaterial).uniforms; uu.uT.value = c.t; uu.uEscala.value = c.alto / 720; }
        (efectos.canal!.material as THREE.ShaderMaterial).uniforms.uSube.value = e > 0 ? sube * apagar : 0;
        const f = reparto.fuatia;
        const aparece = e > 0 ? paso(0.75, 1, u) : 0;
        f.raiz.visible = aparece > 0.01 || e > dur;
        const k = e > dur ? 1 : aparece;
        f.raiz.scale.setScalar(0.35 + k * 0.65);
        f.raiz.position.y = 0.35 + Math.sin(c.t * 1.3) * 0.06;
        if (f.halo) { f.halo.material.opacity = 0.2 + 0.15 * Math.sin(c.t * 0.9); f.halo.material.color.setHSL((c.t * 0.05) % 1, 0.6, 0.75); }
      }
      actuarDialogo(reparto, c);
    },
  });
}

/** Lo que tapa en la granja: la cabaña, la cerca del patio, el pozo y la regadera. */
const OBST_GRANJA: [number, number, number][] = [[0, -9.5, 4.6], [4.6, -4.2, 1.3], [-1.95, -1.5, 0.45], ...Array.from({ length: 13 }, (_, i) => [-6.6 + i * 1.1, -4.2, 0.45] as [number, number, number])];
const SURCO_DETALLE = plano([1.25, 0.42, 2.6], [0.85, 0.05, 0.1], 34);
const SURCO_DETALLE_B = plano([1.05, 0.36, 1.85], [0.85, 0.02, 0.0], 30);

export const C01: Guion = (() => {
  const L = LINEAS_CAMPANA.C01;
  const puestos: Record<string, Puesto> = { el: { x: -2.1, z: 0.7 }, ella: { x: -1.6, z: 2.1 }, botanica: { x: 2.0, z: 0.9 }, canalizadora_aura: { x: 1.5, z: -1.6 } };
  const dialogo = tomasDialogo(L.slice(1, -1), { escena: 'granja', puestos, centro: [0, 0.5], semilla: 11, prefijo: 'C01', bloom: 0.45, obstaculos: OBST_GRANJA, audiencia: [0, 1] });
  const tomas: Toma[] = [
    toma('c01_abre', 'granja', 6, plano([14, 9, 22], [0, 0.5, 0], 38), plano([6, 3.2, 9], [0, 0.4, 0], 36), { musica: 'M01', entra: { color: '#000', dur: 2.4 }, bloom: 0.5 }),
    { ...toma('c01_semilla', 'granja', 6, SURCO_DETALLE, SURCO_DETALLE_B), linea: L[0], bloom: 0.5 },
    ...dialogo,
    { ...toma('c01_cierre', 'granja', 7, plano([3.5, 2.4, 7.5], [0, 0.6, 0], 38), plano([9, 6, 16], [0, 0.8, -2], 40)), linea: L[L.length - 1], bloom: 0.55 },
    toma('c01_titulo', 'granja', 5, plano([9, 6, 16], [0, 0.8, -2], 40), plano([12, 8, 20], [0, 1, -3], 40), { titulo: { grande: 'Dos surcos', chico: 'Capítulo I' }, sale: { color: '#000', dur: 2 } }),
  ];
  return { id: 'C01', nombre: 'Dos surcos', fov: 38, tomas, escenarios: { granja: () => granja(false) } };
})();

export const C11: Guion = (() => {
  const L = LINEAS_CAMPANA.C11;
  const [nEntrada, fEntrada] = LINEAS_C11_FUATIA;
  const puestos: Record<string, Puesto> = { el: { x: -0.5, z: -0.6 }, ella: { x: -0.9, z: 0.9 }, botanica: { x: -0.1, z: 2.3 }, fuatia: { x: 2.7, z: 0.4, cabeza: 1.3 } };
  const tomas: Toma[] = [
    toma('c11_abre', 'granja', 5, plano([10, 5, 12], [2.9, 0.3, 0], 38), plano([6.5, 2.4, 6.5], [2.9, 0.3, 0], 36), { musica: 'M23', entra: { color: '#000', dur: 2 }, bloom: 0.5 }),
    { ...toma('c11_agua', 'granja', 5, plano([4.6, 0.8, 4.2], [2.9, 0.05, 0], 36), plano([4.2, 0.7, 3.2], [2.9, 0.05, 0], 32)), linea: L[0], bloom: 0.55 },
    { ...toma('c11_entrada', 'granja', 10, plano([2.9, 0.9, 5.2], [2.7, 0.6, 0.4], 40), plano([2.6, 1.2, 4.0], [2.7, 1.1, 0.4], 36)), linea: nEntrada, bloom: 1.05 },
    { ...toma('c11_fuatia', 'granja', 4, plano([1.1, 1.6, 2.7], [2.7, 1.3, 0.4], 32), plano([1.3, 1.55, 2.4], [2.7, 1.3, 0.4], 30)), linea: fEntrada, bloom: 0.9 },
    ...tomasDialogo(L.slice(1, -1), { escena: 'granja', puestos, centro: [0.6, 1.2], semilla: 23, prefijo: 'C11', bloom: 0.6, obstaculos: OBST_GRANJA, audiencia: [-0.2, 1] }),
    { ...toma('c11_cierre', 'granja', 7, plano([-3, 2, 6], [1, 0.4, 0.6], 38), plano([-7, 5, 13], [1, 0.6, 0], 40)), linea: L[L.length - 1], bloom: 0.55 },
    toma('c11_titulo', 'granja', 5, plano([-7, 5, 13], [1, 0.6, 0], 40), plano([-9, 7, 17], [1, 1, -1], 40), { titulo: { grande: 'El agua que escucha', chico: 'Fuatia' }, sale: { color: '#000', dur: 2 } }),
  ];
  return { id: 'C11', nombre: 'El agua que escucha', fov: 38, tomas, escenarios: { granja: () => granja(true) } };
})();

// ------------------------------------------------------------------ SC0 · La Noche Eterna

/** La terraza del castillo de Valdemora, de noche: el trono, las columnas y la luna que se mancha de rojo. */
function castillo(): Escenario {
  let luna: THREE.Mesh, ceniza: THREE.Points, frio: THREE.Points;
  const cieloM = cielo('noche', new THREE.Vector3(0.1, 0.32, -0.95));
  return {
    ...(() => {
      const e = escenario({
        hora: 'noche', sol: new THREE.Vector3(0.1, 0.4, -0.9), colores: null, fondo: '#05050c', niebla: ['#0b0814', 14, 70], exposicion: 1.05, radio: 14,
        async montar(g) {
          g.add(cieloM);
          const [kit, utileria, conde] = await Promise.all([
            cargar('sangre/bioma_castillo.glb'), cargar('granja_cria.glb'),
            actorVestido('el', { piel: '#e7c2a6', pelo: '#6b6460', detalles: { ojos: '#4a3a3a' } }, {
              pelo: piezaRopa('pelo_lado', 'pelo'), cara: piezaRopa('bigote', 'cara'), cabeza: piezaRopa('corona', 'cabeza'),
              arriba: piezaRopa('sangre_monarca', 'arriba', {}, ['abajo']), espalda: piezaRopa('capa', 'espalda', { principal: '#5a1424', broche: '#d9b45a' }), pies: piezaRopa('botas', 'pies'),
            }),
          ]);
          // Piso de losas y la baranda de columnas mirando al reino
          for (let x = -4; x <= 4; x++) for (let z = -4; z <= 3; z++) g.add(poner(kit, ['piso_a', 'piso_b', 'piso_c', 'piso_e'][(x * 7 + z * 3 + 40) % 4], x * 2, z * 2, 0, 1, 0, false));
          for (let x = -4; x <= 4; x += 2) g.add(poner(kit, 'deco_columna_marmol', x * 2, -8.6));
          for (const z of [-6, -2, 2]) { g.add(poner(kit, 'deco_columna_marmol', -8.6, z)); g.add(poner(kit, 'deco_columna_marmol', 8.6, z)); }
          g.add(poner(kit, 'deco_gargola', -6, -8.7, 0, 1.1), poner(kit, 'deco_gargola', 6, -8.7, 0, 1.1));
          g.add(poner(kit, 'deco_alfombra', 0, 0.8, 0, 1.6), poner(kit, 'deco_alfombra', 0, 4, 0, 1.6));
          g.add(poner(kit, 'deco_trono', 0, -2.4, 0, 1.3));
          g.add(poner(kit, 'deco_mesa_banquete', 3.6, 0.5, Math.PI / 2, 1.1), poner(kit, 'deco_jarron', 5, -2.8), poner(kit, 'deco_reloj', -5.2, -3.5, 0.4));
          g.add(poner(kit, 'deco_estandarte', -2.4, -3.6), poner(kit, 'deco_estandarte', 2.4, -3.6), poner(kit, 'deco_retrato', -4.4, -3.9, 0.3));
          for (const [x, z] of [[-1.6, -1.6], [1.6, -1.6], [-3.4, 2], [3.4, 2.4]] as const) {
            g.add(poner(kit, 'luz_candelabro', x, z));
            const l = luzCalida('#ffb06a', 1.6, 6); l.position.set(x, 1.6, z); g.add(l);
          }
          // La luna (encima de las montañas del reino) y la ceniza que baja de las estrellas
          luna = new THREE.Mesh(new THREE.SphereGeometry(7, 32, 16), new THREE.MeshBasicMaterial({ color: '#e8ecff', fog: false }));
          luna.position.set(-24, 26, -120);
          g.add(luna);
          const h = halo('#c9d4ff', 60); h.position.copy(luna.position); h.material.opacity = 0.35; luna.userData.halo = h; g.add(h);
          const r = azar(3);
          ceniza = puntosSuaves(260, (i, pos, col, tam, fase) => { pos.set([(r() - 0.5) * 0.8, r() * 9, (r() - 0.5) * 0.8], i * 3); col.set([0.62, 0.6, 0.72], i * 3); tam[i] = 2 + r() * 2.5; fase[i] = r(); },
            'float h=mod(position.y-uT*2.2,9.);p=vec3(position.x*(.2+h*.15),h,position.z*(.2+h*.15))+uCentro;brillo=uCeniza*smoothstep(0.,.6,h);', { uCeniza: { value: 0 }, uCentro: { value: new THREE.Vector3(0, 1.4, -1.2) } });
          frio = motasFlotantes(160, [0, 0.4, -1.5], 3.5, 3, [0.55, 0.65, 1], 2, 21);
          g.add(ceniza, frio);
          colocar(conde, 0, -1.6, 0, 5);
          // La copa con la ceniza de estrella muerta, en la mano del Conde
          const copa = poner(utileria, 'copa_conde', 0, 0, 0, 1, 0, false);
          // (el hueso «comida» es el que lleva lo que se come a la boca: así la copa sube cuando bebe)
          const mano = conde.p.huesos.get('comida') ?? conde.p.huesos.get('manoR');
          if (mano) { mano.add(copa); copa.position.set(0, 0, 0); copa.rotation.x = -0.5; copa.scale.setScalar(COPA_ESCALA); }
          return { conde };
        },
        animar(c, reparto) {
          const { conde } = reparto;
          const id = c.toma.id;
          const bebe = c.desde('sc0_bebe');
          const rojo = paso(1.5, 4.5, bebe);
          (luna.material as THREE.MeshBasicMaterial).color.setRGB(0.91 - rojo * 0.1, 0.93 - rojo * 0.72, 1 - rojo * 0.78);
          (luna.userData.halo as THREE.Sprite).material.color.setRGB(0.8 + rojo * 0.2, 0.83 - rojo * 0.6, 1 - rojo * 0.7);
          const uC = (ceniza.material as THREE.ShaderMaterial).uniforms;
          uC.uT.value = c.t; uC.uEscala.value = c.alto / 720;
          uC.uCeniza.value = bebe > -1 ? paso(-1, 0.6, bebe) * (1 - paso(3, 4.5, bebe)) : 0;
          (frio.material as THREE.ShaderMaterial).uniforms.uAlfa.value = id.startsWith('SC0_NG') || id === 'sc0_trato' ? 1 : bebe > 0 ? 0.6 : 0.15;
          if (id === 'sc0_bebe') actuar(conde, c.local < 1.5 ? 'regalo' : c.local < 4 ? 'comer_a' : 'presumir_a', c.local < 4 ? 'normal' : 'enojado');
          else if (c.toma.linea?.quien === 'conde') hablar(conde, c, id === 'sc0_c1' ? 'triste' : 'pensando', 'normal');
          else if (id === 'sc0_trato' || c.toma.linea?.quien === 'nathgora') actuar(conde, 'boca_abierta', 'sorprendido');
          else actuar(conde, 'triste_b', 'triste');
          conde.p.update(c.dt);
        },
      });
      return e;
    })(),
  };
}

/** La casa de noche: Javier y Laura en el patio mirando la constelación que parpadea. */
function hogarNoche(): Escenario {
  let constelacion: THREE.Group;
  return escenario({
    hora: 'noche', sol: new THREE.Vector3(0.4, 0.5, -0.7), colores: ['#24361f', '#2c4226', '#1e2e1a'], niebla: ['#0b1024', 30, 160], exposicion: 1.15,
    async montar(g) {
      const [cabana, farol, monte, el, ella] = await Promise.all([cargar('granja-v2/casita_pueblo.glb'), cargar('granja-v2/farol.glb'), cargar('granja_monte.glb'), actorPareja('el'), actorPareja('ella')]);
      g.add(copia(cabana, 0, -6, 0, 1.8), copia(farol, 2.4, -1.6, 0, 1.1));
      const l = luzCalida('#ffc27a', 2, 8); l.position.set(2.4, 2.2, -1.6); g.add(l);
      const r = azar(5);
      const roble = piezaKit(monte, 'roble');
      if (roble) g.add(instanciar(roble, anillo(r, 40, 14, 60, 0, -6, [1, 1.5], (x, z) => Math.hypot(x, z + 2) > 9)));
      constelacion = constelacionAmantes();
      constelacion.userData.manual = true;
      g.add(constelacion);
      colocar(el, -0.45, 1.2, -0.45, -20);
      colocar(ella, 0.45, 1.2, 0.45, -20);
      return { el, ella };
    },
    animar(c, reparto) {
      const t = c.desde('sc0_cielo');
      const parpadeo = t > 1.5 && t < 4.5 ? 0.25 + 0.75 * Math.abs(Math.sin(t * 9)) * (Math.sin(t * 3) > 0 ? 0.2 : 1) : 1;
      constelacion.userData.actualizar(c.t, c.alto, parpadeo);
      const l = c.toma.linea;
      for (const [k, a] of Object.entries(reparto)) {
        if (l?.quien === k) hablar(a, c, k === 'el' ? 'senalar_arriba' : 'boca_abierta', 'normal');
        else actuar(a, c.toma.id === 'sc0_cielo' ? 'boca_abierta' : 'reposo', c.toma.id === 'sc0_cielo' ? 'sorprendido' : 'normal');
        a.p.update(c.dt);
      }
    },
  });
}

/** El altar de Lara en el pueblo, de noche, con velas: Serena pide ayuda. */
function altarLara(): Escenario {
  return escenario({
    hora: 'noche', sol: new THREE.Vector3(-0.3, 0.6, -0.7), colores: ['#2c3a28', '#334430', '#283423'], niebla: ['#0d1026', 18, 120], exposicion: 1.2,
    async montar(g) {
      const [edif, castillo, serena] = await Promise.all([cargar('granja_edificios.glb'), cargar('sangre/bioma_castillo.glb'), actorVecino('canalizadora_lara')]);
      g.add(poner(edif, 'altar_lara', 0, -3.2, 0, 1));
      for (const [x, z] of [[-1.4, -0.6], [1.4, -0.6], [-0.7, 0.2], [0.7, 0.2]] as const) {
        g.add(poner(castillo, 'luz_vela', x, z, 0, 0.7));
        const l = luzCalida('#ffcf8a', 1.1, 5); l.position.set(x, 0.9, z); g.add(l);
      }
      const velo = motasFlotantes(90, [0, 0.6, -0.8], 2.6, 2.6, [0.78, 0.7, 1], 2, 9);
      g.add(velo);
      colocar(serena, 0, 0.9, 0, 6);
      return { canalizadora_lara: serena };
    },
    animar(c, reparto) { hablar(reparto.canalizadora_lara, c, 'suplicar', 'triste'); reparto.canalizadora_lara.p.update(c.dt); },
  });
}

/** Tamaño de la copa en el hueso de la mano (el muñeco viene escalado). */
const COPA_ESCALA = 2.4;
export const SC0: Guion = (() => {
  const [n1, c1, ng1, c2, ng2, n2, e1, l1, s1] = LINEAS_SC0;
  const tomas: Toma[] = [
    { ...toma('sc0_abre', 'castillo', 7, plano([0, 6, 18], [0, 4, -40], 40), plano([0, 2.4, 8], [0, 1.2, -2], 38), { musica: 'sangre-noche', entra: { color: '#000', dur: 3 }, bloom: 0.8 }), linea: n1 },
    { ...toma('sc0_c1', 'castillo', 4, plano([2.9, 1.5, 2.2], [0, 0.85, -1.6], 30), plano([2.5, 1.4, 1.6], [0, 0.85, -1.6], 30)), linea: c1, bloom: 0.7 },
    { ...toma('sc0_trato', 'castillo', 6, plano([-3.4, 2.0, -4.8], [0, 0.9, -1.6], 36), plano([-3.0, 1.7, -4.2], [0, 0.9, -1.6], 34)), linea: ng1, bloom: 0.9 },
    { ...toma('sc0_c2', 'castillo', 3, plano([-2.2, 1.35, 1.6], [0, 0.85, -1.6], 30)), linea: c2, bloom: 0.7 },
    { ...toma('sc0_ng2', 'castillo', 3, plano([0, 3, 4], [0, 1.2, -1.6], 40), plano([0, 2.6, 3], [0, 1.2, -1.6], 38)), linea: ng2, bloom: 1 },
    { ...toma('sc0_bebe', 'castillo', 9, plano([3.0, 1.6, 2.4], [0, 0.95, -1.6], 34), plano([0, 4.5, 9], [-8, 10, -60], 42)), linea: n2, bloom: 1.2 },
    { ...toma('sc0_cielo', 'hogar', 7, plano([0.6, 0.45, 6.2], [0, 11, -30], 46), plano([0.4, 0.5, 5.6], [0, 14, -30], 46)), linea: e1, bloom: 0.9 },
    { ...toma('sc0_el', 'hogar', 3.5, plano([0.6, 1.25, -2.4], [-0.2, 0.95, 1.2], 34), plano([0.4, 1.2, -2.1], [-0.25, 0.95, 1.2], 33)), linea: l1, bloom: 0.8 },
    { ...toma('sc0_serena', 'altar', 9, plano([0, 1.6, 6.5], [0, 1.1, 0.9], 36), plano([0, 1.2, 3.6], [0, 1.0, 0.9], 32)), linea: s1, bloom: 0.85 },
    toma('sc0_titulo', 'altar', 5, plano([0, 1.2, 3.6], [0, 1.0, 0.9], 32), plano([0, 3, 9], [0, 2, -3], 40), { titulo: { grande: 'La Noche Eterna', chico: 'Sangre y Ceniza' }, sale: { color: '#000', dur: 2.2 }, bloom: 0.9 }),
  ];
  return { id: 'SC0', nombre: 'La Noche Eterna', fov: 38, tomas, escenarios: { castillo, hogar: hogarNoche, altar: altarLara } };
})();

// ------------------------------------------------------------------ la plaza del Pueblo del Sol (C02 y la fiesta de Eliana)

const FAROLES_PLAZA = [[-6, 2], [6, -2], [-4, 11], [5, 12], [-7, -6]] as const;
/** Lo que tapa en la plaza: la posada, la fuente, los puestos, el altar de Aura, los faroles y los árboles. */
const OBST_PLAZA: [number, number, number][] = [[0, -15.5, 6.5], [0, 4, 3.0], [8, 2, 1.6], [8, 6.5, 1.6], [-10, -1, 2.8], [-12, 8, 2], [12, 11, 2], ...FAROLES_PLAZA.map(([x, z]) => [x, z, 0.4] as [number, number, number])];
function plaza(fiesta: boolean): Escenario {
  const extras: { fuegos: THREE.Group[]; aura?: Actor } = { fuegos: [] };
  return escenario({
    hora: fiesta ? 'noche' : 'tarde', sol: fiesta ? new THREE.Vector3(0.3, 0.5, -0.8) : new THREE.Vector3(-0.8, 0.32, -0.5),
    colores: fiesta ? ['#6f6a58', '#7a735f', '#655f50'] : ['#b8ab8c', '#c4b799', '#a99c80', '#7fa25a'], niebla: fiesta ? ['#120f22', 25, 130] : ['#e8b98f', 40, 200], exposicion: fiesta ? 1.2 : 1, radio: 26,
    async montar(g) {
      const [pueblo, edif, muebles, festivales, monte, reparto] = await Promise.all([
        cargar('granja_pueblo.glb'), cargar('granja_edificios.glb'), cargar('granja_muebles.glb'), cargar('granja_festivales.glb'), cargar('granja_monte.glb'),
        fiesta
          ? Promise.all([actorVecino('canalizadora_aura'), actorVecino('nina'), actorPareja('el'), actorPareja('ella'), actorDiosa('aura')]).then(([eliana, nina, el, ella, aura]) => ({ canalizadora_aura: eliana, nina, el, ella, aura }))
          : Promise.all([actorVecino('canalizadora_lara'), actorVecino('vigilia_azucena'), actorVecino('cuidadora'), actorPareja('el'), actorPareja('ella')]).then(([serena, azucena, mara, el, ella]) => ({ canalizadora_lara: serena, vigilia_azucena: azucena, cuidadora: mara, el, ella })),
      ]);
      // La plaza: la fuente al centro, la posada al fondo, el altar de Aura, puestos, bancos y faroles
      g.add(poner(pueblo, 'fuente', 0, 4, 0, 1));
      g.add(poner(edif, 'edificio_posada_10x8', 0, -15.5, 0, 1));
      g.add(poner(edif, 'altar_aura', -10, -1, Math.PI / 2, 0.9));
      g.add(poner(pueblo, 'puesto_mercado_verde', 8, 2, -Math.PI / 2), poner(pueblo, 'puesto_mercado_mostaza', 8, 6.5, -Math.PI / 2));
      g.add(poner(pueblo, 'banco', -4.5, 7.5, 0.3), poner(pueblo, 'banco', 4.5, 9, -0.4));
      for (const [x, z] of FAROLES_PLAZA) {
        g.add(poner(pueblo, 'farol', x, z));
        const l = luzCalida('#ffc27a', fiesta ? 2.2 : 0.8, 9); l.position.set(x, 2.8, z); g.add(l);
      }
      for (const [x, z] of [[-12, 8], [12, 11], [-13, -9], [13, -8]] as const) g.add(poner(pueblo, Math.abs(x + z) % 2 ? 'arbol_a' : 'arbol_b', x, z));
      g.add(poner(pueblo, 'jardinera', -2.8, -3.6), poner(pueblo, 'jardinera', 2.8, -3.6), poner(pueblo, 'maceta_grande', -5.2, -4.5));
      const r = azar(fiesta ? 9 : 4);
      const roble = piezaKit(monte, 'roble');
      if (roble) g.add(instanciar(roble, anillo(r, 40, 22, 70, 0, 0, [1, 1.5], () => true)));
      // La mesa de la posada, afuera, con sus cosas y la campana
      g.add(poner(pueblo, 'mesa_posada', 2.6, -3.4, 0, 1));
      if (!fiesta) {
        g.add(poner(muebles, 'pieza_campana_turno', 2.6, -3.4, 0.3, 1.3, 0.93, false));
        g.add(poner(muebles, 'canasta_frutas', 1.8, -3.6, 0, 0.8, 0.93, false), poner(muebles, 'jarron_flores', 3.4, -3.2, 0, 0.7, 0.93, false));
      } else {
        // La Fiesta del Despertar Dorado: el arco de primavera, las cintas, el centro de mesa y dos fogatas
        g.add(poner(festivales, 'arco_primavera', 0, 9.5, 0, 1.2), poner(festivales, 'centro_primavera', 2.6, -3.4, 0, 0.9, 0.93, false));
        for (const [x, z, giro] of [[-3, 1, 0.2], [3, 1, -0.2], [0, -1.5, 0]] as const) g.add(poner(festivales, 'tira_primavera', x, z, giro, 1.2, 2.6, false));
        for (const [x, z] of [[4.6, 1.4], [-4.2, 0.6]] as const) { const f = fogata(1, Math.round(x * 10)); f.position.set(x, 0, z); g.add(f); extras.fuegos.push(f); }
        // El rito enorme de Eliana frente al altar: muchas velas
        const castillo = await cargar('sangre/bioma_castillo.glb');
        for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI - Math.PI / 2; g.add(poner(castillo, 'luz_vela', -7.6 + Math.cos(a) * 1.6, -1 + Math.sin(a) * 1.6, 0, 0.6)); }
        const l = luzCalida('#ffcf8a', 2.4, 8); l.position.set(-7.6, 1.2, -1); g.add(l);
      }
      const rp = reparto as Reparto;
      if (fiesta) {
        colocar(rp.canalizadora_aura, -6.0, -0.6, 0, 0);
        colocar(rp.nina, -4.0, 1.4, -6.0, -0.6);
        colocar(rp.el, 1.2, -2.2, -2, 0);
        colocar(rp.ella, -0.9, -0.2, -2, 0);
        colocar(rp.aura, 4.6, 2.6, -2, 0, 0.6);
        extras.aura = rp.aura;
      } else {
        colocar(rp.canalizadora_lara, 2.6, -5.0, 2.6, -3.4);
        colocar(rp.el, 0.9, -3.0, 2.6, -3.4);
        colocar(rp.ella, 1.3, -1.8, 2.6, -3.4);
        colocar(rp.vigilia_azucena, 4.3, -2.2, 2.6, -3.4);
        colocar(rp.cuidadora, 4.0, -4.6, 2.6, -3.4);
      }
      return rp;
    },
    animar(c, reparto) {
      if (fiesta && extras.aura) {
        const a = c.desde('ELI_aura');
        const ve = paso(0, 2.5, a);
        extras.aura.raiz.visible = ve > 0.01;
        extras.aura.raiz.scale.setScalar(0.4 + ve * 0.6);
        extras.aura.raiz.position.y = 0.6 + Math.sin(c.t * 1.4) * 0.08;
        if (extras.aura.halo) extras.aura.halo.material.opacity = 0.25 * ve;
      }
      // La campana de C02 suena al final: la cámara se acerca y todos la miran
      actuarDialogo(reparto, c, {}, fiesta ? { nina: 'triste_b' } : {});
    },
  });
}

export const C02: Guion = (() => {
  const L = LINEAS_CAMPANA.C02;
  const puestos: Record<string, Puesto> = { canalizadora_lara: { x: 2.6, z: -5.0 }, el: { x: 0.9, z: -3.0 }, ella: { x: 1.3, z: -1.8 }, vigilia_azucena: { x: 4.3, z: -2.2 }, cuidadora: { x: 4.0, z: -4.6 } };
  const tomas: Toma[] = [
    toma('c02_abre', 'plaza', 6, plano([-8, 6, 16], [1, 1, -3], 40), plano([-3, 2.6, 6], [2.4, 0.9, -3.4], 38), { musica: 'M10', entra: { color: '#000', dur: 2.2 }, bloom: 0.55 }),
    ...tomasDialogo(L.slice(0, -1), { escena: 'plaza', puestos, centro: [2.6, -3.4], semilla: 31, prefijo: 'C02', bloom: 0.5, obstaculos: OBST_PLAZA, bajos: [[2.6, -3.4, 1.4]], audiencia: [0.15, 1] }),
    { ...toma('c02_campana', 'plaza', 7, plano([3.3, 1.35, -2.6], [2.6, 1.05, -3.4], 28), plano([5.5, 3, 2.5], [2.6, 0.9, -3.4], 40)), linea: L[L.length - 1], bloom: 0.6 },
    toma('c02_titulo', 'plaza', 5, plano([5.5, 3, 2.5], [2.6, 0.9, -3.4], 40), plano([7, 5, 7], [2, 1, -4], 40), { titulo: { grande: 'La campana y la mesa', chico: 'Capítulo III' }, sale: { color: '#000', dur: 2 } }),
  ];
  return { id: 'C02', nombre: 'La campana y la mesa', fov: 38, tomas, escenarios: { plaza: () => plaza(false) } };
})();

export const ELIANA: Guion = (() => {
  const L = LINEAS_ELIANA;
  const puestos: Record<string, Puesto> = { canalizadora_aura: { x: -6.0, z: -0.6 }, nina: { x: -4.0, z: 1.4, cabeza: 0.85 }, el: { x: 1.2, z: -2.2 }, ella: { x: -0.9, z: -0.2 }, aura: { x: 4.6, z: 2.6, cabeza: 1.7 } };
  const d = (desde: number, hasta: number, pref: string, sem: number) => tomasDialogo(L.slice(desde, hasta), { escena: 'plaza', puestos, centro: [-1, 0], semilla: sem, prefijo: pref, bloom: 0.75, obstaculos: [...OBST_PLAZA, [4.6, 1.4, 0.8], [-4.2, 0.6, 0.8], [-7.6, -1, 1.8]], bajos: [[2.6, -3.4, 1.4]], audiencia: [0.3, 1] });
  const tomas: Toma[] = [
    { ...toma('ELI_abre', 'plaza', 7, plano([0, 7, 20], [0, 1.5, 0], 40), plano([-2, 3, 9], [-4, 1, -1], 38), { musica: 'M02', entra: { color: '#000', dur: 2.2 }, bloom: 0.9 }), linea: L[0] },
    ...d(1, 3, 'ELI_a', 41),
    { ...toma('ELI_mira', 'plaza', 5, plano([-2.2, 1.7, 3.4], [-6.0, 1.1, -0.6], 34), plano([-1.6, 1.4, 4.4], [-4.0, 0.9, 1.4], 32)), linea: L[3], bloom: 0.8 },
    ...d(4, 7, 'ELI_b', 43),
    { ...toma('ELI_aura', 'plaza', 6, plano([0.4, 2.0, 8.4], [4.6, 1.7, 2.6], 36), plano([1.8, 1.9, 7.6], [4.6, 1.8, 2.6], 32)), linea: L[7], bloom: 1.05 },
    ...d(8, 10, 'ELI_c', 47),
    toma('ELI_titulo', 'plaza', 5, plano([0, 4, 12], [0, 1.4, 0], 40), plano([0, 7, 18], [0, 2, -2], 40), { titulo: { grande: 'El brote que puede esperar', chico: 'Eliana, Santa de Aura' }, sale: { color: '#000', dur: 2 }, bloom: 0.9 }),
  ];
  return { id: 'ELI', nombre: 'El brote que puede esperar', fov: 38, tomas, escenarios: { plaza: () => plaza(true) } };
})();

// ------------------------------------------------------------------ SC1 · Las Afueras

/** El cementerio hundido de noche: niebla, lápidas, la grieta de luz negra, un alma y el grifo que baja por la luz. */
function cementerio(): Escenario {
  let grieta: THREE.Mesh, alma: THREE.Group, haz: THREE.Mesh, grifo: THREE.Object3D, almas: THREE.Points;
  return escenario({
    hora: 'noche', sol: new THREE.Vector3(0.4, 0.55, 0.7), colores: ['#3a3f3a', '#424840', '#363a34'], niebla: ['#1c2030', 9, 55], exposicion: 1.45, radio: 16,
    async montar(g) {
      const [kit, grifoM, el, ella, serena] = await Promise.all([cargar('sangre/bioma_cementerio.glb'), cargar('granja-v3/grifo.glb'), actorPareja('el'), actorPareja('ella'), actorVecino('canalizadora_lara')]);
      const r = azar(17);
      const lapidas = ['deco_lapida_redonda', 'deco_lapida_gotica', 'deco_lapida_recta', 'deco_lapida_cruz', 'deco_lapida_rota', 'deco_cruz_torcida'];
      for (let i = 0; i < 46; i++) {
        const a = r() * Math.PI * 2, d = 4 + r() * 16, x = Math.cos(a) * d, z = Math.sin(a) * d - 2;
        if (Math.abs(x) < 3 && z > -5 && z < 4) continue;
        g.add(poner(kit, lapidas[i % lapidas.length], x, z, r() * 0.6 - 0.3 + (z > 0 ? Math.PI : 0)));
      }
      g.add(poner(kit, 'deco_mausoleo', -6, -8, 0.4, 1.3), poner(kit, 'deco_angel', 5, -6, -0.5, 1.1), poner(kit, 'deco_arbol_seco', -3.6, -5.5, 0, 1.4), poner(kit, 'deco_arbol_seco', 6, 3, 1.2, 1.2));
      g.add(poner(kit, 'deco_reja', 0, 9, 0, 1.4), poner(kit, 'deco_charco', 1.6, 1.2), poner(kit, 'deco_raices', -1.8, -2.4), poner(kit, 'deco_hongos', 2.2, -1.8));
      for (const [x, z] of [[-3, 2], [3.4, -1], [-5, -3]] as const) { g.add(poner(kit, 'luz_farol', x, z)); const l = luzCalida('#ffb36a', 1.4, 7); l.position.set(x, 1.7, z); g.add(l); }
      // La grieta: una raja de luz negra con borde violeta
      const matG = new THREE.ShaderMaterial({
        uniforms: { uT: { value: 0 } },
        vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader: `uniform float uT;varying vec2 vUv;${RUIDO}
          void main(){vec2 q=vUv-.5;float linea=abs(q.x+sin(q.y*9.+1.)*.08+fbm(vec3(q.y*6.,uT*.3,0.))*.12-.06);float w=.05+.04*(1.-abs(q.y)*2.);
            float nucleo=smoothstep(w,0.,linea);float borde=smoothstep(w*3.5,w,linea)-nucleo;float puntas=smoothstep(.5,.3,abs(q.y));
            vec3 c=vec3(.6,.3,1.)*borde*(1.2+.4*sin(uT*3.))+vec3(.02,0.,.05)*nucleo;gl_FragColor=vec4(c*puntas,1.);${FIN_FRAG}}`,
        blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
      });
      grieta = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 6), matG);
      grieta.rotation.x = -Math.PI / 2;
      grieta.position.set(0, 0.04, -3);
      grieta.userData.actualizar = (t: number) => { matG.uniforms.uT.value = t; };
      g.add(grieta, motasFlotantes(140, [0, 0, -3], 1.4, 3.5, [0.55, 0.52, 0.6], 2.4, 31));
      // El alma que no ve a Serena
      alma = new THREE.Group();
      const ha = halo('#bfe3ff', 1.6); ha.position.y = 0.9; ha.material.opacity = 0.55;
      const cuerpo = motasFlotantes(80, [0, 0.2, 0], 0.25, 1.2, [0.75, 0.9, 1], 2.2, 37);
      alma.add(ha, cuerpo);
      alma.position.set(0.9, 0, -0.6);
      g.add(alma);
      // El haz dorado de Aura, el grifo y las almas que suben
      haz = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.6, 40, 32, 1, true), new THREE.MeshBasicMaterial({ color: '#ffd68a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      haz.position.set(0, 20, 2);
      g.add(haz);
      grifo = copia(grifoM, 0, 2, Math.PI, 2.4, 14);
      g.add(grifo);
      almas = motasFlotantes(120, [0, 0, 2], 1.2, 1, [1, 0.92, 0.7], 2.6, 41);
      almas.userData.manual = true;
      g.add(almas);
      colocar(el, -2.2, 2.2, 0, -1);
      colocar(ella, -0.6, 3.0, 0, -1);
      colocar(serena, 0.0, 0.3, 0.9, -0.6);
      return { el, ella, canalizadora_lara: serena };
    },
    animar(c, reparto) {
      const id = c.toma.id;
      // La mano de Serena atraviesa el alma
      const mano = c.desde('sc1_mano');
      alma.visible = c.desde('sc1_grifo') < 0;
      if (mano > 0 && mano < 6) alma.position.x = 0.9 + Math.sin(mano * 1.3) * 0.05;
      const g2 = c.desde('sc1_grifo');
      const sube = paso(0, 2, g2);
      (haz.material as THREE.MeshBasicMaterial).opacity = g2 > 0 ? 0.22 * sube : 0;
      grifo.visible = g2 > 0;
      grifo.position.y = 14 - paso(0.5, 6, g2) * 12.2 + Math.sin(c.t * 2) * 0.15;
      grifo.rotation.y = Math.PI + Math.sin(c.t * 0.7) * 0.15;
      const uA = (almas.material as THREE.ShaderMaterial).uniforms;
      uA.uT.value = c.t; uA.uEscala.value = c.alto / 720; uA.uAlfa.value = g2 > 3 ? paso(3, 5, g2) : 0;
      almas.position.y = g2 > 3 ? (g2 - 3) * 1.2 : 0;
      if (id === 'sc1_mano') {
        const s = reparto.canalizadora_lara;
        actuar(s, c.local < 3 ? 'recibir_caricia' : 'triste', c.local < 3 ? 'normal' : 'triste');
        s.p.update(c.dt);
        for (const k of ['el', 'ella']) { mirarA(reparto[k], 0.9, -0.6, c.dt * 3); actuar(reparto[k], 'reposo', 'triste'); reparto[k].p.update(c.dt); }
        return;
      }
      if (g2 > 0) { for (const a of Object.values(reparto)) { actuar(a, 'boca_abierta', 'sorprendido'); a.p.update(c.dt); } return; }
      actuarDialogo(reparto, c);
    },
  });
}

export const SC1: Guion = (() => {
  const [n1, s1, n2, s2, l1, s3, e1, s4, l2, e2, s5, n3] = LINEAS_SC1;
  const puestos: Record<string, Puesto> = { el: { x: -2.2, z: 2.2 }, ella: { x: -0.6, z: 3.0 }, canalizadora_lara: { x: 0.0, z: 0.3 } };
  const tomas: Toma[] = [
    { ...toma('sc1_abre', 'cementerio', 7, plano([8, 4, 12], [0, 0.5, -3], 40), plano([2.4, 1.6, 4.8], [0, 0.2, -3], 36), { musica: 'sangre-noche', entra: { color: '#000', dur: 2.5 }, bloom: 0.8 }), linea: n1 },
    { ...toma('sc1_ven', 'cementerio', 3, plano([3.4, 1.6, 3.2], [0.4, 1.0, -0.2], 32)), linea: s1, bloom: 0.8 },
    { ...toma('sc1_mano', 'cementerio', 5, plano([-2.4, 1.5, 1.6], [0.6, 1.0, -0.4], 32), plano([-2.0, 1.4, 1.2], [0.6, 0.95, -0.4], 30)), linea: n2, bloom: 1 },
    ...tomasDialogo([s2, l1, s3, e1, s4, l2, e2, s5], { escena: 'cementerio', puestos, centro: [-0.8, 1.6], semilla: 51, prefijo: 'SC1', bloom: 0.8, obstaculos: [[-6, -8, 2], [5, -6, 1], [-3.6, -5.5, 1.2], [-3, 2, 0.4], [3.4, -1, 0.4], [-5, -3, 0.4]], audiencia: [0.1, 1] }),
    { ...toma('sc1_grifo', 'cementerio', 10, plano([-2.5, 1.2, 6.5], [0, 4, 2], 44), plano([-3, 1.6, 8], [0, 8, 2], 46)), linea: n3, bloom: 1.25 },
    toma('sc1_titulo', 'cementerio', 5, plano([-3, 1.6, 8], [0, 8, 2], 46), plano([-4, 3, 11], [0, 10, 2], 46), { titulo: { grande: 'Las Afueras', chico: 'Sangre y Ceniza · I' }, sale: { color: '#000', dur: 2 }, bloom: 1.1 }),
  ];
  return { id: 'SC1', nombre: 'Las Afueras', fov: 38, tomas, escenarios: { cementerio } };
})();

// ------------------------------------------------------------------ C03 · La firma (el archivo)

/** Quién está en el archivo: [id del reparto, quién lo actúa ('el', 'ella', un vecino o una diosa), x, z, mira x, mira z]. */
export type PuestoArchivo = [string, string, number, number, number, number];
const CAST_C03: PuestoArchivo[] = [['archivero', 'archivero', 0, -1.6, 0, 2], ['veterano', 'veterano', 2.4, 0.4, 0, 0], ['el', 'el', -1.0, 2.0, 0, -0.6], ['ella', 'ella', -2.6, 0.6, 0, -0.6]];
/** Un cuarto de tablas: piso y cuatro paredes (de ±ancho en x y ±fondo en z), con los módulos de los muebles. */
export function cuarto(m: THREE.Object3D, ancho: number, fondo: number) {
  const g = new THREE.Group();
  const piso = piezaKit(m, 'piso_modulo'), pared = piezaKit(m, 'pared_modulo');
  if (piso) { const ls: [number, number, number, number, number][] = []; for (let x = -ancho; x < ancho; x++) for (let z = 0; z < Math.ceil(fondo * 2 / 0.19); z++) ls.push([x + 0.5, 0, -fondo + z * 0.19 + 0.1, 0, 1]); g.add(instanciar(piso, ls)); }
  if (pared) {
    const ls: [number, number, number, number, number][] = [];
    for (let x = -ancho; x < ancho; x++) { ls.push([x + 0.5, 0, -fondo - 0.1, 0, 1]); ls.push([x + 0.5, 0, fondo + 0.1, Math.PI, 1]); }
    for (let z = -fondo; z < fondo; z++) { ls.push([-ancho - 0.1, 0, z + 0.5, Math.PI / 2, 1]); ls.push([ancho + 0.1, 0, z + 0.5, -Math.PI / 2, 1]); }
    g.add(instanciar(pared, ls));
  }
  return g;
}
export function archivo(cast: PuestoArchivo[] = CAST_C03, alMontar?: (g: THREE.Group) => void, alAnimar?: (c: ContextoToma, rp: Reparto) => void): Escenario {
  return escenario({
    hora: 'tarde', sol: new THREE.Vector3(-0.9, 0.5, 0.2), colores: null, fondo: '#1a130e', exposicion: 1.1, radio: 8,
    async montar(g) {
      const crear = (quien: string) => quien === 'el' || quien === 'ella' ? actorPareja(quien) : ['celia', 'aura', 'lara', 'fuatia'].includes(quien) ? actorDiosa(quien as 'fuatia') : actorVecino(quien, quien === 'veterano' ? ['cabeza'] : []);
      const [m, ...actores] = await Promise.all([cargar('granja_muebles.glb'), ...cast.map(([, quien]) => crear(quien))]);
      // Piso de tablas y tres paredes (el cuarto mide 8 × 6)
      const piso = piezaKit(m, 'piso_modulo'), pared = piezaKit(m, 'pared_modulo');
      g.add(cuarto(m, 5, 4));
      for (const x of [-3.8, -2.3, 2.3, 3.8]) g.add(poner(m, 'biblioteca', x, -3.75));
      g.add(poner(m, 'escritorio', 0, -0.6, 0), poner(m, 'lampara', 0.5, -0.7, 0, 0.6, 0.76, false), poner(m, 'globo', -3.2, 0.8), poner(m, 'mesa_mapas', 2.4, 1.0, Math.PI / 2, 0.9));
      g.add(poner(m, 'ventana', -5.0, 0.2, Math.PI / 2, 1, 1.1, false), poner(m, 'cuadro', 5.0, -0.5, -Math.PI / 2, 1, 1.4, false), poner(m, 'baul', 4.2, -2.6), poner(m, 'tapete', 0, 1.2, 0, 1.4, 0.01, false), poner(m, 'planta', -4.4, -2.6));
      const lampara = luzCalida('#ffc98a', 2.2, 7); lampara.position.set(0.5, 1.4, -0.6); g.add(lampara);
      const ventana = new THREE.SpotLight('#cfe0ff', 6, 14, 0.6, 0.5, 1.2); ventana.position.set(-7, 2.6, 0.2); ventana.target.position.set(0, 0, 0.4); ventana.castShadow = true; g.add(ventana, ventana.target);
      g.add(motasFlotantes(90, [-1.5, 0.4, 0.3], 2.2, 2, [1, 0.92, 0.75], 1.4, 3));
      const rp: Reparto = {};
      cast.forEach(([id, quien, x, z, mx, mz], i) => { colocar(actores[i], x, z, mx, mz, ['celia', 'aura', 'lara', 'fuatia'].includes(quien) ? 0.35 : 0); rp[id] = actores[i]; });
      alMontar?.(g);
      return rp;
    },
    animar(c, reparto) { alAnimar?.(c, reparto); actuarDialogo(reparto, c, {}, { veterano: 'brazos_cruzados' }); },
  });
}

export const C03: Guion = (() => {
  const L = LINEAS_CAMPANA.C03;
  const puestos: Record<string, Puesto> = { archivero: { x: 0, z: -1.6 }, veterano: { x: 2.4, z: 0.4 }, el: { x: -1.0, z: 2.0 }, ella: { x: -2.6, z: 0.6 } };
  const tomas: Toma[] = [
    toma('c03_abre', 'archivo', 5, plano([3.2, 2.4, 4.6], [0, 0.8, -1], 40), plano([2.2, 1.6, 3.4], [0, 0.8, -0.8], 38), { musica: 'M09', entra: { color: '#000', dur: 2 }, bloom: 0.5 }),
    ...tomasDialogo(L.slice(0, -1), { escena: 'archivo', puestos, centro: [0, 0], semilla: 61, prefijo: 'C03', bloom: 0.45, dentro: [-4.6, 4.6, -3.0, 3.75], bajos: [[0, -0.6, 0.9], [2.4, 1.0, 1.0], [-3.2, 0.8, 0.5]] }),
    { ...toma('c03_cierre', 'archivo', 7, plano([0.3, 1.2, 0.5], [0, 0.8, -0.6], 30), plano([2.8, 2.6, 4.6], [0, 0.9, -1], 40)), linea: L[L.length - 1], bloom: 0.5 },
    toma('c03_titulo', 'archivo', 5, plano([2.8, 2.6, 4.6], [0, 0.9, -1], 40), plano([3.4, 3, 5.4], [0, 1, -1.5], 40), { titulo: { grande: 'La firma', chico: 'Capítulo V' }, sale: { color: '#000', dur: 2 } }),
  ];
  return { id: 'C03', nombre: 'La firma', fov: 38, tomas, escenarios: { archivo } };
})();
