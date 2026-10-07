// Lo que se ve de la cocina fuera de las estaciones: el comedor con el mostrador (los invitados, la impresora de
// tiquetes, la campanita y el frasco de propinas), el riel de tiquetes, la barra de estaciones, el «modo chef» del
// comienzo y la calificación de cada plato. Usa los recortes renderizados (sprites.ts) y, mientras cargan, dibujos
// de respaldo.
import { nota } from '../../sonido';
import type { Rol } from '../modelo';
import { aclarar, conAlfa, elipse, G, lineal, oscurecer, radial, Rect, rr, sombra, texto } from './dibujo';
import { barridoBrillo, corazon, destello, estrella } from './efectos';
import type { Pose } from './invitados';
import { BARRA, InvDia, JuicioDia, Motor, RIEL, sonidos } from './motor';
import { fondo, hay, pendiente, recorte, spr } from './sprites';

const FUENTE_TIQUETE = '"Courier Prime", "Courier New", monospace';

// ---------------------------------------------------------------------------------------------- Texturas hechas una vez
let papelTextura: HTMLCanvasElement | null = null;
/** Papel de tiquete: blanco hueso con fibras y una que otra mota. */
function papel() {
  if (papelTextura) return papelTextura;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fffaf0';
  g.fillRect(0, 0, 256, 256);
  let s = 7;
  const az = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 2600; i++) {
    const v = 225 + Math.floor(az() * 30);
    g.fillStyle = `rgba(${v},${v - 8},${v - 22},${0.12 + az() * 0.12})`;
    g.fillRect(az() * 256, az() * 256, 1 + az() * 2, 1);
  }
  g.strokeStyle = 'rgba(190,170,140,0.08)';
  for (let i = 0; i < 70; i++) {
    g.beginPath();
    const x = az() * 256, y = az() * 256;
    g.moveTo(x, y);
    g.quadraticCurveTo(x + az() * 20, y + az() * 6, x + 10 + az() * 30, y + az() * 10 - 5);
    g.stroke();
  }
  papelTextura = c;
  return c;
}
let patronPapel: CanvasPattern | null = null;
function patron(g: G) {
  patronPapel ??= g.createPattern(papel(), 'repeat');
  return patronPapel!;
}

/** Hoja de tiquete (papel con textura, borde dentado arriba y sombra). */
export function hojaTiquete(g: G, r: Rect, resaltado = false, dientes = true) {
  g.save();
  g.shadowColor = resaltado ? 'rgba(255,182,39,0.95)' : 'rgba(40,20,10,0.35)';
  g.shadowBlur = resaltado ? 16 : 7;
  g.shadowOffsetY = resaltado ? 0 : 3;
  g.fillStyle = patron(g);
  g.beginPath();
  if (dientes) {
    const n = Math.max(6, Math.round(r.w / 12));
    g.moveTo(r.x, r.y + 4);
    for (let i = 0; i < n; i++) {
      const x0 = r.x + (r.w / n) * i;
      g.lineTo(x0 + r.w / n / 2, r.y);
      g.lineTo(x0 + r.w / n, r.y + 4);
    }
    g.lineTo(r.x + r.w, r.y + r.h - 6);
    g.quadraticCurveTo(r.x + r.w, r.y + r.h, r.x + r.w - 6, r.y + r.h);
    g.lineTo(r.x + 6, r.y + r.h);
    g.quadraticCurveTo(r.x, r.y + r.h, r.x, r.y + r.h - 6);
    g.closePath();
  } else rr(g, r.x, r.y, r.w, r.h, 7);
  g.fill();
  g.restore();
  // Franja de color arriba (como los tiquetes de cocina)
  g.fillStyle = 'rgba(232,67,79,0.12)';
  g.fillRect(r.x, r.y + 5, r.w, 3);
}

/** Recorte → <img> (para las tarjetas en HTML). */
const iconos = new Map<string, string>();
export function iconoHTML(id: string, tam: number) {
  const r = recorte(id);
  if (!r) return '';
  const clave = `${id}@${tam}`;
  let url = iconos.get(clave);
  if (!url) {
    const k = Math.min(1, (tam * 2) / Math.max(r.w, r.a));
    const c = document.createElement('canvas');
    c.width = Math.round(r.w * k);
    c.height = Math.round(r.a * k);
    const g = c.getContext('2d')!;
    spr(g, id, r.ax * k, r.ay * k, r.ref * r.ppm * k);
    url = c.toDataURL('image/png');
    iconos.set(clave, url);
  }
  return `<img class="ico-recorte" src="${url}" style="height:${tam}px" alt="">`;
}

/**
 * El ícono de cada restaurante para los menús, armado con los recortes: el wafle con fresa y crema; el vaso de
 * fresas con crema lleno, con crema batida y fresas encima; y el frappé con crema, cereza y pitillo.
 */
const iconosRest = new Map<string, string>();
export function iconoRestaurante(receta: 'wafles' | 'fresas' | 'frappes', tam: number) {
  const clave = `${receta}@${tam}`;
  let url = iconosRest.get(clave);
  if (!url) {
    const W = Math.round(tam * 2.4), H = Math.round(tam * 2.4);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d')!;
    const caja = (id: string, cx: number, cy: number, an: number, al: number) => iconoEn(g, id, cx * W, cy * H, an * W, al * H);
    let ok = true;
    if (receta === 'wafles') {
      ok = caja('wafle_clasica_1', 0.5, 0.6, 0.96, 0.7);
      caja('top_mantequilla', 0.5, 0.5, 0.22, 0.16);
      caja('top_fresa_entera', 0.3, 0.42, 0.3, 0.3);
      caja('top_chantilly', 0.62, 0.42, 0.34, 0.28);
      caja('top_fresa_mitad', 0.72, 0.56, 0.22, 0.22);
    } else {
      const vaso = receta === 'fresas' ? 'vasofresa_M' : 'vasofrappe_M';
      const r = recorte(vaso);
      if (r) {
        // El vaso lleno (lo de adentro va detrás del vidrio)
        const k = Math.min((0.62 * W) / r.w, (0.8 * H) / r.a);
        const w = r.w * k, h = r.a * k, x = (W - w) / 2, y = H * 0.18;
        g.save();
        g.beginPath();
        g.moveTo(x + w * 0.1, y + h * 0.12);
        g.lineTo(x + w * 0.9, y + h * 0.12);
        g.lineTo(x + w * 0.82, y + h * 0.95);
        g.lineTo(x + w * 0.18, y + h * 0.95);
        g.closePath();
        g.clip();
        g.fillStyle = lineal(g, 0, y, 0, y + h, receta === 'fresas'
          ? [[0, '#fff4ea'], [0.55, '#ffe0e4'], [1, '#f6b9c4']]
          : [[0, '#f3dcc0'], [0.5, '#c99a6e'], [1, '#8e5c3d']]);
        g.fillRect(x, y, w, h);
        if (receta === 'fresas') {
          for (let i = 0; i < 9; i++) {
            const fx = x + w * (0.25 + ((i * 37) % 50) / 100), fy = y + h * (0.35 + ((i * 53) % 55) / 100);
            caja('top_fresa_cuarto', fx / W, fy / H, 0.13, 0.13);
          }
        } else {
          g.fillStyle = 'rgba(255,255,255,0.18)';
          for (let i = 0; i < 6; i++) g.fillRect(x + w * (0.2 + i * 0.11), y + h * 0.25, w * 0.03, h * 0.65);
        }
        g.restore();
        iconoEn(g, vaso, W / 2, y + h / 2, w, h);
        if (receta === 'frappes') caja('pitillo_rosado', 0.62, 0.2, 0.12, 0.36);
        caja('top_chantilly', 0.5, 0.19, 0.6, 0.3);
        caja(receta === 'fresas' ? 'top_fresa_entera' : 'top_cereza', 0.52, 0.1, 0.24, 0.22);
        if (receta === 'fresas') caja('top_fresa_mitad', 0.32, 0.2, 0.18, 0.18);
      } else ok = false;
    }
    if (!ok) return iconoHTML(RECETA_ICONO[receta], tam);
    url = c.toDataURL('image/png');
    iconosRest.set(clave, url);
  }
  return `<img class="ico-recorte" src="${url}" style="height:${tam}px" alt="">`;
}
const RECETA_ICONO = { wafles: 'wafle_clasica_1', fresas: 'vasofresa_M', frappes: 'vasofrappe_M' } as const;

