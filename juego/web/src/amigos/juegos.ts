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
  tema: 'lavado' | 'sangre' | 'super' | 'mesa' | 'retrete' | 'cocina' | 'escudo' | 'carreras' | 'celular';
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

/** El Escudo de las Hermanas: el Borde de Astra, el escudo de luz entre dos pilares y la ceniza que llega. */
const ARTE_ESCUDO = `<svg viewBox="0 0 200 110" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="es" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2350"/><stop offset="1" stop-color="#0b0a1e"/></linearGradient></defs>
  <rect width="200" height="110" fill="url(#es)"/>
  ${Array.from({ length: 20 }, (_, k) => `<circle cx="${(k * 41) % 200}" cy="${(k * 23) % 60}" r="${k % 3 ? 0.9 : 1.6}" fill="#fff" opacity=".8"/>`).join('')}
  <path d="M10 92 Q60 70 100 84 T190 80 L190 110 L10 110z" fill="#5e8f86"/>
  <rect x="150" y="30" width="6" height="56" rx="3" fill="#ffe0a0"/><rect x="176" y="30" width="6" height="56" rx="3" fill="#d9c8ff"/>
  <rect x="156" y="32" width="20" height="52" fill="#9fd6ff" opacity=".35"/>
  <circle cx="60" cy="70" r="9" fill="#ffb040"/><circle cx="60" cy="70" r="4" fill="#fff0b0"/>
  ${[[24, 84], [36, 80], [46, 86]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#6a6372"/><circle cx="${x - 1.5}" cy="${y - 1}" r="1.2" fill="#fff"/>`).join('')}</svg>`;

/** La Carrera de las Tres Lunas: un camino que serpentea por las colinas bajo tres lunas, con un carrito y su bandera. */
const ARTE_CARRERAS = `<svg viewBox="0 0 200 110" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="cr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3f86"/><stop offset="1" stop-color="#f49a6c"/></linearGradient></defs>
  <rect width="200" height="110" fill="url(#cr)"/>
  <circle cx="40" cy="22" r="9" fill="#fff4d6"/><circle cx="100" cy="14" r="6" fill="#d9c8ff"/><circle cx="160" cy="24" r="7.5" fill="#ffd0b0"/>
  <path d="M0 78 Q50 58 100 72 T200 66 L200 110 L0 110z" fill="#6f9a45"/>
  <path d="M-5 104 C40 80 70 96 105 86 S170 70 210 80" fill="none" stroke="#c9a070" stroke-width="12" stroke-linecap="round"/>
  <path d="M-5 104 C40 80 70 96 105 86 S170 70 210 80" fill="none" stroke="#fff3d6" stroke-width="1.6" stroke-dasharray="5 6"/>
  <rect x="96" y="70" width="22" height="11" rx="4" fill="#e4566b"/><circle cx="100" cy="83" r="3.5" fill="#3d2b27"/><circle cx="114" cy="83" r="3.5" fill="#3d2b27"/>
  <circle cx="86" cy="72" r="7" fill="#fbf5f1"/><path d="M84 64 L86 56 L88 64z" fill="#f7e6b0"/>
  <path d="M150 40 L150 70" stroke="#3d2b27" stroke-width="1.6"/><path d="M150 40 h14 v8 h-14z" fill="#fff"/><path d="M150 40 h7 v4 h-7z M157 44 h7 v4 h-7z" fill="#2b2422"/></svg>`;

/** Desaparecidos de Astra: una ficha de expediente, el celular encontrado con la pantalla rota y la lupa. */
const ARTE_CELULAR = `<svg viewBox="0 0 200 110" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
  <rect width="200" height="110" fill="#5a3620"/><rect width="200" height="110" fill="url(#cm)" opacity=".5"/>
  <defs><radialGradient id="cm" cx="50%" cy="20%" r="70%"><stop offset="0" stop-color="#ffcf8a"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>
  <g transform="translate(38 22) rotate(-8)"><rect width="56" height="72" rx="3" fill="#f0cf8e"/><rect x="6" y="8" width="26" height="30" fill="#fff"/><rect x="9" y="11" width="20" height="22" fill="#7a8a9a"/>
    <rect x="6" y="46" width="40" height="4" rx="2" fill="#a97e3a"/><rect x="6" y="54" width="30" height="4" rx="2" fill="#a97e3a"/></g>
  <g transform="translate(96 30) rotate(6)"><rect width="78" height="46" rx="9" fill="#1d1d24"/><rect x="5" y="5" width="68" height="36" rx="5" fill="#2f6f9a"/>
    <path d="M40 8 L34 20 L42 26 L36 40" stroke="#fff" stroke-width="1.3" fill="none" opacity=".8"/><circle cx="20" cy="22" r="7" fill="#ffd23f"/></g>
  <circle cx="160" cy="84" r="12" fill="none" stroke="#fff3d6" stroke-width="4"/><path d="M168 92 l12 12" stroke="#fff3d6" stroke-width="5" stroke-linecap="round"/></svg>`;

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
  { id: 'escudo', nombre: 'El Escudo de las Hermanas', desc: 'Defiende el escudo de luz · torres y estrellas', arte: ARTE_ESCUDO, tema: 'escudo', url: './escudo.html' },
  { id: 'carreras', nombre: 'La Carrera de las Tres Lunas', desc: 'Carros y criaturas por Astra · de 1 a 4', arte: ARTE_CARRERAS, tema: 'carreras', url: './carreras.html', sala: 'carreras',
    urlCrear: './carreras.html?sala', urlUnirse: (c) => `./carreras.html?unirse=${encodeURIComponent(c)}` },
  { id: 'celular', nombre: 'Desaparecidos de Astra', desc: 'Revisa celulares encontrados y resuelve 8 casos', arte: ARTE_CELULAR, tema: 'celular', url: './celular.html' },
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
