// Proyectiles y recogibles: cada modelo con sus instancias (virotes, estacas, frascos que giran en el aire, hachas,
// bumeranes, órbitas, yunques que caen…), las almas como luces que flotan y el resto del botín (oro que gira, hierro,
// cristales de sangre, comida, cofres, llaves, frascos, huevos). Los proyectiles mágicos dejan estela.
import * as THREE from 'three';
import { ARMAS_LISTA } from '../datos/armas';
import { TIPOS } from '../sim/catalogo';
import { MOV, REC, type Proyectil, type Recogible } from '../sim/estado';
import type { Biblioteca } from './modelos';
import type { Particulas } from './particulas';
import type { ModeloFijo } from './reemplazos_mapa';
import { atlasParticulas, CUADRO, ESCALA_PUNTOS } from './texturas';

class Lote {
  malla: THREE.InstancedMesh;
  n = 0;
  constructor(private m: ModeloFijo, private padre: THREE.Object3D, private cap = 32) {
    this.malla = this.crear(cap);
  }
  private crear(cap: number) {
    const m = new THREE.InstancedMesh(this.m.geo, this.m.mats, cap);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false;
    m.castShadow = false;
    this.padre.add(m);
    return m;
  }
  poner(mat: THREE.Matrix4) {
    if (this.n >= this.cap) {
      const vieja = this.malla;
      this.cap *= 2;
      this.malla = this.crear(this.cap);
      const t = new THREE.Matrix4();
      for (let k = 0; k < this.n; k++) {
        vieja.getMatrixAt(k, t);
        this.malla.setMatrixAt(k, t);
      }
      this.padre.remove(vieja);
      vieja.dispose();
    }
    this.malla.setMatrixAt(this.n++, mat);
  }
  terminar() {
    this.malla.count = this.n;
    if (this.n) this.malla.instanceMatrix.needsUpdate = true;
    this.n = 0;
  }
}

const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const Q2 = new THREE.Quaternion();
const V = new THREE.Vector3();
const S = new THREE.Vector3();
const Y = new THREE.Vector3(0, 1, 0);
const EU = new THREE.Euler();
const X = new THREE.Vector3(1, 0, 0);

/** Qué modelo usa cada proyectil. */
function claveProyectil(p: Proyectil): string {
  if (p.mov === MOV.ENEMIGO) {
    const id = TIPOS[p.arma]?.id ?? '';
    if (id === 'esqueleto_arquero') return 'flecha_e';
    if (id === 'inquisidor_muerto') return 'fuego_e';
    if (id === 'espectro') return 'orbe_e';
    if (id === 'vampiro') return 'sangre_e';
    return 'hueso_e';
  }
  if (p.arma === -2) return 'p_sangre';
  if (p.arma === -3) return 'piedra';
  if (p.arma === -4) return 'virote';
  const a = ARMAS_LISTA[p.arma];
  if (!a) return 'virote';
  if (a.proyectil) return a.proyectil;
  return a.tipo === 'lanzado' ? 'frasco_roto' : 'virote';
}

/** Color de estela de los proyectiles que brillan. */
const ESTELA: Record<string, string> = {
  fuego_e: '#ff6a1a', orbe_e: '#7ab0ff', sangre_e: '#ff1030', flecha_e: '#ff3010', p_sangre: '#ff1030', alma: '#8fe3ff', nota_musical: '#ffd860',
  frasco_fuego: '#ff7a2a', pluma_cuervo: '#b07aff', frasco_agua: '#9fd8ff', frasco_roto: '#8aff5a', frasco_hielo: '#a8f0ff', bomba: '#ffa030', cruz: '#fff4c0',
};