// ---------------------------------------------------------------------------------------------- Fondos de las estaciones
/** Dibuja una imagen de fondo cubriendo un rectángulo (anclada abajo o arriba). */
function cubrir(g: G, img: HTMLImageElement, x: number, y: number, w: number, h: number, ancla: 'arriba' | 'abajo' | 'centro' = 'centro') {
  const k = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * k, dh = img.naturalHeight * k;
  const dy = ancla === 'arriba' ? y : ancla === 'abajo' ? y + h - dh : y + (h - dh) / 2;
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.drawImage(img, x + (w - dw) / 2, dy, dw, dh);
  g.restore();
}

/** ¿Ya están las imágenes del fondo de las estaciones? (si no, se repinta cuando lleguen). */
export function fondoListo(m: Motor) {
  const r = m.receta.id;
  return !pendiente([`fondo_cocina_${r}`, `fondo_meson_${r}`]);
}

/** Pared de cocina profesional y el mesón donde se trabaja (lo usan todas las estaciones). */
export function fondoEstacion(m: Motor, g: G, mesa: number, o: { campana?: boolean } = {}) {
  const { W, H } = m;
  const r = m.receta.id;
  const pared = fondo(`fondo_cocina_${r}`);
  if (pared) {
    cubrir(g, pared.img, 0, 0, W, mesa + 4, 'abajo');
  } else paredRespaldo(m, g, mesa);
  if (o.campana) campana(m, g);
  const meson = fondo(`fondo_meson_${r}`);
  if (meson) cubrir(g, meson.img, 0, mesa - 6, W, H - mesa + 6, 'arriba');
  else mesonRespaldo(m, g, mesa);
  // Luz cálida que baja de las lámparas
  g.fillStyle = radial(g, W * 0.45, mesa - 40, 20, W * 0.6, [[0, 'rgba(255,214,150,0.16)'], [1, 'rgba(255,214,150,0)']]);
  g.fillRect(0, RIEL, W, H - RIEL);
}

function campana(m: Motor, g: G) {
  const { W } = m;
  const x0 = 250, x1 = W - 30;
  g.fillStyle = lineal(g, 0, RIEL, 0, RIEL + 52, [[0, '#9aa3a8'], [0.4, '#dfe5e8'], [1, '#b9c1c5']]);
  g.beginPath();
  g.moveTo(x0, RIEL);
  g.lineTo(x1, RIEL);
  g.lineTo(x1 - 40, RIEL + 46);
  g.lineTo(x0 + 40, RIEL + 46);
  g.closePath();
  g.fill();
  g.fillStyle = 'rgba(40,50,55,0.35)';
  g.fillRect(x0 + 40, RIEL + 46, x1 - x0 - 80, 5);
  for (let x = x0 + 70; x < x1 - 60; x += 26) {
    g.fillStyle = 'rgba(60,70,75,0.35)';
    rr(g, x, RIEL + 14, 14, 20, 4);
    g.fill();
  }
}

function paredRespaldo(m: Motor, g: G, mesa: number) {
  const { W } = m;
  g.fillStyle = '#eef2f3';
  g.fillRect(0, 0, W, mesa);
  const aw = 64, ah = 32;
  for (let y = 0; y < mesa; y += ah) {
    const off = (y / ah) % 2 ? aw / 2 : 0;
    for (let x = -aw; x < W + aw; x += aw) {
      g.fillStyle = lineal(g, 0, y, 0, y + ah, [[0, '#ffffff'], [1, '#e1e8eb']]);
      rr(g, x + off + 2, y + 2, aw - 4, ah - 4, 5);
      g.fill();
    }
  }
  g.fillStyle = m.receta.tema.acento;
  g.fillRect(0, mesa - 86, W, 14);
  g.fillStyle = aclarar(m.receta.tema.acento, 0.4);
  g.fillRect(0, mesa - 72, W, 4);
}

function mesonRespaldo(m: Motor, g: G, mesa: number) {
  const { W, H } = m;
  g.fillStyle = lineal(g, 0, mesa, 0, H, [[0, '#dfe4e7'], [0.06, '#c3cace'], [0.08, '#8f979c'], [0.1, '#c7cdd1'], [1, '#9aa2a7']]);
  g.fillRect(0, mesa, W, H - mesa);
  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.fillRect(0, mesa + 2, W, 3);
  for (let x = 30; x < W; x += 140) {
    g.fillStyle = 'rgba(255,255,255,0.1)';
    g.fillRect(x, mesa + 16, 60, H - mesa);
  }
}

// ---------------------------------------------------------------------------------------------- Comedor (pedidos)
/** Dónde va el mostrador (su borde de arriba). */
export const mostradorY = (m: Motor) => m.H - BARRA - 104;

export function fondoPedidos(m: Motor, g: G): boolean {
  const { W, H } = m;
  const r = m.receta.id;
  const sala = fondo(`fondo_sala_${r}`);
  const y = mostradorY(m);
  if (sala) cubrir(g, sala.img, 0, 0, W, y + 30, 'abajo');
  else salaRespaldo(m, g);
  void H;
  return !pendiente([`fondo_sala_${r}`]);
}

