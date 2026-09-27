// Interfaz sobre el lienzo: HUD, globos, avisos de vitrinas, números de la fila de acciones y monedas.
import type { Juego, Resultado } from './juego';
import { metaDe, textoDe } from './juego';
import { aTres, Mundo } from './mundo';
import { icono } from './recursos';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

export function mostrar(id: string, si = true) {
  $(id).hidden = !si;
}

export function pantallaUnica(id: string | null) {
  for (const p of ['carga', 'menu', 'tarjeta', 'resultado', 'mejoras', 'como', 'pausa']) mostrar(p, p === id);
}

/** Elementos anclados al mundo 3D, reciclados cuadro a cuadro. */
class Capa {
  private el = $('capa');
  private vivos = new Map<string, HTMLElement>();
  private vistos = new Set<string>();

  empezar() {
    this.vistos.clear();
  }
  elemento(clave: string, crear: () => HTMLElement): HTMLElement {
    let e = this.vivos.get(clave);
    if (!e) {
      e = crear();
      this.el.appendChild(e);
      this.vivos.set(clave, e);
    }
    this.vistos.add(clave);
    return e;
  }
  terminar() {
    for (const [k, e] of this.vivos)
      if (!this.vistos.has(k)) {
        e.remove();
        this.vivos.delete(k);
      }
  }
  limpiar() {
    for (const e of this.vivos.values()) e.remove();
    this.vivos.clear();
  }
}

const div = (clase: string, html = '') => {
  const d = document.createElement('div');
  d.className = clase;
  d.innerHTML = html;
  return d;
};

export class UI {
  capa = new Capa();
  private monedas: { el: HTMLElement; t: number }[] = [];
  private ultimoEvento = 0;
  alTocarAlerta: ((id: number) => void) | null = null;

  constructor(private mundo: Mundo) {}

  empezarNivel(j: Juego) {
    this.capa.limpiar();
    this.ultimoEvento = 0;
    $('hud-nivel').textContent = `Nivel ${j.nivel.numero}`;
    const obj = $('hud-objetivos');
    obj.innerHTML = '';
    for (const e of j.nivel.estrellas) {
      const chip = div('chip-objetivo', `<span class="chip-estrella" aria-hidden="true"></span><span class="chip-texto"></span>`);
      chip.title = textoDe(e.texto);
      obj.appendChild(chip);
    }
    mostrar('hud');
    mostrar('alertas');
  }

  terminarNivel() {
    this.capa.limpiar();
    mostrar('hud', false);
    mostrar('alertas', false);
  }

  private pos(p: { x: number; y: number }, z: number) {
    return this.mundo.aPantalla(aTres(p.x, p.y, z));
  }

  actualizar(j: Juego) {
    // HUD
    const r = Math.ceil(j.restante);
    $('hud-reloj').textContent = `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`;
    $('hud-reloj').classList.toggle('poco', r <= 20);
    $('hud-dinero').textContent = String(j.stats.ventas + j.stats.propinas);
    const chips = $('hud-objetivos').children;
    j.nivel.estrellas.forEach((e, i) => {
      const c = chips[i] as HTMLElement;
      if (!c) return;
      const ok = j.cumple(e);
      c.classList.toggle('ok', ok);
      (c.querySelector('.chip-texto') as HTMLElement).textContent = j.progreso(e);
    });

    this.capa.empezar();
    // Avisos de vitrinas y barra de inventario
    const alertas: { id: number; producto: string; vacia: boolean }[] = [];
    for (const v of j.tienda.enVenta) {
      const f = v.fraccion;
      if (f >= 0.5) continue;
      const c = v.centro();
      const p = this.pos(c, 2.3);
      const barra = this.capa.elemento(`barra-${v.dato.id}`, () => div('barra-inventario', '<i></i>'));
      barra.style.transform = `translate(${p.x}px, ${p.y}px)`;
      const i = barra.firstElementChild as HTMLElement;
      i.style.width = `${Math.max(4, f * 100)}%`;
      barra.dataset.nivel = f > 0.2 ? 'medio' : f > 0 ? 'bajo' : 'vacio';
      if (f <= 0.2) {
        const producto = v.productos[0];
        const aviso = this.capa.elemento(`aviso-${v.dato.id}`, () => div('aviso', '<b>!</b><img alt="">'));
        aviso.style.transform = `translate(${p.x}px, ${p.y - 34}px)`;
        aviso.classList.toggle('vacio', f === 0);
        const img = aviso.querySelector('img') as HTMLImageElement;
        if (f === 0 && img.dataset.p !== producto) {
          img.src = icono(producto);
          img.dataset.p = producto;
        }
        alertas.push({ id: v.dato.id, producto, vacia: f === 0 });
      }
    }
    this.pintarAlertas(alertas);
    // Globos de los clientes
    for (const c of j.clientes) {
      if (c.estado === 'fuera') continue;
      const p = this.mundo.aPantalla(c.cabeza());
      const g = this.capa.elemento(`cliente-${c.id}`, () => div('globo', '<img alt=""><span class="cara"></span><span class="paciencia"><i></i></span>'));
      g.style.transform = `translate(${p.x}px, ${p.y}px)`;
      const img = g.querySelector('img') as HTMLImageElement;
      const deseo = c.deseo;
      const modo = c.estado === 'saliendo' ? (c.enojado ? 'enojado' : 'feliz') : c.estado === 'enfila' || c.estado === 'afila' ? 'fila' : 'compra';
      g.dataset.modo = modo;
      g.classList.toggle('esperando', c.estado === 'esperando');
      if (modo === 'compra' && deseo && img.dataset.p !== deseo) {
        img.src = icono(deseo);
        img.dataset.p = deseo;
      }
      const barra = g.querySelector('.paciencia i') as HTMLElement;
      barra.style.width = `${Math.round(c.paciencia * 100)}%`;
      barra.dataset.nivel = c.paciencia > 0.66 ? 'alta' : c.paciencia > 0.33 ? 'media' : 'baja';
    }
    // Basura
    for (const b of j.basuras) {
      const p = this.pos(b.pos, 0.5);
      const e = this.capa.elemento(`basura-${b.id}`, () => div('marca-basura', '!'));
      e.style.transform = `translate(${p.x}px, ${p.y}px)`;
    }
    // Números de la fila de acciones
    j.jugador.fila.forEach((t, k) => {
      const o = j.jugador.objetivo(t);
      const p = this.pos(o, 1.7);
      const e = this.capa.elemento(`tarea-${t.id}`, () => div('numero-tarea'));
      e.textContent = String(k + 1);
      e.classList.toggle('actual', k === 0);
      e.style.transform = `translate(${p.x}px, ${p.y}px)`;
    });
    this.capa.terminar();
    // Monedas que saltan al cobrar
    for (; this.ultimoEvento < j.eventos.length; this.ultimoEvento++) {
      const ev = j.eventos[this.ultimoEvento];
      if (ev.tipo === 'cobro') {
        const p = this.pos(j.tienda.caja.vitrina.centro(), 1.4);
        const el = div('moneda-salta', `+${ev.data.monto}${ev.data.propina ? ` <small>+${ev.data.propina} propina</small>` : ''}`);
        el.style.transform = `translate(${p.x}px, ${p.y}px)`;
        $('capa').appendChild(el);
        this.monedas.push({ el, t: 0 });
      } else if (ev.tipo === 'perdido') {
        this.aviso('Un cliente se fue sin comprar');
      }
    }
    this.monedas = this.monedas.filter((m) => {
      m.t += 1 / 60;
      if (m.t > 1.4) {
        m.el.remove();
        return false;
      }
      return true;
    });
  }