const COLOR_ALMA: Record<number, [number, number, number]> = { [REC.ALMA_AZUL]: [0.35, 0.75, 1.6], [REC.ALMA_VERDE]: [0.35, 1.6, 0.6], [REC.ALMA_ROJA]: [1.8, 0.25, 0.3] };
const MODELO_REC: Record<number, string> = {
  [REC.ORO]: 'oro', [REC.HIERRO]: 'hierro_negro', [REC.SANGRE]: 'sangre_cristal', [REC.COMIDA]: 'pierna_pollo', [REC.COFRE]: 'cofre', [REC.LLAVE]: 'llave',
  [REC.FRASCO]: 'frasco_alquimia', [REC.EQUIPO]: 'equipo', [REC.HUEVO]: 'huevo_dragon', [REC.GOTA]: 'gota',
  [REC.ROSA]: 'rosa_velo', [REC.PLUMA]: 'pluma_grifo', [REC.HONGO]: 'hongo_tumba',
};
/** Los del secundario se dibujan más grandes que su modelo (si no, entre la horda no se ven). */
const ESCALA_REC: Record<number, number> = { [REC.ROSA]: 2.3, [REC.PLUMA]: 1.8, [REC.HONGO]: 2 };
/** Lo del secundario brilla de su color (para que se vea entre la horda). */
const BRILLO_REC: Record<number, string> = {
  [REC.COFRE]: '#ffd060', [REC.LLAVE]: '#ffd060', [REC.EQUIPO]: '#ffd060', [REC.HUEVO]: '#ffd060', [REC.FRASCO]: '#8aff6a',
  [REC.ROSA]: '#ff5a7a', [REC.PLUMA]: '#ffe08a', [REC.HONGO]: '#9affc8',
};

export class Cosas3D {
  grupo = new THREE.Group();
  private lotes = new Map<string, Lote>();
  private almas: THREE.Points;
  private aPos: THREE.BufferAttribute;
  private aCol: THREE.BufferAttribute;
  private aTam: THREE.BufferAttribute;

