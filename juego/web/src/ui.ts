// Interfaz sobre el lienzo: HUD, herramientas (carrito, trapero, bolsa), globos, avisos de vitrinas, marcas de problemas,
// números de la fila de acciones, mareos de los choques y monedas.
import { AYUDAS, BOLSA_BASURA } from './balance';
import type { Juego, Resultado } from './juego';
import { metaDe, textoDe } from './juego';
import type { Jugador } from './jugador';
import * as THREE from 'three';
import { Mundo } from './mundo';
import { escHtml, esNeutro } from './neutro';
import type { P } from './navegacion';
import { icono } from './recursos';
import { avisoSuave, salirSuave } from './transiciones';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

export function mostrar(id: string, si = true) {
  $(id).hidden = !si;
}

export function pantallaUnica(id: string | null) {
  // La pantalla de carga se desvanece en vez de cortarse de golpe
  if (id !== 'carga') salirSuave($('carga'));
  for (const p of ['carga', 'menu', 'tarjeta', 'resultado', 'mejoras', 'como', 'pausa', 'sala', 'codigo']) mostrar(p, p === id);
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

/** Lo último que se escribió en cada elemento: escribir lo mismo cada cuadro (texto, posición, ancho) obliga al
 *  navegador a recalcular estilos y repintar sin necesidad; así solo se toca lo que cambió. */
const escrito = new WeakMap<HTMLElement, Record<string, string>>();
function cambio(el: HTMLElement, que: string, v: string) {
  let m = escrito.get(el);
  if (!m) escrito.set(el, (m = {}));
  if (m[que] === v) return false;
  m[que] = v;
  return true;
}
const texto = (el: HTMLElement, v: string) => cambio(el, '#t', v) && (el.textContent = v);
const estilo = (el: HTMLElement, prop: 'transform' | 'width', v: string) => cambio(el, prop, v) && el.style.setProperty(prop, v);
const dato = (el: HTMLElement, k: string, v: string) => cambio(el, `d-${k}`, v) && (el.dataset[k] = v);
const mover = (el: HTMLElement, x: number, y: number) => estilo(el, 'transform', `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`);

/** Punto de trabajo para pasar del piso a la pantalla (sin crear un vector por globo en cada cuadro). */
const PUNTO = new THREE.Vector3();

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

  /** `yo`: en una sala, el personaje de este celular (su tira va a la izquierda y la de los demás a la derecha). */
  empezarNivel(j: Juego, ayudas: Record<string, number>, yo?: Jugador) {
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
    // Una tira de herramientas por personaje (en pareja, cada una en la esquina de su joystick)
    const herr = $('herramientas');
    herr.innerHTML = '';
    herr.classList.toggle('pareja', j.pareja && !j.enSala);
    herr.classList.toggle('sala', j.enSala);
    this.clavesHerr = j.jugadores.map(() => '');
    let derecha = 0;
    for (const p of j.jugadores) {
      const d = div(`herr herr-${p.rol}`);
      if (j.enSala) {
        // La mía arriba a la izquierda (como siempre); las de los demás, en fila arriba a la derecha y más pequeñas
        const mia = p === (yo ?? j.jugadores[0]);
        d.classList.add(mia ? 'herr-mia' : 'herr-otro');
        if (!mia) d.style.setProperty('--fila', String(derecha++));
        if (p.color) d.style.setProperty('--c', p.color);
      }
      herr.appendChild(d);
    }
    document.body.classList.toggle('en-pareja', j.pareja);
    mostrar('hud');
    mostrar('alertas');
    mostrar('herramientas');
  }

  private clavesHerr: string[] = [];
  /** Lo que lleva cada uno: el carrito (reposiciones para cualquier estante), el trapero, la bolsa de basura y las canastas. */
  private pintarHerramientas(j: Juego) {
    const tiras = $('herramientas').children;
    const conTrapero = j.pareja || j.problemas.includes('derrames') || this.vioMugre;
    const conBolsa = j.problemas.includes('basura');
    j.jugadores.forEach((p, i) => {
      const tira = tiras[i] as HTMLElement | undefined;
      if (!tira) return;
      const clave = [p.carga, p.capacidadCarrito, p.cargandoBodega, p.trapero, p.capacidadTrapero, p.lavando, p.bolsa, p.canastasEnMano, conTrapero, conBolsa].join('|');
      if (clave === this.clavesHerr[i]) return;
      this.clavesHerr[i] = clave;
      const pct = (a: number, b: number) => Math.round((100 * a) / Math.max(1, b));
      const partes = [
        `<span class="herr-item herr-carrito${p.cargandoBodega ? ' cargando' : ''}${p.carga === 0 ? ' vacio' : ''}" title="Carrito: se llena en la bodega; cada reposición deja lleno un estante">`
          + `<i class="ico" aria-hidden="true"></i><span class="medidor"><i style="width:${pct(p.carga, p.capacidadCarrito)}%"></i></span><b>${p.carga}/${p.capacidadCarrito}</b></span>`,
      ];
      if (conTrapero || p.trapero > 0)
        partes.push(`<span class="herr-item herr-trapero${p.traperoLleno ? ' lleno' : ''}${p.lavando ? ' lavando' : ''}" title="Trapero: cuando se llena, a lavarlo en el balde">`
          + `<i class="ico" aria-hidden="true"></i><span class="medidor"><i style="width:${pct(p.trapero, p.capacidadTrapero)}%"></i></span><b>${p.traperoLleno ? '¡Lávalo!' : `${p.trapero}/${p.capacidadTrapero}`}</b></span>`);
      if (conBolsa || p.bolsa > 0)
        partes.push(`<span class="herr-item herr-bolsa${p.bolsa >= BOLSA_BASURA ? ' lleno' : ''}" title="Bolsa de basura: se vacía en la caneca"><i class="ico" aria-hidden="true"></i><b>${p.bolsa}/${BOLSA_BASURA}</b></span>`);
      if (p.canastasEnMano > 0) partes.push(`<span class="herr-item herr-canastas" title="Canastas para devolver a la entrada"><i class="ico" aria-hidden="true"></i><b>${p.canastasEnMano}</b></span>`);
      tira.innerHTML = (j.pareja ? `<span class="herr-nombre">${escHtml(p.nombre)}</span>` : '') + partes.join('');
    });
  }
  /** Ya salió mugre por trapear hoy (aunque no sea día de derrames): desde ahí se ve el trapero. */
  private vioMugre = false;

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
    mostrar('herramientas', false);
    document.body.classList.remove('en-pareja');
    this.vioMugre = false;
  }

  private pos(p: P, z: number) {
    return this.mundo.aPantalla(PUNTO.set(p.x, z, -p.y));
  }

  actualizar(j: Juego, dt: number) {
    // HUD
    const r = Math.ceil(j.restante);
    const reloj = $('hud-reloj');
    texto(reloj, j.cerrado ? 'Cerrado' : `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`);
    reloj.classList.toggle('poco', !j.cerrado && r <= 20);
    reloj.classList.toggle('cerrado', j.cerrado);
    texto($('hud-dinero'), String(j.ganancia));
    if (!this.vioMugre && j.mugres.some((m) => m.tipo === 'charco' || m.tipo === 'sucio')) this.vioMugre = true;
    this.pintarHerramientas(j);
    texto($('hud-atendidos'), String(j.stats.atendidos));
    texto($('hud-perdidos'), String(j.stats.perdidos));
    texto($('hud-canastas'), String(j.canastas));
    $('hud-canastas').parentElement!.classList.toggle('alerta', j.canastas === 0);
    const efectos: string[] = [];
    if (j.cafeActivo) efectos.push('Tinto');
    if (j.pacienciaCongelada) efectos.push('Canción');
    texto($('hud-efectos'), efectos.join(' · '));
    if ($('hud-efectos').hidden !== !efectos.length) $('hud-efectos').hidden = !efectos.length;
    const chips = $('hud-objetivos').children;
    if (j.legendario && j.metaLuna) {
      const c = chips[0] as HTMLElement | undefined;
      const ml = j.metaLuna;
      if (c) c.classList.toggle('ok', j.stats.ventas >= ml.ventas && j.stats.perdidos <= ml.perdidos);
      if (c) texto(c.querySelector('.chip-texto') as HTMLElement, `${j.stats.ventas}/${ml.ventas} · ${j.stats.perdidos}/${ml.perdidos} perdidos`);
    } else
      j.nivel.estrellas.forEach((e, i) => {
        const c = chips[i] as HTMLElement;
        if (!c) return;
        c.classList.toggle('ok', j.cumple(e));
        texto(c.querySelector('.chip-texto') as HTMLElement, j.progreso(e));
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
      mover(barra, p.x, p.y);
      const i = barra.firstElementChild as HTMLElement;
      estilo(i, 'width', `${Math.max(4, Math.round(f * 100))}%`);
      dato(barra, 'nivel', f > 0.34 ? 'medio' : f > 0 ? 'bajo' : 'vacio');
      if (f <= 0.34) {
        const producto = v.productos[0];
        const aviso = this.capa.elemento(`aviso-${v.dato.id}`, () => div('aviso', '<b>!</b><img alt="">'));
        mover(aviso, p.x, p.y - 34);
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
      mover(g, p.x, p.y);
      const img = g.querySelector('img') as HTMLImageElement;
      const deseo = c.deseo;
      const modo = c.estado === 'saliendo' ? (c.enojado ? 'enojado' : 'feliz') : c.esperandoCanasta ? 'canasta' : c.estado === 'enfila' || c.estado === 'afila' ? 'fila' : 'compra';
      dato(g, 'modo', modo);
      // En la fila: carita verde (contento), amarilla (impaciente) o roja (a punto de irse)
      dato(g, 'animo', modo === 'fila' ? c.animo : '');
      g.classList.toggle('esperando', c.estado === 'esperando' || c.esperandoCanasta);
      g.classList.toggle('famoso', c.tipo === 'famoso');
      if (modo === 'compra' && deseo && img.dataset.p !== deseo) {
        img.src = icono(deseo);
        img.dataset.p = deseo;
      }
      const cant = g.querySelector('.cantidad') as HTMLElement;
      const n = c.cantidadDeseada;
      texto(cant, modo === 'compra' && n > 1 ? `×${n}` : '');
      const barra = g.querySelector('.paciencia i') as HTMLElement;
      estilo(barra, 'width', `${Math.round(c.paciencia * 100)}%`);
      dato(barra, 'nivel', c.paciencia > 0.66 ? 'alta' : c.paciencia > 0.33 ? 'media' : 'baja');
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
      if (m.tipo === 'caidos') texto(e.querySelector('b') as HTMLElement, String(m.unidades ?? 1));
      mover(e, p.x, p.y);
    }
    for (const c of j.canastasSueltas) {
      const p = this.pos(c.pos, 0.4);
      const e = this.capa.elemento(`canasta-${c.id}`, () => div('marca-mugre marca-canasta', '<i></i>'));
      mover(e, p.x, p.y);
    }
    // Ladrones y niña traviesa
    for (const l of j.ladrones) {
      if (!l.activo || !l.visible) continue;
      const p = this.mundo.aPantalla(l.cabeza());
      const e = this.capa.elemento(`ladron-${l.id}`, () => div('marca-alerta ladron', '!'));
      mover(e, p.x, p.y);
    }
    for (const n of j.ninas) {
      if (!n.activo) continue;
      const p = this.mundo.aPantalla(n.cabeza());
      const e = this.capa.elemento(`nina-${n.id}`, () => div('marca-alerta nina', '!'));
      mover(e, p.x, p.y);
    }
    // Corazón escondido: aparece quieto en su sitio; se toca o se pasa por encima. Se desvanece al final de su rato.
    if (j.corazonVisible && j.corazon) {
      const p = this.pos(j.corazon.pos, 0.35);
      const e = this.capa.elemento('corazon', () => {
        const b = document.createElement('button');
        b.className = 'corazon-escondido';
        b.setAttribute('aria-label', esNeutro() ? 'Trébol de la suerte' : 'Corazón escondido');
        b.addEventListener('pointerdown', (ev) => {
          ev.stopPropagation();
          this.alTomarCorazon?.();
        });
        return b;
      });
      e.classList.toggle('se-va', j.corazon.hasta - j.tiempo < 1.5);
      mover(e, Math.round(p.x), Math.round(p.y));
    }
    for (const jug of j.jugadores) this.pintarJugador(j, jug);
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

  /** Números de su fila de acciones, barrita de lo que está haciendo, estrellitas del mareo y (en pareja) su nombre. */
  private pintarJugador(j: Juego, jug: Jugador) {
    jug.fila.forEach((t, k) => {
      const o = jug.objetivo(t);
      const p = this.pos(o, t.tipo === 'reponer' || t.tipo === 'caja' ? 1.7 : 0.9);
      const e = this.capa.elemento(`tarea-${t.id}`, () => {
        const d = div(`numero-tarea tarea-${jug.rol}`);
        if (j.enSala && jug.color) d.style.setProperty('--c', jug.color);
        return d;
      });
      texto(e, String(k + 1));
      e.classList.toggle('actual', k === 0);
      mover(e, p.x, p.y);
    });
    const cabeza = this.mundo.aPantalla(jug.cabeza());
    if (jug.haciendo) {
      const e = this.capa.elemento(`hace-${jug.id}`, () => div('barra-accion', '<i></i>'));
      mover(e, cabeza.x, cabeza.y);
      estilo(e.firstElementChild as HTMLElement, 'width', `${Math.round(jug.progresoAccion * 100)}%`);
    }
    if (jug.atontado) {
      const e = this.capa.elemento(`mareo-${jug.id}`, () => div('mareo', '<span><i></i><i></i><i></i></span>'));
      mover(e, cabeza.x, cabeza.y);
    }
    if (j.pareja) {
      const e = this.capa.elemento(`nombre-${jug.id}`, () => {
        const d = div(`nombre-jugador nombre-${jug.rol}`, escHtml(jug.nombre));
        if (j.enSala && jug.color) {
          d.classList.add('con-color');
          d.style.setProperty('--c', jug.color);
        }
        return d;
      });
      mover(e, cabeza.x, cabeza.y);
    }
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

  private relojAviso = { id: 0 };
  /** Aviso abajo: entra con un brinquito y se va bajando suave. */
  aviso(texto: string) {
    avisoSuave($('toast'), texto, 2400, this.relojAviso);
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
    if (j.pareja) {
      lineas.push([`Combos ${j.textoEquipo}`, `${s.combosPareja}`]);
      if (s.choques) lineas.push(['Choques / estantes tumbados', `${s.choques} / ${s.tumbados}`]);
    }
    if (r.corazon) lineas.push([esNeutro() ? 'Trébol de la suerte' : 'Corazón escondido', 'Encontrado']);
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
