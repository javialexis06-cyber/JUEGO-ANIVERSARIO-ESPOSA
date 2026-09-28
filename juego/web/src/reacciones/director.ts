// El director: traduce lo que pasa en un minijuego a la actuación de los dos muñequitos.
// Quien hace la jugada reacciona a lo suyo y el otro le responde (celos, burla, alivio...), con su frase.
import { otro, type Rol } from '../casa/modelo';
import type { Anclas, Efectos } from './efectos';
import { frase, type Situacion } from './frases';
import type { Muneco } from './muneco';

export type Calidad = 'genial' | 'buena' | 'normal' | 'mala' | 'nula';

/** Lo que puede pasar en cualquier minijuego por turnos (la mesa de juegos manda estos mismos). */
export type Evento =
  | { tipo: 'jugada'; quien: Rol; calidad: Calidad }
  | { tipo: 'captura'; quien: Rol; cuanto: number }
  | { tipo: 'turno_extra'; quien: Rol }
  | { tipo: 'lanzar'; quien: Rol }
  | { tipo: 'suerte'; quien: Rol }
  | { tipo: 'casi'; quien: Rol }
  | { tipo: 'regalo'; quien: Rol };

type Opcion = [coreo: string, situacion?: Situacion];

/** Qué hace cada uno según lo que pase: [quien jugó, el otro]. */
const REACCION: Record<string, [Opcion[], Opcion[]]> = {
  genial: [
    [['salto_confeti', 'presumir'], ['presumir', 'presumir'], ['bailecito', 'presumir'], ['musculo', 'presumir'], ['puno_aire', 'presumir']],
    [['enojo', 'celos'], ['boca_abierta', 'celos'], ['brazos_cruzados', 'celos'], ['aplauso_mala_gana', 'celos'], ['mirada_asesina', 'celos']],
  ],
  buena: [
    [['pulgares', 'bien'], ['puno_aire', 'bien'], ['celebrar', 'bien'], ['presumir', 'bien']],
    [['brazos_cruzados', 'celos'], ['aplauso_mala_gana', 'celos'], ['gotita', 'atras'], ['encogerse', 'celos']],
  ],
  normal: [[['asentir']], []],
  mala: [
    [['puchero', 'mal'], ['rascarse', 'mal'], ['facepalm', 'mal'], ['encogerse', 'mal']],
    [['risita', 'burla'], ['frotarse_manos', 'burla'], ['encogerse_burla', 'burla']],
  ],
  nula: [
    [['triste', 'cero'], ['facepalm', 'cero'], ['puchero', 'cero'], ['llorar', 'cero']],
    [['senalar_reir', 'burla'], ['risita', 'burla'], ['bailecito', 'burla']],
  ],
  captura_chica: [
    [['frotarse_manos', 'captura'], ['risita', 'captura'], ['puno_aire', 'captura']],
    [['boca_abierta', 'capturado'], ['enojo', 'capturado'], ['puchero', 'capturado']],
  ],
  captura_grande: [
    [['salto_confeti', 'captura'], ['senalar_reir', 'captura'], ['bailecito', 'captura']],
    [['llorar', 'capturado'], ['enojo', 'capturado'], ['rodillas', 'capturado'], ['huir', 'huir']],
  ],
  turno_extra: [
    [['pulgares', 'extra'], ['frotarse_manos', 'extra'], ['celebrar', 'extra']],
    [['impaciente', 'extra_otro'], ['brazos_cruzados', 'extra_otro']],
  ],
  lanzar: [[['soplar_lanzar', 'lanzar']], []],
  suerte: [[['cruzar_dedos', 'suerte']], [['cruzar_dedos', 'suerte_otro'], ['frotarse_manos', 'suerte_otro']]],
  casi: [
    [['rascarse', 'casi'], ['facepalm', 'casi'], ['puchero', 'casi']],
    [['alivio', 'alivio']],
  ],
  regalo: [
    [['gotita', 'regalo'], ['facepalm', 'regalo']],
    [['frotarse_manos', 'regalado'], ['risita', 'regalado']],
  ],
  adelante: [
    [['presumir', 'adelante'], ['musculo', 'adelante'], ['pulgares', 'adelante']],
    [['gotita', 'atras'], ['mirada_asesina', 'atras'], ['huir', 'huir']],
  ],
};

/** Cada cuánto habla (no todo el tiempo: aburre). */
const HABLAR: Partial<Record<Situacion, number>> = { ganar: 1, perder: 1, empate: 1, otra: 1, beso: 0.8, sonrojo: 0.7, inicio: 0.9 };

export class Director {
  private situacion = new Map<Rol, Situacion>();
  private ultima = new Map<Rol, string>();
  private turnoDe: Rol | null = null;
  private tTurno = 0;
  private tImpaciente = 0;
  private humanoEnTurno = false;
  private rapido: number;

  constructor(
    private m: Record<Rol, Muneco>,
    private efectos: Efectos,
    private anclas: Record<Rol, Anclas>,
    rapido = 1,
  ) {
    this.rapido = rapido;
    for (const rol of ['el', 'ella'] as Rol[]) {
      m[rol].otro = m[otro(rol)];
      m[rol].alEfecto = (fx) => efectos.lanzar(fx, anclas[rol], anclas[otro(rol)]);
      m[rol].alHablar = () => this.hablar(rol);
    }
  }

