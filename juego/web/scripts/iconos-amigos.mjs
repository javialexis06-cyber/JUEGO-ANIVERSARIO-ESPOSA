// Dibuja el ícono y la pantalla de arranque de la app para amigos («Sala de Juegos»): un control de juego de felpa
// sobre la noche de feria de la sala de amigos, sin nada de la pareja. Los deja en android-amigos/res (los copia el
// workflow encima del proyecto de Android al armar NuestroHogar-Amigos.apk) y en ../escritorio/build-amigos
// (icon.png e icon.ico, este último con Pillow si está: python3 -c … al final). Se corre a mano cuando se quiera cambiar el ícono.
// Uso: node scripts/iconos-amigos.mjs
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const control = (s = 1) => `
  <g transform="scale(${s})">
    <ellipse cx="0" cy="58" rx="150" ry="22" fill="rgba(0,0,0,.22)"/>
    <path d="M-120 -40 C-160 -40 -178 0 -170 50 C-162 98 -126 112 -100 84 L-62 46 L62 46 L100 84 C126 112 162 98 170 50 C178 0 160 -40 120 -40 Z" fill="#fff8ee"/>
    <path d="M-120 -40 C-160 -40 -178 0 -170 50 C-168 60 -164 70 -158 78 C-160 30 -146 -14 -110 -18 L110 -18 C146 -14 160 30 158 78 C164 70 168 60 170 50 C178 0 160 -40 120 -40 Z" fill="#ffffff" opacity=".7"/>
    <path d="M-120 -40 C-160 -40 -178 0 -170 50 C-162 98 -126 112 -100 84 L-62 46 L62 46 L100 84 C126 112 162 98 170 50 C178 0 160 -40 120 -40 Z" fill="url(#felpa)" opacity=".5"/>
    <g transform="translate(-92 12)"><rect x="-36" y="-12" width="72" height="24" rx="8" fill="#3d2b27"/><rect x="-12" y="-36" width="24" height="72" rx="8" fill="#3d2b27"/><circle r="6" fill="#5a4640"/></g>
    <circle cx="92" cy="-14" r="15" fill="#f2c94c"/><circle cx="122" cy="14" r="15" fill="#e85d5d"/><circle cx="62" cy="14" r="15" fill="#4f8fe0"/><circle cx="92" cy="42" r="15" fill="#7ccf6b"/>
    ${[[92, -14], [122, 14], [62, 14], [92, 42]].map(([x, y]) => `<circle cx="${x - 5}" cy="${y - 5}" r="5" fill="#fff" opacity=".55"/>`).join('')}
    <rect x="-30" y="34" width="22" height="10" rx="5" fill="#d7c6bd"/><rect x="8" y="34" width="22" height="10" rx="5" fill="#d7c6bd"/>
    <ellipse cx="-17" cy="-6" rx="7" ry="9" fill="#3d2b27"/><ellipse cx="17" cy="-6" rx="7" ry="9" fill="#3d2b27"/>
    <circle cx="-14.5" cy="-9.5" r="2.6" fill="#fff"/><circle cx="19.5" cy="-9.5" r="2.6" fill="#fff"/>
    <ellipse cx="-34" cy="10" rx="9" ry="5.5" fill="#f07a85" opacity=".6"/><ellipse cx="34" cy="10" rx="9" ry="5.5" fill="#f07a85" opacity=".6"/>
    <path d="M-9 10 Q0 19 9 10" stroke="#3d2b27" stroke-width="4.5" fill="none" stroke-linecap="round"/>
  </g>`;

const fondo = (w, h) => `
  <defs>
    <linearGradient id="noche" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#4b2e5c"/><stop offset=".6" stop-color="#3a2347"/><stop offset="1" stop-color="#2a1a37"/></linearGradient>
    <radialGradient id="luz" cx="50%" cy="58%" r="55%"><stop offset="0" stop-color="#ff9fb8" stop-opacity=".55"/><stop offset="1" stop-color="#ff9fb8" stop-opacity="0"/></radialGradient>
    <pattern id="felpa" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1" fill="rgba(0,0,0,.08)"/><circle cx="4.5" cy="4.5" r="1" fill="rgba(255,255,255,.5)"/></pattern>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#noche)"/>
  <rect width="${w}" height="${h}" fill="url(#luz)"/>`;

