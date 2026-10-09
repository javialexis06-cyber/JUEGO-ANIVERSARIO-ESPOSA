// Íconos: si el frente de figuras ya dejó `sangre/iconos/<id>.webp` (renders de los modelos), se usa ese; si no, un
// glifo dibujado en SVG (siluetas sencillas de 24 × 24) sobre una placa con el color de la rareza.
import { MEDALLAS } from './medallas';

export const G: Record<string, string> = {
  espada: 'M12 2l2 3v10h-4V5zM7 15h10v2h-4v3l-1 2-1-2v-3H7z',
  cetro: 'M11 9h2v13h-2zM12 2a3.5 3.5 0 110 7 3.5 3.5 0 010-7zM9 9h6v2H9z',
  bandera: 'M5 2h2v20H5zM7 3h11l-3 4 3 4H7z',
  lanza: 'M11 8h2v14h-2zM12 1l3 7H9z',
  horca: 'M11 10h2v12h-2zM6 4h2v6h8V4h2v8H6zM11 3h2v7h-2z',
  hoz: 'M11 14h2v8h-2zM5 4c6-3 13 0 14 7-3-4-8-5-12-3l-2 7H4z',
  antorcha: 'M10 10h4l-1 12h-2zM12 1c3 3 4 5 2 8h-4c-2-3-1-5 2-8z',
  honda: 'M6 3h2l4 8 4-8h2l-5 10v9h-2v-9z',
  cadena: 'M5 5a3 3 0 016 0v3H9V5a1 1 0 00-2 0v4a1 1 0 002 0h2a3 3 0 01-6 0zM13 12a3 3 0 016 0v4a3 3 0 01-6 0v-1h2v1a1 1 0 002 0v-4a1 1 0 00-2 0h-2z',
  bola: 'M12 6a7 7 0 110 14 7 7 0 010-14zM11 1h2v5h-2z',
  puno: 'M6 9h12v8a4 4 0 01-4 4h-4a4 4 0 01-4-4zM6 5h3v4H6zM10 4h3v5h-3zM14 5h3v4h-3z',
  pico: 'M11 7h2v15h-2zM3 7c4-4 14-4 18 0-4-1-14-1-18 0z',
  maza: 'M11 11h2v11h-2zM12 2a5 5 0 110 10 5 5 0 010-10zM11 0h2v3h-2zM16 6h3v2h-3zM5 6h3v2H5z',
  mangual: 'M4 20l5-5 1 1-5 5zM10 14l2-2M12 12l2-2M15 3a4 4 0 110 8 4 4 0 010-8z',
  escudo: 'M12 2l8 3v6c0 6-4 9-8 11-4-2-8-5-8-11V5z',
  ballesta: 'M3 6c5-4 13-4 18 0l-1 1c-4-3-12-3-16 0zM11 6h2v13h-2zM8 18h8v2H8z',
  estaca: 'M12 2l3 10-3 10-3-10z',
  frasco: 'M10 2h4v5l5 9a4 4 0 01-4 6H9a4 4 0 01-4-6l5-9z',
  trabuco: 'M3 10h12l6-3v8l-6-3H9l-2 7H4l1-7H3z',
  martillo: 'M11 9h2v13h-2zM5 3h14v6H5z',
  torreta: 'M5 22l7-10 7 10h-2l-5-7-5 7zM6 6h12v4H6zM17 7h5v2h-5z',
  yunque: 'M4 6h16v3c-2 0-3 1-3 3H7c0-2-1-3-3-3zM8 12h8v4H8zM5 16h14v3H5z',
  chispas: 'M12 2l1 6 5-4-3 6 6 1-6 2 4 5-6-3-1 7-1-7-6 3 4-5-6-2 6-1-3-6 5 4z',
  llama: 'M12 2c4 5 6 8 6 12a6 6 0 01-12 0c0-3 2-5 3-7 1 2 2 3 3 3 1-3 0-5 0-8z',
  copo: 'M11 2h2v20h-2zM2 11h20v2H2zM5 4l15 15-1.4 1.4L3.6 5.4zM19 4l1.4 1.4L5.4 20.4 4 19z',
  nube: 'M6 18a4 4 0 010-8 6 6 0 0111-2 5 5 0 011 10z',
  pala: 'M11 2h2v12h-2zM7 13h10v4l-5 5-5-5z',
  alma: 'M12 3a7 7 0 017 7c0 6-4 6-4 11l-3-3-3 3c0-5-4-5-4-11a7 7 0 017-7zM9 9a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM15 9a1.5 1.5 0 100 3 1.5 1.5 0 000-3z',
  hueso: 'M7 3a3 3 0 013 3l7 7a3 3 0 11-3 3l-7-7a3 3 0 11-3-3 3 3 0 013-3z',
  campana: 'M12 2a2 2 0 012 2c4 1 5 5 5 10l2 3H3l2-3c0-5 1-9 5-10a2 2 0 012-2zM10 19h4a2 2 0 01-4 0z',
  incensario: 'M11 1h2v7h-2zM6 9h12l-2 8H8zM8 17h8v2H8zM12 19v3',
  libro: 'M4 3h7a2 2 0 012 2v16a2 2 0 00-2-2H4zM20 3h-5a2 2 0 00-2 2v16a2 2 0 012-2h5z',
  cruz: 'M10 2h4v6h6v4h-6v10h-4V12H4V8h6z',
  rayo: 'M14 1L4 13h7l-2 10 10-13h-7z',
  hacha: 'M11 4h2v18h-2zM13 3c5 0 8 3 8 7s-3 7-8 7z',
  gancho: 'M11 2h2v9a5 5 0 11-5 5h2a3 3 0 103-3z',
  guillotina: 'M4 2h2v20H4zM18 2h2v20h-2zM6 3h12v3H6zM6 8l12 4v4H6z',
  soga: 'M12 2a3 3 0 013 3v4a4 4 0 11-6 0V5a3 3 0 013-3zM11 13h2v9h-2z',
  cuervo: 'M3 13c3-1 5-4 9-4l4-3 2 1-2 2 4 1-3 1c0 4-3 7-8 7l2 4h-2l-2-4c-2 0-4-2-5-5z',
  familiar: 'M12 12c3 0 6 3 6 6 0 2-2 3-3 3s-2-1-3-1-2 1-3 1-3-1-3-3c0-3 3-6 6-6zM5.5 8a2 2.5 0 100 5 2 2.5 0 000-5zM18.5 8a2 2.5 0 100 5 2 2.5 0 000-5zM9 3a2 2.5 0 100 5 2 2.5 0 000-5zM15 3a2 2.5 0 100 5 2 2.5 0 000-5z',
  vudu: 'M12 2a3 3 0 110 6 3 3 0 010-6zM8 9h8l2 6h-3v7h-2v-5h-2v5H9v-7H6zM15 3l5-2-1 2z',
  caldero: 'M4 9h16l-1 9a3 3 0 01-3 3H8a3 3 0 01-3-3zM3 8h18v2H3zM9 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM14 2a2 2 0 110 4 2 2 0 010-4z',
  pluma: 'M20 2C10 4 5 11 4 20l2 2c1-4 3-7 6-9l-3 0c5-3 9-6 11-11z',
  laud: 'M9 11a5 5 0 105 5l7-13-2-1-7 12a5 5 0 00-3-3zM9 15a1.5 1.5 0 110 3 1.5 1.5 0 010-3z',
  cuchillos: 'M3 21L14 6l2 2L5 23zM21 21L10 6 8 8l11 15zM11 2h2v8h-2z',
  nota: 'M9 3h10v4h-8v10a3 3 0 11-2-3z',
  tambor: 'M4 7a8 3 0 0116 0v10a8 3 0 01-16 0zM4 7a8 3 0 0016 0M2 2l6 5M22 2l-6 5',
  daga: 'M12 1l2 4v8h-4V5zM8 13h8v2h-3v4l-1 3-1-3v-4H8z',
  arco: 'M5 2c8 4 8 16 0 20l1 1c9-5 9-17 0-22zM5 2v20M5 12h14l-3-2v4z',
  bomba: 'M11 7a7 7 0 110 14 7 7 0 010-14zM14 6l3-3 2 2-3 3zM19 1l1 2 2 1-2 1-1 2-1-2-2-1 2-1z',
  sierra: 'M12 4l2 2 3-1 1 3 3 1-1 3 2 2-2 2 1 3-3 1-1 3-3-1-2 2-2-2-3 1-1-3-3-1 1-3-2-2 2-2-1-3 3-1 1-3 3 1zM12 9a3 3 0 100 6 3 3 0 000-6z',
  corona: 'M3 8l4 4 5-7 5 7 4-4-2 11H5zM5 20h14v2H5z',
  calavera: 'M12 2a8 8 0 018 8c0 3-1 5-3 6v4h-2v-2h-2v2h-2v-2H9v2H7v-4c-2-1-3-3-3-6a8 8 0 018-8zM8 9a2 2 0 100 4 2 2 0 000-4zM16 9a2 2 0 100 4 2 2 0 000-4z',
  corazon: 'M12 21C5 15 2 12 2 8a5 5 0 0110-1 5 5 0 0110 1c0 4-3 7-10 13z',
  gota: 'M12 2c5 7 7 10 7 13a7 7 0 01-14 0c0-3 2-6 7-13z',
  armadura: 'M7 3h10l3 4-2 3v11H6V10L4 7zM9 6v12M15 6v12',
  sombra: 'M12 2a10 10 0 100 20 5 10 0 010-20z',
  bota: 'M7 2h6v11l6 3a3 3 0 012 3v2H5V18l2-3z',
  mano: 'M8 22a6 6 0 01-4-6V9h2v5h1V4h2v9h1V2h2v11h1V4h2v10h1V8h2v8a6 6 0 01-6 6z',
  area: 'M12 2a10 10 0 110 20 10 10 0 010-20zm0 4a6 6 0 100 12 6 6 0 000-12zm0 4a2 2 0 110 4 2 2 0 010-4z',
  reloj: 'M6 2h12v3l-4 7 4 7v3H6v-3l4-7-4-7zM9 19h6l-3-4z',
  ojo: 'M12 5c6 0 10 7 10 7s-4 7-10 7S2 12 2 12s4-7 10-7zm0 3a4 4 0 100 8 4 4 0 000-8z',
  // (los sigilos: el mapa doblado del cartógrafo, la brújula de sangre y la horqueta del zahorí)
  mapa: 'M2 5l6-2 8 2 6-2v16l-6 2-8-2-6 2zm6 0v14m8-12v14',
  brujula: 'M12 1a11 11 0 110 22 11 11 0 010-22zm0 2.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zM16.5 7.5L13.4 13.4 7.5 16.5l3.1-5.9zM12 10.6a1.4 1.4 0 100 2.8 1.4 1.4 0 000-2.8z',
  horqueta: 'M5 2h2.4l4.6 9 4.6-9H19l-5.8 11v9h-2.4v-9z',
  diana: 'M12 2a10 10 0 110 20 10 10 0 010-20zm0 3a7 7 0 100 14 7 7 0 000-14zm0 3a4 4 0 110 8 4 4 0 010-8zm0 3a1 1 0 100 2 1 1 0 000-2z',
  iman: 'M5 4h4v8a3 3 0 006 0V4h4v8a7 7 0 01-14 0zM5 4h4v3H5zM15 4h4v3h-4z',
  trebol: 'M12 3a3 3 0 013 3 3 3 0 11-1 5 3 3 0 11-4 0 3 3 0 11-1-5 3 3 0 013-3zM11 12h2v10h-2z',
  oro: 'M12 3a9 9 0 110 18 9 9 0 010-18zm0 3a6 6 0 100 12 6 6 0 000-12zm-1 2h2v8h-2z',
  vela: 'M9 9h6v13H9zM12 1c2 2 3 4 1 7h-2c-2-3-1-5 1-7z',
  espina: 'M2 12l6-2 4-8 4 8 6 2-6 2-4 8-4-8z',
  colmillo: 'M5 3h14c0 6-2 10-4 18l-2-9-1 0-2 9c-2-8-5-12-5-18z',
  cantidad: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  engranaje: 'M10 2h4l1 3 3 1 3-2 3 3-2 3 1 3 3 1v4l-3 1-1 3 2 3-3 3-3-2-3 1-1 3h-4l-1-3-3-1-3 2-3-3 2-3-1-3-3-1v-4l3-1 1-3-2-3 3-3 3 2 3-1zm2 6a4 4 0 100 8 4 4 0 000-8z',
  // (una medialuna gordita: los dos arcos van por la izquierda, el de adentro más plano)
  luna: 'M15 3a10 10 0 100 18 11 11 0 010-18z',
  hierro: 'M3 14l5-6h8l5 6-5 6H8z',
  altar: 'M3 12h18v2H3zM5 14h14v8H5zM9 6h6l1 6H8zM11 2h2v4h-2z',
  carreta: 'M3 6h18l-2 8H5zM7 15a3 3 0 110 6 3 3 0 010-6zM17 15a3 3 0 110 6 3 3 0 010-6z',
  huevo: 'M12 2c4 0 7 7 7 12a7 7 0 01-14 0c0-5 3-12 7-12z',
  cofre: 'M3 9a3 3 0 013-3h12a3 3 0 013 3v2H3zM3 12h18v9H3zM10 10h4v5h-4z',
  llave: 'M7 3a4 4 0 110 8 4 4 0 010-8zM10 8h12v3h-2v3h-2v-3h-2v2h-2v-2h-4z',
  pan: 'M3 12a9 6 0 0118 0v6H3z',
  espiga: 'M11 22h2V8h-2zM12 2c2 1 2 3 0 4-2-1-2-3 0-4zM8 6c2 0 3 2 3 4-2 0-3-2-3-4zM16 6c-2 0-3 2-3 4 2 0 3-2 3-4zM8 11c2 0 3 2 3 4-2 0-3-2-3-4zM16 11c-2 0-3 2-3 4 2 0 3-2 3-4z',
  pergamino: 'M6 3h12a2 2 0 012 2v12H8v2a2 2 0 01-4 0V5a2 2 0 012-2zM8 7h8M8 10h8M8 13h6',
  yelmo: 'M4 12a8 8 0 0116 0v8H4zM8 13h8v2H8z',
  grito: 'M3 9h4l6-5v16l-6-5H3zM16 8a5 5 0 010 8M18 5a9 9 0 010 14',
  guadana: 'M17 2h2l-8 20H9zM17 3C11 2 5 4 3 9c4-3 9-4 14-3z',
  garfio: 'M4 20L16 8M15 3l6 6-2 2-2-2-2 2 2 2-2 2-6-6zM3 21h4v-4',
  totem: 'M9 2h6v20H9zM7 5h10v4H7zM7 13h10v4H7z',
  tumba: 'M6 9a6 6 0 0112 0v13H6zM11 10h2v8h-2zM9 12h6v2H9z',
  fuelle: 'M3 8l8-4 8 4-8 12zM19 8l3-1',
  piedra: 'M5 9l4-5h6l4 5-2 9H7z',
  rosario: 'M12 3a5 5 0 110 10 5 5 0 010-10zM11 13h2v4h3v2h-3v3h-2v-3H8v-2h3z',
  capucha: 'M12 2c5 0 8 5 8 10v10H4V12c0-5 3-10 8-10zM9 12a3 3 0 006 0z',
  barril: 'M6 3h12c2 3 2 15 0 18H6c-2-3-2-15 0-18zM5 8h14M5 16h14',
  baston: 'M11 6h2v16h-2zM12 1a3 3 0 110 6 3 3 0 010-6z',
  dado: 'M4 4h16v16H4zM8 7a1 1 0 100 2 1 1 0 000-2zM16 15a1 1 0 100 2 1 1 0 000-2zM12 11a1 1 0 100 2 1 1 0 000-2z',
  tijeras: 'M6 2a3 3 0 110 6 3 3 0 010-6zM6 16a3 3 0 110 6 3 3 0 010-6zM8 7l13 9-1 1-12-8zM8 17l12-9 1 1-13 9z',
  caliz: 'M5 3h14c0 6-3 9-6 10v5h4v3H7v-3h4v-5C8 12 5 9 5 3z',
  cristal: 'M12 1l5 7-5 15-5-15z',
  espejo: 'M12 2a6 8 0 110 16 6 8 0 010-16zM11 18h2v4h-2z',
  escoba: 'M4 21l9-12 2 1-9 12zM14 8l6-6 1 1-6 6zM2 19l5-4 3 3-4 5z',
  sol: 'M12 7a5 5 0 110 10 5 5 0 010-10zM11 1h2v4h-2zM11 19h2v4h-2zM1 11h4v2H1zM19 11h4v2h-4z',
  murcielago: 'M12 9l2-3 1 3c3-2 6-1 8 1-3 0-4 2-4 4-2-1-3 0-5 2-1-2-2-2-2-2s-1 0-2 2c-2-2-3-3-5-2 0-2-1-4-4-4 2-2 5-3 8-1l1-3z',
  lapida: 'M6 22V8a6 6 0 0112 0v14zM9 10h6v2H9zM11 8h2v6h-2z',
  castillo: 'M3 22V8h3v3h2V8h3v3h2V8h3v3h2V8h3v14h-7v-5a2 2 0 00-4 0v5z',
  casco: 'M4 12a8 8 0 0116 0v8H4zM8 13h8v2H8z',
  guantes: 'M8 22a6 6 0 01-4-6V9h2v5h1V4h2v9h1V2h2v11h1V4h2v10h1V8h2v8a6 6 0 01-6 6z',
  botas: 'M7 2h6v11l6 3a3 3 0 012 3v2H5V18l2-3z',
  amuleto: 'M7 2l5 6 5-6M12 9a6 6 0 110 12 6 6 0 010-12z',
  anillo: 'M12 5a8 8 0 110 16 8 8 0 010-16zm0 3a5 5 0 100 10 5 5 0 000-10zM10 1h4l1 4h-6z',
  candado: 'M7 10V7a5 5 0 0110 0v3h2v12H5V10zM9 10h6V7a3 3 0 00-6 0z',
  pausa: 'M6 4h4v16H6zM14 4h4v16h-4z',
  atras: 'M15 4l-8 8 8 8',
  musica: 'M9 3h10v12a3 3 0 11-2-3V6h-6v11a3 3 0 11-2-3z',
  sonido: 'M3 9h4l6-5v16l-6-5H3zM16 8a5 5 0 010 8',
  jarra: 'M6 4h10v16a2 2 0 01-2 2H8a2 2 0 01-2-2zM16 7h3a2 2 0 012 2v4a2 2 0 01-2 2h-3',
  cuerno: 'M3 18c8 0 14-5 18-14l1 1c-3 10-10 16-19 16z',
};

