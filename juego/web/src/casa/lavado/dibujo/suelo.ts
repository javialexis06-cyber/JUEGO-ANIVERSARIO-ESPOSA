// El piso de cada escenario: un plano grande que sigue a la cámara con un shader que pinta, según la posición en el
// mapa, la piel de la cara (poros, pequitas, rubor, brillo de la zona T), la porcelana del lavamanos (con las
// paredes de baldosín arriba y abajo), el agua de la bañera (cáusticas que se mueven, espuma) o las baldosas mojadas
// de la ducha (con su junta, el moho y el agua que corre). Encima, decoración
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

const FRAG_DUCHA = COMUN + /* glsl */ `
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
    float d1 = texture2D(uDetalle, p / 300.0).r;
    vec4 n = texture2D(uRuido, p / 1900.0);
    // Baldosas cuadradas con su junta, cada una con su tonito
    vec2 q = p / 84.0;
    vec2 f = fract(q);
    vec2 celda = floor(q);
    float tono = fract(sin(dot(celda, vec2(12.9898, 78.233))) * 43758.5453);
    vec3 col = mix(uC1, uC2, tono * 0.7 + smoothstep(0.3, 0.8, n.r) * 0.3);
    col *= 1.0 + (d1 - 0.55) * 0.35;
    // El biselito de cada baldosa: luz arriba a la izquierda, sombra abajo a la derecha
    float bx = min(f.x, 1.0 - f.x), by = min(f.y, 1.0 - f.y);
    float borde = smoothstep(0.0, 0.08, min(bx, by));
    col *= 0.9 + 0.1 * borde;
    col += (2.0 - smoothstep(0.0, 0.12, f.x) - smoothstep(0.0, 0.12, f.y)) * 0.05;
    // La junta delgadita (con moho en algunas partes)
    float junta = 1.0 - smoothstep(0.008, 0.02, min(bx, by));
    float moho = smoothstep(0.62, 0.8, n.a * 0.7 + texture2D(uRuido, p / 400.0).g * 0.3);
    vec3 colJunta = mix(uC3, vec3(0.36, 0.42, 0.36), moho * 0.6);
    col = mix(col, colJunta, junta * 0.85);
    // Los taquitos azules en las esquinas (como en los baños de antes), uno sí y uno no
    vec2 esq = abs(f - floor(f + 0.5));
    float rombo = 1.0 - smoothstep(0.1, 0.115, esq.x + esq.y);
    vec2 cEsq = floor(q + 0.5);
    float alterna = mod(cEsq.x + cEsq.y, 2.0);
    vec3 azul = mix(vec3(0.42, 0.66, 0.82), vec3(0.62, 0.8, 0.9), smoothstep(0.03, 0.1, esq.x + esq.y));
    col = mix(col, azul, rombo * alterna);
    // La película de agua que corre (más brillante en los charcos) y los reflejos que se mueven
    vec4 n3 = texture2D(uRuido, p / 700.0 + vec2(uTiempo * 0.006, uTiempo * 0.011));
    float charco = smoothstep(0.56, 0.74, n3.b * 0.65 + n.g * 0.35);
    float c = causticas(p / 70.0, uTiempo * 1.2);
    col = mix(col, col * vec3(0.86, 0.95, 1.04), charco * 0.55);
    col += c * charco * vec3(0.16, 0.2, 0.22);
    float hilos = smoothstep(0.82, 1.0, sin(p.x * 0.05 + sin(p.y * 0.013 + uTiempo * 0.8) * 2.0) * 0.5 + 0.5) * charco;
    col += hilos * 0.06;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

const FRAG_JABONERA = COMUN + /* glsl */ `
  void main() {
    vec2 p = vMapa;
    float d1 = texture2D(uDetalle, p / 260.0).r;
    vec4 n = texture2D(uRuido, p / 1700.0);
    float fuera = max(uLimites.x - p.x, p.x - uLimites.y);
    vec3 col;
    if (uLimites.z > 0.5 && fuera > 0.0) {
      // Detrás de los barrotes: la pared de baldosín de la ducha, más oscurita
      vec2 q = p / 70.0;
      vec2 f = fract(q);
      float junta = 1.0 - smoothstep(0.015, 0.035, min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)));
      float tono = fract(sin(dot(floor(q), vec2(12.9898, 78.233))) * 43758.5453);
      col = mix(vec3(0.55, 0.72, 0.8), vec3(0.62, 0.78, 0.85), tono);
      col = mix(col, vec3(0.42, 0.52, 0.58), junta);
      col *= 0.62 + 0.25 * exp(-fuera / 160.0);
      // Los barrotes cromados de la repisa (verticales, con su brillo)
      float bx = fract((fuera + 6.0) / 46.0);
      float barra = 1.0 - smoothstep(0.08, 0.16, abs(bx - 0.5));
      float brillo = 1.0 - smoothstep(0.0, 0.05, abs(bx - 0.46));
      col = mix(col, vec3(0.78, 0.82, 0.88) * (0.85 + 0.15 * sin(p.y * 0.02)), barra * step(fuera, 140.0));
      col += brillo * 0.35 * step(fuera, 140.0);
      // El borde de la repisa: un riel cromado gordo
      float riel = 1.0 - smoothstep(10.0, 18.0, fuera);
      col = mix(col, vec3(0.92, 0.94, 0.97), riel);
    } else {
      // La repisa: plástico color crema con canalitos para el agua y huequitos de desagüe
      col = mix(uC1, uC2, smoothstep(0.3, 0.8, n.r));
      col *= 1.0 + (d1 - 0.55) * 0.25;
      float canal = fract(p.y / 38.0);
      float surco = smoothstep(0.0, 0.18, canal) * (1.0 - smoothstep(0.82, 1.0, canal));
      col *= 0.86 + 0.14 * surco;
      col += (1.0 - smoothstep(0.0, 0.12, abs(canal - 0.3))) * 0.05;
      vec2 h = vec2(fract(p.x / 90.0 + floor(p.y / 38.0) * 0.5), canal);
      float hueco = 1.0 - smoothstep(0.035, 0.055, length((h - vec2(0.5, 0.5)) * vec2(90.0 / 38.0, 1.0) * 0.38));
      col = mix(col, uC3, hueco * 0.8);
      // Restos de jabón y agüita
      vec4 n2 = texture2D(uRuido, p / 520.0 + 0.3);
      float jabon = smoothstep(0.66, 0.82, n2.b);
      col = mix(col, vec3(1.0, 0.97, 0.94), jabon * 0.35);
      float agua = smoothstep(0.7, 0.85, n2.r) * (0.5 + 0.5 * sin(uTiempo * 1.5 + p.y * 0.02));
      col += agua * vec3(0.04, 0.07, 0.09);
      // Sombrita contra los rieles
      if (uLimites.z > 0.5) col *= 0.78 + 0.22 * smoothstep(0.0, 70.0, -fuera);
    }
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

