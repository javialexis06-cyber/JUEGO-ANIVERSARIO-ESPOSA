// Lo que se ve encima del estudio 3D, como en la tele: la barra «EN VIVO», el marcador, los tercios con nombres,
// el globo del presentador, la cortinilla de cada ronda, el panel para contestar en secreto, las tarjetas que se
// voltean al revelar, el relámpago, el medidor de conexión y el cierre del programa.
import './show.css';
import * as sonido from '../../sonido';
import type { Estudio } from './estudio';
import { esAbierta, type Item, type ModoShow, otroRol, type Resp, type Resultado } from './motor';
import { armar, CATEGORIAS, NOMBRE, type Pregunta, type Rol } from './preguntas';
import { SFX } from './sonidos';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const CORTO: Record<Rol, string> = { el: 'ÉL', ella: 'ELLA' };

/** El texto de una respuesta guardada. */
export function textoValor(p: Pregunta, item: Item, v: string | undefined, campo: 'a' | 'g'): string {
  if (v === undefined) return '';
  if (v === '-') return 'Se le fue el tiempo';
  switch (p.tipo) {
    case 'quien':
    case 'zapato':
      return v === 'e' ? 'Él' : v === 'a' ? 'Ella' : v;
    case 'prefiere':
      return p.o[Number(v)] ?? v;
    case 'historia':
      return p.o[Number(v)] ?? v;
    case 'termo':
      return v;
    case 'conoce':
      return p.o ? armar(p.o[Number(v)] ?? v, item.s ?? 'el') : v;
  }
  void campo;
  return v;
}

interface PanelOpciones {
  p: Pregunta;
  item: Item;
  quien: Rol;
  tarea: { a: boolean; g: boolean };
  seg: number;
  texto: () => string;
  otroYa?: () => boolean;
  pausado: () => boolean;
  cancelado: () => boolean;
}

export class UI {
  raiz: HTMLElement;
  private $ = <T extends HTMLElement = HTMLElement>(sel: string) => this.raiz.querySelector(sel) as T;
  private tAviso = 0;
  private relojes: number[] = [];
  private globoReloj = 0;
  private estudioGlobo: Estudio | null = null;
  private puntosVistos: Record<Rol, number> = { el: 0, ella: 0 };
  private saltar: (() => void) | null = null;

  constructor(private yo: Rol, private modo: ModoShow, private rapido: number, private acciones: { salir: () => void }) {
    const r = document.createElement('section');
    r.id = 'show';
    r.className = 'show';
    r.dataset.yo = yo;
    r.innerHTML = `
      <canvas class="show-lienzo" aria-hidden="true"></canvas>
      <div class="show-efectos" aria-hidden="true"></div>
      <div class="show-viñeta" aria-hidden="true"></div>
      <header class="show-barra">
        <button class="show-boton show-salir" aria-label="Salir del show"></button>
        <span class="show-envivo"><i></i>EN VIVO</span>
        <span class="show-bug"><b>El Show</b><small>de Nosotros</small></span>
        <span class="show-chip" hidden></span>
        <span class="show-espacio"></span>
        <button class="show-boton show-musica boton-musica" aria-label="Música">♪</button>
        <button class="show-boton show-sonido" aria-label="Sonido"></button>
      </header>
      <div class="show-marcador" hidden>
        <span class="show-marca" data-r="el"><em>ÉL</em><b>0</b></span>
        <i class="show-marca-corazon"></i>
        <span class="show-marca" data-r="ella"><b>0</b><em>ELLA</em></span>
      </div>
      <div class="show-globo" hidden><b class="show-globo-nombre"></b><span class="show-globo-texto"></span></div>
      <div class="show-tercio" hidden><b></b><small></small></div>
      <div class="show-pregunta" hidden><small></small><p></p></div>
      <aside class="show-panel" hidden></aside>
      <div class="show-espera" hidden></div>
      <div class="show-revela" hidden></div>
      <div class="show-cortina" hidden></div>
      <div class="show-pausa" hidden></div>
      <div class="show-final" hidden></div>
      <button class="show-saltar" hidden>Saltar ⏭</button>
      <div class="show-carga"><div class="show-carga-logo"><b>El Show</b><small>de Nosotros</small></div><p></p></div>
      <div class="show-aviso" role="status" hidden></div>`;
    document.body.append(r);
    document.body.classList.add('con-show');
    this.raiz = r;
    r.addEventListener('click', (ev) => {
      const b = (ev.target as HTMLElement).closest<HTMLElement>('button');
      if (!b) return;
      if (b.classList.contains('show-salir')) this.acciones.salir();
      else if (b.classList.contains('show-sonido')) {
        sonido.alternar();
        this.pintarBotones();
      } else if (b.classList.contains('show-musica')) {
        sonido.musica.alternar();
        this.pintarBotones();
      } else if (b.classList.contains('show-saltar')) this.saltar?.();
    });
    this.pintarBotones();
  }

  private pintarBotones() {
    this.$('.show-sonido').classList.toggle('apagado', sonido.silenciado());
    this.$('.show-musica').classList.toggle('apagado', sonido.musica.apagada());
  }

  private esperar(ms: number) {
    return new Promise<void>((r) => setTimeout(r, ms / this.rapido));
  }