function salaRespaldo(m: Motor, g: G) {
  const { W } = m;
  const tema = m.receta.tema;
  const piso = mostradorY(m) - 70;
  g.fillStyle = lineal(g, 0, 0, 0, piso, [[0, aclarar(tema.pared, 0.25)], [1, tema.pared]]);
  g.fillRect(0, 0, W, piso);
  g.fillStyle = conAlfa('#ffffff', 0.16);
  for (let x = 0; x < W; x += 46) g.fillRect(x, 0, 18, piso);
  // Friso de madera
  g.fillStyle = lineal(g, 0, piso - 120, 0, piso, [[0, '#a8724a'], [1, '#7a4c30']]);
  g.fillRect(0, piso - 120, W, 120);
  g.fillStyle = 'rgba(255,255,255,0.18)';
  g.fillRect(0, piso - 122, W, 4);
  for (let x = 30; x < W; x += 120) {
    g.strokeStyle = 'rgba(60,30,20,0.25)';
    g.lineWidth = 3;
    rr(g, x, piso - 105, 90, 90, 6);
    g.stroke();
  }
  for (const vx of [W * 0.1, W * 0.76]) {
    const vw = 210, vh = 180, vy = RIEL + 40;
    g.fillStyle = '#6a4632';
    rr(g, vx - 12, vy - 12, vw + 24, vh + 24, 14);
    g.fill();
    g.fillStyle = lineal(g, 0, vy, 0, vy + vh, [[0, '#8fd3ff'], [1, '#e4f6ff']]);
    g.fillRect(vx, vy, vw, vh);
    g.fillStyle = '#5fae5a';
    for (let i = 0; i < 6; i++) {
      elipse(g, vx + 20 + i * 36, vy + vh - 20, 30, 26);
      g.fill();
    }
    g.fillStyle = '#6a4632';
    g.fillRect(vx + vw / 2 - 4, vy, 8, vh);
    g.fillRect(vx, vy + vh / 2 - 4, vw, 8);
  }
  // Tablero del menú
  const mx = W * 0.35, my = RIEL + 26, mw = W * 0.3, mh = 160;
  g.fillStyle = '#7a5236';
  rr(g, mx - 12, my - 12, mw + 24, mh + 24, 14);
  g.fill();
  g.fillStyle = '#2f3b36';
  rr(g, mx, my, mw, mh, 8);
  g.fill();
  texto(g, m.receta.titulo(m.duenoCocina.nombre), mx + mw / 2, my + 44, { tam: 34, color: '#fff7e6', max: mw - 30 });
  texto(g, `Día ${m.dia} · ${m.neutro ? 'hecho con sazón' : 'hecho con amor'}`, mx + mw / 2, my + 92, { tam: 22, color: '#ffd9a0', peso: 700 });
  texto(g, m.neutro ? '★ ★ ★' : '♥ ★ ♥', mx + mw / 2, my + 128, { tam: 22, color: m.neutro ? '#ffd46b' : '#ff9fb4' });
  // Piso
  g.fillStyle = tema.piso;
  g.fillRect(0, piso, W, mostradorY(m) + 40 - piso);
  for (let x = 0; x < W; x += 60)
    for (let y = piso; y < mostradorY(m) + 40; y += 40)
      if ((x / 60 + (y - piso) / 40) % 2 < 1) {
        g.fillStyle = oscurecer(tema.piso, 0.08);
        g.fillRect(x, y, 60, 40);
      }
  g.fillStyle = 'rgba(0,0,0,0.12)';
  g.fillRect(0, piso, W, 8);
}

/** El mostrador (encima de los invitados de la fila). */
function mostrador(m: Motor, g: G) {
  const { W, H } = m;
  const y = mostradorY(m);
  const img = fondo(`fondo_mostrador_${m.receta.id}`);
  if (img) {
    cubrir(g, img.img, 0, y - 18, W, H - BARRA - y + 18, 'arriba');
    return;
  }
  g.fillStyle = lineal(g, 0, y, 0, H - BARRA, [[0, '#9a6340'], [1, '#6e4128']]);
  g.fillRect(0, y + 18, W, H - BARRA - y);
  g.fillStyle = lineal(g, 0, y, 0, y + 22, [[0, '#f6ece2'], [1, '#d9c6b2']]);
  rr(g, -10, y, W + 20, 24, 8);
  g.fill();
  for (let x = 40; x < W; x += 180) {
    g.fillStyle = 'rgba(0,0,0,0.1)';
    rr(g, x, y + 36, 130, 42, 8);
    g.fill();
  }
}

/** La pose del invitado según lo que esté haciendo. */
function poseDe(m: Motor, e: InvDia, i: number, camina: boolean): Pose {
  if (camina) return Math.floor(m.reloj / 0.2 + i) % 2 ? 'camina_a' : 'camina_b';
  if (e.estado === 'saliendo') return e.animo === 'encantado' ? 'encantado' : e.animo === 'feliz' ? 'contento' : e.animo === 'bravo' ? 'bravo' : 'regular';
  if (e.animo === 'bravo') return Math.floor(m.reloj * 2.5 + i) % 3 === 0 ? 'bravo' : 'impaciente';
  if (e.animo === 'espera') return Math.floor(m.reloj * 1.2 + i) % 4 === 0 ? 'impaciente' : 'espera';
  return 'feliz';
}

/** Dibuja a un invitado con los pies en (x, y) y alto `h`, respirando (o caminando con rebote). */
export function dibujarInvitado(m: Motor, g: G, e: InvDia, i: number, x: number, y: number, h: number, pose?: Pose) {
  const inv = m.def(e);
  const camina = Math.abs((m.metas[i] ?? x) - x) > 2;
  const p = pose ?? poseDe(m, e, i, camina);
  let img = m.sprite(inv, p);
  if (!img.complete || !img.naturalWidth) img = m.sprite(inv, 'feliz');
  if (!img.complete || !img.naturalWidth) return;
  const rebote = camina ? Math.abs(Math.sin(m.reloj * 9 + i)) * 8 : 0;
  const resp = camina ? 0 : Math.sin(m.reloj * 2.2 + e.llega) * 2.5;
  const w = (img.naturalWidth / img.naturalHeight) * h;
  sombra(g, x, y, w * 0.4, 14, 0.3);
  // Mira hacia donde camina (los recortes miran un poquito a la derecha)
  const izq = camina && (m.metas[i] ?? x) < x;
  g.save();
  g.translate(x, y - rebote);
  if (izq) g.scale(-1, 1);
  g.drawImage(img, -w / 2, -h - resp, w, h + resp * 0.4);
  g.restore();
  if (e.animo === 'bravo' && e.estado !== 'saliendo' && !camina) vaporRabia(g, x + w * 0.28, y - h * 0.9, m.reloj);
  if (inv.especial === 'pareja' && e.estado !== 'ido') {
    for (let k = 0; k < 2; k++) {
      const t = (m.reloj * 0.6 + k * 0.5) % 1;
      g.globalAlpha = Math.sin(t * Math.PI);
      g.fillStyle = '#ff6b8f';
      g.save();
      g.translate(x - w * 0.3 + k * w * 0.6, y - h * 0.85 - t * 40);
      g.scale(1.6, 1.6);
      corazon(g);
      g.fill();
      g.restore();
    }
    g.globalAlpha = 1;
  }
  if (inv.especial === 'critico' && e.estado !== 'ido') {
    g.fillStyle = '#ffd23f';
    for (let k = 0; k < 3; k++) {
      g.save();
      g.translate(x - 26 + k * 26, y - h - 18 + Math.sin(m.reloj * 3 + k) * 3);
      estrella(g, 9);
      g.fill();
      g.restore();
    }
  }
}

function vaporRabia(g: G, x: number, y: number, t: number) {
  for (let k = 0; k < 2; k++) {
    const f = (t * 1.4 + k * 0.5) % 1;
    g.globalAlpha = (1 - f) * 0.8;
    g.fillStyle = '#ffffff';
    elipse(g, x + k * 14, y - f * 34, 8 + f * 10, 6 + f * 8);
    g.fill();
  }
  g.globalAlpha = 1;
  // Marquita de enojo (cuatro curvitas rojas)
  g.strokeStyle = '#e8434f';
  g.lineWidth = 4;
  g.lineCap = 'round';
  const s = 1 + Math.sin(t * 8) * 0.1;
  for (let k = 0; k < 4; k++) {
    g.save();
    g.translate(x - 10, y + 6);
    g.rotate((k * Math.PI) / 2);
    g.scale(s, s);
    g.beginPath();
    g.moveTo(4, 2);
    g.quadraticCurveTo(10, 4, 12, 12);
    g.stroke();
    g.restore();
  }
}

