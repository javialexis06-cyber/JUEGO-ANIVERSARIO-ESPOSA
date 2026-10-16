// La pelea en línea, por sala (src/salas/): dos jugadores, cada uno en su celular, con un código corto. El anfitrión
// (quien creó la sala) simula la pelea y le manda al otro una «foto» cada 50 ms (posiciones, estados, vida, barra,
// proyectiles y los eventos para que suenen y se vean una sola vez); el invitado manda lo que aprieta (9 bits) y ve
// la pelea como un espejo suavizado. Si alguien se corta, la pelea se queda quieta con aviso hasta que vuelva.
// Con un amigo en la sala todo pasa a modo neutro (sin Javier ni Laura como luchadores: cada uno es su muñeco).
import { esperarEnSala } from '../salas/espera';
import type { AspectoJugador, JugadorSala, Sala } from '../salas/tipos';
import { retador } from './luchadores';
import type { Evento, Fase, Peleador, Proyectil, Sim, TipoProy, Estado } from './sim';
import { desempacar, empacar, NADA, type DefLuchador, type Efecto, type Entrada, type IdEscenario, type IdGolpe } from './tipos';
import { ESCENARIOS } from './vista/escena';
import type { EstadoVista } from './vista/pelea';
import type { ConfigPelea, Resultado } from './main';

const ESTADOS: Estado[] = ['entrada', 'quieto', 'caminar', 'agachado', 'saltoPre', 'aire', 'aterrizaje', 'ataque', 'golpeado', 'bloqueo', 'volando', 'suelo', 'levantarse', 'agarrando', 'agarrado', 'mareado', 'ko', 'victoria', 'derrota', 'rafaga', 'contraataque'];
const FASES: Fase[] = ['presentacion', 'cuenta', 'pelea', 'ko', 'tiempo', 'finRonda', 'fin'];
const TIPOS: TipoProy[] = ['bala', 'trampa', 'rayo', 'lluvia', 'caida', 'ola'];
const EFECTOS: Efecto[] = ['normal', 'fuego', 'luz', 'hielo', 'sombra', 'corazon', 'lirio', 'estrella', 'porcelana', 'tierra'];

/** Lo que la pelea necesita de la red. */
export interface Linea {
  /** (anfitrión) Lo último que apretó el invitado. */
  entrada(): Entrada;
  /** (anfitrión) Manda la foto de la pelea (cada 50 ms). */
  mandarFoto(sim: Sim): void;
  /** (invitado) Manda lo que aprieta. */
  mandarEntrada(e: Entrada): void;
  /** (invitado) La pelea que llega del anfitrión. */
  espejo(defs: [DefLuchador, DefLuchador]): Espejo;
  /** El otro está cortado (la pelea espera). */
  cortado(): boolean;
  alFin(fn: () => void): void;
}

interface Foto {
  f: number;
  ft: number;
  r: number;
  rl: number;
  le: number;
  ps: number;
  sd: number;
  pa: number;
  g: number;
  pg: number;
  L: (number | string)[][];
  P: number[][];
  E: Evento[];
}

export function fotoDe(sim: Sim, desde: number): Foto {
  const r2 = (v: number) => Math.round(v * 100) / 100;
  return {
    f: FASES.indexOf(sim.fase), ft: sim.faseT, r: sim.ronda, rl: sim.reloj, le: sim.lento, ps: sim.pausaSuper, sd: sim.superDe, pa: sim.pasos, g: sim.ganador, pg: sim.paraGanar,
    L: sim.L.map((p) => [r2(p.x), r2(p.y), r2(p.vx), r2(p.vy), p.lado, ESTADOS.indexOf(p.estado), p.t, p.dur, p.golpe?.id ?? '', Math.round(p.vida), Math.round(p.barra), p.combo,
      p.ultimoGolpe, p.ko ? 1 : 0, empacar(p.entrada), p.suelo ? 1 : 0, p.rondas, Math.round(p.comboDano)]),
    P: sim.P.map((x) => [x.id, x.dueno, TIPOS.indexOf(x.tipo), r2(x.x), r2(x.y), r2(x.vx), r2(x.vy), x.lado, x.t, x.vida, EFECTOS.indexOf(x.efecto)]),
    E: sim.eventosDesde(desde).slice(-24),
  };
}

