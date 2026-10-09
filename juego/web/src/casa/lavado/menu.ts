// El menú de «Lavarse la cara» (lo primero que se ve al entrar por el espejo): jugar, disfraces, escenarios,
// cartas de amor, la tienda de poderes, la colección (armas, pasivas, mugrosos y logros) y jugar en pareja.
// Todo lo que se compra o se escoge se guarda en el progreso de quien juega (en la casa compartida).
import { ARMAS, ID_ARMAS, ID_PASIVAS, PASIVAS, maxNivelArma, pasivasDeEvo, type DefArma } from './armas';

/** «Evoluciona con…» para la colección (la pasiva, las dos pasivas, la otra arma de la unión o nada). */
function conQue(a: DefArma): string {
  const evo = a.evo!;
  const pide = [...(evo.arma ? [ARMAS[evo.arma].nombre] : []), ...pasivasDeEvo(a).map((p) => PASIVAS[p].nombre)];
  return pide.length ? `Evoluciona con ${pide.join(' y ')} en ${ARMAS[evo.a].nombre}.` : `Al nivel ${maxNivelArma(a.id)} se vuelve ${ARMAS[evo.a].nombre} (no pide nada más).`;
}
import { CARTAS, ID_CARTAS } from './cartas';
import { DISFRAZ, disfracesDe, puedeApuntar, type DefDisfraz } from './disfraces';
import { ENEMIGOS, ID_ENEMIGOS } from './enemigos';
import { ESCENARIOS, ID_ESCENARIOS } from './escenarios';
import { icono, iconoBicho } from './iconos';
import { MINUTO_EVOLUCION, RECETAS } from './evoluciones';
import { barraMaestria, marcoDe, MAESTRIA_MAX, PREMIOS_MAESTRIA, tituloMaestria } from './maestria';
import {
  CARTA_LOGRO, ESCENARIO_LOGRO, LOGRO, LOGROS, apuradoAbierto, cartasDe, disfrazAbierto, escenarioAbierto, maestriaDe, type ProgresoLavado,
} from './progreso';
import { sfx } from './sonidos';
import { PODER, PODERES, precioPoder } from './tienda';
import { FRASES, cartaVista, disfrazVisto, enemigoVisto, logroVisto } from './textos';
import type { IdCarta, IdEscenario, Rol, Stat } from './tipos';

export type AccionMenu = 'jugar' | 'pareja' | 'amigos' | 'codigo' | 'tutorial' | 'salir';

const miles = (n: number) => Math.round(n).toLocaleString('es-CO');
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function retrato(d: DefDisfraz, clase = 'lv-retrato', nivelMaestria = 0) {
  d = disfrazVisto(d);
  const marco = marcoDe(nivelMaestria);
  return `<img class="${clase}${marco ? ` lv-marco-${marco}` : ''}" src="./lavado/disfraces/${d.id}.webp" alt="" loading="lazy">`;
}

export interface OpcionesMenu {
  rol: Rol;
  nombre: string;
  nombreOtro: string;
  progreso: ProgresoLavado;
  guardar: (p: ProgresoLavado) => Promise<void>;
  /** Hay con quién jugar en pareja (la casa está en línea o en dos pestañas). */
  puedePareja: boolean;
  /** Se puede jugar con amigos en una sala (crearla o entrar con un código). */
  puedeSalas: boolean;
  /** Lo que dice el botón de salir (volver a la casa o a la sala de juegos de amigos). */
  textoSalir: string;
}

export class Menu {
  private raiz: HTMLElement;
  private p: ProgresoLavado;
  private resolver: ((a: AccionMenu) => void) | null = null;
  private pantalla: HTMLElement;

  constructor(contenedor: HTMLElement, private o: OpcionesMenu) {
    this.p = o.progreso;
    this.raiz = document.createElement('div');
    this.raiz.className = 'lv-menu';
    this.pantalla = document.createElement('div');
    this.pantalla.className = 'lv-pantalla';
    this.pantalla.hidden = true;
    contenedor.append(this.raiz, this.pantalla);
    this.raiz.addEventListener('click', (e) => this.clicInicio(e));
    this.pantalla.addEventListener('click', (e) => this.clicPantalla(e));
  }

  get progreso() {
    return this.p;
  }

