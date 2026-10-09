// Las escenas cortas del mapa de la Noche: un fondo del color del sector con ceniza que sube, el diálogo abajo con el
// retrato de quien habla (los de la pareja con su traje de Valdemora; los del mito con su medallón) y el texto que se
// va escribiendo. Tocar completa la línea o pasa a la siguiente; «Saltar» la termina.
import { CON_PAREJA, NOMBRES_HABLANTES, type EscenaHistoria, type Hablante } from '../historia_pareja';
import { glifo } from './iconos';

/** El medallón de los personajes del mito (no tienen retrato). */
const MEDALLON: Partial<Record<Hablante, { glifo: string; color: string }>> = {
  santa: { glifo: 'vela', color: '#a8c8ff' },
  conde: { glifo: 'colmillo', color: '#d0303a' },
  nathgora: { glifo: 'luna', color: '#a8a8c0' },
  vaelthor: { glifo: 'engranaje', color: '#9a7aff' },
};

export interface OpcionesEscena {
  /** Color y glifo del sector (el fondo). */
  color: string;
  glifo: string;
  /** Retratos de los dos (rutas de imagen), según el traje que lleven. */
  retratoEl: string;
  retratoElla: string;
}

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function verEscena(e: EscenaHistoria, o: OpcionesEscena, alFin: () => void) {
  const raiz = document.createElement('div');
  raiz.className = 'escena-historia';
  raiz.style.setProperty('--c', o.color);
  const ceniza = Array.from({ length: 18 }, (_, k) => `<i style="left:${(k * 37) % 100}%;animation-delay:${-(k * 0.73) % 6}s;animation-duration:${5 + (k % 5)}s"></i>`).join('');
  raiz.innerHTML = `<div class="eh-fondo"><span class="eh-glifo">${glifo(o.glifo)}</span><span class="eh-ceniza">${ceniza}</span></div>
    <header class="eh-cabeza"><small>${esc(e.subtitulo)}</small><h2>${esc(e.titulo)}</h2></header>
    <button class="boton boton-chico eh-saltar" data-a="saltar">Saltar</button>
    <div class="eh-dialogo"><span class="eh-retrato"></span><div class="eh-caja"><b class="eh-nombre"></b><p class="eh-texto"></p><span class="eh-sigue">${glifo('atras')}</span></div></div>`;
  document.body.append(raiz);
  const ret = raiz.querySelector<HTMLElement>('.eh-retrato')!;
  const nom = raiz.querySelector<HTMLElement>('.eh-nombre')!;
  const txt = raiz.querySelector<HTMLElement>('.eh-texto')!;
  const dialogo = raiz.querySelector<HTMLElement>('.eh-dialogo')!;
  let k = -1, letras = 0, reloj = 0;
  const linea = () => e.lineas[k];
  const terminarLinea = () => {
    clearInterval(reloj);
    reloj = 0;
    txt.textContent = linea().texto;
    dialogo.classList.add('lista');
  };
  const siguiente = () => {
    k++;
    if (k >= e.lineas.length) return cerrar();
    const l = linea();
    const pareja = CON_PAREJA && (l.quien === 'el' || l.quien === 'ella');
    const med = MEDALLON[l.quien];
    dialogo.className = `eh-dialogo quien-${l.quien}${l.quien === 'narrador' ? ' narra' : ''}${pareja ? ' pareja' : ''}`;
    ret.innerHTML = pareja ? `<img src="${l.quien === 'el' ? o.retratoEl : o.retratoElla}" alt="">` : med ? `<span class="eh-medallon" style="--m:${med.color}">${glifo(med.glifo, med.color)}</span>` : '';
    nom.textContent = NOMBRES_HABLANTES[l.quien];
    txt.textContent = '';
    letras = 0;
    clearInterval(reloj);
    reloj = window.setInterval(() => {
      letras += 2;
      txt.textContent = l.texto.slice(0, letras);
      if (letras >= l.texto.length) terminarLinea();
    }, 33);
  };
  const cerrar = () => {
    clearInterval(reloj);
    raiz.classList.add('sale');
    setTimeout(() => {
      raiz.remove();
      alFin();
    }, 400);
  };
  raiz.addEventListener('click', (ev) => {
    if ((ev.target as HTMLElement).closest('[data-a="saltar"]')) return cerrar();
    if (reloj) terminarLinea();
    else siguiente();
  });
  siguiente();
}
