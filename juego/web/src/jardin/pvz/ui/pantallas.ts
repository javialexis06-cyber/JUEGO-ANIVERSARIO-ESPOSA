// Pantallas de Plantas contra Zombis fuera del césped: título, mapa de la aventura (como el de PvZ 2), selección de
// semillas, planta nueva, derrota y el menú de pausa. HTML sobre el lienzo; todas devuelven promesas o llaman a un
// callback y se quitan solas.
import { arteDe, retrato } from '../arte/index';
import { NIVELES } from '../datos/niveles';
import { defPlanta } from '../datos/plantas';
import { PLANTAS_TEXTO } from '../historia/guion';
import { sonido } from '../sonido';
import type { DefNivel } from '../tipos';

export const MUNDOS: { n: number; nombre: string; acto: number }[] = [
  { n: 1, nombre: 'La casa', acto: 1 },
  { n: 2, nombre: 'El cementerio', acto: 1 },
  { n: 3, nombre: 'La piscina del conjunto', acto: 1 },
  { n: 4, nombre: 'El lago de niebla', acto: 1 },
  { n: 5, nombre: 'Los tejados', acto: 1 },
  { n: 6, nombre: 'El río', acto: 2 },
  { n: 7, nombre: 'Las vías', acto: 2 },
  { n: 8, nombre: 'El desierto rojo', acto: 2 },
  { n: 9, nombre: 'El páramo helado', acto: 2 },
  { n: 10, nombre: 'El Invernadero', acto: 3 },
];
const NIVELES_POR_MUNDO: Record<number, number> = { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 8, 7: 8, 8: 8, 9: 8, 10: 6 };

const OBJETOS: Record<string, { titulo: string; texto: string; icono: string }> = {
  'pala-y-abono': {
    titulo: '¡La pala y el abono!',
    texto: 'Con la pala arrancas una planta (no devuelve el sol). Los zombis que brillan en verde sueltan abono: dáselo a una planta para un poder especial.',
    icono: '🌱',
  },
  almanaque: { titulo: '¡El Almanaque Suburbano!', texto: 'Ya puedes consultar las fichas de todas las plantas y zombis que conoces.', icono: '📖' },
  'llaves-tienda': { titulo: '¡Las llaves de la furgoneta!', texto: 'Dave abrió su tienda de cachivaches. Gasta ahí las monedas del jardín.', icono: '🔑' },
  'mapa-1': { titulo: 'Un pedazo de mapa', texto: 'Una carta atrasada del Banco de Semillas con la primera parte del camino a la Semilla Madre.', icono: '🗺' },
  'mapa-2': { titulo: 'El último pedazo del mapa', texto: 'Ya se sabe dónde está el Invernadero: en la cumbre del páramo.', icono: '🗺' },
};

function el<K extends keyof HTMLElementTagNameMap>(tag: K, clase: string, html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = clase;
  if (html) e.innerHTML = html;
  return e;
}

function retratoPlanta(id: string, tam: number, completo = false): HTMLElement {
  const d = arteDe(id);
  const caja = el('span', 'pvz-retrato');
  if (!d) {
    caja.textContent = defPlanta(id)?.nombre.slice(0, 2) ?? '?';
    return caja;
  }
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const L = retrato(d, Math.round(tam * dpr), 'quieto', completo ? {} : { alto: Math.round(tam * 0.8 * dpr), encuadre: 'arriba', margen: Math.round(3 * dpr) });
  caja.append(L);
  return caja;
}

/** Sobre de semilla en HTML (selección y planta nueva). */
export function sobreHTML(id: string): HTMLButtonElement {
  const b = el('button', 'pvz-sobre');
  b.type = 'button';
  b.dataset.planta = id;
  const ventana = el('span', 'ventana');
  ventana.append(retratoPlanta(id, 64));
  b.append(ventana, el('b', 'costo', String(defPlanta(id)?.sol ?? '')));
  return b;
}

// ---------------------------------------------------------------------------------------------------------------
// Título

export interface OpcionesTitulo {
  nivelActual: string;
  bloqueos: Record<string, string | null>;
  alElegir(accion: string): void;
}