  private pintarAlertas(alertas: { id: number; producto: string; vacia: boolean }[]) {
    const bandeja = $('alertas');
    const clave = alertas.map((a) => `${a.id}${a.vacia ? 'v' : 'b'}`).join(',');
    if (bandeja.dataset.clave === clave) return;
    bandeja.dataset.clave = clave;
    bandeja.innerHTML = '';
    if (!alertas.length) {
      bandeja.appendChild(div('alertas-vacia', 'Todas las vitrinas tienen producto'));
      return;
    }
    for (const a of alertas) {
      const b = document.createElement('button');
      b.className = `alerta${a.vacia ? ' vacia' : ''}`;
      b.innerHTML = `<img src="${icono(a.producto)}" alt=""><span>${a.vacia ? 'Vacía' : 'Poco'}</span>`;
      b.setAttribute('aria-label', `Reponer ${a.producto}`);
      b.addEventListener('click', () => this.alTocarAlerta?.(a.id));
      bandeja.appendChild(b);
    }
  }

  aviso(texto: string) {
    const t = $('toast');
    t.textContent = texto;
    t.hidden = false;
    t.classList.remove('sale');
    void t.offsetWidth;
    t.classList.add('sale');
    clearTimeout((t as any)._h);
    (t as any)._h = setTimeout(() => (t.hidden = true), 2200);
  }

  /** Tiquete de caja con el resultado del día. */
  resultado(j: Juego, r: Resultado, antes: boolean[]) {
    const s = r.stats;
    const espera = s.esperas.length ? s.esperas.reduce((a, b) => a + b, 0) / s.esperas.length : 0;
    $('rec-titulo').textContent = `Nivel ${j.nivel.numero} · Día ${j.nivel.dia}`;
    const est = $('rec-estrellas');
    est.innerHTML = '';
    r.estrellas.forEach((ok, i) => {
      const e = j.nivel.estrellas[i];
      const li = document.createElement('li');
      li.className = ok ? 'ganada' : '';
      li.style.animationDelay = `${0.25 + i * 0.35}s`;
      li.innerHTML = `<span class="sello" aria-hidden="true"></span><span>${textoDe(e.texto)}</span>`;
      if (ok && !antes[i]) li.classList.add('nueva');
      est.appendChild(li);
    });
    const lineas = [
      ['Ventas', `${s.ventas}`],
      ['Propinas', `${s.propinas}`],
      ['Clientes atendidos', `${s.atendidos}`],
      ['Clientes felices', `${s.felices}`],
      ['Se fueron sin comprar', `${s.perdidos}`],
      ['Espera promedio en caja', `${espera.toFixed(1)} s`],
      ['Vitrina vacía (máx.)', `${s.vaciaMax.toFixed(0)} s`],
    ];
    $('rec-lineas').innerHTML = lineas.map(([a, b]) => `<div><span>${a}</span><span>${b}</span></div>`).join('');
    $('rec-total').textContent = String(r.ganancia);
    $('btn-siguiente').hidden = !r.estrellas[0];
    $('rec-pasa').textContent = r.estrellas[0]
      ? '¡Día aprobado! Ya puedes jugar el siguiente nivel.'
      : `Falta la meta de ventas (${metaDe(j.nivel.estrellas[0].meta)}). Repite el día; la plata ganada igual se guarda.`;
  }
}