export function dibujarPedidos(m: Motor, g: G) {
  const { W, H } = m;
  const s = m.s;
  const my = mostradorY(m);
  // Los que esperan su plato (atrás, más chiquitos), en las mesitas del comedor
  s.invitados.forEach((e, i) => {
    if (e.estado !== 'esperando' && !(e.estado === 'saliendo' && (m.xs[i] ?? W) < W + 100)) return;
    if (e.estado === 'saliendo') return;
    dibujarInvitado(m, g, e, i, m.xs[i] ?? W + 160, my - 6, 214);
  });
  // La fila (adelante, contra el mostrador) y los que salen
  s.invitados.forEach((e, i) => {
    if (e.estado !== 'fila' && e.estado !== 'pidiendo' && e.estado !== 'saliendo') return;
    const x = m.xs[i] ?? W + 160;
    const primero = (e.estado === 'fila' || e.estado === 'pidiendo') && Math.abs(x - m.puestoFila(0)) < 30;
    dibujarInvitado(m, g, e, i, x, my + 30, primero ? 330 : 280);
  });
  mostrador(m, g);
  // Campanita, impresora y frasco de propinas sobre el mostrador
  const cx = W * 0.52 - 300;
  if (!spr(g, 'campanita', cx, my + 18, 26)) {
    g.fillStyle = '#c9a24a';
    g.beginPath();
    g.arc(cx, my + 4, 26, Math.PI, 0);
    g.fill();
  }
  const ix = W * 0.52 + 190, iy = my + 26;
  spr(g, 'impresora', ix, iy, 64);
  // El frasco de propinas en la punta izquierda del mostrador (no tapa la fila, que va a la derecha)
  const jx = 74;
  if (!spr(g, 'propinas', jx, my + 28, 120)) {
    g.fillStyle = 'rgba(220,240,255,0.55)';
    rr(g, jx - 30, my - 58, 60, 66, 12);
    g.fill();
  }
  pildora(g, `🪙 ${s.propinas}`, jx, my - 108, '#3a2418', '#ffd46b');
  // Tiquete saliendo de la impresora
  if (m.impreso) dibujarImpresion(m, g, ix, iy);
  // Botón de tomar el pedido (sobre el primero de la fila)
  const e = s.invitados.find((x, i) => x.estado === 'fila' && Math.abs((m.xs[i] ?? 0) - m.puestoFila(0)) < 8);
  const pidiendo = s.invitados.some((x) => x.estado === 'pidiendo');
  m.botonTomar = null;
  if (e && !pidiendo && s.fase === 'jugando') {
    // En el frente del mostrador, justo delante del que está pidiendo
    const r = { x: m.puestoFila(0) - 135, y: my + 22, w: 270, h: 62 };
    m.botonTomar = r;
    const lat = 1 + Math.sin(m.reloj * 5) * 0.035;
    g.save();
    g.translate(r.x + r.w / 2, r.y + r.h / 2);
    g.scale(lat, lat);
    g.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));
    m.boton(r, '📝 Tomar pedido', '#ffb627', { tam: 28 });
    g.restore();
  }
  // Globos de lo que dicen
  s.invitados.forEach((e2, i) => {
    if (!e2.frase || !['fila', 'pidiendo', 'esperando'].includes(e2.estado)) return;
    const x = m.xs[i] ?? W;
    const lejos = e2.estado === 'esperando';
    globo(m, g, e2.frase.texto, x, lejos ? my - 230 : my - 330);
  });
  if (!s.invitados.some((i) => i.estado === 'fila' || i.estado === 'pidiendo') && s.invitados.some((i) => i.estado === 'fuera') && s.fase === 'jugando')
    pildora(g, 'Esperando al próximo invitado…', W * 0.52, my - 70, 'rgba(40,24,16,0.72)', '#fff3d6', 22);
  void H;
}

/** El tiquete sale de la impresora de abajo hacia arriba, se va imprimiendo y luego vuela al riel. */
function dibujarImpresion(m: Motor, g: G, ix: number, iy: number) {
  const imp = m.impreso!;
  const e = m.s.invitados[imp.inv];
  const t = m.reloj - imp.t0;
  // Se imprime al ritmo en que el invitado dicta (unos hablan más despacio que otros)
  const dicta = e?.dicta ?? 2.4;
  if (!e || t > dicta + 0.8) {
    m.impreso = null;
    return;
  }
  const pedido = e.pedido ?? m.s.tickets.find((x) => x.id === e.ticket)?.pedido;
  if (!pedido) return;
  const w = 244, hTotal = m.H - RIEL - BARRA - 120;
  const sale = Math.min(1, t / (dicta - 0.2));
  const h = 40 + (hTotal - 40) * sale;
  let x = ix - w / 2, y = iy - 30 - h;
  // Al final vuela al riel (arriba a la izquierda) encogiéndose
  if (t > dicta) {
    const k = Math.min(1, (t - dicta) / 0.6);
    const e2 = k * k * (3 - 2 * k);
    const dx = m.rectTicket(Math.max(0, m.s.tickets.length - 1)).x - x;
    g.save();
    g.translate(x + dx * e2, y + (8 - y) * e2);
    g.scale(1 - 0.55 * e2, 1 - 0.6 * e2);
    g.globalAlpha = 1 - e2 * 0.6;
    x = 0;
    y = 0;
  } else g.save();
  hojaTiquete(g, { x, y, w, h }, false, false);
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  texto(g, `#${m.s.numero + (e.pedido ? 1 : 0)} · ${m.def(e).nombre}`, x + w / 2, y + 22, { tam: 18, color: '#8a4a2a', max: w - 16, peso: 700 });
  // Lo que ya salió de la impresora (de abajo para arriba, como el papel térmico)
  m.receta.dibujarTicket(g, pedido as never, { x, y: y + 38, w, h: hTotal - 42 }, m);
  g.restore();
  // La ranura tapa el papel que todavía está adentro
  if (t <= dicta) spr(g, 'impresora', ix, iy, 64);
}

export function pildora(g: G, t: string, x: number, y: number, fondoC: string, color: string, tam = 22) {
  g.font = `800 ${tam}px Nunito, system-ui, sans-serif`;
  const w = g.measureText(t).width + tam * 1.3;
  g.fillStyle = fondoC;
  rr(g, x - w / 2, y - tam * 0.95, w, tam * 1.9, tam * 0.95);
  g.fill();
  texto(g, t, x, y + 1, { tam, color });
}

function globo(m: Motor, g: G, t: string, x: number, y: number) {
  g.font = '800 22px Nunito, system-ui, sans-serif';
  const w = Math.min(380, g.measureText(t).width + 38);
  const bx = Math.max(10, Math.min(m.W - w - 10, x - w / 2));
  g.save();
  g.shadowColor = 'rgba(40,20,10,0.25)';
  g.shadowBlur = 8;
  g.shadowOffsetY = 3;
  g.fillStyle = 'rgba(255,255,255,0.97)';
  rr(g, bx, y - 50, w, 48, 20);
  g.fill();
  g.restore();
  g.fillStyle = 'rgba(255,255,255,0.97)';
  g.beginPath();
  g.moveTo(x - 10, y - 4);
  g.lineTo(x, y + 14);
  g.lineTo(x + 12, y - 4);
  g.fill();
  texto(g, t, bx + w / 2, y - 26, { tam: 22, color: '#4a2a10', max: w - 24 });
}

