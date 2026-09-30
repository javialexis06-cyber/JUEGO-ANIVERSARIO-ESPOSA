// El color de los renders de Blender («AgX Medium High Contrast»): el tono AgX de three.js un poco más saturado y
// con más contraste. Antes era un filtro CSS sobre el lienzo, pero eso obliga al celular a pasar cada cuadro por
// un paso extra (más calor y, en algunos Android, parpadeos); aquí va dentro del mismo sombreador, sin costo.
import * as THREE from 'three';

/** El final de AgXToneMapping (en el three.js empaquetado van sin comentarios ni renglones vacíos). */
const FIN_AGX = /(color = LINEAR_REC2020_TO_LINEAR_SRGB \* color;\s*color = clamp\( color, 0\.0, 1\.0 \);)(\s*return color;)/;
const TOQUE = `
	vec3 agxS = pow( color, vec3( 1.0 / 2.2 ) );
	float agxL = dot( agxS, vec3( 0.2126, 0.7152, 0.0722 ) );
	agxS = clamp( mix( vec3( agxL ), agxS, 1.28 ), 0.0, 1.0 );
	agxS = clamp( ( agxS - 0.5 ) * 1.05 + 0.5, 0.0, 1.0 );
	color = pow( agxS, vec3( 2.2 ) );`;

/** ¿Quedó el toque de color dentro del sombreador? Si three.js cambia y no se encuentra, vuelve el filtro CSS. */
export const tonoEnSombreador = FIN_AGX.test(THREE.ShaderChunk.tonemapping_pars_fragment);
if (tonoEnSombreador) {
  // Como el filtro CSS saturate(1.28) contrast(1.05), que trabaja sobre el color ya codificado en sRGB
  THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace(FIN_AGX, `$1${TOQUE}$2`);
} else document.documentElement.classList.add('tono-css');

// ---------------------------------------------------------------------------------------------------------------
// El mismo tono en JavaScript: en calidad baja la escena se dibuja sin el paso final, y el color de fondo (que no
// pasa por el sombreador) se vería más gris. Se le aplica aquí el mismo AgX + el toque de color de arriba.
// ---------------------------------------------------------------------------------------------------------------
type V3 = [number, number, number];
/** Como un mat3 de GLSL (se escribe por columnas) por un vec3. */
const por = (m: V3[], v: V3): V3 => [0, 1, 2].map((i) => m[0][i] * v[0] + m[1][i] * v[1] + m[2][i] * v[2]) as V3;
const SRGB_A_REC2020: V3[] = [[0.6274, 0.0691, 0.0164], [0.3293, 0.9195, 0.088], [0.0433, 0.0113, 0.8956]];
const REC2020_A_SRGB: V3[] = [[1.6605, -0.1246, -0.0182], [-0.5876, 1.1329, -0.1006], [-0.0728, -0.0083, 1.1187]];
const AGX_ADENTRO: V3[] = [
  [0.856627153315983, 0.137318972929847, 0.11189821299995],
  [0.0951212405381588, 0.761241990602591, 0.0767994186031903],
  [0.0482516061458583, 0.101439036467562, 0.811302368396859],
];
const AGX_AFUERA: V3[] = [
  [1.1271005818144368, -0.1413297634984383, -0.14132976349843826],
  [-0.11060664309660323, 1.157823702216272, -0.11060664309660294],
  [-0.016493938717834573, -0.016493938717834257, 1.2519364065950405],
];
const limitar = (x: number) => Math.min(1, Math.max(0, x));

/** El color (lineal) tal como saldría en pantalla con el tono AgX, la exposición y el toque de color. */
export function conTono(c: THREE.Color, exposicion: number): THREE.Color {
  const min = -12.47393, max = 4.026069;
  let v: V3 = por(AGX_ADENTRO, por(SRGB_A_REC2020, [c.r * exposicion, c.g * exposicion, c.b * exposicion]));
  v = v.map((x) => limitar((Math.log2(Math.max(x, 1e-10)) - min) / (max - min))) as V3;
  v = v.map((x) => {
    const x2 = x * x, x4 = x2 * x2;
    return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232;
  }) as V3;
  v = por(REC2020_A_SRGB, por(AGX_AFUERA, v).map((x) => Math.pow(Math.max(0, x), 2.2)) as V3).map(limitar) as V3;
  let s = v.map((x) => Math.pow(x, 1 / 2.2));
  const l = 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
  s = s.map((x) => limitar(l + (x - l) * 1.28)).map((x) => limitar((x - 0.5) * 1.05 + 0.5));
  return new THREE.Color().setRGB(Math.pow(s[0], 2.2), Math.pow(s[1], 2.2), Math.pow(s[2], 2.2), THREE.LinearSRGBColorSpace);
}
