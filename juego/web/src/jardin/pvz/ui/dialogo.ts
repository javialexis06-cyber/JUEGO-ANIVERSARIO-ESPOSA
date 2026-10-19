// Globos de diálogo de la historia (Dave, Rosa, el Zombi Cartero, el Dr. Zomboss y el narrador) y las notas de los
// zombis en pantalla completa. Sin voces grabadas: Dave balbucea con un sonido sintetizado. Se avanza tocando.
import { arteDe, cargarPersonajes, dibujarPersonaje, varianteDe } from '../arte/index';
import type { Linea } from '../historia/guion';
import { sonido } from '../sonido';

const NOMBRES: Record<Linea['quien'], string> = {
  dave: 'Dave el Loco',
  rosa: 'Rosa · Radio Superviviente',
  zomboss: 'Dr. Zomboss',
  cartero: 'El Zombi Cartero',
  narrador: '',
};

const ICONOS: Partial<Record<Linea['quien'], string>> = {
  rosa: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="22" width="48" height="32" rx="7" fill="#d9534f" stroke="#1d1408" stroke-width="4"/><circle cx="22" cy="38" r="9" fill="#2b2b2b" stroke="#1d1408" stroke-width="3"/><rect x="36" y="30" width="14" height="4" rx="2" fill="#fbe9b7"/><rect x="36" y="39" width="14" height="4" rx="2" fill="#fbe9b7"/><path d="M14 22 L44 6" stroke="#1d1408" stroke-width="4" stroke-linecap="round"/></svg>`,
  cartero: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="6" y="14" width="52" height="36" rx="5" fill="#f4ecd6" stroke="#1d1408" stroke-width="4"/><path d="M8 16 L32 34 L56 16" fill="none" stroke="#1d1408" stroke-width="4" stroke-linejoin="round"/><circle cx="48" cy="40" r="6" fill="#c0392b"/></svg>`,
  zomboss: `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="30" rx="20" ry="22" fill="#9aa58a" stroke="#1d1408" stroke-width="4"/><path d="M12 22 q20 -24 40 0" fill="#d8d0b8" stroke="#1d1408" stroke-width="3"/><circle cx="24" cy="32" r="5" fill="#fff" stroke="#1d1408" stroke-width="2"/><circle cx="41" cy="32" r="7" fill="#fff" stroke="#1d1408" stroke-width="2"/><circle cx="41" cy="33" r="2" fill="#c0392b"/><path d="M24 46 h16" stroke="#1d1408" stroke-width="3"/><rect x="20" y="52" width="24" height="10" fill="#7d2b2b" stroke="#1d1408" stroke-width="3"/></svg>`,
};

let estilo = false;

