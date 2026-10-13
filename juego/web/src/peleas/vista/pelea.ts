// Cómo se ve una pelea: los dos muñecos, los efectos, la cámara y la interfaz, a partir del estado de la pelea (la
// simulación en este aparato o el espejo de lo que manda el anfitrión en línea). Cada evento nuevo (golpe, anuncio,
// frase, súper…) suena y se ve una sola vez.
import * as THREE from 'three';
import type { AspectoJugador } from '../../salas/tipos';
import { PRESENTADOR } from '../presentador';
import type { Evento, Fase, Proyectil } from '../sim';
import * as son from '../sonidos';
import type { DefLuchador, Frase } from '../tipos';
import type { Hud } from '../ui/hud';
import { Efectos } from './efectos';
import type { EscenaPelea } from './escena';
import { Muneco, type PeleadorVista } from './muneco';

export interface EstadoVista {
  L: PeleadorVista[];
  P: Proyectil[];
  fase: Fase;
  faseT: number;
  ronda: number;
  reloj: number;
  lento: number;
  pausaSuper: number;
  superDe: number;
  pasos: number;
  paraGanar: number;
  practica: boolean;
  borde: number;
  eventosDesde(n: number): Evento[];
}

export class VistaPelea {
  munecos: Muneco[] = [];
  efectos = new Efectos();
  private visto = 0;
  private cabezas = [new THREE.Vector3(), new THREE.Vector3()];
  private manos = [new THREE.Vector3(), new THREE.Vector3()];
  private emocion = 0;
  caras: string[] = ['', ''];

  constructor(private escena: EscenaPelea, private hud: Hud, public defs: [DefLuchador, DefLuchador], private aspectos: (AspectoJugador | undefined)[], public nombres: string[]) {}

  async cargar() {
    const [a, b] = this.defs;
    this.munecos = [new Muneco(a, this.aspectos[0]), new Muneco(b, this.aspectos[1])];
    if (a.id === b.id) this.munecos[1].alterno = true;
    await Promise.all([this.munecos.map((m) => m.cargar()), this.efectos.cargarKit()].flat());
    for (const m of this.munecos) this.escena.capa.add(m.raiz);
    this.escena.capa.add(this.efectos.grupo);
    this.hud.luchadores(this.defs, this.nombres);
  }

  /** Desde qué evento mirar (al empezar o al conectarse a mitad de pelea). */
  saltarEventos(n: number) {
    this.visto = n;
  }

  cuadro(dt: number, e: EstadoVista) {
    e.L.forEach((f, i) => {
      this.munecos[i]?.actualizar(dt, f, e.pasos);
      this.munecos[i]?.cabeza(this.cabezas[i]);
      this.manos[i].set(f.x + f.lado * 0.45, f.y + 1.15, 0);
    });
    for (const ev of e.eventosDesde(this.visto)) {
      this.visto = Math.max(this.visto, ev.n);
      this.evento(ev, e);
    }
    this.efectos.actualizar(dt, e as never, this.cabezas, this.manos);
    // Cámara
    const [a, b] = e.L;
    let cerca: THREE.Vector3 | null = null;
    if (e.pausaSuper > 0 && e.superDe >= 0) cerca = new THREE.Vector3(e.L[e.superDe].x, e.L[e.superDe].y, 0);
    else if (e.fase === 'ko' && e.lento > 0) {
      const caido = e.L.find((p) => p.ko);
      if (caido) cerca = new THREE.Vector3(caido.x, caido.y * 0.5, 0);
    } else if (e.fase === 'presentacion') {
      const q = e.faseT < 75 ? 0 : 1;
      cerca = new THREE.Vector3(e.L[q].x, 0, 0);
    } else if ((e.fase === 'finRonda' && e.faseT > 30) || e.fase === 'fin') {
      const w = e.L.find((p) => p.estado === 'victoria');
      if (w) cerca = new THREE.Vector3(w.x, 0, 0);
    }
    this.escena.camaraPelea(dt, new THREE.Vector3(a.x, a.y, 0), new THREE.Vector3(b.x, b.y, 0), { cerca, borde: e.borde });
    this.emocion = Math.max(0, this.emocion - dt * 0.4);
    this.escena.animar(dt, Math.min(1, this.emocion));
    this.hud.actualizar(dt, e.L, e.practica ? 99 : Math.max(0, Math.ceil(e.reloj / 60)), e.L.map((p) => p.rondas), e.paraGanar);
  }

  private frase(i: number, que: 'entrada' | 'especial' | 'super' | 'victoria' | 'derrota', n: number) {
    const d = this.defs[i];
    let lista: Frase[] = d.frases[que];
    if (que === 'entrada') {
      const especial = d.frases.contra?.[this.defs[1 - i].id];
      if (especial) lista = [especial];
    }
    if (!lista.length) return;
    const f = lista[n % lista.length];
    void son.decir(f.id, que === 'super' || que === 'victoria' || que === 'derrota');
    if (que !== 'especial') this.hud.subtitulo(this.nombres[i], f.t, d.color, que === 'super' ? 1.4 : 2.6);
  }

  private presentador(f: Frase, cortar = true) {
    void son.decir(f.id, cortar);
  }

