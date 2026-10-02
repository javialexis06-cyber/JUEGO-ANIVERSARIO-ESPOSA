// El piso de cada escenario: un plano grande que sigue a la cámara con un shader que pinta, según la posición en el
// mapa, la piel de la cara (poros, pequitas, rubor, brillo de la zona T), la porcelana del lavamanos (con las
// paredes de baldosín arriba y abajo) o el agua de la bañera (cáusticas que se mueven, espuma). Encima, decoración
// que sale siempre en el mismo sitio (lunares con pelito, vellitos, cicatrices, gotas, pelos, pétalos, paticos).
import * as THREE from 'three';
import { hash2 } from '../azar';
import type { IdEscenario, Rol } from '../tipos';
import { LoteSprites, type Cuadro } from './sprites';
import { atlasDecor, detalleBanera, detalleCara, detalleLavamanos, texturaRuido, type AtlasDecor, type IdDecor } from './texturas';

const VERT = /* glsl */ `
  varying vec2 vMapa;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vMapa = w.xz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const COMUN = /* glsl */ `
  uniform sampler2D uDetalle;
  uniform sampler2D uRuido;
  uniform float uTiempo;
  uniform vec3 uC1;
  uniform vec3 uC2;
  uniform vec3 uC3;
  uniform vec3 uLimites; // yMin, yMax, activo
  varying vec2 vMapa;
`;

const FRAG_CARA = COMUN + /* glsl */ `
  void main() {
    vec2 p = vMapa;
    float d1 = texture2D(uDetalle, p / 260.0).r;
    float d2 = texture2D(uDetalle, p / 91.0 + vec2(0.37, 0.11)).r;
    vec4 n = texture2D(uRuido, p / 2600.0);
    vec4 n2 = texture2D(uRuido, p / 760.0 + 0.5);
    vec3 piel = mix(uC1, uC2, smoothstep(0.25, 0.75, n.r));
    // Rubor de los cachetes: manchas rosadas grandes y suaves
    float rubor = smoothstep(0.58, 0.82, n.a * 0.65 + n2.r * 0.35);
    piel = mix(piel, uC3, rubor * 0.42);
    // Relieve de la piel (poros, rayitas, vellitos) y el sombreado suave de la textura
    piel *= 1.0 + (d1 - 0.5) * 0.85 + (d2 - 0.5) * 0.3;
    // Brillo de grasa de la zona T
    float brillo = smoothstep(0.66, 0.9, n2.g) * (0.12 + 0.05 * sin(uTiempo * 0.8 + p.x * 0.01));
    piel += brillo * vec3(1.0, 0.96, 0.9);
    // Un viñeteado leve hacia los bordes del plano (enfoca el centro)
    gl_FragColor = vec4(piel, 1.0);
    #include <colorspace_fragment>
  }
