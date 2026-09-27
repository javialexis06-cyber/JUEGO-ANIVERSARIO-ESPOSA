// Interfaz de Nuestro Hogar: barras de necesidades, botones de acción, hojas (tienda, notas, álbum...),
// avisos y efectos que flotan sobre Él y Ella.
import { icono, RUTA } from '../recursos';
import { Item } from './catalogo';
import { EstadoPersonaje, Necesidad, NECESIDADES, NOMBRE_NECESIDAD, Rol } from './modelo';

export const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

/** Íconos dibujados (SVG) para lo que no es un objeto del juego. */
export const SVG: Record<string, string> = {
  hambre: '<svg viewBox="0 0 32 32"><path d="M4 15h24a12 11 0 0 1-24 0z" fill="#F6CF5A"/><path d="M4 15h24" stroke="#D9A92C" stroke-width="2.4" stroke-linecap="round"/><path d="M11 10c-1-2 1-3 0-5M16 10c-1-2 1-3 0-5M21 10c-1-2 1-3 0-5" stroke="#E4574B" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  energia: '<svg viewBox="0 0 32 32"><path d="M18 3 7 18h8l-2 11 12-16h-8z" fill="#F6CF5A" stroke="#D9A92C" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  higiene: '<svg viewBox="0 0 32 32"><path d="M16 3c5 7 9 11 9 16a9 9 0 0 1-18 0c0-5 4-9 9-16z" fill="#8FC9EE" stroke="#4E9BD1" stroke-width="1.6"/><ellipse cx="12.5" cy="19" rx="2" ry="3.2" fill="#fff" opacity=".8"/></svg>',
  carino: '<svg viewBox="0 0 32 32"><path d="M16 28S3 20 3 11a6.5 6.5 0 0 1 13-2 6.5 6.5 0 0 1 13 2c0 9-13 17-13 17z" fill="#F2536E" stroke="#B83A52" stroke-width="1.6"/><ellipse cx="9.5" cy="10.5" rx="2" ry="2.8" fill="#fff" opacity=".7"/></svg>',
  luna: '<svg viewBox="0 0 32 32"><path d="M21 4a12 12 0 1 0 7 17A10 10 0 0 1 21 4z" fill="#C9B6EA" stroke="#8F76C9" stroke-width="1.6"/><circle cx="13" cy="14" r="1.6" fill="#8F76C9"/><circle cx="17" cy="21" r="1.2" fill="#8F76C9"/></svg>',
  sol: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="7" fill="#F6CF5A" stroke="#D9A92C" stroke-width="1.6"/><g stroke="#E4A72C" stroke-width="2.4" stroke-linecap="round"><path d="M16 2v4M16 26v4M2 16h4M26 16h4M6 6l3 3M23 23l3 3M6 26l3-3M23 9l3-3"/></g></svg>',
  tina: '<svg viewBox="0 0 32 32"><circle cx="10" cy="9" r="4" fill="#E6F2FF" stroke="#8FC9EE" stroke-width="1.4"/><circle cx="18" cy="6" r="3" fill="#E6F2FF" stroke="#8FC9EE" stroke-width="1.4"/><circle cx="23" cy="11" r="2.4" fill="#E6F2FF" stroke="#8FC9EE" stroke-width="1.4"/><path d="M3 16h26v3a8 8 0 0 1-8 8H11a8 8 0 0 1-8-8z" fill="#fff" stroke="#8FC9EE" stroke-width="1.8"/><path d="M8 27l-1 3M24 27l1 3" stroke="#C9A15C" stroke-width="2.2" stroke-linecap="round"/></svg>',
  lavar: '<svg viewBox="0 0 32 32"><rect x="7" y="3" width="18" height="15" rx="7" fill="#DDEAF2" stroke="#F2A5B8" stroke-width="2.2"/><path d="M5 22h22a11 5 0 0 1-22 0z" fill="#fff" stroke="#8FC9EE" stroke-width="1.8"/><path d="M16 22v7" stroke="#8FC9EE" stroke-width="3" stroke-linecap="round"/></svg>',
  sofa: '<svg viewBox="0 0 32 32"><rect x="6" y="8" width="20" height="10" rx="4" fill="#E88C7D"/><rect x="3" y="13" width="6" height="11" rx="3" fill="#D97565"/><rect x="23" y="13" width="6" height="11" rx="3" fill="#D97565"/><rect x="7" y="16" width="18" height="8" rx="3" fill="#F2A294"/><path d="M6 25v3M26 25v3" stroke="#8A5A3B" stroke-width="2.4" stroke-linecap="round"/></svg>',
  tv: '<svg viewBox="0 0 32 32"><rect x="3" y="6" width="26" height="17" rx="4" fill="#2B2A2A"/><rect x="6" y="9" width="20" height="11" rx="2" fill="#8FC7E8"/><path d="M11 3l5 3 5-3M10 27h12" stroke="#2B2A2A" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>',
  closet: '<svg viewBox="0 0 32 32"><path d="M16 9a3 3 0 1 1 3-3" stroke="#7A625A" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M16 9 3 20c-1 1 0 3 1.5 3h23c1.5 0 2.5-2 1.5-3z" fill="#C9B6EA" stroke="#8F76C9" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  nota: '<svg viewBox="0 0 32 32"><path d="M5 5h22v15l-7 7H5z" fill="#FFE58A" stroke="#D9B84A" stroke-width="1.6" stroke-linejoin="round"/><path d="M20 27v-7h7" fill="#F2CF62" stroke="#D9B84A" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 11h13M9 15h9" stroke="#B8923A" stroke-width="1.8" stroke-linecap="round"/><circle cx="16" cy="5" r="3" fill="#E4566B"/></svg>',
  tienda: '<svg viewBox="0 0 32 32"><path d="M6 11h20l-2 17H8z" fill="#F4B6C2" stroke="#B83A52" stroke-width="1.8" stroke-linejoin="round"/><path d="M11 13V9a5 5 0 0 1 10 0v4" stroke="#B83A52" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M16 23s-4-2.5-4-5a2 2 0 0 1 4-.6 2 2 0 0 1 4 .6c0 2.5-4 5-4 5z" fill="#fff"/></svg>',
  decorar: '<svg viewBox="0 0 32 32"><rect x="4" y="5" width="24" height="19" rx="2" fill="#fff" stroke="#C9956A" stroke-width="2.6"/><path d="M7 21l6-7 4 4 3-3 5 6z" fill="#7FB77E"/><circle cx="21" cy="11" r="2.4" fill="#F6CF5A"/><path d="M12 27h8" stroke="#C9956A" stroke-width="2.2" stroke-linecap="round"/></svg>',
  caricia: '<svg viewBox="0 0 32 32"><path d="M8 17V9a2 2 0 0 1 4 0v6-9a2 2 0 0 1 4 0v9-8a2 2 0 0 1 4 0v8-5a2 2 0 0 1 4 0v9c0 6-4 9-9 9s-7-2-9-6l-3-5a2 2 0 0 1 3-2z" fill="#F6D2B8" stroke="#C98B66" stroke-width="1.5" stroke-linejoin="round"/><path d="M24 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#F2536E"/></svg>',
  abrazo: '<svg viewBox="0 0 32 32"><path d="M11 25S3 19.5 3 13a4.5 4.5 0 0 1 8-2.5 4.5 4.5 0 0 1 8 2.5c0 6.5-8 12-8 12z" fill="#F4B6C2" stroke="#B83A52" stroke-width="1.5"/><path d="M21 28s-8-5.5-8-12a4.5 4.5 0 0 1 8-2.5 4.5 4.5 0 0 1 8 2.5c0 6.5-8 12-8 12z" fill="#F2536E" stroke="#B83A52" stroke-width="1.5"/></svg>',
  beso: '<svg viewBox="0 0 32 32"><path d="M3 15c3-4 7-6 10-5l3 2 3-2c3-1 7 1 10 5-3 1-6 1.5-13 1.5S6 16 3 15z" fill="#E4566B"/><path d="M3 15c4 6 8 9 13 9s9-3 13-9c-4 1.5-8 2-13 2S7 16.5 3 15z" fill="#C73E55"/><path d="M26 3s-3-1.8-3-3.6" fill="none"/></svg>',
  saludo: '<svg viewBox="0 0 32 32"><path d="M10 20 6 11a2 2 0 0 1 3.5-1.7L12 14V5a2 2 0 0 1 4 0v7-8a2 2 0 0 1 4 0v8-6a2 2 0 0 1 4 0v12c0 6-3.5 9-8.5 9-3 0-5-1.5-6.5-4z" fill="#F6D2B8" stroke="#C98B66" stroke-width="1.5" stroke-linejoin="round"/><path d="M26 8c2 1 3 3 3 5M3 8c-1 2-1 4 0 6" stroke="#9CCBEF" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  album: '<svg viewBox="0 0 32 32"><rect x="4" y="4" width="18" height="20" rx="1" fill="#fff" stroke="#C9B6EA" stroke-width="1.6" transform="rotate(-8 13 14)"/><rect x="10" y="7" width="18" height="21" rx="1" fill="#fff" stroke="#C98B66" stroke-width="1.6"/><rect x="12.5" y="9.5" width="13" height="12" fill="#9CCBEF"/><path d="M12.5 21.5l4-5 3 3 2-2 4 4z" fill="#7FB77E"/></svg>',
  fechas: '<svg viewBox="0 0 32 32"><rect x="4" y="6" width="24" height="22" rx="3" fill="#fff" stroke="#B83A52" stroke-width="1.8"/><path d="M4 9a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v4H4z" fill="#E4566B"/><path d="M10 3v6M22 3v6" stroke="#7A625A" stroke-width="2.4" stroke-linecap="round"/><path d="M16 25s-5-3-5-6a2.5 2.5 0 0 1 5-1 2.5 2.5 0 0 1 5 1c0 3-5 6-5 6z" fill="#F2536E"/></svg>',
  juegos: '<svg viewBox="0 0 32 32"><path d="M3 9h26l-3 12H7z" fill="#E4574B"/><path d="M3 9l2-4h22l2 4" fill="#fff" stroke="#E4574B" stroke-width="1.6"/><circle cx="10" cy="26" r="2.4" fill="#3D2B27"/><circle cx="23" cy="26" r="2.4" fill="#3D2B27"/><path d="M8 13h16M9 17h14" stroke="#fff" stroke-width="1.6"/></svg>',
  ajustes: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="5" fill="#fff" stroke="#7A625A" stroke-width="2"/><path d="M16 3v5M16 24v5M3 16h5M24 16h5M7 7l3.5 3.5M21.5 21.5 25 25M7 25l3.5-3.5M21.5 10.5 25 7" stroke="#7A625A" stroke-width="3" stroke-linecap="round"/></svg>',
  despertar: '<svg viewBox="0 0 32 32"><circle cx="16" cy="17" r="10" fill="#fff" stroke="#E4574B" stroke-width="2.2"/><path d="M16 11v6l4 3" stroke="#3D2B27" stroke-width="2.2" stroke-linecap="round" fill="none"/><path d="M5 7l4-3M27 7l-4-3" stroke="#E4574B" stroke-width="2.6" stroke-linecap="round"/></svg>',
};

