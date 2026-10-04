// La tienda del retrete: se paga con los rollitos dorados del vuelo. Mejoras por niveles (lo que dura cada poder,
// imán más fuerte, burbuja de arranque, segunda oportunidad, arranque con frijoles…), retretes, estelas y cascos
// (se prueban en el modelo 3D de la izquierda antes de comprarlos) y las misiones con el multiplicador.
import { nota } from '../../sonido';
import { iconoEstela } from './arte';
import {
  CASCOS, COSMETICOS, ESTELAS, type IdMejora, MEJORAS, type ProgresoCohete, RETRETES, type TipoCosmetico, comprar, cuentasNuevas,
  esDeVuelo, multiplicador, nivelDe, precioMejora, premioMision, premioNivel, revisarMisiones, textoMision, tieneCosmetico, valorDe,
} from './datos';
import type { Rol } from '../modelo';

type Pestana = 'mejoras' | 'retrete' | 'estela' | 'casco' | 'misiones';
const PESTANAS: [Pestana, string][] = [['mejoras', 'Mejoras'], ['retrete', 'Retretes'], ['estela', 'Estelas'], ['casco', 'Cascos'], ['misiones', 'Misiones']];

const mil = (v: number) => Math.round(v).toLocaleString('es-CO');
const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const ico = (archivo: string) => `./modelos/iconos/cohete_${archivo}.webp`;

/** Íconos de las estelas (se pintan una vez). */
const iconosEstela = new Map<string, string>();

export interface AlTienda {
  probar: (tipo: TipoCosmetico, id: string) => void;
  comprado: () => void;
  cerrar: () => void;
}

export class Tienda {
  private raiz: HTMLElement;
  private pestana: Pestana = 'mejoras';
  /** Lo que se está probando (sin comprar) en cada tipo. */
  private probando: Partial<Record<TipoCosmetico, string>> = {};

  constructor(private capa: HTMLElement, private p: ProgresoCohete, private rol: Rol, private al: AlTienda) {
    this.raiz = document.createElement('section');
    this.raiz.className = 'cohete-tienda';
    this.raiz.innerHTML = `
      <div class="ct-vitrina"><small></small><b></b><span></span></div>
      <div class="ct-panel">
        <header class="ct-cab">
          <h2>Tienda del retrete</h2>
          <span class="ct-saldo"><i class="ico-rollito"></i><b></b></span>
          <button class="ct-cerrar" aria-label="Cerrar">✕</button>
        </header>
        <nav class="ct-pestanas">${PESTANAS.map(([id, t]) => `<button data-pestana="${id}">${t}</button>`).join('')}</nav>
        <div class="ct-lista"></div>
      </div>`;
    capa.append(this.raiz);
    this.raiz.addEventListener('click', (e) => this.clic(e));
    requestAnimationFrame(() => this.raiz.classList.add('abierta'));
    this.repintar();
  }

  private clic(e: Event) {
    const t = e.target as HTMLElement;
    const b = (sel: string) => t.closest(sel) as HTMLElement | null;
    let el: HTMLElement | null;
    if (b('.ct-cerrar')) return this.cerrar();
    if ((el = b('[data-pestana]'))) {
      this.pestana = el.dataset.pestana as Pestana;
      nota(880, 0.05, 0, 'triangle', 0.04);
      return this.repintar(true);
    }
    if ((el = b('[data-mejora]'))) return this.comprarMejora(el.dataset.mejora as IdMejora, el);
    if ((el = b('[data-comprar]'))) {
      const [tipo, id] = el.dataset.comprar!.split(':') as [TipoCosmetico, string];
      return this.comprarCosmetico(tipo, id, el);
    }
    if ((el = b('[data-usar]'))) {
      const [tipo, id] = el.dataset.usar!.split(':') as [TipoCosmetico, string];
      this.p.puesto[tipo] = id;
      delete this.probando[tipo];
      this.al.probar(tipo, id);
      this.al.comprado();
      nota(1046, 0.08, 0, 'triangle', 0.05);
      return this.repintar();
    }
    if ((el = b('[data-probar]'))) {
      const [tipo, id] = el.dataset.probar!.split(':') as [TipoCosmetico, string];
      this.probando[tipo] = id;
      this.al.probar(tipo, id);
      nota(1318, 0.06, 0, 'sine', 0.04);
      return this.repintar();
    }
  }

  private cerrada = false;
  private cerrar() {
    // (un toque doble en la ✕ no cierra dos veces)
    if (this.cerrada) return;
    this.cerrada = true;
    this.raiz.classList.remove('abierta');
    nota(660, 0.08, 0, 'triangle', 0.04);
    setTimeout(() => this.raiz.remove(), 280);
    this.al.cerrar();
  }

