// El HUD de la expedición (DOM) y la capa 2D encima del 3D (números de daño, nombres y vida de los compañeros,
// flechas hacia lo que está fuera de la pantalla, barras de los élites). El DOM solo se toca cuando algo cambia.
import { CLASES } from '../datos/clases';
import { ETAPAS, EVENTOS, JEFES, OBJETIVOS, SECUNDARIOS, type IdEvento } from '../datos/mundo';
import { SANTOS } from '../datos/botin';
import { NIVEL_MAX_ARMA, xpArma } from '../datos/armas';
import { TIPOS, esJefe } from '../sim/catalogo';
import { ENT, S, type Entidad, type Enemigos, type Sucesos } from '../sim/estado';
import { xpPara, type Jugador } from '../sim/jugador';
import { MINERALES_ORDEN, type IdObjetivo, type IdSecundario } from '../tipos';
import { MINERALES } from '../datos/minerales';
import type { Escena3D } from '../vista/escena';
import { COLOR_ASTRAL } from '../vista/astral';
import { glifo, icono } from './iconos';

const $ = (id: string) => document.getElementById(id)!;

/** Lo que el HUD lee (lo cumplen la simulación y el espejo). */
export interface EstadoHud {
  t: number;
  /** Barra de la etapa (0-1) y dónde salen las oleadas. */
  avance: number;
  oleadas: number[];
  oleadasHechas: number;
  /** El Guardián (índice o −1) y si ya salió; la impaciencia de la Noche. */
  guardian: number;
  guardianVisto: boolean;
  impaciencia: number;
  fase: 'juego' | 'extraccion' | 'jefe';
  obj: { tipo: IdObjetivo; meta: number; prog: number; hecho: boolean; fallo: boolean };
  sec: { tipo: IdSecundario; meta: number; prog: number };
  campana: Entidad | null;
  jefe: number;
  jefeFase: number;
  E: Enemigos;
  ent: Entidad[];
  J: Jugador[];
  suc: Sucesos;
  eclipse: number;
  mapa: { rieles: { x: number; y: number }[] };
  cfg: { etapa: number; final: boolean; exp: { infinito?: boolean; etapas?: number } };
  /** Sin reloj (tutorial). */
  sinReloj?: boolean;
}

interface Numero {
  x: number;
  y: number;
  z: number;
  v: number;
  t: number;
  crit: boolean;
  color: string;
}

