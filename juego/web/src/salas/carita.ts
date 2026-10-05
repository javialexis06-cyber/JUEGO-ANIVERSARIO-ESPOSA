// La carita de un jugador dibujada en SVG con sus colores (cabeza cuadradita redondeada, pelo de felpa, ojitos con
// brillo, cachetes y los hombros con su camiseta), para las salas, los chips de los juegos y la sala de amigos.
// Sirve para cualquiera: Javier, Laura o un amigo con sus colores.
import type { AspectoJugador } from './tipos';

/** Los colores de fábrica de los muñecos (en sRGB, como se ven en el juego). */
export const COLORES_BASE: Record<'el' | 'ella', { piel: string; pelo: string; ropa: string }> = {
  el: { piel: '#f2b38a', pelo: '#17120f', ropa: '#2a2a30' },
  ella: { piel: '#f2b38a', pelo: '#1d1512', ropa: '#9c8775' },
};

let sig = 0;

/** SVG de la carita (tam en px). `gesto`: feliz (^ ^), normal o triste. */
export function caritaSvg(a: AspectoJugador, tam = 64, gesto: 'normal' | 'feliz' | 'triste' = 'normal'): string {
  const base = COLORES_BASE[a.cuerpo] ?? COLORES_BASE.el;
  const piel = a.piel ?? base.piel;
  const pelo = a.pelo ?? base.pelo;
  const ropa = a.detalles?.ropa ?? base.ropa;
  const id = `c${++sig}`;
  const ella = a.cuerpo === 'ella';
  // Pelo: Javier con copete; Laura con capul y melena a los lados
  const peloAtras = ella
    ? `<path d="M14 40 C10 70 14 92 26 96 L74 96 C86 92 90 70 86 40 Z" fill="${pelo}"/>`
    : '';
  const peloArriba = ella
    ? `<path d="M17 44 C16 22 32 12 50 12 C68 12 84 22 83 44 C76 34 66 30 58 31 C52 26 40 26 30 34 C26 37 21 40 17 44 Z" fill="${pelo}"/>
       <path d="M30 34 C38 30 46 31 52 36 C46 33 37 34 30 38 Z" fill="rgba(255,255,255,.18)"/>`
    : `<path d="M18 46 C15 24 30 13 50 13 C70 13 85 24 82 46 C78 38 72 34 66 33 C62 24 52 22 44 27 C38 22 26 26 22 36 C20 40 19 43 18 46 Z" fill="${pelo}"/>
       <path d="M44 27 C48 18 60 16 66 24 C60 21 52 22 48 27 Z" fill="rgba(255,255,255,.16)"/>`;
  const boca =
    gesto === 'triste'
      ? '<path d="M43 71 Q50 66 57 71" stroke="#3d2b27" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
      : '<path d="M42 67 Q50 75 58 67 Q50 71 42 67 Z" fill="#7a2230" stroke="#3d2b27" stroke-width="2" stroke-linejoin="round"/>';
  const ojos =
    gesto === 'feliz'
      ? '<path d="M31 57 Q36 51 41 57" stroke="#17120f" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M59 57 Q64 51 69 57" stroke="#17120f" stroke-width="3" fill="none" stroke-linecap="round"/>'
      : `<ellipse cx="36" cy="56" rx="5.2" ry="6.4" fill="#17120f"/><ellipse cx="64" cy="56" rx="5.2" ry="6.4" fill="#17120f"/>
         <circle cx="37.8" cy="53.4" r="1.9" fill="#fff"/><circle cx="65.8" cy="53.4" r="1.9" fill="#fff"/>`;
  return `<svg class="carita" viewBox="0 0 100 100" width="${tam}" height="${tam}" aria-hidden="true">
    <defs>
      <radialGradient id="${id}p" cx="45%" cy="38%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity=".06"/></radialGradient>
      <pattern id="${id}f" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="rgba(255,255,255,.12)"/><circle cx="3" cy="3" r=".6" fill="rgba(0,0,0,.12)"/></pattern>
    </defs>
    ${peloAtras}
    <path d="M14 100 C14 84 28 78 50 78 C72 78 86 84 86 100 Z" fill="${ropa}"/>
    <path d="M14 100 C14 84 28 78 50 78 C72 78 86 84 86 100 Z" fill="url(#${id}f)"/>
    <path d="M40 79 Q50 86 60 79" stroke="rgba(0,0,0,.22)" stroke-width="2.4" fill="none"/>
    <rect x="18" y="24" width="64" height="60" rx="22" fill="${piel}"/>
    <rect x="18" y="24" width="64" height="60" rx="22" fill="url(#${id}p)"/>
    <ellipse cx="18.5" cy="58" rx="4" ry="6" fill="${piel}"/><ellipse cx="81.5" cy="58" rx="4" ry="6" fill="${piel}"/>
    ${peloArriba}
    <path d="M18 46 C15 24 30 13 50 13 C70 13 85 24 82 46" fill="url(#${id}f)" opacity=".9"/>
    ${ojos}
    <ellipse cx="29" cy="66" rx="6" ry="3.6" fill="#f07a85" opacity=".55"/><ellipse cx="71" cy="66" rx="6" ry="3.6" fill="#f07a85" opacity=".55"/>
    ${boca}
  </svg>`;
}
