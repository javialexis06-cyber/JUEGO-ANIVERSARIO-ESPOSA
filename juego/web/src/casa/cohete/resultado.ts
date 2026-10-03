// La pantalla del vuelo: mientras el personaje baja colgado de un paracaídas de papel higiénico, a la derecha
// salen los números contando (distancia, rollitos, puntaje con el multiplicador), las misiones con su barrita y,
// si se completaron las tres, el nivel nuevo con su cofre. Abajo: la tienda del retrete o volver a casa.
import { nota } from '../../sonido';
import { type Mision, type ProgresoCohete, esDeVuelo, premioMision, textoMision } from './datos';
import type { Rol } from '../modelo';

/** Lo que la casa dio por un vuelo: sus monedas y si ya se llegó al tope del día. */
export interface PremioCasa {
  monedas: number;
  tope: boolean;
}

export interface DatosResultado {
  metros: number;
  puntaje: number;
  rollitos: number;
  extraTriple: number;
  record: boolean;
  recordPuntaje: boolean;
  segundos: number;
  mult: number;
  misionesAntes: Mision[];
  cumplidas: { texto: string; premio: number }[];
  subio?: { nivel: number; premio: number };
  nivelAntes: number;
  progreso: ProgresoCohete;
  rol: Rol;
  recordPareja: number;
  /** Monedas de la casa por este vuelo (null mientras la casa responde). */
  casa: PremioCasa | null;
}

const mil = (v: number) => Math.round(v).toLocaleString('es-CO');
const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const TITULOS = {
  record: ['¡Récord nuevo!', '¡Qué viaje tan largo!', '¡Leyenda del retrete!'],
  bien: ['¡Buen vuelo!', '¡Volaste bonito!', '¡Eso estuvo de película!'],
  corto: ['Aterrizaje forzoso', 'Fue cortico pero sentido', '¡Ups! Chocaste rápido'],
};
const elegir = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)];

/** La línea de las monedas de la casa (llega cuando la casa responde). */
export function pintarPremioCasa(capa: HTMLElement, pc: PremioCasa) {
  const el = capa.querySelector<HTMLElement>('.cr-casa');
  if (!el) return;
  el.hidden = !pc.monedas && !pc.tope;
  el.classList.toggle('tope', !pc.monedas);
  el.innerHTML = pc.monedas
    ? `<i class="cr-moneda"></i>+${pc.monedas} ${pc.monedas === 1 ? 'moneda' : 'monedas'} para la casa${pc.tope ? ' <small>(ya van todas las de hoy)</small>' : ''}`
    : 'Por hoy el retrete ya dio sus monedas para la casa. ¡Los rollitos sí siguen!';
}