  /** Muestra el menú y espera lo que escoja. */
  abrir(): Promise<AccionMenu> {
    this.raiz.hidden = false;
    this.pintarInicio();
    return new Promise((r) => (this.resolver = r));
  }

  cerrar() {
    this.raiz.hidden = true;
    this.pantalla.hidden = true;
  }

  quitar() {
    this.raiz.remove();
    this.pantalla.remove();
  }

  private get disfraz() {
    return disfrazVisto(DISFRAZ[this.p.disfraz] ?? disfracesDe(this.o.rol)[0]);
  }

  /**
   * Abre una pantalla suelta (los disfraces desde la sala de espera, por ejemplo) y avisa cuando se cierra. Va
   * encima de todo, sin el menú de inicio.
   */
  pantallaSuelta(cual: 'disfraces' | 'tienda' | 'cartas'): Promise<void> {
    this.suelta = true;
    this.pantalla.classList.add('lv-suelta');
    this.abrirPantalla(cual);
    return new Promise((ok) => (this.alCerrarSuelta = ok));
  }
  private suelta = false;
  private alCerrarSuelta: (() => void) | null = null;

  private async guardar() {
    try {
      await this.o.guardar(this.p);
    } catch (e) {
      console.error(e);
    }
  }

  // ------------------------------------------------------------------------------------------------- Inicio
  private pintarInicio() {
    const d = this.disfraz;
    const esc = ESCENARIOS[this.p.escenario];
    const carta = this.p.carta ? cartaVista(this.p.carta) : null;
    const apunta = puedeApuntar(d.id);
    const burbujas = Array.from({ length: 14 }, (_, k) => {
      const t = 14 + ((k * 37) % 40);
      return `<span style="left:${(k * 7.3) % 100}%;width:${t}px;height:${t}px;--d:${7 + (k % 5) * 1.6}s;--r:-${(k * 1.3) % 9}s;--x:${((k % 3) - 1) * 40}px"></span>`;
    }).join('');
    this.raiz.innerHTML = `<div class="lv-burbujas-fondo">${burbujas}</div>
      <div class="lv-saldo">${icono('moneda', 24)}${miles(this.p.oro)}</div>
      <div class="lv-titulo">
        <h1>Lavarse<br>la cara</h1>
        <p>Adentro de tu propia carita. ¡Que no quede ni un mugroso!</p>
        <button class="lv-elegido" data-m="disfraces">${retrato(d, 'lv-retrato', maestriaDe(this.p, d.id))}<span><b>${d.nombre}</b><small>${d.especial}</small>${
          this.p.maestria[d.id] ? `<em class="lv-maestria-chip">⭐ Maestría ${maestriaDe(this.p, d.id)}/${MAESTRIA_MAX}</em>` : ''
        }</span></button>
        <div class="lv-chips">
          <button class="lv-chip" data-m="escenarios">🗺️ ${esc.nombre}${this.p.apurado ? ' · ¡Apurado!' : ''}</button>
          <button class="lv-chip" data-m="cartas">${FRASES.iconoCarta()} ${carta ? carta.nombre : FRASES.sinCarta()}</button>
          <button class="lv-chip lv-chip-ataque ${apunta && this.p.manual ? 'si' : ''}" data-m="ataque" ${apunta ? '' : 'disabled'}
            title="${apunta ? 'Toca para cambiar' : 'Los disfraces de área siempre disparan solos'}">🎯 Ataque: ${apunta ? (this.p.manual ? 'a mano' : 'solito') : 'solito (de área)'}</button>
          ${this.p.mejor[this.p.escenario] ? `<span class="lv-chip">🏆 ${mmss(this.p.mejor[this.p.escenario]!)}</span>` : ''}
        </div>
      </div>
      <div class="lv-acciones">
        <button class="lv-boton grande rosa" data-m="jugar">🫧 ¡A lavarse!</button>
        ${this.o.puedePareja ? `<button class="lv-boton menta" data-m="pareja">${FRASES.iconoPareja()} Jugar con ${this.o.nombreOtro}</button>` : ''}
        ${this.o.puedeSalas ? `<div class="lv-fila-salas"><button class="lv-boton menta" data-m="amigos">👥 Con amigos</button><button class="lv-boton" data-m="codigo">🔑 Unirme con código</button></div>` : ''}
        <div class="lv-rejilla">
          <button class="lv-boton" data-m="disfraces">${icono(d.arma, 30)}Disfraces</button>
          <button class="lv-boton" data-m="tienda">${icono('alcancia', 30)}Poderes</button>
          <button class="lv-boton" data-m="coleccion">${icono('lupa', 30)}Colección</button>
          <button class="lv-boton" data-m="tutorial"><span class="lv-ico-txt">🎓</span>Cómo se juega</button>
        </div>
        <button class="lv-boton" data-m="salir">${this.o.textoSalir}</button>
      </div>`;
  }