/** La pelea del invitado: lo que manda el anfitrión, suavizado entre foto y foto. */
export class Espejo implements EstadoVista {
  L: Peleador[];
  P: Proyectil[] = [];
  fase: Fase = 'presentacion';
  faseT = 0;
  ronda = 1;
  reloj = 3600;
  lento = 0;
  pausaSuper = 0;
  superDe = -1;
  pasos = 0;
  paraGanar = 2;
  practica = false;
  borde = 8;
  ganador = -1;
  private eventos: Evento[] = [];
  private metas: { x: number; y: number }[] = [{ x: -2.1, y: 0 }, { x: 2.1, y: 0 }];
  private desdeFoto = 0;
  ultimoEvento = 0;

  constructor(private defs: [DefLuchador, DefLuchador]) {
    this.L = defs.map((def, i) => ({
      i, def, x: i ? 2.1 : -2.1, y: 0, vx: 0, vy: 0, lado: i ? -1 : 1, suelo: true, vida: def.vida, barra: 0, aturd: 0, sinGolpe: 0, estado: 'entrada', t: 0, dur: 0, golpe: null,
      pego: false, veces: 0, combo: 0, invul: 0, saltos: 0, armadura: 0, caeTumbado: false, agarre: -1, mareoPendiente: false, rondas: 0, entrada: { ...NADA }, previo: { ...NADA },
      buffer: { a: 0, b: 0, e: 0, g: 0, s: 0 }, ganoRonda: false, ultimoGolpe: -99, comboDano: 0, ko: false,
    })) as Peleador[];
  }

  recibir(f: Foto) {
    if (f.pa < this.pasos) return;
    this.fase = FASES[f.f] ?? 'pelea';
    this.faseT = f.ft;
    this.ronda = f.r;
    this.reloj = f.rl;
    this.lento = f.le;
    this.pausaSuper = f.ps;
    this.superDe = f.sd;
    this.pasos = f.pa;
    this.ganador = f.g;
    this.paraGanar = f.pg;
    f.L.forEach((a, i) => {
      const p = this.L[i];
      if (!p) return;
      const [x, y, vx, vy, lado, est, t, dur, golpe, vida, barra, combo, ultimo, ko, ent, suelo, rondas, comboDano] = a as number[];
      this.metas[i] = { x, y };
      // Si quedó muy lejos (cambio de ronda), salta de una
      if (Math.abs(p.x - x) > 2) {
        p.x = x;
        p.y = y;
      }
      Object.assign(p, { vx, vy, lado, estado: ESTADOS[est] ?? 'quieto', t, dur, golpe: golpe ? p.def.golpes[golpe as unknown as IdGolpe] ?? null : null, vida, barra, combo, ultimoGolpe: ultimo, ko: !!ko,
        entrada: desempacar(ent), suelo: !!suelo, rondas, comboDano });
    });
    const viejos = new Map(this.P.map((x) => [x.id, x]));
    this.P = f.P.map(([id, dueno, tipo, x, y, vx, vy, lado, t, vida, efecto]) => {
      const v = viejos.get(id);
      const g = this.L[dueno]?.def.golpes[(TIPOS[tipo] === 'bala' || TIPOS[tipo] === 'trampa') ? 'especial' : 'super'];
      return { id, dueno, tipo: TIPOS[tipo], x: v && Math.abs(v.x - x) < 1 ? v.x : x, y: v && Math.abs(v.y - y) < 1 ? v.y : y, vx, vy, lado, t, vida, g: g!, r: 0.3, alto: 1, golpes: 1, cada: 0, efecto: EFECTOS[efecto] ?? 'normal' };
    });
    for (const e of f.E) {
      if (e.n > this.ultimoEvento) {
        this.eventos.push(e);
        this.ultimoEvento = e.n;
      }
    }
    if (this.eventos.length > 60) this.eventos.splice(0, this.eventos.length - 60);
    this.desdeFoto = 0;
  }