export const ico = (k: string) => `<span class="ico" aria-hidden="true">${SVG[k] ?? ''}</span>`;
export const iconoItem = (it: Item) => (it.producto ? icono(it.producto) : `${RUTA}iconos/${it.modelo}.png`);
export const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Barras de las cuatro necesidades. */
export function pintarNecesidades(ul: HTMLElement, e: EstadoPersonaje) {
  if (!ul.children.length) {
    ul.innerHTML = NECESIDADES.map(
      (n) => `<li class="necesidad" data-n="${n}" title="${NOMBRE_NECESIDAD[n]}">${ico(n)}<span class="barra" role="meter" aria-label="${NOMBRE_NECESIDAD[n]}" aria-valuemin="0" aria-valuemax="100"><i></i></span></li>`,
    ).join('');
  }
  for (const li of Array.from(ul.children) as HTMLElement[]) {
    const n = li.dataset.n as Necesidad;
    const v = Math.round(e[n]);
    const barra = li.querySelector('.barra') as HTMLElement;
    (barra.firstElementChild as HTMLElement).style.width = `${v}%`;
    barra.setAttribute('aria-valuenow', String(v));
    barra.classList.toggle('media', v < 55 && v >= 25);
    barra.classList.toggle('baja', v < 25);
    li.classList.toggle('alerta', v < 25);
  }
}

