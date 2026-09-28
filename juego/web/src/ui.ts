// Interfaz sobre el lienzo: HUD, globos, avisos de vitrinas, marcas de problemas, números de la fila de acciones y monedas.
import { AYUDAS } from './balance';
import type { Juego, Resultado } from './juego';
import { metaDe, textoDe } from './juego';
import { aTres, Mundo } from './mundo';
import type { P } from './navegacion';
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
  private pops: { el: HTMLElement; t: number }[] = [];
  private ultimoEvento = 0;
  alTocarAlerta: ((id: number) => void) | null = null;
  alUsarAyuda: ((id: string) => void) | null = null;
  alTomarCorazon: (() => void) | null = null;

  constructor(private mundo: Mundo) {}

  empezarNivel(j: Juego, ayudas: Record<string, number>) {
    this.capa.limpiar();
    this.ultimoEvento = 0;
    $('hud-nivel').textContent = `${j.legendario ? 'Legendario' : 'Nivel'} ${j.nivel.numero}`;
    $('hud-nivel').classList.toggle('legendario', j.legendario);
    const obj = $('hud-objetivos');
    obj.innerHTML = '';
    const metas = j.legendario && j.metaLuna ? [{ texto: j.metaLuna.texto }] : j.nivel.estrellas.map((e) => ({ texto: textoDe(e.texto) }));
    for (const e of metas) {
      const chip = div(`chip-objetivo${j.legendario ? ' luna' : ''}`, `<span class="chip-estrella" aria-hidden="true"></span><span class="chip-texto"></span>`);
      chip.title = e.texto;
      obj.appendChild(chip);
    }
    this.pintarAyudas(ayudas, j);
    this.claveCarrito = '';
    mostrar('hud');
    mostrar('alertas');
    mostrar('carrito');
  }

  private claveCarrito = '';
  /** El carrito de la pantalla: un hueco por estante que alcanza a llenar, con lo que le queda de cada producto. */
  private pintarCarrito(j: Juego) {
    const jug = j.jugador;
    const huecos = Array.from({ length: jug.capacidadCarrito }, (_, i) => jug.carga[i] ?? null);
    const clave = `${jug.cargandoBodega}|${huecos.map((h) => (h ? `${h.producto}:${h.unidades}/${h.max}` : '-')).join(',')}`;
    if (clave === this.claveCarrito) return;
    this.claveCarrito = clave;
    $('carrito').classList.toggle('cargando', jug.cargandoBodega);
    $('carrito').title = 'Carrito: carga en la bodega lo justo para dejar lleno un estante';
    $('carrito-huecos').innerHTML = huecos
      .map((h) =>
        h
          ? `<div class="hueco-carrito"><img src="${icono(h.producto)}" alt=""><span class="barrita"><i style="width:${Math.round((100 * h.unidades) / Math.max(1, h.max))}%"></i></span><b>${h.unidades}</b></div>`
          : `<div class="hueco-carrito vacio"><span>${jug.cargandoBodega ? '…' : 'vacío'}</span></div>`,
      )
      .join('');
  }

  /** Botones de las ayudas de un solo uso (tinto, canción, limpieza). */
  pintarAyudas(ayudas: Record<string, number>, j: Juego) {
    const barra = $('ayudas');
    barra.innerHTML = '';
    for (const a of AYUDAS) {
      const n = ayudas[a.id] ?? 0;
      if (!n && j.dia < a.desde) continue;
      const b = document.createElement('button');
      b.className = `ayuda ayuda-${a.id}`;
      b.disabled = n <= 0;
      b.innerHTML = `<i aria-hidden="true"></i><b>${n}</b>`;
      b.title = `${a.nombre}: ${a.texto}`;
      b.setAttribute('aria-label', `${a.nombre} (${n})`);
      b.addEventListener('click', () => this.alUsarAyuda?.(a.id));
      barra.appendChild(b);
    }
    barra.hidden = !barra.children.length;
  }

  terminarNivel() {
    this.capa.limpiar();
    for (const p of this.pops) p.el.remove();
    this.pops = [];
    mostrar('hud', false);
    mostrar('alertas', false);
    mostrar('ayudas', false);
    mostrar('carrito', false);
  }

  private pos(p: P, z: number) {
    return this.mundo.aPantalla(aTres(p.x, p.y, z));
  }

  actualizar(j: Juego, dt: number) {
    // HUD
    const r = Math.ceil(j.restante);
    const reloj = $('hud-reloj');
    reloj.textContent = j.cerrado ? 'Cerrado' : `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`;
    reloj.classList.toggle('poco', !j.cerrado && r <= 20);
    reloj.classList.toggle('cerrado', j.cerrado);
    $('hud-dinero').textContent = String(j.ganancia);
    this.pintarCarrito(j);
    $('hud-atendidos').textContent = String(j.stats.atendidos);
    $('hud-perdidos').textContent = String(j.stats.perdidos);
    $('hud-canastas').textContent = String(j.canastas);
    $('hud-canastas').parentElement!.classList.toggle('alerta', j.canastas === 0);
    const efectos: string[] = [];
    if (j.cafeActivo) efectos.push('Tinto');
    if (j.pacienciaCongelada) efectos.push('Canción');
    $('hud-efectos').textContent = efectos.join(' · ');
    $('hud-efectos').hidden = !efectos.length;
    const chips = $('hud-objetivos').children;
    if (j.legendario && j.metaLuna) {
      const c = chips[0] as HTMLElement | undefined;
      const ml = j.metaLuna;
      if (c) c.classList.toggle('ok', j.stats.ventas >= ml.ventas && j.stats.perdidos <= ml.perdidos);
      if (c) (c.querySelector('.chip-texto') as HTMLElement).textContent = `${j.stats.ventas}/${ml.ventas} · ${j.stats.perdidos}/${ml.perdidos} perdidos`;
    } else
      j.nivel.estrellas.forEach((e, i) => {
        const c = chips[i] as HTMLElement;
        if (!c) return;
        c.classList.toggle('ok', j.cumple(e));
        (c.querySelector('.chip-texto') as HTMLElement).textContent = j.progreso(e);
      });

    this.capa.empezar();
    // Avisos de vitrinas y barra de inventario
    const alertas: { id: number; producto: string; vacia: boolean }[] = [];
    for (const v of j.tienda.enVenta) {
      const f = v.fraccion;
      if (f >= 0.67) continue;
      const c = v.centro();
      const p = this.pos(c, 2.3);
      const barra = this.capa.elemento(`barra-${v.dato.id}`, () => div('barra-inventario', '<i></i>'));
      barra.style.transform = `translate(${p.x}px, ${p.y}px)`;
      const i = barra.firstElementChild as HTMLElement;
      i.style.width = `${Math.max(4, f * 100)}%`;
      barra.dataset.nivel = f > 0.34 ? 'medio' : f > 0 ? 'bajo' : 'vacio';
      if (f <= 0.34) {
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
      const g = this.capa.elemento(`cliente-${c.id}`, () => div('globo', '<img alt=""><span class="cara"></span><b class="cantidad"></b><span class="paciencia"><i></i></span>'));
      g.style.transform = `translate(${p.x}px, ${p.y}px)`;
      const img = g.querySelector('img') as HTMLImageElement;
      const deseo = c.deseo;
      const modo = c.estado === 'saliendo' ? (c.enojado ? 'enojado' : 'feliz') : c.esperandoCanasta ? 'canasta' : c.estado === 'enfila' || c.estado === 'afila' ? 'fila' : 'compra';
      g.dataset.modo = modo;
      g.classList.toggle('esperando', c.estado === 'esperando' || c.esperandoCanasta);
      g.classList.toggle('famoso', c.tipo === 'famoso');
      if (modo === 'compra' && deseo && img.dataset.p !== deseo) {
        img.src = icono(deseo);
        img.dataset.p = deseo;
      }
      const cant = g.querySelector('.cantidad') as HTMLElement;
      const n = c.cantidadDeseada;
      cant.textContent = modo === 'compra' && n > 1 ? `×${n}` : '';
      const barra = g.querySelector('.paciencia i') as HTMLElement;
      barra.style.width = `${Math.round(c.paciencia * 100)}%`;
      barra.dataset.nivel = c.paciencia > 0.66 ? 'alta' : c.paciencia > 0.33 ? 'media' : 'baja';
    }
    // Basura, charcos y productos caídos
    for (const m of j.mugres) {
      const p = this.pos(m.pos, 0.4);
      const e = this.capa.elemento(`mugre-${m.id}`, () => {
        const d = div(`marca-mugre marca-${m.tipo}`, m.tipo === 'caidos' ? `<img alt=""><b>${m.unidades ?? 1}</b>` : '<i></i>');
        if (m.tipo === 'caidos' && m.producto) (d.querySelector('img') as HTMLImageElement).src = icono(m.producto);
        return d;
      });
      e.classList.toggle('reservada', !!m.reservado);
      e.style.transform = `translate(${p.x}px, ${p.y}px)`;
    }
    for (const c of j.canastasSueltas) {
      const p = this.pos(c.pos, 0.4);
      const e = this.capa.elemento(`canasta-${c.id}`, () => div('marca-mugre marca-canasta', '<i></i>'));
      e.style.transform = `translate(${p.x}px, ${p.y}px)`;
    }
    // Ladrones y niña traviesa
    for (const l of j.ladrones) {
      if (!l.activo || !l.visible) continue;
      const p = this.mundo.aPantalla(l.cabeza());
      const e = this.capa.elemento(`ladron-${l.id}`, () => div('marca-alerta ladron', '!'));
      e.style.transform = `translate(${p.x}px, ${p.y}px)`;
    }
    for (const n of j.ninas) {
      if (!n.activo) continue;
      const p = this.mundo.aPantalla(n.cabeza());
      const e = this.capa.elemento(`nina-${n.id}`, () => div('marca-alerta nina', '!'));
      e.style.transform = `translate(${p.x}px, ${p.y}px)`;
    }
    // Corazón escondido: se toca directamente
    if (j.corazonVisible && j.corazon) {
      const p = this.pos(j.corazon.pos, 0.35);
      const e = this.capa.elemento('corazon', () => {
        const b = document.createElement('button');
        b.className = 'corazon-escondido';
        b.setAttribute('aria-label', 'Corazón escondido');
        b.addEventListener('pointerdown', (ev) => {
          ev.stopPropagation();
          this.alTomarCorazon?.();
        });
        return b;
      });
      e.style.transform = `translate(${p.x}px, ${p.y}px)`;
    }
    // Números de la fila de acciones
    j.jugador.fila.forEach((t, k) => {
      const o = j.jugador.objetivo(t);
      const p = this.pos(o, t.tipo === 'reponer' || t.tipo === 'caja' ? 1.7 : 0.9);
      const e = this.capa.elemento(`tarea-${t.id}`, () => div('numero-tarea'));
      e.textContent = String(k + 1);
      e.classList.toggle('actual', k === 0);
      e.style.transform = `translate(${p.x}px, ${p.y}px)`;
    });
    this.capa.terminar();
    // Monedas, combos y avisos
    for (; this.ultimoEvento < j.eventos.length; this.ultimoEvento++) {
      const ev = j.eventos[this.ultimoEvento];
      if (ev.tipo === 'cobro') {
        this.pop(j.tienda.caja.vitrina.centro(), `+${ev.data.monto}${ev.data.propina ? ` <small>+${ev.data.propina} propina</small>` : ''}`, 'moneda', 1.4);
      } else if (ev.tipo === 'pop' && ev.pos) {
        this.pop(ev.pos, ev.texto ?? '', ev.data?.clase ?? '', 1.6);
      } else if (ev.tipo === 'perdido') {
        this.aviso('Un cliente se fue bravo sin comprar');
      } else if (ev.tipo === 'aviso' && ev.texto) {
        this.aviso(ev.texto);
      }
    }
    this.pops = this.pops.filter((m) => {
      m.t += dt;
      if (m.t > 1.6) {
        m.el.remove();
        return false;
      }
      return true;
    });
  }

  private pop(pos: P, html: string, clase: string, z: number) {
    const p = this.pos(pos, z);
    const el = div(`moneda-salta ${clase}`, html);
    el.style.transform = `translate(${p.x}px, ${p.y}px)`;
    $('capa').appendChild(el);
    this.pops.push({ el, t: 0 });
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
    (t as any)._h = setTimeout(() => (t.hidden = true), 2400);
  }

  /** Tiquete de caja con el resultado del día. */
  resultado(j: Juego, r: Resultado, antes: boolean[]) {
    const s = r.stats;
    const espera = s.esperas.length ? s.esperas.reduce((a, b) => a + b, 0) / s.esperas.length : 0;
    $('rec-titulo').textContent = `${j.legendario ? 'Legendario' : 'Nivel'} ${j.nivel.numero} · Día ${j.nivel.dia}`;
    const est = $('rec-estrellas');
    est.innerHTML = '';
    if (j.legendario && j.metaLuna) {
      const li = document.createElement('li');
      li.className = r.luna ? 'ganada luna' : 'luna';
      li.innerHTML = `<span class="sello" aria-hidden="true"></span><span>${j.metaLuna.texto}</span>`;
      est.appendChild(li);
    } else
      r.estrellas.forEach((ok, i) => {
        const e = j.nivel.estrellas[i];
        const li = document.createElement('li');
        li.className = ok ? 'ganada' : '';
        li.style.animationDelay = `${0.25 + i * 0.35}s`;
        li.innerHTML = `<span class="sello" aria-hidden="true"></span><span>${textoDe(e.texto)}</span>`;
        if (ok && !antes[i]) li.classList.add('nueva');
        est.appendChild(li);
      });
    const lineas: [string, string][] = [
      ['Ventas', `${s.ventas}`],
      ['Propinas', `${s.propinas}`],
      ['Combos y premios', `${s.bonos}`],
      ['Clientes atendidos', `${s.atendidos}`],
      ['Se fueron bravos', `${s.perdidos}`],
      ['Espera promedio en caja', `${espera.toFixed(1)} s`],
      ['Vitrina vacía (máx.)', `${s.vaciaMax.toFixed(0)} s`],
    ];
    if (j.problemas.includes('basura') || j.problemas.includes('derrames')) lineas.push(['Mugre en el piso (máx.)', `${s.basuraMax.toFixed(0)} s`]);
    if (j.problemas.includes('derrames')) lineas.push(['Resbalones', `${s.resbalones}`]);
    if (j.problemas.includes('ladron')) lineas.push(['Ladrones atrapados / robos', `${s.atrapados} / ${s.robos}`]);
    if (r.corazon) lineas.push(['Corazón escondido', 'Encontrado']);
    $('rec-lineas').innerHTML = lineas.map(([a, b]) => `<div><span>${a}</span><span>${b}</span></div>`).join('');
    $('rec-total').textContent = String(r.ganancia);
    const pasa = j.legendario ? true : r.estrellas[0];
    $('btn-siguiente').hidden = !pasa || j.legendario;
    $('rec-pasa').textContent = j.legendario
      ? r.luna ? '¡Luna ganada! Eso fue de leyenda.' : 'Esta vez no salió la Luna. Con más mejoras se vuelve más fácil.'
      : r.estrellas[0]
        ? '¡Día aprobado! Ya puedes jugar el siguiente nivel.'
        : `Falta la meta de ventas (${metaDe(j.nivel.estrellas[0].meta)}). Repite el día; la plata ganada igual se guarda.`;
  }
}
