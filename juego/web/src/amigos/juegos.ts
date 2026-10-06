// Los juegos de la sala de juegos de los amigos. Para agregar uno: una entrada aquí (con su página o su función de
// abrir) y, si tiene página propia, la página en PAGINAS_AMIGOS de vite.config.ts (versión para amigos). Una página
// solo se ofrece como «Jugar» si existe y dice que es apta para amigos con
//   <meta name="apto-amigos" content="si">
// en su <head> (así un juego a medio adaptar sale «Muy pronto» y nunca le muestra a un amigo algo de la pareja).

export interface JuegoAmigos {
  id: string;
  nombre: string;
  /** Una línea: de qué se trata y cuántos juegan. */
  desc: string;
  /** Dibujo de la tarjeta (SVG). */
  arte: string;
  /** Clase de la tarjeta (colores). */
  tema: 'lavado' | 'sangre' | 'super' | 'mesa' | 'retrete' | 'cocina';
  /** Página del juego (relativa). */
  url?: string;
  /** Juegos que se abren aquí mismo (sin cambiar de página). */
  interno?: boolean;
  /** Id del juego en las salas (para «Crear sala» y «Unirme con un código»). */
  sala?: string;
  /** Cómo crear una sala o entrar a una (páginas): `?sala` y `?unirse=CÓDIGO` por defecto. */
  urlCrear?: string;
  urlUnirse?: (codigo: string) => string;
}

export const ARTE_SANGRE = `<svg viewBox="0 0 200 110" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
  <defs><radialGradient id="sl" cx="70%" cy="30%" r="60%"><stop offset="0" stop-color="#5a1418"/><stop offset="1" stop-color="#0d0709"/></radialGradient>
  <linearGradient id="sn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8e1b1b" stop-opacity="0"/><stop offset="1" stop-color="#8e1b1b" stop-opacity=".55"/></linearGradient></defs>
  <rect width="200" height="110" fill="url(#sl)"/>
  <circle cx="150" cy="30" r="17" fill="#f2e3c4"/><circle cx="144" cy="26" r="16" fill="#3a0f12" opacity=".35"/>
  <path d="M0 110 V84 L14 84 L14 70 L20 64 L26 70 L26 84 L44 84 L44 58 L52 50 L60 58 L60 84 L72 84 L72 40 L78 30 L84 40 L84 84 L98 84 L98 62 L106 54 L114 62 L114 84 L130 84 L130 74 L140 74 L140 84 L160 84 L160 66 L168 58 L176 66 L176 84 L200 84 V110 Z" fill="#050304"/>
  <rect x="77" y="52" width="3" height="5" fill="#ffb347"/><rect x="104" y="68" width="3" height="4" fill="#ffb347"/><rect x="166" y="70" width="3" height="4" fill="#ff8a3d"/>
  <path d="M30 30 q4 -4 8 0 q4 -4 8 0 q-4 1 -8 4 q-4 -3 -8 -4z M118 18 q3 -3 6 0 q3 -3 6 0 q-3 1 -6 3 q-3 -2 -6 -3z M60 16 q2.5 -2.5 5 0 q2.5 -2.5 5 0 q-2.5 1 -5 2.5 q-2.5 -1.5 -5 -2.5z" fill="#050304"/>
  <rect y="70" width="200" height="40" fill="url(#sn)"/></svg>`;