  cargando(texto: string) {
    const c = this.$('.show-carga');
    c.hidden = false;
    c.querySelector('p')!.textContent = texto;
  }
  listo() {
    const c = this.$('.show-carga');
    c.classList.add('sale');
    setTimeout(() => (c.hidden = true), 700);
  }

  aviso(texto: string, ms = 2400) {
    const a = this.$('.show-aviso');
    a.textContent = texto;
    a.hidden = false;
    clearTimeout(this.tAviso);
    this.tAviso = window.setTimeout(() => (a.hidden = true), ms);
  }

  botonSaltar(fn: (() => void) | null) {
    this.saltar = fn;
    this.$('.show-saltar').hidden = !fn;
  }

  pausa(titulo: string | null, texto = '', conSalir = false) {
    const p = this.$('.show-pausa');
    p.hidden = !titulo;
    if (!titulo) return;
    p.innerHTML = `<div class="show-pausa-carta"><i class="show-pausa-icono">${conSalir ? '📡' : '⏸'}</i><h3>${esc(titulo)}</h3><p>${esc(texto)}</p>${
      conSalir ? '<button class="show-btn show-btn-papel" data-pausa-salir>Salir del show</button>' : ''
    }</div>`;
    p.querySelector<HTMLElement>('[data-pausa-salir]')?.addEventListener('click', () => this.acciones.salir());
  }

  ronda(info: { n: number; total: number; titulo: string } | null) {
    const c = this.$('.show-chip');
    c.hidden = !info;
    if (info) c.innerHTML = `<b>RONDA ${info.n}</b><span>${esc(info.titulo)}</span><i class="show-chip-n"></i>`;
  }
  pregunta(k: number, n: number) {
    const i = this.$('.show-chip-n');
    if (i) i.textContent = `${k}/${n}`;
  }