  private clicInicio(e: MouseEvent) {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-m]');
    if (!el) return;
    sfx.toque();
    const m = el.dataset.m!;
    if (m === 'ataque') {
      if (!puedeApuntar(this.p.disfraz)) return;
      this.p.manual = !this.p.manual;
      void this.guardar();
      this.pintarInicio();
      return;
    }
    if (m === 'jugar' || m === 'pareja' || m === 'salir' || m === 'amigos' || m === 'codigo' || m === 'tutorial') {
      this.resolver?.(m);
      this.resolver = null;
      return;
    }
    this.abrirPantalla(m);
  }

  // ------------------------------------------------------------------------------------------------- Pantallas
  private actual = '';
  private sel = '';
  private pestana = 'armas';

  private abrirPantalla(cual: string) {
    this.actual = cual;
    this.sel = cual === 'disfraces' ? this.p.disfraz : cual === 'escenarios' ? this.p.escenario : cual === 'cartas' ? this.p.carta : cual === 'tienda' ? 'poder' : '';
    this.pantalla.hidden = false;
    this.pintarPantalla();
  }

  private cerrarPantalla() {
    this.pantalla.hidden = true;
    if (this.suelta) {
      this.suelta = false;
      this.pantalla.classList.remove('lv-suelta');
      const fn = this.alCerrarSuelta;
      this.alCerrarSuelta = null;
      fn?.();
      return;
    }
    this.pintarInicio();
  }

  private pintarPantalla() {
    const titulo: Record<string, string> = {
      disfraces: 'Disfraces', escenarios: '¿Dónde nos lavamos?', cartas: FRASES.tituloCartas(), tienda: 'Poderes para siempre', coleccion: 'Colección',
    };
    const cab = `<header><button class="lv-boton" data-v="volver">← Volver</button><h2>${titulo[this.actual]}</h2>
      <div class="lv-saldo" style="position:static">${icono('moneda', 22)}${miles(this.p.oro)}</div></header>`;
    let cuerpo = '';
    if (this.actual === 'disfraces') cuerpo = this.htmlDisfraces();
    else if (this.actual === 'escenarios') cuerpo = this.htmlEscenarios();
    else if (this.actual === 'cartas') cuerpo = this.htmlCartas();
    else if (this.actual === 'tienda') cuerpo = this.htmlTienda();
    else cuerpo = this.htmlColeccion();
    this.pantalla.innerHTML = cab + cuerpo;
  }

  private htmlDisfraces() {
    const lista = disfracesDe(this.o.rol)
      .map(disfrazVisto)
      .map((d) => {
        const abierto = disfrazAbierto(this.p, d.id);
        const nm = maestriaDe(this.p, d.id);
        return `<button class="lv-item ${this.sel === d.id ? 'sel' : ''} ${abierto ? '' : 'bloq'}" data-sel="${d.id}">${retrato(d, 'lv-retrato', nm)}<span>${d.nombre}</span>${
          nm ? `<span class="lv-estrellas-m" title="Maestría ${nm}">${'★'.repeat(Math.ceil(nm / 2))}</span>` : ''
        }</button>`;
      })
      .join('');
    const d = disfrazVisto(DISFRAZ[this.sel] ?? this.disfraz);
    const abierto = disfrazAbierto(this.p, d.id);
    const logro = d.logro ? logroVisto(LOGRO[d.logro]) : null;
    const boton = abierto
      ? this.p.disfraz === d.id
        ? '<button class="lv-boton" disabled>Ya lo tienes puesto</button>'
        : `<button class="lv-boton rosa" data-v="ponerse">¡Ponérmelo!</button>`
      : `<button class="lv-boton oro" data-v="comprar" ${this.p.oro >= d.precio ? '' : 'disabled'}>Comprar por ${miles(d.precio)} ${icono('moneda', 16)}</button>`;
    return `<div class="cuerpo"><div class="lv-lista">${lista}</div>
      <div class="lv-detalle"><div class="gran">${retrato(d, '', maestriaDe(this.p, d.id))}<div><h3>${d.nombre}</h3><p>Como ${d.original} en el original</p></div></div>
        <p>${d.desc}</p>
        <p class="esp">${icono(d.arma, 22)} ${d.especial}</p>
        <p class="lv-apunta">${puedeApuntar(d.id) ? '🎯 Se puede manejar a mano (segundo dedo o mouse)' : '🌀 Disfraz de área: sus armas pegan solitas alrededor'}</p>
        ${!abierto && logro ? `<p>🔒 Se gana con el logro <b>«${logro.nombre}»</b>: ${logro.desc}. O cómpralo ya.</p>` : ''}
        ${boton}
        ${this.htmlMaestria(d)}</div></div>`;
  }

  /** La maestría del disfraz: nivel, barrita y los diez premios (los ganados en verde, el siguiente resaltado). */
  private htmlMaestria(d: DefDisfraz) {
    const puntos = this.p.maestria[d.id] ?? 0;
    const b = barraMaestria(puntos);
    const premios = PREMIOS_MAESTRIA.map((x) => {
      const clase = x.nivel <= b.nivel ? 'si' : x.nivel === b.nivel + 1 ? 'sigue' : '';
      const marca = x.marco ? `<i class="lv-mini-marco ${x.marco}"></i>` : '';
      return `<li class="${clase}" title="${x.texto}"><b>${x.nivel}</b>${x.oro ? icono('moneda', 13) : ''}${x.corto}${marca}</li>`;
    }).join('');
    const pie = b.nivel >= MAESTRIA_MAX
      ? '¡Maestría completa! Este disfraz ya lo da todo.'
      : `${puntos} puntos · faltan ${b.faltan} para el nivel ${b.nivel + 1}. Se ganan jugando con este disfraz: 1 por minuto, 1 por cada 500 mugrosos, 1 por evolución, 1 por jefe y 5 por ganar.`;
    return `<div class="lv-maestria">
      <h4>⭐ Maestría ${b.nivel}/${MAESTRIA_MAX} · ${tituloMaestria(b.nivel, d.rol)}</h4>
      <div class="lv-barra-maestria"><i style="width:${Math.round(b.parte * 100)}%"></i></div>
      <ol>${premios}</ol>
      <p>${pie} Los bonos son solo para este disfraz.</p>
    </div>`;
  }

  private htmlEscenarios() {
    const lista = ID_ESCENARIOS.map((id) => {
      const e = ESCENARIOS[id];
      const abierto = escenarioAbierto(this.p, id);
      const mejor = this.p.mejor[id];
      const logro = ESCENARIO_LOGRO[id] ? logroVisto(LOGRO[ESCENARIO_LOGRO[id]!]) : null;
      return `<button class="lv-escenario ${this.sel === id ? 'sel' : ''} ${abierto ? '' : 'bloq'}" data-sel="${id}">
        <div class="vista ${id}"></div><b>${e.nombre}${this.p.ganados.includes(id) ? ' ✨' : ''}</b>
        <em>${abierto ? e.desc : `🔒 ${logro?.desc ?? e.desbloqueo}`}</em>
        <small>${mejor ? `Lo más que has aguantado: ${mmss(mejor)}` : abierto ? '¡Sin estrenar!' : ''}</small></button>`;
    }).join('');
    const apurado = apuradoAbierto(this.p);
    return `<div class="cuerpo" style="flex-direction:column"><div class="lv-lista anchos" style="flex:1">${lista}</div>
      <div class="lv-fila">
        <label class="lv-interruptor" style="${apurado ? '' : 'opacity:.5'}"><input type="checkbox" data-v="apurado" ${this.p.apurado ? 'checked' : ''} ${apurado ? '' : 'disabled'}>
          ⏩ Modo Apurado: el reloj corre al doble ${apurado ? '' : '(se gana llegando a los 30:00 en La Cara)'}</label>
        <button class="lv-boton rosa" data-v="volver">Listo</button></div></div>`;
  }

  private htmlCartas() {
    const abiertas = cartasDe(this.p);
    const lista = ID_CARTAS.map((id) => {
      const c = cartaVista(id);
      const ab = abiertas.includes(id);
      return `<button class="lv-item ${this.sel === id ? 'sel' : ''} ${ab ? '' : 'bloq'}" data-sel="${id}" style="border:2px solid ${c.color}">
        <span style="font:700 16px var(--display);color:${c.color}">${c.numero}</span><span>${ab ? c.nombre : '¿?'}</span></button>`;
    }).join('');
    const c = this.sel ? cartaVista(this.sel as IdCarta) : null;
    const ab = c && abiertas.includes(c.id);
    const logro = c ? logroVisto(LOGRO[CARTA_LOGRO[c.id]]) : null;
    const det = c
      ? `<h3 style="color:${c.color}">${c.numero} · ${ab ? c.nombre : 'Carta guardada'}</h3>${ab ? `<p><i>${c.frase}</i></p><p class="esp">${c.efecto}</p>` : `<p>🔒 ${logro?.desc}</p>`}`
      : `<h3>Sin carta</h3><p>Una partida normalita, sin ${FRASES.tituloCartas().toLowerCase()}. Igual en los minutos 11 y 21 pueden salir cartas perdidas.</p>`;
    return `<div class="cuerpo"><div class="lv-lista">
        <button class="lv-item ${!this.sel ? 'sel' : ''}" data-sel=""><span style="font-size:20px">✉️</span><span>Sin carta</span></button>${lista}</div>
      <div class="lv-detalle">${det}<p style="margin-top:auto">Se escoge una al empezar. Los que traen cartas perdidas (minutos 11 y 21) dejan escoger otra.</p>
        <button class="lv-boton rosa" data-v="carta" ${!c || ab ? '' : 'disabled'}>${c ? 'Llevar esta carta' : 'Jugar sin carta'}</button></div></div>`;
  }

  private htmlTienda() {
    const lista = PODERES.map((d) => {
      const r = this.p.poderes[d.id] ?? 0;
      const lleno = r >= d.max;
      return `<button class="lv-item ${this.sel === d.id ? 'sel' : ''}" data-sel="${d.id}">${icono(d.icono, 38)}<span>${d.nombre}</span>
        <span class="pips">${Array.from({ length: d.max }, (_, k) => `<u class="${k < r ? 'si' : ''}"></u>`).join('')}</span>
        <span class="precio">${lleno ? '¡Completo!' : `${miles(precioPoder(d.id, this.p.poderes))}`}</span></button>`;
    }).join('');
    const d = PODER[this.sel as Stat] ?? PODERES[0];
    const r = this.p.poderes[d.id] ?? 0;
    const precio = precioPoder(d.id, this.p.poderes);
    return `<div class="cuerpo"><div class="lv-lista">${lista}</div>
      <div class="lv-detalle"><div class="gran">${icono(d.icono, 70)}<div><h3>${d.nombre}</h3><p>Rango ${r} de ${d.max}</p></div></div>
        <p>${d.desc}.</p>
        <p>Como en el original, cada compra encarece un poquito todo lo demás. Puedes pedir el reembolso completo y repartir de nuevo.</p>
        ${r < d.max ? `<button class="lv-boton oro" data-v="comprarPoder" ${this.p.oro >= precio ? '' : 'disabled'}>Comprar por ${miles(precio)} ${icono('moneda', 16)}</button>` : '<button class="lv-boton" disabled>¡Completo!</button>'}
        <button class="lv-boton" data-v="reembolso" ${this.p.gastado ? '' : 'disabled'}>↩️ Reembolsar todo (${miles(this.p.gastado)})</button></div></div>`;
  }

  private htmlColeccion() {
    const tabs = ['armas', 'pasivas', 'evoluciones', 'mugrosos', 'logros']
      .map((t) => `<button class="${this.pestana === t ? 'sel' : ''}" data-tab="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`)
      .join('');
    let lista = '';
    let det = '';
    if (this.pestana === 'armas') {
      lista = ID_ARMAS.map((id) => {
        const visto = this.p.armas.includes(id);
        return `<button class="lv-item ${this.sel === id ? 'sel' : ''}" data-sel="${id}">${icono(id, 40, visto ? '' : 'silueta')}<span>${visto ? ARMAS[id].nombre : '¿?'}</span></button>`;
      }).join('');
      const a = ARMAS[this.sel as keyof typeof ARMAS];
      if (a) {
        const visto = this.p.armas.includes(a.id);
        det = visto
          ? `<h3>${a.nombre}</h3><p>Como ${a.original} en el original.</p><p>${a.desc}</p>${a.evo ? `<p class="esp">✨ ${conQue(a)}</p>` : ''}${a.de ? `<p class="esp">Evolución de ${a.de.map((x) => ARMAS[x].nombre).join(' + ')}.</p>` : ''}`
          : '<h3>¿Qué será?</h3><p>Todavía no la has tenido en una partida.</p>';
      }
    } else if (this.pestana === 'pasivas') {
      lista = ID_PASIVAS.map((id) => {
        const visto = this.p.pasivas.includes(id);
        return `<button class="lv-item ${this.sel === id ? 'sel' : ''}" data-sel="${id}">${icono(id, 40, visto ? '' : 'silueta')}<span>${visto ? PASIVAS[id].nombre : '¿?'}</span></button>`;
      }).join('');
      const p = PASIVAS[this.sel as keyof typeof PASIVAS];
      if (p) det = this.p.pasivas.includes(p.id) ? `<h3>${p.nombre}</h3><p>Como ${p.original} en el original.</p><p class="esp">${p.desc} (hasta ${p.max} niveles)</p>` : '<h3>¿Qué será?</h3>';
    } else if (this.pestana === 'evoluciones') {
      // Todas las recetas: qué arma, qué pide y en qué se convierte (lo que ya se tuvo, con su nombre)
      lista = `<div class="lv-recetas lv-recetas-menu">${RECETAS.map((r) => {
        const ya = this.p.armas.includes(r.a);
        const piezas = [
          ...r.de.map((id) => `<span class="lv-paso" title="${ARMAS[id].nombre}">${icono(id, 26)}<em class="marca">${maxNivelArma(id)}</em></span>`),
          ...r.pasivas.map((id) => `<span class="lv-paso" title="${PASIVAS[id].nombre}">${icono(id, 26)}</span>`),
        ].join('<b class="mas">+</b>');
        const nombres = [...r.de.map((id) => `${ARMAS[id].nombre} (nivel ${maxNivelArma(id)})`), ...r.pasivas.map((id) => PASIVAS[id].nombre)].join(' + ');
        return `<div class="lv-rec ${ya ? 'hecha' : 'cerca'}"><span class="lv-receta">${piezas}<b class="flecha">➜</b><span class="lv-paso fin ${ya ? 'si' : ''}">${icono(r.a, 30, ya ? '' : 'silueta')}</span></span>
          <div><b>${ya ? ARMAS[r.a].nombre : '¿Qué saldrá?'}</b><small>${nombres}</small></div></div>`;
      }).join('')}</div>`;
      det = `<h3>Cómo se evoluciona</h3><p>Sube el arma hasta el <b>nivel 8</b>, ten en la mochila la pasiva que pide (con un nivel basta) y abre un <b>cofre</b> después del <b>minuto ${MINUTO_EVOLUCION}</b> (los sueltan los élites y los jefes).</p>
        <p>Las <b>uniones</b> juntan dos armas en su nivel máximo: los dos patos, el perfume y la colonia (esa pide además la curita de corazón) o la máquina de afeitar y el toallazo de vapor. El <b>copito</b> no pide nada: se vuelve doble y después triple. Los <b>anillos</b> y los <b>aretes</b> no salen en las cartas: están escondidos lejos en los escenarios (después del espejito de mano).</p>
        <p class="esp">En la partida, en la pausa (o tocando tus armas de arriba), la pestaña «Mochila» te dice qué le falta a cada una.</p>`;
    } else if (this.pestana === 'mugrosos') {
      lista = ID_ENEMIGOS.map((id) => {
        const n = this.p.bestiario[id] ?? 0;
        return `<button class="lv-item ${this.sel === id ? 'sel' : ''}" data-sel="${id}">${iconoBicho(id, 44, n ? '' : 'silueta')}<span>${n ? ENEMIGOS[id].nombre : '¿?'}</span></button>`;
      }).join('');
      const e0 = ENEMIGOS[this.sel as keyof typeof ENEMIGOS];
      const e = e0 ? enemigoVisto(e0) : e0;
      if (e) {
        const n = this.p.bestiario[e.id] ?? 0;
        det = n ? `<h3>${e.nombre}</h3><p>${e.desc}</p><p class="esp">Eliminados: ${miles(n)}</p><p>Vida ${e.jefe ? `${e.vida} × tu nivel` : e.vida} · daño ${e.dano}</p>` : '<h3>¿Quién será?</h3><p>Todavía no lo has eliminado.</p>';
      }
    } else {
      lista = LOGROS.map(logroVisto).map((l) => {
        const si = this.p.logros.includes(l.id);
        return `<button class="lv-item ${this.sel === l.id ? 'sel' : ''} ${si ? '' : 'bloq'}" data-sel="${l.id}"><span style="font-size:22px">${si ? '🏆' : '🔒'}</span><span>${l.nombre}</span></button>`;
      }).join('');
      const l = LOGRO[this.sel] ? logroVisto(LOGRO[this.sel]) : null;
      if (l) det = `<h3>${l.nombre}</h3><p>${l.desc}</p><p class="esp">Premio: ${l.premio}</p>`;
    }
    const resumen = `<p>Partidas: ${miles(this.p.partidas)} · Mugrosos: ${miles(this.p.eliminados)} · Velitas: ${miles(this.p.velitas)} · Cofres: ${miles(this.p.cofres)} · Gotas doradas ganadas: ${miles(this.p.oroTotal)}</p>`;
    return `<div class="lv-pestanas">${tabs}</div><div class="cuerpo"><div class="lv-lista">${lista}</div>
      <div class="lv-detalle">${det || '<h3>Toca algo para verlo</h3>'}${resumen}</div></div>`;
  }

  private async clicPantalla(e: MouseEvent) {
    const t = e.target as HTMLElement;
    const tab = t.closest<HTMLElement>('[data-tab]');
    if (tab) {
      this.pestana = tab.dataset.tab!;
      this.sel = '';
      sfx.toque();
      this.pintarPantalla();
      return;
    }
    const sel = t.closest<HTMLElement>('[data-sel]');
    if (sel) {
      this.sel = sel.dataset.sel ?? '';
      sfx.toque();
      if (this.actual === 'escenarios') {
        const id = this.sel as IdEscenario;
        if (escenarioAbierto(this.p, id)) {
          this.p.escenario = id;
          void this.guardar();
        }
      }
      this.pintarPantalla();
      return;
    }
    const v = t.closest<HTMLElement>('[data-v]');
    if (!v) return;
    const a = v.dataset.v;
    if (a === 'apurado') {
      this.p.apurado = (v as HTMLInputElement).checked;
      void this.guardar();
      return;
    }
    sfx.toque();
    if (a === 'volver') return this.cerrarPantalla();
    if (a === 'ponerse') {
      this.p.disfraz = this.sel;
      // (los disfraces de área siempre disparan solos)
      if (!puedeApuntar(this.sel)) this.p.manual = false;
      sfx.premio();
      void this.guardar();
      return this.cerrarPantalla();
    }
    if (a === 'comprar') {
      const d = DISFRAZ[this.sel];
      if (!d || this.p.oro < d.precio || disfrazAbierto(this.p, d.id)) return;
      this.p.oro -= d.precio;
      this.p.comprados.push(d.id);
      this.p.disfraz = d.id;
      sfx.premio();
      void this.guardar();
      this.pintarPantalla();
      return;
    }
    if (a === 'carta') {
      this.p.carta = (this.sel || '') as IdCarta | '';
      void this.guardar();
      return this.cerrarPantalla();
    }
    if (a === 'comprarPoder') {
      const id = this.sel as Stat;
      const d = PODER[id];
      const r = this.p.poderes[id] ?? 0;
      const precio = precioPoder(id, this.p.poderes);
      if (!d || r >= d.max || this.p.oro < precio) return;
      this.p.oro -= precio;
      this.p.gastado += precio;
      this.p.poderes = { ...this.p.poderes, [id]: r + 1 };
      sfx.premio();
      void this.guardar();
      this.pintarPantalla();
      return;
    }
    if (a === 'reembolso') {
      this.p.oro += this.p.gastado;
      this.p.gastado = 0;
      this.p.poderes = {};
      void this.guardar();
      this.pintarPantalla();
    }
  }
}
