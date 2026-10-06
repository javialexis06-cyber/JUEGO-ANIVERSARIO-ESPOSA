// La interfaz durante la partida (HTML encima del dibujo): barra de experiencia, reloj, inventario, gotas
// doradas, las cartas al subir de nivel (con volver a tirar, saltar y vetar), el cofre con su tragamonedas, las
// cartas de amor, la pausa con las estadísticas y la pantalla final con el daño de cada arma.
import { ARMAS, PASIVAS, MAX_RANURAS, maxNivelArma } from './armas';
import { ENEMIGOS } from './enemigos';
import { puedeApuntar } from './disfraces';
import { FRASES, cartaVista, logroVisto } from './textos';
import { icono } from './iconos';
import { LOGRO, type ResumenPartida } from './progreso';
import { sfx } from './sonidos';
import { ORO_X, type Jugador, type Motor, type Opcion } from './motor';
import type { Efecto, IdArma, IdCarta, IdPasiva, Rol } from './tipos';

/** Las acciones llevan `n`: cuántas cosas había escogido cuando se pintó la capa (un toque viejo o doble no cuenta). */
export interface Acciones {
  escoger(k: number, n: number): void;
  tirar(n: number): void;
  saltar(n: number): void;
  vetar(k: number, n: number): void;
  cerrarCofre(n: number): void;
  escogerCarta(c: IdCarta | null, n: number): void;
  pausa(si: boolean): void;
  retirarse(): void;
  musica(): boolean;
  sonido(): boolean;
  numeros(): boolean;
  /** Cambia entre apuntar a mano y que las armas busquen solas (devuelve si quedó a mano). */
  ataque?(): boolean;
}

const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const miles = (n: number) => Math.round(n).toLocaleString('es-CO');
const $ = <T extends HTMLElement = HTMLElement>(r: ParentNode, s: string) => r.querySelector(s) as T;

export function nombreItem(id: string) {
  return (ARMAS as Record<string, { nombre: string }>)[id]?.nombre ?? (PASIVAS as Record<string, { nombre: string }>)[id]?.nombre ?? id;
}

/** La descripción de lo que da el siguiente nivel de una carta. */
export function descOpcion(o: Opcion): string {
  if (o.tipo === 'arepa') return 'Una arepa con queso calientita: recuperas 30 de vida.';
  if (o.tipo === 'oro') return `${Math.round(25 * ORO_X)} gotas doradas para la tienda.`;
  if (o.tipo === 'arma') {
    const a = ARMAS[o.id as IdArma];
    return o.nueva ? a.desc : a.niveles[o.nivel - 2]?.txt ?? a.desc;
  }
  return PASIVAS[o.id as IdPasiva].desc;
}

/** Pista de evolución para la carta (como en el original, cuando ya tiene una de las dos piezas). */
function pista(j: Jugador, o: Opcion): string {
  if (o.tipo === 'arma') {
    const evo = ARMAS[o.id as IdArma].evo;
    if (!evo) return '';
    const con = evo.pasiva ? PASIVAS[evo.pasiva].nombre : evo.arma ? ARMAS[evo.arma].nombre : '';
    const tiene = evo.pasiva ? j.pasivas.has(evo.pasiva) : evo.arma ? j.armas.some((a) => a.id === evo.arma) : false;
    return tiene ? `✨ Con ${con} evoluciona en ${ARMAS[evo.a].nombre}` : '';
  }
  if (o.tipo === 'pasiva') {
    const a = j.armas.find((x) => ARMAS[x.id].evo?.pasiva === o.id);
    return a ? `✨ Evoluciona ${ARMAS[a.id].nombre}` : '';
  }
  return '';
}

export class Interfaz {
  private hud: HTMLElement;
  private capaNivel: HTMLElement;
  private capaCofre: HTMLElement;
  private capaCarta: HTMLElement;
  private capaPausa: HTMLElement;
  private capaFin: HTMLElement;
  private capaEspera: HTMLElement;
  private claveNivel = '';
  private claveCofre = '';
  private claveCarta = '';
  /** Las acciones del jugador cuando se pintó cada capa (viajan con el toque). */
  private nNivel = 0;
  private nCofre = 0;
  private nCarta = 0;
  /** Cada cofre animado tiene su número: si llega otro, el viejo deja de animar. */
  private animCofre = 0;
  private claveInv = '';
  private modoVetar = false;
  private cofreListo = false;
  private tHud = 0;
  pausado = false;

  /** Los demás: su chip (nombre, vida, estado), la flecha cuando no se ven y su nombre encima. */
  private otros: { i: number; chip: HTMLElement; flecha: HTMLElement; nombre: HTMLElement; clave: string }[] = [];
  private reloj: HTMLElement;