// ---------------------------------------------------------------------------------------------- Riel y barra
let rielCache: { w: number; c: HTMLCanvasElement; k: number } | null = null;
function fondoRiel(m: Motor, g: G) {
  const W = m.W;
  if (!rielCache || rielCache.w !== W || rielCache.k !== m.k) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(W * m.k);
    c.height = Math.ceil(RIEL * m.k);
    const q = c.getContext('2d')!;
    q.scale(m.k, m.k);
    // Tablero de madera oscura con vetas
    q.fillStyle = lineal(q, 0, 0, 0, RIEL, [[0, '#5a3d2c'], [1, '#3b271c']]);
    q.fillRect(0, 0, W, RIEL);
    q.strokeStyle = 'rgba(0,0,0,0.18)';
    q.lineWidth = 1.5;
    for (let y = 8; y < RIEL; y += 9) {
      q.beginPath();
      q.moveTo(0, y);
      for (let x = 0; x <= W; x += 80) q.lineTo(x, y + Math.sin(x * 0.013 + y) * 2.5);
      q.stroke();
    }
    q.fillStyle = 'rgba(255,255,255,0.05)';
    for (let x = 0; x < W; x += 220) q.fillRect(x, 0, 2, RIEL);
    // Riel de acero
    q.fillStyle = lineal(q, 0, 2, 0, 16, [[0, '#f2f5f7'], [0.5, '#b9c1c5'], [1, '#7f878c']]);
    q.fillRect(0, 3, W, 12);
    q.fillStyle = 'rgba(0,0,0,0.35)';
    q.fillRect(0, 15, W, 2);
    // Sombra abajo
    q.fillStyle = lineal(q, 0, RIEL - 8, 0, RIEL, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.35)']]);
    q.fillRect(0, RIEL - 8, W, 8);
    rielCache = { w: W, c, k: m.k };
  }
  g.drawImage(rielCache.c, 0, 0, W, RIEL);
}

/** Recorte de la cara en los recortes del chef (el gorro ocupa la parte de arriba). */
const CARA_CHEF = [0.14, 0.31, 0.72];

function carita(m: Motor, g: G, src: HTMLImageElement, x: number, y: number, r: number, borde = '#fff3e4', recorte = [0.14, 0.06, 0.72]) {
  g.fillStyle = borde;
  elipse(g, x, y, r + 3, r + 3);
  g.fill();
  if (!src.complete || !src.naturalWidth) return;
  g.save();
  elipse(g, x, y, r, r);
  g.clip();
  g.fillStyle = '#fff8ee';
  g.fill();
  const iw = src.naturalWidth, ih = src.naturalHeight;
  const sw = iw * recorte[2];
  g.drawImage(src, iw * recorte[0], ih * recorte[1], sw, sw, x - r * 1.05, y - r * 1.05, r * 2.1, r * 2.1);
  g.restore();
}

export function dibujarRiel(m: Motor, g: G) {
  const { W } = m;
  fondoRiel(m, g);
  const otros = m.otros();
  m.s.tickets.forEach((t, i) => {
    const r = m.rectTicket(i);
    const sel = t.id === m.activoId;
    // Recién colgado: se mece un poquito
    const colgado = m.colgados.get(t.id);
    const edad = colgado === undefined ? 9 : m.reloj - colgado;
    const caida = edad < 0.35 ? (1 - edad / 0.35) * -60 : 0;
    const giro = edad < 1.6 ? Math.sin(edad * 14) * Math.exp(-edad * 3) * 0.12 : 0;
    g.save();
    g.translate(r.x + r.w / 2, 10 + caida);
    g.rotate(giro);
    const rr2 = { x: -r.w / 2, y: (sel ? 6 : 2), w: r.w, h: r.h - 4 };
    hojaTiquete(g, rr2, sel);
    // Ganchito
    g.fillStyle = lineal(g, -10, 0, 10, 0, [[0, '#9aa3a8'], [0.5, '#eef2f4'], [1, '#8a9398']]);
    rr(g, -11, -6, 22, 14, 4);
    g.fill();
    const e = m.s.invitados[t.inv];
    texto(g, `#${t.numero}`, rr2.x + 10, rr2.y + 22, { tam: 19, color: '#8a4a2a', alinear: 'left', peso: 800 });
    if (e) {
      carita(m, g, m.sprite(m.def(e), 'feliz'), rr2.x + rr2.w - 26, rr2.y + 30, 20);
      texto(g, m.def(e).nombre.split(/[ ,]/)[0], 0, rr2.y + 58, { tam: 15, color: '#6a4a3a', peso: 700, max: r.w - 12 });
      const v = m.puntajeEspera(e, m.t);
      g.fillStyle = '#eadccd';
      rr(g, rr2.x + 9, rr2.y + rr2.h - 17, rr2.w - 18, 9, 4.5);
      g.fill();
      g.fillStyle = v >= 70 ? '#5cc26a' : v >= 40 ? '#f2b52a' : '#e8434f';
      rr(g, rr2.x + 9, rr2.y + rr2.h - 17, (rr2.w - 18) * (v / 100), 9, 4.5);
      g.fill();
    }
    // Juntos: la carita de cada uno en el tiquete que tiene escogido
    otros.filter((o) => o.p.act === t.id).forEach((o, k) => {
      carita(m, g, m.imgChef(o.j, 'feliz'), rr2.x + 14 + k * 18, rr2.y + rr2.h - 26, 13, o.color, CARA_CHEF);
    });
    g.restore();
  });
  if (!m.s.tickets.length)
    texto(g, 'Aquí se cuelgan los pedidos', 24, RIEL / 2 + 6, { tam: 20, color: 'rgba(255,240,220,0.5)', alinear: 'left', peso: 700 });
  // Día, invitados atendidos y propinas, con la carita del chef (y la de los demás cuando cocinan juntos)
  const hechos = m.s.invitados.filter((e) => e.estado === 'comiendo' || e.estado === 'saliendo' || e.estado === 'ido').length;
  const xr = W - 190 - Math.min(3, otros.length) * 52;
  texto(g, `Día ${m.dia} · ${hechos}/${m.s.invitados.length}`, xr, 36, { tam: 22, color: '#fff3e0', alinear: 'right' });
  texto(g, `🪙 ${m.s.propinas}`, xr, 70, { tam: 22, color: '#ffd46b', alinear: 'right' });
  const pose = m.reloj < m.caraChef.hasta ? m.caraChef.pose : 'concentrado';
  const yo = m.imgChef(m.yo, pose);
  carita(m, g, yo, W - 142, RIEL / 2, 38, '#ffd9a8', CARA_CHEF);
  otros.slice(0, 3).forEach((o, k) => carita(m, g, m.imgChef(o.j, 'feliz'), W - 206 - k * 52, RIEL / 2 + 14, 24, o.color, CARA_CHEF));
}