  /** Entre foto y foto: se acerca suavecito a donde va y sigue moviéndose con su velocidad. */
  avanzar(dt: number) {
    this.desdeFoto += dt;
    const extra = Math.min(this.desdeFoto, 0.12);
    this.L.forEach((p, i) => {
      const m = this.metas[i];
      const tx = m.x + p.vx * extra, ty = Math.max(0, m.y + p.vy * extra);
      const k = Math.min(1, dt * 18);
      p.x += (tx - p.x) * k;
      p.y += (ty - p.y) * k;
    });
    for (const x of this.P) {
      x.x += x.vx * dt;
      x.y += x.vy * dt;
    }
  }

  eventosDesde(n: number) {
    return this.eventos.filter((e) => e.n > n);
  }
}

// ------------------------------------------------------------------------------------------------ La sala
export interface Ganchos {
  codigo?: string;
  elenco(): DefLuchador[];
  escogerLuchador(o: { titulo: string; lado: number; otro?: DefLuchador | null; inicial?: string; azar?: boolean }): Promise<DefLuchador | null>;
  escogerEscenario(): Promise<IdEscenario | null>;
  pantalla(html: string, clase?: string): HTMLElement;
  quitarPantalla(): void;
  carga(si: boolean, texto?: string): void;
  vitrina: { poner(lado: number, d: DefLuchador | null): Promise<void> };
  retratos(d: DefLuchador): Promise<string>;
  nombreDe(d: DefLuchador): string;
  alNeutro(si: boolean): void;
  pelear(cfg: ConfigPelea): Promise<Resultado>;
  verComo(cfg: { defs: [DefLuchador, DefLuchador]; escenario: IdEscenario; nombres: [string, string]; aspectos: [AspectoJugador | undefined, AspectoJugador | undefined]; linea: Linea }): Promise<Resultado>;
  resultado(texto: string, sub: string, botones: [string, string, string?][]): Promise<string>;
  setAtras(f: (() => void) | null): void;
}

const params = new URLSearchParams(location.search);

/** Pantalla de «crear o unirme» y la sala de espera; devuelve cuando se sale de la sala. */
export async function entrarEnLinea(g: Ganchos): Promise<void> {
  let codigo = g.codigo;
  if (!codigo && !params.has('sala')) {
    const r = await elegirCrearOUnirse(g);
    if (r === null) return;
    codigo = r || undefined;
  }
  g.carga(true, codigo ? 'Buscando la sala…' : 'Abriendo la sala…');
  let sala: Sala;
  try {
    const api = await import('../salas/sala');
    if (params.get('salas') === 'local') api.usarSalasLocales(true);
    sala = codigo ? await api.unirseSala(codigo, 'peleas') : await api.crearSala({ juego: 'peleas', max: 2 });
  } catch (e) {
    g.carga(false);
    await g.resultado('No se pudo', e instanceof Error ? e.message : 'No hay conexión.', [['ok', 'Volver']]);
    return;
  }
  g.carga(false);
  try {
    await enSala(g, sala);
  } finally {
    sala.salir();
  }
}