  marcador(p: Record<Rol, number>, animar: boolean) {
    const m = this.$('.show-marcador');
    m.hidden = false;
    for (const r of ['el', 'ella'] as Rol[]) {
      const b = m.querySelector(`[data-r="${r}"] b`) as HTMLElement;
      const desde = this.puntosVistos[r], hasta = p[r];
      if (!animar || desde === hasta) {
        b.textContent = String(hasta);
        continue;
      }
      const t0 = performance.now();
      const dur = 700 / this.rapido;
      const paso = () => {
        const k = Math.min(1, (performance.now() - t0) / dur);
        b.textContent = String(Math.round(desde + (hasta - desde) * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
      const caja = b.parentElement!;
      caja.classList.remove('sube');
      void caja.offsetWidth;
      caja.classList.add('sube');
      if (hasta > desde) this.volarPuntos(r, hasta - desde);
    }
    this.puntosVistos = { ...p };
  }

  private volarPuntos(r: Rol, n: number) {
    const el = document.createElement('div');
    el.className = `show-mas show-mas-${r}`;
    el.textContent = `+${n}`;
    this.raiz.append(el);
    el.animate(
      [
        { transform: 'translate(-50%, 0) scale(0.6)', opacity: 0 },
        { transform: 'translate(-50%, -26px) scale(1.25)', opacity: 1, offset: 0.25 },
        { transform: 'translate(-50%, -60px) scale(1)', opacity: 0 },
      ],
      { duration: 1300 / this.rapido, easing: 'ease-out' },
    ).onfinish = () => el.remove();
  }

  async cortinilla(titulo: string, sub: string) {
    const c = this.$('.show-cortina');
    c.className = 'show-cortina show-cortina-logo';
    c.hidden = false;
    c.innerHTML = `<div class="show-rayos"></div><div class="show-logo-grande"><span class="show-logo-el">El Show</span><span class="show-logo-de">de</span><span class="show-logo-nos">Nosotros</span><i class="show-logo-corazon"></i></div><p class="show-logo-sub">${esc(sub)}</p>`;
    void titulo;
    SFX.golpe();
    await this.esperar(2300);
    c.classList.add('sale');
    await this.esperar(450);
    c.hidden = true;
    c.className = 'show-cortina';
  }

  tercio(titulo: string | null, sub = '', rol?: Rol) {
    const t = this.$('.show-tercio');
    if (!titulo) {
      if (!t.hidden) {
        t.classList.add('sale');
        setTimeout(() => {
          t.hidden = true;
          t.classList.remove('sale');
        }, 350);
      }
      return;
    }
    t.dataset.rol = rol ?? 'perro';
    t.querySelector('b')!.textContent = titulo;
    t.querySelector('small')!.textContent = sub;
    t.hidden = false;
    t.classList.remove('sale', 'entra');
    void t.offsetWidth;
    t.classList.add('entra');
  }

  /** El globito del presentador: sale de su cabeza si está en cámara; si no, en la esquina como voz en off. */
  globoPerro(texto: string | null, nombre = '', estudio?: Estudio | null) {
    const g = this.$('.show-globo');
    cancelAnimationFrame(this.globoReloj);
    if (!texto) {
      g.hidden = true;
      return;
    }
    this.estudioGlobo = estudio ?? null;
    g.querySelector('.show-globo-nombre')!.textContent = nombre;
    g.querySelector('.show-globo-texto')!.textContent = texto;
    g.hidden = false;
    g.classList.remove('entra');
    void g.offsetWidth;
    g.classList.add('entra');
    const seguir = () => {
      const a = this.estudioGlobo?.anclaPerro() ?? null;
      const w = this.raiz.clientWidth, h = this.raiz.clientHeight;
      if (a && a.x > 40 && a.x < w - 40 && a.y > 30 && a.y < h - 20) {
        g.classList.add('anclado');
        g.classList.toggle('a-izquierda', a.x > w * 0.55);
        const gw = g.offsetWidth, gh = g.offsetHeight;
        let x = a.x > w * 0.55 ? a.x - gw - a.r * 0.6 : a.x + a.r * 0.6;
        x = Math.max(8, Math.min(w - gw - 8, x));
        const y = Math.max(52, Math.min(h - gh - 70, a.y - gh - a.r * 0.2));
        g.style.transform = `translate(${x}px, ${y}px)`;
      } else {
        g.classList.remove('anclado', 'a-izquierda');
        g.style.transform = '';
      }
      this.globoReloj = requestAnimationFrame(seguir);
    };
    seguir();
  }

  async entradaRonda(n: number, titulo: string, sub: string, color: string) {
    const c = this.$('.show-cortina');
    c.className = 'show-cortina show-cortina-ronda';
    c.style.setProperty('--color', color);
    c.hidden = false;
    c.innerHTML = `<div class="show-franjas"><i></i><i></i><i></i></div>
      <div class="show-ronda-caja"><span class="show-ronda-n">RONDA <b>${n}</b></span><h2>${esc(titulo)}</h2><p>${esc(sub)}</p></div>`;
    await this.esperar(2500);
    c.classList.add('sale');
    SFX.whoosh();
    await this.esperar(420);
    c.hidden = true;
    c.className = 'show-cortina';
  }

  tercioPregunta(texto: string | null, p?: Pregunta) {
    const q = this.$('.show-pregunta');
    if (!texto || !p) {
      q.hidden = true;
      return;
    }
    const cat = CATEGORIAS[p.cat];
    q.style.setProperty('--cat', cat.color);
    q.querySelector('small')!.textContent = `${cat.icono} ${cat.nombre}`;
    q.querySelector('p')!.textContent = texto;
    q.hidden = false;
    q.classList.remove('entra');
    void q.offsetWidth;
    q.classList.add('entra');
  }

  // ---------------------------------------------------------------------------------------------- Contestar
  /** El panel para contestar en secreto. Se resuelve al terminar o cuando se acaba el tiempo (lo que falte va con '-'). */
  panel(o: PanelOpciones): Promise<Resp> {
    const panel = this.$('.show-panel');
    const { p, item, quien } = o;
    const otro = otroRol(quien);
    const r: Resp = {};
    panel.hidden = false;
    panel.dataset.quien = quien;
    panel.classList.remove('sale');
    return new Promise<Resp>((listo) => {
      let terminado = false;
      const t0 = performance.now();
      let usado = 0;
      let antes = t0;
      let ultimoTic = -1;
      const fin = () => {
        if (terminado) return;
        terminado = true;
        clearInterval(reloj);
        panel.classList.add('sale');
        setTimeout(() => {
          if (panel.classList.contains('sale')) panel.hidden = true;
        }, 320);
        listo(r);
      };
      const reloj = window.setInterval(() => {
        if (o.cancelado()) return fin();
        const ahora = performance.now();
        if (!o.pausado()) usado += (ahora - antes) * this.rapido;
        antes = ahora;
        const queda = Math.max(0, o.seg - usado / 1000);
        const anillo = panel.querySelector<SVGCircleElement>('.show-reloj circle.lleno');
        if (anillo) anillo.style.strokeDashoffset = String(113 * (1 - queda / o.seg));
        const num = panel.querySelector('.show-reloj b');
        if (num) num.textContent = String(Math.ceil(queda));
        panel.classList.toggle('urgente', queda <= 5);
        const s = Math.ceil(queda);
        if (queda <= 5 && s !== ultimoTic && queda > 0) {
          ultimoTic = s;
          SFX.tic(s <= 2);
        }
        if (o.otroYa?.()) panel.classList.add('otro-ya');
        if (queda <= 0) {
          if (o.tarea.a && r.a === undefined) r.a = '-';
          if (o.tarea.g && r.g === undefined) r.g = '-';
          SFX.bzzz();
          fin();
        }
      }, 100);
      const cabeza = (instruccion: string) => `
        <header class="show-panel-cabeza">
          <span class="show-panel-quien" data-r="${quien}">${this.modo === 'local' ? `Turno de ${NOMBRE[quien]}` : 'Tu respuesta secreta 🤫'}</span>
          <span class="show-reloj"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18"/><circle class="lleno" cx="20" cy="20" r="18"/></svg><b>${o.seg}</b></span>
        </header>
        <p class="show-panel-pregunta">${esc(o.texto())}</p>
        <p class="show-panel-instruccion">${instruccion}</p>`;
      const pie = () => (this.modo === 'linea' ? `<footer class="show-panel-pie"><span class="show-otro" data-r="${otro}"><i></i>${NOMBRE[otro]} está pensando…</span></footer>` : '');
      const opciones = (lista: { v: string; texto: string; clase?: string }[], campo: 'a' | 'g', siguiente: () => void) => {
        const zona = panel.querySelector('.show-opciones')!;
        zona.innerHTML = lista.map((x, k) => `<button class="show-op ${x.clase ?? ''}" data-v="${esc(x.v)}" style="--k:${k}"><i>${String.fromCharCode(65 + k)}</i><span>${esc(x.texto)}</span></button>`).join('');
        zona.querySelectorAll<HTMLButtonElement>('.show-op').forEach((b) =>
          b.addEventListener('click', () => {
            if (terminado || o.pausado()) return;
            SFX.toque();
            r[campo] = b.dataset.v!;
            zona.querySelectorAll('.show-op').forEach((x) => x.classList.toggle('elegida', x === b));
            zona.classList.add('decidido');
            setTimeout(siguiente, 260 / this.rapido);
          }),
        );
      };
      const pasoFinal = () => {
        panel.querySelector('.show-panel-cuerpo')!.innerHTML = `<div class="show-listo"><i>✅</i><b>¡Listo!</b><small>${
          this.modo === 'linea' ? `Esperando a ${NOMBRE[otro]}…` : 'Guardadito en secreto'
        }</small></div>`;
        setTimeout(fin, (this.modo === 'linea' ? 500 : 650) / this.rapido);
      };
      const cuerpo = (html: string) => {
        panel.innerHTML = `${cabeza(html)}<div class="show-panel-cuerpo"><div class="show-opciones"></div></div>${pie()}`;
      };
      const quienOps = () => [
        { v: 'e', texto: 'Él', clase: 'op-el' },
        { v: 'a', texto: 'Ella', clase: 'op-ella' },
      ];
      switch (p.tipo) {
        case 'quien':
        case 'zapato':
          cuerpo('Señala en secreto:');
          opciones(quienOps(), 'a', pasoFinal);
          break;
        case 'historia':
          cuerpo('¿Cuál es la respuesta correcta?');
          opciones(p.o.map((t, k) => ({ v: String(k), texto: t })), 'a', pasoFinal);
          break;
        case 'prefiere': {
          cuerpo('<b>1.</b> ¿Qué prefieres <b>tú</b>?');
          const ops = p.o.map((t, k) => ({ v: String(k), texto: t }));
          opciones(ops, 'a', () => {
            panel.querySelector('.show-panel-instruccion')!.innerHTML = `<b>2.</b> ¿Y qué crees que escogió <b>${NOMBRE[otro]}</b>?`;
            const z = panel.querySelector('.show-opciones')!;
            z.classList.remove('decidido');
            z.classList.add('cambia');
            opciones(ops.map((x) => ({ ...x, clase: `op-${otro}` })), 'g', pasoFinal);
          });
          break;
        }
        case 'conoce': {
          const sujeto = item.s ?? 'el';
          const sobreMi = sujeto === quien;
          const instr = sobreMi ? '¡Es sobre <b>ti</b>! Di la verdad:' : `Adivina qué contestó <b>${NOMBRE[sujeto]}</b>:`;
          if (p.o) {
            cuerpo(instr);
            opciones(p.o.map((t, k) => ({ v: String(k), texto: armar(t, sujeto) })), sobreMi ? 'a' : 'g', pasoFinal);
          } else {
            panel.innerHTML = `${cabeza(`${instr} <small>(escríbelo cortico)</small>`)}<div class="show-panel-cuerpo"><form class="show-abierta"><input maxlength="60" autocomplete="off" placeholder="${sobreMi ? 'Mi respuesta…' : `Lo que creo que dijo ${NOMBRE[sujeto]}…`}"><button class="show-btn show-btn-oro" type="submit">Listo</button></form></div>${pie()}`;
            const f = panel.querySelector('form')!;
            const inp = f.querySelector('input')!;
            setTimeout(() => inp.focus(), 300);
            f.addEventListener('submit', (ev) => {
              ev.preventDefault();
              const v = inp.value.trim().replace(/\s+/g, ' ').slice(0, 60);
              if (!v || terminado) return;
              SFX.toque();
              inp.blur();
              r[sobreMi ? 'a' : 'g'] = v;
              pasoFinal();
            });
          }
          break;
        }
        case 'termo': {
          const sujeto = item.s ?? 'el';
          const sobreMi = sujeto === quien;
          panel.innerHTML = `${cabeza(sobreMi ? '¡Es sobre <b>ti</b>! Con la mano en el corazón:' : `¿Qué número puso <b>${NOMBRE[sujeto]}</b>?`)}
            <div class="show-panel-cuerpo"><div class="show-termo">
              <div class="show-termo-num"><b>5</b><i class="show-termo-cara">😐</i></div>
              <input type="range" min="1" max="10" step="1" value="5" aria-label="Del 1 al 10">
              <div class="show-termo-escala">${Array.from({ length: 10 }, (_, k) => `<i>${k + 1}</i>`).join('')}</div>
              <div class="show-termo-etiquetas"><span>1 · ${esc(armar(p.bajo, sujeto))}</span><span>${esc(armar(p.alto, sujeto))} · 10</span></div>
              <button class="show-btn show-btn-oro show-termo-ok">¡Ese es mi número!</button>
            </div></div>${pie()}`;
          const inp = panel.querySelector<HTMLInputElement>('input[type=range]')!;
          const caras = ['🥶', '😶', '🙂', '😐', '😏', '😮', '😳', '🔥', '🤯', '💥'];
          const pintar = () => {
            const v = Number(inp.value);
            panel.querySelector('.show-termo-num b')!.textContent = String(v);
            panel.querySelector('.show-termo-cara')!.textContent = caras[v - 1];
            panel.querySelector<HTMLElement>('.show-termo')!.style.setProperty('--v', String((v - 1) / 9));
          };
          inp.addEventListener('input', () => {
            pintar();
            SFX.medidor(Number(inp.value) / 10);
          });
          pintar();
          panel.querySelector('.show-termo-ok')!.addEventListener('click', () => {
            if (terminado || o.pausado()) return;
            SFX.toque();
            r[sobreMi ? 'a' : 'g'] = inp.value;
            pasoFinal();
          });
          break;
        }
      }
      this.relojes.push(reloj);
    });
  }

  otroContesto() {
    const o = this.$('.show-panel .show-otro');
    if (o) {
      o.classList.add('ya');
      o.innerHTML = `<i></i>¡${NOMBRE[o.dataset.r as Rol]} ya contestó! 👀`;
    }
  }

  esperandoOtro(texto: string | null) {
    const e = this.$('.show-espera');
    e.hidden = !texto;
    if (texto) e.innerHTML = `<span class="show-puntos"><i></i><i></i><i></i></span>${esc(texto)}`;
  }

  /** En el mismo celular: tapa la pantalla para pasárselo al otro. */
  async pasarCelular(quien: Rol | null, fase: 'primero' | 'despues' | 'revelar') {
    const c = this.$('.show-cortina');
    c.className = 'show-cortina show-cortina-telon';
    c.hidden = false;
    const html =
      quien === null
        ? `<div class="show-telon-caja"><i>👀</i><h2>¡Ya pueden mirar los dos!</h2><p>Pónganse juntitos que vamos a revelar.</p><button class="show-btn show-btn-oro">¡A ver, a ver!</button></div>`
        : `<div class="show-telon-caja" data-r="${quien}"><i>🙈</i><h2>Turno de ${NOMBRE[quien]}</h2><p>${NOMBRE[otroRol(quien)]}: ¡ojos cerrados y nada de mirar!</p><button class="show-btn show-btn-${quien}">Soy ${NOMBRE[quien]}: ¡listo!</button></div>`;
    c.innerHTML = `<div class="show-telon-tela izq"></div><div class="show-telon-tela der"></div>${html}`;
    void fase;
    await new Promise<void>((r) => c.querySelector('button')!.addEventListener('click', () => r(), { once: true }));
    SFX.toque();
    c.classList.add('abre');
    await this.esperar(450);
    c.hidden = true;
    c.className = 'show-cortina';
  }

  // ---------------------------------------------------------------------------------------------- Revelar
  async revelar(o: { p: Pregunta; item: Item; r: Partial<Record<Rol, Resp>>; res: Resultado; texto: () => string }) {
    const { p, item, r, res } = o;
    const zona = this.$('.show-revela');
    zona.hidden = false;
    zona.className = `show-revela tipo-${p.tipo}`;
    const tarjeta = (q: Rol, lineas: { k: string; v: string; ok?: 'si' | 'no' | 'casi' }[], sobre = false) => `
      <article class="show-tarjeta" data-r="${q}" style="--d:${q === 'el' ? 0 : 1}">
        <div class="show-tarjeta-giro">
          <div class="show-tarjeta-dorso"><b>${CORTO[q]}</b><i>?</i></div>
          <div class="show-tarjeta-cara"><header>${CORTO[q]}</header>${
            sobre
              ? `<div class="show-sobre"><i>✉️</i><span>En el sobre: todavía no la contesta</span></div>`
              : lineas.map((l) => `<p class="${l.ok ? `ok-${l.ok}` : ''}"><small>${esc(l.k)}</small><b>${esc(l.v)}</b>${l.ok ? `<i>${l.ok === 'si' ? '✓' : l.ok === 'casi' ? '≈' : '✗'}</i>` : ''}</p>`).join('')
          }</div>
        </div>
      </article>`;
    const val = (q: Rol, campo: 'a' | 'g') => textoValor(p, item, r[q]?.[campo], campo);
    let html = '';
    const falta = (q: Rol) => !r[q] || (r[q]!.a === undefined && r[q]!.g === undefined);
    switch (p.tipo) {
      case 'quien':
      case 'zapato':
        html = (['el', 'ella'] as Rol[]).map((q) => tarjeta(q, [{ k: 'Señaló a', v: val(q, 'a') }], falta(q))).join('');
        break;
      case 'prefiere':
        html = (['el', 'ella'] as Rol[])
          .map((q) => tarjeta(q, [{ k: 'Prefiere', v: val(q, 'a') }, { k: `Cree que ${NOMBRE[otroRol(q)]}`, v: val(q, 'g'), ok: res.atino[q] }], falta(q)))
          .join('');
        break;
      case 'historia':
        html = (['el', 'ella'] as Rol[]).map((q) => tarjeta(q, [{ k: 'Respondió', v: val(q, 'a'), ok: res.atino[q] }], falta(q))).join('');
        html += `<div class="show-correcta"><small>La respuesta</small><b>${esc(p.o[p.ok])}</b></div>`;
        break;
      case 'conoce':
      case 'termo': {
        const s = item.s ?? 'el', g = otroRol(s);
        const cartas: Record<Rol, string> = {
          el: '',
          ella: '',
        };
        cartas[s] = tarjeta(s, [{ k: `${NOMBRE[s]} dijo`, v: val(s, 'a') }], r[s]?.a === undefined);
        cartas[g] = tarjeta(g, [{ k: `${NOMBRE[g]} adivinó`, v: val(g, 'g'), ok: res.atino[g] }], r[g]?.g === undefined);
        html = cartas.el + cartas.ella;
        if (p.tipo === 'termo' && r[s]?.a && r[g]?.g && r[s]!.a !== '-' && r[g]!.g !== '-') {
          const a = Number(r[s]!.a), b = Number(r[g]!.g);
          html += `<div class="show-termometro" style="--a:${(a - 1) / 9};--b:${(b - 1) / 9}"><div class="show-termometro-barra"></div>
            <i class="marca verdad" data-r="${s}"><b>${a}</b></i><i class="marca intento" data-r="${g}"><b>${b}</b></i></div>`;
        }
        break;
      }
    }
    zona.innerHTML = `<div class="show-tarjetas">${html}</div><div class="show-sello" hidden></div>`;
    await this.esperar(80);
    zona.classList.add('voltea');
    SFX.whoosh();
    await this.esperar(950);
    if (!(esAbierta(p) && res.etiqueta === 'Falta calificar')) this.sello(res);
    await this.esperar(350);
  }

  sello(res: Resultado) {
    const s = this.$('.show-sello');
    if (!s) return;
    s.hidden = false;
    s.className = `show-sello tono-${res.pendiente && res.con === null ? 'sobre' : res.tono}`;
    s.textContent = res.etiqueta;
    s.classList.remove('entra');
    void s.offsetWidth;
    s.classList.add('entra');
  }

  limpiarRevelar() {
    const z = this.$('.show-revela');
    z.classList.add('sale');
    setTimeout(() => {
      z.hidden = true;
      z.className = 'show-revela';
      z.innerHTML = '';
    }, 380 / this.rapido);
  }

  /** El dueño de una abierta califica: exacto, casi o ni cerca. */
  calificar(quien: Rol, propia: boolean): Promise<string> {
    const panel = this.$('.show-panel');
    panel.hidden = false;
    panel.classList.remove('sale');
    panel.dataset.quien = quien;
    panel.innerHTML = `<header class="show-panel-cabeza"><span class="show-panel-quien" data-r="${quien}">${propia ? 'Califícate (sin trampa, que el perrito mira)' : `${NOMBRE[quien]} califica`}</span></header>
      <p class="show-panel-pregunta">${propia ? '¿Le atinaste?' : '¿Le atinó?'}</p>
      <div class="show-panel-cuerpo"><div class="show-opciones show-notas">
        <button class="show-op op-bien" data-v="2"><i>✓</i><span>¡Exacto!</span></button>
        <button class="show-op op-casi" data-v="1"><i>≈</i><span>Casi casi</span></button>
        <button class="show-op op-mal" data-v="0"><i>✗</i><span>Ni cerca</span></button>
      </div></div>`;
    return new Promise((ok) => {
      panel.querySelectorAll<HTMLButtonElement>('.show-op').forEach((b) =>
        b.addEventListener(
          'click',
          () => {
            SFX.toque();
            panel.classList.add('sale');
            setTimeout(() => (panel.hidden = true), 320);
            ok(b.dataset.v!);
          },
          { once: true },
        ),
      );
    });
  }

  // ---------------------------------------------------------------------------------------------- Relámpago
  relampago(o: { quien: Rol; preguntas: string[]; seg: number; pausado: () => boolean; cancelado: () => boolean; alContestar: (k: number, v: string) => void }): Promise<string[]> {
    const panel = this.$('.show-panel');
    panel.hidden = false;
    panel.classList.remove('sale');
    panel.classList.add('relampago');
    panel.dataset.quien = o.quien;
    const n = o.preguntas.length;
    const v: string[] = [];
    panel.innerHTML = `<header class="show-panel-cabeza"><span class="show-panel-quien" data-r="${o.quien}">${this.modo === 'local' ? `Turno de ${NOMBRE[o.quien]}` : '¡Rápido, sin pensar!'}</span>
        <span class="show-relampago-n"><b>1</b>/${n}</span></header>
      <div class="show-relampago-barra"><i></i></div>
      <p class="show-panel-pregunta show-relampago-q"></p>
      <div class="show-panel-cuerpo"><div class="show-opciones show-zapatos">
        <button class="show-op op-el" data-v="e"><i>👞</i><span>Él</span></button>
        <button class="show-op op-ella" data-v="a"><i>👠</i><span>Ella</span></button>
      </div></div>
      <div class="show-relampago-puntos">${o.preguntas.map(() => '<i></i>').join('')}</div>`;
    const q = panel.querySelector('.show-relampago-q')!;
    const mostrar = () => {
      q.textContent = o.preguntas[v.length] ?? '';
      q.classList.remove('entra');
      void (q as HTMLElement).offsetWidth;
      q.classList.add('entra');
      panel.querySelector('.show-relampago-n b')!.textContent = String(Math.min(n, v.length + 1));
    };
    mostrar();
    return new Promise((listo) => {
      let usado = 0;
      let antes = performance.now();
      let terminado = false;
      const fin = () => {
        if (terminado) return;
        terminado = true;
        clearInterval(reloj);
        while (v.length < n) v.push('-');
        panel.classList.add('sale');
        setTimeout(() => {
          panel.hidden = true;
          panel.classList.remove('relampago');
        }, 320);
        listo(v);
      };
      const reloj = window.setInterval(() => {
        if (o.cancelado()) return fin();
        const ahora = performance.now();
        if (!o.pausado()) usado += (ahora - antes) * this.rapido;
        antes = ahora;
        const k = Math.min(1, usado / 1000 / o.seg);
        panel.querySelector<HTMLElement>('.show-relampago-barra i')!.style.transform = `scaleX(${1 - k})`;
        panel.classList.toggle('urgente', k > 0.8);
        if (k >= 1) {
          SFX.bzzz();
          fin();
        }
      }, 80);
      this.relojes.push(reloj);
      panel.querySelectorAll<HTMLButtonElement>('.show-op').forEach((b) =>
        b.addEventListener('click', () => {
          if (terminado || o.pausado() || v.length >= n) return;
          SFX.toque();
          const voto = b.dataset.v!;
          v.push(voto);
          o.alContestar(v.length - 1, voto);
          const p = panel.querySelectorAll('.show-relampago-puntos i')[v.length - 1] as HTMLElement | undefined;
          p?.classList.add(voto === 'e' ? 'el' : 'ella');
          b.classList.remove('pulso');
          void b.offsetWidth;
          b.classList.add('pulso');
          if (v.length >= n) {
            SFX.timbre();
            setTimeout(fin, 300 / this.rapido);
          } else mostrar();
        }),
      );
    });
  }

  fichaRelampago(k: number, n: number, texto: string, r: Partial<Record<Rol, Resp>>, res: Resultado) {
    const zona = this.$('.show-revela');
    if (zona.hidden || !zona.querySelector('.show-rafaga')) {
      zona.hidden = false;
      zona.className = 'show-revela tipo-rafaga';
      zona.innerHTML = `<div class="show-rafaga"><p class="show-rafaga-q"></p><div class="show-rafaga-votos"><span data-r="el"></span><b class="show-rafaga-sello"></b><span data-r="ella"></span></div><div class="show-rafaga-cuenta">${Array.from({ length: n }, () => '<i></i>').join('')}</div></div>`;
    }
    const voto = (q: Rol) => {
      const v = r[q]?.a;
      return v === 'e' ? 'Él' : v === 'a' ? 'Ella' : v === '-' ? '⏰' : '✉️';
    };
    zona.querySelector('.show-rafaga-q')!.textContent = `${k + 1}. ${texto}`;
    const votos = zona.querySelector('.show-rafaga-votos')!;
    for (const q of ['el', 'ella'] as Rol[]) {
      const s = votos.querySelector(`[data-r="${q}"]`)!;
      s.textContent = voto(q);
      s.className = `voto-${r[q]?.a ?? 'x'}`;
    }
    const sello = votos.querySelector('.show-rafaga-sello')!;
    sello.textContent = res.pendiente ? '✉️' : res.tono === 'bien' ? '✓' : '✗';
    sello.className = `show-rafaga-sello tono-${res.pendiente ? 'sobre' : res.tono}`;
    const cuenta = zona.querySelectorAll('.show-rafaga-cuenta i')[k];
    cuenta?.classList.add(res.pendiente ? 'sobre' : res.tono === 'bien' ? 'bien' : 'mal');
    const raf = zona.querySelector('.show-rafaga') as HTMLElement;
    raf.classList.remove('golpe');
    void raf.offsetWidth;
    raf.classList.add('golpe');
  }

  // ---------------------------------------------------------------------------------------------- Final
  async medidor(con: number, nivel: { nombre: string; frase: string }) {
    const c = this.$('.show-cortina');
    c.className = 'show-cortina show-cortina-medidor';
    c.hidden = false;
    const marcas = Array.from({ length: 11 }, (_, k) => {
      const a = Math.PI * (1 - k / 10);
      return `<line x1="${100 + Math.cos(a) * 70}" y1="${100 - Math.sin(a) * 70}" x2="${100 + Math.cos(a) * 78}" y2="${100 - Math.sin(a) * 78}"/>`;
    }).join('');
    c.innerHTML = `<div class="show-medidor">
      <h2>Medidor de conexión</h2>
      <svg viewBox="0 0 200 118" class="show-medidor-svg">
        <defs><linearGradient id="show-arco" x1="0" x2="1"><stop offset="0" stop-color="#5b8fd6"/><stop offset=".45" stop-color="#b48ce0"/><stop offset=".75" stop-color="#ff6fa5"/><stop offset="1" stop-color="#ff3d6e"/></linearGradient></defs>
        <path d="M20 100 A80 80 0 0 1 180 100" class="fondo"/>
        <path d="M20 100 A80 80 0 0 1 180 100" class="arco" pathLength="100"/>
        <g class="marcas">${marcas}</g>
        <g class="aguja"><path d="M100 100 L97 98 L100 30 L103 98 Z"/><circle cx="100" cy="100" r="7"/></g>
      </svg>
      <p class="show-medidor-num"><b>0</b>%</p>
      <p class="show-medidor-nivel">${esc(nivel.nombre)}</p>
      <p class="show-medidor-frase">${esc(nivel.frase)}</p>
    </div>`;
    const arco = c.querySelector<SVGPathElement>('.arco')!;
    const aguja = c.querySelector<SVGGElement>('.aguja')!;
    const num = c.querySelector('.show-medidor-num b')!;
    const dur = 2600 / this.rapido;
    const t0 = performance.now();
    let ultimo = -1;
    await new Promise<void>((ok) => {
      const paso = () => {
        const k = Math.min(1, (performance.now() - t0) / dur);
        // Sube con un rebote al final, como una aguja de verdad
        const e = k < 1 ? 1 - Math.pow(1 - k, 3) + Math.sin(k * Math.PI * 3) * 0.04 * (1 - k) : 1;
        const v = con * e;
        arco.style.strokeDashoffset = String(100 - v);
        aguja.style.transform = `rotate(${-90 + (v / 100) * 180}deg)`;
        num.textContent = String(Math.round(v));
        const marca = Math.floor(v / 5);
        if (marca !== ultimo) {
          ultimo = marca;
          SFX.medidor(v / 100);
        }
        if (k < 1) requestAnimationFrame(paso);
        else ok();
      };
      requestAnimationFrame(paso);
    });
    c.classList.add('revelado');
    await this.esperar(1500);
  }

  async final(o: {
    puntos: Record<Rol, number>;
    ganador: Rol | null;
    con: number;
    nivel: { nombre: string };
    monedas: number;
    modo: ModoShow;
    pendientes: number;
    alOtro: () => void;
    alLibro: () => void;
    alSalir: () => void;
  }) {
    const c = this.$('.show-cortina');
    c.classList.add('sale');
    setTimeout(() => {
      c.hidden = true;
      c.className = 'show-cortina';
    }, 400);
    const f = this.$('.show-final');
    f.hidden = false;
    const titulo =
      o.modo === 'solo' ? `${o.con}% de conexión` : o.ganador === null ? '¡Empate!' : o.modo === 'local' ? `¡Ganó ${NOMBRE[o.ganador]}!` : o.ganador === this.yo ? '¡Ganaste!' : `Ganó ${NOMBRE[o.ganador]}`;
    f.innerHTML = `<article class="show-final-carta">
      <span class="show-final-bug">El Show de Nosotros</span>
      <h2>${esc(titulo)}</h2>
      <div class="show-final-puntos"><span data-r="el"><em>ÉL</em><b>${o.puntos.el}</b></span><i>❤</i><span data-r="ella"><b>${o.puntos.ella}</b><em>ELLA</em></span></div>
      <p class="show-final-nivel">Conexión <b>${o.con}%</b> · ${esc(o.nivel.nombre)}</p>
      ${o.pendientes ? `<p class="show-final-sobre">✉️ ${o.pendientes} ${o.pendientes === 1 ? 'pregunta quedó' : 'preguntas quedaron'} en el sobre para ${NOMBRE[otroRol(this.yo)]}.</p>` : ''}
      <p class="show-final-premio">+${o.monedas} monedas para la casa</p>
      <div class="show-final-botones">
        <button class="show-btn show-btn-papel" data-f="salir">Salir</button>
        <button class="show-btn show-btn-papel" data-f="libro">📖 El libro</button>
        <button class="show-btn show-btn-oro" data-f="otro">¡Otro show!</button>
      </div></article>`;
    f.querySelector('[data-f="salir"]')!.addEventListener('click', () => o.alSalir());
    f.querySelector('[data-f="libro"]')!.addEventListener('click', () => o.alLibro());
    f.querySelector('[data-f="otro"]')!.addEventListener('click', () => o.alOtro());
  }

  confirmar(titulo: string, texto: string, si: () => void) {
    const p = this.$('.show-pausa');
    const estaba = !p.hidden ? p.innerHTML : null;
    p.hidden = false;
    p.innerHTML = `<div class="show-pausa-carta"><h3>${esc(titulo)}</h3><p>${esc(texto)}</p><div class="show-final-botones"><button class="show-btn show-btn-papel" data-no>Seguir</button><button class="show-btn show-btn-oro" data-si>Salir</button></div></div>`;
    p.querySelector('[data-no]')!.addEventListener('click', () => {
      if (estaba) p.innerHTML = estaba;
      else p.hidden = true;
    });
    p.querySelector('[data-si]')!.addEventListener('click', () => {
      p.hidden = true;
      si();
    });
  }

  destruir() {
    for (const r of this.relojes) clearInterval(r);
    cancelAnimationFrame(this.globoReloj);
    clearTimeout(this.tAviso);
    document.body.classList.remove('con-show');
    // El aviso de despedida se queda un momentico en la mesa
    const a = this.$('.show-aviso');
    if (!a.hidden) {
      document.body.append(a);
      setTimeout(() => a.remove(), 3200);
    }
    this.raiz.remove();
  }
}