export function dibujarBarra(m: Motor, g: G) {
  const { W, H } = m;
  // Canto del mesón: madera clara con borde
  g.fillStyle = lineal(g, 0, H - BARRA, 0, H, [[0, '#7a5038'], [0.08, '#5e3b28'], [1, '#3a2418']]);
  g.fillRect(0, H - BARRA, W, BARRA);
  g.fillStyle = 'rgba(255,220,180,0.25)';
  g.fillRect(0, H - BARRA, W, 3);
  const nombres = [{ nombre: 'Pedidos', icono: 'campanita', emoji: '🧾' }, ...m.estaciones.map((e) => ({ nombre: e.nombre, icono: e.icono, emoji: e.emoji }))];
  const hayFila = m.s.invitados.some((e) => e.estado === 'fila');
  const otros = m.otros();
  m.pestanas().forEach((r, i) => {
    const act = i === m.actual;
    const alerta = i === 0 ? hayFila : !!m.estaciones[i - 1].alerta?.();
    const y = r.y + (act ? -6 : 0);
    g.save();
    if (act) {
      g.shadowColor = 'rgba(255,182,39,0.85)';
      g.shadowBlur = 16;
    }
    g.fillStyle = act ? lineal(g, 0, y, 0, y + r.h, [[0, '#ffe3a3'], [1, '#ffb627']]) : lineal(g, 0, y, 0, y + r.h, [[0, '#fff6ea'], [1, '#ecd9c4']]);
    rr(g, r.x, y, r.w, r.h, 16);
    g.fill();
    g.restore();
    g.strokeStyle = act ? '#b9761a' : 'rgba(90,60,40,0.35)';
    g.lineWidth = 2;
    rr(g, r.x, y, r.w, r.h, 16);
    g.stroke();
    const tieneIcono = hay(nombres[i].icono);
    if (tieneIcono) iconoEn(g, nombres[i].icono, r.x + 34, y + r.h / 2 + 2, 54, 48);
    texto(g, tieneIcono ? nombres[i].nombre : `${nombres[i].emoji} ${nombres[i].nombre}`, r.x + (tieneIcono ? 62 : r.w / 2), y + r.h / 2 + 2,
      { tam: 23, color: '#4a2a10', max: r.w - (tieneIcono ? 70 : 16), alinear: tieneIcono ? 'left' : 'center' });
    if (alerta && !act) {
      const k = 0.6 + 0.4 * Math.sin(m.reloj * 8);
      g.fillStyle = `rgba(232,67,79,${k})`;
      elipse(g, r.x + r.w - 10, y + 8, 10, 10);
      g.fill();
      texto(g, '!', r.x + r.w - 10, y + 9, { tam: 14, color: '#fff' });
    }
    otros.filter((o) => o.p.est === i).forEach((o, k) => carita(m, g, m.imgChef(o.j, 'feliz'), r.x + r.w - 14 - k * 26, y - 4, 15, o.color, CARA_CHEF));
  });
}

/** Tamaño de cada ícono de pestaña (para que todos se vean del mismo alto). */
/** Dibuja el recorte `id` centrado en (cx, cy) y metido en una caja de an × al (el cuchillo largo no se sale). */
export function iconoEn(g: G, id: string, cx: number, cy: number, an: number, al: number) {
  const r = recorte(id);
  if (!r) return false;
  const k = Math.min(an / r.w, al / r.a);
  return spr(g, id, cx - (r.w / 2 - r.ax) * k, cy - (r.a / 2 - r.ay) * k, r.ref * r.ppm * k);
}

/** El tiquete escogido, grande, a la derecha de las estaciones que lo usan. */
export function dibujarTicketGrande(m: Motor, g: G) {
  const r = m.cajaTicket;
  const a = m.activo;
  hojaTiquete(g, r, false);
  if (!a) {
    texto(g, 'Toca un pedido', r.x + r.w / 2, r.y + r.h / 2 - 20, { tam: 24, color: '#9a7a68' });
    texto(g, 'del riel de arriba', r.x + r.w / 2, r.y + r.h / 2 + 14, { tam: 24, color: '#9a7a68' });
    return;
  }
  const e = m.s.invitados[a.inv];
  if (e) carita(m, g, m.sprite(m.def(e), 'feliz'), r.x + 26, r.y + 26, 17);
  texto(g, `#${a.numero} · ${e ? m.def(e).nombre : ''}`, r.x + 50, r.y + 26, { tam: 18, color: '#8a4a2a', max: r.w - 60, alinear: 'left', peso: 800 });
  g.strokeStyle = 'rgba(160,120,90,0.45)';
  g.setLineDash([5, 4]);
  g.beginPath();
  g.moveTo(r.x + 10, r.y + 46);
  g.lineTo(r.x + r.w - 10, r.y + 46);
  g.stroke();
  g.setLineDash([]);
  m.receta.dibujarTicket(g, a.pedido, { x: r.x, y: r.y + 50, w: r.w, h: r.h - 54 }, m);
}

export function dibujarPista(m: Motor, g: G, t: string) {
  g.font = '800 23px Nunito, system-ui, sans-serif';
  const w = Math.min(m.W - 40, g.measureText(t).width + 56);
  const x = (m.W - w) / 2, y = RIEL + 12;
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.3)';
  g.shadowBlur = 10;
  g.fillStyle = 'rgba(40,24,16,0.88)';
  rr(g, x, y, w, 46, 23);
  g.fill();
  g.restore();
  g.strokeStyle = 'rgba(255,214,140,0.5)';
  g.lineWidth = 2;
  rr(g, x, y, w, 46, 23);
  g.stroke();
  texto(g, t, m.W / 2, y + 24, { tam: 23, color: '#fff3d6', max: w - 30 });
}

/** Juntos: la mano de cada uno de los demás cuando está en la misma estación (un aro de su color y su carita). */
export function dibujarManoOtro(m: Motor, g: G) {
  for (const { j, p: o, color } of m.otros()) {
    if (o.est !== m.actual || !o.dedo) continue;
    const x = o.x * m.W, y = o.y * m.H;
    const k = 1 + Math.sin(m.reloj * 8 + j.puesto) * 0.08;
    g.globalAlpha = 0.85;
    g.strokeStyle = color;
    g.lineWidth = 4;
    elipse(g, x, y, 26 * k, 26 * k);
    g.stroke();
    g.globalAlpha = 1;
    carita(m, g, m.imgChef(j, 'feliz'), x + 26, y - 26, 16, color, CARA_CHEF);
  }
}

// ---------------------------------------------------------------------------------------------- La calificación
const LETRERO = (total: number) => (total >= 95 ? '¡PERFECTO!' : total >= 85 ? '¡DELICIOSO!' : total >= 70 ? '¡MUY BIEN!' : total >= 50 ? 'REGULAR' : '¡AY, NO!');
const COLOR_TOTAL = (total: number) => (total >= 85 ? '#2f9a3f' : total >= 70 ? '#4d9a2f' : total >= 50 ? '#c07a10' : '#c0303c');
const T_CATS = 1.5;
let monedasDe = -1;
const T_CAT = 0.32;

/** Los sonidos del juicio, a tiempo con la animación. */
export function sonarJuicio(m: Motor, j: JuicioDia) {
  const n = m.s.juicio?.n;
  const vivo = () => m.s.juicio?.n === n;
  [0.45, 0.85, 1.25].forEach((t) => setTimeout(() => vivo() && sonidos.mordisco(), t * 1000));
  j.cats.forEach((_, i) => setTimeout(() => vivo() && sonidos.tic(i), (T_CATS + i * T_CAT + 0.2) * 1000));
  const tTotal = T_CATS + j.cats.length * T_CAT + 0.2;
  setTimeout(() => {
    if (!vivo()) return;
    sonidos.sello();
    if (j.total >= 70) sonidos.bien();
    else sonidos.mal();
  }, tTotal * 1000);
  setTimeout(() => vivo() && sonidos.caja(), (tTotal + 0.6) * 1000);
  if (j.total >= 90) setTimeout(() => vivo() && [1046, 1318, 1568, 2093].forEach((f, i) => nota(f, 0.25, i * 0.07, 'sine', 0.04)), (tTotal + 0.3) * 1000);
}