export const ARTE_LAVADO = `<svg viewBox="0 0 200 110" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="lf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c8ecff"/><stop offset="1" stop-color="#ffd3e0"/></linearGradient>
  <radialGradient id="lb" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".55" stop-color="#d9f2ff" stop-opacity=".25"/><stop offset="1" stop-color="#ffc4dd" stop-opacity=".45"/></radialGradient></defs>
  <rect width="200" height="110" fill="url(#lf)"/>
  ${[[30, 30, 14], [168, 22, 10], [150, 80, 18], [20, 85, 9], [110, 18, 7], [60, 92, 6], [188, 60, 7]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#lb)" stroke="#fff" stroke-width="1.4"/>`).join('')}
  <g transform="translate(92 62)">
    ${Array.from({ length: 12 }, (_, k) => `<circle cx="${Math.cos((k / 12) * Math.PI * 2) * 25}" cy="${Math.sin((k / 12) * Math.PI * 2) * 25}" r="6" fill="#7ccf6b"/>`).join('')}
    <circle r="23" fill="#8fdb7c"/><circle r="23" fill="#5aa94c" opacity=".25" transform="translate(4 5)"/>
    <ellipse cx="-8" cy="-3" rx="5" ry="6.5" fill="#fff"/><ellipse cx="8" cy="-3" rx="5" ry="6.5" fill="#fff"/>
    <circle cx="-7" cy="-2" r="3" fill="#1d1d24"/><circle cx="9" cy="-2" r="3" fill="#1d1d24"/>
    <path d="M-8 9 q8 6 16 0" stroke="#2c5a24" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M-15 -12 l6 3 M15 -12 l-6 3" stroke="#2c5a24" stroke-width="2.2" stroke-linecap="round"/></g>
  <g transform="translate(150 50) rotate(-14)"><rect x="-20" y="-11" width="40" height="22" rx="8" fill="#f8b6c7"/><rect x="-20" y="-11" width="40" height="9" rx="6" fill="#fff" opacity=".45"/></g></svg>`;

const ARTE_SUPER = `<svg viewBox="0 0 200 110" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="sf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4d6"/><stop offset="1" stop-color="#ffd8a8"/></linearGradient></defs>
  <rect width="200" height="110" fill="url(#sf)"/>
  ${[0, 1, 2].map((f) => `<rect x="8" y="${14 + f * 26}" width="112" height="4" rx="2" fill="#c98a4b"/>
    ${Array.from({ length: 7 }, (_, k) => `<rect x="${12 + k * 15}" y="${f * 26 + 2}" width="11" height="12" rx="2" fill="${['#e85d5d', '#7ccf6b', '#4f8fe0', '#f2c94c', '#c46bd6', '#f29b38', '#3fb5a3'][(k + f * 2) % 7]}"/>
    <rect x="${13 + k * 15}" y="${f * 26 + 4}" width="9" height="3" fill="#fff" opacity=".55"/>`).join('')}`).join('')}
  <rect x="0" y="88" width="200" height="22" fill="#e9b07a"/><path d="M0 88 H200" stroke="#c98a4b" stroke-width="2"/>
  <g transform="translate(150 60)"><path d="M-30 -18 h8 l8 30 h34 l6 -22 h-44" fill="none" stroke="#3d2b27" stroke-width="4" stroke-linejoin="round"/>
    <rect x="-18" y="-16" width="40" height="20" rx="4" fill="#4f8fe0" opacity=".85"/><circle cx="-10" cy="20" r="5" fill="#3d2b27"/><circle cx="18" cy="20" r="5" fill="#3d2b27"/>
    <circle cx="-4" cy="-22" r="6" fill="#e85d5d"/><rect x="4" y="-30" width="9" height="14" rx="2" fill="#f2c94c"/></g></svg>`;

const ARTE_MESA = `<svg viewBox="0 0 200 110" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
  <rect width="200" height="110" fill="#2f7a55"/><rect x="10" y="10" width="180" height="90" rx="10" fill="none" stroke="#f2c14e" stroke-width="3" stroke-dasharray="6 5"/>
  ${[[40, 34, '#e85d5d'], [62, 30, '#f2c94c'], [84, 36, '#4f8fe0'], [52, 70, '#7ccf6b']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="9" fill="${c}" stroke="#fff" stroke-width="2"/>`).join('')}
  <g transform="translate(140 56) rotate(14)"><rect x="-20" y="-20" width="40" height="40" rx="8" fill="#fff"/>
    ${[[-10, -10], [10, 10], [0, 0], [10, -10], [-10, 10]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="#3d2b27"/>`).join('')}</g>
  <g transform="translate(104 78) rotate(-18)"><rect x="-12" y="-12" width="24" height="24" rx="5" fill="#f8b6c7"/><circle r="3" fill="#3d2b27"/></g></svg>`;

const ARTE_RETRETE = `<svg viewBox="0 0 200 110" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
  <defs><radialGradient id="re" cx="30%" cy="30%" r="80%"><stop offset="0" stop-color="#3a3f8f"/><stop offset="1" stop-color="#120f2e"/></radialGradient></defs>
  <rect width="200" height="110" fill="url(#re)"/>
  ${Array.from({ length: 24 }, (_, k) => `<circle cx="${(k * 37) % 200}" cy="${(k * 53) % 110}" r="${k % 3 ? 1 : 1.8}" fill="#fff" opacity="${0.5 + (k % 4) * 0.12}"/>`).join('')}
  <circle cx="170" cy="22" r="12" fill="#f29b38"/><ellipse cx="170" cy="22" rx="20" ry="4" fill="none" stroke="#ffd34d" stroke-width="2"/>
  <g transform="translate(92 56) rotate(-24)"><path d="M-26 6 q0 18 22 18 h10 q18 0 18 -18 z" fill="#f4efe6"/><rect x="-28" y="-2" width="52" height="9" rx="4" fill="#fff"/>
    <rect x="-24" y="-30" width="20" height="28" rx="5" fill="#f4efe6"/><path d="M-6 24 l-8 22 l8 -6 l6 10 l2 -26 z" fill="#ff8a3d"/><path d="M0 24 l-4 14 l5 -4 l3 6 l1 -16z" fill="#ffd34d"/></g></svg>`;

const ARTE_COCINA = `<svg viewBox="0 0 200 110" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
  <rect width="200" height="110" fill="#ffe8cf"/>${Array.from({ length: 10 }, (_, k) => `<rect x="${k * 20}" y="0" width="10" height="110" fill="#ffd9b0" opacity=".6"/>`).join('')}
  <rect x="0" y="80" width="200" height="30" fill="#c98a4b"/>
  <g transform="translate(70 70)"><ellipse rx="40" ry="11" fill="#3d3540"/><ellipse rx="34" ry="8" fill="#5a5160"/><rect x="34" y="-3" width="36" height="6" rx="3" fill="#3d3540"/>
    <ellipse cy="-4" rx="20" ry="6" fill="#f2c14e"/><ellipse cx="-4" cy="-6" rx="6" ry="2" fill="#fff6c8"/></g>
  <g transform="translate(150 54)"><path d="M-16 -22 q-8 -14 4 -16 q2 -12 12 -6 q10 -8 14 4 q12 0 6 14 z" fill="#fff"/><rect x="-12" y="-24" width="26" height="12" rx="3" fill="#fff"/></g>
  ${[[20, 40], [36, 26], [52, 44]].map(([x, y]) => `<path d="M${x} ${y} q4 -8 0 -16" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`).join('')}</svg>`;

/** Los juegos de la sala de amigos, en orden. */
export const JUEGOS: JuegoAmigos[] = [
  { id: 'lavado', nombre: 'Lavarse la cara', desc: 'Mugrosos sin fin · de 1 a 4', arte: ARTE_LAVADO, tema: 'lavado', interno: true, sala: 'lavado' },
  { id: 'sangre', nombre: 'Sangre y Ceniza', desc: 'Sobrevive la noche eterna · de 1 a 4', arte: ARTE_SANGRE, tema: 'sangre', url: './sangre.html', sala: 'sangre',
    urlCrear: './sangre.html?sala', urlUnirse: (c) => `./sangre.html?unirse=${encodeURIComponent(c)}` },
  { id: 'super', nombre: 'Súper Manía', desc: 'Atiende el supermercado a toda máquina', arte: ARTE_SUPER, tema: 'super', url: './super.html?amigo' },
  { id: 'mesa', nombre: 'Juegos de mesa', desc: 'Dados, fichas y piedritas', arte: ARTE_MESA, tema: 'mesa', url: './mesa.html?amigo' },
  { id: 'retrete', nombre: 'Retrete espacial', desc: 'Despega y esquiva hasta las estrellas', arte: ARTE_RETRETE, tema: 'retrete', url: './retrete.html' },
  { id: 'cocina', nombre: 'Cocina de chef', desc: 'Pedidos y platos contra el reloj', arte: ARTE_COCINA, tema: 'cocina', url: './cocina.html' },
];

const disponibles = new Map<string, Promise<boolean>>();

/** ¿Ya se puede jugar? (los internos siempre; las páginas, si existen y dicen ser aptas para amigos). */
export function disponible(j: JuegoAmigos): Promise<boolean> {
  if (j.interno) return Promise.resolve(true);
  if (!j.url) return Promise.resolve(false);
  let p = disponibles.get(j.id);
  if (!p) {
    p = fetch(j.url.split('?')[0], { cache: 'no-store' })
      .then(async (r) => r.ok && /<meta\s+name=["']apto-amigos["']\s+content=["']si["']/i.test(await r.text()))
      .catch(() => false);
    disponibles.set(j.id, p);
  }
  return p;
}