  private pagado(boton: HTMLElement) {
    // Los rollitos vuelan del saldo al botón y suena la caja
    [1318, 1760, 2093].forEach((f, i) => nota(f, 0.1, i * 0.06, 'triangle', 0.06));
    const r = boton.getBoundingClientRect();
    for (let k = 0; k < 7; k++) {
      const s = document.createElement('i');
      s.className = 'ico-rollito ct-vuela';
      s.style.left = `${r.left + r.width / 2}px`;
      s.style.top = `${r.top + r.height / 2}px`;
      s.style.setProperty('--dx', `${(Math.random() - 0.5) * 120}px`);
      s.style.setProperty('--dy', `${-40 - Math.random() * 80}px`);
      s.style.animationDelay = `${k * 0.03}s`;
      this.capa.append(s);
      setTimeout(() => s.remove(), 900);
    }
    // La compra cuenta para las misiones de la tienda
    revisarMisiones(this.p, cuentasNuevas(), this.p.misiones.map((m) => m.avance), true);
    this.al.comprado();
  }

  private sinPlata(boton: HTMLElement) {
    boton.classList.remove('no');
    void boton.offsetWidth;
    boton.classList.add('no');
    nota(220, 0.2, 0, 'triangle', 0.05);
  }

  private comprarMejora(id: IdMejora, boton: HTMLElement) {
    const precio = precioMejora(this.p, id);
    if (precio === null) return;
    if (!comprar(this.p, { mejora: id })) return this.sinPlata(boton);
    this.pagado(boton);
    this.repintar();
    this.raiz.querySelector(`[data-tarjeta="m-${id}"]`)?.classList.add('recien');
  }

  private comprarCosmetico(tipo: TipoCosmetico, id: string, boton: HTMLElement) {
    if (!comprar(this.p, { tipo, id })) return this.sinPlata(boton);
    delete this.probando[tipo];
    this.al.probar(tipo, id);
    this.pagado(boton);
    this.repintar();
    this.raiz.querySelector(`[data-tarjeta="${tipo}-${id}"]`)?.classList.add('recien');
  }

  /** Vuelve a dibujar la lista (y el saldo). */
  repintar(cambioPestana = false) {
    const p = this.p;
    this.raiz.querySelector('.ct-saldo b')!.textContent = mil(p.rollitos);
    this.raiz.querySelectorAll<HTMLElement>('[data-pestana]').forEach((b) => b.setAttribute('aria-current', String(b.dataset.pestana === this.pestana)));
    const lista = this.raiz.querySelector('.ct-lista') as HTMLElement;
    const arriba = lista.scrollTop;
    lista.innerHTML = this.pestana === 'mejoras' ? this.htmlMejoras() : this.pestana === 'misiones' ? this.htmlMisiones() : this.htmlCosmeticos(this.pestana);
    lista.scrollTop = cambioPestana ? 0 : arriba;
    this.pintarVitrina();
  }

  private pintarVitrina() {
    const v = this.raiz.querySelector('.ct-vitrina') as HTMLElement;
    const tipo = this.pestana === 'retrete' || this.pestana === 'estela' || this.pestana === 'casco' ? this.pestana : null;
    const id = tipo ? this.probando[tipo] ?? this.p.puesto[tipo] : null;
    const c = tipo && id ? COSMETICOS[tipo].find((x) => x.id === id) : null;
    v.querySelector('small')!.textContent = tipo && this.probando[tipo] ? 'Probándote' : 'Tienes puesto';
    v.querySelector('b')!.textContent = c ? c.nombre : `${RETRETES.find((x) => x.id === this.p.puesto.retrete)?.nombre ?? ''}`;
    v.querySelector('span')!.textContent = c ? c.texto : `${mil(this.p.mejor)} m de récord · ${mil(this.p.ganados)} rollitos en total`;
  }

  private pips(n: number, max: number) {
    return `<span class="ct-pips">${Array.from({ length: max }, (_, i) => `<i class="${i < n ? 'si' : ''}"></i>`).join('')}</span>`;
  }

  private boton(precio: number, datos: string, texto = '') {
    const alcanza = this.p.rollitos >= precio;
    return `<button class="ct-precio${alcanza ? '' : ' caro'}" ${datos}>${texto ? `<span>${texto}</span>` : ''}<b><i class="ico-rollito"></i>${mil(precio)}</b></button>`;
  }