export function pantallaTitulo(contenedor: HTMLElement, op: OpcionesTitulo): HTMLElement {
  const p = el('section', 'pvz-titulo');
  const n = op.nivelActual.split('-');
  p.innerHTML = `
    <div class="logo"><span class="plantas">PLANTAS</span><span class="contra">contra</span><span class="zombis">ZOMBIS</span><small>La Semilla Madre</small></div>
    <button class="lapida principal" data-accion="aventura"><b>AVENTURA</b><small>Mundo ${n[0]} · Nivel ${op.nivelActual}</small></button>
    <div class="lapidas">
      ${[
        ['minijuegos', 'Minijuegos'], ['rompecabezas', 'Rompecabezas'], ['supervivencia', 'Supervivencia'], ['fusion', 'Fusión'],
      ].map(([a, t]) => `<button class="lapida" data-accion="${a}"><b>${t}</b><small></small></button>`).join('')}
    </div>
    <div class="extras">
      ${[
        ['almanaque', 'Almanaque'], ['tienda', 'Tienda de Dave'], ['clasicos', 'Patios clásicos'], ['dos', 'Dos jugadores'], ['opciones', 'Opciones'], ['salir', '‹ Volver'],
      ].map(([a, t]) => `<button class="pvz-boton" data-accion="${a}">${t}</button>`).join('')}
    </div>`;
  for (const b of p.querySelectorAll<HTMLButtonElement>('[data-accion]')) {
    const motivo = op.bloqueos[b.dataset.accion!];
    if (motivo) {
      b.classList.add('bloqueado');
      b.setAttribute('aria-disabled', 'true');
      const s = b.querySelector('small');
      if (s) s.textContent = motivo;
      else b.title = motivo;
    }
    b.addEventListener('click', () => {
      sonido.desbloquear();
      if (motivo) {
        sonido.efecto('error');
        b.classList.add('sacude');
        window.setTimeout(() => b.classList.remove('sacude'), 400);
        avisoBreve(p, motivo);
        return;
      }
      sonido.efecto('boton');
      op.alElegir(b.dataset.accion!);
    });
  }
  contenedor.append(p);
  return p;
}

function avisoBreve(donde: HTMLElement, texto: string): void {
  const a = el('div', 'pvz-aviso-breve', '');
  a.textContent = texto;
  donde.append(a);
  window.setTimeout(() => a.remove(), 1800);
}

// ---------------------------------------------------------------------------------------------------------------
// Mapa de la aventura

export interface OpcionesMapa {
  completados: readonly string[];
  actual: string;
  mundo: number;
  alJugar(id: string): void;
  alVolver(): void;
}

export function pantallaMapa(contenedor: HTMLElement, op: OpcionesMapa): HTMLElement {
  const p = el('section', 'pvz-mapa');
  let mundo = op.mundo;
  const construido = (n: number) => NIVELES.some((x) => x.mundo === n);
  const pintar = () => {
    const hechos = new Set(op.completados);
    const niveles = Array.from({ length: NIVELES_POR_MUNDO[mundo] }, (_, i) => `${mundo}-${i + 1}`);
    const nombre = MUNDOS[mundo - 1].nombre;
    p.innerHTML = `
      <header><button class="pvz-boton" data-volver>‹ Volver</button><h2>Mundo ${mundo} · ${nombre}</h2><span class="acto">Acto ${MUNDOS[mundo - 1].acto}</span></header>
      <nav class="mundos">${MUNDOS.map((m) => `<button class="mundo ${m.n === mundo ? 'activo' : ''} ${construido(m.n) ? '' : 'pronto'}" data-mundo="${m.n}" aria-label="Mundo ${m.n}">${m.n}</button>`).join('')}</nav>
      <div class="camino mundo-${mundo}">
        ${niveles.map((id, i) => {
          const def = NIVELES.find((x) => x.id === id);
          const hecho = hechos.has(id);
          const libre = def && (hecho || id === op.actual);
          const tipo = def?.tipo === 'minijuego' ? '🎳' : def?.tipo === 'cinta' ? '⇄' : def?.tipo === 'jefe' ? '☠' : '';
          return `<button class="nodo ${hecho ? 'hecho' : ''} ${id === op.actual ? 'actual' : ''} ${libre ? '' : 'cerrado'}" data-nivel="${id}" style="--i:${i}" ${libre ? '' : 'aria-disabled="true"'}>
            <b>${id}</b><small>${tipo}${hecho ? ' ✓' : ''}</small></button>`;
        }).join('')}
      </div>
      ${construido(mundo) ? '' : '<p class="pronto-texto">Este mundo todavía está en construcción.</p>'}`;
    p.querySelector('[data-volver]')!.addEventListener('click', () => {
      sonido.efecto('boton');
      op.alVolver();
    });
    for (const b of p.querySelectorAll<HTMLButtonElement>('[data-mundo]')) {
      b.addEventListener('click', () => {
        sonido.efecto('boton');
        mundo = Number(b.dataset.mundo);
        pintar();
      });
    }
    for (const b of p.querySelectorAll<HTMLButtonElement>('[data-nivel]')) {
      b.addEventListener('click', () => {
        if (b.classList.contains('cerrado')) {
          sonido.efecto('error');
          return;
        }
        sonido.efecto('boton');
        op.alJugar(b.dataset.nivel!);
      });
    }
  };
  pintar();
  contenedor.append(p);
  return p;
}