export function dibujarJuicio(m: Motor, g: G, j: JuicioDia, t: number) {
  const { W, H } = m;
  const a = Math.min(1, t / 0.3);
  g.fillStyle = `rgba(20,12,8,${0.68 * a})`;
  g.fillRect(0, 0, W, H);
  const pw = Math.min(W - 50, 1240), ph = H - 70;
  const px = (W - pw) / 2, py = 36 + (1 - a) * 70;
  // Panel: mantel de cuadritos con un reflector
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.45)';
  g.shadowBlur = 30;
  g.fillStyle = lineal(g, 0, py, 0, py + ph, [[0, '#fff9f0'], [1, '#f1dfc8']]);
  rr(g, px, py, pw, ph, 30);
  g.fill();
  g.restore();
  g.save();
  rr(g, px, py, pw, ph, 30);
  g.clip();
  g.fillStyle = conAlfa(m.receta.tema.acento, 0.07);
  for (let x = px; x < px + pw; x += 44) g.fillRect(x, py, 22, ph);
  for (let y = py; y < py + ph; y += 44) g.fillRect(px, y, pw, 22);
  g.fillStyle = radial(g, px + pw * 0.24, py + ph * 0.55, 30, pw * 0.36, [[0, 'rgba(255,240,200,0.65)'], [1, 'rgba(255,240,200,0)']]);
  g.fillRect(px, py, pw, ph);
  g.restore();
  // El plato (bota un poquito al llegar)
  const cx = px + pw * 0.24, cy = py + ph * 0.6;
  const llega = Math.min(1, t / 0.45);
  const bote = (1 - llega) * -60 + Math.sin(Math.min(1, t / 0.6) * Math.PI) * -6;
  g.save();
  g.translate(0, bote);
  m.receta.dibujarPlato(g, j.ticket, cx, cy, 1, m);
  g.restore();
  const e = m.s.invitados[j.ticket.inv];
  const inv = e ? m.def(e) : null;
  texto(g, inv?.nombre ?? '', cx, py + 40, { tam: 28, color: '#6a3a22', max: pw * 0.4 });
  if (j.por !== m.yo.id && m.enPareja) texto(g, `(lo entregó ${m.nombreJugador(j.por)})`, cx, py + 72, { tam: 18, color: '#9a6a4a', peso: 700 });
  // Las barras de cada parte
  const bx = px + pw * 0.43, bw = pw * 0.22;
  j.cats.forEach((c, i) => {
    const k = Math.max(0, Math.min(1, (t - T_CATS - i * T_CAT) / 0.4));
    if (k <= 0) return;
    const y = py + 66 + i * 78;
    g.globalAlpha = Math.min(1, k * 2);
    texto(g, c.nombre, bx, y, { tam: 24, color: '#5a3a28', alinear: 'left' });
    g.fillStyle = '#e8d8c6';
    rr(g, bx, y + 18, bw, 26, 13);
    g.fill();
    const v = c.valor * (1 - Math.pow(1 - k, 3));
    g.fillStyle = lineal(g, 0, y + 18, 0, y + 44, v >= 70 ? [[0, '#86dd8f'], [1, '#43a851']] : v >= 40 ? [[0, '#ffd36b'], [1, '#e19a12']] : [[0, '#ff7a84'], [1, '#d02e3c']]);
    rr(g, bx, y + 18, Math.max(26, bw * (v / 100)), 26, 13);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.35)';
    rr(g, bx + 6, y + 21, Math.max(14, bw * (v / 100) - 12), 7, 3.5);
    g.fill();
    texto(g, `${Math.round(v)}%`, bx + bw + 14, y + 32, { tam: 24, color: '#5a3a28', alinear: 'left' });
    g.globalAlpha = 1;
  });
  // El total: sello que cae
  const tTotal = T_CATS + j.cats.length * T_CAT + 0.2;
  const k = Math.max(0, Math.min(1, (t - tTotal) / 0.35));
  const comiendo = t < T_CATS;
  if (k > 0) {
    const ty = py + ph - 108;
    const sx = bx + bw * 0.42;
    const esc = 1 + (1 - k) * 1.6;
    g.save();
    g.translate(sx, ty);
    g.rotate(-0.08);
    g.scale(esc, esc);
    g.globalAlpha = Math.min(1, k * 1.6);
    const col = COLOR_TOTAL(j.total);
    g.strokeStyle = col;
    g.lineWidth = 5;
    rr(g, -150, -56, 300, 112, 18);
    g.stroke();
    texto(g, `${j.total}%`, 0, -12, { tam: 58, color: col });
    texto(g, LETRERO(j.total), 0, 34, { tam: 26, color: col });
    g.restore();
    // Propina
    const kp = Math.max(0, Math.min(1, (t - tTotal - 0.5) / 0.4));
    if (kp > 0) {
      g.globalAlpha = kp;
      spr(g, 'moneda', bx + bw + 40, ty - 4, 26 * (1 + (1 - kp) * 0.5));
      texto(g, `+${j.propina}`, bx + bw + 74, ty, { tam: 40, color: '#b07a10', alinear: 'left', borde: '#fff8ee' });
      g.globalAlpha = 1;
      if (monedasDe !== j.n) {
        monedasDe = j.n;
        m.fx.monedas(bx + bw + 40, ty, 6);
      }
    }
    // Plato perfecto: brillo que cruza
    if (j.total >= 90) {
      barridoBrillo(g, cx, cy - 40, 230, 160, (t - tTotal) / 1.1);
      if (Math.random() < 0.25) m.fx.brillos(cx, cy - 40, 150, 90, 1);
    }
  }
  // El invitado: come y luego reacciona
  if (e) {
    const pose: Pose = comiendo ? (Math.floor(t / 0.22) % 2 ? 'come_a' : 'come_b') : k > 0 ? reaccion(j.total) : 'espera';
    let img = m.sprite(m.def(e), pose);
    if (!img.complete || !img.naturalWidth) img = m.sprite(m.def(e), 'feliz');
    const ix = px + pw * 0.86, iy = py + ph - 26;
    if (img.complete && img.naturalWidth) {
      const salto = k > 0 && j.total >= 90 ? Math.abs(Math.sin(t * 7)) * 18 : 0;
      const h = ph * 0.74;
      const w = (img.naturalWidth / img.naturalHeight) * h;
      sombra(g, ix, iy, w * 0.38, 18, 0.3);
      g.drawImage(img, ix - w / 2, iy - h - salto, w, h);
      if (comiendo && Math.random() < 0.3) m.fx.migas(ix - w * 0.1, iy - h * 0.62, '#d9a25e', 2);
      if (comiendo && Math.floor(t / 0.4) % 2 === 0) texto(g, '¡Ñam!', ix - w * 0.45, iy - h * 0.82, { tam: 30, color: '#e0793a', borde: '#fff' });
    }
    if (k > 0) {
      globo(m, g, j.frase, ix, py + 100);
      if (t - tTotal < 2.2 && j.total >= 90 && Math.random() < 0.35) {
        if (inv?.especial === 'pareja') m.fx.corazones(ix, py + 220, 1);
        else m.fx.chispas(ix, py + 220, '#ffd23f', 2, 'confeti');
      }
    }
  }
  if (t > tTotal + 0.6) {
    const p = 0.6 + 0.4 * Math.sin(t * 4);
    g.globalAlpha = p;
    texto(g, 'Toca para seguir', W / 2, py + ph - 22, { tam: 20, color: '#9a7a68', peso: 800 });
    g.globalAlpha = 1;
  }
}

