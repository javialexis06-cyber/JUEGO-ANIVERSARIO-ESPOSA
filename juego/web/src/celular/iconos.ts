// Los íconos de las apps del teléfono y de la libreta, dibujados en SVG (sin emojis: en algunos Android no salen).
import type { IdApp } from './tipos';

const svg = (cuerpo: string, vb = '0 0 24 24') =>
  `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${cuerpo}</svg>`;

export const ICONO: Record<string, string> = {
  mensajes: svg('<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M7 9h10M7 13h6"/>'),
  fotos: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>'),
  notas: svg('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h7M9 8h3"/>'),
  grabadora: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>'),
  llamadas: svg('<path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
  mapa: svg('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>'),
  correo: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
  bitacora: svg('<path d="M5 3h12a2 2 0 0 1 2 2v16H7a2 2 0 0 1-2-2z"/><path d="M5 17a2 2 0 0 1 2-2h12M9 7h6M9 11h4"/>'),
  calendario: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><circle cx="12" cy="15" r="1.5" fill="currentColor"/>'),
  linterna: svg('<path d="M8 3h8l-1 6H9z"/><path d="M9 9h6v11a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z"/><path d="M12 13v3"/>'),
  senas: svg('<circle cx="6" cy="7" r="2.5"/><circle cx="18" cy="7" r="2.5"/><circle cx="12" cy="17" r="2.5"/><path d="M8 8.5l2.5 6.5M16 8.5l-2.5 6.5M8.5 7h7"/>'),
  atras: svg('<path d="M15 5l-7 7 7 7"/>'),
  candado: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  abierto: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>'),
  play: svg('<path d="M8 5l11 7-11 7z" fill="currentColor"/>'),
  pausa: svg('<path d="M8 5v14M16 5v14" stroke-width="3.5"/>'),
  pin: svg('<path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>'),
  casa: svg('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
  estrella: svg('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor"/>'),
  peligro: svg('<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>'),
  agua: svg('<path d="M12 3s7 8 7 12a7 7 0 0 1-14 0c0-4 7-12 7-12z"/>'),
  faro: svg('<path d="M10 21l1-12h2l1 12zM9 9h6M12 5V3M5 6l3 1M19 6l-3 1"/>'),
  mina: svg('<path d="M3 21V12a9 9 0 0 1 18 0v9"/><path d="M8 21v-7h8v7M12 3v3"/>'),
  nave: svg('<path d="M12 2c3 3 4 7 4 11l-4 3-4-3c0-4 1-8 4-11z"/><path d="M8 13l-3 4h4M16 13l3 4h-4M10 20h4"/>'),
  flor: svg('<circle cx="12" cy="10" r="2.5"/><path d="M12 7.5a3 3 0 1 1 3 2.5M12 7.5a3 3 0 1 0-3 2.5M14.5 11a3 3 0 1 1-2.5 3M9.5 11a3 3 0 1 0 2.5 3M12 14v7"/>'),
  cristal: svg('<path d="M12 2l5 7-5 13-5-13z"/><path d="M7 9h10M12 2v20"/>'),
  libreta: svg('<path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6z"/><path d="M6 3v18M4 7h4M4 12h4M4 17h4M10 8h6M10 12h5"/>'),
  ayuda: svg('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>'),
  lupa: svg('<circle cx="10" cy="10" r="6"/><path d="M15 15l6 6"/>'),
  carpeta: svg('<path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>'),
  salir: svg('<path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/>'),
  musica: svg('<path d="M9 18V6l11-2v12"/><circle cx="7" cy="18" r="2.5"/><circle cx="18" cy="16" r="2.5"/>'),
  sinMusica: svg('<path d="M9 18V6l11-2v12"/><circle cx="7" cy="18" r="2.5"/><circle cx="18" cy="16" r="2.5"/><path d="M3 3l18 18"/>'),
  perdida: svg('<path d="M4 6l7 7 4-4M4 6v4M4 6h4"/><path d="M14 17h7"/>'),
  entrante: svg('<path d="M17 5L8 14M8 8v6h6"/>'),
  saliente: svg('<path d="M8 15l9-9M11 6h6v6"/>'),
  buzon: svg('<circle cx="7" cy="13" r="3.5"/><circle cx="17" cy="13" r="3.5"/><path d="M7 16.5h10"/>'),
  bateria: svg('<rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/>'),
  senal: svg('<path d="M4 20v-3M9 20v-6M14 20v-9M19 20V5"/>'),
  ok: svg('<path d="M5 12l5 5 9-10"/>'),
  borrar: svg('<path d="M9 5h11v14H9l-6-7z"/><path d="M12 9l5 5M17 9l-5 5"/>'),
};

/** Color de fondo de cada app (como en un teléfono de verdad, cada una tiene el suyo). */
export const COLOR_APP: Record<IdApp, string> = {
  mensajes: 'linear-gradient(160deg,#5bd16a,#2f9a48)',
  fotos: 'linear-gradient(160deg,#ffb35a,#e8576a)',
  notas: 'linear-gradient(160deg,#ffe07a,#f2b32a)',
  grabadora: 'linear-gradient(160deg,#ff6a6a,#c4304a)',
  llamadas: 'linear-gradient(160deg,#4ad9a0,#1f9a7a)',
  mapa: 'linear-gradient(160deg,#7ad0ff,#3a7ae0)',
  correo: 'linear-gradient(160deg,#8a9aff,#5a4ad0)',
  calendario: 'linear-gradient(160deg,#ffffff,#dcdce6)',
  linterna: 'linear-gradient(160deg,#5a5a6a,#2a2a34)',
  senas: 'linear-gradient(160deg,#ff8ad0,#9a5aff 55%,#3ad4c0)',
};

export const NOMBRE_APP: Record<IdApp, string> = {
  mensajes: 'Mensajes', fotos: 'Fotos', notas: 'Notas', grabadora: 'Grabadora', llamadas: 'Teléfono', mapa: 'Mapa',
  correo: 'Correo', calendario: 'Calendario', linterna: 'Linterna', senas: 'Señas de luz',
};