function elegirCrearOUnirse(g: Ganchos): Promise<string | null> {
  return new Promise((ok) => {
    const p = g.pantalla(`<header class="sel-titulo"><button class="boton chico" data-volver>‹ Volver</button><h2>Pelea en línea</h2></header>
      <div class="linea"><button class="boton grande" data-crear><b>Crear sala</b><small>Te da un código para compartir</small></button>
      <form class="linea-unirse"><label>¿Tienes un código?<input maxlength="5" autocomplete="off" autocapitalize="characters" placeholder="ABCDE" aria-label="Código de la sala"></label><button class="boton">Unirme</button></form></div>`, 'pantalla-linea');
    const fin = (r: string | null) => {
      g.setAtras(null);
      ok(r);
    };
    g.setAtras(() => fin(null));
    p.querySelector('[data-volver]')!.addEventListener('click', () => fin(null));
    p.querySelector('[data-crear]')!.addEventListener('click', () => fin(''));
    p.querySelector('form')!.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = p.querySelector('input')!.value.trim().toUpperCase();
      if (v.length >= 4) fin(v);
    });
  });
}

async function enSala(g: Ganchos, sala: Sala) {
  for (;;) {
    g.alNeutro(sala.hayAmigos || sala.yo.tipo === 'amigo');
    let mio = g.elenco().find((d) => d.id === (sala.yo.datos?.luchador as string)) ?? g.elenco()[sala.yo.puesto === 0 ? 0 : 1];
    let escenario: IdEscenario = 'plaza';
    sala.ponerDatos({ luchador: mio.id, jugando: false });
    g.quitarPantalla();
    void g.vitrina.poner(0, mio);
    let e!: ReturnType<typeof esperarEnSala>;
    const defDe = (j: JugadorSala) => {
      const lista = g.elenco();
      const id = j.datos?.luchador as string | undefined;
      const d = lista.find((x) => x.id === id) ?? lista[0];
      return d.aspecto === 'jugador' ? retador(j.nombre) : d;
    };
    const esconder = (si: boolean) => e.raiz.classList.toggle('escondida', si);
    e = esperarEnSala({
      sala, titulo: 'El Torneo del Despertar Dorado', tema: 'burbujas', subtitulo: `Uno contra uno · ${ESCENARIOS[escenario].nombre}`,
      detalle: (j) => {
        const d = g.elenco().find((x) => x.id === (j.datos?.luchador as string));
        return !d ? '' : d.aspecto === 'jugador' ? 'Su propio muñeco' : d.nombre;
      },
      extras: [
        { id: 'luchador', texto: '🥊 Mi luchador', alTocar: async () => {
          esconder(true);
          const d = await g.escogerLuchador({ titulo: 'Elige a tu luchador', lado: 0, inicial: mio.id });
          g.quitarPantalla();
          if (d) {
            mio = d;
            sala.ponerDatos({ luchador: d.id });
          }
          esconder(false);
          e.repintar();
        } },
        ...(sala.soyAnfitrion ? [{ id: 'escenario', texto: '🏟️ Escenario', alTocar: async () => {
          esconder(true);
          const s = await g.escogerEscenario();
          g.quitarPantalla();
          if (s) escenario = s;
          const sub = e.raiz.querySelector('.se-sub');
          if (sub) sub.textContent = `Uno contra uno · ${ESCENARIOS[escenario].nombre}`;
          esconder(false);
        } }] : []),
      ],
      alEmpezar: () => ({ semilla: Date.now() % 100000, escenario, jugadores: sala.jugadores.map((j) => ({ id: j.id, luchador: j.datos?.luchador })) }),
      invitacion: (c) => `¡Te reto en El Torneo del Despertar Dorado! Entra con el código ${c}`,
    });
    g.setAtras(() => e.cerrar());
    const r = await e.resultado;
    g.setAtras(null);
    if (r.que !== 'empezar') return;
    const datos = r.datos as { semilla: number; escenario: IdEscenario; jugadores: { id: string; luchador?: string }[] };
    g.alNeutro(sala.hayAmigos || sala.yo.tipo === 'amigo');
    const js = [...sala.jugadores].sort((a, b) => a.puesto - b.puesto).slice(0, 2);
    if (js.length < 2) continue;
    for (const j of js) {
      const l = datos.jugadores.find((x) => x.id === j.id)?.luchador;
      j.datos = { ...(j.datos ?? {}), luchador: l };
    }
    const defs = js.map(defDe) as [DefLuchador, DefLuchador];
    const aspectos = js.map((j, i) => (defs[i].aspecto === 'jugador' ? j.aspecto : undefined)) as [AspectoJugador | undefined, AspectoJugador | undefined];
    const nombres = js.map((j) => j.nombre) as [string, string];
    sala.ponerDatos({ jugando: true, listo: false });
    const otro = js.find((j) => j.id !== sala.yo.id)!;
    const linea = crearLinea(sala, otro);
    const esc = ESCENARIOS[datos.escenario] ? datos.escenario : 'plaza';
    const res = sala.soyAnfitrion
      ? await g.pelear({ defs, escenario: esc, controles: [{ k: 'mando', i: 0 }, { k: 'red' }], linea, nombres, aspectos, semilla: datos.semilla })
      : await g.verComo({ defs, escenario: esc, nombres, aspectos, linea });
    linea.soltar();
    if (res.salir) return;
    const yoGane = (res.ganador === 0 && sala.soyAnfitrion) || (res.ganador === 1 && !sala.soyAnfitrion);
    const q = await g.resultado(res.ganador < 0 ? 'Empate' : yoGane ? '¡Ganaste!' : `Ganó ${otro.nombre}`, 'Vuelvan a la sala para la revancha.', [['sala', 'A la sala'], ['salir', 'Salir', 'gris']]);
    if (q !== 'sala') return;
  }
}