let tiempoToast: ReturnType<typeof setTimeout> | null = null;
export function toast(texto: string, ms = 2600) {
  const t = $('toast');
  t.textContent = texto;
  t.hidden = false;
  t.classList.remove('sale');
  void t.offsetWidth;
  t.classList.add('sale');
  if (tiempoToast) clearTimeout(tiempoToast);
  tiempoToast = setTimeout(() => (t.hidden = true), ms);
}

export function mostrar(id: string, si = true) {
  $(id).hidden = !si;
}

// ---------------------------------------------------------------------------
// Hoja: panel grande con título, pestañas opcionales y cuerpo
// ---------------------------------------------------------------------------
export interface Pestana {
  id: string;
  nombre: string;
}
let alCerrarHoja: (() => void) | null = null;

export function abrirHoja(titulo: string, cuerpo: string, opciones: { saldo?: number; pestanas?: Pestana[]; activa?: string; alPestana?: (id: string) => void; alCerrar?: () => void } = {}) {
  $('hoja-titulo').textContent = titulo;
  $('hoja-saldo').hidden = opciones.saldo === undefined;
  if (opciones.saldo !== undefined) $('hoja-monedas').textContent = String(opciones.saldo);
  const nav = $('hoja-pestanas');
  nav.hidden = !opciones.pestanas?.length;
  nav.innerHTML = (opciones.pestanas ?? [])
    .map((p) => `<button class="pestana" role="tab" data-p="${p.id}" aria-selected="${p.id === opciones.activa}">${esc(p.nombre)}</button>`)
    .join('');
  nav.onclick = (ev) => {
    const b = (ev.target as HTMLElement).closest('[data-p]') as HTMLElement | null;
    if (b) opciones.alPestana?.(b.dataset.p!);
  };
  $('hoja-cuerpo').innerHTML = cuerpo;
  $('hoja-cuerpo').scrollTop = 0;
  alCerrarHoja = opciones.alCerrar ?? null;
  mostrar('hoja');
}