`;

const FRAG_LAVAMANOS = COMUN + /* glsl */ `
  void main() {
    vec2 p = vMapa;
    float d1 = texture2D(uDetalle, p / 300.0).r;
    vec4 n = texture2D(uRuido, p / 1800.0);
    vec3 col = mix(uC1, uC2, smoothstep(0.3, 0.8, n.r));
    col *= 1.0 + (d1 - 0.55) * 0.6;
    // Charquitos mojados (más azulitos y brillantes) y el sarro amarillento de las esquinas
    vec4 n3 = texture2D(uRuido, p / 640.0 + 0.27);
    float mojado = smoothstep(0.62, 0.78, n3.b * 0.7 + n.g * 0.3);
    col = mix(col, vec3(0.70, 0.82, 0.92), mojado * 0.45);
    col += mojado * smoothstep(0.55, 0.9, d1) * 0.12;
    float sarro = smoothstep(0.7, 0.86, n.a * 0.6 + n3.r * 0.4);
    col = mix(col, vec3(0.86, 0.80, 0.66), sarro * 0.28);
    // Reflejos del vidriado
    float banda = smoothstep(0.9, 1.0, sin(p.x * 0.006 + p.y * 0.003 + n.g * 4.0) * 0.5 + 0.5);
    col += banda * 0.12;
    if (uLimites.z > 0.5) {
      float fuera = max(uLimites.x - p.y, p.y - uLimites.y);
      if (fuera > 0.0) {
        // Pared de baldosín
        vec2 b = fract(p / 64.0);
        float junta = step(b.x, 0.05) + step(b.y, 0.05);
        vec2 celda = floor(p / 64.0);
        float tono = fract(sin(dot(celda, vec2(12.9898, 78.233))) * 43758.5453);
        vec3 baldosa = mix(uC3, uC3 * 1.08, tono);
        baldosa *= 1.0 + (d1 - 0.5) * 0.2;
        baldosa = mix(baldosa, vec3(0.62, 0.68, 0.74), clamp(junta, 0.0, 1.0));
        // El borde redondeado del lavamanos y su sombra
        float borde = 1.0 - smoothstep(0.0, 26.0, fuera);
        col = mix(baldosa * (1.0 - 0.35 * exp(-fuera / 30.0)), vec3(1.0), borde * 0.85);
      } else {
        // Sombrita junto al borde, por dentro
        float cerca = min(p.y - uLimites.x, uLimites.y - p.y);
        col *= 0.82 + 0.18 * smoothstep(0.0, 60.0, cerca);
      }
    }
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

const FRAG_BANERA = COMUN + /* glsl */ `
  float causticas(vec2 q, float t) {
    vec2 a = q;
    a += 0.6 * vec2(sin(a.y * 1.3 + t * 0.7), cos(a.x * 1.1 - t * 0.6));
    float c1 = sin(a.x * 2.1 + t) * sin(a.y * 1.7 - t * 0.8);
    a += 0.4 * vec2(sin(a.y * 2.3 - t * 0.5), cos(a.x * 2.0 + t * 0.9));
    float c2 = sin(a.x * 3.3 - t * 0.6) * sin(a.y * 2.9 + t * 0.4);
    return pow(clamp(1.0 - abs(c1 + c2) * 0.7, 0.0, 1.0), 5.0);
  }
  void main() {
    vec2 p = vMapa;
    float d1 = texture2D(uDetalle, p / 320.0 + vec2(uTiempo * 0.004, 0.0)).r;
    vec4 n = texture2D(uRuido, p / 2200.0);
    vec3 agua = mix(uC1, uC2, smoothstep(0.25, 0.8, n.r));
    agua *= 1.0 + (d1 - 0.5) * 0.35;
    float c = causticas(p / 90.0, uTiempo) + 0.5 * causticas(p / 52.0 + 3.0, uTiempo * 1.3);
    agua += c * vec3(0.18, 0.22, 0.22);
    // Espuma que flota en parches
    vec4 n2 = texture2D(uRuido, p / 900.0 + vec2(uTiempo * 0.003, uTiempo * 0.002));
    float espuma = smoothstep(0.66, 0.74, n2.b * 0.7 + n2.r * 0.3);
    agua = mix(agua, uC3, espuma * 0.8);
    gl_FragColor = vec4(agua, 1.0);
    #include <colorspace_fragment>
  }
`;

interface Paleta {
  c1: string;
  c2: string;
  c3: string;
}

const PIEL: Record<Rol, Paleta> = {
  el: { c1: '#e6b08d', c2: '#f1c6a6', c3: '#ef9a92' },
  ella: { c1: '#f0c3a8', c2: '#f8d7c2', c3: '#f4a0a8' },
};

/** Qué decoración sale en cada escenario (con su peso, tamaño y si va parada o acostada). */
const DECOR: Record<IdEscenario, [IdDecor, number, number][]> = {
  cara: [['pecas', 4, 90], ['vellos', 3, 80], ['poroGrande', 3, 70], ['lunar', 1.2, 46], ['brilloGrasa', 2, 160], ['cicatriz', 0.8, 70], ['ceja', 0.25, 260]],
  lavamanos: [['gotaAgua', 5, 70], ['manchaJabon', 2, 120], ['pelito', 1.2, 80], ['pasta', 0.7, 70], ['desague', 0.12, 110]],
  banera: [['burbujitas', 4, 80], ['espumaIsla', 2.2, 150], ['petalos', 1.5, 70], ['hojita', 0.6, 40]],
};

export class Suelo {
  readonly plano: THREE.Mesh;
  readonly decor: LoteSprites;
  private mat: THREE.ShaderMaterial;
  private atlas: AtlasDecor;
  private texturas: THREE.Texture[] = [];
  private tablaDecor: [IdDecor, number, number][];
  private pesoTotal = 0;

  constructor(private esc: IdEscenario, rol: Rol, limites: { yMin: number; yMax: number } | null) {
    const detalle = esc === 'cara' ? detalleCara() : esc === 'lavamanos' ? detalleLavamanos() : detalleBanera();
    // El detalle es un dato (gris), no un color: se lee tal cual
    detalle.colorSpace = THREE.NoColorSpace;
    detalle.needsUpdate = true;
    const ruido = texturaRuido();
    this.texturas.push(detalle, ruido);
    const pal: Paleta = esc === 'cara' ? PIEL[rol] : esc === 'lavamanos' ? { c1: '#e6ecf2', c2: '#c9d6e2', c3: '#9fcde3' } : { c1: '#5fbcd3', c2: '#8fd8e6', c3: '#f2f8fc' };
    // (THREE.Color ya pasa el hexadecimal a lineal: no se convierte otra vez)
    const lin = (c: string) => new THREE.Color(c);
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: esc === 'cara' ? FRAG_CARA : esc === 'lavamanos' ? FRAG_LAVAMANOS : FRAG_BANERA,
      uniforms: {
        uDetalle: { value: detalle },
        uRuido: { value: ruido },
        uTiempo: { value: 0 },
        uC1: { value: lin(pal.c1) },
        uC2: { value: lin(pal.c2) },
        uC3: { value: lin(pal.c3) },
        uLimites: { value: new THREE.Vector3(limites?.yMin ?? 0, limites?.yMax ?? 0, limites ? 1 : 0) },
      },
    });
    // Los colores se escriben en lineal: three los pasa a sRGB al final
    this.plano = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.mat);
    this.plano.rotation.x = -Math.PI / 2;
    this.plano.renderOrder = 0;
    // El piso no tapa nada: los brillos y cartones centrados en el piso (velitas, explosiones) se ven enteros
    this.mat.depthWrite = false;
    this.plano.frustumCulled = false;
    this.atlas = atlasDecor();
    this.texturas.push(this.atlas.textura);
    this.decor = new LoteSprites({ max: 160, mapa: this.atlas.textura, piso: true, orden: 1 });
    this.tablaDecor = DECOR[esc];
    this.pesoTotal = this.tablaDecor.reduce((a, b) => a + b[1], 0);
  }

  /** Acomoda el plano bajo la cámara y pone la decoración que se ve. */
  actualizar(cx: number, cy: number, ancho: number, hondo: number, t: number, limites: { yMin: number; yMax: number } | null) {
    this.plano.position.set(cx, 0, cy);
    this.plano.scale.set(ancho * 1.5, hondo * 1.6, 1);
    this.mat.uniforms.uTiempo.value = t;
    const L = this.decor;
    L.empezar();
    const C = 150;
    const x0 = Math.floor((cx - ancho * 0.62) / C), x1 = Math.floor((cx + ancho * 0.62) / C);
    const y0 = Math.floor((cy - hondo * 0.7) / C), y1 = Math.floor((cy + hondo * 0.62) / C);
    const sem = this.esc === 'cara' ? 3 : this.esc === 'lavamanos' ? 5 : 7;
    for (let gy = y0; gy <= y1; gy++)
      for (let gx = x0; gx <= x1; gx++) {
        if (hash2(gx, gy, sem) > 0.62) continue;
        // Cuál (por pesos)
        let r = hash2(gx, gy, sem + 1) * this.pesoTotal;
        let cual = this.tablaDecor[0];
        for (const d of this.tablaDecor) {
          r -= d[1];
          if (r <= 0) {
            cual = d;
            break;
          }
        }
        const x = (gx + 0.1 + hash2(gx, gy, sem + 2) * 0.8) * C;
        const y = (gy + 0.1 + hash2(gx, gy, sem + 3) * 0.8) * C;
        if (limites && (y < limites.yMin + 20 || y > limites.yMax - 20)) continue;
        const tam = cual[2] * (0.7 + hash2(gx, gy, sem + 4) * 0.6);
        const giro = hash2(gx, gy, sem + 5) * Math.PI * 2;
        const q: Cuadro = this.atlas.c[cual[0]];
        const alfa = cual[0] === 'brilloGrasa' ? 0.6 : cual[0] === 'ceja' ? 0.85 : 0.92;
        // El agua de la bañera se mece un poquito
        const mece = this.esc === 'banera' ? Math.sin(t * 0.8 + gx * 1.7 + gy) * 6 : 0;
        L.poner(x + mece, y, 0.03, tam, tam, 0.5, 0.5, q.u0, q.v0, q.u1, q.v1, 1, 1, 1, alfa, 0, 0, 1, cual[0] === 'ceja' || cual[0] === 'lunar' ? 0 : giro);
      }
    L.terminar();
  }

  liberar() {
    this.plano.geometry.dispose();
    this.mat.dispose();
    this.decor.liberar();
    for (const t of this.texturas) t.dispose();
  }
}