  private evento(ev: Evento, e: EstadoVista) {
    switch (ev.k) {
      case 'golpe': {
        this.efectos.golpe(ev.x, ev.y, ev.fuerza, ev.tapado, ev.efecto);
        son.golpe(ev.fuerza, ev.tapado);
        if (!ev.tapado) {
          this.escena.sacudir(ev.fuerza >= 3 ? 0.9 : ev.fuerza === 2 ? 0.5 : 0.25);
          this.emocion += ev.fuerza * 0.12;
          const v = e.L[ev.quien];
          this.hud.combo(ev.quien, ev.combo, v.comboDano);
          if (ev.combo === 6) this.presentador(PRESENTADOR.combo, false);
        }
        break;
      }
      case 'anuncio':
        this.anuncio(ev, e);
        break;
      case 'frase':
        this.frase(ev.quien, ev.que, ev.n);
        break;
      case 'super': {
        const i = ev.quien;
        son.superSonido();
        this.hud.corteSuper(i, this.nombres[i], this.defs[i].golpes.super.nombre ?? 'Súper', this.defs[i].color, this.caras[i]);
        this.hud.destello(this.defs[i].color, 0.45);
        this.escena.sacudir(0.4);
        this.emocion += 0.6;
        break;
      }
      case 'especial':
        this.efectos.chispaSola(e.L[ev.quien].x, 1.2, this.defs[ev.quien].color, 10, 3);
        break;
      case 'salto':
        son.salto();
        this.efectos.polvo(ev.x);
        break;
      case 'aterrizo':
        this.efectos.polvo(ev.x);
        break;
      case 'tumbado':
        this.efectos.polvo(ev.x, true);
        son.caida();
        this.escena.sacudir(0.6);
        break;
      case 'mareo':
        void son.efecto('sacudir', 0.7);
        break;
      case 'escape':
        this.efectos.nube(ev.x, ev.y, '#ffffff', 4, 0.6);
        void son.efecto('pop', 0.7);
        this.hud.anunciar('¡Se zafó!', 'chico', 0.8);
        break;
      case 'contra':
        this.efectos.chispaSola(ev.x, ev.y, '#c9a8ff', 24, 6);
        this.hud.destello('#c9b2ff', 0.35);
        void son.efecto('tin', 0.9);
        this.hud.anunciar('¡Contra!', 'chico', 0.8);
        break;
      case 'niebla':
        this.efectos.nube(ev.x, ev.y, '#5a2a6a', 8, 1);
        void son.efecto('soplo', 0.6);
        break;
      case 'pared':
        this.escena.sacudir(0.8);
        this.efectos.golpe(ev.x, ev.y, 2, false, 'tierra');
        son.caida();
        break;
      case 'choque':
        this.efectos.chispaSola(ev.x, ev.y, '#ffffff', 18, 5);
        void son.efecto('pop', 0.8);
        break;
      case 'estalla':
        this.efectos.chispaSola(ev.x, ev.y, '#ffffff', 10, 3);
        if (ev.efecto === 'porcelana') void son.efecto('plaf', 0.7, 1.3);
        break;
      case 'agarre':
        void son.efecto('abrazo', 0.6, 1.2);
        break;
      case 'whoosh':
        son.whoosh();
        break;
    }
  }

  private anuncio(ev: Extract<Evento, { k: 'anuncio' }>, e: EstadoVista) {
    switch (ev.que) {
      case 'presentacion':
        this.hud.anunciar(`<span style="color:${this.defs[0].color}">${esc(this.nombres[0])}</span><em>VS</em><span style="color:${this.defs[1].color}">${esc(this.nombres[1])}</span>`, 'vs', 2.4);
        break;
      case 'ronda': {
        const final = ev.ronda === 0;
        this.hud.reiniciar();
        this.hud.anunciar(final ? 'Ronda final' : `Ronda ${ev.ronda}`, 'ronda', 1.15);
        this.presentador(final ? PRESENTADOR.final : ev.ronda === 1 ? PRESENTADOR.ronda1 : ev.ronda === 2 ? PRESENTADOR.ronda2 : PRESENTADOR.ronda3);
        this.efectos.limpiar();
        break;
      }
      case 'pelea':
        this.hud.anunciar('¡A pelear!', 'pelea', 0.9);
        this.presentador(PRESENTADOR.pelea);
        son.campana();
        break;
      case 'ko':
        this.hud.anunciar('K.O.', 'ko', 2);
        this.hud.destello('#ffffff', 0.85);
        this.presentador(PRESENTADOR.ko);
        son.ko();
        this.escena.sacudir(1);
        this.emocion = 1.5;
        setTimeout(() => son.aplausos(), 700);
        break;
      case 'tiempo':
        this.hud.anunciar('¡Tiempo!', 'ko', 1.6);
        this.presentador(PRESENTADOR.tiempo);
        break;
      case 'empate':
        this.hud.anunciar('Empate', 'ronda', 1.6);
        this.presentador(PRESENTADOR.empate);
        break;
      case 'doble':
        this.hud.anunciar('Doble K.O.', 'ko', 1.8);
        this.presentador(PRESENTADOR.doble);
        break;
      case 'perfecto':
        setTimeout(() => {
          this.hud.anunciar('¡Perfecto!', 'pelea', 1.4);
          this.presentador(PRESENTADOR.perfecto);
        }, 900);
        break;
      case 'gana': {
        const i = ev.quien ?? 0;
        setTimeout(() => {
          this.hud.anunciar(`¡Gana ${esc(this.nombres[i])}!`, 'gana', 2.2);
          const g = this.defs[i].frases.gana;
          if (g) this.presentador(g, false);
        }, 1600);
        break;
      }
    }
    void e;
  }

  liberar() {
    for (const m of this.munecos) m.liberar();
    this.efectos.limpiar();
    this.efectos.grupo.removeFromParent();
  }
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