/** Muestra las líneas una por una. Resuelve al terminar o al tocar «Saltar». */
export function mostrarDialogo(contenedor: HTMLElement, lineas: readonly Linea[]): Promise<void> {
  if (!lineas.length) return Promise.resolve();
  estilo = true;
  return new Promise((listo) => {
    const capa = document.createElement('div');
    capa.className = 'pvz-dialogo';
    capa.innerHTML = `<div class="retrato"><canvas></canvas><span class="icono"></span></div><div class="globo"><b class="quien"></b><p class="texto"></p><span class="sigue">▶</span></div><button class="saltar" type="button">Saltar ›</button>`;
    contenedor.append(capa);
    const lienzo = capa.querySelector('canvas')!;
    const icono = capa.querySelector<HTMLElement>('.icono')!;
    const quien = capa.querySelector<HTMLElement>('.quien')!;
    const texto = capa.querySelector<HTMLElement>('.texto')!;
    const dave = arteDe('dave');
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    let i = 0;
    let mostrado = 0;
    let t0 = performance.now();
    let raf = 0;
    let terminado = false;
    if (dave) void cargarPersonajes([dave], 1.4 * dpr);

    const linea = () => lineas[i];
    const preparar = () => {
      const l = linea();
      capa.dataset.quien = l.quien;
      quien.textContent = NOMBRES[l.quien];
      quien.hidden = !NOMBRES[l.quien];
      icono.innerHTML = ICONOS[l.quien] ?? '';
      lienzo.hidden = l.quien !== 'dave' || !dave;
      mostrado = 0;
      t0 = performance.now();
      texto.textContent = '';
      if (l.quien === 'dave') sonido.efecto('dave');
    };
    const dibujar = () => {
      if (terminado) return;
      const l = linea();
      const ahora = performance.now();
      const n = Math.min(l.texto.length, Math.floor((ahora - t0) / 22));
      if (n !== mostrado) {
        mostrado = n;
        texto.textContent = l.texto.slice(0, n);
      }
      capa.classList.toggle('completa', mostrado >= l.texto.length);
      if (l.quien === 'dave' && dave) {
        const r = lienzo.getBoundingClientRect();
        const w = Math.max(1, Math.round(r.width * dpr));
        const h = Math.max(1, Math.round(r.height * dpr));
        if (lienzo.width !== w || lienzo.height !== h) {
          lienzo.width = w;
          lienzo.height = h;
        }
        const g = lienzo.getContext('2d')!;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, w, h);
        const escala = (h / (dave.alto || 200)) * 0.95;
        g.setTransform(escala, 0, 0, escala, 0, 0);
        const hablando = mostrado < l.texto.length;
        dibujarPersonaje(g, dave, {
          x: w / escala / 2, y: (h / escala) * 0.98, t: ahora / 1000, estado: hablando ? 'habla' : 'quieto', semilla: 3,
          variantes: varianteDe(dave, 'animo', l.animo ?? 'normal'),
        });
      }
      raf = requestAnimationFrame(dibujar);
    };
    const cerrar = () => {
      if (terminado) return;
      terminado = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', tecla, true);
      capa.classList.add('saliendo');
      window.setTimeout(() => capa.remove(), 250);
      listo();
    };
    const avanzar = () => {
      const l = linea();
      if (mostrado < l.texto.length) {
        // Primer toque: muestra la línea completa.
        t0 = -1e9;
        return;
      }
      i++;
      if (i >= lineas.length) cerrar();
      else preparar();
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cerrar();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        avanzar();
      }
    };
    capa.addEventListener('pointerup', (e) => {
      if ((e.target as Element).closest('.saltar')) return;
      sonido.efecto('boton');
      avanzar();
    });
    capa.querySelector('.saltar')!.addEventListener('click', (e) => {
      e.stopPropagation();
      cerrar();
    });
    window.addEventListener('keydown', tecla, true);
    preparar();
    raf = requestAnimationFrame(dibujar);
  });
}

/** Nota de los zombis (o carta) en pantalla completa, sobre papel. */
export function mostrarNota(contenedor: HTMLElement, nota: { firma: string; texto: string }, titulo = 'Una nota de los zombis'): Promise<void> {
  return new Promise((listo) => {
    const capa = document.createElement('div');
    capa.className = 'pvz-nota';
    capa.innerHTML = `<div class="papel"><small></small><p></p><b></b></div><button type="button" class="pvz-boton">Seguir</button>`;
    capa.querySelector('small')!.textContent = titulo;
    capa.querySelector('p')!.textContent = nota.texto;
    capa.querySelector('b')!.textContent = nota.firma;
    contenedor.append(capa);
    capa.querySelector('button')!.addEventListener('click', () => {
      sonido.efecto('boton');
      capa.remove();
      listo();
    });
  });
}

/** El boletín de Rosa por la radio al empezar un mundo. */
export function mostrarRadio(contenedor: HTMLElement, lineas: readonly string[]): Promise<void> {
  return mostrarDialogo(contenedor, lineas.map((texto) => ({ quien: 'rosa' as const, texto })));
}

export function dialogoActivo(): boolean {
  return estilo && !!document.querySelector('.pvz-dialogo:not(.saliendo)');
}