export function crearLinea(sala: Sala, otro: JugadorSala): Linea & { soltar(): void } {
  let ultima = 0;
  let entradaOtro = NADA;
  let fotoT = 0;
  let mandadoN = 0;
  let mandadoT = 0;
  let enviados = 0;
  let espejo: Espejo | null = null;
  let fotoRecibida: Foto | null = null;
  let finFn: (() => void) | null = null;
  let cortado = false;
  const quitar: (() => void)[] = [];
  quitar.push(
    sala.al('pe:e', (d) => {
      entradaOtro = desempacar(Number(d) || 0);
    }),
    sala.al('pe:f', (d) => {
      const f = d as Foto;
      if (fotoRecibida && f.pa < fotoRecibida.pa) return;
      fotoRecibida = f;
      espejo?.recibir(f);
    }),
    sala.alCorte((c, q) => {
      if (q.id === otro.id) cortado = c;
    }),
    sala.alFin(() => finFn?.()),
    sala.alCambiar((js) => {
      if (!js.some((j) => j.id === otro.id)) finFn?.();
    }),
  );
  return {
    entrada: () => entradaOtro,
    mandarFoto(sim) {
      const ahora = performance.now();
      const final = sim.fase === 'fin' && sim.faseT > 100;
      if (!final && ahora - fotoT < 50) return;
      fotoT = ahora;
      // Los eventos van repetidos en varias fotos seguidas (por si se pierde una): el espejo los cuenta una vez
      const f = fotoDe(sim, Math.max(0, ultima - 12));
      ultima = sim.ultimoEvento;
      // El anfitrión deja de simular al cerrar: esta última foto debe llegar incluso si se pierde un paquete.
      sala.mandar('pe:f', f, { rapido: !final });
    },
    mandarEntrada(e) {
      const n = empacar(e);
      const ahora = performance.now();
      if (n === mandadoN && ahora - mandadoT < 100) return;
      mandadoN = n;
      mandadoT = ahora;
      enviados++;
      sala.mandar('pe:e', n, { rapido: true });
    },
    espejo(defs) {
      espejo = new Espejo(defs);
      if (fotoRecibida) espejo.recibir(fotoRecibida);
      return espejo;
    },
    cortado: () => cortado,
    alFin(fn) {
      finFn = fn;
    },
    soltar() {
      for (const q of quitar) q();
      void enviados;
    },
  };
}