export const RAREZA_COLOR = ['#8a8478', '#5aa04a', '#4a7ad8', '#a24ad8', '#e0a830'];

let hayRenders: boolean | null = null;
/** Revisa una vez si existen los íconos renderizados del frente de figuras. */
export async function revisarRenders() {
  if (hayRenders !== null) return hayRenders;
  try {
    const r = await fetch('./sangre/iconos/espada_larga.webp', { method: 'HEAD' });
    hayRenders = r.ok && (r.headers.get('content-type') ?? '').includes('image');
  } catch {
    hayRenders = false;
  }
  return hayRenders;
}

/** SVG de un glifo (o un rombo si no existe). */
export function glifo(id: string, color = 'currentColor'): string {
  const d = G[id] ?? 'M12 2l10 10-10 10L2 12z';
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="${color}"/></svg>`;
}

/** Ícono completo: el render si existe (con id), si no el glifo. */
/** Medallas en relieve (Sangre y Ceniza 2): los íconos de las mejoras, objetos, reliquias y equipo (si están). */
export type TemaMedalla = 'mejora' | 'objeto' | 'reliquia' | 'equipo' | 'logro' | 'desafio' | 'sigilo';
export function medalla(tema: TemaMedalla, glifoId: string, color?: string): string {
  const id = `med_${tema}_${glifoId}`;
  return icono(glifoId, MEDALLAS.has(id) ? id : undefined, color);
}

export function icono(glifoId: string, renderId?: string, color?: string): string {
  if (hayRenders && renderId) return `<img class="ico-render" src="./sangre/iconos/${renderId}.webp" alt="" loading="lazy">`;
  return glifo(glifoId, color);
}
