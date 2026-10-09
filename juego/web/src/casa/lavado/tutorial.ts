// El tutorial de «Lavarse la cara»: la primera vez (y cuando se quiera, desde «Cómo se juega» en el menú) se juega
// una partidita guiada, corta y tranquila (nadie se cae, no llegan oleadas): moverse, las armas que disparan solas,
// recoger gotitas, subir de nivel, los cofres, la evolución de un arma y apuntar a mano. Cada paso espera a que se
// haga de verdad (no basta con leer) y siempre se puede saltar.
import { ARMAS, maxNivelArma, pasivasDeEvo } from './armas';
import type { Jugador, Motor } from './motor';
import { sfx } from './sonidos';
import type { IdArma } from './tipos';

interface Paso {
  titulo: string;
  texto: (t: Tutorial) => string;
  /** Lo que se prepara al entrar al paso (mugrosos, cofres…). */
  entrar?: (t: Tutorial, m: Motor, j: Jugador) => void;
  /** ¿Ya lo hizo? */
  listo: (t: Tutorial, m: Motor, j: Jugador) => boolean;
  /** Dónde va el globo: arriba (jugando) o a un lado (cuando hay una capa encima). */
  lado?: boolean;
  /** Qué manito se muestra: arrastrar para caminar o el segundo dedo para apuntar. */
  mano?: 'mover' | 'apuntar';
}

const PASOS: Paso[] = [
  {
    titulo: '¡A caminar!',
    texto: (t) => (t.tactil ? 'Arrastra el dedo en cualquier parte de la pantalla para caminar por tu carita.' : 'Camina con W A S D o con las flechas (o arrastrando el mouse).'),
    mano: 'mover',
    entrar: (t, _m, j) => t.marcar(j),
    listo: (t, _m, j) => t.recorrido(j) > 300,
  },
  {
    titulo: 'Tus armas disparan solitas',
    texto: () => 'Llegan los gérmenes… no hagas nada: tu arma les pega sola. Solo muévete para que no te toquen.',
    entrar: (t, m, j) => {
      t.bajas = m.eliminados;
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        m.crear('germen', [j.x + Math.cos(a) * 230, j.y + Math.sin(a) * 150], j, { fijo: true });
      }
    },
    listo: (t, m) => m.eliminados - t.bajas >= 6,
  },
  {
    titulo: 'Recoge las gotitas',
    texto: () => 'Cada mugroso suelta una gotita de experiencia. Pásales por encima: cuando se llena la barra de arriba, ¡subes de nivel!',
    entrar: (_t, m, j) => {
      // (por si alguna se perdió: unas cuantas de más alrededor)
      for (let k = 0; k < 5; k++) m.gema(j.x + 90 + k * 26, j.y + (k % 2 ? 30 : -30), 1);
    },
    listo: (_t, m, j) => m.nivel >= 2 || !!j.opciones,
  },
  {
    titulo: '¡Subiste de nivel!',
    texto: () => 'Escoge una mejora: un arma nueva, subirle el nivel a una que ya tienes o una pasiva que te ayuda en todo.',
    lado: true,
    // (puede que ya la haya escogido antes de que saliera este globo: basta con haber subido y ya no tener cartas)
    listo: (_t, m, j) => m.nivel >= 2 && !j.opciones && !j.nivelesPend,
  },
  {
    titulo: 'Los cofres',
    texto: () => 'Los mugrosos que brillan dorado son élites: aguantan más y sueltan un cofre con premios. ¡Revienta a ese y recoge el cofre!',
    entrar: (t, m, j) => {
      t.vioCofre = false;
      const e = m.crear('germen', [j.x + 240, j.y - 40], j, { elite: true, cofre: 1, fijo: true });
      if (e) e.hp = e.hpMax = 30;
    },
    listo: (t, m, j) => {
      if (j.cofre) t.vioCofre = true;
      return t.vioCofre && !j.cofre && !m.objs.some((o) => o.vivo && o.tipo === 'cofre');
    },
    lado: true,
  },
  {
    titulo: 'La evolución',
    texto: (t) =>
      `Cuando un arma llega a su nivel máximo y tienes su pasiva pareja, el siguiente cofre la EVOLUCIONA en algo mucho más fuerte. Ya te dejamos ${t.armaEvo} al máximo con su pasiva: ¡abre ese cofre!`,
    entrar: (t, m, j) => {
      t.vioCofre = false;
      // Un arma que evolucione con una pasiva (la del disfraz si se puede; si no, la varita de burbujas)
      let a = j.armas.find((x) => ARMAS[x.id].evo?.pasiva && !ARMAS[x.id].evo?.arma && !ARMAS[x.id].de);
      if (!a) {
        m.darArma(j, 'burbujas');
        a = j.armas.find((x) => x.id === 'burbujas');
      }
      if (!a) return;
      const id: IdArma = a.id;
      while ((j.armas.find((x) => x.id === id)?.nivel ?? 99) < maxNivelArma(id)) m.darArma(j, id);
      for (const pasiva of pasivasDeEvo(ARMAS[id])) if (!j.pasivas.has(pasiva)) m.darPasiva(j, pasiva);
      m.recalcular(j);
      t.armaEvo = ARMAS[id].nombre;
      m.soltar('cofre', j.x + 70, j.y + 10, 2);
    },
    listo: (t, m, j) => {
      if (j.cofre) t.vioCofre = true;
      return t.vioCofre && !j.cofre && !m.objs.some((o) => o.vivo && o.tipo === 'cofre');
    },
    lado: true,
  },
  {
    titulo: 'Apuntar a mano',
    texto: (t) =>
      !t.puedeApuntar
        ? 'Tu disfraz es de área: sus armas pegan solitas alrededor. Con los otros disfraces puedes apuntar tú mismo (🎯 Ataque en el menú).'
        : t.tactil
          ? 'Si quieres apuntar tú: con el ataque «a mano», camina con un dedo en la mitad izquierda y apunta con otro dedo en la mitad derecha. ¡Tumba esos tres!'
          : 'Si quieres apuntar tú: con el ataque «a mano», las armas disparan hacia el mouse. ¡Tumba esos tres!',
    mano: 'apuntar',
    entrar: (t, m, j) => {
      t.bajas = m.eliminados;
      t.tPaso = 0;
      if (!t.puedeApuntar) return;
      j.manual = true;
      for (let k = 0; k < 3; k++) {
        const e = m.crear('germen', [j.x - 250, j.y - 70 + k * 70], j, { fijo: true });
        if (e) e.hp = e.hpMax = 6;
      }
    },
    listo: (t, m) => (t.puedeApuntar ? m.eliminados - t.bajas >= 3 || t.tPaso > 25 : t.tPaso > 7),
  },
  {
    titulo: '¡Listo para lavarte!',
    texto: () => 'En la partida de verdad llegan más mugrosos cada minuto, élites, jefes cada 5 minutos… Aguanta todo lo que puedas. ¡Suerte!',
    listo: () => false,
  },
];