const AVISOS: Record<number, (a: number, b: number, nombre: (i: number) => string) => [string, string?]> = {
  1: () => ['¡Objetivo cumplido! La barra dio un salto.', 'grande'],
  2: () => ['Se acabó el tiempo: ¡baja la campana!'],
  3: (a, b) => [`Altar destruido (${a}/${b}): ¡viene una oleada!`, 'peligro'],
  4: () => ['¡El élite marcado cayó!', 'grande'],
  5: () => ['¡Baja la Campana de Extracción! Corran al círculo de luz.', 'grande'],
  6: (a, b) => [`Prisionero liberado (${a}/${b}). Te sigue hasta la campana.`],
  7: (a, _b, n) => [`${n(a)} se quedó en la oscuridad.`, 'peligro'],
  8: () => ['¡Todos adentro! La campana sube.', 'grande'],
  9: (a, _b, n) => [`${n(a)} encontró una llave.`],
  10: (a, b) => [`Frasco de alquimia (${a}/${b})`],
  11: (a, b) => [`Secundario: ${a}/${b}`],
  12: () => ['El élite marcado anda cerca. ¡Cázalo!', 'peligro'],
  13: () => ['Necesitas una llave (la sueltan los élites).'],
  14: () => ['El tiempo se detuvo…', 'grande'],
  15: (a, _b, n) => [`¡${n(a)} se levantó otra vez!`, 'grande'],
  16: (a, b, n) => [`Milagro de ${Object.values(SANTOS)[b]?.nombre ?? ''} para ${n(a)}: ${Object.values(SANTOS)[b]?.milagro.nombre ?? ''}`, 'grande'],
  17: () => ['La carreta se perdió.', 'peligro'],
  19: (a) => [`¡El jefe cambia! Fase ${a}.`, 'peligro'],
  20: (a) => [EVENTOS[(['enjambre', 'cerco', 'lluvia_huesos', 'eclipse', 'marea', 'cofre_maldito'] as IdEvento[])[a]]?.aviso ?? '', 'peligro'],
  21: () => ['¡Despertó el Guardián! Mátenlo para llamar la campana.', 'grande'],
  22: (a) => [`La Noche se impacienta (×${a}): la horda viene más rápida y más brava.`, 'peligro'],
  23: () => ['¡Cayó el Guardián! Baja la campana.', 'grande'],
  25: (a, b) => [b > 1 ? `¡Oleada ${a} de ${b}!` : '¡Una oleada!', 'peligro'],
  26: (a, b) => [`Un sepulcro se abrió solo (${a}/${b}): ¡sale su custodio!`, 'peligro'],
  27: (a, b) => [`Abriste un sepulcro (${a}/${b}): ¡sale su custodio!`, 'peligro'],
  28: (a) => [`${TIPOS[a]?.nombre ?? 'El bicho'} se escapó con todo.`],
  29: (a) => [TIPOS[a]?.id === 'rata_dorada' ? '¡Una rata dorada! Atrápenla antes de que se escape.' : '¡Un ladrón de tumbas va cargado! Que no se escape.', 'grande'],
  30: () => ['Cayó una pluma de grifo: atrápala antes de que se la lleve el viento.'],
  31: (a, b) => [`Rosa del velo (${a}/${b}): un poco de calma.`],
  32: (a, b) => [`Pluma de grifo (${a}/${b}): ¡el viento te empuja!`],
  33: (a, b) => [`Hongos de tumba (${a}/${b})`],
  34: () => ['¡Las Santas mandan un cofre de suministros! Excava el círculo marcado para que baje.', 'grande'],
  35: () => ['¡Despejado! El ataúd de suministros viene bajando…'],
  36: () => ['Llegó el ataúd: ábranlo, hay una reliquia para cada uno.', 'grande'],
  37: () => ['¡Las tumbas se abren! Donde se mueve la tierra, salen muertos.', 'peligro'],
  38: () => ['Baja la niebla del pantano: no se ve casi nada.', 'peligro'],
  39: () => ['¡Grisú! Las bolsas verdes revientan al picarlas (y le pegan a todos).', 'peligro'],
  40: () => ['¡Se viene el techo! Las columnas de hueso sostienen la catacumba: rómpelas con la horda debajo.', 'peligro'],
  41: () => ['¡Se caen los vitrales! Fíjate en las sombras del piso.', 'peligro'],
  42: () => ['¡Una vagoneta suelta viene rodando! Quítate… o deja que atropelle a la horda.', 'peligro'],
  43: () => ['¡El campanario llama a los muertos! Aguanta la oleada y paga.', 'grande'],
  44: () => ['El campanario calla: dejó dos cofres y oro.', 'grande'],
  45: () => ['¡Las armaduras del castillo despiertan cuando pasas cerca!', 'peligro'],
  46: () => ['El fantasma del Conde te busca: no se muere, solo se esquiva.', 'peligro'],
};

/** La leyenda de la visión astral: qué es cada color. */
const LEYENDA: [string, string][] = [
  [COLOR_ASTRAL.hierro, 'Hierro'],
  [COLOR_ASTRAL.oro, 'Oro'],
  [COLOR_ASTRAL.sangre, 'Sangre'],
  [COLOR_ASTRAL.huevo, 'Huevos y comida'],
  [COLOR_ASTRAL.mineral, 'Minerales (cada uno de su color)'],
  [COLOR_ASTRAL.botin, 'Botín'],
  [COLOR_ASTRAL.santo, 'Santuario'],
  [COLOR_ASTRAL.reliquia, 'Reliquias'],
  [COLOR_ASTRAL.prisionero, 'Prisioneros'],
  [COLOR_ASTRAL.objetivo, 'Objetivo'],
];

/** La barrita de lo que se abre o se libera: qué dice y de qué color. */
const USO: Record<number, { texto: string; color: string; alto: number }> = {
  [ENT.PRISIONERO]: { texto: 'Liberando…', color: '#f0e4c8', alto: 2 },
  [ENT.SANTUARIO]: { texto: 'Rezando…', color: '#a8c8ff', alto: 2.35 },
  [ENT.COFRE_RELIQUIA]: { texto: 'Abriendo…', color: '#c890ff', alto: 1.3 },
  [ENT.COFRE_MALDITO]: { texto: 'Rompiendo el sello…', color: '#ff6a5a', alto: 1.3 },
};

export class Hud {
  private raiz = $('hud');
  private lienzo = $('superpuesto') as HTMLCanvasElement;
  private g = this.lienzo.getContext('2d')!;
  private numeros: Numero[] = [];
  private cache = new Map<string, string>();
  private els: Record<string, HTMLElement> = {};
  private dpr = 1;
  private local = 0;
  alHabilidad: () => void = () => undefined;
  alPausa: () => void = () => undefined;
  alAstral: () => void = () => undefined;
  /** Nombre de cada jugador (Javier, Laura o el del amigo). */
  nombre: (i: number) => string = (i) => `Jugador ${i + 1}`;
  private veloDano = $('velo-dano');
  /** El cartel del Guardián ya salió en esta etapa (se reinicia al construir el HUD). */
  guardianAnunciado = false;
  private golpeVelo = 0;
  private P = { x: 0, y: 0, visible: false };