  constructor(private raiz: HTMLElement, private yo: number, private nombres: string[], private acc: Acciones, private colores: string[] = [], private anfitrion = true) {
    const otros = nombres.map((_, i) => i).filter((i) => i !== yo);
    raiz.insertAdjacentHTML(
      'beforeend',
      `<div class="lv-hud">
        <div class="lv-xp"><i></i><b>Nv 1</b></div>
        <div class="lv-tiempo">0:00</div>
        <div class="lv-inv"></div>
        <div class="lv-cuenta"><b class="bajas">🦠 0</b><b class="oro">${icono('moneda', 18)}0</b></div>
        <div class="lv-equipo">${otros.map((i) => `<div class="lv-compa" data-i="${i}" style="--c:${colores[i] ?? '#fff'}"><span></span><i><u></u></i></div>`).join('')}</div>
        ${otros.map((i) => `<div class="lv-flecha" data-i="${i}" style="--c:${colores[i] ?? '#fff'}"><b>${esc((nombres[i] ?? '?').slice(0, 1).toUpperCase())}</b></div>`).join('')}
        ${otros.map((i) => `<div class="lv-etiqueta" data-i="${i}" style="--c:${colores[i] ?? '#fff'}">${esc(nombres[i] ?? '')}</div>`).join('')}
        <div class="lv-aviso"></div>
        <div class="lv-jefe"></div>
      </div>
      <button class="lv-pausa" aria-label="Pausa">❚❚</button>
      <div class="lv-velo-hielo"></div><div class="lv-velo-dano"></div><div class="lv-velo-luz"></div>
      <div class="lv-capa lv-c-nivel" hidden></div>
      <div class="lv-capa lv-c-cofre" hidden></div>
      <div class="lv-capa lv-c-carta" hidden></div>
      <div class="lv-capa lv-c-pausa" hidden></div>
      <div class="lv-capa lv-c-espera" hidden></div>
      <div class="lv-capa lv-c-fin" hidden></div>
      <div class="lv-reloj" hidden><i></i><span></span></div>`,
    );
    this.reloj = $(raiz, '.lv-reloj');
    this.hud = $(raiz, '.lv-hud');
    this.capaNivel = $(raiz, '.lv-c-nivel');
    this.capaCofre = $(raiz, '.lv-c-cofre');
    this.capaCarta = $(raiz, '.lv-c-carta');
    this.capaPausa = $(raiz, '.lv-c-pausa');
    this.capaFin = $(raiz, '.lv-c-fin');
    this.capaEspera = $(raiz, '.lv-c-espera');
    this.otros = otros.map((i) => ({
      i, chip: $(this.hud, `.lv-compa[data-i="${i}"]`), flecha: $(this.hud, `.lv-flecha[data-i="${i}"]`), nombre: $(this.hud, `.lv-etiqueta[data-i="${i}"]`), clave: '',
    }));
    $(raiz, '.lv-pausa').addEventListener('click', (e) => {
      e.stopPropagation();
      sfx.toque();
      this.acc.pausa(true);
    });
    this.capaNivel.addEventListener('click', (ev) => {
      const el = ev.target as HTMLElement;
      const carta = el.closest<HTMLElement>('[data-k]');
      const boton = el.closest<HTMLElement>('[data-accion]');
      // (la capa se cierra sola cuando el motor cambia: aquí solo se avisa qué se tocó)
      if (this.capaNivel.classList.contains('enviado') || this.recien(this.capaNivel)) return;
      if (carta) {
        const k = Number(carta.dataset.k);
        sfx.toque();
        carta.classList.add('tocada');
        this.capaNivel.classList.add('enviado');
        if (this.modoVetar) {
          this.modoVetar = false;
          this.acc.vetar(k, this.nNivel);
        } else this.acc.escoger(k, this.nNivel);
      } else if (boton) {
        sfx.toque();
        const a = boton.dataset.accion;
        if (a === 'vetar') {
          this.modoVetar = !this.modoVetar;
          this.capaNivel.querySelectorAll('.lv-carta').forEach((c) => c.classList.toggle('vetar', this.modoVetar));
          boton.classList.toggle('activo', this.modoVetar);
          return;
        }
        this.capaNivel.classList.add('enviado');
        if (a === 'tirar') this.acc.tirar(this.nNivel);
        if (a === 'saltar') this.acc.saltar(this.nNivel);
      }
      this.desbloquearLuego(this.capaNivel);
    });
    this.capaCarta.addEventListener('click', (ev) => {
      const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-carta]');
      if (!el || this.capaCarta.classList.contains('enviado') || this.recien(this.capaCarta)) return;
      sfx.carta();
      this.capaCarta.classList.add('enviado');
      this.acc.escogerCarta((el.dataset.carta || null) as IdCarta | null, this.nCarta);
      this.desbloquearLuego(this.capaCarta);
    });
    this.capaCofre.addEventListener('click', (ev) => {
      const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-listo]');
      if (el && this.cofreListo) {
        if (this.capaCofre.classList.contains('enviado')) return;
        sfx.toque();
        this.capaCofre.classList.add('enviado');
        this.acc.cerrarCofre(this.nCofre);
        this.desbloquearLuego(this.capaCofre);
      } else if (!this.cofreListo) this.saltarCofre = true;
    });
    this.capaPausa.addEventListener('click', (ev) => {
      const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-p]');
      if (!el) return;
      sfx.toque();
      const p = el.dataset.p;
      if (p === 'seguir') this.acc.pausa(false);
      if (p === 'retirarse') {
        if (el.dataset.confirma) this.acc.retirarse();
        else {
          el.dataset.confirma = '1';
          el.textContent = '¿Seguro? Toca otra vez';
        }
      }
      if (p === 'musica') el.textContent = this.acc.musica() ? '🔇 Música' : '🎵 Música';
      if (p === 'sonido') el.textContent = this.acc.sonido() ? '🔈 Sonido' : '🔊 Sonido';
      if (p === 'numeros') el.textContent = this.acc.numeros() ? '🔢 Números: sí' : '🔢 Números: no';
      if (p === 'ataque' && this.acc.ataque) el.textContent = this.acc.ataque() ? '🎯 Ataque: a mano' : '🎯 Ataque: solito';
    });
  }

  private saltarCofre = false;

  /** Cuándo se pintó cada capa: un doble toque rápido no escoge a ciegas en la capa que sale después. */
  private pintada = new WeakMap<HTMLElement, number>();
  private recien(capa: HTMLElement) {
    return performance.now() - (this.pintada.get(capa) ?? 0) < 280;
  }

  /** Si en un ratico la capa no cambió (se perdió el mensaje en pareja), se puede volver a tocar. */
  private desbloquearLuego(capa: HTMLElement) {
    const html = capa.innerHTML;
    setTimeout(() => {
      if (capa.innerHTML === html) {
        capa.classList.remove('enviado');
        capa.querySelectorAll('.tocada').forEach((c) => c.classList.remove('tocada'));
      }
    }, 1800);
  }

  // ------------------------------------------------------------------------------------------------- HUD
  actualizar(m: Motor, dt: number, conectado: (i: number) => boolean = () => true) {
    this.tHud += dt;
    if (this.tHud < 0.1) return;
    this.tHud = 0;
    const j = m.jug[this.yo];
    const req = m.xpReq();
    $(this.hud, '.lv-xp i').style.width = `${Math.min(100, (m.xp / req) * 100)}%`;
    $(this.hud, '.lv-xp b').textContent = `Nv ${m.nivel}`;
    const t = $(this.hud, '.lv-tiempo');
    const txt = mmss(m.t);
    if (t.firstChild?.textContent !== txt) t.innerHTML = `${txt}${m.apurado ? '<small>¡Apurado!</small>' : ''}`;
    t.classList.toggle('apurado', m.apurado);
    $(this.hud, '.lv-cuenta .bajas').textContent = `🦠 ${miles(m.eliminados)}`;
    const oro = $(this.hud, '.lv-cuenta .oro');
    const o = miles(m.oro);
    if (oro.lastChild?.textContent !== o) oro.innerHTML = `${icono('moneda', 18)}${o}`;
    // Inventario (solo si cambió)
    const clave = j.armas.map((a) => a.id + a.nivel).join() + '|' + [...j.pasivas].map(([k, v]) => k + v).join();
    if (clave !== this.claveInv) {
      this.claveInv = clave;
      const celdas: string[] = [];
      for (let k = 0; k < MAX_RANURAS; k++) {
        const a = j.armas[k];
        celdas.push(a ? `<span class="${ARMAS[a.id].de ? 'evo' : ''}">${icono(a.id, 24)}${ARMAS[a.id].de ? '' : `<i class="n">${a.nivel}</i>`}</span>` : '<span class="vacio"></span>');
      }
      const pas = [...j.pasivas];
      for (let k = 0; k < MAX_RANURAS; k++) {
        const p = pas[k];
        celdas.push(p ? `<span class="pas">${icono(p[0], 24)}<i class="n">${p[1]}</i></span>` : '<span class="pas vacio"></span>');
      }
      $(this.hud, '.lv-inv').innerHTML = celdas.join('');
    }
    // Los demás (en pareja o con amigos): nombre, vida y cómo van
    for (const o of this.otros) {
      const q = m.jug[o.i];
      if (!q) continue;
      const nombre = this.nombres[o.i] ?? '';
      const estado = q.fuera ? (conectado(o.i) ? 'fuera' : 'corte') : !conectado(o.i) ? 'corte' : q.caido ? 'caido' : 'bien';
      const texto = estado === 'fuera' ? `${nombre}: se salió` : estado === 'corte' ? `${nombre}: sin conexión` : estado === 'caido' ? `¡${nombre} cayó! Ve a levantarle` : nombre;
      if (o.clave !== texto) {
        o.clave = texto;
        $(o.chip, 'span').textContent = texto;
        o.chip.dataset.estado = estado;
      }
      $(o.chip, 'u').style.width = `${Math.max(0, (q.vida / Math.max(1, q.vidaMax)) * 100)}%`;
    }
    this.raiz.querySelector('.lv-velo-hielo')!.classList.toggle('si', m.hielo > 0);
  }

  /**
   * Dónde están los demás en la pantalla: si se ven, su nombre encima de la cabeza; si no, una flecha de su color
   * en el borde, apuntando hacia ellos. `aPantalla` convierte del mapa a píxeles.
   */
  companeros(m: Motor, aPantalla: (x: number, y: number) => [number, number]) {
    if (!this.otros.length) return;
    const w = this.raiz.clientWidth, h = this.raiz.clientHeight;
    for (const o of this.otros) {
      const q = m.jug[o.i];
      if (!q || q.fuera) {
        o.flecha.classList.remove('si');
        o.nombre.classList.remove('si');
        continue;
      }
      const [px, py] = aPantalla(q.x, q.y);
      const fuera = px < 0 || py < 0 || px > w || py > h;
      o.flecha.classList.toggle('si', fuera);
      o.nombre.classList.toggle('si', !fuera);
      if (fuera) {
        const x = Math.max(22, Math.min(w - 22, px)), y = Math.max(64, Math.min(h - 22, py));
        o.flecha.style.transform = `translate(${x}px, ${y}px)`;
        const ang = Math.atan2(py - y, px - x);
        o.flecha.style.setProperty('--a', `${ang}rad`);
        o.flecha.classList.toggle('caido', q.caido);
      } else {
        o.nombre.style.transform = `translate(${px}px, ${py - 66}px)`;
        o.nombre.classList.toggle('caido', q.caido);
      }
    }
  }

  tenue(si: boolean) {
    this.hud.classList.toggle('tenue', si);
  }

  aviso(texto: string, seg = 2.4) {
    const a = $(this.hud, '.lv-aviso');
    a.textContent = texto;
    a.classList.remove('sale');
    void a.offsetWidth;
    a.style.animationDuration = `${seg}s`;
    a.classList.add('sale');
  }

  jefe(nombre: string) {
    const a = $(this.hud, '.lv-jefe');
    a.textContent = nombre;
    a.classList.remove('sale');
    void a.offsetWidth;
    a.classList.add('sale');
  }

  /** Velos de pantalla según lo que pasó. */
  efecto(e: Efecto, m: Motor) {
    if (e.tipo === 'herido' && e.c === this.yo) {
      const v = this.raiz.querySelector('.lv-velo-dano')!;
      v.classList.add('si');
      setTimeout(() => v.classList.remove('si'), 140);
    } else if (e.tipo === 'limpiar') {
      const v = this.raiz.querySelector('.lv-velo-luz')!;
      v.classList.add('si');
      setTimeout(() => v.classList.remove('si'), 60);
    } else if (e.tipo === 'aviso' && e.t) {
      // (c: 0 = para los dos; si no, solo para ese jugador, como la habilidad de su disfraz)
      if (!e.c || e.c - 1 === this.yo) this.aviso(e.t, e.c ? 3 : 2.4);
    }
    else if (e.tipo === 'jefe') this.jefe(ENEMIGOS[Object.keys(ENEMIGOS)[e.c] as keyof typeof ENEMIGOS]?.nombre ?? '¡Un jefe!');
    else if (e.tipo === 'cae' && e.c !== this.yo) this.aviso(FRASES.cayo(this.nombres[e.c] ?? ''), 3);
    else if (e.tipo === 'levanta') this.aviso(FRASES.levanta(this.nombres[e.c] ?? '', e.c === this.yo), 2.4);
    else if (e.tipo === 'revive' && e.c === this.yo) this.aviso(FRASES.revive(), 2.4);
  }

  // ------------------------------------------------------------------------------------------------- Pausas
  /** Mira si hay que abrir o cerrar las capas (subir de nivel, cofre, carta de amor, espera del otro). */
  revisar(m: Motor) {
    const j = m.jug[this.yo];
    // Cofre
    // (las claves llevan las acciones del jugador: después de cada toque la capa se vuelve a pintar o se cierra,
    // aunque salgan las mismas cartas; y lo que debe estar cerrado se cierra siempre)
    const kc = j.cofre ? JSON.stringify(j.cofre) + '#' + j.acciones : '';
    if (kc !== this.claveCofre) {
      this.claveCofre = kc;
      if (j.cofre) {
        this.nCofre = j.acciones;
        void this.animarCofre(j);
      } else this.cerrarCapa(this.capaCofre);
    } else if (!kc && !this.capaCofre.hidden) this.cerrarCapa(this.capaCofre);
    // Carta de amor
    const kk = j.cartaOpciones && !j.cofre ? j.cartaOpciones.join() + '#' + j.acciones : '';
    if (kk !== this.claveCarta) {
      this.claveCarta = kk;
      if (kk && j.cartaOpciones) {
        this.nCarta = j.acciones;
        this.mostrarCartas(j.cartaOpciones);
      } else this.cerrarCapa(this.capaCarta);
    } else if (!kk && !this.capaCarta.hidden) this.cerrarCapa(this.capaCarta);
    // Subir de nivel
    const kn = j.opciones && !j.cofre && !j.cartaOpciones ? JSON.stringify(j.opciones) + j.quedanTirar + j.quedanSaltar + j.quedanVetar + '#' + j.acciones : '';
    if (kn !== this.claveNivel) {
      this.claveNivel = kn;
      if (kn && j.opciones) {
        this.nNivel = j.acciones;
        this.mostrarNivel(m, j, j.opciones);
      } else this.cerrarCapa(this.capaNivel);
    } else if (!kn && !this.capaNivel.hidden) this.cerrarCapa(this.capaNivel);
    // Los demás están escogiendo (con varios, cada uno con su reloj: después se escoge solo)
    const varios = m.jug.length > 1;
    const yoEscojo = !!(j.opciones || j.cofre || j.cartaOpciones);
    const escogiendo = varios && m.pausa && !yoEscojo ? m.jug.filter((x) => x !== j && !x.fuera && (x.opciones || x.cofre || x.cartaOpciones)) : [];
    const espera = escogiendo.length > 0;
    // (si se cortó la conexión, ese aviso manda sobre el de «está escogiendo»)
    if (!this.cortada) {
      if (espera !== !this.capaEspera.hidden) this.capaEspera.hidden = !espera;
      if (espera) {
        const filas = escogiendo
          .map((x) => {
            const que = x.cofre ? 'abre un cofre' : x.cartaOpciones ? FRASES.leyendoCarta().replace(/^escogiendo/, 'escoge').replace(/^leyendo/, 'lee') : 'escoge su mejora';
            const resta = Math.ceil(this.restante(m, x));
            return `<li style="--c:${this.colores[x.i] ?? '#fff'}"><b>${esc(this.nombres[x.i] ?? '')}</b> ${que}<em>${resta > 0 ? `${resta} s` : ''}</em></li>`;
          })
          .join('');
        const html = `<div class="lv-espera"><h2>Un momentico<span class="puntos"></span></h2><ul class="lv-escogen">${filas}</ul><p>Si se demoran, se escoge solo lo mejor.</p></div>`;
        if (html !== this.htmlEspera) {
          this.htmlEspera = html;
          this.capaEspera.innerHTML = html;
        }
      } else this.htmlEspera = '';
    }
    // Mi reloj (con varios): cuánto me queda antes de que se escoja solo
    const resto = varios && yoEscojo ? this.restante(m, j) : -1;
    this.reloj.hidden = resto < 0;
    if (resto >= 0) {
      const lim = j.cofre ? 9 : 15;
      (this.reloj.firstChild as HTMLElement).style.width = `${Math.max(0, Math.min(100, (resto / lim) * 100))}%`;
      (this.reloj.lastChild as HTMLElement).textContent = resto > 0.2 ? `Se escoge solo en ${Math.ceil(resto)} s` : '¡Escogiendo!';
      this.reloj.classList.toggle('apurate', resto < 5);
    }
    this.tenue(!!m.pausa || this.pausado);
  }
  private htmlEspera = '';
  /** Cuánto le queda a alguien para escoger (lo pone el juego: en el anfitrión lo sabe el motor; en los demás, la foto). */
  restante: (m: Motor, j: Jugador) => number = (m, j) => m.restanteEscoger(j);

  private cerrarCapa(capa: HTMLElement) {
    capa.hidden = true;
    capa.classList.remove('enviado');
    if (capa === this.capaNivel) this.modoVetar = false;
    if (capa === this.capaCofre) this.animCofre++;
  }

  /** Se cortó la conexión con el otro (el aviso se queda hasta que vuelva). */
  private cortada = false;

  conexion(texto: string | null, sub = 'El juego quedó en pausa hasta que vuelva.') {
    const antes = this.cortada;
    this.cortada = !!texto;
    if (texto) {
      const html = `<div class="lv-espera lv-corte"><h2>${esc(texto)}<span class="puntos"></span></h2><p>${esc(sub)}</p></div>`;
      if (html !== this.htmlCorte) {
        this.htmlCorte = html;
        this.capaEspera.innerHTML = html;
      }
      this.capaEspera.hidden = false;
    } else if (antes) {
      this.htmlCorte = '';
      this.htmlEspera = '';
      this.capaEspera.hidden = true;
    }
  }
  private htmlCorte = '';

  private mostrarNivel(m: Motor, j: Jugador, ops: Opcion[]) {
    const cartas = ops
      .map((o, k) => {
        const nueva = o.nueva && (o.tipo === 'arma' || o.tipo === 'pasiva');
        const max = o.tipo === 'arma' ? maxNivelArma(o.id as IdArma) : o.tipo === 'pasiva' ? PASIVAS[o.id as IdPasiva].max : 0;
        const pips = max ? `<span class="pips">${Array.from({ length: max }, (_, i) => `<u class="${i < o.nivel ? 'si' : ''}"></u>`).join('')}</span>` : '';
        const p = pista(j, o);
        const ico = o.tipo === 'arepa' ? 'arepa' : o.tipo === 'oro' ? 'bolsa' : o.id;
        return `<button class="lv-carta ${nueva ? 'nueva' : ''} ${p ? 'evo' : ''}" data-k="${k}">
          ${icono(ico, 54)}
          <small>${o.tipo === 'arepa' || o.tipo === 'oro' ? 'Regalito' : nueva ? '¡Nueva!' : `Nivel ${o.nivel}`}</small>
          <b>${o.tipo === 'arepa' ? 'Arepa con queso' : o.tipo === 'oro' ? 'Gotas doradas' : nombreItem(o.id)}</b>
          ${pips}<em>${descOpcion(o)}</em>${p ? `<span class="pista">${p}</span>` : ''}</button>`;
      })
      .join('');
    this.capaNivel.innerHTML = `<h2>¡Nivel ${m.nivel}!<small>Escoge una mejora</small></h2>
      <div class="lv-cartas">${cartas}</div>
      <div class="lv-fila">
        <button class="lv-boton" data-accion="tirar" ${j.quedanTirar ? '' : 'disabled'}>🎲 Volver a tirar (${j.quedanTirar})</button>
        <button class="lv-boton" data-accion="saltar" ${j.quedanSaltar ? '' : 'disabled'}>⏭️ Saltar (${j.quedanSaltar})</button>
        <button class="lv-boton" data-accion="vetar" ${j.quedanVetar ? '' : 'disabled'}>🚫 Vetar (${j.quedanVetar})</button>
      </div>`;
    this.capaNivel.classList.remove('enviado');
    this.modoVetar = false;
    this.capaNivel.hidden = false;
    this.pintada.set(this.capaNivel, performance.now());
  }

  private mostrarCartas(ids: IdCarta[]) {
    const html = ids
      .map((id) => {
        const c = cartaVista(id);
        return `<button class="lv-sobre" style="--c:${c.color}" data-carta="${id}"><span class="num">${c.numero}</span><b>${c.nombre}</b><q>${c.frase}</q><em>${c.efecto}</em></button>`;
      })
      .join('');
    this.capaCarta.innerHTML = `<h2>${FRASES.cartaPerdida()}<small>Escoge una: cambia toda la partida</small></h2><div class="lv-amor">${html}</div>
      <button class="lv-boton" data-carta="">Ahora no</button>`;
    this.capaCarta.classList.remove('enviado');
    this.capaCarta.hidden = false;
    this.pintada.set(this.capaCarta, performance.now());
    sfx.carta();
  }

  /** El cofre: se sacude, se abre con rayos de luz y los premios salen de un tragamonedas. */
  private async animarCofre(j: Jugador) {
    const c = j.cofre!;
    const yo = ++this.animCofre;
    this.cofreListo = false;
    this.saltarCofre = false;
    this.capaCofre.classList.remove('enviado');
    const n = c.premios.length;
    this.capaCofre.innerHTML = `<h2>¡Un cofre!</h2>
      <div class="lv-cofre-escena sacude"><div class="lv-rayos"></div><span class="cofre">${icono('cofre', 120)}</span>
        <div class="lv-ruleta">${Array.from({ length: n }, () => '<span class="lv-ranura gira"></span>').join('')}</div></div>
      <div class="lv-premios"></div>
      <div class="lv-oro-cuenta">${icono('moneda', 22)} <span>0</span></div>
      <button class="lv-boton grande rosa" data-listo>¡Listo!</button>`;
    this.capaCofre.hidden = false;
    const boton = $<HTMLButtonElement>(this.capaCofre, '[data-listo]');
    boton.style.visibility = 'hidden';
    // (si ya llegó otro cofre o se cerró, esta animación se para: no marca «listo» al cofre nuevo)
    const vieja = () => yo !== this.animCofre;
    const esperar = (ms: number) => new Promise((r) => setTimeout(r, this.saltarCofre || vieja() ? 0 : ms));
    const escena = $(this.capaCofre, '.lv-cofre-escena');
    const ranuras = [...this.capaCofre.querySelectorAll<HTMLElement>('.lv-ranura')];
    // Todos los íconos posibles giran en las ranuras
    const posibles = [...Object.keys(ARMAS).filter((a) => !ARMAS[a as IdArma].de), ...Object.keys(PASIVAS)];
    let girando = true;
    const girar = () => {
      if (!girando || vieja()) return;
      for (const r of ranuras) if (r.classList.contains('gira')) r.innerHTML = icono(posibles[Math.floor(Math.random() * posibles.length)], 46);
      sfx.ruleta();
      setTimeout(girar, 90);
    };
    await esperar(700);
    escena.classList.remove('sacude');
    escena.classList.add('abierto');
    $(escena, '.cofre').innerHTML = icono('cofreAbierto', 120);
    sfx.cofreAbre();
    girar();
    await esperar(600);
    const premios = $(this.capaCofre, '.lv-premios');
    for (let k = 0; k < n; k++) {
      await esperar(450);
      if (vieja()) return;
      const p = c.premios[k];
      const r = ranuras[k];
      r.classList.remove('gira');
      r.classList.add('lista');
      r.innerHTML = icono(p.tipo === 'oro' ? 'bolsa' : p.id, 50);
      sfx.premio();
      if (p.tipo === 'evolucion') sfx.evolucion();
      const txt = p.tipo === 'oro' ? `${p.nivel} gotas doradas` : p.tipo === 'evolucion' ? `¡${nombreItem(p.id)}! (evolucionó)` : `${nombreItem(p.id)} → nivel ${p.nivel}`;
      premios.insertAdjacentHTML('beforeend', `<span class="${p.tipo === 'evolucion' ? 'evo' : ''}">${txt}</span>`);
    }
    girando = false;
    // Las gotas doradas cuentan hacia arriba
    const cuenta = $(this.capaCofre, '.lv-oro-cuenta span');
    const t0 = performance.now();
    await new Promise<void>((ok) => {
      const paso = () => {
        const k = this.saltarCofre || vieja() ? 1 : Math.min(1, (performance.now() - t0) / 900);
        cuenta.textContent = String(Math.round(c.oro * k));
        if (k < 1) {
          if (Math.random() < 0.4) sfx.moneda();
          requestAnimationFrame(paso);
        } else ok();
      };
      paso();
    });
    if (vieja()) return;
    this.cofreListo = true;
    boton.style.visibility = 'visible';
  }

  // ------------------------------------------------------------------------------------------------- Pausa
  mostrarPausa(m: Motor, si: boolean, musicaMuda: boolean, sonidoMudo: boolean, numeros: boolean) {
    this.pausado = si;
    this.capaPausa.hidden = !si;
    if (!si) return;
    const j = m.jug[this.yo];
    const s = j.st;
    const pct = (v: number) => `${v >= 0 ? '+' : ''}${Math.round(v * 100)} %`;
    const filas: [string, string][] = [
      ['Vida máxima', String(j.vidaMax)], ['Recuperación', `${s.recuperacion.toFixed(1)}/s`], ['Armadura', String(s.armadura)],
      ['Movimiento', pct(s.movimiento)], ['Poder', pct(s.poder)], ['Área', pct(s.area)], ['Velocidad', pct(s.velocidad)], ['Duración', pct(s.duracion)],
      ['Cantidad', `+${s.cantidad}`], ['Recarga', pct(-s.enfriamiento)], ['Suerte', pct(s.suerte)], ['Crecimiento', pct(s.crecimiento)],
      ['Codicia', pct(s.codicia)], ['Maldición', pct(s.maldicion)], ['Imán', pct(s.iman)], ['Revivir', String(j.revivesQuedan)],
    ];
    const inv = [
      ...j.armas.map((a) => `<div class="lv-logro">${icono(a.id, 30)}<span><b>${ARMAS[a.id].nombre}</b>${ARMAS[a.id].de ? 'Evolucionada' : `Nivel ${a.nivel}`}</span></div>`),
      ...[...j.pasivas].map(([id, n]) => `<div class="lv-logro">${icono(id, 30)}<span><b>${PASIVAS[id].nombre}</b>Nivel ${n} · ${PASIVAS[id].desc}</span></div>`),
      ...j.cartas.map((c) => `<div class="lv-logro">${FRASES.iconoCarta()}<span><b>${cartaVista(c).nombre}</b>${cartaVista(c).efecto}</span></div>`),
    ].join('');
    this.capaPausa.innerHTML = `<div class="lv-panel">
      <h2>Pausa · ${mmss(m.t)} · Nivel ${m.nivel}</h2>
      <div class="cuerpo">
        <div class="col"><div class="lv-stats">${filas.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}</div></div>
        <div class="col">${inv}</div>
      </div>
      <div class="lv-fila">
        <button class="lv-boton menta grande" data-p="seguir">▶ Seguir</button>
        <button class="lv-boton" data-p="musica">${musicaMuda ? '🔇' : '🎵'} Música</button>
        <button class="lv-boton" data-p="sonido">${sonidoMudo ? '🔈' : '🔊'} Sonido</button>
        <button class="lv-boton" data-p="numeros">🔢 Números: ${numeros ? 'sí' : 'no'}</button>
        ${this.acc.ataque && puedeApuntar(j.disfraz.id) ? `<button class="lv-boton" data-p="ataque">🎯 Ataque: ${j.manual ? 'a mano' : 'solito'}</button>` : ''}
        <button class="lv-boton rosa" data-p="retirarse">${m.jug.length > 1 ? (this.anfitrion ? 'Terminar para todos' : 'Retirarme y cobrar') : 'Retirarse y cobrar'}</button>
      </div></div>`;
  }

  // ------------------------------------------------------------------------------------------------- Final
  mostrarFin(r: ResumenPartida, extra: { logros: string[]; monedas: number; pareja: boolean; nombreOtro: string; nota?: string }): Promise<'otra' | 'menu'> {
    sfx.fin(r.gano);
    const titulo = r.gano ? '¡Se acabó el agua caliente!' : r.retiro ? (r.segundos < 60 ? 'Lavadita de gato' : '¡Bien lavadito!') : r.segundos < 60 ? 'Otro día te lavas bien…' : 'Te ganaron los mugrosos';
    const sub = r.gano ? 'Aguantaste hasta la Ducha Helada: ¡cara limpiecita!' : r.retiro ? 'Te saliste a tiempo y cobraste todo lo que recogiste.' : r.segundos >= 15 * 60 ? '¡Qué lavada tan buena!' : '¡Ya casi! Con la tienda de poderes se aguanta más.';
    const total = r.danos.reduce((a, d) => a + d.dano, 0) || 1;
    const filas = r.danos
      .slice()
      .sort((a, b) => b.dano - a.dano)
      .map((d) => {
        const seg = Math.max(1, r.segundos / (r.apurado ? 2 : 1) - d.desde);
        return `<tr><td>${icono(d.arma, 22)}${ARMAS[d.arma].nombre}</td><td>${d.nivel || '—'}</td><td>${miles(d.dano)}</td><td>${Math.round((d.dano / total) * 100)} %</td><td>${miles(d.dano / seg)}</td></tr>`;
      })
      .join('');
    const logros = extra.logros
      .map((id) => LOGRO[id])
      .filter(Boolean)
      .map(logroVisto)
      .map((l) => `<div class="lv-logro">🏆<span><b>${l.nombre}</b>${l.premio}</span></div>`)
      .join('');
    this.capaFin.innerHTML = `<div class="lv-panel">
      <h2>${titulo}<small style="color:#7a625a">${extra.nota ? `${esc(extra.nota)} · ` : ''}${sub}</small></h2>
      <div class="lv-resumen">
        <span><b>${mmss(r.segundos)}</b>tiempo</span><span><b>${r.nivel}</b>nivel</span><span><b>${miles(r.eliminados)}</b>mugrosos</span>
        <span><b>${miles(r.oro)}</b>${extra.pareja ? 'gotas doradas tuyas' : 'gotas doradas'}${r.jornal ? `<small>${miles(r.jornal)} por aguantar</small>` : ''}</span>${extra.monedas ? `<span><b>+${extra.monedas}</b>monedas de la casa</span>` : ''}
      </div>
      <div class="cuerpo">
        <div class="col"><table class="lv-tabla"><tr><th>Arma</th><th>Nv</th><th>Daño</th><th>%</th><th>DPS</th></tr>${filas}</table></div>
        ${logros ? `<div class="col">${logros}</div>` : ''}
      </div>
      <div class="lv-fila">
        <button class="lv-boton menta grande" data-f="otra">${extra.pareja ? 'Volver a la sala' : 'Otra lavada'}</button>
        <button class="lv-boton" data-f="menu">Al menú</button>
      </div></div>`;
    this.capaFin.hidden = false;
    for (const c of [this.capaNivel, this.capaCofre, this.capaCarta, this.capaPausa, this.capaEspera]) c.hidden = true;
    return new Promise((ok) => {
      this.capaFin.addEventListener('click', (ev) => {
        const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-f]');
        if (!el) return;
        sfx.toque();
        ok(el.dataset.f as 'otra' | 'menu');
      });
    });
  }
}

/** La misma curva del motor (aquí para no importar el motor entero en la interfaz). */
function xpParaHud(n: number): number {
  if (n < 20) return 5 + 10 * (n - 1);
  if (n === 20) return 795;
  if (n < 40) return 195 + 13 * (n - 20);
  if (n === 40) return 2855;
  return 455 + 16 * (n - 40);
}

export type { Rol };