// ---------------------------------------------------------------------------------------------------------------
// Selección de semillas

/** El jugador elige los sobres del banco. Resuelve con la lista cuando toca «¡A jugar!». */
export function elegirSemillas(contenedor: HTMLElement, nivel: DefNivel, disponibles: readonly string[], ranuras: number, previo: readonly string[] = []): Promise<string[]> {
  return new Promise((listo) => {
    const p = el('section', 'pvz-seleccion');
    p.innerHTML = `<div class="banco-eleccion"><b>Elige tus semillas</b><div class="ranuras"></div></div>
      <div class="catalogo"></div>
      <button class="pvz-boton grande jugar" type="button">¡A jugar!</button>`;
    const ranurasEl = p.querySelector<HTMLElement>('.ranuras')!;
    const catalogo = p.querySelector<HTMLElement>('.catalogo')!;
    const jugar = p.querySelector<HTMLButtonElement>('.jugar')!;
    const elegidas: string[] = previo.filter((x) => disponibles.includes(x)).slice(0, ranuras);
    const pintar = () => {
      ranurasEl.innerHTML = '';
      for (let i = 0; i < ranuras; i++) {
        const id = elegidas[i];
        if (!id) {
          ranurasEl.append(el('span', 'ranura-vacia'));
          continue;
        }
        const b = sobreHTML(id);
        b.addEventListener('click', () => {
          sonido.efecto('sobre');
          elegidas.splice(elegidas.indexOf(id), 1);
          pintar();
        });
        ranurasEl.append(b);
      }
      catalogo.innerHTML = '';
      for (const id of disponibles) {
        const b = sobreHTML(id);
        if (elegidas.includes(id)) b.classList.add('usado');
        b.addEventListener('click', () => {
          if (elegidas.includes(id)) {
            elegidas.splice(elegidas.indexOf(id), 1);
          } else if (elegidas.length < ranuras) elegidas.push(id);
          else {
            sonido.efecto('error');
            return;
          }
          sonido.efecto('sobre');
          pintar();
        });
        catalogo.append(b);
      }
      const lleno = elegidas.length >= Math.min(ranuras, disponibles.length);
      jugar.disabled = !lleno;
      jugar.textContent = lleno ? '¡A jugar!' : `Elige ${Math.min(ranuras, disponibles.length) - elegidas.length} más`;
    };
    jugar.addEventListener('click', () => {
      if (jugar.disabled) return;
      sonido.efecto('boton');
      p.remove();
      listo([...elegidas]);
    });
    void nivel;
    pintar();
    contenedor.append(p);
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Premios y fin

/** Pantalla de la planta u objeto ganado. */
export function pantallaPremio(contenedor: HTMLElement, premio: { planta?: string; objeto?: string }): Promise<void> {
  return new Promise((listo) => {
    const p = el('section', 'pvz-premio');
    if (premio.planta) {
      const def = defPlanta(premio.planta);
      const texto = PLANTAS_TEXTO[premio.planta]?.descripcion ?? def?.descripcion ?? '';
      p.innerHTML = `<h2>¡Conseguiste una planta nueva!</h2><div class="tarjeta"><div class="foto"></div><h3></h3><p class="costo"></p><p class="texto"></p></div><button class="pvz-boton grande" type="button">¡Siguiente!</button>`;
      p.querySelector('.foto')!.append(retratoPlanta(premio.planta, 200, true));
      p.querySelector('h3')!.textContent = def?.nombre ?? premio.planta;
      p.querySelector('.costo')!.textContent = def ? `Costo: ${def.sol} de sol` : '';
      p.querySelector('.texto')!.textContent = texto;
    } else {
      const o = OBJETOS[premio.objeto ?? ''] ?? { titulo: '¡Un premio!', texto: '', icono: '★' };
      p.innerHTML = `<h2></h2><div class="tarjeta"><div class="foto icono"></div><p class="texto"></p></div><button class="pvz-boton grande" type="button">¡Siguiente!</button>`;
      p.querySelector('h2')!.textContent = o.titulo;
      p.querySelector('.foto')!.textContent = o.icono;
      p.querySelector('.texto')!.textContent = o.texto;
    }
    sonido.efecto('plantaNueva');
    contenedor.append(p);
    p.querySelector('button')!.addEventListener('click', () => {
      sonido.efecto('boton');
      p.remove();
      listo();
    });
  });
}

/** «¡Los zombis se comieron tus sesos!». Resuelve con la elección. */
export function pantallaDerrota(contenedor: HTMLElement): Promise<'reintentar' | 'mapa'> {
  return new Promise((listo) => {
    const p = el('section', 'pvz-derrota');
    p.innerHTML = `<h1>¡LOS ZOMBIS SE COMIERON<br>TUS SESOS!</h1><div class="botones"><button class="pvz-boton grande" data-r="reintentar">Intentar de nuevo</button><button class="pvz-boton" data-r="mapa">Volver al mapa</button></div>`;
    contenedor.append(p);
    for (const b of p.querySelectorAll<HTMLButtonElement>('[data-r]')) {
      b.addEventListener('click', () => {
        sonido.efecto('boton');
        p.remove();
        listo(b.dataset.r as 'reintentar' | 'mapa');
      });
    }
  });
}

export interface OpcionesPausa {
  velocidad: number;
  efectos: boolean;
  musica: boolean;
  alElegir(accion: 'seguir' | 'reiniciar' | 'velocidad' | 'efectos' | 'musica' | 'mapa'): void;
}

/** Menú de pausa (el libro del menú de PvZ). */
export function menuPausa(contenedor: HTMLElement, op: OpcionesPausa): HTMLElement {
  const p = el('section', 'pvz-pausa');
  p.innerHTML = `<div class="libro"><h2>Pausa</h2>
    <button class="pvz-boton grande" data-a="seguir">Volver al juego</button>
    <button class="pvz-boton" data-a="velocidad">Velocidad ×${op.velocidad}</button>
    <button class="pvz-boton" data-a="efectos">Efectos: ${op.efectos ? 'sí' : 'no'}</button>
    <button class="pvz-boton" data-a="musica">Música: ${op.musica ? 'sí' : 'no'}</button>
    <button class="pvz-boton" data-a="reiniciar">Reiniciar nivel</button>
    <button class="pvz-boton" data-a="mapa">Salir al mapa</button></div>`;
  contenedor.append(p);
  for (const b of p.querySelectorAll<HTMLButtonElement>('[data-a]')) {
    b.addEventListener('click', () => {
      sonido.efecto('boton');
      op.alElegir(b.dataset.a as Parameters<OpcionesPausa['alElegir']>[0]);
    });
  }
  return p;
}

/** Mensaje con botón (guardado fallido, avisos). */
export function mensaje(contenedor: HTMLElement, titulo: string, texto: string, botones: { texto: string; valor: string }[]): Promise<string> {
  return new Promise((listo) => {
    const p = el('section', 'pvz-mensaje');
    p.innerHTML = `<div class="libro"><h2></h2><p></p><div class="botones"></div></div>`;
    p.querySelector('h2')!.textContent = titulo;
    p.querySelector('p')!.textContent = texto;
    for (const b of botones) {
      const e = el('button', 'pvz-boton', '');
      e.textContent = b.texto;
      e.addEventListener('click', () => {
        sonido.efecto('boton');
        p.remove();
        listo(b.valor);
      });
      p.querySelector('.botones')!.append(e);
    }
    contenedor.append(p);
  });
}