export function mostrarResultado(capa: HTMLElement, d: DatosResultado, al: { tienda: () => void; casa: () => void; otra: () => void }) {
  capa.querySelector('.cohete-resultado')?.remove();
  const p = d.progreso;
  const titulo = d.record ? elegir(TITULOS.record) : d.metros > 600 ? elegir(TITULOS.bien) : elegir(TITULOS.corto);
  const pareja = d.recordPareja > 0
    ? d.metros > d.recordPareja
      ? `<p class="cr-pareja gana">Le ganaste a ${d.rol === 'el' ? 'Ella' : 'Él'} (${mil(d.recordPareja)} m) 😏</p>`
      : `<p class="cr-pareja">Récord de ${d.rol === 'el' ? 'Ella' : 'Él'}: ${mil(d.recordPareja)} m · te faltaron ${mil(d.recordPareja - d.metros)} m</p>`
    : '';
  // Las misiones como estaban al empezar, con lo de ahora (para ver la barrita llenarse)
  const misiones = (d.subio ? d.misionesAntes : p.misiones)
    .map((m, i) => {
      const ahora = d.subio ? d.misionesAntes[i] : p.misiones[i];
      const hecha = d.subio ? true : ahora.hecha;
      const k = hecha ? 1 : Math.min(1, ahora.avance / ahora.meta);
      const nueva = d.cumplidas.some((c) => c.texto === textoMision(m));
      return `<li class="${hecha ? 'hecha' : ''}${nueva ? ' nueva' : ''}"><i>${hecha ? '✓' : ''}</i><span>${esc(textoMision(m))}
        <s><u style="--k:${k}"></u></s><small>${hecha ? (nueva ? `¡Cumplida! +${mil(premioMision(d.nivelAntes))}` : 'Lista') : `${mil(ahora.avance)} / ${mil(ahora.meta)}${esDeVuelo(m) ? ' en un vuelo' : ''}`}</small></span></li>`;
    })
    .join('');
  const subio = d.subio
    ? `<div class="cr-nivel"><b>¡Nivel ${d.subio.nivel + 1}!</b><span>Multiplicador ×${d.subio.nivel + 1} · cofre de +${mil(d.subio.premio)} <i class="ico-rollito"></i></span></div>`
    : '';
  const s = document.createElement('section');
  s.className = 'cohete-resultado';
  s.innerHTML = `
    <div class="cr-tarjeta">
      <header><small>${Math.round(d.segundos)} segundos en el espacio</small><h2>${titulo}</h2></header>
      <div class="cr-cuerpo">
      <div class="cr-datos">
        <div class="cr-dato distancia"><span>Distancia</span><b data-n="${d.metros}" data-sufijo=" m">0 m</b>${d.record ? '<em class="cr-sello">¡Récord!</em>' : `<small>Récord: ${mil(p.mejor)} m</small>`}</div>
        <div class="cr-dato rollitos"><span>Rollitos</span><b data-n="${d.rollitos + d.extraTriple}" data-rollito>0</b>${d.extraTriple ? `<small>+${mil(d.extraTriple)} por el papel triple hoja</small>` : '<small>para la tienda del retrete</small>'}</div>
        <div class="cr-dato puntos"><span>Puntaje <em>×${d.mult}</em></span><b data-n="${d.puntaje}">0</b>${d.recordPuntaje ? '<em class="cr-sello">¡Mejor puntaje!</em>' : `<small>Mejor: ${mil(p.mejorPuntaje)}</small>`}</div>
      </div>
      ${pareja}
      <p class="cr-casa" hidden></p>
      <div class="cr-misiones"><h3>Misiones <small>nivel ${d.nivelAntes + 1} · ×${d.nivelAntes + 1}</small></h3><ul>${misiones}</ul>${subio}</div>
      </div>
      <footer>
        <button class="cb-boton" data-tienda><i class="ico-rollito"></i> Tienda <small>${mil(p.rollitos)}</small></button>
        <button class="cb-boton" data-casa>Volver a casa</button>
        <button class="cb-boton cb-principal cr-otra" data-otra>🚀 Volar otra vez</button>
      </footer>
    </div>`;
  capa.append(s);
  if (d.casa) pintarPremioCasa(capa, d.casa);
  requestAnimationFrame(() => s.classList.add('abierta'));
  // Los números cuentan uno detrás del otro, con su sonidito
  const nums = [...s.querySelectorAll<HTMLElement>('[data-n]')];
  let i = 0;
  const contar = () => {
    const el = nums[i++];
    if (!el) {
      s.classList.add('contado');
      if (d.record || d.subio) [523, 659, 784, 1046, 1318].forEach((f, k) => nota(f, 0.22, k * 0.1, 'triangle', 0.06));
      return;
    }
    const meta = Number(el.dataset.n), suf = el.dataset.sufijo ?? '';
    const t0 = performance.now(), dur = meta > 0 ? 700 : 1;
    let ultimo = -1;
    const paso = () => {
      if (!s.isConnected) return;
      const k = Math.min(1, (performance.now() - t0) / dur);
      const v = Math.round(meta * (1 - Math.pow(1 - k, 3)));
      el.textContent = `${mil(v)}${suf}`;
      const tic = Math.floor(k * 10);
      if (tic !== ultimo) {
        ultimo = tic;
        nota(900 + tic * 60, 0.03, 0, 'square', 0.015);
      }
      if (k < 1) requestAnimationFrame(paso);
      else {
        el.parentElement?.classList.add('listo');
        setTimeout(contar, 160);
      }
    };
    requestAnimationFrame(paso);
  };
  setTimeout(contar, 450);
  // (un solo toque cuenta: si el dedo rebota no se sale dos veces)
  let hecho = false;
  s.querySelector('[data-tienda]')!.addEventListener('click', () => {
    if (hecho) return;
    hecho = true;
    nota(880, 0.06, 0, 'triangle', 0.05);
    s.classList.remove('abierta');
    setTimeout(() => s.remove(), 250);
    al.tienda();
  });
  s.querySelector('[data-casa]')!.addEventListener('click', () => {
    if (hecho) return;
    hecho = true;
    nota(660, 0.08, 0, 'triangle', 0.05);
    s.classList.remove('abierta');
    al.casa();
  });
  s.querySelector('[data-otra]')!.addEventListener('click', () => {
    if (hecho) return;
    hecho = true;
    [523, 784, 1046].forEach((f, k) => nota(f, 0.1, k * 0.06, 'triangle', 0.05));
    al.otra();
  });
}