export class Tutorial {
  paso = -1;
  bajas = 0;
  tPaso = 0;
  vioNivel = false;
  vioCofre = false;
  armaEvo = '';
  private x0 = 0;
  private y0 = 0;
  private andado = 0;
  private el: HTMLElement;
  private acabado = false;

  constructor(
    raiz: HTMLElement,
    readonly tactil: boolean,
    readonly puedeApuntar: boolean,
    private manualAntes: boolean,
    /** Cómo terminó: jugar ya («¡A lavarse!»), saltado a la mitad o de vuelta al menú (al final). */
    private alTerminar: (como: 'jugar' | 'saltar' | 'menu') => void,
  ) {
    this.el = document.createElement('div');
    this.el.className = 'lv-tuto';
    this.el.innerHTML = `<div class="lv-tuto-globo"><span class="lv-tuto-ico">🧼</span><div class="lv-tuto-texto"><b></b><p></p><span class="lv-tuto-pasos">${PASOS.map(() => '<i></i>').join('')}</span></div>
      <div class="lv-tuto-botones"><button class="lv-boton rosa" data-t="jugar" hidden>🫧 ¡A lavarse!</button><button class="lv-boton" data-t="saltar">Saltar</button></div></div>
      <div class="lv-tuto-mano" aria-hidden="true">👆</div>`;
    raiz.append(this.el);
    this.el.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-t]');
      if (!b) return;
      e.stopPropagation();
      sfx.toque();
      this.terminar(b.dataset.t as 'jugar' | 'saltar' | 'menu');
    });
  }

  marcar(j: Jugador) {
    this.x0 = j.x;
    this.y0 = j.y;
    this.andado = 0;
  }
  recorrido(j: Jugador) {
    this.andado += Math.hypot(j.x - this.x0, j.y - this.y0);
    this.x0 = j.x;
    this.y0 = j.y;
    return this.andado;
  }

  /** Cada cuadro (en el celular de quien juega el tutorial, que siempre es solo). */
  actualizar(m: Motor, dt: number) {
    if (this.acabado) return;
    const j = m.jug[0];
    this.tPaso += dt;
    if (this.paso < 0) {
      // Un respiro antes del primer paso (que se vea la cara)
      if (this.tPaso < 1.2) return;
      this.ir(0, m, j);
      return;
    }
    const p = PASOS[this.paso];
    if (p.listo(this, m, j) && this.tPaso > 1.2) {
      sfx.premio();
      if (this.paso === PASOS.findIndex((x) => x.mano === 'apuntar')) j.manual = this.manualAntes;
      this.ir(this.paso + 1, m, j);
    }
  }

  private ir(k: number, m: Motor, j: Jugador) {
    this.paso = Math.min(k, PASOS.length - 1);
    this.tPaso = 0;
    const p = PASOS[this.paso];
    p.entrar?.(this, m, j);
    this.el.querySelector('b')!.textContent = p.titulo;
    this.el.querySelector('p')!.textContent = p.texto(this);
    this.el.classList.toggle('lado', !!p.lado);
    this.el.dataset.mano = p.mano && (p.mano !== 'apuntar' || (this.puedeApuntar && this.tactil)) ? p.mano : '';
    this.el.querySelectorAll('.lv-tuto-pasos i').forEach((x, q) => x.classList.toggle('si', q <= this.paso));
    const ultimo = this.paso === PASOS.length - 1;
    this.el.querySelector<HTMLElement>('[data-t="jugar"]')!.hidden = !ultimo;
    const salir = this.el.querySelector<HTMLElement>('[data-t="saltar"], [data-t="menu"]')!;
    salir.textContent = ultimo ? 'Al menú' : 'Saltar';
    salir.dataset.t = ultimo ? 'menu' : 'saltar';
    this.el.classList.remove('entra');
    void this.el.offsetWidth;
    this.el.classList.add('entra');
  }

  terminar(como: 'jugar' | 'saltar' | 'menu') {
    if (this.acabado) return;
    this.acabado = true;
    this.el.remove();
    this.alTerminar(como);
  }

  quitar() {
    this.acabado = true;
    this.el.remove();
  }

  /** Para las pruebas. */
  get titulo() {
    return this.paso >= 0 ? PASOS[this.paso].titulo : '';
  }
}

export const PASOS_TUTORIAL = PASOS.length;