const bombillos = (w, y, n) => Array.from({ length: n }, (_, k) => {
  const x = ((k + 0.5) / n) * w;
  const yy = y + Math.sin((k / (n - 1)) * Math.PI) * w * 0.05;
  const c = ['#ffd36e', '#ff8fb1', '#8fd3f2'][k % 3];
  return `<circle cx="${x}" cy="${yy}" r="${w * 0.012}" fill="${c}"/><circle cx="${x}" cy="${yy}" r="${w * 0.03}" fill="${c}" opacity=".25"/>`;
}).join('') + `<path d="M0 ${y - w * 0.01} Q${w / 2} ${y + w * 0.1} ${w} ${y - w * 0.01}" stroke="rgba(255,240,210,.35)" stroke-width="${w * 0.004}" fill="none"/>`;

const estrellas = (w, h, n) => Array.from({ length: n }, (_, k) => `<circle cx="${(k * 97) % w}" cy="${(k * 53) % (h * 0.5)}" r="${1 + (k % 3)}" fill="#fff" opacity="${0.3 + (k % 4) * 0.12}"/>`).join('');

/** Ícono cuadrado (con esquinas) o solo el primer plano (adaptable de Android: el control en el 60 % del centro). */
const icono = (tam, tipo) => {
  if (tipo === 'frente') return `<svg xmlns="http://www.w3.org/2000/svg" width="${tam}" height="${tam}" viewBox="-256 -256 512 512">${fondo(0, 0).replace(/<rect[^>]*>/g, '')}${control(0.95)}</svg>`;
  const redondo = tipo === 'redondo';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tam}" height="${tam}" viewBox="0 0 512 512">
    <defs><clipPath id="r">${redondo ? '<circle cx="256" cy="256" r="256"/>' : '<rect width="512" height="512" rx="110"/>'}</clipPath></defs>
    <g clip-path="url(#r)">${fondo(512, 512)}${estrellas(512, 512, 14)}${bombillos(512, 70, 7)}<g transform="translate(256 290)">${control(1.18)}</g></g></svg>`;
};

const splash = (w, h) => {
  const m = Math.min(w, h);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${fondo(w, h)}${estrellas(w, h, 40)}${bombillos(w, h * 0.08, Math.round(w / 90))}
    <g transform="translate(${w / 2} ${h * 0.47})">${control(m / 900)}</g>
    <text x="${w / 2}" y="${h * 0.47 + m * 0.24}" text-anchor="middle" font-family="Fredoka, Nunito, 'Trebuchet MS', sans-serif" font-weight="700" font-size="${m * 0.085}" fill="#fff" style="paint-order:stroke" stroke="#b45c75" stroke-width="${m * 0.012}">Sala de juegos</text></svg>`;
};

const RES = 'android-amigos/res';
const salidas = [];
for (const [d, t] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]]) {
  salidas.push([`${RES}/mipmap-${d}/ic_launcher.png`, icono(t, 'cuadrado'), t, t]);
  salidas.push([`${RES}/mipmap-${d}/ic_launcher_round.png`, icono(t, 'redondo'), t, t]);
  salidas.push([`${RES}/mipmap-${d}/ic_launcher_foreground.png`, icono(Math.round(t * 2.25), 'frente'), Math.round(t * 2.25), Math.round(t * 2.25)]);
}
const SPLASH = {
  drawable: [480, 320], 'drawable-land-mdpi': [480, 320], 'drawable-land-hdpi': [800, 480], 'drawable-land-xhdpi': [1280, 720], 'drawable-land-xxhdpi': [1600, 960],
  'drawable-land-xxxhdpi': [1920, 1280], 'drawable-port-mdpi': [320, 480], 'drawable-port-hdpi': [480, 800], 'drawable-port-xhdpi': [720, 1280],
  'drawable-port-xxhdpi': [960, 1600], 'drawable-port-xxxhdpi': [1280, 1920],
};
for (const [d, [w, h]] of Object.entries(SPLASH)) salidas.push([`${RES}/${d}/splash.png`, splash(w, h), w, h]);
salidas.push(['../escritorio/build-amigos/icon.png', icono(512, 'cuadrado'), 512, 512]);

const PRE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const nav = await chromium.launch({ executablePath: existsSync(PRE) ? PRE : undefined });
const p = await nav.newPage();
for (const [ruta, svg, w, h] of salidas) {
  mkdirSync(dirname(ruta), { recursive: true });
  await p.setViewportSize({ width: w, height: h });
  await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await p.screenshot({ path: ruta, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
}
await nav.close();
// El .ico de Windows (varios tamaños) con Pillow
const { execFileSync } = await import('node:child_process');
try {
  execFileSync('python3', ['-c', "from PIL import Image; Image.open('../escritorio/build-amigos/icon.png').save('../escritorio/build-amigos/icon.ico', sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])"]);
} catch {
  console.log('(sin Pillow: el icon.ico no se actualizó)');
}
console.log(`${salidas.length} imágenes listas`);