export function cuerpoHoja(html: string) {
  const c = $('hoja-cuerpo');
  const y = c.scrollTop;
  c.innerHTML = html;
  c.scrollTop = y;
}

export function cerrarHoja() {
  mostrar('hoja', false);
  const cb = alCerrarHoja;
  alCerrarHoja = null;
  cb?.();
}

export const hojaAbierta = () => !$('hoja').hidden;

export function ventana(html: string) {
  $('ventana-carta').innerHTML = html;
  mostrar('ventana');
}
export const cerrarVentana = () => mostrar('ventana', false);

// ---------------------------------------------------------------------------
// Efectos sobre el 3D
// ---------------------------------------------------------------------------
const CORAZON = SVG.carino;

export class Capa {
  private el = $('capa');
  private efectos = new Map<string, HTMLElement>();

  /** Pone (o mueve) un efecto anclado a un punto de la pantalla. `tipo` null lo quita. */
  poner(clave: string, tipo: string | null, x: number, y: number, contenido?: string) {
    let e = this.efectos.get(clave);
    if (!tipo) {
      e?.remove();
      this.efectos.delete(clave);
      return;
    }
    if (!e || e.dataset.tipo !== tipo) {
      e?.remove();
      e = document.createElement('div');
      e.dataset.tipo = tipo;
      if (tipo === 'pensamiento') {
        e.className = 'pensamiento';
        e.innerHTML = contenido ?? '';
      } else {
        e.className = `efecto ${tipo}`;
        const uno = tipo === 'zzz' ? 'z' : tipo === 'corazones' ? CORAZON : '';
        e.innerHTML = `<span>${uno}</span><span>${uno}</span><span>${uno}</span>`;
      }
      this.el.appendChild(e);
      this.efectos.set(clave, e);
    }
    e.style.transform = `translate(${x}px, ${y}px)`;
  }

  quitarTodo() {
    for (const e of this.efectos.values()) e.remove();
    this.efectos.clear();
  }
}

/** Lluvia de corazones (aniversario, beso de bienvenida). */
export function lluviaCorazones(n = 24) {
  const capa = document.createElement('div');
  capa.className = 'lluvia-corazones';
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.innerHTML = CORAZON;
    s.style.left = `${Math.random() * 100}%`;
    s.style.animationDelay = `${Math.random() * 1.6}s`;
    s.style.transform = `scale(${0.7 + Math.random() * 0.8})`;
    capa.appendChild(s);
  }
  document.body.appendChild(capa);
  setTimeout(() => capa.remove(), 5200);
}

export const nombre = (r: Rol) => (r === 'el' ? 'Él' : 'Ella');
export const caraClase = (r: Rol) => `cara-${r}`;