const FRAG_DESAGUE = COMUN + /* glsl */ `
  void main() {
    vec2 p = vMapa;
    float d1 = texture2D(uDetalle, p / 280.0 + vec2(uTiempo * 0.003, 0.0)).r;
    vec4 n = texture2D(uRuido, p / 1600.0);
    // El fondo del caño: metal oscuro y verdoso, con agua turbia encima
    vec3 col = mix(uC1, uC2, smoothstep(0.25, 0.8, n.r));
    col *= 1.0 + (d1 - 0.5) * 0.4;
    // Las placas del caño (remachadas) cada tanto
    vec2 q = p / 160.0;
    vec2 f = fract(q);
    float borde = 1.0 - smoothstep(0.0, 0.03, min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)));
    col *= 1.0 - borde * 0.35;
    float remache = 1.0 - smoothstep(0.03, 0.045, length(f - vec2(0.08, 0.08)));
    col += remache * 0.12;
    // Las rejillas grandes del desagüe: un círculo con ranuras, cada 640
    vec2 g = p / 640.0;
    vec2 c = (fract(g) - 0.5) * 640.0;
    float rr = length(c);
    float aro = 1.0 - smoothstep(4.0, 9.0, abs(rr - 118.0));
    float dentro = 1.0 - smoothstep(110.0, 114.0, rr);
    float ranura = smoothstep(0.55, 0.75, sin(atan(c.y, c.x) * 12.0)) * smoothstep(30.0, 40.0, rr) * dentro;
    col = mix(col, uC3, aro * 0.9);
    col = mix(col, vec3(0.02, 0.03, 0.03), ranura * 0.85);
    col = mix(col, uC3 * 0.8, (1.0 - smoothstep(20.0, 26.0, rr)) * 0.9);
    // Charcos de lama que brillan verdecito y el agua que corre hacia las rejillas
    vec4 n2 = texture2D(uRuido, p / 520.0 + vec2(uTiempo * 0.004, uTiempo * 0.006));
    float lama = smoothstep(0.62, 0.8, n2.g);
    col = mix(col, vec3(0.32, 0.42, 0.18), lama * 0.28);
    col += lama * smoothstep(0.75, 0.95, n2.b) * vec3(0.08, 0.14, 0.04);
    float hilo = smoothstep(0.86, 1.0, sin(rr * 0.12 - uTiempo * 2.0) * 0.5 + 0.5) * (1.0 - smoothstep(118.0, 220.0, rr)) * (1.0 - dentro);
    col += hilo * 0.05;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

const FRAG_TAPETE = COMUN + /* glsl */ `
  void main() {
    vec2 p = vMapa;
    float d1 = texture2D(uDetalle, p / 140.0).r;
    float d2 = texture2D(uDetalle, p / 47.0 + 0.3).r;
    vec4 n = texture2D(uRuido, p / 1500.0);
    // El tapete peludito del baño: fibras (el detalle) y un tono que cambia suave
    vec3 col = mix(uC1, uC2, smoothstep(0.3, 0.75, n.r));
    col *= 0.88 + d1 * 0.18 + (d2 - 0.5) * 0.22;
    // Su dibujo: franjas en el borde de cada pedazo grande y florecitas de felpa en el medio
    vec2 q = p / 520.0;
    vec2 f = fract(q);
    float bx = min(f.x, 1.0 - f.x), by = min(f.y, 1.0 - f.y);
    float franja = 1.0 - smoothstep(0.035, 0.05, min(bx, by));
    float franja2 = (1.0 - smoothstep(0.075, 0.085, min(bx, by))) * smoothstep(0.06, 0.07, min(bx, by));
    col = mix(col, uC3, franja * 0.85);
    col = mix(col, uC3 * 1.1, franja2 * 0.7);
    vec2 c = (f - 0.5) * 520.0;
    float ang = atan(c.y, c.x);
    float r = length(c);
    float petalo = 1.0 - smoothstep(70.0 + 22.0 * cos(ang * 5.0), 76.0 + 22.0 * cos(ang * 5.0), r);
    col = mix(col, mix(uC3, vec3(1.0, 0.92, 0.95), 0.45), petalo * 0.55);
    col = mix(col, vec3(1.0, 0.88, 0.55), (1.0 - smoothstep(16.0, 20.0, r)) * 0.8);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

const FRAG_ESPEJO = COMUN + /* glsl */ `
  void main() {
    vec2 p = vMapa;
    float d1 = texture2D(uDetalle, p / 220.0).r;
    vec4 n = texture2D(uRuido, p / 1400.0);
    vec4 n2 = texture2D(uRuido, p / 380.0 + vec2(0.0, uTiempo * 0.01));
    // El espejo plateado, empañado a parches (más claro y lechoso donde hay vapor)
    vec3 col = mix(uC1, uC2, smoothstep(0.3, 0.8, n.r));
    float empanado = smoothstep(0.35, 0.7, n2.g * 0.7 + n.b * 0.3);
    col = mix(col, uC3, empanado * 0.55);
    col *= 1.0 + (d1 - 0.5) * 0.18;
    // Reflejos diagonales del espejo y goticas que escurren
    float banda = smoothstep(0.92, 1.0, sin(p.x * 0.004 - p.y * 0.006 + n.g * 3.0) * 0.5 + 0.5);
    col += banda * 0.14 * (1.0 - empanado);
    vec2 g = vec2(p.x / 36.0, p.y / 36.0 + uTiempo * 0.15 * fract(sin(floor(p.x / 36.0) * 7.31) * 91.7));
    float gota = 1.0 - smoothstep(0.08, 0.13, length(fract(g) - 0.5) / (0.6 + 0.4 * fract(sin(dot(floor(g), vec2(3.1, 7.7))) * 43.5)));
    col = mix(col, uC1 * 0.9, gota * empanado * 0.6);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

const FRAG_MATERA = COMUN + /* glsl */ `
  void main() {
    vec2 p = vMapa;
    float d1 = texture2D(uDetalle, p / 120.0).r;
    float d2 = texture2D(uDetalle, p / 41.0 + vec2(0.21, 0.6)).r;
    vec4 n = texture2D(uRuido, p / 1500.0);
    vec4 n2 = texture2D(uRuido, p / 430.0 + 0.4);
    // La tierra negra de la matera: granulada, más seca (clarita) a parches y húmeda donde regaron
    vec3 col = mix(uC1, uC2, smoothstep(0.3, 0.75, n.r));
    col *= 0.82 + d1 * 0.22 + (d2 - 0.5) * 0.3;
    float seca = smoothstep(0.62, 0.82, n2.r);
    col = mix(col, col * 1.35 + vec3(0.05, 0.03, 0.0), seca * 0.5);
    float mojada = smoothstep(0.66, 0.86, n2.b);
    col = mix(col, col * 0.62, mojada * 0.6);
    // Musgo verdecito a parches
    float musgo = smoothstep(0.56, 0.74, n.g * 0.6 + n2.a * 0.4);
    vec3 verde = mix(vec3(0.3, 0.48, 0.18), vec3(0.46, 0.64, 0.24), d2);
    col = mix(col, verde * (0.75 + d1 * 0.45), musgo * 0.85);
    // Piedritas regadas (de las que ponen encima de la tierra): pocas, de tamaños y colores distintos, con su sombrita
    vec2 g = p / 58.0;
    vec2 cg = floor(g);
    float h = fract(sin(dot(cg, vec2(12.9898, 78.233))) * 43758.5453);
    vec2 off = vec2(fract(h * 7.13), fract(h * 3.71)) - 0.5;
    float tam = 0.07 + 0.09 * fract(h * 13.7);
    vec2 dp = fract(g) - 0.5 - off * 0.5;
    float piedra = (1.0 - smoothstep(tam, tam + 0.04, length(dp * vec2(1.0, 1.25)))) * step(0.9, h) * (1.0 - musgo);
    float sombraP = (1.0 - smoothstep(tam, tam + 0.07, length((dp - vec2(0.03, 0.04)) * vec2(1.0, 1.25)))) * step(0.9, h) * (1.0 - musgo);
    col = mix(col, col * 0.65, sombraP * 0.6);
    vec3 cPiedra = mix(vec3(0.84, 0.8, 0.74), vec3(0.62, 0.6, 0.58), fract(h * 5.3));
    col = mix(col, cPiedra * (0.8 + d1 * 0.3 + 0.25 * (0.5 - dp.y * 3.0)), piedra);
    // Los bordes de barro de las materas (cada 900, un aro naranja grandote)
    vec2 q = (fract(p / 900.0) - 0.5) * 900.0;
    float rr = length(q);
    float aro = 1.0 - smoothstep(10.0, 16.0, abs(rr - 300.0));
    float sombraAro = (1.0 - smoothstep(16.0, 34.0, abs(rr - 286.0))) * (1.0 - aro);
    col = mix(col, col * 0.7, sombraAro * 0.5);
    col = mix(col, uC3 * (0.9 + 0.2 * sin(atan(q.y, q.x) * 3.0 + d1)), aro);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

const FRAG_TOBOGAN = COMUN + /* glsl */ `
  void main() {
    vec2 p = vMapa;
    float d1 = texture2D(uDetalle, p / 260.0).r;
    vec4 n = texture2D(uRuido, p / 1600.0);
    // El tobogán de plástico celeste, con el agua que corre hacia adelante
    vec3 col = mix(uC1, uC2, smoothstep(0.3, 0.8, n.r));
    col *= 0.94 + d1 * 0.1;
    vec4 agua = texture2D(uRuido, vec2(p.x / 500.0 - uTiempo * 0.18, p.y / 260.0));
    vec4 agua2 = texture2D(uRuido, vec2(p.x / 300.0 - uTiempo * 0.3, p.y / 180.0 + 0.5));
    float brillo = smoothstep(0.62, 0.8, agua.r * 0.6 + agua2.g * 0.4);
    col += brillo * vec3(0.16, 0.2, 0.22);
    float raya = smoothstep(0.93, 1.0, sin(p.x * 0.03 - uTiempo * 9.0 + agua.b * 6.0) * 0.5 + 0.5) * smoothstep(0.5, 0.7, agua2.r);
    col += raya * 0.1;
    // Los carriles: rayitas blancas a lo largo
    float mc = mod(p.y + 100.0, 200.0);
    float dl = min(mc, 200.0 - mc);
    float linea = (1.0 - smoothstep(2.5, 5.0, dl)) * step(0.45, fract(p.x / 150.0));
    col = mix(col, vec3(0.97, 0.99, 1.0), linea * 0.65);
    // Los turbos: flechas naranjas que corren (las mismas posiciones que turboEn en el motor)
    float k = floor((p.x - 600.0) / 1150.0 + 0.5);
    vec2 c = vec2(k * 1150.0 + 600.0, sin(k * 1.7) * 190.0);
    vec2 l = p - c;
    float caja = (1.0 - smoothstep(70.0, 80.0, abs(l.x))) * (1.0 - smoothstep(38.0, 46.0, abs(l.y)));
    float ch = fract((l.x + abs(l.y) * 0.9) / 46.0 - uTiempo * 1.6);
    float flecha = smoothstep(0.0, 0.06, ch) * (1.0 - smoothstep(0.38, 0.44, ch));
    vec3 cTurbo = mix(vec3(1.0, 0.5, 0.18), vec3(1.0, 0.9, 0.35), flecha);
    col = mix(col, cTurbo * (0.92 + 0.12 * sin(uTiempo * 8.0)), caja * 0.92);
    // Las banderas: una raya de meta a cuadros cada 1800 (BANDERA_CADA)
    float xb = floor(p.x / 1800.0 + 0.5) * 1800.0;
    float db = abs(p.x - xb);
    vec2 cq = floor(vec2(p.x - xb + 24.0, p.y) / 12.0);
    float cuadro = mod(cq.x + cq.y, 2.0);
    float meta = (1.0 - smoothstep(22.0, 24.0, db)) * step(1.0, xb);
    col = mix(col, mix(vec3(0.12, 0.12, 0.16), vec3(1.0), cuadro), meta * 0.9);
    if (uLimites.z > 0.5) {
      float fuera = max(uLimites.x - p.y, p.y - uLimites.y);
      if (fuera > 0.0) {
        // Las paredes redondas del tobogán y, más allá, el caño oscuro
        float t = clamp(fuera / 90.0, 0.0, 1.0);
        vec3 pared = mix(uC3 * 1.2, uC3 * 0.55, t);
        float filo = 1.0 - smoothstep(0.0, 9.0, abs(fuera - 16.0));
        pared += filo * 0.28;
        pared *= 0.95 + d1 * 0.1;
        vec3 cano = vec3(0.16, 0.2, 0.22) * (0.8 + d1 * 0.4);
        vec2 r = fract(vec2(p.x / 180.0, 0.5));
        float remache = 1.0 - smoothstep(0.03, 0.05, abs(r.x - 0.5));
        cano += remache * 0.05 * step(130.0, fuera);
        col = mix(pared, cano, smoothstep(88.0, 120.0, fuera));
      } else {
        float cerca = min(p.y - uLimites.x, uLimites.y - p.y);
        col *= 0.8 + 0.2 * smoothstep(0.0, 50.0, cerca);
        col += (1.0 - smoothstep(0.0, 14.0, cerca)) * 0.12;
      }
    }
    gl_FragColor = vec4(col, 1.0);
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

/** La piel de la cara en el tono de quien juega: un poquito más clara y un poquito más oscura, y su rubor. */
function paletaDe(piel: string): Paleta {
  const c = new THREE.Color(piel);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  const tono = (dl: number, ds = 0) => new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s + ds), Math.max(0.05, Math.min(0.95, hsl.l + dl))).getHexString();
  const rubor = new THREE.Color().setHSL(0.99, Math.min(0.75, hsl.s + 0.25), Math.max(0.25, Math.min(0.75, hsl.l + 0.02)));
  return { c1: `#${tono(-0.04)}`, c2: `#${tono(0.06, -0.05)}`, c3: `#${rubor.getHexString()}` };
}

/** Qué decoración sale en cada escenario (con su peso, tamaño y si va parada o acostada). */
const DECOR: Record<IdEscenario, [IdDecor, number, number][]> = {
  cara: [['pecas', 4, 90], ['vellos', 3, 80], ['poroGrande', 3, 70], ['lunar', 1.2, 46], ['brilloGrasa', 2, 160], ['cicatriz', 0.8, 70], ['ceja', 0.25, 260]],
  lavamanos: [['gotaAgua', 5, 70], ['manchaJabon', 2, 120], ['pelito', 1.2, 80], ['pasta', 0.7, 70], ['desague', 0.12, 110]],
  banera: [['burbujitas', 4, 80], ['espumaIsla', 2.2, 150], ['petalos', 1.5, 70], ['hojita', 0.6, 40]],
  ducha: [['gotaAgua', 5, 70], ['burbujitas', 3, 80], ['manchaJabon', 2, 120], ['pelito', 0.8, 80], ['espumaIsla', 0.8, 130], ['desague', 0.18, 130]],
  jabonera: [['manchaJabon', 4, 110], ['burbujitas', 4, 70], ['gotaAgua', 3, 60], ['espumaIsla', 1.2, 110], ['pelito', 0.8, 70], ['pasta', 0.8, 60]],
  desague: [['pelito', 4, 90], ['burbujitas', 3, 70], ['hojita', 1.2, 50], ['gotaAgua', 2, 60], ['espumaIsla', 0.8, 120]],
  desfile: [['pelito', 2, 70], ['petalos', 2, 70], ['burbujitas', 1.5, 60]],
  espejo: [['gotaAgua', 6, 70], ['burbujitas', 2, 60], ['manchaJabon', 1.5, 120]],
  matera: [['hojita', 6, 80], ['petalos', 2.4, 70], ['pelito', 1.2, 60]],
  tobogan: [['burbujitas', 4, 80], ['espumaIsla', 1.2, 120], ['gotaAgua', 2, 60]],
};

export class Suelo {
  readonly plano: THREE.Mesh;
  readonly decor: LoteSprites;
  private mat: THREE.ShaderMaterial;
  private atlas: AtlasDecor;
  private texturas: THREE.Texture[] = [];
  private tablaDecor: [IdDecor, number, number][];
  private pesoTotal = 0;

  /** `piel`: el color de piel del anfitrión cuando es un amigo con su propio tono (la cara es la suya). */
  constructor(private esc: IdEscenario, rol: Rol, limites: { yMin: number; yMax: number } | null, piel?: string, private limX?: { xMin: number; xMax: number }) {
    const detalle = esc === 'cara' || esc === 'desfile' || esc === 'matera' ? detalleCara() : esc === 'lavamanos' || esc === 'ducha' || esc === 'jabonera' || esc === 'espejo' ? detalleLavamanos() : detalleBanera();
    // El detalle es un dato (gris), no un color: se lee tal cual
    detalle.colorSpace = THREE.NoColorSpace;
    detalle.needsUpdate = true;
    const ruido = texturaRuido();
    this.texturas.push(detalle, ruido);
    const pal: Paleta = esc === 'cara' ? (piel ? paletaDe(piel) : PIEL[rol])
      : esc === 'lavamanos' ? { c1: '#e6ecf2', c2: '#c9d6e2', c3: '#9fcde3' }
      : esc === 'ducha' ? { c1: '#e3f1f4', c2: '#c6e4ec', c3: '#8fa9b5' }
      : esc === 'jabonera' ? { c1: '#f7f0e4', c2: '#efe4d2', c3: '#b9a88e' }
      : esc === 'desague' ? { c1: '#3c4a4a', c2: '#4e5e5a', c3: '#a8b2b6' }
      : esc === 'desfile' ? { c1: '#c8a8e0', c2: '#d8bce8', c3: '#8a5ab8' }
      : esc === 'espejo' ? { c1: '#b8c8d4', c2: '#d4e0e8', c3: '#f2f6f8' }
      : esc === 'matera' ? { c1: '#4a3224', c2: '#5e4030', c3: '#c8683e' }
      : esc === 'tobogan' ? { c1: '#7fc8e8', c2: '#9ad8f0', c3: '#3e8ab8' }
      : { c1: '#5fbcd3', c2: '#8fd8e6', c3: '#f2f8fc' };
    // (THREE.Color ya pasa el hexadecimal a lineal: no se convierte otra vez)
    const lin = (c: string) => new THREE.Color(c);
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: esc === 'cara' ? FRAG_CARA : esc === 'lavamanos' ? FRAG_LAVAMANOS : esc === 'ducha' ? FRAG_DUCHA : esc === 'jabonera' ? FRAG_JABONERA : esc === 'desague' ? FRAG_DESAGUE : esc === 'desfile' ? FRAG_TAPETE : esc === 'espejo' ? FRAG_ESPEJO : esc === 'matera' ? FRAG_MATERA : esc === 'tobogan' ? FRAG_TOBOGAN : FRAG_BANERA,
      uniforms: {
        uDetalle: { value: detalle },
        uRuido: { value: ruido },
        uTiempo: { value: 0 },
        uC1: { value: lin(pal.c1) },
        uC2: { value: lin(pal.c2) },
        uC3: { value: lin(pal.c3) },
        // (el pasillo de arriba abajo usa los mismos tres números: xMin, xMax y activo)
        uLimites: { value: limX ? new THREE.Vector3(limX.xMin, limX.xMax, 1) : new THREE.Vector3(limites?.yMin ?? 0, limites?.yMax ?? 0, limites ? 1 : 0) },
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
    const sem = this.esc === 'cara' ? 3 : this.esc === 'lavamanos' ? 5 : this.esc === 'ducha' ? 9 : this.esc === 'jabonera' ? 13 : this.esc === 'desague' ? 17 : this.esc === 'desfile' ? 19 : this.esc === 'espejo' ? 23 : this.esc === 'matera' ? 29 : this.esc === 'tobogan' ? 31 : 7;
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
        if (this.limX && (x < this.limX.xMin + 20 || x > this.limX.xMax - 20)) continue;
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