function reaccion(total: number): Pose {
  return total >= 90 ? 'encantado' : total >= 70 ? 'contento' : total >= 50 ? 'regular' : 'bravo';
}

// ---------------------------------------------------------------------------------------------- «Modo chef»
/** La entrada en modo chef (en el lienzo): oscuridad, líneas de velocidad, el chef que se acerca con brillo en los
 *  ojos, la comida que gira alrededor y el letrero que cae con un golpe. */
export function dibujarIntro(m: Motor, g: G, t: number) {
  const { W, H } = m;
  const cx = W / 2, cy = H * 0.55;
  // Fondo: oscuro con el resplandor naranja que late
  g.fillStyle = '#120a07';
  g.fillRect(0, 0, W, H);
  const late = 0.75 + 0.25 * Math.sin(t * 5);
  g.fillStyle = radial(g, cx, cy, 10, Math.max(W, H) * 0.6, [[0, `rgba(255,150,60,${0.42 * late})`], [0.5, 'rgba(160,60,20,0.18)'], [1, 'rgba(0,0,0,0)']]);
  g.fillRect(0, 0, W, H);
  // Líneas de velocidad que giran
  const aparece = Math.min(1, t / 1.0);
  g.save();
  g.translate(cx, cy);
  g.rotate(t * 0.9);
  const n = 44;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r0 = 170 + ((i * 37) % 60), r1 = Math.max(W, H);
    g.fillStyle = `rgba(255,${180 + ((i * 13) % 60)},90,${(0.08 + ((i * 7) % 10) / 80) * aparece})`;
    g.beginPath();
    g.moveTo(Math.cos(a - 0.015) * r0, Math.sin(a - 0.015) * r0);
    g.lineTo(Math.cos(a - 0.05) * r1, Math.sin(a - 0.05) * r1);
    g.lineTo(Math.cos(a + 0.05) * r1, Math.sin(a + 0.05) * r1);
    g.lineTo(Math.cos(a + 0.015) * r0, Math.sin(a + 0.015) * r0);
    g.fill();
  }
  g.restore();
  // La comida que gira alrededor del chef
  const comida = ['wafle_clasica_1', 'top_fresa_entera', 'top_chantilly', 'vasofrappe_M', 'top_helado_fresa', 'top_cereza', 'bin_fresa', 'salsa_miel'];
  comida.forEach((id, i) => {
    const a = t * 1.1 + (i / comida.length) * Math.PI * 2;
    const rx = Math.min(W * 0.38, 520), ry = H * 0.3;
    const x = cx + Math.cos(a) * rx * Math.min(1, t / 1.4), y = cy + Math.sin(a) * ry * Math.min(1, t / 1.4) - 30;
    const atras = Math.sin(a) < 0;
    if (!atras) return;
    g.globalAlpha = Math.min(1, t / 0.8) * 0.85;
    spr(g, id, x, y, 34 + 10 * Math.sin(a + 1));
    g.globalAlpha = 1;
  });
  // El chef: se acerca, tiembla de concentración y le brillan los ojos
  const img = m.imgChef(m.yo, 'intro');
  const alt = m.imgChef(m.yo, 'concentrado');
  const chef = img.complete && img.naturalWidth ? img : alt;
  if (chef.complete && chef.naturalWidth) {
    const k = Math.min(1, t / 2.0);
    const e = 1 - Math.pow(1 - k, 3);
    const esc = 0.72 + 0.32 * e;
    const temblor = t > 1.6 && t < 2.15 ? Math.sin(t * 90) * 4 : 0;
    const h = H * 0.78 * esc;
    const w = (chef.naturalWidth / chef.naturalHeight) * h;
    g.save();
    g.globalAlpha = Math.min(1, t / 0.7);
    g.shadowColor = 'rgba(255,170,70,0.75)';
    g.shadowBlur = 40;
    g.drawImage(chef, cx - w / 2 + temblor, H - h + 10, w, h);
    g.restore();
    // Destellos en los ojos (a la altura de la cara del recorte)
    if (t > 2.0 && t < 2.9) {
      const kk = (t - 2.0) / 0.9;
      const s = Math.sin(kk * Math.PI) * 34;
      g.fillStyle = '#fffbe0';
      for (const dx of [-0.13, 0.11]) {
        g.save();
        g.translate(cx + dx * w + temblor, H - h + 10 + h * 0.36);
        g.rotate(kk * 2);
        destello(g, s);
        g.restore();
      }
    }
  }
  // La comida de adelante
  comida.forEach((id, i) => {
    const a = t * 1.1 + (i / comida.length) * Math.PI * 2;
    if (Math.sin(a) < 0) return;
    const rx = Math.min(W * 0.38, 520), ry = H * 0.3;
    const x = cx + Math.cos(a) * rx * Math.min(1, t / 1.4), y = cy + Math.sin(a) * ry * Math.min(1, t / 1.4) - 30;
    g.globalAlpha = Math.min(1, t / 0.8);
    spr(g, id, x, y, 46 + 12 * Math.sin(a));
    g.globalAlpha = 1;
  });
  // Lo que se dice a sí mismo (se va escribiendo)
  const frase = m.yo.tipo === 'amigo'
    ? 'Respira… siente la cocina… hoy cocinas como chef profesional…'
    : m.rol === 'el' ? 'Respira… siente la cocina… hoy eres un chef profesional…' : 'Respira… siente la cocina… hoy eres una chef profesional…';
  const nletras = Math.floor(Math.min(1, Math.max(0, t - 0.2) / 1.8) * frase.length);
  texto(g, frase.slice(0, nletras), cx, 52, { tam: 26, color: '#ffe4c0', peso: 700 });
  // «MODO CHEF» cae con un golpe
  if (t > 2.15) {
    const k = Math.min(1, (t - 2.15) / 0.4);
    const esc = 1 + (1 - k) * 2.2 + (k >= 1 ? Math.sin((t - 2.55) * 6) * 0.02 : 0);
    g.save();
    g.translate(cx, H * 0.86);
    g.scale(esc, esc);
    g.globalAlpha = Math.min(1, k * 1.5);
    texto(g, 'MODO CHEF', 0, 0, { tam: 92, color: '#fff3c0', borde: '#7a2a0a', peso: 900 });
    g.restore();
    if (k < 0.12) for (let i = 0; i < 3; i++) m.fx.chispas(cx + (Math.random() - 0.5) * 400, H * 0.86, '#ffd23f', 6, 'estrella', -1);
  }
  if (t > 3.1) {
    g.globalAlpha = 0.5 + 0.3 * Math.sin(t * 4);
    texto(g, 'Toca para seguir', cx, H - 24, { tam: 20, color: '#ffe4c0', peso: 700 });
    g.globalAlpha = 1;
  }
  m.fx.vista = -2;
  m.fx.dibujar(g);
}

export type { Rol };