  constructor(private bib: Biblioteca, private part: Particulas) {
    const max = 900;
    const geo = new THREE.BufferGeometry();
    this.aPos = new THREE.BufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.BufferAttribute(new Float32Array(max * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.aTam = new THREE.BufferAttribute(new Float32Array(max), 1).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.aPos);
    geo.setAttribute('aColor', this.aCol);
    geo.setAttribute('aTam', this.aTam);
    geo.setAttribute('aCuadro', new THREE.BufferAttribute(new Float32Array(max).fill(CUADRO.ALMA), 1));
    geo.setDrawRange(0, 0);
    this.almas = new THREE.Points(
      geo,
      new THREE.ShaderMaterial({
        uniforms: { uTex: { value: atlasParticulas() }, uEscala: ESCALA_PUNTOS },
        vertexShader: /* glsl */ `
          attribute vec4 aColor; attribute float aTam; uniform float uEscala; varying vec4 vColor;
          void main() { vec4 mv = modelViewMatrix * vec4( position, 1.0 ); gl_PointSize = aTam * uEscala / -mv.z; gl_Position = projectionMatrix * mv; vColor = aColor; }`,
        fragmentShader: /* glsl */ `
          uniform sampler2D uTex; varying vec4 vColor;
          void main() {
            vec4 t = texture2D( uTex, vec2( gl_PointCoord.x / 4.0, 1.0 - ( 1.0 + gl_PointCoord.y ) / 2.0 ) );
            gl_FragColor = vec4( vColor.rgb, vColor.a * t.a );
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.almas.frustumCulled = false;
    this.almas.renderOrder = 8;
    this.grupo.add(this.almas);
  }

  private lote(tipo: 'proyectil' | 'cosa', id: string) {
    const k = tipo + id;
    let l = this.lotes.get(k);
    if (!l) {
      l = new Lote(this.bib.fijo(tipo, id), this.grupo, tipo === 'proyectil' ? 48 : 16);
      this.lotes.set(k, l);
    }
    return l;
  }

  actualizar(t: number, P: Proyectil[], R: Recogible[]) {
    // Proyectiles
    for (const p of P) {
      if (!p.vivo) continue;
      if (p.mov === MOV.CAE) {
        // Lo que cae del cielo (yunque, guillotina); los rayos son solo efecto
        const k = claveProyectil(p);
        if (k === 'rayo') continue;
        Q.setFromAxisAngle(Y, p.x * 3);
        V.set(p.x, p.z, p.y);
        S.setScalar(1.3);
        M.compose(V, Q, S);
        this.lote('proyectil', k).poner(M);
        continue;
      }
      const k = claveProyectil(p);
      // Hacia dónde apunta (los modelos miran a −Z)
      const ang = p.mov === MOV.ORBITA ? p.ang : p.ang;
      Q.setFromAxisAngle(Y, -ang - Math.PI / 2);
      if (p.mov === MOV.LANZADO || p.mov === MOV.BUMERAN) {
        // Giran en el aire
        Q2.setFromAxisAngle(p.mov === MOV.BUMERAN ? Y : X, p.t * 14);
        Q.multiply(Q2);
      } else if (k === 'sierra' || k === 'bola_puas') {
        Q2.setFromAxisAngle(Y, t * 12);
        Q.multiply(Q2);
      } else if (k === 'nota_musical' || k === 'alma' || k === 'pagina') {
        Q.setFromAxisAngle(Y, t * 3 + p.x);
      }
      const esc = p.mini ? 0.7 : p.mov === MOV.ENEMIGO ? 1.15 : 1;
      V.set(p.x, p.z + (k === 'pagina' ? Math.sin(t * 4 + p.x) * 0.1 : 0), p.y);
      S.setScalar(esc);
      M.compose(V, Q, S);
      this.lote('proyectil', k).poner(M);
      const e = ESTELA[k];
      if (e) this.part.estela(p.x, p.z, p.y, e, p.mov === MOV.ENEMIGO ? 0.22 : 0.14, 0.22);
    }
    // Recogibles
    let na = 0;
    const pos = this.aPos.array as Float32Array, col = this.aCol.array as Float32Array, tam = this.aTam.array as Float32Array;
    for (const r of R) {
      if (!r.vivo) continue;
      const bob = Math.sin(t * 3 + r.id) * 0.06;
      const col3 = COLOR_ALMA[r.tipo];
      if (col3) {
        if (na >= 900) continue;
        pos[na * 3] = r.x;
        pos[na * 3 + 1] = 0.35 + r.z + bob;
        pos[na * 3 + 2] = r.y;
        const pulso = 0.85 + 0.15 * Math.sin(t * 6 + r.id);
        col[na * 4] = col3[0] * pulso;
        col[na * 4 + 1] = col3[1] * pulso;
        col[na * 4 + 2] = col3[2] * pulso;
        col[na * 4 + 3] = 1;
        tam[na] = r.tipo === REC.ALMA_ROJA ? 0.55 : r.tipo === REC.ALMA_VERDE ? 0.42 : 0.3;
        na++;
        continue;
      }
      const id = MODELO_REC[r.tipo];
      if (!id) continue;
      const grande = r.tipo === REC.COFRE || r.tipo === REC.EQUIPO;
      // (las rosas y los hongos crecen del piso: quietos; la pluma flota alto y se mece con el viento)
      const planta = r.tipo === REC.ROSA || r.tipo === REC.HONGO;
      if (r.tipo === REC.PLUMA) {
        // (casi acostada, para que desde arriba se le vea lo largo)
        Q.setFromEuler(EU.set(1.2 + Math.sin(t * 1.7 + r.id) * 0.3, t * 0.8 + r.id, Math.cos(t * 1.3 + r.id) * 0.3, 'YXZ'));
        V.set(r.x, 0.75 + Math.sin(t * 2.2 + r.id) * 0.18, r.y);
      } else {
        Q.setFromAxisAngle(Y, grande || planta ? r.id : t * (r.tipo === REC.ORO ? 3 : 1.5) + r.id);
        V.set(r.x, (grande || planta ? 0 : 0.25 + bob) + r.z, r.y);
      }
      S.setScalar(r.tipo === REC.ORO ? 0.9 + Math.min(1, r.valor / 10) * 0.5 : ESCALA_REC[r.tipo] ?? 1);
      M.compose(V, Q, S);
      this.lote('cosa', id).poner(M);
      // Brillito
      const brillo = BRILLO_REC[r.tipo];
      if (brillo && Math.random() < (ESCALA_REC[r.tipo] ? 0.12 : 0.06)) this.part.brasas(r.x, 0.4, r.y, 1, 0.5, brillo);
    }
    this.almas.geometry.setDrawRange(0, na);
    this.aPos.needsUpdate = this.aCol.needsUpdate = this.aTam.needsUpdate = true;
    for (const l of this.lotes.values()) l.terminar();
  }
}