  private htmlMejoras() {
    const grupo = (g: 'poder' | 'vuelo', titulo: string) =>
      `<h3 class="ct-titulo">${titulo}</h3>` +
      MEJORAS.filter((m) => m.grupo === g)
        .map((m) => {
          const n = nivelDe(this.p, m.id);
          const max = m.precios.length;
          const precio = precioMejora(this.p, m.id);
          const ahora = m.decir(valorDe(this.p, m.id));
          const despues = precio !== null ? m.decir(m.valores[n + 1]) : '';
          const bloqueada = m.valores[0] === 0 && n === 0 && m.grupo === 'poder';
          return `<article class="ct-tarjeta mejora${n >= max ? ' llena' : ''}${bloqueada ? ' bloqueada' : ''}" data-tarjeta="m-${m.id}">
            <img src="${ico(m.icono)}" alt="" onerror="this.style.visibility='hidden'">
            <div class="ct-info"><b>${esc(m.nombre)}</b><small>${esc(m.texto)}</small>
              ${this.pips(n, max)}
              <span class="ct-valor">${esc(ahora)}${despues ? ` <i>→</i> <em>${esc(despues)}</em>` : ''}</span></div>
            ${precio !== null ? this.boton(precio, `data-mejora="${m.id}"`, bloqueada ? 'Desbloquear' : '') : '<span class="ct-listo">¡Al máximo!</span>'}
          </article>`;
        })
        .join('');
    return grupo('poder', 'Poderes del vuelo') + grupo('vuelo', 'Mejoras del retrete');
  }

  private iconoCosmetico(tipo: TipoCosmetico, id: string) {
    if (tipo === 'estela') {
      let u = iconosEstela.get(id);
      if (!u) {
        u = iconoEstela(id);
        iconosEstela.set(id, u);
      }
      return u;
    }
    if (tipo === 'casco') return ico(`casco_${id}_${this.rol}`);
    return ico(`retrete_${id}`);
  }

  private htmlCosmeticos(tipo: TipoCosmetico) {
    const lista = tipo === 'retrete' ? RETRETES : tipo === 'estela' ? ESTELAS : CASCOS;
    const intro = {
      retrete: 'El trono con el que vuelas. Toca uno para verlo en la vitrina.',
      estela: 'Lo que vas dejando atrás (además del fuego).',
      casco: 'Para proteger la cabeza… o el peinado.',
    }[tipo];
    return `<p class="ct-nota">${intro}</p><div class="ct-rejilla">` + lista
      .map((c) => {
        const tiene = tieneCosmetico(this.p, tipo, c.id);
        const puesto = this.p.puesto[tipo] === c.id;
        const probando = this.probando[tipo] === c.id;
        const accion = puesto
          ? '<span class="ct-puesto">Puesto ✓</span>'
          : tiene
            ? `<button class="ct-usar" data-usar="${tipo}:${c.id}">Usar</button>`
            : this.boton(c.precio, `data-comprar="${tipo}:${c.id}"`);
        return `<article class="ct-tarjeta cosmetico${puesto ? ' puesto' : ''}${probando ? ' probando' : ''}${tiene ? '' : ' nuevo'}" data-tarjeta="${tipo}-${c.id}" data-probar="${tipo}:${c.id}">
          <img src="${this.iconoCosmetico(tipo, c.id)}" alt="" onerror="this.style.visibility='hidden'">
          <b>${esc(c.nombre)}</b><small>${esc(c.texto)}</small>${accion}
        </article>`;
      })
      .join('') + '</div>';
  }

  private htmlMisiones() {
    const p = this.p;
    const mult = multiplicador(p);
    const misiones = p.misiones
      .map((m) => {
        const k = Math.min(1, m.avance / m.meta);
        return `<article class="ct-mision${m.hecha ? ' hecha' : ''}">
          <i class="ct-check">${m.hecha ? '✓' : ''}</i>
          <div><b>${esc(textoMision(m))}</b><span class="ct-barra"><i style="width:${(m.hecha ? 1 : k) * 100}%"></i></span>
          <small>${m.hecha ? '¡Lista!' : `${mil(m.avance)} / ${mil(m.meta)}${esDeVuelo(m) ? ' (en un solo vuelo)' : ''}`}</small></div>
          <em>+${mil(premioMision(p.nivel))} <i class="ico-rollito"></i></em>
        </article>`;
      })
      .join('');
    return `<div class="ct-nivel"><b>×${mult}</b><div><strong>Nivel ${p.nivel + 1} de misiones</strong>
        <small>Cumple las tres para subir el multiplicador del puntaje a ×${mult + 1} y ganarte un cofre de ${mil(premioNivel(p.nivel))} rollitos.</small></div></div>
      ${misiones}
      <h3 class="ct-titulo">Tus números</h3>
      <div class="ct-numeros">
        <span><b>${mil(p.mejor)} m</b><small>Vuelo más largo</small></span>
        <span><b>${mil(p.mejorPuntaje)}</b><small>Mejor puntaje</small></span>
        <span><b>${mil(p.vuelos)}</b><small>Vuelos</small></span>
        <span><b>${mil(p.ganados)}</b><small>Rollitos ganados</small></span>
      </div>`;
  }
}