  constructor(private escena: Escena3D) {
    addEventListener('resize', this.ajustar);
    this.ajustar();
  }

  ajustar = () => {
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.lienzo.width = Math.round(innerWidth * this.dpr);
    this.lienzo.height = Math.round(innerHeight * this.dpr);
  };

  /** Arma el HUD para el jugador local. */
  construir(j: Jugador, local: number) {
    this.local = local;
    this.guardianAnunciado = false;
    const def = CLASES[j.clase];
    this.raiz.innerHTML = `
      <div class="hud-xp"><i data-e="xp"></i></div>
      <div class="hud-yo">
        <div class="hud-retrato">${glifo(def.glifo)}<span class="hud-nivel" data-e="nivel">1</span></div>
        <div class="hud-barras">
          <div class="barra"><i class="eco" data-e="eco"></i><i data-e="vida"></i><b data-e="vidaT"></b></div>
          <div class="barra barra-escudo" data-e="escudoB" hidden><i data-e="escudo"></i></div>
          <span class="hud-hab-chico" data-e="mec"></span>
        </div>
      </div>
      <div class="hud-companeros" data-e="comp"></div>
      <div class="hud-objetivo">
        <span class="hud-etapa" data-e="etapa"></span>
        <span class="hud-reloj" data-e="reloj"></span>
        <div class="hud-avance" data-e="avanceB"><i data-e="avance"></i><span class="marcas" data-e="marcas"></span><span class="fin-barra" data-e="finB">${glifo('calavera')}</span></div>
        <div class="obj" data-e="obj"></div>
        <div class="obj secundario" data-e="sec"></div>
      </div>
      <div class="hud-extraccion" data-e="extra" hidden></div>
      <div class="hud-jefe" data-e="jefe" hidden><b data-e="jefeN"></b><div class="barra"><i class="eco" data-e="jefeEco"></i><i data-e="jefeV"></i></div></div>
      <div class="hud-derecha">
        <div class="recursos">
          <span class="r-oro"><span data-e="oro">0</span><span class="ico">${glifo('oro')}</span></span>
          <span class="r-hierro"><span data-e="hierro">0</span><span class="ico">${glifo('hierro')}</span></span>
          <span class="r-sangre"><span data-e="sangre">0</span><span class="ico">${glifo('cristal')}</span></span>
          <span class="r-muertes"><span data-e="muertes">0</span><span class="ico">${glifo('calavera')}</span></span>
          <span class="r-minerales" data-e="minerales"></span>
        </div>
        <button class="boton boton-redondo boton-pausa" data-e="pausa" aria-label="Pausa">${glifo('pausa')}</button>
      </div>
      <div class="hud-armas" data-e="armas"></div>
      <button class="hud-astral" data-e="astral" aria-label="Visión astral" title="Visión astral (Q)">${glifo('ojo')}<span class="tecla">Q</span></button>
      <div class="hud-leyenda" data-e="leyenda" hidden>${LEYENDA.map(([c, t]) => `<span><i style="background:${c}"></i>${t}</span>`).join('')}</div>
      <button class="hud-habilidad" data-e="hab" aria-label="${def.habilidad.nombre}">${glifo(def.habilidad.glifo)}<span class="recarga" data-e="habR"></span><b data-e="habT"></b><span class="tecla">Espacio</span></button>`;
    this.els = {};
    for (const el of this.raiz.querySelectorAll<HTMLElement>('[data-e]')) this.els[el.dataset.e!] = el;
    this.cache.clear();
    this.els.hab.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.alHabilidad();
    });
    this.els.pausa.addEventListener('click', () => this.alPausa());
    this.els.astral.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.alAstral();
    });
    this.raiz.hidden = false;
  }

  esconder() {
    this.raiz.hidden = true;
    this.g.clearRect(0, 0, this.lienzo.width, this.lienzo.height);
    $('avisos').innerHTML = '';
  }

  /** Mientras se escogen las cartas el HUD casi desaparece (si no, sus letreros se cruzan con el título de la elección). */
  eligiendo(si: boolean) {
    this.raiz.classList.toggle('eligiendo', si);
  }

  tenue(si: boolean) {
    this.raiz.classList.toggle('tenue', si);
  }

  private poner(clave: string, valor: string, fn: (el: HTMLElement, v: string) => void) {
    if (this.cache.get(clave) === valor) return;
    this.cache.set(clave, valor);
    // (las claves con «!» o «?» al final son otra propiedad del mismo elemento)
    const el = this.els[clave] ?? this.els[clave.replace(/[!?]$/, '')];
    if (el) fn(el, valor);
  }
  private texto(clave: string, v: string | number) {
    this.poner(clave, String(v), (el, x) => (el.textContent = x));
  }
  private ancho(clave: string, frac: number) {
    this.poner(clave, (Math.round(Math.max(0, Math.min(1, frac)) * 400) / 4).toFixed(2), (el, x) => (el.style.width = `${x}%`));
  }
  private html(clave: string, h: string) {
    this.poner(clave, h, (el, x) => (el.innerHTML = x));
  }
  private ver(clave: string, si: boolean) {
    const k = clave + '?', v = si ? '1' : '0';
    if (this.cache.get(k) === v) return;
    this.cache.set(k, v);
    const el = this.els[clave];
    if (el) el.hidden = !si;
  }

  actualizar(dt: number, est: EstadoHud) {
    const j = est.J[this.local];
    if (!j) return;
    // Vida y experiencia
    this.ancho('vida', j.hp / j.hpMax);
    this.ancho('eco', j.hp / j.hpMax);
    this.texto('vidaT', `${Math.ceil(Math.max(0, j.hp))} / ${j.hpMax}`);
    this.ancho('xp', j.xp / xpPara(j.nivel));
    this.texto('nivel', j.nivel);
    // Visión astral: el botón prendido y la leyenda de colores
    const astral = this.escena.astralFuerza > 0.5 ? 'si' : '';
    this.poner('astral?', astral, (el, v) => el.classList.toggle('activo', !!v));
    this.poner('leyenda', astral, (el, v) => (el.hidden = !v));
    // Escudo del caballero o lo que haya de la mecánica
    const mec = this.textoMecanica(j);
    this.texto('mec', mec);
    if (j.clase === 'caballero' && j.spec !== 2) {
      this.ver('escudoB', true);
      const max = j.spec === 0 ? 2 : 1;
      this.ancho('escudo', ((j.m.escudo ?? 0) + Math.min(1, (j.m.escudoT ?? 0) / Math.max(2, 6 - j.don('escudo_rapido'))) * ((j.m.escudo ?? 0) < max ? 1 : 0)) / max);
    } else this.ver('escudoB', false);
    // Velo rojo cuando la vida está baja o le acaban de pegar
    this.golpeVelo = Math.max(0, this.golpeVelo - dt * 2.5);
    const bajo = j.estado === 0 ? Math.max(0, 0.35 - j.hp / j.hpMax) * 2 : j.estado === 1 ? 0.8 : 0;
    this.veloDano.style.opacity = String(Math.min(1, Math.max(bajo, this.golpeVelo)).toFixed(2));
    // Recursos
    this.texto('oro', Math.floor(j.oro + j.oroSeguro));
    this.texto('hierro', Math.floor(j.hierro + j.hierroSeguro));
    this.texto('sangre', Math.floor(j.sangre + j.sangreSeguro));
    this.texto('muertes', j.resumen.muertes);
    // Los minerales (solo los que lleva, en el bolsillo o ya a salvo)
    const mins = MINERALES_ORDEN.map((k, i) => [k, Math.floor((j.minerales?.[i] ?? 0) + (j.mineralesSeguro?.[i] ?? 0))] as const).filter(([, n]) => n > 0);
    this.poner('minerales', mins.map(([k, n]) => `${k}${n}`).join(','), (el) => {
      el.innerHTML = mins.map(([k, n]) => `<span style="--mc:${MINERALES[k].brillo}" title="${MINERALES[k].nombre}">${n}<span class="ico">${glifo(MINERALES[k].glifo)}</span></span>`).join('');
    });
    // Habilidad
    const falta = j.habT > 0 ? Math.min(1, j.habT / Math.max(0.1, j.m.habMax || j.habT)) : 0;
    this.poner('habR', (falta * 100).toFixed(0), (el, x) => el.style.setProperty('--falta', `${x}%`));
    this.texto('habT', j.habT > 0 ? Math.ceil(j.habT) : '');
    this.poner('hab!', j.habT <= 0 ? '1' : '0', (el, x) => el.classList.toggle('preparada', x === '1'));
    // Armas
    const armas = j.armas.map((a) => `${a.id}:${a.nivel}:${a.sobrecargas.length}:${Math.floor((a.xp / xpArma(a.nivel)) * 10)}`).join('|');
    this.poner('armas', armas, (el) => {
      el.innerHTML = j.armas.map((a) => {
        const ocs = a.def.sobrecargas.length ? `<span class="ocs">${[0, 1, 2].map((k) => `<i class="${a.sobrecargas.length > k ? 'si' : ''}"></i>`).join('')}</span>` : '';
        const xp = a.nivel >= NIVEL_MAX_ARMA ? 1 : a.xp / xpArma(a.nivel);
        return `<div class="arma${a.def.evolucion ? ' evo' : ''}" title="${a.def.nombre}"><span class="ico">${icono(a.def.glifo, a.def.id)}</span>${ocs}<b>${a.nivel}</b><span class="xp"><i style="width:${(xp * 100).toFixed(0)}%"></i></span></div>`;
      }).join('');
    });
    // Compañeros
    const comp = est.J.filter((o) => o.i !== this.local);
    const cc = comp.map((o) => `${o.i}:${Math.ceil((o.hp / o.hpMax) * 20)}:${o.estado}`).join('|');
    this.poner('comp', cc, (el) => {
      el.innerHTML = comp.map((o) => `<div class="companero${o.estado === 1 ? ' caido' : ''}"><span>${esc(this.nombre(o.i))}${o.estado === 1 ? ' · caído' : o.estado === 2 ? ' · fuera' : ''}</span><div class="barra"><i style="width:${Math.max(0, (o.hp / o.hpMax) * 100).toFixed(0)}%"></i></div></div>`).join('');
    });
    // Etapa, barra de avance y objetivo
    this.texto('etapa', est.cfg.exp.infinito ? `Etapa ${est.cfg.etapa} · infinito${est.cfg.final ? ' · jefe' : ''}` : `Etapa ${est.cfg.etapa}${est.cfg.final ? ' · jefe' : ''} de ${est.cfg.exp.etapas ?? ETAPAS}`);
    const enJuego = est.fase === 'juego' && !est.sinReloj;
    this.ver('avanceB', enJuego);
    let titulo = '';
    if (enJuego) {
      this.ancho('avance', est.avance);
      // Las marcas de las oleadas (las que ya salieron, apagadas)
      this.poner('marcas', `${est.oleadas.join(',')}|${est.oleadasHechas}`, (el) => {
        el.innerHTML = est.oleadas.map((x, k) => `<i class="${k < est.oleadasHechas ? 'paso' : ''}" style="left:${(x * 100).toFixed(1)}%"></i>`).join('');
      });
      const seps = est.cfg.final ? est.ent.filter((e) => e.vivo && e.tipo === ENT.SEPULCRO) : [];
      if (seps.length) titulo = `Sepulcros ${seps.filter((e) => e.est >= 1).length}/${seps.length}`;
      else if (est.guardian >= 0) titulo = '¡Maten al Guardián!';
      else titulo = est.cfg.final ? 'La noche se acerca al jefe' : 'La noche despierta a su Guardián';
      if (est.impaciencia > 0) titulo += ` · impaciencia ×${est.impaciencia}`;
    }
    this.texto('reloj', titulo);
    this.poner('reloj!', est.impaciencia > 0 && enJuego ? '1' : '0', (el, x) => el.classList.toggle('urgente', x === '1'));
    const o = est.obj;
    const defO = OBJETIVOS[o.tipo];
    let progTxt = `${Math.floor(o.prog)}/${o.meta}`;
    if (o.tipo === 'campana' || o.tipo === 'carreta') progTxt = `${Math.floor(o.prog * 100)} %`;
    if (o.tipo === 'elite') progTxt = o.hecho ? '¡hecho!' : 'cázalo';
    if (o.fallo) progTxt = 'perdido';
    this.html('obj', `<span class="ico">${glifo(defO.glifo)}</span><span>${defO.nombre}</span><span class="obj-barra"><i style="width:${Math.min(100, (o.prog / Math.max(0.0001, o.meta)) * 100).toFixed(0)}%"></i></span><b>${progTxt}</b>`);
    this.poner('obj!', o.hecho && !o.fallo ? '1' : '0', (el, x) => el.classList.toggle('hecho', x === '1'));
    const s = est.sec;
    this.ver('sec', s.meta > 0);
    if (s.meta > 0) this.html('sec', `<span class="ico">${glifo(SECUNDARIOS[s.tipo].glifo)}</span><span>${SECUNDARIOS[s.tipo].nombre}</span><b>${s.prog}/${s.meta}</b>`);
    // Campana de extracción
    const c = est.campana;
    if (c && c.est < 2) {
      this.ver('extra', true);
      const txt = c.est === 0 ? `La campana baja…<big>${Math.ceil(5 - c.t)}</big>` : `¡A la campana!<big>${Math.ceil(Math.max(0, c.cuenta))}</big>`;
      this.html('extra', txt);
      this.poner('extra!', c.est === 1 && c.cuenta < 10 ? '1' : '0', (el, x) => el.classList.toggle('urgente', x === '1'));
    } else this.ver('extra', false);
    // Jefe (o el Guardián de la etapa, con la misma barra)
    const g = est.guardian;
    if (est.jefe >= 0 && est.E.vivo[est.jefe] && esJefe(est.E.tipo[est.jefe])) {
      this.ver('jefe', true);
      const id = TIPOS[est.E.tipo[est.jefe]].id;
      this.texto('jefeN', JEFES[id]?.nombre ?? '');
      this.ancho('jefeV', est.E.hp[est.jefe] / est.E.hpMax[est.jefe]);
      this.ancho('jefeEco', est.E.hp[est.jefe] / est.E.hpMax[est.jefe]);
    } else if (g >= 0 && est.E.vivo[g]) {
      this.ver('jefe', true);
      this.texto('jefeN', `El Guardián · ${TIPOS[est.E.tipo[g]]?.nombre ?? ''}`);
      this.ancho('jefeV', est.E.hp[g] / est.E.hpMax[g]);
      this.ancho('jefeEco', est.E.hp[g] / est.E.hpMax[g]);
    } else this.ver('jefe', false);
    this.capa(dt, est);
  }

  private textoMecanica(j: Jugador): string {
    const m = j.m;
    switch (j.clase) {
      case 'monarca':
        return j.spec === 1 ? `Rey guerrero +${Math.round((m.reyBonus ?? 0) * 100)} %` : `Guardia: ${Math.floor(m.oroRecluta ?? 0)}/${j.spec === 0 ? 20 : 30} de oro`;
      case 'prisionero': {
        const f = Math.round(Math.min(0.75 + 0.25 * j.don('rabia'), (1 - j.hp / j.hpMax) * (1 + 0.25 * j.don('rabia'))) * 100);
        return `Furia +${f} %${j.spec === 0 ? ` · Ovación ${Math.floor(m.ovacion ?? 0)}` : ''}`;
      }
      case 'inquisidor':
        return `Fervor ${m.fervor ?? 0}`;
      case 'verdugo':
        return `Ejecuciones ${m.ejecuciones ?? 0}`;
      case 'juglar':
        return `Canción: ${['Marcha', 'Balada', 'Furia'][m.cancion ?? 0]}`;
      case 'campesino':
        return `Espiga: ${Math.floor(m.almas ?? 0)}/${20 - 5 * j.don('abono')} almas`;
      case 'herrero':
        return `Trampa: ${Math.floor(m.hierroTrampa ?? 0)}/${j.don('chatarra') ? 4 : 6} de hierro`;
      default:
        return '';
    }
  }

  /** Sucesos que el HUD muestra (números, avisos, velo). */
  procesar(suc: Sucesos) {
    const d = suc.d;
    for (let n = 0; n < suc.n; n++) {
      const k = n * 7;
      const t = d[k];
      if (t === S.GOLPE) {
        if (this.numeros.length > 60) this.numeros.shift();
        const crit = d[k + 4] > 0;
        const dueno = d[k + 6];
        this.numeros.push({ x: d[k + 1], y: 1.1, z: d[k + 2], v: d[k + 3], t: 0, crit, color: dueno === this.local ? (crit ? '#ffd040' : '#f0e6d6') : '#a8a098' });
      } else if (t === S.HERIDO && d[k + 1] === this.local) {
        this.golpeVelo = Math.min(0.8, 0.3 + d[k + 2] / 40);
      } else if (t === S.AVISO) {
        const f = AVISOS[d[k + 1]];
        if (f) {
          const [txt, clase] = f(d[k + 2], d[k + 3], this.nombre);
          if (txt) aviso(txt, clase);
        }
      } else if (t === S.JEFE && d[k + 1] === 0) {
        const id = TIPOS[d[k + 4]]?.id;
        const j = id ? JEFES[id] : null;
        if (j) cartelJefe(j.nombre, j.titulo);
      } else if (t === S.JEFE && d[k + 1] === 4 && !this.guardianAnunciado) {
        // (el Guardián se anuncia con su cartel una vez por etapa; los custodios, solo con el aviso)
        this.guardianAnunciado = true;
        cartelJefe(`El Guardián · ${TIPOS[d[k + 4]]?.nombre ?? ''}`, 'Mátenlo y baja la campana');
      } else if (t === S.NIVEL && d[k + 1] === this.local) {
        aviso(`Nivel ${d[k + 2]}`, 'grande', 1100);
      } else if (t === S.EVOLUCION && d[k + 1] === this.local) {
        aviso('¡Evolución!', 'grande');
      }
    }
  }

  /** La capa 2D: números, nombres, flechas. */
  private capa(dt: number, est: EstadoHud) {
    const g = this.g;
    const W = this.lienzo.width, H = this.lienzo.height, r = this.dpr;
    g.clearRect(0, 0, W, H);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const P = this.P;
    // Números de daño
    for (let k = this.numeros.length - 1; k >= 0; k--) {
      const n = this.numeros[k];
      n.t += dt;
      if (n.t > 0.75) {
        this.numeros.splice(k, 1);
        continue;
      }
      this.escena.aPantalla(n.x, n.y + n.t * 1.1, n.z, P);
      if (!P.visible) continue;
      const a = 1 - Math.max(0, n.t - 0.45) / 0.3;
      const pop = n.t < 0.1 ? 1 + (0.1 - n.t) * 4 : 1;
      g.globalAlpha = a;
      g.font = `800 ${Math.round((n.crit ? 17 : 12.5) * pop * r)}px Georgia, serif`;
      g.lineWidth = 3 * r;
      g.strokeStyle = 'rgba(0,0,0,0.85)';
      const txt = n.v >= 1000 ? `${(n.v / 1000).toFixed(1)}k` : String(Math.round(n.v));
      g.strokeText(txt, P.x * r, P.y * r);
      g.fillStyle = n.color;
      g.fillText(txt, P.x * r, P.y * r);
    }
    g.globalAlpha = 1;
    // Compañeros: nombre y vida encima; caídos con el anillo para levantarlos
    for (const o of est.J) {
      if (o.estado !== 0 && o.estado !== 1) continue;
      this.escena.aPantalla(o.x, 1.55, o.y, P);
      if (!P.visible) {
        if (o.i !== this.local) this.flecha(o.x, o.y, o.estado === 1 ? '#ff4a4a' : '#7fd4ff', est);
        continue;
      }
      if (o.i !== this.local) {
        g.font = `700 ${Math.round(11 * r)}px Georgia, serif`;
        g.lineWidth = 3 * r;
        g.strokeStyle = 'rgba(0,0,0,0.9)';
        g.strokeText(this.nombre(o.i), P.x * r, (P.y - 10) * r);
        g.fillStyle = '#e8dfcc';
        g.fillText(this.nombre(o.i), P.x * r, (P.y - 10) * r);
        g.fillStyle = '#000';
        g.fillRect((P.x - 20) * r, (P.y - 2) * r, 40 * r, 4 * r);
        g.fillStyle = '#c8222e';
        g.fillRect((P.x - 20) * r, (P.y - 2) * r, 40 * r * Math.max(0, o.hp / o.hpMax), 4 * r);
      }
      if (o.estado === 1) {
        g.beginPath();
        g.strokeStyle = 'rgba(0,0,0,0.6)';
        g.lineWidth = 5 * r;
        g.arc(P.x * r, (P.y + 18) * r, 14 * r, 0, Math.PI * 2);
        g.stroke();
        g.beginPath();
        g.strokeStyle = '#ffe8a0';
        g.lineWidth = 3 * r;
        g.arc(P.x * r, (P.y + 18) * r, 14 * r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * o.levantar);
        g.stroke();
        g.font = `700 ${Math.round(10 * r)}px Georgia, serif`;
        g.fillStyle = '#ffb0a0';
        g.fillText(`${Math.ceil(o.caidoT)}`, P.x * r, (P.y + 18) * r);
      }
    }
    // Barras de los élites y del marcado
    const E = est.E;
    for (let i = 0; i < E.max; i++) {
      if (!E.vivo[i] || (!E.elite[i] && !E.marcadoObj[i]) || E.marcadoObj[i] === 2 || esJefe(E.tipo[i])) continue;
      this.escena.aPantalla(E.x[i], TIPOS[E.tipo[i]].alto * E.esc[i] + 0.35, E.y[i], P);
      if (!P.visible) {
        continue;
      }
      g.fillStyle = 'rgba(0,0,0,0.75)';
      g.fillRect((P.x - 22) * r, P.y * r, 44 * r, 4 * r);
      g.fillStyle = E.marcadoObj[i] === 1 ? '#ff3030' : '#e0a040';
      g.fillRect((P.x - 22) * r, P.y * r, 44 * r * Math.max(0, E.hp[i] / E.hpMax[i]), 4 * r);
      if (E.escudo[i] > 0) {
        g.fillStyle = '#9ab8ff';
        g.fillRect((P.x - 22) * r, (P.y - 3) * r, 44 * r * Math.min(1, E.escudo[i] / (E.hpMax[i] * 0.5)), 2 * r);
      }
    }
    // Barrita de lo que se está abriendo o liberando (encima de la cosa, además del anillo del piso)
    for (const e of est.ent) {
      if (!e.vivo || e.est !== 0 || e.prog <= 0.01 || !(e.tipo in USO)) continue;
      const u = USO[e.tipo];
      // (encima del dibujo, sin taparlo)
      this.escena.aPantalla(e.x, u.alto, e.y, P);
      if (!P.visible) continue;
      const w = 54, h = 7, x0 = P.x - w / 2, y0 = P.y;
      g.fillStyle = 'rgba(0,0,0,0.78)';
      g.fillRect((x0 - 2) * r, (y0 - 2) * r, (w + 4) * r, (h + 4) * r);
      g.fillStyle = 'rgba(255,255,255,0.08)';
      g.fillRect(x0 * r, y0 * r, w * r, h * r);
      g.fillStyle = u.color;
      g.fillRect(x0 * r, y0 * r, w * r * Math.min(1, e.prog), h * r);
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.fillRect(x0 * r, y0 * r, w * r * Math.min(1, e.prog), 2 * r);
      g.font = `700 ${Math.round(10 * r)}px Georgia, serif`;
      g.lineWidth = 3 * r;
      g.strokeStyle = 'rgba(0,0,0,0.9)';
      g.strokeText(u.texto, P.x * r, (y0 - 9) * r);
      g.fillStyle = '#f2e8d2';
      g.fillText(u.texto, P.x * r, (y0 - 9) * r);
    }
    // Lo único que se señala en el mapa es la Campana de Extracción (lo demás se busca con la visión astral)
    if (est.campana && est.campana.est < 2) this.flecha(est.campana.x, est.campana.y, '#ffd890', est, true);
  }

  /** Una flecha en el borde de la pantalla apuntando a algo que no se ve. */
  private flecha(x: number, y: number, color: string, est: EstadoHud, grande = false, alfa = 1) {
    const P = this.P;
    this.escena.aPantalla(x, 0.5, y, P);
    if (P.visible) return;
    const j = est.J[this.local];
    if (!j) return;
    const g = this.g, r = this.dpr;
    const cx = innerWidth / 2, cy = innerHeight / 2;
    const ang = Math.atan2(y - j.y, x - j.x);
    const m = 34;
    const rx = cx - m, ry = cy - m - 10;
    const c = Math.cos(ang), s = Math.sin(ang);
    const k = Math.min(rx / Math.abs(c || 1e-6), ry / Math.abs(s || 1e-6));
    const px = cx + c * k, py = cy + s * k + 6;
    const tam = grande ? 13 : 9;
    g.save();
    g.globalAlpha = alfa;
    g.translate(px * r, py * r);
    g.rotate(ang);
    g.beginPath();
    g.moveTo(tam * r, 0);
    g.lineTo(-tam * 0.7 * r, tam * 0.7 * r);
    g.lineTo(-tam * 0.35 * r, 0);
    g.lineTo(-tam * 0.7 * r, -tam * 0.7 * r);
    g.closePath();
    g.fillStyle = color;
    g.strokeStyle = 'rgba(0,0,0,0.85)';
    g.lineWidth = 2 * r;
    g.stroke();
    g.fill();
    g.restore();
    if (grande) {
      const dist = Math.round(Math.hypot(x - j.x, y - j.y));
      g.font = `800 ${Math.round(10 * r)}px Georgia, serif`;
      g.fillStyle = color;
      g.fillText(`${dist} m`, (px - c * 22) * r, (py - s * 22) * r);
    }
  }

  liberar() {
    removeEventListener('resize', this.ajustar);
  }
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Un aviso en el centro (se va solo). */
export function aviso(texto: string, clase = '', ms = 2600) {
  const cont = $('avisos');
  const el = document.createElement('div');
  el.className = `aviso ${clase}`;
  el.textContent = texto;
  cont.append(el);
  while (cont.children.length > 3) cont.firstElementChild?.remove();
  setTimeout(() => {
    el.classList.add('sale');
    setTimeout(() => el.remove(), 500);
  }, ms);
}

export function cartelJefe(nombre: string, titulo: string) {
  const el = document.createElement('div');
  el.className = 'cartel-jefe';
  el.innerHTML = `<div><h2>${nombre}</h2><p>${titulo}</p></div>`;
  document.body.append(el);
  setTimeout(() => el.remove(), 3300);
}