  private hablar(rol: Rol) {
    const s = this.situacion.get(rol);
    if (!s) return;
    this.situacion.delete(rol);
    if (Math.random() > (HABLAR[s] ?? 0.55)) return;
    this.efectos.globo(frase(s, rol), this.anclas[rol], 2.1 / this.rapido);
  }

  /** Actúa una coreografía con su situación (para la frase). */
  hacer(rol: Rol, coreo: string, s?: Situacion, demora = 0): Promise<void> {
    if (s) this.situacion.set(rol, s);
    this.ultima.set(rol, coreo);
    return this.m[rol].actuar(coreo, demora / this.rapido);
  }

  private elegir(rol: Rol, opciones: Opcion[]): Opcion | null {
    if (!opciones.length) return null;
    const libres = opciones.filter(([c]) => c !== this.ultima.get(rol));
    const lista = libres.length ? libres : opciones;
    return lista[Math.floor(Math.random() * lista.length)];
  }

  private par(clave: string, quien: Rol) {
    const [mias, suyas] = REACCION[clave];
    const a = this.elegir(quien, mias);
    const b = this.elegir(otro(quien), suyas);
    if (a) void this.hacer(quien, a[0], a[1]);
    // El otro reacciona un instante después (se da cuenta)
    if (b) void this.hacer(otro(quien), b[0], b[1], 0.3 + Math.random() * 0.25);
  }

  evento(e: Evento) {
    this.tImpaciente = 0;
    switch (e.tipo) {
      case 'jugada':
        this.par(e.calidad, e.quien);
        break;
      case 'captura':
        this.par(e.cuanto >= 6 ? 'captura_grande' : 'captura_chica', e.quien);
        break;
      default:
        this.par(e.tipo, e.quien);
    }
  }

  /** Cambió el turno: quien juega se concentra; el otro mira. */
  turno(t: Rol, humanoAqui: boolean) {
    this.turnoDe = t;
    this.tTurno = 0;
    this.tImpaciente = 0;
    this.humanoEnTurno = humanoAqui;
    this.m[t].esperar(humanoAqui ? 'turno' : 'pensando');
    this.m[otro(t)].esperar('nada');
  }

  /** La IA (o el otro celular) está pensando. */
  pensar(t: Rol, si: boolean) {
    this.m[t].esperar(si ? 'pensando' : 'nada');
    // A veces se le prende el bombillo al decidir
    if (!si && Math.random() < 0.2) void this.hacer(t, 'idea');
    if (si && Math.random() < 0.3) {
      this.situacion.set(t, 'pensar');
      this.hablar(t);
    }
  }

  adelante(t: Rol) {
    // Solo si ninguno está en medio de algo más importante
    if (this.m[t].actuando || this.m[otro(t)].actuando) return;
    this.par('adelante', t);
  }

  /** Cada cuadro: si el humano se demora mucho, el otro se impacienta. */
  cuadro(dt: number) {
    if (!this.turnoDe || !this.humanoEnTurno) return;
    this.tTurno += dt;
    this.tImpaciente += dt;
    const esperando = otro(this.turnoDe);
    if (this.tImpaciente > 13 && !this.m[esperando].actuando) {
      this.tImpaciente = 0;
      void this.hacer(esperando, Math.random() < 0.6 ? 'impaciente' : 'bostezo', 'impaciente');
    }
  }

  async inicio(empieza: Rol) {
    const o = otro(empieza);
    void this.hacer(o, 'saludo', 'inicio');
    await this.hacer(empieza, 'frotarse_manos', 'inicio', 0.35);
  }

  /** Final de la partida: el que gana celebra en grande y el que pierde hace su drama (y pide la revancha). */
  async final(ganador: Rol | null): Promise<void> {
    this.turnoDe = null;
    for (const r of ['el', 'ella'] as Rol[]) this.m[r].esperar('nada');
    if (!ganador) {
      await Promise.all([this.hacer('el', 'chocar_cinco', 'empate'), this.hacer('ella', 'chocar_cinco', 'empate')]);
      void this.hacer('el', 'abrazo');
      void this.hacer('ella', 'abrazo', 'empate');
      return;
    }
    const p = otro(ganador);
    const drama = ['llorar', 'rodillas', 'bandera_blanca', 'desmayo'][Math.floor(Math.random() * 4)];
    const fiesta = this.hacer(ganador, 'trofeo', 'ganar');
    const lloro = this.hacer(p, drama, 'perder', 0.4);
    await fiesta;
    // Lo que sigue pasa con la tarjeta del final ya en pantalla
    void this.hacer(ganador, Math.random() < 0.5 ? 'corona' : 'baile_final', 'ganar').then(() => this.hacer(ganador, 'beso_volado', 'beso'));
    void lloro.then(() => this.hacer(p, 'otra', 'otra'));
  }

  limpiar() {
    this.turnoDe = null;
    this.situacion.clear();
    for (const r of ['el', 'ella'] as Rol[]) {
      this.m[r].esperar('nada');
      this.m[r].calmar();
    }
    this.efectos.limpiar();
  }
}
