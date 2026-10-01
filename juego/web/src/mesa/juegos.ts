// Los juegos de la mesa: lo que muestra el menú y cómo cargar cada uno (cada juego va en su propio archivo).
import type { JuegoMesa } from './tipos';

export interface Entrada {
  id: JuegoMesa['id'];
  nombre: string;
  resumen: string;
  /** Color de la tarjeta del menú. */
  color: string;
  icono: string;
  cargar: () => Promise<JuegoMesa | null>;
  /** No sale como tarjeta en el menú (se llega a él desde otro: el Parchís a 2 colores sale del Parchís). */
  oculto?: boolean;
}

const svg = (cuerpo: string) => `<svg viewBox="0 0 64 64" aria-hidden="true">${cuerpo}</svg>`;

export const JUEGOS: Entrada[] = [
  {
    // El concurso de preguntas en pareja: tiene su propio estudio de televisión (src/mesa/show), no usa el tablero
    id: 'show',
    nombre: 'El Show de Nosotros',
    resumen: 'Concurso de televisión con el perrito de presentador: ¿quién conoce más al otro?',
    color: 'var(--mantequilla)',
    icono: svg(`<rect x="5" y="12" width="54" height="38" rx="9" fill="#3a1d63" stroke="#3d2b27" stroke-width="3"/>
      <rect x="11" y="18" width="42" height="26" rx="5" fill="#ff6fa5"/><path d="M32 39S22 33 22 27a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 6-10 12-10 12z" fill="#fff8ee"/>
      <g fill="#f6cf5a"><circle cx="10" cy="15" r="2.4"/><circle cx="22" cy="15" r="2.4"/><circle cx="42" cy="15" r="2.4"/><circle cx="54" cy="15" r="2.4"/><circle cx="10" cy="47" r="2.4"/><circle cx="54" cy="47" r="2.4"/></g>
      <path d="M24 50l-6 8M40 50l6 8" stroke="#3d2b27" stroke-width="3" stroke-linecap="round"/>`),
    cargar: async () => null,
  },
  {
    id: 'dados',
    nombre: 'Dados Party',
    resumen: 'Cinco dados, tres tiros y trece casillas. ¿Quién saca el Dados Party?',
    color: 'var(--mantequilla)',
    icono: svg(`<rect x="6" y="14" width="30" height="30" rx="7" fill="#fff8ee" stroke="#3d2b27" stroke-width="3" transform="rotate(-12 21 29)"/>
      <circle cx="15" cy="24" r="3.2" fill="#e4574b"/><circle cx="21" cy="29" r="3.2" fill="#e4574b"/><circle cx="27" cy="34" r="3.2" fill="#e4574b"/>
      <rect x="30" y="22" width="28" height="28" rx="7" fill="#fff8ee" stroke="#3d2b27" stroke-width="3" transform="rotate(10 44 36)"/>
      <circle cx="39" cy="30" r="3" fill="#2f8f68"/><circle cx="49" cy="32" r="3" fill="#2f8f68"/><circle cx="37" cy="40" r="3" fill="#2f8f68"/><circle cx="47" cy="42" r="3" fill="#2f8f68"/>`),
    cargar: async () => (await import('./dados')).JUEGO as JuegoMesa | null,
  },
  {
    id: 'mancala',
    nombre: 'Mancala',
    resumen: 'Siembra semillas, roba las del otro y llena tu granero.',
    color: 'var(--menta)',
    icono: svg(`<rect x="4" y="18" width="56" height="28" rx="14" fill="#c98b5a" stroke="#3d2b27" stroke-width="3"/>
      <circle cx="20" cy="26" r="5" fill="#7a4e2e"/><circle cx="32" cy="26" r="5" fill="#7a4e2e"/><circle cx="44" cy="26" r="5" fill="#7a4e2e"/>
      <circle cx="20" cy="38" r="5" fill="#7a4e2e"/><circle cx="32" cy="38" r="5" fill="#7a4e2e"/><circle cx="44" cy="38" r="5" fill="#7a4e2e"/>
      <circle cx="19" cy="25" r="1.8" fill="#f4b6c2"/><circle cx="33" cy="37" r="1.8" fill="#9ccbef"/><circle cx="45" cy="26" r="1.8" fill="#f6cf5a"/>`),
    cargar: async () => (await import('./mancala')).JUEGO as JuegoMesa | null,
  },
  {
    id: 'cajas',
    nombre: 'Puntos y Cajas',
    resumen: 'Una línea por turno. El que cierra la caja se la lleva y vuelve a jugar.',
    color: 'var(--cielo)',
    icono: svg(`<g fill="#3d2b27"><circle cx="14" cy="14" r="3.5"/><circle cx="32" cy="14" r="3.5"/><circle cx="50" cy="14" r="3.5"/>
      <circle cx="14" cy="32" r="3.5"/><circle cx="32" cy="32" r="3.5"/><circle cx="50" cy="32" r="3.5"/>
      <circle cx="14" cy="50" r="3.5"/><circle cx="32" cy="50" r="3.5"/><circle cx="50" cy="50" r="3.5"/></g>
      <rect x="16" y="16" width="14" height="14" fill="#f4b6c2"/><path d="M14 14H32V32H14Z" fill="none" stroke="#e4574b" stroke-width="4" stroke-linejoin="round"/>
      <path d="M32 32H50V50" fill="none" stroke="#2f8f68" stroke-width="4" stroke-linecap="round"/>`),
    cargar: async () => (await import('./cajas')).JUEGO as JuegoMesa | null,
  },
  {
    id: 'parchis',
    nombre: 'Parchís',
    resumen: 'Saca con cinco, come fichas y llega primero a la meta.',
    color: 'var(--rosa)',
    icono: svg(`<rect x="6" y="6" width="52" height="52" rx="8" fill="#fff8ee" stroke="#3d2b27" stroke-width="3"/>
      <rect x="8" y="8" width="20" height="20" rx="4" fill="#e4574b"/><rect x="36" y="8" width="20" height="20" rx="4" fill="#9ccbef"/>
      <rect x="8" y="36" width="20" height="20" rx="4" fill="#f6cf5a"/><rect x="36" y="36" width="20" height="20" rx="4" fill="#8fd3b6"/>
      <path d="M32 24L40 32L32 40L24 32Z" fill="#3d2b27"/>`),
    cargar: async () => (await import('./parchis')).JUEGO as JuegoMesa | null,
  },
  {
    id: 'parchis2',
    nombre: 'Parchís a 2 colores',
    resumen: 'Dos colores cada uno y dos dados al centro.',
    color: 'var(--rosa)',
    icono: '',
    oculto: true,
    cargar: async () => (await import('./parchis')).JUEGO2 as JuegoMesa | null,
  },
];
